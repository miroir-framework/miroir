# Issue #275. TDD implementation plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Tests exercise public helpers (`getProcessCapabilities`, secret aliases, CopilotKit
> router branch, `propose_*` actions) and the real emulated-server stack where a
> DomainController exists. No mocks of DomainController. `@cursor/sdk` is injected
> at a factory seam in tests (same exception as #267 `parseServerArgs` / #270
> `SecretsService`) so CI does not need `CURSOR_API_KEY` or native binaries for
> the tracer. Tracer (Slice 1→2): snapshot grows `cursor`, then `/api/copilotkit`
> takes the `agents` branch when `resolveBackendPick` reads
> `forwardedProps.aiConfig.backend === "cursor"`. Picker UI is Slice 6.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step. Each
> slice ends with Validation commands; on success append Realization and flip Status.

Analysis: [`./analysis.md`](./analysis.md) · Analysis review: [`./adversarial-review.md`](./adversarial-review.md) · Issue: https://github.com/miroir-framework/miroir/issues/275
Prerequisite: [`../273-FEATURE-process-capability-switches/`](../273-FEATURE-process-capability-switches/) ✅
Working branch: `275-FEATURE-cursor-sdk-copilotkit-backend`

**Resume note:** Slices 0–6 done. Next: Slice 7 (Electron dummy cwd + packaging).

---

## Plan-review repairs (binding)

From [`./plan-adversarial-review.md`](./plan-adversarial-review.md). Product decisions D1–D14 unchanged.

| ID | Repair |
|---|---|
| P1 | `createCopilotKitRouter` takes a snapshot or `getProcessCapabilities` getter. Production `server.ts` / `ipcServerSetup.ts` pass it. Slice 2 RED injects that snapshot. |
| P2 | Client: `<CopilotKit properties={{ aiConfig: { backend: "cursor" } }}>` when pick is Cursor. Server: `resolveBackendPick(req)` reads `req.body.body?.forwardedProps?.aiConfig?.backend` (and top-level `body.aiConfig.backend` if present). |
| P3 | Slice 2 RED includes one HTTP POST fixture with the 1.59 envelope `{ method, body: { forwardedProps: { aiConfig: { backend: "cursor" } } } }`. Picker UI stays Slice 6. |
| P4 | Slice 2 RED asserts Cursor `CopilotRuntime` is constructed with a non-empty forwarded `actions` array plus `agents`. Slice 5 Validation re-runs phase2. Realization records whether `renderAndWaitForResponse` is believed to work; if phase2 construction cannot pass `actions` with `agents`, stop. |
| P5 | Slice 4 GREEN sets the default `createCursorAbstractAgent` to `cursorAgent.ts`. Validation re-runs phase2. |
| P6 | Slice 1 updates every #273 `ProcessCapabilities` literal listed below. |
| P7 | Slice 0 locks the extra §3 pins and the nine action names. |
| P8 | AC rows for Node floor, `ai` master switch, packaging outcome. Slice 3 stays a secret/health slice; Slice 4 is the SDK vertical (wired). |
| P9 | Slice 0 Refactor + Slice 8 RED/GREEN/Refactor. |
| P10 | Electron proofs are standalone-app source-text of `ipcServerSetup.ts` and electron `package.json` only. |
| P11 | Slice 5 test is `cursorSdk.275.phase5` source-text + `AiEntityProposalForm`. No `AiProposalForms`. |
| P12 | Slices 4, 7, 8 consume Slice 0 pins that they flip. |

#273 snapshot literals that must gain `cursor: false` in Slice 1:

- `FAIL_CLOSED_PROCESS_CAPABILITIES` (`ProcessCapabilitiesHttp.ts:8-15`)
- `processCapabilities.273.phase1.unit.test.ts` `.toEqual` blocks and `disabledSnapshot`
- `processCapabilitiesHttp.273.phase2.integ.test.ts`
- `processCapabilitiesContext.273.phase2.unit.test.ts` (standalone-app)
- `processCapabilitiesStore.273.phase3.integ.test.ts` (both literals + spreads)
- `processCapabilitiesElectron.273.phase9` only if its objects become `ProcessCapabilities` (today they are `{ ai, mcp }` for `shouldListenLoopbackHttp`)

---

## Scope

- `features.cursor` on persistence-side `miroirConfig` (missing = false).
- `ProcessCapabilities.cursor` + refuse on `/api/copilotkit` (`cursor` / `mcp`).
- `aiCursorKey` secret alias. Lazy `@cursor/sdk` on the persistence process only.
- Local Cursor agent, `tools: ["mcp"]`, dummy empty `cwd`, loopback `/mcp` (ungated).
- `sessionStorage` pick → `<CopilotKit properties={{ aiConfig: { backend: "cursor" } }}>` → `resolveBackendPick`.
- `propose_generateMiroirEntity` + `propose_lendDocument` form. Filtered Cursor runtime `actions`.
- Electron main: same loop, dummy `cwd`, native SDK packaged or explicit fail.

