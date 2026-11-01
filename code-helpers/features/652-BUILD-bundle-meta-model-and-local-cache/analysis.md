# 652 — Bundle the meta-model into core and the local cache into react

> Three private workspace packages (`miroir-app-miroir`, `miroir-app-admin`, `miroir-localcache-redux`) are runtime dependencies of packages the epic publishes, so a registry install of `@miroir-framework/core` or `@miroir-framework/react` fails today. This analysis settles how core carries the meta-model and react the local cache, how the rest of the repo reaches them without loading a second copy, where the Node startup call lives, and what guards it.

Related issue: https://github.com/miroir-framework/miroir/issues/652
Parent issue: #621 (work item "Rename packages", second half; epic plan I6 slice 3; decisions D7-b and D8-a)
Prerequisites: #650 (PR #653, merged: the 11 published names, `scripts/rename_packages.py`), #643 (manifest contract, pack cases in `test_package_manifests.py`), #636 (the server library, its forbidden-imports plugin)
Related analyses: [`../621-FEATURE-npm-packages/analysis.md`](../621-FEATURE-npm-packages/analysis.md) (D7, D8, §4.1), [`../650-BUILD-rename-packages/analysis.md`](../650-BUILD-rename-packages/analysis.md) (D1: why these 3 kept their names)
Key sources: [`packages/miroir-core/tsup.config.js`](../../../packages/miroir-core/tsup.config.js), [`packages/miroir-react/tsup.config.js`](../../../packages/miroir-react/tsup.config.js), [`packages/miroir-server-library/tsup.config.js`](../../../packages/miroir-server-library/tsup.config.js), [`packages/miroir-localcache-redux/src/node.ts`](../../../packages/miroir-localcache-redux/src/node.ts), [`packages/miroir-react/src/miroir-localcache-imports.ts`](../../../packages/miroir-react/src/miroir-localcache-imports.ts), [`scripts/published-packages.json`](../../../scripts/published-packages.json), [`packages/miroir-standalone-app/bundle-policy.json`](../../../packages/miroir-standalone-app/bundle-policy.json)

**Status:** the epic decided D7-b and D8-a. The decisions below are technical; the user asked to proceed on the recommended options. Revision history at the end.

