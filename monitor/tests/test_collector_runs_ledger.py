# monitor/tests/test_collector_runs_ledger.py
import os
import gc
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from monitor.app.database import create_tables
from monitor.scripts.collect import run_collection
from monitor.app.collectors.base import NormalizedCandidate, DiscoveryMetrics


class TestCollectorRunsLedger(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.test_dir.name, "test_ledger.db")

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

    def test_01_collector_run_lifecycle_running_to_completed(self):
        """Test collector_runs lifecycle transition: RUNNING -> COMPLETED with full metrics."""
        run_id = "RUN-TEST-001"
        started_at = "2026-09-10T00:00:00Z"
        completed_at = "2026-09-10T00:00:05Z"

        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO collector_runs (
                    id, started_at, status, mode, trigger_type, collector_version, created_at
                ) VALUES (?, ?, 'RUNNING', 'LIVE', 'cron', '2.0.0', ?)
            """, (run_id, started_at, started_at))
            conn.commit()

            # Check RUNNING state
            cursor.execute("SELECT status, mode, trigger_type, collector_version FROM collector_runs WHERE id = ?", (run_id,))
            row = cursor.fetchone()
            self.assertIsNotNone(row)
            self.assertEqual(row[0], "RUNNING")
            self.assertEqual(row[1], "LIVE")
            self.assertEqual(row[2], "cron")
            self.assertEqual(row[3], "2.0.0")

            # Finalize with COMPLETED
            cursor.execute("""
                UPDATE collector_runs
                SET completed_at = ?,
                    status = 'COMPLETED',
                    sources_attempted = 5,
                    sources_successful = 5,
                    sources_failed = 0,
                    items_discovered = 25,
                    items_parsed = 25,
                    items_relevant = 10,
                    items_duplicate = 2,
                    items_accepted = 8,
                    quality_good = 20,
                    quality_partial = 5,
                    quality_low = 0,
                    quality_empty = 0,
                    duration_ms = 5000.0
                WHERE id = ?
            """, (completed_at, run_id))
            conn.commit()

            cursor.execute("SELECT status, completed_at, items_discovered, items_accepted, duration_ms FROM collector_runs WHERE id = ?", (run_id,))
            row = cursor.fetchone()
            self.assertEqual(row[0], "COMPLETED")
            self.assertEqual(row[1], completed_at)
            self.assertEqual(row[2], 25)
            self.assertEqual(row[3], 8)
            self.assertEqual(row[4], 5000.0)
        finally:
            conn.close()

    def test_02_collector_run_partial_and_failed_states(self):
        """Test collector_runs handles PARTIAL and FAILED statuses with error summaries."""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.cursor()
            # Partial run
            cursor.execute("""
                INSERT INTO collector_runs (
                    id, started_at, completed_at, status, mode, trigger_type, collector_version,
                    sources_attempted, sources_successful, sources_failed, error_summary, created_at
                ) VALUES (
                    'RUN-PARTIAL-001', '2026-09-10T01:00:00Z', '2026-09-10T01:00:03Z', 'PARTIAL',
                    'LIVE', 'manual', '2.0.0', 4, 3, 1, 'Source tap_ar timed out', '2026-09-10T01:00:00Z'
                )
            """)
            conn.commit()

            cursor.execute("SELECT status, error_summary FROM collector_runs WHERE id = 'RUN-PARTIAL-001'")
            row = cursor.fetchone()
            self.assertEqual(row[0], "PARTIAL")
            self.assertEqual(row[1], "Source tap_ar timed out")

            # Failed run
            cursor.execute("""
                INSERT INTO collector_runs (
                    id, started_at, completed_at, status, mode, trigger_type, collector_version,
                    sources_attempted, sources_successful, sources_failed, error_summary, created_at
                ) VALUES (
                    'RUN-FAIL-001', '2026-09-10T02:00:00Z', '2026-09-10T02:00:01Z', 'FAILED',
                    'LIVE', 'manual', '2.0.0', 2, 0, 2, 'DNS resolution failed completely', '2026-09-10T02:00:00Z'
                )
            """)
            conn.commit()

            cursor.execute("SELECT status, error_summary FROM collector_runs WHERE id = 'RUN-FAIL-001'")
            row = cursor.fetchone()
            self.assertEqual(row[0], "FAILED")
            self.assertEqual(row[1], "DNS resolution failed completely")
        finally:
            conn.close()

    def test_03_collector_source_runs_telemetry(self):
        """Test collector_source_runs stores per-source telemetry and links to run_id."""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.cursor()
            run_id = "RUN-SRC-001"
            cursor.execute("""
                INSERT INTO collector_runs (
                    id, started_at, status, mode, trigger_type, collector_version, created_at
                ) VALUES (?, '2026-09-10T00:00:00Z', 'RUNNING', 'LIVE', 'cron', '2.0.0', '2026-09-10T00:00:00Z')
            """, (run_id,))

            src_run_id = f"SRUN-{run_id}-tap_fr"
            cursor.execute("""
                INSERT INTO collector_source_runs (
                    id, run_id, source_id, started_at, status
                ) VALUES (?, ?, 'tap_fr', '2026-09-10T00:00:01Z', 'RUNNING')
            """, (src_run_id, run_id))
            conn.commit()

            cursor.execute("SELECT status FROM collector_source_runs WHERE id = ?", (src_run_id,))
            self.assertEqual(cursor.fetchone()[0], "RUNNING")

            cursor.execute("""
                UPDATE collector_source_runs
                SET completed_at = '2026-09-10T00:00:02Z',
                    status = 'PASS',
                    http_status = 200,
                    discovered = 12,
                    parsed = 12,
                    relevant = 5,
                    duplicate = 1,
                    accepted = 4,
                    duration_ms = 1000.0
                WHERE id = ?
            """, (src_run_id,))
            conn.commit()

            cursor.execute("""
                SELECT source_id, status, http_status, discovered, accepted, duration_ms
                FROM collector_source_runs WHERE run_id = ?
            """, (run_id,))
            row = cursor.fetchone()
            self.assertIsNotNone(row)
            self.assertEqual(row[0], "tap_fr")
            self.assertEqual(row[1], "PASS")
            self.assertEqual(row[2], 200)
            self.assertEqual(row[3], 12)
            self.assertEqual(row[4], 4)
            self.assertEqual(row[5], 1000.0)
        finally:
            conn.close()

    def test_04_option_a_dry_run_guarantees_zero_database_writes(self):
        """Test Option A Dry-Run performs ZERO database writes anywhere in SQLite."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            with patch("monitor.scripts.collect.load_sources", create=True) as mock_sources:
                mock_sources.return_value = [
                    {
                        "id": "mock_tap",
                        "name": "TAP Mock",
                        "type": "rss",
                        "tier": "TIER_1",
                        "url": "https://tap.info.tn/feed",
                        "is_active": True
                    }
                ]

                mock_candidate = NormalizedCandidate(
                    headline="Coupure d'eau a Kasserine",
                    summary="La SONEDE a annonce une coupure a Kasserine.",
                    url="https://tap.info.tn/fr/coupure-kasserine",
                    canonical_url="https://tap.info.tn/fr/coupure-kasserine",
                    source_name="TAP Mock",
                    source_domain="tap.info.tn",
                    source_type="news_agency",
                    raw_metadata={"source_tier": "TIER_1"}
                )
                mock_metrics = DiscoveryMetrics(
                    source_id="mock_tap",
                    items_discovered=1,
                    items_parsed=1,
                    duration_ms=100.0
                )

                # 1. Snapshot all tables in database before run
                conn_pre = sqlite3.connect(self.db_path)
                cursor_pre = conn_pre.cursor()
                cursor_pre.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
                tables = [r[0] for r in cursor_pre.fetchall()]
                table_counts_before = {}
                for t in tables:
                    cursor_pre.execute(f"SELECT COUNT(*) FROM {t}")
                    table_counts_before[t] = cursor_pre.fetchone()[0]
                conn_pre.close()

                with patch("monitor.app.collectors.rss.RSSCollector.collect", return_value=([mock_candidate], mock_metrics)):
                    report = run_collection(selected_sources=["tap_fr"], dry_run=True, db_path=self.db_path)

                    self.assertEqual(report["mode"], "DRY_RUN")
                    self.assertEqual(report["status"], "COMPLETED")

                    # 2. Snapshot all tables after dry run and prove exact zero-mutation match
                    conn_post = sqlite3.connect(self.db_path)
                    cursor_post = conn_post.cursor()
                    table_counts_after = {}
                    for t in tables:
                        cursor_post.execute(f"SELECT COUNT(*) FROM {t}")
                        table_counts_after[t] = cursor_post.fetchone()[0]
                    conn_post.close()

                    self.assertEqual(
                        table_counts_before,
                        table_counts_after,
                        f"Database tables were mutated during dry run! Before: {table_counts_before}, After: {table_counts_after}"
                    )
                    self.assertEqual(table_counts_after["collector_runs"], 0)
                    self.assertEqual(table_counts_after["collector_source_runs"], 0)
                    self.assertEqual(table_counts_after["evidence"], 0)
                    self.assertEqual(table_counts_after["discovery_queries"], 0)


if __name__ == "__main__":
    unittest.main()
