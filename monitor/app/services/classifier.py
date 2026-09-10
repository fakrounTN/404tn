# monitor/app/services/classifier.py
import re
import unicodedata
import functools
from typing import Tuple, List, Optional, Dict, Any

# Low-value, generic landing pages, training announcements, sports, and routine administrative patterns
GENERIC_PAGE_PATTERNS = [
    r"^actualites?(?:\s*[-–—/|:]\s*.*)?$",
    r"^actualite(?:\s*[-–—/|:]\s*.*)?$",
    r"^news(?:\s*[-–—/|:]\s*.*)?$",
    r"^rapports?(?:\s*d['’]activites?)?$",
    r"^publications?$",
    r"^communiques?(?:\s*de\s*presse)?$",
    r"^accueil$",
    r"^index$",
    r"^archives?$",
    r"^recherche$",
    r"^contact$",
    r"^a propos$",
    r"^qui sommes[- ]nous\??$",
    r"^evenements?$",
    r"^galerie(?:\s*photos?)?$",
    r"^documents?$",
    r"^الرئيسية$",
    r"^أخبار(?:\s*[-–—/|:]\s*.*)?$",
    r"^اخبار(?:\s*[-–—/|:]\s*.*)?$",
    r"^أخبار\s+الوزارة$",
    r"^نشاط\s+الوزارة$",
    r"^تقارير$",
    r"^إصدارات$",
    r"^اصدارات$",
    r"^وثائق$",
    r"^بلاغات(?:\s*صحفية)?$",
    r"^بيانات(?:\s*صحفية)?$",
    r"^من نحن\??$",
    r"^اتصل بنا$"
]

TRAINING_WORKSHOP_PATTERNS = [
    r"سلسلة من الدورات التدريبية", r"دورة تدريبية", r"دورتان تدريبيتان", r"دورات تدريبية",
    r"اختتام الدورة التدريبية", r"انطلاق أشغال الدورة التدريبية", r"session de formation",
    r"atelier de formation", r"cycle de formation", r"formation des journalistes"
]

SPORTS_PATTERNS = [
    r"jeux mediterraneens", r"jm tarente", r"tarente", r"aviron", r"halterophilie", r"gymnastique",
    r"medaille d['’]or", r"medaille d['’]argent", r"medaille de bronze", r"medaillee?",
    r"championnat", r"firas katoussi", r"karem ben hnia", r"moetaman billah", r"ahmed jaziri",
    r"marwa bouzayani", r"rehab dhahri", r"aymen bacha", r"lamouchi", r"herve renard", r"hervé renard",
    r"coupe du monde", r"mondial (?:de |du )?football", r"mondial 2026 (?:de |du )?football",
    r"mondial fifa", r"la ftf\b", r"\bftf\b", r"federation tunisienne de football",
    r"equipe nationale de football", r"selection nationale", r"ligue 1", r"mercato", r"mercato estival",
    r"foot - ", r"football", r"athletisme", r"steeple", r"3000 m steeple", r"handball", r"basketball",
    r"العاب البحر الابيض المتوسط", r"العاب متوسطية", r"الالعاب المتوسطية", r"تارانتو",
    r"ميدالية ذهبية", r"ميدالية فضية", r"ميدالية برونزية", r"ميدالية", r"الميدالية",
    r"الميدالية الذهبية", r"الميدالية الفضية", r"الميدالية البرونزية", r"بطولة العالم", r"كرة القدم", r"رفع الاثقال", r"رفع اثقال", r"رفع الأثقال",
    r"جامعة كرة القدم", r"الجامعة التونسية لكرة القدم", r"كأس العالم", r"كاس العالم",
    r"المنتخب الوطني لكرة القدم", r"المنتخب التونسي", r"ألعاب القوى", r"العاب القوى", r"سباق 3000",
    r"كرة اليد", r"كرة السلة", r"الترجي الرياضي", r"النادي الافريقي", r"النجم الساحلي", r"النادي الصفاقسي"
]

ROUTINE_ADMIN_PATTERNS = [
    # Contests & Apps
    r"open applications for best reporting", r"application mobile pour acceder aux services",
    r"lancement de la bibliotheque documentaire en ligne", r"concours pour le recrutement",
    r"المسابقة الوطنية لأفضل عمل صحفي", r"تطبيق جوال",
    # Public Tenders & Procurement
    r"appel d['’]offres?", r"appels d['’]offres?", r"avis d['’]appel d['’]offres?",
    r"marche public", r"marches publics", r"consultation pour l['’]acquisition",
    r"acquisition de materiel", r"fourniture de bureau", r"avis de consultation",
    r"طلب عروض", r"طلبات العروض", r"طلب العروض", r"استشارة لاقتناء", r"استشارة عدد",
    r"طلب عروض عدد", r"لاقتناء", r"صفقة عمومية", r"صفقات عمومية", r"طلب عروض وطني",
    r"طلب عروض دولي", r"اقتناء آلات ناسخة", r"اقتناء سيارات", r"اقتناء معدات",
    # Protocol / Ceremonial / Official Festivities / Commemorative Days
    r"موكب الإحتفال", r"موكب الاحتفال", r"موكب إحياء", r"موكب احياء",
    r"يوم العلم", r"الإحتفال بيوم العلم", r"الاحتفال بيوم العلم",
    r"عيد الشجرة", r"عيد الشهداء", r"عيد الاستقلال", r"عيد الجلاء", r"عيد المرأة",
    r"حفل تكريم", r"موكب تسليم", r"موكب رسمي",
    r"ceremonie de celebration", r"journee du savoir", r"fete de l['’]arbre",
    r"fete de l['’]independance", r"fete des martyrs", r"fete de l['’]evacuation",
    r"remise des lettres de creance", r"visite de courtoisie", r"echange de voeux",
    r"تسليم أوراق اعتماد", r"تسلم أوراق اعتماد", r"تبادل التهاني", r"برقية تهنئة",
    # Internal Organizational Congresses & General Assemblies
    r"إعلام بالمؤتمر", r"اعلام بالمؤتمر",
    r"المؤتمر الوطني الرابع للمنتدى", r"المؤتمر الوطني للمنتدى",
    r"المؤتمر الوطني للنقابة", r"المؤتمر الانتخابي",
    r"مؤتمر النقابة", r"المؤتمر.*للنقابة", r"المؤتمر.*للمهنة", r"مؤتمر المهنة",
    r"بلاغ.*المؤتمر", r"بلاغ المؤتمر",
    r"congres national du ftdes", r"congres national de l['’]ugtt", r"congres du snjt",
    r"congres.*(?:snjt|ugtt|ftdes|syndicat|profession)",
    r"assemblee generale ordinaire", r"assemblee generale elective",
    r"الجلسة العامة العادية", r"الجلسة العامة الانتخابية"
]

