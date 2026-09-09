// 404TN Summer 2026 Timeline Controller (src/timeline.js)
import { getTimeline } from './api.js';
import { escapeHtml, stripHtml } from './utils.js';

export async function initTimelineController() {
  const container = document.getElementById("timeline-events-container");
  const monthFilters = document.querySelectorAll("[data-timeline-month]");
  const topicSelect = document.getElementById("timeline-topic-select");

  if (!container) return;

  let activeMonth = "ALL";
  let activeTopic = "ALL";

  const render = async () => {
    container.innerHTML = `<div class="col-span-full py-8 text-center text-xs font-mono text-surface-500">Querying verified timeline events...</div>`;
    const events = await getTimeline(activeMonth, activeTopic);

    if (!events || events.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center text-surface-400 font-mono text-xs border border-dashed border-surface-800">
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
      
      // Sanitized plain text for headline and description
      const cleanTitle = escapeHtml(stripHtml(item.title || item.headline || 'Timeline Event'));
      const rawDesc = item.desc || item.summary || item.title || '';
      const cleanDesc = escapeHtml(stripHtml(rawDesc));
      const source = escapeHtml(stripHtml(item.source || item.source_name || 'VERIFIED SOURCE'));
      const classification = escapeHtml(item.classification || 'FACT');
      const status = escapeHtml(item.status || 'VERIFIED');

      return `
        <article class="timeline-card group relative p-5 sm:p-6 bg-background-subtle border border-surface-800 hover:border-surface-600 transition-all flex flex-col justify-between cursor-pointer w-full min-w-0 box-border hover:shadow-lg hover:shadow-black/40" data-evidence-id="${evidenceId}">
          <div class="min-w-0 w-full space-y-2.5">
            <!-- Header: Date & Topic Badge -->
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-mono text-crimson font-medium tracking-meta">${date}</span>
              <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-surface-900 border border-surface-800 text-surface-400 group-hover:border-surface-700 transition-colors">${topic}</span>
            </div>

            <!-- Headline: Clamped 2-3 lines max -->
            <h4 class="font-sans font-semibold text-bone-100 text-sm sm:text-base leading-snug group-hover:text-crimson transition-colors line-clamp-3 break-words">
              ${cleanTitle}
            </h4>

            <!-- Concise Summary: Clamped ~3 lines max -->
            <p class="text-xs text-surface-300 leading-relaxed font-light line-clamp-3 break-words">
              ${cleanDesc}
            </p>
          </div>

          <!-- Pinned Footer: Epistemic Status & Provenance -->
          <div class="mt-4 pt-3 border-t border-surface-800/80 flex items-center justify-between text-[10px] font-mono text-surface-400 min-w-0 gap-2">
            <div class="flex items-center gap-2 min-w-0 truncate">
              <span class="px-1.5 py-0.2 bg-surface-900 border border-surface-800 text-[9px] uppercase tracking-wider text-sand shrink-0">${classification}</span>
              <span class="truncate">SRC: ${source}</span>
            </div>
            <span class="text-crimson select-none shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform font-bold">↗</span>
          </div>
        </article>
      `;
    }).join("");
  };

  monthFilters.forEach(btn => {
    btn.addEventListener("click", () => {
      monthFilters.forEach(b => {
        b.classList.remove("bg-surface-800", "text-bone-100", "border-crimson");
        b.classList.add("text-surface-400", "border-surface-800");
      });
      btn.classList.add("bg-surface-800", "text-bone-100", "border-crimson");
      btn.classList.remove("text-surface-400", "border-surface-800");
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
