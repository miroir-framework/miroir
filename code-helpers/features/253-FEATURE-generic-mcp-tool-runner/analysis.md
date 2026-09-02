# 253 — Generic Runner for backend MCP tools (query + effect)

> Analysis of how the Miroir UI can consume the backend MCP tool surface through a generic
> Runner: `tools/call` instead of `DomainController`, covering both a **query** tool
> (`Miroir_getInstances`, payload is the product) and an **effect** tool
> (`Library_lendDocument`, success/failure is the product).

Related issue: https://github.com/miroir-framework/miroir/issues/253  
Parent: https://github.com/miroir-framework/miroir/issues/193 (LLM / Agent support)  
Prerequisites: [#229](https://github.com/miroir-framework/miroir/issues/229) dynamic tools ✅ · [#242](https://github.com/miroir-framework/miroir/issues/242) Streamable HTTP ✅ · [#248](https://github.com/miroir-framework/miroir/issues/248) `tools/list` payload ✅  
Related analyses: [`../229-FEATURE-dynamic-mcp-endpoint-tools/analysis.md`](../229-FEATURE-dynamic-mcp-endpoint-tools/analysis.md), [`../248-FIX-mcp-tools-list-payload-size/analysis.md`](../248-FIX-mcp-tools-list-payload-size/analysis.md)  
Key sources:
[`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Runners/RunnerView.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Runners/RunnerView.tsx),
[`packages/miroir-mcp/src/tools/EndpointToolRegistry.ts`](../../../packages/miroir-mcp/src/tools/EndpointToolRegistry.ts),
[`packages/miroir-mcp/src/tools/mcpHandlersForEndpoint.ts`](../../../packages/miroir-mcp/src/tools/mcpHandlersForEndpoint.ts),
[`packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd.json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd.json)

**Document role:** analysis and architectural decision record.  
**Status:** decisions confirmed with user (2026-09-02) — implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).  
**Issue-body note:** #253 body includes both `Miroir_getInstances` and `Library_lendDocument`.

### Sequencing

| Step | Issue | Status |
|------|-------|--------|
| Dynamic MCP tools from endpoints | #229 | ✅ |
| Streamable HTTP `/mcp` | #242 | ✅ |
| Compact `tools/list` | #248 | ✅ |
| Generic Runner as MCP *client* (query + effect) | **#253 (this)** | **this** |
| Tool picker over all `tools/list` + JSON Schema → mlSchema | later | later |
| CopilotKit / LLM calling this Runner | #193 | later |

---

## Decision record

| Decision | Choice |
|---|---|
| D1 — Runner type | **New `runnerType: "mcpToolRunner"`** — do not overload `actionRunner` / `customRunner` |
| D2 — First-slice tools | **`Miroir_getInstances` (query) + `Library_lendDocument` (effect)** — confirmed in conversation |
| D3 — Form schema | **Jzod from local-cache Endpoint action** (same source MCP already uses) — not MCP JSON Schema |
| D4 — Query vs effect UX | **Explicit `resultPresentation`: `"payload"` \| `"status"`** on the Runner instance |
| D5 — Instance placement | **Query on Miroir data; effect on Library model** — same storage rules as today |
| D6 — Transport | **Same-origin `/mcp` for the in-app client** (keep port `4080` for external MCP clients) |
| D7 — How the user opens them | **D7-b: extra `runnerReportSection`s on existing reports** (`reportMiroirRunners` + `LibraryHome`) — do not replace LibraryHome `actionRunner`s |

**Rationale:** #229 inverted Endpoints into MCP tools. This issue inverts again: the UI must speak MCP so the in-app path cannot drift from Cursor / Copilot. Existing Runners are all **effect-shaped** (snackbar, no result panel). A getInstances-only slice would invent a query-only UX and leave effect tools unproven. `lendDocument` is the smallest domain effect already covered by MCP tests and already has an `actionRunner` twin — that twin stays on `DomainController`.

### D1 — How to represent an MCP tool as a Runner