# GENERALIZED ACADEMIC / BIOMEDICAL STUDY INDICATORS (PubMed)
ACADEMIC_LAB_INDICATORS = [
    r"in vitro", r"in-vitro", r"molecular docking", r"synthesis and characterization",
    r"spectroscopic characterization", r"crystal structure", r"essential oil composition",
    r"phytochemical screening", r"antioxidant activity", r"activite antioxydante",
    r"cytotoxic activity", r"antimicrobial susceptibility", r"antimicrobial resistance of isolates",
    r"characterization of isolates", r"isolates from pets", r"isolated from healthy",
    r"isolated from animal", r"experimental model", r"rat liver", r"dental caries",
    r"prevalence of intestinal parasites", r"genetic polymorphism of", r"enterococcus spp",
    r"staphylococcus aureus", r"escherichia coli isolates", r"bacterial isolates"
]

# MONITORED REAL-WORLD PUBLIC SYSTEM, POLLUTION, HEALTH & EPIDEMIOLOGICAL IMPACT SIGNALS
MONITORED_SYSTEM_IMPACT_SIGNALS = [
    # Drinking water / groundwater / hydraulic quality
    r"drinking water", r"eau potable", r"contamination de l['’]eau", r"water contamination",
    r"groundwater contamination", r"water quality", r"water pollution", r"polluted water",
    r"water scarcity", r"nappe phreatique", r"nappes phreatiques", r"sonede", r"مياه الشرب", r"تلوث المياه",
    # Ambient air pollution / industrial emissions
    r"air pollution", r"pollution de l['’]air", r"particulate matter", r"ambient exposure",
    r"industrial pollution", r"pollution industrielle", r"emissions toxiques", r"gaz toxiques",
    r"rejets polluants", r"تلوث الهواء",
    # Heavy metals / marine ecotoxicology / industrial toxic discharge
    r"heavy metal", r"heavy metals", r"metaux lourds", r"bioaccumulation", r"coastal pollution",
    r"pollution marine", r"phosphogypsum", r"phosphogypse", r"gulf of gabes", r"golfe de gabes",
    r"chatt essalam", r"gct", r"cpg", r"anpe", r"تلوث بحري", r"فسفوجيبس", r"خليج قابس",
    # Population-level exposure / public health burden
    r"human exposure", r"population exposure", r"health risk assessment", r"epidemiological study",
    r"epidemiological burden", r"public health impact", r"risk of exposure", r"sanitary risk",
    r"risque sanitaire", r"sante publique", r"صحة عمومية",
    # Public health supply / hospital infrastructure
    r"penurie de medicaments", r"drug shortage", r"medicine shortage", r"hospital shortage",
    r"penurie hospitaliere", r"hopital public", r"مستشفيات عمومية", r"نقص الادوية", r"نقص الأدوية"
]

