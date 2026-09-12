# Issue #273 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController / local cache / emulated server (`RestClientStub`)
> and the public TS helpers `getProcessCapabilities` / `assertProcessCapability`.
> No mocks. `miroir-server` and Electron main have no test suite — CopilotKit/MCP **mount
> gating** and Electron loopback URL construction are vitest against extracted functions
> (same exception as #267 `parseServerArgs` / #270 `SecretsService`).
> Tracer (Slice 1→2): a persistence-side snapshot computed from config + factories is
> returned by `GET /capabilities` through `RestClientStub` before login.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step. Each slice ends
> with Validation commands; on success Realization is appended and Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Analysis review: [`./adversarial-review.md`](./adversarial-review.md) · Issue: https://github.com/miroir-framework/miroir/issues/273
Working branch: `273-FEATURE-process-capability-switches`

**Resume note:** slices pending. Plan written after analysis R1–R12.

---

## Scope

- Root `features` on persistence-side `miroirConfig` (`ai`, `mcp`, `designerTools`).
- `ProcessCapabilities` + `getProcessCapabilities` + `assertProcessCapability` in `miroir-core`.
- `GET /capabilities` via `handleProcessCapabilitiesHttpRoute` in `RestClientStub` (before auth gate), express (ungated), Electron IPC `rest-call`.
- Hide + refuse for `ai`, `mcp`, `creatableStoreTypes`, `storeAdministration`, `designerTools`; Versioning icon uses existing `resolveVersioningMode`.
- Remove `ViewParams.agents` (schema + seed same commit).
- Electron loopback HTTP when `ai`/`mcp` true; renderer uses absolute loopback URLs.

This plan does **not** add undo/redo/commit capabilities, debug overlays as flags, a new designer role (#219 C2), `#193` LLM product work, or revive `deploymentMode`.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize current gates / inventories | ⬜ | `processCapabilities.273.phase0.unit.test.ts` |
| 1 | **Tracer:** `getProcessCapabilities` + `FeatureUnavailable` | ⬜ | `processCapabilities.273.phase1.unit.test.ts` + functionCallTest |
| 2 | `GET /capabilities` through `RestClientStub` | ⬜ | `processCapabilitiesHttp.273.phase2.integ.test.ts` |
| 3 | Store create/admin refuse in `handleActionInternal` | ⬜ | `processCapabilitiesStore.273.phase3.integ.test.ts` |
| 4 | AI hide + no CopilotKit mount + drop `ViewParams.agents` | ⬜ | `processCapabilitiesAi.273.phase4.unit.test.ts` + Admin `modelValidation` |
| 5 | MCP refuse in `runMcpToolRunner` + both server mounts | ⬜ | `processCapabilitiesMcp.273.phase5.unit.test.ts` |
| 6 | Designer bulb + explicit Admin grant + Transformer Builder | ⬜ | `processCapabilitiesDesigner.273.phase6.unit.test.ts` |
| 7 | Versioning AppBar follows `resolveVersioningMode` | ⬜ | `processCapabilitiesVersioning.273.phase7.unit.test.ts` |
| 8 | Electron loopback URL + persistence-side config patches | ⬜ | `processCapabilitiesElectron.273.phase8.unit.test.ts` |
| 9 | Nonreg, docs, cleanup, AC | ⬜ | `unit-273-process-capabilities` + docs |

---

## Locked implementation defaults

From [`./analysis.md`](./analysis.md) D1–D15 + R1–R12. Binding. Deviations go in Realization.

| Decision | Choice |
|---|---|
| D1 | Capabilities + presets. No mode enum. |
| D2 | Same check hides and refuses. |
| D3 | `emulateServer` is transport. |
| D4 | Process snapshot vs application versioning. |
| D5 | Electron = full server. Main owns snapshot. Loopback HTTP when `ai`/`mcp` true. |
| D6 | `features.ai` only. Delete `ViewParams.agents`. |
| D7 | Root `features` on persistence-side configs. |
| D8 | Missing `ai`/`mcp` → false; missing `designerTools` → true. Patch only configs that need non-defaults. |
| D9 | Sandbox environment forces `ai` false. |
| D10 | `features.mcp`. Gate `server.ts:823` and `:925-926`. |
| D11 | Derive types. `creatableStoreTypes` excludes `bundled`. |
| D12 | Persistence-side `getProcessCapabilities`. Handler **before** `assertRequestAllowed`. Fetch via rest client. |
| D13 | Bulb: config AND (auth off OR `hasAccess(..., alwaysAllow: [])` for Admin). Force `showModelTools` off. |
| D14 | `Action2Error` `FeatureUnavailable` + `errorContext.capability`. Not the Jzod `actionError` enum. |
| D15 | Transformer Builder follows designer tools. |
| R2 | Electron transport is **this** issue, not a follow-up that leaves flags on with dead UI. |
| R6 | Refuse create/delete/reset only. Never `openStore`/`closeStore`. Check in `handleActionInternal`. |
| R7 | Do not put `features` on Electron renderer `electronMiroirConfig`. |
| R11 | Read factory maps per call. Never compute on the Electron renderer singleton. |

---

## Allocated UUIDs / keys

No new Entity / Report / Runner. Function-call registry key only.

| Artefact | Value |
|---|---|
| Vitest issue dir | `packages/miroir-core/tests/1_core/issues/273-process-capability-switches/` and `packages/miroir-standalone-app/tests/4_view/issues/273-process-capability-switches/` |
| functionCallTest export | `getProcessCapabilities` in `FunctionCallTestRegistry` |
| Nonreg step | `unit-273-process-capabilities` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Phase N vitest (core) | `RUN_TEST=processCapabilities.273.phaseN npm run testByFile -w miroir-core -- processCapabilities.273.phaseN` |
| Phase N vitest (standalone) | `RUN_TEST=processCapabilities.273.phaseN npm run testByFile -w miroir-standalone-app -- processCapabilities.273.phaseN` |
| Admin modelValidation | `npm run testByFile -w miroir-test-app_deployment-admin -- tests/modelValidation.unit.test.ts` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` (repeat for standalone-app / server / electron if touched) |
| Nonreg | `npm run nonreg` |

Vitest exceptions (one sentence each): Slice 0 locks source contracts; Slice 2 is HTTP-handler wiring not expressible as ML; Slice 3 is `handleAction` store-management (no existing MiroirTest `actionTest` for these actionTypes); Slices 4–8 pin UI helpers, source-text mounts, and URL builders that are not Jzod transformers.

---

## Slice 0 — Characterize current gates

**Status:** ⬜ pending

### Goal

Lock today’s contracts so later slices flip them in place (same rule as #270 P1).

### 0.1 RED → GREEN — characterization

**Test:** `packages/miroir-core/tests/1_core/issues/273-process-capability-switches/processCapabilities.273.phase0.unit.test.ts`

Behavior asserted (current world):

- `ActionErrorType` source text does **not** contain `FeatureUnavailable`
- `getMiroirFundamentalJzodSchema` `miroirConfigClient` / `miroirConfigServer` have no `features` key
- `ViewParams.ts` still documents `agents`; Admin Entity `b9765b7c-…` mlSchema has `agents`; seed `441cb6fd-…` has `agents: false`
- `tools.ts` `getClientEnvironment` checks sandbox, then `process.versions.node`, then `electronAPI`
- `ALWAYS_ALLOW_APPLICATION_TARGETS` contains `ADMIN_APPLICATION_UUID`
- `authentication.71.phase0` still pins `monoUserAutentification` unread (do not break that test)
- `server.ts` contains `app.use("/api/copilotkit"` and both MCP mounts (`mountHttpRoutes`, `mcpServer.run`)
- `ipcServerSetup.ts` has no `listen(` / CopilotKit / `mcpServer`

### 0.2 Refactor checkpoint

None. Characterization only.

### Validation

```bash
RUN_TEST=processCapabilities.273.phase0 npm run testByFile -w miroir-core -- processCapabilities.273.phase0
```

### Realization

<Appended on completion.>

---

## Slice 1 — Tracer: snapshot function + FeatureUnavailable

**Status:** ⬜ pending

### Goal

A caller of `getProcessCapabilities` gets the D11/D8/D9 snapshot. `assertProcessCapability` returns `Action2Error` with `FeatureUnavailable`.

**Layers cut:** `ActionErrorType` → `1_core` helpers → functionCallTest / vitest.

### 1.1 RED

**Test:** `processCapabilities.273.phase1.unit.test.ts` (vitest) **and** register `getProcessCapabilities` in `FunctionCallTestRegistry`.

Behavior asserted:

- Missing `features.ai` / `features.mcp` → those booleans false
- Missing `features.designerTools` → true
- `environment === "sandbox"` → `ai` false even if `features.ai === true`
- `availableStoreTypes` unique from map keys `JSON.stringify({ storageType, section })`
- `creatableStoreTypes` = available minus `"bundled"`
- `storeAdministration` true iff admin map has a type other than `"bundled"`
- `assertProcessCapability("mcp", { mcp: false, ... })` → `status: "error"`, `errorType: "FeatureUnavailable"`, `errorContext.capability === "mcp"`

### 1.2 GREEN

Add `"FeatureUnavailable"` to `ActionErrorType` (`DomainElement.ts:171-205`). Add `getProcessCapabilities` / `assertProcessCapability` / `ProcessCapabilities` in `miroir-core` `1_core` (maps as arguments, no `ConfigurationService` import). Export from `index.ts`.

### 1.3 Refactor checkpoint

Consume Slice 0 assertions that `FeatureUnavailable` is absent (update phase0 in place).

### Validation

```bash
RUN_TEST=processCapabilities.273.phase1 npm run testByFile -w miroir-core -- processCapabilities.273.phase1
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 2 — GET /capabilities through RestClientStub

**Status:** ⬜ pending

### Goal

An emulated-server client fetches the snapshot **before login** (auth enabled, no token).

**Layers cut:** Jzod `features` → generated types → HTTP handler → `RestClientStub`.

### 2.1 RED

**Test:** `packages/miroir-core/tests/4_services/issues/273-process-capability-switches/processCapabilitiesHttp.273.phase2.integ.test.ts`

Behavior asserted:

- After `setProcessCapabilities(snapshot)`, `stub.call(..., "GET", "/capabilities")` returns `{ status: "ok", capabilities: snapshot }` with HTTP 200
- The call succeeds when `MIROIR_AUTH_ENABLED=1` and no Authorization header (handler is before `assertRequestAllowed`)
- Unknown path still 401 when auth is on (gate unchanged)

Schema rebuild in GREEN before typecheck.

### 2.2 GREEN

Add optional `features` to `miroirConfigClient` and `miroirConfigServer` (`getMiroirFundamentalJzodSchema.ts:1857-1922`). Rebuild. `handleProcessCapabilitiesHttpRoute` + `setProcessCapabilities` on the stub. Wire the early return **immediately after** the `handleAuthHttpRoute` block (`RestClientStub.ts:74-91`), **before** `:102`. Express ungated mount next to `/auth/status` (`server.ts:263-265`). Startup after factory registration: compute snapshot (or lazy) and `setProcessCapabilities`.

### 2.3 Refactor checkpoint

Consume Slice 0 “no `features` key” assertion. Persistence-side shipped configs that must keep AI/MCP get `features: { ai: true, mcp: true }` here or in Slice 8 — prefer Slice 8 so Slice 2 stays the handler.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=processCapabilitiesHttp.273.phase2 npm run testByFile -w miroir-core -- processCapabilitiesHttp.273.phase2
```

### Realization

<Appended on completion.>

---

## Slice 3 — Store create / admin refuse

**Status:** ⬜ pending

### Goal

`handleAction` refuses illegal create/delete/reset and illegal create types. `openStore` still succeeds when `storeAdministration` is false.

**Layers cut:** `assertProcessCapability` → `DomainController.handleActionInternal` store-management case.

### 3.1 RED

**Test:** `processCapabilitiesStore.273.phase3.integ.test.ts` (emulated IndexedDB or filesystem Admin; real DC).

Behavior asserted:

- Snapshot with `storeAdministration: false`: `storeManagementAction_createStore` / `deleteStore` / `resetAndInitApplicationDeployment` → `FeatureUnavailable` / `storeAdministration`
- Same snapshot: `openStore` / `closeStore` still run (do not assert full success if fixtures are thin — assert they do **not** return `FeatureUnavailable`)
- Snapshot with `creatableStoreTypes: ["indexedDb"]`: `createStore` with `emulatedServerType: "sql"` → `FeatureUnavailable` / `availableStoreTypes`
- `createStore` with `emulatedServerType: "bundled"` always `FeatureUnavailable` / `availableStoreTypes`

### 3.2 GREEN

Inject or read the process snapshot on the persistence-side DC (set at startup next to Slice 2). Check in the store-management branch (`DomainController.ts:3396-3400` area). Composite and MCP paths re-enter `handleAction` — one check covers them.

### 3.3 Refactor checkpoint

Create Application form filter can wait until a later UI slice if this slice only refuses. Prefer also filtering the Jzod union in Slice 3 GREEN if the runner is already in the test stack — otherwise Slice 3 refuse + Slice 8/docs mention the picker. **Do the picker filter in this slice** (`Runner_CreateApplication.tsx` union from `creatableStoreTypes`) so Goal 1 is visible.

Picker test (standalone, same slice if small): form schema enum equals snapshot `creatableStoreTypes`.

### Validation

```bash
RUN_TEST=processCapabilitiesStore.273.phase3 npm run testByFile -w miroir-core -- processCapabilitiesStore.273.phase3
```

### Realization

<Appended on completion.>

---

## Slice 4 — AI hide, no bundle, drop ViewParams.agents

**Status:** ⬜ pending

### Goal

When `ai` is false the process does not mount CopilotKit and the UI has no Agents switch / AI icons. `ViewParams.agents` is gone.

**Layers cut:** snapshot → `server.ts` mount → AppBar / Settings / RootComponent → Admin Entity + seed.

### 4.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/273-process-capability-switches/processCapabilitiesAi.273.phase4.unit.test.ts` plus Admin `modelValidation`.

Behavior asserted:

- Extracted `shouldMountCopilotKitRoute(ai: boolean)` is false when `ai` is false (used by `server.ts`)
- `authentication.71.phase6` still finds the `app.use("/api/copilotkit"` **string** but the mount is inside `if (capabilities.ai)` — update that test to assert the gate
- Settings page source no longer contains the Agents switch label
- AppBar `showAgentUi` is snapshot `ai`, not `viewParams.agents && !MIROIR_IS_SANDBOX`
- Admin Entity mlSchema and seed `441cb6fd-…` have **no** `agents` field (same commit, R9)
- `ViewParams.ts` has no `agents`

### 4.2 GREEN

Gate `server.ts:826-841`. RootComponent / AppBar / Settings read snapshot. Delete `agents` from `ViewParams.ts`, Entity mlSchema, seed. Keep #244 lazy `import()` of `AgentsCopilotKit` when `ai` and first open.

### 4.3 Refactor checkpoint

Consume Slice 0 agents / CopilotKit-unconditional assertions. Rebuild admin package if Entity JSON changed.

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-admin -- tests/modelValidation.unit.test.ts
RUN_TEST=processCapabilitiesAi.273.phase4 npm run testByFile -w miroir-standalone-app -- processCapabilitiesAi.273.phase4
RUN_TEST=authentication.71.phase6 npm run testByFile -w miroir-core -- authentication.71.phase6
```

### Realization

<Appended on completion.>

---

## Slice 5 — MCP refuse and mounts

**Status:** ⬜ pending

### Goal

`mcp` false: no HTTP MCP on the main app or the dedicated port; `runMcpToolRunner` returns `FeatureUnavailable` without fetching.

**Layers cut:** snapshot → `server.ts:823` + `:925-926` → `runMcpToolRunner.ts`.

### 5.1 RED

**Test:** `processCapabilitiesMcp.273.phase5.unit.test.ts` (standalone + core source-text).

Behavior asserted:

- `runMcpToolRunner` with `mcp: false` returns `errorType: "FeatureUnavailable"`, `errorContext.capability === "mcp"`, and does not call `fetch` (inject fetch or spy the helper’s first line)
- Extracted `shouldMountMcpHttp(mcp)` false skips both mounts
- `mcpToolRunner.253.phase0` vite-proxy test still lists `/mcp`; add that mount is gated

### 5.2 GREEN

Check at the top of `runMcpToolRunner`. Gate both `server.ts` mounts. Electron MCP URL is Slice 8; this slice uses the snapshot only.

### 5.3 Refactor checkpoint

Consume Slice 0 “unconditional MCP mounts”.

### Validation

```bash
RUN_TEST=processCapabilitiesMcp.273.phase5 npm run testByFile -w miroir-standalone-app -- processCapabilitiesMcp.273.phase5
```

### Realization

<Appended on completion.>

---

## Slice 6 — Designer tools

**Status:** ⬜ pending

### Goal

Bulb hidden when config is off, or when auth is on and the user has no explicit Admin grant. Leftover `sessionStorage.showModelTools` does not win. Transformer Builder follows designer tools.

**Layers cut:** `hasAccess(..., alwaysAllow: [])` → AppBar / context → Builder menu item.

### 6.1 RED

**Test:** `processCapabilitiesDesigner.273.phase6.unit.test.ts`

Behavior asserted:

- Helper `isDesignerToolsVisible({ designerTools, authEnabled, principal, grants })`:
  - `designerTools: false` → false regardless of grants
  - `designerTools: true`, auth off → true
  - `designerTools: true`, auth on, Carol no Admin grant → false
  - `designerTools: true`, auth on, Alice Admin grant, `alwaysAllow: []` → true
  - `designerTools: true`, auth on, principal with **only** always-allow semantics (no grant row) → false
- When not visible, `showModelTools` is forced false (helper or provider test)
- Transformer Builder item is included iff designer tools visible, not iff `ai`

### 6.2 GREEN

`useAuthSession` + Admin `MiroirRight` rows. AppBar bulb render + `setShowModelTools` forced off. Move Builder off `showAgentUi` (`AppBar.tsx:346`).

### 6.3 Refactor checkpoint

Sidebar already follows `showModelTools` (`Sidebar.tsx:105-108`). Do not change Admin always-listed except via forced-off flag.

### Validation

```bash
RUN_TEST=processCapabilitiesDesigner.273.phase6 npm run testByFile -w miroir-standalone-app -- processCapabilitiesDesigner.273.phase6
```

### Realization

<Appended on completion.>

---

## Slice 7 — Versioning icon

**Status:** ⬜ pending

### Goal

Versioning AppBar item is shown only when the **current** application’s `resolveVersioningMode` is `versioned-internal`.

**Layers cut:** `versioningMode.ts` → AppBar.

### 7.1 RED

**Test:** `processCapabilitiesVersioning.273.phase7.unit.test.ts` (extend patterns from `AppBarVersioning.unit.test.ts` if present).

Behavior asserted:

- `unversioned` / `versioned-external` → item absent
- `versioned-internal` / legacy `versioningEnabled: true` → item present
- Freeze still throws via `assertApplicationVersioningEnabled` (existing tests remain)

### 7.2 GREEN

Filter the Versioning `miroirMenuReportLink` (`AppBar.tsx:373-386`) from the current app’s self-application row.

### 7.3 Refactor checkpoint

Do not put versioning on the process snapshot.

### Validation

```bash
RUN_TEST=processCapabilitiesVersioning.273.phase7 npm run testByFile -w miroir-standalone-app -- processCapabilitiesVersioning.273.phase7
```

### Realization

<Appended on completion.>

---

## Slice 8 — Electron loopback + persistence-side config patches

**Status:** ⬜ pending

### Goal

When Electron `features.ai` / `mcp` is true, the renderer talks to a loopback HTTP base, not `app://` / `window.location.origin`. Shipped persistence-side configs that should keep AI/MCP set the flags.

**Layers cut:** `electronServerConfig` → loopback listen helper → renderer URL helper → config JSON.

### 8.1 RED

**Test:** `processCapabilitiesElectron.273.phase8.unit.test.ts`

Behavior asserted:

- `electronRuntimeBaseUrl(serverConfig)` is an `http(s)://127.0.0.1|localhost:...` URL derived from `rootApiUrl`, never `app://`
- `copilotRuntimeUrl(env, base)` is `${base}/api/copilotkit` when `env === "electron"`, else `"/api/copilotkit"`
- `browserMcpServerUrl` uses the same base on Electron
- `electronServerConfig` in source has `features: { ai: true, mcp: true, designerTools: true }`
- Renderer `electronMiroirConfig` still has **no** `features` (R7)
- Persistence-side server JSON (`miroirConfig.server.json`, docker variant) has `features.ai/mcp` true for the shipped product
- Sandbox client config / sandbox define still forces `ai` false

### 8.2 GREEN

Loopback listen in main when flags are true (extracted function so `miroir-server` test gap does not block). Point `AgentsCopilotKit` and `runMcpToolRunner` at the helper. Patch persistence-side product configs only.

### 8.3 Refactor checkpoint

`mcpToolRunner.253.phase0` proxy list may stay; Electron no longer depends on Vite proxy for CopilotKit.

### Validation

```bash
RUN_TEST=processCapabilitiesElectron.273.phase8 npm run testByFile -w miroir-standalone-app -- processCapabilitiesElectron.273.phase8
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app-electron/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 9 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 9.1 Nonreg

- Add `unit-273-process-capabilities` to `scripts/nonreg-manifest.json` (tier `unit`) running the phase0–8 file glob.

### 9.2 Docs

- `analysis.md` status → implemented when slices 1–8 are DONE (not before).
- `docs/internals/code-splitting.md`: AI chunk gated by snapshot `ai`, not `ViewParams.agents`.
- `docs/reference/data-architecture-deployments.md`: `features` on persistence-side config; sandbox veto; Electron loopback.

### 9.3 Issue-directory cleanup

- After the suite is stable, migrate still-valuable assertions into feature-named files and delete `issues/273-process-capability-switches/` per `docs/contributing/testing.md` (#238). May stay until the first green nonreg if cleanup would hide history — then do it in this slice.

### 9.4 Tracer bullet (narrative)

1. Start emulated IndexedDB (or sandbox).
2. `GET /capabilities` before login → `ai: false` in sandbox, store types bundled+indexedDb, `creatableStoreTypes` without bundled.
3. Create Application does not offer bundled or sql.
4. Flip a persistence-side file to `features.ai: true`, restart a real-server web process, Settings has no Agents row, AppBar shows AI only if snapshot `ai` is true.
5. Auth on, user without Admin grant: no bulb. Leftover session cannot open model tools.

Automated equivalent: Slices 1–7 tests.

### AC checklist (#273)

| Criterion | Proven by | Status |
|---|---|---|
| `features` on client and server schemas | Slice 2 rebuild + types | ⬜ |
| Missing `ai`/`mcp` false; missing `designerTools` true | Slice 1 | ⬜ |
| Sandbox forces `ai` false | Slice 1 | ⬜ |
| `getProcessCapabilities` + GET once, HTTP/IPC | Slices 1–2 | ⬜ |
| Snapshot fields including derived store types | Slice 1 | ⬜ |
| Hide and refuse same check; `FeatureUnavailable` | Slices 1, 3, 5 | ⬜ |
| `ViewParams.agents` removed | Slice 4 + modelValidation | ⬜ |
| `ai` false: no chunk, no mount, no Settings row, no icons | Slice 4 | ⬜ |
| `mcp` false: no mounts, no runner fetch | Slice 5 | ⬜ |
| Create Application / store-admin follow snapshot | Slice 3 | ⬜ |
| Versioning icon follows application mode | Slice 7 | ⬜ |
| Bulb + explicit Admin grant + force off + Builder | Slice 6 | ⬜ |
| Electron same capacity + loopback transport | Slice 8 | ⬜ |
| `emulatedServer` is transport only | Slices 1–2 (stub) | ⬜ |
| `deploymentMode` not revived | Slice 0 + 9 docs | ⬜ |

### Validation

```bash
npm run nonreg
```

### Realization

<Appended on completion.>
