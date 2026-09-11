# 404TN FULL FRONTEND REBUILD — MASTER SPECIFICATION & ARCHITECTURAL RECORD
**Product**: [404tn.com](https://404tn.com)  
**Approved Direction**: *Investigative Newspaper × Political Archive × Evidence Database × Documentary Experience*  
**Date**: September 11, 2026  
**Status**: RELEASE CANDIDATE (R2.2 Frontend Rebuild)

---

## 1. Master Design Direction & Visual Identity

The rebuilt 404TN frontend completely replaces the generic corporate dashboard aesthetic with a solemn, authoritative, documentary investigative publication. The visual identity draws inspiration from the *Financial Times*, *Le Monde*, archival registers, and intelligence dossiers.

### Core Visual Principles
- **Newspaper Restraint**: Dense, typography-forward compositions, hairline rules, wide margins, and disciplined typographic hierarchy.
- **Archival Precision**: High-contrast dark charcoal backgrounds (`#0B0C0D`), warm bone typography (`#F1F0EC`), archival sand accents (`#D4C5B0`), and muted crimson callouts (`#C93636`).
- **Zero-Card Architecture**: Avoidance of rounded "SaaS cards." Content is framed with hairline borders (`#26282B`), source slips, and metadata banners.
- **Evidentiary Rigor**: Every factual statement is paired with explicit provenance markers, cryptographic verification IDs, and epistemic badges.

---

## 2. Complete Color Palette & Token System

All color tokens are formalized in [`src/editorial-tokens.js`](file:///d:/404TN/src/editorial-tokens.js) and configured in Tailwind CSS:

| Token Name | Hex Code | Purpose & Semantic Application |
|---|---|---|
| `background` | `#0B0C0D` | Master page background; near-black charcoal |
| `background-elevated` | `#111315` | Section panels, table backgrounds, and drawer surfaces |
| `surface-950` | `#0E0F11` | Deep canvas backgrounds for cartographic projections |
| `surface-900` | `#17191C` | Secondary containers, inset blocks, table headers |
| `surface-800` | `#26282B` | Hairline dividers, borders, and structural frames |
| `surface-700` | `#3D4046` | Hover borders, active states, and secondary rules |
| `surface-500` | `#70747D` | Timestamps, index numbering, subtle metadata |
| `surface-400` | `#8F949D` | Secondary captions, source citations, context notes |
| `surface-300` | `#B8BCC4` | Supporting narrative prose and explanatory text |
| `surface-200` | `#DCDFE4` | Primary body text and direct quotes |
| `bone-100` | `#F1F0EC` | Editorial headlines, H1/H2 titles, key statistics |
| `bone-200` | `#E5E4DE` | Section kickers, pull quotes, lead sentences |
| `crimson` | `#C93636` | Brand wordmark, active alerts, urgent findings |
| `crimson-muted` | `#962828` | Background tints, low-intensity warnings |
| `sand` | `#D4C5B0` | Archival badges, source classifications, historical records |
| `emerald-400` | `#34D399` | Verified epistemic status badges |
| `amber-400` | `#FBBF24` | Attributed claims and under-review markers |

---

## 3. Typography System & Hierarchy

The typography combines three specialized font families to balance editorial authority, readability, and technical precision:

```
Headlines & Narrative Pulls  →  Newsreader (Editorial Serif)
Body Copy & Core UI Layout   →  Plus Jakarta Sans (Modern Geometric Sans)
Metadata, IDs & Telemetry   →  JetBrains Mono (Technical Monospace)
```

### Typographic Hierarchy

1. **Document H1**: `Newsreader`, `text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-bone-100 leading-[1.12]`. Exactly one per page.
2. **Section Headings (H2)**: `Newsreader`, `text-2xl sm:text-3xl lg:text-4xl text-bone-100 font-normal`.
3. **Subsection Titles (H3)**: `Newsreader`, `text-xl sm:text-2xl text-bone-100 font-normal`.
4. **Section Kickers**: `JetBrains Mono`, `text-[10px] sm:text-xs tracking-widest uppercase font-semibold text-crimson`.
5. **Body Text**: `Plus Jakarta Sans`, `text-sm sm:text-base font-light text-surface-300 leading-relaxed`.
6. **Data Slips & Metadata**: `JetBrains Mono`, `text-[11px] sm:text-xs uppercase tracking-wider text-surface-400`.
7. **Archival Numerals**: `Newsreader` italic numerals (`.num-archival`), rendering large figures with historical gravitas.

---

## 4. Layout System & Grid Geometry

- **Container Constraint**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Editorial Asymmetry**: 12-column responsive layout grids (e.g. 7-col narrative + 5-col telemetry; 8-col chronology + 4-col evidence index).
- **Hairline Divider Rules**: 1px solid borders (`.rule-404`, `.newspaper-rule`, `.newspaper-rule-strong`) separating editorial chapters without bulky padding.
- **Margin Notes & Slips**: Right-rail margin annotations (`.doc-margin-note`) displaying source references alongside the text.

---

## 5. Component Library & Editorial Primitives

Located in [`src/editorial-components.js`](file:///d:/404TN/src/editorial-components.js), the 24 reusable editorial primitives ensure complete cross-page UI consistency:

1. `investigationHero(props)`: Solemn documentary header with eyebrow, title (single H1), subtitle, metadata strip, and summary.
2. `editorialPageIntro(kicker, title, lead, metadata)`: Section entry banner with breadcrumbs and narrative kicker.
3. `sectionKicker(text, color)`: Monospace tracking uppercase kicker badge.
4. `sectionHeading(title, subtitle)`: Editorial serif H2 with optional deck.
5. `editorialRule(spacing, tone)`: 1px hairline rule separator.
6. `recordRow(record)`: Structured data entry with date, classification badge, description, and source slip.
7. `chronologyRow(item)`: Timeline milestone with phase marker, date badge, and institutional accountability outcome.
8. `evidenceFootnote(id, citation)`: Monospace citation slip anchored to verification registry.
9. `sourceReference(source)`: Authoritative source slip with tier rating and archive link.
10. `classificationBadge(classification, status)`: Epistemic separation pill (`FACT`, `CLAIM · ATTRIBUTED`, `ANALYSIS`).
11. `responsibilityBlock(institution, role, mandates)`: Institutional accountability attribution block.
12. `dataGapBlock(title, description)`: Transparent public disclosure of state statistical opacity.
13. `keyStatistic(value, label, subtext, delta)`: Archival numeral metric callout.
14. `pullQuote(quote, attribution, title)`: Editorial quotation with red hairline bar.
15. `timelineMarker(date, era, active)`: Chronological navigation checkpoint.
16. `institutionReference(name, code, role)`: Formal state organ tag.
17. `documentReference(decreeNum, date, title, jortRef)`: Legal gazette citation block.
18. `issueNavigation(currentKey)`: Editorial index of all 7 investigative files.
19. `relatedInvestigation(title, slug, kicker, deck)`: Cross-link card to sister investigations.
20. `methodologyNote(note)`: Technical standards disclosure callout.
21. `stateResponseBlock(pledged, delivered, gap)`: 3-column promise-vs-reality matrix.
22. `comparisonBlock(said, record)`: Juxtaposition of official statements versus documented records.
23. `archiveIndex(entries)`: Tabular directory of indexed investigative artifacts.
24. `regionalEvidenceBlock(governorate, alerts, status)`: Geographic incident callout.

---

## 6. Route Inventory & Canonical URL Strategy

The platform serves 18 canonical routes and 2 aliases (20 prerendered endpoints). Every canonical URL is apex-bound (`https://404tn.com`) with zero query strings, hash anchors, or trailing slashes (except root).

| # | Route | Canonical URL | Type | Primary Heading / Function |
|---|---|---|---|---|
| 1 | `/` | `https://404tn.com/` | Canonical | Front Page: Master Investigative Overview |
| 2 | `/summer-2026` | `https://404tn.com/summer-2026` | Canonical | Summer 2026: Pressure Escalation Dossier |
| 3 | `/the-files` | `https://404tn.com/the-files` | Canonical | The Seven Files: Master Issue Archive |
| 4 | `/gabes` | `https://404tn.com/gabes` | Canonical | Gabès: Ecological & Industrial Flagship |
| 5 | `/timeline` | `https://404tn.com/timeline` | Canonical | Timeline: Incident & Protest Chronology |
| 6 | `/state-response` | `https://404tn.com/state-response` | Canonical | State Response: Institutional Accountability Matrix |
| 7 | `/evidence` | `https://404tn.com/evidence` | Canonical | Evidence Register: Primary Document Archive |
| 8 | `/methodology` | `https://404tn.com/methodology` | Canonical | Methodology: Verification & Sourcing Standards |
| 9 | `/geospatial-monitor` | `https://404tn.com/geospatial-monitor` | Canonical | Geospatial Monitor: 24 Governorates Telemetry |
| 10 | `/presidency` | `https://404tn.com/presidency` | Canonical | The Record of Power: Kais Saied (2019–2026) |
| 11 | `/statement` | `https://404tn.com/statement` | Canonical | Mission Statement: Independence & Principles |
| 12 | `/issues/water` | `https://404tn.com/issues/water` | Canonical | File 01: Water Deficit & Hydraulic Stress |
| 13 | `/issues/electricity` | `https://404tn.com/issues/electricity` | Canonical | File 02: Electricity & Grid Load Shedding |
| 14 | `/issues/pollution` | `https://404tn.com/issues/pollution` | Canonical | File 03: Pollution & Environmental Collapse |
| 15 | `/issues/work` | `https://404tn.com/issues/work` | Canonical | File 04: Work, Unemployment & Wage Stagnation |
| 16 | `/issues/migration` | `https://404tn.com/issues/migration` | Canonical | File 05: Migration, Borders & Mediterranean Policy |
| 17 | `/issues/public-services` | `https://404tn.com/issues/public-services` | Canonical | File 06: Public Services, Health & Transport |
| 18 | `/issues/rights` | `https://404tn.com/issues/rights` | Canonical | File 07: Rights & Freedoms (Decree 54) |
| 19 | `/geospatial` | `https://404tn.com/geospatial-monitor` | Alias (`noindex`) | Canonicalizes to `/geospatial-monitor` |
| 20 | `/issues/rights-institutions` | `https://404tn.com/issues/rights` | Alias (`noindex`) | Canonicalizes to `/issues/rights` |

---

## 7. Prerender & Static Site Generation (Zero-JS Readable SSG)

All 20 routes are statically precompiled at build time by [`scripts/prerender.mjs`](file:///d:/404TN/scripts/prerender.mjs).
- **Non-JS Legibility**: Every route's `index.html` contains the full textual content, headings, statistics, evidence tables, and methodology notes.
- **Search Engine Optimization**: Full unique `<title>`, `<meta name="description">`, `<link rel="canonical">`, `<meta property="og:*">`, and `<script type="application/ld+json">` graphs on all generated files.
- **Sitemap Synchronization**: Auto-generated [`sitemap.xml`](file:///d:/404TN/dist/sitemap.xml) contains exactly the 18 canonical URLs.

---

## 8. Single H1 Enforcement

Strict HTML5 semantic outlining rules are enforced on all routes:
- On the root route (`/`), the hero headline is the single `<h1>`.
- On all subpages, the root hero `<h1>` is demoted to `<h2>`, while the subpage hero rendered by `investigationHero()` or the subpage banner serves as the single, authoritative `<h1>`.
- Automated test suite verifies that `count(<h1>) === 1` for all 20 prerendered files.

---

## 9–19. Modular Page Architecture Overviews

- **Home Page (`src/pages/home-page.js`)**: Master index uniting the lead Gabès investigation, the 7 Files directory, the Kais Saied Record of Power teaser, Summer 2026 escalation metrics, institutional accountability overview, and live evidence register previews.
- **Summer 2026 Dossier (`src/pages/summer-page.js`)**: Month-by-month crisis escalation documentation (June–September 2026), detailing the convergence of hydraulic deficits, grid outages, and civil liberties arrests.
- **The Seven Files Archive (`src/pages/the-files-page.js`)**: Comprehensive catalog of Files 01 through 07 with status badges, key metrics, and accountable institution mappings.
- **Gabès Flagship Investigation (`src/dossier-data.js`)**: Investigative deep dive into the Chatt Essalam chemical complex, 14,000 tonnes/day phosphogypsum coastal runoff, and the unenforced 2017 Cabinet relocation decree.
- **The Record of Power (`src/presidency-data.js` & `src/record-of-power/`)**: Authoritative documentary chronology across 5 eras (2019 Mandate, 2021 Rupture, 2022 System, 2024 Consolidation, 2026 Outcomes) backed by 18 structured seed records and multi-hop accountability traces.
- **Documentary Timeline (`src/pages/timeline-page.js`)**: Interactive, filterable chronological log of utility curtailments, public protests, decree enactments, and state statements.
- **State Response Matrix (`src/pages/state-response-page.js`)**: Institutional tracking grid applying the 6-question accountability grammar to evaluate government responses against verifiable reality.
- **Geospatial Incident Monitor (`src/pages/geospatial-page.js`)**: Geographic coordinate projection across 24 governorates with territorial telemetry, layer filtering, and hotspot analysis.
- **Evidence Register (`src/pages/evidence-page.js`)**: Primary research catalog with cryptographic verification IDs, publication dates, and source links.
- **Methodology & Standards (`src/pages/methodology-page.js`)**: Transparent disclosure of epistemic standards, source hierarchy, error correction policy, and data gap handling.
- **Mission Statement (`src/pages/statement-page.js`)**: Public declaration of independent Tunisian political opposition stance and refusal to compromise evidentiary standards.

---

## 20. Epistemic Classification Framework

404TN enforces a strict 3-tier epistemic categorization across all published content:

1. `FACT`: Verifiable, empirical statements backed by official gazettes (JORT), technical audits, utility bulletins, court records, or multi-source corroborated reporting.
2. `CLAIM · ATTRIBUTED`: Statements, promises, explanations, or allegations made by state officials, political figures, or advocacy organizations. Always presented with explicit attribution.
3. `ANALYSIS`: Structured editorial assessments, multi-hop accountability traces, and cross-sectoral correlations derived logically from documented facts.
4. `DATA GAPS`: Explicitly marked disclosures where state agencies withhold, obscure, or fail to publish essential public metrics (e.g., continuous air quality sensor feeds in Gabès).

---

## 21. Source Provenance Hierarchy

Every documented point is mapped to a 4-tier source authority model:
- **Tier 1 (Primary Official / Legal Records)**: JORT Official Gazette, ministerial decrees, court filings, central bank bulletins, utility communiqués (SONEDE/STEG/ONAGRI).
- **Tier 2 (Independent Institutional / NGO Monitoring)**: FTDES Social Observatory, SNJT press freedom reports, IWatch legal audits, Arab Barometer polling data.
- **Tier 3 (International Technical Audits)**: World Bank development assessments, IMF staff reports, ANPE technical surveys, sovereign ratings (Moody's/Fitch).
- **Tier 4 (Corroborated Investigative Reporting)**: Multi-source verified investigative press reports, verified photographic evidence, local journalist testimony.

---

## 22. Accountability Grammar & 6-Question Framework

The platform organizes state scrutiny around a standardized 6-question framework:
1. *What happened?* (Empirical event / crisis).
2. *What did the government say?* (Official communiqués & statements).
3. *What did President Kais Saied state?* (Direct presidential declarations).
4. *What legal basis or decree was used?* (Statutory authority invoked).
5. *Which institution held responsibility?* (Accountable state organs).
6. *What was the documented outcome?* (Verifiable empirical result).

---

## 23. Verification & Quality Assurance Results

| Test Suite | Commands | Results | Status |
|---|---|---|---|
| **SEO & SSG Prerender** | `npm run test:seo` | 581 / 581 tests passed (0 failures) | **PASS** |
| **Record of Power Architecture** | `npm run test:rop` | 23 / 23 tests passed (0 failures) | **PASS** |
| **Production Build** | `npm run build` | 20 / 20 routes generated cleanly | **PASS** |
| **Backend & Pipeline Unit Tests** | `python -m unittest discover -s monitor/tests` | 306 / 306 tests passed (0 failures) | **PASS** |
| **Git Diff Syntax & Check** | `git diff --check` | 0 whitespace or formatting errors | **PASS** |
