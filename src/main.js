// 404TN - Main Frontend Controller (src/main.js)
import { initGeospatialMonitor } from './map.js';
import { initEvidenceDrawer, openEvidenceDrawer } from './evidence-drawer.js';
import { initTimelineController } from './timeline.js';
import { initAccountabilityController } from './accountability.js';
import { getGabesDossier, getStats, getIssueBySlug, getIssues } from './api.js';

document.addEventListener("DOMContentLoaded", async () => {
  initHeader();
  initMobileMenu();
  initPoliticalChronology();
  initEvidenceDrawer();
  initFilesDossierModal();
  initGeospatialMonitor();
  initTimelineController();
  initAccountabilityController();
  initSecureDropModal();
  initLanguageSelector();
  loadGabesData();
  loadStatsData();
});

/* ==========================================================================
   1. STICKY HEADER & SCROLL SPY
   ========================================================================== */
function initHeader() {
  const header = document.getElementById("main-header");
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section[id]");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 30) {
      header.classList.add("bg-background/95", "shadow-2xl", "border-b", "border-surface-800");
      header.classList.remove("bg-background/70");
    } else {
      header.classList.remove("bg-background/95", "shadow-2xl", "border-b", "border-surface-800");
      header.classList.add("bg-background/70");
    }

    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 140;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("text-bone-100", "text-crimson");
      link.classList.add("text-surface-400");
      if (link.getAttribute("href") === "#" + current) {
        link.classList.remove("text-surface-400");
        link.classList.add("text-bone-100");
      }
    });
  }, { passive: true });
}

/* ==========================================================================
   2. MOBILE MENU
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById("mobile-menu-toggle");
  const closeBtn = document.getElementById("mobile-menu-close");
  const drawer = document.getElementById("mobile-menu-drawer");
  const backdrop = document.getElementById("mobile-menu-backdrop");
  const links = drawer ? drawer.querySelectorAll("a") : [];

  const openDrawer = () => {
    drawer.classList.remove("translate-x-full");
    drawer.classList.add("translate-x-0");
    if (backdrop) {
      backdrop.classList.remove("opacity-0", "pointer-events-none");
      backdrop.classList.add("opacity-100", "pointer-events-auto");
    }
    document.body.style.overflow = "hidden";
  };

  const closeDrawer = () => {
    drawer.classList.add("translate-x-full");
    drawer.classList.remove("translate-x-0");
    if (backdrop) {
      backdrop.classList.add("opacity-0", "pointer-events-none");
      backdrop.classList.remove("opacity-100", "pointer-events-auto");
    }
    document.body.style.overflow = "";
  };

  if (toggleBtn) toggleBtn.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);
  links.forEach(l => l.addEventListener("click", closeDrawer));
}

/* ==========================================================================
   3. THE SIX FILES EDITORIAL METADATA & DYNAMIC DOSSIER MODAL
   ========================================================================== */
