# monitor/scripts/audit_production_geolocation.py
"""
404TN — Production Geolocation Audit & Diagnostic Tool (Phase 4.1)

Performs a 100% READ-ONLY diagnostic audit of active EV-AUTO-* evidence records.
Verifies location scope resolution, coordinate assignments, dialectal variants,
false-positive risks, and structural invariants without modifying the database.

INVARIANTS:
1. Pure READ-ONLY operation (opens SQLite in URI mode 'mode=ro').
2. Operates strictly on active evidence (ingestion_status = 'AUTO_ACCEPTED' or NULL).
3. Completely excludes REJECTED records (reports rejected_rows_considered = 0).
4. Enforces coordinate invariants:
   - NATIONAL -> coords NULL, gov NULL
   - MULTI_GOVERNORATE -> coords NULL, gov NULL
   - UNRESOLVED -> coords NULL, gov NULL, conf 0.0
   - LOCAL / GOVERNORATE -> valid coordinate pair
5. Computes database SHA256 before and after to verify zero disk mutation.
6. Machine-readable JSON export (--json-out).
"""

import sys
import os
import re
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


# False-positive risk indicators
BOILERPLATE_PATTERNS = [
    r"\b(siege\s+social|contact@|redaction@|editeur|directeur\s+de\s+la\s+publication|mentions\s+legales)\b",
    r"\b(rue\s+|avenue\s+|boulevard\s+|bp\s+\d+|code\s+postal|tunis\s+belvedere)\b",
    r"\b(telephone|fax\s*:\s*\+?216|contactez-nous|tous\s+droits\s+reserves)\b"
]

MINISTRY_HQ_PATTERNS = [
    r"\b(ministere|ministere\s+de|siege\s+du\s+gouvernement|la\s+kasbah|palais\s+de\s+carthage)\b",
    r"\b(وزارة|مقر\s+الحكومة|القصبة|قصر\s+قرطاج)\b"
]


