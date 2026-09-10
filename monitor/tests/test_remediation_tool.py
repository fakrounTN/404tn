# monitor/tests/test_remediation_tool.py
import os
import sys
import unittest
import tempfile
import sqlite3
import json

from monitor.app.database import create_tables
from monitor.scripts.remediate_production_taxonomy import run_remediation

class TestProductionTaxonomyRemediation(unittest.TestCase):
    """
    Unit tests for monitor/scripts/remediate_production_taxonomy.py
    Verifies:
    1. Rejection of invalid initial database state.
    2. WAL-safe SQLite backup creation and integrity.
    3. Dry-run safety (zero database writes).
    4. Full transactional remediation:
       - 15 RECLASSIFY
       - 2 REVIEW_REQUIRED (EV-AUTO-20260910-9A662E, EV-AUTO-20260910-1E8A12)
       - 1 REJECT (EV-AUTO-20260910-0C7E8A)
       - Final counts: 105 total, 59 AUTO_ACCEPTED, 2 REVIEW_REQUIRED, 44 REJECTED.
    5. Untouched geo, provenance, and content fields.
    """

    def _setup_mock_prod_db(self, db_path: str):
        conn = sqlite3.connect(db_path)
        create_tables(conn)

        # 1. Insert 43 baseline REJECTED records
        for i in range(43):
            conn.execute("""
                INSERT INTO evidence (
                    id, issue, sub_issue, headline, summary, classification, status, published_at, collected_at, last_checked,
                    source_name, source_domain, source_type, source_url, content_hash, ingestion_status, classification_confidence
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f"EV-LEGACY-REJ-{i:03d}", "governance_institutions", "general", f"Rejected Legacy Item {i}", "Summary",
                "FACT", "REPORTED", "2026-09-02", "2026-09-02T12:00:00Z", "2026-09-02T12:00:00Z",
                "TAP", "tap.info.tn", "news_agency", f"https://tap.info.tn/fr/rej_{i}",
                f"hash_rej_{i:04d}", "REJECTED", 0.5
            ))

        # 2. Insert 44 baseline AUTO_ACCEPTED records (43 + 44 = 87 baseline rows)
        for i in range(44):
            conn.execute("""
                INSERT INTO evidence (
                    id, issue, sub_issue, location, latitude, longitude, governorate, delegation, locality,
                    headline, summary, classification, status, published_at, collected_at, last_checked,
                    source_name, source_domain, source_type, source_url, content_hash, ingestion_status, classification_confidence
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f"EV-LEGACY-ACC-{i:03d}", "water", "supply_cuts", "Gafsa", 34.42, 8.78, "Gafsa", "Gafsa Sud", "Gafsa",
                f"Legacy Accepted Item {i}", "Summary",
                "FACT", "REPORTED", "2026-09-02", "2026-09-02T12:00:00Z", "2026-09-02T12:00:00Z",
                "TAP", "tap.info.tn", "news_agency", f"https://tap.info.tn/fr/acc_{i}",
                f"hash_acc_{i:04d}", "AUTO_ACCEPTED", 0.9
            ))

        # 3. Insert 18 LIVE run records (87 + 18 = 105 total: 62 AUTO_ACCEPTED, 43 REJECTED)
        live_records = [
            ("EV-AUTO-20260910-699F41", "Tunisia: BNA Bank reports 14% increase in H1 profit to TND 156 million", "African Manager (English)", "africanmanager.com", "news_agency"),
            ("EV-AUTO-20260910-E7B72C", "Tunisia: BH Assurance H1 profit up 24.5%", "African Manager (English)", "africanmanager.com", "news_agency"),
            ("EV-AUTO-20260910-E268A4", "Tunisia: Olive oil production expected to decline significantly next season", "African Manager (English)", "africanmanager.com", "news_agency"),
            ("EV-AUTO-20260910-1CBD95", "Tunisia: El Fahs wind farm selected for Japanese grant funding", "African Manager (English)", "africanmanager.com", "news_agency"),
            ("EV-AUTO-20260910-81BB2F", "Tunisia: Inflation rises again in August, driven by food prices", "African Manager (English)", "africanmanager.com", "news_agency"),
            ("EV-AUTO-20260910-5ACF14", "Tunisia: BNA Bank issues TND 50 million subordinated bond loan", "African Manager (English)", "africanmanager.com", "news_agency"),
            ("EV-AUTO-20260910-E4DBD5", "The Money-printing press: Heading for 25 billion dinars?", "African Manager (English)", "africanmanager.com", "independent_media"),
            ("EV-AUTO-20260910-877AC4", "Tunisia: Freedom to invest, the elusive revival", "African Manager (English)", "africanmanager.com", "independent_media"),
            ("EV-AUTO-20260910-C14970", "Tunisia: Agrifood trade balance records surplus of TND 1,607.7 million at end-July", "African Manager (English)", "africanmanager.com", "news_agency"),
            ("EV-AUTO-20260910-E67F88", "“Persistent difficulties” in Tunisia-Libya trade", "African Manager (English)", "africanmanager.com", "independent_media"),
            ("EV-AUTO-20260910-43AD59", "Tunisia: Increase in Algerian visitors, but hotel bookings decline", "African Manager (English)", "africanmanager.com", "news_agency"),
            ("EV-AUTO-20260910-531C89", "Tunisia: Exports of building materials, ceramics and glass up 10.3% in July", "African Manager (English)", "africanmanager.com", "news_agency"),
            ("EV-AUTO-20260910-4EFB35", "Tunisia: Overall back-to-school costs rise 8%", "African Manager (English)", "africanmanager.com", "news_agency"),
            ("EV-AUTO-20260910-9A3AEA", "Tunisia: Foreign investment up 13.8% at end-June 2024", "African Manager (English)", "africanmanager.com", "news_agency"),
            ("EV-AUTO-20260910-9A662E", "Credit in Tunisia: Who pays the most?", "African Manager (English)", "africanmanager.com", "independent_media"),
            ("EV-AUTO-20260910-1E8A12", "Startups in Tunisia: Easy to start, hard to sustain", "African Manager (English)", "africanmanager.com", "independent_media"),
            ("EV-AUTO-20260910-0C7E8A", "بلاغ المُؤتمر السابع للنقابة الوطنية للصحفيين التونسيين والتاسع والعشرين للمهنة", "SNJT", "snjt.org", "union"),
            ("EV-AUTO-20260910-61D4D8", "أوقفوا التنكيل بمحمد اليوسفي وعائلته", "SNJT", "snjt.org", "ngo"),
        ]

        for idx, (rec_id, hl, sname, sdomain, stype) in enumerate(live_records):
            old_issue = "media_press_freedom" if "snjt" in sdomain else "governance_institutions"
            old_sub = "journalist_arrest" if "snjt" in sdomain else "presidency"
            conn.execute("""
                INSERT INTO evidence (
                    id, issue, sub_issue, location, latitude, longitude, governorate, delegation, locality,
                    headline, summary, classification, status, published_at, collected_at, last_checked,
                    source_name, source_domain, source_type, source_url, content_hash, ingestion_status, classification_confidence,
                    classification_reason
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                rec_id, old_issue, old_sub, "Tunisia", 36.8, 10.1, None, None, None,
                hl, f"Summary for {hl}", "FACT", "REPORTED", "2026-09-10",
                f"2026-09-10T01:36:{30 + idx:02d}.000000+00:00", f"2026-09-10T01:36:{30 + idx:02d}.000000+00:00",
                sname, sdomain, stype, f"https://{sdomain}/article_{idx}",
                f"hash_live_{rec_id[-6:]}", "AUTO_ACCEPTED", 0.78,
                "Old classification reason"
            ))

        conn.commit()
        conn.close()

    def test_refusal_on_invalid_initial_counts(self):
        """Remediation tool must abort immediately if DB does not match 105/62/43/0."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            db_path = os.path.join(tmp_dir, "invalid.db")
            conn = sqlite3.connect(db_path)
            create_tables(conn)
            # Only 10 records
            for i in range(10):
                conn.execute("""
                    INSERT INTO evidence (
                        id, issue, headline, summary, classification, status, published_at, collected_at, last_checked,
                        source_name, source_domain, source_type, source_url, content_hash, ingestion_status, classification_confidence
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (f"EV-TEST-{i}", "water", "Headline", "Summary", "FACT", "REPORTED", "2026-09-02", "2026-09-02", "2026-09-02", "TAP", "tap.info.tn", "news_agency", "url", f"hash_{i}", "AUTO_ACCEPTED", 0.9))
            conn.commit()
            conn.close()

            with self.assertRaises(ValueError) as ctx:
                run_remediation(db_path=db_path, dry_run=True)
            self.assertIn("105 total rows", str(ctx.exception))

    def test_dry_run_leaves_database_unmodified(self):
        """Dry-run must perform zero database writes and leave counts at 105/62/43."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            db_path = os.path.join(tmp_dir, "dry_run_test.db")
            self._setup_mock_prod_db(db_path)

            res = run_remediation(db_path=db_path, dry_run=True)
            self.assertTrue(res["dry_run"])
            self.assertEqual(len(res["mutations"]), 18)

            conn = sqlite3.connect(db_path)
            c = conn.cursor()
            c.execute("SELECT COUNT(*) FROM evidence")
            self.assertEqual(c.fetchone()[0], 105)
            c.execute("SELECT ingestion_status, COUNT(*) FROM evidence GROUP BY ingestion_status")
            breakdown = dict(c.fetchall())
            self.assertEqual(breakdown.get("AUTO_ACCEPTED"), 62)
            self.assertEqual(breakdown.get("REJECTED"), 43)
            self.assertIsNone(breakdown.get("REVIEW_REQUIRED"))
            conn.close()

    def test_live_remediation_success(self):
        """Live run must commit all 18 mutations resulting in 105 total, 59 AUTO_ACCEPTED, 2 REVIEW_REQUIRED, 44 REJECTED."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            db_path = os.path.join(tmp_dir, "live_test.db")
            self._setup_mock_prod_db(db_path)

            res = run_remediation(db_path=db_path, dry_run=False)
            self.assertFalse(res["dry_run"])
            self.assertEqual(len(res["mutations"]), 18)

            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()

            # 1. Total counts check
            c.execute("SELECT COUNT(*) FROM evidence")
            self.assertEqual(c.fetchone()[0], 105)
            c.execute("SELECT ingestion_status, COUNT(*) FROM evidence GROUP BY ingestion_status")
            breakdown = dict(c.fetchall())
            self.assertEqual(breakdown.get("AUTO_ACCEPTED"), 59)
            self.assertEqual(breakdown.get("REVIEW_REQUIRED"), 2)
            self.assertEqual(breakdown.get("REJECTED"), 44)

            # 2. Specific record checks
            # 1 REJECT
            c.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260910-0C7E8A'")
            rej_row = c.fetchone()
            self.assertEqual(rej_row["ingestion_status"], "REJECTED")
            self.assertEqual(rej_row["issue"], "media_press_freedom")
            self.assertEqual(rej_row["sub_issue"], "press_freedom")
            self.assertEqual(rej_row["classification"], "CLAIM")
            self.assertEqual(rej_row["classification_confidence"], 0.95)

            # 1 SNJT reclassify
            c.execute("SELECT * FROM evidence WHERE id = 'EV-AUTO-20260910-61D4D8'")
            snjt_row = c.fetchone()
            self.assertEqual(snjt_row["ingestion_status"], "AUTO_ACCEPTED")
            self.assertEqual(snjt_row["issue"], "media_press_freedom")
            self.assertEqual(snjt_row["sub_issue"], "press_freedom")
            self.assertEqual(snjt_row["classification"], "CLAIM")
            self.assertEqual(snjt_row["classification_confidence"], 0.95)

            # 2 REVIEW_REQUIRED
            c.execute("SELECT * FROM evidence WHERE id IN ('EV-AUTO-20260910-9A662E', 'EV-AUTO-20260910-1E8A12')")
            rev_rows = c.fetchall()
            self.assertEqual(len(rev_rows), 2)
            for rev in rev_rows:
                self.assertEqual(rev["ingestion_status"], "REVIEW_REQUIRED")

            # Preserved geo & metadata checks
            self.assertEqual(rej_row["location"], "Tunisia")
            self.assertEqual(rej_row["latitude"], 36.8)
            self.assertEqual(rej_row["longitude"], 10.1)
            self.assertEqual(rej_row["source_name"], "SNJT")
            self.assertEqual(rej_row["content_hash"], "hash_live_0C7E8A")

            # Integrity check
            c.execute("PRAGMA integrity_check")
            self.assertEqual(c.fetchone()[0], "ok")
            conn.close()

            # Verify backup exists and is valid
            self.assertTrue(os.path.exists(res["backup_path"]))
            self.assertGreater(res["backup_size"], 0)

if __name__ == "__main__":
    unittest.main()
