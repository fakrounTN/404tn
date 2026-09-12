// src/record-of-power/responsibility.js
// 404TN — Structured Institutional Responsibility Model (Tunisia 2019–2026)
// Explicitly maps which state bodies held policy, implementation, budget, regulatory, or service authority.

export const RESPONSIBILITY_RECORDS = Object.freeze([
  // ===========================================================================
  // 1. ELECTIONS & DEMOCRATIC GOVERNANCE
  // ===========================================================================
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
    responsibility_id: "RSP-PARL-2019-ELEC",
    record_id: "ROP-EVT-2019-PARL-001",
    institution_id: "INST-ISIE",
    responsibility_type: "REGULATORY_AUTHORITY",
    responsibility_scope: "Supervision and validation of the October 2019 legislative elections.",
    legal_or_administrative_basis: "Organic Law 2012-23 / JORT n° 90 (2019).",
    date_start: "2019-10-01",
    date_end: "2019-11-15",
    source_ids: ["SRC-ISIE-PARL2019"],
    confidence: "ESTABLISHED"
  },
  {
    responsibility_id: "RSP-REF-2022-ISIE",
    record_id: "ROP-EVT-2022-REFERENDUM",
    institution_id: "INST-ISIE",
    responsibility_type: "REGULATORY_AUTHORITY",
    responsibility_scope: "Administration and results tabulations for the July 25, 2022 constitutional referendum.",
    legal_or_administrative_basis: "Decree-Law 2022-22 / ISIE Deliberations JORT n° 91 (2022).",
    date_start: "2022-05-01",
    date_end: "2022-08-16",
    source_ids: ["SRC-ISIE-REF2022"],
    confidence: "ESTABLISHED"
  },
  {
    responsibility_id: "RSP-PRES-2024-ISIE",
    record_id: "ROP-EVT-2024-ELEC-001",
    institution_id: "INST-ISIE",
    responsibility_type: "REGULATORY_AUTHORITY",
    responsibility_scope: "Candidate vetting, final ballot certification, and results declaration for the 2024 presidential election.",
    legal_or_administrative_basis: "Law 2024-45 / ISIE Decision 2024-544.",
    date_start: "2024-07-01",
    date_end: "2024-10-11",
    source_ids: ["SRC-ISIE-ELEC2024"],
    confidence: "ESTABLISHED"
  },
  {
    responsibility_id: "RSP-DEC-2024-ISIE-DISQUAL",
    record_id: "ROP-DEC-2024-ISIE-DISQUAL",
    institution_id: "INST-ISIE",
    responsibility_type: "IMPLEMENTATION_AUTHORITY",
    responsibility_scope: "Decision rejecting the enforcement of Administrative Court appellate reinstatement judgments.",
    legal_or_administrative_basis: "ISIE Council Decision of September 2, 2024.",
    date_start: "2024-09-02",
    date_end: "2024-10-06",
    source_ids: ["SRC-ISIE-ELEC2024", "SRC-TA-RULINGS-2024"],
    confidence: "ESTABLISHED"
  },
  {
    responsibility_id: "RSP-LAW-2024-ELEC-ARP",
    record_id: "ROP-LAW-2024-ELEC-STRIP",
    institution_id: "INST-ARP",
    responsibility_type: "POLICY_AUTHORITY",
    responsibility_scope: "Emergency parliamentary debate and enactment of Law 2024-45 amending electoral litigation jurisdiction.",
    legal_or_administrative_basis: "Organic Law 2024-45 in JORT n° 117 (Sept 28, 2024).",
    date_start: "2024-09-20",
    date_end: "2024-09-28",
    source_ids: ["SRC-JORT-LAW2024-45"],
    confidence: "ESTABLISHED"
  },

  // ===========================================================================
  // 2. EXECUTIVE POWERS & EXCEPTIONAL MEASURES
  // ===========================================================================
  {
    responsibility_id: "RSP-PRES-2021-0725",
    record_id: "ROP-EVT-2021-0725-001",
    institution_id: "INST-PRESIDENCY",
    responsibility_type: "POLICY_AUTHORITY",
    responsibility_scope: "Discretionary authority over invocation of Article 80 emergency measures, suspension of parliament, and dismissal of the prime minister.",
    legal_or_administrative_basis: "Article 80 of the 2014 Constitution; Presidential Decrees 2021-80 and 2021-81.",
    date_start: "2021-07-25",
    date_end: null,
    source_ids: ["SRC-JORT-DEC117", "SRC-JORT-DEC2021-80"],
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
    responsibility_id: "RSP-DEC-2021-DISMISS-MECH",
    record_id: "ROP-DEC-2021-DISMISS-MECH",
    institution_id: "INST-PRESIDENCY",
    responsibility_type: "POLICY_AUTHORITY",
    responsibility_scope: "Presidential decree terminating prime ministerial functions and transferring direct cabinet supervision to Carthage Palace.",
    legal_or_administrative_basis: "Presidential Decree 2021-81 in JORT n° 64 (2021).",
    date_start: "2021-07-25",
    date_end: "2021-09-29",
    source_ids: ["SRC-JORT-DEC2021-80"],
    confidence: "ESTABLISHED"
  },
  {
    responsibility_id: "RSP-DEC-2021-BOUDEN",
    record_id: "ROP-DEC-2021-BOUDEN-APPOINT",
    institution_id: "INST-PRESIDENCY",
    responsibility_type: "POLICY_AUTHORITY",
    responsibility_scope: "Appointment of Head of Government under Decree 117 rules.",
    legal_or_administrative_basis: "Presidential Decree 2021-137.",
    date_start: "2021-09-29",
    date_end: "2023-08-01",
    source_ids: ["SRC-JORT-DEC117"],
    confidence: "ESTABLISHED"
  },
  {
    responsibility_id: "RSP-DEC-2023-HACHANI",
    record_id: "ROP-DEC-2023-HACHANI-APPOINT",
    institution_id: "INST-PRESIDENCY",
    responsibility_type: "POLICY_AUTHORITY",
    responsibility_scope: "Executive dismissal of Najla Bouden and appointment of Ahmed Hachani.",
    legal_or_administrative_basis: "Article 101 of the 2022 Constitution.",
    date_start: "2023-08-01",
    date_end: "2024-08-07",
    source_ids: ["SRC-JORT-CONST2022"],
    confidence: "ESTABLISHED"
  },
  {
    responsibility_id: "RSP-DEC-2024-MADOURI",
    record_id: "ROP-DEC-2024-MADOURI-APPOINT",
    institution_id: "INST-PRESIDENCY",
    responsibility_type: "POLICY_AUTHORITY",
    responsibility_scope: "Executive dismissal of Ahmed Hachani and designation of Kamel Madouri.",
    legal_or_administrative_basis: "Article 101 of the 2022 Constitution.",
    date_start: "2024-08-07",
    date_end: null,
    source_ids: ["SRC-JORT-CONST2022"],
    confidence: "ESTABLISHED"
  },

  // ===========================================================================
  // 3. JUDICIARY & LEGAL REORGANIZATION
  // ===========================================================================
  {
    responsibility_id: "RSP-INS-2022-CSM",
    record_id: "ROP-INS-2022-CSM-001",
    institution_id: "INST-PRESIDENCY",
    responsibility_type: "POLICY_AUTHORITY",
    responsibility_scope: "Dissolution of the elected High Judicial Council and appointment of provisional temporary council members.",
    legal_or_administrative_basis: "Decree-Law 2022-11 published in JORT n° 16 (Feb 12, 2022).",
    date_start: "2022-02-12",
    date_end: null,
    source_ids: ["SRC-JORT-DEC2022-11"],
    confidence: "ESTABLISHED"
  },
  {
    responsibility_id: "RSP-DEC-2022-JUDGES",
    record_id: "ROP-DEC-2022-JUDGES-001",
    institution_id: "INST-MOJ",
    responsibility_type: "IMPLEMENTATION_AUTHORITY",
    responsibility_scope: "Execution of presidential dismissals and administrative withholding of re-employment files despite Administrative Court stay orders.",
    legal_or_administrative_basis: "Presidential Decree 2022-516 / Administrative Court Rulings (Aug 9, 2022).",
    date_start: "2022-06-01",
    date_end: null,
    source_ids: ["SRC-JORT-DEC516", "SRC-TA-RULINGS-2024"],
    confidence: "ESTABLISHED"
  },
  {
    responsibility_id: "RSP-OUT-2022-TA-RULINGS",
    record_id: "ROP-OUT-2022-JUDICIAL-INJ",
    institution_id: "INST-TA",
    responsibility_type: "JUDICIAL_AUTHORITY",
    responsibility_scope: "Judicial review and suspension of 49 of the 57 executive magistrate revocations.",
    legal_or_administrative_basis: "Law 72-40 on the Administrative Court / Injunction Orders n° 410141 et seq.",
    date_start: "2022-08-09",
    date_end: null,
    source_ids: ["SRC-TA-RULINGS-2024"],
    confidence: "ESTABLISHED"
  },
  {
    responsibility_id: "RSP-LAW-2022-054",
    record_id: "ROP-LAW-2022-054-001",
    institution_id: "INST-MOJ",
    responsibility_type: "JUDICIAL_AUTHORITY",
    responsibility_scope: "Prosecutorial referrals and judicial application of Article 24 against journalists, commentators, and political figures.",
    legal_or_administrative_basis: "Decree-Law 2022-54 on cybercrime in JORT n° 103 (Sept 13, 2022).",
    date_start: "2022-09-13",
    date_end: null,
    source_ids: ["SRC-JORT-DEC54"],
    confidence: "ESTABLISHED"
  },

  // ===========================================================================
  // 4. ECONOMY, FINANCE & MONETARY POLICY
  // ===========================================================================
  {
    responsibility_id: "RSP-PRM-2019-RECON",
    record_id: "ROP-PRM-2019-RECON-001",
    institution_id: "INST-MOF",
    responsibility_type: "BUDGET_AUTHORITY",
    responsibility_scope: "Recording treasury receipts and budgetary allocation of recovered penal reconciliation funds.",
    legal_or_administrative_basis: "Decree-Law 2022-13 and Ministry of Finance budgetary execution bulletins.",
    date_start: "2022-03-20",
    date_end: null,
    source_ids: ["SRC-MF-DEBT2026Q2", "SRC-JORT-DEC2022-13"],
    confidence: "ESTABLISHED"
  },
  {
    responsibility_id: "RSP-LAW-2024-BCT",
    record_id: "ROP-LAW-2024-BCT-LENDING",
    institution_id: "INST-BCT",
    responsibility_type: "IMPLEMENTATION_AUTHORITY",
    responsibility_scope: "Direct statutory lending and liquidity advances of 7.0 billion TND to the Public Treasury.",
    legal_or_administrative_basis: "Law 2024-10 in JORT n° 19 (Feb 6, 2024) derogating from Article 25 of Law 2016-35.",
    date_start: "2024-02-06",
    date_end: null,
    source_ids: ["SRC-JORT-LAW2024-10", "SRC-BCT-ANNUAL2024"],
    confidence: "ESTABLISHED"
  },
  {
    responsibility_id: "RSP-OUT-2024-EUROBOND",
    record_id: "ROP-OUT-2024-SOV-DEBT-REPAY",
    institution_id: "INST-MOF",
    responsibility_type: "BUDGET_AUTHORITY",
    responsibility_scope: "Execution of the €850 million Eurobond principal and interest settlement.",
    legal_or_administrative_basis: "Annual State Budget Law / Ministry of Finance Debt Directorate.",
    date_start: "2024-02-01",
    date_end: "2024-02-28",
    source_ids: ["SRC-MF-DEBT2026Q2", "SRC-BCT-ANNUAL2024"],
    confidence: "ESTABLISHED"
  },

  // ===========================================================================
  // 5. INFRASTRUCTURE, ENVIRONMENT & PUBLIC UTILITIES
  // ===========================================================================
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
  },
  {
    responsibility_id: "RSP-OUT-2025-PHOSPHATE",
    record_id: "ROP-OUT-2025-PHOSPHATE-TARGET",
    institution_id: "INST-CPG",
    responsibility_type: "IMPLEMENTATION_AUTHORITY",
    responsibility_scope: "Commercial phosphate rock extraction and transport operations across the Gafsa mining basin.",
    legal_or_administrative_basis: "CPG Corporate Charter / Ministry of Industry & Energy Sector Oversight.",
    date_start: "2024-01-01",
    date_end: "2025-12-31",
    source_ids: ["SRC-CPG-STATS2025"],
    confidence: "ESTABLISHED"
  }
]);
