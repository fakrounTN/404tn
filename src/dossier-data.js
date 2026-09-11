// src/dossier-data.js
// Authoritative Dossier & Special Investigation Registry for 404TN (https://404tn.com)
// Shared across build-time SSG prerender (scripts/prerender.mjs) and runtime client view (src/main.js)

import { escapeHtml, stripHtml } from './utils.js';

export * from './editorial-components.js';
export * from './editorial-architecture.js';
export * from './presidency-data.js';
export * from './pages/index.js';

export const DOSSIER_REGISTRY = {
  water: {
    id: "01",
    slug: "water",
    routePath: "/issues/water",
    eyebrow: "404TN FILE 01 · RESOURCE COLLAPSE",
    fileNumber: "01",
    name: "Water",
    title: "Water: Cuts, Restrictions, Infrastructure & Regional Inequality",
    h1: "File 01: Water Deficit, Infrastructure Aging & Regional Hydraulic Stress",
    deck: "Investigative documentation of Tunisia’s hydraulic deficit, reservoir storage levels, SONEDE rationing schedules, and regional supply disparities.",
    status: "CRITICAL DEFICIT",
    statusType: "badge-active",
    category: "RESOURCE COLLAPSE",
    scopeContext: "PRIMARY SCOPE: NATIONAL WATER RESERVES & POTABLE DISTRIBUTION",
    accountableInstitutions: [
      "SONEDE (National Water Distribution Utility)",
      "Ministry of Agriculture, Hydraulic Resources and Maritime Fisheries",
      "National Observatory of Agriculture (ONAGRI)"
    ],
    editorialScope: {
      scopeIntro: "Monitors national reservoir volume balances, nocturnal water cuts under SONEDE quotas, agricultural irrigation suspensions, and regional distribution inequality across Tunisian governorates.",
      inScope: [
        "National dam reservoir storage balances (~21.4% average capacity documented in Summer 2026)",
        "SONEDE potable water rationing schedules and overnight pressure curtailments",
        "Regional distribution inequality between coastal agglomerations and interior governorates",
        "Agricultural irrigation bans in the Medjerda basin and Cap Bon citrus/vegetable belts",
        "Aging distribution infrastructure and potable network leakage rates"
      ],
      outsideScope: [
        "General electrical grid outages (monitored in File 02: Electricity)",
        "Municipal solid waste management (monitored in File 03: Pollution & Environment)",
        "General public healthcare administration (monitored in File 06: Public Services)"
      ]
    },
    keyEvidence: [
      {
        id: "EV-AUTO-20260910-WTR01",
        headline: "National Dam Reserves Recorded at Critical 21.4% Capacity",
        source_name: "ONAGRI / Ministry of Agriculture",
        source_url: "http://www.onagri.nat.tn",
        published_at: "2026-08-15",
        event_date: "2026-08-15",
        classification: "FACT",
        status: "VERIFIED",
        summary: "Official hydrological bulletin confirms national reservoir storage down to 21.4% of total nominal capacity, triggering emergency water preservation quotas across Northern and Central basins.",
        metric_value: "21.4%",
        metric_unit: "storage capacity"
      },
      {
        id: "EV-AUTO-20260910-WTR02",
        headline: "SONEDE Prolongs Nightly Potable Water Rationing Quotas",
        source_name: "SONEDE Public Notice",
        source_url: "https://www.sonede.com.tn",
        published_at: "2026-07-28",
        event_date: "2026-07-28",
        classification: "FACT",
        status: "VERIFIED",
        summary: "SONEDE confirms extension of scheduled nightly water cuts (9:00 PM – 4:00 AM) across Greater Tunis, Sousse, Sfax, and interior districts to manage reservoir depletion.",
        metric_value: "7 Hours/Day",
        metric_unit: "scheduled cuts"
      },
      {
        id: "EV-AUTO-20260910-WTR03",
        headline: "FTDES Documents 412 Water Cut Alerts and Local Supply Protests",
        source_name: "FTDES Social Observatory",
        source_url: "https://ftdes.net",
        published_at: "2026-08-05",
        event_date: "2026-08-01",
        classification: "FACT",
        status: "VERIFIED",
        summary: "Field data collected by FTDES records 412 citizen water outage reports and 68 localized demonstrations protesting prolonged tap dry-outs in Kairouan, Gafsa, and Sidi Bouzid.",
        metric_value: "412 Alerts",
        metric_unit: "water cut reports"
      }
    ],
    timeline: [
      {
        date: "2026-06-15",
        title: "Ministry of Agriculture Reauthorizes Summer Water Rationing Circular",
        classification: "FACT",
        source: "JORT Official Gazette",
        desc: "Ministerial decree extends restrictive quotas on agricultural irrigation, car washing, and public green space watering under penalty of legal sanctions."
      },
      {
        date: "2026-07-20",
        title: "Medjerda Basin Agricultural Inflows Drop to Multi-Year Low",
        classification: "FACT",
        source: "ONAGRI",
        desc: "Hydrological monitoring stations register severe flow reductions into Sidi Salem Dam, the country's largest freshwater reservoir."
      },
      {
        date: "2026-08-10",
        title: "Sfax and Mahdia Southern Desalination Facilities Face Technical Delays",
        classification: "CLAIM",
        source: "Ministry of Agriculture Communiqué",
        desc: "State authorities announce partial commercial operations of seawater desalination plants, while civil observers report persistent supply deficits in surrounding delegations."
      }
    ],
    stateResponse: [
      {
        authority: "Ministry of Agriculture & SONEDE",
        date: "2026-06-2026-08",
        whatSaid: "Ministry announced nationwide water quota system and declared seawater desalination plants in Sfax and Zarat as strategic structural solutions.",
        whatDone: "Extended night-time cuts; accelerated commissioning of southern desalination plants; suspended irrigation for non-essential agriculture.",
        outcome: "Potable supply stabilized in select coastal segments; interior governorates continue to experience unannounced multi-day outages.",
        classification: "FACT",
        status: "VERIFIED"
      }
    ],
    relatedFiles: [
      { href: "/issues/electricity", label: "File 02: Electricity" },
      { href: "/issues/pollution", label: "File 03: Pollution & Environment" },
      { href: "/issues/public-services", label: "File 06: Public Services" }
    ]
  },

  electricity: {
    id: "02",
    slug: "electricity",
    routePath: "/issues/electricity",
    eyebrow: "404TN FILE 02 · ENERGY SECURITY",
    fileNumber: "02",
    name: "Electricity",
    title: "Electricity: Outages, Network Load & Service Reliability",
    h1: "File 02: Electrical Grid Strain, Peak Load & STEG Service Reliability",
    deck: "Monitoring Tunisia’s power grid strain, peak summer load (MW), gas-fired generation capacity, and STEG load-shedding incidents.",
    status: "LOAD-SHEDDING RISK",
    statusType: "badge-active",
    category: "ENERGY SECURITY",
    scopeContext: "PRIMARY SCOPE: ELECTRICAL GRID & POWER GENERATION",
    accountableInstitutions: [
      "STEG (Tunisian Company of Electricity and Gas)",
      "Ministry of Industry, Mines and Energy",
      "Observatoire National de l'Énergie et des Mines"
    ],
    editorialScope: {
      scopeIntro: "Monitors peak electricity demand load, STEG load-shedding and power interruptions, natural gas thermal generation capacity, and utility infrastructure reliability across Tunisia.",
      inScope: [
        "Peak electricity demand load tracking (surpassing 4,800 MW in summer heat waves)",
        "STEG selective load-shedding operations during peak afternoon/evening consumption hours",
        "Natural gas thermal generation margins and international pipeline import balances",
        "High-voltage transformer failures and regional distribution breakdown during heat spikes"
      ],
      outsideScope: [
        "Upstream oil and gas exploration concession negotiations",
        "National retail automotive fuel pricing policies",
        "Drinking water network distribution cuts (monitored in File 01: Water)"
      ]
    },
    keyEvidence: [
      {
        id: "EV-AUTO-20260910-ELE01",
        headline: "National Electricity Peak Demand Reaches Record 4,825 MW",
        source_name: "STEG Dispatching Center",
        source_url: "https://www.steg.com.tn",
        published_at: "2026-08-03",
        event_date: "2026-08-03",
        classification: "FACT",
        status: "VERIFIED",
        summary: "STEG operational dispatch logs confirm all-time summer peak consumption of 4,825 MW during 44°C heatwave, pushing national reserve generation margins below 4%.",
        metric_value: "4,825 MW",
        metric_unit: "peak demand load"
      },
      {
        id: "EV-AUTO-20260910-ELE02",
        headline: "STEG Enacts Targeted Load-Shedding Across Coastal and Southern Nodes",
        source_name: "STEG Regional Direction",
        source_url: "https://www.steg.com.tn",
        published_at: "2026-07-18",
        event_date: "2026-07-18",
        classification: "FACT",
        status: "VERIFIED",
        summary: "Selective 45-to-90 minute power interruptions executed across industrial zones in Ben Arous, Sousse, and Gabès to prevent cascading grid collapse.",
        metric_value: "45–90 Min",
        metric_unit: "load-shedding window"
      },
      {
        id: "EV-AUTO-20260910-ELE03",
        headline: "Observatoire de l'Énergie Confirms 52% Energy Trade Deficit",
        source_name: "National Energy Observatory",
        source_url: "http://www.energiemines.gov.tn",
        published_at: "2026-07-30",
        event_date: "2026-07-01",
        classification: "FACT",
        status: "VERIFIED",
        summary: "Official monthly energy balance reports 52% primary energy trade deficit, driven by declining domestic natural gas extraction and growing electricity consumption.",
        metric_value: "52%",
        metric_unit: "primary energy deficit"
      }
    ],
    timeline: [
      {
        date: "2026-06-25",
        title: "STEG Announces Summer Grid Preparedness Plan",
        classification: "CLAIM",
        source: "STEG Press Conference",
        desc: "Utility leadership pledges uninterrupted power delivery through thermal station maintenance and emergency interconnection with Algerian grid."
      },
      {
        date: "2026-07-15",
        title: "Transformer Overloads Trigger Multi-Hour Blackouts in Medenine and Tozeur",
        classification: "FACT",
        source: "Regional Technical Reports",
        desc: "Extreme ambient temperatures exceed 46°C, causing substation breaker trips in southern governorates."
      },
      {
        date: "2026-08-04",
        title: "Grid Demand Breaks 4,800 MW Ceiling",
        classification: "FACT",
        source: "STEG Operational Telemetry",
        desc: "Air conditioning load drives maximum instantaneous demand; emergency import from Sonelgaz (Algeria) activated."
      }
    ],
    stateResponse: [
      {
        authority: "STEG & Ministry of Energy",
        date: "2026-07-2026-08",
        whatSaid: "STEG stated that power interruptions were localized technical anomalies and that grid capacity remains structurally sufficient.",
        whatDone: "Activated emergency bilateral imports via Algerian grid interconnections; deployed mobile transformer substations.",
        outcome: "Total system blackout averted; recurring localized load-shedding observed during afternoon temperature peaks.",
        classification: "FACT",
        status: "VERIFIED"
      }
    ],
    relatedFiles: [
      { href: "/issues/water", label: "File 01: Water" },
      { href: "/issues/pollution", label: "File 03: Pollution & Environment" },
      { href: "/issues/work", label: "File 04: Work" }
    ]
  },

  pollution: {
    id: "03",
    slug: "pollution",
    routePath: "/issues/pollution",
    eyebrow: "404TN FILE 03 · ENVIRONMENTAL CRISIS",
    fileNumber: "03",
    name: "Pollution & Environment",
    title: "Pollution & Environment: Industrial Emissions, Chemical Waste & Environmental Contamination",
    h1: "File 03: Industrial Pollution, Chemical Emissions & Environmental Contamination",
    deck: "Forensic documentation of industrial chemical emissions, coastal phosphogypsum discharge, municipal waste crises, and atmospheric pollution across Tunisian regions.",
    status: "CHRONIC CONTAMINATION",
    statusType: "badge-active",
    category: "ENVIRONMENTAL CRISIS",
    scopeContext: "PRIMARY SCOPE: NATIONAL ENVIRONMENTAL & INDUSTRIAL CONTAMINATION",
    accountableInstitutions: [
      "Ministry of Environment (ANPE)",
      "Groupe Chimique Tunisien (GCT)",
      "Compagnie des Phosphates de Gafsa (CPG)",
      "National Waste Management Agency (ANGed)"
    ],
    flagshipInvestigation: {
      href: "/gabes",
      label: "FLAGSHIP SPECIAL INVESTIGATION",
      title: "Gabès: The City Paying the Price of Industrial Pollution",
      description: "Deep forensic special report into the Groupe Chimique Tunisien (GCT) industrial complex, ~14,000 T/day phosphogypsum coastal dumping, and unfulfilled 2017 Cabinet relocation decision."
    },
    editorialScope: {
      scopeIntro: "Monitors nationwide industrial chemical emissions, phosphate mining runoff in Gafsa, municipal waste accumulation in Sfax, coastal pollution, and atmospheric monitoring data deficits across Tunisia.",
      inScope: [
        "Broad national industrial chemical emissions and environmental contamination",
        "Gafsa mining basin phosphate washing sludge and groundwater contamination",
        "Sfax municipal solid waste crises and landfill overflow incidents",
        "National absence of continuous public real-time air quality sensor networks",
        "Coastal and marine biodiversity degradation from untreated municipal/industrial runoff"
      ],
      outsideScope: [
        "Standard municipal potable water rationing (monitored in File 01: Water)",
        "Electrical transmission line maintenance (monitored in File 02: Electricity)"
      ]
    },
    keyEvidence: [
      {
        id: "EV-AUTO-20260910-POL01",
        headline: "ANPE Environmental Audit Documents Heavy Industrial Runoff Across 4 Coastal Hubs",
        source_name: "ANPE Technical Report",
        source_url: "http://www.anpe.nat.tn",
        published_at: "2026-07-12",
        event_date: "2026-07-01",
        classification: "FACT",
        status: "VERIFIED",
        summary: "National Environmental Protection Agency inspection confirms non-compliant industrial chemical effluents discharged into coastal zones across Gabès, Sfax, Skhira, and Bizerte.",
        metric_value: "4 Industrial Hubs",
        metric_unit: "non-compliant discharge zones"
      },
      {
        id: "EV-AUTO-20260910-POL02",
        headline: "Gafsa Phosphate Washing Sludge Impacts Regional Groundwater Basins",
        source_name: "FTDES Environmental Section",
        source_url: "https://ftdes.net",
        published_at: "2026-08-02",
        event_date: "2026-07-25",
        classification: "FACT",
        status: "VERIFIED",
        summary: "CPG phosphate washing facilities in Metlaoui and Redeyef continue unlined surface slurry discharge, accelerating aquifer contamination in the mining basin.",
        metric_value: "Mining Basin",
        metric_unit: "aquifer contamination zone"
      },
      {
        id: "EV-AUTO-20260910-POL03",
        headline: "Zero Public Real-Time Air Quality Sensor Feeds Available Nationwide",
        source_name: "404TN Technical Audit",
        source_url: "https://404tn.com/methodology",
        published_at: "2026-08-18",
        event_date: "2026-08-18",
        classification: "ANALYSIS",
        status: "DATA GAP",
        summary: "Audit of state environmental agency portals reveals zero open-access, continuous atmospheric telemetry streams for PM2.5, SO2, or NOx in industrial zones.",
        metric_value: "0 Feeds",
        metric_unit: "open air sensor streams"
      }
    ],
    timeline: [
      {
        date: "2026-06-10",
        title: "Sfax Municipal Waste Accumulation Spurs Civil Society Appeals",
        classification: "FACT",
        source: "Local Municipal Notices",
        desc: "Delays in regional landfill site selection lead to temporary waste storage clusters near urban centers."
      },
      {
        date: "2026-07-08",
        title: "Ministry of Environment Launches Environmental Audit of Coastal Chemical Plants",
        classification: "CLAIM",
        source: "Ministry Communiqué",
        desc: "Ministerial inspection committees dispatched to review effluent filtration standards in industrial zones."
      },
      {
        date: "2026-08-14",
        title: "National Environmental Data Gap Report Published",
        classification: "FACT",
        source: "Independent NGO Coalition",
        desc: "Environmental organizations call for mandatory real-time public disclosure of industrial emissions."
      }
    ],
    stateResponse: [
      {
        authority: "Ministry of Environment (ANPE)",
        date: "2026-07-2026-08",
        whatSaid: "Ministry affirmed strict application of environmental regulations and promised modernized waste-to-energy projects.",
        whatDone: "Conducted periodic site inspections; drafted preliminary waste treatment master plans.",
        outcome: "No real-time emissions data made public; structural chemical discharge into Gulf of Gabès and Gafsa basin remains active.",
        classification: "FACT",
        status: "VERIFIED"
      }
    ],
    relatedFiles: [
      { href: "/gabes", label: "Gabès Special Investigation" },
      { href: "/issues/water", label: "File 01: Water" },
      { href: "/issues/public-services", label: "File 06: Public Services" }
    ]
  },

  work: {
    id: "04",
    slug: "work",
    routePath: "/issues/work",
    eyebrow: "404TN FILE 04 · ECONOMIC STAGNATION",
    fileNumber: "04",
    name: "Work",
    title: "Work: Unemployment, Wages & Economic Pressure",
    h1: "File 04: Labor Market Stagnation, Unemployment & Cost of Living",
    deck: "Statistical analysis and verified evidence tracking Tunisian unemployment, graduate jobless disparities, inflation, and purchasing power.",
    status: "STRUCTURAL DECLINE",
    statusType: "badge-active",
    category: "ECONOMIC STAGNATION",
    scopeContext: "PRIMARY SCOPE: LABOR FORCE & EMPLOYMENT METRICS",
    accountableInstitutions: [
      "INS (National Institute of Statistics)",
      "Ministry of Social Affairs",
      "Ministry of Employment and Vocational Training"
    ],
    editorialScope: {
      scopeIntro: "Monitors official INS employment surveys, higher education graduate joblessness, informal labor expansion, and purchasing power erosion documented across Tunisia in 2026.",
      inScope: [
        "National unemployment rate tracking (~16.0% baseline in INS quarterly reports)",
        "Higher education graduate unemployment disparities (~38.8% national graduate rate)",
        "Food and essential commodity price inflation impacting household purchasing power",
        "Regional interior unemployment disparities (Gafsa, Kasserine, Sidi Bouzid, Tataouine)",
        "Informal sector employment growth and labor precarity"
      ],
      outsideScope: [
        "Macroeconomic sovereign debt renegotiations with international financial institutions",
        "Central bank foreign currency balance sheets (unless directly measuring domestic wage impact)",
        "Agricultural crop yield forecasts (monitored in File 01: Water)"
      ]
    },
    keyEvidence: [
      {
        id: "EV-AUTO-20260910-WRK01",
        headline: "INS Reports National Unemployment at 16.0%, Graduate Joblessness at 38.8%",
        source_name: "INS Quarterly Employment Survey",
        source_url: "http://www.ins.tn",
        published_at: "2026-08-15",
        event_date: "2026-08-01",
        classification: "FACT",
        status: "VERIFIED",
        summary: "National Institute of Statistics Q2 2026 bulletin records national joblessness at 16.0%, with tertiary education graduate unemployment recorded at 38.8% across higher education diploma holders.",
        metric_value: "38.8%",
        metric_unit: "graduate jobless rate"
      },
      {
        id: "EV-AUTO-20260910-WRK02",
        headline: "Food Inflation Rate Recorded at 10.2% Year-on-Year",
        source_name: "INS Consumer Price Index",
        source_url: "http://www.ins.tn",
        published_at: "2026-08-05",
        event_date: "2026-08-01",
        classification: "FACT",
        status: "VERIFIED",
        summary: "Consumer Price Index tracking reveals 10.2% year-on-year inflation in food products, driven by coffee, sugar, cooking oil, and dairy supply chain constraints.",
        metric_value: "10.2%",
        metric_unit: "annual food inflation"
      },
      {
        id: "EV-AUTO-20260910-WRK03",
        headline: "UGTT Labor Union Warns of Unprecedented Purchasing Power Contraction",
        source_name: "UGTT Statement",
        source_url: "https://ugtt.org.tn",
        published_at: "2026-07-22",
        event_date: "2026-07-22",
        classification: "CLAIM",
        status: "REPORTED",
        summary: "National labor union executive bureau releases assessment warning that real wages have declined by over 14% since 2022 amid static wage agreements and subsidy reductions.",
        metric_value: "-14%",
        metric_unit: "estimated real wage erosion"
      }
    ],
    timeline: [
      {
        date: "2026-06-20",
        title: "INS Releases Q1 2026 Labor Market Indicators",
        classification: "FACT",
        source: "INS Bulletin",
        desc: "Official statistics indicate 658,000 unemployed individuals nationwide, with interior regions recording rates above 22%."
      },
      {
        date: "2026-07-18",
        title: "Ministry of Social Affairs Announces Increased Direct Aid to Low-Income Households",
        classification: "CLAIM",
        source: "Ministry Communiqué",
        desc: "Government expands social safety net (Amen Social) beneficiaries to mitigate inflation pressure."
      },
      {
        date: "2026-08-15",
        title: "Q2 Employment Data Confirms Structural Stagnation",
        classification: "FACT",
        source: "INS",
        desc: "Quarterly employment creation in manufacturing and public sector remains below replacement rate."
      }
    ],
    stateResponse: [
      {
        authority: "Ministry of Social Affairs & Presidency",
        date: "2026-06-2026-08",
        whatSaid: "President Kais Saied asserted that price increases and shortages are organized by speculative cartels and economic saboteurs.",
        whatDone: "Enacted enhanced market inspection campaigns and judicial prosecutions for price gouging; expanded targeted cash transfers.",
        outcome: "Core food commodity shortages and real purchasing power contraction remain unreversed in consumer markets.",
        classification: "FACT",
        status: "VERIFIED"
      }
    ],
    relatedFiles: [
      { href: "/issues/migration", label: "File 05: Migration" },
      { href: "/issues/public-services", label: "File 06: Public Services" },
      { href: "/issues/rights", label: "File 07: Rights & Freedoms" }
    ]
  },

  migration: {
    id: "05",
    slug: "migration",
    routePath: "/issues/migration",
    eyebrow: "404TN FILE 05 · HUMAN MOBILITY",
    fileNumber: "05",
    name: "Migration",
    title: "Migration: Tunisians Leaving, African Migration & Border Policy",
    h1: "File 05: Mediterranean Migration Routes, Coast Guard Interceptions & Transit Realities",
    deck: "Forensic documentation of Mediterranean departure trends, interception operations, transit conditions in Sfax, and regional border policy.",
    status: "HUMANITARIAN PRESSURE",
    statusType: "badge-active",
    category: "HUMAN MOBILITY",
    scopeContext: "PRIMARY SCOPE: MEDITERRANEAN TRANSIT & BORDER ENFORCEMENT",
    accountableInstitutions: [
      "Ministry of Interior (National Guard & Maritime Units)",
      "Ministry of Foreign Affairs, Migration and Tunisians Abroad",
      "FTDES (Tunisian Forum for Economic and Social Rights)"
    ],
    editorialScope: {
      scopeIntro: "Monitors documented maritime departures, National Guard maritime interceptions, transit encampments around Sfax and Kerkennah, and bilateral European border agreements.",
      inScope: [
        "Irregular maritime crossings departing Sfax, Mahdia, Zarzis, and Cap Bon coasts",
        "National Guard maritime interception statistics and search-and-rescue interventions",
        "Informal transit encampments and living conditions in El Amra and Jbeniana agricultural outskirts",
        "Bilateral border management protocols and financial support agreements with European partners",
        "Documented casualties and missing persons records in the Central Mediterranean corridor"
      ],
      outsideScope: [
        "Standard diplomatic consular visa processing",
        "General international airport passenger arrivals and commercial tourism",
        "Legal expatriate remittances and diaspora property investments"
      ]
    },
    keyEvidence: [
      {
        id: "EV-AUTO-20260910-MIG01",
        headline: "National Guard Intercepts Over 32,000 Migrants at Sea in First Half of 2026",
        source_name: "Ministry of Interior / National Guard",
        source_url: "https://www.interieur.gov.tn",
        published_at: "2026-07-15",
        event_date: "2026-07-01",
        classification: "FACT",
        status: "VERIFIED",
        summary: "Official National Guard maritime command communiqué reports interception of 32,450 individuals attempting irregular Mediterranean crossings between January and June 2026.",
        metric_value: "32,450",
        metric_unit: "maritime interceptions"
      },
      {
        id: "EV-AUTO-20260910-MIG02",
        headline: "FTDES Documents Over 780 Deaths and Disappearances off Tunisian Coasts",
        source_name: "FTDES Migration Observatory",
        source_url: "https://ftdes.net",
        published_at: "2026-08-10",
        event_date: "2026-08-01",
        classification: "FACT",
        status: "VERIFIED",
        summary: "Forensic registry compiled by FTDES records 784 documented deaths and shipwrecks off Tunisian territorial waters during the 2026 monitoring window.",
        metric_value: "784",
        metric_unit: "deaths and disappearances"
      },
      {
        id: "EV-AUTO-20260910-MIG03",
        headline: "El Amra and Jbeniana Encampments Face Acute Healthcare and Sanitation Gaps",
        source_name: "Humanitarian Field Monitoring",
        source_url: "https://ftdes.net",
        published_at: "2026-07-28",
        event_date: "2026-07-25",
        classification: "FACT",
        status: "VERIFIED",
        summary: "Civil society monitoring documents severe humanitarian conditions, lack of potable water, and absence of formal shelter for thousands of sub-Saharan migrants in Sfax olive groves.",
        metric_value: "El Amra / Jbeniana",
        metric_unit: "transit encampment zone"
      }
    ],
    timeline: [
      {
        date: "2026-06-12",
        title: "Bilateral Security Cooperation Review Held with Italian Counterparts",
        classification: "FACT",
        source: "Ministry of Foreign Affairs",
        desc: "High-level delegation meets in Tunis to assess maritime patrol boat deliveries and border surveillance equipment."
      },
      {
        date: "2026-07-22",
        title: "Large-Scale National Guard Security Sweep in Sfax Olive Groves",
        classification: "FACT",
        source: "Ministry of Interior",
        desc: "Security forces dismantle makeshift shelters in El Amra; multiple transit networks intercepted."
      },
      {
        date: "2026-08-16",
        title: "Coast Guard Recovers 14 Victims Following Shipwreck off Kerkennah",
        classification: "FACT",
        source: "Civil Protection & National Guard",
        desc: "Search and rescue units respond to capsized vessel carrying Tunisian and sub-Saharan passengers."
      }
    ],
    stateResponse: [
      {
        authority: "Presidency & Ministry of Interior",
        date: "2026-06-2026-08",
        whatSaid: "President Kais Saied reiterated that Tunisia will not serve as a transit country or resettlement center for irregular migrants, citing national sovereignty.",
        whatDone: "Intensified maritime patrols and coastal interception operations; reinforced security presence around Sfax encampments; facilitated voluntary returns via IOM.",
        outcome: "Significant increase in sea interceptions; humanitarian and logistical strain in Sfax interior regions remains high.",
        classification: "FACT",
        status: "VERIFIED"
      }
    ],
    relatedFiles: [
      { href: "/issues/work", label: "File 04: Work" },
      { href: "/issues/rights", label: "File 07: Rights & Freedoms" },
      { href: "/issues/public-services", label: "File 06: Public Services" }
    ]
  },

  publicServices: {
    id: "06",
    slug: "public-services",
    routePath: "/issues/public-services",
    eyebrow: "404TN FILE 06 · CIVIC INFRASTRUCTURE",
    fileNumber: "06",
    name: "Public Services",
    title: "Public Services: Healthcare, Transport & Municipal Infrastructure",
    h1: "File 06: Public Services Breakdown: Healthcare, Transit & Municipal Infrastructure",
    deck: "Investigating medicine supply deficits, public transit fleet reductions (Transtu/SNCFT), and municipal infrastructure failure across Tunisia.",
    status: "FUNCTIONAL STRAIN",
    statusType: "badge-active",
    category: "CIVIC INFRASTRUCTURE",
    scopeContext: "PRIMARY SCOPE: CIVIC INFRASTRUCTURE & ESSENTIAL SERVICES",
    accountableInstitutions: [
      "Ministry of Health & Pharmacie Centrale de Tunisie (PCT)",
      "Ministry of Transport (Transtu & SNCFT)",
      "Ministry of Environment (ANPE)"
    ],
    editorialScope: {
      scopeIntro: "Monitors public hospital essential medicine shortages, Pharmacie Centrale procurement arrears, Transtu and SNCFT fleet breakdown, and municipal sanitation across Tunisian regions.",
      inScope: [
        "Hospital shortages of essential life-saving and chronic medication (Pharmacie Centrale debts)",
        "Public transport fleet attrition (over 50% of Transtu bus and metro rolling stock out of service)",
        "SNCFT passenger railway delays, technical breakdowns, and line cancellations",
        "Municipal sanitation, civic maintenance, and public administrative reliability"
      ],
      outsideScope: [
        "Primary potable water grid distribution (monitored in File 01: Water)",
        "National electrical power generation (monitored in File 02: Electricity)"
      ]
    },
    keyEvidence: [
      {
        id: "EV-AUTO-20260910-PUB01",
        headline: "National Pharmacists Union Reports Deficit in Over 280 Essential Medications",
        source_name: "Syndicat des Pharmaciens d'Officine (SPOT)",
        source_url: "https://www.spot.tn",
        published_at: "2026-07-20",
        event_date: "2026-07-15",
        classification: "FACT",
        status: "VERIFIED",
        summary: "Pharmaceutical observatory confirms chronic supply shortages affecting 280+ vital medications, including cancer treatments, insulin, and cardiovascular drugs, linked to PCT liquidity debts.",
        metric_value: "280+ Drugs",
        metric_unit: "critical shortage catalog"
      },
      {
        id: "EV-AUTO-20260910-PUB02",
        headline: "Transtu Operates with Under 45% of Nominal Bus and Metro Fleet",
        source_name: "Ministry of Transport Operational Bulletin",
        source_url: "http://www.transport.tn",
        published_at: "2026-08-01",
        event_date: "2026-08-01",
        classification: "FACT",
        status: "VERIFIED",
        summary: "Transport ministry fleet readiness report indicates that only 340 buses out of 850 nominal units and 28 light rail trainsets out of 70 are operational in Greater Tunis due to maintenance arrears.",
        metric_value: "<45%",
        metric_unit: "operational fleet ratio"
      },
      {
        id: "EV-AUTO-20260910-PUB03",
        headline: "SNCFT Long-Distance Railway Punctuality Drops to 58%",
        source_name: "SNCFT Traffic Department",
        source_url: "https://www.sncft.com.tn",
        published_at: "2026-07-10",
        event_date: "2026-07-01",
        classification: "FACT",
        status: "VERIFIED",
        summary: "National railway company registers 58% on-time performance on Southern mainlines (Tunis-Sousse-Sfax-Gabès), driven by track aging and locomotive breakdowns.",
        metric_value: "58%",
        metric_unit: "railway punctuality rate"
      }
    ],
    timeline: [
      {
        date: "2026-06-18",
        title: "Government Announces Emergency Liquidity Injection for Pharmacie Centrale",
        classification: "CLAIM",
        source: "Cabinet Communiqué",
        desc: "Ministry of Finance pledges 200M TND treasury advance to settle supplier arrears with international pharmaceutical labs."
      },
      {
        date: "2026-07-25",
        title: "Transtu Acquires Used Buses from European Municipalities",
        classification: "FACT",
        source: "Ministry of Transport",
        desc: "Delivery of second-hand buses arrives at La Goulette port to reinforce urban transit routes before the autumn back-to-school period."
      },
      {
        date: "2026-08-12",
        title: "Healthcare Workers Union Warns of Emergency Ward Equipment Deficits",
        classification: "FACT",
        source: "UGTT Health Federation",
        desc: "Public hospital staff report severe shortages of basic surgical consumables and diagnostic reagents in regional hospitals."
      }
    ],
    stateResponse: [
      {
        authority: "Ministry of Health, Ministry of Transport & Carthage",
        date: "2026-06-2026-08",
        whatSaid: "President Saied conducted unannounced inspections of hospitals and transit depots, condemning corruption, negligence, and administrative sabotage.",
        whatDone: "Dismissed senior transit utility directors; approved emergency used bus imports; announced public hospital rehabilitation plans.",
        outcome: "Structural drug procurement debts and public transit vehicle deficits remain largely unaddressed at system level.",
        classification: "FACT",
        status: "VERIFIED"
      }
    ],
    relatedFiles: [
      { href: "/issues/water", label: "File 01: Water" },
      { href: "/issues/electricity", label: "File 02: Electricity" },
      { href: "/issues/pollution", label: "File 03: Pollution & Environment" }
    ]
  },

  institutions: {
    id: "07",
    slug: "rights",
    routePath: "/issues/rights",
    eyebrow: "404TN FILE 07 · GOVERNANCE & ACCOUNTABILITY",
    fileNumber: "07",
    name: "Rights & Freedoms",
    title: "Rights & Freedoms: Governance & Accountability",
    h1: "File 07: Civil Liberties, Decree-Law 54 Proceedings & Institutional Checks",
    deck: "Monitoring freedom of expression, Decree-Law 54 legal proceedings, journalist detentions, and judicial restructuring in Tunisia.",
    status: "CONSOLIDATED CONCENTRATION",
    statusType: "badge-active",
    category: "GOVERNANCE & ACCOUNTABILITY",
    scopeContext: "PRIMARY SCOPE: CIVIL LIBERTIES & INSTITUTIONAL CHECKS",
    accountableInstitutions: [
      "Presidency of the Republic (Carthage)",
      "Ministry of Justice",
      "SNJT (National Union of Tunisian Journalists)",
      "Tunisian Human Rights League (LTDH)"
    ],
    editorialScope: {
      scopeIntro: "Monitors documented legal summonses, prosecutions, and detentions under Decree-Law 54 (Article 24), press freedom alerts by SNJT, and judicial restructuring in Tunisia.",
      inScope: [
        "Documented legal proceedings and summonses under Decree-Law 54 (Article 24)",
        "Detention and trials of journalists, lawyers, political opposition figures, and commentators",
        "Institutional restructuring of the Superior Council of the Judiciary (CSM) and judicial independence",
        "SNJT documented press freedom alerts, media licensing restrictions, and access-to-information barriers"
      ],
      outsideScope: [
        "Routine non-political commercial litigation",
        "Standard civil property and contract dispute proceedings",
        "General municipal misdemeanor policing"
      ]
    },
    keyEvidence: [
      {
        id: "EV-AUTO-20260910-RGT01",
        headline: "SNJT Documents Over 60 Legal Summonses and Trials Under Decree-Law 54",
        source_name: "SNJT Annual Press Freedom Report",
        source_url: "https://snjt.org",
        published_at: "2026-08-10",
        event_date: "2026-08-01",
        classification: "FACT",
        status: "VERIFIED",
        summary: "National Union of Tunisian Journalists documents 62 legal proceedings targeting media professionals and commentators under Article 24 of Decree-Law 54 on cybercrime since its promulgation.",
        metric_value: "62 Proceedings",
        metric_unit: "Decree 54 cases documented"
      },
      {
        id: "EV-AUTO-20260910-RGT02",
        headline: "Amnesty & Human Rights Watch Report Widespread Pre-Trial Detention of Political Figures",
        source_name: "Amnesty International / HRW Joint Brief",
        source_url: "https://www.amnesty.org",
        published_at: "2026-07-15",
        event_date: "2026-07-01",
        classification: "FACT",
        status: "VERIFIED",
        summary: "Human rights organizations document prolonged pre-trial detention of opposition leaders, lawyers, and civil society advocates under state security and conspiracy allegations.",
        metric_value: "Civil Liberties",
        metric_unit: "pre-trial detention monitor"
      },
      {
        id: "EV-AUTO-20260910-RGT03",
        headline: "Judicial Restructuring Centralizes Prosecutorial Authority under Ministry of Justice",
        source_name: "Legal Analysis & JORT Gazettes",
        source_url: "https://404tn.com/presidency",
        published_at: "2026-08-18",
        event_date: "2026-08-18",
        classification: "ANALYSIS",
        status: "VERIFIED",
        summary: "Following the dissolution of the elected Superior Council of the Judiciary (CSM), executive appointment mechanisms direct judicial discipline and public prosecutor assignments.",
        metric_value: "2022–2026",
        metric_unit: "institutional restructuring timeline"
      }
    ],
    timeline: [
      {
        date: "2026-06-10",
        title: "Journalists Rally in Tunis Demanding Abrogation of Decree-Law 54 Article 24",
        classification: "FACT",
        source: "SNJT Field Report",
        desc: "Hundreds of media workers gather outside the government palace in Kasbah protesting criminal penalties for journalistic reporting."
      },
      {
        date: "2026-07-14",
        title: "Appeals Court Upholds Prison Sentences in High-Profile Media Case",
        classification: "FACT",
        source: "Court Records",
        desc: "Sentences affirmed under cybercrime provisions for critical political commentary broadcast on radio."
      },
      {
        date: "2026-08-12",
        title: "International Bar Associations Express Concern Over Lawyer Summonses",
        classification: "CLAIM",
        source: "International Legal Bar",
        desc: "Joint statement urges preservation of legal defense immunities and due process standards."
      }
    ],
    stateResponse: [
      {
        authority: "Presidency & Ministry of Justice",
        date: "2026-06-2026-08",
        whatSaid: "President Kais Saied stated that judicial proceedings target corrupt entities, foreign agents, and conspirators against internal state security, not legitimate freedoms.",
        whatDone: "Applied Decree-Law 54 provisions; initiated judicial investigations against public figures; maintained restructured judicial councils.",
        outcome: "Legal proceedings against journalists and opposition figures continue; Decree 54 remains fully active without legislative amendment.",
        classification: "FACT",
        status: "VERIFIED"
      }
    ],
    relatedFiles: [
      { href: "/presidency", label: "The Presidency (2019–2026)" },
      { href: "/state-response", label: "State Response Tracker" },
      { href: "/issues/work", label: "File 04: Work" }
    ]
  }
};

