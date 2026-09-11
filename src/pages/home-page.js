// src/pages/home-page.js
// 404TN — Master Publication Front Page (Route: /)
// Investigative Newspaper × Political Archive × Evidence Database × Documentary Experience

import { escapeHtml } from '../utils.js';
import {
  sectionKicker,
  sectionHeading,
  editorialRule,
  classificationBadge,
  sourceReference,
  responsibilityBlock,
  dataGapBlock,
  issueNavigation
} from '../editorial-components.js';

export function renderHomepageHtml() {
  return `
    <!-- =========================================================================
         1. HERO SECTION (PUBLICATION FRONT PAGE LEAD)
         ========================================================================= -->
    <section id="hero" class="relative pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-surface-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <!-- Header Ribbon -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-surface-800 text-xs font-mono">
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-crimson animate-pulse"></span>
            <span class="uppercase tracking-widest text-crimson font-bold">404TN · INDEPENDENT INVESTIGATIVE PUBLICATION</span>
          </div>
          <div class="text-surface-400 text-[11px]">
            TUNISIA · SUMMER 2026 INVESTIGATION ARCHIVE
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          
          <!-- Main Headline Column (Asymmetric 7-col) -->
          <div class="lg:col-span-7 space-y-6">
            <h1 class="font-editorial text-4xl sm:text-6xl lg:text-7xl text-bone-100 font-normal leading-[1.08] tracking-tight">
              A country under pressure.
            </h1>

            <p class="font-editorial text-xl sm:text-2xl text-surface-300 font-normal italic leading-relaxed">
              Serious evidence. Serious questions. Tunisia, documented.
            </p>

            <div class="space-y-4 text-sm sm:text-base text-surface-300 font-light leading-relaxed max-w-2xl font-sans">
              <p>
                Water cuts. Grid instability. Disappearing youth employment. Compounding institutional centralisation. Environmental degradation in Gabès. And the steady erosion of constitutional counter-powers.
              </p>
              <p class="text-surface-400 text-xs sm:text-sm">
                <strong class="text-bone-100 font-medium">404TN</strong> operates as an independent opposition and accountability platform. Every record published is anchored in primary gazette texts, official statistical bulletins, verified court decisions, or field investigation.
              </p>
            </div>

            <!-- Primary CTAs -->
            <div class="pt-4 flex flex-wrap items-center gap-4 text-xs font-mono">
              <a href="/the-files" class="px-6 py-3.5 bg-crimson hover:bg-crimson-muted text-white uppercase tracking-meta font-bold transition-colors inline-flex items-center gap-2">
                <span>Inspect The Seven Files</span>
                <span>→</span>
              </a>
              <a href="/presidency" class="px-6 py-3.5 bg-surface-900 hover:bg-surface-800 text-bone-100 border border-surface-700 hover:border-surface-600 uppercase tracking-meta transition-colors inline-flex items-center gap-2">
                <span>The Record of Power (2019–2026)</span>
                <span>↗</span>
              </a>
            </div>

            <!-- Quantitative Telemetry Strip -->
            <div class="pt-6 border-t border-surface-800 grid grid-cols-3 gap-4 text-left font-mono">
              <div>
                <span class="text-[10px] text-surface-400 uppercase tracking-meta block">MONITORED DOSSIERS</span>
                <span class="font-editorial text-2xl font-bold text-bone-100">07 Files</span>
              </div>
              <div>
                <span class="text-[10px] text-surface-400 uppercase tracking-meta block">VERIFIED EVIDENCE</span>
                <span id="stats-total-evidence" class="font-editorial text-2xl font-bold text-crimson">105 Records</span>
              </div>
              <div>
                <span class="text-[10px] text-surface-400 uppercase tracking-meta block">PRIMARY SOURCES</span>
                <span id="stats-monitored-sources" class="font-editorial text-2xl font-bold text-sand">27 Sources</span>
              </div>
            </div>

          </div>

          <!-- Lead Editorial Teaser Rail (Asymmetric 5-col) -->
          <div class="lg:col-span-5 space-y-6">
            
            <!-- Lead Investigation Callout: Gabès -->
            <div class="p-6 bg-background-elevated border border-surface-800 space-y-4 relative">
              <div class="flex items-center justify-between pb-3 border-b border-surface-800 text-[10px] font-mono">
                <span class="text-crimson font-bold uppercase tracking-meta">FLAGSHIP SPECIAL REPORT</span>
                <span class="text-surface-400">33.88°N 10.10°E</span>
              </div>
              <div class="space-y-2">
                <h3 class="font-editorial text-2xl text-bone-100">Gabès: The Cost of Industrial Impunity</h3>
                <p class="text-xs text-surface-300 font-light leading-relaxed font-sans">
                  Nine years after the 2017 Cabinet decision pledging the dismantling of coastal chemical units, phosphogypsum continues to discharge into the Gulf of Gabès. Zero units relocated. No continuous public ambient emissions data.
                </p>
              </div>
              <div class="pt-3 border-t border-surface-800/80 flex items-center justify-between text-xs font-mono">
                <span class="text-surface-500">DOSSIER 03 · SPECIAL</span>
                <a href="/gabes" class="text-sand hover:underline font-bold">Open Full Investigation ↗</a>
              </div>
            </div>

            <!-- Quick Access Indices -->
            <div class="p-5 bg-surface-900/40 border border-surface-800 space-y-3 font-mono text-xs">
              <span class="text-[10px] text-surface-400 uppercase tracking-meta block border-b border-surface-800 pb-2">INVESTIGATIVE PILLARS</span>
              <div class="divide-y divide-surface-800/60 text-surface-300">
                <div class="py-2 flex items-center justify-between">
                  <span>1. Hydraulic Saturation Deficit</span>
                  <span class="text-crimson font-bold">21.4%</span>
                </div>
                <div class="py-2 flex items-center justify-between">
                  <span>2. Graduate Youth Unemployment</span>
                  <span class="text-crimson font-bold">38.8%</span>
                </div>
                <div class="py-2 flex items-center justify-between">
                  <span>3. Summer Peak Electrical Demand</span>
                  <span class="text-sand font-bold">4,825 MW</span>
                </div>
                <div class="py-2 flex items-center justify-between">
                  <span>4. Sovereign Debt / GDP Burden</span>
                  <span class="text-sand font-bold">80.2%</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>

    <!-- =========================================================================
         2. THE SEVEN FILES (EDITORIAL ARCHIVE INDEX)
         ========================================================================= -->
    <section id="the-files-section" class="py-16 sm:py-24 border-b border-surface-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-surface-800">
          <div class="space-y-1">
            ${sectionKicker('SYSTEMIC DOSSIERS · SUMMER 2026')}
            ${sectionHeading('The Seven Files', 'Structured ongoing documentation of systemic pressure, public utility strain, and institutional accountability across Tunisia.')}
          </div>
          <a href="/the-files" class="text-xs font-mono text-sand hover:underline shrink-0">View Complete Archive Index →</a>
        </div>

        <div class="divide-y divide-surface-800 border-y border-surface-800 font-sans">
          
          <!-- File 01: Water -->
          <a href="/issues/water" class="block py-6 group hover:bg-surface-900/30 transition-colors px-2 no-underline">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
              <div class="md:col-span-1 num-archival text-2xl font-light text-surface-500 group-hover:text-crimson transition-colors font-mono">01</div>
              <div class="md:col-span-3 font-bold text-lg text-bone-100 group-hover:text-crimson transition-colors">Water</div>
              <div class="md:col-span-6 text-xs sm:text-sm text-surface-300 font-light">Cuts, rationing schedules, aged conveyance infrastructure and reservoir storage deficit (21.4% capacity).</div>
              <div class="md:col-span-2 text-right font-mono text-xs text-surface-400 group-hover:text-bone-100 group-hover:translate-x-1 transition-all">Inspect File →</div>
            </div>
          </a>

          <!-- File 02: Electricity -->
          <a href="/issues/electricity" class="block py-6 group hover:bg-surface-900/30 transition-colors px-2 no-underline">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
              <div class="md:col-span-1 num-archival text-2xl font-light text-surface-500 group-hover:text-crimson transition-colors font-mono">02</div>
              <div class="md:col-span-3 font-bold text-lg text-bone-100 group-hover:text-crimson transition-colors">Electricity</div>
              <div class="md:col-span-6 text-xs sm:text-sm text-surface-300 font-light">STEG generation shortfalls, summer peak thermal strain (4,825 MW), and recurring local load shedding.</div>
              <div class="md:col-span-2 text-right font-mono text-xs text-surface-400 group-hover:text-bone-100 group-hover:translate-x-1 transition-all">Inspect File →</div>
            </div>
          </a>

          <!-- File 03: Pollution & Environment -->
          <a href="/issues/pollution" class="block py-6 group hover:bg-surface-900/30 transition-colors px-2 no-underline">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
              <div class="md:col-span-1 num-archival text-2xl font-light text-surface-500 group-hover:text-crimson transition-colors font-mono">03</div>
              <div class="md:col-span-3 font-bold text-lg text-bone-100 group-hover:text-crimson transition-colors">Pollution & Environment</div>
              <div class="md:col-span-6 text-xs sm:text-sm text-surface-300 font-light">Industrial emissions, phosphogypsum marine discharge, municipal waste crises, and state data deficits.</div>
              <div class="md:col-span-2 text-right font-mono text-xs text-surface-400 group-hover:text-bone-100 group-hover:translate-x-1 transition-all">Inspect File →</div>
            </div>
          </a>

          <!-- File 04: Work -->
          <a href="/issues/work" class="block py-6 group hover:bg-surface-900/30 transition-colors px-2 no-underline">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
              <div class="md:col-span-1 num-archival text-2xl font-light text-surface-500 group-hover:text-crimson transition-colors font-mono">04</div>
              <div class="md:col-span-3 font-bold text-lg text-bone-100 group-hover:text-crimson transition-colors">Work</div>
              <div class="md:col-span-6 text-xs sm:text-sm text-surface-300 font-light">Graduate joblessness (38.8%), informal labor expansion, and wage compression under persistent inflation.</div>
              <div class="md:col-span-2 text-right font-mono text-xs text-surface-400 group-hover:text-bone-100 group-hover:translate-x-1 transition-all">Inspect File →</div>
            </div>
          </a>

          <!-- File 05: Migration -->
          <a href="/issues/migration" class="block py-6 group hover:bg-surface-900/30 transition-colors px-2 no-underline">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
              <div class="md:col-span-1 num-archival text-2xl font-light text-surface-500 group-hover:text-crimson transition-colors font-mono">05</div>
              <div class="md:col-span-3 font-bold text-lg text-bone-100 group-hover:text-crimson transition-colors">Migration</div>
              <div class="md:col-span-6 text-xs sm:text-sm text-surface-300 font-light">Mediterranean departures, transit encampments, external border outsourcing, and regional human rights fallout.</div>
              <div class="md:col-span-2 text-right font-mono text-xs text-surface-400 group-hover:text-bone-100 group-hover:translate-x-1 transition-all">Inspect File →</div>
            </div>
          </a>

          <!-- File 06: Public Services -->
          <a href="/issues/public-services" class="block py-6 group hover:bg-surface-900/30 transition-colors px-2 no-underline">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
              <div class="md:col-span-1 num-archival text-2xl font-light text-surface-500 group-hover:text-crimson transition-colors font-mono">06</div>
              <div class="md:col-span-3 font-bold text-lg text-bone-100 group-hover:text-crimson transition-colors">Public Services</div>
              <div class="md:col-span-6 text-xs sm:text-sm text-surface-300 font-light">Public hospital medicine stockouts, suburban transport fleet decay, and municipal maintenance deficits.</div>
              <div class="md:col-span-2 text-right font-mono text-xs text-surface-400 group-hover:text-bone-100 group-hover:translate-x-1 transition-all">Inspect File →</div>
            </div>
          </a>

          <!-- File 07: Rights & Freedoms -->
          <a href="/issues/rights" class="block py-6 group hover:bg-surface-900/30 transition-colors px-2 no-underline">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
              <div class="md:col-span-1 num-archival text-2xl font-light text-surface-500 group-hover:text-crimson transition-colors font-mono">07</div>
              <div class="md:col-span-3 font-bold text-lg text-bone-100 group-hover:text-crimson transition-colors">Rights & Freedoms</div>
              <div class="md:col-span-6 text-xs sm:text-sm text-surface-300 font-light">Decree-Law 54 criminal prosecutions, judicial restructuring, and executive containment of civic dissent.</div>
              <div class="md:col-span-2 text-right font-mono text-xs text-surface-400 group-hover:text-bone-100 group-hover:translate-x-1 transition-all">Inspect File →</div>
            </div>
          </a>

        </div>

      </div>
    </section>

    <!-- =========================================================================
         3. THE RECORD OF POWER TEASER (PRESIDENCY 2019–2026)
         ========================================================================= -->
    <section id="record-of-power-section" class="py-16 sm:py-24 border-b border-surface-800 bg-background-elevated">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-surface-800">
          <div class="space-y-1">
            ${sectionKicker('POLITICAL ACCOUNTABILITY · 2019–2026')}
            ${sectionHeading('The Record of Power', 'A documentary audit of Kais Saied’s presidency: mandate, exceptional measures, institutional restructuring, and verified outcomes.')}
          </div>
          <a href="/presidency" class="text-xs font-mono text-crimson hover:underline shrink-0 font-bold">Open Full Chronology (18 Seed Records) →</a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono text-xs">
          <div class="p-5 bg-surface-900/60 border border-surface-800 space-y-2">
            <div class="flex justify-between text-surface-500 text-[10px]"><span>ERA 01</span><span class="text-bone-100 font-bold">2019</span></div>
            <div class="font-sans font-bold text-bone-100 text-sm">The Mandate</div>
            <p class="text-[11px] text-surface-400 font-light font-sans leading-snug">72.71% election landslide on anti-corruption & moral renewal pledges.</p>
          </div>
          <div class="p-5 bg-surface-900/60 border border-surface-800 space-y-2">
            <div class="flex justify-between text-surface-500 text-[10px]"><span>ERA 02</span><span class="text-crimson font-bold">2021</span></div>
            <div class="font-sans font-bold text-bone-100 text-sm">The Rupture</div>
            <p class="text-[11px] text-surface-400 font-light font-sans leading-snug">Article 80 emergency measures, parliament cordoned, Decree 117 enacted.</p>
          </div>
          <div class="p-5 bg-surface-900/60 border border-surface-800 space-y-2">
            <div class="flex justify-between text-surface-500 text-[10px]"><span>ERA 03</span><span class="text-sand font-bold">2022</span></div>
            <div class="font-sans font-bold text-bone-100 text-sm">New Political Order</div>
            <p class="text-[11px] text-surface-400 font-light font-sans leading-snug">CSM dissolved, 2022 Constitution referendum, Decree-Law 54 promulgated.</p>
          </div>
          <div class="p-5 bg-surface-900/60 border border-surface-800 space-y-2">
            <div class="flex justify-between text-surface-500 text-[10px]"><span>ERA 04</span><span class="text-bone-100 font-bold">2024</span></div>
            <div class="font-sans font-bold text-bone-100 text-sm">Consolidation</div>
            <p class="text-[11px] text-surface-400 font-light font-sans leading-snug">Re-election under ISIE supervision; court reinstatement orders rejected.</p>
          </div>
          <div class="p-5 bg-surface-900/60 border border-crimson/40 space-y-2">
            <div class="flex justify-between text-surface-500 text-[10px]"><span>ERA 05</span><span class="text-crimson font-bold">2026</span></div>
            <div class="font-sans font-bold text-bone-100 text-sm">The Record</div>
            <p class="text-[11px] text-surface-400 font-light font-sans leading-snug">Direct presidential responsibility tested by compounding national crises.</p>
          </div>
        </div>

      </div>
    </section>

    <!-- =========================================================================
         4. SUMMER 2026 TIMELINE & MAP TEASER
         ========================================================================= -->
    <section id="summer-preview-section" class="py-16 sm:py-24 border-b border-surface-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div class="lg:col-span-6 space-y-6">
            <div class="space-y-1">
              ${sectionKicker('CHRONOLOGY & GEOGRAPHY')}
              ${sectionHeading('Summer 2026 Incident Matrix', 'Real-time temporal and cartographic indexing of documented utility breakdowns, legal actions, and citizen protests.')}
            </div>
            <p class="text-xs sm:text-sm text-surface-300 font-light font-sans leading-relaxed">
              404TN connects incidents across 24 Tunisian governorates with explicit geographic coordinates and timestamps. No synthetic points. No unverified rumors.
            </p>
            <div class="flex flex-wrap gap-3 text-xs font-mono pt-2">
              <a href="/timeline" class="px-5 py-2.5 bg-surface-900 hover:bg-surface-800 border border-surface-700 text-bone-100 transition-colors">Open Timeline Chronology →</a>
              <a href="/geospatial-monitor" class="px-5 py-2.5 bg-surface-900 hover:bg-surface-800 border border-crimson/40 text-crimson transition-colors">Launch Geospatial Monitor ↗</a>
            </div>
          </div>

          <div class="lg:col-span-6 p-6 bg-background-elevated border border-surface-800 space-y-4 text-xs font-mono">
            <div class="flex justify-between text-[10px] text-surface-400 pb-2 border-b border-surface-800">
              <span>METHODOLOGY DISCIPLINE</span>
              <span class="text-emerald-400">TRIPARTITE VERIFICATION</span>
            </div>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="p-3 bg-surface-900/60 border border-surface-800">
                <span class="text-bone-100 font-bold block">FACT</span>
                <span class="text-[10px] text-surface-400 font-sans mt-1 block">Primary documents & JORT texts</span>
              </div>
              <div class="p-3 bg-surface-900/60 border border-sand/30">
                <span class="text-sand font-bold block">CLAIM</span>
                <span class="text-[10px] text-surface-400 font-sans mt-1 block">Attributed political statements</span>
              </div>
              <div class="p-3 bg-surface-900/60 border border-crimson/30">
                <span class="text-crimson font-bold block">ANALYSIS</span>
                <span class="text-[10px] text-surface-400 font-sans mt-1 block">404TN investigative synthesis</span>
              </div>
            </div>
            <div class="text-[11px] text-surface-400 font-sans leading-relaxed pt-2">
              Transparency rule: If state datasets are unreleased or unpublished, 404TN formally logs a <strong>DATA GAP</strong> rather than generating speculative estimates.
            </div>
          </div>

        </div>

      </div>
    </section>

    <!-- =========================================================================
         5. CLOSING EDITORIAL STATEMENT
         ========================================================================= -->
    <section id="closing-statement" class="py-20 sm:py-28 bg-background">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        
        <div class="space-y-2">
          <div class="font-editorial text-3xl sm:text-5xl lg:text-6xl text-bone-100 font-normal leading-tight">
            404 is not the conclusion.
          </div>
          <div class="font-editorial text-3xl sm:text-5xl lg:text-6xl text-crimson font-normal leading-tight">
            It is the question.
          </div>
        </div>

        <p class="text-sm sm:text-base text-surface-300 font-sans font-light max-w-xl mx-auto leading-relaxed">
          When institutions fail to publish, when promises are forgotten, when accountability disappears — documentation is the first act of recovery.
        </p>

        <div class="pt-4 flex flex-wrap justify-center gap-4 text-xs font-mono">
          <a href="/the-files" class="px-8 py-3.5 bg-crimson hover:bg-crimson-muted text-white uppercase tracking-meta font-bold transition-colors">
            Explore All 7 Files
          </a>
          <a href="/methodology" class="px-8 py-3.5 bg-surface-900 hover:bg-surface-800 border border-surface-700 text-bone-100 uppercase tracking-meta transition-colors">
            Our Verification Standards
          </a>
        </div>

      </div>
    </section>
  `;
}
