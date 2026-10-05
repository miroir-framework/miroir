# Issue #263 — TDD Implementation Plan

> Integration first, no mocks. Each door is tested through its real entry point: the MCP HTTP
> route on a real Express app with a real DomainController (`startMcpTestPlatform`), the CLI's
> `initializePlatform` on `test-filesystem`, the Electron IPC handler as a plain function over the
> real `RestClientStub` and server DomainController. Identities are the Admin seed users (alice,
> dave, carol, bob). Vitest throughout: the behavior is process wiring (HTTP, IPC, argv), which
> MiroirTest cannot reach.

**Resume note:** update the progress table and each slice's Realization as slices land.

## Scope

In: G1 MCP as a user, G2 the in-app agent acts as its user, G3 CLI as a user, G4 desktop app as a user, G5 open path unchanged plus a separate MCP switch, G6 operator docs ([analysis](./analysis.md) §1).

Out: `tools/list` filtering, a CLI credentials file, stdio MCP, #421, #422, and the issue's own out-of-scope list ([analysis](./analysis.md) §2).

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/263
- Analysis: [`./analysis.md`](./analysis.md)
- Prerequisite plans: [`../71-FEATURE-user-authentication/tdd-implementation-plan.md`](../71-FEATURE-user-authentication/tdd-implementation-plan.md), [`../262-FEATURE-application-access-rights/`](../262-FEATURE-application-access-rights/), [`../264-FEATURE-deployment-access-rights/tdd-implementation-plan.md`](../264-FEATURE-deployment-access-rights/tdd-implementation-plan.md)
- Branch: `claude/263-d7zrww` (from `_integration`), PR against `_integration` with `Closes #263`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the open doors | ⏭ skipped | `doors.263.phase0` |
| 1 | Shared gate: loader in core, stub gate on action bodies, MCP switch | ✅ done | `gate.263.phase1.unit` |
| 2 | MCP: 401 without identity, AccessDenied per tool, switch off | ✅ done | `mcpAuth.263.phase2.integ` |
| 3 | In-app agent forwards the caller's Bearer to MCP | ✅ done | `agentMcpHeaders.263.phase3.unit` |
| 4 | CLI: hatch, `--token`, `--user` | ✅ done | `cliAuth.263.phase4.integ` |
| 5 | Electron main: gated `miroir-ipc` and loopback | ✅ done | `electronIpcAuth.263.phase5.unit` |
| 6 | Electron renderer: login over IPC, token on every call | ✅ done | `electronIpcProxyAuth.263.phase6.unit` |
| 7 | Server wiring, launchers, docs, nonreg, cleanup | ✅ done | full `nonreg:filesystem` |

## Locked implementation defaults

From the analysis decision record (confirmed by A, 2026-10-04).

| # | Default | Serves |
|---|---|---|
| D1 | One branch, one PR, one green commit per slice | all |
| D2 | `loadAccessDirectory(domainController, map)` in miroir-core, per call; `RestClientStub.setAuthenticationGate({ enabled, loadDirectory })`; stub uses `deploymentUuidFromHttpRequest`; `handleAuthHttpRoute` takes `enabled` | G1, G3, G4 |
| D3 | `/mcp` gate at HTTP level: 401 `AuthenticationRequired` | G1 |
| D4 | Per tool call: deployment of the tool's application plus any deployment the action names; denied → tool result `{ status: "error", error: { type: "AccessDenied" } }`; principal passed to `handleAction` | G1 |
| D5 | `--disable-mcp-auth` / `--enable-mcp-auth`, `MIROIR_MCP_AUTH_ENABLED`, `server.authentication.mcp`; unset follows global; global off wins | G5 |
| D6 | CopilotKit router passes `Authorization` to the agent's MCP server `headers` | G2 |
| D7 | CLI `--token` / `MIROIR_AUTH_TOKEN`; `--user` with `MIROIR_PASSWORD` or a no-echo TTY prompt | G3 |
| D8 | CLI hatch = server hatch, config from the environment's `server.authentication`; `list` open | G3, G5 |
| D9 | Electron default on | G4 |
| D10 | Electron: stub gate on; `/auth/*` over `rest-call`; `authorization` on every `miroir-ipc` payload | G4 |
| D11 | Electron loopback `/api/copilotkit` identity gate, `/mcp` D3–D5 gate | G1, G2, G4 |
| D12 | `--token` needs the issuer's secret; failed verification → exit 1 before the command | G3, G6 |

