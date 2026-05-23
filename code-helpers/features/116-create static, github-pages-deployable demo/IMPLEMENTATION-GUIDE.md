# Implementation Guide — Issue #116: Static GitHub Pages–Deployable Demo

## Context

Miroir currently requires a running server (Node.js or Docker) to initialise the framework and
serve the miroir and admin deployment data via REST. This guide describes how to lift that
constraint by producing a self-contained static website deployable on GitHub Pages, where:

- The miroir and admin framework data is **bundled as JS constants** at build time.
- All user application data is persisted in the browser's **IndexedDB**.
- No backend server is needed.

---

## Existing Deployment Methods — Summary

Understanding the three existing modes is essential because the GitHub Pages mode borrows from
all of them.

### Mode 1 — Real HTTP Server (`emulateServer: false`)

```
Browser (React app)
  └─ RestClient (window.fetch)
       └─▶ HTTP REST  ──▶  miroir-server (Node.js / Docker)
                               └─ PersistenceStoreControllerManager
                                    ├─ filesystem store
                                    ├─ IndexedDB store
                                    └─ PostgreSQL store
```

Config key: `miroirConfigRealServerFilesystemGit`, `…Sql`, etc.  
Source of initial miroir/admin data: filesystem assets in `miroir-test-app_deployment-miroir`
and `miroir-test-app_deployment-admin`, served by the server.

### Mode 2 — Emulated Server / IndexedDB (`emulateServer: true`)

```
Browser (React app)
  ├─ DomainControllerForClient (Redux local cache)
  │    └─ RestPersistenceClientAndRestClient
  │         └─ RestClientStub  ──in-process──▶ restServerDefaultHandlers
  └─ DomainControllerForServer  ◀──────────────── RestClientStub.setServerDomainController()
       └─ PersistenceStoreControllerManager
            └─ IndexedDb stores (all deployments)
```

Config key: `miroirConfigEmulatedServerIndexedDb`.  
Source of initial miroir/admin data: **IndexedDB** (empty on first run — must be seeded through
a `initModel` action or equivalent bootstrap flow, or the IndexedDB must be pre-populated).

### Mode 3 — Electron Desktop App (`emulateServer: true` + IPC)

```
Electron Renderer (React app)
  ├─ DomainControllerForClient (Redux local cache)
  │    └─ RestPersistenceClientAndRestClient
  │         └─ ElectronRestClient  ──IPC──▶  Electron Main Process
  └─ ElectronServerDomainControllerProxy ──IPC──▶ Main Process
                                                    └─ PersistenceStoreControllerManager
                                                         ├─ filesystem stores (miroir/admin)
                                                         ├─ IndexedDb stores (user apps)
                                                         └─ postgres / mongodb stores
```

Electron config: `electronMiroirConfig` (built dynamically in `startWebApp`).  
Source of initial miroir/admin data: **filesystem assets bundled as `extraResources`** (in
`miroir-test-app_deployment-miroir/assets` and `miroir-test-app_deployment-admin/assets`).  
IPC channel: `miroir-ipc` (defined in `ipcServerSetup.ts`).

---

## Target — GitHub Pages (Static Demo)

The hint in the issue is accurate: **the GitHub Pages case is very close to the Electron case**.
The structural parallel is:

| Concern | Electron | GitHub Pages |
|---|---|---|
| Who owns the server-side stores? | Electron main process (Node.js) | In-browser, same JS context |
| How does the renderer reach the stores? | `ElectronRestClient` → IPC | `RestClientStub` → direct in-process |
| Source of miroir / admin data at startup | Filesystem assets (`extraResources`) | **JS module imports bundled into the chunk** |
| Storage for user application data | Filesystem or IndexedDB (configurable) | IndexedDB **only** |
| Store factories registered | All (filesystem, indexedDb, postgres, mongodb) in main | **Bundled** (read-only) + IndexedDB in renderer |
| SPA routing | Custom `app://` protocol (handles 404) | Hash-based router or `404.html` redirect trick |
| Build output | Electron installer | `index.html` + JS/CSS bundle |

