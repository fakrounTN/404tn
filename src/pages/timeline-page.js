// src/pages/timeline-page.js
// 404TN — Documentary Chronology & Incident Timeline (Route: /timeline)

import { escapeHtml } from '../utils.js';
import {
  investigationHero,
  sectionKicker,
  sectionHeading,
  classificationBadge,
  sourceReference
} from '../editorial-components.js';

export function renderTimelineHtml() {
  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt; 
      <span class="text-bone-100 font-medium">Summer 2026 Timeline</span>
    </nav>
  `;

  const heroHtml = investigationHero({
    breadcrumbHtml,
    eyebrow: "CHRONOLOGY OF EVENTS",
    badge: "DOCUMENTARY TIMELINE",
    badgeClass: "bg-surface-900 border-surface-700 text-bone-100 font-bold",
    h1: "Summer 2026 Incident Chronology",
    deck: "Temporal audit of infrastructure disruptions, official announcements, citizen actions, and state interventions across Tunisia.",
    metadataItems: [
      { label: "TIMELINE WINDOW", value: "JUNE → SEPT 2026", highlight: true, subtext: "SUMMER 2026 SEASON" },
      { label: "VERIFICATION LEVEL", value: "TRIPARTITE AUDIT", highlight: false, subtext: "PRIMARY SOURCES ONLY" },
      { label: "GEOGRAPHIC SCOPE", value: "24 GOVERNORATES", highlight: false, subtext: "NATIONAL NETWORK" },
      { label: "SOURCE ANCHORS", value: "GAZETTE & WITNESS", highlight: false, subtext: "TRACEABLE CITATIONS" }
    ]
  });

  const timelineEvents = [
    {
      id: "TL-2026-06-01",
      date: "2026-06-01",
      month: "JUNE",
      topic: "WATER",
      title: "SONEDE Potable Water Rationing Order Enacted",
      summary: "SONEDE implements unannounced night-time pressure reductions across Sfax, Sousse, and Greater Tunis as national dam reserves drop to 21.4% capacity.",
      classification: "FACT",
      institution: "National Water Distribution Utility (SONEDE)",
      source: "ONAGRI Hydraulic Bulletin / SONEDE Circular",
      relatedDossier: "/issues/water"
    },
    {
      id: "TL-2026-06-15",
      date: "2026-06-15",
      month: "JUNE",
      topic: "ENVIRONMENT",
      title: "Gulf of Gabès Marine Water Discoloration Documented",
      summary: "Local fishermen and environmental groups in Chatt Essalam record acidic discoloration along the coastal canal following heavy industrial output from the GCT phosphoric acid plant.",
      classification: "FACT",
      institution: "Groupe Chimique Tunisien (GCT)",
      source: "Local Environmental Testimony & Maritime AIS Logs",
      relatedDossier: "/gabes"
    },
    {
      id: "TL-2026-07-04",
      date: "2026-07-04",
      month: "JULY",
      topic: "ENERGY",
      title: "STEG National Grid Reaches 4,825 MW Summer Demand Peak",
      summary: "Record thermal temperatures drive electrical air conditioning load to 4,825 MW, triggering automatic frequency shedding and localised blackouts in coastal suburbs.",
      classification: "FACT",
      institution: "Société Tunisienne de l'Electricité et du Gaz (STEG)",
      source: "STEG Dispatch Operations Bulletin (July 2026)",
      relatedDossier: "/issues/electricity"
    },
    {
      id: "TL-2026-07-18",
      date: "2026-07-18",
      month: "JULY",
      topic: "GOVERNANCE",
      title: "Decree-Law 54 Enforcement Statistics Released",
      summary: "National journalists' union (SNJT) and human rights lawyers document over 40 ongoing investigations and detentions targeting journalists, commentators, and political figures under Article 24.",
      classification: "CLAIM",
      institution: "Ministry of Justice / SNJT",
      source: "SNJT Press Freedom Annual Report 2026",
      relatedDossier: "/issues/rights"
    },
    {
      id: "TL-2026-08-02",
      date: "2026-08-02",
      month: "AUGUST",
      topic: "ECONOMY",
      title: "INS Q2 2026 Labor Survey: Graduate Joblessness at 38.8%",
      summary: "National Institute of Statistics reports youth unemployment expanding to 38.8% among higher education diploma holders, confirming deep labor market stagnation.",
      classification: "FACT",
      institution: "Institut National de la Statistique (INS)",
      source: "INS Bulletin Statistique de l'Emploi (T2 2026)",
      relatedDossier: "/issues/work"
    },
    {
      id: "TL-2026-08-15",
      date: "2026-08-15",
      month: "AUGUST",
      topic: "MIGRATION",
      title: "Mediterranean Border Interceptions Surge in Sfax Corridor",
      summary: "National Guard maritime units report intercepting over 2,400 individuals attempting sea crossings from Sfax and Kerkennah during favorable weather windows.",
      classification: "FACT",
      institution: "National Guard Maritime Command / Ministry of Interior",
      source: "Ministry of Interior Official Communiqué (August 2026)",
      relatedDossier: "/issues/migration"
    },
    {
      id: "TL-2026-09-01",
      date: "2026-09-01",
      month: "SEPTEMBER",
      topic: "GOVERNANCE",
      title: "Five-Year Post-July 25 Governance Assessment",
      summary: "404TN completes multi-year comparative audit of concentrated executive authority under the 2022 Constitution against measurable public infrastructure outcomes.",
      classification: "ANALYSIS",
      institution: "Presidency of the Republic / 404TN Audit",
      source: "404TN Record of Power Architecture (R2.1 / R2.2)",
      relatedDossier: "/presidency"
    }
  ];

  return `
    <article class="timeline-chronology-page py-10 sm:py-16 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- HERO -->
      ${heroHtml}

      <!-- TIMELINE CONTROLS & FILTER BAR -->
      <section class="space-y-6" aria-label="Incident Chronology">
        
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-surface-800">
          <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button class="px-4 py-2 bg-surface-800 text-bone-100 border border-crimson font-bold uppercase tracking-meta" data-timeline-month="ALL">All Months</button>
            <button class="px-4 py-2 bg-surface-900 border border-surface-800 text-surface-400 hover:text-bone-100 uppercase tracking-meta" data-timeline-month="JUNE">June</button>
            <button class="px-4 py-2 bg-surface-900 border border-surface-800 text-surface-400 hover:text-bone-100 uppercase tracking-meta" data-timeline-month="JULY">July</button>
            <button class="px-4 py-2 bg-surface-900 border border-surface-800 text-surface-400 hover:text-bone-100 uppercase tracking-meta" data-timeline-month="AUGUST">August</button>
            <button class="px-4 py-2 bg-surface-900 border border-surface-800 text-surface-400 hover:text-bone-100 uppercase tracking-meta" data-timeline-month="SEPTEMBER">September</button>
          </div>
          <div class="w-full sm:w-64">
            <select id="timeline-topic-select" class="w-full px-3 py-2 bg-background border border-surface-800 text-xs font-mono text-bone-100 focus:outline-none focus:border-crimson" aria-label="Filter by Topic">
              <option value="ALL">All Sectors (07 Files)</option>
              <option value="WATER">Water &amp; Dams</option>
              <option value="ENERGY">Electricity &amp; Grid</option>
              <option value="ENVIRONMENT">Environment &amp; Pollution</option>
              <option value="ECONOMY">Labor &amp; Employment</option>
              <option value="MIGRATION">Migration &amp; Borders</option>
              <option value="PUBLIC SERVICES">Public Services</option>
              <option value="GOVERNANCE">Governance &amp; Rights</option>
            </select>
          </div>
        </div>

        <!-- TIMELINE EVENT CARDS -->
        <div id="timeline-events-container" class="space-y-6">
          ${timelineEvents.map(ev => `
            <div class="p-6 bg-background-elevated border border-surface-800 hover:border-surface-700 transition-colors space-y-4 font-sans" id="${escapeHtml(ev.id)}">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-800">
                <div class="flex items-center gap-3 flex-wrap">
                  <time class="text-xs font-mono font-bold text-crimson">${escapeHtml(ev.date)}</time>
                  <span class="text-[9px] font-mono uppercase px-2 py-0.5 bg-surface-900 border border-surface-800 text-sand font-bold">${escapeHtml(ev.topic)}</span>
                  ${classificationBadge(ev.classification)}
                </div>
                <div class="text-[10px] font-mono text-surface-500">
                  ID: <span class="text-surface-400">${escapeHtml(ev.id)}</span>
                </div>
              </div>

              <div class="space-y-2">
                <h3 class="font-sans font-bold text-bone-100 text-base sm:text-lg">${escapeHtml(ev.title)}</h3>
                <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed max-w-4xl">${escapeHtml(ev.summary)}</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-surface-800/80 text-xs font-mono">
                <div class="text-surface-400 text-[11px]">
                  INSTITUTION: <span class="text-bone-100">${escapeHtml(ev.institution)}</span>
                </div>
                <div class="text-surface-400 text-[11px] sm:text-right">
                  SOURCE: <span class="text-surface-300 italic">${escapeHtml(ev.source)}</span>
                </div>
              </div>

              <div class="pt-2 flex items-center justify-between text-xs font-mono text-sand">
                <a href="${escapeHtml(ev.relatedDossier)}" class="hover:underline flex items-center gap-1 font-bold">
                  <span>Inspect Associated Dossier</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          `).join('')}
        </div>

      </section>

      <!-- NAVIGATION FOOTER -->
      <div class="pt-8 border-t border-surface-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <a href="/summer-2026" class="text-sand hover:underline">← Summer 2026 Dossier</a>
        <a href="/state-response" class="text-crimson hover:underline font-bold">Inspect State Response Matrix →</a>
      </div>

    </article>
  `;
}
