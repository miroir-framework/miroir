# Issue #370 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`. Each cut is proven twice: by the build's own checks (bundle guard `check_bundle_policy.py`, build tests under `tests/0_build/`), which fail while the package is still where it should not be, and by the existing MiroirTests and nonreg steps of the behaviour the cut moves behind a lazy boundary. No mocks. The tracer bullet (slice 1) proves the pattern end to end on `yaml`: off the page, still parsed when a YAML OpenAPI document arrives.
>
> **Execution model:** one branch, one green commit per slice (A's "go" on D10, as for #337). Each slice ends with its Validation commands; on success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/370
Prerequisite: [`../337-BUILD-bundle-size-cuts/`](../337-BUILD-bundle-size-cuts/) ✅ (PR #368)
Working branch: `claude/issue-370-bundle-size-followup`

**Resume note:** slice 0 DONE.

---

## Scope

- Web page (eager gzip): `yaml`, `miroir-store-indexedDb`, `json-diff`, `lodash`, `miroir-example-library` leave the chunks loaded with the page (D1–D5).
- First list section: glide-data-grid loads only for `gridType: glide-data-grid` (D6).
- `dist/`: shiki restricted to 12 grammars (D7).
- Electron main bundle split by store and feature (D8).

This plan does **not** cover F10 (rejected), the ag-grid 33 migration (G2, own issue if wanted) or a UTF-8-only `iconv-lite` (E3, deferred): analysis D9 and D8.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the baseline after the MUI 9 bump | ✅ | guard passes; baselines recorded |
| 1 | The page loads no YAML parser (tracer) | ✅ | `forbiddenEager` `yaml`; YAML OpenAPI transformer test |
| 2 | The page loads no IndexedDB store | ✅ | `forbiddenEager` `abstract-level`; `testMiroir` on `test-indexedDb` |
| 3 | The page loads no JSON diff | ✅ | `forbiddenEager` `json-diff`; `fn.modelUpdate` |
| 4 | The page loads `merge`, not lodash | ✅ | bare-`lodash` importer test; guard |
| 5 | The page loads no Library example | ✅ | `forbiddenEager` `miroir-example-library`; label test |
| 6 | The first list loads one grid library | ✅ | grid chunk test; glide list test |
| 7 | Releases ship 12 grammars | ✅ | grammar count test; tour Copilot sidebar |
| 8 | Electron loads only the stores and features it uses | ✅ | Electron guard; startup time; smoke |
| 9 | Nonreg, docs, cleanup, AC | ✅ | `nonreg:filesystem` + tour + AC table |

---

## Locked implementation defaults

Accepted by A on 2026-10-01 ("go" on the analysis). Deviations go into the slice's Realization.

| Decision | Choice |
|---|---|
| D1 | `yaml` by dynamic import: Node loads it at module evaluation (top-level conditional, the `SecretsService` pattern of #337); the browser starts it after the first render and `ensureYamlParser()` is awaited by the async callers; `parseOpenApiDocument` on YAML text before the load throws "YAML parser not loaded". JSON input never needs it. |
| D2 | `miroir-store-indexedDb` `startup.ts` registers the same factories; each factory imports the store classes with `await import(...)` |
| D3 | `FunctionCallTestRegistry` entries may be loaders; `resolveFunctionCallTarget` becomes async; `ModelUpdate` loads on use |
| D4 | Vite alias of the bare `lodash` specifier to `vite/lodashMergeShim.js` (`merge` from `lodash-es`, as named and default export); `SelectEntityInstanceEditor.tsx` and `JsonObjectEditFormDialog.tsx` import `lodash-es` |
| D5 | Library label from the cached `applications` rows, falling back to the uuid; no import of `miroir-example-library` in `MlElementEditorHooks.ts` |
| D6 | `GlideDataGridComponent` behind `React.lazy` in `EntityInstanceGrid.tsx` and `ValueObjectGrid.tsx` |
| D7 | Vite plugin resolving shiki's `./langs.mjs` to a generated module with json, javascript, typescript, tsx, jsx, yaml, shellscript, python, sql, html, css, xml |
| D8 | esbuild `splitting` for the Electron main process; store packages imported per configured store in `environmentBoot.ts`; `miroir-ai` and `miroir-mcp` imported when their feature is on in `ipcServerSetup.ts` |
| D9 | F10 rejected; G2 and E3 not in this plan |
| D10 | One PR, one green commit per slice, each lowering `eagerGzipBaseline` (web) or the Electron baseline |

---

## Allocated UUIDs / keys

No new model element. New MiroirTest cases go into existing suites:

| Artefact | Value |
|---|---|
| YAML OpenAPI case | suite `tr.syncExternalServiceSchema` (`f4e5dde0-3dba-493b-a208-04494dbbb2f5`), new test `parses a YAML OpenAPI document` |
| Model update suite (unchanged, proves D3) | `fn.modelUpdate` (`31287a16-b711-4f70-b8a6-1974cbf05e42`) |
| Build tests | `tests/0_build/bundleReport.unit.test.ts` (extended), `tests/0_build/homePageLoad.unit.test.ts` (cap lowered) |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Web build + report | `npm run build -w miroir-standalone-app` |
| Web guard | `python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json` |
| Electron build + guard | `npm run build -w miroir-standalone-app-electron`, then the guard on `packages/miroir-standalone-app-electron/dist/bundle-report.json` |
| Build tests | `npm run testByFile -w miroir-standalone-app -- bundleReport.unit homePageLoad electronBundle` |
| MiroirTest | `npm run testMiroir -w miroir-core -- --suites <key> --mode unit` |
| Coverage tour | `MIROIR_TOUR_BROWSER=/opt/pw-browsers/chromium npm run coverageTour -w miroir-standalone-app -- --serve` (after `npm run build:release -w miroir-server`) |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |

Build tests are vitest, not MiroirTest: they read the production build's report, which no MiroirTest can reach.

---

## Slice 0 — Characterize the baseline after the MUI 9 bump

**Status:** ✅ DONE

### Goal

Record the build every later slice compares to.

### 0.1

Fresh build of `_integration` 276e43aa: web eager gzip 881 289 (policy baseline 867 330, +1.6%, inside tolerance); home page load → measure; grid chunk 372 332; `dist/` JS 23.1 MB in 391 chunks; Electron 3 184 414. No policy change.

### Validation

Web and Electron guards 0 violations; `npm run testByFile -w miroir-standalone-app -- bundleReport.unit homePageLoad electronBundle`.

### Realization

Fresh `npm ci` + `./build-all.sh` on `_integration` 276e43aa. Web eager gzip **881 289** (4 chunks; guard 0 violations, +1.6% over the 867 330 baseline, from `@mui/material` 9); home page load **1 405 734** in 12 chunks (cap 1 450 000); grid chunk 372 332; `dist/` JS 23 140 723 bytes in 391 chunks; Electron 3 184 414 (guard 0 violations). Build tests 13 passed. The 9 trial builds of the analysis used this build as their baseline.

---

## Slice 1 — The page loads no YAML parser (tracer)

**Status:** ✅ DONE

### Goal

The page ships no `yaml`; a YAML OpenAPI document is still parsed, in Node and in the browser.

### 1.1 RED

- `forbiddenEager`: `yaml`. Guard fails (`index.tsx → miroir-core → yaml`).
- `tr.syncExternalServiceSchema`: new case `parses a YAML OpenAPI document`, the same document as an existing JSON case written as YAML, same expected result. Passes today (characterizes the behaviour to keep).

### 1.2 GREEN

`syncExternalServiceSchema.ts`: no static `yaml` import; Node evaluates `await import("yaml")` at module load; `ensureYamlParser()` (exported) loads it elsewhere; `parseOpenApiDocument` throws "YAML parser not loaded: await ensureYamlParser() first" on YAML text without it. `DomainController` awaits it before the external service sync actions; the web entry calls it after the first render. Rebuild miroir-core and the app; lower the baseline.

### 1.3 Refactor checkpoint

One helper for "load this Node module now in Node, on demand in the browser" if `SecretsService.ts` and this file share the same shape.

### Validation

Guard; `npm run testMiroir -w miroir-core -- --suites tr.syncExternalServiceSchema --mode unit`; `npm run test -w miroir-core -- ''`; typecheck miroir-core, miroir-standalone-app; `npm run nonreg:filesystem -- --runner shared --scope smoke,core,external`.

### Realization

- Page eager gzip 881 289 → 850 787 (−30 502, trial said −30 876); `eagerGzipBaseline` lowered to 850 787. `yaml` moved from `eager` to `lazy` and added to `forbiddenEager`.
- `tr.syncExternalServiceSchema` gained "parses a YAML OpenAPI document (#370: yaml loads on demand)" (the first case's document as YAML, written with pyyaml `safe_dump`); 5 passed before and after the change.
- `DomainController` awaits `ensureYamlParser()` in `handlePrepareOpenApiDocument` and `handleConnectExternalService`. The `syncExternalServiceSchema` transformer stays synchronous: in the browser it relies on the call in `index.tsx` after the first render.
- Refactor checkpoint: `SecretsService.ts` has the same three-line shape. A shared helper would have to take a loader closure to keep the import literal visible to the bundler, which saves nothing for two uses; not extracted.
- Validation: guard 0 violations; `testMiroir tr.syncExternalServiceSchema` 5 passed; `npm run test -w miroir-core` 2134 passed, 1 skipped; miroir-core typecheck clean; nonreg `--scope smoke,core,external` 30 passed (snapshot `20261001T195728Z`).
- The miroir-standalone-app typecheck fails on `_integration` already: 32 errors in 8 files from the MUI 9 bump (#364: `Grid item`, `InputProps`, `inputProps`, `Stack justifyContent`), none in files this slice touches. Out of scope here.

---

## Slice 2 — The page loads no IndexedDB store

**Status:** ✅ DONE

### Goal

The page ships no IndexedDB store code; an environment with IndexedDB sections opens them as before.

### 2.1 RED

`forbiddenEager`: `abstract-level`, `browser-level`, `level`. Guard fails (`index.tsx → miroir-store-indexedDb → level`).

### 2.2 GREEN

`miroir-store-indexedDb/src/startup.ts`: the three `register…Factory` calls stay; their bodies `await import("./4_services/…")`. tsup keeps ESM splitting. Rebuild the store and the app; lower the baseline.

### 2.3 Refactor checkpoint

Same shape for the other stores' `startup.ts` only if it changes nothing for the web build (they are aliased away there since #337): note, do not widen.

### Validation

Guard; IndexedDB stores still work: `MIROIR_ENV=test-indexedDb npm run testMiroir -w miroir-standalone-app -- --suites tr.core --mode integration` (fall back to the nearest IndexedDB integration step of the manifest if `tr.core` needs another profile); typecheck miroir-store-indexedDb; `npm run nonreg:filesystem -- --runner shared --scope smoke,actions`.

### Realization

- Page eager gzip 850 787 → 816 811 (−33 976, trial said −35 099); `eagerGzipBaseline` lowered. `level`, `browser-level`, `abstract-level` added to `forbiddenEager`; `--init` moved them and their dependencies (`buffer`, `events`, `ieee754`, `catering`, `level-supports`, `level-transcoder`, `module-error`, `queue-microtask`, `run-parallel-limit`, `node:fs via miroir-store-indexedDb`) from `eager` to `lazy`.
- Deviation: lazy factory bodies alone changed nothing (850 998), because `src/index.ts` re-exported `IndexedDb`, `IndexedDbDataStoreSection` and `IndexedDbModelStoreSection` statically. No package imports them (only `miroirIndexedDbStoreSectionStartup` is used, in 34 files), so the package now exports the startup function only.
- tsup's ESM splitting emits one chunk per store class (`IndexedDb-*.js`, `IndexedDbAdminStore-*.js`, …); no tsup config change.
- Refactor checkpoint: the other stores' `startup.ts` are aliased away in the web build since #337; left as they are.
- Validation: guard 0 violations; `MIROIR_ENV=test-indexedDb testMiroir tr.core --mode integration` 261 passed (every application on `indexedDb`); miroir-store-indexedDb typecheck clean; nonreg `--scope smoke,actions` 19 passed (snapshot `20261001T201335Z`).

---

## Slice 3 — The page loads no JSON diff

**Status:** ✅ DONE

### Goal

`json-diff`, `@ewoudenberg/difflib` and the `assert` polyfill leave the page; `fn.modelUpdate` passes unchanged.

### 3.1 RED

`forbiddenEager`: `json-diff`, `@ewoudenberg/difflib`, `assert`. Guard fails.

### 3.2 GREEN

`FunctionCallTestRegistry.ts`: a module entry is either an export map or a loader; `"miroir-core/1_core/model/ModelUpdate": () => import("../1_core/model/ModelUpdate")`; `resolveFunctionCallTarget` async; its caller (`FunctionCallTestTools.ts` line 232) awaits it; `listWhitelistedFunctionRefs` keeps listing loader entries (the export names stay declared next to the loader). Rebuild; lower the baseline.

### 3.3 Refactor checkpoint

Other registry entries whose modules are eager anyway stay plain maps.

### Validation

Guard; `npm run testMiroir -w miroir-core -- --suites fn.modelUpdate --mode unit`; `npm run test -w miroir-core -- ''`; typecheck miroir-core; `npm run nonreg:filesystem -- --runner shared --scope smoke,core` (full `nonreg:filesystem` after this slice: slices 1–3 touch miroir-core).

### Realization

- Page eager gzip 816 811 → 784 301 (−32 510, trial said −33 839); `eagerGzipBaseline` lowered. `json-diff`, `@ewoudenberg/difflib`, `assert` added to `forbiddenEager`; `--init` moved them and the polyfill packages only `assert` needed (`util`, `object.assign`, `which-typed-array`, …) to `lazy`. Two small `vite-plugin-node-polyfills` chunks are now shared between the entry and lazy chunks, so the page loads 5 chunks instead of 4.
- `FunctionCallTestRegistry.ts`: a module entry is an export map or `{ exports, load }`; `resolveFunctionCallTarget` is async and `runMiroirFunctionCallTestInMemory` awaits it; `listWhitelistedFunctionRefs` lists the declared export names. The registry unit test now expects rejections.
- Deviation: the loader alone was not enough. miroir-core's tsup config has `splitting: false` and `json-diff` is external, so the dynamic import of `ModelUpdate` was inlined and its static `json-diff` import stayed at the top of `dist/index.js`. `ModelUpdate.ts` now loads `json-diff` the slice 1 way (at module load in Node, `ensureJsonDiff()` elsewhere, reading `diff` or `default.diff` for the CommonJS module), and the registry loader awaits `ensureJsonDiff()`. Turning on tsup splitting for miroir-core was not tried: wider change than this slice.
- Validation: guard 0 violations; `testMiroir fn.modelUpdate` 6 passed; `npm run test -w miroir-core` 2134 passed, 1 skipped; miroir-core typecheck clean; full `nonreg:filesystem --runner shared` 87 passed (snapshot `20261001T202417Z`).

---

## Slice 4 — The page loads `merge`, not lodash

**Status:** ✅ DONE

### Goal

The page ships no `lodash` CommonJS build; redux-saga-promise still merges its actions.

### 4.1 RED

`bundleReport.unit`: new case "only the redux-saga-promise shim imports bare lodash": no chunk holds package `lodash` with a module `node_modules/lodash/lodash.js`. Fails today (578 k in the entry, 99 in `ReportDisplay`).

### 4.2 GREEN

`vite/lodashMergeShim.js`; alias `^lodash$` in `vite.config.js` (build and dev, not vitest); the two `import _ from "lodash"` move to `lodash-es` named imports. Rebuild; lower the baseline.

### 4.3 Refactor checkpoint

None expected.

### Validation

Guard; `bundleReport.unit`; typecheck miroir-standalone-app; `npm run nonreg:filesystem -- --runner shared --scope smoke,localcache,ui` (promise actions run through the local cache).

### Realization

- Page eager gzip 784 301 → 757 610 (−26 691, trial said −28 849); `eagerGzipBaseline` lowered; `lodash` added to `forbiddenEager` and moved to `lazy`.
- `vite/lodashMergeShim.js` re-exports `merge` from `lodash-es`; `vite.config.js` aliases `^lodash$` to it in every mode but `test`, ahead of the #337 store aliases (build only).
- Deviation: the RED test as planned ("no chunk holds lodash") would stay red: glide-data-grid imports per-method modules (`lodash/has.js`, …, 163 modules) in its lazy grid chunk. The report lists packages, not modules, so the test checks that every chunk holding `lodash` reaches it through `@glideapps/glide-data-grid`. Red before the change (the entry held lodash through redux-saga-promise), green after.
- `SelectEntityInstanceEditor.tsx` and `JsonObjectEditFormDialog.tsx` import named functions from `lodash-es`. The app now declares `lodash-es` 4.18.1 (the version the root override already pins; one line in the lockfile's workspace entry). lodash-es has no types and `@types/lodash-es` is not installed, so `src/lodash-es.d.ts` re-exports the four functions' types from `@types/lodash`.
- Validation: guard 0 violations; `bundleReport.unit` 6 passed; no new typecheck errors in miroir-standalone-app (the 32 pre-existing MUI 9 errors remain); nonreg `--scope smoke,localcache,ui` 36 passed (snapshot `20261001T205155Z`). The dev server was not started: the alias also applies there, untested.

---

## Slice 5 — The page loads no Library example

**Status:** ✅ DONE

### Goal

The page ships no `miroir-example-library`; the application picker still labels the Library application.

### 5.1 RED

`forbiddenEager`: `miroir-example-library`. Guard fails (`MlElementEditorHooks.ts`).

### 5.2 GREEN

`MlElementEditorHooks.ts` lines 505–508: no `selfApplicationLibrary`; the label comes from the `applications` rows (lines 498–504), the uuid when absent. Rebuild; lower the baseline.

### 5.3 Refactor checkpoint

`knownNames` for Miroir and Admin stay (their packages are eager anyway).

### Validation

Guard; the component tests that render an application picker (`npm run nonreg:filesystem -- --runner shared --scope smoke,ui`); typecheck miroir-standalone-app.

### Realization

- Page eager gzip 757 610 → 746 687 (−10 923, trial said −11 366); `eagerGzipBaseline` lowered; `miroir-example-library` added to `forbiddenEager` and moved to `lazy`.
- Deviation from D5: labelling from the Admin `applications` rows alone failed `report.connectExternalServiceWizard` ("the application picker lists Library, not Miroir or Admin"): the wizard runs in a sandbox whose cache has no Admin `applications` rows, so the picker showed the Library uuid. The fallback now reads each application's own SelfApplication row (its `name`) from its model section in the local cache (`useSelfApplicationLabels` in `MlElementEditorHooks.ts`, one `useSelector` with `shallowEqual`). Order: Admin row label, then SelfApplication name, then Miroir/Admin constants, then the uuid.
- Validation: guard 0 violations; no new typecheck errors in miroir-standalone-app; nonreg `--scope smoke,ui` 25 passed (snapshot `20261001T212126Z`; the run before the fallback, `20261001T210507Z`, failed `appstack-report-tests` as described).

---

## Slice 6 — The first list loads one grid library

**Status:** ✅ DONE

### Goal

A list shown with ag-grid (the default) fetches no glide-data-grid; a list with `gridType: glide-data-grid` still renders.

### 6.1 RED

`bundleReport.unit`: new case "the chunk holding ag-grid holds no glide-data-grid". Fails today (one grid chunk).

### 6.2 GREEN

`GlideDataGridComponent` through `React.lazy` in `EntityInstanceGrid.tsx` and `ValueObjectGrid.tsx`, inside `Suspense` with `CenteredSpinner`. Rebuild.

### 6.3 Refactor checkpoint

The lazy declaration lives in `LazyGrids.tsx` with the #337 ones.

### Validation

Build tests; grid tests including glide (`integ-gridPagination`, `unit-gridPagination`, `ViewParamsUpdateQueue` with `glide-data-grid`) through `npm run nonreg:filesystem -- --runner shared --scope smoke,ui`; coverage tour (Library Books grid).

### Realization

- The ag-grid list chunk (`ValueObjectGrid-*.js`) went from 372 332 to 268 310 bytes gzipped (−104 022, trial said −98 729); glide-data-grid is its own `GlideDataGridComponent-*.js` chunk (104 340 gzipped). The page is unchanged (746 696, within tolerance of the baseline).
- `LazyGrids.tsx` declares `GlideDataGridComponent` with `React.lazy`; `EntityInstanceGrid.tsx` and `ValueObjectGrid.tsx` import it from there and render it inside `Suspense` with `CenteredSpinner`. `bundleReport.unit` gained "the chunk holding ag-grid holds no glide-data-grid" (red before, green after).
- `gridPagination.integ` asserted on the grids right after `render`. Glide tests now wait for the lazy grid (`findByTestId`, `waitFor` on the glide container). The ag-grid tracer test through `ReportSectionListDisplay` also failed when the file ran alone, even with this slice's source reverted (its grid has been lazy since #337; the shared runner had warmed the module cache); it now waits for `.ag-paging-panel` too.
- Validation: guard 0 violations; `bundleReport.unit` 7 passed; `homePageLoad`, `bundleSourcemaps`, `electronBundle` 10 passed; `gridPagination` (unit and integ) 41 passed; no new typecheck errors; nonreg `--scope smoke,ui` 25 passed (snapshot `20261001T214821Z`). The coverage tour was not run separately.

---

## Slice 7 — Releases ship 12 grammars

**Status:** ✅ DONE

### Goal

`dist/` holds the 12 chosen grammars; the Copilot sidebar still renders code blocks.

### 7.1 RED

`bundleReport.unit`: new case "ships at most 12 shiki grammar chunks". Fails today (235).

### 7.2 GREEN

`vite/shikiLanguagesPlugin.js` resolving `./langs.mjs` imported from `shiki/dist/` to the generated module (D7 list, one constant). Rebuild.

### 7.3 Refactor checkpoint

None expected.

### Validation

Build tests; coverage tour (Copilot sidebar page); record `dist/` JS size and chunk count; `npm run nonreg:filesystem -- --runner shared --scope smoke,ui`.

### Realization

- `dist/assets` JS 23 072 551 → 16 606 652 bytes, 405 → 182 files (trial said 23.1 → 16.7 MB, 391 → 168: the count had grown since slice 0 with the new lazy chunks). The page is unchanged (746 693).
- `vite/shikiLanguagesPlugin.js` (`SHIKI_LANGUAGES`, the D7 list) resolves the `./langs.mjs` imported from `shiki/dist/` to a module generated from shiki's own `bundledLanguagesInfo`, filtered to the list, so the names and aliases (`js`, `ts`, `sh`, `yml`, `py`, …) stay shiki's. A missing grammar fails the build. The plugin runs first in `vite.config.js`.
- `bundleReport.unit` gained "ships at most 12 shiki grammar chunks" (235 before, 12 after: css, html, javascript, json, jsx, python, shellscript, sql, tsx, typescript, xml, yaml).
- Validation: guard 0 violations; build tests (`bundleReport`, `homePageLoad`, `bundleSourcemaps`) 28 passed; nonreg `--scope smoke,ui` 25 passed (snapshot `20261001T220112Z`). The coverage tour was not run: no automated check renders a Copilot code block, so highlighting in the sidebar is untested.

---

## Slice 8 — Electron loads only the stores and features it uses

**Status:** ✅ DONE

### Goal

The packaged app with the `desktop` environment reads no MongoDB or PostgreSQL driver at start; an environment with those stores still opens them; AI and MCP still start when enabled.

### 8.1 RED

`electronBundle.unit`: new case "the main entry chunk holds no `mongodb` and no `sequelize`". Fails today (one file).

### 8.2 GREEN

`bundle-main.mjs`: `splitting: true`, `outdir` for the main process (preload stays one CommonJS file); `environmentBoot.ts` imports each store package for the store types the environment names; `ipcServerSetup.ts` imports `miroir-ai` when `ai` is on and `miroir-mcp` when `mcp` is on. The bundle report counts the entry chunk as eager and the split chunks as lazy; Electron policy lists move; baseline lowered.

### 8.3 Refactor checkpoint

The electron-builder `files` filter includes the new chunks (`dist/src/**`).

### Validation

Electron build + guard; `electronBundle.unit`; packaged smoke (`electron-builder --dir -c.npmRebuild=false`, `xvfb-run`): "IPC server ready", and time from launch to that line before and after (median of 3); `npm run nonreg:filesystem -- --runner shared --scope smoke,tooling`; typecheck miroir-standalone-app-electron.

### Realization

- What the main process reads at start went from 3 184 414 to 1 005 067 bytes gzipped (7 chunks of 40; the whole build is 3 198 123). The `desktop` environment then loads the filesystem store, miroir-ai and miroir-mcp (both features are on); the MongoDB, PostgreSQL and IndexedDB stores stay unread. Packaged app, launch to "IPC server ready" under `xvfb-run`, median of 3: 2.63 s before, 2.35 s after.
- Deviation: instead of importing the store packages the environment names, `src/storesOnDemand.ts` registers placeholder factories for each store type (admin and the three sections). The first call imports the package, runs its startup on a scratch `ConfigurationServiceInner`, puts the real factories in the registry and delegates. A store opened later (an application installed on another store from the UI) still works, and `getProcessCapabilities`, which reads the registry keys, sees the same store types as before.
- `ipcServerSetup.ts` imports `miroir-ai` (Copilot route, Cursor check) and `miroir-mcp` inside the branches that use them. `bundle-main.mjs` builds the main process with `splitting: true` into `dist/src/` (chunks in `dist/src/chunks/`); electron-builder's `dist/**/*` already packages them.
- Deviation: with splitting, esbuild sets `entryPoint` on the chunk of every dynamic import target, so the report counted 22 entry chunks. `reportInputFromEsbuildMetafile` now counts as entries only outputs whose entry point is not a dynamic import target (new `bundleReportCore.unit` case). The Electron policy was regenerated: baseline 1 005 067, a `lazy` list, `miroir-core/dist/index.js` out of `defeatedDynamicImports`.
- `electronBundle.unit`: the entry test checks entry chunks only; new case "loads no MongoDB or PostgreSQL driver, miroir-ai or miroir-mcp at start" (red on the old report: `src/main.js` held sequelize, mongodb, miroir-ai, miroir-mcp).
- Validation: both guards 0 violations; `0_build` tests 46 passed, 3 skipped; Electron package tests (`environmentBoot.integ`, boots `desktop`) 3 passed; Electron typecheck clean; packaged smoke as above; nonreg `--scope smoke,tooling` 21 passed (snapshot `20261001T221440Z`).

---

## Slice 9 — Nonreg, docs, cleanup, AC

**Status:** ✅ DONE

### 9.1 Nonreg

`npm run nonreg:filesystem -- --runner shared` green. No new manifest step (build tests need a fresh build, as #326 decided).

### 9.2 Docs

`docs/internals/code-splitting.md`: page table and cuts table from the final build, grids (one library per list), shiki grammars, Electron split, the lodash shim and why.

### 9.3 Cleanup

No issue-scoped test directory is created by this plan: the build tests are the feature-named ones. `homePageLoad` cap lowered to the final load plus 4%.

### 9.4 Tracer narrative

Manual: home page with DevTools Network: no `yaml`, `level`, `json-diff`, `lodash.js`, Library chunk; open a list: one grid library; open the Copilot sidebar and ask for code: highlighted for the 12 languages. Automated: the guards, build tests and tour.

### AC checklist (#370)

| Item (issue) | Proof | Status |
|---|---|---|
| F9 grids | slice 6 | ✅ |
| F12 Library label | slice 5 | ✅ |
| F13 lodash | slice 4 | ✅ |
| yaml | slice 1 | ✅ |
| F8 shiki | slice 7 | ✅ |
| F10 never-run packages | rejected in the analysis (73 kB, all in use by loaded features) | ✅ rejected |
| Electron leftovers | slice 8 (stores, AI, MCP); `iconv-lite` deferred (E3) | ✅ (`iconv-lite` left) |
| New: IndexedDB store, JSON diff | slices 2, 3 | ✅ |

### Realization

| Measure | Slice 0 | After slice 8 |
|---|---|---|
| Page eager gzip (`index.html` preloads) | 881 289 (4 chunks) | 746 693 (5 chunks), −15% |
| Home page load | 1 405 734 (12 chunks) | 1 280 602 (16 chunks), −9% |
| ag-grid list chunk | 372 332 | 268 311 |
| `dist/assets` JavaScript | 23 140 723 bytes, 391 files | 16 606 652 bytes, 182 files |
| Electron main process read at start | 3 184 414 | 1 005 067 |
| Packaged Electron, launch to "IPC server ready" (median of 3) | 2.63 s | 2.35 s |

- The analysis expected about 743 kB on the page; the result is 747 kB. Each cut came within 1.5 kB of its trial except lodash (−26.7 kB measured, −28.8 kB trial).
- Docs: `docs/internals/code-splitting.md` (page table from the final build, the #370 cuts table, conditional dynamic imports, grids, shiki, the Electron split, the lodash shim, the tsup inlining pitfall, follow-ups). `homePageLoad` cap lowered from 1 450 000 to 1 335 000 (final load plus about 4%).
- Full `nonreg:filesystem --runner shared` (snapshot `20261001T221949Z`): 86 passed, 1 failed. `unit-275-cursor-sdk` characterized `ipcServerSetup.ts` importing `createCopilotKitRouter` statically, which slice 8 changed on purpose; the case now checks the on-demand import and that no static `miroir-ai` import is left. The step passes alone.
- Pre-push gate: skills sync, `scripts/tests` (200 passed), dependency policy, lint, `miroir-env check --strict --tracked-clean`, miroir-core typecheck and tests all clean. The miroir-standalone-app typecheck keeps its 32 errors from the MUI 9 bump, none in files this plan touched.
- Not verified by hand: the tracer narrative's manual DevTools walk and the coverage tour were not run in this session.
