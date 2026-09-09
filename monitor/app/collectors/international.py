# monitor/app/collectors/international.py
import time
import re
from typing import List, Tuple, Set, Optional, Any
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from datetime import datetime, timezone
from dateutil import parser as date_parser

from monitor.app.collectors.base import BaseCollector, NormalizedCandidate, DiscoveryMetrics
from monitor.app.services.normalizer import canonicalize_url, sanitize_text

class InternationalCollector(BaseCollector):
    """
    Collector for international wire corroboration sources (Reuters, AP).
    Crawls targeted regional feeds and topic hubs, extracting articles with full metadata.
    """

    def collect(self) -> Tuple[List[NormalizedCandidate], DiscoveryMetrics]:
        start_time = time.time()
        metrics = DiscoveryMetrics(source_id=self.source_id)
        candidates: List[NormalizedCandidate] = []

        if not self.urls:
            metrics.last_error = "No URLs configured"
            return candidates, metrics

        discovered_links: Set[str] = set()

        try:
            with self.get_http_client() as client:
                # 1. Discovery Stage
                for hub_url in self.urls:
                    try:
                        res = self.fetch_with_retry(client, hub_url)
                        if metrics.http_status is None:
                            metrics.http_status = res.status_code
                        if res.status_code == 200:
                            soup = BeautifulSoup(res.text, "html.parser")
                            base_domain = urlparse(hub_url).netloc

                            for a in soup.find_all("a", href=True):
                                href = a["href"].strip()
                                full_url = urljoin(hub_url, href)
                                parsed_link = urlparse(full_url)

                                if parsed_link.netloc == base_domain:
                                    path = parsed_link.path.lower()
                                    # Filter for article-like paths on Reuters / AP
                                    if any(p in path for p in ["/article/", "/world/africa/", "/hub/tunisia", "/article/"]) or (
                                        "apnews.com" in parsed_link.netloc and re.search(r"/[a-f0-9]{32}", path)
                                    ) or (
                                        "reuters.com" in parsed_link.netloc and ("-202" in path or "/world/" in path)
                                    ):
                                        if not any(ign in path for ign in ["/video", "/pictures", "/graphics", "/live/"]):
                                            discovered_links.add(full_url)
                    except Exception as exc:
                        metrics.last_error = f"Discovery error on {hub_url}: {str(exc)}"

                metrics.items_discovered = len(discovered_links)
                selected_links = sorted(discovered_links, reverse=True)[:self.max_items]
                metrics.items_selected = len(selected_links)

                # 2. Fetch & Parse Stage
                for art_url in selected_links:
                    try:
                        metrics.items_fetched += 1
                        art_res = self.fetch_with_retry(client, art_url)
                        if art_res.status_code != 200:
                            metrics.parse_failures += 1
                            continue

                        cand = self._parse_article(art_res.text, art_url)
                        if cand and cand.headline:
                            candidates.append(cand)
                            metrics.items_parsed += 1
                        else:
                            metrics.parse_failures += 1

                    except Exception as exc:
                        metrics.parse_failures += 1
                        metrics.last_error = f"Parse error on {art_url}: {str(exc)}"

        except Exception as global_exc:
            metrics.last_error = str(global_exc)
            if metrics.http_status is None:
                metrics.http_status = 500

        metrics.duration_ms = round((time.time() - start_time) * 1000, 2)
        return candidates, metrics

    def _parse_article(self, html_text: str, source_url: str) -> Optional[NormalizedCandidate]:
        soup = BeautifulSoup(html_text, "html.parser")

        # Headline
        headline = ""
        og_title = soup.find("meta", property="og:title")
        h1 = soup.find("h1")

        if og_title and og_title.get("content"):
            headline = og_title["content"]
        elif h1:
            headline = h1.get_text()

        headline = sanitize_text(headline)
        if not headline or len(headline) < 5:
            return None

        # Canonical URL
        canonical_url = canonicalize_url(source_url)
        og_url = soup.find("meta", property="og:url")
        link_canonical = soup.find("link", rel="canonical")
        if link_canonical and link_canonical.get("href"):
            canonical_url = canonicalize_url(link_canonical["href"])
        elif og_url and og_url.get("content"):
            canonical_url = canonicalize_url(og_url["content"])

        # Body paragraphs
        paragraphs = []
        for p in soup.find_all("p"):
            txt = sanitize_text(p.get_text())
            if len(txt) > 35 and not any(ign in txt for ign in ["All rights reserved", "Sign up here", "Read more:"]):
                paragraphs.append(txt)

        body = "\n\n".join(paragraphs) if paragraphs else ""
        summary = paragraphs[0] if paragraphs else headline

        # Date
        published_at = None
        time_tag = soup.find("time")
        if time_tag:
            datetime_attr = time_tag.get("datetime") or time_tag.get_text()
            if datetime_attr:
                try:
                    dt = date_parser.parse(datetime_attr)
                    published_at = dt.strftime("%Y-%m-%d")
                except Exception:
                    pass

        # Meta published time fallback
        if not published_at:
            meta_pub = soup.find("meta", property="article:published_time")
            if meta_pub and meta_pub.get("content"):
                try:
                    dt = date_parser.parse(meta_pub["content"])
                    published_at = dt.strftime("%Y-%m-%d")
                except Exception:
                    pass

        return NormalizedCandidate(
            source_name=self.name,
            source_domain=self.domain,
            source_type=self.source_type,
            headline=headline,
            summary=summary[:400] if summary else None,
            body=body,
            url=source_url,
            canonical_url=canonical_url,
            published_at=published_at,
            event_date=published_at,
            collected_at=datetime.now(timezone.utc).isoformat(),
            language=self.language,
            section="International Corroboration",
            raw_metadata={"url": source_url}
        )
