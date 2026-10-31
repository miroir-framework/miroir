# 639 — One startup call for Node hosts and one for React clients

> Every Miroir host builds its platform by hand, the same way: `miroirCoreStartup`, store registration, loggers, `MiroirContext`, REST client, store controller managers and one or two domain controllers. This analysis maps the copies and settles the two calls that replace them, `startMiroirNode` and `startMiroirClient`, before the packages are published (#621).

Related issue: https://github.com/miroir-framework/miroir/issues/639
Parent issue: #621 (item I4, work item W4) · Prerequisite: #636 server library (PR #638, ready)
Related analyses: [`../621-FEATURE-npm-packages/analysis.md`](../621-FEATURE-npm-packages/analysis.md) (§4.6, D8), [`../636-REFACTOR-server-library/analysis.md`](../636-REFACTOR-server-library/analysis.md)
Key sources: [`miroir-cli/src/startup/setup.ts`](../../../packages/miroir-cli/src/startup/setup.ts), [`miroir-cli/src/platform.ts`](../../../packages/miroir-cli/src/platform.ts), [`miroir-standalone-app/src/index.tsx`](../../../packages/miroir-standalone-app/src/index.tsx), [`miroir-sandbox/src/index.tsx`](../../../packages/miroir-sandbox/src/index.tsx), [`miroir-server/src/server.ts`](../../../packages/miroir-server/src/server.ts), [`miroir-standalone-app-electron/src/environmentBoot.ts`](../../../packages/miroir-standalone-app-electron/src/environmentBoot.ts), [`miroir-localcache-redux/src/sagaTools.ts`](../../../packages/miroir-localcache-redux/src/sagaTools.ts)

**Status:** decisions follow the epic's recommendation D8-a, which this issue accepts (the epic's D8 row is updated); the request to proceed with I4 confirms them. Revision history at the end.

---

## 1. Goals

- **G1 — Start a Node host in one call.** In order to write a Node tool on Miroir (a CLI command, a test platform, a server) without copying wiring code, as an application developer, I can call `startMiroirNode(config, { stores })` and get a domain controller ready for `bootEnvironment`.
- **G2 — Start a React client in one call.** In order to show Miroir reports in my own React application, as an application developer, I can call `startMiroirClient(config, { stores })` and pass what it returns to `MiroirContextReactProvider` and `LocalCacheProvider`.
- **G3 — Choose my stores.** In order to ship only the store packages (and database drivers) my application uses, as an application developer, I pass the store startups to the call; the call imports none.
- **G4 — Keep the existing hosts working.** In order to keep using the CLI, the server, Electron, the sandbox and the standalone app, as a Miroir user, I see no change of behaviour once they move onto the two calls.

## 2. Non-goals

