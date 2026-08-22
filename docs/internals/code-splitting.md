# Code splitting and lazy loading (standalone app)

Internal reference for how the Miroir standalone web app (`packages/miroir-standalone-app`) splits JavaScript bundles and when heavy third-party libraries are fetched.

**Scope:** Vite/Rollup production builds and `React.lazy` route loading. This document does **not** cover viewport-gated progressive rendering of nested editors (see `docs/guides/advanced/performance.md` for render-insight tooling).

---

## Two mechanisms (often confused)

| Mechanism | Where configured | What it does | Defers download? |
|---|---|---|---|
| **Route lazy loading** | `React.lazy(() => import(...))` in `PageDispatcher.tsx`, `RootComponent.tsx` | Creates async chunks fetched when a route or shell feature first renders | Yes — until navigation / mount |
| **Vendor chunk pinning** | `build.rollupOptions.output.manualChunks` in `vite.config.js` | Moves matching `node_modules` into named files (`vendor-ag-grid.js`, etc.) for cache stability | Only indirectly — the vendor file loads when the first importer chunk loads |

`manualChunks` does **not** lazy-load a library on its own. It only names and isolates vendor code. The browser still downloads `vendor-ag-grid.js` as soon as any chunk that imports ag-grid is loaded.

There are **no** dynamic `import('…')` calls in the standalone app for CodeMirror, Mermaid, ag-grid, or CopilotKit UI. Splitting is entirely route-level plus Rollup’s static dependency graph.

### Tracing manual chunk loads (production build)

Production builds prepend a `console.info` to each manual vendor chunk when the browser evaluates that file:

```
[miroir-chunk-load] { chunk: "vendor-ag-grid", file: "assets/vendor-ag-grid-….js", at: "…" }
```

Filter DevTools console on `[miroir-chunk-load]`. Disable at build time: `VITE_MIROIR_LOG_CHUNK_LOADS=false npm run build -w miroir-standalone-app`.

Implementation: `packages/miroir-standalone-app/vite/chunkLoadLoggerPlugin.js` (build-only; `vite dev` does not emit manual chunks).

---

## Vite configuration

```js
// packages/miroir-standalone-app/vite/manualChunks.js — resolveManualChunk(id)
// + miroirManualChunkLoadLogger() plugin in vite.config.js
```

Libraries **not** given a dedicated vendor chunk (for example CodeMirror, `@glideapps/glide-data-grid`, `mermaid` when not pulled via `miroir-diagram-class`) stay inside the async route chunk or a shared chunk Rollup derives automatically.

---

## Route-level lazy loading

All primary pages are lazy-loaded from `PageDispatcher.tsx`, wrapped in `<Suspense fallback={<CenteredSpinner />}>`:

- `HomePage`, `ReportDisplay`, `SettingsPage`, `SearchPage`, `ModelDiagramPage`, `RunnersPage`, `TransformerBuilderPage`, `MiroirEventsPage`, `CheckPage`, …

`RootComponent.tsx` additionally lazy-loads shell features:

- `EventTimelineContainer`
- `InstanceEditorOutline`
- `AiActionsProvider`

The app entry (`src/index.tsx`) is **eager**: core startup, `RootComponent`, `PageDispatcher`, MUI shell, Redux/local-cache wiring, and **`@copilotkit/react-core`** (see below).

---

## Heavy dependencies — import graph and fetch timing

### ag-grid (`ag-grid-community`, `ag-grid-react`)

| | |
|---|---|
| **Vendor chunk** | `vendor-ag-grid` |
| **Static import sites** | `ValueObjectGrid.tsx`, `EntityInstanceGrid.tsx`, cell editors/renderers under `components/Grids/` |
| **Reachability** | Lazy route `ReportDisplay` → `ReportSectionListDisplay` → `EntityInstanceGrid` → grids |
| **Initial load?** | No — not imported from `index.tsx` or eager shell code |
| **On feature use?** | No — entire report route chunk (and `vendor-ag-grid`) loads when opening any report, even if the page has no grid section |

`EntityInstanceGrid` also statically imports `@glideapps/glide-data-grid` (`GlideDataGridComponent.tsx`). Both grid implementations ship in the same route graph; runtime picks one via `gridType`, but both are bundled.

### CodeMirror (`@uiw/react-codemirror`, `@codemirror/lang-javascript`)

| | |
|---|---|
| **Vendor chunk** | None (embedded in route/shared chunk) |
| **Static import** | `JzodElementEditorReactCodeMirror.tsx` ← `JzodElementEditor.tsx` |
| **Reachability** | Lazy routes that mount editors: `ReportDisplay` (via `TypedValueObjectEditor`), `TransformerBuilderPage` (via `TransformerEditor` → `TypedValueObjectEditor`) |
| **Initial load?** | No |
| **On field use?** | No — CodeMirror is a static dependency of `JzodElementEditor`; it loads with the route chunk, not when a JSON/code field first appears |

