# Issue #409 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Tests go through the process's public wiring: `getProcessCapabilities`, `createCopilotKitRouter` driven by real HTTP requests (an Express app on `node:http`, as the #275 tests do), the server and Electron start paths, and a child Node process that records which modules it loads.
> No mocks. The agent SDKs are replaced by stub packages resolved through an injected importer or a module hook, which keeps tests offline and free of API keys. The tracer bullet proves that `agentBackend: "cursor"` gives today's Cursor chat through the new config and capability.
>
> **Execution model:** one green commit per slice (A's flow for sizeable work, memory `dev-workflow-preferences`). Each slice ends with its Validation commands; on success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/409
Prerequisite: [`../275-FEATURE-cursor-sdk-copilotkit-backend/`](../275-FEATURE-cursor-sdk-copilotkit-backend/) ✅
Working branch: `claude/409-claude-agent-sdk-backend`

**Resume note:** Slices 0, 1 and 2 DONE. Slice 3 waits on A's choice about the nested zod 4 install.

---

## Scope

- G1: pick `cursor`, `claude` or `none` in the environment config before start.
- G2: chat with a Claude agent that uses the Miroir MCP tools.
- G3: a process loads only the SDK of the picked backend, and no agent SDK with `none`.
- G4: the Docker image carries only the picked SDK; packaged Electron carries none.
- G5: code shared by agent backends lives in one module.

This plan does **not** make the token provider SDKs lazy (#410), give the Claude agent built-in tools, use in-process MCP tools, ship agent SDKs in packaged Electron, or migrate Miroir to zod 4 (#375).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the Cursor pick and module loading | ✅ | `agentBackend.409.phase0` (unit + child-process probe) |
| 1 | `agentBackend` config drives the Cursor chat (tracer) | ✅ | `agentBackend.409.phase1` |
| 2 | Browser asks for "the agent" and names the backend | ✅ | `agentBackend.409.phase2` (standalone-app) |
| 3 | Claude agent chat through the shared bridge | ⬜ | `agentBackend.409.phase3` (miroir-ai) |
| 4 | Only the picked SDK is loaded, `miroir-ai` lazy in the server | ⬜ | `agentBackend.409.phase4` (child-process probe) |
| 5 | Start checks: packaged SDK, Electron, `miroir-env check` alias warning | ⬜ | `agentBackend.409.phase5` |
| 6 | Docker image keeps only the picked SDK | ⬜ | `scripts/tests/test_dockerfile_agent_backend.py` |
| 7 | Nonreg, docs, cleanup, AC | ⬜ | nonreg step `unit-409-agent-backend` + full nonreg |

---

## Locked implementation defaults

| # | Decision | Choice | Serves |
|---|---|---|---|
| D1 | Claude SDK | `@anthropic-ai/claude-agent-sdk` (pinned exact, 0.3.288 at plan time) | G2 |
| D2 | Config | `features.agentBackend: "cursor" \| "claude" \| "none"` (default `"none"`); `features.cursor: true` read as `"cursor"` when `agentBackend` is absent, for one release; `agentBackend` wins on conflict | G1 |
| D3 | `none` | Agent SDKs only; `features.ai` keeps governing CopilotKit and token chat | G1, G3 |
| D4 | Server | `import("miroir-ai")` only when `ai` is on | G3 |
| D5 | Code location | `miroir-ai`: `runtime/agentBridge.ts` + thin `cursorAgent.ts` / `claudeAgent.ts`, one dynamic SDK import each | G3, G5 |
| D6 | Docker | `ARG AGENT_BACKEND=none`, delete the SDKs not picked after `npm prune --omit=dev` | G4 |
| D7 | Claude key | Secret `aiAnthropicKey`, passed through the SDK `env` option with `PATH` and `HOME` (the option replaces the subprocess environment) | G2 |
| D8 | Browser | Capabilities expose `agentBackend`; toggle when not `none`, labelled with the backend; pick `"agent"` in session storage and `aiConfig.backend`; server accepts `"cursor"` as alias for one release | G1, G2 |
| D9 | Model | `claude-opus-5-5`, override `features.agentModel` | G2 |
| D10 | Claude tools | `tools: []`, `allowedTools: ["mcp__miroir__*"]`, `strictMcpConfig: true`, `settingSources: []`, scratch cwd `.miroir-claude-cwd` | G2 |
| D11 | Packaged Electron | Ships neither SDK; a picked backend whose SDK is missing fails at start | G4 |
| D12 | Proof of G3 | Child-process probe with a `module.register` resolve hook, plus injected-importer unit tests | G3 |

Capability rename that follows from D2/D8: `ProcessCapabilities.cursor` → `agentBackend`; `ProcessCapabilityName` `"cursor"` → `"agent"`; `isCursorBackendAllowed` → `isAgentBackendAllowed` (`ai && mcp && agentBackend !== "none"`).

---

## Allocated UUIDs / keys

No new model element: the change is process wiring, config schema and `miroir-ai` code.

| Artefact | Value |
|---|---|
| Issue test directories | `tests/**/issues/409-agent-backend/` in `miroir-core`, `miroir-ai`, `miroir-standalone-app`, `miroir-server`, `miroir-standalone-app-electron`, `miroir-env` as needed |
| Module-load probe | `packages/miroir-ai/tests/support/moduleLoadProbe.ts` (child-process launcher) + `moduleLoadProbeHook.mjs` (resolve hook) |
| SDK stub packages (test only) | `packages/miroir-ai/tests/support/sdkStubs/cursor-sdk.mjs`, `claude-agent-sdk.mjs` |
| Nonreg step | `unit-409-agent-backend` (scopes `external`, `tooling`) |

**Vehicle:** vitest throughout. Not reachable through MiroirTest because the behaviors are process start-up wiring, an Express route and module loading, none of which is expressed as ML model data.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Core capability tests | `npm run testByFile -w miroir-core -- 409-agent-backend` |
| `miroir-ai` tests | `npm run testByFile -w miroir-ai -- 409-agent-backend` |
| Browser tests | `npm run testByFile -w miroir-standalone-app -- 4_view/issues/409-agent-backend` |
| Existing #275 / #273 suites | `npm run testByFile -w miroir-core -- 275-cursor-sdk-copilotkit-backend` (same for `miroir-ai`, `miroir-standalone-app`), `npm run testByFile -w miroir-core -- 273-process-capability-switches` |
| Schema rebuild | `npm run devBuild -w miroir-core` (schemas are in `getMiroirFundamentalMlSchema.ts`, no `miroir-app-miroir` asset changes) |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` for each touched package |
| Pre-push gate | the `AGENTS.md` gate (`sync_agent_skills --check`, `pytest scripts/tests`, `check_dependency_policy.py`, `npm run lint`, `miroir-env check --strict --tracked-clean`, core `tsc`, core unit tests) |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared` (after slices 3 and 6, and in slice 7) |

---

## Slice 0 — Characterize the Cursor pick and module loading

**Status:** ✅ DONE

### Goal

Lock today's behavior before the rename: which requests reach the Cursor agent, which are refused, and which SDK modules a process loads. Build the module-load probe that slices 4 and #410 reuse.

### 0.1 RED → GREEN — module-load probe

**Test:** `packages/miroir-ai/tests/unit/issues/409-agent-backend/agentBackend.409.phase0.unit.test.ts`

The probe starts `node --import <hook>` on a small entry script, with the hook recording every resolved specifier and redirecting `@cursor/sdk` and `@anthropic-ai/claude-agent-sdk` to the stubs. The entry script builds `createCopilotKitRouter` with given capabilities and optionally sends one request.

Behavior asserted:
- importing `miroir-ai` and building the router with `cursor: true` loads no `@cursor/sdk` until a Cursor request arrives (today's behavior);
- after one `"cursor"` request, `@cursor/sdk` is in the resolved set;
- today, importing `miroir-ai` loads `openai`, `@anthropic-ai/sdk` and `@copilotkit/runtime` eagerly (characterization of the #410 gap, not a target).

### 0.2 Characterize the route

Existing #275 tests already lock the 403 refusals (`cursorSdk.275.phase2/phase4`). Slice 0 only adds what they miss: a request with `aiConfig.backend: "cursor"` reaches the injected Cursor agent factory exactly once per runtime build.

### Refactor checkpoint

None: no production code changes.

### Validation

```bash
npm run testByFile -w miroir-ai -- 409-agent-backend
npm run testByFile -w miroir-ai -- 275-cursor-sdk-copilotkit-backend
npx tsc --noEmit --skipLibCheck -p packages/miroir-ai/tsconfig.json
```

### Realization

- Probe files in `packages/miroir-ai/tests/support/`: `moduleLoadProbe.ts` (launcher, `runModuleLoadProbe` + `loadedAgentSdks`), `moduleLoadProbeRegister.mjs` (`--import` entry calling `module.register`), `moduleLoadProbeHooks.mjs` (resolve hook appending each specifier to a file, stub redirection), `moduleLoadProbeChild.mjs` (builds the router from the built package with recording runtime seams, sends one request), `sdkStubs/{cursor-sdk,claude-agent-sdk}.mjs`.
- `agentBackend.409.phase0.unit.test.ts` locks three facts: building the router loads no agent SDK; one `"cursor"` request returns 200 and loads only `@cursor/sdk`; importing `miroir-ai` loads `openai` and `@anthropic-ai/sdk` eagerly (#410 gap).
- 0.2 needed no new test: `cursorSdk.275.phase4` already asserts that a `"cursor"` request reaches the injected factory.
- The container's `node_modules` and `dist/` were stale; `npm ci` and `./build-all.sh` ran first. `devBuild` rewrote only the timestamp of `miroirFundamentalType.ts`, which was reverted.

---

## Slice 1 — `agentBackend` config drives the Cursor chat (tracer)

**Status:** ✅ DONE

### Goal

An environment with `features.agentBackend: "cursor"` gives the same Cursor chat as `features.cursor: true` today, and `features.cursor: true` alone still works.

### 1.1 RED — capabilities

**Test:** `packages/miroir-core/tests/1_core/issues/409-agent-backend/agentBackend.409.phase1.unit.test.ts`

- `getProcessCapabilities` returns `agentBackend: "cursor"` for `agentBackend: "cursor"`, for `cursor: true` alone, and `"none"` when both are absent;
- `agentBackend: "none"` with `cursor: true` gives `"none"` (explicit value wins);
- `isAgentBackendAllowed` is true only with `ai`, `mcp` and a backend other than `"none"`;
- `FAIL_CLOSED_PROCESS_CAPABILITIES.agentBackend` is `"none"`;
- a config with `features.agentBackend: "claude"` and `features.agentModel` validates against the generated Zod schema for client, server and environment configs.

### 1.2 RED — route

**Test:** `packages/miroir-ai/tests/unit/issues/409-agent-backend/agentBackend.409.phase1.unit.test.ts`

- with `agentBackend: "cursor"`, requests with `aiConfig.backend: "agent"` and `"cursor"` both reach the injected Cursor factory;
- with `agentBackend: "none"`, the same requests get 403 `FeatureUnavailable` with `errorContext.capability: "agent"`.

### GREEN

- Schema: add `agentBackend` (enum) and `agentModel` (string) to the three `features` objects in `getMiroirFundamentalMlSchema.ts`; `npm run devBuild -w miroir-core`.
- `processCapabilities.ts`: replace `cursor` by `agentBackend`, `"cursor"` by `"agent"`, `isCursorBackendAllowed` by `isAgentBackendAllowed`; update `FAIL_CLOSED_PROCESS_CAPABILITIES` and `index.ts` exports.
- `copilotKitRoute.ts`: `resolveBackendPick` returns `"agent"` for `"agent"` or `"cursor"`; the runtime's agent map keys stay `default` + the backend name.
- Update readers listed in analysis §4.1 that would not compile (`ipcServerSetup.ts`, `AppBar.tsx`, `AgentsCopilotKit.tsx` read `agentBackend === "cursor"` for now; slice 2 generalizes them).
- Update the 11 existing #273 / #275 test files that read `cursor` in capabilities.

### Refactor checkpoint

Remove the `cursorRefuseCapability` helper if `"agent"` makes it a constant.

### Validation

```bash
npm run devBuild -w miroir-core
npm run testByFile -w miroir-core -- 409-agent-backend
npm run testByFile -w miroir-core -- 273-process-capability-switches
npm run testByFile -w miroir-core -- 275-cursor-sdk-copilotkit-backend
npm run build -w miroir-core && npm run testByFile -w miroir-ai -- 409-agent-backend
npm run testByFile -w miroir-ai -- 275-cursor-sdk-copilotkit-backend
npm run testByFile -w miroir-standalone-app -- 4_view/issues/275-cursor-sdk-copilotkit-backend
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json   # and miroir-ai, miroir-standalone-app, miroir-standalone-app-electron, miroir-server
npm run nonreg:filesystem -- --runner shared --scope smoke,core,external
```

### Realization

- Schema: `agentBackend` (enum `cursor`, `claude`, `none`) and `agentModel` (string) added next to `cursor` in the three `features` objects; `devBuild` regenerated `miroirFundamentalMlSchema.ts` and `miroirFundamentalType.ts`.
- `processCapabilities.ts`: new exported type `AgentBackend`; `ProcessCapabilities.cursor` → `agentBackend`; capability name `"cursor"` → `"agent"`, which `assertProcessCapability` checks as `agentBackend !== "none"`; `isCursorBackendAllowed` → `isAgentBackendAllowed`.
- Route: `resolveBackendPick` returns `"agent"` for `"agent"` and `"cursor"`; the router option `createCursorAbstractAgent` became `createAgentForBackend(backend)`; `cursorRuntimeAgents` → `agentRuntimeAgents(agent, backend)`; until slice 3 the default factory refuses `claude` with a 503.
- Deviation: the route now always answers 403 when `isAgentBackendAllowed` is false. Before, a snapshot with `cursor` and `mcp` on but `ai` off fell through `assertProcessCapability("cursor")` and reached the agent; it now reports capability `"ai"`.
- Readers outside tests read `agentBackend === "cursor"` (`ipcServerSetup.ts`, `AppBar.tsx`, `AgentsCopilotKit.tsx`); slice 2 generalizes the browser ones.
- Updated existing tests: `miroir-core` 273 phase 1 and 2, 275 phase 0 and 1; `miroir-ai` 275 phase 2 and 4, 409 phase 0; `miroir-standalone-app` 273 phase 2 and 3, 275 phase 6. `miroir-standalone-app` `tsc` reports only the existing MUI `Grid` errors in files this slice does not touch.

---

## Slice 2 — Browser asks for "the agent" and names the backend

**Status:** ✅ DONE

### Goal

The AppBar toggle appears when `agentBackend` is not `"none"`, is labelled "Cursor" or "Claude", and the chat sends `aiConfig.backend: "agent"`.

### 2.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/409-agent-backend/agentBackend.409.phase2.unit.test.ts`

- with capabilities `agentBackend: "claude"`, the toggle's accessible name is "Claude"; with `"none"`, there is no toggle;
- after a click, session storage holds `"agent"` and `AgentsCopilotKit` passes `aiConfig: { backend: "agent" }`;
- a stale session value `"cursor"` is read as `"agent"`.

### GREEN

`miroirAiBackend.ts` (`MiroirAiBackendPick = "agent"`), `AppBar.tsx` (condition, label, tooltip), `AgentsCopilotKit.tsx` (condition, property).

### Refactor checkpoint

Rename identifiers that still say "cursor" in these files (`useCursorBackend` → `useAgentBackend`).

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- 4_view/issues/409-agent-backend
npm run testByFile -w miroir-standalone-app -- 4_view/issues/275-cursor-sdk-copilotkit-backend
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,external
```

### Realization

- New `routes/ai/agentBackendPick.ts`: `agentBackendLabel(capabilities)` ("Cursor", "Claude", or `undefined` for `none`) and `agentRequestProperties(pick, agentBackend)` (`{ aiConfig: { backend: "agent" } }` only when the agent is picked and a backend is configured).
- `miroirAiBackend.ts`: `MiroirAiBackendPick = "agent"`; stored `"agent"` and stale `"cursor"` both read as `"agent"`; writes store `"agent"`.
- `AppBar.tsx`: the toggle shows when the label is defined; its `aria-label` and tooltip name the backend. `AgentsCopilotKit.tsx` builds its CopilotKit properties with `agentRequestProperties`.
- Refactor checkpoint: no `cursor`-named identifiers were left in these files after the change, so no rename was needed.
- Updated the #275 phase 6 source-scan test for the new names.
- Scoped nonreg `smoke,ui,external`: 40 passed, 0 failed.

---

## Slice 3 — Claude agent chat through the shared bridge

**Status:** ⬜ pending

### Goal

With `agentBackend: "claude"`, a chat request runs a Claude agent session and streams its text and CopilotKit tool calls back as AG-UI events.

### 3.1 RED

**Test:** `packages/miroir-ai/tests/unit/issues/409-agent-backend/agentBackend.409.phase3.unit.test.ts`

Through the router with an injected `importSdk` returning the Claude stub (its `query` yields an `assistant` text message, an `assistant` message with a `tool_use` block for a CopilotKit tool, then a `result` message):
- the response stream carries the text and one tool call event for the CopilotKit tool;
- the stub received `model: "claude-opus-5-5"` (or `features.agentModel`), `tools: []`, `allowedTools: ["mcp__miroir__*"]`, `mcpServers.miroir = { type: "http", url: <mcpHttpUrl> }`, `settingSources: []`, a cwd ending in `.miroir-claude-cwd`, and `env.ANTHROPIC_API_KEY` from `aiAnthropicKey`;
- `ANTHROPIC_API_KEY` is not added to `process.env`;
- a missing `aiAnthropicKey` returns the same error shape as a missing `aiCursorKey`.

### GREEN

- `npm install @anthropic-ai/claude-agent-sdk@0.3.288 -w miroir-ai --save-exact`; check `npm ls zod` (root 3.25.76, nested 4.x under `miroir-ai`) and `check_dependency_policy.py`.
- Extract `runtime/agentBridge.ts` from `cursorAgent.ts`: prompt building, tool fences, AG-UI event emission, scratch cwd, MCP URL, and an `AgentSession` seam (`send(prompt) → AsyncIterable<message>`).
- `cursorAgent.ts` keeps the Cursor session factory; `claudeAgent.ts` adds the Claude one, with `defaultImportSdk = () => import("@anthropic-ai/claude-agent-sdk")`.
- `createAgentForBackend(backend, options)` in `agentBridge.ts`; the route calls it instead of naming Cursor.

### Refactor checkpoint

`cursorAgent.ts` holds only Cursor-specific code; the #275 `miroir-ai` tests pass unchanged, except imports that moved to `agentBridge.ts`.

### Validation

```bash
npm run testByFile -w miroir-ai -- 409-agent-backend
npm run testByFile -w miroir-ai -- 275-cursor-sdk-copilotkit-backend
npx tsc --noEmit --skipLibCheck -p packages/miroir-ai/tsconfig.json
python scripts/check_dependency_policy.py
npm run build -w miroir-ai
npm run nonreg:filesystem -- --runner shared   # full run
```

### Realization

_(pending)_

---

## Slice 4 — Only the picked SDK is loaded; `miroir-ai` lazy in the server

**Status:** ⬜ pending

### Goal

G3 holds for real processes: with `none`, `cursor` or `claude`, a process loads only the expected SDK, and the server loads no `miroir-ai` when `ai` is off.

### 4.1 RED

**Test:** `packages/miroir-ai/tests/unit/issues/409-agent-backend/agentBackend.409.phase4.unit.test.ts` (child-process probe from slice 0)

For each backend, the child builds the router and sends one agent request:
- `none`: neither `@cursor/sdk` nor `@anthropic-ai/claude-agent-sdk` is resolved (the request is refused);
- `cursor`: only `@cursor/sdk`;
- `claude`: only `@anthropic-ai/claude-agent-sdk`.

**Test:** `packages/miroir-server/tests/issues/409-agent-backend/serverAiImport.409.phase4.unit.test.ts` (first vitest file in `miroir-server`, which has a `test` script but no tests yet; add `testByFile` and a `vitest.config.ts` like `miroir-env`'s)
- the extracted mount function resolves `miroir-ai` only when `capabilities.ai` is true (child-process probe).

### GREEN

Move the CopilotKit mount in `server.ts` (lines 931-951) into `src/mountCopilotKitRoute.ts`, a function that does `await import("miroir-ai")` when `shouldMountCopilotKitRoute(capabilities.ai)`; remove the static import at line 10.

### Refactor checkpoint

Share the mount function's shape with `ipcServerSetup.ts` if both end up identical.

### Validation

```bash
npm run testByFile -w miroir-ai -- 409-agent-backend
npm run testByFile -w miroir-server -- 409-agent-backend
npx tsc --noEmit --skipLibCheck -p packages/miroir-server/tsconfig.json
npm run build:server -w miroir-server
npm run nonreg:filesystem -- --runner shared --scope smoke,external
```

### Realization

_(pending)_

---

## Slice 5 — Start checks: packaged SDK, Electron, alias warning

**Status:** ⬜ pending

### Goal

A process whose picked SDK is missing fails at start with a message naming the backend; `miroir-env check` warns about `features.cursor`.

### 5.1 RED

**Tests:**
- `packages/miroir-ai/tests/unit/issues/409-agent-backend/agentBackend.409.phase5.unit.test.ts`: `assertAgentSdkPackaged("claude")` throws with a message naming `@anthropic-ai/claude-agent-sdk` and `features.agentBackend` when it cannot resolve; `"none"` never throws.
- `packages/miroir-env/tests/issues/409-agent-backend/cursorAlias.409.phase5.unit.test.ts`: `check` on an environment with `features.cursor` reports a warning naming `agentBackend`; with both set and different, the warning says `agentBackend` wins.
- `electronBundle.unit.test.ts` (existing): `EXTERNALS` also contains `@anthropic-ai/claude-agent-sdk`.

### GREEN

Generalize `assertCursorSdkPackaged.ts` to `assertAgentSdkPackaged.ts` (keep the old export as a wrapper for one release or delete it if unused); `ipcServerSetup.ts` calls it when packaged and `agentBackend !== "none"`; add the SDK to `bundle-main.mjs` `EXTERNALS`; add the warning in `miroir-env`.

### Refactor checkpoint

Delete `assertCursorSdkPackaged` if no caller remains.

### Validation

```bash
npm run testByFile -w miroir-ai -- 409-agent-backend
npm run testByFile -w miroir-env -- 409-agent-backend
npm run testByFile -w miroir-standalone-app -- electronBundle
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app-electron/tsconfig.json
npm run miroir-env -- check --strict --tracked-clean
npm run nonreg:filesystem -- --runner shared --scope smoke,external,tooling
```

### Realization

_(pending)_

---

## Slice 6 — Docker image keeps only the picked SDK

**Status:** ⬜ pending

### Goal

`docker build --build-arg AGENT_BACKEND=<backend>` produces an image with only that SDK; the default is `none`.

### 6.1 RED

**Test:** `scripts/tests/test_dockerfile_agent_backend.py` (pytest, part of the pre-push gate): parses `Dockerfile` and asserts an `ARG AGENT_BACKEND=none` and a removal step after `npm prune --omit=dev` that deletes `@cursor/sdk*` unless `cursor` and `@anthropic-ai/claude-agent-sdk*` unless `claude`. Docker builds themselves are not run in CI or in cloud sessions; the slice's manual check is one local build per value.

### GREEN

`Dockerfile`: `ARG AGENT_BACKEND=none` in the builder stage, one `RUN` after the prune. `environments/docker.json` documents `agentBackend` matching the default.

### Refactor checkpoint

None expected.

### Validation

```bash
python -m pytest scripts/tests/test_dockerfile_agent_backend.py -q
# manual, on a machine with Docker:
docker build --build-arg AGENT_BACKEND=claude -t miroir:claude . && docker run --rm miroir:claude ls node_modules/@anthropic-ai
npm run nonreg:filesystem -- --runner shared   # full run
```

### Realization

_(pending)_

---

## Slice 7 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### Goal

The feature is covered by nonreg, documented, and the issue-scoped tests are folded into feature-named suites.

### Steps

- Nonreg: add step `unit-409-agent-backend` (scopes `external`, `tooling`) to `scripts/nonreg-manifest.json`; adjust `unit-275-cursor-sdk` if its tests moved.
- Docs: `docs/reference/process-capabilities.md` (`agentBackend`, `agentModel`, the `"agent"` refusal, alias), `docs/guides/using-ai.md` (Claude backend, `AI_ANTHROPIC_KEY`, Docker build argument, packaged Electron limit).
- Cleanup: migrate the lasting assertions of `issues/409-agent-backend/` (and the #275 Cursor route tests they supersede) into feature-named suites (`agentBackend.unit.test.ts` per package), then delete the issue directories per `docs/contributing/testing.md`.
- Tracer narrative: with `environments/dev.json` + `"agentBackend": "claude"` and `AI_ANTHROPIC_KEY` imported, start the server and the client, turn the "Claude" toggle on, ask for a new Report: the agent calls Miroir MCP tools. Automated equivalent: slice 3 route test plus slice 4 probe.

### AC checklist

| Acceptance criterion (#409) | Proof |
|---|---|
| The environment config selects `cursor`, `claude` or `none`, and the capabilities report it | slice 1 core test |
| Each backend loads only its SDK; `none` loads neither | slice 4 child-process probe |
| A Claude chat runs through CopilotKit with Miroir MCP tools | slice 3 route test + tracer narrative |
| Web client and Electron main bundle contain neither SDK | `electronBundle.unit.test.ts` (slice 5) + existing web bundle budget tests |
| Packaged Electron fails clearly when the picked SDK is missing | slice 5 test |

### Validation

```bash
# AGENTS.md pre-push gate, then:
npm run nonreg:filesystem -- --runner shared
```

### Realization

_(pending)_