# PRIMARY SUBJECT TAXONOMY DEFINITION (EN, FR, AR)
PRIMARY_TAXONOMY = {
    "water": {
        "strong": [
            "eau potable", "coupure d'eau", "coupures d'eau", "distribution d'eau", "penurie d'eau",
            "stress hydrique", "secheresse", "nappe phreatique", "nappes phreatiques",
            "ressources hydrauliques", "sonede", "barrage", "barrages", "onagri",
            "urgence hydrique", "etat d'urgence hydrique", "deficit hydrique",
            "gestion de l'eau", "eau d'irrigation", "epuisement des nappes",
            "potable water", "water cuts", "water disruption", "water scarcity", "drought",
            "water restrictions", "dam storage", "groundwater depletion",
            "مياه الشرب", "انقطاع الماء", "انقطاع المياه", "قطع المياه", "صوناد", "الصوناد",
            "سدود", "السدود", "سد", "السد", "جفاف", "الجفاف", "الموارد المائية", "المائدة المائية",
            "شح المياه", "ري", "الري", "طوارئ مائية", "الطوارئ المائية", "حالة الطوارئ المائية",
            "نقص المياه", "مخزون السدود", "المرصد التونسي للمياه", "علاء المرزوقي", "أزمة مياه",
            "الشركة الوطنية لاستغلال وتوزيع المياه", "مياه الري", "مائدة مائية"
        ],
        "context": ["eau", "water", "irrigation", "agricole", "hydraulique", "مياه", "المياه", "ماء", "الماء", "مائي", "مائية", "المائية", "عطش", "العطش"]
    },
    "electricity": {
        "strong": [
            "steg", "electricite", "electricity", "power cut", "power cuts", "power outage",
            "power outages", "blackout", "load shedding", "power grid", "electrical grid",
            "coupure d'electricite", "coupures d'electricite", "panne d'electricite",
            "delestage", "reseau electrique", "facture steg", "centrale electrique",
            "production d'electricite", "megawatts", "puissance electrique",
            "انقطاع الكهرباء", "انقطاع التيار الكهربائي", "انقطاع التيار", "ستاغ", "الستاغ",
            "الشركة التونسية للكهرباء والغاز", "شبكة الكهرباء", "توليد الكهرباء", "الضغط العالي",
            "الكهرباء", "كهرباء", "ازمة الكهرباء", "محطة توليد الكهرباء", "أزمة الكهرباء"
        ],
        "context": ["energie", "energy", "power", "courant", "gaz naturel", "natural gas", "طاقة", "غاز", "كهربائي", "الكهربائي", "كهربائية", "الكهربائية"]
    },
    "migration": {
        "strong": [
            "harraga", "garde nationale maritime", "garde maritime", "embarcation clandestine",
            "naufrage", "corps repeches", "corps repêchés", "interception en mer",
            "migrants subsahariens", "migrants irreguliers", "migration irreguliere",
            "irregular migration", "coast guard", "sea crossing", "migrant boat", "drowned migrants",
            "el amra", "jbeniana", "zarzis",
            "هجرة غير نظامية", "الهجرة غير النظامية",
            "حرقة", "الحرقة", "حرقّة", "الحرقّة",
            "حرڨة", "الحرڨة", "حرڤة", "الحرڤة",
            "حراقة", "الحراقة", "حراڨة", "الحراڨة", "حراڤة", "الحراڤة",
            "حرقت", "حرقوا", "حرڨت", "حرڤت", "حرڨوا", "حرڤوا",
            "يحرڨ", "يحرڤ", "يحرق", "حرڨ", "حرڤ",
            "حرس بحري", "الحرس البحري", "اجتياز الحدود", "غرق مركب", "غرق قارب",
            "جثث", "الجثث", "انتشال", "مهاجرين غير نظاميين", "المهاجرين غير النظاميين",
            "مهاجرون غير نظاميين", "المهاجرون غير النظاميين", "العامرة", "جبنيانة", "جرجيس",
            "عمليات اجتياز", "انقاذ مهاجرين", "احباط محاولة اجتياز", "مهاجرين", "المهاجرين",
            "ضحايا ومفقودين", "المفقودين في البحر", "مفقودين في البحر", "ضحايا في البحر", "مفقودي البحر", "مفقودين", "المفقودين"
        ],
        "context": ["migration", "migrant", "migrants", "immigration", "passeurs", "migratoire", "هجرة", "الهجرة", "مهاجر", "المهاجر"]
    },
    "work": {
        "strong": [
            "chomage", "taux de chomage", "demandeurs d'emploi", "diplomes chomeurs",
            "recrutement public", "pouvoir d'achat", "inflation", "smig", "greve", "ugtt",
            "salaires", "augmentation salariale", "pente des prix", "indice des prix",
            "indice des prix a la consommation", "indice des prix à la consommation", "prix a la consommation",
            "indicateurs de l'emploi", "indicateurs de l’emploi", "chiffres du chomage", "chiffres du chômage",
            "croissance economique", "croissance economique au", "croissance économique", "production industrielle",
            "indice de la production industrielle", "indice de la production",
            "unemployment", "unemployment rate", "job market", "wage increase", "purchasing power",
            "food inflation", "labor strike", "economic growth", "industrial production", "consumer price index",
            "بطالة", "البطالة", "نسبة البطالة", "تشغيل", "التشغيل", "أجور", "الأجور", "اجور", "الاجور",
            "قدرة شرائية", "القدرة الشرائية", "تضخم", "التضخم", "إضراب", "الإضراب", "اضراب", "الاضراب",
            "انتداب", "الانتداب", "أسعار المواد الأساسية", "اصحاب الشهادات", "أصحاب الشهادات",
            "اصحاب الشهائد", "أصحاب الشهائد", "المعطلين عن العمل", "سوق الشغل",
            "الاتحاد العام التونسي للشغل", "مطالب الشغل", "فرص عمل", "سوق العمل", "قانون العمل",
            "ظروف العمل", "عقود العمل", "مناصب عمل", "توفير مواطن الشغل", "عمال الحضائر", "التشغيل الهش",
            "النمو الاقتصادي", "مؤشر أسعار الاستهلاك", "مؤشر اسعار الاستهلاك", "مؤشرات التشغيل",
            "مؤشرات البطالة", "الإنتاج الصناعي", "الانتاج الصناعي", "الناتج المحلي الإجمالي", "الناتج المحلي الاجمالي"
        ],
        "context": ["emploi", "employment", "job", "salary", "salaire", "travailleurs", "ouvriers", "bct", "ins", "fmi", "croissance", "pib", "رواتب", "نمو", "انتاج صناعي", "إنتاج صناعي"]
    },
    "public_services": {
        "strong": [
            "hopital public", "hopitaux publics", "sante publique", "penurie de medicaments",
            "pharmacie centrale", "pct", "transtu", "sncft", "transport public", "transports publics",
            "ramassage des ordures", "assainissement", "onas", "dechets menagers", "ecoles publiques",
            "urgences hospitalieres", "cnam", "filiere de soins", "rentree scolaire",
            "public hospital", "public hospitals", "healthcare system", "medicine shortage", "public transit",
            "hospital shortage", "hospital shortages", "anesthetics shortage", "healthcare stockouts",
            "medical stockouts", "drug shortages", "shortage of medicines", "regional clinics",
            "مستشفى عمومي", "المستشفى العمومي", "مستشفيات عمومية", "صحة عمومية", "الصحة العمومية",
            "أدوية", "الأدوية", "ادوية", "الادوية", "نقل عمومي", "النقل العمومي", "تطهير", "التطهير",
            "صرف صحي", "الصرف الصحي", "مدارس عمومية", "المدارس العمومية", "خدمات عمومية",
            "الخدمات العمومية", "نظافة", "الديوان الوطني للتطهير", "صندوق التامين على المرض",
            "صندوق التأمين على المرض", "عودة مدرسية", "العودة المدرسية"
        ],
        "context": ["sante", "health", "hospital", "hopital", "transport", "medicament", "صحة", "مستشفى", "نقل"]
    },
    "rights": {
        "strong": [
            "decret 54", "decree 54", "merkoum 54", "liberte de la presse", "liberte d'expression",
            "snjt", "tribunal", "juge d'instruction", "magistrat", "arrestation", "mandat de depot",
            "prison", "detenu", "detenus", "detenue", "torture", "proces", "droits de l'homme",
            "syndicat des journalistes", "detention arbitraire", "negligences medicales dans les prisons",
            "prisonniers d'opinion", "freedom of expression", "press freedom", "human rights",
            "donnees personnelles", "protection des donnees personnelles", "atteinte aux donnees personnelles",
            "violation des donnees personnelles", "mort en detention", "morts dans les prisons",
            "deces en prison", "conditions carcerales", "torture en detention", "proces politique",
            "proces d'opinion", "prisonniers politiques", "liberation des detenus", "incarceration",
            "مرسوم 54", "المرسوم 54", "حرية الصحافة", "حرية التعبير", "نقابة الصحفيين", "النقابة الوطنية للصحفيين",
            "محكمة", "المحكمة", "قضاء", "القضاء", "قضاة", "القضاة", "سجن", "السجن", "سجون", "السجون",
            "إيقاف", "الإيقاف", "ايقاف", "بطاقة إيداع", "بطاقة ايداع", "سجناء", "السجناء", "معتقل",
            "معتقلين", "المعتقلين", "حقوق الإنسان", "حقوق الانسان", "محاكمة", "المحاكمة",
            "حكمت بسجنه", "حكم بالسجن", "إيداع بالسجن", "ايداع بالسجن", "تتبع قضائي", "ملاحقات قضائية", "استنطاق",
            "المنظمة التونسية لمناهضة التعذيب", "مناهضة التعذيب", "تعذيب",
            "خلف القضبان", "الموت خلف القضبان", "موت خلف القضبان", "الوفيات في السجون", "وفيات السجون",
            "احتجاز", "تحتجز الدولة", "التعذيب في السجون", "سوء المعاملة في السجون", "المعاملة اللاإنسانية",
            "الاحتجاز التعسفي", "مراكز الاحتجاز", "أوضاع السجون", "ظروف السجون", "الانتهاكات داخل السجون",
            "المعطيات الشخصية", "انتهاك المعطيات الشخصية", "حماية المعطيات الشخصية", "بيانات شخصية",
            "الهيئة الوطنية لحماية المعطيات الشخصية", "محاكمات الرأي", "محاكمات الراي", "سجناء الرأي",
            "سجناء الراي", "سجين رأي", "التنكيل بالمعارضين", "التنكيل بالتونسيين",
            "حراك نفس", "وقفة احتجاجية", "اطلاق سراح المعتقلين", "إطلاق سراح المعتقلين", "معتقلي الرأي",
            "معتقلو الرأي", "التضييق على الحريات", "استهداف المعارضين", "قمع الحريات", "محاكمات سياسية",
            "سجين سياسي", "المعتقلين السياسيين", "المعتقلون السياسيون"
        ],
        "context": ["avocat", "lawyer", "liberte", "freedom", "droit", "محامين", "حرية"]
    },
    "gabes": {
        "strong": [
            "chatt essalam", "gulf of gabes", "golfe de gabes", "pollution a gabes",
            "dechets chimiques a gabes", "phosphogypse a gabes", "rejets de phosphogypse",
            "toxic gas", "gaz toxiques", "emissions toxiques",
            "شط السلام", "خليج قابس", "تلوث في قابس", "المجمع الكيميائي بقابس", "فسفوجيبس بقابس", "غازات سامة"
        ],
        "context": ["gabes", "gabès", "قابس"]
    },
    "pollution": {
        "strong": [
            "phosphogypse", "dechets industriels", "dechets toxiques", "rejets chimiques",
            "pollution marine", "catastrophe environnementale", "anpe", "toxic gas",
            "protection du littoral", "littoral", "erosion côtiere", "erosion cotiere",
            "degradation environnementale", "rejets polluants",
            "فسفوجيبس", "نفايات صناعية", "تلوث بحري", "تلوث بيئي", "كارثة بيئية", "الرويسات",
            "حماية السواحل", "السواحل", "حماية الشريط الساحلي", "شريط ساحلي", "تأكل السواحل",
            "الانجراف البحري", "حماية البيئة", "البيئة الساحلية", "انقاذ الشواطئ"
        ],
        "context": ["pollution", "environnement", "environnementale", "environnemental", "environment", "environmental", "dechets", "تلوث", "بيئة", "بيئي", "بيئية", "نفايات", "سواحل"]
    },
    "institutions": {
        "strong": [
            "presidence de la republique", "president de la republique", "remaniement ministeriel",
            "assemblee des representants", "parlement", "arp", "isie", "constitution de 2022",
            "vacance du pouvoir", "cour constitutionnelle", "palais de carthage", "la kasbah",
            "presidential decree", "decret presidentiel",
            "رئاسة الجمهورية", "رئيس الجمهورية", "تحوير وزاري", "مجلس نواب الشعب", "هيئة الانتخابات",
            "دستور 2022", "قصر قرطاج", "القصبة", "شغور منصب الرئيس", "أمر رئاسي"
        ],
        "context": ["cour constitutionnelle", "dissolution", "remaniement", "etat d'urgence", "instabilite politique", "تحوير وزاري", "أمر رئاسي", "حل البرلمان", "حالة الطوارئ"]
    }
}

