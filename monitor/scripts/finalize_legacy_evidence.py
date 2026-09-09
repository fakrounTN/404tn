# monitor/scripts/finalize_legacy_evidence.py
"""
404TN — Production-Safe Legacy Evidence Finalization Tool

Performs final manual resolution of 13 previously REVIEW_REQUIRED legacy EV-AUTO-* records,
plus normalization of remaining active legacy issue aliases (institutions, economy, gabes).

STRICT SAFETY INVARIANTS:
1. DRY-RUN by default (zero database writes without --apply and --confirm).
2. Explicit confirmation required: --confirm APPLY-LEGACY-FINALIZATION-V1.
3. Atomic transaction (BEGIN IMMEDIATE / COMMIT / ROLLBACK on any failure).
4. Pre-validation of all 13 expected record IDs, current issues, and ingestion statuses.
5. Reclassification modifies strictly and exclusively the 'issue' column.
6. Rejection modifies strictly and exclusively the 'ingestion_status' column ('REJECTED').
7. KEEP produces zero mutations.
8. Alias normalization affects ONLY records with ingestion_status = 'AUTO_ACCEPTED'.
9. REJECTED records are never modified by alias normalization.
10. 'general' is NEVER globally normalized.
11. Zero row deletions (NO DELETE SQL in script).
12. Dynamic calculation of alias rows (no hardcoded counts).
13. Machine-readable JSON execution report (--log-out).
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

REQUIRED_CONFIRM_TOKEN = "APPLY-LEGACY-FINALIZATION-V1"

# Approved decisions for the 13 review records
APPROVED_REVIEW_DECISIONS: Dict[str, Dict[str, Any]] = {
    # RECLASSIFY (6 records)
    "EV-AUTO-20260909-1731ED": {
        "action": "RECLASSIFY",
        "expected_issue": "general",
        "target_issue": "rights",
        "description": "Prison conditions and detention rights"
    },
    "EV-AUTO-20260909-A92907": {
        "action": "RECLASSIFY",
        "expected_issue": "general",
        "target_issue": "work",
        "description": "Employment and labor indicators"
    },
    "EV-AUTO-20260909-EF7FD1": {
        "action": "RECLASSIFY",
        "expected_issue": "institutions",
        "target_issue": "rights",
        "description": "Institutional governance / rights"
    },
    "EV-AUTO-20260909-F33A9C": {
        "action": "RECLASSIFY",
        "expected_issue": "general",
        "target_issue": "rights",
        "description": "Judicial independence / rights"
    },
    "EV-AUTO-20260909-F483FF": {
        "action": "RECLASSIFY",
        "expected_issue": "general",
        "target_issue": "rights",
        "description": "Legal proceedings / rights"
    },
    "EV-AUTO-20260909-FDE205": {
        "action": "RECLASSIFY",
        "expected_issue": "general",
        "target_issue": "rights",
        "description": "Civil rights and liberties"
    },
    # KEEP (1 record)
    "EV-AUTO-20260909-D9AD3A": {
        "action": "KEEP",
        "expected_issue": "work",
        "target_issue": "work",
        "description": "Keep current work taxonomy"
    },
    # REJECT (6 records)
    "EV-AUTO-20260909-371D43": {
        "action": "REJECT",
        "expected_issue": "general",
        "target_issue": None,
        "description": "Non-substantive editorial noise"
    },
    "EV-AUTO-20260909-A9B92B": {
        "action": "REJECT",
        "expected_issue": "water",
        "target_issue": None,
        "description": "Non-substantive / missing issue evidence"
    },
    "EV-AUTO-20260909-CED9DD": {
        "action": "REJECT",
        "expected_issue": "pollution",
        "target_issue": None,
        "description": "Non-substantive / routine notice"
    },
    "EV-AUTO-20260909-D96BD6": {
        "action": "REJECT",
        "expected_issue": "pollution",
        "target_issue": None,
        "description": "Non-substantive foreign or unrelated"
    },
    "EV-AUTO-20260909-E75586": {
        "action": "REJECT",
        "expected_issue": "pollution",
        "target_issue": None,
        "description": "Non-substantive / training notice"
    },
    "EV-AUTO-20260909-F400F0": {
        "action": "REJECT",
        "expected_issue": "pollution",
        "target_issue": None,
        "description": "Non-substantive / routine announcement"
    },
}

ACTIVE_LEGACY_ALIASES: Dict[str, str] = {
    "institutions": "rights",
    "economy": "work",
    "gabes": "pollution",
}


class FinalizationValidationError(Exception):
    """Raised when preconditions or validation checks fail closed."""
    pass


def compute_file_sha256(file_path: str) -> str:
    """Calculates SHA256 checksum of a file."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def validate_finalization_preconditions(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Validates all 13 expected review records and dynamic alias population against live DB.
    Fails closed on ANY mismatch.
    """
    cursor = conn.cursor()
    record_plan = []

    # 1. Validate all 13 approved review records
    for rec_id, cfg in APPROVED_REVIEW_DECISIONS.items():
        cursor.execute(
            """SELECT id, issue, headline, ingestion_status, classification_confidence, classification_reason
               FROM evidence WHERE id = ?""",
            (rec_id,)
        )
        row = cursor.fetchone()
        if not row:
            raise FinalizationValidationError(
                f"Expected review record '{rec_id}' does not exist in database."
            )

        db_issue = (row["issue"] or "").strip().lower()
        db_status = row["ingestion_status"] or "AUTO_ACCEPTED"

        # Check ingestion status: must be AUTO_ACCEPTED
        if db_status != "AUTO_ACCEPTED":
            raise FinalizationValidationError(
                f"Review record '{rec_id}' has unexpected ingestion_status '{db_status}', expected 'AUTO_ACCEPTED'."
            )

        # Check expected current issue
        if db_issue != cfg["expected_issue"].strip().lower():
            raise FinalizationValidationError(
                f"Review record '{rec_id}' has current issue '{row['issue']}', expected '{cfg['expected_issue']}'."
            )

        action = cfg["action"]
        target_issue = cfg["target_issue"]
        new_status = "REJECTED" if action == "REJECT" else db_status
        new_issue = target_issue if action == "RECLASSIFY" else row["issue"]

        record_plan.append({
            "id": rec_id,
            "action": action,
            "old_issue": row["issue"],
            "new_issue": new_issue,
            "old_ingestion_status": db_status,
            "new_ingestion_status": new_status,
            "description": cfg["description"],
            "headline": row["headline"]
        })

    # 2. Dynamic count of active legacy alias rows
    # Note: EF7FD1 (institutions) is handled in individual reclassifications, so it will become rights.
    # We query all AUTO_ACCEPTED rows matching alias issues.
    alias_plan = []
    for old_alias, target_issue in ACTIVE_LEGACY_ALIASES.items():
        cursor.execute(
            """SELECT id, headline, issue FROM evidence
               WHERE ingestion_status = 'AUTO_ACCEPTED' AND issue = ?""",
            (old_alias,)
        )
        matching_rows = cursor.fetchall()

        individual_covered_ids = {
            rec_id for rec_id, cfg in APPROVED_REVIEW_DECISIONS.items()
            if cfg["expected_issue"] == old_alias
        }
        pure_alias_rows = [r for r in matching_rows if r["id"] not in individual_covered_ids]

        alias_plan.append({
            "old_alias": old_alias,
            "target_issue": target_issue,
            "total_active_in_db": len(matching_rows),
            "pure_alias_rows_count": len(pure_alias_rows),
            "pure_alias_ids": [r["id"] for r in pure_alias_rows]
        })

    total_keep = sum(1 for r in record_plan if r["action"] == "KEEP")
    total_reclassify = sum(1 for r in record_plan if r["action"] == "RECLASSIFY")
    total_reject = sum(1 for r in record_plan if r["action"] == "REJECT")
    total_pure_alias_rows = sum(a["pure_alias_rows_count"] for a in alias_plan)
    total_mutations_planned = (total_reclassify + total_reject) + total_pure_alias_rows

    counts = {
        "total_review_records": len(record_plan),
        "keep": total_keep,
        "reclassify": total_reclassify,
        "reject": total_reject,
        "individual_mutations_planned": total_reclassify + total_reject,
        "alias_rows_planned": total_pure_alias_rows,
        "mutations_planned": total_mutations_planned
    }

    return {
        "validation_status": "PASSED",
        "counts": counts,
        "review_records": record_plan,
        "alias_plan": alias_plan
    }


def execute_finalization(
    db_path: str,
    apply: bool = False,
    confirm_token: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes or simulates the legacy finalization workflow.
    In apply mode, all mutations run inside a BEGIN IMMEDIATE transaction.
    """
    if apply and confirm_token != REQUIRED_CONFIRM_TOKEN:
        raise FinalizationValidationError(
            f"Safety error: --apply requires --confirm {REQUIRED_CONFIRM_TOKEN}. Got '{confirm_token}'."
        )

    if not os.path.exists(db_path):
        raise FinalizationValidationError(f"Database file not found: '{db_path}'")

    db_sha256_before = compute_file_sha256(db_path)

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    try:
        # Phase 1: Validate all preconditions using read queries
        plan = validate_finalization_preconditions(conn)
        counts = plan["counts"]
        review_records = plan["review_records"]
        alias_plan = plan["alias_plan"]

        individual_mutations_applied = 0
        alias_rows_changed = 0
        execution_records_log = []
        alias_summary_log = []

        if not apply:
            # DRY RUN: Zero database modifications
            mode_label = "DRY-RUN (Simulated - Zero Database Writes)"
            for rec in review_records:
                log_item = dict(rec)
                if rec["action"] == "KEEP":
                    log_item["result"] = "SIMULATED_KEEP_NO_OP"
                elif rec["action"] == "RECLASSIFY":
                    log_item["result"] = "SIMULATED_RECLASSIFY"
                elif rec["action"] == "REJECT":
                    log_item["result"] = "SIMULATED_REJECT"
                execution_records_log.append(log_item)

            for a in alias_plan:
                alias_summary_log.append({
                    "old_alias": a["old_alias"],
                    "target_issue": a["target_issue"],
                    "rows_affected": a["pure_alias_rows_count"],
                    "status": "SIMULATED_NORMALIZATION"
                })
        else:
            # APPLY MODE: Transaction-wrapped atomic write
            mode_label = "APPLY (Committed to Database)"
            conn.execute("BEGIN IMMEDIATE")
            cursor = conn.cursor()

            # Step 1: Apply individual review record mutations
            for rec in review_records:
                rec_id = rec["id"]
                action = rec["action"]
                log_item = dict(rec)

                if action == "RECLASSIFY":
                    cursor.execute(
                        """UPDATE evidence
                           SET issue = ?
                           WHERE id = ?""",
                        (rec["new_issue"], rec_id)
                    )
                    individual_mutations_applied += 1
                    log_item["result"] = "APPLIED_RECLASSIFY"
                elif action == "REJECT":
                    cursor.execute(
                        """UPDATE evidence
                           SET ingestion_status = 'REJECTED'
                           WHERE id = ?""",
                        (rec_id,)
                    )
                    individual_mutations_applied += 1
                    log_item["result"] = "APPLIED_REJECT"
                else:
                    log_item["result"] = "PRESERVED_KEEP_NO_OP"

                execution_records_log.append(log_item)

            # Step 2: Apply alias normalizations on remaining AUTO_ACCEPTED rows
            for a in alias_plan:
                old_alias = a["old_alias"]
                target_issue = a["target_issue"]

                cursor.execute(
                    """UPDATE evidence
                       SET issue = ?
                       WHERE ingestion_status = 'AUTO_ACCEPTED'
                         AND issue = ?""",
                    (target_issue, old_alias)
                )
                affected = cursor.rowcount
                alias_rows_changed += affected
                alias_summary_log.append({
                    "old_alias": old_alias,
                    "target_issue": target_issue,
                    "rows_affected": affected,
                    "status": "APPLIED_NORMALIZATION"
                })

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

    final_counts = {
        "total_review_records": counts["total_review_records"],
        "keep": counts["keep"],
        "reclassify": counts["reclassify"],
        "reject": counts["reject"],
        "individual_mutations_planned": counts["individual_mutations_planned"],
        "individual_mutations_applied": individual_mutations_applied if apply else 0,
        "alias_rows_planned": counts["alias_rows_planned"],
        "alias_rows_changed": alias_rows_changed if apply else 0,
        "mutations_planned": counts["mutations_planned"],
        "mutations_applied": (individual_mutations_applied + alias_rows_changed) if apply else 0
    }

    report = {
        "finalization_timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": "APPLY" if apply else "DRY_RUN",
        "mode_label": mode_label,
        "database_path": os.path.abspath(db_path),
        "database_sha256_before": db_sha256_before,
        "database_sha256_after": db_sha256_after,
        "database_unchanged": (db_sha256_before == db_sha256_after),
        "validation_status": "PASSED",
        "counts": final_counts,
        "review_records": execution_records_log,
        "alias_normalization": alias_summary_log
    }

    return report


