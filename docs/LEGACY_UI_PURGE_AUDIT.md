# 404TN — POST-DEPLOY LEGACY UI PURGE AUDIT REPORT
**Corpus / Environment**: `404tn.com` / Independent Investigative Platform  
**Target Release**: Post-Deploy Legacy UI Purge & Architecture Consolidation  
**Audit Timestamp**: 2026-09-11T03:58:30+02:00  
**Audit Status**: COMPLETE  
**Final Release Gate Verdict**: `READY_FOR_LEGACY_UI_FIX_REVIEW`

---

## 1. Executive Summary & Root Cause Analysis

### Problem Description
Following the deployment of commit `15efbe4` ("feat: rebuild 404TN investigative frontend"), users performing a hard browser refresh on `https://404tn.com` or navigating via SPA observed legacy Phase A/B UI components rendering intermittently instead of the approved editorial design system (*Investigative Newspaper × Political Archive × Evidence Database × Documentary Experience*).

### Root Causes Identified
1. **Monolithic Legacy Markup in `index.html`**:
   Source `index.html` still contained over 800 lines of obsolete Phase A/B mockup sections (`#hero`, `#summer-2026`, `#the-files`, `#geospatial-monitor`, `#gabes`, `#state-response`, `#presidency`, `#timeline`, `#methodology`, `#statement`) nested within `<div id="content-views">`.
2. **SSG Prerender Injection Defect in `scripts/prerender.mjs`**:
   - For route `/`, `prerenderRoute()` previously left `baseHtml` unmodified, thereby serving the unpurged Phase A/B HTML directly.
   - For subpages, `prerenderRoute()` injected subpage content above the old monolithic sections without purging the underlying markup, causing duplicate DOM blocks and H1 tags.
3. **SPA Router Delegation Mismatch in `src/router.js` & `src/main.js`**:
   Client-side navigation for standard routes simply toggled `.hidden` classes and scrolled down to obsolete mockup containers rather than mounting the modern modular page renderers from `src/pages/`.
4. **Surviving Obsolete Data Constants in `src/main.js`**:
   `PRESIDENCY_DATA` and `initPoliticalChronology()` with legacy tab selectors (`data-presidency-year`) were still present and executing in `src/main.js`.

---

## 2. Inventory of Purged Legacy Artifacts

| Component / Section | Previous Location | Action Taken |
| :--- | :--- | :--- |
| **Old Hero Section** (`#hero`) | `index.html:133-223` | **PURGED**: Replaced with `renderHomepageHtml()` |
| **Old Summer 2026 Section** (`#summer-2026`) | `index.html:228-268` | **PURGED**: Routed to modular `renderSummer2026Html()` |
| **Old Seven Files Grid** (`#the-files`) | `index.html:273-360` | **PURGED**: Routed to modular `renderTheFilesHtml()` |
| **Old Geospatial Block** (`#geospatial-monitor`) | `index.html:366-440` | **PURGED**: Routed to modular `renderGeospatialHtml()` |
| **Old Gabès Story** (`#gabes`) | `index.html:445-528` | **PURGED**: Routed to modular `renderGabesReportViewHtml()` |
| **Old State Response Table** (`#state-response`) | `index.html:533-586` | **PURGED**: Routed to modular `renderStateResponseHtml()` |
| **Old Presidency Mockup** (`#presidency`) | `index.html:591-654` | **PURGED**: Routed to modular `renderPresidencyReportViewHtml()` |
| **Old Presidency Constants & Tabs** | `src/main.js:272-380` | **PURGED**: Completely removed `PRESIDENCY_DATA` and `initPoliticalChronology()` |
| **Old Timeline Section** (`#timeline`) | `index.html:659-701` | **PURGED**: Routed to modular `renderTimelineHtml()` |
| **Old Methodology Section** (`#methodology`) | `index.html:706-785` | **PURGED**: Routed to modular `renderMethodologyHtml()` |
| **Old Statement Section** (`#statement`) | `index.html:790-824` | **PURGED**: Routed to modular `renderStatementHtml()` |

---

## 3. Structural & Architectural Solutions Implemented

### A. Clean Base Shell (`index.html`)
- Retains only essential global chrome: sticky header, mobile drawer, `<div id="content-views">`, 404 view, footer, and utility modals (Evidence Drawer, Secure Drop, Arabic Notice).
- Contains zero legacy mockup markup.

