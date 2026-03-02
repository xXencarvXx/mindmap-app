import { PROJECTS, STATUS_LABELS } from './data.js';
import { state, positionOverrides, findNodeById, findParentOf, pushUndo, escapeHtml } from './state.js';
import { saveToLocalStorage, showToast } from './persistence.js';
import { render } from './render.js';

// ──────────────────────────────────────────────
// SELECTION HELPERS
// ──────────────────────────────────────────────
function saveSelection() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) state._savedRange = sel.getRangeAt(0).cloneRange();
}

function restoreSelection() {
  if (state._savedRange) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(state._savedRange);
  }
}

function getParentAnchor() {
  const sel = window.getSelection();
  if (!sel.rangeCount) return null;
  let node = sel.anchorNode;
  while (node && node.nodeType !== 1) node = node.parentNode;
  while (node && node.tagName !== "A") node = node.parentNode;
  return node;
}

// ──────────────────────────────────────────────
// LINK POPOVER
// ──────────────────────────────────────────────
function createLinkPopover() {
  const popover = document.createElement("div");
  popover.className = "link-popover";
  popover.innerHTML = `
    <label>Lien <span class="required">*</span></label>
    <input type="url" class="link-url" placeholder="Coller un lien">
    <label>Texte d'affichage (optionnel)</label>
    <input type="text" class="link-text" placeholder="">
    <div class="hint">Titre ou description du lien</div>
    <div class="popover-actions">
      <button class="btn-cancel" type="button">Annuler</button>
      <button class="btn-insert" type="button">Insérer</button>
    </div>
  `;
  document.body.appendChild(popover);

  popover.querySelector(".btn-cancel").addEventListener("click", () => {
    popover.classList.remove("visible");
  });

  popover.querySelector(".btn-insert").addEventListener("click", () => {
    const url = popover.querySelector(".link-url").value.trim();
    const text = popover.querySelector(".link-text").value.trim();
    if (!url) return;
    restoreSelection();
    if (text && !window.getSelection().toString()) {
      document.execCommand("insertHTML", false, `<a href="${url}" target="_blank">${text}</a>`);
    } else {
      document.execCommand("createLink", false, url);
    }
    popover.classList.remove("visible");
    if (state._linkEditorEl) {
      const field = state._linkEditorEl.id.replace("field-", "");
      const n = findNodeById(state.currentPanelNodeId);
      if (n) { n[field] = state._linkEditorEl.innerHTML; saveToLocalStorage(); }
    }
  });

  popover.querySelector(".link-url").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); popover.querySelector(".btn-insert").click(); }
  });

  return popover;
}

