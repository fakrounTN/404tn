// src/presidency-data.js
// 404TN — The Record of Power: Documentary Chronology UI (Tunisia 2019–2026)
// Authoritative evidence-backed interface for /presidency route directly consuming R2.3 data architecture.

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
 * Renders classification badge with restrained paper editorial styling.
 */
function renderClassificationBadge(classification) {
  if (classification === EPISTEMIC_CLASSIFICATION.FACT) {
    return `<span class="stamp-badge stamp-paper-fact">FACT</span>`;
  }
  if (classification === EPISTEMIC_CLASSIFICATION.CLAIM) {
    return `<span class="stamp-badge stamp-paper-claim" title="Attributed statement or allegation not independently established as fact">CLAIM · ATTRIBUTED</span>`;
  }
  if (classification === EPISTEMIC_CLASSIFICATION.ANALYSIS) {
    return `<span class="stamp-badge stamp-paper-analysis" title="404TN investigative interpretation">ANALYSIS</span>`;
  }
  if (classification === 'DATA_GAP' || classification === 'DATA GAP') {
    return `<span class="stamp-badge stamp-paper-datagap">DATA GAP</span>`;
  }
  return `<span class="stamp-badge bg-surface-200 text-paper-main border-paper">${escapeHtml(classification)}</span>`;
}

/**
 * Renders a canonical status badge on paper.
 */
function renderStatusBadge(status, highlight = false) {
  if (!status) return '';
  const s = String(status).replace(/_/g, ' ');
  let colorClass = 'bg-[#F2EFE9] text-paper-muted border-paper';
  if (status === 'UNEXECUTED' || status === 'UNRESOLVED' || status === 'NOT_PUBLISHED' || status === 'INACCESSIBLE' || status === 'BROKEN' || status === 'SUBVERTED') {
    colorClass = 'bg-red-50 text-red-700 border-red-200 font-semibold';
  } else if (status === 'ENACTED' || status === 'CONFIRMED' || status === 'VERIFIED' || status === 'FULFILLED') {
    colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
  } else if (status === 'DISPUTED' || status === 'CONTESTED' || status === 'PARTIAL' || status === 'PRELIMINARY') {
    colorClass = 'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
  }
  return `<span class="text-[9px] font-mono uppercase px-2 py-0.5 border ${colorClass}">${escapeHtml(s)}</span>`;
}

/**
 * Renders responsible institutions for a record on paper.
 */
function renderResponsibilityList(recordId) {
  const rsps = getResponsibilityForRecord(recordId, RESPONSIBILITY_RECORDS, INSTITUTIONS_REGISTRY);
  if (!rsps || rsps.length === 0) return '';

  const entries = rsps.map(r => {
    const instName = r.institution ? `${r.institution.name} (${r.institution.short_name})` : r.institution_id;
    const typeLabel = (r.responsibility_type || '').replace(/_/g, ' ');
    const basis = r.legal_or_administrative_basis ? ` · <span class="text-paper-muted font-light">${escapeHtml(r.legal_or_administrative_basis)}</span>` : '';
    return `
      <div class="text-xs font-mono">
        <span class="text-paper-sand font-bold">${escapeHtml(instName)}</span>
        <span class="text-paper-dim"> — </span>
        <span class="text-paper-main font-semibold uppercase text-[10px]">${escapeHtml(typeLabel)}</span>
        ${basis}
      </div>
    `;
  }).join('');

  return `
    <div class="pt-2 mt-2 border-t border-paper text-xs font-mono space-y-1">
      <span class="text-[9px] font-mono uppercase tracking-meta text-paper-dim block font-bold">INSTITUTIONAL RESPONSIBILITY</span>
      <div class="space-y-0.5">
        ${entries}
      </div>
    </div>
  `;
}

/**
 * Renders primary source provenance footnote for a record on paper.
 */
