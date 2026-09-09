# monitor/tests/test_stats_last_collection_run.py
import os
import gc
import sqlite3
import tempfile
import unittest
import time
from unittest.mock import patch
from fastapi.testclient import TestClient

from monitor.app.database import create_tables
from monitor.app.main import app
from monitor.app.schemas import PublicStatsSchema


class TestStatsLastCollectionRun(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.test_dir.name, "test_stats.db")

        conn = sqlite3.connect(self.db_path)
        try:
            create_tables(conn)
        finally:
            conn.close()

    def tearDown(self):
        gc.collect()
        try:
            self.test_dir.cleanup()
        except Exception:
            pass

    def get_client(self):
        return TestClient(app)

    def test_01_stats_returns_null_when_no_run_tracking_exists(self):
        """1. /api/stats returns last_collection_run = None when no run tracking metadata exists."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()
            res = client.get("/api/stats")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIsNone(data["last_collection_run"])
            self.assertEqual(data["system_status"], "OPERATIONAL")

    def test_02_repeated_stats_calls_consistently_return_null_no_datetime_now(self):
        """2. Repeated /api/stats calls return exact same None without using datetime.now()."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()
            res1 = client.get("/api/stats")
            time.sleep(0.05)
            res2 = client.get("/api/stats")
            time.sleep(0.05)
            res3 = client.get("/api/stats")

            self.assertIsNone(res1.json()["last_collection_run"])
            self.assertIsNone(res2.json()["last_collection_run"])
            self.assertIsNone(res3.json()["last_collection_run"])

    def test_03_source_health_records_do_not_fabricate_run_level_timestamp(self):
        """3. source_health records (per-source attempts) are NOT used to fabricate a run completion timestamp."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS source_health (
                source_id TEXT PRIMARY KEY,
                last_attempt TEXT NOT NULL,
                last_success TEXT,
                last_failure TEXT,
                last_http_status INTEGER,
                last_items_discovered INTEGER DEFAULT 0,
                last_items_parsed INTEGER DEFAULT 0,
                last_relevant_count INTEGER DEFAULT 0,
                consecutive_failures INTEGER DEFAULT 0,
                last_error TEXT,
                average_duration_ms REAL DEFAULT 0,
                health_status TEXT DEFAULT 'HEALTHY'
            )
        """)
        ts = "2026-09-08T12:00:00+00:00"
        cursor.execute("""
            INSERT INTO source_health (source_id, last_attempt, last_success, last_http_status)
            VALUES ('tap_fr', ?, ?, 200)
        """, (ts, ts))
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()
            res = client.get("/api/stats")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            # Must remain None because per-source attempts do not prove run completion
            self.assertIsNone(data["last_collection_run"])

    def test_04_evidence_collected_at_does_not_fabricate_run_level_timestamp(self):
        """4. evidence.collected_at timestamps are NOT used to fabricate a run completion timestamp."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        ev_ts = "2026-09-07T11:22:33Z"
        cursor.execute("""
            INSERT INTO evidence (
                id, issue, headline, summary, source_name, source_domain, source_type, source_url,
                classification, status, published_at, collected_at, last_checked, ingestion_status
            ) VALUES ('EV-AUTO-20260907-001', 'water', 'Coupure d eau', 'Details', 'TAP', 'tap.info.tn', 'news_agency',
                      'https://tap.info.tn/1', 'FACT', 'VERIFIED', '2026-09-07T10:00:00Z', ?, '2026-09-07T11:22:33Z', 'AUTO_ACCEPTED')
        """, (ev_ts,))
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()
            res = client.get("/api/stats")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            # Evidence count is updated but last_collection_run remains None
            self.assertEqual(data["total_evidence_records"], 1)
            self.assertEqual(data["verified_facts_count"], 1)
            self.assertIsNone(data["last_collection_run"])

    def test_05_health_endpoint_calls_do_not_affect_stats(self):
        """5. Health endpoint calls do not affect or generate last_collection_run."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()
            h1 = client.get("/api/health")
            self.assertEqual(h1.status_code, 200)
            h2 = client.get("/api/health")
            self.assertEqual(h2.status_code, 200)

            res = client.get("/api/stats")
            self.assertEqual(res.status_code, 200)
            self.assertIsNone(res.json()["last_collection_run"])

    def test_06_public_stats_schema_validation(self):
        """6. PublicStatsSchema accepts None for last_collection_run."""
        schema_none = PublicStatsSchema(
            total_evidence_records=44,
            monitored_sources_count=18,
            active_sources_count=14,
            verified_facts_count=5,
            documented_claims_count=2,
            last_collection_run=None,
            system_status="OPERATIONAL"
        )
        self.assertIsNone(schema_none.last_collection_run)
        dump = schema_none.model_dump()
        self.assertIsNone(dump["last_collection_run"])

        schema_with_val = PublicStatsSchema(
            total_evidence_records=44,
            monitored_sources_count=18,
            active_sources_count=14,
            verified_facts_count=5,
            documented_claims_count=2,
            last_collection_run="2026-09-08T12:00:00+00:00",
            system_status="OPERATIONAL"
        )
        self.assertEqual(schema_with_val.last_collection_run, "2026-09-08T12:00:00+00:00")


if __name__ == "__main__":
    unittest.main()
