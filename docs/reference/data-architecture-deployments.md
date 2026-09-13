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

Every application instance reads a `MiroirConfigClient` at startup. There are two variants (`emulateServer` true or false). That flag is **transport only**: HTTP to `miroir-server` versus an in-process stub. It does not turn AI, MCP, or designer tools on.

What the process can do is a separate snapshot. See [Process capabilities](process-capabilities.md) for the synoptic (what each flag enables, where to set it, product-shape defaults).

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

### External-service endpoints (HTTP)

An application can declare an **external HTTP service** as an `Endpoint` instance whose `definition` uses the `externalService` branch (key-union with the legacy `actions` branch — never both). The block holds provenance (`openApiDocument`), runtime `baseUrl`, a `securityScheme` discriminated union (`type: "http"` bearer with optional `credentialKey`; `type: "oauth2ClientCredentials"` with `tokenUrl` + `clientIdKey`/`clientSecretKey`; or `type: "oauth2AuthorizationCode"` with `tokenUrl` + `clientIdKey`/`clientSecretKey`/`refreshTokenKey` and optional `scopes` — all secret **names** only, exchanged for a token at runtime), `enabledOperations`, and materialized `operations[]` (GET only at sync time). For `oauth2AuthorizationCode` the framework performs only the OAuth2 refresh-token grant: user consent is out-of-band; the refresh token is the secret named by `refreshTokenKey`; when that name was hydrated from an Admin `MiroirSecret` row, a rotated refresh token is written back to the same row (in-process `registerSecrets` hatch values stay in memory only). Queries use `extractorForExternalService` / `extractorTemplateForExternalService`; execution is **server-process-only** (`POST /query` intercept when the boxed query contains an external extractor). Sync is a pure transformer (`syncExternalServiceSchema`) producing a reviewable `compositeActionSequence` that upserts `operations[]` and companion Entities.

