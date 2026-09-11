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
    <article class="state-response-page py-10 sm:py-16 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- HERO -->
      ${heroHtml}

      <!-- 6-QUESTION ACCOUNTABILITY GRAMMAR -->
      ${renderAccountabilityQuestionBlock({
        topic: "State Response Audit: The Concentration of Executive Authority",
        authority: "Presidency of the Republic & Cabinet Ministries",
        promised: "Elimination of speculative hoarding, efficient direct management of public utilities, and rapid economic sovereignty.",
        announcedAction: "Emergency decrees, direct presidential visits to utility headquarters (SONEDE/STEG), and restructuring of state commissions.",
        whatHappened: "Utility infrastructure remained structurally aged and under-financed; operational rationing expanded during peak summer heat.",
        verifiedFact: "Under the 2022 Constitution, all executive directives and administrative appointments are formally concentrated in the presidency.",
        unresolved: "Internal ministerial logs explaining delays in executing the 2017 Gabès relocation decision and itemized treasury ledgers for penal settlements."
      })}

      <!-- COMMITMENTS AUDIT LIST -->
      <section class="space-y-6" aria-label="Commitments Register">
        <div class="space-y-1 pb-4 border-b border-surface-800">
          ${sectionKicker('SYSTEMIC COMMITMENT AUDIT')}
          ${sectionHeading('Documented Commitments vs Verified Implementations', 'Evaluating announced government solutions against independently verifiable on-the-ground outcomes.')}
        </div>

        <div class="space-y-6">
          ${commitments.map(c => stateResponseBlock(c)).join('')}
        </div>
      </section>

      <!-- NAVIGATION FOOTER -->
      <div class="pt-8 border-t border-surface-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <a href="/timeline" class="text-sand hover:underline">← Summer 2026 Chronology</a>
        <a href="/evidence" class="text-crimson hover:underline font-bold">Inspect Evidence Register →</a>
      </div>

    </article>
  `;
}
