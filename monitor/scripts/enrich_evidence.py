# monitor/scripts/enrich_evidence.py
import sys
import os
import argparse
import sqlite3
from typing import Dict, Any

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.database import DB_PATH, get_db
from monitor.app.services.locations import resolve_location_advanced, extract_location

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
        # Check available columns in evidence table
        cursor.execute("PRAGMA table_info(evidence)")
        cols = {r["name"] for r in cursor.fetchall()}
        has_new_cols = "location_scope" in cols

        # STRICT RULE: Process ONLY EV-AUTO-* records. Never touch seeded records.
        cursor.execute("SELECT * FROM evidence WHERE id LIKE 'EV-AUTO-%'")
        rows = cursor.fetchall()
        metrics["records_scanned"] = len(rows)

        updates = []

        for row in rows:
            ev_id = row["id"]
            headline = row["headline"] or ""
            summary = row["summary"] or ""
            text_to_scan = f"{headline} {summary}"

            try:
                res = resolve_location_advanced(text_to_scan, headline=headline, summary=summary)

                if res.scope in ["LOCAL", "GOVERNORATE"] and res.latitude is not None and res.longitude is not None:
                    canonical_loc = res.governorate or res.canonical_name
                    lat = res.latitude
                    lon = res.longitude
                    metrics["matched_locations"] += 1

                    if row["latitude"] != lat or row["longitude"] != lon or row["location"] != canonical_loc:
                        metrics["coordinates_added"] += 1
                        if has_new_cols:
                            updates.append((
                                canonical_loc, lat, lon, res.scope, res.governorate,
                                res.delegation, res.locality, res.location_confidence,
                                res.location_method, ev_id
                            ))
                        else:
                            updates.append((canonical_loc, lat, lon, ev_id))
                else:
                    if res.scope == "MULTI_GOVERNORATE":
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
            if has_new_cols:
                cursor.executemany("""
                    UPDATE evidence
                    SET location = ?, latitude = ?, longitude = ?,
                        location_scope = ?, governorate = ?, delegation = ?,
                        locality = ?, location_confidence = ?, location_method = ?
                    WHERE id = ?
                """, updates)
            else:
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