export function openLinkPopover(editorEl) {
  const existing = getParentAnchor();
  if (existing) {
    document.execCommand("unlink");
    return;
  }
  saveSelection();
  state._linkEditorEl = editorEl;
  const sel = window.getSelection();
  const selectedText = sel.toString();
  if (!state._linkPopover) state._linkPopover = createLinkPopover();
  state._linkPopover.querySelector(".link-url").value = "";
  state._linkPopover.querySelector(".link-text").value = selectedText;
  state._linkPopover.classList.add("visible");
  state._linkPopover.querySelector(".link-url").focus();
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
function hasContent(val) {
  if (!val) return false;
  if (typeof val === "string") {
    const stripped = val.replace(/<[^>]*>/g, "").trim();
    return stripped.length > 0;
  }
  if (Array.isArray(val)) return val.length > 0;
  return false;
}

function richEditorHTML(id, extraClass, placeholder, content) {
  const cls = "rich-editor" + (extraClass ? " " + extraClass : "");
  return `<div class="${cls}">
    <div class="rich-toolbar">
      <button onmousedown="event.preventDefault();document.execCommand('bold')" title="Gras"><svg viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/></svg></button>
      <button onmousedown="event.preventDefault();document.execCommand('italic')" title="Italique"><svg viewBox="0 0 24 24"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></button>
      <span class="sep"></span>
      <button onmousedown="event.preventDefault();document.execCommand('insertUnorderedList')" title="Liste"><svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6" stroke-width="3"/><line x1="3" y1="12" x2="3.01" y2="12" stroke-width="3"/><line x1="3" y1="18" x2="3.01" y2="18" stroke-width="3"/></svg></button>
      <button onmousedown="event.preventDefault();openLinkPopover(document.getElementById('${id}'))" title="Lien"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
    </div>
    <div class="rich-body" id="${id}" contenteditable="true" data-placeholder="${placeholder}">${content || ""}</div>
  </div>`;
}

function sectionHeaderHTML(label, sectionKey) {
  return `<div class="section-header">
    <div class="section-label">${label}</div>
    <button class="remove-section" onclick="removeSection('${sectionKey}')" title="Supprimer">
      <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>`;
}

function buildChecklistHTML(checklist) {
  const items = checklist || [];
  const isSep = t => t.startsWith("──") || t.startsWith("--");
  const realItems = items.filter(i => !isSep(i.text));
  const realDone = realItems.filter(i => i.done).length;
  const realTotal = realItems.length;
  const pct = realTotal > 0 ? Math.round((realDone / realTotal) * 100) : 0;
  let html = `<div class="checklist-section">`;
  html += `<div class="checklist-progress-label">${realDone}/${realTotal} terminé${realDone > 1 ? "s" : ""}</div>`;
  html += `<div class="checklist-progress"><div class="checklist-progress-bar" style="width:${pct}%"></div></div>`;
  html += `<div class="checklist-items">`;
  const gripSVG = `<span class="drag-handle" title="Glisser pour réordonner"><svg viewBox="0 0 16 16"><circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/></svg></span>`;
  items.forEach((item, idx) => {
    if (isSep(item.text)) {
      const label = item.text.replace(/^[─\-\s]+|[─\-\s]+$/g, "").trim();
      html += `<div class="checklist-item phase-separator" data-idx="${idx}">${gripSVG}<span class="phase-label">${escapeHtml(label)}</span></div>`;
    } else {
      html += `<div class="checklist-item" data-idx="${idx}">`;
      html += gripSVG;
      html += `<input type="checkbox" ${item.done ? "checked" : ""} onchange="toggleChecklistItem(${idx})">`;
      html += `<span class="item-text ${item.done ? "checked" : ""}" contenteditable="true" data-idx="${idx}">${escapeHtml(item.text)}</span>`;
      html += `<button class="delete-item" onclick="deleteChecklistItem(${idx})" title="Supprimer"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
      html += `</div>`;
    }
  });
  html += `</div>`;
  html += `<div class="checklist-add"><input type="text" placeholder="Ajouter un \u00e9l\u00e9ment..." onkeydown="if(event.key==='Enter'){addChecklistItem(this);event.preventDefault();}"></div>`;
  html += `</div>`;
  return html;
}

function buildLinksHTML(links) {
  const items = links || [];
  let html = `<div class="links-section">`;
  for (let i = 0; i < items.length; i++) {
    const link = items[i];
    const displayUrl = link.url.replace(/^https?:\/\//, "").substring(0, 50);
    const faviconUrl = "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(link.url) + "&sz=32";
    html += `<div class="link-row" data-idx="${i}">`;
    html += `<img class="link-favicon" src="${faviconUrl}" alt="" onerror="this.style.display='none'">`;
    html += `<div class="link-info">`;
    html += `<div class="link-title"><a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.text || link.url)}</a></div>`;
    html += `<div class="link-url-display">${escapeHtml(displayUrl)}</div>`;
    html += `</div>`;
    html += `<button class="delete-link" onclick="deleteLinkItem(${i})" title="Supprimer"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
    html += `</div>`;
  }
  html += `<button class="links-add-toggle" onclick="toggleLinkForm()">`;
  html += `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
  html += ` Ajouter un lien</button>`;
  html += `<div class="links-add" style="display:none;">`;
  html += `<input type="url" id="link-add-url" placeholder="https://...">`;
  html += `<input type="text" id="link-add-title" placeholder="Titre (optionnel)">`;
  html += `<button onclick="addLinkItem()">Ajouter</button>`;
  html += `<button class="links-add-cancel" onclick="toggleLinkForm()" title="Annuler"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
  html += `</div>`;
  html += `</div>`;
  return html;
}

function addBarHTML(node) {
  const buttons = [];
  if (!hasContent(node.blockers)) {
    buttons.push(`<button onclick="addSection('blockers')"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Bloqueurs</button>`);
  }
  if (!hasContent(node.checklist)) {
    buttons.push(`<button onclick="addSection('checklist')"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="M13 6h8"/><path d="M13 12h8"/><rect x="3" y="13" width="6" height="6" rx="1"/><path d="M13 18h8"/></svg> Checklist</button>`);
  }
  if (!hasContent(node.links)) {
    buttons.push(`<button onclick="addSection('links')"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Lien</button>`);
  }
  if (!hasContent(node.notes)) {
    buttons.push(`<button onclick="addSection('notes')"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Notes</button>`);
  }
  if (buttons.length === 0) return "";
  return `<div class="add-bar">${buttons.join("")}</div>`;
}

// ──────────────────────────────────────────────
// CONFIRM DIALOG
// ──────────────────────────────────────────────
function showConfirm(title, msg, onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.innerHTML = `<div class="confirm-box">
    <div class="confirm-title">${title}</div>
    <div class="confirm-msg">${msg}</div>
    <div class="confirm-actions">
      <button class="btn-cancel">Annuler</button>
      <button class="btn-danger">Supprimer</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector(".btn-cancel").onclick = () => overlay.remove();
  overlay.querySelector(".btn-danger").onclick = () => { overlay.remove(); onConfirm(); };
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
}

function showPrompt(title, placeholder, onSubmit) {
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.innerHTML = `<div class="confirm-box">
    <div class="confirm-title">${title}</div>
    <input type="text" class="project-name-input" placeholder="${placeholder}" autofocus>
    <div class="confirm-actions">
      <button class="btn-cancel">Annuler</button>
      <button class="btn-create">OK</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  const input = overlay.querySelector(".project-name-input");
  setTimeout(() => input.focus(), 50);
  const submit = () => {
    const val = input.value.trim();
    if (!val) { input.focus(); return; }
    overlay.remove();
    onSubmit(val);
  };
  overlay.querySelector(".btn-cancel").onclick = () => overlay.remove();
  overlay.querySelector(".btn-create").onclick = submit;
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") overlay.remove(); });
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
}

// ──────────────────────────────────────────────
// SECTION MANAGEMENT
// ──────────────────────────────────────────────
export function removeSection(key) {
  const n = findNodeById(state.currentPanelNodeId);
  if (!n) return;
  const labels = { blockers: "Bloqueurs", checklist: "Checklist", links: "Liens", notes: "Notes" };
  const has = (key === "checklist" && n.checklist && n.checklist.length > 0)
    || (key === "links" && n.links && n.links.length > 0)
    || (key === "blockers" && n.blockers)
    || (key === "notes" && n.notes);
  const doRemove = () => {
    pushUndo();
    if (key === "blockers") n.blockers = "";
    else if (key === "checklist") n.checklist = [];
    else if (key === "links") n.links = [];
    else if (key === "notes") n.notes = "";
    if (n._showSections) n._showSections.delete(key);
    saveToLocalStorage();
    openPanel(n);
  };
  if (has) {
    showConfirm("Supprimer " + labels[key] + " ?", "Cette action supprimera tout le contenu de cette section.", doRemove);
  } else {
    doRemove();
  }
}

export function addSection(key) {
  const n = findNodeById(state.currentPanelNodeId);
  if (!n) return;
  if (key === "checklist" && !n.checklist) n.checklist = [];
  if (key === "links" && !n.links) n.links = [];
  if (!n._showSections) n._showSections = new Set();
  n._showSections.add(key);
  saveToLocalStorage();
  openPanel(n);
}

// ──────────────────────────────────────────────
// CHECKLIST & LINKS ACTIONS
// ──────────────────────────────────────────────
function autoStatusFromChecklist(n) {
  if (!n || !n.checklist || n.checklist.length === 0) return;
  if (n.blockers) return;
  const isSep = t => t.startsWith("──") || t.startsWith("--");
  const real = n.checklist.filter(i => !isSep(i.text));
  if (real.length === 0) return;
  const done = real.filter(i => i.done).length;
  if (done === 0) n.status = "not_started";
  else if (done === real.length) n.status = "done";
  else n.status = "in_progress";
}

export function toggleChecklistItem(idx) {
  const n = findNodeById(state.currentPanelNodeId);
  if (!n || !n.checklist || !n.checklist[idx]) return;
  pushUndo();
  n.checklist[idx].done = !n.checklist[idx].done;
  autoStatusFromChecklist(n);
  saveToLocalStorage();
  openPanel(n);
}

export function deleteChecklistItem(idx) {
  const n = findNodeById(state.currentPanelNodeId);
  if (!n || !n.checklist) return;
  pushUndo();
  n.checklist.splice(idx, 1);
  saveToLocalStorage();
  openPanel(n);
}

export function addChecklistItem(input) {
  const text = input.value.trim();
  if (!text) return;
  const n = findNodeById(state.currentPanelNodeId);
  if (!n) return;
  pushUndo();
  if (!n.checklist) n.checklist = [];
  n.checklist.push({ text, done: false });
  saveToLocalStorage();
  openPanel(n);
}

export function deleteLinkItem(idx) {
  const n = findNodeById(state.currentPanelNodeId);
  if (!n || !n.links) return;
  pushUndo();
  n.links.splice(idx, 1);
  saveToLocalStorage();
  openPanel(n);
}

export function toggleLinkForm() {
  const form = document.querySelector(".links-add");
  const btn = document.querySelector(".links-add-toggle");
  if (!form) return;
  const isHidden = form.style.display === "none";
  form.style.display = isHidden ? "" : "none";
  if (btn) btn.style.display = isHidden ? "none" : "";
  if (isHidden) {
    const urlInput = document.getElementById("link-add-url");
    if (urlInput) urlInput.focus();
  }
}

export function addLinkItem() {
  const urlInput = document.getElementById("link-add-url");
  const titleInput = document.getElementById("link-add-title");
  const url = urlInput.value.trim();
  if (!url) return;
  const text = titleInput.value.trim();
  const n = findNodeById(state.currentPanelNodeId);
  if (!n) return;
  pushUndo();
  if (!n.links) n.links = [];
  n.links.push({ url, text: text || "" });
  saveToLocalStorage();
  openPanel(n);
}

// ──────────────────────────────────────────────
// CHECKLIST DRAG REORDER
// ──────────────────────────────────────────────
function clDragStart(e) {
  const handle = e.target.closest(".drag-handle");
  if (!handle) return;
  const item = handle.closest(".checklist-item");
  if (!item) return;
  e.preventDefault();
  const idx = parseInt(item.dataset.idx);
  const container = item.closest(".checklist-items");
  if (!container) return;

  const rect = item.getBoundingClientRect();
  state.clDrag = {
    idx,
    el: item,
    container,
    startY: (e.touches ? e.touches[0] : e).clientY,
    itemH: rect.height,
    moved: false
  };
  item.classList.add("dragging");

  window.addEventListener("mousemove", clDragMove);
  window.addEventListener("mouseup", clDragEnd);
  window.addEventListener("touchmove", clDragMove, { passive: false });
  window.addEventListener("touchend", clDragEnd);
}

function clDragMove(e) {
  if (!state.clDrag) return;
  e.preventDefault();
  const clientY = (e.touches ? e.touches[0] : e).clientY;
  const dy = clientY - state.clDrag.startY;
  if (!state.clDrag.moved && Math.abs(dy) < 4) return;
  state.clDrag.moved = true;

  const old = state.clDrag.container.querySelector(".checklist-drop-indicator");
  if (old) old.remove();

  const items = Array.from(state.clDrag.container.querySelectorAll(".checklist-item"));
  let targetIdx = state.clDrag.idx;
  for (let i = 0; i < items.length; i++) {
    const r = items[i].getBoundingClientRect();
    const mid = r.top + r.height / 2;
    if (clientY < mid) { targetIdx = i; break; }
    targetIdx = i + 1;
  }
  state.clDrag.targetIdx = targetIdx;

  const indicator = document.createElement("div");
  indicator.className = "checklist-drop-indicator";
  if (targetIdx < items.length) {
    state.clDrag.container.insertBefore(indicator, items[targetIdx]);
  } else {
    state.clDrag.container.appendChild(indicator);
  }
}

function clDragEnd() {
  if (!state.clDrag) return;
  window.removeEventListener("mousemove", clDragMove);
  window.removeEventListener("mouseup", clDragEnd);
  window.removeEventListener("touchmove", clDragMove);
  window.removeEventListener("touchend", clDragEnd);

  state.clDrag.el.classList.remove("dragging");
  const old = state.clDrag.container.querySelector(".checklist-drop-indicator");
  if (old) old.remove();

  if (state.clDrag.moved && state.clDrag.targetIdx !== undefined && state.clDrag.targetIdx !== state.clDrag.idx) {
    const n = findNodeById(state.currentPanelNodeId);
    if (n && n.checklist) {
      let from = state.clDrag.idx;
      let to = state.clDrag.targetIdx;
      pushUndo();
      const [moved] = n.checklist.splice(from, 1);
      if (to > from) to--;
      n.checklist.splice(to, 0, moved);
      saveToLocalStorage();
      openPanel(n);
    }
  }
  state.clDrag = null;
}

export function initChecklistDrag() {
  const panel = document.getElementById("detail-panel");
  panel.addEventListener("mousedown", clDragStart);
  panel.addEventListener("touchstart", clDragStart, { passive: false });
}

// ──────────────────────────────────────────────
// ADD SUB-PROJECT
// ──────────────────────────────────────────────
export function promptAddSubproject() {
  const nodeId = state.currentPanelNodeId;
  showPrompt("Nouveau sous-projet", "Nom du sous-projet", (title) => {
    const node = findNodeById(nodeId);
    if (!node) return;
    pushUndo();
    if (!node.children) node.children = [];
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "") + "-" + Date.now();
    node.children.push({
      id, title, status: "not_started",
      description: "", blockers: "", notes: "",
      checklist: [], links: []
    });
    state._cachedSides = null;
    for (const key in positionOverrides) delete positionOverrides[key];
    import('./persistence.js').then(m => m.savePositionsToLocalStorage());
    saveToLocalStorage();
    render();
    openPanel(node);
  });
}

