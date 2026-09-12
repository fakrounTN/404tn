// src/presidency-data.js
// 404TN — The Record of Power: Editorial Narrative & Research Archive (Tunisia 2019–2026)
// Dual-View Information Architecture (Phase R2.4B.1):
// 1. /presidency = Premium investigative reading narrative (Three-level hierarchy: 11 Lead + 17 Supporting + 10 Outcomes = 38 Primary Records)
// 2. /presidency/archive = Complete canonical research archive (88-record year-grouped compact documentary evidence index)

import { escapeHtml, stripHtml } from './utils.js';
import {
  renderInvestigationOpener,
  renderSectionOpener,
  renderPollResult,
  renderRatingChange,
  renderAccountabilityQuestionBlock
} from './editorial-components.js';
import { ECONOMY_ARCHITECTURE_DATA, TRUST_MONITOR_DATA } from './editorial-architecture.js';
import {
  RECORD_TYPES,
  EPISTEMIC_CLASSIFICATION,
  INSTITUTIONS_REGISTRY,
  RESPONSIBILITY_RECORDS,
  RELATIONSHIPS,
  SOURCE_MANIFEST,
  SOURCE_MAP,
  SEED_RECORDS,
  getRecordById,
  getRecordsByYear,
  getAccountabilityTrace,
  getResponsibilityForRecord,
  getSourcesForRecord
} from './record-of-power/index.js';

/**
 * Seven signature accountability trace families.
 */
export const TRACE_FAMILIES = [
  {
    id: "trace-penal-reconciliation",
    number: "01",
    title: "Penal Reconciliation & Stolen Asset Recovery",
    subtitle: "From the 13.5 Billion TND Pledged Target to Actual Documented Treasury Receipts",
    chain: [
      { step: "PROMISE", recordId: "ROP-PRM-2019-RECON-001", role: "13.5B TND Stolen Asset Pledge" },
      { step: "LAW", recordId: "ROP-LAW-2022-RECON-001", role: "Decree-Law 2022-13 Enacted" },
      { step: "OUTCOME", recordId: "ROP-OUT-2026-RECON-001", role: "~35.5M TND Treasury Recovery (0.26%)" },
      { step: "DATA GAP", recordId: "ROP-GAP-2026-RECON-RECEIPTS-001", role: "No Itemized Public Ledger Identified" }
    ]
  },
  {
    id: "trace-july25-constitution",
    number: "02",
    title: "The July 25 Rupture, Decree 117 & 2022 Constitution",
    subtitle: "From Emergency Measures to Executive Power Concentration and Constitutional Overhaul",
    chain: [
      { step: "EVENT", recordId: "ROP-EVT-2021-0725-001", role: "Article 80 Invocation" },
      { step: "STATEMENT", recordId: "ROP-STM-2021-0725-001", role: "Emergency Justification Speech" },
      { step: "DECISION", recordId: "ROP-DEC-2021-0922-001", role: "Decree 117 (Plenary Decree Powers)" },
      { step: "LAW", recordId: "ROP-LAW-2022-CONST-001", role: "2022 Constitution Promulgated" }
    ]
  },
  {
    id: "trace-judiciary-restructuring",
    number: "03",
    title: "Judiciary Restructuring & Revocation of 57 Magistrates",
    subtitle: "Dissolution of High Judicial Council, Revocations, and Non-Execution of Administrative Court Injunctions",
    chain: [
      { step: "INSTITUTION", recordId: "ROP-INS-2022-CSM-001", role: "Dissolution of CSM by Decree 2022-11" },
      { step: "DECISION", recordId: "ROP-DEC-2022-JUDGES-001", role: "Revocation of 57 Judges (Decree 2022-516)" },
      { step: "OUTCOME", recordId: "ROP-OUT-2022-JUDICIAL-INJ", role: "Administrative Court Stay of Execution" },
      { step: "OUTCOME", recordId: "ROP-OUT-2026-DL54-CONVICT", role: "Non-Reinstatement & Continuing Judicial Subordination" }
    ]
  },
  {
    id: "trace-decree-54-speech",
    number: "04",
    title: "Decree-Law 54 & Freedom of Expression Proceedings",
    subtitle: "Cybercrime Legislation, Press Prosecutions, and Documented Convictions",
    chain: [
      { step: "LAW", recordId: "ROP-LAW-2022-054-001", role: "Decree-Law 2022-54 Enacted (Article 24)" },
      { step: "EVENT", recordId: "ROP-EVT-2023-SNJT-PROSEC", role: "Prosecution of Journalists & Lawyers" },
      { step: "OUTCOME", recordId: "ROP-OUT-2026-DL54-CONVICT", role: "Documented Convictions & Detentions (2022–2026)" }
    ]
  },
  {
    id: "trace-imf-bct-sovereignty",
    number: "05",
    title: "Economic Sovereignty, IMF Standoff & Central Bank Direct Lending",
    subtitle: "From Founding Sovereignty Pledges to Law 2024-10 Direct BCT Treasury Financing",
    chain: [
      { step: "PROMISE", recordId: "ROP-PRM-2019-SOV-001", role: "National Sovereignty & Self-Reliance Pledge" },
      { step: "EVENT", recordId: "ROP-EVT-2022-IMF-SLA", role: "IMF Staff-Level Agreement (1.9B USD)" },
      { step: "STATEMENT", recordId: "ROP-STM-2023-IMF-REFUSAL", role: "Public Refusal of IMF 'Foreign Dictates'" },
      { step: "LAW", recordId: "ROP-LAW-2024-BCT-LENDING", role: "Law 2024-10 Direct BCT Financing (7B TND)" }
    ]
  },
  {
    id: "trace-gabes-pollution-reloc",
    number: "06",
    title: "Gabès Industrial Relocation & Environmental Transparency Gap",
    subtitle: "Cabinet Relocation Mandate, Execution Inaction, and Lack of Continuous Ambient Air Data",
    chain: [
      { step: "OUTCOME", recordId: "ROP-OUT-2026-GABES-RELOC-FAIL", role: "Non-Execution of 2017 Cabinet Decision on GCT Coastal Processing Relocation" },
      { step: "DATA GAP", recordId: "ROP-GAP-2026-GABES-AIR-001", role: "Continuous Ambient Air Quality Monitoring Data Gap" }
    ]
  },
  {
    id: "trace-2024-election-isie",
    number: "07",
    title: "2024 Presidential Election & Candidate Disqualifications",
    subtitle: "Disqualification of Candidates, Electoral Code Amendments, and Certified 90.69% Re-election",
    chain: [
      { step: "DECISION", recordId: "ROP-DEC-2024-ISIE-DISQUAL", role: "ISIE Exclusion of Validated Candidates" },
      { step: "LAW", recordId: "ROP-LAW-2024-ELEC-STRIP", role: "Law 2024-45 (Tribunal Administratif Stripped)" },
      { step: "EVENT", recordId: "ROP-EVT-2024-ELEC-001", role: "90.69% Certified Election Victory" },
      { step: "OPPOSITION", recordId: "ROP-OPP-2024-ISIE-001", role: "Opposition Coalition Challenges" }
    ]
  }
];

/**
 * Curated Era Configuration for /presidency:
 * Deterministic Three-Level Information Hierarchy (Lead records vs Supporting records vs Full Archive)
 */
export const CURATED_ERA_CONFIG = {
  2019: {
    title: "The Mandate & Founding Pledges",
    subtitle: "Electoral victory, inaugural promises on corruption and stolen assets, economic sovereignty framework, and baseline macroeconomic indicators.",
    leadIds: [
      "ROP-EVT-2019-ELEC-001"
    ],
    supportingIds: [
      "ROP-PRM-2019-RECON-001",
      "ROP-PRM-2019-SOV-001"
    ],
    featuredIds: [
      "ROP-EVT-2019-ELEC-001",
      "ROP-PRM-2019-RECON-001",
      "ROP-PRM-2019-SOV-001"
    ],
    allIds: [
      "ROP-EVT-2019-ELEC-001",
      "ROP-EVT-2019-PARL-001",
      "ROP-PRM-2019-RECON-001",
      "ROP-PRM-2019-SOV-001",
      "ROP-PRM-2019-CONCLAVE-001",
      "ROP-STM-2019-INAUG-001",
      "ROP-IND-2019-GDP-BASE",
      "ROP-IND-2019-UNEMP-BASE",
      "ROP-IND-2019-DEBT-BASE",
      "ROP-IND-2019-INFL-BASE"
    ]
  },
  2020: {
    title: "Governing Deadlock & The Pandemic Crisis",
    subtitle: "Failed government formation, Fakhfakh cabinet resignation, Mechichi appointment, and initial COVID-19 emergency measures.",
    leadIds: [
      "ROP-DEC-2020-MECH-APPOINT"
    ],
    supportingIds: [
      "ROP-EVT-2020-GOV-FRIB-001",
      "ROP-EVT-2020-FAKH-RESIGN"
    ],
    featuredIds: [
      "ROP-EVT-2020-GOV-FRIB-001",
      "ROP-EVT-2020-FAKH-RESIGN",
      "ROP-DEC-2020-MECH-APPOINT"
    ],
    allIds: [
      "ROP-EVT-2020-GOV-FRIB-001",
      "ROP-DEC-2020-FFAIL-001",
      "ROP-EVT-2020-FAKH-RESIGN",
      "ROP-DEC-2020-MECH-APPOINT",
      "ROP-STM-2020-DIPL-001",
      "ROP-DEC-2020-KAMOUR-001",
      "ROP-OUT-2020-COVID-001"
    ]
  },
  2021: {
    title: "The July 25 Rupture & Decree 117",
    subtitle: "Invocation of Article 80, suspension of parliament, dismissal of Mechichi cabinet, concentration of decree power, and appointment of Najla Bouden.",
    leadIds: [
      "ROP-EVT-2021-0725-001",
      "ROP-DEC-2021-0922-001"
    ],
    supportingIds: [
      "ROP-STM-2021-0725-001",
      "ROP-DEC-2021-BOUDEN-APPOINT"
    ],
    featuredIds: [
      "ROP-EVT-2021-0725-001",
      "ROP-STM-2021-0725-001",
      "ROP-DEC-2021-0922-001",
      "ROP-DEC-2021-BOUDEN-APPOINT"
    ],
    allIds: [
      "ROP-EVT-2021-CABINET-CRISIS",
      "ROP-EVT-2021-0725-PROTESTS",
      "ROP-EVT-2021-0725-001",
      "ROP-STM-2021-0725-001",
      "ROP-DEC-2021-DISMISS-MECH",
      "ROP-DEC-2021-0922-001",
      "ROP-DEC-2021-BOUDEN-APPOINT",
      "ROP-DEC-2021-INLUCC-001",
      "ROP-OPP-2021-COUP-001",
      "ROP-DEC-2021-ROADMAP-001"
    ]
  },
  2022: {
    title: "Constitutional Reordering & Executive Decrees",
    subtitle: "Dissolution of High Judicial Council, revocation of 57 magistrates, Decree-Law 2022-13 on penal reconciliation, 2022 Constitution referendum, and Decree-Law 54.",
    leadIds: [
      "ROP-LAW-2022-CONST-001",
      "ROP-LAW-2022-054-001"
    ],
    supportingIds: [
      "ROP-INS-2022-CSM-001",
      "ROP-DEC-2022-JUDGES-001",
      "ROP-LAW-2022-RECON-001"
    ],
    featuredIds: [
      "ROP-INS-2022-CSM-001",
      "ROP-DEC-2022-JUDGES-001",
      "ROP-LAW-2022-RECON-001",
      "ROP-LAW-2022-CONST-001",
      "ROP-LAW-2022-054-001"
    ],
    allIds: [
      "ROP-INS-2022-CSM-001",
      "ROP-DEC-2022-JUDGES-001",
      "ROP-DEC-2022-ARP-DISSOLVE",
      "ROP-INS-2022-ISIE-REORG",
      "ROP-LAW-2022-RECON-001",
      "ROP-LAW-2022-CONST-001",
      "ROP-EVT-2022-REFERENDUM",
      "ROP-LAW-2022-054-001",
      "ROP-LAW-2022-ELEC-001",
      "ROP-EVT-2022-IMF-SLA",
      "ROP-EVT-2022-PARL-ELEC-R1",
      "ROP-OPP-2022-BOYCOTT",
      "ROP-OUT-2022-JUDICIAL-INJ"
    ]
  },
  2023: {
    title: "Political Consolidation & Sovereignty Discourse",
    subtitle: "Inauguration of the new ARP, political arrests, migration policy shift and EU MoU, public refusal of IMF program, and peak inflation (10.4%).",
    leadIds: [
      "ROP-EVT-2023-ARRESTS-CONSP",
      "ROP-STM-2023-IMF-REFUSAL"
    ],
    supportingIds: [
      "ROP-INS-2023-ARP-INAUG",
      "ROP-EVT-2023-EU-MOU"
    ],
    featuredIds: [
      "ROP-INS-2023-ARP-INAUG",
      "ROP-EVT-2023-ARRESTS-CONSP",
      "ROP-EVT-2023-EU-MOU",
      "ROP-STM-2023-IMF-REFUSAL"
    ],
    allIds: [
      "ROP-EVT-2023-PARL-ELEC-R2",
      "ROP-INS-2023-ARP-INAUG",
      "ROP-DEC-2023-MUNICIPAL-DISS",
      "ROP-LAW-2023-REGIONS-001",
      "ROP-EVT-2023-ARRESTS-CONSP",
      "ROP-STM-2023-MIGRATION-SPEECH",
      "ROP-EVT-2023-SFAX-TENSIONS",
      "ROP-EVT-2023-EU-MOU",
      "ROP-STM-2023-IMF-REFUSAL",
      "ROP-DEC-2023-HACHANI-APPOINT",
      "ROP-EVT-2023-SNJT-PROSEC",
      "ROP-IND-2023-INFLATION-PEAK",
      "ROP-IND-2023-BCT-RATE-HIKE"
    ]
  },
  2024: {
    title: "BCT Lending, Second Chamber & Presidential Re-election",
    subtitle: "Law 2024-10 direct central bank lending, installation of National Council of Regions, candidate disqualifications, Law 2024-45 appellate restrictions, and 90.69% election victory.",
    leadIds: [
      "ROP-LAW-2024-BCT-LENDING",
      "ROP-EVT-2024-ELEC-001"
    ],
    supportingIds: [
      "ROP-INS-2024-NRC-INAUG",
      "ROP-DEC-2024-ISIE-DISQUAL",
      "ROP-LAW-2024-ELEC-STRIP"
    ],
    featuredIds: [
      "ROP-LAW-2024-BCT-LENDING",
      "ROP-INS-2024-NRC-INAUG",
      "ROP-DEC-2024-ISIE-DISQUAL",
      "ROP-LAW-2024-ELEC-STRIP",
      "ROP-EVT-2024-ELEC-001"
    ],
    allIds: [
      "ROP-LAW-2024-BCT-LENDING",
      "ROP-INS-2024-NRC-INAUG",
      "ROP-EVT-2024-MAY-CRACKDOWN",
      "ROP-DEC-2024-MADOURI-APPOINT",
      "ROP-DEC-2024-ISIE-DISQUAL",
      "ROP-LAW-2024-ELEC-STRIP",
      "ROP-EVT-2024-ELEC-001",
      "ROP-OPP-2024-ISIE-001",
      "ROP-STM-2024-SWEAR-IN",
      "ROP-OUT-2024-EU-BUDGET-DISB",
      "ROP-IND-2024-AB-TRUST-DROP",
      "ROP-OUT-2024-SOV-DEBT-REPAY"
    ]
  },
  2025: {
    title: "Outcomes, Institutional Effects & Public Confidence",
    subtitle: "Debates on draft civil society legislation, administrative rollout of community enterprises (236 created, 60 operational; 95M TND state credit lines), maritime border interceptions, and phosphate extraction performance.",
    leadIds: [
      "ROP-OUT-2025-COMMUNITY-YIELD"
    ],
    supportingIds: [
      "ROP-EVT-2025-ASSOCIATIONS-DEB",
      "ROP-EVT-2025-BORDER-PATROL",
      "ROP-OUT-2025-PHOSPHATE-TARGET"
    ],
    featuredIds: [
      "ROP-EVT-2025-ASSOCIATIONS-DEB",
      "ROP-OUT-2025-COMMUNITY-YIELD",
      "ROP-EVT-2025-BORDER-PATROL",
      "ROP-OUT-2025-PHOSPHATE-TARGET"
    ],
    allIds: [
      "ROP-EVT-2025-ASSOCIATIONS-DEB",
      "ROP-DEC-2025-COMMUNITY-ENT",
      "ROP-OUT-2025-COMMUNITY-YIELD",
      "ROP-EVT-2025-BORDER-PATROL",
      "ROP-IND-2025-FDI-INFLOWS",
      "ROP-OUT-2025-PHOSPHATE-TARGET",
      "ROP-GAP-2025-MIGRATION-RETURNS",
      "ROP-STM-2025-WATER-PLOTS",
      "ROP-OPP-2025-CLIMATE-RESP"
    ]
  },
  2026: {
    title: "Measured Results & Audited Transparency Gaps",
    subtitle: "Seven years following the 2019 mandate and five years following the July 2021 rupture, all institutional mechanisms are directly accountable to the presidency. 404TN measures macroeconomic indicators, public service delivery, and documented data gaps.",
    leadIds: [
      "ROP-IND-UNEMP-GRAD-001",
      "ROP-IND-GDP-GROWTH-001",
      "ROP-IND-2026-PUBLIC-DEBT",
      "ROP-IND-2026-INFLATION-FOOD",
      "ROP-IND-2026-ENERGY-DEFICIT",
      "ROP-IND-2026-FX-DAYS",
      "ROP-OUT-2026-RECON-001",
      "ROP-OUT-2026-WATER-001",
      "ROP-OUT-2026-GABES-RELOC-FAIL",
      "ROP-OUT-2026-DL54-CONVICT"
    ],
    supportingIds: [],
    featuredIds: [
      "ROP-IND-UNEMP-GRAD-001",
      "ROP-IND-GDP-GROWTH-001",
      "ROP-IND-2026-PUBLIC-DEBT",
      "ROP-IND-2026-INFLATION-FOOD",
      "ROP-IND-2026-ENERGY-DEFICIT",
      "ROP-IND-2026-FX-DAYS",
      "ROP-OUT-2026-RECON-001",
      "ROP-OUT-2026-WATER-001",
      "ROP-OUT-2026-GABES-RELOC-FAIL",
      "ROP-OUT-2026-DL54-CONVICT"
    ],
    allIds: [
      "ROP-IND-UNEMP-GRAD-001",
      "ROP-IND-GDP-GROWTH-001",
      "ROP-IND-2026-PUBLIC-DEBT",
      "ROP-IND-2026-INFLATION-FOOD",
      "ROP-IND-2026-ENERGY-DEFICIT",
      "ROP-IND-2026-FX-DAYS",
      "ROP-OUT-2026-RECON-001",
      "ROP-OUT-2026-WATER-001",
      "ROP-OUT-2026-GABES-RELOC-FAIL",
      "ROP-OUT-2026-DL54-CONVICT",
      "ROP-GAP-2026-GABES-AIR-001",
      "ROP-GAP-2026-RECON-RECEIPTS-001",
      "ROP-GAP-2026-ENERGY-SUBSIDY",
      "ROP-GAP-2026-CIVIL-SERVICE-CENSUS"
    ]
  }
};

