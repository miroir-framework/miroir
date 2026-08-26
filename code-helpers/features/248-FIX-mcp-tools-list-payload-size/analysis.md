# 248 — Shrink miroir-mcp `tools/list` payload (Cursor 0 tools / freeze)

> Analysis of why Cursor freezes / shows 0 tools against the post-#242 Streamable HTTP MCP
> endpoint: `tools/list` returns ~445 MB of inlined JSON Schema. Frames compaction options;
> **`$ref` / `$defs` is the first direction to explore**.

Related issue: https://github.com/miroir-framework/miroir/issues/248  
Parent / prerequisite: https://github.com/miroir-framework/miroir/issues/242 (Streamable HTTP) ✅ transport landed; Cursor usability still broken  
Related analyses: [`../229-FEATURE-dynamic-mcp-endpoint-tools/analysis.md`](../229-FEATURE-dynamic-mcp-endpoint-tools/analysis.md)  
Key sources:
[`packages/miroir-mcp/src/tools/jzodElementToJsonSchema.ts`](../../../packages/miroir-mcp/src/tools/jzodElementToJsonSchema.ts),
[`packages/miroir-mcp/src/tools/jzodConversionContext.ts`](../../../packages/miroir-mcp/src/tools/jzodConversionContext.ts),
[`packages/miroir-mcp/src/tools/mcpHandlersForEndpoint.ts`](../../../packages/miroir-mcp/src/tools/mcpHandlersForEndpoint.ts),
[`packages/miroir-mcp/src/mcpServer.ts`](../../../packages/miroir-mcp/src/mcpServer.ts),
[`packages/miroir-mcp/src/tools/EndpointToolRegistry.ts`](../../../packages/miroir-mcp/src/tools/EndpointToolRegistry.ts)

**Document role:** analysis and architectural decision record for MCP tool-schema compaction.  
**Status:** decisions confirmed with user (explore `$ref` first; keep all fallbacks documented).

### Sequencing

| Step | Issue | Status |
|------|-------|--------|
| Stateless Streamable HTTP MCP | #242 | ✅ transport / `/mcp` |
| Compact `tools/list` for Cursor & clients | **#248 (this)** | **this** |
| TDD implementation plan | `./tdd-implementation-plan.md` | later |

---

## Decision record

| Decision | Choice |
|---|---|
| Primary compaction strategy to explore first | **`$ref` / `$defs`** — share recursive Jzod definitions once per tool (or globally) instead of inlining |
| Fallback strategies to keep in scope | **Lower depth / earlier truncation**; **opaque recursive Miroir types**; **size-budget regression** (always) |
| Runtime validation vs list schema | **Keep Zod / call-path validation as today** unless a later decision explicitly weakens it — list schema may be looser than call validation |
| Success metric for Cursor | **Total `tools/list` body well under ~1 MB** (exact CI budget fixed in implementation plan; provisional working budget **≤ 512 KB** serialized tools array) |

**Rationale:** Cursor (and similar clients) must download and parse the full `tools/list` response before enabling tools. Inlining Miroir’s recursive meta-schemas turns a handful of composite/query tools into hundreds of megabytes. Structural sharing via `$ref` preserves the most type information for agents while attacking the root cause (duplicated subtrees). Depth caps and opaque types remain valid fallbacks if `$ref` is insufficient or poorly supported by a target client. A size budget locks the win in CI.

### D1 — How to compact MCP `inputSchema` payloads

**Status:** Accepted — explore **D1-a (`$ref` / `$defs`)** first; D1-b / D1-c remain in scope as fallbacks or complements; D1-d is mandatory regression regardless of compaction choice.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. `$ref` / `$defs`** ★ | On `schemaReference` (and optionally other shared nodes), emit `$defs[key]` once and `$ref: "#/$defs/…"` at use sites; keep cycle edges as `$ref` instead of re-inlining after `resolvingRefs.delete` | Preserves structure for LLM/tool UIs; attacks combinatorial duplication; aligns with JSON Schema practice | MCP clients vary in `$ref` resolution; need stable def keys; `McpToolDescriptionProperty` types today do not model `$ref` / `$defs` |
| D1-b. Lower depth / earlier truncation | Reduce `DEFAULT_JZOD_CONVERSION_MAX_DEPTH` (today **64**) and/or degrade to `looseObject` earlier for heavy branches | Small code change; predictable size | Loses nested detail; still may duplicate large shallow unions; arbitrary cutoffs |
| D1-c. Opaque recursive Miroir types | Allow-list heavy domains (composite action, boxed query/template, transformer, …) → single open object in list schema | Fast, tiny payloads; easy to reason about | Agents lose typed hints for the worst tools; must maintain allow-list |
| D1-d. Size-budget regression | Assert total / per-tool serialized `tools/list` size in unit or integ tests | Prevents silent regression to 445 MB | Does not fix by itself; needs a budget number |

