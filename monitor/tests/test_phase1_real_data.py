# monitor/tests/test_phase1_real_data.py
import unittest
import os
import tempfile
import sqlite3
from unittest.mock import patch
from fastapi.testclient import TestClient

from monitor.app.database import create_tables, DB_PATH
from monitor.app.main import app
from monitor.app.services.classifier import classify_issue
from monitor.app.services.locations import extract_location
from monitor.scripts.enrich_evidence import enrich_evidence

class TestPhase1RealDataArchitecture(unittest.TestCase):
    """
    Test suite verifying all 18 Phase 1 Real-Data Architecture & Provenance criteria.
    """

    def setUp(self):
        # Create an isolated temporary database for each test
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

    # -------------------------------------------------------------------------
    # Criteria 1: Collector rejects unrelated candidate
    # -------------------------------------------------------------------------
    def test_01_collector_rejects_unrelated_candidate(self):
        unrelated_text = "Real Madrid wins European championship match against Bayern Munich with 2-1 score"
        issue = classify_issue(unrelated_text)
        self.assertIsNone(issue, "Unrelated sports news should yield None for issue category")

    # -------------------------------------------------------------------------
    # Criteria 2: Relevant Tunisia candidate is retained
    # -------------------------------------------------------------------------
    def test_02_relevant_tunisia_candidate_is_retained(self):
        relevant_text = "SONEDE announces emergency potable water distribution cuts across Sfax governorate due to low dam levels"
        issue = classify_issue(relevant_text)
        self.assertEqual(issue, "water", "Relevant water crisis article should classify as 'water'")

    # -------------------------------------------------------------------------
    # Criteria 3: Gabès and Gabes resolve to correct registry location
    # -------------------------------------------------------------------------
    def test_03_gabes_and_variants_resolve_correctly(self):
        cases = [
            "Protests in Gabès over chemical plant emissions",
            "Scientific study of marine sediment in Gabes Gulf",
            "وقفة احتجاجية في قابس للتنديد بالتلوث البحري"
        ]
        for text in cases:
            loc, lat, lon = extract_location(text)
            self.assertEqual(loc, "Gabès", f"Failed to resolve Gabès for text: {text}")
            self.assertAlmostEqual(lat, 33.8815, places=3)
            self.assertAlmostEqual(lon, 10.0982, places=3)

    # -------------------------------------------------------------------------
    # Criteria 4: Unknown location receives NULL coordinates
    # -------------------------------------------------------------------------
    def test_04_unknown_location_receives_null_coordinates(self):
        text = "General discussion on administrative modernization and digital platforms in public sector"
        loc, lat, lon = extract_location(text)
        self.assertIsNone(lat, "Unknown location must receive NULL latitude")
        self.assertIsNone(lon, "Unknown location must receive NULL longitude")

    # -------------------------------------------------------------------------
    # Criteria 5: National Tunisia article is NOT automatically assigned to Tunis
    # -------------------------------------------------------------------------
    def test_05_national_article_not_assigned_to_tunis(self):
        text = "TUNIS (TAP) - National dam reservoir volume across Tunisia stands at 21.4% capacity"
        loc, lat, lon = extract_location(text)
        self.assertNotEqual(loc, "Tunis", "Generic national news with TAP bureau dateline must not be assigned to Tunis")
        self.assertIsNone(lat, "National article should have NULL latitude")
        self.assertIsNone(lon, "National article should have NULL longitude")

    # -------------------------------------------------------------------------
    # Criteria 6: Enrichment defaults to dry-run
    # -------------------------------------------------------------------------
    def test_06_enrichment_defaults_to_dry_run(self):
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (id, issue, location, latitude, longitude, headline, summary, published_at, collected_at, last_checked, source_name, source_domain, source_type, source_url, classification, status)
            VALUES ('EV-AUTO-TEST-01', 'pollution', 'Tunisia', NULL, NULL, 'Severe chemical pollution in Gabès', 'Sludge discharge in Chatt Essalam', '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/art1', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        metrics = enrich_evidence(apply=False, db_path=self.temp_db_path)
        self.assertEqual(metrics["records_scanned"], 1)
        self.assertEqual(metrics["matched_locations"], 1)

        conn = sqlite3.connect(self.temp_db_path)
        row = conn.execute("SELECT latitude, longitude FROM evidence WHERE id = 'EV-AUTO-TEST-01'").fetchone()
        conn.close()
        self.assertIsNone(row[0], "Dry run must NOT persist coordinates to database")
        self.assertIsNone(row[1], "Dry run must NOT persist coordinates to database")

    # -------------------------------------------------------------------------
    # Criteria 7: Enrichment touches only EV-AUTO-* records
    # -------------------------------------------------------------------------
    def test_07_enrichment_touches_only_ev_auto_records(self):
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (id, issue, location, latitude, longitude, headline, summary, published_at, collected_at, last_checked, source_name, source_domain, source_type, source_url, classification, status)
            VALUES 
            ('EV-SEEDED-01', 'pollution', 'Tunisia', 99.0, 99.0, 'Seeded test in Sfax', 'Summary text', '2026-08-01', '2026-08-01', '2026-08-01', 'Source', 'src.tn', 'official', 'https://src.tn/1', 'FACT', 'VERIFIED'),
            ('EV-AUTO-TEST-02', 'pollution', 'Tunisia', NULL, NULL, 'New event in Sfax maritime port', 'National guard operations', '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/2', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        enrich_evidence(apply=True, db_path=self.temp_db_path)

        conn = sqlite3.connect(self.temp_db_path)
        seeded_row = conn.execute("SELECT latitude, longitude FROM evidence WHERE id = 'EV-SEEDED-01'").fetchone()
        auto_row = conn.execute("SELECT latitude, longitude, location FROM evidence WHERE id = 'EV-AUTO-TEST-02'").fetchone()
        conn.close()

        self.assertEqual(seeded_row[0], 99.0, "Seeded record coordinates must not be modified")
        self.assertAlmostEqual(auto_row[0], 34.7406, places=3, msg="EV-AUTO-* record must receive Sfax latitude")
        self.assertEqual(auto_row[2], "Sfax")

    # -------------------------------------------------------------------------
    # Criteria 8: Enrichment is idempotent
    # -------------------------------------------------------------------------
    def test_08_enrichment_is_idempotent(self):
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (id, issue, location, latitude, longitude, headline, summary, published_at, collected_at, last_checked, source_name, source_domain, source_type, source_url, classification, status)
            VALUES ('EV-AUTO-TEST-03', 'work', 'Tunisia', NULL, NULL, 'Phosphate production in Gafsa basin', 'CPG extraction report', '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/3', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        m1 = enrich_evidence(apply=True, db_path=self.temp_db_path)
        self.assertEqual(m1["coordinates_added"], 1)

        m2 = enrich_evidence(apply=True, db_path=self.temp_db_path)
        self.assertEqual(m2["coordinates_added"], 0, "Second enrichment run must be idempotent and perform 0 updates")

    # -------------------------------------------------------------------------
    # Criteria 9: Timeline contains only EV-AUTO-* evidence
    # -------------------------------------------------------------------------
    def test_09_timeline_contains_only_ev_auto_evidence(self):
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (id, issue, headline, summary, published_at, collected_at, last_checked, source_name, source_domain, source_type, source_url, event_date, classification, status)
            VALUES 
            ('EV-SEEDED-99', 'water', 'Seeded Water Event', 'Summary', '2026-08-01', '2026-08-01', '2026-08-01', 'SeedSource', 'seed.tn', 'official', 'https://seed.tn', '2026-08-01', 'FACT', 'VERIFIED'),
            ('EV-AUTO-20260909-01', 'water', 'Auto Collected Dam Report', 'Real Summary', '2026-08-15', '2026-08-15', '2026-08-15', 'ONAGRI', 'onagri.tn', 'state_agency', 'https://onagri.tn/dam', '2026-08-15', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            client = TestClient(app)
            res = client.get("/api/timeline")
            self.assertEqual(res.status_code, 200)
            events = res.json()
            self.assertEqual(len(events), 1)
            self.assertEqual(events[0]["id"], "EV-AUTO-20260909-01")
            self.assertTrue(events[0]["id"].startswith("EV-AUTO-"))

    # -------------------------------------------------------------------------
    # Criteria 10: Every timeline result has real source_url
    # -------------------------------------------------------------------------
    def test_10_every_timeline_result_has_real_source_url(self):
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (id, issue, headline, summary, published_at, collected_at, last_checked, source_name, source_domain, source_type, source_url, event_date, classification, status)
            VALUES ('EV-AUTO-20260909-02', 'migration', 'Maritime interception off Zarzis', 'Summary', '2026-08-20', '2026-08-20', '2026-08-20', 'FTDES', 'ftdes.net', 'ngo', 'https://ftdes.net/report-09', '2026-08-20', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            client = TestClient(app)
            res = client.get("/api/timeline")
            events = res.json()
            for ev in events:
                self.assertTrue(ev["source_url"].startswith("http"), f"Invalid source_url: {ev['source_url']}")
                self.assertIsNotNone(ev["source"])

    # -------------------------------------------------------------------------
    # Criteria 11: Map contains only EV-AUTO-* evidence
    # -------------------------------------------------------------------------
    def test_11_map_contains_only_ev_auto_evidence(self):
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (id, issue, headline, summary, location, location_scope, governorate, latitude, longitude, published_at, collected_at, last_checked, source_name, source_domain, source_type, source_url, event_date, classification, status)
            VALUES 
            ('EV-SEEDED-MAP', 'pollution', 'Seeded Map Point', 'Summary', 'Gabès', 'LOCAL', 'Gabès', 33.88, 10.09, '2026-08-01', '2026-08-01', '2026-08-01', 'Seed', 'seed.tn', 'official', 'https://seed.tn', '2026-08-01', 'FACT', 'VERIFIED'),
            ('EV-AUTO-MAP-01', 'pollution', 'Real Gabès Study', 'Summary', 'Gabès', 'LOCAL', 'Gabès', 33.8815, 10.0982, '2026-08-02', '2026-08-02', '2026-08-02', 'PubMed', 'nih.gov', 'scientific', 'https://pubmed.ncbi.nlm.nih.gov/12345', '2026-08-02', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            client = TestClient(app)
            res = client.get("/api/map")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            features = data["features"]
            self.assertEqual(len(features), 1)
            self.assertEqual(features[0]["id"], "EV-AUTO-MAP-01")

    # -------------------------------------------------------------------------
    # Criteria 12 & 13: Map features have valid coordinates in [lon, lat] order
    # -------------------------------------------------------------------------
    def test_12_13_map_coordinates_format(self):
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (id, issue, headline, summary, location, location_scope, governorate, latitude, longitude, published_at, collected_at, last_checked, source_name, source_domain, source_type, source_url, event_date, classification, status)
            VALUES ('EV-AUTO-MAP-02', 'migration', 'Sfax Migration Incident', 'Summary', 'Sfax', 'LOCAL', 'Sfax', 34.7406, 10.7603, '2026-08-05', '2026-08-05', '2026-08-05', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/sfax', '2026-08-05', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            client = TestClient(app)
            res = client.get("/api/map")
            feat = res.json()["features"][0]
            coords = feat["geometry"]["coordinates"]
            self.assertAlmostEqual(coords[0], 10.7603, places=3, msg="First coordinate must be longitude")
            self.assertAlmostEqual(coords[1], 34.7406, places=3, msg="Second coordinate must be latitude")

    # -------------------------------------------------------------------------
    # Criteria 14: Zero real map records produces zero evidence markers
    # -------------------------------------------------------------------------
    def test_14_zero_real_map_records_produces_zero_markers(self):
        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            client = TestClient(app)
            res = client.get("/api/map")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(len(data["features"]), 0, "Empty database must return 0 GeoJSON features")

    # -------------------------------------------------------------------------
    # Criteria 15: Offline / Empty state does not display fallback evidence markers
    # -------------------------------------------------------------------------
    def test_15_api_offline_fallback_contract(self):
        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            client = TestClient(app)
            res = client.get("/api/map")
            self.assertEqual(res.json()["features"], [])

    # -------------------------------------------------------------------------
    # Criteria 16: Accountability does not auto-generate political conclusions
    # -------------------------------------------------------------------------
    def test_16_accountability_does_not_auto_generate_conclusions(self):
        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            client = TestClient(app)
            res = client.get("/api/accountability")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json(), [], "Accountability endpoint must return empty list when unseeded")

    # -------------------------------------------------------------------------
    # Criteria 17: Evidence drawer opens real EV-AUTO-* IDs
    # -------------------------------------------------------------------------
    def test_17_evidence_drawer_contract_with_real_id(self):
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (id, issue, headline, summary, published_at, collected_at, last_checked, source_name, source_domain, source_type, source_url, classification, status)
            VALUES ('EV-AUTO-20260909-99', 'work', 'Graduate Employment Audit', 'Summary of INS survey', '2026-08-01', '2026-08-01', '2026-08-01', 'INS', 'ins.tn', 'state_agency', 'https://ins.tn/survey', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            client = TestClient(app)
            res = client.get("/api/evidence/EV-AUTO-20260909-99")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["headline"], "Graduate Employment Audit")
            self.assertEqual(data["source_url"], "https://ins.tn/survey")

    # -------------------------------------------------------------------------
    # Criteria 18: seed_evidence.py is not invoked by production startup/collector
    # -------------------------------------------------------------------------
    def test_18_seed_evidence_not_invoked_in_production(self):
        with patch("monitor.scripts.seed_evidence.seed") as mock_seed:
            with patch("monitor.app.database.DB_PATH", self.temp_db_path):
                client = TestClient(app)
                client.get("/api/health")
                mock_seed.assert_not_called()

if __name__ == "__main__":
    unittest.main()
