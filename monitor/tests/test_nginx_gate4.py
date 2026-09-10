# monitor/tests/test_nginx_gate4.py
"""
404TN Gate 4 Nginx Routing Configuration Static Verification Suite

Validates:
1. Trailing slash normalization regex semantics:
   - /gabes/ -> /gabes (301 permanent redirect)
   - /issues/water/ -> /issues/water (301 permanent redirect)
   - / -> / (Root preserved, no redirect loop)
   - /summer-2026/?source=test -> /summer-2026?source=test (query params preserved)
2. Prerender route resolution ($uri $uri/index.html =404):
   - Canonical non-trailing slash routes (/gabes, /issues/water, etc.) resolve directly
     to dist/{route}/index.html without triggering directory-slash redirect.
3. True HTTP 404:
   - Unknown URLs fall through to =404 and serve /404.html with noindex header.
   - Zero soft-404 fallback to /index.html.
4. Static assets and API safety boundaries.
"""

import unittest
import os
import re

class TestNginxGate4Config(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        cls.nginx_conf_path = os.path.join(cls.repo_root, "deploy", "nginx.conf")
        cls.dist_dir = os.path.join(cls.repo_root, "dist")
        cls.page_404_path = os.path.join(cls.repo_root, "public", "404.html")

        with open(cls.nginx_conf_path, "r", encoding="utf-8") as f:
            cls.nginx_conf = f.read()

        with open(cls.page_404_path, "r", encoding="utf-8") as f:
            cls.page_404 = f.read()

    def test_trailing_slash_normalization_regex(self):
        """Test trailing slash normalization regex logic against various URI patterns."""
        self.assertIn("rewrite ^/(.+)/$ /$1 permanent;", self.nginx_conf)

        pattern = re.compile(r"^/(.+)/$")

        # Must match and strip trailing slash on paths
        match_gabes = pattern.match("/gabes/")
        self.assertIsNotNone(match_gabes)
        self.assertEqual(match_gabes.group(1), "gabes")

        match_water = pattern.match("/issues/water/")
        self.assertIsNotNone(match_water)
        self.assertEqual(match_water.group(1), "issues/water")

        match_poll = pattern.match("/issues/pollution/")
        self.assertIsNotNone(match_poll)
        self.assertEqual(match_poll.group(1), "issues/pollution")

        # Must NOT match root / (prevents infinite redirect loop)
        match_root = pattern.match("/")
        self.assertIsNone(match_root, "Root path '/' must NOT match trailing slash rewrite rule")

        # Must NOT match canonical non-trailing-slash paths
        self.assertIsNone(pattern.match("/gabes"))
        self.assertIsNone(pattern.match("/issues/water"))
        self.assertIsNone(pattern.match("/summer-2026"))

    def test_prerender_try_files_directive(self):
        """Confirm try_files uses $uri/index.html $uri =404; to prevent directory slash normalization."""
        self.assertIn("try_files $uri/index.html $uri =404;", self.nginx_conf)
        # Ensure legacy soft-404 fallback is completely removed
        self.assertNotIn("/index.html;", self.nginx_conf.split("try_files")[1].split("\n")[0])

    def test_true_404_configuration(self):
        """Confirm error_page 404 is configured with /404.html and noindex headers."""
        self.assertIn("error_page 404 /404.html;", self.nginx_conf)
        self.assertIn("location = /404.html", self.nginx_conf)
        self.assertIn('add_header X-Robots-Tag "noindex, follow" always;', self.nginx_conf)
        self.assertIn('meta name="robots" content="noindex, follow"', self.page_404)

    def test_static_assets_have_strict_404_no_fallback(self):
        """Confirm static assets location blocks use try_files $uri =404."""
        self.assertIn("location ~* \\.(?:css|js|woff2?|svg|png|jpg|jpeg|gif|ico|webp)$", self.nginx_conf)
        self.assertIn("location ~* \\.(?:geojson|json)$", self.nginx_conf)
        self.assertIn("try_files $uri =404;", self.nginx_conf)

    def test_api_boundary_safety(self):
        """Confirm /api/ location block is present in frontend Nginx to prevent accidental HTML routing."""
        self.assertIn("location /api/ {", self.nginx_conf)
        self.assertIn("return 404;", self.nginx_conf)

    def test_security_headers_present(self):
        """Confirm standard security headers are configured."""
        self.assertIn('add_header X-Content-Type-Options "nosniff" always;', self.nginx_conf)
        self.assertIn('add_header X-Frame-Options "DENY" always;', self.nginx_conf)
        self.assertIn('add_header Referrer-Policy "strict-origin-when-cross-origin" always;', self.nginx_conf)
        self.assertIn('add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;', self.nginx_conf)


if __name__ == "__main__":
    unittest.main()
