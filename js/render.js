import { PROJECTS, ROOT_LABEL } from './data.js';
import { collapsedNodes, positionOverrides, _nodeElements, _edgeDefs, state } from './state.js';
import { savePositionsToLocalStorage } from './persistence.js';

// ──────────────────────────────────────────────
// LAYOUT CONSTANTS
// ──────────────────────────────────────────────
const NODE_H = 40;
const LEAF_H = 36;
const GAP_Y = 28;
const GAP_X_PROJECT = 220;
const GAP_X_LEAF = 260;
const PROJECT_GAP_Y = 70;

function leafHeight(node) {
  if (collapsedNodes.has(node.id) || !node.children || node.children.length === 0) return LEAF_H;
  let h = LEAF_H + 10;
  for (const child of node.children) {
    h += leafHeight(child) + GAP_Y;
  }
  return h - GAP_Y;
}

function branchHeight(project) {
  const children = collapsedNodes.has(project.id) ? [] : (project.children || []);
  if (children.length === 0) return NODE_H;
  let h = NODE_H + 20;
  for (const child of children) {
    h += leafHeight(child) + GAP_Y;
  }
  return h - GAP_Y;
}

function balanceSides(projects) {
  if (!state._cachedSides) {
    const fullHeights = projects.map(p => branchHeight(p));
    const indexed = projects.map((p, i) => ({ p, h: fullHeights[i] }));
    indexed.sort((a, b) => b.h - a.h);
    const leftIds = new Set(), rightIds = new Set();
    let lH = 0, rH = 0;
    for (const { p, h } of indexed) {
      if (rH <= lH) { rightIds.add(p.id); rH += h + PROJECT_GAP_Y; }
      else { leftIds.add(p.id); lH += h + PROJECT_GAP_Y; }
    }
    state._cachedSides = { leftIds, rightIds };
  }

  const left = [], right = [];
  for (const p of projects) {
    if (state._cachedSides.rightIds.has(p.id)) right.push(p);
    else left.push(p);
  }
  const leftH = left.reduce((sum, p) => sum + branchHeight(p) + PROJECT_GAP_Y, 0);
  const rightH = right.reduce((sum, p) => sum + branchHeight(p) + PROJECT_GAP_Y, 0);
  return { left, right, leftH, rightH };
}

export function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

// ──────────────────────────────────────────────
// RENDERING (two-pass)
// ──────────────────────────────────────────────
const canvas = document.getElementById("canvas");

// Callbacks set by app.js to avoid circular dependency
let _openPanelFn = null;
let _addProjectFn = null;
export function setOpenPanelFn(fn) { _openPanelFn = fn; }
export function setAddProjectFn(fn) { _addProjectFn = fn; }

