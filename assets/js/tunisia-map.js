import { getCartoRasterTiles } from './config.js';
// 404TN Geospatial Intelligence Map (src/map.js & assets/js/tunisia-map.js)
// Professional MapLibre GL JS Map with 24 Governorates & Evidence Density Heatmap

import * as maplibregl from 'maplibre-gl';
import { openEvidenceDrawer } from './evidence-drawer.js';
import localGovernoratesGeoJson from './assets/data/tunisia-governorates.json';
import localMapFallback from './data/map-fallback.json';

const TUNISIA_BOUNDS = [
  [7.4, 30.1], // Southwest coordinates [lng, lat]
  [11.7, 37.6]  // Northeast coordinates [lng, lat]
];

const REFERENCE_CITIES = [
  { slug: "bizerte", name: "BIZERTE", lng: 9.8739, lat: 37.2744, status: "VERIFIED" },
  { slug: "tunis", name: "TUNIS", lng: 10.1815, lat: 36.8065, status: "VERIFIED" },
  { slug: "kasserine", name: "KASSERINE", lng: 8.8365, lat: 35.1676, status: "REPORTED" },
  { slug: "gafsa", name: "GAFSA", lng: 8.7842, lat: 34.4250, status: "VERIFIED" },
  { slug: "sfax", name: "SFAX", lng: 10.7603, lat: 34.7406, status: "VERIFIED" },
  { slug: "gabes", name: "GABÈS", lng: 10.0982, lat: 33.8815, status: "ACTIVE FILE", isFlagship: true },
  { slug: "zarzis", name: "ZARZIS", lng: 11.1122, lat: 33.5040, status: "REPORTED" }
];

let mapInstance = null;
let allEvidenceFeatures = [];
let activeIssueFilter = "ALL";
let activeTimeFilter = "ALL";
let isApiOffline = false;

export async function initGeospatialMonitor() {
  const container = document.getElementById("geospatial-map-container");
  if (!container) return;

  // Build Map container structure with In-Map Filter Bar and Density Legend
  container.innerHTML = `
    <div class="maplibre-map-wrapper rounded-none border border-surface-800" id="maplibre-canvas-container">
      
      <!-- In-Map Filter Controls -->
      <div class="map-filter-bar">
        <!-- Issue Filters -->
        <div class="map-filter-pill-row" id="map-issue-filters">
          <button class="map-filter-pill active" data-filter-issue="ALL">ALL ISSUES</button>
          <button class="map-filter-pill" data-filter-issue="WATER">WATER</button>
          <button class="map-filter-pill" data-filter-issue="ELECTRICITY">ELECTRICITY</button>
          <button class="map-filter-pill" data-filter-issue="POLLUTION">POLLUTION</button>
          <button class="map-filter-pill" data-filter-issue="WORK">WORK</button>
          <button class="map-filter-pill" data-filter-issue="MIGRATION">MIGRATION</button>
          <button class="map-filter-pill" data-filter-issue="PUBLIC SERVICES">PUBLIC SERVICES</button>
          <button class="map-filter-pill" data-filter-issue="RIGHTS">RIGHTS</button>
        </div>
        <!-- Time Filters -->
        <div class="map-filter-pill-row" id="map-time-filters">
          <button class="map-filter-pill" data-filter-time="24H">24H</button>
          <button class="map-filter-pill" data-filter-time="7D">7D</button>
          <button class="map-filter-pill" data-filter-time="30D">30D</button>
          <button class="map-filter-pill" data-filter-time="2026">2026</button>
          <button class="map-filter-pill active" data-filter-time="ALL">ALL TIME</button>
          <span id="map-offline-badge" class="hidden text-[9px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 border border-amber-800/60 ml-auto">
            API OFFLINE · VERIFIED SNAPSHOT
          </span>
        </div>
      </div>

      <!-- No Data Alert overlay -->
      <div id="map-no-data-notice" class="hidden absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-background/90 border border-surface-700 px-3 py-1 text-[10px] font-mono text-surface-400">
        NO CURRENT EVIDENCE FOR SELECTED FILTERS
      </div>

      <!-- Evidence Density Legend -->
      <div class="map-density-legend">
        <div class="text-[8px] uppercase tracking-widest text-surface-400">EVIDENCE DENSITY</div>
        <div class="map-density-gradient"></div>
        <div class="flex justify-between text-[7px] text-surface-500">
          <span>LOW</span>
          <span>HIGH</span>
        </div>
        <div class="text-[7px] text-surface-500 pt-0.5">CONCENTRATION · NOT SEVERITY</div>
      </div>

    </div>
  `;

  // Fetch Governorates GeoJSON & Evidence Data in parallel
  const [governoratesGeoJson, evidenceGeoJson] = await Promise.all([
    fetchGovernoratesGeoJSON(),
    fetchEvidenceGeoJSON()
  ]);

  allEvidenceFeatures = evidenceGeoJson.features || [];

  // Initialize MapLibre GL
  mapInstance = new maplibregl.Map({
    container: 'maplibre-canvas-container',
    style: {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: getCartoRasterTiles(),
          tileSize: 256,
          attribution: '© OpenStreetMap contributors, © CARTO'
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': '#0B0C0D'
          }
        },
        {
          id: 'carto-tiles',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 18,
          paint: {
            'raster-opacity': 0.35,
            'raster-brightness-max': 0.7
          }
        }
      ]
    },
    bounds: TUNISIA_BOUNDS,
    fitBoundsOptions: {
      padding: { top: 70, bottom: 40, left: 20, right: 20 },
      maxZoom: 8.5
    },
    attributionControl: true
  });

  // Minimal Navigation control in bottom right
  mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  mapInstance.on('load', () => {
    setupGovernorateLayers(governoratesGeoJson);
    setupHeatmapAndEvidenceLayers(evidenceGeoJson);
    renderCityLabels();
    setupFilterListeners();
    setupInteraction();
  });

  // Responsive resize
  window.addEventListener('resize', () => {
    if (mapInstance) mapInstance.resize();
  });
  const resizeObs = new ResizeObserver(() => {
    if (mapInstance) mapInstance.resize();
  });
  resizeObs.observe(container);
}

