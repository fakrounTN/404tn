# monitor/app/services/provenance.py
import os
import re
import yaml
import base64
import urllib.parse
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Optional, Tuple, Any

CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config")

TIER_1_DOMAINS = {
    "pm.gov.tn", "environnement.gov.tn", "agriculture.tn", "onagri.nat.tn",
    "ins.tn", "bct.gov.tn", "iort.gov.tn", "justice.gov.tn", "santetunisie.rns.tn",
    "interieur.gov.tn", "defense.tn", "finances.gov.tn", "courdescomptes.nat.tn",
    "inpdp.nat.tn", "inpt.tn", "pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov"
}

TIER_2_DOMAINS = {
    "tap.info.tn", "inkyfada.com", "nawaat.org", "leaders.com.tn", "webdo.tn",
    "reuters.com", "afp.com", "apnews.com", "africanmanager.com", "mosaiquefm.net",
    "businessnews.com.tn", "kapitalis.com", "leconomistemaghrebin.com", "alqatiba.com"
}

TIER_3_DOMAINS = {
    "ftdes.net", "snjt.org", "ugtt.org.tn", "ltdh.tn", "iwatch.tn",
    "al-bawsala.com", "onat.nat.tn", "euromedrights.org", "amnesty.org", "hrw.org"
}

@dataclass
class ResolvedProvenance:
    source_name: str
    source_domain: str
    source_type: str
    source_tier: str  # TIER_1 | TIER_2 | TIER_3 | TIER_4
    trust_weight: float
    canonical_url: str
    discovery_provider: Optional[str] = None
    discovery_query: Optional[str] = None
    discovery_url: Optional[str] = None
    discovered_at: Optional[str] = None

def load_source_registry() -> Dict[str, Dict[str, Any]]:
    src_path = os.path.join(CONFIG_DIR, "sources.yaml")
    if os.path.exists(src_path):
        with open(src_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            sources = data.get("sources", [])
            return {s.get("domain", ""): s for s in sources if s.get("domain")}
    return {}

SOURCE_MAP = load_source_registry()

def determine_source_tier(domain: str, source_type: Optional[str] = None) -> str:
    """Determines the authoritative tier (TIER 1 - TIER 4) of a domain."""
    d = domain.lower().replace("www.", "").strip()
    if d in TIER_1_DOMAINS or source_type in ["official", "state_agency", "scientific_registry"]:
        return "TIER_1"
    if d in TIER_2_DOMAINS or source_type in ["news_agency", "independent_media", "international_wire"]:
        return "TIER_2"
    if d in TIER_3_DOMAINS or source_type in ["ngo", "union", "civil_society"]:
        return "TIER_3"
    return "TIER_4"

def unwrap_google_news_url(raw_url: str) -> str:
    """
    Decodes Google News RSS article URLs to reveal the genuine publisher destination.
    Handles standard base64 payloads and direct parameters.
    """
    if not raw_url:
        return ""
    if "news.google.com" not in raw_url:
        return raw_url

    # Check for direct 'url=' query parameter
    parsed = urllib.parse.urlparse(raw_url)
    qs = urllib.parse.parse_qs(parsed.query)
    if "url" in qs and qs["url"]:
        return qs["url"][0]

    # Check for base64 encoded article id in path (e.g. /articles/CBMi...)
    path_parts = parsed.path.split("/")
    for part in path_parts:
        if part.startswith("CBMi") or part.startswith("CAIi"):
            try:
                # Add padding if needed
                padded = part + "=" * ((4 - len(part) % 4) % 4)
                decoded = base64.urlsafe_b64decode(padded)
                # Find embedded http(s) URL inside binary payload
                urls_found = re.findall(rb"https?://[^\x00-\x1f\x7f-\xff\s\"'<>]+", decoded)
                if urls_found:
                    return urls_found[0].decode("utf-8", errors="ignore")
            except Exception:
                pass

    return raw_url

def extract_domain(url: str) -> str:
    """Extracts clean registered hostname from a URL."""
    try:
        parsed = urllib.parse.urlparse(url)
        netloc = parsed.netloc.lower()
        if ":" in netloc:
            netloc = netloc.split(":")[0]
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc
    except Exception:
        return ""

def resolve_evidence_provenance(
    url: str,
    source_name: Optional[str] = None,
    source_domain: Optional[str] = None,
    source_type: Optional[str] = None,
    discovery_provider: Optional[str] = None,
    discovery_query: Optional[str] = None,
    discovery_url: Optional[str] = None,
    discovered_at: Optional[str] = None
) -> ResolvedProvenance:
    """
    Resolves complete provenance separating discovery transport from canonical publisher.
    """
    canonical_url = unwrap_google_news_url(url)
    resolved_domain = extract_domain(canonical_url) or source_domain or ""

    # Check registry match
    src_reg = SOURCE_MAP.get(resolved_domain)
    if src_reg:
        name = src_reg.get("name", resolved_domain.capitalize())
        stype = src_reg.get("source_type", source_type or "independent_media")
        weight = src_reg.get("trust_weight", 0.90)
    else:
        name = source_name or resolved_domain.capitalize() or "Independent Publisher"
        stype = source_type or "independent_media"
        weight = 0.85

    tier = determine_source_tier(resolved_domain, stype)

    return ResolvedProvenance(
        source_name=name,
        source_domain=resolved_domain,
        source_type=stype,
        source_tier=tier,
        trust_weight=weight,
        canonical_url=canonical_url,
        discovery_provider=discovery_provider,
        discovery_query=discovery_query,
        discovery_url=discovery_url or url,
        discovered_at=discovered_at or datetime.now(timezone.utc).isoformat()
    )
