# monitor/tests/test_frontend_routing.py
"""
404TN Frontend Phase 1 Routing Tests

Verifies:
1. Static HTML link audit (no invalid page-level hash links in index.html).
2. Clean route resolution and mappings for all target routes and issue routes.
3. Legacy hash redirect compatibility mappings without redirect loops.
4. Valid subsection anchor preservation (e.g. #main-content, #anchor).
5. 404 view existence and minimal design conformance.
6. Nginx SPA fallback configuration integrity.
"""

import unittest
import os
import re
import json

class TestFrontendRouting(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        cls.index_html_path = os.path.join(cls.repo_root, "index.html")
        cls.router_js_path = os.path.join(cls.repo_root, "src", "router.js")
        cls.nginx_conf_path = os.path.join(cls.repo_root, "deploy", "nginx.conf")
        cls.page_404_path = os.path.join(cls.repo_root, "404.html")

        with open(cls.index_html_path, "r", encoding="utf-8") as f:
            cls.index_html = f.read()

        with open(cls.router_js_path, "r", encoding="utf-8") as f:
            cls.router_js = f.read()

        with open(cls.nginx_conf_path, "r", encoding="utf-8") as f:
            cls.nginx_conf = f.read()

    def test_required_clean_routes_in_router(self):
        """Confirm all required primary clean routes exist in router.js."""
        required_routes = [
            "/",
            "/summer-2026",
            "/the-files",
            "/geospatial-monitor",
            "/gabes",
            "/state-response",
            "/presidency",
            "/timeline",
            "/evidence",
            "/methodology",
            "/statement",
            "/issues/water",
            "/issues/electricity",
            "/issues/work",
            "/issues/migration",
            "/issues/public-services",
            "/issues/rights",
            "/issues/pollution"
        ]
        for route in required_routes:
            self.assertIn(f"'{route}'", self.router_js, f"Route {route} must be defined in router.js")

    def test_legacy_hash_redirect_mappings(self):
        """Confirm all legacy page-level hashes are mapped to clean routes."""
        legacy_hashes = [
            "#hero",
            "#summer-2026",
            "#the-files",
            "#geospatial-monitor",
            "#gabes",
            "#state-response",
            "#presidency",
            "#timeline",
            "#evidence",
            "#methodology",
            "#statement"
        ]
        for h in legacy_hashes:
            self.assertIn(f"'{h}'", self.router_js, f"Legacy hash {h} must be mapped in router.js")

    def test_no_invalid_page_level_hash_links_in_index_html(self):
        """Audit index.html to ensure zero page-level hash links remain in href attributes."""
        # Find all href attributes
        href_pattern = re.compile(r'href=["\']([^"\']+)["\']')
        matches = href_pattern.findall(self.index_html)

        invalid_hashes = [
            "#hero",
            "#summer-2026",
            "#the-files",
            "#geospatial-monitor",
            "#gabes",
            "#state-response",
            "#presidency",
            "#timeline",
            "#evidence",
            "#methodology",
            "#statement"
        ]

        found_invalid = []
        for href in matches:
            if href in invalid_hashes:
                found_invalid.append(href)

        self.assertEqual(len(found_invalid), 0, f"Found invalid page-level hash links in index.html: {found_invalid}")

    def test_valid_remaining_hashes_in_index_html(self):
        """Verify any remaining hash links in index.html are legitimate subsection or accessibility anchors."""
        href_pattern = re.compile(r'href=["\'](#[^"\']*)["\']')
        hash_matches = href_pattern.findall(self.index_html)

        # Permitted hash links:
        # '#main-content' (accessibility skip-to-content anchor)
        # '#' (runtime dynamic source URL placeholder in modal/drawer)
        for h in hash_matches:
            self.assertIn(h, ["#main-content", "#"], f"Unexpected hash link found: {h}")

    def test_desktop_and_mobile_nav_have_clean_routes(self):
        """Ensure desktop and mobile navigation elements use clean route URLs."""
        clean_nav_targets = [
            '/summer-2026',
            '/the-files',
            '/geospatial-monitor',
            '/gabes',
            '/state-response',
            '/presidency',
            '/timeline',
            '/methodology'
        ]
        for target in clean_nav_targets:
            self.assertIn(f'href="{target}"', self.index_html, f"Nav link to {target} missing in index.html")

    def test_not_found_view_exists_in_index_html(self):
        """Confirm minimal #not-found-view exists in index.html with return link to /."""
        self.assertIn('id="not-found-view"', self.index_html)
        self.assertIn('HTTP 404 — RECORD UNAVAILABLE', self.index_html)
        self.assertIn('id="content-views"', self.index_html)

    def test_standalone_404_html_returns_to_root(self):
        """Confirm 404.html return button links to / rather than /en/."""
        with open(self.page_404_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn('href="/"', content)
        self.assertNotIn('href="/en/"', content)

    def test_nginx_gate4_prerender_routing(self):
        """Confirm Nginx configuration contains Gate 4 true-404 and prerender route serving."""
        self.assertIn("try_files $uri/index.html $uri =404;", self.nginx_conf)
        self.assertIn("rewrite ^/(.+)/$ /$1 permanent;", self.nginx_conf)
        self.assertIn("error_page 404 /404.html;", self.nginx_conf)
        self.assertIn('location /api/ {', self.nginx_conf)
        self.assertNotIn("try_files $uri $uri/ /index.html;", self.nginx_conf)


if __name__ == "__main__":
    unittest.main()
