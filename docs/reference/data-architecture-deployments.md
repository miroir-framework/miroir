# Miroir Data Architecture: Deployments and Storage Backends

## Overview

A Miroir application is always composed of at least two **Deployments**:

| Deployment | UUID | Role |
|---|---|---|
| Admin | `18db21bf-f8d3-4f6a-8296-84b69f6dc48b` | Hosts meta-configuration: the list of deployments, their store configurations, the admin application itself (entities, reports, menus) |
| Miroir | `10ff36f2-50a3-48d8-b80f-e48e5d13af8e` | Hosts the Miroir meta-model bootstrap (**Entity**) plus framework-level concepts. Also ships version history in **`miroir_modelVersion/`** (see [Versioning reference](versioning.md)) |
| App (optional) | e.g. `f714bb2f-a12d-4e71-a03b-74dcedea6eb4` | Hosts a user-defined application (e.g. Library). One or more per installation. |

Each deployment is divided into **sections** (three for unversioned deployments; four when version history is enabled):

| Section | Purpose |
|---|---|
| `admin` | Low-level administration store: list of schemas/collections managed by this deployment. Used internally by the store backend. |
| `model` | Live model definitions (Entity rows) and, for non-Miroir deployments, model-level instances (Reports, Menus, Queries, SelfApplication, etc.) |
| `data` | Domain data instances (Application, Deployment, Book, Author, …) |
| `modelVersion` | **Optional**, versioned-internal applications only: model history. See the [Versioning reference](versioning.md). |

Which applications need a `modelVersion` section depends on their versioning mode; see the [Versioning reference](versioning.md).

### Application packages

Each application's model and data live in a package whose name says its role (#344):