**Status:** Accepted — **D1-a**.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. New `mcpToolRunner`** ★ | Third arm of `definition` union: `{ runnerType: "mcpToolRunner", toolName, resultPresentation }` | Honest; cannot be mistaken for Endpoint dispatch; `StoredRunnerView` must grow a real third branch | Schema + `devBuild`; EntityVersion snapshot of Runner exists (`daa38a5f-…`) |
| D1-b. Overload `actionRunner` | Keep `endpoint` + `action`; change `StoredRunnerView` submit to MCP | No new type | Execution path hidden; name still means DomainController wrapping today (`RunnerView.tsx` 296–316) |
| D1-c. `customRunner` + new composite MCP action | Invent `actionType: "mcpToolsCall"` in composite sequences | Reuses form + sequence | Pollutes the Action language; MCP is not an Endpoint |
| D1-d. Hard-coded React wrappers | New `LibraryRunner_McpGetInstances.tsx` with `actionType: "onSubmit"` | Fast spike | Not generic; duplicates `LibraryRunner_LendDocument.tsx` |

**Decision:** D1-a. D1-b may be revisited only if we later *replace* all `actionRunner`s with MCP (out of this issue).

### D2 — Which tools prove the generic path

**Status:** **Accepted** (user, this conversation) — both kinds in this issue.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D2-a. `Miroir_getInstances` only | One query Runner | Smallest read-only form | Bakes in “always show a result document”; issue follow-up forbids this |
| **D2-b. getInstances + `Library_lendDocument`** ★ | One query + one effect | Both MCP result shapes; `lendDocument` already in `mcpToolsTestCases.ts` | Two instances, two report sections, one write-path fixture |
| D2-c. `Miroir_rollback` as the effect | Smallest payload (`application` only) | Tiny form | Infra side effect, not a domain effect; worse assertion |

**Decision:** D2-b. `Miroir_getInstance` / `createInstance` / `returnDocument` stay out (non-goals).

### D3 — Where the form mlSchema comes from

