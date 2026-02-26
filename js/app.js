import { PROJECTS } from './data.js';
import { state, undoStack, positionUndoStack, positionOverrides, findNodeById, _nodeElements } from './state.js';
import { loadFromLocalStorage, loadPositionsFromLocalStorage, loadDarkMode, saveToLocalStorage, savePositionsToLocalStorage, exportJSON, toggleDarkMode, showToast } from './persistence.js';
import { render, setOpenPanelFn } from './render.js';
import { openPanel, closePanel, openPanelById, openLinkPopover, toggleChecklistItem, deleteChecklistItem, addChecklistItem, deleteLinkItem, addLinkItem, toggleLinkForm, removeSection, addSection, promptAddSubproject, initChecklistDrag } from './modal.js';
import { resetView, zoomIn, zoomOut, resetPositions, initKeyboard, panToNode } from './canvas.js';

// ──────────────────────────────────────────────
// UNDO (needs access to both render and modal)
// ──────────────────────────────────────────────
function popUndo() {
  // Position undo takes priority (most recent action)
  if (positionUndoStack.length > 0) {
    const snap = positionUndoStack.pop();
    for (const key in positionOverrides) delete positionOverrides[key];
    Object.assign(positionOverrides, snap);
    savePositionsToLocalStorage();
    render();
    return true;
  }
  if (undoStack.length === 0) return false;
  const snapshot = undoStack.pop();
  for (const sp of snapshot) {
    const target = PROJECTS.find(p => p.id === sp.id);
    if (!target) continue;
    target.status = sp.status;
    target.description = sp.description;
    target.prerequisites = sp.prerequisites;
    target.blockers = sp.blockers;
    target.notes = sp.notes;
    target.checklist = sp.checklist;
    target.links = sp.links;
    for (const sc of sp.children) {
      const tc = target.children.find(c => c.id === sc.id);
      if (!tc) continue;
      tc.status = sc.status;
      tc.description = sc.description;
      tc.prerequisites = sc.prerequisites;
      tc.blockers = sc.blockers;
      tc.notes = sc.notes;
      tc.checklist = sc.checklist;
      tc.links = sc.links;
    }
    target.children = target.children.filter(c => sp.children.some(sc => sc.id === c.id));
  }
  saveToLocalStorage();
  render();
  if (state.currentPanelNodeId) {
    const n = findNodeById(state.currentPanelNodeId);
    if (n) openPanel(n);
  }
  showToast("Annulé");
  return true;
}

// ──────────────────────────────────────────────
// WIRE UP: connect render.js to modal.js (avoid circular dep)
// ──────────────────────────────────────────────
setOpenPanelFn(openPanel);

// ──────────────────────────────────────────────
// EXPOSE GLOBALS (for inline onclick handlers in templates)
// ──────────────────────────────────────────────
window.toggleChecklistItem = toggleChecklistItem;
window.deleteChecklistItem = deleteChecklistItem;
window.addChecklistItem = addChecklistItem;
window.deleteLinkItem = deleteLinkItem;
window.addLinkItem = addLinkItem;
window.toggleLinkForm = toggleLinkForm;
window.removeSection = removeSection;
window.addSection = addSection;
window.openPanelById = openPanelById;
window.openLinkPopover = openLinkPopover;
window.promptAddSubproject = promptAddSubproject;
window.closePanel = closePanel;
window.popUndo = popUndo;

const STATUS_COLORS = { done: "#10b981", in_progress: "#3b82f6", blocked: "#ef4444", not_started: "#9ca3af" };

// ──────────────────────────────────────────────
// STATUS FILTERS (legend click)
// ──────────────────────────────────────────────
const activeFilters = new Set();

function applyFilters() {
  const body = document.body;
  document.querySelectorAll(".node").forEach(el => el.classList.remove("filter-match"));
  if (activeFilters.size === 0) {
    body.classList.remove("filter-active");
    return;
  }
  body.classList.add("filter-active");
  const matchedParents = new Set();
  document.querySelectorAll(".node[data-status]").forEach(el => {
    if (activeFilters.has(el.dataset.status)) {
      el.classList.add("filter-match");
      // Walk up to light parent project nodes
      let id = el.dataset.id;
      for (const p of PROJECTS) {
        if (hasDescendant(p, id)) { matchedParents.add(p.id); markAncestors(p, id, matchedParents); break; }
      }
    }
  });
  matchedParents.forEach(pid => {
    const info = _nodeElements[pid];
    if (info) info.el.classList.add("filter-match");
  });
}

