# monitor/scripts/collect.py
import sys
import os
import yaml
import time
import argparse
import uuid
import json
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.database import get_db, init_db
from monitor.app.collectors import get_collector
from monitor.app.services.normalizer import canonicalize_url
from monitor.app.services.dedupe import compute_content_hash, is_duplicate
from monitor.app.services.classifier import classify_issue, classify_epistemic, has_tunisia_context
from monitor.app.services.locations import extract_location
from monitor.app.services.freshness import calculate_freshness
from monitor.app.services.source_health import record_source_attempt

MONITORED_TAXONOMY = {
    "water", "electricity", "pollution", "gabes", "work", "economy",
    "migration", "public_services", "rights", "institutions", "governance", "state_response"
}

def run_collection(
    selected_sources=None,
    dry_run=False,
    limit=None,
    verbose=False,
    no_classify=False,
    no_store=False
):
    init_db()
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "sources.yaml")
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    all_sources = cfg.get("sources", [])
    if selected_sources:
        sources_to_run = [s for s in all_sources if s["id"] in selected_sources]
    else:
        sources_to_run = [s for s in all_sources if s.get("enabled", True)]

    print("==================================================================================================", flush=True)
    print(f"                     404TN EVIDENCE MONITOR - COLLECTOR RUN {'(DRY RUN)' if dry_run else ''}")
    print("==================================================================================================", flush=True)
    print(f"{'SOURCE':<18} {'STATUS':<8} {'HTTP':<6} {'DISCOVERED':<11} {'PARSED':<8} {'RELEVANT':<9} {'REJECTED':<9} {'DUPES':<7} {'DURATION'}", flush=True)
    print("-" * 100, flush=True)

    total_discovered = 0
    total_parsed = 0
    total_relevant = 0
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

                relevant_candidates = []
                dupes_count = 0
                rejected_taxonomy_count = 0
                rejected_non_tunisia_count = 0
                rejected_count = 0

                for cand in candidates:
                    cand.canonical_url = canonicalize_url(cand.url or cand.canonical_url)
                    cand_hash = compute_content_hash(f"{cand.headline} {cand.body or ''}")
                    cand.raw_metadata["content_hash"] = cand_hash

                    # Deduplication
                    already_exists = is_duplicate(cand.canonical_url, cand_hash, cand.headline, conn)
                    if already_exists:
                        dupes_count += 1
                        continue

                    # Classification
                    full_text = f"{cand.headline} {cand.summary or ''} {cand.body or ''}"
                    if not no_classify:
                        cand.issue = classify_issue(full_text)
                        classification, status = classify_epistemic(cand.headline, cand.body or "", s.get("source_type", "news_agency"))
                        cand.classification = classification
                        cand.status = status
                    else:
                        cand.classification = "ANALYSIS"
                        cand.status = "UNDER REVIEW"
                        cand.issue = "general"

                    # Freshness
                    cand.current_or_historical = "CURRENT"

                    # TWO-STAGE RELEVANCE DECISION:
                    # STAGE A: Must map to authoritative 404TN MONITORED_TAXONOMY
                    # STAGE B: Must have credible Tunisia context
                    is_taxonomy_match = bool(cand.issue and cand.issue in MONITORED_TAXONOMY)
                    is_tunisia_context = has_tunisia_context(full_text, source_domain=s.get("domain"), source_id=source_id)

                    if not is_taxonomy_match:
                        rejected_taxonomy_count += 1
                        rejected_count += 1
                    elif not is_tunisia_context:
                        rejected_non_tunisia_count += 1
                        rejected_count += 1
                    else:
                        loc_name, lat, lon = extract_location(full_text)
                        cand.location = loc_name
                        cand.lat = lat
                        cand.lon = lon
                        relevant_candidates.append(cand)

                metrics.relevant_candidates = len(relevant_candidates)
                metrics.rejected_irrelevant = rejected_count
                metrics.rejected_taxonomy = rejected_taxonomy_count
                metrics.rejected_non_tunisia = rejected_non_tunisia_count
                metrics.duplicates = dupes_count

                # Store if not dry-run
                if not dry_run and not no_store:
                    cursor = conn.cursor()
                    for c in relevant_candidates:
                        ev_id = f"EV-AUTO-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
                        cursor.execute("""
                            INSERT OR REPLACE INTO evidence (
                                id, issue, sub_issue, location, latitude, longitude, headline, summary, claim,
                                classification, status, event_date, published_at, collected_at, last_checked,
                                source_name, source_domain, source_type, source_url, source_language,
                                source_confidence, evidence_confidence, current_or_historical, metric_value,
                                metric_unit, metric_period, government_entity, presidential_response, outcome,
                                tags, content_hash
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            ev_id, c.issue, c.section, c.location or "Tunisia",
                            c.lat, c.lon, c.headline, c.summary or c.headline, c.headline,
                            c.classification or "FACT", c.status or "REPORTED",
                            c.event_date or c.published_at, c.published_at or c.collected_at,
                            c.collected_at, c.collected_at, c.source_name, c.source_domain,
                            c.source_type, c.canonical_url, c.language,
                            s.get("trust_weight", 0.9), 0.9, c.current_or_historical,
                            None, None, None, None, None, None,
                            json.dumps(c.tags), c.raw_metadata.get("content_hash")
                        ))
                        total_stored += 1

                # Record Source Health
                record_source_attempt(
                    conn=conn,
                    source_id=source_id,
                    http_status=metrics.http_status,
                    items_discovered=metrics.items_discovered,
                    items_parsed=metrics.items_parsed,
                    relevant_count=metrics.relevant_candidates,
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
                total_relevant += metrics.relevant_candidates
                total_rejected += metrics.rejected_irrelevant
                total_rejected_tax += metrics.rejected_taxonomy
                total_rejected_geo += metrics.rejected_non_tunisia
                total_dupes += metrics.duplicates

                http_display = str(metrics.http_status) if metrics.http_status else "N/A"
                print(f"{source_name[:17]:<18} {status_label:<8} {http_display:<6} {metrics.items_discovered:<11} {metrics.items_parsed:<8} {metrics.relevant_candidates:<9} {metrics.rejected_irrelevant:<9} {metrics.duplicates:<7} {metrics.duration_ms:.0f}ms", flush=True)

                if verbose and relevant_candidates:
                    for cand in relevant_candidates[:3]:
                        print(f"   -> [{cand.issue}] ({cand.classification}) [Loc: {cand.location} ({cand.lat},{cand.lon})] {cand.headline[:55]}")

            except Exception as exc:
                failed_count += 1
                print(f"{source_name[:17]:<18} {'FAIL':<8} {'ERR':<6} {0:<11} {0:<8} {0:<9} {0:<9} {0:<7} {str(exc)[:20]}")

    print("=" * 100, flush=True)
    print(f"TOTAL SOURCES:       {len(sources_to_run)}")
    print(f"SUCCESS:             {success_count}", flush=True)
    print(f"PARTIAL:             {partial_count}", flush=True)
    print(f"FAILED:              {failed_count}", flush=True)
    print("-" * 35, flush=True)
    print(f"TOTAL DISCOVERED:    {total_discovered}", flush=True)
    print(f"TOTAL PARSED:        {total_parsed}", flush=True)
    print(f"TOTAL RELEVANT:      {total_relevant}", flush=True)
    print(f"REJECTED (TAXONOMY): {total_rejected_tax}", flush=True)
    print(f"REJECTED (NON-TN):   {total_rejected_geo}", flush=True)
    print(f"TOTAL DUPLICATES:    {total_dupes}", flush=True)
    print(f"DATABASE WRITES:     {0 if dry_run or no_store else total_stored}", flush=True)
    print(f"{'DRY RUN COMPLETE' if dry_run else 'COLLECTION RUN COMPLETE'}", flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="404TN Evidence Collector Pipeline")
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
