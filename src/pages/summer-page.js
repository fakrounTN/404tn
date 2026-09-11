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
    <article class="summer-dossier-page">
      
      <!-- 1. HERO (DARK INVESTIGATIVE CANVAS) -->
      <div class="bg-background text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          ${heroHtml}
        </div>
      </div>

      <!-- 2. DOCUMENTARY REPORT VIEW (REAL WARM PAPER SURFACE) -->
      <div class="surface-paper py-10 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">

          <!-- SEVEN FILES QUICK NAVIGATION ON PAPER -->
          <nav aria-label="Seven Files Navigation" class="py-3 border-y border-paper overflow-x-auto flex items-center gap-2 text-xs font-mono">
            <span class="text-[10px] text-paper-dim uppercase tracking-meta mr-2 shrink-0 font-bold">THE SEVEN FILES:</span>
            <a href="/issues/water" class="px-3 py-1 shrink-0 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">
              <span class="text-paper-dim mr-1">01</span>Water
            </a>
            <a href="/issues/electricity" class="px-3 py-1 shrink-0 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">
              <span class="text-paper-dim mr-1">02</span>Electricity
            </a>
            <a href="/issues/pollution" class="px-3 py-1 shrink-0 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">
              <span class="text-paper-dim mr-1">03</span>Pollution
            </a>
            <a href="/issues/work" class="px-3 py-1 shrink-0 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">
              <span class="text-paper-dim mr-1">04</span>Work
            </a>
            <a href="/issues/migration" class="px-3 py-1 shrink-0 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">
              <span class="text-paper-dim mr-1">05</span>Migration
            </a>
            <a href="/issues/public-services" class="px-3 py-1 shrink-0 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">
              <span class="text-paper-dim mr-1">06</span>Public Services
            </a>
            <a href="/issues/rights" class="px-3 py-1 shrink-0 bg-white hover:bg-surface-200 border border-paper text-paper-main hover:text-paper-red transition-colors">
              <span class="text-paper-dim mr-1">07</span>Rights &amp; Freedoms
            </a>
          </nav>

          <!-- 3. CHRONOLOGICAL MONTHLY ESCALATION (VERTICAL TIMELINE ON PAPER) -->
          <section class="space-y-6" aria-label="Monthly Progression">
            <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-paper">
              <div class="space-y-1">
                <span class="text-xs font-mono uppercase tracking-widest text-paper-red font-bold block">CHRONOLOGICAL ESCALATION</span>
                <h2 class="font-editorial text-2xl sm:text-4xl text-paper-main font-normal">Summer 2026: Month-by-Month Progression</h2>
                <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-2xl">Tracking the compound effect of simultaneous infrastructure failures, macroeconomic stagnation, and institutional decisions.</p>
              </div>
            </div>

            <div class="chronology-spine-paper space-y-4 pt-2">

              <!-- Month 01: June 2026 (Open broadsheet entry) -->
              <div class="chronology-node">
                <span class="chronology-node-dot-paper"></span>
                <article class="chronology-record-item py-4 space-y-2 border-b border-paper">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 text-xs font-mono">
                    <div class="flex items-center gap-2.5">
                      <span class="font-bold text-paper-main uppercase tracking-wider">MONTH 01</span>
                      <span class="text-paper-dim">·</span>
                      <time class="text-paper-red font-bold">JUNE 2026</time>
                    </div>
                    <div class="flex items-center gap-2">
                      ${classificationBadge('FACT', true)}
                      <span class="text-paper-dim text-[10px] uppercase">FILE 01 · WATER STRESS</span>
                    </div>
                  </div>
                  <h3 class="font-editorial text-xl sm:text-2xl text-paper-main font-bold">Onset of Hydraulic Rationing</h3>
                  <p class="text-paper-muted font-light font-sans leading-relaxed text-xs sm:text-sm max-w-prose">
                    National dam storage fell to <strong class="text-paper-red font-mono font-bold">21.4% capacity</strong> across Northern and Central basins. SONEDE implemented unannounced night-time pressure cuts across Sfax, Sousse, and Greater Tunis, triggering emergency preservation quotas.
                  </p>
                  <div class="pt-2 mt-2 border-t border-paper flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-paper-muted">
                    <span>PRIMARY RECORD: ONAGRI Hydrological Bulletin</span>
                    <a href="/issues/water" class="text-paper-red hover:underline font-bold">Inspect Water File →</a>
                  </div>
                </article>
              </div>

              <!-- Month 02: July 2026 -->
              <div class="chronology-node">
                <span class="chronology-node-dot-paper"></span>
                <article class="chronology-record-item py-4 space-y-2 border-b border-paper">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 text-xs font-mono">
                    <div class="flex items-center gap-2.5">
                      <span class="font-bold text-paper-main uppercase tracking-wider">MONTH 02</span>
                      <span class="text-paper-dim">·</span>
                      <time class="text-paper-red font-bold">JULY 2026</time>
                    </div>
                    <div class="flex items-center gap-2">
                      ${classificationBadge('FACT', true)}
                      <span class="text-paper-dim text-[10px] uppercase">FILE 02 · GRID STRAIN</span>
                    </div>
                  </div>
                  <h3 class="font-editorial text-xl sm:text-2xl text-paper-main font-bold">Peak Thermal Load &amp; Selective Outages</h3>
                  <p class="text-paper-muted font-light font-sans leading-relaxed text-xs sm:text-sm max-w-prose">
                    STEG recorded an all-time summer peak electrical demand of <strong class="text-paper-red font-mono font-bold">4,825 MW</strong> during nationwide heatwaves, forcing selective industrial load shedding and emergency imports from the Algerian grid to prevent total system collapse.
                  </p>
                  <div class="pt-2 mt-2 border-t border-paper flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-paper-muted">
                    <span>PRIMARY RECORD: STEG Dispatching Center Telemetry</span>
                    <a href="/issues/electricity" class="text-paper-red hover:underline font-bold">Inspect Electricity File →</a>
                  </div>
                </article>
              </div>

              <!-- Month 03: August 2026 -->
              <div class="chronology-node">
                <span class="chronology-node-dot-paper"></span>
                <article class="chronology-record-item py-4 space-y-2 border-b border-paper">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 text-xs font-mono">
                    <div class="flex items-center gap-2.5">
                      <span class="font-bold text-paper-main uppercase tracking-wider">MONTH 03</span>
                      <span class="text-paper-dim">·</span>
                      <time class="text-paper-sand font-bold">AUGUST 2026</time>
                    </div>
                    <div class="flex items-center gap-2">
                      ${classificationBadge('FACT', true)}
                      <span class="text-paper-dim text-[10px] uppercase">FILES 03 &amp; 04 · ENVIRONMENT &amp; JOBS</span>
                    </div>
                  </div>
                  <h3 class="font-editorial text-xl sm:text-2xl text-paper-main font-bold">Labor Contraction &amp; Gabès Mobilisation</h3>
                  <p class="text-paper-muted font-light font-sans leading-relaxed text-xs sm:text-sm max-w-prose">
                    INS reported higher education graduate unemployment reaching <strong class="text-paper-red font-mono font-bold">38.8%</strong>. Simultaneously, civil society in Gabès organized public demonstrations protesting nine years of non-execution of the 2017 Cabinet decision to dismantle coastal chemical units.
                  </p>
                  <div class="pt-2 mt-2 border-t border-paper flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-paper-muted">
                    <span>PRIMARY RECORD: INS Labour Force Survey &amp; FTDES</span>
                    <a href="/gabes" class="text-paper-red hover:underline font-bold">Open Gabès Special Report ↗</a>
                  </div>
                </article>
              </div>

              <!-- Month 04: September 2026 -->
              <div class="chronology-node">
                <span class="chronology-node-dot-paper"></span>
                <article class="chronology-record-item py-4 space-y-2">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 text-xs font-mono">
                    <div class="flex items-center gap-2.5">
                      <span class="font-bold text-paper-main uppercase tracking-wider">MONTH 04</span>
                      <span class="text-paper-dim">·</span>
                      <time class="text-paper-red font-bold">SEPTEMBER 2026</time>
                    </div>
                    <div class="flex items-center gap-2">
                      ${classificationBadge('ANALYSIS', true)}
                      <span class="text-paper-dim text-[10px] uppercase">FILE 07 · THE RECORD OF POWER</span>
                    </div>
                  </div>
                  <h3 class="font-editorial text-xl sm:text-2xl text-paper-main font-bold">Centralized Executive Record Tested</h3>
                  <p class="text-paper-muted font-light font-sans leading-relaxed text-xs sm:text-sm max-w-prose">
                    A five-year audit of post-2021 hyper-presidential governance demonstrates the structural concentration of executive authority in Carthage Palace without corresponding operational resolution of utility crises or economic deceleration.
                  </p>
                  <div class="pt-2 mt-2 border-t border-paper flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-paper-muted">
                    <span>404TN INVESTIGATIVE SYNTHESIS</span>
                    <a href="/presidency" class="text-paper-red hover:underline font-bold">The Record of Power (2019–2026) ↗</a>
                  </div>
                </article>
              </div>

            </div>
          </section>

          <!-- 4. IN-DEPTH ANALYSIS ESSAY: WHY SUMMER 2026 IS NOT ISOLATED EVENTS (ON PAPER) -->
          <section class="p-6 sm:p-10 bg-white border border-paper shadow-sm space-y-8" aria-label="Systemic Analysis Essay">
            <div class="space-y-2 border-b border-paper pb-6">
              <span class="text-xs font-mono uppercase tracking-widest text-paper-red font-bold block">SYSTEMIC CROSS-CORRELATION ANALYSIS</span>
              <h2 class="font-editorial text-2xl sm:text-4xl text-paper-main font-normal">
                Why Summer 2026 Is Not Isolated Events
              </h2>
              <p class="text-paper-muted text-sm sm:text-base font-light font-sans leading-relaxed max-w-3xl">
                The compounding interaction between environmental decline, public utility strain, and constitutional decision-making reveals a single integrated governance stress test.
              </p>
            </div>

            <!-- Broadsheet 3-column essay layout with hairline dividers -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs sm:text-sm font-sans text-paper-muted font-light leading-relaxed">

              <!-- Column 1 -->
              <div class="space-y-3 md:pr-4 md:border-r md:border-paper">
                <span class="num-archival text-lg font-mono text-paper-red block font-bold">01</span>
                <h3 class="font-sans font-bold text-base text-paper-main">Infrastructure Cascades</h3>
                <p>
                  Hydraulic rationing is not a self-contained agricultural inconvenience. When SONEDE cuts night-time water pressure, hospital sterilization facilities in Sfax operate on reserve tanks, hotel tourism along the Cap Bon is disrupted, and commercial bakeries face operational delays.
                </p>
                <p class="text-paper-dim text-xs">
                  Simultaneous peak electrical demand (<strong class="text-paper-main font-bold">4,825 MW</strong>) stresses water pumping stations, creating a compounding loop of service interruptions.
                </p>
              </div>

              <!-- Column 2 -->
              <div class="space-y-3 md:px-2 md:border-r md:border-paper">
                <span class="num-archival text-lg font-mono text-paper-sand block font-bold">02</span>
                <h3 class="font-sans font-bold text-base text-paper-main">Economic Traps</h3>
                <p>
                  With university graduate unemployment recorded at <strong class="text-paper-red font-mono font-bold">38.8%</strong> and food inflation near double digits, household real purchasing power has contracted by an estimated 14% since 2022.
                </p>
                <p class="text-paper-dim text-xs">
                  Denied formal public sector employment and constrained by domestic credit restrictions, working-age youth turn increasingly to irregular Mediterranean departures or the informal currency brokerage economy.
                </p>
              </div>

              <!-- Column 3 -->
              <div class="space-y-3 md:pl-4">
                <span class="num-archival text-lg font-mono text-paper-main block font-bold">03</span>
                <h3 class="font-sans font-bold text-base text-paper-main">Accountability Centralization</h3>
                <p>
                  Under the 2022 Constitution, all ministerial appointments, regional governorships, and public enterprise directorships are formally centralized in the Presidency of the Republic.
                </p>
                <p class="text-paper-dim text-xs">
                  When SONEDE rationing schedules fail or STEG load shedding recurs, the institutional line of responsibility maps directly to Carthage Palace rather than fragmented parliamentary cabinets.
                </p>
              </div>

            </div>

            <!-- Pull Quote Block on Paper -->
            <div class="p-6 bg-[#FAF8F5] border-l-2 border-paper-red text-sm sm:text-base font-editorial italic text-paper-main leading-relaxed">
              "The breakdown of public services in Summer 2026 is not the result of simultaneous natural coincidences. It is the cumulative manifestation of postponed investments, unexecuted state decrees, and absolute centralization of authority."
            </div>
          </section>

          <!-- 5. DOCUMENTED DATA GAPS (FRAMED WARNINGS ON PAPER) -->
          <section class="space-y-6" aria-label="Documented Data Gaps">
            <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-paper">
              <div class="space-y-1">
                <span class="text-xs font-mono uppercase tracking-widest text-paper-sand font-bold block">DOCUMENTED TRANSPARENCY GAPS</span>
                <h2 class="font-editorial text-2xl sm:text-3xl text-paper-main font-normal">What the State Concealed or Left Unpublished in Summer 2026</h2>
              </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="p-5 bg-[#FEF9C3]/50 border border-[#EAB308]/40 space-y-2.5">
                <div class="flex items-center justify-between pb-2 border-b border-[#EAB308]/30">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-amber-600"></span>
                    <span class="text-[10px] font-mono uppercase tracking-widest text-paper-sand font-bold">DATA GAP: Real-Time Potable Water Network Loss Rates</span>
                  </div>
                  <span class="text-[9px] font-mono px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 uppercase font-bold">NOT PUBLISHED</span>
                </div>
                <p class="text-xs text-paper-muted font-light leading-relaxed">SONEDE has not published updated regional conveyance loss rates for Summer 2026 despite widespread network ruptures and physical leaks.</p>
                <div class="pt-2 border-t border-[#EAB308]/30 text-xs font-mono text-paper-dim">
                  Expected Institution: <span class="text-paper-main font-bold">National Water Distribution Utility (SONEDE)</span>
                </div>
                <div class="text-[11px] text-paper-muted font-sans font-light">Why it matters: Prevents citizens and civil engineers from evaluating whether rationing is caused by source depletion or distribution mismanagement.</div>
              </div>

              <div class="p-5 bg-[#FEF9C3]/50 border border-[#EAB308]/40 space-y-2.5">
                <div class="flex items-center justify-between pb-2 border-b border-[#EAB308]/30">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-amber-600"></span>
                    <span class="text-[10px] font-mono uppercase tracking-widest text-paper-sand font-bold">DATA GAP: Industrial Atmospheric Sensor Feeds in Gabès</span>
                  </div>
                  <span class="text-[9px] font-mono px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 uppercase font-bold">NOT PUBLISHED</span>
                </div>
                <p class="text-xs text-paper-muted font-light leading-relaxed">ANPE operates fixed air monitoring sensors in Gabès but does not provide real-time open data feeds for sulfur dioxide (SO2) or particulate matter.</p>
                <div class="pt-2 border-t border-[#EAB308]/30 text-xs font-mono text-paper-dim">
                  Expected Institution: <span class="text-paper-main font-bold">National Environmental Protection Agency (ANPE)</span>
                </div>
                <div class="text-[11px] text-paper-muted font-sans font-light">Why it matters: Denies residents and healthcare professionals verifiable toxicological data during seasonal pollution spikes.</div>
              </div>
            </div>
          </section>

        </div>
      </div>

      <!-- 6. NAVIGATION FOOTER (DARK INVESTIGATIVE FOOTER TRANSITION) -->
      <div class="bg-background text-bone-100 py-10 border-t border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <a href="/the-files" class="text-sand hover:underline">← The Seven Files Archive</a>
          <a href="/presidency" class="text-crimson hover:underline font-bold">Inspect The Record of Power (2019–2026) →</a>
        </div>
      </div>

    </article>
  `;
}
