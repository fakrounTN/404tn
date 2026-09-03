import unittest
from monitor.app.services.dedupe import compute_content_hash, compute_headline_fingerprint

class TestDedupe(unittest.TestCase):
    def test_compute_content_hash(self):
        text1 = "SONEDE announces emergency rationing in Grand Tunis."
        text2 = "  sonede announces   emergency rationing in grand tunis.  "
        self.assertEqual(compute_content_hash(text1), compute_content_hash(text2))

    def test_headline_fingerprint(self):
        h1 = "Water Cuts Reported in Kasserine: Sbeitla Protests!"
        h2 = "Protests in Kasserine: Water Cuts Reported Sbeitla"
        self.assertEqual(compute_headline_fingerprint(h1), compute_headline_fingerprint(h2))
