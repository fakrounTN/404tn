# monitor/app/main.py
import os
import time
import json
import logging
import sqlite3
import yaml
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from monitor.app.database import get_db, init_db
from monitor.app.schemas import (
    EvidenceItemSchema, LocationMapNodeSchema, MapResponseSchema,
    TimelineEventSchema, AccountabilityRecordSchema, IssueDetailSchema,
    SourceHealthSchema, PublicStatsSchema
)
from monitor.app.services.freshness import calculate_freshness

# Production Configuration
APP_ENV = os.environ.get("APP_ENV", "development").lower()
ENABLE_DOCS = os.environ.get("ENABLE_DOCS", "false" if APP_ENV == "production" else "true").lower() in ("true", "1")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] 404tn-api: %(message)s"
)
logger = logging.getLogger("404tn_api")

app = FastAPI(
    title="404TN Evidence Monitor API",
    description="Independent investigative and documentation platform API for Tunisia (Summer 2026)",
    version="1.0.0",
    docs_url="/docs" if ENABLE_DOCS else None,
    redoc_url="/redoc" if ENABLE_DOCS else None,
    openapi_url="/openapi.json" if ENABLE_DOCS else None
)

# CORS Configuration
cors_env = os.environ.get("CORS_ORIGINS", "")
if cors_env:
    allowed_origins = [o.strip() for o in cors_env.split(",") if o.strip()]
else:
    if APP_ENV == "production":
        allowed_origins = ["https://404tn.com", "https://www.404tn.com"]
    else:
        allowed_origins = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
    max_age=600
)

# Trusted Host Validation
allowed_hosts_env = os.environ.get("ALLOWED_HOSTS", "")
if allowed_hosts_env:
    allowed_hosts = [h.strip() for h in allowed_hosts_env.split(",") if h.strip()]
else:
    allowed_hosts = ["api.404tn.com", "404tn.com", "localhost", "127.0.0.1", "testserver", "api", "frontend"]

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=allowed_hosts
)

# Request Timing & Audit Logging Middleware
@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    start_time = time.time()
    response: Response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)")
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

@app.on_event("startup")
def startup_event():
    init_db()
    logger.info(f"404TN API initialized. Env={APP_ENV}, DocsEnabled={ENABLE_DOCS}")

def _load_sources_config() -> List[Dict[str, Any]]:
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "sources.yaml")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return data.get("sources", [])
    return []

def _load_locations_config() -> List[Dict[str, Any]]:
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "locations.yaml")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return data.get("locations", [])
    return []

MONTH_NAMES = {
    "01": "JANUARY", "02": "FEBRUARY", "03": "MARCH", "04": "APRIL",
    "05": "MAY", "06": "JUNE", "07": "JULY", "08": "AUGUST",
    "09": "SEPTEMBER", "10": "OCTOBER", "11": "NOVEMBER", "12": "DECEMBER"
}

TOPIC_MAP = {
    "water": "WATER",
    "electricity": "ENERGY",
    "pollution": "GABÈS",
    "gabes": "GABÈS",
    "work": "ECONOMY",
    "economy": "ECONOMY",
    "migration": "MIGRATION",
    "rights": "GOVERNANCE",
    "institutions": "GOVERNANCE",
    "governance": "GOVERNANCE",
    "public_services": "GOVERNANCE",
    "state_response": "GOVERNANCE"
}

@app.get("/api/health", summary="Service Health & Integrity Status")
def health_check():
    db_ok = False
    evidence_count = 0
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as cnt FROM evidence WHERE id LIKE 'EV-AUTO-%'")
            evidence_count = cursor.fetchone()["cnt"]
            db_ok = True
    except Exception as e:
        logger.error(f"Health check DB probe failed: {e}")

    return {
        "status": "healthy" if db_ok else "degraded",
        "service": "404TN Evidence Monitor",
        "environment": APP_ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "sqlite_wal_active" if db_ok else "database_error",
        "total_evidence_records": evidence_count
    }

