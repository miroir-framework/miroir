# 643 — Well-formed manifests and peer dependencies for the packages to publish

> The workspace packages that become `@miroir-framework/*` (#621) have manifests written for the monorepo: no `files` or `exports` on most of them, `"./src/*"` exports that point to folders they do not ship, no TSDoc in their declarations, and peer ranges that disagree. This analysis lists what each manifest lacks and settles the contract a test will keep, before the packages are renamed (I6) and packed for a consumer (I7).

Related issue: https://github.com/miroir-framework/miroir/issues/643
Parent issue: #621 (item I5, work item W5; the `"./src/*"` part of W7) · Prerequisite: #639 startup calls (PR #642), which left the store peers of `miroir-mcp` unused
Related analyses: [`../621-FEATURE-npm-packages/analysis.md`](../621-FEATURE-npm-packages/analysis.md) (§4.1, D10, D11, §7), [`../639-REFACTOR-startup-calls/analysis.md`](../639-REFACTOR-startup-calls/analysis.md) (non-goals), [`../326-BUILD-build-hardening/`](../326-BUILD-build-hardening/) (dependency policy)
Key sources: [`scripts/check_dependency_policy.py`](../../../scripts/check_dependency_policy.py), [`packages/miroir-core/package.json`](../../../packages/miroir-core/package.json), [`packages/miroir-core/tsup.config.js`](../../../packages/miroir-core/tsup.config.js), [`tsconfig.json`](../../../tsconfig.json), [`ci/release/release_lib/tarballs.py`](../../../ci/release/release_lib/tarballs.py)

**Status:** D1 follows the epic's recommendation D10-b and D3 its D11 frame ("either way `./src/*` goes"); the request to proceed with manifest hygiene confirms them. The other decisions are technical and recorded here. Revision history at the end.

**Baseline:** `claude/639-startup-calls` at `af5b49a4e`, all packages at `0.5.0-rc.1`.

---

## 1. Goals

- **G1 — Install exactly what runs.** In order to keep my install small and my imports stable, as an application developer, I get from each Miroir package only its built files and the entry points it declares, and an import of anything else fails at once.
- **G2 — One copy of the shared libraries.** In order to avoid "schema is not a Zod schema", "could not find react-redux context" or "useNavigate() may be used only in the context of a <Router>" failures, as an application developer, my project has one copy of `zod`, `react`, `react-dom`, `react-redux`, `react-router-dom`, `formik`, `@mui/material` and `@emotion/*`, and npm warns me when a Miroir package does not accept my version. No Miroir package carries a hidden copy of a library or of another Miroir package inside its `dist/`.
- **G3 — Documented types.** In order to use Miroir from my editor, as an application developer, I see the TSDoc of Miroir functions and types in hovers and completions, and "go to definition" does not lead to a missing file.
- **G4 — Manifests stay correct.** In order to change a package without breaking the published set, as a Miroir maintainer, a test of the pre-push gate tells me when a manifest of the set loses a required field, exports `./src/*`, declares a peer the rest of the set disagrees with, or when a package's `src/` imports a package its manifest does not declare.

## 2. Non-goals

- Detecting two copies of core at startup (#621 "Detect two copies of core", I5 slice 1).
- `@public` TSDoc on the exports of core (#621 "Public API of core", D11-a). This issue only makes sure the TSDoc reaches the declarations.
- `import.meta.env` in `miroir-core/src/tools.ts` (I5 slice 4, a risk of #621 §7).
- Removing `private: true` from the 11 private packages of the set (§4.2). `ci/release/release_lib/plan.py` (lines 96–100) treats them as bundle-only. The three public ones (`miroir-mcp`, `miroir-cli`, `miroir-env`) are already installed by `validate_layer_consumer` (`tarballs.py:135–196`), with the private tarballs as `file:` dependencies: this issue's `files` and peer changes reach that check now (§6). Making the whole set installable is #621 I7 and I8.
- Renaming to `@miroir-framework/*` and merging `miroir-app-*` into core and the local cache into react (I6, D7, D8). The contract is written on workspace names; I6 adds the "published name" rule.
- Deleting `miroir-localcache` or `miroir-localcache-zustand` (both private, off the published path).
- Packages outside the set, except the bogus `repository.url` of `miroir-server` (§4.4), fixed on the way.
- The type-only `vitest` import of core's `src/5_tests/QueryRunnerTestTools.ts` (exported from `index.ts:1859`): the emitted declarations reference `vitest`. It is recorded as an allowed exception of D9 and left to "Public API of core", which decides whether test tools stay in the main entry.
- Global patches and top-level effects of core (`BigInt.prototype.toJSON`, `chalk.level`, §4.5): recorded for D6, not changed.

## 3. Decision record

| Decision | Choice | Serves | Status |
|---|---|---|---|
| D1 Shared libraries | **peer dependencies with a caret range (`react`: `>=18.2.0`), the exact version in `devDependencies`**; `react-redux` joins the epic's D10-b list | G2 | Accepted |
| D2 Where the set is listed | **`scripts/published-packages.json`**, read by the manifest test | G4 | Accepted |
| D3 `./src/*` in core and store-postgres | **remove; in-repo imports use `miroir-core/model-validation-fs` and relative paths** | G1 | Accepted |
| D4 Declaration maps of core | **stop shipping `.d.ts.map`**; keep emitting them for the monorepo | G3 | Accepted |
| D5 TSDoc in declarations | **`removeComments: false` in the root `tsconfig.json`** | G3 | Accepted |
| D6 `sideEffects` | **`false` on every package of the set** | G1 | Accepted |
| D7 Entry points of the CLI | **`exports` holds only `./package.json`**; the program stays a `bin` | G1 | Accepted |
| D8 `engines.node` | **`>=22`** | G1 | Accepted |
| D9 Declared imports | **every bare import of `src/` is a `dependency` or peer, and every runtime `dependency` or peer is imported**, with a short allowlist of reasons; unused ones go | G1, G2, G4 | Accepted |

### D1 — Shared libraries as peers

`zod` `4.6.7` is an exact `dependency` of six packages of the set (§4.3). An application with another `zod` gets a second copy: Miroir's schemas fail its `instanceof` checks. `react-redux` has the same problem across two packages of the set: `miroir-localcache-redux` re-exports its `Provider` as `LocalCacheProvider` and its `useSelector`, and `miroir-react` lists it as an exact `dependency`. Two copies mean two React contexts, and `useSelector` finds no store. `react-router-dom` (`7.18.4`, 22 files of `miroir-react`) and `formik` (`2.4.9`, 33 files) are exact `dependencies` of `miroir-react` whose context the host provides or reads: the standalone app creates the router (`src/miroir-fwk/4-tests/componentTests/runReportTest.tsx:371`) and reads the formik context (`useFormikContext`, `ReportSectionMiroirTest.tsx:2`).

| Option | Pros | Cons |
|---|---|---|
| D1-a. Peer with the exact version (`"zod": "4.6.7"`) | matches the exact-pin rule of #326 | a consumer on `4.6.8` gets a peer conflict and `npm install` fails (npm 7+ treats peer conflicts as errors) |
| **D1-b. Peer with a caret range from the version the repo builds with (`^4.6.7`), exact version in `devDependencies`** ★ | one copy in the consumer's tree; patch and minor upgrades install; the repo still builds and tests against one pinned version | the dependency policy needs a peer rule: the `devDependencies` version must satisfy the peer range, so a peer is never built against something else |
| D1-c. Keep exact `dependencies` | no change | the epic's D10-a, rejected there |

The peers, per package. A package is a peer owner when its `src/` imports the library (§4.3), or when a library it imports needs it as a peer (marked †):

| Library | Range | Peer of |
|---|---|---|
| `zod` | `^4.6.7` | core, react, mcp, cli, store-postgres |
| `react` | `>=18.2.0` | react, localcache-redux † (peer of `react-redux`) |
| `react-dom` | `^18.2.0` | react |
| `react-redux` | `^9.3.0` | react, localcache-redux |
| `@mui/material` | `>=5.17.1 <10` | react |
| `@emotion/react` | `^11.10.5` | react |
| `@emotion/styled` | `^11.10.5` | react † (peer of `@mui/material`) |
| `react-router-dom` | `^7.18.4` | react |
| `formik` | `^2.4.9` | react |

`miroir-localcache-redux` lists `zod` and the `react-dom` peer without importing either (§4.3): both go (D9). Hosts outside the set (standalone app, sandbox, Electron, server binary, examples) already list the libraries they use as `dependencies` and keep them: they are the consumers that provide the peers. `react` takes `>=18.2.0`, the only range without a caret: the release dry run (`release_version.py --apply`) showed that in a consumer without `react`, npm's peer resolver picks `react` 19 for the `@emotion/*` peers (`>=16.8.0`) and then fails with ERESOLVE on `^18.2.0`. `>=18.2.0` raises the floor from `>=18.0.0` and installs `react` `18.3.1` there; the repo has never run on 19, and `react-dom` `^18.2.0` still pins the major.

### D2 — Where the set is listed

The epic's mapping (§4.1 of #621) names the packages, but no file does. `scripts/tests/test_package_runtime_dependencies.py` (#627) keeps its own list, which includes `miroir-ai` and `miroir-localcache-zustand` (not in the set) and misses the stores.

| Option | Pros | Cons |
|---|---|---|
| D2-a. A constant in the new test | one file | I6 (rename map) and I8 (release pipeline) need the same list |
| **D2-b. `scripts/published-packages.json`: workspace folder of each package of the set, with its target published name** ★ | one source for the test, the rename (I6, `package-rename-map.json` can derive from it) and the release pipeline (I8) | one more file |

The #627 test keeps its own list: it checks something else (no example application at runtime) on a set that includes `miroir-ai`.

### D3 — `./src/*`

`miroir-core` exports `"./src/*": "./src/*"` and `miroir-store-postgres` exports `"./src/*"` too, but neither ships `src/` (`files`). Inside the repo, 19 import specifiers in 18 files use `miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js` (16 static imports, 3 `await import(...)` inside `vi.mock` factories), and one core test imports `miroir-store-postgres/src/4_services/sqlCreateSchemaIfNotExists.js` (§4.2).

| Option | Pros | Cons |
|---|---|---|
| D3-a. A new `./testing` subpath (the epic plan's first idea) | a name for test helpers | every function those files use is already exported by `miroir-core/model-validation-fs` (§4.2); a second Node-only entry would bundle a second copy of the same modules |
| **D3-b. Use `miroir-core/model-validation-fs`; the postgres test uses a relative path, as `externalServiceDispatch.integ.test.ts` already does** ★ | no new entry; the specifiers resolve through `exports` like a consumer's would | the standalone app's tests now load the built entry, not core's `src/`: core must be built first, which session setup and CI already do |
| D3-c. Ship `src/` | nothing to move | ships core's 287 source files, including the generated types, for no consumer use |

### D4 — Declaration maps

`miroir-core` emits its declarations with `tsc` (`tsconfig.declarations.json`, `declarationMap: true`) so that "go to definition" jumps into `src/` inside the monorepo (`tsup.config.js` comment, line 18). Its `files` ships `dist/**/*.d.ts.map`, whose `sources` point to `../src/...`, which is not shipped. The other packages of the set build their declarations with tsup (`rollup-plugin-dts`), which emits no map.

| Option | Pros | Cons |
|---|---|---|
| D4-a. Ship `src/` so the maps resolve | "go to definition" reaches source for consumers | D3-c's cost |
| **D4-b. Drop `dist/**/*.d.ts.map` from `files`** ★ | consumers' editors fall back to the `.d.ts`, which now carries TSDoc (D5); the monorepo keeps its maps (workspace links ignore `files`) | consumers do not reach the source |
| D4-c. Stop emitting maps | simplest | breaks "go to definition" inside the monorepo |

### D5 — TSDoc in declarations

The root `tsconfig.json` sets `removeComments: true` (line 31), and 13 of the 14 packages of the set inherit it; `miroir-server-library/tsconfig.json:9` sets it to `false`, and its `dist/index.d.ts` has 13 `/**` blocks, which shows that tsup's dts build follows the option. The others' declarations carry no TSDoc: `dist/5_tests/ModelValidationToolsFilesystem.d.ts` of core has none against 7 in its source, `dist/node.d.ts` of `miroir-localcache-redux` none while `src/startMiroirPlatform.ts` has 16. JavaScript is emitted by esbuild (tsup, Vite), which ignores the option, so it only affects `tsc` output: declarations, and the `miroir-server` build, which already sets it to `false`.

| Option | Pros | Cons |
|---|---|---|
| **D5-a. `removeComments: false` in the root** ★ | one line; every declaration keeps its TSDoc | larger `.d.ts` files in private packages too (no consumer) |
| D5-b. `false` in each package of the set | scoped | 13 tsconfig files to keep in line; I6 merges packages anyway |

The manifest test resolves each package's `tsconfig.json` through its `extends` chain and checks the effective value, so a package that turns it back on fails.

### D6 — `sideEffects`

Only `miroir-react` declares it (`false`). A bundler that reads `false` may drop a module whose exports are unused; it keeps the top-level code of every module it keeps. The top-level effects of the set's `src/` (§4.5): logger registrations; `enablePatches()` in `UndoRedoReducer.ts`; the global patch `BigInt.prototype.toJSON` in core's `TransformersForRuntime.ts:161`, a module every transformer path uses; `chalk.level = 3` in core's test tools; the program start of the CLI (`src/index.ts:126`, `main()`) and of `miroir-env`'s `src/cli.ts` (`bin` entries, never imported); side-effect CSS imports in `miroir-react` (third-party CSS, whose own package decides). Each sits in a module that is used whenever its effect matters, or in a `bin` entry. Dropping an unused module also drops its logger registration, which nothing reads.

| Option | Pros | Cons |
|---|---|---|
| **D6-a. `false` everywhere** ★ | the sandbox and app bundles can drop unused code of core and the stores | a future top-level registration that matters breaks silently; the web self-test and the bundle guards are the net |
| D6-b. `true` (or absent) for core | safe | keeps all of core in every bundle (#337) |

### D7 — Entry points of the CLI

`miroir-cli` has `main: dist/index.js`, which is the program itself (`bin`). Importing the package runs the CLI. No package imports `miroir-cli`.

**Choice:** `exports: { "./package.json": "./package.json" }`, no `main` or `types`; `bin` unchanged. `scripts/agent_session_setup.py` (`_is_built`, lines 78–93) looks for `main`, `module` or `types` to decide whether a package is built; `miroir-cli` is not in its `BUILD_GROUPS`, so nothing changes, but the check must use `bin` if it is added. `miroir-env` keeps its library entry (`.`) and its `bin` (`dist/cli.js`), which are separate files.

### D8 — `engines.node`

CI runs Node 24 (`.github/actions/checkout/action.yml`), `.nvmrc` pins 22, and Node 20 left maintenance in April 2026. The CLI is built with `--target=node20`, which runs on 22. **Choice:** `">=22"` on every package of the set. The build targets stay as they are.

### D9 — Declared imports

tsup externalizes only `dependencies` and `peerDependencies` (plus its `external` list); it **bundles** any other bare import into `dist/`. Today this hides copies inside the set (§4.6): `miroir-localcache-redux/dist` holds its own `immer` (`function enablePatches` is defined in its chunk) and the `miroir-app-admin` model it imports in `src/4_services/localCache/Model.ts:35`; `miroir-store-mongodb` imports `miroir-app-miroir` (`MongoDbEntityStoreSectionMixin.ts:20`) without declaring it. The opposite also exists: runtime dependencies nothing imports (`miroir-react` → `miroir-localcache-zustand`, a private package, so the published react package could not install; `miroir-mcp` → three store peers, `miroir-app-*`, `miroir-localcache-redux`; `miroir-store-filesystem` → `pg`, `pg-hstore`).

| Option | Pros | Cons |
|---|---|---|
| D9-a. Fix the cases found, no rule | small | the next undeclared import is bundled silently |
| **D9-b. Fix them and add both directions to the manifest test** ★ | G4: the contract catches new cases | needs an import scanner (static, dynamic, `export … from`) and an allowlist |

Allowlist (each entry with its reason, in the test):

| Package | Entry | Reason |
|---|---|---|
| store-postgres | `pg`, `pg-hstore` declared, not imported | Sequelize loads them by name at runtime |
| localcache-redux | `react` peer, not imported | peer of `react-redux` (D1 †) |
| react | `@emotion/styled` peer, not imported | peer of `@mui/material` (D1 †) |
| core | `vitest` imported (type-only), not declared | §2 non-goal |
| app-miroir | `miroir-core` imported (type-only), only a devDependency | declaring it would make a runtime cycle core ↔ app-miroir; its declarations are a hand-written `index.d.ts` stub with no core type, and tsup marks `miroir-core` external; #621 D7 merges the two in I6 |

Ambient declaration files (`*.d.ts` in `src/`, such as `miroir-react/src/lodash-es.d.ts`) and Node built-ins (including `import type { Domain } from "domain"` in `ViewParamsUpdateQueue.ts:1`) are not counted. Fixes: `immer` becomes an exact `dependency` of core (type-only use in `LocalCacheInterface.ts:8`, kept by the emitted `.d.ts`) and of `miroir-localcache-redux` (runtime, `11.1.21`, within `@reduxjs/toolkit`'s `^11.0.0`, so npm installs one copy); `miroir-app-admin` of `miroir-localcache-redux` and `miroir-app-miroir` of `miroir-store-mongodb` (`"*"`); `@codemirror/view` of `miroir-react` (`6.37.2`, the installed copy that `@uiw/react-codemirror` uses). The unused entries of §4.6 go, except those the package's tests use, which move to `devDependencies`.

---

## 4. Current state

### 4.1 The published set (workspace names)

From the epic's mapping (#621 §4.1, D7-b, D8-a): 14 workspace packages.

| Workspace package | Becomes | Folder |
|---|---|---|
| `miroir-core`, `miroir-app-miroir`, `miroir-app-admin` | `@miroir-framework/core` (I6) | `packages/miroir-core`, `-app-miroir`, `-app-admin` |
| `miroir-react`, `miroir-localcache-redux` | `@miroir-framework/react` (I6) | `packages/miroir-react`, `-localcache-redux` |
| `miroir-server-library` | `@miroir-framework/server` | `packages/miroir-server-library` |
| `miroir-store-postgres`, `-filesystem`, `-indexedDb`, `-mongodb`, `-bundled` | `@miroir-framework/store-*` | `packages/miroir-store-*` |
| `miroir-mcp`, `miroir-cli`, `miroir-env` | `@miroir-framework/mcp`, `-cli`, `-env` | `packages/miroir-mcp`, `-cli`, `-env` |

### 4.2 Manifests field by field

Enumerated from each `package.json` (script in the Realization of the plan's Slice 0).

| Package | `private` | `files` | `exports` | `sideEffects` | `engines` | `repository` |
|---|---|---|---|---|---|---|
| miroir-core | yes | yes, with `dist/**/*.d.ts.map`, and `dist/index.cjs`, `dist/index.cjs.map`, `dist/src/worker.js`, which the build does not produce (no cjs format, no worker; `dist/src/` holds only `assets/`) | `.`, `./model-validation-fs`, `./ml-to-ts`, **`./src/*`** | — | — | — |
| miroir-app-miroir | yes | yes | `.` | — | — | — |
| miroir-app-admin | yes | yes | `.` | — | — | — |
| miroir-react | yes | — | `.` | `false` | — | — |
| miroir-localcache-redux | yes | — | `.`, `./node` | — | — | — |
| miroir-server-library | yes | `["dist"]` | `.` | — | — | yes, no `directory` |
| miroir-store-postgres | yes | — | `.`, **`./src/*`** | — | — | — |
| miroir-store-filesystem, -indexedDb, -mongodb, -bundled | yes | — | — | — | — | — |
| miroir-mcp | **no** | — | `.`, `./client` | — | — | yes, no `directory` |
| miroir-cli | **no** | — | — (`main` is the `bin`) | — | — | yes, no `directory` |
| miroir-env | **no** | — | — | — | — | yes, no `directory` |

All 14 have `license: "MIT"`. Without `files`, `npm pack` ships everything not in `.npmignore`/`.gitignore`: `src/`, `tests/`, configs.

`./src/*` users (D3):

| Specifier | Files | Kind |
|---|---|---|
| `miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js` | 18 files of `packages/miroir-standalone-app` (`scripts/testMiroirLauncher.ts`, 17 under `tests/`) | 16 static imports, 3 `await import` in `vi.mock` factories (`miroirTestListIntegrationLaunchMocks.ts`, `miroirTestDisplayIntegrationLaunchMocks.ts`, `reportTestInApp.integ.test.tsx`, which also has a static one) |
| `miroir-store-postgres/src/4_services/sqlCreateSchemaIfNotExists.js` | `packages/miroir-core/tests/4_services/sqlCreateSchemaIfNotExists.unit.test.ts` | static import |

The functions those 18 files import (`listCli{Unit,RunnerIntegration,TransformerIntegration}SuiteKeysFromFolders`, `loadApplicationMiroirTestCatalog`, `loadApplicationRunnerUuidIndexFromFolders`, `loadMiroirCoreTestSuiteFromFolders`, `resolveCliSuiteKeysFromCatalog`) are all re-exported by `src/5_tests/ModelValidationToolsFilesystem.ts`, the `./model-validation-fs` entry (lines 9–21). `miroir-core/src/0_interfaces/1_core/LIBRARY_TMP.ts` contains `miroir-core/src/assets/admin` as a `directory` string, not an import, and `miroir-react/src/components/ValueObjectEditor/MlArrayEditor.tsx:56` a commented-out import: neither is affected.

### 4.3 Shared libraries

| Package | `zod` | imports `zod` in `src/` | `react` peer | `react-dom` peer | `react-redux` |
|---|---|---|---|---|---|
| miroir-core | dep `4.6.7` | 16 files | — | — | — |
| miroir-react | dep `4.6.7` | 8 files | `>=18.0.0` | `^18.2.0` | dep `9.3.0` |
| miroir-localcache-redux | dep `4.6.7` | none | `^18.2.0` | `^18.2.0` (not imported) | peer `9.3.0`, imported by `src/index.ts` |
| miroir-mcp | dep `4.6.7` | 1 | — | — | — |
| miroir-cli | dep `4.6.7` | 1 | — | — | — |
| miroir-store-postgres | dep `4.6.7` | 1 | — | — | — |

`miroir-react` also has `@mui/material` `>=5.17.1 <10` (devDependency `9.5.0`) and `@emotion/react`, `@emotion/styled` `^11.10.5` as peers. No other package of the set declares MUI or Emotion. Installed: `react` and `react-dom` `18.3.1`, `zod` `4.6.7`. `.npmrc` sets only `save-exact=true` (no `legacy-peer-deps`), so npm installs missing peers.

`check_dependency_policy.py` (`specs`) reads `dependencies`, `devDependencies` and `optionalDependencies` and lets `peerDependencies` keep ranges; it does not check that a peer is installed for the package's own build and tests.

### 4.4 Other findings

- `miroir-react` depends on `miroir-localcache-zustand`; `src/miroir-localcache-imports.ts` mentions it only in comments (line 112 is a commented-out import).
- `miroir-mcp` declares `miroir-store-filesystem`, `-indexedDb`, `-postgres` as optional peers; since #639 nothing in `src/` imports a store; only its test platform (`tests/integration/mcpTestPlatform.ts`) does, and the package declares no store devDependency. `miroir-cli` keeps its three optional store peers: `src/startup/storeStartup.ts` imports them on demand.
- `miroir-server` (not in the set) has `repository.url` `git+https://github.com/XXXXXXXXXXXXXXXXXXXXXXXX.git`.

### 4.5 Top-level statements (D6)

A grep of lines starting with a call in the set's `src/` (tests excluded), completed by the review: core, 58 `MiroirLoggerFactory.registerLoggerToStart`, `(BigInt.prototype as any).toJSON = …` (`2_domain/TransformersForRuntime.ts:161`), `chalk.level = 3` (`5_tests/TestTools.ts:7`, `MiroirTransformerTestTools.ts:49`; `TestTools` is exported from `index.ts:1843`); `miroir-localcache-redux`, `enablePatches()` in `UndoRedoReducer.ts:28`; `miroir-react`, calls in `components/ViewParamsUpdateQueueTestUtils.ts` (lines 84–90, inside a usage-example comment block); `miroir-cli`, `main()` (`src/index.ts:126`); `miroir-env`, an entry guard in `src/cli.ts:244`; the stores, `miroir-mcp`, `miroir-server-library`, none. `miroir-react/dist` keeps bare imports of `ag-grid-community/styles/*.css` and `@glideapps/glide-data-grid/dist/index.css`.

### 4.6 Imports and declarations (D9)

A scan of `src/**/*.{ts,tsx}` (comments removed; static `import`/`export … from`, `import("…")`; relative paths and Node built-ins skipped), against `dependencies` and `peerDependencies`:

| Package | Imported, not declared | Declared, not imported |
|---|---|---|
| miroir-core | `immer` (type-only, `LocalCacheInterface.ts:8`), `vitest` (type-only, `QueryRunnerTestTools.ts:1`; devDependency) | `diff` |
| miroir-app-miroir | `miroir-core` (type-only, `src/Model.ts`, `runnerMiroirEntityTestRegistry.ts:1`; devDependency) | — |
| miroir-react | `@codemirror/view` (`CodeBlock_ReadOnly.tsx:19`, dynamic) | `miroir-localcache-zustand`, `@redux-devtools/core`, `react-hook-form` (a commented-out import), `react-select`, `@emotion/styled` (D1 †) |
| miroir-localcache-redux | `immer` (`UndoRedoReducer.ts:2`), `miroir-app-admin` (`Model.ts:35`) | `diff`, `fast-deep-equal`, `lodash`, `zod`, `react-dom`, `react` (D1 †) |
| miroir-store-mongodb | `miroir-app-miroir` (`MongoDbEntityStoreSectionMixin.ts:20`) | — |
| miroir-store-postgres | — | `pg`, `pg-hstore` (Sequelize) |
| miroir-store-filesystem | — | `pg`, `pg-hstore` |
| miroir-mcp | — | `miroir-app-admin`, `miroir-app-miroir`, `miroir-localcache-redux`, three store peers, `uuid` |
| miroir-cli | — | `miroir-app-admin`, `miroir-app-miroir`, `uuid` |
| others of the set | — | — |

`miroir-react/src/lodash-es.d.ts` (an ambient module re-exporting `lodash` types), `import type { Domain } from "domain"` (`ViewParamsUpdateQueue.ts:1`, a Node built-in) and `(window as any).require("electron")` (`TransformerEditor.tsx:500`, a runtime lookup in the Electron renderer, not an import) are not counted. `uuid` is imported by core (`TransformersForRuntime.ts:5`) and react (6 files) and stays. The unused runtime entries of `miroir-mcp` and `miroir-cli` are used by their tests (`miroir-mcp/tests/integration/mcpTestPlatform.ts` imports `miroir-localcache-redux/node`, the three stores and `miroir-app-*`): they move to `devDependencies` rather than going.

## 5. Key reuse

| Piece | Location | Use |
|---|---|---|
| Dependency policy rules and their tests | `scripts/check_dependency_policy.py`, `scripts/tests/test_check_dependency_policy.py` | new `peers` rule (D1) |
| Node-only test helpers entry | `miroir-core/model-validation-fs` (`src/5_tests/ModelValidationToolsFilesystem.ts`) | D3 |
| Pack and consumer install | `ci/release/release_lib/tarballs.py`, `ci/release/tests/test_tarballs.py` | release smoke checks the new `files` |
| Manifest test pattern | `scripts/tests/test_package_runtime_dependencies.py`, `test_startup_calls_boundaries.py` | test style |
| Bundle guards and web self-test | `scripts/check_bundle_policy.py`, `npm run nonreg` steps `build-*`, self-test | net for D6 |

## 6. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| The release consumer check already installs `miroir-mcp`, `miroir-cli` and `miroir-env` with the private tarballs | a `files` or peer mistake fails `release_version.py --apply`, not only I7 | `python -m pytest ci/release/tests -q` per slice; one `release_version.py --apply --worktree` run before the PR (§ plan) |
| Removing an unused dependency that something loads by name | a runtime "cannot find module" | the D9 allowlist names the by-name loads (Sequelize); filesystem nonreg, release smoke and the web self-test |
| A `files` list omits a file read at runtime (assets, worker) | the tarball installs but fails when used | `npm pack --dry-run --json` per package compared with what `dist/` holds; release smoke; full filesystem nonreg runs from the workspace, so it does not see `files`: the pack check is the guard |
| `sideEffects: false` drops a module some host needs | missing behaviour in the sandbox or app bundle | web self-test (1224 tests) and bundle guards on the built sandbox and app |
| Peers change what npm hoists | different versions in `node_modules` | `npm install` then `git diff package-lock.json` reviewed; the lockfile rule (react and react-dom one major) |
| The standalone app tests load core's built entry instead of `src/` | a stale `dist/` hides a change in core | session setup and CI build core before these tests, as for every other `miroir-core` import |

---

## Revision history

- v1 (2026-10-31): first version.
- v4 (2026-11-01): `react` peer `>=18.2.0` instead of `^18.2.0`, after the release dry run failed with ERESOLVE in a clean consumer (D1).
- v3 (2026-10-31): after the plan review: `uuid` is used (core, react); `miroir-app-miroir`'s type-only `miroir-core` import joins the allowlist; mcp and cli test-only entries move to `devDependencies`.
- v2 (2026-10-31): after the adversarial review. Added `react-router-dom` and `formik` to D1 and G2, the † peers, D9 (declared imports, §4.6), the `private` column and the non-goal correction (three packages of the set are public), the missing top-level effects (§4.5, D6), core's `files` entries that are not built, the corrected function list (§4.2), the D5 evidence from `miroir-server-library`.

The implementation plan is in [`tdd-implementation-plan.md`](./tdd-implementation-plan.md) once written.
