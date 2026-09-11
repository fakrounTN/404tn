// src/pages/summer-page.js
// 404TN — Summer 2026 Current-State Investigation Dossier (Route: /summer-2026)

import { escapeHtml } from '../utils.js';
import {
  investigationHero,
  sectionKicker,
  sectionHeading,
  editorialRule,
  classificationBadge,
  dataGapBlock,
  issueNavigation
} from '../editorial-components.js';

export function renderSummer2026Html() {
  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt; 
      <span class="text-bone-100 font-medium">Summer 2026 Dossier</span>
    </nav>
  `;

  const heroHtml = investigationHero({
    breadcrumbHtml,
    eyebrow: "SUMMER 2026 DOSSIER",
    badge: "CURRENT INVESTIGATION",
    badgeClass: "bg-crimson/15 border-crimson/40 text-crimson font-bold",
    h1: "Summer 2026: A System Under Compounding Strain",
    deck: "A comprehensive investigation connecting water cuts, electrical peak outages, youth labor market stagnation, coastal pollution in Gabès, and centralized presidential governance.",
    metadataItems: [
      { label: "MONITORING PERIOD", value: "JUNE → SEPT 2026", highlight: true, subtext: "4 MONTHS OF REAL-TIME AUDIT" },
      { label: "SECTORAL COVERAGE", value: "07 CORE FILES", highlight: false, subtext: "CROSS-REGIONAL MATRIX" },
      { label: "EPISTEMIC DISCIPLINE", value: "FACT / CLAIM / ANALYSIS", highlight: false, subtext: "ZERO SPECULATION" },
      { label: "HOLDING AUTHORITIES", value: "12 STATE ENTITIES", highlight: false, subtext: "STATUTORY RESPONSIBILITY" }
    ]
  });

  return `
    <article class="summer-dossier-page py-10 sm:py-16 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- HERO -->
      ${heroHtml}

      <!-- 7 FILES QUICK NAVIGATION -->
      ${issueNavigation()}

      <!-- MONTHLY PROGRESSION -->
      <section class="space-y-8" aria-label="Monthly Progression">
        <div class="space-y-1">
          ${sectionKicker('CHRONOLOGICAL ESCALATION')}
          ${sectionHeading('Summer 2026: Month-by-Month Progression', 'Tracking the compound effect of simultaneous infrastructure failures, macroeconomic stagnation, and institutional decisions.')}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
          
          <!-- June 2026 -->
          <div class="p-6 bg-background-elevated border border-surface-800 space-y-3">
            <div class="flex justify-between text-surface-400 text-[10px] pb-2 border-b border-surface-800">
              <span class="font-bold text-bone-100 uppercase">MONTH 01</span>
              <span>JUNE 2026</span>
            </div>
            <h3 class="font-sans font-bold text-base text-bone-100">Onset of Hydraulic Rationing</h3>
            <p class="text-surface-300 font-light font-sans leading-relaxed text-xs">
              National dam storage fell to 21.4% capacity. SONEDE implemented unannounced night-time pressure cuts across Sfax, Sousse, and Greater Tunis.
            </p>
            <div class="pt-2 text-[10px] text-crimson">FILE 01 · WATER STRESS</div>
          </div>

          <!-- July 2026 -->
          <div class="p-6 bg-background-elevated border border-surface-800 space-y-3">
            <div class="flex justify-between text-surface-400 text-[10px] pb-2 border-b border-surface-800">
              <span class="font-bold text-crimson uppercase">MONTH 02</span>
              <span>JULY 2026</span>
            </div>
            <h3 class="font-sans font-bold text-base text-bone-100">Peak Thermal Load &amp; Outages</h3>
            <p class="text-surface-300 font-light font-sans leading-relaxed text-xs">
              STEG recorded summer peak electrical demand of 4,825 MW during nationwide heatwaves, forcing selective industrial load shedding.
            </p>
            <div class="pt-2 text-[10px] text-crimson">FILE 02 · GRID STRAIN</div>
          </div>

          <!-- August 2026 -->
          <div class="p-6 bg-background-elevated border border-surface-800 space-y-3">
            <div class="flex justify-between text-surface-400 text-[10px] pb-2 border-b border-surface-800">
              <span class="font-bold text-sand uppercase">MONTH 03</span>
              <span>AUGUST 2026</span>
            </div>
            <h3 class="font-sans font-bold text-base text-bone-100">Labor Data &amp; Gabès Mobilisation</h3>
            <p class="text-surface-300 font-light font-sans leading-relaxed text-xs">
              INS reported graduate unemployment reaching 38.8%. Civil society in Gabès held demonstrations protesting nine years of non-execution of the 2017 GCT dismantling decision.
            </p>
            <div class="pt-2 text-[10px] text-sand">FILES 03 &amp; 04 · ENVIRONMENT &amp; JOBS</div>
          </div>

          <!-- September 2026 -->
          <div class="p-6 bg-background-elevated border border-surface-800 space-y-3">
            <div class="flex justify-between text-surface-400 text-[10px] pb-2 border-b border-surface-800">
              <span class="font-bold text-bone-100 uppercase">MONTH 04</span>
              <span>SEPTEMBER 2026</span>
            </div>
            <h3 class="font-sans font-bold text-base text-bone-100">Centralized Executive Record</h3>
            <p class="text-surface-300 font-light font-sans leading-relaxed text-xs">
              Five-year audit of post-2021 hyper-presidency governance shows concentration of executive authority without corresponding operational resolution of utility crises.
            </p>
            <div class="pt-2 text-[10px] text-bone-100">FILE 07 · THE RECORD OF POWER</div>
          </div>

        </div>
      </section>

      <!-- SECTORAL EVIDENCE BREAKDOWN -->
      <section class="p-8 bg-background-elevated border border-surface-800 space-y-6">
        <div class="space-y-1">
          ${sectionKicker('SYSTEMIC CROSS-CORRELATION')}
          ${sectionHeading('Why Summer 2026 Is Not Isolated Events', 'The compounding interaction between environmental decline, utility strain, and political decision-making.')}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans text-surface-300 font-light leading-relaxed">
          <div class="p-4 bg-surface-900/40 border border-surface-800 space-y-2">
            <strong class="text-bone-100 font-bold block text-sm">1. Infrastructure Cascades</strong>
            <p>Hydraulic rationing directly impacts hospital sterilization, agricultural yields in the Cap Bon, and coastal tourism operations, compounding economic distress.</p>
          </div>
          <div class="p-4 bg-surface-900/40 border border-surface-800 space-y-2">
            <strong class="text-bone-100 font-bold block text-sm">2. Economic Traps</strong>
            <p>Graduate youth facing 38.8% unemployment and wage erosion turn increasingly to irregular Mediterranean departures or the informal exchange economy.</p>
          </div>
          <div class="p-4 bg-surface-900/40 border border-surface-800 space-y-2">
            <strong class="text-bone-100 font-bold block text-sm">3. Accountability Centralization</strong>
            <p>With all ministerial and regional governor appointments directly made by the Presidency under the 2022 Constitution, operational delays map directly to Carthage Palace.</p>
          </div>
        </div>
      </section>

      <!-- DATA GAPS -->
      <section class="space-y-6">
        <div class="space-y-1">
          ${sectionKicker('DOCUMENTED TRANSPARENCY GAPS')}
          ${sectionHeading('What the State Concealed or Left Unpublished in Summer 2026')}
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${dataGapBlock({
            title: "Real-Time Potable Water Network Loss Rates",
            summary: "SONEDE has not published updated regional conveyance loss rates for Summer 2026 despite widespread network ruptures and physical leaks.",
            expectedInstitution: "National Water Distribution Utility (SONEDE)",
            relevance: "Prevents citizens and civil engineers from evaluating whether rationing is caused by source depletion or distribution mismanagement."
          })}
          ${dataGapBlock({
            title: "Industrial Atmospheric Sensor Feeds in Gabès",
            summary: "ANPE operates fixed air monitoring sensors in Gabès but does not provide real-time open data feeds for sulfur dioxide (SO2) or particulate matter.",
            expectedInstitution: "National Environmental Protection Agency (ANPE)",
            relevance: "Denies residents and healthcare professionals verifiable toxicological data during seasonal pollution spikes."
          })}
        </div>
      </section>

      <!-- NAVIGATION FOOTER -->
      <div class="pt-8 border-t border-surface-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <a href="/the-files" class="text-sand hover:underline">← The Seven Files Archive</a>
        <a href="/presidency" class="text-crimson hover:underline font-bold">Inspect The Record of Power (2019–2026) →</a>
      </div>

    </article>
  `;
}
