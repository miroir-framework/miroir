# 621 — Publish Miroir as scoped npm packages

> Frames epic #621: what has to change in the monorepo before Miroir can be installed from npmjs.org as a curated set of `@miroir-framework/*` packages, which decisions are taken, which are still open, and in which order the work items depend on each other. It builds on the options note (`npm-packaging/options.md` in the project files), where option B was chosen.

Related issue: https://github.com/miroir-framework/miroir/issues/621
Related analyses: [`../592-REFACTOR-move-components-to-miroir-react/analysis.md`](../592-REFACTOR-move-components-to-miroir-react/analysis.md) (§5.2, §5.3), [`../604-REFACTOR-editor-core-to-miroir-react/analysis.md`](../604-REFACTOR-editor-core-to-miroir-react/analysis.md), [`../519-FEATURE-server-application-model-environment/analysis.md`](../519-FEATURE-server-application-model-environment/analysis.md), build hardening #326 and bundle size #337 (project files)
Key sources: [`ci/release/`](../../../ci/release/), [`docs/reference/release-process.md`](../../../docs/reference/release-process.md), [`miroir-server/src/server.ts`](../../../packages/miroir-server/src/server.ts), [`miroir-mcp/src/tools/EndpointToolRegistry.ts`](../../../packages/miroir-mcp/src/tools/EndpointToolRegistry.ts), [`miroir-core/src/4_services/ServerModelEnvironments.ts`](../../../packages/miroir-core/src/4_services/ServerModelEnvironments.ts)
Target diagram: [`target-packages.architecture.json`](./target-packages.architecture.json) (archify source; rendered as `issue-621/target-packages.html` in the project files)

**Document role:** analysis and decision record for an epic. Each work item gets its own issue, and the larger ones (W1, W2, W3) their own analysis.
**Status:** D1 to D6 confirmed with A on 2026-10-31. D8 accepted in #639, D10 in #643. D7, D9 and D11 open (#643 applies D11's "`./src/*` goes" part).
**Baseline:** `_integration` at `46b4e7e`, all packages at `0.5.0-rc.1`.

---

## 1. Goals

Revised after the decisions of 2026-10-31: the standalone app stays the only client, so "a developer owns their React shell" is no longer a goal of this epic.

- **G1 — Install Miroir from the registry.** In order to build tools and applications on Miroir without cloning the monorepo, as an application developer, I can `npm install` `@miroir-framework/core`, a store package and, when I need them, `@miroir-framework/server`, `-react`, `-mcp` or `-cli`, and they work together at one version.
- **G2 — Pick my store.** In order to avoid installing drivers I don't use, as an application developer, I install only the store packages I run (Postgres, filesystem, IndexedDB, MongoDB, bundled).
- **G3 — Agent and CLI access to my application.** In order to drive my deployed application from an agent or a terminal, as an application developer, I get MCP tools and CLI commands for the Endpoints of my application, with no code in Miroir naming it.
- **G4 — Start a project from a template.** In order to start without copying the monorepo's startup code, as an application developer, I run `npm create miroir-app` and get a project whose client and server start with one call each.
- **G5 — Upgrade in one step.** In order to upgrade safely, as an application developer, I change one version number and every Miroir package moves together.
- **G6 — Release by hand.** In order to keep control of what goes public, as the maintainer, I get validated tarballs from the release pipeline and run `npm publish` myself.

## 2. Non-goals

