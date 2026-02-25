import { PROJECTS } from './data.js';
import { state, undoStack, findNodeById } from './state.js';
import { loadFromLocalStorage, loadPositionsFromLocalStorage, loadDarkMode, saveToLocalStorage, exportJSON, toggleDarkMode, showToast } from './persistence.js';
import { render, setOpenPanelFn } from './render.js';
import { openPanel, closePanel, openPanelById, openLinkPopover, toggleChecklistItem, deleteChecklistItem, addChecklistItem, deleteLinkItem, addLinkItem, toggleLinkForm, removeSection, addSection, promptAddSubproject, initChecklistDrag } from './modal.js';
import { resetView, zoomIn, zoomOut, resetPositions, initKeyboard } from './canvas.js';

// ──────────────────────────────────────────────
// UNDO (needs access to both render and modal)
// ──────────────────────────────────────────────
function popUndo() {
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

// ──────────────────────────────────────────────
// WIRE UP STATIC HTML BUTTONS
// ──────────────────────────────────────────────
document.getElementById("detail-overlay").addEventListener("click", closePanel);
document.querySelector("#detail-panel .close-btn").addEventListener("click", closePanel);
document.getElementById("btn-zoom-in").addEventListener("click", zoomIn);
document.getElementById("btn-zoom-out").addEventListener("click", zoomOut);
document.getElementById("btn-reset-view").addEventListener("click", resetView);
document.getElementById("btn-export").addEventListener("click", exportJSON);
document.getElementById("btn-reset-pos").addEventListener("click", resetPositions);
document.getElementById("dark-toggle").addEventListener("click", toggleDarkMode);

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
loadFromLocalStorage();
loadPositionsFromLocalStorage();
loadDarkMode();
render();
resetView();
initChecklistDrag();
initKeyboard(popUndo);
