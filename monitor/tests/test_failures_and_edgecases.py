import unittest
from unittest.mock import MagicMock, patch
import httpx
from monitor.app.collectors.base import BaseCollector, DiscoveryMetrics
from monitor.app.collectors.tap import TAPCollector
from monitor.app.collectors.rss import RSSCollector
from monitor.app.collectors.html import HTMLCollector

class TestEdgeCasesAndFailureIsolation(unittest.TestCase):
    def test_malformed_html_parsing(self):
        collector = TAPCollector({"id": "tap_malformed", "name": "TAP Malformed", "domain": "tap.info.tn"})
        malformed_html = "<html><head><title>Unclosed title<body><p>Random broken text<div"
        # Should gracefully return None or handle without crashing
        cand = collector._parse_article(malformed_html, "https://www.tap.info.tn/en/bad-url")
        self.assertTrue(cand is None or cand.headline != "")

    def test_missing_date_handling(self):
        collector = TAPCollector({"id": "tap_no_date", "name": "TAP No Date", "domain": "tap.info.tn"})
        html_without_date = """
        <html>
        <head><meta property="og:title" content="Article Without Any Date" /></head>
        <body><p>Paragraph without dateline or date text.</p></body>
        </html>
        """
        cand = collector._parse_article(html_without_date, "https://www.tap.info.tn/en/no-date")
        self.assertIsNotNone(cand)
        self.assertIsNone(cand.published_at)

    def test_http_404_handling(self):
        collector = HTMLCollector({"id": "html_404", "name": "404 Source", "domain": "example.com", "urls": ["https://httpbin.org/status/404"]})
        # Mock client returning 404
        with patch.object(collector, "fetch_with_retry") as mock_fetch:
            mock_res = MagicMock()
            mock_res.status_code = 404
            mock_fetch.return_value = mock_res
            candidates, metrics = collector.collect()
            self.assertEqual(metrics.http_status, 404)
            self.assertEqual(len(candidates), 0)

    def test_http_500_handling(self):
        collector = HTMLCollector({"id": "html_500", "name": "500 Source", "domain": "example.com", "urls": ["https://httpbin.org/status/500"]})
        with patch.object(collector, "fetch_with_retry") as mock_fetch:
            mock_res = MagicMock()
            mock_res.status_code = 500
            mock_fetch.return_value = mock_res
            candidates, metrics = collector.collect()
            self.assertEqual(metrics.http_status, 500)
            self.assertEqual(len(candidates), 0)

    def test_network_timeout_isolation(self):
        collector = HTMLCollector({"id": "html_timeout", "name": "Timeout Source", "domain": "example.com", "urls": ["https://example.com/timeout"]})
        with patch.object(collector, "fetch_with_retry", side_effect=httpx.ConnectTimeout("Connection timed out")):
            candidates, metrics = collector.collect()
            self.assertEqual(len(candidates), 0)
            self.assertIn("timed out", str(metrics.last_error))
