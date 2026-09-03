import unittest
from monitor.app.collectors.tap import TAPCollector

SAMPLE_TAP_HTML = """
<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="Gabes: Environmental Assessment of Industrial Runoff" />
  <meta property="og:url" content="https://www.tap.info.tn/en/Focus-Regions/12345-gabes-env" />
</head>
<body>
  <p>Gabes, August 15 (TAP) - An environmental audit was conducted today regarding phosphogypsum coastal impact.</p>
  <p>The regional delegation evaluated water quality indices and discussed remediation.</p>
</body>
</html>
"""

class TestTAP(unittest.TestCase):
    def test_tap_article_parser(self):
        collector = TAPCollector({"id": "tap_test", "name": "TAP Test", "domain": "tap.info.tn"})
        cand = collector._parse_article(SAMPLE_TAP_HTML, "https://www.tap.info.tn/en/Focus-Regions/12345-gabes-env?utm_source=feed")
        self.assertIsNotNone(cand)
        self.assertEqual(cand.headline, "Gabes: Environmental Assessment of Industrial Runoff")
        self.assertEqual(cand.canonical_url, "https://www.tap.info.tn/en/Focus-Regions/12345-gabes-env")
        self.assertIn("phosphogypsum coastal impact", cand.body)
        self.assertIsNotNone(cand.published_at)
