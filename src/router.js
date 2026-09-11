// src/router.js
// 404TN Clean Browser-History Router (No Hash Routing)
import { SEO_REGISTRY } from './seo-registry.js';

export const ROUTE_MAP = {
  '/': { type: 'home', navRoute: '/' },
  '/summer-2026': { type: 'summer', navRoute: '/summer-2026' },
  '/the-files': { type: 'the-files', navRoute: '/the-files' },
  '/geospatial-monitor': { type: 'geospatial', navRoute: '/geospatial-monitor' },
  '/geospatial': { type: 'geospatial', navRoute: '/geospatial-monitor' },
  '/gabes': { type: 'gabes', navRoute: '/the-files' },
  '/state-response': { type: 'state-response', navRoute: '/state-response' },
  '/presidency': { type: 'presidency', navRoute: '/presidency' },
  '/timeline': { type: 'timeline', navRoute: '/timeline' },
  '/evidence': { type: 'evidence', navRoute: '/methodology' },
  '/methodology': { type: 'methodology', navRoute: '/methodology' },
  '/statement': { type: 'statement', navRoute: '/statement' },

  // Issue routes
  '/issues/water': { type: 'issue', navRoute: '/the-files', issueKey: 'water' },
  '/issues/electricity': { type: 'issue', navRoute: '/the-files', issueKey: 'electricity' },
  '/issues/work': { type: 'issue', navRoute: '/the-files', issueKey: 'work' },
  '/issues/migration': { type: 'issue', navRoute: '/the-files', issueKey: 'migration' },
  '/issues/public-services': { type: 'issue', navRoute: '/the-files', issueKey: 'publicServices' },
  '/issues/rights': { type: 'issue', navRoute: '/the-files', issueKey: 'institutions' },
  '/issues/rights-institutions': { type: 'issue', navRoute: '/the-files', issueKey: 'institutions' },
  '/issues/pollution': { type: 'issue', navRoute: '/the-files', issueKey: 'pollution' }
};

export const LEGACY_HASH_MAP = {
  '#hero': '/',
  '#summer-2026': '/summer-2026',
  '#the-files': '/the-files',
  '#geospatial-monitor': '/geospatial-monitor',
  '#geospatial': '/geospatial-monitor',
  '#gabes': '/gabes',
  '#state-response': '/state-response',
  '#presidency': '/presidency',
  '#timeline': '/timeline',
  '#evidence': '/evidence',
  '#methodology': '/methodology',
  '#statement': '/statement'
};

let onRouteViewHandler = null;

export function setRouteViewHandler(handler) {
  onRouteViewHandler = handler;
}

// Backward compatibility setters
export function setIssueRouteHandler(handler) {
  // Handled via setRouteViewHandler
}
export function setGabesRouteHandler(handler) {}
export function setPresidencyRouteHandler(handler) {}
export function setStandardRouteHandler(handler) {}

export function resolveRoute(pathname, hash = '') {
  // Normalize pathname: remove trailing slash (except root)
  const cleanPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  // Check for legacy hash redirect
  if (hash && LEGACY_HASH_MAP[hash]) {
    const targetPath = LEGACY_HASH_MAP[hash];
    return {
      type: 'LEGACY_REDIRECT',
      targetPath,
      routeConfig: ROUTE_MAP[targetPath]
    };
  }

  // Exact route match
  if (ROUTE_MAP[cleanPath]) {
    return {
      type: 'MATCH',
      cleanPath,
      hash,
      routeConfig: ROUTE_MAP[cleanPath]
    };
  }

  // Unknown route
  return {
    type: 'NOT_FOUND',
    cleanPath,
    hash
  };
}

export function updateActiveNavLinks(activeNavRoute) {
  const desktopNavLinks = document.querySelectorAll('#main-header .nav-link');
  const mobileNavLinks = document.querySelectorAll('#mobile-menu-drawer nav a');

  const updateList = (links, activeClassList, inactiveClassList) => {
    links.forEach(link => {
      const href = link.getAttribute('href');
      const dataRoute = link.getAttribute('data-route') || href;

      const isActive = activeNavRoute && (
        (dataRoute === activeNavRoute) ||
        (activeNavRoute === '/evidence' && (dataRoute === '/methodology' || dataRoute === '/evidence')) ||
        (activeNavRoute === '/methodology' && (dataRoute === '/methodology' || dataRoute === '/evidence')) ||
        (activeNavRoute.startsWith('/issues/') && dataRoute === '/the-files') ||
        (activeNavRoute === '/gabes' && dataRoute === '/the-files')
      );

      if (isActive) {
        inactiveClassList.forEach(c => link.classList.remove(c));
        activeClassList.forEach(c => link.classList.add(c));
      } else {
        activeClassList.forEach(c => link.classList.remove(c));
        inactiveClassList.forEach(c => link.classList.add(c));
      }
    });
  };

  updateList(desktopNavLinks, ['text-bone-100', 'font-medium'], ['text-surface-400', 'font-normal']);
  updateList(mobileNavLinks, ['text-crimson', 'font-medium'], ['text-surface-300', 'font-normal']);
}

