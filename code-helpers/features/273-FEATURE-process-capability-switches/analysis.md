# 273 — Process capability switches for deployment-aware UI and actions

> How Miroir decides which features exist in a given process — web client plus
> `miroir-server`, sandbox IndexedDB page, Electron (client and server in one
> binary), in-process `emulatedServer` test — so the UI does not offer AI, MCP,
> store backends, freeze, or designer tools the process cannot do, and so the
> same check refuses the action.

Related issue: https://github.com/miroir-framework/miroir/issues/273
Related: [#193 LLM / Agent](https://github.com/miroir-framework/miroir/issues/193) · [#244 defer CopilotKit](https://github.com/miroir-framework/miroir/issues/244) ✅ · [#253 MCP tool runner](https://github.com/miroir-framework/miroir/issues/253) · [#234 versioning modes](https://github.com/miroir-framework/miroir/issues/234) ✅ · [#225 versioning UI](https://github.com/miroir-framework/miroir/issues/225) · [#71 authentication](https://github.com/miroir-framework/miroir/issues/71) ✅ · [#262 application access](https://github.com/miroir-framework/miroir/issues/262)
Related analyses: [`../234-FEATURE-versioning-modes-and-asset-migration/analysis.md`](../234-FEATURE-versioning-modes-and-asset-migration/analysis.md) · [`../253-FEATURE-generic-mcp-tool-runner/analysis.md`](../253-FEATURE-generic-mcp-tool-runner/analysis.md) · [`../71-FEATURE-user-authentication/analysis.md`](../71-FEATURE-user-authentication/analysis.md) · [`../262-FEATURE-application-access-rights/analysis.md`](../262-FEATURE-application-access-rights/analysis.md)
Key sources: [`tools.ts`](../../../packages/miroir-core/src/tools.ts) · [`ViewParams.ts`](../../../packages/miroir-core/src/0_interfaces/4-views/ViewParams.ts) · [`ConfigurationService.ts`](../../../packages/miroir-core/src/3_controllers/ConfigurationService.ts) · [`DomainElement.ts`](../../../packages/miroir-core/src/0_interfaces/2_domain/DomainElement.ts) · [`versioningMode.ts`](../../../packages/miroir-core/src/1_core/versioning/versioningMode.ts) · [`AccessPolicy.ts`](../../../packages/miroir-core/src/1_core/authentication/AccessPolicy.ts) · [`RestClientStub.ts`](../../../packages/miroir-core/src/4_services/RestClientStub.ts) · [`getMiroirFundamentalJzodSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts) · [`AppBar.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx) · [`RootComponent.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/RootComponent.tsx) · [`SettingsPage.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/SettingsPage.tsx) · [`AgentsCopilotKit.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AgentsCopilotKit.tsx) · [`index.tsx`](../../../packages/miroir-standalone-app/src/index.tsx) · [`ipcServerSetup.ts`](../../../packages/miroir-standalone-app-electron/src/ipcServerSetup.ts) · [`server.ts`](../../../packages/miroir-server/src/server.ts) · [`MiroirConfig.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/MiroirConfig.ts)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with the user (2026-09-12). First draft on `273-FEATURE-process-capability-switches`.

---

## Sequencing

| Step | Issue | Status |
|---|---|---|
| Lazy CopilotKit + `ViewParams.agents` | [#244](https://github.com/miroir-framework/miroir/issues/244) | ✅ stand-in, removed by **this** |
| Versioning modes + freeze gate | [#234](https://github.com/miroir-framework/miroir/issues/234) | ✅ reused, not replaced |
| Auth + Admin grants | [#71](https://github.com/miroir-framework/miroir/issues/71) / [#262](https://github.com/miroir-framework/miroir/issues/262) | ✅ reused for bulb visibility |
| Process capability snapshot + hide/refuse | **#273 (this)** | **this** |
| MCP runner UI | [#253](https://github.com/miroir-framework/miroir/issues/253) | consumes `mcp` once this lands |
| LLM product work | [#193](https://github.com/miroir-framework/miroir/issues/193) | later; this only gates whether the process loads it |
| `MiroirRight.capability` designer role | #219 C2 | later; this uses Admin application access |

---

## Decision record

Confirmed with the user (2026-09-12), grilling rounds 1–4. ★ = accepted.

| ID | Question | Choice |
|---|---|---|
| D1 | Unit of switching | **Capabilities, with the four deploy shapes as presets.** No new mode enum. Do not revive `deploymentMode`. |
| D2 | Hide vs refuse | **Same check for both.** |
| D3 | What is `emulatedServer`? | **Transport only.** Inherit capabilities from environment + factories + config. |
| D4 | Process vs application | **Two scopes.** Process snapshot vs per-application versioning. |
| D5 | Electron capacity | **Same as client plus server.** AI/MCP allowed when flags are on. Main process owns the snapshot. |
| D6 | AI availability | **`miroirConfig.features.ai` only.** Delete `ViewParams.agents` as a gate (#244 stand-in). |
| D7 | Where flags live | **Root `features` on client and server `miroirConfig`.** Restart to change. |
| D8 | Missing flags | **`ai` / `mcp` absent → false. `designerTools` absent → true.** Patch every repo config. |
| D9 | Sandbox vs file | **`getClientEnvironment() === "sandbox"` forces `ai` false.** File cannot override. |
| D10 | MCP | **Same declared flag as AI:** `features.mcp`. |
| D11 | Store types / store admin | **Derived** from factories registered on the persistence side. No per-backend force-off in v1. |
| D12 | How the UI learns the snapshot | **`getProcessCapabilities()` on the persistence side.** GET, once, HTTP or IPC. `RestClientStub` + express + Electron main. |
| D13 | Designer tools | **Keep the bulb.** Config can hide it. Auth on: also require Admin application access. Hidden ⇒ `showModelTools` forced off. No new role. |
| D14 | Refused action | **`Action2Error` `errorType: "FeatureUnavailable"`** + `errorContext.capability`. |
| D15 | Transformer Builder | **Follows designer tools, not `ai`.** |

**Rationale:** the four product shapes do not line up with one enum (`electron` + `emulateServer: true` + all factories is not sandbox). `ViewParams.agents` is one Admin row, not a process flag, and Settings still offers it in sandbox. Factory registration already decides what stores can run; the UI ignores it. Versioning is already per application. Electron main is a full server and must compute the snapshot there (`getClientEnvironment()` in main is `"node"`, not `"electron"`).

### D1 — Unit of switching

**Status:** Accepted — capabilities + presets.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D1-a. Mode enum | `web \| sandbox \| electron \| emulatedServer` implies a bundle | Simple story | Lies: emulatedServer-sql in Node ≠ emulatedServer-indexedDb in the browser; Electron is emulateServer + full factories |
| **D1-b. Named capabilities + presets** ★ | Callers ask `ai` / `mcp` / …; presets fill config + registration | Matches how the process is actually wired | More API |
| D1-c. Revive `deploymentMode` | `'monoUser' \| 'multiUser'` already declared | Field exists | Unused; different axis (single vs multi user); `MiroirConfig.ts:4-11` hard-codes `'monoUser'` |

**Decision:** D1-b. D1-c stays dead.

### D2 — Hide and refuse

**Status:** Accepted — one check, two call sites.

| Option | Verdict |
|---|---|
| D2-a. UI hide only | Rejected — leftover runners / MCP / deep links still fire |
| D2-b. Refuse only | Rejected — user still sees dead icons |
| **D2-c. Both** ★ | Accepted |

### D3 — `emulatedServer`

**Status:** Accepted — not a product SKU.

`MiroirConfigClient.client` is already a union on `emulateServer` (`miroirFundamentalType.ts:3472-3485`). That flag chooses `RestClientStub` vs HTTP. It does not name available features.

### D4 — Scopes

**Status:** Accepted — process snapshot + application versioning.

`assertApplicationVersioningEnabled` (`versioningMode.ts:53-66`) already throws when freeze is illegal. A flat `can("versioning")` would mix Admin with Library.

### D5 — Electron

**Status:** Accepted — full server in one binary.

`ipcServerSetup.ts:163-167` registers filesystem, IndexedDB, Mongo, Postgres. It does **not** mount CopilotKit or MCP. `electronServerConfig` (`:172-177`) has no `features`, no `mcpUrl`. The renderer’s `electronMiroirConfig` (`index.tsx:409-432`) is a client stub with `emulateServer: true` and no `features`. Adding the flags to **both** objects is required. Snapshot is computed in **main** and sent to the renderer. Do not derive it from `getClientEnvironment() === "electron"`: main hits `process.versions.node` first (`tools.ts:38-39`) and returns `"node"`.

### D6 — AI flag vs `ViewParams.agents`

**Status:** Accepted — config only. `ViewParams.agents` removed as a gate.

| Option | Verdict |
|---|---|
| **D6-a. `features.ai` only** ★ | Accepted. #244 latch stays as *when* to import the chunk, not *whether* AI exists |
| D6-b. Config + keep `ViewParams.agents` | Rejected — two installation-level switches |
| D6-c. Keep `ViewParams.agents` only | Rejected — cannot stop first import / server mount |

Seed row `441cb6fd-2728-4a16-b170-ebceec1ce6c2` currently has `"agents": false`. After this issue the field is unused. Removing it from the Admin Entity `mlSchema` (`b9765b7c-b614-4126-a0e2-634463f99937.json:132`) and from `ViewParams.ts:28` is in scope so Settings cannot resurrect the lie.

### D7 — Config shape

**Status:** Accepted — root-level `features` on both `miroirConfigClient` and `miroirConfigServer`.

```text
features?: {
  ai?: boolean;             // absent → false
  mcp?: boolean;            // absent → false
  designerTools?: boolean;  // absent → true
}
```

Sibling of `client` / `server`, not nested inside the emulateServer union, so Electron’s hardcoded client object and the server object share one path: `config.features`.

Schema change in `getMiroirFundamentalJzodSchema.ts` (`miroirConfigClient` `:1856-1883`, `miroirConfigServer` `:1885-1921`) then `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`.

### D8 — Missing-field defaults

**Status:** Accepted — fail closed for `ai` / `mcp`, fail open for `designerTools`.

Fail closed on AI/MCP means every shipped config that should keep today’s AI/MCP must set the flags explicitly. Fail open on designer tools avoids locking every existing designer out of the bulb.

### D9 — Sandbox veto

**Status:** Accepted.

`packages/miroir-sandbox/vite.config.js:26` defines `import.meta.env.MIROIR_IS_SANDBOX` as `"true"`. `getClientEnvironment()` (`tools.ts:33-36`) returns `"sandbox"` first. In sandbox the persistence side **is** the browser process (`emulateServer: true`), so the veto runs where the snapshot is computed. A real `miroir-server` process is `"node"` and is not sandbox.

### D10 — MCP flag

**Status:** Accepted — `features.mcp`, same object as `ai`.

Off: do not start the MCP HTTP server, do not show MCP runners / tool UI. `mcpUrl` remains the listen URL when `mcp` is true; it is not a second on/off.

### D11 — Store types

**Status:** Accepted — derive from `ConfigurationService` maps.

`registerStoreSectionFactory` keys are `JSON.stringify({ storageType, section })` (`ConfigurationService.ts:51-60`). `StorageType` is `"sql" \| "filesystem" \| "indexedDb" \| "mongodb" \| "bundled"` (`StorageConfiguration.ts:7-13`). `availableStoreTypes` = unique `storageType` values present in `StoreSectionFactoryRegister`. `storeAdministration` is true when `adminStoreFactoryRegister` has at least one type other than `"bundled"`.

Web renderer today registers IndexedDB only (`index.tsx:391`). Electron main and `miroir-server` register all four writable backends. Create Application’s form union (`Runner_CreateApplication.tsx:73-108`) lists indexedDb / filesystem / sql / mongodb with no filter.

### D12 — Snapshot transport

**Status:** Accepted — process-agnostic GET, same lesson as #270 `/secrets` and #71 `/auth`.

Precedent: `handleAuthHttpRoute` is checked first in `RestClientStub.call` (`RestClientStub.ts:74-91`) and also mounted on express. An express-only `/capabilities` in `server.ts` is invisible to emulated-server tests.

Target: `handleProcessCapabilitiesHttpRoute` in `miroir-core`, wired into `RestClientStub.call`, `server.ts`, and Electron IPC (renderer already uses `ElectronRestClient` → `RestClientStub`-shaped calls in main). No auth required: the snapshot is not secret, and `/auth/status` is already skipped on Electron/sandbox (`index.tsx:382-384` sets auth off on fetch failure).

### D13 — Designer tools

**Status:** Accepted — bulb stays; visibility = config AND (auth off OR Admin access).

`ADMIN_APPLICATION_UUID` is `55af124e-8c05-4bae-a3ef-0933d41daa92` (`AccessPolicy.ts:31`). `ALWAYS_ALLOW_APPLICATION_TARGETS` includes Admin (`:36-38`). `hasAccess` (`:71-88`) is the check. No designer role exists; Designer is an application uuid (`:34`).

`showModelTools` is sessionStorage (`MiroirContextReactProvider`). AppBar always renders the bulb when `setShowModelTools` exists (`AppBar.tsx:211-241`). Sidebar keeps the Admin section always; other applications including Miroir require `showModelTools` (`Sidebar.tsx:105-108`).

When the user must not see the bulb: force `showModelTools` false and ignore a leftover session value.

### D14 — Refuse shape

**Status:** Accepted — extend `ActionErrorType` in `DomainElement.ts:172-205` with `"FeatureUnavailable"`. Put the name in `errorContext.capability`.

The generated Jzod `actionError` (`miroirFundamentalType.ts:10247`) is a **narrower** CRUD enum. Do **not** add `FeatureUnavailable` there unless a later slice stores these errors as instances. DomainController / runners already use `Action2Error`.

Unmounted `/api/copilotkit` stays a 404. No Settings hint.

### D15 — Transformer Builder

**Status:** Accepted — designer tools.

Today it is appended only when `showAgentUi` (`AppBar.tsx:346`). That hitchhikes on AI. After D6 the builder follows D13.

---

## 1. Goals

1. **See only what this process can do** — In order to avoid dead controls as an application user, I can open the AppBar and Settings and only see AI, MCP, store backends, freeze, and designer tools the current process can actually run.
2. **Refuse what this process cannot do** — In order to get a stable failure as an MCP client or runner author, I receive `FeatureUnavailable` with the capability name instead of a factory-lookup miss or a hung CopilotKit fetch.
3. **Turn AI off before the bundle loads** — In order to keep a sandbox or an AI-less desktop build small as an operator, I set `features.ai` false and the process never imports `miroir-ai` / `@copilotkit/*` and never mounts `/api/copilotkit`.
4. **Keep designer tools for designers** — In order to edit model menus as an Admin user, I can still use the bulb when `features.designerTools` is true. As a non-Admin user with auth on, I do not see the bulb.

## 2. Non-goals

- Undo / redo / commit as capabilities (later, unscheduled).
- Debug, performance, local-cache overlays as capabilities (#211 stays session toggles).
- A compile-time second product besides the existing sandbox Vite define.
- Reviving `deploymentMode` / `monoUserAutentification`.
- Live-probing `/api/copilotkit` or MCP on every render.
- Storing process capabilities in ViewParams or sessionStorage.
- A new designer `MiroirRight` (owned by #219 C2).
- Replacing #234 versioning rules; this only hides the Versioning icon when freeze is illegal.
- Implementing the rest of #193 (prompts, tools, models).

---

## 3. Current state

### 3.1 No capability API (aligned: nothing to reuse as a flag module)

Repo grep finds no `featureFlag` / `featureSwitch` runtime API. `DeploymentMode` in `MiroirConfig.ts:4-11` is unused. `getClientEnvironment()` (`tools.ts:33-51`) has three callers in the graph sense: export, `DomainController` template params, Home report. It is not the AI gate.

### 3.2 `ClientEnvironment` (aligned as a detector; misaligned as a switch)

```typescript
// tools.ts:33-51
export const getClientEnvironment = (): ClientEnvironment => {
  if ((import.meta as any).env?.MIROIR_IS_SANDBOX) {
    return "sandbox";
  }
  if (typeof process !== "undefined" && (process as any).versions?.node) {
    return "node";
  }
  if (typeof (window as any).electronAPI?.callMiroirIpc === "function") {
    return "electron";
  }
  if (typeof window !== "undefined" && typeof window.document !== "undefined") {
    return "webApp";
  }
  throw new Error("Unable to determine client environment");
}
```

Type: `"webApp" \| "electron" \| "node" \| "sandbox"` (`miroirFundamentalType.ts:1838`).

Home report branches on sandbox vs web/desktop (`HomePage.tsx:161-184`). AI does **not** use this function; it reads `import.meta.env.MIROIR_IS_SANDBOX` again (`AppBar.tsx:143`, `AgentsCopilotKit.tsx:17-22`).

### 3.3 AI gate (misaligned)

| Location | Check | Effect |
|---|---|---|
| `RootComponent.tsx:627-642` | `viewParamsLoadedFromStorage && viewParams.agents === true` | CopilotKit mount latch |
| `AppBar.tsx:142-143` | `agentsEnabled && !import.meta.env.MIROIR_IS_SANDBOX` | Icons + Transformer Builder |
| `SettingsPage.tsx:105, 258-272` | none | Agents switch **always shown** |
| `AgentsCopilotKit.tsx:19-22` | `MIROIR_IS_SANDBOX === "true"` | Returns null |
| `server.ts:826-842` | auth only | `/api/copilotkit` always mounted on `miroir-server` |
| Electron main | none | No CopilotKit route |

`ViewParams` Entity uuid `b9765b7c-b614-4126-a0e2-634463f99937`. Seed `441cb6fd-2728-4a16-b170-ebceec1ce6c2` has `agents: false`, `mlSchemaTransformerCompatibility: true`. TS comment at `ViewParams.ts:28` still documents `agents` as the AI AppBar switch.

#244 already defers `vendor-copilotkit` until first open (`docs/internals/code-splitting.md`, `RootComponent.tsx:631-633`). That is a load-timing latch, not a process kill switch.

**Truth table today**

| `agents` | sandbox | Settings switch | AppBar AI | CopilotKit chunk |
|---|---|---|---|---|
| false / absent | no | shown | hidden | not fetched |
| true | no | shown on | shown | fetched on first open |
| false | yes | shown | hidden | not fetched |
| true | yes | shown on | hidden | not fetched (`AgentsCopilotKit` null) |

Target: Settings switch gone. Sandbox row: `ai` false, no Settings row, no icons.

### 3.4 Store factories (aligned as implicit capability; misaligned UI)

| Process | Factories registered |
|---|---|
| Web renderer `index.tsx:391` | IndexedDB only |
| Sandbox | bundled + IndexedDB (sandbox startup) |
| Electron main `ipcServerSetup.ts:164-167` | filesystem, IndexedDB, Mongo, Postgres |
| `miroir-server` | filesystem, IndexedDB, Mongo, Postgres |

There is no `listRegisteredStorageTypes`. Maps are public on `ConfigurationService.configurationService` (`:85-87`).

Create Application still offers four backends (`Runner_CreateApplication.tsx:73-108`). Web will fail at factory lookup for sql/filesystem/mongodb.

### 3.5 Designer bulb (misaligned with “don’t confuse the user”)

AppBar `key="model-tools"` (`AppBar.tsx:211-241`) is unconditional if the setter exists. Default session value is false, but anyone can flip it. `shouldShowAppMenuItem` hides Admin/Miroir items unless `showModelTools` (`applicationModelScopeMenu.ts`). There is no auth check on the bulb.

### 3.6 Versioning (enforced on write; UI ungated)

`assertApplicationVersioningEnabled` (`versioningMode.ts:53-66`) throws for `unversioned` and `versioned-external`. AppBar Versioning always links to `reportVersioning` uuid `c2b89408-bed7-473d-ab0a-2f4adc6a85e1` (`AppBar.tsx:373-386`). Bundled sandbox has no writable `modelVersion` section.

### 3.7 Auth reuse (aligned)

`hasAccess` + `ADMIN_APPLICATION_UUID` (`AccessPolicy.ts:31, 71-88`). Client session defaults **false** until `/auth/status` (`index.tsx:376-384`). Electron/sandbox typically stay auth-off. D13 then reduces to the config flag only.

### 3.8 Action errors (aligned enough to extend)

`ActionErrorType` (`DomainElement.ts:172-205`) has no `FeatureUnavailable`. `Action2Error` already has `errorContext` (`:216`). `functionCallTest` can assert `expectedAction2ErrorType`.

### 3.9 Dead `deploymentMode` (misaligned leftover)

30 `miroirConfig*.json` files carry `deploymentMode: "monoUser"` plus unread `monoUserAutentification` / `monoUserVersionControl` / `versionControlForDataConceptLevel` on the **client** object. `MiroirConfig.ts` declares the type. Nothing reads the fields (`authentication.71.phase0` already asserts `monoUserAutentification` unread). Leave them; do not use them.

### 3.10 Config inventory (programmatic)

37 `miroirConfig*.json` files under the repo (excluding `node_modules` / `dist` / `graphify-out`). **0** have a `features` object. 30 have `deploymentMode`. Server files: `packages/miroir-server/config/miroirConfig.server.json`, `miroirConfig.server.docker.json`. Electron does not use a file; both hardcoded objects must gain `features`.

### 3.11 MCP UI (ungated)

AppBar runners report `reportMiroirRunners` uuid `ac75382d-00fc-4f93-a169-3f76ef85834e` (`AppBar.tsx:362-372`) is always shown. MCP tool runners inside that report have no `mcpUrl` / environment check (`RunnerView.tsx`).

---

## 4. Key reuse

| Piece | Location |
|---|---|
| `getClientEnvironment()` | `packages/miroir-core/src/tools.ts:33-51` |
| `ClientEnvironment` | `miroirFundamentalType.ts:1838` |
| Factory maps | `ConfigurationService.ts:37-38, 51-72` |
| `StorageType` | `StorageConfiguration.ts:7-13` |
| `handleAuthHttpRoute` pattern | `RestClientStub.ts:74-91` + `AuthenticationHttp.ts` |
| `Action2Error` / `errorContext` | `DomainElement.ts:208-217` |
| `assertApplicationVersioningEnabled` | `versioningMode.ts:53-66` |
| `hasAccess` / Admin uuid | `AccessPolicy.ts:31, 71-88` |
| CopilotKit lazy latch | `RootComponent.tsx:631-642`, #244 |
| `MiroirConfigClient` / `MiroirConfigServer` Jzod | `getMiroirFundamentalJzodSchema.ts:1856-1921` |
| ViewParams Entity / seed | uuid `b9765b7c-…` / `441cb6fd-…` |
| Runners report | uuid `ac75382d-00fc-4f93-a169-3f76ef85834e` |
| Versioning report | uuid `c2b89408-bed7-473d-ab0a-2f4adc6a85e1` |
| `#244` code-splitting notes | `docs/internals/code-splitting.md` |

---

## 5. Target design

### 5.1 Snapshot

```typescript
type ProcessCapabilities = {
  ai: boolean;
  mcp: boolean;
  availableStoreTypes: StorageType[];
  storeAdministration: boolean;
  designerTools: boolean;
};
```

Computed only on the persistence side. Client holds one copy after startup. Application versioning is **not** on this object.

### 5.2 Computation

```text
ai = (features.ai === true) AND (getClientEnvironment() !== "sandbox")
mcp = (features.mcp === true)
designerTools = (features.designerTools !== false)
availableStoreTypes = unique storageType from StoreSectionFactoryRegister
storeAdministration = adminStoreFactoryRegister has any type other than "bundled"
```

`getProcessCapabilities({ config, environment, storeSectionFactoryRegister, adminStoreFactoryRegister })` is a pure function in `miroir-core` (testable with `functionCallTest` / vitest because it is not an ML transformer). Startup wiring passes the live maps and `getClientEnvironment()`.

### 5.3 Transport

`GET /capabilities` → `{ status: "ok", capabilities: ProcessCapabilities }`.

Same handler in:

- `RestClientStub.call` (before `restServerDefaultHandlers`, same early-return style as auth)
- `server.ts` express
- Electron main (renderer `GET /capabilities` via existing IPC rest-call)

UI: one fetch in `startWebApp` / sandbox `index`, store on React context next to `clientEnvironment`.

### 5.4 Hide + refuse map

| Capability | Hide | Refuse |
|---|---|---|
| `ai` | AppBar assistant + dev console; Settings Agents row; do not `import()` CopilotKit; do not `app.use('/api/copilotkit')` | Domain/AI routes already unmounted; leftover fetch 404 |
| `mcp` | MCP runners / tool UI; do not listen on `mcpUrl` | MCP-dispatch actions → `FeatureUnavailable` / `capability: "mcp"` |
| `availableStoreTypes` | Create Application backend union filtered to the list | `createStore` / open with a missing type → `FeatureUnavailable` / `capability: "availableStoreTypes"` |
| `storeAdministration` | Store-admin runners that create/delete/reset | those actions → `FeatureUnavailable` / `capability: "storeAdministration"` |
| `designerTools` | Bulb; force `showModelTools` off; Transformer Builder | model-scope injection already follows `showModelTools` |
| versioning (application) | Versioning AppBar icon when `resolveVersioningMode` is not `versioned-internal` | existing `assertApplicationVersioningEnabled` |

### 5.5 Presets (what we write into repo configs)

| Shape | `features.ai` | `features.mcp` | `features.designerTools` | Factories |
|---|---|---|---|---|
| Web + `miroir-server` (dev defaults) | true | true | true | server: all writable |
| Electron hardcoded | true | true | true | main: all writable |
| Sandbox | false (also environment veto) | false | true | bundled + IndexedDB |
| In-process tests that need SQL/MCP | set explicitly per profile | set explicitly | true | per profile startup |

Test profiles that never touch AI/MCP can omit the flags and stay false.

### 5.6 Remove `ViewParams.agents`

- Delete `agents` from `ViewParams.ts` schema + `ViewParamsData`
- Delete `agents` from Admin Entity `mlSchema`
- Drop Settings Agents block (`SettingsPage.tsx:258-272`)
- Drop `RootComponent` / `AppBar` reads of `viewParams.agents`
- Seed `441cb6fd-…` loses the field (harmless extra JSON until then)
- Keep #244 dynamic `import()` of `AgentsCopilotKit` gated on snapshot `ai` **and** first open

### 5.7 Blast radius

- Jzod `miroirConfigClient` + `miroirConfigServer` + `devBuild`
- 37 `miroirConfig*.json` files: add `features` where AI/MCP/designer should stay on
- 2 Electron hardcoded configs (`index.tsx:409-432`, `ipcServerSetup.ts:172-177`)
- `ActionErrorType` union
- AppBar, Settings, RootComponent, Runner_CreateApplication, RunnerView MCP branch, server CopilotKit/MCP mount
- `docs/internals/code-splitting.md` (#244 wording)
- `docs/reference/data-architecture-deployments.md` (client/server vs emulate vs sandbox)
- Tests that enable Agents or call `/api/copilotkit` / MCP runners must set `features.ai` / `features.mcp`

### 5.8 Implementation home (not a phase list)

| Symbol | Package / layer |
|---|---|
| `ProcessCapabilities`, `getProcessCapabilities` | `miroir-core` `1_core` (pure) |
| `handleProcessCapabilitiesHttpRoute` | `miroir-core` `4_services` or `1_core` sibling of `AuthenticationHttp.ts` |
| `assertProcessCapability(name)` → `Action2Error \| void` | `miroir-core` `1_core` |
| React context field | `miroir-react` / standalone `MiroirContextReactProvider` |
| Schema `features` | `getMiroirFundamentalJzodSchema.ts` |

Layering: `1_core` must not import `3_controllers`. `getProcessCapabilities` takes maps as arguments; it does not import `ConfigurationService`.

---

## 6. Proposals

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | Persistence-side snapshot + config `features` + hide/refuse | High | Med | **adopt** |
| 2 | Mode enum only | High (wrong) | Low | reject (D1-a) |
| 3 | More `ViewParams` booleans | Med | Low | reject (D6) |
| 4 | Client guesses from `ClientEnvironment` | High (lies on Electron main) | Low | reject (D5, D12) |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) after this analysis is reviewed, following the `miroir-analysis-to-tdd-plan` skill.
