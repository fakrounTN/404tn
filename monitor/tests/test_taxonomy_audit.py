# monitor/tests/test_taxonomy_audit.py
import unittest
from monitor.app.services.taxonomy import classify_multi_axis, CANONICAL_PRIMARY_ISSUES
from monitor.app.services.classifier import is_substantive_evidence, classify_issue_advanced

class TestTaxonomyAudit(unittest.TestCase):
    """
    Regression and validation suite for Collector V2 post-live taxonomy audit.
    Verifies:
    1. Multi-lingual classification across economy, agriculture, energy, prices, rights.
    2. Substantive routine-admin filtering for union congresses and admin notices.
    3. Epistemic classification (FACT vs CLAIM vs ANALYSIS).
    4. Proper non-presidential handling of economy/agriculture/energy/prices.
    5. Substantive issue preservation when president is mentioned in context.
    """

    def test_canonical_taxonomy_intact(self):
        """Confirm all 21 canonical primary issues are present."""
        self.assertEqual(len(CANONICAL_PRIMARY_ISSUES), 21)
        self.assertIn("economy_public_finance", CANONICAL_PRIMARY_ISSUES)
        self.assertIn("agriculture", CANONICAL_PRIMARY_ISSUES)
        self.assertIn("gas_energy", CANONICAL_PRIMARY_ISSUES)
        self.assertIn("prices_cost_of_living", CANONICAL_PRIMARY_ISSUES)
        self.assertIn("rights_freedoms", CANONICAL_PRIMARY_ISSUES)
        self.assertIn("media_press_freedom", CANONICAL_PRIMARY_ISSUES)

    def test_bank_profits_classified_as_economy_fact(self):
        """Bank profits classified under economy_public_finance as FACT."""
        hl = "Tunisia: BNA Bank reports 14% increase in H1 profit to TND 156 million"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "economy_public_finance")
        self.assertEqual(res.classification, "FACT")
        self.assertGreaterEqual(res.confidence, 0.70)

    def test_insurance_profits_classified_as_economy_fact(self):
        """Insurance profits classified under economy_public_finance as FACT."""
        hl = "Tunisia: BH Assurance H1 profit up 24.5%"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "economy_public_finance")
        self.assertEqual(res.classification, "FACT")
        self.assertGreaterEqual(res.confidence, 0.70)

    def test_olive_oil_production_classified_as_agriculture_fact(self):
        """Olive oil production decline classified under agriculture as FACT."""
        hl = "Tunisia: Olive oil production expected to decline significantly next season"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "agriculture")
        self.assertEqual(res.sub_issue, "crops")
        self.assertEqual(res.classification, "FACT")
        self.assertGreaterEqual(res.confidence, 0.70)

    def test_back_to_school_costs_classified_as_prices_fact(self):
        """Back-to-school costs rise classified under prices_cost_of_living as FACT."""
        hl = "Tunisia: Overall back-to-school costs rise 8%"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "prices_cost_of_living")
        self.assertIn(res.sub_issue, ["household_costs", "purchasing_power"])
        self.assertEqual(res.classification, "FACT")
        self.assertIn("education", res.secondary_issues)
        self.assertGreaterEqual(res.confidence, 0.70)

    def test_inflation_and_food_prices_classified_as_prices_fact(self):
        """Inflation driven by food prices classified under prices_cost_of_living as FACT."""
        hl = "Tunisia: Inflation rises again in August, driven by food prices"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "prices_cost_of_living")
        self.assertIn(res.sub_issue, ["food_prices", "inflation"])
        self.assertEqual(res.classification, "FACT")
        self.assertIn("food_security", res.secondary_issues)
        self.assertGreaterEqual(res.confidence, 0.70)

    def test_money_printing_press_classified_as_economy_analysis(self):
        """Speculative money printing headline classified as ANALYSIS under economy_public_finance."""
        hl = "The Money-printing press: Heading for 25 billion dinars?"
        res = classify_multi_axis(text=hl, headline=hl, source_type="independent_media")
        self.assertEqual(res.primary_issue, "economy_public_finance")
        self.assertEqual(res.sub_issue, "banking_monetary")
        self.assertEqual(res.classification, "ANALYSIS")
        self.assertGreaterEqual(res.confidence, 0.70)

    def test_wind_farm_grant_classified_as_gas_energy_fact(self):
        """Wind farm grant funding classified under gas_energy as FACT."""
        hl = "Tunisia: El Fahs wind farm selected for Japanese grant funding"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "gas_energy")
        self.assertEqual(res.sub_issue, "renewable_energy")
        self.assertEqual(res.classification, "FACT")
        self.assertGreaterEqual(res.confidence, 0.70)

    def test_libya_trade_difficulties_classified_as_economy_analysis(self):
        """Libya trade difficulties with quotation marks classified as ANALYSIS under economy_public_finance."""
        hl = "“Persistent difficulties” in Tunisia-Libya trade"
        res = classify_multi_axis(text=hl, headline=hl, source_type="independent_media")
        self.assertEqual(res.primary_issue, "economy_public_finance")
        self.assertEqual(res.sub_issue, "trade")
        self.assertEqual(res.classification, "ANALYSIS")
        self.assertGreaterEqual(res.confidence, 0.70)

    def test_tourism_hotel_bookings_classified_as_economy_fact(self):
        """Tourism arrivals vs hotel bookings classified under economy_public_finance as FACT."""
        hl = "Tunisia: Increase in Algerian visitors, but hotel bookings decline"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "economy_public_finance")
        self.assertEqual(res.classification, "FACT")
        self.assertGreaterEqual(res.confidence, 0.70)

    def test_investment_freedom_classified_as_economy_analysis(self):
        """Investment freedom commentary classified under economy_public_finance."""
        hl = "Tunisia: Freedom to invest, the elusive revival"
        res = classify_multi_axis(text=hl, headline=hl, source_type="independent_media")
        self.assertEqual(res.primary_issue, "economy_public_finance")
        self.assertEqual(res.sub_issue, "investment")
        self.assertEqual(res.classification, "ANALYSIS")

    def test_building_materials_export_classified_as_economy(self):
        """Building materials exports classified under economy_public_finance."""
        hl = "Tunisia: Exports of building materials, ceramics and glass up 10.3% in July"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "economy_public_finance")
        self.assertEqual(res.sub_issue, "trade")
        self.assertEqual(res.classification, "FACT")

    def test_agrifood_trade_classified_as_economy(self):
        """Agri-food trade coverage classified under economy_public_finance with agriculture secondary."""
        hl = "Tunisia: Agrifood trade balance records surplus of TND 1,607.7 million at end-July"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "economy_public_finance")
        self.assertIn("agriculture", res.secondary_issues)
        self.assertEqual(res.classification, "FACT")

    def test_snjt_congress_announcement_rejected_as_routine_admin(self):
        """Routine union congress communique is filtered out by is_substantive_evidence."""
        hl = "بلاغ المُؤتمر السابع للنقابة الوطنية للصحفيين التونسيين والتاسع والعشرين للمهنة"
        is_sub, reason = is_substantive_evidence(hl, source_domain="snjt.org")
        self.assertFalse(is_sub, "Routine union congress notices must be filtered out as administrative")
        self.assertIn("routine_admin", reason)

    def test_snjt_journalist_harassment_appeal_classified_as_claim(self):
        """Activist / union solidarity statement is classified as CLAIM under rights_freedoms."""
        hl = "أوقفوا التنكيل بمحمد اليوسفي وعائلته"
        is_sub, _ = is_substantive_evidence(hl, source_domain="snjt.org")
        self.assertTrue(is_sub)
        res = classify_multi_axis(text=hl, headline=hl, source_type="ngo")
        self.assertEqual(res.primary_issue, "rights_freedoms")
        self.assertEqual(res.classification, "CLAIM")
        self.assertGreaterEqual(res.confidence, 0.70)

    def test_presidential_mention_in_water_article_preserves_water(self):
        """Presidency mentioned in water infrastructure context must classify as water, NOT governance."""
        hl = "Le président Kaïs Saïed supervise les travaux d'urgence sur le réseau d'eau à Gafsa"
        res = classify_multi_axis(text=hl, headline=hl, source_type="official")
        self.assertEqual(res.primary_issue, "water")
        self.assertEqual(res.classification, "CLAIM")
        self.assertIn("kais_saied", res.topics)
        self.assertIn("presidency", res.topics)

    def test_presidential_mention_in_energy_article_preserves_energy(self):
        """Presidency mentioned in energy transition context must classify as gas_energy, NOT governance."""
        hl = "Le chef de l'Etat préside un conseil ministériel sur la transition énergétique et les énergies renouvelables"
        res = classify_multi_axis(text=hl, headline=hl, source_type="official")
        self.assertEqual(res.primary_issue, "gas_energy")
        self.assertEqual(res.sub_issue, "renewable_energy")
        self.assertEqual(res.classification, "CLAIM")

    def test_constitutional_decree_classified_as_governance(self):
        """Direct presidential decree / powers article classifies as governance_institutions."""
        hl = "Décret présidentiel fixant les attributions de la présidence de la république"
        res = classify_multi_axis(text=hl, headline=hl, source_type="official")
        self.assertEqual(res.primary_issue, "governance_institutions")
        self.assertEqual(res.classification, "CLAIM")

    def test_commercial_banks_outstanding_credit_classified_as_banking_monetary(self):
        """Commercial banks outstanding credit classified under economy_public_finance / banking_monetary."""
        hl = "Tunisia: Commercial banks outstanding credit up 2.1% at end-July"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "economy_public_finance")
        self.assertEqual(res.sub_issue, "banking_monetary")
        self.assertEqual(res.classification, "FACT")

    def test_bank_lending_outstanding_loans_classified_as_banking_monetary(self):
        """Bank lending and outstanding loans classified under economy_public_finance / banking_monetary."""
        hl = "Tunisia: Bank lending and outstanding loans to private sector expand"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "economy_public_finance")
        self.assertEqual(res.sub_issue, "banking_monetary")

    def test_central_bank_foreign_currency_assets_import_days_classified_as_foreign_reserves(self):
        """Foreign currency assets and import days classified under economy_public_finance / foreign_reserves."""
        hl = "Tunisia: Central Bank foreign currency assets down to 112 import days"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "economy_public_finance")
        self.assertEqual(res.sub_issue, "foreign_reserves")
        self.assertEqual(res.classification, "FACT")

    def test_foreign_exchange_reserves_classified_as_foreign_reserves(self):
        """Foreign exchange reserves and import cover classified under economy_public_finance / foreign_reserves."""
        hl = "BCT: Foreign exchange reserves cover 115 days of imports"
        res = classify_multi_axis(text=hl, headline=hl, source_type="news_agency")
        self.assertEqual(res.primary_issue, "economy_public_finance")
        self.assertEqual(res.sub_issue, "foreign_reserves")

if __name__ == "__main__":
    unittest.main()
