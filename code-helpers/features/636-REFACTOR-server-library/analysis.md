# 636 — Extract a server library from miroir-server

> `miroir-server/src/server.ts` is a 945-line top-level-await script. This analysis frames its split into a library that builds Miroir's HTTP surface from a running domain controller, and a thin binary that keeps the command line, the environment, the boot, TLS and `listen`.

Related issue: https://github.com/miroir-framework/miroir/issues/636
Parent issue: #621 (epic, item I3) · Prerequisites: #627 ✅ (#629), #633 ✅ (#634)
Related analyses: [`../621-FEATURE-npm-packages/analysis.md`](../621-FEATURE-npm-packages/analysis.md) (§4.5 server as a script, §8 question 2), [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md) (I3 slices), [`../633-REFACTOR-app-shell-to-react/analysis.md`](../633-REFACTOR-app-shell-to-react/analysis.md) (host slots, the pattern reused here)
Key sources: [`server.ts`](../../../packages/miroir-server/src/server.ts), [`mountCopilotKitRoute.ts`](../../../packages/miroir-server/src/mountCopilotKitRoute.ts), [`mcpServer.ts`](../../../packages/miroir-mcp/src/mcpServer.ts), [`RestServer.ts`](../../../packages/miroir-core/src/4_services/RestServer.ts), [`mcpTestPlatform.ts`](../../../packages/miroir-mcp/tests/integration/mcpTestPlatform.ts)

**Document role:** analysis and decision record.
**Status:** decisions taken on the recommended options (the user delegated the choice: "adversarial reviews and stop when PR can be merged"); revised after an adversarial review (§8).

---

## Sequencing

