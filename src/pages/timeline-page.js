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
    <article class="timeline-chronology-page">
      
      <!-- A. CHRONOLOGY OPENER (DARK INVESTIGATIVE CHASSIS) -->
      <div class="bg-background text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          ${heroHtml}
        </div>
      </div>

      <!-- B. DOCUMENTARY TIMELINE STREAM (WARM ARCHIVAL PAPER SURFACE) -->
      <div class="surface-paper py-10 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <!-- TIMELINE CONTROLS & FILTER BAR -->
          <section class="space-y-6" aria-label="Incident Chronology">

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-paper">
              <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
                <button class="px-4 py-2 bg-paper-primary text-paper-bg-base border border-paper-primary font-bold uppercase tracking-meta" data-timeline-month="ALL">All Months</button>
                <button class="px-4 py-2 bg-white border border-paper text-paper-muted hover:text-paper-primary uppercase tracking-meta" data-timeline-month="JUNE">June</button>
                <button class="px-4 py-2 bg-white border border-paper text-paper-muted hover:text-paper-primary uppercase tracking-meta" data-timeline-month="JULY">July</button>
                <button class="px-4 py-2 bg-white border border-paper text-paper-muted hover:text-paper-primary uppercase tracking-meta" data-timeline-month="AUGUST">August</button>
                <button class="px-4 py-2 bg-white border border-paper text-paper-muted hover:text-paper-primary uppercase tracking-meta" data-timeline-month="SEPTEMBER">September</button>
              </div>
              <div class="w-full sm:w-64">
                <select id="timeline-topic-select" class="w-full px-3 py-2 bg-white border border-paper text-xs font-mono text-paper-primary focus:outline-none focus:border-paper-crimson" aria-label="Filter by Topic">
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

            <!-- OPEN BROADSHEET TIMELINE (ZERO CARD WALLS) -->
            <div id="timeline-events-container" class="relative pl-6 sm:pl-8 border-l-2 border-paper space-y-10 font-sans">
              ${timelineEvents.map(ev => `
                <div class="relative group space-y-3" id="${escapeHtml(ev.id)}">
                  <!-- Continuous Spine Node Dot -->
                  <span class="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-paper-crimson"></span>

                  <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div class="flex items-center gap-3 flex-wrap">
                      <time class="text-xs sm:text-sm font-mono font-bold text-paper-crimson">${escapeHtml(ev.date)}</time>
                      <span class="text-[9px] font-mono uppercase px-2 py-0.5 bg-paper-subtle border border-paper text-paper-muted font-bold">${escapeHtml(ev.topic)}</span>
                      ${classificationBadge(ev.classification, true)}
                    </div>
                    <div class="text-[10px] font-mono text-paper-dim">
                      ID: <span class="text-paper-muted">${escapeHtml(ev.id)}</span>
                    </div>
                  </div>

                  <div class="space-y-1.5">
                    <h3 class="font-editorial font-bold text-paper-primary text-lg sm:text-xl">${escapeHtml(ev.title)}</h3>
                    <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-4xl">${escapeHtml(ev.summary)}</p>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-paper/60 text-xs font-mono text-paper-dim">
                    <div>
                      INSTITUTION: <span class="text-paper-primary font-semibold">${escapeHtml(ev.institution)}</span>
                    </div>
                    <div class="sm:text-right">
                      SOURCE: <span class="text-paper-muted italic">${escapeHtml(ev.source)}</span>
                    </div>
                  </div>

                  <div class="pt-1">
                    <a href="${escapeHtml(ev.relatedDossier)}" class="text-paper-crimson font-bold hover:underline inline-flex items-center gap-1 text-xs font-mono">
                      <span>Inspect Associated Dossier</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>

          </section>

          <!-- NAVIGATION FOOTER -->
          <div class="pt-8 border-t border-paper flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <a href="/summer-2026" class="text-paper-muted hover:text-paper-primary hover:underline">← Summer 2026 Dossier</a>
            <a href="/state-response" class="text-paper-crimson hover:underline font-bold">Inspect State Response Matrix →</a>
          </div>

        </div>
      </div>

    </article>
  `;
}
