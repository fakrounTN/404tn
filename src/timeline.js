// 404TN Summer 2026 Timeline Controller (src/timeline.js)
import { getTimeline } from './api.js';

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

    container.innerHTML = events.map(item => `
      <div class="group relative p-6 bg-background-subtle border border-surface-800 hover:border-surface-600 transition-all flex flex-col justify-between cursor-pointer" data-evidence-id="${item.evidence_id || item.id}">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="text-xs font-mono text-crimson font-medium tracking-meta">${item.date}</span>
            <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-surface-900 border border-surface-800 text-surface-400">${item.topic}</span>
          </div>
          <h4 class="font-sans font-semibold text-bone-100 text-sm mb-2 group-hover:text-crimson transition-colors">${item.title}</h4>
          <p class="text-xs text-surface-300 leading-relaxed font-light">${item.desc}</p>
        </div>
        <div class="mt-5 pt-3 border-t border-surface-800 flex items-center justify-between text-[10px] font-mono text-surface-400">
          <span class="truncate">SRC: ${item.source}</span>
          <span class="text-crimson select-none ml-2">↗</span>
        </div>
      </div>
    `).join("");
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
