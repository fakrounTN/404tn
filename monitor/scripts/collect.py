# monitor/scripts/collect.py
import sys
import os
import glob
import yaml
import time
import argparse
import uuid
import json
import sqlite3
import unicodedata
from contextlib import contextmanager
from datetime import datetime, timezone

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.database import get_db, init_db, DB_PATH
from monitor.app.collectors import get_collector
from monitor.app.services.normalizer import canonicalize_url
from monitor.app.services.dedupe import compute_content_hash, is_duplicate
from monitor.app.services.classifier import (
    classify_issue_advanced, classify_epistemic, has_tunisia_context,
    is_substantive_evidence, determine_ingestion_status
)
from monitor.app.services.locations import extract_location, resolve_location_advanced
from monitor.app.services.source_health import record_source_attempt

MONITORED_TAXONOMY = {
    "water", "electricity", "pollution", "gabes", "work", "economy",
    "migration", "public_services", "rights", "institutions", "governance", "state_response"
}

LOCK_FILE = os.path.join(os.path.dirname(DB_PATH), ".collector.lock")
BACKUP_DIR = os.path.join(os.path.dirname(DB_PATH), "backups")

@contextmanager
def single_writer_lock(lock_path: str = LOCK_FILE, stale_timeout_sec: int = 1800):
    """
    Prevents overlapping collection executions using a process lock file.
    Breaks locks older than stale_timeout_sec to recover safely from crashes.
    """
    os.makedirs(os.path.dirname(lock_path), exist_ok=True)
    if os.path.exists(lock_path):
        try:
            with open(lock_path, "r", encoding="utf-8") as f:
                lock_data = json.load(f)
            lock_time = lock_data.get("timestamp", 0)
            if time.time() - lock_time < stale_timeout_sec:
                raise RuntimeError(
                    f"Another collection run is active (PID {lock_data.get('pid')}, started {lock_data.get('started_at')}). Aborting."
                )
            else:
                print(f"[LOCK] Stale lockfile detected (> {stale_timeout_sec}s). Overwriting lock.", flush=True)
        except (json.JSONDecodeError, KeyError):
            pass

    # Acquire lock
    with open(lock_path, "w", encoding="utf-8") as f:
        json.dump({
            "pid": os.getpid(),
            "timestamp": time.time(),
            "started_at": datetime.now(timezone.utc).isoformat()
        }, f)

    try:
        yield
    finally:
        try:
            if os.path.exists(lock_path):
                os.remove(lock_path)
        except Exception:
            pass

