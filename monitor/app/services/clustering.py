# monitor/app/services/clustering.py
import re
import hashlib
import unicodedata
from datetime import datetime
from typing import List, Dict, Any, Optional, Set

STOP_WORDS = {
    # French
    "le", "la", "les", "un", "une", "des", "du", "de", "d", "l", "et", "en", "a", "au", "aux",
    "pour", "dans", "sur", "par", "avec", "ce", "cette", "ces", "son", "sa", "ses", "qui", "que",
    "est", "sont", "ete", "a", "ont", "fait", "apres", "selon", "plus", "face", "vers",
    # English
    "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with", "by", "from",
    "is", "are", "was", "were", "been", "has", "have", "had", "after", "over", "into", "about",
    # Arabic
    "في", "من", "إلى", "على", "عن", "مع", "هذا", "هذه", "ذلك", "التي", "الذي", "الذين",
    "أن", "ان", "قد", "تم", "كان", "كانت", "يكون", "تكون", "بعد", "خلال", "بين", "حول"
}

def _tokenize(text: str) -> Set[str]:
    """Tokenize and normalize text into meaningful content words."""
    if not text:
        return set()
    decomposed = unicodedata.normalize("NFKD", text)
    cleaned = "".join(c for c in decomposed if not unicodedata.combining(c)).lower()
    # Normalize Arabic alef forms
    cleaned = re.sub(r"[إأآا]", "ا", cleaned)
    cleaned = re.sub(r"ة", "ه", cleaned)
    # Split on non-alphanumeric
    words = re.findall(r"[\w\u0600-\u06FF]{3,}", cleaned)
    return {w for w in words if w not in STOP_WORDS}

def _calculate_similarity(text_a: str, text_b: str) -> float:
    """Computes Jaccard token overlap between two texts."""
    tokens_a = _tokenize(text_a)
    tokens_b = _tokenize(text_b)
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a.intersection(tokens_b)
    union = tokens_a.union(tokens_b)
    return len(intersection) / len(union) if union else 0.0

def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
    """Extracts date object from ISO or YYYY-MM-DD string."""
    if not date_str:
        return None
    try:
        clean = date_str[:10]
        return datetime.strptime(clean, "%Y-%m-%d")
    except Exception:
        return None

def _are_dates_proximate(d1_str: Optional[str], d2_str: Optional[str], max_days: int = 2) -> bool:
    """Checks if two event dates are within max_days of each other."""
    d1 = _parse_date(d1_str)
    d2 = _parse_date(d2_str)
    if not d1 or not d2:
        return True  # If date is missing on either, rely on location/text similarity
    diff = abs((d1 - d2).days)
    return diff <= max_days

