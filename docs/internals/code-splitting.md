# Code splitting and lazy loading (standalone app)

Internal reference for how the Miroir standalone web app (`packages/miroir-standalone-app`) splits JavaScript bundles and when heavy third-party libraries are fetched.

**Scope:** Vite/Rollup production builds and `React.lazy` route loading. This document does **not** cover viewport-gated progressive rendering of nested editors (see `docs/guides/advanced/performance.md` for render-insight tooling).

---

## Two mechanisms (often confused)

| Mechanism | Where configured | What it does | Defers download? |
|---|---|---|---|
| **Route lazy loading** | `React.lazy(() => import(...))` in `PageDispatcher.tsx`, `RootComponent.tsx` | Creates async chunks fetched when a route or shell feature first renders | Yes — until navigation / mount |
| **Vendor chunk pinning** | `build.rollupOptions.output.manualChunks` in `vite.config.js` | Moves matching `node_modules` into named files (`vendor-react`, `vendor-mui`, `vendor-d3`) for cache stability | Only indirectly — the vendor file loads when the first importer chunk loads |

`manualChunks` does **not** lazy-load a library on its own. It only names and isolates vendor code. It can also make things worse: Rollup moves the dependencies of a manual chunk's modules into that chunk, so when eager code needs one of them, the whole vendor chunk loads with the page. Until #337, `vendor-copilotkit` and `vendor-ag-grid` loaded with every page for that reason. Only libraries the page needs anyway keep a rule (`vendor-react`, `vendor-mui`), plus `vendor-d3`, which is lazy.

