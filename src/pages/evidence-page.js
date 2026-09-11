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
    <article class="evidence-register-page py-10 sm:py-16 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- HERO -->
      ${heroHtml}

      <!-- FILTER & METHODOLOGY CALLOUT -->
      <section class="space-y-6" aria-label="Evidence Register Table">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-surface-800">
          <div class="space-y-1">
            ${sectionKicker('VERIFIED REPOSITORY')}
            ${sectionHeading('Audited Evidence Stream', 'Click any row to inspect complete provenance metadata, verification audit slips, and direct gazette links.')}
          </div>
          <div class="flex items-center gap-2 font-mono text-xs">
            <span class="text-surface-400">FILTER:</span>
            <span class="px-2.5 py-1 bg-surface-800 text-bone-100 border border-crimson font-bold">ALL</span>
            <span class="px-2.5 py-1 bg-surface-900 border border-surface-800 text-surface-400">FACT</span>
            <span class="px-2.5 py-1 bg-surface-900 border border-surface-800 text-surface-400">CLAIM</span>
          </div>
        </div>

        <!-- EVIDENCE ROWS -->
        <div class="divide-y divide-surface-800 border-y border-surface-800 bg-background-elevated">
          ${evidenceList.map(item => renderEvidenceRow(item)).join('')}
        </div>
      </section>

      <!-- NAVIGATION FOOTER -->
      <div class="pt-8 border-t border-surface-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <a href="/state-response" class="text-sand hover:underline">← State Response Matrix</a>
        <a href="/methodology" class="text-crimson hover:underline font-bold">Read Verification Methodology →</a>
      </div>

    </article>
  `;
}
