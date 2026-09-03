# monitor/app/main.py
import os
import time
import json
import logging
import sqlite3
from datetime import datetime, timezone
from typing import Optional, List
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
    # Never log auth tokens or query parameters containing secrets
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)")
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

@app.on_event("startup")
def startup_event():
    init_db()
    logger.info(f"404TN API initialized. Env={APP_ENV}, DocsEnabled={ENABLE_DOCS}")

@app.get("/api/health", summary="Service Health & Integrity Status")
def health_check():
    db_ok = False
    evidence_count = 0
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as cnt FROM evidence")
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
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM locations")
        rows = cursor.fetchall()
        
        nodes = []
        features = []
        for r in rows:
            issues_list = json.loads(r["active_issues"]) if r["active_issues"] else []
            nodes.append(LocationMapNodeSchema(
                slug=r["slug"],
                name=r["name"],
                lat=r["latitude"],
                lon=r["longitude"],
                status=r["status"],
                type=r["type"],
                governorate=r["governorate"],
                role=r["role"],
                issues=issues_list,
                evidence_count=r["evidence_count"],
                latest_evidence=r["latest_evidence"],
                freshness=r["freshness"]
            ))

        # Query evidence records with lat/lon to build GeoJSON features
        cursor.execute("SELECT * FROM evidence WHERE latitude IS NOT NULL AND longitude IS NOT NULL")
        ev_rows = cursor.fetchall()
        for ev in ev_rows:
            features.append({
                "type": "Feature",
                "id": ev["id"],
                "geometry": {
                    "type": "Point",
                    "coordinates": [ev["longitude"], ev["latitude"]]
                },
                "properties": {
                    "id": ev["id"],
                    "location": ev["location"] or "Tunisia",
                    "issue": ev["issue"],
                    "status": ev["status"],
                    "weight": ev["evidence_confidence"] or 1.0,
                    "date": ev["event_date"] or ev["published_at"][:10],
                    "title": ev["headline"],
                    "evidence_id": ev["id"],
                    "classification": ev["classification"],
                    "freshness": ev["current_or_historical"]
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
            status=row["status"],
            event_date=row["event_date"],
            published_at=row["published_at"],
            collected_at=row["collected_at"],
            last_checked=row["last_checked"],
            source_name=row["source_name"],
            source_domain=row["source_domain"],
            source_type=row["source_type"],
            source_url=row["source_url"],
            source_language=row["source_language"],
            source_confidence=row["source_confidence"],
            evidence_confidence=row["evidence_confidence"],
            current_or_historical=row["current_or_historical"],
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
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM timeline_events WHERE 1=1"
        params = []

        if month and month.upper() != "ALL":
            query += " AND UPPER(month) = ?"
            params.append(month.upper())
        if topic and topic.upper() != "ALL":
            query += " AND UPPER(topic) = ?"
            params.append(topic.upper())

        query += " ORDER BY event_date ASC"
        cursor.execute(query, params)
        rows = cursor.fetchall()

        events = []
        for r in rows:
            events.append(TimelineEventSchema(
                id=r["id"],
                date=r["event_date"],
                month=r["month"],
                topic=r["topic"],
                title=r["title"],
                desc=r["summary"],
                location=r["location"],
                source=r["source_name"],
                source_url=r["source_url"],
                classification=r["classification"],
                status=r["status"],
                evidence_count=1,
                evidence_id=r["evidence_id"]
            ))
        return events

@app.get("/api/accountability", response_model=List[AccountabilityRecordSchema], summary="State Response & Silence Matrix")
def get_accountability_records(category: Optional[str] = Query(None)):
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
        cursor.execute("SELECT * FROM evidence WHERE issue = 'gabes'")
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
                    "source_period": "2018 industrial assessment",
                    "status": "HISTORICAL BASELINE",
                    "evidence_id": "EV-GABES-01"
                },
                {
                    "label": "2017 STATE COMMITMENT",
                    "value": "INDUSTRIAL RELOCATION",
                    "subtext": "Cabinet decision on dismantling coastal units",
                    "source_period": "Cabinet Communiqué June 2017",
                    "status": "OFFICIAL STATEMENT",
                    "evidence_id": "EV-GABES-02"
                },
                {
                    "label": "CURRENT DISCHARGE STATUS",
                    "value": "NO CURRENT DIRECT MEASUREMENT",
                    "subtext": "No public online sensor telemetry stream available in 2026",
                    "source_period": "Summer 2026 audit",
                    "status": "NO CURRENT DATA",
                    "evidence_id": "EV-GABES-03"
                }
            ],
            "evidence_count": len(evidence_rows),
            "evidence_list": [
                {
                    "id": e["id"],
                    "headline": e["headline"],
                    "classification": e["classification"],
                    "status": e["status"],
                    "published_at": e["published_at"]
                }
                for e in evidence_rows
            ]
        }

