# monitor/app/services/dedupe.py
import hashlib
import re
import sqlite3
from typing import Optional, Tuple

def compute_content_hash(text: str) -> str:
    """Generates a SHA-256 hash of normalized clean text."""
    if not text:
        return ""
    normalized = re.sub(r"\s+", " ", text.strip().lower())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

def compute_headline_fingerprint(headline: str) -> str:
    """Creates a normalized sorted token fingerprint for fuzzy headline matching."""
    if not headline:
        return ""
    cleaned = re.sub(r"[^a-zA-Z0-9\u0600-\u06FF]+", " ", headline.lower()).strip()
    words = cleaned.split()
    return " ".join(sorted(set(words)))

def is_duplicate_detailed(
    canonical_url: str,
    content_hash: str,
    headline: str,
    source_domain: Optional[str] = None,
    source_native_id: Optional[str] = None,
    conn: Optional[sqlite3.Connection] = None
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Executes the 5-layer deduplication hierarchy in strict precedence order:
    1. Layer 1: Canonical URL exact match
    2. Layer 2: Source-native ID match (when available in metadata)
    3. Layer 3: Normalized URL match (scheme/tracking-param stripped)
    4. Layer 4: Headline match / fingerprint match within same publisher domain
    5. Layer 5: Clean content hash match (scoped to prevent collapsing distinct syndicate publishers)

    Returns (is_duplicate: bool, duplicate_layer: Optional[str], duplicate_of: Optional[str]).
    """
    if not conn:
        return False, None, None

    cursor = conn.cursor()

    # Layer 1: Exact Canonical URL Match
    if canonical_url:
        cursor.execute("SELECT id FROM evidence WHERE source_url = ?", (canonical_url,))
        row = cursor.fetchone()
        if row:
            return True, "LAYER_1_CANONICAL_URL_MATCH", row[0]

    # Layer 2: Source-Native ID Match (if stored in metadata / source_url pattern)
    if source_native_id and source_domain:
        cursor.execute("""
            SELECT id FROM evidence
            WHERE source_domain = ? AND (source_url LIKE ? OR headline LIKE ?)
        """, (source_domain, f"%{source_native_id}%", f"%{source_native_id}%"))
        row = cursor.fetchone()
        if row:
            return True, "LAYER_2_SOURCE_NATIVE_ID_MATCH", row[0]

    # Layer 3: Normalized URL Match (scheme / tracking-params stripped)
    if canonical_url:
        from monitor.app.services.normalizer import canonicalize_url
        norm_url = canonicalize_url(canonical_url)
        cursor.execute("SELECT id FROM evidence WHERE source_url = ?", (norm_url,))
        row = cursor.fetchone()
        if row:
            return True, "LAYER_3_NORMALIZED_URL_MATCH", row[0]
        raw_no_scheme = re.sub(r"^https?://(?:www\.)?", "", norm_url).rstrip("/")
        if len(raw_no_scheme) > 10:
            cursor.execute("SELECT id FROM evidence WHERE source_url LIKE ?", (f"%{raw_no_scheme}%",))
            row = cursor.fetchone()
            if row:
                return True, "LAYER_3_NORMALIZED_URL_MATCH", row[0]

    # Layer 4: Headline Match / Fingerprint Match (Domain scoped for fuzzy, exact cross-domain)
    if headline:
        clean_hl = headline.strip()
        if source_domain:
            cursor.execute("SELECT id FROM evidence WHERE headline = ? AND source_domain = ?", (clean_hl, source_domain))
            row = cursor.fetchone()
            if row:
                return True, "LAYER_4_HEADLINE_MATCH_SAME_DOMAIN", row[0]
        else:
            cursor.execute("SELECT id FROM evidence WHERE headline = ?", (clean_hl,))
            row = cursor.fetchone()
            if row:
                return True, "LAYER_4_HEADLINE_EXACT_MATCH", row[0]

    # Layer 5: Clean Content Hash Match (Scoped to same domain or exact hash match)
    if content_hash:
        if source_domain:
            cursor.execute("SELECT id FROM evidence WHERE content_hash = ? AND source_domain = ?", (content_hash, source_domain))
            row = cursor.fetchone()
            if row:
                return True, "LAYER_5_CONTENT_HASH_SAME_DOMAIN", row[0]
        else:
            cursor.execute("SELECT id FROM evidence WHERE content_hash = ?", (content_hash,))
            row = cursor.fetchone()
            if row:
                return True, "LAYER_5_CONTENT_HASH_MATCH", row[0]

    return False, None, None

def is_duplicate_layered(
    canonical_url: str,
    content_hash: str,
    headline: str,
    source_domain: Optional[str] = None,
    source_native_id: Optional[str] = None,
    conn: Optional[sqlite3.Connection] = None
) -> Tuple[bool, Optional[str]]:
    """Convenience 2-tuple wrapper around the 5-layer deduplication engine for backward compatibility."""
    dup, layer, _ = is_duplicate_detailed(
        canonical_url=canonical_url,
        content_hash=content_hash,
        headline=headline,
        source_domain=source_domain,
        source_native_id=source_native_id,
        conn=conn
    )
    return dup, layer

def is_duplicate(
    canonical_url: str,
    content_hash: str,
    headline: str,
    source_domain: Optional[str] = None,
    source_native_id: Optional[str] = None,
    conn: Optional[sqlite3.Connection] = None
) -> bool:
    """Convenience boolean wrapper around the 5-layer deduplication engine."""
    dup, _, _ = is_duplicate_detailed(
        canonical_url=canonical_url,
        content_hash=content_hash,
        headline=headline,
        source_domain=source_domain,
        source_native_id=source_native_id,
        conn=conn
    )
    return dup
