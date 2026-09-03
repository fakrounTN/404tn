# monitor/app/services/normalizer.py
import re
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

TRACKING_PARAMS = {
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "gclsrc", "dclid", "zanpid", "msclkid",
    "mc_cid", "mc_eid", "_hsenc", "_hsmi", "ref", "source", "feature"
}

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

def sanitize_text(text: str) -> str:
    """Cleans up whitespace and basic artifacts in extracted text."""
    if not text:
        return ""
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()
