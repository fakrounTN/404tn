# monitor/scripts/audit_legacy_evidence.py
"""
404TN — READ-ONLY Legacy Evidence Audit Script

Analyzes EV-AUTO-* records in the database using the authoritative 404TN classifier.
Returns exactly one decision per record:
- KEEP: Correctly classified under monitored taxonomy with high confidence
- RECLASSIFY: Mismatched primary subject; proposes canonical issue reassignment
- EXCLUDE: Non-substantive page, sports, training, or foreign wire without Tunisia context
- REVIEW_REQUIRED: Substantive and relevant, but borderline confidence or multi-topic ambiguity

CRITICAL SAFETY RULES:
- READ-ONLY by default and design.
- Absolutely NO UPDATE, DELETE, INSERT, ALTER, or CREATE queries.
- NO --apply mode exists in this script.
- Ignores non-EV-AUTO (e.g., seeded) records.
"""

import os
import sys
import json
import sqlite3
import argparse
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.database import DB_PATH
from monitor.app.services.classifier import (
    classify_issue_advanced,
    is_substantive_evidence,
    has_tunisia_context,
    determine_ingestion_status
)

CANONICAL_ISSUES = {
    "water",
    "electricity",
    "work",
    "migration",
    "public_services",
    "rights",
    "pollution"
}

ISSUE_NORMALIZATION = {
    "energy": "electricity",
    "electricity": "electricity",
    "water": "water",
    "economy": "work",
    "work": "work",
    "migration": "migration",
    "public_services": "public_services",
    "public services": "public_services",
    "rights": "rights",
    "institutions": "rights",
    "governance": "rights",
    "gabes": "pollution",
    "pollution": "pollution"
}

def normalize_issue(issue: Optional[str]) -> Optional[str]:
    """Normalizes legacy or alias issue names into canonical 404TN slugs."""
    if not issue:
        return None
    cleaned = issue.strip().lower()
    return ISSUE_NORMALIZATION.get(cleaned, cleaned)

def resolve_target_db(custom_path: Optional[str] = None) -> str:
    """
    Resolves the SQLite database path:
    1. Explicit custom_path from CLI (--db)
    2. Standard production path (/data/404tn.db) if present
    3. DB_PATH environment variable
    4. Default application DB_PATH
    """
    if custom_path:
        return os.path.abspath(custom_path)
    if os.path.exists("/data/404tn.db"):
        return "/data/404tn.db"
    env_db = os.environ.get("DB_PATH")
    if env_db and os.path.exists(env_db):
        return os.path.abspath(env_db)
    return os.path.abspath(DB_PATH)

