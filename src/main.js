// 404TN - Main Frontend Controller (src/main.js)
import { initGeospatialMonitor } from './map.js';
import { initEvidenceDrawer } from './evidence-drawer.js';
import { initTimelineController } from './timeline.js';
import { initAccountabilityController } from './accountability.js';
import { getGabesDossier, getStats, getIssueBySlug } from './api.js';
import { escapeHtml, stripHtml } from './utils.js';
import { initRouter, setRouteViewHandler, updateActiveNavLinks } from './router.js';
import {
  DOSSIER_REGISTRY,
  renderDossierViewHtml,
  renderGabesReportViewHtml,
  renderPresidencyReportViewHtml,
  renderPresidencyArchiveViewHtml,
  initPresidencyArchiveController,
  renderHomepageHtml,
  renderSummer2026Html,
  renderTheFilesHtml,
  renderTimelineHtml,
  renderStateResponseHtml,
  renderEvidenceHtml,
  renderMethodologyHtml,
  renderStatementHtml,
  renderGeospatialHtml
} from './dossier-data.js';

document.addEventListener("DOMContentLoaded", async () => {
  initHeader();
  initMobileMenu();
  initEvidenceDrawer();
  initSecureDropModal();
  initLanguageSelector();

  // Connect Router Handlers for Modular Dynamic Views
  setRouteViewHandler((cleanPath, routeConfig) => {
    renderRouteView(cleanPath, routeConfig);
  });

  initRouter();
});

/* ==========================================================================
   1. STICKY HEADER
   ========================================================================== */
function initHeader() {
  const header = document.getElementById("main-header");
  if (!header) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 30) {
      header.classList.add("bg-background/95", "shadow-2xl", "border-b", "border-surface-800");
      header.classList.remove("bg-background/70");
    } else {
      header.classList.remove("bg-background/95", "shadow-2xl", "border-b", "border-surface-800");
      header.classList.add("bg-background/70");
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
   3. UNIFIED MODULAR ROUTE VIEW DISPATCHER
   ========================================================================== */
export function renderRouteView(cleanPath, routeConfig) {
  const container = document.getElementById("content-views");
  if (!container) return;

  if (!routeConfig) {
    container.innerHTML = renderHomepageHtml();
    loadStatsData();
    return;
  }

  switch (routeConfig.type) {
    case 'home':
      container.innerHTML = renderHomepageHtml();
      loadStatsData();
      break;

    case 'summer':
      container.innerHTML = renderSummer2026Html();
      break;

    case 'the-files':
      container.innerHTML = renderTheFilesHtml();
      break;

    case 'gabes':
      container.innerHTML = renderGabesReportViewHtml();
      getGabesDossier().then(liveData => {
        if (liveData && container.querySelector(".gabes-special-report")) {
          container.innerHTML = renderGabesReportViewHtml(liveData);
        }
      });
      break;

    case 'presidency':
      container.innerHTML = renderPresidencyReportViewHtml();
      break;

    case 'presidency-archive':
      container.innerHTML = renderPresidencyArchiveViewHtml();
      initPresidencyArchiveController();
      break;

    case 'timeline':
      container.innerHTML = renderTimelineHtml();
      initTimelineController();
      break;

    case 'state-response':
      container.innerHTML = renderStateResponseHtml();
      initAccountabilityController();
      break;

    case 'evidence':
      container.innerHTML = renderEvidenceHtml();
      break;

    case 'methodology':
      container.innerHTML = renderMethodologyHtml();
      break;

    case 'statement':
      container.innerHTML = renderStatementHtml();
      break;

    case 'geospatial':
      container.innerHTML = renderGeospatialHtml();
      initGeospatialMonitor();
      break;

    case 'issue':
      const issueKey = routeConfig.issueKey;
      container.innerHTML = renderDossierViewHtml(issueKey);
      const meta = DOSSIER_REGISTRY[issueKey];
      const slug = meta ? meta.slug : issueKey;
      getIssueBySlug(slug).then(liveData => {
        if (liveData && container.querySelector(".issue-dossier-page")) {
          container.innerHTML = renderDossierViewHtml(issueKey, liveData);
        }
      });
      break;

    default:
      container.innerHTML = renderHomepageHtml();
      loadStatsData();
      break;
  }
}

// Backward compatibility helper exports
export function showDossierView(issueKey) {
  renderRouteView(`/issues/${issueKey}`, { type: 'issue', issueKey });
}
export function showGabesReportView() {
  renderRouteView('/gabes', { type: 'gabes' });
}
export function showPresidencyReportView() {
  renderRouteView('/presidency', { type: 'presidency' });
}
export function showStandardViews(sectionId) {
  renderRouteView('/', { type: 'home' });
}

/* ==========================================================================
   4. PUBLIC STATS LOADER
   ========================================================================== */
async function loadStatsData() {
  try {
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
  } catch (e) {
    // Graceful fallback for offline mode
  }
}

/* ==========================================================================
   5. SECURE DROP / WHISTLEBLOWER MODAL
   ========================================================================== */
function initSecureDropModal() {
  const modal = document.getElementById("secure-drop-modal");
  const openBtns = document.querySelectorAll("[data-open-securedrop]");
  const closeBtn = document.getElementById("close-securedrop-modal");

  if (!modal) return;

  const open = (e) => {
    if (e) e.preventDefault();
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
   6. ARABIC LANGUAGE NOTICE MODAL
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