def perform_database_backup(db_path: str = DB_PATH, backups_dir: str = BACKUP_DIR, max_backups: int = 7) -> str:
    """
    Performs a safe SQLite online atomic backup before running collection.
    Maintains a rolling window of the last max_backups snapshots.
    """
    if not os.path.exists(db_path):
        return ""

    os.makedirs(backups_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    backup_filename = f"404tn_backup_{timestamp}.db"
    backup_path = os.path.join(backups_dir, backup_filename)

    src_conn = sqlite3.connect(db_path)
    dst_conn = sqlite3.connect(backup_path)
    try:
        with dst_conn:
            src_conn.backup(dst_conn, pages=100)
    finally:
        src_conn.close()
        dst_conn.close()

    # Rotation: Keep last max_backups
    all_backups = sorted(glob.glob(os.path.join(backups_dir, "404tn_backup_*.db")), reverse=True)
    for old_backup in all_backups[max_backups:]:
        try:
            os.remove(old_backup)
        except Exception:
            pass

    return backup_path

def run_collection(
    selected_sources=None,
    dry_run=False,
    limit=None,
    verbose=False,
    no_classify=False,
    no_store=False
):
    init_db()

    # Acquire lock unless dry run
    lock_context = single_writer_lock() if not dry_run else contextmanager(lambda: (yield))()

    with lock_context:
        # Perform rolling pre-run backup
        if not dry_run and not no_store:
            backup_file = perform_database_backup()
            if backup_file and verbose:
                print(f"[BACKUP] Created pre-run atomic backup: {os.path.basename(backup_file)}")

        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "sources.yaml")
        with open(config_path, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)

        all_sources = cfg.get("sources", [])
        if selected_sources:
            sources_to_run = [s for s in all_sources if s["id"] in selected_sources]
        else:
            sources_to_run = [s for s in all_sources if s.get("enabled", True)]

        print("==================================================================================================", flush=True)
        print(f"                     404TN EVIDENCE MONITOR V2 - COLLECTOR RUN {'(DRY RUN)' if dry_run else ''}")
        print("==================================================================================================", flush=True)
        print(f"{'SOURCE':<18} {'STATUS':<8} {'HTTP':<6} {'DISCOVERED':<11} {'PARSED':<8} {'ACCEPTED':<9} {'REVIEW':<8} {'REJECTED':<9} {'DURATION'}", flush=True)
        print("-" * 105, flush=True)

        total_discovered = 0
        total_parsed = 0
        total_accepted = 0
        total_review = 0
        total_rejected = 0
        total_rejected_tax = 0
        total_rejected_geo = 0
        total_dupes = 0
        total_stored = 0

        success_count = 0
        partial_count = 0
        failed_count = 0

        with get_db() as conn:
            for s in sources_to_run:
                source_id = s["id"]
                source_name = s.get("name", source_id)
                if limit:
                    s["max_items"] = limit

                start_t = time.time()
                try:
                    collector = get_collector(s)
                    candidates, metrics = collector.collect()

                    accepted_candidates = []
                    review_candidates = []
                    dupes_count = 0
                    rejected_taxonomy_count = 0
                    rejected_non_tunisia_count = 0
                    rejected_count = 0

                    for cand in candidates:
                        cand.canonical_url = canonicalize_url(cand.url or cand.canonical_url)
                        cand_hash = compute_content_hash(f"{cand.headline} {cand.body or ''}")
                        cand.raw_metadata["content_hash"] = cand_hash

                        # Provenance validation: valid scheme and non-empty URL
                        if not cand.canonical_url or not cand.canonical_url.startswith("http"):
                            rejected_count += 1
                            continue

                        # Deduplication
                        already_exists = is_duplicate(cand.canonical_url, cand_hash, cand.headline, conn)
                        if already_exists:
                            dupes_count += 1
                            continue

                        # Full text assembly
                        full_text = f"{cand.headline} {cand.summary or ''} {cand.body or ''}"

                        # Classification
                        if not no_classify:
                            cls_res = classify_issue_advanced(full_text, headline=cand.headline, body=cand.body or "")
                            cand.issue = cls_res.primary_issue
                            cand.tags = cls_res.secondary_topics
                            classification, status = classify_epistemic(cand.headline, cand.body or "", s.get("source_type", "news_agency"))
                            cand.classification = classification
                            cand.status = status
                            cand_confidence = cls_res.confidence
                            cand_reason = cls_res.reason
                        else:
                            cand.classification = "ANALYSIS"
                            cand.status = "UNDER REVIEW"
                            cand.issue = "general"
                            cand_confidence = 0.5
                            cand_reason = "Classification bypassed"

                        cand.current_or_historical = "CURRENT"

                        # 6-STAGE RELEVANCE & INGESTION PIPELINE
                        is_substantive, sub_reason = is_substantive_evidence(
                            cand.headline, cand.summary or "", cand.body or "", source_domain=s.get("domain")
                        )
                        is_taxonomy_match = bool(cand.issue and cand.issue in MONITORED_TAXONOMY)
                        is_tunisia_context = has_tunisia_context(full_text, source_domain=s.get("domain"), source_id=source_id)

                        ingestion_state, state_reason = determine_ingestion_status(
                            is_substantive=is_substantive,
                            is_taxonomy_match=is_taxonomy_match,
                            is_tunisia=is_tunisia_context,
                            confidence=cand_confidence,
                            substantive_reason=sub_reason
                        )

                        cand.raw_metadata["ingestion_status"] = ingestion_state
                        cand.raw_metadata["classification_confidence"] = cand_confidence
                        cand.raw_metadata["classification_reason"] = cand_reason
                        cand.raw_metadata["state_reason"] = state_reason

                        if ingestion_state in ["AUTO_ACCEPTED", "REVIEW_REQUIRED"]:
                            res_loc = resolve_location_advanced(
                                cand.body or "", headline=cand.headline, summary=cand.summary or "", source_domain=s.get("domain")
                            )
                            cand.location = res_loc.canonical_name
                            cand.lat = res_loc.latitude
                            cand.lon = res_loc.longitude
                            cand.raw_metadata["location_scope"] = res_loc.scope
                            cand.raw_metadata["governorate"] = res_loc.governorate
                            cand.raw_metadata["delegation"] = res_loc.delegation
                            cand.raw_metadata["locality"] = res_loc.locality
                            cand.raw_metadata["location_confidence"] = res_loc.location_confidence
                            cand.raw_metadata["location_method"] = res_loc.location_method

                            if ingestion_state == "AUTO_ACCEPTED":
                                accepted_candidates.append(cand)
                            else:
                                review_candidates.append(cand)
                        else:
                            rejected_count += 1
                            if not is_taxonomy_match:
                                rejected_taxonomy_count += 1
                            if not is_tunisia_context:
                                rejected_non_tunisia_count += 1

                    metrics.relevant_candidates = len(accepted_candidates)
                    metrics.rejected_irrelevant = rejected_count
                    metrics.rejected_taxonomy = rejected_taxonomy_count
                    metrics.rejected_non_tunisia = rejected_non_tunisia_count
                    metrics.duplicates = dupes_count

                    # Store if not dry-run
                    if not dry_run and not no_store:
                        cursor = conn.cursor()
                        # Insert AUTO_ACCEPTED and REVIEW_REQUIRED
                        for c in (accepted_candidates + review_candidates):
                            ev_id = f"EV-AUTO-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
                            sec_topics_json = json.dumps(c.tags) if c.tags else "[]"
                            cursor.execute("""
                                INSERT OR REPLACE INTO evidence (
                                    id, issue, sub_issue, location, latitude, longitude, headline, summary, claim,
                                    classification, status, event_date, published_at, collected_at, last_checked,
                                    source_name, source_domain, source_type, source_url, source_language,
                                    source_confidence, evidence_confidence, current_or_historical, metric_value,
                                    metric_unit, metric_period, government_entity, presidential_response, outcome,
                                    tags, content_hash, secondary_topics, classification_confidence,
                                    classification_reason, ingestion_status,
                                    location_scope, governorate, delegation, locality,
                                    location_confidence, location_method
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (
                                ev_id, c.issue, c.section, c.location or "Tunisia",
                                c.lat, c.lon, c.headline, c.summary or c.headline, c.headline,
                                c.classification or "FACT", c.status or "REPORTED",
                                c.event_date or c.published_at, c.published_at or c.collected_at,
                                c.collected_at, c.collected_at, c.source_name, c.source_domain,
                                c.source_type, c.canonical_url, c.language,
                                s.get("trust_weight", 0.9), c.raw_metadata.get("classification_confidence", 0.9),
                                c.current_or_historical, None, None, None, None, None, None,
                                json.dumps(c.tags), c.raw_metadata.get("content_hash"),
                                sec_topics_json, c.raw_metadata.get("classification_confidence", 0.9),
                                c.raw_metadata.get("classification_reason"), c.raw_metadata.get("ingestion_status", "AUTO_ACCEPTED"),
                                c.raw_metadata.get("location_scope", "LOCAL"),
                                c.raw_metadata.get("governorate"),
                                c.raw_metadata.get("delegation"),
                                c.raw_metadata.get("locality"),
                                c.raw_metadata.get("location_confidence", 0.9),
                                c.raw_metadata.get("location_method", "GOVERNORATE_MATCH")
                            ))
                            total_stored += 1

                    # Record Source Health
                    record_source_attempt(
                        conn=conn,
                        source_id=source_id,
                        http_status=metrics.http_status,
                        items_discovered=metrics.items_discovered,
                        items_parsed=metrics.items_parsed,
                        relevant_count=len(accepted_candidates),
                        duration_ms=metrics.duration_ms,
                        error=metrics.last_error,
                        is_enabled=s.get("enabled", True)
                    )

                    # Determine Row Status
                    if metrics.http_status and 200 <= metrics.http_status < 400 and metrics.items_parsed > 0:
                        status_label = "PASS"
                        success_count += 1
                    elif metrics.http_status and 200 <= metrics.http_status < 400:
                        status_label = "PARTIAL"
                        partial_count += 1
                    else:
                        status_label = "FAIL"
                        failed_count += 1

                    total_discovered += metrics.items_discovered
                    total_parsed += metrics.items_parsed
                    total_accepted += len(accepted_candidates)
                    total_review += len(review_candidates)
                    total_rejected += metrics.rejected_irrelevant
                    total_rejected_tax += metrics.rejected_taxonomy
                    total_rejected_geo += metrics.rejected_non_tunisia
                    total_dupes += metrics.duplicates

                    http_display = str(metrics.http_status) if metrics.http_status else "N/A"
                    print(f"{source_name[:17]:<18} {status_label:<8} {http_display:<6} {metrics.items_discovered:<11} {metrics.items_parsed:<8} {len(accepted_candidates):<9} {len(review_candidates):<8} {metrics.rejected_irrelevant:<9} {metrics.duration_ms:.0f}ms", flush=True)

                    if verbose:
                        try:
                            for cand in accepted_candidates[:2]:
                                safe_hl = cand.headline[:50].encode('ascii', errors='replace').decode('ascii')
                                print(f"   [ACCEPTED -> {cand.issue}] ({cand.classification}) [Conf: {cand.raw_metadata.get('classification_confidence')}] {safe_hl}")
                            for cand in review_candidates[:2]:
                                safe_hl = cand.headline[:50].encode('ascii', errors='replace').decode('ascii')
                                print(f"   [REVIEW -> {cand.issue}] {cand.raw_metadata.get('classification_reason')} | {safe_hl}")
                        except Exception:
                            pass

                except Exception as exc:
                    failed_count += 1
                    print(f"{source_name[:17]:<18} {'FAIL':<8} {'ERR':<6} {0:<11} {0:<8} {0:<9} {0:<8} {0:<9} {str(exc)[:20]}")

        print("=" * 105, flush=True)
        print(f"TOTAL SOURCES:       {len(sources_to_run)}")
        print(f"SUCCESS:             {success_count}")
        print(f"PARTIAL:             {partial_count}")
        print(f"FAILED:              {failed_count}")
        print("-" * 40, flush=True)
        print(f"TOTAL DISCOVERED:    {total_discovered}")
        print(f"TOTAL PARSED:        {total_parsed}")
        print(f"AUTO-ACCEPTED:       {total_accepted}")
        print(f"REVIEW REQUIRED:     {total_review}")
        print(f"REJECTED (TAXONOMY): {total_rejected_tax}")
        print(f"REJECTED (NON-TN):   {total_rejected_geo}")
        print(f"TOTAL DUPLICATES:    {total_dupes}")
        print(f"DATABASE WRITES:     {0 if dry_run or no_store else total_stored}")
        print(f"{'DRY RUN COMPLETE' if dry_run else 'COLLECTION RUN COMPLETE'}", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="404TN Evidence Monitor V2 Collector Pipeline")
    parser.add_argument("--source", action="append", help="Specific source ID to run")
    parser.add_argument("--dry-run", action="store_true", help="Run without persisting to database")
    parser.add_argument("--limit", type=int, help="Limit number of items to fetch per source")
    parser.add_argument("--verbose", action="store_true", help="Print verbose candidate headlines")
    parser.add_argument("--no-classify", action="store_true", help="Skip epistemic and issue classification")
    parser.add_argument("--no-store", action="store_true", help="Skip database storage")
    args = parser.parse_args()

    run_collection(
        selected_sources=args.source,
        dry_run=args.dry_run,
        limit=args.limit,
        verbose=args.verbose,
        no_classify=args.no_classify,
        no_store=args.no_store
    )