/**
 * Resolves source object from ID.
 */
function resolveSource(sourceId) {
  if (SOURCE_MAP[sourceId]) return SOURCE_MAP[sourceId];
  return SOURCE_MANIFEST.find(s => s.id === sourceId) || null;
}

/**
 * Resolves institution display name from ID.
 */
function resolveInstitutionName(instId) {
  if (!instId) return '';
  if (INSTITUTIONS_REGISTRY && INSTITUTIONS_REGISTRY[instId]) {
    const inst = INSTITUTIONS_REGISTRY[instId];
    return inst.short_name || inst.name_en || inst.name || instId;
  }
  if (Array.isArray(INSTITUTIONS_REGISTRY)) {
    const inst = INSTITUTIONS_REGISTRY.find(i => (i.id === instId || i.institution_id === instId));
    return inst ? (inst.short_name || inst.name_en || inst.name || instId) : instId;
  }
  return instId;
}

/**
 * Renders an epistemic classification badge on paper canvas.
 */
function renderClassificationBadge(classification) {
  const c = classification || EPISTEMIC_CLASSIFICATION.FACT;
  let bg = "bg-[#FAF8F5]";
  let text = "text-paper-main";
  let border = "border-paper";

  if (c === EPISTEMIC_CLASSIFICATION.FACT) {
    bg = "bg-emerald-50";
    text = "text-emerald-800";
    border = "border-emerald-300";
  } else if (c === EPISTEMIC_CLASSIFICATION.CLAIM) {
    bg = "bg-amber-50";
    text = "text-amber-900";
    border = "border-amber-300";
  } else if (c === EPISTEMIC_CLASSIFICATION.ANALYSIS) {
    bg = "bg-sky-50";
    text = "text-sky-900";
    border = "border-sky-300";
  } else if (c === "DATA_GAP" || c === "GAP") {
    bg = "bg-[#FEF9C3]";
    text = "text-amber-900";
    border = "border-amber-400";
  }

  return `
    <span class="inline-flex items-center px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase border ${bg} ${text} ${border}">
      ${escapeHtml(c)}
    </span>
  `;
}

/**
 * Renders a record type badge.
 */
function renderRecordTypeBadge(type) {
  const formatted = (type || 'EVENT').replace(/_/g, ' ');
  return `
    <span class="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 bg-[#FAF8F5] border border-paper text-paper-dim font-bold">
      ${escapeHtml(formatted)}
    </span>
  `;
}

/**
 * Renders a promise or outcome status badge.
 */
function renderStatusBadge(status) {
  if (!status) return '';
  const s = String(status).toUpperCase();
  let colorClasses = "bg-[#FAF8F5] text-paper-main border-paper";
  let label = s.replace(/_/g, ' ');

  if (s === "UNFULFILLED" || s === "STALLED" || s === "REJECTED" || s === "NOT_PUBLISHED" || s === "BLOCKED") {
    colorClasses = "bg-[#FAF8F5] text-paper-red border-paper-red/40 font-bold";
  } else if (s === "FULFILLED" || s === "CONFIRMED" || s === "OPERATIONAL" || s === "PASSED" || s === "CERTIFIED") {
    colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
  } else if (s === "PARTIAL" || s === "MODIFIED" || s === "UNDER_REVIEW" || s === "PENDING" || s === "ACTIVE") {
    colorClasses = "bg-amber-50 text-amber-900 border-amber-300 font-semibold";
  }

  return `
    <span class="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border ${colorClasses}">
      ${escapeHtml(label)}
    </span>
  `;
}

/**
 * Renders source citations slip on paper.
 */
function renderSourceSlip(sourceIds) {
  if (!Array.isArray(sourceIds) || sourceIds.length === 0) return '';

  const sources = sourceIds.map(id => resolveSource(id)).filter(Boolean);
  if (sources.length === 0) return '';

  return `
    <div class="mt-3 pt-2.5 border-t border-paper/70 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-mono text-paper-dim">
      <span class="text-[9px] font-mono uppercase text-paper-sand font-bold">PRIMARY SOURCES:</span>
      ${sources.map(s => `
        <span class="inline-flex items-center gap-1">
          <strong class="text-paper-main font-medium">${escapeHtml(s.name)}</strong>
          ${s.jort_number ? `<span class="text-paper-muted">(${escapeHtml(s.jort_number)})</span>` : ''}
          ${s.publication_date ? `<span class="text-paper-dim text-[10px]">· ${escapeHtml(s.publication_date)}</span>` : ''}
          ${s.url ? `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="text-paper-red hover:underline text-[10px]">↗</a>` : ''}
        </span>
      `).join('<span class="text-paper/40">|</span>')}
    </div>
  `;
}

/**
 * Renders institutional responsibility attribution list.
 */
