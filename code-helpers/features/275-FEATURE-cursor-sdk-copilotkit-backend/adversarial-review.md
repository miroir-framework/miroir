# 275 — Adversarial review of Cursor SDK CopilotKit backend analysis

> Attack of `analysis.md` (and issue #275) against the current Miroir codebase on branch `275-FEATURE-cursor-sdk-copilotkit-backend`. Design choices D1–D14 are not relitigated; feasibility, internal consistency, and factual claims are. Every citation below was walked against the working tree on 2026-09-13; CopilotKit action inventories were verified programmatically.

**Disposition (2026-09-13):** R1–R11 applied in `analysis.md` (POST `aiConfig.backend`; ungated `/mcp` no new Bearer; 1.59 `agents` branch omits adapter; `"cursor"` refuse name; filtered Cursor `actions`; `propose_*` protocol spike-first; Node 22.13 check; Electron native packaging work item; snapshot blast radius; citation nits). Product choices D1–D14 unchanged.

**Verdict (at review time).** The fact base for inventories, #273 reuse, static `miroir-ai` imports, and absence of `@cursor/sdk` is solid. CopilotKit **1.59.2 does expose an `agents` map** (`AbstractAgent` from `@ag-ui/client`), so D2-b is API-feasible, not blocked by missing registration hooks. The analysis is **not TDD-ready** as written because several transport and wiring steps are named but not specified: **sessionStorage backend pick never reaches the server**, **loopback MCP Bearer auth is asserted against an unauthenticated mount**, **`assertProcessCapability` has no `"cursor"` name**, and **Cursor `AbstractAgent` + `propose_*` frontend forms** lack a pinned CopilotKit protocol story distinct from today's token-adapter + `serviceAdapter` path.

**Citation audit (walked against tree):**

| Citation | Verdict |
|---|---|
| `processCapabilities.ts:9-16` | OK — `ai`, `mcp`, `availableStoreTypes`, **`creatableStoreTypes`**, `storeAdministration`, `designerTools` |
| `processCapabilities.ts:78-93` | OK ±1 — function ends `:94`; reads `ai`/`mcp`/`designerTools` only, no `cursor` |
| `processCapabilities.ts:87-88` (D3 fail-closed) | Imprecise — `:87-88` is `ai`/`mcp`; `designerTools` at `:89` defaults **true**, not fail-closed false |
| `processCapabilityRoutes.ts:7-8`, `:11-13` | OK |
| `processCapabilityRoutes.ts:46-49` | OK ±1 — `browserMcpServerUrl` is `:46-54` |
| `SecretsService.ts:51-56` | OK — four aliases, no `cursor` |
| `SecretsService.ts:61-63` | OK — comment still says "the four D6 AI key env aliases" |
| `getMiroirFundamentalJzodSchema.ts:1883-1890`, `:1930-1937` | OK — `features.ai`/`mcp`/`designerTools` only, no `cursor` |
| `copilotRuntimeFactory.ts:18` | OK — four provider types |
| `copilotRuntimeFactory.ts:72-110`, `:112-116` | OK |
| `copilotKitRoute.ts:28-41` | OK — `resolveConfig` reads `body.aiConfig` then env |
| `copilotKitRoute.ts:23` (stale `useCopilotReadable` / `aiConfig`) | OK finding — comment stale; `AiActionsProvider` uses `useCopilotReadable` for deployment UUID only (`:193-197`), not `aiConfig`; no `aiConfig` in standalone-app |
| `copilotKitRoute.ts:208-211` | OK — four env keys in 503 text |
| `copilotKitRoute.ts:232-259` | OK ±1 — handler block `:216-268` |
| `AiActionsProvider.tsx:201-305` | OK — only `generateMiroirEntity` uses `renderAndWaitForResponse` |
| `AiActionsProvider.tsx:522-562` | OK ±1 — `lendDocument` handler `:522-563` |
| `miroirCopilotKitActions.ts:45` | OK — lending uuid |
| `miroirCopilotKitActions.ts:550-561` | Drift — `:550-562` is `createMiroirCopilotKitActions` export; commented tool **definitions** live `:153-421`; return-array comments `:556-558` |
| `toolNameFor.ts:27-35` | OK — function starts `:27`, body through `:46` |
| `RootComponent.tsx:624-638` | OK |
| `AgentsCopilotKit.tsx:33-40` | OK ±1 — `runtimeUrl` `:34-37`; sandbox null `:23-28` |
| `runMcpToolRunner.ts:25-34` | OK — returns `FeatureUnavailable` with `capability: "mcp"` |
| `server.ts:10` | OK — static `createCopilotKitRouter` import |
| `server.ts` ~`:850-868` | OK ±1 — CopilotKit mount `:851-868` with auth gate `:852-867` |
| `server.ts` ~`:846`, ~`:953` | OK — `shouldMountMcpHttp` gates API `/mcp` and `:4080` listener |
| `ipcServerSetup.ts:42`, `:189`, `:223-259`, `:241-245` | OK ±1 — loopback block `:223-267`; features hardcoded `:189` |
| Lending uuid `212f2784-5b68-43b2-8ee0-89b1c6fdd0de` | OK — `packages/miroir-test-app_deployment-library/assets/library_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/212f2784-5b68-43b2-8ee0-89b1c6fdd0de.json` |

**CopilotKit action inventory (programmatic, 2026-09-13):**

| Source | Live names | Analysis match |
|---|---|---|
| `AiActionsProvider.tsx` `useCopilotAction` | `generateMiroirEntity`, `getMiroirContext`, `lookupApplicationByName`, `lookupDeploymentByApplicationUuid`, `lookupEntityByName`, `findInstanceByName`, `lendDocument`, `getCurrentDate`, `getCurrentTimestamp` | Exact |
| `miroirCopilotKitActions.ts` `createMiroirCopilotKitActions` | `lendDocument`, `generateMiroirReport`, `getMiroirContext` | Exact |
| Commented runtime tools | `generateMiroirEntity`, `generateMiroirQuery`, `generateMiroirTransformer` | Exact |
| MCP `toolNameFor` | `Library_lendDocument`, etc. (`endpointToolNaming.unit.test.ts:65-66`) | Consistent with analysis |

**Other factual checks:**

| Claim | Verdict |
|---|---|
| `@cursor/sdk` absent | OK — repo grep: no package, no imports |
| `miroir-server` ncc `-e miroir-ai` | OK — `packages/miroir-server/package.json` `build:server` line 22 |
| Electron `40.6.1` | OK — `miroir-standalone-app-electron/package.json` `:46`; embeds **Node 24.13.1** (Electron releases table), meets SDK ≥ 22.13 |
| Static `miroir-ai` imports | OK — only `server.ts:10` and `ipcServerSetup.ts:42` |
| `GET /capabilities` shape | OK — `{ status: "ok", capabilities: ProcessCapabilities }` (`server.ts:271-279`, `ProcessCapabilitiesHttp.ts:40-45`) |
| Renderer does not read `features` | OK — snapshot via `fetchProcessCapabilities`; `#273` test forbids `getProcessCapabilities` in renderer (`processCapabilitiesContext.273.phase2.unit.test.ts:103-117`) |
| `assertProcessCapability` no `"cursor"` | OK — union is `ai` \| `mcp` \| `storeAdministration` \| `availableStoreTypes` \| `designerTools` (`processCapabilities.ts:18-23`) |
| MCP `/mcp` Bearer hatch | **False today** — `mcpServer.mountHttpRoutes` (`mcpServer.ts:165-199`) has no auth; `/mcp` on `server.ts:846-847` is not behind `assertRequestAllowed` (unlike CopilotKit `:851-867`) |
| CopilotRuntime 1.59.2 `agents` / `AbstractAgent` | **Supported** — `@copilotkit/runtime@1.59.2`: `agents?: AgentsConfig` (`copilot-runtime.d.cts:101,199`), `AbstractAgent` from `@ag-ui/client` (`:14`); `CreateCopilotRuntimeServerOptions.serviceAdapter` is optional (`shared.d.cts:35-36`). Current code always passes `serviceAdapter` (`copilotKitRoute.ts:256-260`). |

---

## Recommendations

- [x] **R1** [blocker] — D4 stores the backend pick in `sessionStorage`, but nothing in the tree connects that value to `createCopilotKitRouter` per request. `resolveConfig` (`copilotKitRoute.ts:28-41`) reads `body.aiConfig` or `AI_PROVIDER_TYPE`; the sidebar sends neither (`AgentsCopilotKit.tsx:33-40`, no `aiConfig` / backend field in AI routes). §5 names "sessionStorage key + picker" only. → Specify transport: e.g. CopilotKit request body field (alongside or inside `aiConfig`), read in `copilotKitRoute` before `buildCopilotRuntime` vs Cursor branch; document fallback order (pick → `AI_PROVIDER_TYPE`); add integ test that session pick selects Cursor branch.

- [x] **R2** [blocker] — Loopback MCP Bearer auth is assumed but not implemented. Analysis §5, D6, and §6 "Auth on loopback MCP" say the in-process agent must call `/mcp` with "a Bearer the hatch accepts." `mcpServer.mountHttpRoutes` and Electron loopback mount (`ipcServerSetup.ts:248-259`) have **no** Authorization check; browser MCP client (`mcpHttpClient.ts:122-137`) sends no Bearer. CopilotKit on `miroir-server` is gated when auth is on (`server.ts:852-867`); `/mcp` is not. → Either (a) state loopback in-process MCP is intentionally unauthenticated on `127.0.0.1` and drop Bearer language, or (b) add the hatch + mint path (service token? reuse login token?) and gate both web and Electron loopback mounts consistently.

- [x] **R3** [major] — D2-b is API-feasible in 1.59.2, but the integration path is unspecified relative to today's `serviceAdapter`-only router. Types allow `new CopilotRuntime({ actions, agents: { … } })` with `copilotRuntimeNodeHttpEndpoint({ runtime, serviceAdapter? })`. Today every POST uses `buildCopilotRuntime(config, actions)` + adapter (`copilotKitRoute.ts:245-260`). → TDD plan must spell: Cursor branch builds runtime with `agents` map (wrapper implementing `AbstractAgent`), **omits** `serviceAdapter`, maps Cursor `run.stream()` to AG-UI events; token branch unchanged. Spike or slice 0 before renaming tools.

- [x] **R4** [major] — D10/D14 refuse paths need `"cursor"` on `ProcessCapabilityName` and a CopilotKit-side refuse, not only MCP. `assertProcessCapability` (`processCapabilities.ts:96-110`) has no `"cursor"`. `runMcpToolRunner` already refuses `mcp` (`:25-33`). Picking Cursor when `snapshot.cursor` or `snapshot.mcp` is false must return `FeatureUnavailable` on `/api/copilotkit`, mirroring store-admin pattern. → Extend union + `FAIL_CLOSED_PROCESS_CAPABILITIES` (`ProcessCapabilitiesHttp.ts:8-15`); add refuse in `createCopilotKitRouter` (or middleware) when pick is Cursor and snapshot disallows; one `errorContext.capability` name per D10.

- [x] **R5** [major] — D8 + D11 leave runtime execute tools visible on Cursor runs. Plan renames/removes frontend `lendDocument` and adds `propose_*`, but `createMiroirCopilotKitActions` still exports `generateMiroirReport`, `getMiroirContext`, and the lend executor (`:554-561`). D8 says the model still sees "runtime `actions` plus frontend `useCopilotAction`" on Cursor runs. Until #193, Cursor sees duplicate read paths (`getMiroirContext` vs lookups) and a server-side lend executor alongside MCP `Library_lendDocument`. → State whether Cursor branch passes a **filtered** `actions` array (e.g. lend executor + POST helper only, no `generateMiroirReport`/`getMiroirContext`) or accepts duplication until #193.

- [x] **R6** [major] — `propose_*` / `renderAndWaitForResponse` on Cursor runs is assumed, not pinned. Today token adapters rely on CopilotKit forwarding tool calls to the frontend (`copilotKitRoute.ts:54-55` comment). D2-b moves the agent loop into `@cursor/sdk` via `AbstractAgent`. D8 forbids `propose_*` in `local.customTools`. → Add an explicit protocol note or spike: when runtime uses `agents` + Cursor wrapper, do `useCopilotAction` tools (especially `renderAndWaitForResponse`) still receive calls and render in the sidebar? If not, D8 review door fails for Cursor backend.

- [x] **R7** [major] — `miroir-server` runtime Node version is an undeclared constraint. `miroir-ai` compiles with `--target=node20` (`miroir-ai/package.json:14`); `miroir-server` has no `engines` field; release binary runs on whatever Node the operator uses. Electron main is fine (Node 24.13.1). SDK needs **22.13+ at runtime** (analysis D5/D13). → Document minimum Node for server deploy; consider `engines` or startup check in `miroir-server` when Cursor path is enabled.

- [x] **R8** [major] — Electron packaging of native `@cursor/sdk` is unaddressed. ncc externalizes `miroir-ai` (`miroir-server/package.json` `build:server`); native binaries load from adjacent `node_modules`. Electron builder `files` is `dist/**/*` + `package.json` (`miroir-standalone-app-electron/package.json:55-57`); lazy `import("@cursor/sdk")` in main must still resolve native addons in packaged builds. → Add explicit work item: packaged Electron includes `miroir-ai` + `@cursor/sdk` native artifacts (or document dev-only Cursor on desktop until packaging is solved).

- [x] **R9** [minor] — D14 snapshot / `GET /capabilities` follow-ons. Adding `cursor: boolean` requires updating `ProcessCapabilities`, `getProcessCapabilities`, `FAIL_CLOSED_PROCESS_CAPABILITIES`, hardcoded Electron snapshot usage (`ipcServerSetup.ts:213-220`), test fixture snapshots (`processCapabilitiesHttp.273.phase2.integ.test.ts:16-23`), and `docs/reference/process-capabilities.md` synoptic table. Analysis mentions field but not blast radius.

- [x] **R10** [minor] — Citation and stale-doc nits:
  - `AgentsCopilotKit.tsx:6-8` header still says `ViewParams.agents`; runtime gate is `processCapabilities.ai` (`RootComponent.tsx:624`).
  - `miroirCopilotKitActions.ts:550-561` cited for commented tools; use `:153-421` for commented definitions.
  - D3 cites `processCapabilities.ts:87-88` for cursor fail-closed; pair with explicit `features?.cursor === true` line to avoid conflating with `designerTools` default-true at `:89`.
  - `features.cursor` on `miroirConfigClient` (analysis D14) is for emulateServer/test shapes only; persistence-side read rule from #273 still applies — say so beside schema edit.

- [x] **R11** [minor] — Health and picker UX gaps. `/api/copilotkit/health` (`copilotKitRoute.ts:201-213`) will still describe four token env keys after D7; extend message for `aiCursorKey` / `CURSOR_API_KEY`. No AppBar hook exists yet for backend picker (only `showAiSidebar` in sessionStorage, `MiroirContextReactProvider.tsx:399-401`); tie picker visibility to `snapshot.cursor` per D14.

---

## What the analysis got right

- **Action catalogs are exact** (verified programmatically): nine frontend `useCopilotAction` names, three live runtime actions, three commented runtime tools; MCP naming via `toolNameFor` matches `Library_lendDocument` pattern.
- **Lending endpoint uuid** `212f2784-5b68-43b2-8ee0-89b1c6fdd0de` exists in library deployment assets and `miroirCopilotKitActions.ts:45`.
- **#273 foundation is accurately reused**: process snapshot, `GET /capabilities`, loopback Electron HTTP (`ipcServerSetup.ts:223-267`), `browserMcpServerUrl` electron special-case, lazy CopilotKit chunk latch (`RootComponent.tsx:624-638`), static `miroir-ai` import scope.
- **Absence claims hold**: no `@cursor/sdk`, no `aiCursorKey`, no `features.cursor` in tree; `AiProviderType` is token adapters only.
- **Bundle / ncc story is directionally correct**: browser must not import SDK (D13); `miroir-ai` already ncc-external on server release.
- **CopilotRuntime 1.59.2 risk is real but surmountable**: `agents` map and `AbstractAgent` exist; blocker is wiring, not missing API.
- **Electron version claim**: `40.6.1` in package.json; embedded Node 24.x satisfies SDK floor.
- **D8 collision observation**: `lendDocument` vs `Library_lendDocument` already differ; `propose_` prefix is for human/model clarity, not MCP dedup.

---

## Suggested decision repairs (preserve D1–D14)

| Conflict | Repair |
|---|---|
| D4 sessionStorage vs server branch | Keep D4; add explicit request-field wiring in `copilotKitRoute` + frontend send on CopilotKit POST (R1). |
| D6 Bearer vs ungated `/mcp` | Keep loopback URL; align auth story with actual mounts or add hatch + mint (R2). |
| D2-b AbstractAgent vs `serviceAdapter` | Keep D2-b; document Cursor branch = `agents` map, no adapter (R3). |
| D8 two catalogs on Cursor run | Keep `propose_*`; specify filtered runtime `actions` for Cursor branch if duplicates are unacceptable before #193 (R5). |
| D10 refuse | Keep flags; extend `ProcessCapabilityName` + CopilotKit refuse (R4). |
| D12 Electron | Keep same loopback; add native SDK packaging work (R8). |
| D14 snapshot | Keep `cursor` boolean; update FAIL_CLOSED, tests, docs (R9). |
