# 404TN — THE RECORD OF POWER DATA ARCHITECTURE
**Structured Evidence, Institutional Responsibility & Accountability Model (Tunisia 2019–2026)**
**Phase:** R2.1 Data Architecture
**Date:** 2026-09-11
**Repository Module:** `src/record-of-power/`

---

## 1. Purpose

**The Record of Power** is 404TN's structured data architecture for documenting and auditing political power, executive decisions, legal transformations, policy commitments, institutional responsibilities, and empirical socioeconomic outcomes across Tunisia from the 2019 presidential election through Summer 2026.

Its purpose is **not** to generate arbitrary aggregate political scores, but to provide a forensic, provenance-backed answer to six core accountability questions:
1. **What was promised?** (Electoral pledges, policy commitments, official justifications)
2. **What decision was taken?** (Presidential decrees, executive orders, statutory enactments)
3. **Who held authority?** (Presidency, line ministries, regulatory bodies, public utilities)
4. **What action followed?** (Administrative implementation, judicial proceedings, budget allocation)
5. **What result can be measured?** (National accounts, employment surveys, utility delivery metrics)
6. **What remains unknown or concealed?** (Unpublished environmental sensor feeds, opaque settlement ledgers)

---

## 2. Editorial Principles & Epistemic Standards

404TN is an independent Tunisian political opposition, investigative, and accountability publication. Its political position is strictly insulated from its evidentiary classifications.

### Three-Tier Epistemic Standard
- **`FACT`**: A discrete assertion directly supported by primary documentary records, official gazettes (JORT), accredited national statistics (INS, BCT), or audited empirical survey research (Arab Barometer).
- **`CLAIM`**: An attributed statement, official justification, or opposition allegation that has not been independently established as an uncontested physical or historical fact.
- **`ANALYSIS`**: 404TN investigative interpretation, contextual synthesis, or comparative evaluation of documented evidence.

### Non-Negotiable Translation & Verification Rules
- **No Source-Resolution-Only Verification**: Simply confirming that a `source_id` exists in `source-manifest.json` does NOT constitute verification. Every asserted fact or statistic must be substantively supported by the content of that primary source.
- **Attributed Claims Stay Claims**: A government statement, speech justification, or opposition allegation must remain classified as `CLAIM` (never `FACT`).
- **Legal & Procedural Precision**: A police seizure or arrest is cataloged as an operational enforcement act, never converted to judicial `GUILT` or `CONVICTION` without a final court verdict. A suspended decree or injunction (e.g. Administrative Court stay on judicial dismissals) must be explicitly recorded with its actual execution status (`UNEXECUTED`).
- **Economic Observation Types**: All economic indicators must specify explicit observation types (`ANNUAL_ACTUAL`, `QUARTERLY`, `MONTHLY`, `PRELIMINARY`, `ESTIMATE`, `FORECAST`). Preliminary or quarterly figures (e.g., Q2 2026 GDP growth) must never be conflated with full-year annual actuals.

---

## 3. Canonical Record Types & Action Semantics

| Record Type | Description | Key Identifier Prefix |
|---|---|---|
| `EVENT` | Critical turning points, elections, emergency declarations | `ROP-EVT-` |
| `PROMISE` | Formal campaign pledges, policy commitments, reform goals | `ROP-PRM-` |
| `DECISION` | Executive decrees, prime ministerial orders, appointments, dismissals | `ROP-DEC-` |
| `LAW` | Constitutions, decree-laws, organic laws, ordinary legislation | `ROP-LAW-` |
| `INSTITUTIONAL_CHANGE` | Dissolutions, structural reforms, provisional councils, mergers | `ROP-INS-` |
| `OFFICIAL_STATEMENT` | Speeches, press releases, ministerial justifications, denials | `ROP-STM-` |
| `OPPOSITION_CLAIM` | Political party challenges, legal filings, public dissent statements | `ROP-OPP-` |
| `OUTCOME` | Measurable delivery results, service metrics, financial yields | `ROP-OUT-` |
| `INDICATOR` | Time-series metrics (GDP growth, unemployment, CPI, debt ratio) | `ROP-IND-` |
| `DATA_GAP` | Deliberately unpublished, inaccessible, or missing official datasets | `ROP-GAP-` |
| `EVIDENCE_LINK` | Lightweight provenance bridge to the Evidence Monitor | `ROP-EVD-` |

