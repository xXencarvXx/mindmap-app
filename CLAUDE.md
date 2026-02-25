# Mind Map - Priorités

Interactive priority mind map deployed to GitHub Pages.

## Architecture

- **Modular structure**: HTML shell + separate CSS/JS files (ES modules, no build step)
- **localStorage** for browser-side persistence, **DATA_VERSION** for cache invalidation
- **GitHub Pages**: https://ayming-france.github.io/mindmap/
- **Repo**: `ayming-france/mindmap` (public)

### File Structure
```
index.html              ← HTML shell (< 60 lines)
styles/
  base.css              ← reset, layout, canvas, controls, legend, toast
  nodes.css             ← node cards, status dots, toggle buttons
  modal.css             ← detail panel, rich editor, checklist, links, popover
  dark.css              ← dark mode overrides
js/
  data.js               ← PROJECTS array, ROOT_LABEL, STATUS_LABELS
  state.js              ← shared state object, undo stack, findNodeById
  persistence.js        ← localStorage save/load, export, dark mode
  render.js             ← layout engine, two-pass rendering, edge drawing
  modal.js              ← detail panel, checklist, links, rich editor, drag reorder
  canvas.js             ← pan, zoom, node drag, keyboard shortcuts
  app.js                ← init, wires modules together, exposes globals
```

### Module Dependency Graph
```
data.js ← state.js ← persistence.js
                    ← render.js ← canvas.js
                    ← modal.js  ← canvas.js
                                ← app.js (wires everything)
```
`render.js` and `modal.js` avoid circular deps via `setOpenPanelFn()` callback.
Inline `onclick` handlers in template strings use `window.*` globals set by `app.js`.

## Rules

### Node vs Checklist
- **Node** = something your boss would ask "what's the status of X?"
- **Checklist** = steps to complete a node
- If a checklist item needs its own checklist, promote it to a sub-project node

### 3-Level Structure
```
Center (Mes Priorités)
  └── Project (no status dot, no status in modal)
      └── Sub-project (has status pill, checklist, blockers, etc.)
          └── Checklist items (flat, inside modal)
```
Projects are containers. Status lives on sub-projects only.

### Phase Separators
Checklist items starting with `──` render as section headers (uppercase, no checkbox, excluded from progress count).
```js
{ text: "── Phase 1 : Tri et nettoyage ──", done: false }
```

### Prerequisites vs Blockers
- **Prerequisites** = dependencies on other nodes (sequencing, not problems). Blue info box under description. Node titles auto-link to their modal.
- **Blockers** = external problems you can't control (people, tools, agencies). Red section via add-bar.

### Auto-Status from Checklist
When checking/unchecking checklist items, status auto-updates:
- 0 checked = "Pas commencé"
- Some checked = "En cours"
- All checked = "Fait"
- Has blockers = status unchanged (won't override "Bloqué")

### DATA_VERSION
Bump `DATA_VERSION` every time you change the source data. On refresh, if the file version is newer than localStorage, localStorage clears automatically. This replaces manual `localStorage.removeItem()`.

## Data Model

```js
{
  id: "string",
  title: "string",
  color: "#hex",           // project-level only
  status: "done|in_progress|blocked|not_started",
  description: "string",
  prerequisites: "string", // optional, auto-links node titles
  blockers: "string",
  notes: "string",
  checklist: [{ text: "string", done: bool }],
  links: [{ url: "string", text: "string" }],
  children: [/* sub-project objects */]  // project-level only
}
```

## Deployment

```bash
# Deploy to GitHub Pages (requires switching to ayming-france account)
gh auth switch --user ayming-france
git push deploy main
gh auth switch --user xXencarvXx
```

## Key Technical Patterns

- **Two-pass rendering**: Pass 1 creates DOM nodes, Pass 2 measures via `offsetWidth` and draws SVG cubic bezier connections
- **Position overrides** in localStorage for drag positions, all cleared on collapse/expand
- **Cached side assignments** (`_cachedSides`) prevent collapse from reshuffling which side projects are on
- **Rich text editing** via `contenteditable` divs with `document.execCommand()`
- **Link popover** as `position: fixed` centered modal on `document.body`
- **Confirm dialog** styled (not browser `confirm()`), required when deleting sections with content
