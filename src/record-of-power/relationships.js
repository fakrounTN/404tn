// src/record-of-power/relationships.js
// 404TN — Directional Semantic Relationship Graph for Record of Power (2019–2026)
// Deep multi-hop accountability edges across all 8 chronological eras and 13 dossiers.

import { RELATIONSHIP_TYPE } from './schema.js';

export const RELATIONSHIPS = Object.freeze([
  // ===========================================================================
  // TRACE 1: PENAL RECONCILIATION & ASSET RECOVERY
  // ===========================================================================
  {
    from_id: "ROP-EVT-2019-ELEC-001",
    to_id: "ROP-PRM-2019-RECON-001",
    relationship_type: RELATIONSHIP_TYPE.PROMISE_FOLLOWED_BY_ACTION,
    description: "2019 presidential election victory established the electoral mandate for the 13.5B TND penal reconciliation pledge."
  },
  {
    from_id: "ROP-PRM-2019-RECON-001",
    to_id: "ROP-LAW-2022-RECON-001",
    relationship_type: RELATIONSHIP_TYPE.PROMISE_FOLLOWED_BY_ACTION,
    description: "2019 penal reconciliation promise was legally institutionalized via Decree-Law 2022-13."
  },
  {
    from_id: "ROP-LAW-2022-RECON-001",
    to_id: "ROP-OUT-2026-RECON-001",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Decree-Law 2022-13 implementation yielded documented treasury receipts under 5% of the 13.5B TND target by mid-2026."
  },
  {
    from_id: "ROP-GAP-2026-RECON-RECEIPTS-001",
    to_id: "ROP-OUT-2026-RECON-001",
    relationship_type: RELATIONSHIP_TYPE.DATA_GAP_APPLIES_TO,
    description: "Lack of itemized penal reconciliation settlement agreements prevents independent verification of recovery yields."
  },

  // ===========================================================================
  // TRACE 2: JULY 25 RUPTURE / DECREE 117 / CONSTITUTIONAL RE-FOUNDATION
  // ===========================================================================
  {
    from_id: "ROP-EVT-2021-0725-PROTESTS",
    to_id: "ROP-EVT-2021-0725-001",
    relationship_type: RELATIONSHIP_TYPE.EVENT_TRIGGERED_DECISION,
    description: "Nationwide Republic Day demonstrations provided the immediate political mobilization backdrop for invoking Article 80."
  },
  {
    from_id: "ROP-EVT-2021-0725-001",
    to_id: "ROP-STM-2021-0725-001",
    relationship_type: RELATIONSHIP_TYPE.STATEMENT_REFERS_TO_EVENT,
    description: "Presidential midnight address of July 25, 2021 articulated the official doctrine of emergency state protection."
  },
  {
    from_id: "ROP-EVT-2021-0725-001",
    to_id: "ROP-DEC-2021-DISMISS-MECH",
    relationship_type: RELATIONSHIP_TYPE.EVENT_TRIGGERED_DECISION,
    description: "Invocation of Article 80 executed the immediate dismissal of Prime Minister Hichem Mechichi."
  },
  {
    from_id: "ROP-EVT-2021-0725-001",
    to_id: "ROP-DEC-2021-0922-001",
    relationship_type: RELATIONSHIP_TYPE.EVENT_TRIGGERED_DECISION,
    description: "The exceptional measures period culminated in Presidential Decree 117 formally suspending constitutional chapters."
  },
  {
    from_id: "ROP-DEC-2021-0922-001",
    to_id: "ROP-DEC-2021-BOUDEN-APPOINT",
    relationship_type: RELATIONSHIP_TYPE.DECISION_AUTHORIZED_BY_LAW,
    description: "Decree 117 established the presidential authority under which Najla Bouden was appointed Head of Government."
  },
  {
    from_id: "ROP-DEC-2021-0922-001",
    to_id: "ROP-DEC-2021-ROADMAP-001",
    relationship_type: RELATIONSHIP_TYPE.PROMISE_FOLLOWED_BY_ACTION,
    description: "Decree 117 executive framework framed the 2022 political roadmap (consultation, referendum, elections)."
  },
  {
    from_id: "ROP-DEC-2021-ROADMAP-001",
    to_id: "ROP-LAW-2022-CONST-001",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "The presidential roadmap produced the draft 2022 Constitution submitted to national referendum."
  },
  {
    from_id: "ROP-LAW-2022-CONST-001",
    to_id: "ROP-EVT-2022-REFERENDUM",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "The 2022 Constitution was approved by 94.6% of voters on a 30.5% national turnout."
  },
  {
    from_id: "ROP-OPP-2021-COUP-001",
    to_id: "ROP-EVT-2021-0725-001",
    relationship_type: RELATIONSHIP_TYPE.RECORD_DISPUTES_RECORD,
    description: "Opposition parties challenged the constitutional legitimacy of Article 80 invocation as an executive usurpation."
  },
  {
    from_id: "ROP-OPP-2022-BOYCOTT",
    to_id: "ROP-EVT-2022-REFERENDUM",
    relationship_type: RELATIONSHIP_TYPE.RECORD_DISPUTES_RECORD,
    description: "Civil society and opposition coalitions boycotted the referendum, disputing the legitimacy of the unilateral drafting process."
  },

  // ===========================================================================
  // TRACE 3: JUDICIARY RESTRUCTURING & REVOCATION OF 57 MAGISTRATES
  // ===========================================================================
  {
    from_id: "ROP-DEC-2021-0922-001",
    to_id: "ROP-INS-2022-CSM-001",
    relationship_type: RELATIONSHIP_TYPE.DECISION_AFFECTED_INSTITUTION,
    description: "Decree power under Decree 117 was exercised to dissolve the elected High Judicial Council via Decree-Law 2022-11."
  },
  {
    from_id: "ROP-INS-2022-CSM-001",
    to_id: "ROP-DEC-2022-JUDGES-001",
    relationship_type: RELATIONSHIP_TYPE.PROMISE_FOLLOWED_BY_ACTION,
    description: "Dissolution of the CSM established executive authority enabling Presidential Decree 2022-516 revoking 57 judges."
  },
  {
    from_id: "ROP-DEC-2022-JUDGES-001",
    to_id: "ROP-OUT-2022-JUDICIAL-INJ",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Executive revocation of 57 judges triggered appellate litigation before the Administrative Court."
  },
  {
    from_id: "ROP-OUT-2022-JUDICIAL-INJ",
    to_id: "ROP-DEC-2022-JUDGES-001",
    relationship_type: RELATIONSHIP_TYPE.RECORD_DISPUTES_RECORD,
    description: "The Administrative Court issued binding injunctions suspending the revocation of 49 of the 57 magistrates."
  },

  // ===========================================================================
  // TRACE 4: DECREE-LAW 54 / MEDIA, SPEECH & CIVIL LIBERTIES
  // ===========================================================================
  {
    from_id: "ROP-LAW-2022-CONST-001",
    to_id: "ROP-LAW-2022-054-001",
    relationship_type: RELATIONSHIP_TYPE.DECISION_AUTHORIZED_BY_LAW,
    description: "Decree-Law 54 on combating cybercrime was enacted by presidential decree under the new constitutional order."
  },
  {
    from_id: "ROP-LAW-2022-054-001",
    to_id: "ROP-EVT-2023-SNJT-PROSEC",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Decree-Law 54 Article 24 was applied to prosecute and sentence journalists and media commentators."
  },
  {
    from_id: "ROP-LAW-2022-054-001",
    to_id: "ROP-EVT-2024-MAY-CRACKDOWN",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Decree-Law 54 provided legal basis for the detention and prosecution of lawyers and civil rights figures."
  },
  {
    from_id: "ROP-LAW-2022-054-001",
    to_id: "ROP-OUT-2026-DL54-CONVICT",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Decree-Law 54 generated over 85 documented judicial proceedings and custodial sentences by mid-2026."
  },

  // ===========================================================================
  // TRACE 5: MACROECONOMIC SOVEREIGNTY / IMF / BCT DIRECT LENDING
  // ===========================================================================
  {
    from_id: "ROP-EVT-2019-ELEC-001",
    to_id: "ROP-PRM-2019-SOV-001",
    relationship_type: RELATIONSHIP_TYPE.PROMISE_FOLLOWED_BY_ACTION,
    description: "2019 campaign established the presidential commitment to sovereign self-reliance and rejection of external conditionalities."
  },
  {
    from_id: "ROP-PRM-2019-SOV-001",
    to_id: "ROP-EVT-2022-IMF-SLA",
    relationship_type: RELATIONSHIP_TYPE.PROMISE_FOLLOWED_BY_ACTION,
    description: "Government negotiated an IMF staff-level agreement ($1.9B) under fiscal pressure."
  },
  {
    from_id: "ROP-EVT-2022-IMF-SLA",
    to_id: "ROP-STM-2023-IMF-REFUSAL",
    relationship_type: RELATIONSHIP_TYPE.RECORD_DISPUTES_RECORD,
    description: "President Kais Saied publicly rejected the IMF agreement terms regarding subsidy cuts and public enterprise restructuring."
  },
  {
    from_id: "ROP-STM-2023-IMF-REFUSAL",
    to_id: "ROP-LAW-2024-BCT-LENDING",
    relationship_type: RELATIONSHIP_TYPE.EVENT_TRIGGERED_DECISION,
    description: "Rejection of the IMF program led to domestic monetary financing via Law 2024-10 authorizing 7B TND in direct BCT advances."
  },
  {
    from_id: "ROP-LAW-2024-BCT-LENDING",
    to_id: "ROP-OUT-2024-SOV-DEBT-REPAY",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "BCT statutory direct advances funded the full settlement of the €850 million Eurobond maturity in February 2024."
  },
  {
    from_id: "ROP-IND-GDP-GROWTH-001",
    to_id: "ROP-PRM-2019-SOV-001",
    relationship_type: RELATIONSHIP_TYPE.OUTCOME_MEASURED_BY_INDICATOR,
    description: "Real GDP growth telemetry (+0.8% in Q2 2026 vs +1.5% in 2019) measures macroeconomic performance under the sovereign model."
  },
  {
    from_id: "ROP-IND-UNEMP-GRAD-001",
    to_id: "ROP-PRM-2019-SOV-001",
    relationship_type: RELATIONSHIP_TYPE.OUTCOME_MEASURED_BY_INDICATOR,
    description: "Higher education graduate unemployment (38.8% in Q2 2026 vs 28.0% in 2019) measures structural youth labor absorption."
  },
  {
    from_id: "ROP-IND-2026-PUBLIC-DEBT",
    to_id: "ROP-LAW-2024-BCT-LENDING",
    relationship_type: RELATIONSHIP_TYPE.OUTCOME_MEASURED_BY_INDICATOR,
    description: "Central government public debt ratio reaching 80.2% of GDP in 2026 tracks domestic public financing expansion."
  },

  // ===========================================================================
  // TRACE 6: GABES RELOCATION & ENVIRONMENTAL TRANSPARENCY
  // ===========================================================================
  {
    from_id: "ROP-OUT-2026-GABES-RELOC-FAIL",
    to_id: "ROP-GAP-2026-GABES-AIR-001",
    relationship_type: RELATIONSHIP_TYPE.DATA_GAP_APPLIES_TO,
    description: "Non-execution of the 2017 Gabès industrial chemical cluster relocation coincided with lack of open continuous ambient air telemetry."
  },

  // ===========================================================================
  // TRACE 7: 2024 PRESIDENTIAL ELECTION & ADMINISTRATIVE COURT LITIGATION
  // ===========================================================================
  {
    from_id: "ROP-DEC-2024-ISIE-DISQUAL",
    to_id: "ROP-LAW-2024-ELEC-STRIP",
    relationship_type: RELATIONSHIP_TYPE.EVENT_TRIGGERED_DECISION,
    description: "Dispute over Administrative Court candidate reinstatements triggered emergency parliamentary enactment of Law 2024-45."
  },
  {
    from_id: "ROP-LAW-2024-ELEC-STRIP",
    to_id: "ROP-EVT-2024-ELEC-001",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Law 2024-45 transferred electoral litigation to the Court of Appeal days before the October 6, 2024 vote."
  },
  {
    from_id: "ROP-OPP-2024-ISIE-001",
    to_id: "ROP-EVT-2024-ELEC-001",
    relationship_type: RELATIONSHIP_TYPE.RECORD_DISPUTES_RECORD,
    description: "Opposition coalitions disputed the fairness of the 2024 presidential election following candidate disqualifications."
  },
  {
    from_id: "ROP-EVT-2024-ELEC-001",
    to_id: "ROP-STM-2024-SWEAR-IN",
    relationship_type: RELATIONSHIP_TYPE.EVENT_TRIGGERED_DECISION,
    description: "Certification of the 2024 election victory led to the presidential swearing-in before the bicameral parliament."
  },

  // ===========================================================================
  // ADDITIONAL INSTITUTIONAL & POLICY RELATIONSHIPS
  // ===========================================================================
  // 2020 Executive Crisis
  {
    from_id: "ROP-EVT-2019-PARL-001",
    to_id: "ROP-EVT-2020-GOV-FRIB-001",
    relationship_type: RELATIONSHIP_TYPE.EVENT_TRIGGERED_DECISION,
    description: "Parliamentary fragmentation led to the rejection of the Habib Jemli cabinet."
  },
  {
    from_id: "ROP-EVT-2020-GOV-FRIB-001",
    to_id: "ROP-DEC-2020-FFAIL-001",
    relationship_type: RELATIONSHIP_TYPE.EVENT_TRIGGERED_DECISION,
    description: "Rejection of Jemli triggered presidential authority under Article 89 to designate Elyes Fakhfakh."
  },
  {
    from_id: "ROP-DEC-2020-FFAIL-001",
    to_id: "ROP-EVT-2020-FAKH-RESIGN",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "The Fakhfakh government collapsed following INLUCC conflict-of-interest inquiries."
  },
  {
    from_id: "ROP-EVT-2020-FAKH-RESIGN",
    to_id: "ROP-DEC-2020-MECH-APPOINT",
    relationship_type: RELATIONSHIP_TYPE.EVENT_TRIGGERED_DECISION,
    description: "Fakhfakh resignation triggered presidential designation of Hichem Mechichi."
  },
  {
    from_id: "ROP-DEC-2020-MECH-APPOINT",
    to_id: "ROP-EVT-2021-CABINET-CRISIS",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Mechichi cabinet reshuffle sparked presidential refusal to administer ministerial oaths."
  },
  {
    from_id: "ROP-EVT-2021-CABINET-CRISIS",
    to_id: "ROP-EVT-2021-0725-001",
    relationship_type: RELATIONSHIP_TYPE.EVENT_TRIGGERED_DECISION,
    description: "Executive stand-off deepened institutional crisis leading up to July 25 emergency measures."
  },

  // Migration & Foreign Affairs
  {
    from_id: "ROP-STM-2023-MIGRATION-SPEECH",
    to_id: "ROP-EVT-2023-SFAX-TENSIONS",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Presidential national security address on demographic change preceded heightened urban tensions in Sfax."
  },
  {
    from_id: "ROP-EVT-2023-SFAX-TENSIONS",
    to_id: "ROP-EVT-2023-EU-MOU",
    relationship_type: RELATIONSHIP_TYPE.EVENT_TRIGGERED_DECISION,
    description: "Intensifying Mediterranean migration flows accelerated negotiations for the EU-Tunisia Strategic MoU."
  },
  {
    from_id: "ROP-EVT-2023-EU-MOU",
    to_id: "ROP-OUT-2024-EU-BUDGET-DISB",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "EU Strategic MoU framework resulted in the disbursement of €150 million direct budget support grant."
  },
  {
    from_id: "ROP-EVT-2023-EU-MOU",
    to_id: "ROP-EVT-2025-BORDER-PATROL",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "EU-Tunisia border cooperation expanded National Guard maritime interception operations (>70k intercepted)."
  },
  {
    from_id: "ROP-GAP-2025-MIGRATION-RETURNS",
    to_id: "ROP-EVT-2025-BORDER-PATROL",
    relationship_type: RELATIONSHIP_TYPE.DATA_GAP_APPLIES_TO,
    description: "Data gap on migrant repatriation disaggregation applies directly to National Guard border operations."
  },

  // Water & Environmental Policy
  {
    from_id: "ROP-STM-2025-WATER-PLOTS",
    to_id: "ROP-OPP-2025-CLIMATE-RESP",
    relationship_type: RELATIONSHIP_TYPE.RECORD_DISPUTES_RECORD,
    description: "Civil society water observatories refuted criminal sabotage claims with infrastructure and drought telemetry."
  },
  {
    from_id: "ROP-OPP-2025-CLIMATE-RESP",
    to_id: "ROP-OUT-2026-WATER-001",
    relationship_type: RELATIONSHIP_TYPE.DATA_GAP_APPLIES_TO,
    description: "Field audits documented structural causes behind nationwide potable water rationing."
  },

  // Grassroots Representation & Community Enterprises
  {
    from_id: "ROP-PRM-2019-CONCLAVE-001",
    to_id: "ROP-LAW-2023-REGIONS-001",
    relationship_type: RELATIONSHIP_TYPE.PROMISE_FOLLOWED_BY_ACTION,
    description: "Promise for ascending representation was institutionalized via Decree-Law 2023-10 on local councils."
  },
  {
    from_id: "ROP-LAW-2023-REGIONS-001",
    to_id: "ROP-INS-2024-NRC-INAUG",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Decree-Law 2023-10 resulted in the election and inauguration of the National Council of Regions and Districts."
  },
  {
    from_id: "ROP-DEC-2025-COMMUNITY-ENT",
    to_id: "ROP-OUT-2025-COMMUNITY-YIELD",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Executive prioritization of community enterprises resulted in ~95 incorporated entities by 2025."
  },

  // Parliament & Local Councils
  {
    from_id: "ROP-DEC-2022-ARP-DISSOLVE",
    to_id: "ROP-INS-2023-ARP-INAUG",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Dissolution of the 2019 parliament led to elections under Decree-Law 2022-55 and the new ARP assembly."
  },
  {
    from_id: "ROP-DEC-2023-MUNICIPAL-DISS",
    to_id: "ROP-LAW-2023-REGIONS-001",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Dissolution of 350 elected municipal councils cleared the institutional landscape for local council elections."
  }
]);
