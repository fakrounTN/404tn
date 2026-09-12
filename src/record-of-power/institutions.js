// src/record-of-power/institutions.js
// 404TN — State Institutions & Regulatory Entities Registry (2019–2026)

export const INSTITUTIONS_REGISTRY = Object.freeze({
  "INST-PRESIDENCY": {
    institution_id: "INST-PRESIDENCY",
    name: "Presidency of the Republic of Tunisia (Présidence de la République)",
    short_name: "Presidency / Carthage Palace",
    institution_type: "CONSTITUTIONAL_EXECUTIVE",
    authority_area: "National defense, foreign policy, national security, executive general direction, decree governance (post-July 2021 / 2022 Constitution)",
    legal_responsibilities: "Head of State, Supreme Commander of Armed Forces, appointment of Prime Minister and Cabinet, promulgation of laws and executive decrees, preservation of state continuity.",
    parent_institution_id: null,
    active_from: "1957-07-25",
    active_to: null,
    source_ids: ["SRC-JORT-DEC117", "SRC-JORT-CONST2022"]
  },

  "INST-GOV": {
    institution_id: "INST-GOV",
    name: "Presidency of the Government / Prime Ministry (Présidence du Gouvernement)",
    short_name: "Government / Prime Ministry",
    institution_type: "EXECUTIVE_ADMINISTRATION",
    authority_area: "Public administration coordination, ministerial oversight, implementation of presidential directives, public enterprise supervision",
    legal_responsibilities: "Execution of national policies as established by the President of the Republic; coordination of ministerial departments.",
    parent_institution_id: "INST-PRESIDENCY",
    active_from: "1969-11-07",
    active_to: null,
    source_ids: ["SRC-JORT-CONST2022"]
  },

  "INST-ARP": {
    institution_id: "INST-ARP",
    name: "Assembly of the Representatives of the People (Assemblée des Représentants du Peuple)",
    short_name: "ARP / Parliament",
    institution_type: "LEGISLATIVE",
    authority_area: "National legislation, budget bill consideration, treaty ratification, parliamentary inquiries",
    legal_responsibilities: "Exercise of legislative power in concurrence with the National Council of Regions and Districts under the 2022 Constitution.",
    parent_institution_id: null,
    active_from: "2014-11-20",
    active_to: null,
    source_ids: ["SRC-JORT-DEC117", "SRC-JORT-CONST2022"]
  },

  "INST-NRC": {
    institution_id: "INST-NRC",
    name: "National Council of Regions and Districts (Conseil National des Régions et des Districts)",
    short_name: "Regions & Districts Council",
    institution_type: "LEGISLATIVE_SECOND_CHAMBER",
    authority_area: "Regional development projects, state budget balance, regional economic integration",
    legal_responsibilities: "Second parliamentary chamber established by Decree-Law 2023-8 and the 2022 Constitution to deliberate on national development plans and state budgets.",
    parent_institution_id: null,
    active_from: "2023-03-08",
    active_to: null,
    source_ids: ["SRC-JORT-CONST2022"]
  },

  "INST-MOJ": {
    institution_id: "INST-MOJ",
    name: "Ministry of Justice (Ministère de la Justice)",
    short_name: "Ministry of Justice",
    institution_type: "MINISTERIAL_DEPARTMENT",
    authority_area: "Court administration, prison services, public prosecution administrative oversight, judicial career management",
    legal_responsibilities: "Administering judicial infrastructure, overseeing the public prosecutor's office, executing court decisions and judicial decrees.",
    parent_institution_id: "INST-GOV",
    active_from: "1956-04-14",
    active_to: null,
    source_ids: ["SRC-JORT-DEC516"]
  },

  "INST-MOI": {
    institution_id: "INST-MOI",
    name: "Ministry of Interior (Ministère de l'Intérieur)",
    short_name: "Ministry of Interior",
    institution_type: "MINISTERIAL_DEPARTMENT",
    authority_area: "National Police, National Guard, civil protection, border surveillance, coastal maritime security, public order",
    legal_responsibilities: "Internal security, territorial administration, border control, maritime search and interdiction operations.",
    parent_institution_id: "INST-GOV",
    active_from: "1956-04-14",
    active_to: null,
    source_ids: ["SRC-EU-MOU2023"]
  },

  "INST-MOF": {
    institution_id: "INST-MOF",
    name: "Ministry of Finance (Ministère des Finances)",
    short_name: "Ministry of Finance",
    institution_type: "MINISTERIAL_DEPARTMENT",
    authority_area: "State budget formulation, public debt management, tax collection, customs administration, penal reconciliation oversight",
    legal_responsibilities: "Managing state public finances, issuing sovereign treasury bonds, executing public expenditure, publishing public debt and budget execution reports.",
    parent_institution_id: "INST-GOV",
    active_from: "1956-04-14",
    active_to: null,
    source_ids: ["SRC-MF-DEBT2019", "SRC-MF-DEBT2026Q2"]
  },

  "INST-MOE": {
    institution_id: "INST-MOE",
    name: "Ministry of Industry, Mines and Energy (Ministère de l'Industrie, des Mines et de l'Énergie)",
    short_name: "Ministry of Industry & Energy",
    institution_type: "MINISTERIAL_DEPARTMENT",
    authority_area: "Industrial strategy, phosphate mining, hydrocarbon extraction, electrical infrastructure, energy transition",
    legal_responsibilities: "Supervising state-owned industrial enterprises (STEG, GCT, CPG), overseeing national energy supply and international pipeline transit agreements.",
    parent_institution_id: "INST-GOV",
    active_from: "1956-04-14",
    active_to: null,
    source_ids: ["SRC-ONME-DEF2026"]
  },

  "INST-MOA": {
    institution_id: "INST-MOA",
    name: "Ministry of Agriculture, Water Resources and Fisheries (Ministère de l'Agriculture, des Ressources Hydrauliques et de la Pêche)",
    short_name: "Ministry of Agriculture",
    institution_type: "MINISTERIAL_DEPARTMENT",
    authority_area: "Dam reservoir management, hydraulic infrastructure, agricultural production, food security, potable water policy",
    legal_responsibilities: "Managing national water resources (ONAGRI, SONEDE), dam network operations, agricultural support policies, irrigation quotas.",
    parent_institution_id: "INST-GOV",
    active_from: "1956-04-14",
    active_to: null,
    source_ids: ["SRC-INS-ACC2019", "SRC-INS-ACC2026Q2"]
  },

  "INST-MOENV": {
    institution_id: "INST-MOENV",
    name: "Ministry of Environment (Ministère de l'Environnement)",
    short_name: "Ministry of Environment",
    institution_type: "MINISTERIAL_DEPARTMENT",
    authority_area: "Environmental protection, industrial pollution regulation, waste management, climate adaptation",
    legal_responsibilities: "Formulating national ecological protection standards, supervising ANPE and ONAS, auditing industrial emissions and hazardous waste handling.",
    parent_institution_id: "INST-GOV",
    active_from: "1991-10-11",
    active_to: null,
    source_ids: ["SRC-ANPE-GABES2018", "SRC-JORT-GABES2017"]
  },

  "INST-ISIE": {
    institution_id: "INST-ISIE",
    name: "Independent High Authority for Elections (Instance Supérieure Indépendante pour les Élections)",
    short_name: "ISIE",
    institution_type: "ELECTORAL_AUTHORITY",
    authority_area: "Voter registry management, candidate qualification, election administration, official result certification",
    legal_responsibilities: "Organizing and supervising presidential, legislative, regional, and municipal elections and referendums; publishing definitive official results in JORT.",
    parent_institution_id: null,
    active_from: "2011-04-18",
    active_to: null,
    source_ids: ["SRC-ISIE-ELEC2019", "SRC-ISIE-ELEC2024"]
  },

  "INST-CSM": {
    institution_id: "INST-CSM",
    name: "High Judicial Council / Provisional Judicial Council (Conseil Supérieur de la Magistrature / Conseil Provisoire)",
    short_name: "Judicial Council (CSM)",
    institution_type: "JUDICIAL_BODY",
    authority_area: "Magistrate appointments, transfers, judicial discipline, court organization",
    legal_responsibilities: "Constitutional body governing judicial careers; reformed via Decree-Law 2022-11 establishing the Provisional High Judicial Council.",
    parent_institution_id: null,
    active_from: "2016-04-28",
    active_to: null,
    source_ids: ["SRC-JORT-DEC516"]
  },

  "INST-TA": {
    institution_id: "INST-TA",
    name: "Administrative Court (Tribunal Administratif de Tunis)",
    short_name: "Administrative Court",
    institution_type: "ADMINISTRATIVE_JUDICIARY",
    authority_area: "Litigation against state administrative decisions, electoral disputes (pre-Sept 2024), abuse of power appeals",
    legal_responsibilities: "Adjudicating legality of administrative and executive decrees; ruling on judicial reinstatement and electoral qualification challenges.",
    parent_institution_id: null,
    active_from: "1972-06-01",
    active_to: null,
    source_ids: ["SRC-JORT-DEC516", "SRC-ISIE-ELEC2024"]
  },

  "INST-BCT": {
    institution_id: "INST-BCT",
    name: "Central Bank of Tunisia (Banque Centrale de Tunisie)",
    short_name: "BCT",
    institution_type: "CENTRAL_BANK",
    authority_area: "Monetary policy, policy interest rates, foreign exchange reserves, currency issuance, banking regulation",
    legal_responsibilities: "Ensuring price stability, managing foreign reserves, regulating the financial sector, providing official financial telemetry.",
    parent_institution_id: null,
    active_from: "1958-11-03",
    active_to: null,
    source_ids: ["SRC-BCT-RATE", "SRC-BCT-FX2026"]
  },

  "INST-INS": {
    institution_id: "INST-INS",
    name: "National Institute of Statistics (Institut National de la Statistique)",
    short_name: "INS",
    institution_type: "STATISTICAL_AUTHORITY",
    authority_area: "National accounts (GDP), employment & unemployment surveys, consumer price index (IPC), demographic census",
    legal_responsibilities: "Collecting, analyzing, and publishing official national economic and social statistics according to international standards.",
    parent_institution_id: "INST-GOV",
    active_from: "1969-04-30",
    active_to: null,
    source_ids: ["SRC-INS-ACC2019", "SRC-INS-ACC2026Q2", "SRC-INS-EMP2019", "SRC-INS-EMP2026Q2", "SRC-INS-IPC2019", "SRC-INS-IPC202608"]
  },

  "INST-ONME": {
    institution_id: "INST-ONME",
    name: "National Energy Observatory (Observatoire National de l'Énergie et des Mines)",
    short_name: "ONME",
    institution_type: "STATISTICAL_ENERGY_AUTHORITY",
    authority_area: "National energy balance, hydrocarbon production, natural gas imports, primary energy deficit tracking",
    legal_responsibilities: "Publishing monthly national energy and mining conjunctural bulletins and tracking energy balance deficits.",
    parent_institution_id: "INST-MOE",
    active_from: "2013-01-01",
    active_to: null,
    source_ids: ["SRC-ONME-DEF2026"]
  },

  "INST-SONEDE": {
    institution_id: "INST-SONEDE",
    name: "National Water Distribution Utility (Société Nationale d'Exploitation et de Distribution des Eaux)",
    short_name: "SONEDE",
    institution_type: "PUBLIC_UTILITY",
    authority_area: "Potable water purification, urban/rural distribution network, hydraulic quota rationing schedules",
    legal_responsibilities: "Supplying potable water across Tunisian municipalities; executing seasonal night-time rationing programs during drought.",
    parent_institution_id: "INST-MOA",
    active_from: "1968-07-02",
    active_to: null,
    source_ids: ["SRC-INS-ACC2019", "SRC-INS-ACC2026Q2"]
  },

  "INST-STEG": {
    institution_id: "INST-STEG",
    name: "Tunisian Electricity and Gas Company (Société Tunisienne de l'Électricité et du Gaz)",
    short_name: "STEG",
    institution_type: "PUBLIC_UTILITY",
    authority_area: "Electricity generation (thermal, gas, solar), electrical grid transmission, natural gas domestic distribution",
    legal_responsibilities: "Generating and transmitting electrical energy across Tunisia; managing summer peak load distribution and international interconnectors (ELMED).",
    parent_institution_id: "INST-MOE",
    active_from: "1962-04-03",
    active_to: null,
    source_ids: ["SRC-WB-ELMED2023"]
  },

  "INST-ANPE": {
    institution_id: "INST-ANPE",
    name: "National Agency for Environmental Protection (Agence Nationale de Protection de l'Environnement)",
    short_name: "ANPE",
    institution_type: "ENVIRONMENTAL_REGULATOR",
    authority_area: "Industrial pollution inspection, environmental impact assessments, hazardous waste monitoring",
    legal_responsibilities: "Auditing industrial compliance with environmental norms, monitoring coastal discharges (Gabès phosphogypsum), issuing non-compliance sanctions.",
    parent_institution_id: "INST-MOENV",
    active_from: "1988-08-02",
    active_to: null,
    source_ids: ["SRC-ANPE-GABES2018"]
  },

  "INST-GCT": {
    institution_id: "INST-GCT",
    name: "Tunisian Chemical Group (Groupe Chimique Tunisien)",
    short_name: "GCT",
    institution_type: "STATE_OWNED_ENTERPRISE",
    authority_area: "Phosphate chemical processing, phosphoric acid production, fertilizer export, industrial waste management in Gabès and Skhira",
    legal_responsibilities: "Processing raw phosphate into industrial derivatives; managing Gabès coastal processing units under government relocation and upgrade mandates.",
    parent_institution_id: "INST-MOE",
    active_from: "1952-01-01",
    active_to: null,
    source_ids: ["SRC-ANPE-GABES2018", "SRC-JORT-GABES2017"]
  },

  "INST-DGD": {
    institution_id: "INST-DGD",
    name: "Directorate General of Customs (Direction Générale des Douanes)",
    short_name: "Tunisian Customs",
    institution_type: "BORDER_SECURITY_REVENUE",
    authority_area: "Port & border cargo inspections, anti-smuggling interdiction, narcotics seizures, foreign exchange control",
    legal_responsibilities: "Enforcing customs laws, securing maritime ports and land border crossings (Ras Jedir/Bouchabka), prosecuting illegal contraband.",
    parent_institution_id: "INST-MOF",
    active_from: "1956-12-06",
    active_to: null,
    source_ids: ["SRC-MF-DEBT2026Q2"]
  },

  "INST-INLUCC": {
    institution_id: "INST-INLUCC",
    name: "National Anti-Corruption Authority (Instance Nationale de Lutte Contre la Corruption)",
    short_name: "INLUCC",
    institution_type: "INDEPENDENT_CONSTITUTIONAL_BODY",
    authority_area: "Asset declarations, anti-corruption investigations, whistleblower protection, Bouderbala file custody",
    legal_responsibilities: "Investigating administrative and financial corruption, managing mandatory public asset declarations under Law 2018-46.",
    parent_institution_id: null,
    active_from: "2011-11-24",
    active_to: "2021-08-20",
    source_ids: ["SRC-JORT-DEC117"]
  },

  "INST-CPG": {
    institution_id: "INST-CPG",
    name: "Gafsa Phosphate Company (Compagnie des Phosphates de Gafsa)",
    short_name: "CPG",
    institution_type: "STATE_OWNED_ENTERPRISE",
    authority_area: "Phosphate extraction, washing plants in Gafsa mining basin, rail logistics to Gabès and Skhira chemical hubs",
    legal_responsibilities: "Commercial extraction and supply of raw phosphate rock for domestic chemical transformation and export.",
    parent_institution_id: "INST-MOE",
    active_from: "1897-01-01",
    active_to: null,
    source_ids: ["SRC-ONME-DEF2026"]
  },

  "INST-SNJT": {
    institution_id: "INST-SNJT",
    name: "National Syndicate of Tunisian Journalists (Syndicat National des Journalistes Tunisiens)",
    short_name: "SNJT",
    institution_type: "PROFESSIONAL_SYNDICATE",
    authority_area: "Press freedom advocacy, journalist defense, monitoring Decree-Law 54 prosecutions",
    legal_responsibilities: "Representing Tunisian professional journalists and documenting freedom of expression and press violations.",
    parent_institution_id: null,
    active_from: "2008-01-13",
    active_to: null,
    source_ids: ["SRC-JORT-DEC54"]
  },

  "INST-UGTT": {
    institution_id: "INST-UGTT",
    name: "Tunisian General Labour Union (Union Générale Tunisienne du Travail)",
    short_name: "UGTT",
    institution_type: "TRADE_UNION_CONFEDERATION",
    authority_area: "Labor negotiations, public enterprise wage bargaining, national dialogue initiatives",
    legal_responsibilities: "Representing Tunisian civil service and private sector workers; negotiating national collective agreements.",
    parent_institution_id: null,
    active_from: "1946-01-20",
    active_to: null,
    source_ids: ["SRC-INS-EMP2019"]
  },

  "INST-FTDES": {
    institution_id: "INST-FTDES",
    name: "Tunisian Forum for Economic and Social Rights (Forum Tunisien pour les Droits Économiques et Sociaux)",
    short_name: "FTDES",
    institution_type: "NON_GOVERNMENTAL_ORGANIZATION",
    authority_area: "Social movements monitoring, migration telemetry, water rights tracking, labor dispute documentation",
    legal_responsibilities: "Publishing empirical monthly observatory reports on social protests, maritime migration, and environmental rights.",
    parent_institution_id: null,
    active_from: "2011-03-01",
    active_to: null,
    source_ids: ["SRC-EU-MOU2023"]
  },

  "INST-CA": {
    institution_id: "INST-CA",
    name: "Tunis Court of Appeal (Cour d'Appel de Tunis)",
    short_name: "Tunis Court of Appeal",
    institution_type: "JUDICIAL_COURT",
    authority_area: "Appellate judicial proceedings, presidential candidate dispute adjudication (post-Law 2024-45)",
    legal_responsibilities: "Adjudicating secondary appellate litigation and electoral candidacy appeals under Law 2024-45.",
    parent_institution_id: "INST-MOJ",
    active_from: "1956-06-01",
    active_to: null,
    source_ids: ["SRC-ISIE-ELEC2024"]
  },

  "INST-FIPA": {
    institution_id: "INST-FIPA",
    name: "Foreign Investment Promotion Agency (FIPA-Tunisia)",
    short_name: "FIPA",
    institution_type: "PUBLIC_INVESTMENT_AGENCY",
    authority_area: "Foreign direct investment promotion, international investor facilitation, FDI flow telemetry",
    legal_responsibilities: "Attracting and monitoring foreign direct investment projects in Tunisia.",
    parent_institution_id: "INST-GOV",
    active_from: "1995-01-01",
    active_to: null,
    source_ids: ["SRC-INS-ACC2026Q2"]
  }
});