def print_finalization_report(report: Dict[str, Any]) -> None:
    """Prints a formatted human-readable report."""
    counts = report["counts"]
    print("==========================================================================================")
    print("                 404TN LEGACY EVIDENCE FINALIZATION REPORT")
    print("==========================================================================================")
    print(f"Database   : {report['database_path']}")
    print(f"Timestamp  : {report['finalization_timestamp']}")
    print(f"Mode       : {report['mode_label']}")
    print(f"SHA256 In  : {report['database_sha256_before']}")
    print(f"SHA256 Out : {report['database_sha256_after']} (Unchanged: {report['database_unchanged']})")
    print(f"Validation : {report['validation_status']}")
    print("------------------------------------------------------------------------------------------")
    print(f"INDIVIDUAL REVIEW DECISIONS (13 Total):")
    print(f"  * RECLASSIFY (Issue Updated) : {counts['reclassify']:>4}")
    print(f"  * REJECT (Status -> REJECTED): {counts['reject']:>4}")
    print(f"  * KEEP (Preserved No-Op)     : {counts['keep']:>4}")
    print("------------------------------------------------------------------------------------------")
    print(f"ALIAS NORMALIZATION (AUTO_ACCEPTED Only):")
    for a in report["alias_normalization"]:
        print(f"  * {a['old_alias']:<15} -> {a['target_issue']:<15} : {a['rows_affected']:>4} rows")
    print("------------------------------------------------------------------------------------------")
    print(f"TOTAL MUTATIONS PLANNED       : {counts['mutations_planned']:>4}")
    print(f"TOTAL MUTATIONS APPLIED       : {counts['mutations_applied']:>4}")
    print("==========================================================================================\n")

    print("--- INDIVIDUAL RECORD ACTIONS ---")
    for r in report["review_records"]:
        print(f"[{r['action']}] {r['id']} -> {r['result']}")
        if r["action"] == "RECLASSIFY":
            print(f"  Issue Change : '{r['old_issue']}' -> '{r['new_issue']}'")
        elif r["action"] == "REJECT":
            print(f"  Status Change: '{r['old_ingestion_status']}' -> '{r['new_ingestion_status']}'")
        print(f"  Description  : {r['description']}")
        print(f"  Headline     : {r['headline']}\n")

    print("==========================================================================================")
    print("FINALIZATION RUN FINISHED")
    print("==========================================================================================")