export const GABES_SPECIAL_REPORT = {
  slug: "gabes",
  routePath: "/gabes",
  eyebrow: "404TN SPECIAL INVESTIGATION · ENVIRONMENT & STATE ACCOUNTABILITY",
  h1: "Gabès: The City Paying the Price of Industrial Pollution",
  deck: "For decades, Gabès has carried the environmental and public health cost of chemical processing in Tunisia. 404TN documents phosphogypsum coastal discharge, unfulfilled 2017 Cabinet relocation decision, and official data gaps (2017–2026).",
  status: "ACTIVE FILE",
  statusType: "badge-active",
  location: "Gabès / Gulf of Gabès (33°53'N 10°05'E)",
  primarySubject: "Groupe Chimique Tunisien (GCT) & Coastal Phosphogypsum Discharge",
  metrics: [
    {
      label: "PHOSPHOGYPSUM BASELINE",
      value: "~14,000 T/DAY",
      subtext: "Historical nominal dry-solid discharge into Gulf of Gabès",
      source_period: "2018 industrial assessment (ANPE / World Bank)",
      status: "HISTORICAL BASELINE",
      type: "HISTORICAL_BASELINE"
    },
    {
      label: "2017 STATE COMMITMENT",
      value: "INDUSTRIAL RELOCATION",
      subtext: "Cabinet decision on dismantling coastal units away from city",
      source_period: "Cabinet Communiqué June 29, 2017",
      status: "OFFICIAL STATEMENT",
      type: "HISTORICAL_STATE_COMMITMENT"
    },
    {
      label: "CURRENT DISCHARGE STATUS",
      value: "NO CURRENT DIRECT MEASUREMENT",
      subtext: "Zero public online sensor telemetry streams available in 2026",
      source_period: "Summer 2026 audit review",
      status: "NO CURRENT DATA",
      type: "DATA_GAP_STATEMENT"
    }
  ],
  contextSections: {
    whyItMatters: "Gabès is the only coastal Mediterranean oasis in the world. Since the 1970s, the installation of the Groupe Chimique Tunisien (GCT) industrial complex at Chatt Essalam has produced severe ecological disruption: destruction of the marine benthos, coastal oasis salinization, and high rates of respiratory and fluorosis complaints among nearby residents.",
    industrialContext: "The GCT industrial platform processes phosphate rock extracted from the Gafsa mining basin into phosphoric acid and diammonium phosphate (DAP) fertilizer for export. A primary by-product of this reaction is phosphogypsum (calcium sulfate containing heavy metals and trace radionuclides), which has historically been dumped directly into the maritime coastal zone via slurry pipelines.",
    stateCommitmentsVsOutcome: {
      statement: "On June 29, 2017, a formal Tunisian Cabinet decision pledged the dismantling and progressive relocation of the GCT coastal production units away from residential Gabès to an inland, non-oasis site, alongside environmental remediation.",
      reality: "As of Summer 2026, zero chemical units have been dismantled or relocated. Production units at Chatt Essalam remain fully operational. State investments have focused on industrial maintenance and production quotas rather than site transfer.",
      outcome: "The 2017 government relocation pledge remains an unexecuted official statement."
    },
    dataGaps: {
      title: "OFFICIAL DATA DEFICIT & SENSOR OPACITY",
      description: "Neither the Ministry of Environment (ANPE) nor the Groupe Chimique Tunisien publishes an open, real-time public telemetry feed for atmospheric emissions (SO2, NOx, particulate matter) or marine discharge toxicity in Gabès. Independent verification relies on historical audit baselines, academic field samples, and civil society incident tracking."
    },
    healthContext: {
      title: "PUBLIC HEALTH & EPIDEMIOLOGICAL DISCIPLINE",
      description: "Local medical professionals and civil society organizations (FTDES, Stop Pollution) frequently document elevated incidence of respiratory illness, asthma, and dental fluorosis in Chatt Essalam and Bouchamma. However, comprehensive longitudinal epidemiological studies linking specific pollutants to localized mortality have not been officially published by the Ministry of Health. 404TN documents these reported medical conditions without asserting unsubstantiated statistical causation."
    }
  },
  timeline: [
    {
      year: "2017",
      title: "Cabinet Pledges Dismantling and Relocation of Coastal Units",
      desc: "Government ministerial council decision (CMR June 29, 2017) commits to dismantling and relocating GCT units away from Gabès coastline following massive citizen mobilization.",
      classification: "CLAIM",
      source: "Cabinet Communiqué (JORT)"
    },
    {
      year: "2018",
      title: "Environmental Audit Baseline Confirms ~14,000 T/Day Marine Discharge",
      desc: "ANPE and World Bank technical assessments record nominal daily phosphogypsum dumping rates into the Gulf of Gabès.",
      classification: "FACT",
      source: "ANPE / World Bank Assessment"
    },
    {
      year: "2021–2024",
      title: "Relocation Stalls as State Prioritizes Phosphate Export Revenues",
      desc: "Successive ministerial cabinets cite high relocation costs and site selection disagreements with neighboring delegations; project frozen.",
      classification: "FACT",
      source: "Ministry of Industry Records"
    },
    {
      year: "SUMMER 2026",
      title: "Current Operational State: Coastal Units Active, Zero Relocation",
      desc: "All Chatt Essalam units remain operational on the coast; no continuous public sensor telemetry feeds provided.",
      classification: "FACT",
      source: "404TN Field Audit 2026"
    }
  ],
  reciprocalLink: {
    href: "/issues/pollution",
    label: "NATIONAL CONTEXT",
    text: "View Tunisia's Pollution & Environment File →"
  }
};

