// scripts/test-seo-output.mjs
// Authoritative automated verification suite for 404TN Prerendered HTML Outputs (Gate 3 Final)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_REGISTRY, CANONICAL_ORIGIN } from '../src/seo-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✕ FAIL: ${message}`);
    failedTests++;
    return false;
  } else {
    passedTests++;
    return true;
  }
}

function unescapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function runTests() {
  console.log(`\n============================================================`);
  console.log(`RUNNING SEO OUTPUT VALIDATION TEST SUITE (PHASE 1 FINAL)`);
  console.log(`============================================================\n`);

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`Dist directory not found: ${DIST_DIR}. Please run "npm run build" first.`);
    process.exit(1);
  }

  const routes = Object.keys(SEO_REGISTRY);
  const canonicalRoutes = routes.filter(r => !SEO_REGISTRY[r].isAlias);
  const aliasRoutes = routes.filter(r => SEO_REGISTRY[r].isAlias);

  // C. Route inventory checks
  assert(routes.length === 20, `Total registry entries = 20 (found ${routes.length})`);
  assert(canonicalRoutes.length === 18, `Exactly 18 canonical routes (found ${canonicalRoutes.length})`);
  assert(aliasRoutes.length === 2, `Exactly 2 alias routes (found ${aliasRoutes.length})`);

  // E. No third pollution alias check
  assert(!aliasRoutes.includes('/issues/pollution'), `No /issues/pollution alias exists (it is canonical)`);
  assert(aliasRoutes.includes('/geospatial'), `Alias /geospatial present`);
  assert(aliasRoutes.includes('/issues/rights-institutions'), `Alias /issues/rights-institutions present`);

  for (const routePath of routes) {
    const entry = SEO_REGISTRY[routePath];
    console.log(`\nTesting route [${routePath}]:`);

    let targetFilePath;
    if (routePath === '/') {
      targetFilePath = path.join(DIST_DIR, 'index.html');
    } else {
      const relPath = routePath.replace(/^\//, '');
      targetFilePath = path.join(DIST_DIR, relPath, 'index.html');
    }

    // 1. File exists
    const fileExists = fs.existsSync(targetFilePath);
    assert(fileExists, `File exists at ${path.relative(ROOT_DIR, targetFilePath)}`);
    if (!fileExists) continue;

    const html = fs.readFileSync(targetFilePath, 'utf-8');

    // 2. Minimum file size
    assert(html.length > 5000, `File size is substantial (${html.length} bytes)`);

    // 3. Document Title
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    assert(titleMatch && unescapeHtml(titleMatch[1].trim()) === entry.title, `Title matches expected ("${entry.title}")`);

    // 4. Meta Description
    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)">/i);
    assert(descMatch && unescapeHtml(descMatch[1]) === entry.description, `Meta description matches expected`);

    // 5. Canonical Link
    const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]*)">/i);
    assert(canonicalMatch && canonicalMatch[1] === entry.canonical, `Canonical matches expected ("${entry.canonical}")`);

    // 6. Meta Robots
    const robotsMatch = html.match(/<meta\s+name="robots"\s+content="([^"]*)">/i);
    assert(robotsMatch && robotsMatch[1] === entry.robots, `Meta robots matches expected ("${entry.robots}")`);

    // 7. Open Graph Tags
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)">/i);
    assert(ogTitleMatch && unescapeHtml(ogTitleMatch[1]) === entry.title, `og:title matches expected`);

    const ogUrlMatch = html.match(/<meta\s+property="og:url"\s+content="([^"]*)">/i);
    assert(ogUrlMatch && ogUrlMatch[1] === entry.canonical, `og:url matches expected ("${entry.canonical}")`);

    // 8. Exactly ONE <h1> per page
    const h1Matches = html.match(/<h1(\s+[^>]*)?>[\s\S]*?<\/h1>/gi) || [];
    assert(
      h1Matches.length === 1,
      `Strictly ONE <h1> tag found on page (found ${h1Matches.length})`
    );

    // 9. Structured Data JSON-LD Scope (F)
    const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    let validMinimalJsonLd = false;
    let containsDeferredSchemas = false;
    if (jsonLdMatch) {
      try {
        const parsed = JSON.parse(jsonLdMatch[1]);
        const graph = parsed['@graph'] || [];
        const types = graph.map(n => n['@type']);
        validMinimalJsonLd = types.includes('WebSite') && types.includes('NewsMediaOrganization');
        containsDeferredSchemas = types.some(t => ['Report', 'Dataset', 'CollectionPage', 'Article', 'BreadcrumbList'].includes(t));
      } catch (e) {
        validMinimalJsonLd = false;
      }
    }
    assert(validMinimalJsonLd, `Valid minimal Schema.org JSON-LD @graph block present (WebSite / NewsMediaOrganization)`);
    assert(!containsDeferredSchemas, `No deferred route-specific schemas (Report/Dataset/Article/BreadcrumbList) in Phase 1 JSON-LD`);

    // 10. Prohibited patterns check (G)
    assert(!html.includes('localhost:'), `No "localhost:" references found in HTML`);
    assert(!html.includes('https://404tn.com/en/'), `No prohibited "/en/" prefix found in URLs`);
    assert(!html.includes('https://404tn.com/ar/'), `No prohibited unreleased "/ar/" prefix in canonicals`);
    assert(canonicalMatch && !canonicalMatch[1].includes('#'), `No hash in canonical link`);
    assert(ogUrlMatch && !ogUrlMatch[1].includes('#'), `No hash in og:url`);

    // 11. Alias consistency (D)
    if (entry.isAlias) {
      assert(entry.robots.includes('noindex'), `Alias route ${routePath} has noindex in robots`);
      assert(entry.canonical !== `${CANONICAL_ORIGIN}${routePath}`, `Alias route ${routePath} points canonical to target`);
    } else {
      assert(!entry.robots.includes('noindex'), `Canonical route ${routePath} is indexable`);
      assert(entry.canonical === `${CANONICAL_ORIGIN}${routePath === '/' ? '/' : routePath}`, `Canonical route ${routePath} has self-referential canonical URL`);
    }

    // 12. Non-JS Semantic content check
    if (routePath !== '/') {
      assert(html.includes('id="prerendered-route-header"'), `Semantic subpage header injected for route ${routePath}`);
    }
  }

  // A. /issues/pollution specific assertions
  console.log(`\nSpecific Assertions for /issues/pollution:`);
  const pollutionHtml = fs.readFileSync(path.join(DIST_DIR, 'issues', 'pollution', 'index.html'), 'utf-8');
  assert(pollutionHtml.includes('href="/gabes"'), `/issues/pollution contains crawlable internal link to /gabes`);
  assert(pollutionHtml.includes('content="index, follow"'), `/issues/pollution is indexable (robots: index, follow)`);
  assert(pollutionHtml.includes('href="https://404tn.com/issues/pollution"'), `/issues/pollution canonical is self-referential`);

  // B. /gabes specific assertions
  console.log(`\nSpecific Assertions for /gabes:`);
  const gabesHtml = fs.readFileSync(path.join(DIST_DIR, 'gabes', 'index.html'), 'utf-8');
  assert(gabesHtml.includes('href="/issues/pollution"'), `/gabes contains crawlable internal link to /issues/pollution`);
  assert(gabesHtml.includes('href="https://404tn.com/gabes"'), `/gabes canonical is https://404tn.com/gabes`);
  assert(!gabesHtml.includes('href="https://404tn.com/issues/pollution" rel="canonical"'), `/gabes does NOT canonicalize to /issues/pollution`);

  console.log(`\n============================================================`);
  console.log(`SEO TEST SUMMARY`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`============================================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