The key **new piece** that does not exist yet is a **read-only in-memory ("bundled") store**
that is pre-loaded from JS-imported JSON constants and answers `RestClientStub`/
`PersistenceStoreController` queries for the miroir and admin deployments.

---

## Architecture of the GitHub Pages Build

```
Browser (GitHub Pages)
  ├─ DomainControllerForClient (Redux local cache)
  │    └─ RestPersistenceClientAndRestClient
  │         └─ RestClientStub (same as Mode 2)
  └─ DomainControllerForServer (same process)
       └─ PersistenceStoreControllerManager
            ├─ BundledDataStore  ← NEW
            │    deployment: 10ff36f2 (miroir)   ← read-only, data from JS import
            │    deployment: 18db21bf (admin)    ← read-only, data from JS import
            └─ IndexedDbStore
                 deployment: <user app uuid>     ← read-write
```

---

## Implementation Steps

### Step 1 — Define the `bundled` `emulatedServerType` in the schema

**File**: `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts`  
and the Jzod source in `miroir-test-app_deployment-miroir/assets/miroir_model/…`

Add a new discriminated-union variant:
```typescript
// existing variants: "indexedDb" | "filesystem" | "sql" | "mongodb"
// new variant:
{
  emulatedServerType: "bundled",
  // no extra fields needed — the data is injected at factory creation time
}
```

Re-run `npm run devBuild -w miroir-core` to regenerate `miroirFundamentalType.ts`.

New TypeScript type (will be auto-generated):
```typescript
export type BundledStoreSectionConfiguration = {
  emulatedServerType: "bundled";
};
```

---

### Step 2 — Implement the `BundledPersistenceStore`

Create a new package `packages/miroir-store-bundled/` (or add it inside `miroir-core` under
`4_services/` if the overhead of a new package is undesirable).

The store must implement `PersistenceStoreDataSectionInterface`,
`PersistenceStoreModelSectionInterface`, and `PersistenceStoreAdminSectionInterface`.

**Core idea**: hold the entire deployment data as an in-memory `Map<parentUuid, Map<uuid, EntityInstance>>`.
All write methods are no-ops (return `ACTION_OK`) since the miroir/admin data is immutable from
the static demo's perspective.

```typescript
// packages/miroir-store-bundled/src/BundledDataStoreSection.ts
export class BundledDataStoreSection implements PersistenceStoreDataSectionInterface {
  private data: Map<string, Map<string, EntityInstance>>;

  constructor(initialData: Record<string, EntityInstance[]>) {
    this.data = new Map(
      Object.entries(initialData).map(([parentUuid, instances]) => [
        parentUuid,
        new Map(instances.map(i => [String(i.uuid), i])),
      ])
    );
  }

  async open(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async close(): Promise<Action2VoidReturnType> { return ACTION_OK; }

  async getInstances(parentUuid: string): Promise<Action2EntityInstanceCollectionOrFailure> {
    return {
      status: "ok",
      returnedDomainElement: {
        elementType: "entityInstanceCollection",
        elementValue: {
          parentUuid,
          applicationSection: "data",
          instances: [...(this.data.get(parentUuid)?.values() ?? [])],
        },
      },
    };
  }

  async getInstance(parentUuid: string, uuid: string): Promise<Action2EntityInstanceReturnType> {
    const instance = this.data.get(parentUuid)?.get(uuid);
    if (!instance) {
      return new Action2Error("InstanceNotFound", `Instance ${uuid} of entity ${parentUuid} not found`);
    }
    return { status: "ok", returnedDomainElement: { elementType: "instance", elementValue: instance } };
  }

  // Write operations are no-ops for read-only bundled data
  async upsertInstance(_parentUuid: string, _instance: EntityInstance): Promise<Action2VoidReturnType> {
    return ACTION_OK;
  }
  async deleteInstance(_parentUuid: string, _instance: EntityInstance): Promise<Action2VoidReturnType> {
    return ACTION_OK;
  }
  // ... other required interface methods similarly
}
```

Implement `BundledModelStoreSection` and `BundledAdminStore` similarly (model section wraps the
data section as IndexedDb does, and the admin store holds admin-section data).

Create a `startup.ts` that registers these factories with the `ConfigurationService`:

