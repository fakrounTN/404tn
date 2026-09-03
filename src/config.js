// 404TN Authoritative Platform Configuration (config.js)

export function getCartoApiKey() {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CARTO_API_KEY) {
    return import.meta.env.VITE_CARTO_API_KEY;
  }
  if (typeof window !== 'undefined' && window.__404TN_CONFIG__ && window.__404TN_CONFIG__.cartoBasemapKey) {
    return window.__404TN_CONFIG__.cartoBasemapKey;
  }
  return '';
}

export function getCartoRasterTiles() {
  const key = getCartoApiKey();
  const queryParam = key ? `?key=${encodeURIComponent(key)}` : '';
  return [
    `https://a.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png${queryParam}`,
    `https://b.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png${queryParam}`,
    `https://c.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png${queryParam}`,
    `https://d.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png${queryParam}`
  ];
}
