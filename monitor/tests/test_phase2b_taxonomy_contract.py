# monitor/tests/test_phase2b_taxonomy_contract.py
"""
404TN Frontend Phase 2B-1: Strict Dossier Route Mapping & Data Contract Alignment Tests

Verifies:
1. Strict dossier route slug -> canonical issue mapping (no category expansion).
2. Negative tests: dossier routes strictly exclude unrelated canonical categories:
   - /api/issues/electricity excludes gas_energy
   - /api/issues/work excludes economy_public_finance and prices_cost_of_living
   - /api/issues/public-services excludes health and education
   - /api/issues/rights excludes media_press_freedom, governance_institutions, justice_law
3. Positive tests:
   - pollution -> pollution_environment
   - work -> work_unemployment
   - public-services -> public_services
   - rights and rights-institutions -> rights_freedoms
4. Canonical V2 unlaunched categories remain queryable as first-class endpoints without folding into dossiers.
5. Map can surface canonical gas_energy and economy_public_finance.
6. Timeline exposes canonical topic labels and issue slugs with neutral OTHER fallback.
7. Strict public visibility: AUTO_ACCEPTED only (REVIEW_REQUIRED / REJECTED return 404).
8. Read endpoints safety: zero database mutations.
"""

import os
import gc
import json
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

from monitor.app.database import create_tables
from monitor.app.main import (
    app,
    resolve_topic_display,
    topic_matches_filter,
    CANONICAL_TOPIC_DISPLAY_MAP,
    MAP_ISSUE_GROUPS,
    ISSUE_DEFINITIONS
)


