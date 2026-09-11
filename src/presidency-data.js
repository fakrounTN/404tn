// src/presidency-data.js
// 404TN Kais Saied Presidency Special Investigation (2019–2026)
// Authoritative evidence-backed accountability audit for /presidency route

import { escapeHtml, stripHtml } from './utils.js';
import {
  renderInvestigationOpener,
  renderSectionOpener,
  renderPromiseCard,
  renderHistoricalComparison,
  renderPollResult,
  renderRatingChange,
  renderAccountabilityQuestionBlock
} from './editorial-components.js';
import { ECONOMY_ARCHITECTURE_DATA, TRUST_MONITOR_DATA } from './editorial-architecture.js';

export const PRESIDENCY_SPECIAL_REPORT = {
  eyebrow: "404TN PRESIDENCY DOSSIER · ACCOUNTABILITY FRAME",
  h1: "Kais Saied: Power, Promises and Responsibility (2019–2026)",
  deck: "An evidence-based documentary audit of Tunisia’s executive governance, constitutional transformation, and crisis management across seven years of presidential authority.",
  breadcrumb: [
    { name: "Home", path: "/" },
    { name: "The Files", path: "/the-files" },
    { name: "Presidency Dossier", path: "/presidency" }
  ],
  metadataRibbon: [
    { label: "ACCOUNTABILITY PERIOD", value: "2019 → 2026", highlight: true, subtext: "7 YEARS OF EXECUTIVE POWER" },
    { label: "INSTITUTIONAL MANDATE", value: "OCTOBER 2019 ELECTION", highlight: false, subtext: "72.7% SECOND-ROUND VOTE" },
    { label: "CONSTITUTIONAL FRAME", value: "JULY 2022 SYSTEM", highlight: false, subtext: "EXECUTIVE PRIMACY" },
    { label: "EVIDENCE THRESHOLD", value: "JORT / OFFICIAL RECORDS", highlight: false, subtext: "STRICT FACT/CLAIM SEPARATION" }
  ],

  // B. 2019 Baseline
  baseline2019: {
    title: "2019 Baseline: The Anti-Establishment Mandate",
    electionContext: "Elected on October 13, 2019 with 72.71% of the vote (2.77 million ballots) against Nabil Karoui in an election characterized by broad popular rejection of the post-2011 political establishment, parliamentary gridlock, and deteriorating economic conditions.",
    campaignPlatform: [
      {
        item: "Grassroots Bottom-Up Governance (Al-Bina' Al-Qa'idi)",
        desc: "Pledged to replace national political party lists with direct local council democracy and revocable delegate mandates."
      },
      {
        item: "Moral Probity & Anti-Corruption Campaign",
        desc: "Framed national corruption as a conspiracy of financial cartels and political lobbies that diverted public wealth."
      },
      {
        item: "Strict Legal Constitutionalism & Sovereignty",
        desc: "Emphasized strict adherence to text-based sovereignty, national self-reliance, and rejection of foreign interference."
      }
    ]
  },

  // C. 2021 Rupture
  rupture2021: {
    title: "25 July 2021: The Exceptional Rupture",
    context: "Following nationwide protests and severe healthcare distress during the COVID-19 pandemic, President Kais Saied invoked Article 80 of the 2014 Constitution on July 25, 2021.",
    actions: [
      {
        action: "Suspension of the Assembly of the Representatives of the People (ARP)",
        classification: "FACT",
        source: "Presidential Decree 2021-80 (JORT No. 64)"
      },
      {
        action: "Dismissal of Prime Minister Hichem Mechichi and Cabinet",
        classification: "FACT",
        source: "Presidential Decree 2021-81 (JORT No. 64)"
      },
      {
        action: "Enactment of Presidential Decree 117 (September 22, 2021)",
        desc: "Concentrated legislative, executive, and regulatory power exclusively in the presidency; suspended all chapters of the 2014 Constitution incompatible with presidential decree power.",
        classification: "FACT",
        source: "Presidential Decree 2021-117 (JORT No. 86)"
      }
    ],
    justificationVsCriticism: {
      statedJustification: "Preserving the state from imminent collapse, ending parliamentary deadlock, and cleansing public institutions from corrupt political brokers.",
      documentedCriticism: "Domestic and international legal bodies (Venice Commission, National Bar Association, civil society) documented the suspension of separation of powers and lack of judicial checks."
    }
  },

  // D. 2022 Political System
  system2022: {
    title: "2022: Institutional Transformation",
    context: "A structural re-engineering of the Tunisian republic from a hybrid semi-presidential democracy to a highly centralized presidential republic.",
    events: [
      {
        date: "Feb 12, 2022",
        title: "Dissolution of the High Judicial Council (CSM)",
        desc: "Replaced with a provisional judicial council appointed by the executive under Decree-Law 2022-11.",
        source: "JORT Decree-Law 2022-11"
      },
      {
        date: "June 1, 2022",
        title: "Dismissal of 57 Judges by Executive Decree",
        desc: "Presidential Decree 516 dismissed 57 judges without disciplinary hearings; Administrative Court ordered reinstatement of 49 in August 2022 (unexecuted by Justice Ministry).",
        source: "JORT Decree 2022-516 / Administrative Court Injunction"
      },
      {
        date: "July 25, 2022",
        title: "Adoption of the 2022 Constitution via Referendum",
        desc: "Approved with 94.6% yes votes on 30.5% turnout. Replaced the 2014 constitutional order; president names government, cannot be impeached, and oversees judicial appointments.",
        source: "ISIE Official Referendum Results (JORT No. 89)"
      },
      {
        date: "Sept 13, 2022",
        title: "Enactment of Decree 54 on Cybercrime and Information Systems",
        desc: "Article 24 establishes 5-year prison sentences for publishing false news or rumors against public officials; over 60 journalists, attorneys, and political figures investigated.",
        source: "JORT Decree-Law 2022-54"
      }
    ]
  },

  // E. 2024 Consolidation
  consolidation2024: {
    title: "2024: Political Consolidation",
    context: "October 6, 2024 presidential election resulting in the re-election of Kais Saied with 90.7% on a 28.8% voter turnout.",
    verifiedFacts: [
      "ISIE disqualified multiple presidential contenders, maintaining a three-candidate ballot.",
      "Prominent opposition figures and potential contenders detained under anti-conspiracy and Decree 54 statutes.",
      "Assembly of the Representatives of the People amended the electoral law days before the vote to strip the Administrative Court of electoral dispute jurisdiction (Law 2024-45)."
    ]
  },

  // F. 2026 Outcomes: Compounding Systemic Pressures
  outcomes2026: {
    title: "2026 Reality: Direct Presidential Responsibility Tested",
    narrative: "Under the 2022 constitutional architecture, all executive agencies, public utilities, and regional governorates report hierarchically to the presidency. 404TN documents the real-world performance across key systemic dossiers:",
    dossierLinks: [
      { href: "/issues/water", label: "File 01: Water Deficit (21.4% dam storage; SONEDE rationing)" },
      { href: "/issues/electricity", label: "File 02: Electrical Stress (52% energy deficit; peak load-shedding)" },
      { href: "/issues/pollution", label: "File 03: Industrial Pollution (Chemical waste; Sfax refuse crisis)" },
      { href: "/gabes", label: "Gabès Flagship Investigation (14,000 T/day phosphogypsum; unfulfilled 2017 decree)" },
      { href: "/issues/work", label: "File 04: Labor Market (16.0% unemployment; 38.8% youth graduate joblessness)" },
      { href: "/issues/migration", label: "File 05: Migration Pressures (EU MoU; Sfax/El Amra encampments)" },
      { href: "/issues/public-services", label: "File 06: Public Services (Hospital medicine shortages; transport decay)" },
      { href: "/issues/rights", label: "File 07: Rights & Freedoms (Decree 54 prosecutions; judicial reorganization)" }
    ]
  },

  // G. 6 Core Promise / Action / Result / Status Cards
  accountabilityCards: [
    {
      title: "1. Decentralization & Grassroots Power",
      theme: "POLITICAL ARCHITECTURE",
      promise: "Abolishing political party intermediaries in favor of direct democracy through local councils elected at the municipal and delegation level.",
      action: "Promulgated Decree-Law 2023-8 creating the National Council of Regions and Districts (second parliamentary chamber) elected through complex tier-based voting.",
      result: "The two-chamber legislative body has minimal constitutional power over the executive; all budgetary and policy authority remains concentrated in the presidency.",
      status: "PARTIAL",
      evidenceRef: "JORT Decree-Law 2023-8 / 2022 Constitution Art. 84-86"
    },
    {
      title: "2. Penal Reconciliation & Stolen Asset Recovery",
      theme: "CORRUPTION & FINANCE",
      promise: "Pledged to recover an estimated 13.5 billion TND from 460 corrupt businessmen through a National Penal Reconciliation Commission to fund regional development.",
      action: "Created the Penal Reconciliation Commission via Decree-Law 2022-13; later amended the law and replaced the committee leadership following missed targets.",
      result: "Official treasury receipts from penal reconciliation remained below 5% of the initial 13.5B TND target; state financing deficits continued to expand.",
      status: "UNRESOLVED",
      evidenceRef: "Ministry of Finance Budgetary Execution Reports (2022–2026)"
    },
    {
      title: "3. Economic Sovereignty & Rejection of Foreign Dictates",
      theme: "MACROECONOMIC POLICY",
      promise: "Categorical refusal of multilateral loan conditionality, subsidy removals, and public enterprise privatization in the name of national sovereignty.",
      action: "Froze execution of the October 2022 $1.9B IMF Staff-Level Agreement; mandated BCT direct lending to the treasury (Law 2024-10) to cover external debt service.",
      result: "Sovereign credit ratings downgraded to Caa2/CCC+; domestic commercial banks absorbed record sovereign paper; essential food commodity shortages emerged periodically.",
      status: "DISPUTED",
      evidenceRef: "IMF Statement 22/353 / BCT Monetary Bulletins (2023–2026)"
    },
    {
      title: "4. Judicial Independence & Institutional Purge",
      theme: "JUSTICE & RULE OF LAW",
      promise: "Purging the judiciary of partisan control, expediting political assassination investigations, and ensuring equal accountability before the law.",
      action: "Dissolved the High Judicial Council, dismissed 57 judges by executive decree, and granted the executive discretionary authority over judicial careers.",
      result: "Administrative Court annulment orders for 49 dismissed judges were ignored; extensive detention of political figures, trade unionists, and journalists under Decree 54.",
      status: "DISPUTED",
      evidenceRef: "Decree 516/2022 / Administrative Court Ruling / SNJT Reports"
    },
    {
      title: "5. Public Utility Performance & Crisis Management",
      theme: "PUBLIC SERVICES & INFRASTRUCTURE",
      promise: "Direct presidential oversight of public companies (SONEDE, STEG, GCT) to eradicate internal administrative sabotage and guarantee public services.",
      action: "Conducted unannounced presidential site visits, dismissed multiple CEOs and regional directors, and attributed outages to criminal cartels.",
      result: "Water rationing and electrical load-shedding continued to worsen due to multi-year infrastructure capital underinvestment rather than personnel sabotage.",
      status: "UNRESOLVED",
      evidenceRef: "ONAGRI Dam Telemetry / STEG Peak Grid Reports (Summer 2026)"
    },
    {
      title: "6. Border Security & Mediterranean Migration",
      theme: "FOREIGN & SECURITY POLICY",
      promise: "Pledged that Tunisia would never serve as a border guard for Europe or accept the resettlement of irregular migrants on its sovereign territory.",
      action: "Signed the EU-Tunisia Memorandum of Understanding on Strategic Partnership in July 2023; expanded National Guard maritime interception patrols.",
      result: "Over 80,000 maritime interceptions recorded annually; thousands of migrants stranded in informal camps in Sfax (El Amra/Jbeniana); EU disbursed border equipment aid.",
      status: "PARTIAL",
      evidenceRef: "EU MoU July 2023 / FTDES Migration Monitoring Bulletins"
    }
  ],

  // 6-Question Accountability Grammar Model
  accountabilityGrammar: {
    topic: "Presidency: Centralized Executive Authority (2019–2026)",
    authority: "Presidency of the Republic of Tunisia (Carthage Palace)",
    promised: "A clean, sovereign state where corruption is eliminated, grassroots democracy governs, public services work for the people, and Tunisia is not subjected to foreign dictates.",
    announcedAction: "Concentrated executive authority via Decree 117 and 2022 Constitution; dissolved CSM; signed EU MoU; enacted Decree 54; rejected IMF SBA.",
    whatHappened: "Institutional checks were eliminated; inflation and public debt rose; water and electricity rationing expanded in Summer 2026; youth migration intentions surged.",
    verifiedFact: "All executive and legislative power is formally centralized in the presidency under the 2022 Constitution, establishing unambiguous institutional responsibility for government outcomes.",
    unresolved: "The degree to which systemic crises (drought, energy deficit, global inflation) were aggravated vs mitigated by centralized executive decision-making."
  }
};

