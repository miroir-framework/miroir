# 229 — Dynamic MCP tools from deployed application endpoints (hot-reload, no restart)

> Analysis: how to replace the hard-coded, static MCP tool set in `miroir-mcp` by a live tool
> surface derived from the endpoints currently defined in all deployed applications, updated
> instantly (no server restart) when applications / deployments / endpoints change.

Related issue: https://github.com/miroir-framework/miroir/issues/229
Parent issue: https://github.com/miroir-framework/miroir/issues/156 (*finalize MCP server and CLI*)

**Status:** analysis + design framing — implementation proceeds per `tdd-implementation-plan.md`.

---

## 1. Goals

1. **Dynamic tool surface**: expose, at top level, one MCP tool per `(endpoint, action)` for
   every endpoint of every deployed application, with a strongly-typed `inputSchema` derived
   from the action's Jzod payload schema.
2. **Dynamic application set**: the set of served applications/deployments is discovered at
   runtime from the Admin deployment; the configured `applicationDeploymentMap` is only a
   bootstrap seed.
3. **Hot-reload**: adding / removing an application, deployment, endpoint or action updates the
   tool set **without server restart**; connected MCP clients are notified via
   `notifications/tools/list_changed`.

### Confirmed design decisions (with user)

| Question | Decision |
|----------|----------|
| Tool granularity | **One tool per (endpoint, action)** — keeps per-action typed input schemas, matches existing `miroir_createInstance`-style tools |
| Application/deployment discovery | **Dynamic, from Admin deployment** — query `Deployment` / `SelfApplication` instances; config map is the seed |
| Default exposure | **All endpoints of all deployed applications** — config include/exclude filters may follow |

---

## 2. Current state

### 2.1 Static tool construction (`packages/miroir-mcp/src/tools/Tools.ts`)

At **module load time**, `Tools.ts` builds a fixed parameter list:

- Miroir `instanceEndpointV1` with a hard-coded action subset
  (`createInstance`, `getInstance`, `getInstances`, `updateInstance`, `deleteInstance`,
  `deleteInstanceWithCascade`, `loadNewInstancesInLocalCache`), prefix `miroir_`.
- Library `lendingEndpoint` (uuid `212f2784-…`) with `lendDocument`, prefix `library_`,
  resolved through `getDefaultLibraryModelEnvironmentDEFUNCT(...)`.

`getMcpRequestHandlers(params)` reduces this to a static `McpRequestHandlers` record via
`mcpToolEntry(endpoint, actionType, toolPrefix)` (in `tools/mcpHandlersForEndpoint.ts`), which
already knows how to derive, for one `(endpoint, actionType)` pair:

- `mcpToolDescription` (name, description, JSON-schema `inputSchema` via
  `jzodElementToJsonSchema`),
- `payloadZodSchema` (runtime validation, via `jzodPayloadToZodSchema` + reference resolution),
- `actionEnvelope` (`{ actionType, actionLabel, endpoint: endpoint.uuid }`),
- `actionHandler` (`mcpToolHandler` closure).

### 2.2 Static serving (`packages/miroir-mcp/src/mcpServer.ts`)

`setupHandlersForServer` snapshots the handler record **once**:

```335:342:packages/miroir-mcp/src/mcpServer.ts
    const allInstanceActionTools = Object.values(mcpRequestHandlers).map((t) => t.mcpToolDescription);
    
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      log.info("ListToolRequest Received list_tools request");
      return {
        tools: allInstanceActionTools,
      };
    });
```

`CallToolRequestSchema` dispatches into the same static record. Nothing can change after startup.

### 2.3 Hard-coded execution environment (`handleMcpAction`)

`handleMcpAction` (in `tools/mcpHandlersForEndpoint.ts`) builds the `MiroirModelEnvironment`
passed to `domainController.handleAction` from `getDefaultLibraryModelEnvironmentDEFUNCT(...)`,
i.e. **every tool call, whatever its target application, runs against the Library model
environment**. This happens to work for the current Library-only sample but is wrong in
general.

### 2.4 What already exists and is reusable

- `mcpToolEntry(endpoint, actionType, toolPrefix)` — full `(endpoint, action)` → handler mapping.
- `localCache.currentModel(application, applicationDeploymentMap).endpoints` — **live** list of
  `EndpointDefinition` per application (`LocalCacheInterface`, `miroir-core`).
