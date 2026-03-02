import { PROJECTS, DEFAULT_POSITIONS } from './data.js';
import { positionOverrides } from './state.js';

// ──────────────────────────────────────────────
// LOCAL STORAGE
// ──────────────────────────────────────────────
const STORAGE_KEY = "mindmap-priorities-data";
export const DATA_VERSION = 65;
const VERSION_KEY = "mindmap-data-version";
const DARK_KEY = "mindmap-dark-mode";

function serializeNode(n) {
  const obj = {
    id: n.id, title: n.title, status: n.status,
    description: n.description, prerequisites: n.prerequisites || "",
    blockers: n.blockers, notes: n.notes || "",
    checklist: n.checklist || [], links: n.links || []
  };
  if (n.color) obj.color = n.color;
  if (n.abandonedReason) obj.abandonedReason = n.abandonedReason;
  if (n.children) obj.children = n.children.map(c => serializeNode(c));
  return obj;
}

// Extracted to module level so both local and cloud load can use it
function loadNode(saved, target) {
  target.status = saved.status;
  target.description = saved.description;
  target.prerequisites = saved.prerequisites || "";
  target.blockers = saved.blockers;
  target.notes = saved.notes || saved.progress || "";
  target.checklist = saved.checklist || [];
  target.links = saved.links || [];
  if (saved.children && target.children) {
    for (const sc of saved.children) {
      const tc = target.children.find(c => c.id === sc.id);
      if (tc) loadNode(sc, tc);
    }
  }
}

export function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(PROJECTS.map(serializeNode)));
  localStorage.setItem(VERSION_KEY, DATA_VERSION);
  saveToSupabase();
}

export function loadFromLocalStorage() {
  const storedVersion = parseInt(localStorage.getItem(VERSION_KEY) || "0");
  if (storedVersion < DATA_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(VERSION_KEY, DATA_VERSION);
    return false;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const saved = JSON.parse(raw);
    for (const sp of saved) {
      const target = PROJECTS.find(p => p.id === sp.id);
      if (target) loadNode(sp, target);
    }
    return true;
  } catch (e) { return false; }
}

export function savePositionsToLocalStorage() {
  localStorage.setItem("mindmap-positions", JSON.stringify(positionOverrides));
  saveToSupabase();
}

export function loadPositionsFromLocalStorage() {
  const raw = localStorage.getItem("mindmap-positions");
  if (raw) {
    try { Object.assign(positionOverrides, JSON.parse(raw)); } catch (e) {}
  } else if (Object.keys(DEFAULT_POSITIONS).length > 0) {
    Object.assign(positionOverrides, DEFAULT_POSITIONS);
  }
}

// ──────────────────────────────────────────────
// SUPABASE (cloud save/load)
// ──────────────────────────────────────────────
let _supabaseModule = null;
let _currentUser = null;

export function setSupabaseContext(mod, user) {
  _supabaseModule = mod;
  _currentUser = user;
}

// Debounced cloud save: waits 1.5s after last mutation, then upserts
let _saveTimer = null;
let _dirty = false;
function _doSupabaseSave() {
  if (!_supabaseModule || !_currentUser) return;
  _dirty = false;
  _supabaseModule.supabase.from('mindmaps').upsert({
    user_id: _currentUser.id,
    projects: PROJECTS.map(serializeNode),
    positions: { ...positionOverrides },
    updated_at: new Date().toISOString()
  }).then(({ error }) => {
    if (error) console.warn('Supabase save failed:', error.message);
  }).catch(e => console.warn('Supabase save failed:', e));
}
function saveToSupabase() {
  if (!_supabaseModule || !_currentUser) return;
  _dirty = true;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(_doSupabaseSave, 1500);
}

// Flush pending save on page unload
window.addEventListener('beforeunload', () => {
  if (_dirty) {
    clearTimeout(_saveTimer);
    _doSupabaseSave();
  }
});

export async function loadFromSupabase() {
  if (!_supabaseModule || !_currentUser) return false;
  try {
    const { data, error } = await _supabaseModule.supabase
      .from('mindmaps')
      .select('projects, positions')
      .eq('user_id', _currentUser.id)
      .single();

    if (error || !data || !data.projects || data.projects.length === 0) return false;

    // Replace PROJECTS content with Supabase data (full state)
    PROJECTS.length = 0;
    for (const p of data.projects) {
      PROJECTS.push(p);
    }

    if (data.positions && Object.keys(data.positions).length > 0) {
      for (const key in positionOverrides) delete positionOverrides[key];
      Object.assign(positionOverrides, data.positions);
    }

    // Also update localStorage as cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.projects));
    localStorage.setItem(VERSION_KEY, DATA_VERSION);
    if (data.positions) {
      localStorage.setItem("mindmap-positions", JSON.stringify(data.positions));
    }

    return true;
  } catch (e) {
    console.warn('Supabase load failed:', e);
    return false;
  }
}