// ──────────────────────────────────────────────
// DELETE NODE (works from canvas hover or panel)
// ──────────────────────────────────────────────
export function deleteNode(nodeId) {
  const id = nodeId || state.currentPanelNodeId;
  const node = findNodeById(id);
  if (!node) return;
  const info = findParentOf(id);
  if (!info) return;
  const childCount = node.children ? node.children.length : 0;
  const msg = childCount > 0
    ? `"${node.title}" et ses ${childCount} sous-projet${childCount > 1 ? "s" : ""} seront supprimés.`
    : `"${node.title}" sera supprimé.`;
  showConfirm("Supprimer ce noeud ?", msg, () => {
    pushUndo();
    info.array.splice(info.index, 1);
    state._cachedSides = null;
    for (const key in positionOverrides) delete positionOverrides[key];
    import('./persistence.js').then(m => m.savePositionsToLocalStorage());
    if (state.currentPanelNodeId === id) closePanel();
    saveToLocalStorage();
    render();
    showToast("Noeud supprimé");
  });
}

// ──────────────────────────────────────────────
// ADD CHILD TO NODE (works from canvas hover)
// ──────────────────────────────────────────────
export function addChildTo(nodeId) {
  showPrompt("Nouveau sous-projet", "Nom du sous-projet", (title) => {
    const node = findNodeById(nodeId);
    if (!node) return;
    pushUndo();
    if (!node.children) node.children = [];
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "") + "-" + Date.now();
    node.children.push({
      id, title, status: "not_started",
      description: "", blockers: "", notes: "",
      checklist: [], links: []
    });
    state._cachedSides = null;
    for (const key in positionOverrides) delete positionOverrides[key];
    import('./persistence.js').then(m => m.savePositionsToLocalStorage());
    saveToLocalStorage();
    render();
  });
}

