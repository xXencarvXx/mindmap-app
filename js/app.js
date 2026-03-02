import { PROJECTS } from './data.js';
import { state, undoStack, positionUndoStack, positionOverrides, findNodeById, _nodeElements } from './state.js';
import { loadFromLocalStorage, loadPositionsFromLocalStorage, loadFromSupabase, setSupabaseContext, loadDarkMode, saveToLocalStorage, savePositionsToLocalStorage, snapshotOriginal, exportDiff, toggleDarkMode, showToast } from './persistence.js';
import { render, setOpenPanelFn, setAddProjectFn } from './render.js';
import { openPanel, closePanel, openPanelById, openLinkPopover, toggleChecklistItem, deleteChecklistItem, addChecklistItem, deleteLinkItem, addLinkItem, toggleLinkForm, removeSection, addSection, promptAddSubproject, deleteNode, addChildTo, promptAddProject, initChecklistDrag } from './modal.js';
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
  function restoreNode(snap, target) {
    target.title = snap.title;
    target.status = snap.status;
    target.description = snap.description;
    target.prerequisites = snap.prerequisites;
    target.blockers = snap.blockers;
    target.notes = snap.notes;
    target.checklist = snap.checklist;
    target.links = snap.links;
    if (snap.color !== undefined) target.color = snap.color;
    if (snap.abandonedReason !== undefined) target.abandonedReason = snap.abandonedReason;
    if (snap.children) {
      if (!target.children) target.children = [];
      for (const sc of snap.children) {
        const tc = target.children.find(c => c.id === sc.id);
        if (tc) restoreNode(sc, tc);
      }
      // Rebuild in snapshot order: restored existing + re-added deleted
      target.children = snap.children.map(sc =>
        target.children.find(c => c.id === sc.id) || sc
      );
    } else {
      delete target.children;
    }
  }
  if (undoStack.length === 0) return false;
  const snapshot = undoStack.pop();
  // Restore existing projects and re-add deleted ones
  for (const sp of snapshot) {
    const target = PROJECTS.find(p => p.id === sp.id);
    if (target) restoreNode(sp, target);
    else PROJECTS.push(sp);
  }
  // Remove projects added after snapshot
  for (let i = PROJECTS.length - 1; i >= 0; i--) {
    if (!snapshot.some(sp => sp.id === PROJECTS[i].id)) PROJECTS.splice(i, 1);
  }
  state._cachedSides = null;
  saveToLocalStorage();
  render();
  if (state.currentPanelNodeId) {
    const n = findNodeById(state.currentPanelNodeId);
    if (n) openPanel(n);
    else closePanel();
  }
  showToast("Annulé");
  return true;
}

// ──────────────────────────────────────────────
// WIRE UP: connect render.js to modal.js (avoid circular dep)
// ──────────────────────────────────────────────
setOpenPanelFn(openPanel);
setAddProjectFn(promptAddProject);

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
window.deleteNode = deleteNode;
window.addChildTo = addChildTo;
window.promptAddProject = promptAddProject;
window.closePanel = closePanel;
window.popUndo = popUndo;

const STATUS_COLORS = { done: "#10b981", in_progress: "#3b82f6", blocked: "#ef4444", not_started: "#9ca3af" };

// ──────────────────────────────────────────────
// AUTH UI
// ──────────────────────────────────────────────
function updateAuthUI(user, sb) {
  const btn = document.getElementById('btn-auth');
  if (!btn) return;
  btn.style.display = '';
  if (user) {
    const avatar = user.user_metadata?.avatar_url;
    if (avatar) {
      btn.innerHTML = `<img src="${avatar}" width="22" height="22" style="border-radius:50%">`;
    } else {
      const initial = (user.email || '?')[0].toUpperCase();
      btn.innerHTML = `<span style="width:22px;height:22px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600">${initial}</span>`;
    }
    btn.title = user.email + ' (cliquez pour déconnexion)';
    btn.onclick = () => sb.signOut();
  } else {
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    btn.title = 'Connexion';
    btn.onclick = () => sb.signInWithGoogle();
  }
}

function showLanding() {
  const landing = document.getElementById('landing');
  const app = document.getElementById('app');
  if (landing) landing.style.display = '';
  if (app) app.style.display = 'none';
}

function showApp() {
  const landing = document.getElementById('landing');
  const app = document.getElementById('app');
  if (landing) landing.style.display = 'none';
  if (app) app.style.display = '';
}

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
document.getElementById("btn-export").addEventListener("click", exportDiff);
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
// INIT (async for Supabase auth)
// ──────────────────────────────────────────────
async function init() {
  loadDarkMode();

  let user = null;
  let sb = null;

  // Try loading Supabase (dynamic import so CDN failure is graceful)
  try {
    sb = await import('./supabase.js');
    user = await sb.getUser();
  } catch (e) {
    console.warn('Supabase unavailable, offline mode:', e);
  }

  if (!user) {
    // Not logged in: show landing page
    showLanding();

    // Wire landing email/password form
    const authForm = document.getElementById('auth-form');
    const authMessage = document.getElementById('auth-message');
    if (authForm && sb) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const btn = document.getElementById('btn-sign-in');
        btn.disabled = true;
        btn.textContent = 'Connexion...';
        authMessage.textContent = '';

        const result = await sb.signInWithEmail(email, password);
        if (result.error) {
          authMessage.textContent = result.error;
          authMessage.className = 'landing-message error';
        } else if (result.needsConfirmation) {
          authMessage.textContent = 'Vérifiez votre email pour confirmer votre compte.';
          authMessage.className = 'landing-message success';
        }
        // If result.user, onAuthChange will handle the transition
        btn.disabled = false;
        btn.textContent = 'Connexion';
      });
    }

    // Listen for auth changes (user might sign in via redirect)
    if (sb) {
      sb.onAuthChange(async (u) => {
        if (u) {
          user = u;
          setSupabaseContext(sb, user);
          updateAuthUI(user, sb);
          showApp();
          snapshotOriginal();
          const loaded = await loadFromSupabase();
          if (!loaded) loadFromLocalStorage();
          loadPositionsFromLocalStorage();
          render();
          resetView();
          updateZoomLabel();
          initChecklistDrag();
          initKeyboard(popUndo, updateZoomLabel, openSearch, togglePresenter);
        }
      });
    }
    return;
  }

  // Logged in: show app directly
  setSupabaseContext(sb, user);
  updateAuthUI(user, sb);
  showApp();

  snapshotOriginal();
  const loaded = await loadFromSupabase();
  if (!loaded) loadFromLocalStorage();
  loadPositionsFromLocalStorage();
  render();
  resetView();
  updateZoomLabel();
  initChecklistDrag();
  initKeyboard(popUndo, updateZoomLabel, openSearch, togglePresenter);
}

init();

window._postRender = () => {
  if (activeFilters.size > 0) requestAnimationFrame(applyFilters);
};
