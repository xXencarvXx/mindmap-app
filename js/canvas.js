import { PROJECTS } from './data.js';
import { state, _nodeElements, positionOverrides, positionUndoStack, MAX_UNDO, findNodeById } from './state.js';
import { savePositionsToLocalStorage, showToast } from './persistence.js';
import { render, redrawEdges } from './render.js';
import { closePanel } from './modal.js';

// ──────────────────────────────────────────────
// DRAG & DROP (nodes on canvas)
// ──────────────────────────────────────────────
const DRAG_THRESHOLD = 5;
const canvas = document.getElementById("canvas");

function getChildNodeIds(nodeId) {
  const ids = [];
  function collect(node) {
    if (!node || !node.children) return;
    for (const c of node.children) {
      ids.push(c.id);
      collect(c);
    }
  }
  collect(findNodeById(nodeId));
  return ids;
}

canvas.addEventListener("mousedown", (e) => {
  const nodeEl = e.target.closest(".node:not(.root)");
  if (!nodeEl || e.target.closest(".toggle-btn")) return;
  const id = nodeEl.dataset.id;
  const info = _nodeElements[id];
  if (!info) return;
  e.stopPropagation();
  state.dragInfo = {
    id, el: nodeEl, info,
    startMouseX: e.clientX, startMouseY: e.clientY,
    startCx: info.cx, startCy: info.cy,
    moved: false
  };
});