/* ==========================================================================
   DATA LOADERS
   ========================================================================== */
async function fetchGovernoratesGeoJSON() {
  return localGovernoratesGeoJson;
}

async function fetchEvidenceGeoJSON() {
  try {
    const res = await fetch('/api/map');
    if (res.ok) {
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.info("Live API unavailable, using bundled verified map snapshot:", e.message);
  }

  // Fallback to bundled verified snapshot
  isApiOffline = true;
  const badge = document.getElementById("map-offline-badge");
  if (badge) badge.classList.remove("hidden");

  return localMapFallback;
}

/* ==========================================================================
   MAP LAYERS SETUP
   ========================================================================== */
function setupGovernorateLayers(geoJsonData) {
  if (!mapInstance || !geoJsonData.features) return;

  mapInstance.addSource('tunisia-governorates', {
    type: 'geojson',
    data: geoJsonData
  });

  // 1. Governorate polygon fills
  mapInstance.addLayer({
    id: 'gov-fill',
    type: 'fill',
    source: 'tunisia-governorates',
    paint: {
      'fill-color': '#131518',
      'fill-opacity': 0.75
    }
  });

  // 2. Governorate internal boundaries
  mapInstance.addLayer({
    id: 'gov-boundaries',
    type: 'line',
    source: 'tunisia-governorates',
    paint: {
      'line-color': 'rgba(241, 240, 236, 0.14)',
      'line-width': 1
    }
  });

  // 3. National Coastline & Outer Perimeter
  mapInstance.addLayer({
    id: 'gov-outer-border',
    type: 'line',
    source: 'tunisia-governorates',
    paint: {
      'line-color': 'rgba(241, 240, 236, 0.35)',
      'line-width': 1.5
    }
  });
}

function setupHeatmapAndEvidenceLayers(evidenceData) {
  if (!mapInstance) return;

  mapInstance.addSource('evidence-points', {
    type: 'geojson',
    data: evidenceData
  });

  // 1. Evidence Density Heatmap Layer
  mapInstance.addLayer({
    id: 'evidence-heatmap',
    type: 'heatmap',
    source: 'evidence-points',
    maxzoom: 10,
    paint: {
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'weight'],
        0, 0.2,
        1, 1.0
      ],
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 0.6,
        8, 1.8
      ],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(0, 0, 0, 0)',
        0.2, 'rgba(212, 162, 89, 0.25)',
        0.5, 'rgba(212, 162, 89, 0.65)',
        0.8, 'rgba(201, 54, 54, 0.85)',
        1.0, 'rgba(201, 54, 54, 1.0)'
      ],
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 16,
        8, 38
      ],
      'heatmap-opacity': 0.72
    }
  });

  // 2. Evidence Point Circles Layer
  mapInstance.addLayer({
    id: 'evidence-circles',
    type: 'circle',
    source: 'evidence-points',
    minzoom: 4,
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 4,
        8, 7.5
      ],
      'circle-color': [
        'match',
        ['get', 'status'],
        'ACTIVE FILE', '#C93636',
        'VERIFIED', '#10B981',
        'REPORTED', '#D4C5B0',
        'UNDER REVIEW', '#706E68',
        /* default */ '#F1F0EC'
      ],
      'circle-stroke-color': '#0B0C0D',
      'circle-stroke-width': 1.5,
      'circle-opacity': 0.95
    }
  });
}

/* ==========================================================================
   CITY LABELS & GABÈS ACTIVE RADAR
   ========================================================================== */
