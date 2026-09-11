// src/pages/statement-page.js
// 404TN — Editorial Mission, Accountability Mandate & Public Statement (Route: /statement)

import { escapeHtml } from '../utils.js';
import {
  investigationHero,
  sectionKicker,
  sectionHeading,
  editorialRule
} from '../editorial-components.js';

export function renderStatementHtml() {
  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt; 
      <span class="text-bone-100 font-medium">Mission &amp; Statement</span>
    </nav>
  `;

  const heroHtml = investigationHero({
    breadcrumbHtml,
    eyebrow: "EDITORIAL MANDATE",
    badge: "PUBLIC STATEMENT",
    badgeClass: "bg-crimson/15 border-crimson/40 text-crimson font-bold",
    h1: "Mission & Editorial Statement",
    deck: "404TN is an independent Tunisian political opposition, investigative, and accountability project dedicated to documenting the exercise and concentration of state power.",
    metadataItems: [
      { label: "FOUNDING PRINCIPLE", value: "EVIDENCE FIRST", highlight: true, subtext: "ACCOUNTABILITY JOURNALISM" },
      { label: "EDITORIAL POSITION", value: "INDEPENDENT OPPOSITION", highlight: false, subtext: "CRITICAL OF HYPER-PRESIDENCY" },
      { label: "EVIDENTIARY THRESHOLD", value: "UNCOMPROMISED", highlight: false, subtext: "SAME STANDARD FOR ALL" },
      { label: "PUBLIC ARCHIVE", value: "OPEN ACCESS", highlight: false, subtext: "FREE REPRODUCIBILITY" }
    ]
  });

  return `
    <article class="statement-editorial-page py-10 sm:py-16 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- HERO -->
      ${heroHtml}

      <!-- CORE THESIS & INDEPENDENCE -->
      <section class="max-w-4xl space-y-8 font-sans" aria-label="Editorial Principles">
        
        <div class="space-y-4">
          <h2 class="font-editorial text-3xl sm:text-4xl text-bone-100">
            Why 404TN Exists
          </h2>
          <p class="text-base sm:text-lg text-surface-300 font-light leading-relaxed">
            Since July 25, 2021, political power in Tunisia has become increasingly concentrated in the hands of the presidency. Constitutional counter-powers have been eliminated, elected judicial bodies dissolved, independent regulatory authorities subordinated, and critical public commentary criminalized under Decree-Law 54.
          </p>
          <p class="text-base sm:text-lg text-surface-300 font-light leading-relaxed">
            When institutional transparency collapses, state failures are attributed to external conspiracies, and public records become inaccessible, rigorous documentary journalism becomes a civic necessity.
          </p>
        </div>

        <div class="p-6 bg-background-elevated border-l-2 border-crimson space-y-3 font-mono text-xs">
          <span class="text-crimson font-bold uppercase tracking-meta">OUR EDITORIAL MANDATE</span>
          <p class="text-bone-100 font-sans text-sm sm:text-base leading-relaxed">
            "404TN is critical of the concentration and exercise of political power in Tunisia. Our political opposition is clear and disclosed. However, our political position does NOT lower our evidentiary threshold. We apply the exact same verification standard to government statements and opposition claims alike."
          </p>
        </div>

        <!-- CORE COMMITMENTS -->
        <div class="space-y-6 pt-4">
          <h3 class="font-editorial text-2xl text-bone-100">Our Four Evidentiary Commitments</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div class="p-5 bg-background-elevated border border-surface-800 space-y-2">
              <span class="text-sand font-mono font-bold block">1. NO FACT WITHOUT EVIDENCE</span>
              <p class="text-surface-300 font-light leading-relaxed">We do not publish factual assertions without traceable primary documentation, gazette records, or verified empirical data.</p>
            </div>
            <div class="p-5 bg-background-elevated border border-surface-800 space-y-2">
              <span class="text-sand font-mono font-bold block">2. MANDATORY ATTRIBUTION</span>
              <p class="text-surface-300 font-light leading-relaxed">Government declarations, police charges, and opposition allegations are preserved as attributed claims, never presented as settled facts.</p>
            </div>
            <div class="p-5 bg-background-elevated border border-surface-800 space-y-2">
              <span class="text-sand font-mono font-bold block">3. TRANSPARENT UNCERTAINTY</span>
              <p class="text-surface-300 font-light leading-relaxed">Where continuously published datasets cannot be identified or remain unpublished by state entities, we formally document the omission as a data gap rather than speculating.</p>
            </div>
            <div class="p-5 bg-background-elevated border border-surface-800 space-y-2">
              <span class="text-sand font-mono font-bold block">4. PROVENANCE INTEGRITY</span>
              <p class="text-surface-300 font-light leading-relaxed">Every metric displays its reference period, observation type (e.g. preliminary vs annual actual), and institutional source.</p>
            </div>
          </div>
        </div>

      </section>

      <!-- NAVIGATION FOOTER -->
      <div class="pt-8 border-t border-surface-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <a href="/methodology" class="text-sand hover:underline">← Verification Methodology</a>
        <a href="/presidency" class="text-crimson hover:underline font-bold">Inspect The Record of Power (2019–2026) →</a>
      </div>

    </article>
  `;
}
