import { getCartoRasterTiles } from './config.js';
// 404TN Geospatial Intelligence Map (src/map.js)
// Multi-Mode MapLibre GL JS Map with 24 Governorates & Clustered Evidence Density Engine

import * as maplibregl from 'maplibre-gl';
import { openEvidenceDrawer } from './evidence-drawer.js';

const TUNISIA_BOUNDS = [
  [7.4, 30.1], // Southwest coordinates [lng, lat]
  [11.7, 37.6]  // Northeast coordinates [lng, lat]
];

// Authoritative reference coordinates for all 24 governorates
const ALL_24_GOVERNORATES = [
  { slug: "tunis", name: "TUNIS", name_ar: "تونس", lng: 10.1815, lat: 36.8065 },
  { slug: "ariana", name: "ARIANA", name_ar: "أريانة", lng: 10.1647, lat: 36.8665 },
  { slug: "ben_arous", name: "BEN AROUS", name_ar: "بن عروس", lng: 10.2189, lat: 36.7531 },
  { slug: "manouba", name: "MANOUBA", name_ar: "منوبة", lng: 10.0972, lat: 36.8083 },
  { slug: "nabeul", name: "NABEUL", name_ar: "نابل", lng: 10.7376, lat: 36.4561 },
  { slug: "zaghouan", name: "ZAGHOUAN", name_ar: "زغوان", lng: 10.1429, lat: 36.4029 },
  { slug: "bizerte", name: "BIZERTE", name_ar: "بنزرت", lng: 9.8739, lat: 37.2744 },
  { slug: "beja", name: "BÉJA", name_ar: "باجة", lng: 9.1817, lat: 36.7256 },
  { slug: "jendouba", name: "JENDOUBA", name_ar: "جندوبة", lng: 8.7802, lat: 36.5011 },
  { slug: "kef", name: "LE KEF", name_ar: "الكاف", lng: 8.7149, lat: 36.1822 },
  { slug: "siliana", name: "SILIANA", name_ar: "سليانة", lng: 9.3708, lat: 36.0849 },
  { slug: "kairouan", name: "KAIROUAN", name_ar: "القيروان", lng: 10.0963, lat: 35.6781 },
  { slug: "kasserine", name: "KASSERINE", name_ar: "القصرين", lng: 8.8365, lat: 35.1676 },
  { slug: "sidi_bouzid", name: "SIDI BOUZID", name_ar: "سيدي بوزيد", lng: 9.4849, lat: 35.0382 },
  { slug: "sousse", name: "SOUSSE", name_ar: "سوسة", lng: 10.6369, lat: 35.8256 },
  { slug: "monastir", name: "MONASTIR", name_ar: "المنستير", lng: 10.8261, lat: 35.7779 },
  { slug: "mahdia", name: "MAHDIA", name_ar: "المهدية", lng: 11.0622, lat: 35.5047 },
  { slug: "sfax", name: "SFAX", name_ar: "صفاقس", lng: 10.7603, lat: 34.7406 },
  { slug: "gafsa", name: "GAFSA", name_ar: "قفصة", lng: 8.7842, lat: 34.4250 },
  { slug: "tozeur", name: "TOZEUR", name_ar: "توزر", lng: 8.1335, lat: 33.9197 },
  { slug: "kebili", name: "KÉBILI", name_ar: "قبلي", lng: 8.9690, lat: 33.7044 },
  { slug: "gabes", name: "GABÈS", name_ar: "قابس", lng: 10.0982, lat: 33.8815, isFlagship: true },
  { slug: "medenine", name: "MÉDENINE", name_ar: "مدنين", lng: 10.5055, lat: 33.3549 },
  { slug: "tataouine", name: "TATAOUINE", name_ar: "تطاوين", lng: 10.4518, lat: 32.9297 }
];

let mapInstance = null;
let allEvidenceFeatures = [];
let allGovernoratesData = [];
let activeMode = "incidents"; // "incidents" | "density" | "governorates"
let activeIssueFilter = "ALL";
let activeTimeFilter = "ALL";
let activeGovernorateFilter = null;
let isApiOffline = false;

