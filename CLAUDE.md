# Mind Map - Priorités

Interactive priority mind map deployed to GitHub Pages.

## Architecture

- **Modular structure**: HTML shell + separate CSS/JS files (ES modules, no build step)
- **Dual storage**: localStorage (instant) + Supabase (debounced 1.5s cloud sync)
- **Auth**: Email/password via Supabase Auth. Landing page when not logged in.
- **GitHub Pages**: https://xxencarvxx.github.io/mindmap-app/
- **Repos**:
  - `xXencarvXx/mindmap` (private) = source code
  - `xXencarvXx/mindmap-app` (public) = GitHub Pages deploy only

### Data Architecture
- `data.js` = empty template for new users (not personal data)
- User data lives in Supabase (`mindmaps` table, one row per user)
- Two input channels: browser edits save to Supabase, Claude edits via Supabase API
- Service role key in `.env` (gitignored) for Claude API access

### File Structure
```
index.html              ← HTML shell with landing page + app container
styles/
  base.css              ← reset, layout, canvas, controls, legend, toast
  nodes.css             ← node cards, status dots, toggle buttons, hover actions
  modal.css             ← detail panel, rich editor, checklist, links, popover
  dark.css              ← dark mode overrides
  landing.css           ← landing page + auth form styles
js/
  supabase.js           ← Supabase client, auth helpers (email sign in/up/out)
  data.js               ← empty template for new users, ROOT_LABEL, STATUS_LABELS
  state.js              ← shared state object, undo stack, findNodeById, findParentOf
  persistence.js        ← localStorage + Supabase save/load, export, dark mode
  render.js             ← layout engine, two-pass rendering, edge drawing
  modal.js              ← detail panel, checklist, links, rich editor, CRUD dialogs
  canvas.js             ← pan, zoom, node drag, keyboard shortcuts
  app.js                ← async init, auth flow, wires modules together
scripts/
  sb-read.sh            ← Claude helper: read user data from Supabase
  sb-write.sh           ← Claude helper: write user data to Supabase
```

### Module Dependency Graph
```
data.js ← state.js ← persistence.js
                    ← render.js ← canvas.js
                    ← modal.js  ← canvas.js
                                ← app.js (wires everything)
```
`render.js` and `modal.js` avoid circular deps via `setOpenPanelFn()` and `setAddProjectFn()` callbacks.
Inline `onclick` handlers in template strings use `window.*` globals set by `app.js`.

## Rules

### No Native Browser Dialogs
Never use `prompt()`, `alert()`, or `confirm()`. Always use styled overlay dialogs (see `showConfirm()` and `showPrompt()` in modal.js). The app has its own dialog system with dark mode support.

### Node vs Checklist
- **Node** = something your boss would ask "what's the status of X?"
- **Checklist** = steps to complete a node
- If a checklist item needs its own checklist, promote it to a sub-project node

### Recursive Nesting
```
Center (Mes Priorités)
  └── Project (no status dot, no status in modal)
      └── Sub-project (has status pill, checklist, blockers, etc.)
          └── Sub-sub-project (same as sub-project, recursive)
              └── ... (any depth)
                  └── Checklist items (flat, inside modal)
```
Projects are containers. Status lives on sub-projects (any depth).
Any node with `children` renders child nodes on the canvas with toggle (+/-) buttons.
The `findNodeById`, `cloneProjects`, and render functions are all recursive.

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
  status: "done|in_progress|blocked|not_started|abandoned",
  description: "html string",   // rich editor, use <br> and <b> not \n
  prerequisites: "string",      // optional, auto-links node titles
  blockers: "html string",      // rich editor
  notes: "html string",         // rich editor
  abandonedReason: "string",    // only when status is abandoned
  checklist: [{ text: "string", done: bool }],
  links: [{ url: "string", text: "string" }],
  children: [/* sub-project objects, recursive */]
}
```

## Deployment

```bash
# Deploy to GitHub Pages (both repos on xXencarvXx)
git push deploy auth:main    # pushes auth branch as main to mindmap-app
git push origin auth          # backup source code to private repo
```

## Key Technical Patterns

- **Two-pass rendering**: Pass 1 creates DOM nodes, Pass 2 measures via `offsetWidth` and draws SVG cubic bezier connections
- **Position overrides** in localStorage for drag positions, all cleared on collapse/expand
- **Cached side assignments** (`_cachedSides`) prevent collapse from reshuffling which side projects are on
- **Rich text editing** via `contenteditable` divs with `document.execCommand()`
- **Link popover** as `position: fixed` centered modal on `document.body`
- **Confirm dialog** styled (not browser `confirm()`), required when deleting sections with content
- **Node CRUD via hover actions**: "+" and "×" circle buttons appear bottom-center on hover (Miro/FigJam pattern). `deleteNode(id)` and `addChildTo(id)` in modal.js, wired as `window.*` globals. Any node can become a parent by adding a child.
- **Project creation**: Click root node to open color-picker dialog (`promptAddProject()`). 8 preset swatches, auto-selects first unused color.
- **Inline rename**: Panel title is `contentEditable`, saves on blur/Enter
