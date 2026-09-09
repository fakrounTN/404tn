"""
404TN — Phase 4.1 National Geo-Evidence Engine Verification Tests
"""

import os
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
import yaml
from fastapi.testclient import TestClient

from monitor.app.main import app
from monitor.app.database import create_tables
from monitor.app.services.locations import (
    resolve_location_advanced,
    ResolvedLocation,
    GOVERNORATES_24,
    ALL_24_GOVERNORATES_LIST,
    load_locations
)
from monitor.app.services.clustering import cluster_evidence_items


class TestPhase41GeoEvidenceEngine(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.temp_db_path = self.temp_db.name
        self.temp_db.close()
        create_tables(self.temp_db_path)

    def tearDown(self):
        if os.path.exists(self.temp_db_path):
            try:
                os.unlink(self.temp_db_path)
            except OSError:
                pass

    def test_source_inventory_consistency(self):
        sources_file = os.path.join(os.path.dirname(__file__), "..", "config", "sources.yaml")
        self.assertTrue(os.path.exists(sources_file), "sources.yaml must exist")

        with open(sources_file, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)

        sources = data.get("sources", [])
        self.assertEqual(len(sources), 18, "Exact configured sources must equal 18")

        enabled_sources = [s for s in sources if s.get("enabled", True)]
        disabled_sources = [s for s in sources if not s.get("enabled", True)]

        self.assertEqual(len(enabled_sources), 14, "Enabled active sources must equal 14")
        self.assertEqual(len(disabled_sources), 4, "Disabled/degraded sources must equal 4")

        disabled_ids = {s["id"] for s in disabled_sources}
        expected_disabled = {"agriculture_tn", "sonede", "steg", "ap_tunisia"}
        self.assertEqual(disabled_ids, expected_disabled)

        ap_source = next(s for s in sources if s["id"] == "ap_tunisia")
        self.assertFalse(ap_source.get("enabled", True))
        self.assertIn("403", ap_source.get("disabled_reason", ""))

    def test_systemd_service_docker_compose_target(self):
        service_file = os.path.join(os.path.dirname(__file__), "..", "deploy", "404tn-collector.service")
        self.assertTrue(os.path.exists(service_file), "404tn-collector.service must exist")

        with open(service_file, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertNotIn("/opt/404tn/venv", content, "Must not use host python venv")
        self.assertIn("docker compose", content, "Must invoke docker compose")
        self.assertIn("/opt/404tn/repo/deploy/docker-compose.production.yml", content)
        self.assertIn("/opt/404tn/.env.production", content)
        self.assertIn("run --rm --no-deps api python monitor/scripts/collect.py", content)

    def test_all_24_governorates_resolution_en_fr_ar(self):
        self.assertEqual(len(ALL_24_GOVERNORATES_LIST), 24, "Must list all 24 governorates")

        test_samples = [
            ("Protest against water cut in Ariana center", "Ariana"),
            ("Coupure d'eau à Beja nord", "Béja"),
            ("انقطاع الماء الصالح للشرب في بن عروس", "Ben Arous"),
            ("Fermeture de la route à Bizerte", "Bizerte"),
            ("Démarrage d'un projet solaire à Gabès", "Gabès"),
            ("Grève des agents municipaux à Gafsa", "Gafsa"),
            ("Incendie de forêt à Jendouba", "Jendouba"),
            ("Pénurie de médicaments à Kairouan", "Kairouan"),
            ("Protestations à Kasserine pour l'emploi", "Kasserine"),
            ("أزمة مياه في قبلة قبلي", "Kébili"),
            ("Problème d'assainissement au Kef", "Le Kef"),
            ("Coupure d'électricité à Mahdia", "Mahdia"),
            ("Déversement d'eaux usées à Manouba", "Manouba"),
            ("أزمة النفايات في مدنين", "Médenine"),
            ("Manifestation ouvrière à Monastir", "Monastir"),
            ("Chômage en hausse à Nabeul", "Nabeul"),
            ("Grave pénurie de farine à Sfax", "Sfax"),
            ("اعتصام في سيدي بوزيد للمطالبة بالتشغيل", "Sidi Bouzid"),
            ("انقطاع الكهرباء في سليانة", "Siliana"),
            ("Crise de transport à Sousse", "Sousse"),
            ("انخفاض منسوب المياه بتطاوين", "Tataouine"),
            ("أزمة توزيع الخبز بتوزر", "Tozeur"),
            ("Coupure d'eau dans plusieurs quartiers de Tunis", "Tunis"),
            ("حراك بيئي في زغوان", "Zaghouan"),
        ]

        for text, expected_gov in test_samples:
            resolved = resolve_location_advanced(text)
            self.assertEqual(
                resolved.governorate,
                expected_gov,
                f"Failed to resolve {expected_gov} from {text}. Got {resolved.governorate}"
            )
            self.assertIn(resolved.scope, ["GOVERNORATE", "LOCAL"])
            self.assertIsNotNone(resolved.latitude)
            self.assertIsNotNone(resolved.longitude)

    def test_delegation_to_governorate_hierarchical_mappings(self):
        delegation_tests = [
            ("Sauvetage de migrants au large de Zarzis", "Médenine", "Zarzis"),
            ("Opération de police à El Amra et Jebeniana", "Sfax", "El Amra"),
            ("Blocage de la production de phosphate à Metlaoui", "Gafsa", "Metlaoui"),
            ("Crise écologique à Redeyef", "Gafsa", "Redeyef"),
            ("Inondations à Ghardimaou", "Jendouba", "Ghardimaou"),
            ("Naufrage près des îles Kerkennah", "Sfax", "Kerkennah"),
            ("Protestations à Kalaat Khasba", "Le Kef", "Kalaat Khasba"),
            ("Fermeture d'usine à Mateur", "Bizerte", "Mateur"),
            ("Crise d'eau à Sbeitla", "Kasserine", "Sbeitla"),
            ("Pénurie d'eau potable à Djerba Houmt Souk", "Médenine", "Djerba"),
        ]

        for text, expected_gov, expected_deleg in delegation_tests:
            resolved = resolve_location_advanced(text)
            self.assertEqual(
                resolved.governorate,
                expected_gov,
                f"Text {text} should map to governorate {expected_gov}, got {resolved.governorate}"
            )
            if expected_deleg:
                self.assertIsNotNone(resolved.delegation, f"Delegation should be set for {text}")

    def test_national_article_isolation(self):
        national_samples = [
            "TUNIS (TAP) - Le taux de remplissage des barrages atteint 21% à l'échelle nationale",
            "ONAGRI: Bilan national de la récolte céréalière 2026 en Tunisie",
            "INS: Le taux de chômage national s'établit à 16% au deuxième trimestre",
            "Communiqué du Ministère de l'Agriculture: mesures d'urgence face à la sécheresse en Tunisie",
        ]

        for text in national_samples:
            resolved = resolve_location_advanced(text)
            self.assertEqual(resolved.scope, "NATIONAL", f"Text {text} must have scope NATIONAL, got {resolved.scope}")
            self.assertIsNone(resolved.latitude, f"National text {text} must not have latitude")
            self.assertIsNone(resolved.longitude, f"National text {text} must not have longitude")
            self.assertIsNone(resolved.governorate, f"National text {text} must not have governorate")

    def test_event_clustering_merging_and_separation(self):
        evidence_items = [
            {
                "id": "EV-AUTO-KAS-01",
                "headline": "Kasserine: Coupure d'eau potable depuis 48h à Sbeitla",
                "summary": "Les habitants de Sbeitla protestent contre la SONEDE",
                "issue": "water",
                "governorate": "Kasserine",
                "delegation": "Sbeitla",
                "latitude": 35.1676,
                "longitude": 8.8365,
                "event_date": "2026-08-10",
                "source_name": "TAP",
                "status": "REPORTED",
                "classification": "FACT"
            },
            {
                "id": "EV-AUTO-KAS-02",
                "headline": "Protestations à Sbeitla suite à une longue coupure d'eau",
                "summary": "Intervention des forces de l'ordre face aux manifestants",
                "issue": "water",
                "governorate": "Kasserine",
                "delegation": "Sbeitla",
                "latitude": 35.1676,
                "longitude": 8.8365,
                "event_date": "2026-08-10",
                "source_name": "Nawaat",
                "status": "VERIFIED",
                "classification": "FACT"
            },
            {
                "id": "EV-AUTO-KAS-03",
                "headline": "FTDES Kasserine: Alerte sur la soif et les tensions à Sbeitla",
                "summary": "Rapport du bureau régional sur les coupures d'eau à Sbeitla",
                "issue": "water",
                "governorate": "Kasserine",
                "delegation": "Sbeitla",
                "latitude": 35.1676,
                "longitude": 8.8365,
                "event_date": "2026-08-11",
                "source_name": "FTDES",
                "status": "REPORTED",
                "classification": "FACT"
            },
            {
                "id": "EV-AUTO-GAB-01",
                "headline": "Gabès: Émanations toxiques à Chott Essalam",
                "summary": "Pollution industrielle au Groupe Chimique",
                "issue": "pollution",
                "governorate": "Gabès",
                "delegation": "Gabès Ville",
                "latitude": 33.8815,
                "longitude": 10.0982,
                "event_date": "2026-08-10",
                "source_name": "Inkyfada",
                "status": "VERIFIED",
                "classification": "FACT"
            }
        ]

        clusters = cluster_evidence_items(evidence_items)

        self.assertEqual(len(clusters), 2, "Should merge 3 Kasserine items into 1 cluster and keep Gabès separate")

        kas_cluster = next(c for c in clusters if c["governorate"] == "Kasserine")
        self.assertEqual(kas_cluster["evidence_count"], 3)
        self.assertEqual(kas_cluster["source_count"], 3)
        self.assertIn("TAP", kas_cluster["sources"])
        self.assertIn("Nawaat", kas_cluster["sources"])
        self.assertIn("FTDES", kas_cluster["sources"])
        self.assertEqual(set(kas_cluster["evidence_ids"]), {"EV-AUTO-KAS-01", "EV-AUTO-KAS-02", "EV-AUTO-KAS-03"})
        self.assertEqual(kas_cluster["status"], "VERIFIED")

        gab_cluster = next(c for c in clusters if c["governorate"] == "Gabès")
        self.assertEqual(gab_cluster["evidence_count"], 1)
        self.assertEqual(gab_cluster["source_count"], 1)

    def test_map_api_endpoint_modes_and_disclaimer(self):
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (
                id, issue, headline, summary, location, location_scope, governorate, 
                delegation, locality, location_confidence, location_method, latitude, 
                longitude, published_at, collected_at, last_checked, source_name, 
                source_domain, source_type, source_url, event_date, classification, 
                status, evidence_confidence
            ) VALUES 
            ('EV-AUTO-01', 'water', 'Coupure eau Gafsa', 'desc', 'Gafsa', 'GOVERNORATE', 'Gafsa', 'Metlaoui', NULL, 0.95, 'AUTHORITATIVE_TAXONOMY', 34.3, 8.7, '2026-08-10', '2026-08-10', '2026-08-10', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/1', '2026-08-10', 'FACT', 'VERIFIED', 0.9),
            ('EV-AUTO-02', 'energy', 'Panne steg Tunis', 'desc', 'Tunis', 'GOVERNORATE', 'Tunis', NULL, NULL, 0.90, 'AUTHORITATIVE_TAXONOMY', 36.8, 10.1, '2026-08-11', '2026-08-11', '2026-08-11', 'Nawaat', 'nawaat.org', 'independent', 'https://nawaat.org/1', '2026-08-11', 'FACT', 'VERIFIED', 0.85),
            ('EV-AUTO-03', 'water', 'Bilan national eau', 'desc', 'Tunisia', 'NATIONAL', NULL, NULL, NULL, 0.99, 'AUTHORITATIVE_TAXONOMY', NULL, NULL, '2026-08-12', '2026-08-12', '2026-08-12', 'ONAGRI', 'onagri.nat.tn', 'official', 'https://onagri.nat.tn/1', '2026-08-12', 'FACT', 'VERIFIED', 0.95)
        """)
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            client = TestClient(app)

            res = client.get("/api/map?mode=incidents")
            self.assertEqual(res.status_code, 200)
            data = res.json()

            self.assertEqual(data["type"], "FeatureCollection")
            self.assertIn("governorates", data)
            self.assertEqual(len(data["governorates"]), 24, "Must return stats for all 24 governorates")
            self.assertIn("clusters", data)
            self.assertIn("features", data)
            self.assertIn("national_summary", data)
            self.assertIn("disclaimer", data)

            self.assertIn("Density reflects documented evidence collected by 404TN", data["disclaimer"])
            self.assertEqual(data["national_summary"]["total_national_records"], 1)
            self.assertEqual(data["national_summary"]["water_count"], 1)
            self.assertEqual(len(data["features"]), 2, "Only regional items with coordinates appear in features")

            res_gov = client.get("/api/map?mode=governorates")
            self.assertEqual(res_gov.status_code, 200)
            data_gov = res_gov.json()
            self.assertEqual(len(data_gov["features"]), 24, "Governorates mode returns 24 centroid features")

            res_water = client.get("/api/map?issue=water")
            self.assertEqual(res_water.status_code, 200)
            data_water = res_water.json()
            self.assertEqual(len(data_water["features"]), 1, "Only Gafsa water incident in filtered features")

            # Canonical electricity filter test (with legacy energy item)
            res_elec = client.get("/api/map?issue=electricity")
            self.assertEqual(res_elec.status_code, 200)
            data_elec = res_elec.json()
            self.assertEqual(len(data_elec["features"]), 1, "Canonical electricity filter matches legacy energy record")

    # -------------------------------------------------------------------------
    # PART 8: CANONICAL ISSUE SLUG & BACKWARD COMPATIBILITY
    # -------------------------------------------------------------------------
    def test_canonical_electricity_issue_and_backward_compatibility(self):
        """Verify that 'electricity' is the canonical slug, and legacy 'energy' is normalized seamlessly."""
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (
                id, issue, headline, summary, location, location_scope, governorate,
                delegation, locality, location_confidence, location_method, latitude,
                longitude, published_at, collected_at, last_checked, source_name,
                source_domain, source_type, source_url, event_date, classification,
                status, evidence_confidence
            ) VALUES
            ('EV-AUTO-ELEC-01', 'electricity', 'STEG turbine maintenance in Sousse', 'Grid capacity update', 'Sousse', 'GOVERNORATE', 'Sousse', NULL, NULL, 0.90, 'GOVERNORATE_MATCH', 35.8256, 10.6369, '2026-08-01', '2026-08-01', '2026-08-01', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/e1', '2026-08-01', 'FACT', 'VERIFIED', 0.9),
            ('EV-AUTO-ELEC-02', 'energy', 'Legacy power outage record in Sfax', 'Load shedding report', 'Sfax', 'GOVERNORATE', 'Sfax', NULL, NULL, 0.90, 'GOVERNORATE_MATCH', 34.7406, 10.7603, '2026-08-02', '2026-08-02', '2026-08-02', 'Nawaat', 'nawaat.org', 'independent', 'https://nawaat.org/e2', '2026-08-02', 'FACT', 'VERIFIED', 0.85)
        """)
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            client = TestClient(app)

            # 1. Map API issue filter with canonical slug
            res_elec = client.get("/api/map?issue=electricity")
            self.assertEqual(res_elec.status_code, 200)
            data_elec = res_elec.json()
            self.assertEqual(len(data_elec["features"]), 2, "Canonical 'electricity' query matches both electricity and legacy energy records")

            # 2. Map API issue filter with legacy slug alias
            res_alias = client.get("/api/map?issue=energy")
            self.assertEqual(res_alias.status_code, 200)
            data_alias = res_alias.json()
            self.assertEqual(len(data_alias["features"]), 2, "Legacy 'energy' query alias normalizes to electricity")

            # 3. Issues Dossier endpoint
            res_dossier = client.get("/api/issues/electricity")
            self.assertEqual(res_dossier.status_code, 200)
            dossier = res_dossier.json()
            self.assertEqual(len(dossier["evidence_records"]), 2, "Electricity dossier aggregates both electricity and legacy energy rows")

            # 4. Clustering normalizes energy -> electricity
            clusters = cluster_evidence_items([
                {"id": "EV-1", "headline": "Power cut", "issue": "energy", "governorate": "Tunis", "event_date": "2026-08-01", "latitude": 36.8, "longitude": 10.1}
            ])
            self.assertEqual(clusters[0]["issue"], "electricity", "Clustering normalizes 'energy' to 'electricity'")

    # -------------------------------------------------------------------------
    # PART 9: SAFE MIGRATION DEFAULTS ON OLD-SCHEMA LEGACY DATABASE
    # -------------------------------------------------------------------------
    def test_safe_migration_defaults_on_legacy_database(self):
        """
        Creates an old-schema database (lacking the 6 new location columns),
        inserts legacy evidence, runs create_tables() migration, and proves:
        - All existing evidence preserved
        - No record becomes LOCAL automatically
        - No record gets confidence 0.9 automatically
        - No governorate invented
        - No coordinates invented
        - Migration is idempotent
        """
        old_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        old_db_path = old_db.name
        old_db.close()

        try:
            # 1. Initialize strictly legacy schema (before Phase 4.1 columns)
            conn = sqlite3.connect(old_db_path)
            conn.execute("""
                CREATE TABLE evidence (
                    id TEXT PRIMARY KEY,
                    issue TEXT NOT NULL,
                    sub_topic TEXT,
                    location TEXT DEFAULT 'Tunisia',
                    latitude REAL,
                    longitude REAL,
                    headline TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    claim TEXT,
                    classification TEXT NOT NULL,
                    status TEXT NOT NULL,
                    event_date TEXT,
                    published_at TEXT NOT NULL,
                    collected_at TEXT NOT NULL,
                    last_checked TEXT NOT NULL,
                    source_name TEXT NOT NULL,
                    source_domain TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    source_url TEXT NOT NULL,
                    content_hash TEXT UNIQUE
                )
            """)

            # Insert legacy records (one with no coords, one with old coords)
            conn.execute("""
                INSERT INTO evidence (
                    id, issue, location, latitude, longitude, headline, summary,
                    classification, status, published_at, collected_at, last_checked,
                    source_name, source_domain, source_type, source_url
                ) VALUES
                ('EV-AUTO-LEG-01', 'water', 'Tunisia', NULL, NULL, 'National water statistics report', 'National overview', 'FACT', 'VERIFIED', '2026-08-01', '2026-08-01', '2026-08-01', 'ONAGRI', 'onagri.tn', 'official', 'https://onagri.tn/1'),
                ('EV-AUTO-LEG-02', 'pollution', 'Gabès', 33.8815, 10.0982, 'Old study in Gabes', 'Chemical pollution summary', 'FACT', 'VERIFIED', '2026-08-02', '2026-08-02', '2026-08-02', 'PubMed', 'nih.gov', 'scientific', 'https://pubmed.gov/2')
            """)
            conn.commit()

            # 2. Run Migration 1
            create_tables(conn)

            # 3. Verify Migration Post-Conditions
            cursor = conn.cursor()
            cursor.execute("SELECT id, location, latitude, longitude, location_scope, governorate, delegation, locality, location_confidence, location_method FROM evidence ORDER BY id")
            rows = cursor.fetchall()

            # Evidence preserved
            self.assertEqual(len(rows), 2, "All legacy evidence records preserved")

            # Check Record 1 (no coords)
            r1 = rows[0]
            self.assertEqual(r1[0], "EV-AUTO-LEG-01")
            self.assertEqual(r1[1], "Tunisia")
            self.assertIsNone(r1[2], "No coordinates invented for legacy unlocated item (lat is None)")
            self.assertIsNone(r1[3], "No coordinates invented for legacy unlocated item (lon is None)")
            self.assertEqual(r1[4], "UNRESOLVED", "Migrated record must default to scope UNRESOLVED, not LOCAL")
            self.assertIsNone(r1[5], "No governorate invented (governorate is None)")
            self.assertIsNone(r1[6], "No delegation invented (delegation is None)")
            self.assertIsNone(r1[7], "No locality invented (locality is None)")
            self.assertEqual(r1[8], 0.0, "Migrated record must have location_confidence 0.0, not 0.9")
            self.assertEqual(r1[9], "UNRESOLVED", "Migrated record must have location_method UNRESOLVED")

            # Check Record 2 (pre-existing coords)
            r2 = rows[1]
            self.assertEqual(r2[0], "EV-AUTO-LEG-02")
            self.assertEqual(r2[1], "Gabès")
            self.assertEqual(r2[2], 33.8815, "Existing coordinates preserved")
            self.assertEqual(r2[3], 10.0982, "Existing coordinates preserved")
            self.assertEqual(r2[4], "UNRESOLVED", "Migrated record defaults to UNRESOLVED until explicit enrichment")
            self.assertEqual(r2[8], 0.0, "Migrated record defaults to 0.0 confidence until explicit enrichment")

            # 4. Run Migration 2 (Idempotency Proof)
            create_tables(conn)

            cursor.execute("SELECT id, location_scope, location_confidence FROM evidence ORDER BY id")
            rows_second = cursor.fetchall()
            self.assertEqual(rows_second[0][1], "UNRESOLVED")
            self.assertEqual(rows_second[0][2], 0.0)
            self.assertEqual(rows_second[1][1], "UNRESOLVED")
            self.assertEqual(rows_second[1][2], 0.0)

            conn.close()

        finally:
            if os.path.exists(old_db_path):
                try:
                    os.unlink(old_db_path)
                except OSError:
                    pass

    # -------------------------------------------------------------------------
    # PART 10: MAP HIERARCHICAL SCOPE INTEGRITY TEST
    # -------------------------------------------------------------------------
    def test_map_hierarchical_scopes_and_filtering(self):
        """
        Verify that:
        - national evidence -> national_summary (no map point)
        - unresolved evidence -> no map point
        - governorate evidence -> governorate aggregation
        - local evidence -> incident map
        - same event from 3 sources -> one cluster
        - electricity filter works using canonical 'electricity'
        """
        conn = sqlite3.connect(self.temp_db_path)
        conn.execute("""
            INSERT INTO evidence (
                id, issue, headline, summary, location, location_scope, governorate,
                delegation, locality, location_confidence, location_method, latitude,
                longitude, published_at, collected_at, last_checked, source_name,
                source_domain, source_type, source_url, event_date, classification,
                status, evidence_confidence
            ) VALUES
            -- National item (no coords)
            ('EV-AUTO-NAT-01', 'water', 'Bilan national barrages', 'Desc', 'Tunisia', 'NATIONAL', NULL, NULL, NULL, 0.90, 'NATIONAL_CONTEXT', NULL, NULL, '2026-08-01', '2026-08-01', '2026-08-01', 'ONAGRI', 'onagri.tn', 'official', 'https://onagri.tn/1', '2026-08-01', 'FACT', 'VERIFIED', 0.9),
            -- Unresolved item (no coords)
            ('EV-AUTO-UNR-01', 'electricity', 'Generic electricity maintenance note', 'Desc', 'Tunisia', 'UNRESOLVED', NULL, NULL, NULL, 0.0, 'UNRESOLVED', NULL, NULL, '2026-08-01', '2026-08-01', '2026-08-01', 'STEG', 'steg.tn', 'official', 'https://steg.tn/1', '2026-08-01', 'FACT', 'VERIFIED', 0.9),
            -- Governorate item (centroid coords)
            ('EV-AUTO-GOV-01', 'electricity', 'Panne electrique a Kasserine ville', 'Desc', 'Kasserine', 'GOVERNORATE', 'Kasserine', NULL, NULL, 0.90, 'GOVERNORATE_MATCH', 35.1676, 8.8365, '2026-08-02', '2026-08-02', '2026-08-02', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/k1', '2026-08-02', 'FACT', 'VERIFIED', 0.9),
            -- Local item in Zarzis (delegation coords)
            ('EV-AUTO-LOC-01', 'migration', 'Sauvetage de migrants a Zarzis', 'Desc', 'Zarzis, Médenine', 'LOCAL', 'Médenine', 'Zarzis', NULL, 0.95, 'EXPLICIT_LOCALITY', 33.5040, 11.1122, '2026-08-03', '2026-08-03', '2026-08-03', 'FTDES', 'ftdes.net', 'ngo', 'https://ftdes.net/z1', '2026-08-03', 'FACT', 'VERIFIED', 0.9),
            -- 3 sources covering the same water cut in Gafsa Metlaoui
            ('EV-AUTO-CLUS-01', 'water', 'Metlaoui: Coupure eau potable', 'Desc', 'Metlaoui, Gafsa', 'LOCAL', 'Gafsa', 'Metlaoui', NULL, 0.95, 'EXPLICIT_LOCALITY', 34.3300, 8.4000, '2026-08-04', '2026-08-04', '2026-08-04', 'TAP', 'tap.info.tn', 'news_agency', 'https://tap.info.tn/m1', '2026-08-04', 'FACT', 'VERIFIED', 0.9),
            ('EV-AUTO-CLUS-02', 'water', 'Protestations a Metlaoui coupure eau', 'Desc', 'Metlaoui, Gafsa', 'LOCAL', 'Gafsa', 'Metlaoui', NULL, 0.95, 'EXPLICIT_LOCALITY', 34.3300, 8.4000, '2026-08-04', '2026-08-04', '2026-08-04', 'Nawaat', 'nawaat.org', 'independent', 'https://nawaat.org/m2', '2026-08-04', 'FACT', 'VERIFIED', 0.85),
            ('EV-AUTO-CLUS-03', 'water', 'Alerte soif a Metlaoui', 'Desc', 'Metlaoui, Gafsa', 'LOCAL', 'Gafsa', 'Metlaoui', NULL, 0.95, 'EXPLICIT_LOCALITY', 34.3300, 8.4000, '2026-08-05', '2026-08-05', '2026-08-05', 'FTDES', 'ftdes.net', 'ngo', 'https://ftdes.net/m3', '2026-08-05', 'FACT', 'VERIFIED', 0.9)
        """)
        conn.commit()
        conn.close()

        with patch("monitor.app.database.DB_PATH", self.temp_db_path):
            client = TestClient(app)

            # Query incidents mode
            res = client.get("/api/map?mode=incidents")
            self.assertEqual(res.status_code, 200)
            data = res.json()

            # 1. National evidence in national_summary
            self.assertEqual(data["national_summary"]["total_national_records"], 2, "National and unresolved items aggregated in national_summary")

            # 2. Unresolved evidence has no map point, total features = 3 clusters (Kasserine, Zarzis, Metlaoui)
            features = data["features"]
            self.assertEqual(len(features), 3, "Only geocoded regional/local events appear in features")

            # 3. Governorate evidence aggregation (Kasserine electricity count = 1)
            kas_gov = next(g for g in data["governorates"] if g["slug"] == "kasserine")
            self.assertEqual(kas_gov["electricity_count"], 1)
            self.assertEqual(kas_gov["evidence_records"], 1)

            # 4. Local evidence appears with delegation metadata
            zarzis_feat = next(f for f in features if f["properties"]["governorate"] == "Médenine")
            self.assertEqual(zarzis_feat["properties"]["delegation"], "Zarzis")

            # 5. Same event from 3 sources in Metlaoui clustered into 1 cluster
            metlaoui_feat = next(f for f in features if f["properties"]["governorate"] == "Gafsa")
            self.assertEqual(metlaoui_feat["properties"]["evidence_count"], 3)
            self.assertEqual(metlaoui_feat["properties"]["source_count"], 3)
            self.assertEqual(len(metlaoui_feat["properties"]["sources"]), 3)

            # 6. Canonical electricity filter
            res_elec = client.get("/api/map?issue=electricity")
            self.assertEqual(res_elec.status_code, 200)
            data_elec = res_elec.json()
            self.assertEqual(len(data_elec["features"]), 1, "Only Kasserine electricity feature returned")
            self.assertEqual(data_elec["features"][0]["properties"]["governorate"], "Kasserine")


if __name__ == "__main__":
    unittest.main()

