# monitor/app/services/source_health.py
import sqlite3
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

def compute_health_status(consecutive_failures: int, is_enabled: bool) -> str:
    if not is_enabled:
        return "DISABLED"
    if consecutive_failures == 0:
        return "HEALTHY"
    elif 1 <= consecutive_failures <= 4:
        return "DEGRADED"
    else:
        return "OFFLINE"

def record_source_attempt(
    conn: sqlite3.Connection,
    source_id: str,
    http_status: Optional[int],
    items_discovered: int,
    items_parsed: int,
    relevant_count: int,
    duration_ms: float,
    error: Optional[str] = None,
    is_enabled: bool = True
):
    """Records telemetry of a collector run for a given source."""
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor = conn.cursor()

    # Create table if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS source_health (
            source_id TEXT PRIMARY KEY,
            last_attempt TEXT NOT NULL,
            last_success TEXT,
            last_failure TEXT,
            last_http_status INTEGER,
            last_items_discovered INTEGER DEFAULT 0,
            last_items_parsed INTEGER DEFAULT 0,
            last_relevant_count INTEGER DEFAULT 0,
            consecutive_failures INTEGER DEFAULT 0,
            last_error TEXT,
            average_duration_ms REAL DEFAULT 0,
            health_status TEXT DEFAULT 'HEALTHY'
        )
    """)

    # Fetch existing state
    cursor.execute("SELECT * FROM source_health WHERE source_id = ?", (source_id,))
    row = cursor.fetchone()

    is_success = (error is None and (http_status is not None and 200 <= http_status < 400))

    if row:
        prev_consec = row["consecutive_failures"] if "consecutive_failures" in row.keys() else 0
        prev_avg_dur = row["average_duration_ms"] if "average_duration_ms" in row.keys() else duration_ms
        new_avg_dur = round((prev_avg_dur + duration_ms) / 2.0, 2)
        
        if is_success:
            consec = 0
            last_succ = now_iso
            last_fail = row["last_failure"] if "last_failure" in row.keys() else None
        else:
            consec = prev_consec + 1
            last_succ = row["last_success"] if "last_success" in row.keys() else None
            last_fail = now_iso

        health = compute_health_status(consec, is_enabled)

        cursor.execute("""
            UPDATE source_health
            SET last_attempt = ?,
                last_success = ?,
                last_failure = ?,
                last_http_status = ?,
                last_items_discovered = ?,
                last_items_parsed = ?,
                last_relevant_count = ?,
                consecutive_failures = ?,
                last_error = ?,
                average_duration_ms = ?,
                health_status = ?
            WHERE source_id = ?
        """, (
            now_iso, last_succ, last_fail, http_status,
            items_discovered, items_parsed, relevant_count,
            consec, error, new_avg_dur, health, source_id
        ))
    else:
        consec = 0 if is_success else 1
        health = compute_health_status(consec, is_enabled)
        cursor.execute("""
            INSERT INTO source_health (
                source_id, last_attempt, last_success, last_failure,
                last_http_status, last_items_discovered, last_items_parsed,
                last_relevant_count, consecutive_failures, last_error,
                average_duration_ms, health_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            source_id, now_iso, now_iso if is_success else None,
            None if is_success else now_iso, http_status,
            items_discovered, items_parsed, relevant_count,
            consec, error, round(duration_ms, 2), health
        ))

    conn.commit()

def get_all_source_health(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """Fetches all source health records."""
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS source_health (
            source_id TEXT PRIMARY KEY,
            last_attempt TEXT NOT NULL,
            last_success TEXT,
            last_failure TEXT,
            last_http_status INTEGER,
            last_items_discovered INTEGER DEFAULT 0,
            last_items_parsed INTEGER DEFAULT 0,
            last_relevant_count INTEGER DEFAULT 0,
            consecutive_failures INTEGER DEFAULT 0,
            last_error TEXT,
            average_duration_ms REAL DEFAULT 0,
            health_status TEXT DEFAULT 'HEALTHY'
        )
    """)
    cursor.execute("SELECT * FROM source_health ORDER BY source_id ASC")
    return [dict(r) for r in cursor.fetchall()]
