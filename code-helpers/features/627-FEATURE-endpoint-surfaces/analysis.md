# 627 — MCP tools, CLI commands and CopilotKit actions from the Endpoints of every deployed application

> Frames how the Endpoint actions of a deployed application reach agents (MCP), shells (CLI) and the in-app assistant (CopilotKit) the way Transformers and Actions already do: through the application's live model, with no code naming an application. Settles decision D9 of the epic analysis (one endpoint action catalog in `miroir-core`, one adapter per surface).

**Document role:** analysis and decision record for issue #627 (item I1 of epic #621).

**Document history:** revised after an adversarial review (2026-10-31): #558 scope made explicit (D3), CopilotKit access and subset rules tightened (D5), CLI reserved names (D4), framework flag moved to core (D1), collision bug restated (D2), dependency details corrected (D7).

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/627
- Epic: https://github.com/miroir-framework/miroir/issues/621, its analysis and plan in `code-helpers/features/621-FEATURE-npm-packages/` on PR #626 (W1, D9, I1 slices 0 to 5)
- Prior work reused here: #263 (identity and access gate), #519 (per-application model environment), #558 (instance payload rejection), #345 (test environments)
- Source files:
  - [`packages/miroir-mcp/src/tools/EndpointToolRegistry.ts`](../../../packages/miroir-mcp/src/tools/EndpointToolRegistry.ts)
  - [`packages/miroir-mcp/src/tools/mcpHandlersForEndpoint.ts`](../../../packages/miroir-mcp/src/tools/mcpHandlersForEndpoint.ts)
  - [`packages/miroir-mcp/src/tools/toolNameFor.ts`](../../../packages/miroir-mcp/src/tools/toolNameFor.ts)
  - [`packages/miroir-cli/src/commands/commandsFromEndpoint.ts`](../../../packages/miroir-cli/src/commands/commandsFromEndpoint.ts), [`packages/miroir-cli/src/index.ts`](../../../packages/miroir-cli/src/index.ts)
  - [`packages/miroir-ai/src/tools/miroirCopilotKitActions.ts`](../../../packages/miroir-ai/src/tools/miroirCopilotKitActions.ts), [`packages/miroir-ai/src/routes/copilotKitRoute.ts`](../../../packages/miroir-ai/src/routes/copilotKitRoute.ts)
  - [`packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AiActionsProvider.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AiActionsProvider.tsx) (the only client of `/api/copilotkit/lendDocument`)

## Status / sequencing

| Step | Item | State |
|---|---|---|
| Epic analysis and plan | #621, PR #626 | ✅ written, under review |
| Endpoint surfaces | **this issue** (I1) | **this** |
| Server router, template, rename, release | I3, I6, I7, I8 | later; I6 waits for this issue |

## Goals

| Id | Story |
|---|---|
| G1 | **Agent tools from my model.** In order to let an agent act on my application without writing glue code, as an application designer, I can add an Endpoint to my application's model and see its actions listed as MCP tools of the running server. |
| G2 | **Shell commands from my model.** In order to script my application, as an application maintainer, I can run each Endpoint action of every deployed application as a `miroir-cli` command, named the way the MCP tools are. |
| G3 | **Assistant actions from my model.** In order to let the in-app assistant propose my application's operations, as an application designer, I can have the Endpoint actions of my application offered as CopilotKit actions. |
| G4 | **Calls checked against my model.** In order to get the same validation everywhere, as an MCP client or CLI user, my call on an application is checked against that application's Entities, not against the Library's. |
| G5 | **Publishable surfaces.** In order to publish `miroir-mcp`, `miroir-cli` and `miroir-ai` (#621), as the framework maintainer, I can install them without `miroir-example-library`. |
| G6 | **Nothing breaks for today's users.** In order to keep my scripts and agent prompts, as a current user, I can still call `Library_lendDocument` and `Miroir_createInstance` over MCP and `lendDocument` and `createInstance` over the CLI. |

## Non-goals

| Excluded | Owner |
|---|---|
| Choosing, per action, which surfaces expose it (an opt-in or opt-out tag on the action) | follow-up of D9-c in the epic analysis, its own issue when a user asks for it |
| A generic CopilotKit proposal form in the standalone app replacing `propose_lendDocument` | the standalone app shell move (I2) or a later UI issue; the form stays Library-specific there |
| Resolving the application's own schema references in MCP payload schemas (`resolveAllReferences` only sees the Miroir fundamental schema) | its own issue; recorded in Current state |
| Checking instances nested in composite or transactional actions against their Entity (#558 runs on top-level `createInstance` / `updateInstance` only; `compositeActionTemplate` Endpoint actions such as `lendDocument` and `fixtureCreateItem` are not covered) | follow-up issue: run the guard inside `DomainController` instance handling, for every surface |
| A generic frontend handler running any CopilotKit endpoint action in agent mode (agent mode forwards tool calls to the frontend, which handles `propose_lendDocument` only) | with the generic proposal form above |
| Removing `miroir-example-library` from `miroir-server`'s dependencies | the "server serves a user-chosen bundle" step after #621 |
| Renaming the packages | I6 |

## Decision record

All decisions below are Claude's recommendation, taken so the work can proceed; each is reversible before merge.

### D1 — Where the endpoint action catalog lives (G1, G2, G3, G5)

| Option | Pros | Cons |
|---|---|---|
| a. Keep the enumeration in `miroir-mcp`; CLI and AI import it from there | no move | `miroir-cli` and `miroir-ai` would depend on the MCP SDK; the enumeration stays MCP-shaped |
| **b. A surface-neutral catalog in `miroir-core` (`2_domain/EndpointActionCatalog.ts`), one adapter per surface** | one enumeration, one naming rule, one executor; core already exports `getEndpointActions`, `authorizeDeployment`, `rejectInstancesNotMatchingTheirEntity` and imports `miroir-app-admin` | core grows by one module; it must stay browser-safe |
| c. A new package `miroir-endpoint-surfaces` | isolated | one more package to version and publish, against the curated set of D2 in the epic |

**Accepted: b** (the epic's D9-b). Framework knowledge stays in core: each catalog entry carries `frameworkApplication: boolean` (true for the Miroir and Admin applications, known to core through `miroir-app-miroir` and `miroir-app-admin`), so no adapter names an application. The catalog reads the local cache through `LocalCacheInterface` and calls the DomainController through `DomainControllerInterface`, so layer 2 references only interfaces from layer 3 and implementations from layer 1.

### D2 — One name per action, shared by every surface (G2, G6)

| Option | Pros | Cons |
|---|---|---|
| **a. The current MCP name (`<application>_<actionType>`, `<application>_<endpoint>_<actionType>[_n]` on collision) for all surfaces; the CLI also registers the bare `actionType` as a commander alias when exactly one action in the catalog has it** | MCP names unchanged; CLI scripts using `lendDocument` and `createInstance` keep working; one rule documented once | an alias disappears when a second application declares the same action type (the long name keeps working; the CLI logs which alias it dropped) |
| b. Bare action types on the CLI only | shortest | collides as soon as two applications share an action type; differs from MCP |
| c. Per-surface naming rules | each surface idiomatic | three rules to learn and keep apart |

**Accepted: a.** The naming moves from `miroir-mcp/src/tools/toolNameFor.ts` to the catalog. Its truncation hash moves from `node:crypto` md5 to a browser-safe 32-bit FNV-1a, so the catalog can live in core (the fingerprint in `1_core/mls/schemaChangeKind.ts` makes the same choice). Only names over 64 characters change; slice 0 records that no current name is that long. The move also fixes a collision bug: `takenNames.has(base)` (`toolNameFor.ts` line 36) and the `_n` loop (line 42) test untruncated candidates against a set of truncated names, so an identical base over 64 characters (same application and action type on two endpoints) is returned twice. Both checks compare truncated candidates after the move.

Application names come from the AdminApplication data, then the SelfApplication, then the uuid (`resolveApplicationNames`). Because the catalog computes them once for every surface, MCP and CLI names cannot drift apart.

### D3 — Which model environment a call runs with (G4)

| Option | Pros | Cons |
|---|---|---|
| a. The endpoint's own application, always | simple | `Miroir_createInstance` on a Library Book runs with the Miroir model, so #558 finds no `Book` Entity and lets any object through (today's MCP behaviour, Current state §2) |
| **b. The target application: `payload.application` when the action belongs to an Endpoint of the Miroir application and names a deployed application; otherwise the endpoint's own application** | each call is checked against the Entities it writes; application Endpoints whose payload has an unrelated `application` field are not misread | one rule to document; a Miroir action whose payload names no deployed application falls back to the Miroir model |
| c. Let the caller pass an environment | flexible | puts the burden on every adapter, which is how the Library fallback crept in |

**Accepted: b.** The environment is `localCache.currentModelEnvironment(targetApplication, map)` (#519). It throws when the application is not in the map (`localCache/Model.ts` lines 86–92), so the executor tests map membership first: a `createStore` or `createDeployment` naming an application not yet deployed runs with the endpoint's own (Miroir) environment.

**Scope of the payload check (issue acceptance criterion 2).** #558 (`rejectInstancesNotMatchingTheirEntity`, `instanceSchemaGuard.ts` line 25) checks top-level `createInstance` and `updateInstance` only. With D3 it now checks them against the target application's Entities: `Miroir_createInstance` with a fixture `Country` whose `name` is not a string is refused, where today it passes. An application Endpoint action implemented by a `compositeActionTemplate` (`lendDocument`, `fixtureCreateItem`) wraps its `createInstance` in a sequence the guard does not open, and so do `transactionalInstanceAction` and `compositeActionSequence`; this gap predates the issue and is a Non-goal. The acceptance criterion is proven on `Miroir_createInstance` targeting the fixture application. The Library fallback in `handleMcpAction` and `handleCliAction` is deleted, and the environment becomes a required parameter of the executor. `DomainController.handleApplicationAction` resolves Miroir endpoints from `defaultMiroirModelEnvironment` whatever environment is passed (`DomainController.ts` lines 3373–3381, #341), so a Library environment does not hide the instance endpoint.

### D4 — When CLI commands are registered (G2)

| Option | Pros | Cons |
|---|---|---|
| **a. Eagerly, from the catalog, after `initializePlatform` and before `parseAsync`** | `main()` already starts the platform before registering commands (`index.ts`); `list` and `--help` show the deployed actions | every invocation loads the model (already the case today) |
| b. Lazily, resolving the command name at parse time | no listing cost | `list` and help cannot show the commands without the model anyway |

**Accepted: a.** `getAllCommands()` and `getCommandByName()` become functions of the catalog entries; the static `cliRequestHandlers*` maps go. Commander throws on a duplicate command name or alias, and `list` (registered by `main()`) and `help` (commander's own) are taken, so the CLI never registers those two as aliases, logs every alias it skips, and catches a registration error per command so that one bad Endpoint cannot stop the CLI.

### D5 — Which actions CopilotKit offers, and how they run (G3, G4)

| Option | Pros | Cons |
|---|---|---|
| a. Every catalog action, as MCP | uniform | 48 framework actions (instance, domain, model, persistence, store management, …) flood the assistant's tool list; the agent backend already reaches them through MCP |
| **b. The actions of every deployed application except the framework applications Miroir and Admin** | the assistant sees the designer's own operations (today `lendDocument`, plus the fixture action in tests); framework operations stay on MCP | needs a framework flag computed in core (D1) so that `miroir-ai` names no application |
| c. A per-action tag | precise | the Non-goal above |

**Accepted: b**, using the catalog's `frameworkApplication` flag (D1), so `miroir-ai` names no application. The other rules:

| Rule | Why |
|---|---|
| Each CopilotKit action carries the catalog name and the payload's CopilotKit parameters (`mlsToCopilotKitParameter`); actions whose payload is not an object are skipped with a log line | `mlsToCopilotKitParameter(...).attributes` only exists for objects (`miroirCopilotKitActions.ts` lines 62–69) |
| The router builds the actions per request, as it already builds the runtime per request (lines 345, 385–388, 426) | new Endpoints appear without a restart |
| Each action handler is a closure over the request's `req.miroirAuthentication` and runs the D6 executor with that principal and access context | in token-runtime mode CopilotKit runs the handler server-side with no request; today `createLendDocumentExecutor` calls `handleAction` with no principal and no check (lines 116–121) |
| `createCopilotKitRouter` takes `authenticationEnabled` in its options; the server mount (`mountCopilotKitRoute.ts` line 66) and the Electron mount (`ipcServerSetup.ts` line 158) pass it | the identity middleware stores `{allowed, principal, access}` only (`authenticationMiddleware.ts`); with the gate off the principal is undefined and `authorizeDeployment(true, …)` would deny every call |
| `POST /api/copilotkit/lendDocument` becomes `POST /api/copilotkit/endpointAction/:name`, which resolves `:name` among the non-framework entries only (404 otherwise) and runs the same access check as `callTool` | Miroir and Admin targets are always allowed (`AccessPolicy.ts` lines 35–38), so exposing framework actions there would let any authenticated user write Admin data over HTTP |
| `AiActionsProvider.tsx` posts its `propose_lendDocument` acceptance to `endpointAction/Library_lendDocument` | the standalone app may name the Library, the packages may not |

The epic plan expected CopilotKit names `lendDocument` and `fixtureCreateItem`; D2 makes them `Library_lendDocument` and `appForTest_fixtureCreateItem`, the MCP names. In agent mode CopilotKit forwards tool calls to the frontend (`copilotKitRoute.ts` lines 177–179), which handles `propose_lendDocument` only; acceptance criterion 1 is met by the action list and by the token-runtime handler, and a generic frontend handler is a Non-goal.

### D6 — Shared executor and access check (G4, G6)

| Option | Pros | Cons |
|---|---|---|
| **a. One executor in the catalog: build the envelope, resolve the target environment (D3), check access when a context is given, reject mismatching instances (#558), call `handleAction` with the principal; it returns `Action2ReturnType`. Adapters keep their own payload validation and result formatting** | the #263 and #558 rules live once; MCP and CLI results keep their shape | MCP's and CLI's Zod validation stay duplicated (different error formats) |
| b. Executor also validates the payload | less duplication | forces one error format on three surfaces |

**Accepted: a.** The CLI passes no access context: its calls go through the emulated server, where `authenticateCli` installs the #263 gate on `restClientStub`. `mcpToolHandler` and `mcpToolEntry().actionHandler`, which call `handleMcpAction` without an environment and have no caller outside the file, are deleted.

### D7 — Dependency cleanup and its guard (G5)

| Option | Pros | Cons |
|---|---|---|
| **a. Move `miroir-example-library` to `devDependencies` in `miroir-mcp`, `miroir-localcache-redux` and `miroir-localcache-zustand` (their tests import it); drop it from `miroir-ai` (no test imports it) and drop the duplicate `dependencies` entry in `miroir-cli`; a pytest guard fails when one of those five packages, or `miroir-core`, lists a `miroir-example-*` or `miroir-fixture-*` package in `dependencies` or imports one (`import` / `from` statements only) from `src/`** | the issue's acceptance criterion, kept true by CI (`pytest scripts/tests` runs in the pre-push gate) | the guard's package list must grow as I6 renames packages |
| b. Remove the dependency without a guard | less code | it comes back with the next quick fix |

**Accepted: a.** The guard is `scripts/tests/test_package_runtime_dependencies.py`. It matches import statements, not strings, because core's `src/5_tests/applicationMiroirTestFolders.ts` names `miroir-example-` packages in literals. The `src/` check matters beyond the manifest: tsup inlines an imported devDependency, so a missed import would silently bundle the Library.

What stays: the CLI's `seedEnvironmentState` loads the packages an environment file names (`dev.json` and `test-*.json` name `miroir-example-library`), so a published CLI on such an environment still needs that package installed. That is the environment's dependency, not the CLI's, and the docs say so.

## Current state

### 1. MCP (`miroir-mcp`): live, but with a Library fallback — partly aligned

`EndpointToolRegistry.listTools()` (lines 175–240) already does what G1 wants: for every application of `resolveCurrentApplicationDeploymentMap()` (the seed map plus the deployments in the Admin data section, lines 156–172) it reads `localCache.currentModel(app, map).endpoints`, keeps well-formed endpoints sorted by uuid, keeps the actions that have an `actionType` and a `payload`, names each one with `toolNameFor` and builds it with `mcpToolEntry`. `start()` subscribes to the store and re-lists when a fingerprint of endpoint instances and Admin deployments changes (lines 86–148).

`callTool()` (lines 243–285) checks access (#263) on the tool's deployment and every deployment the payload names, then passes `currentModelEnvironment(entry.applicationUuid, currentMap)`: the **endpoint's** application. For `Miroir_createInstance` that is the Miroir model.

`handleMcpAction()` in `mcpHandlersForEndpoint.ts` (lines 277–282):

```ts
const libraryDeploymentUuid = resolveLibraryDeploymentUuid(applicationDeploymentMap);
const defaultLibraryModelEnvironment = modelEnvironmentOverride ?? getDefaultLibraryModelEnvironmentDEFUNCT(
  defaultMiroirMetaModel,
  undefined as any, // not used
  libraryDeploymentUuid,
);
```

then (lines 298–302) rejects instances against `[...environment.currentModel.entities, ...metaModelEntities]`. Truth table for a `createInstance` on a Library `Book`:

| Entry point | Environment passed | Entities seen by #558 | `Book` checked? |
|---|---|---|---|
| `EndpointToolRegistry.callTool("Miroir_createInstance", …)` | Miroir application | Miroir entities + meta-model entities | no (not found, skipped) |
| `mcpToolEntry(...).actionHandler` (no caller outside the file) | none, Library fallback | Library entities + meta-model | yes |

So the registry is live but runs Miroir actions with the wrong model, and the file imports `getDefaultLibraryModelEnvironmentDEFUNCT` and `resolveLibraryDeploymentUuid` from `miroir-example-library` (lines 28–31) for a fallback the registry never uses.

`resolveAllReferences` (MCP payload schema) resolves references against the Miroir fundamental schema only (`MCP_PAYLOAD_VALIDATION_MAX_DEPTH = 12`); a payload referencing an application schema is not expanded. Out of scope (Non-goals).

### 2. CLI (`miroir-cli`): static list, Library environment — misaligned

`commandsFromEndpoint.ts` builds its commands at module load:

| Map | Content | Source |
|---|---|---|
| `cliRequestHandlers_EntityEndpoint` | 7 commands: `createInstance`, `getInstance`, `getInstances`, `updateInstance`, `deleteInstance`, `deleteInstanceWithCascade`, `loadNewInstancesInLocalCache` | `instanceEndpointV1` from `miroir-app-miroir` |
| `cliRequestHandlers_Library_lendingEndpoint` | 1 command: `lendDocument` | `defaultLibraryAppModel.endpoints` filtered on uuid `212f2784-5b68-43b2-8ee0-89b1c6fdd0de` |

`handleCliAction` (lines 238–302) always builds `getDefaultLibraryModelEnvironmentDEFUNCT(defaultMiroirMetaModel, instanceEndpointV1, resolveLibraryDeploymentUuid(map))` and does not run the #558 rejection. `main()` in `index.ts` starts the platform, authenticates unless the command is `list` or `help`, then registers `getAllCommands()` on a fresh `commander` program. No other application's Endpoint is reachable from the CLI.

### 3. CopilotKit (`miroir-ai`): one Library action — misaligned

`miroirCopilotKitActions.ts` computes, at module load (lines 37–75), the Library model with `getDefaultLibraryModelEnvironmentDEFUNCT`, picks the endpoint `212f2784-…` and throws if it is missing. `createLendDocumentExecutor` (lines 92–137) runs `lendDocument` with a map forced to contain `selfApplicationLibrary.uuid → deployment_Library_DO_NO_USE.uuid` and the Library environment. `createMiroirCopilotKitActions` returns `[lendDocumentTool, generateMiroirReportTool, getMiroirContextTool]`. `createCopilotKitRouter` builds the actions once (line 166) but the CopilotKit runtime per request (lines 345, 385–388, 426), and serves `POST /lendDocument` (lines 180–188) without a deployment access check; the server mounts the router behind the identity middleware only (`mountCopilotKitRoute.ts` line 62).

The frontend counterpart `propose_lendDocument` in `AiActionsProvider.tsx` (lines 531–590) renders `AiLendProposalForm` and posts the accepted proposal to `/lendDocument`.

### 4. Package manifests

| Package | `miroir-example-library` in | `src/` imports |
|---|---|---|
| `miroir-mcp` | `dependencies` | `mcpHandlersForEndpoint.ts` |
| `miroir-cli` | `dependencies` and `devDependencies` | `commandsFromEndpoint.ts` |
| `miroir-ai` | `dependencies` | `miroirCopilotKitActions.ts` |
| `miroir-localcache-redux` | `dependencies` | none (3 test files import it) |
| `miroir-localcache-zustand` | `dependencies` | none (2 test files import it) |
| `miroir-core` | `devDependencies` | none (comments and test-folder paths only) |
| `miroir-server` | `dependencies` | out of scope |

### 5. Fixture application

`miroir-fixture-appForTest` (self application `eef01001-0001-4000-8000-000000000001`, AdminApplication name `appForTest`, deployment `eef01001-0002-4000-8000-000000000002`) is installed by every test environment (`environments/test-filesystem.json`). Its model has two Entities, `Publisher` (`a027c379-8468-43a5-ba4d-bf618be25cab`) and `Country` (`d3139a6d-0486-4ec8-bded-2a83a3c3cee4`, attributes `name`, optional `iso3166-1Alpha-2` and `icon`), and no Endpoint. The Library's `Lending` Endpoint (`212f2784-…`) shows the pattern: an action whose `actionImplementation` is a `compositeActionTemplate` creating an instance from the payload. The fixture Endpoint planned by the epic (`bb447b8c-a687-408a-bc59-293aea293906`, name `fixtureEndpoint`, action `fixtureCreateItem`) follows it and creates a `Country`.

## Target design

```
                      LocalCacheInterface (live model, Admin deployments)
                                      │
                 miroir-core  2_domain/EndpointActionCatalog.ts
     listEndpointActions(localCache, seedMap) → EndpointActionEntry[]
        { name, applicationUuid, applicationName, endpoint, actionType,
          payloadMlSchema, description, actionEnvelope }
     endpointActionFingerprint(localCache, seedMap) → string
     executeEndpointAction(entry, payload, { domainController, map, context? })
        → envelope, target environment (D3), access (D6), #558, handleAction
          ┌──────────────────────┼─────────────────────────┐
   miroir-mcp               miroir-cli                 miroir-ai
   EndpointToolRegistry     registerCommands from      CopilotKit actions per request
   (JSON schema, Zod,       catalog + unique aliases   (non-framework applications)
    MCP result shape)       (Zod, CLI result shape)    + POST endpointAction/:name
```

| Effect required by a decision | Produced by |
|---|---|
| A fixture Endpoint appears on three surfaces (G1–G3) | `listEndpointActions` over the live model, consumed by the three adapters |
| Same names everywhere (D2) | naming inside `listEndpointActions`; adapters never rename (the CLI only adds aliases) |
| Calls checked against the target application's Entities (D3) | `executeEndpointAction` computing the target environment, then running #558 on top-level instance actions |
| No adapter names an application (D1, D5) | `frameworkApplication` on each catalog entry |
| CopilotKit calls run as the caller (D5) | per-request action closures over `req.miroirAuthentication`, `authenticationEnabled` option |
| No Library code in the packages (D7) | deletion of the fallbacks and static maps; the guard |
| CopilotKit sees new Endpoints without restart (D5) | actions computed per request in `createCopilotKitRouter` |

## Key reuse / inventory

| Piece | Location |
|---|---|
| `getEndpointActions` | `packages/miroir-core/src/0_interfaces/1_core/endpointDefinition.ts` line 108 |
| `authorizeDeployment`, `deploymentUuidsFromHttpRequest` | `packages/miroir-core/src/1_core/authentication/AccessGate.ts` |
| `rejectInstancesNotMatchingTheirEntity` (#558) | `packages/miroir-core/src/1_core/Entity/instanceSchemaGuard.ts` |
| `LocalCacheInterface.currentModel`, `currentModelEnvironment` (#519) | `packages/miroir-core/src/0_interfaces/4-services/LocalCacheInterface.ts` |
| `adminSelfApplication`, `entityDeployment`, `entityApplicationForAdmin` | `miroir-app-admin` (already imported by core) |
| `entityEndpointVersion`, `defaultMiroirMetaModel` | `miroir-app-miroir` |
| `mlsToCopilotKitParameter`, `mlsToJsonSchema` | `miroir-core` exports |
| Browser-safe fingerprint precedent | `packages/miroir-core/src/1_core/mls/schemaChangeKind.ts` line 208 |
| MCP test platform on test environments | `packages/miroir-mcp/tests/integration/mcpTestPlatform.ts` |
| CLI platform start | `packages/miroir-cli/src/platform.ts` (`initializePlatform`) |
| Fixture application and its Entities | `packages/miroir-fixture-appForTest/assets/appForTest_model/` (uuids in Current state §5) |
| Fixture Endpoint uuid allocated by the epic | `bb447b8c-a687-408a-bc59-293aea293906` (Endpoint Entity `3d8da4d4-8f76-4bb4-9212-14869d81c00c`) |

## Risks

| Risk | Mitigation |
|---|---|
| Adding an Endpoint to the fixture changes counts or snapshots in other tests (model validation, nonreg, MCP lists asserted exactly) | slice 0 lists the tests that read the fixture model; full `nonreg:filesystem` before the PR |
| The CLI now lists every application's actions, so `list` gets long | grouped by application in `list`; aliases keep short names |
| `rejectInstancesNotMatchingTheirEntity` now runs on Library writes via MCP where it did not (Current state §1), so an existing MCP test payload that does not match `Book` starts failing | that is the intended fix (G4); such a test payload is corrected, not the check |
| `secretsRedact.270.phase3.unit.test.ts` and `mcpHandlersForEndpoint.unit.test.ts` call `handleMcpAction` without an environment | they pass one once it is required |
| On an environment without the Library (`local.json`, `cloud-agent.json`) `Library_lendDocument` is no longer offered to CopilotKit; today `miroir-ai` forces the Library into the map (`miroirCopilotKitActions.ts` lines 96–99) | intended: a surface lists what the environment deploys (G6 holds on environments that deploy the Library) |
| CopilotKit action names change from `lendDocument` to `Library_lendDocument` | the frontend registers `propose_lendDocument` itself and only posts to the route; the backend action name is visible to the model only |

## Next

The slices are in [`tdd-implementation-plan.md`](tdd-implementation-plan.md).
