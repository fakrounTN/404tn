// src/pages/the-files-page.js
// 404TN — The Seven Files: Master Editorial Archive Index (Route: /the-files)

import { escapeHtml } from '../utils.js';
import {
  investigationHero,
  sectionKicker,
  sectionHeading,
  editorialRule,
  classificationBadge
} from '../editorial-components.js';

export function renderTheFilesHtml() {
  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt; 
      <span class="text-bone-100 font-medium">The Seven Files</span>
    </nav>
  `;

  const heroHtml = investigationHero({
    breadcrumbHtml,
    eyebrow: "INVESTIGATIVE ARCHIVE",
    badge: "07 DOSSIERS · COMPLETE INDEX",
    badgeClass: "bg-surface-900 border-surface-700 text-bone-100 font-bold",
    h1: "The Seven Files",
    deck: "Ongoing, source-verified investigative documentation of systemic failure, public utility decline, and state accountability across Tunisia.",
    metadataItems: [
      { label: "INDEXED DOSSIERS", value: "07 CORE FILES", highlight: true, subtext: "SYSTEMIC SECTORS" },
      { label: "ACCOUNTABILITY PERIOD", value: "2019 → 2026", highlight: false, subtext: "HISTORICAL CONTEXT" },
      { label: "EPISTEMIC RULE", value: "SOURCE PROVENANCE", highlight: false, subtext: "MANDATORY ON ALL CLAIMS" },
      { label: "PUBLIC MONITOR", value: "SUMMER 2026", highlight: false, subtext: "REAL-TIME AUDIT" }
    ]
  });

  const files = [
    {
      num: "01",
      slug: "water",
      name: "Water",
      title: "File 01: Water Deficit, Infrastructure Aging & Regional Hydraulic Stress",
      deck: "Investigative documentation of Tunisia’s hydraulic deficit, reservoir storage levels, SONEDE rationing schedules, and regional supply disparities.",
      status: "CRITICAL DEFICIT",
      metric: "21.4% dam saturation",
      institutions: ["SONEDE", "Ministry of Agriculture", "ONAGRI"]
    },
    {
      num: "02",
      slug: "electricity",
      name: "Electricity",
      title: "File 02: Electrical Network Stress, Summer Peak Demand & Power Cuts",
      deck: "Investigation into STEG generation capacity, distribution breakdowns, maintenance deficits, and seasonal load shedding across governorates.",
      status: "PEAK LOAD PRESSURE",
      metric: "4,825 MW peak demand",
      institutions: ["STEG", "Ministry of Industry & Energy"]
    },
    {
      num: "03",
      slug: "pollution",
      name: "Pollution & Environment",
      title: "File 03: Industrial Chemical Pollution, Coastal Degradation & Ecological Impact",
      deck: "Field evidence, ecological audits, and environmental health data from industrial hotspots across Gabès, Sfax, and Gafsa.",
      status: "SEVERE DEGRADATION",
      metric: "14,000 T/day phosphogypsum",
      institutions: ["Groupe Chimique Tunisien (GCT)", "ANPE", "Ministry of Environment"]
    },
    {
      num: "04",
      slug: "work",
      name: "Work & Employment",
      title: "File 04: Youth Joblessness, Graduate Unemployment & Informal Economy",
      deck: "Analysis of official labor statistics, graduate joblessness, brain drain, wage erosion, and systemic labor market exclusion.",
      status: "STRUCTURAL STAGNATION",
      metric: "38.8% graduate unemployment",
      institutions: ["INS", "Ministry of Employment & Vocational Training"]
    },
    {
      num: "05",
      slug: "migration",
      name: "Migration & Borders",
      title: "File 05: Mediterranean Departures, Encampments & European Border Agreements",
      deck: "Investigating irregular sea departures, security operations, human rights conditions, transit camps, and bilateral European border accords.",
      status: "HUMANITARIAN STRAIN",
      metric: "Bilateral security pacts",
      institutions: ["Ministry of Interior", "National Guard", "European Commission"]
    },
    {
      num: "06",
      slug: "public-services",
      name: "Public Services",
      title: "File 06: Healthcare Deficits, Public Transport Decay & Municipal Failures",
      deck: "Documenting everyday institutional decay across state hospitals, suburban rail and bus transport fleets, and municipal waste management.",
      status: "SYSTEMIC FRICTION",
      metric: "Chronic supply shortages",
      institutions: ["Ministry of Health", "TRANSTU", "Local Municipalities"]
    },
    {
      num: "07",
      slug: "rights",
      name: "Rights & Institutions",
      title: "File 07: Legal Decrees, Judicial Restructuring & Executive Concentration",
      deck: "Tracking the restructuring of state institutions, Decree-Law 54 cybercrime prosecutions, judicial autonomy, and the concentration of executive authority.",
      status: "EXECUTIVE DOMINANCE",
      metric: "Decree 54 prosecutions",
      institutions: ["Presidency of the Republic", "Ministry of Justice", "ISIE"]
    }
  ];

  return `
    <article class="the-files-archive-page">
      
      <!-- A. INVESTIGATIVE ARCHIVE OPENER (DARK CHASSIS) -->
      <div class="bg-background text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          ${heroHtml}
        </div>
      </div>

      <!-- B. MASTER DOSSIER REGISTER (WARM ARCHIVAL PAPER SURFACE) -->
      <div class="surface-paper py-10 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

          <!-- ARCHIVE DIRECTORY -->
          <section class="space-y-6" aria-label="Archive Directory">
            <div class="space-y-1 pb-4 border-b border-paper">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-0.5 bg-paper-red inline-block"></span>
                <span class="text-xs font-mono uppercase tracking-widest text-paper-crimson font-bold">SYSTEMIC DOSSIERS</span>
              </div>
              <h2 class="font-editorial text-2xl sm:text-3xl text-paper-primary font-normal">The 7 Core Investigative Dossiers</h2>
              <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-2xl">
                Every dossier contains verified baseline indicators, institutional responsibility mappings, state responses, primary gazette documents, and documented data gaps.
              </p>
            </div>

            <!-- OPEN BROADSHEET REGISTER (ZERO CARD WALLS) -->
            <div class="divide-y divide-paper border-y border-paper font-sans">
              ${files.map(f => `
                <div class="py-8 group hover:bg-paper-subtle/50 transition-colors px-2 sm:px-4 space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div class="flex items-baseline gap-4">
                      <span class="text-2xl sm:text-3xl font-light text-paper-dim group-hover:text-paper-crimson transition-colors font-mono">${f.num}</span>
                      <div>
                        <span class="text-[10px] font-mono uppercase tracking-widest text-paper-crimson font-bold block">DOSSIER ${f.num}</span>
                        <a href="/issues/${f.slug}" class="text-xl sm:text-2xl font-editorial font-bold text-paper-primary group-hover:text-paper-crimson transition-colors no-underline">
                          ${escapeHtml(f.name)}
                        </a>
                      </div>
                    </div>
                    <div class="flex items-center gap-3 font-mono text-xs">
                      <span class="px-2 py-0.5 bg-white border border-paper text-paper-muted font-mono text-[11px]">${escapeHtml(f.metric)}</span>
                      <span class="stamp-badge stamp-paper-crimson">${escapeHtml(f.status)}</span>
                    </div>
                  </div>

                  <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-4xl pl-0 sm:pl-10">
                    ${escapeHtml(f.deck)}
                  </p>

                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-paper/60 pl-0 sm:pl-10 text-xs font-mono">
                    <div class="text-paper-muted text-[11px]">
                      HOLDING ENTITIES: <span class="text-paper-primary font-semibold">${escapeHtml(f.institutions.join(' · '))}</span>
                    </div>
                    <a href="/issues/${f.slug}" class="text-paper-crimson font-bold hover:underline inline-flex items-center gap-1">
                      <span>Inspect Complete Dossier</span>
                      <span>→</span>
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- SPECIAL FLAGSHIP REPORT CALLOUT (DOCUMENTARY FACSIMILE) -->
          <section class="p-6 sm:p-8 bg-white border border-paper-strong shadow-sm space-y-6">
            <div class="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-paper">
              <span class="text-xs font-mono uppercase tracking-widest text-paper-crimson font-bold">FLAGSHIP SPECIAL INVESTIGATION</span>
              <span class="text-xs font-mono text-paper-muted">33°53'N 10°05'E</span>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div class="lg:col-span-8 space-y-3">
                <h3 class="font-editorial text-2xl sm:text-3xl text-paper-primary">Gabès: Industrial Pollution &amp; State Inaction</h3>
                <p class="text-xs sm:text-sm text-paper-muted font-sans font-light leading-relaxed">
                  404TN’s deep-dive flagship investigation into the Groupe Chimique Tunisien (GCT) industrial complex at Chatt Essalam. Featuring satellite verification, environmental baseline comparisons, timeline of unfulfilled government relocation decrees, and documented atmospheric data deficits.
                </p>
              </div>
              <div class="lg:col-span-4 flex justify-start lg:justify-end">
                <a href="/gabes" class="px-6 sm:px-8 py-3.5 bg-paper-red hover:bg-red-800 text-white text-xs font-mono uppercase tracking-meta font-bold transition-colors inline-flex items-center gap-2 shadow-sm">
                  <span>Read Gabès Flagship Report</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </section>

          <!-- CROSS-LINK FOOTER -->
          <div class="pt-8 border-t border-paper flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <a href="/summer-2026" class="text-paper-muted hover:text-paper-primary hover:underline">← Summer 2026 Overview Dossier</a>
            <a href="/presidency" class="text-paper-crimson hover:underline font-bold">Inspect The Record of Power (2019–2026) →</a>
          </div>

        </div>
      </div>

    </article>
  `;
}