# Authoritative signals establishing credible Tunisia context (EN, FR, AR)
TUNISIA_SIGNALS = [
    # Explicit Country & Nationality
    "tunisia", "tunisian", "tunisie", "tunisienne", "tunisiens", "tunisiennes",
    "تونس", "تونسي", "تونسية", "التونسي", "التونسية", "تونسيين", "التونسيين", "تونسيات", "التونسيات",
    "بتونس", "لتونس", "بالجمهورية التونسية", "الجمهورية التونسية", "بالبلاد التونسية", "البلاد التونسية",
    # Specific 24 Governorates, Delegations, Cities & Strategic Hubs (FR / EN)
    "tunis", "carthage", "bardo", "la goulette", "la marsa", "sidi bou said",
    "ariana", "ettadhamen", "soukra", "kalaat el andalous", "raoued",
    "ben arous", "hammam lif", "hammam chatt", "mornag", "boumhel", "ezzahra", "rades",
    "manouba", "oued ellil", "douar hicher", "tebourba", "denden",
    "nabeul", "hammamet", "kelibia", "menzel temime", "korba", "grombalia", "soliman", "dar chaabane",
    "zaghouan", "el fahs", "nadhour", "zriba",
    "bizerte", "mateur", "menzel bourguiba", "ras jebel", "ghar el melh", "sejenane", "tinja",
    "beja", "béja", "medjez el bab", "testour", "nefza", "teboursouk", "thibar",
    "jendouba", "tabarka", "ghardimaou", "ain draham", "bou salem",
    "kef", "le kef", "dahmani", "tajerouine", "sakiet sidi youssef",
    "siliana", "makthar", "bou arada", "gaafour", "kesra", "el krib",
    "sousse", "msaken", "kalaa kebira", "kalaa sghira", "enfidha", "akouda", "hergla",
    "monastir", "moknine", "ksar hellal", "jemmal", "teboulba", "bekalta", "ouardanine", "sahline",
    "mahdia", "ksour essef", "chebba", "el djem", "mellouleche", "ouled chamekh", "souassi",
    "sfax", "sakiet ezzit", "sakiet eddaier", "el amra", "jbeniana", "kerkennah", "mahares", "skhira", "thyna", "agareb",
    "kairouan", "bouhajla", "sbikha", "oueslatia", "haffouz", "nasrallah", "cherarda",
    "kasserine", "sbeitla", "feriana", "thala", "hidra", "sbiba", "foussana", "majel belabbes",
    "sidi bouzid", "regueb", "jelma", "menzel bouzaiene", "menzel bouzaine", "meknassy", "bir el hafey", "cebbala",
    "gabes", "gabès", "chatt essalam", "gannouch", "mareth", "el hamma", "metouia", "menzel habib",
    "medenine", "médenine", "zarzis", "djerba", "ben guerdane", "ben gardane", "benguerdane", "bengardane", "houmt souk", "midoun", "ajim", "beni khedache",
    "tataouine", "remada", "ghomrassen", "dhehiba", "smâr", "bir lahmar",
    "gafsa", "metlaoui", "redeyef", "moulares", "mdhilla", "el guettar", "sened",
    "tozeur", "nefta", "degache", "tamaghza", "hazoua",
    "kebili", "kébili", "douz", "souk lahad", "el faouar", "rejime maatoug",
    "ras jdir", "bassin minier",
    # Specific 24 Governorates & Delegations (AR)
    "تونس", "قرطاج", "باردو", "حلق الوادي", "المرسى", "سيدي بوسعيد",
    "أريانة", "اريانة", "التضامن", "سكرة", "رواد",
    "بن عروس", "حمام الأنف", "حمام الانف", "حمام الشط", "مرناق", "بومهل", "الزهراء", "رادس",
    "منوبة", "وادي الليل", "دوار هيشر", "طبربة",
    "نابل", "الحمامات", "قليبية", "منزل تميم", "قربة", "قرمبالية", "ڨرمبالية", "ڤرمبالية", "سليمان",
    "زغوان", "الفحص", "الناظور", "الزريبة",
    "بنزرت", "ماطر", "منزل بورقيبة", "رأس الجبل", "راس الجبل", "غار الملح", "سجنان", "تينجة",
    "باجة", "مجاز الباب", "تستور", "نفزة", "تبرسق", "تيبار",
    "جندوبة", "طبرقة", "غار الدماء", "عين دراهم", "بوسالم",
    "الكاف", "الدهماني", "تاجروين", "ساقية سيدي يوسف",
    "سليانة", "مكثر", "بوعرادة", "قعفور", "ڨعفور", "ڤعفور", "كسرى", "الكريب",
    "سوسة", "مساكن", "القلعة الكبرى", "القلعة الصغرى", "النفيضة", "أكودة", "هرقلة",
    "المنستير", "المكنين", "قصر هلال", "ڨصر هلال", "ڤصر هلال", "جمال", "طبلبة", "البقالطة", "الوردانين", "الساحلين",
    "المهدية", "قصور الساف", "ڨصور الساف", "ڤصور الساف", "الشابة", "الجم", "ملولش", "أولاد شامخ", "السواسي",
    "صفاقس", "ساقية الزيت", "ساقية الدائر", "العامرة", "جبنيانة", "قرقنة", "المحرس", "الصخيرة", "طينة", "عقارب",
    "القيروان", "بوحجلة", "السبيخة", "الوسلاتية", "حفوز", "نصرالله", "الشراردة",
    "القصرين", "سبيطلة", "فريانة", "تالة", "حيدرة", "سبيبة", "فوسانة", "ماجل بلعباس",
    "سيدي بوزيد", "الرقاب", "جلمة", "منزل بوزيان", "المكناسي", "بئر الحفي", "السبالة",
    "قابس", "ڨابس", "ڤابس", "شط السلام", "غنوش", "ڨنوش", "ڤنوش", "مارث", "الحامة", "المطوية", "منزل الحبيب",
    "مدنين", "جرجيس", "جربة", "بن قردان", "بنقردان", "بن ڨردان", "بن ڤردان", "بنڨردان", "بنڤردان", "حومة السوق", "ميدون", "أجيم", "بني خداش",
    "تطاوين", "رمادة", "غمراسن", "ذهيبة", "الصمار", "بئر لحمر",
    "قفصة", "ڨفصة", "ڤفصة", "المتلوي", "الرديف", "أم العرائس", "ام العرائس", "المظيلة", "القطار", "السند",
    "توزر", "نفطة", "دقاش", "تمغزة", "حزوة",
    "قبلي", "ڨبلي", "ڤبلي", "دوز", "سوق الأحد", "سوق الاحد", "الفوار", "رجيم معتوق",
    "قمرت", "ڨمرت", "ڤمرت",
    "راس جدير", "رأس جدير", "الحوض المنجمي",
    # Specific National Public Entities & Institutions
    "sonede", "steg", "ins", "onagri", "anpe", "gct", "cpg", "ugtt", "snjt", "ftdes", "ltdh", "onas",
    "transtu", "sncft", "bct", "pct", "pharmacie centrale", "arp", "isie", "carthage", "kasbah", "la kasbah",
    "assemblee des representants", "presidence de la republique", "presidence du gouvernement", "inpdp", "inpt",
    "ministere de l'agriculture", "ministre de l'agriculture", "ministere de l'environnement", "ministre de l'environnement",
    "ministere de la sante", "ministre de la sante", "ministere de l'interieur", "ministre de l'interieur",
    "ministere de la justice", "ministre de la justice", "ministere des affaires sociales", "ministre des affaires sociales",
    "ministere du transport", "ministre du transport", "ministere de l'education", "ministere de l'industrie",
    "وزارة البيئة", "وزير البيئة", "وزارة الفلاحة", "وزارة الصحة", "وزارة الداخلية", "وزارة العدل",
    "وزارة الشؤون الاجتماعية", "وزارة الصناعة", "وزارة النقل", "وزارة التربية", "وزارة التعليم العالي",
    "صوناد", "ستاغ", "المجمع الكيميائي", "الرائد الرسمي", "الديوان الوطني للتطهير", "ديوان التطهير",
    "مجلس نواب الشعب", "هيئة الانتخابات", "رئاسة الجمهورية", "رئاسة الحكومة", "قصر قرطاج", "القصبة", "jort",
    "النقابة الوطنية للصحفيين التونسيين", "نقابة الصحفيين التونسيين",
    "المنتدى التونسي للحقوق الاقتصادية والاجتماعية", "منتدى الحقوق الاقتصادية والاجتماعية",
    "الرابطة التونسية للدفاع عن حقوق الإنسان", "الرابطة التونسية للدفاع عن حقوق الانسان"
]

