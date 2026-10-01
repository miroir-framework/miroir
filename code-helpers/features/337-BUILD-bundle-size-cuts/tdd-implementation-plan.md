# Issue #337 — TDD Implementation Plan

> Vertical slices (RED → GREEN each). The applicative interface here is the **bundle guard**: each slice first states its cut as a policy constraint in `packages/<app>/bundle-policy.json` (a forbidden eager package, a new rule, a lower baseline), sees `scripts/check_bundle_policy.py` fail on the current build (RED), then changes the build or the code until the guard passes (GREEN) and lowers `eagerGzipBaseline`. New guard rules are proven by pytest on the guard; page-load facts the report does not hold (what the home page fetches) by a vitest reading `dist/`. That the app still works is proven by the coverage tour (real server, real browser, 7 pages) and nonreg. No mocks. The tracer bullet (slice 1) runs the whole loop once on the largest cut.
>
> **Execution model:** one branch, one green commit per slice. Each slice ends with its Validation commands; on success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/337
Prerequisite: [`../326-BUILD-build-hardening/`](../326-BUILD-build-hardening/) ✅
Working branch: `claude/issue-337-analysis-yjkuzv`

**Resume note:** all slices DONE; the follow-up issue draft is at the end of slice 8.

---

## Scope

- Standalone app: manual chunks (D1), lazy `ReportDisplay` and guard on defeated dynamic imports (D2), lazy `node:crypto` (D3), tree-shaken meta-model and Library deployments (D4, F12), lazy CodeMirror (D5), Node store drivers out of the web build (D6).
- Electron main process: React-free `miroir-localcache-redux` entry and minified bundle (D7).
- Guard additions that keep each gain (goal 3).

This plan does **not** cover: F13 (`lodash`), `yaml`, the grid split by `gridType`, shiki grammars (S1), Rolldown (M4), C2/C3, D2 (package split), X3. They stay listed in the analysis as later options; a follow-up issue collects the ones still worth doing after the tour of the last slice.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the baseline build | ✅ | guard passes; baseline numbers recorded |
| 1 | CopilotKit and ag-grid leave the page (tracer) | ✅ | `forbiddenEager` + guard; coverage tour |
| 2 | The home page stops loading the grids | ✅ | new `defeated` rule (pytest) + `homePageLoad` vitest; tour |
| 3 | The crypto polyfill leaves the page | ✅ | `forbiddenEager` crypto packages; secrets tests; nonreg filesystem |
| 4 | Only the used meta-model and Library JSON loads | ✅ | new `eagerPackageMaxBytes` rule (pytest); guard; MiroirTest CLI |
| 5 | CodeMirror loads with the first code field | ✅ | `forbiddenEager` `@codemirror/*`; tour |
| 6 | Node store drivers leave the web build | ✅ | policy `lazy` list shrinks; vitest integ still uses real stores |
| 7 | Electron main process without React, minified | ✅ | Electron `forbiddenEager` `react-dom`; Electron smoke |
| 8 | Nonreg, docs, cleanup, AC | ✅ | nonreg filesystem + tour + AC table |

---

## Locked implementation defaults

Accepted by A on 2026-09-30 ("go" on the analysis). Deviations go into the slice's Realization.