// ──────────────────────────────────────────────
// ADD TOP-LEVEL PROJECT
// ──────────────────────────────────────────────
const PROJECT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

export function promptAddProject() {
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  const usedColors = new Set(PROJECTS.map(p => p.color));
  const defaultColor = PROJECT_COLORS.find(c => !usedColors.has(c)) || PROJECT_COLORS[0];
  let selectedColor = defaultColor;
  const swatches = PROJECT_COLORS.map(c =>
    `<button class="color-swatch${c === selectedColor ? " active" : ""}" data-color="${c}" style="background:${c}"></button>`
  ).join("");
  overlay.innerHTML = `<div class="confirm-box">
    <div class="confirm-title">Nouveau projet</div>
    <input type="text" class="project-name-input" placeholder="Nom du projet" autofocus>
    <div class="color-swatches">${swatches}</div>
    <div class="confirm-actions">
      <button class="btn-cancel">Annuler</button>
      <button class="btn-create">Créer</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);

  const input = overlay.querySelector(".project-name-input");
  setTimeout(() => input.focus(), 50);

  overlay.querySelectorAll(".color-swatch").forEach(btn => {
    btn.addEventListener("click", () => {
      overlay.querySelector(".color-swatch.active")?.classList.remove("active");
      btn.classList.add("active");
      selectedColor = btn.dataset.color;
    });
  });

  const doCreate = () => {
    const title = input.value.trim();
    if (!title) { input.focus(); return; }
    overlay.remove();
    pushUndo();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "") + "-" + Date.now();
    PROJECTS.push({
      id, title, color: selectedColor, status: "not_started",
      description: "", blockers: "", notes: "",
      checklist: [], links: [], children: []
    });
    state._cachedSides = null;
    for (const key in positionOverrides) delete positionOverrides[key];
    import('./persistence.js').then(m => m.savePositionsToLocalStorage());
    saveToLocalStorage();
    render();
    showToast("Projet créé");
  };

  overlay.querySelector(".btn-cancel").onclick = () => overlay.remove();
  overlay.querySelector(".btn-create").onclick = doCreate;
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") doCreate(); });
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
}

// ──────────────────────────────────────────────
// OPEN / CLOSE PANEL
// ──────────────────────────────────────────────
export function openPanelById(id) {
  const node = findNodeById(id);
  if (node) openPanel(node);
}

export function openPanel(node) {
  state.currentPanelNodeId = node.id;
  const panel = document.getElementById("detail-panel");
  const titleEl = document.getElementById("panel-title");
  titleEl.textContent = node.title;
  titleEl.contentEditable = "true";
  titleEl.spellcheck = false;
  titleEl._originalTitle = node.title;
  titleEl.onblur = () => {
    const newTitle = titleEl.textContent.trim();
    if (newTitle && newTitle !== titleEl._originalTitle) {
      pushUndo();
      node.title = newTitle;
      titleEl._originalTitle = newTitle;
      saveToLocalStorage();
      render();
    } else if (!newTitle) {
      titleEl.textContent = titleEl._originalTitle;
    }
  };
  titleEl.onkeydown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); titleEl.blur(); }
  };

  const STATUS_COLORS = { done: "#059669", in_progress: "#2563eb", blocked: "#dc2626", not_started: "#9ca3af" };
  const isProject = PROJECTS.some(p => p.id === node.id);
  const statusEl = document.getElementById("panel-status");
  statusEl.className = "panel-status";
  if (isProject) {
    statusEl.innerHTML = "";
  } else {
    statusEl.innerHTML = `<div class="status-pill ${node.status}" id="status-pill">
      <span class="status-dot-pill"></span>
      <span>${STATUS_LABELS[node.status]}</span>
      <svg class="status-chevron" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
    </div>`;
    const pill = document.getElementById("status-pill");
    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      const existing = document.querySelector(".status-dropdown");
      if (existing) { existing.remove(); pill.classList.remove("open"); return; }
      pill.classList.add("open");
      let dd = document.createElement("div");
      dd.className = "status-dropdown";
      for (const [val, label] of Object.entries(STATUS_LABELS)) {
        dd.innerHTML += `<div class="status-option ${val === node.status ? "active" : ""}" data-val="${val}">
          <span class="opt-dot" style="background:${STATUS_COLORS[val]}"></span>${label}
        </div>`;
      }
      statusEl.appendChild(dd);
      dd.querySelectorAll(".status-option").forEach(opt => {
        opt.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const n = findNodeById(state.currentPanelNodeId);
          if (n) { pushUndo(); n.status = opt.dataset.val; saveToLocalStorage(); render(); openPanel(n); }
        });
      });
      const closeDD = (ev) => { if (!statusEl.contains(ev.target)) { dd.remove(); pill.classList.remove("open"); document.removeEventListener("click", closeDD); } };
      setTimeout(() => document.addEventListener("click", closeDD), 0);
    });
  }

  if (!node.checklist) node.checklist = [];
  if (!node.links) node.links = [];
  if (node.notes === undefined) node.notes = "";

  const showBlockers = hasContent(node.blockers) || (node._showSections && node._showSections.has("blockers"));
  const showChecklist = hasContent(node.checklist) || (node._showSections && node._showSections.has("checklist"));
  const showLinks = hasContent(node.links) || (node._showSections && node._showSections.has("links"));
  const showNotes = hasContent(node.notes) || (node._showSections && node._showSections.has("notes"));

  let bodyHTML = "";

  bodyHTML += `<div class="section-label" style="margin-top:12px;">Description</div>`;
  bodyHTML += richEditorHTML("field-description", "", "Ajouter une description...", node.description || "");

  if (node.prerequisites) {
    bodyHTML += `<div class="section-label" style="margin-top:16px;color:#3b82f6;text-transform:none;">Prérequis</div>`;
    bodyHTML += `<div class="prerequisites-box">`;
    bodyHTML += `<svg class="prereq-icon" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>`;
    let prereqHTML = escapeHtml(node.prerequisites);
    function collectAllNodes(nodes) {
      let all = [];
      for (const n of nodes) {
        all.push(n);
        if (n.children) all = all.concat(collectAllNodes(n.children));
      }
      return all;
    }
    for (const n of collectAllNodes(PROJECTS)) {
      if (n.id === node.id) continue;
      const escaped = escapeHtml(n.title);
      if (prereqHTML.includes(escaped)) {
        prereqHTML = prereqHTML.replace(escaped, `<a class="prereq-link" href="#" onclick="event.preventDefault();openPanelById('${n.id}')">${escaped}</a>`);
      }
    }
    bodyHTML += `<span class="prereq-text" id="field-prerequisites">${prereqHTML}</span>`;
    bodyHTML += `</div>`;
  }

  if (node.status === 'abandoned' && hasContent(node.abandonedReason)) {
    bodyHTML += `<div class="section-label" style="margin-top:16px;color:#1e1e1e;text-transform:none;">Raison d'abandon</div>`;
    bodyHTML += `<div class="abandoned-box">${node.abandonedReason}</div>`;
  }

  if (showBlockers) {
    bodyHTML += sectionHeaderHTML("Bloqueurs", "blockers");
    bodyHTML += richEditorHTML("field-blockers", "blocker-editor", "Aucun bloqueur", node.blockers || "");
  }

  if (showChecklist) {
    bodyHTML += sectionHeaderHTML("Checklist", "checklist");
    bodyHTML += buildChecklistHTML(node.checklist);
  }

  if (showLinks) {
    bodyHTML += sectionHeaderHTML("Liens", "links");
    bodyHTML += buildLinksHTML(node.links);
  }

  if (showNotes) {
    bodyHTML += sectionHeaderHTML("Notes", "notes");
    bodyHTML += richEditorHTML("field-notes", "", "Notes diverses...", node.notes || "");
  }

  const addBarNode = {
    blockers: showBlockers ? "shown" : "",
    checklist: showChecklist ? [1] : [],
    links: showLinks ? [1] : [],
    notes: showNotes ? "shown" : ""
  };
  bodyHTML += addBarHTML(addBarNode);

  // Sub-projects section (always available)
  const kids = node.children || [];
  bodyHTML += `<div class="section-label" style="margin-top:20px;">Sous-projets${kids.length > 0 ? " (" + kids.length + ")" : ""}</div>`;
  if (kids.length > 0) {
    bodyHTML += `<div style="display:flex;flex-direction:column;gap:6px;margin-top:4px;">`;
    for (const child of kids) {
      bodyHTML += `<div class="subproject-row" onclick="openPanelById('${child.id}')">`;
      bodyHTML += `<span class="status-dot ${child.status}"></span>`;
      bodyHTML += `<span>${escapeHtml(child.title)}</span>`;
      bodyHTML += `</div>`;
    }
    bodyHTML += `</div>`;
  }
  bodyHTML += `<div style="margin-top:8px;">`;
  bodyHTML += `<button class="add-subproject-btn" onclick="promptAddSubproject()">`;
  bodyHTML += `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
  bodyHTML += ` Ajouter un sous-projet</button>`;
  bodyHTML += `</div>`;

  document.getElementById("panel-body").innerHTML = bodyHTML;

  // Wire up auto-save on rich editor fields
  const richFields = [
    { key: "description", id: "field-description" },
    { key: "blockers", id: "field-blockers" },
    { key: "notes", id: "field-notes" }
  ];
  for (const { key, id } of richFields) {
    const editor = document.getElementById(id);
    if (editor) {
      editor.addEventListener("input", () => {
        const n = findNodeById(state.currentPanelNodeId);
        if (n) { n[key] = editor.innerHTML; saveToLocalStorage(); }
      });
      editor.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain");
        document.execCommand("insertText", false, text);
      });
    }
  }

  const prereqEl = document.getElementById("field-prerequisites");
  if (prereqEl) {
    prereqEl.addEventListener("input", () => {
      const n = findNodeById(state.currentPanelNodeId);
      if (n) { n.prerequisites = prereqEl.textContent; saveToLocalStorage(); }
    });
  }

  document.querySelectorAll(".checklist-item .item-text").forEach(el => {
    el.addEventListener("input", () => {
      const idx = parseInt(el.dataset.idx);
      const n = findNodeById(state.currentPanelNodeId);
      if (n && n.checklist && n.checklist[idx]) {
        n.checklist[idx].text = el.textContent;
        saveToLocalStorage();
      }
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); el.blur(); }
    });
  });

  const linkUrlInput = document.getElementById("link-add-url");
  if (linkUrlInput) {
    linkUrlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); addLinkItem(); }
    });
  }

  document.getElementById("detail-overlay").classList.add("open");
  panel.classList.add("open");
  state.selectedNodeId = node.id;
}

export function closePanel() {
  document.getElementById("detail-overlay").classList.remove("open");
  document.getElementById("detail-panel").classList.remove("open");
  state.selectedNodeId = null;
  state.currentPanelNodeId = null;
}
