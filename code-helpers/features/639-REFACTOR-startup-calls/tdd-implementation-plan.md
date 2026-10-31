# Issue #639 — TDD Implementation Plan

> Testing posture: integration first, no mocks. Each call is tested through its public interface on a real test environment (`test-filesystem`), with the real filesystem store, real domain controllers, the framework's own `RestClientStub` for the emulated server, and `bootEnvironment` from `miroir-env`. The hosts are proven by their existing tests (CLI, MCP, Electron, the server's release smoke, the sandbox build) and, for the standalone app, by the web self-test run locally.

**Resume note:** slices are done in order; each slice's Status line and Realization say where work stopped. Branch `claude/639-startup-calls`, from `claude/636-server-library` at `7439b57ff` (PR #638, ready to merge). The user delegated slice choices ("adversarial reviews and stop when PR can be merged"); the plan was revised after an adversarial review (Revision history).

## Scope

In (goals of [`analysis.md`](analysis.md)):
- **G1** Start a Node host in one call: `startMiroirNode(config, { stores })`.
- **G2** Start a React client in one call: `startMiroirClient(config, { stores })`, fed to the React providers.
- **G3** Choose my stores: the calls import no store package.
- **G4** Keep the existing hosts working: CLI, MCP tests, server, Electron, sandbox, standalone app.