function renderResponsibilityList(recordId) {
  const respList = getResponsibilityForRecord(recordId);
  if (!respList || respList.length === 0) return '';

  return `
    <div class="mt-2 text-xs font-mono text-paper-muted flex flex-wrap items-center gap-2">
      <span class="text-[9px] uppercase font-bold text-paper-sand">RESPONSIBILITY:</span>
      ${respList.map(r => {
        const instName = resolveInstitutionName(r.institution_id);
        const roleLabel = r.role ? `(${escapeHtml(r.role.replace(/_/g, ' '))})` : '';
        return `
          <span class="px-2 py-0.5 bg-[#F2EFE9] border border-paper text-paper-main text-[10px] font-medium">
            ${escapeHtml(instName || r.institution_id)} ${roleLabel}
          </span>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Level 1 Information Hierarchy: Lead Chronology Item (Strong Documentary Treatment).
 */
export function renderLeadChronologyItem(rec) {
  if (!rec) return '';

  const dateStr = rec.date_start ? rec.date_start : (rec.date || '2019–2026');
  const typeBadge = renderRecordTypeBadge(rec.record_type);
  const classBadge = renderClassificationBadge(rec.classification);
  const statusBadge = renderStatusBadge(rec.status);

  let specificDetailsHtml = '';

  // PROMISE Metadata
  if (rec.record_type === RECORD_TYPES.PROMISE) {
    specificDetailsHtml = `
      <div class="mt-3 p-3.5 bg-[#FAF8F5] border border-paper space-y-1.5 text-xs font-sans">
        <div class="flex items-center justify-between text-[10px] font-mono text-paper-dim">
          <span>STATED COMMITMENT</span>
          <span>STATUS: <strong class="text-paper-red">${escapeHtml(rec.status || 'UNFULFILLED')}</strong></span>
        </div>
        <p class="text-paper-main font-serif italic text-sm">"${escapeHtml(rec.summary)}"</p>
        ${rec.stated_outcome_target ? `<div class="text-[11px] text-paper-muted pt-1">Target: <strong class="text-paper-main">${escapeHtml(rec.stated_outcome_target)}</strong></div>` : ''}
        ${rec.evaluation_notes ? `<div class="text-[11px] text-paper-muted pt-1 border-t border-paper/60">Evaluation: ${escapeHtml(rec.evaluation_notes)}</div>` : ''}
      </div>
    `;
  }

  // LAW / DECISION Metadata
  else if (rec.record_type === RECORD_TYPES.LAW || rec.record_type === RECORD_TYPES.DECISION) {
    specificDetailsHtml = `
      ${rec.jort_reference || rec.relevant_articles ? `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-paper text-xs font-mono text-paper-muted">
          ${rec.jort_reference ? `<div><strong class="text-paper-main">GAZETTE REF:</strong> ${escapeHtml(rec.jort_reference)}</div>` : ''}
          ${rec.relevant_articles && rec.relevant_articles.length > 0 ? `<div><strong class="text-paper-main">ARTICLES:</strong> ${escapeHtml(rec.relevant_articles.join(', '))}</div>` : ''}
        </div>
      ` : ''}
      ${rec.documented_effect ? `
        <div class="mt-2 text-xs font-sans text-paper-main p-2.5 bg-[#FAF8F5] border border-paper">
          <span class="text-[9px] font-mono uppercase text-paper-sand block font-bold">DOCUMENTED LEGAL EFFECT</span>
          ${escapeHtml(rec.documented_effect)}
        </div>
      ` : ''}
    `;
  }

  // INDICATOR Metadata
  else if (rec.record_type === RECORD_TYPES.INDICATOR) {
    specificDetailsHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 pt-2 border-t border-paper text-xs font-sans">
        <div class="p-3 bg-[#F2EFE9] border border-paper">
          <span class="text-[9px] font-mono uppercase text-paper-dim block font-bold">MEASURED VALUE</span>
          <span class="text-xl font-mono font-bold text-paper-red block mt-1">${escapeHtml(rec.value || '')}</span>
          <span class="text-[10px] font-mono text-paper-muted block mt-0.5">${escapeHtml(rec.unit || '')}</span>
        </div>
        <div class="p-3 bg-[#F2EFE9] border border-paper">
          <span class="text-[9px] font-mono uppercase text-paper-dim block font-bold">REFERENCE PERIOD</span>
          <span class="text-xs font-mono font-semibold text-paper-main block mt-1">${escapeHtml(rec.reference_period || 'Summer 2026')}</span>
          <span class="text-[10px] font-mono text-paper-muted block mt-0.5">INS Official Bulletin</span>
        </div>
        <div class="p-3 bg-[#F2EFE9] border border-paper">
          <span class="text-[9px] font-mono uppercase text-paper-dim block font-bold">HISTORICAL BASELINE</span>
          <span class="text-xs font-mono text-paper-main block mt-1 font-semibold">${escapeHtml(rec.baseline || 'Pre-2019 Baseline')}</span>
          <span class="text-[10px] font-mono text-paper-muted block mt-0.5">${escapeHtml(rec.comparison || 'Comparative trajectory')}</span>
        </div>
      </div>
      ${rec.comparability_notes ? `
        <div class="mt-2 text-[11px] font-mono text-paper-dim p-2 bg-[#FAF8F5] border border-paper">
          <strong class="text-paper-sand">COMPARABILITY NOTE:</strong> ${escapeHtml(rec.comparability_notes)}
        </div>
      ` : ''}
    `;
  }

  // OUTCOME Metadata
  else if (rec.record_type === RECORD_TYPES.OUTCOME) {
    specificDetailsHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 pt-2 border-t border-paper text-xs font-sans">
        <div class="p-3 bg-[#F2EFE9] border border-paper">
          <span class="text-[9px] font-mono uppercase text-paper-dim block font-bold">MEASURED RESULT</span>
          <span class="text-base font-mono font-bold text-paper-red block mt-1">${escapeHtml(rec.measurement || rec.result || '')}</span>
        </div>
        <div class="p-3 bg-[#F2EFE9] border border-paper">
          <span class="text-[9px] font-mono uppercase text-paper-dim block font-bold">BASELINE ANCHOR</span>
          <span class="text-xs font-mono text-paper-main block mt-1 font-semibold">${escapeHtml(rec.baseline || 'Pre-2019 Normal')}</span>
        </div>
        <div class="p-3 bg-[#F2EFE9] border border-paper">
          <span class="text-[9px] font-mono uppercase text-paper-sand block font-bold">CAUSATION STATUS</span>
          <span class="text-xs font-mono font-bold text-paper-main block mt-1">${escapeHtml((rec.causation_status || '').replace(/_/g, ' '))}</span>
        </div>
      </div>
    `;
  }

  // OFFICIAL STATEMENT Metadata
  else if (rec.record_type === RECORD_TYPES.OFFICIAL_STATEMENT) {
    specificDetailsHtml = `
      ${rec.statement_text_or_summary ? `
        <div class="mt-2 text-xs font-sans p-3 bg-[#F2EFE9] border border-paper space-y-1">
          <span class="text-[9px] font-mono text-paper-sand uppercase font-bold block">RECORDED STATEMENT</span>
          <blockquote class="text-paper-main font-light italic leading-relaxed">"${escapeHtml(rec.statement_text_or_summary)}"</blockquote>
          ${rec.speaker ? `<div class="text-[10px] font-mono text-paper-dim pt-1">Speaker: <strong class="text-paper-main">${escapeHtml(rec.speaker)}</strong> (${escapeHtml(rec.speaker_role || '')})</div>` : ''}
        </div>
      ` : ''}
    `;
  }

  const respHtml = renderResponsibilityList(rec.id);
  const sourceHtml = renderSourceSlip(rec.source_ids);

  return `
    <article class="chronology-record-item lead-record-item py-5 space-y-3 border-b border-paper last:border-b-0" id="${escapeHtml(rec.id)}" data-record-type="${escapeHtml(rec.record_type)}" data-record-classification="${escapeHtml(rec.classification)}">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div class="flex items-center gap-2 flex-wrap">
          <time class="text-xs font-mono font-bold text-paper-red">${escapeHtml(dateStr)}</time>
          <span class="text-[9px] font-mono uppercase px-2 py-0.5 bg-[#141517] text-white border border-[#141517] font-bold">LEAD ACTION</span>
          ${typeBadge}
          ${classBadge}
          ${statusBadge}
        </div>
        <div class="text-[10px] font-mono text-paper-dim">
          ID: <a href="/presidency/archive#${escapeHtml(rec.id)}" class="text-paper-muted hover:text-paper-red font-mono">${escapeHtml(rec.id)}</a>
        </div>
      </div>

      <h3 class="font-editorial font-bold text-paper-main text-lg sm:text-2xl leading-snug">
        <a href="/presidency/archive#${escapeHtml(rec.id)}" class="hover:text-paper-red transition-colors">
          ${escapeHtml(rec.title)}
        </a>
      </h3>

      <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-prose">
        ${escapeHtml(rec.summary)}
      </p>

      ${specificDetailsHtml}
      ${respHtml}
      ${sourceHtml}
    </article>
  `;
}

/**
 * Level 2 Information Hierarchy: Supporting Chronology Item (Compact Restrained Reading Row).
 */
export function renderSupportingChronologyItem(rec) {
  if (!rec) return '';

  const dateStr = rec.date_start ? rec.date_start : (rec.date || '2019–2026');
  const typeBadge = renderRecordTypeBadge(rec.record_type);
  const classBadge = renderClassificationBadge(rec.classification);
  const instNames = (rec.institution_ids || []).map(id => resolveInstitutionName(id)).filter(Boolean).join(', ');
  const sourceCount = (rec.source_ids || []).length;

  return `
    <article class="supporting-record-item py-3.5 border-b border-paper/50 last:border-b-0 space-y-1.5" id="${escapeHtml(rec.id)}" data-record-type="${escapeHtml(rec.record_type)}" data-record-classification="${escapeHtml(rec.classification)}">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2 flex-wrap">
          <time class="text-xs font-mono font-bold text-paper-red">${escapeHtml(dateStr)}</time>
          ${typeBadge}
          ${classBadge}
        </div>
        <a href="/presidency/archive#${escapeHtml(rec.id)}" class="text-[10px] font-mono text-paper-red hover:underline font-bold shrink-0">
          VIEW EVIDENCE →
        </a>
      </div>

      <h4 class="font-sans font-bold text-paper-main text-sm sm:text-base leading-snug">
        <a href="/presidency/archive#${escapeHtml(rec.id)}" class="hover:text-paper-red transition-colors">
          ${escapeHtml(rec.title)}
        </a>
      </h4>

      <p class="text-xs text-paper-muted font-light leading-relaxed">
        ${escapeHtml(rec.summary)}
      </p>

      <div class="flex items-center justify-between text-[10px] font-mono text-paper-dim pt-0.5">
        <span class="truncate max-w-md">${escapeHtml(instNames || rec.id)}</span>
        <span>${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'} · <span class="font-mono text-paper-muted">${escapeHtml(rec.id)}</span></span>
      </div>
    </article>
  `;
}

/**
 * Backward compatibility alias for legacy test runners.
 */
export function renderChronologyItem(rec) {
  return renderLeadChronologyItem(rec);
}

/**
 * Renders a structured Data Gap card on paper.
 */
function renderDataGapCard(gapRecord) {
  if (!gapRecord) return '';
  const statusBadge = renderStatusBadge(gapRecord.data_gap_status || 'NOT_PUBLISHED');
  const instName = resolveInstitutionName(gapRecord.institution_expected_to_hold_data);

  return `
    <div class="p-5 bg-[#FEF9C3]/50 border border-[#EAB308]/40 space-y-2.5" id="${escapeHtml(gapRecord.id)}" data-record-type="DATA_GAP">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#EAB308]/30">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-amber-600"></span>
          <span class="text-[10px] font-mono uppercase tracking-widest text-paper-sand font-bold">DOCUMENTED DATA GAP</span>
          ${statusBadge}
        </div>
        <div class="text-[10px] font-mono text-paper-dim">
          ID: ${escapeHtml(gapRecord.id)}
        </div>
      </div>

      <h4 class="font-sans font-bold text-paper-main text-sm sm:text-base">
        ${escapeHtml(gapRecord.title)}
      </h4>

      <p class="text-xs text-paper-muted font-light leading-relaxed">
        ${escapeHtml(gapRecord.summary)}
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-sans">
        <div class="p-2.5 bg-white border border-[#EAB308]/30">
          <span class="text-[9px] font-mono uppercase text-paper-dim font-bold block">INSTITUTION EXPECTED TO HOLD DATA</span>
          <span class="text-paper-main font-bold">${escapeHtml(instName || gapRecord.institution_expected_to_hold_data)}</span>
        </div>
        <div class="p-2.5 bg-white border border-[#EAB308]/30">
          <span class="text-[9px] font-mono uppercase text-paper-dim font-bold block">WHY THIS GAP MATTERS</span>
          <span class="text-paper-muted font-light">${escapeHtml(gapRecord.why_it_matters || '')}</span>
        </div>
      </div>

      ${gapRecord.search_or_request_status ? `
        <div class="text-[10px] font-mono text-paper-dim pt-2 border-t border-[#EAB308]/30">
          SEARCH STATUS: <span class="text-paper-main font-medium">${escapeHtml(gapRecord.search_or_request_status)}</span>
        </div>
      ` : ''}

      ${renderSourceSlip(gapRecord.source_ids)}
    </div>
  `;
}

/**
 * Renders a single accountability chain card.
 */
function renderTraceFamilyCard(tf) {
  const nodesHtml = tf.chain.map((stepItem, idx) => {
    const rec = getRecordById(stepItem.recordId);
    if (!rec) return '';
    const isLast = idx === tf.chain.length - 1;
    const dateStr = rec.date_start || rec.date || '2019–2026';
    const stepBadge = `
      <span class="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 bg-[#FAF8F5] border border-paper text-paper-red font-bold">
        ${escapeHtml(stepItem.step)}
      </span>
    `;
    const sourcesCount = (rec.source_ids || []).length;

    return `
      <div class="relative pl-8 sm:pl-10 pb-6 last:pb-0">
        ${!isLast ? '<div class="absolute left-3.5 sm:left-4.5 top-6 bottom-0 w-0.5 bg-paper-red/30"></div>' : ''}
        <div class="absolute left-1.5 sm:left-2.5 top-1.5 w-4 h-4 rounded-full bg-paper-red text-white flex items-center justify-center text-[9px] font-mono font-bold shadow-xs">
          ${idx + 1}
        </div>

        <div class="p-4 bg-[#FAF8F5] border border-paper hover:border-paper-red/60 transition-colors space-y-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              ${stepBadge}
              <span class="text-[10px] font-mono font-bold text-paper-red">${escapeHtml(dateStr)}</span>
              <span class="text-[10px] font-mono text-paper-dim uppercase font-semibold">· ${escapeHtml(stepItem.role)}</span>
            </div>
            <div class="flex items-center gap-2">
              ${renderClassificationBadge(rec.classification)}
              <span class="text-[9px] font-mono text-paper-dim">${sourcesCount} ${sourcesCount === 1 ? 'src' : 'srcs'}</span>
            </div>
          </div>

          <div class="font-sans font-bold text-paper-main text-sm">
            <a href="/presidency/archive#${escapeHtml(rec.id)}" class="hover:text-paper-red hover:underline">
              ${escapeHtml(rec.title)}
            </a>
          </div>

          <p class="text-xs text-paper-muted font-light leading-relaxed">
            ${escapeHtml(rec.summary)}
          </p>

          ${rec.value || rec.measurement ? `
            <div class="text-xs font-mono font-bold text-paper-red pt-1">
              MEASURED: ${escapeHtml(rec.value || rec.measurement)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="p-5 sm:p-6 bg-white border border-paper shadow-sm space-y-4" id="${escapeHtml(tf.id)}">
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-paper">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-[#FAF8F5] border border-paper text-paper-red">TRACE ${escapeHtml(tf.number)}</span>
            <h3 class="font-editorial text-xl sm:text-2xl text-paper-main font-normal">${escapeHtml(tf.title)}</h3>
          </div>
          <p class="text-xs font-sans text-paper-muted font-light mt-1">${escapeHtml(tf.subtitle)}</p>
        </div>
        <div class="text-[10px] font-mono text-paper-dim shrink-0">
          ${tf.chain.length} SEQUENTIAL NODES
        </div>
      </div>

      <div class="pt-2">
        ${nodesHtml}
      </div>
    </div>
  `;
}

/**
 * Renders the 7 Signature Accountability Chains (3 flagship visible + disclosure for remaining 4).
 */
function renderAccountabilityChainsSection() {
  const primaryTraces = TRACE_FAMILIES.slice(0, 3);
  const remainingTraces = TRACE_FAMILIES.slice(3);

  const primaryCardsHtml = primaryTraces.map(tf => renderTraceFamilyCard(tf)).join('');
  const remainingCardsHtml = remainingTraces.map(tf => renderTraceFamilyCard(tf)).join('');

  return `
    <section id="accountability-chains" class="space-y-6 pt-8 border-t border-paper" aria-label="Signature Accountability Chains">
      <div class="space-y-2 pb-4 border-b border-paper">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="text-xs font-mono uppercase tracking-widest text-paper-red font-bold block">SIGNATURE INVESTIGATION · 7 MULTI-HOP ACCOUNTABILITY TRACES</span>
          <span class="text-[10px] font-mono text-paper-dim">CANONICAL GRAPH EDGES · PROMISE → ACTION → OUTCOME → DATA GAP</span>
        </div>
        <h2 class="font-editorial text-3xl sm:text-4xl text-paper-main font-normal">Accountability Chains (2019–2026)</h2>
        <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-4xl">
          Follow an executive promise, structural decree, or policy declaration through implementation, verified administrative execution, measurable economic outcomes, and the evidence that remains available — or missing.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6">
        ${primaryCardsHtml}
      </div>

      <!-- Secondary Accountability Chains Disclosure -->
      <details class="group p-5 sm:p-6 bg-[#FAF8F5] border border-paper transition-all">
        <summary class="cursor-pointer flex items-center justify-between text-xs font-mono select-none list-none">
          <div class="flex items-center gap-2">
            <span class="text-paper-red font-bold uppercase tracking-wider group-open:hidden">▶ EXPLORE 4 MORE ACCOUNTABILITY CHAINS (TRACES 04–07)</span>
            <span class="text-paper-red font-bold uppercase tracking-wider hidden group-open:inline">▼ COLLAPSE SECONDARY ACCOUNTABILITY CHAINS</span>
          </div>
          <span class="text-[10px] font-mono text-paper-dim uppercase">DECREE 54 · SOVEREIGNTY · GABÈS · 2024 ELECTION</span>
        </summary>
        <div class="space-y-6 pt-6 mt-4 border-t border-paper/80">
          <div class="grid grid-cols-1 gap-6">
            ${remainingCardsHtml}
          </div>
        </div>
      </details>
    </section>
  `;
}

/**
 * Renders the Presidential Spine Navigation Bar for /presidency.
 */
function renderPresidentialSpine() {
  const eras = [
    { year: 2019, label: "MANDATE", count: 10 },
    { year: 2020, label: "GOVERNING CRISIS", count: 7 },
    { year: 2021, label: "RUPTURE", count: 10 },
    { year: 2022, label: "REORDERING", count: 13 },
    { year: 2023, label: "CONSOLIDATION", count: 13 },
    { year: 2024, label: "ELECTION", count: 12 },
    { year: 2025, label: "EFFECTS", count: 9 },
    { year: 2026, label: "OUTCOMES", count: 14 }
  ];

  const eraLinks = eras.map(e => `
    <a href="#year-${e.year}" class="p-3 bg-[#FAF8F5] border border-paper hover:border-paper-red hover:bg-white transition-all text-center group block">
      <span class="font-editorial text-xl sm:text-2xl text-paper-red font-normal block group-hover:scale-105 transition-transform">${e.year}</span>
      <span class="text-[9px] font-mono text-paper-main uppercase tracking-wider block font-bold mt-0.5">${e.label}</span>
      <span class="text-[9px] font-mono text-paper-dim block mt-0.5">${e.count} records</span>
    </a>
  `).join('');

  return `
    <section id="presidential-spine" class="p-5 sm:p-6 bg-white border border-paper shadow-sm space-y-4" aria-label="Presidential Chronology Spine">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-paper">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-paper-sand font-bold block">PRESIDENTIAL SPINE (2019 → 2026)</span>
          <div class="text-xs font-sans text-paper-muted mt-0.5">8 Chronological Eras · 88 Canonical Records · Deterministic Reading Hierarchy</div>
        </div>
        <div class="text-[10px] font-mono text-paper-dim">
          <a href="/presidency/archive" class="text-paper-red hover:underline font-bold">Open Full Archive Registry ↗</a>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
        ${eraLinks}
      </div>
    </section>
  `;
}

/**
 * Renders an entire year section with Level 1 Lead records, Level 2 Supporting records, and link to archive.
 */
function renderYearChronologySection(year, config, customModules = '') {
  const leadRecords = (config.leadIds || []).map(id => getRecordById(id)).filter(Boolean);
  const supportingRecords = (config.supportingIds || []).map(id => getRecordById(id)).filter(Boolean);

  const effectiveLeads = leadRecords.length > 0 ? leadRecords : config.featuredIds.slice(0, 1).map(id => getRecordById(id)).filter(Boolean);
  const effectiveSupporting = supportingRecords.length > 0 ? supportingRecords : config.featuredIds.slice(1).map(id => getRecordById(id)).filter(Boolean);

  const leadsHtml = effectiveLeads.map(r => `
    <div class="chronology-node lead-node">
      <span class="chronology-node-dot-paper"></span>
      ${renderLeadChronologyItem(r)}
    </div>
  `).join('');

  const supportingHtml = effectiveSupporting.length > 0 ? `
    <div class="chronology-supporting-block pl-4 sm:pl-6 border-l-2 border-paper/60 space-y-1 my-3 bg-[#FAF8F5]/50 p-3 sm:p-5 border border-paper">
      <div class="flex items-center justify-between pb-1 border-b border-paper/40 mb-2">
        <span class="text-[9px] font-mono uppercase tracking-widest text-paper-dim font-bold block">SUPPORTING DOCUMENTARY CHRONOLOGY · ${year}</span>
        <span class="text-[9px] font-mono text-paper-dim">${effectiveSupporting.length} RECORDS</span>
      </div>
      ${effectiveSupporting.map(r => renderSupportingChronologyItem(r)).join('')}
    </div>
  ` : '';

  return `
    <section id="year-${year}" class="space-y-6 pt-8 border-t border-paper">
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-paper">
        <div class="space-y-1">
          <div class="flex items-baseline gap-3">
            <span class="font-editorial text-4xl sm:text-5xl lg:text-6xl text-paper-red font-light tracking-tight">${year}</span>
            <span class="font-editorial text-2xl sm:text-3xl text-paper-main font-normal">— ${escapeHtml(config.title)}</span>
          </div>
          <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-3xl">${escapeHtml(config.subtitle)}</p>
        </div>
        <div class="text-[10px] font-mono text-paper-dim shrink-0">
          ${config.featuredIds.length} CURATED (${effectiveLeads.length} LEAD · ${effectiveSupporting.length} SUPPORTING) · ${config.allIds.length} IN ARCHIVE
        </div>
      </div>

      ${customModules ? `<div class="space-y-4">${customModules}</div>` : ''}

      <div class="chronology-spine-paper space-y-4 pt-2">
        ${leadsHtml}
        ${supportingHtml}
      </div>

      <div class="mt-4 pt-3 border-t border-paper/60 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
        <span class="text-paper-dim uppercase text-[10px]">${config.allIds.length} TOTAL ${year} RECORDS INDEXED IN ARCHIVE</span>
        <a href="/presidency/archive?year=${year}" class="text-paper-red hover:underline font-bold flex items-center gap-1 group">
          <span>VIEW COMPLETE ${year} ARCHIVE (${config.allIds.length} RECORDS)</span>
          <span class="group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </div>
    </section>
  `;
}

/**
 * Specialized 2021 Rupture / Decree 117 Comparison Module.
 */
function renderStateComparisonModule() {
  const stm = getRecordById("ROP-STM-2021-0725-001");
  const dec = getRecordById("ROP-DEC-2021-0922-001");
  if (!stm || !dec) return '';

  return `
    <div class="p-5 sm:p-6 bg-white border border-paper shadow-sm space-y-4 my-4">
      <div class="pb-3 border-b border-paper">
        <span class="text-[10px] font-mono uppercase tracking-meta text-paper-dim font-bold block">INSTITUTIONAL ANALYSIS</span>
        <h3 class="font-editorial text-2xl text-paper-main mt-1">July 25 Statement vs Decree 117 Concentration</h3>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- WHAT THE PRESIDENCY SAID -->
        <div class="lg:col-span-6 p-5 bg-[#FAF8F5] border border-paper space-y-3" id="${escapeHtml(stm.id)}-comp" data-record-type="OFFICIAL_STATEMENT">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-paper-sand font-bold">1. WHAT THE PRESIDENCY SAID</span>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-mono text-paper-dim">ID: ${escapeHtml(stm.id)}</span>
              ${renderClassificationBadge(stm.classification)}
            </div>
          </div>
          <blockquote class="font-editorial text-sm sm:text-base text-paper-main italic leading-relaxed">
            "${escapeHtml(stm.statement_text_or_summary || stm.summary)}"
          </blockquote>
          <div class="text-[10px] font-mono text-paper-muted pt-2 border-t border-paper">
            Speaker: <span class="text-paper-main font-bold">${escapeHtml(stm.speaker)}</span> · Date: 25 July 2021 · Carthage Palace
          </div>
          ${renderSourceSlip(stm.source_ids)}
        </div>

        <!-- WHAT THE RECORD SHOWS -->
        <div class="lg:col-span-6 p-5 bg-[#FAF8F5] border border-paper space-y-3" id="${escapeHtml(dec.id)}-comp" data-record-type="DECISION">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-paper-red font-bold">2. WHAT THE RECORD SHOWS</span>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-mono text-paper-dim">REF: ${escapeHtml(dec.id)}</span>
              ${renderClassificationBadge(dec.classification)}
            </div>
          </div>
          <div class="space-y-2 text-xs text-paper-muted font-light leading-relaxed">
            <p><strong class="text-paper-main font-semibold">Decree 117 (22 Sept 2021):</strong> Concentrated plenary executive and legislative decree authority in the presidency, suspended constitutional review mechanisms, and subordinated judicial careers to executive oversight.</p>
            <p><strong class="text-paper-sand font-semibold">Contested Legal Assessment:</strong> Venice Commission, National Bar Association, and international jurists documented the suspension of the separation of powers and lack of judicial remedies.</p>
          </div>
          <div class="text-[10px] font-mono text-paper-muted pt-2 border-t border-paper">
            Instrument: <span class="text-paper-main font-bold">Presidential Decree 2021-117 (JORT n° 86)</span>
          </div>
          ${renderSourceSlip(dec.source_ids)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Specialized 2024 Election Module: Certified 90.69% Result vs Administrative Court Appeals.
 */
function renderCertifiedVsContestedModule() {
  const elec2024 = getRecordById("ROP-EVT-2024-ELEC-001");
  const opp2024 = getRecordById("ROP-OPP-2024-ISIE-001");
  if (!elec2024 || !opp2024) return '';

  return `
    <div class="p-5 sm:p-6 bg-white border border-paper shadow-sm space-y-4 my-4">
      <div class="pb-3 border-b border-paper">
        <span class="text-[10px] font-mono uppercase tracking-meta text-paper-dim font-bold block">OCTOBER 2024 PRESIDENTIAL ELECTION</span>
        <h3 class="font-editorial text-2xl text-paper-main mt-1">Certified Outcome vs Procedural Challenges</h3>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- CERTIFIED RESULT -->
        <div class="lg:col-span-6 p-5 bg-[#FAF8F5] border border-paper space-y-3" id="${escapeHtml(elec2024.id)}-module" data-record-type="EVENT">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold">OFFICIAL CERTIFIED RESULT</span>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-mono text-paper-dim">ID: ${escapeHtml(elec2024.id)}</span>
              ${renderClassificationBadge(elec2024.classification)}
            </div>
          </div>
          <div class="text-2xl font-editorial font-bold text-paper-main">
            90.69% <span class="text-xs font-mono font-normal text-paper-muted">(2,438,954 ballots / 28.8% Turnout)</span>
          </div>
          <p class="text-xs text-paper-muted font-light leading-relaxed">
            ${escapeHtml(elec2024.summary)}
          </p>
          <div class="text-[10px] font-mono text-paper-dim pt-2 border-t border-paper">
            Certified by: <span class="text-paper-main font-bold">ISIE (Decision in JORT October 2024)</span>
          </div>
          ${renderSourceSlip(elec2024.source_ids)}
        </div>

        <!-- CONTESTED CLAIM -->
        <div class="lg:col-span-6 p-5 bg-[#FAF8F5] border border-paper space-y-3" id="${escapeHtml(opp2024.id)}-module" data-record-type="OPPOSITION_CLAIM">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-paper-sand font-bold">PROCEDURAL &amp; LEGAL CHALLENGES</span>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-mono text-paper-dim">ID: ${escapeHtml(opp2024.id)}</span>
              ${renderClassificationBadge(opp2024.classification)}
            </div>
          </div>
          <div class="text-sm font-sans font-semibold text-paper-main">
            Administrative Court Reinstatement Rulings Rejected
          </div>
          <p class="text-xs text-paper-muted font-light leading-relaxed">
            ${escapeHtml(opp2024.summary)}
          </p>
          <div class="text-[10px] font-mono text-paper-dim pt-2 border-t border-paper">
            Tribunal Administratif Rulings overridden by ISIE &amp; Law 2024-45
          </div>
          ${renderSourceSlip(opp2024.source_ids)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Section 07: Transition Hand-off Block to /presidency/archive.
 */
function renderExploreCompleteRecordSection() {
  return `
    <section id="the-complete-record" class="p-6 sm:p-8 bg-white border border-paper shadow-sm space-y-6" aria-label="The Complete Record Archive">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-paper">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-paper-red font-bold block">RESEARCH REPOSITORY</span>
          <h2 class="font-editorial text-2xl sm:text-3xl text-paper-main mt-1">The Complete Record of Power (2019–2026)</h2>
        </div>
        <div class="text-xs font-mono text-paper-muted">
          FULL SEARCH &amp; FILTER REGISTER
        </div>
      </div>

      <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-4xl">
        The primary investigation above traces 38 consequential structural shifts. The full Record of Power archive preserves every single documented event, legislative decree, ministerial appointment, economic indicator, and transparency data gap across all eight chronological eras.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1">
          <span class="text-[10px] font-mono text-paper-dim uppercase tracking-wider block font-bold">FULL REPOSITORY</span>
          <span class="font-editorial text-2xl text-paper-red font-normal mt-1 block">88 Records</span>
          <p class="text-[11px] text-paper-muted font-light">Every decree, decision, outcome, and indicator indexed with primary source citations.</p>
        </div>
        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1">
          <span class="text-[10px] font-mono text-paper-dim uppercase tracking-wider block font-bold">RESEARCH FILTERS</span>
          <span class="font-editorial text-2xl text-paper-main font-normal mt-1 block">10 Record Types</span>
          <p class="text-[11px] text-paper-muted font-light">Filter by Year, Legal Type, Epistemic Status (FACT/CLAIM), or Policy Domain.</p>
        </div>
        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1">
          <span class="text-[10px] font-mono text-paper-dim uppercase tracking-wider block font-bold">FORENSIC PROVENANCE</span>
          <span class="font-editorial text-2xl text-paper-sand font-normal mt-1 block">44 Sources</span>
          <p class="text-[11px] text-paper-muted font-light">Direct links to JORT, INS, Central Bank bulletins, and Administrative Court rulings.</p>
        </div>
      </div>

      <div class="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-paper/60">
        <a href="/presidency/archive" class="w-full sm:w-auto px-6 py-3.5 bg-[#B91C1C] hover:bg-[#991b1b] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors text-center shadow-sm flex items-center justify-center gap-2 group">
          <span>EXPLORE THE PRESIDENTIAL ARCHIVE (88 RECORDS)</span>
          <span class="group-hover:translate-x-1 transition-transform">→</span>
        </a>
        <div class="text-xs font-mono text-paper-dim">
          Shareable query filters · Instant client-side search · Stable record anchors
        </div>
      </div>
    </section>
  `;
}

/**
 * Renders the complete, rich, single-H1 documentary narrative for /presidency.
 */
export function renderPresidencyReportViewHtml() {
  const eco = ECONOMY_ARCHITECTURE_DATA;
  const trust = TRUST_MONITOR_DATA;

  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt;
      <a href="/the-files" class="hover:text-bone-100 transition-colors">The Files</a> &gt;
      <span class="text-bone-100 font-medium">The Record of Power (2019–2026)</span>
    </nav>
  `;

  // 01. Header Opener (Dark Investigative Canvas)
  const headerHtml = renderInvestigationOpener({
    breadcrumbHtml,
    eyebrow: "THE RECORD OF POWER",
    badge: "DOCUMENTARY CHRONOLOGY · 2019–2026",
    badgeClass: "bg-crimson/15 border-crimson/40 text-crimson font-bold",
    h1: "Tunisia under Kais Saied, 2019–2026",
    deck: "Power, promises and responsibility. A documented archive distinguishing official promises, executive decrees, structural laws, measured outcomes, and documented information gaps across eight chronological eras.",
    metadataItems: [
      { label: "ACCOUNTABILITY PERIOD", value: "2019 → 2026", highlight: true, subtext: "8 CHRONOLOGICAL ERAS" },
      { label: "RECORDS AUDITED", value: "88 CANONICAL RECORDS", highlight: false, subtext: "10 CORE TYPES REPRESENTED" },
      { label: "EPISTEMIC STANDARD", value: "FACT / CLAIM / ANALYSIS", highlight: false, subtext: "STRICT PROVENANCE SEPARATION" },
      { label: "PRIMARY SOURCES", value: "OFFICIAL GAZETTE & INS", highlight: false, subtext: "44 PRIMARY SOURCES LINKED" }
    ]
  });

  // 02. The Record in Numbers (Compact Restrained Editorial Statistics)
  const recordInNumbersHtml = `
    <section id="the-record-in-numbers" class="p-5 sm:p-6 bg-white border border-paper shadow-sm space-y-4" aria-label="The Record in Numbers">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-paper">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-paper-red font-bold block">QUANTITATIVE AUDIT BASELINE</span>
          <h2 class="font-editorial text-2xl text-paper-main mt-0.5">The Record in Numbers</h2>
        </div>
        <div class="text-[10px] font-mono text-paper-dim">
          R2.3 CANONICAL SELECTORS
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 text-left font-mono">
        <div class="p-3 bg-[#FAF8F5] border border-paper">
          <span class="text-[9px] text-paper-dim uppercase tracking-wider block">CANONICAL RECORDS</span>
          <span class="font-editorial text-2xl sm:text-3xl font-bold text-paper-red mt-1 block">${SEED_RECORDS.length}</span>
          <span class="text-[9px] text-paper-muted font-sans mt-0.5 block">10 Distinct Types</span>
        </div>
        <div class="p-3 bg-[#FAF8F5] border border-paper">
          <span class="text-[9px] text-paper-dim uppercase tracking-wider block">CHRONOLOGICAL ERAS</span>
          <span class="font-editorial text-2xl sm:text-3xl font-bold text-paper-main mt-1 block">08</span>
          <span class="text-[9px] text-paper-muted font-sans mt-0.5 block">2019 → 2026</span>
        </div>
        <div class="p-3 bg-[#FAF8F5] border border-paper">
          <span class="text-[9px] text-paper-dim uppercase tracking-wider block">PRIMARY SOURCES</span>
          <span class="font-editorial text-2xl sm:text-3xl font-bold text-paper-main mt-1 block">${SOURCE_MANIFEST.length}</span>
          <span class="text-[9px] text-paper-muted font-sans mt-0.5 block">JORT, INS, BCT, Court</span>
        </div>
        <div class="p-3 bg-[#FAF8F5] border border-paper">
          <span class="text-[9px] text-paper-dim uppercase tracking-wider block">ACCOUNTABILITY CHAINS</span>
          <span class="font-editorial text-2xl sm:text-3xl font-bold text-paper-main mt-1 block">07</span>
          <span class="text-[9px] text-paper-muted font-sans mt-0.5 block">Multi-Hop Traces</span>
        </div>
        <div class="p-3 bg-[#FAF8F5] border border-paper col-span-2 sm:col-span-1">
          <span class="text-[9px] text-paper-dim uppercase tracking-wider block">AUDITED DATA GAPS</span>
          <span class="font-editorial text-2xl sm:text-3xl font-bold text-amber-800 mt-1 block">04</span>
          <span class="text-[9px] text-paper-muted font-sans mt-0.5 block">Unpublished Ledgers</span>
        </div>
      </div>
    </section>
  `;

  // 08. Accountability Grammar Block
  const accountabilityGrammarHtml = renderAccountabilityQuestionBlock({
    title: "Documentary Rules & Neutrality Standard",
    questions: [
      { question: "What is the distinction between a FACT and a CLAIM in this record?", answer: "FACT denotes a statutory law, presidential decree, verified metric, or formal judicial action published in the Official Gazette (JORT) or official statistical bulletins. CLAIM denotes an official pledge, political speech justification, or opposition challenge, preserved as attributed text without editorial endorsement." },
      { question: "How are documented data gaps identified?", answer: "A DATA GAP represents a legally mandated or institutionally expected public record that 404TN audited and verified as absent, unpublished, or restricted from public access as of 2026." },
      { question: "How were accountability traces constructed?", answer: "Accountability traces link initial presidential promises or decrees to their subsequent statutory implementation, measured administrative outcomes, and identified data gaps using strict directional graph edges." }
    ]
  });

  // Resolve 2026 data gaps
  const gabesGap = getRecordById("ROP-GAP-2026-GABES-AIR-001");
  const reconGap = getRecordById("ROP-GAP-2026-RECON-RECEIPTS-001");
  const energyGap = getRecordById("ROP-GAP-2026-ENERGY-SUBSIDY");
  const civilGap = getRecordById("ROP-GAP-2026-CIVIL-SERVICE-CENSUS");

  return `
    <article class="presidency-report-view">

      <!-- 01. INVESTIGATION OPENER (DARK CANVAS) -->
      <div class="bg-background text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          ${headerHtml}
        </div>
      </div>

      <!-- 02. INVESTIGATIVE NARRATIVE BODY (WARM PAPER CANVAS) -->
      <div class="surface-paper py-10 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

          <!-- 02. THE RECORD IN NUMBERS -->
          ${recordInNumbersHtml}

          <!-- 03. SIGNATURE FEATURE: 7 ACCOUNTABILITY CHAINS -->
          ${renderAccountabilityChainsSection()}

          <!-- 04. 2019→2026 PRESIDENTIAL SPINE -->
          ${renderPresidentialSpine()}

          <!-- 05. CURATED ERA-BY-ERA DOCUMENTARY RECORD (3-LEVEL HIERARCHY) -->

          <!-- ERA 1: 2019 — MANDATE & PROMISES -->
          ${renderYearChronologySection(2019, CURATED_ERA_CONFIG[2019])}

          <!-- ERA 2: 2020 — GOVERNING CRISIS & PANDEMIC -->
          ${renderYearChronologySection(2020, CURATED_ERA_CONFIG[2020])}

          <!-- ERA 3: 2021 — JULY 25 RUPTURE & DECREE 117 -->
          ${renderYearChronologySection(
            2021,
            CURATED_ERA_CONFIG[2021],
            renderStateComparisonModule()
          )}

          <!-- ERA 4: 2022 — CONSTITUTIONAL REORDERING -->
          ${renderYearChronologySection(2022, CURATED_ERA_CONFIG[2022])}

          <!-- ERA 5: 2023 — POLITICAL CONSOLIDATION & SOVEREIGNTY -->
          ${renderYearChronologySection(2023, CURATED_ERA_CONFIG[2023])}

          <!-- ERA 6: 2024 — BCT LENDING, SECOND CHAMBER & RE-ELECTION -->
          ${renderYearChronologySection(
            2024,
            CURATED_ERA_CONFIG[2024],
            renderCertifiedVsContestedModule()
          )}

          <!-- ERA 7: 2025 — OUTCOMES & INSTITUTIONAL EFFECTS -->
          ${renderYearChronologySection(2025, CURATED_ERA_CONFIG[2025])}

          <!-- ERA 8: 2026 — MEASURABLE RESULTS & ACCOUNTABILITY -->
          <section id="year-2026" class="space-y-8 pt-8 border-t border-paper">
            <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-paper">
              <div class="space-y-1">
                <div class="flex items-baseline gap-3">
                  <span class="font-editorial text-4xl sm:text-5xl lg:text-6xl text-paper-red font-light tracking-tight">2026</span>
                  <span class="font-editorial text-2xl sm:text-3xl text-paper-main font-normal">— The Record &amp; Measured Outcomes</span>
                </div>
                <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-3xl">Seven years following the 2019 mandate and five years following the July 2021 rupture, all institutional mechanisms are directly accountable to the presidency. 404TN measures macroeconomic indicators, public service delivery, and documented data gaps.</p>
              </div>
              <div class="text-[10px] font-mono text-paper-dim shrink-0">
                14 TOTAL RECORDS · 4 TRANSPARENCY DATA GAPS
              </div>
            </div>

            <!-- Macroeconomic Indicators & Public Services (Open broadsheet 2-column layout) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              ${renderLeadChronologyItem(getRecordById("ROP-IND-UNEMP-GRAD-001"))}
              ${renderLeadChronologyItem(getRecordById("ROP-IND-GDP-GROWTH-001"))}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              ${renderLeadChronologyItem(getRecordById("ROP-IND-2026-PUBLIC-DEBT"))}
              ${renderLeadChronologyItem(getRecordById("ROP-IND-2026-INFLATION-FOOD"))}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              ${renderLeadChronologyItem(getRecordById("ROP-IND-2026-ENERGY-DEFICIT"))}
              ${renderLeadChronologyItem(getRecordById("ROP-IND-2026-FX-DAYS"))}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              ${renderLeadChronologyItem(getRecordById("ROP-OUT-2026-RECON-001"))}
              ${renderLeadChronologyItem(getRecordById("ROP-OUT-2026-WATER-001"))}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              ${renderLeadChronologyItem(getRecordById("ROP-OUT-2026-GABES-RELOC-FAIL"))}
              ${renderLeadChronologyItem(getRecordById("ROP-OUT-2026-DL54-CONVICT"))}
            </div>

            <!-- Documented Data Gaps Sub-Section -->
            <div class="space-y-4 pt-6 border-t border-paper">
              <div class="flex items-center justify-between pb-2 border-b border-paper">
                <span class="text-xs font-mono uppercase tracking-widest text-paper-sand font-bold">DOCUMENTED TRANSPARENCY DATA GAPS</span>
                <span class="text-[10px] font-mono text-paper-dim">4 AUDITED GAPS</span>
              </div>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${gabesGap ? renderDataGapCard(gabesGap) : ''}
                ${reconGap ? renderDataGapCard(reconGap) : ''}
                ${energyGap ? renderDataGapCard(energyGap) : ''}
                ${civilGap ? renderDataGapCard(civilGap) : ''}
              </div>
            </div>

            <!-- Sovereign Ratings & Public Trust Benchmarks -->
            <div class="space-y-6 pt-6 border-t border-paper">
              <div class="flex items-center justify-between pb-2 border-b border-paper">
                <span class="text-xs font-mono uppercase tracking-widest text-paper-muted font-bold">SOVEREIGN RATINGS &amp; PUBLIC TRUST TRAJECTORY</span>
                <span class="text-[10px] font-mono text-paper-dim">ARAB BAROMETER · MOODY'S · FITCH</span>
              </div>

              <div class="space-y-3">
                ${eco.sovereignRatings.map(r => `
                  <div class="p-4 bg-white border border-paper flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="font-sans font-bold text-paper-main text-sm">${escapeHtml(r.agency)}</span>
                        <span class="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#F2EFE9] border border-paper text-paper-muted">${escapeHtml(r.date)}</span>
                      </div>
                      ${r.rationale ? `<p class="text-xs text-paper-muted font-light max-w-xl">${escapeHtml(r.rationale)}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-3 shrink-0">
                      <div class="text-right">
                        <span class="text-[9px] font-mono text-paper-dim uppercase block">PREV: ${escapeHtml(r.previousRating)}</span>
                        <span class="text-xs font-mono text-paper-sand">${escapeHtml(r.outlook)}</span>
                      </div>
                      <div class="text-2xl font-mono font-bold text-paper-red px-3 py-1 bg-[#F2EFE9] border border-paper">
                        ${escapeHtml(r.currentRating)}
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                ${trust.benchmarks.slice(0, 3).map(bm => `
                  <div class="p-5 sm:p-6 bg-white border border-paper shadow-sm space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-paper">
                      <div>
                        <span class="text-[10px] font-mono uppercase tracking-meta text-paper-dim">SURVEY EVIDENCE</span>
                        <div class="font-sans font-bold text-paper-main text-sm sm:text-base">${escapeHtml(trust.metadata.primarySource)}</div>
                      </div>
                      <div class="text-[10px] font-mono text-paper-dim">
                        ${escapeHtml(trust.metadata.sampleSize)} · ±2.5% MoE
                      </div>
                    </div>

                    ${bm.question ? `
                      <div class="p-3 bg-[#FAF8F5] border border-paper text-xs font-sans text-paper-muted italic">
                        "${escapeHtml(bm.question)}"
                      </div>
                    ` : ''}

                    <div class="space-y-3 pt-1">
                      ${bm.results.map(r => `
                        <div class="space-y-1">
                          <div class="flex items-center justify-between text-xs font-mono">
                            <span class="text-paper-muted">${escapeHtml(r.wave)}: ${escapeHtml(r.note || '')}</span>
                            <span class="font-bold ${r.highlight ? 'text-paper-red' : 'text-paper-main'}">${escapeHtml(String(r.value))}%</span>
                          </div>
                          <div class="w-full h-1.5 bg-[#E5E0D8] rounded-full overflow-hidden">
                            <div class="${r.highlight ? 'bg-[#B91C1C]' : 'bg-[#141517]'}" style="width: ${Math.min(100, Math.max(0, r.value))}%; height: 100%;"></div>
                          </div>
                        </div>
                      `).join("")}
                    </div>

                    <div class="pt-3 border-t border-paper text-[10px] font-mono text-paper-dim">
                      METHODOLOGY: ${escapeHtml(trust.metadata.methodology)}
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <!-- 2026 Archive Link -->
            <div class="mt-6 pt-4 border-t border-paper flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
              <span class="text-paper-dim uppercase text-[10px]">14 TOTAL 2026 RECORDS &amp; DATA GAPS</span>
              <a href="/presidency/archive?year=2026" class="text-paper-red hover:underline font-bold flex items-center gap-1 group">
                <span>EXPLORE ALL 2026 RECORDS IN ARCHIVE</span>
                <span class="group-hover:translate-x-0.5 transition-transform">→</span>
              </a>
            </div>
          </section>

          <!-- 07. EXPLORE THE COMPLETE RECORD (TRANSITION TO /presidency/archive) -->
          ${renderExploreCompleteRecordSection()}

          <!-- 08. METHODOLOGICAL / SOURCE CLOSING & EPISTEMIC STANDARDS -->
          <section id="methodological-closing" class="p-6 sm:p-8 bg-white border border-paper shadow-sm space-y-6" aria-label="Methodology and Epistemic Standards">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-paper">
              <div>
                <span class="text-xs font-mono uppercase tracking-widest text-paper-red font-bold block">404TN EPISTEMIC STANDARD &amp; VERIFICATION RULES</span>
                <h3 class="font-editorial text-2xl text-paper-main mt-1">404TN Documentary Methodology</h3>
              </div>
              <div class="flex items-center gap-3 text-xs font-mono">
                <a href="/evidence" class="text-paper-red hover:underline font-bold">Sources Registry ↗</a>
                <span class="text-paper-dim">·</span>
                <a href="/methodology" class="text-paper-main hover:underline font-bold">Methodology Standard ↗</a>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
              <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1.5">
                <span class="text-[10px] font-mono text-paper-main font-bold uppercase block">FACT</span>
                <p class="text-paper-muted font-light leading-relaxed">Discrete assertions directly substantiated by official gazettes (JORT), statutory bulletins, or accredited empirical surveys.</p>
              </div>
              <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1.5">
                <span class="text-[10px] font-mono text-paper-sand font-bold uppercase block">CLAIM · ATTRIBUTED</span>
                <p class="text-paper-muted font-light leading-relaxed">Government declarations, speech justifications, or opposition allegations. Preserved as attributed discourse; never converted to fact.</p>
              </div>
              <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1.5">
                <span class="text-[10px] font-mono text-paper-red font-bold uppercase block">ANALYSIS</span>
                <p class="text-paper-muted font-light leading-relaxed">404TN investigative interpretation and contextual synthesis of documented evidence and legal transformations.</p>
              </div>
              <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1.5">
                <span class="text-[10px] font-mono text-amber-800 font-bold uppercase block">DATA GAPS</span>
                <p class="text-paper-muted font-light leading-relaxed">Systematically documented missing or unpublished state datasets, tracked as legitimate empirical transparency findings.</p>
              </div>
            </div>

            ${accountabilityGrammarHtml}
          </section>

        </div>
      </div>

      <!-- CONNECTED INVESTIGATIVE FILES (EDITORIAL TRANSITION) -->
      <section class="bg-background text-bone-100 py-12 border-t border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase tracking-widest text-surface-400 block font-semibold">CONNECTED THEMATIC DOSSIERS</span>
            <a href="/the-files" class="text-xs font-mono text-sand hover:underline">View All 07 Files ↗</a>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/issues/water" class="p-4 bg-background-elevated hover:bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors group flex items-center justify-between text-xs font-mono">
              <span class="text-bone-100 group-hover:text-crimson font-medium">File 01: Water Deficit (21.4%)</span>
              <span class="text-surface-400 group-hover:text-bone-100">→</span>
            </a>
            <a href="/issues/electricity" class="p-4 bg-background-elevated hover:bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors group flex items-center justify-between text-xs font-mono">
              <span class="text-bone-100 group-hover:text-crimson font-medium">File 02: Electrical Stress (52%)</span>
              <span class="text-surface-400 group-hover:text-bone-100">→</span>
            </a>
            <a href="/gabes" class="p-4 bg-background-elevated hover:bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors group flex items-center justify-between text-xs font-mono">
              <span class="text-bone-100 group-hover:text-crimson font-medium">Gabès Flagship Investigation</span>
              <span class="text-surface-400 group-hover:text-bone-100">→</span>
            </a>
            <a href="/issues/rights" class="p-4 bg-background-elevated hover:bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors group flex items-center justify-between text-xs font-mono">
              <span class="text-bone-100 group-hover:text-crimson font-medium">File 07: Rights &amp; Freedoms</span>
              <span class="text-surface-400 group-hover:text-bone-100">→</span>
            </a>
          </div>
        </div>
      </section>

    </article>
  `;
}

/**
 * Renders an accessible compact row for the Documentary Evidence Index on /presidency/archive.
 */
export function renderArchiveRecordRow(rec) {
  const dateStr = rec.date_start ? rec.date_start : (rec.date || '2019–2026');
  const typeBadge = renderRecordTypeBadge(rec.record_type);
  const classBadge = renderClassificationBadge(rec.classification);
  const statusBadge = renderStatusBadge(rec.status);
  const instNames = (rec.institution_ids || []).map(id => resolveInstitutionName(id)).filter(Boolean).join(', ');
  const sourceCount = (rec.source_ids || []).length;
  const yearStr = rec.year ? String(rec.year) : (dateStr.match(/\b(2019|2020|2021|2022|2023|2024|2025|2026)\b/) ? dateStr.match(/\b(2019|2020|2021|2022|2023|2024|2025|2026)\b/)[0] : '2019');

  const respHtml = renderResponsibilityList(rec.id);
  const sourceHtml = renderSourceSlip(rec.source_ids);

  const searchIndexString = [
    rec.id,
    rec.title,
    rec.short_title || '',
    rec.summary || '',
    rec.official_title || '',
    rec.record_type || '',
    rec.classification || '',
    yearStr,
    instNames,
    (rec.issue_tags || []).join(' '),
    rec.jort_reference || '',
    (rec.relevant_articles || []).join(' ')
  ].join(' ').toLowerCase();

  return `
    <details class="archive-record-details archive-record-row group border border-paper bg-white hover:border-paper-red/60 transition-colors" id="${escapeHtml(rec.id)}" data-year="${yearStr}" data-type="${escapeHtml(rec.record_type)}" data-classification="${escapeHtml(rec.classification)}" data-search="${escapeHtml(searchIndexString)}">
      <summary class="cursor-pointer select-none p-3.5 sm:p-4 list-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">

        <!-- Left: Date & Type Badge -->
        <div class="flex items-center gap-2 sm:w-48 shrink-0 font-mono">
          <time class="text-xs font-bold text-paper-red shrink-0">${escapeHtml(dateStr)}</time>
          ${typeBadge}
        </div>

        <!-- Center: Record Title & Institution / ID Meta -->
        <div class="flex-1 min-w-0 pr-2">
          <div class="font-sans font-bold text-paper-main text-sm sm:text-base leading-snug group-hover:text-paper-red transition-colors">
            ${escapeHtml(rec.title)}
          </div>
          <div class="text-[10px] font-mono text-paper-dim mt-0.5 flex items-center gap-2 flex-wrap">
            <span class="truncate max-w-sm">${escapeHtml(instNames || rec.id)}</span>
            <span>·</span>
            <span class="text-paper-muted">ID: ${escapeHtml(rec.id)}</span>
            ${statusBadge ? `<span>·</span>${statusBadge}` : ''}
          </div>
        </div>

        <!-- Right: Epistemic Standard & Evidence Disclosure Toggle -->
        <div class="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-paper/40">
          ${classBadge}
          <span class="text-[10px] font-mono text-paper-dim">${sourceCount} ${sourceCount === 1 ? 'src' : 'srcs'}</span>
          <span class="text-paper-red text-xs font-mono font-bold group-open:rotate-180 transition-transform">▼</span>
        </div>

      </summary>

      <!-- Expanded Documentary Evidence Docket -->
      <div class="p-4 sm:p-5 bg-[#FAF8F5] border-t border-paper space-y-3.5 text-xs font-sans border-l-2 border-l-paper-red">

        <!-- Summary / Stated Purpose -->
        <div>
          <span class="text-[9px] font-mono uppercase text-paper-dim font-bold block">CANONICAL SUMMARY &amp; CONTEXT</span>
          <p class="text-xs text-paper-main font-light leading-relaxed mt-0.5">${escapeHtml(rec.summary)}</p>
        </div>

        ${rec.official_title ? `
          <div>
            <span class="text-[9px] font-mono uppercase text-paper-dim font-bold block">OFFICIAL STATUTORY TITLE</span>
            <p class="text-xs font-mono text-paper-main mt-0.5">${escapeHtml(rec.official_title)}</p>
          </div>
        ` : ''}

        ${rec.stated_purpose || rec.stated_commitment || rec.stated_outcome_target ? `
          <div>
            <span class="text-[9px] font-mono uppercase text-paper-sand font-bold block">STATED PURPOSE / PLEDGED TARGET</span>
            <p class="text-xs text-paper-muted italic mt-0.5 font-serif">"${escapeHtml(rec.stated_purpose || rec.stated_commitment || rec.stated_outcome_target)}"</p>
          </div>
        ` : ''}

        ${rec.documented_effect ? `
          <div>
            <span class="text-[9px] font-mono uppercase text-paper-sand font-bold block">DOCUMENTED LEGAL EFFECT</span>
            <p class="text-xs text-paper-main mt-0.5">${escapeHtml(rec.documented_effect)}</p>
          </div>
        ` : ''}

        ${rec.value || rec.measurement || rec.result ? `
          <div class="p-2.5 bg-white border border-paper flex items-center justify-between text-xs font-mono">
            <span class="text-[9px] uppercase tracking-wider text-paper-sand font-bold">MEASURED STATISTICAL RECORD:</span>
            <span class="font-bold text-paper-red">${escapeHtml(rec.value || rec.measurement || rec.result)} ${rec.unit ? `<span class="text-paper-muted font-normal">(${escapeHtml(rec.unit)})</span>` : ''}</span>
          </div>
        ` : ''}

        ${rec.jort_reference || rec.relevant_articles ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-paper-muted pt-1 border-t border-paper/60">
            ${rec.jort_reference ? `<div>GAZETTE: <strong class="text-paper-main">${escapeHtml(rec.jort_reference)}</strong></div>` : ''}
            ${rec.relevant_articles && rec.relevant_articles.length > 0 ? `<div>ARTICLES: <span class="text-paper-main">${escapeHtml(rec.relevant_articles.join(', '))}</span></div>` : ''}
          </div>
        ` : ''}

        ${rec.editorial_notes ? `
          <div class="text-[11px] font-sans text-paper-muted pt-1 border-t border-paper/60">
            <strong class="text-paper-dim font-mono text-[9px] uppercase">EDITORIAL NOTE:</strong> ${escapeHtml(rec.editorial_notes)}
          </div>
        ` : ''}

        ${rec.related_record_ids && rec.related_record_ids.length > 0 ? `
          <div class="pt-1 border-t border-paper/60 text-[10px] font-mono">
            <span class="text-paper-dim uppercase font-bold">CONNECTED RECORDS:</span>
            ${rec.related_record_ids.map(rid => `<a href="#${escapeHtml(rid)}" class="ml-1 text-paper-red hover:underline font-bold">${escapeHtml(rid)}</a>`).join(', ')}
          </div>
        ` : ''}

        ${respHtml}
        ${sourceHtml}
      </div>
    </details>
  `;
}

/**
 * Backward compatibility alias for legacy test runners.
 */
export function renderArchiveRecordCard(rec) {
  return renderArchiveRecordRow(rec);
}

/**
 * Renders the 3 signature orientation cards at the top of the archive.
 */
function renderArchiveFeaturedOrientationSection() {
  const featuredRecordIds = [
    { id: "ROP-EVT-2021-0725-001", label: "25 JULY 2021", theme: "Article 80 Exceptional Rupture" },
    { id: "ROP-DEC-2021-0922-001", label: "DECREE 117", theme: "Concentration of Plenary Powers" },
    { id: "ROP-LAW-2022-CONST-001", label: "2022 CONSTITUTION", theme: "Promulgation of New Executive Order" }
  ];

  const cardsHtml = featuredRecordIds.map(item => {
    const rec = getRecordById(item.id);
    if (!rec) return '';
    return `
      <a href="#${escapeHtml(rec.id)}" class="p-3.5 bg-white border border-paper hover:border-paper-red transition-all block group">
        <div class="flex items-center justify-between text-[9px] font-mono text-paper-dim pb-1 border-b border-paper/40">
          <span class="font-bold text-paper-red">${escapeHtml(item.label)}</span>
          ${renderClassificationBadge(rec.classification)}
        </div>
        <div class="font-sans font-bold text-paper-main text-xs sm:text-sm mt-1.5 group-hover:text-paper-red transition-colors line-clamp-2">
          ${escapeHtml(rec.title)}
        </div>
        <div class="text-[10px] font-mono text-paper-dim mt-1">
          ${escapeHtml(item.theme)}
        </div>
      </a>
    `;
  }).join('');

  return `
    <section id="archive-featured-records" class="space-y-2 pt-2" aria-label="Signature Archival Anchors">
      <div class="flex items-center justify-between text-[10px] font-mono uppercase text-paper-dim font-bold">
        <span>FEATURED ORIENTATION ANCHORS</span>
        <span>KEY CONSTITUTIONAL TURNING POINTS</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${cardsHtml}
      </div>
    </section>
  `;
}

/**
 * Renders the complete, searchable, filterable research archive view for /presidency/archive.
 */
export function renderPresidencyArchiveViewHtml() {
  // Group all 88 records by year
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const eraTitles = {
    2019: "Mandate & Founding Pledges",
    2020: "Governing Crisis & Pandemic",
    2021: "July 25 Rupture & Decree 117",
    2022: "Constitutional Reordering",
    2023: "Political Consolidation & Sovereignty",
    2024: "BCT Lending & Presidential Re-election",
    2025: "Institutional Outcomes & Public Confidence",
    2026: "Measured Results & Audited Transparency Gaps"
  };

  const yearGroupsHtml = years.map(y => {
    const eraConfig = CURATED_ERA_CONFIG[y];
    const yearRecords = (eraConfig && eraConfig.allIds) ? eraConfig.allIds.map(id => getRecordById(id)).filter(Boolean) : getRecordsByYear(y);
    const rowsHtml = yearRecords.map(rec => renderArchiveRecordRow(rec)).join('');

    return `
      <div class="archive-year-group space-y-2 pt-6 first:pt-0" data-year="${y}">
        <div class="flex items-center justify-between pb-2 border-b-2 border-paper/80">
          <div class="flex items-baseline gap-2.5">
            <span class="font-editorial text-2xl sm:text-3xl text-paper-red font-light">${y}</span>
            <span class="text-xs font-mono uppercase text-paper-main font-bold">· ${escapeHtml(eraTitles[y])}</span>
          </div>
          <span class="text-[10px] font-mono text-paper-dim uppercase font-bold">${yearRecords.length} RECORDS</span>
        </div>
        <div class="space-y-1.5 pt-1">
          ${rowsHtml}
        </div>
      </div>
    `;
  }).join('');

  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt;
      <a href="/presidency" class="hover:text-bone-100 transition-colors">The Record of Power</a> &gt;
      <span class="text-bone-100 font-medium">Presidential Archive (2019–2026)</span>
    </nav>
  `;

  // 01. Archive Opener Header (Dark Investigative Canvas)
  const headerHtml = `
    <header id="prerendered-route-header" class="space-y-6 pb-10 border-b border-surface-800">
      ${breadcrumbHtml}

      <div class="space-y-3">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-bold">THE RECORD OF POWER</span>
          <span class="text-[10px] font-mono px-2 py-0.5 border uppercase font-semibold bg-crimson/15 border-crimson/40 text-crimson font-bold">PRESIDENTIAL RECORD ARCHIVE · 2019—2026</span>
        </div>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 class="font-editorial text-3xl sm:text-5xl lg:text-6xl text-bone-100 font-normal leading-[1.12] tracking-tight">
              Presidential Record Archive 2019 — 2026
            </h1>
            <p class="text-base sm:text-lg text-surface-300 font-light leading-relaxed max-w-3xl mt-2">
              A structured forensic record of 88 documented events, promises, decisions, laws, institutional transformations, official statements, opposition claims, measurable outcomes, economic indicators, and information gaps during the presidency of Kais Saied.
            </p>
          </div>
          <div class="shrink-0">
            <a href="/presidency" class="inline-flex items-center gap-2 px-4 py-2.5 bg-surface-900 hover:bg-surface-800 border border-surface-700 hover:border-surface-500 text-bone-100 text-xs font-mono uppercase tracking-wider transition-colors">
              <span>← READ THE INVESTIGATION</span>
            </a>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-surface-800/80">
        <div class="p-3 sm:p-4 bg-surface-900/60 border border-surface-800">
          <span class="text-[10px] font-mono text-surface-400 uppercase tracking-meta block">CANONICAL ARCHIVE</span>
          <span class="text-xs sm:text-sm font-mono text-crimson font-bold uppercase mt-0.5 block">${SEED_RECORDS.length} TOTAL RECORDS</span>
          <span class="text-[10px] font-mono text-surface-500 block mt-0.5">COMPLETE 2019–2026 DATASET</span>
        </div>
        <div class="p-3 sm:p-4 bg-surface-900/60 border border-surface-800">
          <span class="text-[10px] font-mono text-surface-400 uppercase tracking-meta block">CHRONOLOGY</span>
          <span class="text-xs sm:text-sm font-mono text-bone-100 font-bold uppercase mt-0.5 block">8 ERAS INDEXED</span>
          <span class="text-[10px] font-mono text-surface-500 block mt-0.5">2019 THROUGH 2026</span>
        </div>
        <div class="p-3 sm:p-4 bg-surface-900/60 border border-surface-800">
          <span class="text-[10px] font-mono text-surface-400 uppercase tracking-meta block">TAXONOMY</span>
          <span class="text-xs sm:text-sm font-mono text-bone-100 font-bold uppercase mt-0.5 block">10 RECORD TYPES</span>
          <span class="text-[10px] font-mono text-surface-500 block mt-0.5">PROMISE TO DATA GAP</span>
        </div>
        <div class="p-3 sm:p-4 bg-surface-900/60 border border-surface-800">
          <span class="text-[10px] font-mono text-surface-400 uppercase tracking-meta block">PROVENANCE</span>
          <span class="text-xs sm:text-sm font-mono text-bone-100 font-bold uppercase mt-0.5 block">${SOURCE_MANIFEST.length} PRIMARY SOURCES</span>
          <span class="text-[10px] font-mono text-surface-500 block mt-0.5">OFFICIAL GAZETTE &amp; BULLETINS</span>
        </div>
      </div>
    </header>
  `;

  return `
    <article class="presidency-archive-page">

      <!-- 01. ARCHIVE HERO OPENER (DARK INVESTIGATIVE CANVAS) -->
      <div class="bg-background text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          ${headerHtml}
        </div>
      </div>

      <!-- 02. SEARCH, FILTER & DOCUMENTARY ARCHIVE (WARM PAPER CANVAS) -->
      <div class="surface-paper py-10 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          <!-- Interactive Search and Filter Apparatus -->
          <section id="archive-controls" class="p-5 sm:p-6 bg-white border border-paper shadow-sm space-y-5" aria-label="Archive Search and Filter Controls">

            <!-- Search Bar -->
            <div class="space-y-1.5">
              <label for="archive-search-input" class="text-xs font-mono uppercase tracking-widest text-paper-sand font-bold block">
                SEARCH ARCHIVE
              </label>
              <div class="relative">
                <input
                  type="search"
                  id="archive-search-input"
                  placeholder="Search by title, ID, institution, issue, legal instrument, or keyword..."
                  class="w-full px-4 py-3 bg-[#FAF8F5] border border-paper text-paper-main placeholder-paper-dim text-sm font-sans focus:outline-none focus:border-paper-red transition-colors"
                />
              </div>
            </div>

            <!-- Filter Controls Matrix -->
            <div class="space-y-4 pt-4 border-t border-paper/60 text-xs font-mono">

              <!-- Era / Year Filter Row -->
              <div class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] uppercase font-bold text-paper-dim">CHRONOLOGICAL ERA:</span>
                  <span class="text-[10px] text-paper-dim">2019 → 2026</span>
                </div>
                <div class="flex flex-wrap gap-1.5" id="archive-year-filters">
                  <button type="button" data-year="ALL" class="archive-filter-btn px-2.5 py-1 bg-[#141517] text-white border border-[#141517] font-bold text-[11px] transition-colors">ALL (88)</button>
                  <button type="button" data-year="2019" class="archive-filter-btn px-2.5 py-1 bg-[#FAF8F5] text-paper-main border border-paper hover:border-paper-red font-medium text-[11px] transition-colors">2019 (10)</button>
                  <button type="button" data-year="2020" class="archive-filter-btn px-2.5 py-1 bg-[#FAF8F5] text-paper-main border border-paper hover:border-paper-red font-medium text-[11px] transition-colors">2020 (7)</button>
                  <button type="button" data-year="2021" class="archive-filter-btn px-2.5 py-1 bg-[#FAF8F5] text-paper-main border border-paper hover:border-paper-red font-medium text-[11px] transition-colors">2021 (10)</button>
                  <button type="button" data-year="2022" class="archive-filter-btn px-2.5 py-1 bg-[#FAF8F5] text-paper-main border border-paper hover:border-paper-red font-medium text-[11px] transition-colors">2022 (13)</button>
                  <button type="button" data-year="2023" class="archive-filter-btn px-2.5 py-1 bg-[#FAF8F5] text-paper-main border border-paper hover:border-paper-red font-medium text-[11px] transition-colors">2023 (13)</button>
                  <button type="button" data-year="2024" class="archive-filter-btn px-2.5 py-1 bg-[#FAF8F5] text-paper-main border border-paper hover:border-paper-red font-medium text-[11px] transition-colors">2024 (12)</button>
                  <button type="button" data-year="2025" class="archive-filter-btn px-2.5 py-1 bg-[#FAF8F5] text-paper-main border border-paper hover:border-paper-red font-medium text-[11px] transition-colors">2025 (9)</button>
                  <button type="button" data-year="2026" class="archive-filter-btn px-2.5 py-1 bg-[#FAF8F5] text-paper-main border border-paper hover:border-paper-red font-medium text-[11px] transition-colors">2026 (14)</button>
                </div>
              </div>

              <!-- Type and Epistemic Filter Selectors -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <!-- Type Filter -->
                <div class="space-y-1">
                  <label for="archive-type-select" class="text-[10px] uppercase font-bold text-paper-dim block">RECORD TYPE:</label>
                  <select id="archive-type-select" class="w-full px-3 py-2 bg-[#FAF8F5] border border-paper text-paper-main text-xs font-mono focus:outline-none focus:border-paper-red">
                    <option value="ALL">All Types (10 Categories)</option>
                    <option value="EVENT">Event</option>
                    <option value="PROMISE">Promise</option>
                    <option value="DECISION">Decision</option>
                    <option value="LAW">Law / Decree-Law</option>
                    <option value="INSTITUTIONAL_CHANGE">Institutional Change</option>
                    <option value="OFFICIAL_STATEMENT">Official Statement</option>
                    <option value="OPPOSITION_CLAIM">Opposition Claim</option>
                    <option value="OUTCOME">Outcome</option>
                    <option value="INDICATOR">Indicator</option>
                    <option value="DATA_GAP">Data Gap</option>
                  </select>
                </div>

                <!-- Epistemic Classification Filter -->
                <div class="space-y-1">
                  <label for="archive-class-select" class="text-[10px] uppercase font-bold text-paper-dim block">EPISTEMIC STANDARD:</label>
                  <select id="archive-class-select" class="w-full px-3 py-2 bg-[#FAF8F5] border border-paper text-paper-main text-xs font-mono focus:outline-none focus:border-paper-red">
                    <option value="ALL">All Standards</option>
                    <option value="FACT">FACT (Official Gazette / INS)</option>
                    <option value="CLAIM">CLAIM (Speech / Allegation)</option>
                    <option value="ANALYSIS">ANALYSIS (Investigative Context)</option>
                    <option value="DATA_GAP">DATA GAP (Unpublished Ledger)</option>
                  </select>
                </div>

                <!-- Sort Order -->
                <div class="space-y-1">
                  <label for="archive-sort-select" class="text-[10px] uppercase font-bold text-paper-dim block">CHRONOLOGICAL SORT:</label>
                  <select id="archive-sort-select" class="w-full px-3 py-2 bg-[#FAF8F5] border border-paper text-paper-main text-xs font-mono focus:outline-none focus:border-paper-red">
                    <option value="asc">Chronological (Oldest → Newest)</option>
                    <option value="desc">Reverse Chronological (Newest → Oldest)</option>
                  </select>
                </div>
              </div>

            </div>

            <!-- Active Match Status Bar -->
            <div class="flex items-center justify-between pt-3 border-t border-paper/60 text-xs font-mono">
              <div class="text-paper-muted">
                SHOWING <span id="archive-count" class="font-bold text-paper-red">${SEED_RECORDS.length}</span> OF <span class="font-bold text-paper-main">${SEED_RECORDS.length}</span> CANONICAL RECORDS
              </div>
              <button type="button" id="archive-reset-btn" class="hidden text-paper-red hover:underline font-bold text-[11px] uppercase">
                ✕ Reset All Filters
              </button>
            </div>

          </section>

          <!-- Featured Orientation Anchors (Max 3) -->
          ${renderArchiveFeaturedOrientationSection()}

          <!-- Records List Container (Documentary Evidence Index grouped by year) -->
          <div id="archive-records-list" class="space-y-6 pt-2">
            ${yearGroupsHtml}
          </div>

          <!-- Empty State (Hidden by default) -->
          <div id="archive-empty-state" class="hidden py-16 text-center bg-white border border-dashed border-paper p-8 space-y-3">
            <span class="text-2xl font-editorial text-paper-main block font-normal">No Matching Archive Records</span>
            <p class="text-xs sm:text-sm text-paper-muted font-light max-w-md mx-auto">
              No canonical Record of Power entries match your current search and filter combination. Try clearing your query or adjusting the filters.
            </p>
            <button type="button" onclick="document.getElementById('archive-reset-btn').click()" class="mt-2 px-4 py-2 bg-[#FAF8F5] border border-paper text-paper-red font-mono text-xs font-bold uppercase hover:bg-white transition-colors">
              Reset Filters
            </button>
          </div>

          <!-- Bottom Return Bridge to /presidency -->
          <section class="p-6 sm:p-8 bg-white border border-paper shadow-sm space-y-4 my-8">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span class="text-[10px] font-mono uppercase tracking-widest text-paper-red font-bold block">INVESTIGATIVE DOSSIER</span>
                <h3 class="font-editorial text-2xl text-paper-main mt-0.5">Read The Narrative Investigation</h3>
                <p class="text-xs text-paper-muted font-light mt-1">Explore the curated editorial investigation with signature 7-trace accountability chains and measured 2026 outcomes.</p>
              </div>
              <a href="/presidency" class="shrink-0 px-6 py-3 bg-[#141517] hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors text-center">
                <span>READ THE INVESTIGATION →</span>
              </a>
            </div>
          </section>

          <!-- Methodology Closing Block -->
          <section class="p-6 bg-[#FAF8F5] border border-paper space-y-4 text-xs font-sans">
            <div class="flex items-center justify-between border-b border-paper pb-2">
              <span class="text-[10px] font-mono uppercase tracking-widest text-paper-dim font-bold">RESEARCH METRIC STANDARDS</span>
              <div class="flex items-center gap-3 font-mono text-[11px]">
                <a href="/evidence" class="text-paper-red hover:underline font-bold">Sources Registry ↗</a>
                <span>·</span>
                <a href="/methodology" class="text-paper-main hover:underline font-bold">Methodology Standard ↗</a>
              </div>
            </div>
            <p class="text-paper-muted font-light leading-relaxed">
              The 404TN Presidential Archive is a strict forensic dataset. All assertions are anchored to primary public sources (Official Gazette JORT, INS bulletins, Central Bank reports, and Administrative Court rulings). Documented data gaps represent verified absences of legally mandated public data.
            </p>
          </section>

        </div>
      </div>

      <!-- CONNECTED THEMATIC DOSSIERS (EDITORIAL TRANSITION) -->
      <section class="bg-background text-bone-100 py-12 border-t border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div class="flex items-center justify-between">
            <span class="text-xs font-mono uppercase tracking-widest text-surface-400 block font-semibold">CONNECTED THEMATIC DOSSIERS</span>
            <a href="/the-files" class="text-xs font-mono text-sand hover:underline">View All 07 Files ↗</a>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/issues/water" class="p-4 bg-background-elevated hover:bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors group flex items-center justify-between text-xs font-mono">
              <span class="text-bone-100 group-hover:text-crimson font-medium">File 01: Water Deficit (21.4%)</span>
              <span class="text-surface-400 group-hover:text-bone-100">→</span>
            </a>
            <a href="/issues/electricity" class="p-4 bg-background-elevated hover:bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors group flex items-center justify-between text-xs font-mono">
              <span class="text-bone-100 group-hover:text-crimson font-medium">File 02: Electrical Stress (52%)</span>
              <span class="text-surface-400 group-hover:text-bone-100">→</span>
            </a>
            <a href="/gabes" class="p-4 bg-background-elevated hover:bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors group flex items-center justify-between text-xs font-mono">
              <span class="text-bone-100 group-hover:text-crimson font-medium">Gabès Flagship Investigation</span>
              <span class="text-surface-400 group-hover:text-bone-100">→</span>
            </a>
            <a href="/issues/rights" class="p-4 bg-background-elevated hover:bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors group flex items-center justify-between text-xs font-mono">
              <span class="text-bone-100 group-hover:text-crimson font-medium">File 07: Rights &amp; Freedoms</span>
              <span class="text-surface-400 group-hover:text-bone-100">→</span>
            </a>
          </div>
        </div>
      </section>

    </article>
  `;
}

/**
 * Controller initializing client-side search, filters, sorting and URL synchronization for /presidency/archive.
 */
export function initPresidencyArchiveController() {
  const searchInput = document.getElementById("archive-search-input");
  const yearButtons = Array.from(document.querySelectorAll("#archive-year-filters button"));
  const typeSelect = document.getElementById("archive-type-select");
  const classSelect = document.getElementById("archive-class-select");
  const sortSelect = document.getElementById("archive-sort-select");
  const countEl = document.getElementById("archive-count");
  const resetBtn = document.getElementById("archive-reset-btn");
  const emptyStateEl = document.getElementById("archive-empty-state");
  const recordsContainer = document.getElementById("archive-records-list");

  if (!recordsContainer) return;

  const yearGroups = Array.from(recordsContainer.querySelectorAll(".archive-year-group"));
  const allRows = Array.from(recordsContainer.querySelectorAll(".archive-record-row"));

  // State
  let activeYear = "ALL";
  let activeType = "ALL";
  let activeClass = "ALL";
  let activeQuery = "";
  let activeSort = "asc";

  // Read URL params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("year")) activeYear = urlParams.get("year");
  if (urlParams.has("type")) activeType = urlParams.get("type");
  if (urlParams.has("classification")) activeClass = urlParams.get("classification");
  if (urlParams.has("q")) activeQuery = urlParams.get("q");
  if (urlParams.has("sort")) activeSort = urlParams.get("sort");

  // Sync initial UI elements
  if (searchInput && activeQuery) searchInput.value = activeQuery;
  if (typeSelect && activeType !== "ALL") typeSelect.value = activeType;
  if (classSelect && activeClass !== "ALL") classSelect.value = activeClass;
  if (sortSelect && activeSort !== "asc") sortSelect.value = activeSort;

  yearButtons.forEach(btn => {
    const y = btn.getAttribute("data-year");
    if (y === activeYear) {
      btn.classList.add("bg-[#141517]", "text-white", "border-[#141517]", "font-bold");
      btn.classList.remove("bg-[#FAF8F5]", "text-paper-main", "border-paper", "font-medium");
    } else {
      btn.classList.remove("bg-[#141517]", "text-white", "border-[#141517]", "font-bold");
      btn.classList.add("bg-[#FAF8F5]", "text-paper-main", "border-paper", "font-medium");
    }
  });

  const updateUrlParams = () => {
    const params = new URLSearchParams();
    if (activeYear !== "ALL") params.set("year", activeYear);
    if (activeType !== "ALL") params.set("type", activeType);
    if (activeClass !== "ALL") params.set("classification", activeClass);
    if (activeQuery.trim()) params.set("q", activeQuery.trim());
    if (activeSort !== "asc") params.set("sort", activeSort);

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  };

  const applyFilters = () => {
    const q = activeQuery.toLowerCase().trim();
    let visibleCount = 0;

    yearGroups.forEach(group => {
      const groupYear = group.getAttribute("data-year");
      const groupMatchesYear = activeYear === "ALL" || groupYear === activeYear;

      let groupVisibleRows = 0;
      const rowsInGroup = Array.from(group.querySelectorAll(".archive-record-row"));

      rowsInGroup.forEach(row => {
        const rowType = row.getAttribute("data-type");
        const rowClass = row.getAttribute("data-classification");
        const rowSearch = row.getAttribute("data-search") || "";

        const matchesType = activeType === "ALL" || rowType === activeType;
        const matchesClass = activeClass === "ALL" || rowClass === activeClass;
        const matchesQuery = !q || rowSearch.includes(q);

        if (groupMatchesYear && matchesType && matchesClass && matchesQuery) {
          row.classList.remove("hidden");
          groupVisibleRows++;
          visibleCount++;
        } else {
          row.classList.add("hidden");
        }
      });

      if (groupMatchesYear && groupVisibleRows > 0) {
        group.classList.remove("hidden");
      } else {
        group.classList.add("hidden");
      }
    });

    if (countEl) countEl.textContent = String(visibleCount);

    if (emptyStateEl) {
      if (visibleCount === 0) {
        emptyStateEl.classList.remove("hidden");
      } else {
        emptyStateEl.classList.add("hidden");
      }
    }

    const isFiltered = activeYear !== "ALL" || activeType !== "ALL" || activeClass !== "ALL" || q.length > 0 || activeSort !== "asc";
    if (resetBtn) {
      if (isFiltered) {
        resetBtn.classList.remove("hidden");
      } else {
        resetBtn.classList.add("hidden");
      }
    }

    // Sort year groups in DOM
    if (activeSort === "desc") {
      yearGroups.slice().reverse().forEach(g => recordsContainer.appendChild(g));
    } else {
      yearGroups.forEach(g => recordsContainer.appendChild(g));
    }

    updateUrlParams();
  };

  // Event Listeners
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        activeQuery = e.target.value;
        applyFilters();
      }, 150);
    });
  }

  yearButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      yearButtons.forEach(b => {
        b.classList.remove("bg-[#141517]", "text-white", "border-[#141517]", "font-bold");
        b.classList.add("bg-[#FAF8F5]", "text-paper-main", "border-paper", "font-medium");
      });
      btn.classList.add("bg-[#141517]", "text-white", "border-[#141517]", "font-bold");
      btn.classList.remove("bg-[#FAF8F5]", "text-paper-main", "border-paper", "font-medium");
      activeYear = btn.getAttribute("data-year") || "ALL";
      applyFilters();
    });
  });

  if (typeSelect) {
    typeSelect.addEventListener("change", (e) => {
      activeType = e.target.value;
      applyFilters();
    });
  }

  if (classSelect) {
    classSelect.addEventListener("change", (e) => {
      activeClass = e.target.value;
      applyFilters();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      activeSort = e.target.value;
      applyFilters();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      activeYear = "ALL";
      activeType = "ALL";
      activeClass = "ALL";
      activeQuery = "";
      activeSort = "asc";

      if (searchInput) searchInput.value = "";
      if (typeSelect) typeSelect.value = "ALL";
      if (classSelect) classSelect.value = "ALL";
      if (sortSelect) sortSelect.value = "asc";

      yearButtons.forEach(b => {
        const y = b.getAttribute("data-year");
        if (y === "ALL") {
          b.classList.add("bg-[#141517]", "text-white", "border-[#141517]", "font-bold");
          b.classList.remove("bg-[#FAF8F5]", "text-paper-main", "border-paper", "font-medium");
        } else {
          b.classList.remove("bg-[#141517]", "text-white", "border-[#141517]", "font-bold");
          b.classList.add("bg-[#FAF8F5]", "text-paper-main", "border-paper", "font-medium");
        }
      });

      applyFilters();
    });
  }

  // Handle deep linking to record anchor
  if (window.location.hash) {
    const targetId = window.location.hash.substring(1);
    const targetCard = document.getElementById(targetId);
    if (targetCard) {
      // Find parent group and ensure visible
      const parentGroup = targetCard.closest(".archive-year-group");
      if (parentGroup) parentGroup.classList.remove("hidden");
      targetCard.classList.remove("hidden");
      if (targetCard.tagName.toLowerCase() === "details") {
        targetCard.open = true;
      } else {
        const details = targetCard.querySelector(".archive-record-details");
        if (details) details.open = true;
      }
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  applyFilters();
}
