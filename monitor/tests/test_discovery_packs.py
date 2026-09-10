# monitor/tests/test_discovery_packs.py
import unittest
import tempfile
import os
import sqlite3

from monitor.app.database import create_tables
from monitor.app.services.discovery import (
    load_discovery_packs_config, generate_all_discovery_queries,
    sync_discovery_queries_to_db, select_queries_for_run,
    build_google_news_rss_url, record_query_execution_metrics
)

class TestDiscoveryPacks(unittest.TestCase):

    def setUp(self):
        self.temp_db_fd, self.temp_db_path = tempfile.mkstemp(suffix=".db")
        create_tables(self.temp_db_path)

    def tearDown(self):
        try:
            os.close(self.temp_db_fd)
            if os.path.exists(self.temp_db_path):
                os.remove(self.temp_db_path)
        except Exception:
            pass

    def test_load_discovery_packs_config(self):
        cfg = load_discovery_packs_config()
        self.assertIn("packs", cfg)
        self.assertIn("water", cfg["packs"])
        self.assertIn("electricity", cfg["packs"])
        self.assertIn("geographic_discovery", cfg)

    def test_generate_all_discovery_queries(self):
        queries = generate_all_discovery_queries()
        self.assertTrue(len(queries) > 50)
        
        # Check core multilingual queries exist
        water_ar = [q for q in queries if q.issue == "water" and q.language == "ar" and q.query_type == "CORE_TAXONOMY"]
        self.assertTrue(len(water_ar) > 0)
        
        # Check geographic combinations exist
        geo_queries = [q for q in queries if q.query_type == "GEOGRAPHIC_COMBO"]
        self.assertTrue(len(geo_queries) > 0)
        
        # Verify governorate attached
        gafsa_queries = [q for q in geo_queries if q.governorate == "gafsa"]
        self.assertTrue(len(gafsa_queries) > 0)

    def test_sync_and_select_queries_with_budget(self):
        # Sync to test database
        sync_discovery_queries_to_db(self.temp_db_path)
        
        with sqlite3.connect(self.temp_db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM discovery_queries")
            total_synced = cursor.fetchone()[0]
            self.assertTrue(total_synced > 50)

        # Select batch with budget ceiling of 20
        selected = select_queries_for_run(max_queries=20, db_path=self.temp_db_path)
        self.assertEqual(len(selected), 20)
        
        # Check priority distribution
        prio1_count = sum(1 for q in selected if q.priority == 1)
        self.assertTrue(prio1_count >= 10)

    def test_build_google_news_rss_url(self):
        url_ar = build_google_news_rss_url("تونس أزمة المياه", language="ar")
        self.assertIn("news.google.com/rss/search", url_ar)
        self.assertIn("hl=ar", url_ar)
        self.assertIn("gl=TN", url_ar)

        url_fr = build_google_news_rss_url("Tunisie coupure eau", language="fr")
        self.assertIn("hl=fr", url_fr)
        self.assertIn("gl=TN", url_fr)

    def test_record_query_execution_metrics(self):
        sync_discovery_queries_to_db(self.temp_db_path)
        queries = select_queries_for_run(max_queries=1, db_path=self.temp_db_path)
        self.assertEqual(len(queries), 1)
        q = queries[0]

        record_query_execution_metrics(
            query_id=q.id,
            discovered_count=12,
            accepted_count=4,
            status_code=200,
            db_path=self.temp_db_path
        )

        with sqlite3.connect(self.temp_db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM discovery_queries WHERE id = ?", (q.id,))
            row = cursor.fetchone()
            self.assertIsNotNone(row["last_executed_at"])
            self.assertEqual(row["execution_count"], 1)
            self.assertEqual(row["yield_discovered_count"], 12)
            self.assertEqual(row["yield_accepted_count"], 4)
            self.assertEqual(row["last_status"], 200)

if __name__ == "__main__":
    unittest.main()