```typescript
// packages/miroir-store-bundled/src/startup.ts
export function miroirBundledStoreSectionStartup(
  configurationService: ConfigurationServiceInner,
  bundledData: {
    [deploymentUuid: string]: {
      admin: Record<string, EntityInstance[]>;
      model: Record<string, EntityInstance[]>;
      data: Record<string, EntityInstance[]>;
    };
  }
) {
  configurationService.registerAdminStoreFactory("bundled", async (config) => {
    return new BundledAdminStore(bundledData[/* deploymentUuid from config context */]);
  });
  configurationService.registerStoreSectionFactory("bundled", "model", async (section, config, ...) => {
    return new BundledModelStoreSection(...);
  });
  configurationService.registerStoreSectionFactory("bundled", "data", async (section, config, ...) => {
    return new BundledDataStoreSection(...);
  });
}
```

> **Note on factory context**: `PersistenceStoreControllerManager` passes `config` (which includes
> `emulatedServerType`) but not the `deploymentUuid` directly to the factory. The bundled factory
> needs to know which deployment's data to serve. The cleanest approach is to pass a `deploymentUuid`
> field in the `BundledStoreSectionConfiguration` (e.g. `{ emulatedServerType: "bundled",
> deploymentUuid: "10ff36f2-..." }`), and register the pre-loaded data keyed by deployment UUID in a
> module-level map before the factories are called.

---

### Step 3 — Convert to single-page architecture (SPA) with query parameters

GitHub Pages only serves one HTML file. All browser navigation must be handled client-side.
The current `miroir-standalone-app` uses `createBrowserRouter` with multi-segment path parameters
(`/report/:application/:deploymentUuid/…`); loading such a URL directly from GitHub Pages yields a
404.

The cleanest solution for the demo is to **eliminate path segments entirely** and use a single
hash-routed page where navigation state is expressed as **URL query parameters**.

#### Currently-used routes

| Current path | Component | Query-parameter equivalent |
|---|---|---|
| `/` | → redirect to `home` | `?page=home` (default) |
| `/home` | `HomePage` | `?page=home` |
| `/report/:application/:deploymentUuid/:applicationSection/:reportUuid` | `ReportPage` | `?page=report&app=:application&deployment=:deploymentUuid&section=:applicationSection&report=:reportUuid` |
| `/report/:application/:deploymentUuid/:applicationSection/:reportUuid/:instanceUuid` | `ReportPage` | `?page=report&app=:application&deployment=:deploymentUuid&section=:applicationSection&report=:reportUuid&instance=:instanceUuid` |
| `/transformerBuilder` | `TransformerBuilderPage` | `?page=transformerBuilder` |
| `/runners` | `RunnersPage` | `?page=runners` |
| `/check` | `CheckPage` | `?page=check` |
| `/error-logs` | `ErrorLogsPageDEFUNCT` | `?page=error-logs` (defunct, keep for compat) |
| `/events` | `MiroirEventsPage` | `?page=events` |
| `/settings` | `SettingsPage` | `?page=settings` |
| `/search` | `SearchPage` | `?page=search` |
| `/model` | `ModelDiagramPage` | `?page=model` |

Links generated programmatically via `navigate(...)` in:
- `EntityInstanceLink.tsx` — currently `/instance/:deploymentUuid/:applicationSection/:entityUuid/:instanceUuid`
  → new: `?page=report&deployment=:deploymentUuid&section=:applicationSection&entity=:entityUuid&instance=:instanceUuid`
- `ReportInstanceLink.tsx` — currently `/report/:application/:deploymentUuid/:applicationSection/:reportUuid/:instanceUuid`
  → new query string equivalent (see table above)
- `AppBar.tsx` — `navigate("/"+l)` where `l` is a section label → `navigate("?page="+l)`
- `HomePage.tsx` — `navigate(applicationDefinition.homePageUrl)` where `homePageUrl` is currently a path like `/report/…`
  → `homePageUrl` should be updated to query-parameter format

#### Special cases

**Home page**: The `?page=home` case (or missing `?page`) is the default. This is the landing page;
no URL parameters are required (just `?page=home` or bare `?`). `HomePage` navigates to a report
URL when an application card is clicked; the target URL format must change to query parameters.

