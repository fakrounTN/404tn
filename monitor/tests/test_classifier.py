import unittest
from monitor.app.services.classifier import (
    classify_issue,
    classify_epistemic,
    is_substantive_evidence,
    has_tunisia_context
)

class TestClassifier(unittest.TestCase):
    def test_classify_issue_water(self):
        text = "SONEDE reports that northern dam storage volume is down to 21% amidst severe drought."
        self.assertEqual(classify_issue(text), "water")

    def test_classify_issue_gabes(self):
        text = "Fishermen in the Gulf of Gabès protest GCT phosphogypsum discharge near Chatt Essalam."
        self.assertEqual(classify_issue(text), "gabes")

    def test_political_free_speech_with_water_not_water(self):
        """Political/free speech article containing 'water' must classify under rights/governance, NOT water."""
        headline = "Le SNJT condamne l'arrestation d'un journaliste enquêtant sur la gestion de l'eau"
        body = "Le syndicat dénonce l'application du décret 54 et l'atteinte à la liberté de la presse."
        issue = classify_issue(f"{headline} {body}", headline=headline)
        self.assertEqual(issue, "rights", "Journalist arrest investigation must classify as 'rights'")
        self.assertNotEqual(issue, "water")

    def test_detention_prison_medical_neglect_not_public_services_or_electricity(self):
        """Detention/prison health article must classify under rights, NOT public_services or electricity."""
        headline = "Négligences médicales dans les prisons : la double peine pour les détenu·es en Tunisie"
        body = "Rapport d'enquête sur les conditions carcérales et le manque de soins pour les prisonniers."
        issue = classify_issue(f"{headline} {body}", headline=headline)
        self.assertEqual(issue, "rights", "Prison condition report must classify as 'rights'")
        self.assertNotEqual(issue, "public_services")
        self.assertNotEqual(issue, "electricity")

    def test_gafsa_phosphate_groundwater_not_gabes(self):
        """Gafsa phosphate water depletion must classify under water, NOT gabes."""
        headline = "Traitement du phosphate à Gafsa : une industrie qui épuise les nappes phréatiques"
        body = "Enquête sur la surexploitation des ressources en eau souterraine par la CPG dans le bassin minier."
        issue = classify_issue(f"{headline} {body}", headline=headline)
        self.assertEqual(issue, "water", "Gafsa aquifer depletion must classify as 'water'")
        self.assertNotEqual(issue, "gabes")

    def test_sonede_outage_classified_as_water(self):
        """SONEDE drinking water cuts must classify as water."""
        headline = "SONEDE: Coupure d'eau potable dans plusieurs quartiers de Sfax et Kasserine"
        body = "La distribution sera rétablie progressivement après achèvement des travaux sur la conduite principale."
        issue = classify_issue(f"{headline} {body}", headline=headline)
        self.assertEqual(issue, "water")

    def test_steg_outage_classified_as_electricity(self):
        """STEG power load shedding and outages must classify as electricity."""
        headline = "La STEG annonce des coupures d'électricité programmées et des délestages de charge"
        body = "La canicule record a provoqué un pic de consommation sur le réseau électrique national."
        issue = classify_issue(f"{headline} {body}", headline=headline)
        self.assertEqual(issue, "electricity")

    def test_migration_death_classified_as_migration(self):
        """Maritime crossings and migrant deaths must classify as migration."""
        headline = "Naufrage au large de Zarzis : 12 corps de migrants repêchés par la garde maritime"
        body = "Les unités maritimes ont intercepté plusieurs embarcations clandestines en partance vers l'Europe."
        issue = classify_issue(f"{headline} {body}", headline=headline)
        self.assertEqual(issue, "migration")

    def test_generic_pages_rejected_by_substantive_gate(self):
        """Generic navigation/index pages must be rejected."""
        generic_cases = [
            "Actualités", "Rapport", "Rapports d'activités", "Publications", "Accueil", "الرئيسية", "أخبار"
        ]
        for title in generic_cases:
            is_sub, reason = is_substantive_evidence(title)
            self.assertFalse(is_sub, f"Generic page '{title}' should not pass substantive gate")
            self.assertEqual(reason, "generic_navigation_page")

    def test_training_announcements_rejected(self):
        """Routine training and workshop announcements must be rejected."""
        title = "سلسلة من الدورات التدريبية حول صحافة البيانات والصحافة الاستقصائية - النقابة الوطنية للصحفيين"
        is_sub, reason = is_substantive_evidence(title)
        self.assertFalse(is_sub, "Training announcement should be excluded")
        self.assertEqual(reason, "training_workshop_announcement")

    def test_sports_news_rejected(self):
        """Sports news with incidental keyword matches must be rejected."""
        sports_cases = [
            "JM Tarente-2026 (aviron) : la Tunisie médaillée de bronze au deux de couple mixte poids léger",
            "الألعاب المتوسطية (تارانتو 2026- رفع الأثقال): الاصابة تحرم أيمن باشا من الذهبية"
        ]
        for title in sports_cases:
            is_sub, reason = is_substantive_evidence(title)
            self.assertFalse(is_sub, f"Sports article '{title}' should not pass substantive gate")
            self.assertEqual(reason, "sports_recreational_event")

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

    def test_arabic_work_stemming_no_false_positive_on_coastal_protection(self):
        """Case A: مبادرة حماية السواحل must not trigger 'work' due to isolated 'عمل' in summary."""
        headline = "مبادرة حماية السواحل"
        summary = "أشرف السيّد وزير البيئة حبيب عبيد، مساء الاثنين 16 مارس 2026، على جلسة عمل لتقديم كيفية الانخراط في مبادرة حماية الساحل ."
        issue = classify_issue(summary, headline=headline)
        self.assertEqual(issue, "pollution")
        self.assertNotEqual(issue, "work")

    def test_foreign_only_subject_matter_rejected_regardless_of_domain(self):
        """Case B: Foreign-only content (Marseille minors) must fail Tunisia context even on inkyfada.com."""
        text = "Les mineurs isolés étrangers à Marseille, un accompagnement “low cost”. A Marseille, les structures d'accueil..."
        has_tn = has_tunisia_context(text, source_domain="inkyfada.com")
        self.assertFalse(has_tn, "Foreign-only Marseille article must not pass Tunisia context")

    def test_sports_and_football_management_rejected(self):
        """Case C: Football World Cup and FTF coaching turmoil must be excluded as sports."""
        sports_headlines = [
            "Départ de Renard, silence de la FTF et guerre interne : les coulisses de l’après Coupe du monde 2026",
            "Coupe du monde 2026 : Lamouchi viré, Hervé Renard en mission, les coulisses du fiasco tunisien"
        ]
        for h in sports_headlines:
            is_sub, reason = is_substantive_evidence(h, source_domain="inkyfada.com")
            self.assertFalse(is_sub, f"Sports/FTF story '{h}' should be excluded")
            self.assertEqual(reason, "sports_recreational_event")

    def test_routine_procurement_tenders_rejected(self):
        """Case D: Public procurement and photocopier acquisitions must be excluded as routine admin."""
        tenders = [
            "طلب عروض عدد 2026/21 لإقتناء آلات ناسخة لفائدة رئاسة الحكومة",
            "Avis d'appel d'offres national pour l'acquisition d'equipements informatiques"
        ]
        for t in tenders:
            is_sub, reason = is_substantive_evidence(t, source_domain="pm.gov.tn")
            self.assertFalse(is_sub, f"Procurement tender '{t}' should be excluded")
            self.assertEqual(reason, "routine_admin_notice")

    def test_generic_navigation_and_ministry_headers_rejected(self):
        """Case E: Generic navigation suffixes like 'Actualités - ME' and circular headers must be excluded."""
        generic_headers = [
            "Actualités - ME", "Actualités", "Publications", "Communiqués de presse", "نشاط الوزارة", "بلاغات"
        ]
        for gh in generic_headers:
            is_sub, reason = is_substantive_evidence(gh)
            self.assertFalse(is_sub, f"Generic header '{gh}' should be excluded")
            self.assertEqual(reason, "generic_navigation_page")

    def test_pubmed_biomedical_lab_assays_rejected(self):
        """Case G: In-vitro biochemical assays / rat liver studies without public crisis evidence must be excluded."""
        pubmed_abstract = "In vitro antioxidant and cytotoxic activity of essential oil from Tunisian plants on rat liver cells."
        is_sub, reason = is_substantive_evidence(pubmed_abstract, source_domain="pubmed.ncbi.nlm.nih.gov")
        self.assertFalse(is_sub, "Generic in-vitro lab study must be excluded")
        self.assertEqual(reason, "routine_admin_notice")

    def test_arabic_prison_deaths_custody_classified_as_rights(self):
        """Case H: Prison deaths and detention accountability must classify under rights."""
        headline = "حين تحتجز الدولة الجسد: من يجيب عن الموت خلف القضبان؟"
        summary = "تقرير استقصائي حول ظروف السجون وحالات الوفيات في مراكز الاحتجاز بتونس."
        issue = classify_issue(summary, headline=headline)
        self.assertEqual(issue, "rights")

    def test_data_privacy_violation_classified_as_rights(self):
        """Case I: Personal data privacy violations must classify under rights."""
        headline = "صفحات ومواقع رسمية تعطي المثال في انتهاك المعطيات الشخصية"
        summary = "مواقع عمومية تونسية تنشر بيانات شخصية للمواطنين بالمخالفة للقانون."
        issue = classify_issue(summary, headline=headline)
        self.assertEqual(issue, "rights")

    def test_opinion_trials_protests_classified_as_rights(self):
        """Case J: Protests against opinion trials and persecution must classify under rights."""
        headline = "وقفة احتجاجية لحراك نفس ضد التنكيل بالتونسيين ومحاكمات الرأي"
        summary = "مظاهرة وسط العاصمة تونس للمطالبة بوقف التضييق على الحريات وإطلاق سراح المعتقلين."
        issue = classify_issue(summary, headline=headline)
        self.assertEqual(issue, "rights")


if __name__ == "__main__":
    unittest.main()