function hasDescendant(node, id) {
  if (node.id === id) return true;
  if (!node.children) return false;
  return node.children.some(c => hasDescendant(c, id));
}

function markAncestors(node, targetId, set) {
  if (node.id === targetId) return true;
  if (!node.children) return false;
  for (const c of node.children) {
    if (markAncestors(c, targetId, set)) { set.add(node.id); return true; }
  }
  return false;
}

document.querySelectorAll("#legend .legend-item[data-filter]").forEach(item => {
  item.addEventListener("click", () => {
    const status = item.dataset.filter;
    if (activeFilters.has(status)) {
      activeFilters.delete(status);
      item.classList.remove("active");
    } else {
      activeFilters.add(status);
      item.classList.add("active");
    }
    applyFilters();
  });
});

// ──────────────────────────────────────────────
// SEARCH (Ctrl+K)
// ──────────────────────────────────────────────
const searchOverlay = document.getElementById("search-overlay");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
let searchSelectedIdx = -1;

function buildSearchIndex() {
  const items = [];
  function collect(list, parent) {
    for (const n of list) {
      items.push({ id: n.id, text: n.title, type: "node", status: n.status, parent });
      if (n.description) items.push({ id: n.id, text: n.description, label: n.title, type: "description", status: n.status, parent });
      if (n.blockers) items.push({ id: n.id, text: n.blockers, label: n.title, type: "blocker", status: n.status, parent });
      if (n.notes) items.push({ id: n.id, text: n.notes, label: n.title, type: "note", status: n.status, parent });
      if (n.checklist) for (const c of n.checklist) {
        if (c.text && !c.text.startsWith("──")) items.push({ id: n.id, text: c.text, label: n.title, type: "checklist", status: n.status, parent });
      }
      if (n.links) for (const l of n.links) {
        items.push({ id: n.id, text: l.text || l.url, label: n.title, type: "link", status: n.status, parent });
      }
      if (n.children) collect(n.children, n.title);
    }
  }
  collect(PROJECTS, null);
  return items;
}

function openSearch() {
  searchOverlay.classList.add("open");
  searchInput.value = "";
  searchResults.innerHTML = "";
  searchResults.classList.remove("has-results");
  searchSelectedIdx = -1;
  setTimeout(() => searchInput.focus(), 50);
}

function closeSearch() {
  searchOverlay.classList.remove("open");
}

const TYPE_ICONS = { node: "", description: "description", blocker: "blocker", note: "note", checklist: "checklist", link: "link" };

function renderSearchResults(query) {
  if (!query) {
    searchResults.innerHTML = "";
    searchResults.classList.remove("has-results");
    return;
  }
  const q = query.toLowerCase();
  const all = buildSearchIndex().filter(item => item.text.toLowerCase().includes(q));
  // Dedupe: keep first match per node, but prioritize node-title matches
  const seen = new Set();
  const deduped = [];
  for (const m of all) {
    if (m.type === "node") { deduped.push(m); seen.add(m.id); }
  }
  for (const m of all) {
    if (!seen.has(m.id)) { deduped.push(m); seen.add(m.id); }
  }
  const matches = deduped.slice(0, 10);
  if (matches.length === 0) {
    searchResults.innerHTML = "";
    searchResults.classList.remove("has-results");
    return;
  }
  searchResults.innerHTML = matches.map((m, i) => {
    const title = m.type === "node" ? m.text : m.label;
    const tag = m.type !== "node" ? `<span class="sr-type">${TYPE_ICONS[m.type]}</span>` : "";
    const snippet = m.type !== "node" ? `<span class="sr-snippet">${highlightSnippet(m.text, q)}</span>` : "";
    return `<div class="search-result${i === searchSelectedIdx ? " selected" : ""}" data-id="${m.id}">` +
      `<span class="sr-dot" style="background:${STATUS_COLORS[m.status] || "#9ca3af"}"></span>` +
      `<span class="sr-main">${title}${tag}</span>` +
      snippet +
      (m.parent ? `<span class="sr-parent">${m.parent}</span>` : "") +
      `</div>`;
  }).join("");
  searchResults.classList.add("has-results");

  searchResults.querySelectorAll(".search-result").forEach(el => {
    el.addEventListener("click", () => navigateToNode(el.dataset.id));
  });
}