| Step | Item | State |
|---|---|---|
| I1 | Endpoint surfaces (#627) | ✅ #629 |
| I2 | App shell to `miroir-react` (#633) | ✅ #634 |
| **I3** | **Server library (this issue)** | **this** |
| I4 | One startup call per side | next; its branch starts from this issue's PR-ready branch (the user's sequencing, not a code dependency: epic plan line 55 lets I4 start alone) |
| I5 | Manifest hygiene | after I4 |

---

## 1. Goals

- **G1 — Mount Miroir on my own server.** In order to serve Miroir's API next to my own routes as a Node application developer, I can build Miroir's HTTP surface (REST, auth, capabilities, MCP) from one library call and mount it on an Express app I own.
- **G2 — Serve my own client bundle.** In order to deploy my own React application as an application maintainer, I can tell the server which client folder (and which static assets folder) it serves, without editing the server's code. This is the hook the post-epic issue ("the server serves the user's bundle") starts from. Two facts it inherits: the Dockerfile copies the client build into `packages/miroir-server/public` (`Dockerfile:139-140`) while the release reads `release/public` and `release/client`; and the `/assets` public mount is registered before the client folder, so a Vite bundle's own `assets/` files lose a name clash.
- **G3 — Pick my stores.** In order to install only the database drivers I use as a Node application developer, I can use the server library without it importing any store package or driver.
- **G4 — Same server.** In order to keep my deployments working as a Miroir operator, the `miroir-server` binary keeps its command line, environment selection, secrets, authentication, TLS, ports, release bundle and Docker image.
- **G5 — Tests that start the surface.** In order to catch wiring regressions as a Miroir developer, I can start the HTTP surface in-process in a test, instead of reading `server.ts` as text.

## 2. Non-goals

- One startup call for Node hosts (`startMiroirNode`: loggers, `miroirCoreStartup`, store registration, `MiroirContext`, `PersistenceStoreControllerManager`, domain controller). Owned by I4, which starts from this issue's branch. Here the binary keeps building the domain controller as today.
- Opening deployments, environment reconciliation, secret import and hydration (`server.ts` ~445–611). They are boot, not HTTP; they stay in the binary until I4 decides whether they join `startMiroirNode`.
- The package rename to `@miroir-framework/server` and its public manifest (I5, I6).
- Serving a user's bundle chosen at deployment time (post-epic issue). G2 only makes the folder a parameter.
- Rewriting the REST handlers (`restServerDefaultHandlers`, miroir-core) or the MCP server (`miroir-mcp`).

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1 Where the library lives | **a new workspace package `miroir-server-library`**; `miroir-server` stays the private binary | G1, G3, G4 |
| D2 What the factory returns | **an Express application, not listening**, mounted at the host's root, plus the MCP server handle | G1, G2, G5 |
| D3 What the library owns | **HTTP only**: REST, auth, capabilities, assets, MCP, the SPA; the boot, config, CLI, TLS and `listen` stay in the binary | G1, G4 |
| D4 Host features | **options of the factory**: process capabilities, resolved authentication switches, CORS origins, `clientDirectory`, `assets`, and an `assistantRoute` slot for CopilotKit; no path default derived from the library's own location | G1, G2, G3 |
| D5 Stores | **not a parameter of the library at all**: it takes a running domain controller; the binary registers the stores | G3 |
| D6 Source-text tests on `server.ts` | **become behaviour tests on the factory where they check wiring; the rest follow the code** | G5 |
| D7 Release bundle | **ncc bundles the library into `release/index.js`** (as it already does for `miroir-env`); the package is `private` until I5/I6 | G4 |

**Rationale:** the domain controller is already the seam between persistence and HTTP. Taking it as input keeps the library free of stores, config files and boot order. The library then only builds routes, which a test can start on port 0. The host-slot pattern of #633 (`MiroirShellHostContext`) handles the one host feature with a heavy optional dependency (CopilotKit, `miroir-ai`).

### D1 — Where the library lives

**Status:** Accepted — new package `miroir-server-library`. **Serves:** G1, G3, G4.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **a. New package `miroir-server-library`** | `packages/miroir-server-library`, tsup, `exports: "."`; `miroir-server` depends on it | matches the epic target (`@miroir-framework/server` = new, private binary stays); the library gets its own dependency list, without stores or `miroir-env` | one more package in `build-all.sh`, the CI build lines, the Dockerfile build steps and the session setup |
| b. A `library/` folder inside `miroir-server` with an `exports` entry | one package, two entries | fewer build lists to touch | the published package would carry the binary's dependencies (four stores, `miroir-env`, `isomorphic-git`); I6 would have to split it anyway |
| c. Put the factory in `miroir-mcp` | it already owns an Express app | no new package | wrong owner: MCP is one route among many; the CLI would carry Express routes it never mounts |

Name: `miroir-server-library` is the pre-rename name of `@miroir-framework/server` (I6). Where I4's `startMiroirNode` lives is I4's call: the epic plan puts it in `miroir-localcache-redux/node` until I6 (`621…/tdd-implementation-plan.md:639`), which keeps Express out of the CLI.

The epic plan's provisional I3 slices are superseded by this analysis and its plan: the factory is not `createMiroirRouter` returning a router (D2), "stores injected" (slice 4) becomes "no store at all" (D5), and the nonreg step name follows this issue's plan.

### D2 — What the factory returns

**Status:** Accepted — an unstarted Express application. **Serves:** G1, G2, G5. Settles epic analysis §8 question 2.

| Option | Pros | Cons |
|---|---|---|
| a. `express.Router` | the lightest mount | app settings are out of reach: `server.ts` sets `app.set("json replacer", bigintJsonReplacer)` (line 304), and a router cannot; `MiroirMcpServer.mountHttpRoutes` is typed on `Express` |
| **b. `express()` application, not listening** | mountable with `hostApp.use(miroirApp)`: in Express 5.3 the sub-app's own `json replacer` applies (`express/lib/application.js:118-121,169-170`, `response.js:240`); a test runs it with `app.listen(0)`; the binary wraps it in `https.createServer` as today | the host cannot interleave its own routes inside Miroir's order; **a host body parser that runs first wins** (body-parser 2.4.0 `lib/read.js:46` skips an already-read body), which drops the BigInt reviver and the 50 MB limit (`server.ts:305`) |
| c. A started server (`listen`, TLS) | one call for the binary | takes the HTTP server away from the host, which G1 and G2 need; TLS policy (cert discovery under `<repo-root>/certs`) is binary-specific |

**Mount rules** (documented on the factory, tested):
- **Root only in this issue.** `agentMcpHttpUrl` builds `/mcp` at the root (`mountCopilotKitRoute.ts:30-38`), the client's `rootApiUrl` points at the root, the SPA catch-all and Vite's absolute `/assets/...` URLs assume it. A `mountPath` option is left to the post-epic bundle issue.
- **Before any host body parser.** A test mounts the app behind a host that has its own `express.json()` registered *after* the mount and sends a BigInt through.

The REST layer itself survives a mount: `deploymentUuidsFromHttpRequest` reads params and body only (`deploymentUuidFromHttpRequest.ts:75`) and `op.handler` uses `originalUrl` for logging.

Shape (indicative; the plan fixes the names):

```ts
createMiroirServerApp(options): Promise<{
  app: Express;               // REST, auth, capabilities, assets, /mcp (when gated in), assistant, SPA
  mcpServer: MiroirMcpServer; // the binary calls mcpServer.run(mcpPort) for the dedicated MCP listener
  close(): Promise<void>;     // stops the tool registry subscription (tests, embedding hosts)
}>
```

### D3 — What the library owns

**Status:** Accepted — HTTP only. **Serves:** G1, G4.

| `server.ts` block (lines) | Owner after this issue |
|---|---|
| log preset, argument parsing, usage (100–228) | binary |
| environment or config file (230–273) | binary |
| ports from `rootApiUrl` / `mcpUrl`, CORS default origins (276–293) | binary computes; library takes `corsAllowedOrigins` |
| `filesystemDeploymentRootDirectory`, the set-up log lines (344, 389–398; used only by the listen log, 929) | binary |
| `express()`, CORS, BigInt JSON replacer and reviver, body parser (295–305) | library |
| authentication switches, token secret (307–327) | binary resolves (argv, env, config); library takes `authentication: { enabled, mcpEnabled }` |
| `/auth/status`, `/capabilities` (329–342) | library |
| static assets under `assetsMountPath` (346–388) | library serves; the binary keeps the literal `path.join(__dirname, '..', 'public')`, which ncc relocates into `release/public` (`release/index.js`, `__nccwpck_require__.ab + "public"`), and passes it |
| `miroirCoreStartup`, store registration, loggers, `MiroirContext`, `PersistenceStoreControllerManager`, domain controller (399–443) | binary (I4 moves it into `startMiroirNode`) |
| boot deployments, secrets, environment reconciliation, `recordInstallsOf` (445–611) | binary |
| authentication gate, REST loop over `restServerDefaultHandlers` (613–724) | library |
| `/auth/login`, `/auth/change-password` (726–799) | library |
| capabilities computed once, `domainController.setProcessCapabilities` (801–808) | binary: it changes the domain controller, not HTTP (Electron does the same, `ipcServerSetup.ts:114-115`); the binary passes `capabilities` to the factory and keeps them for the `mcpServer.run` gate. `/capabilities` still recomputes per request in the library, as today |
| `EndpointToolRegistry`, MCP app, `setupMcpServer`, `/mcp` on the main app (810–833) | library |
| certificate paths, `tlsEnabled` (835–840) | binary, computed **before** the factory call now (the assistant slot needs `mcpHttpUrl`, which depends on TLS); today it is computed after MCP setup |
| CopilotKit route (842–852) | binary, through the `assistantRoute` slot (D4) |
| SPA from `client/` in prod, `"App Works !!!!"` on `/` otherwise (856–892) | library serves `clientDirectory` when given; the binary keeps the default `path.join(__dirname, 'client')` (not relocated by ncc; `scripts/copy-client.mjs` copies the build into `release/client`), passes it in prod, and adds its dev `/` route after mounting |
| `https`/`http` `listen`, MCP `run` (894–939) | binary |

Preconditions the factory documents: stores are registered and the deployments open (`getProcessCapabilities` reads the registers, `processCapabilities.ts:93,101`); the token secret is set (`setProcessTokenSecret` / `getProcessTokenSecret`, `AuthenticationPolicy.ts:199`, process-global). `setupMcpServer` refreshes local caches and starts the registry even when MCP is off (`mcpServer.ts:141-163`): unchanged. The dedicated MCP app has no BigInt reviver or replacer (`server.ts:812-820`): kept as is.

Order inside the library app keeps today's order: CORS and parsers, `/auth/status`, `/capabilities`, assets, REST, auth routes, `/mcp`, assistant slot, client folder and its catch-all last (the catch-all `'/{*splat}'` must follow every API route, `server.ts` comment line 856).

### D4 — Host features as options

**Status:** Accepted. **Serves:** G1, G2, G3.

| Option field | Today in `server.ts` | Default |
|---|---|---|
| `domainController`, `persistenceStoreControllerManager`, `applicationDeploymentMap`, `miroirConfig` | module variables | required |
| `capabilities` | computed at 801–807 | required (the binary computes them and sets them on the domain controller) |
| `authentication: { enabled, mcpEnabled }` | `resolveAuthenticationEnabled` / `resolveMcpAuthenticationEnabled` from argv, env, config | required (the binary keeps the resolution, so `--disable-auth` stays a CLI concern) |
| `corsAllowedOrigins` | `corsAllowedOrigins` | no CORS middleware when absent |
| `assets: { directory, mountPath }` | `../public`, `server.assetsMountPath` or `/assets` | not served when absent; the library derives no default from `import.meta.url` (it would point inside the ncc bundle) |
| `clientDirectory` | `path.join(__dirname, 'client')`, prod only | not served when absent; when given, a missing `index.html` throws at build time, as today (line 866) |
| `assistantRoute(app, context)` | `mountCopilotKitRoute(app, {...})` | none: no `/api/copilotkit` |

The assistant slot keeps `miroir-ai` out of the library's dependencies: the binary passes a function that calls `mountCopilotKitRoute` (which stays in `miroir-server`) with the identity gate middleware the library builds (`createIdentityGateMiddleware(authenticationGate)`) and hands to the slot.

The library file is not a composition root (`eslint-rules/smells.mjs:10-14`): it reads no `process.env` and no `process.argv`; everything comes through options. Same reason as #633's `assistantPanel`: CopilotKit is a host feature.

### D5 — Stores

**Status:** Accepted — the library never sees a store. **Serves:** G3.

The epic plan (I3 slice 4) proposed passing "store startups" to the factory. The factory does not need them: it takes a domain controller whose stores are already registered and opened. Store registration (`miroir*StoreSectionStartup(ConfigurationService.configurationService)`, lines 399–403) stays with the binary now and goes into I4's `startMiroirNode(config, { stores })`. A guard checks that the library's sources and built entry import none of `miroir-store-*`, `pg`, `sequelize`, `mongodb`, `level`, `browser-level`, `classic-level`, `miroir-env`, `miroir-ai`, `@copilotkit/*`. It scans resolved import specifiers of the built files, not `package.json`: `miroir-mcp` declares the stores as optional peers (`package.json:48-62`) and imports them dynamically only from `src/startup/storeStartup.ts:40-48`, which its index does not reach.

### D6 — Source-text tests on `server.ts`

**Status:** Accepted. **Serves:** G5.

Twelve test files read `server.ts` as text: eleven by repository path (`grep -rln "miroir-server/src/server" packages --include=*.ts`) and one by a relative join (`miroir-server/tests/mountCopilotKitRoute.lazyImport.unit.test.ts:86-87`; the 263 test also joins `"../../../src/server.ts"`). Each was read:

| Test | What it pins | After this issue |
|---|---|---|
| `miroir-server/tests/issues/263-identity-doors/mcpServerGate.263.phase7.unit` | MCP switch resolution, one gate for both MCP mounts, CopilotKit gate | resolution stays a binary source check; the two-mount gate becomes a behaviour test on the factory (`/mcp` answers 401 without a token when `mcpEnabled`) |
| `miroir-standalone-app/.../processCapabilitiesMcp.273.phase6.unit` | `shouldMountMcpHttp`, `mountHttpRoutes`, `mcpServer.run` in `server.ts` | `shouldMountMcpHttp` / `mountHttpRoutes` in the library file; `mcpServer.run` in the binary |
| `miroir-standalone-app/.../mcpToolRunner.253.phase0.unit` (test "server.ts MCP HTTP mount is gated") | same three strings | same split |
| `miroir-core/.../processCapabilities.273.phase0.unit` | `await mountCopilotKitRoute(app`, `shouldMountMcpHttp`, `mountHttpRoutes`, `mcpServer.run` | CopilotKit call in the binary's assistant slot; the MCP strings split as above |
| `miroir-standalone-app/.../cursorSdk.275.phase2.unit` | `mountCopilotKitRoute(app, { capabilities,` | the slot's call in the binary |
| `miroir-core/.../authentication.71.phase6.unit` | `requestGate: createIdentityGateMiddleware(authenticationGate)` after the mount call (lines 23–26) | the gate is built in the library: same fate as `cursorSdk.275.phase0` (behaviour test of the slot's gate) |
| `miroir-server/tests/mountCopilotKitRoute.lazyImport.unit` | `server.ts` imports no `miroir-ai` statically | both files |
| `miroir-core/.../secrets.270.phase0.unit` | no `/secrets` route in `server.ts` | checks both files |
| `miroir-core/.../secretsImport.270.phase6.unit` | no `registerSecrets(parsed.secrets)` | binary only (argument parsing stays there) |
| `miroir-core/tests/4_services/serverSecrets.unit` | no `process.env` dump | both files |
| `miroir-ai/.../cursorSdk.275.phase0.unit` | `await mountCopilotKitRoute(app` followed by `createIdentityGateMiddleware(authenticationGate)`, `requestGate:` | the gate is built by the library and handed to the slot: a behaviour test (the slot receives a gate that answers 401 without a token when authentication is on) replaces the text order check |
| `miroir-ai/.../cursorSdk.275.phase4.unit` | no static `@cursor/sdk` import in `server.ts` (and Electron's `ipcServerSetup.ts`) | both server files |

Non-test readers of `server.ts` that follow the code: `scripts/check_bare_console.py:73`, `eslint-rules/graduated-smells.test.mjs:57`, the `server.ts` entry of `eslint-suppressions.json` (line 528).

### D7 — Release bundle

**Status:** Accepted — ncc bundles the library. **Serves:** G4.

`build:server` runs `ncc build src/server.ts -o release/` with `-e` for the packages loaded from `node_modules` at run time (`miroir-core`, `miroir-mcp`, the stores, …). Leaving `miroir-server-library` off that list makes ncc inline it, as it already inlines `miroir-env` (absent from `-e` today), so `release/` and the Docker image (which copies `packages/` and `node_modules`) need no new folder. The library still has to be built before `build:server` (ncc follows the workspace link to `dist/`). Places a new package joins:

| Place | What |
|---|---|
| `build-all.sh` | `ALL_PACKAGES` and the stage after `miroir-mcp` (lines 60–110) |
| `Dockerfile` | a build step before `build:release` |
| `.github/workflows/build-linux-runnables.yml` | the shared-libs build (line 180) and the `dist-shared-libs` artifact list (196–209, `if-no-files-found: error`), consumed by `build:release` (293) |
| `.github/workflows/self-test.yml` | the build lines (39–44) where the server's dependencies are built |
| `ci/build/build_server.sh` | the build before `build:server` (131–144) |
| `package-lock.json` | the workspace entry (`check_dependency_policy.py` checks it); exact pins `express` 5.3.0, `body-parser` 2.4.0, `cors` 2.8.6; `"*"` for internal packages |
| `package.json` of the library | `"private": true` until I5/I6: `ci/release/release_lib/plan.py:96-100` treats a non-private package as distributable |
| `scripts/nonreg-manifest.json` | a step for the library's tests |

`pr-checks.yml` never builds `miroir-server` and `scripts/agent_session_setup.py` builds no `miroir-mcp`: neither needs the library unless the plan adds its tests to them.

---

## 4. Current state

### 4.1 `server.ts` structure

A single module with top-level `await` (lines 408, 430, 454, 472, 484, 487, 606, 824, 844, 922). Express 5 (`express` 5.3.0), `body-parser` 2.4.0, `cors` 2.8.6. The block map is §3 D3's table. Facts that constrain the split:

- `domainController` is created with an external service client whose `persistRotatedSecret` closes over `applicationDeploymentMap`, which is only known after `openRegisteredDeployments()` (lines 436–442, 606). Boot order matters; it stays in the binary.
- The REST handler loop calls `op.handler(true, …, persistenceStoreControllerManager, domainController, op.method, request.originalUrl, body, {...params, ...query, authPrincipal})` (lines 663–673). The library needs `persistenceStoreControllerManager`.
- `capabilities` are computed twice: per request on `/capabilities` (lines 333–342) and once for MCP and CopilotKit (801–807), both from `ConfigurationService.configurationService` registers. The library reads the same registers: they are global (epic §4.7).
- MCP: `setupMcpServer(mcpApp, applicationDeploymentMap, endpointToolRegistry, domainController, mcpAuthenticationGate)` builds a dedicated app and starts the registry subscription (`MiroirMcpServer.setup`, `mcpServer.ts` 141–163); `/mcp` is also mounted on the main app when `shouldMountMcpHttp(capabilities.mcp)` (831–833); `mcpServer.run(mcpPort)` starts the dedicated listener (933–936).
- `mountHttpRoutes(targetApp: Express, …)` is typed on `Express` (`mcpServer.ts` 170): an `express()` sub-app satisfies it (D2-b); a `Router` does not.
- SPA: in `prod` mode only, from `path.join(__dirname, 'client')`; missing `index.html` throws (859–868); catch-all `'/{*splat}'` (879). Otherwise `GET /` answers `"App Works !!!!"` (889–891).

### 4.2 Store imports (misaligned with G3)

`server.ts` lines 93–96 import `miroir-store-filesystem`, `-indexedDb`, `-mongodb`, `-postgres`, and call their startups on `ConfigurationService.configurationService` (400–403). `miroir-server/package.json` lists the four, plus `express`, `body-parser`, `cors`, `cross-fetch`, `loglevelnext`, `miroir-env`, `miroir-ai`, `miroir-mcp`, `miroir-localcache-redux`, `miroir-app-admin`, `miroir-app-miroir`, `miroir-example-library`, `isomorphic-git` (imported nowhere in `src/`), `diff`, `json-diff`.

### 4.3 Tests

`miroir-server/tests/` holds unit tests of `mountCopilotKitRoute.ts` and `serverConfigFile.ts`, the #263 source-text test, and a child-process probe (`tests/support/mountProbeChild.mjs`) that imports `mountCopilotKitRoute.ts` with type stripping. Nothing starts the HTTP surface. The release binary is started only by `scripts/agent_bench/miroir_server.py` (benchmark) and the coverage and load-timing tours of the standalone app (`--serve`).

An in-process domain controller on `test-filesystem` already exists for MCP tests: `miroir-mcp/tests/integration/mcpTestPlatform.ts` (`openTestEnvironment(…, { reseed: true })`, `initializeStoreStartup`, `setupMiroirPlatform`, `bootEnvironment`). The library's tests reuse that recipe; their test code may import stores (G3 constrains `src/` only).

---

## 5. Key reuse

| Piece | Location |
|---|---|
| REST handlers | `restServerDefaultHandlers`, `miroir-core/src/4_services/RestServer.ts` (URLs `/CRUD/:deploymentUuid/:section/entity…`, `/action/:actionType`, `/query`, `/queryTemplate`) |
| Authentication gate and policy | `authenticateRequest`, `authorizeDeployment`, `createIdentityGateMiddleware`, `accessDirectoryLoader`, `loginWithPassword`, `persistChangedPasswordHash`, `persistPasswordChange`, `buildAuthStatusBody` (miroir-core) |
| Capabilities | `getProcessCapabilities`, `shouldMountMcpHttp`, `getClientEnvironment` (miroir-core) |
| MCP | `EndpointToolRegistry`, `setupMcpServer`, `MiroirMcpServer.mountHttpRoutes` / `run` / `shutdown` (miroir-mcp) |
| CopilotKit mount | `mountCopilotKitRoute`, `agentMcpHttpUrl` (`miroir-server/src/mountCopilotKitRoute.ts`, stays) |
| BigInt over the wire | `bigintJsonReplacer`, `bigintJsonReviver` (miroir-core, #48) |
| Test platform | `miroir-mcp/tests/integration/mcpTestPlatform.ts`; `openTestEnvironment`, `bootEnvironment` (miroir-env) |
| Package boundary guard pattern | `scripts/tests/test_shell_package_boundaries.py`, `eslint-rules/react-package-boundary.test.mjs` (#633) |

---

## 6. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Route order changes | the SPA catch-all swallows an API route, or CORS runs after a route | one library function registers in today's order; the plan's characterization test asserts a REST route, `/mcp` and the SPA together |
| `json replacer` lost when mounted | BigInt values lose digits (#48) | D2-b sub-app; a test sends and receives a BigInt through the mounted app |
| host body parser runs first | the BigInt reviver and the 50 MB limit are skipped | mount rule "before any host body parser", documented on the factory; a test with a host parser |
| path defaults move into the library | ncc relocation of `public` stops, the release serves no assets | the binary keeps the literal paths and passes them; the final slice starts the release binary and fetches an asset |
| Global singletons | a host that builds two apps shares `ConfigurationService` and logger state | documented; the factory reads registers, it does not register (no double registration) |
| ncc stops inlining | release binary misses the library at run time | the plan's final slice builds `release/` and starts it once (`/capabilities` answers) |
| Dedicated MCP listener and `/mcp` on the main app share one registry | already the case today (`setupMcpServer` then `mountHttpRoutes`) | unchanged; `close()` shuts the registry once |

---

## 7. Next

`tdd-implementation-plan.md` in this folder (skill `miroir-analysis-to-tdd-plan`).

## 8. Revision history

- v1: initial analysis.
- v2, after an adversarial review: root-only mount and "before any body parser" rules (D2); `capabilities` and `setProcessCapabilities` stay with the binary and enter as an option (D3, D4); path defaults stay in the binary for ncc relocation (D3, D4, D7); full list of build places and `private: true` (D7); `startMiroirNode` placement left to I4, epic I3 slices marked superseded (D1); 12 source-text tests plus 3 non-test readers (D6); guard extended to `miroir-env`, `miroir-ai`, `@copilotkit/*` on resolved imports (D5); factual slips fixed (§4.1, §4.2); two facts handed to the bundle issue (G2).