window.addEventListener("mousemove", (e) => {
  if (!state.dragInfo) return;
  const dx = e.clientX - state.dragInfo.startMouseX;
  const dy = e.clientY - state.dragInfo.startMouseY;
  if (!state.dragInfo.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

  if (!state.dragInfo.moved) {
    // Snapshot positions before drag for undo
    const snap = JSON.parse(JSON.stringify(positionOverrides));
    positionUndoStack.push(snap);
    if (positionUndoStack.length > MAX_UNDO) positionUndoStack.shift();

    state.dragInfo.childStarts = {};
    for (const cid of getChildNodeIds(state.dragInfo.id)) {
      const ci = _nodeElements[cid];
      if (ci) state.dragInfo.childStarts[cid] = { cx: ci.cx, cy: ci.cy };
    }
  }
  state.dragInfo.moved = true;

  const ddx = dx / state.scale;
  const ddy = dy / state.scale;

  const newCx = state.dragInfo.startCx + ddx;
  const newCy = state.dragInfo.startCy + ddy;
  state.dragInfo.info.cx = newCx;
  state.dragInfo.info.cy = newCy;
  state.dragInfo.el.style.left = newCx + "px";
  state.dragInfo.el.style.top = newCy + "px";
  state.dragInfo.el.style.zIndex = "20";

  for (const [cid, start] of Object.entries(state.dragInfo.childStarts)) {
    const ci = _nodeElements[cid];
    if (!ci) continue;
    ci.cx = start.cx + ddx;
    ci.cy = start.cy + ddy;
    ci.el.style.left = ci.cx + "px";
    ci.el.style.top = ci.cy + "px";
  }

  redrawEdges();
});

window.addEventListener("mouseup", (e) => {
  if (!state.dragInfo) return;
  if (state.dragInfo.moved) {
    state.dragInfo.el.style.zIndex = "";
    positionOverrides[state.dragInfo.id] = { x: state.dragInfo.info.cx, y: state.dragInfo.info.cy };
    if (state.dragInfo.childStarts) {
      for (const cid of Object.keys(state.dragInfo.childStarts)) {
        const ci = _nodeElements[cid];
        if (ci) positionOverrides[cid] = { x: ci.cx, y: ci.cy };
      }
    }
    savePositionsToLocalStorage();
  }
  const wasDrag = state.dragInfo.moved;
  state.dragInfo = null;
  if (wasDrag) {
    e.stopPropagation();
    window.addEventListener("click", (ev) => ev.stopPropagation(), { capture: true, once: true });
  }
});

// ──────────────────────────────────────────────
// ZOOM & PAN
// ──────────────────────────────────────────────
const wrapper = document.getElementById("canvas-wrapper");

function updateTransform() {
  canvas.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
  const gridSize = 24 * state.scale;
  wrapper.style.backgroundSize = `${gridSize}px ${gridSize}px`;
  wrapper.style.backgroundPosition = `${state.panX}px ${state.panY}px`;
}

export function resetView() {
  const entries = Object.values(_nodeElements);
  if (entries.length === 0) { state.scale = 0.85; updateTransform(); return; }
  const xs = entries.map(n => n.cx);
  const ys = entries.map(n => n.cy);
  const pad = 80;
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const topMargin = 68;
  const bottomMargin = 100;
  const viewW = window.innerWidth;
  const viewH = window.innerHeight - topMargin - bottomMargin;
  state.scale = Math.min(1, viewW / contentW, viewH / contentH);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  state.panX = viewW / 2 - midX * state.scale;
  state.panY = topMargin + viewH / 2 - midY * state.scale;
  updateTransform();
}

export function zoomIn() {
  const oldScale = state.scale;
  state.scale = Math.min(2, state.scale * 1.15);
  const vcx = window.innerWidth / 2;
  const vcy = window.innerHeight / 2;
  state.panX = vcx - (vcx - state.panX) * (state.scale / oldScale);
  state.panY = vcy - (vcy - state.panY) * (state.scale / oldScale);
  updateTransform();
}

export function zoomOut() {
  const oldScale = state.scale;
  state.scale = Math.max(0.2, state.scale / 1.15);
  const vcx = window.innerWidth / 2;
  const vcy = window.innerHeight / 2;
  state.panX = vcx - (vcx - state.panX) * (state.scale / oldScale);
  state.panY = vcy - (vcy - state.panY) * (state.scale / oldScale);
  updateTransform();
}

export function resetPositions() {
  for (const key in positionOverrides) delete positionOverrides[key];
  localStorage.removeItem("mindmap-positions");
  render();
  resetView();
  showToast("Positions réinitialisées");
}

wrapper.addEventListener("wheel", (e) => {
  e.preventDefault();
  const oldScale = state.scale;
  const delta = e.deltaY > 0 ? 0.98 : 1.02;
  state.scale = Math.max(0.2, Math.min(2, state.scale * delta));
  state.panX = e.clientX - (e.clientX - state.panX) * (state.scale / oldScale);
  state.panY = e.clientY - (e.clientY - state.panY) * (state.scale / oldScale);
  updateTransform();
}, { passive: false });

wrapper.addEventListener("mousedown", (e) => {
  if (e.target.closest(".node") || e.target.closest(".toggle-btn")) return;
  state.isPanning = true;
  state.startX = e.clientX - state.panX;
  state.startY = e.clientY - state.panY;
  wrapper.classList.add("grabbing");
});

window.addEventListener("mousemove", (e) => {
  if (!state.isPanning) return;
  state.panX = e.clientX - state.startX;
  state.panY = e.clientY - state.startY;
  updateTransform();
});

window.addEventListener("mouseup", () => {
  state.isPanning = false;
  wrapper.classList.remove("grabbing");
});

// Close panel on click outside
wrapper.addEventListener("click", (e) => {
  if (!e.target.closest(".node") && !e.target.closest("#detail-panel")) {
    closePanel();
  }
});

// ──────────────────────────────────────────────
// KEYBOARD SHORTCUTS
// ──────────────────────────────────────────────
export function panToNode(cx, cy) {
  state.scale = 1;
  state.panX = window.innerWidth / 2 - cx * state.scale;
  state.panY = window.innerHeight / 2 - cy * state.scale;
  updateTransform();
}

export function initKeyboard(popUndoFn, onZoomChange, openSearchFn, togglePresenterFn) {
  document.addEventListener("keydown", (e) => {
    const inField = e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.isContentEditable;
    if (e.key === "Escape") { if (inField) e.target.blur(); else closePanel(); }
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (openSearchFn) openSearchFn();
      return;
    }
    if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey && !inField) {
      e.preventDefault();
      popUndoFn();
      return;
    }
    if (inField) return;
    if (e.key === "f" || e.key === "F") { if (togglePresenterFn) togglePresenterFn(); }
    if (e.key === "+" || e.key === "=") { zoomIn(); if (onZoomChange) onZoomChange(); }
    if (e.key === "-") { zoomOut(); if (onZoomChange) onZoomChange(); }
    if (e.key === "0") { resetView(); if (onZoomChange) onZoomChange(); }
  });
}
