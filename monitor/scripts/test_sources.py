# monitor/scripts/test_sources.py
import sys
import os
import yaml
import time
import argparse

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.collectors import get_collector

def test_all_sources(selected_sources=None):
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "sources.yaml")
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    all_sources = cfg.get("sources", [])
    if selected_sources:
        sources_to_test = [s for s in all_sources if s["id"] in selected_sources]
    else:
        sources_to_test = all_sources

    print("==========================================================================================", flush=True)
    print("                    404TN EVIDENCE MONITOR - SOURCE DIAGNOSTIC TEST                      ", flush=True)
    print("==========================================================================================", flush=True)
    print(f"{'SOURCE ID':<18} {'HTTP':<6} {'DISCOVERED':<12} {'PARSED':<8} {'STATUS':<10} {'ERROR / NOTES'}", flush=True)
    print("-" * 90, flush=True)

    total = len(sources_to_test)
    passed = 0
    partial = 0
    failed = 0
    disabled = 0

    for s in sources_to_test:
        source_id = s["id"]
        is_enabled = s.get("enabled", True)

        if not is_enabled:
            disabled += 1
            reason = s.get("disabled_reason", "Config disabled")
            print(f"{source_id:<18} {'N/A':<6} {0:<12} {0:<8} {'DISABLED':<10} {reason[:35]}", flush=True)
            continue

        try:
            collector = get_collector(s)
            candidates, metrics = collector.collect()
            
            http_str = str(metrics.http_status) if metrics.http_status else "N/A"
            err_str = (metrics.last_error or "")[:35]

            if metrics.http_status and 200 <= metrics.http_status < 400 and metrics.items_parsed > 0:
                status = "PASS"
                passed += 1
            elif metrics.http_status and 200 <= metrics.http_status < 400:
                status = "PARTIAL"
                partial += 1
            else:
                status = "FAIL"
                failed += 1

            print(f"{source_id:<18} {http_str:<6} {metrics.items_discovered:<12} {metrics.items_parsed:<8} {status:<10} {err_str}", flush=True)

        except Exception as exc:
            failed += 1
            print(f"{source_id:<18} {'FAIL':<6} {0:<12} {0:<8} {'FAIL':<10} {str(exc)[:35]}", flush=True)

    print("=" * 90, flush=True)
    print(f"TOTAL SOURCES TESTED: {total} | PASS: {passed} | PARTIAL: {partial} | FAIL: {failed} | DISABLED: {disabled}", flush=True)
    print("DIAGNOSTIC TEST COMPLETE (0 DATABASE WRITES)", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="404TN Sources Diagnostic Tool")
    parser.add_argument("--source", action="append", help="Specific source ID to test")
    args = parser.parse_args()
    test_all_sources(args.source)