**Report page**: The `ReportPage` is the most complex. Its path currently encodes 4–5 segments.
These become 4–5 query parameters. `ReportPage` must read them from `useSearchParams()` instead
of `useParams()`.

#### Implementation approach

In `miroir-sandbox/src/index.tsx`:

```typescript
import { createHashRouter, RouterProvider, useSearchParams } from "react-router-dom";

// Single-catch-all route; page dispatch is done inside PageDispatcher
const router = createHashRouter([
  {
    path: "/",
    element: <RootComponent />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "*",
        element: <PageDispatcher />,
      },
    ],
  },
]);
```

```typescript
// PageDispatcher.tsx
function PageDispatcher() {
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page") ?? "home";
  switch (page) {
    case "home":           return <HomePage />;
    case "report":         return <ReportPage />;
    case "transformerBuilder": return <TransformerBuilderPage />;
    case "runners":        return <RunnersPage />;
    case "check":          return <CheckPage />;
    case "events":         return <MiroirEventsPage />;
    case "settings":       return <SettingsPage />;
    case "search":         return <SearchPage />;
    case "model":          return <ModelDiagramPage />;
    default:               return <Navigate to="?page=home" replace />;
  }
}
```

`ReportPage` switches from `useParams()` to `useSearchParams()`:

```typescript
// Before
const { application, deploymentUuid, applicationSection, reportUuid, instanceUuid } = useParams();
// After
const [searchParams] = useSearchParams();
const application     = searchParams.get("app")        ?? "";
const deploymentUuid  = searchParams.get("deployment") ?? "";
const applicationSection = searchParams.get("section") ?? "data";
const reportUuid      = searchParams.get("report")     ?? "";
const instanceUuid    = searchParams.get("instance")   ?? undefined;
```

All calls to `navigate(...)` and `<Link to={...}>` in `EntityInstanceLink`, `ReportInstanceLink`,
`AppBar`, and `HomePage` must be updated to produce query-parameter URLs.

> **Scope note**: This SPA routing conversion is scoped to `miroir-sandbox`. The existing
> `miroir-standalone-app` keeps its current browser-history routing unchanged. The refactored
> routing logic lives only in the new demo package, keeping divergence minimal.

---

### Step 4 — Create the static demo entry point

Create a new package `packages/miroir-standalone-app-static/` (analogous to
`miroir-standalone-app-electron/`), or add a separate Vite build target within
`miroir-standalone-app`.

The entry point (`index.tsx` or `index.static.tsx`) differs from the regular one in:

1. **Import the bundled JSON data** at the top of the file:

```typescript
import * as miroirDeploymentMiroir from "miroir-test-app_deployment-miroir";
// or import the raw assets folder JSON files directly:
// (the index.ts of miroir-test-app_deployment-miroir already exports all JSON as named constants)
import * as miroirDeploymentAdmin from "miroir-test-app_deployment-admin";
```

2. **Register only the bundled and IndexedDB store factories** (not filesystem/postgres/mongodb
   which require Node.js):

```typescript
miroirCoreStartup();
miroirBundledStoreSectionStartup(ConfigurationService.configurationService, {
  "10ff36f2-50a3-48d8-b80f-e48e5d13af8e": buildBundledDeploymentData(miroirDeploymentMiroir),
  "18db21bf-f8d3-4f6a-8296-84b69f6dc48b": buildBundledDeploymentData(miroirDeploymentAdmin),
});
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
// Do NOT call miroirFileSystemStoreSectionStartup / miroirPostgresStoreSectionStartup
```

3. **Use the static config** (no real server, `emulateServer: true`, bundled for miroir/admin,
   indexedDb for user apps):

