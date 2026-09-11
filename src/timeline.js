// 404TN Summer 2026 Timeline Controller (src/timeline.js)
import { getTimeline } from './api.js';
import { escapeHtml, stripHtml } from './utils.js';
import { classificationBadge } from './editorial-components.js';

export async function initTimelineController() {
  const container = document.getElementById("timeline-events-container");
  const monthFilters = document.querySelectorAll("[data-timeline-month]");
  const topicSelect = document.getElementById("timeline-topic-select");

  if (!container) return;

  let activeMonth = "ALL";
  let activeTopic = "ALL";

  const render = async () => {
    container.innerHTML = `<div class="py-8 text-center text-xs font-mono text-paper-dim">Querying verified timeline events...</div>`;
    const events = await getTimeline(activeMonth, activeTopic);

    if (!events || events.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center text-paper-muted font-mono text-xs border border-dashed border-paper bg-white p-6">
          No documented events recorded for the selected filter combination.
        </div>
      `;
      return;
    }

    container.innerHTML = events.map(item => {
      const rawId = item.evidence_id || item.id || '';
      const evidenceId = escapeHtml(rawId);
      const date = escapeHtml(item.date || '2026');
      const topic = escapeHtml(item.topic || 'GOVERNANCE');
      
      const cleanTitle = escapeHtml(stripHtml(item.title || item.headline || 'Timeline Event'));
      const rawDesc = item.desc || item.summary || item.title || '';
      const cleanDesc = escapeHtml(stripHtml(rawDesc));
      const source = escapeHtml(stripHtml(item.source || item.source_name || 'VERIFIED SOURCE'));
      const institution = escapeHtml(stripHtml(item.institution || item.accountable_entity || 'State Utility / Ministry'));
      const classification = escapeHtml(item.classification || 'FACT');

      return `
        <div class="relative group space-y-3" id="${evidenceId}" data-evidence-id="${evidenceId}">
          <!-- Continuous Spine Node Dot -->
          <span class="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-paper-crimson"></span>

          <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div class="flex items-center gap-3 flex-wrap">
              <time class="text-xs sm:text-sm font-mono font-bold text-paper-crimson">${date}</time>
              <span class="text-[9px] font-mono uppercase px-2 py-0.5 bg-paper-subtle border border-paper text-paper-muted font-bold">${topic}</span>
              ${classificationBadge(classification, true)}
            </div>
            <div class="text-[10px] font-mono text-paper-dim">
              ID: <span class="text-paper-muted">${evidenceId}</span>
            </div>
          </div>

          <div class="space-y-1.5">
            <h3 class="font-editorial font-bold text-paper-primary text-lg sm:text-xl">${cleanTitle}</h3>
            <p class="text-xs sm:text-sm text-paper-muted font-light leading-relaxed max-w-4xl">${cleanDesc}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-paper/60 text-xs font-mono text-paper-dim">
            <div>
              INSTITUTION: <span class="text-paper-primary font-semibold">${institution}</span>
            </div>
            <div class="sm:text-right">
              SOURCE: <span class="text-paper-muted italic">${source}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  };

  monthFilters.forEach(btn => {
    btn.addEventListener("click", () => {
      monthFilters.forEach(b => {
        b.classList.remove("bg-paper-primary", "text-paper-bg-base", "border-paper-primary", "font-bold");
        b.classList.add("bg-white", "text-paper-muted", "border-paper");
      });
      btn.classList.add("bg-paper-primary", "text-paper-bg-base", "border-paper-primary", "font-bold");
      btn.classList.remove("bg-white", "text-paper-muted", "border-paper");
      activeMonth = btn.getAttribute("data-timeline-month");
      render();
    });
  });

  if (topicSelect) {
    topicSelect.addEventListener("change", (e) => {
      activeTopic = e.target.value;
      render();
    });
  }

  await render();
}