### Action Semantics Resolution
In 404TN's data architecture, **`ACTION` is NOT a separate or phantom record type**. 

In accountability traversal (`getAccountabilityTrace()`), an "action" represents any **concrete, implementation-capable record** enacted by the state to execute a policy or promise. These implementation-capable records are strictly partitioned into their canonical types:
1. `DECISION` (e.g. Presidential Decree 2021-117, Decree 2022-516 revoking judges)
2. `LAW` (e.g. 2022 Constitution, Decree-Law 2022-54)
3. `INSTITUTIONAL_CHANGE` (e.g. Dissolution of the elected CSM)
4. `EVENT` (e.g. Operational execution events)

The selector `getAccountabilityTrace()` provides the aggregate `actions` convenience array (`[...decisions, ...laws, ...institutionalChanges]`) alongside the explicitly typed collections (`decisions`, `laws`, `institutionalChanges`) for strict type safety.

---

## 4. Base Record Schema

Every record in the architecture implements the shared base interface:

```typescript
interface BaseRecord {
  id: string;                          // Human-readable stable ID (e.g. ROP-EVT-2021-0725-001)
  record_type: RECORD_TYPES;           // Canonical type enum
  title: string;                       // Formal full title
  short_title: string;                 // Display headline for compact views
  summary: string;                     // Detailed narrative summary
  date_start: string;                  // ISO-8601 date (YYYY-MM-DD, YYYY-MM, or YYYY)
  date_end: string | null;             // ISO-8601 date or null if single-day/ongoing
  date_precision: DATE_PRECISION;      // EXACT_DAY | MONTH | YEAR | RANGE | ONGOING
  status: string;                      // Type-specific status enum
  classification: EPISTEMIC_CLASSIFICATION; // FACT | CLAIM | ANALYSIS
  verification_status: VERIFICATION_STATUS; // VERIFIED | VERIFIED_WITH_QUALIFICATION | CONTESTED | UNVERIFIED
  importance: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  issue_tags: string[];                // Thematic taxonomy tags
  institution_ids: string[];           // References to INSTITUTIONS_REGISTRY
  person_ids: string[];                // References to audited historical actors
  location_ids: string[];              // Geographic scope identifiers
  source_ids: string[];                // References to docs/source-manifest.json
  evidence_ids: string[];              // Future Evidence Monitor API keys
  related_record_ids: string[];        // Bidirectional context links
  created_at: string;                  // Audit generation timestamp
  updated_at: string;                  // Last modification timestamp
  editorial_notes?: string;            // Methodological context & legal citations
}
```

---

## 5. Promise Model

Tracks presidential and government commitments with evidentiary accountability:

- `promise_text`: Exact verbatim quotation or standardized paraphrase.
- `speaker`: Actor who made the pledge (e.g., `"Kais Saied"`).
- `speaker_role`: Constitutional capacity at time of speech (e.g., `"Presidential Candidate"`).
- `promise_date`: Date commitment was publicly delivered.
- `policy_area`: Substantive domain (e.g., `"CORRUPTION & PUBLIC FINANCE"`).
- `responsible_institution_ids`: Institutional bodies charged with delivery.
- `action_record_ids`: Decisions or laws enacted in furtherance of the promise.
- `outcome_record_ids`: Real-world measured outcomes.
- `status`: `PROMISED` | `ACTION_STARTED` | `PARTIAL` | `FULFILLED` | `UNRESOLVED` | `ABANDONED` | `DISPUTED`.
- `status_reason`: Detailed factual justification for status classification.
- `unknowns`: Known data voids affecting full auditability.

---

## 6. Decision Model

Documents formal state actions with separation of legal justification and documented impact:

- `decision_type`: `PRESIDENTIAL_DECREE` | `EXECUTIVE_ORDER` | `MINISTERIAL_DIRECTIVE` | `APPOINTMENT` | `REVOCATION`.
- `decision_maker`: Person who signed the instrument.
- `institution`: Governing institution executing the order.
- `legal_basis`: Stated constitutional or statutory authority (e.g., `"Article 80"`).
- `stated_reason`: Official administrative justification.
- `affected_institutions`: Bodies restructured, dissolved, or directed.
- `contested_interpretations`: Documented legal objections from bar associations, courts, or international bodies.

---

## 7. Law / Legal Instrument Model

Catalogs statutory instruments with legislative provenance:

