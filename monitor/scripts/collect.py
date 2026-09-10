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
from typing import Dict, List, Optional, Any, Tuple

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.database import get_db, init_db, DB_PATH
from monitor.app.collectors import get_collector
from monitor.app.services.normalizer import (
    canonicalize_url, sanitize_text, normalize_headline,
    evaluate_content_quality, ContentQualityReport
)
from monitor.app.services.dedupe import compute_content_hash, is_duplicate
from monitor.app.services.classifier import (
    classify_issue_advanced, classify_epistemic, has_tunisia_context,
    is_substantive_evidence, determine_ingestion_status
)
from monitor.app.services.taxonomy import (
    CANONICAL_PRIMARY_ISSUES, classify_multi_axis, normalize_issue_slug
)
from monitor.app.services.locations import extract_location, resolve_location_advanced
from monitor.app.services.source_health import record_source_attempt

MONITORED_TAXONOMY = set(CANONICAL_PRIMARY_ISSUES) | {
    "water", "electricity", "pollution", "gabes", "work", "economy",
    "migration", "public_services", "rights", "institutions", "governance", "state_response",
    "public-services", "rights-institutions"
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

GLOBAL_MAX_DISCOVERED = 500
GLOBAL_MAX_FETCHED = 200
INTER_REQUEST_DELAY = 1.0

def reconcile_stale_collector_runs(conn: sqlite3.Connection, stale_threshold_sec: int = 1800) -> int:
    """
    Reconciles orphaned/interrupted collector runs left in 'RUNNING' status due to
    process crashes, OOM, or hard kills.

    Rules:
    - Runs in 'RUNNING' status with (now - started_at) > stale_threshold_sec
      are transitioned to 'FAILED'.
    - error_summary is set to 'INTERRUPTED_OR_STALE_RUN'.
    - completed_at is set to the reconciliation timestamp.
    - Active runs (started within stale_threshold_sec) are left UNTOUCHED.
    - Preserves auditability: never deletes runs, never marks them COMPLETED.
    """
    cursor = conn.cursor()
    cursor.execute("SELECT id, started_at FROM collector_runs WHERE status = 'RUNNING'")
    rows = cursor.fetchall()
    reconciled_count = 0
    now = datetime.now(timezone.utc)

    for row in rows:
        r_id = row[0]
        s_at = row[1]
        try:
            s_dt = datetime.fromisoformat(s_at.replace("Z", "+00:00"))
            age = (now - s_dt).total_seconds()
        except Exception:
            age = stale_threshold_sec + 1

        if age > stale_threshold_sec:
            cursor.execute("""
                UPDATE collector_runs
                SET status = 'FAILED',
                    completed_at = ?,
                    error_summary = 'INTERRUPTED_OR_STALE_RUN'
                WHERE id = ? AND status = 'RUNNING'
            """, (now.isoformat(), r_id))
            cursor.execute("""
                UPDATE collector_source_runs
                SET status = 'FAIL',
                    completed_at = ?,
                    error_summary = 'INTERRUPTED_OR_STALE_RUN'
                WHERE run_id = ? AND status = 'RUNNING'
            """, (now.isoformat(), r_id))
            reconciled_count += 1

    if reconciled_count > 0:
        conn.commit()
    return reconciled_count

def run_collection(
    selected_sources=None,
    dry_run=False,
    limit=None,
    verbose=False,
    no_classify=False,
    no_store=False,
    db_path=None
) -> Dict[str, Any]:
    target_db = db_path or DB_PATH
    init_db(target_db)

    run_id = f"RUN-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    run_started_at = datetime.now(timezone.utc).isoformat()
    run_start_t = time.time()
    run_mode = "DRY_RUN" if dry_run else "LIVE"

    # Acquire lock unless dry run
    lock_context = single_writer_lock() if not dry_run else contextmanager(lambda: (yield))()

    with lock_context:
        # Perform rolling pre-run backup
        if not dry_run and not no_store:
            backup_file = perform_database_backup(db_path=target_db)
            if backup_file and verbose:
                print(f"[BACKUP] Created pre-run atomic backup: {os.path.basename(backup_file)}")

            # Reconcile stale runs and initialize RUNNING record in collector_runs
            with get_db(target_db) as conn:
                reconciled = reconcile_stale_collector_runs(conn)
                if reconciled > 0 and verbose:
                    print(f"[RECONCILE] Marked {reconciled} stale interrupted run(s) as FAILED.")

                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO collector_runs (
                        id, started_at, status, mode, trigger_type,
                        collector_version, created_at
                    ) VALUES (?, ?, 'RUNNING', ?, 'CLI', '2.0.0', ?)
                """, (run_id, run_started_at, run_mode, run_started_at))
                conn.commit()

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
        print(f"RUN ID: {run_id} | MODE: {run_mode} | STARTED: {run_started_at}")
        print("==================================================================================================", flush=True)
        print(f"{'SOURCE':<18} {'STATUS':<8} {'HTTP':<6} {'DISCOVERED':<11} {'PARSED':<8} {'ACCEPTED':<9} {'REVIEW':<8} {'REJECTED':<9} {'DURATION'}", flush=True)
        print("-" * 105, flush=True)

        total_discovered = 0
        total_fetched = 0
        total_parsed = 0
        total_accepted = 0
        total_review = 0
        total_rejected = 0
        total_rejected_tax = 0
        total_rejected_geo = 0
        total_dupes = 0
        total_stored = 0

        total_q_good = 0
        total_q_partial = 0
        total_q_low = 0
        total_q_empty = 0

        success_count = 0
        partial_count = 0
        failed_count = 0
        source_errors: Dict[str, str] = {}

        with get_db(target_db) as conn:
            for s in sources_to_run:
                source_id = s["id"]
                source_name = s.get("name", source_id)
                src_run_id = f"SRUN-{run_id}-{source_id}"
                src_started_at = datetime.now(timezone.utc).isoformat()
                if limit:
                    s["max_items"] = limit

                start_t = time.time()
                src_http_status = None
                src_discovered = 0
                src_fetched = 0
                src_parsed = 0
                src_relevant = 0
                src_dupes = 0
                src_accepted = 0
                src_review = 0
                src_rejected = 0
                src_q_low = 0
                src_error = None

                # Record RUNNING in collector_source_runs
                if not dry_run and not no_store:
                    try:
                        cursor = conn.cursor()
                        cursor.execute("""
                            INSERT INTO collector_source_runs (
                                id, run_id, source_id, started_at, status
                            ) VALUES (?, ?, ?, ?, 'RUNNING')
                        """, (src_run_id, run_id, source_id, src_started_at))
                        conn.commit()
                    except Exception:
                        pass

                try:
                    collector = get_collector(s)
                    candidates, metrics = collector.collect()
                    src_http_status = metrics.http_status
                    src_discovered = metrics.items_discovered
                    src_fetched = metrics.items_fetched

                    accepted_candidates = []
                    review_candidates = []
                    rejected_count = 0
                    rejected_taxonomy_count = 0
                    rejected_non_tunisia_count = 0
                    dupes_count = 0

                    for cand in candidates:
                        # 1. NORMALIZATION LAYER
                        cand.headline = normalize_headline(cand.headline)
                        cand.summary = sanitize_text(cand.summary or "")
                        cand.body = sanitize_text(cand.body or "")
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

                        # 2. CONTENT QUALITY SCORING
                        q_rep = evaluate_content_quality(
                            clean_headline=cand.headline,
                            clean_summary=cand.summary,
                            clean_body=cand.body,
                            raw_text=f"{cand.headline} {cand.summary} {cand.body}",
                            published_at=cand.published_at,
                            canonical_url=cand.canonical_url,
                            extraction_method=cand.raw_metadata.get("extraction_method", "RSS_SUMMARY")
                        )
                        cand.raw_metadata["content_quality"] = q_rep.content_quality
                        cand.raw_metadata["boilerplate_ratio"] = q_rep.boilerplate_ratio
                        cand.raw_metadata["clean_text_length"] = q_rep.clean_text_length

                        if q_rep.content_quality == "GOOD":
                            total_q_good += 1
                        elif q_rep.content_quality == "PARTIAL":
                            total_q_partial += 1
                        elif q_rep.content_quality == "LOW":
                            total_q_low += 1
                            src_q_low += 1
                        else:
                            total_q_empty += 1
                            src_q_low += 1

                        # Optional Fallback Full-Text Fetch if source allows it and content is LOW/PARTIAL
                        if q_rep.content_quality in ["LOW", "PARTIAL"] and s.get("allow_full_text_fetch", False):
                            try:
                                with collector.get_http_client() as fallback_client:
                                    fb_res = collector.fetch_with_retry(fallback_client, cand.canonical_url)
                                    if fb_res.status_code == 200:
                                        from bs4 import BeautifulSoup
                                        soup = BeautifulSoup(fb_res.text, "html.parser")
                                        for el in soup(["script", "style", "nav", "footer", "header", "aside"]):
                                            el.decompose()
                                        fb_text = sanitize_text(soup.get_text())
                                        if len(fb_text) > len(cand.body or ""):
                                            cand.body = fb_text[:3000]
                                            # Re-evaluate quality
                                            q_rep = evaluate_content_quality(
                                                clean_headline=cand.headline,
                                                clean_summary=cand.summary,
                                                clean_body=cand.body,
                                                raw_text=fb_text,
                                                published_at=cand.published_at,
                                                canonical_url=cand.canonical_url,
                                                extraction_method="FALLBACK_FETCH"
                                            )
                                            cand.raw_metadata["content_quality"] = q_rep.content_quality
                            except Exception as fb_exc:
                                cand.raw_metadata["fallback_fetch_error"] = str(fb_exc)

                        # Full text assembly
                        full_text = f"{cand.headline} {cand.summary or ''} {cand.body or ''}"

                        # 3. MULTI-AXIS CLASSIFICATION
                        if not no_classify:
                            multi_res = classify_multi_axis(
                                text=full_text,
                                headline=cand.headline,
                                summary=cand.summary or "",
                                body=cand.body or "",
                                source_type=s.get("source_type", "news_agency")
                            )
                            cand.issue = multi_res.primary_issue
                            cand.section = multi_res.sub_issue
                            cand.tags = multi_res.topics
                            cand.classification = multi_res.classification
                            cand.status = multi_res.status
                            cand_confidence = multi_res.confidence
                            cand_reason = multi_res.reason
                            cand.raw_metadata["secondary_issues"] = multi_res.secondary_issues
                            cand.raw_metadata["topics"] = multi_res.topics
                            cand.raw_metadata["entities"] = multi_res.entities
                        else:
                            cand.classification = "ANALYSIS"
                            cand.status = "UNDER REVIEW"
                            cand.issue = "governance_institutions"
                            cand.section = "general"
                            cand_confidence = 0.5
                            cand_reason = "Classification bypassed"
                            cand.raw_metadata["secondary_issues"] = []
                            cand.raw_metadata["topics"] = []
                            cand.raw_metadata["entities"] = []

                        cand.current_or_historical = "CURRENT"

                        # 4. RELEVANCE & INGESTION PIPELINE
                        is_substantive, sub_reason = is_substantive_evidence(
                            cand.headline, cand.summary or "", cand.body or "", source_domain=s.get("domain")
                        )
                        is_taxonomy_match = bool(cand.issue and (cand.issue in MONITORED_TAXONOMY or normalize_issue_slug(cand.issue) in MONITORED_TAXONOMY))
                        is_tunisia_context = has_tunisia_context(full_text, source_domain=s.get("domain"), source_id=source_id)

                        # Empty/low content safety downgrade
                        if q_rep.content_quality in ["LOW", "EMPTY"]:
                            cand_confidence = min(cand_confidence, 0.45)

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

                    src_parsed = metrics.items_parsed
                    src_relevant = len(accepted_candidates) + len(review_candidates)
                    src_dupes = dupes_count
                    src_accepted = len(accepted_candidates)
                    src_review = len(review_candidates)
                    src_rejected = rejected_count

                    metrics.relevant_candidates = len(accepted_candidates)
                    metrics.rejected_irrelevant = rejected_count
                    metrics.rejected_taxonomy = rejected_taxonomy_count
                    metrics.rejected_non_tunisia = rejected_non_tunisia_count
                    metrics.duplicates = dupes_count

                    # Store if not dry-run
                    if not dry_run and not no_store:
                        cursor = conn.cursor()
                        for c in (accepted_candidates + review_candidates):
                            ev_id = f"EV-AUTO-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
                            sec_topics_json = json.dumps(c.tags) if c.tags else "[]"
                            sec_issues_json = json.dumps(c.raw_metadata.get("secondary_issues", []))
                            topics_json = json.dumps(c.raw_metadata.get("topics", []))
                            entities_json = json.dumps(c.raw_metadata.get("entities", []))

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
                                    location_confidence, location_method,
                                    secondary_issues, topics, entities, source_tier,
                                    discovery_provider, discovery_query, discovery_url, discovered_at
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                                c.raw_metadata.get("location_method", "GOVERNORATE_MATCH"),
                                sec_issues_json, topics_json, entities_json,
                                c.raw_metadata.get("source_tier", s.get("source_tier", "TIER_2")),
                                c.raw_metadata.get("discovery_provider"),
                                c.raw_metadata.get("discovery_query"),
                                c.raw_metadata.get("discovery_url"),
                                c.raw_metadata.get("discovered_at")
                            ))
                            total_stored += 1

                    # Record Source Health
                    if not dry_run and not no_store:
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
                        if metrics.last_error:
                            source_errors[source_id] = metrics.last_error

                except Exception as exc:
                    failed_count += 1
                    status_label = "FAIL"
                    src_error = str(exc)
                    source_errors[source_id] = src_error

                src_duration = round((time.time() - start_t) * 1000, 2)

                # Update collector_source_runs
                if not dry_run and not no_store:
                    try:
                        cursor = conn.cursor()
                        cursor.execute("""
                            UPDATE collector_source_runs
                            SET completed_at = ?,
                                status = ?,
                                http_status = ?,
                                discovered = ?,
                                fetched = ?,
                                parsed = ?,
                                relevant = ?,
                                duplicate = ?,
                                accepted = ?,
                                rejected = ?,
                                review_required = ?,
                                quality_low = ?,
                                duration_ms = ?,
                                error_summary = ?
                            WHERE id = ?
                        """, (
                            datetime.now(timezone.utc).isoformat(),
                            status_label,
                            src_http_status,
                            src_discovered,
                            src_fetched,
                            src_parsed,
                            src_relevant,
                            src_dupes,
                            src_accepted,
                            src_rejected,
                            src_review,
                            src_q_low,
                            src_duration,
                            src_error,
                            src_run_id
                        ))
                        conn.commit()
                    except Exception:
                        pass

                total_discovered += src_discovered
                total_fetched += src_fetched
                total_parsed += src_parsed
                total_accepted += src_accepted
                total_review += src_review
                total_rejected += src_rejected
                total_rejected_tax += rejected_taxonomy_count if 'rejected_taxonomy_count' in locals() else 0
                total_rejected_geo += rejected_non_tunisia_count if 'rejected_non_tunisia_count' in locals() else 0
                total_dupes += src_dupes

                http_display = str(src_http_status) if src_http_status else "N/A"
                print(f"{source_name[:17]:<18} {status_label:<8} {http_display:<6} {src_discovered:<11} {src_parsed:<8} {src_accepted:<9} {src_review:<8} {src_rejected:<9} {src_duration:.0f}ms", flush=True)

        # Determine terminal run status
        run_completed_at = datetime.now(timezone.utc).isoformat()
        run_duration_ms = round((time.time() - run_start_t) * 1000, 2)

        if failed_count == 0:
            overall_status = "COMPLETED"
        elif success_count > 0 or partial_count > 0:
            overall_status = "PARTIAL"
        else:
            overall_status = "FAILED"

        error_summary_text = json.dumps(source_errors) if source_errors else None

        # Update terminal collector_runs record
        if not dry_run and not no_store:
            with get_db(target_db) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE collector_runs
                    SET completed_at = ?,
                        status = ?,
                        sources_attempted = ?,
                        sources_successful = ?,
                        sources_failed = ?,
                        items_discovered = ?,
                        items_fetched = ?,
                        items_parsed = ?,
                        items_relevant = ?,
                        items_duplicate = ?,
                        items_accepted = ?,
                        items_rejected = ?,
                        items_review_required = ?,
                        quality_good = ?,
                        quality_partial = ?,
                        quality_low = ?,
                        quality_empty = ?,
                        duration_ms = ?,
                        error_summary = ?
                    WHERE id = ?
                """, (
                    run_completed_at,
                    overall_status,
                    len(sources_to_run),
                    success_count,
                    failed_count,
                    total_discovered,
                    total_fetched,
                    total_parsed,
                    total_accepted + total_review,
                    total_dupes,
                    total_accepted,
                    total_rejected,
                    total_review,
                    total_q_good,
                    total_q_partial,
                    total_q_low,
                    total_q_empty,
                    run_duration_ms,
                    error_summary_text,
                    run_id
                ))
                conn.commit()

        # SECTION J: STRUCTURED RUN REPORT
        print("=" * 105, flush=True)
        print("                            404TN COLLECTOR RUN TERMINAL REPORT")
        print("=" * 105, flush=True)
        print(f"RUN ID:              {run_id}")
        print(f"MODE:                {run_mode}")
        print(f"STATUS:              {overall_status}")
        print(f"STARTED:             {run_started_at}")
        print(f"COMPLETED:           {run_completed_at}")
        print(f"DURATION:            {run_duration_ms:.1f}ms")
        print("-" * 40, flush=True)
        print("SOURCE TOTALS:")
        print(f"  Attempted:         {len(sources_to_run)}")
        print(f"  Successful (PASS): {success_count}")
        print(f"  Partial:           {partial_count}")
        print(f"  Failed:            {failed_count}")
        print("-" * 40, flush=True)
        print("ITEM TOTALS:")
        print(f"  Discovered:        {total_discovered}")
        print(f"  Fetched:           {total_fetched}")
        print(f"  Parsed:            {total_parsed}")
        print(f"  Relevant:          {total_accepted + total_review}")
        print(f"  Duplicates:        {total_dupes}")
        print(f"  Auto-Accepted:     {total_accepted}")
        print(f"  Review Required:   {total_review}")
        print(f"  Rejected:          {total_rejected}")
        print(f"  Database Writes:   {0 if dry_run or no_store else total_stored}")
        print("-" * 40, flush=True)
        print("CONTENT QUALITY:")
        print(f"  Good:              {total_q_good}")
        print(f"  Partial:           {total_q_partial}")
        print(f"  Low:               {total_q_low}")
        print(f"  Empty:             {total_q_empty}")
        print("=" * 105, flush=True)

        return {
            "run_id": run_id,
            "mode": run_mode,
            "status": overall_status,
            "started_at": run_started_at,
            "completed_at": run_completed_at,
            "duration_ms": run_duration_ms,
            "sources_attempted": len(sources_to_run),
            "sources_successful": success_count,
            "sources_failed": failed_count,
            "items_discovered": total_discovered,
            "items_fetched": total_fetched,
            "items_parsed": total_parsed,
            "items_accepted": total_accepted,
            "items_review": total_review,
            "items_rejected": total_rejected,
            "items_duplicates": total_dupes,
            "database_writes": 0 if dry_run or no_store else total_stored
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="404TN Evidence Monitor V2 Collector Pipeline")
    parser.add_argument("--source", action="append", help="Specific source ID to run")
    parser.add_argument("--dry-run", action="store_true", help="Run in dry-run mode (zero database mutations)")
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