### Mermaid (via `miroir-diagram-class`)

| | |
|---|---|
| **Vendor chunk** | `vendor-d3` (includes `miroir-diagram-class` and its `d3` dependency) |
| **Static import** | `MermaidClassDiagram.tsx` in package `miroir-diagram-class` |
| **Reachability** | `ModelDiagramPage` (lazy, `?page=model`); **also** `ReportDisplay` when a report section uses `ModelDiagramReportSectionView` |
| **Initial load?** | No |
| **On diagram render?** | No — loads with the page/section chunk |

### CopilotKit (`@copilotkit/react-core`, `@copilotkit/react-ui`)

| | |
|---|---|
| **Vendor chunk** | `vendor-copilotkit` |
| **react-core** | **Static import in `index.tsx`** — `CopilotKit` provider wraps the whole app → loads at startup |
| **react-ui** | Static import in lazy `AiActionsProvider.tsx` (`CopilotSidebar`, hooks, styles) |
| **Mount behaviour** | `RootComponent` mounts `<AiActionsProvider />` when ViewParams **`agents`** is enabled and `context.showAiSidebar` is true (#244). AI AppBar icons (assistant, dev console, transformer builder) are hidden when `agents` is false (default). |
| **Initial load?** | Core: **yes**. UI: deferred until agents enabled and sidebar opened |

Server-side CopilotKit (`@copilotkit/runtime` in `miroir-server` / `miroir-ai`) is unrelated to client bundle splitting.

---

## Summary table

| Library | Named vendor chunk | Deferred past first paint | Deferred until user uses the feature |
|---|---|---|---|
| ag-grid | `vendor-ag-grid` | Yes (report routes) | No |
| glide-data-grid | — (route chunk) | Yes (report routes) | No |
| CodeMirror | — (route chunk) | Yes (report / transformer builder) | No |
| Mermaid | `vendor-d3` | Yes (model page / diagram section) | No |
| CopilotKit core | `vendor-copilotkit` | **No** | N/A |
| CopilotKit UI | `vendor-copilotkit` | Yes (until agents on + sidebar open) | Yes (agents setting + sidebar) |
| MUI | `vendor-mui` | Partially (large shell dependency) | N/A |
| React | `vendor-react` | **No** | N/A |

---

## What does not happen automatically

1. **Dependencies do not inherit lazy boundaries.** A static `import` inside a `React.lazy` module is bundled into that module’s async chunk (or a shared chunk), not into an independently scheduled lazy load.

2. **`manualChunks` is a cache strategy, not a load strategy.** Splitting ag-grid into `vendor-ag-grid.js` helps long-term caching; it does not delay ag-grid until a grid cell is edited.

3. **No per-component dynamic imports** for heavy editors. To load CodeMirror only when a code field mounts, you would need an explicit pattern such as `React.lazy(() => import('@uiw/react-codemirror'))` inside `JzodElementEditorReactCodeMirror` (not implemented today).

4. **Store driver packages** (`miroir-store-filesystem`, `postgres`, `mongodb`) use dynamic `import()` in `IntegrationTestSession.ts` so Node drivers are not evaluated in the browser. That is bootstrap safety for tests/integration, not UI code splitting.

---

## Related files

| File | Role |
|---|---|
| `packages/miroir-standalone-app/vite.config.js` | Vite config; wires manual chunks + load logger plugin |
| `packages/miroir-standalone-app/vite/manualChunks.js` | `resolveManualChunk`, chunk name list |
| `packages/miroir-standalone-app/vite/chunkLoadLoggerPlugin.js` | Prepends `[miroir-chunk-load]` console.info per vendor chunk |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/PageDispatcher.tsx` | Lazy page routes |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/RootComponent.tsx` | Lazy shell features (`AiActionsProvider`, outline, timeline) |
| `packages/miroir-standalone-app/src/index.tsx` | Eager entry; CopilotKit provider |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/JzodElementEditorReactCodeMirror.tsx` | CodeMirror static import |
| `packages/miroir-diagram-class/src/4_view/MermaidClassDiagram.tsx` | Mermaid static import |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/ValueObjectGrid.tsx` | ag-grid static import |

---

## Possible follow-ups (not implemented)

- Add `manualChunks` entries for CodeMirror and/or glide-data-grid if cache isolation is desired.
- Dynamic-import CodeMirror inside the JSON/code editor branch only.
- ~~Mount `AiActionsProvider` only when `showAiSidebar` is true to defer CopilotKit UI.~~ Done in #244.
- Dynamic-import `GlideDataGridComponent` vs `AgGridReact` based on `gridType` to avoid shipping both grid stacks on every report load.
