# monitor/app/services/classifier.py
import re
import unicodedata
from typing import Tuple, List, Optional

# Keywords dictionary across 11 core issue categories (EN, FR, AR)
ISSUE_KEYWORDS = {
    "water": [
        "water", "eau", "barrage", "sonede", "coupure d'eau", "sécheresse", "drought",
        "onagri", "irrigation", "مياه", "سدود", "قطع الماء", "جفاف", "صوناد"
    ],
    "electricity": [
        "electricity", "power", "steg", "électricité", "panne", "délestage", "blackout",
        "grid", "mégawatts", "mw", "كهرباء", "انقطاع التيار", "ستاغ", "شبكة الكهرباء"
    ],
    "pollution": [
        "pollution", "environment", "gct", "phosphogypsum", "chimique", "environnement",
        "déchets", "rejets", "تلوث", "بيئة", "فسفوجيبس", "المجمع الكيميائي", "نفايات"
    ],
    "gabes": [
        "gabes", "gabès", "chatt essalam", "قابس", "شط السلام", "خليج قابس", "gulf of gabes"
    ],
    "work": [
        "unemployment", "job", "salary", "chômage", "emploi", "salaires", "grève",
        "recrutement", "ins", "بطالة", "تشغيل", "أجور", "إضراب", "انتداب"
    ],
    "migration": [
        "migration", "migrant", "border", "coastguard", "garde nationale", "interception",
        "el amra", "sfax", "jbeniana", "zarzis", "harraga", "هجرة", "حرس بحري", "اجتياز", "صفاقس", "العامرة"
    ],
    "public_services": [
        "hospital", "transport", "school", "santé", "hôpital", "transtu", "sncft",
        "école", "infrastructure", "خدمات عمومية", "صحة", "مستشفى", "نقل", "مدارس"
    ],
    "rights": [
        "decree 54", "décret 54", "freedom", "journalist", "lawyer", "liberté", "snjt",
        "onat", "justice", "مرسوم 54", "حرية التعبير", "صحفيين", "محامين", "قضاء"
    ],
    "institutions": [
        "president", "parliament", "saied", "carthage", "président", "parlement",
        "ministre", "gouvernement", "رئيس الجمهورية", "قرطاج", "برلمان", "حكومة"
    ],
    "economy": [
        "inflation", "bct", "imf", "fmi", "dette", "réserves", "devises", "prix",
        "pénurie", "تضخم", "بنك مركزي", "صندوق النقد", "أسعار", "نقص المواد"
    ],
    "state_response": [
        "response", "announcement", "circular", "communiqué", "mesure", "décision",
        "visite", "استجابة", "إجراءات", "بلاغ", "تعليمات"
    ]
}

# Authoritative signals establishing credible Tunisia context (EN, FR, AR)
TUNISIA_SIGNALS = [
    # Explicit Country & Nationality
    "tunisia", "tunisian", "tunisie", "tunisienne", "tunisiens", "tunisiennes",
    "تونس", "تونسي", "تونسية", "تونسيين", "تونسيات", "الجمهورية التونسية",
    # Specific Governorates, Cities & Strategic Hubs
    "tunis", "carthage", "bardo", "ariana", "ben arous", "manouba",
    "gabes", "gabès", "sfax", "gafsa", "kasserine", "bizerte", "zarzis",
    "sousse", "monastir", "mahdia", "nabeul", "kairouan", "sidi bouzid",
    "beja", "béja", "jendouba", "kef", "siliana", "zaghouan", "medenine",
    "médenine", "tataouine", "tozeur", "kebili", "kébili", "kerkennah", "el amra", "jbeniana",
    "قابس", "صفاقس", "قفصة", "القصرين", "بنزرت", "جرجيس", "سوسة", "المنستير",
    "المهدية", "نابل", "القيروان", "سيدي بوزيد", "باجة", "جندوبة", "الكاف",
    "سليانة", "زغوان", "مدنين", "تطاوين", "توزر", "قبلي", "قرقنة", "قرطاج", "باردو", "العامرة", "جبنيانة",
    # Specific National Public Entities
    "sonede", "steg", "ins", "onagri", "anpe", "gct", "ugtt", "snjt", "ftdes",
    "transtu", "sncft", "bct", "carthage", "kasbah", "la kasbah",
    "صوناد", "ستاغ", "المجمع الكيميائي", "الرائد الرسمي", "jort"
]

# Dedicated national institutions whose publications are demonstrably restricted to Tunisia-specific content
DEDICATED_TUNISIA_DOMAINS = {
    "ins.tn", "environnement.gov.tn", "pm.gov.tn", "onagri.nat.tn",
    "snjt.org", "ftdes.net", "inkyfada.com", "nawaat.org"
}

def _strip_accents(text: str) -> str:
    """Normalize and strip diacritical marks."""
    if not text:
        return ""
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(c for c in decomposed if not unicodedata.combining(c)).lower()

def _matches_keyword(keyword: str, text: str) -> bool:
    """Checks for whole-word match or exact phrase match with accent normalization."""
    clean_kw = _strip_accents(keyword)
    clean_text = _strip_accents(text)
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

def classify_issue(text: str) -> Optional[str]:
    """Identifies the most prominent issue category from text using whole-word matching."""
    if not text:
        return None

    # Prioritize Gabes if specific to Gabes pollution
    if any(_matches_keyword(k, text) for k in ISSUE_KEYWORDS["gabes"]):
        return "gabes"

    for issue, keywords in ISSUE_KEYWORDS.items():
        if any(_matches_keyword(k, text) for k in keywords):
            return issue

    return None

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
