# Issue #636 — TDD Implementation Plan

> Testing posture: integration first, no mocks. The library is tested through its public interface, `createMiroirServerApp(options)`, started in-process on port 0 with a real server-side domain controller on the `test-filesystem` environment, and called over real HTTP (`fetch`, and `listMcpToolsViaHttp` from `miroir-mcp` for MCP). The binary is tested by starting its release bundle. Tests that read `server.ts` as text either follow the code or become behaviour tests on the factory.

**Resume note:** slices are done in order; each slice's Status line and Realization say where work stopped. Branch `claude/636-server-library`, from `_integration` at `3e0a04f8a`. Slice order: the user delegated the choices ("adversarial reviews and stop when PR can be merged"); this plan was revised once after an adversarial review (Revision history).

## Scope

In (goals of [`analysis.md`](analysis.md)):
- **G1** Mount Miroir on my own server: one factory call builds REST, auth, capabilities, MCP; the host mounts the result.
- **G2** Serve my own client bundle: `clientDirectory` and `assets` are options.
- **G3** Pick my stores: the library imports no store package and no driver; its build fails if one appears.
- **G4** Same server: `miroir-server` keeps its command line, environment, secrets, authentication, TLS, ports, release bundle and Docker image.
- **G5** Tests that start the surface in-process.