# =========================================================================
# LAYERED PROVENANCE & TUNISIA CONTEXT ARCHITECTURE
# =========================================================================

# Tier 1: Dedicated National Public Institutions & Official State Agencies
# Mandate is demonstrably 100% domestic Tunisian official data, administration, and public statistics.
# Note: Non-substantive pages (Actualités, tenders) are still filtered out by is_substantive_evidence().
NATIONAL_INSTITUTION_DOMAINS = {
    "ins.tn", "environnement.gov.tn", "pm.gov.tn", "onagri.nat.tn"
}

# Tier 2: Domestic Editorial Media & Civil Society Organizations
# Broad news/editorial coverage that may include foreign wires, but where mention of domestic entities,
# figures, legal instruments, or monitored civic issues establishes authoritative Tunisia nexus.
EDITORIAL_TUNISIA_DOMAINS = {
    "nawaat.org", "inkyfada.com", "snjt.org", "ftdes.net"
}

# Backward compatibility alias
DEDICATED_TUNISIA_DOMAINS = NATIONAL_INSTITUTION_DOMAINS | EDITORIAL_TUNISIA_DOMAINS

# Domestic political figures, journalists, legal instruments, and monitored institutional entities
# that establish Tunisian context when published by Tier 2 domestic editorial/civic sources.
# NOTE: Generic thematic/rights vocabulary (e.g. personal data, prison, torture, trial) MUST NOT
# be included here; it belongs exclusively in Primary Taxonomy / Layer 3.
DOMESTIC_ENTITY_NEXUS = [
    # Identifiable Tunisian Public Figures & Political Actors
    "قيس سعيد", "الرئيس قيس سعيد", "رئيس الجمهورية قيس سعيد", "منظومة قيس سعيد",
    "kais saied", "president kais saied", "president saied",
    "هيثم المكي", "محمد اليوسفي", "زياد الهاني", "مراد الزغيدي", "برهان بسيس", "سنية الدهماني",
    "شذى بلحاج مبارك", "خولة بوكريم", "غسان بن خليفة", "نجيب الشابي", "أحمد نجيب الشابي",
    "جوهر بن مبارك", "عصام الشابي", "غازي الشواشي", "خيام التركي", "رضا بالحاج",
    "عبير موسي", "راشد الغنوشي", "نور الدين البحيري", "عياشي الهمامي", "بشرى بلحاج حميدة",
    "haythem el meki", "mohamed elyesfi", "ziad el heni", "mourad zghidi", "borhen bssais",
    "sonia dahmani", "chedha hadj mbarek", "khawla boukrim", "ghassen ben khelifa",
    "jaouhar ben mbarek", "issam chebbi", "ghazi chaouachi", "khayam turki",
    "ridha belhadj", "abir moussi", "rached ghannouchi", "noureddine bhiri",

    # Specific Tunisian Legal & Constitutional Instruments
    "مرسوم 54", "المرسوم 54", "مرسوم عدد 54", "المرسوم عدد 54",
    "decret 54", "decret-loi 54", "decree 54", "decree-law 54",
    "دستور 2022", "constitution tunisienne", "constitution de 2022",
    "الرائد الرسمي للجمهورية التونسية",

    # Specific Identifiable Tunisian Institutions & Civil Society Bodies
    "النقابة الوطنية للصحفيين التونسيين", "نقابة الصحفيين التونسيين", "snjt",
    "المنتدى التونسي للحقوق الاقتصادية والاجتماعية", "منتدى الحقوق الاقتصادية والاجتماعية", "ftdes",
    "الرابطة التونسية للدفاع عن حقوق الإنسان", "الرابطة التونسية للدفاع عن حقوق الانسان", "ltdh",
    "الهيئة الوطنية لحماية المعطيات الشخصية", "الهيئة الوطنية للوقاية من التعذيب", "inpdp", "inpt",
    "القطب القضائي لمكافحة الإرهاب", "قطب مكافحة الارهاب", "قطب مكافحة الإرهاب", "القطب القضائي المالي",

    # Specific Identifiable Tunisian Detention Facilities
    "سجن المرناقية", "المرناقية", "سجن بوشوشة", "بوشوشة", "سجن برج الرومي",
    "سجن الهوارب", "سجن حربوب", "سجن صواف", "سجن بلاريجيا",
    "mornaguia", "bouchoucha", "borj erroumi"
]

