# 656 — Zustand as a runtime choice of local cache

> Make the local cache implementation (redux or zustand) a startup choice of a Miroir process or page, with one copy loaded, and make `nonreg --local-cache zustand` exercise the whole stack (UI, CLI, MCP, server), not only the test DomainControllers.

Related issue: https://github.com/miroir-framework/miroir/issues/656
Parent issue: #621 (npm packages epic) · Prerequisite: #652 ✅ (bundling, PR #655, merged into `aba`)
Related analyses: [`../652-BUILD-bundle-meta-model-and-local-cache/analysis.md`](../652-BUILD-bundle-meta-model-and-local-cache/analysis.md)
Key sources: [`packages/miroir-react/src/miroir-localcache-imports.ts`](../../../packages/miroir-react/src/miroir-localcache-imports.ts), [`packages/miroir-localcache-redux/src/startMiroirPlatform.ts`](../../../packages/miroir-localcache-redux/src/startMiroirPlatform.ts), [`packages/miroir-localcache-zustand/src/index.ts`](../../../packages/miroir-localcache-zustand/src/index.ts), [`packages/miroir-standalone-app/src/miroir-fwk/4-tests/localCacheImplementation.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/localCacheImplementation.ts)

**Status:** goals and decisions confirmed with the user (2026-11-02, grilling round 1: every recommendation accepted).

---

## 1. Goals

- **G1 — Pick the local cache at startup.** In order to use the state library that suits my application as an application developer, I can choose `redux` or `zustand` in the startup call (`startMiroirClient`, `startMiroirNode`) without editing framework sources.
- **G2 — Pay for one.** In order to keep my page and my process small as an application developer, I load only the implementation I chose.
- **G3 — Test the whole stack on either.** In order to trust both implementations as a framework maintainer, I can run `nonreg --local-cache zustand` and have the UI tests and the CLI, MCP and server test platforms run on Zustand.

## 2. Non-goals

- A third implementation, or a plug-in API for user-provided local caches.
- Changing the state shape (`LocalCacheSliceState`, `ReduxDeploymentsState`) or the selector semantics.
- Switching implementation while a page or a process runs.
- Publishing `miroir-localcache-zustand` as its own npm package (D3).
- A `MiroirConfig` / environment default for the choice, so the server binary and Electron follow a deployment setting (D1-b; later, when a deployment needs it). The binaries keep redux.
- One shared copy of the selectors in core (D6-b; follow-up issue).

## 3. Decision record

| Decision | Choice (Accepted) | Serves |
|---|---|---|
| D1 Where the choice is made | **Startup option** `localCache: "redux" \| "zustand"` of `startMiroirClient` / `startMiroirNode` / `startMiroirPlatform`, default `redux` | G1 |
| D2 What the UI depends on | **A local cache module interface in core** (`LocalCacheImplementation`: provider, `useSelector`, selectors, `setupMiroirDomainController`, REST client), implemented by both packages; react's hooks delegate to the implementation in a React context | G1, G2 |
| D3 Packaging | **Both bundled into react and into `server/startup`, each behind a lazy entry** (`import()` of the chosen one), following #652 | G2 |
| D4 Test reach | **`MIROIR_TEST_LOCAL_CACHE` read by one shared helper in core**, passed as the startup option by every test platform and UI test setup | G3 |
| D5 Where `startMiroirPlatform` lives | **Core**, parameterized by the implementation (it only needs `setupMiroirDomainController` and `RestPersistenceClientAndRestClient`) | G1 |
| D6 Behavior gaps of zustand | **Fixed in #656 when the zustand runs expose them**; merging the selectors into core is a follow-up | G3 |

Details and options: §5.

---

## 4. Current state (verified on `origin/aba`, bb9e4fc0f)

### 4.1 What the two implementations share

- **A domain interface in core.** Both `LocalCache` classes implement `LocalCacheInterface` (`packages/miroir-core/src/0_interfaces/4-services/LocalCacheInterface.ts:23`): redux `packages/miroir-localcache-redux/src/4_services/LocalCache.ts:80`, zustand `packages/miroir-localcache-zustand/src/4_services/LocalCache.ts:75`. It exposes `getInnerStore(): any` (line 28, "TODO: local store should not expose its implementation!!"), which the UI passes to `LocalCacheProvider`.
- **State types in core.** `ReduxStateWithUndoRedo`, `LocalCacheSliceState`, `StateWithUndoRedo`, `ZustandStateWithUndoRedo` and the rest come from `@miroir-framework/core`; zustand re-exports them (`localCacheZustandInterface.ts`).
- **Module-level parity by name, not by type.** `miroir-localcache-zustand/src/index.ts` presents itself as a "drop-in replacement for miroir-localcache-redux" and exports the same names, with aliases (`PersistenceAsyncStore as PersistenceReduxSaga`, `getInitialState as reduxStoreWithUndoRedoGetInitialState`). No TypeScript interface states the module contract; parity is checked only by the build when someone flips the switch below.
- **The switch.** `packages/miroir-react/src/miroir-localcache-imports.ts` has two blocks, "Redux Implementation (default)" active and "Zustand Implementation (alternative)" commented out. Since #652, react bundles whichever block is active.

Of the 29 names react takes from that file, zustand lacks 4: `startMiroirPlatform`, `MiroirPlatform`, `MiroirPlatformOptions`, `MiroirEmulatedServer`. Flipping the switch today breaks `startMiroirClient` (`packages/miroir-react/src/startMiroirClient.ts:12`), hence every client.

### 4.2 What only redux has

- **The startup calls.** `startMiroirPlatform` and `startMiroirNode` (`packages/miroir-localcache-redux/src/startMiroirPlatform.ts:129,174`, 184 lines). Their only local dependencies are `setupMiroirDomainController` (line 21) and `RestPersistenceClientAndRestClient` (line 20), both exported by zustand under the same names.
- **A Node entry without React** (`src/node.ts`, #337), which `@miroir-framework/server/startup` bundles (#652). Zustand's single entry exports its React hooks (`src/react/hooks.ts`, `zustand` + `react`).

### 4.3 Drift between the two

The two packages share file names but not code: redux `src/` is 5 789 lines, zustand 4 125. Line differences: `LocalCacheSliceSelectors.ts` 454, `LocalCacheSliceModelSelector.ts` 264, `LocalCacheSlice.ts` 1 361, the memoized selector maps 35 and 12. Most redux-only functions are Redux mechanics (reducers, sagas, entity adapters). Whether every UI-visible behavior matches (non-UUID primary keys, cache freshness, the local cache monitor) is unverified: no UI test has run on zustand.

### 4.4 Who reaches a local cache, and on which

| Consumer | Import | Implementation today |
|---|---|---|
| React UI: `LocalCacheProvider`, `useSelector`, selectors | `@miroir-framework/react` (`miroir-localcache-imports.ts`) | redux (comment switch) |
| `startMiroirClient` (standalone app `src/index.tsx:263`, sandbox `src/index.tsx:129`) | react | redux |
| CLI, server binary, Electron main, MCP host | `@miroir-framework/server/startup` (`startMiroirNode`) | redux |
| Standalone app test setup (`setupMiroirTest.ts:76`, `IntegrationTestSession.ts:585`) | `localCacheImplementation.ts` | **`MIROIR_TEST_LOCAL_CACHE`** (#446) |
| UI test helpers (`tests-utils.tsx:149`, `componentTestTools.tsx:558`) | react | redux (`store: ReduxStoreWithUndoRedo`) |
| Test platforms: cli `startMiroirNode.integ`, mcp `mcpTestPlatform.ts`, server-library `serverTestPlatform.ts`, react `startMiroirClient.integ`, ai `aiTestPlatform.ts`, env `bootTestSupport.ts` | redux package or `server/startup` | redux |

Nonreg: `run-nonreg.py --local-cache zustand` sets `MIROIR_TEST_LOCAL_CACHE` for every step (lines 1321–1322); only the standalone app's test setup reads it. On #655's head, a zustand run passed 125 of 126 steps (`test-results/nonreg/20261102T075328Z`), the failure intermittent and on the redux UI path.

---

## 5. Options per decision

### D1 — Where the choice is made

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Startup option** ★ | `startMiroirClient(config, { localCache: "zustand" })`, same on `startMiroirNode` | explicit, per process; tests pass it; matches the user's expectation | every caller that wants zustand passes it |
| D1-b. `MiroirConfig` / environment field | `miroirConfig.client.localCache` read by the startup calls | a deployment setting, the server and Electron follow it without code | one more config field; config validation; the UI and the server could disagree |
| D1-c. Build-time flag | react/server built with one or the other | no runtime switch | two builds; not a runtime choice (fails G1) |

**Decision:** D1-a. D1-b may be added later (the option wins, the config gives the default).

### D2 — What the UI depends on

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. Module interface in core + context** ★ | core declares `LocalCacheImplementation` (provider component, `useSelector`, the selector functions, `setupMiroirDomainController`, `RestPersistenceClientAndRestClient`); both packages export an object satisfying it; react's `LocalCacheProvider` puts the chosen one in a context and `useSelector` calls its hook | the contract is typed, a drift fails the build; one UI code path | the hook called depends on the provider (stable for a tree: hook rules hold); selectors used outside React need the implementation passed |
| D2-b. Keep the comment switch, add a second react build | `@miroir-framework/react` and `@miroir-framework/react-zustand` | no runtime indirection | duplicated package; not a startup choice |
| D2-c. Shared selectors moved to core | the pure selectors (over core state types) live once in core; only provider, hook and store differ | removes the drift of §4.3 at the source | large move (≈1 000 lines with diverged copies to reconcile); deferred (D6) |

**Decision:** D2-a; the comment switch in `miroir-localcache-imports.ts` goes.

### D3 — Packaging

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Both bundled, lazy entries** ★ | react bundles both (`noExternal`), the startup call `import()`s the chosen one; `server/startup` gets a zustand Node entry the same way | follows #652; one copy loaded per page/process; guards extend naturally | react's tarball grows by the zustand code; zustand needs a Node entry without React |
| D3-b. Zustand as its own published package, optional peer | `@miroir-framework/localcache-zustand` | react stays small | a new published package; the duplicate-copy risk returns |

**Decision:** D3-a.

### D4 — Test reach

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. One helper, read everywhere** ★ | core exports `testLocalCacheImplementation(env)` (moved from the standalone app); every test platform and UI test helper passes its result as the D1 option | one place; the nonreg flag means the whole stack | touches 6 test platforms and the UI helpers |
| D4-b. Each platform reads the variable | as today in the standalone app | local | 7 copies of the same parsing |

**Decision:** D4-a, the UI helpers (`renderWithProviders`, `componentTestTools`) included.

### D5 — Where `startMiroirPlatform` lives

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. Core, parameterized** ★ | `startMiroirPlatform(config, options, implementation)` in core; packages pass themselves | one copy; zustand gets it for free | core gains a startup module (no new dependency: it uses only the two injected functions) |
| D5-b. Copy into zustand | a second `startMiroirPlatform` | no core change | a third copy of drifting code |

**Decision:** D5-a.

### D6 — Behavior gaps of zustand

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D6-a. Fix what the zustand runs expose, in #656** ★ | G3 makes UI and platform tests run on zustand; their failures are fixed in the zustand package | G3 is met by green runs, not by exclusions | scope depends on what the runs find |
| D6-b. Merge the selectors into core first | one copy of the pure selectors | removes the drift at the source | ≈1 000 diverged lines to reconcile; a follow-up issue |

**Decision:** D6-a; D6-b becomes a follow-up issue.
