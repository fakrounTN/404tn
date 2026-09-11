// src/editorial-components.js
// 404TN Shared Editorial Design System Components & Render Helpers (Phase C)
// Authoritative, accessible, lightweight markup for investigations, dossiers, comparisons, and telemetry.

import { escapeHtml, stripHtml } from './utils.js';

/**
 * 1. Investigation Opener
 * Renders authoritative header for major special reports and dossiers with single <h1>,
 * breadcrumbs, eyebrow, metadata ribbon, and deck.
 */
export function renderInvestigationOpener({
  breadcrumbHtml = '',
  eyebrow = '',
  badge = 'ACTIVE INVESTIGATION',
  badgeClass = 'bg-crimson/10 border-crimson/30 text-crimson',
  h1 = '',
  deck = '',
  metadataItems = []
}) {
  const metaHtml = metadataItems.map(m => `
    <div class="p-3 sm:p-4 bg-surface-900/60 border border-surface-800">
      <span class="text-[10px] font-mono text-surface-400 uppercase tracking-meta block">${escapeHtml(m.label)}</span>
      <span class="text-xs sm:text-sm font-mono ${m.highlight ? 'text-crimson' : 'text-bone-100'} font-bold uppercase mt-0.5 block">${escapeHtml(m.value)}</span>
      ${m.subtext ? `<span class="text-[10px] font-mono text-surface-500 block mt-0.5">${escapeHtml(m.subtext)}</span>` : ''}
    </div>
  `).join("");

  return `
    <header id="prerendered-route-header" class="space-y-6 pb-10 border-b border-surface-800">
      ${breadcrumbHtml}
      <div class="space-y-3">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-bold">${escapeHtml(eyebrow)}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 border uppercase font-semibold ${badgeClass}">${escapeHtml(badge)}</span>
        </div>
        <h1 class="font-editorial text-3xl sm:text-5xl lg:text-6xl text-bone-100 font-normal leading-[1.12] tracking-tight">
          ${escapeHtml(h1)}
        </h1>
        <p class="text-base sm:text-xl text-surface-300 font-light leading-relaxed max-w-4xl">
          ${escapeHtml(deck)}
        </p>
      </div>
      ${metadataItems.length > 0 ? `
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 border-t border-surface-800/80">
          ${metaHtml}
        </div>
      ` : ''}
    </header>
  `;
}

/**
 * 2. Section Opener
 * Renders structured section title with eyebrow tag, serif heading, and optional descriptive subtitle.
 */