const FILE_EDITORIAL_METADATA = {
  water: {
    id: "01",
    slug: "water",
    title: "Water: Cuts, Restrictions, Infrastructure & Regional Inequality",
    category: "RESOURCE COLLAPSE",
    summary: "Investigation into hydraulic distribution infrastructure strain, reservoir levels, and SONEDE rationing across governorates.",
    accountableInstitutions: [
      "SONEDE (National Water Distribution Utility)",
      "Ministry of Agriculture, Hydraulic Resources and Maritime Fisheries",
      "National Observatory of Agriculture (ONAGRI)"
    ]
  },
  electricity: {
    id: "02",
    slug: "electricity",
    title: "Electricity: Outages, Network Load & Service Reliability",
    category: "ENERGY SECURITY",
    summary: "Documentation of national grid peak load, natural gas generation capacity, and STEG service disruptions.",
    accountableInstitutions: [
      "STEG (Tunisian Company of Electricity and Gas)",
      "Ministry of Industry, Mines and Energy",
      "Observatoire National de l'Énergie et des Mines"
    ]
  },
  work: {
    id: "03",
    slug: "work",
    title: "Work: Unemployment, Wages & Economic Pressure",
    category: "ECONOMIC STAGNATION",
    summary: "Analysis of official labor force data, graduate unemployment disparities, food inflation, and purchasing power.",
    accountableInstitutions: [
      "INS (National Institute of Statistics)",
      "Ministry of Social Affairs",
      "Ministry of Economy and Planning"
    ]
  },
  migration: {
    id: "04",
    slug: "migration",
    title: "Migration: Tunisians Leaving, African Migration & Border Policy",
    category: "HUMAN MOBILITY",
    summary: "Monitoring of maritime departures, interceptions at sea by the National Guard, and regional border management.",
    accountableInstitutions: [
      "Ministry of Interior (National Guard & Maritime Units)",
      "Ministry of Foreign Affairs, Migration and Tunisians Abroad",
      "FTDES (Tunisian Forum for Economic and Social Rights)"
    ]
  },
  publicServices: {
    id: "05",
    slug: "public-services",
    title: "Public Services: Healthcare, Transport & Municipal Infrastructure",
    category: "CIVIC INFRASTRUCTURE",
    summary: "Documentation of hospital equipment and medicine availability, public transit fleets (Transtu, SNCFT), and municipal sanitation.",
    accountableInstitutions: [
      "Ministry of Health & Pharmacie Centrale de Tunisie (PCT)",
      "Ministry of Transport (Transtu & SNCFT)",
      "Ministry of Environment (ANPE)"
    ]
  },
  institutions: {
    id: "06",
    slug: "rights-institutions",
    title: "Rights & Institutions: Governance & Accountability",
    category: "GOVERNANCE & ACCOUNTABILITY",
    summary: "Monitoring institutional checks and balances, Decree 54 legal proceedings, press freedom, and judicial independence.",
    accountableInstitutions: [
      "Presidency of the Republic (Carthage)",
      "Ministry of Justice",
      "SNJT (National Union of Tunisian Journalists)"
    ]
  }
};

