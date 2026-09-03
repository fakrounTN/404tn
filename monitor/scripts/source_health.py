# monitor/scripts/source_health.py
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.database import get_db
from monitor.app.services.source_health import get_all_source_health

def display_health():
    with get_db() as conn:
        records = get_all_source_health(conn)

    print("==========================================================================================")
    print("                    404TN EVIDENCE MONITOR - SOURCE HEALTH TELEMETRY                     ")
    print("==========================================================================================")
    print(f"{'SOURCE ID':<18} {'STATUS':<10} {'HTTP':<6} {'FAILURES':<10} {'AVG DURATION':<14} {'LAST SUCCESS'}")
    print("-" * 90)

    if not records:
        print("No source health records found. Run collection first.")
    else:
        for r in records:
            sid = r.get("source_id", "")
            status = r.get("health_status", "HEALTHY")
            http = str(r.get("last_http_status", "N/A"))
            fails = str(r.get("consecutive_failures", 0))
            dur = f"{r.get('average_duration_ms', 0):.1f} ms"
            last_succ = (r.get("last_success") or "Never")[:19]
            print(f"{sid:<18} {status:<10} {http:<6} {fails:<10} {dur:<14} {last_succ}")

    print("=" * 90)

if __name__ == "__main__":
    display_health()