Besides the routes, components load heavy libraries through `React.lazy` (#337): the list grids (`components/Grids/LazyGrids.tsx`, ag-grid and glide-data-grid) and CodeMirror (`CodeBlock_ReadOnly` in `miroir-react`, `MlElementEditorReactCodeMirror`).

### Tracing manual chunk loads

Filter DevTools console on **`[miroir-chunk-load]`**.

| Mode | How it works |
|---|---|
| **`npm run dev`** (Vite) | `src/chunkLoadTrace.ts` watches script resource loads. Named vendors map to `vendor-*` when the URL contains their package name. Opaque `.vite/deps/chunk-….js` files log as `vite-prebundle:<file>`. |
| **Production build** | Rollup `vendor-*.js` chunks get an injected preamble **and** the runtime observer (shared dedupe via `globalThis.__miroirLoggedManualChunks`). |

Disable: `VITE_MIROIR_LOG_CHUNK_LOADS=false` (build + runtime).

Implementation: `vite/chunkLoadLoggerPlugin.js` (build inject), `src/chunkLoadTrace.ts` (dev + prod observer).

---

## Vite configuration

```js
// packages/miroir-standalone-app/vite/manualChunks.js — resolveManualChunk(id)
// + miroirManualChunkLoadLogger() plugin in vite.config.js
```

Libraries **not** given a dedicated vendor chunk (CopilotKit, ag-grid, CodeMirror, `@glideapps/glide-data-grid`, `mermaid`) stay inside the async chunks Rollup derives from the lazy boundaries.

---

## Route-level lazy loading

All primary pages are lazy-loaded from `PageDispatcher.tsx`, wrapped in `<Suspense fallback={<CenteredSpinner />}>`:

- `HomePage`, `ReportDisplay`, `SettingsPage`, `SearchPage`, `ModelDiagramPage`, `RunnersPage`, `TransformerBuilderPage`, `MiroirEventsPage`, `CheckPage`, …

`RootComponent.tsx` additionally lazy-loads shell features:

- `EventTimelineContainer`
- `InstanceEditorOutline`
- `AiActionsProvider` → lazy `AgentsCopilotKit` (CopilotKit provider + sidebar UI)

The app entry (`src/index.tsx`) is **eager**: core startup, `RootComponent`, `PageDispatcher`, MUI shell, Redux/local-cache wiring.

`ReportDisplay` is also imported statically by `HomePage`, `SettingsPage` and `ReportSectionViewWithEditor`, which render a report at once, so its chunk loads with the home page route. The bundle report lists it under "Dynamic imports that split nothing off", and the policy accepts it in `defeatedDynamicImports`. The grids it renders are lazy, so the home page fetches no grid library (`tests/0_build/homePageLoad.unit.test.ts`).

---

## What loads with the page

Measured by the [bundle report](#bundle-report-and-guards-326) of the build of 2026-09-30 (#337). The build of the day prints the same table; chunk names are Rollup's and do not say what a chunk holds.

`index.html` preloads 4 chunks: 4.66 MB of minified code, 867 kB gzipped (the `eagerGzipBaseline` of `bundle-policy.json`). Before #337 it preloaded 7 chunks, 2.73 MB gzipped.

| Chunk | Size, gzip | Largest content | Why it loads with the page |
|---|---|---|---|
| `index-*.js` (entry) | 4.04 MB, 675 kB | `miroir-app-miroir` (the meta-model deployment), `miroir-core`, `lodash`, the app, `yaml`, `miroir-example-library` | the entry; `ModelEnvironmentSync.tsx` and `miroir-core` import the meta-model statically |
| `vendor-mui-*` | 339 kB, 103 kB | `@mui/material`, `@mui/system`, `@popperjs/core` | the app shell |
| `vendor-react-*` | 227 kB, 73 kB | `react-dom`, `react`, `scheduler` | the app shell |
| `___vite-browser-external_commonjs-proxy-*` | 49 kB, 16 kB | `vite-plugin-node-polyfills` shims | Node built-ins the entry's dependencies import |

What #337 took off the page, each cut with the rule that keeps it off:

| Cut | Gzip saved | Kept off by |
|---|---|---|
| `vendor-copilotkit` and `vendor-ag-grid` rules removed from `manualChunks.js` | 1.15 MB | `forbiddenEager` `@copilotkit/*`, `ag-grid-*` |
| `node:crypto` loaded by a conditional dynamic import in `miroir-core` `SecretsService.ts` (`ensureSecretsCrypto()`) | 175 kB | `forbiddenEager` `crypto-browserify`, `bn.js`, `elliptic` |
| The test suite registry that read the whole `miroir-app-miroir` namespace deleted, so Rollup tree-shakes the meta-model | 332 kB | `eagerPackageMaxBytes` |
| CodeMirror behind `React.lazy` | 168 kB | `forbiddenEager` `@codemirror/*`, `@uiw/react-codemirror`, `@lezer/*` |
| Node store drivers aliased to `vite/nodeStoreStub.js` in the web build | 36 kB | `allowlist` (`sequelize`, `mongodb` left the policy) |

---

## Heavy dependencies — import graph and fetch timing

### ag-grid (`ag-grid-community`, `ag-grid-react`)

| | |
|---|---|
| **Vendor chunk** | None (#337) |
| **Static import sites** | `ValueObjectGrid.tsx`, `EntityInstanceGrid.tsx`, cell editors/renderers under `components/Grids/` |
| **Reachability** | `components/Grids/LazyGrids.tsx` (`React.lazy`) ← `ReportSectionListDisplay`, `TestResultsGrid` |
| **Initial load?** | No (`forbiddenEager` `ag-grid-*`) |
| **On feature use?** | Yes — the grid chunk loads with the first list section or test results grid, not with the report route |

`EntityInstanceGrid` also statically imports `@glideapps/glide-data-grid` (`GlideDataGridComponent.tsx`). Both grid implementations ship in the same lazy chunk; runtime picks one via `gridType`, but both are fetched.

### CodeMirror (`@uiw/react-codemirror`, `@codemirror/lang-javascript`)

| | |
|---|---|
| **Vendor chunk** | None (lazy chunks shared by both components) |
| **Dynamic import** | `React.lazy` in `MlElementEditorReactCodeMirror.tsx` (editor) and in `miroir-react` `CodeBlock_ReadOnly.tsx` (read-only block, which shows the text in a `<pre>` until CodeMirror arrives), #337 |
| **Reachability** | Routes that mount editors: `ReportDisplay` (via `TypedValueObjectEditor`), `TransformerBuilderPage` (via `TransformerEditor` → `TypedValueObjectEditor`) |
| **Initial load?** | No (`forbiddenEager` `@codemirror/*`, `@uiw/react-codemirror`, `@lezer/*`) |
| **On field use?** | Yes — the first code field or code block fetches CodeMirror |

### Mermaid (via `miroir-diagram-class`)

| | |
|---|---|
| **Vendor chunk** | None. `miroir-diagram-class` is in the `ModelDiagramReportSectionView` chunk and mermaid in 36 lazy chunks of its own; `vendor-d3` holds the `d3` modules of `GraphComponent.tsx` |
| **Static import** | `MermaidClassDiagram.tsx` in package `miroir-diagram-class` |
| **Reachability** | `ModelDiagramPage` (lazy, `?page=model`); **also** `ReportDisplay` when a report section uses `ModelDiagramReportSectionView` |
| **Initial load?** | No |
| **On diagram render?** | No — loads with the page/section chunk |

### CopilotKit (`@copilotkit/react-core`, `@copilotkit/react-ui`)

| | |
|---|---|
| **Vendor chunk** | None (#337) |
| **react-core** | Lazy import in `AgentsCopilotKit.tsx` — mounted when process snapshot **`ai`** is true **and** an AI AppBar control is active (#273, #244) |
| **react-ui** | Static import in lazy `AiActionsProvider.tsx` (`CopilotSidebar`, hooks, styles) |
| **Mount behaviour** | `RootComponent` lazy-loads `<AgentsCopilotKit />` when `processCapabilities.ai` is true and the user toggles the AI assistant sidebar or dev console. AI AppBar icons stay hidden when snapshot `ai` is false. `ViewParams.agents` is gone. |
| **Initial load?** | No (`forbiddenEager` `@copilotkit/*`); until #337 a `vendor-copilotkit` manual chunk held shared packages the entry needed and loaded with the page |

Server-side CopilotKit (`@copilotkit/runtime` in `miroir-server` / `miroir-ai`) is unrelated to client bundle splitting.

### Component test chunk (`@testing-library/dom`, `@testing-library/user-event`, #286)

| | |
|---|---|
| **Vendor chunk** | None. Rollup puts `componentTests/` and user-event in one async chunk, and `@testing-library/dom` in a chunk it shares with the integration launcher chunk |
| **Dynamic import** | One `import("../../../4-tests/componentTests/index.js")` in `prepareComponentTests()` of `ComponentTestSandbox.tsx` |
| **Reachability** | `ComponentTestSandbox.tsx` is in the lazy `ReportDisplay` chunk. The import runs when a unit Run button (`MiroirTestDisplay`, or "Run All Unit Tests" in `MiroirTestListDisplay` with "Include component tests" checked) starts a MiroirTest that has a `reactComponentTest` leaf |
| **Initial load?** | No |
| **On feature use?** | Yes, on the first component test run |

The chunk holds the component registry, the interpreter of the declarative component test steps (#292), and the act-free driver. The cases themselves are MiroirTest JSON, read from the `LocalCache`. It does not import `@testing-library/react` and never calls React `act`, which throws in production builds of React. `@testing-library/react` is loaded only by the lazy browser integration launcher chunk (`standaloneAppBrowserIntegrationOrchestrator`, through `tests-utils.tsx`), which "Run Integration Tests" imports.

That no `@testing-library/*` package loads with the page is checked by the [bundle guard](#bundle-report-and-guards-326) (`forbiddenEager` in `bundle-policy.json`) on every pull request that touches `packages/`. The guard `tests/4_view/issues/286-react-component-miroir-tests/componentTestChunk.286.phase4.unit.test.ts` reads `dist/.vite/manifest.json` (`build.manifest: true` in `vite.config.js`) and the chunk sourcemaps. It fails when the chunks added by the component test import contain `@testing-library/react` or `routes/TransformerBuilderPage`. It needs a fresh build, so it is not in the nonreg manifest:

```bash
npm run build -w miroir-standalone-app
npm run testByFile -w miroir-standalone-app -- componentTestChunk.286.phase4
```

---

## Summary table

| Library | Named vendor chunk | Deferred past first paint | Deferred until user uses the feature |
|---|---|---|---|
| ag-grid | — (lazy grid chunk) | Yes | Yes (first list section or test results grid) |
| glide-data-grid | — (lazy grid chunk) | Yes | Yes (same) |
| CodeMirror | — (lazy chunks) | Yes | Yes (first code field or block) |
| `crypto-browserify` (for `node:crypto`) | — (lazy chunks) | Yes | Yes (first secrets or MCP client use) |
| Node store drivers (`sequelize`, `mongodb`) | not in the web build | N/A | N/A |
| Mermaid | — (own lazy chunks) | Yes (model page / diagram section) | No |
| Testing Library dom and user-event (component tests) | None (async chunk) | Yes | Yes (first component test run, #286) |
| CopilotKit core | — (lazy chunks) | Yes | Yes (snapshot `ai` + AI AppBar action) |
| CopilotKit UI | — (lazy chunks) | Yes | Yes (same gate + sidebar or dev console) |
| Meta-model deployment | — (entry chunk, tree-shaken) | **No** (capped by `eagerPackageMaxBytes`) | N/A |
| MUI | `vendor-mui` | Partially (large shell dependency) | N/A |
| React | `vendor-react` | **No** | N/A |

---

## What does not happen automatically

1. **Dependencies do not inherit lazy boundaries.** A static `import` inside a `React.lazy` module is bundled into that module’s async chunk (or a shared chunk), not into an independently scheduled lazy load.

2. **`manualChunks` is a cache strategy, not a load strategy.** A vendor chunk helps long-term caching; it does not delay a library, and it pulls eager code's shared dependencies in (see [Two mechanisms](#two-mechanisms-often-confused)).

3. **A dynamic import is defeated by any static import of the same module.** The bundle report lists these under "Dynamic imports that split nothing off"; the guard's `defeated` rule fails on a new one.

4. **Store driver packages** (`miroir-store-filesystem`, `postgres`, `mongodb`) use dynamic `import()` in `IntegrationTestSession.ts` for vitest and the CLI. In `vite build` (not in test mode), `vite.config.js` aliases them to `vite/nodeStoreStub.js`, whose functions throw, so the web build ships no Node store driver (#337). Vitest resolves the real packages.

---

## Bundle report and guards (#326)

Every production build prints a table and writes, next to the Vite manifest:

- `dist/.vite/bundle-report.json`: each chunk with its load kind (`entry`; `eager`, preloaded with the page; `lazy`), raw and gzip sizes, and the packages it holds, each with its size before minification and the import chain from the app's code (`import(…)` marks a dynamic import on the way). Then the findings: Node built-ins emptied for the browser, by importing package, and dynamic imports that split nothing off because the module is also imported statically.
- `dist/.vite/bundle-report.html`: a treemap of the same build (`rollup-plugin-visualizer`).

The console table shows the eager chunks and the 15 largest lazy ones, each with its 5 largest packages. The attribution is in `vite/bundleReportCore.js`, the plugin in `vite/bundleReportPlugin.js`; `VITE_MIROIR_BUNDLE_REPORT=false` disables both. The Electron main process and preload are bundled with esbuild (`packages/miroir-standalone-app-electron/scripts/bundle-main.mjs`, run by its `npm run build`), which writes `dist/bundle-report.json` in the same format. That bundle is minified (names kept), and the Node processes (Electron main, server, CLI, MCP) import `miroir-localcache-redux/node`, an entry without React, so none of them bundles `react-dom` (#337).

The guard compares a report with the app's committed policy:

```bash
python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
python scripts/check_bundle_policy.py packages/miroir-standalone-app-electron/dist/bundle-report.json packages/miroir-standalone-app-electron/bundle-policy.json
```

| Rule | Fails when |
|---|---|
| `allowlist` | a package (or a Node built-in emptied for the browser, `node:<module> via <package>`) is in neither `eager` nor `lazy`, a `lazy` one now loads with the page, or a listed one left the build or changed list; the message gives the import chain |
| `forbidden` | a package matching `forbiddenEager` loads with the page (web: `@testing-library/*`, `@copilotkit/*`, `ag-grid-*`, the crypto polyfill, CodeMirror; Electron: `@testing-library/*`, `@mui/*`, `@copilotkit/react-*`, `react-dom`, `react-redux`) |
| `defeated` | a module is imported dynamically and also statically, so its chunk loads with its static importer, and it is not listed in `defeatedDynamicImports` (#337) |
| `size` | a package listed in `eagerPackageMaxBytes` renders more bytes into the chunks loaded with the page than its cap (#337: `miroir-app-miroir`) |
| `budget` | the gzip size of the chunks loaded with the page is more than `eagerGzipTolerance` (2%) above `eagerGzipBaseline`, or more than 2% below it: a gain is kept by lowering the baseline in the same PR (ratchet) |

When a change is intended, move or add the package the message names, or rewrite the lists and the baseline from the new report with `--init` (it keeps `forbiddenEager` and the tolerance), and commit the policy with the change so the review shows it. The `bundle report + guards` job of `.github/workflows/pr-checks.yml` builds both apps and runs both guards on every pull request that touches `packages/`, `package-lock.json`, the guard or the workflow, and uploads the reports and source maps as the `bundle-reports` artifact (14 days).

---

## Coverage tour (#326)

The bundle report says what the build ships; the coverage tour says what of it runs. On demand, after `npm run build -w miroir-standalone-app` and `npm run build:release -w miroir-server`:

```bash
npm run coverageTour -w miroir-standalone-app -- --serve
```

`--serve` copies `dist/` into the server release and starts it in production mode on https://localhost:3080, authentication off, on the selected environment (`npm run miroir-env -- show`, #321), then stops it. With authentication off, that server listens on 127.0.0.1 only: the tour preloads `scripts/loopback-only.mjs` into it, since the server has no host option. `--url` tours a server already running; `--browser <path>` (or `MIROIR_TOUR_BROWSER`) picks the Chromium when the one `playwright-core` installs (`npx playwright-core install chromium`) is absent. The tour opens the home page, the Library Books grid, a Book in the instance editor, Runners, the Miroir Tests report, the model diagram and the Copilot sidebar, then maps the V8 block coverage of each loaded chunk through its source map to packages (`vite/coverageCore.js`, same names as the bundle report). It writes `dist/.vite/coverage-report.json` and prints the packages with the most loaded code that never ran; a package loaded and never run is a candidate for removal or lazy loading. The first tour loaded 28 of 387 chunks, 11.9 M characters, of which 54% ran.

---

## Related files

| File | Role |
|---|---|
| `packages/miroir-standalone-app/vite.config.js` | Vite config; wires manual chunks + load logger plugin |
| `packages/miroir-standalone-app/vite/manualChunks.js` | `resolveManualChunk`, chunk name list |
| `packages/miroir-standalone-app/vite/chunkLoadLoggerPlugin.js` | Prepends `[miroir-chunk-load]` console.info per vendor chunk |
| `packages/miroir-standalone-app/vite/bundleReportPlugin.js`, `vite/bundleReportCore.js` | Bundle report (#326) |
| `packages/miroir-standalone-app/bundle-policy.json`, `packages/miroir-standalone-app-electron/bundle-policy.json` | Bundle guard policies, checked by `scripts/check_bundle_policy.py` |
| `packages/miroir-standalone-app/scripts/coverage-tour.mjs`, `vite/coverageCore.js` | Coverage tour (#326) |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/PageDispatcher.tsx` | Lazy page routes |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/RootComponent.tsx` | Lazy shell features (`AgentsCopilotKit`, outline, timeline) |
| `packages/miroir-standalone-app/src/index.tsx` | Eager entry (imports no CopilotKit itself) |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AgentsCopilotKit.tsx` | Lazy CopilotKit provider (#244) |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ComponentTestSandbox.tsx` | Dynamic import of the component test chunk (#286) |
| `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/index.ts` | Component test chunk entry, `registerComponentTests` (#286) |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlElementEditorReactCodeMirror.tsx` | Lazy CodeMirror editor (#337) |
| `packages/miroir-react/src/components/CodeBlock_ReadOnly.tsx` | Lazy read-only CodeMirror block (#337) |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/LazyGrids.tsx` | Lazy grids (#337) |
| `packages/miroir-standalone-app/vite/nodeStoreStub.js` | Stands in for the Node store packages in the web build (#337) |
| `packages/miroir-diagram-class/src/4_view/MermaidClassDiagram.tsx` | Mermaid static import |
| `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Grids/ValueObjectGrid.tsx` | ag-grid static import (behind `LazyGrids.tsx`) |

---

## Possible follow-ups (not implemented)

- The cuts found by the bundle report and the coverage tour of #326: done in #337 (analysis and measurements: `code-helpers/features/337-BUILD-bundle-size-cuts/`). The ones left are listed below.
- ~~Dynamic-import CodeMirror inside the JSON/code editor branch only.~~ Done in #337.
- Load the Library deployment lazily: `MlElementEditorHooks.ts` imports it for one label (about 21 kB gzipped with the page).
- Import single `lodash` functions, or `lodash-es`, and check what of `yaml` the entry needs.
- Load shiki grammars on demand (markdown code blocks).
- ~~Mount `AiActionsProvider` only when `showAiSidebar` is true to defer CopilotKit UI.~~ Done in #244.
- ~~Lazy-load `@copilotkit/react-core` only when ViewParams `agents` is enabled.~~ Done in #244; #273 replaced that gate with snapshot `ai`. Operator flags: [Process capabilities](../reference/process-capabilities.md).
- Dynamic-import `GlideDataGridComponent` vs `AgGridReact` based on `gridType` to avoid shipping both grid stacks on every report load.
