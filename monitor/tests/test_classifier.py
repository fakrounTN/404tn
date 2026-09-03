import unittest
from monitor.app.services.classifier import classify_issue, classify_epistemic

class TestClassifier(unittest.TestCase):
    def test_classify_issue_water(self):
        text = "SONEDE reports that northern dam storage volume is down to 21% amidst severe drought."
        self.assertEqual(classify_issue(text), "water")

    def test_classify_issue_gabes(self):
        text = "Fishermen in the Gulf of Gabès protest GCT phosphogypsum discharge near Chatt Essalam."
        self.assertEqual(classify_issue(text), "gabes")

    def test_classify_epistemic_decree(self):
        headline = "Publication of JORT Decree on Water Restrictions"
        body = "The official gazette published Décret n° 2026-45 concerning rationing."
        classification, status = classify_epistemic(headline, body, "official")
        self.assertEqual(classification, "FACT")
        self.assertEqual(status, "VERIFIED")

    def test_classify_epistemic_speech_claim(self):
        headline = "President Saied Stated Disruptions Were Sabotage"
        body = "In a meeting, the president a affirmé that supply shortages were engineered."
        classification, status = classify_epistemic(headline, body, "official")
        self.assertEqual(classification, "CLAIM")
        self.assertEqual(status, "OFFICIAL STATEMENT")

    def test_classify_neutral_fallback(self):
        headline = "Local Commentary on Civic Gathering"
        body = "A gathering took place in the central square."
        classification, status = classify_epistemic(headline, body, "unknown")
        self.assertEqual(status, "UNDER REVIEW")
