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
      
      <!-- 1. HERO -->
      ${heroHtml}

      <!-- 2. SEVEN FILES QUICK NAVIGATION -->
      ${issueNavigation()}

      <!-- 3. CHRONOLOGICAL MONTHLY ESCALATION (VERTICAL TIMELINE SPINE) -->
      <section class="space-y-8" aria-label="Monthly Progression">
        <div class="space-y-1">
          ${sectionKicker('CHRONOLOGICAL ESCALATION')}
          ${sectionHeading('Summer 2026: Month-by-Month Progression', 'Tracking the compound effect of simultaneous infrastructure failures, macroeconomic stagnation, and institutional decisions.')}
        </div>

        <div class="chronology-spine-container space-y-8 pt-4">
          
          <!-- Month 01: June 2026 -->
          <div class="chronology-node">
            <span class="chronology-node-dot"></span>
            <div class="p-6 sm:p-7 bg-background-elevated border border-surface-800 space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-800 text-xs font-mono">
                <div class="flex items-center gap-2.5">
                  <span class="font-bold text-bone-100 uppercase tracking-wider">MONTH 01</span>
                  <span class="text-surface-500">·</span>
                  <span class="text-crimson font-bold">JUNE 2026</span>
                </div>
                <div class="flex items-center gap-2">
                  ${classificationBadge('FACT')}
                  <span class="text-surface-400 text-[10px] uppercase">FILE 01 · WATER STRESS</span>
                </div>
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl text-bone-100">Onset of Hydraulic Rationing</h3>
              <p class="text-surface-300 font-light font-sans leading-relaxed text-xs sm:text-sm max-w-prose">
                National dam storage fell to <strong class="text-crimson font-mono font-medium">21.4% capacity</strong> across Northern and Central basins. SONEDE implemented unannounced night-time pressure cuts across Sfax, Sousse, and Greater Tunis, triggering emergency preservation quotas.
              </p>
              <div class="pt-3 border-t border-surface-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-surface-400">
                <span>PRIMARY RECORD: ONAGRI Hydrological Bulletin</span>
                <a href="/issues/water" class="text-sand hover:underline font-bold">Inspect Water File →</a>
              </div>
            </div>
          </div>

          <!-- Month 02: July 2026 -->
          <div class="chronology-node">
            <span class="chronology-node-dot"></span>
            <div class="p-6 sm:p-7 bg-background-elevated border border-surface-800 space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-800 text-xs font-mono">
                <div class="flex items-center gap-2.5">
                  <span class="font-bold text-bone-100 uppercase tracking-wider">MONTH 02</span>
                  <span class="text-surface-500">·</span>
                  <span class="text-crimson font-bold">JULY 2026</span>
                </div>
                <div class="flex items-center gap-2">
                  ${classificationBadge('FACT')}
                  <span class="text-surface-400 text-[10px] uppercase">FILE 02 · GRID STRAIN</span>
                </div>
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl text-bone-100">Peak Thermal Load &amp; Selective Outages</h3>
              <p class="text-surface-300 font-light font-sans leading-relaxed text-xs sm:text-sm max-w-prose">
                STEG recorded an all-time summer peak electrical demand of <strong class="text-crimson font-mono font-medium">4,825 MW</strong> during nationwide heatwaves, forcing selective industrial load shedding and emergency imports from the Algerian grid to prevent total system collapse.
              </p>
              <div class="pt-3 border-t border-surface-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-surface-400">
                <span>PRIMARY RECORD: STEG Dispatching Center Telemetry</span>
                <a href="/issues/electricity" class="text-sand hover:underline font-bold">Inspect Electricity File →</a>
              </div>
            </div>
          </div>

          <!-- Month 03: August 2026 -->
          <div class="chronology-node">
            <span class="chronology-node-dot"></span>
            <div class="p-6 sm:p-7 bg-background-elevated border border-surface-800 space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-800 text-xs font-mono">
                <div class="flex items-center gap-2.5">
                  <span class="font-bold text-bone-100 uppercase tracking-wider">MONTH 03</span>
                  <span class="text-surface-500">·</span>
                  <span class="text-sand font-bold">AUGUST 2026</span>
                </div>
                <div class="flex items-center gap-2">
                  ${classificationBadge('FACT')}
                  <span class="text-surface-400 text-[10px] uppercase">FILES 03 &amp; 04 · ENVIRONMENT &amp; JOBS</span>
                </div>
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl text-bone-100">Labor Contraction &amp; Gabès Mobilisation</h3>
              <p class="text-surface-300 font-light font-sans leading-relaxed text-xs sm:text-sm max-w-prose">
                INS reported higher education graduate unemployment reaching <strong class="text-crimson font-mono font-medium">38.8%</strong>. Simultaneously, civil society in Gabès organized public demonstrations protesting nine years of non-execution of the 2017 Cabinet decision to dismantle coastal chemical units.
              </p>
              <div class="pt-3 border-t border-surface-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-surface-400">
                <span>PRIMARY RECORD: INS Labour Force Survey &amp; FTDES</span>
                <a href="/gabes" class="text-sand hover:underline font-bold">Open Gabès Special Report ↗</a>
              </div>
            </div>
          </div>

          <!-- Month 04: September 2026 -->
          <div class="chronology-node">
            <span class="chronology-node-dot"></span>
            <div class="p-6 sm:p-7 bg-background-elevated border border-crimson/40 space-y-3">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-800 text-xs font-mono">
                <div class="flex items-center gap-2.5">
                  <span class="font-bold text-bone-100 uppercase tracking-wider">MONTH 04</span>
                  <span class="text-surface-500">·</span>
                  <span class="text-crimson font-bold">SEPTEMBER 2026</span>
                </div>
                <div class="flex items-center gap-2">
                  ${classificationBadge('ANALYSIS')}
                  <span class="text-surface-400 text-[10px] uppercase">FILE 07 · THE RECORD OF POWER</span>
                </div>
              </div>
              <h3 class="font-editorial text-xl sm:text-2xl text-bone-100">Centralized Executive Record Tested</h3>
              <p class="text-surface-300 font-light font-sans leading-relaxed text-xs sm:text-sm max-w-prose">
                A five-year audit of post-2021 hyper-presidential governance demonstrates the structural concentration of executive authority in Carthage Palace without corresponding operational resolution of utility crises or economic deceleration.
              </p>
              <div class="pt-3 border-t border-surface-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-surface-400">
                <span>404TN INVESTIGATIVE SYNTHESIS</span>
                <a href="/presidency" class="text-crimson hover:underline font-bold">The Record of Power (2019–2026) ↗</a>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- 4. IN-DEPTH ANALYSIS ESSAY: WHY SUMMER 2026 IS NOT ISOLATED EVENTS -->
      <section class="p-6 sm:p-10 bg-background-elevated border border-surface-800 space-y-8" aria-label="Systemic Analysis Essay">
        <div class="space-y-2 border-b border-surface-800 pb-6">
          ${sectionKicker('SYSTEMIC CROSS-CORRELATION ANALYSIS')}
          <h2 class="font-editorial text-2xl sm:text-4xl text-bone-100 font-normal">
            Why Summer 2026 Is Not Isolated Events
          </h2>
          <p class="text-surface-300 text-sm sm:text-base font-light font-sans leading-relaxed max-w-3xl">
            The compounding interaction between environmental decline, public utility strain, and constitutional decision-making reveals a single integrated governance stress test.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs sm:text-sm font-sans text-surface-300 font-light leading-relaxed">

          <!-- Column 1 -->
          <div class="space-y-3">
            <span class="num-archival text-lg font-mono text-crimson block font-bold">01</span>
            <h3 class="font-sans font-bold text-base text-bone-100">Infrastructure Cascades</h3>
            <p>
              Hydraulic rationing is not a self-contained agricultural inconvenience. When SONEDE cuts night-time water pressure, hospital sterilization facilities in Sfax operate on reserve tanks, hotel tourism along the Cap Bon is disrupted, and commercial bakeries face operational delays.
            </p>
            <p class="text-surface-400 text-xs">
              Simultaneous peak electrical demand (<strong class="text-bone-100">4,825 MW</strong>) stresses water pumping stations, creating a compounding loop of service interruptions.
            </p>
          </div>

          <!-- Column 2 -->
          <div class="space-y-3">
            <span class="num-archival text-lg font-mono text-sand block font-bold">02</span>
            <h3 class="font-sans font-bold text-base text-bone-100">Economic Traps</h3>
            <p>
              With university graduate unemployment recorded at <strong class="text-crimson font-mono font-medium">38.8%</strong> and food inflation near double digits, household real purchasing power has contracted by an estimated 14% since 2022.
            </p>
            <p class="text-surface-400 text-xs">
              Denied formal public sector employment and constrained by domestic credit restrictions, working-age youth turn increasingly to irregular Mediterranean departures or the informal currency brokerage economy.
            </p>
          </div>

          <!-- Column 3 -->
          <div class="space-y-3">
            <span class="num-archival text-lg font-mono text-bone-100 block font-bold">03</span>
            <h3 class="font-sans font-bold text-base text-bone-100">Accountability Centralization</h3>
            <p>
              Under the 2022 Constitution, all ministerial appointments, regional governorships, and public enterprise directorships are formally centralized in the Presidency of the Republic.
            </p>
            <p class="text-surface-400 text-xs">
              When SONEDE rationing schedules fail or STEG load shedding recurs, the institutional line of responsibility maps directly to Carthage Palace rather than fragmented parliamentary cabinets.
            </p>
          </div>

        </div>

        <!-- Pull Quote Block -->
        <div class="p-6 bg-surface-900/60 border-l-2 border-crimson text-sm sm:text-base font-editorial italic text-bone-100 leading-relaxed">
          "The breakdown of public services in Summer 2026 is not the result of simultaneous natural coincidences. It is the cumulative manifestation of postponed investments, unexecuted state decrees, and absolute centralization of authority."
        </div>
      </section>

      <!-- 5. DOCUMENTED DATA GAPS -->
      <section class="space-y-6" aria-label="Documented Data Gaps">
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

      <!-- 6. NAVIGATION FOOTER -->
      <div class="pt-8 border-t border-surface-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <a href="/the-files" class="text-sand hover:underline">← The Seven Files Archive</a>
        <a href="/presidency" class="text-crimson hover:underline font-bold">Inspect The Record of Power (2019–2026) →</a>
      </div>

    </article>
  `;
}
