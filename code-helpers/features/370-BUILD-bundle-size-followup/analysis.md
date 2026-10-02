# 370 — Bundle size, after #337: what is left

> What is still worth cutting after #337, in the web page (eager gzip), in the first list section, in `dist/` and in the Electron main bundle. For each item: cause, options, measured or estimated gain, and a recommended option. Measurements come from a build of `_integration` at 276e43aa (2026-10-01) and from 9 trial builds made for this analysis.

**Document role:** analysis and proposed decision record. The decisions below are **Proposed**: they need A's confirmation before the TDD plan is written.

## Related

- Issue: https://github.com/miroir-framework/miroir/issues/370
- Parent: #337, [analysis](../337-BUILD-bundle-size-cuts/analysis.md) and [TDD plan](../337-BUILD-bundle-size-cuts/tdd-implementation-plan.md) (PR #368); before it #326
- Reference: [docs/internals/code-splitting.md](../../../docs/internals/code-splitting.md)
- Build config: [vite.config.js](../../../packages/miroir-standalone-app/vite.config.js), [bundle-policy.json](../../../packages/miroir-standalone-app/bundle-policy.json), [bundle-main.mjs](../../../packages/miroir-standalone-app-electron/scripts/bundle-main.mjs), Electron [bundle-policy.json](../../../packages/miroir-standalone-app-electron/bundle-policy.json)
- Guards: [scripts/check_bundle_policy.py](../../../scripts/check_bundle_policy.py), [homePageLoad.unit.test.ts](../../../packages/miroir-standalone-app/tests/0_build/homePageLoad.unit.test.ts)

## Measurements

The baseline moved since #337: `_integration` bumped `@mui/material` from 5 to 9 (#364), and the page grew from 867 330 to **881 289** bytes gzipped (+1.6%, inside the guard's tolerance). All numbers below are against 881 289.

Each trial build replaced one package with an empty module (a Rollup plugin returning a `Proxy` with `syntheticNamedExports`), which measures what removing the package from the page saves. Trial config: `packages/miroir-standalone-app/trial/` (scratch, not committed).

| Trial | Eager gzip | Saved |
|---|---|---|
| baseline | 881 289 | |
| `yaml` stubbed | 850 413 | **−30 876** |
| `miroir-example-library` stubbed | 869 923 | −11 366 |
| `miroir-store-indexedDb` stubbed | 846 190 | **−35 099** |
| `json-diff` stubbed | 847 450 | **−33 839** |
| `lodash` stubbed | 852 440 | **−28 849** |
| `lodash` aliased to `lodash-es` | 879 474 | −1 815 (the CommonJS `require` keeps the whole library) |
| the four stubs above except `lodash` together | 769 547 | −111 742 |
| `@glideapps/glide-data-grid` stubbed | 881 096 (unchanged: it is lazy) | grid chunk 372 332 → 273 603, **−98 729** |
| shiki restricted to 12 grammars | 881 105 (unchanged) | `dist/` JS 23.1 MB → 16.7 MB, 391 → 168 chunks |

The Electron main bundle (3 184 414 bytes gzipped, one file) was not trialled: its numbers are rendered-size shares from its bundle report.

## 1. Goals

1. **Faster first page.** In order to start working sooner after opening Miroir, as an application user, I can open the home page without downloading the YAML parser, the IndexedDB store, the JSON diff library, the whole of lodash and the Library example.
2. **Lighter first list.** In order to see my first list sooner, as an application user, I download only the grid library my list uses.
3. **Smaller release artefacts.** In order to download, install and start Miroir faster, as an application user, I get a server release, Docker image and Electron package without 223 unused code-highlighting grammars, and an Electron app that loads only the store drivers its environment uses.
4. **Gains kept.** In order not to lose a cut to a later change, as a Miroir maintainer, I get a failing build check when a cut package comes back.

## 2. Non-goals

- Upgrading ag-grid from 31 to 33+ to register only the modules used (option G2): an API and theming migration, its own issue if wanted.
- Replacing express, MUI, CopilotKit or zod.
- F10 (27 packages loaded and never run): rejected below, nothing to cut.
- Server (`miroir-server`) bundle size.

## 3. Current state

What loads with the page (4 chunks, 881 289 bytes gzipped), largest packages by rendered size (before minification) in the entry chunk, with what pulls them in:

