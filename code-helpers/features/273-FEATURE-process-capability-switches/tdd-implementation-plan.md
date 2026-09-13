# Issue #273. TDD implementation plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Tests exercise the real DomainController, local cache, and emulated server (`RestClientStub`)
> plus the public helpers `getProcessCapabilities` / `assertProcessCapability` /
> `fetchProcessCapabilities`. No mocks. `miroir-server` and Electron main have no test suite.
> CopilotKit/MCP mount gating, Electron URL builders, and the loopback-listen *decision*
> are vitest against extracted functions in `miroir-core` `4_services` (same exception as
> #267 `parseServerArgs` / #270 `SecretsService`). The listen call itself stays in
> `ipcServerSetup.ts` / `main.ts` and is pinned by source-text.
> Tracer (Slice 1→2): a persistence-side snapshot computed from config + factories is
> returned by `GET /capabilities` through `RestClientStub` before login, then stored on
> React context for later hide/refuse slices.
>
> **Execution model:** implement immediately; commit after each slice once Validation is
> green and Realization is appended. Stop only on unforeseen gaps that need external
> input. Not finished until compilation and `npm run nonreg` pass. Slices themselves
> contain no commit checklist lines.

Analysis: [`./analysis.md`](./analysis.md) · Analysis review: [`./adversarial-review.md`](./adversarial-review.md) · Plan review: [`./plan-adversarial-review.md`](./plan-adversarial-review.md) · Issue: https://github.com/miroir-framework/miroir/issues/273
Working branch: `273-FEATURE-process-capability-switches`

**Resume note:** Slices 0 to 4 DONE. Implementing remaining slices.

---

## Plan-review repairs (binding)

From [`./plan-adversarial-review.md`](./plan-adversarial-review.md). Product decisions D1 to D15 are unchanged.

| ID | Repair |
|---|---|
| P1 | Slice 2 delivers the snapshot to the UI. `setupMiroirPlatform` / sandbox index call `fetchProcessCapabilities(restClient)` after the client exists and return the snapshot. `startWebApp` passes it to `MiroirContextReactProvider` next to `clientEnvironment`. RED reads it from context. Source-text: no `4_view` / Electron renderer module imports `getProcessCapabilities`. AC row added. |
| P2 | Named seam: `DomainControllerInterface.setProcessCapabilities(snapshot)`. Production startup sets it after factory registration (may recompute lazily if unset). Tests call it on `domainControllerForServer` from `setupMiroirTest`. The store-management check at `DomainController.ts:3396-3400` reads the injected field. Store-refuse test lives in standalone-app so that DC exists. |
| P3 | Create Application picker is its own slice (Slice 4) with a standalone-app test and Validation command. Slice 3 is refuse only. |
| P4 | Allocate Alice→Admin `MiroirRight` `86a73f7e-17f8-462d-8203-af1f323a7cdc`. Slice 0 locks its absence. Slice 7 GREEN adds the seed + admin `index.ts` / `index.d.ts`. Helper RED uses Carol (seeded, zero grants) and an Alice grant object matching that uuid. Production grants come from `useApplicationAccess()`. |
| P5 | Versioning icon visibility uses the **browsed** SelfApplication (`context.toolsPageState?.applicationSelector`). No selector → hide. `AppBarVersioning.unit.test.ts` navigation (always Miroir) is kept, not flipped. |
| P6 | URL / mount helpers live in `miroir-core` `4_services`. Slice 9 RED consumes the Slice 0 "no `listen(`" assertion into the gated-listen form. |
| P7 | Patch `miroirConfig.server.json` and `miroirConfig.server.docker.json` in Slice 2 GREEN (`ai`/`mcp` true). Slice 9 keeps Electron main + remaining profiles. |
| P8 | Slice 1 is vitest only. Drop `FunctionCallTestRegistry`. Justification below. |
| P9 | MCP RED injects a throwing `fetchImpl`. Assert `FeatureUnavailable`, not `FailedToHandleAction`. New `capabilities` argument. `RunnerView.tsx:465-469` updated. Re-run `mcpToolRunner.253.phase0`. |
| P10 | Slice 9 consumes Slice 0 `ipcServerSetup.ts` assertions. Allocated dirs include `1_core`, `4_services`, `3_controllers`, and standalone `4_view`. |
| P11 | Two nonreg steps: `unit-273-process-capabilities` (core + standalone unit) and `appstack-273-process-capabilities` (store-refuse integ, `{profile}`). |
| P12 | Stub call is `stub.get("/capabilities", "/capabilities")` or `stub.call("/capabilities", "get", "/capabilities")`. Handler matches `rawUrl`. |
| P13 | Say "same slice", not "same commit". R9 is tree-level at `modelValidation` time. |

---

## Scope

- Root `features` on persistence-side `miroirConfig` (`ai`, `mcp`, `designerTools`).
- `ProcessCapabilities` + `getProcessCapabilities` + `assertProcessCapability` in `miroir-core` `1_core`.
- `GET /capabilities` via `handleProcessCapabilitiesHttpRoute` in `RestClientStub` (before auth gate), express (ungated), Electron IPC `rest-call`.
- UI copy: one `fetchProcessCapabilities` through the environment `RestClientInterface`, stored on React context.
- Hide + refuse for `ai`, `mcp`, `creatableStoreTypes`, `storeAdministration`, `designerTools`. Versioning icon uses `resolveVersioningMode` on the browsed application.
- Remove `ViewParams.agents` (schema + seed in the same slice).
- Electron loopback HTTP when `ai`/`mcp` true. Renderer uses absolute loopback URLs.

This plan does **not** add undo/redo/commit capabilities, debug overlays as flags, a new designer role (#219 C2), `#193` LLM product work, or revive `deploymentMode`.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize current gates / inventories | ✅ | `processCapabilities.273.phase0.unit.test.ts` |
| 1 | **Tracer:** `getProcessCapabilities` + `FeatureUnavailable` | ✅ | `processCapabilities.273.phase1.unit.test.ts` |
| 2 | `GET /capabilities` + UI context + shipped server flags | ✅ | `processCapabilitiesHttp.273.phase2.integ.test.ts` + context unit |
| 3 | Store create/admin refuse in `handleActionInternal` | ✅ | `processCapabilitiesStore.273.phase3.integ.test.ts` |
| 4 | Create Application picker follows `creatableStoreTypes` | ✅ | `processCapabilitiesPicker.273.phase4.unit.test.ts` |
| 5 | AI hide + no CopilotKit mount + drop `ViewParams.agents` | ⬜ | `processCapabilitiesAi.273.phase5.unit.test.ts` + Admin `modelValidation` |
| 6 | MCP refuse in `runMcpToolRunner` + both server mounts | ⬜ | `processCapabilitiesMcp.273.phase6.unit.test.ts` |
| 7 | Designer bulb + Alice Admin grant + Transformer Builder | ⬜ | `processCapabilitiesDesigner.273.phase7.unit.test.ts` |
| 8 | Versioning AppBar follows browsed-app `resolveVersioningMode` | ⬜ | `processCapabilitiesVersioning.273.phase8.unit.test.ts` |
| 9 | Electron loopback listen + remaining config patches | ⬜ | `processCapabilitiesElectron.273.phase9.unit.test.ts` |
| 10 | Nonreg, docs, cleanup, AC | ⬜ | `unit-273-process-capabilities` + `appstack-273-process-capabilities` |

---

## Locked implementation defaults

From [`./analysis.md`](./analysis.md) D1 to D15 + R1 to R12. Binding. Deviations go in Realization.

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

No new Entity / Report / Runner / MiroirTest suite.

| Artefact | Value |
|---|---|
| Alice→Admin `MiroirRight` | `86a73f7e-17f8-462d-8203-af1f323a7cdc` in `admin_data/a6136fc7-949b-4d64-9f13-dd3afce1ab3c/` (`miroirUser` Alice `1c39328c-…`, `targetUuid` Admin `55af124e-…`, `capability: "admin"`) |
| Core unit dir | `packages/miroir-core/tests/1_core/issues/273-process-capability-switches/` |
| Core HTTP dir | `packages/miroir-core/tests/4_services/issues/273-process-capability-switches/` |
| Standalone integ dir | `packages/miroir-standalone-app/tests/3_controllers/issues/273-process-capability-switches/` |
| Standalone view dir | `packages/miroir-standalone-app/tests/4_view/issues/273-process-capability-switches/` |
| Nonreg steps | `unit-273-process-capabilities` (tier `unit`), `appstack-273-process-capabilities` (tier `default`) |

Helper homes (all importable from electron main and from tests):

| Symbol | Home |
|---|---|
| `ProcessCapabilities`, `getProcessCapabilities`, `assertProcessCapability` | `packages/miroir-core/src/1_core/processCapabilities.ts` |
| `handleProcessCapabilitiesHttpRoute`, `fetchProcessCapabilities` | `packages/miroir-core/src/4_services/ProcessCapabilitiesHttp.ts` |
| `shouldMountCopilotKitRoute`, `shouldMountMcpHttp`, `shouldListenLoopbackHttp`, `electronRuntimeBaseUrl`, `copilotRuntimeUrl`, `browserMcpServerUrl` | `packages/miroir-core/src/4_services/processCapabilityRoutes.ts` |
| `isDesignerToolsVisible` | next to `AccessPolicy.ts` or `processCapabilities.ts` |
| `isVersioningAppBarItemVisible` | next to `versioningMode.ts` |

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

Vitest exceptions (one sentence each). Slice 0 locks source contracts that are not ML. Slice 1 is a pure TS helper whose factory-map arguments are not a Jzod transformer (same exception as #267 `parseServerArgs` / #270 `SecretsService`; no new MiroirTest asset). Slice 2 is HTTP-handler and React-context wiring. Slice 3 is `handleAction` store-management (no existing MiroirTest `actionTest` for these actionTypes). Slice 4 is a TSX runner schema helper. Slices 5 to 9 pin UI helpers, source-text mounts, URL builders, and the Electron listen string.

---

## Slice 0. Characterize current gates

**Status:** ✅ DONE

### Goal

Lock today’s contracts so later slices flip them in place (same rule as #270 P1).

### 0.1 RED → GREEN. characterization

**Test:** `packages/miroir-core/tests/1_core/issues/273-process-capability-switches/processCapabilities.273.phase0.unit.test.ts`

Behavior asserted (current world):

- `ActionErrorType` source text does **not** contain `FeatureUnavailable`
- `getMiroirFundamentalJzodSchema` `miroirConfigClient` / `miroirConfigServer` have no `features` key
- `packages/miroir-server/config/miroirConfig.server.json` and `miroirConfig.server.docker.json` have no `features` key
- `ViewParams.ts` still documents `agents`; Admin Entity `b9765b7c-…` mlSchema has `agents`; seed `441cb6fd-…` has `agents: false`
- `tools.ts` `getClientEnvironment` checks sandbox, then `process.versions.node`, then `electronAPI`
- `ALWAYS_ALLOW_APPLICATION_TARGETS` contains `ADMIN_APPLICATION_UUID`
- Admin data has **no** `MiroirRight` with `miroirUser` Alice (`1c39328c-…`) and `targetUuid` `ADMIN_APPLICATION_UUID`. Uuid `86a73f7e-…` is unused.
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

Characterization test at `packages/miroir-core/tests/1_core/issues/273-process-capability-switches/processCapabilities.273.phase0.unit.test.ts`. 11 tests green. ViewParams seed is under `admin_data/b9765b7c-…/` (same uuid as the Entity). `miroirConfigServer` schema block is sliced until the next `miroirConfig:` key. No production code changed.

---

## Slice 1. Tracer: snapshot function + FeatureUnavailable

**Status:** ✅ DONE

### Goal

A caller of `getProcessCapabilities` gets the D11/D8/D9 snapshot. `assertProcessCapability` returns `Action2Error` with `FeatureUnavailable`.

**Layers cut:** `ActionErrorType` → `1_core` helpers.

### 1.1 RED

**Test:** `packages/miroir-core/tests/1_core/issues/273-process-capability-switches/processCapabilities.273.phase1.unit.test.ts`

Do **not** register `getProcessCapabilities` in `FunctionCallTestRegistry`.

Behavior asserted:

- Missing `features.ai` / `features.mcp` → those booleans false
- Missing `features.designerTools` → true
- `environment === "sandbox"` → `ai` false even if `features.ai === true`
- `availableStoreTypes` unique from map keys `JSON.stringify({ storageType, section })`
- `creatableStoreTypes` = available minus `"bundled"`
- `storeAdministration` true iff admin map has a type other than `"bundled"`
- `assertProcessCapability("mcp", { mcp: false, ... })` → `status: "error"`, `errorType: "FeatureUnavailable"`, `errorContext.capability === "mcp"`

### 1.2 GREEN

Add `"FeatureUnavailable"` to `ActionErrorType` (`DomainElement.ts:171-205`). Add `getProcessCapabilities` / `assertProcessCapability` / `ProcessCapabilities` in `packages/miroir-core/src/1_core/processCapabilities.ts` (maps as arguments, no `ConfigurationService` import). Export from `index.ts`.

### 1.3 Refactor checkpoint

Consume Slice 0 assertions that `FeatureUnavailable` is absent (update phase0 in place).

### Validation

```bash
RUN_TEST=processCapabilities.273.phase0 npm run testByFile -w miroir-core -- processCapabilities.273.phase0
RUN_TEST=processCapabilities.273.phase1 npm run testByFile -w miroir-core -- processCapabilities.273.phase1
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

`getProcessCapabilities` / `assertProcessCapability` in `packages/miroir-core/src/1_core/processCapabilities.ts`. Maps are arguments (`ReadonlyMap` or factory-register types). `availableStoreTypes` on `assertProcessCapability` is treated as always allowed this slice. Phase0 now asserts `FeatureUnavailable` is present. `npm run build -w miroir-core` so tests can import from the package. phase0 11/11, phase1 9/9, tsc clean.

---

## Slice 2. GET /capabilities, UI copy, shipped server flags

**Status:** ✅ DONE

### Goal

An emulated-server client fetches the snapshot **before login** (auth enabled, no token). The UI holds that copy on React context. The shipped `miroir-server` configs keep AI/MCP on so later mount gates do not silently disable the documented dev server.

**Layers cut:** Jzod `features` → generated types → HTTP handler → `RestClientStub` → `fetchProcessCapabilities` → `MiroirContextReactProvider` → shipped server JSON.

This is one transport story (D12). Two RED files.

### 2.1 RED

**Test A:** `packages/miroir-core/tests/4_services/issues/273-process-capability-switches/processCapabilitiesHttp.273.phase2.integ.test.ts`

Behavior asserted:

- After `setProcessCapabilities(snapshot)` on the stub, `stub.get("/capabilities", "/capabilities")` (or `stub.call("/capabilities", "get", "/capabilities")`) returns `{ status: "ok", capabilities: snapshot }` with HTTP 200. Handler matching is `h.url == rawUrl`.
- The call succeeds when `MIROIR_AUTH_ENABLED=1` and no Authorization header (handler is before `assertRequestAllowed`)
- Unknown path still 401 when auth is on (gate unchanged)

**Test B:** `packages/miroir-standalone-app/tests/4_view/issues/273-process-capability-switches/processCapabilitiesContext.273.phase2.unit.test.ts`

Behavior asserted:

- `fetchProcessCapabilities(stub)` returns the snapshot Test A stored
- A `MiroirContextReactProvider` given that snapshot exposes `useMiroirContextService().processCapabilities` equal to it (RTL render, same pattern as other `4_view` tests)
- Source text: no file under `packages/miroir-standalone-app/src/miroir-fwk/4_view` imports `getProcessCapabilities`. No Electron renderer module does either (R11). Startup files may call `fetchProcessCapabilities` only.

Schema rebuild in GREEN before typecheck.

### 2.2 GREEN

Add optional `features` to `miroirConfigClient` and `miroirConfigServer` (`getMiroirFundamentalJzodSchema.ts:1857-1922`). Rebuild.

`handleProcessCapabilitiesHttpRoute` + stub `setProcessCapabilities` in `ProcessCapabilitiesHttp.ts`. Wire the early return **immediately after** the `handleAuthHttpRoute` block (`RestClientStub.ts:74-91`), **before** `:102`. Express ungated mount next to `/auth/status` (`server.ts:263-265`).

`fetchProcessCapabilities(client: RestClientInterface)` calls `client.get("/capabilities", "/capabilities")`.

Startup after factory registration:

1. Compute snapshot with `getProcessCapabilities` (or lazy in the handler, R11).
2. `setProcessCapabilities` on the stub **and** on the persistence-side DC (Slice 3 reads the DC field; set it here so production is not unset).
3. UI: `setupMiroirPlatform` / `setupClient` / sandbox index call `fetchProcessCapabilities(restClient)` **after** the client exists (`index.tsx:396` for Electron’s `ElectronRestClient`; emulateServer uses the in-process stub). Return the snapshot. `startWebApp` passes it into `MiroirContextReactProvider`. Return `restClient` from `setupMiroirPlatform` if that is the least change that makes the fetch reachable.

Patch `packages/miroir-server/config/miroirConfig.server.json` and `miroirConfig.server.docker.json` with `features: { ai: true, mcp: true }` (designerTools omitted, default true). Do **not** patch Electron main or test profiles here.

### 2.3 Refactor checkpoint

Consume Slice 0 “no `features` key” on the Jzod schemas **and** on the two shipped server JSON files. Export new symbols from miroir-core `index.ts`.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=processCapabilities.273.phase0 npm run testByFile -w miroir-core -- processCapabilities.273.phase0
RUN_TEST=processCapabilitiesHttp.273.phase2 npm run testByFile -w miroir-core -- processCapabilitiesHttp.273.phase2
RUN_TEST=processCapabilitiesContext.273.phase2 npm run testByFile -w miroir-standalone-app -- processCapabilitiesContext.273.phase2
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

Ungated `GET /capabilities` on `RestClientStub` (before auth gate) and Express. `fetchProcessCapabilities` plus `MiroirContextReactProvider.processCapabilities` (fail-closed default if omitted). Shipped server JSON has `features.ai/mcp` true. Phase0 now expects the `features` key. Electron main stub is set in `ipcServerSetup` after factories so IPC GET is not fail-closed empty. `FAIL_CLOSED_PROCESS_CAPABILITIES` is exported and reused. DC setter still Slice 3. Electron `features` flags still Slice 9. phase0 11/11, HTTP 3/3, context 3/3, tsc clean.

---

## Slice 3. Store create / admin refuse

**Status:** ✅ DONE

### Goal

`handleAction` refuses illegal create/delete/reset and illegal create types. `openStore` still runs when `storeAdministration` is false.

**Layers cut:** `assertProcessCapability` → `DomainController.handleActionInternal` store-management case.

### 3.1 RED

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/273-process-capability-switches/processCapabilitiesStore.273.phase3.integ.test.ts`

Use `setupMiroirTest` (emulated filesystem or IndexedDB Admin). Call `domainControllerForServer.setProcessCapabilities(...)` **before** `handleAction`. Do not rely on live factory maps. `ConfigurationService` has register but no unregister (`ConfigurationService.ts:51-72`); the integ stack registers all four factories, so a lazily computed snapshot can never yield `storeAdministration: false`.

Behavior asserted:

- Snapshot with `storeAdministration: false`: `storeManagementAction_createStore` / `deleteStore` / `resetAndInitApplicationDeployment` → `FeatureUnavailable` / `storeAdministration`
- Same snapshot: `openStore` / `closeStore` do **not** return `FeatureUnavailable` (do not assert full success if the store data is thin)
- Snapshot with `creatableStoreTypes: ["indexedDb"]`: `createStore` with `emulatedServerType: "sql"` → `FeatureUnavailable` / `availableStoreTypes`
- `createStore` with `emulatedServerType: "bundled"` always `FeatureUnavailable` / `availableStoreTypes`

### 3.2 GREEN

Add `setProcessCapabilities(snapshot: ProcessCapabilities): void` to `DomainControllerInterface` and `DomainController`. The store-management branch (`DomainController.ts:3396-3400`) reads that field. If unset, compute once from `miroirContext` config + `ConfigurationService` maps (production safety net). Tests always inject.

Composite and MCP paths re-enter `handleAction` (`:3745-3749`, `:4882-4886`). One check covers REST, composite, and in-process MCP.

Startup already sets the field in Slice 2. No second compute API.

### 3.3 Refactor checkpoint

Picker filter is Slice 4, not this slice.

### Validation

```bash
RUN_TEST=processCapabilitiesStore.273.phase3 npm run testByFile -w miroir-standalone-app -- processCapabilitiesStore.273.phase3
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

`DomainControllerInterface.setProcessCapabilities` plus check at the store-management case. create/delete/reset require `storeAdministration`. createStore walks `emulatedServerType` and refuses missing types or `bundled` (`availableStoreTypes`). open/close skip both checks. Tests inject on `domainControllerForServer` (`setupMiroirTest`, filesystem profile). Unset field lazy-computes from config + maps. Type refusal builds `Action2Error` directly because Slice 1's `assertProcessCapability("availableStoreTypes")` is still always-allowed. 4/4 integ, tsc clean.

---

## Slice 4. Create Application picker

**Status:** ✅ DONE

### Goal

The Create Application storage-type union lists only `creatableStoreTypes`. `bundled` never appears.

**Layers cut:** context snapshot → `Runner_CreateApplication.tsx` schema.

### 4.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/273-process-capability-switches/processCapabilitiesPicker.273.phase4.unit.test.ts`

Behavior asserted:

- `buildCreateApplicationStorageSchema(["indexedDb"])` context has only the IndexedDB variant. No `sql`, `filesystem`, `mongodb`, `bundled`.
- `buildCreateApplicationStorageSchema(["indexedDb", "sql"])` includes those two only.
- `bundled` is dropped even if passed in.

### 4.2 GREEN

Extract `buildCreateApplicationStorageSchema(creatableStoreTypes: StorageType[])` from `Runner_CreateApplication.tsx:70-108`. The runner reads `creatableStoreTypes` from `useMiroirContextService().processCapabilities` (Slice 2 field).

### 4.3 Refactor checkpoint

None beyond the extraction.

### Validation

```bash
RUN_TEST=processCapabilitiesPicker.273.phase4 npm run testByFile -w miroir-standalone-app -- processCapabilitiesPicker.273.phase4
```

### Realization

`buildCreateApplicationStorageSchema` in a sibling `.ts` next to the runner. Context keys follow `creatableStoreTypes`; `bundled` is dropped. Live form schema is rebuilt from `context.processCapabilities.creatableStoreTypes`. Empty list yields empty context / empty concatLists. SQL/mongo connection-string gates stay only for types that remain. 3/3 unit tests.

---

## Slice 5. AI hide, no bundle, drop ViewParams.agents

**Status:** ✅ DONE

### Goal

When `ai` is false the process does not mount CopilotKit and the UI has no Agents switch / AI icons. `ViewParams.agents` is gone.

**Layers cut:** snapshot → `shouldMountCopilotKitRoute` → `server.ts` mount → AppBar / Settings / RootComponent → Admin Entity + seed.

### 5.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/273-process-capability-switches/processCapabilitiesAi.273.phase5.unit.test.ts` plus Admin `modelValidation`.

Behavior asserted:

- `shouldMountCopilotKitRoute(false)` is false (used by `server.ts`)
- `authentication.71.phase6` still finds the `app.use("/api/copilotkit"` **string** but the mount is inside `if (shouldMountCopilotKitRoute(capabilities.ai))`. Update that test to assert the gate.
- Settings page source no longer contains the Agents switch label
- AppBar `showAgentUi` is snapshot `ai`, not `viewParams.agents && !MIROIR_IS_SANDBOX`
- Admin Entity mlSchema and seed `441cb6fd-…` have **no** `agents` field (same slice, R9)
- `ViewParams.ts` has no `agents`

### 5.2 GREEN

Home `shouldMountCopilotKitRoute` in `processCapabilityRoutes.ts`. Gate `server.ts:826-841`. RootComponent / AppBar / Settings read `processCapabilities` from context. Delete `agents` from `ViewParams.ts`, Entity mlSchema, and seed in this slice. Keep #244 lazy `import()` of `AgentsCopilotKit` when `ai` and first open.

### 5.3 Refactor checkpoint

Consume Slice 0 agents / CopilotKit-unconditional assertions. Rebuild admin package if Entity JSON changed.

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-admin -- tests/modelValidation.unit.test.ts
RUN_TEST=processCapabilitiesAi.273.phase5 npm run testByFile -w miroir-standalone-app -- processCapabilitiesAi.273.phase5
RUN_TEST=authentication.71.phase6 npm run testByFile -w miroir-core -- authentication.71.phase6
RUN_TEST=processCapabilities.273.phase0 npm run testByFile -w miroir-core -- processCapabilities.273.phase0
```

### Realization

`shouldMountCopilotKitRoute(ai)` in `processCapabilityRoutes.ts` is `ai === true`. `server.ts` computes the snapshot at the CopilotKit mount and wraps both `/api/copilotkit` uses. RootComponent latch and AppBar `agentsEnabled` prop now take `context.processCapabilities.ai`; Settings Agents switch is gone. `agents` removed from `ViewParams.ts`, Admin Entity mlSchema, and seed `441cb6fd-…` in this slice. Slice 0 agents assertions flipped to absent; CopilotKit string remains but is gated. #244 lazy `import()` of AgentsCopilotKit kept. 6/6 phase5, 3/3 auth phase6, 11/11 phase0, 52/52 modelValidation.

---

## Slice 6. MCP refuse and mounts

**Status:** ✅ DONE

### Goal

`mcp` false: no HTTP MCP on the main app or the dedicated port; `runMcpToolRunner` returns `FeatureUnavailable` without fetching.

**Layers cut:** snapshot → `shouldMountMcpHttp` → `server.ts:823` + `:925-926` → `runMcpToolRunner.ts` → `RunnerView.tsx:465-469`.

### 6.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/273-process-capability-switches/processCapabilitiesMcp.273.phase6.unit.test.ts`

Behavior asserted:

- `runMcpToolRunner(..., serverUrl, { mcp: false }, throwingFetch)` returns `status: "error"`, `error.type === "FeatureUnavailable"`, capability `"mcp"`. The error is **not** `FailedToHandleAction`. `throwingFetch` must not run.
- `shouldMountMcpHttp(false)` is false (both mounts)
- `mcpToolRunner.253.phase0` still lists `/mcp` in the vite proxy; update it to assert the mount is gated

`runMcpToolRunner` already takes `fetchImpl?: McpHttpFetch` (`runMcpToolRunner.ts:14`). Use it. Do not spy.

### 6.2 GREEN

Add argument `capabilities: Pick<ProcessCapabilities, "mcp">` (before `fetchImpl`). Check at the top of `runMcpToolRunner`. `RunnerView.tsx:465-469` passes `context.processCapabilities`. If the envelope is `FeatureUnavailable`, wrap as `Action2Error` with `errorContext.capability: "mcp"`, not `FailedToHandleAction`.

Home `shouldMountMcpHttp` in `processCapabilityRoutes.ts`. Gate both `server.ts` mounts. Electron MCP URL is Slice 9.

### 6.3 Refactor checkpoint

Consume Slice 0 “unconditional MCP mounts”.

### Validation

```bash
RUN_TEST=processCapabilitiesMcp.273.phase6 npm run testByFile -w miroir-standalone-app -- processCapabilitiesMcp.273.phase6
RUN_TEST=mcpToolRunner.253.phase0 npm run testByFile -w miroir-standalone-app -- mcpToolRunner.253.phase0
RUN_TEST=processCapabilities.273.phase0 npm run testByFile -w miroir-core -- processCapabilities.273.phase0
```

### Realization

`shouldMountMcpHttp(mcp)` is `mcp === true`. Startup `getProcessCapabilities` is computed once before the MCP block and reused for CopilotKit. Both `mountHttpRoutes` and `mcpServer.run` are gated; `setupMcpServer` still runs. `runMcpToolRunner` takes `capabilities` before `fetchImpl` and returns `FeatureUnavailable` / `capability: "mcp"` without fetching. RunnerView maps that to `Action2Error`. Test sessions pass `{ mcp: true }`. Slice 0 and #253 phase0 now require the gate. Vite proxy `/mcp` stays; #253 exact proxy list also includes `/auth` (already on HEAD). 3/3 phase6, 8/8 #253 phase0, 11/11 phase0.

---

## Slice 7. Designer tools

**Status:** ⬜ pending

### Goal

Bulb hidden when config is off, or when auth is on and the user has no explicit Admin grant. Leftover `sessionStorage.showModelTools` does not win. Transformer Builder follows designer tools.

**Layers cut:** `hasAccess(..., alwaysAllow: [])` → `useApplicationAccess` + `useAuthSession` → AppBar / context → Builder menu item → Alice Admin seed.

### 7.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/273-process-capability-switches/processCapabilitiesDesigner.273.phase7.unit.test.ts`

The emulated standalone `tests/assets` Admin copy has no `MiroirRight` entity. Do not load Alice from that tree. Pass grant objects into the helper.

Behavior asserted:

- Helper `isDesignerToolsVisible({ designerTools, authEnabled, principal, grants })`:
  - `designerTools: false` → false regardless of grants
  - `designerTools: true`, auth off → true
  - `designerTools: true`, auth on, Carol (`30634877-…`) empty grants → false
  - `designerTools: true`, auth on, Alice (`1c39328c-…`) with grant `{ targetType: "application", targetUuid: ADMIN_APPLICATION_UUID, capability: "admin" }` and `alwaysAllow: []` → true
  - `designerTools: true`, auth on, principal with **only** always-allow semantics (no grant row) → false
- When not visible, `showModelTools` is forced false (helper or provider test)
- Transformer Builder item is included iff designer tools visible, not iff `ai`

### 7.2 GREEN

Add seed `86a73f7e-17f8-462d-8203-af1f323a7cdc.json` under `packages/miroir-test-app_deployment-admin/assets/admin_data/a6136fc7-949b-4d64-9f13-dd3afce1ab3c/`. Shape matches Alice’s Library grant (`48b2048f-…`) with `targetUuid` `55af124e-…` and `capability: "admin"`. Export `miroirRight_AliceAdminApplication` from admin `index.ts` **and** `index.d.ts`.

AppBar / provider: `useAuthSession` + `useApplicationAccess().grants` (already selects Admin `MiroirRight` rows at `useApplicationAccess.ts:49-88`). Call `hasAccess` with `alwaysAllow: []`. Force `setShowModelTools(false)` when not visible. Move Builder off `showAgentUi` (`AppBar.tsx:346`).

Do not copy the seed into `packages/miroir-standalone-app/tests/assets` (that Admin model copy has no `MiroirRight` entity).

### 7.3 Refactor checkpoint

Consume Slice 0 “no Alice Admin grant / uuid unused”. Sidebar already follows `showModelTools` (`Sidebar.tsx:105-108`). Do not change Admin always-listed except via the forced-off flag.

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-admin -- tests/modelValidation.unit.test.ts
RUN_TEST=processCapabilitiesDesigner.273.phase7 npm run testByFile -w miroir-standalone-app -- processCapabilitiesDesigner.273.phase7
RUN_TEST=processCapabilities.273.phase0 npm run testByFile -w miroir-core -- processCapabilities.273.phase0
```

### Realization

<Appended on completion.>

---

## Slice 8. Versioning icon

**Status:** ⬜ pending

### Goal

The Versioning AppBar item is shown only when the **browsed** application’s `resolveVersioningMode` is `versioned-internal`. Click still opens the report under Miroir (#225).

**Layers cut:** `versioningMode.ts` → AppBar visibility. Navigation helper unchanged.

### 8.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/273-process-capability-switches/processCapabilitiesVersioning.273.phase8.unit.test.ts`

Input source: `context.toolsPageState?.applicationSelector` (`AppBar.tsx:534`). That uuid names the browsed SelfApplication. Home has none.

Behavior asserted:

- `isVersioningAppBarItemVisible({ browsedSelfApplication: undefined })` → false
- browsed app `unversioned` / `versioned-external` → false
- browsed app `versioned-internal` / legacy `versioningEnabled: true` → true
- `resolveAppBarReportLinkApplication` still returns Miroir for the Versioning report when `applicationSelector` is Library (`AppBarVersioning.unit.test.ts:11-20` stays green, do not rewrite that test)

Freeze still throws via `assertApplicationVersioningEnabled` (existing tests remain).

### 8.2 GREEN

Filter the Versioning `miroirMenuReportLink` (`AppBar.tsx:373-386`) with `isVersioningAppBarItemVisible`. Resolve the browsed SelfApplication row from the selector. Do not change `resolveAppBarReportLinkApplication`.

### 8.3 Refactor checkpoint

Do not put versioning on the process snapshot.

### Validation

```bash
RUN_TEST=processCapabilitiesVersioning.273.phase8 npm run testByFile -w miroir-standalone-app -- processCapabilitiesVersioning.273.phase8
RUN_TEST=AppBarVersioning npm run testByFile -w miroir-standalone-app -- AppBarVersioning
```

### Realization

<Appended on completion.>

---

## Slice 9. Electron loopback listen + remaining config patches

**Status:** ⬜ pending

### Goal

When Electron `features.ai` / `mcp` is true, main listens on loopback HTTP and the renderer talks to that base, not `app://` / `window.location.origin`. Remaining persistence-side product configs that should keep AI/MCP set the flags.

**Layers cut:** `electronServerConfig` → `shouldListenLoopbackHttp` → listen in main → renderer URL helpers → config JSON.

`miroir-standalone-app-electron` is not importable from standalone-app tests (private, depends **on** standalone-app, `ipcMain` is main-only). Prove helpers by importing them from `miroir-core`. Prove the listen by source-text on `ipcServerSetup.ts` / `main.ts`, same pattern as `authentication.71.phase6` reading `server.ts`.

### 9.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/273-process-capability-switches/processCapabilitiesElectron.273.phase9.unit.test.ts`

Behavior asserted:

- `electronRuntimeBaseUrl(serverConfig)` is an `http(s)://127.0.0.1|localhost:...` URL derived from `rootApiUrl`, never `app://`
- `copilotRuntimeUrl(env, base)` is `${base}/api/copilotkit` when `env === "electron"`, else `"/api/copilotkit"`
- `browserMcpServerUrl` uses the same base on Electron
- `shouldListenLoopbackHttp({ ai, mcp })` is true if either flag is true
- Source text: `ipcServerSetup.ts` and/or `main.ts` calls `listen` (or equivalent) when `shouldListenLoopbackHttp` / `features.ai` / `features.mcp` is true. This **consumes** Slice 0’s “no `listen(`” assertion (flip to the gated-listen form).
- `electronServerConfig` in source has `features: { ai: true, mcp: true, designerTools: true }`
- Renderer `electronMiroirConfig` still has **no** `features` (R7)
- Shipped server JSON still has `features.ai`/`mcp` true (already patched in Slice 2; re-assert)
- Sandbox client config / sandbox define still forces `ai` false

### 9.2 GREEN

Home the four URL/mount helpers plus `shouldListenLoopbackHttp` in `processCapabilityRoutes.ts`. Main listens on loopback when that helper is true (reuse `electronServerConfig.server.rootApiUrl`). Point `AgentsCopilotKit` and `runMcpToolRunner` at `copilotRuntimeUrl` / `browserMcpServerUrl`. Patch Electron **main** `electronServerConfig` and any remaining persistence-side product configs that need non-defaults. Do not add `features` to the renderer object.

### 9.3 Refactor checkpoint

Consume Slice 0 `ipcServerSetup.ts` assertions. `mcpToolRunner.253.phase0` proxy list may stay; Electron no longer depends on Vite proxy for CopilotKit.

### Validation

```bash
RUN_TEST=processCapabilitiesElectron.273.phase9 npm run testByFile -w miroir-standalone-app -- processCapabilitiesElectron.273.phase9
RUN_TEST=processCapabilities.273.phase0 npm run testByFile -w miroir-core -- processCapabilities.273.phase0
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app-electron/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 10. Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 10.1 Nonreg

Two steps in `scripts/nonreg-manifest.json`:

- `unit-273-process-capabilities` (tier `unit`): `bash -c` running the miroir-core `273` files and the standalone-app unit `273` files.
- `appstack-273-process-capabilities` (tier `default`): `testByFile -w miroir-standalone-app -- --profile {profile} processCapabilitiesStore.273.phase3`.

Do not put both packages in one argv array.

### 10.2 Docs

- `analysis.md` status → implemented when slices 1 to 9 are DONE (not before).
- `docs/internals/code-splitting.md`: AI chunk gated by snapshot `ai`, not `ViewParams.agents`.
- `docs/reference/data-architecture-deployments.md`: `features` on persistence-side config; sandbox veto; Electron loopback.

### 10.3 Issue-directory cleanup

- After the suite is stable, migrate still-valuable assertions into feature-named files and delete `issues/273-process-capability-switches/` per `docs/contributing/testing.md` (#238). May stay until the first green nonreg if cleanup would hide history. Then do it in this slice.

### 10.4 Tracer bullet (narrative)

1. Start emulated IndexedDB (or sandbox).
2. `GET /capabilities` before login → `ai: false` in sandbox, store types bundled+indexedDb, `creatableStoreTypes` without bundled. Context holds that copy.
3. Create Application does not offer bundled or sql.
4. Shipped `miroir-server` already has `features.ai/mcp` true. Settings has no Agents row. AppBar shows AI only if snapshot `ai` is true.
5. Auth on, user without Admin grant: no bulb. Leftover session cannot open model tools.

Automated equivalent: Slices 1 to 8 tests.

### AC checklist (#273)

| Criterion | Proven by | Status |
|---|---|---|
| `features` on client and server schemas | Slice 2 rebuild + types | ⬜ |
| Missing `ai`/`mcp` false; missing `designerTools` true | Slice 1 | ⬜ |
| Sandbox forces `ai` false | Slice 1 | ⬜ |
| `getProcessCapabilities` + GET once, HTTP/IPC | Slices 1 to 2 | ⬜ |
| UI learns the snapshot via the rest client, never `window.fetch`, never renderer-side computation (R3/R11) | Slice 2 context + source-text | ⬜ |
| Snapshot fields including derived store types | Slice 1 | ⬜ |
| Hide and refuse same check; `FeatureUnavailable` | Slices 1, 3, 6 | ⬜ |
| `ViewParams.agents` removed | Slice 5 + modelValidation | ⬜ |
| `ai` false: no chunk, no mount, no Settings row, no icons | Slice 5 | ⬜ |
| `mcp` false: no mounts, no runner fetch | Slice 6 | ⬜ |
| Create Application picker follows snapshot | Slice 4 | ⬜ |
| Store-admin refuse follows snapshot | Slice 3 | ⬜ |
| Versioning icon follows browsed-application mode | Slice 8 | ⬜ |
| Bulb + explicit Admin grant + force off + Builder | Slice 7 | ⬜ |
| Electron same capacity + loopback listen + URLs | Slice 9 | ⬜ |
| `emulatedServer` is transport only | Slices 1 to 2 (stub) | ⬜ |
| `deploymentMode` not revived | Slice 0 + 10 docs | ⬜ |

### Validation

```bash
npm run nonreg
```

### Realization

<Appended on completion.>
