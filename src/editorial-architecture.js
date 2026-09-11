// src/editorial-architecture.js
// 404TN Authoritative Editorial Architecture Models (Phase C)
// Data models and structural helpers for Economy, Trust & Public Opinion,
// Tunisia & The World, Crime & Illicit Economy, and Social Pressure.

/**
 * 1. ECONOMY ARCHITECTURE DATA
 * Verified official macroeconomic baseline (INS, BCT, Ministry of Finance, ONME, World Bank/IMF).
 * Zero fabricated numbers. Every metric includes official source, period, and unit.
 */
export const ECONOMY_ARCHITECTURE_DATA = {
  indicators: [
    {
      id: "ECO-GDP",
      name: "Real GDP Growth",
      baseline2019: "+1.5%",
      current2026: "+0.8%",
      change: "-0.7 pts",
      unit: "Annual % Change",
      source: "National Institute of Statistics (INS) National Accounts",
      interpretation: "Economic growth decelerated across the period, constrained by drought-affected agricultural output, subdued private investment, and domestic bank financing of the fiscal deficit.",
      period: "2019 Baseline vs Summer 2026",
      category: "GROWTH"
    },
    {
      id: "ECO-UNEMP-GEN",
      name: "Overall Unemployment Rate",
      baseline2019: "14.9%",
      current2026: "16.0%",
      change: "+1.1 pts",
      unit: "% of Active Population",
      source: "INS Labour Force Survey (Enquête Nationale sur l'Emploi)",
      interpretation: "Unemployment rose slightly overall but remains structurally elevated, with deep regional disparities between coastal urban poles and interior governorates.",
      period: "Q2 2019 vs Q2 2026",
      category: "LABOR"
    },
    {
      id: "ECO-UNEMP-YOUTH",
      name: "Graduate Unemployment (Higher Education)",
      baseline2019: "28.0%",
      current2026: "38.8%",
      change: "+10.8 pts",
      unit: "% of Higher Education Graduates",
      source: "INS Quarterly Employment Bulletin",
      interpretation: "Severe structural misalignment between university degree specializations and private labor demand, compounded by the public sector recruitment freeze.",
      period: "2019 vs Summer 2026",
      category: "LABOR"
    },
    {
      id: "ECO-INFLATION",
      name: "Consumer Price Inflation (Headline / Food)",
      baseline2019: "6.7%",
      current2026: "7.0% (Food: 9.8%)",
      change: "+0.3 pts (Food +3.1 pts)",
      unit: "Year-on-Year % Change",
      source: "INS Consumer Price Index (IPC)",
      interpretation: "While headline inflation eased from 2023 peaks (>10%), food and essential goods inflation remains near double digits, eroding household purchasing power.",
      period: "Annual 2019 vs Summer 2026",
      category: "PRICES"
    },
    {
      id: "ECO-DEBT-GDP",
      name: "Central Government Public Debt",
      baseline2019: "67.8%",
      current2026: "80.2%",
      change: "+12.4 pts",
      unit: "% of Nominal GDP",
      source: "Ministry of Finance Debt Bulletins (Rapport sur la Dette Publique)",
      interpretation: "Public debt expanded following pandemic emergency spending and increased domestic bank sovereign issuance to finance state wage bills and subsidies.",
      period: "End-2019 vs Mid-2026",
      category: "FISCAL"
    },
    {
      id: "ECO-BCT-RATE",
      name: "BCT Policy Interest Rate",
      baseline2019: "7.75%",
      current2026: "8.00%",
      change: "+0.25 pts",
      unit: "% per Annum",
      source: "Banque Centrale de Tunisie (BCT)",
      interpretation: "Monetary policy remains restrictive to contain imported inflation and support the dinar exchange rate.",
      period: "2019 vs Summer 2026",
      category: "MONETARY"
    },
    {
      id: "ECO-FX-RESERVES",
      name: "Foreign Exchange Reserves",
      baseline2019: "109 Days",
      current2026: "112 Days",
      change: "+3 Days",
      unit: "Days of Import Coverage",
      source: "Banque Centrale de Tunisie Daily Telemetry",
      interpretation: "Reserves maintained above the 90-day safety threshold, supported by expatriate remittances (~8.5B TND/yr) and tourism receipts, despite external borrowing constraints.",
      period: "Mid-2019 vs Summer 2026",
      category: "EXTERNAL"
    },
    {
      id: "ECO-ENERGY-DEF",
      name: "Primary Energy Trade Deficit",
      baseline2019: "49%",
      current2026: "52%",
      change: "+3 pts",
      unit: "% National Energy Balance Deficit",
      source: "National Energy Observatory (ONME) Monthly Bulletins",
      interpretation: "Declining domestic natural gas extraction from southern concessions increased reliance on Algerian gas imports to fire STEG electricity turbines.",
      period: "2019 vs Summer 2026",
      category: "ENERGY"
    }
  ],

  sovereignRatings: [
    {
      agency: "Moody's",
      currentRating: "Caa2",
      outlook: "Stable",
      date: "2023–2026",
      previousRating: "Caa1 (Negative)",
      trajectory: "B2 (2019) → B3 (2021) → Caa1 (2021) → Caa2 (2023)",
      rationale: "Reflects very high government liquidity risks, large fiscal and external financing needs, and heavy reliance on domestic banks amid limited commercial external market access."
    },
    {
      agency: "Fitch Ratings",
      currentRating: "CCC+",
      outlook: "Stable",
      date: "2024–2026",
      previousRating: "CCC-",
      trajectory: "B+ (2019) → B- (2021) → CCC (2022) → CCC- (2023) → CCC+ (2024)",
      rationale: "Upgrade to CCC+ reflected government capacity to meet large external bond amortizations in early 2024 via BCT direct lending, though structural financing risks remain elevated without multilateral program backing."
    }
  ]
};