export async function initGeospatialMonitor() {
  const container = document.getElementById("geospatial-map-container");
  if (!container) return;

  // Build Map container structure with Mode Selector, Filter Bar, and Mandatory Disclaimer
  container.innerHTML = `
    <div class="maplibre-map-wrapper rounded-none border border-surface-800" id="maplibre-canvas-container">
      
      <!-- In-Map Filter Controls -->
      <div class="map-filter-bar space-y-1.5 p-2.5 bg-background/95 border-b border-surface-800">
        
        <!-- Top Row: Map Mode Toggle & Offline Badge -->
        <div class="flex items-center justify-between gap-2 border-b border-surface-800/60 pb-1.5">
          <div class="flex items-center gap-1" id="map-mode-toggle">
            <span class="text-[9px] font-mono text-surface-400 uppercase tracking-widest mr-1">MODE:</span>
            <button class="map-mode-pill active px-2 py-0.5 text-[10px] font-mono border border-surface-700 bg-surface-800 text-bone-100" data-mode="incidents">INCIDENTS</button>
            <button class="map-mode-pill px-2 py-0.5 text-[10px] font-mono border border-surface-800 text-surface-400 hover:text-bone-100" data-mode="density">EVIDENCE DENSITY</button>
            <button class="map-mode-pill px-2 py-0.5 text-[10px] font-mono border border-surface-800 text-surface-400 hover:text-bone-100" data-mode="governorates">24 GOVERNORATES</button>
          </div>
          <span id="map-offline-badge" class="hidden text-[9px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 border border-amber-800/60 ml-auto">
            API OFFLINE · BASE MAP ONLY
          </span>
        </div>

        <!-- Issue Filters -->
        <div class="map-filter-pill-row flex flex-wrap gap-1" id="map-issue-filters">
          <button class="map-filter-pill active text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-300" data-filter-issue="ALL">ALL ISSUES</button>
          <button class="map-filter-pill text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-400 hover:text-bone-100" data-filter-issue="WATER">WATER</button>
          <button class="map-filter-pill text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-400 hover:text-bone-100" data-filter-issue="ELECTRICITY">ELECTRICITY</button>
          <button class="map-filter-pill text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-400 hover:text-bone-100" data-filter-issue="POLLUTION">POLLUTION / GABÈS</button>
          <button class="map-filter-pill text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-400 hover:text-bone-100" data-filter-issue="WORK">WORK / ECONOMY</button>
          <button class="map-filter-pill text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-400 hover:text-bone-100" data-filter-issue="MIGRATION">MIGRATION</button>
          <button class="map-filter-pill text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-400 hover:text-bone-100" data-filter-issue="PUBLIC SERVICES">PUBLIC SERVICES</button>
          <button class="map-filter-pill text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-400 hover:text-bone-100" data-filter-issue="RIGHTS">RIGHTS & INSTITUTIONS</button>
        </div>

        <!-- Time Filters -->
        <div class="map-filter-pill-row flex flex-wrap gap-1" id="map-time-filters">
          <button class="map-filter-pill text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-400 hover:text-bone-100" data-filter-time="24H">24H</button>
          <button class="map-filter-pill text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-400 hover:text-bone-100" data-filter-time="7D">7D</button>
          <button class="map-filter-pill text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-400 hover:text-bone-100" data-filter-time="30D">30D</button>
          <button class="map-filter-pill text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-400 hover:text-bone-100" data-filter-time="2026">SUMMER 2026</button>
          <button class="map-filter-pill active text-[9px] font-mono px-1.5 py-0.5 border border-surface-800 text-surface-300" data-filter-time="ALL">ALL TIME</button>
        </div>
      </div>

      <!-- Mandatory Disclaimer & Legend Footer -->
      <div class="map-disclaimer-banner absolute bottom-1 left-2 right-2 z-10 bg-background/90 border border-surface-800 px-2 py-1 text-[8px] font-mono text-surface-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <span><strong class="text-sand">DOCUMENTED PRESSURE / EVIDENCE DENSITY:</strong> Density reflects documented evidence collected by 404TN, not a definitive measurement of real-world severity.</span>
        <span class="text-surface-500 whitespace-nowrap">24 GOVERNORATES MONITORED</span>
      </div>

      <!-- No Data Alert overlay -->
      <div id="map-no-data-notice" class="hidden absolute top-28 left-1/2 -translate-x-1/2 z-20 bg-background/90 border border-surface-700 px-3 py-1 text-[10px] font-mono text-surface-400">
        NO CURRENT GEOCODED EVIDENCE FOR SELECTED FILTERS
      </div>

      <!-- Evidence Density Legend -->
      <div class="map-density-legend">
        <div class="text-[8px] uppercase tracking-widest text-surface-400 font-bold">DOCUMENTED PRESSURE</div>
        <div class="map-density-gradient"></div>
        <div class="flex justify-between text-[7px] text-surface-500">
          <span>LOW DENSITY</span>
          <span>HIGH DENSITY</span>
        </div>
        <div class="text-[7px] text-surface-500 pt-0.5">EVIDENCE CLUSTERS · NOT SEVERITY</div>
      </div>

    </div>
  `;

  // Fetch Governorates GeoJSON & Live Evidence Data in parallel
  const [governoratesGeoJson, evidenceMapData] = await Promise.all([
    fetchGovernoratesGeoJSON(),
    fetchEvidenceGeoJSON()
  ]);

  allEvidenceFeatures = (evidenceMapData && evidenceMapData.features) ? evidenceMapData.features : [];
  allGovernoratesData = (evidenceMapData && evidenceMapData.governorates) ? evidenceMapData.governorates : [];

  // Initialize MapLibre GL
  mapInstance = new maplibregl.Map({
    container: 'maplibre-canvas-container',
    cooperativeGestures: true,
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
      padding: { top: 90, bottom: 40, left: 20, right: 20 },
      maxZoom: 8.5
    },
    attributionControl: true
  });

  // Minimal Navigation control in bottom right
  mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  mapInstance.on('load', () => {
    if (governoratesGeoJson) {
      setupGovernorateLayers(governoratesGeoJson);
    }
    setupHeatmapAndEvidenceLayers({ type: "FeatureCollection", features: allEvidenceFeatures });
    renderCityLabels();
    setupFilterListeners();
    setupInteraction();

    if (allEvidenceFeatures.length === 0) {
      const notice = document.getElementById("map-no-data-notice");
      if (notice) notice.classList.remove("hidden");
    }
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
let cachedGovernoratesGeoJson = null;

async function fetchGovernoratesGeoJSON() {
  if (cachedGovernoratesGeoJson) return cachedGovernoratesGeoJson;
  try {
    const res = await fetch('./data/tunisia-governorates.json');
    if (res.ok) {
      cachedGovernoratesGeoJson = await res.json();
      return cachedGovernoratesGeoJson;
    }
  } catch (err) {
    console.warn("Failed to load /data/tunisia-governorates.json:", err);
  }
  return null;
}

async function fetchEvidenceGeoJSON() {
  const baseApi = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
    ? import.meta.env.VITE_API_URL 
    : (window.location.hostname === 'localhost' && window.location.port === '3000' ? 'http://localhost:8000/api' : '/api');
  
  const url = `${baseApi}/map?mode=${encodeURIComponent(activeMode)}&time_filter=${encodeURIComponent(activeTimeFilter)}&issue=${encodeURIComponent(activeIssueFilter)}`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.info("Live API unavailable, rendering reference basemap without markers:", e.message);
  }

  isApiOffline = true;
  const badge = document.getElementById("map-offline-badge");
  if (badge) badge.classList.remove("hidden");

  return { type: "FeatureCollection", features: [], governorates: [], clusters: [] };
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
        0, 0.3,
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
      'heatmap-opacity': activeMode === 'density' ? 0.85 : (activeMode === 'incidents' ? 0.40 : 0.0)
    }
  });

  // 2. Evidence Point Circles Layer
  mapInstance.addLayer({
    id: 'evidence-circles',
    type: 'circle',
    source: 'evidence-points',
    minzoom: 3,
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, 4.5,
        8, 8.5
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
      'circle-opacity': activeMode === 'density' ? 0.2 : 0.95
    }
  });
}

