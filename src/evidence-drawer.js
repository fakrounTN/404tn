// 404TN Deep Evidence Drawer (src/evidence-drawer.js)
import { getEvidence } from './api.js';

export function initEvidenceDrawer() {
  const drawer = document.getElementById("evidence-drawer-modal");
  const closeBtn = document.getElementById("close-evidence-drawer");
  if (!drawer) return;

  const close = () => {
    drawer.classList.remove("active");
    document.body.style.overflow = "";
  };

  if (closeBtn) closeBtn.addEventListener("click", close);
  drawer.addEventListener("click", (e) => {
    if (e.target === drawer) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("active")) close();
  });

  // Global trigger listener for any element with data-evidence-id
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-evidence-id]");
    if (trigger) {
      const evId = trigger.getAttribute("data-evidence-id");
      if (evId) {
        openEvidenceDrawer(evId);
      }
    }
  });
}

export async function openEvidenceDrawer(evidenceId) {
  const drawer = document.getElementById("evidence-drawer-modal");
  if (!drawer) return;

  const titleEl = document.getElementById("ed-title");
  const idEl = document.getElementById("ed-id");
  const classEl = document.getElementById("ed-classification");
  const statusEl = document.getElementById("ed-status");
  const freshnessEl = document.getElementById("ed-freshness");
  const statementEl = document.getElementById("ed-statement");
  const claimEl = document.getElementById("ed-claim");
  const sourceNameEl = document.getElementById("ed-source-name");
  const sourceTypeEl = document.getElementById("ed-source-type");
  const sourceUrlEl = document.getElementById("ed-source-url");
  const pubDateEl = document.getElementById("ed-pub-date");
  const eventDateEl = document.getElementById("ed-event-date");
  const metricEl = document.getElementById("ed-metric");
  const entityEl = document.getElementById("ed-entity");
  const outcomeEl = document.getElementById("ed-outcome");
  const confEl = document.getElementById("ed-confidence");

  // Show loading state
  if (titleEl) titleEl.textContent = "Retrieving verified evidence record...";
  drawer.classList.add("active");
  document.body.style.overflow = "hidden";

  const data = await getEvidence(evidenceId);

  if (!data) {
    if (titleEl) titleEl.textContent = `Evidence Record ${evidenceId}`;
    if (statementEl) statementEl.textContent = "Verified evidence document is currently under cryptographic archival review.";
    return;
  }

  if (titleEl) titleEl.textContent = data.headline;
  if (idEl) idEl.textContent = data.id;
  if (classEl) {
    classEl.textContent = data.classification;
    classEl.className = "px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold " + 
      (data.classification === "FACT" ? "bg-bone-100 text-background" : 
       data.classification === "CLAIM" ? "bg-sand text-background" : "bg-crimson text-white");
  }
  if (statusEl) {
    statusEl.textContent = data.status;
    let badge = "bg-surface-800 text-surface-300 border border-surface-700";
    if (data.status === "VERIFIED") badge = "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40";
    if (data.status === "HISTORICAL BASELINE") badge = "bg-amber-950/40 text-amber-300 border border-amber-800/40";
    if (data.status === "NO CURRENT DATA") badge = "bg-surface-900 text-surface-400 border border-surface-700";
    if (data.status === "ACTIVE FILE") badge = "bg-crimson/20 text-crimson border border-crimson/50";
    statusEl.className = `px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${badge}`;
  }
  if (freshnessEl) freshnessEl.textContent = data.freshness || "UPDATED < 24H";
  if (statementEl) statementEl.textContent = data.summary;
  if (claimEl) claimEl.textContent = data.claim || "None recorded";
  if (sourceNameEl) sourceNameEl.textContent = data.source_name;
  if (sourceTypeEl) sourceTypeEl.textContent = data.source_type;
  if (sourceUrlEl) {
    sourceUrlEl.href = data.source_url;
    sourceUrlEl.textContent = data.source_url;
  }
  if (pubDateEl) pubDateEl.textContent = data.published_at ? data.published_at.substring(0, 10) : "N/A";
  if (eventDateEl) eventDateEl.textContent = data.event_date || "N/A";
  if (metricEl) {
    if (data.metric_value) {
      metricEl.textContent = `${data.metric_value} ${data.metric_unit || ''} (${data.metric_period || ''})`;
    } else {
      metricEl.textContent = "N/A";
    }
  }
  if (entityEl) entityEl.textContent = data.government_entity || "N/A";
  if (outcomeEl) outcomeEl.textContent = data.outcome || "N/A";
  if (confEl) confEl.textContent = `${Math.round(data.evidence_confidence * 100)}% (Trust Weight: ${data.source_confidence})`;
}