- `official_title`: Official title in French and Arabic.
- `instrument_type`: `CONSTITUTION` | `DECREE_LAW` | `ORGANIC_LAW` | `ORDINARY_LAW`.
- `number`: Gazette registry number (e.g., `"2022-54"`).
- `jort_reference`: Gazette edition and publication date (e.g., `"JORT n° 103 du 13 septembre 2022"`).
- `relevant_articles`: Specific controversial or operative articles (e.g., `"Article 24"`).
- `stated_purpose`: Legislative intent as promulgated.
- `documented_effect`: Real-world operational consequences.
- `legal_challenges`: Appeals filed before the Administrative Court or international bodies.

---

## 8. Institution Model & Hierarchy

The institutional registry (`INSTITUTIONS_REGISTRY` in `src/record-of-power/institutions.js`) maintains 22 state entities with clear parent-child administrative hierarchy:

```
INST-PRESIDENCY (Presidency of the Republic)
  ├── INST-GOV (Prime Ministry)
  │     ├── INST-MOJ (Ministry of Justice)
  │     ├── INST-MOI (Ministry of Interior)
  │     ├── INST-MOF (Ministry of Finance) ── INST-DGD (Customs)
  │     ├── INST-MOE (Ministry of Industry & Energy) ── INST-STEG, INST-GCT, INST-ONME
  │     ├── INST-MOA (Ministry of Agriculture) ── INST-SONEDE
  │     ├── INST-MOENV (Ministry of Environment) ── INST-ANPE
  │     └── INST-INS (National Institute of Statistics)
  ├── INST-CSM (Judicial Council / Provisional Council)
  └── INST-ISIE (Electoral Authority)
```

---

## 9. Responsibility Model & Attribution Rules

The Responsibility Model (`RESPONSIBILITY_RECORDS` in `src/record-of-power/responsibility.js`) prevents arbitrary or purely rhetorical political attribution by identifying the exact legal and administrative basis of institutional authority:

- **`POLICY_AUTHORITY`**: Supreme policy formulation and executive direction (e.g., Presidency).
- **`IMPLEMENTATION_AUTHORITY`**: Administrative enforcement and execution (e.g., Line Ministries).
- **`REGULATORY_AUTHORITY`**: Norm-setting and electoral/market oversight (e.g., ISIE).
- **`BUDGET_AUTHORITY`**: Treasury allocation, sovereign debt, and fund accounting (e.g., Ministry of Finance).
- **`OVERSIGHT_AUTHORITY`**: Financial and administrative inspection (e.g., Court of Accounts / CCAF).
- **`JUDICIAL_AUTHORITY`**: Case adjudication and prosecution directives (e.g., Ministry of Justice / Public Prosecutor).
- **`SERVICE_DELIVERY`**: Direct public utility operation and maintenance (e.g., SONEDE, STEG).
- **`DATA_PUBLICATION`**: Official collection and release of public statistics/telemetry (e.g., INS, ANPE).

### Attribution Rules
1. **No Inference Solely from Political Prominence**: Presidential responsibility must not be asserted simply because an issue is politically prominent. There must be an identifiable constitutional decree, public order, or direct executive appointment establishing jurisdiction.
2. **Separation of Policy vs Operational Execution**: For infrastructure or service breakdowns (e.g., water cuts), policy authority (Ministry of Agriculture water quotas) is strictly distinguished from operational service delivery (SONEDE network maintenance and pressure management).
3. **Legal & Administrative Basis Required**: Every responsibility record must cite its enabling statute, gazette decree, or organic law.

---

## 10. Outcome Model

Measures real-world outcomes without confusing chronology with causation:

- `outcome_type`: `MEASURED_OUTCOME` | `SERVICE_OUTCOME` | `LEGAL_OUTCOME` | `ECONOMIC_OUTCOME`.
- `measurement`: Quantitative or categorical result (e.g., `"<500M TND (<5%)"`).
- `baseline`: Pre-period comparison anchor (e.g., `"13,500M TND Target"`).
- `causation_status`:
  - `ESTABLISHED`: Direct causal mechanism proven with official documentation.
  - `SUPPORTED_ASSOCIATION`: Strong correlation with empirical evidence, but subject to external confounding factors (e.g., drought on dam levels).
  - `PLAUSIBLE_BUT_UNPROVEN`: Reasonable hypothesis lacking full econometric proof.
  - `NOT_ESTABLISHED`: Mere chronological sequence without evidence of causation.

---

