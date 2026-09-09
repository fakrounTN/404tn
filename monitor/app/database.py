# monitor/app/database.py
import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "404tn.db"))

SCHEMA_SQL = '''
CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    issue TEXT NOT NULL,
    sub_issue TEXT,
    location TEXT,
    latitude REAL,
    longitude REAL,
    headline TEXT NOT NULL,
    summary TEXT NOT NULL,
    claim TEXT,
    classification TEXT NOT NULL CHECK(classification IN ('FACT', 'CLAIM', 'ANALYSIS')),
    status TEXT NOT NULL CHECK(status IN ('VERIFIED', 'OFFICIAL STATEMENT', 'REPORTED', 'UNDER REVIEW', 'HISTORICAL BASELINE', 'DISPUTED', 'NO CURRENT DATA', 'FOLLOW-UP REQUIRED', 'RESPONSE IDENTIFIED', 'DOCUMENTING', 'OUTCOME PENDING')),
    event_date TEXT,
    published_at TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    last_checked TEXT NOT NULL,
    source_name TEXT NOT NULL,
    source_domain TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_language TEXT DEFAULT 'en',
    source_confidence REAL DEFAULT 0.9,
    evidence_confidence REAL DEFAULT 0.9,
    current_or_historical TEXT CHECK(current_or_historical IN ('CURRENT', 'HISTORICAL BASELINE', 'NO RECENT MEASUREMENT')),
    metric_value TEXT,
    metric_unit TEXT,
    metric_period TEXT,
    government_entity TEXT,
    presidential_response TEXT,
    outcome TEXT,
    tags TEXT,
    content_hash TEXT UNIQUE,
    secondary_topics TEXT,
    classification_confidence REAL DEFAULT 0.9,
    classification_reason TEXT,
    ingestion_status TEXT DEFAULT 'AUTO_ACCEPTED' CHECK(ingestion_status IN ('AUTO_ACCEPTED', 'REVIEW_REQUIRED', 'REJECTED')),
    location_scope TEXT DEFAULT 'UNRESOLVED' CHECK(location_scope IN ('LOCAL', 'GOVERNORATE', 'MULTI_GOVERNORATE', 'NATIONAL', 'UNRESOLVED')),
    governorate TEXT,
    delegation TEXT,
    locality TEXT,
    location_confidence REAL DEFAULT 0.0,
    location_method TEXT DEFAULT 'UNRESOLVED'
);

CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    source_type TEXT NOT NULL,
    trust_weight REAL DEFAULT 1.0,
    check_interval_hours INTEGER DEFAULT 2,
    language TEXT DEFAULT 'ar',
    feed_url TEXT,
    last_checked TEXT,
    last_status INTEGER DEFAULT 200,
    is_active INTEGER DEFAULT 1,
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS locations (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    type TEXT NOT NULL,
    governorate TEXT NOT NULL,
    role TEXT,
    status TEXT DEFAULT 'VERIFIED',
    active_issues TEXT,
    evidence_count INTEGER DEFAULT 0,
    latest_evidence TEXT,
    freshness TEXT DEFAULT 'UPDATED < 24H'
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id TEXT PRIMARY KEY,
    event_date TEXT NOT NULL,
    month TEXT NOT NULL,
    topic TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    location TEXT,
    source_id TEXT,
    source_name TEXT NOT NULL,
    source_url TEXT,
    classification TEXT NOT NULL,
    status TEXT NOT NULL,
    evidence_id TEXT,
    FOREIGN KEY (evidence_id) REFERENCES evidence(id)
);

CREATE TABLE IF NOT EXISTS accountability_records (
    id TEXT PRIMARY KEY,
    issue TEXT NOT NULL,
    category TEXT NOT NULL,
    what_happened TEXT NOT NULL,
    government_response TEXT NOT NULL,
    presidential_response TEXT NOT NULL,
    implementation TEXT,
    outcome TEXT NOT NULL,
    status TEXT NOT NULL,
    status_type TEXT DEFAULT 'warning',
    latest_evidence_id TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (latest_evidence_id) REFERENCES evidence(id)
);
'''

INDEXES_SQL = '''
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_evidence_issue ON evidence(issue);
CREATE INDEX IF NOT EXISTS idx_evidence_published_at ON evidence(published_at);
CREATE INDEX IF NOT EXISTS idx_evidence_event_date ON evidence(event_date);
CREATE INDEX IF NOT EXISTS idx_evidence_source_domain ON evidence(source_domain);
CREATE INDEX IF NOT EXISTS idx_evidence_location ON evidence(location);
CREATE INDEX IF NOT EXISTS idx_evidence_governorate ON evidence(governorate);
CREATE INDEX IF NOT EXISTS idx_evidence_scope ON evidence(location_scope);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(status);
CREATE INDEX IF NOT EXISTS idx_evidence_ingestion_status ON evidence(ingestion_status);
CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_timeline_topic ON timeline_events(topic);
'''

def create_tables(conn_or_path):
    """Initializes standard schema, indexes, and applies idempotent column migrations."""
    if isinstance(conn_or_path, str):
        with sqlite3.connect(conn_or_path) as c:
            create_tables(c)
        return

    conn = conn_or_path
    conn.executescript(SCHEMA_SQL)

    # Idempotent column migrations for existing databases
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(evidence)")
    existing_cols = {row[1] if isinstance(row, tuple) else row["name"] for row in cursor.fetchall()}

    if "secondary_topics" not in existing_cols:
        cursor.execute("ALTER TABLE evidence ADD COLUMN secondary_topics TEXT")
    if "classification_confidence" not in existing_cols:
        cursor.execute("ALTER TABLE evidence ADD COLUMN classification_confidence REAL DEFAULT 0.9")
    if "classification_reason" not in existing_cols:
        cursor.execute("ALTER TABLE evidence ADD COLUMN classification_reason TEXT")
    if "ingestion_status" not in existing_cols:
        cursor.execute("ALTER TABLE evidence ADD COLUMN ingestion_status TEXT DEFAULT 'AUTO_ACCEPTED'")
    if "location_scope" not in existing_cols:
        cursor.execute("ALTER TABLE evidence ADD COLUMN location_scope TEXT DEFAULT 'UNRESOLVED'")
    if "governorate" not in existing_cols:
        cursor.execute("ALTER TABLE evidence ADD COLUMN governorate TEXT")
    if "delegation" not in existing_cols:
        cursor.execute("ALTER TABLE evidence ADD COLUMN delegation TEXT")
    if "locality" not in existing_cols:
        cursor.execute("ALTER TABLE evidence ADD COLUMN locality TEXT")
    if "location_confidence" not in existing_cols:
        cursor.execute("ALTER TABLE evidence ADD COLUMN location_confidence REAL DEFAULT 0.0")
    if "location_method" not in existing_cols:
        cursor.execute("ALTER TABLE evidence ADD COLUMN location_method TEXT DEFAULT 'UNRESOLVED'")

    # Create indexes after schema and columns are guaranteed to exist
    conn.executescript(INDEXES_SQL)
    conn.commit()

def get_db_connection(db_path: str = None):
    target_path = db_path or DB_PATH
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    conn = sqlite3.connect(target_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable WAL mode and production SQLite concurrency pragmas
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    conn.execute("PRAGMA busy_timeout=5000;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn

@contextmanager
def get_db(db_path: str = None):
    conn = get_db_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db(db_path: str = None):
    with get_db(db_path) as conn:
        create_tables(conn)

if __name__ == "__main__":
    init_db()
    print("Database schema initialized and indexed.")
