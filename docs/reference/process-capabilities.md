# Process capabilities

A process capability is something this running process can actually do: talk to an LLM, expose MCP, create a SQL store, show designer tools. The UI hides what is off. Leftover actions return `FeatureUnavailable` with `errorContext.capability`. There is no `deploymentMode` and no Settings switch for AI.

`emulateServer` only chooses the transport (HTTP to `miroir-server` vs an in-process stub). It does not turn features on.

Versioning of an application is not a process flag. See [Versioning (per application)](#versioning-per-application).

## Synoptic

| Capability | What you can do when it is on | How to turn on | How to turn off |
|---|---|---|---|
| `ai` | CopilotKit route, AppBar assistant / AI console, lazy CopilotKit chunk | Persistence-side `features.ai: true`, then restart. Not available in the sandbox page even if the file says true. | Omit `ai` or set `false`. Restart. |
| `mcp` | HTTP MCP on the app (`/mcp`) and, on `miroir-server`, the dedicated listener from `server.mcpUrl` (shipped default `https://localhost:4080`); MCP tool runners may fetch | Persistence-side `features.mcp: true`, then restart. | Omit `mcp` or set `false`. Restart. |
| `agentBackend` | One agent SDK behind CopilotKit, picked before start: `cursor` (Cursor SDK) or `claude` (Claude Agent SDK). Local agents reaching Miroir through MCP, not a fifth token adapter. Only the picked SDK is loaded, and only on the first agent request. | Persistence-side `features.agentBackend: "cursor"` or `"claude"`, then restart. Requires snapshot `ai` and `mcp` also true or `/api/copilotkit` refuses. Cursor needs Node ≥ 22.13.0 and `aiCursorKey`; Claude needs `aiAnthropicKey`. Optional `features.agentModel` picks the Claude model (default `claude-opus-5-5`). | Omit `agentBackend` or set `"none"`. Restart. |
| `designerTools` | AppBar bulb, model-scope menus, Transformer Builder | Default on. Set `features.designerTools: true` or omit the key. When authentication is on, the signed-in user also needs an explicit Admin-application `MiroirRight` (`capability: "admin"`). | Set `features.designerTools: false` and restart. Or (auth on) give the user no Admin-application grant. Leftover `sessionStorage.showModelTools` cannot force the tools back on. |
| `availableStoreTypes` | Open existing deployments on those backends | Register the store factories in the **persistence** process (server, Electron main, or emulated in-process server). | Do not register the factory. The browser IndexedDB-only map is not the source when the client is remote. |
| `creatableStoreTypes` | Create Application backend picker | Same as available types, minus `bundled`. | Same. `bundled` is never offered for create. |
| `storeAdministration` | Create / delete / reset a store | Persistence process has a non-`bundled` admin-store factory. | Bundled-only admin (sandbox). `openStore` / `closeStore` still run; startup must open stores. |

Missing `features.ai` or `features.mcp` is **false**, and missing `features.agentBackend` is `"none"`. Missing `features.designerTools` is **true**. Restart the process after you edit flags. The UI does not recompute them from the renderer factory map. Sandbox does not force `agentBackend` to `"none"`, but `ai` false hides the backend picker.

`features.cursor: true` is still read as `agentBackend: "cursor"` for one release when `agentBackend` is absent; `agentBackend` wins when both are set. `miroir-env check` warns about it (an error under `--strict`).

## Config shape

Sibling of `client` / `server`, not nested inside `emulateServer`:

```json
{
  "features": {
    "ai": true,
    "mcp": true,
    "agentBackend": "none",
    "designerTools": true
  }
}
```

You may omit `agentBackend`; missing means `"none"`. The shipped environments omit it, except `environments/docker.json`, which sets `"none"` to match the image's default `AGENT_BACKEND` build argument. Write this on the **persistence-side** config only:

| Process | File or object | Typical flags |
|---|---|---|
| `miroir-server` | `packages/miroir-server/config/miroirConfig.server.json` (and `.docker.json`) | `ai` and `mcp` true; shipped JSON omits `agentBackend` (missing = `"none"`). Set `agentBackend` locally, with the backend's key imported. Designer omitted (defaults on). With an agent backend set, startup fails when its SDK cannot be resolved (for example a Docker image built for another `AGENT_BACKEND`). |
| Electron **main** | Hardcoded `electronServerConfig` in `ipcServerSetup.ts` | `ai`, `mcp`, `designerTools` all true; `agentBackend` stays `"none"` in shipped Electron main. Packaged builds ship neither agent SDK and call `assertAgentSdkPackaged`, which fails at start when an agent backend is set. When `ai` or `mcp` is true, main also listens on loopback HTTP (`http://127.0.0.1:3080`) so CopilotKit and MCP are not `app://`. If 3080 is already taken, main logs that and IPC still works. |
| Sandbox page | Bundled emulateServer client in `miroir-sandbox` | `ai` stays false (environment veto). `mcp` false unless you set it. Designer on. |
| Emulated-server tests | The test `miroirConfig*.json` you pass in | Omit AI/MCP unless that profile needs them. |
| Browser talking to a real server | Remote-only client JSON | Not read for `features`. The server JSON is. |
| Electron **renderer** `electronMiroirConfig` | `index.tsx` | Not read for `features`. Main is. |

The UI loads one snapshot with `GET /capabilities` through the environment rest client (HTTP, IPC, or `RestClientStub`), before login. Do not call `window.fetch("/capabilities")` and do not call `getProcessCapabilities()` in the Electron renderer (that process only registered IndexedDB).

## Node version floor

The Cursor backend needs Node ≥ 22.13.0 on the persistence process (`miroir-server` runtime). Electron 40.6.1 embeds Node 24.

## Product shapes

| Shape | `ai` | `mcp` | `agentBackend` | `designerTools` | Stores you can create |
|---|---|---|---|---|---|
| Web + `miroir-server` (shipped defaults) | on | on | `none` (optional `cursor` or `claude`) | on | filesystem, indexedDb, sql, mongodb |
| Electron desktop | on | on | `none` (packaged builds ship no agent SDK) | on | same (factories on main) |
| Sandbox demo | off (forced) | off | `none` unless set (picker hidden) | on | indexedDb only (`bundled` is openable, not creatable) |
| In-process test profile | off unless the JSON sets the flags | same | `none` unless set | on | whatever that profile registered |

## Versioning (per application)

The Versioning AppBar item follows the **browsed** SelfApplication (`toolsPageState.applicationSelector`), not the process snapshot. Home (no selector) hides it. `unversioned` and `versioned-external` hide it. `versioned-internal` (or legacy `versioningEnabled: true`) shows it. Click still opens the report under Miroir. Freeze still uses `assertApplicationVersioningEnabled` on that application.

Set the mode on the SelfApplication row (`versioningMode` / `versioningEnabled`), not on `features`. Modes and store layout: [Versioning reference](versioning.md#versioning-modes).

## Refused leftover actions

If something still calls a gated API:

| Capability | Typical refuse |
|---|---|
| `mcp` | `runMcpToolRunner` returns `FeatureUnavailable` and does not fetch |
| `agent` | `/api/copilotkit` agent request (`aiConfig.backend: "agent"`, or the `"cursor"` alias for one release): HTTP 403 `FeatureUnavailable` with `errorContext.capability` `"agent"` when `agentBackend` is `"none"`, `"mcp"` when `mcp` is off, `"ai"` when `ai` is off |
| `availableStoreTypes` | `createStore` for a type that is not registered, or `bundled` |
| `storeAdministration` | `createStore` / `deleteStore` / `resetAndInitApplicationDeployment` |
| `ai` | CopilotKit is not mounted; leftover HTTP 404 |

Error shape: `Action2Error` with `errorType: "FeatureUnavailable"` and `errorContext.capability` set to the name above.

## Related

- [Using AI in Miroir](../guides/using-ai.md): token providers, OpenAI-compatible gateways, Cursor and Claude agents
- [Data architecture: deployments](data-architecture-deployments.md): store backends, `emulateServer`, product scenarios
- [Code splitting](../internals/code-splitting.md): CopilotKit chunk waits for snapshot `ai` and first open
- Issue [#273](https://github.com/miroir-framework/miroir/issues/273) and [`code-helpers/features/273-FEATURE-process-capability-switches/analysis.md`](../../code-helpers/features/273-FEATURE-process-capability-switches/analysis.md)
- Issue [#275](https://github.com/miroir-framework/miroir/issues/275) and [`code-helpers/features/275-FEATURE-cursor-sdk-copilotkit-backend/analysis.md`](../../code-helpers/features/275-FEATURE-cursor-sdk-copilotkit-backend/analysis.md)
- Issue [#409](https://github.com/miroir-framework/miroir/issues/409) and [`code-helpers/features/409-FEATURE-claude-agent-sdk-backend/analysis.md`](../../code-helpers/features/409-FEATURE-claude-agent-sdk-backend/analysis.md)
