# monitor/app/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class EvidenceItemSchema(BaseModel):
    id: str
    issue: str
    sub_issue: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    headline: str
    summary: str
    claim: Optional[str] = None
    classification: str = Field(..., description="FACT | CLAIM | ANALYSIS")
    status: str
    event_date: Optional[str] = None
    published_at: str
    collected_at: str
    last_checked: str
    source_name: str
    source_domain: str
    source_type: str
    source_url: str
    source_language: str = "en"
    source_confidence: float = 0.9
    evidence_confidence: float = 0.9
    current_or_historical: str = "CURRENT"
    metric_value: Optional[str] = None
    metric_unit: Optional[str] = None
    metric_period: Optional[str] = None
    government_entity: Optional[str] = None
    presidential_response: Optional[str] = None
    outcome: Optional[str] = None
    tags: Optional[List[str]] = []
    secondary_topics: Optional[List[str]] = []
    classification_confidence: float = 0.9
    classification_reason: Optional[str] = None
    ingestion_status: str = "AUTO_ACCEPTED"
    freshness: Optional[str] = None

class GovernorateStatsSchema(BaseModel):
    slug: str
    governorate: str
    name_ar: str
    name_fr: str
    code: str
    lat: float
    lon: float
    role: Optional[str] = None
    type: Optional[str] = "governorate"
    unique_events: int = 0
    evidence_records: int = 0
    sources_count: int = 0
    water_count: int = 0
    electricity_count: int = 0
    work_count: int = 0
    migration_count: int = 0
    public_services_count: int = 0
    rights_count: int = 0
    pollution_count: int = 0
    last_updated: Optional[str] = None

class EventClusterSchema(BaseModel):
    cluster_id: str
    id: str
    issue: str
    location: str
    governorate: Optional[str] = None
    delegation: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    event_date: str
    primary_headline: str
    summary: Optional[str] = None
    source_count: int = 1
    evidence_count: int = 1
    sources: List[str] = []
    evidence_ids: List[str] = []
    status: str = "REPORTED"
    classification: str = "FACT"
    weight: float = 1.0

class LocationMapNodeSchema(BaseModel):
    slug: str
    name: str
    lat: float
    lon: float
    status: str
    type: str
    governorate: str
    role: Optional[str] = None
    issues: List[str] = []
    evidence_count: int = 0
    latest_evidence: Optional[str] = None
    freshness: str = "UPDATED < 24H"

class MapResponseSchema(BaseModel):
    type: str = "FeatureCollection"
    mode: str = "incidents"
    time_filter: str = "ALL"
    issue_filter: str = "ALL"
    disclaimer: str = "Density reflects documented evidence collected by 404TN, not a definitive measurement of real-world severity."
    updated_at: str
    total_monitored_nodes: int
    active_flagship_file: str
    governorates: List[GovernorateStatsSchema] = []
    clusters: List[EventClusterSchema] = []
    locations: List[LocationMapNodeSchema] = []
    features: List[Dict[str, Any]] = []
    national_summary: Dict[str, Any] = {}

class TimelineEventSchema(BaseModel):
    id: str
    date: str
    month: str
    topic: str
    title: str
    desc: str
    location: Optional[str] = None
    source: str
    source_url: Optional[str] = None
    classification: str
    status: str
    evidence_count: int = 1
    evidence_id: Optional[str] = None

class AccountabilityRecordSchema(BaseModel):
    id: str
    topic: str
    category: str
    what_happened: str
    gov_response: str
    pres_response: str
    implementation: Optional[str] = None
    outcome: str
    status: str
    status_type: str = "warning"
    latest_evidence_id: Optional[str] = None
    updated_at: str

class IssueDetailSchema(BaseModel):
    slug: str
    id: str
    title: str
    category: str
    status: str
    summary: str
    key_metrics: List[Dict[str, Any]] = []
    accountable_institutions: List[str] = []
    documented_events: List[Dict[str, Any]] = []
    evidence_sources: List[str] = []
    evidence_count: int = 0
    updated_at: str

class SourceHealthSchema(BaseModel):
    id: str
    name: str
    domain: str
    source_type: str
    trust_weight: float
    last_checked: Optional[str] = None
    last_status: int = 200
    is_active: bool = True
    error_message: Optional[str] = None

class PublicStatsSchema(BaseModel):
    total_evidence_records: int
    monitored_sources_count: int
    active_sources_count: int
    verified_facts_count: int
    documented_claims_count: int
    last_collection_run: str
    system_status: str