export function showNotFoundView(show = true) {
  const notFoundEl = document.getElementById('not-found-view');
  const contentViewsEl = document.getElementById('content-views');
  if (!notFoundEl || !contentViewsEl) return;

  if (show) {
    notFoundEl.classList.remove('hidden');
    contentViewsEl.classList.add('hidden');
    document.title = '404 — Record Unavailable | 404TN';
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else {
    notFoundEl.classList.add('hidden');
    contentViewsEl.classList.remove('hidden');
    document.title = '404TN — Tunisia 2026: Investigative Documentation & Evidence Platform';
  }
}

export function scrollToTarget(sectionId, hash) {
  if (hash && hash !== '#' && !LEGACY_HASH_MAP[hash]) {
    const targetAnchor = document.querySelector(hash);
    if (targetAnchor) {
      const headerOffset = 70;
      const elementPosition = targetAnchor.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      return;
    }
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}

function setMetaTag(attrName, attrValue, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function updateHeadMetadata(pathname) {
  const cleanPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const entry = SEO_REGISTRY[cleanPath];

  if (!entry) {
    document.title = '404 — Record Unavailable | 404TN';
    setMetaTag('name', 'robots', 'noindex, nofollow');
    return;
  }

  // Document Title
  document.title = entry.title;

  // Meta Description
  setMetaTag('name', 'description', entry.description);

  // Meta Robots
  setMetaTag('name', 'robots', entry.robots);

  // Canonical Link
  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', entry.canonical);

  // Open Graph
  setMetaTag('property', 'og:title', entry.title);
  setMetaTag('property', 'og:description', entry.description);
  setMetaTag('property', 'og:url', entry.canonical);
  setMetaTag('property', 'og:type', entry.pageType || 'website');

  // Twitter Cards
  setMetaTag('name', 'twitter:title', entry.title);
  setMetaTag('name', 'twitter:description', entry.description);
}

export function handleNavigation(pathWithHash, pushState = true) {
  const url = new URL(pathWithHash, window.location.origin);
  const pathname = url.pathname;
  const hash = url.hash;

  const resolution = resolveRoute(pathname, hash);

  if (resolution.type === 'LEGACY_REDIRECT') {
    window.history.replaceState(null, '', resolution.targetPath);
    showNotFoundView(false);
    updateHeadMetadata(resolution.targetPath);
    updateActiveNavLinks(resolution.routeConfig.navRoute);

    if (onRouteViewHandler) {
      onRouteViewHandler(resolution.targetPath, resolution.routeConfig);
    }
    scrollToTarget(null, null);
    return;
  }

  if (resolution.type === 'NOT_FOUND') {
    if (pushState && (window.location.pathname + window.location.hash !== pathWithHash)) {
      window.history.pushState(null, '', pathWithHash);
    }
    showNotFoundView(true);
    updateHeadMetadata('/404');
    updateActiveNavLinks(null);
    return;
  }

  // MATCH
  if (pushState && (window.location.pathname + window.location.hash !== pathWithHash)) {
    window.history.pushState(null, '', pathWithHash);
  }

  showNotFoundView(false);
  updateHeadMetadata(resolution.cleanPath);
  updateActiveNavLinks(resolution.routeConfig.navRoute);

  if (onRouteViewHandler) {
    onRouteViewHandler(resolution.cleanPath, resolution.routeConfig);
  }
  scrollToTarget(null, hash);
}

export function initRouter() {
  // Global click listener for internal route navigation
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Ignore external links, mailto, tel, downloads, target="_blank"
    if (
      link.target === '_blank' ||
      link.hasAttribute('download') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('http://') ||
      href.startsWith('https://')
    ) {
      return;
    }

    // Skip accessibility anchor (#main-content) or subsection hash anchor
    if (href.startsWith('#')) {
      if (LEGACY_HASH_MAP[href]) {
        e.preventDefault();
        handleNavigation(LEGACY_HASH_MAP[href], true);
        return;
      }
      // Allowed subsection anchor jump
      return;
    }

    // Internal clean route navigation
    if (href.startsWith('/')) {
      e.preventDefault();
      handleNavigation(href, true);
    }
  });

  // Handle browser Back / Forward navigation
  window.addEventListener('popstate', () => {
    handleNavigation(window.location.pathname + window.location.hash, false);
  });

  // Initial navigation on DOM load
  const initialPath = window.location.pathname + window.location.hash;
  handleNavigation(initialPath, false);
}
