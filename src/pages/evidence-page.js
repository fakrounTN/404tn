// src/pages/evidence-page.js
// 404TN — Research Archive & Evidence Register (Route: /evidence)

import { escapeHtml } from '../utils.js';
import {
  investigationHero,
  sectionKicker,
  sectionHeading,
  classificationBadge,
  renderEvidenceRow
} from '../editorial-components.js';

export function renderEvidenceHtml() {
  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt; 
      <span class="text-bone-100 font-medium">Evidence Register</span>
    </nav>
  `;

  const heroHtml = investigationHero({
    breadcrumbHtml,
    eyebrow: "RESEARCH ARCHIVE",
    badge: "EVIDENCE REGISTER · 105 RECORDS",
    badgeClass: "bg-surface-900 border-surface-700 text-bone-100 font-bold",
    h1: "Primary Evidence Register",
    deck: "Authoritative index of audited primary sources, statistical bulletins, gazette decrees, and field testimonies establishing the 404TN baseline.",
    metadataItems: [
      { label: "INDEXED RECORDS", value: "105 ENTRIES", highlight: true, subtext: "PRIMARY & SECONDARY" },
      { label: "CONFIDENCE SCORE", value: "0.95 HIGH TRUST", highlight: false, subtext: "TRIPARTITE VERIFIED" },
      { label: "MONITORED SOURCES", value: "27 REGISTRIES", highlight: false, subtext: "OFFICIAL & INDEPENDENT" },
      { label: "EPISTEMIC STANDARD", value: "FACT / CLAIM / ANALYSIS", highlight: false, subtext: "EXPLICIT ATTRIBUTION" }
    ]
  });

  const evidenceList = [
    {
      id: "EV-AUTO-20260910-699F41",
      headline: "Tunisia Banking & Monetary Indicator: BNA Bank Reports H1 Net Income Surge",
      summary: "Official regulatory filings confirm domestic commercial banking profits expanded while sovereign credit spreads remained elevated.",
      classification: "FACT",
      status: "AUTO_ACCEPTED",
      event_date: "2026-08-20",
      source_name: "African Manager / BNA Regulatory Financial Statements",
      metric_value: "156 Million TND",
      metric_unit: "H1 Profit"
    },
    {
      id: "EV-AUTO-20260910-E268A4",
      headline: "Agricultural Export Deficit: National Olive Oil Yield Projected to Decline",
      summary: "Severe drought in central and southern olive groves projected to reduce olive oil export revenue, straining the agrifood foreign currency balance.",
      classification: "FACT",
      status: "AUTO_ACCEPTED",
      event_date: "2026-08-14",
      source_name: "Ministry of Agriculture / ONAGRI Quarterly Assessment",
      metric_value: "-28.5%",
      metric_unit: "Projected Volume Change"
    },
    {
      id: "EV-AUTO-20260910-C14970",
      headline: "National Agrifood Balance Surplus Recorded at End-July 2026",
      summary: "Export earnings from dates and processed citrus generated temporary trade surplus, offsetting grain import subsidies.",
      classification: "FACT",
      status: "AUTO_ACCEPTED",
      event_date: "2026-08-10",
      source_name: "National Observatory of Agriculture (ONAGRI)",
      metric_value: "+1,607.7M TND",
      metric_unit: "Agrifood Trade Surplus"
    },
    {
      id: "EV-AUTO-20260910-61D4D8",
      headline: "SNJT Freedom of Press Appeal on Journalist Prosecutions",
      summary: "National journalists' syndicate formally calls for the cessation of judicial harassment of reporters prosecuted under Decree-Law 54 Article 24.",
      classification: "CLAIM",
      status: "AUTO_ACCEPTED",
      event_date: "2026-08-04",
      source_name: "Syndicat National des Journalistes Tunisiens (SNJT)",
      metric_value: "Article 24",
      metric_unit: "Statutory Instrument"
    }
  ];

  return `
    <article class="evidence-register-page">
      
      <!-- A. EVIDENCE ARCHIVE OPENER (DARK CHASSIS) -->
      <div class="bg-background text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          ${heroHtml}
        </div>
      </div>

      <!-- B. EVIDENCE REGISTER DESK (WARM ARCHIVAL PAPER SURFACE) -->
      <div class="surface-paper py-10 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <!-- FILTER & REPOSITORY HEADER -->
          <section class="space-y-6" aria-label="Evidence Register Table">
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-paper">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-0.5 bg-paper-red inline-block"></span>
                  <span class="text-xs font-mono uppercase tracking-widest text-paper-crimson font-bold">VERIFIED REPOSITORY</span>
                </div>
                <h2 class="font-editorial text-2xl sm:text-3xl text-paper-primary font-normal">Audited Evidence Stream</h2>
                <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed">
                  Click any row to inspect complete provenance metadata, verification audit slips, and direct gazette links.
                </p>
              </div>
              <div class="flex items-center gap-2 font-mono text-xs">
                <span class="text-paper-dim">FILTER:</span>
                <span class="px-3 py-1 bg-paper-primary text-paper-bg-base border border-paper-primary font-bold">ALL</span>
                <span class="px-3 py-1 bg-white border border-paper text-paper-muted">FACT</span>
                <span class="px-3 py-1 bg-white border border-paper text-paper-muted">CLAIM</span>
              </div>
            </div>

            <!-- STRUCTURED ARCHIVAL EVIDENCE REGISTER (ZERO CARD WALLS) -->
            <div class="divide-y divide-paper border-y border-paper bg-white shadow-sm font-sans">
              ${evidenceList.map(item => `
                <article class="p-5 sm:p-6 hover:bg-paper-subtle/50 transition-colors group cursor-pointer" data-evidence-id="${escapeHtml(item.id)}">
                  <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2">
                    <div class="flex items-center gap-2.5 flex-wrap">
                      ${classificationBadge(item.classification, true)}
                      <span class="text-[10px] font-mono text-paper-dim uppercase tracking-wider">${escapeHtml(item.status)}</span>
                      <span class="text-xs font-mono text-paper-crimson font-bold">${escapeHtml(item.event_date)}</span>
                    </div>
                    <div class="text-[10px] font-mono text-paper-dim">
                      ID: <span class="text-paper-muted font-bold">${escapeHtml(item.id)}</span>
                    </div>
                  </div>

                  <h3 class="font-editorial font-bold text-paper-primary text-base sm:text-lg leading-snug group-hover:text-paper-crimson transition-colors mt-1">
                    ${escapeHtml(item.headline)}
                  </h3>

                  <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed mt-2 max-w-4xl">
                    ${escapeHtml(item.summary)}
                  </p>

                  <div class="mt-4 pt-3 border-t border-paper/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-paper-dim">
                    <div>
                      SRC: <span class="text-paper-primary font-medium">${escapeHtml(item.source_name)}</span>
                      ${item.metric_value ? ` · <span class="text-paper-crimson font-bold">${escapeHtml(item.metric_value)} (${escapeHtml(item.metric_unit)})</span>` : ''}
                    </div>
                    <div class="text-paper-crimson group-hover:underline flex items-center gap-1 font-bold">
                      <span>Inspect Provenance Slip</span>
                      <span>↗</span>
                    </div>
                  </div>
                </article>
              `).join('')}
            </div>
          </section>

          <!-- NAVIGATION FOOTER -->
          <div class="pt-8 border-t border-paper flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <a href="/state-response" class="text-paper-muted hover:text-paper-primary hover:underline">← State Response Matrix</a>
            <a href="/methodology" class="text-paper-crimson hover:underline font-bold">Read Verification Methodology →</a>
          </div>

        </div>
      </div>

    </article>
  `;
}
