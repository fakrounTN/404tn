// src/seo-registry.js
// Authoritative Central Route SEO Registry for 404TN (https://404tn.com)

export const CANONICAL_ORIGIN = "https://404tn.com";

export const SEO_REGISTRY = {
  '/': {
    path: '/',
    title: '404TN — Tunisia 2026: Investigative Documentation Platform',
    description: 'Independent investigative platform analyzing water, electricity, labor, migration, Gabès pollution, and state accountability across Tunisia in 2026.',
    canonical: 'https://404tn.com/',
    robots: 'index, follow, max-image-preview:large',
    lang: 'en',
    pageType: 'website',
    h1: 'Tunisia 2026: Investigative Documentation & Evidence Platform',
    breadcrumb: [
      { name: 'Home', path: '/' }
    ],
    editorialIntro: '404TN documents systemic strain across water resources, energy grids, labor markets, human mobility, environmental contamination, and state accountability in Tunisia throughout 2026.',
    internalLinks: [
      { href: '/the-files', label: 'The Seven Files' },
      { href: '/gabes', label: 'Gabès Investigation' },
      { href: '/timeline', label: 'Summer 2026 Timeline' },
      { href: '/state-response', label: 'State Response Tracker' },
      { href: '/presidency', label: 'The Presidency' },
      { href: '/methodology', label: 'Evidence & Methodology' }
    ],
    schemaTypes: ['WebSite', 'NewsMediaOrganization'],
    sitemap: { inSitemap: true, priority: 1.0, changefreq: 'hourly' },
    prerender: true,
    isAlias: false
  },

  '/summer-2026': {
    path: '/summer-2026',
    title: 'Summer 2026 Crisis Intersection & Investigative Thesis | 404TN',
    description: 'Investigative thesis analyzing the compounding intersection of infrastructure deficits, economic pressure, migration, and state accountability in Tunisia.',
    canonical: 'https://404tn.com/summer-2026',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'article',
    h1: 'Summer 2026: An Intersection of Compounding Crises in Tunisia',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'Summer 2026', path: '/summer-2026' }
    ],
    editorialIntro: 'Summer 2026 represents the convergence of multi-sectoral strain in Tunisia: potable water rationing, peak electrical demand disruptions, youth unemployment, and centralized governance.',
    internalLinks: [
      { href: '/the-files', label: 'Inspect The Seven Files' },
      { href: '/timeline', label: 'View Incident Chronology' },
      { href: '/evidence', label: 'Primary Evidence Registry' }
    ],
    schemaTypes: ['Report', 'Article'],
    sitemap: { inSitemap: true, priority: 0.85, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  '/the-files': {
    path: '/the-files',
    title: 'Index of Investigations: The Seven Monitored Files | 404TN',
    description: 'Explore 404TN’s ongoing forensic investigations into Tunisia’s water crisis, electrical grid, pollution, labor market, migration, public services, and civil liberties.',
    canonical: 'https://404tn.com/the-files',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'collection',
    h1: 'The Seven Files: Monitored Systemic Pressures in Tunisia',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'The Files', path: '/the-files' }
    ],
    editorialIntro: '404TN maintains structured ongoing documentation across seven primary systemic files: Water, Electricity, Pollution & Environment, Work, Migration, Public Services, and Rights & Freedoms.',
    internalLinks: [
      { href: '/issues/water', label: 'File 01: Water' },
      { href: '/issues/electricity', label: 'File 02: Electricity' },
      { href: '/issues/pollution', label: 'File 03: Pollution & Environment' },
      { href: '/issues/work', label: 'File 04: Work' },
      { href: '/issues/migration', label: 'File 05: Migration' },
      { href: '/issues/public-services', label: 'File 06: Public Services' },
      { href: '/issues/rights', label: 'File 07: Rights & Freedoms' }
    ],
    schemaTypes: ['CollectionPage'],
    sitemap: { inSitemap: true, priority: 0.9, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  '/gabes': {
    path: '/gabes',
    title: 'Gabès Ecological Crisis: Industrial Pollution & Phosphogypsum Dossier | 404TN',
    description: 'Forensic investigation into industrial chemical emissions, phosphogypsum marine dumping, and public health impact in Gabès, Tunisia (2017–2026).',
    canonical: 'https://404tn.com/gabes',
    robots: 'index, follow, max-image-preview:large',
    lang: 'en',
    pageType: 'article',
    h1: 'Gabès: The City Paying the Price of Industrial Pollution',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'Gabès Investigation', path: '/gabes' }
    ],
    editorialIntro: 'For decades, Gabès has carried the environmental and public health cost of chemical processing in Tunisia. 404TN documents phosphogypsum coastal discharge, air quality, and unfulfilled relocation commitments.',
    internalLinks: [
      { href: '/issues/pollution', label: 'Tunisia Pollution & Environment Dossier' },
      { href: '/the-files', label: 'The Files Archive' },
      { href: '/state-response', label: 'State Commitments Tracker' },
      { href: '/timeline', label: 'Incident Chronology' },
      { href: '/methodology', label: 'Verification Methodology' }
    ],
    schemaTypes: ['Report', 'Article'],
    sitemap: { inSitemap: true, priority: 0.95, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  '/timeline': {
    path: '/timeline',
    title: 'Summer 2026 Incident Chronology: Verified Events & Telemetry Stream | 404TN',
    description: 'Day-by-day chronological documentation of water cuts, power outages, protests, maritime interceptions, and official actions across Tunisia.',
    canonical: 'https://404tn.com/timeline',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'collection',
    h1: 'Summer 2026 Chronology: Day-by-Day Documented Incidents',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'Timeline', path: '/timeline' }
    ],
    editorialIntro: 'A verified chronological stream of documented infrastructural, economic, and institutional events across Tunisia during Summer 2026, with primary source provenance.',
    internalLinks: [
      { href: '/the-files', label: 'The Seven Files' },
      { href: '/geospatial-monitor', label: 'Geospatial Monitor' },
      { href: '/evidence', label: 'Evidence Registry' }
    ],
    schemaTypes: ['CollectionPage', 'ItemList'],
    sitemap: { inSitemap: true, priority: 0.85, changefreq: 'hourly' },
    prerender: true,
    isAlias: false
  },

  '/state-response': {
    path: '/state-response',
    title: 'Tunisia State Response Tracker: Government Decisions, Promises & Outcomes | 404TN',
    description: 'Searchable accountability database tracking official ministerial statements, presidential decrees, implementation timelines, and documented outcomes.',
    canonical: 'https://404tn.com/state-response',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'dataset',
    h1: 'State Response & Accountability Tracker: Promises vs Documented Outcomes',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'State Response', path: '/state-response' }
    ],
    editorialIntro: '404TN systematically tracks government announcements, executive directives, ministerial promises, and documented real-world delivery across water, energy, labor, and civil rights.',
    internalLinks: [
      { href: '/presidency', label: 'Presidency Chronology' },
      { href: '/the-files', label: 'The Seven Files' },
      { href: '/evidence', label: 'Verified Evidence' }
    ],
    schemaTypes: ['Dataset', 'CollectionPage'],
    sitemap: { inSitemap: true, priority: 0.85, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  '/evidence': {
    path: '/evidence',
    title: 'Primary Evidence Archive: Sourced Records & Forensic Verification | 404TN',
    description: 'Authoritative archive of verified evidence records, official datasets, public statements, and corroborated investigative documentation.',
    canonical: 'https://404tn.com/evidence',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'collection',
    h1: 'Primary Evidence Archive: Verifiable Datasets & Cryptographic Provenance',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'Evidence Archive', path: '/evidence' }
    ],
    editorialIntro: 'The central evidentiary repository of 404TN, indexing official government gazettes (JORT), statistical releases (INS/ONAGRI), utility notices, and verified field reports.',
    internalLinks: [
      { href: '/methodology', label: 'Epistemic Methodology' },
      { href: '/the-files', label: 'The Seven Files' },
      { href: '/timeline', label: 'Summer 2026 Timeline' }
    ],
    schemaTypes: ['CollectionPage'],
    sitemap: { inSitemap: true, priority: 0.8, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  '/methodology': {
    path: '/methodology',
    title: 'Investigative Methodology & Verification Standards | 404TN',
    description: 'Methodological protocol governing 404TN’s three-tier epistemic classification, location confidence scoring, source verification, and ethics.',
    canonical: 'https://404tn.com/methodology',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'website',
    h1: 'Investigative Methodology, Verification Protocol & Epistemic Standards',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'Methodology', path: '/methodology' }
    ],
    editorialIntro: '404TN operates under a strict four-pillar verification protocol and three-tier epistemic classification (FACT / CLAIM / ANALYSIS) to guarantee source provenance and factual reliability.',
    internalLinks: [
      { href: '/statement', label: 'Mission Statement' },
      { href: '/evidence', label: 'Evidence Registry' },
      { href: '/the-files', label: 'The Seven Files' }
    ],
    schemaTypes: ['WebPage'],
    sitemap: { inSitemap: true, priority: 0.7, changefreq: 'monthly' },
    prerender: true,
    isAlias: false
  },

  '/geospatial-monitor': {
    path: '/geospatial-monitor',
    title: 'Tunisia Geospatial Evidence Monitor: 24-Governorate Incident Mapping | 404TN',
    description: 'Interactive vector map projecting verified evidence records across Tunisia’s 24 governorates. Visualizing documented evidence density.',
    canonical: 'https://404tn.com/geospatial-monitor',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'application',
    h1: 'Geospatial Monitor: 24-Governorate Verified Evidence Projection',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'Geospatial Monitor', path: '/geospatial-monitor' }
    ],
    editorialIntro: 'A geographic projection of documented incidents and evidence records across Tunisia’s 24 governorates, visualizing local evidence density and municipal strain.',
    internalLinks: [
      { href: '/the-files', label: 'The Seven Files' },
      { href: '/timeline', label: 'Summer 2026 Timeline' },
      { href: '/gabes', label: 'Gabès Flagship File' }
    ],
    schemaTypes: ['Dataset', 'WebPage'],
    sitemap: { inSitemap: true, priority: 0.8, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  '/presidency': {
    path: '/presidency',
    title: 'Kais Saied Presidency (2019–2026): Power, Promises and Responsibility | 404TN',
    description: 'An evidence-based documentary audit of Tunisia’s executive governance, constitutional transformation, and crisis management across seven years of presidential authority.',
    canonical: 'https://404tn.com/presidency',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'article',
    h1: 'Kais Saied: Power, Promises and Responsibility (2019–2026)',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'The Files', path: '/the-files' },
      { name: 'Presidency Dossier', path: '/presidency' }
    ],
    editorialIntro: 'An evidence-based documentary audit of Tunisia’s executive governance, constitutional transformation, and crisis management across seven years of presidential authority.',
    internalLinks: [
      { href: '/state-response', label: 'State Response Matrix' },
      { href: '/issues/rights', label: 'File 07: Rights & Freedoms' },
      { href: '/the-files', label: 'The Seven Files' },
      { href: '/gabes', label: 'Gabès Special Report' }
    ],
    schemaTypes: ['Report', 'Article'],
    sitemap: { inSitemap: true, priority: 0.85, changefreq: 'weekly' },
    prerender: true,
    isAlias: false
  },

  '/statement': {
    path: '/statement',
    title: 'Mission Statement: Independent Documentation Standards | 404TN',
    description: 'Editorial statement on evidence-first journalism, institutional memory, independence from political funding, and documentation standards.',
    canonical: 'https://404tn.com/statement',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'website',
    h1: 'Mission Statement: Why 404TN Documents Systemic Strain',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'Mission Statement', path: '/statement' }
    ],
    editorialIntro: '404TN is an independent, non-partisan documentation platform dedicated to institutional memory, factual provenance, and evidence-first public-interest inquiry in Tunisia.',
    internalLinks: [
      { href: '/methodology', label: 'Verification Methodology' },
      { href: '/the-files', label: 'The Seven Files Archive' },
      { href: '/', label: 'Primary Monitor' }
    ],
    schemaTypes: ['WebPage'],
    sitemap: { inSitemap: true, priority: 0.6, changefreq: 'monthly' },
    prerender: true,
    isAlias: false
  },

  '/issues/water': {
    path: '/issues/water',
    title: 'Tunisia Water Crisis: Dam Reserves, SONEDE Rationing & Infrastructure | 404TN',
    description: 'Investigative documentation of Tunisia’s hydraulic deficit, reservoir saturation levels, SONEDE rationing schedules, and agricultural impact.',
    canonical: 'https://404tn.com/issues/water',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'article',
    h1: 'File 01: Water Deficit, Infrastructure Aging & Regional Hydraulic Stress',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'The Files', path: '/the-files' },
      { name: 'Water', path: '/issues/water' }
    ],
    editorialIntro: 'This dossier documents national dam reservoir depletion, potable water cuts by SONEDE, regional distribution deficits, and hydraulic strain across Tunisian governorates.',
    internalLinks: [
      { href: '/the-files', label: 'All Investigative Files' },
      { href: '/state-response', label: 'State Water Response' },
      { href: '/evidence', label: 'Water Evidence Archive' },
      { href: '/timeline', label: 'Summer 2026 Timeline' }
    ],
    schemaTypes: ['Report', 'CollectionPage'],
    sitemap: { inSitemap: true, priority: 0.9, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  '/issues/electricity': {
    path: '/issues/electricity',
    title: 'Tunisia Electrical Grid: STEG Outages, Peak Demand & Energy Deficit | 404TN',
    description: 'Monitoring Tunisia’s power grid strain, peak summer load (MW), gas-fired generation capacity, and STEG load-shedding incidents.',
    canonical: 'https://404tn.com/issues/electricity',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'article',
    h1: 'File 02: Electrical Grid Strain, Peak Load & STEG Service Reliability',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'The Files', path: '/the-files' },
      { name: 'Electricity', path: '/issues/electricity' }
    ],
    editorialIntro: 'This dossier documents national electrical grid peak demand load, STEG power cut incidents, natural gas generation deficits, and utility operational pressure in Tunisia.',
    internalLinks: [
      { href: '/the-files', label: 'All Investigative Files' },
      { href: '/state-response', label: 'State Energy Response' },
      { href: '/evidence', label: 'Electricity Evidence Archive' },
      { href: '/timeline', label: 'Summer 2026 Timeline' }
    ],
    schemaTypes: ['Report', 'CollectionPage'],
    sitemap: { inSitemap: true, priority: 0.9, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  '/issues/pollution': {
    path: '/issues/pollution',
    title: 'Tunisia Environmental Crisis: Industrial Pollution & Ecological Strain | 404TN',
    description: 'Forensic documentation of chemical emissions, coastal phosphogypsum discharge, municipal waste crises, and environmental contamination across Tunisia.',
    canonical: 'https://404tn.com/issues/pollution',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'article',
    h1: 'File 03: Industrial Pollution, Chemical Emissions & Environmental Contamination',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'The Files', path: '/the-files' },
      { name: 'Pollution & Environment', path: '/issues/pollution' }
    ],
    editorialIntro: 'This dossier documents industrial chemical emissions, coastal phosphogypsum dumping, air quality degradation, and environmental contamination across Tunisian regions, including Gabès, Sfax, and Gafsa.',
    internalLinks: [
      { href: '/gabes', label: 'Gabès Flagship Investigation' },
      { href: '/the-files', label: 'All Monitored Files' },
      { href: '/state-response', label: 'State Environmental Response' },
      { href: '/evidence', label: 'Environmental Evidence Archive' },
      { href: '/timeline', label: 'Summer 2026 Timeline' }
    ],
    schemaTypes: ['Report', 'CollectionPage'],
    sitemap: { inSitemap: true, priority: 0.9, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  '/issues/work': {
    path: '/issues/work',
    title: 'Tunisia Labor Market & Unemployment: Youth Joblessness & Economic Strain | 404TN',
    description: 'Statistical analysis and verified evidence tracking Tunisian unemployment, graduate jobless disparities, inflation, and purchasing power.',
    canonical: 'https://404tn.com/issues/work',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'article',
    h1: 'File 04: Labor Market Stagnation, Unemployment & Cost of Living',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'The Files', path: '/the-files' },
      { name: 'Work', path: '/issues/work' }
    ],
    editorialIntro: 'This dossier organizes official INS employment data, graduate jobless disparities, real wage pressures, and economic stagnation documented across Tunisia in 2026.',
    internalLinks: [
      { href: '/the-files', label: 'All Investigative Files' },
      { href: '/issues/migration', label: 'Migration Dossier' },
      { href: '/evidence', label: 'Labor Evidence Archive' },
      { href: '/timeline', label: 'Summer 2026 Timeline' }
    ],
    schemaTypes: ['Report', 'CollectionPage'],
    sitemap: { inSitemap: true, priority: 0.85, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  '/issues/migration': {
    path: '/issues/migration',
    title: 'Tunisia Migration Dynamics: Maritime Departures, Interceptions & Border Policy | 404TN',
    description: 'Forensic documentation of Mediterranean departure trends, interception operations, transit conditions in Sfax, and regional border policy.',
    canonical: 'https://404tn.com/issues/migration',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'article',
    h1: 'File 05: Mediterranean Migration Routes, Coast Guard Interceptions & Transit Realities',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'The Files', path: '/the-files' },
      { name: 'Migration', path: '/issues/migration' }
    ],
    editorialIntro: 'This dossier tracks documented maritime crossings, search and rescue operations, National Guard intercepts at sea, transit camps in Sfax, and bilateral European border agreements.',
    internalLinks: [
      { href: '/the-files', label: 'All Investigative Files' },
      { href: '/issues/work', label: 'Economic Push Factors' },
      { href: '/evidence', label: 'Migration Evidence Archive' },
      { href: '/timeline', label: 'Summer 2026 Timeline' }
    ],
    schemaTypes: ['Report', 'CollectionPage'],
    sitemap: { inSitemap: true, priority: 0.85, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  '/issues/public-services': {
    path: '/issues/public-services',
    title: 'Tunisia Public Services: Healthcare, Transport & Civic Infrastructure Strain | 404TN',
    description: 'Investigating medicine supply deficits, public transit fleet reductions (Transtu/SNCFT), and municipal infrastructure failure across Tunisia.',
    canonical: 'https://404tn.com/issues/public-services',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'article',
    h1: 'File 06: Public Services Breakdown: Healthcare, Transit & Municipal Infrastructure',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'The Files', path: '/the-files' },
      { name: 'Public Services', path: '/issues/public-services' }
    ],
    editorialIntro: 'This dossier documents medicine supply shortages via Pharmacie Centrale (PCT), public transit fleet breakdown (Transtu/SNCFT), and municipal sanitation deficits across Tunisian regions.',
    internalLinks: [
      { href: '/the-files', label: 'All Investigative Files' },
      { href: '/state-response', label: 'State Public Services Response' },
      { href: '/evidence', label: 'Public Services Evidence' },
      { href: '/timeline', label: 'Summer 2026 Timeline' }
    ],
    schemaTypes: ['Report', 'CollectionPage'],
    sitemap: { inSitemap: true, priority: 0.85, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  '/issues/rights': {
    path: '/issues/rights',
    title: 'Tunisia Civil Liberties: Decree 54, Press Freedom & Rights | 404TN',
    description: 'Monitoring freedom of expression, Decree-Law 54 legal proceedings, journalist detentions, and judicial restructuring in Tunisia.',
    canonical: 'https://404tn.com/issues/rights',
    robots: 'index, follow',
    lang: 'en',
    pageType: 'article',
    h1: 'File 07: Civil Liberties, Decree-Law 54 Proceedings & Institutional Checks',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'The Files', path: '/the-files' },
      { name: 'Rights & Freedoms', path: '/issues/rights' }
    ],
    editorialIntro: 'This dossier monitors documented legal proceedings under Decree-Law 54, journalist and political detentions, media freedom reports by SNJT, and institutional checks and balances in Tunisia.',
    internalLinks: [
      { href: '/the-files', label: 'All Investigative Files' },
      { href: '/presidency', label: 'Presidency Chronology' },
      { href: '/evidence', label: 'Rights Evidence Archive' },
      { href: '/timeline', label: 'Summer 2026 Timeline' }
    ],
    schemaTypes: ['Report', 'CollectionPage'],
    sitemap: { inSitemap: true, priority: 0.85, changefreq: 'daily' },
    prerender: true,
    isAlias: false
  },

  // ---------------------------------------------------------------------------
  // ALIASES & REDIRECT TARGETS (noindex, canonical pointing to canonical master)
  // ---------------------------------------------------------------------------
  '/geospatial': {
    path: '/geospatial',
    title: 'Tunisia Geospatial Evidence Monitor | 404TN',
    description: 'Geospatial incident map across Tunisia’s 24 governorates.',
    canonical: 'https://404tn.com/geospatial-monitor',
    robots: 'noindex, follow',
    lang: 'en',
    pageType: 'application',
    h1: 'Geospatial Evidence Monitor (Redirecting to Primary Monitor)',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'Geospatial Monitor', path: '/geospatial-monitor' }
    ],
    editorialIntro: 'Alias route for the Tunisia 24-governorate geospatial evidence monitor.',
    internalLinks: [
      { href: '/geospatial-monitor', label: 'Open Primary Geospatial Monitor' }
    ],
    schemaTypes: ['Dataset'],
    sitemap: { inSitemap: false, priority: 0.5, changefreq: 'weekly' },
    prerender: true,
    isAlias: true,
    targetPath: '/geospatial-monitor'
  },

  '/issues/rights-institutions': {
    path: '/issues/rights-institutions',
    title: 'Civil Liberties & Institutional Rights Dossier | 404TN',
    description: 'Documenting Decree-Law 54 proceedings and civic rights in Tunisia.',
    canonical: 'https://404tn.com/issues/rights',
    robots: 'noindex, follow',
    lang: 'en',
    pageType: 'article',
    h1: 'Rights & Freedoms Dossier (Canonical: /issues/rights)',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'The Files', path: '/the-files' },
      { name: 'Rights & Freedoms', path: '/issues/rights' }
    ],
    editorialIntro: 'Alias route for File 07: Civil Liberties, Decree-Law 54 Proceedings & Institutional Checks.',
    internalLinks: [
      { href: '/issues/rights', label: 'Open Primary Rights Dossier' }
    ],
    schemaTypes: ['Report'],
    sitemap: { inSitemap: false, priority: 0.5, changefreq: 'weekly' },
    prerender: true,
    isAlias: true,
    targetPath: '/issues/rights'
  }
};
