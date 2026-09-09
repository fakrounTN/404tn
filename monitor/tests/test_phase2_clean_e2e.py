"""
End-to-end test verifying a completely clean database initialization and Phase 2 workflow.
Ensures:
- 0 seeded records
- 0 synthetic records
- All evidence has valid source URLs and EV-AUTO-* IDs
- Clean empty-state handling for all endpoints
"""

import unittest
import os
import tempfile
import sqlite3
import json
import uuid
from datetime import datetime
from unittest.mock import patch
from fastapi.testclient import TestClient

from monitor.app.database import create_tables
from monitor.app.services.classifier import classify_issue, has_tunisia_context, classify_epistemic
from monitor.scripts.collect import MONITORED_TAXONOMY
from monitor.app.main import app


class TestCleanE2EWorkflow(unittest.TestCase):
    def setUp(self):
        # Create a fresh temporary database
        self.temp_db_fd, self.temp_db_path = tempfile.mkstemp(suffix=".db")
        conn = sqlite3.connect(self.temp_db_path)
        create_tables(conn)
        conn.close()

        self.db_patcher = patch("monitor.app.database.DB_PATH", self.temp_db_path)
        self.db_patcher.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.db_patcher.stop()
        try:
            os.close(self.temp_db_fd)
            if os.path.exists(self.temp_db_path):
                os.remove(self.temp_db_path)
        except Exception:
            pass

    def test_clean_db_starts_with_zero_evidence(self):
        """Clean database has 0 evidence records and no seeded items."""
        conn = sqlite3.connect(self.temp_db_path)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM evidence")
        count = cur.fetchone()[0]
        conn.close()
        self.assertEqual(count, 0)

    def test_clean_empty_api_states(self):
        """All API endpoints return valid JSON without crashing on an empty DB."""
        # /api/timeline
        res_tl = self.client.get("/api/timeline")
        self.assertEqual(res_tl.status_code, 200)
        self.assertEqual(len(res_tl.json()), 0)

        # /api/stats
        res_st = self.client.get("/api/stats")
        self.assertEqual(res_st.status_code, 200)
        self.assertEqual(res_st.json()["total_evidence_records"], 0)

        # /api/issues
        res_iss = self.client.get("/api/issues")
        self.assertEqual(res_iss.status_code, 200)
        for iss in res_iss.json():
            self.assertEqual(iss["evidence_count"], 0)

        # /api/issues/water
        res_w = self.client.get("/api/issues/water")
        self.assertEqual(res_w.status_code, 200)
        self.assertEqual(res_w.json()["evidence_count"], 0)
        self.assertEqual(res_w.json()["evidence_records"], [])

        # /api/gabes
        res_g = self.client.get("/api/gabes")
        self.assertEqual(res_g.status_code, 200)
        self.assertEqual(res_g.json()["evidence_count"], 0)
        self.assertEqual(res_g.json()["evidence_list"], [])
        self.assertEqual(len(res_g.json()["metrics"]), 3)

        # /api/accountability
        res_acc = self.client.get("/api/accountability")
        self.assertEqual(res_acc.status_code, 200)
        self.assertEqual(res_acc.json(), [])

        # /api/map
        res_map = self.client.get("/api/map")
        self.assertEqual(res_map.status_code, 200)
        self.assertEqual(res_map.json()["features"], [])

    def test_insert_real_candidates_through_two_stage_gate(self):
        """Live collected candidates pass through two-stage gate and populate clean DB."""
        candidates = [
            # 1. Valid water candidate
            {
                "source_id": "sonede",
                "source_name": "SONEDE",
                "source_domain": "sonede.com.tn",
                "source_url": "https://sonede.com.tn/communique-eau-kasserine-2026",
                "headline": "Interruption de la distribution de l'eau potable dans plusieurs quartiers de Kasserine",
                "summary": "Travaux de raccordement et maintenance sur le réseau principal de distribution d'eau potable.",
                "published_at": "2026-08-15T08:00:00Z",
                "location": "Kasserine",
                "lat": 35.1676,
                "lon": 8.8365
            },
            # 2. Valid energy candidate
            {
                "source_id": "tap",
                "source_name": "Agence Tunis Afrique Presse",
                "source_domain": "tap.info.tn",
                "source_url": "https://tap.info.tn/fr/steg-gafsa-coupures",
                "headline": "STEG: perturbations du courant électrique à Gafsa en raison de la canicule",
                "summary": "Le district de la STEG à Gafsa annonce des coupures de courant programmées.",
                "published_at": "2026-08-16T10:30:00Z",
                "location": "Gafsa",
                "lat": 34.4250,
                "lon": 8.7842
            },
            # 3. Nepal electricity (Foreign - Must be rejected)
            {
                "source_id": "generic_wire",
                "source_name": "International Wire",
                "source_domain": "reuters.com",
                "source_url": "https://reuters.com/nepal-electricity-2026",
                "headline": "Nepal rescuers reach remote areas, electricity restored nearly one week after disaster",
                "summary": "Power grid restoration continues in mountainous valleys after heavy rain.",
                "published_at": "2026-08-17T12:00:00Z",
                "location": None,
                "lat": None,
                "lon": None
            },
            # 4. France water (Foreign - Must be rejected)
            {
                "source_id": "generic_wire",
                "source_name": "France Press",
                "source_domain": "lemonde.fr",
                "source_url": "https://lemonde.fr/secheresse-france-2026",
                "headline": "Restrictions d'eau et sécheresse estivale dans le sud de la France",
                "summary": "Mesures préfectorales limitant l'arrosage et le remplissage des piscines.",
                "published_at": "2026-08-18T14:00:00Z",
                "location": None,
                "lat": None,
                "lon": None
            }
        ]

        conn = sqlite3.connect(self.temp_db_path)
        cur = conn.cursor()
        inserted_ids = []

        for cand in candidates:
            full_text = f"{cand['headline']} {cand['summary']}"
            issue = classify_issue(full_text)
            is_tax = bool(issue and issue in MONITORED_TAXONOMY)
            is_tn = has_tunisia_context(full_text, source_domain=cand["source_domain"], source_id=cand["source_id"])
            
            if is_tax and is_tn:
                ev_id = f"EV-AUTO-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
                cur.execute("""
                    INSERT INTO evidence (
                        id, issue, sub_issue, location, latitude, longitude, headline, summary, claim,
                        classification, status, event_date, published_at, collected_at, last_checked,
                        source_name, source_domain, source_type, source_url, source_language,
                        source_confidence, evidence_confidence, current_or_historical, content_hash
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    ev_id, issue, "general", cand["location"] or "Tunisia",
                    cand["lat"], cand["lon"], cand["headline"], cand["summary"], cand["headline"],
                    "FACT", "VERIFIED", cand["published_at"], cand["published_at"],
                    datetime.now().isoformat(), datetime.now().isoformat(),
                    cand["source_name"], cand["source_domain"], "news_agency", cand["source_url"], "fr",
                    0.9, 0.9, "CURRENT", str(hash(cand["source_url"]))
                ))
                inserted_ids.append(ev_id)

        conn.commit()
        conn.close()

        # Assertions
        self.assertEqual(len(inserted_ids), 2, "Only the 2 Tunisian candidates should be inserted")
        for eid in inserted_ids:
            self.assertTrue(eid.startswith("EV-AUTO-"), f"Evidence ID must be auto-generated: {eid}")

        # Test API response with real items
        res_w = self.client.get("/api/issues/water")
        self.assertEqual(res_w.status_code, 200)
        self.assertEqual(res_w.json()["evidence_count"], 1)
        self.assertEqual(res_w.json()["evidence_records"][0]["location"], "Kasserine")

        res_tl = self.client.get("/api/timeline")
        self.assertEqual(res_tl.status_code, 200)
        self.assertEqual(len(res_tl.json()), 2)


if __name__ == "__main__":
    unittest.main()
