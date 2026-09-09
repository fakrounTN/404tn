# monitor/scripts/cleanup_legacy_evidence.py
"""
404TN — Production-Safe Legacy Evidence Cleanup Tool

Consumes an authoritative audit JSON produced by audit_legacy_evidence.py
and safely prepares / updates legacy EV-AUTO-* records in the database.

STRICT SAFETY CONTROLS:
- DRY-RUN by default (zero database writes without --apply and --confirm).
- Atomic transaction (BEGIN IMMEDIATE / COMMIT / ROLLBACK on any failure).
- Restricted strictly to EV-AUTO-* records.
- Stale-audit detection and fail-closed validation.
- Zero row deletions (NO hard DELETE SQL anywhere in script).
- Incapable of mutating REVIEW_REQUIRED records.
- Preserves full provenance and all other evidence fields.
- Detailed machine-readable and human-readable audit log.
"""

import os
import sys
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


VALID_AUDIT_ACTIONS = {"KEEP", "RECLASSIFY", "EXCLUDE", "REVIEW_REQUIRED"}
REQUIRED_CONFIRM_TOKEN = "APPLY-V4-LEGACY-CLEANUP"


class CleanupValidationError(Exception):
    """Raised when stale-audit checks or plan validation fail closed."""
    pass


def compute_file_sha256(file_path: str) -> str:
    """Calculates SHA256 checksum of a file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def load_and_validate_audit_json(audit_path: str) -> Dict[str, Any]:
    """Loads and validates structure of the input audit JSON."""
    if not os.path.exists(audit_path):
        raise CleanupValidationError(f"Audit file not found: '{audit_path}'")

    try:
        with open(audit_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        raise CleanupValidationError(f"Malformed or invalid audit JSON: {e}")

    if not isinstance(data, dict):
        raise CleanupValidationError("Audit JSON root must be an object/dict")

    if "records" not in data or not isinstance(data["records"], list):
        raise CleanupValidationError("Audit JSON missing 'records' list")

    return data


def validate_cleanup_plan(
    audit_data: Dict[str, Any],
    conn: sqlite3.Connection,
    is_apply: bool = False,
    strict_population_check: bool = False
) -> Dict[str, Any]:
    """
    Validates audit payload against live database state.
    Fails closed on any inconsistency.
    """
    records = audit_data["records"]
    seen_ids = set()
    audit_ids: List[str] = []
    plan_entries: List[Dict[str, Any]] = []

    # Get all EV-AUTO record IDs from DB
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM evidence WHERE id LIKE 'EV-AUTO-%'")
    db_ev_auto_ids = set(row[0] for row in cursor.fetchall())
    db_total_ev_auto = len(db_ev_auto_ids)

    # 1. Check basic structure and non-EV-AUTO presence
    for idx, rec in enumerate(records):
        if not isinstance(rec, dict):
            raise CleanupValidationError(f"Record at index {idx} is not an object")

        rec_id = rec.get("id")
        if not rec_id or not isinstance(rec_id, str):
            raise CleanupValidationError(f"Record at index {idx} missing valid 'id'")

        if not rec_id.startswith("EV-AUTO-"):
            raise CleanupValidationError(
                f"Non-EV-AUTO record detected: '{rec_id}'. Cleanup tool is strictly restricted to EV-AUTO records."
            )

        if rec_id in seen_ids:
            raise CleanupValidationError(f"Duplicate record ID found in audit JSON: '{rec_id}'")
        seen_ids.add(rec_id)
        audit_ids.append(rec_id)

    audit_id_set = set(audit_ids)

    # 2. Mandatory exact population / ID-set check for APPLY (or when requested in dry-run)
    if is_apply or strict_population_check:
        if audit_id_set != db_ev_auto_ids:
            missing_in_audit = db_ev_auto_ids - audit_id_set
            extra_in_audit = audit_id_set - db_ev_auto_ids
            err_msg = (
                f"Exact population mismatch: DB EV-AUTO ID set does not match Audit ID set. "
                f"(DB total: {len(db_ev_auto_ids)}, Audit total: {len(audit_id_set)}). "
            )
            if missing_in_audit:
                err_msg += f"Missing in audit: {len(missing_in_audit)} IDs (e.g. {sorted(missing_in_audit)[:3]}). "
            if extra_in_audit:
                err_msg += f"Extra in audit / missing from DB: {len(extra_in_audit)} IDs (e.g. {sorted(extra_in_audit)[:3]})."
            raise CleanupValidationError(err_msg.strip())

    # 3. Validate each individual record
    for idx, rec in enumerate(records):
        rec_id = rec["id"]

        action = (rec.get("action") or rec.get("decision") or "").upper()
        if action not in VALID_AUDIT_ACTIONS:
            raise CleanupValidationError(
                f"Invalid audit action '{action}' for record '{rec_id}'. Must be one of {VALID_AUDIT_ACTIONS}"
            )

        # Fetch live row from DB
        cursor.execute(
            """SELECT id, issue, headline, summary, source_name, source_domain, source_url,
                      ingestion_status, classification_confidence, classification_reason 
               FROM evidence WHERE id = ?""",
            (rec_id,)
        )
        row = cursor.fetchone()
        if not row:
            raise CleanupValidationError(f"Target record '{rec_id}' does not exist in database.")

        db_issue = row["issue"]
        db_status = row["ingestion_status"] or "AUTO_ACCEPTED"
        proposed_issue = rec.get("proposed_issue")
        confidence = float(rec.get("confidence", 0.0))
        reason = rec.get("reason", "")

        # Stable identity checks (when present in audit)
        audit_headline = rec.get("headline")
        if audit_headline and row["headline"] and audit_headline.strip() != row["headline"].strip():
            raise CleanupValidationError(
                f"Stale audit data for '{rec_id}': headline mismatch. "
                f"DB: '{row['headline']}', Audit: '{audit_headline}'."
            )

        audit_source = rec.get("source_name")
        if audit_source and row["source_name"] and audit_source.strip() != row["source_name"].strip():
            raise CleanupValidationError(
                f"Stale audit data for '{rec_id}': source_name mismatch. "
                f"DB: '{row['source_name']}', Audit: '{audit_source}'."
            )

        audit_domain = rec.get("source_domain")
        if audit_domain and row["source_domain"] and audit_domain.strip() != row["source_domain"].strip():
            raise CleanupValidationError(
                f"Stale audit data for '{rec_id}': source_domain mismatch. "
                f"DB: '{row['source_domain']}', Audit: '{audit_domain}'."
            )

        audit_url = rec.get("source_url")
        if audit_url and row["source_url"] and audit_url.strip() != row["source_url"].strip():
            raise CleanupValidationError(
                f"Stale audit data for '{rec_id}': source_url mismatch. "
                f"DB: '{row['source_url']}', Audit: '{audit_url}'."
            )

        # Stale-audit check: current issue in DB must match audit's current_issue (accounting for canonical aliases)
        raw_audit_issue = rec.get("raw_current_issue")
        curr_audit_issue = rec.get("current_issue")
        norm_db = normalize_issue(db_issue)

        matches = False
        if raw_audit_issue and (db_issue == raw_audit_issue or norm_db == normalize_issue(raw_audit_issue)):
            matches = True
        elif curr_audit_issue and (db_issue == curr_audit_issue or norm_db == normalize_issue(curr_audit_issue)):
            matches = True
        elif not raw_audit_issue and not curr_audit_issue:
            matches = True

        if not matches:
            raise CleanupValidationError(
                f"Stale audit data for '{rec_id}': DB issue is '{db_issue}', but audit expects '{curr_audit_issue or raw_audit_issue}'."
            )

        # Action-specific validation
        mutation_type = "NONE"
        new_issue = db_issue
        new_status = db_status

        if action == "KEEP":
            mutation_type = "NONE"
        elif action == "REVIEW_REQUIRED":
            mutation_type = "NONE"
        elif action == "RECLASSIFY":
            if not proposed_issue or proposed_issue not in CANONICAL_ISSUES:
                raise CleanupValidationError(
                    f"Invalid proposed issue '{proposed_issue}' for RECLASSIFY on '{rec_id}'. Must be canonical: {CANONICAL_ISSUES}"
                )
            if confidence < 0.70:
                raise CleanupValidationError(
                    f"Refusing automatic RECLASSIFY for '{rec_id}': confidence {confidence:.2f} is below 0.70 threshold."
                )
            mutation_type = "UPDATE_ISSUE"
            new_issue = proposed_issue
        elif action == "EXCLUDE":
            mutation_type = "UPDATE_STATUS_REJECTED"
            new_status = "REJECTED"

        plan_entries.append({
            "id": rec_id,
            "action": action,
            "mutation_type": mutation_type,
            "old_issue": db_issue,
            "new_issue": new_issue,
            "old_ingestion_status": db_status,
            "new_ingestion_status": new_status,
            "confidence": confidence,
            "reason": reason,
            "headline": row["headline"],
            "source_domain": row["source_domain"]
        })

    summary = {
        "total_audited": len(plan_entries),
        "db_total_ev_auto": db_total_ev_auto,
        "KEEP": sum(1 for e in plan_entries if e["action"] == "KEEP"),
        "RECLASSIFY": sum(1 for e in plan_entries if e["action"] == "RECLASSIFY"),
        "EXCLUDE": sum(1 for e in plan_entries if e["action"] == "EXCLUDE"),
        "REVIEW_REQUIRED": sum(1 for e in plan_entries if e["action"] == "REVIEW_REQUIRED"),
        "mutations_planned": sum(1 for e in plan_entries if e["mutation_type"] != "NONE")
    }

    return {
        "audit_timestamp": audit_data.get("timestamp"),
        "summary": summary,
        "plan": plan_entries
    }


def execute_cleanup(
    db_path: str,
    audit_path: str,
    apply: bool = False,
    confirm_token: Optional[str] = None,
    strict_population_check: bool = False
) -> Dict[str, Any]:
    """
    Executes or simulates the cleanup workflow.
    In apply mode, all mutations run inside a BEGIN IMMEDIATE transaction.
    """
    if apply and confirm_token != REQUIRED_CONFIRM_TOKEN:
        raise CleanupValidationError(
            f"Safety error: --apply requires --confirm {REQUIRED_CONFIRM_TOKEN}. Got '{confirm_token}'."
        )

    audit_data = load_and_validate_audit_json(audit_path)

    if not os.path.exists(db_path):
        raise CleanupValidationError(f"Database file not found: '{db_path}'")

    db_sha256_before = compute_file_sha256(db_path)

    # Open connection
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    try:
        # Phase 1: Validate entire plan first (read-only queries)
        validated_plan = validate_cleanup_plan(
            audit_data,
            conn,
            is_apply=apply,
            strict_population_check=strict_population_check
        )
        plan_entries = validated_plan["plan"]

        mutations_applied = 0
        execution_log: List[Dict[str, Any]] = []

        if not apply:
            # DRY RUN: Zero database modifications
            mode_label = "DRY-RUN (Simulated - Zero Database Writes)"
            for entry in plan_entries:
                log_item = dict(entry)
                log_item["result"] = "SIMULATED_NO_OP" if entry["mutation_type"] == "NONE" else "SIMULATED_MUTATION"
                execution_log.append(log_item)
        else:
            # APPLY MODE: Transaction-wrapped atomic write
            mode_label = "APPLY (Committed to Database)"
            conn.execute("BEGIN IMMEDIATE")
            cursor = conn.cursor()

            for entry in plan_entries:
                rec_id = entry["id"]
                m_type = entry["mutation_type"]
                log_item = dict(entry)

                if m_type == "UPDATE_ISSUE":
                    cursor.execute(
                        """UPDATE evidence
                           SET issue = ?
                           WHERE id = ?""",
                        (entry["new_issue"], rec_id)
                    )
                    mutations_applied += 1
                    log_item["result"] = "APPLIED_RECLASSIFY"
                elif m_type == "UPDATE_STATUS_REJECTED":
                    cursor.execute(
                        """UPDATE evidence
                           SET ingestion_status = 'REJECTED'
                           WHERE id = ?""",
                        (rec_id,)
                    )
                    mutations_applied += 1
                    log_item["result"] = "APPLIED_EXCLUDE"
                else:
                    log_item["result"] = "PRESERVED_NO_OP"

                execution_log.append(log_item)

            conn.commit()

    except Exception as e:
        if apply:
            try:
                conn.rollback()
            except Exception:
                pass
        raise
    finally:
        conn.close()

    db_sha256_after = compute_file_sha256(db_path)

    cleanup_report = {
        "cleanup_timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": "APPLY" if apply else "DRY_RUN",
        "mode_label": mode_label,
        "database_path": os.path.abspath(db_path),
        "database_sha256_before": db_sha256_before,
        "database_sha256_after": db_sha256_after,
        "database_unchanged": (db_sha256_before == db_sha256_after),
        "audit_source_path": os.path.abspath(audit_path),
        "audit_timestamp": validated_plan["audit_timestamp"],
        "summary": validated_plan["summary"],
        "mutations_executed": mutations_applied,
        "records": execution_log
    }

    return cleanup_report


def print_cleanup_report(report: Dict[str, Any]) -> None:
    """Formats and prints human-readable cleanup execution report."""
    summary = report["summary"]
    total = summary["total_audited"]

    print("==========================================================================================")
    print("                      404TN LEGACY EVIDENCE CLEANUP REPORT")
    print("==========================================================================================")
    print(f"Database   : {report['database_path']}")
    print(f"Audit Path : {report['audit_source_path']}")
    print(f"Timestamp  : {report['cleanup_timestamp']}")
    print(f"Mode       : {report['mode_label']}")
    print(f"SHA256 In  : {report['database_sha256_before']}")
    print(f"SHA256 Out : {report['database_sha256_after']} (Unchanged: {report['database_unchanged']})")
    print("------------------------------------------------------------------------------------------")
    print(f"TOTAL AUDITED RECORDS : {total}")
    print(f"  * KEEP (No Op)      : {summary['KEEP']:>4}")
    print(f"  * RECLASSIFY        : {summary['RECLASSIFY']:>4}")
    print(f"  * EXCLUDE (Reject)  : {summary['EXCLUDE']:>4}")
    print(f"  * REVIEW_REQUIRED   : {summary['REVIEW_REQUIRED']:>4} (Zero Automatic Mutations)")
    print(f"  * TOTAL MUTATIONS   : {report['mutations_executed']:>4}")
    print("------------------------------------------------------------------------------------------\n")

    mutations = [r for r in report["records"] if r.get("mutation_type") != "NONE"]
    if mutations:
        print(f"--- MUTATION DETAILS ({len(mutations)} records) ---\n")
        for m in mutations:
            print(f"[{m['action']}] {m['id']} -> {m['result']}")
            if m["mutation_type"] == "UPDATE_ISSUE":
                print(f"  Issue Change   : '{m['old_issue']}' -> '{m['new_issue']}' (Confidence: {m['confidence']:.2f})")
            elif m["mutation_type"] == "UPDATE_STATUS_REJECTED":
                print(f"  Status Change  : '{m['old_ingestion_status']}' -> '{m['new_ingestion_status']}'")
            print(f"  Reason         : {m['reason']}")
            print(f"  Headline       : {m['headline']}\n")

    print("==========================================================================================")
    print("CLEANUP RUN FINISHED")
    print("==========================================================================================")


def main():
    parser = argparse.ArgumentParser(
        description="404TN Legacy Evidence Cleanup Tool",
        epilog="By default, this tool runs in DRY-RUN mode and never modifies the database without --apply and --confirm."
    )
    parser.add_argument("--db", type=str, required=True, help="Path to SQLite database to clean")
    parser.add_argument("--audit", type=str, required=True, help="Path to approved audit JSON report")
    parser.add_argument("--apply", action="store_true", default=False, help="Execute write mutations in transaction")
    parser.add_argument("--confirm", type=str, default=None, help=f"Required confirmation token: {REQUIRED_CONFIRM_TOKEN}")
    parser.add_argument("--strict-population", action="store_true", default=False, help="Require exact audit-to-DB count match")
    parser.add_argument("--log-out", type=str, default=None, help="Path to save machine-readable JSON cleanup report")

    args = parser.parse_args()

    try:
        report = execute_cleanup(
            db_path=args.db,
            audit_path=args.audit,
            apply=args.apply,
            confirm_token=args.confirm,
            strict_population_check=args.strict_population
        )
        print_cleanup_report(report)

        if args.log_out:
            out_path = os.path.abspath(args.log_out)
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            print(f"\n[INFO] Machine-readable cleanup log saved to: {out_path}")

    except CleanupValidationError as e:
        print(f"[SAFETY ERROR] Cleanup validation failed closed: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Cleanup execution failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