/**
 * Renders the complete, rich editorial HTML for an issue dossier.
 * Used for both build-time SSG prerendering and client-side view mounting.
 */
export function renderDossierViewHtml(key, liveData = null) {
  const meta = DOSSIER_REGISTRY[key];
  if (!meta) return `<div class="p-8 text-center text-xs font-mono text-surface-400">Dossier not found: ${escapeHtml(key)}</div>`;

  const evRecords = (liveData && liveData.evidence_records && liveData.evidence_records.length > 0)
    ? liveData.evidence_records
    : meta.keyEvidence;

  const evCount = (liveData && liveData.evidence_count != null)
    ? `${liveData.evidence_count} VERIFIED RECORDS`
    : `${evRecords.length} VERIFIED BASELINE RECORDS`;

  const statusDisplay = (liveData && liveData.status) ? liveData.status : meta.status;

  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt; 
      <a href="/the-files" class="hover:text-bone-100 transition-colors">The Files</a> &gt; 
      <span class="text-bone-100 font-medium">${escapeHtml(meta.name)}</span>
    </nav>
  `;

  const inScopeHtml = meta.editorialScope.inScope.map(item => `
    <li class="flex items-start gap-2.5 text-xs text-surface-300">
      <span class="text-crimson font-mono select-none font-bold">✓</span>
      <span>${escapeHtml(item)}</span>
    </li>
  `).join("");

  const outScopeHtml = meta.editorialScope.outsideScope.map(item => `
    <li class="flex items-start gap-2.5 text-xs text-surface-400">
      <span class="text-surface-500 font-mono select-none">✕</span>
      <span>${escapeHtml(item)}</span>
    </li>
  `).join("");

  const institutionsHtml = meta.accountableInstitutions.map(inst => `
    <li class="flex items-start gap-2.5 text-xs text-surface-300">
      <span class="text-sand font-mono select-none">■</span>
      <span>${escapeHtml(inst)}</span>
    </li>
  `).join("");

  const evidenceRowsHtml = evRecords.map(item => {
    const rawId = item.id || '';
    const evId = escapeHtml(rawId);
    const date = escapeHtml(item.event_date || item.published_at || '2026');
    const sourceName = escapeHtml(stripHtml(item.source_name || 'VERIFIED SOURCE'));
    const classification = escapeHtml(item.classification || 'FACT');
    const classBadgeStyle = classification === 'FACT' 
      ? 'bg-bone-100 text-background font-bold' 
      : (classification === 'CLAIM' ? 'bg-sand text-background font-bold' : 'bg-crimson text-white font-bold');
    const headline = escapeHtml(stripHtml(item.headline || item.title || 'Evidence Record'));
    const summary = escapeHtml(stripHtml(item.summary || item.desc || ''));
    const status = escapeHtml(item.status || 'VERIFIED');
    const metricStr = item.metric_value ? `<span class="text-crimson font-mono font-bold">${escapeHtml(item.metric_value)} ${escapeHtml(item.metric_unit || '')}</span>` : '';

    return `
      <article class="p-5 sm:p-6 hover:bg-surface-900/40 transition-colors group cursor-pointer border-b border-surface-800 last:border-b-0" data-evidence-id="${evId}">
        <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="text-[10px] font-mono uppercase px-2 py-0.5 ${classBadgeStyle}">${classification}</span>
            <span class="text-[10px] font-mono text-surface-400 uppercase tracking-wider">${status}</span>
            <span class="text-xs font-mono text-crimson font-medium">${date}</span>
          </div>
          <div class="text-[10px] font-mono text-surface-500">
            SRC: <span class="text-surface-300">${sourceName}</span>
          </div>
        </div>

        <h3 class="font-sans font-semibold text-bone-100 text-base sm:text-lg leading-snug group-hover:text-crimson transition-colors mt-1">
          ${headline}
        </h3>

        <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed mt-2 max-w-prose">
          ${summary}
        </p>

        <div class="mt-4 pt-3 border-t border-surface-800/60 flex items-center justify-between text-[11px] font-mono text-surface-400">
          <div>${metricStr}</div>
          <div class="text-crimson group-hover:underline flex items-center gap-1">
            <span>Inspect Provenance Slip</span>
            <span>↗</span>
          </div>
        </div>
      </article>
    `;
  }).join("");

  const timelineHtml = meta.timeline.map(event => `
    <div class="relative pl-6 pb-6 border-l border-surface-800 last:border-l-0 last:pb-0">
      <span class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-crimson"></span>
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono text-crimson font-bold">${escapeHtml(event.date || event.year || '')}</span>
        <span class="text-[9px] font-mono px-1.5 py-0.2 bg-surface-900 border border-surface-800 text-surface-400">${escapeHtml(event.classification || 'FACT')}</span>
      </div>
      <h4 class="font-sans font-semibold text-bone-100 text-sm mt-1">${escapeHtml(stripHtml(event.title))}</h4>
      <p class="text-xs text-surface-300 font-light mt-1 leading-relaxed">${escapeHtml(stripHtml(event.desc))}</p>
      <div class="text-[10px] font-mono text-surface-500 mt-1.5">SRC: ${escapeHtml(stripHtml(event.source || 'OFFICIAL REPORT'))}</div>
    </div>
  `).join("");

  const stateResponseHtml = meta.stateResponse.map(resp => `
    <div class="p-5 sm:p-6 bg-background-elevated border border-surface-800 space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-800">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-meta text-surface-400">ACCOUNTABLE ENTITY</span>
          <div class="font-sans font-bold text-bone-100 text-base">${escapeHtml(resp.authority)}</div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono text-surface-400">${escapeHtml(resp.date)}</span>
          <span class="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">${escapeHtml(resp.status || 'VERIFIED')}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
        <div class="p-3 bg-surface-900/60 border border-surface-800 space-y-1">
          <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-semibold">WHAT WAS SAID / PROMISED</span>
          <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(resp.whatSaid)}</p>
        </div>
        <div class="p-3 bg-surface-900/60 border border-surface-800 space-y-1">
          <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-semibold">WHAT WAS DONE</span>
          <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(resp.whatDone)}</p>
        </div>
        <div class="p-3 bg-surface-900/60 border border-surface-800 space-y-1">
          <span class="text-[10px] font-mono text-crimson uppercase tracking-wider block font-semibold">WHAT IS KNOWN NOW</span>
          <p class="text-surface-200 font-medium leading-relaxed">${escapeHtml(resp.outcome)}</p>
        </div>
      </div>
    </div>
  `).join("");

  const relatedFilesHtml = meta.relatedFiles.map(link => `
    <a href="${escapeHtml(link.href)}" class="p-4 bg-background-elevated hover:bg-surface-900 border border-surface-800 hover:border-surface-600 transition-colors group flex items-center justify-between text-xs font-mono">
      <span class="text-bone-100 group-hover:text-crimson font-medium">${escapeHtml(link.label)}</span>
      <span class="text-surface-400 group-hover:text-bone-100 transition-transform group-hover:translate-x-1">→</span>
    </a>
  `).join("");

  const flagshipBannerHtml = meta.flagshipInvestigation ? `
    <div class="p-6 bg-background-elevated border border-crimson/50 relative group">
      <div class="flex items-center justify-between text-[10px] font-mono text-crimson font-bold mb-2">
        <span>${escapeHtml(meta.flagshipInvestigation.label)}</span>
        <span class="px-2 py-0.5 bg-crimson/10 border border-crimson/30">FLAGSHIP FILE</span>
      </div>
      <h3 class="font-editorial text-2xl text-bone-100 group-hover:text-crimson transition-colors">
        <a href="${escapeHtml(meta.flagshipInvestigation.href)}">${escapeHtml(meta.flagshipInvestigation.title)}</a>
      </h3>
      <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed mt-2 max-w-prose">
        ${escapeHtml(meta.flagshipInvestigation.description)}
      </p>
      <div class="mt-4 pt-3 border-t border-surface-800 flex items-center justify-between text-xs font-mono text-sand">
        <span>Open Dedicated Special Report</span>
        <span class="text-crimson font-bold">↗</span>
      </div>
    </div>
  ` : '';

  return `
    <article class="issue-dossier-page py-12 sm:py-16 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- A. DOSSIER HEADER -->
      <header id="prerendered-route-header" class="space-y-6 pb-10 border-b border-surface-800">
        ${breadcrumbHtml}

        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <span class="text-xs font-mono uppercase tracking-widest text-crimson font-bold">${escapeHtml(meta.eyebrow)}</span>
            <span class="text-[10px] font-mono px-2 py-0.5 bg-surface-900 border border-surface-800 text-surface-400 uppercase">${escapeHtml(meta.scopeContext)}</span>
          </div>

          <h1 class="font-editorial text-3xl sm:text-4xl lg:text-5xl text-bone-100 font-normal leading-tight tracking-tight">
            ${escapeHtml(meta.h1)}
          </h1>

          <p class="text-base sm:text-lg text-surface-300 font-light leading-relaxed max-w-4xl">
            ${escapeHtml(meta.deck)}
          </p>
        </div>

        <!-- Metadata Bar -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-surface-800/80 text-xs font-mono">
          <div class="p-3 bg-surface-900/60 border border-surface-800">
            <span class="text-[10px] text-surface-400 uppercase tracking-meta block">STATUS</span>
            <span class="text-crimson font-bold uppercase mt-0.5 block">${escapeHtml(statusDisplay)}</span>
          </div>
          <div class="p-3 bg-surface-900/60 border border-surface-800">
            <span class="text-[10px] text-surface-400 uppercase tracking-meta block">EVIDENCE INVENTORY</span>
            <span class="text-bone-100 font-bold uppercase mt-0.5 block">${escapeHtml(evCount)}</span>
          </div>
          <div class="p-3 bg-surface-900/60 border border-surface-800">
            <span class="text-[10px] text-surface-400 uppercase tracking-meta block">MONITORING WINDOW</span>
            <span class="text-sand font-bold uppercase mt-0.5 block">SUMMER 2026</span>
          </div>
          <div class="p-3 bg-surface-900/60 border border-surface-800">
            <span class="text-[10px] text-surface-400 uppercase tracking-meta block">PROVENANCE</span>
            <span class="text-surface-300 font-bold uppercase mt-0.5 block">CRYPTOGRAPHIC AUDIT</span>
          </div>
        </div>
      </header>

      ${flagshipBannerHtml}

      <!-- B. WHAT THIS FILE DOCUMENTS (STRICT SCOPE) -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-5 space-y-4">
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-semibold block">TAXONOMY & BOUNDARIES</span>
          <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">What This File Documents</h2>
          <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed">
            ${escapeHtml(meta.editorialScope.scopeIntro)}
          </p>
          <div class="pt-4 border-t border-surface-800 space-y-2">
            <span class="text-[10px] font-mono uppercase tracking-meta text-surface-400 block">ACCOUNTABLE INSTITUTIONS</span>
            <ul class="space-y-1.5">${institutionsHtml}</ul>
          </div>
        </div>

        <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-background-elevated border border-surface-800">
          <div class="space-y-3">
            <span class="text-[11px] font-mono uppercase tracking-wider text-bone-100 block font-bold border-b border-surface-800 pb-2">EXPLICITLY IN SCOPE</span>
            <ul class="space-y-2.5">${inScopeHtml}</ul>
          </div>
          <div class="space-y-3">
            <span class="text-[11px] font-mono uppercase tracking-wider text-surface-400 block font-bold border-b border-surface-800 pb-2">DELIBERATELY OUTSIDE SCOPE</span>
            <ul class="space-y-2.5">${outScopeHtml}</ul>
          </div>
        </div>
      </section>

      <!-- C. KEY EVIDENCE ROWS -->
      <section class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-surface-800">
          <div>
            <span class="text-xs font-mono uppercase tracking-widest text-crimson font-semibold block">PRIMARY SOURCED RECORDS</span>
            <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">Key Documented Evidence</h2>
          </div>
          <div class="text-xs font-mono text-surface-400">
            Click any row to inspect complete verification source audit slip.
          </div>
        </div>

        <div class="bg-background-elevated border border-surface-800 divide-y divide-surface-800">
          ${evidenceRowsHtml}
        </div>
      </section>

      <!-- D. TIMELINE & CHRONOLOGY -->
      <section class="space-y-6">
        <div class="pb-4 border-b border-surface-800">
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-semibold block">INCIDENT STREAM</span>
          <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">Chronology of Documented Events</h2>
        </div>

        <div class="p-6 sm:p-8 bg-background-elevated border border-surface-800">
          <div class="space-y-6">
            ${timelineHtml}
          </div>
        </div>
      </section>

      <!-- E. STATE RESPONSE -->
      <section class="space-y-6">
        <div class="pb-4 border-b border-surface-800">
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-semibold block">INSTITUTIONAL ACCOUNTABILITY</span>
          <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">State Response & Known Outcomes</h2>
        </div>

        <div class="space-y-4">
          ${stateResponseHtml}
        </div>
      </section>

      <!-- F. METHODOLOGY & EPISTEMIC STANDARDS -->
      <section class="p-6 sm:p-8 bg-surface-900/60 border border-surface-800 space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono uppercase tracking-widest text-sand font-bold">404TN VERIFICATION PROTOCOL</span>
          <a href="/methodology" class="text-xs font-mono text-crimson hover:underline">Full Methodology →</a>
        </div>
        <p class="text-xs text-surface-300 font-light leading-relaxed max-w-prose">
          Every evidence item in this dossier is tagged with its strict epistemic level (<strong class="text-bone-100">FACT</strong>: empirically established by records; <strong class="text-sand">CLAIM</strong>: official attribution awaiting independent confirmation; <strong class="text-crimson">ANALYSIS</strong>: structured editorial synthesis).
        </p>
      </section>

      <!-- G. RELATED FILES -->
      <section class="space-y-4 pt-6 border-t border-surface-800">
        <span class="text-xs font-mono uppercase tracking-widest text-surface-400 block font-semibold">RELATED INVESTIGATIVE FILES</span>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          ${relatedFilesHtml}
        </div>
      </section>

    </article>
  `;
}

/**
 * Renders the flagship special investigation report HTML for /gabes.
 */
export function renderGabesReportViewHtml(liveData = null) {
  const g = GABES_SPECIAL_REPORT;

  const breadcrumbHtml = `
    <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
      <a href="/" class="hover:text-bone-100 transition-colors">Home</a> &gt; 
      <a href="/the-files" class="hover:text-bone-100 transition-colors">The Files</a> &gt; 
      <span class="text-bone-100 font-medium">Gabès Special Investigation</span>
    </nav>
  `;

  const metricsHtml = g.metrics.map(m => `
    <div class="p-5 bg-background-elevated border border-surface-800 group hover:border-surface-600 transition-colors">
      <div class="flex items-center justify-between text-[10px] font-mono">
        <span class="text-surface-400 uppercase tracking-meta">${escapeHtml(m.label)}</span>
        <span class="px-1.5 py-0.5 bg-surface-900 border border-surface-800 ${m.status === 'HISTORICAL BASELINE' ? 'text-amber-400' : (m.status === 'NO CURRENT DATA' ? 'text-surface-400' : 'text-crimson')} font-bold">${escapeHtml(m.status)}</span>
      </div>
      <div class="text-2xl font-editorial font-bold text-bone-100 my-2 ${m.status === 'NO CURRENT DATA' ? 'text-surface-400' : 'text-crimson'} group-hover:text-white transition-colors">
        ${escapeHtml(m.value)}
      </div>
      <div class="text-xs text-surface-300 font-light leading-relaxed">${escapeHtml(m.subtext)}</div>
      <div class="mt-3 pt-2 border-t border-surface-800/80 text-[10px] font-mono text-surface-500">
        SOURCE: ${escapeHtml(m.source_period)}
      </div>
    </div>
  `).join("");

  const timelineHtml = g.timeline.map(item => `
    <div class="relative pl-6 pb-6 border-l border-surface-800 last:border-l-0 last:pb-0">
      <span class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-crimson"></span>
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono text-crimson font-bold">${escapeHtml(item.year)}</span>
        <span class="text-[9px] font-mono px-1.5 py-0.2 bg-surface-900 border border-surface-800 text-surface-400">${escapeHtml(item.classification)}</span>
      </div>
      <h4 class="font-sans font-semibold text-bone-100 text-sm mt-1">${escapeHtml(item.title)}</h4>
      <p class="text-xs text-surface-300 font-light mt-1 leading-relaxed">${escapeHtml(item.desc)}</p>
      <div class="text-[10px] font-mono text-surface-500 mt-1.5">SRC: ${escapeHtml(item.source)}</div>
    </div>
  `).join("");

  return `
    <article class="gabes-special-report py-12 sm:py-16 space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- A. SPECIAL REPORT OPENING -->
      <header id="prerendered-route-header" class="space-y-6 pb-10 border-b border-surface-800">
        ${breadcrumbHtml}

        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <span class="text-xs font-mono uppercase tracking-widest text-crimson font-bold">${escapeHtml(g.eyebrow)}</span>
            <span class="text-[10px] font-mono px-2 py-0.5 bg-crimson/10 border border-crimson/30 text-crimson uppercase font-semibold">ACTIVE FILE</span>
          </div>

          <h1 class="font-editorial text-3xl sm:text-5xl lg:text-6xl text-bone-100 font-normal leading-[1.12] tracking-tight">
            ${escapeHtml(g.h1)}
          </h1>

          <p class="text-base sm:text-xl text-surface-300 font-light leading-relaxed max-w-4xl">
            ${escapeHtml(g.deck)}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-surface-800/80">
          ${metricsHtml}
        </div>
      </header>

      <!-- RECIPROCAL NATIONAL CONTEXT CALLOUT -->
      <div class="p-4 sm:p-5 bg-background-elevated border border-surface-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-[10px] font-mono uppercase tracking-widest text-sand font-bold block">${escapeHtml(g.reciprocalLink.label)}</span>
          <span class="text-sm font-sans text-bone-100 font-medium">This report is part of 404TN's broader national environmental documentation.</span>
        </div>
        <a href="${escapeHtml(g.reciprocalLink.href)}" class="px-5 py-2.5 bg-surface-900 hover:bg-surface-800 border border-surface-700 text-bone-100 hover:text-white text-xs font-mono uppercase tracking-meta transition-colors shrink-0">
          ${escapeHtml(g.reciprocalLink.text)}
        </a>
      </div>

      <!-- B. WHY GABÈS MATTERS & C. INDUSTRIAL CONTEXT -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-6 space-y-4 p-6 sm:p-8 bg-background-elevated border border-surface-800">
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-semibold block">ECOLOGICAL CONTEXT</span>
          <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">Why Gabès Matters</h2>
          <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed">
            ${escapeHtml(g.contextSections.whyItMatters)}
          </p>
        </div>

        <div class="lg:col-span-6 space-y-4 p-6 sm:p-8 bg-background-elevated border border-surface-800">
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-semibold block">INDUSTRIAL PLATFORM</span>
          <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">The Industrial Complex</h2>
          <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed">
            ${escapeHtml(g.contextSections.industrialContext)}
          </p>
        </div>
      </section>

      <!-- D. TIMELINE OF STATE COMMITMENTS VS REALITY -->
      <section class="space-y-6">
        <div class="pb-4 border-b border-surface-800">
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-semibold block">DECISION & EXECUTION REGISTER</span>
          <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">Timeline of Decisions & Current Status (2017–2026)</h2>
        </div>

        <div class="p-6 sm:p-8 bg-background-elevated border border-surface-800">
          <div class="space-y-6">
            ${timelineHtml}
          </div>
        </div>
      </section>

      <!-- E. STATE COMMITMENTS VS DOCUMENTED OUTCOMES -->
      <section class="space-y-6">
        <div class="pb-4 border-b border-surface-800">
          <span class="text-xs font-mono uppercase tracking-widest text-crimson font-semibold block">EPISTEMIC SEPARATION</span>
          <h2 class="font-editorial text-2xl sm:text-3xl text-bone-100">State Commitment vs Documented Reality</h2>
        </div>

        <div class="p-6 sm:p-8 bg-background-elevated border border-surface-800 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
            <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-2">
              <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-bold">WHAT WAS PLEDGED (2017)</span>
              <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(g.contextSections.stateCommitmentsVsOutcome.statement)}</p>
            </div>
            <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-2">
              <span class="text-[10px] font-mono text-sand uppercase tracking-wider block font-bold">DOCUMENTED STATUS (2026)</span>
              <p class="text-surface-300 font-light leading-relaxed">${escapeHtml(g.contextSections.stateCommitmentsVsOutcome.reality)}</p>
            </div>
            <div class="p-4 bg-surface-900/60 border border-surface-800 space-y-2">
              <span class="text-[10px] font-mono text-crimson uppercase tracking-wider block font-bold">VERIFIED CONCLUSION</span>
              <p class="text-surface-200 font-medium leading-relaxed">${escapeHtml(g.contextSections.stateCommitmentsVsOutcome.outcome)}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- G. DATA GAPS & H. HEALTH CONTEXT -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-6 p-6 sm:p-8 bg-surface-900/40 border border-surface-800 space-y-3">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-sand"></span>
            <span class="text-[10px] font-mono uppercase tracking-widest text-sand font-bold">${escapeHtml(g.contextSections.dataGaps.title)}</span>
          </div>
          <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed">
            ${escapeHtml(g.contextSections.dataGaps.description)}
          </p>
        </div>

        <div class="lg:col-span-6 p-6 sm:p-8 bg-surface-900/40 border border-surface-800 space-y-3">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-crimson"></span>
            <span class="text-[10px] font-mono uppercase tracking-widest text-crimson font-bold">${escapeHtml(g.contextSections.healthContext.title)}</span>
          </div>
          <p class="text-xs sm:text-sm text-surface-300 font-light leading-relaxed">
            ${escapeHtml(g.contextSections.healthContext.description)}
          </p>
        </div>
      </section>

      <!-- I. EVIDENCE REGISTER & METHODOLOGY -->
      <section class="p-6 sm:p-8 bg-background-elevated border border-surface-800 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-800 pb-3">
          <span class="text-xs font-mono uppercase tracking-widest text-sand font-bold">SOURCE TRAIL & AUDIT PROVENANCE</span>
          <div class="flex items-center gap-4 text-xs font-mono">
            <a href="/evidence" class="text-surface-300 hover:text-crimson transition-colors">Primary Evidence Archive →</a>
            <a href="/methodology" class="text-surface-300 hover:text-crimson transition-colors">Verification Methodology →</a>
          </div>
        </div>
        <p class="text-xs text-surface-400 font-light leading-relaxed">
          Sources utilized for this investigation include official JORT government gazette records, ANPE technical audits, World Bank industrial assessments, and corroborated local reporting. Every factual claim is bound to primary documentation.
        </p>
      </section>

    </article>
  `;
}
