# 404TN Main Platform Production Readiness Report

**Platform Domain:** `404tn.com`  
**API Domain:** `api.404tn.com`  
**Status:** COMPLETE & FULLY HARDENED (READY FOR VPS PILOT)  
**Date:** 2026-09-03  

---

## 1. Executive Summary

The main 404TN investigative platform and backend evidence API have been productionized and hardened. All core criteria—secret elimination, containerization, SQLite WAL durability, native database backups, strict CORS, host filtering, bilingual SEO routes, sitemaps, robots.txt, frontend bundle optimization, and GitHub Actions CI—have been verified locally.

---

## 2. Production Architecture

```
                       [ PUBLIC INTERNET ]
                               │
                               │ HTTPS (443 / 80)
                               ▼
        ┌────────────────────────────────────────────────────────┐
        │                 Caddy Edge Reverse Proxy               │
        │               (Strict TLS, HSTS, CSP, Gzip)            │
        └──────────────────────────────┬─────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            │                                                     │
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│ 404tn_frontend:8080   │                             │ 404tn_api:8000        │
│ Nginx Unprivileged    │                             │ Python 3.12 / FastAPI │
│ (Compiled SPA + Static│                             │ (Non-root user 10001) │
│ Bilingual Pre-renders)│                             └───────────┬───────────┘
└───────────────────────┘                                         │
                                                                  ▼
                                                      ┌───────────────────────┐
                                                      │ SQLite 3 (WAL Mode)   │
                                                      │ /data/404tn.db        │
                                                      │ Persistent Volume     │
                                                      └───────────────────────┘
```

---

## 3. Files Created and Modified