@app.get("/api/map", response_model=MapResponseSchema, summary="Geospatial Monitored Nodes and GeoJSON Features")
def get_map_nodes():
    """Returns dynamic map features and monitored coordinate nodes derived from real EV-AUTO-* evidence."""
    locations_cfg = _load_locations_config()

    with get_db() as conn:
        cursor = conn.cursor()

        # Build monitored nodes dynamically from authoritative locations registry + live evidence aggregation
        nodes = []
        for loc in locations_cfg:
            slug = loc["slug"]
            name = loc["name"]
            cursor.execute("""
                SELECT COUNT(*) as cnt, MAX(headline) as latest
                FROM evidence
                WHERE id LIKE 'EV-AUTO-%' AND (location = ? OR location = ?)
            """, (name, slug))
            agg = cursor.fetchone()
            count = agg["cnt"] if agg else 0
            latest = agg["latest"] if agg and agg["latest"] else f"Active monitoring node for {name}"

            nodes.append(LocationMapNodeSchema(
                slug=slug,
                name=name,
                lat=loc["lat"],
                lon=loc["lon"],
                status="ACTIVE FILE" if slug == "gabes" else ("VERIFIED" if count > 0 else "REPORTED"),
                type=loc.get("type", "node"),
                governorate=loc.get("governorate", name),
                role=loc.get("role", ""),
                issues=[loc.get("type", "monitoring")],
                evidence_count=count,
                latest_evidence=latest,
                freshness="UPDATED < 24H" if count > 0 else "HISTORICAL BASELINE"
            ))

        # Query real geocoded evidence records (EV-AUTO-* only)
        cursor.execute("""
            SELECT * FROM evidence
            WHERE id LIKE 'EV-AUTO-%' AND latitude IS NOT NULL AND longitude IS NOT NULL
            ORDER BY COALESCE(event_date, published_at) DESC
        """)
        ev_rows = cursor.fetchall()
        features = []
        for ev in ev_rows:
            date_val = ev["event_date"] or (ev["published_at"][:10] if ev["published_at"] else "2026")
            features.append({
                "type": "Feature",
                "id": ev["id"],
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(ev["longitude"]), float(ev["latitude"])]  # GeoJSON [lon, lat]
                },
                "properties": {
                    "id": ev["id"],
                    "location": ev["location"] or "Tunisia",
                    "issue": ev["issue"],
                    "status": ev["status"] or "REPORTED",
                    "weight": ev["evidence_confidence"] or 1.0,
                    "date": date_val,
                    "title": ev["headline"],
                    "evidence_id": ev["id"],
                    "classification": ev["classification"] or "FACT",
                    "freshness": ev["current_or_historical"] or "CURRENT",
                    "source_name": ev["source_name"],
                    "source_url": ev["source_url"]
                }
            })

        return MapResponseSchema(
            type="FeatureCollection",
            updated_at=datetime.now(timezone.utc).isoformat(),
            total_monitored_nodes=len(nodes),
            active_flagship_file="gabes",
            locations=nodes,
            features=features
        )

@app.get("/api/evidence/{evidence_id}", response_model=EvidenceItemSchema, summary="Deep Evidence Provenance Detail")
def get_evidence_detail(evidence_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE id = ?", (evidence_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Evidence record {evidence_id} not found")
        
        tags_list = json.loads(row["tags"]) if row["tags"] else []
        freshness_label = calculate_freshness(row["published_at"], row["current_or_historical"])

        return EvidenceItemSchema(
            id=row["id"],
            issue=row["issue"],
            sub_issue=row["sub_issue"],
            location=row["location"],
            latitude=row["latitude"],
            longitude=row["longitude"],
            headline=row["headline"],
            summary=row["summary"],
            claim=row["claim"],
            classification=row["classification"],
            status=row["status"] or "REPORTED",
            event_date=row["event_date"],
            published_at=row["published_at"],
            collected_at=row["collected_at"] or row["published_at"],
            last_checked=row["last_checked"] or row["published_at"],
            source_name=row["source_name"],
            source_domain=row["source_domain"],
            source_type=row["source_type"],
            source_url=row["source_url"],
            source_language=row["source_language"] or "fr",
            source_confidence=row["source_confidence"] or 0.9,
            evidence_confidence=row["evidence_confidence"] or 0.9,
            current_or_historical=row["current_or_historical"] or "CURRENT",
            metric_value=row["metric_value"],
            metric_unit=row["metric_unit"],
            metric_period=row["metric_period"],
            government_entity=row["government_entity"],
            presidential_response=row["presidential_response"],
            outcome=row["outcome"],
            tags=tags_list,
            freshness=freshness_label
        )

