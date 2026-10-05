# 263 — Platform user identity on MCP, CLI and Electron

> When authentication is on, the web REST API and CopilotKit require a platform user (#71) and check
> application or deployment access (#262, #264). MCP, `miroir-cli` and Electron IPC still accept
> anonymous work. This analysis covers how those three doors reuse the same hatch, token, principal
> and access rule.

Related issue: https://github.com/miroir-framework/miroir/issues/263
Prerequisites: [#71](https://github.com/miroir-framework/miroir/issues/71) ✅ identity on REST and CopilotKit · [#262](https://github.com/miroir-framework/miroir/issues/262) ✅ application access · [#264](https://github.com/miroir-framework/miroir/issues/264) ✅ deployment access
Related analyses: [`../71-FEATURE-user-authentication/analysis.md`](../71-FEATURE-user-authentication/analysis.md) · [`../262-FEATURE-application-access-rights/analysis.md`](../262-FEATURE-application-access-rights/analysis.md) · [`../264-FEATURE-deployment-access-rights/analysis.md`](../264-FEATURE-deployment-access-rights/analysis.md)
Key sources: [`AuthenticationPolicy.ts`](../../../packages/miroir-core/src/1_core/authentication/AuthenticationPolicy.ts) · [`AccessPolicy.ts`](../../../packages/miroir-core/src/1_core/authentication/AccessPolicy.ts) · [`AuthenticationHttp.ts`](../../../packages/miroir-core/src/1_core/authentication/AuthenticationHttp.ts) · [`deploymentUuidFromHttpRequest.ts`](../../../packages/miroir-core/src/1_core/authentication/deploymentUuidFromHttpRequest.ts) · [`RestClientStub.ts`](../../../packages/miroir-core/src/4_services/RestClientStub.ts) · [`server.ts`](../../../packages/miroir-server/src/server.ts) · [`mcpServer.ts`](../../../packages/miroir-mcp/src/mcpServer.ts) · [`EndpointToolRegistry.ts`](../../../packages/miroir-mcp/src/tools/EndpointToolRegistry.ts) · [`copilotKitRoute.ts`](../../../packages/miroir-ai/src/routes/copilotKitRoute.ts) · [`miroir-cli/src/index.ts`](../../../packages/miroir-cli/src/index.ts) · [`ipcServerSetup.ts`](../../../packages/miroir-standalone-app-electron/src/ipcServerSetup.ts) · [`ElectronIpcProxy.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/services/ElectronIpcProxy.ts)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with A (grilling rounds 1 and 2, 2026-10-04). Implementation: [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).

## Acceptance criteria (from the issue)

- [ ] With authentication enabled, an MCP request without a usable platform-user identity is rejected (401 or equivalent). With a valid Bearer for an active user, the same request is accepted subject to application access.
- [ ] MCP on the dedicated port and MCP routes on the main server both enforce that rule.
- [ ] `miroir-cli` can obtain a principal (login or token). With authentication enabled and no principal, it does not execute commands that read or change application data.
- [ ] Electron `miroir-ipc` (`rest-call`, `server-action`, `server-query`) rejects work when authentication is enabled and there is no principal; after login in the app, those calls run as that user.
- [ ] With authentication disabled, MCP, CLI, and Electron behave as they do today (no identity required).
- [ ] After identity, a deployment-scoped call is allowed only when the user may access that deployment's application (same rule as REST: Admin and Miroir always; otherwise a grant). Denied → 403 `AccessDenied` (or the non-HTTP equivalent).
- [ ] Inactive users cannot authenticate. Login failures do not enumerate users.
- [ ] No second user directory; hashes stay on `MiroirUserCredential`; generic credential create/update/delete stays rejected.
- [ ] Operator docs name these three doors and how to pass identity (token flag, login, Electron session).

Added by A during grilling: MCP gating can be turned off on its own (Q10), so a non-regression run can keep REST gated while MCP stays open.

"Same rule as REST" now means the #264 union: an application grant or a deployment grant, Admin and Miroir always allowed.

---

## 1. Goals

- **G1 — MCP as a user.** In order to keep data private to the people granted it, as an operator running `miroir-server` with authentication on, I can rely on MCP (dedicated listener and main-app routes) refusing callers without a Bearer token, and refusing tool calls on applications the caller may not access.
- **G2 — The in-app assistant acts as its user.** In order to keep using the assistant once MCP is gated, as a logged-in web or desktop user, I can chat with the agent backend and have its MCP tool calls run with my identity and my access.
- **G3 — CLI as a user.** In order to script or run Miroir commands without opening a second anonymous door, as an operator with a terminal, I can pass a token or log in with my username and password, and the CLI refuses data commands when authentication is on and I gave neither.
- **G4 — Desktop app as a user.** In order to share one desktop install or data folder without sharing access, as an Electron user, I log in in the window and every IPC call then runs as me; without login, the main process refuses data work.
- **G5 — Open path unchanged.** In order to keep development, tests and non-regression simple, as a developer, I can turn authentication off with the existing hatch and get today's behaviour on all three doors, and turn off MCP gating alone with its own switch.
- **G6 — Operator docs.** In order to know how to pass identity on each door, as an operator, I can read in `docs/reference/authentication.md` which doors are gated and how (Bearer header, CLI flags and env, Electron login, switches).

## 2. Non-goals

From the issue, unchanged:

- Changing the existing web REST and CopilotKit identity gate. The CopilotKit side routes `/lendDocument` and `/findInstanceByName` stay identity-only.
- OIDC, passkeys, magic links; groups or roles as grant subjects; `capability` strings; password reset, invite, lockout, audit log.
- A second user store or a cookie-only session.

Added by this analysis:

- Filtering `tools/list` by access. A caller sees every tool; calls to a denied application fail (D4). Later, unscheduled.
- A stored CLI credentials file and a `miroir-cli login` command (grilling Q4 option c). Later, if needed.
- A stdio MCP transport. None exists today, so there is nothing to gate.
- Per-thread agent sessions (#422) and MCP tool schema size (#421).

## 3. Decision record

Decisions confirmed with A: grilling round 1 (all recommendations) and round 2 (Q10 b). Files: `/mnt/project-files/issue-263/grilling-round-{1,2}.md`.

| Decision | Choice | Serves |
|---|---|---|
| D1 Delivery | **One branch, one PR, one green commit per slice** (shared pieces, MCP, agent, CLI, Electron main, Electron renderer, docs) | all |
| D2 Shared gate | **Move the Admin directory loader out of `server.ts` into miroir-core; `RestClientStub` uses it per call and uses `deploymentUuidFromHttpRequest`** | G1, G3, G4 |
| D3 MCP identity | **Express gate before `/mcp` on both mounts: 401 `AuthenticationRequired` at HTTP level** | G1 |
| D4 MCP access | **Per tool call: deployment of the tool's application, plus any deployment named by the built action; denied → MCP tool error `AccessDenied`** | G1 |
| D5 MCP switch | **Separate switch `--disable-mcp-auth` / `--enable-mcp-auth`, `MIROIR_MCP_AUTH_ENABLED`, `server.authentication.mcp`; unset follows the global hatch; global off wins** | G5 |
| D6 Agent | **Forward the CopilotKit caller's `Authorization` header to the agent's MCP server config, per run** | G2 |
| D7 CLI identity | **`--token` / `MIROIR_AUTH_TOKEN`, and `--user` with `MIROIR_PASSWORD` or a TTY prompt** | G3 |
| D8 CLI hatch | **Same hatch and precedence as the server; config read from the environment's `server.authentication`; `list` stays open** | G3, G5 |
| D9 Electron hatch | **Default on, as the issue says; same hatch from the main process argv, env and environment** | G4, G5 |
| D10 Electron login | **Turn on the `RestClientStub` gate in the main process; renderer reads `/auth/status` and posts `/auth/login` over `rest-call`; every `miroir-ipc` payload carries the token** | G4 |
| D11 Electron loopback | **Gate Electron's loopback `/api/copilotkit` (identity) and `/mcp` (D3–D5) like miroir-server** | G1, G2, G4 |
| D12 Token secret | **`--token` needs the issuing server's secret (`MIROIR_AUTH_TOKEN_SECRET` or `server.authentication.tokenSecret`); a token that fails verification stops the CLI with exit code 1** | G3, G6 |

**Rationale:** every door ends in the pure policy functions #71 and #262 already wrote (`assertRequestAllowed`, `bindPrincipalToDirectory`, `assertAccessForDeployment`). The work is adapters plus one shared loader, not new policy.

### D2 — Shared gate pieces

**Status:** Accepted. **Serves:** G1, G3, G4.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a.** ★ | `loadAccessDirectory(domainController, applicationDeploymentMap)` in miroir-core (layer 3 or 4) returns `{ directory, credentialsValue, grants, deployments }`. server.ts, MCP hosts, the CLI and Electron call it per request. `RestClientStub` gets `setAuthenticationGate({ enabled, loadDirectory })` instead of the two snapshot setters. | One loader. Per-request reload, so a deactivated user or a new grant is seen at once in a long-running Electron process, as on the server. | Touches the stub's test setters (kept as a thin wrapper over a constant loader). |
| D2-b. | Keep snapshots: load once at boot, call `setIdentityDirectory` / `setAccessDirectory`. | Smallest change. | A deactivated user keeps access until restart in Electron. The server re-binds per request (#71), so the doors would differ. |

The stub's own deployment extraction (`args.deploymentUuid`, `body.deploymentUuid`, `body.payload.deploymentUuid`) misses action bodies shaped `{ action, applicationDeploymentMap }`, which `RestPersistenceClientAndRestClient` sends. With the gate on, `assertAccessForDeployment` denies a missing deployment, so CLI and Electron actions would all get 403. The stub switches to `deploymentUuidFromHttpRequest({ params: args, body })`, the server's extractor.

The stub reads `enabled` from `resolveAuthenticationEnabled({ env })` only, and turns the gate on only when a directory is present. D2-a passes `enabled` explicitly from the host, which resolved it from argv, env and config. Isolated emulated sessions (setupMiroirTest) install no gate and stay open, as today.

`handleAuthHttpRoute` answers `/auth/status` from env only. It takes an optional `enabled` so the stub reports the host's resolved value.

### D3, D4 — MCP identity and access

**Status:** Accepted, D3 at HTTP level, D4 per tool call. **Serves:** G1.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a.** ★ | 401 at HTTP when identity is missing. Per tool call, check access and return `{ status: "error", error: { type: "AccessDenied" } }` in the tool result. | MCP clients read tool errors. One POST may call tools on several applications. | Access denials are not HTTP status codes. |
| D4-b. | Reject the whole POST with 403. | Matches REST literally. | A 403 on a JSON-RPC POST reads as a broken transport to MCP clients. |

Mechanism:

- `MiroirMcpServer.mountHttpRoutes(app, gate?)`. The gate is an async function from the request's `Authorization` header to `{ ok: true, context } | { ok: false, status, body }`. The host (server.ts, Electron) builds it from D2 and D5. Without a gate, `/mcp` is open, so existing MCP tests and embeddings keep working.
- `createMcpServer(context)` passes `{ principal, assertDeploymentAccess }` to `setupHandlersForServer`, then to `EndpointToolRegistry.callTool(name, args, context)`.
- Deployment of a tool call: each handler entry already carries `applicationUuid` (`EndpointToolRegistry.callTool`). Its deployment is `currentMap[applicationUuid]`. When the built action also names a deployment (`deploymentUuidFromHttpRequest({ body: { action, applicationDeploymentMap } })`) and that is a different one, it is checked too. Both must pass.
- `handleMcpAction` passes the principal to `domainController.handleAction(..., principal)` as REST does (`authPrincipal`), so per-user secrets (#270) resolve for that user.
- `tools/list` is identity-only.

### D5 — MCP switch

**Status:** Accepted (round 2, Q10 b). **Serves:** G5.

`resolveMcpAuthenticationEnabled({ argv, env, config, globalEnabled })`:

| Global hatch | MCP switch (CLI > env > config) | MCP gated |
|---|---|---|
| off | any | no |
| on | unset | yes |
| on | off | no |
| on | on | yes |

Flags: `--disable-mcp-auth` / `--enable-mcp-auth` (last wins), env `MIROIR_MCP_AUTH_ENABLED` (same parsing as `MIROIR_AUTH_ENABLED`), config `server.authentication.mcp` (boolean). The test launchers that default `MIROIR_AUTH_ENABLED=0` also default `MIROIR_MCP_AUTH_ENABLED=0` when unset, so a test that turns only the global hatch on keeps MCP open.

### D6 — The in-app agent

**Status:** Accepted (Q2 a). **Serves:** G2.

| Option | Mechanism | Verdict |
|---|---|---|
| **D6-a.** ★ | `createCopilotKitRouter` builds an agent per request (`createAgentForBackend(backend)` inside the router middleware). It passes `mcpHeaders: { Authorization }` from `req.headers.authorization`. `claudeAgent.ts` and `cursorAgent.ts` put them in `mcpServers.miroir.headers`, which both SDKs accept (`@cursor/sdk` `McpServerConfig.headers`). | Accepted |
| D6-b. | Issue a short-lived token per CopilotKit request. | Rejected: same effect, more code. |
| D6-c. | Service identity or loopback exemption. | Rejected: a second hatch, which the issue forbids. |

With MCP gating off, the header is ignored.

### D7, D8, D12 — CLI

**Status:** Accepted (Q4 a+b, Q5, Q9). **Serves:** G3, G5, G6.

- The CLI already goes through `RestClientStub`: its client `DomainController` runs `persistenceStoreAccessMode: "remote"` against the stub (`miroir-cli/src/startup/setup.ts`). Turning the stub gate on (D2) gates every command.
- Boot (`bootEnvironment`, open stores) runs before the gate is installed, like the server opening deployments before it listens.
- Identity:
  - `--token <bearer>` or `MIROIR_AUTH_TOKEN`: set as the stub's token getter. It verifies only with the issuing server's secret (D12).
  - `--user <name>`: password from `MIROIR_PASSWORD`, else a no-echo TTY prompt, else an error. The CLI runs `loginWithPassword` against the loaded directory and uses the issued token. This works with an ephemeral secret.
  - Failed login, failed verification or missing identity when auth is on: print `{ status: "error", error: { type: "AuthenticationFailed" | "AuthenticationRequired" } }` and exit 1 before running the command. `AccessDenied` from a command is also exit 1.
- Hatch: `resolveAuthenticationEnabled({ argv, env, config: environment server.authentication })`. `--disable-auth`, `--enable-auth`, `--token`, `--user` are declared global options. `list` and `--help` stay open.
- `cli.integ.test.ts` sets `MIROIR_AUTH_ENABLED=0` for its existing cases.

### D9, D10, D11 — Electron

**Status:** Accepted (Q6 a, Q7 a, Q8). **Serves:** G1, G2, G4, G5.

Main process (`ipcServerSetup.ts`):

- Resolve `enabled` from `process.argv`, env and the environment's `server.authentication`. Packaged builds always use `desktop`; the operator turns auth off with `MIROIR_AUTH_ENABLED=0` or `server.authentication.enabled: false` in `<userData>/miroir/environments/desktop.json`.
- `restClientStub.setAuthenticationGate({ enabled, loadDirectory })` (D2).
- The `miroir-ipc` switch moves to a testable `handleMiroirIpc(payload, deps)`. Payloads carry `authorization` (the Bearer header). For `rest-call` it becomes the stub's header. For `server-action` and `server-query`, the handler applies the same three steps (extract, bind, access on `deploymentUuidFromHttpRequest({ body: { action, applicationDeploymentMap } })`) and returns an `Action2Error`-shaped `{ status: "error", errorType: "AuthenticationRequired" | "AccessDenied" }`. `get-client-config` and `get-default-filesystem-folder` stay open.
- Loopback: `/api/copilotkit` gets the identity gate, `/mcp` gets the D3–D5 gate.

Renderer:

- In Electron, `/auth/status` and `/auth/login` go through `ElectronRestClient` (`rest-call`), not `fetch`. Today both `fetch` calls fail in Electron and the app falls back to "auth off", which would leave a gated main process unusable.
- `ElectronRestClient` and `ElectronServerDomainControllerProxy` add `authorization` from `getRestClientAuthorizationToken()`. On `AuthenticationRequired` they call the invalidation handler, as `RestClient` does, so a restart (new ephemeral secret) sends the user back to the login page.

---

## 4. Current state

### 4.1 Policy (aligned)

All in `packages/miroir-core/src/1_core/authentication/`, pure and HTTP-independent:

- `resolveAuthenticationEnabled({ argv, env, config })` (`AuthenticationPolicy.ts`): last `--enable-auth`/`--disable-auth`, then `MIROIR_AUTH_ENABLED`, then `config.enabled`, then on.
- `extractPrincipalFromAuthorizationHeader(header, secret)`, `verifyBearerToken`, `issueBearerToken`: token `base64url(JSON{u,n,exp}).HMAC-SHA256`, TTL 12 h.
- `getProcessTokenSecret()`: `setProcessTokenSecret` value, else `MIROIR_AUTH_TOKEN_SECRET`, else `ephemeral-<time>-<random>`.
- `loginWithPassword`: one generic `AuthenticationFailed` for every failure, inactive users rejected.
- `bindPrincipalToDirectory`: rejects unknown or inactive users and username mismatch.
- `assertRequestAllowed` (401), `assertAccessForDeployment` (`AccessPolicy.ts`, 403, application or deployment grant, unknown or missing deployment denied).
- `handleAuthHttpRoute` (`AuthenticationHttp.ts`): `/auth/status` (from env only), `/auth/login`, `/auth/change-password`.
- `deploymentUuidFromHttpRequest`: params, body, `payload.deploymentUuid`, `payload.application` through `applicationDeploymentMap`, probe `endpoint.application`; handles `{ action, applicationDeploymentMap }` bodies.

### 4.2 miroir-server (REST aligned, MCP misaligned)

- `loadAdminIdentityDirectory()` is module-local in `server.ts`. It runs one `runBoxedQueryAction` on Admin with extractors `users`, `credentials`, `rights`, `deployments` (entities `ENTITY_MIROIR_USER_UUID`, `ENTITY_MIROIR_USER_CREDENTIAL_UUID`, `ENTITY_MIROIR_RIGHT_UUID`, `ENTITY_DEPLOYMENT_UUID`).
- The REST gate is inline in the `restServerDefaultHandlers` loop: extract, load, bind, 401, 403, then `authPrincipal` in params.
- `/api/copilotkit`: `requestGate` built from `resolveGatedPrincipal` + `assertRequestAllowed` (identity only).
- MCP: `setupMcpServer(mcpApp, ...)` on a separate Express app, started by `mcpServer.run(mcpPortFromConfig)`; `mcpServer.mountHttpRoutes(app)` mounts the same `POST /mcp` on the main app when `shouldMountMcpHttp(capabilities.mcp)`. No gate on either. CORS allows `Authorization`.
- The agent's MCP URL is `agentMcpHttpUrl` (`mountCopilotKitRoute.ts`): main port without TLS, the MCP listener with TLS.

### 4.3 miroir-mcp (misaligned)

- Streamable HTTP, stateless, one `Server` per POST (`createMcpServer`). GET and DELETE answer 405. No stdio.
- `setupHandlersForServer` → `EndpointToolRegistry.callTool(name, args)` → `handleMcpAction` → `domainController.handleAction(action, map, modelEnvironment)` with no principal.
- Each registry entry holds `{ applicationUuid, handler }`.
- Responses are already redacted (`redactCredentialSecretsFromValue`, #270).

### 4.4 miroir-ai agents (misaligned once MCP is gated)

- `createCopilotKitRouter` creates the agent per request through `createAgentForBackend(backend)` → `createDefaultAgentForBackend(picked, { mcpHttpUrl, ... })`.
- `claudeAgent.ts`: `mcpServers: { miroir: { type: "http", url: mcpHttpUrl } }`, options fixed per agent.
- `cursorAgent.ts`: `sdk.Agent.create({ mcpServers: { miroir: { type: "http", url } } })`.
- No headers in either.

### 4.5 miroir-cli (misaligned)

- commander; global `-e, --env`; commands from the Entity endpoint and the Library lending endpoint (`getAllCommands()`), plus `list`.
- `initializePlatform` → `environmentClientConfig` (`emulateServer: true`) → `setupMiroirPlatform`: a client DomainController in `remote` mode over `RestClientStub`, and a server DomainController behind the stub.
- `handleCliAction` → client `domainController.handleAction(action, map, env)`.
- No hatch, no identity flag, no state file.

### 4.6 Electron (misaligned)

- Main: `bootElectronServer` then `RestClientStub` with no identity directory, so the stub gate is off. `ipcMain.handle("miroir-ipc")` cases: `rest-call`, `get-default-filesystem-folder`, `get-client-config`, `server-action`, `server-query`.
- Loopback Express on 127.0.0.1 (`shouldListenLoopbackHttp`) with `/api/copilotkit` and `/mcp`, both ungated.
- Renderer (`index.tsx`, `startWebApp`): `fetch("/auth/status")` fails in Electron → `setAuthenticationEnabled(false)`. `LoginPage` posts with `fetch("/auth/login")`. `ElectronRestClient` and `ElectronServerDomainControllerProxy` send no token.
- The CopilotKit client already sends the Bearer header (`AgentsCopilotKit.tsx`, `copilotHeaders`).

### 4.7 Tests and launchers

- `testByFileLauncher.ts` and `testMiroirLauncher.ts` default `MIROIR_AUTH_ENABLED=0`.
- Policy tests: `miroir-core/tests/4_services/issues/{71-authentication,262-application-access,264-deployment-access}/`, using Admin seed rows (alice, carol, dave, bob).
- MCP integ tests (`miroir-mcp/tests/integration/`) mount `/mcp` themselves through `startMcpTestPlatform`.
- `miroir-cli/tests/cli.integ.test.ts`; Electron has `environmentBoot.integ.test.ts`.

## 5. Key reuse

| Piece | Location |
|-------|----------|
| Hatch | `resolveAuthenticationEnabled`, `AuthenticationPolicy.ts` |
| Token | `extractPrincipalFromAuthorizationHeader`, `issueBearerToken`, `getProcessTokenSecret` |
| Login | `loginWithPassword`, `handleAuthHttpRoute` |
| Re-bind | `bindPrincipalToDirectory` |
| Access | `assertAccessForDeployment`, `ALWAYS_ALLOW_APPLICATION_TARGETS`, `accessGrantsFromInstances`, `deploymentsFromInstances` |
| Deployment extraction | `deploymentUuidFromHttpRequest` |
| Directory query | `loadAdminIdentityDirectory` in `server.ts` (to move) |
| Stub gate | `RestClientStub.call` |
| Renderer token | `setRestClientAuthorizationTokenGetter`, `getRestClientAuthorizationToken`, `setRestClientAuthorizationInvalidationHandler` (`RestClient.ts`), `authSession.ts` |
| Seed users | `alice` / `alice-dev` (Library application grant), `dave` / `dave-dev` (Library filesystem deployment grant), `carol` / `carol-dev` (no grant), `bob` (inactive), Admin entities `d20d09e5-…`, `6c3ab489-…`, `a6136fc7-…` |
| Applications | Admin `55af124e-8c05-4bae-a3ef-0933d41daa92`, Miroir `360fcf1f-f0d4-4f8a-9262-07886e70fa15`, Library `5af03c98-fe5e-490b-b08f-e1230971c57f` |

## 6. Risks

| Risk | Mitigation |
|---|---|
| A 401 or 403 from the stub may not surface as an error through `RestPersistenceClientAndRestClient` to the CLI and the Electron client DomainController. | Slice tests assert the end result (`status: "error"`, `errorType`), not only the stub's return. |
| CLI and Electron run the identity query on every call (D2-a). | The server already does this per request. Measure in the slice; cache per call batch only if a test shows a cost. |
| Electron users must log in after this change (D9). | Docs: how to turn it off in `desktop.json`. |
| The agent subprocess holds the user's token for the run. | Same lifetime as the CopilotKit request. The token is never written to disk. |