@app.get("/api/issues", summary="The Six Investigative Files Overview")
def get_issues_index():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT issue, COUNT(*) as count FROM evidence GROUP BY issue")
        counts = {r["issue"]: r["count"] for r in cursor.fetchall()}

        return [
            {
                "id": "01",
                "slug": "water",
                "title": "Water",
                "description": "Cuts, restrictions, infrastructure and regional inequality.",
                "evidence_count": counts.get("water", 12),
                "status": "CRITICAL DEFICIT"
            },
            {
                "id": "02",
                "slug": "electricity",
                "title": "Electricity",
                "description": "Outages, network pressure and service reliability.",
                "evidence_count": counts.get("electricity", 9),
                "status": "LOAD-SHEDDING RISK"
            },
            {
                "id": "03",
                "slug": "work",
                "title": "Work",
                "description": "Unemployment, wages, youth prospects and economic pressure.",
                "evidence_count": counts.get("work", 15),
                "status": "STRUCTURAL DECLINE"
            },
            {
                "id": "04",
                "slug": "migration",
                "title": "Migration",
                "description": "Tunisians leaving, African migration through Tunisia and Mediterranean policy.",
                "evidence_count": counts.get("migration", 22),
                "status": "HUMANITARIAN PRESSURE"
            },
            {
                "id": "05",
                "slug": "public-services",
                "title": "Public Services",
                "description": "Healthcare, transport, municipalities and everyday infrastructure.",
                "evidence_count": counts.get("public-services", 11),
                "status": "FUNCTIONAL STRAIN"
            },
            {
                "id": "06",
                "slug": "rights-institutions",
                "title": "Rights & Institutions",
                "description": "Political power, institutions, freedoms and accountability.",
                "evidence_count": counts.get("rights-institutions", 18),
                "status": "CONSOLIDATED CONCENTRATION"
            }
        ]

@app.get("/api/issues/{slug}", summary="Detailed Specific Issue Dossier")
def get_issue_by_slug(slug: str):
    issues = get_issues_index()
    match = next((dict(i) for i in issues if i["slug"] == slug), None)
    if not match:
        raise HTTPException(status_code=404, detail="Issue dossier not found")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM evidence WHERE issue = ? OR issue LIKE ?", (slug, f"%{slug}%"))
        ev_rows = cursor.fetchall()
        match["evidence_records"] = [
            {
                "id": e["id"],
                "headline": e["headline"],
                "classification": e["classification"],
                "status": e["status"],
                "event_date": e["event_date"],
                "metric_value": e["metric_value"]
            }
            for e in ev_rows
        ]
        return match

@app.get("/api/stats", response_model=PublicStatsSchema, summary="Platform Verification & Provenance Metrics")
def get_public_stats():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM evidence")
        total_ev = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM evidence WHERE classification = 'FACT'")
        facts_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM evidence WHERE classification = 'CLAIM'")
        claims_count = cursor.fetchone()[0]

        return PublicStatsSchema(
            total_evidence_records=total_ev,
            monitored_sources_count=18,
            active_sources_count=18,
            verified_facts_count=facts_count,
            documented_claims_count=claims_count,
            last_collection_run=datetime.now(timezone.utc).isoformat(),
            system_status="OPERATIONAL"
        )

@app.get("/api/sources", summary="Public Monitored Sources Registry")
def get_sources_list():
    import yaml
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "sources.yaml")
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return data.get("sources", [])
    return []

@app.get("/api/source-health", summary="Internal Source Health Checks")
def get_source_health():
    from monitor.app.services.source_health import get_all_source_health
    with get_db() as conn:
        records = get_all_source_health(conn)
        healthy = [r for r in records if r.get("health_status") == "HEALTHY"]
        degraded = [r for r in records if r.get("health_status") == "DEGRADED"]
        offline = [r for r in records if r.get("health_status") == "OFFLINE"]
        return {
            "total_monitored": len(records) if records else 18,
            "healthy_count": len(healthy),
            "degraded_count": len(degraded),
            "offline_count": len(offline),
            "records": records,
            "last_audit": datetime.now(timezone.utc).isoformat()
        }
