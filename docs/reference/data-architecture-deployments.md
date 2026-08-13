# Miroir Data Architecture: Deployments and Storage Backends

## Overview

A Miroir application is always composed of at least two **Deployments**:

| Deployment | UUID | Role |
|---|---|---|
| Admin | `18db21bf-f8d3-4f6a-8296-84b69f6dc48b` | Hosts meta-configuration: the list of deployments, their store configurations, the admin application itself (entities, reports, menus) |
| Miroir | `10ff36f2-50a3-48d8-b80f-e48e5d13af8e` | Hosts the Miroir meta-model bootstrap (**Entity**) plus framework-level concepts; Version History instances live in **`miroir_modelVersion/`** assets (and the optional `modelVersion` store section when enabled) |
| App (optional) | e.g. `f714bb2f-a12d-4e71-a03b-74dcedea6eb4` | Hosts a user-defined application (e.g. Library). One or more per installation. |

Each deployment is divided into **sections** (three for unversioned deployments; four when version history is enabled):

| Section | Purpose |
|---|---|
| `admin` | Low-level administration store: list of schemas/collections managed by this deployment. Used internally by the store backend. |
| `model` | Live model definitions (Entity; for non-Miroir apps also EntityVersion and other framework model concepts) and, for non-Miroir deployments, model-level instances (Reports, Menus, Queries, SelfApplication, etc.) |
| `data` | Domain data instances (Application, Deployment, Book, Author, …) |
| `modelVersion` | **Optional.** Version-history snapshots written by `freezeApplicationVersion`: SelfApplicationVersion, EntityVersion / QueryVersion / … rows, and ApplicationVersion cross rows. Not loaded during ordinary bootstrap/rollback of the live model. |

For **versioned-internal** applications (`versioningEnabled: true`), the deployment configuration must include a writable `modelVersion` section distinct from `model`. Unversioned deployments omit it; any request targeting `modelVersion` without configuration returns an explicit error (no fallback to `model` or `data`).

See also: [Bundles and Versioning](../getting-started/bundles-and-versioning.md) (`versioned-internal` vs `versioned-external`).

### Versioning mode matrix

| `versioningMode` | `versioningEnabled` | Store sections | Version History source |
|---|---|---|---|
| *(absent)* | `false` | `admin`, `model`, `data` | None — live model only |
| `versioned-internal` | `true` | `admin`, `model`, `data`, **`modelVersion`** (writable) | Miroir `modelVersion` section; git assets under `*_modelVersion/` when shipped |
| `versioned-external` | `true` | `admin`, `model`, `data` (no writable `modelVersion`) | External Git / VCS; current model in `*_model/` assets |
| bundled Miroir profile | `true` on SelfApplication row | `admin`, `model`, `data` only | **None in bundled store** — demo is versioning-free |

Legacy deployments with `versioningEnabled: true` and no `versioningMode` field behave as **`versioned-internal`**.

### Deployment package asset folders

Each deployment package under `packages/miroir-test-app_deployment-*/assets/` uses a prefix (`miroir_`, `library_`, `admin_`, …):

| Asset directory | Maps to store section | Contents |
|---|---|---|
| `{prefix}_model/` | `model` | Live Entity rows, Reports, Queries, Menus, SelfApplication, … |
| `{prefix}_data/` | `data` | Domain / application data instances |
| `{prefix}_modelVersion/` | `modelVersion` | **Optional.** Version History snapshots (EntityVersion, SelfApplicationVersion, ApplicationVersionCross*, …) |
| `{prefix}_admin/` (admin package) | `admin` / nested admin model+data | Admin meta-configuration |

Only **`miroir-test-app_deployment-miroir`** currently ships a `{prefix}_modelVersion/` tree (`miroir_modelVersion/`). Other deployment packages still colocate some Version History rows under `{prefix}_model/` — see [deployment inventory](../../code-helpers/features/234-FEATURE-versioning-modes-and-asset-migration/deployment-inventory.md) for relocation follow-ups.

---

## MiroirConfig Structure

Every application instance reads a `MiroirConfigClient` at startup. There are two variants:

### 1. Remote Server (`emulateServer: false`)

```json
{
  "client": {
    "emulateServer": false,
    "serverConfig": {
      "rootApiUrl": "https://localhost:3080",
      "storeSectionConfiguration": {
        "<deploymentUuid>": { "admin": {...}, "model": {...}, "data": {...} }
      }
    }
  }
}
```