**Decision:** D1-a first. If Cursor (or MCP Inspector) fails to resolve `$ref`, combine with D1-b/D1-c for remaining hotspots. D1-d always ships with the fix.

### D2 — Listing schema vs call-time validation

**Status:** Accepted — **list schema may compact; call-time Zod stays authoritative**.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. Split concerns** ★ | `inputSchema` for discovery/UX; `payloadZodSchema` / `jzodPayloadToZodSchema` for `tools/call` | Compaction cannot silently weaken enforcement | Agents may propose shapes that pass a loose list schema but fail Zod |
| D2-b. Single shared schema artifact | One representation drives both list and validate | Consistency | Forces either huge list payloads or weak validation |

**Decision:** D2-a. Document in tool descriptions when a parameter is intentionally opaque at list time.

---

## 1. Goals

1. **Cursor-usable MCP** — In order to use Miroir tools from the IDE without freeze or empty tool lists as an MCP client user, I can connect to the local Streamable HTTP endpoint and see a non-empty tool catalog.
2. **Bounded discovery payload** — In order to keep agent/tooling handshakes fast as an application maintainer, I can rely on `tools/list` staying under an explicit size budget enforced in tests.
3. **Honest typing where it fits** — In order to call Miroir actions with useful parameter hints as an MCP client / agent, I can still receive structured `inputSchema` for ordinary tools, with shared recursive definitions preferred over opaque collapse when `$ref` works.
4. **Safe calls** — In order not to corrupt application state as an application maintainer, I can trust that `tools/call` still validates payloads as strictly as today unless we explicitly decide otherwise.

## 2. Non-goals

