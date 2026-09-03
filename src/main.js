// 404TN - Main Frontend Controller (src/main.js)
import { initGeospatialMonitor } from './map.js';
import { initEvidenceDrawer, openEvidenceDrawer } from './evidence-drawer.js';
import { initTimelineController } from './timeline.js';
import { initAccountabilityController } from './accountability.js';
import { getGabesDossier, getStats } from './api.js';

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
   3. THE SIX FILES DATA & DOSSIER MODAL
   ========================================================================== */
const FILES_DATA = {
  water: {
    id: "01",
    title: "Water: Cuts, Restrictions, Infrastructure & Regional Inequality",
    category: "RESOURCE COLLAPSE",
    status: "CRITICAL SYSTEMIC DEFICIT",
    summary: "In Summer 2026, Tunisia faces its seventh consecutive year of drought compounded by aging hydraulic distribution infrastructure losing over 32% of potable water to leakages. SONEDE rationing quotas have extended from nocturnal cuts to multi-day disruptions in central and southern governorates, while agricultural irrigation remains severely restricted.",
    keyMetrics: [
      { label: "National Dam Reserve", value: "21.4%", note: "Lowest recorded level since modern reservoir tracking began", evidence_id: "EV-WATER-01" },
      { label: "Distribution Network Loss", value: "32.8%", note: "Aging cast-iron and asbestos-cement distribution pipes", evidence_id: "EV-WATER-01" },
      { label: "Unserved Rural Population", value: "320,000+", note: "Relying on unregulated private tankers or untreated springs", evidence_id: "EV-WATER-01" },
      { label: "Daily Rationing Window", value: "9h - 18h", note: "Extended nocturnal pressure reduction across 18 governorates", evidence_id: "EV-WATER-01" }
    ],
    accountableInstitutions: [
      "SONEDE (National Water Distribution Utility)",
      "Ministry of Agriculture, Hydraulic Resources and Maritime Fisheries",
      "Presidency of the Republic (National Water Crisis Committee)"
    ],
    documentedEvents: [
      { date: "June 2026", desc: "SONEDE issues circular extending emergency water-saving decree prohibiting tap water for car washing, green spaces, and non-essential uses." },
      { date: "July 2026", desc: "Protests in Sbeitla, Kasserine, and Fernana over multi-day dry taps during 44°C heatwave conditions." },
      { date: "August 2026", desc: "Official presidential statement attributes water interruptions to deliberate sabotage by political adversaries; technical audits highlight pump failures and low head pressure." }
    ],
    evidenceSources: [
      "SONEDE Technical Bulletin No. 44 (Water balance Q2 2026)",
      "ONAGRI Dam Volume Saturation Index (August 2026)",
      "FTDES (Tunisian Forum for Economic and Social Rights) Water Map & Protest Registry"
    ]
  },
  electricity: {
    id: "02",
    title: "Electricity: Outages, Network Load & Service Reliability",
    category: "ENERGY SECURITY",
    status: "LOAD-SHEDDING RISK HIGH",
    summary: "Record summer heatwaves pushed national electricity demand to 4,825 MW, exceeding domestic natural gas generation capacity. Reliance on imported Algerian gas and debt burdens at STEG have constrained preventive maintenance on combined-cycle turbines in Sousse and Radès.",
    keyMetrics: [
      { label: "Peak National Grid Demand", value: "4,825 MW", note: "Exceeding reliable baseline generation threshold", evidence_id: "EV-ENERGY-01" },
      { label: "Natural Gas Import Share", value: "54%", note: "Heavy fiscal exposure to international energy contracts", evidence_id: "EV-ENERGY-01" },
      { label: "Unplanned Outage Frequency", value: "+42%", note: "YoY increase during July-August peak thermal hours", evidence_id: "EV-ENERGY-01" },
      { label: "Renewable Grid Share", value: "4.1%", note: "Delayed private-public solar concessions (TuNur / STEG)", evidence_id: "EV-ENERGY-01" }
    ],
    accountableInstitutions: [
      "STEG (Tunisian Company of Electricity and Gas)",
      "Ministry of Industry, Mines and Energy",
      "Central Bank of Tunisia (BCT - Energy Import Letter of Credits)"
    ],
    documentedEvents: [
      { date: "June 2026", desc: "STEG initiates coordinated 45-minute rotating load shedding in southern industrial parks." },
      { date: "July 2026", desc: "Transformer explosion at Sfax substation leaves 140,000 residents without air conditioning during 46°C peak." },
      { date: "August 2026", desc: "Emergency gas deliveries negotiated with Sonatrach under bilateral presidential protocols." }
    ],
    evidenceSources: [
      "STEG Annual Operational Dispatch Log",
      "Observatoire National de l'Énergie et des Mines Monthly Energy Statistics",
      "Sfax Chamber of Commerce Industrial Loss Impact Survey"
    ]
  },
  work: {
    id: "03",
    title: "Work: Unemployment, Wages & Economic Pressure",
    category: "ECONOMIC STAGNATION",
    status: "STRUCTURAL DECLINE",
    summary: "Official unemployment stands at 16.2%, but reaches 38.6% among university graduates and 44% for women in interior governorates. Double-digit cumulative food inflation over 2024-2026 has eroded real purchasing power, while civil service hiring freezes remain in place to meet fiscal deficit targets.",
    keyMetrics: [
      { label: "Graduate Unemployment", value: "38.6%", note: "Disproportionately high in Kairouan, Sidi Bouzid, and Gafsa", evidence_id: "EV-WORK-01" },
      { label: "Informal Economy Share", value: "41.5%", note: "Percent of non-agricultural labor force without social security", evidence_id: "EV-WORK-01" },
      { label: "Cumulative Food Price Rise", value: "+34.2%", note: "2023-2026 essential basket (cooking oil, sugar, coffee, dairy)", evidence_id: "EV-WORK-01" },
      { label: "Minimum Wage (SMIG 48h)", value: "492 TND", note: "Equivalent to ~$160/month, lagging median living costs", evidence_id: "EV-WORK-01" }
    ],
    accountableInstitutions: [
      "Ministry of Social Affairs",
      "Ministry of Economy and Planning",
      "INS (National Institute of Statistics)",
      "National Reconciliation Commission (Al-Sulh Al-Jazā'ī)"
    ],
    documentedEvents: [
      { date: "May 2026", desc: "Law graduates and doctorates stage sit-in in front of Ministry of Education protesting Law 38 non-application." },
      { date: "July 2026", desc: "Price caps on poultry and produce lead to temporary retail shortages and vendor strikes." },
      { date: "August 2026", desc: "Audit of state-owned enterprises (ETAP, Tunisair, Transtu) reports frozen recruitment and pension arrears." }
    ],
    evidenceSources: [
      "INS Quarterly Labor Force Survey (Q2 2026)",
      "UGTT Department of Studies Economic Bulletin",
      "World Bank Tunisia Economic Monitor (Summer 2026 Edition)"
    ]
  },
  migration: {
    id: "04",
    title: "Migration: Tunisians Leaving, African Migration & Border Policy",
    category: "HUMAN MOBILITY",
    status: "HUMANITARIAN PRESSURE",
    summary: "Tunisia remains simultaneously a primary departure hub for Tunisian youth seeking European asylum/labor and a high-risk transit country for Sub-Saharan African migrants. Bilateral agreements with the EU and Italy have intensified maritime interceptions by the National Guard, resulting in contentious inland encampments around El Amra and Jbeniana.",
    keyMetrics: [
      { label: "Interceptions at Sea", value: "34,200+", note: "Documented by Maritime National Guard Jan-August 2026", evidence_id: "EV-MIGRATION-01" },
      { label: "Tunisian Nationals Arrived in Italy", value: "11,800", note: "Young adults, families, and unaccompanied minors (UNHCR)", evidence_id: "EV-MIGRATION-01" },
      { label: "Displaced Persons in Olive Groves", value: "9,500+", note: "Informal encampments in El Amra/Jbeniana rural zones", evidence_id: "EV-MIGRATION-01" },
      { label: "Search & Rescue Fatalities", value: "612", note: "Documented shipwrecks off Kerkennah and Zarzis coasts", evidence_id: "EV-MIGRATION-01" }
    ],
    accountableInstitutions: [
      "Ministry of Interior (National Guard & Border Police)",
      "Ministry of Foreign Affairs, Migration and Tunisians Abroad",
      "European Commission / Italian Ministry of Interior"
    ],
    documentedEvents: [
      { date: "June 2026", desc: "Security sweeps in Sfax center redirect asylum seekers to rural olive groves with restricted NGO aid access." },
      { date: "July 2026", desc: "Joint European-Tunisian border management delegation visits Tabarka and Zarzis radar installations." },
      { date: "August 2026", desc: "Independent documentation of return pushbacks and water scarcity in southern buffer zones." }
    ],
    evidenceSources: [
      "FTDES Migration Incident Monitor (Monthly Reports)",
      "UNHCR Mediterranean Situational Updates",
      "IOM Missing Migrants Project Central Mediterranean Registry"
    ]
  },
  publicServices: {
    id: "05",
    title: "Public Services: Healthcare, Transport & Municipal Breakdown",
    category: "CIVIC INFRASTRUCTURE",
    status: "ACUTE FUNCTIONAL STRAIN",
    summary: "Following the dissolution of elected municipal councils in 2023, local governance under appointed special delegations has struggled with waste management and sanitation. Public hospitals face shortages of anesthetics, antibiotics, and oncology treatments, while the national transport fleet operates at 35% nominal availability.",
    keyMetrics: [
      { label: "Operational Metro/Bus Fleet", value: "34.5%", note: "Transtu rolling stock available in Greater Tunis", evidence_id: "EV-WATER-01" },
      { label: "Essential Medicine Stockouts", value: "240+ drugs", note: "Central Pharmacy (PCT) import supplier arrears", evidence_id: "EV-WATER-01" },
      { label: "Municipal Waste Treatment Deficit", value: "52%", note: "Unregulated open-air dumping across interior governorates", evidence_id: "EV-WATER-01" },
      { label: "Doctor Emigration Rate", value: "680/year", note: "Young medical residents leaving for France and Germany", evidence_id: "EV-WATER-01" }
    ],
    accountableInstitutions: [
      "Ministry of Health & Pharmacie Centrale de Tunisie (PCT)",
      "Ministry of Transport (Transtu & SNCFT)",
      "Ministry of Interior (Special Delegations / Local Municipalities)"
    ],
    documentedEvents: [
      { date: "June 2026", desc: "Medical residents strike across university hospitals in Sousse, Monastir, and Tunis over equipment shortages." },
      { date: "July 2026", desc: "SNCFT halts suburban southern railway line for 4 days due to unmaintained catenary wire failures." },
      { date: "August 2026", desc: "Sfax waste crisis resurfaces with illegal landfill burning near Thyna archaeological reserve." }
    ],
    evidenceSources: [
      "Tunisian Medical Council (Conseil National de l'Ordre des Médecins) Annual Registry",
      "Transtu Internal Fleet Availability Audit",
      "Cour des Comptes (Court of Audit) Municipal Administration Report"
    ]
  },
  institutions: {
    id: "06",
    title: "Rights & Institutions: Hyper-Presidency & Legal Frameworks",
    category: "GOVERNANCE & ACCOUNTABILITY",
    status: "CONSOLIDATED CONCENTRATION",
    summary: "Under the 2022 Constitution, executive authority is concentrated in the presidency with reduced parliamentary oversight. Decree 54 on cybercrime has been increasingly used to detain journalists, political commentators, and lawyers, while the Supreme Judicial Council remains under temporary executive appointment.",
    keyMetrics: [
      { label: "Decree 54 Prosecutions", value: "70+ cases", note: "Targeting journalists, lawyers, political figures, and bloggers", evidence_id: "EV-INSTITUTIONS-01" },
      { label: "Dissolved Constitutional Bodies", value: "5 of 6", note: "Including Anti-Corruption Authority (INLUCC) and elected CSM", evidence_id: "EV-INSTITUTIONS-01" },
      { label: "Journalists in Detention / Trial", value: "14", note: "Documented by SNJT (National Union of Tunisian Journalists)", evidence_id: "EV-INSTITUTIONS-01" },
      { label: "Independent Electoral Commission", value: "Executive-appointed", note: "ISIE members directly appointed by presidential decree", evidence_id: "EV-INSTITUTIONS-01" }
    ],
    accountableInstitutions: [
      "Presidency of the Republic (Carthage)",
      "Ministry of Justice",
      "ISIE (Independent High Authority for Elections)",
      "Ministry of Communication Technologies"
    ],
    documentedEvents: [
      { date: "May 2026", desc: "Bar Association national strike following police raid on Tunis Bar House and arrest of defense counsel." },
      { date: "July 2026", desc: "Civil society draft law introduces strict foreign funding registration requirements under Ministry oversight." },
      { date: "August 2026", desc: "State media directives mandate balance of official presidency bulletins in prime-time slots." }
    ],
    evidenceSources: [
      "Official Gazette of the Republic of Tunisia (JORT Decrees)",
      "SNJT Press Freedom Observatory Reports",
      "Amnesty International / Human Rights Watch Tunisia Documentation"
    ]
  }
};

