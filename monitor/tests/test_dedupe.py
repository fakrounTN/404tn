# monitor/tests/test_dedupe.py
import sqlite3
import tempfile
import unittest
from monitor.app.database import create_tables
from monitor.app.services.dedupe import (
    compute_content_hash,
    compute_headline_fingerprint,
    is_duplicate,
    is_duplicate_layered,
    is_duplicate_detailed
)

class TestDedupe(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.TemporaryDirectory()
        self.db_path = f"{self.test_dir.name}/test_dedupe.db"
        self.conn = sqlite3.connect(self.db_path)
        create_tables(self.conn)

        # Seed sample evidence record
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO evidence (
                id, issue, headline, summary, source_name, source_domain, source_type, source_url,
                classification, status, event_date, published_at, collected_at, last_checked,
                content_hash, ingestion_status
            ) VALUES (
                'EV-AUTO-20260909-001', 'water', 'Coupure d eau a Sfax', 'Details on water cut',
                'TAP', 'tap.info.tn', 'news_agency', 'https://www.tap.info.tn/fr/coupure-eau-sfax-20567',
                'FACT', 'VERIFIED', '2026-09-09T10:00:00Z', '2026-09-09T10:00:00Z',
                '2026-09-09T11:00:00Z', '2026-09-09T11:00:00Z',
                'hash-sfax-water-001', 'AUTO_ACCEPTED'
            )
        """)
        self.conn.commit()

    def tearDown(self):
        self.conn.close()
        self.test_dir.cleanup()

    def test_compute_content_hash(self):
        text1 = "SONEDE announces emergency rationing in Grand Tunis."
        text2 = "  sonede announces   emergency rationing in grand tunis.  "
        self.assertEqual(compute_content_hash(text1), compute_content_hash(text2))

    def test_headline_fingerprint(self):
        h1 = "Water Cuts Reported in Kasserine: Sbeitla Protests!"
        h2 = "Protests in Kasserine: Water Cuts Reported Sbeitla"
        self.assertEqual(compute_headline_fingerprint(h1), compute_headline_fingerprint(h2))

    def test_layer_1_canonical_url_match(self):
        """Layer 1: Exact canonical URL match triggers duplicate detection and returns matching ID."""
        is_dup, reason, dup_of = is_duplicate_detailed(
            canonical_url="https://www.tap.info.tn/fr/coupure-eau-sfax-20567",
            content_hash="different-hash-123",
            headline="Different headline",
            source_domain="tap.info.tn",
            conn=self.conn
        )
        self.assertTrue(is_dup)
        self.assertEqual(reason, "LAYER_1_CANONICAL_URL_MATCH")
        self.assertEqual(dup_of, "EV-AUTO-20260909-001")

    def test_layer_2_source_native_id_match(self):
        """Layer 2: Source native ID match on same domain."""
        is_dup, reason, dup_of = is_duplicate_detailed(
            canonical_url="https://www.tap.info.tn/fr/article-different-slug-20567",
            content_hash="different-hash-123",
            headline="Different headline",
            source_domain="tap.info.tn",
            source_native_id="20567",
            conn=self.conn
        )
        self.assertTrue(is_dup)
        self.assertEqual(reason, "LAYER_2_SOURCE_NATIVE_ID_MATCH")
        self.assertEqual(dup_of, "EV-AUTO-20260909-001")

    def test_layer_3_normalized_url_match(self):
        """Layer 3: Scheme/tracking-stripped normalized URL match."""
        is_dup, reason, dup_of = is_duplicate_detailed(
            canonical_url="http://tap.info.tn/fr/coupure-eau-sfax-20567?utm_source=rss&utm_medium=feed",
            content_hash="different-hash-123",
            headline="Different headline",
            source_domain="tap.info.tn",
            conn=self.conn
        )
        self.assertTrue(is_dup)
        self.assertEqual(reason, "LAYER_3_NORMALIZED_URL_MATCH")
        self.assertEqual(dup_of, "EV-AUTO-20260909-001")

    def test_layer_4_headline_same_domain_match(self):
        """Layer 4: Exact headline match from the same publisher domain."""
        is_dup, reason, dup_of = is_duplicate_detailed(
            canonical_url="https://www.tap.info.tn/fr/another-article-link",
            content_hash="different-hash-456",
            headline="Coupure d eau a Sfax",
            source_domain="tap.info.tn",
            conn=self.conn
        )
        self.assertTrue(is_dup)
        self.assertEqual(reason, "LAYER_4_HEADLINE_MATCH_SAME_DOMAIN")
        self.assertEqual(dup_of, "EV-AUTO-20260909-001")

    def test_layer_5_content_hash_match(self):
        """Layer 5: Exact content hash match on same domain."""
        is_dup, reason, dup_of = is_duplicate_detailed(
            canonical_url="https://www.tap.info.tn/fr/new-unique-url",
            content_hash="hash-sfax-water-001",
            headline="Different headline entirely",
            source_domain="tap.info.tn",
            conn=self.conn
        )
        self.assertTrue(is_dup)
        self.assertEqual(reason, "LAYER_5_CONTENT_HASH_SAME_DOMAIN")
        self.assertEqual(dup_of, "EV-AUTO-20260909-001")

    def test_cross_domain_different_publisher_not_deduplicated(self):
        """Same headline/content from a DIFFERENT publisher domain is NOT collapsed."""
        is_dup, reason, dup_of = is_duplicate_detailed(
            canonical_url="https://www.nawaat.org/fr/coupure-eau-sfax-analyse",
            content_hash="hash-sfax-water-001",
            headline="Coupure d eau a Sfax",
            source_domain="nawaat.org",
            conn=self.conn
        )
        self.assertFalse(is_dup)
        self.assertIsNone(reason)
        self.assertIsNone(dup_of)

    def test_distinct_publisher_reprint_preserves_provenance(self):
        """A new article with new URL and headline is NOT collapsed."""
        is_dup, reason = is_duplicate_layered(
            canonical_url="https://www.webdo.tn/fr/actualite/societe/eau-sfax",
            content_hash="hash-webdo-different-body",
            headline="Webdo: Report on Sfax situation",
            source_domain="webdo.tn",
            conn=self.conn
        )
        self.assertFalse(is_dup)
        self.assertIsNone(reason)

if __name__ == "__main__":
    unittest.main()
