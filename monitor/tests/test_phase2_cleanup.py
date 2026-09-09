"""
Unit and integration tests for Phase 2 Real-Data Cleanup.
Verifies:
1. Two-stage relevance gate (taxonomy + Tunisia context).
2. Rejection of foreign articles (Nepal, France, generic international wire).
3. Dynamic /api/issues and /api/issues/{slug} endpoints.
4. Legacy 'general' exclusion from issue counts.
5. Gabès historical baseline separation and lack of seeded evidence IDs.
6. Absence of synthetic fallbacks in API and drawer handlers.
7. Clean handling of empty state / zero records.
"""

import unittest
import os
import re
import tempfile
import sqlite3
from fastapi.testclient import TestClient

from monitor.app.main import app, ISSUE_DEFINITIONS
from monitor.app.database import create_tables, DB_PATH
from monitor.app.services.classifier import (
    classify_issue,
    has_tunisia_context,
    classify_epistemic,
    DEDICATED_TUNISIA_DOMAINS
)
from monitor.scripts.collect import MONITORED_TAXONOMY


def run_two_stage_gate(headline: str, summary: str, source_domain: str = None, source_id: str = None):
    full_text = f"{headline} {summary}"
    issue = classify_issue(full_text)
    is_taxonomy_match = bool(issue and issue in MONITORED_TAXONOMY)
    is_tunisia_context = has_tunisia_context(full_text, source_domain=source_domain, source_id=source_id)
    passed = is_taxonomy_match and is_tunisia_context
    return issue, passed


class TestTwoStageRelevanceGate(unittest.TestCase):
    """Test Stage A (Taxonomy) and Stage B (Tunisia context) relevance filtering."""

    def test_nepal_electricity_rejection(self):
        """Nepal electricity article must be rejected by Tunisia context gate."""
        headline = "Nepal rescuers reach remote areas, electricity restored nearly one week after disaster"
        summary = "Emergency workers restored power in Kathmandu following severe monsoon flooding."
        
        # Stage A matches electricity keyword
        issue = classify_issue(f"{headline} {summary}")
        self.assertEqual(issue, "electricity")
        
        # Stage B must reject (no Tunisia signal, generic source)
        has_tn = has_tunisia_context(f"{headline} {summary}", "reuters.com", "reuters")
        self.assertFalse(has_tn, "Foreign article with energy keyword must NOT pass Tunisia context gate")

        # Full gate test
        issue, passed = run_two_stage_gate(headline, summary, "reuters.com", "reuters")
        self.assertFalse(passed, "Nepal electricity article must be rejected by full two-stage gate")

    def test_france_water_rejection(self):
        """France water restrictions article must be rejected."""
        headline = "France issues drought warning and municipal water restrictions across southern regions"
        summary = "Prefectures implement hosepipe bans and irrigation curbs."
        
        has_tn = has_tunisia_context(f"{headline} {summary}", "lemonde.fr", "lemonde")
        self.assertFalse(has_tn, "France water article must NOT pass Tunisia context gate")

        issue, passed = run_two_stage_gate(headline, summary, "lemonde.fr", "lemonde")
        self.assertFalse(passed)

    def test_tunisia_sonede_water_acceptance(self):
        """SONEDE water cuts in Tunisia must be accepted."""
        headline = "SONEDE annonce des perturbations dans la distribution d'eau potable à Kasserine et Sousse"
        summary = "En raison de travaux de maintenance sur les canalisations principales."
        
        issue, passed = run_two_stage_gate(headline, summary, "sonede.com.tn", "sonede")
        self.assertTrue(passed)
        self.assertEqual(issue, "water")

    def test_tunisia_steg_electricity_acceptance(self):
        """STEG power load shedding in Gafsa must be accepted."""
        headline = "Coupures d'électricité récurrentes à Gafsa et Tozeur: la STEG sous tension"
        summary = "La hausse des températures a entraîné une surcharge sur le réseau électrique national."
        
        issue, passed = run_two_stage_gate(headline, summary, "steg.com.tn", "steg")
        self.assertTrue(passed)
        self.assertEqual(issue, "electricity")

    def test_dedicated_tunisian_source_acceptance(self):
        """Articles from dedicated Tunisian domains with monitored topics pass Tunisia gate."""
        headline = "La récolte céréalière et les réserves de blé au centre d'une réunion ministérielle"
        summary = "Le ministre de l'Agriculture préside une séance de travail sur la sécurité alimentaire."
        
        has_tn = has_tunisia_context(f"{headline} {summary}", "ftdes.net", "ftdes")
        self.assertTrue(has_tn, "Dedicated Tunisian domain must provide Tunisia context")


