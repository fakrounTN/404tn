# monitor/app/services/locations.py
import yaml
import os
import re
import unicodedata
from typing import Tuple, Optional, Dict, Any, List

CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config")

def load_locations() -> Dict[str, Dict[str, Any]]:
    loc_path = os.path.join(CONFIG_DIR, "locations.yaml")
    if os.path.exists(loc_path):
        with open(loc_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return {l["slug"]: l for l in data.get("locations", [])}
    return {}

LOCATIONS_MAP = load_locations()

# Authoritative location dictionary with normalized aliases and regex matchers
LOCATION_RULES = [
    {
        "slug": "gabes",
        "name": "Gabès",
        "patterns": [
            r"\b(gabes|qabis|قابس|chatt\s+essalam|ghannouch|chott\s+essalam)\b"
        ]
    },
    {
        "slug": "sfax",
        "name": "Sfax",
        "patterns": [
            r"\b(sfax|صفاقس|el\s+amra|jbeniana|kerkennah|قرناطة|قرقنة|العامرة|جبنيانة|thyna|طينة)\b"
        ]
    },
    {
        "slug": "gafsa",
        "name": "Gafsa",
        "patterns": [
            r"\b(gafsa|قفصة|metlaoui|mdhilla|redeyef|moulares|المتلوي|المظيلة|الرديف|أم العرائس)\b"
        ]
    },
    {
        "slug": "kasserine",
        "name": "Kasserine",
        "patterns": [
            r"\b(kasserine|القصرين|sbeitla|feriana|thala|سبيطلة|فوسانة|تالة|fernana|فرنانة)\b"
        ]
    },
    {
        "slug": "bizerte",
        "name": "Bizerte",
        "patterns": [
            r"\b(bizerte|بنزرت|menzel\s+bourguiba|ras\s+jebel|منزل\s+بورقيبة|إشكول|ichkeul|joumine)\b"
        ]
    },
    {
        "slug": "zarzis",
        "name": "Zarzis",
        "patterns": [
            r"\b(zarzis|جرجيس|ben\s+guerdane|ben\s+gardane|بن\s+قردان|medenine|مدنين|djerba|جربة)\b"
        ]
    },
    {
        "slug": "tunis",
        "name": "Tunis",
        "patterns": [
            r"\b(carthage|قرطاج|le\s+bardo|باردو|la\s+goulette|حلق\s+الوادي|grand\s+tunis|تونس\s+الكبرى|manouba|ariana|ben\s+arous|منوبة|أريانة|بن\s+عروس)\b",
            r"\b(tunis\s+(city|ville|centre|capital|centre-ville|marine))\b",
            r"\b(ville\s+de\s+tunis|gouvernorat\s+de\s+tunis|municipalite\s+de\s+tunis)\b",
            r"\bتونس\s+(العاصمة|المدينة)\b"
        ]
    }
]

def normalize_text(text: str) -> str:
    """Normalize accents, ligatures, and case for matching."""
    if not text:
        return ""
    # Strip diacritics / combining characters so gabès becomes gabes
    decomposed = unicodedata.normalize("NFKD", text)
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return stripped.lower()

def get_location_coords(location_slug: str) -> Tuple[Optional[float], Optional[float], str]:
    """Return (latitude, longitude, name) for a given location slug."""
    loc = LOCATIONS_MAP.get(location_slug)
    if loc:
        return loc["lat"], loc["lon"], loc["name"]
    return None, None, location_slug

def extract_location(text: str) -> Tuple[str, Optional[float], Optional[float]]:
    """
    Conservatively extract an authoritative location and coordinates from text.
    
    Returns:
        (canonical_name, latitude, longitude) if exactly one unambiguous location matches.
        ("Tunisia", None, None) if unknown, generic national, or ambiguous.
    """
    if not text or not isinstance(text, str):
        return "Tunisia", None, None

    normalized = normalize_text(text)

    # Strip generic TAP / news bureau datelines that merely indicate reporting bureau rather than event location
    cleaned = re.sub(r"^\s*tunis\s*(\([^\)]+\)|,[^—–-]+)?\s*[—–-]\s*", "", normalized, flags=re.IGNORECASE)

    matched_slugs = []

    for rule in LOCATION_RULES:
        slug = rule["slug"]
        for pattern in rule["patterns"]:
            if re.search(pattern, cleaned, flags=re.IGNORECASE):
                if slug not in matched_slugs:
                    matched_slugs.append(slug)
                break

    # If exactly one specific location matched, return its canonical coordinates
    if len(matched_slugs) == 1:
        slug = matched_slugs[0]
        loc_data = LOCATIONS_MAP.get(slug)
        if loc_data:
            return loc_data["name"], loc_data["lat"], loc_data["lon"]
        return slug.capitalize(), None, None

    # If multiple or zero specific locations matched, return generic Tunisia without coordinates
    return "Tunisia", None, None
