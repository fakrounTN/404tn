// 404TN State Response & Silence Matrix (src/accountability.js)
import { getAccountability } from './api.js';
import { escapeHtml, stripHtml } from './utils.js';

export async function initAccountabilityController() {
  const tableBody = document.getElementById("accountability-table-body");
  const cardsContainer = document.getElementById("accountability-cards-mobile");
  const filterButtons = document.querySelectorAll("[data-accountability-filter]");
  const searchInput = document.getElementById("accountability-search");

  if (!tableBody) return;

  let activeCategory = "ALL";
  let activeSearch = "";

  const getStatusBadge = (status) => {
    let badgeClass = "bg-surface-800 text-surface-300 border-surface-700";
    if (status === "FOLLOW-UP REQUIRED" || status === "Follow-up required") badgeClass = "bg-crimson/10 text-crimson border-crimson/40";
    if (status === "RESPONSE IDENTIFIED" || status === "Response identified") badgeClass = "bg-amber-950/40 text-amber-300 border-amber-800/40";
    if (status === "DOCUMENTING" || status === "Documenting") badgeClass = "bg-blue-950/40 text-blue-300 border-blue-800/40";
    if (status === "OUTCOME PENDING" || status === "Outcome pending") badgeClass = "bg-sand/10 text-sand border-sand/30";
    if (status === "NO PUBLIC RESPONSE RECORDED IN MONITORED SOURCES") badgeClass = "bg-surface-900 text-surface-400 border-surface-800";
    return `<span class="inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${badgeClass}">${escapeHtml(status)}</span>`;
  };

  const render = async () => {
    const rawItems = await getAccountability(activeCategory);
    if (!rawItems) return;

    let items = rawItems;
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      items = items.filter(it => 
        (it.topic || '').toLowerCase().includes(q) ||
        (it.what_happened || '').toLowerCase().includes(q) ||
        (it.gov_response || '').toLowerCase().includes(q) ||
        (it.pres_response || '').toLowerCase().includes(q) ||
        (it.outcome || '').toLowerCase().includes(q)
      );
    }

    if (items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="py-12 text-center text-surface-400 font-mono text-xs">No documented state responses matching your query.</td></tr>`;
      if (cardsContainer) cardsContainer.innerHTML = `<div class="py-8 text-center text-surface-400 font-mono text-xs border border-dashed border-surface-800">No records found.</div>`;
      return;
    }

    // Desktop Table
    tableBody.innerHTML = items.map(item => {
      const evId = escapeHtml(item.evidence_id || item.latest_evidence_id || '');
      const topic = escapeHtml(stripHtml(item.topic || ''));
      const category = escapeHtml(stripHtml(item.category || ''));
      const whatHappened = escapeHtml(stripHtml(item.what_happened || ''));
      const govResponse = escapeHtml(stripHtml(item.gov_response || ''));
      const presResponse = escapeHtml(stripHtml(item.pres_response || ''));
      const outcome = escapeHtml(stripHtml(item.outcome || ''));

      return `
        <tr class="border-b border-surface-800 hover:bg-surface-900/40 transition-colors group cursor-pointer" ${evId ? `data-evidence-id="${evId}"` : ''}>
          <td class="py-5 px-4 align-top w-1/5">
            <div class="font-sans font-semibold text-bone-100 text-sm group-hover:text-crimson transition-colors break-words">${topic}</div>
            <div class="text-[10px] font-mono tracking-meta uppercase text-surface-400 mt-1">${category}</div>
            <div class="mt-3">${getStatusBadge(item.status)}</div>
          </td>
          <td class="py-5 px-4 align-top text-xs text-surface-300 leading-relaxed w-1/5 border-l border-surface-800/60 font-light break-words">
            ${whatHappened}
          </td>
          <td class="py-5 px-4 align-top text-xs text-surface-300 leading-relaxed w-1/5 border-l border-surface-800/60 font-light break-words">
            ${govResponse}
          </td>
          <td class="py-5 px-4 align-top text-xs text-surface-300 leading-relaxed w-1/5 border-l border-surface-800/60 font-light break-words">
            ${presResponse}
          </td>
          <td class="py-5 px-4 align-top text-xs text-surface-300 leading-relaxed w-1/5 border-l border-surface-800/60 font-light break-words">
            ${outcome}
          </td>
        </tr>
      `;
    }).join("");

    // Mobile Cards
    if (cardsContainer) {
      cardsContainer.innerHTML = items.map(item => {
        const evId = escapeHtml(item.evidence_id || item.latest_evidence_id || '');
        const topic = escapeHtml(stripHtml(item.topic || ''));
        const category = escapeHtml(stripHtml(item.category || ''));
        const whatHappened = escapeHtml(stripHtml(item.what_happened || ''));
        const govResponse = escapeHtml(stripHtml(item.gov_response || ''));
        const presResponse = escapeHtml(stripHtml(item.pres_response || ''));
        const outcome = escapeHtml(stripHtml(item.outcome || ''));

        return `
          <div class="p-5 bg-background-subtle border border-surface-800 space-y-4 cursor-pointer" ${evId ? `data-evidence-id="${evId}"` : ''}>
            <div class="flex items-start justify-between gap-2 border-b border-surface-800 pb-3">
              <div>
                <span class="text-[10px] font-mono uppercase tracking-meta text-surface-400">${category}</span>
                <h4 class="font-sans font-semibold text-bone-100 text-base mt-0.5 break-words">${topic}</h4>
              </div>
              ${getStatusBadge(item.status)}
            </div>
            <div class="space-y-3 text-xs">
              <div>
                <span class="text-[10px] font-mono uppercase text-crimson block mb-1 font-semibold">What Happened:</span>
                <p class="text-surface-300 leading-relaxed font-light break-words">${whatHappened}</p>
              </div>
              <div>
                <span class="text-[10px] font-mono uppercase text-surface-400 block mb-1">Government Response:</span>
                <p class="text-surface-300 leading-relaxed font-light break-words">${govResponse}</p>
              </div>
              <div>
                <span class="text-[10px] font-mono uppercase text-surface-400 block mb-1">Presidential Response:</span>
                <p class="text-surface-300 leading-relaxed font-light break-words">${presResponse}</p>
              </div>
              <div class="pt-2 border-t border-surface-800/60">
                <span class="text-[10px] font-mono uppercase text-sand block mb-1 font-semibold">Documented Outcome:</span>
                <p class="text-surface-200 leading-relaxed font-medium break-words">${outcome}</p>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
  };

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => {
        b.classList.remove("bg-surface-800", "text-bone-100", "border-crimson");
        b.classList.add("text-surface-400", "border-surface-800");
      });
      btn.classList.add("bg-surface-800", "text-bone-100", "border-crimson");
      btn.classList.remove("text-surface-400", "border-surface-800");
      activeCategory = btn.getAttribute("data-accountability-filter");
      render();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      activeSearch = e.target.value.trim();
      render();
    });
  }

  await render();
}