export function render() {
  const { left, right, leftH, rightH } = balanceSides(PROJECTS);
  const maxH = Math.max(leftH, rightH);
  const cx = 1500, cy = Math.max(500, maxH / 2 + 60);

  canvas.innerHTML = '<svg class="connections"></svg>';

  // Reset shared state
  for (const key in _nodeElements) delete _nodeElements[key];
  _edgeDefs.length = 0;

  function createNode(id, x, y, type) {
    if (positionOverrides[id]) { x = positionOverrides[id].x; y = positionOverrides[id].y; }
    const el = document.createElement("div");
    el.className = `node ${type}`;
    el.dataset.id = id;
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.transform = "translate(-50%, -50%)";
    el._cx = x; el._cy = y;
    return el;
  }

  function addNodeActions(el, nodeId, canDelete) {
    const actions = document.createElement("div");
    actions.className = "node-actions";
    // Add child button
    const addBtn = document.createElement("button");
    addBtn.className = "node-action add";
    addBtn.title = "Ajouter un sous-projet";
    addBtn.innerHTML = "+";
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      window.addChildTo && window.addChildTo(nodeId);
    });
    actions.appendChild(addBtn);
    // Delete button
    if (canDelete) {
      const delBtn = document.createElement("button");
      delBtn.className = "node-action delete";
      delBtn.title = "Supprimer";
      delBtn.innerHTML = "\u00d7";
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.deleteNode && window.deleteNode(nodeId);
      });
      actions.appendChild(delBtn);
    }
    el.appendChild(actions);
  }

  // ── PASS 1: Create all node DOM elements ──

  // Root node
  const rootEl = createNode("root", cx, cy, "root");
  rootEl.textContent = ROOT_LABEL;
  rootEl.style.cursor = "pointer";
  rootEl.addEventListener("click", () => _addProjectFn && _addProjectFn());
  // Root gets a custom "+" that opens the project creation dialog
  const rootActions = document.createElement("div");
  rootActions.className = "node-actions";
  const rootAddBtn = document.createElement("button");
  rootAddBtn.className = "node-action add";
  rootAddBtn.title = "Nouveau projet";
  rootAddBtn.innerHTML = "+";
  rootAddBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    _addProjectFn && _addProjectFn();
  });
  rootActions.appendChild(rootAddBtn);
  rootEl.appendChild(rootActions);
  canvas.appendChild(rootEl);
  _nodeElements["root"] = { el: rootEl, side: null, cx: rootEl._cx, cy: rootEl._cy };

  function renderChildren(children, parentId, parentX, startY, side, color, depth) {
    const xStep = GAP_X_LEAF * Math.max(0.7, 1 - depth * 0.1);
    let childY = startY;
    for (const child of children) {
      const childX = side === "right" ? parentX + xStep : parentX - xStep;
      const lh = leafHeight(child);
      const cy = childY + (lh > LEAF_H ? lh / 2 : 0);
      const cel = createNode(child.id, childX, cy, "leaf");
      cel.dataset.status = child.status || "";

      const hasKids = child.children && child.children.length > 0;
      let label = `<span class="status-dot ${child.status}"></span>${child.title}`;
      if (hasKids) {
        const toggle = document.createElement("div");
        toggle.className = "toggle-btn";
        toggle.style.borderColor = color;
        toggle.style.color = color;
        const isCollapsed = collapsedNodes.has(child.id);
        toggle.textContent = isCollapsed ? "+" : "\u2212";
        toggle.style.top = "50%";
        if (side === "right") { toggle.style.right = "-12px"; }
        else { toggle.style.left = "-12px"; }
        toggle.style.transform = "translateY(-50%)";
        toggle.addEventListener("click", (e) => {
          e.stopPropagation();
          collapsedNodes.has(child.id) ? collapsedNodes.delete(child.id) : collapsedNodes.add(child.id);
          for (const key in positionOverrides) delete positionOverrides[key];
          savePositionsToLocalStorage();
          render();
        });
        cel.innerHTML = label;
        cel.appendChild(toggle);
      } else {
        cel.innerHTML = label;
      }

      addNodeActions(cel, child.id, true);
      cel.addEventListener("click", () => _openPanelFn && _openPanelFn(child));
      canvas.appendChild(cel);
      _nodeElements[child.id] = { el: cel, side, cx: cel._cx, cy: cel._cy, parentColor: color };
      _edgeDefs.push({ fromId: parentId, toId: child.id, color });

      if (!collapsedNodes.has(child.id) && hasKids) {
        renderChildren(child.children, child.id, childX, childY + LEAF_H + 10, side, color, depth + 1);
      }

      childY += lh + GAP_Y;
    }
  }

  function renderSide(projects, side) {
    const totalH = side === "right" ? rightH : leftH;
    let yOffset = cy - totalH / 2;

    for (const project of projects) {
      const bh = branchHeight(project);
      const py = yOffset + bh / 2;
      const px = side === "right" ? cx + GAP_X_PROJECT : cx - GAP_X_PROJECT;

      const el = createNode(project.id, px, py, "project");
      el.style.background = `linear-gradient(135deg, ${project.color}, ${adjustColor(project.color, -15)})`;
      el.innerHTML = project.title;

      if (project.children.length > 0) {
        const toggle = document.createElement("div");
        toggle.className = "toggle-btn";
        toggle.style.borderColor = project.color;
        toggle.style.color = project.color;
        const isCollapsed = collapsedNodes.has(project.id);
        toggle.textContent = isCollapsed ? "+" : "\u2212";
        toggle.style.top = "50%";
        if (side === "right") {
          toggle.style.right = "-12px";
        } else {
          toggle.style.left = "-12px";
        }
        toggle.style.transform = "translateY(-50%)";
        toggle.addEventListener("click", (e) => {
          e.stopPropagation();
          collapsedNodes.has(project.id) ? collapsedNodes.delete(project.id) : collapsedNodes.add(project.id);
          for (const key in positionOverrides) delete positionOverrides[key];
          savePositionsToLocalStorage();
          render();
        });
        el.appendChild(toggle);
      }
      addNodeActions(el, project.id, true);
      el.addEventListener("click", () => _openPanelFn && _openPanelFn(project));
      canvas.appendChild(el);
      _nodeElements[project.id] = { el, side, cx: el._cx, cy: el._cy };
      _edgeDefs.push({ fromId: "root", toId: project.id, color: project.color });

      if (!collapsedNodes.has(project.id) && project.children && project.children.length > 0) {
        let childY = yOffset + NODE_H + 10;
        renderChildren(project.children, project.id, px, childY, side, project.color, 1);
      }
      yOffset += bh + PROJECT_GAP_Y;
    }
  }

  renderSide(right, "right");
  renderSide(left, "left");

  // ── PASS 2: Measure actual node sizes and draw SVG edges ──
  requestAnimationFrame(() => {
    drawEdges();
    if (window._postRender) window._postRender();
  });

  // Set canvas size
  const allX = Object.values(_nodeElements).map(n => n.cx);
  const allY = Object.values(_nodeElements).map(n => n.cy);
  canvas.style.width = (Math.max(...allX) + 400) + "px";
  canvas.style.height = (Math.max(...allY) + 200) + "px";
  canvas._cx = cx;
  canvas._cy = cy;
}

