// 404TN - Main Frontend Controller (src/main.js)
import { initGeospatialMonitor } from './map.js';
import { initEvidenceDrawer, openEvidenceDrawer } from './evidence-drawer.js';
import { initTimelineController } from './timeline.js';
import { initAccountabilityController } from './accountability.js';
import { getGabesDossier, getStats, getIssueBySlug, getIssues } from './api.js';
import { escapeHtml, stripHtml } from './utils.js';
import { initRouter, setIssueRouteHandler, setGabesRouteHandler, setPresidencyRouteHandler, setStandardRouteHandler, updateActiveNavLinks } from './router.js';
import { DOSSIER_REGISTRY, GABES_SPECIAL_REPORT, renderDossierViewHtml, renderGabesReportViewHtml, renderPresidencyReportViewHtml } from './dossier-data.js';

let isDedicatedViewActive = false;

document.addEventListener("DOMContentLoaded", async () => {
  initHeader();
  initMobileMenu();
  initPoliticalChronology();
  initEvidenceDrawer();
  initGeospatialMonitor();
  initTimelineController();
  initAccountabilityController();
  initSecureDropModal();
  initLanguageSelector();

  // Connect Router Handlers for Dedicated In-Page Views
  setIssueRouteHandler((issueKey) => {
    showDossierView(issueKey);
  });

  setGabesRouteHandler(() => {
    showGabesReportView();
  });

  setPresidencyRouteHandler(() => {
    showPresidencyReportView();
  });

  setStandardRouteHandler((sectionId) => {
    showStandardViews(sectionId);
  });

  initRouter();
  loadGabesData();
  loadStatsData();
});

/* ==========================================================================
   1. STICKY HEADER & SCROLL SPY
   ========================================================================== */
function initHeader() {
  const header = document.getElementById("main-header");
  const sections = document.querySelectorAll("#content-views > section[id]:not(#issue-dossier-view):not(#gabes-report-view)");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 30) {
      header.classList.add("bg-background/95", "shadow-2xl", "border-b", "border-surface-800");
      header.classList.remove("bg-background/70");
    } else {
      header.classList.remove("bg-background/95", "shadow-2xl", "border-b", "border-surface-800");
      header.classList.add("bg-background/70");
    }

    // Do not let background scrollspy override dedicated subpage view active link
    if (isDedicatedViewActive) return;

    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 140;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute("id");
      }
    });

    if (current) {
      const currentRoute = current === "hero" ? "/" : "/" + current;
      updateActiveNavLinks(currentRoute);
    }
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
    if (!drawer) return;
    drawer.classList.remove("translate-x-full");
    drawer.classList.add("translate-x-0");
    drawer.setAttribute("aria-hidden", "false");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    if (backdrop) {
      backdrop.classList.remove("opacity-0", "pointer-events-none");
      backdrop.classList.add("opacity-100", "pointer-events-auto");
    }
    document.body.style.overflow = "hidden";
  };

  const closeDrawer = () => {
    if (!drawer) return;
    drawer.classList.add("translate-x-full");
    drawer.classList.remove("translate-x-0");
    drawer.setAttribute("aria-hidden", "true");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
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

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer && !drawer.classList.contains("translate-x-full")) {
      closeDrawer();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768 && drawer && !drawer.classList.contains("translate-x-full")) {
      closeDrawer();
    }
  }, { passive: true });
}

/* ==========================================================================
   3. DEDICATED IN-PAGE VIEW CONTROLLERS (PHASE B & C)
   ========================================================================== */
export function showDossierView(issueKey) {
  isDedicatedViewActive = true;
  const dossierView = document.getElementById("issue-dossier-view");
  const gabesView = document.getElementById("gabes-report-view");
  const presidencyView = document.getElementById("presidency-report-view");
  const defaultSections = document.querySelectorAll("#content-views > section:not(#issue-dossier-view):not(#gabes-report-view):not(#presidency-report-view)");

  if (!dossierView) return;

  defaultSections.forEach(s => s.classList.add("hidden"));
  if (gabesView) gabesView.classList.add("hidden");
  if (presidencyView) presidencyView.classList.add("hidden");
  dossierView.classList.remove("hidden");

  // Render baseline immediately for instant paint
  dossierView.innerHTML = renderDossierViewHtml(issueKey);
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Hydrate live telemetry from API
  const meta = DOSSIER_REGISTRY[issueKey];
  const slug = meta ? meta.slug : issueKey;
  getIssueBySlug(slug).then(liveData => {
    if (liveData && dossierView.querySelector(".issue-dossier-page")) {
      dossierView.innerHTML = renderDossierViewHtml(issueKey, liveData);
    }
  });
}

