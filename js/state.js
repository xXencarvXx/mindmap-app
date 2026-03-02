import { PROJECTS } from './data.js';

// ──────────────────────────────────────────────
// SHARED MUTABLE STATE
// ──────────────────────────────────────────────
export const state = {
  selectedNodeId: null,
  currentPanelNodeId: null,
  scale: 1,
  panX: 0,
  panY: 0,
  isPanning: false,
  startX: 0,
  startY: 0,
  dragInfo: null,
  _savedRange: null,
  _linkPopover: null,
  _linkEditorEl: null,
  clDrag: null,
  _cachedSides: null,
};

// Shared render state (mutated by render, read by drag/edges)
export const _nodeElements = {};
export const _edgeDefs = [];
export const positionOverrides = {};
export const collapsedNodes = new Set();

// ──────────────────────────────────────────────
// UNDO SYSTEM
// ──────────────────────────────────────────────
export const undoStack = [];
export const positionUndoStack = [];
export const MAX_UNDO = 20;

export function cloneNode(n) {
  const clone = {
    id: n.id, title: n.title, status: n.status,
    description: n.description, prerequisites: n.prerequisites || "",
    blockers: n.blockers, notes: n.notes || "",
    checklist: (n.checklist || []).map(i => ({ ...i })),
    links: (n.links || []).map(l => ({ ...l }))
  };
  if (n.color) clone.color = n.color;
  if (n.abandonedReason) clone.abandonedReason = n.abandonedReason;
  if (n.children) clone.children = n.children.map(c => cloneNode(c));
  return clone;
}

export function cloneProjects() {
  return PROJECTS.map(p => cloneNode(p));
}

export function pushUndo() {
  undoStack.push(cloneProjects());
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

// ──────────────────────────────────────────────
// FIND NODE HELPER
// ──────────────────────────────────────────────
export function findNodeById(id) {
  function search(nodes) {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children) {
        const found = search(n.children);
        if (found) return found;
      }
    }
    return null;
  }
  return search(PROJECTS);
}

// ──────────────────────────────────────────────
// FIND PARENT OF NODE
// ──────────────────────────────────────────────
export function findParentOf(nodeId) {
  const topIdx = PROJECTS.findIndex(p => p.id === nodeId);
  if (topIdx !== -1) return { array: PROJECTS, index: topIdx, parentNode: null };
  function search(nodes) {
    for (const n of nodes) {
      if (n.children) {
        const idx = n.children.findIndex(c => c.id === nodeId);
        if (idx !== -1) return { array: n.children, index: idx, parentNode: n };
        const found = search(n.children);
        if (found) return found;
      }
    }
    return null;
  }
  return search(PROJECTS);
}

// ──────────────────────────────────────────────
// ESCAPE HTML
// ──────────────────────────────────────────────
export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