export function renderSectionOpener({
  eyebrow = '',
  title = '',
  deck = '',
  rightContentHtml = ''
}) {
  return `
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-surface-800">
      <div class="space-y-1">
        ${eyebrow ? `<span class="text-xs font-mono uppercase tracking-widest text-crimson font-semibold block">${escapeHtml(eyebrow)}</span>` : ''}
        <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">${escapeHtml(title)}</h2>
        ${deck ? `<p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed max-w-2xl">${escapeHtml(deck)}</p>` : ''}
      </div>
      ${rightContentHtml ? `<div class="shrink-0 text-xs font-mono text-surface-400">${rightContentHtml}</div>` : ''}
    </div>
  `;
}

/**
 * 3. Evidence Row
 * Renders verified evidence card with epistemic tagging, source attribution, and cryptographic audit link.
 */
export function renderEvidenceRow(item) {
  const evId = escapeHtml(item.id || '');
  const classification = escapeHtml(item.classification || 'FACT');
  const classBadge = classification === 'FACT' 
    ? 'bg-bone-100 text-background font-bold' 
    : (classification === 'CLAIM' ? 'bg-sand/15 text-sand border border-sand/30 font-semibold' : 'bg-crimson/15 text-crimson border border-crimson/30 font-semibold');

  return `
    <article class="p-5 sm:p-6 hover:bg-surface-900/40 transition-colors group cursor-pointer border-b border-surface-800 last:border-b-0" data-evidence-id="${evId}">
      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2">
        <div class="flex items-center gap-2.5 flex-wrap">
          <span class="text-[10px] font-mono uppercase px-2 py-0.5 ${classBadge}">${classification}</span>
          <span class="text-[10px] font-mono text-surface-400 uppercase tracking-wider">${escapeHtml(item.status || 'VERIFIED')}</span>
          <span class="text-xs font-mono text-crimson font-medium">${escapeHtml(item.event_date || item.published_at || '')}</span>
        </div>
        <div class="text-[10px] font-mono text-surface-500">
          SRC: <span class="text-surface-300">${escapeHtml(stripHtml(item.source_name || 'OFFICIAL RECORD'))}</span>
        </div>
      </div>

      <h3 class="font-sans font-semibold text-bone-100 text-base sm:text-lg leading-snug group-hover:text-crimson transition-colors mt-1">
        ${escapeHtml(stripHtml(item.headline || ''))}
      </h3>

      <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed mt-2 max-w-prose">
        ${escapeHtml(stripHtml(item.summary || ''))}
      </p>

      <div class="mt-4 pt-3 border-t border-surface-800/60 flex items-center justify-between text-[11px] font-mono text-surface-400">
        <div>
          ${item.metric_value ? `<span class="text-crimson font-mono font-bold">${escapeHtml(item.metric_value)} ${escapeHtml(item.metric_unit || '')}</span>` : ''}
        </div>
        <div class="text-crimson group-hover:underline flex items-center gap-1">
          <span>Inspect Provenance Slip</span>
          <span>↗</span>
        </div>
      </div>
    </article>
  `;
}

/**
 * 4. Timeline Event
 * Renders chronological event node with date badge, epistemic classification, description, and source citation.
 */
export function renderTimelineEvent(event) {
  const classification = escapeHtml(event.classification || 'FACT');
  const classBadge = classification === 'FACT' 
    ? 'bg-surface-900 text-bone-100 border-surface-800' 
    : (classification === 'CLAIM' ? 'bg-sand/10 text-sand border-sand/30' : 'bg-crimson/10 text-crimson border-crimson/30');

  return `
    <div class="relative pl-6 pb-6 border-l border-surface-800 last:border-l-0 last:pb-0">
      <span class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-crimson"></span>
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-mono text-crimson font-bold">${escapeHtml(event.date || event.year || '')}</span>
        <span class="text-[9px] font-mono px-1.5 py-0.2 border ${classBadge}">${classification}</span>
      </div>
      <h4 class="font-sans font-semibold text-bone-100 text-sm mt-1">${escapeHtml(stripHtml(event.title || ''))}</h4>
      <p class="text-xs text-surface-300 font-light mt-1 leading-relaxed">${escapeHtml(stripHtml(event.desc || ''))}</p>
      <div class="text-[10px] font-mono text-surface-500 mt-1.5">SRC: ${escapeHtml(stripHtml(event.source || 'OFFICIAL REPORT'))}</div>
    </div>
  `;
}

/**
 * 5. State Commitment Block & Verified Outcome (3-column Matrix)
 */
export function renderStateCommitmentBlock({
  authority = '',
  date = '',
  status = 'VERIFIED',
  whatSaid = '',
  whatDone = '',
  outcome = ''
}) {
  return `
    <div class="p-5 sm:p-6 bg-background-elevated border border-surface-800 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-800">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-meta text-surface-400">ACCOUNTABLE ENTITY</span>
          <div class="font-sans font-bold text-bone-100 text-base">${escapeHtml(authority)}</div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono text-surface-400">${escapeHtml(date)}</span>
          <span class="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">${escapeHtml(status)}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
        <div class="p-3 bg-surface-900/60 border border-surface-800 space-y-1">
          <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-semibold">WHAT WAS SAID / PROMISED</span>
          <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(whatSaid)}</p>
        </div>
        <div class="p-3 bg-surface-900/60 border border-surface-800 space-y-1">
          <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-semibold">WHAT WAS DONE</span>
          <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(whatDone)}</p>
        </div>
        <div class="p-3 bg-surface-900/60 border border-surface-800 space-y-1">
          <span class="text-[10px] font-mono text-crimson uppercase tracking-wider block font-semibold">WHAT IS KNOWN NOW</span>
          <p class="text-surface-200 font-medium leading-relaxed">${escapeHtml(outcome)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * 6. Promise / Action / Result / Status Card (Presidency & Governance Pattern)
 */
export function renderPromiseCard({
  title = '',
  theme = '',
  promise = '',
  action = '',
  result = '',
  status = 'UNRESOLVED', // FULFILLED | PARTIAL | UNRESOLVED | DISPUTED
  evidenceRef = ''
}) {
  const statusClasses = {
    'FULFILLED': 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50',
    'PARTIAL': 'bg-amber-950/40 text-amber-300 border-amber-800/50',
    'UNRESOLVED': 'bg-crimson/15 text-crimson border-crimson/40',
    'DISPUTED': 'bg-purple-950/40 text-purple-300 border-purple-800/50'
  };
  const badgeClass = statusClasses[status] || 'bg-surface-800 text-surface-300 border-surface-700';

  return `
    <div class="p-6 bg-background-elevated border border-surface-800 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-800">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-meta text-surface-400 block">${escapeHtml(theme)}</span>
          <h3 class="font-sans font-bold text-bone-100 text-base sm:text-lg">${escapeHtml(title)}</h3>
        </div>
        <div>
          <span class="text-[10px] font-mono uppercase px-2.5 py-1 border font-bold ${badgeClass}">
            STATUS: ${escapeHtml(status)}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
        <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-1.5">
          <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-bold">1. WHAT WAS PROMISED</span>
          <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(promise)}</p>
        </div>
        <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-1.5">
          <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-bold">2. WHAT ACTION WAS TAKEN</span>
          <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(action)}</p>
        </div>
        <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-1.5">
          <span class="text-[10px] font-mono text-crimson uppercase tracking-wider block font-bold">3. WHAT THE EVIDENCE SHOWS</span>
          <p class="text-surface-200 font-medium leading-relaxed">${escapeHtml(result)}</p>
        </div>
      </div>

      ${evidenceRef ? `
        <div class="pt-3 border-t border-surface-800/80 flex items-center justify-between text-[10px] font-mono text-surface-500">
          <span>EVIDENCE AUDIT REF: <span class="text-surface-300">${escapeHtml(evidenceRef)}</span></span>
          <span class="text-crimson font-medium">DOCUMENTED ↗</span>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * 7. Data Gap Block
 * Highlights unmonitored metrics, government secrecy, or withheld official surveillance data.
 */
export function renderDataGapBlock({
  title = 'Documented Data Gap',
  description = '',
  sourcePeriod = 'SUMMER 2026'
}) {
  return `
    <div class="p-5 sm:p-6 bg-surface-900/40 border border-surface-800 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-sand"></span>
          <span class="text-[10px] font-mono uppercase tracking-widest text-sand font-bold">${escapeHtml(title)}</span>
        </div>
        <span class="text-[9px] font-mono text-surface-500 uppercase">${escapeHtml(sourcePeriod)}</span>
      </div>
      <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed">
        ${escapeHtml(description)}
      </p>
    </div>
  `;
}

/**
 * 8. Attributed Quote / Statement
 * Authoritative editorial pull quote with attribution, context, and epistemic classification.
 */
export function renderAttributedQuote({
  quote = '',
  speaker = '',
  role = '',
  date = '',
  source = '',
  classification = 'CLAIM'
}) {
  return `
    <blockquote class="p-6 bg-surface-900/60 border-l-2 border-crimson my-6 space-y-3">
      <p class="font-editorial text-lg sm:text-xl text-bone-100 font-normal italic leading-relaxed">
        "${escapeHtml(quote)}"
      </p>
      <footer class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-surface-800 text-xs font-mono text-surface-400">
        <div>
          <strong class="text-sand font-semibold">${escapeHtml(speaker)}</strong>
          ${role ? `<span> — ${escapeHtml(role)}</span>` : ''}
        </div>
        <div class="flex items-center gap-2 text-[10px] text-surface-500">
          <span>${escapeHtml(date)}</span>
          ${source ? `<span>(SRC: ${escapeHtml(source)})</span>` : ''}
          <span class="px-1.5 py-0.2 bg-surface-800 text-surface-400 border border-surface-700 uppercase">${escapeHtml(classification)}</span>
        </div>
      </footer>
    </blockquote>
  `;
}

/**
 * 9. Key Statistic Card
 */
export function renderKeyStat({
  label = '',
  value = '',
  subtext = '',
  source = '',
  status = '',
  highlight = false
}) {
  return `
    <div class="p-5 bg-background-elevated border border-surface-800 group hover:border-surface-600 transition-colors">
      <div class="flex items-center justify-between text-[10px] font-mono">
        <span class="text-surface-400 uppercase tracking-meta">${escapeHtml(label)}</span>
        ${status ? `<span class="px-1.5 py-0.5 bg-surface-900 border border-surface-800 ${highlight ? 'text-crimson' : 'text-sand'} font-bold">${escapeHtml(status)}</span>` : ''}
      </div>
      <div class="text-2xl sm:text-3xl font-editorial font-bold my-2 ${highlight ? 'text-crimson' : 'text-bone-100'} group-hover:text-white transition-colors">
        ${escapeHtml(value)}
      </div>
      ${subtext ? `<div class="text-xs text-surface-300 font-light leading-relaxed">${escapeHtml(subtext)}</div>` : ''}
      ${source ? `
        <div class="mt-3 pt-2 border-t border-surface-800/80 text-[10px] font-mono text-surface-500">
          SOURCE: ${escapeHtml(source)}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * 10. Historical Comparison (2019 vs 2026)
 * Neutral, factual comparison matrix for economic and governance indicators.
 */
export function renderHistoricalComparison({
  indicator = '',
  baseline2019 = '',
  current2026 = '',
  change = '',
  source = '',
  interpretation = '',
  unit = ''
}) {
  return `
    <div class="p-5 bg-background-elevated border border-surface-800 space-y-3">
      <div class="flex items-center justify-between border-b border-surface-800 pb-2">
        <span class="font-sans font-bold text-bone-100 text-sm">${escapeHtml(indicator)}</span>
        ${unit ? `<span class="text-[10px] font-mono text-surface-400 uppercase">${escapeHtml(unit)}</span>` : ''}
      </div>
      <div class="grid grid-cols-3 gap-2 text-center py-1">
        <div class="p-2 bg-surface-900/60 border border-surface-800">
          <span class="text-[9px] font-mono uppercase text-surface-400 block">2019 BASELINE</span>
          <span class="text-sm font-mono text-bone-100 font-bold mt-0.5 block">${escapeHtml(baseline2019)}</span>
        </div>
        <div class="p-2 bg-surface-900/60 border border-surface-800">
          <span class="text-[9px] font-mono uppercase text-surface-400 block">2026 STATUS</span>
          <span class="text-sm font-mono text-bone-100 font-bold mt-0.5 block">${escapeHtml(current2026)}</span>
        </div>
        <div class="p-2 bg-surface-900/60 border border-surface-800">
          <span class="text-[9px] font-mono uppercase text-surface-400 block">CHANGE</span>
          <span class="text-sm font-mono text-sand font-bold mt-0.5 block">${escapeHtml(change)}</span>
        </div>
      </div>
      <p class="text-xs text-surface-300 font-light leading-relaxed pt-1">
        ${escapeHtml(interpretation)}
      </p>
      <div class="pt-2 border-t border-surface-800 text-[10px] font-mono text-surface-500">
        SOURCE: ${escapeHtml(source)}
      </div>
    </div>
  `;
}

/**
 * 11. Poll / Survey Result Block
 * Fully attributed survey presentation with fieldwork dates, sample size, margin of error, and question wording.
 */
export function renderPollResult({
  organization = 'Arab Barometer',
  fieldwork = '2024',
  sampleSize = 'n=2,400',
  methodology = 'Nationally representative face-to-face probability sampling',
  question = '',
  results = [] // [{ label: '', percentage: 43, color: 'sand' | 'red' }]
}) {
  const barsHtml = results.map(r => {
    const isRed = r.color === 'red' || r.highlight;
    return `
      <div class="space-y-1">
        <div class="flex items-center justify-between text-xs font-mono">
          <span class="text-surface-300">${escapeHtml(r.label)}</span>
          <span class="font-bold ${isRed ? 'text-crimson' : 'text-bone-100'}">${escapeHtml(String(r.percentage))}%</span>
        </div>
        <div class="poll-bar-track">
          <div class="${isRed ? 'poll-bar-fill-red' : 'poll-bar-fill'}" style="width: ${Math.min(100, Math.max(0, r.percentage))}%;"></div>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="p-6 bg-background-elevated border border-surface-800 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-surface-800">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-meta text-surface-400">SURVEY EVIDENCE</span>
          <div class="font-sans font-bold text-bone-100 text-sm sm:text-base">${escapeHtml(organization)} · ${escapeHtml(fieldwork)}</div>
        </div>
        <div class="text-[10px] font-mono text-surface-400">
          ${escapeHtml(sampleSize)} · ±2.5% MoE
        </div>
      </div>

      ${question ? `
        <div class="p-3 bg-surface-900/60 border border-surface-800 text-xs font-sans text-surface-300 italic">
          "${escapeHtml(question)}"
        </div>
      ` : ''}

      <div class="space-y-3 pt-1">
        ${barsHtml}
      </div>

      <div class="pt-3 border-t border-surface-800 text-[10px] font-mono text-surface-500">
        METHODOLOGY: ${escapeHtml(methodology)}
      </div>
    </div>
  `;
}

/**
 * 12. Sovereign Rating Change History
 */
export function renderRatingChange({
  agency = "Moody's",
  currentRating = "Caa2",
  outlook = "Stable",
  date = "2023–2026",
  previousRating = "Caa1",
  rationale = ""
}) {
  return `
    <div class="p-4 bg-background-elevated border border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="font-sans font-bold text-bone-100 text-sm">${escapeHtml(agency)}</span>
          <span class="text-[10px] font-mono uppercase px-2 py-0.5 bg-surface-900 border border-surface-800 text-surface-400">${escapeHtml(date)}</span>
        </div>
        ${rationale ? `<p class="text-xs text-surface-300 font-light max-w-xl">${escapeHtml(rationale)}</p>` : ''}
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <div class="text-right">
          <span class="text-[9px] font-mono text-surface-500 uppercase block">PREV: ${escapeHtml(previousRating)}</span>
          <span class="text-xs font-mono text-sand">${escapeHtml(outlook)}</span>
        </div>
        <div class="text-2xl font-mono font-bold text-crimson px-3 py-1 bg-surface-900 border border-surface-800">
          ${escapeHtml(currentRating)}
        </div>
      </div>
    </div>
  `;
}

/**
 * 13. International Relationship Event Block
 */
export function renderInternationalEvent({
  partner = '',
  date = '',
  category = 'AGREEMENT', // AGREEMENT | FINANCING | DISPUTE | RATINGS
  headline = '',
  summary = '',
  evidenceStatus = 'VERIFIED'
}) {
  return `
    <div class="p-5 bg-background-elevated border border-surface-800 space-y-3">
      <div class="flex items-center justify-between text-xs font-mono pb-2 border-b border-surface-800">
        <div class="flex items-center gap-2">
          <span class="text-sand font-bold uppercase">${escapeHtml(partner)}</span>
          <span class="text-surface-500">·</span>
          <span class="text-surface-400">${escapeHtml(date)}</span>
        </div>
        <span class="text-[9px] font-mono px-2 py-0.5 bg-surface-900 border border-surface-800 uppercase text-crimson font-semibold">${escapeHtml(category)}</span>
      </div>
      <h4 class="font-sans font-semibold text-bone-100 text-sm sm:text-base">${escapeHtml(headline)}</h4>
      <p class="text-xs text-surface-300 font-light leading-relaxed">${escapeHtml(summary)}</p>
      <div class="pt-2 border-t border-surface-800/80 flex items-center justify-between text-[10px] font-mono text-surface-500">
        <span>STATUS: ${escapeHtml(evidenceStatus)}</span>
        <span class="text-sand">TUNISIA &amp; THE WORLD ↗</span>
      </div>
    </div>
  `;
}

/**
 * 14. Accountability 6-Question Grammar Block
 * Recurring 404TN framework:
 * WHO WAS RESPONSIBLE? / WHAT WAS PROMISED? / WHAT ACTION WAS ANNOUNCED? / WHAT HAPPENED? / WHAT IS VERIFIED? / WHAT REMAINS UNKNOWN?
 */
export function renderAccountabilityQuestionBlock({
  topic = '',
  authority = '',
  promised = '',
  announcedAction = '',
  whatHappened = '',
  verifiedFact = '',
  unresolved = ''
}) {
  return `
    <div class="p-6 sm:p-8 bg-background-elevated border border-surface-800 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-surface-800">
        <div>
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-semibold block">404TN ACCOUNTABILITY GRAMMAR</span>
          <h3 class="font-editorial text-2xl text-bone-100 mt-1">${escapeHtml(topic)}</h3>
        </div>
        <div class="text-xs font-mono text-surface-400">
          RESPONSIBLE: <span class="text-bone-100 font-semibold">${escapeHtml(authority)}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
        <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-1">
          <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-bold">1. WHAT WAS PROMISED?</span>
          <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(promised)}</p>
        </div>

        <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-1">
          <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-bold">2. WHAT ACTION WAS ANNOUNCED?</span>
          <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(announcedAction)}</p>
        </div>

        <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-1">
          <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-bold">3. WHAT HAPPENED?</span>
          <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(whatHappened)}</p>
        </div>

        <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-1">
          <span class="text-[10px] font-mono text-bone-100 uppercase tracking-wider block font-bold">4. WHO WAS RESPONSIBLE?</span>
          <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(authority)}</p>
        </div>

        <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-1">
          <span class="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">5. WHAT IS VERIFIED?</span>
          <p class="text-surface-200 font-medium leading-relaxed">${escapeHtml(verifiedFact)}</p>
        </div>

        <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-1">
          <span class="text-[10px] font-mono text-crimson uppercase tracking-wider block font-bold">6. WHAT REMAINS UNKNOWN?</span>
          <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(unresolved)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * 15. Footnote & Methodology Note
 */
export function renderSourceFootnote({
  id = 'fn-1',
  text = '',
  source = '',
  url = ''
}) {
  return `
    <div id="${escapeHtml(id)}" class="p-4 bg-surface-900/30 border border-surface-800/80 text-[11px] font-mono text-surface-400 space-y-1">
      <div class="flex items-center justify-between text-surface-500">
        <span>NOTE / SOURCE PROVENANCE</span>
        ${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-sand hover:underline">Primary Link ↗</a>` : ''}
      </div>
      <p class="text-surface-300 font-light">${escapeHtml(text)}</p>
      ${source ? `<div class="text-surface-500">SRC: ${escapeHtml(source)}</div>` : ''}
    </div>
  `;
}
