# 404TN — Tunisia 2026 Evidence & Public Infrastructure Monitor

> **Domain:** `404tn.com`  
> **API:** `api.404tn.com`  
> **Status:** Production-Ready (Verified Locally & Hardened)  

---

## 1. Project Overview

404TN is an independent investigative documentation and evidence-monitoring platform focused on Tunisia in 2026. The platform documents systemic pressures across critical public infrastructure, services, employment, environmental health, and institutional accountability.

---

## 2. Architecture

```
Internet (HTTPS)
   │
   ▼
Caddy Edge Reverse Proxy (Port 443 / 80)
   ├── https://404tn.com     ──► 404tn_frontend:8080 (Nginx Unprivileged SPA)
   └── https://api.404tn.com ──► 404tn_api:8000 (FastAPI / SQLite WAL)
```

- **Frontend:** Static SPA built with Vite & Tailwind CSS, rendered via unprivileged Nginx with MapLibre GL geospatial clustering and pre-rendered bilingual static routes.
- **Backend API:** FastAPI application providing structured REST endpoints, strict CORS, host filtering, and epistemic classification (`FACT`, `CLAIM`, `ANALYSIS`).
- **Storage:** Persistent SQLite 3 database configured in WAL mode (`/data/404tn.db`) with native online backup tooling.
- **Collector Framework:** Multi-source modular ingestion engine querying 15 institutional, scientific, and independent sources with strict OS-level TLS verification (`truststore`).

---

## 3. Directory Layout

```
404TN/
├── frontend/ (Root)
│   ├── src/                 # Interactive controllers, MapLibre logic, drawer UI
│   ├── public/              # Robots.txt, sitemap.xml, 404.html, static pre-rendered routes
│   ├── dist/                # Production build distribution
│   ├── Dockerfile           # Multi-stage frontend container build
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration with chunk splitting
│
├── monitor/
│   ├── app/                 # FastAPI routes, schemas, database, services
│   ├── config/              # Declarative sources.yaml registry
│   ├── scripts/             # collect.py, test_sources.py, backup_db.py
│   ├── tests/               # Unit test suite (17 test fixtures)
│   ├── requirements.txt     # Python production dependencies
│   └── Dockerfile           # Hardened Python 3.12-slim backend container
│
├── deploy/
│   ├── docker-compose.production.yml  # Production container orchestration
│   ├── Caddyfile.example              # Production reverse proxy edge config
│   └── nginx.conf                     # Unprivileged frontend web server config
│
├── .github/workflows/ci.yml # Continuous integration pipeline
├── .env.example             # Safe environment template
├── .gitignore               # Production-safe repository ignore rules
├── .dockerignore            # Efficient container build exclusions
├── SECURITY.md              # Vulnerability disclosure policy
└── README.md                # Platform documentation
```

---

## 4. Local Development

### Prerequisites
- Node.js >= 20
- Python >= 3.12

### Frontend Setup
```bash
npm install
npm run dev
# Serves at http://localhost:3000
```

### Backend Setup
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r monitor/requirements.txt
uvicorn monitor.app.main:app --host 127.0.0.1 --port 8000 --reload
# Serves API at http://127.0.0.1:8000
```

---

## 5. Production Container Deployment

### 1. Configure Environment
```bash
cp .env.example .env
# Populate VITE_CARTO_API_KEY and other parameters
```

### 2. Build & Launch Containers
```bash
docker compose -f deploy/docker-compose.production.yml build
docker compose -f deploy/docker-compose.production.yml up -d
```

### 3. Run In-Container Diagnostics
```bash
# Execute collector in dry-run mode
docker compose -f deploy/docker-compose.production.yml exec api python monitor/scripts/collect.py --dry-run

# Run online database backup
docker compose -f deploy/docker-compose.production.yml exec api python monitor/scripts/backup_db.py
```

---

## 6. Testing & Quality Assurance

```bash
# Run backend test suite (17 fixtures)
python monitor/tests/run_tests.py

# Test all 15 source collectors (0 DB writes)
python monitor/scripts/test_sources.py

# Build frontend production bundle
npm run build
```

---

## 7. Security & Compliance

- Strict TLS verification enforced via `truststore` across all collectors.
- Zero commercial tracking beacons, ad scripts, or third-party fonts.
- Non-root container runtime (`appuser` UID 10001, `nginx` UID 101).
- Content-Security-Policy (CSP) tailored for MapLibre WebGL workers and CARTO raster basemaps.
- Vulnerability reporting: see [SECURITY.md](SECURITY.md).
