// 404TN Frontend API Client (src/api.js)
// Connects to /api/* with graceful fallback to static snapshot

const API_BASE_URL = window.location.hostname === "localhost" && window.location.port === "3000" 
  ? "http://localhost:8000/api" 
  : "/api";

const REQUEST_TIMEOUT_MS = 3500;

let fallbackDataCache = null;
let isSnapshotMode = false;

async function loadFallbackData() {
  if (fallbackDataCache) return fallbackDataCache;
  try {
    const res = await fetch("./src/data/fallback.json");
    if (res.ok) {
      fallbackDataCache = await res.json();
      return fallbackDataCache;
    }
  } catch (err) {
    console.warn("Could not load local fallback.json", err);
  }
  return null;
}

function updateSnapshotUIBadge(usingSnapshot) {
  isSnapshotMode = usingSnapshot;
  const badge = document.getElementById("api-status-badge");
  if (badge) {
    if (usingSnapshot) {
      badge.innerHTML = `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 border border-amber-800/60 bg-amber-950/40 text-amber-300 text-[10px] font-mono"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>DATA SNAPSHOT</span></span>`;
    } else {
      badge.innerHTML = `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 border border-surface-800 bg-surface-900 text-surface-400 text-[10px] font-mono"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span><span>LIVE EVIDENCE MONITOR</span></span>`;
    }
  }
}

async function fetchWithTimeout(endpoint) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      updateSnapshotUIBadge(false);
      return await res.json();
    }
    throw new Error(`API returned ${res.status}`);
  } catch (err) {
    clearTimeout(timer);
    console.info(`API endpoint ${endpoint} unavailable, engaging verified fallback snapshot:`, err.message);
    updateSnapshotUIBadge(true);
    return null;
  }
}

export async function getMapData() {
  const data = await fetchWithTimeout("/map");
  if (data) return data;
  const fallback = await loadFallbackData();
  return fallback ? fallback.map : { locations: [] };
}

export async function getEvidence(id) {
  const data = await fetchWithTimeout(`/evidence/${id}`);
  if (data) return data;
  const fallback = await loadFallbackData();
  if (fallback && fallback.evidence && fallback.evidence[id]) {
    return fallback.evidence[id];
  }
  return null;
}

export async function getGabesDossier() {
  const data = await fetchWithTimeout("/gabes");
  if (data) return data;
  const fallback = await loadFallbackData();
  return fallback ? fallback.gabes : null;
}

export async function getTimeline(month = "ALL", topic = "ALL") {
  let query = `/timeline?`;
  if (month && month !== "ALL") query += `month=${encodeURIComponent(month)}&`;
  if (topic && topic !== "ALL") query += `topic=${encodeURIComponent(topic)}&`;
  
  const data = await fetchWithTimeout(query);
  if (data) return data;
  return null; // Handled by timeline controller fallback
}

export async function getAccountability(category = "ALL") {
  let query = `/accountability`;
  if (category && category !== "ALL") query += `?category=${encodeURIComponent(category)}`;
  const data = await fetchWithTimeout(query);
  if (data) return data;
  return null;
}

export async function getStats() {
  return await fetchWithTimeout("/stats");
}

export function isUsingSnapshot() {
  return isSnapshotMode;
}