class TestPhase2bTaxonomyContract(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.test_dir.name, "test_phase2b.db")

        conn = sqlite3.connect(self.db_path)
        try:
            create_tables(conn)
            self._seed_test_evidence(conn)
        finally:
            conn.close()

    def tearDown(self):
        gc.collect()
        try:
            self.test_dir.cleanup()
        except Exception:
            pass

    def get_client(self):
        return TestClient(app)

    def _seed_test_evidence(self, conn: sqlite3.Connection):
        cursor = conn.cursor()
        
        # Insert representative records covering all canonical V2 categories for strict testing
        records = [
            # 1. Water (AUTO_ACCEPTED)
            ("EV-AUTO-20260910-T01", "water", "dam_reserves", "Tunis", "TUNIS", 36.8065, 10.1815, "LOCAL",
             "Water: National dam levels bulletin", "ONAGRI hydraulic bulletin.",
             "FACT", "VERIFIED", "2026-08-31", "2026-08-31T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "ONAGRI", "onagri.nat.tn", "REGULATORY", "https://onagri.nat.tn/doc01", 0.95, 0.95, "AUTO_ACCEPTED"),

            # 2. Electricity (AUTO_ACCEPTED)
            ("EV-AUTO-20260910-T02", "electricity", "grid_outage", "Tunis", "TUNIS", 36.8065, 10.1815, "LOCAL",
             "Electricity: Peak grid demand reaches record load", "STEG operational report.",
             "FACT", "VERIFIED", "2026-08-11", "2026-08-11T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "STEG", "steg.com.tn", "INSTITUTIONAL", "https://steg.com.tn/doc02", 0.90, 0.90, "AUTO_ACCEPTED"),

            # 3. Gas / Energy (AUTO_ACCEPTED) - Distinct from electricity
            ("EV-AUTO-20260910-T03", "gas_energy", "natural_gas_production", "Sfax", "SFAX", 34.7406, 10.7603, "LOCAL",
             "Gas Energy: Domestic natural gas output drops", "Energy observatory report.",
             "FACT", "VERIFIED", "2026-08-10", "2026-08-10T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "Energy Observatory", "energiemines.gov.tn", "INSTITUTIONAL", "https://energiemines.gov.tn/doc03", 0.90, 0.90, "AUTO_ACCEPTED"),

            # 4. Work / Unemployment (AUTO_ACCEPTED)
            ("EV-AUTO-20260910-T04", "work_unemployment", "graduate_jobless", "Tunis", "TUNIS", 36.8065, 10.1815, "LOCAL",
             "Work: Q2 unemployment rate stands at 16.0%", "INS labor survey release.",
             "FACT", "VERIFIED", "2026-08-15", "2026-08-15T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "INS", "ins.tn", "OFFICIAL", "https://ins.tn/doc04", 0.95, 0.95, "AUTO_ACCEPTED"),

            # 5. Economy / Public Finance (AUTO_ACCEPTED) - Distinct from work
            ("EV-AUTO-20260910-T05", "economy_public_finance", "banking_monetary", "Tunis", "TUNIS", 36.8065, 10.1815, "LOCAL",
             "Economy: Commercial banks credit up 2.1%", "BCT statistical bulletin.",
             "FACT", "VERIFIED", "2026-08-15", "2026-08-15T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "BCT", "bct.gov.tn", "REGULATORY", "https://bct.gov.tn/doc05", 0.95, 0.95, "AUTO_ACCEPTED"),

            # 6. Prices / Cost of Living (AUTO_ACCEPTED) - Distinct from work
            ("EV-AUTO-20260910-T06", "prices_cost_of_living", "household_cost", "Tunis", "TUNIS", 36.8065, 10.1815, "LOCAL",
             "Cost of Living: Back-to-school expenses rise 8%", "Consumer price report.",
             "FACT", "VERIFIED", "2026-08-20", "2026-08-20T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "INS", "ins.tn", "OFFICIAL", "https://ins.tn/doc06", 0.95, 0.95, "AUTO_ACCEPTED"),

            # 7. Migration (AUTO_ACCEPTED)
            ("EV-AUTO-20260910-T07", "migration", "maritime_departures", "Sfax", "SFAX", 34.7406, 10.7603, "LOCAL",
             "Migration: Interceptions off central coast reported", "National Guard report.",
             "FACT", "REPORTED", "2026-08-25", "2026-08-25T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "National Guard", "interieur.gov.tn", "OFFICIAL", "https://interieur.gov.tn/doc07", 0.90, 0.90, "AUTO_ACCEPTED"),

            # 8. Public Services (AUTO_ACCEPTED)
            ("EV-AUTO-20260910-T08", "public_services", "municipal_sanitation", "Kairouan", "KAIROUAN", 35.6781, 10.0963, "LOCAL",
             "Public Services: Municipal sanitation fleet deployment", "Local municipality update.",
             "FACT", "VERIFIED", "2026-08-05", "2026-08-05T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "Municipality", "kairouan.gov.tn", "OFFICIAL", "https://kairouan.gov.tn/doc08", 0.90, 0.90, "AUTO_ACCEPTED"),

            # 9. Health (AUTO_ACCEPTED) - Distinct from public-services
            ("EV-AUTO-20260910-T09", "health", "hospital_supplies", "Kairouan", "KAIROUAN", 35.6781, 10.0963, "LOCAL",
             "Health: Pediatric medicines dispatched to regional centers", "Health ministry release.",
             "FACT", "VERIFIED", "2026-08-06", "2026-08-06T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "Health Ministry", "santetunisie.rns.tn", "OFFICIAL", "https://santetunisie.rns.tn/doc09", 0.90, 0.90, "AUTO_ACCEPTED"),

            # 10. Education (AUTO_ACCEPTED) - Distinct from public-services
            ("EV-AUTO-20260910-T10", "education", "school_infrastructure", "Bizerte", "BIZERTE", 37.2744, 9.8739, "LOCAL",
             "Education: Maintenance completed on 14 primary schools", "Education ministry bulletin.",
             "FACT", "VERIFIED", "2026-08-12", "2026-08-12T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "Education Ministry", "education.gov.tn", "OFFICIAL", "https://education.gov.tn/doc10", 0.90, 0.90, "AUTO_ACCEPTED"),

            # 11. Rights & Freedoms (AUTO_ACCEPTED)
            ("EV-AUTO-20260910-T11", "rights_freedoms", "civic_protests", "Tunis", "TUNIS", 36.8065, 10.1815, "LOCAL",
             "Rights: Human rights organizations file amicus brief", "LTDH statement on civic liberties.",
             "FACT", "VERIFIED", "2026-07-22", "2026-07-22T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "LTDH", "ltdh.tn", "OFFICIAL", "https://ltdh.tn/doc11", 0.95, 0.95, "AUTO_ACCEPTED"),

            # 12. Media & Press Freedom (AUTO_ACCEPTED) - Distinct from rights_freedoms
            ("EV-AUTO-20260910-T12", "media_press_freedom", "journalist_summons", "Tunis", "TUNIS", 36.8065, 10.1815, "LOCAL",
             "Press Freedom: SNJT documents Decree 54 investigations", "Journalists union communiqué.",
             "FACT", "VERIFIED", "2026-07-20", "2026-07-20T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "SNJT", "snjt.tn", "OFFICIAL", "https://snjt.tn/doc12", 0.90, 0.90, "AUTO_ACCEPTED"),

            # 13. Governance / Institutions (AUTO_ACCEPTED) - Distinct from rights_freedoms
            ("EV-AUTO-20260910-T13", "governance_institutions", "presidential_decree", "Carthage", "TUNIS", 36.8529, 10.3217, "LOCAL",
             "Governance: Presidential decree reorganizes administrative council", "Official gazette JORT entry.",
             "FACT", "VERIFIED", "2026-07-18", "2026-07-18T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "JORT", "iort.gov.tn", "OFFICIAL", "https://iort.gov.tn/doc13", 0.95, 0.95, "AUTO_ACCEPTED"),

            # 14. Justice / Law (AUTO_ACCEPTED) - Distinct from rights_freedoms
            ("EV-AUTO-20260910-T14", "justice_law", "judicial_appointment", "Tunis", "TUNIS", 36.8065, 10.1815, "LOCAL",
             "Justice: Supreme judicial council session results published", "Justice ministry press release.",
             "FACT", "VERIFIED", "2026-07-15", "2026-07-15T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "Ministry of Justice", "e-justice.tn", "OFFICIAL", "https://e-justice.tn/doc14", 0.95, 0.95, "AUTO_ACCEPTED"),

            # 15. Pollution & Environment / Gabes (AUTO_ACCEPTED)
            ("EV-AUTO-20260910-T15", "pollution_environment", "phosphogypsum_discharge", "Gabès", "GABES", 33.8815, 10.0982, "LOCAL",
             "Environment: Industrial discharge monitoring along Gulf of Gabes", "ANPE baseline study.",
             "FACT", "REPORTED", "2026-08-01", "2026-08-01T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "ANPE", "anpe.nat.tn", "INSTITUTIONAL", "https://anpe.nat.tn/doc15", 0.95, 0.90, "AUTO_ACCEPTED"),

            # 16. Unknown/Unrecognized Issue (AUTO_ACCEPTED)
            ("EV-AUTO-20260910-T16", "cultural_festivals_heritage", "folklore", "Carthage", "TUNIS", 36.8529, 10.3217, "LOCAL",
             "Heritage: Cultural festival attendance numbers", "Festival administrative report.",
             "FACT", "REPORTED", "2026-08-18", "2026-08-18T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "Festival Committee", "festival-carthage.tn", "PUBLIC", "https://festival-carthage.tn/doc16", 0.85, 0.85, "AUTO_ACCEPTED"),

            # 17. REVIEW_REQUIRED Record (MUST BE EXCLUDED FROM PUBLIC ENDPOINTS)
            ("EV-AUTO-20260910-T17", "governance_institutions", "political_appointments", "Tunis", "TUNIS", 36.8065, 10.1815, "LOCAL",
             "Review Required: Unverified political editorial", "Low corroboration blog claim.",
             "CLAIM", "UNDER REVIEW", "2026-08-20", "2026-08-20T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "Opinion Blog", "blog.tn", "MEDIA", "https://blog.tn/doc17", 0.40, 0.40, "REVIEW_REQUIRED"),

            # 18. REJECTED Record (MUST BE EXCLUDED FROM PUBLIC ENDPOINTS)
            ("EV-AUTO-20260910-T18", "sports_entertainment", "match_result", "Rades", "BEN_AROUS", 36.7531, 10.2189, "LOCAL",
             "Rejected: Football match recap", "Sports recap outside 404TN monitoring scope.",
             "FACT", "REPORTED", "2026-08-12", "2026-08-12T10:00:00Z", "2026-09-10T01:36:25Z", "2026-09-10T01:36:25Z",
             "Sports Daily", "sports.tn", "MEDIA", "https://sports.tn/doc18", 0.20, 0.20, "REJECTED"),
        ]

        cursor.executemany("""
            INSERT INTO evidence (
                id, issue, sub_issue, location, governorate, latitude, longitude, location_scope,
                headline, summary, classification, status, event_date, published_at, collected_at, last_checked,
                source_name, source_domain, source_type, source_url, source_confidence, evidence_confidence,
                ingestion_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, records)
        conn.commit()

    # =========================================================================
    # 1. Canonical Taxonomy Display & Fallback Resolution
    # =========================================================================
    def test_01_canonical_taxonomy_display_resolution(self):
        """All 21 Collector V2 canonical issues resolve to expected uppercase labels."""
        expected = {
            "water": "WATER",
            "electricity": "ELECTRICITY",
            "gas_energy": "ENERGY",
            "food_security": "FOOD SECURITY",
            "prices_cost_of_living": "COST OF LIVING",
            "work_unemployment": "WORK",
            "migration": "MIGRATION",
            "health": "HEALTH",
            "public_services": "PUBLIC SERVICES",
            "pollution_environment": "ENVIRONMENT",
            "rights_freedoms": "RIGHTS",
            "justice_law": "JUSTICE",
            "media_press_freedom": "PRESS FREEDOM",
            "governance_institutions": "GOVERNANCE",
            "economy_public_finance": "ECONOMY",
            "corruption_accountability": "ACCOUNTABILITY",
            "protests_social_movements": "PROTESTS",
            "security_policing": "SECURITY",
            "education": "EDUCATION",
            "agriculture": "AGRICULTURE",
            "housing_infrastructure": "INFRASTRUCTURE",
        }
        for key, expected_label in expected.items():
            self.assertEqual(resolve_topic_display(key), expected_label, f"Failed for {key}")
            self.assertEqual(resolve_topic_display(key.upper()), expected_label, f"Failed for uppercase {key}")

    def test_02_unknown_issues_fallback_to_other(self):
        """Unknown or missing issues resolve strictly to 'OTHER', NEVER to 'GOVERNANCE'."""
        unknown_keys = ["unknown_category", "cultural_festivals_heritage", "sports_entertainment", "", None, "xyz_123"]
        for key in unknown_keys:
            res = resolve_topic_display(key)
            self.assertEqual(res, "OTHER", f"Key '{key}' should resolve to 'OTHER', got '{res}'")
            self.assertNotEqual(res, "GOVERNANCE")
            self.assertNotEqual(res, "PRESIDENCY")

    # =========================================================================
    # 2. Strict Dossier Route Exclusions (Negative Tests)
    # =========================================================================
    def test_03_strict_dossier_route_exclusions(self):
        """Verify dossier routes strictly exclude unrelated canonical V2 issues."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()

            # 1. /api/issues/electricity strictly excludes gas_energy
            res_elec = client.get("/api/issues/electricity")
            self.assertEqual(res_elec.status_code, 200)
            elec_ev_ids = [e["id"] for e in res_elec.json()["evidence_records"]]
            self.assertIn("EV-AUTO-20260910-T02", elec_ev_ids)     # electricity
            self.assertNotIn("EV-AUTO-20260910-T03", elec_ev_ids)  # gas_energy (EXCLUDED)

            # 2. /api/issues/work strictly excludes economy_public_finance and prices_cost_of_living
            res_work = client.get("/api/issues/work")
            self.assertEqual(res_work.status_code, 200)
            work_ev_ids = [e["id"] for e in res_work.json()["evidence_records"]]
            self.assertIn("EV-AUTO-20260910-T04", work_ev_ids)     # work_unemployment
            self.assertNotIn("EV-AUTO-20260910-T05", work_ev_ids)  # economy_public_finance (EXCLUDED)
            self.assertNotIn("EV-AUTO-20260910-T06", work_ev_ids)  # prices_cost_of_living (EXCLUDED)

            # 3. /api/issues/public-services strictly excludes health and education
            res_ps = client.get("/api/issues/public-services")
            self.assertEqual(res_ps.status_code, 200)
            ps_ev_ids = [e["id"] for e in res_ps.json()["evidence_records"]]
            self.assertIn("EV-AUTO-20260910-T08", ps_ev_ids)       # public_services
            self.assertNotIn("EV-AUTO-20260910-T09", ps_ev_ids)    # health (EXCLUDED)
            self.assertNotIn("EV-AUTO-20260910-T10", ps_ev_ids)    # education (EXCLUDED)

            # 4. /api/issues/rights strictly excludes media_press_freedom, governance_institutions, justice_law
            res_rights = client.get("/api/issues/rights")
            self.assertEqual(res_rights.status_code, 200)
            rights_ev_ids = [e["id"] for e in res_rights.json()["evidence_records"]]
            self.assertIn("EV-AUTO-20260910-T11", rights_ev_ids)     # rights_freedoms
            self.assertNotIn("EV-AUTO-20260910-T12", rights_ev_ids)  # media_press_freedom (EXCLUDED)
            self.assertNotIn("EV-AUTO-20260910-T13", rights_ev_ids)  # governance_institutions (EXCLUDED)
            self.assertNotIn("EV-AUTO-20260910-T14", rights_ev_ids)  # justice_law (EXCLUDED)

    # =========================================================================
    # 3. Strict Dossier Route Positive Mappings
    # =========================================================================
    def test_04_strict_dossier_route_positive_mappings(self):
        """Verify launched routes map strictly to their single canonical category."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()

            # Index returns exactly the 6 files with clean single-category counts
            res_index = client.get("/api/issues")
            self.assertEqual(res_index.status_code, 200)
            issues_list = res_index.json()
            self.assertEqual(len(issues_list), 6)
            slugs = [d["slug"] for d in issues_list]
            self.assertEqual(slugs, ["water", "electricity", "work", "migration", "public-services", "rights-institutions"])

            # pollution -> pollution_environment
            res_pol = client.get("/api/issues/pollution")
            self.assertEqual(res_pol.status_code, 200)
            pol_ids = [e["id"] for e in res_pol.json()["evidence_records"]]
            self.assertEqual(pol_ids, ["EV-AUTO-20260910-T15"])

            # work -> work_unemployment
            res_work = client.get("/api/issues/work")
            self.assertEqual(res_work.status_code, 200)
            work_ids = [e["id"] for e in res_work.json()["evidence_records"]]
            self.assertEqual(work_ids, ["EV-AUTO-20260910-T04"])

            # public-services -> public_services
            res_ps = client.get("/api/issues/public-services")
            self.assertEqual(res_ps.status_code, 200)
            ps_ids = [e["id"] for e in res_ps.json()["evidence_records"]]
            self.assertEqual(ps_ids, ["EV-AUTO-20260910-T08"])

            # rights and rights-institutions -> rights_freedoms
            res_r = client.get("/api/issues/rights")
            self.assertEqual(res_r.status_code, 200)
            r_ids = [e["id"] for e in res_r.json()["evidence_records"]]
            self.assertEqual(r_ids, ["EV-AUTO-20260910-T11"])

            res_ri = client.get("/api/issues/rights-institutions")
            self.assertEqual(res_ri.status_code, 200)
            ri_ids = [e["id"] for e in res_ri.json()["evidence_records"]]
            self.assertEqual(ri_ids, ["EV-AUTO-20260910-T11"])

    # =========================================================================
    # 4. Canonical V2 Unlaunched Categories Queryable via Direct Canonical API
    # =========================================================================
    def test_05_unlaunched_canonical_categories_direct_api(self):
        """Unlaunched canonical V2 issues are directly queryable without umbrella folding."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()

            # gas_energy
            res_ge = client.get("/api/issues/gas_energy")
            self.assertEqual(res_ge.status_code, 200)
            self.assertEqual([e["id"] for e in res_ge.json()["evidence_records"]], ["EV-AUTO-20260910-T03"])

            # economy_public_finance
            res_econ = client.get("/api/issues/economy_public_finance")
            self.assertEqual(res_econ.status_code, 200)
            self.assertEqual([e["id"] for e in res_econ.json()["evidence_records"]], ["EV-AUTO-20260910-T05"])

            # media_press_freedom
            res_mpf = client.get("/api/issues/media_press_freedom")
            self.assertEqual(res_mpf.status_code, 200)
            self.assertEqual([e["id"] for e in res_mpf.json()["evidence_records"]], ["EV-AUTO-20260910-T12"])

            # health
            res_health = client.get("/api/issues/health")
            self.assertEqual(res_health.status_code, 200)
            self.assertEqual([e["id"] for e in res_health.json()["evidence_records"]], ["EV-AUTO-20260910-T09"])

            # education
            res_edu = client.get("/api/issues/education")
            self.assertEqual(res_edu.status_code, 200)
            self.assertEqual([e["id"] for e in res_edu.json()["evidence_records"]], ["EV-AUTO-20260910-T10"])

            # justice_law
            res_just = client.get("/api/issues/justice_law")
            self.assertEqual(res_just.status_code, 200)
            self.assertEqual([e["id"] for e in res_just.json()["evidence_records"]], ["EV-AUTO-20260910-T14"])

            # Non-canonical / unknown slug -> 404
            res_404 = client.get("/api/issues/unknown_category_slug")
            self.assertEqual(res_404.status_code, 404)

    # =========================================================================
    # 5. Map Canonical Surfacing & Isolation
    # =========================================================================
    def test_06_map_surfaces_canonical_categories(self):
        """Map API surfaces unlaunched canonical categories like gas_energy and economy_public_finance."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()

            # Surface gas_energy
            res_ge = client.get("/api/map?issue=gas_energy")
            self.assertEqual(res_ge.status_code, 200)
            ge_ids = [f["id"] for f in res_ge.json()["features"]]
            self.assertEqual(ge_ids, ["EV-AUTO-20260910-T03"])

            # Surface economy_public_finance
            res_econ = client.get("/api/map?issue=economy_public_finance")
            self.assertEqual(res_econ.status_code, 200)
            econ_ids = [f["id"] for f in res_econ.json()["features"]]
            self.assertEqual(econ_ids, ["EV-AUTO-20260910-T05"])

            # Strict map filtering for launched categories
            res_work = client.get("/api/map?issue=work")
            self.assertEqual(res_work.status_code, 200)
            work_ids = [f["id"] for f in res_work.json()["features"]]
            self.assertEqual(work_ids, ["EV-AUTO-20260910-T04"])

            res_rights = client.get("/api/map?issue=rights")
            self.assertEqual(res_rights.status_code, 200)
            rights_ids = [f["id"] for f in res_rights.json()["features"]]
            self.assertEqual(rights_ids, ["EV-AUTO-20260910-T11"])

    # =========================================================================
    # 6. Timeline Canonical Topics & Issue Slugs
    # =========================================================================
    def test_07_timeline_canonical_labels_and_payload(self):
        """Timeline events expose canonical topic display labels, issue slugs, and neutral OTHER fallback."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()
            res = client.get("/api/timeline")
            self.assertEqual(res.status_code, 200)
            events = res.json()
            
            # Assert only AUTO_ACCEPTED items appear (16 active records)
            self.assertEqual(len(events), 16)
            event_map = {e["id"]: e for e in events}
            
            # Canonical labels
            self.assertEqual(event_map["EV-AUTO-20260910-T03"]["topic"], "ENERGY")
            self.assertEqual(event_map["EV-AUTO-20260910-T03"]["issue"], "gas_energy")

            self.assertEqual(event_map["EV-AUTO-20260910-T05"]["topic"], "ECONOMY")
            self.assertEqual(event_map["EV-AUTO-20260910-T05"]["issue"], "economy_public_finance")

            self.assertEqual(event_map["EV-AUTO-20260910-T09"]["topic"], "HEALTH")
            self.assertEqual(event_map["EV-AUTO-20260910-T09"]["issue"], "health")

            self.assertEqual(event_map["EV-AUTO-20260910-T10"]["topic"], "EDUCATION")
            self.assertEqual(event_map["EV-AUTO-20260910-T10"]["issue"], "education")

            self.assertEqual(event_map["EV-AUTO-20260910-T12"]["topic"], "PRESS FREEDOM")
            self.assertEqual(event_map["EV-AUTO-20260910-T12"]["issue"], "media_press_freedom")

            self.assertEqual(event_map["EV-AUTO-20260910-T14"]["topic"], "JUSTICE")
            self.assertEqual(event_map["EV-AUTO-20260910-T14"]["issue"], "justice_law")

            self.assertEqual(event_map["EV-AUTO-20260910-T16"]["topic"], "OTHER")
            self.assertEqual(event_map["EV-AUTO-20260910-T16"]["issue"], "cultural_festivals_heritage")

            # Assert REVIEW_REQUIRED and REJECTED IDs never appear
            self.assertNotIn("EV-AUTO-20260910-T17", event_map)
            self.assertNotIn("EV-AUTO-20260910-T18", event_map)

    # =========================================================================
    # 7. Strict Public Visibility & Detail Endpoint
    # =========================================================================
    def test_08_public_visibility_detail_endpoint(self):
        """Detail endpoint strictly returns AUTO_ACCEPTED records and 404 for non-public rows."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()

            # AUTO_ACCEPTED item -> 200
            res_ok = client.get("/api/evidence/EV-AUTO-20260910-T01")
            self.assertEqual(res_ok.status_code, 200)
            data = res_ok.json()
            self.assertEqual(data["id"], "EV-AUTO-20260910-T01")
            self.assertEqual(data["ingestion_status"], "AUTO_ACCEPTED")

            # REVIEW_REQUIRED item -> 404
            res_rev = client.get("/api/evidence/EV-AUTO-20260910-T17")
            self.assertEqual(res_rev.status_code, 404)

            # REJECTED item -> 404
            res_rej = client.get("/api/evidence/EV-AUTO-20260910-T18")
            self.assertEqual(res_rej.status_code, 404)

            # Non-existent ID -> 404
            res_non = client.get("/api/evidence/EV-AUTO-NONEXISTENT")
            self.assertEqual(res_non.status_code, 404)

    # =========================================================================
    # 8. Gabes Endpoint Contract
    # =========================================================================
    def test_09_gabes_endpoint_contract(self):
        """Gabes flagship endpoint includes pollution_environment evidence and metrics."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            client = self.get_client()
            res = client.get("/api/gabes")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertEqual(data["slug"], "gabes")
            self.assertEqual(data["status"], "ACTIVE FILE")
            self.assertGreaterEqual(data["evidence_count"], 1)
            ev_ids = [e["id"] for e in data["evidence_list"]]
            self.assertIn("EV-AUTO-20260910-T15", ev_ids)

    # =========================================================================
    # 9. Database Immutability Safety Test
    # =========================================================================
    def test_10_read_endpoints_never_mutate_database(self):
        """Calling public read endpoints performs zero mutations on the database."""
        with patch("monitor.app.database.DB_PATH", self.db_path):
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id, issue, sub_issue, ingestion_status, classification FROM evidence ORDER BY id")
            initial_rows = cursor.fetchall()
            conn.close()

            client = self.get_client()
            client.get("/api/health")
            client.get("/api/map")
            client.get("/api/map?issue=gas_energy")
            client.get("/api/timeline")
            client.get("/api/issues")
            client.get("/api/issues/pollution")
            client.get("/api/issues/work")
            client.get("/api/issues/rights")
            client.get("/api/issues/public-services")
            client.get("/api/issues/gas_energy")
            client.get("/api/gabes")
            client.get("/api/evidence/EV-AUTO-20260910-T01")
            client.get("/api/evidence/EV-AUTO-20260910-T17")

            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id, issue, sub_issue, ingestion_status, classification FROM evidence ORDER BY id")
            after_rows = cursor.fetchall()
            conn.close()

            self.assertEqual(initial_rows, after_rows, "Database rows were modified by read endpoint requests!")


if __name__ == "__main__":
    unittest.main()
