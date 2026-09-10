# monitor/tests/test_taxonomy_v2.py
import unittest
from monitor.app.services.taxonomy import (
    CANONICAL_PRIMARY_ISSUES, CANONICAL_SUB_ISSUES,
    classify_multi_axis, normalize_issue_slug
)

class TestTaxonomyV2(unittest.TestCase):

    def test_all_21_canonical_issues_present(self):
        self.assertEqual(len(CANONICAL_PRIMARY_ISSUES), 21)
        expected = [
            "water", "electricity", "gas_energy", "food_security",
            "prices_cost_of_living", "work_unemployment", "migration",
            "health", "public_services", "pollution_environment",
            "rights_freedoms", "justice_law", "media_press_freedom",
            "governance_institutions", "economy_public_finance",
            "corruption_accountability", "protests_social_movements",
            "security_policing", "education", "agriculture", "housing_infrastructure"
        ]
        self.assertEqual(CANONICAL_PRIMARY_ISSUES, expected)
        for iss in expected:
            self.assertIn(iss, CANONICAL_SUB_ISSUES)
            self.assertTrue(len(CANONICAL_SUB_ISSUES[iss]) > 0)

    def test_legacy_slug_normalization(self):
        self.assertEqual(normalize_issue_slug("work"), "work_unemployment")
        self.assertEqual(normalize_issue_slug("public-services"), "public_services")
        self.assertEqual(normalize_issue_slug("rights"), "rights_freedoms")
        self.assertEqual(normalize_issue_slug("institutions"), "governance_institutions")
        self.assertEqual(normalize_issue_slug("gabes"), "pollution_environment")
        self.assertEqual(normalize_issue_slug("pollution"), "pollution_environment")
        self.assertEqual(normalize_issue_slug("economy"), "economy_public_finance")
        self.assertEqual(normalize_issue_slug("cost_of_living"), "prices_cost_of_living")
        self.assertEqual(normalize_issue_slug("food"), "food_security")
        self.assertEqual(normalize_issue_slug("energy"), "gas_energy")

    def test_journalist_prosecuted_under_decree_54(self):
        headline = "Poursuite d'un journaliste sous le décret 54 après une enquête sur la gestion publique"
        body = "Le juge d'instruction près le tribunal de première instance a ordonné l'ouverture d'une information judiciaire contre le journaliste, selon le SNJT."
        res = classify_multi_axis(text="", headline=headline, body=body)

        self.assertEqual(res.primary_issue, "media_press_freedom")
        self.assertEqual(res.sub_issue, "journalist_prosecution")
        self.assertIn("decree_law_54", res.topics)
        self.assertIn("SNJT", res.entities)
        self.assertTrue(any(x in res.secondary_issues for x in ["justice_law", "rights_freedoms"]))

    def test_presidential_power_and_executive_decrees(self):
        headline = "Kaïs Saïed modifie les attributions des institutions exécutives par décret présidentiel"
        body = "Le président de la République Kaïs Saïed a publié un décret présidentiel au JORT portant réorganisation des pouvoirs conformément à la Constitution de 2022."
        res = classify_multi_axis(text="", headline=headline, body=body)

        self.assertEqual(res.primary_issue, "governance_institutions")
        self.assertIn(res.sub_issue, ["presidential_decrees", "executive_power", "presidency"])
        self.assertIn("kais_saied", res.topics)
        self.assertIn("presidency", res.topics)
        self.assertIn("constitution_2022", res.topics)
        self.assertIn("Kais Saied", res.entities)
        self.assertIn("Presidency of the Republic", res.entities)

    def test_presidential_statement_on_substantive_issue(self):
        # Kais Saied speaking about bread shortage should classify into food_security, NOT generic governance
        headline = "Kaïs Saïed ordonne un approvisionnement d'urgence pour faire face à la pénurie de pain"
        body = "Le président de la République a insisté lors d'une réunion sur la nécessité de garantir l'approvisionnement en farine et en céréales pour les boulangeries."
        res = classify_multi_axis(text="", headline=headline, body=body)

        self.assertEqual(res.primary_issue, "food_security")
        self.assertEqual(res.sub_issue, "bread")
        self.assertIn("kais_saied", res.topics)

    def test_medicine_shortage_classification(self):
        headline = "Rupture de stock critique de médicaments vitaux dans les hôpitaux publics"
        body = "La Pharmacie Centrale de Tunisie fait face à d'importantes difficultés d'approvisionnement en médicaments d'anesthésie et d'oncologie."
        res = classify_multi_axis(text="", headline=headline, body=body)

        self.assertEqual(res.primary_issue, "health")
        self.assertEqual(res.sub_issue, "medicine_shortage")

    def test_gabes_industrial_pollution(self):
        headline = "Pollution au phosphogypse à Gabès : émissions toxiques au Groupe Chimique"
        body = "Les rejets toxiques et les émanations de gaz dans le golfe de Gabès à Chatt Essalam suscitent la colère des riverains."
        res = classify_multi_axis(text="", headline=headline, body=body)

        self.assertEqual(res.primary_issue, "pollution_environment")
        self.assertEqual(res.sub_issue, "gabes")
        self.assertIn("gabes", res.topics)
        self.assertIn("GCT", res.entities)

    def test_arabic_water_cut(self):
        headline = "انقطاع مفاجئ في توزيع مياه الشرب بمعتمدية تالة"
        body = "أعلنت الشركة الوطنية لاستغلال وتوزيع المياه الصوناد عن تسجيل اضطراب وانقطاع في مياه الشرب بسبب عطب طارئ في شبكة التوزيع."
        res = classify_multi_axis(text="", headline=headline, body=body)

        self.assertEqual(res.primary_issue, "water")
        self.assertEqual(res.sub_issue, "water_cuts")
        self.assertIn("sonede", res.topics)
        self.assertIn("SONEDE", res.entities)

    def test_gas_and_energy_crisis(self):
        headline = "Pénurie aiguë de bouteilles de gaz butane dans plusieurs régions de l'intérieur"
        body = "Les distributeurs d'hydrocarbures alertent sur les retards d'approvisionnement en gaz et carburant."
        res = classify_multi_axis(text="", headline=headline, body=body)

        self.assertEqual(res.primary_issue, "gas_energy")
        self.assertEqual(res.sub_issue, "household_gas")

    def test_cost_of_living_and_inflation(self):
        headline = "Flambée des prix des légumes et baisse continue du pouvoir d'achat des ménages"
        body = "L'Institut National de la Statistique INS relève une accélération de l'indice des prix à la consommation."
        res = classify_multi_axis(text="", headline=headline, body=body)

        self.assertEqual(res.primary_issue, "prices_cost_of_living")
        self.assertIn(res.sub_issue, ["food_prices", "purchasing_power", "inflation"])
        self.assertIn("ins", res.topics)
        self.assertIn("INS", res.entities)

    def test_social_protests_and_sit_ins(self):
        headline = "Mouvement de protestation et sit-in avec blocage de la route nationale"
        body = "Les habitants ont organisé une marche de protestation pour réclamer des projets de développement et l'emploi."
        res = classify_multi_axis(text="", headline=headline, body=body)

        self.assertEqual(res.primary_issue, "protests_social_movements")
        self.assertIn(res.sub_issue, ["sit_ins", "demonstrations", "road_blocks"])

    def test_housing_infrastructure_failure(self):
        headline = "Effondrement d'un immeuble menaçant ruine et dégradation avancée de la chaussée"
        body = "Les équipes de la protection civile sont intervenues suite à l'effondrement partiel du bâtiment et à l'inondation de la voirie."
        res = classify_multi_axis(text="", headline=headline, body=body)

        self.assertEqual(res.primary_issue, "housing_infrastructure")
        self.assertIn(res.sub_issue, ["infrastructure_failure", "roads", "housing"])

    def test_public_route_and_path_mappings(self):
        from monitor.app.services.taxonomy import (
            canonical_to_public_path, canonical_to_public_slug,
            public_path_to_canonical, public_slug_to_canonical
        )
        expected_paths = {
            "water": "/issues/water",
            "electricity": "/issues/electricity",
            "pollution_environment": "/issues/pollution",
            "work_unemployment": "/issues/work",
            "migration": "/issues/migration",
            "public_services": "/issues/public-services",
            "rights_freedoms": "/issues/rights",
            "governance_institutions": "/issues/governance",
            "economy_public_finance": "/issues/economy",
            "media_press_freedom": "/issues/press-freedom",
            "prices_cost_of_living": "/issues/cost-of-living",
            "health": "/issues/health",
            "food_security": "/issues/food-security",
            "gas_energy": "/issues/energy",
            "justice_law": "/issues/law",
            "corruption_accountability": "/issues/accountability",
            "protests_social_movements": "/issues/protests",
            "security_policing": "/issues/security",
            "education": "/issues/education",
            "agriculture": "/issues/agriculture",
            "housing_infrastructure": "/issues/infrastructure"
        }
        for issue_id, expected_path in expected_paths.items():
            self.assertEqual(canonical_to_public_path(issue_id), expected_path)
            self.assertEqual(public_path_to_canonical(expected_path), issue_id)

        # Flagship Gabès
        self.assertEqual(canonical_to_public_path("gabes"), "/gabes")
        self.assertEqual(public_path_to_canonical("/gabes"), "pollution_environment")


if __name__ == "__main__":
    unittest.main()
