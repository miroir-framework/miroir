# Issue #656 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController, both local caches and the emulated server on the
> `test-filesystem` environment, through the public startup calls (`startMiroirNode`,
> `startMiroirClient`) and the React provider. No mocks. The tracer bullet proves a Node process
> started with `localCache: "zustand"` runs its DomainController on Zustand, loaded on demand.
>
> **Execution model:** commits per slice on the working branch (the user's standing workflow for
> this epic). Each slice ends with its Validation commands; on success its Realization summary is
> appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/656
Prerequisite: [`../652-BUILD-bundle-meta-model-and-local-cache/`](../652-BUILD-bundle-meta-model-and-local-cache/) ✅
Working branch: `claude/656-zustand-runtime-choice` (from `origin/aba`)

**Resume note:** plan v1; no slice started.

---

## Scope

- G1 — pick `redux` or `zustand` in the startup call (`startMiroirClient`, `startMiroirNode`) without editing framework sources.
- G2 — one local cache copy per page or process (D7: store, persistence, provider; RTK and reselect stay).
- G3 — `nonreg --local-cache zustand` runs the UI tests and the CLI, MCP, server, ai and env test platforms on Zustand.

This plan does **not** add a config default for the choice (D1-b, later), merge the selectors into core (D6-b, follow-up issue), or publish the zustand package (D3).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize: the redux paths of the UI, the module contract | ⬜ | `scripts/tests/test_local_cache_choice.py` (inventory), `localCacheModule.656.phase0.unit.test.ts` (both modules satisfy the contract) |
| 1 | Tracer: a Node process starts on Zustand | ⬜ | `startMiroirNode.integ` (cli) with `MIROIR_TEST_LOCAL_CACHE=zustand` |
| 2 | Every Node test platform follows `MIROIR_TEST_LOCAL_CACHE` | ⬜ | mcp, server-library, ai, env platforms; `nonreg --local-cache zustand --scope tooling,runners,external` |
| 3 | A React client starts and renders on Zustand | ⬜ | `startMiroirClient.integ` (react) on both caches |
| 4 | The standalone app's UI tests run on the chosen cache | ⬜ | `nonreg:filesystem --local-cache zustand --scope smoke,ui` |
| 5 | Packaging, guards, docs, full nonreg on both caches, AC | ⬜ | `pytest scripts/tests`, bundle guards, `nonreg:filesystem` × 2 |

