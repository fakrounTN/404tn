# monitor/scripts/remediate_production_taxonomy.py
"""
404TN Production Taxonomy Transactional Remediation Tool

Applies audited, approved taxonomy and epistemic mutations to the exact 18
real production records from the initial Collector V2 live run (RUN-20260910-80491E10).

STRICT SAFETY CONTROLS:
- Operates strictly on target SQLite database specified via required --db argument
- Refuses to operate unless DB contains exactly:
    Total: 105 | AUTO_ACCEPTED: 62 | REJECTED: 43 | REVIEW_REQUIRED: 0
- Mandatory WAL-safe SQLite API backup with PRAGMA integrity_check validation
- Atomic transaction (BEGIN IMMEDIATE / COMMIT / ROLLBACK on any mismatch or error)
- Explicit pre-condition assertions on all 18 real target rows
- Zero row deletions (NO DELETE statements)
- Modifies strictly classification and taxonomy fields; leaves all geo, text, provenance fields untouched
- Strict post-update assertions:
    Total: 105 | AUTO_ACCEPTED: 59 | REVIEW_REQUIRED: 2 | REJECTED: 44
"""

import os
import sys
import sqlite3
import argparse
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.services.taxonomy import classify_multi_axis
from monitor.app.services.classifier import is_substantive_evidence

DEFAULT_RUN_ID = "RUN-20260910-80491E10"
DEFAULT_WINDOW_START = "2026-09-10T01:36:25.394064+00:00"
DEFAULT_WINDOW_END = "2026-09-10T01:37:14.498119+00:00"
EXPECTED_TARGET_COUNT = 18

# Specific known ID behaviors per authoritative production audit:
SPECIAL_TARGETS = {
    # 1 REJECT (SNJT routine union congress notice filtered by substantive gate)
    "EV-AUTO-20260910-0C7E8A": {
        "issue": "media_press_freedom",
        "sub_issue": "press_freedom",
        "classification": "CLAIM",
        "classification_confidence": 0.95,
        "classification_reason": "Rejected by substantive gate: routine_admin_notice",
        "secondary_issues": [],
        "topics": [],
        "entities": [],
        "ingestion_status": "REJECTED",
        "disposition": "REJECT"
    },
    # SNJT attributed statement on journalist prosecution -> remains AUTO_ACCEPTED
    "EV-AUTO-20260910-61D4D8": {
        "issue": "media_press_freedom",
        "sub_issue": "press_freedom",
        "classification": "CLAIM",
        "classification_confidence": 0.95,
        "classification_reason": "Attributed union/legal statement regarding journalist investigation",
        "secondary_issues": [],
        "topics": [],
        "entities": [],
        "ingestion_status": "AUTO_ACCEPTED",
        "disposition": "RECLASSIFY"
    },
    # 2 REVIEW_REQUIRED records
    "EV-AUTO-20260910-9A662E": {
        "force_status": "REVIEW_REQUIRED",
        "disposition": "REVIEW_REQUIRED"
    },
    "EV-AUTO-20260910-1E8A12": {
        "force_status": "REVIEW_REQUIRED",
        "disposition": "REVIEW_REQUIRED"
    }
}


def create_sqlite_backup(source_conn: sqlite3.Connection, db_path: str) -> Tuple[str, int]:
    """Creates a WAL-safe backup using the SQLite Online Backup API and verifies integrity."""
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup_path = f"{db_path}.backup-{ts}"
    dest_conn = sqlite3.connect(backup_path)
    with dest_conn:
        source_conn.backup(dest_conn)
    dest_conn.close()

    # Verify backup with PRAGMA integrity_check
    verify_conn = sqlite3.connect(backup_path)
    c = verify_conn.cursor()
    c.execute("PRAGMA integrity_check")
    res = c.fetchone()[0]
    verify_conn.close()
    if res != "ok":
        raise RuntimeError(f"Backup integrity check failed: {res}")

    size_bytes = os.path.getsize(backup_path)
    return backup_path, size_bytes


def get_db_counts(cursor: sqlite3.Cursor) -> Tuple[int, Dict[str, int]]:
    """Returns total evidence count and ingestion_status breakdown."""
    cursor.execute("SELECT COUNT(*) FROM evidence")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COALESCE(ingestion_status, 'UNKNOWN'), COUNT(*) FROM evidence GROUP BY ingestion_status")
    breakdown = dict(cursor.fetchall())
    return total, breakdown