Out (owners):
- `startMiroirNode` and moving the domain controller construction out of the binary: I4 (next issue, branched from this one).
- Boot (opening deployments, environment reconciliation, secrets): binary until I4 decides.
- Rename to `@miroir-framework/server`, public manifest: I5, I6.
- Serving a bundle chosen at deployment time, a `mountPath` option, the `/assets` name clash, the Dockerfile `public` path: post-epic bundle issue (facts handed over in analysis G2).
- Rewriting REST handlers or the MCP server.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/636 (sub-issue of epic #621, item I3)
- Analysis: [`analysis.md`](analysis.md)
- Epic plan: [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md) (its I3 slices are superseded by this plan, analysis D1)
- Host-slot precedent: [`../633-REFACTOR-app-shell-to-react/tdd-implementation-plan.md`](../633-REFACTOR-app-shell-to-react/tdd-implementation-plan.md)
- Branch: `claude/636-server-library`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the release binary | ✅ DONE | `test_server_release_smoke.py` on today's `server.ts` |
| 1 | Tracer: REST through the factory, behind the gate, on port 0 | ✅ DONE | `serverApp.636.phase1.integ` (CRUD read and `POST /action` 200; 401 without token; BigInt kept) |
| 2 | Auth and capabilities routes from the factory | ✅ DONE | `serverApp.636.phase2.integ` (`/auth/status`, `/capabilities`, login as alice then REST with token) |
| 3 | MCP from the factory | ✅ DONE | `serverApp.636.phase3.integ` (`tools/list`; 401 when `mcpEnabled`) + full nonreg |
| 4 | The tail: assistant slot, assets and client folders as options | ✅ DONE | `serverApp.636.phase4.integ` (temp `index.html`, slot gate 401, API and slot beat the catch-all) |
| 5 | Mount rules; `server.ts` becomes the thin binary | ✅ DONE | `serverApp.636.phase5.integ` (BigInt through a host app) + the repointed source tests + release smoke |
| 6 | Boundary guard, build lists, docs, cleanup | ✅ DONE | tsup `onEnd` metafile guard + pytest guard; full `nonreg:filesystem` |

## Locked implementation defaults

Copied from the analysis decision record; deviations go into the slice's Realization.

| Decision | Default | Serves |
|---|---|---|
| D1 | New workspace package `packages/miroir-server-library` (name `miroir-server-library`, `private: true`, tsup, ESM, `exports: { ".": … }`); `miroir-server` depends on it | G1, G3, G4 |
| D2 | `createMiroirServerApp(options): Promise<MiroirServerApp>`; `app` is an `express()` sub-app, not listening. Mount rules: root only; before any host body parser | G1, G2, G5 |
| D3 | The library owns HTTP only, in today's order: CORS and parsers (with `json replacer`), `/auth/status`, `/capabilities`, assets, REST loop with the gate, `/auth/login`, `/auth/change-password`, MCP setup and `/mcp`, assistant slot, client folder and catch-all last. The binary keeps CLI, config, ports, CORS origin computation, store registration, domain controller, boot, `setProcessCapabilities`, TLS (computed before the factory call), `__filename`/`__dirname` and the default paths as literals (ncc relocation), the dev `/` route, `listen`, `mcpServer.run` | G1, G4 |
| D4 | Options: `domainController`, `persistenceStoreControllerManager`, `applicationDeploymentMap`, `miroirConfig`, `capabilities`, `authentication: { enabled, mcpEnabled }`, optional `corsAllowedOrigins`, `assets: { directory, mountPath }`, `clientDirectory`, `assistantRoute(app, { requestGate, capabilities }): Promise<void>` (awaited: `mountCopilotKitRoute` is async). The library reads no `process.env` and no `process.argv` | G1, G2, G3 |
| D5 | No store parameter; preconditions documented (stores registered, deployments open, token secret set). Forbidden imports, checked on resolved specifiers of the built output: `miroir-store-*`, `pg`, `sequelize`, `mongodb`, `level`, `browser-level`, `classic-level`, `miroir-env`, `miroir-ai`, `@copilotkit/*` | G3 |
| D6 | Wiring checks become behaviour tests (MCP 401 gate, slot gate); the other source checks follow the code to the library file or stay on the binary | G5 |
| D7 | ncc inlines the library (not in `-e`); it joins `build-all.sh`, Dockerfile, `build-linux-runnables.yml`, `self-test.yml`, `ci/build/build_server.sh`, `package-lock.json` (exact pins express 5.3.0, body-parser 2.4.0, cors 2.8.6, the same as `miroir-server` and `miroir-mcp` so ncc inlines one copy; `"*"` internal), `scripts/nonreg-manifest.json` | G4 |

Additions and deviations decided by this plan:
- **P1 (addition to D2)** `MiroirServerApp = { app: Express; mcpServer: MiroirMcpServer; requestGate: RequestHandler; authenticationGate: AuthenticationGate; close(): Promise<void> }`. The gate is built once by the factory (Slice 1) and returned, so the binary's routes that are not moved yet (change-password until Slice 2, the MCP gate until Slice 3, CopilotKit until Slice 4) use the factory's gate instead of a second copy. Once nothing in the binary uses `authenticationGate`, Slice 5 keeps `requestGate` only if a host needs it for its own routes (kept: G1).
- **P2 (addition)** Each slice moves its block out of `server.ts` and calls the factory from the binary in the same slice, so no code is duplicated between the two files. Until Slice 4, the binary registers its unmoved routes on the returned `app`; their paths are distinct from the moved ones. The SPA catch-all and the CopilotKit route move together in Slice 4, so the catch-all is never registered before the assistant route.
- **P3 (deviation from D5, "resolved specifiers, not package.json")** The resolved-import check stays the main guard. A second, static check on the library's `package.json` `dependencies` and `peerDependencies` is added because it can run in `pr-checks.yml` before Node is installed.
- **P4 (precision)** Route order is locked by HTTP behaviour, not by reading a router stack: Express 5 layers keep no path for `use` (router `layer.js:46`), and half of today's registrations are indirect (REST loop, `mountHttpRoutes`, `mountCopilotKitRoute`).

## Allocated names and keys

No model element, uuid or MiroirTest suite: the feature is HTTP wiring, not reachable through the ML (justification for vitest below).

| Kind | Name |
|---|---|
| Package | `packages/miroir-server-library` (`miroir-server-library`) |
| Factory module | `src/createMiroirServerApp.ts`, exported from `src/index.ts` with `MiroirServerAppOptions`, `MiroirServerApp` |
| Internal modules | `src/restRoutes.ts`, `src/authRoutes.ts`, `src/staticRoutes.ts` (extracted only if the factory passes about 250 lines) |
| Test support | `tests/support/serverTestPlatform.ts` (see Slice 1) |
| Test user | `alice` / `alice-dev` from the Admin fixture data (as in `miroir-core/tests/4_services/issues/264-deployment-access/access.264.phase2.unit.test.ts:124`) |
| BigInt probe | a `POST /query` whose query is a runtime transformer returning the constant `{"$bigint":"9007199254740993"}` (2^53 + 1); the response must carry the same tagged digits |
| Issue tests | `tests/issues/636-server-library/serverApp.636.phase{1..5}.integ.test.ts` (merged into `tests/createMiroirServerApp.integ.test.ts` in Slice 6) |
| Release smoke | `scripts/tests/test_server_release_smoke.py`, reusing `scripts/agent_bench/miroir_server.py` (`MiroirServer`, environment `bench-agent`, `http://localhost:3080`, `--disable-auth`; state reset with `reset_state()`); skipped when `release/index.js` is missing |
| Boundary guard | `scripts/tests/test_server_library_boundaries.py` |
| Feature tests (Slice 6) | `tests/createMiroirServerApp.integ.test.ts` |
| Nonreg steps | `unit-636-server-library` (factory tests; `tier: default`, `requires: none`, `parallel: false` because it reseeds `.miroir/test-filesystem`; scopes `core`, `actions`, `runners`, `tooling`) and `build-636-server-release` (`build:server` then the release smoke; `tier: default`, `requires: none`, `parallel: false`; scopes `tooling`, `external`) |

**Why vitest, not MiroirTest:** HTTP routing, Express mounting, body parsing and the release bundle are platform machinery; no Entity, Query or Runner can express "this Express app answers `/mcp`".

## Test execution conventions

| What | Command |
|---|---|
| Library tests | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-server-library -- <name>` |
| Server tests | `npm run testByFile -w miroir-server -- <name>` |
| Moved source-text tests | `RUN_TEST=<name> npm run testByFile -w <pkg> -- <name>` (packages `miroir-core`, `miroir-standalone-app`, `miroir-ai`, `miroir-server`) |
| Build | `npm run build -w miroir-server-library` (after `miroir-mcp`), then `npm run build:server -w miroir-server` |
| Release smoke | `python -m pytest scripts/tests/test_server_release_smoke.py -q` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/miroir-server-library/tsconfig.json`, same for `packages/miroir-server/tsconfig.json` |
| Gate | the AGENTS.md pre-push gate |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |

Scopes: authentication and access checks are `core`; the REST and action path is `actions`; MCP is `runners`; capabilities and the assistant route are `external`; builds and test tooling are `tooling`.

---

## Slice 0 — Characterize the release binary

**Status:** ✅ DONE

**Goal:** a safety net for G4 before any move: today's release binary answers its HTTP surface, and the readers of `server.ts` pass.

**RED/characterization:**
- `scripts/tests/test_server_release_smoke.py` (skipped when `packages/miroir-server/release/index.js` is missing): `reset_state()`, start `MiroirServer`, then over `http://localhost:3080`:
  1. `GET /capabilities` 200 with a JSON object that has `mcp`;
  2. `GET /auth/status` 200 with `enabled: false` (`--disable-auth`);
  3. `GET /CRUD/<library deployment>/data/entity/<Book entity uuid>/all` 200 with books;
  4. `GET /assets/<a file of packages/miroir-server/public>` 200;
  5. `GET /mcp` 405 (the main app's MCP mount, when `capabilities.mcp` is on in `bench-agent`; otherwise the test reads `/capabilities` first and expects 404);
  6. `GET /` answers `App Works !!!!` (dev mode).
  It stops the server, and `git status --porcelain -- packages` is empty afterwards (the run writes no tracked asset).
- Baseline run of the 12 source-text tests of analysis D6 and the 3 non-test readers; results recorded in the Realization.

**GREEN:** none (characterization).

**Refactor checkpoint:** none.

**Validation:**
```bash
npm run build:server -w miroir-server
python -m pytest scripts/tests/test_server_release_smoke.py -q
npm run testByFile -w miroir-server
RUN_TEST=processCapabilities.273 npm run testByFile -w miroir-core -- processCapabilities.273.phase0
npm run testByFile -w miroir-ai -- cursorSdk.275
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization
- `scripts/tests/test_server_release_smoke.py`: 6 checks on the `bench-agent` launcher (`/capabilities`, `/auth/status`, a Library CRUD read, `/assets/images/miroir-logo.png`, `GET /mcp` 405, dev `/`), plus no tracked change under `packages/`. Passed on today's binary.
- Deviations: the TLS skip checks `certs/localhost.pem`, not `certs/` (the folder is tracked, with a README). `/capabilities` answers `{ status, capabilities }`, so the checks read `capabilities.mcp`.
- Baseline: the 12 source-text tests pass (miroir-server 5 files, miroir-ai 3, miroir-core 5, miroir-standalone-app 6). Scoped nonreg `smoke,tooling`: all steps pass.

---

## Slice 1 — Tracer: REST through the factory, behind the gate, on port 0

**Status:** ✅ DONE

**Goal (observable):** a test reads Library books and runs an action over HTTP on an app built by `createMiroirServerApp`; the binary serves its REST API through the same factory.

**RED:** `serverApp.636.phase1.integ.test.ts`, with `serverTestPlatform`:
1. `authentication: { enabled: false, mcpEnabled: false }`: `GET /CRUD/<library deployment>/data/entity/<Book entity uuid>/all` answers 200 with the Library's books (uuids from `miroir-example-library` assets).
2. `POST /action/<actionType>` with a read-only action (for example a `rollback` of the Library through the Model endpoint, as `refreshLocalCachesForDeployedApplications` sends) answers `status: "ok"`.
3. `authentication.enabled: true`, no `Authorization` header: request 1 answers 401.
4. The BigInt probe (Allocated names) keeps its digits: request body revived, response replaced.

**GREEN:**
- `packages/miroir-server-library`: `package.json` (deps `miroir-core`, `miroir-mcp`, `express` 5.3.0, `body-parser` 2.4.0, `cors` 2.8.6, `loglevelnext`; dev deps `miroir-env`, `miroir-localcache-redux`, `miroir-store-filesystem`, `miroir-app-admin`, `miroir-app-miroir`, `miroir-example-library`, `vitest`, types), `tsconfig.json`, `vitest.config.ts`, `tsup.config.js` modelled on `miroir-mcp`'s; `npm install` updates `package-lock.json`.
- `createMiroirServerApp`: `express()`, CORS when `corsAllowedOrigins`, `json replacer`, `bodyParser.json({ limit: '50mb', reviver })`, the authentication gate, `requestGate` and the REST loop moved from `server.ts` 613–724; returns `{ app, requestGate, authenticationGate, close }` (MCP joins in Slice 3).
- `server.ts`: removes 295–305 and 613–724, calls the factory after boot, registers its unmoved routes on the returned `app`, and uses the returned `authenticationGate` / `requestGate` in change-password, the MCP gate and CopilotKit.
- Source tests that pin the moved gate text follow it: `mcpServerGate.263.phase7` (one gate) and `authentication.71.phase6` (`createIdentityGateMiddleware(authenticationGate)` now in the library file; the binary passes the factory's `requestGate`).
- `serverTestPlatform.ts`: `openTestEnvironment("test-filesystem", { reseed: true })`; the server config from `environmentServerConfig(environment.resolved)` (the client-shaped `environment.miroirConfig` has no `server` block); `miroirCoreStartup`, the filesystem store startup, loggers, `MiroirContext`, `PersistenceStoreControllerManager` on `server.filesystemDeploymentRootDirectory`, `setupMiroirDomainController` in local mode; `bootEnvironment(domainController, environment.resolved, process.env)` for `applicationDeploymentMap`; `setProcessTokenSecret` with a test secret; `getProcessCapabilities` for `capabilities`.

**Refactor checkpoint:** the REST loop's `CustomRequest` type and helpers move with it; grep shows no duplicated block between the two files.

**Validation:**
```bash
npm run build -w miroir-server-library
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-server-library -- serverApp.636.phase1
npm run testByFile -w miroir-server -- mcpServerGate.263
RUN_TEST=authentication.71.phase6 npm run testByFile -w miroir-core -- authentication.71.phase6
npx tsc --noEmit --skipLibCheck -p packages/miroir-server-library/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npm run build:server -w miroir-server && python -m pytest scripts/tests/test_server_release_smoke.py -q
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,tooling
```

### Realization
- New package `packages/miroir-server-library` (tsup, vitest single worker, `private: true`), added to `package-lock.json` and to `.gitignore` (`dist*/`). `createMiroirServerApp` builds `express()`, CORS, the `json replacer`, the body parser and the shared gate, then the REST loop. It returns `{ app, authenticationGate, requestGate, close }`.
- `server.ts` computes `capabilities` and calls `setProcessCapabilities` once, before the factory call. It then adds its routes that have not moved yet to the returned `app`, and passes the factory's `requestGate` to CopilotKit.
- BigInt probe: `POST /query` with two runtime transformers. `sum` (`+` of two tagged BigInts) only reaches BigInt addition if the reviver ran, and returns the digits as a string. `echo` returns a revived BigInt, which only the replacer can write out. Removing either the reviver or the replacer makes the test fail (checked).
- The action test is a Library `rollback` through the Model endpoint. Query payloads need `applicationSection: "data"`.
- Source tests: `mcpServerGate.263.phase7`, `authentication.71.phase6` and `cursorSdk.275.phase0` now check `createIdentityGateMiddleware(authenticationGate)` in the library file and `requestGate: requestGate` in the binary.
- Lint (`miroir/type-escape`) refused `as unknown as RequestHandler`. `requestGate` is now a small wrapper around the identity middleware.
- Scoped nonreg `smoke,core,actions,tooling`: all 57 steps pass. Release smoke passes.

---

## Slice 2 — Auth and capabilities routes from the factory

**Status:** ✅ DONE

**Goal (observable):** a client of the factory's app learns whether authentication is on, reads the process capabilities, logs in and calls REST with the token.

**RED:** `serverApp.636.phase2.integ.test.ts`:
1. `GET /auth/status` returns `buildAuthStatusBody` for the given `authentication` option (on and off).
2. `GET /capabilities` returns what `getProcessCapabilities` gives on the test registers (recomputed per request, as today).
3. `POST /auth/login` as `alice` / `alice-dev` returns a token; the Slice 1 REST read with that token answers 200 (the test first checks alice has access to the Library deployment in the Admin fixture; if not, it reads a deployment she has).
4. Wrong password: 401.
5. `POST /auth/change-password` with alice's token and current password succeeds, then login with the new password succeeds (state reseeded per test file).

**GREEN:** move `server.ts` 329–342 and 726–799 into the factory, at their places in D3's order; the binary drops them.

**Refactor checkpoint:** if the factory passes about 250 lines, extract `authRoutes.ts` and `restRoutes.ts` (private modules, not exported).

**Validation:**
```bash
npm run build -w miroir-server-library
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-server-library -- serverApp.636
RUN_TEST=authentication.71.phase6 npm run testByFile -w miroir-core -- authentication.71.phase6
npx tsc --noEmit --skipLibCheck -p packages/miroir-server-library/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,external
```

### Realization
- `/auth/status` and `/capabilities` are registered right after the parsers. `/auth/login` and `/auth/change-password` come after the REST loop, with their `resolveGatedPrincipal`. The binary drops all four.
- Alice (`alice` / `alice-dev`) can read the Library, so test 3 needed no fallback. Test 5 changes her password, and the next login uses the new one.
- Found: `build:server` bundles the library's `dist/`, so the library must be rebuilt before it. A stale `dist` gave 404 on `/capabilities` in the release smoke. The nonreg step and the build lists of Slice 6 build it first.

---

## Slice 3 — MCP from the factory

**Status:** ✅ DONE

**Goal (observable):** an MCP client lists Miroir's tools on the factory's app, and is refused without a token when MCP authentication is on; the binary still runs the dedicated MCP listener from the returned handle.

**RED:** `serverApp.636.phase3.integ.test.ts`:
1. `capabilities.mcp` on, `mcpEnabled: false`: `listMcpToolsViaHttp(<base>/mcp)` returns tools including a Library endpoint tool (the transport answers in SSE; the helper parses it).
2. `mcpEnabled: true`, no token: 401 (replaces the "one gate for both MCP mounts" text check of `mcpServerGate.263.phase7`).
3. `capabilities.mcp` off: `/mcp` is not mounted on the main app (404); `mcpServer` is still returned.
4. `close()` stops the registry; a second `close()` is harmless.

**GREEN:** move `server.ts` 810–833 into the factory (`EndpointToolRegistry`, a dedicated `express()` for `setupMcpServer` with the gate built from `authentication.mcpEnabled`, `mountHttpRoutes(app, gate)` when `shouldMountMcpHttp`); return `mcpServer`; `close()` calls `mcpServer.shutdown()`. The binary keeps `mcpServer.run(mcpPort)`. Repoint the MCP strings of `processCapabilitiesMcp.273.phase6`, `mcpToolRunner.253.phase0`, `processCapabilities.273.phase0` and the resolution part of `mcpServerGate.263.phase7` (analysis D6).

**Refactor checkpoint:** `shutdown()` with no listener does not throw (it guards on `httpServer`, `mcpServer.ts:271`).

**Validation:**
```bash
npm run build -w miroir-server-library
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-server-library -- serverApp.636
npm run testByFile -w miroir-server -- mcpServerGate.263
RUN_TEST=processCapabilities.273 npm run testByFile -w miroir-core -- processCapabilities.273.phase0
npm run testByFile -w miroir-standalone-app -- processCapabilitiesMcp.273.phase6 mcpToolRunner.253.phase0
npx tsc --noEmit --skipLibCheck -p packages/miroir-server-library/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npm run build:server -w miroir-server && python -m pytest scripts/tests/test_server_release_smoke.py -q
npm run nonreg:filesystem -- --runner shared   # full run after three slices
```

### Realization
- The factory builds the `EndpointToolRegistry`, the dedicated MCP app (CORS, body parser without reviver, as before) and the MCP gate (`{ ...authenticationGate, enabled: authentication.mcpEnabled }`). It mounts `/mcp` on its app under `shouldMountMcpHttp(capabilities.mcp)` and returns `mcpServer`. `close()` calls `mcpServer.shutdown()` once.
- `listMcpToolsViaHttp(baseUrl)` lists tools whose names start with `Library`. With `mcpEnabled`, a raw `POST /mcp` answers 401. With the capability off, it answers 404.
- Source tests repointed: `mcpServerGate.263.phase7` (the switch is resolved in the binary; the MCP gate, `setupMcpServer` and `mountHttpRoutes` checks moved to the library file), `processCapabilitiesMcp.273.phase6`, `mcpToolRunner.253.phase0` and `processCapabilities.273.phase0`.
- Full `nonreg:filesystem`: 120 steps pass.

---

## Slice 4 — The tail: assistant slot, assets and client folders as options

**Status:** ✅ DONE

**Goal (observable):** a host serves its own `index.html` and static assets by passing folders, and plugs its assistant route in with Miroir's identity gate; every API route and the slot still win over the client catch-all.

**RED:** `serverApp.636.phase4.integ.test.ts`:
1. `clientDirectory` = a temp folder with `index.html`: `GET /` and `GET /some/client/route` return it; the Slice 1 REST read still answers JSON; `GET /mcp` still answers 405; `GET /auth/status` still JSON (order by behaviour, P4).
2. `clientDirectory` without `index.html`: the factory rejects with today's message.
3. `assets: { directory: <temp>, mountPath: "/assets" }`: `GET /assets/x.txt` returns the file; without `assets`: 404 (or the catch-all's `index.html` when a client folder is given).
4. `assistantRoute` is awaited once with the app and `{ requestGate, capabilities }`; a `GET /api/copilotkit/x` it registers wins over the catch-all.
5. With `authentication.enabled: true`, a route the slot gates with `requestGate` answers 401 without a token and 200 with alice's token (replaces the text order checks of `cursorSdk.275.phase0` and `authentication.71.phase6`).

**GREEN:** move `server.ts` 346–388 (assets; `__filename`/`__dirname` at 357–358 stay in the binary, used by TLS and the client path), 842–852 (CopilotKit, through the slot) and 856–888 (client folder and catch-all) into the factory. In the binary, TLS (835–840) moves before the factory call; the binary passes `path.join(__dirname, '..', 'public')`, `path.join(__dirname, 'client')` (prod only) and `assistantRoute: (app, ctx) => mountCopilotKitRoute(app, { capabilities: ctx.capabilities, requestGate: ctx.requestGate, mcpHttpUrl: agentMcpHttpUrl({ restPort, mcpPort, tls }), … })`, and adds its dev `GET /` after the factory call. Repoint `cursorSdk.275.phase0` (server describe block points to the behaviour test, keeps the `mountCopilotKitRoute.ts` checks), `cursorSdk.275.phase2`, `processCapabilities.273.phase0` (CopilotKit call), `authentication.71.phase6`.

**Refactor checkpoint:** the binary's `filesystemDeploymentRootDirectory` logs stay; drop variables `server.ts` no longer reads.

**Validation:**
```bash
npm run build -w miroir-server-library
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-server-library -- serverApp.636
npm run testByFile -w miroir-ai -- cursorSdk.275
npm run testByFile -w miroir-standalone-app -- cursorSdk.275.phase2
RUN_TEST=authentication.71.phase6 npm run testByFile -w miroir-core -- authentication.71.phase6 processCapabilities.273.phase0
npm run testByFile -w miroir-server
npx tsc --noEmit --skipLibCheck -p packages/miroir-server-library/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npm run build:server -w miroir-server && python -m pytest scripts/tests/test_server_release_smoke.py -q
npm run nonreg:filesystem -- --runner shared --scope smoke,core,external,ui
```

### Realization
- Options `assets`, `clientDirectory` and `assistantRoute`. A missing `index.html` makes the factory reject before MCP starts, because the client folder is checked first. Assets come right after `/capabilities`. The slot runs after `/mcp`, and the client folder and its catch-all come last.
- In the binary, TLS is computed before the factory call. The binary passes `pathToPublic`, `path.join(__dirname, 'client')` (prod only) and a slot that awaits `mountCopilotKitRoute(miroirApp, { …, requestGate, … })`. The dev `GET /` is registered after the call.
- Behaviour tests: a temporary `index.html` at `/` and `/some/client/route`; assets; REST, `/auth/status`, `/mcp` and the slot's route all win over the catch-all; no folders gives 404; the slot's gated route answers 401 without a token and 200 with alice's.
- Source tests repointed: `cursorSdk.275.phase0` and `phase2`, `authentication.71.phase6`, `processCapabilities.273.phase0` and `mcpServerGate.263.phase7`.
- Release smoke: a production-mode check was added (`MiroirServer(node_env="production")` in `scripts/agent_bench/miroir_server.py`). It checks that `release/client/index.html` is served at `/` and on a client route, with `/capabilities` and the assets still answering. It is skipped when `release/client` is missing.

---

## Slice 5 — Mount rules; `server.ts` becomes the thin binary

**Status:** ✅ DONE

**Goal (observable):** a host mounts Miroir's app on its own Express app without losing BigInt values; `miroir-server` is CLI, config, boot, TLS and `listen` around one factory call.

**RED:** `serverApp.636.phase5.integ.test.ts`:
1. `host = express(); host.use(miroirApp); host.use(express.json()); host.get("/mine", …)` on port 0: the BigInt probe keeps its digits through the host; `/mine` answers (when no client folder is given).
2. The factory's TSDoc states both mount rules (checked by reading the built `.d.ts`, one assertion).

**GREEN:**
- Remaining source tests (analysis D6): `mountCopilotKitRoute.lazyImport.unit` (both files), `secrets.270.phase0`, `serverSecrets.unit` and `cursorSdk.275.phase4` (both files), `secretsImport.270.phase6` (binary). Non-test readers: `check_bare_console.py`, `graduated-smells.test.mjs`, `eslint-suppressions.json` (re-run `npm run lint`; update suppressions for the new file if its counts change).
- Remove from `server.ts` every import it no longer uses; drop `body-parser` and `cors` from `miroir-server/package.json` if the binary no longer imports them.

**Refactor checkpoint:** read the final `server.ts` top to bottom: only CLI, config, stores, domain controller, boot, capabilities, TLS, factory call, dev route, `listen`, `mcpServer.run`, signal handling. Target under about 450 lines.

**Validation:**
```bash
npm run build -w miroir-server-library
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-server-library
npm run testByFile -w miroir-server
npm run testByFile -w miroir-ai -- cursorSdk.275
npm run testByFile -w miroir-core -- secrets.270.phase0 secretsImport.270.phase6 serverSecrets
npm run lint
python scripts/check_bare_console.py
python scripts/check_dependency_policy.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npm run build:server -w miroir-server && python -m pytest scripts/tests/test_server_release_smoke.py -q
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,runners,external,tooling
```

### Realization
- Mount test: a host does `host.use(miroirApp)`, then `express.json()`, then `POST /mine`. The BigInt echo keeps its tag through the host, and the host's route answers.
- The TSDoc mount rules were missing from `dist/index.d.ts` because the root `tsconfig.json` sets `removeComments: true`. The library's `tsconfig.json` sets it to `false`, so the published types keep the TSDoc and `@public` tags. This is a point for I5's manifest work: the same root setting strips TSDoc from every package's types.
- Source tests now check both files: `cursorSdk.275.phase4` (no `@cursor/sdk`), `mountCopilotKitRoute.lazyImport.unit` (no static `miroir-ai`), `secrets.270.phase0` (no `/secrets` route) and `serverSecrets.unit` (no `process.env` dump; the library reads no `process.env` or `process.argv` at all). `secretsImport.270.phase6` stays on the binary and needed no change. The non-test readers (`check_bare_console.py`, `graduated-smells.test.mjs`, the `eslint-suppressions.json` entry) still apply to the binary unchanged, and both checks pass.
- `server.ts` dropped every import that only the moved code used (the `--noUnusedLocals` check is clean), plus the `CustomRequest` type. It went from 945 to 648 lines. The rest is the command line, config, logging presets, stores, domain controller, boot, secrets, TLS, the factory call, the dev route, `listen` and `mcpServer.run`. The boot alone is about 160 lines, and I4 may move it into `startMiroirNode`.
- `miroir-server/package.json` no longer lists `body-parser`, `cors`, `express` or their `@types`. ncc inlines them from the library.

---

## Slice 6 — Boundary guard, build lists, docs, cleanup

**Status:** ✅ DONE

**Goal (observable):** adding a store or driver import to the library fails its build; CI builds, the Docker build path and the release binary work with the library inlined; the docs describe how to mount Miroir.

**RED:**
1. `tsup.config.js`: `metafile: true` and an esbuild plugin whose `onEnd` scans `result.metafile.outputs[*].imports` (external ones included: tsup's own external plugin runs first and marks every declared dependency external, so an `onResolve` hook would not see them) and fails the build on a D5 specifier.
2. `scripts/tests/test_server_library_boundaries.py`:
   - static, runs in `pr-checks.yml` (no Node there): the library's `package.json` `dependencies` and `peerDependencies` name none of the D5 list (P3); `miroir-server-library` appears in `build-all.sh`, the Dockerfile, `build-linux-runnables.yml` (build step and `dist-shared-libs` artifact list), `self-test.yml`, `ci/build/build_server.sh`; it is absent from `build:server`'s `-e` list;
   - skipped when the library is unbuilt, run by the nonreg step: the built `dist/index.js` imports none of the D5 list; a probe build (`MIROIR_SERVER_LIBRARY_PROBE=1`, read only by `tsup.config.js`, adds `tests/support/forbiddenImportProbe.ts` importing `miroir-store-filesystem` as an entry, output to a temp folder) fails with the plugin's message.

**GREEN:** the plugin; the build-list edits (D7); the two nonreg steps (Allocated names): `unit-636-server-library` = `bash -c "npm run build -w miroir-server-library && MIROIR_ENV=test-filesystem npm run testByFile -w miroir-server-library && python -m pytest scripts/tests/test_server_library_boundaries.py -q"`, `build-636-server-release` = `bash -c "npm run build:server -w miroir-server && python -m pytest scripts/tests/test_server_release_smoke.py -q"`.

**Docs:** `packages/miroir-server-library/README.md` (factory, options, preconditions, mount rules, example host); the server or startup reference page under `docs/reference/` (the binary is now a thin host, link to the README); `docs/guides/build-it-yourself.md` build order; AGENTS.md build order line 5 gains `miroir-server-library` after `miroir-mcp`; the epic plan's I3 rows marked ✅ with "superseded by #636's plan", and its I1 rows still ⬜ fixed.

**Cleanup (#238 rule):** move still-valuable assertions of `tests/issues/636-server-library/` into `tests/createMiroirServerApp.integ.test.ts`, delete the issue directory, update the nonreg step.

**Tracer narrative:**
- Manual: `./build-all.sh`, `npm run build:release -w miroir-server`, `NODE_ENV=development node packages/miroir-server/release/index.js`, open the Vite client at http://localhost:5173, log in, open a Library report, run an MCP tool from the tool page.
- Automated equivalent: `unit-636-server-library`, `build-636-server-release`, and the standalone-app runner and MCP nonreg steps.

**Validation:**
```bash
python -m pytest scripts/tests -q
python scripts/sync_agent_skills.py --check
python scripts/check_dependency_policy.py
npm run lint
npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server-library/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared
```
On the PR: `build-linux-runnables.yml` (shared-libs build, artifact list, `build:release`) is the Docker and release build path in CI.

### AC checklist

| Acceptance criterion (#636) | Proof |
|---|---|
| A new workspace package exports a factory returning the HTTP surface without listening; a test mounts it and exercises a REST action, `/capabilities`, `/auth/status`, MCP `tools/list` | `createMiroirServerApp.integ` (from phases 1–3: CRUD read, `POST /action`, `/capabilities`, `/auth/status`, `listMcpToolsViaHttp`) |
| Client folder and static assets folder are parameters; a test serves `index.html` from a temp folder | `createMiroirServerApp.integ` (from phase 4) |
| The library imports no store package or driver, and the build fails if one is added | tsup `onEnd` metafile plugin; `test_server_library_boundaries.py` probe build |
| `miroir-server` keeps its behaviour, command line and release bundle; server nonreg steps, Docker build path and release binary keep working | `test_server_release_smoke.py` (Slice 0 baseline, rerun each slice), `build-636-server-release`, full `nonreg:filesystem`, `build-linux-runnables.yml` on the PR |
| Source-text tests on `server.ts` follow the code or become behaviour tests | the 12 tests of analysis D6, repointed in slices 1, 3, 4, 5; behaviour tests in phases 3 and 4 |

### Realization
- `tsup.config.js` turns on `metafile` and adds a plugin. Its `onEnd` hook checks two things: the imports left in the output (declared dependencies that tsup marks external) and the bundled inputs (the package each input file comes from, either a sibling workspace package or one under `node_modules`). Both probe modes fail with the plugin's message: a bundled store and a store left external as a declared dependency (`MIROIR_SERVER_LIBRARY_PROBE`, `MIROIR_SERVER_LIBRARY_PROBE_EXTERNAL`).
- `scripts/tests/test_server_library_boundaries.py` runs 12 checks. Seven are static, so they run in pr-checks: the declared dependencies, `private`, the five build files, the artifact list, and no `-e` in `build:server`. Three need a build and are skipped without one: the metafile scan and the two probe builds.
- Build lists: `build-all.sh` (`ALL_PACKAGES`, `STAGE_APPS`, step 7 label), the Dockerfile (after `miroir-mcp`), `build-linux-runnables.yml` (the react / diagram step and the `dist-shared-libs` artifact list), `self-test.yml`, and `ci/build/build_server.sh` (after step 6).
- Nonreg steps: `unit-636-server-library` (scopes core, actions, runners, tooling) and `build-636-server-release` (external, tooling), both `tier: default`, `requires: none`, `parallel: false`.
- Docs: the package README (use, mount rules, route order, boundaries, tests); `docs/internals/application-startup.md`, new section "The server and its library (#636)"; `docs/guides/build-it-yourself.md` (step 5). The epic plan marks its I1 rows ✅ #627 and its I3 rows as done by #636 (the slices are superseded).
- AGENTS.md is not changed. Adding `miroir-server-library` to its build order pushes the file over the size cap enforced by `test_agent_instructions.py` (12288 bytes), and `build-all.sh` is the canonical order.
- Cleanup: the five `tests/issues/636-server-library/` files are merged into `tests/createMiroirServerApp.integ.test.ts` (22 tests) and the issue directory is deleted. The comments in the repointed source tests name the new file.
- Gate: skills sync, `pytest scripts/tests` (359 passed, 3 skipped), dependency policy, lint, `miroir-env check --strict --tracked-clean`, `tsc` on core, the library and the server, and the miroir-core unit tests (3252 passed).
- A scoped nonreg after slices 4 and 5 failed one step, `integ-action.domainController.freezeApplicationVersion` (an upsert during freeze reported "Entity not found in model section"). The step passed when rerun alone and in the full run after Slice 3. It runs on the emulated server, which this issue does not touch.

---

## Revision history

- v1: initial plan.
- v2, after an adversarial review: the factory returns its gate from Slice 1 so unmoved binary routes do not need a copy (P1); the assistant slot moves with the client catch-all (Slice 4), so the catch-all never precedes it; route order locked by HTTP behaviour, not a router stack (P4); Slice 0 characterizes the release binary instead of reading `server.ts`; the test platform uses `environmentServerConfig`; the build guard scans the metafile in `onEnd` (an `onResolve` hook misses declared dependencies); the pytest guard splits into a static part for `pr-checks.yml` and a built part for nonreg; the release smoke reuses the `bench-agent` launcher; BigInt probe and test user named; `POST /action` added to the AC proof; `__dirname` stays in the binary; `listMcpToolsViaHttp` and an awaited slot; full nonreg after Slice 3, `core` scope where access is touched, step fields (`tier`, `requires`, `parallel`); `body-parser` and `cors` dropped from `miroir-server` when unused; P3 recorded as a deviation.
- v3, after an adversarial review of the code (no blocker):
  - The release smoke runs only with `MIROIR_RELEASE_SMOKE=1`, and the probe builds only with `MIROIR_LIBRARY_BUILD_CHECKS=1`. Both are set by the two #636 nonreg steps, so `pytest scripts/tests` (pre-push gate, `unit-301`) never starts a stale bundle or takes ports 3080 and 4080.
  - The production check moved to its own module, so the two server fixtures no longer depend on each other's order.
  - The tracked-file check ignores untracked files and paths that were already dirty.
  - The factory stops the MCP registry if the assistant slot or the client folder throws. `close()` keeps its "closed" flag only after a successful shutdown, and its TSDoc says it does not remove routes.
  - The logger uses a layer number. The binary logs the MCP port and the production client folder again.
  - The forbidden list now also covers `pg-*`, `@sequelize/*`, `*-level` and subpaths, on both sides.
  - New tests: the `/capabilities` route ignores the option and recomputes from the registers; with authentication on and MCP authentication off, REST answers 401 and `/mcp` stays open.
  - The build-list guard checks order (after `miroir-mcp`, before the release), not just the name.
  - The MCP source checks match the gated `mcpServer.run` call instead of the bare import names.
