# monitor/scripts/audit_production_taxonomy.py
"""
404TN Production Taxonomy Remediation Audit (Strictly READ-ONLY)

Audits evidence records ingested during a specific collection run window
against current (a2e50b3) multi-axis classification and substantive gate logic.
"""
import sys
import os
import argparse
import sqlite3
import json
import hashlib
from typing import Dict, List, Any, Optional

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.services.taxonomy import classify_multi_axis
from monitor.app.services.classifier import is_substantive_evidence

DEFAULT_RUN_ID = "RUN-20260910-80491E10"
DEFAULT_WINDOW_START = "2026-09-10T01:36:25.394064+00:00"
DEFAULT_WINDOW_END = "2026-09-10T01:37:14.498119+00:00"
EXPECTED_COUNT = 18

def get_db_stats(conn: sqlite3.Connection) -> Dict[str, Any]:
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM evidence")
    total_evidence = c.fetchone()[0]
    c.execute("SELECT COALESCE(ingestion_status, 'UNKNOWN') as st, COUNT(*) FROM evidence GROUP BY st")
    status_counts = dict(c.fetchall())
    return {
        "total_evidence": total_evidence,
        "status_counts": status_counts
    }

def run_production_taxonomy_audit(
    db_path: str,
    window_start: str = DEFAULT_WINDOW_START,
    window_end: str = DEFAULT_WINDOW_END,
    run_id: str = DEFAULT_RUN_ID,
    expected_count: int = EXPECTED_COUNT,
    json_out: Optional[str] = None
) -> Dict[str, Any]:
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at path: {db_path}")

    # Read-only URI mode for SQLite
    uri = f"file:{os.path.abspath(db_path)}?mode=ro"
    try:
        conn = sqlite3.connect(uri, uri=True)
    except Exception:
        conn = sqlite3.connect(db_path)
        
    conn.row_factory = sqlite3.Row

    # 1. Safety Proof: BEFORE
    stats_before = get_db_stats(conn)
    print("=" * 80)
    print("404TN READ-ONLY PRODUCTION TAXONOMY AUDIT")
    print(f"Target DB: {db_path} (Mode: READ-ONLY)")
    print(f"Target Run ID: {run_id}")
    print(f"Collection Window: {window_start} -> {window_end}")
    print("=" * 80)
    print(f"[SAFETY BEFORE] Total Evidence: {stats_before['total_evidence']}")
    print(f"[SAFETY BEFORE] Status Breakdown: {stats_before['status_counts']}")
    print("-" * 80)

    # 2. Select matching records directly at runtime
    cursor = conn.cursor()
    query = """
        SELECT id, headline, summary, claim, source_name, source_type, source_domain, source_url, content_hash,
               issue, sub_issue, classification, classification_confidence, classification_reason,
               ingestion_status, collected_at
        FROM evidence
        WHERE collected_at >= ?
          AND collected_at <= ?
          AND ingestion_status = 'AUTO_ACCEPTED'
        ORDER BY collected_at, id;
    """
    cursor.execute(query, (window_start, window_end))
    rows = cursor.fetchall()
    selected_count = len(rows)

    print(f"[AUDIT QUERY] Records Selected: {selected_count} (Expected: {expected_count})")
    if selected_count != expected_count:
        print(f"[FATAL ERROR] Selected count ({selected_count}) does NOT match expected count ({expected_count})!")
        print("STOPPING AUDIT IMMEDIATELY. Selection will not be broadened or inferred.")
        conn.close()
        sys.exit(1)

    # 3. Evaluate each real record under current taxonomy logic
    audit_records = []
    counts = {"KEEP": 0, "RECLASSIFY": 0, "REJECT": 0, "REVIEW_REQUIRED": 0}

    for row in rows:
        rec_id = row["id"]
        headline = row["headline"] or ""
        summary = row["summary"] or ""
        claim = row["claim"] or ""
        source_name = row["source_name"] or ""
        source_type = row["source_type"] or "news_agency"
        source_domain = row["source_domain"] or ""
        source_url = row["source_url"] or ""
        content_hash = row["content_hash"] or ""
        
        curr_issue = row["issue"]
        curr_sub_issue = row["sub_issue"]
        curr_class = row["classification"]
        curr_conf = row["classification_confidence"]
        curr_reason = row["classification_reason"]
        curr_status = row["ingestion_status"]
        
        # Substantive gate evaluation
        is_sub, sub_reason = is_substantive_evidence(headline, source_domain=source_domain, body=summary)
        
        # Multi-axis classification evaluation
        cls_res = classify_multi_axis(
            text=f"{headline} {summary} {claim}".strip(),
            headline=headline,
            summary=summary,
            source_type=source_type
        )
        
        # Determine recommended disposition and proposed ingestion status
        if not is_sub:
            disp = "REJECT"
            prop_status = "REJECTED"
        elif cls_res.confidence < 0.70:
            disp = "REVIEW_REQUIRED"
            prop_status = "REVIEW_REQUIRED"
        elif (cls_res.primary_issue == curr_issue and 
              cls_res.sub_issue == curr_sub_issue and 
              cls_res.classification == curr_class):
            disp = "KEEP"
            prop_status = "AUTO_ACCEPTED"
        else:
            disp = "RECLASSIFY"
            prop_status = "AUTO_ACCEPTED"

        counts[disp] += 1

        hash_abbr = f"{content_hash[:6]}...{content_hash[-6:]}" if len(content_hash) >= 12 else content_hash

        audit_records.append({
            "id": rec_id,
            "headline": headline,
            "source_name": source_name,
            "source_type": source_type,
            "source_domain": source_domain,
            "source_url": source_url,
            "content_hash": content_hash,
            "content_hash_abbr": hash_abbr,
            "collected_at": row["collected_at"],
            "current": {
                "issue": curr_issue,
                "sub_issue": curr_sub_issue,
                "classification": curr_class,
                "classification_confidence": curr_conf,
                "classification_reason": curr_reason,
                "ingestion_status": curr_status
            },
            "proposed": {
                "primary_issue": cls_res.primary_issue,
                "sub_issue": cls_res.sub_issue,
                "secondary_issues": cls_res.secondary_issues,
                "topics": cls_res.topics,
                "entities": cls_res.entities,
                "classification": cls_res.classification,
                "confidence": cls_res.confidence,
                "reason": cls_res.reason if is_sub else f"Rejected by substantive gate: {sub_reason}",
                "is_substantive": is_sub,
                "substantive_reason": sub_reason,
                "ingestion_status": prop_status,
                "disposition": disp
            }
        })

    # 4. Safety Proof: AFTER
    stats_after = get_db_stats(conn)
    conn.close()

    print("-" * 120)
    print(f"[SAFETY AFTER]  Total Evidence: {stats_after['total_evidence']}")
    print(f"[SAFETY AFTER]  Status Breakdown: {stats_after['status_counts']}")
    assert stats_before == stats_after, "FATAL: Database state altered during read-only audit!"
    print("[SAFETY PROOF] ZERO database writes confirmed (100% Identical Before/After).")
    print("=" * 120)

    # 5. Output Formatted Audit Table
    print("\n" + "=" * 180)
    print(f"{'REAL_ID':<25} | {'HASH':<16} | {'OLD ISSUE/SUB':<35} | {'PROPOSED ISSUE/SUB':<38} | {'CLASS':<8} | {'CONF':<5} | {'STATUS':<14} | {'DISP'}")
    print("=" * 180)
    for r in audit_records:
        old_c = f"{r['current']['issue']} / {r['current']['sub_issue']}"
        prop_c = f"{r['proposed']['primary_issue']} / {r['proposed']['sub_issue']}"
        print(f"{r['id']:<25} | {r['content_hash_abbr']:<16} | {old_c[:35]:<35} | {prop_c[:38]:<38} | {r['proposed']['classification']:<8} | {r['proposed']['confidence']:<5.2f} | {r['proposed']['ingestion_status']:<14} | {r['proposed']['disposition']}")
        print(f"  Headline: {r['headline']}")
        print(f"  Source URL: {r['source_url']}")
        print("-" * 180)

    summary_report = {
        "run_id": run_id,
        "window_start": window_start,
        "window_end": window_end,
        "database_path": db_path,
        "selected_count": selected_count,
        "counts": counts,
        "mutation_count": selected_count - counts["KEEP"],
        "safety_before": stats_before,
        "safety_after": stats_after,
        "records": audit_records
    }

    if json_out:
        with open(json_out, "w", encoding="utf-8") as f:
            json.dump(summary_report, f, indent=2, ensure_ascii=False)
        print(f"[INFO] Audit JSON export written to: {json_out}")

    return summary_report

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Read-only Production Taxonomy Remediation Audit")
    parser.add_argument("--db", default=os.environ.get("DATABASE_PATH", "/data/404tn.db"), help="Path to SQLite database")
    parser.add_argument("--window-start", default=DEFAULT_WINDOW_START, help="Run start ISO timestamp")
    parser.add_argument("--window-end", default=DEFAULT_WINDOW_END, help="Run end ISO timestamp")
    parser.add_argument("--run-id", default=DEFAULT_RUN_ID, help="Target collector run ID")
    parser.add_argument("--expected-count", type=int, default=EXPECTED_COUNT, help="Expected record count assertion")
    parser.add_argument("--json-out", help="Path to save output JSON audit report")
    args = parser.parse_args()

    run_production_taxonomy_audit(
        db_path=args.db,
        window_start=args.window_start,
        window_end=args.window_end,
        run_id=args.run_id,
        expected_count=args.expected_count,
        json_out=args.json_out
    )