def compute_file_sha256(file_path: str) -> str:
    """Calculates SHA256 checksum of a file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def detect_false_positive_risk(headline: str, summary: str, source_name: str, res: ResolvedLocation) -> Optional[str]:
    """
    Checks if a local/regional match might stem from publisher boilerplate,
    ministry headquarters context, or contact info rather than the event location.
    """
    combined = f"{headline} {summary}".lower()
    
    # Check 1: Boilerplate / contact info in text
    for pat in BOILERPLATE_PATTERNS:
        if re.search(pat, combined, flags=re.IGNORECASE):
            return f"Contains publisher/contact boilerplate pattern: {pat}"

    # Check 2: Ministry HQ location attribution risk
    if res.governorate == "Tunis" and res.scope in ["LOCAL", "GOVERNORATE"]:
        for pat in MINISTRY_HQ_PATTERNS:
            if re.search(pat, combined, flags=re.IGNORECASE):
                return "Location match (Tunis) appears in central government / ministry headquarters context."

    # Check 3: Low confidence regional match
    if res.location_confidence > 0 and res.location_confidence < 0.85:
        return f"Borderline location confidence ({res.location_confidence:.2f})."

    return None


def audit_production_geolocation(
    db_path: Optional[str] = None,
    json_out: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes a read-only audit of evidence geolocation across active records in the database.
    """
    target_db = db_path or DB_PATH
    if not os.path.exists(target_db):
        raise FileNotFoundError(f"Database file not found: {target_db}")

    sha256_before = compute_file_sha256(target_db)

    # Open strictly in read-only mode
    uri_path = f"file:{os.path.abspath(target_db)}?mode=ro"
    conn = sqlite3.connect(uri_path, uri=True)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # Check available columns
        cursor.execute("PRAGMA table_info(evidence)")
        cols = {r["name"] for r in cursor.fetchall()}
        has_new_cols = "location_scope" in cols

        # Query total EV-AUTO records in DB
        cursor.execute("SELECT COUNT(*) FROM evidence WHERE id LIKE 'EV-AUTO-%'")
        total_ev_auto = cursor.fetchone()[0]

        # Query REJECTED records in DB
        cursor.execute("SELECT COUNT(*) FROM evidence WHERE id LIKE 'EV-AUTO-%' AND ingestion_status = 'REJECTED'")
        rejected_rows_in_db = cursor.fetchone()[0]

        # Query strictly active records
        cursor.execute("""
            SELECT * FROM evidence
            WHERE id LIKE 'EV-AUTO-%' AND (ingestion_status = 'AUTO_ACCEPTED' OR ingestion_status IS NULL)
            ORDER BY id
        """)
        active_rows = [dict(r) for r in cursor.fetchall()]

    finally:
        conn.close()

    sha256_after = compute_file_sha256(target_db)

    # Process and evaluate each active record
    audited_records: List[Dict[str, Any]] = []

    proposed_distribution = {
        "LOCAL": 0,
        "GOVERNORATE": 0,
        "MULTI_GOVERNORATE": 0,
        "NATIONAL": 0,
        "UNRESOLVED": 0
    }

    coordinate_bearing_count = 0
    records_with_gov = 0
    records_with_deleg = 0
    records_with_loc = 0
    records_with_coords = 0
    mutations_required_count = 0

    for r in active_rows:
        ev_id = r["id"]
        headline = r.get("headline") or ""
        summary = r.get("summary") or ""
        issue = r.get("issue")
        source_name = r.get("source_name") or "Unknown"
        source_domain = r.get("source_domain")
        source_url = r.get("source_url") or ""

        # Run resolution engine
        res: ResolvedLocation = resolve_location_advanced(
            f"{headline} {summary}",
            headline=headline,
            summary=summary,
            source_domain=source_domain
        )

        # Proposed values & invariant enforcement
        prop_scope = res.scope
        prop_gov = res.governorate
        prop_deleg = res.delegation
        prop_loc = res.locality
        prop_lat = res.latitude
        prop_lon = res.longitude
        prop_conf = res.location_confidence
        prop_method = res.location_method
        prop_name = res.canonical_name

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

        # Tally metrics
        proposed_distribution[prop_scope] = proposed_distribution.get(prop_scope, 0) + 1

        if prop_lat is not None and prop_lon is not None:
            coordinate_bearing_count += 1
            records_with_coords += 1
        if prop_gov is not None:
            records_with_gov += 1
        if prop_deleg is not None:
            records_with_deleg += 1
        if prop_loc is not None:
            records_with_loc += 1

        # Current DB values
        curr_location = r.get("location")
        curr_scope = r.get("location_scope")
        curr_gov = r.get("governorate")
        curr_deleg = r.get("delegation")
        curr_loc = r.get("locality")
        curr_lat = r.get("latitude")
        curr_lon = r.get("longitude")
        curr_conf = r.get("location_confidence")
        curr_method = r.get("location_method")

        # Determine if mutation is required
        mutation_required = (
            curr_location != prop_name or
            curr_scope != prop_scope or
            curr_gov != prop_gov or
            curr_deleg != prop_deleg or
            curr_loc != prop_loc or
            curr_lat != prop_lat or
            curr_lon != prop_lon or
            curr_conf != prop_conf or
            curr_method != prop_method
        )
        if mutation_required:
            mutations_required_count += 1

        # Ambiguity and false-positive checks
        ambiguity_warning = None
        if prop_scope == "MULTI_GOVERNORATE":
            ambiguity_warning = "Multiple distinct governorates referenced; scope set to MULTI_GOVERNORATE without single coordinate pair."
        elif prop_conf > 0 and prop_conf < 0.85:
            ambiguity_warning = f"Lower location confidence score ({prop_conf:.2f})."

        fp_risk = detect_false_positive_risk(headline, summary, source_name, res)

        rec_entry = {
            "id": ev_id,
            "issue": issue,
            "headline": headline,
            "source_name": source_name,
            "source_url": source_url,
            "current_location": curr_location,
            "current_location_scope": curr_scope,
            "current_governorate": curr_gov,
            "current_delegation": curr_deleg,
            "current_locality": curr_loc,
            "current_latitude": curr_lat,
            "current_longitude": curr_lon,
            "proposed_location": prop_name,
            "proposed_location_scope": prop_scope,
            "proposed_governorate": prop_gov,
            "proposed_delegation": prop_deleg,
            "proposed_locality": prop_loc,
            "proposed_latitude": prop_lat,
            "proposed_longitude": prop_lon,
            "proposed_location_confidence": prop_conf,
            "proposed_location_method": prop_method,
            "exact_matched_phrase": res.matched_phrase,
            "exact_evidence_context": res.evidence_context,
            "decision_reason": res.reason,
            "ambiguity_warning": ambiguity_warning,
            "false_positive_risk_flag": fp_risk,
            "mutation_required": mutation_required
        }
        audited_records.append(rec_entry)

    # Invariant assertions
    assert sum(proposed_distribution.values()) == len(active_rows), "Proposed distribution sum must equal active records count"

    report = {
        "audit_timestamp": datetime.now(timezone.utc).isoformat(),
        "database_path": os.path.abspath(target_db),
        "database_sha256_before": sha256_before,
        "database_sha256_after": sha256_after,
        "database_unchanged": (sha256_before == sha256_after),
        "mode": "READ_ONLY_AUDIT",
        "summary": {
            "total_ev_auto_in_db": total_ev_auto,
            "total_active_records": len(active_rows),
            "rejected_rows_in_db": rejected_rows_in_db,
            "rejected_rows_considered": 0,
            "coordinate_bearing_records": coordinate_bearing_count,
            "records_with_governorate": records_with_gov,
            "records_with_delegation": records_with_deleg,
            "records_with_locality": records_with_loc,
            "records_with_coordinates": records_with_coords,
            "records_remaining_unresolved": proposed_distribution["UNRESOLVED"],
            "records_national": proposed_distribution["NATIONAL"],
            "records_multi_governorate": proposed_distribution["MULTI_GOVERNORATE"],
            "mutations_required": mutations_required_count,
            "proposed_distribution": proposed_distribution
        },
        "records": audited_records
    }

    if json_out:
        out_path = os.path.abspath(json_out)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

    return report