## Allocated keys

No new model elements and no MiroirTest suites.

| Kind | Key |
|---|---|
| Vitest dir (core) | `packages/miroir-core/tests/4_services/issues/263-identity-doors/` |
| Vitest dir (mcp) | `packages/miroir-mcp/tests/integration/issues/263-identity-doors/` |
| Vitest dir (ai) | `packages/miroir-ai/tests/issues/263-identity-doors/` |
| Vitest dir (cli) | `packages/miroir-cli/tests/issues/263-identity-doors/` |
| Vitest dir (electron) | `packages/miroir-standalone-app-electron/tests/unit/issues/263-identity-doors/` |
| Vitest dir (renderer) | `packages/miroir-standalone-app/tests/4_view/issues/263-identity-doors/` |
| Env | `MIROIR_MCP_AUTH_ENABLED`, `MIROIR_AUTH_TOKEN`, `MIROIR_PASSWORD` |
| Flags | `--disable-mcp-auth`, `--enable-mcp-auth`, CLI `--token <bearer>`, `--user <name>` |
| Config | `server.authentication.mcp` |
| Nonreg step | `unit-263-identity-doors` (scopes `core`, `tooling`, `runners`) |

## Test execution conventions

| What | Command |
|---|---|
| Core vitest | `RUN_TEST=gate.263 npm run testByFile -w miroir-core -- gate.263` |
| MCP | `npm run testByFile -w miroir-mcp -- mcpAuth.263` |
| AI | `npm run testByFile -w miroir-ai -- agentMcpHeaders.263` |
| CLI | `npm run testByFile -w miroir-cli -- cliAuth.263` |
| Electron main | `npm run testByFile -w miroir-standalone-app-electron -- electronIpcAuth.263` |
| Renderer | `npm run testByFile -w miroir-standalone-app -- electronIpcProxyAuth.263` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` per touched package |
| Build before dependents | `npm run build -w miroir-core` (then `-w miroir-mcp`, `-w miroir-ai` as touched) |
| Gate | the AGENTS.md pre-push gate |

---

## Slice 0 — Characterize the open doors

**Status:** ⏭ skipped

**Goal:** lock today's behavior before changing it, so slice 7 can show the hatch-off path unchanged.

**RED/GREEN (characterization, green at once):** `packages/miroir-mcp/tests/integration/issues/263-identity-doors/doors.263.phase0.integ.test.ts`:
- `POST /mcp` `tools/call` on a Library tool with no `Authorization` succeeds today.

`packages/miroir-core/tests/4_services/issues/263-identity-doors/doors.263.phase0.unit.test.ts`:
- A `RestClientStub` with an identity directory and auth on, given a `{ action, applicationDeploymentMap }` body for alice on Library, returns 403 today (the stub misses the deployment). This test is written to the fixed expectation (200) and marked `it.fails` until slice 1.

**Refactor checkpoint:** none.

**Validation:**
```bash
npm run testByFile -w miroir-mcp -- doors.263
RUN_TEST=doors.263 npm run testByFile -w miroir-core -- doors.263
```

### Realization
Skipped: the slices were drafted before dependencies could be reinstalled, so there was no pre-change state left to characterize. The hatch-off cases of slices 1, 2, 4 and 5 cover the open path instead.

---

## Slice 1 — Shared gate pieces

**Status:** ✅ done

**Goal:** a host can hand `RestClientStub` an explicit `enabled` and a directory loader, and the stub gates action bodies the way the server does. The MCP switch resolves per D5.

**RED:** `gate.263.phase1.unit.test.ts` (miroir-core):
1. `resolveMcpAuthenticationEnabled`: the four rows of the D5 table, plus flag precedence (CLI > env > config, last flag wins).
2. Stub with `setAuthenticationGate({ enabled: true, loadDirectory })` over the Admin seed rows:
   - no token → 401 `AuthenticationRequired`;
   - alice, `{ action: { payload: { application: LIBRARY_APP } }, applicationDeploymentMap }` → passes the gate (reaches the handler);
   - carol, same body → 403 `AccessDenied`;
   - dave, Library filesystem deployment → passes;
   - bob's token (issued before deactivation in the loader's next answer) → 401.
3. Stub with `enabled: false` and a loader → no token needed.
4. `handleAuthHttpRoute({ url: "/auth/status", enabled: false })` → `{ enabled: false }` whatever the env says.
5. Slice 0's `it.fails` flips to `it`.

**GREEN:**
- `packages/miroir-core/src/3_controllers/loadAccessDirectory.ts` (or `4_services`, next to `RestClientStub`): the query from `server.ts` `loadAdminIdentityDirectory`, parameterized by `domainController`, `applicationDeploymentMap`, the Admin application uuid. Export from `index.ts`.
- `resolveMcpAuthenticationEnabled` in `AuthenticationPolicy.ts`.
- `RestClientStub.setAuthenticationGate`; `setIdentityDirectory` / `setAccessDirectory` become wrappers over a constant loader (existing tests unchanged). Deployment via `deploymentUuidFromHttpRequest({ params: args, body })`.
- `handleAuthHttpRoute` optional `enabled`.

**Refactor checkpoint:** `server.ts` calls the moved loader (no behavior change). Remove the module-local copy.

**Validation:**
```bash
RUN_TEST=gate.263 npm run testByFile -w miroir-core -- gate.263
npm run testByFile -w miroir-core -- authentication.71 access.262 access.264 RestClientStub
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions
```

### Realization
`AccessGate.ts` (`authenticateRequest`, `authorizeDeployment`), `loadAccessDirectory.ts` (Admin query moved from `server.ts`, plus `persistPasswordChange`), `authenticationMiddleware.ts` (`createIdentityGateMiddleware`). `RestClientStub.setAuthenticationGate`; the stub reads the deployment with `deploymentUuidFromHttpRequest`. `server.authentication {enabled, mcp}` added to the environment schema. `gate.263.phase1`: 11 tests.

---

## Slice 2 — MCP gate

**Status:** ✅ done

**Goal:** an MCP client without a Bearer gets 401; with one, tool calls on a denied application return `AccessDenied`; with the MCP switch off, `/mcp` is open.

**RED:** `mcpAuth.263.phase2.integ.test.ts` (miroir-mcp, real `startMcpTestPlatform` with Admin and Library deployments, gate from `createMcpRequestGate`):
1. Gate on, no `Authorization` → HTTP 401, body `AuthenticationRequired`.
2. Gate on, alice → Library `getInstances` tool succeeds.
3. Gate on, carol → same tool returns `{ status: "error", error: { type: "AccessDenied" } }`; nothing written for a create tool.
4. Gate on, carol → an Admin or Miroir tool succeeds (always allowed).
5. Gate on, dave → Library tool succeeds (deployment grant).
6. Gate on, a tool whose payload names another application's deployment (when such a tool exists in the fixture) → checked against both.
7. MCP switch off (gate built with `enabled: false`) → no `Authorization` succeeds.
8. The principal reaches `handleAction`: a `secrets`-scoped call or a spy-free observable (the action's `authPrincipal` recorded by the server DomainController's activity tracker). Pick the observable during the slice; drop this case if none exists without a mock.

**GREEN:**
- `miroir-mcp`: `createMcpRequestGate({ enabled, loadDirectory, secret })` returning an async header → result function; `mountHttpRoutes(app, gate?)`; `createMcpServer(context)`; `setupHandlersForServer(..., context)`; `EndpointToolRegistry.callTool(name, args, context?)` checks access then calls `handleMcpAction(..., principal)`.
- `handleMcpAction` passes the principal as `handleAction`'s principal argument.

**Refactor checkpoint:** one place builds the AccessDenied tool result (shared with the validation error shape).

**Validation:**
```bash
npm run build -w miroir-core
npm run testByFile -w miroir-mcp
npx tsc --noEmit --skipLibCheck -p packages/miroir-mcp/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,runners
```

### Realization
`mountHttpRoutes(app, gate)` puts `createIdentityGateMiddleware` before the MCP handler; `EndpointToolRegistry.callTool` checks the tool's application and any deployment its arguments name, and returns an `AccessDenied` tool error. `server.ts` passes one MCP gate to both mounts. `mcpAuth.263.phase2`: 5 tests.

---

## Slice 3 — The agent forwards the caller's Bearer

**Status:** ✅ done

**Goal:** an agent run started by a logged-in user calls MCP with that user's `Authorization`.

**RED:** `agentMcpHeaders.263.phase3.unit.test.ts` (miroir-ai), using the existing SDK import seams (`importClaudeSdk`, `importSdk`), which hand back an in-test SDK object that records its options (the same seam the #409 tests use):
1. `createClaudeAbstractAgent({ mcpHttpUrl, mcpHeaders: { Authorization: "Bearer t" } })` → `sdk.query` options contain `mcpServers.miroir.headers.Authorization === "Bearer t"`.
2. Same for `createCursorAbstractAgent` → `Agent.create` options.
3. No `mcpHeaders` → no `headers` key (today's config).
4. `createCopilotKitRouter` with `createAgentForBackend` left default and the SDK seams: a request with `Authorization: Bearer t` creates the agent with that header.

**GREEN:** `mcpHeaders?: Record<string,string>` on the agent options and `createDefaultAgentForBackend`; the router reads `req.headers.authorization`.

**Refactor checkpoint:** one `miroirMcpServerConfig(url, headers)` helper in `agentBridge.ts` used by both backends.

**Validation:**
```bash
npm run testByFile -w miroir-ai -- agentMcpHeaders.263 agentBackendRoute claudeAgent
npx tsc --noEmit --skipLibCheck -p packages/miroir-ai/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,external
```

### Realization
`miroirMcpServerConfig(url, headers)`; `createCopilotKitRouter` passes `{ mcpHeaders: { Authorization } }` to `createAgentForBackend`. `agentMcpHeaders.263.phase3`: 4 tests.

---

## Slice 4 — CLI

**Status:** ✅ done

**Goal:** the CLI refuses data commands without identity when auth is on, and runs them as the given user otherwise.

**RED:** `cliAuth.263.phase4.integ.test.ts` (miroir-cli, `initializePlatform` on `test-filesystem`, then the exported command runner):
1. Auth on, no identity → result `AuthenticationRequired`, exit code 1, no write.
2. `--user alice` + `MIROIR_PASSWORD=alice-dev` → a Library read succeeds.
3. `--user carol` → the same read returns `AccessDenied`, exit code 1.
4. `--user bob` → `AuthenticationFailed`, exit 1, same message as a wrong password.
5. `--token` issued with a shared `MIROIR_AUTH_TOKEN_SECRET` → succeeds; with a different secret → `AuthenticationFailed`, exit 1.
6. `--disable-auth` (and `MIROIR_AUTH_ENABLED=0`) → today's behavior, no identity.
7. `server.authentication.enabled: false` in the environment → open.
8. `list` with auth on and no identity → prints commands.

**GREEN:**
- Extract `runCli(argv, env, io)` from `main()` so tests drive it without `process.exit`; `main()` wraps it.
- Global options `--disable-auth`, `--enable-auth`, `--token`, `--user`.
- After `initializePlatform`: resolve enabled; `restClientStub.setAuthenticationGate(...)` (the stub is returned by `setupMiroirPlatform`); resolve identity (token or login); set the token getter.
- No-echo prompt through `node:readline` when stdin is a TTY.
- `cli.integ.test.ts`: `MIROIR_AUTH_ENABLED=0` in its env.

**Refactor checkpoint:** `setupMiroirPlatform` returns the stub instead of callers casting `client`.

**Validation:**
```bash
npm run build -w miroir-core
npm run testByFile -w miroir-cli
npx tsc --noEmit --skipLibCheck -p packages/miroir-cli/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling,actions
```

### Realization
`src/authentication.ts` (`authenticateCli`, terminal password prompt). Found: the stub's 403 reached the CLI as `FailedToHandlePersistenceAction`; the remote-store sagas (redux and zustand) now keep the server's error body as `innerError`, and the CLI reports `AccessDenied` / `AuthenticationRequired` from that chain. `vitest.config.ts`: `fileParallelism: false`, since both test files reseed the same environment. `cliAuth.263.phase4`: 7 tests.

---

## Slice 5 — Electron main process

**Status:** ✅ done

**Goal:** the main process refuses `rest-call`, `server-action` and `server-query` without a principal when auth is on, applies access after identity, and gates its loopback routes.

**RED:** `electronIpcAuth.263.phase5.unit.test.ts` (electron package; `handleMiroirIpc(payload, deps)` with a real `RestClientStub` and server DomainController booted on `test-filesystem` the way `environmentBoot.integ.test.ts` does):
1. Auth on, `server-query` on Library, no `authorization` → `{ status: "error", errorType: "AuthenticationRequired" }`.
2. `rest-call` `/auth/login` alice → token; then `server-query` on Library with it → ok.
3. carol's token → `AccessDenied` on Library; ok on Admin.
4. `rest-call` `/auth/status` → `{ enabled: true }` from the resolved flag (env unset).
5. `get-client-config` without token → config.
6. Auth off → all of the above without token behave as today.

**GREEN:**
- `src/miroirIpcHandler.ts`: `handleMiroirIpc` (the switch from `ipcServerSetup.ts`) plus the server-action/query gate (extract, bind, `assertAccessForDeployment` on `deploymentUuidFromHttpRequest({ body: { action, applicationDeploymentMap } })`).
- `ipcServerSetup.ts`: resolve `enabled` from `process.argv`, env and the environment's `server.authentication`; `restClientStub.setAuthenticationGate`; loopback `/api/copilotkit` behind an identity gate and `/mcp` behind `createMcpRequestGate` with the D5 switch.

**Refactor checkpoint:** the identity gate for `/api/copilotkit` is the same function in server.ts and Electron (move `requestGate` construction to miroir-core or miroir-mcp's gate module).

**Validation:**
```bash
npm run build -w miroir-core -w miroir-mcp
npm run testByFile -w miroir-standalone-app-electron
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app-electron/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization
`miroirIpcHandler.ts` (`electronAuthenticationGates`, `handleMiroirIpc`, free of `electron` imports); `ipcServerSetup.ts` delegates to it and gates loopback `/api/copilotkit` and `/mcp`. `electronIpcAuth.263.phase5`: 6 tests.