```typescript
const staticMiroirConfig: MiroirConfigClient = {
  miroirConfigType: "client",
  client: {
    emulateServer: true,
    rootApiUrl: "http://localhost:3080", // ignored in emulated mode
    deploymentStorageConfig: {
      "10ff36f2-50a3-48d8-b80f-e48e5d13af8e": {
        admin: { emulatedServerType: "bundled", deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e" },
        model: { emulatedServerType: "bundled", deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e" },
        data:  { emulatedServerType: "bundled", deploymentUuid: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e" },
      },
      "18db21bf-f8d3-4f6a-8296-84b69f6dc48b": {
        admin: { emulatedServerType: "bundled", deploymentUuid: "18db21bf-f8d3-4f6a-8296-84b69f6dc48b" },
        model: { emulatedServerType: "bundled", deploymentUuid: "18db21bf-f8d3-4f6a-8296-84b69f6dc48b" },
        data:  { emulatedServerType: "bundled", deploymentUuid: "18db21bf-f8d3-4f6a-8296-84b69f6dc48b" },
      },
      // User application deployments use IndexedDB
      // (opened dynamically when a user creates/opens a deployment)
    },
  },
};
```

4. **Use a hash-based router** (GitHub Pages serves all paths as the root `index.html` only for
   `/`; sub-paths like `/report/…` return 404 unless the router is hash-based or a custom
   `404.html` redirect is provided):

```typescript
// Replace createBrowserRouter with createHashRouter
import { createHashRouter } from "react-router-dom";
const router = createHashRouter([ /* same routes as regular app */ ]);
```

   Alternatively, keep `createBrowserRouter` and add a `404.html` that redirects to `index.html`
   with a query-encoded path (a well-known GitHub Pages SPA trick). Hash routing is simpler.

5. **Disable or grey-out non-IndexedDB storage options** in the UI (Settings page, deployment
   creation wizard, etc.) when running in static-demo mode. Inject a context flag:

```typescript
export const IS_STATIC_DEMO = true; // tree-shaken if false in regular build
```

---

### Step 5 — Vite configuration for the static build

```javascript
// vite.config.static.js  (or add a --mode static branch in vite.config.js)
export default defineConfig({
  root: 'src',
  base: '/miroir/',   // adjust to the actual GitHub Pages repo sub-path
  build: {
    outDir: '../dist-static',
    target: 'esnext',
    sourcemap: false,   // keep bundle small for GH Pages
    rollupOptions: {
      // Ensure Node.js-only packages are excluded
      external: [],
    },
  },
  define: {
    'import.meta.env.VITE_STATIC_DEMO': JSON.stringify('true'),
  },
  // Same plugins as vite.config.js, no server proxy needed
});
```

Add to `package.json` scripts:
```json
"build:static": "vite build --config vite.config.static.js"
```

---

### Step 6 — GitHub Actions CI/CD

Create `.github/workflows/deploy-pages.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # Build in order (see copilot-instructions.md build order)
      - name: Build miroir-test-app_deployment-miroir
        run: npm run build -w miroir-test-app_deployment-miroir

      - name: Build miroir-test-app_deployment-admin
        run: npm run build -w miroir-test-app_deployment-admin

      - name: Build miroir-core (with type generation)
        run: npm run devBuild -w miroir-core

      - name: Build miroir-store-bundled
        run: npm run build -w miroir-store-bundled

      - name: Build miroir-store-indexedDb
        run: npm run build -w miroir-store-indexedDb

      - name: Build miroir-localcache-redux
        run: npm run build -w miroir-localcache-redux

      - name: Build miroir-react
        run: npm run build -w miroir-react

      - name: Build static demo
        run: npm run build:static -w miroir-standalone-app-static

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: packages/miroir-standalone-app-static/dist-static

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

---

### Step 7 — UI changes

In `miroir-standalone-app` (shared UI code):

- Detect the static-demo mode via `import.meta.env.VITE_STATIC_DEMO === 'true'`.
- In the Settings page and any deployment-creation UI, grey out / hide filesystem, PostgreSQL,
  and MongoDB storage type options.
- Show a banner informing the user they are in demo mode and data is stored locally in the
  browser's IndexedDB.

---

## What Is Shared Unchanged with Electron / Emulated Server Modes

The following are **not** changed and are reused as-is:

| Component | Reused as-is |
|---|---|
| `RestClientStub` | ✅ — same in-process routing |
| `restServerDefaultHandlers` (REST server logic) | ✅ — called by RestClientStub |
| `DomainController` (client and server) | ✅ |
| `PersistenceStoreControllerManager` | ✅ — factory dispatch mechanism unchanged |
| `PersistenceStoreController` | ✅ — calls factory to create store sections |
| `miroir-react` (UI components, selectors) | ✅ |
| All routes / pages | ✅ (modulo router type change) |
| `miroir-test-app_deployment-miroir` JSON assets | ✅ — imported as constants |
| `miroir-test-app_deployment-admin` JSON assets | ✅ — imported as constants |

---

## Summary of What Is New

| New artifact | Purpose |
|---|---|
| `emulatedServerType: "bundled"` schema variant | New store type discriminant |
| `miroir-store-bundled` package | Read-only in-memory store backed by imported JSON |
| Static config (`staticMiroirConfig`) | Wires bundled stores for miroir/admin, IndexedDB for user apps |
| `vite.config.static.js` | Build config with `base`, no Node.js deps |
| Hash router usage | Correct SPA routing on GitHub Pages |
| `deploy-pages.yml` GitHub Actions | CI/CD pipeline |
| `IS_STATIC_DEMO` context flag | UI adjustments (grey-out non-IndexedDB options) |

---

## Annex — Could a Static Demo Access a Locally Deployed PostgreSQL Instance?

### Short answer: Not without user intervention — and even then, only in a non-standard setup.

### Why it is blocked by default

A GitHub Pages site is served over HTTPS from `https://<user>.github.io`. A PostgreSQL instance
running on the user's machine listens on TCP port 5432. There is **no HTTP layer** between the
browser and PostgreSQL — the browser cannot open a raw TCP socket. Even `miroir-store-postgres`
speaks to Postgres through the Node.js `pg` driver, which is a Node.js-only library using raw
TCP; it has no browser port.

