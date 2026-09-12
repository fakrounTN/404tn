// src/presidency-data.js
// 404TN — The Record of Power: Editorial Narrative & Research Archive (Tunisia 2019–2026)
// Provides two distinct interfaces:
// 1. /presidency = Premium investigative reading narrative (~38 primary records + 7 traces + 2026 outcomes)
// 2. /presidency/archive = Complete canonical research archive (all 88 records, search, filters, deep anchors)

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
    title: "July 25 Rupture → Decree 117 → 2022 Constitution",
    subtitle: "Concentration of Plenary Executive & Decree Authority in the Presidency",
    chain: [
      { step: "EVENT", recordId: "ROP-EVT-2021-0725-001", role: "Article 80 Invocation & Cabinet Freeze" },
      { step: "DECISION", recordId: "ROP-DEC-2021-0922-001", role: "Presidential Decree 117 Promulgated" },
      { step: "LAW", recordId: "ROP-LAW-2022-CONST-001", role: "2022 Constitution Enacted" },
      { step: "INSTITUTION", recordId: "ROP-INS-2024-NRC-INAUG", role: "Bicameral Installation (NRC)" }
    ]
  },
  {
    id: "trace-judiciary-restructuring",
    number: "03",
    title: "Judiciary Restructuring & Magistrate Revocations",
    subtitle: "Dismantling of Independent Judicial Councils and Executive Oversight",
    chain: [
      { step: "DECISION", recordId: "ROP-INS-2022-CSM-001", role: "Elected High Judicial Council Dissolved" },
      { step: "DECISION", recordId: "ROP-DEC-2022-JUDGES-001", role: "57 Magistrates Revoked by Decree" },
      { step: "OUTCOME", recordId: "ROP-OUT-2022-JUDICIAL-INJ", role: "Administrative Court Injunctions Unexecuted" },
      { step: "OUTCOME", recordId: "ROP-OUT-2026-DL54-CONVICT", role: "Executive Oversight Maintained" }
    ]
  },
  {
    id: "trace-decree54-speech",
    number: "04",
    title: "Decree-Law 54 / Media & Public Speech",
    subtitle: "Application of Cybercrime Sanctions to Journalists, Lawyers, and Commentators",
    chain: [
      { step: "LAW", recordId: "ROP-LAW-2022-054-001", role: "Decree-Law 2022-54 Promulgated" },
      { step: "EVENT", recordId: "ROP-EVT-2023-SNJT-PROSEC", role: "Journalist & Lawyer Inquiries Initiated" },
      { step: "EVENT", recordId: "ROP-EVT-2024-MAY-CRACKDOWN", role: "Bar Association & Studio Arrests" },
      { step: "OUTCOME", recordId: "ROP-OUT-2026-DL54-CONVICT", role: ">80 Inquiries & Convictions Documented" }
    ]
  },
  {
    id: "trace-economic-sovereignty",
    number: "05",
    title: "Macroeconomic Sovereignty / IMF / BCT Lending",
    subtitle: "From External Diktat Rejections to Direct Central Bank Statutory Advances",
    chain: [
      { step: "PROMISE", recordId: "ROP-PRM-2019-SOV-001", role: "Self-Reliance & Sovereignty Pledge" },
      { step: "STATEMENT", recordId: "ROP-STM-2023-IMF-REFUSAL", role: "Rejection of IMF Reform Conditions" },
      { step: "LAW", recordId: "ROP-LAW-2024-BCT-LENDING", role: "Law 2024-10 (7B TND BCT Financing)" },
      { step: "OUTCOME", recordId: "ROP-OUT-2024-SOV-DEBT-REPAY", role: "€850M Eurobond Repaid On Schedule" },
      { step: "INDICATOR", recordId: "ROP-IND-2026-PUBLIC-DEBT", role: "80.2% Public Debt Burden" }
    ]
  },
  {
    id: "trace-gabes-relocation",
    number: "06",
    title: "Gabès Relocation / Environmental Transparency",
    subtitle: "Tracking Nine Years of Unexecuted Dismantling Pledges and Missing Ambient Air Data",
    chain: [
      { step: "DECISION", recordId: "ROP-DEC-2020-KAMOUR-001", role: "2017 Cabinet Commitment Maintained" },
      { step: "OUTCOME", recordId: "ROP-OUT-2026-GABES-RELOC-FAIL", role: "Zero Chemical Units Relocated" },
      { step: "DATA GAP", recordId: "ROP-GAP-2026-GABES-AIR-001", role: "No Continuous Public Ambient Air Data" }
    ]
  },
  {
    id: "trace-2024-presidential-election",
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
 * Curated Era Configuration for /presidency: Featured primary reading path vs secondary disclosure in archive.
 */
export const CURATED_ERA_CONFIG = {
  2019: {
    title: "The Mandate & Founding Pledges",
    subtitle: "Electoral victory, inaugural promises on corruption and stolen assets, economic sovereignty framework, and baseline macroeconomic indicators.",
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
  }
};

/**
 * Resolves full source metadata from SOURCE_MAP.
 */
function resolveSource(sourceId) {
  if (!sourceId) return null;
  return SOURCE_MAP.get(sourceId) || null;
}

/**
 * Resolves full institution metadata.
 */
function resolveInstitutionName(instId) {
  if (!instId) return null;
  const inst = INSTITUTIONS_REGISTRY[instId];
  return inst ? inst.name_en : instId;
}

/**
 * Renders an epistemic classification badge on paper surface.
 */
function renderClassificationBadge(classification) {
  switch (classification) {
    case EPISTEMIC_CLASSIFICATION.FACT:
      return `<span class="stamp-badge stamp-paper-fact">FACT</span>`;
    case EPISTEMIC_CLASSIFICATION.CLAIM:
      return `<span class="stamp-badge stamp-paper-claim">CLAIM · ATTRIBUTED</span>`;
    case EPISTEMIC_CLASSIFICATION.ANALYSIS:
      return `<span class="stamp-badge stamp-paper-analysis">ANALYSIS</span>`;
    case EPISTEMIC_CLASSIFICATION.DATA_GAP:
      return `<span class="stamp-badge stamp-paper-gap">DATA GAP</span>`;
    default:
      return `<span class="stamp-badge stamp-paper-fact">${escapeHtml(classification || 'FACT')}</span>`;
  }
}

/**
 * Renders record type badge with restrained editorial style.
 */
function renderRecordTypeBadge(type) {
  const label = (type || 'EVENT').replace(/_/g, ' ');
  return `
    <span class="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 bg-[#F2EFE9] border border-paper text-paper-main font-semibold">
      ${escapeHtml(label)}
    </span>
  `;
}

/**
 * Renders promise or legal status badge.
 */
function renderStatusBadge(status) {
  if (!status) return '';
  const label = status.replace(/_/g, ' ');
  let colorClasses = "bg-[#F2EFE9] text-paper-muted border-paper";

  if (status === "BROKEN" || status === "UNEXECUTED" || status === "CONVICTED" || status === "NOT_PUBLISHED") {
    colorClasses = "bg-red-50 text-paper-red border-red-200 font-bold";
  } else if (status === "FULFILLED" || status === "ENACTED" || status === "OPERATIONAL") {
    colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold";
  } else if (status === "PARTIALLY_FULFILLED" || status === "IN_PROGRESS" || status === "CONTESTED" || status === "PARTIAL") {
    colorClasses = "bg-amber-50 text-amber-900 border-amber-200 font-semibold";
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
 * Renders an editorial Chronology Item card for /presidency narrative.
 */
function renderChronologyItem(rec) {
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
    <article class="chronology-record-item py-4 space-y-2.5 border-b border-paper last:border-b-0" id="${escapeHtml(rec.id)}" data-record-type="${escapeHtml(rec.record_type)}" data-record-classification="${escapeHtml(rec.classification)}">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div class="flex items-center gap-2 flex-wrap">
          <time class="text-xs font-mono font-bold text-paper-red">${escapeHtml(dateStr)}</time>
          ${typeBadge}
          ${classBadge}
          ${statusBadge}
        </div>
        <div class="text-[10px] font-mono text-paper-dim">
          ID: <span class="text-paper-muted font-mono">${escapeHtml(rec.id)}</span>
        </div>
      </div>

      <h3 class="font-editorial font-bold text-paper-main text-lg sm:text-xl leading-snug">
        ${escapeHtml(rec.title)}
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
    const stepBadge = `
      <span class="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 ${
        stepItem.step === 'PROMISE' ? 'bg-[#141517] text-white' :
        stepItem.step === 'LAW' ? 'bg-[#B91C1C] text-white' :
        stepItem.step === 'OUTCOME' ? 'bg-emerald-800 text-white' :
        stepItem.step === 'DATA GAP' ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' :
        'bg-[#F2EFE9] text-paper-main border border-paper'
      }">
        ${escapeHtml(stepItem.step)}
      </span>
    `;
    const dateStr = rec.date_start ? rec.date_start.substring(0, 4) : '';
    const sourcesCount = rec.source_ids ? rec.source_ids.length : 0;

    return `
      <div class="relative pl-6 pb-6 last:pb-0 group">
        <!-- Connective Timeline Rail -->
        ${!isLast ? `<div class="absolute left-[11px] top-6 bottom-0 w-px bg-paper-red/30"></div>` : ''}
        <div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#FAF8F5] border-2 border-paper-red flex items-center justify-center text-[10px] font-mono font-bold text-paper-red">
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
 * Renders an entire year section with 3–5 featured primary records and contextual link to archive.
 */
function renderYearChronologySection(year, config, customModules = '') {
  const featuredRecords = config.featuredIds.map(id => getRecordById(id)).filter(Boolean);

  const featuredItemsHtml = featuredRecords.map(r => `
    <div class="chronology-node">
      <span class="chronology-node-dot-paper"></span>
      ${renderChronologyItem(r)}
    </div>
  `).join('');

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
          ${config.featuredIds.length} FEATURED · ${config.allIds.length} TOTAL IN ARCHIVE
        </div>
      </div>

      ${customModules ? `<div class="space-y-4">${customModules}</div>` : ''}

      <div class="chronology-spine-paper space-y-4 pt-2">
        ${featuredItemsHtml}
      </div>

      <div class="mt-4 pt-3 border-t border-paper/60 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
        <span class="text-paper-dim uppercase text-[10px]">${config.allIds.length} DOCUMENTED RECORDS IN ${year} ERA</span>
        <a href="/presidency/archive?year=${year}" class="text-paper-red hover:underline font-bold flex items-center gap-1 group">
          <span>VIEW FULL ${year} ARCHIVE (${config.allIds.length} RECORDS)</span>
          <span class="group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </div>
    </section>
  `;
}

/**
 * Renders the "WHAT THE STATE SAID" vs "WHAT THE RECORD SHOWS" comparison module for July 25 rupture on paper.
 */
function renderStateComparisonModule() {
  const stm = getRecordById("ROP-STM-2021-0725-001");
  const dec = getRecordById("ROP-DEC-2021-0922-001");
  if (!stm || !dec) return '';

  return `
    <div class="p-5 sm:p-6 bg-white border border-paper shadow-sm space-y-4 my-4">
      <div class="pb-3 border-b border-paper">
        <span class="text-[10px] font-mono uppercase tracking-meta text-paper-red font-bold block">COMPETING INTERPRETATIONS · JULY 25 RUPTURE</span>
        <h3 class="font-editorial text-2xl text-paper-main mt-1">What Was Claimed vs What The Law Enacted</h3>
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
 * Renders Certified Result vs Contested Claim for the 2024 Election on paper.
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
            Status: <span class="text-paper-sand font-bold uppercase">${escapeHtml(opp2024.status)}</span> · Tribunal Administratif Decisions
          </div>
          ${renderSourceSlip(opp2024.source_ids)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the Editorial Archive Transition Block (Replaces giant 88-row directory on /presidency).
 */
function renderExploreCompleteRecordSection() {
  return `
    <section id="the-complete-record" class="p-6 sm:p-8 bg-white border border-paper shadow-sm space-y-6 my-8" aria-label="The Complete Record Transition">
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-paper">
        <div class="space-y-1">
          <span class="text-xs font-mono uppercase tracking-widest text-paper-red font-bold block">RESEARCH REPOSITORY · 88 CANONICAL RECORDS</span>
          <h3 class="font-editorial text-2xl sm:text-3xl text-paper-main font-normal">The Complete Record of Power (2019–2026)</h3>
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
          <span>EXPLORE THE PRESIDENTIAL ARCHIVE</span>
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
          <span class="text-[9px] text-paper-muted font-sans mt-0.5 block">2019 through 2026</span>
        </div>
        <div class="p-3 bg-[#FAF8F5] border border-paper">
          <span class="text-[9px] text-paper-dim uppercase tracking-wider block">STATE INSTITUTIONS</span>
          <span class="font-editorial text-2xl sm:text-3xl font-bold text-paper-main mt-1 block">${Object.keys(INSTITUTIONS_REGISTRY).length}</span>
          <span class="text-[9px] text-paper-muted font-sans mt-0.5 block">Jurisdiction Mapped</span>
        </div>
        <div class="p-3 bg-[#FAF8F5] border border-paper">
          <span class="text-[9px] text-paper-dim uppercase tracking-wider block">PRIMARY SOURCES</span>
          <span class="font-editorial text-2xl sm:text-3xl font-bold text-paper-sand mt-1 block">${SOURCE_MANIFEST.length}</span>
          <span class="text-[9px] text-paper-muted font-sans mt-0.5 block">JORT, INS, BCT, Courts</span>
        </div>
        <div class="p-3 bg-[#FAF8F5] border border-paper">
          <span class="text-[9px] text-paper-dim uppercase tracking-wider block">ACCOUNTABILITY EDGES</span>
          <span class="font-editorial text-2xl sm:text-3xl font-bold text-paper-main mt-1 block">${RELATIONSHIPS.length}</span>
          <span class="text-[9px] text-paper-muted font-sans mt-0.5 block">Directional Traces</span>
        </div>
      </div>
    </section>
  `;

  // 03. 6-Question Accountability Grammar Block (Adapted for Paper)
  const accountabilityGrammarHtml = `
    <section class="p-6 sm:p-8 bg-white border border-paper shadow-sm space-y-6" aria-label="Accountability Grammar">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-paper">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-paper-red font-bold block">404TN ACCOUNTABILITY GRAMMAR</span>
          <h3 class="font-editorial text-2xl text-paper-main mt-1">The Record of Power: Centralized Governance Audit (2019–2026)</h3>
        </div>
        <div class="text-xs font-mono text-paper-muted">
          RESPONSIBLE: <span class="text-paper-main font-bold">Presidency of the Republic of Tunisia (Carthage Palace)</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1">
          <span class="text-[10px] font-mono text-paper-sand uppercase tracking-wider block font-bold">1. WHAT WAS PROMISED?</span>
          <p class="text-paper-muted font-light leading-relaxed">A moral, self-reliant republic with eliminated corruption, decentralized grassroots councils, working public utilities, and rejection of external financial dictates.</p>
        </div>

        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1">
          <span class="text-[10px] font-mono text-paper-sand uppercase tracking-wider block font-bold">2. WHAT ACTION WAS ANNOUNCED?</span>
          <p class="text-paper-muted font-light leading-relaxed">Concentrated executive and decree power via Decree 117 and 2022 Constitution; dissolved elected CSM; enacted Decree-Law 54; froze IMF EFF arrangement.</p>
        </div>

        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1">
          <span class="text-[10px] font-mono text-paper-sand uppercase tracking-wider block font-bold">3. WHAT HAPPENED?</span>
          <p class="text-paper-muted font-light leading-relaxed">Institutional counter-powers were dismantled; sovereign debt reached 80.2% of GDP; graduate unemployment stood at 26.6% (male 14.2%, female 35.6%); potable water rationing became operational in Summer 2026.</p>
        </div>

        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1">
          <span class="text-[10px] font-mono text-paper-main uppercase tracking-wider block font-bold">4. WHO WAS RESPONSIBLE?</span>
          <p class="text-paper-muted font-light leading-relaxed">Presidency of the Republic of Tunisia (Carthage Palace)</p>
        </div>

        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1">
          <span class="text-[10px] font-mono text-emerald-800 uppercase tracking-wider block font-bold">5. WHAT EVIDENCE SHOWS</span>
          <p class="text-paper-main font-medium leading-relaxed">Under the 2022 Constitution, all executive authority and ministerial appointments are formally centralized in the presidency, establishing unambiguous institutional responsibility.</p>
        </div>

        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1">
          <span class="text-[10px] font-mono text-paper-red uppercase tracking-wider block font-bold">6. WHAT REMAINS UNKNOWN?</span>
          <p class="text-paper-muted font-light leading-relaxed">Itemized individual penal reconciliation settlement agreements (subject to statutory confidentiality under Decree-Law 2022-13 Article 25) and real-time industrial ambient emissions in Gabès.</p>
        </div>
      </div>
    </section>
  `;

  // Specific data gaps for 2026
  const gabesGap = getRecordById("ROP-GAP-2026-GABES-AIR-001");
  const reconGap = getRecordById("ROP-GAP-2026-RECON-RECEIPTS-001");
  const energyGap = getRecordById("ROP-GAP-2026-ENERGY-SUBSIDY");
  const civilGap = getRecordById("ROP-GAP-2026-CIVIL-SERVICE-CENSUS");

  return `
    <article class="presidency-dossier-page">

      <!-- 01. INVESTIGATION OPENER (DARK INVESTIGATIVE CANVAS) -->
      <div class="bg-background text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          ${headerHtml}
        </div>
      </div>

      <!-- 02–08. DOCUMENTARY REPORT VIEW (REAL WARM PAPER SURFACE) -->
      <div class="surface-paper py-10 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

          <!-- 02. THE RECORD IN NUMBERS -->
          ${recordInNumbersHtml}

          <!-- 03. SIGNATURE FEATURE: 7 ACCOUNTABILITY CHAINS -->
          ${renderAccountabilityChainsSection()}

          <!-- 04. 2019→2026 PRESIDENTIAL SPINE -->
          ${renderPresidentialSpine()}

          <!-- 05. CURATED ERA-BY-ERA DOCUMENTARY RECORD -->

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
              ${renderChronologyItem(getRecordById("ROP-IND-UNEMP-GRAD-001"))}
              ${renderChronologyItem(getRecordById("ROP-IND-GDP-GROWTH-001"))}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              ${renderChronologyItem(getRecordById("ROP-IND-2026-PUBLIC-DEBT"))}
              ${renderChronologyItem(getRecordById("ROP-IND-2026-INFLATION-FOOD"))}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              ${renderChronologyItem(getRecordById("ROP-IND-2026-ENERGY-DEFICIT"))}
              ${renderChronologyItem(getRecordById("ROP-IND-2026-FX-DAYS"))}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              ${renderChronologyItem(getRecordById("ROP-OUT-2026-RECON-001"))}
              ${renderChronologyItem(getRecordById("ROP-OUT-2026-WATER-001"))}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
              ${renderChronologyItem(getRecordById("ROP-OUT-2026-GABES-RELOC-FAIL"))}
              ${renderChronologyItem(getRecordById("ROP-OUT-2026-DL54-CONVICT"))}
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
                        <div class="font-sans font-bold text-paper-main text-sm sm:text-base">${escapeHtml(trust.metadata.primarySource)} · 2018–2024 Trends</div>
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
 * Renders an expandable documentary record card for /presidency/archive.
 */
function renderArchiveRecordCard(rec) {
  if (!rec) return '';

  const year = rec.date_start ? rec.date_start.substring(0, 4) : '2019';
  const typeBadge = renderRecordTypeBadge(rec.record_type);
  const classBadge = renderClassificationBadge(rec.classification);
  const statusBadge = renderStatusBadge(rec.status || rec.data_gap_status);
  const sourceCount = rec.source_ids ? rec.source_ids.length : 0;
  const instNames = (rec.institution_ids || []).map(id => resolveInstitutionName(id)).filter(Boolean).join(', ');

  // Search indexing string
  const searchCorpus = [
    rec.id,
    rec.title,
    rec.short_title,
    rec.summary,
    rec.record_type,
    rec.classification,
    year,
    instNames,
    ...(rec.issue_tags || []),
    rec.official_title || '',
    rec.jort_reference || '',
    rec.value || rec.measurement || rec.result || ''
  ].join(' ').toLowerCase();

  const respHtml = renderResponsibilityList(rec.id);
  const sourceHtml = renderSourceSlip(rec.source_ids);

  return `
    <article class="archive-record-card p-5 bg-white border border-paper hover:border-paper-red/50 transition-colors space-y-3 relative group" id="${escapeHtml(rec.id)}" data-record-id="${escapeHtml(rec.id)}" data-year="${escapeHtml(year)}" data-type="${escapeHtml(rec.record_type)}" data-classification="${escapeHtml(rec.classification)}" data-search="${escapeHtml(searchCorpus)}">
      <!-- Card Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-paper/60">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-mono font-bold text-paper-red">${escapeHtml(year)}</span>
          ${typeBadge}
          ${classBadge}
          ${statusBadge}
        </div>
        <div class="flex items-center gap-2 text-[10px] font-mono text-paper-dim">
          <span>ID: <a href="#${escapeHtml(rec.id)}" class="text-paper-muted hover:text-paper-red font-mono">${escapeHtml(rec.id)}</a></span>
          <span>·</span>
          <span>${sourceCount} ${sourceCount === 1 ? 'src' : 'srcs'}</span>
        </div>
      </div>

      <!-- Title & Headline -->
      <h3 class="font-editorial font-bold text-paper-main text-lg sm:text-xl leading-snug">
        <a href="#${escapeHtml(rec.id)}" class="hover:text-paper-red transition-colors">
          ${escapeHtml(rec.title)}
        </a>
      </h3>

      <!-- Narrative Summary -->
      <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed">
        ${escapeHtml(rec.summary)}
      </p>

      <!-- Key Metadata Tags -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-paper-dim pt-1">
        ${instNames ? `<div><span class="text-[9px] uppercase font-bold text-paper-sand">INSTITUTION:</span> <span class="text-paper-main">${escapeHtml(instNames)}</span></div>` : ''}
        ${rec.issue_tags && rec.issue_tags.length > 0 ? `<div><span class="text-[9px] uppercase font-bold text-paper-sand">TAGS:</span> <span class="text-paper-muted">${escapeHtml(rec.issue_tags.slice(0, 3).join(', '))}</span></div>` : ''}
      </div>

      <!-- Measured Metric Highlight if present -->
      ${rec.value || rec.measurement || rec.result ? `
        <div class="p-2.5 bg-[#FAF8F5] border border-paper flex items-center justify-between text-xs font-mono">
          <span class="text-[9px] uppercase tracking-wider text-paper-sand font-bold">MEASURED RECORD:</span>
          <span class="font-bold text-paper-red">${escapeHtml(rec.value || rec.measurement || rec.result)} ${rec.unit ? `<span class="text-paper-muted font-normal">(${escapeHtml(rec.unit)})</span>` : ''}</span>
        </div>
      ` : ''}

      <!-- Expandable Forensic Evidence Slip -->
      <details class="archive-record-details pt-2 border-t border-paper/60 text-xs font-sans group/details">
        <summary class="cursor-pointer select-none text-[11px] font-mono font-semibold text-paper-red hover:underline flex items-center gap-1 list-none">
          <span class="group-open/details:hidden">▶ VIEW FULL EVIDENCE &amp; PROVENANCE</span>
          <span class="hidden group-open/details:inline">▼ COLLAPSE EVIDENCE SLIP</span>
        </summary>

        <div class="mt-3 p-4 bg-[#FAF8F5] border border-paper space-y-3">
          ${rec.official_title ? `
            <div>
              <span class="text-[9px] font-mono uppercase text-paper-dim font-bold block">OFFICIAL STATUTORY TITLE</span>
              <p class="text-xs font-mono text-paper-main mt-0.5">${escapeHtml(rec.official_title)}</p>
            </div>
          ` : ''}

          ${rec.stated_purpose || rec.stated_commitment || rec.stated_outcome_target ? `
            <div>
              <span class="text-[9px] font-mono uppercase text-paper-dim font-bold block">STATED PURPOSE / PLEDGE</span>
              <p class="text-xs text-paper-muted italic mt-0.5">${escapeHtml(rec.stated_purpose || rec.stated_commitment || rec.stated_outcome_target)}</p>
            </div>
          ` : ''}

          ${rec.documented_effect ? `
            <div>
              <span class="text-[9px] font-mono uppercase text-paper-sand font-bold block">DOCUMENTED EFFECT</span>
              <p class="text-xs text-paper-main mt-0.5">${escapeHtml(rec.documented_effect)}</p>
            </div>
          ` : ''}

          ${rec.jort_reference || rec.relevant_articles ? `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-paper-muted pt-1 border-t border-paper/60">
              ${rec.jort_reference ? `<div>GAZETTE: <strong class="text-paper-main">${escapeHtml(rec.jort_reference)}</strong></div>` : ''}
              ${rec.relevant_articles ? `<div>ARTICLES: <span class="text-paper-main">${escapeHtml(rec.relevant_articles.join(', '))}</span></div>` : ''}
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
    </article>
  `;
}

/**
 * Renders the complete, searchable, filterable research archive view for /presidency/archive.
 */
export function renderPresidencyArchiveViewHtml() {
  const allCardsHtml = SEED_RECORDS.map(rec => renderArchiveRecordCard(rec)).join('');

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
                  <label for="archive-sort-select" class="text-[10px] uppercase font-bold text-paper-dim block">SORT ORDER:</label>
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

          <!-- Records List Container (Cards Grid) -->
          <div id="archive-records-list" class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            ${allCardsHtml}
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
 * Client-Side Interactive Controller for /presidency/archive
 */
export function initPresidencyArchiveController() {
  const searchInput = document.getElementById("archive-search-input");
  const yearButtons = document.querySelectorAll(".archive-filter-btn");
  const typeSelect = document.getElementById("archive-type-select");
  const classSelect = document.getElementById("archive-class-select");
  const sortSelect = document.getElementById("archive-sort-select");
  const countEl = document.getElementById("archive-count");
  const resetBtn = document.getElementById("archive-reset-btn");
  const emptyStateEl = document.getElementById("archive-empty-state");
  const recordsContainer = document.getElementById("archive-records-list");

  if (!recordsContainer) return;

  const cards = Array.from(recordsContainer.querySelectorAll(".archive-record-card"));

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

    cards.forEach(card => {
      const cardYear = card.getAttribute("data-year");
      const cardType = card.getAttribute("data-type");
      const cardClass = card.getAttribute("data-classification");
      const cardSearch = card.getAttribute("data-search") || "";

      let matchesYear = activeYear === "ALL" || cardYear === activeYear;
      let matchesType = activeType === "ALL" || cardType === activeType;
      let matchesClass = activeClass === "ALL" || cardClass === activeClass;
      let matchesQuery = !q || cardSearch.includes(q);

      if (matchesYear && matchesType && matchesClass && matchesQuery) {
        card.classList.remove("hidden");
        visibleCount++;
      } else {
        card.classList.add("hidden");
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

    // Sort cards in DOM
    if (activeSort === "desc") {
      cards.slice().reverse().forEach(card => recordsContainer.appendChild(card));
    } else {
      cards.forEach(card => recordsContainer.appendChild(card));
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
      targetCard.classList.remove("hidden");
      const details = targetCard.querySelector(".archive-record-details");
      if (details) details.open = true;
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  applyFilters();
}
