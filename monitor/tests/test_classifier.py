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

    # =========================================================================
    # PHASE 4.1 FINAL HARDENING: NEGATIVE REGRESSION TESTS (N1 - N9)
    # =========================================================================

    def test_n1_foreign_personal_data_rejected_tunisia_context(self):
        """TEST N1: source_domain=nawaat.org, foreign article with 'المعطيات الشخصية' but no TN entity -> False."""
        headline = "حماية المعطيات الشخصية في الاتحاد الأوروبي والقوانين الرقمية الجديدة"
        summary = "الاتحاد الأوروبي يناقش تشريعات حماية المعطيات الشخصية والخصوصية الرقمية في بروكسل."
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="nawaat.org")
        self.assertFalse(has_tn, "Thematic 'المعطيات الشخصية' without Tunisia entity must NOT pass Tunisia context")

    def test_n2_foreign_opinion_trials_rejected_tunisia_context(self):
        """TEST N2: source_domain=inkyfada.com, foreign story with 'محاكمات الرأي' but no TN entity -> False."""
        headline = "محاكمات الرأي في الشرق الأوسط وتراجع مؤشرات الديمقراطية"
        summary = "تقرير حقوقي دولي حول محاكمات الرأي وسجناء الرأي في عدة دول عربية."
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="inkyfada.com")
        self.assertFalse(has_tn, "Thematic 'محاكمات الرأي' without Tunisia entity must NOT pass Tunisia context")

    def test_n3_generic_thematic_rights_vocabulary_rejected_tunisia_context(self):
        """TEST N3: Editorial source with generic rights vocabulary (الاستبداد, السجن, حقوق الإنسان, الحريات) -> False."""
        headline = "مواجهة الاستبداد والدفاع عن الحريات وحقوق الإنسان"
        summary = "مقال فكري حول ظروف السجن والتعذيب والقمع والاحتجاز في الأنظمة الشمولية."
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="nawaat.org")
        self.assertFalse(has_tn, "Generic rights vocabulary alone must NOT satisfy Layer 2 Tunisia context")

    def test_n4_inkyfada_marseille_minors_rejected_tunisia_context(self):
        """TEST N4: Inkyfada Marseille foreign minors story without TN entity -> False."""
        headline = "Les mineurs isolés étrangers à Marseille, un accompagnement “low cost”"
        summary = "A Marseille, les structures d'accueil et d'accompagnement des mineurs isolés manquent de moyens."
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="inkyfada.com")
        self.assertFalse(has_tn, "Foreign-only Marseille article must fail Tunisia context despite editorial domain")

    def test_n5_generic_ins_publications_rejected_substantive(self):
        """TEST N5: Generic INS 'Publications' header -> substantive FALSE."""
        is_sub, reason = is_substantive_evidence("Publications", source_domain="ins.tn")
        self.assertFalse(is_sub, "Generic INS header must be rejected by substantive gate")
        self.assertEqual(reason, "generic_navigation_page")

    def test_n6_generic_onagri_actualites_rejected_substantive(self):
        """TEST N6: Generic ONAGRI 'Actualités' header -> substantive FALSE."""
        is_sub, reason = is_substantive_evidence("Actualités", source_domain="onagri.nat.tn")
        self.assertFalse(is_sub, "Generic ONAGRI header must be rejected by substantive gate")
        self.assertEqual(reason, "generic_navigation_page")

    def test_n7_pm_photocopier_procurement_rejected_substantive(self):
        """TEST N7: PM photocopier procurement tender -> substantive FALSE."""
        tender = "طلب عروض عدد 2026/21 لإقتناء آلات ناسخة لفائدة رئاسة الحكومة"
        is_sub, reason = is_substantive_evidence(tender, source_domain="pm.gov.tn")
        self.assertFalse(is_sub, "PM procurement notice must be rejected by substantive gate")
        self.assertEqual(reason, "routine_admin_notice")

    def test_n8_real_football_world_cup_rejected_sports(self):
        """TEST N8: Real football / Coupe du monde / FTF story -> sports_recreational_event."""
        headline = "Coupe du monde 2026 : Lamouchi viré, Hervé Renard en mission, les coulisses du fiasco tunisien"
        is_sub, reason = is_substantive_evidence(headline, source_domain="inkyfada.com")
        self.assertFalse(is_sub, "Real football world cup coverage must be excluded as sports")
        self.assertEqual(reason, "sports_recreational_event")

    def test_n9_pubmed_foreign_lab_assay_rejected(self):
        """TEST N9: Foreign / non-crisis PubMed biomedical laboratory study -> routine_admin_notice / False."""
        pubmed = "In vitro antioxidant and cytotoxic activity of essential oil on rat liver cells"
        is_sub, reason = is_substantive_evidence(pubmed, source_domain="pubmed.ncbi.nlm.nih.gov")
        self.assertFalse(is_sub, "Biomedical in-vitro lab study must be excluded")
        self.assertEqual(reason, "routine_admin_notice")

    # =========================================================================
    # PHASE 4.1 FINAL HARDENING: POSITIVE REGRESSION TESTS (P1 - P8)
    # =========================================================================

    def test_p1_ins_employment_unemployment_statistics(self):
        """TEST P1: INS employment/unemployment statistics -> substantive TRUE, TN context TRUE, issue=work."""
        headline = "Indicateurs de l’emploi et du chômage, deuxième trimestre 2026"
        summary = "L'Institut National de la Statistique publie les taux de chômage et indicateurs de la population active."
        is_sub, _ = is_substantive_evidence(headline, summary, source_domain="ins.tn")
        self.assertTrue(is_sub)
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="ins.tn")
        self.assertTrue(has_tn, "Official INS provenance establishes Tunisia context for substantive metrics")
        issue = classify_issue(f"{headline} {summary}", headline=headline)
        self.assertEqual(issue, "work", "Employment/unemployment statistics must classify as 'work'")

    def test_p2_ins_cpi_publication(self):
        """TEST P2: INS CPI publication -> substantive TRUE, TN context TRUE, not excluded for missing literal 'Tunisie'."""
        headline = "Indice des prix à la consommation, Août 2026"
        summary = "Augmentation mensuelle des prix à la consommation familiale et inflation sous-jacente."
        is_sub, _ = is_substantive_evidence(headline, summary, source_domain="ins.tn")
        self.assertTrue(is_sub)
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="ins.tn")
        self.assertTrue(has_tn, "INS CPI publication must pass Tunisia context via Tier 1 provenance")
        issue = classify_issue(f"{headline} {summary}", headline=headline)
        self.assertEqual(issue, "work")

    def test_p3_nawaat_identifiable_journalist_snjt_legal_nexus(self):
        """TEST P3: Nawaat + identifiable Tunisian journalist + SNJT / legal nexus -> TN context TRUE, issue=rights."""
        headline = "محمد اليوسفي: النقابة الوطنية للصحفيين تندد بالمرسوم 54"
        summary = "تواصل الملاحقات القضائية واستهداف حرية الصحافة والتعبير بمقتضى المرسوم 54."
        is_sub, _ = is_substantive_evidence(headline, summary, source_domain="nawaat.org")
        self.assertTrue(is_sub)
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="nawaat.org")
        self.assertTrue(has_tn, "Identifiable Tunisian journalist + SNJT + Decree 54 establishes domestic nexus")
        issue = classify_issue(f"{headline} {summary}", headline=headline)
        self.assertEqual(issue, "rights")

    def test_p4_article_containing_kais_saied_public_figure(self):
        """TEST P4: Article mentioning identifiable public figure 'قيس سعيد' -> TN context TRUE."""
        headline = "تصريحات قيس سعيد حول إصلاح الإدارة ومكافحة الفساد"
        summary = "الرئيس قيس سعيد يشدد على ضرورة تطهير الإدارة العمومية من الفساد المالي والإداري."
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="inkyfada.com")
        self.assertTrue(has_tn, "Specific identifiable public figure 'قيس سعيد' establishes Tunisia nexus")

    def test_p5_article_containing_decree_54_legal_nexus(self):
        """TEST P5: Article containing 'المرسوم 54' -> TN context TRUE, issue=rights."""
        headline = "محاكمة صحفي بموجب المرسوم 54 تثير ردود فعل حقوقية واسعة"
        summary = "إحالة جديدة أمام القضاء على خلفية تدوينة بمقتضى الفصل 24 من المرسوم 54."
        is_sub, _ = is_substantive_evidence(headline, summary, source_domain="nawaat.org")
        self.assertTrue(is_sub)
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="nawaat.org")
        self.assertTrue(has_tn, "Controlled Tunisian legal instrument 'المرسوم 54' establishes domestic nexus")
        issue = classify_issue(f"{headline} {summary}", headline=headline)
        self.assertEqual(issue, "rights")

    def test_p6_ftdes_explicit_tunisian_institution_governorate(self):
        """TEST P6: FTDES + explicit Tunisian institution/governorate -> TN context TRUE, issue=water."""
        headline = "تقرير المنتدى التونسي للحقوق الاقتصادية والاجتماعية حول أزمة المياه في قفصة"
        summary = "المنتدى التونسي للحقوق الاقتصادية والاجتماعية يوثق انقطاعات مياه الشرب في الحوض المنجمي بقفصة."
        is_sub, _ = is_substantive_evidence(headline, summary, source_domain="ftdes.net")
        self.assertTrue(is_sub)
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="ftdes.net")
        self.assertTrue(has_tn, "FTDES + Gafsa establishes clear Tunisia context")
        issue = classify_issue(f"{headline} {summary}", headline=headline)
        self.assertEqual(issue, "water")

    def test_p7_explicit_country_signals_any_domain(self):
        """TEST P7: Explicit 'Tunisie' / 'تونس' / 'Tunisia' -> TN context TRUE regardless of source domain."""
        headline = "Interruption de distribution d'eau potable en Tunisie suite à une avarie majeure"
        summary = "La société nationale des eaux intervient sur le réseau principal de distribution."
        is_sub, _ = is_substantive_evidence(headline, summary, source_domain="reuters.com")
        self.assertTrue(is_sub)
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="reuters.com")
        self.assertTrue(has_tn, "Explicit country name 'Tunisie' establishes Tunisia context for any source domain")
        issue = classify_issue(f"{headline} {summary}", headline=headline)
        self.assertEqual(issue, "water")

    def test_p8_ftdes_forum_social_mondial_not_sports(self):
        """TEST P8: FTDES Forum Social Mondial environmental/migration justice -> NOT sports, classify issue."""
        headline = "Justice environnementale et justice migratoire au cœur de la participation du FTDES au Forum Social Mondial 2026"
        summary = "Le Forum Social Mondial réunit les mouvements civiques pour la justice environnementale et les droits sociaux."
        is_sub, reason = is_substantive_evidence(headline, summary, source_domain="ftdes.net")
        self.assertTrue(is_sub, f"Forum Social Mondial must be substantive, got exclusion: {reason}")
        self.assertNotEqual(reason, "sports_recreational_event")
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="ftdes.net")
        self.assertTrue(has_tn)
        issue = classify_issue(f"{headline} {summary}", headline=headline)
        self.assertEqual(issue, "rights", "Social/environmental justice advocacy must classify as 'rights'")


if __name__ == "__main__":
    unittest.main()