- Running `npm publish` from CI (D4).
- A consumer-owned React shell: embedding Miroir pages and reports in another React application (D5). The shell still moves to `miroir-react` (W2), which keeps that door open.
- **The next step after this epic**: a user builds their own application package and the server deploys it, choosing by parameter which React bundle it serves in production. Today the bundle path is fixed: `server.ts` serves `path.join(__dirname, 'client')` and throws when `index.html` is missing. A separate issue owns this. W3 should keep the client directory a parameter of the router so that issue starts from a library function, not a script.
- Publishing the standalone app, Electron app, Docker image or server binary as libraries. They stay artefacts (`build-all.sh`).
- Reducing the 5.3 MB meta-model that `miroir-core` loads (#337, F3).

## 3. Decision record

| Decision | Choice | Serves | Status |
|---|---|---|---|
| D1 Package cut | **Curated scoped set (option B)** | G1, G2, G5 | Accepted |
| D2 Registry | **npmjs.org, public from the start**, no GitHub Packages pilot | G1 | Accepted |
| D3 Names | **Rename in the repo** to `@miroir-framework/*` | G1 | Accepted |
| D4 Publish step | **Manual**, the pipeline stops at validated tarballs | G6 | Accepted |
| D5 Client | **The standalone app stays the only client** for now | scope | Accepted |
| D6 Sequencing | **All work items land before any publish** | G1, G5 | Accepted |
| D7 How meta-model packages join core | open, recommend **D7-b** | G1, G5 | Open |
| D8 Local cache in react | **D8-a** (#639 D1, D2) | G1 | Accepted |
| D9 Endpoint surface mechanism | open, recommend **D9-b** | G3 | Open |
| D10 `zod` and other shared libraries | **D10-b** (#643 D1, with `react-redux`, `react-router-dom`, `formik`) | G1, G5 | Accepted |
| D11 Public API of core | open, recommend **D11-a** | G5 | Open |

D1 to D6 are recorded in the options note and in #621. The rest of this section covers the open ones.

### D7 — How `miroir-app-miroir` and `miroir-app-admin` join `@miroir-framework/core`

`miroir-core` depends on both at runtime (`package.json` `dependencies`), and both depend on `miroir-core` for types only (`devDependencies`, `"*"`). `docs/reference/release-process.md` §2 explains why this dev-only cycle is safe today. 220 files import `miroir-app-miroir` and 114 import `miroir-app-admin` (grep of `from "miroir-app-…"` under `packages/` and `scripts/`, `dist/` excluded).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D7-a. Move the folders into `miroir-core` | assets and `index.ts` become `miroir-core/src/meta-model/…`; one package in the repo | one package, no cycle at all | the type generation (`devBuild`) reads the built `miroir-app-miroir` today; it would read core's own JSON before core is built. 334 import sites change twice (rename, then path). Mixes data packages and code |
| **D7-b. Keep the packages, publish them as subpaths of core** ★ | keep `miroir-app-miroir` and `-admin` private workspace packages; core's tsup bundles them (`noExternal`) and exposes `@miroir-framework/core/meta-model` and `/admin` | the bootstrap order in `build-all.sh` and `ci/release/` stays; consumers see one package; imports inside the repo move to the subpaths mechanically | core's tarball carries the meta-model JSON (it does at runtime already); the stale-sourcemap problem that made them `external` in `miroir-core/tsup.config.ts` has to be solved another way (build them before core, as now, and drop their `.map` from the bundle input) |
| D7-c. Publish them as `@miroir-framework/meta-model` and `/admin` | two more public packages | no build change | two more names in the public contract, which D1 wanted to avoid |

### D8 — Local cache inside `@miroir-framework/react`

`miroir-react` imports `miroir-localcache-redux` only, through `src/miroir-localcache-imports.ts` (the zustand block is commented out), but lists both caches in `dependencies`. `miroir-localcache-redux` also has a `./node` subpath used by `miroir-server` (`setupMiroirDomainController`), so the redux cache is not React-only. `miroir-localcache` has an empty `src/`.

| Option | Pros | Cons |
|---|---|---|
| **D8-a. Bundle `miroir-localcache-redux` into react, expose its Node entry from `@miroir-framework/server`** ★ | one public name per side; the server gets its domain controller setup from the package it already depends on | the redux cache code ships in two tarballs (client and Node builds); the zustand experiment stays a workspace package |
| D8-b. Publish `@miroir-framework/localcache` | the cache is reusable without React | one more public name; consumers must pick a cache although only one works today |

Either way: drop `miroir-localcache-zustand` from `miroir-react` dependencies, drop the unused `miroir-example-library` dependency from both caches, and delete or keep private the empty `miroir-localcache`.

### D9 — How MCP tools and CLI commands become available for deployed applications

This is W1, the item #621 flags as larger than the options note said. Current state per surface:

| Surface | How it finds actions | Model environment it passes | Library coupling |
|---|---|---|---|
| MCP (`miroir-mcp`) | `EndpointToolRegistry.listTools` walks the Endpoints of every application of the deployment map, live, one tool per (endpoint, action) (`EndpointToolRegistry.ts`, lines ~200–235) | `domainController.getLocalCache().currentModelEnvironment(applicationUuid, map)` (`callTool`, lines ~268–284) | only in a fallback: `handleMcpAction` uses `getDefaultLibraryModelEnvironmentDEFUNCT` when no environment is passed (`mcpHandlersForEndpoint.ts:277–282`); the handler closure returned by `mcpToolEntry` takes that path |
| CLI (`miroir-cli`) | a static list: the core `instanceEndpointV1` actions plus the Library `lendingEndpoint`, filtered by its UUID `212f2784-5b68-43b2-8ee0-89b1c6fdd0de` (`commandsFromEndpoint.ts:396–415`) | always the Library environment (`commandsFromEndpoint.ts:258–268`) | built in |
| CopilotKit (`miroir-ai`) | the Library `lendingEndpoint`, by UUID (`miroirCopilotKitActions.ts:37–45`) | the Library environment, with `deployment_Library_DO_NO_USE` (`:98–104`) | built in |

How Transformers and Actions reach an application, for comparison: the application's `MetaModel` (its Entities, Endpoints, TransformerDefinitions, …) is read from the model section of its deployment, then `modelEnvironmentForApplicationModel` turns it into a `MiroirModelEnvironment` whose `endpointsByUuid` merges Miroir's endpoints with the application's (`ServerModelEnvironments.ts:141–155`). On the server `ServerModelEnvironments.forApplication` builds and caches it per deployment and drops it after a model write (#519). On a client, the local cache's `currentModelEnvironment` does the same from cached data. Nothing is registered in code: deploying the application is enough.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D9-a. Remove the Library code paths only | delete the fallback and the hard-coded `lendingEndpoint` entries; CLI keeps only core endpoints | small | the CLI and CopilotKit lose application actions entirely; G3 not met |
| **D9-b. One endpoint action catalog, three adapters** ★ | move the enumeration of `EndpointToolRegistry.listTools` (applications of the map, their well-formed endpoints, actions with a type and a payload, stable names) into a surface-neutral catalog in `miroir-core` (layer 2 or 3), keyed by application. MCP, CLI and CopilotKit become adapters that turn a catalog entry into a tool, a `commander` command or a CopilotKit action, and always get the model environment from `currentModelEnvironment` (client side, CLI, MCP over a local cache) or `ServerModelEnvironments` (server side) | same rule as Transformers: deploy the application and its actions appear on every surface; the Library becomes one deployed application among others; tool naming (`toolNameFor`) is shared | needs its own analysis: naming collisions across surfaces, access checks (#263 `McpCallContext`) for CLI, dynamic `commander` registration after the store is open, refresh when the model changes |
| D9-c. D9-b plus an opt-in on the Endpoint action | add a field on Endpoint actions listing the surfaces that expose it (no such field exists today: the Endpoint `mlSchema` definition has `name`, `version`, `application`, `description`, `transactionalEndpoint`, `definition`) | the designer decides what an agent may call | a meta-model change (`miroir-app-miroir` assets, `devBuild`), and a default to choose for existing endpoints |

D9-b first, D9-c as a follow-up if exposing every action turns out to be too broad.

### D10 — `zod` and other libraries shared across the boundary

`zod` `4.6.7` is an exact `dependency` of seven packages (core, cli, mcp, react, both caches, store-postgres). Peer ranges disagree: both caches ask for `react ^18.2.0`, `miroir-react` for `>=18.0.0`; `miroir-diagram-class` pins `@mui/material` `5.17.1` while `miroir-react` builds against `9.5.0` and accepts `>=5.17.1 <10`.

| Option | Pros | Cons |
|---|---|---|
| D10-a. Keep exact dependencies | matches the dependency policy of #326 | a consumer with another `zod` gets two copies; schemas built by one copy fail `instanceof` checks of the other |
| **D10-b. Peer dependencies for libraries whose objects cross the boundary** (`zod`, `react`, `react-dom`, `@mui/material`, `@emotion/*`), exact dependencies for the rest ★ | one copy in the consumer's tree; npm warns on a mismatch | the dependency policy needs a rule for peers (range or exact); `check_dependency_policy.py` has to learn it |

### D11 — Public API of `@miroir-framework/core`

`packages/miroir-core/src/index.ts` has 237 `export` statements. `exports` also has `"./src/*"`, used inside the repo by 16 imports of `miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js` and one of the generated type file, while `files` does not ship `src/`.

| Option | Pros | Cons |
|---|---|---|
| **D11-a. 0.x makes no stability promise; mark the supported part with `@public` TSDoc** ★ | no restructuring now; a first step towards 1.0 | consumers may depend on internals |
| D11-b. A separate `index.public.ts` entry | a hard boundary | a large audit before the first publish, against D6's goal of publishing soon after the work items |

Either way `"./src/*"` goes: the 17 imports move to named subpaths (`./testing`, `./generated`), and declaration maps either ship `src/` or are dropped.

---

## 4. Current state

### 4.1 Package inventory

31 workspace packages, all at `0.5.0-rc.1`. Six are not marked `private`: `miroir-ai`, `miroir-cli`, `miroir-env`, `miroir-mcp`, `miroir-server`, `miroir-standalone-app`. Everything a consumer needs first is private: `miroir-core`, `miroir-app-miroir`, `miroir-app-admin`, `miroir-react`, `miroir-localcache-redux`, all `miroir-store-*`. On npmjs.org, `@miroir-framework/jzod` exists (published from the sibling repo); `@miroir-framework/core` and the unscoped `miroir-core`, `miroir-react`, `miroir-server` are free (HTTP 404 on 2026-10-31).

Target mapping (D1, D7-b, D8-a):

| Published | Workspace sources | Notes |
|---|---|---|
| `@miroir-framework/core` | `miroir-core`, `miroir-app-miroir`, `miroir-app-admin` | subpaths `./meta-model`, `./admin`, `./model-validation-fs`, `./ml-to-ts` |
| `@miroir-framework/react` | `miroir-react`, `miroir-localcache-redux` (browser entry), shell from `miroir-standalone-app` (W2) | |
| `@miroir-framework/server` | new (W3), `miroir-localcache-redux/node` | |
| `@miroir-framework/store-postgres`, `-filesystem`, `-indexeddb`, `-mongodb`, `-bundled` | `miroir-store-*` | lower-case `indexeddb` for the published name |
| `@miroir-framework/mcp`, `@miroir-framework/cli` | `miroir-mcp`, `miroir-cli` | `cli` keeps its `bin` |
| `@miroir-framework/env` | `miroir-env` | needed by `cli`, `mcp` and the server binary to read `environments/*.json`; decide in W8 whether it is public or bundled into `server` |
| `create-miroir-app` | new (W9), from `miroir-sandbox` | unscoped so `npm create miroir-app` works |
| stay private | `miroir-ai`, `miroir-diagram-class`, `miroir-localcache-zustand`, `miroir-localcache`, `miroir-sandbox`, `miroir-homepage`, `miroir-designer`, `miroir-runtime`, `miroir-example-*`, `miroir-fixture-*`, `miroir-standalone-app*`, `miroir-server` (binary) | `miroir-ai` is not in the epic's table; it can join later once W1 frees it from the Library |

### 4.2 Build outputs (aligned)

All library packages build ESM with tsup. `miroir-core` emits one minified `dist/index.js` (1.85 MB) and writes declarations with `tsc` and declaration maps in `onSuccess`. `miroir-react` emits one module per source file with `splitting: true` and `"sideEffects": false` (#592), with React, MUI, Emotion and CodeMirror external. These shapes suit a library. Missing: an `exports` map on the store packages, `sideEffects` everywhere but `miroir-react`, `engines`, `repository`.

### 4.3 Runtime coupling to the Library example (misaligned, W1)

See D9. In addition, `miroir-localcache-redux` and `miroir-localcache-zustand` list `miroir-example-library` in `dependencies` without importing it.

### 4.4 App shell in the standalone app (misaligned, W2)

`miroir-standalone-app/src/miroir-fwk/4_view` still holds 59 modules (15 895 lines), among them `RootComponent.tsx` (963 lines), `AppBar.tsx` (871), `PageDispatcher.tsx`, `ErrorPage`, the `routes/` pages and `reportSectionRenderers.tsx`. `miroir-sandbox` reaches five of them through the `@miroir-app` alias of its `vite.config.js` (`RootComponent`, `ErrorPage`, `PageDispatcher`, `services/index`). #592 §5.2 lists why they did not move: the cycle between report sections, routes and `4-tests/componentTests`, Electron helpers in `RunnerView`, and heavy libraries kept lazy (ag-grid, d3, `diff`). #592 §5.3 slice 4 ("break the reports cycle between `4_view` and `4-tests/componentTests`") is the next step. Host-specific modules: `services/ElectronIpcProxy.ts` (Electron IPC), `auth/authTransport.ts` and `routes/ai/*` (`@copilotkit/*`). They stay in the app or become services the host injects.

### 4.5 Server as a script (misaligned, W3)

`miroir-server/src/server.ts` (939 lines) runs at module level, top to bottom: parse CLI arguments and secrets (lines ~154–230), load the environment (`loadEnvironment`, ~230–270), build the Express `app` with CORS and body parser (~292–300), auth status and `/capabilities` routes (~324–340), static assets (~345–385), loggers, `MiroirContext`, `PersistenceStoreControllerManager`, `setupMiroirDomainController` (~400–440), open deployments and secrets (~441–601), the REST loop `for (const op of restServerDefaultHandlers)` (~623), login and password routes (~721–790), MCP app with `EndpointToolRegistry` and `setupMcpServer` (~796–830), TLS, the SPA from the fixed `client` folder (~856), and `listen`. It imports the four Node store packages directly (lines 90–93). The REST handlers themselves already live in `miroir-core` (`RestServer.ts`, `restServerDefaultHandlers`).

### 4.6 Startup code repeated per host (misaligned, W4)

`miroirCoreStartup()` is called from six hosts: `miroir-standalone-app/src/index.tsx`, `miroir-sandbox/src/index.tsx`, `miroir-server/src/server.ts`, `miroir-standalone-app-electron/src/ipcServerSetup.ts`, `miroir-cli/src/platform.ts`, plus two model extraction scripts. Each repeats: start the loggers, register store sections on `ConfigurationService.configurationService`, build `MiroirContext`, a REST client (stub or real), `PersistenceStoreControllerManager`s and the domain controller. `miroir-cli/src/startup/setup.ts` (113 lines) and `miroir-mcp/src/startup/setup.ts` (109 lines) are near copies of each other (`setupMiroirPlatform`). They build the same objects, but the CLI version also returns `domainControllerForServer` and `restClientStub` (`miroir-cli/src/startup/setup.ts:102–110`), which `miroir-cli/src/platform.ts:75–89` uses; the MCP version keeps the server-side controller local. The shared function starts from the CLI version and keeps its larger return shape.

### 4.7 Process-wide singletons (risk, W6)

`ConfigurationService.configurationService` is a `static` field (`ConfigurationService.ts:107`). `MiroirLoggerFactory` keeps its registrations in static fields (`registeredLoggersToStart`, `preStartLoggers`, `activityTracker`, `eventService`, lines 88–98). `TransformerContext` and `LoggerContext` too. Store packages register themselves on the `ConfigurationService` of the `miroir-core` copy they import. Two copies of core in a consumer's `node_modules` (a partial upgrade, or an exact pin that npm cannot dedupe) means stores register on one copy and the domain controller reads the other: the failure is "no store factory for …", far from its cause.

### 4.8 Release pipeline (partly aligned, W10)

`ci/release/release_version.py --apply` versions with Lerna, rewrites internal `"*"` ranges to the exact product version, builds in runtime-dependency layers, runs `npm pack` and installs the tarballs in a throwaway consumer (`tarballs.py`, `validate_layer_consumer`). It classifies `private` packages as bundle-only and skips their consumer check, so today `miroir-core` is never install-checked. It has no publish step. `ci/artefacts/` is a placeholder.

## 5. Work items and dependencies

Item numbers match the checklist of #621. "Needs" lists hard prerequisites; the rest can run in parallel.

| # | Item | Needs | Decisions | Size | Own analysis |
|---|---|---|---|---|---|
| W1 | Endpoint action catalog for MCP, CLI, CopilotKit | none | D9 | large | yes |
| W2 | Shell and routes to `miroir-react`, sandbox without alias | #592 slice 4 | none | large | yes (next #13 slice) |
| W3 | Server library (router factory, stores and client folder as parameters) | W4 server half helps | none | medium | yes |
| W4 | One startup call per side (client, Node) | none | D8 | medium | short |
| W5 | Manifest hygiene, peer ranges | D10 | D10 | small | no |
| W6 | Detect two copies of core | none | none | small | no |
| W7 | Public API stance of core, remove `"./src/*"` | none | D11 | small (D11-a) | no |
| W8 | Rename to `@miroir-framework/*`, merge per D7/D8 | W1, W2, W5, W7 | D3, D7, D8 | large, mechanical | short |
| W9 | `create-miroir-app` template and out-of-workspace consumer test | W3, W4, W8 | none | medium | no |
| W10 | Release pipeline ready to publish (tarballs, docs for manual `npm publish --provenance`) | W8, W9 | D4 | small | no |

Why W8 waits: renaming touches every import (`miroir-core` alone is imported from 655 files, `miroir-react` from 155, the stores from 151 together), plus `build-all.sh`, `ci/release/`, `scripts/nonreg-manifest.json`, eslint layer rules, docs and logger names built from `packageName`. Doing it after W1 and W2 avoids renaming code that is about to move or disappear, and doing it before W9 means the template is written against the final names.

Critical path: W2 → W8 → W9 → W10. W1 runs beside it and must finish before W8.

## 6. Key reuse

| Piece | Location | Used by |
|---|---|---|
| Live per-application endpoint enumeration | `EndpointToolRegistry.listTools` (`miroir-mcp/src/tools/EndpointToolRegistry.ts`) | W1 |
| Tool naming | `toolNameFor`, `sanitizeToolNamePart` (`miroir-mcp/src/tools/toolNameFor.ts`) | W1 |
| Per-deployment model environment, server | `ServerModelEnvironments.forApplication`, `modelEnvironmentForApplicationModel` (`miroir-core/src/4_services/ServerModelEnvironments.ts`) | W1, W3 |
| Per-application model environment, client | `LocalCacheInterface.currentModelEnvironment` | W1 |
| Access check for tool calls | `McpCallContext`, `authorizeDeployment` (#263) | W1 (CLI) |
| REST handlers | `restServerDefaultHandlers` (`miroir-core/src/4_services/RestServer.ts`) | W3 |
| Platform setup | `setupMiroirPlatform` (`miroir-cli/src/startup/setup.ts`, copy in `miroir-mcp`) | W4 |
| Smallest client | `miroir-sandbox/src/index.tsx` | W2, W4, W9 |
| Release tree, pack, consumer install | `ci/release/release_lib/{plan,lerna_ops,tarballs}.py` | W8, W10 |
| Dependency policy check | `scripts/check_dependency_policy.py` | W5 |
| Layering lint | `eslint-rules/miroir-layers*` | W8 (names) |

## 7. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Name squatting between now and the first publish | `@miroir-framework` is an npm scope already owned, so names under it are safe; `create-miroir-app` is unscoped | publish a placeholder `create-miroir-app` by hand early, or use `@miroir-framework/create-app` (`npm create @miroir-framework/app`) |
| The meta-model and core in one 7 MB tarball | slow installs, large browser bundles | out of scope (#337 F3); tarball size is reported by `npm pack --json` and can be guarded in W10 |
| `import.meta.env` in published code | `miroir-core/src/tools.ts` reads `MIROIR_IS_SANDBOX` (line 34) and `MODE` (line 66) from it; both are `undefined` outside Vite, so a consumer's non-Vite build silently gets the defaults | #604 D12 pattern (already applied in `miroir-react/src/tools/progressiveRenderConfig.ts`): read `globalThis.process?.env` at call time, or take the value as a parameter |
| The rename breaks open branches | merge conflicts on every import line | do W8 in one PR at a quiet moment, with a script (Python, per AGENTS.md) that open branches can rerun |
| Sourcemaps pointing at `src/` | broken "go to definition" for consumers | ship `src/` in `files` for core and react, or drop declaration maps from the tarball (D11) |

## 8. Questions to settle in the item analyses

1. W1: are CLI commands registered at start-up from the open deployments, or listed lazily (`miroir <app> <endpoint> <action>`)? The second avoids opening stores before `--help`.
2. W3: does `@miroir-framework/server` own TLS and `listen`, or only return a router and leave the HTTP server to the host? Returning a router fits the next step (serving a chosen bundle) better.
3. W8: does `@miroir-framework/env` become public, or does `server` bundle it?
4. W9: is the template's default store filesystem (no database needed) or IndexedDB in the browser with the bundled store, as the sandbox does?

The implementation plan is not written yet; each item's issue gets its own `tdd-implementation-plan.md`.