| Decision | Choice |
|---|---|
| D1 Manual chunks | M1: drop `vendor-copilotkit`, `vendor-ag-grid`, and the dead `miroir-diagram-class` clause of `vendor-d3`; `@copilotkit/*` and `ag-grid-*` in `forbiddenEager` |
| D2 Defeated lazy routes | R3 (guard rule). R1 replaced by lazy grids: see slice 2 deviation |
| D3 Crypto polyfill | C1: `node:crypto` imported dynamically (see refinement below) |
| D4 Meta-model deployment | D1: delete `MIROIR_TEST_SUITE_REGISTRY` and `loadMiroirCoreTestSuite`, `"sideEffects": false` and tree-shaking for `miroir-app-miroir` (and `miroir-example-library`, F12), size guard |
| D5 CodeMirror | G1: `React.lazy` with a `<pre>` fallback |
| D6 Node drivers | H1: alias to a throwing stub in the web build only |
| D7 Electron | X1 (React-free entry), X2 (`minify: true`, `keepNames` kept) |
| D8 Delivery | **Re-flagged:** one branch and one PR, one commit per slice, each commit lowering `eagerGzipBaseline`. The ratchet holds per commit, as D8 wanted per PR; stacked PRs cannot be retargeted here (#335). A can still ask for one PR per slice |

**C1 refinement.** `encryptSecret`, `decryptSecret`, `hydrateSecrets` are synchronous and used by `miroir-server/src/server.ts` and the #270 tests. To keep them synchronous: `SecretsService` loads `node:crypto` with a top-level `await import()` when running on Node (`process.versions.node`), and exports `ensureSecretsCrypto()` that loads it on demand elsewhere; the async callers (`DomainController.connectExternalService`, `persistImportedProcessSecrets`) await it first. A sync call before loading throws "secrets crypto not loaded". Verified in slice 3 before GREEN; if the bundler keeps the import eager, fall back to the analysis's async form.

---

## Allocated UUIDs / keys

No model element and no MiroirTest suite: the behaviours are build properties.

| Artefact | Value |
|---|---|
| Guard rule, R3 | `defeatedDynamicImports` (policy key: list of accepted modules; `check_bundle_policy.py` rule name `defeated`) |
| Guard rule, D4 | `eagerPackageMaxBytes` (policy key: package → max rendered bytes loaded with the page; rule name `size`) |
| Issue-scoped vitest | `packages/miroir-standalone-app/tests/0_build/homePageLoad.unit.test.ts` (moved there in slice 8) |
| Nonreg step | none new: the guard runs in the `bundle report + guards` job of `pr-checks.yml`; see slice 8 |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Standalone build + report | `npm run build -w miroir-standalone-app` |
| Standalone guard | `python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json` |
| Electron build + guard | `npm run build -w miroir-standalone-app-electron && python scripts/check_bundle_policy.py packages/miroir-standalone-app-electron/dist/bundle-report.json packages/miroir-standalone-app-electron/bundle-policy.json` |
| Guard unit tests | `python -m pytest scripts/tests/test_check_bundle_policy.py -q` |
| Build tests (read `dist/`) | `npm run testByFile -w miroir-standalone-app -- 0_build` |
| Coverage tour (real server + browser) | `npm run build:release -w miroir-server && MIROIR_TOUR_BROWSER=/opt/pw-browsers/chromium npm run coverageTour -w miroir-standalone-app -- --serve` |
| Secrets tests | `npm run testByFile -w miroir-core -- secrets` |
| miroir-core unit | `npm run test -w miroir-core -- ''` |
| Nonreg | `npm run nonreg:unit -- --runner shared`; `npm run nonreg:filesystem -- --runner shared` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |

After a baseline change, `--init` is **not** used: the slice edits `eagerGzipBaseline` and moves the named packages by hand, so the review shows each move.

---

## Slice 0 — Characterize the baseline build

**Status:** ✅ DONE

### Goal

A fresh build of the merged branch passes the guard; its numbers (eager chunks, eager gzip, home page fetch, `ReportDisplay` chunk) are recorded here as the reference for every later slice.

### 0.1 RED → GREEN

- Build; run the guard and the `0_build` tests. Expected: 0 violations, eager gzip within 2% of 2 721 507.
- Record: eager gzip, eager chunks, `ReportDisplay-*` gzip, total chunks. If the guard fails, the failure comes from `_integration` changes since #326: fix the policy (by hand) in this slice before any cut.

### Validation

Standalone build + guard; `npm run testByFile -w miroir-standalone-app -- 0_build`.

### Realization

Build of `_integration` fde1e47 merged into the branch (2026-09-30), after `npm ci` and `./build-all.sh` (the container had pre-#346 `node_modules`). Standalone guard: 0 violations, 7 eager chunks, **2 725 899** bytes gzipped (baseline 2 721 507, +0.2%); 387 chunks, 6 266 735 bytes gzipped in all; `ReportDisplay-*` 244 717, `HomePage-*` 1 257. Electron guard: 0 violations, 4 775 734 (baseline 4 769 537). Build tests: all pass once the Electron app is built (`electronBundle.unit` needs `npm run build -w miroir-standalone-app-electron`).

---

## Slice 1 — CopilotKit and ag-grid leave the page (tracer)

**Status:** ✅ DONE

### Goal

The page no longer preloads CopilotKit, its markdown stack, or ag-grid: an application user opens the home page without them (goal 1), and a maintainer's build fails if either comes back (goal 3).

### 1.1 RED

`bundle-policy.json`: add `@copilotkit/*` and `ag-grid-*` to `forbiddenEager`. Guard on the slice 0 build: `[forbidden] @copilotkit/core loads with the page …`, `[forbidden] ag-grid-community …`.

### 1.2 GREEN

- `vite/manualChunks.js`: remove the `vendor-copilotkit` and `vendor-ag-grid` rules and their names in `MIROIR_MANUAL_CHUNK_NAMES`; drop the `miroir-diagram-class` clause of `vendor-d3`.
- Rebuild; move the packages that went lazy from `eager` to `lazy` in the policy (trial A: 202 packages), lower `eagerGzipBaseline` to the new value (trial A: 1 578 695).
- `vite.config.js` `optimizeDeps.include` and `src/chunkLoadTrace.ts` (dev tracing names) keep working; update the names they map if they refer to removed chunks.

### 1.3 Refactor checkpoint

`chunkLoadLoggerPlugin.js` and `chunkLoadTrace.ts`: remove mappings to the two removed chunk names. Test `bundleReport.unit` assertions that name `vendor-copilotkit`/`vendor-ag-grid` updated to the new facts.

### Validation

Standalone build + guard (0 violations); `pytest scripts/tests -q`; `npm run testByFile -w miroir-standalone-app -- 0_build`; coverage tour (all 7 pages load; Copilot sidebar opens); `npx tsc … -p packages/miroir-standalone-app/tsconfig.json`.

### Realization

RED: 9 `[forbidden]` violations on the slice 0 build. GREEN as planned; also removed the two mappings of `src/chunkLoadTrace.ts`, reworded two comments naming `vendor-copilotkit`, and rewrote the three build-test assertions that described the #326 facts (`bundleReport.unit`: CopilotKit and ag-grid only in lazy chunks; the meta-model chunk found by content, not by its `mermaid-VLURNSYL` name; `bundleSourcemaps.unit` checks `vendor-mui`; `bundleReportCore.unit`: CopilotKit left to Rollup). Policy lists moved with a script (no `--init`): 190 eager, 358 lazy. **Eager gzip 2 725 899 → 1 577 325 (−42.1%)**, 5 eager chunks. Coverage tour: 7 of 7 pages, Copilot sidebar included.

---

## Slice 2 — The home page stops loading the grids

**Status:** ✅ DONE

### Goal

Opening the home page fetches neither ag-grid nor glide-data-grid (the home report has only markdown, input and open-report sections); a report with a list section fetches them when that section first renders. A maintainer's build fails when a new static import defeats a dynamic one.

**Deviation from D2 (found while planning):** `HomePage.tsx` renders `ReportDisplay` at once (the home page *is* a report: `reportMiroirWebAppOrDesktopHome`, or the sandbox home), and `SettingsPage.tsx` does too. Making `ReportDisplay` lazy there (R1) saves nothing. What makes the report chunk heavy is the grids, statically imported by `ReportSectionListDisplay.tsx → EntityInstanceGrid.tsx` (and `TestResultsGrid.tsx → ValueObjectGrid.tsx`). So this slice makes the grids lazy instead (analysis F9 option, narrowed), accepts the `ReportDisplay` finding in `defeatedDynamicImports` with that reason, and removes the `uiIntegrationTestRunState.ts` finding (a 27-line module: `RunAllMiroirTestsButton.tsx` imports it statically too). R3 (the guard rule) is kept.

### 2.1 RED

- `scripts/tests/test_check_bundle_policy.py`: `test_init_accepts_the_defeated_dynamic_imports_of_the_report`, `test_a_defeated_dynamic_import_fails_unless_accepted`, `test_an_accepted_defeated_import_that_now_splits_off_must_be_removed`. They fail: no such rule.
- `homePageLoad.337.phase2.unit.test.ts` (vitest; not reachable through MiroirTest: it reads the production build's manifest and report): the chunks the home page loads (static closure of the entry plus that of the `HomePage` and `ReportDisplay` route chunks) hold no `ag-grid-community` and no `@glideapps/glide-data-grid`. Fails on the slice 1 build.

### 2.2 GREEN

- `check_bundle_policy.py`: rule `defeated` (policy key `defeatedDynamicImports`); `--init` writes the current findings.
- Policy: `defeatedDynamicImports: ["packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ReportDisplay.tsx"]`.
- `RunAllMiroirTestsButton.tsx`: static import of `uiIntegrationTestRunState.ts`.
- `ReportSectionListDisplay.tsx`: `EntityInstanceGrid` through `React.lazy` + `Suspense`; `TestResultsGrid.tsx`: `ValueObjectGrid` the same way.
- Eager gzip unchanged (the report chunk was never preloaded): baseline stays.

### 2.3 Refactor checkpoint

One `LazyGrids.tsx` module declares both lazy grids if the two sites need the same fallback.

### Validation

`pytest scripts/tests/test_check_bundle_policy.py -q`; standalone build + guard; `npm run testByFile -w miroir-standalone-app -- homePageLoad.337`; coverage tour (Library Books grid, Miroir Tests report); `npm run nonreg:unit -- --runner shared` (UI component tests render list sections).

### Realization

RED: 5 new pytest cases failed on the old guard; `homePageLoad.337` failed on the slice 1 build (ag-grid in the chunks the home page fetches). GREEN: rule `defeated` in `check_bundle_policy.py` (and a `size` rule for slice 4, same commit: both are guard rules with their tests); `LazyGrids.tsx` exports lazy `EntityInstanceGrid` and `ValueObjectGrid`, used by `ReportSectionListDisplay.tsx` and `TestResultsGrid.tsx` inside `Suspense` with `CenteredSpinner`; `RunAllMiroirTestsButton.tsx` imports `uiIntegrationTestRunState.ts` statically. The standalone policy accepts `ReportDisplay.tsx` (reason in `$comment`); the Electron policy accepts its two findings (`miroir-app-miroir`, `miroir-core` dist: esbuild writes one file, a dynamic import splits nothing there). `ReportDisplay-*` 244 717 → 133 586 bytes gzipped; the grids are a lazy chunk of 371 511. Eager gzip unchanged (1 577 335). The home page test follows the static imports of `HomePage.tsx` (Rollup merged `ReportDisplay` into a shared chunk named `_ReportDisplay-*`). Coverage tour: 7 of 7 pages, Library grid with 49 rows. `nonreg:unit` (shared runner): 44 passed; `unit-345-electron` failed on the in-progress slice 7 import (`miroir-localcache-redux/node` not built yet), not on this slice.

---

## Slice 3 — The crypto polyfill leaves the page

**Status:** ✅ DONE

### Goal

The page no longer preloads `crypto-browserify`; secrets still encrypt and decrypt on the server, the CLI and in tests.

### 3.1 RED

`forbiddenEager`: `crypto-browserify`, `bn.js`, `elliptic`. Guard fails on the slice 2 build.

### 3.2 GREEN

`SecretsService.ts` per the C1 refinement (Locked defaults): no static `node:crypto` import; top-level load on Node; `ensureSecretsCrypto()` awaited by `DomainController.connectExternalService` before `importProcessSecrets`, and inside `persistImportedProcessSecrets`. Rebuild miroir-core, then the app; move the crypto packages to `lazy`, lower the baseline (≈ −185 kB expected).

### 3.3 Refactor checkpoint

`AuthenticationPolicy.ts` already imports `node:crypto` dynamically at 4 sites: if `SecretsService` now exposes a loader, reuse one loader for both.

### Validation

`npm run testByFile -w miroir-core -- secrets` (#270 suites, `serverSecrets.unit`, `secretAndRightUuid.288.unit`); `npm run test -w miroir-core -- ''`; typecheck miroir-core and miroir-server; standalone build + guard; `npm run nonreg:filesystem -- --runner shared` (DomainController, actions).

### Realization

RED: 3 `[forbidden]` violations (`crypto-browserify`, `bn.js`, `elliptic`). GREEN per the C1 refinement: `SecretsService.ts` has no static `node:crypto` import; a top-level `await import("node:crypto")` runs when `process.versions.node` is set, `ensureSecretsCrypto()` (exported) loads it elsewhere, and `DomainController.connectExternalService` awaits it before `importProcessSecrets`. The sync API is unchanged, so `miroir-server` needs no change. miroir-core dist now has 6 `import('crypto')` and no static one. **Eager gzip 1 577 335 → 1 402 592 (−11.1%)**; 42 crypto packages moved to `lazy`. Refactor checkpoint: `AuthenticationPolicy.ts` keeps its own 4 dynamic imports (already async, one line each; a shared loader would add a module for nothing). Validation: secrets suites 7 files, 49 tests; `npm run test -w miroir-core -- ''` 2 133 passed; `nonreg:filesystem` deferred to after slice 4 (both touch miroir-core).

---

## Slice 4 — Only the used meta-model and Library JSON loads

**Status:** ✅ DONE

### Goal

The page loads the meta-model entries `miroir-core` and the app use, not the MiroirTest definitions and blobs of `miroir-app-miroir`, nor the Library deployment; a maintainer's build fails if the whole package comes back.

### 4.1 RED

- `test_check_bundle_policy.py`: `test_an_eager_package_above_its_size_cap_fails` (rule `size`: `eagerPackageMaxBytes` maps a package to the rendered bytes it may load with the page), `test_a_capped_package_absent_from_the_page_passes`.
- Policy: `eagerPackageMaxBytes: { "miroir-app-miroir": 1000000 }` (today 3 889 022); `forbiddenEager`: `miroir-example-library`. Guard fails.

### 4.2 GREEN

- `miroir-core/src/5_tests/miroirCoreTestSuiteRegistry.ts`: delete `MIROIR_TEST_SUITE_REGISTRY` and `loadMiroirCoreTestSuite` (keep `MIROIR_TEST_SUITE_REGISTRY_NAMES`, `listMiroirTestSuiteKeys`); remove their exports from `index.ts`; update `tests/5-tests/miroirTestSuiteRegistry.unit.test.ts` to the catalog loaders.
- `miroir-app-miroir`, `miroir-example-library`: `"sideEffects": false`; tsup `treeshake` left off if Rollup already drops unused exports (check the report), else on.
- `MlElementEditorHooks.ts`: Library label read from the loaded model rather than importing `miroir-example-library` (or keep the import if tree-shaking reduces it to `selfApplicationLibrary`; then the forbid becomes a size cap).
- Rebuild in `build-all.sh` order; lower the baseline (≈ −400 kB expected).

### 4.3 Refactor checkpoint

Any other `import *` or dynamic import of `miroir-app-miroir` reachable from the browser graph (none found at analysis time outside the registry) is removed or moved to a Node-only module.

### Validation

`pytest`; `npm run test -w miroir-core -- ''`; `npm run testMiroir -w miroir-core -- --suites tr.core --mode unit` (catalog loading); standalone build + guard; `npm run nonreg:unit -- --runner shared`; typecheck miroir-core, miroir-standalone-app.

### Realization

RED: pytest cases of the `size` rule (landed with slice 2); policy caps failed on the slice 3 build (`miroir-app-miroir` 3 879 260 rendered bytes with the page). GREEN: `MIROIR_TEST_SUITE_REGISTRY` (a top-level `await import("miroir-app-miroir")`) and `loadMiroirCoreTestSuite` deleted with their exports; their unit test keeps the suite-name listing. **Eager gzip 1 402 592 → 1 070 644 (−23.7%)**; the meta-model deployment now sits in the entry chunk (4 eager chunks).

Deviations, measured:
- `"sideEffects": false` on `miroir-app-miroir` and `miroir-example-library`, and a trial alias of both packages to their sources (one module per JSON), changed the eager gzip by less than 1% (the alias made it 6 kB larger): what stays is used by eager code (`miroir-core` imports 112 names, `defaultMiroirMetaModel`). Both reverted. The bundle report's per-package rendered bytes for these packages differ between the two variants while the chunk bytes do not, so the `size` cap is set on the measured value with headroom: `eagerPackageMaxBytes: { "miroir-app-miroir": 3300000 }` (today 3 129 112; the whole package is 3.9 M).
- F12 (Library deployment loaded for one label in `MlElementEditorHooks.ts`) not cut: ~21 kB gzip, left to the follow-up issue.
- With the namespace read gone, Rollup tree-shakes the 3.9 MB deployment module statement by statement, and the build ran out of heap at 4 096 MB (twice, reproducible). The standalone `build` script and the `Dockerfile` step now allow 8 192 MB (6 144 was enough here).

Validation: guard 0 violations; `bundleReport.unit` (the meta-model chunk assertion of #326 removed: the chunk no longer exists, the `size` rule replaces it), `bundleSourcemaps.unit`, `homePageLoad.337`; `miroirTestSuiteRegistry.unit`; `testMiroir --suites tr.core --mode unit` 261 passed.

---

## Slice 5 — CodeMirror loads with the first code field

**Status:** ✅ DONE

### Goal

The page loads no CodeMirror; the first code field (read-only block or editor) fetches it and then renders as today.

### 5.1 RED

`forbiddenEager`: `@codemirror/*`, `@uiw/react-codemirror`, `@lezer/*`. Guard fails.

### 5.2 GREEN

`miroir-react/src/components/CodeBlock_ReadOnly.tsx` and `MlElementEditorReactCodeMirror.tsx`: CodeMirror behind `React.lazy` with a `<pre>` fallback showing the same text. The exported component names and props do not change. Rebuild miroir-react, then the app; baseline (≈ −138 kB expected).

### 5.3 Refactor checkpoint

One lazy CodeMirror module shared by both components if their setup is the same.

### Validation

Standalone build + guard; `npm run nonreg:unit -- --runner shared` (component tests that render editors, e.g. transformer editor); coverage tour (Book instance editor page shows code fields); typecheck miroir-react, miroir-standalone-app.

### Realization

RED: `@codemirror/*`, `@uiw/react-codemirror` and `@lezer/*` in `forbiddenEager` failed the guard on the slice 4 build. GREEN: `CodeBlock_ReadOnly` and `MlElementEditorReactCodeMirror` load CodeMirror through `React.lazy`; the read-only block shows the same text in a `<pre>` until it arrives. **Eager gzip 1 070 644 → 902 938 (−15.7%)**, more than the −138 kB expected because the language and search packages went with it.

Deviations:
- 5.3 not done: the read-only block and the editor configure CodeMirror differently (read-only, fold gutter vs. editable with change handlers), so each keeps its own lazy module; both load the same shared CodeMirror chunks.
- `listDisplayByTransformer.integ` (nonreg:unit) read a grid row synchronously after toggling the transformer panel off; since slice 2 the grid is lazy, so the test now waits for the row with `findByText`. It passed in earlier runs by timing only.

Validation: guard 0 violations; `npm run nonreg:unit -- --runner shared` 44 passed, 1 failed (the test above), which then passed alone (13/13); coverage tour 7 of 7 pages; typecheck miroir-react, miroir-standalone-app.

---

## Slice 6 — Node store drivers leave the web build

**Status:** ✅ DONE

### Goal

The web build ships no `sequelize`, `mongodb`, `bson`, `miroir-store-postgres`, `miroir-store-mongodb`; vitest and nonreg still run them against real stores.

### 6.1 RED

Policy: remove `sequelize`, `mongodb`, `bson`, `miroir-store-mongodb`, `miroir-store-postgres` and their `node:* via …` entries from `lazy`. Guard fails: `[allowlist] sequelize is in neither eager nor lazy …`.

### 6.2 GREEN

`vite.config.js`: when `command === "build"` and `mode !== "test"`, `resolve.alias` maps those store packages to `vite/nodeStoreStub.js`, which exports the names `IntegrationTestSession.ts` imports and throws "Node store, not available in the browser" when called. `miroir-store-filesystem` included if the report shows it ships Node-only code. Rebuild; eager unchanged.

### 6.3 Refactor checkpoint

`optimizeDeps.exclude` keeps the dev-server exclusion; comment in `vite.config.js` explains both.

### Validation

Standalone build + guard; `npm run nonreg:filesystem -- --runner shared` (vitest resolves the real stores); `VITE_…`-free vitest integ on filesystem: `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- DomainController.integ`.

### Realization

GREEN as planned, `miroir-store-filesystem` included (it imports `node:fs` and `node:path`): `vite.config.js` aliases the three store packages to `vite/nodeStoreStub.js` when `command === "build"` and `mode !== "test"`; the stub exports the three `…StoreSectionStartup` functions `IntegrationTestSession.ts` imports, each throwing. The policy lost 61 lazy entries (the stores, `sequelize`, `mongodb`, `bson`, their dependencies and 20 `node:* via …` built-ins) with the same script as slice 1. Nothing was eager, yet **eager gzip 902 938 → 867 330 (−3.9%)**, measured; the cause was not traced (Rollup places shared modules differently once the store chunks are gone). 6.3: no `optimizeDeps` change was needed, the comment sits by the alias.

Validation: guard 0 violations; `npm run nonreg:filesystem -- --runner shared` 87 passed, 0 failed (with slices 6 and 7 in the tree; vitest resolves the real stores, DomainController integ steps included).

---

## Slice 7 — Electron main process without React, minified

**Status:** ✅ DONE

### Goal

The Electron main bundle holds no `react-dom` and is minified; the packaged app still starts its IPC server.

### 7.1 RED

Electron `bundle-policy.json` `forbiddenEager`: add `react-dom`, `react-redux`. Guard fails (`ipcServerSetup.ts → miroir-localcache-redux → react-redux → react-dom`).

### 7.2 GREEN

- `miroir-localcache-redux`: a React-free entry (subpath export, e.g. `miroir-localcache-redux/node`) exporting what `ipcServerSetup.ts` uses; `src/index.ts` keeps its React re-exports.
- `bundle-main.mjs`: `minify: true` with `keepNames: true`.
- Rebuild; lower the Electron baseline.

### 7.3 Refactor checkpoint

Other Node consumers of `miroir-localcache-redux` (server, CLI, MCP) switch to the new entry when they import only non-React names.

### Validation

Electron build + guard; `npm run testByFile -w miroir-standalone-app -- electronBundle`; smoke: `xvfb-run -a release/linux-unpacked/miroir-standalone-app-electron --no-sandbox`, look for `IPC server ready` (build with `-c.npmRebuild=false` in the cloud); typecheck miroir-localcache-redux, electron.

### Realization

RED: with `react-dom` and `react-redux` in the Electron `forbiddenEager`, the build of the slice 6 tree failed the guard on both (`environmentBoot.ts → miroir-localcache-redux → react-redux → react-dom`). GREEN: `miroir-localcache-redux/src/node.ts` holds every export without React (`LocalCache`, the slice and its selectors, …); `src/index.ts` re-exports it and adds the React ones; `package.json` exports `./node` and tsup builds both entries. `bundle-main.mjs` minifies, with `keepNames: true` as before. 7.3 done in the same commit: `miroir-server`, `miroir-cli` and `miroir-mcp` import `miroir-localcache-redux/node`. **Electron eager gzip 4 430 119 → 3 184 200 (−28.1%)**; the committed Electron baseline (4 769 537) was already stale since slices 3 and 4, which shrank `miroir-core` and the meta-model in the Electron bundle too, so the branch's intermediate commits fail the Electron budget rule and this one sets it. The Electron policy also drops `miroir-app-miroir` from `defeatedDynamicImports` (slice 4 deleted its dynamic import).

Validation: Electron build + guard 0 violations; `electronBundle.unit` 6 passed (asserts no `react-dom`, `react-redux`); smoke on `electron-builder --dir -c.npmRebuild=false`: `xvfb-run` logs `IPC server ready`; `unit-345-electron` in the slice 6 `nonreg:filesystem` run (87 passed); typecheck miroir-server, miroir-cli, miroir-mcp, miroir-standalone-app-electron, miroir-localcache-redux.

---

## Slice 8 — Nonreg, docs, cleanup, AC

**Status:** ✅ DONE

### 8.1 Nonreg

`npm run nonreg:filesystem -- --runner shared` green. No new manifest step: the guard runs on every PR in `pr-checks.yml`, and build tests need a fresh build (as #326 decided).

### 8.2 Docs

`docs/internals/code-splitting.md`: "What loads with the page" table and summary table from the final build; manual chunk section (two chunks left); CodeMirror and crypto sections; new guard rules in "Bundle report and guards". `docs/internals/…` Electron note if any.

### 8.3 Issue-directory cleanup

`homePageLoad.337.phase2.unit.test.ts` → `tests/0_build/homePageLoad.unit.test.ts`; delete `tests/0_build/issues/337-bundle-size-cuts/`.

### 8.4 Tracer bullet (narrative)

Manual: open https://localhost:3080 with DevTools Network: the home page fetches the entry, `vendor-react`, `vendor-mui`, the meta-model chunk and the app chunks; opening a Library report fetches the report chunk with ag-grid; focusing a code field fetches CodeMirror. Automated equivalent: the guard, `homePageLoad.unit`, the coverage tour.

### AC checklist (#337)

| Criterion (issue Goal) | Proof | Status |
|---|---|---|
| Cut what the page loads, one finding at a time | slices 1–5, each with its guard RED/GREEN: eager gzip 2 725 899 → 902 938 | ✅ |
| Cut what both apps ship without using it | slice 6 (web: no Node store driver, eager 867 330), slice 7 (Electron: no React, minified, 4 430 119 → 3 184 200) | ✅ |
| Each cut lowers `eagerGzipBaseline` | policy diff in each slice commit (slice 2 moved the home page's route chunk, not the preloaded chunks: baseline unchanged, checked by `homePageLoad.unit`) | ✅ |
| Gains kept | `forbiddenEager` entries (web and Electron), `defeated` and `size` rules with pytest cases, `homePageLoad.unit`, `bundleReport.unit` | ✅ |
| Findings not cut here are tracked | follow-up issue draft below, to be filed on A's word | ⏳ |

Web page load: **2 725 899 → 867 330 bytes gzipped (−68.2%)**, 7 → 4 preloaded chunks.

### Realization

8.1: `nonreg:filesystem -- --runner shared` 87 passed, 0 failed (run on the slice 6 and 7 tree; slice 8 changes docs and build tests only). 8.2: `docs/internals/code-splitting.md` rewritten where #337 changed it: vendor chunks, lazy grids and CodeMirror, the page table (4 chunks) with a table of the cuts and the rule keeping each, the Node store alias, the Electron `/node` entry, the `defeated` and `size` rules, follow-ups. 8.3 done; `bundleReport.unit` asserted that `mongodb` ships lazily, which slice 6 ended: it now asserts that no Node store driver ships. 8.4: the coverage tour of the final build visited 7 of 7 pages, loaded 30 of 391 chunks (10.1 M chars, 52% ran). Pre-push gate green (skills sync, pytest 187, dependency policy, lint, `miroir-env check`, miroir-core tsc and 2 131 tests).

### Follow-up issue (draft)

**Bundle size, after #337: what is left**

#337 took the web page from 2.73 MB to 0.87 MB gzipped. Left, from its analysis (`code-helpers/features/337-BUILD-bundle-size-cuts/analysis.md`) and the final coverage tour:
- F9: the grid chunk holds both ag-grid (988 k chars loaded, 36% ran) and glide-data-grid (184 k, 5% ran); load one of them by `gridType`.
- F12: `MlElementEditorHooks.ts` loads the Library deployment with the page for one label (~21 kB gzip).
- F13: `lodash` in the entry (104 k chars, 35% ran): single-function imports or `lodash-es`.
- `yaml` in the entry (98 k chars, 6% ran): load it where YAML is parsed.
- F8: shiki ships 235 grammar chunks in `dist/`; load the grammars used.

