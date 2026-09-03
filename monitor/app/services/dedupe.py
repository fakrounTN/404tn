# monitor/app/services/dedupe.py
import hashlib
import re
import sqlite3
from typing import Optional

def compute_content_hash(text: str) -> str:
    """Generates a SHA-256 hash of normalized text."""
    if not text:
        return ""
    normalized = re.sub(r"\s+", " ", text.strip().lower())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

def compute_headline_fingerprint(headline: str) -> str:
    """Creates an alphanumeric lowercase fingerprint for fuzzy matching."""
    if not headline:
        return ""
    cleaned = re.sub(r"[^a-zA-Z0-9\u0600-\u06FF]+", " ", headline.lower()).strip()
    words = cleaned.split()
    return " ".join(sorted(set(words)))

def is_duplicate(
    canonical_url: str,
    content_hash: str,
    headline: str,
    conn: Optional[sqlite3.Connection] = None
) -> bool:
    """
    Checks if a record is already stored in the database based on multiple signals:
    1. Exact canonical URL match in evidence table
    2. SHA-256 content hash match
    3. Exact headline match
    """
    if not conn:
        return False

    cursor = conn.cursor()

    # 1. Check Canonical URL in source_url
    if canonical_url:
        cursor.execute("SELECT id FROM evidence WHERE source_url = ?", (canonical_url,))
        if cursor.fetchone():
            return True
        # Also check without scheme
        raw_no_scheme = re.sub(r"^https?://", "", canonical_url)
        cursor.execute("SELECT id FROM evidence WHERE source_url LIKE ?", (f"%{raw_no_scheme}%",))
        if cursor.fetchone():
            return True

    # 2. Check content hash
    if content_hash:
        cursor.execute("SELECT id FROM evidence WHERE content_hash = ?", (content_hash,))
        if cursor.fetchone():
            return True

    # 3. Check headline
    if headline:
        cursor.execute("SELECT id FROM evidence WHERE headline = ?", (headline,))
        if cursor.fetchone():
            return True

    return False
