# monitor/app/collectors/science.py
import time
from typing import List, Tuple, Optional
from datetime import datetime, timezone

from monitor.app.collectors.base import BaseCollector, NormalizedCandidate, DiscoveryMetrics
from monitor.app.services.normalizer import canonicalize_url, sanitize_text

class PubMedCollector(BaseCollector):
    """Dedicated collector for NCBI PubMed scientific literature on Tunisia environmental health."""

    def collect(self) -> Tuple[List[NormalizedCandidate], DiscoveryMetrics]:
        start_time = time.time()
        metrics = DiscoveryMetrics(source_id=self.source_id)
        candidates: List[NormalizedCandidate] = []

        query = self.config.get("query", "Tunisia+AND+(pollution+OR+phosphogypsum+OR+water+OR+Gabes)")
        esearch_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={query}&retmode=json&retmax={self.max_items}&sort=pub_date"

        try:
            with self.get_http_client() as client:
                res = self.fetch_with_retry(client, esearch_url)
                metrics.http_status = res.status_code

                if res.status_code == 200:
                    data = res.json()
                    id_list = data.get("esearchresult", {}).get("idlist", [])
                    metrics.items_discovered = len(id_list)
                    metrics.items_selected = len(id_list)

                    if id_list:
                        esum_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={','.join(id_list)}&retmode=json"
                        res_sum = self.fetch_with_retry(client, esum_url)

                        if res_sum.status_code == 200:
                            sum_data = res_sum.json().get("result", {})
                            for uid in id_list:
                                metrics.items_fetched += 1
                                doc = sum_data.get(uid, {})
                                if not doc or not doc.get("title"):
                                    metrics.parse_failures += 1
                                    continue

                                headline = sanitize_text(doc.get("title", ""))
                                pub_date_raw = doc.get("pubdate", "")
                                source_journal = doc.get("source", "")
                                pmid_url = f"https://pubmed.ncbi.nlm.nih.gov/{uid}/"

                                candidate = NormalizedCandidate(
                                    source_name=self.name,
                                    source_domain=self.domain or "pubmed.ncbi.nlm.nih.gov",
                                    source_type=self.source_type,
                                    headline=headline,
                                    summary=f"Peer-reviewed study published in {source_journal} ({pub_date_raw}).",
                                    body=headline,
                                    url=pmid_url,
                                    canonical_url=canonicalize_url(pmid_url),
                                    published_at=pub_date_raw[:10] if len(pub_date_raw) >= 4 else None,
                                    event_date=pub_date_raw[:10] if len(pub_date_raw) >= 4 else None,
                                    collected_at=datetime.now(timezone.utc).isoformat(),
                                    language=self.language,
                                    section="Scientific Literature",
                                    tags=["peer-reviewed", "biomedical", "environmental"],
                                    raw_metadata={"pmid": uid, "journal": source_journal}
                                )
                                candidates.append(candidate)
                                metrics.items_parsed += 1
                        else:
                            metrics.parse_failures += len(id_list)

        except Exception as exc:
            metrics.last_error = str(exc)
            if metrics.http_status is None:
                metrics.http_status = 500

        metrics.duration_ms = round((time.time() - start_time) * 1000, 2)
        return candidates, metrics