| Role | Prefix | Packages |
|---|---|---|
| Framework: applications every Miroir server needs | `miroir-app-` | `miroir-app-miroir` (meta-model, built before `@miroir-framework/core`), `miroir-app-admin` |
| Framework: the Miroir development process | `miroir-app-` | `miroir-app-meta` (bundle size history, #473), installed in the `dev` environment (live) and the test environments only |
| Example: demo applications | `miroir-example-` | `miroir-example-library`, `miroir-example-spotify`, `miroir-example-github`, `miroir-example-designer`, `miroir-example-postgres` |
| Test fixture: exists only for tests | `miroir-fixture-` | `miroir-fixture-appForTest` |

CLI MiroirTest discovery scans every package with one of these prefixes (`DEPLOYMENT_PACKAGE_PREFIXES` in @miroir-framework/core).

### Deployment package asset folders

Each application package under `packages/{miroir-app,miroir-example,miroir-fixture}-*/assets/` uses a prefix (`miroir_`, `library_`, `admin_`, …):

| Asset directory | Maps to store section | Contents |
|---|---|---|
| `{prefix}_model/` | `model` | Live Entity rows, Reports, Queries, Menus, SelfApplication, … |
| `{prefix}_data/` | `data` | Domain / application data instances |
| `{prefix}_modelVersion/` | `modelVersion` | **Optional.** Model history (see [Versioning reference](versioning.md)) |
| `{prefix}_admin/` (admin package) | `admin` / nested admin model+data | Admin meta-configuration |

Only **`miroir-app-miroir`** currently ships a `{prefix}_modelVersion/` tree (`miroir_modelVersion/`).

### Example: the Library application

`packages/miroir-example-library/assets/`: model in `library_model/` (Entity rows for `Author`, `Book`, `Country`, `Publisher`, `User`, `LendingHistoryItem` under `library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/`), data in `library_data/<entity uuid>/`:

| Entity | Data folder |
|---|---|
| Author | `library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/` |
| Book | `library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/` |
| Country | `library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/` |
| Publisher | `library_data/a027c379-8468-43a5-ba4d-bf618be25cab/` |
| User | `library_data/ca794e28-b2dc-45b3-8137-00151557eea8/` |
| LendingHistoryItem | `library_data/e81078f3-2de7-4301-bd79-d3a156aec149/` |

---

## MiroirConfig Structure

Every application instance reads a `MiroirConfigClient` at startup. There are two variants (`emulateServer` true or false). That flag is **transport only**: HTTP to `miroir-server` versus an in-process stub. It does not turn AI, MCP, or designer tools on.

What the process can do is a separate snapshot. See [Process capabilities](process-capabilities.md) for the synoptic (what each flag enables, where to set it, product-shape defaults).

**Where it comes from (#321).** Run from this repository, the server, the web client and the tests derive their configuration from an **environment** (`environments/*.json`, selected by `MIROIR_ENV`, then `environments/local.json`, then `dev`): which applications are installed, and where each section lives. The Admin data of a running environment, including the Deployment and AdminApplication rows the environment implies, is in the gitignored `.miroir/<environment>/`; the tracked `miroir-app-admin/assets/admin_data` is only its seed. See [Environments](environments.md). The configuration files described below remain for the release binary, the Docker image and Electron.

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
- All data is statically imported at build time from the deployment packages (`miroir-app-miroir`, `miroir-app-admin`).
- Read-only: no writes are persisted.
- **No model history:** the bundled Miroir profile has no `modelVersion` section and cannot host one (see [Versioning reference](versioning.md)).
- Registered at startup via `miroirBundledStoreSectionStartup(configurationService, bundledData)`.

### `modelVersion` (version history, optional)

Optional fourth section of versioned-internal deployments, on storage separate from `model`; supported by every backend except `bundled`. Configuration examples, routing rules and the backend matrix are in the [Versioning reference](versioning.md).

---

## Bundled Store: Data Classification

The bundled store factory (`@miroir-framework/store-bundled`) splits statically-imported instances into `model` vs `data` sections by `parentUuid`. The classification is **deployment-specific**.

### Miroir deployment

Only **Entity** instances from `miroir_model/` go into the bundled **model** section. Model-history instances are **omitted** entirely:

| Section | parentUuids / policy |
|---|---|
| model | `16dbfe28…` (Entity) only |
| data | All other (non-history) parentUuids from star-import (reports, menus, selfApplication, … in `miroir_data/`) |
| modelVersion | **Not configured** for bundled Miroir |

### Admin deployment

The admin model includes reports, menus, selfApplication, etc., so more parentUuids belong to the model section:

| Section | parentUuids |
|---|---|
| model | Entity (`16dbfe28…`), EntityVersion (`54b9c72f…`), Report (`3f2baa83…`), Menu (`dde4c883…`), SelfApplication (`a659d350…`), SelfApplicationVersion (`c3f0facf…`), SelfApplicationModelBranch (`cdb0aec6…`), StoreBasedConfiguration (`7990c0c9…`), Endpoint (`3d8da4d4…`), MlSchema (`5e81e1b9…`), Query (`e4320b9e…`), Runner (`e54d7dc1…`) |
| data | Application, Deployment (with `configuration`), ViewParams, Import, … |

The `bundledData.ts` file in `miroir-sandbox` uses two separate sets (`MIROIR_MODEL_PARENT_UUIDS` and `ADMIN_MODEL_PARENT_UUIDS`) to drive this classification.

### External-service endpoints (HTTP)

An application can declare an **external HTTP service** as an `Endpoint` instance whose `definition` uses the `externalService` branch (key-union with the legacy `actions` branch — never both). The block holds provenance (`openApiDocument`), runtime `baseUrl`, a `securityScheme` discriminated union (`type: "http"` bearer with optional `credentialKey`; `type: "oauth2ClientCredentials"` with `tokenUrl` + `clientIdKey`/`clientSecretKey`; or `type: "oauth2AuthorizationCode"` with `tokenUrl` + `clientIdKey`/`clientSecretKey`/`refreshTokenKey` and optional `scopes` — all secret **names** only, exchanged for a token at runtime), `enabledOperations`, and materialized `operations[]` (GET only at sync time). For `oauth2AuthorizationCode` the framework performs only the OAuth2 refresh-token grant: user consent is out-of-band; the refresh token is the secret named by `refreshTokenKey`; when that name was hydrated from an Admin `MiroirSecret` row, a rotated refresh token is written back to the same row (in-process `registerSecrets` hatch values stay in memory only). Queries use `extractorForExternalService` / `extractorTemplateForExternalService`; execution is **server-process-only** (`POST /query` intercept when the boxed query contains an external extractor). Sync is a pure transformer (`syncExternalServiceSchema`) producing a reviewable `compositeActionSequence` that upserts `operations[]` and companion Entities.

Entities backed by HTTP responses use `externalDataSource: { kind: "http", endpoint: <endpointUuid> }` (absent `kind` means SQL catalog external). All store backends **skip bootstrap** for `kind: "http"` — no data-section folder, no Sequelize model. HTTP report payloads live in the **query stash** (`contextResults` / the section’s `fetchedDataReference`), not in the Entity instance cache: they are never `loadNewInstancesInLocalCache`. `apiCallReportSection` types that stash from `Endpoint.operations[].responseSchema` without an Entity (#281). The Entity-backed `objectInstanceReportSection` path still works when an Entity is requested; it also does not persist HTTP rows as instances. Named secrets live as Admin `MiroirSecret` rows (entity uuid `a96856df-2b38-494a-8027-82617e2d64ad`), encrypted at rest with AES-256-GCM under a process wrapping key (`MIROIR_SECRETS_MASTER_KEY` or `--secrets-master-key` — [how to generate it](../reference/authentication.md#generate-the-wrapping-key)). `--secret <name>=<value>`, `MIROIR_SECRET_<NAME>`, and AI key env vars (`AI_OPENAI_KEY`, `AI_ANTHROPIC_KEY`, `AI_GOOGLE_KEY`, `AI_GITHUB_TOKEN`) are **bootstrap import only**; a later launch needs only the wrapping key. Endpoint instances still store secret **names** only. Values are never serialized into model JSON, generic REST/MCP responses, or the client cache (`ciphertext` is stripped like `passwordHash`). Writes go through CLI `--secret` import or labeled `secrets.set` / `secrets.delete` actions. See [`code-helpers/features/270-FEATURE-persistent-named-secrets/analysis.md`](../../code-helpers/features/270-FEATURE-persistent-named-secrets/analysis.md), [`code-helpers/features/267-FEATURE-openapi-external-services/analysis.md`](../../code-helpers/features/267-FEATURE-openapi-external-services/analysis.md), and the `miroir-example-spotify` and `miroir-example-github` example packages.

---

## Application startup sequence

You do not set `persistenceStoreAccessMode` in `miroirConfig`. It is how each DomainController is constructed. Pick the product shape (`emulateServer`, which process you start); the constructors follow.

| Mode | Meaning | Typical process |
|---|---|---|
| `"remote"` | This controller keeps the UI cache and sends store work out (HTTP, IPC, or `RestClientStub`). | Browser, Electron renderer, client side of a vitest process |
| `"local"` | This controller opens store factories and reads/writes files, SQL, IndexedDB, Mongo, or bundled data. | `miroir-server`, Electron main, emulated server inside the client process |

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
| A. Web app + `miroir-server` | postgres (and whatever the server registered) | on in shipped server JSON | on (default) | `emulateServer: false`. Edit `packages/miroir-server/config/miroirConfig.server.json` `features`. Restart the server. |
| B. Sandbox bundled | bundled + IndexedDB; `bundled` not creatable | `ai` forced off | on | Cannot enable AI. `mcp` stays off unless you set it on the sandbox persistence config. |
| C. Electron desktop | filesystem on main (all writable factories) | on (main `electronServerConfig`) | on | Do not put `features` on the renderer object. Restart the desktop app. Loopback HTTP on `http://127.0.0.1:3080` when `ai` or `mcp` is on. |
| D. Tests, emulated server | stores of `environments/test-<storage>.json` | off unless the environment sets `features` | n/a | `--profile emulatedServer-<storage>` (or `--storage <storage>`) on `testMiroir` / `testByFile`. |
| E. Tests, real server | stores of `environments/test-<storage>.json`, opened by the server | the server's flags | n/a | Start `miroir-server` on the test environment, then `--profile realServer-<storage>`. |
| F. Tests in the browser, emulated server + IndexedDB | IndexedDB (+ often filesystem admin) | usually off | on | `emulateServer: true`. Omit `features` to keep AI/MCP off. |

How to read the diagrams:

- A to C are ways to use Miroir; D to F run integration tests.

- A box with a title is one **process** (or browser tab). Arrows between boxes cross a process boundary; arrows inside a box are function calls.
- Every scenario has **two DomainControllers**: a client one (`remote`) that keeps the local cache, and a server one (`local`) that opens the stores. `remote` and `local` are each controller's `persistenceStoreAccessMode`, not properties of the process. In the emulated scenarios (B, D, F) both controllers live in the same process and `RestClientStub` turns REST calls into function calls.

### A. Production: web app + `miroir-server`

```mermaid
flowchart LR
  subgraph browser["Browser tab: web app"]
    C["Client DomainController<br/>remote · local cache"]
  end
  subgraph server["miroir-server process"]
    S["Server DomainController<br/>local · PersistenceStoreControllers"]
  end
  C -- "RestClient<br/>HTTPS localhost:3080" --> S
  S -.-> PG[("PostgreSQL (default)<br/>schemas miroirAdmin, miroir, library, …")]
  S -.-> FS[("Filesystem<br/>JSON files per entity")]
  S -.-> MG[("MongoDB<br/>one database per section")]
  S -.-> LV[("IndexedDb API<br/>level databases on disk")]
```

Dotted arrows: the backends the server can open (PostgreSQL in the shipped configuration), chosen per section (`admin`, `model`, `data`, `modelVersion`) through `emulatedServerType`; sections of one deployment may use different backends. See [Storage Backend Types](#storage-backend-types-emulatedservertype).

`emulateServer: false`, `serverConfig.storeSectionConfiguration` with `emulatedServerType: "sql"` by default. Turn AI/MCP off by setting `features.ai` / `features.mcp` false on the **server** JSON and restarting.

### B. Demo / sandbox: Serverless (emulated server within the Browser, indexedDb)

```mermaid
flowchart LR
  subgraph browser["Browser (no server anywhere)"]
    subgraph tab["Tab: miroir-sandbox SPA (JavaScript bundle)"]
      C["Client DomainController<br/>remote · local cache"]
      S["Emulated server DomainController<br/>local · PersistenceStoreControllers"]
      B[("BundledStore, read-only<br/>Admin + Miroir from demoBundledData,<br/>compiled into the bundle")]
      C -- "RestClientStub<br/>function calls" --> S
      S --> B
    end
    IDB[("Browser IndexedDB<br/>writable sections")]
    S --> IDB
  end
```

Everything runs in the browser: the bundled data ships inside the SPA's JavaScript, and the writable sections are in the browser's IndexedDB. No `miroir-server` is involved.

`emulateServer: true`, `emulatedServerType: "bundled"`. Star-import of deployment packages. Not suitable for versioned-internal applications. Sandbox environment forces `ai` false.

### C. Desktop: Electron + filesystem

```mermaid
flowchart LR
  subgraph app["Electron desktop app (no separate miroir-server)"]
    subgraph renderer["Renderer process"]
      C["Client DomainController<br/>remote · local cache"]
    end
    subgraph main["Main process (Node)"]
      S["Server DomainController<br/>local · PersistenceStoreControllers"]
    end
    C -- "IPC<br/>(loopback HTTP 127.0.0.1:3080 when ai or mcp is on)" --> S
  end
  S --> FS[("Local disk: filesystem stores<br/>paths relative to the app bundle")]
```

The app is a single program that runs two processes: the renderer (the UI, a Chromium page) and main (Node, which plays the server's part). Only the stores are outside it, on the local disk.

`emulateServer: true` on the renderer stub. Store JSON under Electron `assets/<deploymentUuid>.json`. Flags live on **main** `electronServerConfig`. When `ai` or `mcp` is true, main listens on loopback HTTP; the renderer uses that absolute base, not `app://`. Snapshot GET still uses IPC.

### D. Tests from the CLI: emulated server

`npm run testMiroir` or `npm run testByFile` with `--profile emulatedServer-<storage>`. The whole stack runs inside the vitest Node process: no `miroir-server`, no network.

```mermaid
flowchart LR
  subgraph node["Node process: vitest, profile emulatedServer-{storage}"]
    T["Test code<br/>MiroirTest runner · *.integ.test.ts"]
    C["Client DomainController<br/>remote · local cache"]
    S["Emulated server DomainController<br/>local · PersistenceStoreControllers"]
    T --> C
    C -- "RestClientStub<br/>function calls" --> S
  end
  S --> A[("Admin<br/>filesystem copy in .miroir/test-{storage}/admin/")]
  S --> D[("miroir, library, appForTest, …<br/>store of test-{storage}")]
```

| `--storage` | Where the application sections live |
|---|---|
| `filesystem` | `.miroir/test-filesystem/<application>/{model,data,modelVersion}/` |
| `indexedDb` | Level databases in `.miroir/test-indexedDb/` (the `level` package writes to disk under Node) |
| `sql` (default) | PostgreSQL schemas `test_sql_<application>` |
| `mongodb` | MongoDB databases `test_mongodb_<application>` |

Versioned applications add a `modelVersion` section. Test environments that never use AI/MCP omit `features` (both false).

### E. Tests from the CLI: real server

Same commands with `--profile realServer-<storage>`. The test process holds only the client; it calls a `miroir-server` that you start beforehand on the same test environment, at `https://localhost:3080` (Node must trust the mkcert CA, see [Testing reference](testing.md)).

```mermaid
flowchart LR
  subgraph node["Node process: vitest, profile realServer-{storage}"]
    T["Test code<br/>MiroirTest runner · *.integ.test.ts"]
    C["Client DomainController<br/>remote · local cache"]
    T --> C
  end
  subgraph server["miroir-server process, on test-{storage}"]
    S["Server DomainController<br/>local · PersistenceStoreControllers"]
  end
  C -- "RestClient<br/>HTTPS localhost:3080" --> S
  S --> D[("stores of test-{storage}<br/>same places as in D")]
```

Server-side logs are in the server process, not in the vitest output. Requests to external services leave from the server, so test leaves that fake them are skipped on these profiles.

### F. Tests in the browser: emulated server + IndexedDB

Integration tests launched from the web app itself: **Miroir Tests → Run Integration Tests** on profile `emulatedServer-indexedDb`. The web app then runs with `emulateServer: true`, and the whole stack, tests included, runs in the browser tab.

```mermaid
flowchart LR
  subgraph browser["Browser tab: web app, emulateServer: true"]
    C["Client DomainController<br/>remote · local cache"]
    S["Emulated server DomainController<br/>local · PersistenceStoreControllers"]
    C -- "RestClientStub<br/>function calls" --> S
  end
  S --> IDB[("Browser IndexedDB<br/>indexedDb-miroir, indexedDb-app, …")]
```

Admin section often `filesystem`; Miroir and app sections `indexedDb`.

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
