# monitor/tests/test_audit_export.py
import os
import json
import sqlite3
import tempfile
import unittest
import gc
from unittest.mock import patch, MagicMock

from monitor.app.database import init_db
from monitor.app.collectors.base import NormalizedCandidate, DiscoveryMetrics
from monitor.scripts.collect import run_collection, export_audit_json

class TestAuditExport(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "test_404tn.db")
        init_db(self.db_path)

        # Seed 1 initial evidence record in SQLite
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO evidence (
                id, issue, sub_issue, location, latitude, longitude, headline, summary, claim,
                classification, status, event_date, published_at, collected_at, last_checked,
                source_name, source_domain, source_type, source_url, source_language,
                source_confidence, evidence_confidence, current_or_historical, tags, content_hash
            ) VALUES (
                'EV-AUTO-20260909-SEED01', 'water', 'scarcity', 'Tunis', 36.8065, 10.1815,
                'Coupure d''eau potable a Tunis', 'La SONEDE annonce une coupure', 'Coupure d''eau',
                'FACT', 'VERIFIED', '2026-09-09', '2026-09-09', '2026-09-09', '2026-09-09',
                'TAP FR', 'tap.info.tn', 'news_agency', 'https://www.tap.info.tn/fr/article-seed', 'fr',
                0.9, 0.9, 'CURRENT', '["water"]', 'seedhash123'
            )
        """)
        conn.commit()
        conn.close()

    def tearDown(self):
        gc.collect()
        try:
            self.temp_dir.cleanup()
        except Exception:
            pass

    def test_audit_json_requires_dry_run(self):
        """--audit-json without --dry-run must raise ValueError and not perform audit export."""
        audit_path = os.path.join(self.temp_dir.name, "audit.json")
        with self.assertRaises(ValueError) as ctx:
            run_collection(
                selected_sources=["tap_fr"],
                dry_run=False,
                no_store=True,
                audit_json=audit_path,
                db_path=self.db_path
            )
        self.assertIn("only valid in dry-run mode", str(ctx.exception))
        self.assertFalse(os.path.exists(audit_path))

    def test_existing_audit_file_refuses_overwrite_by_default(self):
        """Existing audit file must raise FileExistsError unless overwrite_audit=True."""
        audit_path = os.path.join(self.temp_dir.name, "existing_audit.json")
        with open(audit_path, "w", encoding="utf-8") as f:
            f.write("{}")

        with self.assertRaises(FileExistsError) as ctx:
            run_collection(
                selected_sources=["tap_fr"],
                dry_run=True,
                audit_json=audit_path,
                overwrite_audit=False,
                db_path=self.db_path
            )
        self.assertIn("already exists", str(ctx.exception))

    def test_overwrite_audit_allows_replacement(self):
        """--overwrite-audit must allow replacing existing audit file."""
        audit_path = os.path.join(self.temp_dir.name, "replace_audit.json")
        with open(audit_path, "w", encoding="utf-8") as f:
            f.write('{"old": true}')

        mock_collector = MagicMock()
        mock_collector.collect.return_value = ([], DiscoveryMetrics(source_id="tap_fr", http_status=200, items_discovered=0, items_fetched=0, items_parsed=0))

        with patch("monitor.scripts.collect.get_collector", return_value=mock_collector):
            res = run_collection(
                selected_sources=["tap_fr"],
                dry_run=True,
                audit_json=audit_path,
                overwrite_audit=True,
                db_path=self.db_path
            )

        self.assertTrue(os.path.exists(audit_path))
        with open(audit_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data["mode"], "DRY_RUN")
        self.assertNotIn("old", data)

    def test_audit_json_contains_all_required_candidate_and_run_fields(self):
        """Audit JSON must export full candidate taxonomy, quality, provenance, and geographic metadata."""
        audit_path = os.path.join(self.temp_dir.name, "candidate_audit.json")

        cand_accepted = NormalizedCandidate(
            source_name="Tunis Afrique Presse (FR)",
            source_domain="tap.info.tn",
            source_type="news_agency",
            headline="Coupure de l'eau potable a Sfax",
            summary="La SONEDE annonce une importante coupure d'eau potable dans le gouvernorat de Sfax suite a des travaux urgents sur le reseau principal.",
            body="Une perturbation et coupure dans la distribution de l'eau potable seront enregistrees a Sfax suite a des travaux de maintenance sur les canalisations.",
            url="https://www.tap.info.tn/fr/sfax-eau-2026",
            canonical_url="https://www.tap.info.tn/fr/sfax-eau-2026",
            published_at="2026-09-10T02:00:00Z",
            language="fr",
            raw_metadata={"extraction_method": "RSS_SUMMARY", "source_tier": "TIER_1"}
        )

        cand_rejected = NormalizedCandidate(
            source_name="Tunis Afrique Presse (FR)",
            source_domain="tap.info.tn",
            source_type="news_agency",
            headline="Football : match amical en Italie",
            summary="La selection dispute un match amical a Rome contre l'Italie.",
            body="Victoire 2-1 lors de la rencontre sportive internationale en Italie.",
            url="https://www.tap.info.tn/fr/sports-football-italie",
            canonical_url="https://www.tap.info.tn/fr/sports-football-italie",
            published_at="2026-09-10T02:05:00Z",
            language="fr",
            raw_metadata={"extraction_method": "RSS_SUMMARY"}
        )

        # LOW quality candidate (clean text < 60 chars) -> caps confidence at 0.45 -> REVIEW_REQUIRED
        cand_review = NormalizedCandidate(
            source_name="Tunis Afrique Presse (FR)",
            source_domain="tap.info.tn",
            source_type="news_agency",
            headline="Penurie de medicaments a l'hopital public de Tunis",
            summary="",
            body="",
            url="https://www.tap.info.tn/fr/hopital-tunis-court",
            canonical_url="https://www.tap.info.tn/fr/hopital-tunis-court",
            published_at="2026-09-10T02:10:00Z",
            language="fr",
            raw_metadata={"extraction_method": "RSS_SUMMARY"}
        )

        cand_inv = NormalizedCandidate(
            source_name="Tunis Afrique Presse (FR)",
            source_domain="tap.info.tn",
            source_type="news_agency",
            headline="Article invalide",
            summary="Invalid",
            body="Invalid",
            url="",
            canonical_url="",
            published_at="2026-09-10T02:15:00Z",
            language="fr",
            raw_metadata={"extraction_method": "RSS_SUMMARY"}
        )

        mock_collector = MagicMock()
        mock_collector.collect.return_value = (
            [cand_accepted, cand_rejected, cand_review, cand_inv],
            DiscoveryMetrics(source_id="tap_fr", http_status=200, items_discovered=4, items_fetched=4, items_parsed=4)
        )

        with patch("monitor.scripts.collect.get_collector", return_value=mock_collector):
            res = run_collection(
                selected_sources=["tap_fr"],
                dry_run=True,
                audit_json=audit_path,
                db_path=self.db_path
            )

        self.assertTrue(os.path.exists(audit_path))
        with open(audit_path, "r", encoding="utf-8") as f:
            audit = json.load(f)

        self.assertTrue(audit["run_id"].startswith("RUN-"))
        self.assertEqual(audit["mode"], "DRY_RUN")
        self.assertEqual(audit["status"], "COMPLETED")
        self.assertIn("started_at", audit)
        self.assertIn("completed_at", audit)
        self.assertEqual(audit["sources_attempted"], 1)
        self.assertEqual(audit["sources_successful"], 1)
        self.assertEqual(audit["sources_failed"], 0)
        self.assertEqual(audit["items_discovered"], 4)
        self.assertEqual(audit["items_fetched"], 4)
        self.assertEqual(audit["items_parsed"], 4)
        self.assertEqual(audit["items_accepted"], 1)
        self.assertEqual(audit["items_review_required"], 1)
        self.assertEqual(audit["items_rejected"], 2)

        self.assertEqual(len(audit["source_results"]), 1)
        src_res = audit["source_results"][0]
        self.assertEqual(src_res["source_id"], "tap_fr")
        self.assertEqual(src_res["status"], "PASS")
        self.assertEqual(src_res["http_status"], 200)

        candidates = audit["candidate_records"]
        self.assertEqual(len(candidates), 4)

        rec_acc = next(c for c in candidates if c["canonical_url"] == "https://www.tap.info.tn/fr/sfax-eau-2026")
        self.assertEqual(rec_acc["ingestion_decision"], "AUTO_ACCEPTED")
        self.assertEqual(rec_acc["primary_issue"], "water")
        self.assertEqual(rec_acc["location_scope"], "GOVERNORATE")
        self.assertEqual(rec_acc["governorate"], "Sfax")
        self.assertIsNotNone(rec_acc["latitude"])
        self.assertIsNotNone(rec_acc["longitude"])
        self.assertEqual(rec_acc["source_tier"], "TIER_1")
        self.assertEqual(rec_acc["content_quality"], "GOOD")
        self.assertFalse(rec_acc["is_duplicate"])

        rec_rej = next(c for c in candidates if c["canonical_url"] == "https://www.tap.info.tn/fr/sports-football-italie")
        self.assertEqual(rec_rej["ingestion_decision"], "REJECTED")
        self.assertIn("sports", rec_rej["decision_reason"])
        self.assertFalse(rec_rej["is_duplicate"])

        rec_rev = next(c for c in candidates if c["canonical_url"] == "https://www.tap.info.tn/fr/hopital-tunis-court")
        self.assertEqual(rec_rev["ingestion_decision"], "REVIEW_REQUIRED")
        self.assertEqual(rec_rev["content_quality"], "LOW")
        self.assertLessEqual(rec_rev["classification_confidence"], 0.45)
        self.assertIn(rec_rev["primary_issue"], ["health", "public_services"])

        rec_inv = next(c for c in candidates if not c["canonical_url"])
        self.assertEqual(rec_inv["ingestion_decision"], "REJECTED")
        self.assertIn("Invalid", rec_inv["decision_reason"])

    def test_audit_json_contains_duplicate_candidate_metadata(self):
        """Audit JSON must record duplicate candidate records when duplicate is detected."""
        audit_path = os.path.join(self.temp_dir.name, "dup_audit.json")

        cand_dup = NormalizedCandidate(
            source_name="Tunis Afrique Presse (FR)",
            source_domain="tap.info.tn",
            source_type="news_agency",
            headline="Coupure d'eau potable a Tunis",
            summary="La SONEDE annonce une coupure",
            body="Coupure d'eau",
            url="https://www.tap.info.tn/fr/article-seed",
            canonical_url="https://www.tap.info.tn/fr/article-seed",
            published_at="2026-09-09T10:00:00Z",
            language="fr",
            raw_metadata={"extraction_method": "RSS_SUMMARY"}
        )

        mock_collector = MagicMock()
        mock_collector.collect.return_value = (
            [cand_dup],
            DiscoveryMetrics(source_id="tap_fr", http_status=200, items_discovered=1, items_fetched=1, items_parsed=1)
        )

        with patch("monitor.scripts.collect.get_collector", return_value=mock_collector):
            res = run_collection(
                selected_sources=["tap_fr"],
                dry_run=True,
                audit_json=audit_path,
                db_path=self.db_path
            )

        with open(audit_path, "r", encoding="utf-8") as f:
            audit = json.load(f)

        self.assertEqual(audit["items_duplicate"], 1)
        self.assertEqual(audit["items_accepted"], 0)
        self.assertEqual(len(audit["candidate_records"]), 1)
        dup_rec = audit["candidate_records"][0]
        self.assertEqual(dup_rec["ingestion_decision"], "DUPLICATE")
        self.assertTrue(dup_rec["is_duplicate"])
        self.assertEqual(dup_rec["duplicate_layer"], "LAYER_1_CANONICAL_URL_MATCH")
        self.assertEqual(dup_rec["duplicate_of"], "EV-AUTO-20260909-SEED01")
        self.assertEqual(dup_rec["decision_reason"], "Duplicate candidate detected (LAYER_1_CANONICAL_URL_MATCH)")
        # Verify honesty of unevaluated fields on duplicates
        self.assertIsNone(dup_rec["boilerplate_ratio"])
        self.assertIsNone(dup_rec["content_quality"])
        self.assertIsNone(dup_rec["secondary_issues"])
        self.assertIsNone(dup_rec["topics"])
        self.assertIsNone(dup_rec["entities"])
        self.assertIsNone(dup_rec["classification_confidence"])
        self.assertIsNone(dup_rec["location_scope"])

    def test_zero_sqlite_mutations_and_binary_hash_identity(self):
        """Dry-run collection with audit export must perform ZERO SQLite mutations, preserving binary hash."""
        import hashlib
        audit_path = os.path.join(self.temp_dir.name, "zero_mutation_audit.json")

        # Insert a pre-existing source record to test mutable table preservation
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO sources (id, name, source_type, domain, is_active) VALUES ('tap_fr', 'TAP FR', 'news_agency', 'tap.info.tn', 1)")
        conn.commit()
        conn.close()

        with open(self.db_path, "rb") as f:
            db_bytes_before = f.read()
        sha_before = hashlib.sha256(db_bytes_before).hexdigest()

        cand_sample = NormalizedCandidate(
            source_name="Tunis Afrique Presse (FR)",
            source_domain="tap.info.tn",
            source_type="news_agency",
            headline="Perturbation de distribution d'eau a Bizerte",
            summary="Coupure d'eau potable a Bizerte pour reparations.",
            body="La SONEDE informe les habitants de Bizerte d'une coupure temporaire.",
            url="https://www.tap.info.tn/fr/bizerte-eau",
            canonical_url="https://www.tap.info.tn/fr/bizerte-eau",
            published_at="2026-09-10T02:30:00Z",
            language="fr",
            raw_metadata={"extraction_method": "RSS_SUMMARY"}
        )
        mock_collector = MagicMock()
        mock_collector.collect.return_value = ([cand_sample], DiscoveryMetrics(source_id="tap_fr", http_status=200, items_discovered=1, items_fetched=1, items_parsed=1))

        with patch("monitor.scripts.collect.get_collector", return_value=mock_collector):
            res = run_collection(
                selected_sources=["tap_fr"],
                dry_run=True,
                audit_json=audit_path,
                db_path=self.db_path
            )

        with open(self.db_path, "rb") as f:
            db_bytes_after = f.read()
        sha_after = hashlib.sha256(db_bytes_after).hexdigest()

        self.assertEqual(sha_after, sha_before, "Database binary SHA256 must remain 100% identical after dry-run")
        self.assertEqual(res["database_writes"], 0)
        self.assertTrue(os.path.exists(audit_path))

    def test_export_audit_json_atomic_write(self):
        """export_audit_json must write via temp file and atomically replace target."""
        audit_path = os.path.join(self.temp_dir.name, "sub_dir", "atomic_test.json")
        data = {"test_key": "test_value", "number": 42}

        exported = export_audit_json(data, audit_path, overwrite=False)
        self.assertEqual(exported, os.path.abspath(audit_path))
        self.assertTrue(os.path.exists(audit_path))

        with open(audit_path, "r", encoding="utf-8") as f:
            loaded = json.load(f)
        self.assertEqual(loaded, data)

if __name__ == "__main__":
    unittest.main()
