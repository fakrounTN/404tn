# monitor/tests/test_seo_prerender.py
"""
404TN SEO Implementation Phase 1 Tests (Gates 2 & 3 Final)

Verifies:
1. SEO Registry integrity in src/seo-registry.js (18 canonical routes, 2 aliases, total 20 routes).
2. /issues/pollution canonicality (canonical URL, indexable, links to /gabes).
3. /gabes canonicality (canonical URL, links to /issues/pollution).
4. Aliases configuration (/geospatial, /issues/rights-institutions with noindex,follow).
5. Single <h1> enforcement across templates and prerendered pages.
6. Structured data scope (only minimal global WebSite/NewsMediaOrganization, no deferred schemas).
7. Package build scripts integration.
8. If dist/ exists, verifies all prerendered HTML output files.
"""

import unittest
import os
import re
import json

class TestSeoPrerender(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        cls.registry_path = os.path.join(cls.repo_root, "src", "seo-registry.js")
        cls.prerender_script_path = os.path.join(cls.repo_root, "scripts", "prerender.mjs")
        cls.test_script_path = os.path.join(cls.repo_root, "scripts", "test-seo-output.mjs")
        cls.package_json_path = os.path.join(cls.repo_root, "package.json")
        cls.dist_dir = os.path.join(cls.repo_root, "dist")
        cls.index_html_path = os.path.join(cls.repo_root, "index.html")

        with open(cls.registry_path, "r", encoding="utf-8") as f:
            cls.registry_content = f.read()

        with open(cls.package_json_path, "r", encoding="utf-8") as f:
            cls.package_json = json.load(f)

        with open(cls.index_html_path, "r", encoding="utf-8") as f:
            cls.index_html = f.read()

    def test_registry_file_exists_and_has_canonical_origin(self):
        """Confirm src/seo-registry.js exists and defines canonical apex origin."""
        self.assertTrue(os.path.exists(self.registry_path))
        self.assertIn("https://404tn.com", self.registry_content)
        self.assertNotIn("localhost", self.registry_content)
        self.assertNotIn("404tn.com/en/", self.registry_content)

    def test_route_inventory_18_canonical_and_2_aliases(self):
        """Confirm exactly 18 canonical routes and 2 aliases exist in SEO registry."""
        canonical_routes = [
            "/",
            "/summer-2026",
            "/the-files",
            "/gabes",
            "/timeline",
            "/state-response",
            "/evidence",
            "/methodology",
            "/geospatial-monitor",
            "/presidency",
            "/statement",
            "/issues/water",
            "/issues/electricity",
            "/issues/pollution",
            "/issues/work",
            "/issues/migration",
            "/issues/public-services",
            "/issues/rights"
        ]
        alias_routes = [
            "/geospatial",
            "/issues/rights-institutions"
        ]

        for route in canonical_routes:
            self.assertIn(f"'{route}': {{", self.registry_content, f"Canonical route {route} must be defined")
        for route in alias_routes:
            self.assertIn(f"'{route}': {{", self.registry_content, f"Alias route {route} must be defined")

        # Ensure no other routes are defined
        defined_routes = re.findall(r"'(/[^']*)':\s*\{", self.registry_content)
        self.assertEqual(len(defined_routes), 20, f"Expected exactly 20 routes, found {len(defined_routes)}: {defined_routes}")

    def test_issues_pollution_is_canonical(self):
        """Confirm /issues/pollution is canonical, indexable, and links to /gabes."""
        self.assertIn("canonical: 'https://404tn.com/issues/pollution'", self.registry_content)
        poll_match = re.search(r"'/issues/pollution':\s*\{([\s\S]*?)(?=\n\s*'/[a-z]|\n\};)", self.registry_content)
        self.assertIsNotNone(poll_match)
        block = poll_match.group(1)
        self.assertIn("isAlias: false", block)
        self.assertIn("robots: 'index, follow'", block)
        self.assertIn("href: '/gabes'", block)

    def test_gabes_is_canonical_and_links_to_pollution(self):
        """Confirm /gabes is canonical, indexable, and links to /issues/pollution."""
        gabes_match = re.search(r"'/gabes':\s*\{([\s\S]*?)(?=\n\s*'/[a-z]|\n\};)", self.registry_content)
        self.assertIsNotNone(gabes_match)
        block = gabes_match.group(1)
        self.assertIn("canonical: 'https://404tn.com/gabes'", block)
        self.assertIn("isAlias: false", block)
        self.assertIn("href: '/issues/pollution'", block)

    def test_alias_routes_have_noindex(self):
        """Ensure all alias routes have noindex specified in robots."""
        aliases = ["/geospatial", "/issues/rights-institutions"]
        for alias in aliases:
            alias_pattern = re.compile(rf"'{re.escape(alias)}':\s*\{{([\s\S]*?)(?=\n\s*'/[a-z]|\n\}};\s*)", re.DOTALL)
            match = alias_pattern.search(self.registry_content)
            self.assertIsNotNone(match, f"Alias {alias} block not found")
            block = match.group(1)
            self.assertIn("noindex", block, f"Alias {alias} must include noindex")
            self.assertIn("isAlias: true", block)

    def test_package_json_build_script(self):
        """Confirm package.json build script executes prerender.mjs."""
        scripts = self.package_json.get("scripts", {})
        self.assertIn("node scripts/prerender.mjs", scripts.get("build", ""))
        self.assertIn("test:seo", scripts)

    def test_raw_index_html_has_single_h1(self):
        """Ensure base index.html has exactly one <h1> tag."""
        h1_matches = re.findall(r"<h1(?:\s+[^>]*)?>.*?</h1>", self.index_html, re.DOTALL | re.IGNORECASE)
        self.assertEqual(len(h1_matches), 1, f"Raw index.html must have strictly 1 h1 tag, found: {len(h1_matches)}")

    def test_prerender_script_exists(self):
        """Confirm scripts/prerender.mjs and scripts/test-seo-output.mjs exist."""
        self.assertTrue(os.path.exists(self.prerender_script_path))
        self.assertTrue(os.path.exists(self.test_script_path))

    def test_prerendered_dist_files_if_built(self):
        """If dist/ directory exists, verify all 20 route files have single <h1>, minimal JSON-LD, and correct tags."""
        if not os.path.exists(self.dist_dir):
            self.skipTest("dist/ directory not yet generated; skipping dist output assertions.")

        expected_routes = [
            "/",
            "/summer-2026",
            "/the-files",
            "/gabes",
            "/timeline",
            "/state-response",
            "/evidence",
            "/methodology",
            "/geospatial-monitor",
            "/presidency",
            "/statement",
            "/issues/water",
            "/issues/electricity",
            "/issues/pollution",
            "/issues/work",
            "/issues/migration",
            "/issues/public-services",
            "/issues/rights",
            "/geospatial",
            "/issues/rights-institutions"
        ]

        for route in expected_routes:
            if route == "/":
                fpath = os.path.join(self.dist_dir, "index.html")
            else:
                fpath = os.path.join(self.dist_dir, route.lstrip("/"), "index.html")

            self.assertTrue(os.path.exists(fpath), f"Prerendered file missing for route {route}: {fpath}")
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            self.assertGreater(len(content), 5000, f"File {fpath} too small")
            h1_matches = re.findall(r"<h1(?:\s+[^>]*)?>.*?</h1>", content, re.DOTALL | re.IGNORECASE)
            self.assertEqual(len(h1_matches), 1, f"Prerendered {route} must have strictly 1 h1 tag, found: {len(h1_matches)}")
            self.assertIn('rel="canonical"', content)
            self.assertIn('name="robots"', content)
            self.assertNotIn("localhost", content)
            self.assertNotIn("404tn.com/en/", content)

            # Assert Phase-1 minimal JSON-LD (no deferred schema types)
            json_ld_matches = re.findall(r'<script\s+type="application/ld\+json">(.*?)</script>', content, re.DOTALL)
            self.assertTrue(len(json_ld_matches) > 0, f"JSON-LD missing in {fpath}")
            parsed_json_ld = json.loads(json_ld_matches[0])
            graph_types = [node.get("@type") for node in parsed_json_ld.get("@graph", [])]
            for deferred_type in ["Report", "Dataset", "CollectionPage", "Article", "BreadcrumbList"]:
                self.assertNotIn(deferred_type, graph_types, f"Deferred type {deferred_type} should not appear in Phase 1 JSON-LD")


if __name__ == "__main__":
    unittest.main()