This plan does **not** retire `miroirCopilotKitActions` (#193), add cloud Cursor, OR `mcp` from `ai`, put the pick on `ViewParams`, or gate `/mcp` with a new Bearer.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize current AI / snapshot / MCP contracts | ✅ | `cursorSdk.275.phase0.unit.test.ts` |
| 1 | **Tracer:** `features.cursor` + snapshot field | ✅ | `cursorSdk.275.phase1.unit.test.ts` + `devBuild` |
| 2 | CopilotKit `agents` branch + refuse + filtered actions | ✅ | `cursorSdk.275.phase2.unit.test.ts` |
| 3 | `aiCursorKey` alias + health text | ✅ | `cursorSdk.275.phase3.unit.test.ts` |
| 4 | Lazy SDK factory, dummy cwd, MCP loopback, Node floor | ✅ | `cursorSdk.275.phase4.unit.test.ts` |
| 5 | `propose_*` rename + lend form | ✅ | `cursorSdk.275.phase5.unit.test.ts` |
| 6 | sessionStorage picker sets CopilotKit `properties` | ✅ | `cursorSdk.275.phase6.unit.test.ts` |
| 7 | Electron dummy cwd + packaging pin | ⬜ | `cursorSdk.275.phase7.unit.test.ts` |
| 8 | Nonreg, docs, cleanup, AC | ⬜ | `unit-275-cursor-sdk` |

---

## Locked implementation defaults

From [`./analysis.md`](./analysis.md) D1–D14 + R1–R11. Binding. Deviations go in Realization.

| Decision | Choice |
|---|---|
| D1 | CopilotKit stays the shell. |
| D2 / R3 | Cursor branch: `CopilotRuntime({ agents, actions })`, omit `serviceAdapter`. Token branch unchanged. |
| D3 | `features.cursor`, missing = false. Not `designerTools` default-true. |
| D4 / R1 / P2 | `sessionStorage` + `<CopilotKit properties={{ aiConfig: { backend: "cursor" } }}>`. Server reads `forwardedProps`. |
| D5 | Local only. `tools: ["mcp"]`. Dedicated empty `cwd`. |
| D6 / R2 | Loopback `/mcp`, ungated, no new Bearer. |
| D7 | `CURSOR_API_KEY` → `aiCursorKey`. |
| D8 / R5 / R6 | `propose_*` are CopilotKit frontend actions. Cursor runtime `actions` filtered. First `agents` slice proves form forwarding before the rename. |
| D9 | MCP writes execute. |
| D10 / R4 | No `ai`⇒`mcp` OR. Refuse `capability: "cursor"` or `"mcp"`. |
| D11 | Keep execute-list until #193. |
| D12 / R8 | Electron in this issue, including native packaging or fail-loud. |
| D13 / R7 | Browser never imports SDK. Server Cursor path requires Node ≥ 22.13.0. |
| D14 / R9 | Snapshot field `cursor`. Update FAIL_CLOSED, #273 pins, docs. |

---

## Allocated UUIDs / keys

No new Entity / Report / Runner / MiroirTest.

| Artefact | Value |
|---|---|
| sessionStorage key | `miroirAiBackend` (`"cursor"` or absent) |
| Dummy cwd dirname | `.miroir-cursor-cwd` under a dedicated dir the persistence process owns (not deployment assets) |
| Core unit dir | `packages/miroir-core/tests/1_core/issues/275-cursor-sdk-copilotkit-backend/` |
| Core HTTP / secrets dir | `packages/miroir-core/tests/4_services/issues/275-cursor-sdk-copilotkit-backend/` |
| miroir-ai dir | `packages/miroir-ai/tests/unit/issues/275-cursor-sdk-copilotkit-backend/` |
| standalone view dir | `packages/miroir-standalone-app/tests/4_view/issues/275-cursor-sdk-copilotkit-backend/` |
| Nonreg step | `unit-275-cursor-sdk` (tier `unit`, bash `-c` core + miroir-ai + standalone `4_view/issues/275-*`) |

Helper homes:

| Symbol | Home |
|---|---|
| `ProcessCapabilities.cursor`, `assertProcessCapability("cursor")` | `processCapabilities.ts` |
| `aiCursorKey` | `AI_SECRET_IMPORT_ALIASES` |
| `isCursorBackendAllowed(snapshot)` | `processCapabilities.ts` (`ai && cursor && mcp && !sandbox`) |
| `createCursorDummyCwd`, `isNodeVersionAtLeast(22,13,0)` | `miroir-ai` next to the adapter |
| `createCopilotKitRouter(..., { capabilities \| getCapabilities })` | `copilotKitRoute.ts`; callers in `server.ts` and `ipcServerSetup.ts` |
| `resolveBackendPick(req)` | `copilotKitRoute.ts` |
| Cursor `AbstractAgent` wrapper + lazy `import("@cursor/sdk")` | `packages/miroir-ai/src/runtime/cursorAgent.ts` (name may move in refactor) |
| `sessionStorage` helpers | standalone AI routes, not `4_view` importing `getProcessCapabilities` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Phase N vitest (core) | `RUN_TEST=cursorSdk.275.phaseN npm run testByFile -w miroir-core -- cursorSdk.275.phaseN` |
| Phase N vitest (miroir-ai) | `RUN_TEST=cursorSdk.275.phaseN npm run testByFile -w miroir-ai -- cursorSdk.275.phaseN` |
| Phase N vitest (standalone) | `RUN_TEST=cursorSdk.275.phaseN npm run testByFile -w miroir-standalone-app -- cursorSdk.275.phaseN` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` (repeat miroir-ai, standalone-app, server, electron if touched) |
| Re-run #273 snapshot pins | `npm run testByFile -w miroir-core -- 273-process-capability-switches` |
| Nonreg | `npm run nonreg` |

Vitest exceptions. Slice 0 locks source contracts that are not ML. Slices 1–4 are TS helpers and an Express router (no Endpoint / Runner for “which LLM backend”). Slice 5 is React `useCopilotAction` names and a form. Slice 6 is sessionStorage + request body. Slice 7 is Electron source-text / builder `files`. No MiroirTest asset: this is process wiring, not a model element.

---

## Slice 0 — Characterize current contracts

**Status:** ✅ DONE

### Goal

Lock today’s snapshot, CopilotKit catalogs, router, MCP auth, and “no Cursor SDK” so later diffs are reviewable.

### 0.1 RED → GREEN

**Test:** `packages/miroir-core/tests/1_core/issues/275-cursor-sdk-copilotkit-backend/cursorSdk.275.phase0.unit.test.ts` plus a sibling source-text file under `miroir-ai/tests/unit/issues/275-cursor-sdk-copilotkit-backend/` and standalone `4_view/issues/275-cursor-sdk-copilotkit-backend/`.

Behavior asserted:
- `ProcessCapabilities` / `FAIL_CLOSED_PROCESS_CAPABILITIES` have no `cursor` field.
- `ProcessCapabilityName` has no `"cursor"`.
- Jzod `features` has `ai` / `mcp` / `designerTools` only.
- `AI_SECRET_IMPORT_ALIASES` has exactly four keys.
- `createMiroirCopilotKitActions` live names are `lendDocument`, `generateMiroirReport`, `getMiroirContext`.
- Frontend `useCopilotAction` names are the nine listed in the analysis. Only `generateMiroirEntity` contains `renderAndWaitForResponse`. `lendDocument` contains `handler`.
- `copilotKitRoute.ts` `resolveConfig` reads `body.aiConfig` then env. Source has no `aiConfig.backend`.
- `server.ts` and `ipcServerSetup.ts` statically import `createCopilotKitRouter`. No `@cursor/sdk` in repo `package.json` files.
- `mcpServer.mountHttpRoutes` has no `Authorization` / `assertRequestAllowed`.
- Lending uuid `212f2784-5b68-43b2-8ee0-89b1c6fdd0de` present in `miroirCopilotKitActions.ts`.
- Frontend names locked explicitly: `generateMiroirEntity`, `getMiroirContext`, `lookupApplicationByName`, `lookupDeploymentByApplicationUuid`, `lookupEntityByName`, `findInstanceByName`, `lendDocument`, `getCurrentDate`, `getCurrentTimestamp`.
- Commented runtime tools `generateMiroirEntity`, `generateMiroirQuery`, `generateMiroirTransformer` exist as comments in `miroirCopilotKitActions.ts:153-421`.
- `AiProviderType` is exactly `openai \| anthropic \| google \| github`.
- `shouldMountCopilotKitRoute` / CopilotKit auth gate string present in `server.ts`.
- `runMcpToolRunner` refuses `mcp` false.
- `RootComponent` latch uses `processCapabilities.ai`.
- Electron `electronServerConfig.features` has `ai`, `mcp`, `designerTools` and no `cursor`.
- `FAIL_CLOSED_PROCESS_CAPABILITIES` field list has no `cursor`.
- Shipped `miroirConfig.server.json` has `features.ai` and `features.mcp`, no `cursor`.

### 0.2 GREEN

Characterization tests only. No production edits.

### 0.3 Refactor checkpoint

- Later slices consume these pins in place (P12): Slice 1 flips FAIL_CLOSED / snapshot literals; Slice 4/7 flip "no `@cursor/sdk`"; Slice 5 flips the nine action names; Slice 6 flips `AgentsCopilotKit` props / ViewParams comment; Slice 8 consumes leftover docs.

### Validation

```bash
RUN_TEST=cursorSdk.275.phase0 npm run testByFile -w miroir-core -- cursorSdk.275.phase0
RUN_TEST=cursorSdk.275.phase0 npm run testByFile -w miroir-ai -- cursorSdk.275.phase0
RUN_TEST=cursorSdk.275.phase0 npm run testByFile -w miroir-standalone-app -- cursorSdk.275.phase0
```

### Realization

Characterization only. No production edits. Three vitest files, 22 tests. Re-ran Validation: core 7, miroir-ai 9, standalone 6, all green.

Pins match the tree: no `cursor` on snapshot / Jzod / FAIL_CLOSED; four secret aliases; live runtime actions `lendDocument` / `generateMiroirReport` / `getMiroirContext`; nine frontend names; only `generateMiroirEntity` uses `renderAndWaitForResponse`; `/mcp` ungated; no `@cursor/sdk`; `AgentsCopilotKit` has `runtimeUrl` only.

Slice 1 must consume the "no `cursor` field" pins in place (expect `cursor: false`), not leave phase0 asserting absence.

---

## Slice 1 — Tracer: snapshot `cursor`

**Status:** ✅ DONE

### Goal

An operator can set `features.cursor` and `GET /capabilities` reports `cursor` true or false with the #273 fail-closed rules.

**Layers cut:** Jzod schema → generated type → `getProcessCapabilities` → HTTP snapshot / FAIL_CLOSED

### 1.1 RED

**Test:** `cursorSdk.275.phase1.unit.test.ts` in miroir-core (helper + HTTP fixture).

Behavior asserted:
- Missing `features.cursor` → `cursor: false`.
- `features.cursor: true` + not sandbox → `cursor: true` (even if `ai` is false; picker still hidden because `ai` is false).
- Sandbox does not force `cursor` false by itself (sandbox already forces `ai` false; `isCursorBackendAllowed` is a later helper).
- `FAIL_CLOSED_PROCESS_CAPABILITIES.cursor === false`.
- `assertProcessCapability("cursor", snapshot)` returns `FeatureUnavailable` when `cursor` is false.
- Every #273 snapshot literal in the plan-review P6 list includes `cursor: false` after GREEN. `FAIL_CLOSED_PROCESS_CAPABILITIES.cursor === false`.

### 1.2 GREEN

- Add optional `features.cursor` on client and server Jzod. `devBuild`.
- Extend `ProcessCapabilities`, `getProcessCapabilities`, `ProcessCapabilityName`, FAIL_CLOSED.
- Persistence-side read only. Do not put `cursor` on Electron renderer config.

### 1.3 Refactor checkpoint

- One line next to `features?.ai === true`. Do not copy `designerTools` default.
- Electron `ipcServerSetup.ts` computed snapshot will grow `cursor` when main config is patched (Slice 7). Do not patch renderer config.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=cursorSdk.275.phase1 npm run testByFile -w miroir-core -- cursorSdk.275.phase1
npm run testByFile -w miroir-core -- 273-process-capability-switches
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem 273-process-capability-switches
```

### Realization

`features.cursor` is optional on client and server Jzod. `getProcessCapabilities` sets `cursor: features?.cursor === true` (missing = false). Sandbox does not force `cursor` off. `FAIL_CLOSED_PROCESS_CAPABILITIES.cursor` is false. `assertProcessCapability("cursor", …)` returns FeatureUnavailable. `ProcessCapabilityName` is exported.

HTTP case lives in the same `1_core` phase1 file. Slice 0 pins now expect `cursor: false`. All listed #273 `ProcessCapabilities` literals have `cursor: false`. Generated `MiroirConfigClient` / `MiroirConfigServer` features include `cursor?: boolean`.

Did not patch Electron `electronServerConfig` or renderer config. Callers already use `getProcessCapabilities`, so they pick up the field.

Validation re-run: phase1 8, phase0 7, core #273 23, standalone #273 with `--profile emulatedServer-filesystem` 45, `tsc` miroir-core. The standalone glob without `--profile` fails because `processCapabilitiesStore.273.phase3` always loads a test config (pre-existing). Plan Validation now includes `--profile`.

---

## Slice 2 — CopilotKit `agents` branch + refuse

**Status:** ✅ DONE

### Goal

A CopilotKit POST whose 1.59 envelope carries `forwardedProps.aiConfig.backend: "cursor"` uses the `agents` map and omits `serviceAdapter` when the injected snapshot allows Cursor. Otherwise the route returns `FeatureUnavailable`.

**Layers cut:** `copilotKitRoute` → `CopilotRuntime` options → refuse helper

This slice uses a **test `AbstractAgent`**, not `@cursor/sdk`. Production callers pass the process snapshot into `createCopilotKitRouter` (P1). Backend pick is read via `resolveBackendPick` from the 1.59 envelope (P2). If `CopilotRuntime` cannot be constructed with both `agents` and a non-empty `actions` array, **stop** and record in Realization. Do not start Slice 5.

### 2.1 RED

**Test:** `packages/miroir-ai/tests/unit/issues/275-cursor-sdk-copilotkit-backend/cursorSdk.275.phase2.unit.test.ts` plus standalone `cursorSdk.275.phase2.unit.test.ts` (source-text pin for `renderAndWaitForResponse`).

Behavior asserted:
- HTTP POST to the router with envelope `{ method: "agent/run", body: { forwardedProps: { aiConfig: { backend: "cursor" } } } }` + snapshot `{ ai, cursor, mcp }` all true → runtime constructed with `agents.cursor` set, `serviceAdapter` omitted, and a **non-empty** `actions` array (R6 construction proof).
- Same POST + `cursor: false` on the **injected snapshot** → `FeatureUnavailable` `capability: "cursor"`.
- Same POST + `mcp: false` → `FeatureUnavailable` `capability: "mcp"`.
- Token path (no backend pick) still uses `buildCopilotRuntime` + adapter when `AI_PROVIDER_TYPE` is set.
- Cursor branch `actions` names do not include `generateMiroirReport` or `getMiroirContext`. Lend executor / POST helper may remain.
- Injected test agent’s `run` is what the runtime holds (no `Agent.create`).
- `createCopilotKitRouter` signature / options include capabilities (source-text on `server.ts` and `ipcServerSetup.ts` after GREEN).
- Standalone source-text: `generateMiroirEntity` still contains `renderAndWaitForResponse` (R6 pin before the Slice 5 rename). If the Cursor `CopilotRuntime` constructor rejects `actions` plus `agents`, leave this slice pending and do not start Slice 5.

### 2.2 GREEN

- `resolveBackendPick(req)` as in P2.
- `createCopilotKitRouter(dc, map, { capabilities } | { getCapabilities })`.
- `isCursorBackendAllowed`.
- Factory seam `createCursorAbstractAgent` injectable for tests.

### 2.3 Refactor checkpoint

- Do not call `getApiKey` for Cursor.
- Keep token `/health` working.
- Realization must record: did `CopilotRuntime({ agents, actions })` construct with a non-empty `actions` array? If no, Status stays pending.

### Validation

```bash
RUN_TEST=cursorSdk.275.phase2 npm run testByFile -w miroir-ai -- cursorSdk.275.phase2
RUN_TEST=cursorSdk.275.phase2 npm run testByFile -w miroir-standalone-app -- cursorSdk.275.phase2
```

### Realization

**R6 construction gate: YES.** `new CopilotRuntime({ agents: { cursor }, actions: [lendDocument, …] })` does not throw. Slice 5 may proceed.

`resolveBackendPick` reads `body.body.forwardedProps.aiConfig.backend` then top-level `body.aiConfig?.backend`. `createCopilotKitRouter` takes `{ capabilities | getCapabilities, createCursorAbstractAgent, createCopilotRuntime }`. Cursor branch builds `CopilotRuntime({ agents, filtered actions })` and omits `serviceAdapter`. Filtered names drop `generateMiroirReport` and `getMiroirContext`. Refuse is HTTP 403 with `Action2Error` JSON (`FeatureUnavailable`, `capability: "cursor"` or `"mcp"`). `isCursorBackendAllowed` is `ai && cursor && mcp`. `server.ts` and `ipcServerSetup.ts` pass `{ capabilities }`.

Default `createCursorAbstractAgent` is not wired (Slice 4). Allowed Cursor pick without a factory returns 503 `{ error: "Cursor agent is not configured" }`.

Slice 0 still asserts source has no substring `aiConfig.backend`. The pick uses `aiConfig?.backend` so that pin stays true. Token `/health` is unchanged.

Validation re-run: miroir-ai phase2 9, standalone phase2 3, miroir-ai phase0 9, `tsc` miroir-ai and miroir-core.

---

## Slice 3 — `aiCursorKey` + health

**Status:** ✅ DONE

### Goal

An operator can import `CURSOR_API_KEY` as `aiCursorKey`. `GET /api/copilotkit/health` text names that key (person-visible command for this helper slice).

**Layers cut:** `SecretsService` → health JSON

### 3.1 RED

**Test:** `cursorSdk.275.phase3.unit.test.ts` in miroir-core (alias) and miroir-ai (health string).

Behavior asserted:
- `assembleSecretImportSet` maps `CURSOR_API_KEY` → `aiCursorKey` unless the name already exists.
- `getApiKey` still rejects `"cursor"` as `AiProviderType` (not a fifth adapter).
- Health 503 / configured message includes `CURSOR_API_KEY` or `aiCursorKey`.

### 3.2 GREEN

- Fifth `AI_SECRET_IMPORT_ALIASES` row. Update the “four D6” comment.

### 3.3 Refactor checkpoint

- Re-run #270 secret alias tests if they pin the four-key count.

### Validation

```bash
RUN_TEST=cursorSdk.275.phase3 npm run testByFile -w miroir-core -- cursorSdk.275.phase3
RUN_TEST=cursorSdk.275.phase3 npm run testByFile -w miroir-ai -- cursorSdk.275.phase3
```

### Realization

Fifth `AI_SECRET_IMPORT_ALIASES` row: `cursor` → `CURSOR_API_KEY` / `aiCursorKey`. `assembleSecretImportSet` maps the env unless the name already exists. `getApiKey` uses `TOKEN_PROVIDER_SECRET_ALIASES` so `"cursor"` still throws Unsupported (not a fifth token adapter). Health 503 lists `CURSOR_API_KEY`. Slice 0 alias pin now expects five keys. `#270` secretsImport.270 still passes (it never sets `CURSOR_API_KEY`).

Validation re-run: core phase3 3, miroir-ai phase3 3.

---

## Slice 4 — Lazy SDK, dummy cwd, MCP loopback, Node floor

**Status:** ✅ DONE

### Goal

The persistence process can build a real Cursor wrapper: lazy `import("@cursor/sdk")`, empty dummy `cwd`, `tools: ["mcp"]`, MCP HTTP url on loopback, Node ≥ 22.13.0 or 503.

**Layers cut:** `miroir-ai` factory → filesystem dummy dir → version check

### 4.1 RED

**Test:** `cursorSdk.275.phase4.unit.test.ts` in miroir-ai.

Behavior asserted:
- Factory calls injected `importSdk` once per process (or once per first use). Default impl is `() => import("@cursor/sdk")`.
- `Agent.create` options include `local.cwd` pointing at an empty dedicated directory (create if missing), `tools: ["mcp"]`, `mcpServers` url `http://127.0.0.1:<port>/mcp`.
- `apiKey` comes from `resolveSecret("aiCursorKey")`.
- `isNodeVersionAtLeast(22,13,0)` false → factory throws / route 503 with a Node-floor message. Token route still works.
- No static `import "@cursor/sdk"` in `server.ts` or `ipcServerSetup.ts` (source-text).
- MCP POST from the wrapper uses `fetch` without Authorization (R2).

### 4.2 GREEN

- `cursorAgent.ts` + dummy-cwd helper.
- Add `@cursor/sdk` dependency on `miroir-ai` only.
- Default `createCursorAbstractAgent` used by `createCopilotKitRouter` is this module (P5).

### 4.3 Refactor checkpoint

- Dispose agent (`await using` / `asyncDispose`) so tests do not leak.
- Consume Slice 0 “no `@cursor/sdk` in package.json” pin: `miroir-ai/package.json` now lists it. Keep `server.ts` / `ipcServerSetup.ts` static-import pin.

### Validation

```bash
RUN_TEST=cursorSdk.275.phase4 npm run testByFile -w miroir-ai -- cursorSdk.275.phase4
RUN_TEST=cursorSdk.275.phase2 npm run testByFile -w miroir-ai -- cursorSdk.275.phase2
npx tsc --noEmit --skipLibCheck -p packages/miroir-ai/tsconfig.json
```

### Realization

`cursorAgent.ts` lazy-loads `@cursor/sdk` (`^1.0.31` on `miroir-ai` only). Default `createCopilotKitRouter` factory is this module. `Agent.create` (installed types) uses `apiKey` from `aiCursorKey`, `model: { id: "auto" }`, `tools: ["mcp"]`, `local.cwd` under `os.tmpdir()/.miroir-cursor-cwd`, and `mcpServers.miroir` HTTP `http://127.0.0.1:<port>/mcp` with no Authorization. Node below 22.13.0 throws; the Cursor route maps that to 503. Token path still works. `server.ts` / `ipcServerSetup.ts` pass `mcpHttpUrl`. No static SDK import on those entrypoints.

Wrapper `run()` maps SDK assistant text chunks to AG-UI `RUN_STARTED` / `TEXT_MESSAGE_*` / `RUN_FINISHED`. Not mapped yet: SDK `tool_call` / thinking / status → AG-UI `TOOL_CALL_*`. CopilotKit `propose_*` stay frontend actions (D8), not `local.customTools`. That leftover is not a Slice 5 gate.

Workspace `npm install -w miroir-ai` hit an npm 11 arborist crash; isolated install of `@cursor/sdk@1.0.31` plus lockfile merge was used. `npm ci` should still resolve from the lockfile.

Validation re-run: phase4 7, phase2 9, phase0 9, standalone phase2 3, `tsc` miroir-ai.

---

## Slice 5 — `propose_*` rename + lend form

**Status:** ✅ DONE

### Goal

A person sees `propose_generateMiroirEntity` and `propose_lendDocument` as review forms. Fire-and-forget CopilotKit `lendDocument` is gone. MCP `Library_lendDocument` remains the execute name.

**Layers cut:** `AiActionsProvider.tsx` → proposal form → existing lend POST

**Gate:** Slice 2 Realization must say frontend `actions` still forward on the `agents` branch. If not, this slice stays pending.

### 5.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/275-cursor-sdk-copilotkit-backend/cursorSdk.275.phase5.unit.test.ts` (source-text of `AiActionsProvider.tsx` and `AiEntityProposalForm.tsx`). No `AiProposalForms` file exists.

Behavior asserted:
- Source contains `propose_generateMiroirEntity` and `propose_lendDocument` with `renderAndWaitForResponse`.
- Source does not register `useCopilotAction` name `lendDocument` or `generateMiroirEntity`.
- Lookups and `getCurrentDate` / `getCurrentTimestamp` names unchanged.
- Slice 0 name inventory is updated in the same slice.

### 5.2 GREEN

- Rename entity form. Add lend form that on accept calls the existing `/lendDocument` POST.
- Runtime `createMiroirCopilotKitActions` may still export the lend executor for that POST.

### 5.3 Refactor checkpoint

- Share form chrome with `AiEntityProposalForm` only if it stays readable. Do not invent a third catalog.

### Validation

```bash
RUN_TEST=cursorSdk.275.phase5 npm run testByFile -w miroir-standalone-app -- cursorSdk.275.phase5
RUN_TEST=cursorSdk.275.phase0 npm run testByFile -w miroir-standalone-app -- cursorSdk.275.phase0
RUN_TEST=cursorSdk.275.phase2 npm run testByFile -w miroir-ai -- cursorSdk.275.phase2
```

### Realization

Frontend names are `propose_generateMiroirEntity` and `propose_lendDocument`, both `renderAndWaitForResponse`. Fire-and-forget CopilotKit `lendDocument` is gone. Accept on the lend form POSTs `/lendDocument`. Reject responds without posting. Lookups and date helpers unchanged. MCP `Library_lendDocument` and runtime `createLendDocumentExecutor` unchanged.

Added sibling `AiLendProposalForm` instead of sharing chrome with `AiEntityProposalForm`. Slice 0 / Slice 2 name pins updated in place.

Validation re-run: phase5 7, phase0 5, phase2 standalone 3.

---

## Slice 6 — Picker sets CopilotKit `properties`

**Status:** ✅ DONE

### Goal

A person with snapshot `ai` and `cursor` true can pick Cursor. `AgentsCopilotKit` then sets `<CopilotKit properties={{ aiConfig: { backend: "cursor" } }}>`. Snapshot `cursor` false or `ai` false hides the pick.

**Layers cut:** AppBar / AI shell → sessionStorage → CopilotKit `properties`

### 6.1 RED

**Test:** `cursorSdk.275.phase6.unit.test.ts` in standalone `4_view`.

Behavior asserted:
- Helper `readMiroirAiBackend()` / `writeMiroirAiBackend("cursor")` uses key `miroirAiBackend`.
- `AgentsCopilotKit` source contains `properties={{ aiConfig: { backend: "cursor" } }}` (or an equivalent expression) only when pick is cursor **and** `processCapabilities.cursor === true`.
- Picker is absent when `processCapabilities.ai === false`, even if `cursor` is true.
- No `4_view` file imports `getProcessCapabilities` from miroir-core (source-text, same pin as #273).

### 6.2 GREEN

- Picker next to the AI AppBar controls. Default omitted pick = token `AI_PROVIDER_TYPE`.
- Pass `properties` into `<CopilotKit>` (P2). Do not invent a second POST helper.

### 6.3 Refactor checkpoint

- Consume Slice 0 `AgentsCopilotKit` pin: replace the stale `ViewParams.agents` comment (`AgentsCopilotKit.tsx:6-8`) with the `properties` / sessionStorage story.

### Validation

```bash
RUN_TEST=cursorSdk.275.phase6 npm run testByFile -w miroir-standalone-app -- cursorSdk.275.phase6
```

### Realization

sessionStorage key is `miroirAiBackend` (`"cursor"` or absent). Helpers live in `miroirAiBackend.ts`. `AgentsCopilotKit` passes `properties={{ aiConfig: { backend: "cursor" } }}` only when the pick is `"cursor"` and `processCapabilities.cursor === true`. Omitted pick leaves `properties` undefined (token `AI_PROVIDER_TYPE` path).

AppBar picker sits next to AI Assistant, gated by `showAgentUi && processCapabilities.cursor`. `showAgentUi` is snapshot `ai`, so the picker is hidden when `ai` is false even if `cursor` is true. No `4_view` file imports `getProcessCapabilities`. Stale `ViewParams.agents` comment is gone.

Added `subscribeMiroirAiBackend` plus `useSyncExternalStore` so AppBar and CopilotKit re-render when the pick changes. `writeMiroirAiBackend()` with no argument clears the key. Slice 0 pin now requires `runtimeUrl` only; `properties` is allowed.

Validation: phase6 6, phase0 5, `processCapabilitiesContext.273.phase2` 3.

---

## Slice 7 — Electron dummy cwd + packaging

**Status:** ⬜ pending

### Goal

Electron main uses the same factory, a dummy cwd outside the renderer, and either ships `@cursor/sdk` natives or fails loud when they are missing.

**Layers cut:** `ipcServerSetup.ts` → electron-builder `files` → source-text

### 7.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/275-cursor-sdk-copilotkit-backend/cursorSdk.275.phase7.unit.test.ts`. Electron package has no vitest. Read `ipcServerSetup.ts` and `packages/miroir-standalone-app-electron/package.json` from standalone-app tests (same pattern as `processCapabilitiesElectron.273.phase9`).

Behavior asserted:
- `ipcServerSetup.ts` has no static `import "@cursor/sdk"`.
- Dummy cwd path is not `getDefaultFilesystemFolder()` itself.
- One explicit packaging path: either electron-builder `files` / extraResources includes the native SDK pattern, **or** named `assertCursorSdkPackaged` is called from main startup and the test asserts the fail-loud throw. Realization records which path landed.
- `features.cursor` is still only on `electronServerConfig`, not the renderer object.

### 7.2 GREEN

- Wire factory from main. Add builder files **or** fail-loud helper (one of the two, not a silent miss).
- Set `features.cursor: true` on main only when natives ship in this issue’s GREEN. If packaging is not ready, keep main `cursor` false and land the fail-loud helper. Realization must say which.

### 7.3 Refactor checkpoint

- Re-read #273 “no features on renderer”.
- Consume Slice 0 “no `@cursor/sdk` in electron `package.json`” if GREEN adds a dependency or `files` glob. Keep the no-static-import pin.

### Validation

```bash
RUN_TEST=cursorSdk.275.phase7 npm run testByFile -w miroir-standalone-app -- cursorSdk.275.phase7
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app-electron/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 8 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### Goal

Nonreg runs the 275 vitest glob. Operator docs name `features.cursor`, the Node floor, and the refuse names. Leftover Slice 0 pins that later slices did not flip are consumed or restated.

### 8.1 RED

**Test:** source-text / manifest assertions in `cursorSdk.275.phase8.unit.test.ts` (core or standalone, one file).

Behavior asserted:
- `scripts/nonreg-manifest.json` has no `unit-275-cursor-sdk` step (fails until GREEN).
- `docs/reference/process-capabilities.md` does not mention `features.cursor` or Node 22.13 (fails until GREEN).

### 8.2 GREEN

- Add `unit-275-cursor-sdk` to `scripts/nonreg-manifest.json` (tier `unit`, bash `-c` like `unit-273-process-capabilities`).
- `docs/reference/process-capabilities.md`: `ai` is the CopilotKit shell; `features.cursor` is the optional SDK; Node 22.13+; no `ai`⇒`mcp` OR.
- `analysis.md` status → implemented when slices are done.
- `AgentsCopilotKit` / `/health` comments match reality.

### 8.3 Refactor checkpoint

- Keep issue-dir tests as the nonreg pin for this issue (#238 migrate later), same as #273 Slice 10. Default: keep `issues/275-*` until a later cleanup issue.
- Consume leftover Slice 0 pins: `shouldMountCopilotKitRoute` / CopilotKit auth gate still present; shipped `miroirConfig.server.json` may gain optional `features.cursor` comment; MCP ungated pin still true.

### 8.4 Tracer bullet (narrative)

1. Persistence config: `features.ai`, `features.mcp`, `features.cursor` true. Restart `miroir-server` on Node ≥ 22.13. `CURSOR_API_KEY` imported.
2. Open the app, open AI Assistant. Pick Cursor.
3. Ask for Library instances. Agent calls `Miroir_getInstances` on loopback `/mcp`.
4. Ask to lend a book via MCP. `Library_lendDocument` runs (no form).
5. Ask to propose a lend. Sidebar shows `propose_lendDocument`. Accept posts `/lendDocument`.
6. Electron unpacked/packaged: same pick, no renderer `getProcessCapabilities`, no `app://` CopilotKit URL.

Automated equivalent: phase1 snapshot + phase2 router envelope + phase5 names + phase6 `properties`.

### AC checklist (#275)

| Criterion | Proven by | Status |
|---|---|---|
| CopilotKit stays the shell; sandbox `ai` false | phase0 + #273 | ⬜ |
| `features.cursor` missing = false; persistence-side only | phase1 | ⬜ |
| Not a fifth `AiProviderType` | phase2 + phase3 | ⬜ |
| `aiCursorKey` | phase3 | ⬜ |
| Lazy SDK, no browser import | phase4 source-text | ⬜ |
| Local, `tools: ["mcp"]`, dummy cwd | phase4 | ⬜ |
| Loopback `/mcp`, no new Bearer | phase4 + phase0 ungated pin | ⬜ |
| No cloud | out of scope / no cloud API in factory | ⬜ |
| MCP names execute | phase4 mcpServers url | ⬜ |
| `propose_*` forms; no CopilotKit `lendDocument` name | phase5 | ⬜ |
| Pick in sessionStorage + CopilotKit `properties` | phase6 | ⬜ |
| Picker hidden when `ai` is false, even if `cursor` is true | phase6 | ⬜ |
| Refuse uses `capability: "cursor"` or `"mcp"` on `/api/copilotkit` | phase2 | ⬜ |
| Node ≥ 22.13.0 when Cursor path is used | phase4 | ⬜ |
| Electron ships natives **or** fail-loud (Realization names which) | phase7 | ⬜ |
| Do not delete runtime execute list | phase0/2 filtered Cursor actions only | ⬜ |

### Validation

```bash
npm run nonreg -- --only unit-275-cursor-sdk
```

### Realization

<Appended on completion.>
