# monitor/app/collectors/google_news.py
import time
import feedparser
from datetime import datetime, timezone
from typing import List, Tuple, Optional, Any, Dict
from dateutil import parser as date_parser

from monitor.app.collectors.base import BaseCollector, NormalizedCandidate, DiscoveryMetrics
from monitor.app.services.normalizer import canonicalize_url, sanitize_text
from monitor.app.services.provenance import resolve_evidence_provenance, unwrap_google_news_url
from monitor.app.services.discovery import (
    select_queries_for_run, build_google_news_rss_url,
    record_query_execution_metrics, DiscoveryQuery
)

class GoogleNewsDiscoveryCollector(BaseCollector):
    """
    Collector V2 Discovery mechanism using Google News RSS query packs.
    Preserves provenance separation: Google News is the discovery provider,
    while the unwrapped publisher is the source of record.
    """

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.max_queries = config.get("max_queries", 20)
        self.max_items_per_query = config.get("max_items_per_query", 15)

    def collect(self) -> Tuple[List[NormalizedCandidate], DiscoveryMetrics]:
        start_time = time.time()
        metrics = DiscoveryMetrics(source_id=self.source_id)
        candidates: List[NormalizedCandidate] = []
        seen_urls = set()

        dry_run = bool(self.config.get("dry_run", False))
        queries = select_queries_for_run(max_queries=self.max_queries, dry_run=dry_run)
        if not queries:
            metrics.last_error = "No active discovery queries available"
            return candidates, metrics

        try:
            with self.get_http_client() as client:
                for q in queries:
                    feed_url = build_google_news_rss_url(q.query_text, language=q.language)
                    query_discovered = 0
                    query_accepted = 0

                    try:
                        res = self.fetch_with_retry(client, feed_url)
                        if metrics.http_status is None:
                            metrics.http_status = res.status_code

                        if res.status_code == 200:
                            parsed_feed = feedparser.parse(res.text)
                            entries = parsed_feed.entries or []
                            query_discovered = len(entries)
                            metrics.items_discovered += query_discovered

                            selected_entries = entries[:self.max_items_per_query]
                            metrics.items_selected += len(selected_entries)

                            for entry in selected_entries:
                                metrics.items_fetched += 1
                                try:
                                    cand = self._parse_discovery_entry(entry, q)
                                    if cand and cand.headline and cand.canonical_url not in seen_urls:
                                        seen_urls.add(cand.canonical_url)
                                        candidates.append(cand)
                                        metrics.items_parsed += 1
                                        query_accepted += 1
                                    elif cand and cand.canonical_url in seen_urls:
                                        metrics.duplicates += 1
                                    else:
                                        metrics.parse_failures += 1
                                except Exception:
                                    metrics.parse_failures += 1

                        record_query_execution_metrics(
                            query_id=q.id,
                            discovered_count=query_discovered,
                            accepted_count=query_accepted,
                            status_code=res.status_code,
                            dry_run=dry_run
                        )

                    except Exception as query_exc:
                        metrics.last_error = f"Query '{q.id}' failed: {str(query_exc)}"
                        record_query_execution_metrics(
                            query_id=q.id,
                            discovered_count=0,
                            accepted_count=0,
                            status_code=500,
                            dry_run=dry_run
                        )

        except Exception as global_exc:
            metrics.last_error = str(global_exc)
            if metrics.http_status is None:
                metrics.http_status = 500

        metrics.duration_ms = round((time.time() - start_time) * 1000, 2)
        return candidates, metrics

    def _parse_discovery_entry(self, entry: Any, query: DiscoveryQuery) -> Optional[NormalizedCandidate]:
        headline = getattr(entry, "title", "")
        headline = sanitize_text(headline)
        if not headline or len(headline) < 5:
            return None

        # Google News titles typically end with ' - Publisher Name'
        source_name_hint = None
        if " - " in headline:
            parts = headline.rsplit(" - ", 1)
            headline = parts[0].strip()
            source_name_hint = parts[1].strip()

        raw_link = getattr(entry, "link", "")
        if not raw_link:
            return None

        # Resolve genuine publisher provenance
        prov = resolve_evidence_provenance(
            url=raw_link,
            source_name=source_name_hint,
            discovery_provider="google_news_rss",
            discovery_query=query.query_text,
            discovery_url=raw_link,
            discovered_at=datetime.now(timezone.utc).isoformat()
        )

        # Summary
        summary = getattr(entry, "summary", None)
        if summary:
            summary = sanitize_text(summary)

        # Published date
        published_at = None
        event_date = None
        pub_raw = getattr(entry, "published", None) or getattr(entry, "updated", None)
        if pub_raw:
            try:
                dt = date_parser.parse(pub_raw)
                published_at = dt.strftime("%Y-%m-%d")
                event_date = published_at
            except Exception:
                pass

        return NormalizedCandidate(
            source_name=prov.source_name,
            source_domain=prov.source_domain,
            source_type=prov.source_type,
            headline=headline,
            summary=summary[:500] if summary else headline,
            body=summary,
            url=prov.canonical_url,
            canonical_url=canonicalize_url(prov.canonical_url),
            published_at=published_at,
            event_date=event_date,
            collected_at=datetime.now(timezone.utc).isoformat(),
            language=query.language,
            section="Discovery",
            issue=query.issue,
            tags=[query.issue],
            raw_metadata={
                "source_tier": prov.source_tier,
                "discovery_provider": prov.discovery_provider,
                "discovery_query": prov.discovery_query,
                "discovery_url": prov.discovery_url,
                "discovered_at": prov.discovered_at,
                "query_id": query.id,
                "query_type": query.query_type,
                "governorate_hint": query.governorate
            }
        )