def print_audit_report(report: Dict[str, Any]) -> None:
    """Prints a formatted human-readable summary of the audit report."""
    s = report["summary"]
    dist = s["proposed_distribution"]

    print("==========================================================================================")
    print("                 404TN PRODUCTION GEOLOCATION AUDIT REPORT (PHASE 4.1)")
    print("==========================================================================================")
    print(f"Database   : {report['database_path']}")
    print(f"Timestamp  : {report['audit_timestamp']}")
    print(f"Mode       : READ-ONLY AUDIT (Zero Database Writes)")
    print(f"SHA256 In  : {report['database_sha256_before']}")
    print(f"SHA256 Out : {report['database_sha256_after']} (Unchanged: {report['database_unchanged']})")
    print("------------------------------------------------------------------------------------------")
    print("DATASET METRICS:")
    print(f"  * Total EV-AUTO in DB             : {s['total_ev_auto_in_db']:>4}")
    print(f"  * Total Active Records Audited    : {s['total_active_records']:>4} (ingestion_status = 'AUTO_ACCEPTED')")
    print(f"  * Rejected Records in DB          : {s['rejected_rows_in_db']:>4} (ingestion_status = 'REJECTED')")
    print(f"  * Rejected Records Considered     : {s['rejected_rows_considered']:>4} (Excluded from audit/enrichment)")
    print("------------------------------------------------------------------------------------------")
    print("PROPOSED LOCATION SCOPE DISTRIBUTION (Active Records):")
    print(f"  * LOCAL (Locality / Delegation)   : {dist.get('LOCAL', 0):>4}")
    print(f"  * GOVERNORATE (Centroid)          : {dist.get('GOVERNORATE', 0):>4}")
    print(f"  * MULTI_GOVERNORATE (No Coords)   : {dist.get('MULTI_GOVERNORATE', 0):>4}")
    print(f"  * NATIONAL (No Coords)            : {dist.get('NATIONAL', 0):>4}")
    print(f"  * UNRESOLVED (No Coords)          : {dist.get('UNRESOLVED', 0):>4}")
    print(f"  -------------------------------------------")
    print(f"  * SUM OF SCOPES (Must equal {s['total_active_records']})  : {sum(dist.values()):>4}")
    print("------------------------------------------------------------------------------------------")
    print("SPATIAL ATTRIBUTION METRICS:")
    print(f"  * Coordinate-Bearing Records      : {s['coordinate_bearing_records']:>4} (LOCAL + GOVERNORATE)")
    print(f"  * Records with Governorate        : {s['records_with_governorate']:>4}")
    print(f"  * Records with Delegation         : {s['records_with_delegation']:>4}")
    print(f"  * Records with Locality           : {s['records_with_locality']:>4}")
    print(f"  * Records Remaining Unresolved    : {s['records_remaining_unresolved']:>4}")
    print(f"  * Records Classified National     : {s['records_national']:>4}")
    print(f"  * Records Multi-Governorate       : {s['records_multi_governorate']:>4}")
    print(f"  * Mutations Required              : {s['mutations_required']:>4}")
    print("==========================================================================================\n")


def main():
    parser = argparse.ArgumentParser(
        description="404TN Production Geolocation Audit Tool (Read-Only)",
        epilog="This tool is strictly read-only and never performs database writes."
    )
    parser.add_argument("--db", type=str, default=None, help="Custom SQLite DB path (default: DB_PATH)")
    parser.add_argument("--json-out", type=str, default=None, help="Path to save machine-readable JSON audit output")

    args = parser.parse_args()

    try:
        report = audit_production_geolocation(
            db_path=args.db,
            json_out=args.json_out
        )
        print_audit_report(report)

        if args.json_out:
            print(f"[INFO] Audit JSON report saved to: {os.path.abspath(args.json_out)}")

    except Exception as e:
        print(f"[ERROR] Audit failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