HTTP calls go to a real `miroir-server` process. The server owns the persistence stores (SQL, filesystem). The client only has a Redux local cache.

### 2. Emulated Server (`emulateServer: true`)

```json
{
  "client": {
    "emulateServer": true,
    "rootApiUrl": "http://localhost:3080",
    "filesystemDeploymentRootDirectory": "/path/to/root",
    "deploymentStorageConfig": {
      "<deploymentUuid>": { "admin": {...}, "model": {...}, "data": {...} }
    }
  }
}
```

A `RestClientStub` intercepts all HTTP-shaped calls and routes them directly to a **server-side DomainController** running in the same process. No network is involved. The `filesystemDeploymentRootDirectory` is the root for relative filesystem paths.

---

## Storage Backend Types (`emulatedServerType`)

Each section (`admin`, `model`, `data`, and optionally `modelVersion`) of a deployment independently selects a backend via `emulatedServerType`.

### `filesystem`

```json
{ "emulatedServerType": "filesystem", "directory": "./tests/tmp/miroir_model" }
```

- Used in test mode and electron desktop app.
- JSON files stored per-entity in `<directory>/<entityUuid>/<instanceUuid>.json`.
- The admin section uses a separate admin directory; model and data each have their own directories.

### `indexedDb`

```json
{ "emulatedServerType": "indexedDb", "indexedDbName": "indexedDb-miroir-uuid" }
```

- Used in browser-based tests and some mixed configurations.
- Persists to browser's IndexedDB. Data survives page reload but is scoped to the origin.

### `sql` (PostgreSQL)

```json
{
  "emulatedServerType": "sql",
  "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
  "schema": "miroir",
  "forceNullOptionalAttributeToUndefined": true
}
```

- Used in the real server (with `emulateServer: false`) and integration test scenarios.
- Each deployment section maps to a PostgreSQL schema.
- The admin section typically uses a dedicated `miroirAdmin` schema.

### `bundled`

```json
{ "emulatedServerType": "bundled", "deploymentUuid": "10ff36f2-..." }
```

- Used exclusively in the `miroir-sandbox` demo SPA.
- All data is statically imported at build time from the deployment packages (`miroir-test-app_deployment-miroir`, `miroir-test-app_deployment-admin`).
- Read-only: no writes are persisted.
- **No Version History in bundled Miroir:** Version History parent UUIDs are excluded from bundled `model` and `data`; the Miroir bundled config has **no** `modelVersion` key. Freeze and history browse are unavailable in the sandbox demo.
- **Cannot host writable `modelVersion` history:** if a bundled deployment declares a `modelVersion` section, freeze/history writes fail with an explicit read-only error. Use filesystem, IndexedDB, MongoDB, or SQL for versioned-internal applications with persistence.
- Registered at startup via `miroirBundledStoreSectionStartup(configurationService, bundledData)`.

### `modelVersion` (version history, optional)

Present only on deployments with `versioningEnabled: true`. Uses the same backend types as `model` and `data`, but must point at storage **separate** from the live model.

