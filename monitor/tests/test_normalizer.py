import unittest
from monitor.app.services.normalizer import canonicalize_url, sanitize_text

class TestNormalizer(unittest.TestCase):
    def test_canonicalize_url_strips_tracking(self):
        raw = "https://WWW.TAP.INFO.TN/en/Portal-Politics/12345/?utm_source=twitter&utm_medium=social&fbclid=IwAR2#section"
        expected = "https://www.tap.info.tn/en/Portal-Politics/12345"
        self.assertEqual(canonicalize_url(raw), expected)

    def test_canonicalize_url_trailing_slash(self):
        raw = "https://ftdes.net/rapport-migration-2026//"
        expected = "https://ftdes.net/rapport-migration-2026"
        self.assertEqual(canonicalize_url(raw), expected)

    def test_sanitize_text(self):
        dirty = "   Headline with\n\n  newlines   and   tabs\t  "
        self.assertEqual(sanitize_text(dirty), "Headline with newlines and tabs")