## 11. Indicator Model

Prepares future Data Observatory time-series integration:

- `indicator_id`: Canonical identifier (e.g., `ROP-IND-UNEMP-GRAD-001`).
- `name`: Indicator name.
- `observation_type`: `ANNUAL_ACTUAL` | `QUARTERLY` | `MONTHLY` | `PRELIMINARY` | `DAILY`.
- `methodology`: Sampling framework and calculation base.
- `comparability_notes`: Explicitly prevents misleading comparisons (e.g., annual actuals vs preliminary quarterly rates).

---

## 12. Statement & Opposition Claim Models

Catalogs political discourse while preserving epistemic boundaries:

- `statement_type`: `POLICY_ANNOUNCEMENT` | `JUSTIFICATION` | `ALLEGATION` | `DENIAL` | `COMMITMENT`.
- `speaker` & `speaker_role`: Direct attribution.
- Stored as concise, verifiable excerpts rather than long, unparsed prose.

---

## 13. Data Gap Model & Evidentiary Standard

Formalizes institutional transparency failures as first-class investigative entities:

- `data_gap_status`: `NOT_PUBLISHED` | `OUTDATED` | `INCOMPLETE` | `INACCESSIBLE` | `METHODOLOGY_UNKNOWN` | `REQUESTED` | `RESOLVED`.
- `institution_expected_to_hold_data`: The responsible state body.
- `why_it_matters`: Public health, fiscal, or human rights significance.

### Data Gap Wording Rules
- **Non-Publication vs Non-Existence**: "404TN could not identify/find published data on open platforms" is strictly differentiated from asserting "the data does not exist."
- **Withholding Evidence Standard**: Editorial notes must NOT claim intentional concealment or "withholding" unless documentary evidence or access-to-information refusals substantiate deliberate obstruction. Neutral, objective status formulations (`NOT_PUBLISHED`, `INACCESSIBLE`) must be maintained.

---

## 14. Relationship Graph & End-to-End Traceability Example

The directional relationship graph (`RELATIONSHIPS` in `src/record-of-power/relationships.js`) connects disparate records into coherent accountability traces:

### End-to-End Trace Example: Penal Reconciliation (2019 → 2026)

```
[ROP-EVT-2019-ELEC-001] (2019 Electoral Victory)
  │
  │ PROMISE_FOLLOWED_BY_ACTION
  ▼
[ROP-PRM-2019-RECON-001] (Penal Reconciliation Pledge: 13.5B TND Target)
  │                                                     ▲
  │ ACTION_PRODUCED_OUTCOME                             │ INSTITUTION_RESPONSIBLE_FOR
  ▼                                                     │
[ROP-OUT-2026-RECON-001] (Treasury Receipts: <500M TND) ─ [INST-MOF] (Ministry of Finance)
  ▲
  │ DATA_GAP_APPLIES_TO
[ROP-GAP-2026-RECON-RECEIPTS-001] (Confidentiality of Settlement Ledgers)
```

---

## 15. Source & Evidence System Boundary