**Which entity families use it:** freeze persists historical rows for meta-model Entity types classified as version history — e.g. `SelfApplicationVersion`, `EntityVersion`, `QueryVersion`, and `ApplicationVersionCross*` link tables. In the bootstrap model these Entity rows carry **`scope: "versioning"`** (see [Entity API — scope](../reference/api/entity.md#meta-model-classification-scope--logicaldatamodel)). Runtime routing uses the `versionHistoryEntityUuids` registry in `Model.ts`, not a dynamic read of `scope` today.

Live model concepts (`scope` absent / `modeling`) — Entity, Query, Report, your app's `Book`, etc. — stay in the **`model`** section; only freeze-produced history rows go to **`modelVersion`**.

**Filesystem example** (Library integration tests):

```json
"modelVersion": {
  "emulatedServerType": "filesystem",
  "directory": "miroir-standalone-app/tests/tmp/library_modelVersion"
}
```

**PostgreSQL example** (distinct schema from live model):

```json
"modelVersion": {
  "emulatedServerType": "sql",
  "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
  "schema": "library_modelVersion",
  "forceNullOptionalAttributeToUndefined": true
}
```

**IndexedDB / MongoDB:** same pattern — separate database name or IndexedDB namespace suffix `-modelVersion` (see `miroirConfig.test-emulatedServer-indexedDb.json` and `miroirConfig.test-emulatedServer-mongodb.json` in `miroir-standalone-app/tests/`).

#### Backend support matrix

| Backend | Writable `modelVersion` | Notes |
|---|---|---|
| `filesystem` | Yes | Primary tracer; separate directory per deployment |
| `sql` | Yes | Separate PostgreSQL schema |
| `indexedDb` | Yes | Separate IndexedDB database name |
| `mongodb` | Yes | Separate database name |
| `bundled` | **No** | Read-only demo; history writes rejected explicitly |

---

## Bundled Store: Data Classification

The bundled store factory (`miroir-store-bundled`) splits statically-imported instances into `model` vs `data` sections by `parentUuid`. The classification is **deployment-specific**.

### Miroir deployment

Only **Entity** instances from `miroir_model/` go into the bundled **model** section. **Version History** instances (`versionHistoryEntityUuids` parents) are **omitted** from bundled data entirely — they are not loaded into `model`, `data`, or `modelVersion`:

| Section | parentUuids / policy |
|---|---|
| model | `16dbfe28…` (Entity) only |
| data | All other non–Version History parentUuids from star-import (reports, menus, selfApplication, … in `miroir_data/`) |
| modelVersion | **Not configured** for bundled Miroir |

### Admin deployment

The admin model includes reports, menus, selfApplication, etc., so more parentUuids belong to the model section:

| Section | parentUuids |
|---|---|
| model | Entity, EntityVersion, Report (`3f2baa83…`), Menu (`dde4c883…`), SelfApplication (`a659d350…`), SelfApplicationVersion (`c3f0facf…`), SelfApplicationModelBranch (`cdb0aec6…`), StoreBasedConfiguration (`7990c0c9…`), EndpointVersion (`3d8da4d4…`), JzodSchema (`5e81e1b9…`), QueryVersion (`e4320b9e…`), Runner (`e54d7dc1…`) |
| data | Application, Deployment (with `configuration`), ViewParams, Import, … |

The `bundledData.ts` file in `miroir-sandbox` uses two separate sets (`MIROIR_MODEL_PARENT_UUIDS` and `ADMIN_MODEL_PARENT_UUIDS`) to drive this classification.

---

## Application Startup Sequence

### Domain Controller Pair

When `emulateServer: true`, two domain controllers are instantiated:

| Controller | `persistenceStoreAccessMode` | Role |
|---|---|---|
| CLIENT | `"remote"` | Manages Redux local cache (CLIENT-side state). Routes persistence calls to the server via `RestClientStub` or HTTP. |
| SERVER | `"local"` | Owns the persistence store backends (filesystem, indexedDb, bundled, sql). Handles all reads/writes. |

### `fetchMiroirAndAppConfigurations` Flow

Called from `DemoInitializer` (sandbox) or `usePageConfiguration({ autoFetchOnMount: true })` (standalone):

```
Step 1 — Rollback Admin
  CLIENT.handleAction("rollback", application=adminSelfApplication)
  → loadConfigurationFromPersistenceStore(admin, ADMIN_DEPLOYMENT_UUID)
    → Read MODEL section for all metaModelEntities
       (Entity, EntityVersion, Report, Menu, SelfApplication, SelfApplicationVersion,
        SelfApplicationModelBranch, EndpointVersion, QueryVersion, Runner, Theme)
    → Read DATA section for all application-specific entities
       (Application, Deployment, ViewParams, StoreBasedConfiguration, Import, …)
    → loadNewInstancesInLocalCache → CLIENT Redux populated

Step 2 — Query deployments
  CLIENT.handleQueryTemplateActionForServerONLY(query for Deployment instances, section="data")
  → Returns [deployment_Admin, deployment_Miroir, deployment_Library, …]
    each with a `configuration` field (StoreUnitConfiguration per section)

Step 3 — For each non-admin deployment:
  For each deployment (e.g. Miroir, Library):
    a. CLIENT.handleAction("storeManagementAction_openStore", configuration=deployment.configuration)
       → SERVER opens the store (idempotent if already open)
    b. CLIENT.handleAction("rollback", application=deployment.selfApplication)
       → loadConfigurationFromPersistenceStore(miroir/app, deploymentUuid)
         → For Miroir: read miroirModelEntities (Entity MetaModel peers) from MODEL
                        read non–Version History concepts from DATA
                        read Version History from MODELVERSION when section is configured
         → For App: read metaModelEntities from MODEL, read app entities from DATA
       → CLIENT Redux further populated
```

After all three steps, CLIENT Redux contains:
- All admin entities/reports/menus/configurations
- All miroir meta-model instances
- All application domain instances

### `loadConfigurationFromPersistenceStore` Detail

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

---

## Configuration Scenarios Reference

### A. Production: Real Server + PostgreSQL

```
Browser (CLIENT) ──HTTP──► miroir-server process (SERVER)
                               └── PostgreSQL (sql backend)
                                   ├── schema "miroirAdmin" (admin sections)
                                   ├── schema "miroir"  (miroir model+data)
                                   └── schema "library" (app model+data)
```

Config: `emulateServer: false`, `serverConfig.storeSectionConfiguration` with `emulatedServerType: "sql"`.

### B. Development / Test: Emulated Server + Filesystem

```
Browser (CLIENT)
  └── RestClientStub ──in-process──► SERVER DomainController
                                        └── filesystem backend
                                            ├── tests/assets/admin_model/
                                            ├── tests/assets/admin_data/
                                            ├── tests/tmp/miroir_model/
                                            ├── tests/tmp/miroir_modelVersion/   ← Miroir version history
                                            ├── tests/tmp/library_data/
                                            └── tests/tmp/library_modelVersion/   ← app version history
```

Config: `emulateServer: true`, `emulatedServerType: "filesystem"`. Versioned app deployments add a fourth `modelVersion` directory.

### C. Browser Tests: Emulated Server + IndexedDB

```
Browser (CLIENT)
  └── RestClientStub ──in-process──► SERVER DomainController
                                        └── IndexedDB backend
                                            ├── indexedDb-admin (admin section, filesystem)
                                            └── indexedDb-miroir / indexedDb-app
```

Config: `emulateServer: true`, admin section uses `filesystem`, miroir and app sections use `indexedDb`.

### D. Demo / Sandbox: Emulated Server + Bundled (read-only)

```
Browser (CLIENT)
  └── RestClientStub ──in-process──► SERVER DomainController
                                        └── BundledStore (in-memory, read-only)
                                            ├── ADMIN_DEPLOYMENT_UUID → demoBundledData.admin
                                            └── MIROIR_DEPLOYMENT_UUID → demoBundledData.miroir
```

Config: `emulateServer: true`, `emulatedServerType: "bundled"`. All data is a star-import of deployment packages, pre-split into model/data sections at build time by `bundledData.ts`. Bundled deployments are not suitable for `versioned-internal` freeze history.

### E. Desktop: Electron + Filesystem

```
Electron renderer (CLIENT)
  └── IPC / RestClientStub ──in-process──► SERVER DomainController
                                              └── filesystem backend
                                                  (paths resolved relative to app bundle)
```

Config: `emulateServer: true`, `emulatedServerType: "filesystem"`. Store configurations are stored as JSON assets (`assets/<deploymentUuid>.json`) inside the electron app bundle.

---

## Key Source Files

| File | Role |
|---|---|
| [packages/miroir-core/src/3_controllers/DomainController.ts](../packages/miroir-core/src/3_controllers/DomainController.ts) | `loadConfigurationFromPersistenceStore`, `handleModelAction("rollback")` |
| [packages/miroir-core/src/1_core/Model.ts](../packages/miroir-core/src/1_core/Model.ts) | `metaModelEntities`, `miroirModelEntities` |
| [packages/miroir-core/src/4_services/RestClientStub.ts](../packages/miroir-core/src/4_services/RestClientStub.ts) | In-process HTTP stub (emulated server mode) |
| [packages/miroir-core/src/4_services/PersistenceStoreControllerManager.ts](../packages/miroir-core/src/4_services/PersistenceStoreControllerManager.ts) | Opens/closes deployment stores; routes to correct backend factory |
| [packages/miroir-store-bundled/src/startup.ts](../packages/miroir-store-bundled/src/startup.ts) | `miroirBundledStoreSectionStartup`, `BundledDeploymentData` type, registry |
| [packages/miroir-store-bundled/src/4_services/BundledModelStoreSection.ts](../packages/miroir-store-bundled/src/4_services/BundledModelStoreSection.ts) | Read-only model section backed by static JSON |
| [packages/miroir-sandbox/src/bundledData.ts](../packages/miroir-sandbox/src/bundledData.ts) | `demoBundledData`: classifies star-imported instances into model/data per deployment |
| [packages/miroir-standalone-app/src/miroir-fwk/4_view/services/ConfigurationService.ts](../packages/miroir-standalone-app/src/miroir-fwk/4_view/services/ConfigurationService.ts) | `fetchMiroirAndAppConfigurations`: orchestrates the 3-step load sequence |
