# 645 — Warn when two copies of miroir-core run in one process

> `miroir-core` keeps its configuration service and its logger registry in module-level singletons. A project whose install or bundle holds two copies of core gets two of each, and the failure appears far from its cause. This analysis settles how a copy notices another one, how it reports it, and how a test proves it, before core is published as `@miroir-framework/core` (#621).

Related issue: https://github.com/miroir-framework/miroir/issues/645
Parent issue: #621 (work item "Detect two copies of core", epic plan I5 slice 1, goal G5)
Prerequisites: #643 (PR #644, manifests and peers: `zod` and the React libraries are peers, `sideEffects: false`), #639 (PR #642, store startups take the configuration service as a parameter)
Related analyses: [`../621-FEATURE-npm-packages/analysis.md`](../621-FEATURE-npm-packages/analysis.md) (G5), [`../643-BUILD-manifest-hygiene/analysis.md`](../643-BUILD-manifest-hygiene/analysis.md) (D1 peers, D6 `sideEffects`), [`../639-REFACTOR-startup-calls/analysis.md`](../639-REFACTOR-startup-calls/analysis.md)
Key sources: [`ConfigurationService.ts`](../../../packages/miroir-core/src/3_controllers/ConfigurationService.ts), [`MiroirLoggerFactory.ts`](../../../packages/miroir-core/src/4_services/MiroirLoggerFactory.ts), [`PreStartLogger.ts`](../../../packages/miroir-core/src/4_services/PreStartLogger.ts), [`startup.ts`](../../../packages/miroir-core/src/startup.ts), [`tsup.config.js`](../../../packages/miroir-core/tsup.config.js), [`scripts/check_bare_console.py`](../../../scripts/check_bare_console.py)

**Status:** the epic fixes the reaction ("warn at startup when a second instance registers") and the plan names the mechanism (a stamp under `Symbol.for("miroir-core")` on `globalThis`). The other decisions are technical and recorded here. The user asked to proceed with the next epic items without further confirmation. Revision history at the end.

**Baseline:** `_integration` at `05637625b` (after PR #644), all packages at `0.5.0-rc.1`.

---

## 1. Goals

- **G1 — A duplicated install says so.** In order to fix a broken install in minutes rather than debug "no store factory", silent `instanceof` failures or loggers that never start, as an application developer whose project resolved two copies of `miroir-core`, I see a warning when the second copy loads. It names each copy's version and location, and tells me how to check (`npm ls miroir-core`).
- **G2 — No false alarm in development.** In order to trust the warning, as a Miroir developer, I see nothing when one copy is evaluated again from the same file by a dev tool: Vite dev and HMR, vitest module resets (`vi.resetModules`), several test files in one worker.
- **G3 — The record is inspectable.** In order to diagnose an install from a script or a test, as a maintainer, I can read which copies loaded, with their versions and locations, from `globalThis`.

## 2. Non-goals

- Making a duplicate a hard error, or an opt-in failure mode: decided once the warning has been in use (issue out of scope).
- Preventing duplicates in a consumer's install: peers and exact internal pins (#643, lockstep versions) do that. This issue only detects what gets through.
- Detecting two copies of other Miroir packages (`miroir-react`, the local cache). Their React contexts and Redux store fail in their own way. The epic only names core's singletons.
- A CLI or MCP diagnostic command that prints the record (can follow, reading G3's record).

## 3. Decision record

| Decision | Choice | Goals | Status |
|---|---|---|---|
| D1 Where a copy records itself | **when `ConfigurationService.ts` is evaluated** | G1 | Accepted |
| D2 What makes a copy | **every evaluation, except under dev tooling, where one location is one copy** | G1, G2 | Accepted |
| D3 How it reports | **the copy's pre-start logger, at WARN** | G1 | Accepted |
| D4 The record | **`globalThis[Symbol.for("miroir-core.instances")]`, a list of `{ version, location }`; nothing new exported** | G3 | Accepted |
| D5 Proof | **a core vitest that starts fresh Node processes on two real copies of the built core** | G1, G2 | Accepted |

### D1 — Where a copy records itself

| Option | Pros | Cons |
|---|---|---|
| **A. Top-level statement of `ConfigurationService.ts`** ★ | runs in every copy that anything uses: the store's copy registers even though nobody calls its startup | a top-level effect in a package that declares `sideEffects: false` |
| B. Inside `miroirCoreStartup()` | explicit, no top-level effect | only the host calls it (`startMiroirPlatform`, `startup.ts:6`); a store's or local cache's own copy never runs it, so the second copy stays silent |
| C. In each singleton (`ConfigurationService` and `MiroirLoggerFactory`) | covers a copy that only uses the logger | both live in the same bundle file (`dist/index.js`, §4.2): one record per copy is enough |

`sideEffects: false` (#643 D6) lets a bundler drop a module whose exports are unused. That only matters for source-level consumers (the vite aliases of §4.3, development only). A published copy is one module, `dist/index.js` (§4.2): a bundler that keeps any export of it keeps its impure top-level call, which the minified build keeps as a plain statement after the singleton (`…new Kd};Fx(wa.version,import.meta.url)`). So the record covers every singleton of §4.1, not only the configuration service, whichever of them the copy uses.

### D2 — What makes a copy

| Option | Pros | Cons |
|---|---|---|
| A. The version | simple | two copies of the same version (the common duplicated install under lockstep pins) look like one |
| B. The location: `import.meta.url` without query or hash | two installed copies have two paths; silent on HMR and vitest re-evaluation | a bundler that puts both copies in one output file gives them the same URL: the duplicate is missed |
| **C. Every evaluation is a copy; under dev tooling, one location is one copy** ★ | catches the one-bundle case in production and in Node; still silent on HMR and vitest | needs to know it runs under dev tooling |

Outside dev tooling, an ES module is evaluated once per module-map key (its URL, query included) per loader. A second evaluation of `ConfigurationService.ts` means a second module instance with its own `ConfigurationServiceInner`, whatever the location. Even a query-string import such as `index.js?x` produces one, and so does a bundle chunk holding two copies. Re-evaluating the same file is benign only where tooling replaces modules on purpose:
- Vite HMR, where `import.meta.hot` is defined;
- vitest, where `process.env.VITEST` is set: it resets modules between test files and on `vi.resetModules` (one use, `componentTestMode.286.phase4.unit.test.tsx`).

Under these, D2 falls back to B. Both are read without assuming Node: `import.meta.hot`, and `globalThis.process?.env?.VITEST` (browsers have no `process`). Vite dev gives a hot context to every served module whose source mentions `import.meta.hot`, which `ConfigurationService.ts` does, on its first evaluation as well as on HMR: all of Vite dev uses the location rule (accepted miss, §6). The location is kept in every record entry for the message, without query or hash (Vite adds `?t=…`). When `import.meta.url` is undefined (a CommonJS rebundle), the location is `"unknown"`.

This changes one acceptance criterion of the issue as first written: the same file imported with a query string prints nothing only under dev tooling. In plain Node, `import("dist/index.js")` then `import("dist/index.js?copy=2")` gives two distinct module instances (checked during review), so two split singletons: D2 warns, and the issue text is updated.

### D3 — How it reports

| Option | Pros | Cons |
|---|---|---|
| A. Bare `console.warn` | always visible | `scripts/check_bare_console.py` (#237) forbids it in `src/`; needs an allowlist entry |
| **B. The copy's pre-start logger (`MiroirLoggerFactory.getPreStartLogger`), at WARN** ★ | the #43 mechanism for "before loggers start": prints to the console, tagged, at WARN; no allowlist | the line has the logger format rather than a bare message |
| C. Throw | impossible to miss | turns a recoverable situation (a tool that only reads types or schemas, a test) into a crash; the epic asks for a warning |

`ConfigurationService.ts` already holds its pre-start logger (`log`, line 15). The guard runs while its own copy is being evaluated, so that copy's `MiroirLoggerFactory` is fresh and the logger is unbound: it prints through `console.warn` at WARN, and no log configuration can raise its fallback above WARN (§4.4). The copy evaluated second prints the warning, whichever it is: depending on import order, that can be the host's copy.

### D4 — The record

The key is `Symbol.for("miroir-core.instances")`. `Symbol.for` returns the same symbol in every copy, so all copies share one list. Each entry is `{ version, location }`, with the version taken from core's `package.json`, as `startup.ts:1` does. An exported getter is not added. Any copy would export it, and it would read the same global list, so it adds surface without adding information (#621 D11-a: core's public API is not widened without need).

### D5 — Proof

Two real copies need two module instances of the built core. The meta-language cannot express that, so a MiroirTest does not fit, and a vitest file in core is the vehicle.
- It copies `dist/index.js` into `packages/miroir-core/tests/tmp/645-a/` and `…/645-b/`. eslint ignores `**/tmp/**` (`eslint.config.mjs:48`), git ignores `tmp*/` (`.gitignore:11`), and vitest collects only `*.test.*` files under `tests/`. The copies are removed in `afterAll`. Their bare imports resolve through `packages/miroir-core/node_modules` and the root `node_modules`; `"type": "module"` comes from the ancestor `packages/miroir-core/package.json`.
- It runs `node --input-type=module` in a fresh process for each case, with the `VITEST*` variables removed from the child's environment: vitest sets `VITEST=true` in its process, and children inherit it, which would switch D2 to the location rule.
- Cases: one copy, silent; two folders, a warning naming both locations; the same file imported again with `?x`, a warning; the same with `VITEST=true` set on purpose, silent.
- The version is inlined at build time, so both copies report the same version. The test asserts both locations and the shared version.
- The function itself (record, D2 rules, message) is also tested in process, with an injected `globalThis` stand-in, dev-tool flag and warn sink.

## 4. Current state

### 4.1 The singletons

| Singleton | Where | What a second copy splits |
|---|---|---|
| `ConfigurationService.configurationService` | `ConfigurationService.ts:113–115` (`new ConfigurationServiceInner()`) | store section and admin factories, package configurations, test implementation, React component and report test runners |
| `MiroirLoggerFactory` static state | `MiroirLoggerFactory.ts:87–97` (`registeredLoggersToStart`, `preStartLoggers`, `activityTracker`, `eventService`) | logger registrations (46 files of the five stores: filesystem 10, indexedDb 9, postgres 13, mongodb 9, bundled 5) and the activity tracker |
| `miroirActionImplementations` | `ActionImplementations.ts:50`, `registerMiroirActionImplementation` at 143 | `miroirCoreStartup` (`startup.ts:9`) registers `handleAction_runMiroirTestAction` on the host's copy only |
| `processSecrets`, `userSecrets` | `SecretStore.ts:20,22` | secrets set through one copy are missing from the other (`miroir-ai`) |
| `performanceMetrics` | `performanceMetrics.ts:23` | metrics |

Since #639, a store's startup receives the host's configuration service as a parameter (`StoreSectionStartup`, `ConfigurationService.ts:111`). Its factories therefore land on the host's copy even when the store resolved another copy. What still splits:
- the store's loggers;
- `instanceof` checks against core classes, such as `instances instanceof Action2Error` in `BundledModelStoreSection.ts:246` and `BundledDataStoreSection.ts:210`. These quietly return false for objects built by the other copy.
- any code reading `ConfigurationService.configurationService` directly. Outside core, that is 16 non-test files (14 in `src/`, 2 in `scripts/`; 75 with tests), including `startMiroirPlatform.ts` (4 reads) and `createMiroirServerApp.ts` (3 reads).

### 4.2 Core's bundle files

`tsup.config.js` builds three entries with `splitting: false`: `index`, `model-validation-fs`, `ml-to-ts`. Only `dist/index.js` contains the singletons. A search of the built files for `registerStoreSectionFactory` and `registeredLoggersToStart` finds them in `index.js` only (2 and 3 matches; 0 in the 8 KB `model-validation-fs.js` and the 361-byte `ml-to-ts.js`). One install of core is one copy.

### 4.3 How the repo resolves core today

- Packages with a `miroir-core` alias to `src/index.ts` in their vite config: core, the three `miroir-app-*`, the four `miroir-example-*` with tests.
- Core's own tests import `miroir-store-bundled` (3 imports) and `miroir-store-postgres` (1). A probe test that imported both and read the record saw one entry, at `src/3_controllers/ConfigurationService.ts`: vitest inlines the workspace packages and applies the alias to them too.
- The full core unit run with the guard in place: 3278 tests passed, 1 skipped.
- The full `nonreg:filesystem` run with a probe that logs every duplicate to a file: see §4.5.

### 4.4 Logging before loggers start

`MiroirLoggerFactory.getPreStartLogger(name)` returns a `PreStartLogger` (`PreStartLogger.ts:28`). Until `bind` is called, it prints entries at or above its fallback level to the console (`PreStartLogger.ts:63–72`), formatted as `[time] LEVEL logger ### message`. The fallback comes from `resolvePreStartDefaultLevel` (`MiroirLoggerFactory.ts:22–38`), which returns WARN, INFO or DEBUG only, so a WARN entry always prints. `registerLoggerToStart` on a factory that has not started takes the unbound path (`MiroirLoggerFactory.ts:145–160`). `ConfigurationService.ts:14–16` takes one and replaces it with the started logger once `registerLoggerToStart` resolves.

### 4.5 Probe on the repo's own runs

The guard is built into core with a temporary probe that appends every evaluation (process arguments, working directory, location, dev-tool flag, and whether D2 counts a duplicate) to a file, under `npm run nonreg:filesystem`. Result, after `./build-all.sh` (a first run used the location-only rule, which cannot see same-URL duplicates, and was replaced):

| Run | Processes probed | Evaluated core more than once | Duplicates by D2 |
|---|---|---|---|
| core unit tests and full `nonreg:filesystem` (123 steps, all passed) | 398 | 124, all under vitest at one location (`dist/index.js` 320 evaluations, `src/…/ConfigurationService.ts` 95) | 4: the guard test's own two-copy and query-string cases, run once by the core unit tests and once by its nonreg step |

Browsers have no `process`: the production self-test (`MIROIR_ENV=self-test`, release server, Chromium) was run with a listener on the page console. Of 2517 console messages, none was the warning, and 1227 of 1227 tests passed. No repo host loads two copies.

## 5. Key reuse

| Piece | Location |
|---|---|
| Pre-start logger | `MiroirLoggerFactory.getPreStartLogger`, `PreStartLogger.ts` |
| Core version | `packages/miroir-core/package.json`, imported as `startup.ts:1` does |
| Fresh-process test pattern | `node --input-type=module` from a vitest, as the release tests spawn `npm` |
| Nonreg step format | `scripts/nonreg-manifest.json`, e.g. `unit-643-package-manifests` |

## 6. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| A repo host already loads two copies | the warning appears in nonreg or the app | §4.5 probe; each case explained and fixed before the PR (issue AC) |
| Dev-tool detection misses a tool | a false warning on re-evaluation | only Vite and vitest re-evaluate core in this repo; others fall back to "every evaluation", which over-reports rather than hides |
| Accepted miss: Vite dev | two copies at the same URL with different `?v=` hashes are not reported in development | the location rule still reports copies at different paths; production builds and Node use "every evaluation" |
| Accepted miss: vitest | a workspace `dist` inlined by vite-node and also loaded natively by an externalized dependency gives two instances at one URL, silenced | the §4.5 probe records every evaluation, so such a case shows up there |
| A bundle drops the top-level call (`sideEffects: false`) | no record for a copy | the published copy is one module whose top-level call is kept with any export (D1); only source-level aliases, in development, could drop it |

## Revision history

- v2 (2026-11-01): after the adversarial review: D5 removes `VITEST` from the children and lists its cases; copies under `tests/tmp/`; more singletons in §4.1 and D1 restated on the single-module basis; D2 wording, `globalThis.process`, accepted misses; D3 downside removed; counts and lines fixed; AC change recorded; §4.5 rerun with D2.
- v1 (2026-11-01): first version.
