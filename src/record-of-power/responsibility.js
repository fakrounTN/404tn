// src/record-of-power/responsibility.js
// 404TN — Structured Institutional Responsibility Model (Phase R2.1)
// Explicitly maps which state bodies held policy, implementation, budget, regulatory, or service authority.

export const RESPONSIBILITY_RECORDS = Object.freeze([
  {
    responsibility_id: "RSP-PRES-2019-ELEC",
    record_id: "ROP-EVT-2019-ELEC-001",
    institution_id: "INST-ISIE",
    responsibility_type: "REGULATORY_AUTHORITY",
    responsibility_scope: "Organization, ballot management, and definitive results certification for the 2019 presidential election.",
    legal_or_administrative_basis: "Organic Law 2012-23 on the creation of the ISIE / JORT n° 85 (2019).",
    date_start: "2019-09-01",
    date_end: "2019-10-17",
    source_ids: ["SRC-ISIE-ELEC2019"],
    confidence: "ESTABLISHED"
  },

  {
    responsibility_id: "RSP-PRES-2021-0725",
    record_id: "ROP-EVT-2021-0725-001",
    institution_id: "INST-PRESIDENCY",
    responsibility_type: "POLICY_AUTHORITY",
    responsibility_scope: "Sole discretionary authority over invocation of Article 80 emergency measures, suspension of parliament, and dismissal of the Prime Minister.",
    legal_or_administrative_basis: "Article 80 of the 2014 Constitution; Presidential Decrees 2021-80 and 2021-81.",
    date_start: "2021-07-25",
    date_end: null,
    source_ids: ["SRC-JORT-DEC117"],
    confidence: "ESTABLISHED"
  },

  {
    responsibility_id: "RSP-DEC-2021-117",
    record_id: "ROP-DEC-2021-0922-001",
    institution_id: "INST-PRESIDENCY",
    responsibility_type: "POLICY_AUTHORITY",
    responsibility_scope: "Concentration of legislative and executive decree power; suspension of constitutional chapters.",
    legal_or_administrative_basis: "Presidential Decree 2021-117 published in JORT n° 86 (2021).",
    date_start: "2021-09-22",
    date_end: "2022-08-17",
    source_ids: ["SRC-JORT-DEC117"],
    confidence: "ESTABLISHED"
  },

  {
    responsibility_id: "RSP-INS-2022-CSM",
    record_id: "ROP-INS-2022-CSM-001",
    institution_id: "INST-PRESIDENCY",
    responsibility_type: "POLICY_AUTHORITY",
    responsibility_scope: "Dissolution of the elected High Judicial Council and creation of a provisional executive-appointed council.",
    legal_or_administrative_basis: "Decree-Law 2022-11 published in JORT n° 16 (Feb 12, 2022).",
    date_start: "2022-02-12",
    date_end: null,
    source_ids: ["SRC-JORT-DEC516"],
    confidence: "ESTABLISHED"
  },

  {
    responsibility_id: "RSP-DEC-2022-JUDGES",
    record_id: "ROP-DEC-2022-JUDGES-001",
    institution_id: "INST-MOJ",
    responsibility_type: "IMPLEMENTATION_AUTHORITY",
    responsibility_scope: "Enforcement of judicial revocations and administrative non-compliance with Administrative Court reinstatement injunctions.",
    legal_or_administrative_basis: "Presidential Decree 2022-516 / Administrative Court Injunctions (Aug 9, 2022).",
    date_start: "2022-06-01",
    date_end: null,
    source_ids: ["SRC-JORT-DEC516"],
    confidence: "ESTABLISHED"
  },

  {
    responsibility_id: "RSP-LAW-2022-054",
    record_id: "ROP-LAW-2022-054-001",
    institution_id: "INST-MOJ",
    responsibility_type: "JUDICIAL_AUTHORITY",
    responsibility_scope: "Public prosecution referrals and judicial proceedings under Article 24 against journalists and public figures.",
    legal_or_administrative_basis: "Decree-Law 2022-54 on cybercrime in JORT n° 103 (Sept 13, 2022).",
    date_start: "2022-09-13",
    date_end: null,
    source_ids: ["SRC-JORT-DEC54"],
    confidence: "ESTABLISHED"
  },

  {
    responsibility_id: "RSP-PRM-2019-RECON",
    record_id: "ROP-PRM-2019-RECON-001",
    institution_id: "INST-MOF",
    responsibility_type: "BUDGET_AUTHORITY",
    responsibility_scope: "Recording treasury receipts and operational accounting for the Penal Reconciliation Commission.",
    legal_or_administrative_basis: "Decree-Law 2022-13 and Ministry of Finance budgetary execution bulletins.",
    date_start: "2022-03-20",
    date_end: null,
    source_ids: ["SRC-MF-DEBT2026Q2"],
    confidence: "ESTABLISHED"
  },

  {
    responsibility_id: "RSP-OUT-2026-WATER",
    record_id: "ROP-OUT-2026-WATER-001",
    institution_id: "INST-SONEDE",
    responsibility_type: "SERVICE_DELIVERY",
    responsibility_scope: "Execution of municipal potable water distribution networks and regional night-time rationing quotas.",
    legal_or_administrative_basis: "Law 68-22 creating SONEDE / Ministry of Agriculture hydraulic emergency directives.",
    date_start: "2023-03-31",
    date_end: null,
    source_ids: ["SRC-INS-ACC2026Q2"],
    confidence: "ESTABLISHED"
  },

  {
    responsibility_id: "RSP-OUT-2026-WATER-MOA",
    record_id: "ROP-OUT-2026-WATER-001",
    institution_id: "INST-MOA",
    responsibility_type: "POLICY_AUTHORITY",
    responsibility_scope: "National dam reservoir allocation, irrigation restrictions, and hydraulic infrastructure capital budgets.",
    legal_or_administrative_basis: "Water Code (Code des Eaux) / Ministry of Agriculture ministerial decrees.",
    date_start: "2023-01-01",
    date_end: null,
    source_ids: ["SRC-INS-ACC2026Q2"],
    confidence: "ESTABLISHED"
  },

  {
    responsibility_id: "RSP-GAP-2026-GABES",
    record_id: "ROP-GAP-2026-GABES-AIR-001",
    institution_id: "INST-ANPE",
    responsibility_type: "DATA_PUBLICATION",
    responsibility_scope: "Operation and public release of continuous ambient air quality monitoring and marine sensor feeds in the Gabès industrial zone.",
    legal_or_administrative_basis: "Law 88-91 establishing the ANPE / Environmental Protection Code.",
    date_start: "2018-01-01",
    date_end: null,
    source_ids: ["SRC-ANPE-GABES2018"],
    confidence: "ESTABLISHED"
  }
]);
