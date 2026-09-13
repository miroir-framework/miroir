# Issue #275. TDD implementation plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Tests exercise public helpers (`getProcessCapabilities`, secret aliases, CopilotKit
> router branch, `propose_*` actions) and the real emulated-server stack where a
> DomainController exists. No mocks of DomainController. `@cursor/sdk` is injected
> at a factory seam in tests (same exception as #267 `parseServerArgs` / #270
> `SecretsService`) so CI does not need `CURSOR_API_KEY` or native binaries for
> the tracer. Tracer (Slice 1→2): snapshot grows `cursor`, then `/api/copilotkit`
> takes the `agents` branch when `aiConfig.backend === "cursor"`.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step. Each
> slice ends with Validation commands; on success append Realization and flip Status.

Analysis: [`./analysis.md`](./analysis.md) · Analysis review: [`./adversarial-review.md`](./adversarial-review.md) · Issue: https://github.com/miroir-framework/miroir/issues/275
Prerequisite: [`../273-FEATURE-process-capability-switches/`](../273-FEATURE-process-capability-switches/) ✅
Working branch: `275-FEATURE-cursor-sdk-copilotkit-backend`

**Resume note:** Plan drafted. Slices 0–N pending.

---

## Scope

- `features.cursor` on persistence-side `miroirConfig` (missing = false).
- `ProcessCapabilities.cursor` + refuse on `/api/copilotkit` (`cursor` / `mcp`).
- `aiCursorKey` secret alias. Lazy `@cursor/sdk` on the persistence process only.
- Local Cursor agent, `tools: ["mcp"]`, dummy empty `cwd`, loopback `/mcp` (ungated).
- POST `aiConfig.backend: "cursor"` from `sessionStorage` pick.
- `propose_generateMiroirEntity` + `propose_lendDocument` form. Filtered Cursor runtime `actions`.
- Electron main: same loop, dummy `cwd`, native SDK packaged or explicit fail.