- Test helpers that build domain controllers by hand: `miroir-standalone-app/src/miroir-fwk/4-tests/setupMiroirTest.ts` (it picks the local cache implementation through `MIROIR_TEST_LOCAL_CACHE`, #446, and gives the server's store manager to the client domain controller), `IntegrationTestSession.ts`, `miroir-ai/tests/integration/aiTestPlatform.ts`, the `miroir-env` tests, and the model extraction scripts (`miroir-example-library/scripts/extract-library-model.ts`, `miroir-example-postgres/scripts/extract-postgresManager-model.ts`). #641 moves them onto the two calls one by one. Exception: `miroir-server-library/tests/support/serverTestPlatform.ts` (#636) mirrors `server.ts` and moves with it.
- Renaming to `@miroir-framework/*` and re-exporting `startMiroirNode` from `@miroir-framework/server` (#621 I6, D8-a).
- The store peer dependencies of `miroir-mcp`, which only its test-only `startup/storeStartup.ts` used (#621 I5, manifest hygiene).
- Moving `registerStoreOnDemand` out of Electron, or making the CLI load stores on demand: each host keeps its way of choosing stores (§4.3).
- `bootEnvironment` and the opening of deployments: they stay with the host, which knows its environment (`miroir-env` is not a dependency of the local cache).
- A one-call path for the zustand local cache experiment (`miroir-localcache-zustand`): D8-a keeps it a workspace package, off the published path (D2).

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1 Home of the Node call | **D1-a. `miroir-localcache-redux/node`**: the package that already owns `setupMiroirDomainController` and its React-free entry | G1, G3 |
| D2 Home of the client call | **D2-a. `miroir-react`, on a shared core in `miroir-localcache-redux`**: one public client package (D8-a) and one implementation of the wiring | G2 |
| D3 How stores are passed | **D3-a. `stores: StoreSectionStartup[]`**: the startup functions every store package already exports, typed in core | G3 |
| D4 What the call owns | **D4-a. core startup, stores, optional loggers, context, clients, domain controllers, the emulated server's wiring; not the host's own startups nor the environment boot** | G1, G2, G4 |
| D5 Configuration and result | **D5-a. either config type in, one result type out, with the emulated server as an optional part and no field whose meaning depends on the mode** | G1, G2, G4 |

**Rationale:** the wiring is the same on both sides (§4.1, §4.2). The differences are: the fetch function, the custom REST client of the Electron renderer, the process capabilities the clients ask for, and host-specific hooks on the emulated server. One shared function with two thin entry points removes the four copies without forcing a Node host to load React, or a client to load the Node entry.

### D1 — Where does `startMiroirNode` live?

**Status:** Accepted: D1-a. **Serves:** G1, G3.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. `miroir-localcache-redux/node`** ★ | next to `setupMiroirDomainController`, in the entry without React (#337) | every Node host already depends on it (CLI, MCP, server, Electron); no new dependency; D8-a re-exports it from `@miroir-framework/server` in I6 | the name says "local cache" for a platform call until I6 renames |
| D1-b. `miroir-server-library` | next to `createMiroirServerApp` | the future `@miroir-framework/server` name | the library depends on `miroir-mcp`, so the MCP tests' use would be a cycle; the CLI would depend on Express to start a domain controller |
| D1-c. `miroir-core` | in core's startup | one package for all | core does not depend on the local cache (layering: the cache implements core's interfaces) |

**Decision:** D1-a.

### D2 — Where does `startMiroirClient` live?

**Status:** Accepted: D2-a. **Serves:** G2.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. `miroir-react`, on a shared `startMiroirPlatform` exported by both entries of `miroir-localcache-redux`** ★ | `startMiroirPlatform` builds context, clients and domain controllers; `startMiroirNode` and `startMiroirClient` add their side's defaults; `miroir-react` imports it through `src/miroir-localcache-imports.ts`, like every other cache symbol | the client imports one package (D8-a: the cache is bundled into react); one implementation of the wiring | `miroir-react` gains a non-UI export; the call is tied to the redux cache |
| D2-b. `miroir-localcache-redux` main entry | the client call next to the Node one | no new export in react | a client must know about the cache package, which D8-a hides |
| D2-c. Two independent functions | each side keeps its own wiring | no shared code to design | the copy this issue removes comes back |
| D2-d. Inject `setupMiroirDomainController` | the core takes the cache's builder as a parameter | zustand could use the same call | a parameter every caller passes for an experiment D8-a keeps off the published path |

**Decision:** D2-a. `startMiroirPlatform` stays exported so that hosts with unusual needs (tests) can use it, but the documented calls are the two side calls. The zustand cache keeps its own `setupMiroirDomainController` (`miroir-localcache-zustand/src/setupTools.ts:26`) and no one-call path.

### D3 — How are stores passed?

**Status:** Accepted: D3-a. **Serves:** G3.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. `stores: StoreSectionStartup[]`** ★ | each entry is `(configurationService: ConfigurationServiceInner) => void`, like `miroirFileSystemStoreSectionStartup`; the call runs each on `ConfigurationService.configurationService` after `miroirCoreStartup()` | matches the existing store exports; a host that loads stores lazily passes a function that registers on demand (Electron's `registerStoreOnDemand`) or the startups it loaded (CLI) | the bundled store's startup takes a second argument, so the host wraps it in a closure |
| D3-b. store type names (`["filesystem", "sql"]`) | the call imports the package for each name | shortest call | the call imports store packages, which G3 rules out |

**Decision:** D3-a. `StoreSectionStartup` does not exist as a shared type today: Electron has a local one (`storesOnDemand.ts:10`) and the CLI its own `StoreStartup` (`storeStartup.ts:35`). It becomes a core interface (`miroir-core`, exported from `index.ts`), and both local copies use it. The CLI's `initializeStoreStartup` registers the stores itself and returns nothing: it becomes `loadStoreStartups(config): Promise<StoreSectionStartup[]>`, keeping its early "is it installed?" error.

### D4 — What does the call own?

**Status:** Accepted: D4-a. **Serves:** G1, G2, G4.

| Step | Owned by the call | Why |
|---|---|---|
| host startups (`miroirAppStartup` in the standalone app, `miroirDemoAppStartup` in the sandbox) and `registerTestImplementation({ expect })` | no: the host runs them before the call | host packages; today they run before `miroirCoreStartup` (standalone `index.tsx:398`, sandbox `index.tsx:128–130`), and they still do |
| `miroirCoreStartup()` | yes, first | it registers the core package (`registerPackageConfiguration` appends to a list nobody reads, `ConfigurationService.ts:53`) and one action implementation, so a second call by a host or a test is harmless; Electron's call moves from `setupIpcServer` (`ipcServerSetup.ts:81`) into the call, through `bootElectronServer` |
| store registration | yes, from `stores`, after `miroirCoreStartup` | D3 |
| loggers | Node call only, when `loggers: { factory, options }` is passed, after the stores, awaited | the CLI and the server start them at that point (`platform.ts:95`, not awaited; `server.ts:344`, awaited: `startRegisteredLoggers` is async, `MiroirLoggerFactory.ts:224`); awaiting is the safe choice for both. The clients start theirs at module level, before any startup (standalone `index.tsx:160`, sandbox `index.tsx:113`), and keep doing so: they pass their activity tracker and event service instead. The Electron main process starts none, and keeps not doing it |
| activity tracker, event service | created unless passed | the clients create them at module level, for their loggers |
| `MiroirContext`, REST client, store managers, domain controllers | yes | the copied part (§4.1) |
| emulated server wiring (`setServerDomainController`, `setPersistenceStoreControllerManager`) | yes | identical in every copy |
| host hooks on the emulated server | through `configureEmulatedServer(server)`, run right after the wiring and before the process capabilities | the standalone app's test identity and access directories (`index.tsx:307–330`), set before `setProcessCapabilities` (331–340) |
| process capabilities | client call only: `setProcessCapabilities(getProcessCapabilities(...))` on the stub when there is one, then `fetchProcessCapabilities(restClient)` into both domain controllers | both clients do it (§4.2) |
| the Electron main process's own stub, gates and capabilities (`ipcServerSetup.ts:102–115`) | no | it serves the renderer over IPC, from the host's server configuration; it stays in `setupIpcServer` |
| the CLI's and server's authentication gate | no | the host's command line and environment |
| environment boot, opening deployments, secrets | no | the host's environment (`miroir-env`) |

### D5 — Configuration and result shapes

**Status:** Accepted: D5-a. **Serves:** G1, G2, G4.

The call takes `MiroirConfigClient | MiroirConfigServer` and switches on `miroirConfigType`:

| Config | Domain controller | Emulated server | REST client | Root URL of the persistence client |
|---|---|---|---|---|
| `server` (miroir-server, Electron main) | `local`, on a manager rooted at `server.filesystemDeploymentRootDirectory` | none | none | none |
| `client`, `emulateServer: true` (CLI, MCP tests, sandbox) | `remote`, through `RestClientStub` | `local` domain controller on a manager rooted at `client.filesystemDeploymentRootDirectory`, behind the stub | the stub | `client.rootApiUrl` |
| `client`, `emulateServer: false` (web client) | `remote`, through `RestClient(fetch)` | none | `RestClient` | `client.serverConfig.rootApiUrl` |
| `client` with `restClient` passed (Electron renderer, which receives an `emulateServer: true` config, `environmentState.ts:409`) | `remote`, through the passed client | none | the passed client | `emulateServer ? rootApiUrl : serverConfig.rootApiUrl` (`index.tsx:248–251`) |

`fetch` defaults to `globalThis.fetch.bind(globalThis)`: `RestClient` calls `this.customFetch(...)` (`RestClient.ts:52`, 87), and an unbound `window.fetch` throws "Illegal invocation" in a browser. The standalone app passes `window.fetch.bind(window)` today; with the default it may stop passing one. The client call fetches the process capabilities from the relative `/capabilities` (the stub, a passed client, a browser on the server's origin or behind the Vite proxy), and from `resolveProcessCapabilitiesUrl(serverConfig.rootApiUrl)` for a real server outside a browser, where Node `fetch` refuses relative URLs (`setupMiroirTest.ts:154–157`). `externalServiceClient` passes through to `setupMiroirDomainController` for every domain controller the call builds (the server uses it for rotated secrets).

Result (one type):

```ts
type MiroirPlatform = {
  miroirContext: MiroirContext;
  /** local for a server config, remote for a client config */
  domainController: DomainControllerInterface;
  /** server config only: the manager of the local domain controller */
  persistenceStoreControllerManager?: PersistenceStoreControllerManager;
  /** client config only */
  restClient?: RestClientInterface;
  /** client config with emulateServer: true and no passed restClient */
  emulatedServer?: {
    domainController: DomainControllerInterface;
    persistenceStoreControllerManager: PersistenceStoreControllerManager;
    restClientStub: RestClientStub;
  };
};
// startMiroirClient returns MiroirPlatform & { processCapabilities: ProcessCapabilities }
```

The root-less manager of a client's remote domain controller is not returned: no host reads it, and returning it under the same name as the server's rooted manager would hand the sandbox the wrong manager without an error. Today's copies also return `persistenceStoreControllerManagerForClient`, `localCache` (available as `domainController.getLocalCache()`) and `miroirContext`; only the last is read.

What each host reads:

| Host | Fields |
|---|---|
| CLI | `domainController`; `emulatedServer.domainController` and `emulatedServer.restClientStub` for its authentication gate (`authentication.ts:58–68`) |
| MCP tests | `domainController` |
| server | `domainController`, `persistenceStoreControllerManager` (passed to `createMiroirServerApp`), `miroirContext` |
| Electron main | `domainController`, `persistenceStoreControllerManager`, `miroirContext` (returned by `bootElectronServer`) |
| sandbox | `domainController`, `miroirContext`, `processCapabilities`, `emulatedServer.domainController` (opens the stores) and `emulatedServer.persistenceStoreControllerManager` (`migrateAdminToIndexedDbIfNeeded`, `index.tsx:208`) |
| standalone app | `domainController`, `miroirContext`, `processCapabilities`, `emulatedServer?.domainController` (the web client's server-side controller when emulated; replaced by the IPC proxy in Electron) |

| Option | Pros | Cons |
|---|---|---|
| **D5-a. one result type, optional `emulatedServer`, mode-independent field meanings** ★ | the CLI's larger shape (`domainControllerForServer`, `restClientStub`, analysis #621 §4.6) is kept, grouped; every field means one thing | optional fields to check |
| D5-b. one function per mode (`startMiroirServer`, `startMiroirEmulated`, …) | exact types | four names where the epic asks for one per side |

---

## 4. Current state

### 4.1 Node hosts (misaligned)

| Host | Where | What it builds |
|---|---|---|
| CLI | `miroir-cli/src/platform.ts:90–106` calls `miroirCoreStartup`, `initializeStoreStartup` (`startup/storeStartup.ts`, 67 lines), `startRegisteredLoggers` (not awaited), then `setupMiroirPlatform` (`startup/setup.ts`, 113 lines) | client config with `emulateServer: true` (`environmentClientConfig`): remote domain controller, stub, local server domain controller; reads `domainController`, `domainControllerForServer`, `restClientStub` (`setup.ts:102–110`) |
| MCP | `miroir-mcp/src/startup/setup.ts` (109 lines) and `storeStartup.ts` (67 lines) | the CLI copy minus `domainControllerForServer` and `restClientStub` in the result (its `domainControllerForServer` is scoped inside the `if`). Since #345 slice 2 `miroir-mcp` is a library with no binary: `src/index.ts` exports neither file, and only `tests/integration/mcpTestPlatform.ts` and `tests/unit/mcpPackageSurface.unit.test.ts` (lines 12, 23–29: the store detection test) import them |
| server | `miroir-server/src/server.ts:335–381`, at module level | `miroirCoreStartup`, four static store startups, `startRegisteredLoggers` (awaited), `MiroirContext`, one `PersistenceStoreControllerManager` on `server.filesystemDeploymentRootDirectory`, `setupMiroirDomainController(local, externalServiceClient)` |
| Electron main | `ipcServerSetup.ts:81` calls `miroirCoreStartup`; `environmentBoot.ts:91–113` (`bootElectronServer`) registers four stores with `registerStoreOnDemand` (`storesOnDemand.ts`), builds `MiroirContext`, one manager and `setupMiroirDomainController(local)`; after the boot, `setupIpcServer` builds its own `RestClientStub`, gates and capabilities (`ipcServerSetup.ts:102–115`) | no logger start in the main process; both Electron integ tests call `miroirCoreStartup` themselves (`environmentBoot.integ.test.ts:42`, `electronIpcAuth.263.phase5.integ.test.ts:77`) |

`diff` of the two `setup.ts` copies: formatting, logger name, error message prefix, a comment, and the two extra result fields of the CLI. Both also return `persistenceStoreControllerManagerForClient`, `persistenceStoreControllerManagerForServer`, `localCache` and `miroirContext`, which no caller reads. The two `storeStartup.ts` differ only in `packageName`.

### 4.2 React clients (misaligned)

| Host | Where | Differences from the CLI copy |
|---|---|---|
| standalone app | `index.tsx:212–354` exports its own `setupMiroirPlatform`, called through `setupClient` (357–384) from `startWebApp` (386–); `startWebApp` calls `miroirAppStartup`, `miroirCoreStartup`, `miroirIndexedDbStoreSectionStartup` (398–400); loggers start at module level (160) | `options.customRestClient` (the Electron renderer's `ElectronRestClient`, no emulated server, 244–253); `RestClient(window.fetch.bind(window))`; on the stub: `setIdentityDirectory` and `setAccessDirectory` from Admin test users (307–330), then `setProcessCapabilities(getProcessCapabilities(...))` (331–340); after: `fetchProcessCapabilities(restClient)` into both domain controllers; `registerTestImplementation({ expect })` |
| sandbox | `index.tsx:110–202`, inline in `startDemoApp`; loggers at module level (113); `registerTestImplementation` and `miroirDemoAppStartup` before `miroirCoreStartup` (128–131) | always emulated (`demoMiroirConfig`); stores: bundled (with `demoBundledData`) and IndexedDB; `setProcessCapabilities` on the stub and `fetchProcessCapabilities`, like the standalone app; no identity directories; after the call it migrates Admin with the server manager (208) and opens stores on the server domain controller (241) |

The web client always runs with `emulateServer: false` (`miroir-env/src/environmentState.ts:375`); the emulated branch of the standalone app's copy is reached only when a host config asks for it.

### 4.3 How each host chooses its stores

| Host | Mechanism | Kept |
|---|---|---|
| CLI | `requiredStoreTypes(config)` then a dynamic `import()` per type, failing early with "is it installed?" | yes: the loader returns the startups and the CLI passes them (D3) |
| MCP tests | the same (copy) | the copy goes; the tests pass `[miroirFileSystemStoreSectionStartup]` or the stores of their test environment |
| server | four static imports | yes: passed as `stores` |
| Electron main | `registerStoreOnDemand` per type (#370) | yes: passed as closures |
| standalone app | IndexedDB, static | yes |
| sandbox | bundled (two arguments) and IndexedDB | yes, the bundled one wrapped in a closure |

### 4.4 Tests that cover each host today

Nonreg tiers from `scripts/nonreg-manifest.json`: `nonreg:unit` runs only `unit` steps; `nonreg:filesystem` runs `unit` and `default`.

| Host | Tests | Runs before merge |
|---|---|---|
| CLI | `miroir-cli/tests/cli.integ.test.ts`, nonreg `unit-345-cli` (tier `default`) | locally, nonreg |
| MCP | `miroir-mcp/tests/**`, nonreg `unit-345-mcp` (`default`) | locally, nonreg |
| server | the release smoke, nonreg `build-636-server-release` (`default`): the only test that runs `server.ts`'s module-level startup; `unit-636-server-library` (`default`) runs its test twin `serverTestPlatform.ts` | locally, nonreg |
| Electron main | `environmentBoot.integ.test.ts`, `electronIpcAuth.263.phase5`, nonreg `unit-345-electron` (`unit`) | locally, nonreg |
| standalone app, web | `npm run build -w miroir-standalone-app` (CI `bundle report + guards`); web self-test `npm run selfTest -w miroir-standalone-app -- --serve` loads `index.tsx` against a release server | the build yes; the self-test only after merge: `.github/workflows/self-test.yml` runs on push to `_integration` and on demand, not on pull requests. Run it locally as a gate |
| standalone app, Electron renderer (`customRestClient` branch) | the Electron self-test job of `self-test.yml` | after merge only |
| sandbox | nonreg `build-633-sandbox` (`unit`, vite build only) | locally, nonreg |

So the client call needs its own test in Node, on every mode it builds (emulated with `configureEmulatedServer`, real server, passed client), before the hosts move onto it; the epic's I4 phase 2 also asks for a standalone UI smoke, which the local web self-test provides.

## 5. Key reuse

| Piece | Location |
|-------|----------|
| `setupMiroirDomainController` | `miroir-localcache-redux/src/sagaTools.ts:28` (both entries) |
| `RestPersistenceClientAndRestClient` | `miroir-localcache-redux/src/4_services/persistence/` |
| `RestClient`, `RestClientStub`, `PersistenceStoreControllerManager`, `MiroirContext`, `ConfigurationServiceInner` | `miroir-core` |
| `fetchProcessCapabilities`, `getProcessCapabilities` | `miroir-core/src/4_services/ProcessCapabilitiesHttp.ts:57`, `miroir-core` |
| store startups | `miroir-store-{filesystem,indexedDb,postgres,mongodb}/src/startup.ts`, `miroir-store-bundled/src/startup.ts:46` (two arguments) |
| `registerStoreOnDemand` | `miroir-standalone-app-electron/src/storesOnDemand.ts:20` |
| CLI store loader | `miroir-cli/src/startup/storeStartup.ts` |
| cache import switch of `miroir-react` | `miroir-react/src/miroir-localcache-imports.ts` |
| Library test data | deployment `f714bb2f-a12d-4e71-a03b-74dcedea6eb4`, application `5af03c98-fe5e-490b-b08f-e1230971c57f`, Book entity `e8ba151b-d68e-4cc3-9a83-3459d309ccf5` |

## 6. Risks

| Risk | Mitigation |
|---|---|
| Order changes alter early log output | Node hosts keep core startup, stores, loggers, platform; clients keep their module-level logger start and pass their tracker and event service |
| The CLI now awaits its logger start | `startRegisteredLoggers` resolves once the loggers exist; the CLI's first log lines come after the call |
| The server's `externalServiceClient` closure refers to `domainController` before it exists | it is called only later (rotated secrets); the closure reads the variable at call time, as today |
| `miroir-react` pulls the Node entry | `startMiroirClient` imports the main entry of the cache only, through `miroir-localcache-imports.ts`; the bundle guards (#326, CI job `bundle report + guards`) check the standalone app and Electron bundles |
| A client consumer passes no `fetch` | the default is bound (D5); a Node test cannot show the browser's "Illegal invocation", so the web self-test proves it |
| The standalone app's branches run only after merge in CI | the Node test of the client call covers the three modes; the web self-test runs locally before the PR; the Electron renderer branch is a passed client, covered in the Node test |

## Revision history

- **v1:** first version.
- **v2 (adversarial review):** pre-merge coverage made explicit (self-test runs after merge only; Node test of the client call on every mode); bound default `fetch`; client loggers stay at module level, the Node call awaits its loggers; result type without mode-dependent fields, and a host-to-field matrix; host startups and `registerTestImplementation` listed as host steps before the call; Electron's `miroirCoreStartup` moves into the call; Electron's IPC stub stays with the host; zustand and D2-d recorded; D1-b cycle; `StoreSectionStartup` becomes a core type and the CLI loader returns startups; `configureEmulatedServer` order and the passed client's root URL; nonreg tiers; extraction scripts and the follow-up issue in the non-goals; unread fields of today's copies.
