# monitor/app/services/classifier.py
import re
import unicodedata
from typing import Tuple, List, Optional, Dict, Any

# Low-value, generic landing pages, training announcements, sports, and routine administrative patterns
GENERIC_PAGE_PATTERNS = [
    r"^actualites?$", r"^actualite$", r"^rapports?$", r"^rapports? d['’]activites?$",
    r"^publications?$", r"^accueil$", r"^index$", r"^archives?$", r"^recherche$",
    r"^contact$", r"^a propos$", r"^qui sommes[- ]nous\??$",
    r"^الرئيسية$", r"^أخبار$", r"^اخبار$", r"^تقارير$", r"^إصدارات$", r"^اصدارات$", r"^وثائق$", r"^من نحن\??$"
]

TRAINING_WORKSHOP_PATTERNS = [
    r"سلسلة من الدورات التدريبية", r"دورة تدريبية", r"دورتان تدريبيتان", r"دورات تدريبية",
    r"اختتام الدورة التدريبية", r"انطلاق أشغال الدورة التدريبية", r"session de formation",
    r"atelier de formation", r"cycle de formation", r"formation des journalistes"
]

SPORTS_PATTERNS = [
    r"jeux mediterraneens", r"jm tarente", r"tarente", r"aviron", r"halterophilie", r"gymnastique",
    r"medaille d['’]or", r"medaille d['’]argent", r"medaille de bronze", r"medaillee?",
    r"championnat", r"firas katoussi", r"karem ben hnia", r"moetaman billah",
    r"العاب البحر الابيض المتوسط", r"العاب متوسطية", r"الالعاب المتوسطية", r"تارانتو",
    r"ميدالية ذهبية", r"ميدالية فضية", r"ميدالية برونزية", r"ميدالية", r"الميدالية",
    r"الذهبية", r"الفضية", r"البرونزية", r"بطولة العالم", r"كرة القدم", r"رفع الاثقال", r"رفع اثقال", r"رفع الأثقال"
]

ROUTINE_ADMIN_PATTERNS = [
    r"open applications for best reporting", r"application mobile pour acceder aux services",
    r"lancement de la bibliotheque documentaire en ligne", r"concours pour le recrutement",
    r"المسابقة الوطنية لأفضل عمل صحفي", r"تطبيق جوال"
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
            "هجرة غير نظامية", "الهجرة غير النظامية", "حرقّة", "الحرقّة", "حرقة", "الحرقة",
            "حرس بحري", "الحرس البحري", "اجتياز الحدود", "غرق مركب", "غرق قارب",
            "جثث", "الجثث", "انتشال", "مهاجرين غير نظاميين", "المهاجرين غير النظاميين",
            "مهاجرون غير نظاميين", "المهاجرون غير النظاميين", "العامرة", "جبنيانة", "جرجيس",
            "عمليات اجتياز", "انقاذ مهاجرين", "احباط محاولة اجتياز", "مهاجرين", "المهاجرين",
            "ضحايا ومفقودين", "المفقودين في البحر", "مفقودين في البحر", "ضحايا في البحر", "مفقودي البحر", "مفقودين", "المفقودين"
        ],
        "context": ["migration", "migrant", "migrants", "immigration", "passeurs", "هجرة", "الهجرة", "مهاجر", "المهاجر"]
    },
    "work": {
        "strong": [
            "chomage", "taux de chomage", "demandeurs d'emploi", "diplomes chomeurs",
            "recrutement public", "pouvoir d'achat", "inflation", "smig", "greve", "ugtt",
            "salaires", "augmentation salariale", "pente des prix", "indice des prix",
            "unemployment", "unemployment rate", "job market", "wage increase", "purchasing power",
            "food inflation", "labor strike",
            "بطالة", "البطالة", "نسبة البطالة", "تشغيل", "التشغيل", "أجور", "الأجور", "اجور", "الاجور",
            "قدرة شرائية", "القدرة الشرائية", "تضخم", "التضخم", "إضراب", "الإضراب", "اضراب", "الاضراب",
            "انتداب", "الانتداب", "أسعار المواد الأساسية", "اصحاب الشهادات", "أصحاب الشهادات",
            "اصحاب الشهائد", "أصحاب الشهائد", "المعطلين عن العمل", "سوق الشغل",
            "الاتحاد العام التونسي للشغل", "مطالب الشغل", "فرص عمل"
        ],
        "context": ["emploi", "employment", "job", "salary", "salaire", "travailleurs", "ouvriers", "bct", "ins", "fmi", "عمل", "رواتب"]
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
            "مرسوم 54", "المرسوم 54", "حرية الصحافة", "حرية التعبير", "نقابة الصحفيين", "النقابة الوطنية للصحفيين",
            "محكمة", "المحكمة", "قضاء", "القضاء", "قضاة", "القضاة", "سجن", "السجن", "سجون", "السجون",
            "إيقاف", "الإيقاف", "ايقاف", "بطاقة إيداع", "بطاقة ايداع", "سجناء", "السجناء", "معتقل",
            "معتقلين", "المعتقلين", "حقوق الإنسان", "حقوق الانسان", "محاكمة", "المحاكمة",
            "المنظمة التونسية لمناهضة التعذيب", "مناهضة التعذيب", "تعذيب"
        ],
        "context": ["justice", "avocat", "lawyer", "liberte", "freedom", "droit", "عدالة", "محامين", "حقوق", "حرية"]
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
            "فسفوجيبس", "نفايات صناعية", "تلوث بحري", "تلوث بيئي", "كارثة بيئية", "الرويسات"
        ],
        "context": ["pollution", "environnement", "environment", "dechets", "تلوث", "بيئة", "نفايات"]
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
        "context": ["president", "gouvernement", "ministre", "politique", "رئيس", "حكومة", "وزير"]
    }
}

