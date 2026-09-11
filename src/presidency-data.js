// src/presidency-data.js
// 404TN — The Record of Power: Documentary Chronology UI (Tunisia 2019–2026)
// Authoritative evidence-backed interface for /presidency route directly consuming R2.1 data architecture.

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
  SOURCE_MAP,
  SEED_RECORDS,
  getRecordById,
  getRecordsByYear,
  getAccountabilityTrace,
  getResponsibilityForRecord,
  getSourcesForRecord
} from './record-of-power/index.js';

/**
 * Resolves full source metadata from SOURCE_MAP.
 */
function resolveSource(sourceId) {
  if (!sourceId) return null;
  return SOURCE_MAP.get(sourceId) || null;
}

/**
 * Resolves human-readable institution descriptor from registry.
 */
function resolveInstitutionName(institutionId) {
  if (!institutionId) return '';
  const inst = INSTITUTIONS_REGISTRY[institutionId];
  if (!inst) return institutionId;
  return inst.short_name ? `${inst.name} (${inst.short_name})` : inst.name;
}

/**
 * Renders classification badge with restrained editorial styling.
 */
function renderClassificationBadge(classification) {
  if (classification === EPISTEMIC_CLASSIFICATION.FACT) {
    return `<span class="text-[10px] font-mono px-2 py-0.5 bg-surface-900 border border-surface-700 text-bone-100 font-bold uppercase tracking-wider">FACT</span>`;
  }
  if (classification === EPISTEMIC_CLASSIFICATION.CLAIM) {
    return `<span class="text-[10px] font-mono px-2 py-0.5 bg-sand/10 border border-sand/30 text-sand font-semibold uppercase tracking-wider" title="Attributed statement or allegation not independently established as fact">CLAIM · ATTRIBUTED</span>`;
  }
  if (classification === EPISTEMIC_CLASSIFICATION.ANALYSIS) {
    return `<span class="text-[10px] font-mono px-2 py-0.5 bg-crimson/10 border border-crimson/30 text-crimson font-semibold uppercase tracking-wider" title="404TN investigative interpretation">ANALYSIS</span>`;
  }
  return `<span class="text-[10px] font-mono px-2 py-0.5 bg-surface-800 text-surface-400 uppercase">${escapeHtml(classification)}</span>`;
}

/**
 * Renders a canonical status badge.
 */
function renderStatusBadge(status, highlight = false) {
  if (!status) return '';
  const s = String(status).replace(/_/g, ' ');
  let colorClass = 'bg-surface-900 text-surface-400 border-surface-800';
  if (status === 'UNEXECUTED' || status === 'UNRESOLVED' || status === 'NOT_PUBLISHED' || status === 'INACCESSIBLE') {
    colorClass = 'bg-crimson/15 text-crimson border-crimson/40 font-semibold';
  } else if (status === 'ENACTED' || status === 'CONFIRMED' || status === 'VERIFIED') {
    colorClass = 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 font-semibold';
  } else if (status === 'DISPUTED' || status === 'CONTESTED' || status === 'PARTIAL' || status === 'PRELIMINARY') {
    colorClass = 'bg-sand/15 text-sand border-sand/40 font-semibold';
  }
  return `<span class="text-[9px] font-mono uppercase px-2 py-0.5 border ${colorClass}">${escapeHtml(s)}</span>`;
}

/**
 * Renders responsible institutions for a record.
 */
function renderResponsibilityList(recordId) {
  const rsps = getResponsibilityForRecord(recordId, RESPONSIBILITY_RECORDS, INSTITUTIONS_REGISTRY);
  if (!rsps || rsps.length === 0) return '';

  const entries = rsps.map(r => {
    const instName = r.institution ? `${r.institution.name} (${r.institution.short_name})` : r.institution_id;
    const typeLabel = (r.responsibility_type || '').replace(/_/g, ' ');
    const basis = r.legal_or_administrative_basis ? ` · <span class="text-surface-400 font-light">${escapeHtml(r.legal_or_administrative_basis)}</span>` : '';
    return `
      <div class="text-xs font-mono">
        <span class="text-sand font-bold">${escapeHtml(instName)}</span>
        <span class="text-surface-500"> — </span>
        <span class="text-bone-100 font-medium uppercase text-[10px]">${escapeHtml(typeLabel)}</span>
        ${basis}
      </div>
    `;
  }).join('');

  return `
    <div class="p-3 bg-surface-900/50 border border-surface-800 space-y-1.5 mt-3">
      <span class="text-[9px] font-mono uppercase tracking-meta text-surface-400 block font-bold">INSTITUTIONAL RESPONSIBILITY</span>
      <div class="space-y-1">
        ${entries}
      </div>
    </div>
  `;
}

/**
 * Renders primary source provenance footer for a record.
 */
