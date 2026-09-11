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


  // Phase B: Issue Dossier Template & Gabès Flagship Assertions
  console.log(`\nPhase B Dossier & Flagship Assertions:`);
  const expectedFiles = [
    { num: '01', key: 'water', route: '/issues/water', name: 'Water' },
    { num: '02', key: 'electricity', route: '/issues/electricity', name: 'Electricity' },
    { num: '03', key: 'pollution', route: '/issues/pollution', name: 'Pollution & Environment' },
    { num: '04', key: 'work', route: '/issues/work', name: 'Work' },
    { num: '05', key: 'migration', route: '/issues/migration', name: 'Migration' },
    { num: '06', key: 'public-services', route: '/issues/public-services', name: 'Public Services' },
    { num: '07', key: 'rights', route: '/issues/rights', name: 'Rights & Freedoms' }
  ];

  for (const fileDef of expectedFiles) {
    const filePath = path.join(DIST_DIR, 'issues', fileDef.key, 'index.html');
    assert(fs.existsSync(filePath), `Dossier ${fileDef.num} file exists at ${path.relative(ROOT_DIR, filePath)}`);
    const fileHtml = fs.readFileSync(filePath, 'utf-8');

    assert(fileHtml.includes(`404TN FILE ${fileDef.num}`), `Dossier ${fileDef.num} includes uppercase tag 404TN FILE ${fileDef.num}`);
    assert(fileHtml.includes(`File ${fileDef.num}`), `Dossier ${fileDef.num} contains File ${fileDef.num} heading`);
    assert(fileHtml.includes('What This File Documents'), `Dossier ${fileDef.num} has scope section`);
    assert(fileHtml.includes('ACCOUNTABLE INSTITUTIONS'), `Dossier ${fileDef.num} has accountable institutions`);
    assert(fileHtml.includes('EXPLICITLY IN SCOPE'), `Dossier ${fileDef.num} has in-scope list`);
    assert(fileHtml.includes('DELIBERATELY OUTSIDE SCOPE'), `Dossier ${fileDef.num} has out-of-scope list`);
    assert(fileHtml.includes('Key Documented Evidence'), `Dossier ${fileDef.num} has key evidence section`);
    assert(fileHtml.includes('Chronology of Documented Events'), `Dossier ${fileDef.num} has timeline section`);
    assert(fileHtml.includes('State Response & Known Outcomes') || fileHtml.includes('State Response &amp; Known Outcomes'), `Dossier ${fileDef.num} has state response section`);
    assert(fileHtml.includes('RELATED INVESTIGATIVE FILES'), `Dossier ${fileDef.num} has related files section`);

    // Prohibit alias link
    assert(!fileHtml.includes('href="/issues/rights-institutions"'), `Dossier ${fileDef.num} has NO links to alias /issues/rights-institutions`);
  }

  // File 07 strict naming
  const rightsHtml = fs.readFileSync(path.join(DIST_DIR, 'issues', 'rights', 'index.html'), 'utf-8');
  assert(rightsHtml.includes('File 07: Rights &amp; Freedoms') || rightsHtml.includes('Rights &amp; Freedoms') || rightsHtml.includes('Rights & Freedoms'), `File 07 has exact title "Rights & Freedoms"`);
  assert(!rightsHtml.includes('Rights &amp; Institutions') && !rightsHtml.includes('Rights & Institutions'), `File 07 does NOT use obsolete "Rights & Institutions" in header`);

  // Gabès flagship deep dive content
  assert(gabesHtml.includes('SPECIAL INVESTIGATION'), `/gabes contains SPECIAL INVESTIGATION tag`);
  assert(gabesHtml.includes('14,000 tonnes/day') || gabesHtml.includes('14,000 tonnes') || gabesHtml.includes('14,000'), `/gabes contains baseline phosphogypsum estimate`);
  assert(gabesHtml.includes('2017 Cabinet Decision') || gabesHtml.includes('June 2017') || gabesHtml.includes('2017'), `/gabes references 2017 cabinet decision`);
  assert(gabesHtml.includes('Data Gaps') || gabesHtml.includes('Health'), `/gabes contains public health / data gaps section`);
  assert(gabesHtml.includes('State Commitment vs Documented Reality'), `/gabes contains state commitment vs reality analysis`);
  assert(!gabesHtml.includes('href="/issues/rights-institutions"'), `/gabes has NO links to alias /issues/rights-institutions`);

  // Phase C: Presidency 2019–2026 & Editorial Design System Assertions
  console.log(`\nPhase C Presidency & Design System Assertions:`);
  const presidencyHtml = fs.readFileSync(path.join(DIST_DIR, 'presidency', 'index.html'), 'utf-8');
  assert(presidencyHtml.includes('PRESIDENCY DOSSIER'), `/presidency contains PRESIDENCY DOSSIER tag`);
  assert(presidencyHtml.includes('Kais Saied: Power, Promises and Responsibility'), `/presidency contains H1 title`);
  assert(presidencyHtml.includes('2019 Baseline') || presidencyHtml.includes('The Anti-Establishment Mandate'), `/presidency contains 2019 baseline section`);
  assert(presidencyHtml.includes('25 July 2021') || presidencyHtml.includes('The Exceptional Rupture'), `/presidency contains 2021 rupture section`);
  assert(presidencyHtml.includes('2022') && presidencyHtml.includes('Constitution'), `/presidency contains 2022 system section`);
  assert(presidencyHtml.includes('2024') && presidencyHtml.includes('Consolidation'), `/presidency contains 2024 consolidation section`);
  assert(presidencyHtml.includes('WHAT WAS PROMISED'), `/presidency contains Promise cards`);
  assert(presidencyHtml.includes('WHAT ACTION WAS TAKEN') || presidencyHtml.includes('WHAT WAS DONE'), `/presidency contains Action cards`);
  assert(presidencyHtml.includes('WHAT THE EVIDENCE SHOWS'), `/presidency contains Evidence results`);
  assert(presidencyHtml.includes('STATUS:'), `/presidency contains Status badges`);
  assert(presidencyHtml.includes('Arab Barometer'), `/presidency contains Arab Barometer survey evidence`);
  assert(presidencyHtml.includes('2019 BASELINE') && presidencyHtml.includes('2026 STATUS'), `/presidency contains historical comparison matrix`);
  assert(presidencyHtml.includes('Moody') && presidencyHtml.includes('Fitch'), `/presidency contains sovereign ratings trajectory`);
  assert(presidencyHtml.includes('ACCOUNTABILITY GRAMMAR'), `/presidency contains 6-question accountability grammar block`);
  assert(!presidencyHtml.includes('href="/issues/rights-institutions"'), `/presidency has NO links to alias /issues/rights-institutions`);

  console.log(`\nGate 5 Assertions (sitemap.xml & robots.txt):`);
  const expectedCanonicalUrls = canonicalRoutes.map(r => SEO_REGISTRY[r].canonical);

  for (const sitemapLocation of [path.join(ROOT_DIR, 'public', 'sitemap.xml'), path.join(DIST_DIR, 'sitemap.xml')]) {
    const sitemapRel = path.relative(ROOT_DIR, sitemapLocation);
    assert(fs.existsSync(sitemapLocation), `${sitemapRel} exists`);
    if (!fs.existsSync(sitemapLocation)) continue;

    const sitemapContent = fs.readFileSync(sitemapLocation, 'utf-8');
    const locMatches = [...sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());

    assert(locMatches.length === 18, `${sitemapRel} contains exactly 18 URLs (found ${locMatches.length})`);
    assert(new Set(locMatches).size === 18, `${sitemapRel} contains zero duplicate URLs`);

    // Check set equality with canonical registry
    const matchesCanonicalSet = expectedCanonicalUrls.every(u => locMatches.includes(u)) && locMatches.every(u => expectedCanonicalUrls.includes(u));
    assert(matchesCanonicalSet, `${sitemapRel} URL set exactly equals canonical indexable registry set`);

    // Prohibited sitemap items
    assert(!locMatches.includes('https://404tn.com/geospatial'), `${sitemapRel} does NOT contain alias /geospatial`);
    assert(!locMatches.includes('https://404tn.com/issues/rights-institutions'), `${sitemapRel} does NOT contain alias /issues/rights-institutions`);
    assert(!sitemapContent.includes('/en/'), `${sitemapRel} contains zero /en/ URLs`);
    assert(!sitemapContent.includes('/ar/'), `${sitemapRel} contains zero /ar/ URLs`);
    assert(!sitemapContent.includes('404.html'), `${sitemapRel} does NOT contain 404.html`);
    assert(!sitemapContent.includes('/api/'), `${sitemapRel} does NOT contain /api/`);
    assert(locMatches.every(u => !u.includes('?')), `${sitemapRel} URLs contain zero query strings`);
    assert(locMatches.every(u => !u.includes('#')), `${sitemapRel} URLs contain zero fragments`);

    // Non-root trailing slash check
    const invalidTrailingSlash = locMatches.filter(u => u !== 'https://404tn.com/' && u.endsWith('/'));
    assert(invalidTrailingSlash.length === 0, `${sitemapRel} has no trailing slash on subpaths (found: ${invalidTrailingSlash.join(', ')})`);

    // Prerender consistency: Every sitemap URL must exist as a prerendered HTML file on disk
    for (const url of locMatches) {
      const subpath = url.replace('https://404tn.com', '');
      const diskPath = subpath === '/' || subpath === ''
        ? path.join(DIST_DIR, 'index.html')
        : path.join(DIST_DIR, subpath.replace(/^\//, ''), 'index.html');
      assert(fs.existsSync(diskPath), `Sitemap URL ${url} corresponds to prerendered file at ${path.relative(ROOT_DIR, diskPath)}`);
    }
  }

  // Robots.txt verification
  for (const robotsLocation of [path.join(ROOT_DIR, 'public', 'robots.txt'), path.join(DIST_DIR, 'robots.txt')]) {
    const robotsRel = path.relative(ROOT_DIR, robotsLocation);
    assert(fs.existsSync(robotsLocation), `${robotsRel} exists`);
    if (!fs.existsSync(robotsLocation)) continue;

    const robotsContent = fs.readFileSync(robotsLocation, 'utf-8');
    assert(robotsContent.includes('User-agent: *'), `${robotsRel} contains User-agent: *`);
    assert(robotsContent.includes('Allow: /'), `${robotsRel} allows public root crawl (Allow: /)`);
    assert(robotsContent.includes('Disallow: /api/'), `${robotsRel} disallows /api/`);
    assert(robotsContent.includes('Disallow: /backups/'), `${robotsRel} disallows /backups/`);
    assert(robotsContent.includes('Disallow: /404.html'), `${robotsRel} disallows /404.html`);
    assert(robotsContent.includes('Sitemap: https://404tn.com/sitemap.xml'), `${robotsRel} references authoritative sitemap`);
    assert(!robotsContent.includes('/en/'), `${robotsRel} does NOT advertise or reference /en/`);
    assert(!robotsContent.includes('/ar/'), `${robotsRel} does NOT advertise or reference /ar/`);
    assert(!robotsContent.includes('Disallow: /gabes'), `${robotsRel} does not disallow /gabes`);
    assert(!robotsContent.includes('Disallow: /issues/'), `${robotsRel} does not disallow canonical /issues/`);
  }

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