- `localCache.currentModelEnvironment(application, applicationDeploymentMap)` — per-application
  `MiroirModelEnvironment`, replacing the DEFUNCT Library-only helper.
- `localCache.getInnerStore()` — the Redux store; `store.subscribe(listener)` fires on every
  local-cache state change (instance commits, model migrations, rollbacks…).
- `Server.sendToolListChanged()` — MCP SDK `^1.0.4` emits
  `notifications/tools/list_changed`; the SDK also supports debouncing via
  `debouncedNotificationMethods: ['notifications/tools/list_changed']`.
- Deployment discovery pattern: deployments are `Deployment` instances in the **Admin**
  deployment data section (`entityDeployment`, attribute `selfApplication`); see
  `useDeploymentUuidFromApplicationUuid` in
  `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportHooks.ts`
  (extractor `extractorInstancesByEntity` on `entityDeployment`, filter on `selfApplication`).
- `DomainControllerInterface.handleBoxedExtractorOrQueryAction` — run such an extractor
  server-side, without React.

---

## 3. Design

### 3.1 New component: `EndpointToolRegistry`

A single deep module in `miroir-mcp` (new file
`packages/miroir-mcp/src/tools/EndpointToolRegistry.ts`) owning the whole dynamic tool surface:

```typescript
class EndpointToolRegistry {
  constructor(
    domainController: DomainControllerInterface,
    seedApplicationDeploymentMap: ApplicationDeploymentMap,
    options?: { include?: string[]; exclude?: string[] }, // endpoint/action filters, later
  );

  listTools(): McpToolDescription[];                       // live, computed from current state
  callTool(name, args): Promise<McpToolResult>;            // validation + DomainController dispatch
  start(onChange: () => void): void;                       // subscribe to local-cache store
  stop(): void;                                            // unsubscribe
}
```

`MiroirMcpServer` no longer receives a static `McpRequestHandlers`; it receives the registry
and wires:

- `ListToolsRequestSchema` → `registry.listTools()` (computed **at request time**),
- `CallToolRequestSchema` → `registry.callTool(name, args)`,
- `registry.start(() => server.sendToolListChanged())` — notification on change.

The registry keeps an internal handler cache keyed by `(endpoint.uuid, endpoint.version,
actionType)` so unchanged tools are not rebuilt (Jzod→Zod/JSON-schema conversion is
non-trivial); a change to the fingerprint invalidates only the affected entries.

### 3.2 Live endpoint enumeration

For each `applicationUuid` of the **current** application/deployment map (see 3.3):

```
endpoints = localCache.currentModel(applicationUuid, currentMap).endpoints
```

Each endpoint contributes one tool per action of `endpoint.definition.actions`, reusing
`mcpToolEntry(endpoint, actionType, toolName)` (extended to accept an explicit tool name instead
of a prefix — see 3.4). Actions without an `actionParameters.payload` schema keep the current
behavior (`mcpToolEntry` throws); the registry catches per-action failures, logs them, and skips
the offending tool so one broken endpoint cannot take down the whole surface.

### 3.3 Dynamic application/deployment discovery

- Seed: configured `applicationDeploymentMap` (must at least map the Admin self-application
  → Admin deployment, which the default config already does).
- Discovery: extractor on the Admin deployment data section —
  `extractorInstancesByEntity` on `entityDeployment` (via
  `handleBoxedExtractorOrQueryAction`) — returns all `Deployment` instances; each contributes
  `{ [deployment.selfApplication]: deployment.uuid }`. The seed map is merged in (seed wins on
  conflict, so Admin/Miroir mappings are always honored).
- Deployments whose stores are not open yet are skipped for tool listing (their model cannot be
  read from the local cache); they appear as soon as their `openStore`/init lands in the cache.
- Discovery runs **on demand**: instead of polling, the registry recomputes the map when the
  store subscription signals a change in the Admin deployment data (the fingerprint in 3.5
  includes the Admin `Deployment` instance set).

### 3.4 Tool naming

Constraints: MCP tool names must match `^[a-zA-Z0-9_-]{1,64}$`; names must be **stable** across
restarts (clients cache them) and **unique** across all applications.

Rules (deterministic):

1. base = `<applicationName>_<actionType>` (e.g. `Miroir_createInstance`,
   `Library_lendDocument`), sanitized: non `[a-zA-Z0-9_-]` → `_`.