/* ==========================================================================
   CITY LABELS & 24 GOVERNORATES NODES
   ========================================================================== */
function renderCityLabels() {
  ALL_24_GOVERNORATES.forEach(city => {
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
      if (mapInstance) {
        mapInstance.flyTo({ center: [city.lng, city.lat], zoom: 7.5, speed: 1.2 });
      }
      activeGovernorateFilter = city.slug;
      applyMapFilters();
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

    const sourcesCount = p.source_count || 1;
    const evidenceCount = p.evidence_count || 1;
    const sourcesDisplay = p.sources ? (typeof p.sources === 'string' ? p.sources : JSON.parse(p.sources || '[]')).join(', ') : (p.source_name || 'Verified Source');

    popup.setLngLat(coords).setHTML(`
      <div class="space-y-1.5 font-mono text-[10px]">
        <div class="flex justify-between items-center text-[9px] text-surface-400 pb-1 border-b border-surface-800">
          <span class="font-bold text-bone-100">${(p.governorate || p.location || 'TUNISIA').toUpperCase()}</span>
          <span class="px-1.5 py-0.2 text-[8px] uppercase ${p.status === 'ACTIVE FILE' ? 'bg-crimson/20 text-crimson border border-crimson/40' : 'bg-surface-800 text-surface-300'}">${p.status || 'REPORTED'}</span>
        </div>
        <div class="font-sans font-medium text-xs text-bone-100 leading-snug">${p.title || p.headline || 'Documented Event'}</div>
        <div class="text-[9px] text-sand flex justify-between pt-1 border-t border-surface-800/80">
          <span>ISSUE: ${(p.issue || 'GENERAL').toUpperCase()}</span>
          <span>${p.date || '2026'}</span>
        </div>
        <div class="text-[8px] text-surface-400 flex justify-between">
          <span>CORROBORATION: ${sourcesCount} sources (${evidenceCount} records)</span>
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
   FILTER CONTROLLERS & MODE SWITCHER
   ========================================================================== */
function setupFilterListeners() {
  const modeButtons = document.querySelectorAll("[data-mode]");
  const issueButtons = document.querySelectorAll("[data-filter-issue]");
  const timeButtons = document.querySelectorAll("[data-filter-time]");

  modeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modeButtons.forEach(b => {
        b.classList.remove("active", "bg-surface-800", "text-bone-100");
        b.classList.add("text-surface-400");
      });
      btn.classList.add("active", "bg-surface-800", "text-bone-100");
      btn.classList.remove("text-surface-400");
      activeMode = btn.getAttribute("data-mode");
      updateMapModeLayers();
      applyMapFilters();
    });
  });

  issueButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      issueButtons.forEach(b => b.classList.remove("active", "text-bone-100"));
      btn.classList.add("active", "text-bone-100");
      activeIssueFilter = btn.getAttribute("data-filter-issue");
      applyMapFilters();
    });
  });

  timeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      timeButtons.forEach(b => b.classList.remove("active", "text-bone-100"));
      btn.classList.add("active", "text-bone-100");
      activeTimeFilter = btn.getAttribute("data-filter-time");
      applyMapFilters();
    });
  });
}

function updateMapModeLayers() {
  if (!mapInstance) return;
  
  if (mapInstance.getLayer('evidence-heatmap')) {
    const opacity = activeMode === 'density' ? 0.85 : (activeMode === 'incidents' ? 0.40 : 0.0);
    mapInstance.setPaintProperty('evidence-heatmap', 'heatmap-opacity', opacity);
  }

  if (mapInstance.getLayer('evidence-circles')) {
    const opacity = activeMode === 'density' ? 0.2 : 0.95;
    mapInstance.setPaintProperty('evidence-circles', 'circle-opacity', opacity);
  }
}

async function applyMapFilters() {
  if (!mapInstance || !mapInstance.getSource('evidence-points')) return;

  const data = await fetchEvidenceGeoJSON();
  allEvidenceFeatures = (data && data.features) ? data.features : [];

  const source = mapInstance.getSource('evidence-points');
  source.setData({
    type: "FeatureCollection",
    features: allEvidenceFeatures
  });

  // Notice for 0 records
  const notice = document.getElementById("map-no-data-notice");
  if (notice) {
    if (allEvidenceFeatures.length === 0) {
      notice.classList.remove("hidden");
    } else {
      notice.classList.add("hidden");
    }
  }
}
