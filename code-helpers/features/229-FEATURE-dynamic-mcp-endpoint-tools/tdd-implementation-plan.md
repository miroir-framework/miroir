# 229 — TDD implementation plan: dynamic MCP endpoint tools

> Vertical TDD slices (RED → GREEN each), integration-first per project convention
> (`docs/contributing/testing.md`): tests exercise the real DomainController + local cache with
> the emulated server (`tests/config.mcp-emulatedServer.json`), through the registry's public
> interface — no mocks, no HTTP/SSE except where transport behavior itself is the target.

Analysis: `analysis.md` · Issue: https://github.com/miroir-framework/miroir/issues/229

---

## Public interface under test (new)

```typescript
// packages/miroir-mcp/src/tools/EndpointToolRegistry.ts
class EndpointToolRegistry {
  constructor(
    domainController: DomainControllerInterface,
    seedApplicationDeploymentMap: ApplicationDeploymentMap,
  );
  listTools(): Promise<McpToolDescription[]>;   // live tool surface
  callTool(name: string, args: unknown): Promise<McpToolResult>; // validate + dispatch
  start(onChange: () => void): void;            // subscribe + fingerprint + notify
  stop(): void;
}
```

Server wiring changes (in `mcpServer.ts`): `ListTools` → `registry.listTools()` at request
time; `CallTool` → `registry.callTool(...)`; `sendToolListChanged()` on `onChange`.

Behaviors prioritized with user: 1 → 7 below, in order. Naming rule: `<ApplicationName>_<actionType>`
(sanitized, endpoint-name disambiguation on collision, 64-char truncation with hash suffix).

---

## Slice 1 ✅ DONE — tracer bullet: `listTools` enumerates all (endpoint, action) of seed deployments

**RED** — new file `packages/miroir-mcp/tests/integration/endpointToolRegistry.integ.test.ts`
(setup copied from `mcpTools.integ.test.ts`: emulated server, reset Miroir + Library
deployments in `beforeEach`):

- `listTools()` contains `Miroir_createInstance` and `Library_lendDocument`;
- every returned tool has `name` matching `^[a-zA-Z0-9_-]{1,64}$`, a non-empty `description`,
  and an `inputSchema` of `type: "object"`;
- the count equals the sum of actions over endpoints of Miroir + Admin + Library current models.

**GREEN** — minimal `EndpointToolRegistry`: iterate seed map →
`localCache.currentModel(application, map).endpoints` → per action reuse
`mcpToolEntry(endpoint, actionType, toolName)` (extend `mcpToolEntry` to take an explicit tool
name; keep prefix overload for existing callers). Per-action failures are caught, logged,
skipped. No caching yet.

## Slice 2 ✅ DONE — `callTool` executes a dynamically listed tool on the right application

**RED**: `callTool("Miroir_createInstance", <book payload>)` returns
`content[0].parsed.status === "success"`; the created book is fetchable via
`callTool("Miroir_getInstance", ...)`. Also `Library_lendDocument` executes (action targeting
the Library deployment, model environment resolved for Library — not via
`getDefaultLibraryModelEnvironmentDEFUNCT`).

**GREEN**: registry resolves `toolName → (application, endpoint, actionType)`; build action
envelope as today; model environment via
`localCache.currentModelEnvironment(application, currentMap)`; remove the DEFUNCT helper from
the `handleMcpAction` path (registry owns its dispatch; legacy `handleMcpAction` stays for the
old static handlers until slice 7 cleanup).

## Slice 3 ✅ DONE — server wiring: ListTools / CallTool served from the registry

**RED**: handler-level test on `setupHandlersForServer`-equivalent wiring: invoke the
registered `ListTools` handler twice, mutating nothing — results equal `registry.listTools()`;
`CallTool("unknown_tool")` returns the structured `unknown_tool` error (preserved behavior).
Optionally extend `mcpClient.ts` with `listToolsViaHttp` and run through SSE.

**GREEN**: `MiroirMcpServer` accepts an `EndpointToolRegistry` instead of static
`McpRequestHandlers`; `ListTools` computes at request time; `CallTool` delegates. Keep the old
constructor path compiling (flag/default) until slice 7.

## Slice 4 ✅ DONE — add an endpoint at runtime → tools appear, `onChange` fires (no restart)

**RED**: with the registry started (`start(onChangeSpy)`), create a new `Endpoint` instance in
the Library **model** section (instance action targeting `applicationSection: "model"` +
commit/rollback-style refresh as in existing test setup). Assert, **without recreating the
registry**:

- `onChangeSpy` was called (exactly once per logical change);
- `listTools()` now contains the new endpoint's action tools.

**GREEN**: `start()` subscribes to `localCache.getInnerStore().subscribe(...)`; fingerprint =
per-application sorted `endpoint.uuid@endpoint.version` (+ action count) map; on change →
invalidate affected cache entries, call `onChange`. Add the per-(endpoint, version, action)
handler cache now (only invalidated entries are rebuilt).

## Slice 5 ✅ DONE — remove an endpoint at runtime → tools disappear, `onChange` fires

**RED**: delete the endpoint created in slice 4 (model-section delete + refresh); assert
`onChangeSpy` called and its tools are gone from `listTools()`; `callTool` on the removed tool
returns the structured `unknown_tool` error.

