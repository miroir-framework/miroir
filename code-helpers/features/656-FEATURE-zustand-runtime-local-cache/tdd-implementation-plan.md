# Issue #656 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController, both local caches and the emulated server on the
> `test-filesystem` environment, through the public startup calls (`startMiroirNode`,
> `startMiroirClient`), `DomainController.currentLocalCacheInfo()` and the React provider. No mocks.
> The tracer bullet proves a Node process started with `localCache: "zustand"` runs its
> DomainController on Zustand, loaded on demand.
>
> **Execution model:** the epic's standing workflow (#621, user's instruction for the slices of #645–#652):
> one commit per slice on the working branch, pushed. Each slice ends with its Validation commands;
> on success its Realization is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/656
Prerequisite: [`../652-BUILD-bundle-meta-model-and-local-cache/`](../652-BUILD-bundle-meta-model-and-local-cache/) ✅
Working branch: `claude/656-zustand-runtime-choice` (from `origin/aba`)

**Resume note:** plan v2 (adversarial review applied); no slice started.

---

## Scope

- G1 — pick `redux` or `zustand` in the startup call (`startMiroirClient`, `startMiroirNode`) without editing framework sources.
- G2 — one local cache copy per page or process (D7: store, persistence, provider; RTK and reselect stay).
- G3 — `nonreg --local-cache zustand` runs the UI tests and the CLI, MCP, server, ai and env test platforms on Zustand.

Not in this plan: a config default for the choice (D1-b, later); the selectors in core (D6-b, follow-up issue, opened in Slice 5); publishing the zustand package (D3); redux's `"none"` access mode, which neither the contract nor zustand offers (R10: the contract is typed on `"local" | "remote"`, redux keeps `"none"` outside it); `miroir-localcache/tests/*` (R7: unit tests of the redux package, stay redux); `EndpointToolRegistry.ts:80-81` (R7: `getInnerStore().subscribe` works on both stores, unchanged).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Each local cache names itself; the contract and the test switch in core | ✅ | `currentLocalCacheInfo().implementation` on both caches; each cache's `node.ts` `satisfies LocalCacheModule` (tsc) |
| 1 | Tracer: a Node process starts on Zustand | ⬜ | cli `startMiroirNode.integ` on both caches |
| 2 | Every Node test platform follows `MIROIR_TEST_LOCAL_CACHE` | ⬜ | mcp, server-library, ai, env tests on both caches |
| 3 | A React client starts and renders on Zustand | ⬜ | react `startMiroirClient.integ` on both caches; standalone bundle guard |
| 4 | The standalone app's UI tests run on the chosen cache | ⬜ | `nonreg --local-cache zustand --scope smoke,ui,localcache` |
| 5 | Docs, full nonreg on both caches, cleanup, AC | ⬜ | `nonreg:filesystem` and `nonreg:zustand` |

---

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| D1 | Startup option `localCache?: LocalCacheKind` (`"redux" \| "zustand"`, default `"redux"`) on `startMiroirNode` (`@miroir-framework/server/startup`) and `startMiroirClient` (react) | G1 |
| D2 | Core declares `LocalCacheKind`, `LocalCacheModule` (`setupMiroirDomainController` on `"local" \| "remote"`, `RestPersistenceClientAndRestClient`, `kind`); each cache's `node.ts` exports `localCacheModule … satisfies LocalCacheModule` (the cache's build enforces the contract). React declares the binding (`Provider`, `useSelector`, `shallowEqual`); `LocalCacheProvider` takes the binding the platform carries | G1, G2 |
| D3 | Separate entries, never one module holding both: server `./startup` (the dispatching `startMiroirNode`, `loadLocalCacheModule`) imports `@miroir-framework/server/startup/redux` or `/startup/zustand` (external self-references, each bundling one cache); react the same with `./local-cache/redux`, `./local-cache/zustand` | G2 |
| D4 | `localCacheKindFromEnvironment(env)` in core reads `MIROIR_TEST_LOCAL_CACHE`; every test platform and UI helper passes its result | G3 |
| D5 | Core `5_setup` holds the implementation-free startup: `startMiroirPlatformWith(module, config, options)`, `startMiroirNodeWith(module, config, options)`; marked `@public`, in `core-public-api.md` | G1 |
| D6 | Gaps the zustand runs expose are fixed in the zustand package in this issue | G3 |
| D7 | G2 = one local cache copy; checked by the bundle report: no `redux-saga` module eager on a zustand page, no zustand module eager on a redux page | G2 |
| D8 | The UI keeps one static selector set, redux's selector modules (with `selectDomainStateFromlocalCacheEntityZone` moved into the selectors file, so `LocalCacheSlice`'s `createSlice` stays out) | G1, G2 |
| D9 | React's root keeps provider, hooks, selectors, types; implementation classes move to `./local-cache/redux` and `./local-cache/zustand`; `./local-cache` removed; importers migrate in the same slice | G1, G2 |
| D10 | `useCurrentModelEnvironment.unit`, `ListTransformerPanel.unit` build their store through the chosen implementation | G3 |

