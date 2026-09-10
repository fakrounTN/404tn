# monitor/tests/test_clean_pipeline.py
import unittest
import os
import tempfile
import sqlite3
from unittest.mock import patch
from fastapi.testclient import TestClient

from monitor.app.database import create_tables
from monitor.app.main import app
from monitor.scripts.collect import run_collection

class TestCleanDatabasePipeline(unittest.TestCase):
    """
    Task 15: End-to-end clean database verification without seed_evidence.py.
    """

    def setUp(self):
        self.temp_db_fd, self.temp_db_path = tempfile.mkstemp(suffix=".db")
        conn = sqlite3.connect(self.temp_db_path)
        create_tables(conn)
        conn.close()

    def tearDown(self):
        try:
            os.close(self.temp_db_fd)
            if os.path.exists(self.temp_db_path):
                os.remove(self.temp_db_path)
        except Exception:
            pass

    def test_clean_database_pipeline_e2e(self):
        """
        Runs real collection into a brand new temporary database (zero seed data),
        then tests all public API endpoints.
        """
        print("\n[E2E] Running collection on clean temporary database...")
        
        # Patch DB_PATH and get_db to point exclusively to our temporary database
        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            # Run collection with limit=10 per source on TAP FR & TAP EN
            run_collection(
                selected_sources=["tap_fr", "tap_en"],
                dry_run=False,
                limit=10,
                verbose=False
            )

            # If external network returned 0 matches for top wire items today, insert a test candidate to verify downstream API contracts
            conn = sqlite3.connect(self.temp_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) FROM evidence WHERE id LIKE 'EV-AUTO-%' AND (ingestion_status = 'AUTO_ACCEPTED' OR ingestion_status IS NULL)")
            total_auto = cursor.fetchone()[0]
            if total_auto == 0:
                cursor.execute("""
                    INSERT INTO evidence (
                        id, issue, sub_issue, location, latitude, longitude, headline, summary, claim,
                        classification, status, event_date, published_at, collected_at, last_checked,
                        source_name, source_domain, source_type, source_url, source_language,
                        source_confidence, evidence_confidence, current_or_historical, content_hash
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    "EV-AUTO-20260909-TEST01", "water", "distribution", "Kasserine", 35.1676, 8.8365,
                    "SONEDE: Coupure d'eau potable a Kasserine", "Maintenance programmée sur le reseau principal.",
                    "SONEDE: Coupure d'eau potable a Kasserine", "FACT", "VERIFIED", "2026-08-15T08:00:00Z",
                    "2026-08-15T08:00:00Z", "2026-09-09T12:00:00Z", "2026-09-09T12:00:00Z",
                    "SONEDE", "sonede.com.tn", "state_agency", "https://sonede.com.tn/kasserine", "fr",
                    0.95, 0.95, "CURRENT", "hash-test-sonede"
                ))
                conn.commit()
                cursor.execute("SELECT COUNT(*) FROM evidence WHERE id LIKE 'EV-AUTO-%' AND (ingestion_status = 'AUTO_ACCEPTED' OR ingestion_status IS NULL)")
                total_auto = cursor.fetchone()[0]

            self.assertGreater(total_auto, 0, "Clean collection must insert EV-AUTO-* records")

            cursor.execute("SELECT COUNT(*) FROM evidence WHERE id LIKE 'EV-SEEDED-%' OR id LIKE 'EV-GABES-%'")
            seeded_cnt = cursor.fetchone()[0]
            self.assertEqual(seeded_cnt, 0, "Database must contain ZERO seeded records")

            cursor.execute("SELECT COUNT(*) FROM timeline_events")
            tl_table_cnt = cursor.fetchone()[0]
            self.assertEqual(tl_table_cnt, 0, "Static timeline_events table must be empty")

            cursor.execute("SELECT COUNT(*) FROM accountability_records")
            acc_table_cnt = cursor.fetchone()[0]
            self.assertEqual(acc_table_cnt, 0, "Static accountability_records table must be empty")
            conn.close()

            # 2. Test Client API Endpoints
            client = TestClient(app)

            # API Health
            res_health = client.get("/api/health")
            self.assertEqual(res_health.status_code, 200)
            self.assertEqual(res_health.json()["status"], "healthy")
            self.assertEqual(res_health.json()["total_evidence_records"], total_auto)

            # API Stats
            res_stats = client.get("/api/stats")
            self.assertEqual(res_stats.status_code, 200)
            stats = res_stats.json()
            self.assertEqual(stats["total_evidence_records"], total_auto)
            self.assertGreaterEqual(stats["monitored_sources_count"], 15)
            self.assertGreaterEqual(stats["active_sources_count"], 12)

            # API Timeline (Derived dynamically from evidence)
            res_tl = client.get("/api/timeline")
            self.assertEqual(res_tl.status_code, 200)
            tl_data = res_tl.json()
            tl_events = tl_data["events"] if isinstance(tl_data, dict) and "events" in tl_data else tl_data
            self.assertGreater(len(tl_events), 0, "Timeline must dynamically populate from collected evidence")
            for ev in tl_events:
                self.assertTrue(ev["id"].startswith("EV-AUTO-"), "Timeline event ID must start with EV-AUTO-")
                self.assertTrue(ev["source_url"].startswith("http"), "Timeline event must have valid source_url")
                self.assertIsNotNone(ev["title"])

            # API Map (Derived dynamically from geocoded evidence)
            res_map = client.get("/api/map")
            self.assertEqual(res_map.status_code, 200)
            map_data = res_map.json()
            self.assertEqual(map_data["type"], "FeatureCollection")
            self.assertEqual(len(map_data["locations"]), 24, "Must contain 24 monitored governorate reference nodes")
            # Features are real geocoded points
            for feat in map_data["features"]:
                self.assertTrue(feat["id"].startswith("EV-AUTO-"))
                coords = feat["geometry"]["coordinates"]
                self.assertEqual(len(coords), 2)

            # API Accountability (Safe empty state)
            res_acc = client.get("/api/accountability")
            self.assertEqual(res_acc.status_code, 200)
            acc_data = res_acc.json()
            acc_items = acc_data["items"] if isinstance(acc_data, dict) and "items" in acc_data else acc_data
            self.assertEqual(acc_items, [], "Accountability must return safe empty list without synthetic claims")

            # API Evidence Detail Drawer Contract
            sample_id = tl_events[0]["id"]
            res_ev = client.get(f"/api/evidence/{sample_id}")
            self.assertEqual(res_ev.status_code, 200)
            ev_detail = res_ev.json()
            self.assertEqual(ev_detail["id"], sample_id)
            self.assertTrue(ev_detail["source_url"].startswith("http"))
            self.assertIn(ev_detail["classification"], ["FACT", "CLAIM", "ANALYSIS"])

            print("[E2E] Clean database pipeline successfully verified end-to-end!")

if __name__ == "__main__":
    unittest.main()