/**
 * Renders the complete, rich, single-H1 presidential investigation for /presidency.
 */
export function renderPresidencyReportViewHtml() {
  const p = PRESIDENCY_SPECIAL_REPORT;
  const eco = ECONOMY_ARCHITECTURE_DATA;
  const trust = TRUST_MONITOR_DATA;

  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt; 
      <a href="/the-files" class="hover:text-bone-100 transition-colors">The Files</a> &gt; 
      <span class="text-bone-100 font-medium">Presidency Dossier</span>
    </nav>
  `;

  // Header Opener
  const headerHtml = renderInvestigationOpener({
    breadcrumbHtml,
    eyebrow: p.eyebrow,
    badge: "ACCOUNTABILITY AUDIT",
    badgeClass: "bg-crimson/15 border-crimson/40 text-crimson font-bold",
    h1: p.h1,
    deck: p.deck,
    metadataItems: p.metadataRibbon
  });

  // Promise Cards HTML
  const promiseCardsHtml = p.accountabilityCards.map(c => renderPromiseCard(c)).join("");

  // Economic Comparisons HTML
  const ecoComparisonsHtml = eco.indicators.slice(0, 4).map(ind => renderHistoricalComparison(ind)).join("");

  // Sovereign Ratings HTML
  const ratingsHtml = eco.sovereignRatings.map(r => renderRatingChange(r)).join("");

  // Polling Results HTML
  const trustPollsHtml = trust.benchmarks.slice(0, 3).map(bm => {
    return renderPollResult({
      organization: trust.metadata.primarySource,
      fieldwork: "2018–2024 Trends",
      sampleSize: trust.metadata.sampleSize,
      methodology: trust.metadata.methodology,
      question: bm.question,
      results: bm.results.map(r => ({
        label: `${r.wave}: ${r.note || ''}`,
        percentage: r.value,
        highlight: r.highlight
      }))
    });
  }).join("");

  // 6-Question Accountability Block
  const accountabilityGrammarHtml = renderAccountabilityQuestionBlock(p.accountabilityGrammar);

  return `
    <article class="presidency-dossier-page py-12 sm:py-16 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- A. INVESTIGATION OPENER -->
      ${headerHtml}

      <!-- INTRODUCTORY CONTEXT & INHERITED VS CREATED PROBLEMS -->
      <section class="p-6 sm:p-8 bg-background-elevated border border-surface-800 space-y-4">
        <span class="text-xs font-mono uppercase tracking-widest text-sand font-bold block">EDITORIAL CONTEXT &amp; METHODOLOGY</span>
        <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">The Accountability Frame: 2019 → 2026</h2>
        <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed max-w-4xl">
          404TN does not assume every crisis observed in Summer 2026 originated after 2019. Rather, we distinguish between <strong class="text-bone-100">Inherited Structural Problems</strong> (decades of infrastructure neglect, regional inequality, and bureaucratic inertia) and <strong class="text-crimson">Decisions &amp; Actions Taken Since 2019</strong>. Under the 2022 Constitution, executive authority is centralized in the presidency, establishing unambiguous institutional accountability for how state institutions respond to national challenges.
        </p>
      </section>

      <!-- B. 2019 BASELINE -->
      <section class="space-y-6">
        ${renderSectionOpener({
          eyebrow: "MANDATE & ORIGIN",
          title: p.baseline2019.title,
          deck: p.baseline2019.electionContext
        })}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          ${p.baseline2019.campaignPlatform.map(cp => `
            <div class="p-5 bg-background-elevated border border-surface-800 space-y-2">
              <span class="text-xs font-mono text-sand font-bold uppercase block">${escapeHtml(cp.item)}</span>
              <p class="text-xs text-surface-300 font-light leading-relaxed">${escapeHtml(cp.desc)}</p>
            </div>
          `).join("")}
        </div>
      </section>

      <!-- C. 2021 RUPTURE -->
      <section class="space-y-6">
        ${renderSectionOpener({
          eyebrow: "INSTITUTIONAL TURNING POINT",
          title: p.rupture2021.title,
          deck: p.rupture2021.context
        })}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-7 space-y-4">
            <span class="text-[10px] font-mono uppercase tracking-meta text-surface-400 block font-bold">DOCUMENTED EXECUTIVE ACTS</span>
            <div class="space-y-3">
              ${p.rupture2021.actions.map(act => `
                <div class="p-4 bg-background-elevated border border-surface-800 space-y-1">
                  <div class="flex items-center justify-between text-[10px] font-mono">
                    <span class="text-crimson font-bold uppercase">${escapeHtml(act.classification)}</span>
                    <span class="text-surface-500">${escapeHtml(act.source)}</span>
                  </div>
                  <div class="font-sans font-semibold text-bone-100 text-sm">${escapeHtml(act.action)}</div>
                  ${act.desc ? `<p class="text-xs text-surface-300 font-light mt-1">${escapeHtml(act.desc)}</p>` : ''}
                </div>
              `).join("")}
            </div>
          </div>

          <div class="lg:col-span-5 p-6 bg-surface-900/40 border border-surface-800 space-y-4">
            <span class="text-[10px] font-mono uppercase tracking-meta text-sand block font-bold">COMPETING INTERPRETATIONS</span>
            <div class="space-y-2">
              <span class="text-xs font-mono text-sand font-bold block">OFFICIAL JUSTIFICATION</span>
              <p class="text-xs text-surface-300 font-light leading-relaxed">${escapeHtml(p.rupture2021.justificationVsCriticism.statedJustification)}</p>
            </div>
            <div class="pt-3 border-t border-surface-800 space-y-2">
              <span class="text-xs font-mono text-crimson font-bold block">DOCUMENTED CRITICISM</span>
              <p class="text-xs text-surface-300 font-light leading-relaxed">${escapeHtml(p.rupture2021.justificationVsCriticism.documentedCriticism)}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- D. 2022 NEW POLITICAL SYSTEM & E. 2024 CONSOLIDATION -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-7 space-y-4">
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-semibold block">CONSTITUTIONAL ARCHITECTURE</span>
          <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">${escapeHtml(p.system2022.title)}</h2>
          <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed">${escapeHtml(p.system2022.context)}</p>
          <div class="space-y-3 pt-2">
            ${p.system2022.events.map(ev => `
              <div class="p-4 bg-background-elevated border border-surface-800">
                <div class="flex items-center justify-between text-[10px] font-mono text-surface-400">
                  <span class="text-sand font-bold">${escapeHtml(ev.date)}</span>
                  <span>${escapeHtml(ev.source)}</span>
                </div>
                <div class="font-sans font-semibold text-bone-100 text-sm mt-1">${escapeHtml(ev.title)}</div>
                <p class="text-xs text-surface-300 font-light mt-1">${escapeHtml(ev.desc)}</p>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="lg:col-span-5 space-y-4">
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-semibold block">POLITICAL STATUS</span>
          <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">${escapeHtml(p.consolidation2024.title)}</h2>
          <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed">${escapeHtml(p.consolidation2024.context)}</p>
          <div class="p-6 bg-surface-900/60 border border-surface-800 space-y-3">
            <span class="text-[10px] font-mono uppercase tracking-meta text-surface-400 font-bold block">VERIFIED FACTS</span>
            <ul class="space-y-2.5">
              ${p.consolidation2024.verifiedFacts.map(fact => `
                <li class="flex items-start gap-2 text-xs text-surface-300 font-light leading-relaxed">
                  <span class="text-crimson font-mono font-bold mt-0.5">■</span>
                  <span>${escapeHtml(fact)}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        </div>
      </section>

      <!-- G. PROMISE / ACTION / RESULT / STATUS (6 CORE DOSSIERS) -->
      <section class="space-y-6">
        ${renderSectionOpener({
          eyebrow: "DOCUMENTED ACCOUNTABILITY REGISTER",
          title: "Promises, Actions and Verified Results (2019–2026)",
          deck: "Each major campaign pledge and presidential policy is audited across three criteria: What was promised, what action was taken, and what the empirical evidence documents in 2026."
        })}
        <div class="space-y-6">
          ${promiseCardsHtml}
        </div>
      </section>

      <!-- F. 2019 vs 2026 ECONOMIC & TRUST COMPARISONS -->
      <section class="space-y-8">
        ${renderSectionOpener({
          eyebrow: "EMPIRICAL BENCHMARKS",
          title: "Economic & Public Trust Trajectory (2019 vs 2026)",
          deck: "Official statistical indicators from INS, BCT, and Ministry of Finance alongside nationally representative survey data from Arab Barometer."
        })}

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${ecoComparisonsHtml}
        </div>

        <div class="space-y-4">
          <span class="text-xs font-mono uppercase tracking-widest text-surface-400 font-semibold block">SOVEREIGN RATINGS TRAJECTORY</span>
          <div class="space-y-3">
            ${ratingsHtml}
          </div>
        </div>

        <div class="space-y-4">
          <span class="text-xs font-mono uppercase tracking-widest text-surface-400 font-semibold block">PUBLIC TRUST &amp; OPINION BENCHMARKS (ARAB BAROMETER)</span>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            ${trustPollsHtml}
          </div>
        </div>
      </section>

      <!-- ACCOUNTABILITY GRAMMAR BLOCK -->
      ${accountabilityGrammarHtml}

      <!-- CONNECTED INVESTIGATIVE FILES -->
      <section class="space-y-4 pt-6 border-t border-surface-800">
        <span class="text-xs font-mono uppercase tracking-widest text-surface-400 block font-semibold">CONNECTED THEMATIC DOSSIERS</span>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${p.outcomes2026.dossierLinks.map(link => `
            <a href="${escapeHtml(link.href)}" class="p-4 bg-background-elevated hover:bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors group flex items-center justify-between text-xs font-mono">
              <span class="text-bone-100 group-hover:text-crimson font-medium">${escapeHtml(link.label)}</span>
              <span class="text-surface-400 group-hover:text-bone-100 transition-transform group-hover:translate-x-1">→</span>
            </a>
          `).join("")}
        </div>
      </section>

    </article>
  `;
}
