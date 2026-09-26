# #311 REFACTOR: architecture review, deepening opportunities

Issue: [#311](https://github.com/miroir-framework/miroir/issues/311). Branch: `311-REFACTOR-architecture-review`, from `_integration @ 78dc552`. Date: 2026-09-26.

Visual report: [`architecture-review.html`](architecture-review.html) (open it in a browser; it loads Tailwind and Mermaid from CDNs). This file carries the same candidates in Markdown, with their evidence, for diffs and for agents.

## Method

- Skill `improve-codebase-architecture`, with the `codebase-design` vocabulary: **module**, **interface**, **implementation**, **depth**, **seam**, **adapter**, **leverage**, **locality**, and the deletion test.
- The repository has no `CONTEXT.md` and no `docs/adr/`, so no ADR constrains these candidates. Domain terms come from `AGENTS.md` and `docs/`.
- Scope from the commit history (340 commits since 2026-08-26; the clone is shallow). Seven areas were walked in parallel, read-only; the strongest claims were then re-read in the code.
- Counts and line numbers were checked unless marked *inferred* or *reported, not re-checked*.

### Hot spots (changes since 2026-08-26)

| File | Changes | Lines |
|---|---:|---:|
| `packages/miroir-core/src/index.ts` | 71 | 1,887 |
| `packages/miroir-core/src/3_controllers/DomainController.ts` | 24 | 6,507 |
| `packages/miroir-server/src/server.ts` | 22 | 966 |
| `packages/miroir-core/src/4_services/ExternalServiceClient.ts` | 17 | 828 |
| `…/4_view/components/Reports/MultistepReportHost.tsx` | 15 | 1,109 |
| `…/4_view/components/Reports/ReportSectionListDisplay.tsx` | 14 | 1,018 |
| `packages/miroir-test-app_deployment-miroir/src/Model.ts` | 13 | 561 |
| `…/4-tests/uiIntegrationTestRunnerSuiteRegistry.ts` | 13 | 334 |
| `packages/miroir-core/src/4_services/RestClientStub.ts` | 11 | 313 |
| `…/4_view/components/Reports/ReportViewWithEditor.tsx` | 10 | 592 |

## Candidates at a glance

| ID | Candidate | Area | Strength | Dependencies |
|---|---|---|---|---|
| T1 | One MiroirTest run module: leaf kinds return outcomes, one call returns a report (top) | MiroirTest machinery | Strong | in-process |
| T2 | One descriptor per MiroirTest instance | MiroirTest machinery | Worth exploring | in-process |
| E1 | One admission module behind every entry point | Entry points and policies | Strong | in-process · local-substitutable |
| E2 | One module for secret material | Entry points and policies | Strong | in-process |
| E3 | Build the external-service client with its dependencies | Entry points and policies | Strong | mock (fetch) · in-process |
| E4 | One bootstrap from config to a running process | Entry points and policies | Worth exploring | local-substitutable |
| C1 | One composite-action runner instead of four | DomainController | Strong | in-process |
| C2 | One persistence port with a local and a remote adapter | DomainController | Strong | ports & adapters · local-substitutable |
| C3 | Derive one action catalogue from the Endpoint definitions | DomainController | Speculative | in-process |
| Q1 | One transformer-kind registry built from the TransformerDefinitions | Queries and Transformers | Strong | in-process |
| Q2 | A fetch port for extractors and one query evaluator | Queries and Transformers | Strong | in-process · local-substitutable |
| Q3 | Deepen the SQL transformer compiler and make in-memory/SQL parity one test seam | Queries and Transformers | Worth exploring | local-substitutable |
| S1 | Backends shrink to one section adapter; PersistenceStoreController owns the Entity rules | Persistence stores | Strong | local-substitutable |
| R1 | A UI-free engine for multistep Reports | Reports and value editors | Strong | in-process · local-substitutable |
| R2 | One section-tree module and a per-type registry | Reports and value editors | Strong | in-process |
| R3 | Entity instance commands in one module | Reports and value editors | Strong | in-process · local-substitutable |
| R4 | An editor-tree session for the ML value editors | Reports and value editors | Worth exploring | in-process · local-substitutable |
| M1 | One ML-schema context: build the environment once, keep typeCheck and defaults small | Schemas and package interfaces | Strong | in-process |
| M2 | Build the fundamental schema from the meta-model and the transformer registry | Schemas and package interfaces | Strong | in-process |
| M3 | Generate each deployment package's interface from its asset folders | Schemas and package interfaces | Strong | in-process |
| M4 | Shrink miroir-core's package interface | Schemas and package interfaces | Worth exploring | in-process |

## Suggested order

1. **T1**, the top recommendation. It is the hottest area of the month, every other candidate here will be verified through MiroirTests, and today a browser run can record "ok" for a failed composite assertion while vitest can throw a failure it never records.
2. **E2**, then **E1**: secret material and admission are security-relevant, and E1 gives every entry point the same gate.
3. **C1**: one composite runner. MiroirTests exercise it, so it benefits from T1 first.
4. **Q1**, then **M2**: the transformer registry, then the schema builder that reads it.
5. **S1**: store section adapters with one contract suite.
6. **R2**, then **R1** and **R3**: the section tree first, since the multistep engine and instance commands read it.
7. The rest as they come up. **C3** builds on E1, C1 and C2; **E4** overlaps E1 and E3; **M1** and **Q2** are independent.

## T. MiroirTest machinery

How a MiroirTest is walked, run, recorded and reported by vitest, the Miroir Tests menu, the UI launcher and nonreg. The hottest area of the month: #252, #286, #287, #292, #303, #304 and #307 all changed it.

### T1. One MiroirTest run module: leaf kinds return outcomes, one call returns a report

**Strength:** Strong. **Dependencies:** in-process.

**Files**

- `packages/miroir-core/src/5_tests/MiroirTestTools.ts:154-489`
- `packages/miroir-core/src/5_tests/miroirTestSuiteWalk.ts`
- `packages/miroir-core/src/5_tests/{FunctionCall,QueryRunner,MiroirTransformer,ReactComponent,Action,Runner}TestTools.ts`
- `packages/miroir-core/src/3_controllers/DomainController.ts:5329-5390`
- `packages/miroir-core/src/3_controllers/MiroirActivityTracker.ts:612-1047`
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Buttons/RunMiroirTestSuiteButton.tsx, RunAllMiroirTestsButton.tsx`
- `packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.ts, testResultReport.ts`

**Problem.** Running a suite takes 11 to 13 positional parameters and leaves results in a shared, mutable activity tracker, while 7 leaf runners each redo skip, record and fail with their own rules.

**Evidence**

- 10 hand-built `_runMiroirTestSuite(` calls, all passing `true` and `runMiroirTests`; phase tests keep 3 private `runSuiteInProcess` copies (292 phase1, 286 phase2, 286 phase6).
- 6 result walkers apply 3 pass rules: passed+skipped=total (`MiroirTransformerTestTools.ts:699`), passed=total (`testResultReport.ts:182`), every leaf ok (`uiIntegrationTestLauncher.ts:137`).
- `compositeRunTestAssertion` records "ok" right after `expect(...).toEqual(...)` (`DomainController.ts:5329-5356`), but the browser registers the non-throwing `expect` from `test-expect.ts` (`index.tsx:226`, `370`), so composite assertions cannot fail in browser runs.
- actionTest and runnerTest call expect before recording, so under vitest a failure is thrown but not recorded (`ActionTestTools.ts:166-170`, `RunnerTestTools.ts:310-311`).
- `displayMiroirTestResults` returns early unless the run label equals the suite name (`MiroirTransformerTestTools.ts:531`).

**Solution.** Each leaf kind turns (leaf, context) into an outcome; one module walks the suites, decides skips, records outcomes, asks the host adapter (vitest or in-process) whether to fail, and returns one report with one pass rule.

**Deletion test.** The `RunMiroirTests` struct and its flags are pass-throughs; 7 copies of the leaf protocol and 6 summarisers collapse into one module.

**Wins**

- One call, one report
- Pass rule has locality
- New test type: write an outcome
- Host seam gets two adapters
- Phase tests use the interface

**Risk.** vitest registers tests at collection time and its diff output needs its own expect; the component entry's `-t` names must survive. Moving the result tree out of `MiroirActivityTracker` is a follow-on.

### T2. One descriptor per MiroirTest instance

**Strength:** Worth exploring. **Dependencies:** in-process.

**Files**

- `packages/miroir-core/src/5_tests/inferIntegrationSessionKind.ts, applicationMiroirTestCatalog.ts`
- `packages/miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.ts, uiIntegrationTestTransformerSuiteRegistry.ts`
- `packages/miroir-standalone-app/src/miroir-fwk/4-tests/resolveUiIntegrationRunnerSuiteKey.ts, miroirTestSuiteUiExecution.ts, runnerTestSuiteResolve.ts`
- `packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.ts:179-387`
- `scripts/testMiroirLauncher.ts`

**Problem.** "What can this suite do and how is it launched" is answered by 4 vocabularies over 7 tree walks, through about 12 small classifiers.

**Evidence**

- 4 vocabularies: `IntegrationTestSessionKind`, `MiroirTestSuiteUiExecutionMode`, `ApplicationMiroirTestCliLaunchKind`, `UiIntegrationRunnerSuiteKind`.
- `resolveUiIntegrationRunnerSuiteKey` ignores both registry parameters it receives (25-35), yet 3 callers build registries to pass in.
- Deprecated LEGACY registries are still runtime fallbacks (`uiIntegrationTestLauncher.ts:368`); the launcher has two near-duplicate bodies (179-254, 256-338).
- Adding `reactComponentTest` (#286) touched 7 files, then added 2 more UI walks.

**Solution.** One pure module maps an instance and the runner index to a descriptor (key, unit and integration capability, session kind, reset parameters, runner, flags) that the CLI, the displays, the launcher and the entries read.

**Deletion test.** About 12 classifiers are indirection; their logic concentrates in the descriptor.

**Wins**

- One table per test type
- One walk instead of seven
- CLI stops borrowing UI registries

**Risk.** The runner index comes from the local cache in the UI and from folders in the CLI, so it is an input.

## E. Entry points and policies

Where an action enters a process (HTTP, the emulated server, Electron IPC, MCP, CLI, CopilotKit) and what each entry point applies before dispatch: identity, access, capabilities, secrets. Built by #71, #262, #264, #270, #273 and #267.

### E1. One admission module behind every entry point

**Strength:** Strong. **Dependencies:** in-process · local-substitutable.

**Files**

- `packages/miroir-server/src/server.ts:517-717, 847-868`
- `packages/miroir-core/src/4_services/RestServer.ts:340-505`
- `packages/miroir-core/src/4_services/RestClientStub.ts:121-175`
- `packages/miroir-core/src/1_core/authentication/AuthenticationHttp.ts, deploymentUuidFromHttpRequest.ts`
- `packages/miroir-standalone-app-electron/src/ipcServerSetup.ts:257-336`
- `packages/miroir-mcp/src/tools/mcpHandlersForEndpoint.ts:205-330`
- `packages/miroir-cli/src/…/commandsFromEndpoint.ts:220-282`
- `packages/miroir-ai/src/tools/miroirCopilotKitActions.ts:91-131`

**Problem.** Each entry point chains its own subset of about 12 exported auth and access functions before dispatch, and the chains already disagree.

**Evidence**

- The full gate is written twice: `server.ts:600-642` and `RestClientStub.ts:121-175`. The stub finds the deployment in 3 body locations, the server in 6 (`deploymentUuidFromHttpRequest`).
- `/mcp` and Electron IPC run no gate; CopilotKit checks identity only (`server.ts:853-868`); MCP, CLI, IPC and CopilotKit never pass a principal.
- MCP, CLI and CopilotKit build the Library test app's `getDefaultLibraryModelEnvironmentDEFUNCT`, so miroir-mcp, miroir-cli and miroir-ai depend on a test deployment package.
- `handleMcpAction` and `handleCliAction` are the same function; the openStore loop is copied between cli and mcp.
- miroir-server has no tests; the 20 auth test files cover the pure functions, not the chain.

**Solution.** One module takes an action plus transport-neutral request facts and owns principal, access, capability, guards, deployment and model environment, then dispatches; Express, the stub, IPC, MCP, CLI and CopilotKit become thin adapters.

**Deletion test.** No such module exists: the chain is re-derived in each adapter, so creating it concentrates complexity. The directory becomes a seam with two adapters (Admin store, in-memory fixtures).

**Wins**

- Policy has one home
- New entry points inherit the gate
- Stub tests run the production gate
- Test apps leave production packages

**Risk.** The browser runs a remote DomainController, so where the module sits on each side of the wire needs deciding; also whether the identity directory is reloaded per request or cached.

### E2. One module for secret material

**Strength:** Strong. **Dependencies:** in-process.

**Files**

- `packages/miroir-core/src/1_core/authentication/AuthenticationPolicy.ts:476-572`
- `packages/miroir-core/src/1_core/authentication/redactCredentialSecrets.ts`
- `packages/miroir-core/src/4_services/RestServer.ts:284-305`
- `packages/miroir-core/src/3_controllers/DomainController.ts:1204-1220`
- `packages/miroir-core/src/4_services/SecretsService.ts`
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MultistepReportHost.tsx:51-58`

**Problem.** What counts as secret, who may write it and how it is hidden is spread over two near-identical write guards, two enforcement sites and three redaction lists.

**Evidence**

- `assertCredentialInstanceMutationAllowed` and `assertSecretInstanceMutationAllowed` are near-identical (`AuthenticationPolicy.ts:496-529`, `531-572`), enforced at `RestServer.ts:287-305` and `DomainController.ts:1208-1220`.
- The transactional and commit-replay paths skip both guards (comment at `RestServer.ts:286`, "analysis R11").
- Redaction lives in `redactCredentialSecrets.ts` (32 call sites), in a dead copy in `AuthenticationPolicy.ts:476-494` that a test still covers, and in a third key list in `MultistepReportHost.tsx:51-58`.
- `SecretsHttp.ts`, planned in the #270 TDD plan, was never built.

**Solution.** One module owns MiroirUserCredential and MiroirSecret: the only write paths (change password, set, delete, rotate, import), one guard decided inside the process, and one redaction list shared by the server, MCP and the UI.

**Deletion test.** Deleting the dead redaction copy breaks only its test; the two guards and three lists collapse into one module.

**Wins**

- Secret rules have locality
- Guard holds at the trust seam
- One redaction list everywhere
- Tests hit the write paths

**Risk.** The commit-replay path must carry enough provenance for the guard to decide.

### E3. Build the external-service client with its dependencies

**Strength:** Strong. **Dependencies:** mock (fetch) · in-process.

**Files**

- `packages/miroir-core/src/4_services/ExternalServiceClient.ts:32-70, 354, 485, 740`
- `packages/miroir-core/src/4_services/SecretStore.ts:20-22, SecretsService.ts:132`
- `packages/miroir-core/src/3_controllers/DomainController.ts:3380-4245`
- `packages/miroir-core/src/index.ts:1379-1411`
- `packages/miroir-server/src/server.ts:191, 447, 493`
- `packages/miroir-standalone-app-electron/src/ipcServerSetup.ts`

**Problem.** `executeExternalServiceOperation` is deep, but it reads process-global state (global fetch, 4 module variables, 2 secret maps, the wrapping key) that only server.ts sets up.

**Evidence**

- Six reset and allow functions exist for tests and are exported from the package entry (`index.ts:1379-1411`); one unit test stubs global fetch.
- `ipcServerSetup.ts` never sets the key, hydrates secrets or registers the rotation sink (`server.ts:191, 447, 493`), so Electron runs without them (inferred).
- Probe secrets are written into the shared map and restored at 4 sites across awaits (`DomainController.ts:3567-3900`), visible to concurrent requests (inferred).
- `principal` is threaded through 15 DomainController signatures to reach this one function.
- About 865 lines of external-service code sit inside DomainController (3380-4245).

**Solution.** The host builds one client holding fetch, secret resolution, the rotation sink and the token cache; DomainController receives it like its persistence manager, and probes pass a per-call secret overlay.

**Deletion test.** The setters and resets disappear; their complexity reappears once, in the composition root.

**Wins**

- Tests need no global resets
- Electron gets secrets by construction
- DomainController interface shrinks
- Wizard logic gains locality

**Risk.** The rotation sink stays a closure, because 4_services cannot import DomainController (#270 plan, P6). `fakeExternalServiceServer.ts` already serves 7 integration tests as the fetch stand-in.

### E4. One bootstrap from config to a running process

**Strength:** Worth exploring. **Dependencies:** local-substitutable.

**Files**

- `packages/miroir-server/src/server.ts:186-191, 272-278, 403-447, 819-826`
- `packages/miroir-standalone-app-electron/src/ipcServerSetup.ts:199-214`
- `packages/miroir-cli/src/startup/{storeStartup,setup}.ts, packages/miroir-mcp/src/startup/{storeStartup,setup}.ts`
- `packages/miroir-standalone-app/src/index.tsx:255-335, packages/miroir-sandbox/src/index.tsx:141-190`
- `packages/miroir-standalone-app/src/miroir-fwk/4-tests/IntegrationTestSession.ts:465-492, setupMiroirTest.ts`
- `packages/miroir-core/src/3_controllers/ConfigurationService.ts:54-61, ActionRunner.ts`

**Problem.** Six hosts hand-wire the same startup (register backends, two managers, the stub, two DomainControllers, setters, secrets, capabilities), and each gets a different subset.

**Evidence**

- 125 `*StoreSectionStartup(` calls: 28 test files and about 10 composition roots.
- cli and mcp `storeStartup.ts` are identical apart from names; only `IntegrationTestSession` handles mongodb and bundled.
- Process capabilities are computed 6 times from the same 4 inputs and pushed through 7 `setProcessCapabilities` calls.
- A config naming an unregistered backend yields an `ErrorDataStore` that throws "Method not implemented." at first use (`ErrorDataStore.ts:20`).
- server.ts re-implements `querySecretRowsForPersist` and the missing-key check from SecretsService (411-445).

**Solution.** One module turns (config, argv, env) into a process context (store stack, managers, the stub when emulated, capabilities, secrets); every host calls it and mounts its own transport.

**Deletion test.** The 6 hand-rolled roots collapse into one call; the `shouldMount*` helpers are one-line pass-throughs.

**Wins**

- Tests open a stack in one line
- Config errors surface at open
- Host parity by construction
- Store lifecycle has one home

**Risk.** Each host has real extras (IPC, identity directory); Vite needs dynamic imports of the Node-only drivers. Overlaps E1 and E3.

## C. DomainController

The 6,507-line controller: composite actions, persistence routing and action-type dispatch. 24 changes since 2026-08-26.

### C1. One composite-action runner instead of four

**Strength:** Strong. **Dependencies:** in-process.

**Files**

- `packages/miroir-core/src/3_controllers/DomainController.ts:4589-4801 (Internal)`
- `DomainController.ts:4804-5059 (RuntimeCompositeActionDO_NOT_USE)`
- `DomainController.ts:5062-5222 (BuildPlusRuntimeCompositeAction)`
- `DomainController.ts:5664-5915 (CompositeActionTemplate), 5935-6472 (test wrappers)`
- `packages/miroir-core/src/5_tests/CompositeActionTestTools.ts:24-78`

**Problem.** Four loops re-implement template resolution, per-step dispatch, error wrapping and result binding, and they have drifted apart.

**Evidence**

- The runtime loop's default branch logs and skips `compositeRunBoxedQueryTemplateAction`, `freezeApplicationVersion` and `connectExternalService` (`DomainController.ts:5018-5021`).
- `compositeRunTestAssertion` runs in two loops (4669, 4976) and is rejected in the template loop (5809-5830).
- Only two loops bind step results by `actionLabel` (4777-4787, 5903-5909).
- `testBuildPlusRuntimeCompositeAction` runs through one loop alone (6009) and another inside a suite (6232).
- `handleTestCompositeAction` drops the composite result and returns ACTION_OK (5989-6040).

**Solution.** One runner resolves templates with a strategy chosen up front and executes steps through one dispatch, with one rule for binding and one for errors; test suites become setup and teardown hooks around it.

**Deletion test.** Three of the four loops delete with no loss except their drift; the remaining runner serves Runners, MultistepReportHost, application endpoints and every MiroirTest.

**Wins**

- Composite semantics have one home
- MiroirTests run the production path
- 7 methods shrink to about 2
- Unknown steps fail loudly

**Risk.** Build and runtime resolution genuinely differ ("WHY BUILD???" at 5097); pin both with MiroirTests before merging the loops.

### C2. One persistence port with a local and a remote adapter

**Strength:** Strong. **Dependencies:** ports & adapters · local-substitutable.

**Files**

- `packages/miroir-core/src/3_controllers/DomainController.ts:404-408 and 12 call sites`
- `packages/miroir-core/src/0_interfaces/4-services/PersistenceInterface.ts:114-143`
- `packages/miroir-core/src/3_controllers/CallUtils.ts:51, 90-97`
- `packages/miroir-localcache-redux/src/4_services/persistence/PersistenceReduxSaga.ts, sagaTools.ts`
- `packages/miroir-localcache-{redux,zustand}/src/…/RestPersistenceClientAndRestClient.ts`
- `packages/miroir-localcache-zustand/src/…/PersistenceAsyncStore.ts`
- `packages/miroir-react/src/miroir-localcache-imports.ts`

**Problem.** DomainController picks among 7 persistence methods and branches on access mode, each call then hops through a Redux saga that never touches the cache, and errors come back in two shapes.

**Evidence**

- `PersistenceReduxSaga.ts` (1,172 lines) has no `put` or `select`; 4 methods dispatch to Redux only to call PersistenceStoreController or the REST client.
- DomainController chooses among the 7 `For…` methods at 12 call sites and branches on access mode 9 times.
- `callLocalCacheAction` throws; `callPersistenceAction` returns an `Action2Error` (`CallUtils.ts:51`, `90-97`).
- openStore failures never surface: the saga returns ACTION_OK (612-639), so the status checks in server, MCP and CLI never fire (reported, not re-checked).
- miroir-localcache-zustand is not wired (adapters are switched by commenting code); its REST client copy (452 vs 463 lines) lacks the redux deploymentUuid guard.

**Solution.** A plain async router in core runs an action and returns one `Action2ReturnType`, with the store manager as the local adapter and one shared REST client as the remote adapter; the Redux package keeps only cache state and selectors.

**Deletion test.** Removing the saga hop loses no behaviour; the 9 mode branches and the 7-method interface are a mode-flagged pass-through.

**Wins**

- 7 routing methods become 1
- Failures surface one way
- Two real adapters at the seam
- Two REST client copies become one

**Risk.** Query-hop span tracking moves with the router. Decide zustand's fate: delete it, or keep it as a second cache adapter with a shared contract suite.

### C3. Derive one action catalogue from the Endpoint definitions

**Strength:** Speculative. **Dependencies:** in-process.

**Files**

- `packages/miroir-core/src/3_controllers/DomainController.ts:2987-2993, 3082-3121, 4280-4543`
- `packages/miroir-core/src/4_services/RestServer.ts:391-504`
- `packages/miroir-localcache-redux/src/…/RestPersistenceClientAndRestClient.ts:56-100`
- `packages/miroir-core/src/1_core/Deployment.ts:93-105, Instance.ts:6-15`

**Problem.** Facts about each action type (endpoint, application, autocommit, where it runs, wire route) are hand-listed in 20 switches over 8 files, while the Endpoint instances already declare their actions.

**Evidence**

- 20 `switch` statements on `actionType` on the dispatch path; DomainController alone lists `createInstance` 8 times.
- A 30-entry `actionTypeArgsMap` in the REST client (56-100).
- The 6 core endpoint uuids appear as literals 213 times in src and 247 times in tests.
- `Instance.ts:6-15` already derives a list from the Endpoints; dispatch does not use it.

**Solution.** A catalogue keyed by action type, built from the Endpoint definitions plus the core handler registrations; each switch becomes a lookup.

**Deletion test.** The complexity reappears in every switch today; the catalogue concentrates it.

**Wins**

- New action type: one place
- Callers stop hard-coding endpoints
- Unknown actions fail loudly

**Risk.** Overlaps the generated ML action unions, and it builds on E1, C1 and C2.

## Q. Queries and Transformers

In-memory and SQL execution of Transformers, Extractors and Combiners.

### Q1. One transformer-kind registry built from the TransformerDefinitions

**Strength:** Strong. **Dependencies:** in-process.

**Files**

- `packages/miroir-core/src/2_domain/TransformersForRuntime.ts:165, 1050, 1112, 3881, 4061`
- `packages/miroir-core/src/2_domain/Transformers.ts:145-224`
- `packages/miroir-store-postgres/src/1_core/SqlGenerator.ts:181, 193, 5915`
- `packages/miroir-core/src/2_domain/Transformer_ResultSchema.ts:834, TransformerEnvironmentBindings.ts, TransformerMlSchemaCheck.ts`
- `packages/miroir-core/src/0_interfaces/1_core/Transformer.ts:21-37`
- `packages/miroir-core/tests/2_domain/transformerResultSchema.inventory.unit.test.ts`

**Problem.** Adding one transformer means editing about 15 places in about 10 files, keyed three different ways, and the copies drift.

**Evidence**

- The pivot/unpivot commit (04a5e0f) touched 16 files.
- `applicationTransformerDefinitions` is a hand re-keyed copy of `miroirTransformers`; implementations are looked up by function-name strings, with "N/A" and "TODO" sentinels.
- Slot-scoping rules live in 4 places; only `TransformerEnvironmentBindings` knows `createObjectFromPairs`.
- Handlers take up to 12 positional arguments, and the dispatcher passes `deploymentUuid` into the `application` slot (`TransformersForRuntime.ts:4061` against `Transformer.ts:35`).
- The inventory test compares two hand-written lists, so it checks no code.

**Solution.** One registry keyed by each definition's `transformerType`; each kind supplies its definition, in-memory handler, optional SQL compiler, result-schema rule and scoping, and handlers receive one context object.

**Deletion test.** `applicationTransformerDefinitions`, `miroirTransformers` and `defaultTransformers` are re-keyings of the same 48 JSON files: pass-throughs.

**Wins**

- New transformer: JSON, handler, tests
- Each kind has locality
- Dispatch shrinks to lookup(type)
- Positional-argument bugs disappear

**Risk.** Bootstrap order: the schema generator imports `Transformers.ts`. The `mls*` and admin transformers are keyed differently. M2 builds on this.

### Q2. A fetch port for extractors and one query evaluator

**Strength:** Strong. **Dependencies:** in-process · local-substitutable.

**Files**

- `packages/miroir-core/src/0_interfaces/2_domain/ExtractorRunnerInterface.ts:162, 207`
- `packages/miroir-core/src/2_domain/ExtractorRunnerInMemory.ts, DomainStateQuerySelectors.ts, QuerySelectors.ts, AsyncQuerySelectors.ts`
- `packages/miroir-localcache-redux/src/…/ReduxDeploymentsStateQuerySelectors.ts:117, 268`
- `packages/miroir-store-filesystem/src/4_services/FileSystemExtractorRunner.ts`
- `packages/miroir-store-postgres/src/…/SqlDbQueryRunner.ts:79-107, 526-541, SqlDbQueryTemplateRunner.ts:60`

**Problem.** The extractor runner interface has 10 members, but adapters differ only in "get one instance" and "get an Entity's instances", so each re-implements extractor semantics and they diverge.

**Evidence**

- 20 runner-map literals in 3 packages, 16 of them with `undefined as any` stubs.
- `extractorByPrimaryKey.applyTransformer` is honoured by 3 adapters and ignored by the Redux adapter the UI uses, and by the filesystem runner.
- `modelEnvironment` is replaced by a default at 12 sites in store adapters.
- Every query test suite pins `runQueryFromDomainState`, so the Redux and async adapters are never run by the shared tests.
- The sync and async evaluators share 131 of 304 lines once `async`/`await` is stripped.

**Solution.** The seam becomes a 2-operation fetch port with store and state adapters; one evaluator owns extractor and combiner semantics, and query tests run on every adapter.

**Deletion test.** The per-adapter maps and runners are copies; deleting them moves nothing to callers.

**Wins**

- Seam shrinks from 10 to 2
- applyTransformer works everywhere
- One test leaf, six adapters
- Model environment threaded, never defaulted

**Risk.** The sync evaluator is reselect-memoised; merging sync and async must not slow the UI selectors.

### Q3. Deepen the SQL transformer compiler and make in-memory/SQL parity one test seam

**Strength:** Worth exploring. **Dependencies:** local-substitutable.

**Files**

- `packages/miroir-store-postgres/src/1_core/SqlGenerator.ts:5996-6012 and 40 sqlStringFor* functions`
- `packages/miroir-core/src/2_domain/TransformersForRuntime.ts:4081-4164`
- `packages/miroir-core/src/5_tests/MiroirTransformerTestTools.ts:61-94, 289-460`
- `.github/workflows/pr-checks.yml, scripts/nonreg-manifest.json`

**Problem.** Each of 40 `sqlStringFor*` handlers threads placeholder numbering, context bookkeeping and failure checks by hand, and in-memory/SQL parity is checked only when a Postgres server runs.

**Evidence**

- `SqlGenerator.ts` has 87 mentions of `preparedStatementParametersCount`, 64 of `usedContextEntries` and 58 `Domain2ElementFailed` checks.
- Composite transformers: in memory their parameters are evaluated into `contextResults` (4103); in SQL the raw attributes are spread into `queryParams` (6003).
- None of the 261 transformer test leaves covers a composite; 21 of the 22 leaves with separate expectations differ only in failure shape.
- PR checks run no Postgres; the pivot/unpivot parity bugs were found in review (746ff92).

**Solution.** Expand composites once, before either interpreter; a compiler builder owns placeholders, context entries, wrapping and failures so each handler states only its SQL shape; the suite's SQL path runs against a local Postgres stand-in in the unit tier.

**Deletion test.** Deleting the per-handler plumbing shortens 40 handlers and removes pitfalls the `miroir-edit-transformers` skill has to warn about.

**Wins**

- Every PR checks both adapters
- Placeholder rules have locality
- Handlers state SQL shape only
- Composite semantics match

**Risk.** No in-process Postgres stand-in (PGlite, pg-mem) is in the repo yet; JSONB behaviour may differ from production.

## S. Persistence stores

The five store backends (filesystem, indexedDb, postgres, mongodb, bundled) behind PersistenceStoreController.

### S1. Backends shrink to one section adapter; PersistenceStoreController owns the Entity rules

**Strength:** Strong. **Dependencies:** local-substitutable.

**Files**

- `packages/miroir-core/src/4_services/PersistenceStoreController.ts:82-84, 718-750`
- `packages/miroir-core/src/4_services/PersistenceStoreControllerManager.ts:173-181`
- `packages/miroir-store-{filesystem,indexedDb,mongodb,postgres}/src/4_services/*EntityStoreSectionMixin.ts`
- `packages/miroir-store-*/src/4_services/*StoreSection.ts, *ModelStoreSection.ts, *DataStoreSection.ts`
- `packages/miroir-core/src/1_core/Entity/EntityPrimaryKey.ts`
- `packages/miroir-standalone-app/tests/4_storage/PersistenceStoreController.integ.test.tsx`

**Problem.** Entity lifecycle, primary keys and `getState` work the same on every backend, yet each backend re-implements them while PersistenceStoreController only forwards.

**Evidence**

- Four Entity mixins of 166 to 227 lines; any two share 109 to 143 lines, and they already differ on `createEntities` errors and `dropEntity` checks.
- `getState` is implemented 10 times (5 stores × model and data).
- Composite keys are encoded three ways: core `|` with escaping, IndexedDb `|` without, filesystem `encodeURIComponent` joined by `_`.
- The model section is handed the data section, and the sql mixin casts it to mutate its table map (`sqlDbEntityStoreSectionMixin.ts:253-263`).
- The filesystem, indexedDb, mongodb and bundled packages have no tests; the de facto contract suite needs the whole app and branches on the backend.

**Solution.** PersistenceStoreController owns the Entity lifecycle, key encoding, `getState` and the fallback in-memory query; each backend supplies open and close, storage spaces, CRUD by canonical key and an optional native query; one contract suite runs against every adapter.

**Deletion test.** PersistenceStoreController's Entity methods delete with no loss today (pass-through); the four mixins' logic reappears once, inside it.

**Wins**

- A store fix lands once
- One contract suite, six adapters
- Mongo gets composite keys
- Unit tier covers the stores

**Risk.** SQL alter-table and sync need a native hook; changing the key encoding renames filesystem files that hold composite keys.

## R. Reports and value editors

packages/miroir-standalone-app/src/miroir-fwk/4_view: the hottest directory, with 544 file changes since 2026-08-26.

### R1. A UI-free engine for multistep Reports

**Strength:** Strong. **Dependencies:** in-process · local-substitutable.

**Files**

- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MultistepReportHost.tsx`
- `…/Reports/ReportViewWithEditor.tsx:471, 498`
- `…/Reports/ReportInputSection.tsx, ReportSectionViewWithEditor.tsx, ReportSectionListDisplay.tsx, ReportTools.ts`

**Problem.** The step state machine (next, back, branch, onNext actions, finish gate, bag merge) lives inside a 1,109-line React component and leaks into five others.

**Evidence**

- 8 `useState` and 2 `useRef` hold the state (`MultistepReportHost.tsx:562-574`).
- The `connectExternalService` case is written twice with a hard-coded endpoint uuid (164-175, 800-805); 15 references are specific to the #284 wizard.
- `ReportViewWithEditor` writes into the host during render (498) and from Formik `validate` through `queueMicrotask` (471).
- Branch and back are tested only through full renders: 4 files, 2,654 lines, 206 `fireEvent`/`waitFor` calls.

**Solution.** A UI-free module owns step state and transitions (edit bag, next, back, finish, cancel) with action dispatch and transformer evaluation as ports; the host React component renders state and forwards clicks, and wizard specifics move to Report data or a second adapter.

**Deletion test.** Delete the engine and the transitions reappear in the host and in ReportViewWithEditor.

**Wins**

- Steps testable without React
- Wizard rules have locality
- Generic and wizard: two adapters
- 8 pieces of state hidden

**Risk.** The Formik and bag synchronisation timing (the microtask) is subtle.

### R2. One section-tree module and a per-type registry

**Strength:** Strong. **Dependencies:** in-process.

**Files**

- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportTools.ts:20-25, 33, 146, 234`
- `…/Reports/MultistepReportHost.tsx:225, 438, ReportViewWithEditor.tsx:220, reportInputApplication.ts:26`
- `…/Reports/ReportSectionViewWithEditor.tsx:309, 401-770`
- `…/Reports/ReportSectionEntityInstance.tsx:241, 361, ReportSectionListDisplay.tsx:287`
- `…/Page/RootComponent.tsx:328-355`

**Problem.** Six recursive walks cover the 16 section types differently, and every section re-derives its Formik key, target Entity and data from strings.

**Evidence**

- 54 comparisons against section types in 7 source files.
- Accordion sections: one walk throws, one returns `{}`, three skip them; only the render dispatch handles them.
- The Formik key convention `path.join("_")` is re-derived at 17 sites in 7 files; the target Entity is resolved 5 ways.
- `seedReportInputApplicationFromPageParams` is unit-tested but never called.
- `ReportTools.ts`, meant to be pure, imports from two React component files (20-25).

**Solution.** A UI-free module walks a Report once and returns, for each section, its path, Formik key, target Entity, initial value, form schema, bag key and URL-parameter needs from a per-type registry; the React dispatcher becomes a lookup.

**Deletion test.** Delete it and the 6 walks and 17 key derivations come back.

**Wins**

- New section type: one entry
- Report shapes tested without rendering
- Sections get a resolved descriptor
- Walk gaps disappear

**Risk.** Whether the Report definition stays inside Formik values for inline editing is a separate decision.

### R3. Entity instance commands in one module

**Strength:** Strong. **Dependencies:** in-process · local-substitutable.

**Files**

- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx:309-420`
- `…/Reports/ReportSectionListDisplay.tsx:494, 549, 567, 608`
- `…/MarkdownEditorModal.tsx:113-135`
- `…/scripts.ts:61 (deleteCascade)`
- `…/Reports/TypedValueObjectEditor.tsx:506, 529-530`

**Problem.** Four React components build create, update and delete actions by hand, and each decides differently when to wrap them in a transaction.

**Evidence**

- ReportViewWithEditor wraps for the Miroir deployment or a model-section Entity; ReportSectionListDisplay trusts a prop and hard-codes "model" on update (567).
- MarkdownEditorModal always wraps and edits a path marked "TODO: not always the right path"; `deleteCascade` never wraps.
- 17 endpoint-uuid literals in 7 view files.
- The submit mode travels in two string Formik fields; the async-button branch sets no mode (`TypedValueObjectEditor.tsx:506`), so a create may go out as `updateInstance` (inferred).

**Solution.** One UI-free module takes (application, Entity, instance, mode) and derives section, transaction rule, endpoint and meta-model guard; the React components call it.

**Deletion test.** Delete it and the rules come back at 4 or more callers.

**Wins**

- Transaction rule has one home
- Divergent rules unified
- Submit protocol testable without Formik
- Runners can reuse it

**Risk.** The differing rules may be deliberate: confirm before unifying.

### R4. An editor-tree session for the ML value editors

**Strength:** Worth exploring. **Dependencies:** in-process · local-substitutable.

**Files**

- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlElementEditorInterface.ts:24-68`
- `…/ValueObjectEditor/MlElementEditor.tsx:512, 1069-1098`
- `…/ValueObjectEditor/MlObjectEditor.tsx:387, 715, 864-880`
- `…/ValueObjectEditor/MlArrayEditor.tsx:444, MlLiteralEditor.tsx:380, MlEnumEditor.tsx:342`

**Problem.** About 15 values that are the same for a whole editor tree are passed through every recursion level, and every node subscribes to the whole deployments state to compute default values.

**Evidence**

- MlElementEditor passes 29 props to MlObjectEditor, 23 of them unchanged (1069-1098).
- 11 copies of the same `useSelector(… presentModelSnapshot …)` idiom feed `getDefaultValueForMlSchemaWithResolutionNonHook` (15 positional parameters, 14 call sites).
- MlElementEditor passes `undefined` state (512) where MlObjectEditor passes the real one.

**Solution.** TypedValueObjectEditor provides one session that holds the tree-wide values and answers "default value for this schema at this path"; nodes keep only local props.

**Deletion test.** Removes about 15 props per level and 11 selector copies.

**Wins**

- Editor interfaces shrink
- Defaults resolved one way
- Fewer store subscriptions

**Risk.** A context value that changes on each keystroke re-renders the tree: gate it on the #303 render-performance tests. AGENTS.md asks for confirmation before adding a context.

## M. Schemas and package interfaces

ML schema tooling, the generated types and what miroir-core and the deployment packages export.

### M1. One ML-schema context: build the environment once, keep typeCheck and defaults small

**Strength:** Strong. **Dependencies:** in-process.

**Files**

- `packages/miroir-core/src/1_core/mls/mlsTypeCheck.ts:862-939`
- `packages/miroir-core/src/1_core/mls/MlsUnfoldSchemaOnce.ts:153-220`
- `packages/miroir-core/src/2_domain/TransformersForRuntime.ts:593-609`
- `packages/miroir-core/src/5_tests/FunctionCallTestRegistry.ts:111-119`
- `packages/miroir-localcache-redux/src/…/Model.ts:405-423, packages/miroir-localcache-zustand/src/…/Model.ts:215-232`
- `packages/miroir-cli/…/commandsFromEndpoint.ts:118-135, packages/miroir-mcp/…/mcpHandlersForEndpoint.ts:108-125`
- `packages/miroir-standalone-app/…/ValueObjectEditor/MlObjectEditor.tsx:747-749, 864-880`

**Problem.** Callers assemble the MiroirModelEnvironment themselves at 11 sites and call recursive workers whose signatures are the public interface.

**Evidence**

- `endpointsByUuid` is derived three ways; redux and zustand hold the same 16-line builder.
- `mlsTypeCheck` has 11 positional parameters; 4 of its 5 production callers pass `(schema, value, [], [], env, {})`.
- `unfoldMlSchemaOnce` receives the fundamental schema twice (directly and inside the environment) and reads each in different places.
- #296 sat at this seam: a relative reference stored by typeCheck was re-resolved by the editor with `rawSchema.context ?? {}`.
- JSON MiroirTests pin 7 internal helpers of `mlsTypeCheck` through `FunctionCallTestRegistry`.

**Solution.** A module built from (deployment, model) creates the environment once and exposes typeCheck, defaultValue, resolve and unfold with 2 or 3 arguments, keeping recursion state and resolution context inside.

**Deletion test.** The 11 builders are copies; hiding the recursion parameters costs 4 of 5 callers nothing.

**Wins**

- Callers pass 2 or 3 arguments
- Resolution bugs have locality
- Tests use the real interface
- Redux and zustand copies go

**Risk.** Stored JSON tests call helpers positionally and would need migrating; React memoisation depends on the environment's identity.

### M2. Build the fundamental schema from the meta-model and the transformer registry

**Strength:** Strong. **Dependencies:** in-process.

**Files**

- `packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts:1-12, 280-319`
- `packages/miroir-core/scripts/generate-ts-types.ts:188-299, 364, 434, 601-602`
- `packages/miroir-core/src/2_domain/Transformers.ts`

**Problem.** `getMiroirFundamentalMlSchema` takes 32 positional `any` parameters from its single caller and imports layer-2 code, and the generator writes the transformer union by hand next to the generated one.

**Evidence**

- The hand-written union (TS 188-237, Zod 257-299) already misses `syncExternalServiceSchema`, added in #267.
- Two tests regex the generator's source text instead of calling it.
- Generation errors are caught and logged, and the build still exits 0 (601-602).
- The "unchanged, skip writing" check compares against a Promise's `toString()`, so the file is always rewritten (434).
- A timestamp header makes `miroirFundamentalType.ts` change in 42 commits in a month.

**Solution.** One builder takes (meta-model, transformer registry) and returns the schema; the union comes from the registry; the generator becomes a deterministic writer that fails loudly.

**Deletion test.** The hand union is a pure duplicate of `Transformers.ts`. The 4,459-line body is deep; only its interface is shallow.

**Wins**

- Testable by calling the builder
- One edit per new transformer
- CI catches generation failures
- Generated file stops churning

**Risk.** Extended and carry-on schema order matters; jzod-ts may limit how the union's shape is written. Builds on Q1.

### M3. Generate each deployment package's interface from its asset folders

**Strength:** Strong. **Dependencies:** in-process.

**Files**

- `packages/miroir-test-app_deployment-miroir/index.ts, index.d.ts, src/Model.ts, tsup.config.js`
- `packages/miroir-test-app_deployment-{admin,library,postgres,spotify,appForTest}/index.ts, index.d.ts`
- `build-all.sh:579-592`

**Problem.** Each deployment package states its interface by hand three times (index.ts, an index.d.ts that calls itself generated, and lists in Model.ts), and nothing ties the copies together.

**Evidence**

- `index.d.ts` opens with "Auto-generated stub declarations", but no generator exists; index.ts and index.d.ts changed together in all 18 commits that touched either.
- 331 of 335 declarations in deployment-miroir's `index.d.ts` are `any`; Model.ts carries 198 casts.
- 10 names are declared but not exported, so they typecheck and are `undefined` at runtime (e.g. `index.d.ts:91`, `:231`).
- A test works around the drift by checking a name in both files (`processCapabilitiesDesigner.273.phase7.unit.test.ts:144-147`).
- Root cause: a cycle between miroir-core and the deployment packages, broken with `dts: false` and hand stubs.

**Solution.** One generator walks `assets/{prefix}_model`, `_modelVersion` and `_data` and writes typed exports, the MetaModel sections and the bootstrap order; Model.ts keeps only the bootstrap policy.

**Deletion test.** Deleting `index.d.ts` loses nothing: it copies the interface. Model.ts's behaviour earns its keep but should be fed by data.

**Wins**

- Asset folder is the only edit
- Typed Entities in 40+ files
- No typed-but-undefined names
- One generator, six packages

**Risk.** Typed declarations need miroir-core types, which feeds the cycle; the bootstrap order (Entity and EntityVersion first) must become data.

### M4. Shrink miroir-core's package interface

**Strength:** Worth exploring. **Dependencies:** in-process.

**Files**

- `packages/miroir-core/src/index.ts`
- `packages/miroir-core/package.json (exports "./src/*")`
- `packages/miroir-core/tsup.config.js:6-10`

**Problem.** `index.ts` hand-lists about 1,500 names from 188 modules, including 441 copied from the generated types, so it changed in 71 of the last 340 commits.

**Evidence**

- Every new schema type needs an edit here (#292, #286, #284, #274, #265, #281).
- About 56% of the names are imported by no file (regex count).
- 208 test-harness names sit in the browser entry; 10 files deep-import `src/*` for Node-only test loaders.
- `Spotify.ts:18` imports a generated type from `miroir-core/dist` because the list is incomplete.

**Solution.** Re-export the generated types wholesale, move the test harness and filesystem loaders to a testing subpath, and drop `./src/*` and the unused names.

**Deletion test.** A pure pass-through: deleting its hand lists removes no behaviour.

**Wins**

- Schema additions skip the barrel
- Interface shrinks by about half
- Test code leaves the browser entry
- Merge-conflict hot spot goes

**Risk.** Five name collisions to settle (e.g. `testSuitesResults`); check the `.d.ts` size and tree-shaking.

## Found on the way

These are not deepening candidates. Each can be fixed or deleted on its own.

### Bugs confirmed by reading the code

- Transformer handlers receive `deploymentUuid` in their `application` slot: the dispatcher passes 10 positional arguments to a 12-slot type (`TransformersForRuntime.ts:4061`, `Transformer.ts:35`).
- `(transformer.interpolation ?? "build" == "build")` parses as `interpolation ?? true`, so any interpolation value counts as build (`TransformersForRuntime.ts:4242`; same pattern at 3946).
- `generate-ts-types.ts` logs generation errors and exits 0 (601-602), and always rewrites the output because it compares with a Promise (434).
- deployment-miroir's `index.d.ts` declares 10 names that `index.ts` does not export.
- `compositeRunTestAssertion` records "ok" whenever `toEqual` does not throw (`DomainController.ts:5329-5356`), and the `expect` the browser registers never throws (`standalone-app/src/index.tsx:226`), so composite assertions pass in the Miroir Tests menu whatever the values.

### Reported by the scan, not re-checked

- openStore failures are swallowed by the saga, which returns ACTION_OK (`PersistenceReduxSaga.ts:612-639`).
- Caught errors become ACTION_OK for store management, bundle and transactional instance actions and failing queries (`DomainController.ts:1113-1130`, `4406-4485`).
- The Redux adapter ignores `extractorByPrimaryKey.applyTransformer`, which the in-memory, DomainState and SQL adapters honour.
- `LocalCacheSlice.ts:205-207` keeps its Entity-adapter maps at module level, shared by client and server caches in emulated mode.
- UI unit runs abort on the first failing functionCallTest or queryTest (`TestFramework` has `.test`).

### Delete rather than deepen

- `Importer.tsx`: 2,150 of its 2,436 lines are comments and nothing renders it.
- `TestTools.ts`: 794 of 1,397 lines are commented out; `testSuites` and the `*DisplayResults` functions have no live callers.
- `FileSystemExtractorRunner.ts` and `FileSystemExtractorTemplateRunner.ts`: not exported, used by one test through a `src/` path.
- Electron IPC `server-action` and `server-query` handlers: nothing sends these messages.
- `mls/rootLessListKeyMap.ts` (marked DEFUNCT, 9 live lines of 224) and `mls/getDefaultValueForMlSchema.ts` (a layer-1 re-export from layer 2).
- `redactCredentialSecretsFromValue` in `AuthenticationPolicy.ts`: not exported, still covered by a test.
- `seedReportInputApplicationFromPageParams`: tested, never called. The `miroir-localcache` package: 0 lines of source.

### Docs and skills drift

- `miroir-edit-transformers` skill: steps 7A and 7B name `transformerForBuild_*` entries that no longer exist.
- AGENTS.md calls `main` the default branch; GitHub's default is `master`.
- `docs/reference/testing.md` places `runMiroirCoreTestsFromCLI` in miroir-core; it lives in the standalone app's `tests/helpers`.
- `tests/5-tests` and `tests/5_tests` both exist in miroir-core.

## Looked at, already deep enough

- `ActionRunner.ts`: already deep: one function owns the store lifecycle.
- `AccessPolicy.hasAccess, assertAccessForDeployment`: deep, generic and well tested.
- `ExtractorRunnerInMemory vs SqlDbQueryRunner`: a real seam with two adapters; only their wiring repeats (S1, Q2).
- `Transformer_ResultSchema.ts`: a fairly deep abstract interpreter; its problem is registration (Q1).
- `SqlQueryBuilder.ts`: a small, deep query AST.
- `schemaForDeployment.ts`: two functions hiding a cache and a mode policy; it becomes the inside of M1.
- `listDisplayByTransformer.ts`: UI-free and tested through its interface: the pattern R1 to R3 should copy.
- `MiroirTest orchestrator and sessions`: a real seam with browser and Node adapters.
- `syncExternalServiceSchema.ts`: pure OpenAPI-to-ML conversion; the friction is in its caller (E3).
- `Deployment.ts`: pure builders of composite actions.

## Next step

Pick a candidate. It then goes through the grilling loop (constraints, the shape of the deepened module, what sits behind the seam, which tests survive). A candidate that survives gets its own issue with `analysis.md` and `tdd-implementation-plan.md` (skills `miroir-feature-analysis`, `miroir-analysis-to-tdd-plan`). A candidate rejected for a lasting reason can be recorded as an ADR in `docs/adr/` so later reviews do not suggest it again.