// ──────────────────────────────────────────────
// DIFF EXPORT (snapshot original, export only changes)
// ──────────────────────────────────────────────
let _originalData = null;

function deepCloneNodes(nodes) {
  return nodes.map(n => {
    const c = {
      id: n.id, title: n.title, status: n.status,
      description: n.description || "", prerequisites: n.prerequisites || "",
      blockers: n.blockers || "", notes: n.notes || "",
      checklist: (n.checklist || []).map(i => ({ ...i })),
      links: (n.links || []).map(l => ({ ...l }))
    };
    if (n.color) c.color = n.color;
    if (n.children) c.children = deepCloneNodes(n.children);
    return c;
  });
}

export function snapshotOriginal() {
  _originalData = deepCloneNodes(PROJECTS);
}

export function exportDiff() {
  if (!_originalData) { exportFull(); return; }

  const changes = [];

  function diffNode(orig, curr) {
    const ch = { id: curr.id };
    let has = false;

    for (const f of ["title", "status", "description", "prerequisites", "blockers", "notes"]) {
      if ((orig[f] || "") !== (curr[f] || "")) { ch[f] = curr[f] || ""; has = true; }
    }

    const oCL = orig.checklist || [], cCL = curr.checklist || [];
    const checked = [], unchecked = [], addCL = [], rmCL = [];
    for (const cc of cCL) {
      const oc = oCL.find(o => o.text === cc.text);
      if (!oc) addCL.push(cc.text);
      else if (oc.done !== cc.done) (cc.done ? checked : unchecked).push(cc.text);
    }
    for (const oc of oCL) { if (!cCL.find(c => c.text === oc.text)) rmCL.push(oc.text); }
    if (checked.length) { ch.check = checked; has = true; }
    if (unchecked.length) { ch.uncheck = unchecked; has = true; }
    if (addCL.length) { ch.add_checklist = addCL; has = true; }
    if (rmCL.length) { ch.remove_checklist = rmCL; has = true; }

    const oLk = orig.links || [], cLk = curr.links || [];
    const addLk = cLk.filter(cl => !oLk.find(ol => ol.url === cl.url));
    const rmLk = oLk.filter(ol => !cLk.find(cl => cl.url === ol.url));
    if (addLk.length) { ch.add_link = addLk; has = true; }
    if (rmLk.length) { ch.remove_link = rmLk.map(l => l.url); has = true; }

    if (has) changes.push(ch);
  }

  function diffList(origList, currList) {
    for (const curr of currList) {
      const orig = origList.find(o => o.id === curr.id);
      if (!orig) { changes.push({ id: curr.id, _new: true, title: curr.title, status: curr.status }); continue; }
      diffNode(orig, curr);
      if (curr.children && orig.children) diffList(orig.children, curr.children);
    }
    for (const orig of origList) {
      if (!currList.find(c => c.id === orig.id)) changes.push({ id: orig.id, _deleted: true });
    }
  }

  diffList(_originalData, PROJECTS);

  // Include only positions that differ from defaults
  const changedPos = {};
  for (const [id, pos] of Object.entries(positionOverrides)) {
    const def = DEFAULT_POSITIONS[id];
    if (!def || Math.round(pos.x * 100) !== Math.round(def.x * 100) || Math.round(pos.y * 100) !== Math.round(def.y * 100)) {
      changedPos[id] = pos;
    }
  }
  const posKeys = Object.keys(changedPos);
  if (posKeys.length > 0) {
    changes.push({ _positions: changedPos });
  }

  if (changes.length === 0) { showToast("Aucun changement"); return; }

  navigator.clipboard.writeText(JSON.stringify(changes, null, 2)).then(() => {
    const posCount = posKeys.length > 0 ? 1 : 0;
    const dataCount = changes.length - posCount;
    const parts = [];
    if (dataCount > 0) parts.push(dataCount + " changement" + (dataCount > 1 ? "s" : ""));
    if (posCount > 0) parts.push(posKeys.length + " position" + (posKeys.length > 1 ? "s" : ""));
    showToast(parts.join(" + ") + " copié");
  });
}

export function exportFull() {
  navigator.clipboard.writeText(JSON.stringify(PROJECTS.map(serializeNode), null, 2)).then(() => {
    showToast("JSON complet copié");
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
