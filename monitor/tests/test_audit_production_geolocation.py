"""
404TN — Production Geolocation Audit Tool Verification Tests (Phase 4.1)
"""

import os
import json
import sqlite3
import tempfile
import unittest

from monitor.app.database import create_tables
from monitor.scripts.audit_production_geolocation import (
    audit_production_geolocation,
    compute_file_sha256
)


class TestAuditProductionGeolocationTool(unittest.TestCase):
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
            -- 1. Active Local (Zarzis in Médenine)
            ('EV-AUTO-01', 'migration', 'Sauvetage de migrants au large de Zarzis', 'Details a Zarzis', 'Tunisia', 'UNRESOLVED', NULL, NULL, NULL, 0.0, 'UNRESOLVED', NULL, NULL, '2026-08-01', '2026-08-01', '2026-08-01', 'FTDES', 'ftdes.net', 'ngo', 'https://ftdes.net/1', '2026-08-01', 'FACT', 'VERIFIED', 'AUTO_ACCEPTED', 0.9, 'hash01'),

            -- 2. Active Governorate (Sousse)
            ('EV-AUTO-02', 'electricity', 'Coupure de courant generale a Sousse', 'Panne STEG', 'Tunisia', 'UNRESOLVED', NULL, NULL, NULL, 0.0, 'UNRESOLVED', NULL, NULL, '2026-08-02', '2026-08-02', '2026-08-02', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/2', '2026-08-02', 'FACT', 'VERIFIED', 'AUTO_ACCEPTED', 0.85, 'hash02'),

            -- 3. Active National (Countrywide dam statistics)
            ('EV-AUTO-03', 'water', 'Bilan national du taux de remplissage des barrages en Tunisie', 'ONAGRI rapport national', 'Tunisia', 'UNRESOLVED', NULL, NULL, NULL, 0.0, 'UNRESOLVED', NULL, NULL, '2026-08-03', '2026-08-03', '2026-08-03', 'ONAGRI', 'onagri.nat.tn', 'official', 'https://onagri.nat.tn/3', '2026-08-03', 'FACT', 'VERIFIED', 'AUTO_ACCEPTED', 0.95, 'hash03'),

            -- 4. Active Multi-Governorate (Sfax and Gabes)
            ('EV-AUTO-04', 'water', 'Coupures d eau simultanees a Sfax et Gabes', 'Impact double', 'Tunisia', 'UNRESOLVED', NULL, NULL, NULL, 0.0, 'UNRESOLVED', NULL, NULL, '2026-08-04', '2026-08-04', '2026-08-04', 'Nawaat', 'nawaat.org', 'independent', 'https://nawaat.org/4', '2026-08-04', 'FACT', 'VERIFIED', 'AUTO_ACCEPTED', 0.8, 'hash04'),

            -- 5. Active Unresolved (No locality signal)
            ('EV-AUTO-05', 'work', 'Debat sur les conditions de travail en milieu industriel', 'Analyse generale', 'Tunisia', 'UNRESOLVED', NULL, NULL, NULL, 0.0, 'UNRESOLVED', NULL, NULL, '2026-08-05', '2026-08-05', '2026-08-05', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/5', '2026-08-05', 'FACT', 'VERIFIED', 'AUTO_ACCEPTED', 0.7, 'hash05'),

            -- 6. REJECTED record (Must be completely excluded from consideration)
            ('EV-AUTO-06', 'water', 'Protestation a Gafsa contre la societe de phosphate', 'Details Gafsa', 'OriginalLoc', 'UNRESOLVED', 'OldGov', 'OldDel', 'OldLoc', 0.5, 'OLD_METHOD', 34.0, 8.0, '2026-08-06', '2026-08-06', '2026-08-06', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/6', '2026-08-06', 'FACT', 'VERIFIED', 'REJECTED', 0.5, 'hash06')
        """)
        conn.commit()

    def test_audit_is_strictly_read_only(self):
        conn = sqlite3.connect(self.temp_db_path)
        self._insert_sample_records(conn)
        conn.close()

        sha_before = compute_file_sha256(self.temp_db_path)

        report = audit_production_geolocation(db_path=self.temp_db_path)

        sha_after = compute_file_sha256(self.temp_db_path)

        self.assertEqual(sha_before, sha_after, "Database file SHA256 must remain identical after read-only audit")
        self.assertTrue(report["database_unchanged"])
        self.assertEqual(report["mode"], "READ_ONLY_AUDIT")

    def test_audit_excludes_rejected_records_completely(self):
        conn = sqlite3.connect(self.temp_db_path)
        self._insert_sample_records(conn)
        conn.close()

        report = audit_production_geolocation(db_path=self.temp_db_path)
        summary = report["summary"]

        self.assertEqual(summary["total_ev_auto_in_db"], 6)
        self.assertEqual(summary["total_active_records"], 5)
        self.assertEqual(summary["rejected_rows_in_db"], 1)
        self.assertEqual(summary["rejected_rows_considered"], 0)

        audited_ids = {r["id"] for r in report["records"]}
        self.assertNotIn("EV-AUTO-06", audited_ids, "REJECTED records must not appear in audited records list")

    def test_audit_proposed_distribution_and_coordinate_invariants(self):
        conn = sqlite3.connect(self.temp_db_path)
        self._insert_sample_records(conn)
        conn.close()

        report = audit_production_geolocation(db_path=self.temp_db_path)
        summary = report["summary"]
        dist = summary["proposed_distribution"]

        # 1. Check counts
        self.assertEqual(dist["LOCAL"], 1)
        self.assertEqual(dist["GOVERNORATE"], 1)
        self.assertEqual(dist["NATIONAL"], 1)
        self.assertEqual(dist["MULTI_GOVERNORATE"], 1)
        self.assertEqual(dist["UNRESOLVED"], 1)
        self.assertEqual(sum(dist.values()), summary["total_active_records"])

        # 2. Check coordinate metrics
        self.assertEqual(summary["coordinate_bearing_records"], 2)  # LOCAL (1) + GOV (1)
        self.assertEqual(summary["records_with_governorate"], 2)
        self.assertEqual(summary["records_with_delegation"], 1)

        # 3. Invariants per record
        for r in report["records"]:
            scope = r["proposed_location_scope"]
            if scope in ["NATIONAL", "MULTI_GOVERNORATE", "UNRESOLVED"]:
                self.assertIsNone(r["proposed_latitude"], f"Record {r['id']} ({scope}) must not have latitude")
                self.assertIsNone(r["proposed_longitude"], f"Record {r['id']} ({scope}) must not have longitude")
                self.assertIsNone(r["proposed_governorate"], f"Record {r['id']} ({scope}) must not have governorate")
            elif scope in ["LOCAL", "GOVERNORATE"]:
                self.assertIsNotNone(r["proposed_latitude"], f"Record {r['id']} ({scope}) must have latitude")
                self.assertIsNotNone(r["proposed_longitude"], f"Record {r['id']} ({scope}) must have longitude")
                self.assertIsNotNone(r["proposed_governorate"], f"Record {r['id']} ({scope}) must have governorate")
                self.assertIsNotNone(r["exact_matched_phrase"])

    def test_audit_json_export_structure(self):
        conn = sqlite3.connect(self.temp_db_path)
        self._insert_sample_records(conn)
        conn.close()

        temp_json = tempfile.NamedTemporaryFile(suffix=".json", delete=False)
        temp_json_path = temp_json.name
        temp_json.close()

        try:
            report = audit_production_geolocation(
                db_path=self.temp_db_path,
                json_out=temp_json_path
            )

            self.assertTrue(os.path.exists(temp_json_path))
            with open(temp_json_path, "r", encoding="utf-8") as f:
                loaded = json.load(f)

            self.assertIn("summary", loaded)
            self.assertIn("records", loaded)
            self.assertEqual(len(loaded["records"]), 5)

            rec1 = loaded["records"][0]
            required_keys = [
                "id", "issue", "headline", "source_name", "source_url",
                "current_location", "current_location_scope", "current_governorate",
                "current_delegation", "current_locality", "current_latitude", "current_longitude",
                "proposed_location", "proposed_location_scope", "proposed_governorate",
                "proposed_delegation", "proposed_locality", "proposed_latitude", "proposed_longitude",
                "proposed_location_confidence", "proposed_location_method", "exact_matched_phrase",
                "exact_evidence_context", "decision_reason", "ambiguity_warning",
                "false_positive_risk_flag", "mutation_required"
            ]
            for k in required_keys:
                self.assertIn(k, rec1, f"Missing key '{k}' in audit record schema")

        finally:
            if os.path.exists(temp_json_path):
                try:
                    os.unlink(temp_json_path)
                except OSError:
                    pass


if __name__ == "__main__":
    unittest.main()
