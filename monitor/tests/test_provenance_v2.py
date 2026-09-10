# monitor/tests/test_provenance_v2.py
import unittest
import base64
from monitor.app.services.provenance import (
    determine_source_tier, unwrap_google_news_url,
    extract_domain, resolve_evidence_provenance
)

class TestProvenanceV2(unittest.TestCase):

    def test_determine_source_tiers(self):
        # TIER 1
        self.assertEqual(determine_source_tier("pm.gov.tn"), "TIER_1")
        self.assertEqual(determine_source_tier("ins.tn"), "TIER_1")
        self.assertEqual(determine_source_tier("onagri.nat.tn"), "TIER_1")
        self.assertEqual(determine_source_tier("pubmed.ncbi.nlm.nih.gov"), "TIER_1")

        # TIER 2
        self.assertEqual(determine_source_tier("tap.info.tn"), "TIER_2")
        self.assertEqual(determine_source_tier("inkyfada.com"), "TIER_2")
        self.assertEqual(determine_source_tier("nawaat.org"), "TIER_2")
        self.assertEqual(determine_source_tier("reuters.com"), "TIER_2")

        # TIER 3
        self.assertEqual(determine_source_tier("ftdes.net"), "TIER_3")
        self.assertEqual(determine_source_tier("snjt.org"), "TIER_3")
        self.assertEqual(determine_source_tier("ugtt.org.tn"), "TIER_3")

        # TIER 4
        self.assertEqual(determine_source_tier("unknown-aggregator-xyz.com"), "TIER_4")

    def test_extract_domain(self):
        self.assertEqual(extract_domain("https://www.tap.info.tn/fr/Portail-Politique/123"), "tap.info.tn")
        self.assertEqual(extract_domain("http://nawaat.org/2026/09/article"), "nawaat.org")
        self.assertEqual(extract_domain("https://ins.tn:443/publications"), "ins.tn")

    def test_unwrap_google_news_query_url(self):
        gn_url = "https://news.google.com/rss/articles?url=https%3A%2F%2Finkyfada.com%2Ffr%2F2026%2F09%2Fdecret-54"
        unwrapped = unwrap_google_news_url(gn_url)
        self.assertEqual(unwrapped, "https://inkyfada.com/fr/2026/09/decret-54")

    def test_unwrap_google_news_base64_payload(self):
        target = b"https://nawaat.org/2026/09/10/poursuite-journaliste/"
        # Construct synthetic CBMi token
        payload = b"\x08\x13" + target + b"\x18\x01"
        encoded = "CBMi" + base64.urlsafe_b64encode(payload).decode("utf-8").replace("=", "")
        gn_url = f"https://news.google.com/rss/articles/{encoded}?hl=fr&gl=TN"
        
        unwrapped = unwrap_google_news_url(gn_url)
        self.assertEqual(unwrapped, "https://nawaat.org/2026/09/10/poursuite-journaliste/")

    def test_resolve_evidence_provenance_separation(self):
        raw_gn_link = "https://news.google.com/rss/articles?url=https%3A%2F%2Fwww.tap.info.tn%2Ffr%2FPortal-Regions%2F190011"
        prov = resolve_evidence_provenance(
            url=raw_gn_link,
            source_name="TAP News",
            discovery_provider="google_news_rss",
            discovery_query="Tunisie coupure eau",
            discovery_url=raw_gn_link
        )

        # Ensure canonical source is the original publisher, NOT Google News
        self.assertEqual(prov.source_domain, "tap.info.tn")
        self.assertEqual(prov.source_tier, "TIER_2")
        self.assertEqual(prov.canonical_url, "https://www.tap.info.tn/fr/Portal-Regions/190011")
        self.assertEqual(prov.discovery_provider, "google_news_rss")
        self.assertEqual(prov.discovery_query, "Tunisie coupure eau")
        self.assertEqual(prov.discovery_url, raw_gn_link)

if __name__ == "__main__":
    unittest.main()
