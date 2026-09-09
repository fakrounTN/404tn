# monitor/tests/test_finalize_legacy_evidence.py
import os
import gc
import re
import json
import sqlite3
import tempfile
import unittest
from typing import Dict, Any, List

from monitor.app.database import create_tables
from monitor.scripts.finalize_legacy_evidence import (
    execute_finalization,
    validate_finalization_preconditions,
    compute_file_sha256,
    FinalizationValidationError,
    APPROVED_REVIEW_DECISIONS,
    ACTIVE_LEGACY_ALIASES,
    REQUIRED_CONFIRM_TOKEN
)


class TestFinalizeLegacyEvidence(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.test_dir.name, "test_finalize.db")
        self.log_path = os.path.join(self.test_dir.name, "finalize_report.json")

        conn = sqlite3.connect(self.db_path)
        try:
            create_tables(conn)
        finally:
            conn.close()

        self.seed_test_database()

    def tearDown(self):
        gc.collect()
        try:
            self.test_dir.cleanup()
        except Exception:
            pass

    def seed_test_database(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 1. Seed the 13 approved review records with exact expected issues and AUTO_ACCEPTED status
        review_records = [
            ("EV-AUTO-20260909-1731ED", "general", "Prison conditions report", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-A92907", "general", "Employment and labor indicators", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-EF7FD1", "institutions", "Governance commission announcement", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-F33A9C", "general", "Judicial reform analysis", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-F483FF", "general", "Court proceedings on freedom of speech", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-FDE205", "general", "Civil liberties roundtable", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-D9AD3A", "work", "Unemployment rate Q2 release", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-371D43", "general", "Non-substantive event commentary", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-A9B92B", "water", "Ambiguous water project notice", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-CED9DD", "pollution", "Administrative tender notice", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-D96BD6", "pollution", "Foreign environmental paper", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-E75586", "pollution", "Ecological training workshop", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-F400F0", "pollution", "Routine ministerial bulletin", "AUTO_ACCEPTED"),
        ]

        for r in review_records:
            cursor.execute("""
                INSERT INTO evidence (
                    id, issue, headline, summary, source_name, source_domain, source_type, source_url,
                    classification, status, published_at, collected_at, last_checked, ingestion_status,
                    classification_confidence, classification_reason, location, latitude, longitude, event_date
                ) VALUES (?, ?, ?, ?, 'Nawaat', 'nawaat.org', 'news', 'http://example.com/' || ?,
                          'FACT', 'VERIFIED', '2026-09-09T10:00:00Z', '2026-09-09T10:00:00Z', '2026-09-09T10:00:00Z',
                          ?, 0.85, 'Initial review reason', 'Tunis', 36.80, 10.18, '2026-09-09')
            """, (r[0], r[1], r[2], r[2], r[0], r[3]))

        # 2. Seed active and rejected alias records
        alias_records = [
            ("EV-AUTO-20260909-INST01", "institutions", "Court reform bill", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-INST02", "institutions", "Constitutional review", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-ECON01", "economy", "GDP growth statistics", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-GAB01", "gabes", "Air quality in Gabes", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-GAB02", "gabes", "Coastal pollution measurements", "AUTO_ACCEPTED"),
            # REJECTED alias records (must remain untouched)
            ("EV-AUTO-20260909-REJ-INST", "institutions", "Rejected foreign court case", "REJECTED"),
            ("EV-AUTO-20260909-REJ-GAB", "gabes", "Rejected old notice", "REJECTED"),
            # Unapproved general records (must NOT be normalized)
            ("EV-AUTO-20260909-GEN01", "general", "General culture news 1", "AUTO_ACCEPTED"),
            ("EV-AUTO-20260909-GEN02", "general", "General culture news 2", "AUTO_ACCEPTED"),
            # Baseline seeded record
            ("EV-WATER-001", "water", "Baseline dam data", "AUTO_ACCEPTED"),
        ]

        for r in alias_records:
            cursor.execute("""
                INSERT INTO evidence (
                    id, issue, headline, summary, source_name, source_domain, source_type, source_url,
                    classification, status, published_at, collected_at, last_checked, ingestion_status,
                    classification_confidence, classification_reason, location, latitude, longitude, event_date
                ) VALUES (?, ?, ?, ?, 'TAP', 'tap.info.tn', 'news', 'http://example.com/' || ?,
                          'FACT', 'VERIFIED', '2026-09-09T10:00:00Z', '2026-09-09T10:00:00Z', '2026-09-09T10:00:00Z',
                          ?, 0.90, 'Alias baseline reason', 'Tunis', 36.80, 10.18, '2026-09-09')
            """, (r[0], r[1], r[2], r[2], r[0], r[3]))

        conn.commit()
        conn.close()

    # =========================================================================
    # TESTS
    # =========================================================================

    def test_01_dry_run_makes_zero_db_changes(self):
        """1. Dry-run makes zero DB changes."""
        sha_before = compute_file_sha256(self.db_path)
        report = execute_finalization(self.db_path, apply=False)
        sha_after = compute_file_sha256(self.db_path)

        self.assertEqual(sha_before, sha_after)
        self.assertEqual(report["mode"], "DRY_RUN")
        self.assertTrue(report["database_unchanged"])
        self.assertEqual(report["counts"]["mutations_applied"], 0)

    def test_02_dry_run_reports_correct_6_6_1_individual_decisions(self):
        """2. Dry-run reports correct 6/6/1 individual decisions."""
        report = execute_finalization(self.db_path, apply=False)
        counts = report["counts"]

        self.assertEqual(counts["total_review_records"], 13)
        self.assertEqual(counts["reclassify"], 6)
        self.assertEqual(counts["reject"], 6)
        self.assertEqual(counts["keep"], 1)
        self.assertEqual(counts["individual_mutations_planned"], 12)

    def test_03_reclassification_changes_only_issue_and_preserves_all_other_columns(self):
        """3 & 22. Reclassification changes ONLY issue; all non-issue columns are byte/value-identical."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260909-1731ED'")
        before_row = dict(cursor.fetchone())
        conn.close()

        report = execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260909-1731ED'")
        after_row = dict(cursor.fetchone())
        conn.close()

        # Invariant 1: issue is updated to rights
        self.assertEqual(after_row["issue"], "rights")
        self.assertEqual(before_row["issue"], "general")

        # Invariant 2: every other column is identical
        for col, val_before in before_row.items():
            if col != "issue":
                self.assertEqual(
                    val_before,
                    after_row[col],
                    f"Column '{col}' must not be modified by RECLASSIFY (expected {val_before!r}, got {after_row[col]!r})"
                )

    def test_04_rejection_changes_only_ingestion_status_and_preserves_all_other_columns(self):
        """4 & 22. Rejection changes ONLY ingestion_status; all other columns are byte/value-identical."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260909-371D43'")
        before_row = dict(cursor.fetchone())
        conn.close()

        report = execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260909-371D43'")
        after_row = dict(cursor.fetchone())
        conn.close()

        # Invariant 1: ingestion_status updated to REJECTED
        self.assertEqual(after_row["ingestion_status"], "REJECTED")
        self.assertEqual(before_row["ingestion_status"], "AUTO_ACCEPTED")

        # Invariant 2: every other column is identical
        for col, val_before in before_row.items():
            if col != "ingestion_status":
                self.assertEqual(
                    val_before,
                    after_row[col],
                    f"Column '{col}' must not be modified by REJECT (expected {val_before!r}, got {after_row[col]!r})"
                )

    def test_05_keep_changes_nothing(self):
        """5. KEEP changes nothing."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260909-D9AD3A'")
        before_row = dict(cursor.fetchone())
        conn.close()

        execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260909-D9AD3A'")
        after_row = dict(cursor.fetchone())
        conn.close()

        self.assertEqual(before_row, after_row)
        self.assertEqual(after_row["issue"], "work")
        self.assertEqual(after_row["ingestion_status"], "AUTO_ACCEPTED")

    def test_06_alias_normalization_changes_only_issue(self):
        """6. Alias normalization changes ONLY issue on active alias rows."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260909-INST01'")
        before_row = dict(cursor.fetchone())
        conn.close()

        execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260909-INST01'")
        after_row = dict(cursor.fetchone())
        conn.close()

        self.assertEqual(after_row["issue"], "rights")
        self.assertEqual(before_row["issue"], "institutions")

        for col, val_before in before_row.items():
            if col != "issue":
                self.assertEqual(val_before, after_row[col])

    def test_07_alias_normalization_only_affects_auto_accepted_rows(self):
        """7. Alias normalization only affects AUTO_ACCEPTED rows."""
        execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT id, issue, ingestion_status FROM evidence WHERE id IN ('EV-AUTO-20260909-INST01', 'EV-AUTO-20260909-ECON01', 'EV-AUTO-20260909-GAB01')")
        rows = cursor.fetchall()
        conn.close()

        for r in rows:
            self.assertEqual(r[2], "AUTO_ACCEPTED")
            self.assertIn(r[1], ["rights", "work", "pollution"])

    def test_08_rejected_alias_rows_remain_unchanged(self):
        """8. REJECTED alias rows remain unchanged."""
        execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT issue, ingestion_status FROM evidence WHERE id = 'EV-AUTO-20260909-REJ-INST'")
        row_inst = cursor.fetchone()
        cursor.execute("SELECT issue, ingestion_status FROM evidence WHERE id = 'EV-AUTO-20260909-REJ-GAB'")
        row_gab = cursor.fetchone()
        conn.close()

        # Issues and status remain unchanged
        self.assertEqual(row_inst[0], "institutions")
        self.assertEqual(row_inst[1], "REJECTED")
        self.assertEqual(row_gab[0], "gabes")
        self.assertEqual(row_gab[1], "REJECTED")

    def test_09_general_is_never_globally_normalized(self):
        """9. 'general' is never globally normalized."""
        execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT issue, ingestion_status FROM evidence WHERE id = 'EV-AUTO-20260909-GEN01'")
        row1 = cursor.fetchone()
        cursor.execute("SELECT issue, ingestion_status FROM evidence WHERE id = 'EV-AUTO-20260909-GEN02'")
        row2 = cursor.fetchone()
        conn.close()

        self.assertEqual(row1[0], "general")
        self.assertEqual(row1[1], "AUTO_ACCEPTED")
        self.assertEqual(row2[0], "general")
        self.assertEqual(row2[1], "AUTO_ACCEPTED")

    def test_10_missing_expected_id_aborts(self):
        """10. Missing expected ID aborts."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM evidence WHERE id = 'EV-AUTO-20260909-1731ED'")
        conn.commit()
        conn.close()

        with self.assertRaises(FinalizationValidationError) as ctx:
            execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("Expected review record 'EV-AUTO-20260909-1731ED' does not exist", str(ctx.exception))

    def test_11_wrong_current_issue_aborts(self):
        """11. Wrong current issue aborts."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("UPDATE evidence SET issue = 'pollution' WHERE id = 'EV-AUTO-20260909-1731ED'")
        conn.commit()
        conn.close()

        with self.assertRaises(FinalizationValidationError) as ctx:
            execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("has current issue 'pollution', expected 'general'", str(ctx.exception))

    def test_12_wrong_ingestion_status_aborts(self):
        """12. Wrong ingestion_status aborts."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("UPDATE evidence SET ingestion_status = 'REJECTED' WHERE id = 'EV-AUTO-20260909-1731ED'")
        conn.commit()
        conn.close()

        with self.assertRaises(FinalizationValidationError) as ctx:
            execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("has unexpected ingestion_status 'REJECTED', expected 'AUTO_ACCEPTED'", str(ctx.exception))

    def test_13_wrong_confirmation_token_aborts(self):
        """13. Wrong confirmation token aborts."""
        with self.assertRaises(FinalizationValidationError) as ctx:
            execute_finalization(self.db_path, apply=True, confirm_token="WRONG-TOKEN")
        self.assertIn("requires --confirm APPLY-LEGACY-FINALIZATION-V1", str(ctx.exception))

    def test_14_apply_without_confirmation_aborts(self):
        """14. --apply without confirmation aborts."""
        with self.assertRaises(FinalizationValidationError) as ctx:
            execute_finalization(self.db_path, apply=True, confirm_token=None)
        self.assertIn("requires --confirm APPLY-LEGACY-FINALIZATION-V1", str(ctx.exception))

    def test_15_transaction_rolls_back_fully_on_validation_failure(self):
        """15. Transaction rolls back fully on validation failure."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        # Make the 13th record fail validation
        cursor.execute("UPDATE evidence SET issue = 'water' WHERE id = 'EV-AUTO-20260909-F400F0'")
        conn.commit()
        conn.close()

        with self.assertRaises(FinalizationValidationError):
            execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        # Verify 1st record was NOT modified
        cursor.execute("SELECT issue, ingestion_status FROM evidence WHERE id = 'EV-AUTO-20260909-1731ED'")
        row = cursor.fetchone()
        conn.close()

        self.assertEqual(row[0], "general")
        self.assertEqual(row[1], "AUTO_ACCEPTED")

    def test_16_second_apply_is_rejected_safely(self):
        """16. Second apply is rejected safely (no duplicate mutation)."""
        # First run succeeds
        execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        # Second run fails closed because review records are now updated (e.g. 1731ED is now 'rights')
        with self.assertRaises(FinalizationValidationError) as ctx:
            execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        self.assertIn("has current issue 'rights', expected 'general'", str(ctx.exception))

    def test_17_total_row_count_never_changes(self):
        """17. Total row count never changes."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM evidence")
        count_before = cursor.fetchone()[0]
        conn.close()

        execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM evidence")
        count_after = cursor.fetchone()[0]
        conn.close()

        self.assertEqual(count_before, count_after)

    def test_18_no_delete_statements_exist_in_script(self):
        """18. No hard DELETE SQL exists in finalize_legacy_evidence.py."""
        import inspect
        from monitor.scripts import finalize_legacy_evidence

        source = inspect.getsource(finalize_legacy_evidence)
        self.assertIsNone(re.search(r" DELETE\s+FROM ", source, re.IGNORECASE))
        self.assertNotIn("DELETE FROM", source.upper())

    def test_19_json_log_is_created_and_internally_consistent(self):
        """19. JSON log is created and internally consistent."""
        report = execute_finalization(self.db_path, apply=False)
        with open(self.log_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        self.assertTrue(os.path.exists(self.log_path))
        with open(self.log_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data["mode"], "DRY_RUN")
        self.assertEqual(data["validation_status"], "PASSED")
        self.assertEqual(len(data["review_records"]), 13)
        self.assertEqual(len(data["alias_normalization"]), 3)
        self.assertEqual(data["counts"]["reclassify"], 6)
        self.assertEqual(data["counts"]["reject"], 6)
        self.assertEqual(data["counts"]["keep"], 1)

    def test_20_database_sha_unchanged_in_dry_run(self):
        """20. Database SHA is unchanged in dry-run."""
        sha_before = compute_file_sha256(self.db_path)
        report = execute_finalization(self.db_path, apply=False)
        sha_after = compute_file_sha256(self.db_path)

        self.assertEqual(sha_before, sha_after)
        self.assertTrue(report["database_unchanged"])

    def test_21_database_sha_changes_in_apply_when_mutations_occur(self):
        """21. Database SHA changes in apply when mutations occur."""
        sha_before = compute_file_sha256(self.db_path)
        report = execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)
        sha_after = compute_file_sha256(self.db_path)

        self.assertNotEqual(sha_before, sha_after)
        self.assertFalse(report["database_unchanged"])
        self.assertGreater(report["counts"]["mutations_applied"], 0)

    def test_22_all_non_target_columns_are_value_identical_across_full_dataset(self):
        """22. All non-target columns are byte-for-byte / value-for-value unchanged across full dataset."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence")
        all_before = {r["id"]: dict(r) for r in cursor.fetchall()}
        conn.close()

        execute_finalization(self.db_path, apply=True, confirm_token=REQUIRED_CONFIRM_TOKEN)

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence")
        all_after = {r["id"]: dict(r) for r in cursor.fetchall()}
        conn.close()

        self.assertEqual(set(all_before.keys()), set(all_after.keys()))

        for rec_id, row_before in all_before.items():
            row_after = all_after[rec_id]
            for col, val_before in row_before.items():
                if col in ("issue", "ingestion_status"):
                    continue
                self.assertEqual(
                    val_before,
                    row_after[col],
                    f"Record '{rec_id}' column '{col}' changed unexpectedly! Before: {val_before!r}, After: {row_after[col]!r}"
                )

    def test_23_alias_counts_are_computed_dynamically(self):
        """23. Alias counts are computed dynamically, not hardcoded."""
        # Add 3 extra active economy rows
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        for i in range(3):
            cursor.execute("""
                INSERT INTO evidence (
                    id, issue, headline, summary, source_name, source_domain, source_type, source_url,
                    classification, status, published_at, collected_at, last_checked, ingestion_status,
                    classification_confidence, classification_reason, location, latitude, longitude, event_date
                ) VALUES (?, 'economy', 'Extra economy row', 'Summary', 'TAP', 'tap.info.tn', 'news',
                          'http://example.com/extra', 'FACT', 'VERIFIED', '2026-09-09T10:00:00Z',
                          '2026-09-09T10:00:00Z', '2026-09-09T10:00:00Z', 'AUTO_ACCEPTED', 0.9, 'Reason',
                          'Tunis', 36.8, 10.18, '2026-09-09')
            """, (f"EV-AUTO-20260909-EXTRA-ECON-{i}",))
        conn.commit()
        conn.close()

        report = execute_finalization(self.db_path, apply=False)
        econ_entry = next(a for a in report["alias_normalization"] if a["old_alias"] == "economy")
        # Originally 1 economy row + 3 extra = 4 dynamically counted
        self.assertEqual(econ_entry["rows_affected"], 4)


if __name__ == "__main__":
    unittest.main()
