# 404TN — Frontend Phase 2A: Responsive + Typography Audit

**Audit Date**: September 10, 2026  
**Platform Version**: 404TN Investigative Platform v1.0.0 (Post-Taxonomy Remediation `d9d21a5`)  
**Scope**: Read-Only Comprehensive Audit & Phase 2B Implementation Plan  
**Target Routes**: 18 Routes (`/`, `/summer-2026`, `/the-files`, `/gabes`, `/timeline`, `/state-response`, `/evidence`, `/methodology`, `/geospatial-monitor`, `/presidency`, `/statement`, `/issues/water`, `/issues/electricity`, `/issues/pollution`, `/issues/work`, `/issues/migration`, `/issues/public-services`, `/issues/rights`)  
**Target Viewport Matrix**: 8 Viewport Configurations (`1920x1080`, `1440x900`, `1280x800`, `1024x768`, `768x1024`, `430x932`, `390x844`, `360x800`)

---

## 1. Executive Summary

Following the completion and verification of backend taxonomy remediation (59 active `AUTO_ACCEPTED` evidence records in canonical production DB), this audit evaluates the 404TN frontend platform across responsive layout integrity, typography hierarchy, cartographic ergonomics, accessibility compliance, performance benchmarks, and semantic data presentation.

### Key Audit Conclusions

