# 696 — Versioning package behind a process capability

> This analysis covers moving the freeze and evolution-trace code out of `@miroir-framework/core` into `@miroir-framework/versioning`, a package loaded on first use, and the `versioning` process capability that hides versioning and refuses its actions when it is off. It also provides what the next epic items need: model actions implemented outside core.

Related issue: https://github.com/miroir-framework/miroir/issues/696
Parent issue: [#694](https://github.com/miroir-framework/miroir/issues/694) · Prerequisites: #225 ✅, #230 ✅, #589 ✅, #703 ✅, #706 ✅, #695 ✅ (epic analysis)
Related analyses: [694 epic](../694-EPIC-safe-application-evolution/analysis.md) (G7, D4, D6, D8, section 7.2), [273 process capabilities](../273-FEATURE-process-capability-switches/analysis.md) (D4: process scope and application scope), [679 Git](../679-FEATURE-git-version-control/analysis.md) (the server-routed, lazily loaded Git precedent; D7 on open transactions), [216 freeze ADR](../216-FEATURE-application-versions-and-freeze/analysis.md), [575 run MiroirTest](../575-FEATURE-run-miroirtest-mcp/) (`registerMiroirActionImplementation`)
Key sources: [`applicationVersionFreeze.ts`](../../../packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts), [`versioningMode.ts`](../../../packages/miroir-core/src/1_core/versioning/versioningMode.ts), [`evolutionTrace*.ts`](../../../packages/miroir-core/src/2_domain/), [`Deployment.ts`](../../../packages/miroir-core/src/1_core/Deployment.ts), [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts), [`ActionImplementations.ts`](../../../packages/miroir-core/src/3_controllers/ActionImplementations.ts), [`constants.ts`](../../../packages/miroir-core/src/1_core/constants.ts) (`SERVER_ROUTED_MIROIR_ACTION_TYPES`), [`RestServer.ts`](../../../packages/miroir-core/src/4_services/RestServer.ts), [`DomainControllerActionHost.ts`](../../../packages/miroir-core/src/0_interfaces/3_controllers/DomainControllerActionHost.ts), [`processCapabilities.ts`](../../../packages/miroir-core/src/1_core/processCapabilities.ts), [`ProcessCapabilitiesHttp.ts`](../../../packages/miroir-core/src/4_services/ProcessCapabilitiesHttp.ts), [`EndpointActionCatalog.ts`](../../../packages/miroir-core/src/2_domain/EndpointActionCatalog.ts), [`miroirTestRequirements.ts`](../../../packages/miroir-core/src/5_tests/miroirTestRequirements.ts)

**Document role:** analysis and decision record.
**Status:** decisions proposed (2026-11-08), to be confirmed by the user.
**Document history:**
- 2026-11-08: first draft, then an adversarial review (a code fact check and an attack on the design). The review added D2 (the freeze runs in the persistence process, as Git does), replaced the new registry of D3 by the existing `registerMiroirActionImplementation`, kept the baseline builder in core (D5), switched D8 from new schema fields to code until #712, and corrected several facts: the function that adds the baseline, the constants that are defined in the files that leave, the action listings for MCP, CLI and CopilotKit, the third bundle policy, and the line ranges.

---

## 1. Goals

- **G1 — Run without versioning.** As an operator, I can turn versioning off for a process, and that process never loads or fetches the versioning code, so that a deployment that does not version stays small (epic G7).
- **G2 — Keep versioning as it is.** As an application designer, I can freeze a version and get evolution traces as before when versioning is on, so that the move costs me nothing.
- **G3 — Be told why.** As an operator, a designer or an MCP client, I get a `FeatureUnavailable` error that names `versioning` when I call a versioning action in a process where it is off, and no UI, MCP tool or CLI command offers what would be refused, so that I do not mistake a switched-off feature for a bug.
- **G4 — Add versioning actions outside core.** As a framework developer, I can add a model action to the versioning package (the restore action of #709, the migration runner of #9) without editing core's action table, so that the epic's next items stay out of core.

## 2. Non-goals

- New versioning behaviour. The trace revival and model states belong to #708, migrations to #9, the composite rename to #215, restore to #709, version transport to #710, application feature switches to #712.
- A general visibility condition on Reports, Menu items and Runners. #712 owns it (epic D8); this issue hides the versioning entries in code until then (D8).
- Moving the versioning Entities, Reports, Runner and MiroirTests out of `miroir-app-miroir`. They are model data, and the section routing (`versionHistoryEntityUuids`, `getApplicationSection`) needs the Entities in core's meta-model.
- Changing `versioningMode` or its rules (#234). The mode stays a property of each application.
- A build-time switch that leaves the package out of a client build (D9).

## 3. Decision record

Legend:
- **Capability**: a process capability, a flag of the running process read from its persistence-side `features` configuration ([process-capabilities.md](../../../docs/reference/process-capabilities.md)).
- **Mode**: an application's `versioningMode` (`unversioned`, `versioned-internal`, `versioned-external`).
- **Persistence process**: the process that holds the stores: `miroir-server`, Electron main, or the emulated server inside a test or a sandbox page.
- **Host**: `DomainControllerActionHost`, the interface an action implementation may call on the DomainController that runs it (#341).

| Decision | Choice | Serves |
|---|---|---|
| D1. Which code leaves core, and which stays? | **D1-a.** Freeze planning, snapshots and diff, the trace writer, runtime, compaction and definition-version code, and the freeze orchestration now in `DomainController` leave. The modes, the section routing, the action type, the Entity uuids, the trace policy and the baseline builder stay. | G1, G2 |
| D2. In which process does a versioning action run? | **D2-a.** In the persistence process, server-routed as Git actions are; refused while the client has an open Miroir transaction. | G1, G3 |
| D3. How does core run an action whose implementation lives in a package it does not import? | **D3-b.** The existing `registerMiroirActionImplementation`, fed by a core helper that wraps lazily loaded handlers; the Endpoint action definition names the capability it needs. | G1, G3, G4 |
| D4. What may an action implementation outside core call on the DomainController? | **D4-a.** The host's existing methods plus one read of a section's instances. | G2, G4 |
| D5. How do traces, written on model commits and instance writes, reach a package core does not import? | **D5-b.** A trace recorder registered lazily by the persistence-side hosts, called after core's per-call trace check; the baseline builder stays in core. | G1, G2 |
| D6. Is versioning on or off when the configuration does not say? | **D6-a.** On, as `designerTools`; off by veto in the sandbox. | G2 |
| D7. How do the capability and an application's mode combine? | **D7-a.** The capability is checked first, then the mode. | G3 |
| D8. How are the versioning entries hidden when the capability is off? | **D8-c.** In code, in `@miroir-framework/react` and in the Endpoint action listings, until #712 gives model elements a visibility condition. | G3 |
| D9. What does "a client build does not include the package" mean, and what checks it? | **D9-a.** A browser talking to a server never fetches it; a process with the capability off never loads it. Guarded by the bundle policies. | G1 |
| D10. How does a MiroirTest that needs versioning run or skip? | **D10-a.** Its `versioning` tag is a requirement, checked against the process capability. | G2, G3 |

**Rationale:** the Git capability (#679) already runs its actions in the persistence process, loads its package on the first action and refuses its actions when off. This issue reuses that shape. It makes the registration generic, because #709 and #9 add versioning actions and later items may add capabilities.

### D1. Which code leaves core, and which stays?

**What is at stake.** A designer of the Library application who never freezes still loads, today, 1859 lines of freeze code, 755 lines of trace code and about 1080 lines of freeze and trace orchestration in `DomainController`, in the browser's eager chunk and in the server. If the cut is drawn too wide, core loses what every process needs: `getApplicationSection` routes `EntityVersion` rows to the `modelVersion` section for every application, and both localcaches check `assertVersioningEnabledImmutable` on every SelfApplication update.

**Status:** Proposed — D1-a. **Serves:** G1, G2.

| Option | What leaves core | Pros | Cons |
|---|---|---|---|
| **D1-a. Implementations and orchestration** ★ | see the two tables below | meets the issue's first acceptance criterion; the freeze becomes an ordinary action implementation, as #709 and #9 need | about 3.7k lines move; the interface part of `applicationVersionFreeze.ts` must be split out first |
| D1-b. Pure functions only | `applicationVersionFreeze.ts` and the trace files; the orchestration stays in `DomainController` | smaller change | `DomainController` still imports what moved, so core still holds it: fails the acceptance criterion |

**What leaves:**

| Code | Lines |
|---|---|
| `1_core/versioning/applicationVersionFreeze.ts`, minus the interface part that stays (below) | 1859 in all |
| `2_domain/evolutionTrace{Compaction,DefVersion,Runtime,Writer}.ts` | 614 |
| `DomainController.ts`: `maybeRecordEvolutionTrace` (1503–1559), the freeze helpers `loadModelVersionHistoryForFreeze`, `loadInstancesToFreeze`, `readSectionInstancesForFreeze`, `persistFreezeApplicationVersionPlan` (1619–2012), the freeze case of `handleModelAction` (2613–3239), and the freeze-only imports (42–68 for the history Entities, 127–169) | about 1080 |

**What stays** (each used by code that runs without versioning, or named by other packages without the implementation):

| Piece | Where it is today | Why it stays |
|---|---|---|
| `resolveVersioningMode`, `getFreezeAvailability`, `isVersioningAppBarItemVisible`, `assertApplicationVersioningEnabled` | `versioningMode.ts`, but `index.ts` (lines 973–1024) re-exports them through `applicationVersionFreeze.ts` (its lines 63–72) | read by `ModelInitializer.ts` line 186, the cache refresh (`DomainController.ts` line 910), `AppBar.tsx` and `MlElementEditorHooks.ts`; the re-export is repointed to `versioningMode.ts` |
| `FREEZE_APPLICATION_VERSION_ACTION_TYPE`, `FreezeApplicationVersionActionPayload`, the `*_VERSION_ENTITY_UUID` and `APPLICATION_VERSION_CROSS_*` constants | defined in `applicationVersionFreeze.ts` lines 54–147 | interfaces: the package and its tests name the action and the Entities from core. They move to a new core file before the implementation leaves |
| `applicationVersioning.ts` (51 lines) | | `assertVersioningEnabledImmutable` runs in both localcaches; `ENTITY_PRESENT_MODEL_DEFINITION_FIELDS` is used by `DomainController.ts` line 5885 |
| `versionHistoryEntityUuids`, `getApplicationSection` | `Model.ts` | the issue names them as what core keeps |
| `evolutionTracePolicy.ts` (41 lines: `isEvolutionTraceEnabled`, `shouldTraceEvolutionEvent`) | | `isEvolutionTraceEnabled` is the cheap per-call gate before any trace code loads (D5) and is read by `miroirTestRequirements.ts` |
| `evolutionTraceBaseline.ts` (141 lines, pure) | | `buildResetAndinitializeDeploymentActionSequence` (`Deployment.ts` line 486, baseline at 620–623), a synchronous builder in `1_core`, adds the baseline whenever an init creates the `ApplicationEvolutionTrace` Entity, whether traces are on or not (D5) |

**Decision:** D1-a.

### D2. In which process does a versioning action run?

**What is at stake.** Today the freeze runs in the browser when the browser talks to `miroir-server`: the ModelEndpoint action goes through `handleMiroirAction`, `runLibraryActionImplementation` and the local `handleModelAction` switch, and its reads and writes go over HTTP (`persistenceStoreLocalOrRemote`). `RestServer.ts` (lines 52–63) does not forward `freezeApplicationVersion` to the server's DomainController. So the browser would have to fetch the versioning package, and the capability, which is computed in the persistence process, would be checked in the client: a stale tab or an older client could still write `modelVersion` rows to a server where versioning is off. Git avoids both: the client forwards `gitAction_*` with `forwardServerRoutedAction` (`DomainController.ts` line 4268), the server lists them in `SERVER_ROUTED_MIROIR_ACTION_TYPES` (`constants.ts`), and checks the capability itself (line 4013).

**Status:** Proposed — D2-a. **Serves:** G1, G3.

| Option | Where it runs | Pros | Cons |
|---|---|---|---|
| **D2-a. Persistence process** ★ | the client forwards every action whose Endpoint definition names a capability (D3); the persistence process checks the capability, loads the package and runs the freeze on its own stores and model | a browser never fetches the package, so the issue's "a client build does not include the package" holds for a browser and a server; the capability is checked where it is computed; restore (#709) and the migration runner (#9) touch the stores and belong there too | the freeze reads the persistence process's model, not the client's local cache: an uncommitted model change in the client is not frozen. Like a Git action (679 D7), the freeze is refused while the client has an open Miroir transaction (`openMiroirTransactionError`). This is a small change of behaviour, which the user is asked to confirm |
| D2-b. The client, as today | the freeze stays where it runs; the package loads in the browser | no change of behaviour | the browser fetches the package; the capability is checked in the client; a stale client bypasses it |

**Decision:** D2-a, to confirm with the user, because it changes what a freeze sees when the client has pending model changes.

### D3. How does core run an action whose implementation lives in a package it does not import?

**What is at stake.** `freezeApplicationVersion` runs today through `miroirActionImplementations.handleAction_freezeApplicationVersion`, which maps to the shared `handleModelAction` handler (`ActionImplementations.ts` line 94) and so to the freeze case of the switch. Once the freeze leaves core, `runLibraryActionImplementation` (`DomainController.ts` line 3736) finds no implementation and returns `InvalidAction` "unknown library implementation", which tells an MCP client nothing. When #709 adds `restoreApplicationVersion`, someone would have to edit core again, which the comment on #696 asks to avoid. Core already has an extension point: `registerMiroirActionImplementation(name, handler)` (`ActionImplementations.ts` line 149, #575), which `miroirCoreStartup` uses for `handleAction_runMiroirTestAction`.

**Status:** Proposed — D3-b. **Serves:** G1, G3, G4.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D3-a. One loader per feature, as Git | `ConfigurationService.registerVersioningLoader(...)`; core keeps a stub handler per versioning action | proven shape (`registerGitRepositoryFactory`) | a stub per action in core: #709 and #9 edit core again (fails G4) |
| **D3-b. Lazy handlers on the existing registration** ★ | a core helper `registerLazyActionImplementations({ capability, implementationNames, load })` calls `registerMiroirActionImplementation` once per name with a wrapper that asserts the capability (`FeatureUnavailable`), awaits `load()` once (cached promise) and calls the loaded handler. The Endpoint action definition gains an optional `requiredCapability` beside `inMemoryImplementationFunctionName`, typed to the boolean capabilities only (not `availableStoreTypes` or `agent`). Core reads it to forward the action from a remote client (D2), to refuse it before any lookup, and to leave it out of the action listings (D8) | no new registry; new versioning actions are added in the package and in its Endpoint JSON only; the capability an action needs is model data | one ML schema change (the Endpoint action definition), with type regeneration |
| D3-c. A new registry of providers on `ConfigurationService` | as D3-b, with its own registry | | duplicates `registerMiroirActionImplementation` |
| D3-d. Eager registration | the package's startup registers its handlers directly | simplest | every persistence process imports the package at startup: fails G1 |

**Who registers.** The persistence-side hosts, unconditionally (registering loads nothing): `miroir-server` (`server.ts`, beside the Git registration at line 532), Electron main (`ipcServerSetup.ts` line 117), the emulated server of `startMiroirClient` (`@miroir-framework/react`), `startMiroirNode` (`miroir-server-library`, for the CLI), and the test setups (`setupMiroirTest` in `miroir-react-testing`, `DomainControllerIntegrationTestSession`). A browser client talking to a server registers nothing. When an action's `requiredCapability` is on but no implementation is registered, the refusal names the missing package instead of "unknown library implementation".

**Decision:** D3-b. The registry is a module-level map in core, shared by every DomainController of a JS process; this is safe because the handler checks the capability snapshot of the DomainController that runs it.

### D4. What may an action implementation outside core call on the DomainController?

**What is at stake.** The freeze reads the target application's model (`currentModelEnvironment`), creates missing history Entities through `handleModelAction` (16 calls in the freeze case), reads `modelVersion` and data rows (`readLocalPersistenceSectionInstances`, else a `getInstances` persistence action), and writes rows through `handleInstanceAction`. A package that received the `DomainController` class could call anything and would break the layering rule of `AGENTS.md` (implementations flow downwards only).

**Status:** Proposed — D4-a. **Serves:** G2, G4.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Existing host methods plus one read** ★ | the host already has `handleModelAction`, `handleInstanceAction` and `asDomainControllerInterface()` (which gives `currentModelEnvironment`). Add `readSectionInstances(application, applicationDeploymentMap, section, parentUuid)`. Since the freeze now runs in the persistence process (D2), this read is local: it replaces both the local read and the remote fallback | restore (#709) and the migration runner (#9) need the same read | the host grows by one method |
| D4-b. Pass the class | the handler receives `DomainController` | no interface work | the package depends on core's implementation layer |

**Decision:** D4-a.

### D5. How do traces, written on model commits and instance writes, reach a package core does not import?

**What is at stake.** `maybeRecordEvolutionTrace` runs after each write of `handleInstanceAction` (`DomainController.ts` line 1450; transactional instance actions replayed at commit, lines 2500–2541, are not traced) and after each model action replayed by a commit (line 2567). It returns at once when `isEvolutionTraceEnabled()` is false, which reads `MIROIR_EVOLUTION_TRACE` on every call (tests set it per test, `runSelfTestInteg.integ.test.ts` line 90). If the move loaded the package on every call, each Library save would pay for it. If traces lost their hook, `action.scenario.evolutionTrace` would fail with traces on, and #708 would have nothing to revive. Separately, the init baseline is written by a synchronous builder in `1_core` whenever the init creates the trace Entity, even with traces off; a deployment created with traces off and traced later relies on it.

**Status:** Proposed — D5-b. **Serves:** G1, G2.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D5-a. Recorder set at startup when traces are on | a host whose capability and `isEvolutionTraceEnabled()` are both on awaits the package and sets a recorder | no wait on a write | every host must decide at startup; turning traces on later records nothing, silently |
| **D5-b. Lazy recorder, registered unconditionally** ★ | core defines `EvolutionTraceRecorder.record(action, applicationDeploymentMap, commitContext?)`. The persistence-side hosts register a lazy recorder with the same helper as D3 (capability `versioning`). Core keeps the cheap checks, in order: `isEvolutionTraceEnabled()`, the action type, the capability; only then does it await the recorder, loaded once. The baseline builder stays in core, unchanged | traces off costs what it costs today; turning traces on at runtime works; #708 replaces the recorder's body without touching core | the first traced write of a process waits for the package |
| D5-c. Leave traces in core until #708 | move the freeze only | smallest change | fails "core no longer imports trace implementations" |

**Decision:** D5-b. A process that registers no recorder writes no trace. Today, with the emulated server, both the client's and the server's DomainController run `handleInstanceAction`; Slice 0 of the plan records which of them writes trace rows for one instance write, so that registering the recorder only on the persistence side is shown to keep the rows the `evolution-trace` suites read.

### D6. Is versioning on or off when the configuration does not say?

**What is at stake.** Miroir's own SelfApplication is `versioned-internal`, and the test profiles (`environments/test-*.json`) set no `features`. If a missing `versioning` meant off, the Versioning AppBar item would disappear for every current user after an upgrade, and the five MiroirTests tagged `versioning` would skip in every nonreg run unless each profile were edited. The sandbox shows the Versioning item for Miroir today, but its bundled store cannot write `modelVersion`, so the freeze it offers fails.

**Status:** Proposed — D6-a. **Serves:** G2.

| Option | Default | Pros | Cons |
|---|---|---|---|
| **D6-a. On, sandbox veto** ★ | missing `features.versioning` is true, as `designerTools`; the sandbox forces it off, as it does `ai` | no change for current users and test profiles | the sandbox loses a Versioning item whose freeze could not succeed |
| D6-b. Off, as Git | missing is false | the smallest process by default | breaks every versioned application and every test profile |

**What the capability buys when it is on by default.** Laziness, not the capability, keeps a process small: with D2 and D3, a process with versioning on loads nothing until the first versioning action or traced write. Turning the capability off hides the entries, refuses the actions, and lets a packaged server ship without the package.

**Version skew.** `assertProcessCapability` needs `=== true`. A new client reading `/capabilities` from an older server, which has no `versioning` field, reads it as true (the D6 default, applied where the snapshot is parsed); the fail-closed snapshot (`FAIL_CLOSED_PROCESS_CAPABILITIES`, `ProcessCapabilitiesHttp.ts` line 8) gets `versioning: false`. Since the server refuses the actions itself (D2), a wrong client reading can only show or hide an entry.

**Decision:** D6-a. `process-capabilities.md` changes in two places: the sentence on missing `features.*` values, and the section that says versioning is not a process flag (D7).

### D7. How do the capability and an application's mode combine?

**What is at stake.** #273 D4 kept versioning out of the process snapshot on purpose: whether Library can be frozen depends on Library's mode, not on the process. The capability adds a process-level question beside it. A designer browsing Library (`versioned-internal`) in a process with versioning off must not see a Versioning item that leads to a refused freeze; a designer browsing an `unversioned` application with versioning on must not see it either, as today.

**Status:** Proposed — D7-a. **Serves:** G3.

| Option | Rule | Pros | Cons |
|---|---|---|---|
| **D7-a. Capability first, then mode** ★ | the AppBar item shows when the capability is on **and** `isVersioningAppBarItemVisible` holds; the freeze returns `FeatureUnavailable` (capability `versioning`) before `assertApplicationVersioningEnabled` runs; `getFreezeAvailability` stays per application | each refusal names its real cause; #273 D4 stands | two checks to keep in order |
| D7-b. Fold the capability into the mode | an off capability makes every application read as `unversioned` | one check | lies about the application: the Freeze Runner would say "Application is not versioned" for Library |

**Decision:** D7-a.

### D8. How are the versioning entries hidden when the capability is off?

**What is at stake.** The entries that lead to versioning are:
- the Versioning AppBar item (`AppBar.tsx` line 227, built in code);
- the freeze Runner `20d51c4c-52e5-4077-baf3-5e87bd75e496` (a `customRunner`, listed in `reportMiroirRunners` `ac75382d-00fc-4f93-a169-3f76ef85834e` and in the Versioning report `c2b89408-bed7-473d-ab0a-2f4adc6a85e1`);
- four `MiroirMenu` (`eaac459c-6c2b-475c-8ae4-c6c3032dae00`) items: "Miroir Entity Versions" and "Miroir Application Versions" (items 1 and 2), and the trace list and trace history (items 14 and 15, Reports `b2c3d4e5-f6a7-4890-b123-4567890abcde` and `230467a6-ecc3-4945-bd05-5d9e826c44fb`);
- the action listings built by `listEndpointActions` (`EndpointActionCatalog.ts` line 186): MCP tools (`EndpointToolRegistry.ts` line 120), CLI commands (`commandsFromEndpoint.ts` line 231) and CopilotKit actions (`miroirCopilotKitActions.ts` line 45). None filters by capability today.

The MCP tool Runner is hidden in code by its `runnerType` (`RunnerView.tsx` line 399), and `@miroir-framework/react` already imports `runnerFreezeApplicationVersion` (`runnerDefinitionApplication.ts`) and `reportVersioning` (`AppBar.tsx` line 28). The epic gives #712 a switch on Reports, Menu items and Runners (epic D8); a field added now would pre-empt its design.

**Status:** Proposed — D8-c. **Serves:** G3.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D8-a. A `requiredCapability` field on menu items and Runners | the sidebar and `RunnerView` skip an entry whose capability is off | model data says what it needs | two more ML schema changes; pre-empts #712's visibility condition |
| D8-b. Derive from the actions | a Runner is hidden when an action of its composite needs an off capability | no Runner field | menu items have no actions; deriving needs the Endpoint definitions in the UI |
| **D8-c. In code until #712** ★ | `@miroir-framework/react` keeps one list of the versioning Runner and menu Report uuids, checked against the snapshot, beside the AppBar check; `listEndpointActions` leaves out actions whose `requiredCapability` is off (D3's field), which covers MCP, CLI and CopilotKit | no schema change beyond D3; the listings use model data already | the UI names model elements in code, as it already does; #712 replaces the list |

**Decision:** D8-c. A Report opened by its URL still opens with the capability off; its Runner section is empty and any action it sends is refused (G3). The trace details Report (`c4d5e6f7-a8b9-4c01-a345-67890abcdef1`) is reached only from trace rows, so it needs no entry of its own.

### D9. What does "a client build does not include the package" mean, and what checks it?

**What is at stake.** The capability is read at runtime: the browser receives it from `GET /capabilities` (computed in `createMiroirServerApp.ts` line 135), after the bundle is built. One client build serves a server with versioning on and another with it off. With D2, a browser talking to a server never runs a versioning action, but the same app build also contains `startMiroirClient`'s emulated-server path, which registers the lazy handlers.

**Status:** Proposed — D9-a. **Serves:** G1.

| Option | Meaning | Check |
|---|---|---|
| **D9-a. Never fetched, never loaded** ★ | the package is a lazy chunk of the web build, fetched only by an emulated server that runs a versioning action; a browser talking to a server never fetches it; a process with the capability off never loads it | `@miroir-framework/versioning` joins `forbiddenEager` and the `lazy` list of the three bundle policies (standalone app, sandbox, Electron main); `npm run bundle-size:record` records the smaller eager size, which the bundle size history then shows |
| D9-b. Not built | a build flag aliases the package to a stub | a separate build per configuration |

**Decision:** D9-a. The acceptance criterion is reworded to "with the capability off, a process never loads the package, and a browser talking to a server never fetches it", for the user to confirm. The expected eager saving is small (the review estimates about 8 kB gzipped, below the policy's 2% tolerance), so the history shows it only through a recorded baseline, not through the guard.

### D10. How does a MiroirTest that needs versioning run or skip?

**What is at stake.** Five MiroirTests carry the `versioning` tag: `action.domainController.freezeApplicationVersion`, `runner.freezeApplicationVersion`, `report.freezeRunner`, `report.freezeRunner.unversioned` and `action.scenario.evolutionTrace`. In a process with versioning off they would fail with `FeatureUnavailable` instead of saying why they did not run. #589 made `miroirTestUnmetRequirement(instance, env)` skip `evolution-trace` suites when traces are off.

**Status:** Proposed — D10-a. **Serves:** G2, G3.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D10-a. The tag is a requirement** ★ | `miroirTestUnmetRequirement` and `miroirTestSuiteForEnvironment` take the process capabilities and return a skip reason for the `versioning` tag when the capability is off | same path as `evolution-trace`; no MiroirTest asset changes | three callers change: `RunMiroirTestAction.ts` line 559, `miroirTestBatch.ts` line 232, `runMiroirRunnerTestsFromCLI.ts` line 43 |
| D10-b. A new tag | a `requires-versioning` tag | explicit | edits five assets for what the existing tag already says |

**Decision:** D10-a. Skipping is not testing the capability off: the plan adds tests that assert the refusal, the hidden entries and the filtered listings with the capability off.

---

## 4. Current state

### 4.1 Code to move (misaligned with G1)

| File or range | Lines | Imported by (outside its own files) |
|---|---|---|
| `packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts` | 1859 | `DomainController.ts`, `index.ts`; 7 unit test files `packages/miroir-core/tests/1_core/applicationVersionFreeze.*`; `miroir-standalone-app/tests/3_controllers/applicationVersionFreeze.integ.test.ts` |
| `packages/miroir-core/src/2_domain/evolutionTrace{Compaction,DefVersion,Runtime,Writer}.ts` | 614 | `DomainController.ts`, `index.ts`; 6 unit test files in `packages/miroir-core/tests/2_domain/` (the 3 others, `evolutionTracePolicy`, `evolutionTrace.schema` and `evolutionTrace.reports`, test code or assets that stay) |
| `DomainController.ts` | about 1080 | see D1 |

No package outside core imports a freeze or trace implementation. `@miroir-framework/react` imports `isVersioningAppBarItemVisible`, `getFreezeAvailability` and `resolveVersioningMode`; both localcaches import `assertVersioningEnabledImmutable` and `getApplicationSection`. All of these stay.

### 4.2 Action dispatch and routing (aligned, to extend)

- `freezeApplicationVersion` is declared in ModelEndpoint `7947ae40-eb34-4149-887b-15a9021e714e` with `actionImplementation: { actionImplementationType: "libraryImplementation", inMemoryImplementationFunctionName: "handleAction_freezeApplicationVersion" }`. The Endpoint action definition has no capability field.
- `runLibraryActionImplementation` (`DomainController.ts` line 3736) looks the name up in `miroirActionImplementations` and returns `InvalidAction` when it is missing. `registerMiroirActionImplementation` (`ActionImplementations.ts` line 149) adds an entry from a layer above.
- Server-routed actions: a remote client calls `forwardServerRoutedAction` (line 4268); `restActionHandler` (`RestServer.ts` line 424) passes any action of `SERVER_ROUTED_MIROIR_ACTION_TYPES` to the server's DomainController. Model actions listed in `modelActionTypesForwardedToDomainController` (`RestServer.ts` lines 52–63) are also forwarded; `freezeApplicationVersion` is in neither list.

### 4.3 Where the freeze runs today (misaligned with D2)

With a remote server, the browser's DomainController runs the freeze (section D2). `readSectionInstancesForFreeze` (line 1677) reads locally first and asks the server only when the local read is empty and the access mode is not local. `loadInstancesToFreeze` (line 1639) asks the server when no local store manager exists.

### 4.4 Process capabilities (aligned)

`ProcessCapabilities` (`processCapabilities.ts`) has `ai`, `mcp`, `agentBackend`, `availableStoreTypes`, `creatableStoreTypes`, `storeAdministration`, `designerTools`, `git`. `assertProcessCapability(name, snapshot)` returns the `FeatureUnavailable` error with `errorContext.capability`. Each refusal lives in code today: `storeAdministration` in `ActionImplementations.ts` (lines 29–36), `git` in `handleGitAction`.

### 4.5 UI entries (misaligned with G3)

| Entry | Gated today by |
|---|---|
| Versioning AppBar item | the browsed application's mode only |
| Freeze Runner | nothing (refused inline per application, #225) |
| `MiroirMenu` items 1, 2, 14, 15 | nothing |
| MCP tools, CLI commands, CopilotKit actions for `freezeApplicationVersion` | nothing |

### 4.6 Tests and nonreg

- The five MiroirTests tagged `versioning` (D10) run in the nonreg steps `integ-action.domainController.freezeApplicationVersion`, `integ-runner.freezeApplicationVersion`, `integ-action.scenario.evolutionTrace` (with `MIROIR_EVOLUTION_TRACE=1`) and `integ-report.freezeRunner`.
- `action.scenario.evolutionTrace` inits Library with TestConfiguration `431e0903-80ff-45be-aec7-12fe272dcef0` (Publisher and Country only), so its init writes no baseline; the `squashedBaseline` it asserts comes from the trace writer on the first traced write (`evolutionTraceRuntime.ts` lines 111–112).
- The pre-push gate and `.github/workflows/pr-checks.yml` run core's unit tests only: the 13 unit test files that move would leave the gate unless the package's tests join it.

## 5. Key reuse

| Piece | Location |
|---|---|
| Registration from outside layer 3 | `registerMiroirActionImplementation`, `ActionImplementations.ts` line 149; `miroirCoreStartup` (`startup.ts`) |
| Server routing | `SERVER_ROUTED_MIROIR_ACTION_TYPES` (`constants.ts`), `forwardServerRoutedAction` (`DomainController.ts` line 4268), `restActionHandler` (`RestServer.ts` line 424) |
| Refusal with pending changes | `openMiroirTransactionError` in `handleGitAction` (`DomainController.ts` line 4009) |
| Lazy loader with a cached promise | `registerGitRepositoryFactory` / `getGitRepositoryFactory`, `ConfigurationService.ts` lines 48–80 |
| Package shape (tsup, ESM, `sideEffects: false`, depends on core only) | `packages/miroir-git-isomorphic/package.json`, `tsup.config.ts` |
| Capability refusal and UI | `assertProcessCapability`; `context.processCapabilities.git` in `AppBar.tsx` line 255 and `PageDispatcher.tsx` line 120 |
| Capability-off integration test | `setGitCapability` and the loader call count in `miroir-standalone-app/tests/3_controllers/git/gitTestSetup.ts`, used by `gitStatus.integ.test.ts` |
| Test requirement by tag | `miroirTestUnmetRequirement`, `miroirTestSuiteForEnvironment` (`miroirTestRequirements.ts`) |
| Bundle guards and history | `forbiddenEager` and `lazy` in `packages/{miroir-standalone-app,miroir-sandbox,miroir-standalone-app-electron}/bundle-policy.json`; `npm run bundle-size:record -w miroir-app-miroir` ([code-splitting.md](../../../docs/internals/code-splitting.md)) |
| New-package checklist | `build-all.sh` stages; the build lists of `.github/workflows/pr-checks.yml` and `build-linux-runnables.yml`; `Dockerfile` (beside the Git package build, line 66); `scripts/published-packages.json`; `scripts/rename_packages.py --check`; `scripts/check_dependency_policy.py`; the `-e` externals of `build:server` and the release contents in `packages/miroir-server/package.json`; the dependencies of `miroir-server`, `miroir-standalone-app`, `miroir-standalone-app-electron`, `miroir-react`, `miroir-react-testing` and `miroir-server-library` |

## Next step

The TDD plan: [tdd-implementation-plan.md](tdd-implementation-plan.md).
