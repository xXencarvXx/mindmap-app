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
export const MAX_UNDO = 20;

export function cloneProjects() {
  return PROJECTS.map(p => ({
    id: p.id, title: p.title, color: p.color, status: p.status,
    description: p.description, prerequisites: p.prerequisites || "",
    blockers: p.blockers, notes: p.notes || "",
    checklist: (p.checklist || []).map(i => ({ ...i })),
    links: (p.links || []).map(l => ({ ...l })),
    children: p.children.map(c => ({
      id: c.id, title: c.title, status: c.status,
      description: c.description, prerequisites: c.prerequisites || "",
      blockers: c.blockers, notes: c.notes || "",
      checklist: (c.checklist || []).map(i => ({ ...i })),
      links: (c.links || []).map(l => ({ ...l }))
    }))
  }));
}

export function pushUndo() {
  undoStack.push(cloneProjects());
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

// ──────────────────────────────────────────────
// FIND NODE HELPER
// ──────────────────────────────────────────────
export function findNodeById(id) {
  for (const p of PROJECTS) {
    if (p.id === id) return p;
    for (const c of p.children) {
      if (c.id === id) return c;
    }
  }
  return null;
}

// ──────────────────────────────────────────────
// ESCAPE HTML
// ──────────────────────────────────────────────
export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