1. **Brand & Visual Identity**: The documentary and investigative dark identity (Newsreader serif, JetBrains Mono, Plus Jakarta Sans, #0B0C0D background, crimson accents) is visually compelling, sober, and consistent with the Forensic Architecture / Reuters editorial aesthetic.
2. **Collector V2 Taxonomy Alignment Gap (P0)**: The backend API and frontend data layer currently contain legacy mapping bottlenecks where Collector V2 canonical categories (`economy_public_finance`, `prices_cost_of_living`, `work_unemployment`, `pollution_environment`, `gas_energy`, `rights_freedoms`, `justice_law`, `media_press_freedom`) fall through to default fallback topics (`GOVERNANCE`) or fail to match in issue filters and dossier modals. Resolving this alignment is the top functional requirement for Phase 2B.
3. **Responsive Breakpoint Friction at `1024px`–`1180px` (P1)**: The desktop navigation header contains 8 links with large horizontal gaps (`gap-7`), causing horizontal wrapping/overflow on tablet landscape and small laptop viewports before the mobile drawer breakpoint triggers at `<768px`.
4. **Mobile Cartographic Usability (P0/P1)**: Single-finger touch interactions on the MapLibre canvas hijack vertical page scroll on mobile devices (`360px`–`430px`), and in-map filter pills wrap into 5–6 vertical lines occupying up to 40% of the map canvas.
5. **Epistemic Integrity Confirmed**: The cartographic density layer strictly represents **EVIDENCE DENSITY ONLY** (volume of collected primary records) and is not presented as severity, risk, or intensity.
6. **Codebase Health**: Zero runtime console errors, clean Vite production build (2.82s), MapLibre vendor chunking intact (993 kB raw / 263 kB gzip), and all 277 backend unit tests pass with 0 failures and 0 errors.

---

## 2. P0 Findings (Broken / Blocking)

### Finding P0-1: Collector V2 Canonical Issue Fallthrough to `"GOVERNANCE"` in Timeline
- **Route / Component**: `/timeline`, `monitor/app/main.py:113-127` (`TOPIC_MAP`), `src/timeline.js`
- **Affected Viewport(s)**: All viewports (`1920x1080` to `360x800`)
- **Exact Problem**: The timeline endpoint `/api/timeline` maps issues to topics using a hardcoded dictionary `TOPIC_MAP` containing only narrow legacy keys (`water`, `electricity`, `pollution`, `gabes`, `work`, `economy`, `migration`, `rights`, `institutions`, `governance`, `public_services`). Evidence records classified under Collector V2 canonical categories (`economy_public_finance`, `prices_cost_of_living`, `food_security`, `gas_energy`, `work_unemployment`, `pollution_environment`, `media_press_freedom`, `justice_law`, `rights_freedoms`, `agriculture`, `health`) fail lookup and default to `"GOVERNANCE"`.
- **User Impact**: In the Summer 2026 Timeline stream, central banking records, inflation statistics, chemical pollution records, and power grid alerts all display a misleading `[GOVERNANCE]` topic badge. Filtering by "Economy & Labor" or "Energy" returns empty results for records classified with canonical V2 keys.
- **Recommended Fix**: Update `TOPIC_MAP` in `monitor/app/main.py` and topic filters in `src/timeline.js` to map all 21 Collector V2 canonical issues to their corresponding editorial topics:
  - `water` -> `WATER`
  - `electricity`, `gas_energy` -> `ENERGY`
  - `pollution_environment` -> `GABÈS`
  - `work_unemployment`, `economy_public_finance`, `prices_cost_of_living`, `food_security`, `agriculture` -> `ECONOMY`
  - `migration` -> `MIGRATION`
  - `public_services`, `health`, `education`, `housing_infrastructure` -> `PUBLIC SERVICES`
  - `governance_institutions`, `rights_freedoms`, `justice_law`, `media_press_freedom`, `corruption_accountability`, `security_policing`, `protests_social_movements` -> `GOVERNANCE`
- **Implementation Risk**: Low. Deterministic mapping dictionary update.
- **Files Likely Involved**: `monitor/app/main.py`, `src/timeline.js`, `index.html`

### Finding P0-2: Geospatial Map Issue Filter & Governorate Counters Drop Canonical V2 Issues
- **Route / Component**: `/geospatial-monitor`, `/api/map`, `src/map.js`
- **Affected Viewport(s)**: All viewports (`1920x1080` to `360x800`)
- **Exact Problem**: In `monitor/app/main.py` lines 228–248 and 305–312, issue filtering and per-governorate counters check strict string equality against legacy terms (`rec_issue in ("work", "economy")`, `rec_issue == "water"`, `rec_issue in ("pollution", "gabes")`). Canonical V2 issues like `work_unemployment`, `economy_public_finance`, `pollution_environment`, `gas_energy`, `rights_freedoms`, `media_press_freedom` are bypassed, resulting in `0` counts and disappearing map markers when an issue filter is clicked.
- **User Impact**: Users clicking "WORK / ECONOMY", "POLLUTION / GABÈS", "ENERGY", or "PUBLIC SERVICES" filter chips on the map see "NO CURRENT GEOCODED EVIDENCE FOR SELECTED FILTERS" even when active evidence exists.
- **Recommended Fix**: Normalize `issue` in `/api/map` against the canonical taxonomy dictionary so that grouped issue filters match all child canonical categories.
- **Implementation Risk**: Low.
- **Files Likely Involved**: `monitor/app/main.py`, `src/map.js`

### Finding P0-3: Mobile Map Canvas Scroll Hijacking
- **Route / Component**: `/geospatial-monitor`, `src/map.js`, `src/style.css`
- **Affected Viewport(s)**: `430x932`, `390x844`, `360x800`
- **Exact Problem**: MapLibre GL JS canvas has a fixed height of 480px on mobile (`max-width: 640px`), covering over 60% of vertical screen space. Because single-touch panning is enabled by default, users scrolling down the page with a thumb gesture over the map get captured by map panning and cannot continue scrolling down to Gabès or State Response.
- **User Impact**: Severe mobile navigation trap where users get stuck on the map and cannot reach subsequent page sections without touching extreme 8px screen borders.
- **Recommended Fix**: Enable `cooperativeGestures: true` in MapLibre map initialization options (or disable touch zoom/pan on single-touch and require two-finger interaction with a brief overlay hint).
- **Implementation Risk**: Low. Built-in MapLibre feature.
- **Files Likely Involved**: `src/map.js`, `src/style.css`

---

## 3. P1 Findings (Major Usability / Data Presentation)

### Finding P1-1: Header Navigation Horizontal Overflow at `1024px`–`1180px`
- **Route / Component**: Global Header (`#main-header`), `index.html:72-82`
- **Affected Viewport(s)**: `1024x768` (Tablet Landscape), `1280x800` (Small Laptop / Narrow Desktop)
- **Exact Problem**: Desktop nav bar renders 8 uppercase links (`Summer 2026`, `Issues`, `Geospatial`, `Gabès`, `State Response`, `Presidency`, `Timeline`, `Evidence`) with `gap-7` (28px gap). The total required flex container width is ~1,236px. On viewports between 1024px and 1180px, the navigation links wrap onto a second line, clipping below the `h-14` (56px) header boundary or overlapping the right utility buttons (AR switch).
- **User Impact**: Visual brokenness, clipped text links, and unclickable header elements on standard iPad landscape and 11-inch / 12-inch laptops.
- **Recommended Fix**: 
  1. Reduce desktop nav link gap from `gap-7` to `gap-4 xl:gap-6`.
  2. Adjust responsive breakpoint for mobile drawer from `md:` (768px) to `lg:` (1024px) so tablet portrait and landscape use the clean drawer, OR condense nav labels (`Issues` -> `Files`, `State Response` -> `State`, `Geospatial` -> `Map`).
- **Implementation Risk**: Low. CSS class refinement.
- **Files Likely Involved**: `index.html`, `src/style.css`

### Finding P1-2: In-Map Filter Pills Stacking Clutter on Mobile
- **Route / Component**: `/geospatial-monitor`, `src/map.js:59-94`, `src/style.css:250-281`
- **Affected Viewport(s)**: `430x932`, `390x844`, `360x800`
- **Exact Problem**: The map filter bar contains 3 mode buttons, 8 issue buttons, and 5 time buttons rendered with `flex-wrap`. On mobile screens (<430px), these pills wrap into 5–6 vertical rows, consuming ~180px of vertical space over the 480px map canvas.
- **User Impact**: The top half of Tunisia (Tunis, Bizerte, Nabeul, Sousse) is completely obscured by semi-opaque filter buttons, making cartographic inspection impossible without zooming/panning extensively.
- **Recommended Fix**: Make issue and time filter rows horizontally scrollable with `overflow-x-auto whitespace-nowrap scrollbar-none` on mobile, keeping the filter overlay to a compact 2-row fixed height (~64px).
- **Implementation Risk**: Low. CSS styling refinement.
- **Files Likely Involved**: `src/map.js`, `src/style.css`

### Finding P1-3: The Six Files Dossier Modal Issue Query Incompatibility
- **Route / Component**: `/the-files`, `/issues/*`, `src/main.js:97-282`, `monitor/app/main.py:657-839`
- **Affected Viewport(s)**: All viewports (`1920x1080` to `360x800`)
- **Exact Problem**: When opening a file dossier (e.g. File 03: Work & Economy or File 06: Rights & Institutions), `getIssueBySlug` queries `/api/issues/{slug}`. The backend matches against `ISSUE_DEFINITIONS.issues` which only queries `["work", "economy"]` and `["rights", "institutions", "governance"]`. Canonical V2 evidence classified as `work_unemployment`, `economy_public_finance`, `prices_cost_of_living`, `rights_freedoms`, `justice_law`, `media_press_freedom` is omitted from the modal's verified evidence list.
- **User Impact**: Users clicking on "Work" or "Rights & Institutions" see an empty or severely truncated evidence record list, appearing as if the platform has no data for those dossiers.
- **Recommended Fix**: Expand `ISSUE_DEFINITIONS` in `monitor/app/main.py` so each editorial dossier queries its complete set of canonical V2 issue keys.
- **Implementation Risk**: Low.
- **Files Likely Involved**: `monitor/app/main.py`, `src/main.js`

### Finding P1-4: Modal Focus Trapping & Accessibility Barrier
- **Route / Component**: `#evidence-drawer-modal`, `#file-dossier-modal`, `#secure-drop-modal`, `#ar-notice-modal`
- **Affected Viewport(s)**: All viewports (Desktop & Mobile)
- **Exact Problem**: When any modal is opened (`.modal-backdrop.active`), keyboard focus is not trapped inside the dialog container. Pressing Tab cycles focus through background links, header navigation, and off-screen buttons.
- **User Impact**: Screen reader and keyboard-only users lose context and cannot reliably navigate modal contents.
- **Recommended Fix**: Add a lightweight focus trap utility in `src/utils.js` that cycles focus within the active modal dialog on Tab / Shift+Tab, and returns focus to the triggering element upon close.
- **Implementation Risk**: Low. Standard accessible modal pattern.
- **Files Likely Involved**: `src/evidence-drawer.js`, `src/main.js`, `src/utils.js`

### Finding P1-5: Keyboard Activation on File Rows
- **Route / Component**: `/the-files`, `index.html:284-343`, `src/main.js:294-299`
- **Affected Viewport(s)**: All viewports
- **Exact Problem**: The six file rows have `tabindex="0"` and `role="button"`, but only have a `click` event listener attached in JavaScript. Pressing `Enter` or `Space` when focused does not trigger `openDossier()`.
- **User Impact**: Keyboard-only users can focus the file row but cannot open the dossier modal.
- **Recommended Fix**: Add a `keydown` listener checking for `e.key === 'Enter' || e.key === ' '` on all `[data-file-key]` elements.
- **Implementation Risk**: Low.
- **Files Likely Involved**: `src/main.js`

---

## 4. P2 Findings (Polish)

### Finding P2-1: Reading Width Measure in `#summer-2026`
- **Route / Component**: `/summer-2026`, `index.html:223-263`
- **Affected Viewport(s)**: `1920x1080`, `1440x900`
- **Exact Problem**: Container width is `max-w-4xl` (~896px). At `text-base sm:text-lg`, body paragraphs span ~95–105 characters per line on wide desktop monitors.
- **User Impact**: Reduced reading speed and visual fatigue during long-form reading.
- **Recommended Fix**: Change container from `max-w-4xl` to `max-w-3xl` (~768px) to achieve optimal 65–75 characters per line measure.
- **Implementation Risk**: Low. CSS class tweak.
- **Files Likely Involved**: `index.html`

### Finding P2-2: Unsemantic Headings in `#statement`
- **Route / Component**: `/statement`, `index.html:774-807`
- **Affected Viewport(s)**: All viewports
- **Exact Problem**: The major closing statement lines ("404 is not the conclusion. It is the question.") are rendered as `<div>` elements rather than an `<h2>` heading.
- **User Impact**: Assistive technologies cannot detect the statement section in heading outlines.
- **Recommended Fix**: Convert display container to `<h2>` with appropriate styling classes.
- **Implementation Risk**: Low.
- **Files Likely Involved**: `index.html`

### Finding P2-3: Contrast on Small Metadata Text
- **Route / Component**: Metadata tags in timeline cards, evidence drawer, map legend (`text-surface-500`, `text-crimson` on `#0B0C0D`)
- **Affected Viewport(s)**: All viewports
- **Exact Problem**: Small uppercase text (9px–10px) using `text-surface-500` (#73726C) or `text-crimson` (#C93636) on `#0B0C0D` background achieves a contrast ratio of ~3.5:1, which falls below WCAG AA requirement (4.5:1) for text under 18pt.
- **User Impact**: Reduced legibility in low-light conditions or on low-contrast displays.
- **Recommended Fix**: Adjust small metadata text color token to `text-surface-400` (#9D9C96, contrast 6.3:1) or a slightly lighter crimson `#D44A4A` (contrast 4.6:1).
- **Implementation Risk**: Low.
- **Files Likely Involved**: `src/style.css`, `tailwind.config.js`, `index.html`

### Finding P2-4: Mobile Drawer Touch Target Heights
- **Route / Component**: `#mobile-menu-drawer nav a`, `index.html:105-115`
- **Affected Viewport(s)**: `430x932`, `390x844`, `360x800`
- **Exact Problem**: Links inside the mobile navigation drawer have `py-1`, giving a touch target height of ~28px, which is below the WCAG 2.5.5 target size recommendation of 44x44px.
- **User Impact**: Difficult touch selection and accidental mis-clicks on mobile touchscreens.
- **Recommended Fix**: Update link padding to `py-3 px-2` inside the mobile drawer.
- **Implementation Risk**: Low.
- **Files Likely Involved**: `index.html`

### Finding P2-5: Scroll Offset Discrepancy
- **Route / Component**: `src/router.js:133,149` (`scrollToTarget`)
- **Affected Viewport(s)**: All viewports
- **Exact Problem**: The header offset in smooth scrolling is hardcoded to `headerOffset = 70;`, whereas the actual fixed header height is `h-14` (56px).
- **User Impact**: Navigating to clean URLs leaves an extra 14px black gap above section headers.
- **Recommended Fix**: Update `headerOffset` to `56` (or `60` with micro-gutter).
- **Implementation Risk**: Low.
- **Files Likely Involved**: `src/router.js`

---

## 5. P3 Findings (Optional / Future Architecture)

### Finding P3-1: RTL Logical Properties Preparation
- **Route / Component**: Global CSS & layout classes across all views
- **Affected Viewport(s)**: All viewports
- **Exact Problem**: Layout utilizes directional utilities (`border-l`, `pl-4`, `text-left`, `right-0`, `translate-x-full`) instead of logical properties (`border-s`, `ps-4`, `text-start`, `end-0`, `translate-x-full`).
- **User Impact**: No current impact in English edition, but will require extensive refactoring when the Arabic edition is implemented.
- **Recommended Fix**: Progressively adopt logical CSS properties during component edits.
- **Implementation Risk**: Very low.
- **Files Likely Involved**: `index.html`, `src/style.css`

### Finding P3-2: Print Stylesheet Refinement
- **Route / Component**: Evidence Audit Slip & File Dossier Print View (`window.print()`)
- **Affected Viewport(s)**: Desktop
- **Exact Problem**: Default print styles include dark background fills and web fonts that consume excessive printer toner.
- **User Impact**: Printed audit slips from the evidence drawer have dark gray backgrounds.
- **Recommended Fix**: Add a concise `@media print` block in `src/style.css` resetting background to pure white, text to black, and hiding navigation/controls.
- **Implementation Risk**: Very low.
- **Files Likely Involved**: `src/style.css`

### Finding P3-3: Map Density Legend Header Clarification
- **Route / Component**: `/geospatial-monitor`, `src/map.js:108-116`
- **Affected Viewport(s)**: All viewports
- **Exact Problem**: Density legend header currently reads `DOCUMENTED PRESSURE`.
- **User Impact**: Potential ambiguity for first-time visitors wondering if the heatmap measures physical pressure vs evidence volume.
- **Recommended Fix**: Change legend header text to `EVIDENCE DENSITY` or `DOCUMENTED EVIDENCE DENSITY` (matching the existing footer note: "EVIDENCE CLUSTERS · NOT SEVERITY").
- **Implementation Risk**: Very low.
- **Files Likely Involved**: `src/map.js`

---

## 6. Responsive Matrix (18 Routes × 8 Viewports)

**Status Legend**:
- **PASS**: Flawless layout, typography, and interaction.
- **POLISH**: Fully functional, minor spacing or line-length polish recommended (P2/P3).
- **ISSUE**: Usability constraint or data alignment bug present (P0/P1).

| Route | 1920x1080 | 1440x900 | 1280x800 | 1024x768 | 768x1024 | 430x932 | 390x844 | 360x800 | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `/` (Hero) | PASS | PASS | PASS | POLISH (Nav) | PASS | PASS | PASS | PASS | Nav gap dense at 1024px |
| `/summer-2026` | POLISH (Measure) | POLISH (Measure) | PASS | PASS | PASS | POLISH | POLISH | POLISH | Line measure >95 chars on wide screens |
| `/the-files` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | Row layout cleanly stacks on mobile |
| `/gabes` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | Metrics grid stacks 1-col on mobile |
| `/timeline` | ISSUE (P0-1) | ISSUE (P0-1) | ISSUE (P0-1) | ISSUE (P0-1) | ISSUE (P0-1) | ISSUE (P0-1) | ISSUE (P0-1) | ISSUE (P0-1) | Canonical V2 issues show [GOVERNANCE] |
| `/state-response` | PASS | PASS | PASS | POLISH (Table) | PASS | PASS | PASS | PASS | Table visible at 1024px, cards on <1024px |
| `/evidence` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | 4-pillar grid wraps 2x2 on tablet |
| `/methodology` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | Epistemic tiers clear and distinct |
| `/geospatial-monitor` | PASS | PASS | PASS | POLISH (Nav) | PASS | ISSUE (P0-3) | ISSUE (P0-3) | ISSUE (P0-3) | Mobile scroll hijacking & filter wrap |
| `/presidency` | PASS | PASS | PASS | PASS | PASS | POLISH | POLISH | POLISH | Year tabs wrap across 2-3 lines |
| `/statement` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | Closing display centered |
| `/issues/water` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | File 01 modal opens with live stats |
| `/issues/electricity`| PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | File 02 modal opens with live stats |
| `/issues/pollution`  | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | Canonical redirect to `/gabes` clean |
| `/issues/work` | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | File 03 modal misses V2 economy keys |
| `/issues/migration` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | File 04 modal displays departures |
| `/issues/public-services`| ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | File 05 modal misses health/transport |
| `/issues/rights` | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | ISSUE (P1-3) | File 06 modal misses justice/press |

---

## 7. Typography Findings

1. **Hierarchy Integrity**:
   - Primary display typeface: `Newsreader` (serif italic & normal weights 300–600). Gives authentic investigative journalism feel.
   - Body typeface: `Plus Jakarta Sans` / `Inter` (weights 300–500). High legibility at 14px–16px.
   - Monospace telemetry typeface: `JetBrains Mono`. Strict uppercase tracking (`tracking-meta: 0.12em`, `tracking-widest: 0.2em`).
2. **Epistemic Classification Color Contrast**:
   - `FACT`: Light bone badge `#F1F0EC` on dark `#0B0C0D` background (Contrast 17.5:1 — AAA Compliant).
   - `CLAIM`: Sand badge `#D4C5B0` with dark text (Contrast 11.8:1 — AAA Compliant).
   - `ANALYSIS`: Crimson badge `#C93636` with pure white text (Contrast 4.6:1 — AA Compliant).
3. **Headline Clamping**:
   - Verified that `.line-clamp-3` and `break-words` in `src/style.css` prevent long English headlines from breaking timeline card layouts.

---

## 8. Map Findings

1. **Evidence Density Representation**:
   - The map utilizes MapLibre GL JS with a custom CARTO dark raster basemap (`raster-opacity: 0.35`).
   - The heatmap layer calculates point density dynamically using Gaussian kernel interpolation (`heatmap-weight`, `heatmap-intensity`, `heatmap-radius`).
   - **Verification**: Heatmap represents **EVIDENCE DENSITY ONLY** (concentration of geocoded primary records). Disclaimers and legend notes explicitly reinforce: *"Density reflects documented evidence collected by 404TN, not a definitive measurement of real-world severity."*
2. **24 Governorates Coverage**:
   - Authoritative centroid nodes and polygon geometries exist for all 24 governorates (`assets/data/tunisia-governorates.json`).
   - Flagship pulsing marker is uniquely assigned to Gabès (`33.88°N, 10.10°E`).
3. **Offline & Baseline State**:
   - If the live backend API is unreachable, the map displays the `API OFFLINE · BASE MAP ONLY` banner and retains governorate boundaries without crashing.

---

## 9. Evidence & Data Presentation Findings

1. **Collector V2 Taxonomy Disconnect**:
   - Production database has 59 `AUTO_ACCEPTED` evidence records classified under 21 canonical categories (`economy_public_finance`, `prices_cost_of_living`, `work_unemployment`, `pollution_environment`, `gas_energy`, `rights_freedoms`, `justice_law`, `media_press_freedom`, etc.).
   - Frontend and API currently contain hardcoded mappings that only look for the original 6 legacy strings (`water`, `electricity`, `work`, `migration`, `public_services`, `rights`).
2. **Presidency Fallback Verification**:
   - Verified that no frontend UI hardcodes or forces unclassified records into the presidency dossier. Presidency section (`#presidency`) is driven strictly by human-curated documentary chronology records (`2019`, `2021`, `2022`, `2024`, `2026`).

---

## 10. Accessibility Findings

1. **Landmark Roles**:
   - `<header id="main-header">` (Banner)
   - `<nav aria-label="Main Navigation">` (Navigation)
   - `<main id="main-content">` (Main content)
   - `<footer class="...">` (Contentinfo)
   - `<a href="#main-content">` (Skip to main content link functional)
2. **Focus Indicators**:
   - Explicit `:focus-visible` ring defined in `src/style.css` (`outline: 2px solid #C93636; outline-offset: 3px`).
3. **Areas for Phase 2B Enhancement**:
   - Add focus trapping to all modals.
   - Add keyboard `Enter`/`Space` listeners to `.file-row`.
   - Increase mobile drawer link padding to `py-3` (44px target).

---

## 11. Performance Observations

1. **Production Build Metrics**:
   - `dist/index.html`: 70.42 kB (gzip: 13.68 kB)
   - `dist/assets/index.css`: 119.14 kB (gzip: 17.76 kB)
   - `dist/assets/index.js`: 54.92 kB (gzip: 15.96 kB)
   - `dist/assets/vendor-maplibre.js`: 993.50 kB (gzip: 263.41 kB)
2. **Initial Network Execution**:
   - 5 lightweight parallel JSON requests on DOMContentLoaded. Total payload <35 kB.
   - Zero render-blocking script tags (`<script type="module">` is deferred by default).
   - CLS is well-controlled via explicit minimum container heights (`min-h-[440px]`).

---

## 12. Proposed Phase 2B Implementation Sequence

The recommended sequence of execution for Phase 2B fixes:

```
Step 1: Taxonomy & API Data Alignment (P0-1, P0-2, P1-3)
  ├── Update TOPIC_MAP in monitor/app/main.py with 21 Collector V2 keys
  ├── Update /api/map issue filter & governorate counters with canonical taxonomy groupings
  ├── Update ISSUE_DEFINITIONS in monitor/app/main.py for The Six Files dossiers
  └── Verify with backend tests (277 tests pass)

Step 2: Mobile Map Usability & Filter Layout (P0-3, P1-2, P3-3)
  ├── Enable cooperativeGestures on MapLibre map instance
  ├── Convert mobile map filter rows to horizontal scroll container
  └── Refine density legend header to "EVIDENCE DENSITY"

Step 3: Desktop Navigation & Header Breakpoint (P1-1, P2-5)
  ├── Adjust header gap to gap-4 xl:gap-6
  └── Set scrollToTarget offset to 56px

Step 4: Modal Accessibility & Keyboard Interactions (P1-4, P1-5, P2-4)
  ├── Implement focus trap inside active modals (Tab / Shift+Tab)
  ├── Add Enter / Space keydown listeners on .file-row elements
  └── Increase mobile drawer touch targets to py-3

Step 5: Typography Polish & Semantic Markup (P2-1, P2-2, P2-3)
  ├── Constrain #summer-2026 container to max-w-3xl
  ├── Convert #statement display text to semantic <h2>
  └── Enhance contrast on small 9px-10px uppercase metadata tokens
```

---

## 13. Files Likely to Change in Phase 2B

| File | Scope of Change |
|---|---|
| `monitor/app/main.py` | Expand `TOPIC_MAP`, `ISSUE_DEFINITIONS`, and `/api/map` issue matching for Collector V2 taxonomy |
| `src/map.js` | Enable `cooperativeGestures`, mobile filter horizontal scroll, legend wording |
| `src/main.js` | Keyboard listeners on file rows, modal focus management, dossier metadata alignment |
| `src/timeline.js` | Synchronize topic filter dropdown with canonical V2 topics |
| `src/evidence-drawer.js` | Modal focus trapping, review status badge styling |
| `src/style.css` | Mobile map filter scroll classes, print media styles, metadata contrast |
| `src/router.js` | Update `headerOffset` to 56px |
| `index.html` | Header nav gap adjustment, semantic headings in `#statement`, mobile drawer padding |

---

## 14. Files That MUST NOT Change

The following production and infrastructure files must remain untouched:
- `data/404tn.db` (Production database)
- `monitor/app/services/taxonomy.py` (Production taxonomy engine)
- `monitor/app/services/classifier.py` (Classification engine)
- `monitor/app/collectors/*` (Collector pipeline)
- `deploy/Caddyfile.example` & `deploy/nginx.conf`
- `deploy/docker-compose.production.yml`
- `Dockerfile`
- `robots.txt` & `sitemap.xml`

---

## 15. Tests to Add in Phase 2B

1. **Backend Integration Tests**:
   - `test_timeline_canonical_topics`: Assert all 21 canonical issues map to expected non-fallback topics.
   - `test_map_canonical_issue_filters`: Assert `/api/map?issue=work` matches both `work_unemployment` and `economy_public_finance`.
   - `test_issue_dossier_canonical_coverage`: Assert `/api/issues/work` returns evidence classified under `work_unemployment` and `economy_public_finance`.
2. **Frontend End-to-End / Unit Checks**:
   - Test modal keyboard trapping and `Escape` key close.
   - Test `.file-row` keyboard activation with `Enter` and `Space`.
   - Test clean URL routing for all 18 routes without hash creation.

---

## 16. Baseline Build & Test Results

### Frontend Production Build
```
> vite build
vite v6.4.3 building for production...
✓ 14 modules transformed.
dist/index.html                           70.42 kB │ gzip:  13.68 kB
dist/assets/index-CFyfobhZ.css           119.14 kB │ gzip:  17.76 kB
dist/assets/index-zZtwP0Tg.js             54.92 kB │ gzip:  15.96 kB
dist/assets/vendor-maplibre-BL6BFbSx.js  993.50 kB │ gzip: 263.41 kB
✓ built in 2.82s
```
**Status**: PASS (0 errors, 0 warnings).

### Backend Test Suite
```
python -m unittest discover -s monitor/tests
......................................................................
----------------------------------------------------------------------
Ran 277 tests in 46.875s

OK
```
**Status**: PASS (277 tests PASS, 0 failures, 0 errors).