This plan does **not** retire `miroirCopilotKitActions` (#193), add cloud Cursor, OR `mcp` from `ai`, put the pick on `ViewParams`, or gate `/mcp` with a new Bearer.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize current AI / snapshot / MCP contracts | ⬜ | `cursorSdk.275.phase0.unit.test.ts` |
| 1 | **Tracer:** `features.cursor` + snapshot field | ⬜ | `cursorSdk.275.phase1.unit.test.ts` + `devBuild` |
| 2 | CopilotKit `agents` branch + refuse + filtered actions | ⬜ | `cursorSdk.275.phase2.unit.test.ts` |
| 3 | `aiCursorKey` alias + health text | ⬜ | `cursorSdk.275.phase3.unit.test.ts` |
| 4 | Lazy SDK factory, dummy cwd, MCP loopback, Node floor | ⬜ | `cursorSdk.275.phase4.unit.test.ts` |
| 5 | `propose_*` rename + lend form | ⬜ | `cursorSdk.275.phase5.unit.test.ts` |
| 6 | sessionStorage picker sends `aiConfig.backend` | ⬜ | `cursorSdk.275.phase6.unit.test.ts` |
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
| D4 / R1 | `sessionStorage` + POST `aiConfig.backend: "cursor"`. |
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

**Status:** ⬜ pending

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

### Validation

```bash
RUN_TEST=cursorSdk.275.phase0 npm run testByFile -w miroir-core -- cursorSdk.275.phase0
RUN_TEST=cursorSdk.275.phase0 npm run testByFile -w miroir-ai -- cursorSdk.275.phase0
RUN_TEST=cursorSdk.275.phase0 npm run testByFile -w miroir-standalone-app -- cursorSdk.275.phase0
```

### Realization

<Appended on completion.>

---

## Slice 1 — Tracer: snapshot `cursor`

**Status:** ⬜ pending

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
- #273 HTTP integ fixture that lists snapshot fields still passes after the field is added (update the pin in this slice).

### 1.2 GREEN

- Add optional `features.cursor` on client and server Jzod. `devBuild`.
- Extend `ProcessCapabilities`, `getProcessCapabilities`, `ProcessCapabilityName`, FAIL_CLOSED.
- Persistence-side read only. Do not put `cursor` on Electron renderer config.

### 1.3 Refactor checkpoint

- One line next to `features?.ai === true`. Do not copy `designerTools` default.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
RUN_TEST=cursorSdk.275.phase1 npm run testByFile -w miroir-core -- cursorSdk.275.phase1
npm run testByFile -w miroir-core -- 273-process-capability-switches
```

### Realization

<Appended on completion.>

---

## Slice 2 — CopilotKit `agents` branch + refuse

**Status:** ⬜ pending

### Goal

A CopilotKit POST with `aiConfig.backend: "cursor"` uses the `agents` map and omits `serviceAdapter` when the snapshot allows Cursor. Otherwise the route returns `FeatureUnavailable`.

**Layers cut:** `copilotKitRoute` → `CopilotRuntime` options → refuse helper

This slice uses a **test `AbstractAgent`**, not `@cursor/sdk`. R6: assert that frontend-forwarded `actions` are still passed into `CopilotRuntime` on this branch (filtered list from R5). If CopilotKit 1.59 cannot hold `agents` + forwarded actions together, **stop** and record in Realization. Do not start Slice 5.

### 2.1 RED

**Test:** `packages/miroir-ai/tests/unit/issues/275-cursor-sdk-copilotkit-backend/cursorSdk.275.phase2.unit.test.ts`

Behavior asserted:
- `backend: "cursor"` + snapshot `{ ai, cursor, mcp }` all true → runtime constructed with `agents.cursor` set and `serviceAdapter` omitted.
- `backend: "cursor"` + `cursor: false` → `FeatureUnavailable` `capability: "cursor"`.
- `backend: "cursor"` + `mcp: false` → `FeatureUnavailable` `capability: "mcp"`.
- Token path (no `backend`) still uses `buildCopilotRuntime` + adapter when `AI_PROVIDER_TYPE` is set.
- Cursor branch `actions` names do not include `generateMiroirReport` or `getMiroirContext`. Lend executor / POST helper may remain.
- Injected test agent’s `run` is what the runtime holds (no `Agent.create`).

### 2.2 GREEN

- Branch in `createCopilotKitRouter` on `body.aiConfig.backend`.
- `isCursorBackendAllowed`.
- Factory seam `createCursorAbstractAgent` injectable for tests.

### 2.3 Refactor checkpoint

- Do not call `getApiKey` for Cursor.
- Keep token `/health` working.

### Validation

```bash
RUN_TEST=cursorSdk.275.phase2 npm run testByFile -w miroir-ai -- cursorSdk.275.phase2
```

### Realization

<Appended on completion.>

---

## Slice 3 — `aiCursorKey` + health

**Status:** ⬜ pending

### Goal

An operator can import `CURSOR_API_KEY` as `aiCursorKey`. `/health` mentions it.

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

<Appended on completion.>

---

## Slice 4 — Lazy SDK, dummy cwd, MCP loopback, Node floor

**Status:** ⬜ pending

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

### 4.3 Refactor checkpoint

- Dispose agent (`await using` / `asyncDispose`) so tests do not leak.

### Validation

```bash
RUN_TEST=cursorSdk.275.phase4 npm run testByFile -w miroir-ai -- cursorSdk.275.phase4
npx tsc --noEmit --skipLibCheck -p packages/miroir-ai/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 5 — `propose_*` rename + lend form

**Status:** ⬜ pending

### Goal

A person sees `propose_generateMiroirEntity` and `propose_lendDocument` as review forms. Fire-and-forget CopilotKit `lendDocument` is gone. MCP `Library_lendDocument` remains the execute name.

**Layers cut:** `AiActionsProvider.tsx` → proposal form → existing lend POST

**Gate:** Slice 2 Realization must say frontend `actions` still forward on the `agents` branch. If not, this slice stays pending.

### 5.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/275-cursor-sdk-copilotkit-backend/cursorSdk.275.phase5.unit.test.ts` (source-text + existing `AiProposalForms` if it pins names).

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
```

### Realization

<Appended on completion.>

---

## Slice 6 — Picker sends `aiConfig.backend`

**Status:** ⬜ pending

### Goal

A person with snapshot `cursor` true can pick Cursor. The CopilotKit client includes `aiConfig.backend: "cursor"` on POSTs. Snapshot `cursor` false hides the pick.

**Layers cut:** AppBar / AI shell → sessionStorage → CopilotKit request properties

### 6.1 RED

**Test:** `cursorSdk.275.phase6.unit.test.ts` in standalone `4_view`.

Behavior asserted:
- Helper `readMiroirAiBackend()` / `writeMiroirAiBackend("cursor")` uses key `miroirAiBackend`.
- Component or hook that builds CopilotKit extra body includes `aiConfig.backend: "cursor"` only when pick is cursor **and** `processCapabilities.cursor === true`.
- No `4_view` file imports `getProcessCapabilities` from miroir-core (source-text, same pin as #273).

### 6.2 GREEN

- Picker next to the AI AppBar controls. Default omitted pick = token `AI_PROVIDER_TYPE`.

### 6.3 Refactor checkpoint

- Stale `ViewParams.agents` comment on `AgentsCopilotKit.tsx:6-8`.

### Validation

```bash
RUN_TEST=cursorSdk.275.phase6 npm run testByFile -w miroir-standalone-app -- cursorSdk.275.phase6
```

### Realization

<Appended on completion.>

---

## Slice 7 — Electron dummy cwd + packaging

**Status:** ⬜ pending

### Goal

Electron main uses the same factory, a dummy cwd outside the renderer, and either ships `@cursor/sdk` natives or fails loud when they are missing.

**Layers cut:** `ipcServerSetup.ts` → electron-builder `files` → source-text

### 7.1 RED

**Test:** `cursorSdk.275.phase7.unit.test.ts` (source-text in standalone-app or electron package).

Behavior asserted:
- `ipcServerSetup.ts` has no static `import "@cursor/sdk"`.
- Dummy cwd path is not `getDefaultFilesystemFolder()` itself.
- `package.json` electron-builder `files` (or an extraResources rule) includes the native SDK pattern **or** a named startup function `assertCursorSdkPackaged` is called and tested.
- `features.cursor` is still only on `electronServerConfig`, not the renderer object.

### 7.2 GREEN

- Wire factory from main. Add builder files / fail-loud helper.
- Optional: set `features.cursor: true` on main only when you intend to ship the natives in this issue’s GREEN. If packaging is not ready, keep main `cursor` false and still land the fail-loud helper (Realization must say which).

### 7.3 Refactor checkpoint

- Re-read #273 “no features on renderer”.

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

### 8.1 Nonreg

- Add `unit-275-cursor-sdk` to `scripts/nonreg-manifest.json` (tier `unit`, bash `-c` like `unit-273-process-capabilities`).

### 8.2 Docs

- `docs/reference/process-capabilities.md`: `ai` is the CopilotKit shell; `features.cursor` is the optional SDK; Node 22.13+; no `ai`⇒`mcp` OR.
- `analysis.md` status → implemented when slices are done.
- `AgentsCopilotKit` / `/health` comments match reality.

### 8.3 Issue-directory cleanup

- Keep issue-dir tests as the nonreg pin for this issue (#238 migrate later), same as #273 Slice 10, **or** move to feature-named files if a review requires it. Default: keep `issues/275-*` until a later cleanup issue.

### 8.4 Tracer bullet (narrative)

1. Persistence config: `features.ai`, `features.mcp`, `features.cursor` true. Restart `miroir-server` on Node ≥ 22.13. `CURSOR_API_KEY` imported.
2. Open the app, open AI Assistant. Pick Cursor.
3. Ask for Library instances. Agent calls `Miroir_getInstances` on loopback `/mcp`.
4. Ask to lend a book via MCP. `Library_lendDocument` runs (no form).
5. Ask to propose a lend. Sidebar shows `propose_lendDocument`. Accept posts `/lendDocument`.
6. Electron unpacked/packaged: same pick, no renderer `getProcessCapabilities`, no `app://` CopilotKit URL.

Automated equivalent: phase1 snapshot + phase2 router + phase5 names + phase6 body.

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
| Pick in sessionStorage + POST | phase6 | ⬜ |
| Refuse cursor/mcp | phase2 | ⬜ |
| Electron + packaging or fail-loud | phase7 | ⬜ |
| Do not delete runtime execute list | phase0/2 filtered Cursor actions only | ⬜ |

### Validation

```bash
npm run nonreg -- --only unit-275-cursor-sdk
```

### Realization

<Appended on completion.>
