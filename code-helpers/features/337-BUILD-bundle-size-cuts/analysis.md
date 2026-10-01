# 337 — Cut bundle size from the #326 bundle report and coverage tour findings

> Strategies to cut what the standalone app loads with the page, and what both apps ship without using it, from the findings of #326. For each finding: cause, options with pros and cons, expected gain, and a recommended option. Measurements come from a build of `_integration` at 1b87835 (2026-09-30) and from two trial builds made for this analysis.

**Document role:** analysis and proposed decision record. The decisions below are **Proposed**: they need A's confirmation before the TDD plan is written.

## Related

- Issue: https://github.com/miroir-framework/miroir/issues/337
- Parent: #326, [analysis](../326-BUILD-build-hardening/analysis.md) (decision D19: measure and guard first, cut in #337); PRs #334, #335
- Reference: [docs/internals/code-splitting.md](../../../docs/internals/code-splitting.md) ("What loads with the page", "Bundle report and guards", "Coverage tour")
- Build config: [vite.config.js](../../../packages/miroir-standalone-app/vite.config.js), [vite/manualChunks.js](../../../packages/miroir-standalone-app/vite/manualChunks.js), [bundle-policy.json](../../../packages/miroir-standalone-app/bundle-policy.json), [bundle-main.mjs](../../../packages/miroir-standalone-app-electron/scripts/bundle-main.mjs)
- Guard: [scripts/check_bundle_policy.py](../../../scripts/check_bundle_policy.py)

## Measurements

| Build | Eager chunks (preloaded by `index.html`) | Eager raw | Eager gzip | All chunks |
|---|---|---|---|---|
| `_integration` 1b87835 (baseline) | 7 | 10.50 MB | **2.727 MB** (policy baseline 2.722 MB, guard passes) | 387, 6.27 MB gzip |
| Trial A: `vendor-copilotkit` and `vendor-ag-grid` rules removed from `manualChunks.js` | 5 | 6.53 MB | **1.579 MB (−42%)** | 388, 6.27 MB gzip |
| Trial B: A without the `nodePolyfills` plugin | build fails | | | |

Trial B fails with `"createHash" is not exported by "__vite-browser-external"`: the static `import … from "node:crypto"` of `SecretsService.ts` is what keeps the polyfill (see finding 4). The other gains below are **estimates**: a package's gzip share is its rendered size times the gzip/rendered ratio of its chunk (0.119 for the entry chunk).

"Eager gzip" is what the bundle guard counts. It does not count a lazy chunk that the home page imports at once: today `ReportDisplay-*.js` (245 kB gzip) loads with the home page (finding 5), so the home page fetches about 2.97 MB gzip.

## 1. Goals

1. **Faster first page.** In order to start working sooner after opening Miroir, as an application user, I can open the home page without downloading the AI assistant, the grids, the crypto polyfill, the MiroirTest definitions and the code editor.
2. **Pay for a feature on use.** In order not to pay for features I do not open, as an application user, I download a feature's code (grids, code editor, AI sidebar) when I first open a page or section that uses it.
3. **Gains kept.** In order not to lose a cut to a later change, as a Miroir maintainer, I get a failing bundle guard when a cut package loads with the page again or the eager size grows.
4. **Smaller release artefacts.** In order to ship and start smaller packages, as a Miroir maintainer, I build a web client without Node store drivers and unused grammar chunks, and an Electron main bundle without React.

## 2. Non-goals

- Replacing libraries (ag-grid, MUI, CopilotKit, express) with smaller ones: separate decisions, not bundle configuration.
- The Vite 8 / Rolldown migration (its chunking API replaces `manualChunks`): its own issue if wanted; option M4 below only notes it.
- Server (`miroir-server`) bundle size: not measured by #326.
- Runtime performance other than download and parse (rendering, queries): `docs/guides/advanced/performance.md`.

## 3. Current state: what loads with the page (baseline build)

