# monitor/tests/test_normalizer_quality.py
import unittest
from monitor.app.services.normalizer import (
    normalize_encoding_and_entities,
    strip_html_and_markup,
    strip_boilerplate_and_wrappers,
    normalize_headline,
    evaluate_content_quality,
    detect_language,
    clean_and_normalize_text
)


class TestNormalizerQuality(unittest.TestCase):

    def test_01_html_entity_unescaping(self):
        """Test HTML entity unescaping handles named, decimal, and hex entities."""
        raw = "Soci&eacute;t&eacute; nationale d&#8217;exploitation &amp; de distribution &quot;SONEDE&quot; &#x2014; Tunis"
        cleaned = normalize_encoding_and_entities(raw)
        self.assertEqual(cleaned, 'Société nationale d’exploitation & de distribution "SONEDE" — Tunis')

    def test_02_strip_html_and_markup(self):
        """Test strip_html_and_markup removes script, style, images, WordPress shortcodes, and webfeeds visuals."""
        raw = """
        <style>.wp-block-image { max-width: 100%; }</style>
        <div class="webfeedsFeaturedVisual"><img src="https://example.com/banner.jpg" alt="banner" /></div>
        <p>Une importante perturbation dans la distribution d'eau potable a été constatée à Gafsa.</p>
        [caption id="attachment_123" align="alignnone" width="600"]Manifestation[/caption]
        <script>console.log("analytics");</script>
        """
        cleaned = strip_html_and_markup(raw)
        self.assertNotIn("<style>", cleaned)
        self.assertNotIn("<script>", cleaned)
        self.assertNotIn("webfeedsFeaturedVisual", cleaned)
        self.assertNotIn("[caption", cleaned)
        self.assertIn("Une importante perturbation", cleaned)
        self.assertIn("Gafsa", cleaned)

    def test_03_ftdes_wrapper_stripping(self):
        """Test strip_boilerplate_and_wrappers removes multilingual FTDES fallback messages."""
        ftdes_raw = (
            "Sorry, this entry is only available in French. "
            "Désolé, cet article est seulement disponible en Français. "
            "Rapport mensuel sur les mouvements sociaux et les protestations ouvrières dans le bassin minier."
        )
        cleaned = strip_boilerplate_and_wrappers(ftdes_raw)
        self.assertNotIn("Sorry, this entry is only available", cleaned)
        self.assertNotIn("Désolé, cet article est seulement disponible", cleaned)
        self.assertIn("Rapport mensuel sur les mouvements sociaux", cleaned)

    def test_04_government_address_and_contact_stripping(self):
        """Test strip_boilerplate_and_wrappers strips official contact info, emails, postal codes, and telephone numbers."""
        gov_raw = """
        بلاغ حول متابعة تزويد السوق بالمواد الأساسية.
        قررت وزارة التجارة اتخاذ جملة من الإجراءات للحد من المضاربة والتحكم في الأسعار.
        العنوان : نهج الهادي نويرة 1020 تونس
        الهاتف : 71.354.444
        البريد الإلكتروني : boc@pm.gov.tn
        Copyright © 2026 Tous droits réservés.
        """
        cleaned = strip_boilerplate_and_wrappers(gov_raw)
        self.assertNotIn("boc@pm.gov.tn", cleaned)
        self.assertNotIn("71.354.444", cleaned)
        self.assertNotIn("Copyright ©", cleaned)
        self.assertNotIn("العنوان :", cleaned)
        self.assertIn("بلاغ حول متابعة تزويد السوق", cleaned)

    def test_05_headline_branding_cleanup(self):
        """Test normalize_headline strips trailing publisher branding suffixes."""
        cases = [
            ("Coupure d'eau à Sfax - TAP", "Coupure d'eau à Sfax"),
            ("Arrestation d'un contrebandier | Nawaat", "Arrestation d'un contrebandier"),
            ("Crise du phosphate : reprise des négociations | Webdo", "Crise du phosphate : reprise des négociations"),
            ("Hausse des prix de l'huile - Tunisie Numérique", "Hausse des prix de l'huile"),
            ("تقرير حول الاحتجاجات الاجتماعية - المنتدى التونسي للحقوق الاقتصادية والاجتماعية", "تقرير حول الاحتجاجات الاجتماعية"),
            ("Normal Headline Without Suffix", "Normal Headline Without Suffix")
        ]
        for raw, expected in cases:
            self.assertEqual(normalize_headline(raw), expected)

    def test_06_content_quality_scoring_categories(self):
        """Test evaluate_content_quality assigns GOOD, PARTIAL, LOW, EMPTY based on clean content length and ratio."""
        # Empty
        q_empty = evaluate_content_quality("", "")
        self.assertEqual(q_empty.content_quality, "EMPTY")
        self.assertEqual(q_empty.clean_text_length, 0)

        # Low (< 60 chars or massive boilerplate)
        q_low = evaluate_content_quality("Breaking", "SONEDE info.")
        self.assertEqual(q_low.content_quality, "LOW")

        # Partial (60 to 180 chars)
        q_partial = evaluate_content_quality(
            "Coupure d'eau a Ben Arous",
            "La SONEDE annonce des coupures d'eau potable programmées dans plusieurs délégations du gouvernorat de Ben Arous ce mardi."
        )
        self.assertEqual(q_partial.content_quality, "PARTIAL")

        # Good (>= 180 chars)
        good_headline = "SONEDE: Perturbations et coupures d'eau potable dans plusieurs zones de Ben Arous"
        good_summary = (
            "La Société Nationale d'Exploitation et de Distribution des Eaux (SONEDE) a annoncé qu'une perturbation "
            "et une coupure dans la distribution de l'eau potable seront enregistrées à partir de mercredi à 8h dans plusieurs zones "
            "du gouvernorat de Ben Arous. Ces perturbations sont dues à des travaux de raccordement d'une conduite principale."
        )
        q_good = evaluate_content_quality(good_headline, good_summary)
        self.assertEqual(q_good.content_quality, "GOOD")
        self.assertGreaterEqual(q_good.clean_text_length, 180)

    def test_07_language_detection(self):
        """Test detect_language accurately identifies Arabic, French, and English."""
        self.assertEqual(detect_language("انقطاع مياه الشرب في قفصة"), "ar")
        self.assertEqual(detect_language("Coupure d'eau potable dans le gouvernorat de Sousse"), "fr")
        self.assertEqual(detect_language("Water supply disruption in Gafsa governorate"), "en")


if __name__ == "__main__":
    unittest.main()