function initFilesDossierModal() {
  const modal = document.getElementById("file-dossier-modal");
  const closeBtn = document.getElementById("close-dossier-modal");
  const triggerRows = document.querySelectorAll("[data-file-key]");

  if (!modal) return;

  const openDossier = (key) => {
    const data = FILES_DATA[key];
    if (!data) return;

    document.getElementById("modal-file-num").textContent = `FILE ${data.id}`;
    document.getElementById("modal-file-category").textContent = data.category;
    document.getElementById("modal-file-title").textContent = data.title;
    document.getElementById("modal-file-status").textContent = data.status;
    document.getElementById("modal-file-summary").textContent = data.summary;

    const metricsContainer = document.getElementById("modal-file-metrics");
    metricsContainer.innerHTML = data.keyMetrics.map(m => `
      <div class="p-4 bg-background-subtle border border-surface-800 cursor-pointer hover:border-surface-600 transition-colors" data-evidence-id="${m.evidence_id || 'EV-WATER-01'}">
        <div class="text-[11px] font-mono text-surface-400 uppercase tracking-meta">${m.label}</div>
        <div class="text-2xl font-editorial font-semibold text-bone-100 my-1 text-crimson">${m.value}</div>
        <div class="text-xs text-surface-400 leading-relaxed font-light">${m.note}</div>
      </div>
    `).join("");

    const instContainer = document.getElementById("modal-file-institutions");
    instContainer.innerHTML = data.accountableInstitutions.map(i => `
      <li class="flex items-start text-xs text-surface-300 gap-2">
        <span class="text-crimson font-mono select-none">■</span>
        <span>${i}</span>
      </li>
    `).join("");

    const eventsContainer = document.getElementById("modal-file-events");
    eventsContainer.innerHTML = data.documentedEvents.map(e => `
      <div class="relative pl-5 pb-4 border-l border-surface-800 last:border-l-0">
        <span class="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-crimson"></span>
        <div class="text-xs font-mono text-crimson uppercase font-medium">${e.date}</div>
        <p class="text-xs text-surface-300 mt-1 leading-relaxed font-light">${e.desc}</p>
      </div>
    `).join("");

    const sourcesContainer = document.getElementById("modal-file-sources");
    sourcesContainer.innerHTML = data.evidenceSources.map(s => `
      <li class="flex items-start text-xs font-mono text-surface-400 gap-2 bg-surface-900/60 p-2.5 border border-surface-800">
        <span class="text-sand select-none font-semibold">SRC:</span>
        <span class="text-surface-300">${s}</span>
      </li>
    `).join("");

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
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
    <div class="p-4 bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors cursor-pointer group" data-evidence-id="${m.evidence_id}">
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
        <span class="text-sand group-hover:translate-x-1 transition-transform">INSPECT ↗</span>
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
    phase: "THE PROMISE",
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
    phase: "THE RUPTURE",
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
    phase: "THE NEW POLITICAL SYSTEM",
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
    phase: "CONSOLIDATION",
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
    phase: "THE RESULTS",
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