# Controlled surnames that qualify for contextual nexus ONLY when published by Tier 2 domestic editorial
# sources AND combined with strong judicial/custody/prosecution context.
CONTROLLED_EDITORIAL_SURNAMES = [
    "اليوسفي", "الزغيدي", "بسيس", "الدهماني", "المكي", "الهاني", "بن مبارك", "الشواشي",
    "elyesfi", "youssfi", "zghidi", "bssais", "bsayes", "dahmani", "el heni", "heni",
    "el meki", "mekki", "ben mbarek", "chaouachi"
]

CUSTODY_JUDICIAL_SIGNALS = [
    "سجن", "السجن", "سجنه", "سجنها", "حبس", "حبسه", "إيداع", "ايداع", "بطاقة إيداع", "بطاقة ايداع",
    "إيقاف", "ايقاف", "موقوف", "موقوفة", "محاكمة", "محاكمته", "قضاء", "قاضي التحقيق", "ملاحقة قضائية",
    "تتبع قضائي", "حكمت بسجنه", "حكم بالسجن", "استنطاق", "مرسوم 54", "المرسوم 54", "نقابة الصحفيين",
    "prison", "detention", "proces", "juge d'instruction", "mandat de depot", "arrete", "incarceration"
]

def _strip_accents(text: str) -> str:
    """Normalize and strip diacritical marks, and normalize standard Arabic orthographic variants (hamzas, ta marbuta, alif maqsura)."""
    if not text:
        return ""
    decomposed = unicodedata.normalize("NFKD", text)
    cleaned = "".join(c for c in decomposed if not unicodedata.combining(c)).lower()
    # Normalize Arabic alef forms, ta marbuta, and alif maqsura
    cleaned = re.sub(r"[إأآا]", "ا", cleaned)
    cleaned = re.sub(r"ة", "ه", cleaned)
    cleaned = re.sub(r"ى", "ي", cleaned)
    return cleaned

def _is_arabic(text: str) -> bool:
    return any('\u0600' <= c <= '\u06FF' for c in text)

@functools.lru_cache(maxsize=2048)
def _get_compiled_pattern(clean_kw: str) -> re.Pattern:
    if _is_arabic(clean_kw):
        # Single Arabic word >= 3 characters: attach pronoun suffixes
        if len(clean_kw) >= 3 and " " not in clean_kw:
            return re.compile(
                r"(?:^|[^\w\u0600-\u06FF])(?:[وفلبك]|ال|بال|لل|فال|وال)?"
                + re.escape(clean_kw)
                + r"(?:ه|ها|هم|هن|هما|كم|نا|ي)?"
                + r"(?:[^\w\u0600-\u06FF]|$)",
                re.IGNORECASE
            )
        else:
            return re.compile(
                r"(?:^|[^\w\u0600-\u06FF])(?:[وفلبك]|ال|بال|لل|فال|وال)?"
                + re.escape(clean_kw)
                + r"(?:[^\w\u0600-\u06FF]|$)",
                re.IGNORECASE
            )
    else:
        return re.compile(r"(?:\b|^)" + re.escape(clean_kw) + r"(?:\b|$)", re.IGNORECASE)

def _matches_keyword(keyword: str, text: str) -> bool:
    """Checks for whole-word match or exact phrase match with accent normalization and Arabic attached prefix support."""
    if not keyword or not text:
        return False
    clean_kw = _strip_accents(keyword)
    clean_text = _strip_accents(text)
    pattern = _get_compiled_pattern(clean_kw)
    return bool(pattern.search(clean_text))

def has_tunisia_context(text: str, source_domain: str = None, source_id: str = None) -> bool:
    """
    Validates that an article has a verified, credible Tunisia connection.
    Layered 3-tier architecture:
    - Tier 1: Dedicated National Public Institutions & Official State Agencies (INS, ONAGRI, ME, PM).
      Mandate is 100% domestic Tunisian official data; provenance establishes national geographic scope.
      Note: Non-substantive pages (Actualités, tenders) are still filtered out by is_substantive_evidence().
    - Tier 3: Explicit Textual Signals (TUNISIA_SIGNALS) across all sources.
    - Tier 2: Domestic Editorial / Civil Society Outlets (Nawaat, Inkyfada, SNJT, FTDES).
      Returns True if domestic entity/figure/decree/civic nexus is present in text, or if a controlled
      editorial surname is used in combination with strong judicial/custody context.
    Foreign-only articles without domestic nexus (e.g. Marseille minors, Nepal power grid) return False.
    """
    clean_text = text or ""
    domain = (source_domain or "").lower().strip()

    # Tier 1: National Public Entities & Official State Agencies
    if domain in NATIONAL_INSTITUTION_DOMAINS:
        return True

    # Tier 3 (Fast Check): Explicit Textual Signals in text across all sources
    if any(_matches_keyword(sig, clean_text) for sig in TUNISIA_SIGNALS):
        return True

    # Tier 2: Editorial & Civil Society Outlets with Domestic Entity Nexus or Contextual Aliases
    if domain in EDITORIAL_TUNISIA_DOMAINS:
        if any(_matches_keyword(entity, clean_text) for entity in DOMESTIC_ENTITY_NEXUS):
            return True
        
        # Contextual Surnames combined with strong custody/judicial context
        if any(_matches_keyword(s, clean_text) for s in CONTROLLED_EDITORIAL_SURNAMES):
            if any(_matches_keyword(c, clean_text) for c in CUSTODY_JUDICIAL_SIGNALS):
                return True

    return False

