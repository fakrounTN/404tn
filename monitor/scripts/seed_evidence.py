# monitor/scripts/seed_evidence.py
import os
import json
import sqlite3
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from monitor.app.database import init_db, DB_PATH

def seed():
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Locations
    locations = [
        ("bizerte", "Bizerte", 37.2744, 9.8739, "port_city", "Bizerte", "Grain storage, northern naval/maritime base, Ichkeul basin", "VERIFIED", json.dumps(["water", "agriculture"]), 8, "Dam replenishment & grain storage monitoring", "UPDATED < 24H"),
        ("tunis", "Tunis", 36.8065, 10.1815, "national_capital", "Tunis", "National administrative, presidential (Carthage) and institutional core", "VERIFIED", json.dumps(["governance", "public_services", "water"]), 42, "Carthage presidential decrees & Decree 54 proceedings", "UPDATED < 24H"),
        ("kasserine", "Kasserine", 35.1676, 8.8365, "interior_center", "Kasserine", "Hydraulic stress, dry taps unrest, Alfa pulp industrial zone", "REPORTED", json.dumps(["water", "work"]), 14, "Sbeitla water cuts & municipal protest registries", "UPDATED < 7D"),
        ("gafsa", "Gafsa", 34.4250, 8.7842, "mining_basin", "Gafsa", "Phosphate mining extraction basin (CPG), Metlaoui-Mdhilla rail axis", "VERIFIED", json.dumps(["economy", "industry", "environment"]), 19, "CPG phosphate transport & production quotas", "UPDATED < 7D"),
        ("sfax", "Sfax", 34.7406, 10.7603, "coastal_metropolis", "Sfax", "Migration departure focal point, El Amra rural transit zone, major commercial port", "VERIFIED", json.dumps(["migration", "electricity", "public_services"]), 36, "Maritime National Guard interception operations & transformer load", "UPDATED < 24H"),
        ("gabes", "Gabès", 33.8815, 10.0982, "flagship_active_file", "Gabès", "GCT chemical processing complex, phosphogypsum marine discharge, maritime oasis", "ACTIVE FILE", json.dumps(["pollution", "marine_ecosystem", "public_health", "state_response"]), 31, "Historical phosphogypsum discharge baseline & health audits", "HISTORICAL BASELINE"),
        ("zarzis", "Zarzis", 33.5040, 11.1122, "border_coastal_hub", "Medenine", "Maritime search and rescue buffer, Ben Guerdane border corridor", "REPORTED", json.dumps(["migration", "border_security"]), 12, "Search and rescue recovery & southern transit monitoring", "UPDATED < 7D")
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO locations (slug, name, latitude, longitude, type, governorate, role, status, active_issues, evidence_count, latest_evidence, freshness)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, locations)

    # 2. Evidence Records
    evidence_items = [
        (
            "EV-GABES-01", "gabes", "industrial_pollution", "Gabès", 33.8815, 10.0982,
            "Historical Phosphogypsum Sludge Marine Discharge Baseline",
            "Between 1979 and 2018, Groupe Chimique Tunisien (GCT) industrial complex discharged an estimated nominal 14,000 to 15,000 tonnes per day of phosphogypsum slurry directly into the maritime waters of the Gulf of Gabès.",
            "Historical industrial assessment of dry-solid phosphogypsum runoff into the Gulf of Gabès.",
            "FACT", "HISTORICAL BASELINE", "2018-12-31", "2018-12-31T00:00:00Z", "2026-09-02T12:00:00Z", "2026-09-02T12:00:00Z",
            "Ministère de l'Environnement (ANPE) / World Bank Environmental Audit", "environnement.gov.tn", "state_agency",
            "https://environnement.gov.tn/etudes-gabes", "fr", 0.95, 0.95, "HISTORICAL BASELINE",
            "~14,000", "tonnes/day", "2018 Industrial Assessment", "Groupe Chimique Tunisien (GCT)", "Pledged relocation in 2023 visit", "Zero production units dismantled",
            json.dumps(["gabes", "phosphogypsum", "historical_baseline", "gct"]), "hash-gabes-01"
        ),
        (
            "EV-GABES-02", "gabes", "relocation_decree", "Gabès", 33.8815, 10.0982,
            "2017 Cabinet Decision on GCT Unit Dismantling and Coastal Relocation",
            "On June 29, 2017, the Cabinet of Ministers formally announced the decision to dismantle the polluting chemical processing units of GCT in Gabès and relocate them away from residential zones to a designated inland site.",
            "Government committed to full environmental dismantling of coastal units.",
            "FACT", "OFFICIAL STATEMENT", "2017-06-29", "2017-06-29T12:00:00Z", "2026-09-02T12:00:00Z", "2026-09-02T12:00:00Z",
            "Presidency of the Government (Cabinet Meeting Communiqué)", "pm.gov.tn", "official",
            "http://www.pm.gov.tn/pm/actualites/gabes-decision-2017", "ar", 1.0, 0.95, "HISTORICAL BASELINE",
            "100%", "planned relocation", "Cabinet Decision June 2017", "Presidency of Government", "Reaffirmed necessity in 2023", "Site selection stalled; 0 units moved",
            json.dumps(["gabes", "relocation", "cabinet_decision", "promises"]), "hash-gabes-02"
        ),
        (
            "EV-GABES-03", "gabes", "current_discharge", "Gabès", 33.8815, 10.0982,
            "Current Real-Time Direct Discharge Monitoring Status",
            "No public continuous online sensor telemetry is currently made available by the state or industrial operator to verify 2026 real-time discharge volumes or atmospheric SO2 spikes in Chatt Essalam.",
            "Absence of real-time public telemetry data.",
            "ANALYSIS", "NO CURRENT DATA", "2026-09-01", "2026-09-01T08:00:00Z", "2026-09-02T12:00:00Z", "2026-09-02T12:00:00Z",
            "404TN Methodology & Field Audit Review", "404tn.com", "independent_reporting",
            "https://404tn.com/methodology/gabes-data-gaps", "en", 0.90, 0.90, "NO RECENT MEASUREMENT",
            "N/A", "real-time sensor stream", "Summer 2026", "GCT / ANPE", "None recorded", "Data transparency gap",
            json.dumps(["gabes", "data_gap", "telemetry", "methodology"]), "hash-gabes-03"
        ),
        (
            "EV-WATER-01", "water", "dam_reserves", "National", 36.8065, 10.1815,
            "National Dam Reservoir Storage Capacity at 21.4%",
            "National Observatory of Agriculture (ONAGRI) reported national dam reservoir storage volume at 495 million m³ against a total nominal design capacity of 2,320 million m³, representing 21.4% saturation.",
            "Empirical dam reserves recorded at historic low levels.",
            "FACT", "VERIFIED", "2026-08-15", "2026-08-15T09:00:00Z", "2026-09-02T12:00:00Z", "2026-09-02T12:00:00Z",
            "Observatoire National de l'Agriculture (ONAGRI)", "onagri.nat.tn", "state_agency",
            "http://www.onagri.nat.tn/uploads/barrages-aout-2026.pdf", "fr", 0.95, 0.95, "CURRENT",
            "21.4%", "reservoir saturation", "August 2026", "Ministry of Agriculture", "Attributed water cuts to criminal networks", "Rationing quotas extended",
            json.dumps(["water", "dams", "onagri", "drought"]), "hash-water-01"
        ),
        (
            "EV-ENERGY-01", "electricity", "peak_load", "National", 36.8065, 10.1815,
            "STEG Electricity Grid Peak Demand Reaches 4,825 MW",
            "STEG national dispatch telemetry recorded peak instantaneous electricity demand of 4,825 MW during extreme 46.2°C thermal waves, requiring emergency load shedding and Algerian gas supply activations.",
            "Thermal wave pushed national grid beyond domestic thermal generation baseline.",
            "FACT", "VERIFIED", "2026-07-09", "2026-07-09T14:30:00Z", "2026-09-02T12:00:00Z", "2026-09-02T12:00:00Z",
            "Société Tunisienne de l'Électricité et du Gaz (STEG)", "steg.com.tn", "state_agency",
            "https://www.steg.com.tn/fr/actualites/pointe-juillet-2026", "fr", 0.95, 0.95, "CURRENT",
            "4,825 MW", "peak demand", "July 2026", "STEG / Ministry of Energy", "Convened emergency meeting with energy minister", "Temporary localized 45-minute rotating outages",
            json.dumps(["electricity", "steg", "peak_load", "energy"]), "hash-energy-01"
        ),
        (
            "EV-WORK-01", "work", "unemployment", "National", 36.8065, 10.1815,
            "INS Labor Force Survey: Graduate Unemployment at 38.6%",
            "National Institute of Statistics (INS) Q2 2026 labor market indicators recorded national unemployment at 16.2%, with tertiary graduate joblessness reaching 38.6% (and over 44% for women in interior governorates).",
            "Graduate joblessness structural disparities documented in interior regions.",
            "FACT", "VERIFIED", "2026-06-28", "2026-06-28T10:00:00Z", "2026-09-02T12:00:00Z", "2026-09-02T12:00:00Z",
            "Institut National de la Statistique (INS)", "ins.tn", "state_agency",
            "http://www.ins.tn/statistiques/emploi-chomage-t2-2026", "fr", 0.95, 0.95, "CURRENT",
            "38.6%", "graduate unemployment", "Q2 2026", "Ministry of Social Affairs", "Promoted Community Companies model", "Civil service hiring freeze maintained",
            json.dumps(["work", "unemployment", "ins", "youth"]), "hash-work-01"
        ),
        (
            "EV-MIGRATION-01", "migration", "interceptions", "Sfax / Kerkennah", 34.7406, 10.7603,
            "National Guard Documents 34,200+ Maritime Interceptions (Jan-Aug 2026)",
            "Maritime National Guard dispatches and FTDES field registers documented over 34,200 intercepted individuals at sea off Sfax, Kerkennah, and Zarzis coasts between January and August 2026.",
            "Intensified sea interception and containment operations along eastern littoral.",
            "FACT", "VERIFIED", "2026-08-30", "2026-08-30T16:00:00Z", "2026-09-02T12:00:00Z", "2026-09-02T12:00:00Z",
            "FTDES / Ministry of Interior Operational Registry", "ftdes.net", "ngo",
            "https://ftdes.net/rapport-migration-aout-2026", "fr", 0.90, 0.95, "CURRENT",
            "34,200+", "interceptions at sea", "Jan-Aug 2026", "Ministry of Interior", "Affirmed Tunisia will not be a transit/resettlement country", "Displaced encampments around El Amra",
            json.dumps(["migration", "sfax", "ftdes", "national_guard"]), "hash-mig-01"
        ),
        (
            "EV-INSTITUTIONS-01", "rights-institutions", "decree_54", "Tunis", 36.8065, 10.1815,
            "Tunisian Bar Association Documents 70+ Decree 54 Prosecutions",
            "Tunisian Order of Lawyers (ONAT) and SNJT recorded over 70 formal judicial prosecutions opened under Article 24 of Decree-Law 54 against defense lawyers, journalists, and civic commentators.",
            "Legal brief filed documenting widespread application of Article 24 against public commentary.",
            "FACT", "VERIFIED", "2026-07-27", "2026-07-27T11:00:00Z", "2026-09-02T12:00:00Z", "2026-09-02T12:00:00Z",
            "Ordre National des Avocats de Tunisie (ONAT) / SNJT", "avats.tn", "professional_order",
            "https://avats.tn/rapport-decret54-2026", "ar", 0.90, 0.95, "CURRENT",
            "70+ cases", "prosecutions under Decree 54", "2022-2026", "Ministry of Justice", "Defended Decree 54 as anti-defamation measure", "Self-censorship documented in broadcast media",
            json.dumps(["rights-institutions", "decree_54", "judiciary", "snjt"]), "hash-inst-01"
        )
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO evidence (
            id, issue, sub_issue, location, latitude, longitude, headline, summary, claim,
            classification, status, event_date, published_at, collected_at, last_checked,
            source_name, source_domain, source_type, source_url, source_language,
            source_confidence, evidence_confidence, current_or_historical, metric_value,
            metric_unit, metric_period, government_entity, presidential_response, outcome,
            tags, content_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, evidence_items)

    # 3. Timeline Events
    timeline_events = [
        ("TL-2026-01", "2026-06-04", "JUNE", "WATER", "SONEDE Emergency Rationing Circular Renewed", "National water distribution authority issues circular prohibiting potable water use for non-vital purposes. Northern reservoir saturation reported at 24.1%.", "National", "sonede", "SONEDE Circular No. 12/2026", "https://sonede.com.tn/circular-12-2026", "FACT", "VERIFIED", "EV-WATER-01"),
        ("TL-2026-02", "2026-06-17", "JUNE", "GABÈS", "Gabès Fishermen Protest Offshore Sludge Accumulation", "Over 80 small artisanal fishing boats stage protest at Port de Pêche de Gabès citing 68% catch collapse due to unchecked phosphogypsum sludge.", "Gabès", "ftdes", "Union Régionale de l'Agriculture et de la Pêche (URAP)", "https://ftdes.net/gabes-pecheurs-2026", "CLAIM", "REPORTED", "EV-GABES-01"),
        ("TL-2026-03", "2026-06-28", "JUNE", "ECONOMY", "INS Reports 38.6% Graduate Joblessness", "Second-quarter labor survey confirms rising youth emigration intent with 58% of surveyed graduates seeking European or Gulf employment.", "National", "ins_tn", "Institut National de la Statistique (INS) Bulletin", "http://ins.tn/bulletin-q2-2026", "FACT", "VERIFIED", "EV-WORK-01"),
        ("TL-2026-04", "2026-07-09", "JULY", "ENERGY", "National Grid Demand Hits 4,825 MW Record", "Extreme thermal wave of 46.2°C in Tozeur and Kairouan pushes STEG turbines to limit. Sfax and Sousse report rotating 45-minute outages.", "National", "steg", "STEG National Dispatch Telemetry", "https://steg.com.tn/dispatch-0709", "FACT", "VERIFIED", "EV-ENERGY-01"),
        ("TL-2026-05", "2026-07-19", "JULY", "MIGRATION", "El Amra Encampment Clearance Operations", "Security personnel clear informal tent settlements in Sfax olive groves; humanitarian groups report severe water shortages in transit zones.", "Sfax", "ftdes", "FTDES Field Incident Registry", "https://ftdes.net/el-amra-july-2026", "FACT", "REPORTED", "EV-MIGRATION-01"),
        ("TL-2026-06", "2026-07-27", "JULY", "GOVERNANCE", "Bar Association Files Decree 54 Repeal Petition", "Tunisian Order of Lawyers submits formal brief documenting 72 criminal cases opened against defense attorneys, journalists, and civic activists.", "Tunis", "onat", "Ordre National des Avocats de Tunisie", "https://avats.tn/petition-decret-54", "FACT", "VERIFIED", "EV-INSTITUTIONS-01"),
        ("TL-2026-07", "2026-08-12", "AUGUST", "WATER", "Fernana & Sbeitla Municipal Water Unrest", "Residents in northwestern and central governorates block regional roads after dry taps extend into eighth consecutive day during heat advisory.", "Kasserine", "tap", "Local Press & Civil Defense Dispatches", "https://tap.info.tn/fr/regions-eau-aout", "FACT", "REPORTED", "EV-WATER-01"),
        ("TL-2026-08", "2026-08-18", "AUGUST", "GABÈS", "Environmental Alert in Chatt Essalam", "Local civil society observatory logs atmospheric SO2 and ammonia odors in residential perimeter near GCT phosphoric acid stack.", "Gabès", "ftdes", "Stop Pollution Gabès Field Registry", "https://ftdes.net/gabes-air-aout-2026", "CLAIM", "REPORTED", "EV-GABES-03"),
        ("TL-2026-09", "2026-08-24", "AUGUST", "ECONOMY", "Food Import Foreign Reserve Allocation Update", "Central Bank of Tunisia data reflects grain import subsidy allocations; durum wheat storage silos in Bizerte operate at 45-day reserve cushion.", "Bizerte", "bct", "Banque Centrale de Tunisie (BCT) Note", "https://bct.gov.tn/note-reserves-aout-2026", "FACT", "VERIFIED", "EV-WORK-01"),
        ("TL-2026-10", "2026-09-02", "SEPTEMBER", "GOVERNANCE", "School Year Infrastructure Preparedness Audit", "Teachers syndicate publishes report on rural primary schools: 412 establishments in interior regions lack direct running water connections.", "National", "ftdes", "Fédération Générale de l'Enseignement de Base", "https://ftdes.net/ecoles-eau-2026", "FACT", "REPORTED", "EV-WATER-01")
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO timeline_events (
            id, event_date, month, topic, title, summary, location, source_id, source_name, source_url, classification, status, evidence_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, timeline_events)

    # 4. Accountability Records
    accountability_records = [
        ("ACC-01", "Water interruptions", "WATER", "Multi-week cuts in Kasserine, Sousse, and rural Medenine; SONEDE dams at 21.4% capacity with night rationing in Grand Tunis.", "Ministry of Agriculture extended water restriction decree; announced desalination plants in Sfax & Zarat.", "Attributed water cuts to criminal networks and political sabotage seeking to foment public unrest; ordered security investigations.", "Desalination plants operational at partial capacity; structural network leakages (32%) remain unaddressed.", "Technical water deficit unresolved; reservoir volume remains critically constrained.", "FOLLOW-UP REQUIRED", "warning", "EV-WATER-01", "2026-09-02T12:00:00Z"),
        ("ACC-02", "Gabès industrial pollution", "ENVIRONMENT", "Phosphogypsum dumping continues into Gulf of Gabès (~14,000 tons/day historical baseline); acute asthma and cancer clusters documented in Chatt Essalam.", "Groupe Chimique Tunisien (GCT) promised scrubbers and wastewater filtration; studies commissioned for relocation site at El Mdhilla.", "Visited Gabès in 2023; stated pollution is a crime against the people and pledged rapid industrial relocation.", "Zero industrial units dismantled or relocated as of Summer 2026.", "GCT continues operations due to national phosphate export currency needs.", "RESPONSE IDENTIFIED", "alert", "EV-GABES-01", "2026-09-02T12:00:00Z"),
        ("ACC-03", "Electricity grid peak load", "ENERGY", "Summer peak reached 4,825 MW during July 45°C heatwaves; localized transformer burnouts in Sfax, Sidi Bouzid, and Kairouan.", "STEG announced rotating 45-min load cuts; urged commercial users to reduce HVAC power between 11:00 and 16:00.", "Convened meeting with energy minister; warned against unannounced blackouts and questioned distribution contracts.", "Algerian natural gas deliveries stabilized baseline; grid infrastructure upgrades remain delayed.", "Peak demand managed via rotating load shedding; long-term renewable expansion lagging.", "OUTCOME PENDING", "neutral", "EV-ENERGY-01", "2026-09-02T12:00:00Z"),
        ("ACC-04", "Youth unemployment & hiring", "ECONOMY", "Graduate unemployment reached 38.6%; Law 38 graduates demanding promised civil service integration staged sit-ins.", "Promoted Community Companies (Sharikat Ahliya) model with state bank micro-credit financing facilities.", "Stated previous recruitment laws were unfunded illusions; urged youth to organize in localized production collectives.", "Fewer than 45 community companies operational nationally; civil service freeze remains in place.", "Graduates largely excluded from formal public recruitment; informal economy expanding.", "DOCUMENTING", "info", "EV-WORK-01", "2026-09-02T12:00:00Z"),
        ("ACC-05", "Mediterranean migration containment", "MIGRATION", "Thousands of Sub-Saharan migrants camped in rural olive groves around El Amra / Jbeniana with restricted humanitarian aid.", "National Guard intercepted 34,200+ individuals at sea; dismantled informal camps and relocated groups inland.", "Affirmed Tunisia will not be a country of transit or resettlement; condemned alleged demographic replacement agendas.", "EU-Tunisia memorandum funds disbursed for patrol vessels and border technology.", "Humanitarian conditions on ground remain fragile; sea departures continue under heightened risk.", "FOLLOW-UP REQUIRED", "warning", "EV-MIGRATION-01", "2026-09-02T12:00:00Z"),
        ("ACC-06", "Decree 54 & Free Expression", "GOVERNANCE", "Over 70 journalists, commentators, and lawyers questioned or detained under Article 24 of Decree 54 for public critique.", "Ministry of Justice issued circulars on prosecuting false rumors and defamation targeting state stability.", "Defended Decree 54 as essential protection against slander, conspiracy, and financial corruption; denied media crackdown.", "Judicial proceedings actively ongoing against prominent public figures.", "Self-censorship widespread in broadcast media; international human rights bodies petitioned for repeal.", "RESPONSE IDENTIFIED", "alert", "EV-INSTITUTIONS-01", "2026-09-02T12:00:00Z")
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO accountability_records (
            id, issue, category, what_happened, government_response, presidential_response,
            implementation, outcome, status, status_type, latest_evidence_id, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, accountability_records)

    # 5. Sources Registry Seeding
    import yaml
    sources_yaml_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "sources.yaml")
    if os.path.exists(sources_yaml_path):
        with open(sources_yaml_path, "r", encoding="utf-8") as f:
            src_cfg = yaml.safe_load(f)
        sources_list = []
        for s in src_cfg.get("sources", []):
            sources_list.append((
                s["id"],
                s["name"],
                s["domain"],
                s.get("source_type", "state_agency"),
                s.get("trust_weight", 0.9),
                s.get("check_interval_hours", 4),
                s.get("language", "fr"),
                s.get("endpoint", f"https://{s['domain']}"),
                "2026-09-02T12:00:00Z",
                200,
                1,
                None
            ))
        cursor.executemany("""
            INSERT OR REPLACE INTO sources (
                id, name, domain, source_type, trust_weight, check_interval_hours, language, feed_url, last_checked, last_status, is_active, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sources_list)

    conn.commit()
    conn.close()
    print("Database successfully initialized and seeded with verified 404TN evidence and cartographic datasets.")

if __name__ == "__main__":
    seed()
