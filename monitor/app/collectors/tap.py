# monitor/app/collectors/tap.py
import time
import re
from typing import List, Tuple, Set, Optional
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime, timezone
from dateutil import parser as date_parser

from monitor.app.collectors.base import BaseCollector, NormalizedCandidate, DiscoveryMetrics
from monitor.app.services.normalizer import canonicalize_url, sanitize_text

class TAPCollector(BaseCollector):
    """
    Dedicated Tunis Afrique Presse (TAP) Collector.
    Scrapes real TAP English portal HTML (avoiding the broken /en/rss endpoint).
    """

    def collect(self) -> Tuple[List[NormalizedCandidate], DiscoveryMetrics]:
        start_time = time.time()
        metrics = DiscoveryMetrics(source_id=self.source_id)
        candidates: List[NormalizedCandidate] = []

        target_urls = self.urls or [
            "https://www.tap.info.tn/en",
            "https://www.tap.info.tn/en/portal%20-%20politics",
            "https://www.tap.info.tn/en/portal%20-%20economy",
            "https://www.tap.info.tn/en/Focus-Regions"
        ]

        discovered_links: Set[str] = set()

        try:
            with self.get_http_client() as client:
                # 1. DISCOVERY STAGE: Crawl portal & category pages for article hrefs
                for portal_url in target_urls:
                    try:
                        res = self.fetch_with_retry(client, portal_url)
                        if metrics.http_status is None:
                            metrics.http_status = res.status_code
                        if res.status_code == 200:
                            soup = BeautifulSoup(res.text, "html.parser")
                            for a in soup.find_all("a", href=True):
                                href = a["href"].strip()
                                # Pattern matches TAP article links in EN, FR, and AR (contains digits and hyphens)
                                if any(k.lower() in href.lower() for k in ["/portal-", "/portail-", "/focus-", "/environnement"]) and any(c.isdigit() for c in href):
                                    full_link = urljoin("https://www.tap.info.tn", href)
                                    discovered_links.add(full_link)
                                elif any(f"/{l}/" in href.lower() for l in ["en", "fr", "ar"]) and any(c.isdigit() for c in href) and "-" in href and not href.endswith((".jpg", ".pdf", ".css")):
                                    full_link = urljoin("https://www.tap.info.tn", href)
                                    discovered_links.add(full_link)
                    except Exception as exc:
                        metrics.last_error = f"Discovery error on {portal_url}: {str(exc)}"

                metrics.items_discovered = len(discovered_links)

                # 2. SELECTION STAGE: Select newest items up to max_items
                selected_links = sorted(discovered_links, reverse=True)[:self.max_items]
                metrics.items_selected = len(selected_links)

                # 3. FETCH & PARSE STAGE
                for article_url in selected_links:
                    try:
                        metrics.items_fetched += 1
                        art_res = self.fetch_with_retry(client, article_url)
                        if art_res.status_code != 200:
                            metrics.parse_failures += 1
                            continue

                        candidate = self._parse_article(art_res.text, article_url)
                        if candidate and candidate.headline:
                            candidates.append(candidate)
                            metrics.items_parsed += 1
                        else:
                            metrics.parse_failures += 1

                    except Exception as exc:
                        metrics.parse_failures += 1
                        metrics.last_error = f"Parse error on {article_url}: {str(exc)}"

        except Exception as global_exc:
            metrics.last_error = str(global_exc)
            if metrics.http_status is None:
                metrics.http_status = 500

        metrics.duration_ms = round((time.time() - start_time) * 1000, 2)
        return candidates, metrics

    def _parse_article(self, html_text: str, source_url: str) -> Optional[NormalizedCandidate]:
        """Parses a TAP article page into a NormalizedCandidate."""
        soup = BeautifulSoup(html_text, "html.parser")

        # Extract Headline
        headline = ""
        og_title = soup.find("meta", property="og:title")
        tw_title = soup.find("meta", attrs={"name": "twitter:title"})
        headline_td = soup.find("td", class_="NewsItemHeadline") or soup.find(class_=lambda c: c and "NewsItemHeadline" in c)
        h1_tag = soup.find("h1")

        if og_title and og_title.get("content"):
            headline = og_title["content"].strip()
        elif tw_title and tw_title.get("content"):
            headline = tw_title["content"].strip()
        elif headline_td:
            headline = headline_td.get_text(strip=True)
        elif h1_tag:
            headline = h1_tag.get_text(strip=True)

        headline = sanitize_text(headline)
        if not headline or len(headline) < 5:
            return None

        # Extract Canonical URL
        canonical_url = canonicalize_url(source_url)
        og_url = soup.find("meta", property="og:url")
        if og_url and og_url.get("content"):
            canonical_url = canonicalize_url(og_url["content"])

        # Extract Date
        published_at = None
        event_date = None
        now_iso = datetime.now(timezone.utc).isoformat()

        # Check NewsItemText date (e.g. "02/09/2026 09:00, Augsburg/Germany")
        for td_txt in soup.find_all(["td", "span", "div"], class_=lambda c: c and "NewsItemText" in str(c)):
            raw_t = td_txt.get_text(strip=True)
            date_match = re.search(r"(\d{2})/(\d{2})/(\d{4})", raw_t)
            if date_match:
                d, m, y = date_match.groups()
                published_at = f"{y}-{m}-{d}"
                event_date = published_at
                break

        # Extract Body Paragraphs and Content Blocks
        paragraphs = []
        # Check NewsItemCaption
        for caption_tag in soup.find_all(["td", "div", "span"], class_=lambda c: c and "NewsItemCaption" in str(c)):
            cap_txt = sanitize_text(caption_tag.get_text())
            if len(cap_txt) > 20 and "All rights reserved" not in cap_txt:
                paragraphs.append(cap_txt)

        # Check standard <p> tags
        for p in soup.find_all("p"):
            p_txt = sanitize_text(p.get_text())
            if len(p_txt) > 30 and not p_txt.startswith("©") and "All rights reserved" not in p_txt:
                paragraphs.append(p_txt)

        # Check dateline if published_at is not set yet
        if not published_at and paragraphs:
            first_p = paragraphs[0]
            dateline_match = re.search(r"\b([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\b", first_p)
            if dateline_match:
                try:
                    month_str, day_str = dateline_match.groups()
                    current_year = datetime.now().year
                    parsed_dt = date_parser.parse(f"{month_str} {day_str} {current_year}")
                    published_at = parsed_dt.strftime("%Y-%m-%d")
                    event_date = published_at
                except Exception:
                    pass

        body = "\n\n".join(paragraphs) if paragraphs else headline
        summary = paragraphs[0] if paragraphs else headline

        # Section extraction from URL
        section = "General"
        url_lower = source_url.lower()
        if "polit" in url_lower:
            section = "Politics"
        elif "econom" in url_lower:
            section = "Economy"
        elif "region" in url_lower:
            section = "Regions"
        elif "environ" in url_lower:
            section = "Environment"

        return NormalizedCandidate(
            source_name=self.name,
            source_domain=self.domain or "tap.info.tn",
            source_type=self.source_type,
            headline=headline,
            summary=summary[:400] if summary else None,
            body=body,
            url=source_url,
            canonical_url=canonical_url,
            published_at=published_at,
            event_date=event_date,
            collected_at=now_iso,
            language=self.language,
            section=section,
            raw_metadata={"raw_length": len(html_text)}
        )