def is_substantive_evidence(headline: str, summary: str = "", body: str = "", source_domain: str = None) -> Tuple[bool, str]:
    """
    Evaluates whether an article contains substantive evidence, documented events,
    metrics, claims, or institutional actions.
    Filters out generic landing pages, training announcements, sports news, and routine administration.
    """
    raw_h = (headline or "").strip()
    clean_h = _strip_accents(raw_h)
    combined = _strip_accents(f"{headline} {summary} {body}")
    raw_combined = f"{headline} {summary} {body}"

    # 1. Reject Generic Landing / Navigation Pages (checked first)
    for pat in GENERIC_PAGE_PATTERNS:
        clean_pat = _strip_accents(pat)
        if re.search(clean_pat, clean_h, flags=re.IGNORECASE) or re.search(pat, raw_h, flags=re.IGNORECASE):
            return False, "generic_navigation_page"

    # 2. Reject Internal Training & Routine Workshops
    for pat in TRAINING_WORKSHOP_PATTERNS:
        clean_pat = _strip_accents(pat)
        if re.search(clean_pat, combined, flags=re.IGNORECASE) or re.search(pat, raw_combined, flags=re.IGNORECASE):
            return False, "training_workshop_announcement"

    # 3. Reject Sports & Recreational Articles
    for pat in SPORTS_PATTERNS:
        clean_pat = _strip_accents(pat)
        if re.search(clean_pat, clean_h, flags=re.IGNORECASE) or re.search(pat, raw_h, flags=re.IGNORECASE):
            return False, "sports_recreational_event"

    # 4. Reject Routine Administrative / App Promotions / Contest Notices
    for pat in ROUTINE_ADMIN_PATTERNS:
        clean_pat = _strip_accents(pat)
        if re.search(clean_pat, clean_h, flags=re.IGNORECASE) or re.search(pat, raw_h, flags=re.IGNORECASE):
            return False, "routine_admin_notice"

    # 5. Generalized Academic / Laboratory Study Scope Filter (PubMed & Scientific Repositories)
    # Academic laboratory/in-vitro assays without a verified monitored public-system/environmental impact nexus are out-of-scope.
    is_academic_lab = any(re.search(p, combined, flags=re.IGNORECASE) for p in ACADEMIC_LAB_INDICATORS)
    if is_academic_lab:
        has_monitored_impact = any(re.search(p, combined, flags=re.IGNORECASE) for p in MONITORED_SYSTEM_IMPACT_SIGNALS)
        if not has_monitored_impact:
            return False, "routine_admin_notice"

    # 6. Length / Substantive Content Check (checked after patterns)
    if len(raw_h) < 10 and not summary and not body:
        return False, "empty_or_too_short"

    return True, "substantive"

class ClassificationResult:
    def __init__(
        self,
        primary_issue: Optional[str] = None,
        secondary_topics: Optional[List[str]] = None,
        confidence: float = 0.0,
        reason: str = "",
        scores: Optional[Dict[str, int]] = None
    ):
        self.primary_issue = primary_issue
        self.secondary_topics = secondary_topics or []
        self.confidence = round(confidence, 2)
        self.reason = reason
        self.scores = scores or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "primary_issue": self.primary_issue,
            "secondary_topics": self.secondary_topics,
            "confidence": self.confidence,
            "reason": self.reason,
            "scores": self.scores
        }

def classify_issue_advanced(text: str, headline: str = None, body: str = None) -> ClassificationResult:
    """
    Performs deep primary-subject classification returning structured telemetry:
    - primary_issue
    - secondary_topics
    - confidence (0.0 to 1.0)
    - deterministic explanation reason
    """
    if not text:
        return ClassificationResult(reason="Empty input text")

    # If headline is not explicitly provided, attempt to separate first line or portion
    if headline is None:
        lines = text.split("\n", 1)
        headline = lines[0] if len(lines) > 0 else text[:100]
        summary = lines[1] if len(lines) > 1 else text
    else:
        summary = text

    clean_h = _strip_accents(headline or "")
    clean_s = _strip_accents(summary or "")
    clean_b = _strip_accents(body or "")
    full_text = _strip_accents(f"{clean_h} {clean_s} {clean_b}")

    # =========================================================================
    # 1. EXPLICIT DISAMBIGUATION & ANTI-TRIGGER RULES
    # =========================================================================
    has_gabes_geo = any(_matches_keyword(w, full_text) for w in ["gabes", "gabès", "قابس", "chatt essalam", "شط السلام", "خليج قابس", "gulf of gabes"])

    # Disambiguation A: Gafsa phosphate water depletion -> 'water' (never Gabès)
    is_gafsa = ("gafsa" in full_text or "قفصة" in full_text)
    is_phosphate = ("phosphate" in full_text or "فسفاط" in full_text or "cpg" in full_text)
    is_water_strain = ("nappe" in full_text or "eau" in full_text or "مياه" in full_text or "phreatique" in full_text or "puits" in full_text or "ابار" in full_text)
    if is_gafsa and is_phosphate and is_water_strain and not has_gabes_geo:
        return ClassificationResult(
            primary_issue="water",
            secondary_topics=["work", "pollution"] if ("pollution" in full_text or "greve" in full_text) else [],
            confidence=0.95,
            reason="Disambiguation rule: Gafsa phosphate mining hydraulic strain prioritized over pollution/gabes"
        )

    # Disambiguation B: Prison conditions / detention deaths / legal custody -> 'rights'
    is_prison = any(_matches_keyword(w, clean_h) or _matches_keyword(w, clean_s) for w in [
        "prison", "prisons", "detenu", "detenus", "detenue", "detention", "conditions carcerales",
        "mort en detention", "deces en prison", "incarceration", "emprisonnement",
        "سجن", "سجناء", "معتقل", "معتقلين", "ايقاف", "إيقاف", "خلف القضبان", "الموت خلف القضبان",
        "وفيات السجون", "الوفيات في السجون", "احتجاز", "تحتجز الدولة", "حكمت بسجنه", "حكم بالسجن", "ملاحقة قضائية"
    ])
    if is_prison:
        return ClassificationResult(
            primary_issue="rights",
            secondary_topics=["public_services"] if any(_matches_keyword(w, full_text) for w in ["hopital", "sante", "صحة"]) else [],
            confidence=0.95,
            reason="Disambiguation rule: Prison detention, custody deaths, and legal proceedings classified under rights"
        )

    # Disambiguation C: SNJT / Press Freedom / Decree 54 / Opinion trials / Data Privacy / Civil Liberties -> 'rights'
    is_rights_core = any(_matches_keyword(w, clean_h) for w in [
        "decret 54", "decree 54", "merkoum 54", "مرسوم 54", "المرسوم 54",
        "liberte de la presse", "liberte d'expression", "حرية الصحافة", "حرية التعبير",
        "donnees personnelles", "المعطيات الشخصية", "انتهاك المعطيات الشخصية",
        "محاكمات الرأي", "محاكمات الراي", "سجناء الرأي", "سجناء الراي", "حراك نفس",
        "التنكيل بالتونسيين", "معتقلي الرأي"
    ])
    is_snjt = any(_matches_keyword(w, clean_h) for w in ["snjt", "نقابة الصحفيين", "النقابة الوطنية للصحفيين", "journaliste", "journalistes", "صحفي", "صحفيين", "صحفيي"])
    if is_rights_core or (is_snjt and any(_matches_keyword(w, full_text) for w in ["decret 54", "liberte", "حرية", "بيان", "تساند", "محاكمة", "قضاء", "مرسوم 54", "معتقلين", "ايقاف"])):
        return ClassificationResult(
            primary_issue="rights",
            secondary_topics=["institutions"],
            confidence=0.95,
            reason="Disambiguation rule: Core civil liberties / SNJT defense / opinion trials / data privacy classified under rights"
        )

    # Disambiguation D: Gabès industrial / coastal pollution -> 'gabes'
    if has_gabes_geo and any(_matches_keyword(w, full_text) for w in ["pollution", "chimique", "phosphogypse", "environnement", "dechets", "rejets", "toxic", "toxique", "gaz", "gas", "تلوث", "بيئة", "فسفوجيبس", "المجمع الكيميائي"]):
        return ClassificationResult(
            primary_issue="gabes",
            secondary_topics=["pollution", "public_services"],
            confidence=0.95,
            reason="Disambiguation rule: Verified Gabès geographic anchor with chemical/environmental pollution"
        )

    # =========================================================================
    # 2. WEIGHTED MULTI-TIER SCORING
    # =========================================================================
    scores: Dict[str, int] = {}
    matched_phrases: Dict[str, List[str]] = {}

    for issue, kw_groups in PRIMARY_TAXONOMY.items():
        if issue == "gabes" and not has_gabes_geo:
            continue
        
        score = 0
        matched = []
        # Strong phrases (high semantic value)
        for phrase in kw_groups.get("strong", []):
            if _matches_keyword(phrase, clean_h):
                score += 15  # Triple weight in headline
                matched.append(f"headline:{phrase}")
            elif _matches_keyword(phrase, clean_s):
                score += 6
                matched.append(f"summary:{phrase}")
            elif _matches_keyword(phrase, clean_b):
                score += 4
                matched.append(f"body:{phrase}")

        # Contextual single words (lower weight)
        for kw in kw_groups.get("context", []):
            if _matches_keyword(kw, clean_h):
                score += 5
                matched.append(f"ctx_head:{kw}")
            elif _matches_keyword(kw, clean_s):
                score += 2
                matched.append(f"ctx_sum:{kw}")

        if score > 0:
            scores[issue] = score
            matched_phrases[issue] = matched

    if not scores:
        return ClassificationResult(confidence=0.0, reason="No keywords matched 404TN taxonomy")

    sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_issue, top_score = sorted_scores[0]

    if top_score < 2:
        return ClassificationResult(confidence=0.1, reason="Score below minimum significance threshold", scores=scores)

    # Secondary topics (other topics with score >= 5)
    secondary_topics = [iss for iss, sc in sorted_scores[1:] if sc >= 5]

    # Calculate Confidence Score (0.0 - 1.0)
    base_confidence = 0.50
    if top_score >= 15:
        # Strong match in headline
        base_confidence = min(0.95, 0.80 + (top_score - 15) * 0.01)
    elif top_score >= 6:
        base_confidence = 0.70 + (top_score - 6) * 0.015
    else:
        base_confidence = 0.45 + (top_score / 20.0)

    # Check for ambiguity with second candidate
    if len(sorted_scores) > 1:
        second_issue, second_score = sorted_scores[1]
        score_gap = top_score - second_score
        if score_gap < 3 and second_score >= 5:
            base_confidence = max(0.45, base_confidence - 0.25)
            reason = f"Primary '{top_issue}' (score: {top_score}) closely contested by '{second_issue}' (score: {second_score})"
        else:
            reason = f"Primary '{top_issue}' (score: {top_score}, terms: {','.join(matched_phrases.get(top_issue, [])[:3])})"
    else:
        reason = f"Primary '{top_issue}' (score: {top_score}, terms: {','.join(matched_phrases.get(top_issue, [])[:3])})"

    return ClassificationResult(
        primary_issue=top_issue,
        secondary_topics=secondary_topics,
        confidence=base_confidence,
        reason=reason,
        scores=scores
    )