**Baseline:** `_integration` at `24ba0aa46` (after PR #653), all packages at `0.5.0-rc.1`.

---

## 1. Goals

- **G1 — Install core and react from the registry.** In order to start an application from npm, as an application developer, I install `@miroir-framework/core` and `@miroir-framework/react` and their JavaScript modules bring the meta-model and the local cache with them: no private package is needed to import them.
- **G2 — Start a Node process from a published package.** In order to run a CLI, an MCP host or my own server on Miroir, as an application developer, I import the Node startup call (`startMiroirNode`) from `@miroir-framework/server`.
- **G3 — One copy at runtime.** In order to keep one meta-model and one local cache in memory (and one 2.5 MB meta-model in the browser bundle), as a maintainer, I know every module reaches them through the package that carries them.

## 2. Non-goals

- Flipping `private` on core, react and the server library, and running `npm publish`: the publish item (epic I8).
- Shrinking the meta-model (#337 F3) or splitting it out of the eager chunk.
- The zustand local cache (`miroir-localcache-zustand`): an experiment that stays a private workspace package; only its imports of the meta-model change (D2).
- Renaming the folders or the 3 private packages: they stay `miroir-app-miroir`, `miroir-app-admin`, `miroir-localcache-redux`, private, built as today.
- Changing how core's type generation reads the meta-model (`npm run generate-ts-types` keeps importing the built `miroir-app-miroir`).
- The admin and meta-model **asset folders** that `@miroir-framework/env` opens by package name (`openEnvironment.ts` `adminSeedRows`: `packagesDirectory/miroir-app-admin/assets`; `environments/*.json` name `package: "miroir-app-*"`): a registry install still lacks them. Owned by the template and consumer-test item (epic I7), which decides where a consumer's environment finds its seed data.

## 3. Decision record

| Decision | Choice | Goals | Status |
|---|---|---|---|
| D1 How core carries the meta-model | **two new entries, `dist/meta-model.js` and `dist/admin.js`, each bundling one private package; the other entries import them by core's own name (`@miroir-framework/core/meta-model`), left external; two tsup builds (an array config)** | G1, G3 | Accepted |
| D2 Who imports the meta-model by subpath | **every package except core and the two meta-model packages, in `src/` and tests; vite aliases of core and ncc externals follow** | G3 | Accepted |
| D3 How react carries the local cache | **react's tsup bundles `miroir-localcache-redux` (`noExternal`), declares its third-party dependencies, and re-exports what other packages import from it** | G1, G3 | Accepted |
| D4 Where the Node startup call lives | **a `./startup` entry of `@miroir-framework/server` bundling `miroir-localcache-redux/node`; the CLI, the server binary and Electron import it from there** | G2, G3 | Accepted |
| D5 Applying and checking the import change | **a new import-specifier scanner in `scripts/rename_packages.py`, driven by `scripts/package-import-map.json`, applied outside the owning packages; `--apply` and `--check` cover it** | G3 | Accepted |
| D6 Bundle report | **a workspace file that is an `exports` subpath entry is attributed to `<name>/<subpath>`; the policies move the `miroir-app-*` keys to the core subpaths** | G3 | Accepted |
| D7 Guards | **`test_package_manifests.py`: the declaration rules treat a bundled folder as part of its owner, a dependency rule, pack cases on `dist` and `.d.ts`; source rules on the local cache importers and on vite aliases; a check on the server release** | G1, G2, G3 | Accepted |

### D1 — How core carries the meta-model

`miroir-app-miroir/dist/index.js` (5.37 MB, 337 named exports of JSON objects) and `miroir-app-admin/dist/index.js` (61 kB) are imported by 28 files of `packages/miroir-core/src` and stay external in core's build: `dist/index.js` carries `import {…} from 'miroir-app-miroir'` (checked: `grep -c "from'miroir-app-miroir'"` on the built file). The comment in `tsup.config.js` explains the `external`: bundling the packages through their symlinked `dist/` once broke the Rollup tree-shaking pass on stale `.map` files.

| Option | Pros | Cons |
|---|---|---|
| A. `splitting: true`, entries `meta-model` and `admin` share a chunk with `index` | one build switch | chunk files with hashed names (`chunk-EPO5MKHM.js`, 2.55 MB in a trial build): the bundle report cannot name them, the meta-model cap in the policy loses its key; also splits core's lazy imports (`ModelUpdate-*.js`) that are inlined today |
| **B. Self-reference ★** | stable file names (`dist/meta-model.js`, `dist/admin.js`); `index`, `model-validation-fs`, `ml-to-ts` and `admin` import `@miroir-framework/core/meta-model`, which Node, Vite and esbuild resolve through core's own `exports` and the root `node_modules` symlink; one instance; core's splitting and tree-shaking unchanged | two builds instead of one (below) |
| C. Export the meta-model from core's root | no new entry | the issue asks for subpaths; 337 names join core's root and its public-API review (#649) |

Trial (option A, reverted, `dist` rebuilt since): the build passes and `meta-model.js` exposes 337 names with `entityEntity.uuid` intact, so bundling the private packages is no longer blocked by the stale-map problem. Option B keeps that result with stable names.

Build shape: tsup runs one esbuild build per config object, and an entry's imports are resolved for the whole build. `defineConfig` returns an array:
- build A, entries `meta-model` (`export * from "miroir-app-miroir"`) and `admin` (`export * from "miroir-app-admin"`), `noExternal` on both packages except `miroir-app-miroir` inside `admin`, which is rewritten to the external `@miroir-framework/core/meta-model`;
- build B, the current entries, with `miroir-app-miroir` and `miroir-app-admin` rewritten to the external subpaths (an esbuild `onResolve` plugin), `clean: true` only here (A runs after or without cleaning), the `onSuccess` declaration step here.

Consequences:
- core's `package.json`: `exports` gains `./meta-model` and `./admin`, `files` gains their `.js`, `.js.map` and `.d.ts`; `miroir-app-miroir` and `miroir-app-admin` move from `dependencies` to `devDependencies` (type generation and core's tests still import them).
- Declarations: `dist/meta-model.d.ts` and `dist/admin.d.ts` are copies of the packages' hand-written stubs (`index.d.ts`, every export `any`), written in `onSuccess` as `model-validation-fs.d.ts` is. No other built `.d.ts` of core names the private packages (checked: the two hits are a comment and a path string).
- Core's own `src/` and tests keep importing `miroir-app-miroir` (resolved to the same single module under vitest, bundled at build).

### D2 — Who imports the meta-model by subpath

Any module that imports `@miroir-framework/core` and also `miroir-app-miroir` gets two copies: core's bundled one and the package's. In the browser that is 2.5 MB twice in the eager chunk; anywhere it is two object graphs for the same entities.

| Package | Files importing `miroir-app-miroir` / `-admin` (src + tests) |
|---|---|
| `miroir-standalone-app` | 84 / 54 (75 test files, 24 src) |
| `miroir-react` | 45 / 25 |
| `miroir-localcache-redux` | 10 / 3 |
| `miroir-localcache-zustand` | 6 / 3 |
| `miroir-env` (tests) | 6 files |
| `miroir-mcp` | 4 / 2 |
| stores (`filesystem`, `indexedDb`, `mongodb`, `postgres`) | 2, 2, 1, 1 |
| `miroir-sandbox` | 2 / 2 |
| `miroir-cli`, `miroir-server`, `miroir-ai`, examples, fixtures, `miroir-app-meta` | 1–2 each |

Counts from `git grep -l` on `from "<name>"`, `import("<name>")`, `require("<name>")`; tsup `external` lists in `miroir-app-meta`, `miroir-example-github` and `miroir-example-spotify` also name them.

Correction to the counts (review v2): the `miroir-env` row counts application-name strings (`package: "miroir-app-miroir"`), not imports: `miroir-env` has 0 importers; `miroir-ai` has 0 (its `package.json` declares `miroir-app-miroir` without importing it: drop the dependency); `miroir-server` has 1 (`server.ts`, admin). The total outside the owners is 190 files.

Choice: **all of them move** to `@miroir-framework/core/meta-model` and `@miroir-framework/core/admin`, tests included (a test that imports both gets two copies too).

Two tool configurations reach core by name and must follow:
- **Vite string aliases.** `packages/miroir-example-{github,library,postgres,spotify}/vite.config.js` and `packages/miroir-app-meta/vite.config.js` alias `"@miroir-framework/core"` to `src/index.ts`. A string alias also matches by prefix, so `@miroir-framework/core/meta-model` would become `src/index.ts/meta-model`; and core's `src`, loaded through the alias, imports `miroir-app-miroir` directly. These configs gain `"@miroir-framework/core/meta-model"` → `miroir-app-miroir` and `"@miroir-framework/core/admin"` → `miroir-app-admin`, listed before the root alias (as `model-validation-fs` already is), which keeps one copy under the alias.
- **ncc externals.** `miroir-server`'s `build:server` marks `-e @miroir-framework/core` external; ncc matches an external by exact name, so `@miroir-framework/core/admin` would be inlined into `release/index.js` next to the external core's own `dist/admin.js`. The script gains `-e @miroir-framework/core/meta-model -e @miroir-framework/core/admin` and drops `-e miroir-localcache-redux` and `-e miroir-app-*`. Same review for the CLI's tsup `external` (`miroir-localcache-redux` → `@miroir-framework/server`) and the examples' tsup `external` lists. Kept: `packages/miroir-core/**`, `packages/miroir-app-miroir/**`, `packages/miroir-app-admin/**` (the owners). Folder paths (`"miroir-app-admin/assets"` in deployment JSON, `path.join(…, "miroir-app-admin/assets/admin_data")` in tests) and workspace selectors (`-w miroir-app-miroir` in `build-all.sh`) are not imports and stay. Manifests: the 3 private names leave every published package's `dependencies` and `peerDependencies` (they may stay `devDependencies` of packages whose tests need the workspace built).

Rejected: moving only the published packages' `src/` (the standalone app, which bundles everything, would still load two copies).

### D3 — How react carries the local cache

react's `tsup.config.js` builds one output module per source file (`splitting: true`, #592) and tsup marks every declared dependency external. Today `miroir-localcache-redux` is a dependency, so the built react imports it.

- react moves `miroir-localcache-redux` to `devDependencies`, adds `noExternal: ["miroir-localcache-redux"]`, and declares the local cache's third-party runtime dependencies (`@reduxjs/toolkit`, `@teroneko/redux-saga-promise`, `immer`, `redux-saga`, `typed-redux-saga`; `react-redux` as react already peers on React).
- Declarations: react's bundled `dts` (`dts: { entry: "src/index.ts" }`) must inline the local cache types it re-exports (`LocalCache`, `MiroirPlatform`, …): tsup's `dts.resolve: ["miroir-localcache-redux"]`. The inlined types import `redux`, `reselect`, `redux-saga/effects`, `typed-redux-saga` and `@teroneko/redux-saga-promise`; `redux` and `reselect` come only through `@reduxjs/toolkit`. react declares the packages its inlined types name directly (`redux-saga`, `typed-redux-saga`, `@teroneko/redux-saga-promise`, `@reduxjs/toolkit`) and the pack check (D7) proves no `.d.ts` names a private package; a consumer type-check is the release item's (I7).
- Other importers of the root entry: `miroir-standalone-app/src/miroir-fwk/4-tests/localCacheImplementation.ts` (`import * as LocalCacheRedux`), 3 standalone test files, `miroir-env/tests/bootTestSupport.ts`, `miroir-localcache/tests` (2). The standalone app, which also loads react, takes what it needs from `@miroir-framework/react` (react re-exports it if missing: `miroir-localcache-imports.ts` already re-exports 60+ names). Tests of packages that never load react (`miroir-localcache`, `miroir-env`) may keep the private package as a devDependency: no second copy there.
- Hand moves: besides `localCacheImplementation.ts` and `MlEnumEditor.tsx` (react's own `src`, unchanged: bundled), `packages/miroir-standalone-app/tests/helpers/IntegrationTestSession.unit.test.ts` mocks `vi.mock("miroir-localcache-redux")`; once the code under test reaches react's bundled copy the mock no longer applies, so it mocks what the app imports.

### D4 — Where the Node startup call lives

`startMiroirNode` and `startMiroirPlatform` are exported by `miroir-localcache-redux/node` (`src/node.ts`, the entry without React, #337). Importers in `src/`: `miroir-cli/src/platform.ts`, `miroir-server/src/server.ts` (next to `createMiroirServerApp` from `@miroir-framework/server`), `miroir-standalone-app-electron/src/environmentBoot.ts`. Test importers: `miroir-ai`, `miroir-cli`, `miroir-mcp`, `miroir-react`, `miroir-server-library` test platforms.

| Option | Pros | Cons |
|---|---|---|
| A. Root of `@miroir-framework/server` | one import path | the CLI would evaluate the Express app module (top-level `express` import) just to start a platform |
| **B. `@miroir-framework/server/startup` ★** | a second entry with no Express code; the root stays the HTTP app | one more subpath |

Consequences:
- server-library: a `src/startup.ts` re-exporting `startMiroirNode`, `startMiroirPlatform` and their types from `miroir-localcache-redux/node`, bundled (`noExternal`), the local cache's third-party dependencies declared. The forbidden-imports plugin keeps passing: the local cache imports no store or driver.
- ncc inlines the server library into the release (#636, `test_server_library_boundaries.py:81-83`); `./startup` is inlined the same way, and nothing else in the release loads the local cache, so the release holds one copy.
- Build order: the server library builds before the CLI and Electron (plan).
- The CLI gains a dependency on `@miroir-framework/server` (and through it Express and `@miroir-framework/mcp`), as D8-a accepted.
- The server binary and Electron import it from `@miroir-framework/server/startup` too, so a process holds one local cache. Electron does not depend on the server library today: it gains a devDependency (its main process is bundled), and its bundle policy gains the new eager package (D6).
- Declarations: the server library builds with `dts: true`; `startup.d.ts` would re-export from `miroir-localcache-redux/node`, so its `dts` gets `resolve: ["miroir-localcache-redux"]` as react's does.
- Test platforms, one local cache each: `miroir-react` tests keep `miroir-localcache-redux/node` (react's `src` runs from source there, with the private package); `miroir-cli`, `miroir-ai` and `miroir-server-library` test platforms use `@miroir-framework/server/startup` (their `src` reaches it through the server library); `miroir-mcp` tests keep the private package (below). A source rule forbids a file importing both `miroir-localcache-redux…` and `@miroir-framework/react` or `@miroir-framework/server/startup`.
- `test_startup_calls_boundaries.py` `CALL_PACKAGES` gains the server library (it now carries `startMiroirNode`).
- `miroir-mcp` tests keep `miroir-localcache-redux/node` as a devDependency: the server library depends on mcp, so mcp's tests cannot depend on the server library, and mcp's `src/` never loads the local cache.

### D5 — Applying and checking the import change

The epic's rename script already walks the repo and offers `--apply` / `--check` for open branches, but its contexts (quoted, selector, bare, root-script) do not distinguish an import specifier: a "quoted" match would also rename manifest keys and the `package: "miroir-app-*"` names of `environments/*.json`, and nothing skips by folder. The meta-model move is a narrower rule: an import specifier only, never a selector, a manifest key or an application name, and never inside the owners. It is a **new scanner** in the same script, driven by `scripts/package-import-map.json`:

```json
{ "miroir-app-miroir": "@miroir-framework/core/meta-model", "miroir-app-admin": "@miroir-framework/core/admin" }
```

applied to quoted specifiers after `from`, `import(`, `require(`, `vi.mock(` and `import type … from`, in code files outside `packages/miroir-core/`, `packages/miroir-app-miroir/`, `packages/miroir-app-admin/`. It cannot see ncc `-e` flags, vite aliases or tsup `external` lists: those are hand edits (D2) guarded by D7. The local cache moves (D3, D4: about 10 files whose names differ per entry) are made by hand and checked by D7.

### D6 — Bundle report

`bundleReportCore.js` attributes a module to the workspace package whose folder holds it; its workspace list (`readWorkspaces`, the test fixture `bundleReportCore.unit.test.ts:34`) carries only `name` and `dir`, so the rule below needs each workspace's `exports` read and a test case. After D1 the meta-model is `packages/miroir-core/dist/meta-model.js`, attributed to `@miroir-framework/core`; the policy's `eagerPackageMaxBytes` cap on `miroir-app-miroir` (3 400 000) would then measure nothing and core's size would jump. Rule: a workspace file that is the target of an `exports` subpath is named `<name>/<subpath>` (`@miroir-framework/core/meta-model`). The two policies (`miroir-standalone-app`, `miroir-standalone-app-electron`) rename `miroir-app-miroir` and `miroir-app-admin` in `eager` and the cap key, and drop `miroir-localcache-redux` (now inside react); the Electron policy also gains `@miroir-framework/server` (or `@miroir-framework/server/startup` under the rule) as an eager package of the main process.

### D7 — Guards

- `test_package_manifests.py`, existing rules that this change breaks unless they learn about bundling:
  - "declares what its sources import" (`:415`): core's `src` imports `miroir-app-miroir`, react's imports `miroir-localcache-redux`, both now devDependencies. Rule: a package may import a `BUNDLED_INTO_ANOTHER` folder it owns (per `published-packages.json`) without declaring it, and the bundled folder's third-party imports count as the owner's;
  - "imports what it declares" (`:426`): react and the server library declare the redux packages that only the bundled local cache imports; same rule;
  - `:436-442` expects `from 'miroir-app-admin'` in the local cache's `dist`: it expects `@miroir-framework/core/admin`.
- New, in the same file: no published package lists a `BUNDLED_INTO_ANOTHER` folder in `dependencies`, `peerDependencies` or `optionalDependencies`; pack cases: core packs `dist/meta-model.js`, `dist/admin.js` and their `.d.ts` and declares `./meta-model` and `./admin`; the server packs and declares `./startup`; no built `.js` or `.d.ts` of core, react or the server names one of the 3 private packages.
- Source rules: `rename_packages.py --check` reports any meta-model import outside the owners; a pytest allows `src/` imports of `miroir-localcache-redux` only in react and the server library, and forbids a file importing it together with `@miroir-framework/react` or `@miroir-framework/server/startup`; a pytest fails on a vite config with a string alias on `@miroir-framework/core` but no `meta-model` and `admin` aliases.
- Server release: the nonreg release step checks that `release/index.js` holds no meta-model data (no `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad`, the Entity entity uuid, as a JSON value), i.e. ncc left the subpaths external.
- Lockfile: moving dependencies between manifest sections refreshes `package-lock.json`; `check_dependency_policy.py --rule lockfile` catches a stale one.

## 4. Current state

| Piece | Today | After |
|---|---|---|
| core `dependencies` | `miroir-app-admin`, `miroir-app-miroir` (`*`) | devDependencies |
| core build | both external; `dist/index.js` imports `miroir-app-miroir` | `dist/meta-model.js`, `dist/admin.js` bundle them; other entries import the subpaths |
| react `dependencies` | `miroir-app-admin`, `miroir-app-miroir`, `miroir-localcache-redux` | none of them; redux runtime deps declared |
| server library | `@miroir-framework/core`, `@miroir-framework/mcp`; root entry only | `./startup` entry bundling `miroir-localcache-redux/node` |
| CLI | `miroir-localcache-redux` dependency, external in tsup | `@miroir-framework/server` dependency and external |
| server binary `build:server` | ncc `-e @miroir-framework/core -e miroir-localcache-redux -e miroir-app-*` | `-e` on the core subpaths; `@miroir-framework/server/startup` inlined like the root (#636), one copy in the release |
| example and meta vite configs | string alias `@miroir-framework/core` → `src/index.ts` | plus `meta-model` and `admin` aliases to the private packages |
| `miroir-localcache-redux` deps | `miroir-app-*`, core | core only (meta-model by subpath) |
| `published-packages.json` | the 3 folders mapped to core and react (#643) | unchanged; the dependency rule reads it |
| `build-all.sh` order | app packages, core, local cache, stores, react | unchanged: the private packages build before the package that bundles them |

## 5. Key reuse

| Piece | Location |
|---|---|
| Rename machinery (contexts, `--apply`, `--check`) | `scripts/rename_packages.py` |
| Bundled-folder list | `BUNDLED_INTO_ANOTHER` in `scripts/tests/test_package_manifests.py` |
| Pack helpers (`pack_list`, `require_built`, `MIROIR_REQUIRE_PACK`) | `scripts/tests/test_package_manifests.py` |
| Subpath declaration pattern | `onSuccess` in `packages/miroir-core/tsup.config.js` (`model-validation-fs.d.ts`) |
| Meta-model declaration stubs | `packages/miroir-app-miroir/index.d.ts`, `packages/miroir-app-admin/index.d.ts` |
| Node entry without React | `packages/miroir-localcache-redux/src/node.ts` |
| Module attribution | `packages/miroir-standalone-app/vite/bundleReportCore.js` (`attributeModule`) |

## 6. Risks

| Risk | Mitigation |
|---|---|
| A module still loads a private package next to its bundled copy | D5 `--check`, D7 dist and source rules |
| Self-reference or subpath mishandled by a tool (ncc externals by exact name, Vite string aliases by prefix) | D2 hand edits; D7 alias rule and release check; Node and Vite resolve the self-reference through `exports` and the root `node_modules` symlink (checked) |
| react's `dts` cannot inline the local cache types | `dts.resolve`; fall back to declaring the re-exported types in react |
| Bundle policy drifts | D6 rule and the policy update in the same change; `check_bundle_policy.py` in nonreg |

Next: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).

## Revision history

- v1 (2026-11-01): first version.
- v2.1 (2026-11-01): from the plan review: ncc inlines `./startup`, build order.
- v2 (2026-11-01): adversarial review, 12 findings applied: vite string aliases and ncc externals (D2), two tsup builds (D1), manifest rules that learn about bundling (D7), `dts.resolve` for the server, inlined type dependencies, Electron's dependency and policy, the `vi.mock` hand move, one local cache per test platform, corrected counts, G1 narrowed and the asset folders a non-goal, D5 a new scanner, D6 workspace `exports`, `CALL_PACKAGES`, lockfile.