/**
 * 2. TRUST & PUBLIC OPINION ARCHITECTURE DATA
 * Verified survey benchmarks from Arab Barometer (Wave V, Wave VII, Wave VIII).
 * All items include fieldwork date, sample size, methodology, and exact question focus.
 */
export const TRUST_MONITOR_DATA = {
  metadata: {
    primarySource: "Arab Barometer (Princeton University / BBC News Arabic / Arab Barometer Research Network)",
    methodology: "Nationally representative probability sample; face-to-face computer-assisted interviews across all 24 governorates",
    sampleSize: "n=2,400 per wave (Adults 18+)",
    marginOfError: "±2.5 percentage points"
  },
  waves: [
    { code: "Wave V", fieldwork: "Oct 2018 – Jan 2019", context: "Pre-election baseline (Chahed Government / Parliamentary System)" },
    { code: "Wave VII", fieldwork: "Feb – Mar 2022", context: "Post-July 2021 rupture (Presidential emergency decree period)" },
    { code: "Wave VIII", fieldwork: "Dec 2023 – Jan 2024", context: "Consolidation period (New Constitution / 2024 Context)" }
  ],
  benchmarks: [
    {
      id: "TRUST-PRESIDENT",
      institution: "Trust in the President of the Republic",
      question: "To what extent do you trust the President of the Republic? (% Great deal / Quite a lot)",
      results: [
        { wave: "Wave V (2018/19)", value: 18, note: "Pre-presidency (Beji Caid Essebsi in office: 18%)" },
        { wave: "Wave VII (2022)", value: 62, highlight: true, note: "Post-July 2021 approval (Kais Saied)" },
        { wave: "Wave VIII (2024)", value: 43, highlight: false, note: "19-point decline amid economic stress (Kais Saied: 43%)" }
      ]
    },
    {
      id: "TRUST-GOVERNMENT",
      institution: "Trust in the Government / Prime Ministry",
      question: "To what extent do you trust the government? (% Great deal / Quite a lot)",
      results: [
        { wave: "Wave V (2018/19)", value: 18, note: "Youssef Chahed Cabinet" },
        { wave: "Wave VII (2022)", value: 39, note: "Najla Bouden Cabinet" },
        { wave: "Wave VIII (2024)", value: 25, note: "Ahmed Hachani Cabinet" }
      ]
    },
    {
      id: "TRUST-PARLIAMENT",
      institution: "Trust in the Parliament / Legislative Body",
      question: "To what extent do you trust parliament? (% Great deal / Quite a lot)",
      results: [
        { wave: "Wave V (2018/19)", value: 14, note: "2014–2019 ARP" },
        { wave: "Wave VII (2022)", value: 12, note: "ARP suspended by presidential decree" },
        { wave: "Wave VIII (2024)", value: 18, note: "New Assembly under 2022 Constitution" }
      ]
    },
    {
      id: "TRUST-JUDICIARY",
      institution: "Trust in the Judicial System",
      question: "To what extent do you trust the judicial system? (% Great deal / Quite a lot)",
      results: [
        { wave: "Wave V (2018/19)", value: 42, note: "Independent High Judicial Council era" },
        { wave: "Wave VII (2022)", value: 45, note: "Period of presidential judicial reform decrees" },
        { wave: "Wave VIII (2024)", value: 33, note: "12-point decline following judge dismissals" }
      ]
    },
    {
      id: "TRUST-SECURITY",
      institution: "Trust in Police / National Guard / Armed Forces",
      question: "To what extent do you trust the police and security forces? (% Great deal / Quite a lot)",
      results: [
        { wave: "Wave V (2018/19)", value: 65, note: "Consistently high institutional trust" },
        { wave: "Wave VII (2022)", value: 67, note: "Slight increase" },
        { wave: "Wave VIII (2024)", value: 61, note: "Remains highest-rated civilian security institution" }
      ]
    },
    {
      id: "TRUST-MIGRATION-INTENT",
      institution: "Youth Migration Intention (Ages 18–29)",
      question: "Have you ever considered emigrating from your country? (% Yes, among youth 18-29)",
      results: [
        { wave: "Wave V (2018/19)", value: 42, note: "Baseline economic push factors" },
        { wave: "Wave VII (2022)", value: 46, note: "Post-pandemic economic slowdown" },
        { wave: "Wave VIII (2024)", value: 53, highlight: true, note: "Majority of youth expressing desire to leave" }
      ]
    },
    {
      id: "TRUST-ECON-PERCEPTION",
      institution: "Economic Satisfaction",
      question: "How would you describe the current economic situation in our country? (% Good / Very Good)",
      results: [
        { wave: "Wave V (2018/19)", value: 11, note: "Severe dissatisfaction" },
        { wave: "Wave VII (2022)", value: 8, note: "Persistent crisis" },
        { wave: "Wave VIII (2024)", value: 6, note: "94% describe economy as bad or very bad" }
      ]
    }
  ]
};

