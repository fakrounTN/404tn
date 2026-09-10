// 404TN Utility & Sanitization Helpers (src/utils.js)

/**
 * Escapes HTML characters to prevent XSS and DOM malformation.
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strips all HTML tags and decodes entities to return safe, plain text.
 */
export function stripHtml(html) {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  } catch (e) {
    return String(html).replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
  }
}

/**
 * Extracts and deduplicates unique image URLs from raw HTML or explicit URL properties.
 */
export function extractUniqueImages(html, directUrl = null) {
  const urls = [];
  if (directUrl && typeof directUrl === 'string' && (directUrl.startsWith('http://') || directUrl.startsWith('https://'))) {
    urls.push(directUrl);
  }
  if (html && typeof html === 'string') {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const imgs = doc.querySelectorAll('img');
      imgs.forEach(img => {
        const src = img.getAttribute('src');
        if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
          if (!urls.includes(src)) {
            urls.push(src);
          }
        }
      });
    } catch (e) {
      const imgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        if (!urls.includes(match[1])) {
          urls.push(match[1]);
        }
      }
    }
  }
  return urls;
}

/**
 * Authoritative Collector V2 Canonical Topic Labels
 */
export const CANONICAL_TOPIC_LABELS = {
  water: 'WATER',
  electricity: 'ELECTRICITY',
  gas_energy: 'ENERGY',
  food_security: 'FOOD SECURITY',
  prices_cost_of_living: 'COST OF LIVING',
  work_unemployment: 'WORK',
  migration: 'MIGRATION',
  health: 'HEALTH',
  public_services: 'PUBLIC SERVICES',
  pollution_environment: 'ENVIRONMENT',
  rights_freedoms: 'RIGHTS',
  justice_law: 'JUSTICE',
  media_press_freedom: 'PRESS FREEDOM',
  governance_institutions: 'GOVERNANCE',
  economy_public_finance: 'ECONOMY',
  corruption_accountability: 'ACCOUNTABILITY',
  protests_social_movements: 'PROTESTS',
  security_policing: 'SECURITY',
  education: 'EDUCATION',
  agriculture: 'AGRICULTURE',
  housing_infrastructure: 'INFRASTRUCTURE'
};

/**
 * Resolves an issue key to its clean presentation label without fallback to governance.
 */
export function formatTopicLabel(issue) {
  if (!issue) return 'OTHER';
  const clean = String(issue).toLowerCase().trim();
  return CANONICAL_TOPIC_LABELS[clean] || 'OTHER';
}
