// 404TN Frontend API Client (src/api.js)
// Zero synthetic fallback. Every factual item streams from verified API endpoints.

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : (window.location.hostname === "localhost" && window.location.port === "3000" 
      ? "http://localhost:8000/api" 
      : "/api");

const REQUEST_TIMEOUT_MS = 4000;
let isLiveActive = false;

function updateStatusUIBadge(isLive, isOffline = false) {
  isLiveActive = isLive;
  const badge = document.getElementById("api-status-badge");
  if (badge) {
    if (isOffline) {
      badge.innerHTML = `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 border border-amber-800/60 bg-amber-950/40 text-amber-300 text-[10px] font-mono"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>API OFFLINE · BASELINE ONLY</span></span>`;
    } else if (isLive) {
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
      updateStatusUIBadge(true, false);
      return { ok: true, status: res.status, data: await res.json() };
    }
    return { ok: false, status: res.status, data: null };
  } catch (err) {
    clearTimeout(timer);
    updateStatusUIBadge(false, true);
    return { ok: false, status: 0, error: err.message, data: null };
  }
}

export async function getMapData() {
  const res = await fetchWithTimeout("/map");
  if (res.ok && res.data) return res.data;
  return { type: "FeatureCollection", features: [], locations: [] };
}

export async function getEvidence(id) {
  if (!id) return null;
  const res = await fetchWithTimeout(`/evidence/${encodeURIComponent(id)}`);
  if (res.ok && res.data) {
    return res.data;
  }
  if (res.status === 404) {
    return {
      error: "NOT_FOUND",
      id: id,
      headline: `Evidence Record Not Found: ${id}`,
      summary: "This evidence identifier does not exist in the canonical 404TN factual database.",
      classification: "UNAVAILABLE",
      status: "NO DATA",
      source_name: "404TN Archive",
      source_url: null
    };
  }
  return {
    error: "OFFLINE",
    id: id,
    headline: "Live Evidence Service Offline",
    summary: "Unable to retrieve evidence record from the live monitoring API. Please verify backend connectivity.",
    classification: "OFFLINE",
    status: "UNREACHABLE",
    source_name: "Local Service Check",
    source_url: null
  };
}

export async function getIssues() {
  const res = await fetchWithTimeout("/issues");
  if (res.ok && res.data) return res.data;
  return [];
}

export async function getIssueBySlug(slug) {
  if (!slug) return null;
  const res = await fetchWithTimeout(`/issues/${encodeURIComponent(slug)}`);
  if (res.ok && res.data) return res.data;
  return null;
}

export async function getGabesDossier() {
  const res = await fetchWithTimeout("/gabes");
  if (res.ok && res.data) return res.data;
  return null;
}

export async function getTimeline(month = "ALL", topic = "ALL") {
  let query = `/timeline?`;
  if (month && month !== "ALL") query += `month=${encodeURIComponent(month)}&`;
  if (topic && topic !== "ALL") query += `topic=${encodeURIComponent(topic)}&`;
  
  const res = await fetchWithTimeout(query);
  if (res.ok && res.data) return res.data;
  return [];
}

export async function getAccountability(category = "ALL") {
  let query = `/accountability`;
  if (category && category !== "ALL") query += `?category=${encodeURIComponent(category)}`;
  const res = await fetchWithTimeout(query);
  if (res.ok && res.data) return res.data;
  return [];
}

export async function getStats() {
  const res = await fetchWithTimeout("/stats");
  if (res.ok && res.data) return res.data;
  return null;
}

export function isLiveMonitoring() {
  return isLiveActive;
}
