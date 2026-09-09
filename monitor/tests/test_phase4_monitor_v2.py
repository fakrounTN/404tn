# monitor/tests/test_phase4_monitor_v2.py
import unittest
import os
import tempfile
import sqlite3
import json
import time
from unittest.mock import patch
from fastapi.testclient import TestClient

from monitor.app.database import create_tables, get_db
from monitor.app.main import app
from monitor.app.services.classifier import (
    classify_issue_advanced, classify_issue, classify_epistemic,
    has_tunisia_context, is_substantive_evidence, determine_ingestion_status
)
from monitor.scripts.collect import (
    single_writer_lock, perform_database_backup, run_collection, MONITORED_TAXONOMY
)
from monitor.scripts.daily_quality_report import generate_quality_report
from monitor.app.services.source_health import record_source_attempt, get_all_source_health

class TestPhase4EvidenceMonitorV2(unittest.TestCase):
    """
    Comprehensive Phase 4 Evidence Monitor V2 Test Suite:
    - 100+ candidates across all 6 files, Gabès, foreign wires, sports, admin
    - Multi-lingual classification (FR, EN, AR)
    - Anti-trigger & Disambiguation rules
    - Ingestion routing (AUTO_ACCEPTED, REVIEW_REQUIRED, REJECTED)
    - Concurrency lockfile & rolling backup rotation
    - Daily Quality Report generator
    - Clean temporary database end-to-end verification
    """

    def setUp(self):
        self.temp_db_fd, self.temp_db_path = tempfile.mkstemp(suffix=".db")
        conn = sqlite3.connect(self.temp_db_path)
        create_tables(conn)
        conn.close()

    def tearDown(self):
        try:
            os.close(self.temp_db_fd)
            if os.path.exists(self.temp_db_path):
                os.remove(self.temp_db_path)
        except Exception:
            pass

    # =========================================================================
    # 1. 100+ CANDIDATE CLASSIFICATION & RELEVANCE SUITE
    # =========================================================================
    def test_multi_topic_candidate_corpus(self):
        """Tests 100+ distinct headlines across all domains, languages, and edge cases."""
        candidates = [
            # 1. WATER (15 items)
            ("Tunisie - SONEDE: Coupures d'eau potable dans plusieurs quartiers de Sfax", "water", "AUTO_ACCEPTED"),
            ("Baisse critique du niveau des barrages en Tunisie selon l'ONAGRI", "water", "AUTO_ACCEPTED"),
            ("Stress hydrique en Tunisie: le taux de remplissage des barrages chute à 28%", "water", "AUTO_ACCEPTED"),
            ("Gafsa: Epuisement de la nappe phreatique liee a l'extraction de phosphate", "water", "AUTO_ACCEPTED"),
            ("Tunisia water restrictions extended as severe drought threatens citrus harvest in Nabeul", "water", "AUTO_ACCEPTED"),
            ("Water cuts reported across Ariana and Ben Arous after main canal rupture", "water", "AUTO_ACCEPTED"),
            ("Groundwater depletion in Kairouan reaches alarming levels: Ministry of Agriculture report", "water", "AUTO_ACCEPTED"),
            ("الصوناد تعلن عن انقطاع مياه الشرب في صفاقس لمدة 48 ساعة", "water", "AUTO_ACCEPTED"),
            ("تراجع مخزون السدود التونسية إلى مستويات حرجة بسبب الجفاف", "water", "AUTO_ACCEPTED"),
            ("أزمة مياه الشرب في القيروان وتفاقم حالة الطوارئ المائية", "water", "AUTO_ACCEPTED"),
            ("انقطاع الماء الصالح للشرب بعدد من معتمديات ولاية بنزرت", "water", "AUTO_ACCEPTED"),
            ("وزارة الفلاحة تحذر من استنزاف المائدة المائية في سيدي بوزيد", "water", "AUTO_ACCEPTED"),
            ("SONEDE: Travaux urgents sur la conduite principale d'adduction d'eau a Sousse", "water", "AUTO_ACCEPTED"),
            ("Hydraulic deficit in Medenine forces emergency potable water rationing", "water", "AUTO_ACCEPTED"),
            ("حالة طوارئ مائية: إقرار نظام حصص ظرفي في توزيع مياه الري بتونس", "water", "AUTO_ACCEPTED"),

            # 2. ELECTRICITY (15 items)
            ("STEG: Panne d'electricite generale touchant les gouvernorats du Sahel", "electricity", "AUTO_ACCEPTED"),
            ("Pic historique de consommation electrique en Tunisie: la STEG craint un delestage", "electricity", "AUTO_ACCEPTED"),
            ("Coupure d'electricite majeure dans le Grand Tunis en raison d'une avarie au reseau", "electricity", "AUTO_ACCEPTED"),
            ("Augmentation prevue de la facture d'electricite STEG face aux couts du gaz naturel", "electricity", "AUTO_ACCEPTED"),
            ("Power outage plunges parts of Gabès and Tataouine into darkness during heatwave", "electricity", "AUTO_ACCEPTED"),
            ("Tunisian STEG power grid under strain as peak demand surpasses 4,800 MW", "electricity", "AUTO_ACCEPTED"),
            ("Load shedding implemented in industrial zones across Bizerte: official statement", "electricity", "AUTO_ACCEPTED"),
            ("الشركة التونسية للكهرباء والغاز تحذر من انقطاع التيار الكهربائي في أوقات الذروة", "electricity", "AUTO_ACCEPTED"),
            ("انقطاع الكهرباء عن عدة أحياء في تونس العاصمة بسبب عطب مفاجئ", "electricity", "AUTO_ACCEPTED"),
            ("ستاغ: تسجيل رقم قياسي جديد للطلب على الطاقة الكهربائية بتونس", "electricity", "AUTO_ACCEPTED"),
            ("أزمة الكهرباء: انقطاع التيار الكهربائي بجرجيس ومدنين لساعات متواصلة", "electricity", "AUTO_ACCEPTED"),
            ("انقطاع التيار الكهربائي في قابس: الستاغ توضح أسباب العطب الفني", "electricity", "AUTO_ACCEPTED"),
            ("STEG warns of grid vulnerability due to natural gas import dependence from Algeria", "electricity", "AUTO_ACCEPTED"),
            ("Coupures d'electricite repetees a Kasserine: colere des commercants", "electricity", "AUTO_ACCEPTED"),
            ("شركة الكهرباء والغاز: قطع التيار الكهربائي لأشغال صيانة مبرمجة في المنستير", "electricity", "AUTO_ACCEPTED"),

            # 3. WORK & ECONOMY (15 items)
            ("INS: Le taux de chomage en Tunisie atteint 16,1% au deuxieme trimestre 2026", "work", "AUTO_ACCEPTED"),
            ("L'UGTT appelle a une greve generale dans la fonction publique pour reclamer des hausses de salaires", "work", "AUTO_ACCEPTED"),
            ("Hausse de l'inflation alimentaire a 10,4%: forte pression sur le pouvoir d'achat des Tunisiens", "work", "AUTO_ACCEPTED"),
            ("Diplomes chomeurs: rassemblement de protestation devant le ministere de l'Emploi a Tunis", "work", "AUTO_ACCEPTED"),
            ("Tunisia unemployment rate rises among university graduates according to INS data", "work", "AUTO_ACCEPTED"),
            ("Food inflation and wage stagnation erode household purchasing power in Tunis", "work", "AUTO_ACCEPTED"),
            ("UGTT announces general transport strike across Greater Tunis demanding wage adjustments", "work", "AUTO_ACCEPTED"),
            ("معهد الإحصاء: نسبة البطالة في تونس تستقر عند 16% خلال الربع الثاني", "work", "AUTO_ACCEPTED"),
            ("الاتحاد العام التونسي للشغل يقرر الإضراب العام في قطاع الوظيفة العمومية", "work", "AUTO_ACCEPTED"),
            ("تدهور القدرة الشرائية للمواطن التونسي وتواصل ارتفاع نسبة التضخم المالي", "work", "AUTO_ACCEPTED"),
            ("احتجاجات أصحاب الشهائد العليا المعطلين عن العمل في القصرين للمطالبة بالانتداب", "work", "AUTO_ACCEPTED"),
            ("إضراب أعوان الصحة العمومية بتونس يربك العمل في المستشفيات", "work", "AUTO_ACCEPTED"),
            ("BCT: Pression persistante sur les reserves de change et le deficit commercial", "work", "AUTO_ACCEPTED"),
            ("Job market stagnation in inland regions: FTDES economic bulletin", "work", "AUTO_ACCEPTED"),
            ("اتحاد الشغل: الأجور الحالية لم تعد قادرة على مجابهة غلاء الأسعار في تونس", "work", "AUTO_ACCEPTED"),

            # 4. MIGRATION (15 items)
            ("Garde nationale maritime: Interception de 850 migrants et 12 embarcations clandestines pres de Sfax", "migration", "AUTO_ACCEPTED"),
            ("Naufrage au large de Kerkennah: 18 corps de migrants subsahariens repeches", "migration", "AUTO_ACCEPTED"),
            ("Tensions a El Amra et Jbeniana autour des campements de migrants irreguliers", "migration", "AUTO_ACCEPTED"),
            ("Harraga: Plusieurs disparus apres le chavirement d'un bateau de migrants a Zarzis", "migration", "AUTO_ACCEPTED"),
            ("Tunisian coast guard intercepts multiple migrant boats heading towards Lampedusa", "migration", "AUTO_ACCEPTED"),
            ("Tragic shipwreck off the coast of Mahdia: 14 drowned migrants recovered", "migration", "AUTO_ACCEPTED"),
            ("FTDES report: Over 12,000 irregular migrants intercepted off Tunisian shores in 2026", "migration", "AUTO_ACCEPTED"),
            ("الحرس البحري بصفاقس يحبط 15 عملية اجتياز للحدود البحرية خلسة ويوقف 400 مهاجر", "migration", "AUTO_ACCEPTED"),
            ("انتشال 10 جثث لمهاجرين غير نظاميين بعد غرق قارب قبالة سواحل المهدية", "migration", "AUTO_ACCEPTED"),
            ("تواصل التوتر في العامرة وجبنيانة بصفاقس بسبب أزمة المهاجرين غير النظاميين", "migration", "AUTO_ACCEPTED"),
            ("إحباط محاولة حرقة في جرجيس والاحتفاظ بالمجتازين: بلاغ وزارة الداخلية", "migration", "AUTO_ACCEPTED"),
            ("غرق مركب هجرة غير نظامية بسواحل قرقنة: عمليات الإنقاذ والبحث متواصلة", "migration", "AUTO_ACCEPTED"),
            ("Sea crossing attempts surge off Tunisian coastline amid calm summer waters", "migration", "AUTO_ACCEPTED"),
            ("Enquete sur les reseaux de passeurs a Zarzis: arrestation de 6 organisateurs de harraga", "migration", "AUTO_ACCEPTED"),
            ("المنتدى التونسي للحقوق الاقتصادية والاجتماعية: تصاعد أعداد الضحايا والمفقودين في البحر", "migration", "AUTO_ACCEPTED"),

            # 5. PUBLIC SERVICES (15 items)
            ("Crise des hopitaux publics en Tunisie: penurie critique de medicaments essentiels", "public_services", "AUTO_ACCEPTED"),
            ("Transtu: Paralysie des lignes de bus et du metro leger a Tunis suite a une panne materielle", "public_services", "AUTO_ACCEPTED"),
            ("Accumulation des ordures et faillite de l'assainissement municipal a Sousse: ONAS pointe", "public_services", "AUTO_ACCEPTED"),
            ("Pharmacie Centrale de Tunisie: Ravitaillement d'urgence pour les hopitaux universitaires", "public_services", "AUTO_ACCEPTED"),
            ("Tunisian public hospitals face acute shortages of anesthetics and cancer treatments", "public_services", "AUTO_ACCEPTED"),
            ("Public transport crisis in Tunis: aged SNCFT commuter trains suffer daily cancellations", "public_services", "AUTO_ACCEPTED"),
            ("Wastewater discharges into the sea by ONAS spark civic outrage in Monastir", "public_services", "AUTO_ACCEPTED"),
            ("أزمة الأدوية في تونس: نقص حاد في أدوية الأمراض المزمنة بالمستشفيات العمومية", "public_services", "AUTO_ACCEPTED"),
            ("شركة نقل تونس: اضطراب كبير في حركة المترو والحافلات بسبب تهالك الأسطول", "public_services", "AUTO_ACCEPTED"),
            ("تراكم النفايات المنزلية ومياه الصرف الصحي في نابل يهدد الصحة العمومية", "public_services", "AUTO_ACCEPTED"),
            ("المستشفى العمومي بالكاف يواجه نقصا فادحا في أطباء الاختصاص والتجهيزات", "public_services", "AUTO_ACCEPTED"),
            ("أزمة النقل العمومي بتونس: طوابير طويلة وغضب في محطات حافلات شركة النقل", "public_services", "AUTO_ACCEPTED"),
            ("SNCFT: Retards massifs sur la ligne de banlieue sud suite a un dysfonctionnement technique", "public_services", "AUTO_ACCEPTED"),
            ("Healthcare stockouts in regional clinics across Zaghouan documented by civil society", "public_services", "AUTO_ACCEPTED"),
            ("الديوان الوطني للتطهير: بدء أشغال صيانة شبكة تصريف المياه المستعملة بأريانة", "public_services", "AUTO_ACCEPTED"),

            # 6. RIGHTS & INSTITUTIONS (15 items)
            ("Poursuites judiciaires sous le Decret 54 contre plusieurs journalistes et avocats a Tunis", "rights", "AUTO_ACCEPTED"),
            ("Le SNJT denonce les atteintes repetees a la liberte de la presse en Tunisie", "rights", "AUTO_ACCEPTED"),
            ("Mandat de depot emis contre un opposant politique par le juge d'instruction du tribunal de Tunis", "rights", "AUTO_ACCEPTED"),
            ("President de la Republique a Carthage: Remaniement ministeriel et nominations a la Kasbah", "institutions", "AUTO_ACCEPTED"),
            ("Decree 54 prosecutions against Tunisian media figures raise alarm: international rights report", "rights", "AUTO_ACCEPTED"),
            ("National Union of Tunisian Journalists (SNJT) condemns detention of investigative reporter", "rights", "AUTO_ACCEPTED"),
            ("Tunisian court issues detention warrant for lawyer following television commentary", "rights", "AUTO_ACCEPTED"),
            ("Tunisian presidential decree dissolves municipal councils and consolidates local executive power", "institutions", "AUTO_ACCEPTED"),
            ("النقابة الوطنية للصحفيين التونسيين تندد بإحالة إعلاميين على القضاء بموجب المرسوم 54", "rights", "AUTO_ACCEPTED"),
            ("بطاقة إيداع بالسجن في حق محام وناشط سياسي بقرار من قاضي التحقيق بتونس", "rights", "AUTO_ACCEPTED"),
            ("رئيس الجمهورية يشرف في قصر قرطاج على اجتماع مجلس الوزراء ويعلن تحويرا وزاريا", "institutions", "AUTO_ACCEPTED"),
            ("بيان مشترك لمنظمات حقوقية بتونس: تراجع مقلق في ضمانات المحاكمة العادلة وحرية التعبير", "rights", "AUTO_ACCEPTED"),
            ("Cour de cassation de Tunis: Report du proces de plusieurs detenus d'opinion", "rights", "AUTO_ACCEPTED"),
            ("ARP: L'Assemblee des representants du peuple examine le projet de loi sur les associations", "institutions", "AUTO_ACCEPTED"),
            ("المحكمة الابتدائية بتونس تقضي بسجن ناشطين بمقتضى الفصل 24 من المرسوم 54", "rights", "AUTO_ACCEPTED"),

            # 7. GABES FLAGSHIP (10 items)
            ("Gabes: Pollution chimique et rejets massifs de phosphogypse a Chatt Essalam", "gabes", "AUTO_ACCEPTED"),
            ("Catastrophe environnementale dans le golfe de Gabes: les pecheurs manifestent contre les rejets industriels", "gabes", "AUTO_ACCEPTED"),
            ("Gabès: Des gaz toxiques emanant du complexe chimique provoquent des cas d'asphyxie a Bouchemma", "gabes", "AUTO_ACCEPTED"),
            ("Industrial pollution in Gulf of Gabes causes marine biodiversity loss and respiratory illness", "gabes", "AUTO_ACCEPTED"),
            ("Medical reports in Gabès highlight spike in asthma and chronic diseases due to chemical factory emissions", "gabes", "AUTO_ACCEPTED"),
            ("تلوث كيميائي خطير في قابس: وقفة احتجاجية في شط السلام ضد انبعاثات المجمع الكيميائي", "gabes", "AUTO_ACCEPTED"),
            ("كارثة بيئية في خليج قابس جراء سكب آلاف الأطنان من الفسفوجيبس في البحر", "gabes", "AUTO_ACCEPTED"),
            ("أهالي قابس يطالبون بتفعيل قرار تفكيك الوحدات الملوثة ونقل المجمع الكيميائي", "gabes", "AUTO_ACCEPTED"),
            ("Toxic gas release in Gabes industrial area prompts hospital emergency visits", "gabes", "AUTO_ACCEPTED"),
            ("تلوث بحري في قابس: تدهور الصيد البحري ونفوق كميات من الأسماك بشواطئ غنوش", "gabes", "AUTO_ACCEPTED"),

            # 8. FOREIGN WIRE STORIES (REJECTED - 10 items)
            ("Nepal rescuers reach remote areas, electricity restored nearly one week after disaster", None, "REJECTED"),
            ("Massive power outages plunge northern India into darkness after monsoon flooding", None, "REJECTED"),
            ("France water restrictions tightened across southern departments as drought deepens", None, "REJECTED"),
            ("Indonesia floods displace thousands in Jakarta as heavy rains trigger river overflow", None, "REJECTED"),
            ("Ukraine energy grid damaged by missile strikes, emergency blackouts across Kyiv", None, "REJECTED"),
            ("California water agency declares drought emergency for Central Valley agriculture", None, "REJECTED"),
            ("انقطاع الكهرباء في الخرطوم بعد اشتباكات عنيفة قرب محطة التوليد الرئيسية", None, "REJECTED"),
            ("أزمة مياه حادة في طهران بسبب تراجع الأمطار وجفاف السدود الإيرانية", None, "REJECTED"),
            ("Greece wildfires trigger widespread power and water cuts in Athens suburbs", None, "REJECTED"),
            ("Italy declares state of emergency in Sicily over agricultural drought", None, "REJECTED"),

            # 9. SPORTS & TRAINING & GENERIC PAGES (REJECTED - 10 items)
            ("Jeux Mediterraneens: Medaille d'or pour la Tunisie en halterophilie", None, "REJECTED"),
            ("Firas Katoussi remporte la medaille d'or au championnat du monde", None, "REJECTED"),
            ("بطولة العالم لرفع الأثقال: تتويج المنتخب التونسي بميداليتين ذهبيتين", None, "REJECTED"),
            ("Session de formation au profit des jeunes journalistes sur le journalisme d'investigation", None, "REJECTED"),
            ("سلسلة من الدورات التدريبية ينظمها مركز التدريب الإعلامي", None, "REJECTED"),
            ("Actualites", None, "REJECTED"),
            ("الرئيسية", None, "REJECTED"),
            ("Publications et rapports d'activites", None, "REJECTED"),
            ("Lancement d'une application mobile pour acceder aux services administratifs", None, "REJECTED"),
            ("المسابقة الوطنية لأفضل عمل صحفي لسنة 2026", None, "REJECTED"),
        ]

        total_tested = len(candidates)
        self.assertGreaterEqual(total_tested, 100, f"Must test at least 100 candidates (tested {total_tested})")

        passed_count = 0
        for headline, expected_issue, expected_status in candidates:
            # 1. Substantive evidence check
            is_sub, sub_reason = is_substantive_evidence(headline)

            # 2. Tunisia context check
            is_tn = has_tunisia_context(headline)

            # 3. Primary Subject Classification
            cls_res = classify_issue_advanced(headline)

            # 4. Status determination
            is_tax = bool(cls_res.primary_issue and cls_res.primary_issue in MONITORED_TAXONOMY)
            status, reason = determine_ingestion_status(
                is_substantive=is_sub,
                is_taxonomy_match=is_tax,
                is_tunisia=is_tn,
                confidence=cls_res.confidence,
                substantive_reason=sub_reason
            )

            if expected_status == "AUTO_ACCEPTED":
                self.assertEqual(status, "AUTO_ACCEPTED", f"Failed AUTO_ACCEPTED for: {headline} (got {status}, reason: {reason})")
                self.assertEqual(cls_res.primary_issue, expected_issue, f"Wrong issue for: {headline} (expected {expected_issue}, got {cls_res.primary_issue})")
                self.assertGreaterEqual(cls_res.confidence, 0.70)
            elif expected_status == "REJECTED":
                self.assertEqual(status, "REJECTED", f"Expected REJECTED for: {headline} (got {status}, reason: {reason})")

            passed_count += 1

        print(f"[OK] 100+ Candidate Test Suite: All {passed_count} verified successfully.")

    # =========================================================================
    # 2. CONCURRENCY LOCKFILE & STALE TIMEOUT TEST
    # =========================================================================
    def test_single_writer_lock_prevents_overlap(self):
        """Verifies that an active lock raises an error, while a stale lock is safely broken."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            test_lock = os.path.join(tmp_dir, ".test.lock")

            # 1. Acquire primary lock
            with single_writer_lock(lock_path=test_lock):
                self.assertTrue(os.path.exists(test_lock))

                # Attempting concurrent lock must raise RuntimeError
                with self.assertRaises(RuntimeError):
                    with single_writer_lock(lock_path=test_lock, stale_timeout_sec=3600):
                        pass

            # Once out of context, lockfile must be removed
            self.assertFalse(os.path.exists(test_lock))

            # 2. Test Stale Lock Breaking
            with open(test_lock, "w", encoding="utf-8") as f:
                json.dump({"pid": 999999, "timestamp": time.time() - 5000, "started_at": "old"}, f)

            # A stale lock (> 1800s) must be overwritten and successfully acquired
            with single_writer_lock(lock_path=test_lock, stale_timeout_sec=1800):
                self.assertTrue(os.path.exists(test_lock))
                with open(test_lock, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.assertEqual(data["pid"], os.getpid())

    # =========================================================================
    # 3. PRE-RUN ROLLING BACKUP TEST
    # =========================================================================
    def test_database_backup_and_rotation(self):
        """Verifies atomic SQLite online backup and rotation keeping only last N backups."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            db_path = os.path.join(tmp_dir, "test.db")
            backups_dir = os.path.join(tmp_dir, "backups")

            # Initialize DB
            conn = sqlite3.connect(db_path)
            create_tables(conn)
            conn.close()

            # Perform 10 sequential backups
            for i in range(10):
                time.sleep(0.02)
                perform_database_backup(db_path=db_path, backups_dir=backups_dir, max_backups=7)

            backup_files = [f for f in os.listdir(backups_dir) if f.startswith("404tn_backup_")]
            self.assertEqual(len(backup_files), 7, f"Must rotate and keep exactly 7 backups (got {len(backup_files)})")

    # =========================================================================
    # 4. DAILY QUALITY REPORT GENERATOR TEST
    # =========================================================================
    def test_daily_quality_report_generation(self):
        """Verifies that daily_quality_report.py generates valid metrics from DB."""
        with tempfile.TemporaryDirectory() as tmp_dir:
            db_path = os.path.join(tmp_dir, "report_test.db")
            conn = sqlite3.connect(db_path)
            create_tables(conn)

            # Insert sample AUTO_ACCEPTED and REVIEW_REQUIRED records
            conn.execute("""
                INSERT INTO evidence (
                    id, issue, headline, summary, classification, status, published_at, collected_at,
                    last_checked, source_name, source_domain, source_type, source_url, ingestion_status,
                    classification_confidence, classification_reason
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "EV-AUTO-20260909-REP01", "water", "Coupure d'eau a Sfax", "Panne majeure SONEDE",
                "FACT", "VERIFIED", "2026-09-09", "2026-09-09T10:00:00Z", "2026-09-09T10:00:00Z",
                "TAP", "tap.info.tn", "news_agency", "https://tap.info.tn/fr/sfax", "AUTO_ACCEPTED",
                0.92, "Primary strong keyword match 'coupure d\\'eau'"
            ))
            conn.execute("""
                INSERT INTO evidence (
                    id, issue, headline, summary, classification, status, published_at, collected_at,
                    last_checked, source_name, source_domain, source_type, source_url, ingestion_status,
                    classification_confidence, classification_reason
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "EV-AUTO-20260909-REP02", "public_services", "Crise du transport a Tunis", "Retards et pannes",
                "FACT", "REPORTED", "2026-09-09", "2026-09-09T11:00:00Z", "2026-09-09T11:00:00Z",
                "Nawaat", "nawaat.org", "independent_media", "https://nawaat.org/transport", "REVIEW_REQUIRED",
                0.60, "Borderline confidence score (0.60); flagged for review"
            ))
            conn.commit()

            # Record sample source health
            record_source_attempt(
                conn=conn,
                source_id="tap_fr",
                http_status=200,
                items_discovered=20,
                items_parsed=18,
                relevant_count=12,
                duration_ms=450.0,
                is_enabled=True
            )
            conn.close()

            # Generate report
            report = generate_quality_report(db_path=db_path, hours=24, save=False, json_output=False)
            self.assertIsNotNone(report)
            self.assertEqual(report["total_evidence_records"], 2)
            self.assertEqual(report["ingestion_status_recent"]["AUTO_ACCEPTED"], 1)
            self.assertEqual(report["ingestion_status_recent"]["REVIEW_REQUIRED"], 1)
            self.assertEqual(report["review_queue_count"], 1)
            self.assertEqual(len(report["source_health"]), 1)

    # =========================================================================
    # 5. END-TO-END CLEAN PIPELINE WITH API CONTRACTS
    # =========================================================================
    def test_clean_pipeline_with_review_queue_e2e(self):
        """Verifies clean DB execution, review-queue endpoint, and strict AUTO_ACCEPTED filtering."""
        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            conn = sqlite3.connect(self.temp_db_path)
            create_tables(conn)

            # Insert an AUTO_ACCEPTED and a REVIEW_REQUIRED record
            conn.execute("""
                INSERT INTO evidence (
                    id, issue, sub_issue, location, latitude, longitude, headline, summary, claim,
                    classification, status, event_date, published_at, collected_at, last_checked,
                    source_name, source_domain, source_type, source_url, source_language,
                    source_confidence, evidence_confidence, current_or_historical, content_hash,
                    secondary_topics, classification_confidence, classification_reason, ingestion_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "EV-AUTO-20260909-AUTO01", "water", "distribution", "Kasserine", 35.1676, 8.8365,
                "SONEDE: Coupure d'eau potable a Kasserine", "Maintenance programmée sur le reseau principal.",
                "SONEDE: Coupure d'eau potable a Kasserine", "FACT", "VERIFIED", "2026-08-15T08:00:00Z",
                "2026-08-15T08:00:00Z", "2026-09-09T12:00:00Z", "2026-09-09T12:00:00Z",
                "SONEDE", "sonede.com.tn", "state_agency", "https://sonede.com.tn/kasserine", "fr",
                0.95, 0.95, "CURRENT", "hash-auto-01", "[\"public_services\"]", 0.95,
                "Primary strong term 'coupure d\\'eau' in headline", "AUTO_ACCEPTED"
            ))
            conn.execute("""
                INSERT INTO evidence (
                    id, issue, sub_issue, location, latitude, longitude, headline, summary, claim,
                    classification, status, event_date, published_at, collected_at, last_checked,
                    source_name, source_domain, source_type, source_url, source_language,
                    source_confidence, evidence_confidence, current_or_historical, content_hash,
                    secondary_topics, classification_confidence, classification_reason, ingestion_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "EV-AUTO-20260909-REV01", "rights", "justice", "Tunis", 36.8065, 10.1815,
                "Débat sur la liberté d'expression", "Discussion autour des lois sur les médias.",
                "Débat sur la liberté d'expression", "ANALYSIS", "UNDER REVIEW", "2026-08-16T08:00:00Z",
                "2026-08-16T08:00:00Z", "2026-09-09T12:00:00Z", "2026-09-09T12:00:00Z",
                "Inkyfada", "inkyfada.com", "independent_media", "https://inkyfada.com/debat", "fr",
                0.90, 0.65, "CURRENT", "hash-rev-01", "[\"institutions\"]", 0.65,
                "Borderline confidence score (0.65); flagged for review", "REVIEW_REQUIRED"
            ))
            conn.commit()
            conn.close()

            client = TestClient(app)

            # Public timeline must ONLY expose AUTO_ACCEPTED (1 record)
            res_tl = client.get("/api/timeline")
            self.assertEqual(res_tl.status_code, 200)
            tl_events = res_tl.json()
            self.assertEqual(len(tl_events), 1)
            self.assertEqual(tl_events[0]["id"], "EV-AUTO-20260909-AUTO01")

            # Public map must ONLY expose AUTO_ACCEPTED
            res_map = client.get("/api/map")
            self.assertEqual(res_map.status_code, 200)
            map_data = res_map.json()
            self.assertEqual(len(map_data["features"]), 1)
            self.assertEqual(map_data["features"][0]["id"], "EV-AUTO-20260909-AUTO01")

            # Review queue endpoint must return the REVIEW_REQUIRED record
            res_rev = client.get("/api/evidence/review-queue")
            self.assertEqual(res_rev.status_code, 200)
            rev_items = res_rev.json()
            self.assertEqual(len(rev_items), 1)
            self.assertEqual(rev_items[0]["id"], "EV-AUTO-20260909-REV01")
            self.assertEqual(rev_items[0]["ingestion_status"], "REVIEW_REQUIRED")

            # Evidence detail drawer check
            res_ev = client.get("/api/evidence/EV-AUTO-20260909-AUTO01")
            self.assertEqual(res_ev.status_code, 200)
            ev_data = res_ev.json()
            self.assertEqual(ev_data["secondary_topics"], ["public_services"])
            self.assertEqual(ev_data["ingestion_status"], "AUTO_ACCEPTED")
            self.assertGreaterEqual(ev_data["classification_confidence"], 0.90)

            print("[OK] Clean Pipeline and API Verification passed successfully.")

if __name__ == "__main__":
    unittest.main()
