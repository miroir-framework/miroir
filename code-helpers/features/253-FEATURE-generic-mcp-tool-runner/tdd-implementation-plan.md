# Issue #253 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController, local cache, and MCP Streamable HTTP (`/mcp`),
> through the applicative Runner instances (`mcpGetInstances`, `mcpLendDocument`) and MCP
> `tools/call`. No mocks. Tracer: submit `Miroir_getInstances` via the Runner client and
> see seeded `book1` in the payload.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/253  
Prerequisites: [`../229-FEATURE-dynamic-mcp-endpoint-tools/`](../229-FEATURE-dynamic-mcp-endpoint-tools/) ✅ · [`../248-FIX-mcp-tools-list-payload-size/`](../248-FIX-mcp-tools-list-payload-size/) ✅  
Parent: [#193](https://github.com/miroir-framework/miroir/issues/193)

**Resume note:** not started

---

## Scope

- New `runnerType: "mcpToolRunner"` (`toolName` + `resultPresentation`).
- Two stored Runners: query `Miroir_getInstances`, effect `Library_lendDocument`.
- Form Jzod from local-cache Endpoint action (D3-b).
- Submit via MCP `tools/call` on same-origin `/mcp` (D6-a); keep port 4080 for external clients.
- Query UX shows payload; effect UX is success/failure only (D4-a).
- Open them from existing reports (D7-b): `reportMiroirRunners` + `LibraryHome`.
- MiroirTest `runnerTest` host learns to execute `mcpToolRunner` over HTTP MCP.

This plan does **not** implement the full `tools/list` picker or JSON Schema → mlSchema (later). It does **not** replace Library `actionRunner` `cc853632-…` / `98a38a84-…` (stay on DomainController). It does **not** use in-process `EndpointToolRegistry.callTool` as the UI path (D6-c). CopilotKit stays on #193.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize current Runner / report / MCP-client contracts | ⬜ | `mcpToolRunner.253.phase0.unit.test.ts` |
| 1 | Schema + two Runner instances | ⬜ | modelValidation + generated `Runner` type |
| 2 | Resolve form Jzod from `toolName` | ⬜ | `resolveMcpToolAction.253.phase2.unit.test.ts` |
| 3 | Tracer: same-origin `/mcp` + query `runMcpToolRunner` | ⬜ | MCP HTTP integ — `book1` in payload |
| 4 | Effect: `Library_lendDocument` status-only | ⬜ | MCP HTTP integ — success / failure |
| 5 | `StoredRunnerView` + D7-b report sections | ⬜ | view test + modelValidation section locks |
| 6 | `runnerTest` host + two MiroirTest suites | ⬜ | `runner_mcp_get_instances`, `runner_mcp_lend_document` |
| 7 | Nonreg, docs, cleanup, AC | ⬜ | nonreg steps + tracer narrative |

---

## Locked implementation defaults

| Decision | Choice |
|---|---|
| D1 | New `mcpToolRunner` — `{ runnerType, toolName, resultPresentation }` |
| D2 | Tools: `Miroir_getInstances` (query) + `Library_lendDocument` (effect) |
| D3 | Form mlSchema = Jzod `actionParameters.payload` of the Endpoint action whose #229 name equals `toolName` |
| D4 | Explicit `resultPresentation`: `"payload"` \| `"status"`. Always snackbar. Result panel only for `"payload"` |
| D5 | `mcpGetInstances` in Miroir **data**; `mcpLendDocument` in Library **model**. Add Miroir uuid to `MIROIR_DATA_RUNNER_UUIDS` |
| D6 | Mount Streamable HTTP `/mcp` on the **API** Express `app`; Vite proxy `/mcp` → `apiBase`; keep dedicated :4080 |
| D7 | Extra `runnerReportSection` on `reportMiroirRunners` (`ac75382d-…`) and `LibraryHome` (`9c0cdb97-…`). Do **not** remove `lendBook` / `returnBook` |
| Snackbar | Map MCP `{ status, error.message }` → `handleAsyncAction` / Action2Error-shaped input. Do not pass the raw envelope |
| HTTP client | Promote `mcpClient.ts` helpers into `miroir-mcp` src; standalone-app depends on `miroir-mcp` for the client + `toolNameFor` / resolver |
| EntityVersion snapshot | Edit present-model Entity only (`e54d7dc1-…`). Do not rewrite `daa38a5f-…` in this issue (freeze is #216 / #225) |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Runner `mcpGetInstances` | `897e9711-65a0-414e-9773-19de92ade533` |
| Runner `mcpLendDocument` | `dbb39e31-5c7d-4473-9adb-5286e2972e46` |
| MiroirTest `runner_mcp_get_instances` | `a2e0a33f-222d-4334-870c-baaffd307e1d` |
| MiroirTest `runner_mcp_lend_document` | `a6fc85c8-83ad-4c8f-a6e0-6f9d17713159` |
| Nonreg query | `integ-runner-runner_mcp_get_instances` |
| Nonreg effect | `integ-runner-runner_mcp_lend_document` |

Seed literals (do not reallocate): Library `5af03c98-fe5e-490b-b08f-e1230971c57f`; Book `e8ba151b-d68e-4cc3-9a83-3459d309ccf5`; `book1` `caef8a59-39eb-48b5-ad59-a7642d3a1e8f`; `user1` `04c371ed-702d-4dd9-a06d-8a04eda5d24f`; LendingHistoryItem `e81078f3-2de7-4301-bd79-d3a156aec149`; InstanceEndpoint `ed520de4-55a9-4550-ac50-b1b713b72a89`; Lending `212f2784-5b68-43b2-8ee0-89b1c6fdd0de`.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Slice 0 / 2 / 5 view (vitest) | `RUN_TEST=mcpToolRunner.253 npm run testByFile -w miroir-standalone-app -- mcpToolRunner.253` |
| Slice 2 resolver (if in miroir-mcp) | `npm run testByFile -w miroir-mcp -- resolveMcpToolAction` |
| MCP HTTP integ | `npm run testByFile -w miroir-mcp -- mcpTools` / `endpointToolRegistry` / new `mcpToolRunner` integ file |
| MiroirTest runner suites | `npm run testMiroir -w miroir-standalone-app -- --suites runner_mcp_get_instances,runner_mcp_lend_document --mode integration` |
| Existing lend twin (non-reg) | `npm run testMiroir -w miroir-standalone-app -- --suites runner_lend_document --mode integration` |
| Deployment validation | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` |
| | `npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` |
| | `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json` |
| | `npx tsc --noEmit --skipLibCheck -p packages/miroir-mcp/tsconfig.json` |

**Vitest exceptions** (not reachable through MiroirTest): Slice 0 inventory; Slice 2 naming/resolution helper; Slice 3–4 HTTP transport (existing miroir-mcp integ vehicle); Slice 5 React `StoredRunnerView` branch. Slice 6 is the MiroirTest vehicle for the Runner flow.

---

## Slice 0 — Characterize current contracts

**Status:** ⬜ pending

### Goal

Lock today’s Runner schema arms, the 8 instances, the 8 execute sections, the Miroir-data uuid set, and the absence of `/mcp` on the Vite proxy / API app so later diffs are reviewable.

### 0.1 RED → GREEN — inventory lock

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/253-generic-mcp-tool-runner/mcpToolRunner.253.phase0.unit.test.ts`

Not reachable through MiroirTest because this asserts **file/schema inventory**, not a domain action.

Behavior asserted (import **real** JSON assets, no fixture copies):

- Runner Entity `e54d7dc1-…` `definition` union has **exactly 2** `runnerType` literals: `customRunner`, `actionRunner` (no `mcpToolRunner`).
- Exactly **8** Runner instances under Miroir data + Library model with the names/types/uuids in analysis §3.2.
- `MIROIR_DATA_RUNNER_UUIDS` has **exactly 6** uuids (the six Miroir-data Runners).
- `reportMiroirRunners` has **5** `runnerReportSection`s; `LibraryHome` has **2**; `Versioning` has **1** — total **8**.
- `vite.config.js` `server.proxy` has `/action`, `/query`, `/CRUD`, `/api/copilotkit` and **does not** have `/mcp`.

GREEN: the test documents current truth (write it to pass).

### 0.2 Refactor checkpoint

- None (characterization only). Record the `StoredRunnerView` else-branch misalignment (analysis §3.3) as known; do not “fix” it here.

### Validation

```bash
RUN_TEST=mcpToolRunner.253.phase0 npm run testByFile -w miroir-standalone-app -- mcpToolRunner.253.phase0
```

### Realization

<Appended on completion.>

---

## Slice 1 — Schema + two Runner instances

**Status:** ⬜ pending

### Goal

The model accepts `mcpToolRunner` and two stored instances exist (applicative contract). No execute path yet.

**Layers cut:** Entity JSON → generated `Runner` type → instance JSON → exports.

### 1.1 RED

**Test:** extend Slice 0 inventory (same file, new `describe` `phase1`) + `modelValidation` after assets exist.

Behavior asserted:

- Union includes `runnerType: "mcpToolRunner"` with required `toolName: string` and `resultPresentation: "payload" | "status"`.
- Instance `897e9711-…` / `mcpGetInstances`: Miroir data, `application` Miroir `360fcf1f-…`, `toolName: "Miroir_getInstances"`, `resultPresentation: "payload"`.
- Instance `dbb39e31-…` / `mcpLendDocument`: Library model, `application` Library `5af03c98-…`, `toolName: "Library_lendDocument"`, `resultPresentation: "status"`.
- `MIROIR_DATA_RUNNER_UUIDS` contains `897e9711-…` and still the previous 6 (now **7**).
- Generated TS `Runner["definition"]` accepts the new arm (`tsc` on core).

### 1.2 GREEN

- Edit Entity Runner `e54d7dc1-…` union (present model only).
- `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`.
- Add the two JSON files; export `runnerMcpGetInstances` from miroir `index.ts`, `runnerMcpLendDocument` from library `index.ts`.
- Add `897e9711-…` to `MIROIR_DATA_RUNNER_UUIDS`.
- Flip Slice 0 “exactly 2 arms / 8 instances / 6 uuids” assertions to the new counts in the phase1 describe (keep phase0 as historical skipped **or** update phase0 to “pre-253” comments and assert post-253 counts in phase1 only — prefer **update the lock** so one source of truth; note in Realization).

### 1.3 Refactor checkpoint

- Update the Entity `definition` tag description (“custom, action, or MCP tool runner”).
- Do not touch EntityVersion snapshot `daa38a5f-…`.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
RUN_TEST=mcpToolRunner.253 npm run testByFile -w miroir-standalone-app -- mcpToolRunner.253
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 2 — Resolve form Jzod from `toolName`

**Status:** ⬜ pending

### Goal

Given `Miroir_getInstances` or `Library_lendDocument` and a real `currentModel`, the form schema is the action payload Jzod (FK tags intact).

**Layers cut:** `toolNameFor` (#229) → resolver next to it → used later by `StoredRunnerView`.

### 2.1 RED

**Test:** `packages/miroir-mcp/tests/unit/resolveMcpToolAction.unit.test.ts`

Not reachable through MiroirTest because this is a naming/lookup helper.

Behavior asserted (import **real** InstanceEndpoint `ed520de4-…` and Lending `212f2784-…` JSON, plus application names “Miroir” / “Library”):

- `resolveMcpToolAction("Miroir_getInstances", …)` → endpoint `ed520de4-…`, actionType `getInstances`; payload definition has keys `application`, `applicationSection`, `parentUuid`.
- `resolveMcpToolAction("Library_lendDocument", …)` → endpoint `212f2784-…`, actionType `lendDocument`; payload has `user`, `book`, `startDate`; `user` / `book` still have `foreignKeyParams`.
- Unknown tool name → structured failure (throw or `undefined` — pick one and lock it).

### 2.2 GREEN

- Add `resolveMcpToolAction` beside `toolNameFor` in `EndpointToolRegistry.ts` (or a sibling module). Iterate applications/endpoints/actions with the same sort/`toolNameFor` rules as `listTools`.
- Export it from `packages/miroir-mcp/src/index.ts`.

### 2.3 Refactor checkpoint

- Do not duplicate `toolNameFor`. If standalone-app cannot import `miroir-mcp` yet, add the dependency in this slice (used again in 3–5).

### Validation

```bash
npm run testByFile -w miroir-mcp -- resolveMcpToolAction
npx tsc --noEmit --skipLibCheck -p packages/miroir-mcp/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 3 — Tracer: same-origin `/mcp` + query `runMcpToolRunner`

**Status:** ⬜ pending

### Goal

An MCP client of the **API origin** (not only :4080) can `tools/call` `Miroir_getInstances` through a Runner-shaped helper; the payload contains seeded `book1`.

**Layers cut:** `mcpServer` mount on main `app` → Vite proxy `/mcp` → promoted HTTP client → `runMcpToolRunner`.

### 3.1 RED

**Test:** `packages/miroir-mcp/tests/integration/mcpToolRunner.integ.test.ts` (setup copied from `endpointToolRegistry.integ.test.ts` / `mcpTools.integ.test.ts`: emulated server, Miroir + Library rollback).

Not reachable through MiroirTest yet (host still DomainController-only; Slice 6 adds that).

Behavior asserted:

- HTTP `tools/list` on the **same Express app** that also serves (or could serve) API routes includes `Miroir_getInstances`.
- `runMcpToolRunner` with **real** asset `mcpGetInstances` (`897e9711-…`) and args `{ application: Library, applicationSection: "data", parentUuid: Book }` returns `content[0].parsed.status === "success"`.
- `parsed.result` contains `book1` uuid `caef8a59-…` (query product, not status-only).
- `resultPresentation === "payload"` is read from the Runner instance (helper returns `{ envelope, present }` where `present === "payload"`).

### 3.2 GREEN

- Mount existing Streamable HTTP handler on the **API** `app` at `MCP_HTTP_ENDPOINT` (`server.ts`) **in addition to** `mcpApp` :4080. Do not double-`registry.start()`.
- Vite `server.proxy['/mcp']` → `apiBase` (`secure: false`), same as `/action`.
- Promote `callMcpToolViaHttp` / `listMcpToolsViaHttp` from `tests/integration/mcpClient.ts` to `packages/miroir-mcp/src/client/mcpHttpClient.ts`; keep test file as a re-export if needed.
- Add `runMcpToolRunner({ runner, args, serverUrl })`: `tools/call` + parse envelope + attach `resultPresentation`.
- Flip Slice 0 “no `/mcp` proxy” assertion.

### 3.3 Refactor checkpoint

- Analysis §3.6 gap (no SPA client / no proxy) closes here for transport.
- Dual mount: one registry, two HTTP entries. Log which port accepted the call.

### Validation

```bash
npm run testByFile -w miroir-mcp -- mcpToolRunner
RUN_TEST=mcpToolRunner.253.phase0 npm run testByFile -w miroir-standalone-app -- mcpToolRunner.253.phase0
```

### Realization

<Appended on completion.>

---

## Slice 4 — Effect: `Library_lendDocument` status-only

**Status:** ⬜ pending

### Goal

The same helper runs an effect tool: success/failure is the product; a result document is not required.

**Layers cut:** same client + `mcpLendDocument` asset + MCP envelope.

### 4.1 RED

**Test:** same integ file, new `describe` (deepens Slice 3 interface; do not invent a second client).

Behavior asserted:

- `runMcpToolRunner` with **real** `mcpLendDocument` (`dbb39e31-…`) and `{ book: book1, user: user1, startDate: ISO }` → `parsed.status === "success"` and helper `present === "status"`.
- Caller instructed by `present === "status"` does **not** need `parsed.result` (assert the helper exposes presentation so the UI can hide the panel).
- Invalid / missing `book` → `parsed.status === "error"` (MCP error envelope, not throw).
- Optional but preferred: after success, a `LendingHistoryItem` exists for that book/user (query via DomainController or a follow-up `Miroir_getInstances` on `e81078f3-…`). If the server cache vs client cache gap (analysis risk 2) blocks this without rollback, assert envelope only and note in Realization.

### 4.2 GREEN

- No new type. `runMcpToolRunner` already carries `resultPresentation`.
- Do not add a result-panel code path here (that is Slice 5).

### 4.3 Refactor checkpoint

- Share payload builders with `mcpToolsTestCases.ts` (`Library_lendDocument` / `Miroir_getInstances`) instead of copying literals.

### Validation

```bash
npm run testByFile -w miroir-mcp -- mcpToolRunner
```

### Realization

<Appended on completion.>

---

## Slice 5 — `StoredRunnerView` third branch + D7-b sections

**Status:** ⬜ pending

### Goal

A user opening `reportMiroirRunners` or Library Home can run the two MCP Runners: query shows instances; effect snackbars success/failure.

**Layers cut:** `StoredRunnerView` → `runMcpToolRunner` → report JSON sections.

### 5.1 RED

**Tests:**

1. `packages/miroir-standalone-app/tests/4_view/issues/253-generic-mcp-tool-runner/mcpToolRunner.253.phase5.unit.test.ts` — view/form (vitest + RTL). Not MiroirTest: React branch internals.

   Behavior asserted:

   - For `mcpGetInstances`, form mlSchema fields include `application`, `applicationSection`, `parentUuid` (via `resolveMcpToolAction` + real Endpoint JSON / environment).
   - For `mcpLendDocument`, form fields include `user`, `book`, `startDate`.
   - `runnerType === "mcpToolRunner"` does **not** take the `actionRunner` else-branch (no `storedRunnerAction` `getFromParameters` composite).
   - When `resultPresentation === "payload"` and a stubbed-in envelope (only if unavoidable) — **prefer** asserting a presentational helper `shouldShowMcpResultPanel("payload") === true` / `"status" === false` as a pure function tested without mocking fetch.
   - Snackbar mapper: MCP `{ status: "error", error: { message: "x" } }` → Action2Error-shaped `{ status: "error", errorMessage: "x" }`.

2. Phase0/1 inventory: `reportMiroirRunners` has **6** runner sections including `897e9711-…`; `LibraryHome` has **3** including `dbb39e31-…` **and** still `cc853632-…` / `98a38a84-…`.

### 5.2 GREEN

- Third branch in `StoredRunnerView` (`RunnerView.tsx` 379–418): `mcpToolRunner` → form from `resolveMcpToolAction`; submit `actionType: "onSubmit"` → `runMcpToolRunner` against same-origin `/mcp` (relative URL).
- Result panel (`JsonDisplayHelper` is enough) iff `resultPresentation === "payload"`.
- Map envelope before `handleAsyncAction`.
- Add sections to `reportMiroirRunners` and `LibraryHome`. Labels: e.g. `mcpGetInstances`, `mcpLendDocument` (not `lendBook`).
- `packages/miroir-standalone-app` `dependencies`: `"miroir-mcp": "*"`.

### 5.3 Refactor checkpoint

- Analysis §3.3 else-branch misalignment **must** close: exhaustive `runnerType` switch (`customRunner` \| `actionRunner` \| `mcpToolRunner`).
- Do not change `LibraryRunner_LendDocument.tsx` (still wraps `cc853632-…`).

### Validation

```bash
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
RUN_TEST=mcpToolRunner.253 npm run testByFile -w miroir-standalone-app -- mcpToolRunner.253
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

<Appended on completion.>

---

## Slice 6 — `runnerTest` host executes `mcpToolRunner` over MCP HTTP

**Status:** ⬜ pending

### Goal

MiroirTest `runnerTest` leaves for both new Runners run in standalone-app integ the same way the UI submits (HTTP `tools/call`), not DomainController wrapping.

**Layers cut:** `Runner.ts` / `RunnerTestSession` → ephemeral MCP on the session DomainController → two MiroirTest JSON suites.

### 6.1 RED

**Tests:** MiroirTest assets (applicative):

- `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/a2e0a33f-222d-4334-870c-baaffd307e1d.json` — `name: runner_mcp_get_instances`, `runnerRef: 897e9711-…`. Assert MCP success and `book1` present in the query result.
- `packages/miroir-test-app_deployment-library/assets/library_model/a311f363-e238-4203-bdfc-29e8c160c26b/a6fc85c8-83ad-4c8f-a6e0-6f9d17713159.json` — `name: runner_mcp_lend_document`, `runnerRef: dbb39e31-…`. Assert MCP success (status). Keep `runner_lend_document` (`f8e7d6c5-…` / `cc853632-…`) unchanged.

Register both in `UI_INTEGRATION_RUNNER_SUITE_REGISTRY` (`kind: "runnerTest"`). Library suite reuses `runnerLibraryDocumentEntitiesAndInstances` playfield.

RED: host still builds `getFromParameters` composite for non-custom Runners (`Runner.ts` 53–64) → fail or no-op until GREEN.

### 6.2 GREEN

- When `runner.definition.runnerType === "mcpToolRunner"`, test host calls `runMcpToolRunner` (same helper as UI).
- Session starts MCP HTTP on an ephemeral port **sharing the session DomainController** (pattern from `mcpTools.integ.test.ts` `setupMcpServer`), then tears it down. This is real MCP, not `registry.callTool`.
- `testParams` for the query leaf: `{ application, applicationSection, parentUuid }` (Library / data / Book). For the effect leaf: `{ user, book, startDate }` like `runner_lend_document` but **without** wrapping `actionType`/`endpoint` unless the host still needs that shape — prefer raw tool args.

### 6.3 Refactor checkpoint

- `testBuildPlusRuntimeCompositeActionSuiteForRunner` stays for `customRunner` / `actionRunner`. Do not force MCP runners through a fake composite action.
- Export new suites from deployment `index.ts`.

### Validation

```bash
npm run testMiroir -w miroir-standalone-app -- --suites runner_mcp_get_instances,runner_mcp_lend_document --mode integration
npm run testMiroir -w miroir-standalone-app -- --suites runner_lend_document --mode integration
```

### Realization

<Appended on completion.>

---

## Slice 7 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 7.1 Nonreg

- Add `integ-runner-runner_mcp_get_instances` and `integ-runner-runner_mcp_lend_document` to `scripts/nonreg-manifest.json` (same profile/`requires` pattern as `integ-runner-runner_lend_document`).
- `default-miroir-modelValidation` / `default-library-modelValidation` already cover new JSON.

### 7.2 Docs

- `analysis.md` status → implemented when slices 0–6 are DONE.
- `docs/guides/mcp-integration.md` — one paragraph: in-app Runners call same-origin `/mcp`; Cursor still uses :4080.
- `docs/contributing/testing.md` / `docs/reference/testing.md` — new suite keys.

### 7.3 Issue-directory cleanup

- Move still-valuable Slice 0/5 assertions into a feature-named file e.g. `mcpToolRunner.contracts.unit.test.ts`; delete `tests/**/issues/253-generic-mcp-tool-runner/` (#238).

### 7.4 Tracer bullet (narrative)

1. Open **Runners available to all applications** (`reportMiroirRunners`).
2. Submit **MCP: getInstances** with Library / data / Book → panel lists books including `book1`.
3. Open Library Home.
4. Existing **lendBook** `actionRunner` still works (`runner_lend_document`).
5. Submit **MCP: lendDocument** with `user1` / `book1` / a start date → snackbar success, no result dump.
6. Submit MCP lend with an empty book → snackbar failure.

Automated equivalent: `runner_mcp_get_instances` + `runner_mcp_lend_document` + existing `runner_lend_document`.

### 7.5 Refactor checkpoint

- Confirm `StoredRunnerView` switch is exhaustive; no `mcpToolRunner` fall-through to `actionRunner`.

### Validation

```bash
npm run nonreg -- --only integ-runner-runner_mcp_get_instances,integ-runner-runner_mcp_lend_document,integ-runner-runner_lend_document,default-miroir-modelValidation,default-library-modelValidation
```

### AC checklist (#253)

| Criterion | Proven by | Status |
|---|---|---|
| Schema accepts `mcpToolRunner` + `toolName` + `resultPresentation` | Slice 1 modelValidation + generated type | ⬜ |
| Stored Runner `Miroir_getInstances` (query) | Slice 1 asset `897e9711-…` | ⬜ |
| Stored Runner `Library_lendDocument` (effect) | Slice 1 asset `dbb39e31-…` | ⬜ |
| Submit is MCP `tools/call`, not DomainController / `actionRunner` wrap | Slices 3–4 integ + Slice 6 host | ⬜ |
| Query success shows seeded Book instances (`book1`) | Slice 3 + `runner_mcp_get_instances` | ⬜ |
| Effect success/failure only; no required result document | Slice 4 + `runner_mcp_lend_document` | ⬜ |
| Reachable via existing reports; LibraryHome lend/return unchanged | Slice 5 inventory + `runner_lend_document` | ⬜ |
| Existing `customRunner` / `actionRunner` unchanged | Slice 0 locks + `runner_lend_document` | ⬜ |

### Realization

<Appended on completion.>
