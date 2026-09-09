# monitor/scripts/enrich_evidence.py
import sys
import os
import argparse
import sqlite3
from typing import Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.database import DB_PATH, get_db
from monitor.app.services.locations import extract_location

def enrich_evidence(apply: bool = False, db_path: str = None) -> Dict[str, int]:
    """
    Idempotent enrichment script for EV-AUTO-* evidence records.
    Resolves authoritative coordinates from headline + summary without modifying
    any editorial, timestamp, or cryptographic hash fields.
    """
    target_db = db_path or DB_PATH

    metrics = {
        "records_scanned": 0,
        "matched_locations": 0,
        "coordinates_added": 0,
        "ambiguous": 0,
        "unresolved": 0,
        "errors": 0
    }

    print("==========================================================================================")
    print(f"            404TN EVIDENCE ENRICHMENT PIPELINE {'[APPLY MODE]' if apply else '[DRY RUN - DEFAULT]'}")
    print("==========================================================================================")
    print(f"Database: {target_db}\n")

    conn = sqlite3.connect(target_db)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # STRICT RULE: Process ONLY EV-AUTO-* records. Never touch seeded records.
        cursor.execute("SELECT id, headline, summary, location, latitude, longitude FROM evidence WHERE id LIKE 'EV-AUTO-%'")
        rows = cursor.fetchall()
        metrics["records_scanned"] = len(rows)

        updates = []

        for row in rows:
            ev_id = row["id"]
            headline = row["headline"] or ""
            summary = row["summary"] or ""
            text_to_scan = f"{headline} {summary}"

            try:
                canonical_loc, lat, lon = extract_location(text_to_scan)

                if lat is not None and lon is not None:
                    metrics["matched_locations"] += 1
                    # Check if coordinates were missing or need updating
                    if row["latitude"] != lat or row["longitude"] != lon or row["location"] != canonical_loc:
                        metrics["coordinates_added"] += 1
                        updates.append((canonical_loc, lat, lon, ev_id))
                else:
                    if canonical_loc and canonical_loc != "Tunisia":
                        metrics["ambiguous"] += 1
                    else:
                        metrics["unresolved"] += 1

            except Exception as e:
                metrics["errors"] += 1
                print(f"Error processing {ev_id}: {e}")

        print(f"Records Scanned (EV-AUTO-* only): {metrics['records_scanned']}")
        print(f"Matched Authoritative Locations : {metrics['matched_locations']}")
        print(f"Coordinates to Add / Update     : {metrics['coordinates_added']}")
        print(f"Ambiguous / Multi-Location      : {metrics['ambiguous']}")
        print(f"National / Unresolved (No Coords: {metrics['unresolved']}")
        print(f"Errors                          : {metrics['errors']}")

        if apply and updates:
            cursor.executemany("""
                UPDATE evidence
                SET location = ?, latitude = ?, longitude = ?
                WHERE id = ?
            """, updates)
            conn.commit()
            print(f"\nSUCCESS: Applied {len(updates)} location & coordinate updates to database.")
        elif not apply:
            print(f"\nDRY RUN COMPLETE: Zero changes written to database. Run with --apply to persist.")

    finally:
        conn.close()

    return metrics

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="404TN Evidence Location Enrichment")
    parser.add_argument("--apply", action="store_true", help="Apply updates to database (Default is dry-run)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate enrichment without writing (Default)")
    parser.add_argument("--db", type=str, default=None, help="Custom SQLite DB path")
    args = parser.parse_args()

    # Default is dry-run unless --apply is explicitly set
    should_apply = args.apply and not args.dry_run
    enrich_evidence(apply=should_apply, db_path=args.db)