- **Manifest Re-use**: Every record references established source identifiers in [`docs/source-manifest.json`](file:///d:/404TN/docs/source-manifest.json) (e.g., `SRC-ISIE-ELEC2019`, `SRC-JORT-DEC117`, `SRC-INS-ACC2026Q2`).
- **Zero Fabrication**: Zero placeholder or unverified URLs exist in the registry.
- **Evidence Link Boundary Decision (Option A: Lightweight Provenance Bridge)**:
  - 404TN maintains a separate, dedicated Evidence Monitor (`/api/evidence/{id}`).
  - Records in the Record of Power reference Evidence Monitor records via `evidence_ids: string[]`.
  - When instantiated as a graph node, `EVIDENCE_LINK` functions strictly as a lightweight bridge pointing to external evidence entities (`{ id, record_type: 'EVIDENCE_LINK', evidence_id, target_record_id }`).
  - `EVIDENCE_LINK` **never duplicates** headlines, claims, source text, or classifications from the Evidence Monitor, preserving clean database separation and single-source-of-truth integrity.

---

## 16. Selectors & Query Engine

`src/record-of-power/selectors.js` exposes pure, deterministic query helpers:

- `getRecordById(id)`
- `getRecordsByYear(year)`
- `getRecordsByType(type)`
- `getRecordsByIssue(issueTag)`
- `getRecordsByInstitution(institutionId)`
- `getPromisesByStatus(status)`
- `getRelatedRecords(recordId, relationshipType)`
- `getResponsibilityForRecord(recordId)`
- `getSourcesForRecord(recordId, records, sourceManifest)`
- `getAccountabilityTrace(promiseId, context)`: Multi-hop graph traversal returning all connected promises, decisions, laws, institutional changes, outcomes, indicators, data gaps, and responsible institutions.

---

## 17. Initial Seed Record Inventory

| Record ID | Type | Title / Topic | Date | Epistemic Class |
|---|---|---|---|---|
| `ROP-EVT-2019-ELEC-001` | `EVENT` | 2019 Presidential Election Victory | 2019-10-13 | `FACT` |
| `ROP-PRM-2019-RECON-001` | `PROMISE` | Penal Reconciliation Recovery Pledge | 2019-10-01 | `FACT` |
| `ROP-PRM-2019-SOV-001` | `PROMISE` | Economic Sovereignty Pledge | 2019-10-14 | `FACT` |
| `ROP-EVT-2021-0725-001` | `EVENT` | July 25 Article 80 Emergency Measures | 2021-07-25 | `FACT` |
| `ROP-STM-2021-0725-001` | `OFFICIAL_STATEMENT` | July 25 Presidential Address | 2021-07-25 | `CLAIM` |
| `ROP-DEC-2021-0922-001` | `DECISION` | Decree 117 on Exceptional Measures | 2021-09-22 | `FACT` |
| `ROP-INS-2022-CSM-001` | `INSTITUTIONAL_CHANGE` | Dissolution of High Judicial Council | 2022-02-12 | `FACT` |
| `ROP-DEC-2022-JUDGES-001`| `DECISION` | Revocation of 57 Magistrates | 2022-06-01 | `FACT` |
| `ROP-LAW-2022-CONST-001` | `LAW` | 2022 Constitution of the Republic | 2022-07-25 | `FACT` |
| `ROP-LAW-2022-054-001` | `LAW` | Decree-Law 54 on Cybercrime | 2022-09-13 | `FACT` |
| `ROP-EVT-2024-ELEC-001` | `EVENT` | October 6, 2024 Presidential Election | 2024-10-06 | `FACT` |
| `ROP-OPP-2024-ISIE-001` | `OPPOSITION_CLAIM` | 2024 Candidate Disqualification Challenge | 2024-09-02 | `CLAIM` |
| `ROP-OUT-2026-RECON-001` | `OUTCOME` | Penal Reconciliation Receipts (<500M TND) | 2026-06-30 | `FACT` |
| `ROP-OUT-2026-WATER-001` | `OUTCOME` | 2026 Potable Water Rationing & Dam Depletion| 2026-08-31 | `FACT` |
| `ROP-IND-UNEMP-GRAD-001` | `INDICATOR` | Graduate Unemployment Rate (38.8%) | 2026-06-30 | `FACT` |
| `ROP-IND-GDP-GROWTH-001` | `INDICATOR` | Real GDP Growth YoY (+0.8%) | 2026-06-30 | `FACT` |
| `ROP-GAP-2026-GABES-AIR-001`| `DATA_GAP` | Gabès Continuous Environmental Telemetry Gap | Ongoing | `FACT` |
| `ROP-GAP-2026-RECON-RECEIPTS-001`| `DATA_GAP`| Penal Reconciliation Itemized Ledger Gap | Ongoing | `FACT` |

---

## 18. Known Limitations

1. **Seed Volume**: Phase R2.1 establishes the data architecture and 18 canonical seed records. Full retrospective population of all 2019–2026 decrees, cabinet shifts, and municipal decrees is planned for Phase R2.3.
2. **UI Decoupling**: In accordance with R2.1 specifications, the frontend UI remains untouched. UI rendering of the Record of Power timeline, promise trackers, and decision graphs will be executed in Phase R2.2.

---

## 19. Future R2.2 Integration Plan

1. **Record of Power Master View (`/record-of-power`)**: Interactive chronological timeline, promise tracker dashboard, and institutional responsibility matrix.
2. **Filter & Search Engine**: Real-time faceted filtering by year (2019–2026), institution, issue tag, and epistemic classification (`FACT` / `CLAIM` / `ANALYSIS`).
3. **Promise Tracker Card Component**: Rich UI card rendering `getAccountabilityTrace()` with interactive provenance links, source modals, and data gap callouts.
