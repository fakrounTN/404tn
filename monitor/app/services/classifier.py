# monitor/app/services/classifier.py
import re
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

def classify_issue(text: str) -> Optional[str]:
    """Identifies the most prominent issue category from text."""
    if not text:
        return None
    text_lower = text.lower()

    # Prioritize Gabes if specific to Gabes pollution
    if any(k in text_lower for k in ISSUE_KEYWORDS["gabes"]):
        return "gabes"

    scores = {}
    for issue, kw_list in ISSUE_KEYWORDS.items():
        score = 0
        for kw in kw_list:
            if kw in text_lower:
                score += 1
        if score > 0:
            scores[issue] = score

    if not scores:
        return None

    # Return issue with highest keyword count
    return max(scores.items(), key=lambda x: x[1])[0]

def classify_epistemic(
    headline: str,
    body: str,
    source_type: str = "news_agency"
) -> Tuple[str, str]:
    """
    Determines epistemic classification (FACT, CLAIM, ANALYSIS) and status
    (VERIFIED, OFFICIAL STATEMENT, REPORTED, UNDER REVIEW, etc.).
    Preserves strict separation between source authority and claim truth.
    """
    combined = f"{headline} {body}".lower()

    # 1. Check for official decrees / empirical reports -> FACT / VERIFIED
    if any(k in combined for k in ["jort", "décret n°", "circulaire n°", "bulletin officiel", "décision officielle"]):
        return "FACT", "VERIFIED"

    # 2. Check for official / presidential speech/claims -> CLAIM / OFFICIAL STATEMENT
    if any(k in combined for k in ["a affirmé", "a déclaré", "stated", "claimed", "président a souligné", "صرح", "أكد", "شدد على"]):
        if source_type in ["official", "state_agency", "news_agency"]:
            return "CLAIM", "OFFICIAL STATEMENT"
        return "CLAIM", "REPORTED"

    # 3. Check for research / NGO investigation -> FACT or ANALYSIS
    if source_type in ["ngo", "independent_media", "scientific_registry"]:
        if any(k in combined for k in ["rapport", "étude", "enquête", "investigation", "field report", "audit"]):
            return "FACT", "REPORTED"
        return "ANALYSIS", "REPORTED"

    # 4. Standard reporting -> FACT / REPORTED or neutral fallback
    if source_type == "news_agency":
        return "FACT", "REPORTED"

    # Default neutral fallback
    return "ANALYSIS", "UNDER REVIEW"