| Package | Rendered | Pulled in by |
|---|---|---|
| `miroir-app-miroir` | 3 120 451 | the meta-model; capped by `eagerPackageMaxBytes` (#337) |
| `miroir-core` | 1 774 755 | the app |
| `lodash` | 578 282 | `MlEnumEditor.tsx` → `miroir-localcache-redux` → `@teroneko/redux-saga-promise` (`require("lodash")`, uses `merge` only, `dist/src/index.js` lines 98 and 173) |
| `yaml` | 243 563 | `index.tsx` → `miroir-core` → `2_domain/syncExternalServiceSchema.ts` (`parseOpenApiDocument`, line 79) |
| `miroir-example-library` | 180 101 | `MlElementEditorHooks.ts` line 45 (`selfApplicationLibrary`, read for one label, lines 505–508) |
| `buffer`, `abstract-level`, `level`, `miroir-store-indexedDb` | 124 996 + 66 898 + … + 39 237 | `index.tsx` line 58 imports `miroir-store-indexedDb`, line 388 registers its factories |
| `assert`, `@ewoudenberg/difflib` | 73 523 + 58 649 | `miroir-core` → `1_core/model/ModelUpdate.ts` (`json-diff`), whose only caller is the function-call test registry (`5_tests/FunctionCallTestRegistry.ts` line 148) |
| `lodash-es` | 69 061 | `formik` and `miroir-core` (already tree-shaken) |

Our own code imports `lodash` (the CommonJS build) in `SelectEntityInstanceEditor.tsx` and `JsonObjectEditFormDialog.tsx`; both are in lazy chunks. Everything else imports `lodash-es`.

## 4. Items, options and recommendations

Gains: **E** = eager gzip (the guard's metric), **L** = first list section, **D** = `dist/` size, **M** = Electron main bundle. Effort: S (hours), M (a day or two), L (more).

### Y — `yaml` in the entry (E −30.9 kB, measured)

`parseOpenApiDocument` is synchronous and called by 6 runtime transformer handlers in `syncExternalServiceSchema.ts` (lines 439–711) and by `DomainController.ts` line 4422. JSON documents never reach the YAML parser (lines 76–78).

| Option | Pros | Cons |
|---|---|---|
| **Y1** `yaml` loaded by dynamic import: `ensureYamlParser()` awaited where an async caller exists (DomainController, the sync actions), and started after first paint; `parseOpenApiDocument` throws "YAML parser not loaded" otherwise | the #337 crypto pattern; JSON input never waits | a synchronous transformer run on YAML text before the load finishes fails with a clear error |
| Y2 replace `yaml` with `js-yaml` | stays synchronous | still eager (≈ −15 kB est.); a different parser for existing documents |
| Y3 accept JSON only in the browser | smallest | YAML specs pasted in the UI stop working |

**Recommended: Y1.**

### I — `miroir-store-indexedDb` in the entry (E −35.1 kB, measured)

Its factories (`miroirIndexedDbStoreSectionStartup`, `startup.ts`) are already `async`; only an environment with an `indexedDb` store calls them.

| Option | Pros | Cons |
|---|---|---|
| **I1** `startup.ts` imports the store classes with `await import(...)` inside each factory | no change for callers; the store loads when a section opens | the package build must split (tsup `splitting`, default for ESM) |
| I2 `index.tsx` imports the package dynamically only when the environment has an `indexedDb` store | no package change | startup becomes conditional on the environment, more code in `index.tsx` |

**Recommended: I1.**

### J — `json-diff` in the entry (E −33.8 kB, measured)

`getModelUpdate` is reached only through the function-call test registry, which `miroir-core` exports with everything else.

| Option | Pros | Cons |
|---|---|---|
| **J1** registry entries may be loaders (`() => import("../1_core/model/ModelUpdate")`); `resolveFunctionCallTarget` becomes async (its caller in `FunctionCallTestTools.ts` line 232 runs in an async test runner) | the whole registry can go lazy later; no behaviour change | one async signature change |
| J2 replace `json-diff` with an internal diff of `mlSchema.definition` | no dependency | rewrites tested logic for a size gain |

**Recommended: J1.**

### L — `lodash` in the entry (E ≈ −27 kB, from the −28.8 kB stub minus `merge`)

| Option | Pros | Cons |
|---|---|---|
| **L1** Vite alias of the bare `lodash` specifier to a one-file shim exporting `merge` from `lodash-es`; our two `import _ from "lodash"` move to `lodash-es` | small; glide's `lodash/has.js` subpath imports are untouched | a future dependency calling another `lodash` function through `require("lodash")` breaks: a build test asserts which packages import bare `lodash` |
| L2 replace `@teroneko/redux-saga-promise` | removes the dependency | rewrites the promise actions of `miroir-localcache-redux` |
| L3 alias `lodash` to `lodash-es` | one line | measured −1.8 kB only |

**Recommended: L1.**

### F12 — the Library example for one label (E −11.4 kB, measured)

| Option | Pros | Cons |
|---|---|---|
| **F12a** read the label from the `applications` rows already in the local cache (lines 498–504), falling back to the uuid | no import | the label shows the uuid until the Library application is loaded |
| F12b a constant `{ uuid, defaultLabel }` exported by a tiny `miroir-example-library` subpath | label always there | a second entry point to maintain |

**Recommended: F12a.** `EndpointActionCaller.tsx` and `LibraryRunner_LendDocument.tsx` also import it, but in lazy chunks.

### F9 — both grid libraries in the grid chunk (L −98.7 kB, measured)

`EntityInstanceGrid.tsx` (line 59) and `ValueObjectGrid.tsx` (line 35) import `GlideDataGridComponent` statically; `gridType` defaults to `ag-grid` (`EntityInstanceGrid.tsx` line 134). Glide also brings 148 k of `lodash` subpath modules into the chunk.

| Option | Pros | Cons |
|---|---|---|
| **G1** `GlideDataGridComponent` behind `React.lazy` in both grids | the #337 grid pattern; default users never fetch glide | a spinner the first time a glide grid shows |
| G2 ag-grid 33+ with only the modules used | ag-grid is 1.87 M rendered | a migration (non-goal) |

**Recommended: G1.**

### F8 — shiki ships every grammar (D −6.5 MB raw JS, measured)

CopilotKit's markdown renderer (`streamdown`, `code-block-*.js`) highlights code blocks with shiki and falls back to plain text for a language not in `bundledLanguages`. `shiki/dist/index.mjs` re-exports `bundledLanguages` from `./langs.mjs`.

| Option | Pros | Cons |
|---|---|---|
| **S1** a Vite plugin resolving shiki's `./langs.mjs` to a generated module listing 12 grammars (json, javascript, typescript, tsx, jsx, yaml, shellscript, python, sql, html, css, xml) | 223 fewer chunks; other languages render as plain text | depends on shiki's file layout: a build test asserts the grammar count |
| S2 leave it | nothing to do | 9.6 MB of the 23 MB of JS in `dist/`, shipped in the server release, Docker image and Electron package |

**Recommended: S1.** The page is unchanged; the gain is download and disk size of every release artefact.

### F10 — 27 packages loaded and never run: **Rejected**

They total 73 kB rendered, all in lazy chunks but one 168-byte module: transitive dependencies of the markdown editor (`MarkdownEditorModal.tsx`, micromark) and of CopilotKit (Radix helpers, remark extensions), plus `d3-ease`. They load with features the tour opens; the tour just does not exercise them. Nothing to cut without replacing those libraries.

### Electron main bundle (M)

One ESM file, 14.5 MB, 3.18 MB gzipped, read at every start. The `desktop` environment uses the `filesystem` store and enables `ai` and `mcp`. Shares of rendered size:

| Pulled in by | Share | Needed by `desktop`? |
|---|---|---|
| `miroir-store-mongodb` (`mongodb`, `tr46`, …) | 17.6% | no |
| `miroir-store-postgres` (`sequelize`, `moment-timezone`, …) | 11.8% | no |
| `miroir-ai` (CopilotKit runtime, `graphql`, `libphonenumber-js`, langchain) | 24.1% | yes (`ai: true`) |
| `iconv-lite` (express → body-parser) | 10.2% | yes (HTTP for ai and mcp) |

| Option | Pros | Cons |
|---|---|---|
| **E1** esbuild `splitting` (ESM already) and `environmentBoot.ts` imports each store package when the environment uses that store | `desktop` stops reading ≈ 29% of the bundle at start | several files in the package; the Electron guard counts the main chunk only |
| **E2** same for `miroir-ai` and `miroir-mcp` in `ipcServerSetup.ts`, imported when the feature is on | gains for environments with `ai: false` | none for `desktop` today |
| E3 replace `iconv-lite` by a UTF-8-only shim | −10% | express answers 415 to other charsets: **Deferred** |

**Recommended: E1 + E2**, measured by startup time to "IPC server ready" before and after.

## 5. Decision record (Proposed, awaiting confirmation)

| # | Decision | Status |
|---|---|---|
| D1 | Y1: `yaml` by dynamic import with `ensureYamlParser()` | Proposed |
| D2 | I1: IndexedDB store classes loaded inside its async factories | Proposed |
| D3 | J1: function-call test registry accepts loaders; `ModelUpdate` loads on use | Proposed |
| D4 | L1: bare `lodash` aliased to a `merge` shim; our two imports move to `lodash-es` | Proposed |
| D5 | F12a: Library label from the cached `applications` rows | Proposed |
| D6 | G1: glide grid behind `React.lazy` | Proposed |
| D7 | S1: shiki restricted to 12 grammars | Proposed |
| D8 | E1 + E2: Electron main split by store and feature; E3 deferred | Proposed |
| D9 | F10 rejected; G2 (ag-grid 33) left to its own issue | Proposed |
| D10 | Delivery as for #337: one branch, one PR, one green commit per item, each lowering its baseline or cap | Proposed |

Each kept gain gets a rule: `forbiddenEager` for `yaml`, `json-diff`, `@ewoudenberg/difflib`, `abstract-level`, `miroir-example-library`; an assertion on the bare-`lodash` importers; a grid-chunk test that glide is not in it; a grammar-count test; the Electron guard and a startup-time measurement.

## 6. Expected gains

| After | Eager gzip | Other |
|---|---|---|
| baseline | 881 289 | |
| D1–D3 + D5 (measured together) | ≈ 769 500 | |
| + D4 | **≈ 743 000 (−16%)** | |
| D6 | | first list section −98.7 kB gzip |
| D7 | | `dist/` JS −6.5 MB (−28%), 223 fewer chunks |
| D8 | | Electron `desktop` start reads ≈ 29% less code |

## Next step

On A's confirmation, the TDD plan (`tdd-implementation-plan.md`, skill `miroir-analysis-to-tdd-plan`).