**Status:** Accepted — **D3-b**.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D3-a. Hard-code two Jzod payloads | Copy `getInstances` / `lendDocument` actionParameters into the UI | Unblocks immediately | Not generic; two schemas to keep in sync |
| **D3-b. Resolve Jzod from `currentModel.endpoints`** ★ | Same lookup `actionRunner` already does (`RunnerView.tsx` 119–131), keyed by the action behind `toolName` | Keeps `foreignKeyParams` / `initializeTo` (User, Book, Application dropdowns); one mechanism for both tools | Need a stable toolName → (application, endpoint, action) resolution (reuse `toolNameFor` from #229) |
| D3-c. MCP `inputSchema` → mlSchema | Convert `tools/list` JSON Schema (`$ref` / `$defs` after #248) | Pure MCP client | **No `jsonSchemaToJzod` exists** in the repo; conversion drops Jzod tags; `#248` schemas are intentionally lossy vs call-time Zod |

**Decision:** D3-b for this issue. D3-c is the follow-up that owns the full picker (named in Non-goals).

### D4 — How query vs effect is presented

**Status:** Accepted — **D4-a**.

MCP success envelope (always) from `handleMcpAction`:

```257:262:packages/miroir-mcp/src/tools/mcpHandlersForEndpoint.ts
    if (result.status === "ok") {
      const subObject = {
        status: "success",
        action: toolName,
        result: "returnedDomainElement" in result ? result.returnedDomainElement : undefined,
      };
```

`ActionVoidSuccess` **always** has `returnedDomainElement: DomainElementVoid` (`elementType: "void"`). A heuristic “show result if `parsed.result` is defined” would still show a void document for `lendDocument`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Explicit `resultPresentation`** ★ | `"payload"` on `mcpGetInstances`; `"status"` on `mcpLendDocument` | Matches user intent even if lendDocument’s envelope is non-void | Extra field; author must set it |
| D4-b. Heuristic `elementType !== "void"` | Automatic | No field | Wrong if an effect returns a created instance; getInstances-only UX if we forget the check |
| D4-c. Always snackbar + always dump `parsed` | One code path | Simple | Effect tools get a result document — what the user asked to avoid |

**Decision:** D4-a. Snackbar (success/failure) is **always** shown. Result panel **only** when `resultPresentation === "payload"`.

`handleAsyncAction` cannot be passed the MCP envelope unchanged: it tests `result.status === "error"` and reads `errorMessage` / `errorType` (`MiroirContextReactProvider.tsx` 496–514). MCP uses `status: "success" \| "error"` and `error.message`. The MCP branch must map the envelope before snackbar.

### D5 — Where the two instances live

**Status:** Accepted — **D5-b**.

Today (enumerated): **8** Runner instances.

| Kind | Count | Storage | `application` |
|------|-------|---------|----------------|
| `customRunner` | 6 | Miroir **data** `miroir_data/e54d7dc1-…/` | 4 × Miroir `360fcf1f-…`; 2 × `49956a74-…` (`createApplication`, `deployApplication`) |
| `actionRunner` | 2 | Library **model** `library_model/e54d7dc1-…/` | Library `5af03c98-…` |

`resolveRunnerDefinitionApplication` hard-codes the **6** Miroir-data UUIDs (`runnerDefinitionApplication.ts` 16–24). A new Miroir-data Runner that is omitted from that set is loaded from the **page** application (wrong section).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D5-a. Both on Miroir data | Two new files under `miroir_data/e54d7dc1-…/`; add both UUIDs to the set | One storage rule | Library-scoped `lendDocument` form lives on Miroir |
| **D5-b. Query on Miroir data; effect on Library model** ★ | `mcpGetInstances` like `createEntity`; `mcpLendDocument` like `lendDocument` `cc853632-…` | Matches existing twins; Library FKs resolve in Library model | Two packages; Miroir uuid must join `MIROIR_DATA_RUNNER_UUIDS` |
| D5-c. Both on Library model | Skip the hardcoded set | — | Framework `getInstances` is not a Library concept |

**Decision:** D5-b. Do **not** delete or retarget `cc853632-…` (`actionRunner` lendDocument).

### D6 — How the browser reaches MCP

**Status:** Accepted — **D6-a**.

Facts:

- MCP is a **second** Express app on `server.mcpUrl` (default port **4080**), path `/mcp` (`MCP_HTTP_ENDPOINT`), not on the API app (`server.ts` 478–495).
- Vite proxies `/action`, `/query`, `/CRUD`, `/api/copilotkit` — **not** `/mcp` (`vite.config.js` 100–107).
- `miroirConfigClient` / `serverConfigForClientConfig` have **no** `mcpUrl` (only `miroirConfigServer.server.mcpUrl`).
- Default CORS origins are hostname **:5173** and **:3000** only (`server.ts` 193–200). Production SPA origin (`rootApiUrl`, typically :3080) is **not** in that list — a browser on :3080 calling :4080 fails CORS unless `corsAllowedOrigins` is set.
- `packages/miroir-standalone-app` does **not** depend on `miroir-mcp`.
- Test client already exists: `packages/miroir-mcp/tests/integration/mcpClient.ts` (`callMcpToolViaHttp` / `listMcpToolsViaHttp`).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D6-a. Same-origin `/mcp` on the API app** ★ | Mount the existing Streamable HTTP handler on main `app` as well; Vite proxy `/mcp` → `apiBase`; keep :4080 for Cursor | SPA needs no `mcpUrl`; CORS footgun gone; same path as other API routes | Two listeners still exist; must not break #242 clients on :4080 |
| D6-b. Browser → `mcpUrl:4080` | Add `mcpUrl` to client config; extend CORS | Smallest server change | Client schema change; prod CORS; Vite mixed-port |
| D6-c. In-process `EndpointToolRegistry.callTool` from the UI | Skip HTTP | Easy in emulated tests | **Not MCP**; violates the issue |

**Decision:** D6-a. External clients keep `http(s)://host:4080/mcp`. The Runner uses same-origin `/mcp`. D6-c is rejected (tests may still call the registry **in addition** to HTTP, not instead).

### D7 — Where the user runs the two new Runners

**Status:** Accepted — **D7-b** (user reversed the analysis recommendation).

`runnerReportSection` / `storedRunner` is the **only** UI that executes a Runner (`ReportSectionViewWithEditor.tsx` 530–540). `RunnerList` (`3c26c31e-…`) is an instance **list**; row → `RunnerDetails` (`032fde52-…`) is an **editor**, not a submit form.

Enumerated execute surfaces today: **8** `runnerReportSection`s for **8** Runners (1:1).

| Report | Uuid | Sections |
|--------|------|----------|
| `reportMiroirRunners` | `ac75382d-…` | 5 (`deployApplication`, `createApplication`, `dropApplication`, `dropEntity`, `createEntity`) |
| `Versioning` | `c2b89408-…` | 1 (`freezeApplicationVersion` `20d51c4c-…`) |
| `LibraryHome` | `9c0cdb97-…` | 2 (`lendDocument` `cc853632-…`, `returnDocument` `98a38a84-…`) |

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D7-a. Dedicated Miroir report | New Report with two `runnerReportSection`s (getInstances + lendDocument) | Does not duplicate/replace LibraryHome; clear MCP surface | Needs a menu or known URL for the tracer |
| **D7-b. Add sections to existing reports** ★ | Extra section on `reportMiroirRunners` (`mcpGetInstances`) + `LibraryHome` (`mcpLendDocument`) | No new Report; existing menu/home routes | LibraryHome shows two lend forms (`actionRunner` + MCP) — accepted |
| D7-c. Click-to-run from `RunnerList` | Change details report | Nice later | Touches default details UX for all Runners |

**Decision:** D7-b. Existing LibraryHome `actionRunner` sections stay. Labels must distinguish MCP lend from `lendBook`.

---

## 1. Goals

1. **Query via MCP** — In order to inspect live instances through the same contract agents use as an **application maintainer**, I can submit a Runner bound to `Miroir_getInstances` and see the returned Book (or other entity) instances.
2. **Effect via MCP** — In order to perform a domain side effect through that contract as a **Library operator**, I can submit a Runner bound to `Library_lendDocument` and see **success or failure**, without treating a result document as the product.
3. **One call path** — In order not to maintain a second drifting dispatch as an **application maintainer**, I can trust both Runners perform MCP `tools/call` (not `DomainController.handleAction` / `actionRunner` wrapping).
4. **Existing Runners untouched** — In order to keep current workflows as a **report viewer**, I can still use all 8 existing Runners, including LibraryHome lend/return `actionRunner`s.

## 2. Non-goals

- Tool picker + dynamic form for **all** `tools/list` entries (later; needs D3-c).
- JSON Schema → mlSchema conversion (later; required by the picker).
- Further tools (`Miroir_getInstance`, `Miroir_createInstance`, `Library_returnDocument`, …) (later).
- CopilotKit / LLM invoking this Runner (owned by #193).
- Changing the MCP **server** tool surface (owned by #229 / #248, done).
- Replacing Library `actionRunner` `lendDocument` `cc853632-…` or `returnDocument` `98a38a84-…`.
- In-process `EndpointToolRegistry.callTool` as the UI execution path (D6-c rejected).

---

## 3. Current state

### 3.1 Runner schema — two arms only (misaligned with target)

Present-model Entity Runner `e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd` (`miroir_model/16dbfe28-…/e54d7dc1-….json`). `definition` is a union discriminated by `runnerType` with **exactly two** objects: `customRunner` (form + `compositeActionSequence`) and `actionRunner` (`endpoint` uuid + `action` string). Description text still says “custom runner or an action runner” (lines 70–76).

EntityVersion snapshot of the same concept: `daa38a5f-f1b5-4d4f-94b7-54e97fe6782e` under `miroir_modelVersion/54b9c72f-…/` (historical; present-model edit is the Entity row per #217).

Generated TS `Runner` in `miroirFundamentalType.ts` matches those two arms only.

### 3.2 Runner instances — 8, none MCP (aligned as inventory; misaligned as target)

Programmatic enumeration of `parentUuid === e54d7dc1-…` across Miroir / Library / Admin / standalone test assets: **8** instances, **0** extra copies under standalone test assets.

| name | runnerType | uuid | storage |
|------|------------|------|---------|
| `dropApplication` | `customRunner` | `1cd065d8-…` | Miroir data |
| `freezeApplicationVersion` | `customRunner` | `20d51c4c-…` | Miroir data |
| `dropEntity` | `customRunner` | `44313751-…` | Miroir data |
| `deployApplication` | `customRunner` | `4f3cd0b1-…` | Miroir data |
| `createEntity` | `customRunner` | `82f81a25-…` | Miroir data |
| `createApplication` | `customRunner` | `bcc872dc-…` | Miroir data |
| `returnDocument` | `actionRunner` | `98a38a84-…` | Library model |
| `lendDocument` | `actionRunner` | `cc853632-…` | Library model |

`lendDocument` `cc853632-…` binds `endpoint: 212f2784-…` (Lending), `action: "lendDocument"` — DomainController path, **not** MCP tool `Library_lendDocument`.

### 3.3 `StoredRunnerView` — binary branch, snackbar-only submit (misaligned)

Lookup of Endpoint/Action for the form happens **only** when `runnerType === "actionRunner"` (`RunnerView.tsx` 119–131). Form mlSchema for `actionRunner` is the action’s `actionParameters` wrapped under the runner name (159–171).

Render / submit:

| `runnerType` | Branch | Submit |
|--------------|--------|--------|
| `customRunner` | `== "customRunner"` (379–398) | `compositeActionTemplate` from `compositeActionSequence` |
| `actionRunner` | **else** (399–418) | `storedRunnerAction`: sequence whose only step is `getFromParameters` of the form values (296–316) → `handleCompositeActionTemplate` → `DomainController` |
| any future type including `mcpToolRunner` | **same else as actionRunner** | would be dispatched as a composite action, not MCP |

`InnerRunnerView` is form-only (`TypedValueObjectEditor`). There is **no** result panel. `handleSubmit` uses `handleAsyncAction`, which snackbars a fixed success string or an `Action2Error`-shaped failure. **All 8 existing Runners are effect-shaped in the UI**, including `actionRunner`. Binding `getInstances` as an `actionRunner` today would snackbar “success” and **discard** the instances.

Truth table for `handleAsyncAction` vs MCP envelope:

| Payload | `status === "error"`? | Snackbar |
|---------|----------------------|----------|
| `{ status: "ok" }` (DomainController) | no | success message |
| `{ status: "error", errorMessage }` (Action2Error) | yes | `errorMessage` / `errorType` |
| `{ status: "success", result }` (MCP ok) | no | success message (status ignored as “success” ≠ “error”) |
| `{ status: "error", error: { message } }` (MCP err) | **yes** | **“Unknown error”** — looks at `errorMessage`, not `error.message` |

### 3.4 Execute vs edit surfaces (aligned; constrains D7)

| Report | Role | Executes Runner? |
|--------|------|------------------|
| `RunnerList` `3c26c31e-…` | list instances | **no** |
| `RunnerDetails` `032fde52-…` | edit definition (`objectInstanceReportSection`) | **no** |
| `reportMiroirRunners` / `Versioning` / `LibraryHome` | `runnerReportSection` + `storedRunner` | **yes** |

Without a new `runnerReportSection`, a stored MCP Runner is invisible as a runnable form.

### 3.5 Backend MCP surface (aligned; this issue consumes it)

`EndpointToolRegistry.listTools` / `callTool` (#229). Names: `Miroir_getInstances`, `Library_lendDocument` (`toolNameFor`: `<applicationName>_<actionType>`).

`callTool` validates with Zod from the action Jzod, then `handleMcpAction` → **server-side** `domainController.handleAction` (`EndpointToolRegistry.ts` 264–297). That is the opposite process from the SPA’s client `DomainController` used by `actionRunner`.

HTTP: `setupHandlersForServer` (`mcpServer.ts` 381–415) — `tools/list` and `tools/call`. Test helper: `callMcpToolViaHttp`.

Existing MCP cases (`mcpToolsTestCases.ts`):

| Tool | Kind | Assertion today |
|------|------|-----------------|
| `Miroir_getInstances` | query | `content[0].parsed.status === "success"` (does **not** yet assert Book rows; this issue should) |
| `Library_lendDocument` | effect | `content[0].text` matches `"success"` (status only) |

`getInstances` Jzod payload (InstanceEndpoint `ed520de4-…`): `application`, `applicationSection`, `parentUuid`.  
`lendDocument` Jzod payload (Lending `212f2784-…`): `user`, `book`, `startDate`, optional `note` (FK tags on User `ca794e28-…` and Book `e8ba151b-…`).

Seed ids for tracers: Library `5af03c98-…`; Book `e8ba151b-…`; `book1` `caef8a59-39eb-48b5-ad59-a7642d3a1e8f`; `user1` `04c371ed-702d-4dd9-a06d-8a04eda5d24f`; LendingHistoryItem `e81078f3-…`.

### 3.6 What is *not* present (gaps)

- No `mcpToolRunner` arm, instance, or `StoredRunnerView` branch.
- No SPA MCP client; no Vite `/mcp` proxy; no client `mcpUrl`.
- No JSON Schema → mlSchema helper (D3-c blocked).
- `jzodElementToJsonSchema` is one-way (MCP list schema); UI tags do not round-trip.

---

## 4. Key reuse

| Piece | Location |
|-------|----------|
| Runner Entity (present model) | `e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd` |
| Runner EntityVersion snapshot | `daa38a5f-f1b5-4d4f-94b7-54e97fe6782e` |
| `actionRunner` form lookup | `StoredRunnerView` `RunnerView.tsx` 119–171 |
| Execute section type | `runnerReportSection` / `storedRunner` in `ReportSectionViewWithEditor.tsx` 530–540 |
| Library `actionRunner` twin (leave in place) | `cc853632-f158-43fa-b9ed-437c9c25f539` |
| Lending endpoint | `212f2784-5b68-43b2-8ee0-89b1c6fdd0de` |
| InstanceEndpoint / `getInstances` | `ed520de4-55a9-4550-ac50-b1b713b72a89` |
| MCP registry + names | `EndpointToolRegistry.ts` (`toolNameFor`, `listTools`, `callTool`) |
| MCP envelope | `handleMcpAction` `mcpHandlersForEndpoint.ts` 256–292 |
| HTTP test client | `packages/miroir-mcp/tests/integration/mcpClient.ts` |
| MCP mount | `packages/miroir-server/src/server.ts` `setupMcpServer` + `mcpApp` |
| Snackbar | `handleAsyncAction` in `MiroirContextReactProvider.tsx` 484–531 |
| Miroir-data Runner uuid set | `runnerDefinitionApplication.ts` `MIROIR_DATA_RUNNER_UUIDS` |
| `runner_lend_document` integ (DomainController twin) | Library MiroirTest + `UI_INTEGRATION_RUNNER_SUITE_REGISTRY` |

---

## 5. Target design (traces each decision)

These are design consequences, not an implementation sequence.

1. **D1** — Add `mcpToolRunner` to the Runner Entity union: `{ runnerType: "mcpToolRunner", toolName: string, resultPresentation: "payload" \| "status" }`. `npm run devBuild -w miroir-core`.
2. **D2 / D5** — Two instances: `mcpGetInstances` (`toolName: "Miroir_getInstances"`, `resultPresentation: "payload"`, Miroir data, uuid added to `MIROIR_DATA_RUNNER_UUIDS`); `mcpLendDocument` (`toolName: "Library_lendDocument"`, `resultPresentation: "status"`, Library model).
3. **D3** — `StoredRunnerView` third branch: resolve form Jzod from `currentModel.endpoints` for the action that #229 would publish under that `toolName` (reuse `toolNameFor`; do not parse JSON Schema). Same FK widgets as today’s `actionRunner` lend form.
4. **D6** — Submit calls MCP `tools/call` on same-origin `/mcp` with `{ name: toolName, arguments: formValues }`. Map MCP envelope ↔ snackbar (**D4**). If `resultPresentation === "payload"`, display `parsed.result` (e.g. `JsonDisplayHelper`); if `"status"`, do not.
5. **D7-b** — Add `storedRunner` sections on `reportMiroirRunners` (`mcpGetInstances`) and `LibraryHome` (`mcpLendDocument`). Do not remove existing LibraryHome `lendBook` / `returnBook` sections.
6. Tracers: Library + `data` + Book → instances include `book1`; lend `book1`/`user1`/`startDate` → MCP success (optional: new `LendingHistoryItem`); invalid lend → MCP error snackbar, no new row. Existing `actionRunner` lend integ stays green.

---

## 6. Risks / open questions

1. **Emulated-server UI integ** does not start MCP today. This issue’s tests need HTTP `/mcp` (or a documented host profile), unlike `runner_lend_document`.
2. **Client vs server DomainController:** MCP mutates the **server** cache/store. After `Library_lendDocument`, the SPA local cache may be stale until rollback/refresh. Effect tracer should not assume the client cache already contains the new lending row unless a refresh is in the Runner.
3. **`toolNameFor` import:** algorithm lives in `miroir-mcp`. standalone-app has no that dependency — either a small shared module or a duplicated pure function in core (naming must stay identical to #229).
4. **Dual `/mcp` mounts (D6-a):** registry is one object; two HTTP servers must not double-`start()` subscriptions blindly.
5. **EntityVersion snapshot** of Runner (`daa38a5f-…`) will disagree with the Entity until a freeze (#216 / #225). Present-model runtime reads Entity; tests that still load the Version snapshot must be named if they break.

---

## Next step

Decisions confirmed. Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
