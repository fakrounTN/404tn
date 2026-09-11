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
    <article class="methodology-standards-page">
      
      <!-- A. METHODOLOGY OPENER (DARK INVESTIGATIVE CHASSIS) -->
      <div class="bg-background text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          ${heroHtml}
        </div>
      </div>

      <!-- B. EDITORIAL STANDARDS DOCUMENT (WARM ARCHIVAL PAPER SURFACE) -->
      <div class="surface-paper py-10 sm:py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

          <!-- TRIPARTITE CLASSIFICATION FRAMEWORK -->
          <section class="space-y-6" aria-label="Epistemic Classification">
            <div class="space-y-1 pb-4 border-b border-paper">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-0.5 bg-paper-red inline-block"></span>
                <span class="text-xs font-mono uppercase tracking-widest text-paper-crimson font-bold">EPISTEMIC CLASSIFICATION</span>
              </div>
              <h2 class="font-editorial text-2xl sm:text-3xl text-paper-primary font-normal">The Three-Tier Classification Standard</h2>
              <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-2xl">
                To prevent political discourse from being mistaken for empirical fact, 404TN applies strict epistemic segregation across all published material.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">

              <!-- FACT -->
              <div class="p-6 bg-white border border-paper shadow-sm space-y-4">
                <div class="flex items-center justify-between pb-2 border-b border-paper">
                  <span class="stamp-badge stamp-paper-fact">FACT</span>
                  <span class="text-[10px] font-mono text-paper-primary font-bold">EMPIRICAL BASELINE</span>
                </div>
                <h3 class="font-editorial font-bold text-paper-primary text-base sm:text-lg">Directly Substantiated Assertions</h3>
                <p class="text-xs text-paper-muted font-light leading-relaxed">
                  Discrete factual claims verified directly via official state gazettes (JORT), statutory bulletins (INS, BCT, ONAGRI), definitive election results certified by ISIE, or multi-source corroborated documentary evidence.
                </p>
                <div class="text-[10px] font-mono text-paper-dim pt-2 border-t border-paper/60">
                  Rule: Never applied to unverified government announcements.
                </div>
              </div>

              <!-- CLAIM -->
              <div class="p-6 bg-white border border-paper shadow-sm space-y-4">
                <div class="flex items-center justify-between pb-2 border-b border-paper">
                  <span class="stamp-badge stamp-paper-claim">CLAIM · ATTRIBUTED</span>
                  <span class="text-[10px] font-mono text-amber-800 font-bold">ATTRIBUTED DISCOURSE</span>
                </div>
                <h3 class="font-editorial font-bold text-paper-primary text-base sm:text-lg">Attributed Political Statements</h3>
                <p class="text-xs text-paper-muted font-light leading-relaxed">
                  Official government declarations, ministerial justifications, political speech excerpts, opposition allegations, or uncorroborated witness testimony. Preserved as attributed discourse; never converted to factual baseline.
                </p>
                <div class="text-[10px] font-mono text-paper-dim pt-2 border-t border-paper/60">
                  Rule: Speaker, role, date, and venue must be explicit.
                </div>
              </div>

              <!-- ANALYSIS -->
              <div class="p-6 bg-white border border-paper shadow-sm space-y-4">
                <div class="flex items-center justify-between pb-2 border-b border-paper">
                  <span class="stamp-badge stamp-paper-analysis">ANALYSIS</span>
                  <span class="text-[10px] font-mono text-paper-crimson font-bold">INVESTIGATIVE SYNTHESIS</span>
                </div>
                <h3 class="font-editorial font-bold text-paper-primary text-base sm:text-lg">404TN Editorial Interpretation</h3>
                <p class="text-xs text-paper-muted font-light leading-relaxed">
                  Contextual synthesis, institutional accountability evaluations, and causal analysis derived from documented legal changes, economic trendlines, and comparative multi-year indicators.
                </p>
                <div class="text-[10px] font-mono text-paper-dim pt-2 border-t border-paper/60">
                  Rule: Must be clearly demarcated from primary evidence.
                </div>
              </div>

            </div>
          </section>

          <!-- SOURCE HIERARCHY -->
          <section class="p-6 sm:p-8 bg-white border border-paper shadow-sm space-y-6">
            <div class="space-y-1 pb-4 border-b border-paper">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-0.5 bg-paper-red inline-block"></span>
                <span class="text-xs font-mono uppercase tracking-widest text-paper-crimson font-bold">PROVENANCE HIERARCHY</span>
              </div>
              <h2 class="font-editorial text-2xl sm:text-3xl text-paper-primary font-normal">The 6-Category Source Hierarchy</h2>
              <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-2xl">
                Every record published on 404TN is indexed with explicit source provenance according to its institutional nature and legal authority.
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
              <div class="p-4 bg-paper-subtle/50 border border-paper space-y-2">
                <span class="text-[10px] font-mono text-paper-crimson font-bold block">1 · PRIMARY OFFICIAL / LEGAL</span>
                <div class="font-bold text-paper-primary">Statutory Gazettes &amp; Decrees</div>
                <p class="text-paper-muted font-light text-[11px] leading-relaxed">Journal Officiel de la République Tunisienne (JORT), presidential decrees, statutory court rulings (Administrative Court), and official treaties.</p>
              </div>
              <div class="p-4 bg-paper-subtle/50 border border-paper space-y-2">
                <span class="text-[10px] font-mono text-amber-800 font-bold block">2 · TUNISIAN PUBLIC INSTITUTIONS</span>
                <div class="font-bold text-paper-primary">Official National Agencies</div>
                <p class="text-paper-muted font-light text-[11px] leading-relaxed">INS quarterly labor reports, ANPE environmental monitoring, ONAGRI water balances, STEG electrical dispatch logs, and Central Bank (BCT) financial bulletins.</p>
              </div>
              <div class="p-4 bg-paper-subtle/50 border border-paper space-y-2">
                <span class="text-[10px] font-mono text-paper-dim font-bold block">3 · INDEPENDENT CIVIL SOCIETY / NGO</span>
                <div class="font-bold text-paper-primary">Accredited Civic Monitoring</div>
                <p class="text-paper-muted font-light text-[11px] leading-relaxed">FTDES social observatory protest logs, SNJT press freedom audits, IWatch anti-corruption monitoring, and Tunisian Human Rights League (LTDH) filings.</p>
              </div>
              <div class="p-4 bg-paper-subtle/50 border border-paper space-y-2">
                <span class="text-[10px] font-mono text-paper-primary font-bold block">4 · SURVEY &amp; ACADEMIC RESEARCH</span>
                <div class="font-bold text-paper-primary">Scientific &amp; Polling Studies</div>
                <p class="text-paper-muted font-light text-[11px] leading-relaxed">Arab Barometer public opinion surveys, Afrobarometer polling, and peer-reviewed university research papers.</p>
              </div>
              <div class="p-4 bg-paper-subtle/50 border border-paper space-y-2">
                <span class="text-[10px] font-mono text-paper-crimson font-bold block">5 · INTERNATIONAL INSTITUTIONS</span>
                <div class="font-bold text-paper-primary">Multilateral Audits &amp; Ratings</div>
                <p class="text-paper-muted font-light text-[11px] leading-relaxed">World Bank economic assessments, IMF staff reports, UN agency field data (UNHCR/IOM), and international sovereign rating agencies (Moody's, Fitch).</p>
              </div>
              <div class="p-4 bg-paper-subtle/50 border border-paper space-y-2">
                <span class="text-[10px] font-mono text-amber-800 font-bold block">6 · INDEPENDENT JOURNALISM</span>
                <div class="font-bold text-paper-primary">Corroborated Field Reporting</div>
                <p class="text-paper-muted font-light text-[11px] leading-relaxed">Multi-source verified investigative press reporting, field witness accounts, and corroborated regional journalism.</p>
              </div>
            </div>
          </section>

          <!-- DATA GAPS POLICY (PAPER CALLOUT) -->
          <section class="p-5 sm:p-6 bg-paper-subtle border-l-4 border-amber-600 border-y border-r border-paper space-y-2 font-sans">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-amber-600"></span>
              <span class="text-xs font-mono uppercase font-bold tracking-meta text-amber-900">404TN DATA GAPS POLICY</span>
            </div>
            <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed">
              When continuously published public datasets cannot be identified or remain unpublished by state agencies (such as continuous ambient emissions feeds in Gabès or itemized penal reconciliation accounts), 404TN does not generate speculative estimates. Instead, we document the omission as a formal <strong>DATA GAP</strong>, identifying the accountable authority, the affected period, and why the omission matters to the public interest.
            </p>
          </section>

          <!-- NAVIGATION FOOTER -->
          <div class="pt-8 border-t border-paper flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <a href="/evidence" class="text-paper-muted hover:text-paper-primary hover:underline">← Evidence Register</a>
            <a href="/statement" class="text-paper-crimson hover:underline font-bold">Read Editorial Mission &amp; Statement →</a>
          </div>

        </div>
      </div>

    </article>
  `;
}
