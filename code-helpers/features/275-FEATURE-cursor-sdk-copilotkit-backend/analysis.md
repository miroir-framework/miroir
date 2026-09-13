# 275 — Cursor SDK as optional CopilotKit agent backend

> How a person in Miroir uses Cursor agents without replacing CopilotKit, without
> putting `@cursor/sdk` in the Vite bundle, and without treating Cursor as a fifth
> GitHub-style token adapter. The persistence process runs a local Cursor agent
> that calls Miroir MCP. Form tools stay on CopilotKit under a `propose_` prefix.

Related issue: https://github.com/miroir-framework/miroir/issues/275
Related: [#273 process capabilities](https://github.com/miroir-framework/miroir/issues/273) ✅ · [#244 lazy CopilotKit](https://github.com/miroir-framework/miroir/issues/244) ✅ · [#253 MCP tool runner](https://github.com/miroir-framework/miroir/issues/253) ✅ · [#229 dynamic MCP tools](https://github.com/miroir-framework/miroir/issues/229) ✅ · [#270 named secrets](https://github.com/miroir-framework/miroir/issues/270) ✅ · [#193 LLM / Agent](https://github.com/miroir-framework/miroir/issues/193)
Related analyses: [`../273-FEATURE-process-capability-switches/analysis.md`](../273-FEATURE-process-capability-switches/analysis.md) · [`../253-FEATURE-generic-mcp-tool-runner/analysis.md`](../253-FEATURE-generic-mcp-tool-runner/analysis.md) · [`../270-FEATURE-persistent-named-secrets/analysis.md`](../270-FEATURE-persistent-named-secrets/analysis.md)
Key sources: [`processCapabilities.ts`](../../../packages/miroir-core/src/1_core/processCapabilities.ts) · [`processCapabilityRoutes.ts`](../../../packages/miroir-core/src/4_services/processCapabilityRoutes.ts) · [`SecretsService.ts`](../../../packages/miroir-core/src/4_services/SecretsService.ts) · [`getMiroirFundamentalJzodSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts) · [`copilotRuntimeFactory.ts`](../../../packages/miroir-ai/src/runtime/copilotRuntimeFactory.ts) · [`copilotKitRoute.ts`](../../../packages/miroir-ai/src/routes/copilotKitRoute.ts) · [`miroirCopilotKitActions.ts`](../../../packages/miroir-ai/src/tools/miroirCopilotKitActions.ts) · [`AgentsCopilotKit.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AgentsCopilotKit.tsx) · [`AiActionsProvider.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AiActionsProvider.tsx) · [`RootComponent.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/RootComponent.tsx) · [`runMcpToolRunner.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Runners/runMcpToolRunner.ts) · [`toolNameFor.ts`](../../../packages/miroir-mcp/src/tools/toolNameFor.ts) · [`server.ts`](../../../packages/miroir-server/src/server.ts) · [`ipcServerSetup.ts`](../../../packages/miroir-standalone-app-electron/src/ipcServerSetup.ts) · [`docs/reference/process-capabilities.md`](../../../docs/reference/process-capabilities.md)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with the user (2026-09-13 grilling). Not implemented.

**Document history:** first draft on `275-FEATURE-cursor-sdk-copilotkit-backend` after issue #275.

---

## Sequencing

| Step | Issue | Status |
|---|---|---|
| Lazy CopilotKit chunk | [#244](https://github.com/miroir-framework/miroir/issues/244) | ✅ |
| Process snapshot `ai` / `mcp` | [#273](https://github.com/miroir-framework/miroir/issues/273) | ✅ reused |
| Named secrets for AI keys | [#270](https://github.com/miroir-framework/miroir/issues/270) | ✅ reuse for `aiCursorKey` |
| Dynamic MCP tools + same-origin `/mcp` | [#229](https://github.com/miroir-framework/miroir/issues/229) / [#253](https://github.com/miroir-framework/miroir/issues/253) | ✅ Cursor calls this catalog |
| Cursor as CopilotKit agent backend | **#275 (this)** | **this** |
| LLM path lists MCP for token adapters; retire hand-written CopilotKit execute tools | [#193](https://github.com/miroir-framework/miroir/issues/193) | later |

---

## Decision record

Confirmed with the user (2026-09-13). ★ = accepted. Product choices are not reopened in the TDD plan.

| ID | Question | Choice |
|---|---|---|
| D1 | What job is Cursor? | **Same in-app assistant.** CopilotKit stays the sidebar and `/api/copilotkit`. Cursor is a backend, not a second AppBar product. |
| D2 | How is Cursor wired? | **`AbstractAgent` on `CopilotRuntime` wrapping `@cursor/sdk`.** Not a fifth `AiProviderType` / `OpenAIAdapter`. |
| D3 | Process opt-in | **`features.cursor`**, missing = false. Token default stays `AI_PROVIDER_TYPE`. `features.ai` stays the master off switch. |
| D4 | Who picks, where it lives | **Process allow-list + `sessionStorage`.** Not `ViewParams`. Fallback is `AI_PROVIDER_TYPE`. |
| D5 | Agent loop | **Local only.** `tools: ["mcp"]`. `local.cwd` is a dedicated empty directory. No cloud in this issue. |
| D6 | Which MCP URL | **Loopback API app** `http://127.0.0.1:<apiPort>/mcp` with the same Bearer hatch. `:4080` stays for an IDE on another machine. |
| D7 | Cursor key | **`CURSOR_API_KEY` → named secret `aiCursorKey`.** Same store as `aiGithubToken`. Never the browser. |
| D8 | Two catalogs | **MCP names execute. CopilotKit form tools use `propose_`.** Both visible on a Cursor run. `propose_*` are CopilotKit frontend actions, not `local.customTools`. |
| D9 | MCP writes | **Execute on `tools/call`.** No intercept queue in this issue. |
| D10 | `ai` vs `mcp` | **No OR.** Cursor requires `mcp` true. Token-only chat may keep `mcp` false. |
| D11 | Hand-written CopilotKit execute list | **Keep until #193.** Do not add `generateMiroirReport` / `getMiroirContext` to MCP unless they become Endpoints. |
| D12 | Electron | **This issue.** Same local loop on main. Renderer still has no `features` and no `getProcessCapabilities()`. |
| D13 | Bundle | **Browser never imports `@cursor/sdk`.** Persistence process `import()` on first Cursor use. CopilotKit UI chunk still lazy (#244). |
| D14 | Snapshot | **Add `cursor: boolean` to `ProcessCapabilities`.** Hide the Cursor pick and refuse the backend when false. |

**Rationale:** GitHub works because GitHub Models is an OpenAI-shaped HTTP API plus a secret. Cursor is an agent with its own loop. A cloud Cursor VM cannot see `127.0.0.1`. Default local Cursor would edit `cwd`; we keep only the MCP tool group. Two names so “review in the sidebar” and “run the Endpoint” are not the same string.

### D1 — Same job

**Status:** Accepted — CopilotKit shell.

| Option | Verdict |
|---|---|
| D1-a. Swap CopilotKit for a Cursor panel | Rejected — unloads the UI we already lazy-load; `@cursor/sdk` is not a React sidebar |
| **D1-b. Same sidebar, Cursor is a backend** ★ | Accepted |
| D1-c. Two AppBar products | Rejected for this issue |

### D2 — Slot

**Status:** Accepted — `AbstractAgent`, not `AiProviderType`.

| Option | Verdict |
|---|---|
| D2-a. Fifth `AiProviderType` through `CopilotServiceAdapter.process` | Rejected — fights both APIs |
| **D2-b. Register an AG-UI agent on `CopilotRuntime`** ★ | Accepted. No first-party `@ag-ui/cursor`; we write the wrapper |
| D2-c. Separate panel that never hits CopilotRuntime | Rejected |

`buildCopilotRuntime` today only constructs a service adapter (`copilotRuntimeFactory.ts:18`, `:72-110`) and `new CopilotRuntime({ actions })` (`:112-116`). The route always takes that adapter path when `resolveConfig` returns a token config (`copilotKitRoute.ts:232-259`). Cursor needs a second branch that does not call `getApiKey("cursor")` as if it were GitHub.

### D3 — `features.cursor`

**Status:** Accepted.

| Option | Verdict |
|---|---|
| D3-a. `features.aiBackends: ["github","cursor"]` | Rejected — pretends token adapters and the SDK are the same slot |
| **D3-b. Boolean `features.cursor` plus env token default** ★ | Accepted |
| D3-c. Replace `features.ai` with an array | Rejected — reopens #273 |

Missing `features.cursor` is false, same fail-closed rule as `ai` / `mcp` (`processCapabilities.ts:87-88`).

### D4 — Pick storage

**Status:** Accepted — `sessionStorage`.

| Option | Verdict |
|---|---|
| **D4-a. `sessionStorage`** ★ | Accepted. Same class as `showAiSidebar` |
| D4-b. `ViewParams` | Rejected — #273 deleted `agents` from that object |
| D4-c. User row | Later |

### D5 — Local loop, MCP-only built-ins

**Status:** Accepted.

A Cursor cloud agent cannot call MCP on this laptop. Cursor cloud MCP is a URL the VM can reach, or stdio inside that VM ([Cursor SDK TypeScript](https://cursor.com/docs/sdk/typescript)). Our `/mcp` is loopback.

`@cursor/sdk` requires Node 22.13+ and ships native binaries. It is a Node package. `Agent.create` local still needs `local.cwd` even if file tools are off. The SDK allowlist `tools: ["mcp"]` is local-only (`tools: []` is text with no tools). Default local toolset includes `read` / `edit` / `shell` against `cwd`. We do not want that.

`cwd` is a dedicated empty directory the persistence process creates. Not `filesystemDeploymentRootDirectory`, not `process.cwd()`, not Electron `userData` roots that hold deployments.

### D6 — Loopback `/mcp`

**Status:** Accepted — API app mount from #253, not `:4080`, not stdio.

### D7 — Secret

**Status:** Accepted — fifth row on `AI_SECRET_IMPORT_ALIASES` (`SecretsService.ts:51-56`). Today four aliases. Comment on `:61-63` says "the four D6 AI key env aliases"; that sentence must be updated.

### D8 — Two catalogs and `propose_`

**Status:** Accepted.

Enumerated 2026-09-13 from `AiActionsProvider.tsx` and `miroirCopilotKitActions.ts`:

| Catalog | Names | What they do today |
|---|---|---|
| CopilotKit frontend `useCopilotAction` | `generateMiroirEntity`, `getMiroirContext`, `lookupApplicationByName`, `lookupDeploymentByApplicationUuid`, `lookupEntityByName`, `findInstanceByName`, `lendDocument`, `getCurrentDate`, `getCurrentTimestamp` | Only `generateMiroirEntity` uses `renderAndWaitForResponse` (`AiActionsProvider.tsx:201-305`). `lendDocument` POSTs `/lendDocument` in a `handler` (`:522-562`). Lookups and dates are handlers. |
| CopilotKit runtime `createMiroirCopilotKitActions` | live: `lendDocument`, `generateMiroirReport`, `getMiroirContext`. Commented: `generateMiroirEntity`, `generateMiroirQuery`, `generateMiroirTransformer` (`miroirCopilotKitActions.ts:550-561`) | Server-side handlers. Lending is hardcoded to Library endpoint `212f2784-5b68-43b2-8ee0-89b1c6fdd0de` (`:45`). |
| MCP `#229` | `<Application>_<actionType>`, e.g. `Library_lendDocument`, `Miroir_getInstances` (`toolNameFor.ts:27-35`) | `tools/call` executes. |

The strings `lendDocument` and `Library_lendDocument` already differ. `propose_` is for the model and the person, not because MCP collides today.

**This issue:**

- Rename form tools: `generateMiroirEntity` → `propose_generateMiroirEntity`.
- Add `propose_lendDocument` as a `renderAndWaitForResponse` form that, on accept, uses the existing POST. Remove the fire-and-forget CopilotKit `lendDocument` name so execute goes through MCP `Library_lendDocument`.
- Leave lookups and date helpers named as they are.
- Runtime `createMiroirCopilotKitActions` keeps `generateMiroirReport` / `getMiroirContext` / the lend *executor* used by the form POST. #193 deletes the execute-list later.

`propose_*` stay CopilotKit frontend actions. Cursor `local.customTools` skip interactive approval in the SDK. Do not put review tools there.

On a Cursor run the model sees MCP tools plus the CopilotKit `propose_*` / lookup / date actions the runtime still advertises.

### D9 — MCP writes run

**Status:** Accepted. No parked-write queue. Review is the `propose_*` door, not an MCP interceptor.

### D10 — Flags

**Status:** Accepted. `getProcessCapabilities` does not set `mcp` from `ai`. Picking Cursor when `mcp` is false is `FeatureUnavailable` with `errorContext.capability` `mcp` or `cursor` (name in the TDD plan, one name only).

### D11 — #193 still owns retiring execute tools

**Status:** Accepted.

### D12 — Electron now

**Status:** Accepted. Electron `40.6.1` embeds Node 24.x, which meets `@cursor/sdk` ≥ 22.13. Main already listens on loopback when `ai` or `mcp` is true (`ipcServerSetup.ts:189`, `:223-259`, `shouldListenLoopbackHttp` in `processCapabilityRoutes.ts:11-13`). Dummy `cwd` lives next to that process, not in the renderer.

`createCopilotKitRouter` is a **static** import on both `server.ts:10` and `ipcServerSetup.ts:42`. The Node process already loads `miroir-ai` / `@copilotkit/runtime` at startup. This issue does not have to un-static CopilotKit on the server. It must not add a static `import "@cursor/sdk"` next to that.

### D13 — Lazy SDK

**Status:** Accepted. `miroir-ai` `package.json` has no `@cursor/sdk` today. Add it there. Server release marks `miroir-ai` external (`miroir-server/package.json` `build:server` `-e miroir-ai`), so native binaries load from `node_modules` at runtime, not through ncc. `miroir-ai` tsup `--target=node20` (`package.json:14`) is a compile target; the SDK still needs a Node 22.13+ **runtime** on `miroir-server`.

### D14 — Snapshot field

**Status:** Accepted. `ProcessCapabilities` today is `ai`, `mcp`, store fields, `designerTools` (`processCapabilities.ts:9-16`). Add `cursor`. Schema `features.cursor` optional boolean on both `miroirConfigClient` and `miroirConfigServer` (`getMiroirFundamentalJzodSchema.ts:1883-1890`, `:1930-1937`). `devBuild` after the schema edit.

Truth table:

| `features.ai` | env sandbox | `features.cursor` | `features.mcp` | Snapshot `ai` | Snapshot `cursor` | Cursor backend allowed |
|---|---|---|---|---|---|---|
| false / absent | no | any | any | false | false if cursor absent | no |
| true | yes | true | true | false | true if flag set | no, `ai` veto |
| true | no | false / absent | true | true | false | no |
| true | no | true | false | true | true | no, need `mcp` |
| true | no | true | true | true | true | yes |

---

## 1. Goals

1. **Pick Cursor in the assistant** — In order to use Cursor’s agent from the sidebar I already know, as a person using Miroir, I can choose Cursor when the process allows it.
2. **Token backends unchanged** — In order to keep GitHub / Anthropic / OpenAI / Google working, as an operator, I can leave `AI_PROVIDER_TYPE` as the default and not install Cursor.
3. **No extra browser download** — In order to keep the #244 / #273 split, as a person who never opens Cursor, I do not download `@cursor/sdk`.
4. **MCP is the execute catalog** — In order to change Library or Miroir data through Endpoints, as a person using Cursor in Miroir, I can have the agent call `Library_lendDocument` / `Miroir_getInstances` and have those writes run.
5. **Review door** — In order to see a form when I am unsure, as a person using the assistant, I can have the model call `propose_*` instead of the MCP write.
6. **Desktop** — In order to get the same assistant on the desktop app, as a person using Electron, I can pick Cursor on main’s loopback the same way as on `miroir-server`.

## 2. Non-goals

- Retire `miroirCopilotKitActions` execute tools, or teach token adapters to `tools/list` MCP (#193).
- Cloud / no-repo Cursor agents, tunnels, public MCP.
- Codex, Claude Code, or other coding-agent SDKs.
- `features.ai` implying `features.mcp`.
- Backend pick on `ViewParams` or on the User row.
- Making MCP writes wait for a sidebar form.
- Un-static `import "miroir-ai"` on the server (nice, not this issue).

---

## 3. Current state

### 3.1 Process snapshot (aligned with #273, missing `cursor`)

`getProcessCapabilities` (`processCapabilities.ts:78-93`) reads `features.ai` / `mcp` / `designerTools` only. No `cursor`. UI learns the snapshot via `GET /capabilities` before login. Docs: [`docs/reference/process-capabilities.md`](../../../docs/reference/process-capabilities.md).

Shipped server JSON already has `features.ai` and `features.mcp` true (`packages/miroir-server/config/miroirConfig.server.json`). Electron main hardcodes `{ ai: true, mcp: true, designerTools: true }` (`ipcServerSetup.ts:189`). Neither sets `cursor`.

### 3.2 CopilotKit UI (aligned)

`RootComponent.tsx:624-638` mounts the lazy CopilotKit shell when snapshot `ai` is true and an AppBar control is open, then latches. `AgentsCopilotKit.tsx:33-40` sets `runtimeUrl` via `copilotRuntimeUrl` (Electron → `http://127.0.0.1:3080/api/copilotkit`, web → `/api/copilotkit`). Sandbox define still nulls the component (`:23-28`).

### 3.3 Token runtime (aligned for GitHub, misaligned for Cursor)

`AiProviderType = "openai" | "anthropic" | "google" | "github"` (`copilotRuntimeFactory.ts:18`). Keys from `resolveSecret` via `AI_SECRET_IMPORT_ALIASES` (`:30-39`). GitHub uses Azure Models `https://models.inference.ai.azure.com` (`:97-105`). `resolveConfig` reads body `aiConfig` then `AI_PROVIDER_TYPE` (`copilotKitRoute.ts:28-41`). The sidebar does not send `aiConfig` today (no `aiConfig` in `packages/miroir-standalone-app` source). Comment on `:23` claiming `useCopilotReadable` is stale.

`/health` 503 text lists the four env keys, not Cursor (`copilotKitRoute.ts:208-211`).

### 3.4 Server always loads CopilotKit runtime (misaligned with “never load unused stack”, accepted for CopilotKit)

`server.ts:10` and `ipcServerSetup.ts:42` statically import `createCopilotKitRouter`. Route mount is gated (`shouldMountCopilotKitRoute`, `server.ts` around `:850-868`; Electron `:241-245`). The unused-stack rule in this issue applies to `@cursor/sdk`, not to un-static-ing CopilotKit.

### 3.5 MCP (aligned as the execute catalog)

`shouldMountMcpHttp` gates both the API-app `/mcp` mount and `:4080` (`processCapabilityRoutes.ts:7-8`; `server.ts` ~846 and ~953). `runMcpToolRunner` refuses when snapshot `mcp` is false (`runMcpToolRunner.ts:25-34`). Cursor’s in-process agent must call the same `/mcp` with a Bearer the hatch accepts. It must not use `window.fetch` and must not go through the Vite origin in Electron (`browserMcpServerUrl` already special-cases electron, `processCapabilityRoutes.ts:46-49`).

### 3.6 No Cursor SDK (aligned absence)

Repo grep: no `@cursor/sdk`, no `aiCursorKey`, no `features.cursor`. `AiProviderType` is CopilotKit adapters only.

### 3.7 Electron loopback (aligned transport, missing SDK)

`shouldListenLoopbackHttp` is `ai || mcp` (`processCapabilityRoutes.ts:11-13`). Cursor-only with `ai` true already listens. Dummy `cwd` and lazy SDK are new.

### 3.8 Docs (misaligned)

`docs/reference/process-capabilities.md` treats `ai` as “CopilotKit route, AppBar, lazy chunk”. After this issue it must say CopilotKit is the shell and `features.cursor` is the optional SDK backend. `docs/guides/mcp-integration.md` is still a stub plus the #273 pointer.

---

## 4. Key reuse

| Piece | Location |
|---|---|
| Process snapshot + fail-closed flags | `processCapabilities.ts` |
| Loopback URL helpers | `processCapabilityRoutes.ts` `ELECTRON_LOOPBACK_ROOT_API_URL`, `copilotRuntimeUrl`, `browserMcpServerUrl` |
| AI secret import table | `AI_SECRET_IMPORT_ALIASES` in `SecretsService.ts:51-56` |
| CopilotKit Express router | `createCopilotKitRouter` |
| Runtime actions + lend POST | `createMiroirCopilotKitActions`, `createLendDocumentExecutor` |
| Entity proposal form | `AiEntityProposalForm` / `AiActionsProvider.tsx:294-303` |
| MCP names | `toolNameFor` |
| MCP HTTP client | `callMcpToolViaHttp` in `miroir-mcp/client` |
| Electron loopback express | `ipcServerSetup.ts:223-259` |
| Capability refuse shape | `Action2Error` `FeatureUnavailable` + `errorContext.capability` |
| Lending endpoint uuid | `212f2784-5b68-43b2-8ee0-89b1c6fdd0de` |

---

## 5. Implementation homes (not a slice list)

| Symbol / job | Package / layer |
|---|---|
| `features.cursor` Jzod | `getMiroirFundamentalJzodSchema.ts` then `devBuild` |
| `ProcessCapabilities.cursor`, `getProcessCapabilities` | `processCapabilities.ts` |
| `aiCursorKey` alias | `SecretsService.ts` |
| Cursor `AbstractAgent` + lazy `import("@cursor/sdk")` + dummy cwd | `miroir-ai` (new module). `createCopilotKitRouter` branches when the pick is Cursor |
| `sessionStorage` key + picker | standalone-app AI routes / AppBar, read snapshot `cursor` |
| `propose_` rename + `propose_lendDocument` form | `AiActionsProvider.tsx` + tests next to `AiProposalForms.unit.test.tsx` |
| Electron dummy cwd + same lazy path | `ipcServerSetup.ts` calls into `miroir-ai`, no renderer import |

The AG-UI wrapper turns Cursor `run.stream()` events into the event types `CopilotRuntime` already consumes. CopilotKit’s rule: pass an `AbstractAgent`, not the raw `Agent` handle.

In-process Cursor → MCP uses a server-side `fetch` to loopback `/mcp` with a Bearer the hatch issued for that process, not the renderer `runMcpToolRunner`.

---

## 6. Risks the plan must pin

- **CopilotRuntime 1.59 `agents` map.** Current constructor only passes `actions`. Confirm the 1.59.2 API for registering an `AbstractAgent` before coding the wrapper. If 1.59 cannot host a custom agent, that is a blocker, not a silent adapter hack.
- **`miroir-server` Node version.** SDK needs 22.13+ at runtime. Electron 40 is fine. Document the server runtime.
- **Auth on loopback MCP.** The in-process agent is not the browser. Hatch / service Bearer must be explicit or MCP calls 401.
- **`tools: ["mcp"]` plus CopilotKit actions.** The model’s CopilotKit tool list is the runtime `actions` plus frontend `useCopilotAction`. The SDK allowlist only strips Cursor *built-in* tools. Both catalogs still have to be advertised on the CopilotKit side.
- **ncc + native SDK.** Keep `@cursor/sdk` behind `miroir-ai` (already external). Do not add a static import in `server.ts`.

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) after this analysis is reviewed.