def run_remediation(
    db_path: str,
    window_start: str = DEFAULT_WINDOW_START,
    window_end: str = DEFAULT_WINDOW_END,
    run_id: str = DEFAULT_RUN_ID,
    dry_run: bool = False
) -> Dict[str, Any]:
    """Executes the safe transactional remediation on the target SQLite database."""
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found at path: {db_path}")

    print("=" * 140)
    print("404TN PRODUCTION TAXONOMY TRANSACTIONAL REMEDIATION")
    print(f"Target Database: {db_path}")
    print(f"Target Run ID:   {run_id}")
    print(f"Time Window:     {window_start} -> {window_end}")
    print(f"Mode:            {'DRY-RUN (NO WRITES)' if dry_run else 'LIVE MUTATION'}")
    print("=" * 140)

    # 1. Connect and Verify BEFORE counts
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        total_before, breakdown_before = get_db_counts(cursor)
        print(f"\n[STEP 1 - BEFORE COUNTS]")
        print(f"  Total Evidence : {total_before}")
        print(f"  Status Breakdown: {breakdown_before}")

        if total_before != 105:
            raise ValueError(f"Database validation failed: Expected exactly 105 total rows, found {total_before}")
        if breakdown_before.get("AUTO_ACCEPTED", 0) != 62:
            raise ValueError(f"Database validation failed: Expected 62 AUTO_ACCEPTED, found {breakdown_before.get('AUTO_ACCEPTED')}")
        if breakdown_before.get("REJECTED", 0) != 43:
            raise ValueError(f"Database validation failed: Expected 43 REJECTED, found {breakdown_before.get('REJECTED')}")
        if breakdown_before.get("REVIEW_REQUIRED", 0) != 0:
            raise ValueError(f"Database validation failed: Expected 0 REVIEW_REQUIRED, found {breakdown_before.get('REVIEW_REQUIRED')}")

        print("  [OK] Pre-remediation database state strictly validated (105 total, 62 AUTO_ACCEPTED, 43 REJECTED, 0 REVIEW_REQUIRED).")
        print("-" * 140)

        # 2. Create WAL-Safe SQLite Backup
        backup_path, backup_size = create_sqlite_backup(conn, db_path)
        print(f"[STEP 2 - WAL-SAFE BACKUP CREATED]")
        print(f"  Backup Path : {backup_path}")
        print(f"  Backup Size : {backup_size:,} bytes")
        print(f"  Backup Check: PRAGMA integrity_check -> ok")
        print("-" * 140)

        # 3. Select the 18 target rows
        query = """
            SELECT id, headline, summary, claim, source_name, source_type, source_domain, source_url, content_hash,
                   issue, sub_issue, classification, classification_confidence, classification_reason,
                   ingestion_status, collected_at
            FROM evidence
            WHERE collected_at >= ?
              AND collected_at <= ?
              AND ingestion_status = 'AUTO_ACCEPTED'
            ORDER BY collected_at, id;
        """
        cursor.execute(query, (window_start, window_end))
        target_rows = cursor.fetchall()
        selected_count = len(target_rows)

        print(f"[STEP 3 - TARGET SELECTION]")
        print(f"  Selected Rows: {selected_count} (Expected: {EXPECTED_TARGET_COUNT})")
        if selected_count != EXPECTED_TARGET_COUNT:
            raise ValueError(f"Target selection failed: Expected {EXPECTED_TARGET_COUNT} rows, found {selected_count}")

        # 4. Validate Pre-Conditions for all 18 rows
        seen_ids = set()
        for r in target_rows:
            rec_id = r["id"]
            if not rec_id or rec_id in seen_ids:
                raise ValueError(f"Duplicate or invalid ID encountered: {rec_id}")
            seen_ids.add(rec_id)

            if r["ingestion_status"] != "AUTO_ACCEPTED":
                raise ValueError(f"Row {rec_id} has invalid ingestion_status: {r['ingestion_status']}")
            if not r["content_hash"]:
                raise ValueError(f"Row {rec_id} missing content_hash")

        print("  [OK] All 18 target rows validated.")
        print("-" * 140)

        # 5. Start Explicit Atomic Transaction
        print("[STEP 4 - BEGIN TRANSACTION]")
        cursor.execute("BEGIN IMMEDIATE")

        # 6. Apply Decisions to the 18 Rows
        print("[STEP 5 - APPLYING REMEDIATIONS]")
        mutations = []
        counts = {"RECLASSIFY": 0, "REVIEW_REQUIRED": 0, "REJECT": 0}

        for r in target_rows:
            rec_id = r["id"]
            headline = r["headline"] or ""
            summary = r["summary"] or ""
            claim = r["claim"] or ""
            source_type = r["source_type"] or "news_agency"
            source_domain = r["source_domain"] or ""
            content_hash = r["content_hash"] or ""

            # Check special case overrides
            if rec_id in SPECIAL_TARGETS:
                spec = SPECIAL_TARGETS[rec_id]
                if "force_status" in spec:
                    # Review required
                    cls_res = classify_multi_axis(
                        text=f"{headline} {summary} {claim}".strip(),
                        headline=headline,
                        summary=summary,
                        source_type=source_type
                    )
                    prop_issue = cls_res.primary_issue
                    prop_sub_issue = cls_res.sub_issue
                    prop_sec_issues = cls_res.secondary_issues
                    prop_topics = cls_res.topics
                    prop_entities = cls_res.entities
                    prop_class = cls_res.classification
                    prop_conf = cls_res.confidence
                    prop_reason = cls_res.reason
                    prop_status = spec["force_status"]
                    disp = spec["disposition"]
                else:
                    # Exact explicit fields
                    prop_issue = spec["issue"]
                    prop_sub_issue = spec["sub_issue"]
                    prop_sec_issues = spec.get("secondary_issues", [])
                    prop_topics = spec.get("topics", [])
                    prop_entities = spec.get("entities", [])
                    prop_class = spec["classification"]
                    prop_conf = spec["classification_confidence"]
                    prop_reason = spec["classification_reason"]
                    prop_status = spec["ingestion_status"]
                    disp = spec["disposition"]
            else:
                # Standard authoritative reclassification
                cls_res = classify_multi_axis(
                    text=f"{headline} {summary} {claim}".strip(),
                    headline=headline,
                    summary=summary,
                    source_type=source_type
                )
                prop_issue = cls_res.primary_issue
                prop_sub_issue = cls_res.sub_issue
                prop_sec_issues = cls_res.secondary_issues
                prop_topics = cls_res.topics
                prop_entities = cls_res.entities
                prop_class = cls_res.classification
                prop_conf = cls_res.confidence
                prop_reason = cls_res.reason
                prop_status = "AUTO_ACCEPTED"
                disp = "RECLASSIFY"

            counts[disp] += 1

            cursor.execute("""
                UPDATE evidence
                SET issue = ?,
                    sub_issue = ?,
                    classification = ?,
                    classification_confidence = ?,
                    classification_reason = ?,
                    secondary_issues = ?,
                    topics = ?,
                    entities = ?,
                    ingestion_status = ?
                WHERE id = ?
            """, (
                prop_issue,
                prop_sub_issue,
                prop_class,
                prop_conf,
                prop_reason,
                json.dumps(prop_sec_issues),
                json.dumps(prop_topics),
                json.dumps(prop_entities),
                prop_status,
                rec_id
            ))

            hash_abbr = f"{content_hash[:6]}...{content_hash[-6:]}" if len(content_hash) >= 12 else content_hash
            mutations.append({
                "id": rec_id,
                "source_url": r["source_url"],
                "headline": headline,
                "content_hash_abbr": hash_abbr,
                "old_issue": r["issue"],
                "old_sub_issue": r["sub_issue"],
                "old_class": r["classification"],
                "proposed_issue": prop_issue,
                "proposed_sub_issue": prop_sub_issue,
                "proposed_class": prop_class,
                "confidence": prop_conf,
                "proposed_ingestion_status": prop_status,
                "disposition": disp
            })

        print(f"  Applied {len(mutations)} row updates inside transaction.")
        print(f"  Dispositions: {counts}")
        print("-" * 140)

        # 7. Pre-Commit Assertions
        print("[STEP 6 - PRE-COMMIT VERIFICATION]")
        total_mid, breakdown_mid = get_db_counts(cursor)
        print(f"  Total Evidence : {total_mid} (Expected: 105)")
        print(f"  Status Breakdown: {breakdown_mid}")

        if total_mid != 105:
            raise ValueError(f"Post-update assertion failed: Total rows is {total_mid}, expected 105")
        if breakdown_mid.get("AUTO_ACCEPTED", 0) != 59:
            raise ValueError(f"Post-update assertion failed: AUTO_ACCEPTED is {breakdown_mid.get('AUTO_ACCEPTED')}, expected 59")
        if breakdown_mid.get("REVIEW_REQUIRED", 0) != 2:
            raise ValueError(f"Post-update assertion failed: REVIEW_REQUIRED is {breakdown_mid.get('REVIEW_REQUIRED')}, expected 2")
        if breakdown_mid.get("REJECTED", 0) != 44:
            raise ValueError(f"Post-update assertion failed: REJECTED is {breakdown_mid.get('REJECTED')}, expected 44")
        if counts["RECLASSIFY"] != 15 or counts["REVIEW_REQUIRED"] != 2 or counts["REJECT"] != 1:
            raise ValueError(f"Target dispositions mismatch: {counts}")

        print("  [OK] Pre-commit counts and disposition breakdown strictly verified.")
        print("-" * 140)

        # 8. Commit or Dry-Run Rollback
        if dry_run:
            print("[STEP 7 - DRY-RUN ROLLBACK]")
            conn.rollback()
            print("  [DRY RUN SUCCESS] Rolled back transaction. ZERO database writes committed.")
        else:
            print("[STEP 7 - COMMIT TRANSACTION]")
            conn.commit()
            print("  [COMMIT SUCCESS] Transaction committed to database.")

        print("-" * 140)

        # 9. Post-Commit Integrity Check
        print("[STEP 8 - INTEGRITY CHECK]")
        cursor.execute("PRAGMA integrity_check")
        integrity_res = cursor.fetchone()[0]
        print(f"  PRAGMA integrity_check: {integrity_res}")
        if integrity_res != "ok":
            raise RuntimeError(f"Post-commit integrity check failed: {integrity_res}")
        print("-" * 140)

        # 10. Print Formatted 18-Row Comparison Table
        print("\n" + "=" * 180)
        print("18-ROW REMEDIATION AUDIT DETAIL (BEFORE -> AFTER)")
        print("=" * 180)
        print(f"{'REAL_ID':<25} | {'HASH':<16} | {'OLD ISSUE/SUB':<35} | {'PROPOSED ISSUE/SUB':<38} | {'CLASS':<8} | {'CONF':<5} | {'STATUS':<16} | {'DISP'}")
        print("-" * 180)
        for m in mutations:
            old_c = f"{m['old_issue']} / {m['old_sub_issue']}"
            prop_c = f"{m['proposed_issue']} / {m['proposed_sub_issue']}"
            print(f"{m['id']:<25} | {m['content_hash_abbr']:<16} | {old_c[:35]:<35} | {prop_c[:38]:<38} | {m['proposed_class']:<8} | {m['confidence']:<5.2f} | {m['proposed_ingestion_status']:<16} | {m['disposition']}")
            print(f"  Headline:   {m['headline']}")
            print(f"  Source URL: {m['source_url']}")
            print("-" * 180)

        # 11. Final Summary
        total_after, breakdown_after = get_db_counts(cursor)
        print("\n" + "=" * 140)
        print("REMEDIATION EXECUTION SUMMARY")
        print("=" * 140)
        print(f"BEFORE Counts   : Total {total_before} | AUTO_ACCEPTED {breakdown_before.get('AUTO_ACCEPTED', 0)} | REVIEW_REQUIRED {breakdown_before.get('REVIEW_REQUIRED', 0)} | REJECTED {breakdown_before.get('REJECTED', 0)}")
        print(f"Backup Location : {backup_path} ({backup_size:,} bytes, verified 'ok')")
        print(f"Mutations       : {len(mutations)} total (15 RECLASSIFY, 2 REVIEW_REQUIRED, 1 REJECT)")
        print(f"AFTER Counts    : Total {total_after} | AUTO_ACCEPTED {breakdown_after.get('AUTO_ACCEPTED', 0)} | REVIEW_REQUIRED {breakdown_after.get('REVIEW_REQUIRED', 0)} | REJECTED {breakdown_after.get('REJECTED', 0)}")
        print(f"Integrity Check : {integrity_res}")
        print(f"Final Status    : {'DRY RUN SUCCESS (0 writes)' if dry_run else 'COMMIT SUCCESS'}")
        print("=" * 140)

        conn.close()
        return {
            "backup_path": backup_path,
            "backup_size": backup_size,
            "before_counts": {"total": total_before, "breakdown": breakdown_before},
            "after_counts": {"total": total_after, "breakdown": breakdown_after},
            "mutations": mutations,
            "dry_run": dry_run
        }

    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"\n[FATAL ERROR] Transaction rolled back: {e}")
        raise e


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="404TN Production Taxonomy Transactional Remediation Tool")
    parser.add_argument("--db", required=True, help="Path to production SQLite database (REQUIRED)")
    parser.add_argument("--window-start", default=DEFAULT_WINDOW_START, help="Run start ISO timestamp")
    parser.add_argument("--window-end", default=DEFAULT_WINDOW_END, help="Run end ISO timestamp")
    parser.add_argument("--run-id", default=DEFAULT_RUN_ID, help="Target collector run ID")
    parser.add_argument("--dry-run", action="store_true", help="Perform assertions and updates in transaction and rollback (0 writes)")
    args = parser.parse_args()

    run_remediation(
        db_path=args.db,
        window_start=args.window_start,
        window_end=args.window_end,
        run_id=args.run_id,
        dry_run=args.dry_run
    )
