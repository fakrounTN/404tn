// 404TN Summer 2026 Timeline Controller (src/timeline.js)
import { getTimeline } from './api.js';
import { escapeHtml, stripHtml, extractUniqueImages } from './utils.js';

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
      
      // Sanitized plain text for headline and description (prevents DOM breakage & unclosed tags)
      const cleanTitle = escapeHtml(stripHtml(item.title || item.headline || 'Timeline Event'));
      const rawDesc = item.desc || item.summary || item.title || '';
      const cleanDesc = escapeHtml(stripHtml(rawDesc));
      const source = escapeHtml(stripHtml(item.source || item.source_name || 'VERIFIED SOURCE'));

      // Extract & deduplicate media URLs (ensures unique image rendering)
      const mediaUrls = extractUniqueImages(rawDesc, item.image_url || item.media_url);

      const mediaHtml = mediaUrls.length > 0 ? `
        <div class="mb-3 w-full overflow-hidden border border-surface-800 bg-surface-900/60">
          ${mediaUrls.length === 1 ? `
            <img src="${escapeHtml(mediaUrls[0])}" alt="${cleanTitle}" class="w-full h-44 object-cover" loading="lazy" onerror="this.closest('.mb-3')?.remove()" />
          ` : `
            <div class="grid grid-cols-2 gap-1">
              ${mediaUrls.slice(0, 2).map(url => `
                <img src="${escapeHtml(url)}" alt="${cleanTitle}" class="w-full h-28 object-cover" loading="lazy" onerror="this.remove()" />
              `).join('')}
            </div>
          `}
        </div>
      ` : '';

      return `
        <article class="timeline-card group relative p-6 bg-background-subtle border border-surface-800 hover:border-surface-600 transition-all flex flex-col justify-between cursor-pointer w-full min-w-0 box-border" data-evidence-id="${evidenceId}">
          <div class="min-w-0 w-full">
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="text-xs font-mono text-crimson font-medium tracking-meta">${date}</span>
              <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-surface-900 border border-surface-800 text-surface-400">${topic}</span>
            </div>
            ${mediaHtml}
            <h4 class="font-sans font-semibold text-bone-100 text-sm mb-2 group-hover:text-crimson transition-colors break-words">${cleanTitle}</h4>
            <p class="text-xs text-surface-300 leading-relaxed font-light break-words">${cleanDesc}</p>
          </div>
          <div class="mt-5 pt-3 border-t border-surface-800 flex items-center justify-between text-[10px] font-mono text-surface-400 min-w-0">
            <span class="truncate">SRC: ${source}</span>
            <span class="text-crimson select-none ml-2 shrink-0">↗</span>
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