Entities backed by HTTP responses use `externalDataSource: { kind: "http", endpoint: <endpointUuid> }` (absent `kind` means SQL catalog external). All store backends **skip bootstrap** for `kind: "http"` — no data-section folder, no Sequelize model. Named secrets live as Admin `MiroirSecret` rows (entity uuid `a96856df-2b38-494a-8027-82617e2d64ad`), encrypted at rest with AES-256-GCM under a process wrapping key (`MIROIR_SECRETS_MASTER_KEY` or `--secrets-master-key` — [how to generate it](../reference/authentication.md#generate-the-wrapping-key)). `--secret <name>=<value>`, `MIROIR_SECRET_<NAME>`, and AI key env vars (`AI_OPENAI_KEY`, `AI_ANTHROPIC_KEY`, `AI_GOOGLE_KEY`, `AI_GITHUB_TOKEN`) are **bootstrap import only**; a later launch needs only the wrapping key. Endpoint instances still store secret **names** only. Values are never serialized into model JSON, generic REST/MCP responses, or the client cache (`ciphertext` is stripped like `passwordHash`). Writes go through CLI `--secret` import or labeled `secrets.set` / `secrets.delete` actions. See [`code-helpers/features/270-FEATURE-persistent-named-secrets/analysis.md`](../../code-helpers/features/270-FEATURE-persistent-named-secrets/analysis.md), [`code-helpers/features/267-FEATURE-openapi-external-services/analysis.md`](../../code-helpers/features/267-FEATURE-openapi-external-services/analysis.md), and the `miroir-test-app_deployment-spotify` example package.

---

## Application startup sequence

You do not set `persistenceStoreAccessMode` in `miroirConfig`. It is how each DomainController is constructed. Pick the product shape (`emulateServer`, which process you start); the constructors follow.

| Mode | Meaning | Typical process |
|---|---|---|
| `"remote"` | This controller keeps the UI cache and sends store work out (HTTP, IPC, or `RestClientStub`). | Browser, Electron renderer, CLI client side |
| `"local"` | This controller opens store factories and reads/writes files, SQL, IndexedDB, Mongo, or bundled data. | `miroir-server`, Electron main, emulated in-process server |

How to choose:

- **Remote client + separate server:** `emulateServer: false` on the browser config. Start `miroir-server`. The browser DomainController is `"remote"`; the server process is `"local"`. Feature flags are on the **server** JSON.
- **Both in one process:** `emulateServer: true`. You still get a `"remote"` client and a `"local"` in-process server. Feature flags are on that emulateServer / Electron-main config, not on a remote-only client file.
- **When `"local"` matters to you:** work that must see real stores or secrets in-process (MCP tools, external HTTP extractors, store create/delete) runs on the `"local"` controller. The remote client only forwards.

Startup then rolls back Admin, lists Deployment rows, opens each other deployment, and rolls those back into the client cache. The step-by-step fill is implementation detail: [Application startup (cache load)](../internals/application-startup.md).

Process feature flags (`ai`, `mcp`, designer tools, store types) are a snapshot fetched once. See [Process capabilities](process-capabilities.md).

---

## Configuration scenarios

What each shipped shape lets you do, and which knobs to turn. Feature flags: [Process capabilities](process-capabilities.md).

| Scenario | Stores | `ai` / `mcp` | Designer tools | How you set it |
|---|---|---|---|---|
| A. Web + `miroir-server` + SQL | postgres (and whatever the server registered) | on in shipped server JSON | on (default) | `emulateServer: false`. Edit `packages/miroir-server/config/miroirConfig.server.json` `features`. Restart the server. |
| B. Emulated + filesystem | filesystem directories | off unless that test JSON sets `features` | on | `emulateServer: true`, `emulatedServerType: "filesystem"`. Add `features` only if the profile needs AI/MCP. |
| C. Emulated + IndexedDB | IndexedDB (+ often filesystem admin) | usually off | on | `emulateServer: true`. Omit `features` to keep AI/MCP off. |
| D. Sandbox bundled | bundled + IndexedDB; `bundled` not creatable | `ai` forced off | on | Cannot enable AI. `mcp` stays off unless you set it on the sandbox persistence config. |
| E. Electron desktop | filesystem on main (all writable factories) | on (main `electronServerConfig`) | on | Do not put `features` on the renderer object. Restart the desktop app. Loopback HTTP on `http://127.0.0.1:3080` when `ai` or `mcp` is on. |

### A. Production: real server + PostgreSQL

```
Browser (CLIENT, remote)
  --HTTP--> miroir-server (SERVER, local)
              └── PostgreSQL
                    ├── schema "miroirAdmin"
                    ├── schema "miroir"
                    └── schema "library"
```

`emulateServer: false`, `serverConfig.storeSectionConfiguration` with `emulatedServerType: "sql"`. Turn AI/MCP off by setting `features.ai` / `features.mcp` false on the **server** JSON and restarting.

### B. Development / test: emulated server + filesystem

```
Browser (CLIENT, remote)
  └── RestClientStub --> in-process SERVER (local)
                            └── filesystem
                                  ├── tests/assets/admin_model/
                                  ├── tests/assets/admin_data/
                                  ├── tests/tmp/miroir_model/
                                  ├── tests/tmp/miroir_modelVersion/
                                  ├── tests/tmp/library_data/
                                  └── tests/tmp/library_modelVersion/
```

`emulateServer: true`, `emulatedServerType: "filesystem"`. Versioned apps add a `modelVersion` directory. Test profiles that never use AI/MCP omit `features` (both false).

### C. Browser tests: emulated server + IndexedDB

```
Browser (CLIENT, remote)
  └── RestClientStub --> in-process SERVER (local)
                            └── IndexedDB
                                  ├── indexedDb-admin (admin often filesystem)
                                  └── indexedDb-miroir / indexedDb-app
```

`emulateServer: true`. Admin section often `filesystem`; Miroir and app sections `indexedDb`.

### D. Demo / sandbox: emulated server + bundled (read-only)

```
Browser (CLIENT, remote)
  └── RestClientStub --> in-process SERVER (local)
                            └── BundledStore (read-only)
                                  ├── ADMIN_DEPLOYMENT_UUID → demoBundledData.admin
                                  └── MIROIR_DEPLOYMENT_UUID → demoBundledData.miroir
```

`emulateServer: true`, `emulatedServerType: "bundled"`. Star-import of deployment packages. Not suitable for `versioned-internal` freeze history. Sandbox environment forces `ai` false.

### E. Desktop: Electron + filesystem

```
Electron renderer (CLIENT, remote)
  └── IPC --> Electron main (SERVER, local)
                └── filesystem (paths relative to the app bundle)
```

`emulateServer: true` on the renderer stub. Store JSON under Electron `assets/<deploymentUuid>.json`. Flags live on **main** `electronServerConfig`. When `ai` or `mcp` is true, main listens on loopback HTTP; the renderer uses that absolute base, not `app://`. Snapshot GET still uses IPC.

---

## Key source files

Store backends and bundled demo data. Cache-load call sites: [Application startup](../internals/application-startup.md).

| File | Role |
|---|---|
| [packages/miroir-core/src/4_services/RestClientStub.ts](../packages/miroir-core/src/4_services/RestClientStub.ts) | In-process HTTP stub (emulated server) |
| [packages/miroir-core/src/4_services/PersistenceStoreControllerManager.ts](../packages/miroir-core/src/4_services/PersistenceStoreControllerManager.ts) | Opens and closes deployment stores; routes to the backend factory |
| [packages/miroir-store-bundled/src/startup.ts](../packages/miroir-store-bundled/src/startup.ts) | `miroirBundledStoreSectionStartup`, `BundledDeploymentData`, registry |
| [packages/miroir-store-bundled/src/4_services/BundledModelStoreSection.ts](../packages/miroir-store-bundled/src/4_services/BundledModelStoreSection.ts) | Read-only model section backed by static JSON |
| [packages/miroir-sandbox/src/bundledData.ts](../packages/miroir-sandbox/src/bundledData.ts) | `demoBundledData`: classifies star-imported instances into model/data per deployment |