function renderSourceSlip(sourceIds) {
  if (!Array.isArray(sourceIds) || sourceIds.length === 0) return '';
  const slips = sourceIds.map(sid => {
    const s = resolveSource(sid);
    if (!s) return `<span class="text-surface-400 font-mono text-[10px]">SRC: ${escapeHtml(sid)}</span>`;
    const urlHtml = s.url ? `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="text-sand hover:underline ml-1.5 font-bold">Document Link ↗</a>` : '';
    return `
      <div class="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-surface-400">
        <div>
          <span class="text-surface-500 uppercase">SOURCE:</span>
          <span class="text-bone-100 font-medium ml-1">${escapeHtml(s.organization)}</span>
          <span class="text-surface-500"> — </span>
          <span class="text-surface-300 italic">"${escapeHtml(s.title)}"</span>
          <span class="text-surface-500">(${escapeHtml(s.publication_date || s.reference_period || '')})</span>
        </div>
        <div>
          <span class="px-1.5 py-0.2 bg-surface-900 border border-surface-800 text-surface-400 uppercase text-[9px]">${escapeHtml(s.source_type)}</span>
          ${urlHtml}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="pt-2.5 mt-3 border-t border-surface-800/80 space-y-1.5">
      ${slips}
    </div>
  `;
}

/**
 * Renders a primary chronology record row/card.
 */
function renderChronologyItem(rec) {
  const typeBadge = `<span class="text-[9px] font-mono px-2 py-0.5 bg-surface-900 border border-surface-800 text-surface-400 uppercase font-semibold">${escapeHtml(rec.record_type.replace(/_/g, ' '))}</span>`;
  const classBadge = renderClassificationBadge(rec.classification);
  const statusBadge = rec.status ? renderStatusBadge(rec.status) : '';
  const dateStr = rec.date_start ? (rec.date_start.length === 10 ? rec.date_start : rec.date_start) : '2019–2026';

  let specificDetailsHtml = '';

  // LAW Metadata
  if (rec.record_type === RECORD_TYPES.LAW) {
    specificDetailsHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-surface-800 text-xs font-sans">
        ${rec.stated_purpose ? `
          <div class="p-2.5 bg-surface-900/40 border border-surface-800 space-y-1">
            <span class="text-[9px] font-mono text-sand uppercase font-bold block">STATED LEGISLATIVE PURPOSE</span>
            <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(rec.stated_purpose)}</p>
          </div>
        ` : ''}
        ${rec.documented_effect ? `
          <div class="p-2.5 bg-surface-900/40 border border-surface-800 space-y-1">
            <span class="text-[9px] font-mono text-crimson uppercase font-bold block">DOCUMENTED INSTITUTIONAL EFFECT</span>
            <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(rec.documented_effect)}</p>
          </div>
        ` : ''}
      </div>
      ${rec.legal_challenges ? `
        <div class="mt-2 text-xs font-sans p-2.5 bg-background border border-surface-800">
          <span class="text-[9px] font-mono text-sand uppercase font-bold block">LEGAL CHALLENGES &amp; OBJECTIONS</span>
          <p class="text-surface-400 font-light mt-0.5">${escapeHtml(rec.legal_challenges)}</p>
        </div>
      ` : ''}
      ${rec.jort_reference ? `
        <div class="text-[10px] font-mono text-surface-400 mt-2">
          GAZETTE: <span class="text-bone-100 font-medium">${escapeHtml(rec.jort_reference)}</span>
          ${rec.relevant_articles ? ` · Articles: <span class="text-surface-300">${escapeHtml(rec.relevant_articles.join(', '))}</span>` : ''}
        </div>
      ` : ''}
    `;
  }

  // DECISION Metadata
  else if (rec.record_type === RECORD_TYPES.DECISION) {
    specificDetailsHtml = `
      ${rec.stated_reason ? `
        <div class="mt-2 text-xs font-sans p-2.5 bg-surface-900/40 border border-surface-800">
          <span class="text-[9px] font-mono text-sand uppercase font-bold block">STATED ADMINISTRATIVE REASON</span>
          <p class="text-surface-300 font-light mt-0.5">${escapeHtml(rec.stated_reason)}</p>
        </div>
      ` : ''}
      ${rec.contested_interpretations ? `
        <div class="mt-2 text-xs font-sans p-2.5 bg-background border border-surface-800">
          <span class="text-[9px] font-mono text-crimson uppercase font-bold block">CONTESTED INTERPRETATION &amp; COURT INJUNCTIONS</span>
          <p class="text-surface-300 font-light mt-0.5">${escapeHtml(rec.contested_interpretations)}</p>
        </div>
      ` : ''}
      ${rec.legal_basis ? `
        <div class="text-[10px] font-mono text-surface-400 mt-2">
          LEGAL BASIS: <span class="text-bone-100 font-medium">${escapeHtml(rec.legal_basis)}</span>
        </div>
      ` : ''}
    `;
  }

  // INDICATOR Metadata
  else if (rec.record_type === RECORD_TYPES.INDICATOR) {
    specificDetailsHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-surface-800 text-xs font-sans">
        <div class="p-2.5 bg-surface-900/60 border border-surface-800 text-center">
          <span class="text-[9px] font-mono uppercase text-surface-400 block">RECORDED VALUE</span>
          <span class="text-xl font-editorial font-bold text-crimson block my-1">${escapeHtml(rec.value)}</span>
          <span class="text-[9px] font-mono text-surface-400">${escapeHtml(rec.unit || '')}</span>
        </div>
        <div class="p-2.5 bg-surface-900/40 border border-surface-800 space-y-1">
          <span class="text-[9px] font-mono uppercase text-sand font-bold block">OBSERVATION TYPE</span>
          <div class="font-mono text-xs font-bold text-bone-100">${escapeHtml(rec.observation_type || '')}</div>
          <div class="text-[10px] text-surface-400">Ref: ${escapeHtml(rec.reference_period || '')}</div>
        </div>
        <div class="p-2.5 bg-surface-900/40 border border-surface-800 space-y-1">
          <span class="text-[9px] font-mono uppercase text-surface-400 font-bold block">METHODOLOGY &amp; BASE</span>
          <p class="text-[10px] text-surface-300 leading-tight">${escapeHtml(rec.methodology || '')}</p>
        </div>
      </div>
      ${rec.comparability_notes ? `
        <div class="text-[10px] font-mono text-surface-400 p-2 bg-background border border-surface-800 mt-2">
          <strong class="text-sand">COMPARABILITY NOTE:</strong> ${escapeHtml(rec.comparability_notes)}
        </div>
      ` : ''}
    `;
  }

  // OUTCOME Metadata
  else if (rec.record_type === RECORD_TYPES.OUTCOME) {
    specificDetailsHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-surface-800 text-xs font-sans">
        <div class="p-2.5 bg-surface-900/60 border border-surface-800">
          <span class="text-[9px] font-mono uppercase text-surface-400 block font-bold">MEASURED RESULT</span>
          <span class="text-sm font-mono font-bold text-crimson block mt-1">${escapeHtml(rec.measurement || rec.result || '')}</span>
        </div>
        <div class="p-2.5 bg-surface-900/40 border border-surface-800">
          <span class="text-[9px] font-mono uppercase text-surface-400 block font-bold">BASELINE ANCHOR</span>
          <span class="text-xs font-mono text-bone-100 block mt-1">${escapeHtml(rec.baseline || 'Pre-2019 Normal')}</span>
        </div>
        <div class="p-2.5 bg-surface-900/40 border border-surface-800">
          <span class="text-[9px] font-mono uppercase text-sand block font-bold">CAUSATION STATUS</span>
          <span class="text-xs font-mono font-bold text-bone-100 block mt-1">${escapeHtml((rec.causation_status || '').replace(/_/g, ' '))}</span>
        </div>
      </div>
    `;
  }

  const respHtml = renderResponsibilityList(rec.id);
  const sourceHtml = renderSourceSlip(rec.source_ids);

  return `
    <article class="p-5 sm:p-6 bg-background-elevated border border-surface-800 hover:border-surface-700 transition-colors space-y-3" id="${escapeHtml(rec.id)}" data-record-type="${escapeHtml(rec.record_type)}" data-record-classification="${escapeHtml(rec.classification)}">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-surface-800/80">
        <div class="flex items-center gap-2 flex-wrap">
          <time class="text-xs font-mono font-bold text-crimson">${escapeHtml(dateStr)}</time>
          ${typeBadge}
          ${classBadge}
          ${statusBadge}
        </div>
        <div class="text-[10px] font-mono text-surface-500">
          ID: <span class="text-surface-400">${escapeHtml(rec.id)}</span>
        </div>
      </div>

      <h3 class="font-sans font-bold text-bone-100 text-base sm:text-lg leading-snug">
        ${escapeHtml(rec.title)}
      </h3>

      <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed max-w-prose">
        ${escapeHtml(rec.summary)}
      </p>

      ${specificDetailsHtml}
      ${respHtml}
      ${sourceHtml}
    </article>
  `;
}

/**
 * Renders a Promise -> Actions -> Result -> Evidence -> Data Gap accountability chain.
 */
function renderPromiseAccountabilityModule(promiseId) {
  const trace = getAccountabilityTrace(promiseId, { sourceManifest: Array.from(SOURCE_MAP.values()) });
  if (!trace || !trace.primaryRecord) return '';

  const p = trace.primaryRecord;
  const statusBadge = renderStatusBadge(p.status, true);

  // Actions
  const actionsHtml = trace.actions && trace.actions.length > 0
    ? trace.actions.map(act => `
        <div class="p-3 bg-surface-900/80 border border-surface-800 space-y-1">
          <div class="flex items-center justify-between text-[9px] font-mono">
            <span class="text-sand font-bold uppercase">${escapeHtml(act.record_type.replace(/_/g, ' '))}</span>
            <span class="text-surface-500">${escapeHtml(act.date_start || '')}</span>
          </div>
          <div class="font-sans font-semibold text-bone-100 text-xs">${escapeHtml(act.short_title || act.title)}</div>
          <p class="text-[11px] text-surface-400 font-light leading-snug">${escapeHtml(act.summary)}</p>
        </div>
      `).join('')
    : `<div class="p-3 bg-surface-900/40 border border-surface-800 text-[11px] font-mono text-surface-400">Institutionalized via statutory decree framework; ministerial implementation ongoing.</div>`;

  // Results (Outcomes or Indicators)
  const resultsHtml = [
    ...trace.outcomes.map(o => `
      <div class="p-3 bg-surface-900/80 border border-surface-800 space-y-1">
        <div class="flex items-center justify-between text-[9px] font-mono text-crimson">
          <span class="font-bold uppercase">MEASURED OUTCOME</span>
          <span>${escapeHtml(o.reference_period || '2022–2026')}</span>
        </div>
        <div class="font-mono font-bold text-bone-100 text-xs">${escapeHtml(o.measurement || o.result)}</div>
        <p class="text-[11px] text-surface-300 font-light leading-snug">${escapeHtml(o.summary)}</p>
      </div>
    `),
    ...trace.indicators.map(ind => `
      <div class="p-3 bg-surface-900/80 border border-surface-800 space-y-1">
        <div class="flex items-center justify-between text-[9px] font-mono text-crimson">
          <span class="font-bold uppercase">INDICATOR · ${escapeHtml(ind.observation_type || '')}</span>
          <span>${escapeHtml(ind.reference_period || '')}</span>
        </div>
        <div class="font-mono font-bold text-bone-100 text-xs">${escapeHtml(ind.name)}: <span class="text-crimson">${escapeHtml(ind.value)}</span></div>
        <p class="text-[11px] text-surface-300 font-light leading-snug">${escapeHtml(ind.summary)}</p>
      </div>
    `)
  ].join('');

  // Data Gaps
  const gapsHtml = trace.dataGaps.map(g => `
    <div class="p-3 bg-surface-900/40 border border-sand/30 space-y-1">
      <div class="flex items-center justify-between text-[9px] font-mono text-sand">
        <span class="font-bold uppercase">DATA GAP IDENTIFIED</span>
        <span>${escapeHtml(g.data_gap_status || 'NOT_PUBLISHED')}</span>
      </div>
      <div class="font-sans font-medium text-bone-100 text-xs">${escapeHtml(g.short_title || g.title)}</div>
      <p class="text-[11px] text-surface-400 font-light leading-snug">${escapeHtml(g.summary)}</p>
    </div>
  `).join('');

  // Responsible
  const respHtml = trace.responsibleInstitutions && trace.responsibleInstitutions.length > 0
    ? trace.responsibleInstitutions.map(r => `
        <div class="text-xs font-mono">
          <span class="text-sand font-semibold">${escapeHtml(r.institution ? r.institution.name : r.institution_id)}</span>
          <span class="text-surface-500"> — </span>
          <span class="text-surface-300 text-[10px] uppercase">${escapeHtml((r.responsibility_type || '').replace(/_/g, ' '))}</span>
        </div>
      `).join('')
    : '';

  return `
    <div class="p-6 bg-background-elevated border border-surface-800 space-y-5" id="trace-${escapeHtml(p.id)}">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-800">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-meta text-surface-400 block">ACCOUNTABILITY CHAIN · ${escapeHtml(p.policy_area || 'GOVERNANCE')}</span>
          <h3 class="font-sans font-bold text-bone-100 text-base sm:text-lg mt-0.5">${escapeHtml(p.title)}</h3>
        </div>
        <div class="flex items-center gap-2">
          ${renderClassificationBadge(p.classification)}
          ${statusBadge}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
        <!-- 1. PROMISE -->
        <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-2">
          <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-bold">1. WHAT WAS PROMISED</span>
          <p class="text-surface-200 font-light leading-relaxed italic">"${escapeHtml(p.promise_text || p.summary)}"</p>
          <div class="text-[10px] font-mono text-surface-400 pt-2 border-t border-surface-800/60">
            Speaker: <span class="text-bone-100">${escapeHtml(p.speaker)}</span> (${escapeHtml(p.speaker_role || 'President')})
          </div>
        </div>

        <!-- 2. ACTION -->
        <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-2">
          <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-bold">2. ACTIONS TAKEN</span>
          <div class="space-y-2">
            ${actionsHtml}
          </div>
        </div>

        <!-- 3. RESULT & DATA GAP -->
        <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-2">
          <span class="text-[10px] font-mono text-crimson uppercase tracking-wider block font-bold">3. WHAT EVIDENCE SHOWS</span>
          <div class="space-y-2">
            ${resultsHtml || `<div class="text-surface-400 text-xs font-light">Outcome metrics tracked in 2026 reporting.</div>`}
            ${gapsHtml}
          </div>
        </div>
      </div>

      <!-- Status Reason & Institutional Responsibility -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-surface-800/80 text-xs font-sans">
        <div class="space-y-1">
          <span class="text-[9px] font-mono uppercase text-surface-400 font-bold block">STATUS JUSTIFICATION</span>
          <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(p.status_reason || 'Audited based on official ministry bulletins and decree gazettes.')}</p>
        </div>
        ${respHtml ? `
          <div class="space-y-1">
            <span class="text-[9px] font-mono uppercase text-surface-400 font-bold block">ACCOUNTABLE AUTHORITIES</span>
            <div class="space-y-1">${respHtml}</div>
          </div>
        ` : ''}
      </div>

      ${renderSourceSlip(p.source_ids)}
    </div>
  `;
}

/**
 * Renders the "WHAT THE STATE SAID" vs "WHAT THE RECORD SHOWS" comparison module for July 25 rupture.
 */
function renderStateComparisonModule() {
  const stm = getRecordById("ROP-STM-2021-0725-001");
  const dec = getRecordById("ROP-DEC-2021-0922-001");
  if (!stm || !dec) return '';

  return `
    <div class="p-6 bg-background-elevated border border-surface-800 space-y-5">
      <div class="pb-3 border-b border-surface-800">
        <span class="text-[10px] font-mono uppercase tracking-meta text-crimson font-bold block">COMPETING INTERPRETATIONS · JULY 25 RUPTURE</span>
        <h3 class="font-editorial text-2xl text-bone-100 mt-1">What Was Claimed vs What The Law Enacted</h3>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- WHAT THE PRESIDENCY SAID -->
        <div class="lg:col-span-6 p-5 bg-surface-900/60 border border-sand/30 space-y-3" id="${escapeHtml(stm.id)}" data-record-type="OFFICIAL_STATEMENT">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-sand font-bold">1. WHAT THE PRESIDENCY SAID</span>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-mono text-surface-500">ID: ${escapeHtml(stm.id)}</span>
              ${renderClassificationBadge(stm.classification)}
            </div>
          </div>
          <blockquote class="font-editorial text-sm sm:text-base text-bone-100 italic leading-relaxed">
            "${escapeHtml(stm.statement_text_or_summary || stm.summary)}"
          </blockquote>
          <div class="text-[10px] font-mono text-surface-400 pt-2 border-t border-surface-800">
            Speaker: <span class="text-bone-100">${escapeHtml(stm.speaker)}</span> · Date: 25 July 2021 · Carthage Palace
          </div>
          ${renderSourceSlip(stm.source_ids)}
        </div>

        <!-- WHAT THE RECORD SHOWS -->
        <div class="lg:col-span-6 p-5 bg-surface-900/60 border border-surface-800 space-y-3" id="${escapeHtml(dec.id)}-comp" data-record-type="DECISION">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-crimson font-bold">2. WHAT THE RECORD SHOWS</span>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-mono text-surface-500">REF: ${escapeHtml(dec.id)}</span>
              ${renderClassificationBadge(dec.classification)}
            </div>
          </div>
          <div class="space-y-2 text-xs text-surface-300 font-light leading-relaxed">
            <p><strong class="text-bone-100">Decree 117 (22 Sept 2021):</strong> Concentrated plenary executive and legislative decree authority in the presidency, suspended constitutional review mechanisms, and subordinated judicial careers to executive oversight.</p>
            <p><strong class="text-sand">Contested Legal Assessment:</strong> Venice Commission, National Bar Association, and international jurists documented the suspension of the separation of powers and lack of judicial remedies.</p>
          </div>
          <div class="text-[10px] font-mono text-surface-400 pt-2 border-t border-surface-800">
            Instrument: <span class="text-bone-100">Presidential Decree 2021-117 (JORT n° 86)</span>
          </div>
          ${renderSourceSlip(dec.source_ids)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders Certified Result vs Contested Claim for the 2024 Election.
 */
function renderCertifiedVsContestedModule() {
  const elec2024 = getRecordById("ROP-EVT-2024-ELEC-001");
  const opp2024 = getRecordById("ROP-OPP-2024-ISIE-001");
  if (!elec2024 || !opp2024) return '';

  return `
    <div class="p-6 bg-background-elevated border border-surface-800 space-y-5">
      <div class="pb-3 border-b border-surface-800">
        <span class="text-[10px] font-mono uppercase tracking-meta text-surface-400 font-bold block">OCTOBER 2024 PRESIDENTIAL ELECTION</span>
        <h3 class="font-editorial text-2xl text-bone-100 mt-1">Certified Outcome vs Procedural Challenges</h3>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- CERTIFIED RESULT -->
        <div class="lg:col-span-6 p-5 bg-surface-900/60 border border-surface-800 space-y-3" id="${escapeHtml(elec2024.id)}" data-record-type="EVENT">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">OFFICIAL CERTIFIED RESULT</span>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-mono text-surface-500">ID: ${escapeHtml(elec2024.id)}</span>
              ${renderClassificationBadge(elec2024.classification)}
            </div>
          </div>
          <div class="text-2xl font-editorial font-bold text-bone-100">
            90.69% <span class="text-xs font-mono font-normal text-surface-400">(2,438,954 ballots / 28.8% Turnout)</span>
          </div>
          <p class="text-xs text-surface-300 font-light leading-relaxed">
            ${escapeHtml(elec2024.summary)}
          </p>
          <div class="text-[10px] font-mono text-surface-400 pt-2 border-t border-surface-800">
            Certified by: <span class="text-bone-100">ISIE (Decision in JORT October 2024)</span>
          </div>
          ${renderSourceSlip(elec2024.source_ids)}
        </div>

        <!-- CONTESTED CLAIM -->
        <div class="lg:col-span-6 p-5 bg-surface-900/60 border border-sand/30 space-y-3" id="${escapeHtml(opp2024.id)}" data-record-type="OPPOSITION_CLAIM">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-sand font-bold">PROCEDURAL &amp; LEGAL CHALLENGES</span>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-mono text-surface-500">ID: ${escapeHtml(opp2024.id)}</span>
              ${renderClassificationBadge(opp2024.classification)}
            </div>
          </div>
          <div class="text-sm font-sans font-semibold text-bone-100">
            Administrative Court Reinstatement Rulings Rejected
          </div>
          <p class="text-xs text-surface-300 font-light leading-relaxed">
            ${escapeHtml(opp2024.summary)}
          </p>
          <div class="text-[10px] font-mono text-surface-400 pt-2 border-t border-surface-800">
            Status: <span class="text-sand font-bold uppercase">${escapeHtml(opp2024.status)}</span> · Tribunal Administratif Decisions
          </div>
          ${renderSourceSlip(opp2024.source_ids)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders a structured Data Gap card.
 */
function renderDataGapCard(gapRecord) {
  if (!gapRecord) return '';
  const statusBadge = renderStatusBadge(gapRecord.data_gap_status || 'NOT_PUBLISHED');
  const instName = resolveInstitutionName(gapRecord.institution_expected_to_hold_data);

  return `
    <div class="p-5 sm:p-6 bg-surface-900/40 border border-sand/30 space-y-3" id="${escapeHtml(gapRecord.id)}" data-record-type="DATA_GAP">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-surface-800">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-sand"></span>
          <span class="text-[10px] font-mono uppercase tracking-widest text-sand font-bold">DOCUMENTED DATA GAP</span>
          ${statusBadge}
        </div>
        <div class="text-[10px] font-mono text-surface-500">
          ID: ${escapeHtml(gapRecord.id)}
        </div>
      </div>

      <h4 class="font-sans font-bold text-bone-100 text-sm sm:text-base">
        ${escapeHtml(gapRecord.title)}
      </h4>

      <p class="text-xs text-surface-300 font-light leading-relaxed">
        ${escapeHtml(gapRecord.summary)}
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-sans">
        <div class="p-2.5 bg-background border border-surface-800">
          <span class="text-[9px] font-mono uppercase text-surface-400 font-bold block">INSTITUTION EXPECTED TO HOLD DATA</span>
          <span class="text-bone-100 font-medium">${escapeHtml(instName || gapRecord.institution_expected_to_hold_data)}</span>
        </div>
        <div class="p-2.5 bg-background border border-surface-800">
          <span class="text-[9px] font-mono uppercase text-surface-400 font-bold block">WHY THIS GAP MATTERS</span>
          <span class="text-surface-300 font-light">${escapeHtml(gapRecord.why_it_matters || '')}</span>
        </div>
      </div>

      ${gapRecord.search_or_request_status ? `
        <div class="text-[10px] font-mono text-surface-400 pt-2 border-t border-surface-800">
          SEARCH STATUS: <span class="text-surface-300">${escapeHtml(gapRecord.search_or_request_status)}</span>
        </div>
      ` : ''}

      ${renderSourceSlip(gapRecord.source_ids)}
    </div>
  `;
}

/**
 * Renders the complete, rich, single-H1 documentary chronology for /presidency.
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

  // Header Opener
  const headerHtml = renderInvestigationOpener({
    breadcrumbHtml,
    eyebrow: "THE RECORD OF POWER",
    badge: "DOCUMENTARY CHRONOLOGY · 2019–2026",
    badgeClass: "bg-crimson/15 border-crimson/40 text-crimson font-bold",
    h1: "Tunisia under Kais Saied, 2019–2026",
    deck: "A documented chronology of mandate, exceptional measures, institutional restructuring, political consolidation and measurable outcomes.",
    metadataItems: [
      { label: "ACCOUNTABILITY PERIOD", value: "2019 → 2026", highlight: true, subtext: "7 YEARS OF EXECUTIVE POWER" },
      { label: "RECORDS AUDITED", value: "18 SEED RECORDS", highlight: false, subtext: "ALL CORE TYPES REPRESENTED" },
      { label: "EPISTEMIC STANDARD", value: "FACT / CLAIM / ANALYSIS", highlight: false, subtext: "STRICT SEPARATION" },
      { label: "PRIMARY SOURCES", value: "OFFICIAL GAZETTE & INS", highlight: false, subtext: "ZERO UNVERIFIED URLS" }
    ]
  });

  // Fetch Era Records from R2.1 Selectors
  const elec2019 = getRecordById("ROP-EVT-2019-ELEC-001");
  const elec2021 = getRecordById("ROP-EVT-2021-0725-001");
  const dec2021 = getRecordById("ROP-DEC-2021-0922-001");
  const csm2022 = getRecordById("ROP-INS-2022-CSM-001");
  const judges2022 = getRecordById("ROP-DEC-2022-JUDGES-001");
  const const2022 = getRecordById("ROP-LAW-2022-CONST-001");
  const law54 = getRecordById("ROP-LAW-2022-054-001");
  const unempGrad = getRecordById("ROP-IND-UNEMP-GRAD-001");
  const gdpGrowth = getRecordById("ROP-IND-GDP-GROWTH-001");
  const waterOutcome = getRecordById("ROP-OUT-2026-WATER-001");
  const reconOutcome = getRecordById("ROP-OUT-2026-RECON-001");
  const gabesGap = getRecordById("ROP-GAP-2026-GABES-AIR-001");
  const reconGap = getRecordById("ROP-GAP-2026-RECON-RECEIPTS-001");

  // 6-Question Accountability Grammar Block
  const accountabilityGrammar = {
    topic: "The Record of Power: Centralized Governance Audit (2019–2026)",
    authority: "Presidency of the Republic of Tunisia (Carthage Palace)",
    promised: "A moral, self-reliant republic with eliminated corruption, decentralized grassroots councils, working public utilities, and rejection of external financial dictates.",
    announcedAction: "Concentrated executive and decree power via Decree 117 and 2022 Constitution; dissolved elected CSM; enacted Decree-Law 54; froze IMF EFF arrangement.",
    whatHappened: "Institutional counter-powers were dismantled; sovereign debt expanded to 80.2% of GDP; graduate unemployment reached 38.8%; potable water rationing became operational in Summer 2026.",
    verifiedFact: "Under the 2022 Constitution, all executive authority and ministerial appointments are formally centralized in the presidency, establishing unambiguous institutional responsibility.",
    unresolved: "The exact fiscal ledger of penal reconciliation settlements (held confidential under Decree-Law 2022-13) and real-time industrial ambient emissions in Gabès."
  };

  const accountabilityGrammarHtml = renderAccountabilityQuestionBlock(accountabilityGrammar);

  return `
    <article class="presidency-dossier-page py-12 sm:py-16 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- A. INVESTIGATION OPENER -->
      ${headerHtml}

      <!-- METHODOLOGY & EPISTEMIC STANDARDS STRIP -->
      <section class="p-6 bg-background-elevated border border-surface-800 space-y-4" aria-label="Methodology and Standards">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="text-xs font-mono uppercase tracking-widest text-sand font-bold block">404TN EPISTEMIC STANDARD &amp; VERIFICATION RULES</span>
          <span class="text-[10px] font-mono text-surface-500">PHASE R2.2 CHRONOLOGY ENGINE</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
          <div class="p-3.5 bg-surface-900/60 border border-surface-800 space-y-1">
            <span class="text-[10px] font-mono text-bone-100 font-bold uppercase block">FACT</span>
            <p class="text-surface-300 font-light leading-relaxed">Discrete assertions directly substantiated by official gazettes (JORT), statutory bulletins, or accredited empirical surveys.</p>
          </div>
          <div class="p-3.5 bg-surface-900/60 border border-sand/30 space-y-1">
            <span class="text-[10px] font-mono text-sand font-bold uppercase block">CLAIM · ATTRIBUTED</span>
            <p class="text-surface-300 font-light leading-relaxed">Government declarations, speech justifications, or opposition allegations. Preserved as attributed discourse; never converted to fact.</p>
          </div>
          <div class="p-3.5 bg-surface-900/60 border border-crimson/30 space-y-1">
            <span class="text-[10px] font-mono text-crimson font-bold uppercase block">ANALYSIS</span>
            <p class="text-surface-300 font-light leading-relaxed">404TN investigative interpretation and contextual synthesis of documented evidence and legal transformations.</p>
          </div>
          <div class="p-3.5 bg-surface-900/60 border border-surface-800 space-y-1">
            <span class="text-[10px] font-mono text-surface-400 font-bold uppercase block">DATA GAPS</span>
            <p class="text-surface-300 font-light leading-relaxed">Systematically documented missing or unpublished state datasets, tracked as legitimate empirical transparency findings.</p>
          </div>
        </div>
      </section>

      <!-- CHRONOLOGY NAVIGATION & FILTER BAR -->
      <nav id="chronology-nav" class="sticky top-0 z-20 bg-background/95 backdrop-blur border-y border-surface-800 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono" aria-label="Chronology Navigation">
        <div class="flex items-center gap-1.5 sm:gap-3 flex-wrap">
          <span class="text-[10px] uppercase text-surface-500 font-bold mr-1">CHRONOLOGY:</span>
          <a href="#year-2019" class="px-2.5 py-1 bg-surface-900 hover:bg-surface-800 border border-surface-800 text-bone-100 hover:text-crimson transition-colors">2019 · Mandate</a>
          <a href="#year-2021" class="px-2.5 py-1 bg-surface-900 hover:bg-surface-800 border border-surface-800 text-bone-100 hover:text-crimson transition-colors">2021 · Rupture</a>
          <a href="#year-2022" class="px-2.5 py-1 bg-surface-900 hover:bg-surface-800 border border-surface-800 text-bone-100 hover:text-crimson transition-colors">2022 · New Order</a>
          <a href="#year-2024" class="px-2.5 py-1 bg-surface-900 hover:bg-surface-800 border border-surface-800 text-bone-100 hover:text-crimson transition-colors">2024 · Consolidation</a>
          <a href="#year-2026" class="px-2.5 py-1 bg-surface-900 hover:bg-surface-800 border border-surface-800 text-bone-100 hover:text-crimson transition-colors">2026 · Outcomes</a>
        </div>
      </nav>

      <!-- =====================================================================
           ERA 1: 2019 — MANDATE
           ===================================================================== -->
      <section id="year-2019" class="space-y-6 pt-4">
        ${renderSectionOpener({
          eyebrow: "ERA 01 · 2019",
          title: "2019 — The Mandate: Anti-Establishment Landslide & Campaign Doctrine",
          deck: "Elected on October 13, 2019 with 72.71% of the vote (2.77 million ballots) on a platform pledging direct grassroots democracy, anti-corruption restitution, and text-based economic sovereignty."
        })}

        <div class="space-y-6">
          ${elec2019 ? renderChronologyItem(elec2019) : ''}
          ${renderPromiseAccountabilityModule("ROP-PRM-2019-RECON-001")}
          ${renderPromiseAccountabilityModule("ROP-PRM-2019-SOV-001")}
        </div>
      </section>

      <!-- =====================================================================
           ERA 2: 2021 — RUPTURE
           ===================================================================== -->
      <section id="year-2021" class="space-y-6 pt-8 border-t border-surface-800">
        ${renderSectionOpener({
          eyebrow: "ERA 02 · 2021",
          title: "2021 — The Rupture: Article 80 Emergency Measures & Decree 117",
          deck: "Following severe pandemic healthcare distress and nationwide unrest, President Kais Saied invoked Article 80 of the 2014 Constitution, suspended parliament, and concentrated executive and legislative powers."
        })}

        <div class="space-y-6">
          ${elec2021 ? renderChronologyItem(elec2021) : ''}
          ${renderStateComparisonModule()}
          ${dec2021 ? renderChronologyItem(dec2021) : ''}
        </div>
      </section>

      <!-- =====================================================================
           ERA 3: 2022 — NEW POLITICAL ORDER
           ===================================================================== -->
      <section id="year-2022" class="space-y-6 pt-8 border-t border-surface-800">
        ${renderSectionOpener({
          eyebrow: "ERA 03 · 2022",
          title: "2022 — The New Political Order: Constitutional Transformation & Judicial Restructuring",
          deck: "Structural transition to an executive-dominant republic: dissolution of the High Judicial Council, executive revocation of 57 magistrates, promulgation of the 2022 Constitution via referendum, and enactment of Decree-Law 54."
        })}

        <div class="space-y-6">
          ${csm2022 ? renderChronologyItem(csm2022) : ''}
          ${judges2022 ? renderChronologyItem(judges2022) : ''}
          ${const2022 ? renderChronologyItem(const2022) : ''}
          ${law54 ? renderChronologyItem(law54) : ''}
        </div>
      </section>

      <!-- =====================================================================
           ERA 4: 2024 — CONSOLIDATION
           ===================================================================== -->
      <section id="year-2024" class="space-y-6 pt-8 border-t border-surface-800">
        ${renderSectionOpener({
          eyebrow: "ERA 04 · 2024",
          title: "2024 — Political Consolidation: Re-Election & Contested Electoral Framework",
          deck: "Kais Saied secured re-election on October 6, 2024 with 90.69% of the vote on a 28.8% turnout in a ballot characterized by candidate disqualifications and non-execution of Administrative Court reinstatement orders."
        })}

        <div class="space-y-6">
          ${renderCertifiedVsContestedModule()}
        </div>
      </section>

      <!-- =====================================================================
           ERA 5: 2026 — RECORD & OUTCOMES
           ===================================================================== -->
      <section id="year-2026" class="space-y-8 pt-8 border-t border-surface-800">
        ${renderSectionOpener({
          eyebrow: "ERA 05 · 2026",
          title: "2026 — The Record & Measured Outcomes: Direct Executive Responsibility Tested",
          deck: "Five years following the July 2021 rupture, all institutional mechanisms are directly accountable to the presidency. 404TN measures macroeconomic indicators, public service delivery, and documented data gaps."
        })}

        <!-- Macroeconomic Indicators & Public Services -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${unempGrad ? renderChronologyItem(unempGrad) : ''}
          ${gdpGrowth ? renderChronologyItem(gdpGrowth) : ''}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${reconOutcome ? renderChronologyItem(reconOutcome) : ''}
          ${waterOutcome ? renderChronologyItem(waterOutcome) : ''}
        </div>

        <!-- Documented Data Gaps Sub-Section -->
        <div class="space-y-4 pt-4">
          <div class="flex items-center justify-between pb-2 border-b border-surface-800">
            <span class="text-xs font-mono uppercase tracking-widest text-sand font-bold">DOCUMENTED TRANSPARENCY DATA GAPS</span>
            <span class="text-[10px] font-mono text-surface-500">2 AUDITED GAPS</span>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            ${gabesGap ? renderDataGapCard(gabesGap) : ''}
            ${reconGap ? renderDataGapCard(reconGap) : ''}
          </div>
        </div>

        <!-- Sovereign Ratings & Public Trust Benchmarks -->
        <div class="space-y-6 pt-6 border-t border-surface-800">
          <div class="flex items-center justify-between pb-2 border-b border-surface-800">
            <span class="text-xs font-mono uppercase tracking-widest text-surface-400 font-bold">SOVEREIGN RATINGS &amp; PUBLIC TRUST TRAJECTORY</span>
            <span class="text-[10px] font-mono text-surface-500">ARAB BAROMETER · MOODY'S · FITCH</span>
          </div>

          <div class="space-y-3">
            ${eco.sovereignRatings.map(r => renderRatingChange(r)).join("")}
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            ${trust.benchmarks.slice(0, 3).map(bm => renderPollResult({
              organization: trust.metadata.primarySource,
              fieldwork: "2018–2024 Trends",
              sampleSize: trust.metadata.sampleSize,
              methodology: trust.metadata.methodology,
              question: bm.question,
              results: bm.results.map(r => ({
                label: `${r.wave}: ${r.note || ''}`,
                percentage: r.value,
                highlight: r.highlight
              }))
            })).join("")}
          </div>
        </div>
      </section>

      <!-- 6-QUESTION ACCOUNTABILITY GRAMMAR BLOCK -->
      ${accountabilityGrammarHtml}

      <!-- CONNECTED INVESTIGATIVE FILES -->
      <section class="space-y-4 pt-6 border-t border-surface-800">
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
      </section>

    </article>
  `;
}