function highlightSnippet(text, q) {
  const plain = text.replace(/<[^>]+>/g, "");
  const idx = plain.toLowerCase().indexOf(q);
  if (idx === -1) return plain.slice(0, 60);
  const start = Math.max(0, idx - 20);
  const end = Math.min(plain.length, idx + q.length + 30);
  const slice = (start > 0 ? "…" : "") + plain.slice(start, end) + (end < plain.length ? "…" : "");
  return slice;
}

function navigateToNode(id) {
  closeSearch();
  const info = _nodeElements[id];
  if (info) {
    panToNode(info.cx, info.cy);
    updateZoomLabel();
    info.el.style.transition = "box-shadow 0.3s";
    info.el.style.boxShadow = "0 0 0 3px #3b82f6";
    setTimeout(() => { info.el.style.boxShadow = ""; }, 1500);
  }
  const node = findNodeById(id);
  if (node) openPanel(node);
}

searchInput.addEventListener("input", () => {
  searchSelectedIdx = -1;
  renderSearchResults(searchInput.value);
});

searchInput.addEventListener("keydown", (e) => {
  const items = searchResults.querySelectorAll(".search-result");
  if (e.key === "ArrowDown") {
    e.preventDefault();
    searchSelectedIdx = Math.min(searchSelectedIdx + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle("selected", i === searchSelectedIdx));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    searchSelectedIdx = Math.max(searchSelectedIdx - 1, 0);
    items.forEach((el, i) => el.classList.toggle("selected", i === searchSelectedIdx));
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (searchSelectedIdx >= 0 && items[searchSelectedIdx]) {
      navigateToNode(items[searchSelectedIdx].dataset.id);
    } else if (items.length > 0) {
      navigateToNode(items[0].dataset.id);
    }
  } else if (e.key === "Escape") {
    closeSearch();
  }
});

searchOverlay.addEventListener("click", (e) => {
  if (e.target === searchOverlay) closeSearch();
});

document.getElementById("btn-search").addEventListener("click", openSearch);

// ──────────────────────────────────────────────
// PRESENTER MODE (F key)
// ──────────────────────────────────────────────
function togglePresenter() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    showToast("Plein écran (F pour quitter)");
  } else {
    document.exitFullscreen();
  }
}

document.getElementById("btn-presenter").addEventListener("click", togglePresenter);

// ──────────────────────────────────────────────
// WIRE UP STATIC HTML BUTTONS
// ──────────────────────────────────────────────
document.getElementById("detail-overlay").addEventListener("click", closePanel);
document.querySelector("#detail-panel .close-btn").addEventListener("click", closePanel);
document.getElementById("btn-zoom-in").addEventListener("click", () => { zoomIn(); updateZoomLabel(); });
document.getElementById("btn-zoom-out").addEventListener("click", () => { zoomOut(); updateZoomLabel(); });
document.getElementById("btn-reset-view").addEventListener("click", () => { resetView(); updateZoomLabel(); });
document.getElementById("btn-export").addEventListener("click", exportJSON);
document.getElementById("dark-toggle").addEventListener("click", toggleDarkMode);

function updateZoomLabel() {
  const el = document.getElementById("zoom-level");
  if (el) el.textContent = Math.round(state.scale * 100) + "%";
}

// Update zoom label on wheel
document.getElementById("canvas-wrapper").addEventListener("wheel", () => {
  requestAnimationFrame(updateZoomLabel);
}, { passive: true });

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
loadFromLocalStorage();
loadPositionsFromLocalStorage();
loadDarkMode();
render();
resetView();
updateZoomLabel();
initChecklistDrag();
initKeyboard(popUndo, updateZoomLabel, openSearch, togglePresenter);

window._postRender = () => {
  if (activeFilters.size > 0) requestAnimationFrame(applyFilters);
};
