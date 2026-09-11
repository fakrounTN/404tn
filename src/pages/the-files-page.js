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
    <article class="the-files-archive-page py-10 sm:py-16 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- HERO -->
      ${heroHtml}

      <!-- ARCHIVE LISTING -->
      <section class="space-y-6" aria-label="Archive Directory">
        <div class="space-y-1 pb-4 border-b border-surface-800">
          ${sectionKicker('SYSTEMIC DOSSIERS')}
          ${sectionHeading('The 7 Core Investigative Dossiers', 'Every dossier contains verified baseline indicators, institutional responsibility mappings, state responses, primary gazette documents, and documented data gaps.')}
        </div>

        <div class="divide-y divide-surface-800 border-y border-surface-800 font-sans">
          ${files.map(f => `
            <div class="py-8 group hover:bg-surface-900/30 transition-colors px-4 space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div class="flex items-baseline gap-4">
                  <span class="num-archival text-3xl font-light text-surface-500 group-hover:text-crimson transition-colors font-mono">${f.num}</span>
                  <div>
                    <span class="text-[10px] font-mono uppercase tracking-widest text-crimson font-bold block">DOSSIER ${f.num}</span>
                    <a href="/issues/${f.slug}" class="text-xl sm:text-2xl font-bold text-bone-100 group-hover:text-crimson transition-colors no-underline">
                      ${escapeHtml(f.name)}
                    </a>
                  </div>
                </div>
                <div class="flex items-center gap-3 font-mono text-xs">
                  <span class="px-2 py-0.5 bg-surface-900 border border-surface-800 text-sand">${escapeHtml(f.metric)}</span>
                  <span class="px-2 py-0.5 bg-crimson/15 text-crimson border border-crimson/30 uppercase font-semibold text-[10px]">${escapeHtml(f.status)}</span>
                </div>
              </div>

              <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed max-w-4xl pl-0 sm:pl-12">
                ${escapeHtml(f.deck)}
              </p>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-surface-800/60 pl-0 sm:pl-12 text-xs font-mono">
                <div class="text-surface-400 text-[11px]">
                  HOLDING ENTITIES: <span class="text-bone-100">${escapeHtml(f.institutions.join(' · '))}</span>
                </div>
                <a href="/issues/${f.slug}" class="text-crimson font-bold hover:underline inline-flex items-center gap-1">
                  <span>Inspect Complete Dossier</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- SPECIAL FLAGSHIP REPORT CALLOUT -->
      <section class="p-8 bg-background-elevated border border-crimson/40 space-y-6">
        <div class="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-surface-800">
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-bold">FLAGSHIP SPECIAL INVESTIGATION</span>
          <span class="text-xs font-mono text-sand">33°53'N 10°05'E</span>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div class="lg:col-span-8 space-y-3">
            <h3 class="font-editorial text-3xl text-bone-100">Gabès: Industrial Pollution &amp; State Inaction</h3>
            <p class="text-xs sm:text-sm text-surface-300 font-sans font-light leading-relaxed">
              404TN’s deep-dive flagship investigation into the Groupe Chimique Tunisien (GCT) industrial complex at Chatt Essalam. Featuring satellite verification, environmental baseline comparisons, timeline of unfulfilled government relocation decrees, and documented atmospheric data deficits.
            </p>
          </div>
          <div class="lg:col-span-4 flex justify-start lg:justify-end">
            <a href="/gabes" class="px-8 py-4 bg-crimson hover:bg-crimson-muted text-white text-xs font-mono uppercase tracking-meta font-bold transition-colors inline-flex items-center gap-2">
              <span>Read Gabès Flagship Report</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </section>

      <!-- CROSS-LINK FOOTER -->
      <div class="pt-8 border-t border-surface-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <a href="/summer-2026" class="text-sand hover:underline">← Summer 2026 Overview Dossier</a>
        <a href="/presidency" class="text-crimson hover:underline font-bold">Inspect The Record of Power (2019–2026) →</a>
      </div>

    </article>
  `;
}