export function showGabesReportView() {
  isDedicatedViewActive = true;
  const dossierView = document.getElementById("issue-dossier-view");
  const gabesView = document.getElementById("gabes-report-view");
  const presidencyView = document.getElementById("presidency-report-view");
  const defaultSections = document.querySelectorAll("#content-views > section:not(#issue-dossier-view):not(#gabes-report-view):not(#presidency-report-view)");

  if (!gabesView) return;

  defaultSections.forEach(s => s.classList.add("hidden"));
  if (dossierView) dossierView.classList.add("hidden");
  if (presidencyView) presidencyView.classList.add("hidden");
  gabesView.classList.remove("hidden");

  // Render baseline immediately
  gabesView.innerHTML = renderGabesReportViewHtml();
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Hydrate live telemetry
  getGabesDossier().then(liveData => {
    if (liveData && gabesView.querySelector(".gabes-special-report")) {
      gabesView.innerHTML = renderGabesReportViewHtml(liveData);
    }
  });
}

export function showPresidencyReportView() {
  isDedicatedViewActive = true;
  const dossierView = document.getElementById("issue-dossier-view");
  const gabesView = document.getElementById("gabes-report-view");
  const presidencyView = document.getElementById("presidency-report-view");
  const defaultSections = document.querySelectorAll("#content-views > section:not(#issue-dossier-view):not(#gabes-report-view):not(#presidency-report-view)");

  if (!presidencyView) return;

  defaultSections.forEach(s => s.classList.add("hidden"));
  if (dossierView) dossierView.classList.add("hidden");
  if (gabesView) gabesView.classList.add("hidden");
  presidencyView.classList.remove("hidden");

  // Render baseline immediately
  presidencyView.innerHTML = renderPresidencyReportViewHtml();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function showStandardViews(targetSectionId = null) {
  isDedicatedViewActive = false;
  const dossierView = document.getElementById("issue-dossier-view");
  const gabesView = document.getElementById("gabes-report-view");
  const presidencyView = document.getElementById("presidency-report-view");
  const defaultSections = document.querySelectorAll("#content-views > section:not(#issue-dossier-view):not(#gabes-report-view):not(#presidency-report-view)");

  if (dossierView) dossierView.classList.add("hidden");
  if (gabesView) gabesView.classList.add("hidden");
  if (presidencyView) presidencyView.classList.add("hidden");
  defaultSections.forEach(s => s.classList.remove("hidden"));
}

/* ==========================================================================
   4. GABÈS HOMEPAGE DATA LOADER
   ========================================================================== */
async function loadGabesData() {
  const gabes = await getGabesDossier();
  if (!gabes) return;

  const container = document.getElementById("gabes-metrics-container");
  if (!container || !gabes.metrics) return;

  container.innerHTML = gabes.metrics.map(m => `
    <div class="p-4 bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors group">
      <div class="flex items-center justify-between">
        <span class="text-surface-500 uppercase block text-[10px] font-mono">${escapeHtml(stripHtml(m.label || ''))}</span>
        <span class="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-background border border-surface-800 ${m.status === 'HISTORICAL BASELINE' ? 'text-amber-400' : (m.status === 'NO CURRENT DATA' ? 'text-surface-400' : 'text-crimson')}">${escapeHtml(m.status || '')}</span>
      </div>
      <div class="text-xl font-editorial font-bold my-1 ${m.status === 'NO CURRENT DATA' ? 'text-surface-400' : 'text-crimson'} group-hover:text-white transition-colors">
        ${escapeHtml(m.value || '')}
      </div>
      <div class="text-[10px] text-surface-400 block mt-0.5 font-light">${escapeHtml(stripHtml(m.subtext || ''))}</div>
      <div class="text-[9px] text-surface-500 font-mono mt-2 pt-2 border-t border-surface-800/60 flex items-center justify-between">
        <span>PERIOD: ${escapeHtml(stripHtml(m.source_period || ''))}</span>
        <span class="text-sand text-[9px] uppercase tracking-wider">${escapeHtml(m.type ? m.type.replace(/_/g, ' ') : 'CONTEXT')}</span>
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
  if (totalEl && stats.total_evidence_records != null) {
    totalEl.textContent = `${stats.total_evidence_records} Records`;
  }
  if (sourcesEl && stats.monitored_sources_count != null) {
    sourcesEl.textContent = `${stats.monitored_sources_count} Sources`;
  }
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
   ========================================================================== */
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
   8. ARABIC LANGUAGE NOTICE MODAL
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
