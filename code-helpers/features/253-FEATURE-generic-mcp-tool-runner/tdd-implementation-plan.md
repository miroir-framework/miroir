# Issue #253 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> each slice after 0 delivers **one thing a user or runner can do**, cutting every layer that
> behavior needs (schema → instance → MCP `tools/call` → view → report section), each cut thin.
> No mocks. Tracer: from `reportMiroirRunners`, submit `mcpGetInstances` and see seeded `book1`.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/253  
Prerequisites: [`../229-FEATURE-dynamic-mcp-endpoint-tools/`](../229-FEATURE-dynamic-mcp-endpoint-tools/) ✅ · [`../248-FIX-mcp-tools-list-payload-size/`](../248-FIX-mcp-tools-list-payload-size/) ✅  
Parent: [#193](https://github.com/miroir-framework/miroir/issues/193)

**Resume note:** Slice 1 done. Next is Slice 2 (`runner_mcp_lend_document` on LibraryHome, `resultPresentation: "status"`).

---

## Scope

- `mcpToolRunner` consumed through MCP `tools/call` (not DomainController / `actionRunner` wrap).
- First behavior: query `Miroir_getInstances` (payload is the product).
- Second behavior: effect `Library_lendDocument` (success/failure only) on the **same** path.
- D3-b / D4-a / D5-b / D6-a / D7-b as locked below.

This plan does **not** add a `tools/list` picker or JSON Schema → mlSchema. It does **not** replace Library `actionRunner` `cc853632-…` / `98a38a84-…`. It does **not** use in-process `registry.callTool` as the UI path. CopilotKit stays on #193.

---

## Why the previous slices were not vertical

| Old slice | What it produced | Why it failed the verticality rule |
|---|---|---|
| 1 Schema + two instances | Types and JSON | No one can *run* a tool |
| 2 `resolveMcpToolAction` | Exported helper | Helper with no new user/runner behavior (rejected by the skill) |
| 3 `/mcp` + query helper | Transport + `runMcpToolRunner` | Client without a stored Runner the UI can open |
| 4 Effect helper | Second tool on the helper | Still no view / report |
| 5 View + reports | UI at last | Widens after the path already existed in pieces |
| 6 `runnerTest` host | Test harness | Harness as its own product |

Correct shape: **one query path through all layers**, then **deepen** with the effect tool on that same interface.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize current contracts | ✅ | `mcpToolRunner.253.phase0.unit.test.ts` |
| 1 | Tracer: run `mcpGetInstances` end-to-end | ✅ | `runner_mcp_get_instances` |
| 2 | Same path: run `mcpLendDocument` (status only) | ⬜ | `runner_mcp_lend_document` |
| 3 | Nonreg, docs, cleanup, AC | ⬜ | nonreg steps + tracer narrative |

---

## Locked implementation defaults

| Decision | Choice |
|---|---|
| D1 | `mcpToolRunner` = `{ runnerType, toolName, resultPresentation }` |
| D2 | Query `Miroir_getInstances` then effect `Library_lendDocument` |
| D3 | Form Jzod = Endpoint action payload whose #229 name equals `toolName` (`toolNameFor` / `listTools` order). Resolver is **not** a deliverable; it lives behind the Runner |
| D4 | `resultPresentation`: `"payload"` \| `"status"`. Always snackbar. Result panel only for `"payload"` |
| D5 | Query Runner in Miroir data; effect Runner in Library model. Miroir uuid added to `MIROIR_DATA_RUNNER_UUIDS` |
| D6 | `/mcp` on the API Express `app` + Vite proxy `/mcp`; keep :4080. Test host may use an ephemeral port on that same handler |
| D7-b | Slice 1 adds a section on `reportMiroirRunners`. Slice 2 adds a section on `LibraryHome`. Do not remove `lendBook` / `returnBook` |
| Snackbar | Map MCP `{ status, error.message }` → Action2Error-shaped input before `handleAsyncAction` |
| Shared submit | UI and `runnerTest` host call the **same** `runMcpToolRunner` (HTTP `tools/call`) |
| EntityVersion snapshot | Edit present-model Entity `e54d7dc1-…` only |

---

## Allocated UUIDs / keys

| Artefact | Value | Landed in |
|---|---|---|
| Runner `mcpGetInstances` | `897e9711-65a0-414e-9773-19de92ade533` | Slice 1 |
| Runner `mcpLendDocument` | `dbb39e31-5c7d-4473-9adb-5286e2972e46` | Slice 2 |
| MiroirTest `runner_mcp_get_instances` | `a2e0a33f-222d-4334-870c-baaffd307e1d` | Slice 1 |
| MiroirTest `runner_mcp_lend_document` | `a6fc85c8-83ad-4c8f-a6e0-6f9d17713159` | Slice 2 |
| Nonreg query | `integ-runner-runner_mcp_get_instances` | Slice 3 |
| Nonreg effect | `integ-runner-runner_mcp_lend_document` | Slice 3 |

Seed literals: Library `5af03c98-…`; Book `e8ba151b-…`; `book1` `caef8a59-39eb-48b5-ad59-a7642d3a1e8f`; `user1` `04c371ed-702d-4dd9-a06d-8a04eda5d24f`; LendingHistoryItem `e81078f3-…`; InstanceEndpoint `ed520de4-…`; Lending `212f2784-…`.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Slice 0 inventory | `RUN_TEST=mcpToolRunner.253.phase0 npm run testByFile -w miroir-standalone-app -- mcpToolRunner.253.phase0` |
| Query runnerTest | `npm run testMiroir -w miroir-standalone-app -- --suites runner_mcp_get_instances --mode integration --profile emulatedServer-filesystem` |
| Effect runnerTest | `npm run testMiroir -w miroir-standalone-app -- --suites runner_mcp_lend_document --mode integration` |
| Existing lend twin | `npm run testMiroir -w miroir-standalone-app -- --suites runner_lend_document --mode integration` |
| Miroir / Library assets | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` |
| | `npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Type check (packages touched in the slice) | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |

**Vitest exception:** Slice 0 only (inventory of existing JSON / Vite proxy). Slices 1–2 are MiroirTest `runnerTest`. Do not add a unit-test file whose only job is `resolveMcpToolAction` or `runMcpToolRunner`.

---

## Slice 0 — Characterize current contracts

**Status:** ✅ DONE

### Goal

Lock today’s schema arms, 8 Runners, 8 execute sections, the 6-uuid Miroir-data set, and “no `/mcp` on the Vite proxy” so Slice 1’s diff is reviewable.

### 0.1 RED → GREEN

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/253-generic-mcp-tool-runner/mcpToolRunner.253.phase0.unit.test.ts`

Not MiroirTest: file/schema inventory.

Behavior asserted (import **real** assets):

- Runner Entity union has exactly `customRunner` \| `actionRunner`.
- Exactly 8 Runner instances (analysis §3.2 names / types / uuids).
- `MIROIR_DATA_RUNNER_UUIDS` has exactly the 6 Miroir-data uuids.
- `reportMiroirRunners` has 5 `runnerReportSection`s; `LibraryHome` has 2; `Versioning` has 1.
- `vite.config.js` `server.proxy` has no `/mcp`.

GREEN: write the lock so it passes on HEAD.

### Validation

```bash
RUN_TEST=mcpToolRunner.253.phase0 npm run testByFile -w miroir-standalone-app -- mcpToolRunner.253.phase0
```

### Realization

Characterization lock landed at
`packages/miroir-standalone-app/tests/4_view/issues/253-generic-mcp-tool-runner/mcpToolRunner.253.phase0.unit.test.ts`
(5/5). Imports real deployment assets (`entityRunner`, 7 exported Runner instances,
`createApplication` via JSON file, `reportMiroirRunners` / `reportVersioning` /
`reportLibraryHome`). `MIROIR_DATA_RUNNER_UUIDS` is locked through
`resolveRunnerDefinitionApplication` (the Set is not exported): the 6 Miroir-data
uuids resolve to Miroir even on a Library page; lend/return and an unknown uuid
do not. Instance inventory walks Miroir / Library / Admin / standalone-app
`tests/assets` only (a whole-`packages` walk also hit MCP/server `tests/tmp` and
Electron release copies). No production code changed. Validation command: 5 passed.

---

## Slice 1 — Tracer: run `mcpGetInstances` end-to-end

**Status:** ✅ DONE

### Goal

As an application maintainer I can open **MCP: getInstances** on `reportMiroirRunners`, submit Library / `data` / Book, and see seeded `book1` in the result. Submit is MCP `tools/call`.

**Layers cut (each thin):** Entity schema → `mcpGetInstances` instance → `runMcpToolRunner` HTTP client → `runnerTest` host MCP → `StoredRunnerView` third branch + payload panel → one `runnerReportSection` → API `/mcp` + Vite proxy.

Not in this slice: `Library_lendDocument`, LibraryHome change, second instance.

### 1.1 RED

**Test:** MiroirTest `runner_mcp_get_instances` (`a2e0a33f-…`), `kind: "runnerTest"`, `runnerRef: 897e9711-…`.

Register in `UI_INTEGRATION_RUNNER_SUITE_REGISTRY`. One leaf, one logical assertion.

Behavior asserted:

- After submit of `mcpGetInstances` with Library + `data` + Book, the outcome is MCP success **and** the payload contains instance uuid `caef8a59-…` (`book1`).
- Execution is `tools/call` `Miroir_getInstances` (host uses `runMcpToolRunner`, not `testBuildPlusRuntimeCompositeActionSuiteForRunner` / `getFromParameters`).

Today this RED-fails: no `mcpToolRunner` type, no instance, host always wraps non-custom Runners as a composite action (`Runner.ts` 53–64).

### 1.2 GREEN (minimum through every layer)

Do **not** land a standalone helper library. Only what the test and the matching UI path need.

| Layer | Thin cut |
|---|---|
| Schema | Third union arm on Entity `e54d7dc1-…` (`toolName` + `resultPresentation`). `devBuild`. |
| Instance | `897e9711-…` Miroir data, `toolName: "Miroir_getInstances"`, `resultPresentation: "payload"`. Export it. Add uuid to `MIROIR_DATA_RUNNER_UUIDS`. |
| Resolve form | Enough to build getInstances fields from `currentModel` + `toolNameFor` (inline or a private function next to the view/host — **not** a published feature). |
| Submit | `runMcpToolRunner(runner, args, serverUrl)` → existing Streamable HTTP client (`mcpClient.ts` promoted only if the view/host must import it). |
| Host | If `runnerType === "mcpToolRunner"`, start MCP on the session DomainController (same pattern as `mcpTools.integ.test.ts`) and call `runMcpToolRunner`. Leave `customRunner` / `actionRunner` on the composite path. |
| Transport D6-a | Mount `/mcp` on the API `app` (keep `mcpApp` :4080). Vite `proxy['/mcp']`. |
| View | `StoredRunnerView`: `mcpToolRunner` is **not** the `actionRunner` else-branch. Form from resolved Jzod. Submit `onSubmit` → `runMcpToolRunner` (same-origin `/mcp`). Show `parsed.result` because `resultPresentation === "payload"`. Map MCP errors before snackbar. |
| D7-b (query only) | One new `runnerReportSection` on `reportMiroirRunners` (`ac75382d-…`) pointing at `897e9711-…`. |

Update the Slice 0 lock in the same change set so it describes post-Slice-1 reality (9 Runners, 7 Miroir-data uuids, 6 sections on `reportMiroirRunners`, `/mcp` proxy present). Do not keep a stale “8/5/no proxy” lock.

### 1.3 Refactor checkpoint

- `StoredRunnerView` `runnerType` handling is an exhaustive switch (`customRunner` \| `actionRunner` \| `mcpToolRunner`). The analysis §3.3 fall-through **closes**.
- One submit function shared by host and view; no second DomainController wrap “just for tests”.
- No `resolveMcpToolAction.unit.test.ts`. If the resolver is awkward, extract it in this checkpoint, still covered only by `runner_mcp_get_instances`.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation
npm run testMiroir -w miroir-standalone-app -- --suites runner_mcp_get_instances --mode integration --profile emulatedServer-filesystem
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

Tracer GREEN: `runner_mcp_get_instances` submits `mcpGetInstances` via HTTP `tools/call` `Miroir_getInstances` (Library / data / Book) and the payload contains seeded `book1` (`caef8a59-…`).

Layers landed:

- Present-model Runner Entity third union arm (`mcpToolRunner` + `toolName` + `resultPresentation`). EntityVersion snapshot `daa38a5f-…` left untouched.
- Instance `897e9711-…` (`mcpGetInstances`), export, `MIROIR_DATA_RUNNER_UUIDS`, extra section on `reportMiroirRunners`.
- Shared `runMcpToolRunner` + ephemeral MCP on the session DomainController; `runMiroirRunnerTest` branches on `mcpToolRunner` (does not wrap as a composite action).
- `StoredRunnerView` exhaustive switch; form from Endpoint payload Jzod; snackbar via `Action2Error`; payload panel without `debug={true}` (that helper hides output unless debug is on).
- API `mountHttpRoutes` on the main Express `app` + Vite `proxy['/mcp']`.
- Slice 0 lock updated to 3 arms / 9 runners / 7 Miroir-data uuids / 6 report sections / `/mcp` present (5/5).

Needed for the tracer to actually return instances (not new product surface):

- `DomainController.handleInstanceAction` now returns the persistence `getInstance` / `getInstances` payload (`CallUtils.callPersistenceAction` otherwise swallows it as `{}`).
- Playfield AdminApplication names are `Miroir` / `Library` so `toolNameFor` matches production (`Miroir_getInstances`).
- Runner integ file uses `@vitest-environment node`; `setup.ts` no longer overwrites native `fetch` with `cross-fetch` (that polyfill lacks `Response.body.cancel`, which Streamable HTTP needs).
- Suite key registered in `SUITE_BY_KEY` and `MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES`.

`mcpGetInstances` is **not** in `defaultMiroirMetaModel.runners`: in-memory modelValidation still type-checks Runner instances against the EntityVersion snapshot (two arms only). The JSON asset and MiroirTest stay; freeze/createEntity follow the same pattern.

`npx tsc -p packages/miroir-standalone-app` still reports two pre-existing errors in `ReportTools.ts` / `ReportSectionListDisplay.tsx` (unrelated to this slice). `miroir-core` tsc is clean.

Validation: modelValidation 149 passed; `runner_mcp_get_instances` 1/1 on `--profile emulatedServer-filesystem`; Slice 0 lock 5/5.

---

## Slice 2 — Same path: run `mcpLendDocument` (status only)

**Status:** ⬜ pending

### Goal

As a Library operator I can submit **MCP: lendDocument** on Library Home and get success or failure only (no result document). Existing **lendBook** `actionRunner` still works.

**Layers cut:** second instance → same `runMcpToolRunner` / view / host → `resultPresentation: "status"` → LibraryHome section.

No new client, no new runner type, no new transport.

### 2.1 RED

**Test:** MiroirTest `runner_mcp_lend_document` (`a6fc85c8-…`), `runnerRef: dbb39e31-…`, Library playfield (same seed as `runner_lend_document`).

Behavior asserted:

- Submit `{ user: user1, book: book1, startDate }` → MCP `parsed.status === "success"`.
- The run is `tools/call` `Library_lendDocument` via `runMcpToolRunner`.
- Presentation is `"status"`: the host/UI must **not** require a payload panel for the test to pass (success/failure is enough).
- A second leaf or the same suite: missing/invalid `book` → MCP `status === "error"`.
- `runner_lend_document` (`cc853632-…`) still passes (non-regression in Validation, not a new twin implementation).

Optional: a new `LendingHistoryItem` for that book/user. If server-vs-client cache (analysis risk 2) blocks it without rollback, envelope-only is enough; record in Realization.

### 2.2 GREEN

| Layer | Thin cut |
|---|---|
| Instance | `dbb39e31-…` Library model, `toolName: "Library_lendDocument"`, `resultPresentation: "status"`. Export it. |
| View / host | Already branch on `mcpToolRunner`. Hide result panel when `"status"`. Snackbar still mapped. |
| D7-b (effect) | One new `runnerReportSection` on `LibraryHome` (`9c0cdb97-…`), label distinct from `lendBook`. Keep `cc853632-…` and `98a38a84-…`. |

### 2.3 Refactor checkpoint

- Form resolution for Lending FKs (`user`, `book`) must still come from Endpoint Jzod (D3-b), not a hard-coded getInstances-only schema left over from Slice 1. If Slice 1 hard-coded getInstances fields, **replace** that with `toolName` lookup here — that is deepening, not a new module.
- Share lend args with `mcpToolsTestCases.ts` / `runner_lend_document` params (`user1Uuid`, `book1Uuid`).

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-standalone-app -- --suites runner_mcp_lend_document --mode integration
npm run testMiroir -w miroir-standalone-app -- --suites runner_lend_document --mode integration
npm run testMiroir -w miroir-standalone-app -- --suites runner_mcp_get_instances --mode integration
```

### Realization

<Appended on completion.>

---

## Slice 3 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 3.1 Nonreg

- `integ-runner-runner_mcp_get_instances` and `integ-runner-runner_mcp_lend_document` in `scripts/nonreg-manifest.json` (same profile/`requires` pattern as `integ-runner-runner_lend_document`).

### 3.2 Docs

- `analysis.md` status → implemented when 0–2 are DONE.
- `docs/guides/mcp-integration.md`: in-app Runners use same-origin `/mcp`; Cursor stays on :4080.
- Testing docs: new suite keys.

### 3.3 Issue-directory cleanup

- Delete `tests/**/issues/253-generic-mcp-tool-runner/` after any still-valuable Slice 0 asserts are folded into a feature-named file or dropped as obsolete (#238).

### 3.4 Tracer bullet (narrative)

1. Open **Runners available to all applications**.
2. Submit **MCP: getInstances** (Library / data / Book) → panel includes `book1`.
3. Open Library Home — **lendBook** still there.
4. Submit **MCP: lendDocument** (`user1` / `book1` / date) → snackbar success, no result dump.
5. Submit MCP lend with empty book → snackbar failure.

Automated equivalent: `runner_mcp_get_instances` + `runner_mcp_lend_document` + `runner_lend_document`.

### Validation

```bash
npm run nonreg -- --only integ-runner-runner_mcp_get_instances,integ-runner-runner_mcp_lend_document,integ-runner-runner_lend_document,default-miroir-modelValidation,default-library-modelValidation
```

### AC checklist (#253)

| Criterion | Proven by | Status |
|---|---|---|
| `mcpToolRunner` schema + `toolName` + `resultPresentation` | Slice 1 `devBuild` + modelValidation | ✅ |
| Query Runner instance | Slice 1 `897e9711-…` | ✅ |
| Effect Runner instance | Slice 2 `dbb39e31-…` | ⬜ |
| Submit is MCP `tools/call` | Slices 1–2 `runnerTest` host | ⬜ (Slice 1 host proven) |
| Query success shows `book1` | `runner_mcp_get_instances` | ✅ |
| Effect is success/failure only | `runner_mcp_lend_document` | ⬜ |
| Reachable on existing reports; LibraryHome twins unchanged | Slice 1 + 2 report JSON + `runner_lend_document` | ⬜ |
| Other Runners unchanged | Slice 0 lock evolution + `runner_lend_document` | ⬜ |

### Realization

<Appended on completion.>