### Newly Created Production Files
- [`deploy/docker-compose.production.yml`](file:///d:/404TN/deploy/docker-compose.production.yml) — Production compose file with unprivileged containers, persistent volume mounts, internal network isolation, and healthchecks.
- [`deploy/Caddyfile.example`](file:///d:/404TN/deploy/Caddyfile.example) — Hardened Caddy reverse-proxy configuration with compression, HSTS, and custom MapLibre/CARTO CSP.
- [`deploy/nginx.conf`](file:///d:/404TN/deploy/nginx.conf) — Unprivileged Nginx web server config with cache-control headers (1y for hashed assets, no-cache for index.html) and SPA fallbacks.
- [`Dockerfile`](file:///d:/404TN/Dockerfile) — Multi-stage Node 22 build $ightarrow$ Nginx unprivileged production image.
- [`monitor/Dockerfile`](file:///d:/404TN/monitor/Dockerfile) — Hardened Python 3.12-slim backend image with `appuser` (UID 10001) and Uvicorn workers.
- [`monitor/scripts/backup_db.py`](file:///d:/404TN/monitor/scripts/backup_db.py) — Native SQLite `conn.backup()` online backup utility.
- [`public/robots.txt`](file:///d:/404TN/public/robots.txt) — Crawl directives with sitemap reference.
- [`public/sitemap.xml`](file:///d:/404TN/public/sitemap.xml) — XML sitemap with bilingual hreflang alternates.
- [`public/404.html`](file:///d:/404TN/public/404.html) — Investigative 404 error page.
- [`public/en/`](file:///d:/404TN/public/en/) & [`public/ar/`](file:///d:/404TN/public/ar/) — 12 pre-rendered bilingual static routes for search engine indexing.
- [`.github/workflows/ci.yml`](file:///d:/404TN/.github/workflows/ci.yml) — Continuous integration workflow running frontend builds, backend unit tests, schema tests, and secret checks.
- [`.env.example`](file:///d:/404TN/.env.example) — Template with public/private variable separation and placeholders.
- [`.gitignore`](file:///d:/404TN/.gitignore) & [`.dockerignore`](file:///d:/404TN/.dockerignore) — Production-safe ignore configurations.
- [`SECURITY.md`](file:///d:/404TN/SECURITY.md) — Responsible vulnerability disclosure policy.
- [`README.md`](file:///d:/404TN/README.md) — Comprehensive technical documentation.

### Modified Files
- [`monitor/app/main.py`](file:///d:/404TN/monitor/app/main.py) — Hardened with `TrustedHostMiddleware`, strict CORS origins, environment-driven doc disabling, timing audit logs, and DB-verifying `/api/health`.
- [`monitor/app/database.py`](file:///d:/404TN/monitor/app/database.py) — Configured with `PRAGMA busy_timeout=5000` and `PRAGMA synchronous=NORMAL`.
- [`src/map.js`](file:///d:/404TN/src/map.js) — Converted heavy 6.2MB GeoJSON from static bundle import to dynamic fetch from `/data/`, reducing initial bundle size by 97%.
- [`src/api.js`](file:///d:/404TN/src/api.js) — Dynamic `VITE_API_URL` configuration.
- [`vite.config.js`](file:///d:/404TN/vite.config.js) — Chunk splitting isolating `vendor-maplibre`.
- [`index.html`](file:///d:/404TN/index.html) — Eliminated hardcoded CARTO API key.

---

## 4. Secret & Credential Audit

- **Audit Methodology:** Comprehensive regex scan across all tracked repository files (.py, .js, .json, .yaml, .html, .md, Dockerfiles, compose files).
- **Hardcoded Secrets Removed:** 100% (CARTO key removed from `index.html`).
- **Production Configuration:** All secrets and credentials read from `.env` and environment variables.
- **Git Hygiene:** `.env` and `.env.local` strictly ignored via `.gitignore`.
- **Secret Scan Result:** **PASS** (0 secrets in tracked repository).

---

## 5. Security & Network Hardening

| Component | Setting | Value |
|---|---|---|
| **CORS** | Production Origins | `https://404tn.com`, `https://www.404tn.com` |
| **Host Validation** | Allowed Hosts | `api.404tn.com`, `404tn.com`, `localhost`, `127.0.0.1` |
| **API Docs** | Production State | Disabled (`docs_url=None`, `openapi_url=None`) |
| **Transport Security** | HSTS | `max-age=31536000; includeSubDomains; preload` |
| **Content Security** | CSP | Restricts scripts, allows WebGL workers & CARTO raster tiles |
| **Container Permissions** | Backend User | `appuser:appgroup` (UID:GID 10001) |
| **Container Permissions** | Frontend User | `nginx` (UID 101 unprivileged) |
| **Security Options** | Docker Security Opt | `no-new-privileges:true`, `cap_drop: [ALL]` |
| **Network Exposure** | Direct Ports | 0 public host ports published (internal proxy only) |

---

## 6. SQLite Durability & Backup Verification

- **Journal Mode:** `WAL` (Write-Ahead Logging)
- **Concurrency Controls:** `PRAGMA busy_timeout=5000;`, `PRAGMA synchronous=NORMAL;`
- **Integrity:** `PRAGMA foreign_keys=ON;`
- **Volume Location:** `/data/404tn.db` (Persistent Docker named volume `404tn_db_data`)
- **Native Backup Test:** Verified `monitor/scripts/backup_db.py` executing `src_conn.backup(dst_conn)` to `/backups/404tn-YYYYMMDD-HHMMSS.db` (Result: **PASS**, 290,816 bytes snapshot created with zero read/write locks).

---

## 7. Performance & Frontend Bundle Optimization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ VITE PRODUCTION BUNDLE TELEMETRY                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ dist/index.html                           68.36 kB │ gzip:  13.25 kB        │
│ dist/assets/index-DJwsdO0_.css           116.20 kB │ gzip:  17.36 kB        │
│ dist/assets/index-BdKzpBxc.js             51.01 kB │ gzip:  15.93 kB        │
│ dist/assets/vendor-maplibre-BL6BFbSx.js  993.50 kB │ gzip: 263.41 kB        │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Core JS Reduction:** Main script bundle reduced from **1,833 kB** to **51.01 kB** (**97.2% reduction**).
- **MapLibre Chunk Isolation:** Isolated WebGL map runtime into `vendor-maplibre`.
- **Dynamic GeoJSON:** Governorates polygon data served dynamically as static JSON with 1-hour HTTP caching.

---

## 8. SEO, Internationalization & Metadata Verification

- **Robots.txt:** Verified at [`public/robots.txt`](file:///d:/404TN/public/robots.txt) pointing to authoritative sitemap.
- **XML Sitemap:** Verified at [`public/sitemap.xml`](file:///d:/404TN/public/sitemap.xml) detailing 24 canonical routes with bilingual `<xhtml:link rel="alternate">` tags.
- **Bilingual Static Routes:** 12 pre-rendered HTML dossiers created for Gabès, Water, Electricity, Pollution, Migration, and Timeline (`/en/` and `/ar/`).
- **Structured Data:** JSON-LD schema validated for `Organization`, `WebSite`, `CollectionPage`, and `BreadcrumbList`.
- **Language Tags:** Proper `lang="en" dir="ltr"` and `lang="ar" dir="rtl"` attributes enforced.

---

## 9. Test Suite Telemetry

- **Unit Tests:** 17/17 PASS in 0.94s (`monitor/tests/run_tests.py`)
- **Source Diagnostic Test:** 12 PASS, 0 PARTIAL, 0 FAIL, 3 DISABLED (with documented reasons)
- **NPM Audit:** 0 vulnerabilities
- **API Stability:** 10/10 endpoints HTTP 200 OK

---

## 10. Deployment Readiness Decision

- **GitHub Repository Ready:** **YES**
- **VPS Pilot Ready:** **YES**