function renderCityLabels() {
  REFERENCE_CITIES.forEach(city => {
    const el = document.createElement('div');
    el.className = 'flex flex-col items-center pointer-events-auto cursor-pointer group';
    el.setAttribute('data-city-slug', city.slug);

    if (city.isFlagship) {
      el.innerHTML = `
        <div class="gabes-pulse-marker">
          <div class="ring"></div>
          <div class="core"></div>
        </div>
        <div class="text-[9px] font-mono font-bold text-crimson tracking-wider -mt-1 group-hover:text-white transition-colors">
          ${city.name}
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="w-1.5 h-1.5 rounded-full bg-surface-400 group-hover:bg-white transition-colors"></div>
        <div class="text-[8px] font-mono text-surface-400 tracking-wider mt-0.5 group-hover:text-bone-100 transition-colors">
          ${city.name}
        </div>
      `;
    }

    el.addEventListener('click', () => {
      if (city.isFlagship) {
        openEvidenceDrawer('EV-GABES-01');
      } else {
        openEvidenceDrawer(city.slug === 'sfax' ? 'EV-MIGRATION-01' : (city.slug === 'tunis' ? 'EV-INSTITUTIONS-01' : 'EV-WATER-01'));
      }
    });

    new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([city.lng, city.lat])
      .addTo(mapInstance);
  });
}

/* ==========================================================================
   INTERACTION & POPUPS
   ========================================================================== */
function setupInteraction() {
  const popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: false,
    offset: 12
  });

  mapInstance.on('mouseenter', 'evidence-circles', (e) => {
    mapInstance.getCanvas().style.cursor = 'pointer';
    const feature = e.features[0];
    const coords = feature.geometry.coordinates.slice();
    const p = feature.properties;

    popup.setLngLat(coords).setHTML(`
      <div class="space-y-1.5 font-mono text-[10px]">
        <div class="flex justify-between items-center text-[9px] text-surface-400 pb-1 border-b border-surface-800">
          <span class="font-bold text-bone-100">${(p.location || 'TUNISIA').toUpperCase()}</span>
          <span class="px-1.5 py-0.2 text-[8px] uppercase ${p.status === 'ACTIVE FILE' ? 'bg-crimson/20 text-crimson border border-crimson/40' : 'bg-surface-800 text-surface-300'}">${p.status}</span>
        </div>
        <div class="font-sans font-medium text-xs text-bone-100 leading-snug">${p.title || 'Evidence Record'}</div>
        <div class="text-[9px] text-sand flex justify-between pt-1 border-t border-surface-800/80">
          <span>ISSUE: ${(p.issue || 'GENERAL').toUpperCase()}</span>
          <span>${p.date || '2026'}</span>
        </div>
        <div class="text-[9px] text-crimson pt-1 flex items-center justify-between font-bold">
          <span>INSPECT AUDIT RECORD</span>
          <span>↗</span>
        </div>
      </div>
    `).addTo(mapInstance);
  });

  mapInstance.on('mouseleave', 'evidence-circles', () => {
    mapInstance.getCanvas().style.cursor = '';
  });

  mapInstance.on('click', 'evidence-circles', (e) => {
    const feature = e.features[0];
    const p = feature.properties;
    const evId = p.evidence_id || p.id;
    if (evId) {
      openEvidenceDrawer(evId);
    }
  });
}

/* ==========================================================================
   FILTER CONTROLLERS
   ========================================================================== */
function setupFilterListeners() {
  const issueButtons = document.querySelectorAll("[data-filter-issue]");
  const timeButtons = document.querySelectorAll("[data-filter-time]");

  issueButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      issueButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeIssueFilter = btn.getAttribute("data-filter-issue");
      applyMapFilters();
    });
  });

  timeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      timeButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeTimeFilter = btn.getAttribute("data-filter-time");
      applyMapFilters();
    });
  });
}

function applyMapFilters() {
  if (!mapInstance || !mapInstance.getSource('evidence-points')) return;

  const filtered = allEvidenceFeatures.filter(f => {
    const p = f.properties || {};
    
    // Issue matching
    let matchIssue = true;
    if (activeIssueFilter !== "ALL") {
      const issueLower = (p.issue || "").toLowerCase();
      const filterLower = activeIssueFilter.toLowerCase();
      if (filterLower === "pollution" && (issueLower === "pollution" || issueLower === "gabes")) {
        matchIssue = true;
      } else if (filterLower === "public services" && (issueLower.includes("service") || issueLower.includes("public"))) {
        matchIssue = true;
      } else if (filterLower === "rights" && (issueLower.includes("right") || issueLower.includes("institution"))) {
        matchIssue = true;
      } else {
        matchIssue = issueLower.includes(filterLower);
      }
    }

    // Time matching
    let matchTime = true;
    if (activeTimeFilter !== "ALL") {
      const tb = p.time_bucket || "2026";
      if (activeTimeFilter === "24H") matchTime = tb === "24H";
      else if (activeTimeFilter === "7D") matchTime = tb === "24H" || tb === "7D";
      else if (activeTimeFilter === "30D") matchTime = tb === "24H" || tb === "7D" || tb === "30D";
      else if (activeTimeFilter === "2026") matchTime = true;
    }

    return matchIssue && matchTime;
  });

  const source = mapInstance.getSource('evidence-points');
  source.setData({
    type: "FeatureCollection",
    features: filtered
  });

  // Notice for 0 records
  const notice = document.getElementById("map-no-data-notice");
  if (notice) {
    if (filtered.length === 0) {
      notice.classList.remove("hidden");
    } else {
      notice.classList.add("hidden");
    }
  }
}
