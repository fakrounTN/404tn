// scripts/prerender.mjs
// Deterministic Build-Time SSG Prerender for 404TN (https://404tn.com)
// Generates route-specific static HTML with unique title, meta, canonical, OpenGraph, JSON-LD, and semantic H1

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEO_REGISTRY, CANONICAL_ORIGIN } from '../src/seo-registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');
const BASE_HTML_PATH = path.resolve(DIST_DIR, 'index.html');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function generateSchemaJson(entry) {
  // Phase 1 Scope: Minimal global WebSite and NewsMediaOrganization graph only.
  // Route-specific Article, Report, Dataset, CollectionPage, and BreadcrumbList schemas
  // are deferred to the dedicated structured data phase.
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsMediaOrganization",
        "@id": "https://404tn.com/#organization",
        "name": "404TN",
        "url": "https://404tn.com",
        "publishingPrinciples": "https://404tn.com/methodology",
        "description": "Independent investigative and documentation platform analyzing infrastructure, civil liberties, and institutional accountability in Tunisia in 2026."
      },
      {
        "@type": "WebSite",
        "@id": "https://404tn.com/#website",
        "url": "https://404tn.com",
        "name": "404TN",
        "publisher": { "@id": "https://404tn.com/#organization" }
      }
    ]
  };
}

function renderBreadcrumbHtml(breadcrumb) {
  if (!breadcrumb || breadcrumb.length <= 1) {
    return `<span class="text-bone-100">Home</span>`;
  }
  return breadcrumb.map((item, idx) => {
    const isLast = idx === breadcrumb.length - 1;
    if (isLast) {
      return `<span class="text-bone-100 font-medium">${escapeHtml(item.name)}</span>`;
    }
    return `<a href="${escapeAttr(item.path)}" class="hover:text-bone-100 transition-colors">${escapeHtml(item.name)}</a> &gt; `;
  }).join('');
}

function renderInternalLinksHtml(internalLinks) {
  if (!internalLinks || internalLinks.length === 0) return '';
  return internalLinks.map(link => `
    <a href="${escapeAttr(link.href)}" class="px-3 py-1.5 bg-surface-900 hover:bg-surface-800 border border-surface-800 hover:border-surface-600 text-sand hover:text-bone-100 transition-colors">
      ${escapeHtml(link.label)} ↗
    </a>
  `).join('');
}

function prerenderRoute(baseHtml, entry) {
  let html = baseHtml;

  // 1. Language attribute
  html = html.replace(/<html[^>]*lang="[^"]*"[^>]*>/i, `<html lang="${entry.lang || 'en'}" class="scroll-smooth bg-background text-bone-100 antialiased">`);

  // 2. Document Title
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(entry.title)}</title>`);

  // 3. Meta Description
  const metaDescTag = `<meta name="description" content="${escapeAttr(entry.description)}">`;
  if (/<meta\s+name="description"\s+content="[^"]*">/i.test(html)) {
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*">/i, metaDescTag);
  } else {
    html = html.replace(/<\/title>/i, `</title>\n  ${metaDescTag}`);
  }

  // 4. Canonical Tag
  const canonicalTag = `<link rel="canonical" href="${escapeAttr(entry.canonical)}">`;
  if (/<link\s+rel="canonical"\s+href="[^"]*">/i.test(html)) {
    html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*">/i, canonicalTag);
  } else {
    html = html.replace(/<\/head>/i, `  ${canonicalTag}\n</head>`);
  }

  // 5. Meta Robots Tag
  const robotsTag = `<meta name="robots" content="${escapeAttr(entry.robots)}">`;
  if (/<meta\s+name="robots"\s+content="[^"]*">/i.test(html)) {
    html = html.replace(/<meta\s+name="robots"\s+content="[^"]*">/i, robotsTag);
  } else {
    html = html.replace(/(<link\s+rel="canonical"[^>]*>)/i, `$1\n  ${robotsTag}`);
  }

  // 6. Open Graph Tags
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*">/i, `<meta property="og:title" content="${escapeAttr(entry.title)}">`);
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*">/i, `<meta property="og:description" content="${escapeAttr(entry.description)}">`);
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*">/i, `<meta property="og:url" content="${escapeAttr(entry.canonical)}">`);
  html = html.replace(/<meta\s+property="og:type"\s+content="[^"]*">/i, `<meta property="og:type" content="${escapeAttr(entry.pageType || 'website')}">`);

  // 7. Twitter Card Tags
  html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*">/i, `<meta name="twitter:title" content="${escapeAttr(entry.title)}">`);
  html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*">/i, `<meta name="twitter:description" content="${escapeAttr(entry.description)}">`);

  // 8. JSON-LD Structured Data
  const schemaObj = generateSchemaJson(entry);
  const schemaJsonStr = JSON.stringify(schemaObj, null, 2);
  const jsonLdTag = `<script type="application/ld+json">\n${schemaJsonStr}\n  </script>`;
  html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i, jsonLdTag);

  // 9. Semantic H1 & Prerender Content Block
  if (entry.path === '/') {
    // Root route: Hero contains the single H1.
  } else {
    // Subpage: Demote Hero H1 to H2 so the page has exactly 1 H1.
    html = html.replace(
      /<h1(\s+class="font-editorial[^"]*")>([\s\S]*?)<\/h1>/i,
      `<h2$1>$2</h2>`
    );

    // Build the subpage semantic header banner containing its single H1, breadcrumbs, editorial intro, and internal links
    const breadcrumbHtml = renderBreadcrumbHtml(entry.breadcrumb);
    const internalLinksHtml = renderInternalLinksHtml(entry.internalLinks);

    const subpageBannerHtml = `
    <!-- Prerendered Semantic Dossier/Route Header for Non-JS Crawlers & Deep Links -->
    <section id="prerendered-route-header" class="border-b border-surface-800 bg-surface-900/90 py-10 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto space-y-5">
        <nav aria-label="Breadcrumb" class="text-xs font-mono text-surface-400">
          ${breadcrumbHtml}
        </nav>
        <div class="space-y-2">
          <span class="text-[10px] font-mono uppercase tracking-widest text-crimson font-medium block">404TN INVESTIGATIVE ARCHIVE · 2026</span>
          <h1 class="font-editorial text-3xl sm:text-4xl lg:text-5xl text-bone-100 font-normal leading-tight">${escapeHtml(entry.h1)}</h1>
        </div>
        <p class="text-base sm:text-lg text-surface-300 font-light leading-relaxed max-w-4xl">${escapeHtml(entry.editorialIntro)}</p>
        <div class="pt-4 border-t border-surface-800/80 flex flex-wrap items-center gap-3 text-xs font-mono">
          <span class="text-[10px] text-surface-400 uppercase tracking-meta mr-1">RELATED SECTIONS:</span>
          ${internalLinksHtml}
        </div>
      </div>
    </section>