def cluster_evidence_items(evidence_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Groups evidence items into conservative event clusters.
    
    Multiple articles covering the exact same real-world incident (e.g. SONEDE water outage in Sfax on Sept 9)
    are merged into a single documented EVENT cluster with source_count and evidence_count tracking.
    
    Rules:
    - Must match primary issue.
    - Must match governorate (or both be national).
    - Must be date-proximate (within <= 2 days).
    - Must exhibit sufficient headline/summary content similarity (Jaccard >= 0.30) OR shared specific delegation.
    - If uncertain, events are kept separate.
    """
    if not evidence_items:
        return []

    clusters: List[Dict[str, Any]] = []

    for item in evidence_items:
        # Exclude non-localizable / unresolved / national items from regional event clustering
        scope = item.get("location_scope")
        if scope in ("UNRESOLVED", "NATIONAL", "MULTI_GOVERNORATE"):
            continue
        if item.get("latitude") is None and item.get("governorate") is None:
            continue

        item_id = item.get("id", "")
        item_issue = (item.get("issue") or "general").lower()
        if item_issue == "energy":
            item_issue = "electricity"
        item_gov = item.get("governorate") or (item.get("location") if item.get("location") != "Tunisia" else None)
        if not item_gov:
            continue
        item_deleg = item.get("delegation")
        item_date = item.get("event_date") or item.get("published_at") or ""
        item_headline = item.get("headline") or item.get("title") or ""
        item_summary = item.get("summary") or item.get("desc") or ""
        item_source = item.get("source_name") or item.get("source") or "Unknown"
        item_lat = item.get("latitude") or (item.get("lat") if "lat" in item else None)
        item_lon = item.get("longitude") or (item.get("lon") if "lon" in item else None)
        item_status = item.get("status", "REPORTED")
        item_class = item.get("classification", "FACT")

        full_text = f"{item_headline} {item_summary}"

        matched_cluster = None

        for cluster in clusters:
            # Check 1: Issue must match
            if cluster["issue"].lower() != item_issue:
                continue

            # Check 2: Governorate must match
            if (cluster.get("governorate") or "").lower() != (item_gov or "").lower():
                continue

            # Check 3: Date proximity (<= 2 days)
            if not _are_dates_proximate(cluster.get("event_date"), item_date, max_days=2):
                continue

            # Check 4: Specific delegation match OR textual similarity
            deleg_match = bool(item_deleg and cluster.get("delegation") and item_deleg.lower() == cluster.get("delegation").lower())
            
            sim = _calculate_similarity(full_text, f"{cluster['primary_headline']} {cluster.get('summary', '')}")

            # Merge if strong delegation match or substantial text overlap (>= 0.30)
            if deleg_match or sim >= 0.30:
                matched_cluster = cluster
                break

        if matched_cluster:
            # Merge item into existing cluster
            matched_cluster["evidence_count"] += 1
            if item_id and item_id not in matched_cluster["evidence_ids"]:
                matched_cluster["evidence_ids"].append(item_id)
            if item_source and item_source not in matched_cluster["sources"]:
                matched_cluster["sources"].append(item_source)
            matched_cluster["source_count"] = len(matched_cluster["sources"])
            
            # Prefer more authoritative status if verified
            if item_status == "VERIFIED":
                matched_cluster["status"] = "VERIFIED"
            elif item_status == "ACTIVE FILE":
                matched_cluster["status"] = "ACTIVE FILE"

            # Prefer headline from news agency or longer descriptive headline
            if len(item_headline) > len(matched_cluster["primary_headline"]) and item_source in ["TAP", "Reuters", "INS", "ONAGRI"]:
                matched_cluster["primary_headline"] = item_headline

        else:
            # Create a new event cluster
            cluster_slug = re.sub(r"[^\w]+", "-", f"{item_issue}-{item_gov}").strip("-").lower()
            date_prefix = item_date[:10].replace("-", "") if len(item_date) >= 10 else "2026"
            hash_sig = hashlib.sha256(f"{item_headline} {item_gov} {item_date}".encode("utf-8")).hexdigest()[:6]
            cluster_id = f"EVT-{date_prefix}-{cluster_slug}-{hash_sig}"

            new_cluster = {
                "cluster_id": cluster_id,
                "id": cluster_id,
                "issue": item_issue,
                "location": item_gov if item_gov != "Tunisia" else "Tunisia",
                "governorate": item_gov if item_gov != "Tunisia" else None,
                "delegation": item_deleg,
                "latitude": float(item_lat) if item_lat is not None else None,
                "longitude": float(item_lon) if item_lon is not None else None,
                "event_date": item_date[:10] if len(item_date) >= 10 else "2026",
                "primary_headline": item_headline,
                "summary": item_summary,
                "source_count": 1,
                "evidence_count": 1,
                "sources": [item_source] if item_source else [],
                "evidence_ids": [item_id] if item_id else [],
                "status": item_status,
                "classification": item_class,
                "weight": 1.0  # Cluster weight for heatmap (1 unique documented incident)
            }
            clusters.append(new_cluster)

    return clusters
