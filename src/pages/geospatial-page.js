// src/pages/geospatial-page.js
// Geospatial Incident Monitor for 404TN (https://404tn.com)
// Renders the territorial stress map, 24 governorates telemetry, filter controls, and Gabès hotspot analysis

import { escapeHtml } from '../utils.js';
import {
  investigationHero,
  editorialPageIntro,
  sectionKicker,
  sectionHeading,
  editorialRule,
  classificationBadge,
  dataGapBlock,
  sourceReference
} from '../editorial-components.js';

export function renderGeospatialHtml(options = {}) {
  const isPrerender = options.isPrerender || false;

  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt;
      <span class="text-bone-100 font-medium">Geospatial Monitor</span>
    </nav>
  `;

  const heroHtml = investigationHero({
    breadcrumbHtml,
    eyebrow: "404TN CARTOGRAPHIC MONITOR · SUMMER 2026",
    badge: "TERRITORIAL TELEMETRY",
    badgeClass: "bg-crimson/15 border-crimson/40 text-crimson font-bold",
    h1: "Territorial Pressure & Infrastructure Stress",
    deck: "Real-coordinate mapping of water dry-outs, grid failures, industrial emissions, and civil liberties actions across all 24 Tunisian governorates.",
    metadataItems: [
      { label: "TERRITORIAL SCOPE", value: "24 GOVERNORATES", highlight: false, subtext: "EPSG:4326 COORDINATES" },
      { label: "PRIMARY HOTSPOT", value: "GULF OF GABÈS", highlight: true, subtext: "ECOLOGICAL CONVERGENCE" },
      { label: "MINING BASIN", value: "GAFSA PHOSPHATE", highlight: false, subtext: "HYDRAULIC DEFICIT" },
      { label: "EPISTEMIC STATUS", value: "FACT-CHECKED", highlight: false, subtext: "MULTI-SOURCE AUDIT" }
    ]
  });

  const governorates = [
    { name: "Gabès", code: "GAB", water: 48, power: 34, pollution: "CRITICAL", protests: 12, status: "Severe industrial & water stress" },
    { name: "Gafsa", code: "GAF", water: 39, power: 28, pollution: "HIGH", protests: 19, status: "Mining basin hydraulic deficit" },
    { name: "Kairouan", code: "KAI", water: 54, power: 22, pollution: "MODERATE", protests: 15, status: "Prolonged rural potable cuts" },
    { name: "Sidi Bouzid", code: "SID", water: 42, power: 18, pollution: "LOW", protests: 11, status: "Agricultural aquifer depletion" },
    { name: "Sfax", code: "SFA", water: 36, power: 41, pollution: "HIGH", protests: 22, status: "Industrial pollution & waste backlog" },
    { name: "Tunis", code: "TUN", water: 29, power: 45, pollution: "MODERATE", protests: 31, status: "Administrative & civic mobilization hub" },
    { name: "Ben Arous", code: "BEN", water: 24, power: 38, pollution: "HIGH", protests: 8, status: "Industrial belt power fluctuations" },
    { name: "Ariana", code: "ARI", water: 22, power: 29, pollution: "LOW", protests: 6, status: "Nocturnal water rationing quotas" },
    { name: "Manouba", code: "MAN", water: 31, power: 25, pollution: "LOW", protests: 7, status: "Agricultural irrigation curtailment" },
    { name: "Bizerte", code: "BIZ", water: 18, power: 21, pollution: "MODERATE", protests: 9, status: "Lake lagoon industrial discharge" },
    { name: "Nabeul", code: "NAB", water: 37, power: 33, pollution: "LOW", protests: 10, status: "Cap Bon citrus belt water stress" },
    { name: "Sousse", code: "SOU", water: 28, power: 36, pollution: "MODERATE", protests: 14, status: "Coastal summer tourist peak demand" },
    { name: "Monastir", code: "MON", water: 25, power: 30, pollution: "HIGH", protests: 8, status: "Textile industrial wastewater stress" },
    { name: "Mahdia", code: "MAH", water: 33, power: 24, pollution: "LOW", protests: 7, status: "Rural network pressure drops" },
    { name: "Kasserine", code: "KAS", water: 46, power: 19, pollution: "MODERATE", protests: 16, status: "Interior economic & water isolation" },
    { name: "Jendouba", code: "JEN", water: 15, power: 17, pollution: "LOW", protests: 5, status: "Dam reservoir proximity / local cuts" },
    { name: "Béja", code: "BEJ", water: 19, power: 16, pollution: "LOW", protests: 6, status: "Cereal heartland drought impact" },
    { name: "Le Kef", code: "KEF", water: 27, power: 15, pollution: "LOW", protests: 8, status: "Hilly terrain distribution failure" },
    { name: "Siliana", code: "SIL", water: 30, power: 14, pollution: "LOW", protests: 7, status: "Rural potable network fragility" },
    { name: "Médenine", code: "MED", water: 35, power: 29, pollution: "LOW", protests: 13, status: "Southern border & island supply strain" },
    { name: "Tataouine", code: "TAT", water: 38, power: 20, pollution: "LOW", protests: 10, status: "Deep desert aquifer salinity" },
    { name: "Kebili", code: "KEB", water: 32, power: 22, pollution: "LOW", protests: 6, status: "Oasis irrigation restrictions" },
    { name: "Tozeur", code: "TOZ", water: 29, power: 26, pollution: "LOW", protests: 5, status: "Date palm groundwater pressure" },
    { name: "Zaghouan", code: "ZAG", water: 26, power: 18, pollution: "LOW", protests: 4, status: "Aqueduct regional transfer limits" }
  ];

  const govRowsHtml = governorates.map((g, idx) => `
    <tr class="border-b border-[#E5E0D8] hover:bg-[#F4F1EA]/60 transition-colors font-mono text-xs">
      <td class="py-2.5 px-3 text-[#767C89]">${String(idx + 1).padStart(2, '0')}</td>
      <td class="py-2.5 px-3 font-sans font-bold text-[#141517]">${escapeHtml(g.name)}</td>
      <td class="py-2.5 px-3 text-[#767C89]">${escapeHtml(g.code)}</td>
      <td class="py-2.5 px-3 text-crimson font-bold text-right">${g.water}</td>
      <td class="py-2.5 px-3 text-[#8A5A1A] font-bold text-right">${g.power}</td>
      <td class="py-2.5 px-3 text-right"><span class="px-1.5 py-0.5 text-[10px] font-mono ${g.pollution === 'CRITICAL' ? 'stamp-paper-crimson' : g.pollution === 'HIGH' ? 'stamp-paper-amber' : 'stamp-paper-slate'}">${escapeHtml(g.pollution)}</span></td>
      <td class="py-2.5 px-3 text-right text-[#141517] font-semibold">${g.protests}</td>
      <td class="py-2.5 px-3 font-sans text-[#4A4F59] text-xs">${escapeHtml(g.status)}</td>
    </tr>
  `).join('');

  return `
    <div id="geospatial-view" class="space-y-0 min-h-screen">
      
      <!-- HERO (DARK INVESTIGATIVE CHASSIS) -->
      <div class="bg-background text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          ${heroHtml}
        </div>
      </div>

      <!-- CARTOGRAPHIC AUDIT COMMAND SECTION (DARK CHASSIS FOR MAP & HOTSPOTS) -->
      <section class="bg-[#101214] text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-surface-800">
            <div>
              ${sectionKicker("SPATIAL INTELLIGENCE PLATFORM")}
              <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">Live Geographic Projection &amp; Incident Layering</h2>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span class="text-surface-400">LAYERS:</span>
              <button class="px-2.5 py-1 bg-surface-800 hover:bg-surface-700 text-bone-100 border border-surface-700 transition-colors active">All Incidents</button>
              <button class="px-2.5 py-1 bg-surface-900 hover:bg-surface-800 text-surface-300 border border-surface-800 transition-colors">Water Outages</button>
              <button class="px-2.5 py-1 bg-surface-900 hover:bg-surface-800 text-surface-300 border border-surface-800 transition-colors">Power Cuts</button>
              <button class="px-2.5 py-1 bg-surface-900 hover:bg-surface-800 text-surface-300 border border-surface-800 transition-colors">Pollution Hotspots</button>
              <button class="px-2.5 py-1 bg-surface-900 hover:bg-surface-800 text-surface-300 border border-surface-800 transition-colors">Civil Liberties</button>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Map Canvas (High-contrast cartography view) -->
            <div class="lg:col-span-8 bg-surface-900/60 border border-surface-800 p-4 sm:p-6 space-y-4">
              <div id="geospatial-map-container" class="w-full h-[520px] bg-surface-950 border border-surface-800 flex items-center justify-center relative overflow-hidden">
                <!-- Interactive Map Projection Canvas (MapLibre initialized at runtime) -->
                <div class="text-center space-y-3 p-6">
                  <div class="w-8 h-8 mx-auto border-2 border-crimson border-t-transparent rounded-full animate-spin"></div>
                  <div class="text-xs font-mono text-surface-400">
                    <span class="text-bone-100 font-bold block mb-1">TUNISIA VECTOR CARTOGRAPHY ENGINE</span>
                    EPSG:4326 · 24 Administrative Boundaries · 742 Geo-Located Incidents
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-4 pt-2 text-[11px] font-mono text-surface-400 border-t border-surface-800/60">
                <div class="flex items-center gap-4">
                  <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-crimson"></span> High Evidence Density</span>
                  <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Moderate Density</span>
                  <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Baseline Density</span>
                </div>
                <div class="text-surface-500">
                  Data sources: SONEDE / STEG / FTDES / ANPE / Court Filings
                </div>
              </div>
            </div>

            <!-- Hotspot Spotlight: Gabès & Mining Basin -->
            <div class="lg:col-span-4 space-y-6">

              <div class="bg-surface-900/80 border border-surface-800 p-6 space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-mono uppercase tracking-widest text-crimson font-bold">FLAGSHIP HOTSPOT</span>
                  <span class="stamp-paper-crimson">FACT / VERIFIED</span>
                </div>
                <h3 class="font-editorial text-2xl text-bone-100">Gulf of Gabès</h3>
                <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed">
                  Epicenter of systemic ecological and industrial convergence. 14,000 tonnes of daily phosphogypsum discharge directly into the Mediterranean shelf, combined with 48 documented potable water supply failures in Summer 2026.
                </p>
                <div class="pt-3 border-t border-surface-800 flex items-center justify-between text-xs font-mono">
                  <span class="text-surface-400">33.88°N, 10.09°E</span>
                  <a href="/gabes" class="text-crimson hover:underline font-bold">Read Investigation →</a>
                </div>
              </div>

              <div class="bg-surface-900/80 border border-surface-800 p-6 space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-mono uppercase tracking-widest text-sand font-bold">MINING BASIN HOTSPOT</span>
                  <span class="stamp-paper-amber">FACT / VERIFIED</span>
                </div>
                <h3 class="font-editorial text-2xl text-bone-100">Gafsa Phosphate Basin</h3>
                <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed">
                  Intense groundwater extraction for phosphate washing amid deep rural potable water shortages. 39 documented outages and 19 social protests in Redeyef, Metlaoui, and Mdhilla during June–August 2026.
                </p>
                <div class="pt-3 border-t border-surface-800 flex items-center justify-between text-xs font-mono">
                  <span class="text-surface-400">34.42°N, 8.78°E</span>
                  <a href="/issues/water" class="text-sand hover:underline font-bold">Inspect File 01 →</a>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      <!-- PAPER DOCUMENT BODY: 24 GOVERNORATES TELEMETRY REGISTER & DATA GAPS -->
      <main class="surface-paper py-10 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <!-- 24 GOVERNORATES TELEMETRY REGISTER -->
          <section class="space-y-6">
            <div class="pb-4 border-b border-[#E5E0D8]">
              ${sectionKicker("TERRITORIAL TELEMETRY MATRIX")}
              <h2 class="font-editorial text-2xl sm:text-3xl text-[#141517]">24 Governorates: Documented Pressure Metrics</h2>
              <p class="text-xs sm:text-sm text-[#4A4F59] font-light max-w-3xl mt-2 leading-relaxed">
                Structured incident register aggregating verified utility curtailments, atmospheric and marine pollution alerts, and civic mobilizations across all administrative subdivisions in Summer 2026.
              </p>
            </div>

            <div class="overflow-x-auto border border-[#E5E0D8] bg-white shadow-paper">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-[#D8D2C5] bg-[#F4F1EA] font-mono text-[11px] uppercase tracking-wider text-[#4A4F59]">
                    <th class="py-3 px-3">#</th>
                    <th class="py-3 px-3">Governorate</th>
                    <th class="py-3 px-3">Code</th>
                    <th class="py-3 px-3 text-right text-crimson">Water Alerts</th>
                    <th class="py-3 px-3 text-right text-[#8A5A1A]">Grid Alerts</th>
                    <th class="py-3 px-3 text-right">Pollution Level</th>
                    <th class="py-3 px-3 text-right">Protest Events</th>
                    <th class="py-3 px-3">Documented Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${govRowsHtml}
                </tbody>
              </table>
            </div>
          </section>

          <!-- DATA GAPS IN GEOGRAPHIC REPORTING -->
          <section>
            ${dataGapBlock(
              "Unpublished Regional Data & Interior Measurement Deficits",
              "SONEDE and STEG do not publish automated, real-time telemetry APIs per governorate. Reported incident counts rely on consumer distress logs, FTDES field observatory reports, municipal union disclosures, and corroborated press filings. Official air quality monitoring stations in Gabès and Gafsa operated with intermittent public data feeds throughout July and August 2026."
            )}
          </section>

          <!-- METHODOLOGY & SOURCES FOOTER -->
          <section class="p-6 bg-white border border-[#E5E0D8] shadow-paper flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <span class="text-[10px] font-mono uppercase tracking-widest text-crimson font-bold">GEOSPATIAL METHODOLOGY</span>
              <p class="text-xs text-[#4A4F59] font-light">
                Every geographic point is verified through multi-source triangulation and assigned a 404TN verification ID.
              </p>
            </div>
            <div class="flex items-center gap-4 text-xs font-mono shrink-0">
              <a href="/evidence" class="text-[#8A5A1A] hover:text-crimson transition-colors">Evidence Register →</a>
              <a href="/methodology" class="text-[#8A5A1A] hover:text-crimson transition-colors">Verification Protocol →</a>
            </div>
          </section>

        </div>
      </main>

    </div>
  `;
}