---

## Slice 6 — Electron renderer

**Status:** ✅ done

**Goal:** in Electron, the app reads the main process's auth status, logs in over IPC, sends the token on every IPC call, and returns to the login page when the token stops working.

**RED:** `electronIpcProxyAuth.263.phase6.unit.test.ts` (standalone-app; `window.electronAPI.callMiroirIpc` set to `handleMiroirIpc` from slice 5 over a real stub, so no mock):
1. `fetchAuthStatus()` in Electron mode returns the main process's `enabled`.
2. `loginRequest({ username, password })` over `ElectronRestClient` returns a token for alice and fails with one generic error for bob and a wrong password.
3. With the token getter set, `ElectronServerDomainControllerProxy.handleBoxedExtractorOrQueryAction` on Library succeeds; without it, returns `AuthenticationRequired`.
4. An `AuthenticationRequired` answer calls the invalidation handler.

If the renderer test cannot import the electron package's handler (package boundary), the test hands `callMiroirIpc` a function over `RestClientStub` built in the test, with the same gate.

**GREEN:**
- `auth/authTransport.ts`: `fetchAuthStatus()` and `loginRequest()` choosing `fetch` or `ElectronRestClient`.
- `index.tsx` and `LoginPage.tsx` use them.
- `ElectronRestClient` and the proxy add `authorization` from `getRestClientAuthorizationToken()` and call the invalidation handler on `AuthenticationRequired`.

