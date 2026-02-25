import { PROJECTS } from './data.js';
import { positionOverrides } from './state.js';

// ──────────────────────────────────────────────
// LOCAL STORAGE
// ──────────────────────────────────────────────
const STORAGE_KEY = "mindmap-priorities-data";
export const DATA_VERSION = 10;
const VERSION_KEY = "mindmap-data-version";
const DARK_KEY = "mindmap-dark-mode";

export function saveToLocalStorage() {
  const data = PROJECTS.map(p => ({
    id: p.id, title: p.title, color: p.color, status: p.status,
    description: p.description, prerequisites: p.prerequisites || "", blockers: p.blockers, notes: p.notes || "",
    checklist: p.checklist || [], links: p.links || [],
    children: p.children.map(c => ({
      id: c.id, title: c.title, status: c.status,
      description: c.description, prerequisites: c.prerequisites || "", blockers: c.blockers, notes: c.notes || "",
      checklist: c.checklist || [], links: c.links || []
    }))
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  localStorage.setItem(VERSION_KEY, DATA_VERSION);
}

export function loadFromLocalStorage() {
  const storedVersion = parseInt(localStorage.getItem(VERSION_KEY) || "0");
  if (storedVersion < DATA_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("mindmap-positions");
    localStorage.setItem(VERSION_KEY, DATA_VERSION);
    return false;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const saved = JSON.parse(raw);
    for (const sp of saved) {
      const target = PROJECTS.find(p => p.id === sp.id);
      if (!target) continue;
      target.status = sp.status;
      target.description = sp.description;
      target.prerequisites = sp.prerequisites || "";
      target.blockers = sp.blockers;
      target.notes = sp.notes || sp.progress || "";
      target.checklist = sp.checklist || [];
      target.links = sp.links || [];
      for (const sc of sp.children) {
        const tc = target.children.find(c => c.id === sc.id);
        if (!tc) continue;
        tc.status = sc.status;
        tc.description = sc.description;
        tc.prerequisites = sc.prerequisites || "";
        tc.blockers = sc.blockers;
        tc.notes = sc.notes || sc.progress || "";
        tc.checklist = sc.checklist || [];
        tc.links = sc.links || [];
      }
    }
    return true;
  } catch (e) { return false; }
}

export function savePositionsToLocalStorage() {
  localStorage.setItem("mindmap-positions", JSON.stringify(positionOverrides));
}

export function loadPositionsFromLocalStorage() {
  const raw = localStorage.getItem("mindmap-positions");
  if (!raw) return;
  try { Object.assign(positionOverrides, JSON.parse(raw)); } catch (e) {}
}

// ──────────────────────────────────────────────
// EXPORT
// ──────────────────────────────────────────────
export function exportJSON() {
  const data = PROJECTS.map(p => ({
    id: p.id, title: p.title, color: p.color, status: p.status,
    description: p.description, prerequisites: p.prerequisites || "", blockers: p.blockers, notes: p.notes || "",
    checklist: p.checklist || [], links: p.links || [],
    children: p.children.map(c => ({
      id: c.id, title: c.title, status: c.status,
      description: c.description, prerequisites: c.prerequisites || "", blockers: c.blockers, notes: c.notes || "",
      checklist: c.checklist || [], links: c.links || []
    }))
  }));
  navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
    showToast("JSON copié dans le presse-papiers");
  });
}

// ──────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────
export function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2000);
}

// ──────────────────────────────────────────────
// DARK MODE
// ──────────────────────────────────────────────
export function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem(DARK_KEY, isDark ? "1" : "0");
  document.getElementById("dark-toggle").innerHTML = isDark ? "&#x2600;" : "&#x263D;";
}

export function loadDarkMode() {
  if (localStorage.getItem(DARK_KEY) === "1") {
    document.body.classList.add("dark");
    document.getElementById("dark-toggle").innerHTML = "&#x2600;";
  }
}