def main():
    parser = argparse.ArgumentParser(
        description="404TN Legacy Evidence Finalization Tool",
        epilog="By default, this tool runs in DRY-RUN mode and never modifies the database without --apply and --confirm."
    )
    parser.add_argument("--db", type=str, required=True, help="Path to SQLite database to finalize")
    parser.add_argument("--apply", action="store_true", default=False, help="Execute write mutations in transaction")
    parser.add_argument("--confirm", type=str, default=None, help=f"Required confirmation token: {REQUIRED_CONFIRM_TOKEN}")
    parser.add_argument("--log-out", type=str, default=None, help="Path to save machine-readable JSON finalization report")

    args = parser.parse_args()

    try:
        report = execute_finalization(
            db_path=args.db,
            apply=args.apply,
            confirm_token=args.confirm
        )
        print_finalization_report(report)

        if args.log_out:
            out_path = os.path.abspath(args.log_out)
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            print(f"\n[INFO] Machine-readable finalization log saved to: {out_path}")

    except FinalizationValidationError as e:
        print(f"[SAFETY ERROR] Finalization validation failed closed: {e}", file=sys.stderr)
        if args.log_out:
            try:
                err_report = {
                    "finalization_timestamp": datetime.now(timezone.utc).isoformat(),
                    "mode": "APPLY" if args.apply else "DRY_RUN",
                    "database_path": os.path.abspath(args.db),
                    "validation_status": "FAILED",
                    "errors": [str(e)]
                }
                out_path = os.path.abspath(args.log_out)
                os.makedirs(os.path.dirname(out_path), exist_ok=True)
                with open(out_path, "w", encoding="utf-8") as f:
                    json.dump(err_report, f, indent=2, ensure_ascii=False)
            except Exception:
                pass
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Finalization execution failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
