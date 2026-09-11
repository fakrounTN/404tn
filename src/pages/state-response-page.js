// src/pages/state-response-page.js
// 404TN — State Response & Institutional Accountability Matrix (Route: /state-response)

import { escapeHtml } from '../utils.js';
import {
  investigationHero,
  sectionKicker,
  sectionHeading,
  classificationBadge,
  stateResponseBlock,
  renderAccountabilityQuestionBlock
} from '../editorial-components.js';

export function renderStateResponseHtml() {
  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt; 
      <span class="text-bone-100 font-medium">State Response Matrix</span>
    </nav>
  `;

  const heroHtml = investigationHero({
    breadcrumbHtml,
    eyebrow: "INSTITUTIONAL ACCOUNTABILITY",
    badge: "STATE RESPONSE MATRIX",
    badgeClass: "bg-crimson/15 border-crimson/40 text-crimson font-bold",
    h1: "What Did the State Do?",
    deck: "Auditing official announcements, ministerial directives, presidential crisis responses, and verified implementations across Tunisia.",
    metadataItems: [
      { label: "MONITORED MINISTRIES", value: "12 INSTITUTIONS", highlight: true, subtext: "EXECUTIVE BRANCH" },
      { label: "COMMITMENTS AUDITED", value: "24 STATEMENTS", highlight: false, subtext: "SUMMER 2026 BENCHMARK" },
      { label: "EPISTEMIC RULE", value: "FACT VS CLAIM", highlight: false, subtext: "STRICT DISCIPLINE" },
      { label: "GOVERNANCE MODEL", value: "2022 CONSTITUTION", highlight: false, subtext: "DIRECT RESPONSIBILITY" }
    ]
  });

  const commitments = [
    {
      authority: "Ministry of Agriculture / SONEDE",
      date: "2026-06-05",
      status: "PARTIAL IMPLEMENTATION",
      whatSaid: "Pledged emergency groundwater drilling and non-interruption of potable supply during daylight hours.",
      whatDone: "Night-time rationing schedules formally enacted; deep well connections delayed in central governorates due to procurement friction.",
      outcome: "Dam reserves remained depressed at 21.4%; unannounced daytime pressure drops recorded across Sfax and Sousse."
    },
    {
      authority: "Société Tunisienne de l'Electricité et du Gaz (STEG)",
      date: "2026-07-02",
      status: "OPERATIONAL STRESS",
      whatSaid: "Announced full mobilization of combined-cycle power turbines to meet summer peak demand without scheduled residential outages.",
      whatDone: "Operated turbines at maximum continuous rating; executed targeted 45-minute load shedding during 4,825 MW peak demand windows.",
      outcome: "Prevented total grid collapse, but regional industrial units were instructed to reduce thermal loads during afternoon peaks."
    },
    {
      authority: "Groupe Chimique Tunisien (GCT) / Ministry of Industry",
      date: "2017–2026",
      status: "UNEXECUTED STATUTORY DECREE",
      whatSaid: "2017 Cabinet Communiqué approved dismantling and relocation of Chatt Essalam phosphoric acid units away from residential zones.",
      whatDone: "Zero units dismantled or relocated by Summer 2026; preliminary studies repeatedly commissioned without capital expenditure execution.",
      outcome: "Phosphogypsum marine discharge into the Gulf of Gabès continues daily; ambient sulfur dioxide monitoring data remains unpublished."
    },
    {
      authority: "National Penal Reconciliation Commission / Carthage Palace",
      date: "2022–2026",
      status: "TARGET DEFICIT (<5% RECOVERED)",
      whatSaid: "Presidential pledge to recover 13.5 billion TND from 460 businessmen to finance infrastructure in impoverished delegations.",
      whatDone: "Decree-Law 2022-13 promulgated; commission leadership replaced multiple times by presidential decree.",
      outcome: "Official treasury receipts from penal reconciliation remained below 500 million TND (<5% of target) by mid-2026."
    }
  ];

  return `
    <article class="state-response-page">
      
      <!-- A. STATE RESPONSE OPENER (DARK INVESTIGATIVE CHASSIS) -->
      <div class="bg-background text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          ${heroHtml}
        </div>
      </div>

      <!-- B. ACCOUNTABILITY LEDGER (WARM ARCHIVAL PAPER SURFACE) -->
      <div class="surface-paper py-10 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

          <!-- 6-QUESTION ACCOUNTABILITY GRAMMAR (DOCUMENTARY DOSSIER) -->
          <section class="p-6 sm:p-8 bg-white border border-paper shadow-sm space-y-6" aria-label="Accountability Grammar">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-paper">
              <div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-0.5 bg-paper-red inline-block"></span>
                  <span class="text-xs font-mono uppercase tracking-widest text-paper-crimson font-bold block">404TN ACCOUNTABILITY GRAMMAR</span>
                </div>
                <h2 class="font-editorial text-2xl sm:text-3xl text-paper-primary mt-1 font-normal">State Response Audit: The Concentration of Executive Authority</h2>
              </div>
              <div class="text-xs font-mono text-paper-dim">
                RESPONSIBLE: <span class="text-paper-primary font-bold">Presidency of the Republic &amp; Cabinet Ministries</span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
              <div class="p-4 bg-paper-subtle/60 border border-paper space-y-1.5">
                <span class="text-[10px] font-mono text-paper-dim uppercase tracking-wider block font-bold">1. WHAT WAS PROMISED?</span>
                <p class="text-paper-muted font-light leading-relaxed">Elimination of speculative hoarding, efficient direct management of public utilities, and rapid economic sovereignty.</p>
              </div>

              <div class="p-4 bg-paper-subtle/60 border border-paper space-y-1.5">
                <span class="text-[10px] font-mono text-paper-dim uppercase tracking-wider block font-bold">2. WHAT ACTION WAS ANNOUNCED?</span>
                <p class="text-paper-muted font-light leading-relaxed">Emergency decrees, direct presidential visits to utility headquarters (SONEDE/STEG), and restructuring of state commissions.</p>
              </div>

              <div class="p-4 bg-paper-subtle/60 border border-paper space-y-1.5">
                <span class="text-[10px] font-mono text-paper-dim uppercase tracking-wider block font-bold">3. WHAT HAPPENED?</span>
                <p class="text-paper-muted font-light leading-relaxed">Utility infrastructure remained structurally aged and under-financed; operational rationing expanded during peak summer heat.</p>
              </div>

              <div class="p-4 bg-paper-subtle/60 border border-paper space-y-1.5">
                <span class="text-[10px] font-mono text-paper-primary uppercase tracking-wider block font-bold">4. WHO WAS RESPONSIBLE?</span>
                <p class="text-paper-muted font-light leading-relaxed">Presidency of the Republic &amp; Cabinet Ministries</p>
              </div>

              <div class="p-4 bg-paper-subtle/60 border border-paper space-y-1.5">
                <span class="text-[10px] font-mono text-paper-crimson uppercase tracking-wider block font-bold">5. WHAT IS VERIFIED?</span>
                <p class="text-paper-primary font-medium leading-relaxed">Under the 2022 Constitution, all executive directives and administrative appointments are formally concentrated in the presidency.</p>
              </div>

              <div class="p-4 bg-paper-subtle/60 border border-paper space-y-1.5">
                <span class="text-[10px] font-mono text-amber-700 uppercase tracking-wider block font-bold">6. WHAT REMAINS UNKNOWN?</span>
                <p class="text-paper-muted font-light leading-relaxed">Internal ministerial logs explaining delays in executing the 2017 Gabès relocation decision and itemized treasury ledgers for penal settlements.</p>
              </div>
            </div>
          </section>

          <!-- COMMITMENTS AUDIT LEDGER -->
          <section class="space-y-6" aria-label="Commitments Register">
            <div class="space-y-1 pb-4 border-b border-paper">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-0.5 bg-paper-red inline-block"></span>
                <span class="text-xs font-mono uppercase tracking-widest text-paper-crimson font-bold">SYSTEMIC COMMITMENT AUDIT</span>
              </div>
              <h2 class="font-editorial text-2xl sm:text-3xl text-paper-primary font-normal">Documented Commitments vs Verified Implementations</h2>
              <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-2xl">
                Evaluating announced government solutions against independently verifiable on-the-ground outcomes.
              </p>
            </div>

            <!-- STRUCTURED DOCUMENTARY LEDGER ROWS -->
            <div class="space-y-6">
              ${commitments.map(c => `
                <div class="p-6 bg-white border border-paper shadow-sm space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-paper">
                    <div>
                      <span class="text-[10px] font-mono uppercase tracking-meta text-paper-dim font-bold">ACCOUNTABLE ENTITY</span>
                      <div class="font-editorial font-bold text-paper-primary text-lg sm:text-xl">${escapeHtml(c.authority)}</div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-mono text-paper-dim">${escapeHtml(c.date)}</span>
                      <span class="stamp-badge stamp-paper-crimson font-bold">${escapeHtml(c.status)}</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                    <div class="p-3.5 bg-paper-subtle/50 border border-paper space-y-1">
                      <span class="text-[10px] font-mono text-paper-muted uppercase tracking-wider block font-bold">1. WHAT WAS SAID / PROMISED</span>
                      <p class="text-paper-muted font-light leading-relaxed">${escapeHtml(c.whatSaid)}</p>
                    </div>
                    <div class="p-3.5 bg-paper-subtle/50 border border-paper space-y-1">
                      <span class="text-[10px] font-mono text-paper-muted uppercase tracking-wider block font-bold">2. WHAT WAS DONE</span>
                      <p class="text-paper-muted font-light leading-relaxed">${escapeHtml(c.whatDone)}</p>
                    </div>
                    <div class="p-3.5 bg-paper-subtle/50 border border-paper space-y-1">
                      <span class="text-[10px] font-mono text-paper-crimson uppercase tracking-wider block font-bold">3. WHAT IS KNOWN NOW</span>
                      <p class="text-paper-primary font-medium leading-relaxed">${escapeHtml(c.outcome)}</p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- NAVIGATION FOOTER -->
          <div class="pt-8 border-t border-paper flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <a href="/timeline" class="text-paper-muted hover:text-paper-primary hover:underline">← Summer 2026 Chronology</a>
            <a href="/evidence" class="text-paper-crimson hover:underline font-bold">Inspect Evidence Register →</a>
          </div>

        </div>
      </div>

    </article>
  `;
}
