# monitor/tests/test_collector_v2.py
import unittest
from unittest.mock import patch, MagicMock
from monitor.app.collectors.google_news import GoogleNewsDiscoveryCollector
from monitor.app.services.discovery import DiscoveryQuery

SAMPLE_RSS_XML = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Google News</title>
    <item>
      <title>Coupure d'eau potable dans plusieurs quartiers de Kasserine - TAP</title>
      <link>https://news.google.com/rss/articles?url=https%3A%2F%2Fwww.tap.info.tn%2Ffr%2Fcoupure-eau-kasserine</link>
      <description>La SONEDE a annonce une coupure de distribution d'eau potable a Kasserine.</description>
      <pubDate>Wed, 09 Sep 2026 14:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Poursuite d'un journaliste sous le decret 54 - Nawaat</title>
      <link>https://news.google.com/rss/articles?url=https%3A%2F%2Fnawaat.org%2F2026%2F09%2Fjournaliste-decret-54</link>
      <description>Le tribunal de premiere instance a ordonne la mise en depot selon le SNJT.</description>
      <pubDate>Wed, 09 Sep 2026 15:30:00 GMT</pubDate>
    </item>
  </channel>
</rss>
"""

class TestCollectorV2(unittest.TestCase):

    @patch("monitor.app.collectors.google_news.select_queries_for_run")
    @patch("monitor.app.collectors.google_news.record_query_execution_metrics")
    def test_google_news_collector_collection(self, mock_record, mock_select_queries):
        mock_select_queries.return_value = [
            DiscoveryQuery(
                id="core_water_fr_1",
                issue="water",
                language="fr",
                query_text="Tunisie coupure eau",
                query_type="CORE_TAXONOMY",
                priority=1,
                is_active=True
            )
        ]

        collector = GoogleNewsDiscoveryCollector({
            "id": "google_news_discovery",
            "max_queries": 1,
            "max_items_per_query": 10
        })

        # Mock HTTP client
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = SAMPLE_RSS_XML

        with patch.object(collector, "fetch_with_retry", return_value=mock_response):
            candidates, metrics = collector.collect()

            self.assertEqual(len(candidates), 2)
            self.assertEqual(metrics.items_discovered, 2)
            self.assertEqual(metrics.items_parsed, 2)

            # Candidate 1 validation
            c1 = candidates[0]
            self.assertIn("Coupure d'eau potable", c1.headline)
            self.assertEqual(c1.source_domain, "tap.info.tn")
            self.assertEqual(c1.canonical_url, "https://www.tap.info.tn/fr/coupure-eau-kasserine")
            self.assertEqual(c1.raw_metadata["discovery_provider"], "google_news_rss")
            self.assertEqual(c1.raw_metadata["discovery_query"], "Tunisie coupure eau")
            self.assertEqual(c1.raw_metadata["source_tier"], "TIER_2")

            # Candidate 2 validation
            c2 = candidates[1]
            self.assertIn("Poursuite d'un journaliste", c2.headline)
            self.assertEqual(c2.source_domain, "nawaat.org")
            self.assertEqual(c2.canonical_url, "https://nawaat.org/2026/09/journaliste-decret-54")
            self.assertEqual(c2.raw_metadata["source_tier"], "TIER_2")

if __name__ == "__main__":
    unittest.main()
