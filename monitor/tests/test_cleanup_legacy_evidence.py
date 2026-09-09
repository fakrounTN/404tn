# monitor/tests/test_cleanup_legacy_evidence.py
import os
import gc
import re
import json
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from typing import Dict, Any, List
from fastapi.testclient import TestClient

from monitor.app.database import create_tables
from monitor.app.main import app
from monitor.scripts.cleanup_legacy_evidence import (
    execute_cleanup,
    validate_cleanup_plan,
    compute_file_sha256,
    CleanupValidationError,
    REQUIRED_CONFIRM_TOKEN
)


class TestCleanupLegacyEvidence(unittest.TestCase):
    def setUp(self):
        # Create temporary directory and database for each test
        self.test_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.test_dir.name, "test_cleanup.db")
        self.audit_path = os.path.join(self.test_dir.name, "audit.json")

        # Initialize schema
        conn = sqlite3.connect(self.db_path)
        try:
            create_tables(conn)
        finally:
            conn.close()

        # Seed realistic EV-AUTO test records
        self.seed_test_records()

    def tearDown(self):
        gc.collect()
        try:
            self.test_dir.cleanup()
        except Exception:
            pass

    def seed_test_records(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        records = [
            ("EV-AUTO-20260901-001", "water", "Coupure d'eau potable a Sfax", "Interruption de la distribution d'eau", "SONEDE", "sonede.com.tn", "AUTO_ACCEPTED", 0.95, "Direct water cut report", "Sfax", 34.74, 10.76, "2026-09-01"),
            ("EV-AUTO-20260901-002", "general", "Négliences médicales dans les prisons", "Rapport sur les conditions carcerales", "Nawaat", "nawaat.org", "AUTO_ACCEPTED", 0.85, "Prison report", "Tunis", 36.80, 10.18, "2026-09-01"),
            ("EV-AUTO-20260901-003", "rights", "Coupe du monde 2026 football", "Les coulisses du fiasco tunisien", "Inkyfada", "inkyfada.com", "AUTO_ACCEPTED", 0.80, "Sports analysis", "Tunis", 36.80, 10.18, "2026-09-01"),
            ("EV-AUTO-20260901-004", "work", "Indicateurs de l'emploi Q2", "Statistiques nationales du chomage", "INS", "ins.tn", "AUTO_ACCEPTED", 0.90, "Employment stats", "Tunis", 36.80, 10.18, "2026-09-01"),
            ("EV-AUTO-20260901-005", "general", "Forum Social Mondial 2026", "Participation du FTDES au forum", "FTDES", "ftdes.net", "AUTO_ACCEPTED", 0.75, "FTDES forum", "Tunis", 36.80, 10.18, "2026-09-01"),
            # Seeded baseline record (non-EV-AUTO)
            ("EV-WATER-001", "water", "Baseline dam capacity", "Historical northern dams", "Ministry", "agriculture.gov.tn", "AUTO_ACCEPTED", 0.99, "Historical record", "Bizerte", 37.27, 9.87, "2026-09-01"),
        ]

        for r in records:
            cursor.execute("""
                INSERT INTO evidence (
                    id, issue, headline, summary, source_name, source_domain, source_type, source_url,
                    classification, status, published_at, collected_at, last_checked, ingestion_status,
                    classification_confidence, classification_reason, location, latitude, longitude, event_date
                ) VALUES (?, ?, ?, ?, ?, ?, 'news', 'http://example.com/' || ?, 'FACT', 'VERIFIED', '2026-09-01T10:00:00Z', '2026-09-01T10:00:00Z', '2026-09-01T10:00:00Z', ?, ?, ?, ?, ?, ?, ?)
            """, (r[0], r[1], r[2], r[3], r[4], r[5], r[0], r[6], r[7], r[8], r[9], r[10], r[11], r[12]))

        conn.commit()
        conn.close()

    def get_base_audit_records(self) -> List[Dict[str, Any]]:
        """Returns valid audit entries for all 5 seeded EV-AUTO records."""
        return [
            {
                "id": "EV-AUTO-20260901-001",
                "action": "KEEP",
                "current_issue": "water",
                "raw_current_issue": "water",
                "proposed_issue": "water",
                "confidence": 0.95,
                "reason": "Correct taxonomy",
                "headline": "Coupure d'eau potable a Sfax",
                "source_name": "SONEDE",
                "source_domain": "sonede.com.tn",
                "source_url": "http://example.com/EV-AUTO-20260901-001"
            },
            {
                "id": "EV-AUTO-20260901-002",
                "action": "KEEP",
                "current_issue": "general",
                "raw_current_issue": "general",
                "proposed_issue": "general",
                "confidence": 0.85,
                "reason": "Keep general",
                "headline": "Négliences médicales dans les prisons",
                "source_name": "Nawaat",
                "source_domain": "nawaat.org",
                "source_url": "http://example.com/EV-AUTO-20260901-002"
            },
            {
                "id": "EV-AUTO-20260901-003",
                "action": "KEEP",
                "current_issue": "rights",
                "raw_current_issue": "rights",
                "proposed_issue": "rights",
                "confidence": 0.80,
                "reason": "Keep rights",
                "headline": "Coupe du monde 2026 football",
                "source_name": "Inkyfada",
                "source_domain": "inkyfada.com",
                "source_url": "http://example.com/EV-AUTO-20260901-003"
            },
            {
                "id": "EV-AUTO-20260901-004",
                "action": "KEEP",
                "current_issue": "work",
                "raw_current_issue": "work",
                "proposed_issue": "work",
                "confidence": 0.90,
                "reason": "Keep work",
                "headline": "Indicateurs de l'emploi Q2",
                "source_name": "INS",
                "source_domain": "ins.tn",
                "source_url": "http://example.com/EV-AUTO-20260901-004"
            },
            {
                "id": "EV-AUTO-20260901-005",
                "action": "KEEP",
                "current_issue": "general",
                "raw_current_issue": "general",
                "proposed_issue": "general",
                "confidence": 0.75,
                "reason": "Keep general",
                "headline": "Forum Social Mondial 2026",
                "source_name": "FTDES",
                "source_domain": "ftdes.net",
                "source_url": "http://example.com/EV-AUTO-20260901-005"
            }
        ]

    def create_audit_file(self, records: List[Dict[str, Any]]) -> str:
        audit_payload = {
            "timestamp": "2026-09-10T00:00:00Z",
            "database": self.db_path,
            "total_records_scanned": len(records),
            "summary": {
                "KEEP": sum(1 for r in records if r.get("action") == "KEEP"),
                "RECLASSIFY": sum(1 for r in records if r.get("action") == "RECLASSIFY"),
                "EXCLUDE": sum(1 for r in records if r.get("action") == "EXCLUDE"),
                "REVIEW_REQUIRED": sum(1 for r in records if r.get("action") == "REVIEW_REQUIRED"),
            },
            "records": records
        }
        with open(self.audit_path, "w", encoding="utf-8") as f:
            json.dump(audit_payload, f, indent=2)
        return self.audit_path

    # =========================================================================
    # UNIT & SAFETY TESTS
    # =========================================================================

    def test_01_default_is_dry_run_and_sha256_unchanged(self):
        """1. Default is dry-run and SHA256 DB unchanged."""
        records = self.get_base_audit_records()
        records[1]["action"] = "RECLASSIFY"
        records[1]["proposed_issue"] = "rights"
        records[1]["confidence"] = 0.90
        records[2]["action"] = "EXCLUDE"
        audit_path = self.create_audit_file(records)

        sha_before = compute_file_sha256(self.db_path)
        report = execute_cleanup(self.db_path, audit_path, apply=False)
        sha_after = compute_file_sha256(self.db_path)

        self.assertEqual(sha_before, sha_after)
        self.assertEqual(report["mode"], "DRY_RUN")
        self.assertTrue(report["database_unchanged"])
        self.assertEqual(report["mutations_executed"], 0)

    def test_02_keep_never_mutates(self):
        """2. KEEP never mutates."""
        records = self.get_base_audit_records()
        audit_path = self.create_audit_file(records)

        report = execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT issue, ingestion_status FROM evidence WHERE id = 'EV-AUTO-20260901-001'")
        row = cursor.fetchone()
        conn.close()

        self.assertEqual(row[0], "water")
        self.assertEqual(row[1], "AUTO_ACCEPTED")
        self.assertEqual(report["records"][0]["result"], "PRESERVED_NO_OP")
        self.assertEqual(report["mutations_executed"], 0)

    def test_03_review_required_never_mutates(self):
        """3. REVIEW_REQUIRED never mutates."""
        records = self.get_base_audit_records()
        records[4]["action"] = "REVIEW_REQUIRED"
        records[4]["proposed_issue"] = "migration"
        records[4]["confidence"] = 0.50
        records[4]["reason"] = "Competing topics"
        audit_path = self.create_audit_file(records)

        report = execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT issue, ingestion_status FROM evidence WHERE id = 'EV-AUTO-20260901-005'")
        row = cursor.fetchone()
        conn.close()

        self.assertEqual(row[0], "general")
        self.assertEqual(row[1], "AUTO_ACCEPTED")
        self.assertEqual(report["records"][4]["result"], "PRESERVED_NO_OP")
        self.assertEqual(report["mutations_executed"], 0)

    def test_04_reclassify_updates_issue_only_and_preserves_all_other_columns(self):
        """4. RECLASSIFY >=0.70 changes issue ONLY; all non-issue columns are byte/value-identical."""
        records = self.get_base_audit_records()
        records[1]["action"] = "RECLASSIFY"
        records[1]["proposed_issue"] = "rights"
        records[1]["confidence"] = 0.95
        records[1]["reason"] = "Disambiguation: Prison rights under rights"
        audit_path = self.create_audit_file(records)

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260901-002'")
        before_row = dict(cursor.fetchone())
        conn.close()

        report = execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260901-002'")
        after_row = dict(cursor.fetchone())
        conn.close()

        # Invariant 1: Exactly issue changed to 'rights'
        self.assertEqual(after_row["issue"], "rights")
        self.assertNotEqual(before_row["issue"], after_row["issue"])

        # Invariant 2: Every other column is byte/value identical
        for col, val_before in before_row.items():
            if col != "issue":
                self.assertEqual(
                    val_before,
                    after_row[col],
                    f"Column '{col}' must not be modified by RECLASSIFY (expected {val_before!r}, got {after_row[col]!r})"
                )

        # Invariant 3: Audit metadata is in report, not row
        self.assertEqual(before_row["classification_confidence"], after_row["classification_confidence"])
        self.assertEqual(before_row["classification_reason"], after_row["classification_reason"])
        self.assertEqual(report["mutations_executed"], 1)
        self.assertEqual(report["records"][1]["result"], "APPLIED_RECLASSIFY")

    def test_05_reclassify_lt_070_refused(self):
        """5. RECLASSIFY <0.70 refused."""
        records = self.get_base_audit_records()
        records[1]["action"] = "RECLASSIFY"
        records[1]["proposed_issue"] = "rights"
        records[1]["confidence"] = 0.55
        records[1]["reason"] = "Low confidence"
        audit_path = self.create_audit_file(records)

        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("below 0.70 threshold", str(ctx.exception))

    def test_06_exclude_never_deletes_row(self):
        """6. EXCLUDE never deletes row."""
        records = self.get_base_audit_records()
        records[2]["action"] = "EXCLUDE"
        records[2]["reason"] = "Sports coverage"
        audit_path = self.create_audit_file(records)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM evidence")
        total_before = cursor.fetchone()[0]
        conn.close()

        execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM evidence")
        total_after = cursor.fetchone()[0]
        conn.close()

        self.assertEqual(total_before, total_after, "Total evidence rows must not change during EXCLUDE")

    def test_07_exclude_updates_status_only_and_preserves_all_other_columns(self):
        """7. EXCLUDE changes ingestion_status ONLY; all non-status columns are byte/value-identical."""
        records = self.get_base_audit_records()
        records[2]["action"] = "EXCLUDE"
        records[2]["reason"] = "Non-substantive sports coverage"
        audit_path = self.create_audit_file(records)

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260901-003'")
        before_row = dict(cursor.fetchone())
        conn.close()

        report = execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260901-003'")
        after_row = dict(cursor.fetchone())
        conn.close()

        # Invariant 1: ingestion_status updated to 'REJECTED'
        self.assertEqual(after_row["ingestion_status"], "REJECTED")
        self.assertEqual(before_row["ingestion_status"], "AUTO_ACCEPTED")

        # Invariant 2: Every other column is byte/value identical
        for col, val_before in before_row.items():
            if col != "ingestion_status":
                self.assertEqual(
                    val_before,
                    after_row[col],
                    f"Column '{col}' must not be modified by EXCLUDE (expected {val_before!r}, got {after_row[col]!r})"
                )

        self.assertEqual(before_row["classification_reason"], after_row["classification_reason"])
        self.assertEqual(before_row["issue"], after_row["issue"])
        self.assertEqual(before_row["headline"], after_row["headline"])
        self.assertEqual(before_row["source_url"], after_row["source_url"])
        self.assertEqual(report["mutations_executed"], 1)
        self.assertEqual(report["records"][2]["result"], "APPLIED_EXCLUDE")

    def test_08_stale_current_issue_causes_complete_failure(self):
        """8. Stale current_issue causes complete failure."""
        records = self.get_base_audit_records()
        records[0]["current_issue"] = "pollution"
        records[0]["raw_current_issue"] = "pollution"
        audit_path = self.create_audit_file(records)

        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("Stale audit data", str(ctx.exception))

    def test_09_stale_stable_identity_mismatches_cause_failure(self):
        """9. Stale stable identity fields (headline, source, domain, url) cause complete failure."""
        # 1. Headline mismatch
        records = self.get_base_audit_records()
        records[0]["headline"] = "Different Modified Headline"
        audit_path = self.create_audit_file(records)
        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("headline mismatch", str(ctx.exception))

        # 2. Source name mismatch
        records = self.get_base_audit_records()
        records[0]["source_name"] = "Different Source Name"
        audit_path = self.create_audit_file(records)
        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("source_name mismatch", str(ctx.exception))

        # 3. Source domain mismatch
        records = self.get_base_audit_records()
        records[0]["source_domain"] = "wrong-domain.com"
        audit_path = self.create_audit_file(records)
        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("source_domain mismatch", str(ctx.exception))

        # 4. Source URL mismatch
        records = self.get_base_audit_records()
        records[0]["source_url"] = "http://example.com/different-url"
        audit_path = self.create_audit_file(records)
        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("source_url mismatch", str(ctx.exception))

    def test_10_missing_record_causes_complete_failure(self):
        """10. Missing record causes complete failure."""
        records = self.get_base_audit_records()
        records[0]["id"] = "EV-AUTO-20260901-999"
        audit_path = self.create_audit_file(records)

        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("Exact population mismatch", str(ctx.exception))

    def test_11_duplicate_audit_id_causes_complete_failure(self):
        """11. Duplicate audit ID causes complete failure."""
        records = self.get_base_audit_records()
        records[1]["id"] = "EV-AUTO-20260901-001"
        audit_path = self.create_audit_file(records)

        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("Duplicate record ID", str(ctx.exception))

    def test_12_non_ev_auto_record_causes_complete_failure(self):
        """12. Non-EV-AUTO record causes complete failure."""
        records = self.get_base_audit_records()
        records[0]["id"] = "EV-WATER-001"
        audit_path = self.create_audit_file(records)

        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("Non-EV-AUTO record detected", str(ctx.exception))

    def test_13_invalid_proposed_issue_causes_complete_failure(self):
        """13. Invalid proposed issue causes complete failure."""
        records = self.get_base_audit_records()
        records[1]["action"] = "RECLASSIFY"
        records[1]["proposed_issue"] = "astronomy_galaxy"
        records[1]["confidence"] = 0.95
        audit_path = self.create_audit_file(records)

        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("Must be canonical", str(ctx.exception))

    def test_14_invalid_audit_action_causes_complete_failure(self):
        """14. Invalid audit action causes complete failure."""
        records = self.get_base_audit_records()
        records[0]["action"] = "PURGE_AND_DESTROY"
        audit_path = self.create_audit_file(records)

        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("Invalid audit action", str(ctx.exception))

    def test_15_transaction_rollback_prevents_partial_mutations(self):
        """15. Transaction rollback prevents partial mutations on validation error."""
        records = self.get_base_audit_records()
        records[1]["action"] = "RECLASSIFY"
        records[1]["proposed_issue"] = "rights"
        records[1]["confidence"] = 0.95

        # Record 3 has invalid proposed issue
        records[3]["action"] = "RECLASSIFY"
        records[3]["proposed_issue"] = "invalid_topic"
        records[3]["confidence"] = 0.95
        audit_path = self.create_audit_file(records)

        with self.assertRaises(CleanupValidationError):
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT issue FROM evidence WHERE id = 'EV-AUTO-20260901-002'")
        row1 = cursor.fetchone()
        cursor.execute("SELECT issue FROM evidence WHERE id = 'EV-AUTO-20260901-004'")
        row2 = cursor.fetchone()
        conn.close()

        # Both remain unchanged
        self.assertEqual(row1[0], "general")
        self.assertEqual(row2[0], "work")

    def test_16_audit_log_contains_before_after_values_and_audit_metadata(self):
        """16. Audit log contains before/after values and preserved audit metadata."""
        records = self.get_base_audit_records()
        records[1]["action"] = "RECLASSIFY"
        records[1]["proposed_issue"] = "rights"
        records[1]["confidence"] = 0.95
        records[1]["reason"] = "Disambiguation reason"

        records[2]["action"] = "EXCLUDE"
        records[2]["proposed_issue"] = None
        records[2]["confidence"] = 0.0
        records[2]["reason"] = "Sports exclude reason"

        audit_path = self.create_audit_file(records)
        report = execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        rec1 = report["records"][1]
        self.assertEqual(rec1["id"], "EV-AUTO-20260901-002")
        self.assertEqual(rec1["old_issue"], "general")
        self.assertEqual(rec1["new_issue"], "rights")
        self.assertEqual(rec1["confidence"], 0.95)
        self.assertEqual(rec1["reason"], "Disambiguation reason")
        self.assertEqual(rec1["result"], "APPLIED_RECLASSIFY")

        rec2 = report["records"][2]
        self.assertEqual(rec2["id"], "EV-AUTO-20260901-003")
        self.assertEqual(rec2["old_ingestion_status"], "AUTO_ACCEPTED")
        self.assertEqual(rec2["new_ingestion_status"], "REJECTED")
        self.assertEqual(rec2["reason"], "Sports exclude reason")
        self.assertEqual(rec2["result"], "APPLIED_EXCLUDE")

    def test_17_second_apply_is_safely_rejected_or_idempotent(self):
        """17. Second apply is safely rejected due to stale state."""
        records = self.get_base_audit_records()
        records[1]["action"] = "RECLASSIFY"
        records[1]["proposed_issue"] = "rights"
        records[1]["confidence"] = 0.95
        audit_path = self.create_audit_file(records)

        # First run succeeds
        execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        # Second run with same audit fails closed because DB issue is now 'rights' (not 'general')
        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("Stale audit data", str(ctx.exception))

    def test_18_no_review_required_record_can_enter_mutation_plan(self):
        """18. No REVIEW_REQUIRED record can enter mutation plan."""
        records = self.get_base_audit_records()
        records[4]["action"] = "REVIEW_REQUIRED"
        records[4]["confidence"] = 0.40
        audit_path = self.create_audit_file(records)

        report = execute_cleanup(self.db_path, audit_path, apply=False)
        self.assertEqual(report["summary"]["mutations_planned"], 0)
        for r in report["records"]:
            self.assertEqual(r["mutation_type"], "NONE")

    def test_19_apply_mandatory_exact_population_checks(self):
        """19. Mandatory exact population / ID-set validation for APPLY mode."""
        # A. Extra EV-AUTO in DB (audit has 4 of 5)
        records_subset = self.get_base_audit_records()[:4]
        audit_path_subset = self.create_audit_file(records_subset)
        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path_subset, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("Exact population mismatch", str(ctx.exception))
        self.assertIn("Missing in audit: 1 IDs", str(ctx.exception))

        # B. Extra in Audit / Missing from DB
        records_extra = self.get_base_audit_records() + [
            {
                "id": "EV-AUTO-20260901-999",
                "action": "KEEP",
                "current_issue": "water",
                "proposed_issue": "water",
                "confidence": 0.95,
                "reason": "Ghost record"
            }
        ]
        audit_path_extra = self.create_audit_file(records_extra)
        with self.assertRaises(CleanupValidationError) as ctx:
            execute_cleanup(self.db_path, audit_path_extra, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("Exact population mismatch", str(ctx.exception))
        self.assertIn("Extra in audit / missing from DB: 1 IDs", str(ctx.exception))

        # C. Exact ID set permits apply
        records_exact = self.get_base_audit_records()
        audit_path_exact = self.create_audit_file(records_exact)
        report = execute_cleanup(self.db_path, audit_path_exact, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertEqual(report["mode"], "APPLY")

    def test_20_no_hard_delete_sql_exists_in_cleanup_path(self):
        """20. No hard DELETE SQL exists in cleanup path."""
        import inspect
        from monitor.scripts import cleanup_legacy_evidence

        source = inspect.getsource(cleanup_legacy_evidence)
        self.assertIsNone(re.search(r" DELETE\s+FROM ", source, re.IGNORECASE))
        self.assertNotIn("DELETE FROM", source.upper())

    def test_21_rejected_records_invisible_across_all_public_api_surfaces(self):
        """21. Verifies REJECTED records are completely invisible across ALL public API endpoints."""
        # Perform EXCLUDE on record 003
        records = self.get_base_audit_records()
        records[2]["action"] = "EXCLUDE"
        records[2]["reason"] = "Sports exclude"
        audit_path = self.create_audit_file(records)
        execute_cleanup(self.db_path, audit_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = TestClient(app)

            # 1. /api/stats
            res = client.get("/api/stats")
            self.assertEqual(res.status_code, 200)
            stats = res.json()
            # 5 EV-AUTO total seeded, 1 was REJECTED -> exactly 4 public EV-AUTO remain
            self.assertEqual(stats["total_evidence_records"], 4)

            # 2. /api/timeline
            res = client.get("/api/timeline")
            self.assertEqual(res.status_code, 200)
            timeline_ids = [item["id"] for item in res.json()]
            self.assertNotIn("EV-AUTO-20260901-003", timeline_ids)
            self.assertIn("EV-AUTO-20260901-001", timeline_ids)

            # 3. /api/map (incidents mode)
            res = client.get("/api/map?mode=incidents")
            self.assertEqual(res.status_code, 200)
            map_data = res.json()
            event_ids = [feat["id"] for feat in map_data.get("features", [])]
            self.assertNotIn("EV-AUTO-20260901-003", event_ids)

            # 4. /api/map (governorates mode)
            res = client.get("/api/map?mode=governorates")
            self.assertEqual(res.status_code, 200)

            # 5. /api/map (density mode)
            res = client.get("/api/map?mode=density")
            self.assertEqual(res.status_code, 200)

            # 6. /api/issues
            res = client.get("/api/issues")
            self.assertEqual(res.status_code, 200)
            issues_data = res.json()
            for iss in issues_data:
                if iss["slug"] == "rights":
                    # Record 003 was rights, now rejected -> rights evidence count should be 0
                    self.assertEqual(iss["evidence_count"], 0)

            # 7. /api/issues/rights
            res = client.get("/api/issues/rights")
            self.assertEqual(res.status_code, 200)
            dossier = res.json()
            dossier_ids = [ev["id"] for ev in dossier.get("evidence_records", [])]
            self.assertNotIn("EV-AUTO-20260901-003", dossier_ids)

            # 8. /api/gabes
            res = client.get("/api/gabes")
            self.assertEqual(res.status_code, 200)
            gabes_ids = [e["id"] for e in res.json().get("evidence_list", [])]
            self.assertNotIn("EV-AUTO-20260901-003", gabes_ids)

            # 9. /api/accountability
            res = client.get("/api/accountability")
            self.assertEqual(res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
