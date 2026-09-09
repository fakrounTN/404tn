# monitor/tests/test_classifier.py
import unittest
from monitor.app.services.classifier import (
    classify_issue,
    classify_issue_advanced,
    classify_epistemic,
    is_substantive_evidence,
    has_tunisia_context,
    _matches_keyword
)

class TestClassifier(unittest.TestCase):
    # =========================================================================
    # BASELINE CLASSIFICATION & GATE TESTS
    # =========================================================================

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

    # =========================================================================
    # TASK 1 REGRESSION QUALITY TESTS (CASES A - J)
    # =========================================================================

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

    def test_n1_marseille_minors_foreign_only_rejected(self):
        """TEST N1: Inkyfada + Marseille minors -> fails Tunisia context gate."""
        headline = "Les mineurs isolés étrangers à Marseille, un accompagnement “low cost”"
        summary = "A Marseille, les structures d'accueil et d'hébergement pour mineurs étrangers non accompagnés sont saturées."
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="inkyfada.com")
        self.assertFalse(has_tn, "Foreign-only Marseille article on Inkyfada must not pass Tunisia context")

    def test_n2_generic_foreign_protest_rejected_without_explicit_tunisia(self):
        """TEST N2: Protest article without explicit Tunisia signals -> fails Tunisia context gate."""
        headline = "Des manifestations éclatent contre les coupures d'eau et d'électricité dans la région"
        summary = "Les résidents bloquent les routes principales pour réclamer le rétablissement des services publics essentiels."
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="lemonde.fr")
        self.assertFalse(has_tn, "Generic water/electricity protest with no Tunisian entity must fail Tunisia context on non-TN domain")

    def test_n3_generic_human_rights_foreign_article_rejected(self):
        """TEST N3: Generic human rights / prison article with no Tunisian entity -> fails Tunisia context gate."""
        headline = "Rapport mondial sur les conditions carcérales et les droits des prisonniers"
        summary = "Les organisations de défense des droits humains dénoncent la surpopulation et les mauvais traitements en détention."
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="amnesty.org")
        self.assertFalse(has_tn, "Generic rights article with no Tunisian signal must fail Tunisia context")

    def test_n4_generic_data_protection_privacy_foreign_article_rejected(self):
        """TEST N4: Generic data privacy article on Nawaat without Tunisian entity -> fails Tunisia context gate."""
        headline = "La protection des données personnelles à l'ère de l'intelligence artificielle en Europe"
        summary = "Analyse du règlement général sur la protection des données (RGPD) et des sanctions infligées aux plateformes."
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="nawaat.org")
        self.assertFalse(has_tn, "European GDPR / data privacy article on Nawaat must fail Tunisia context without domestic nexus")

    def test_n5_foreign_institutional_statement_rejected(self):
        """TEST N5: Foreign institutional statement on African migration -> fails Tunisia context without Tunisia mention."""
        headline = "L'Union Africaine examine les flux migratoires en Méditerranée centrale"
        summary = "Une session extraordinaire consacrée au sauvetage en mer et aux mécanismes de solidarité régionale entre Etats membres."
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="jeuneafrique.com")
        self.assertFalse(has_tn, "Regional African Union migration meeting with no Tunisia mention must fail Tunisia context")

    def test_n6_generic_navigation_page_rejected_even_with_tunisia_source(self):
        """TEST N6: Generic navigation page 'Actualités - ME' on environnement.gov.tn -> generic_navigation_page."""
        headline = "Actualités - ME"
        is_sub, reason = is_substantive_evidence(headline, source_domain="environnement.gov.tn")
        self.assertFalse(is_sub, "Generic navigation heading on official ministry must be excluded")
        self.assertEqual(reason, "generic_navigation_page")

    def test_n7_routine_admin_procurement_rejected(self):
        """TEST N7: Routine photocopier procurement on pm.gov.tn -> routine_admin_notice."""
        headline = "طلب عروض عدد 2026/21 لإقتناء آلات ناسخة لفائدة رئاسة الحكومة"
        is_sub, reason = is_substantive_evidence(headline, source_domain="pm.gov.tn")
        self.assertFalse(is_sub, "Routine administrative procurement must be excluded")
        self.assertEqual(reason, "routine_admin_notice")

    def test_n8_real_sports_football_rejected(self):
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
        self.assertIn(issue, ["migration", "pollution", "rights"])

    # =========================================================================
    # PHASE 4.1 V3 RESIDUAL HARDENING: ADDITIVE REGRESSION TESTS (V3_1 - V3_17)
    # =========================================================================

    def test_v3_1_ben_guerdane_arabic_gaf_variant_tunisia_context(self):
        """V3.1: Ben Guerdane Arabic variant (بن ڤردان / بن ڨردان) -> Tunisia context TRUE and classifies migration."""
        headline = "في بن ڤردان ”الذرية“ حرڤت وماتت..والدولة غايبة"
        has_tn = has_tunisia_context(headline, source_domain="nawaat.org")
        self.assertTrue(has_tn, "Arabic dialect Maghrebi gaf in 'بن ڤردان' must match controlled alias and pass Tunisia context")
        issue = classify_issue(headline, headline=headline)
        self.assertEqual(issue, "migration", "Irregular migration in Ben Guerdane must classify as 'migration'")

    def test_v3_2_ben_guerdane_french_latin_variant_tunisia_context(self):
        """V3.2: Ben Guerdane French/Latin variant -> TRUE."""
        headline = "Protestations à Ben Guerdane suite à la fermeture prolongée des passages frontaliers"
        has_tn = has_tunisia_context(headline, source_domain="inkyfada.com")
        self.assertTrue(has_tn, "Ben Guerdane in French must pass Tunisia context")

    def test_v3_3_controlled_surname_tunisian_editorial_custody_context_passes(self):
        """V3.3: controlled surname + Tunisian editorial + strong custody context -> passes under safe rule."""
        headline = "نواة في دقيقة: كفى مخاتلة، اليوسفي في السجن لأنه أزعج الاستبداد"
        has_tn = has_tunisia_context(headline, source_domain="nawaat.org")
        self.assertTrue(has_tn, "Controlled surname + editorial domain + prison custody context establishes domestic nexus")
        issue = classify_issue(headline, headline=headline)
        self.assertEqual(issue, "rights", "Journalist imprisonment must classify as 'rights'")

    def test_v3_4_controlled_surname_foreign_story_fails_tunisia_context(self):
        """V3.4: same surname in foreign story or without custody context -> FALSE."""
        headline = "Le journaliste Elyesfi participe à une conférence internationale sur les médias à Genève"
        has_tn = has_tunisia_context(headline, source_domain="reuters.com")
        self.assertFalse(has_tn, "Surname without Tunisia entity on foreign domain must NOT pass Tunisia context")

    def test_v3_5_haythem_el_mekki_saied_imprisonment_classified_as_rights(self):
        """V3.5: Haythem El Mekki + Saied + imprisonment -> rights."""
        headline = "هيثم المكي انتقد الجميع، وحدها منظومة سعيّد حكمت بسجنه"
        has_tn = has_tunisia_context(headline, source_domain="nawaat.org")
        self.assertTrue(has_tn, "Haythem El Mekki + Saied establishes Tunisia context")
        res = classify_issue_advanced(headline, headline=headline)
        self.assertEqual(res.primary_issue, "rights")
        self.assertGreaterEqual(res.confidence, 0.90, "Imprisonment of journalist must classify as rights with high confidence")

    def test_v3_6_generic_imprisonment_foreign_story_fails_tunisia_context(self):
        """V3.6: generic imprisonment vocabulary alone on foreign story does NOT establish Tunisia context."""
        headline = "أوضاع السجون وظروف الاحتجاز القاسية ومحاكمات الرأي في أمريكا اللاتينية"
        has_tn = has_tunisia_context(headline, source_domain="nawaat.org")
        self.assertFalse(has_tn, "Generic prison vocabulary without TN entity must not establish Tunisia context")

    def test_v3_7_pm_ceremonial_science_day_rejected_substantive(self):
        """V3.7: PM ceremonial Science Day notice does NOT become rights from incidental summary keyword."""
        headline = "موكب الإحتفال بيوم العلم"
        summary = "تكريم المتفوقين في قطاع التعليم وتكريس حرية المعرفة والبحث العلمي."
        is_sub, reason = is_substantive_evidence(headline, summary, source_domain="pm.gov.tn")
        self.assertFalse(is_sub, "PM Science Day ceremonial event must fail substantive gate")
        self.assertEqual(reason, "routine_admin_notice")

    def test_v3_8_ftdes_congress_announcement_rejected_substantive(self):
        """V3.8: FTDES congress announcement does NOT become rights merely because organization name contains 'حقوق'."""
        headline = "إعلام بالمؤتمر الوطني الرابع للمنتدى التونسي للحقوق الاقتصادية والاجتماعية"
        is_sub, reason = is_substantive_evidence(headline, source_domain="ftdes.net")
        self.assertFalse(is_sub, "FTDES internal congress announcement must fail substantive gate")
        self.assertEqual(reason, "routine_admin_notice")

    def test_v3_9_forum_social_mondial_competing_topics_review(self):
        """V3.9: Forum Social Mondial is NOT sports and generic 'justice' alone does not force rights -> competing topics."""
        headline = "Justice environnementale et justice migratoire au cœur de la participation du FTDES au Forum Social Mondial 2026"
        summary = "Le Forum Social Mondial réunit les mouvements civiques pour la justice environnementale et les droits sociaux."
        is_sub, reason = is_substantive_evidence(headline, summary, source_domain="ftdes.net")
        self.assertTrue(is_sub, "Forum Social Mondial must pass substantive gate")
        self.assertNotEqual(reason, "sports_recreational_event")
        has_tn = has_tunisia_context(f"{headline} {summary}", source_domain="ftdes.net")
        self.assertTrue(has_tn)
        res = classify_issue_advanced(summary, headline=headline)
        self.assertLess(res.confidence, 0.70, "Competing environmental and migration justice topics must result in review confidence (< 0.70)")

    def test_v3_10_pubmed_tunisia_biomedical_pet_isolates_rejected_substantive(self):
        """V3.10 (Case A): Tunisia-specific biomedical laboratory study with no monitored-system nexus -> non-substantive."""
        headline = "Characterization of Enterococcus spp isolates from pets and their owners in Tunisia"
        is_sub, reason = is_substantive_evidence(headline, source_domain="pubmed.ncbi.nlm.nih.gov")
        self.assertFalse(is_sub, "Pet bacteria isolate study without public health crisis evidence must fail substantive gate")
        self.assertEqual(reason, "routine_admin_notice")

    def test_v3_11_pubmed_tunisia_molecular_docking_rejected_substantive(self):
        """V3.11 (Case B): Molecular docking and in-vitro assay study -> non-substantive."""
        headline = "Synthesis, molecular docking, and in vitro cytotoxic activity of heterocyclic derivatives from Tunisia"
        is_sub, reason = is_substantive_evidence(headline, source_domain="pubmed.ncbi.nlm.nih.gov")
        self.assertFalse(is_sub, "Molecular docking and in vitro assay must fail substantive gate")
        self.assertEqual(reason, "routine_admin_notice")

    def test_v3_12_pubmed_tunisia_environmental_pollution_remains_substantive(self):
        """V3.12 (Case C): Heavy metals in Gulf of Gabès remains eligible."""
        headline = "Heavy metal contamination and bioaccumulation in benthic organisms from the Gulf of Gabès, Tunisia"
        is_sub, reason = is_substantive_evidence(headline, source_domain="pubmed.ncbi.nlm.nih.gov")
        self.assertTrue(is_sub, "Heavy metal pollution research in Gulf of Gabès must pass substantive gate")
        has_tn = has_tunisia_context(headline, source_domain="pubmed.ncbi.nlm.nih.gov")
        self.assertTrue(has_tn)
        issue = classify_issue(headline, headline=headline)
        self.assertIn(issue, ["gabes", "pollution"])

    def test_v3_13_pubmed_drinking_water_contamination_remains_substantive(self):
        """V3.13 (Case D): Drinking water quality and contamination in rural Tunisia remains eligible."""
        headline = "Assessment of drinking water contamination and physicochemical quality in rural Tunisia"
        is_sub, reason = is_substantive_evidence(headline, source_domain="pubmed.ncbi.nlm.nih.gov")
        self.assertTrue(is_sub, "Drinking water contamination research must pass substantive gate")
        has_tn = has_tunisia_context(headline, source_domain="pubmed.ncbi.nlm.nih.gov")
        self.assertTrue(has_tn)
        issue = classify_issue(headline, headline=headline)
        self.assertEqual(issue, "water")

    def test_v3_14_pubmed_ambient_air_pollution_population_exposure_remains_substantive(self):
        """V3.14 (Case E): Sfax/Gabès ambient air pollution & population exposure remains eligible."""
        headline = "Ambient particulate matter air pollution and population exposure in Sfax and Gabès, Tunisia"
        is_sub, reason = is_substantive_evidence(headline, source_domain="pubmed.ncbi.nlm.nih.gov")
        self.assertTrue(is_sub, "Ambient air pollution and population exposure must pass substantive gate")
        has_tn = has_tunisia_context(headline, source_domain="pubmed.ncbi.nlm.nih.gov")
        self.assertTrue(has_tn)
        issue = classify_issue(headline, headline=headline)
        self.assertIn(issue, ["gabes", "pollution"])

    def test_v3_15_pubmed_organism_in_drinking_water_distribution_remains_substantive(self):
        """V3.15 (Case F): Academic study with organism name documenting drinking water contamination remains eligible."""
        headline = "Occurrence of multidrug-resistant Escherichia coli and Enterococcus isolates in municipal drinking water distribution networks in Tunisia"
        is_sub, reason = is_substantive_evidence(headline, source_domain="pubmed.ncbi.nlm.nih.gov")
        self.assertTrue(is_sub, "Study with organism name in drinking water network must pass substantive gate")
        has_tn = has_tunisia_context(headline, source_domain="pubmed.ncbi.nlm.nih.gov")
        self.assertTrue(has_tn)
        issue = classify_issue(headline, headline=headline)
        self.assertEqual(issue, "water")

    def test_v3_16_foreign_name_gaf_no_collision_fails_tunisia_context(self):
        """V3.16: Arbitrary foreign name with gaf or foreign entity does NOT pass Tunisia context."""
        foreign_texts = [
            "تصريحات الصحفي الجزائري فاروق ڤوزدار حول الانتخابات",
            "شركة فولكسڤاغن تعلن افتتاح مصنع جديد في ألمانيا"
        ]
        for ft in foreign_texts:
            has_tn = has_tunisia_context(ft, source_domain="nawaat.org")
            self.assertFalse(has_tn, f"Foreign entity '{ft}' must not trigger Tunisia context")

    def test_v3_17_false_substring_no_collision_arabic_regex(self):
        """V3.17: Regex word boundaries prevent false collisions on Arabic stems."""
        # "انقضاء" should NOT match "قضاء" (rights)
        self.assertFalse(_matches_keyword("قضاء", "انقضاء المدة القانونية"))
        # "سوسة" should NOT match "سجن"
        self.assertFalse(_matches_keyword("سجن", "مدينة سوسة الساحلية"))
        # Attached pronouns SHOULD match
        self.assertTrue(_matches_keyword("سجن", "حكمت بسجنه خمس سنوات"))
        self.assertTrue(_matches_keyword("قضاء", "أمام القضاء التونسي"))


if __name__ == "__main__":
    unittest.main()


