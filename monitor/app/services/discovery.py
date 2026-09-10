# monitor/app/services/discovery.py
import os
import yaml
import time
import urllib.parse
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any, Tuple

from monitor.app.database import get_db

CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config")

@dataclass
class DiscoveryQuery:
    id: str
    issue: str
    language: str
    query_text: str
    query_type: str  # CORE_TAXONOMY | GEOGRAPHIC_COMBO | SPECIALIST
    governorate: Optional[str] = None
    priority: int = 1
    is_active: bool = True

def load_discovery_packs_config() -> Dict[str, Any]:
    cfg_path = os.path.join(CONFIG_DIR, "discovery_packs.yaml")
    if os.path.exists(cfg_path):
        with open(cfg_path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}
    return {}

def generate_all_discovery_queries() -> List[DiscoveryQuery]:
    """
    Generates all core multilingual queries and geographic combinations
    based on discovery_packs.yaml.
    """
    cfg = load_discovery_packs_config()
    queries: List[DiscoveryQuery] = []

    # 1. Core Category Multilingual Packs
    packs = cfg.get("packs", {})
    for issue_slug, pack_data in packs.items():
        prio = pack_data.get("priority", 1)
        q_dict = pack_data.get("queries", {})
        for lang, q_list in q_dict.items():
            for idx, q_str in enumerate(q_list):
                q_id = f"core_{issue_slug}_{lang}_{idx+1}"
                queries.append(DiscoveryQuery(
                    id=q_id,
                    issue=issue_slug,
                    language=lang,
                    query_text=q_str,
                    query_type="CORE_TAXONOMY",
                    priority=prio,
                    is_active=True
                ))

    # 2. Dynamic Geographic Combinations
    geo_cfg = cfg.get("geographic_discovery", {})
    if geo_cfg.get("enabled", True):
        top_issues = geo_cfg.get("top_issues", ["water", "electricity", "pollution_environment"])
        govs = geo_cfg.get("governorates", [])

        # Issue keywords mapping for combinations
        geo_keywords = {
            "water": {"ar": "ماء", "fr": "coupure eau", "en": "water cuts"},
            "electricity": {"ar": "كهرباء", "fr": "coupure electricite", "en": "power outage"},
            "pollution_environment": {"ar": "تلوث", "fr": "pollution", "en": "pollution"},
            "work_unemployment": {"ar": "بطالة", "fr": "chomage", "en": "unemployment"},
            "migration": {"ar": "هجرة", "fr": "migration", "en": "migrants"},
            "health": {"ar": "مستشفى", "fr": "hopital", "en": "hospital"},
            "protests_social_movements": {"ar": "احتجاجات", "fr": "manifestation", "en": "protests"}
        }

        for gov in govs:
            g_slug = gov.get("slug")
            aliases = gov.get("aliases", {})
            for issue_slug in top_issues:
                kw_data = geo_keywords.get(issue_slug, {})
                for lang in ["ar", "fr"]:
                    kw = kw_data.get(lang)
                    alias_list = aliases.get(lang, [])
                    if kw and alias_list:
                        # Use the primary alias
                        alias = alias_list[0]
                        q_str = f"{kw} {alias}"
                        q_id = f"geo_{issue_slug}_{g_slug}_{lang}"
                        queries.append(DiscoveryQuery(
                            id=q_id,
                            issue=issue_slug,
                            language=lang,
                            query_text=q_str,
                            query_type="GEOGRAPHIC_COMBO",
                            governorate=g_slug,
                            priority=2,
                            is_active=True
                        ))

    return queries

def sync_discovery_queries_to_db(db_path: Optional[str] = None):
    """Idempotently syncs discovery queries into the discovery_queries table."""
    queries = generate_all_discovery_queries()
    with get_db(db_path) as conn:
        cursor = conn.cursor()
        for q in queries:
            cursor.execute("""
                INSERT OR IGNORE INTO discovery_queries (
                    id, issue, language, query_text, query_type,
                    governorate, priority, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                q.id, q.issue, q.language, q.query_text, q.query_type,
                q.governorate, q.priority, 1 if q.is_active else 0
            ))
        conn.commit()

def select_queries_for_run(
    max_queries: int = 20,
    db_path: Optional[str] = None,
    dry_run: bool = False
) -> List[DiscoveryQuery]:
    """
    Selects a balanced batch of queries for a collection cycle:
    - In live runs, syncs definitions to DB and selects with rotation
    - In dry runs, operates with zero database writes
    """
    if not dry_run:
        sync_discovery_queries_to_db(db_path)

    try:
        with get_db(db_path) as conn:
            cursor = conn.cursor()
            # 1. Pick top priority queries
            cursor.execute("""
                SELECT id, issue, language, query_text, query_type, governorate, priority, is_active
                FROM discovery_queries
                WHERE is_active = 1 AND priority = 1
                ORDER BY last_executed_at IS NOT NULL, last_executed_at ASC
                LIMIT ?
            """, (int(max_queries * 0.6),))
            rows_prio1 = cursor.fetchall()

            # 2. Pick remaining from Priority 2 / Geo combinations
            needed = max_queries - len(rows_prio1)
            cursor.execute("""
                SELECT id, issue, language, query_text, query_type, governorate, priority, is_active
                FROM discovery_queries
                WHERE is_active = 1 AND priority > 1
                ORDER BY last_executed_at IS NOT NULL, last_executed_at ASC
                LIMIT ?
            """, (needed,))
            rows_prio2 = cursor.fetchall()

            if rows_prio1 or rows_prio2:
                selected: List[DiscoveryQuery] = []
                for r in (rows_prio1 + rows_prio2):
                    selected.append(DiscoveryQuery(
                        id=r["id"],
                        issue=r["issue"],
                        language=r["language"],
                        query_text=r["query_text"],
                        query_type=r["query_type"],
                        governorate=r["governorate"],
                        priority=r["priority"],
                        is_active=bool(r["is_active"])
                    ))
                return selected
    except Exception:
        pass

    # Fallback to in-memory generated queries if DB is empty or during dry-run
    all_q = generate_all_discovery_queries()
    return all_q[:max_queries]

def build_google_news_rss_url(query: str, language: str = "fr") -> str:
    """
    Constructs an authenticated Google News RSS query endpoint.
    """
    encoded_q = urllib.parse.quote(query)
    if language == "ar":
        hl, gl, ceid = "ar", "TN", "TN:ar"
    elif language == "fr":
        hl, gl, ceid = "fr", "TN", "TN:fr"
    else:
        hl, gl, ceid = "en-US", "US", "US:en"

    return f"https://news.google.com/rss/search?q={encoded_q}&hl={hl}&gl={gl}&ceid={ceid}"

def record_query_execution_metrics(
    query_id: str,
    discovered_count: int,
    accepted_count: int,
    status_code: int = 200,
    db_path: Optional[str] = None,
    dry_run: bool = False
):
    """Updates query telemetry in discovery_queries with zero-write dry-run guarantee."""
    if dry_run:
        return
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        with get_db(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE discovery_queries
                SET last_executed_at = ?,
                    execution_count = execution_count + 1,
                    yield_discovered_count = yield_discovered_count + ?,
                    yield_accepted_count = yield_accepted_count + ?,
                    last_status = ?
                WHERE id = ?
            """, (now_iso, discovered_count, accepted_count, status_code, query_id))
            conn.commit()
    except Exception:
        pass