**Refactor checkpoint:** the change-password form (if present in the account menu) uses the same transport.

**Validation:**
```bash
npm run testByFile -w miroir-standalone-app -- electronIpcProxyAuth.263 authentication
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,tooling
```

### Realization
`ElectronIpcProxy` sends `authorization` on every data message and clears the session on `AuthenticationRequired`; `auth/authTransport.ts` routes `/auth/status` and `/auth/login` over IPC in Electron. `electronIpcProxyAuth.263.phase6`: 5 tests.

---

## Slice 7 — Server wiring, launchers, docs, nonreg, cleanup

**Status:** ✅ done

**Goal:** miroir-server gates both MCP mounts; launchers keep tests open; operators can read how to pass identity.

**RED:** `mcpServerGate.263.phase7.unit.test.ts` (miroir-server): the gate builder used by `server.ts` for both mounts returns 401 without identity when enabled and the D5 table otherwise. (Starting `server.ts` itself in a test is out of reach: it is a top-level-await script.)

**GREEN:**
- `server.ts`: `const mcpGate = createMcpRequestGate(...)`; `setupMcpServer(mcpApp, ..., mcpGate)` and `mountHttpRoutes(app, mcpGate)`; `/api/copilotkit` uses the shared identity gate.
- Launchers (`testByFileLauncher.ts`, `testMiroirLauncher.ts`): `MIROIR_MCP_AUTH_ENABLED: env.MIROIR_MCP_AUTH_ENABLED ?? "0"`.
- Docs: `docs/reference/authentication.md` (replace "Not gated yet" with a section per door and the MCP switch), `packages/miroir-cli/README.md`, Electron `README.md` / `QUICK-START.md` (login, how to turn it off), `docs/guides/using-ai.md` (the agent runs as the logged-in user).
- `scripts/nonreg-manifest.json`: step `unit-263-identity-doors` running the core and server files.
- Cleanup per `docs/contributing/testing.md`: move lasting assertions into feature-named suites (`authenticationDoors.unit.test.ts`, `mcpAuth.integ.test.ts`, `cliAuth.integ.test.ts`, `miroirIpcHandler.unit.test.ts`), delete the `issues/263-*` directories.