// ──────────────────────────────────────────────
// DRAW / REDRAW EDGES
// ──────────────────────────────────────────────
function drawEdges() {
  const svgEl = canvas.querySelector("svg.connections");
  if (!svgEl) return;
  svgEl.innerHTML = "";

  // Group edges by parent to compute exit offsets
  const groups = {};
  for (const edge of _edgeDefs) {
    if (!groups[edge.fromId]) groups[edge.fromId] = [];
    groups[edge.fromId].push(edge);
  }
  // Sort each group by child Y so exit points follow top-to-bottom order
  for (const gid in groups) {
    groups[gid].sort((a, b) => {
      const ay = _nodeElements[a.toId] ? _nodeElements[a.toId].cy : 0;
      const by = _nodeElements[b.toId] ? _nodeElements[b.toId].cy : 0;
      return ay - by;
    });
  }

  for (const edge of _edgeDefs) {
    const fromInfo = _nodeElements[edge.fromId];
    const toInfo = _nodeElements[edge.toId];
    if (!fromInfo || !toInfo) continue;

    const fromW = fromInfo.el.offsetWidth;
    const fromH = fromInfo.el.offsetHeight;
    const toW = toInfo.el.offsetWidth;

    // Compute vertical offset on parent node
    const siblings = groups[edge.fromId];
    const idx = siblings.indexOf(edge);
    const count = siblings.length;
    const spread = Math.min(fromH * 0.7, count * 6);
    const yOff = count > 1 ? -spread / 2 + (idx / (count - 1)) * spread : 0;

    let startX, startY, endX, endY;
    if (toInfo.side === "right") {
      startX = fromInfo.cx + fromW / 2; startY = fromInfo.cy + yOff;
      endX = toInfo.cx - toW / 2; endY = toInfo.cy;
    } else {
      startX = fromInfo.cx - fromW / 2; startY = fromInfo.cy + yOff;
      endX = toInfo.cx + toW / 2; endY = toInfo.cy;
    }

    const gap = Math.abs(endX - startX);
    const dx = gap * 0.45;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let d;
    if (toInfo.side === "right") {
      d = `M${startX},${startY} C${startX + dx},${startY} ${endX - dx},${endY} ${endX},${endY}`;
    } else {
      d = `M${startX},${startY} C${startX - dx},${startY} ${endX + dx},${endY} ${endX},${endY}`;
    }
    path.setAttribute("d", d);
    path.setAttribute("stroke", edge.color);
    svgEl.appendChild(path);
  }
}

export function redrawEdges() {
  drawEdges();
}
