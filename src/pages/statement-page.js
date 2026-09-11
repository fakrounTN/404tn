// src/pages/statement-page.js
// 404TN — Editorial Mission, Accountability Mandate & Public Statement (Route: /statement)

import { escapeHtml } from '../utils.js';
import {
  investigationHero,
  sectionKicker,
  sectionHeading,
  editorialRule
} from '../editorial-components.js';

export function renderStatementHtml() {
  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt; 
      <span class="text-bone-100 font-medium">Mission &amp; Statement</span>
    </nav>
  `;

  const heroHtml = investigationHero({
    breadcrumbHtml,
    eyebrow: "EDITORIAL MANDATE",
    badge: "PUBLIC STATEMENT",
    badgeClass: "bg-crimson/15 border-crimson/40 text-crimson font-bold",
    h1: "Mission & Editorial Statement",
    deck: "404TN is an independent Tunisian political opposition, investigative, and accountability project dedicated to documenting the exercise and concentration of state power.",
    metadataItems: [
      { label: "FOUNDING PRINCIPLE", value: "EVIDENCE FIRST", highlight: true, subtext: "ACCOUNTABILITY JOURNALISM" },
      { label: "EDITORIAL POSITION", value: "INDEPENDENT OPPOSITION", highlight: false, subtext: "CRITICAL OF HYPER-PRESIDENCY" },
      { label: "EVIDENTIARY THRESHOLD", value: "UNCOMPROMISED", highlight: false, subtext: "SAME STANDARD FOR ALL" },
      { label: "PUBLIC ARCHIVE", value: "OPEN ACCESS", highlight: false, subtext: "FREE REPRODUCIBILITY" }
    ]
  });

  return `
    <div class="statement-editorial-page min-h-screen">
      
      <!-- HERO (DARK INVESTIGATIVE CHASSIS) -->
      <div class="bg-background text-bone-100 py-10 sm:py-14 border-b border-surface-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          ${heroHtml}
        </div>
      </div>

      <!-- PAPER DOCUMENT BODY: CHARTER / CODE OF ETHICS -->
      <main class="surface-paper py-10 sm:py-16">
        <article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 font-sans" aria-label="Editorial Principles">
          
          <div class="space-y-4">
            <h2 class="font-editorial text-3xl sm:text-4xl text-[#141517] leading-tight">
              Why 404TN Exists
            </h2>
            <p class="text-base sm:text-lg text-[#333842] font-light leading-relaxed">
              Since July 25, 2021, political power in Tunisia has become increasingly concentrated in the hands of the presidency. Constitutional counter-powers have been eliminated, elected judicial bodies dissolved, independent regulatory authorities subordinated, and critical public commentary criminalized under Decree-Law 54.
            </p>
            <p class="text-base sm:text-lg text-[#333842] font-light leading-relaxed">
              When institutional transparency collapses, state failures are attributed to external conspiracies, and public records become inaccessible, rigorous documentary journalism becomes a civic necessity.
            </p>
          </div>

          <!-- EDITORIAL MANDATE CALLOUT -->
          <div class="p-6 sm:p-8 bg-white border-l-4 border-crimson border border-[#E5E0D8] shadow-paper space-y-3">
            <span class="text-crimson font-mono text-xs font-bold uppercase tracking-meta">OUR EDITORIAL MANDATE</span>
            <p class="text-[#141517] font-editorial italic text-lg sm:text-xl leading-relaxed">
              &ldquo;404TN is critical of the concentration and exercise of political power in Tunisia. Our political opposition is clear and disclosed. However, our political position does NOT lower our evidentiary threshold. We apply the exact same verification standard to government statements and opposition claims alike.&rdquo;
            </p>
          </div>

          <!-- CORE COMMITMENTS / CODE OF ETHICS -->
          <div class="space-y-6 pt-4">
            <div>
              ${sectionKicker("EDITORIAL CODE OF ETHICS")}
              <h3 class="font-editorial text-2xl sm:text-3xl text-[#141517]">The Four Evidentiary Commitments</h3>
              <p class="text-sm text-[#4A4F59] font-light mt-1">Operating rules binding all research dossiers, timeline entries, and public data records published on 404TN.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pt-2">
              <div class="p-6 bg-white border border-[#E5E0D8] shadow-paper space-y-3">
                <div class="flex items-center justify-between">
                  <span class="stamp-paper-crimson">COMMITMENT 01</span>
                  <span class="font-mono text-[10px] text-[#767C89]">PRIMARY SOURCE</span>
                </div>
                <h4 class="font-editorial text-lg text-[#141517] font-bold">1. No Fact Without Evidence</h4>
                <p class="text-xs sm:text-sm text-[#4A4F59] font-light leading-relaxed">We do not publish factual assertions without traceable primary documentation, gazette records, or verified empirical data.</p>
              </div>

              <div class="p-6 bg-white border border-[#E5E0D8] shadow-paper space-y-3">
                <div class="flex items-center justify-between">
                  <span class="stamp-paper-crimson">COMMITMENT 02</span>
                  <span class="font-mono text-[10px] text-[#767C89]">DISCLOSED CLAIMS</span>
                </div>
                <h4 class="font-editorial text-lg text-[#141517] font-bold">2. Mandatory Attribution</h4>
                <p class="text-xs sm:text-sm text-[#4A4F59] font-light leading-relaxed">Government declarations, police charges, and opposition allegations are preserved as attributed claims, never presented as settled facts.</p>
              </div>

              <div class="p-6 bg-white border border-[#E5E0D8] shadow-paper space-y-3">
                <div class="flex items-center justify-between">
                  <span class="stamp-paper-amber">COMMITMENT 03</span>
                  <span class="font-mono text-[10px] text-[#767C89]">FORMAL OMISSIONS</span>
                </div>
                <h4 class="font-editorial text-lg text-[#141517] font-bold">3. Transparent Uncertainty</h4>
                <p class="text-xs sm:text-sm text-[#4A4F59] font-light leading-relaxed">Where continuously published datasets cannot be identified or remain unpublished by state entities, we formally document the omission as a data gap rather than speculating.</p>
              </div>

              <div class="p-6 bg-white border border-[#E5E0D8] shadow-paper space-y-3">
                <div class="flex items-center justify-between">
                  <span class="stamp-paper-crimson">COMMITMENT 04</span>
                  <span class="font-mono text-[10px] text-[#767C89]">FULL PROVENANCE</span>
                </div>
                <h4 class="font-editorial text-lg text-[#141517] font-bold">4. Provenance Integrity</h4>
                <p class="text-xs sm:text-sm text-[#4A4F59] font-light leading-relaxed">Every metric displays its reference period, observation type (e.g. preliminary vs annual actual), and institutional source.</p>
              </div>
            </div>
          </div>

          <!-- NAVIGATION FOOTER -->
          <div class="pt-8 border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <a href="/methodology" class="text-[#8A5A1A] hover:underline">← Verification Methodology</a>
            <a href="/presidency" class="text-crimson hover:underline font-bold">Inspect The Record of Power (2019–2026) →</a>
          </div>

        </article>
      </main>

    </div>
  `;
}