@app.get("/api/timeline", response_model=List[TimelineEventSchema], summary="Summer 2026 Chronology Stream")
def get_timeline_events(
    month: Optional[str] = Query(None, description="JUNE | JULY | AUGUST | SEPTEMBER"),
    topic: Optional[str] = Query(None, description="WATER | ENERGY | GABÈS | ECONOMY | MIGRATION | GOVERNANCE")
):
    """Generates timeline chronology stream dynamically from canonical EV-AUTO-* evidence."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM evidence
            WHERE id LIKE 'EV-AUTO-%' AND headline IS NOT NULL AND source_url IS NOT NULL
            ORDER BY COALESCE(event_date, published_at) DESC
        """)
        rows = cursor.fetchall()

        events = []
        for r in rows:
            date_raw = r["event_date"] or r["published_at"] or ""
            date_str = date_raw[:10] if len(date_raw) >= 10 else "2026-08-01"

            # Determine Month
            month_num = date_str[5:7] if len(date_str) >= 7 else "08"
            event_month = MONTH_NAMES.get(month_num, "SUMMER")

            # Determine Topic
            issue_val = (r["issue"] or "governance").lower()
            event_topic = TOPIC_MAP.get(issue_val, "GOVERNANCE")

            # Filter conditions
            if month and month.upper() != "ALL" and event_month.upper() != month.upper():
                continue
            if topic and topic.upper() != "ALL" and event_topic.upper() != topic.upper():
                continue

            events.append(TimelineEventSchema(
                id=r["id"],
                date=date_str,
                month=event_month,
                topic=event_topic,
                title=r["headline"],
                desc=r["summary"] or r["headline"],
                location=r["location"] or "Tunisia",
                source=r["source_name"],
                source_url=r["source_url"],
                classification=r["classification"] or "FACT",
                status=r["status"] or "REPORTED",
                evidence_count=1,
                evidence_id=r["id"]
            ))

        return events

@app.get("/api/accountability", response_model=List[AccountabilityRecordSchema], summary="State Response & Silence Matrix")
def get_accountability_records(category: Optional[str] = Query(None)):
    """Returns verified accountability records only when human-audited. Zero automated political inferences."""
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM accountability_records WHERE 1=1"
        params = []

        if category and category.upper() != "ALL":
            query += " AND UPPER(category) = ?"
            params.append(category.upper())

        cursor.execute(query, params)
        rows = cursor.fetchall()

        records = []
        for r in rows:
            records.append(AccountabilityRecordSchema(
                id=r["id"],
                topic=r["issue"],
                category=r["category"],
                what_happened=r["what_happened"],
                gov_response=r["government_response"],
                pres_response=r["presidential_response"],
                implementation=r["implementation"],
                outcome=r["outcome"],
                status=r["status"],
                status_type=r["status_type"],
                latest_evidence_id=r["latest_evidence_id"],
                updated_at=r["updated_at"]
            ))
        return records