**GREEN**: nothing expected beyond slice 4 machinery (fingerprint covers removals); fix what
the test reveals.

## Slice 6 ✅ DONE — new application + deployment at runtime → discovered, tools appear

**RED**: run `createDeploymentCompositeAction` for a new throwaway application (reuse the
pattern of `resetAndinitializeDeploymentCompositeAction` with a minimal model exposing one
endpoint), open its stores, refresh caches. Assert, without restart:

- `onChangeSpy` fired (Admin `Deployment` instance set changed);
- `listTools()` contains `<NewAppName>_<actionType>` tools;
- `callTool` on one of them succeeds against the new deployment.

**GREEN**: discovery — extractor `extractorInstancesByEntity` on `entityDeployment` (Admin data
section) via `handleBoxedExtractorOrQueryAction`, merged over the seed map; fingerprint
extended with the Admin `Deployment` instance set; deployments whose stores are not open are
skipped with a debug log.

## Slice 7 ✅ DONE — naming unit tests + cleanup + migration of existing tests

**RED** (unit, `tests/unit/endpointToolNaming.unit.test.ts`): sanitization (`My App!` → `My_App`),
collision disambiguation (two endpoints, same `actionType` → endpoint name inserted), 64-char
truncation + stable hash suffix, name stability across recomputations.

**GREEN**: extract the naming logic into a pure function
(`toolNameFor(applicationName, endpointName, actionType, takenNames)`).

**Cleanup**: delete `ToolsForApplication_Library.ts` (dead code), retire
`defaultGetMcpRequestHandlersFromEndpointParams`/static path in `Tools.ts`, rename tool names in
`mcpToolsTestCases.ts` (`miroir_*` → `Miroir_*`, `library_lendDocument` → `Library_lendDocument`),
make `MiroirMcpServer` registry-only, enable SDK
`debouncedNotificationMethods: ['notifications/tools/list_changed']`.

### Slice 7 outcome (as implemented)

- `tests/unit/endpointToolNaming.unit.test.ts` — 13 unit tests covering sanitization, truncation
  (limit, hash suffix, determinism, distinctness) and `toolNameFor` (base form, sanitization,
  endpoint disambiguation, numeric suffix, truncation).
- Static tool path fully removed: `Tools.ts`, `ToolsForApplication_Miroir.ts`,
  `ToolsForApplication_Library.ts` deleted; `getMcpRequestHandlers` /
  `defaultGetMcpRequestHandlersFromEndpointParams` no longer exported from `src/index.ts`;
  dead import cleaned in `miroir-server/src/server.ts`.
- `mcpToolsTestCases.ts` migrated to registry tool names; the unused static `handler` plumbing
  (and `runMcpTestsViaHandler`) removed.
- `mcpTools.integ.test.ts` is now **self-contained**: it starts an in-process registry-backed
  MCP server on an ephemeral port instead of requiring an external server on `:4080`.

### Hardening fixes uncovered by Slice 7 (full-suite runs)

- **Vitest pool**: Vitest 3 defaults to the `forks` pool, silently ignoring
  `poolOptions.threads.singleThread`; integration files ran in parallel against the same
  on-disk stores. `vitest.config.ts` now sets `pool: "threads"` explicitly.
- **Per-connection MCP `Server`** (moved out of "out of scope", was required): the SDK
  `Protocol` supports one transport per instance; one `Server` is now created per SSE
  connection, `list_changed` notifications broadcast to all sessions, and session servers are
  closed on disconnect / shutdown.
- **Process handlers**: `setupMcpServer` no longer registers `SIGINT`/`uncaughtException →
  process.exit` handlers (entrypoint-only concern, registered in `src/index.ts`);
  `mcpToolsTestCases.ts` no longer imports the entrypoint `src/index.js`.
- **Test-asset hygiene**: Slice 6's runtime-created deployment leaves no residue — the test
  deletes its `AdminApplication`/`Deployment` rows from the shared Admin data store in
  `finally`. Stray artifacts created outside the repo by wrong-CWD invocations removed.
- **Stale fixture**: `mcpToolDescriptionFromActionDefinition.unit.test.ts` `getInstances`
  expectation updated with the `attributes` allow-list added by #214.

---

## Definition of done (maps to issue acceptance criteria)

| # | Criterion | Slice |
|---|-----------|-------|
| 1 | ListTools enumerates every (endpoint, action) of deployed applications | 1, 3 |
| 2 | Add endpoint → tools without restart | 4 |
| 3 | Remove endpoint → tools gone without restart | 5 |
| 4 | Add application + deployment → tools without restart | 6 |
| 5 | `notifications/tools/list_changed` emitted on change | 4–6 (`onChange` → `sendToolListChanged` in wiring) |
| 6 | Dynamically created handlers execute correctly | 2, 6 |
| 7 | Existing behavior preserved or explicitly migrated | 3, 7 |

## Commands

```bash
# new integration suite (per-file)
npm run testByFile -w miroir-mcp -- endpointToolRegistry

# unit naming tests
npm run testByFile -w miroir-mcp -- toolNaming

# regression on existing MCP tests
npm run testByFile -w miroir-mcp -- mcpTools

# full package suite
npm run test -w miroir-mcp
```

## Out of scope / follow-ups

- Config include/exclude filters for endpoint exposure.
- CLI parity (parent #156 also covers the CLI; this issue is MCP-server-only).
