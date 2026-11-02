# @miroir-framework/server

Miroir's HTTP surface as an Express application, built from a running domain controller (#636):

- the REST handlers (`/CRUD/...`, `/action/:actionType`, `/query`, `/queryTemplate`), behind the authentication gate;
- `/auth/status`, `/auth/login`, `/auth/change-password` and `/capabilities`;
- MCP on `/mcp` when the `mcp` capability is on, and the MCP server handle for a dedicated listener;
- optionally, a static assets folder, a host assistant route, and a built client folder with its client-side routing catch-all.

The factory does not listen on a port, open a store, read the command line or read the environment. The `miroir-server` binary is a host of this library: it keeps the command line, the environment and configuration file, the store registration, the boot, TLS and `listen`.

The package is private until it is renamed `@miroir-framework/server` (epic #621).

## Use

```ts
import express from "express";
import { createMiroirServerApp } from "@miroir-framework/server";

// Preconditions, set up by the host: store sections registered on
// ConfigurationService.configurationService, the deployments open in domainController,
// the token secret set (setProcessTokenSecret).
const miroir = await createMiroirServerApp({
  domainController,
  persistenceStoreControllerManager,
  applicationDeploymentMap,
  miroirConfig,                 // MiroirConfigServer
  capabilities,                 // getProcessCapabilities(...), also set on the domain controller
  authentication: { enabled: true, mcpEnabled: true },
  corsAllowedOrigins: ["https://app.example.com"],                  // optional
  assets: { directory: "/srv/miroir/public", mountPath: "/assets" }, // optional
  clientDirectory: "/srv/miroir/client",                             // optional, needs an index.html
  assistantRoute: async (app, { requestGate, capabilities }) => {    // optional
    app.use("/api/assistant", requestGate, myAssistantRouter);
  },
});

const host = express();
host.get("/my-route", myHandler); // host GET routes first: with clientDirectory, the catch-all answers any GET
host.use(miroir.app);             // at the root, before any body parser of the host
host.use(express.json());
host.post("/my-form", myFormHandler);
host.listen(3080);
// miroir.mcpServer.run(4080); // optional dedicated MCP listener
// await miroir.close();       // stops the MCP tool registry
```

## Mount rules

- Mount `app` at the host's root. The client's API URL, `/mcp` and the client folder's absolute `/assets/...` URLs assume it.
- Mount it before any body parser of the host. The first body parser that runs reads the body. Miroir's parser keeps BigInt values whole (`{"$bigint": "<digits>"}`, #48) and accepts 50 MB bodies.

## Route order

CORS and the body parser, `/auth/status`, `/capabilities`, assets, REST, `/auth/login` and `/auth/change-password`, `/mcp`, the assistant route, then the client folder and its catch-all. The catch-all answers any GET path, so it is registered last. A host that sets `clientDirectory` registers its own GET routes before mounting `app`; routes for other methods can come after.

## Boundaries

The library imports no store package (`miroir-store-*`), no database driver (`pg`, `sequelize`, `mongodb`, `level`, …), no `@miroir-framework/env`, no `miroir-ai` and no `@copilotkit/*`. Its build fails if one appears (`tsup.config.js`), and `scripts/tests/test_server_library_boundaries.py` checks it. The `miroir-server` release bundle (ncc) inlines the library, so it must be built before `npm run build:server -w miroir-server`.

## Tests

```bash
npm run build -w @miroir-framework/server
MIROIR_ENV=test-filesystem npm run testByFile -w @miroir-framework/server
MIROIR_LIBRARY_BUILD_CHECKS=1 python -m pytest scripts/tests/test_server_library_boundaries.py -q
```

`tests/support/serverTestPlatform.ts` builds a server-side domain controller on a test environment, the way `miroir-server` does. Nonreg steps: `unit-636-server-library` and `build-636-server-release`.
