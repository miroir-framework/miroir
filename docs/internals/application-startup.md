# Application startup (cache load)

How the client DomainController fills Redux after the process is up. Operators choose `emulateServer` and store backends in `miroirConfig`; they do not set `persistenceStoreAccessMode` in JSON. For that distinction and for process feature flags, see [Data architecture: deployments](../reference/data-architecture-deployments.md#application-startup-sequence) and [Process capabilities](../reference/process-capabilities.md).

## Domain controller pair

When `emulateServer: true`, two domain controllers exist in one process:

| Controller | `persistenceStoreAccessMode` | Role |
|---|---|---|
| CLIENT | `"remote"` | Redux / Zustand local cache. Persistence calls leave through `RestClientStub` (or HTTP / IPC in other shapes). |
| SERVER | `"local"` | Owns filesystem, IndexedDB, bundled, SQL, Mongo factories. Reads and writes. |

`emulateServer: false` keeps only the remote client in the browser; the `local` controller lives in `miroir-server`.

## `fetchMiroirAndAppConfigurations` flow

Called from `DemoInitializer` (sandbox) or `usePageConfiguration({ autoFetchOnMount: true })` (standalone); both are in `miroir-react` since #633, so every client starts the same way:

```
Step 1: Rollback Admin
  CLIENT.handleAction("rollback", application=adminSelfApplication)
  → loadConfigurationFromPersistenceStore(admin, ADMIN_DEPLOYMENT_UUID)
    → Read MODEL section for all metaModelEntities
       (Entity, EntityVersion, Report, Menu, SelfApplication, SelfApplicationVersion,
        SelfApplicationModelBranch, EndpointVersion, QueryVersion, Runner, Theme)
    → Read DATA section for all application-specific entities
       (Application, Deployment, ViewParams, StoreBasedConfiguration, Import, …)
    → loadNewInstancesInLocalCache → CLIENT Redux populated

Step 2: Query deployments
  CLIENT.handleQueryTemplateActionForServerONLY(query for Deployment instances, section="data")
  → Returns [deployment_Admin, deployment_Miroir, deployment_Library, …]
    each with a `configuration` field (StoreUnitConfiguration per section)

Step 3: For each non-admin deployment:
  For each deployment (e.g. Miroir, Library):
    a. CLIENT.handleAction("storeManagementAction_openStore", configuration=deployment.configuration)
       → SERVER opens the store (idempotent if already open)
    b. CLIENT.handleAction("rollback", application=deployment.selfApplication)
       → loadConfigurationFromPersistenceStore(miroir/app, deploymentUuid)
         → For Miroir: read miroirModelEntities (Entity MetaModel peers) from MODEL
                        read non-Version History concepts from DATA
                        read Version History from MODELVERSION when section is configured
         → For App: read metaModelEntities from MODEL, read app entities from DATA
       → CLIENT Redux further populated
```

After all three steps, CLIENT Redux contains:

- All admin entities / reports / menus / configurations
- All Miroir meta-model instances
- All application domain instances

## `loadConfigurationFromPersistenceStore` detail

```typescript
// In DomainController.ts
function loadConfigurationFromPersistenceStore(applicationUuid, deploymentUuid, deploymentMap):
  // 1. Read Entity instances from model section
  entities = callPersistenceAction("RestPersistenceAction_read", { section: "model", parentUuid: entityEntity.uuid })

  if (deploymentUuid == MIROIR_DEPLOYMENT_UUID):
    modelEntitiesToFetch = miroirModelEntities  // Entity MetaModel peers (not EntityVersion)
  else:
    modelEntitiesToFetch = metaModelEntities    // all framework-level entities

  // 2. Read model section for each modelEntity
  for entity in modelEntitiesToFetch:
    instances = callPersistenceAction("RestPersistenceAction_read", { section: "model", parentUuid: entity.uuid })

  // 3. Read data section for each app entity (from step 1)
  dataEntitiesToFetch = entities found in step 1
  for entity in dataEntitiesToFetch:
    instances = callPersistenceAction("RestPersistenceAction_read", { section: "data", parentUuid: entity.uuid })

  // 4. Load all into CLIENT local cache (Redux)
  callLocalCacheAction("loadNewInstancesInLocalCache", allInstances)
  callLocalCacheAction("rollback")
```

## Key source files

| File | Role |
|---|---|
| [DomainController.ts](../../packages/miroir-core/src/3_controllers/DomainController.ts) | `loadConfigurationFromPersistenceStore`, `handleModelAction("rollback")` |
| [Model.ts](../../packages/miroir-core/src/1_core/Model.ts) | `metaModelEntities`, `miroirModelEntities` |
| [ConfigurationService.ts](../../packages/miroir-react/src/services/ConfigurationService.ts) | `fetchMiroirAndAppConfigurations` |
| [usePageConfiguration.ts](../../packages/miroir-react/src/services/usePageConfiguration.ts) | Fetches the configurations on mount; marks `configurationsLoaded` through the load-timing sink |
| [MiroirShellHostContext.tsx](../../packages/miroir-react/src/contexts/MiroirShellHostContext.tsx) | Host features of the shell (#633): `runMcpTool`, `requestLoginToken`, `assistantPanel` |

## The shell and its host (#633)

The app shell (`RootComponent`, `AppBar`, `PageDispatcher`, the generic pages, the runners, the login page) is in `miroir-react`. A client builds its page from the package and gives it the features the package cannot import:

| Wiring | Standalone app | Sandbox |
|---|---|---|
| `MiroirShellHostProvider` | `appShellHost`: MCP tool calls (`miroir-mcp/client`, lazy), login over HTTP or Electron IPC, `assistantPanel` = lazy `AgentsCopilotKit` | none: no MCP, login over HTTP, no assistant |
| `ReportSectionRenderersProvider` | graph, model diagram (`miroir-diagram-class`, lazy), MiroirTest | model diagram (`miroir-diagram-class`, lazy) |
| `setLoadTimingMarkSink` | the load-timing recorder | none |

A missing slot falls back to its default (`useMiroirShellHost`): MCP calls answer `FeatureUnavailable`, login goes to `/auth/login` over HTTP, no assistant is mounted. The stored runner section is a built-in renderer (`defaultReportSectionRenderers`). The lint block of `eslint.config.mjs` for `packages/miroir-react/src` forbids importing CopilotKit, Electron, `miroir-mcp`, `miroir-diagram-class` or the app.

## One startup call per side (#639)

Hosts no longer build the platform by hand. They pass their configuration and the store startups they use:

```ts
// Node: CLI, server, Electron main process, test platforms
import { startMiroirNode } from "miroir-localcache-redux/node";
const { domainController, emulatedServer, persistenceStoreControllerManager } = await startMiroirNode(config, {
  stores: [miroirFileSystemStoreSectionStartup],
  loggers: { factory: loglevelnext, options: loggerOptions }, // optional
});

// React client: sandbox, standalone app
import { startMiroirClient } from "miroir-react";
const { domainController, miroirContext, processCapabilities } = await startMiroirClient(config, { stores: [miroirIndexedDbStoreSectionStartup] });
```

The call runs `miroirCoreStartup()`, the store startups, the optional logger start, then builds `MiroirContext`, the REST client, the store managers and the domain controllers. It switches on `miroirConfigType`:

| Configuration | `domainController` | Other fields |
|---|---|---|
| `server` | `local` | `persistenceStoreControllerManager`, rooted at `server.filesystemDeploymentRootDirectory` |
| `client`, `emulateServer: true` | `remote`, through a `RestClientStub` | `restClient` (the stub), `emulatedServer: { domainController, persistenceStoreControllerManager, restClientStub }` |
| `client`, `emulateServer: false` | `remote`, through `RestClient(fetch)` | `restClient` |
| `client` with a `restClient` option (Electron renderer) | `remote`, through that client | `restClient` |

`configureEmulatedServer(emulatedServer)` runs once the stub is wired, before anything else uses it (the standalone app sets its test identity and access directories there). `startMiroirClient` then sets the process capabilities on the stub and fetches them into both domain controllers; `fetch` defaults to the bound global fetch.

What stays with the host: its own startups (`miroirAppStartup`, `registerTestImplementation`), module-level loggers on the client side, the environment boot (`bootEnvironment`), authentication gates, secrets, and Electron's IPC stub. Neither call imports a store package or reads an environment variable (`scripts/tests/test_startup_calls_boundaries.py`). Test helpers that still build domain controllers by hand (`setupMiroirTest.ts` and others) are listed in the analysis of #639.

## The server and its library (#636)

On the server side, Miroir's HTTP surface comes from [`miroir-server-library`](../../packages/miroir-server-library/README.md). `createMiroirServerApp` takes a running domain controller and returns an Express app that does not listen: REST behind the authentication gate, the authentication and capabilities routes, `/mcp`, and optionally assets, an assistant route and a client folder. [`server.ts`](../../packages/miroir-server/src/server.ts) is a host of it:

| `miroir-server` (binary) | `miroir-server-library` |
|---|---|
| command line, environment or configuration file, log preset | Express app, CORS, BigInt replacer and reviver, body parser |
| ports, CORS origins, authentication switches, token secret | `/auth/status`, `/capabilities`, `/auth/login`, `/auth/change-password` |
| `startMiroirNode` (#639: stores, `MiroirContext`, domain controller), boot, secrets | REST loop over `restServerDefaultHandlers`, behind the shared gate |
| `getProcessCapabilities`, `setProcessCapabilities` | MCP tool registry, `/mcp` on the app, the MCP server handle |
| TLS, the asset and client paths (ncc relocates them into `release/`) | assets, the `assistantRoute` slot, the client folder and its catch-all |
| CopilotKit through the `assistantRoute` slot, the dev `GET /`, `listen`, `mcpServer.run` | |

The library imports no store, driver, `miroir-env`, `miroir-ai` or CopilotKit, and its build fails if one appears. The release bundle inlines it, so it is built before `build:server`.