### B. Unified Route View Dispatcher (`src/main.js` & `src/router.js`)
- `src/router.js` delegates route resolution to `renderRouteView(cleanPath, routeConfig)`.
- Client-side navigation cleanly replaces `#content-views.innerHTML` with the corresponding page renderer:
  - `/` &rarr; `renderHomepageHtml()`
  - `/summer-2026` &rarr; `renderSummer2026Html()`
  - `/the-files` &rarr; `renderTheFilesHtml()`
  - `/gabes` &rarr; `renderGabesReportViewHtml()`
  - `/presidency` &rarr; `renderPresidencyReportViewHtml()`
  - `/timeline` &rarr; `renderTimelineHtml()` + `initTimelineController()`
  - `/state-response` &rarr; `renderStateResponseHtml()` + `initAccountabilityController()`
  - `/evidence` &rarr; `renderEvidenceHtml()`
  - `/methodology` &rarr; `renderMethodologyHtml()`
  - `/statement` &rarr; `renderStatementHtml()`
  - `/geospatial-monitor` &rarr; `renderGeospatialHtml()` + `initGeospatialMonitor()`
  - `/issues/*` &rarr; `renderDossierViewHtml(issueKey)`
- Dynamic API hydration (stats, Gabès dossier, issue details) executes seamlessly without rendering artifacts from old versions.

### C. Deterministic Build-Time SSG Prerender (`scripts/prerender.mjs`)
- Uses index-based clean slice substitution to replace `<div id="content-views">...</div>` with the exact, single-H1 static HTML for all 20 canonical and alias routes.
- Fully aligns static prerendered files on disk with client-side SPA runtime view generation.

---

## 4. Route-by-Route Verification Matrix (20 Routes)

| # | Route | Page Type | Single H1 | Canonical Status | Robots Meta | Verification |
| :- | :--- | :--- | :---: | :--- | :--- | :---: |
| 1 | `/` | `website` | **1** | `https://404tn.com/` | `index, follow` | **PASS** |
| 2 | `/summer-2026` | `article` | **1** | `https://404tn.com/summer-2026` | `index, follow` | **PASS** |
| 3 | `/the-files` | `collection` | **1** | `https://404tn.com/the-files` | `index, follow` | **PASS** |
| 4 | `/gabes` | `article` | **1** | `https://404tn.com/gabes` | `index, follow` | **PASS** |
| 5 | `/timeline` | `collection` | **1** | `https://404tn.com/timeline` | `index, follow` | **PASS** |
| 6 | `/state-response` | `dataset` | **1** | `https://404tn.com/state-response` | `index, follow` | **PASS** |
| 7 | `/evidence` | `collection` | **1** | `https://404tn.com/evidence` | `index, follow` | **PASS** |
| 8 | `/methodology` | `website` | **1** | `https://404tn.com/methodology` | `index, follow` | **PASS** |
| 9 | `/geospatial-monitor` | `dataset` | **1** | `https://404tn.com/geospatial-monitor` | `index, follow` | **PASS** |
| 10 | `/presidency` | `article` | **1** | `https://404tn.com/presidency` | `index, follow` | **PASS** |
| 11 | `/statement` | `website` | **1** | `https://404tn.com/statement` | `index, follow` | **PASS** |
| 12 | `/issues/water` | `article` | **1** | `https://404tn.com/issues/water` | `index, follow` | **PASS** |
| 13 | `/issues/electricity` | `article` | **1** | `https://404tn.com/issues/electricity` | `index, follow` | **PASS** |
| 14 | `/issues/pollution` | `article` | **1** | `https://404tn.com/issues/pollution` | `index, follow` | **PASS** |
| 15 | `/issues/work` | `article` | **1** | `https://404tn.com/issues/work` | `index, follow` | **PASS** |
| 16 | `/issues/migration` | `article` | **1** | `https://404tn.com/issues/migration` | `index, follow` | **PASS** |
| 17 | `/issues/public-services` | `article` | **1** | `https://404tn.com/issues/public-services` | `index, follow` | **PASS** |
| 18 | `/issues/rights` | `article` | **1** | `https://404tn.com/issues/rights` | `index, follow` | **PASS** |
| 19 | `/geospatial` | `dataset` (alias) | **1** | `https://404tn.com/geospatial-monitor` | `noindex, follow` | **PASS** |
| 20 | `/issues/rights-institutions` | `article` (alias) | **1** | `https://404tn.com/issues/rights` | `noindex, follow` | **PASS** |

---

## 5. Test & Quality Gate Verification Results

1. **Record of Power Architecture Tests (`npm run test:rop`)**:
   - Status: **PASS (23 / 23)**
2. **SEO Registry & Prerender Assertion Tests (`npm run test:seo`)**:
   - Status: **PASS (592 / 592)**
3. **Static Site Build & Prerender Generation (`npm run build`)**:
   - Status: **PASS (20 / 20 routes generated, 18 canonical sitemap URLs)**
4. **Python Backend & Telemetry Tests (`python -m unittest discover -s monitor/tests`)**:
   - Status: **PASS (306 / 306)**
5. **Git Whitespace & Diff Check (`git diff --check`)**:
   - Status: **CLEAN (0 errors)**

---

## 6. Audit Verdict

```
============================================================
404TN POST-DEPLOY LEGACY UI PURGE AUDIT
FINAL VERDICT: READY_FOR_LEGACY_UI_FIX_REVIEW
============================================================
```