2. Collision (two endpoints of the same application define the same `actionType`):
   disambiguate with the endpoint name: `<applicationName>_<endpointName>_<actionType>`.
3. Longer than 64 chars: truncate and append `_<8-char hash>` of the full name.

The legacy names `miroir_createInstance`… (`miroir_` prefix) become `Miroir_createInstance`…;
a compatibility alias layer is **not** planned — the test suite and clients are updated
(existing integ tests reference tool names in `mcpToolsTestCases.ts`).

### 3.5 Change detection & client notification

- Subscription: `localCache.getInnerStore().subscribe(listener)` (Redux) — fires on every
  local-cache mutation, no polling.
- Fingerprint (cheap, computed on each notification):
  - per application: sorted `endpoint.uuid@endpoint.version` list (+ count of actions);
  - the Admin-deployment `Deployment` instance set (`uuid`, `selfApplication`) — detects
    added/removed deployments.
- On fingerprint change: recompute the dynamic map (if the Admin set changed), invalidate
  affected handler-cache entries, then invoke `onChange` → `server.sendToolListChanged()`.
- The SDK option `debouncedNotificationMethods: ['notifications/tools/list_changed']` coalesces
  bursts (e.g. a composite action creating a deployment + model in one go).

### 3.6 Execution path generalization

`handleMcpAction` drops `getDefaultLibraryModelEnvironmentDEFUNCT` and resolves the model
environment per call:

```
application = endpointApplication(toolName)          // from registry resolution
modelEnvironment = localCache.currentModelEnvironment(application, currentMap)
domainController.handleAction(action, currentMap, modelEnvironment)
```

The `application` field of the action envelope payload (e.g. `createInstance` targets an
application given in its payload) is untouched — this change only concerns the *schema/model
environment* used to resolve the action definition.

### 3.7 Server/session note (known limitation, not in scope)

The MCP SDK `Server` (Protocol) accepts **one** transport at a time
(`connect` throws “Already connected to a transport”). The current `MiroirMcpServer`
connects every SSE session to a single shared `Server`, so (a) concurrent clients already race,
and (b) `sendToolListChanged()` reaches only the transport currently attached. Full multi-client
broadcast requires one `Server` per session (the `sessions` Map already anticipates this).
Tracked as a follow-up; the registry design (`onChange` callback) is agnostic to it.

---

## 4. Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Polling the stores on a timer | Latency + cost; Redux subscribe is exact and free. Avoids debounce-style anti-patterns. |
| One tool per endpoint (actionType as parameter) | Loses per-action typed `inputSchema`; worse LLM ergonomics; user chose per-(endpoint, action). |
| Static config listing tools per application (restart on change) | Exactly what the issue forbids. |
| File-system watching of deployment directories | Backend-specific (filesystem only), duplicates information the local cache already maintains. |
| `McpServer` high-level SDK helper with `registerTool` | Would re-send notifications per registration and hides dynamic listing; the low-level `Server` + dynamic `ListTools` handler is simpler for a fully computed surface. |

---

## 5. Risks / open questions

1. **Cost of `jzodPayloadToZodSchema`** per tool at first list: mitigated by the per-endpoint
   cache; measure on Miroir (≈11 endpoints × several actions) + Library.
2. **`currentModel` for not-yet-open deployments** throws/returns empty — registry must skip
   gracefully (log at debug level).
3. **Recursive Jzod references** in payload schemas: existing `resolveAllReferences` limitation
   (“not used in MCP tool payloads currently”) remains; unchanged behavior.
4. **Admin deployment absent from config**: discovery is impossible; fall back to seed map only
   (log a warning).
5. **Name stability vs renaming**: renaming an application or endpoint renames its tools
   (clients must re-list — they are notified). Acceptable; names are contractually cosmetic.
6. Follow-up issue: per-session `Server` instances for multi-client correctness (see 3.7).

---

## 6. Test strategy summary (details in `tdd-implementation-plan.md`)

Integration-first (project convention), vertical TDD slices:

1. `listTools` enumerates all `(endpoint, action)` of the seed deployments (Miroir + Library).
2. Calling a dynamically listed tool executes (typed validation + dispatch).
3. Adding an endpoint to the Library model → new tools listed, change notification emitted.
4. Removing an endpoint → tools disappear, notification emitted.
5. Creating a new application + deployment at runtime → its endpoint tools appear,
   notification emitted.
6. Unknown tool → structured `unknown_tool` error (preserved behavior).
