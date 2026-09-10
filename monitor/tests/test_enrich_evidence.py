"""
404TN — Geolocation Enrichment Tool Verification Tests (Phase 4.1)
"""

import os
import json
import sqlite3
import tempfile
import unittest

from monitor.app.database import create_tables
from monitor.scripts.enrich_evidence import (
    enrich_evidence,
    compute_file_sha256,
    EnrichmentValidationError,
    REQUIRED_CONFIRM_TOKEN
)


class TestEnrichEvidenceTool(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.temp_db_path = self.temp_db.name
        self.temp_db.close()
        create_tables(self.temp_db_path)

    def tearDown(self):
        if os.path.exists(self.temp_db_path):
            try:
                os.unlink(self.temp_db_path)
            except OSError:
                pass

    def _insert_sample_records(self, conn: sqlite3.Connection):
        conn.execute("""
            INSERT INTO evidence (
                id, issue, headline, summary, location, location_scope, governorate,
                delegation, locality, location_confidence, location_method, latitude,
                longitude, published_at, collected_at, last_checked, source_name,
                source_domain, source_type, source_url, event_date, classification,
                status, ingestion_status, evidence_confidence, content_hash
            ) VALUES
            -- 1. Active Local (Zarzis)
            ('EV-AUTO-01', 'migration', 'Sauvetage de migrants au large de Zarzis', 'Details a Zarzis', 'Tunisia', 'UNRESOLVED', NULL, NULL, NULL, 0.0, 'UNRESOLVED', NULL, NULL, '2026-08-01', '2026-08-01', '2026-08-01', 'FTDES', 'ftdes.net', 'ngo', 'https://ftdes.net/1', '2026-08-01', 'FACT', 'VERIFIED', 'AUTO_ACCEPTED', 0.9, 'hash01'),

            -- 2. Active Governorate (Sousse)
            ('EV-AUTO-02', 'electricity', 'Coupure de courant generale a Sousse', 'Panne STEG', 'Tunisia', 'UNRESOLVED', NULL, NULL, NULL, 0.0, 'UNRESOLVED', NULL, NULL, '2026-08-02', '2026-08-02', '2026-08-02', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/2', '2026-08-02', 'FACT', 'VERIFIED', 'AUTO_ACCEPTED', 0.85, 'hash02'),

            -- 3. Active National (Countrywide dam statistics)
            ('EV-AUTO-03', 'water', 'Bilan national du taux de remplissage des barrages en Tunisie', 'ONAGRI rapport national', 'Tunisia', 'UNRESOLVED', NULL, NULL, NULL, 0.0, 'UNRESOLVED', NULL, NULL, '2026-08-03', '2026-08-03', '2026-08-03', 'ONAGRI', 'onagri.nat.tn', 'official', 'https://onagri.nat.tn/3', '2026-08-03', 'FACT', 'VERIFIED', 'AUTO_ACCEPTED', 0.95, 'hash03'),

            -- 4. Active Multi-Governorate (Sfax and Gabes)
            ('EV-AUTO-04', 'water', 'Coupures d eau simultanees a Sfax et Gabes', 'Impact double', 'Tunisia', 'UNRESOLVED', NULL, NULL, NULL, 0.0, 'UNRESOLVED', NULL, NULL, '2026-08-04', '2026-08-04', '2026-08-04', 'Nawaat', 'nawaat.org', 'independent', 'https://nawaat.org/4', '2026-08-04', 'FACT', 'VERIFIED', 'AUTO_ACCEPTED', 0.8, 'hash04'),

            -- 5. Active Unresolved (No locality signal)
            ('EV-AUTO-05', 'work', 'Debat sur les conditions de travail en milieu industriel', 'Analyse generale', 'Tunisia', 'UNRESOLVED', NULL, NULL, NULL, 0.0, 'UNRESOLVED', NULL, NULL, '2026-08-05', '2026-08-05', '2026-08-05', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/5', '2026-08-05', 'FACT', 'VERIFIED', 'AUTO_ACCEPTED', 0.7, 'hash05'),

            -- 6. REJECTED record (Must NEVER be modified)
            ('EV-AUTO-06', 'water', 'Protestation a Gafsa contre la societe de phosphate', 'Details Gafsa', 'OriginalLoc', 'UNRESOLVED', 'OldGov', 'OldDel', 'OldLoc', 0.5, 'OLD_METHOD', 34.0, 8.0, '2026-08-06', '2026-08-06', '2026-08-06', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/6', '2026-08-06', 'FACT', 'VERIFIED', 'REJECTED', 0.5, 'hash06')
        """)
        conn.commit()

    def test_dry_run_default_leaves_db_strictly_unchanged(self):
        conn = sqlite3.connect(self.temp_db_path)
        self._insert_sample_records(conn)
        conn.close()

        sha_before = compute_file_sha256(self.temp_db_path)

        # Run dry run
        report = enrich_evidence(apply=False, db_path=self.temp_db_path)

        sha_after = compute_file_sha256(self.temp_db_path)

        self.assertEqual(sha_before, sha_after, "Database file SHA256 must remain identical in DRY-RUN mode")
        self.assertEqual(report["mode"], "DRY_RUN")
        self.assertTrue(report["database_unchanged"])
        self.assertEqual(report["counts"]["total_ev_auto_in_db"], 6)
        self.assertEqual(report["counts"]["active_records_scanned"], 5)
        self.assertEqual(report["counts"]["rejected_records_skipped"], 1)
        self.assertEqual(report["counts"]["mutations_applied"], 0)
        self.assertGreater(report["counts"]["mutations_planned"], 0)

    def test_apply_with_wrong_confirm_token_fails_closed(self):
        conn = sqlite3.connect(self.temp_db_path)
        self._insert_sample_records(conn)
        conn.close()

        sha_before = compute_file_sha256(self.temp_db_path)

        with self.assertRaises(EnrichmentValidationError):
            enrich_evidence(apply=True, db_path=self.temp_db_path, confirm_token="WRONG-TOKEN-XYZ")

        sha_after = compute_file_sha256(self.temp_db_path)
        self.assertEqual(sha_before, sha_after, "Database must not be modified when confirm token is invalid")

    def test_rejected_records_are_never_modified(self):
        conn = sqlite3.connect(self.temp_db_path)
        self._insert_sample_records(conn)
        conn.close()

        report = enrich_evidence(apply=True, db_path=self.temp_db_path, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertEqual(report["mode"], "APPLY")
        self.assertEqual(report["counts"]["rejected_records_skipped"], 1)

        conn = sqlite3.connect(self.temp_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-06'")
        row = dict(cursor.fetchone())
        conn.close()

        self.assertEqual(row["location"], "OriginalLoc")
        self.assertEqual(row["governorate"], "OldGov")
        self.assertEqual(row["delegation"], "OldDel")
        self.assertEqual(row["locality"], "OldLoc")
        self.assertEqual(row["latitude"], 34.0)
        self.assertEqual(row["longitude"], 8.0)
        self.assertEqual(row["location_confidence"], 0.5)
        self.assertEqual(row["location_method"], "OLD_METHOD")
        self.assertEqual(row["ingestion_status"], "REJECTED")

    def test_scope_resolutions_and_coordinate_rules(self):
        conn = sqlite3.connect(self.temp_db_path)
        self._insert_sample_records(conn)
        conn.close()

        enrich_evidence(apply=True, db_path=self.temp_db_path, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.temp_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. LOCAL (Zarzis -> Medenine)
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-01'")
        r1 = dict(cursor.fetchone())
        self.assertEqual(r1["location_scope"], "LOCAL")
        self.assertEqual(r1["governorate"], "Médenine")
        self.assertEqual(r1["delegation"], "Zarzis")
        self.assertIsNotNone(r1["latitude"])
        self.assertIsNotNone(r1["longitude"])
        self.assertGreater(r1["location_confidence"], 0.8)

        # 2. GOVERNORATE (Sousse)
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-02'")
        r2 = dict(cursor.fetchone())
        self.assertEqual(r2["location_scope"], "GOVERNORATE")
        self.assertEqual(r2["governorate"], "Sousse")
        self.assertIsNone(r2["delegation"])
        self.assertIsNotNone(r2["latitude"])
        self.assertIsNotNone(r2["longitude"])
        self.assertGreater(r2["location_confidence"], 0.8)

        # 3. NATIONAL (Countrywide statistics -> No coords, No gov)
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-03'")
        r3 = dict(cursor.fetchone())
        self.assertEqual(r3["location_scope"], "NATIONAL")
        self.assertIsNone(r3["governorate"])
        self.assertIsNone(r3["delegation"])
        self.assertIsNone(r3["latitude"])
        self.assertIsNone(r3["longitude"])
        self.assertGreater(r3["location_confidence"], 0.8)

        # 4. MULTI_GOVERNORATE (Sfax & Gabes -> No coords, No single gov)
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-04'")
        r4 = dict(cursor.fetchone())
        self.assertEqual(r4["location_scope"], "MULTI_GOVERNORATE")
        self.assertIsNone(r4["governorate"])
        self.assertIsNone(r4["delegation"])
        self.assertIsNone(r4["latitude"])
        self.assertIsNone(r4["longitude"])

        # 5. UNRESOLVED (No location signal -> No coords, No gov, 0.0 conf)
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-05'")
        r5 = dict(cursor.fetchone())
        self.assertEqual(r5["location_scope"], "UNRESOLVED")
        self.assertIsNone(r5["governorate"])
        self.assertIsNone(r5["delegation"])
        self.assertIsNone(r5["latitude"])
        self.assertIsNone(r5["longitude"])
        self.assertEqual(r5["location_confidence"], 0.0)

        conn.close()

    def test_non_location_columns_strictly_preserved(self):
        conn = sqlite3.connect(self.temp_db_path)
        self._insert_sample_records(conn)
        conn.close()

        conn = sqlite3.connect(self.temp_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, issue, headline, summary, classification, status, published_at, collected_at, source_name, source_domain, source_type, source_url, content_hash FROM evidence ORDER BY id")
        before_rows = [dict(r) for r in cursor.fetchall()]
        conn.close()

        enrich_evidence(apply=True, db_path=self.temp_db_path, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.temp_db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, issue, headline, summary, classification, status, published_at, collected_at, source_name, source_domain, source_type, source_url, content_hash FROM evidence ORDER BY id")
        after_rows = [dict(r) for r in cursor.fetchall()]
        conn.close()

        self.assertEqual(before_rows, after_rows, "All non-location fields must remain strictly identical after enrichment mutation")

    def test_json_log_report_export(self):
        conn = sqlite3.connect(self.temp_db_path)
        self._insert_sample_records(conn)
        conn.close()

        temp_log = tempfile.NamedTemporaryFile(suffix=".json", delete=False)
        temp_log_path = temp_log.name
        temp_log.close()

        try:
            report = enrich_evidence(
                apply=False,
                db_path=self.temp_db_path,
                log_out=temp_log_path
            )

            self.assertTrue(os.path.exists(temp_log_path))
            with open(temp_log_path, "r", encoding="utf-8") as f:
                loaded_log = json.load(f)

            self.assertEqual(loaded_log["mode"], "DRY_RUN")
            self.assertIn("counts", loaded_log)
            self.assertIn("records", loaded_log)
            self.assertEqual(len(loaded_log["records"]), 5)
        finally:
            if os.path.exists(temp_log_path):
                try:
                    os.unlink(temp_log_path)
                except OSError:
                    pass


if __name__ == "__main__":
    unittest.main()
