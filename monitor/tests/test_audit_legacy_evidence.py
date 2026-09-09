# monitor/tests/test_audit_legacy_evidence.py
"""
404TN — Read-Only Legacy Evidence Audit Verification Tests

Proves:
1. Pure READ-ONLY execution with zero database writes (verified via cryptographic hashing).
2. Deterministic decision assignment: KEEP, RECLASSIFY, EXCLUDE, REVIEW_REQUIRED.
3. Strict filtering of non-EV-AUTO (e.g. seeded) records.
4. Canonical issue normalization.
5. CLI argument parsing and structured JSON export.
6. Absolute absence of any --apply mutation mode.
"""

import os
import sys
import json
import sqlite3
import hashlib
import tempfile
import unittest
from unittest.mock import patch

from monitor.app.database import create_tables
from monitor.scripts.audit_legacy_evidence import (
    audit_legacy_evidence,
    normalize_issue,
    resolve_target_db,
    main as audit_main
)

def get_file_sha256(filepath: str) -> str:
    """Calculates SHA256 checksum of a file."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

class TestAuditLegacyEvidence(unittest.TestCase):
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

    def test_zero_database_writes_proof(self):
        """
        Cryptographically proves that running audit_legacy_evidence performs
        zero write operations to the database file.
        """
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (
                id, issue, headline, summary, location, location_scope, governorate,
                published_at, collected_at, last_checked, source_name, source_domain,
                source_type, source_url, event_date, classification, status
            ) VALUES
            ('EV-AUTO-01', 'water', 'Coupure d''eau a Kasserine', 'SONEDE panne', 'Kasserine', 'GOVERNORATE', 'Kasserine', '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/1', '2026-08-01', 'FACT', 'VERIFIED'),
            ('EV-SEEDED-01', 'pollution', 'Seeded record', 'Seed summary', 'Gabes', 'GOVERNORATE', 'Gabes', '2026-08-01', '2026-08-01', '2026-08-01', 'Seed', 'seed.tn', 'official', 'https://seed.tn/1', '2026-08-01', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        # Compute SHA256 before audit
        hash_before = get_file_sha256(self.temp_db_path)

        # Run audit multiple times
        report1 = audit_legacy_evidence(db_path=self.temp_db_path)
        report2 = audit_legacy_evidence(db_path=self.temp_db_path)

        # Compute SHA256 after audit
        hash_after = get_file_sha256(self.temp_db_path)

        self.assertEqual(hash_before, hash_after, "Database file checksum must remain 100% identical after audit")
        self.assertEqual(report1["total_records_scanned"], 1, "Only EV-AUTO records scanned")
        self.assertEqual(report2["total_records_scanned"], 1)

        # Verify row counts and values inside SQLite
        conn = sqlite3.connect(self.temp_db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM evidence")
        self.assertEqual(cursor.fetchone()[0], 2)
        cursor.execute("SELECT id, issue, headline FROM evidence ORDER BY id")
        rows = cursor.fetchall()
        self.assertEqual(rows[0][0], "EV-AUTO-01")
        self.assertEqual(rows[0][1], "water")
        self.assertEqual(rows[1][0], "EV-SEEDED-01")
        conn.close()

    def test_deterministic_decision_assignment(self):
        """
        Verifies that every record receives exactly one of KEEP, RECLASSIFY, EXCLUDE, or REVIEW_REQUIRED.
        """
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (
                id, issue, headline, summary, location, location_scope, governorate,
                published_at, collected_at, last_checked, source_name, source_domain,
                source_type, source_url, event_date, classification, status
            ) VALUES
            -- 1. KEEP: Correctly classified water cut
            ('EV-AUTO-KEEP-01', 'water', 'SONEDE: Coupure d''eau potable a Gafsa', 'Interruption de distribution d''eau', 'Gafsa', 'GOVERNORATE', 'Gafsa', '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/1', '2026-08-01', 'FACT', 'VERIFIED'),
            
            -- 2. RECLASSIFY: Misclassified STEG electricity cut under 'work'
            ('EV-AUTO-RECL-01', 'work', 'STEG: Coupure d''electricite a Sousse', 'Interruption du reseau electrique', 'Sousse', 'GOVERNORATE', 'Sousse', '2026-08-02', '2026-08-02', '2026-08-02', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/2', '2026-08-02', 'FACT', 'VERIFIED'),
            
            -- 3. EXCLUDE: Non-substantive landing page
            ('EV-AUTO-EXCL-01', 'water', 'Actualités', 'Page d''accueil', 'Tunisia', 'NATIONAL', NULL, '2026-08-03', '2026-08-03', '2026-08-03', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/3', '2026-08-03', 'FACT', 'VERIFIED'),
            
            -- 4. EXCLUDE: Foreign wire story without Tunisia context
            ('EV-AUTO-EXCL-02', 'electricity', 'Nepal electricity restored after storm in Kathmandu', 'Power grid repairs in Asia', 'Kathmandu', 'UNRESOLVED', NULL, '2026-08-04', '2026-08-04', '2026-08-04', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/4', '2026-08-04', 'FACT', 'VERIFIED'),
            
            -- 5. EXCLUDE: Sports tournament
            ('EV-AUTO-EXCL-03', 'work', 'Médaille d''or aux jeux méditerranéens en haltérophilie', 'Victoire sportive', 'Tunis', 'GOVERNORATE', 'Tunis', '2026-08-05', '2026-08-05', '2026-08-05', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/5', '2026-08-05', 'FACT', 'VERIFIED'),
            
            -- 6. REVIEW_REQUIRED: Contested borderline confidence
            ('EV-AUTO-REV-01', 'public_services', 'Avis aux citoyens a Tunis', 'Perturbations signalees sur le reseau de transport urbain', 'Tunis', 'GOVERNORATE', 'Tunis', '2026-08-06', '2026-08-06', '2026-08-06', 'Nawaat', 'nawaat.org', 'independent', 'https://nawaat.org/6', '2026-08-06', 'ANALYSIS', 'UNDER REVIEW')
        """)
        conn.commit()
        conn.close()

        report = audit_legacy_evidence(db_path=self.temp_db_path)

        self.assertEqual(report["total_records_scanned"], 6)
        summary = report["summary"]
        self.assertEqual(summary["KEEP"], 1)
        self.assertEqual(summary["RECLASSIFY"], 1)
        self.assertEqual(summary["EXCLUDE"], 3)
        self.assertEqual(summary["REVIEW_REQUIRED"], 1)

        # Check KEEP
        rec_keep = next(r for r in report["records"] if r["id"] == "EV-AUTO-KEEP-01")
        self.assertEqual(rec_keep["decision"], "KEEP")
        self.assertEqual(rec_keep["current_issue"], "water")
        self.assertEqual(rec_keep["proposed_issue"], "water")

        # Check RECLASSIFY
        rec_recl = next(r for r in report["records"] if r["id"] == "EV-AUTO-RECL-01")
        self.assertEqual(rec_recl["decision"], "RECLASSIFY")
        self.assertEqual(rec_recl["current_issue"], "work")
        self.assertEqual(rec_recl["proposed_issue"], "electricity")

        # Check EXCLUDE non-substantive
        rec_excl1 = next(r for r in report["records"] if r["id"] == "EV-AUTO-EXCL-01")
        self.assertEqual(rec_excl1["decision"], "EXCLUDE")
        self.assertIn("Non-substantive", rec_excl1["reason"])

        # Check EXCLUDE foreign wire
        rec_excl2 = next(r for r in report["records"] if r["id"] == "EV-AUTO-EXCL-02")
        self.assertEqual(rec_excl2["decision"], "EXCLUDE")
        self.assertIn("Tunisia-context", rec_excl2["reason"])

        # Check EXCLUDE sports
        rec_excl3 = next(r for r in report["records"] if r["id"] == "EV-AUTO-EXCL-03")
        self.assertEqual(rec_excl3["decision"], "EXCLUDE")
        self.assertIn("Non-substantive", rec_excl3["reason"])

        # Check REVIEW_REQUIRED
        rec_rev = next(r for r in report["records"] if r["id"] == "EV-AUTO-REV-01")
        self.assertEqual(rec_rev["decision"], "REVIEW_REQUIRED")
        self.assertTrue(0.40 <= rec_rev["confidence"] < 0.70)

    def test_strict_isolation_from_non_ev_auto_records(self):
        """Proves that non-EV-AUTO records (seeded, manual) are completely ignored."""
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (
                id, issue, headline, summary, published_at, collected_at, last_checked,
                source_name, source_domain, source_type, source_url, classification, status
            ) VALUES
            ('EV-SEEDED-001', 'water', 'Water report', 'Summary', '2026-08-01', '2026-08-01', '2026-08-01', 'Seed', 'seed.tn', 'official', 'https://seed.tn/1', 'FACT', 'VERIFIED'),
            ('EV-MANUAL-002', 'electricity', 'STEG outage', 'Summary', '2026-08-01', '2026-08-01', '2026-08-01', 'Manual', 'manual.tn', 'official', 'https://manual.tn/2', 'FACT', 'VERIFIED'),
            ('EV-AUTO-VALID', 'migration', 'Naufrage a Zarzis garde maritime Tunisie', 'Sauvetage migrants', '2026-08-01', '2026-08-01', '2026-08-01', 'FTDES', 'ftdes.net', 'ngo', 'https://ftdes.net/3', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        report = audit_legacy_evidence(db_path=self.temp_db_path)
        self.assertEqual(report["total_records_scanned"], 1)
        self.assertEqual(report["records"][0]["id"], "EV-AUTO-VALID")

    def test_canonical_issue_normalization(self):
        """Verifies normalization of legacy issue aliases like energy -> electricity."""
        self.assertEqual(normalize_issue("energy"), "electricity")
        self.assertEqual(normalize_issue("economy"), "work")
        self.assertEqual(normalize_issue("institutions"), "rights")
        self.assertEqual(normalize_issue("gabes"), "pollution")
        self.assertEqual(normalize_issue("water"), "water")

        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (
                id, issue, headline, summary, location, location_scope, governorate,
                published_at, collected_at, last_checked, source_name, source_domain,
                source_type, source_url, event_date, classification, status
            ) VALUES
            ('EV-AUTO-ENERGY-01', 'energy', 'STEG: Coupure d''electricite a Tunis', 'Maintenance reseau electrique', 'Tunis', 'GOVERNORATE', 'Tunis', '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/e1', '2026-08-01', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        report = audit_legacy_evidence(db_path=self.temp_db_path)
        rec = report["records"][0]
        self.assertEqual(rec["current_issue"], "electricity", "Legacy 'energy' normalized to 'electricity'")
        self.assertEqual(rec["proposed_issue"], "electricity")
        self.assertEqual(rec["decision"], "KEEP")

    def test_cli_json_export(self):
        """Verifies CLI execution with --db and --json-out."""
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (
                id, issue, headline, summary, location, location_scope, governorate,
                published_at, collected_at, last_checked, source_name, source_domain,
                source_type, source_url, event_date, classification, status
            ) VALUES
            ('EV-AUTO-01', 'water', 'SONEDE: Coupure d''eau a Tunis', 'Panne reseau eau potable', 'Tunis', 'GOVERNORATE', 'Tunis', '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/1', '2026-08-01', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        json_out_file = tempfile.NamedTemporaryFile(suffix=".json", delete=False)
        json_out_path = json_out_file.name
        json_out_file.close()

        try:
            test_args = ["audit_legacy_evidence.py", "--db", self.temp_db_path, "--json-out", json_out_path]
            with patch.object(sys, "argv", test_args):
                audit_main()

            self.assertTrue(os.path.exists(json_out_path))
            with open(json_out_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.assertEqual(data["total_records_scanned"], 1)
            self.assertEqual(data["summary"]["KEEP"], 1)
            self.assertEqual(len(data["records"]), 1)
            self.assertEqual(data["records"][0]["id"], "EV-AUTO-01")

        finally:
            if os.path.exists(json_out_path):
                try:
                    os.unlink(json_out_path)
                except OSError:
                    pass

    def test_no_apply_flag_exists(self):
        """Proves that passing --apply fails argument parsing because no write mode exists."""
        test_args = ["audit_legacy_evidence.py", "--db", self.temp_db_path, "--apply"]
        with patch.object(sys, "argv", test_args):
            with self.assertRaises(SystemExit):
                audit_main()

    def test_safety_correction_all_cases_A_through_G(self):
        """
        Explicitly verifies the safety correction rules across all seven required cases:
        A. Relevant Tunisia article with low confidence -> REVIEW_REQUIRED, NOT EXCLUDE
        B. Relevant Tunisia article with confidence 0.55 -> REVIEW_REQUIRED
        C. Foreign-only article -> EXCLUDE regardless of classification confidence
        D. Sports article -> EXCLUDE
        E. Generic/navigation article -> EXCLUDE
        F. High-confidence valid article with wrong current issue -> RECLASSIFY
        G. High-confidence valid article with correct current issue -> KEEP
        """
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (
                id, issue, headline, summary, location, location_scope, governorate,
                published_at, collected_at, last_checked, source_name, source_domain,
                source_type, source_url, event_date, classification, status
            ) VALUES
            -- Case A: Relevant Tunisia article with low/zero classification confidence -> REVIEW_REQUIRED
            ('EV-AUTO-CASE-A', 'public_services', 'Rapport trimestriel d''observation citoyenne en Tunisie', 'Bilan des initiatives citoyennes locales a Bizerte', 'Bizerte', 'GOVERNORATE', 'Bizerte', '2026-08-01', '2026-08-01', '2026-08-01', 'Nawaat', 'nawaat.org', 'independent', 'https://nawaat.org/a', '2026-08-01', 'ANALYSIS', 'UNDER REVIEW'),
            
            -- Case B: Relevant Tunisia article with confidence ~0.55 -> REVIEW_REQUIRED
            ('EV-AUTO-CASE-B', 'public_services', 'Avis aux usagers de la capitale Tunis', 'Perturbations signalees sur le reseau de transport urbain', 'Tunis', 'GOVERNORATE', 'Tunis', '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/b', '2026-08-01', 'FACT', 'VERIFIED'),
            
            -- Case C: Foreign-only article with strong issue keywords -> EXCLUDE
            ('EV-AUTO-CASE-C', 'electricity', 'Gaza power plant shuts down causing total electricity blackout', 'Power generation halted in the Gaza strip', 'Gaza', 'UNRESOLVED', NULL, '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/c', '2026-08-01', 'FACT', 'VERIFIED'),
            
            -- Case D: Sports article -> EXCLUDE
            ('EV-AUTO-CASE-D', 'work', 'Jeux mediterraneens: Medaille d''or pour la Tunisie en aviron', 'Victoire sportive historique', 'Tunis', 'GOVERNORATE', 'Tunis', '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/d', '2026-08-01', 'FACT', 'VERIFIED'),
            
            -- Case E: Generic/navigation article -> EXCLUDE
            ('EV-AUTO-CASE-E', 'water', 'Rapports d''activites', 'Publications annuelles', 'Tunisia', 'NATIONAL', NULL, '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/e', '2026-08-01', 'FACT', 'VERIFIED'),
            
            -- Case F: High-confidence valid article with wrong current issue -> RECLASSIFY
            ('EV-AUTO-CASE-F', 'work', 'SONEDE: Coupure d''eau potable dans plusieurs zones a Kasserine', 'Interruption de distribution d''eau', 'Kasserine', 'GOVERNORATE', 'Kasserine', '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/f', '2026-08-01', 'FACT', 'VERIFIED'),
            
            -- Case G: High-confidence valid article with correct current issue -> KEEP
            ('EV-AUTO-CASE-G', 'water', 'SONEDE: Coupure d''eau potable a Kasserine', 'Interruption de distribution d''eau', 'Kasserine', 'GOVERNORATE', 'Kasserine', '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/g', '2026-08-01', 'FACT', 'VERIFIED')
        """)
        conn.commit()
        conn.close()

        report = audit_legacy_evidence(db_path=self.temp_db_path)
        self.assertEqual(report["total_records_scanned"], 7)

        by_id = {r["id"]: r for r in report["records"]}

        # Case A: Low confidence Tunisia article -> REVIEW_REQUIRED (NOT EXCLUDE)
        self.assertEqual(by_id["EV-AUTO-CASE-A"]["decision"], "REVIEW_REQUIRED")
        self.assertNotEqual(by_id["EV-AUTO-CASE-A"]["decision"], "EXCLUDE")

        # Case B: Borderline confidence Tunisia article -> REVIEW_REQUIRED
        self.assertEqual(by_id["EV-AUTO-CASE-B"]["decision"], "REVIEW_REQUIRED")

        # Case C: Foreign wire article -> EXCLUDE
        self.assertEqual(by_id["EV-AUTO-CASE-C"]["decision"], "EXCLUDE")
        self.assertIn("Tunisia-context", by_id["EV-AUTO-CASE-C"]["reason"])

        # Case D: Sports article -> EXCLUDE
        self.assertEqual(by_id["EV-AUTO-CASE-D"]["decision"], "EXCLUDE")
        self.assertIn("Non-substantive", by_id["EV-AUTO-CASE-D"]["reason"])

        # Case E: Generic/navigation article -> EXCLUDE
        self.assertEqual(by_id["EV-AUTO-CASE-E"]["decision"], "EXCLUDE")
        self.assertIn("Non-substantive", by_id["EV-AUTO-CASE-E"]["reason"])

        # Case F: Wrong issue -> RECLASSIFY
        self.assertEqual(by_id["EV-AUTO-CASE-F"]["decision"], "RECLASSIFY")
        self.assertEqual(by_id["EV-AUTO-CASE-F"]["current_issue"], "work")
        self.assertEqual(by_id["EV-AUTO-CASE-F"]["proposed_issue"], "water")

        # Case G: Correct issue -> KEEP
        self.assertEqual(by_id["EV-AUTO-CASE-G"]["decision"], "KEEP")
        self.assertEqual(by_id["EV-AUTO-CASE-G"]["current_issue"], "water")
        self.assertEqual(by_id["EV-AUTO-CASE-G"]["proposed_issue"], "water")


if __name__ == "__main__":
    unittest.main()
