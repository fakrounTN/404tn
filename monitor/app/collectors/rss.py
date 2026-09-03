# monitor/app/collectors/rss.py
import time
import feedparser
from datetime import datetime, timezone
from typing import List, Tuple, Optional, Any
from dateutil import parser as date_parser

from monitor.app.collectors.base import BaseCollector, NormalizedCandidate, DiscoveryMetrics
from monitor.app.services.normalizer import canonicalize_url, sanitize_text

class RSSCollector(BaseCollector):
    """Collector for genuine XML/RSS/Atom feeds."""

    def collect(self) -> Tuple[List[NormalizedCandidate], DiscoveryMetrics]:
        start_time = time.time()
        metrics = DiscoveryMetrics(source_id=self.source_id)
        candidates: List[NormalizedCandidate] = []

        target_urls = self.urls
        if not target_urls:
            metrics.last_error = "No feed URLs configured"
            return candidates, metrics

        try:
            with self.get_http_client() as client:
                for feed_url in target_urls:
                    try:
                        res = self.fetch_with_retry(client, feed_url)
                        if metrics.http_status is None:
                            metrics.http_status = res.status_code

                        if res.status_code == 200:
                            parsed_feed = feedparser.parse(res.text)
                            entries = parsed_feed.entries or []
                            metrics.items_discovered += len(entries)

                            selected_entries = entries[:self.max_items]
                            metrics.items_selected += len(selected_entries)

                            for entry in selected_entries:
                                metrics.items_fetched += 1
                                try:
                                    candidate = self._parse_entry(entry, feed_url)
                                    if candidate and candidate.headline:
                                        candidates.append(candidate)
                                        metrics.items_parsed += 1
                                    else:
                                        metrics.parse_failures += 1
                                except Exception:
                                    metrics.parse_failures += 1

                    except Exception as exc:
                        metrics.last_error = f"Error fetching RSS feed {feed_url}: {str(exc)}"

        except Exception as global_exc:
            metrics.last_error = str(global_exc)
            if metrics.http_status is None:
                metrics.http_status = 500

        metrics.duration_ms = round((time.time() - start_time) * 1000, 2)
        return candidates, metrics

    def _parse_entry(self, entry: Any, feed_url: str) -> Optional[NormalizedCandidate]:
        headline = getattr(entry, "title", "")
        headline = sanitize_text(headline)
        if not headline or len(headline) < 3:
            return None

        raw_link = getattr(entry, "link", "")
        canonical_url = canonicalize_url(raw_link) if raw_link else feed_url

        # Summary and Body extraction
        summary = getattr(entry, "summary", None)
        if summary:
            summary = sanitize_text(summary)

        body = None
        if hasattr(entry, "content") and entry.content:
            body = sanitize_text(entry.content[0].value)
        elif summary:
            body = summary

        # Date parsing
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

        # Tags
        tags = []
        if hasattr(entry, "tags"):
            for t in entry.tags:
                term = getattr(t, "term", None)
                if term:
                    tags.append(term)

        return NormalizedCandidate(
            source_name=self.name,
            source_domain=self.domain,
            source_type=self.source_type,
            headline=headline,
            summary=summary[:400] if summary else None,
            body=body,
            url=raw_link,
            canonical_url=canonical_url,
            published_at=published_at,
            event_date=event_date,
            collected_at=datetime.now(timezone.utc).isoformat(),
            language=self.language,
            section="Feed",
            tags=tags,
            raw_metadata={"feed_url": feed_url}
        )
