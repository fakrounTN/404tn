# monitor/scripts/daily_quality_report.py
import sys
import os
import argparse
import json
import sqlite3
from datetime import datetime, timezone, timedelta

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.database import get_db, DB_PATH
from monitor.app.services.source_health import get_all_source_health

def generate_quality_report(db_path: str = DB_PATH, hours: int = 24, save: bool = False, json_output: bool = False):
    if not os.path.exists(db_path):
        print(f"[ERROR] Database file not found at {db_path}")
        return None

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cutoff_iso = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()

    # 1. Total Evidence Counts
    cursor.execute("SELECT COUNT(*) FROM evidence WHERE id LIKE 'EV-AUTO-%'")
    total_auto_all = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM evidence WHERE id LIKE 'EV-AUTO-%' AND collected_at >= ?", (cutoff_iso,))
    total_auto_24h = cursor.fetchone()[0]

    # Ingestion Status Breakdown (Last 24h & Total)
    cursor.execute("""
        SELECT COALESCE(ingestion_status, 'AUTO_ACCEPTED') as status, COUNT(*) as count
        FROM evidence
        WHERE id LIKE 'EV-AUTO-%' AND collected_at >= ?
        GROUP BY status
    """, (cutoff_iso,))
    status_24h = {r["status"]: r["count"] for r in cursor.fetchall()}

    # Issue Category Breakdown (Last 24h & Total)
    cursor.execute("""
        SELECT issue, COUNT(*) as count
        FROM evidence
        WHERE id LIKE 'EV-AUTO-%' AND (ingestion_status = 'AUTO_ACCEPTED' OR ingestion_status IS NULL)
        GROUP BY issue
        ORDER BY count DESC
    """)
    issues_total = {r["issue"]: r["count"] for r in cursor.fetchall()}

    # Epistemic Classification Breakdown
    cursor.execute("""
        SELECT classification, COUNT(*) as count
        FROM evidence
        WHERE id LIKE 'EV-AUTO-%' AND (ingestion_status = 'AUTO_ACCEPTED' OR ingestion_status IS NULL)
        GROUP BY classification
    """)
    epistemic_counts = {r["classification"]: r["count"] for r in cursor.fetchall()}

    # Average Confidence
    cursor.execute("""
        SELECT AVG(COALESCE(classification_confidence, 0.9)) as avg_conf
        FROM evidence
        WHERE id LIKE 'EV-AUTO-%'
    """)
    avg_confidence = round(cursor.fetchone()["avg_conf"] or 0.9, 2)

    # Review Queue Items
    cursor.execute("""
        SELECT id, issue, headline, source_name, classification_reason, classification_confidence, collected_at
        FROM evidence
        WHERE ingestion_status = 'REVIEW_REQUIRED'
        ORDER BY collected_at DESC
        LIMIT 20
    """)
    review_queue_items = [dict(r) for r in cursor.fetchall()]

    # Source Health
    source_health_records = get_all_source_health(conn)
    conn.close()

    report_data = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "period_hours": hours,
        "total_evidence_records": total_auto_all,
        "recent_collected_records": total_auto_24h,
        "ingestion_status_recent": status_24h,
        "issue_distribution_total": issues_total,
        "epistemic_distribution": epistemic_counts,
        "average_classification_confidence": avg_confidence,
        "review_queue_count": len(review_queue_items),
        "review_queue_items": review_queue_items,
        "source_health": source_health_records
    }

    if json_output:
        print(json.dumps(report_data, indent=2))
        return report_data

    # Markdown Report Construction
    md_lines = [
        "==================================================================================================",
        f"                             404TN DAILY EVIDENCE QUALITY & TELEMETRY REPORT",
        "==================================================================================================",
        f"Generated: {report_data['generated_at']} | Window: Last {hours} Hours",
        f"Total Real Evidence Records (EV-AUTO-*): {total_auto_all} | Ingestion Average Confidence: {avg_confidence:.2f}",
        "",
        "--- INGESTION WORKFLOW STATES (RECENT) ---",
        f"  * AUTO_ACCEPTED:   {status_24h.get('AUTO_ACCEPTED', 0)}",
        f"  * REVIEW_REQUIRED: {status_24h.get('REVIEW_REQUIRED', 0)}",
        f"  * REJECTED (Logs): See source telemetry below",
        "",
        "--- PRIMARY ISSUE DISTRIBUTION (PUBLIC AUTO-ACCEPTED) ---"
    ]

    for iss, cnt in issues_total.items():
        md_lines.append(f"  * {iss:<20} : {cnt:>4} records")

    md_lines.extend([
        "",
        "--- SOURCE TELEMETRY & HEALTH STATUS ---",
        f"{'SOURCE ID':<20} {'STATUS':<10} {'HTTP':<6} {'DISC':<6} {'PARSE':<6} {'ACCPT':<6} {'FAIL':<5} {'AVG DURATION'}",
        "-" * 90
    ])

    for sh in source_health_records:
        sid = sh["source_id"][:19]
        st = sh.get("health_status", "UNKNOWN")
        http = str(sh.get("last_http_status") or "N/A")
        disc = sh.get("last_items_discovered", 0)
        parse = sh.get("last_items_parsed", 0)
        acc = sh.get("last_relevant_count", 0)
        consec = sh.get("consecutive_failures", 0)
        dur = f"{sh.get('average_duration_ms', 0):.0f}ms"
        md_lines.append(f"{sid:<20} {st:<10} {http:<6} {disc:<6} {parse:<6} {acc:<6} {consec:<5} {dur}")

    if review_queue_items:
        md_lines.extend([
            "",
            "--- ITEMS FLAGGED FOR EDITORIAL REVIEW ---"
        ])
        for it in review_queue_items[:10]:
            md_lines.append(f"  * [{it['id']}] ({it['issue']}) Conf: {it['classification_confidence']} | Source: {it['source_name']}")
            md_lines.append(f"    Headline: {it['headline'][:80]}")
            md_lines.append(f"    Reason: {it['classification_reason']}")

    md_lines.append("==================================================================================================")
    report_text = "\n".join(md_lines)
    print(report_text)

    if save:
        reports_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "reports")
        os.makedirs(reports_dir, exist_ok=True)
        date_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        txt_path = os.path.join(reports_dir, f"quality_report_{date_str}.md")
        json_path = os.path.join(reports_dir, f"quality_report_{date_str}.json")

        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(report_text)
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)

        print(f"\n[REPORT] Saved reports to:\n  - {txt_path}\n  - {json_path}")

    return report_data

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="404TN Daily Evidence Quality & Telemetry Generator")
    parser.add_argument("--db", default=DB_PATH, help="Path to SQLite database")
    parser.add_argument("--hours", type=int, default=24, help="Window period in hours")
    parser.add_argument("--save", action="store_true", help="Save report to reports/ directory")
    parser.add_argument("--json", action="store_true", help="Output raw JSON data")
    args = parser.parse_args()

    generate_quality_report(
        db_path=args.db,
        hours=args.hours,
        save=args.save,
        json_output=args.json
    )