`;

    // Inject banner at top of #content-views
    html = html.replace(
      /(<div\s+id="content-views">)/i,
      `$1\n${subpageBannerHtml}`
    );
  }

  return html;
}

export function runPrerender() {
  if (!fs.existsSync(BASE_HTML_PATH)) {
    console.error(`[prerender] Error: Base HTML not found at ${BASE_HTML_PATH}. Run "vite build" first.`);
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(BASE_HTML_PATH, 'utf-8');
  const routes = Object.keys(SEO_REGISTRY);

  console.log(`\n============================================================`);
  console.log(`404TN DETERMINISTIC SSG PRERENDER (Gate 3)`);
  console.log(`Target origin: ${CANONICAL_ORIGIN}`);
  console.log(`Total routes in SEO Registry: ${routes.length}`);
  console.log(`============================================================\n`);

  let generatedCount = 0;

  for (const routePath of routes) {
    const entry = SEO_REGISTRY[routePath];
    const renderedHtml = prerenderRoute(baseHtml, entry);

    let targetFilePath;
    if (routePath === '/') {
      targetFilePath = path.join(DIST_DIR, 'index.html');
    } else {
      // Remove leading slash for path join
      const relPath = routePath.replace(/^\//, '');
      const targetDir = path.join(DIST_DIR, relPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      targetFilePath = path.join(targetDir, 'index.html');
    }

    fs.writeFileSync(targetFilePath, renderedHtml, 'utf-8');
    generatedCount++;

    const relDisplay = path.relative(ROOT_DIR, targetFilePath);
    console.log(`[prerender] ✓ ${routePath.padEnd(28)} -> ${relDisplay} (${renderedHtml.length} bytes)`);
  }

  // Generate and write sitemap.xml derived from authoritative SEO_REGISTRY
  const sitemapXml = generateSitemapXml();
  const publicSitemapPath = path.resolve(ROOT_DIR, 'public', 'sitemap.xml');
  const distSitemapPath = path.resolve(DIST_DIR, 'sitemap.xml');
  fs.writeFileSync(publicSitemapPath, sitemapXml, 'utf-8');
  if (fs.existsSync(DIST_DIR)) {
    fs.writeFileSync(distSitemapPath, sitemapXml, 'utf-8');
  }
  const canonicalCount = Object.values(SEO_REGISTRY).filter(r => !r.isAlias).length;
  console.log(`[prerender] ✓ Synced sitemap.xml with ${canonicalCount} canonical URLs.`);

  console.log(`\n[prerender] Completed: Successfully prerendered ${generatedCount}/${routes.length} routes.\n`);
}

export function generateSitemapXml() {
  const canonicalEntries = Object.values(SEO_REGISTRY).filter(r => !r.isAlias);
  const urlsXml = canonicalEntries.map(entry => `  <url>\n    <loc>${entry.canonical}</loc>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>\n`;
}

// Execute when run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPrerender();
}