Even if one imagined a WebSocket or HTTP proxy in front of Postgres (e.g. PostgREST), the
browser's same-origin policy and CORS rules would block a request from
`https://<user>.github.io` to `http://localhost:5432` (or `http://localhost:3000`) by default:

1. **Mixed content** — an HTTPS page cannot make plain HTTP requests to `localhost`. The browser
   blocks them silently.
2. **CORS** — even over HTTPS, `localhost` must respond with an explicit `Access-Control-Allow-Origin`
   header for the GitHub Pages origin.
3. **No raw TCP from the browser** — the browser's networking stack only speaks HTTP(S) and
   WebSockets; it cannot open arbitrary TCP connections to port 5432.

### Could the user authorise such access?

Yes, with effort:

| Mechanism | Description | Difficulty |
|---|---|---|
| **Local HTTPS proxy + CORS** | Run a local HTTPS proxy (e.g. `miroir-server` on `https://localhost:3080` with a valid mkcert certificate) that forwards requests to Postgres; configure it with a CORS header for the GitHub Pages origin. The existing `miroir-server` + Vite proxy already does this for the development workflow. | Medium |
| **Browser flags** | Some Chromium builds expose `--disable-web-security` or `--allow-running-insecure-content` for development purposes, but these are dangerous, non-portable, and would have to be set by each user. | Unacceptable for demo |
| **Browser extension** | A CORS-bypass extension (e.g. "CORS Unblock") can be installed by the user, but this is again non-portable and a security hole. | Unacceptable for demo |
| **Self-hosted deployment** | Deploy the static bundle on a self-controlled domain (not GitHub Pages) with the right CORS headers, behind the same HTTPS origin as the local proxy. This moves away from the "static demo" use case. | High |

### Practical recommendation

The most realistic path for this "demo plus a bit more" scenario is:

1. The user installs and starts `miroir-server` locally (the existing Docker/npm package).
2. The static demo detects that `emulateServer: false` is requested (via a runtime-configurable
   parameter injected into the page, e.g. a URL query parameter `?serverUrl=https://localhost:3080`).
3. If a server URL is provided and reachable, the app switches to `RestClient` (real HTTP) mode
   and the full server-backed feature set becomes available, including PostgreSQL.

This architecture means the static demo can be a genuine demo *and* a gateway to the full
product — but the PostgreSQL access goes through `miroir-server`, not directly from the
browser. This is already supported by the existing mode-switching logic in `startWebApp` /
`setupMiroirPlatform`.