function initFilesDossierModal() {
  const modal = document.getElementById("file-dossier-modal");
  const closeBtn = document.getElementById("close-dossier-modal");
  const triggerRows = document.querySelectorAll("[data-file-key]");

  if (!modal) return;

  const openDossier = async (key) => {
    const meta = FILE_EDITORIAL_METADATA[key] || {
      id: "00",
      title: key.toUpperCase(),
      category: "INVESTIGATIVE DOSSIER",
      summary: "Live investigative dossier querying canonical evidence archive.",
      accountableInstitutions: []
    };

    document.getElementById("modal-file-num").textContent = `FILE ${meta.id}`;
    document.getElementById("modal-file-category").textContent = meta.category;
    document.getElementById("modal-file-title").textContent = meta.title;
    document.getElementById("modal-file-status").textContent = "QUERYING LIVE ARCHIVE...";
    document.getElementById("modal-file-summary").textContent = meta.summary;

    const metricsContainer = document.getElementById("modal-file-metrics");
    metricsContainer.innerHTML = `<div class="col-span-full py-4 text-xs font-mono text-surface-500">Querying verified issue metrics...</div>`;

    const instContainer = document.getElementById("modal-file-institutions");
    instContainer.innerHTML = meta.accountableInstitutions.map(i => `
      <li class="flex items-start text-xs text-surface-300 gap-2">
        <span class="text-crimson font-mono select-none">■</span>
        <span>${i}</span>
      </li>
    `).join("");

    const eventsContainer = document.getElementById("modal-file-events");
    eventsContainer.innerHTML = `<div class="py-4 text-xs font-mono text-surface-500">Querying real evidence records...</div>`;

    const sourcesContainer = document.getElementById("modal-file-sources");
    sourcesContainer.innerHTML = "";

    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    const liveDossier = await getIssueBySlug(meta.slug || key);
    if (!liveDossier) {
      document.getElementById("modal-file-status").textContent = "ARCHIVE OFFLINE";
      metricsContainer.innerHTML = `
        <div class="col-span-full p-4 bg-background-subtle border border-surface-800">
          <div class="text-[11px] font-mono text-surface-400 uppercase tracking-meta">MONITORED METRIC STATUS</div>
          <div class="text-lg font-editorial font-semibold text-surface-400 my-1">NO CURRENT VERIFIED METRIC</div>
          <div class="text-xs text-surface-500 leading-relaxed font-light">Unable to query live telemetry from API. Verified baseline indicators require active connection.</div>
        </div>
      `;
      eventsContainer.innerHTML = `<div class="text-xs font-mono text-surface-400">Live evidence stream unreachable.</div>`;
      return;
    }

    document.getElementById("modal-file-status").textContent = `${liveDossier.status} · ${liveDossier.evidence_count} VERIFIED RECORDS`;

    // Render Metrics: Look for actual sourced metrics in evidence records
    const recordsWithMetrics = (liveDossier.evidence_records || []).filter(r => r.metric_value);
    if (recordsWithMetrics.length > 0) {
      metricsContainer.innerHTML = recordsWithMetrics.slice(0, 4).map(m => `
        <div class="p-4 bg-background-subtle border border-surface-800 cursor-pointer hover:border-surface-600 transition-colors" data-evidence-id="${m.id}">
          <div class="text-[11px] font-mono text-surface-400 uppercase tracking-meta">${m.source_name || 'OFFICIAL REPORT'}</div>
          <div class="text-2xl font-editorial font-semibold text-bone-100 my-1 text-crimson">${m.metric_value} ${m.metric_unit || ''}</div>
          <div class="text-xs text-surface-400 leading-relaxed font-light truncate">${m.headline}</div>
        </div>
      `).join("");
    } else {
      metricsContainer.innerHTML = `
        <div class="col-span-full p-4 bg-background-subtle border border-surface-800">
          <div class="text-[11px] font-mono text-surface-400 uppercase tracking-meta">MONITORED METRIC STATUS</div>
          <div class="text-lg font-editorial font-semibold text-bone-100 my-1 text-surface-400">NO CURRENT VERIFIED METRIC</div>
          <div class="text-xs text-surface-500 leading-relaxed font-light">Zero unverified numbers displayed. Real collected factual items stream continuously in the evidence list below.</div>
        </div>
      `;
    }

    // Render Real Documented Evidence Records
    const evRecords = liveDossier.evidence_records || [];
    if (evRecords.length > 0) {
      eventsContainer.innerHTML = evRecords.slice(0, 5).map(e => `
        <div class="relative pl-5 pb-4 border-l border-surface-800 last:border-l-0 cursor-pointer group" data-evidence-id="${e.id}">
          <span class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-crimson group-hover:scale-125 transition-transform"></span>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-crimson uppercase font-medium">${e.event_date || e.published_at || 'CURRENT'}</span>
            <span class="text-[10px] font-mono px-1.5 py-0.2 bg-surface-900 text-surface-400 border border-surface-800">${e.classification}</span>
          </div>
          <p class="text-xs text-surface-200 mt-1 leading-relaxed font-sans group-hover:text-crimson transition-colors">${e.headline}</p>
          <div class="text-[10px] font-mono text-surface-500 mt-1">SRC: ${e.source_name || 'VERIFIED SOURCE'}</div>
        </div>
      `).join("");

      // Collect unique sources
      const uniqueSources = {};
      evRecords.forEach(e => {
        if (e.source_name) {
          uniqueSources[e.source_name] = e.source_url || '#';
        }
      });
      sourcesContainer.innerHTML = Object.entries(uniqueSources).map(([name, url]) => `
        <li class="flex items-start text-xs font-mono text-surface-400 gap-2 bg-surface-900/60 p-2.5 border border-surface-800">
          <span class="text-sand select-none font-semibold">SRC:</span>
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-surface-300 hover:text-crimson transition-colors truncate">${name}</a>
        </li>
      `).join("");
    } else {
      eventsContainer.innerHTML = `<div class="text-xs font-mono text-surface-400">No active evidence records for this category in current monitoring window.</div>`;
      sourcesContainer.innerHTML = `<li class="text-xs font-mono text-surface-500">No verified sources active.</li>`;
    }
  };

  const closeModal = () => {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  };

  triggerRows.forEach(row => {
    row.addEventListener("click", () => {
      const key = row.getAttribute("data-file-key");
      openDossier(key);
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) closeModal();
  });
}

/* ==========================================================================
   4. GABÈS FLAGSHIP DATA LOADER
   ========================================================================== */
async function loadGabesData() {
  const gabes = await getGabesDossier();
  if (!gabes) return;

  const container = document.getElementById("gabes-metrics-container");
  if (!container || !gabes.metrics) return;

  container.innerHTML = gabes.metrics.map(m => `
    <div class="p-4 bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors group">
      <div class="flex items-center justify-between">
        <span class="text-surface-500 uppercase block text-[10px] font-mono">${m.label}</span>
        <span class="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-background border border-surface-800 ${m.status === 'HISTORICAL BASELINE' ? 'text-amber-400' : (m.status === 'NO CURRENT DATA' ? 'text-surface-400' : 'text-crimson')}">${m.status}</span>
      </div>
      <div class="text-xl font-editorial font-bold my-1 ${m.status === 'NO CURRENT DATA' ? 'text-surface-400' : 'text-crimson'} group-hover:text-white transition-colors">
        ${m.value}
      </div>
      <div class="text-[10px] text-surface-400 block mt-0.5 font-light">${m.subtext}</div>
      <div class="text-[9px] text-surface-500 font-mono mt-2 pt-2 border-t border-surface-800/60 flex items-center justify-between">
        <span>PERIOD: ${m.source_period}</span>
        <span class="text-sand text-[9px] uppercase tracking-wider">${m.type ? m.type.replace(/_/g, ' ') : 'CONTEXT'}</span>
      </div>
    </div>
  `).join("");
}

/* ==========================================================================
   5. PUBLIC STATS LOADER
   ========================================================================== */
async function loadStatsData() {
  const stats = await getStats();
  if (!stats) return;

  const totalEl = document.getElementById("stats-total-evidence");
  const sourcesEl = document.getElementById("stats-monitored-sources");
  if (totalEl && stats.total_evidence_records) totalEl.textContent = `${stats.total_evidence_records}+`;
  if (sourcesEl && stats.monitored_sources_count) sourcesEl.textContent = stats.monitored_sources_count;
}

/* ==========================================================================
   6. KAIS SAIED / PRESIDENCY CHRONOLOGY
   ========================================================================== */
const PRESIDENCY_DATA = {
  "2019": {
    year: "2019",
    phase: "THE PROMISE · HISTORICAL CONTEXT",
    subtitle: "Grassroots Mandate & Anti-Establishment Surge",
    narrative: "Elected with 72.7% in the second round of presidential elections. Running as an austere constitutional law professor without a political party or campaign financing, Kais Saied drew vast youth support based on promises of clean governance, direct local representation (Al-Chaab Yourid), and unyielding anti-corruption.",
    keyActions: [
      "Refusal of state campaign subsidies; austere independent platform",
      "Pledge to reform the 2014 parliamentary order via bottom-up councils",
      "Initial institutional friction with Parliament (ARP) and coalition cabinets"
    ],
    institutionalOutcome: "Presidency constrained by 2014 Constitution to defense and foreign diplomacy; mounting institutional deadlock between Carthage and Bardo."
  },
  "2021": {
    year: "2021",
    phase: "THE RUPTURE · HISTORICAL CONTEXT",
    subtitle: "July 25 & Article 80 Emergency Measures",
    narrative: "Amid a devastating COVID-19 healthcare crisis, economic paralysis, and nationwide street demonstrations, President Saied invoked Article 80 of the 2014 Constitution on July 25. He dismissed Prime Minister Hichem Mechichi, froze parliament with military support, and assumed full executive power. On September 22, Presidential Decree 117 formalized rule by decree.",
    keyActions: [
      "Suspension and military cordoning of the Assembly of the Representatives of the People (ARP)",
      "Promulgation of Presidential Decree 117 suspending major chapters of the 2014 Constitution",
      "Closure of the Anti-Corruption Authority (INLUCC) and dismissal of governors"
    ],
    institutionalOutcome: "Concentration of all legislative, executive, and constitutional authority in Carthage. Dissolution of cabinet counter-powers."
  },
  "2022": {
    year: "2022",
    phase: "THE NEW SYSTEM · HISTORICAL CONTEXT",
    subtitle: "New Constitution & Hyper-Presidency Framework",
    narrative: "Following an electronic national consultation, a new Constitution was drafted and submitted to referendum on July 25, 2022 (approved with 30.5% turnout). It established a pure presidential system without parliamentary confidence mechanisms or presidential impeachment. In September 2022, Decree 54 on cybercrime was enacted.",
    keyActions: [
      "Dissolution of the Superior Council of the Judiciary (CSM); replaced by provisional executive appointees",
      "Enactment of the 2022 Constitution redefining judiciary from a power to an administrative function",
      "Promulgation of Decree 54 criminalizing news and rumors with up to 10-year prison penalties"
    ],
    institutionalOutcome: "Constitutional checks on executive authority eliminated; parliamentary authority converted to consultative role."
  },
  "2024": {
    year: "2024",
    phase: "CONSOLIDATION · HISTORICAL CONTEXT",
    subtitle: "Re-Election & Administrative Centralization",
    narrative: "Presidential elections organized under the supervision of the restructured ISIE electoral commission. Multiple prominent opposition figures, former ministers, and party leaders faced detention, legal disqualification, or criminal sentences prior to the ballot. President Saied secured a renewed mandate.",
    keyActions: [
      "Restructuring of ISIE electoral authority with direct executive appointment of commissioners",
      "Detention and trials of political opposition figures under national security and conspiracy charges",
      "Implementation of the National Reconciliation (Al-Sulh Al-Jazā'ī) commission for financial settlements"
    ],
    institutionalOutcome: "Consolidation of sole executive authority; formal political opposition largely excluded from institutional life."
  },
  "2026": {
    year: "2026",
    phase: "THE RESULTS · 404TN EDITORIAL ANALYSIS",
    subtitle: "Direct Responsibility Tested by Compounding Crises",
    narrative: "Five years following the July 2021 rupture, all institutional mechanisms are directly accountable to the presidency. 404TN documents how this centralized governance model performs when confronted with the compounding infrastructural stress of water shortages, energy load shedding, inflation, and environmental degradation in Gabès.",
    keyActions: [
      "Direct presidential administration of utility crises (SONEDE, STEG, GCT, Transport)",
      "Attribution of supply shortages to market hoarders and bureaucratic sabotage",
      "Bilateral security-focused Mediterranean border agreements with European counterparts"
    ],
    institutionalOutcome: "Every administrative delay, utility disruption, and economic indicator maps directly to presidential responsibility."
  }
};

function initPoliticalChronology() {
  const tabs = document.querySelectorAll("[data-presidency-year]");
  const yearBadge = document.getElementById("chronology-year-badge");
  const phaseBadge = document.getElementById("chronology-phase-badge");
  const title = document.getElementById("chronology-title");
  const narrative = document.getElementById("chronology-narrative");
  const actionsList = document.getElementById("chronology-actions");
  const outcomeText = document.getElementById("chronology-outcome");

  if (!tabs.length || !yearBadge) return;

  const setYear = (year) => {
    const data = PRESIDENCY_DATA[year];
    if (!data) return;

    tabs.forEach(tab => {
      const tYear = tab.getAttribute("data-presidency-year");
      if (tYear === year) {
        tab.classList.add("bg-surface-800", "text-bone-100", "border-crimson");
        tab.classList.remove("text-surface-400", "border-surface-800");
      } else {
        tab.classList.remove("bg-surface-800", "text-bone-100", "border-crimson");
        tab.classList.add("text-surface-400", "border-surface-800");
      }
    });

    yearBadge.textContent = data.year;
    if (phaseBadge) phaseBadge.textContent = data.phase;
    title.textContent = data.subtitle;
    narrative.textContent = data.narrative;
    actionsList.innerHTML = data.keyActions.map(a => `
      <li class="flex items-start gap-2.5 text-xs text-surface-300">
        <span class="text-crimson font-mono mt-0.5">▪</span>
        <span>${a}</span>
      </li>
    `).join("");
    outcomeText.textContent = data.institutionalOutcome;
  };

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const year = tab.getAttribute("data-presidency-year");
      setYear(year);
    });
  });
}

/* ==========================================================================
   7. SECURE DROP / WHISTLEBLOWER MODAL
   ========================================================================= */
function initSecureDropModal() {
  const modal = document.getElementById("secure-drop-modal");
  const openBtns = document.querySelectorAll("[data-open-securedrop]");
  const closeBtn = document.getElementById("close-securedrop-modal");

  if (!modal) return;

  const open = () => {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  };

  openBtns.forEach(btn => btn.addEventListener("click", open));
  if (closeBtn) closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) close();
  });
}

/* ==========================================================================
   8. ARABIC LANGUAGE PLACEHOLDER
   ========================================================================== */
function initLanguageSelector() {
  const btn = document.getElementById("lang-ar-btn");
  const footerBtn = document.getElementById("lang-ar-footer-btn");
  const modal = document.getElementById("ar-notice-modal");
  const closeBtn = document.getElementById("close-ar-modal");

  const open = (e) => {
    if (e) e.preventDefault();
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  };

  const close = () => {
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  };

  if (btn) btn.addEventListener("click", open);
  if (footerBtn) footerBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
  }
}
