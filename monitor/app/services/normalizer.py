# monitor/app/services/normalizer.py
import re
import html
import unicodedata
from dataclasses import dataclass
from typing import Dict, Optional, Tuple, Any
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "gclsrc", "dclid", "zanpid", "msclkid",
    "mc_cid", "mc_eid", "_hsenc", "_hsmi", "ref", "source", "feature",
    "rss", "feed"
}

# Wrapper & Boilerplate Patterns
FTDES_WRAPPER_PATTERNS = [
    r"sorry,\s*this\s*(?:entry|article|post)\s*is\s*only\s*available\s*in\s*.*?\.",
    r"désolé,\s*cet?\s*(?:article|entrée|publication)\s*est\s*(?:seulement|uniquement|également)\s*disponible\s*en\s*.*?\.",
    r"this\s*(?:entry|article|post)\s*is\s*only\s*available\s*in\s*.*?\.",
    r"cette\s*publication\s*est\s*(?:seulement|uniquement|également)\s*disponible\s*en\s*.*?\.",
    r"عذرا،\s*هذا\s*(?:المقال|المنشور)\s*متوفر\s*فقط\s*ب.*?\."
]

GOV_CONTACT_PATTERNS = [
    r"[a-zA-Z0-9_.+-]+@(?:pm\.gov\.tn|gov\.tn|agriculture\.tn|environnement\.gov\.tn|[a-zA-Z0-9-]+\.gov\.tn)",
    r"(?:\+216|00216|\b)(?:71|70|72|73|74|75|76|77|78|79)\s*[\d. -]{6,10}\b",
    r"(?:tél|tel|fax|téléphone|هاتف|فاكس)\s*[:.]?\s*(?:\+216|\d{2,8})[0-9\s.-]*",
    r"(?:العنوان|البريد\s+الإلكتروني|الهاتف|الفاكس|adresse|email|e-mail|téléphone)\s*:[^\n\r.]*",
    r"\b1020\s+تونس\b", r"\b1000\s+تونس\b", r"\b1030\s+تونس\b", r"\b1001\s+tunis\b",
    r"rue\s+de\s+la\s+kasbah|place\s+du\s+gouvernement|قصر\s+الحكومة\s+بالقصبة",
    r"tous\s+droits\s+réservés|copyright\s*©.*|tous\s+droits\s+reserves"
]

SITE_TITLE_SUFFIXES = [
    r"\s*[-–—|/]\s*(?:TAP|Tunis Afrique Presse|Nawaat|Inkyfada|Leaders|Webdo|African Manager|Mosaique FM|Business News|Kapitalis|FTDES|SNJT|GnetNews|La Presse|Tunisie Numérique|Tunisie Numerique|Espace Manager)\s*$",
    r"\s*[-–—|/]\s*وكالة تونس إفريقيا للأنباء\s*$",
    r"\s*[-–—|/]\s*نواة\s*$",
    r"\s*[-–—|/]\s*موقع الصحفيين التونسيين بصفاقس\s*$",
    r"\s*[-–—|/]\s*المنتدى التونسي للحقوق الاقتصادية والاجتماعية\s*$"
]

@dataclass
class ContentQualityReport:
    raw_length: int
    clean_text_length: int
    boilerplate_ratio: float
    content_quality: str  # GOOD | PARTIAL | LOW | EMPTY
    extraction_method: str
    language: str
    has_publish_date: bool
    has_canonical_url: bool

def canonicalize_url(url: str) -> str:
    """
    Normalizes and canonicalizes a URL:
    - Strips URL fragments (#...)
    - Strips marketing/tracking query parameters (utm_*, fbclid, gclid, etc.)
    - Lowercases scheme and netloc (domain)
    - Normalizes duplicate slashes in path
    - Strips trailing slashes from path if path != '/'
    - Sorts remaining query parameters deterministically
    """
    if not url:
        return ""

    url = url.strip()
    try:
        parsed = urlparse(url)
    except Exception:
        return url

    # Lowercase scheme and domain
    scheme = (parsed.scheme or "http").lower()
    netloc = parsed.netloc.lower()

    # Normalize path (remove duplicate slashes, keep single root slash)
    path = re.sub(r"/+", "/", parsed.path)
    if len(path) > 1 and path.endswith("/"):
        path = path.rstrip("/")
    if not path:
        path = "/"

    # Filter query parameters
    query_params = []
    if parsed.query:
        for k, v in parse_qsl(parsed.query, keep_blank_values=True):
            if k.lower() not in TRACKING_PARAMS and not k.lower().startswith("utm_"):
                query_params.append((k, v))

    # Sort query parameters deterministically
    query_params.sort(key=lambda x: x[0])
    query = urlencode(query_params)

    # Reconstruct without fragment
    return urlunparse((scheme, netloc, path, parsed.params, query, ""))