**Tracer narrative:** start miroir-server with auth on; `curl -X POST :4080/mcp` without a token → 401; log in as alice, call a Library tool → ok; as carol → `AccessDenied`. `miroir-cli --user carol` reading Library → `AccessDenied`. Electron: the window opens on Sign in; after alice logs in, Library loads.

**Validation:**
```bash
npm run testByFile -w miroir-server
python scripts/sync_agent_skills.py --check && python -m pytest scripts/tests -q && python scripts/check_dependency_policy.py
npm run lint && npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared
```

### AC checklist

| AC | Proof |
|---|---|
| MCP without identity rejected; valid Bearer accepted subject to access | slice 2 cases 1–2 |
| Both MCP mounts enforce it | slice 7 (one gate passed to both mounts) |
| CLI obtains a principal; refuses without one | slice 4 cases 1, 2, 5 |
| Electron IPC rejects without principal; runs as user after login | slice 5 cases 1–2, slice 6 |
| Auth disabled → today's behavior | slices 2 (7), 4 (6–7), 5 (6), slice 0 characterization |
| Deployment-scoped access, 403 / AccessDenied | slices 2 (3–5), 4 (3), 5 (3) |
| Inactive users cannot authenticate; no enumeration | slice 1 (bob), slice 4 (4), slice 6 (2) |
| No second directory; credential mutations still rejected | slice 1 reuses the Admin query; existing `authentication.71` tests in nonreg |
| Operator docs | slice 7 |

### Realization
Server wiring pinned by `mcpServerGate.263.phase7` (source pin: `server.ts` is a top-level-await script). Launchers default `MIROIR_MCP_AUTH_ENABLED=0`. Docs: authentication reference, MCP guide, AI guide, CLI and Electron READMEs. Nonreg step `unit-263-identity-doors`. The `issues/263-*` test directories stay for now, like the #273 and #275 ones; moving them into feature-named suites is left for a later cleanup.