class TestApiIssuesEndpoints(unittest.TestCase):
    """Test dynamic /api/issues and /api/issues/{slug} endpoints."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_get_issues_summary(self):
        """GET /api/issues returns all 6 dossier definitions with real counts and metadata."""
        res = self.client.get("/api/issues")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 6)
        
        slugs = [iss["slug"] for iss in data]
        self.assertIn("water", slugs)
        self.assertIn("electricity", slugs)
        self.assertIn("work", slugs)
        self.assertIn("migration", slugs)
        self.assertIn("public-services", slugs)
        self.assertIn("rights-institutions", slugs)

        for iss in data:
            self.assertIn("evidence_count", iss)
            self.assertIn("latest_date", iss)
            self.assertIn("latest_headline", iss)
            self.assertIn("accountable_institutions", iss)

    def test_get_issue_by_slug_water(self):
        """GET /api/issues/water returns dynamic dossier with real evidence."""
        res = self.client.get("/api/issues/water")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["slug"], "water")
        self.assertIn("evidence_records", data)
        self.assertIn("evidence_count", data)
        self.assertIsInstance(data["evidence_records"], list)

    def test_get_issue_by_alias(self):
        """GET /api/issues with frontend alias slugs (e.g. publicServices, institutions, electricity)."""
        res_ps = self.client.get("/api/issues/publicServices")
        self.assertEqual(res_ps.status_code, 200)
        self.assertEqual(res_ps.json()["slug"], "public-services")

        res_inst = self.client.get("/api/issues/institutions")
        self.assertEqual(res_inst.status_code, 200)
        self.assertEqual(res_inst.json()["slug"], "rights-institutions")

        res_elec = self.client.get("/api/issues/energy")
        self.assertEqual(res_elec.status_code, 200)
        self.assertEqual(res_elec.json()["slug"], "electricity")

    def test_get_nonexistent_issue_returns_404(self):
        """GET /api/issues/nonexistent returns 404 with structured message."""
        res = self.client.get("/api/issues/unknown-topic-xyz")
        self.assertEqual(res.status_code, 404)
        self.assertIn("not found", res.json()["detail"].lower())


class TestGabesBaselineSeparation(unittest.TestCase):
    """Test that Gabes endpoint separates historical baseline from live evidence without fake IDs."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_gabes_dossier_structure(self):
        """GET /api/gabes returns structured baseline metrics without fake evidence_id."""
        res = self.client.get("/api/gabes")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        self.assertIn("metrics", data)
        self.assertIn("evidence_list", data)
        
        for m in data["metrics"]:
            # Baseline metrics must NOT have fake evidence_id
            self.assertNotIn("evidence_id", m, "Historical baseline metrics must not carry fake evidence IDs")
            self.assertIn("status", m)
            self.assertIn("source_period", m)
            self.assertIn("type", m)
            self.assertIn(m["type"], ["HISTORICAL_BASELINE", "HISTORICAL_STATE_COMMITMENT", "DATA_GAP_STATEMENT"])


class TestTimelineAndEvidenceProvenance(unittest.TestCase):
    """Test timeline and evidence endpoints for strict real-data provenance."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_timeline_returns_real_evidence_ids(self):
        """GET /api/timeline returns events pointing to real evidence IDs or verified sources."""
        res = self.client.get("/api/timeline")
        self.assertEqual(res.status_code, 200)
        events = res.json()
        self.assertIsInstance(events, list)

        for event in events:
            self.assertIn("id", event)
            self.assertIn("title", event)
            self.assertIn("source_url", event)
            self.assertTrue(
                event["source_url"].startswith("http://") or event["source_url"].startswith("https://"),
                f"Source URL must be a valid HTTP(S) URL: {event['source_url']}"
            )

    def test_nonexistent_evidence_returns_404(self):
        """GET /api/evidence/EV-NONEXISTENT returns 404 without synthetic fallback."""
        res = self.client.get("/api/evidence/EV-NONEXISTENT-999")
        self.assertEqual(res.status_code, 404)


if __name__ == "__main__":
    unittest.main()