---

## Allocated keys

- Core: `LocalCacheKind`, `LocalCacheModule`, `localCacheKindFromEnvironment` (`src/0_interfaces/4-services/LocalCacheModule.ts`, `src/1_core/localCacheKind.ts`), `LocalCacheInfo.implementation`, `startMiroirPlatformWith`, `startMiroirNodeWith`, the `MiroirPlatform*` types (`src/5_setup/startMiroirPlatform.ts`).
- Caches: `localCacheModule` in each `node.ts`; zustand gains `./node` (no React).
- Server: `./startup` (`startMiroirNode`, `loadLocalCacheModule`), `./startup/redux`, `./startup/zustand`.
- React: `LocalCacheBinding`, `LocalCacheProvider({ binding, store })`, `./local-cache/redux`, `./local-cache/zustand`.
- Tests: `scripts/tests/test_local_cache_choice.py`; assertions added to existing integration tests (no issue directory).
- No model element, no MiroirTest suite: process wiring, not reachable through ML (vitest exception, as #639).

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Guards | `MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests -q` |
| Build before a test of another package (vitest resolves `dist`) | `npm run build -w <pkg>…` |
| A test on each cache | `for c in redux zustand; do MIROIR_TEST_LOCAL_CACHE=$c MIROIR_ENV=test-filesystem npm run testByFile -w <pkg> -- <file>; done` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared [--local-cache zustand] --scope smoke,<scopes>` |
| Core public API | `python scripts/core_public_api.py --write`, then `pytest scripts/tests/test_core_public_api.py` |
| Bundle guards | `npm run build -w miroir-standalone-app -w miroir-standalone-app-electron`, then the two `check_bundle_policy.py` commands of `pr-checks.yml` |

---

## Slice 0 — Each local cache names itself; the contract and the test switch in core

**Status:** ✅ done

### RED

- `scripts/tests/test_local_cache_choice.py`: the UI sources importing `react-redux`, `ReactReduxContext` or a local cache package outside the switch file are exactly `MlEnumEditor.tsx`, `MlElementEditorHooks.ts`, `useSelectedApplicationMiroirTestSuiteRegistries.ts`, `localCacheImplementation.ts` (an allowlist later slices shrink to empty); `localCacheKindFromEnvironment` maps unset/`redux`/`zustand` and rejects other values (ported from `localCacheImplementation.unit.test.ts`).
- The existing local cache monitor tests (nonreg `unit-localCache-monitor`, `unit-localCache-monitor-zustand`) assert `currentLocalCacheInfo().implementation` is `"redux"` / `"zustand"`: fails (no field).

### GREEN

- Core: `LocalCacheKind`, `LocalCacheModule`, `localCacheKindFromEnvironment`, `LocalCacheInfo.implementation`; each `LocalCache` fills it.
- Each cache's `node.ts` exports `localCacheModule = { kind, setupMiroirDomainController, RestPersistenceClientAndRestClient } satisfies LocalCacheModule`; zustand gets `src/node.ts` and `./node` (no React, R11).
- Zustand manifest aligned with the published-set rules it will meet as a bundled package (R8): `react` peer `>=18.2.0`, `sideEffects: false`, unused `lodash`/`zod` removed, `use-sync-external-store` handled.
- Standalone `localCacheImplementation.ts` uses core's helper; its `LocalCacheImplementation` union becomes `LocalCacheKind` (R9).

### Refactor checkpoint

- The test switch has one parser (core).

### Validation

```bash
npm run build -w @miroir-framework/core -w miroir-localcache-redux -w miroir-localcache-zustand
python -m pytest scripts/tests/test_local_cache_choice.py -q
npx tsc --noEmit --skipLibCheck -p packages/miroir-localcache-zustand/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,localcache
```

### Realization

- RED seen: both monitor tests failed on `currentInfo().implementation` before the field existed.
- Core: `LocalCacheKind` (`@public`, the startup option), `LocalCacheModule`, `LocalCachePersistenceStoreAccessParams` (`0_interfaces/4-services/LocalCacheModule.ts`); `localCacheKindFromEnvironment(env)` and `localCacheKindFromValue` in `1_core/localCache/localCacheKind.ts`. The environment is a required parameter: the core lint (`miroir/global-environment`) forbids reading `process.env` outside a composition root. Its unit test is core's `tests/1_core/localCacheKind.unit.test.ts` (vitest, not Python: the parser is TypeScript).
- Each cache's `node.ts` exports `localCacheModule … satisfies LocalCacheModule`; redux's `setupMiroirDomainController` takes `MiroirContextInterface`. Zustand gained `src/node.ts` and `./node`; its index re-exports it plus the React hooks.
- Zustand manifest: `react >=18.2.0`, `sideEffects: false`, `lodash` and `zod` removed, `use-sync-external-store` 1.6.0 declared (needed by `zustand/traditional`).
- Pulled forward from Slice 4: zustand's `useSelector` makes one hook call (`useStoreWithEqualityFn` with an optional equality function); the 2 `rules-of-hooks` suppressions are pruned.
- Standalone `localCacheImplementation.ts` returns a core `LocalCacheModule`; zustand is loaded from `miroir-localcache-zustand/node`.
- `scripts/tests/test_local_cache_choice.py`: allowlist of 4 UI sources.
- Validation: core, redux, zustand built; guards 559 passed; lint 0; `nonreg:filesystem --scope smoke,localcache` 22/22.

---

## Slice 1 — Tracer: a Node process starts on Zustand

**Status:** ⬜ pending

### RED

- `packages/miroir-cli/tests/startMiroirNode.integ.test.ts`: passes `localCache: localCacheKindFromEnvironment(process.env)` and asserts `domainController.currentLocalCacheInfo().implementation` equals it. With `MIROIR_TEST_LOCAL_CACHE=zustand`: fails (option ignored).

### GREEN

- Core `5_setup/startMiroirPlatform.ts`: `startMiroirPlatformWith(module, …)`, `startMiroirNodeWith(module, …)`, moved from `miroir-localcache-redux/src/startMiroirPlatform.ts`; `@public`; `STARTUP_NAMES` and `core-public-api.md` updated (`core_public_api.py --write`).
- Server library: `src/startup.ts` = `startMiroirNode(config, { localCache, … })` + `loadLocalCacheModule(kind)`, importing `@miroir-framework/server/startup/redux` or `/zustand` (self-references, external); `src/startup-redux.ts`, `src/startup-zustand.ts` each bundle one cache's `node` entry (`noExternal`); declarations from tsup (the types now live in core; `writeStartupDeclarations` removed); `zustand` declared.
- Redux's `node.ts` keeps `startMiroirPlatform` / `startMiroirNode` as thin bindings until Slice 3.
- Guards in this slice (R8): `ENTRY_OWNERS` (server owns both `node` entries), `BUNDLED_INTO_ANOTHER` and `BUNDLED_NAMES` gain zustand, `LOCAL_CACHE_IMPORT` matches both caches, `test_startup_calls_boundaries.py` `CALL_SOURCES` follows the move, the TSDoc pin follows `startMiroirNode` to core, the server pack cases cover the three entries, `test_package_runtime_dependencies.py` no longer lists zustand as published.
- CI builds zustand before react and the server: `pr-checks.yml`, `self-test.yml`, `Dockerfile`, `agent_session_setup.py`, `build-all.sh`.
- Release: `build:server` ncc keeps one cache inlined per entry; release smoke test.

### Refactor checkpoint

- `startMiroirPlatform.ts` leaves the redux package; one copy of the startup code (core).

### Validation

```bash
npm run build -w @miroir-framework/core -w miroir-localcache-redux -w miroir-localcache-zustand -w @miroir-framework/server -w @miroir-framework/cli
for c in redux zustand; do MIROIR_TEST_LOCAL_CACHE=$c MIROIR_ENV=test-filesystem npm run testByFile -w @miroir-framework/cli -- startMiroirNode; done
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests -q
npm run build:server -w miroir-server && MIROIR_RELEASE_SMOKE=1 python -m pytest scripts/tests/test_bundled_packages.py scripts/tests/test_server_release_smoke.py -q
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling,localcache
```

### Realization

_(pending)_

---

## Slice 2 — Every Node test platform follows `MIROIR_TEST_LOCAL_CACHE`

**Status:** ⬜ pending

### RED

- One assertion per platform's existing integration test, on `currentLocalCacheInfo().implementation`: `mcpTestPlatform.ts` (mcp), `serverTestPlatform.ts` (server-library), `aiTestPlatform.ts` (ai), `bootTestSupport.ts` (env). With `zustand`: fails.

### GREEN

- mcp and server-library pass the option to `startMiroirNode`; ai and env take `setupMiroirDomainController` and the REST client from `loadLocalCacheModule(kind)` (all three stop importing a cache package). Check that env's new devDependency on the server library makes no cycle (the server library has env as a devDependency): if it does, env takes the module from the cache packages' `node` entries directly (test code).

### Refactor checkpoint

- A shared test helper if the four platforms repeat the loading.

### Validation

```bash
npm run build -w @miroir-framework/server
for c in redux zustand; do for w in @miroir-framework/server @miroir-framework/mcp miroir-ai @miroir-framework/env; do MIROIR_TEST_LOCAL_CACHE=$c MIROIR_ENV=test-filesystem npm run testByFile -w $w || exit 1; done; done
npm run nonreg:filesystem -- --runner shared --local-cache zustand --scope smoke,tooling,runners,external,localcache
```

### Realization

_(pending)_

---

## Slice 3 — A React client starts and renders on Zustand

**Status:** ⬜ pending

### RED

- `packages/miroir-react/tests/startMiroirClient.integ.test.tsx`: `startMiroirClient(config, { localCache })` with the cache from the environment; renders, inside `LocalCacheProvider` with the returned binding, a component that reads the deployments state with react's `useSelector` and shows `currentLocalCacheInfo().implementation`. With `zustand`: fails (the platform is redux, the binding react-redux's).

### GREEN

- `startMiroirClient` loads `./local-cache/<kind>` and returns `{ …platform, localCacheBinding }`.
- `LocalCacheProvider({ binding, store })` puts the binding in a context; react's `useSelector` and `shallowEqual` call it. `MlEnumEditor`, `MlElementEditorHooks` use them (R1).
- D9 exports: root = provider, hooks, selectors (D8), types; `./local-cache/redux`, `./local-cache/zustand` = implementation classes; `./local-cache` removed; tsup entries as #652, both caches `noExternal`, dts via `paths`.
- Every importer of the removed names migrates in this slice (standalone `tests-utils.tsx`, `componentTestTools.tsx`, `localCacheImplementation.ts`, and the 8 tests that import `LocalCache` and the like from react), choosing `./local-cache/redux` or the environment's entry; `src/index.tsx` and the sandbox pass the binding to `LocalCacheProvider` (R4).
- Pack cases and the `./local-cache` pins follow (R8); standalone and Electron bundle policies: the two entries `lazy`, the eager baseline recorded with its reason (`bundle-size:record`), the D7 check added to `test_bundled_packages.py` on the bundle report.

### Refactor checkpoint

- `miroir-localcache-imports.ts` loses its comment switch; redux's `node.ts` drops its `startMiroirPlatform` bindings.

### Validation

```bash
npm run build -w miroir-localcache-redux -w miroir-localcache-zustand -w @miroir-framework/react
for c in redux zustand; do MIROIR_TEST_LOCAL_CACHE=$c MIROIR_ENV=test-filesystem npm run testByFile -w @miroir-framework/react -- startMiroirClient; done
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npm run build -w miroir-standalone-app -w miroir-standalone-app-electron   # then the two check_bundle_policy.py commands
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests -q
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,localcache
```

### Realization

_(pending)_

---

## Slice 4 — The standalone app's UI tests run on the chosen cache

**Status:** ⬜ pending

### RED

- `test_local_cache_choice.py`: the UI helpers (`tests-utils.tsx`, `componentTestTools.tsx`, `tests/helpers/AdminViewParamsProviders.tsx`) and the two redux-built tests are listed as redux-only; the zustand UI run (`--scope smoke,ui`) exercises nothing on zustand.

### GREEN

- The UI helpers build their store and binding through the environment's cache.
- `useSelectedApplicationMiroirTestSuiteRegistries.ts` reads the store from react's context, not `ReactReduxContext` (R1).
- D10: `useCurrentModelEnvironment.unit`, `ListTransformerPanel.unit` build their store through the chosen implementation.
- D6: zustand gaps exposed by the run fixed in `miroir-localcache-zustand`, `hooks.ts:47-51` included (one hook per call, R11).

### Refactor checkpoint

- `test_local_cache_choice.py`'s allowlist is empty.

### Validation

```bash
python -m pytest scripts/tests/test_local_cache_choice.py -q
npm run nonreg:filesystem -- --runner shared --local-cache zustand --scope smoke,ui,localcache
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,localcache
```

### Realization

_(pending)_

---

## Slice 5 — Docs, full nonreg on both caches, cleanup, AC

**Status:** ⬜ pending

### Work

- Docs: `release-process.md` §10e (both caches, the entries), `docs/reference/testing.md` (`--local-cache` now reaches the whole stack), `AGENTS.md` only within its size limit.
- Nonreg: `npm run nonreg:zustand` (exists, `package.json:58`) is the zustand safety net; no new step.
- Follow-up issue: the selectors in core (D6-b).
- No issue directory was created (assertions live in existing tests): nothing to clean.
- Tracer narrative: `startMiroirNode(config, { localCache: "zustand" })` in the CLI test, then `startMiroirClient` in react's, then the full UI on zustand in nonreg.

### Validation

```bash
./build-all.sh
# pre-push gate (AGENTS.md)
npm run nonreg:filesystem
npm run nonreg:zustand
```

### AC checklist

| Issue criterion | Proof |
|---|---|
| An application selects Zustand without editing framework sources | Slices 1 and 3 (`startMiroirNode`, `startMiroirClient` option) |
| One local cache per process and page | D7 check on the bundle report (Slice 3), `test_bundled_packages.py` |
| `nonreg --local-cache zustand` covers UI and Node startup | Slices 2 and 4, `nonreg:zustand` (Slice 5) |
| Docs describe the choice | Slice 5 |

### Realization

_(pending)_

## Revision history

- v1 (2026-11-02): first version.
- v2 (2026-11-02): adversarial review, 12 findings applied: guards updated in the slice that changes a shape; server and react get one entry per cache (the server library builds without splitting); importers migrate in the slice that removes the names; the contract enforced by each cache's build (`satisfies` in `node.ts`), not a core test; RED tests on `currentLocalCacheInfo().implementation`; keys moved where they can live (loader in server and react, core's functions named `…With`); Slice 2 call sites and validation; core public API; zustand built in CI and its manifest aligned; build before test; G2 check on the bundle report and the eager baseline; Realization placeholders, nonreg step, out-of-scope items R7 and R10.
