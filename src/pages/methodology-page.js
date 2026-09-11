// src/pages/methodology-page.js
// 404TN — Evidence Standards & Verification Methodology (Route: /methodology)

import { escapeHtml } from '../utils.js';
import {
  investigationHero,
  sectionKicker,
  sectionHeading,
  classificationBadge,
  methodologyNote
} from '../editorial-components.js';

export function renderMethodologyHtml() {
  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt; 
      <span class="text-bone-100 font-medium">Methodology</span>
    </nav>
  `;

  const heroHtml = investigationHero({
    breadcrumbHtml,
    eyebrow: "VERIFICATION DISCIPLINE",
    badge: "EPISTEMIC STANDARDS",
    badgeClass: "bg-surface-900 border-surface-700 text-bone-100 font-bold",
    h1: "Evidence, Standards & Provenance",
    deck: "How 404TN investigates, categorizes, attributes, and verifies data. Why our independent political position never lowers our evidentiary threshold.",
    metadataItems: [
      { label: "STANDARDS VERSION", value: "DOC-2026-V2", highlight: true, subtext: "METHODOLOGY PROTOCOL" },
      { label: "CLASSIFICATION", value: "TRIPARTITE", highlight: false, subtext: "FACT / CLAIM / ANALYSIS" },
      { label: "PROVENANCE HIERARCHY", value: "4 TIERS", highlight: false, subtext: "PRIMARY TO SURVEY" },
      { label: "TRANSPARENCY RULE", value: "DATA GAPS LOGGED", highlight: false, subtext: "EXPLICIT DISCLOSURE" }
    ]
  });

  return `
    <article class="methodology-standards-page py-10 sm:py-16 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- HERO -->
      ${heroHtml}

      <!-- TRIPARTITE CLASSIFICATION FRAMEWORK -->
      <section class="space-y-6" aria-label="Epistemic Classification">
        <div class="space-y-1 pb-4 border-b border-surface-800">
          ${sectionKicker('EPISTEMIC CLASSIFICATION')}
          ${sectionHeading('The Three-Tier Classification Standard', 'To prevent political discourse from being mistaken for empirical fact, 404TN applies strict epistemic segregation across all published material.')}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
          
          <!-- FACT -->
          <div class="p-6 bg-background-elevated border border-surface-800 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-surface-800">
              <span class="text-[10px] font-mono px-2 py-0.5 bg-surface-900 border border-surface-700 text-bone-100 font-bold uppercase tracking-wider">FACT</span>
              <span class="text-[10px] font-mono text-emerald-400">EMPIRICAL BASELINE</span>
            </div>
            <h3 class="font-bold text-bone-100 text-base">Directly Substantiated Assertions</h3>
            <p class="text-xs text-surface-300 font-light leading-relaxed">
              Discrete factual claims verified directly via official state gazettes (JORT), statutory bulletins (INS, BCT, ONAGRI), definitive election results certified by ISIE, or multi-source corroborated documentary evidence.
            </p>
            <div class="text-[10px] font-mono text-surface-500 pt-2 border-t border-surface-800/60">
              Rule: Never applied to unverified government announcements.
            </div>
          </div>

          <!-- CLAIM -->
          <div class="p-6 bg-background-elevated border border-sand/30 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-surface-800">
              <span class="text-[10px] font-mono px-2 py-0.5 bg-sand/10 border border-sand/30 text-sand font-semibold uppercase tracking-wider">CLAIM · ATTRIBUTED</span>
              <span class="text-[10px] font-mono text-sand">ATTRIBUTED DISCOURSE</span>
            </div>
            <h3 class="font-bold text-bone-100 text-base">Attributed Political Statements</h3>
            <p class="text-xs text-surface-300 font-light leading-relaxed">
              Official government declarations, ministerial justifications, political speech excerpts, opposition allegations, or uncorroborated witness testimony. Preserved as attributed discourse; never converted to factual baseline.
            </p>
            <div class="text-[10px] font-mono text-surface-500 pt-2 border-t border-surface-800/60">
              Rule: Speaker, role, date, and venue must be explicit.
            </div>
          </div>

          <!-- ANALYSIS -->
          <div class="p-6 bg-background-elevated border border-crimson/30 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-surface-800">
              <span class="text-[10px] font-mono px-2 py-0.5 bg-crimson/10 border border-crimson/30 text-crimson font-semibold uppercase tracking-wider">ANALYSIS</span>
              <span class="text-[10px] font-mono text-crimson">INVESTIGATIVE SYNTHESIS</span>
            </div>
            <h3 class="font-bold text-bone-100 text-base">404TN Editorial Interpretation</h3>
            <p class="text-xs text-surface-300 font-light leading-relaxed">
              Contextual synthesis, institutional accountability evaluations, and causal analysis derived from documented legal changes, economic trendlines, and comparative multi-year indicators.
            </p>
            <div class="text-[10px] font-mono text-surface-500 pt-2 border-t border-surface-800/60">
              Rule: Must be clearly demarcated from primary evidence.
            </div>
          </div>

        </div>
      </section>

      <!-- SOURCE HIERARCHY -->
      <section class="p-8 bg-background-elevated border border-surface-800 space-y-6">
        <div class="space-y-1">
          ${sectionKicker('PROVENANCE HIERARCHY')}
          ${sectionHeading('The 6-Category Source Hierarchy', 'Every record published on 404TN is indexed with explicit source provenance according to its institutional nature and legal authority.')}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
          <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-2">
            <span class="text-[10px] font-mono text-crimson font-bold block">1 · PRIMARY OFFICIAL / LEGAL</span>
            <div class="font-bold text-bone-100">Statutory Gazettes &amp; Decrees</div>
            <p class="text-surface-300 font-light text-[11px] leading-relaxed">Journal Officiel de la République Tunisienne (JORT), presidential decrees, statutory court rulings (Administrative Court), and official treaties.</p>
          </div>
          <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-2">
            <span class="text-[10px] font-mono text-sand font-bold block">2 · TUNISIAN PUBLIC INSTITUTIONS</span>
            <div class="font-bold text-bone-100">Official National Agencies</div>
            <p class="text-surface-300 font-light text-[11px] leading-relaxed">INS quarterly labor reports, ANPE environmental monitoring, ONAGRI water balances, STEG electrical dispatch logs, and Central Bank (BCT) financial bulletins.</p>
          </div>
          <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-2">
            <span class="text-[10px] font-mono text-surface-400 font-bold block">3 · INDEPENDENT CIVIL SOCIETY / NGO</span>
            <div class="font-bold text-bone-100">Accredited Civic Monitoring</div>
            <p class="text-surface-300 font-light text-[11px] leading-relaxed">FTDES social observatory protest logs, SNJT press freedom audits, IWatch anti-corruption monitoring, and Tunisian Human Rights League (LTDH) filings.</p>
          </div>
          <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-2">
            <span class="text-[10px] font-mono text-bone-100 font-bold block">4 · SURVEY &amp; ACADEMIC RESEARCH</span>
            <div class="font-bold text-bone-100">Scientific &amp; Polling Studies</div>
            <p class="text-surface-300 font-light text-[11px] leading-relaxed">Arab Barometer public opinion surveys, Afrobarometer polling, and peer-reviewed university research papers.</p>
          </div>
          <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-2">
            <span class="text-[10px] font-mono text-emerald-400 font-bold block">5 · INTERNATIONAL INSTITUTIONS</span>
            <div class="font-bold text-bone-100">Multilateral Audits &amp; Ratings</div>
            <p class="text-surface-300 font-light text-[11px] leading-relaxed">World Bank economic assessments, IMF staff reports, UN agency field data (UNHCR/IOM), and international sovereign rating agencies (Moody's, Fitch).</p>
          </div>
          <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-2">
            <span class="text-[10px] font-mono text-amber-400 font-bold block">6 · INDEPENDENT JOURNALISM</span>
            <div class="font-bold text-bone-100">Corroborated Field Reporting</div>
            <p class="text-surface-300 font-light text-[11px] leading-relaxed">Multi-source verified investigative press reporting, field witness accounts, and corroborated regional journalism.</p>
          </div>
        </div>
      </section>

      <!-- DATA GAPS POLICY -->
      <section class="space-y-4">
        ${methodologyNote("404TN Data Gaps Policy: When continuously published public datasets cannot be identified or remain unpublished by state agencies (such as continuous ambient emissions feeds in Gabès or itemized penal reconciliation accounts), 404TN does not generate speculative estimates. Instead, we document the omission as a formal DATA GAP, identifying the accountable authority, the affected period, and why the omission matters to the public interest.")}
      </section>

      <!-- NAVIGATION FOOTER -->
      <div class="pt-8 border-t border-surface-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <a href="/evidence" class="text-sand hover:underline">← Evidence Register</a>
        <a href="/statement" class="text-crimson hover:underline font-bold">Read Editorial Mission &amp; Statement →</a>
      </div>

    </article>
  `;
}