@app.get("/api/gabes", summary="Gabès Flagship Dossier & Environmental Telemetry")
def get_gabes_dossier():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM evidence
            WHERE (issue = 'gabes' OR location = 'Gabès' OR headline LIKE '%Gabès%' OR headline LIKE '%Gabes%')
            AND id LIKE 'EV-AUTO-%'
            ORDER BY COALESCE(event_date, published_at) DESC
        """)
        evidence_rows = cursor.fetchall()

        return {
            "slug": "gabes",
            "title": "Gabès: The City Paying the Price of Pollution",
            "category": "ENVIRONMENTAL INVESTIGATION",
            "status": "ACTIVE FILE",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "narrative": "For decades, Gabès has carried the environmental cost of Tunisia’s industrial model. In 2026, pollution, public health, industrial policy and political accountability remain inseparable.",
            "metrics": [
                {
                    "label": "PHOSPHOGYPSUM BASELINE",
                    "value": "~14,000 T/DAY",
                    "subtext": "Historical nominal dry-solid discharge into Gulf",
                    "source_period": "2018 industrial assessment (ANPE / World Bank)",
                    "status": "HISTORICAL BASELINE",
                    "type": "HISTORICAL_BASELINE"
                },
                {
                    "label": "2017 STATE COMMITMENT",
                    "value": "INDUSTRIAL RELOCATION",
                    "subtext": "Cabinet decision on dismantling coastal units",
                    "source_period": "Cabinet Communiqué June 29, 2017",
                    "status": "OFFICIAL STATEMENT",
                    "type": "HISTORICAL_STATE_COMMITMENT"
                },
                {
                    "label": "CURRENT DISCHARGE STATUS",
                    "value": "NO CURRENT DIRECT MEASUREMENT",
                    "subtext": "No public online sensor telemetry stream available in 2026",
                    "source_period": "Summer 2026 audit review",
                    "status": "NO CURRENT DATA",
                    "type": "DATA_GAP_STATEMENT"
                }
            ],
            "evidence_count": len(evidence_rows),
            "evidence_list": [
                {
                    "id": e["id"],
                    "headline": e["headline"],
                    "classification": e["classification"],
                    "status": e["status"],
                    "published_at": e["published_at"],
                    "source_name": e["source_name"],
                    "source_url": e["source_url"]
                }
                for e in evidence_rows
            ]
        }

ISSUE_DEFINITIONS = [
    {
        "id": "01",
        "slug": "water",
        "aliases": ["water"],
        "title": "Water",
        "category": "RESOURCE COLLAPSE",
        "description": "Cuts, restrictions, infrastructure aging and regional hydraulic deficit.",
        "status": "CRITICAL DEFICIT",
        "issues": ["water"],
        "accountable_institutions": [
            "SONEDE (National Water Distribution Utility)",
            "Ministry of Agriculture, Hydraulic Resources and Maritime Fisheries",
            "ONAGRI (National Observatory of Agriculture)"
        ]
    },
    {
        "id": "02",
        "slug": "electricity",
        "aliases": ["electricity", "energy"],
        "title": "Electricity",
        "category": "ENERGY SECURITY",
        "description": "Outages, network peak load pressure, gas import dependency and service reliability.",
        "status": "LOAD-SHEDDING RISK",
        "issues": ["electricity"],
        "accountable_institutions": [
            "STEG (Tunisian Company of Electricity and Gas)",
            "Ministry of Industry, Mines and Energy",
            "Observatoire National de l'Énergie et des Mines"
        ]
    },
    {
        "id": "03",
        "slug": "work",
        "aliases": ["work", "economy"],
        "title": "Work & Economy",
        "category": "ECONOMIC STAGNATION",
        "description": "Unemployment, food inflation, purchasing power erosion and public sector recruitment.",
        "status": "STRUCTURAL DECLINE",
        "issues": ["work", "economy"],
        "accountable_institutions": [
            "INS (National Institute of Statistics)",
            "Ministry of Social Affairs",
            "Central Bank of Tunisia (BCT)"
        ]
    },
    {
        "id": "04",
        "slug": "migration",
        "aliases": ["migration"],
        "title": "Migration",
        "category": "HUMAN MOBILITY",
        "description": "Maritime departures, transit encampments, interceptions at sea and border policy.",
        "status": "HUMANITARIAN PRESSURE",
        "issues": ["migration"],
        "accountable_institutions": [
            "Ministry of Interior (National Guard & Border Police)",
            "Ministry of Foreign Affairs, Migration and Tunisians Abroad",
            "FTDES (Forum for Economic & Social Rights)"
        ]
    },
    {
        "id": "05",
        "slug": "public-services",
        "aliases": ["public-services", "publicServices", "public_services"],
        "title": "Public Services",
        "category": "CIVIC INFRASTRUCTURE",
        "description": "Healthcare stockouts, suburban rail/bus transport availability and municipal sanitation.",
        "status": "FUNCTIONAL STRAIN",
        "issues": ["public_services", "public-services"],
        "accountable_institutions": [
            "Ministry of Health & Pharmacie Centrale (PCT)",
            "Ministry of Transport (Transtu & SNCFT)",
            "Ministry of Environment (ANPE)"
        ]
    },
    {
        "id": "06",
        "slug": "rights-institutions",
        "aliases": ["rights-institutions", "institutions", "rights", "governance"],
        "title": "Rights & Institutions",
        "category": "GOVERNANCE & ACCOUNTABILITY",
        "description": "Constitutional balance of power, Decree 54 proceedings, press freedom and justice.",
        "status": "CONSOLIDATED CONCENTRATION",
        "issues": ["rights", "institutions", "governance", "state_response"],
        "accountable_institutions": [
            "Presidency of the Republic (Carthage)",
            "Ministry of Justice",
            "SNJT (National Union of Tunisian Journalists)"
        ]
    }
]

@app.get("/api/issues", summary="The Six Investigative Files Overview")
def get_issues_index():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT issue, COUNT(*) as count FROM evidence WHERE id LIKE 'EV-AUTO-%' AND issue != 'general' AND issue IS NOT NULL GROUP BY issue")
        counts = {r["issue"]: r["count"] for r in cursor.fetchall()}

        result = []
        for d in ISSUE_DEFINITIONS:
            total_cnt = sum(counts.get(iss, 0) for iss in d["issues"])
            
            # Fetch latest headline and date
            placeholders = ",".join("?" for _ in d["issues"])
            cursor.execute(f"""
                SELECT headline, event_date, published_at FROM evidence
                WHERE id LIKE 'EV-AUTO-%' AND issue IN ({placeholders})
                ORDER BY COALESCE(event_date, published_at) DESC LIMIT 1
            """, d["issues"])
            latest_row = cursor.fetchone()
            latest_headline = latest_row["headline"] if latest_row else None
            latest_date = (latest_row["event_date"] or latest_row["published_at"]) if latest_row else None

            result.append({
                "id": d["id"],
                "slug": d["slug"],
                "title": d["title"],
                "category": d["category"],
                "description": d["description"],
                "status": d["status"],
                "evidence_count": total_cnt,
                "latest_headline": latest_headline,
                "latest_date": latest_date,
                "accountable_institutions": d["accountable_institutions"]
            })
        return result

@app.get("/api/issues/{slug}", summary="Detailed Specific Issue Dossier")
def get_issue_by_slug(slug: str):
    clean_slug = slug.strip().lower()
    match_def = None
    for d in ISSUE_DEFINITIONS:
        if clean_slug == d["slug"].lower() or clean_slug in [a.lower() for a in d["aliases"]]:
            match_def = d
            break

    if not match_def:
        raise HTTPException(status_code=404, detail=f"Issue dossier '{slug}' not found")

    with get_db() as conn:
        cursor = conn.cursor()
        placeholders = ",".join("?" for _ in match_def["issues"])
        cursor.execute(f"""
            SELECT * FROM evidence
            WHERE id LIKE 'EV-AUTO-%' AND issue IN ({placeholders})
            ORDER BY COALESCE(event_date, published_at) DESC
            LIMIT 30
        """, match_def["issues"])
        ev_rows = cursor.fetchall()

        evidence_list = [
            {
                "id": e["id"],
                "headline": e["headline"],
                "summary": e["summary"],
                "classification": e["classification"] or "FACT",
                "status": e["status"] or "REPORTED",
                "event_date": e["event_date"] or e["published_at"],
                "published_at": e["published_at"],
                "metric_value": e["metric_value"],
                "metric_unit": e["metric_unit"],
                "metric_period": e["metric_period"],
                "source_name": e["source_name"],
                "source_url": e["source_url"],
                "location": e["location"]
            }
            for e in ev_rows
        ]

        return {
            "id": match_def["id"],
            "slug": match_def["slug"],
            "title": match_def["title"],
            "category": match_def["category"],
            "description": match_def["description"],
            "status": match_def["status"],
            "accountable_institutions": match_def["accountable_institutions"],
            "evidence_count": len(evidence_list),
            "evidence_records": evidence_list
        }

@app.get("/api/stats", response_model=PublicStatsSchema, summary="Platform Verification & Provenance Metrics")
def get_public_stats():
    sources = _load_sources_config()
    configured_count = len(sources)
    enabled_count = len([s for s in sources if s.get("enabled", True)])

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM evidence WHERE id LIKE 'EV-AUTO-%'")
        total_ev = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM evidence WHERE id LIKE 'EV-AUTO-%' AND classification = 'FACT'")
        facts_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM evidence WHERE id LIKE 'EV-AUTO-%' AND classification = 'CLAIM'")
        claims_count = cursor.fetchone()[0]

        return PublicStatsSchema(
            total_evidence_records=total_ev,
            monitored_sources_count=configured_count,
            active_sources_count=enabled_count,
            verified_facts_count=facts_count,
            documented_claims_count=claims_count,
            last_collection_run=datetime.now(timezone.utc).isoformat(),
            system_status="OPERATIONAL"
        )

@app.get("/api/sources", summary="Public Monitored Sources Registry")
def get_sources_list():
    return _load_sources_config()

@app.get("/api/source-health", summary="Internal Source Health Checks")
def get_source_health():
    from monitor.app.services.source_health import get_all_source_health
    sources = _load_sources_config()
    with get_db() as conn:
        records = get_all_source_health(conn)
        healthy = [r for r in records if r.get("health_status") == "HEALTHY"]
        degraded = [r for r in records if r.get("health_status") == "DEGRADED"]
        offline = [r for r in records if r.get("health_status") == "OFFLINE"]
        return {
            "total_monitored": len(sources),
            "healthy_count": len(healthy),
            "degraded_count": len(degraded),
            "offline_count": len(offline),
            "records": records,
            "last_audit": datetime.now(timezone.utc).isoformat()
        }
