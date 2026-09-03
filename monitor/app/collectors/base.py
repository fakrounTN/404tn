# monitor/app/collectors/base.py
import truststore
truststore.inject_into_ssl()

import time
import httpx
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple

USER_AGENT = "404TN Evidence Monitor/1.0 (+https://404tn.com; contact: monitor@404tn.com)"

@dataclass
class NormalizedCandidate:
    source_name: str
    source_domain: str
    source_type: str
    headline: str
    summary: Optional[str] = None
    body: Optional[str] = None
    url: str = ""
    canonical_url: str = ""
    published_at: Optional[str] = None
    event_date: Optional[str] = None
    collected_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    language: str = "en"
    section: Optional[str] = None
    issue: Optional[str] = None
    classification: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    current_or_historical: str = "CURRENT"
    tags: List[str] = field(default_factory=list)
    raw_metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class DiscoveryMetrics:
    source_id: str
    http_status: Optional[int] = None
    items_discovered: int = 0
    items_selected: int = 0
    items_fetched: int = 0
    items_parsed: int = 0
    parse_failures: int = 0
    relevant_candidates: int = 0
    duplicates: int = 0
    duration_ms: float = 0.0
    last_error: Optional[str] = None

class BaseCollector(ABC):
    """Abstract base collector interface ensuring common discovery, parsing, and error isolation."""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.source_id = config.get("id", "unknown_source")
        self.name = config.get("name", self.source_id)
        self.domain = config.get("domain", "")
        self.source_type = config.get("source_type", "state_agency")
        self.language = config.get("language", "en")
        self.urls = config.get("urls", [])
        self.max_items = config.get("max_items", 25)
        self.timeout = config.get("timeout", 10.0)

    def get_http_client(self) -> httpx.Client:
        """Provides a configured HTTP client with User-Agent, timeout, and strict TLS verification."""
        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
            "Accept-Language": "en-US,en;q=0.9,fr;q=0.8,ar;q=0.7",
            "Cache-Control": "no-cache"
        }
        return httpx.Client(
            timeout=self.timeout,
            follow_redirects=True,
            headers=headers
        )

    def fetch_with_retry(
        self,
        client: httpx.Client,
        url: str,
        retries: int = 1,
        backoff_sec: float = 0.5
    ) -> httpx.Response:
        """Fetches a URL with small exponential backoff for transient failures."""
        last_exc = None
        for attempt in range(retries + 1):
            try:
                response = client.get(url)
                if response.status_code in [429, 502, 503, 504] and attempt < retries:
                    time.sleep(backoff_sec * (2 ** attempt))
                    continue
                return response
            except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as exc:
                last_exc = exc
                if attempt < retries:
                    time.sleep(backoff_sec * (2 ** attempt))
                    continue
                raise exc
            except Exception as exc:
                raise exc
        if last_exc:
            raise last_exc
        raise RuntimeError(f"Failed to fetch {url}")

    @abstractmethod
    def collect(self) -> Tuple[List[NormalizedCandidate], DiscoveryMetrics]:
        """Collects and returns candidate records and telemetry metrics."""
        pass
