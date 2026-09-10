# monitor/tests/test_stats_endpoint_v2.py
import os
import gc
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

from monitor.app.database import create_tables
from monitor.app.main import app


class TestStatsEndpointV2(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.test_dir.name, "test_stats_v2.db")

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

    def test_01_stats_returns_null_when_no_completed_live_runs(self):
        """When no collector_runs exist, last_collection_run is null."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()
            res = client.get("/api/stats")
            self.assertEqual(res.status_code, 200)
            self.assertIsNone(res.json()["last_collection_run"])

    def test_02_stats_returns_latest_completed_live_run(self):
        """Returns the completed_at timestamp of the most recent COMPLETED LIVE run."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO collector_runs (
                id, started_at, completed_at, status, mode, trigger_type, collector_version,
                sources_attempted, sources_successful, created_at
            ) VALUES
                ('RUN-1', '2026-09-08T10:00:00Z', '2026-09-08T10:00:10Z', 'COMPLETED', 'LIVE', 'cron', '2.0.0', 5, 5, '2026-09-08T10:00:00Z'),
                ('RUN-2', '2026-09-09T10:00:00Z', '2026-09-09T10:00:15Z', 'COMPLETED', 'LIVE', 'cron', '2.0.0', 5, 5, '2026-09-09T10:00:00Z')
        """)
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()
            res = client.get("/api/stats")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["last_collection_run"], "2026-09-09T10:00:15Z")

    def test_03_stats_ignores_partial_failed_and_dry_run_records(self):
        """Ignores PARTIAL, FAILED, and DRY_RUN runs when calculating last_collection_run."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        # Older completed live run
        cursor.execute("""
            INSERT INTO collector_runs (id, started_at, completed_at, status, mode, trigger_type, collector_version, created_at)
            VALUES ('RUN-VALID', '2026-09-08T10:00:00Z', '2026-09-08T10:00:10Z', 'COMPLETED', 'LIVE', 'cron', '2.0.0', '2026-09-08T10:00:00Z')
        """)
        # Newer partial run
        cursor.execute("""
            INSERT INTO collector_runs (id, started_at, completed_at, status, mode, trigger_type, collector_version, created_at)
            VALUES ('RUN-PARTIAL', '2026-09-09T12:00:00Z', '2026-09-09T12:00:10Z', 'PARTIAL', 'LIVE', 'cron', '2.0.0', '2026-09-09T12:00:00Z')
        """)
        # Newer failed run
        cursor.execute("""
            INSERT INTO collector_runs (id, started_at, completed_at, status, mode, trigger_type, collector_version, created_at)
            VALUES ('RUN-FAIL', '2026-09-09T13:00:00Z', '2026-09-09T13:00:10Z', 'FAILED', 'LIVE', 'cron', '2.0.0', '2026-09-09T13:00:00Z')
        """)
        # Newer dry-run
        cursor.execute("""
            INSERT INTO collector_runs (id, started_at, completed_at, status, mode, trigger_type, collector_version, created_at)
            VALUES ('RUN-DRY', '2026-09-09T14:00:00Z', '2026-09-09T14:00:10Z', 'COMPLETED', 'DRY_RUN', 'manual', '2.0.0', '2026-09-09T14:00:00Z')
        """)
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()
            res = client.get("/api/stats")
            self.assertEqual(res.status_code, 200)
            # Must return RUN-VALID timestamp, not the newer partial/failed/dry-run timestamps
            self.assertEqual(res.json()["last_collection_run"], "2026-09-08T10:00:10Z")

    def test_04_advances_on_zero_evidence_or_duplicate_only_completed_run(self):
        """A completed live run that discovered 0 new items still advances last_collection_run."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO collector_runs (
                id, started_at, completed_at, status, mode, trigger_type, collector_version,
                sources_attempted, sources_successful, items_discovered, items_accepted, created_at
            ) VALUES (
                'RUN-EMPTY', '2026-09-10T08:00:00Z', '2026-09-10T08:00:05Z', 'COMPLETED', 'LIVE', 'cron', '2.0.0',
                5, 5, 0, 0, '2026-09-10T08:00:00Z'
            )
        """)
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()
            res = client.get("/api/stats")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["last_collection_run"], "2026-09-10T08:00:05Z")

    def test_05_stats_ignores_stale_and_current_running_runs(self):
        """Stats ignores all RUNNING runs (both current and stale) because only COMPLETED LIVE runs count."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO collector_runs (id, started_at, status, mode, trigger_type, collector_version, created_at)
            VALUES
                ('RUN-STALE', '2026-09-08T00:00:00Z', 'RUNNING', 'LIVE', 'cron', '2.0.0', '2026-09-08T00:00:00Z'),
                ('RUN-ACTIVE', '2026-09-10T02:00:00Z', 'RUNNING', 'LIVE', 'cron', '2.0.0', '2026-09-10T02:00:00Z')
        """)
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()
            res = client.get("/api/stats")
            self.assertEqual(res.status_code, 200)
            self.assertIsNone(res.json()["last_collection_run"])

    def test_06_reconcile_stale_collector_runs(self):
        """Stale RUNNING runs (>1800s) are safely transitioned to FAILED, never COMPLETED."""
        from monitor.scripts.collect import reconcile_stale_collector_runs
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        # Stale run (1 day ago)
        cursor.execute("""
            INSERT INTO collector_runs (id, started_at, status, mode, trigger_type, collector_version, created_at)
            VALUES ('RUN-ORPHAN', '2026-09-08T00:00:00Z', 'RUNNING', 'LIVE', 'cron', '2.0.0', '2026-09-08T00:00:00Z')
        """)
        # Recent active run (started right now)
        from datetime import datetime, timezone
        now_iso = datetime.now(timezone.utc).isoformat()
        cursor.execute("""
            INSERT INTO collector_runs (id, started_at, status, mode, trigger_type, collector_version, created_at)
            VALUES ('RUN-ACTIVE', ?, 'RUNNING', 'LIVE', 'cron', '2.0.0', ?)
        """, (now_iso, now_iso))
        conn.commit()

        # Run reconciliation
        reconciled = reconcile_stale_collector_runs(conn, stale_threshold_sec=1800)
        self.assertEqual(reconciled, 1)

        # Stale run became FAILED with explicit error summary
        cursor.execute("SELECT status, error_summary FROM collector_runs WHERE id = 'RUN-ORPHAN'")
        orphan_row = cursor.fetchone()
        self.assertEqual(orphan_row[0], "FAILED")
        self.assertEqual(orphan_row[1], "INTERRUPTED_OR_STALE_RUN")

        # Active run remains RUNNING
        cursor.execute("SELECT status FROM collector_runs WHERE id = 'RUN-ACTIVE'")
        active_row = cursor.fetchone()
        self.assertEqual(active_row[0], "RUNNING")

        conn.close()


if __name__ == "__main__":
    unittest.main()
