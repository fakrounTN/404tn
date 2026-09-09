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