def classify_issue(text: str, headline: str = None, body: str = None) -> Optional[str]:
    """
    Identifies the PRIMARY SUBJECT category using weighted multi-tier analysis.
    Maintains backward compatibility with callers expecting an issue string.
    """
    res = classify_issue_advanced(text, headline, body)
    return res.primary_issue

def determine_ingestion_status(
    is_substantive: bool,
    is_taxonomy_match: bool,
    is_tunisia: bool,
    confidence: float,
    substantive_reason: str = ""
) -> Tuple[str, str]:
    """
    Determines ingestion workflow state:
    - AUTO_ACCEPTED: Clean, high confidence verified record
    - REVIEW_REQUIRED: Substantive and relevant, but lower confidence or multi-topic ambiguity
    - REJECTED: Failed relevance, foreign wire, sports, or non-substantive page
    """
    if not is_substantive:
        return "REJECTED", f"Non-substantive: {substantive_reason}"
    if not is_tunisia:
        return "REJECTED", "Failed Tunisia-context relevance gate"
    if not is_taxonomy_match:
        return "REJECTED", "No match with 404TN monitored issue taxonomy"

    if confidence >= 0.70:
        return "AUTO_ACCEPTED", "Passed all gates with high classification confidence"
    elif confidence >= 0.40:
        return "REVIEW_REQUIRED", f"Borderline classification confidence ({confidence:.2f}); flagged for review"
    else:
        return "REJECTED", f"Insufficient classification confidence ({confidence:.2f})"

def classify_epistemic(headline: str, body: str, source_type: str = "news_agency") -> Tuple[str, str]:
    """
    Epistemic categorization according to 404TN Methodology:
    - FACT: Official decree, statistical report, peer-reviewed data, verifiable measurement
    - CLAIM: Verbal promise, political speech, unverified assertion
    - ANALYSIS: Field assessment, NGO situation report, editorial synthesis
    """
    combined_raw = f"{headline} {body}"
    combined = _strip_accents(combined_raw)

    claim_indicators = [
        "promet", "declare", "affirme", "accuse", "selon", "promesse", "engagement",
        "discours", "soutient", "stated", "claims", "promised", "alleged", "asserted",
        "يدعي", "يصرح", "يعد", "خطاب", "يتهم", "بحسب", "صرح", "اكد"
    ]

    fact_indicators = [
        "decret", "jort", "statistique", "ins", "onagri", "loi", "circulaire",
        "rapport officiel", "mesure", "taux", "chiffres", "arrete", "bulletin",
        "مرسوم", "قانون", "رائد رسمي", "بيانات", "إحصائيات", "تقرير رسمي", "قرار"
    ]

    if any(_matches_keyword(w, combined) for w in claim_indicators):
        return "CLAIM", "OFFICIAL STATEMENT"
    elif source_type in ("official", "state_agency") or any(_matches_keyword(w, combined) for w in fact_indicators):
        return "FACT", "VERIFIED"
    else:
        return "ANALYSIS", "UNDER REVIEW"

def format_provenance(evidence_record: dict) -> dict:
    """Standardizes provenance metadata for API and frontend presentation."""
    return {
        "id": evidence_record.get("id"),
        "source_name": evidence_record.get("source_name"),
        "source_domain": evidence_record.get("source_domain"),
        "source_type": evidence_record.get("source_type"),
        "source_url": evidence_record.get("source_url"),
        "source_language": evidence_record.get("source_language", "fr"),
        "trust_weight": evidence_record.get("source_confidence", 0.9),
        "evidence_confidence": evidence_record.get("evidence_confidence", 0.9),
        "published_at": evidence_record.get("published_at"),
        "event_date": evidence_record.get("event_date"),
        "collected_at": evidence_record.get("collected_at"),
        "last_checked": evidence_record.get("last_checked"),
        "classification": evidence_record.get("classification"),
        "status": evidence_record.get("status"),
        "content_hash": evidence_record.get("content_hash")
    }