# Authoritative signals establishing credible Tunisia context (EN, FR, AR)
TUNISIA_SIGNALS = [
    # Explicit Country & Nationality
    "tunisia", "tunisian", "tunisie", "tunisienne", "tunisiens", "tunisiennes",
    "تونس", "تونسي", "تونسية", "التونسي", "التونسية", "تونسيين", "التونسيين", "تونسيات", "التونسيات",
    "بتونس", "لتونس", "بالجمهورية التونسية", "الجمهورية التونسية",
    # Specific Governorates, Cities & Strategic Hubs
    "tunis", "carthage", "bardo", "ariana", "ben arous", "manouba",
    "gabes", "gabès", "sfax", "gafsa", "kasserine", "bizerte", "zarzis",
    "sousse", "monastir", "mahdia", "nabeul", "kairouan", "sidi bouzid",
    "beja", "béja", "jendouba", "kef", "siliana", "zaghouan", "medenine",
    "médenine", "tataouine", "tozeur", "kebili", "kébili", "kerkennah", "el amra", "jbeniana",
    "قابس", "صفاقس", "قفصة", "القصرين", "بنزرت", "جرجيس", "سوسة", "المنستير",
    "المهدية", "نابل", "القيروان", "سيدي بوزيد", "باجة", "جندوبة", "الكاف",
    "سليانة", "زغوان", "مدنين", "تطاوين", "توزر", "قبلي", "قرقنة", "قرطاج", "باردو", "العامرة", "جبنيانة",
    # Specific National Public Entities & Institutions
    "sonede", "steg", "ins", "onagri", "anpe", "gct", "cpg", "ugtt", "snjt", "ftdes", "onas",
    "transtu", "sncft", "bct", "pct", "pharmacie centrale", "arp", "isie", "carthage", "kasbah", "la kasbah",
    "assemblee des representants", "presidence de la republique",
    "صوناد", "ستاغ", "المجمع الكيميائي", "الرائد الرسمي", "الديوان الوطني للتطهير", "ديوان التطهير",
    "مجلس نواب الشعب", "هيئة الانتخابات", "رئاسة الجمهورية", "jort"
]