| Chunk | Raw | Gzip | Largest content | Why eager |
|---|---|---|---|---|
| `index-*.js` (entry) | 3.23 MB | 721 kB | `miroir-core` 1.92 M, `lodash` 578 k, app code 565 k, `@codemirror/view` 457 k, `yaml` 244 k, `miroir-example-library` 180 k (rendered chars) | entry |
| `vendor-copilotkit-*` | 3.03 MB | 909 kB | `refractor`, `lucide`, `katex`, `@copilotkit/react-core`, `parse5`, `@copilotkit/web-inspector` | holds shared packages the entry needs (finding 1) |
| `mermaid-VLURNSYL-*` | 2.00 MB | 471 kB | `miroir-app-miroir` only (3.89 M rendered) | finding 3 |
| `vendor-ag-grid-*` | 1.03 MB | 265 kB | `ag-grid-community`, `ag-grid-react`, a 44-byte `vite-plugin-node-polyfills` shim | finding 2 |
| `index-*.js` | 628 kB | 185 kB | `bn.js`, `readable-stream`, `elliptic`, `buffer`, `asn1.js` | finding 4 |
| `vendor-mui-*` | 339 kB | 103 kB | `@mui/material`, `@mui/system` | app shell |
| `vendor-react-*` | 227 kB | 73 kB | `react-dom`, `react` | app shell |

The findings table of the issue still holds on this build, with the package renames of #344 (`miroir-test-app_deployment-miroir` is now `miroir-app-miroir`). Two findings are new (12, 13 below).

## 4. Findings, options and recommendations

