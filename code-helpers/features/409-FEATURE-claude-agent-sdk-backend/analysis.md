# 409 — Claude Agent SDK backend, and one agent backend picked before start

> How a Miroir process runs either the Cursor agent, a Claude agent, or no agent, chosen in the environment config before start.
> Each agent SDK is loaded into memory only when its backend is picked, and a process with `none` loads neither.

Related issue: https://github.com/miroir-framework/miroir/issues/409
Prerequisites: [#275 Cursor SDK backend](https://github.com/miroir-framework/miroir/issues/275) ✅ · [#273 process capabilities](https://github.com/miroir-framework/miroir/issues/273) ✅ · [#370 lazy miroir-ai in Electron](https://github.com/miroir-framework/miroir/issues/370) ✅ · [#345 runtimes on environments](https://github.com/miroir-framework/miroir/issues/345) ✅
Follow-up: [#410 lazy token provider SDKs](https://github.com/miroir-framework/miroir/issues/410)
Related analyses: [`../275-FEATURE-cursor-sdk-copilotkit-backend/analysis.md`](../275-FEATURE-cursor-sdk-copilotkit-backend/analysis.md)
Key sources: [`processCapabilities.ts`](../../../packages/miroir-core/src/1_core/processCapabilities.ts) · [`getMiroirFundamentalMlSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts) · [`cursorAgent.ts`](../../../packages/miroir-ai/src/runtime/cursorAgent.ts) · [`assertCursorSdkPackaged.ts`](../../../packages/miroir-ai/src/runtime/assertCursorSdkPackaged.ts) · [`copilotKitRoute.ts`](../../../packages/miroir-ai/src/routes/copilotKitRoute.ts) · [`server.ts`](../../../packages/miroir-server/src/server.ts) · [`ipcServerSetup.ts`](../../../packages/miroir-standalone-app-electron/src/ipcServerSetup.ts) · [`miroirAiBackend.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/miroirAiBackend.ts) · [`AgentsCopilotKit.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AgentsCopilotKit.tsx) · [`AppBar.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx) · [`Dockerfile`](../../../Dockerfile) · [`docs/reference/process-capabilities.md`](../../../docs/reference/process-capabilities.md)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with A in two grilling rounds (2026-10-02, every recommendation accepted). Goals drafted from A's request, to confirm with the decisions.

---

## 1. Goals

- **G1 — Pick the agent before start.** In order to run the agent I want, or none, as an application maintainer, I can set `cursor`, `claude` or `none` in the environment config and restart.
- **G2 — Claude as an agent.** In order to use Claude to build and edit Miroir elements as a designer, I can chat with a Claude agent that uses the Miroir MCP tools, the same way I use the Cursor agent today.
- **G3 — Only the picked SDK in memory.** In order to keep a process light as an application maintainer, I know that a process loads only the SDK of the backend I picked, and no agent SDK with `none`.
- **G4 — Small release artifacts.** In order to keep images and installers small as a release maintainer, I can build a Docker image that carries only the agent SDK it needs, and a packaged desktop app that carries none.
- **G5 — One place for agent glue.** In order to add or change an agent backend in one place as a framework developer, I find the code shared by every agent backend (prompt building, CopilotKit tool fences, AG-UI events, MCP URL, scratch working directory) in one module.

## 2. Non-goals

- Loading the token provider SDKs (OpenAI, Anthropic, Google) only for the configured provider: #410.
- Built-in Claude Code tools (Bash, Read, Write, Edit, WebFetch) for the Claude agent. It only gets Miroir MCP tools (D10). Opening more tools would be its own issue.
- In-process MCP tools (`createSdkMcpServer`), because of the two zod copies (§4.6).
- Shipping either agent SDK in the packaged desktop app (D11).
- Choosing the backend per browser session between two configured agents. One process has at most one agent backend (D2).
- The zod 4 migration of Miroir itself: #375.

## 3. Decision record

Settled in two grilling rounds (questions Q1 to Q12, all recommendations accepted).

| # | Decision | Choice | Serves |
|---|---|---|---|
| D1 | Which Claude SDK | **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`), a third backend next to token AI and Cursor | G2 |
| D2 | Config shape | **One enum `features.agentBackend: "cursor" \| "claude" \| "none"`**, replacing `features.cursor`, which stays readable for one release as an alias with a `miroir-env check` warning | G1 |
| D3 | What `none` covers | **Agent SDKs only.** `features.ai` keeps governing CopilotKit and the token chat | G1, G3 |
| D4 | `miroir-ai` in the server | **Dynamic `import("miroir-ai")`, only when `ai` is on**, as Electron does | G3 |
| D5 | Where the code lives | **Both backends in `miroir-ai`**, shared code in `runtime/agentBridge.ts`, thin `cursorAgent.ts` and `claudeAgent.ts` with one dynamic SDK import each | G3, G5 |
| D6 | Disk cost of artifacts | **Regular dependencies of `miroir-ai`. Docker build argument `AGENT_BACKEND` (default `none`) deletes the SDK not picked after the prune.** Electron ships neither. A start check fails clearly when the picked SDK is missing | G4 |
| D7 | Claude credentials | **Reuse `aiAnthropicKey`** (`AI_ANTHROPIC_KEY`), passed to the subprocess through the SDK's `env` option | G2 |
| D8 | Browser toggle and request format | **Capabilities expose `agentBackend`. The toggle shows when it is not `none` and names the backend. Session storage and requests carry a generic `"agent"`**; the server accepts `"cursor"` as an alias for one release | G1, G2 |
| D9 | Claude model | **Default `claude-opus-5-5`, optional override `features.agentModel`** | G2 |
| D10 | Claude agent tools | **Miroir MCP tools only** (`allowedTools: ["mcp__miroir__*"]`, built-in tools off), scratch working directory | G2 |
| D11 | Packaged Electron | **Ships neither SDK.** `agentBackend: "claude"` (or `"cursor"`) fails at start with a clear message | G4 |
| D12 | Proving an SDK was not loaded | **Child-process integration test with a module hook recording resolved specifiers**, plus injected-importer unit tests | G3 |

**Rationale:** the pick is a process property, set before start, so the server can keep every unused SDK out of memory. The browser only chooses between token chat and "the agent". Lazy loading needs nothing more than one dynamic `import()` per SDK, so splitting packages only pays off for release artifacts, which D6 handles in the Docker build.

### D2 — Config shape

**Status:** Accepted — D2-a. **Serves:** G1.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. One enum** ★ | `features.agentBackend`, `features.cursor: true` read as `"cursor"` when `agentBackend` is absent | One backend per process, matches "choose before running" | Every `capabilities.cursor` reader changes (§4.1) |
| D2-b. One boolean per backend | `features.cursor`, `features.claude`, browser picks | No migration | Both SDKs can be on at once, which G3 forbids in practice; the browser keeps backend-specific values |

**Decision:** D2-a. When both `agentBackend` and `cursor` are set and disagree, `agentBackend` wins and `miroir-env check` reports it.

### D5 — Where the code lives

**Status:** Accepted — D5-a. **Serves:** G3, G5.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. Both in `miroir-ai`** ★ | `agentBridge.ts` + thin `cursorAgent.ts` / `claudeAgent.ts` | Shared glue in one module; no new package to build | `miroir-ai` lists both SDKs as dependencies |
| D5-b. One package per backend | `miroir-agent-cursor`, `miroir-agent-claude` | Release artifacts could install one | npm workspaces install everything at the root anyway; two more packages in the build order |

**Decision:** D5-a. D5-b can come back if an artifact other than Docker needs to install a subset.

### D6 — Disk cost of release artifacts

**Status:** Accepted — D6-a. **Serves:** G4.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D6-a. Docker build argument** ★ | `ARG AGENT_BACKEND=none`; after `npm prune --omit=dev`, delete `@cursor/sdk*` and/or `@anthropic-ai/claude-agent-sdk*` not picked | Image size follows the pick | The image must be rebuilt to switch backends |
| D6-b. Ship both in Docker | Nothing to do | No rebuild to switch | About 290 MB more per image |
| D6-c. `optionalDependencies` | — | — | Rejected: only `--omit=optional` skips them, and it also drops the esbuild and Rollup platform binaries |

---

## 4. Current state

### 4.1 The `cursor` switch (to replace)

`features.cursor` is declared three times in [`getMiroirFundamentalMlSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts): `miroirConfigClient` (line 1924), `miroirConfigServer` (line 1980) and the environment definition (line 2123). The generated types live in `preprocessor-generated/` (tracked in git, regenerated by `npm run devBuild -w miroir-core`).

[`processCapabilities.ts`](../../../packages/miroir-core/src/1_core/processCapabilities.ts):

```typescript
// getProcessCapabilities, lines 88-96
ai: features?.ai === true && environment !== "sandbox",
mcp: features?.mcp === true,
cursor: features?.cursor === true,
// lines 100-102
export function isCursorBackendAllowed(snapshot: ProcessCapabilities): boolean {
  return snapshot.ai === true && snapshot.cursor === true && snapshot.mcp === true;
}
```

`ProcessCapabilityName` includes `"cursor"`, which the 403 refusal reports as `errorContext.capability`. `FAIL_CLOSED_PROCESS_CAPABILITIES` sets `cursor: false` ([`ProcessCapabilitiesHttp.ts:11`](../../../packages/miroir-core/src/4_services/ProcessCapabilitiesHttp.ts)).

Readers of `capabilities.cursor` or the `"cursor"` pick outside tests:

| Reader | Location |
|---|---|
| Route pick and refusal | `copilotKitRoute.ts:61-101`, `:328-352` |
| Packaged Electron check | `ipcServerSetup.ts:115-117` |
| AppBar toggle | `AppBar.tsx:351-380` |
| Session pick | `miroirAiBackend.ts` (`MiroirAiBackendPick = "cursor"`) |
| Request property | `AgentsCopilotKit.tsx:56-63` (`aiConfig: { backend: "cursor" }`) |

Tests that read `cursor` in capabilities or the pick (11 files): `miroir-core` 275 phases 0, 1, 8 and 273 phase 1, 2; `miroir-ai` 275 phases 2, 4; `miroir-standalone-app` 275 phases 6, 7 and 273 phases 2, 3.

No environment file under `environments/` sets `cursor` (`desktop.json`, `dev.json`, `docker.json` set `ai` and `mcp` only; `cloud-agent.json` sets `ai: false`).

### 4.2 Cursor agent (aligned on loading, to split)

[`cursorAgent.ts`](../../../packages/miroir-ai/src/runtime/cursorAgent.ts) (485 lines) loads the SDK only through `defaultImportSdk = () => import("@cursor/sdk")` (line 51), cached per importer in a `WeakMap`. `createCursorAbstractAgent` (lines 456-485) checks the Node floor, resolves the MCP URL and the `aiCursorKey` secret, creates the scratch directory `.miroir-cursor-cwd`, then calls `Agent.create({ apiKey, model: { id: "auto" }, tools: ["mcp"], local: { cwd }, mcpServers: { miroir: { type: "http", url } } })`.

Cursor-independent parts of the file: the prompt built from the AG-UI input (frontend context, CopilotKit tools, conversation), `splitCopilotKitToolFences`, `stringifyToolArgs`, the observable wrapper `observableFromAsync`, AG-UI event emission in `CursorSdkAbstractAgent.run`, MCP URL resolution and the scratch directory. Cursor-specific parts: the SDK types, `Agent.create`, the stream/wait protocol, and parts of the event mapping (`copilotKitToolCallsFromSdkEvent`, `assistantTextFromSdkEvent`), whose `assistant` / `tool_use` blocks have the same shape as Claude Agent SDK messages.

### 4.3 Route

[`copilotKitRoute.ts`](../../../packages/miroir-ai/src/routes/copilotKitRoute.ts) imports `cursorAgent.js` statically (lines 30-33), which is safe because that module has no static SDK import. A request whose pick is `"cursor"` is refused with 403 unless `isCursorBackendAllowed`, then builds a `CopilotRuntime` with `agents: { default: agent, cursor: agent }` and the actions minus `generateMiroirReport` and `getMiroirContext`.

### 4.4 Process wiring (misaligned with G3)

- [`server.ts:10`](../../../packages/miroir-server/src/server.ts) imports `createCopilotKitRouter` from `miroir-ai` statically. With `ai` off the server still loads CopilotKit and the token SDKs. The route is mounted at lines 932-951 when `shouldMountCopilotKitRoute(capabilities.ai)`.
- [`ipcServerSetup.ts:114-150`](../../../packages/miroir-standalone-app-electron/src/ipcServerSetup.ts) already imports `miroir-ai` dynamically, for the packaged check (`capabilities.cursor`) and for the route (`ai`).
- The server release (`npm run build:server -w miroir-server`) leaves `miroir-ai` external (`-e miroir-ai`, `package.json:22`). The Electron main bundle lists `@cursor/sdk` in `EXTERNALS` (`scripts/bundle-main.mjs:40`), checked by `electronBundle.unit.test.ts:84`.

### 4.5 Release artifacts

- [`Dockerfile`](../../../Dockerfile): builder `node:22-alpine` (line 23), `npm ci` (line 36), `npm prune --omit=dev` (line 89), final stage `node:22-alpine` (line 95). Every runtime dependency of `miroir-ai` ships, `@cursor/sdk` and its natives included (about 43 MB).
- Packaged Electron leaves `@cursor/sdk` out and calls `assertCursorSdkPackaged` when `cursor` is on.

### 4.6 Claude Agent SDK facts (checked 2026-10-02, version 0.3.288)

- Entry `query({ prompt, options })` returns an async iterable of `SDKMessage`. Relevant options (`sdk.d.ts`): `mcpServers: Record<string, McpServerConfig>` with `{ type: "http", url, headers? }`, `allowedTools`, `disallowedTools`, `tools` (built-in tool list; an empty list disables them), `cwd`, `model`, `permissionMode`, `settingSources` (`[]` ignores filesystem settings and CLAUDE.md), `strictMcpConfig`, `includePartialMessages`, `abortController`, `env`.
- `env` **replaces** the subprocess environment instead of merging with `process.env`. The backend passes `PATH`, `HOME` and `ANTHROPIC_API_KEY` explicitly.
- Size: main package 5.4 MB, plus one platform package of about 245 MB (`@anthropic-ai/claude-agent-sdk-linux-x64`, `-linux-x64-musl` for Alpine, and others) through its own `optionalDependencies`.
- Peer dependencies: `zod ^4.0.0`, `@anthropic-ai/sdk >=0.93.0`, `@modelcontextprotocol/sdk ^1.29.0`.
- Install check: `npm install @anthropic-ai/claude-agent-sdk@0.3.288 -w miroir-ai --save-exact --package-lock-only` resolves with no conflict. zod 4.6.5 is nested at `packages/miroir-ai/node_modules/zod`; the root stays on 3.25.76. `@ag-ui/core` gets its own zod 3 copy, `@anthropic-ai/sdk` moves to the nested zod 4 (it accepts both). `scripts/check_dependency_policy.py` passes. Two zod copies are safe as long as no zod schema crosses between them, which holds while the agent reaches Miroir only through MCP over HTTP.

## 5. Key reuse

| Piece | Location |
|---|---|
| Dynamic SDK import + per-importer cache | `cursorAgent.ts:51-63` |
| Prompt building, tool fences, AG-UI events, scratch cwd, MCP URL | `cursorAgent.ts` (to move to `agentBridge.ts`) |
| Packaged-SDK start check | `assertCursorSdkPackaged.ts` (to generalize per backend) |
| Capability refusal (403 `FeatureUnavailable`) | `assertProcessCapability`, `processCapabilities.ts` |
| Named secret `aiAnthropicKey` | `SecretsService.ts:79` |
| Lazy `miroir-ai` pattern | `ipcServerSetup.ts:114-150` |
| `miroir-env check` warnings | `packages/miroir-env/src/cli.ts:81-132` |
| Bundle externals test | `miroir-standalone-app/tests/0_build/electronBundle.unit.test.ts` |

## 6. Target design summary

- **Config:** `features.agentBackend` (enum, optional, default `"none"`) and `features.agentModel` (string, optional) in the three `features` objects. `features.cursor` stays in the schema for one release.
- **Capabilities:** `ProcessCapabilities.cursor` becomes `agentBackend: "cursor" | "claude" | "none"`. The capability name `"cursor"` becomes `"agent"`, and `isCursorBackendAllowed` becomes `isAgentBackendAllowed` (`ai`, `mcp`, and `agentBackend !== "none"`).
- **`miroir-ai`:** `agentBridge.ts` holds the shared AG-UI agent; `cursorAgent.ts` and `claudeAgent.ts` each provide a session factory with one dynamic SDK import. `createAgentForBackend(backend)` picks the factory, so the route never names an SDK. `assertAgentSdkPackaged(backend)` replaces `assertCursorSdkPackaged`.
- **Route:** a request whose pick is `"agent"` (or the alias `"cursor"`) goes to the configured backend, under the existing refusal rules.
- **Server:** `import("miroir-ai")` only when `ai` is on.
- **Browser:** `MiroirAiBackendPick = "agent"`; the AppBar toggle shows when `agentBackend !== "none"` and names the backend.
- **Docker:** `ARG AGENT_BACKEND=none` removes the SDKs not picked after the prune.
- **Proof (G3):** a child Node process with a `module.register` resolve hook records every specifier, builds the AI wiring for each backend with the SDK resolved to a stub, and the test checks which SDK specifiers appear.

Implementation slices: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).