# Dedicated national institutions whose publications are demonstrably restricted to Tunisia-specific content
DEDICATED_TUNISIA_DOMAINS = {
    "ins.tn", "environnement.gov.tn", "pm.gov.tn", "onagri.nat.tn",
    "snjt.org", "ftdes.net", "inkyfada.com", "nawaat.org"
}

def _strip_accents(text: str) -> str:
    """Normalize and strip diacritical marks, and normalize Arabic orthographic variants (hamzas, ta marbuta)."""
    if not text:
        return ""
    decomposed = unicodedata.normalize("NFKD", text)
    cleaned = "".join(c for c in decomposed if not unicodedata.combining(c)).lower()
    # Normalize Arabic alef forms and ta marbuta
    cleaned = re.sub(r"[إأآا]", "ا", cleaned)
    cleaned = re.sub(r"ة", "ه", cleaned)
    cleaned = re.sub(r"ى", "ي", cleaned)
    return cleaned

def _is_arabic(text: str) -> bool:
    return any('\u0600' <= c <= '\u06FF' for c in text)

def _matches_keyword(keyword: str, text: str) -> bool:
    """Checks for whole-word match or exact phrase match with accent normalization and Arabic attached prefix support."""
    if not keyword or not text:
        return False
    clean_kw = _strip_accents(keyword)
    clean_text = _strip_accents(text)
    if _is_arabic(clean_kw):
        pattern = r"(?:^|[^\w\u0600-\u06FF])(?:[وفلبك]|ال|بال|لل|فال|وال)?" + re.escape(clean_kw) + r"(?:[^\w\u0600-\u06FF]|$)"
    else:
        pattern = r"(?:\b|^)" + re.escape(clean_kw) + r"(?:\b|$)"
    return bool(re.search(pattern, clean_text, flags=re.IGNORECASE))

def has_tunisia_context(text: str, source_domain: str = None, source_id: str = None) -> bool:
    """
    Validates that an article has a verified, credible Tunisia connection.
    Rejects unrelated foreign articles (e.g. Nepal power outage, French water quality)
    that may coincidentally match generic issue keywords.
    """
    if source_domain and source_domain.lower() in DEDICATED_TUNISIA_DOMAINS:
        return True

    if not text:
        return False

    return any(_matches_keyword(sig, text) for sig in TUNISIA_SIGNALS)

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

    # 5. Length / Substantive Content Check (checked after patterns)
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

    # Disambiguation B: Prison medical neglect / detention conditions -> 'rights'
    is_prison = any(_matches_keyword(w, clean_h) for w in ["prison", "prisons", "detenu", "detenus", "detenue", "detention", "سجن", "سجناء", "معتقل", "معتقلين", "ايقاف", "إيقاف"])
    if is_prison:
        return ClassificationResult(
            primary_issue="rights",
            secondary_topics=["public_services"] if any(_matches_keyword(w, full_text) for w in ["hopital", "sante", "صحة"]) else [],
            confidence=0.95,
            reason="Disambiguation rule: Prison detention and legal proceedings classified under rights"
        )

    # Disambiguation C: SNJT / Press Freedom / Journalist Defense -> 'rights'
    is_snjt = any(_matches_keyword(w, clean_h) for w in ["snjt", "نقابة الصحفيين", "journaliste", "journalistes", "صحفي", "صحفيين", "صحفيي"])
    if is_snjt and any(_matches_keyword(w, full_text) for w in ["decret 54", "liberte", "حرية", "بيان", "تساند", "محاكمة", "قضاء", "مرسوم 54"]):
        return ClassificationResult(
            primary_issue="rights",
            secondary_topics=["institutions"],
            confidence=0.95,
            reason="Disambiguation rule: SNJT journalist defense / Decree 54 legal action classified under rights"
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
        if score_gap < 3 and second_score >= 6:
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