- Changing Streamable HTTP transport or session model (owned by #242).
- Changing which endpoints/actions are exposed as tools (owned by #229 / future filter work).
- Implementing MCP OAuth / protected-resource metadata (Cursor Authenticate UI is misleading here; not required for local unauthenticated `/mcp`).
- Replacing Zod call-path validation with JSON Schema-only validation (later / unscheduled unless D2 is revisited).

## 3. Current state

### 3.1 Transport after #242 (aligned)

- Endpoint: `POST /mcp` via `StreamableHTTPServerTransport` with `sessionIdGenerator: undefined` in `MiroirMcpServer.setup` ([`mcpServer.ts`](../../../packages/miroir-mcp/src/mcpServer.ts)).
- `initialize` responds quickly (~177-byte SSE `event: message` in local measurement).
- Server logs `Received POST request on /mcp` and `ListToolRequest Received list_tools request` when Cursor connects — the client **does** reach `tools/list`.

### 3.2 Dynamic tool surface (aligned with #229)

- `EndpointToolRegistry.listTools()` builds live tool descriptions from deployed applications’ endpoints.
- `setupHandlersForServer` returns `{ tools: await endpointToolRegistry.listTools() }` on each `ListToolsRequestSchema` handling ([`mcpServer.ts`](../../../packages/miroir-mcp/src/mcpServer.ts) ~L382–387).

### 3.3 Schema conversion inlines references (misaligned with Cursor / size)

`mcpToolEntry` sets:

```443:447:packages/miroir-mcp/src/tools/mcpHandlersForEndpoint.ts
    mcpToolDescription: {
      name: toolName,
      description: actionDescription,
      inputSchema: jzodElementToJsonSchema(jzodPayload) as McpToolDescriptionPropertyObject,
    },
```

For `schemaReference`, conversion **resolves and inlines** the target, then **removes** the ref from `resolvingRefs` in `finally`, so the same logical type can be fully expanded again on every other branch:

```60:88:packages/miroir-mcp/src/tools/jzodElementToJsonSchema.ts
    case "schemaReference": {
      const ref = jzodElement as JzodReference;
      const refKey = schemaReferenceKey(ref);
      if (isJzodConversionLimitReached(options, refKey)) {
        return looseObject(description);
      }

      options.resolvingRefs.add(refKey);
      const childOptions: JzodConversionOptions = {
        ...options,
        depth: options.depth + 1,
      };

      try {
        const resolvedSchema = resolveJzodSchemaReferenceInContext(
          ref,
          ref.context || {},
          defaultMiroirModelEnvironment,
        );
        return jzodElementToJsonSchema(
          resolvedSchema,
          propertyName,
          propertyNameMapping,
          childOptions,
        );
      } finally {
        options.resolvingRefs.delete(refKey);
      }
    }
```

Guards today ([`jzodConversionContext.ts`](../../../packages/miroir-mcp/src/tools/jzodConversionContext.ts)):

- Cycle only while a given `refKey` is **on the active stack** (`resolvingRefs.has`).
- Hard depth cap: `DEFAULT_JZOD_CONVERSION_MAX_DEPTH = 64`.
- On limit: `looseObject` (`additionalProperties: true` open object).

That prevents stack overflow; it does **not** prevent exponential / combinatorial duplication of large union trees (Query / CompositeAction / Transformer families) across siblings.

`McpToolDescriptionProperty` unions only cover `string` | `object` | `array` shapes — no `$ref` / `$defs` ([`mcpHandlersForEndpoint.ts`](../../../packages/miroir-mcp/src/tools/mcpHandlersForEndpoint.ts) ~L332–346).

### 3.4 Measured blow-up (2026-08-26, local `http://localhost:4080/mcp`)

Feedback loop:

```bash
curl -sS -D - -o mcp-list-body.bin -X POST "http://localhost:4080/mcp" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

| Metric | Value |
|--------|-------|
| HTTP status | 200 |
| `Content-Length` | **467,078,694** (~445 MB) |
| Tool count | **47** |
| Total serialized tools | **~445.44 MB** |
| Median tool size | **~1.0 KB** |
| Mean tool size | **~9.5 MB** (skewed) |

| Tool | Approx serialized size |
|------|------------------------|
| `Miroir_runTestCompositeAction` | **~222.90 MB** |
| `Miroir_compositeActionSequence` | **~74.31 MB** |
| `Miroir_compositeRunBoxedQueryTemplateAction` | **~73.36 MB** |
| `Miroir_runBoxedQueryTemplateAction` | **~73.36 MB** |
| `Miroir_compositeRunBoxedQueryAction` | ~0.65 MB |
| `Miroir_runBoxedQueryAction` | ~0.65 MB |
| Remaining ~41 tools | mostly ≤ tens of KB; smallest ~0.2 KB |

On `Miroir_runTestCompositeAction` alone: schema text ~254M chars; **~78 764** `oneOf`; **~1 243 207** `additionalProperties`; **~515 961** “Open object” degradations — evidence of deep expand-then-degrade, not a single huge leaf.

### 3.5 Cursor symptoms vs OAuth (misaligned UX, not root cause)

- Cursor remote URL MCP shows Authenticate / Logout / Degraded / Connecting / **0 tools enabled**.
- `GET /.well-known/oauth-authorization-server` (and related) → **404** on the Miroir server.
- OAuth absence may explain Authenticate chrome; it does **not** explain multi-minute freezes once `tools/list` is in flight. Size does.

### 3.6 Existing tests (gap)

- Unit coverage for `jzodElementToJsonSchema` focuses on shape correctness ([`jzodElementToJsonSchema.unit.test.ts`](../../../packages/miroir-mcp/tests/unit/jzodElementToJsonSchema.unit.test.ts)).
- Integration `listTools` asserts names / `inputSchema.type === "object"` — **no size budget** ([`endpointToolRegistry.integ.test.ts`](../../../packages/miroir-mcp/tests/integration/endpointToolRegistry.integ.test.ts)).
- No test would go red on a 445 MB list payload.

## 4. Key reuse

| Piece | Location |
|-------|----------|
| Jzod → MCP JSON Schema | `jzodElementToJsonSchema` |
| Conversion limits / ref keys | `jzodConversionContext.ts` (`schemaReferenceKey`, `DEFAULT_JZOD_CONVERSION_MAX_DEPTH`) |
| Tool description assembly | `mcpToolEntry` / `mcpToolDescriptionFromActionDefinition` |
| Live tool list | `EndpointToolRegistry.listTools` |
| List handler | `setupHandlersForServer` + `ListToolsRequestSchema` |
| Streamable HTTP test client | `packages/miroir-mcp/tests/integration/mcpClient.ts` (`listMcpToolsViaHttp`) |
| Dynamic tools design frame | #229 analysis |

## 5. Proposals / options (impact & effort)

| # | Proposal | Impact | Effort | Verdict |
|---|---|---|---|---|
| 1 | **`$ref` / `$defs` in conversion** | High — removes duplicate subtrees at source | Med — types, keying, client check | **Explore first** |
| 2 | Lower `maxDepth` / earlier `looseObject` | Med–High on size | Low | Fallback / complement |
| 3 | Opaque allow-list for recursive Miroir domains | High on worst 4 tools | Low–Med | Fallback / complement |
| 4 | Size-budget unit/integ assertion | High for non-regression | Low | **Always** |
| 5 | Drop / hide worst tools from MCP | High UX loss for those actions | Low | Rejected as primary fix (may be temporary kill-switch only) |

### 5.1 `$ref` exploration notes (first pass)

Expected conversion change sketch:

1. Thread a mutable `$defs` map (or collector) through `JzodConversionOptions`.
2. On first encounter of `schemaReferenceKey(ref)`, convert definition into `$defs[stableKey]`, return `{ "$ref": "#/$defs/" + stableKey }`.
3. On cycle (ref already being built), return `$ref` to the in-progress def instead of `looseObject` when possible.
4. Root `inputSchema` becomes `{ type: "object", properties: …, $defs: { … } }` (or sibling `$defs` if MCP tooling prefers draft-07 `definitions` — verify against MCP JSON Schema guidance and Cursor).
5. Widen `McpToolDescription` / property types to allow `$ref` and `$defs`.
6. Validate: Cursor tool list non-empty; MCP Inspector; existing unit tests; size budget.

Risks to falsify early: Cursor silently drops tools whose `inputSchema` contains `$ref`; some clients only accept draft-07 `definitions`. If so, document and fall back to D1-b/D1-c for affected clients while keeping `$ref` for clients that resolve it — or emit client-safe opaque schemas for list only (D2-a).

### 5.2 Provisional size budgets (to firm in TDD plan)

| Budget | Provisional value | Role |
|--------|-------------------|------|
| Total serialized `tools` array | **≤ 512 KB** | Primary CI gate (Cursor-safe headroom under ~1 MB goal) |
| Single tool description | **≤ 128 KB** | Catch one runaway action schema |
| Smoke curl `Content-Length` | **≤ 1 MB** | Manual / optional integ against live server |

Exact numbers may tighten after `$ref` prototypes on the four outlier tools.

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (to be written / extended after Cursor validation of rebuilt server), including:

1. Rebuild `miroir-mcp` + embedder (`miroir-server`) and re-measure live `tools/list` `Content-Length`.
2. Manual Cursor connect to `http://localhost:4080/mcp` — confirm non-empty tool list (risk: client `$ref` support).
3. If Cursor drops tools with `$ref`, fall back to D1-b/D1-c for list-only schemas while keeping call-time Zod (D2-a).
4. Add total `tools/list` size budget assertion at registry/HTTP seam (not only per-reference unit budgets already added).

### Exploration log (2026-08-26) — `$ref` / `$defs` spike

**Implemented** in `jzodElementToJsonSchema` / `jzodConversionContext`:

- `schemaReference` emits `{ $ref: "#/$defs/<sanitizedKey>" }` and stores the converted body once in a shared `defs` map.
- Cycle / re-entry: placeholder reserved in `defs` before resolve; recursive encounters return `$ref` (no re-inline).
- Root call owns `defs` and attaches `$defs` to the returned schema.
- Unit coverage updated; size budgets on `jzodElement` and `compositeActionSequence` conversions (**&lt; 512 KB** each).

**Measured conversion sizes** (`packages/miroir-mcp/scripts/measure-ref-schema-sizes.ts`):

| Relative path | Approx JSON size | `$defs` count |
|---|---|---|
| `applicationSection` | 0.3 KB | 1 |
| `entityInstance` | 0.5 KB | 1 |
| `jzodElement` | 10.7 KB | 22 |
| `boxedQueryWithExtractorCombinerTransformer` | 41.7 KB | 73 |
| `compositeAction` / `compositeActionSequence` | **150.4 KB** | 201 |

Compare to pre-`$ref` live `tools/list` outliers (~74–223 **MB** per tool). Per-reference conversion alone is now ~500× smaller for composite-action shapes.

**Still open for live Cursor validation:** `$defs` are **per tool** (each `mcpToolEntry` conversion), so total `tools/list` ≈ sum of per-tool schemas — expected well under 1 MB if outliers stay ~150 KB, but must be confirmed after server rebuild. Cursor `$ref` acceptance is the remaining product risk (D1-a). Nested `$ref` (cause 1) may still zero the catalog even after cause 2.

### Exploration log (2026-08-26) — cause 2: root `type: "object"`

`finalizeRootMcpInputSchema` expands a **bare root `$ref`** once from `$defs`. If the expanded body is not `type: "object"`, it wraps with `{ type: "object", allOf: [body], … }`. Nested `$ref`s unchanged. Fixes former root-`$ref`-only tools (`Miroir_compositeRunBoxedQueryAction`, `Miroir_compositeRunBoxedQueryTemplateAction`).