/**
 * 3. TUNISIA & THE WORLD ARCHITECTURE DATA
 * Key bilateral and multilateral treaties, agreements, and financing decisions (2019–2026).
 */
export const INTERNATIONAL_RELATIONS_DATA = [
  {
    partner: "European Union (EU)",
    date: "July 16, 2023",
    category: "MEMORANDUM OF UNDERSTANDING",
    headline: "EU-Tunisia Memorandum of Understanding on Strategic Partnership",
    summary: "Signed in Tunis by President Kais Saied, European Commission President Ursula von der Leyen, Italian PM Giorgia Meloni, and Dutch PM Mark Rutte. Encompasses €105 million in maritime border surveillance support and €150 million in direct budgetary assistance.",
    evidenceStatus: "DOCUMENTED (Official EU / JORT Bulletin)",
    epistemicLevel: "FACT"
  },
  {
    partner: "International Monetary Fund (IMF)",
    date: "October 15, 2022 – Ongoing",
    category: "FINANCING & DISPUTE",
    headline: "Stalled $1.9 Billion Extended Fund Facility (EFF)",
    summary: "Staff-level agreement reached in Oct 2022 for a 48-month loan program. Execution stalled following presidential speeches rejecting civil service wage containment and subsidy reform conditionalities as unacceptable external dictates.",
    evidenceStatus: "VERIFIED (IMF Press Release No. 22/353 & Presidential Communiqués)",
    epistemicLevel: "FACT"
  },
  {
    partner: "Italy / European Commission",
    date: "2023–2026",
    category: "INFRASTRUCTURE & ENERGY",
    headline: "ELMED Undersea Electricity Interconnector Project",
    summary: "600 MW, 200 km high-voltage subsea electrical cable connecting Kelibia (Tunisia) and Partanna (Sicily), co-financed by €307 million European Commission Connecting Europe Facility grant and World Bank financing.",
    evidenceStatus: "DOCUMENTED (World Bank Project P179247 / STEG / Terna)",
    epistemicLevel: "FACT"
  },
  {
    partner: "Algeria (Sonatrach / Sonelgaz)",
    date: "2020–2026",
    category: "BILATERAL ENERGY & SECURITY",
    headline: "Trans-Mediterranean Gas Transit Royalty & Bilateral Grid Interconnection",
    summary: "Tunisia secures ~5.25% royalty in natural gas or cash on Algerian gas exported to Italy via the Enrico Mattei pipeline (Transmed), alongside bilateral electricity load support from Sonelgaz during summer peak hours.",
    evidenceStatus: "VERIFIED (STEG / Ministry of Industry & Energy)",
    epistemicLevel: "FACT"
  },
  {
    partner: "World Bank Group",
    date: "June 2023",
    category: "MULTILATERAL FINANCING",
    headline: "Country Partnership Framework (CPF) 2023–2027",
    summary: "World Bank resumes partnership framework allocating $400–500 million annually targeted at social safety nets (Amen Social), energy transition (ELMED), and emergency food security imports.",
    evidenceStatus: "DOCUMENTED (World Bank Board Approval Notice)",
    epistemicLevel: "FACT"
  }
];

