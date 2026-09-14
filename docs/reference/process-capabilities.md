# Process capabilities

A process capability is something this running process can actually do: talk to an LLM, expose MCP, create a SQL store, show designer tools. The UI hides what is off. Leftover actions return `FeatureUnavailable` with `errorContext.capability`. There is no `deploymentMode` and no Settings switch for AI.

`emulateServer` only chooses the transport (HTTP to `miroir-server` vs an in-process stub). It does not turn features on.

Versioning of an application is not a process flag. See [Versioning (per application)](#versioning-per-application).

## Synoptic

| Capability | What you can do when it is on | How to turn on | How to turn off |
|---|---|---|---|
| `ai` | CopilotKit route, AppBar assistant / AI console, lazy CopilotKit chunk | Persistence-side `features.ai: true`, then restart. Not available in the sandbox page even if the file says true. | Omit `ai` or set `false`. Restart. |
| `mcp` | HTTP MCP on the app (`/mcp`) and, on `miroir-server`, the dedicated listener from `server.mcpUrl` (shipped default `https://localhost:4080`); MCP tool runners may fetch | Persistence-side `features.mcp: true`, then restart. | Omit `mcp` or set `false`. Restart. |
| `cursor` | Optional Cursor SDK agent behind CopilotKit (local only, not a fifth token adapter) | Persistence-side `features.cursor: true`, then restart. Requires snapshot `ai` and `mcp` also true or `/api/copilotkit` refuses. Needs Node ≥ 22.13.0 on the persistence process and `CURSOR_API_KEY` imported as `aiCursorKey`. | Omit `cursor` or set `false`. Restart. |
| `designerTools` | AppBar bulb, model-scope menus, Transformer Builder | Default on. Set `features.designerTools: true` or omit the key. When authentication is on, the signed-in user also needs an explicit Admin-application `MiroirRight` (`capability: "admin"`). | Set `features.designerTools: false` and restart. Or (auth on) give the user no Admin-application grant. Leftover `sessionStorage.showModelTools` cannot force the tools back on. |
| `availableStoreTypes` | Open existing deployments on those backends | Register the store factories in the **persistence** process (server, Electron main, or emulated in-process server). | Do not register the factory. The browser IndexedDB-only map is not the source when the client is remote. |
| `creatableStoreTypes` | Create Application backend picker | Same as available types, minus `bundled`. | Same. `bundled` is never offered for create. |
| `storeAdministration` | Create / delete / reset a store | Persistence process has a non-`bundled` admin-store factory. | Bundled-only admin (sandbox). `openStore` / `closeStore` still run; startup must open stores. |

Missing `features.ai`, `features.mcp`, or `features.cursor` is **false**. Missing `features.designerTools` is **true**. Restart the process after you edit flags. The UI does not recompute them from the renderer factory map. Sandbox does not force `cursor` off, but `ai` false hides the backend picker.

## Config shape

Sibling of `client` / `server`, not nested inside `emulateServer`:

```json
{
  "features": {
    "ai": true,
    "mcp": true,
    "cursor": false,
    "designerTools": true
  }
}
```

You may omit `cursor`; missing means false. Shipped `miroirConfig.server.json` / `.docker.json` omit `cursor`. Write this on the **persistence-side** config only:

| Process | File or object | Typical flags |
|---|---|---|
| `miroir-server` | `packages/miroir-server/config/miroirConfig.server.json` (and `.docker.json`) | `ai` and `mcp` true; shipped JSON omits `cursor` (missing = false). Add `cursor: true` locally on Node ≥ 22.13.0 with `CURSOR_API_KEY` imported as `aiCursorKey`. Designer omitted (defaults on) |
| Electron **main** | Hardcoded `electronServerConfig` in `ipcServerSetup.ts` | `ai`, `mcp`, `designerTools` all true; `cursor` stays off in shipped Electron main. Packaged builds call `assertCursorSdkPackaged` if `features.cursor` is on and `@cursor/sdk` cannot be resolved. When `ai` or `mcp` is true, main also listens on loopback HTTP (`http://127.0.0.1:3080`) so CopilotKit and MCP are not `app://`. If 3080 is already taken, main logs that and IPC still works. |
| Sandbox page | Bundled emulateServer client in `miroir-sandbox` | `ai` stays false (environment veto). `mcp` false unless you set it. Designer on. |
| Emulated-server tests | The test `miroirConfig*.json` you pass in | Omit AI/MCP unless that profile needs them. |
| Browser talking to a real server | Remote-only client JSON | Not read for `features`. The server JSON is. |
| Electron **renderer** `electronMiroirConfig` | `index.tsx` | Not read for `features`. Main is. |

The UI loads one snapshot with `GET /capabilities` through the environment rest client (HTTP, IPC, or `RestClientStub`), before login. Do not call `window.fetch("/capabilities")` and do not call `getProcessCapabilities()` in the Electron renderer (that process only registered IndexedDB).

## Node version floor

The Cursor SDK path needs Node ≥ 22.13.0 on the persistence process (`miroir-server` runtime). Electron 40.6.1 embeds Node 24.

## Product shapes

| Shape | `ai` | `mcp` | `cursor` | `designerTools` | Stores you can create |
|---|---|---|---|---|---|
| Web + `miroir-server` (shipped defaults) | on | on | off (optional) | on | filesystem, indexedDb, sql, mongodb |
| Electron desktop | on | on | off (shipped main) | on | same (factories on main) |
| Sandbox demo | off (forced) | off | off unless set (picker hidden) | on | indexedDb only (`bundled` is openable, not creatable) |
| In-process test profile | off unless the JSON sets the flags | same | off unless set | on | whatever that profile registered |

## Versioning (per application)

The Versioning AppBar item follows the **browsed** SelfApplication (`toolsPageState.applicationSelector`), not the process snapshot. Home (no selector) hides it. `unversioned` and `versioned-external` hide it. `versioned-internal` (or legacy `versioningEnabled: true`) shows it. Click still opens the report under Miroir. Freeze still uses `assertApplicationVersioningEnabled` on that application.

Set the mode on the SelfApplication row (`versioningMode` / `versioningEnabled`), not on `features`. Store layout: [Data architecture: versioning mode matrix](data-architecture-deployments.md#versioning-mode-matrix).

## Refused leftover actions

If something still calls a gated API:

| Capability | Typical refuse |
|---|---|
| `mcp` | `runMcpToolRunner` returns `FeatureUnavailable` and does not fetch |
| `cursor` | `/api/copilotkit` HTTP 403 `FeatureUnavailable` with `errorContext.capability: "cursor"` or `"mcp"` when snapshot lacks `ai`, `cursor`, or `mcp` |
| `availableStoreTypes` | `createStore` for a type that is not registered, or `bundled` |
| `storeAdministration` | `createStore` / `deleteStore` / `resetAndInitApplicationDeployment` |
| `ai` | CopilotKit is not mounted; leftover HTTP 404 |

Error shape: `Action2Error` with `errorType: "FeatureUnavailable"` and `errorContext.capability` set to the name above.

## Related

- [Using AI in Miroir](../guides/using-ai.md): token providers, OpenAI-compatible gateways, Cursor pick
- [Data architecture: deployments](data-architecture-deployments.md): store backends, `emulateServer`, product scenarios
- [Code splitting](../internals/code-splitting.md): CopilotKit chunk waits for snapshot `ai` and first open
- Issue [#273](https://github.com/miroir-framework/miroir/issues/273) and [`code-helpers/features/273-FEATURE-process-capability-switches/analysis.md`](../../code-helpers/features/273-FEATURE-process-capability-switches/analysis.md)
- Issue [#275](https://github.com/miroir-framework/miroir/issues/275) and [`code-helpers/features/275-FEATURE-cursor-sdk-copilotkit-backend/analysis.md`](../../code-helpers/features/275-FEATURE-cursor-sdk-copilotkit-backend/analysis.md)