def audit_legacy_evidence(db_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Executes a pure READ-ONLY audit on EV-AUTO-* evidence records.
    Guaranteed zero mutations on the database.
    """
    target_db = resolve_target_db(db_path)

    if not os.path.exists(target_db):
        raise FileNotFoundError(f"Database not found at '{target_db}'")

    # Connect strictly in read-only mode using sqlite URI
    # On Windows / Posix, URI read-only ensures no lock modification or accidental write
    try:
        uri = f"file:{os.path.abspath(target_db)}?mode=ro"
        conn = sqlite3.connect(uri, uri=True)
    except Exception:
        conn = sqlite3.connect(target_db)

    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # STRICT RULE: Scan ONLY EV-AUTO-* records
        cursor.execute("""
            SELECT id, issue, headline, summary, claim, source_name, source_domain, source_type, source_url
            FROM evidence
            WHERE id LIKE 'EV-AUTO-%'
            ORDER BY id
        """)
        rows = cursor.fetchall()
    finally:
        conn.close()

    total_scanned = len(rows)
    keep_records: List[Dict[str, Any]] = []
    reclassify_records: List[Dict[str, Any]] = []
    exclude_records: List[Dict[str, Any]] = []
    review_required_records: List[Dict[str, Any]] = []
    all_evaluated: List[Dict[str, Any]] = []

    for row in rows:
        ev_id = row["id"]
        headline = (row["headline"] or "").strip()
        summary = (row["summary"] or "").strip()
        body = (row["claim"] or "").strip()
        source_name = row["source_name"] or "Unknown"
        source_domain = row["source_domain"] or ""
        raw_current_issue = row["issue"]
        current_issue = normalize_issue(raw_current_issue)

        # 1. Evaluate Substantive Evidence Quality
        is_substantive, sub_reason = is_substantive_evidence(headline, summary, body, source_domain=source_domain)

        # 2. Evaluate Tunisia-Context Gate
        is_tunisia = has_tunisia_context(f"{headline} {summary} {body}", source_domain=source_domain, source_id=row["source_type"])

        # 3. Perform Deep Primary-Subject Classification
        cls_res = classify_issue_advanced(summary, headline=headline, body=body)
        raw_proposed = cls_res.primary_issue
        proposed_issue = normalize_issue(raw_proposed)
        confidence = cls_res.confidence
        cls_reason = cls_res.reason

        # 4. Determine Exact Decision: KEEP, RECLASSIFY, EXCLUDE, or REVIEW_REQUIRED
        decision: str
        decision_reason: str

        if not is_substantive:
            decision = "EXCLUDE"
            decision_reason = f"Non-substantive content ({sub_reason})"
            proposed_issue = None
            confidence = 0.0
        elif not is_tunisia:
            decision = "EXCLUDE"
            decision_reason = "Failed Tunisia-context relevance gate (foreign wire story or lack of verified TN signals)"
            proposed_issue = None
            confidence = 0.0
        elif proposed_issue is None:
            decision = "REVIEW_REQUIRED"
            decision_reason = f"Substantive Tunisia content without definitive canonical issue match ({cls_reason})"
        elif confidence < 0.70:
            decision = "REVIEW_REQUIRED"
            decision_reason = f"Substantive Tunisia content with low/borderline classification confidence ({confidence:.2f}): {cls_reason}"
        else:
            # High confidence match (confidence >= 0.70)
            if current_issue == proposed_issue:
                decision = "KEEP"
                decision_reason = f"Correctly classified under '{current_issue}' ({cls_reason})"
            else:
                decision = "RECLASSIFY"
                decision_reason = f"Primary subject reassignment from '{current_issue}' to '{proposed_issue}': {cls_reason}"

        record_entry = {
            "id": ev_id,
            "headline": headline,
            "source_name": source_name,
            "source_domain": source_domain,
            "current_issue": current_issue or raw_current_issue,
            "raw_current_issue": raw_current_issue,
            "proposed_issue": proposed_issue,
            "decision": decision,
            "confidence": round(confidence, 2),
            "reason": decision_reason
        }

        all_evaluated.append(record_entry)

        if decision == "KEEP":
            keep_records.append(record_entry)
        elif decision == "RECLASSIFY":
            reclassify_records.append(record_entry)
        elif decision == "EXCLUDE":
            exclude_records.append(record_entry)
        elif decision == "REVIEW_REQUIRED":
            review_required_records.append(record_entry)

    non_keep_records = [r for r in all_evaluated if r["decision"] != "KEEP"]

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": target_db,
        "total_records_scanned": total_scanned,
        "summary": {
            "KEEP": len(keep_records),
            "RECLASSIFY": len(reclassify_records),
            "EXCLUDE": len(exclude_records),
            "REVIEW_REQUIRED": len(review_required_records)
        },
        "records": all_evaluated,
        "non_keep_records": non_keep_records,
        "keep_records": keep_records,
        "reclassify_records": reclassify_records,
        "exclude_records": exclude_records,
        "review_required_records": review_required_records
    }

def print_audit_report(report: Dict[str, Any]) -> None:
    """Formats and prints the human-readable audit report to stdout."""
    total = report["total_records_scanned"]
    summary = report["summary"]

    def pct(count: int) -> str:
        if total == 0:
            return "0.0%"
        return f"{(count / total) * 100:.1f}%"

    print("==========================================================================================")
    print("                      404TN READ-ONLY LEGACY EVIDENCE AUDIT")
    print("==========================================================================================")
    print(f"Database  : {report['database']}")
    print(f"Timestamp : {report['timestamp']}")
    print(f"Mode      : READ-ONLY (Zero modifications permitted)\n")
    print(f"TOTAL EV-AUTO RECORDS SCANNED: {total}")
    print("------------------------------------------------------------------------------------------")
    print(f"  * KEEP            : {summary['KEEP']:>4} ({pct(summary['KEEP']):>6})")
    print(f"  * RECLASSIFY      : {summary['RECLASSIFY']:>4} ({pct(summary['RECLASSIFY']):>6})")
    print(f"  * EXCLUDE         : {summary['EXCLUDE']:>4} ({pct(summary['EXCLUDE']):>6})")
    print(f"  * REVIEW_REQUIRED : {summary['REVIEW_REQUIRED']:>4} ({pct(summary['REVIEW_REQUIRED']):>6})")
    print("------------------------------------------------------------------------------------------\n")

    non_keep = report["non_keep_records"]
    if not non_keep:
        print("[OK] All scanned EV-AUTO records match the current classifier taxonomy with high confidence.\n")
    else:
        print(f"--- NON-KEEP RECORDS AUDIT DETAILS ({len(non_keep)} records) ---\n")
        for rec in non_keep:
            print(f"[{rec['decision']}] {rec['id']}")
            print(f"  Headline      : {rec['headline']}")
            print(f"  Source        : {rec['source_name']} ({rec['source_domain']})")
            print(f"  Current Issue : {rec['current_issue']}")
            print(f"  Proposed Issue: {rec['proposed_issue']}")
            print(f"  Confidence    : {rec['confidence']:.2f}")
            print(f"  Reason        : {rec['reason']}\n")

    print("==========================================================================================")
    print("AUDIT COMPLETE (READ-ONLY: Zero database modifications performed)")
    print("==========================================================================================")

def main():
    parser = argparse.ArgumentParser(
        description="404TN Read-Only Legacy Evidence Audit Script",
        epilog="This script is strictly READ-ONLY and will never modify, delete, or insert database rows."
    )
    parser.add_argument("--db", type=str, default=None, help="Path to SQLite database (default: /data/404tn.db or monitor/data/404tn.db)")
    parser.add_argument("--json-out", type=str, default=None, help="Path to write structured JSON audit report")

    args = parser.parse_args()

    try:
        report = audit_legacy_evidence(db_path=args.db)
        print_audit_report(report)

        if args.json_out:
            out_path = os.path.abspath(args.json_out)
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            print(f"\n[INFO] JSON audit report saved to: {out_path}")

    except Exception as e:
        print(f"[ERROR] Audit failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