function renderSourceSlip(sourceIds) {
  if (!Array.isArray(sourceIds) || sourceIds.length === 0) return '';
  const slips = sourceIds.map(sid => {
    const s = resolveSource(sid);
    if (!s) return `<span class="text-paper-dim font-mono text-[10px]">[SRC: ${escapeHtml(sid)}]</span>`;
    const urlHtml = s.url ? `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="text-paper-red hover:underline ml-1.5 font-bold">Document Link ↗</a>` : '';
    return `
      <div class="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-paper-muted">
        <div>
          <span class="text-paper-dim uppercase font-bold">[SRC]</span>
          <span class="text-paper-main font-bold ml-1">${escapeHtml(s.organization)}</span>
          <span class="text-paper-dim"> — </span>
          <span class="text-paper-main italic">"${escapeHtml(s.title)}"</span>
          <span class="text-paper-dim">(${escapeHtml(s.publication_date || s.reference_period || '')})</span>
        </div>
        <div>
          <span class="px-1.5 py-0.5 bg-[#F2EFE9] border border-paper text-paper-muted uppercase text-[9px]">${escapeHtml(s.source_type)}</span>
          ${urlHtml}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="pt-2 mt-2 border-t border-paper space-y-1">
      ${slips}
    </div>
  `;
}

/**
 * Renders a primary chronology record row/entry on paper (open broadsheet item, NO enclosing card rectangle).
 */
function renderChronologyItem(rec) {
  if (!rec) return '';
  const typeBadge = `<span class="stamp-badge bg-[#F2EFE9] border-paper text-paper-muted font-semibold uppercase">${escapeHtml(rec.record_type.replace(/_/g, ' '))}</span>`;
  const classBadge = renderClassificationBadge(rec.classification);
  const statusBadge = rec.status ? renderStatusBadge(rec.status) : '';
  const dateStr = rec.date_start ? (rec.date_start.length === 10 ? rec.date_start : rec.date_start) : '2019–2026';

  let specificDetailsHtml = '';

  // LAW Metadata
  if (rec.record_type === RECORD_TYPES.LAW) {
    specificDetailsHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 pt-2 border-t border-paper text-xs font-sans">
        ${rec.stated_purpose ? `
          <div class="p-3 bg-[#F2EFE9] border border-paper space-y-1">
            <span class="text-[9px] font-mono text-paper-sand uppercase font-bold block">STATED LEGISLATIVE PURPOSE</span>
            <p class="text-paper-main font-light leading-relaxed">${escapeHtml(rec.stated_purpose)}</p>
          </div>
        ` : ''}
        ${rec.documented_effect ? `
          <div class="p-3 bg-[#F2EFE9] border border-paper space-y-1">
            <span class="text-[9px] font-mono text-paper-red uppercase font-bold block">DOCUMENTED INSTITUTIONAL EFFECT</span>
            <p class="text-paper-main font-light leading-relaxed">${escapeHtml(rec.documented_effect)}</p>
          </div>
        ` : ''}
      </div>
      ${rec.legal_challenges ? `
        <div class="mt-2 text-xs font-sans p-3 bg-[#F2EFE9] border border-paper">
          <span class="text-[9px] font-mono text-paper-sand uppercase font-bold block">LEGAL CHALLENGES &amp; OBJECTIONS</span>
          <p class="text-paper-muted font-light mt-0.5">${escapeHtml(rec.legal_challenges)}</p>
        </div>
      ` : ''}
      ${rec.jort_reference ? `
        <div class="text-[10px] font-mono text-paper-muted mt-2">
          GAZETTE: <span class="text-paper-main font-bold">${escapeHtml(rec.jort_reference)}</span>
          ${rec.relevant_articles ? ` · Articles: <span class="text-paper-main font-medium">${escapeHtml(rec.relevant_articles.join(', '))}</span>` : ''}
        </div>
      ` : ''}
    `;
  }

  // DECISION Metadata
  else if (rec.record_type === RECORD_TYPES.DECISION) {
    specificDetailsHtml = `
      ${rec.stated_reason ? `
        <div class="mt-2 text-xs font-sans p-3 bg-[#F2EFE9] border border-paper">
          <span class="text-[9px] font-mono text-paper-sand uppercase font-bold block">STATED ADMINISTRATIVE REASON</span>
          <p class="text-paper-main font-light mt-0.5">${escapeHtml(rec.stated_reason)}</p>
        </div>
      ` : ''}
      ${rec.contested_interpretations ? `
        <div class="mt-2 text-xs font-sans p-3 bg-[#F2EFE9] border border-paper">
          <span class="text-[9px] font-mono text-paper-red uppercase font-bold block">CONTESTED INTERPRETATION &amp; COURT INJUNCTIONS</span>
          <p class="text-paper-main font-light mt-0.5">${escapeHtml(rec.contested_interpretations)}</p>
        </div>
      ` : ''}
      ${rec.legal_basis ? `
        <div class="text-[10px] font-mono text-paper-muted mt-2">
          LEGAL BASIS: <span class="text-paper-main font-bold">${escapeHtml(rec.legal_basis)}</span>
        </div>
      ` : ''}
    `;
  }

  // INDICATOR Metadata
  else if (rec.record_type === RECORD_TYPES.INDICATOR) {
    specificDetailsHtml = `
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 pt-2 border-t border-paper text-xs font-sans">
        <div class="p-3 bg-[#F2EFE9] border border-paper text-center">
          <span class="text-[9px] font-mono uppercase text-paper-dim block">RECORDED VALUE</span>
          <span class="text-2xl font-editorial font-bold text-paper-red block my-1">${escapeHtml(rec.value)}</span>
          <span class="text-[9px] font-mono text-paper-muted">${escapeHtml(rec.unit || '')}</span>
        </div>
        <div class="p-3 bg-[#F2EFE9] border border-paper space-y-1">
          <span class="text-[9px] font-mono uppercase text-paper-sand font-bold block">OBSERVATION TYPE</span>
          <div class="font-mono text-xs font-bold text-paper-main">${escapeHtml(rec.observation_type || '')}</div>
          <div class="text-[10px] text-paper-dim">Ref: ${escapeHtml(rec.reference_period || '')}</div>
        </div>
        <div class="p-3 bg-[#F2EFE9] border border-paper space-y-1">
          <span class="text-[9px] font-mono uppercase text-paper-dim font-bold block">METHODOLOGY &amp; BASE</span>
          <p class="text-[10px] text-paper-muted leading-tight">${escapeHtml(rec.methodology || '')}</p>
        </div>
      </div>
      ${rec.comparability_notes ? `
        <div class="text-[10px] font-mono text-paper-muted p-2 bg-[#F2EFE9] border border-paper mt-2">
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
 * Renders a Promise -> Actions -> Result -> Evidence -> Data Gap accountability chain on paper.
 */
function renderPromiseAccountabilityModule(promiseId) {
  const trace = getAccountabilityTrace(promiseId, { sourceManifest: Array.from(SOURCE_MAP.values()) });
  if (!trace || !trace.primaryRecord) return '';

  const p = trace.primaryRecord;
  const statusBadge = renderStatusBadge(p.status, true);

  // Actions
  const actionsHtml = trace.actions && trace.actions.length > 0
    ? trace.actions.map(act => `
        <div class="p-3 bg-[#F2EFE9] border border-paper space-y-1">
          <div class="flex items-center justify-between text-[9px] font-mono">
            <span class="text-paper-sand font-bold uppercase">${escapeHtml(act.record_type.replace(/_/g, ' '))}</span>
            <span class="text-paper-dim">${escapeHtml(act.date_start || '')}</span>
          </div>
          <div class="font-sans font-semibold text-paper-main text-xs">${escapeHtml(act.short_title || act.title)}</div>
          <p class="text-[11px] text-paper-muted font-light leading-snug">${escapeHtml(act.summary)}</p>
        </div>
      `).join('')
    : `<div class="p-3 bg-[#F2EFE9] border border-paper text-[11px] font-mono text-paper-muted">Institutionalized via statutory decree framework; ministerial implementation ongoing.</div>`;

  // Results (Outcomes or Indicators)
  const resultsHtml = [
    ...trace.outcomes.map(o => `
      <div class="p-3 bg-[#F2EFE9] border border-paper space-y-1">
        <div class="flex items-center justify-between text-[9px] font-mono text-paper-red">
          <span class="font-bold uppercase">MEASURED OUTCOME</span>
          <span>${escapeHtml(o.reference_period || '2022–2026')}</span>
        </div>
        <div class="font-mono font-bold text-paper-main text-xs">${escapeHtml(o.measurement || o.result)}</div>
        <p class="text-[11px] text-paper-muted font-light leading-snug">${escapeHtml(o.summary)}</p>
      </div>
    `),
    ...trace.indicators.map(ind => `
      <div class="p-3 bg-[#F2EFE9] border border-paper space-y-1">
        <div class="flex items-center justify-between text-[9px] font-mono text-paper-red">
          <span class="font-bold uppercase">INDICATOR · ${escapeHtml(ind.observation_type || '')}</span>
          <span>${escapeHtml(ind.reference_period || '')}</span>
        </div>
        <div class="font-mono font-bold text-paper-main text-xs">${escapeHtml(ind.name)}: <span class="text-paper-red">${escapeHtml(ind.value)}</span></div>
        <p class="text-[11px] text-paper-muted font-light leading-snug">${escapeHtml(ind.summary)}</p>
      </div>
    `)
  ].join('');

  // Data Gaps
  const gapsHtml = trace.dataGaps.map(g => `
    <div class="p-3 bg-[#FEF9C3]/50 border border-[#EAB308]/40 space-y-1">
      <div class="flex items-center justify-between text-[9px] font-mono text-paper-sand">
        <span class="font-bold uppercase">DATA GAP IDENTIFIED</span>
        <span>${escapeHtml(g.data_gap_status || 'NOT_PUBLISHED')}</span>
      </div>
      <div class="font-sans font-medium text-paper-main text-xs">${escapeHtml(g.short_title || g.title)}</div>
      <p class="text-[11px] text-paper-muted font-light leading-snug">${escapeHtml(g.summary)}</p>
    </div>
  `).join('');

  // Responsible
  const respHtml = trace.responsibleInstitutions && trace.responsibleInstitutions.length > 0
    ? trace.responsibleInstitutions.map(r => `
        <div class="text-xs font-mono">
          <span class="text-paper-sand font-semibold">${escapeHtml(r.institution ? r.institution.name : r.institution_id)}</span>
          <span class="text-paper-dim"> — </span>
          <span class="text-paper-main text-[10px] uppercase font-medium">${escapeHtml((r.responsibility_type || '').replace(/_/g, ' '))}</span>
        </div>
      `).join('')
    : '';

  return `
    <div class="p-5 sm:p-6 bg-white border border-paper shadow-sm space-y-4 my-4" id="trace-${escapeHtml(p.id)}">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-paper">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-meta text-paper-dim block font-bold">ACCOUNTABILITY CHAIN · ${escapeHtml(p.policy_area || 'GOVERNANCE')}</span>
          <h3 class="font-sans font-bold text-paper-main text-base sm:text-lg mt-0.5">${escapeHtml(p.title)}</h3>
        </div>
        <div class="flex items-center gap-2">
          ${renderClassificationBadge(p.classification)}
          ${statusBadge}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
        <!-- 1. PROMISE -->
        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-2">
          <span class="text-[10px] font-mono text-paper-sand uppercase tracking-wider block font-bold">1. WHAT WAS PROMISED</span>
          <p class="text-paper-main font-light leading-relaxed italic">"${escapeHtml(p.promise_text || p.summary)}"</p>
          <div class="text-[10px] font-mono text-paper-dim pt-2 border-t border-paper">
            Speaker: <span class="text-paper-main font-bold">${escapeHtml(p.speaker)}</span> (${escapeHtml(p.speaker_role || 'President')})
          </div>
        </div>

        <!-- 2. ACTION -->
        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-2">
          <span class="text-[10px] font-mono text-paper-sand uppercase tracking-wider block font-bold">2. ACTIONS TAKEN</span>
          <div class="space-y-2">
            ${actionsHtml}
          </div>
        </div>

        <!-- 3. RESULT & DATA GAP -->
        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-2">
          <span class="text-[10px] font-mono text-paper-red uppercase tracking-wider block font-bold">3. WHAT EVIDENCE SHOWS</span>
          <div class="space-y-2">
            ${resultsHtml || `<div class="text-paper-muted text-xs font-light">Outcome metrics tracked in 2026 reporting.</div>`}
            ${gapsHtml}
          </div>
        </div>
      </div>

      <!-- Status Reason & Institutional Responsibility -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-paper text-xs font-sans">
        <div class="space-y-1">
          <span class="text-[9px] font-mono uppercase text-paper-dim font-bold block">STATUS JUSTIFICATION</span>
          <p class="text-paper-muted font-light leading-relaxed">${escapeHtml(p.status_reason || 'Audited based on official ministry bulletins and decree gazettes.')}</p>
        </div>
        ${respHtml ? `
          <div class="space-y-1">
            <span class="text-[9px] font-mono uppercase text-paper-dim font-bold block">ACCOUNTABLE AUTHORITIES</span>
            <div class="space-y-1">${respHtml}</div>
          </div>
        ` : ''}
      </div>

      ${renderSourceSlip(p.source_ids)}
    </div>
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
        <div class="lg:col-span-6 p-5 bg-[#FAF8F5] border border-paper space-y-3" id="${escapeHtml(stm.id)}" data-record-type="OFFICIAL_STATEMENT">
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
        <div class="lg:col-span-6 p-5 bg-[#FAF8F5] border border-paper space-y-3" id="${escapeHtml(elec2024.id)}" data-record-type="EVENT">
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
        <div class="lg:col-span-6 p-5 bg-[#FAF8F5] border border-paper space-y-3" id="${escapeHtml(opp2024.id)}" data-record-type="OPPOSITION_CLAIM">
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
 * Helper to render an entire year section from SEED_RECORDS
 */
function renderYearChronologySection(year, title, subtitle, recordIds, customModules = '') {
  const records = recordIds.map(id => getRecordById(id)).filter(Boolean);
  const itemsHtml = records.map(r => `
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
            <span class="font-editorial text-2xl sm:text-3xl text-paper-main font-normal">— ${escapeHtml(title)}</span>
          </div>
          <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-3xl">${escapeHtml(subtitle)}</p>
        </div>
      </div>

      ${customModules ? `<div class="space-y-4">${customModules}</div>` : ''}

      <div class="chronology-spine-paper space-y-4 pt-2">
        ${itemsHtml}
      </div>
    </section>
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

  // Header Opener (Dark Investigative Canvas)
  const headerHtml = renderInvestigationOpener({
    breadcrumbHtml,
    eyebrow: "THE RECORD OF POWER",
    badge: "DOCUMENTARY CHRONOLOGY · 2019–2026",
    badgeClass: "bg-crimson/15 border-crimson/40 text-crimson font-bold",
    h1: "Tunisia under Kais Saied, 2019–2026",
    deck: "A documented chronology of mandate, exceptional measures, institutional restructuring, political consolidation and measurable outcomes.",
    metadataItems: [
      { label: "ACCOUNTABILITY PERIOD", value: "2019 → 2026", highlight: true, subtext: "8 CHRONOLOGICAL ERAS" },
      { label: "RECORDS AUDITED", value: "88 CANONICAL RECORDS", highlight: false, subtext: "10 CORE TYPES REPRESENTED" },
      { label: "EPISTEMIC STANDARD", value: "FACT / CLAIM / ANALYSIS", highlight: false, subtext: "STRICT PROVENANCE SEPARATION" },
      { label: "PRIMARY SOURCES", value: "OFFICIAL GAZETTE & INS", highlight: false, subtext: "28 PRIMARY SOURCES LINKED" }
    ]
  });

  // 6-Question Accountability Grammar Block (Adapted for Paper)
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
          <p class="text-paper-muted font-light leading-relaxed">Institutional counter-powers were dismantled; sovereign debt expanded to 80.2% of GDP; graduate unemployment reached 38.8%; potable water rationing became operational in Summer 2026.</p>
        </div>

        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1">
          <span class="text-[10px] font-mono text-paper-main uppercase tracking-wider block font-bold">4. WHO WAS RESPONSIBLE?</span>
          <p class="text-paper-muted font-light leading-relaxed">Presidency of the Republic of Tunisia (Carthage Palace)</p>
        </div>

        <div class="p-4 bg-[#FAF8F5] border border-paper space-y-1">
          <span class="text-[10px] font-mono text-emerald-800 uppercase tracking-wider block font-bold">5. WHAT IS VERIFIED?</span>
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

      <!-- A. INVESTIGATION OPENER (DARK INVESTIGATIVE CANVAS) -->
      <div class="bg-background text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          ${headerHtml}
        </div>
      </div>

      <!-- B. DOCUMENTARY REPORT VIEW (REAL WARM PAPER SURFACE) -->
      <div class="surface-paper py-10 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

          <!-- METHODOLOGY & EPISTEMIC STANDARDS STRIP -->
          <section class="p-5 sm:p-6 bg-white border border-paper shadow-sm space-y-4" aria-label="Methodology and Standards">
            <div class="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-paper">
              <span class="text-xs font-mono uppercase tracking-widest text-paper-sand font-bold block">404TN EPISTEMIC STANDARD &amp; VERIFICATION RULES</span>
              <span class="text-[10px] font-mono text-paper-dim">PHASE R2.3 CHRONOLOGY ENGINE · 88 CANONICAL RECORDS</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
              <div class="p-3.5 bg-[#FAF8F5] border border-paper space-y-1">
                <span class="text-[10px] font-mono text-paper-main font-bold uppercase block">FACT</span>
                <p class="text-paper-muted font-light leading-relaxed">Discrete assertions directly substantiated by official gazettes (JORT), statutory bulletins, or accredited empirical surveys.</p>
              </div>
              <div class="p-3.5 bg-[#FAF8F5] border border-paper space-y-1">
                <span class="text-[10px] font-mono text-paper-sand font-bold uppercase block">CLAIM · ATTRIBUTED</span>
                <p class="text-paper-muted font-light leading-relaxed">Government declarations, speech justifications, or opposition allegations. Preserved as attributed discourse; never converted to fact.</p>
              </div>
              <div class="p-3.5 bg-[#FAF8F5] border border-paper space-y-1">
                <span class="text-[10px] font-mono text-paper-red font-bold uppercase block">ANALYSIS</span>
                <p class="text-paper-muted font-light leading-relaxed">404TN investigative interpretation and contextual synthesis of documented evidence and legal transformations.</p>
              </div>
              <div class="p-3.5 bg-[#FAF8F5] border border-paper space-y-1">
                <span class="text-[10px] font-mono text-paper-dim font-bold uppercase block">DATA GAPS</span>
                <p class="text-paper-muted font-light leading-relaxed">Systematically documented missing or unpublished state datasets, tracked as legitimate empirical transparency findings.</p>
              </div>
            </div>
          </section>

          <!-- CHRONOLOGY NAVIGATION & FILTER BAR -->
          <nav id="chronology-nav" class="sticky top-0 z-20 bg-[#FAF8F5]/95 backdrop-blur border-y border-paper py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono" aria-label="Chronology Navigation">
            <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span class="text-[10px] uppercase text-paper-dim font-bold mr-1">CHRONOLOGY:</span>
              <a href="#year-2019" class="px-2 py-1 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">2019</a>
              <a href="#year-2020" class="px-2 py-1 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">2020</a>
              <a href="#year-2021" class="px-2 py-1 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">2021</a>
              <a href="#year-2022" class="px-2 py-1 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">2022</a>
              <a href="#year-2023" class="px-2 py-1 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">2023</a>
              <a href="#year-2024" class="px-2 py-1 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">2024</a>
              <a href="#year-2025" class="px-2 py-1 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">2025</a>
              <a href="#year-2026" class="px-2 py-1 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">2026</a>
            </div>
          </nav>

          <!-- =====================================================================
               ERA 1: 2019 — THE MANDATE & PROMISES
               ===================================================================== -->
          ${renderYearChronologySection(
            2019,
            "The Mandate & Promises",
            "Elected on October 13, 2019 with 72.71% of the vote (2.77 million ballots) on a platform pledging direct grassroots democracy, anti-corruption restitution, and sovereign economic self-reliance.",
            [
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
            ],
            `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              ${renderPromiseAccountabilityModule("ROP-PRM-2019-RECON-001")}
              ${renderPromiseAccountabilityModule("ROP-PRM-2019-SOV-001")}
            </div>`
          )}

          <!-- =====================================================================
               ERA 2: 2020 — GOVERNING CRISIS & INSTITUTIONAL CONFLICT
               ===================================================================== -->
          ${renderYearChronologySection(
            2020,
            "Governing Crisis & Institutional Conflict",
            "Parliamentary fragmentation and successive cabinet collapses amid the COVID-19 pandemic contraction (-8.6% real GDP), culminating in growing friction between Carthage Palace and the Kasbah.",
            [
              "ROP-EVT-2020-GOV-FRIB-001",
              "ROP-DEC-2020-FFAIL-001",
              "ROP-EVT-2020-FAKH-RESIGN",
              "ROP-DEC-2020-MECH-APPOINT",
              "ROP-STM-2020-DIPL-001",
              "ROP-DEC-2020-KAMOUR-001",
              "ROP-OUT-2020-COVID-001"
            ]
          )}

          <!-- =====================================================================
               ERA 3: 2021 — JULY 25 RUPTURE / ARTICLE 80 / EXCEPTIONAL MEASURES
               ===================================================================== -->
          ${renderYearChronologySection(
            2021,
            "July 25 Rupture & Exceptional Measures",
            "Following severe pandemic healthcare distress and nationwide unrest, President Kais Saied invoked Article 80 of the 2014 Constitution, suspended parliament, dismissed the Prime Minister, and promulgated Decree 117 consolidating decree powers.",
            [
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
            ],
            renderStateComparisonModule()
          )}

          <!-- =====================================================================
               ERA 4: 2022 — STRUCTURAL TRANSFORMATION & 2022 CONSTITUTION
               ===================================================================== -->
          ${renderYearChronologySection(
            2022,
            "Structural Transformation & 2022 Constitution",
            "Executive dissolution of the High Judicial Council, revocation of 57 magistrates, promulgation of the 2022 Constitution via national referendum (30.5% turnout), enactment of Decree-Law 54, and negotiation of the IMF Staff-Level Agreement.",
            [
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
          )}

          <!-- =====================================================================
               ERA 5: 2023 — INSTITUTIONAL CONSOLIDATION & PROSECUTIONS
               ===================================================================== -->
          ${renderYearChronologySection(
            2023,
            "Institutional Consolidation, Prosecutions & Foreign Shift",
            "Inauguration of the new unicameral ARP (11.4% turnout), dissolution of municipal councils, detention of opposition figures under conspiracy charges, public rejection of the IMF program, and signature of the EU-Tunisia Strategic MoU.",
            [
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
          )}

          <!-- =====================================================================
               ERA 6: 2024 — PRESIDENTIAL ELECTION & LITIGATION CONFLICT
               ===================================================================== -->
          ${renderYearChronologySection(
            2024,
            "Presidential Election & Judicial Authority Conflict",
            "Inauguration of the National Council of Regions, enactment of Law 2024-10 authorizing direct Central Bank lending to settle Eurobonds, ISIE rejection of Administrative Court candidate reinstatements, emergency Law 2024-45 stripping administrative court jurisdiction, and Kais Saied re-election with 90.69% of the vote.",
            [
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
            ],
            renderCertifiedVsContestedModule()
          )}

          <!-- =====================================================================
               ERA 7: 2025 — OUTCOMES, INSTITUTIONAL EFFECTS & PUBLIC OPINION
               ===================================================================== -->
          ${renderYearChronologySection(
            2025,
            "Outcomes, Institutional Effects & Public Confidence",
            "Debates on draft civil society and foreign NGO financing legislation, administrative rollout of community enterprises (236 created, 60 operational by Nov 2025; 95M TND state credit lines), National Guard maritime interceptions exceeding 70,000 persons, phosphate extraction performance (~3.3M tonnes), and civil society rebuttals on utility disruptions.",
            [
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
          )}

          <!-- =====================================================================
               ERA 8: 2026 — MEASURABLE RESULTS & ACCOUNTABILITY
               ===================================================================== -->
          <section id="year-2026" class="space-y-8 pt-8 border-t border-paper">
            <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-paper">
              <div class="space-y-1">
                <div class="flex items-baseline gap-3">
                  <span class="font-editorial text-4xl sm:text-5xl lg:text-6xl text-paper-red font-light tracking-tight">2026</span>
                  <span class="font-editorial text-2xl sm:text-3xl text-paper-main font-normal">— The Record &amp; Measured Outcomes</span>
                </div>
                <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-3xl">Seven years following the 2019 mandate and five years following the July 2021 rupture, all institutional mechanisms are directly accountable to the presidency. 404TN measures macroeconomic indicators, public service delivery, and documented data gaps.</p>
              </div>
            </div>

            <!-- Macroeconomic Indicators & Public Services (Open broadsheet layout) -->
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
          </section>

          <!-- 6-QUESTION ACCOUNTABILITY GRAMMAR BLOCK -->
          ${accountabilityGrammarHtml}

        </div>
      </div>

      <!-- C. CONNECTED INVESTIGATIVE FILES (DARK INVESTIGATIVE FOOTER TRANSITION) -->
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