def normalize_encoding_and_entities(text: str) -> str:
    """Decodes HTML entities and normalizes unicode representations."""
    if not text:
        return ""
    # Decode HTML entities repeatedly (handles double-encoded entities like &amp;eacute;)
    decoded = html.unescape(text)
    decoded = html.unescape(decoded)
    # Normalize unicode
    nfc = unicodedata.normalize("NFC", decoded)
    return nfc

def strip_html_and_markup(text: str) -> str:
    """Strips HTML tags, images, WordPress shortcodes, and embedded markup."""
    if not text:
        return ""
    # Strip scripts and styles
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", text, flags=re.IGNORECASE | re.DOTALL)
    # Strip HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Strip WordPress shortcodes & image payloads
    text = re.sub(r"\[/?(?:caption|wp_caption|embed|gallery)[^\]]*\]", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"webfeedsFeaturedVisual", " ", text, flags=re.IGNORECASE)
    return text

def strip_boilerplate_and_wrappers(text: str) -> str:
    """Strips known CMS wrappers, language banners, contact footers, and administrative boilerplate."""
    if not text:
        return ""
    cleaned = text
    # Strip FTDES language wrappers
    for pat in FTDES_WRAPPER_PATTERNS:
        cleaned = re.sub(pat, " ", cleaned, flags=re.IGNORECASE)

    # Strip Government contact blocks / footers
    for pat in GOV_CONTACT_PATTERNS:
        cleaned = re.sub(pat, " ", cleaned, flags=re.IGNORECASE)

    return cleaned

def sanitize_text(text: str) -> str:
    """Full shared normalization pipeline for candidate text fields."""
    if not text:
        return ""
    # 1. Encoding & entities
    step1 = normalize_encoding_and_entities(text)
    # 2. Markup stripping
    step2 = strip_html_and_markup(step1)
    # 3. Boilerplate stripping
    step3 = strip_boilerplate_and_wrappers(step2)
    # 4. Whitespace cleanup
    step4 = re.sub(r"[\r\n\t]+", " ", step3)
    step4 = re.sub(r"\s{2,}", " ", step4)
    return step4.strip()

clean_and_normalize_text = sanitize_text

def normalize_headline(headline: str) -> str:
    """Normalizes headline and strips trailing publisher branding."""
    clean_hl = sanitize_text(headline)
    for pat in SITE_TITLE_SUFFIXES:
        clean_hl = re.sub(pat, "", clean_hl, flags=re.IGNORECASE)
    return clean_hl.strip()

def detect_language(text: str, default: str = "fr") -> str:
    """Identifies primary language (ar, fr, en) based on character script distribution."""
    if not text:
        return default
    arabic_chars = len(re.findall(r"[\u0600-\u06FF]", text))
    total_chars = max(len(re.sub(r"\s+", "", text)), 1)
    if arabic_chars / total_chars > 0.25:
        return "ar"
    if any(w in text.lower() for w in [" le ", " la ", " les ", " du ", " des ", " dans ", " pour ", " avec "]):
        return "fr"
    if any(w in text.lower() for w in [" the ", " in ", " of ", " on ", " with ", " for ", " and "]):
        return "en"
    return default

def evaluate_content_quality(
    clean_headline: str,
    clean_summary: str,
    clean_body: Optional[str] = None,
    raw_text: str = "",
    published_at: Optional[str] = None,
    canonical_url: Optional[str] = None,
    extraction_method: str = "RSS_SUMMARY"
) -> ContentQualityReport:
    """
    Evaluates candidate text quality into GOOD, PARTIAL, LOW, EMPTY.
    Guarantees LOW and EMPTY content never silently pass as high-confidence evidence.
    """
    clean_total = f"{clean_headline} {clean_summary or ''} {clean_body or ''}".strip()
    clean_len = len(clean_total)
    raw_len = max(len(raw_text), clean_len)
    boilerplate_ratio = round(1.0 - (clean_len / raw_len), 3) if raw_len > 0 else 0.0

    has_date = bool(published_at and len(published_at) >= 4)
    has_url = bool(canonical_url and canonical_url.startswith("http"))
    lang = detect_language(clean_total)

    if clean_len < 20:
        quality = "EMPTY"
    elif clean_len < 60 or boilerplate_ratio > 0.65:
        quality = "LOW"
    elif clean_len < 180:
        quality = "PARTIAL"
    else:
        quality = "GOOD"

    return ContentQualityReport(
        raw_length=raw_len,
        clean_text_length=clean_len,
        boilerplate_ratio=boilerplate_ratio,
        content_quality=quality,
        extraction_method=extraction_method,
        language=lang,
        has_publish_date=has_date,
        has_canonical_url=has_url
    )