Gains: **E** = eager gzip (the guard's metric), **H** = what the home page fetches, **D** = size of `dist/` only (no page-load effect). Effort: S (hours), M (a day or two), L (more).

### F1 + F2 + F11 — manual chunks pull shared packages into the page

**Cause.** `resolveManualChunk` assigns every module of `@copilotkit/*` and `ag-grid*` to a named chunk. Rollup then also places in that chunk the dependencies those modules share with the entry (`zod`, `uuid`, the `react-markdown` / remark / micromark stack of `MarkdownEditorModal.tsx`, the node-polyfill shims), so the entry statically imports the vendor chunk and it is preloaded. The `miroir-diagram-class` clause of `vendor-d3` never matches: `npmPackagesOfId` finds no `node_modules/` segment in `packages/miroir-diagram-class/…`.

| Option | Pros | Cons | Gain | Effort |
|---|---|---|---|---|
| **M1. Remove the `vendor-copilotkit` and `vendor-ag-grid` rules** (keep `vendor-react`, `vendor-mui`); delete the dead `miroir-diagram-class` clause | Measured (trial A). One-line change. Rollup's own splitting follows the lazy boundaries that already exist (#244 for CopilotKit, the report route for ag-grid) | Loses the named files: `[miroir-chunk-load]` traces of these two libraries and cache isolation of vendor code across app releases. ag-grid moves into the `ReportDisplay` chunk (245 → 510 kB gzip), which the home page loads until F5 is fixed | **E −1.15 MB (−42%)**, measured. H −0.89 MB until F5 lands | S |
| M2. Keep the names; assign a module only when all its importers are in the same group (`manualChunks(id, { getModuleInfo })`) | Keeps chunk names and traces | Graph walk in the build config, fragile on dependency upgrades; same gain as M1 at best | E ≈ M1 | M |
| M3. Add a `vendor-shared` chunk for the shared packages (`zod`, `uuid`, markdown stack, shims) | Keeps names | Whack-a-mole: every new shared dependency reopens the problem; the markdown stack stays eager | E −0.8 to −1.0 MB (est.) | S, recurring |
| M4. Rolldown chunk groups (Vite 8) | Finer control on dependency inclusion | A toolchain migration; out of scope (non-goal) | unknown | L |

**Recommended: M1**, plus `@copilotkit/*` and `ag-grid-*` in `forbiddenEager` of the standalone policy so that neither can come back with the page (goal 3). The `[miroir-chunk-load]` logger keeps working for the remaining `vendor-*` chunks.

### F5 — `ReportDisplay` lazy route splits nothing off (same for `uiIntegrationTestRunState.ts`)

**Cause.** `PageDispatcher.tsx` loads `ReportDisplay` with `React.lazy`, but `HomePage.tsx`, `SettingsPage.tsx` and `ReportSectionViewWithEditor.tsx` import it statically, so its chunk is fetched with the home page. `uiIntegrationTestRunState.ts` is imported dynamically by `RunAllMiroirTestsButton.tsx` and statically by `RunMiroirTestSuiteButton.tsx` and `UiIntegrationTestRunInspectorSummary.tsx`.

| Option | Pros | Cons | Gain | Effort |
|---|---|---|---|---|
| **R1. `React.lazy` in the three static importers** (or render the report through the router instead of embedding `ReportDisplay`) | Small, local; each page keeps its behaviour behind a `Suspense` | A spinner where the home and settings pages embed a report | **H −245 kB today, −510 kB after M1** (the chunk that holds ag-grid) | S |
| R2. Extract what the home and settings pages need into a small module | No spinner | Needs to know what they use; may still pull the grids | depends | M |
| R3. Guard: fail on `defeated-dynamic-import` findings (new policy key listing the accepted ones) | Makes goal 3 cover lazy routes, which the eager metric misses | A new rule in `check_bundle_policy.py` | none by itself | S |

**Recommended: R1 + R3.** R1 is what makes M1's gain real for the home page.

### F4 — the `crypto` polyfill is eager

**Cause.** `miroir-core/src/4_services/SecretsService.ts` line 6 imports `createCipheriv, createDecipheriv, createHash, randomBytes` from `node:crypto` statically; `DomainController.ts` imports `importProcessSecrets` from it (used by `connectExternalService` to persist process secrets). `nodePolyfills({ include: ["crypto"] })` swaps in `crypto-browserify` (with `bn.js`, `elliptic`, `readable-stream`, `asn1.js`). `AuthenticationPolicy.ts` already imports `node:crypto` dynamically (4 sites).

| Option | Pros | Cons | Gain | Effort |
|---|---|---|---|---|
| **C1. Dynamic `import("node:crypto")` in `SecretsService`**, as `AuthenticationPolicy` does | Smallest change; the polyfill becomes a lazy chunk used only if a browser ever runs this path | `importProcessSecrets` and its helpers become async; their callers change | **E −185 kB (est., the whole chunk)** | S |
| C2. Web Crypto (`globalThis.crypto.subtle`, `getRandomValues`) in `SecretsService`, drop the `crypto` polyfill | One code path in Node and browser; removes `crypto-browserify` and 1.3 M rendered chars from the build | Async API; stored ciphertext must stay readable (same AES-256-GCM layout of iv, tag, data to keep); `scrypt` in `AuthenticationPolicy` has no Web Crypto equivalent, so the polyfill or a Node-only path stays for it | E −185 kB (est.), D −1.3 M chars | M |
| C3. Move secret encryption behind an interface (0_interfaces) with a Node implementation injected by the server | Fits the layering: `miroir-core` stops importing Node built-ins in the browser path | Wiring in server, CLI, Electron and tests; bigger than the size gain calls for | E −185 kB (est.) | M-L |

**Recommended: C1** now; C2 or C3 when secrets work (#321 follow-ups) next touches this file.

### F3 — the meta-model deployment is eager and never tree-shaken

**Cause, checked for this analysis.** `miroir-app-miroir` is one tsup bundle (`treeshake: false`, one `dist/index.js`, 3.9 MB) of 316 JSON exports plus 7 others. `miroir-core` statically imports 112 of them (0.61 MB of the 4.74 MB of JSON source); eager app code (`ModelEnvironmentSync.tsx`, `MlElementEditorHooks.ts`, themes, …) adds 24 more (0.86 MB in all, 18%). Nothing else is removed because `miroir-core/src/5_tests/miroirCoreTestSuiteRegistry.ts` reads the whole module namespace: `MIROIR_TEST_SUITE_REGISTRY` is a top-level `await import("miroir-app-miroir")`, and the `@deprecated` `loadMiroirCoreTestSuite` iterates `Object.entries(deployment)`. Both are exported from `miroir-core/src/index.ts`; outside that file only `miroir-core/tests/5-tests/miroirTestSuiteRegistry.unit.test.ts` uses them. `listMiroirTestSuiteKeys` (used by `parseMiroirTestCliConfig.ts` and `miroirCoreIntegTestLaunch.ts`) reads only the hardcoded `MIROIR_TEST_SUITE_REGISTRY_NAMES` and can stay. The 69 `miroirTest_*` exports alone weigh 2.45 MB; the `MiroirLogo` blob 0.42 MB.

| Option | Pros | Cons | Gain | Effort |
|---|---|---|---|---|
| **D1. Delete the deprecated namespace readers and mark `miroir-app-miroir` `"sideEffects": false`** (tsup `treeshake: true`), so Rollup drops the unused JSON exports | No import site changes; the CLI already uses `loadMiroirCoreTestSuiteFromFolders` / `loadMiroirTestSuiteFromCatalog` | Any later `import * as` or dynamic import of the package silently brings all of it back: needs a guard (see D-guard) | **E −380 kB (est.: 471 kB chunk × 82% unused bytes)** | S |
| D2. Split the package: model entry vs `miroir-app-miroir/tests` subpath for MiroirTest definitions and blobs | Robust against namespace reads; clear boundary | Changes every test import site of `miroirTest_*`; tsup config with two entries | E ≈ −250 kB (tests and logo only, est.) | M |
| D3. Lazy-load the deployment from `ModelEnvironmentSync` | | Impossible alone: `miroir-core` imports 112 names statically | — | Rejected |
| D4. Minify the package's JSON | | Vite already minifies the chunk (3.89 M rendered → 2.0 MB); gzip gain negligible | ~0 | Rejected |

**Recommended: D1**, with a guard: a size cap on the chunk that holds `miroir-app-miroir`, or `miroir-app-miroir` rendered-bytes limit in the policy (new rule). D2 if the guard trips repeatedly.

### F12 (new) — the Library example deployment is eager

`MlElementEditorHooks.ts` (line 45) imports `selfApplicationLibrary` from `miroir-example-library` to label the Library application; the whole package (180 k rendered, ~21 kB gzip est.) is in the entry chunk. **Recommended:** same treatment as D1 (`"sideEffects": false`), or read the label from the loaded model instead of importing the example package into framework UI code. E −20 kB (est.), S.

### F6 — CodeMirror is eager

**Cause.** `miroir-react` exports `CodeBlock_ReadOnly` (static `@uiw/react-codemirror`, `@codemirror/view`, `@codemirror/lang-javascript`), used by `ThemedHelper.tsx`, `BasicComponents.tsx` and `TypedValueObjectEditor.tsx`; `MlElementEditorReactCodeMirror.tsx` imports it statically too. CodeMirror, Lezer and helpers are 1.16 M rendered chars in the entry chunk; the tour ran 9% of `@codemirror/view`.

| Option | Pros | Cons | Gain | Effort |
|---|---|---|---|---|
| **G1. `React.lazy` around both CodeMirror components**, with a plain `<pre>` fallback | Loads on first code field; no visual change after load | Brief fallback on first render of a code field | **E −138 kB (est.)** | S |
| G2. A `vendor-codemirror` manual chunk | Cache isolation | No load gain; M1's lesson applies | 0 | Rejected |
| G3. Replace read-only code blocks with a light highlighter | Smaller even when used | Look and feature change | more than G1 | M |

**Recommended: G1.**

### F13 (new) — `lodash` in the entry

The entry holds `lodash` (full CommonJS build, 578 k rendered, through `miroir-localcache-redux → @teroneko/redux-saga-promise`) and `lodash-es` (69 k): ~77 kB gzip (est.). Options: alias `lodash` to `lodash-es` for the browser build (only if all importers use named imports; `@teroneko/redux-saga-promise` must be checked), or replace `@teroneko/redux-saga-promise` in `miroir-localcache-redux`. **Recommended:** investigate after the cuts above; gain uncertain until importers are checked.

### F7 — Node store drivers ship in the browser build

`IntegrationTestSession.ts` imports `miroir-store-postgres`, `-mongodb`, `-filesystem` dynamically; the chunks are never loaded in a browser but ship (`sequelize` 488 k, `mongodb` 428 k, `miroir-store-mongodb` 181 k, `miroir-store-postgres` 124 k, `bson` 74 k chars) with 58 Node built-ins emptied.

| Option | Pros | Cons | Gain | Effort |
|---|---|---|---|---|
| **H1. In the web build, alias these packages to a stub that throws "Node store, not available in the browser"** (`resolve.alias` when `command === "build"` and mode is not test) | Build-config only; vitest keeps the real drivers | The stub must keep the export names the importer uses | **D −1.3 M chars**, fewer emptied-built-in findings; E, H 0 | S |
| H2. Move the Node branches of `IntegrationTestSession.ts` to a module only vitest resolves | Cleaner source | Touches test bootstrapping shared by nonreg | same | M |
| H3. `rollupOptions.external` | Trivial | A reached import fails with a bare-specifier error, less clear than H1 | same | S |

**Recommended: H1.**

### F8 — shiki ships 235 grammar chunks

`AgentsCopilotKit.tsx → @copilotkit/react-core → streamdown → import(code-block) → shiki → import(@shikijs/langs/…)`: 7.9 M chars of grammars and 1.4 M of themes, lazy, never loaded in the tour. **Options:** S1 a resolve plugin that stubs all `@shikijs/langs` / `@shikijs/themes` files except a short list (json, ts, js, yaml, markdown, sql, shell); S2 leave it (costs `dist/` size and build time only). **Recommended: S1** if `dist/` size matters for the Docker image and Electron package; D −8 M chars, E 0. Check first whether `streamdown` accepts a restricted language list (not verified).

### F9 + F10 — loaded code that barely runs

- Both grid stacks ship with every report (`ag-grid-community` 36% run, `@glideapps/glide-data-grid` 5%). The default `gridType` is `ag-grid` (`GridContextProvider.tsx`, `RootComponent.tsx`). **Option:** dynamic import of `GlideDataGridComponent` vs the ag-grid components by `gridType` (listed in code-splitting.md follow-ups). Gain on report routes: glide (185 k chars) off when ag-grid is used. M.
- `@copilotkit/react-core` 18%, `@headlessui/react` 10%, most of the 27 never-run packages (micromark, remark, Radix helpers, `d3-ease`): leave the page with M1; re-run the tour after M1 to see what remains.
- `yaml` (244 k rendered in the entry, 6% run) comes from `miroir-core`; a dynamic import at its use sites would take ~29 kB gzip (est.) off. Later, after checking the use sites.

### Electron main process (esbuild, 29.4 MB unminified, gzip 4.77 MB)

| Option | Pros | Cons | Gain | Effort |
|---|---|---|---|---|
| **X1. React-free entry of `miroir-localcache-redux`** (subpath `miroir-localcache-redux/node` without the `react-redux` re-exports of `src/index.ts` lines 2-3), used by `ipcServerSetup.ts` | Removes `react-dom` (1.23 MB) from the main process | New subpath export to maintain | −1.2 MB unminified (est.) | S-M |
| X2. `minify: true` in `bundle-main.mjs` (with `keepNames` kept) | Large raw reduction, faster parse | Stack traces through source maps only | raw −40–50%, gzip less (est.) | S |
| X3. esbuild `splitting` + dynamic import of `miroir-store-mongodb` and of `miroir-ai`'s CopilotKit runtime (`graphql`, `libphonenumber-js`) when their capability is on | Pays for Mongo and AI only when used | ESM splitting in the main process; checks with electron-builder packaging | −3 MB+ unminified (est.) | M |
| X4. Replace express / `iconv-lite` | | Server rewrite | — | Rejected |

**Recommended: X1, then X2**; X3 when Electron startup time is a complaint.

## 5. Decision record (Proposed, awaiting confirmation)

| # | Decision | Proposed | Rejected / deferred |
|---|---|---|---|
| D1 | Manual chunks | M1: drop `vendor-copilotkit`, `vendor-ag-grid` and the dead `miroir-diagram-class` clause; forbid `@copilotkit/*`, `ag-grid-*` eager | M2, M3 (fragile); M4 deferred with Vite 8 |
| D2 | Defeated lazy routes | R1 + R3 (guard on `defeated-dynamic-import`) | R2 |
| D3 | Crypto polyfill | C1 (dynamic import) | C2, C3 deferred to secrets work |
| D4 | Meta-model deployment | D1 (`sideEffects: false`, delete deprecated namespace readers) with a size guard | D2 fallback; D3, D4 rejected |
| D5 | CodeMirror | G1 (`React.lazy`) | G2 rejected, G3 deferred |
| D6 | Node drivers in the web build | H1 (stub alias) | H2, H3 |
| D7 | Electron | X1, X2 | X3 deferred, X4 rejected |
| D8 | Delivery | One PR per decision, each lowering `eagerGzipBaseline` (issue rule), in the order of section 6 | one big PR |

## 6. Expected gains, cumulative (eager gzip, the guard's metric)

| Step | Eager gzip | Home page fetches | Basis |
|---|---|---|---|
| Baseline | 2.73 MB | ~2.97 MB | measured |
| + M1 | 1.58 MB | ~2.09 MB | measured (trial A) |
| + R1 | 1.58 MB | ~1.58 MB | measured chunk sizes |
| + C1 | ~1.39 MB | ~1.39 MB | est. |
| + D1, F12 | ~0.99 MB | ~0.99 MB | est. |
| + G1 | ~0.85 MB | ~0.85 MB | est. |

About **−69%** of eager gzip and **−71%** of what the home page fetches, before F13, `yaml` and the grid split. `dist/` loses another ~9 M chars with H1 and S1. Each estimate is replaced by the measured value of its PR.

## Next step

Confirm or amend the decision record, then `tdd-implementation-plan.md` (skill `miroir-analysis-to-tdd-plan`): one slice per decision, each with its guard change and a coverage-tour check that the page still works.
