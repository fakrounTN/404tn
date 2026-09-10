# monitor/scripts/enrich_evidence.py
"""
404TN — Production-Safe Geolocation Enrichment Tool (Phase 4.1)

Performs deterministic geographic resolution and coordinate enrichment for active EV-AUTO-* evidence records.

STRICT SAFETY INVARIANTS:
1. DRY-RUN by default (zero database writes without --apply and --confirm).
2. Explicit confirmation required: --confirm APPLY-GEO-ENRICHMENT-V1.
3. Operates strictly on active evidence (ingestion_status = 'AUTO_ACCEPTED' or NULL).
4. REJECTED records are completely skipped and never enriched.
5. NATIONAL records receive NULL coordinates and NULL governorate/delegation/locality.
6. MULTI_GOVERNORATE records receive NULL coordinates and are never collapsed into an arbitrary governorate.
7. UNRESOLVED records receive NULL coordinates and 0.0 confidence.
8. Coordinates are assigned only where evidence supports LOCAL or GOVERNORATE resolution.
9. Modifies strictly and exclusively the 9 location columns (location, latitude, longitude,
   location_scope, governorate, delegation, locality, location_confidence, location_method).
10. Preserves all non-location columns (issue, classification, status, headline, summary, content_hash, etc.).
11. Atomic transaction (BEGIN IMMEDIATE / COMMIT / ROLLBACK on any error).
12. Machine-readable JSON execution log (--log-out).
"""

import sys
import os
import json
import hashlib
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
from monitor.app.services.locations import resolve_location_advanced, ResolvedLocation

REQUIRED_CONFIRM_TOKEN = "APPLY-GEO-ENRICHMENT-V1"


class EnrichmentValidationError(Exception):
    """Raised when preconditions or validation checks fail closed."""
    pass