---

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| D1 | Startup option `localCache?: LocalCacheKind` (`"redux" \| "zustand"`, default `"redux"`) on `startMiroirPlatform`, `startMiroirNode`, `startMiroirClient` | G1 |
| D2 | Core declares `LocalCacheModule` (`setupMiroirDomainController` on `"local" \| "remote"`, `RestPersistenceClientAndRestClient`); react declares the React binding (`Provider`, `useSelector`, `shallowEqual`); `LocalCacheProvider` takes the binding the platform carries; no UI source imports `react-redux` or a local cache package | G1, G2 |
| D3 | Both caches bundled into react (`./local-cache/redux`, `./local-cache/zustand`) and into `@miroir-framework/server/startup` (zustand gets a Node entry); the startup call `import()`s the chosen one | G2 |
| D4 | `localCacheKindFromEnvironment(env)` in core reads `MIROIR_TEST_LOCAL_CACHE`; every test platform and UI test helper passes its result | G3 |
| D5 | `startMiroirPlatform`, `startMiroirNode` move to core `5_setup`, parameterized by the `LocalCacheModule` | G1 |
| D6 | Gaps the zustand runs expose are fixed in the zustand package in this issue | G3 |
| D7 | G2 = one local cache copy | G2 |
| D8 | The UI keeps one static selector set (redux's selector modules, bundled into react) over the shared core state type | G1, G2 |
| D9 | React's root keeps provider, hooks, selectors, types; implementation classes move to `./local-cache/redux` and `./local-cache/zustand`; `./local-cache` becomes `./local-cache/redux` | G1, G2 |
| D10 | `useCurrentModelEnvironment.unit` and `ListTransformerPanel.unit` build their store through the chosen implementation | G3 |

---

## Allocated keys

- Core: `LocalCacheKind`, `LocalCacheModule`, `localCacheKindFromEnvironment`, `loadLocalCacheModule` (`src/5_setup/localCacheModule.ts`), `startMiroirPlatform`, `startMiroirNode` (`src/5_setup/startMiroirPlatform.ts`).
- React: `LocalCacheBinding`, `LocalCacheProvider` (binding + store), exports `./local-cache/redux`, `./local-cache/zustand`.
- Zustand: entry `./node` (`src/node.ts`, no React).
- Tests: `scripts/tests/test_local_cache_choice.py`; `packages/miroir-core/tests/5_setup/issues/656-zustand-runtime/localCacheModule.656.phase0.unit.test.ts`.
- No model element, no MiroirTest suite: the behavior is process wiring, not reachable through ML (vitest exception, as #639).

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Guards | `python -m pytest scripts/tests -q` |
| A test on zustand | `MIROIR_TEST_LOCAL_CACHE=zustand npm run testByFile -w <pkg> -- <file>` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --local-cache zustand --scope smoke,<scopes>` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Bundle guards | `npm run build -w miroir-standalone-app -w miroir-standalone-app-electron`, then the two `check_bundle_policy.py` commands of `pr-checks.yml` |

---

## Slice 0 — Characterize the redux paths and the module contract

**Status:** ⬜ pending

### RED / characterization

- `scripts/tests/test_local_cache_choice.py`: list the UI sources (`miroir-react/src`, `miroir-standalone-app/src`) importing `react-redux`, `ReactReduxContext` or a local cache package outside the switch file. Today: `MlEnumEditor.tsx`, `MlElementEditorHooks.ts`, `useSelectedApplicationMiroirTestSuiteRegistries.ts`, `localCacheImplementation.ts`. The test pins this list (an `xfail`-free allowlist that later slices shrink to empty).
- `localCacheModule.656.phase0.unit.test.ts` (core, vitest: a type contract): both packages' `setupMiroirDomainController` and `RestPersistenceClientAndRestClient` satisfy `LocalCacheModule`, checked with `satisfies` in a test that imports both (core devDependencies).

### GREEN

- `LocalCacheKind`, `LocalCacheModule` in core `0_interfaces`.

### Refactor checkpoint

- `localCacheImplementation.ts`'s `LocalCacheImplementation` union becomes core's `LocalCacheKind` (R9).

### Validation

```bash
python -m pytest scripts/tests/test_local_cache_choice.py -q
npm run testByFile -w @miroir-framework/core -- localCacheModule.656
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

---

## Slice 1 — Tracer: a Node process starts on Zustand

**Status:** ⬜ pending

### RED

- `packages/miroir-cli/tests/startMiroirNode.integ.test.ts`: a case passes `localCache: localCacheKindFromEnvironment(process.env)`; a new assertion checks that the DomainController's local cache is the chosen implementation (zustand's inner store has `getState` and no `dispatch`; redux's has `dispatch`). Run with `MIROIR_TEST_LOCAL_CACHE=zustand`: fails (option ignored, redux).

### GREEN

- Core `5_setup`: `startMiroirPlatform` and `startMiroirNode` moved from `miroir-localcache-redux/src/startMiroirPlatform.ts`, taking the `LocalCacheModule`; `loadLocalCacheModule(kind)` is given by the caller (core cannot import the packages).
- `miroir-localcache-zustand/src/node.ts` (no React) and its `./node` export; redux's `node.ts` and zustand's `node.ts` export a `localCacheModule` object.
- `@miroir-framework/server/startup`: `startMiroirNode(config, { localCache })` imports `miroir-localcache-redux/node` or `miroir-localcache-zustand/node` with `import()`; both bundled (`noExternal`), declarations generated as #652 does; `zustand` declared.
- Redux keeps re-exporting `startMiroirPlatform` / `startMiroirNode` bound to itself until Slice 3 moves react.

### Refactor checkpoint

- `startMiroirPlatform.ts` leaves the redux package; `test_package_manifests.py`'s TSDoc pin follows `startMiroirNode` to core's declarations (R8).

### Validation

```bash
for c in redux zustand; do MIROIR_TEST_LOCAL_CACHE=$c MIROIR_ENV=test-filesystem npm run testByFile -w @miroir-framework/cli -- startMiroirNode; done
npm run build -w @miroir-framework/core -w miroir-localcache-redux -w miroir-localcache-zustand -w @miroir-framework/server -w @miroir-framework/cli
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests -q
npm run build:server -w miroir-server && MIROIR_RELEASE_SMOKE=1 python -m pytest scripts/tests/test_bundled_packages.py scripts/tests/test_server_release_smoke.py -q
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling,localcache
```

---

## Slice 2 — Every Node test platform follows `MIROIR_TEST_LOCAL_CACHE`

**Status:** ⬜ pending

### RED

- With `MIROIR_TEST_LOCAL_CACHE=zustand`, each platform's existing integration test asserts the cache kind of its DomainController (one assertion added to an existing test per platform): `mcpTestPlatform.ts` (mcp), `serverTestPlatform.ts` (server-library), `aiTestPlatform.ts` (ai), `bootTestSupport.ts` (env). Fails: all on redux.

### GREEN

- The platforms pass `localCache: localCacheKindFromEnvironment(process.env)` to `startMiroirNode`; ai and env, which call `setupMiroirDomainController`, take it from the chosen `LocalCacheModule`.

### Refactor checkpoint

- One helper per platform family if the four repeat the loading code.

### Validation

```bash
for c in redux zustand; do MIROIR_TEST_LOCAL_CACHE=$c MIROIR_ENV=test-filesystem npm run testByFile -w @miroir-framework/server; done
npm run nonreg:filesystem -- --runner shared --local-cache zustand --scope smoke,tooling,runners,external
```

---

## Slice 3 — A React client starts and renders on Zustand

**Status:** ⬜ pending

### RED

- `packages/miroir-react/tests/startMiroirClient.integ.test.tsx`: with the cache from the environment, `startMiroirClient` returns a platform whose binding renders a component reading the local cache through react's `useSelector` (an existing selector, e.g. the deployments state). Fails on zustand: the binding is react-redux's.

### GREEN

- `startMiroirClient(config, { localCache })` loads `./local-cache/<kind>`, returns `{ …platform, localCacheBinding }`.
- `LocalCacheProvider({ binding, store })` puts the binding in a context; `useSelector` and `shallowEqual` call the binding's. `MlEnumEditor`, `MlElementEditorHooks` take them from react's binding (R1).
- React exports (D9): root keeps provider, hooks, selectors (redux's selector modules, D8), types; `./local-cache/redux`, `./local-cache/zustand` export the implementation classes; `./local-cache` removed; tsup `noExternal` both, dts as #652.

### Refactor checkpoint

- `miroir-localcache-imports.ts` loses its comment switch: it keeps the selectors and types only.

### Validation

```bash
for c in redux zustand; do MIROIR_TEST_LOCAL_CACHE=$c MIROIR_ENV=test-filesystem npm run testByFile -w @miroir-framework/react -- startMiroirClient; done
npm run build -w @miroir-framework/react && npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,localcache
```

---

## Slice 4 — The standalone app's UI tests run on the chosen cache

**Status:** ⬜ pending

### RED

- `nonreg --local-cache zustand --scope smoke,ui`: the UI tests pass the redux store type and provider today, so the zustand run either keeps them on redux (G3 not met: `test_local_cache_choice.py` lists them) or fails.

### GREEN

- `src/index.tsx`, the sandbox, `tests-utils.tsx`, `componentTestTools.tsx`, `tests/helpers/AdminViewParamsProviders.tsx` pass the platform's binding to `LocalCacheProvider` (R4).
- `useSelectedApplicationMiroirTestSuiteRegistries.ts` reads the store from react's context, not `ReactReduxContext` (R1).
- `localCacheImplementation.ts` uses core's helper and the `./local-cache/<kind>` entries.
- D10: `useCurrentModelEnvironment.unit`, `ListTransformerPanel.unit` build their store through the chosen implementation.
- D6: zustand gaps exposed by the run are fixed in `miroir-localcache-zustand` (including `hooks.ts:47-51`, one hook per call site, R11).

### Refactor checkpoint

- `test_local_cache_choice.py`'s allowlist is empty.

### Validation

```bash
python -m pytest scripts/tests/test_local_cache_choice.py -q
npm run nonreg:filesystem -- --runner shared --local-cache zustand --scope smoke,ui,localcache
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,localcache
```

---

## Slice 5 — Packaging, guards, docs, full nonreg, AC

**Status:** ⬜ pending

### Work

- Guards (R8): `BUNDLED_INTO_ANOTHER`, `ENTRY_OWNERS`, `BUNDLED_NAMES`, `LOCAL_CACHE_IMPORT`, `LOCAL_CACHE_OWNERS` learn zustand; react and server pack cases for both entries; `test_package_runtime_dependencies.py` no longer lists zustand as published.
- Bundle policies: the zustand entry `lazy` in the standalone policy, the redux and zustand Node entries in Electron's; one local cache copy eager (G2).
- Docs: `release-process.md` §10e, `docs/reference/testing.md` (`--local-cache`), `AGENTS.md` only if within its size limit.
- Follow-up issue for D6-b (selectors in core).

### Validation

```bash
./build-all.sh
# pre-push gate (AGENTS.md)
npm run nonreg:filesystem
npm run nonreg:filesystem -- --local-cache zustand
```

### AC checklist

| Issue criterion | Proof |
|---|---|
| An application selects Zustand without editing framework sources | Slices 1 and 3 (`startMiroirNode`, `startMiroirClient` option) |
| One local cache per process and page | bundle guards (Slice 5), `test_bundled_packages.py` |
| `nonreg --local-cache zustand` covers UI and Node startup | Slices 2 and 4, full zustand nonreg (Slice 5) |
| Docs describe the choice | Slice 5 |

## Revision history

- v1 (2026-11-02): first version.