Out (owners): the hand-built test helpers and the model extraction scripts (follow-up issue opened when this one lands); renaming and re-exporting from `@miroir-framework/server` (#621 I6); the MCP store peer dependencies (#621 I5); moving `registerStoreOnDemand`; the environment boot; a one-call path for the zustand cache.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/639 (sub-issue of epic #621, item I4)
- Analysis: [`analysis.md`](analysis.md)
- Epic plan: [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md) (its I4 slices are superseded by this plan)
- Prerequisite: [`../636-REFACTOR-server-library/tdd-implementation-plan.md`](../636-REFACTOR-server-library/tdd-implementation-plan.md)
- Branch: `claude/639-startup-calls`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Baseline of the hosts' tests | ⬜ pending | existing host tests and the local web self-test pass on the base commit |
| 1 | Tracer: `startMiroirNode` on an emulated client config; the CLI and the MCP tests on it | ⬜ pending | `startMiroirNode.integ` (Library books through the returned domain controller) + `cli.integ` + MCP tests |
| 2 | `startMiroirNode` on a server config; the server and Electron on it | ⬜ pending | `startMiroirNode.integ` (server case) + release smoke + `environmentBoot.integ` + library tests |
| 3 | `startMiroirClient` in `miroir-react` | ⬜ pending | `startMiroirClient.integ` (providers render Library books; hook order; passed client) |
| 4 | The sandbox and the standalone app on `startMiroirClient` | ⬜ pending | sandbox and standalone builds, bundle guards, local web self-test |
| 5 | Nonreg step, docs, epic plan, AC | ⬜ pending | full `nonreg:filesystem` |

## Locked implementation defaults

Copied from the analysis decision record; deviations go into the slice's Realization.

| Decision | Default | Serves |
|---|---|---|
| D1 | `startMiroirNode` exported from `miroir-localcache-redux/node` | G1, G3 |
| D2 | `startMiroirPlatform` in `miroir-localcache-redux/src/startMiroirPlatform.ts`, exported from both entries; `startMiroirClient` in `miroir-react` (`src/startMiroirClient.ts`), importing the cache through `src/miroir-localcache-imports.ts`; redux only | G2 |
| D3 | `stores: StoreSectionStartup[]`, `StoreSectionStartup = (configurationService: ConfigurationServiceInner) => void`, defined and exported by `miroir-core`; Electron's and the CLI's local types go; the CLI loader becomes `loadStoreStartups(config): Promise<StoreSectionStartup[]>` | G3 |
| D4 | The call runs, in order: `miroirCoreStartup()`, `stores`, the Node call's optional `loggers: { factory, options }` (awaited), then context, clients, managers, domain controllers, emulated server wiring, `configureEmulatedServer`; the client call then sets process capabilities on the stub and fetches them into both domain controllers. Host startups, `registerTestImplementation`, the environment boot, gates and Electron's IPC stub stay with the hosts | G1, G2, G4 |
| D5 | Input `MiroirConfigClient \| MiroirConfigServer` (switch on `miroirConfigType`); options `stores`, `activityTracker?`, `eventService?`, `restClient?`, `fetch?` (default `globalThis.fetch.bind(globalThis)`), `externalServiceClient?`, `configureEmulatedServer?`, and `loggers?` (Node call); result `MiroirPlatform = { miroirContext, domainController, persistenceStoreControllerManager? (server config only), restClient? (client config only), emulatedServer?: { domainController, persistenceStoreControllerManager, restClientStub } }`; `startMiroirClient` adds `processCapabilities` | G1, G2, G4 |

Additions decided by this plan:
- **P1** Tests are written under their feature names from the start (`packages/miroir-cli/tests/startMiroirNode.integ.test.ts`, `packages/miroir-react/tests/startMiroirClient.integ.test.tsx`), as #636's cleanup ended; there is no `issues/639-*` directory to clean up.
- **P2** `startMiroirNode` is tested in `miroir-cli`, its first host, which already has `miroir-env`, `miroir-store-filesystem` (peer) and `miroir-example-library` at hand. `startMiroirClient` is tested in `miroir-react`, its package, which has happy-dom and Testing Library; it gains the devDependencies `miroir-env` and `miroir-store-filesystem` (test-only; checked by `scripts/check_dependency_policy.py`).
- **P3** The CLI awaits its logger start (analysis §6).
- **P5 (precision of D4/D5)** The client call fetches capabilities from `/capabilities` except for a real server outside a browser, where it uses `resolveProcessCapabilitiesUrl(serverConfig.rootApiUrl)` (Slice 3).
- **P4** The real-server client mode (`RestClient(fetch)`) has no Node test: it needs a listening Miroir server, which `miroir-react` cannot depend on. It is proven by the local web self-test (Slice 4), which runs the standalone app in a browser against the release server.

## Allocated names and keys

No model element, uuid or MiroirTest suite: the feature is process wiring, not reachable through the ML (justification for vitest).

| Kind | Name |
|---|---|
| Shared core | `startMiroirPlatform` (`miroir-localcache-redux/src/startMiroirPlatform.ts`), with `MiroirPlatform`, `MiroirPlatformOptions` |
| Node call | `startMiroirNode` (same file, exported from `./node` only), with `MiroirNodeOptions` |
| Client call | `startMiroirClient` (`miroir-react/src/startMiroirClient.ts`), with `MiroirClientPlatform` |
| Core type | `StoreSectionStartup` (`miroir-core/src/0_interfaces/4-services/StoreSectionStartup.ts` or next to `ConfigurationServiceInner`'s interface) |
| CLI loader | `loadStoreStartups` (`miroir-cli/src/startup/storeStartup.ts`) |
| Tests | `packages/miroir-cli/tests/startMiroirNode.integ.test.ts`, `packages/miroir-react/tests/startMiroirClient.integ.test.tsx` |
| Boundary check | `scripts/tests/test_startup_calls_boundaries.py` |
| Nonreg step | `unit-639-startup-calls` (scopes `tooling`, `localcache`, `ui`; tier `default`) |

## Test execution conventions

| Purpose | Command |
|---|---|
| Node call | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-cli -- startMiroirNode` |
| CLI | `npm run testByFile -w miroir-cli` |
| MCP | `npm run testByFile -w miroir-mcp` |
| Client call | `npm run testByFile -w miroir-react -- startMiroirClient` |
| Electron | `npm run testByFile -w miroir-standalone-app-electron` |
| Server library | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-server-library` |
| Release smoke | `npm run build -w miroir-server-library && npm run build:server -w miroir-server && MIROIR_RELEASE_SMOKE=1 python -m pytest scripts/tests/test_server_release_smoke.py scripts/tests/test_server_release_smoke_production.py -q` |
| Web self-test | `MIROIR_ENV=self-test npm run build -w miroir-standalone-app && npm run build:release -w miroir-server && MIROIR_ENV=self-test npm run selfTest -w miroir-standalone-app -- --serve --out <scratch>/web.json` (both steps need the `self-test` environment, `self-test.mjs:7–11`; without it there is no verdict) |
| Builds | `npm run build -w miroir-core -w miroir-localcache-redux -w miroir-react` (in that order), `npm run build -w miroir-sandbox`, `npm run build -w miroir-standalone-app` |
| Bundle guards | `python3 scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json` (and Electron's) |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` per touched package |

---

## Slice 0 — Baseline of the hosts' tests

**Status:** ⬜ pending

### Goal

Every host test this issue relies on passes on the base commit, so a later failure is this issue's.

### Steps

No new test: the hosts' behaviour is already pinned by their tests (analysis §4.4). Run them on `7439b57ff` and record the counts.

### Validation

```bash
# --only takes one comma-separated list (scripts/run-nonreg.py:971); a repeated flag keeps only the last
npm run nonreg:filesystem -- --runner shared --only unit-345-cli,unit-345-mcp,unit-345-electron,build-633-sandbox,unit-636-server-library,build-636-server-release
# web self-test, locally (CI runs it after merge only)
MIROIR_ENV=self-test npm run build -w miroir-standalone-app && npm run build:release -w miroir-server && MIROIR_ENV=self-test npm run selfTest -w miroir-standalone-app -- --serve --out <scratch>/web.json
```

### Realization

---

## Slice 1 — Tracer: `startMiroirNode` on an emulated client config; the CLI and the MCP tests on it

**Status:** ⬜ pending

### Goal

A Node tool gets a domain controller with its emulated server from one call, with the stores it passes (G1, G3). The CLI and the MCP tests use it; both `setup.ts` copies and the MCP `storeStartup.ts` go.

### 1.1 RED

`packages/miroir-cli/tests/startMiroirNode.integ.test.ts` (vitest: process wiring, not reachable through MiroirTest):
- opens `test-filesystem` (`openTestEnvironment`, reseeded), takes its client config (`emulateServer: true`);
- calls `startMiroirNode(miroirConfig, { stores: [miroirFileSystemStoreSectionStartup] })`;
- runs `bootEnvironment(platform.domainController, environment, env)`, then a `rollback` of the Library application on the Model endpoint `7947ae40-eb34-4149-887b-15a9021e714e`;
- asserts: the Book entity `e8ba151b-d68e-4cc3-9a83-3459d309ccf5` of deployment `f714bb2f-a12d-4e71-a03b-74dcedea6eb4` has instances in `platform.domainController.getLocalCache()` (read through the deployment's query selector or a `query` action on the domain controller); `platform.emulatedServer` is present, and a call through `platform.emulatedServer.restClientStub` (a CRUD read of the Book entity) answers from the emulated server's stores (the stub's fields are private, `RestClientStub.ts:41–46`, so the wiring is proven by a call); `platform.persistenceStoreControllerManager` is absent.

Second test: `loadStoreStartups(test-filesystem client config)` returns exactly `[miroirFileSystemStoreSectionStartup]`, and running it on a scratch `new ConfigurationServiceInner()` registers the filesystem `model` section factory there (the process-wide `ConfigurationService.configurationService` is never cleared, so asserting on it after the first test would prove nothing). It replaces the store test of `mcpPackageSurface.unit.test.ts:23–29`.

RED: `startMiroirNode` and `loadStoreStartups` do not exist.

### 1.2 GREEN

- `miroir-core`: `StoreSectionStartup` type, exported.
- `miroir-localcache-redux/src/startMiroirPlatform.ts`: `startMiroirPlatform` (client and server branches of D5; this slice exercises the emulated client branch) and `startMiroirNode` (`startMiroirPlatform` plus the `loggers` option). Exported from `src/node.ts`; `startMiroirPlatform` and the types also from `src/index.ts`.
- `miroir-cli`: `platform.ts` calls `loadStoreStartups` then `startMiroirNode(miroirConfig, { stores, loggers: { factory: loglevelNextLog, options: loggerOptions } })` and reads `emulatedServer?.domainController`, `emulatedServer?.restClientStub`; `startup/setup.ts` deleted; `storeStartup.ts` returns startups.
- `miroir-mcp`: `tests/integration/mcpTestPlatform.ts` calls `startMiroirNode` with the stores its test environment uses, through a small `storeType → import()` map kept in the test (dynamic, as today: `miroir-store-indexedDb` and `miroir-store-postgres` are optional peers and load only for their test environments); `src/startup/` deleted; the store test of `mcpPackageSurface.unit.test.ts` deleted (moved, above).

### 1.3 Refactor checkpoint

The two copies are gone; `startMiroirPlatform` has one branch per row of the D5 table, no duplication with `setupMiroirDomainController`. The Node entry must still pull nothing from React: `dist/node.js` re-exports tsup chunks, so the proof is the existing guard `packages/miroir-standalone-app/tests/0_build/electronBundle.unit.test.ts` with the Electron build and its bundle policy (run in Slice 2, which changes the Electron main process).

### Validation

```bash
npm run build -w miroir-core -w miroir-localcache-redux
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-cli -- startMiroirNode
npm run testByFile -w miroir-cli
npm run testByFile -w miroir-mcp
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-localcache-redux/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-cli/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-mcp/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling,localcache,runners
```

### Realization

---

## Slice 2 — `startMiroirNode` on a server config; the server and Electron on it

**Status:** ⬜ pending

### Goal

A server process gets its local domain controller and rooted store manager from the same call (G1, G4). `miroir-server`, the Electron main process and the library's test twin use it.

### 2.1 RED

In `startMiroirNode.integ.test.ts`: from `environmentServerConfig(resolved)` of `test-filesystem`, `startMiroirNode(serverConfig, { stores: [miroirFileSystemStoreSectionStartup] })`; after `bootEnvironment`, the local domain controller reads Library books; `persistenceStoreControllerManager` is present and is the one the domain controller writes through (opening a store on it is visible to the domain controller); `emulatedServer` and `restClient` are absent. RED until the server branch of `startMiroirPlatform` exists (Slice 1 may have written it; if so, this test is GREEN at once and is kept as the characterization of the branch, noted in the Realization).

A second assertion: an `externalServiceClient` passed in reaches the domain controller (the server's rotated secrets path). `DomainController` keeps it private (`DomainController.ts:451`), so the proof is behavioural: `defaultExternalServiceClient({ fetch: createFakeOutboundHttp(...).fetch })` (the pattern of `setupMiroirTest.ts`), then an action that calls out (an external service query of a test fixture), and the fake records the call.

### 2.2 GREEN

- `miroir-server/src/server.ts:335–381`: one `startMiroirNode(miroirConfig, { stores: [filesystem, indexedDb, mongodb, postgres startups], loggers: { factory: loglevelnext, options: loggerOptions }, externalServiceClient })`; reads `domainController`, `persistenceStoreControllerManager`, `miroirContext`.
- `miroir-standalone-app-electron`: `bootElectronServer` calls `startMiroirNode(serverConfig, { stores: four registerStoreOnDemand closures })`; the `miroirCoreStartup()` of `setupIpcServer` goes (the call owns it); `storesOnDemand.ts` uses the core `StoreSectionStartup` type.
- `miroir-server-library/tests/support/serverTestPlatform.ts`: the same call as `server.ts`.

### 2.3 Refactor checkpoint

`server.ts` no longer imports `MiroirContext`, `PersistenceStoreControllerManager`, `setupMiroirDomainController`, `MiroirActivityTracker`, `MiroirEventService` unless still used; remove the unused imports. The source-text tests on `server.ts` (#636 repointed them) still pass or follow the code.

### Validation

```bash
npm run build -w miroir-core -w miroir-localcache-redux
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-cli -- startMiroirNode
npm run testByFile -w miroir-standalone-app-electron
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-server-library
npm run build -w miroir-server-library && npm run build:release -w miroir-server   # build:release also copies release/client, without which the production smoke skips
MIROIR_RELEASE_SMOKE=1 python -m pytest scripts/tests/test_server_release_smoke.py scripts/tests/test_server_release_smoke_production.py -q
npm run build -w miroir-standalone-app-electron && python3 scripts/check_bundle_policy.py packages/miroir-standalone-app-electron/dist/bundle-report.json packages/miroir-standalone-app-electron/bundle-policy.json
npm run testByFile -w miroir-standalone-app -- electronBundle.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server-library/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app-electron/tsconfig.json
npm run nonreg:filesystem -- --runner shared   # full run after Slices 1 and 2
```

### Realization

---

## Slice 3 — `startMiroirClient` in `miroir-react`

**Status:** ⬜ pending

### Goal

A React application gets what `MiroirContextReactProvider` and `LocalCacheProvider` need from one call, and shows Miroir data (G2, G3).

### 3.1 RED

`packages/miroir-react/tests/startMiroirClient.integ.test.tsx` (vitest with happy-dom: React rendering and process wiring, not reachable through MiroirTest):
- **emulated:** from `test-filesystem`'s client config, `startMiroirClient(config, { stores: [miroirFileSystemStoreSectionStartup], configureEmulatedServer })`; `bootEnvironment` on the result; render `LocalCacheProvider` and `MiroirContextReactProvider` (with `processCapabilities`) around a probe component that reads the Library books with a `miroir-react` selector hook (`useReduxDeploymentsStateQuerySelectorForCleanedResult`, or the hook `ReportView` uses); after the Library rollback, the probe shows a known book title from `miroir-example-library`'s data.
- **hook order:** `configureEmulatedServer` runs once, with the `emulatedServer` part, before the stub's process capabilities are set: inside the hook, `fetchProcessCapabilities(server.restClientStub)` returns `FAIL_CLOSED_PROCESS_CAPABILITIES`; after the call, `processCapabilities` is not the fail-closed value.
- **passed client:** a second `startMiroirClient(clientConfig, { stores: [], restClient: nodePlatform.emulatedServer.restClientStub })` on a `startMiroirNode` platform (the Electron renderer's shape): no `emulatedServer` in the result, and its domain controller reads the books through the passed client.

RED: `startMiroirClient` does not exist.

### 3.2 GREEN

`miroir-react/src/startMiroirClient.ts`: `startMiroirPlatform` (through `miroir-localcache-imports.ts`) with the bound `fetch` default, then capabilities on the stub (`getProcessCapabilities` from the client config and the store registers) and `fetchProcessCapabilities` into both domain controllers. URL (P5): the default relative `/capabilities` for the stub, a passed client, and a real server in a browser (same origin, or the Vite proxy for `/capabilities`, as today); `resolveProcessCapabilitiesUrl(serverConfig.rootApiUrl)` for a real server outside a browser (no `globalThis.window`), where Node `fetch` refuses relative URLs (`setupMiroirTest.ts:154–157`). Exported from `src/index.ts`. devDependencies `miroir-env`, `miroir-store-filesystem` (P2), then `npm install` so `package-lock.json` follows (CI runs `npm ci`); the lockfile change is part of the slice. Build order already fits: `build-all.sh` builds both before `miroir-react`.

### 3.3 Refactor checkpoint

`startMiroirClient` holds only what differs from the Node call (fetch default, capabilities); anything else moves into `startMiroirPlatform`.

### Validation

```bash
npm run build -w miroir-core -w miroir-localcache-redux -w miroir-react
npm run testByFile -w miroir-react -- startMiroirClient
npm run testByFile -w miroir-react
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
python scripts/check_dependency_policy.py
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,localcache
```

### Realization

---

## Slice 4 — The sandbox and the standalone app on `startMiroirClient`

**Status:** ⬜ pending

### Goal

Both React clients start through the call, unchanged for their users (G4).

### 4.1 RED

No new automated test can fail first: the standalone app's start runs only in a browser. The proofs are the builds, the bundle guards and the local web self-test, run before (Slice 0) and after.

### 4.2 GREEN

- `miroir-sandbox/src/index.tsx` (110–202): keeps its module-level loggers, `registerTestImplementation` and `miroirDemoAppStartup`; calls `startMiroirClient(demoMiroirConfig, { stores: [(cs) => miroirBundledStoreSectionStartup(cs, demoBundledData), miroirIndexedDbStoreSectionStartup], activityTracker, eventService })`; reads `emulatedServer.persistenceStoreControllerManager` for the Admin migration and `emulatedServer.domainController` to open stores.
- `miroir-standalone-app/src/index.tsx`: `setupMiroirPlatform` (212–354) and `setupClient` (357–384) go; `startWebApp` keeps `miroirAppStartup` and `registerTestImplementation`, then calls `startMiroirClient(config, { stores: [miroirIndexedDbStoreSectionStartup], activityTracker, eventService, restClient: electronRestClient, configureEmulatedServer: (server) => { identity and access directories } })`.

### 4.3 Refactor checkpoint

The hosts' own `miroirCoreStartup()` calls go (standalone `index.tsx:399`, sandbox `index.tsx:131`): the call owns it. Imports the two `index.tsx` files no longer use (`RestClient`, `RestClientStub`, `PersistenceStoreControllerManager`, `MiroirContext`, `setupMiroirDomainController`, `RestPersistenceClientAndRestClient`, `fetchProcessCapabilities`, `getProcessCapabilities` if unused) are removed.

### Validation

```bash
npm run build -w miroir-sandbox
MIROIR_ENV=self-test npm run build -w miroir-standalone-app
python3 scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npm run build -w miroir-standalone-app-electron && python3 scripts/check_bundle_policy.py packages/miroir-standalone-app-electron/dist/bundle-report.json packages/miroir-standalone-app-electron/bundle-policy.json
npm run build:release -w miroir-server && MIROIR_ENV=self-test npm run selfTest -w miroir-standalone-app -- --serve --out <scratch>/web.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-sandbox/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,localcache
```

### Realization

---

## Slice 5 — Nonreg step, docs, epic plan, AC

**Status:** ⬜ pending

### Steps

- Nonreg step `unit-639-startup-calls` (`scripts/nonreg-manifest.json`, inserted textually): `bash -c` running the two vitest launches in sequence (`miroir-cli` `startMiroirNode`, then `miroir-react` `startMiroirClient`), plus the boundary pytest; scopes `tooling`, `localcache`, `ui`; tier `default`; `parallel: false`.
- Docs: `docs/internals/application-startup.md`, a section "One startup call per side (#639)" (the two calls, the D5 table, what stays with the host); `miroir-localcache-redux` and `miroir-react` README lines if they have READMEs.
- Epic plan: I4 rows ✅ #639 (superseded); the I4 nonreg row.
- Follow-up issue for the test helpers and extraction scripts (analysis non-goals), linked from the analysis.
- Tracer narrative: start the CLI on `test-filesystem` (`npx miroir-cli ...` listing Library books), the server release on `bench-agent`, and the web self-test; their automated equivalents are the tests above.

### AC checklist

| Acceptance criterion (#639) | Proof |
|---|---|
| `startMiroirNode` from `miroir-localcache-redux/node`; CLI and MCP tests call it; both `setup.ts` deleted; Library instances read on `test-filesystem` | Slice 1 test, `cli.integ`, MCP tests, `git ls-files` |
| `startMiroirClient` for React clients; sandbox and standalone call it; a test renders data from it | Slice 3 test, Slice 4 builds and self-test |
| server and Electron on `startMiroirNode`, unchanged behaviour | release smoke, `environmentBoot.integ`, `electronIpcAuth.263.phase5`, library tests |
| neither call imports a store package or reads `process.env` | `scripts/tests/test_startup_calls_boundaries.py` (added here): `startMiroirPlatform.ts` and `startMiroirClient.ts` contain no `process.env` and no store specifier (static `from` or dynamic `import(`); the `dependencies` and `peerDependencies` (not `devDependencies`, Slice 3 adds a store there for tests) of `miroir-localcache-redux` and `miroir-react` name no `miroir-store-*`. Scope of the claim: the two calls' own code; `RestClientStub` (core, `RestClientStub.ts:89`) and `Model.ts:406` read `process.env` as before |
| full filesystem nonreg passes | final run |

### Validation

```bash
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
python scripts/check_dependency_policy.py
npm run lint
npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

## Revision history

- **v1:** first version.
- **v2 (adversarial review):** `--only` takes one comma list; the web self-test needs `MIROIR_ENV=self-test` on build and run; behavioural proofs where the fields are private (external service client, stub wiring, hook order); the loader test asserts on a scratch configuration service; capabilities URL rule (P5); lockfile update with the new devDependencies; AC boundary check made precise and moved to its own pytest; React-free Node entry proven by the Electron bundle guard; MCP stores stay dynamic; `build:release` for the production smoke; `core` scope in Slice 1 and a full nonreg after Slice 2; the hosts' leftover `miroirCoreStartup` calls removed in Slice 4.