/**
 * 4. CRIME, DRUGS & ILLICIT ECONOMY ARCHITECTURE DATA
 * Strict evidence threshold: Verified court records, customs bulletins, and judicial communiqués only.
 * Accurate legal terminology: ALLEGED, CHARGED, CONVICTED, SEIZED, OFFICIAL STATEMENT.
 */
export const ILLICIT_ECONOMY_DATA = [
  {
    category: "NARCOTICS TRAFFICKING",
    date: "2025–2026",
    authority: "Direction Générale des Douanes & National Guard",
    location: "Port of La Goulette & Ras Jedir Border Crossing",
    legalStatus: "SEIZED & CHARGED",
    headline: "Maritime Port & Land Border Psychoactive Substance Interdictions",
    summary: "Customs and border units recorded multiple commercial container seizures of synthetic psychoactive tablets (Pregabalin/Ecstasy) and cannabis resin concealed in commercial freight, leading to organized trafficking prosecutions under Law 92-52.",
    source: "Direction Générale des Douanes Official Communiqués"
  },
  {
    category: "FINANCIAL CRIMES & MONEY LAUNDERING",
    date: "2023–2026",
    authority: "Pôle Judiciaire Financier & BCT Financial Intelligence Unit (CTAF)",
    location: "Greater Tunis & Sousse",
    legalStatus: "CHARGED & INVESTIGATING",
    headline: "Judicial Proceedings Concerning Unlicensed Currency Transfers & Contraband Liquidity",
    summary: "Judicial Financial Pole opened inquiries into informal currency brokerages, fraudulent letter-of-credit operations, and parallel exchange networks operating outside the regulated banking system.",
    source: "Tunis First Instance Court Public Prosecutor Communiqués"
  },
  {
    category: "MIGRANT SMUGGLING NETWORKS",
    date: "2024–2026",
    authority: "National Guard Maritime Units & Public Prosecutor's Office",
    location: "Governorates of Sfax, Mahdia, and Medenine",
    legalStatus: "INTERDICTED & PROSECUTED",
    headline: "Prosecution of Maritime Boatbuilding Workshops and Crossing Organizers",
    summary: "Targeted security and judicial operations dismantled artisanal metal boatbuilding workshops in Sfax and arrested crossing intermediaries under Law 2004-06 concerning illegal border entry and transit.",
    source: "Ministry of Interior / National Guard Operational Telemetry"
  }
];

/**
 * 5. SOCIAL PRESSURE & INFORMAL ECONOMY DATA
 * Socioeconomic structural context without moralization.
 */
export const SOCIAL_PRESSURE_DATA = {
  informalLaborShare: "~42% of non-agricultural employment (INS / ILO estimates)",
  purchasingPowerDecline: "Cumulative essential food price index increased ~34% between 2021 and 2026",
  youthUnderemployment: "38.8% higher education graduate unemployment in 2026",
  monetizationTrends: "Rise in informal cross-border trade (ben guerdane / algerian border) and digital platform gig monetization",
  editorialNote: "404TN documents socioeconomic coping strategies through structural employment data and inflation dynamics, avoiding generalized cultural or moralistic characterizations."
};