def compute_file_sha256(file_path: str) -> str:
    """Calculates SHA256 checksum of a file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def enrich_evidence(
    apply: bool = False,
    db_path: Optional[str] = None,
    confirm_token: Optional[str] = REQUIRED_CONFIRM_TOKEN,
    log_out: Optional[str] = None
) -> Dict[str, Any]:
    """
    Idempotent geolocation enrichment tool for active EV-AUTO-* evidence records.
    Resolves authoritative governorates, delegations, and coordinates without modifying
    any editorial, classification, or cryptographic hash fields.
    """
    target_db = db_path or DB_PATH

    if apply and confirm_token != REQUIRED_CONFIRM_TOKEN:
        raise EnrichmentValidationError(
            f"Safety error: --apply requires --confirm {REQUIRED_CONFIRM_TOKEN}. Got '{confirm_token}'."
        )

    if not os.path.exists(target_db):
        raise EnrichmentValidationError(f"Database file not found: '{target_db}'")

    db_sha256_before = compute_file_sha256(target_db)

    conn = sqlite3.connect(target_db)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # Check available columns in evidence table
        cursor.execute("PRAGMA table_info(evidence)")
        cols = {r["name"] for r in cursor.fetchall()}
        has_new_cols = "location_scope" in cols

        # Query total EV-AUTO records in DB
        cursor.execute("SELECT COUNT(*) FROM evidence WHERE id LIKE 'EV-AUTO-%'")
        total_ev_auto = cursor.fetchone()[0]

        # Query REJECTED records to count and skip
        cursor.execute("SELECT COUNT(*) FROM evidence WHERE id LIKE 'EV-AUTO-%' AND ingestion_status = 'REJECTED'")
        rejected_skipped_count = cursor.fetchone()[0]

        # Query strictly active records
        cursor.execute("""
            SELECT * FROM evidence
            WHERE id LIKE 'EV-AUTO-%' AND (ingestion_status = 'AUTO_ACCEPTED' OR ingestion_status IS NULL)
            ORDER BY id
        """)
        active_rows = [dict(r) for r in cursor.fetchall()]

        records_log = []
        updates_to_apply = []

        counts_proposed = {
            "LOCAL": 0,
            "GOVERNORATE": 0,
            "MULTI_GOVERNORATE": 0,
            "NATIONAL": 0,
            "UNRESOLVED": 0
        }
        with_coords_count = 0
        with_gov_count = 0
        with_deleg_count = 0
        with_locality_count = 0
        with_conf_count = 0

        for r in active_rows:
            ev_id = r["id"]
            headline = r.get("headline") or ""
            summary = r.get("summary") or ""
            source_domain = r.get("source_domain")
            source_name = r.get("source_name") or "Unknown"
            text_to_scan = f"{headline} {summary}"

            res: ResolvedLocation = resolve_location_advanced(
                text_to_scan,
                headline=headline,
                summary=summary,
                source_domain=source_domain
            )

            # Proposed values
            prop_scope = res.scope
            prop_gov = res.governorate
            prop_deleg = res.delegation
            prop_loc = res.locality
            prop_lat = res.latitude
            prop_lon = res.longitude
            prop_conf = res.location_confidence
            prop_method = res.location_method
            prop_name = res.canonical_name

            # Invariant enforcement
            if prop_scope in ["NATIONAL", "MULTI_GOVERNORATE", "UNRESOLVED"]:
                prop_gov = None
                prop_deleg = None
                prop_loc = None
                prop_lat = None
                prop_lon = None
                if prop_scope == "UNRESOLVED":
                    prop_conf = 0.0
                    prop_name = "Tunisia"
                elif prop_scope == "NATIONAL":
                    prop_name = "Tunisia"
                elif prop_scope == "MULTI_GOVERNORATE":
                    prop_name = "Multi-Governorate"

            # Tally proposed distribution
            counts_proposed[prop_scope] = counts_proposed.get(prop_scope, 0) + 1
            if prop_lat is not None and prop_lon is not None:
                with_coords_count += 1
            if prop_gov:
                with_gov_count += 1
            if prop_deleg:
                with_deleg_count += 1
            if prop_loc:
                with_locality_count += 1
            if prop_conf > 0:
                with_conf_count += 1

            # Current values
            curr_scope = r.get("location_scope")
            curr_gov = r.get("governorate")
            curr_deleg = r.get("delegation")
            curr_loc = r.get("locality")
            curr_lat = r.get("latitude")
            curr_lon = r.get("longitude")
            curr_conf = r.get("location_confidence")
            curr_method = r.get("location_method")
            curr_location = r.get("location")

            # Check if change is proposed
            changed = (
                curr_scope != prop_scope or
                curr_gov != prop_gov or
                curr_deleg != prop_deleg or
                curr_loc != prop_loc or
                curr_lat != prop_lat or
                curr_lon != prop_lon or
                curr_conf != prop_conf or
                curr_method != prop_method or
                curr_location != prop_name
            )

            # Ambiguity warning
            ambiguity_warning = None
            if prop_scope == "MULTI_GOVERNORATE":
                ambiguity_warning = "Multiple distinct governorates referenced; scope set to MULTI_GOVERNORATE without single centroid."
            elif prop_conf > 0 and prop_conf < 0.85:
                ambiguity_warning = f"Lower location confidence score ({prop_conf:.2f})."

            rec_entry = {
                "id": ev_id,
                "headline": headline,
                "source": source_name,
                "source_domain": source_domain,
                "issue": r.get("issue"),
                "current": {
                    "location": curr_location,
                    "location_scope": curr_scope,
                    "governorate": curr_gov,
                    "delegation": curr_deleg,
                    "locality": curr_loc,
                    "latitude": curr_lat,
                    "longitude": curr_lon,
                    "location_confidence": curr_conf,
                    "location_method": curr_method
                },
                "proposed": {
                    "location": prop_name,
                    "location_scope": prop_scope,
                    "governorate": prop_gov,
                    "delegation": prop_deleg,
                    "locality": prop_loc,
                    "latitude": prop_lat,
                    "longitude": prop_lon,
                    "location_confidence": prop_conf,
                    "location_method": prop_method
                },
                "location_method": prop_method,
                "location_confidence": prop_conf,
                "reason": res.reason,
                "ambiguity_warning": ambiguity_warning,
                "changed": changed
            }
            records_log.append(rec_entry)

            if changed:
                if has_new_cols:
                    updates_to_apply.append((
                        prop_name, prop_lat, prop_lon,
                        prop_scope, prop_gov, prop_deleg,
                        prop_loc, prop_conf, prop_method,
                        ev_id
                    ))
                else:
                    updates_to_apply.append((prop_name, prop_lat, prop_lon, ev_id))

        mutations_planned = len(updates_to_apply)
        mutations_applied = 0

        if apply and updates_to_apply:
            conn.execute("BEGIN IMMEDIATE")
            if has_new_cols:
                cursor.executemany("""
                    UPDATE evidence
                    SET location = ?, latitude = ?, longitude = ?,
                        location_scope = ?, governorate = ?, delegation = ?,
                        locality = ?, location_confidence = ?, location_method = ?
                    WHERE id = ?
                """, updates_to_apply)
            else:
                cursor.executemany("""
                    UPDATE evidence
                    SET location = ?, latitude = ?, longitude = ?
                    WHERE id = ?
                """, updates_to_apply)
            conn.commit()
            mutations_applied = len(updates_to_apply)

    except Exception as e:
        if apply:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    finally:
        conn.close()

    db_sha256_after = compute_file_sha256(target_db)

    report = {
        "enrichment_timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": "APPLY" if apply else "DRY_RUN",
        "mode_label": "APPLY (Committed to Database)" if apply else "DRY-RUN (Simulated - Zero Database Writes)",
        "database_path": os.path.abspath(target_db),
        "database_sha256_before": db_sha256_before,
        "database_sha256_after": db_sha256_after,
        "database_unchanged": (db_sha256_before == db_sha256_after),
        "records_scanned": len(active_rows),
        "matched_locations": with_coords_count,
        "coordinates_added": mutations_applied,
        "ambiguous": counts_proposed.get("MULTI_GOVERNORATE", 0),
        "unresolved": counts_proposed.get("UNRESOLVED", 0),
        "errors": 0,
        "counts": {
            "total_ev_auto_in_db": total_ev_auto,
            "active_records_scanned": len(active_rows),
            "rejected_records_skipped": rejected_skipped_count,
            "proposed_distribution": counts_proposed,
            "records_with_governorate": with_gov_count,
            "records_with_delegation": with_deleg_count,
            "records_with_locality": with_locality_count,
            "records_with_coordinates": with_coords_count,
            "records_with_confidence_gt_0": with_conf_count,
            "records_completely_unresolved": counts_proposed["UNRESOLVED"],
            "mutations_planned": mutations_planned,
            "mutations_applied": mutations_applied
        },
        "records": records_log
    }

    if log_out:
        out_path = os.path.abspath(log_out)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

    return report


def print_enrichment_report(report: Dict[str, Any]) -> None:
    """Prints a formatted human-readable report."""
    counts = report["counts"]
    dist = counts["proposed_distribution"]
    print("==========================================================================================")
    print("                 404TN GEOLOCATION ENRICHMENT REPORT (PHASE 4.1)")
    print("==========================================================================================")
    print(f"Database   : {report['database_path']}")
    print(f"Timestamp  : {report['enrichment_timestamp']}")
    print(f"Mode       : {report['mode_label']}")
    print(f"SHA256 In  : {report['database_sha256_before']}")
    print(f"SHA256 Out : {report['database_sha256_after']} (Unchanged: {report['database_unchanged']})")
    print("------------------------------------------------------------------------------------------")
    print(f"POPULATION SUMMARY:")
    print(f"  * Total EV-AUTO in DB       : {counts['total_ev_auto_in_db']:>4}")
    print(f"  * Active Records Scanned    : {counts['active_records_scanned']:>4}")
    print(f"  * Rejected Records Skipped  : {counts['rejected_records_skipped']:>4} (Excluded from enrichment)")
    print("------------------------------------------------------------------------------------------")
    print(f"PROPOSED LOCATION DISTRIBUTION (Active Records):")
    print(f"  * LOCAL (Locality/Delegation) : {dist.get('LOCAL', 0):>4}")
    print(f"  * GOVERNORATE (Centroid)      : {dist.get('GOVERNORATE', 0):>4}")
    print(f"  * MULTI_GOVERNORATE (No Coords: {dist.get('MULTI_GOVERNORATE', 0):>4}")
    print(f"  * NATIONAL (No Coords)        : {dist.get('NATIONAL', 0):>4}")
    print(f"  * UNRESOLVED (No Coords)      : {dist.get('UNRESOLVED', 0):>4}")
    print("------------------------------------------------------------------------------------------")
    print(f"GEOSPATIAL METRICS:")
    print(f"  * Records with Governorate    : {counts['records_with_governorate']:>4}")
    print(f"  * Records with Delegation     : {counts['records_with_delegation']:>4}")
    print(f"  * Records with Coordinates    : {counts['records_with_coordinates']:>4}")
    print(f"  * Records with Confidence > 0 : {counts['records_with_confidence_gt_0']:>4}")
    print(f"  * Completely Unresolved       : {counts['records_completely_unresolved']:>4}")
    print("------------------------------------------------------------------------------------------")
    print(f"MUTATIONS SUMMARY:")
    print(f"  * Mutations Planned           : {counts['mutations_planned']:>4}")
    print(f"  * Mutations Applied           : {counts['mutations_applied']:>4}")
    print("==========================================================================================\n")


def main():
    parser = argparse.ArgumentParser(
        description="404TN Evidence Location Enrichment Pipeline",
        epilog="By default, this tool runs in DRY-RUN mode and never modifies the database without --apply and --confirm."
    )
    parser.add_argument("--db", type=str, default=None, help="Custom SQLite DB path (default: DB_PATH)")
    parser.add_argument("--apply", action="store_true", default=False, help="Execute write mutations in transaction")
    parser.add_argument("--confirm", type=str, default=None, help=f"Required confirmation token: {REQUIRED_CONFIRM_TOKEN}")
    parser.add_argument("--log-out", type=str, default=None, help="Path to save machine-readable JSON enrichment report")

    args = parser.parse_args()

    try:
        report = enrich_evidence(
            apply=args.apply,
            db_path=args.db,
            confirm_token=args.confirm if args.apply else REQUIRED_CONFIRM_TOKEN,
            log_out=args.log_out
        )
        print_enrichment_report(report)

        if args.log_out:
            print(f"[INFO] Machine-readable enrichment report saved to: {os.path.abspath(args.log_out)}")

    except EnrichmentValidationError as e:
        print(f"[SAFETY ERROR] Enrichment validation failed closed: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Enrichment execution failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
