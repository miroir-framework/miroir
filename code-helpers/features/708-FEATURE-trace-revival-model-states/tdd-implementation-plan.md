# Issue #708 — TDD Implementation Plan (part A: trace records)

> Integration first, no mocks. The tests drive a real client DomainController and its emulated server (`RestClientStub`), with real filesystem stores (`test-filesystem`), and read what the stores hold. The applicative interfaces are locked first: the SelfApplication `evolutionTraces` field, the `EvolutionTraceRecord` Entity, the ModelEndpoint action `appendEvolutionTraceRecord`, and the new Reports.

**Resume note:** part A is done and merged (PR #721). Part B (model states) is planned at the end of this file, under "Part B". Parts D (Git tag) and C (agreement and re-baseline) get their own sections when B is merged. Slices are done in order; each one ends with its Realization.

## Scope

In (part A of the analysis):
- G1, record what I did: an application with `evolutionTraces` on gets one record per commit and per application in `modelVersion`, with the resolved Actions, ordered by `sequenceNumber` and `previousTrace`.
- G6, pay only for what I use: traces off load nothing; with the capability off, a commit touching an application with traces on is refused.
- The `versioned-git` mode name, and a writable `modelVersion` for it when its traces are on.
- The removal of the process switch, of the two old trace Entities and of everything that names them.

Out:
- Model states, replay and diff (part B), agreement check and re-baseline action (part C), `gitAction_tag` (part D).
- Migrations (#9), restore (#709), the versioning-mode switch and refusing `evolutionTraces` on an unversioned application (#718).

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/708
- Analysis: [analysis.md](analysis.md)
- Prerequisite: [#696 plan](../696-REFACTOR-versioning-package/tdd-implementation-plan.md) (lazy package, capability, server routing)
- Branch: `claude/708-trace-revival`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize init, the old trace inventory and the current tests | ✅ DONE | `evolutionTraceInventory.708` guard, init characterization test |
| 1 | Tracer: a committed Entity-row update leaves one record in `modelVersion` | ✅ DONE | `evolutionTraceRecords.integ` "one commit, one record" |
| 2 | The chain: sequence, `previousTrace`, model Actions, several applications, a partial commit | ✅ DONE | `evolutionTraceRecords.integ` chain cases |
| 3 | Direct model writes, recorded once | ✅ DONE | `evolutionTraceRecords.integ` direct cases |
| 4 | Traces off, unversioned, capability off, no `modelVersion`, a failed append | ✅ DONE | `evolutionTraceSwitch.integ` |
| 5 | `resetModel` and `initModel` leave a `rebaseline` marker | ✅ DONE | `evolutionTraceRecords.integ` reset case |
| 6 | A freeze appends a `version` marker | ✅ DONE | `evolutionTraceRecords.integ` freeze case |
| 7 | `versioned-git` | ✅ DONE | `versioningMode.unit`, `evolutionTraceRecords.integ` Git-mode case |
| 8 | The old traces go; new Reports and MiroirTest | ✅ DONE | `action.scenario.evolutionTrace`, `modelValidation`, inventory guard |
| 9 | Docs, nonreg steps, full nonreg, AC checklist | ✅ DONE | `nonreg:filesystem` |

## Locked implementation defaults

From the analysis decision record (part A). Deviations go in each slice's Realization.

| Default | From | Serves |
|---|---|---|
| New Miroir Entity `EvolutionTraceRecord`, routed to `modelVersion` through `versionHistoryEntityUuids` and `versionHistoryEntityDefinitions`, listed in the meta-model. Fields: `application`, `sequenceNumber`, `previousTrace?`, `kind` (`commit`, `version`, `rebaseline`), `actions?`, `complete?`, `version?`, `gitCommit?`, `commitUuid?`, `timestamp`. | D2 | G1, G6 |
| The old `ApplicationEvolutionTrace` and `ApplicationEvolutionTraceEvent` Entities, their three Reports, two menu items, the Library root row in Miroir data, the placeholder folders, the baseline seeding, the policy, the writer, runtime, compaction and definition-version code are removed. Frozen `EntityVersion` rows of the old Entities stay. | D2 | G1, G6 |
| The DomainController running a commit groups the Actions it replayed by application, and for each application whose traces are on sends `appendEvolutionTraceRecord { application, commitUuid, actions, complete }` (ModelEndpoint, `requiredCapability: versioning`). Run in place when the stores are local, otherwise sent to the server without the pending-change refusal and the reload of `forwardCapabilityAction`, and without `forgetModelEnvironmentChangedBy`. | D3 | G1, G6 |
| The package writes the record under a lock per application, with `sequenceNumber` = last + 1 and `previousTrace` = last record's uuid, read from the store. | D3 | G1 |
| Recorded: `createEntity`, `alterEntityAttribute`, `renameEntity`, `dropEntity`; `createInstance`, `updateInstance`, `deleteInstance` on `model` (and on Miroir's `data`). A failed commit records the Actions that reached the store, `complete: false`. | D3 | G1 |
| A direct model write makes a one-Action record. A write received through the REST server's persistence endpoint carries a symbol-keyed mark set by `restActionHandler`, and the receiving DomainController records nothing for it. | D3 | G1 |
| A failed append: the commit stands, its result reports the failure, and the DomainController sends the kept record again before the next one. | D3 | G1 |
| `resetModel` and `initModel` are not recorded; with traces on they append a `rebaseline` marker without a version, and the gate refuses them like a commit. Init reads the switch like any write, from the cached SelfApplication row, which stays cached through init (Slice 0); with traces off, init records nothing. | D3, revised in Slice 0 | G1, G6 |
| A freeze of an application with traces on appends a `version` marker naming the version; it does not update earlier records. | D4 (pending the user's sign-off, it narrows Q19) | G1 |
| `evolutionTraces?: boolean` on SelfApplication; it reads as off on an unversioned application, with a warning when the application loads. The traces of an application are read from its SelfApplication row in the local cache, as it is before the commit's replay. | D5 | G1, G6 |
| Gate: before anything is written, a commit (or direct model write) touching an application with traces on is refused when the process has the `versioning` capability off (`FeatureUnavailable`) or the deployment has no `modelVersion` section. Every application of the transaction is checked. | D5 | G6 |
| `MIROIR_EVOLUTION_TRACE` / `VITE_MIROIR_EVOLUTION_TRACE`, the `evolution-trace` MiroirTest tag and its requirement are removed. | D5 | G6 |
| `versioningMode` gains `versioned-git`; `versioned-external` stays in the enum and resolves to `versioned-git`. A `versioned-git` application fetches `modelVersion` only when its traces are on; freeze stays refused for it. | D6 | G1, G5 |

## Allocated UUIDs and keys

| Element | uuid / key |
|---|---|
| Entity `EvolutionTraceRecord` | `854c47bd-af74-4305-bdea-aa6bddfa8899` |
| Report `EvolutionTraceRecordList` | `45735607-4711-45af-be04-4b4d36fa585c` |
| Report `EvolutionTraceRecordDetails` | `68594192-0ff5-4b29-98ec-4752b5fc491f` |
| ModelEndpoint action | `appendEvolutionTraceRecord`, implementation `handleAction_appendEvolutionTraceRecord` |
| Test fixture uuids | prefix `708a…` |
| MiroirTest (kept, rewritten) | `action.scenario.evolutionTrace` (`2427ef3a-3cd1-4b87-afe7-433bb04b25d2`) |
| vitest files | `packages/miroir-standalone-app/tests/3_controllers/versioning/evolutionTraceRecords.integ.test.ts`, `evolutionTraceSwitch.integ.test.ts`; `packages/miroir-core/tests/1_core/evolutionTraceInventory.708.unit.test.ts` (removed in Slice 9 if it only guards the removal) |

Why vitest for the record tests: they observe two DomainControllers (client and emulated server), the loader count of the lazy package and the store files of `modelVersion`, none of which a MiroirTest can see. The applicative end-to-end stays a MiroirTest (`action.scenario.evolutionTrace`, Slice 8).

## Test execution conventions

| What | Command |
|---|---|
| Record tests | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/` |
| Package unit tests | `npm run test -w @miroir-framework/versioning` |
| Core unit tests | `npm run test -w @miroir-framework/core -- ''` |
| A core test | `RUN_TEST=<name> npm run testByFile -w @miroir-framework/core -- <name>` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core` |
| Packages after a core change | `npm run build -w @miroir-framework/versioning -w @miroir-framework/react` (and the others the slice touches) |
| Model validation | `npm run testMiroir -w miroir-standalone-app -- --suites <modelValidation suite> --mode integ` (as in `nonreg-manifest.json`) |
| MiroirTest | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --mode integ --suites action.scenario.evolutionTrace` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` per touched package |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |

## Slice 0 — Characterize init, the old trace inventory and the current tests

**Status:** ✅ DONE

**Goal:** a safety net before anything changes.

**RED/characterization:**
- `evolutionTraceInventory.708.unit.test.ts` lists, with a file walk, every asset and source file that names `de089f57-…` or `f4c2b3a1-…`, and locks today's list. Slice 8 changes it to "only the frozen `EntityVersion` rows in `miroir_modelVersion/`".
- An init characterization in `evolutionTraceRecords.integ.test.ts`: while `resetAndinitializeDeployment` of appForTest runs its `commit`, the client's local cache holds no appForTest SelfApplication row. This is the reason init records nothing (analysis D3). If it is false, stop and revise D3 before Slice 1.
- Run the current versioning tests and the trace MiroirTest; record their results.

**GREEN:** none (characterization).

**Refactor checkpoint:** none.

**Validation:**
```bash
RUN_TEST=evolutionTraceInventory npm run testByFile -w @miroir-framework/core -- evolutionTraceInventory
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/
```

### Realization

- `evolutionTraceInventory.708.unit.test.ts` locks 43 files that name the old trace Entities' uuids, `ApplicationEvolutionTrace` or `MIROIR_EVOLUTION_TRACE` (generated types excluded).
- The init characterization (`evolutionTraceRecords.integ` "init: …") runs appForTest's init sequence step by step on the client. **The analysis's assumption was false:** appForTest's SelfApplication row is in the client's local cache before every step, including right after `resetModel`. D3 is revised (analysis, document history): init reads the switch like any write and records only for an application whose cached row has traces on; with traces on, `resetModel` and `initModel` append `rebaseline` markers and are gated. No fixture and no Runner starts with traces on, and a cloned Git deployment is installed without init (`gitAction_installClonedDeployment` opens the store from its files).
- Baseline: the 7 files of `tests/3_controllers/versioning/` pass (21 tests) on `test-filesystem`.

## Slice 1 — Tracer: a committed Entity-row update leaves one record in `modelVersion`

**Status:** ✅ DONE

**Goal:** with appForTest's traces on, a designer's Entity-row update committed from the client produces one `EvolutionTraceRecord` in appForTest's `modelVersion`, written by the emulated server.

**RED:** `evolutionTraceRecords.integ` "one commit, one record": switch appForTest's `evolutionTraces` on in the store and reload; send a `transactionalInstanceAction` updating an appForTest Entity row; commit. The store's `modelVersion` holds one record: `kind: commit`, `sequenceNumber: 1`, no `previousTrace`, `complete: true`, `actions` equal to the one `updateInstance` with its full object, and the commit's `commitUuid`.

**GREEN:**
- `evolutionTraces` in the SelfApplication Entity schema; the `EvolutionTraceRecord` Entity asset; its uuid in `versionHistoryEntityUuids`, `versionHistoryEntityDefinitions` and the meta-model lists; schema rebuild.
- `appendEvolutionTraceRecord` in the ModelEndpoint JSON with `requiredCapability: versioning`; in `VERSIONING_ACTION_IMPLEMENTATION_NAMES` and `SERVER_ROUTED_MIROIR_ACTION_TYPES`.
- DomainController: the commit loop collects the replayed Actions by application; after the loop, an append per application with traces on. A remote DomainController forwards the append with `forwardServerRoutedAction`.
- `RestServer`: the append keeps the model environments.
- Package: `handleAction_appendEvolutionTraceRecord` reads the last record (`readSectionInstances`), writes the new one with `createInstance` in `modelVersion`, under a lock per application.

**Refactor checkpoint:** the trace-on check (SelfApplication row in the local cache) is one DomainController method, used again in Slices 3 to 7.

**Validation:**
```bash
npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core
npm run build -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- evolutionTraceRecords
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-versioning/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions
```

### Realization

- Applicative surface: the `EvolutionTraceRecord` Entity (`854c47bd-…`, scope `versioning`, routed to `modelVersion` in `versionHistoryEntityUuids` and `versionHistoryEntityDefinitions`, listed in Miroir's meta-model), `evolutionTraces` on the SelfApplication schema (not editable, like `versioningMode`), and the ModelEndpoint action `appendEvolutionTraceRecord` (`requiredCapability: versioning`). Its payload carries `kind`, so the same action appends commit records and the markers of Slices 5 and 6.
- **Deviation:** an Endpoint action gains an optional `internal` flag, and the action catalog leaves internal actions out, so MCP tools, CLI commands and CopilotKit actions never offer `appendEvolutionTraceRecord`. A client-sent append could otherwise forge history.
- Core: `1_core/versioning/evolutionTraceRecording.ts` holds the rules (`isEvolutionTraceOn`, `isRecordedModelChange`, the action builder). The DomainController reads the traced applications from the cached SelfApplication rows before the replay, collects the replayed changes, and appends one record per traced application after the loop, or a `complete: false` one where the loop returns an error. A remote DomainController sends the append with `forwardServerRoutedAction`; the server neither forgets its model environments nor reloads.
- Package: `evolutionTraceRecords.ts` serializes appends per application, creates the record Entity in the application's model on the first append (as the freeze does for its own Entities), and reads the last record from the store. The freeze now leaves every version-history Entity out of the Entities it snapshots, so the record Entity is never frozen.
- Writes of version-history Entities are never recorded, so the Entity creation of the first append records nothing.
- The old trace Entities stay in the fundamental schema until Slice 8; removing them now breaks the old writer's types.
- Inventory tests updated: ModelEndpoint actions, `VERSIONING_ACTION_IMPLEMENTATION_NAMES`, the version-history families, the catalog (internal action never listed).
- Validation: `evolutionTraceRecords.integ` 2/2; the versioning folder 22/22; core unit tests green; scoped nonreg `smoke,core,actions` green except `unit-696-versioning-package`, whose one failure was the history-family count, fixed (187/187).

## Slice 2 — The chain: sequence, `previousTrace`, model Actions, several applications, a partial commit

**Status:** ✅ DONE

**Goal:** records form one ordered chain per application, and a commit's record says exactly what reached the store.

**RED:** in `evolutionTraceRecords.integ`:
- a second commit gives `sequenceNumber: 2` and `previousTrace` = the first record's uuid;
- a commit with a `createEntity` and an instance update records both Actions in replay order;
- a commit holding changes of appForTest and of Library (switched to `versioned-internal` with traces on in the fixture; `test-filesystem` gives Library a `modelVersion`) makes one record in each application's `modelVersion`, with the same `commitUuid`;
- a commit whose second replayed Action fails records the first Action with `complete: false`. Find a failure the real store produces; if none can be produced without a mock, record the gap in the Realization and keep the rule in code review.

**GREEN:** grouping and the partial record in the commit loop.

**Refactor checkpoint:** the commit loop's collection of replayed Actions is one small function, not inline bookkeeping in each `case`.

**Validation:**
```bash
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- evolutionTraceRecords
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization

- The grouping and the partial record were already in Slice 1's code; the four tests went green against it.
- The partial commit uses a failure the real store produces, no mock: the emulated server drops `Note708` directly, so the client still caches it; the client's transaction then holds an update and a rename of `Note708`, and the rename fails in the filesystem store. The record holds the update, with `complete: false`.
- Library is made `versioned-internal` with traces on by a direct write of its SelfApplication row, then loaded into the client by a rollback: the test context had not loaded Library, so the write alone left nothing in the client's local cache to read the switch from.
- Refactor checkpoint: the collection is two `push` calls next to the replays; no extraction needed.
- Validation: `evolutionTraceRecords.integ` 6/6; the versioning folder 26/26. Scoped nonreg deferred to Slice 3, which changes the same code.

## Slice 3 — Direct model writes, recorded once

**Status:** ✅ DONE

**Goal:** a model write outside a transaction makes a one-Action record, and the emulated server does not record it again.

**RED:** in `evolutionTraceRecords.integ`:
- a non-transactional `createEntity` on appForTest makes one record with that Action;
- a direct `updateInstance` on appForTest's `model` section makes one record, and after it the store holds exactly one new record (the server, which receives the write over REST, records nothing);
- a write to appForTest's `data` section makes none.

**GREEN:**
- `restActionHandler` marks the Actions it hands to its DomainController (a symbol-keyed property); the DomainController skips recording for a marked Action.
- The direct path of `handleInstanceAction` and the non-transactional path of `handleModelAction` append a one-Action record.
- `maybeRecordEvolutionTrace` and its `EvolutionTraceRecorder` hook are removed; `versioningLazyTraces` is rewritten for the new counts.

**Refactor checkpoint:** one recording entry point in the DomainController for commits and direct writes.

**Validation:**
```bash
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization

- `evolutionTraceRecording.ts` gains `markRecordedBySender` and `isRecordedBySender` (a `Symbol.for` key: object spreads keep it, JSON drops it) and `recordedInstanceWrite`. `RestServer` marks both Actions it hands its DomainController.
- The DomainController reads `recordsDirectWrite` before the write and, on success, calls `appendDirectWriteRecord`, which goes through `appendCommitRecords` with a new `commitUuid`. Commits and direct writes share that one entry point (refactor checkpoint). It runs on the direct path of `handleInstanceAction` and on the non-transactional path of `handleModelAction`.
- Removed: `maybeRecordEvolutionTrace`, `EVOLUTION_TRACEABLE_ACTION_TYPES` and the old recorder's lazy load. `evolutionTraceWriters.integ` is deleted. `versioningLazyTraces.integ` is rewritten: with traces off nothing loads; with them on, the package loads once and each write is recorded once, by the server.
- Pulled forward from Slices 4 and 8, because the old recorder was gone and the suite tagged with it tested nothing:
  - the `evolution-trace` MiroirTest requirement. `miroirTestUnmetRequirement(instance, capabilities?)` and `miroirTestSuiteForEnvironment(instance, suite, capabilities?)` lose their `env` parameter. The tag value stays in the MiroirTest Entity enum until Slice 8, and its `docs/reference/testing.md` row says it is deprecated. The nonreg step no longer sets `MIROIR_EVOLUTION_TRACE=1`.
  - `action.scenario.evolutionTrace`, rewritten on appForTest: traces on, then a transactional `createEntity` and `renameEntity`, a commit and a data write. It then reads the records with `queryExecutionStrategy: "storage"`, because the client's cache does not hold `modelVersion`. It carries the appForTest inline playfield of `runner.freezeApplicationVersion`, since an integ suite needs one, and it leaves the Publisher+Country TestConfiguration expectations.
- Problems met: the first scoped nonreg had three failures. The old suite failed because its recorder was gone. `unit-696` failed because the requirement test expected the tag. The tracked-assets guard failed because files were edited during the run. The rerun passes, 30 of 30.

## Slice 4 — Traces off, unversioned, capability off, no `modelVersion`, a failed append

**Status:** ✅ DONE

**Goal:** the setting and the gate behave as D5 says, and a failed append is not lost.

**RED:** `evolutionTraceSwitch.integ`:
- traces off: a commit writes no record and loads no package (loader count 0);
- an unversioned application with `evolutionTraces: true`: no record, and a warning when it loads;
- the client's `versioning` capability off, traces on: the commit is refused with `FeatureUnavailable` and the store is unchanged; a commit holding changes of a traces-off application and of a traces-on one is refused too;
- traces on, deployment without a `modelVersion` section: the commit is refused, store unchanged;
- the server's capability off while the client's is on: the commit succeeds, its result reports the failed append; with the capability back, the next commit leaves two records, in order.

**GREEN:** the gate before the replay; the kept record and its resend; the unversioned warning at load.

**Refactor checkpoint:** the gate and the trace-on check share their reading of the SelfApplication row.

**Validation:**
```bash
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- evolutionTraceSwitch
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,external
```

### Realization

- `evolutionTraceSwitch.integ` holds the six cases. "Traces off loads nothing" was already proved by `versioningLazyTraces.integ` (Slice 3) and is not repeated.
- `DomainController.evolutionTraceRefusal(tracedApplications, map)` is the gate. It takes the applications that `applicationsWithEvolutionTraces` read from the cached SelfApplication rows, so the gate and the switch share one reading (refactor checkpoint). It runs before the replay of a commit, and before a direct instance write or a non-transactional model write that would be recorded.
  - With the capability off, it returns `FeatureUnavailable` (`capability: versioning`).
  - It returns `FailedToHandleAction` when the deployment's Deployment row, cached from the admin application, has no `configuration.modelVersion`. When the row is not cached, the gate lets the write through, and a failed append is kept as below.
- A failed append is kept per application in `pendingEvolutionTraceRecords`. `appendEvolutionTraceRecordInOrder` sends the kept records first, in order. The commit then returns `{ status: "ok", returnedDomainElement: { evolutionTraceAppendFailures: [{ application, errorType, errorMessage }] } }`, so `handleModelAction` now returns `Action2ReturnType`. A direct write that fails to append keeps its record and only logs it.
- The unversioned warning is `evolutionTracesIgnoredWarning(row)`, logged by `loadConfigurationFromPersistenceStore` where it resolves the versioning mode. Logs are not observable without mocks, so `evolutionTraceSwitch.unit` (core) checks the text and the integration test checks that no record is written.
- The no-`modelVersion` case writes appForTest's Deployment row without `modelVersion` through the admin application, then restores it. The cached state is frozen and cannot be edited in place.
- Scoped nonreg `smoke,actions,external`: 47 of 47 pass.

## Slice 5 — `resetModel` and `initModel` leave a `rebaseline` marker

**Status:** ✅ DONE

**Goal:** a model rewritten outside the designer's Actions restarts the chain.

**RED:** in `evolutionTraceRecords.integ`: with appForTest's traces on, `resetModel` then `initModel` leave a `rebaseline` record with no version and no Actions, chained after the last record. Deployment init with traces on in the seed records nothing (Slice 0).

**GREEN:** the marker append after `resetModel` and `initModel`.

**Refactor checkpoint:** markers and commit records go through the same append action.

**Validation:**
```bash
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- evolutionTraceRecords
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization

- Deviation from the RED: `resetModel` clears `modelVersion` along with the rest of the model (`PersistenceStoreController.clear` keeps only `devData`). The chain is gone after a reset, so the reset's marker is record 1 of a new chain, with no `previousTrace`. `initModel` leaves a second marker chained after it. The test asserts both.
- `resetModel` and `initModel` read the switch before they run, pass the same gate as a commit (`evolutionTraceRefusal`), and then append their marker through `appendRebaselineMarker`. That uses `appendEvolutionTraceRecordInOrder`, the same path as commit records (refactor checkpoint). A reset also drops the records still kept for the application, because their chain is gone.
- The commits of a full deployment init are recorded like any commit when the cached row has traces on, after the two markers: init reads the switch like any write (D3, revised in Slice 0).
- `evolutionTraceSwitch.integ` adds a case: with the client's capability off, a traced `resetModel` is refused and clears nothing.
- Scoped nonreg `smoke,actions`: 30 of 30 pass.

## Slice 6 — A freeze appends a `version` marker

**Status:** ✅ DONE

**Goal:** the records between two versions can be found (D4).

**RED:** in `evolutionTraceRecords.integ`: with traces on, freezing appForTest as `708-v1` appends a `version` record naming `708-v1`, chained after the last commit record; the earlier records are unchanged. With traces off, the freeze appends nothing.

**GREEN:** the freeze implementation (package) appends the marker after writing the version.

**Refactor checkpoint:** none expected.

**Validation:**
```bash
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- evolutionTraceRecords
npm run test -w @miroir-framework/versioning
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --mode integ --suites action.domainController.freezeApplicationVersion
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization

- The freeze implementation (package) appends the marker after it persists the version. It reads the switch from the SelfApplication row in the store where the freeze runs, then calls `handleAction_appendEvolutionTraceRecord` directly: the freeze already runs where the stores are, so there is no second round trip. The freeze stands when the marker cannot be appended, which is logged.
- Deviation: the marker's `version` holds the uuid of the `SelfApplicationVersion` row, not its name, because a name can repeat across branches. The test finds that row by the name `708-v1`.
- Core now exports `isEvolutionTraceOn`, `selfApplicationRowLocation` and the `EvolutionTraceSwitchInput` type for the package.
- D4 is still waiting for the user's sign-off. This slice implements its recommended option (a marker, no update of earlier records).
- Validation: the records test (12 of 12), the versioning package (187), the `action.domainController.freezeApplicationVersion` MiroirTest, and the scoped nonreg `smoke,actions` (30 of 30) all pass.

## Slice 7 — `versioned-git`

**Status:** ✅ DONE

**Goal:** an application in Git mode keeps its records in its `modelVersion` section.

**RED:**
- `versioningMode.unit` (core): `versioned-git` resolves to itself, `versioned-external` resolves to `versioned-git`, and freeze is refused for both.
- `evolutionTraceRecords.integ`: appForTest switched to `versioned-git` with traces on loads its `modelVersion` section, and a commit writes its record there; with traces off, the section is not fetched.

**GREEN:** the enum value and schema rebuild; `resolveVersioningMode`; the history fetch condition in `DomainController` (`nonModelFetchTargets`).

**Refactor checkpoint:** the remaining checks of `"versioned-internal"` that mean "has a `modelVersion`" use one helper.

**Validation:**
```bash
npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core
RUN_TEST=versioningMode npm run testByFile -w @miroir-framework/core -- versioningMode
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- evolutionTraceRecords
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,ui
```

### Realization

- `VersioningMode` is now `unversioned | versioned-internal | versioned-git`. The SelfApplication schema accepts `versioned-git` and still accepts `versioned-external`, which `resolveVersioningMode` reads as `versioned-git`. The freeze refusal and its availability reason name Git ("The model history is kept in Git (versioned-git)"). The types are regenerated (`devBuild`).
- `fetchesModelVersion(row)` (in `evolutionTraceRecording.ts`) decides whether loading fetches the history section: always for versioned-internal, and for versioned-git only when the traces are on. `loadConfigurationFromPersistenceStore` uses it in place of its own `versioned-internal` check (refactor checkpoint).
- `ModelInitializer` keeps its `versioned-internal` check on purpose. It decides where the init-only SelfApplicationVersion goes, and a Git application cannot freeze, so that row stays in `model`.
- The test name is `versioningModes.contract.unit` (core), not `versioningMode.unit`. `evolutionTraceRecords.integ` covers three cases: with traces on, Git mode loads `modelVersion` and records a commit there; with traces off, the cache holds no record; the freeze stays refused.
- The docs still say `versioned-external`; Slice 9 updates them.
- Scoped nonreg `smoke,core,actions,ui`: 83 of 83 pass.

## Slice 8 — The old traces go; new Reports and MiroirTest

**Status:** ✅ DONE

**Goal:** one trace format, visible in the designer's menu, proven end to end by a MiroirTest.

**RED:**
- `action.scenario.evolutionTrace` rewritten on appForTest (filesystem profile): switch traces on, commit a change, query the records with an extractor on `EvolutionTraceRecord` in `modelVersion`, assert one `commit` record with the Action.
- The inventory guard expects only the frozen `EntityVersion` rows.

**GREEN:**
- Remove the old Entities, Reports, menu items, root row, placeholder folders, baseline seeding (`Deployment.ts`), policy (`evolutionTracePolicy.ts`), the package's writer, runtime, compaction and definition-version code and their unit tests, the core exports, the `evolution-trace` tag (enum, requirement, `runSelfTestInteg`), and the process switch in tests, `nonreg-manifest.json` and docs.
- Add the two Reports (list and details) and one Miroir menu item, under `VERSIONING_MENU_REPORT_UUIDS`; fix the freeze MiroirTest's fixture menu (`d7e9f81b-…`).
- Schema rebuild.

**Refactor checkpoint:** dead imports and exports found by `tsc` across packages.

**Validation:**
```bash
npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --mode integ --suites action.scenario.evolutionTrace
RUN_TEST=evolutionTraceInventory npm run testByFile -w @miroir-framework/core -- evolutionTraceInventory
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,ui,tooling
```

### Realization

- Removed: the old Entities `de089f57-…` (ApplicationEvolutionTrace) and `f4c2b3a1-…`, their `miroir_data` folders with the root row `ea4b571f-…`, the `admin_model` and `library_model` placeholder folders, the Reports `230467a6-…`, `b2c3d4e5-…`, `c4d5e6f7-…`, the Miroir menu items 14 and 15, `evolutionTraceBaseline.ts` and the baseline seeding in `Deployment.ts`, `evolutionTracePolicy.ts`, the package's writer, recorder, runtime, compaction and definition-version modules with their unit tests, and the old core exports (`EvolutionTraceCommitContext`, `EvolutionTraceRecorder`, the generated `ApplicationEvolutionTrace*` types).
- Kept: the frozen `EntityVersion` rows `20e86585-…` and `45491bf9-…` in `miroir_modelVersion` (history); their exports are gone.
- Added: Reports `EvolutionTraceRecordList` (`45735607-…`, sorted by `sequenceNumber`) and `EvolutionTraceRecordDetails` (`68594192-…`, the Entity's `defaultInstanceDetailsReportUuid`), and one Miroir menu item "Miroir Evolution Trace Records" in section `modelVersion`, filtered by `VERSIONING_MENU_REPORT_UUIDS`. The freeze MiroirTest's fixture menus (`d7e9f81b-…`) follow.
- `action.scenario.evolutionTrace` rewritten on appForTest: traces on, create and rename an Entity, commit, query `EvolutionTraceRecord` in `modelVersion` with `queryExecutionStrategy: "storage"`.
- Deviations:
  - `loadLazyCapabilityModule` and the lazy loaders in `ActionImplementations.ts` had no caller left once the runtime module went; removed. `MIROIR_APPLICATION_UUID` is now exported from `AccessPolicy.ts` (it came through the policy module).
  - The `evolution-trace` tag left the MiroirTest Entity and its EntityVersion `51c647fe-…`: the tag vocabulary is now 24 (`miroirTestTags.unit.test.ts`).
  - `ui.transformerEditor` (`ce3f9603-…`) asserted on the first Report by name, which was `ApplicationEvolutionTraceDetails`; it is now `ApplicationList`.
  - #274 inventory: 93 Reports, 10 of type `list`, 78 without a type.
  - `eslint-suppressions.json` pruned of the suppressions of the deleted files.
- Problems: one parallel nonreg run saw `action.scenario.evolutionTrace` read no record after a successful append (logs identical to a passing run except the query result); it did not reproduce alone, after the steps that ran before it on the same worker, nor in a parallel `actions` run. A second scoped run passed it but failed `action.domainController.freezeApplicationVersion` the same way (the Blob, TestConfiguration and Test instances seeded and committed just before were read back empty); that did not reproduce either, in three parallel runs of the involved steps. Both are load-dependent reads, not tied to a change of this slice; Slice 9's full run watches for them.

## Slice 9 — Docs, nonreg steps, full nonreg, AC checklist

**Status:** ✅ DONE

**Goal:** part A is documented, guarded and ready for review.

**Work:**
- Docs: `docs/reference/versioning.md` (modes, traces, `modelVersion` for Git mode), `docs/reference/process-capabilities.md`, `docs/reference/testing.md` (no `evolution-trace` tag), `docs/internals/code-splitting.md`.
- `scripts/nonreg-manifest.json`: the trace MiroirTest step runs on the filesystem profile only; a step `integ-708-evolution-trace-records` runs `3_controllers/versioning/` record and switch tests (scopes `actions`, `external`).
- Bundle size: rerun the guards; record a new measurement if the eager size moves.
- Remove the inventory guard if it only guarded the removal.
- AC checklist below; full nonreg; pre-push gate.

**Validation:**
```bash
npm run nonreg:filesystem -- --runner shared
```

### AC checklist (part A of #708)

| #708 scope item | Proof |
|---|---|
| `versioned-git`, `versioned-external` readable for one release | `versioningModes.contract.unit.test.ts` (core); `evolutionTraceRecords.integ.test.ts` › versioned-git: "a freeze stays refused" |
| `evolutionTraces` in both versioned modes, refused (read as off, with a warning at load) on `unversioned` | `evolutionTraceSwitch.unit.test.ts` (core); `evolutionTraceSwitch.integ.test.ts` › "an unversioned application with evolutionTraces on gets no record" |
| One record per Miroir commit, ordered resolved Actions, in `modelVersion`, its own instance file | `evolutionTraceRecords.integ.test.ts` › "one commit, one record", "records both Actions, in replay order", "one record in each, with one commitUuid"; MiroirTest `action.scenario.evolutionTrace` |
| Ordered by `previousTrace` plus a sequence number; no per-branch root | `evolutionTraceRecords.integ.test.ts` › "a second commit continues the chain"; root row and old Entities removed (Slice 8) |
| A writable `modelVersion` for `versioned-git`, committed with the model; `versioning.md` updated | `evolutionTraceRecords.integ.test.ts` › versioned-git: "loads its modelVersion section and a commit writes its record there", "does not fetch its modelVersion section"; `docs/reference/versioning.md` § Evolution traces |
| Capability gate on model commits when traces are on | `evolutionTraceSwitch.integ.test.ts` › the refused commit, mixed commit, direct write and resetModel cases; the missing-`modelVersion` case |
| Miroir's own SelfApplication ships with traces off | Miroir's SelfApplication row has no `evolutionTraces` (read as off) |
| `MIROIR_EVOLUTION_TRACE` removed | No file names it but the frozen `EntityVersion` rows (checked by the inventory guard until Slice 9, then removed); `versioningSurface.unit.test.ts` › the removed old trace exports |
| Re-baseline marker (part of Q30) | `evolutionTraceRecords.integ.test.ts` › "resetModel then initModel each leave a rebaseline marker"; the freeze's `version` marker › "a freeze appends a version marker" |
| `ModelStateSource`, replay, diff | part B; it returns a `MetaModel`, which first gains the missing collections (analysis D7-a and its impact inventory) |
| Agreement check, re-baseline action | part C |
| `gitAction_tag` | part D |

### Realization

- Docs: `versioning.md` gets an "Evolution traces" section (switch, record fields, kinds, writer, gate, kept records, Reports), `versioned-git` in the modes table, and `modelVersion` for Git mode with traces on; `process-capabilities.md`, `code-splitting.md` and `getting-started/bundles-and-versioning.md` follow. `testing.md` lost its `evolution-trace` tag row in Slice 8.
- `nonreg-manifest.json`: `integ-action.scenario.evolutionTrace` runs on `emulatedServer-filesystem` only (`requires: none`, no shell); new step `integ-708-evolution-trace-records` runs `3_controllers/versioning/evolutionTrace*` (scopes `actions`, `external`); `integ-696-versioning-capability` now runs `3_controllers/versioning/versioning*`; the titles of the two #696 steps no longer name the removed modules.
- Bundle guards: app 848,242 bytes gzipped (baseline 847,187), Electron 860,715 (859,564), both within the 2% tolerance; no new measurement recorded.
- The inventory guard `evolutionTraceInventory.708` is removed: no file names the old traces but the two frozen `EntityVersion` rows, and `versioningSurface.unit.test.ts` keeps the removed exports from coming back.
- PR review (#721): a freeze now sends the kept records before its version marker and is refused while they cannot be sent, and the appends of one application are chained so two writes never send a kept record twice; two tests in `evolutionTraceSwitch.integ.test.ts`, each red without its fix. Reading only the last record at append is left for part C (the stores have no such read, and a cached pointer goes stale on `resetModel` or a Git checkout).
- Full `nonreg:filesystem --runner shared`: 135 passed, 0 failed (snapshot `20261112T032249Z`). The two load-dependent failures seen in Slice 8 did not recur.

---

# Part B — Model states

> Integration first, no mocks. The tests read real filesystem stores (`test-filesystem`) through a real client DomainController and its emulated server, freeze real applications (appForTest, Library), and read a real Git repository through `@miroir-framework/git-isomorphic` in a temporary folder. The applicative interface locked first is the `MetaModel` shape: one collection for every Entity of the meta-application (analysis D7-a).

**Resume note:** planned 2026-11-15, after part A merged. The designer answered the four questions on 2026-11-15. Branch `claude/708-part-b-model-states`.

## Scope (part B)

In:
- G2, read any model state: `ModelStateSource` gives the model of an application live, at a frozen version, or at a Git ref, as one `MetaModel` (D7-a).
- G3, see what changed: a diff of two `MetaModel`s over every collection, Entity attributes by name (D8). It replaces `diffEntityVersionSnapshots`.
- The replay: a `MetaModel` plus the Actions of `commit` records gives a `MetaModel` (used by part C's agreement check and by #9's generation, epic D12).
- `MetaModel` gains a collection for every Entity of the meta-application that it lacks, and every builder of a `MetaModel` fills them (D7 impact inventory).

Out:
- The agreement check, the re-baseline action (part C), `gitAction_tag` (part D).
- Turning an Entity row update into attribute steps for a migration draft (#9, epic D12): the replay applies the update as is.
- A UI or a Report showing a model state or a diff. Part B gives functions in the versioning package; part C is their first user.

## Questions before Slice 1

| # | Question | Recommendation | Why it matters |
|---|---|---|---|
| Q-B1 | The `Test` Entity (`c37625c7`, composite-action tests): give it a `MetaModel` collection, or retire it? | **Answered (2026-11-15): retire it, in #726.** Part B gives it no collection. Its one row is read only by a core parse test; its `mlSchema` still defines the `testCompositeAction…` types (48 uses in `src`), which move before the Entity goes. | D7-a's rule covers every Entity |
| Q-B2 | `MetaModel.tests` holds MiroirTest rows. Rename it `miroirTests`? | **Answered (2026-11-15): no.** MiroirTests belong in `devData` eventually (not delivered with an application's runtime), and devData Entities stay out of `MetaModel`, so `tests` leaves `MetaModel` then (#726). Until then it stays as it is: the self-test (`runSelfTest.ts`), the test registries (`useSelectedApplicationMiroirTestSuiteRegistries.ts`) and the freeze read it. | |
| Q-B3 | Derive the collections, `versionHistoryEntityUuids`, its parallel map, the local cache selectors, `extractApplicationModel` and the freeze snapshots from one list of the meta-application's Entities? | **Answered (2026-11-15): yes.** One list in core, `metaModelCollections` (Entity uuid → collection key), checked against the Entity folder by a guard test | the hand lists are how Blob, TestConfiguration and Test were missed (#706) |
| Q-B4 | The freeze snapshots of the nine older types copy a subset of fields (a Report version keeps `name`, `definition`, `defaultLabel`, `type`, `description`, and drops `selfApplication` and `conceptLevel`). Snapshot every type the way #706 snapshots Blob, TestConfiguration and Test (all fields but the identity ones)? | **Answered (2026-11-15): yes**, in Slice B3 | a model read back from a version must equal the model that was frozen, or the agreement check (part C) fails on fields nobody changed |

## Progress summary (part B)

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| B0 | Characterize: the collections `MetaModel` lacks, and what a freeze loses | ✅ DONE | `metaModelCollections.unit`, `freezeSnapshotFields.unit` |
| B1 | `MetaModel` has a collection for every Entity of the meta-application | ✅ DONE | `metaModelCollections.unit`, `modelStates.integ` (cached model of Miroir holds its branch and test configuration) |
| B2 | Tracer: the live model state | ✅ DONE | `modelStates.integ` B2 (live state equals the stored rows of every collection) |
| B3 | The model at a frozen version equals the model that was frozen | ✅ DONE | `modelStates.integ` B3 (frozen round trip), `freezeSnapshotFields.unit` at its B3 target |
| B4 | The model at a Git ref | ✅ DONE | `modelStatesGit.integ` |
| B5 | The diff of two model states | ✅ DONE | `modelStateDiff.unit`, `modelStates.integ` B5 |
| B6 | The replay of trace records | ✅ DONE | `modelStateReplay.unit`, `modelStates.integ` B6 (replay gives the live model) |
| B7 | Docs, nonreg step, full nonreg, AC checklist | ✅ DONE | `nonreg:filesystem` |

## Locked implementation defaults (part B)

| Default | From | Serves |
|---|---|---|
| `ModelStateSource` returns a `MetaModel`. `MetaModel` has one collection for every Entity of the meta-application whose rows belong to an application's `model` or `modelVersion` section; `devData` Entities stay out. | D7-a | G2 |
| Three sources, in the versioning package: `liveModelState(application)`, `frozenModelState(application, version)` (from the `*Version` rows its Cross rows name), `gitModelState(application, ref)` (the `*_model/<entityUuid>/*.json` files at `ref`). The Git source loads `@miroir-framework/git-isomorphic` lazily. | epic D4, D7 | G2, G6 |
| `GitRepositoryInterface.listFiles(ref?)`: the files of the tree at `ref`, `HEAD` when absent. | D7 | G2 |
| The diff returns, per collection, rows added, removed and changed (paired by uuid); an Entity change lists its `mlSchema.definition` attributes added, removed and changed by name, and its other changed fields; any other change lists its changed top-level fields. A rename is not inferred. | D8 | G3 |
| The replay applies, in order, the Actions of the `commit` records after a marker: a model Action through `ModelEntityActionTransformer` into instance Actions, an instance Action onto the collection of its `parentUuid`. A `complete: false` record replays the Actions it holds. | D9, epic D12 | G2 |

## Allocated keys (part B)

| Element | Key |
|---|---|
| One list | `metaModelCollections` in `packages/miroir-core/src/1_core/Model.ts` |
| Package functions | `liveModelState`, `frozenModelState`, `gitModelState`, `diffModelStates`, `replayEvolutionTraceRecords` in `packages/miroir-versioning/src/modelStates.ts` |
| vitest files | `packages/miroir-core/tests/1_core/metaModelCollections.unit.test.ts`; `packages/miroir-versioning/tests/modelStateDiff.unit.test.ts`; `packages/miroir-standalone-app/tests/3_controllers/versioning/modelStates.integ.test.ts`, `modelStatesGit.integ.test.ts` |
| Nonreg step | `integ-708-model-states` (scopes `actions`, `external`) |

Why vitest: no ML action exposes a model state or a diff yet (part C adds the first user), and the tests compare whole in-memory models and read a Git repository at a ref.

## Slice B0 — Characterize: the collections `MetaModel` lacks, and what a freeze loses

**Status:** ✅ DONE

**Goal:** lock today's gaps so Slices B1 and B3 close them visibly.

**RED / characterization:**
- `metaModelCollections.unit.test.ts`: lists the Entities of `miroir-app-miroir/assets/miroir_model/16dbfe28-…/` whose rows go to `model` or `modelVersion`, and the keys of the generated `metaModel` schema. Today it records the missing ones (Blob, TestConfiguration, their `*Version` and Cross Entities, ApplicationModelBranch, EvolutionTraceRecord) as the expected gap list. Test and its two history Entities are listed as excluded, pending their retirement (#726).
- `modelStates.integ.test.ts`, "a freeze loses fields": freeze appForTest, read its `ReportVersion` rows, and record the fields of the live Report that the version lacks.

**GREEN:** none (characterization).

**Refactor checkpoint:** none.

**Validation:**
```bash
RUN_TEST=metaModelCollections npm run testByFile -w @miroir-framework/core -- metaModelCollections
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/modelStates
```

### Realization

- `metaModelCollections.unit.test.ts` (core): the expected collection of every Entity of Library's `model` and `modelVersion` sections, by Entity name; 8 have none today (ApplicationModelBranch, Blob, BlobVersion, ApplicationVersionCrossBlobVersion, TestConfiguration, TestConfigurationVersion, ApplicationVersionCrossTestConfigurationVersion, EvolutionTraceRecord). Excluded: the `devData` Entities, `Commit` (Miroir's transaction log: its rows are in Miroir's data only, and `PersistenceStoreController` already skips it for other applications) and Test with its two history Entities (#726). `Commit` is an exclusion the plan did not name.
- Deviation: what a freeze loses is characterized by `freezeSnapshotFields.unit.test.ts` (versioning package), on the real rows of Library's model and Miroir's data, instead of an integration test on appForTest, whose model holds no Report, Query or MiroirTest. Dropped today: Query `parameters`; Report and Theme `selfApplication`; MiroirTest `branch`, `selfApplication`; TransformerDefinition `presentation`, with `classification`, `runnableAsSql` and the interface and implementation moved under `definition`.

## Slice B1 — `MetaModel` has a collection for every Entity of the meta-application

**Status:** ✅ DONE

**Goal:** the local cache's model of Miroir holds its Blob and TestConfiguration rows; every builder of a `MetaModel` fills every collection.

**RED:** the B0 guard now expects no gap. `modelStates.integ`, "the cached model of Miroir has its Blobs": `domainController.currentModel(MIROIR)` holds the Blob rows of Miroir's data section.

**GREEN:**
- Generated types for Blob and TestConfiguration; the `metaModel` schema (`getMiroirFundamentalMlSchema.ts`) gains the collections, named after their Entities; `tests` stays as it is (Q-B2).
- `metaModelCollections` is the one list; `versionHistoryEntityUuids`, `versionHistoryEntityDefinitions`, `emptyMetaModel`, `emptyApplicationModel` and `extractApplicationModel` derive from it.
- The local cache selectors (redux, zustand) fill every collection; the default models (Miroir, Library, GitHub, Spotify, appForTest), the bundle copy (`TransformersForRuntime.ts`), the two MiroirTest assets with an inline `metaModel`, and the tests follow.
- `npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core`.

**Refactor checkpoint:** retire the legacy import names `entityEndpointVersion` and `entityQueryVersion` where the one list replaces them.

**Validation:**
```bash
npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core
npm run build -w miroir-localcache-redux -w miroir-localcache-zustand -w @miroir-framework/versioning
npm run test -w @miroir-framework/core -- ''
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json   # and every touched package
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,localcache,ui
```

### Realization

- `metaModelEntityList` (core `1_core/Model.ts`) is the one list: per Entity of the meta-application, its section and its `MetaModel` collection. `metaModelCollections` filters it; `buildMetaModelCollections`, `readMetaModelCollections` and `emptyMetaModelCollections` build a model's collections from it. `versionHistoryEntityUuids` and the devData definitions, `emptyMetaModel`, `emptyApplicationModel`, `resolveMetaModelPartial`, `extractApplicationModel` and the server's `metaModelFromPersistenceStore` derive from it.
- The `metaModel` schema gains `applicationModelBranches`, `blobs`, `blobVersions`, `applicationVersionCrossBlobVersion`, `testConfigurations`, `testConfigurationVersions`, `applicationVersionCrossTestConfigurationVersion` and `evolutionTraceRecords`.
- Local caches (redux, zustand): `currentModel` and `selectModelForDeploymentFromReduxState` read every collection of the list from `getApplicationSection`, one memoized selector per collection; 13 hand-written selectors and two copies of the section logic are gone. Change of behavior: the cached model now holds the history collections and `applicationVersions` from `modelVersion` (they were read from `model`, or left empty by the selector).
- Default models (Miroir, Library, GitHub, Spotify, appForTest) have the new collections: their branch, Miroir's logo Blob, everything else empty. TestConfiguration rows stay out of the static models: Miroir's only one seeds Library Entities. The `listSelfApplicationUuidPaths` snapshot gains `applicationModelBranches.*.selfApplication`.
- `modelValidationSuite` finds each Entity's collection in the list (the hand map `defaultMiroirMetaModelEntityNameToAttributeName`, stale for SelfApplication, SelfApplicationVersion, Query and TransformerDefinition, is gone) and validates against the live Entity's `mlSchema` (the frozen SelfApplication EntityVersion has no `versioningMode`; Blob has no EntityVersion).
- Deviation from RED: Blob rows are not loaded on refresh (`cacheAllInstancesOnRefresh: false`), so `modelStates.integ` checks the cached Miroir branch and TestConfiguration instead; B2's live state reads Blobs from the store. The test loads Miroir with a `rollback` first: the versioning test context loads only admin.
- No change was needed in `TransformersForRuntime.ts` (it spreads the bundle) or in the MiroirTest assets (`d7e9f81b-…` holds query extractors, not a `metaModel`).
- Problem met: `@miroir-framework/react` bundles the local caches (`noExternal`), so it must be rebuilt after them before standalone-app tests see the change.
- Refactor checkpoint: the local caches no longer import `entityEndpointVersion` and `entityQueryVersion`; their 45 other uses stay for now.

## Slice B2 — Tracer: the live model state

**Status:** ✅ DONE

**Goal:** `liveModelState(appForTest)` returns its model, every collection filled from its `model` section (and `modelVersion` for the history collections).

**RED:** `modelStates.integ`, "live": after a commit that adds an Entity to appForTest, `liveModelState` holds it, and its collections equal the rows stored in appForTest's sections.

**GREEN:** `modelStates.ts` in the package, reading sections through `DomainControllerActionHost.readSectionInstances` (#696), one read per collection of the one list.

**Refactor checkpoint:** `extractApplicationModel` (core) and `liveModelState` share the reading by collection, or one calls the other.

**Validation:**
```bash
npm run build -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/modelStates
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization

- `liveModelState(host, application, applicationDeploymentMap)` in `miroir-versioning/src/modelStates.ts`: one `readSectionInstances` per collection of `metaModelCollections`, in the section `getApplicationSection` gives; a failed read returns an `Action2Error`. `ModelState` is `MetaModel`: one shape for every source.
- Refactor checkpoint: `liveModelState`, `extractApplicationModel` and the server's `metaModelFromPersistenceStore` all go through `buildMetaModelCollections`; they differ only in how a section is read (the action host here, a store controller there).
- `modelStates.integ` B2 runs on the client DomainController, so the reads go through the emulated server.
- Scoped nonreg of B1 (`smoke,core,actions,localcache,ui`): 94 passed, 2 failed. `unit-649-core-public-api`: the new exports were marked `@public`; the marks are removed (monorepo API, not the supported set). `unit-643-package-manifests`: the #652 guard expects the redux local cache's dist to import `@miroir-framework/core/admin`, and B1 removed that import (the Miroir deployment check); its only core subpath import is now `@miroir-framework/core/meta-model`. The guard change waits for the designer.

## Slice B3 — The model at a frozen version equals the model that was frozen

**Status:** ✅ DONE

**Goal:** freeze appForTest, change it, then `frozenModelState(appForTest, version)` equals the live state taken just before the change.

**RED:** `modelStates.integ`, "frozen round trip", on appForTest and on Library (traces off). Fails on the fields B0 recorded as lost.

**GREEN:** every snapshot copies all fields but the identity ones, as `snapshotInstancesAsVersions` does (#706), and the twelve per-type snapshot functions collapse into it. `frozenModelState` reads the Cross rows of the version and maps each `*Version` row back to its live row (`<type>Uuid` → `uuid`). Versions frozen before this slice read back with the fields they kept.

**Refactor checkpoint:** remove the per-type `Stored…ForFreeze` and `…VersionSnapshot` types the generic snapshot replaces.

**Validation:**
```bash
npm run test -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --mode integ --suites action.domainController.freezeApplicationVersion
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,runners
```

### Realization

- `snapshotRowsAsVersions(rows, type)` is the one snapshot: every attribute but `FREEZE_IDENTITY_ATTRIBUTES` (uuid, parentUuid, parentName, parentDefinitionVersionUuid, conceptLevel), plus the attribute naming the live row. Each element type is a `VersionedElementType` value (version Entity, live uuid attribute, required attributes, which keep the "Cannot snapshot … is missing" guards). The 13 `snapshot…AsHistorical…Versions` functions are one-line wrappers; the Entity one also keeps `conceptLevel`, which EntityVersion holds. The per-type `Stored…ForFreeze` types are gone (the freeze inputs are typed by `MetaModel` collections); the `…VersionSnapshot` names stay as aliases of `InstanceVersionSnapshot`.
- The Version Entities' schemas gain the live attributes they lacked, copied from the live Entity and optional: QueryVersion `parameters`; ReportVersion `selfApplication`; ThemeVersion `selfApplication`, `author`, `storageAccess`; MiroirTestVersion `selfApplication`, `branch`; EntityVersion `selfApplication`, `author`, `scope`, `storageAccess`, `logicalDataModel`; TransformerDefinitionVersion the five top-level attributes, with `definition` now optional (held only by versions frozen before). Generated types regenerated (`devBuild`).
- `frozenModelState(host, application, map, applicationVersion)`: reads the live model, follows the version's Cross rows to its version rows and maps each back to its live row (`<type>Uuid` → `uuid`, the live Entity's uuid and name as parent). A TransformerDefinitionVersion frozen before this slice is read back from its `definition` body. The application, its branches and the Application Version come from the live model; the other history collections are empty.
- What a freeze still does not keep: `parentDefinitionVersionUuid`, and `conceptLevel` on rows other than Entities. The round-trip test leaves them out, with the meta-model Entities an application's model holds (a freeze snapshots only the application's own Entities, `selectEntitiesToFreeze`).
- Deviation: the round trip runs on appForTest only. Library is unversioned (designer's choice, 2026-11-15), so it cannot be frozen.
- After review (PR #727): the version types of the fundamental schema (`queryVersion` … `miroirTestVersion`) are now generated from the live Version Entities rather than from their EntityVersion rows, which lacked the attributes B3 added; `freezeSnapshotFields.unit` checks that every snapshot of the real rows is an instance of its version type. The static Miroir model keeps its `blobs` collection empty: listing the logo Blob put its 400 kB of base64 in every client bundle.
- Note for PostgreSQL deployments: the new Version attributes are new columns; an existing database needs them added before a freeze writes them.

## Slice B4 — The model at a Git ref

**Status:** ✅ DONE

**Goal:** `gitModelState(application, ref)` reads the model files at a commit, without a checkout.

**RED:** `modelStatesGit.integ`: in a temporary repository holding appForTest's `*_model/` files, commit, change a Report file and commit again; `gitModelState(appForTest, firstCommit)` gives the first Report, and the working tree is unchanged.

**GREEN:** `listFiles(ref?)` on `GitRepositoryInterface` and in `miroir-git-isomorphic`; `gitModelState` groups the files by Entity folder, through the one list.

**Refactor checkpoint:** none expected.

**Validation:**
```bash
npm run build -w @miroir-framework/git-isomorphic -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/modelStatesGit
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,external
```

### Realization

- `GitRepositoryInterface.listFiles(ref?)`: the files of the commit `ref` points at (HEAD by default); `miroir-git-isomorphic` resolves the ref to its commit first, as `readFile` does, so a tag works too.
- `gitModelState(repository, application, sectionFolders, ref)`: per collection of the one list, the JSON files of `<section folder>/<Entity uuid>/` at `ref`, read with `readFile(path, ref)`; a section without a folder reads as empty. The caller names the section folders (`appForTest_model`), as a deployment's store configuration does.
- Deviation: appForTest has no Report, so the test changes its Publisher Entity: at the first commit the model holds the first description, at HEAD the second, and the work tree keeps a third. The test builds its repository in a temporary folder from the fixture's asset files, without a DomainController.
- After review (PR #727): `gitModelState` resolves `ref` to one commit first (`log({ ref, depth: 1 })`) and lists and reads at that commit, so a ref moved during the read does not mix two commits.

## Slice B5 — The diff of two model states

**Status:** ✅ DONE

**Goal:** `diffModelStates(a, b)` lists, per collection, rows added, removed and changed, with Entity attributes by name.

**RED:**
- `modelStateDiff.unit.test.ts`, on real assets (Library's model): an attribute added to `Book`, a Report renamed, a Blob removed, a MiroirTest changed; one assertion per case.
- `modelStates.integ`, "diff": the frozen state of appForTest against its live state after an `alterEntityAttribute`.

**GREEN:** `diffModelStates` over the one list; the freeze plan uses it in place of `diffEntityVersionSnapshots`, which is removed with its test file's cases moved over.

**Refactor checkpoint:** the freeze's "model CUD migration candidates" read from the new diff.

**Validation:**
```bash
npm run test -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/modelStates
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,runners
```

### Realization

- `modelStateDiff.ts`: `diffModelStates(previous, next)` matches rows by uuid in each collection of the `model` section and gives, per collection that differs, the rows added, removed and changed (with the attributes that differ); `entityAttributes` names the `mlSchema` attributes added, removed and changed per Entity. Not compared: `uuid`, `parentUuid`, `parentName`, `parentDefinitionVersionUuid`, and `conceptLevel` but on Entities (what a frozen row does not keep). Values compare as canonical JSON (key order, absent and null alike), as before.
- `modelCudMigrationCandidates(diff)` gives the freeze's `modelCUDMigration` from the diff's Entities, in the order `diffEntityVersionSnapshots` used; the freeze diffs the Entities its two sets of EntityVersions were minted from. `diffEntityVersionSnapshots` is removed; its test cases run on the new pair, and the core surface guard names `diffModelStates`.
- Deviation: the integration case adds the attribute with an `updateInstance` of the Entity row, as the freeze tracer of #216 does, rather than an `alterEntityAttribute` Action.

## Slice B6 — The replay of trace records

**Status:** ✅ DONE

**Goal:** the frozen state at the last marker, replayed with the `commit` records since it, gives the live state.

**RED:** `modelStates.integ`, "replay gives the live model": appForTest with traces on, freeze (marker), then three commits (an Entity-row update, a `createEntity` with an instance write, a Report update); `replayEvolutionTraceRecords(frozenModelState(v1), records)` deep-equals `liveModelState`. A second case: a `complete: false` record replays its Actions only.

**GREEN:** `replayEvolutionTraceRecords` in `modelStates.ts`, with `ModelEntityActionTransformer` for model Actions.

**Refactor checkpoint:** if the local cache already applies instance Actions to an in-memory collection, reuse that function.

**Validation:**
```bash
npm run build -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/modelStates
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization

- `replayEvolutionTraceRecords(state, records)` in `modelStates.ts`: the `commit` records of the state's application after the last `version` marker naming the state's one Application Version, in sequence order. A model Action goes through `ModelEntityActionTransformer.modelActionToInstanceAction` against the state being replayed; an instance write upserts or deletes each object in the collection of its Entity, when the write is to the section that Entity's rows belong to (rows of other Entities are not in a model state). An `Action2Error` when the chain has no marker for the version, restarts (`rebaseline`) after it, or a model Action cannot be replayed.
- `modelStateReplay.unit` (Library assets): the records before the marker are left out, the order is the sequence number's, the four model Actions and an update replay; a `complete: false` record replays its delete; a missing marker and a later `rebaseline` are refused. The asset reader moved to `tests/modelStateAssets.ts`, shared with `modelStateDiff.unit`.
- `modelStates.integ` B6: appForTest with traces on, freeze, then a direct update of the Publisher Entity row, a commit of a `createEntity` and a model instance write, and a direct update; the frozen state replayed with the stored records equals the live state on the snapshotted collections.
- Deviations: appForTest's model has no Report store, so the commit writes and then updates an Endpoint row instead of a Report. The `complete: false` case is a unit case: a commit that stops part way cannot be made on purpose in the integration test.
- Refactor checkpoint: the local caches apply instance Actions to Redux / Zustand zones (`applyEntityInstancesToZone`), not to arrays; nothing to reuse.
- An update replaces the whole row, as every store does on `updateInstance` (the persistence controller upserts the object it is given); the live model state reads the stores, so the replay follows them rather than the local cache's field merge.

## Slice B7 — Docs, nonreg step, full nonreg, AC checklist

**Status:** ✅ DONE

- `docs/reference/versioning.md`: a "Model states" section (the three sources, the diff, the replay); `MetaModel` collections where the docs list them.
- `scripts/nonreg-manifest.json`: step `integ-708-model-states` running `3_controllers/versioning/modelStates*`.
- Full `npm run nonreg:filesystem -- --runner shared`; bundle guards.
- Tracer narrative: freeze Library, add an attribute to `Book` and commit, then read the frozen and live states and diff them; automated as `modelStates.integ` "diff".

AC checklist (part B items of #708):

| #708 scope item | Proving test |
|---|---|
| `ModelStateSource`: frozen rows, `*_model/` files at a Git ref without a checkout, or the live model, in one shape covering every snapshotted type | `modelStates.integ` live, frozen round trip; `modelStatesGit.integ` |
| Trace replay | `modelStates.integ` B6 (replay gives the live model), `modelStateReplay.unit` |
| An attribute-level diff over all element types, replacing `diffEntityVersionSnapshots` | `modelStateDiff.unit`, `modelStates.integ` B5 (diff) |

### Realization

- `docs/reference/versioning.md`: a "Model states" section (the three sources, what a frozen state does not hold, the diff, the replay), a key point linking to it; the freeze section names `modelCudMigrationCandidates` instead of `diffEntityVersionSnapshots`, and the snapshot paragraph no longer says that the MetaModel lacks Blobs and TestConfigurations. No other doc lists the MetaModel collections.
- `scripts/nonreg-manifest.json`: step `integ-708-model-states` (scope `actions`) runs `3_controllers/versioning/modelStates` (B1 to B6 and the Git case).
- Full `nonreg:filesystem --runner shared`: every step passed but two. `unit-301-agent-tooling` failed on the #652 redux guard, which the designer agreed to widen to any core subpath (it passes since). `integ-runner.freezeApplicationVersion` failed once (the admin store had no Entity in `data` when the runner created appForTest's admin row); it passed in every scoped run of this branch and twice on its own after, also behind `integ-tr.core` as in the full run.
- Tracer narrative: freeze appForTest, add an attribute to an Entity, read the frozen and live states and diff them (`modelStates.integ` B5); then freeze with traces on, commit, and replay the records on the frozen state (`modelStates.integ` B6). Library stays unversioned (designer's decision), so the tracer runs on appForTest.
- No issue-scoped test directory was created: the suites are feature-named (`modelStates*`, `modelStateDiff`, `modelStateReplay`).

---

# Part D — `gitAction_tag`

> Integration first, no mocks. The tests run the `gitAction_*` actions through a real DomainController on the Library copy of `test-filesystem`, in a real Git repository, and push to a Git remote served over HTTP by the test process (`tests/3_controllers/git/gitHttpServer.ts`), as the #679 tests do. The applicative interface locked first is the Git Endpoint's new action `gitAction_tag` and its payload.

**Resume note:** planned 2026-11-15, after part B merged (PR #727). Part D goes first (analysis D1: B and D in either order, then C), in its own PR. Branch `claude/project-thread-tyot7n`.

## Scope (part D)

In:
- G5, tag a version in Git: `gitAction_tag { application, name, message?, ref?, author? }` creates an annotated tag at `HEAD` (or `ref`), named exactly as given (analysis D11), refused when the name exists.
- `gitAction_push` also pushes, one by one, each tag that points at a commit of the pushed branch; a tag the remote refuses is reported, and the branch push stands.
- The Git page offers a tag next to the commit.

Out:
- Naming rules tying a tag to a version name of `versioned-internal` (a `versioned-git` application has no frozen version; the tag name is the version name).
- Deleting or moving a tag, and fetching tags (a fetch already brings the tags isomorphic-git fetches by default).

## Progress summary (part D)

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| D1 | Tracer: `gitAction_tag` creates an annotated tag | ✅ DONE | `gitTag.integ` |
| D2 | `gitAction_push` pushes the tags of the pushed branch | ✅ DONE | `gitSync.integ` (tags) |
| D3 | The Git page tags a commit | ✅ DONE | `ui.gitPage` (3 leaves) |
| D4 | Docs, nonreg, PR | ✅ DONE | `nonreg:filesystem` |

## Locked implementation defaults (part D)

| Default | From | Serves |
|---|---|---|
| An annotated tag, named exactly after the version, no `v` prefix; `message` defaults to the name | analysis D11, epic D3 | G5 |
| The tagger is the commit author of `gitAction_commit` (the logged-in user, else `user.name` / `user.email`); without one the tag is refused (`authorUnknown`) | `commitAuthor` in `GitActions.ts` | G5 |
| Refusals are `gitActionError` reasons: `invalidPayload` (empty or invalid name), `tagExists`, `unknownRevision` (a `ref` that names no commit) | `GitAction.ts` | G5 |
| A push sends the branch first (by its full ref `refs/heads/<branch>`), then each tag whose commit the branch reaches and that the remote lacks (one `listServerRefs`, then one `git.push` per tag: isomorphic-git pushes one ref per call); a tag the remote has on another object, or refuses, is listed in the result as `rejectedTags`, the branch push stands | analysis D11, review | G5 |
| A tag name that is a local branch's name is refused (`invalidPayload`): isomorphic-git expands a short name to `refs/tags/<name>` before `refs/heads/<name>` | review | G5 |

## Allocated keys (part D)

- Test file `tests/3_controllers/git/gitTag.integ.test.ts` (standalone app), covered by the nonreg step `integ-git-version-control` (`3_controllers/git/`).
- Git action type `gitAction_tag`, implementation `handleAction_gitAction_tag`.

## Slice D1 — Tracer: `gitAction_tag` creates an annotated tag

**Status:** ✅ DONE

**Goal:** a designer tags `HEAD` (or a commit) with a version name; `gitAction_log` shows the tag on that commit.

**RED:** `gitTag.integ`: on the Library copy, after a commit, `gitAction_tag { name: "1.0.0", message }` returns the tag and its commit; `gitAction_log` shows `tag: 1.0.0` on `HEAD`; `git cat-file -t 1.0.0` (Git CLI, when present) says `tag` (annotated). A second tag with the same name is refused (`tagExists`); an empty name is refused (`invalidPayload`); a `ref` that names no commit is refused (`unknownRevision`); a `ref` naming the first commit tags it.

**GREEN:**
- Git Endpoint (`a7f243cb…`): the action `gitAction_tag` and its payload schema; `GitAction.ts`: the type and `GIT_ACTION_TYPES`, `GIT_ACTIONS_KEEPING_FILES`.
- `GitRepositoryInterface.createTag(name, { message, tagger, ref? })`; `miroir-git-isomorphic`: `git.annotatedTag`, refusing an existing name with a repository error the action maps to `tagExists`.
- `GitActions.ts`: the handler; the tagger from `commitAuthor`.
- The palette MiroirTest (`fn.blockModel`) lists the new Git action.

**Refactor checkpoint:** `commitAuthor` takes the payload's author, not the commit action, so the commit and the tag share it.

**Validation:**
```bash
npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core
npm run build -w @miroir-framework/git-isomorphic
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/git/gitTag
npm run testMiroir -w @miroir-framework/core -- --suites fn.blockModel --mode unit
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,external
```


### Realization

- As planned. `GitRepositoryInterface.createTag(name, { message, tagger, ref? })` returns the commit it tagged; the adapter checks the name against the rules of `git check-ref-format` (isomorphic-git checks branch names only) and refuses a branch's name (review finding 6). Repository error code `tagExists`, action reason `tagExists`; an invalid name is `invalidRefName`, mapped to `invalidPayload`.
- The payload also takes `author`, as `gitAction_commit` does; `commitAuthor(payloadAuthor, repository, principal)` serves both. `GitTagResult = { name, commit, tagger }`.
- The Endpoint JSON, the `fn.blockModel` palette list and `ActionImplementations.unit` list the action. The generated types do not list Git actions: `npm run build` of core was enough, no `devBuild`.

## Slice D2 — `gitAction_push` pushes the tags of the pushed branch

**Status:** ✅ DONE

**RED:** `gitSync.integ`, "push sends the tags of the branch": tag `HEAD` and push; the remote has the tag on the same commit (`git ls-remote --tags`). A tag on a commit of another branch is not pushed. A tag the remote already has on another commit is listed in `rejectedTags`, and the branch is pushed.

**GREEN:** `GitRepositoryInterface.push` returns `{ rejectedTags }`; `miroir-git-isomorphic` pushes each tag whose commit the branch reaches (`git.isDescendent` or equal) with its own `git.push`, collecting refusals; `GitActions.ts` adds `rejectedTags` to the push result.

**Validation:**
```bash
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/git/gitSync
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,external
```


### Realization

- `push` returns `GitPushOutcome { pushedTags, rejectedTags }`; `gitAction_push` returns `GitPushResult = GitRemoteResult & GitPushOutcome`.
- Deviation: the adapter lists the remote's tags once (`git.listServerRefs`, receive-pack, protocol 1) and pushes only the tags the remote lacks; a tag the remote has on another object is reported without a push. A failure to list them reports every candidate tag as refused, and the branch push stands.
- The branch is pushed by its full ref (review finding 6).
- `gitSync.integ`: two new cases, the tags of the branch pushed and not those of a side branch nor a tag already there; a tag the remote has on another commit reported while the branch is pushed. The whole `3_controllers/git/` folder passes (160 tests).

## Slice D3 — The Git page tags a commit

**Status:** ✅ DONE

**RED:** the Git page component MiroirTest (the one driving `gitPageForTest.tsx`): typing a tag name and pressing **Tag** sends `gitAction_tag` with that name, and the history shows the tag; a refusal shows its message.

**GREEN:** `GitWritePanels.tsx`: a tag field and button next to the commit; `gitPageForTest.tsx` answers `gitAction_tag`.

**Validation:**
```bash
npm run build -w @miroir-framework/react
npm run testMiroir -w miroir-standalone-app -- --suites <Git page suite> --mode unit
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,actions
```


### Realization

- The tag field and **Tag the last commit** sit under the commit form (`GitWritePanels.tsx`): a refusal shows its reason (`tagExists` worded), `authorUnknown` opens the commit form's author fields, which the tag then uses. The header (`GitHeader.tsx`) shows the tags a push sent or the remote refused (`git-push-tags`, `data-rejected`). No `useEffect`.
- `gitPageForTest.tsx` answers `gitAction_tag` and reports pushed and refused tags (`remoteTagConflicts`). `ui.gitPage`: 3 leaves (tag then push, existing name, refused tag); `miroir-component-tests.unit` counts 262 leaves.

## Slice D4 — Docs, nonreg, PR

**Status:** ✅ DONE

- The Git page and Git action docs name `gitAction_tag` and the tags a push sends; `docs/reference/versioning.md` says a `versioned-git` version is a tag made with it.
- Full `npm run nonreg:filesystem -- --runner shared`, pre-push gate, PR "Part of #708".


### Realization

- `docs/guides/version-control-with-git.md` ("Tagging a version"), `docs/reference/versioning.md` (a `versioned-git` version is a tag). Existing nonreg step `integ-git-version-control` covers the new tests.

---

# Part C — Agreement check and re-baseline

> Integration first, no mocks. The tests freeze appForTest through a real client DomainController and its emulated server on `test-filesystem`, with traces on, and commit from the Git page on the Library copy in a real Git repository. The applicative interfaces locked first are the ModelEndpoint action `rebaselineEvolutionTraces` and the refusal: `reason: "evolutionTracesDisagree"` with the differences (a model state diff, part B).

**Resume note:** planned 2026-11-15; starts when part D is merged. #708 closes with part C.

## Scope (part C)

In:
- G4, trust a version: with traces on, a freeze (`versioned-internal`) is refused when the version of the last marker, replayed with the `commit` records since it, does not give the live model; a commit from the Git page (`versioned-git`) is refused when the model at `HEAD`, replayed with the staged records added since `HEAD`, does not give the staged model files (analysis D9). The refusal lists the differences.
- A fork (two records with the same `previousTrace`) fails the check.
- `rebaselineEvolutionTraces { application, versionName? }`: for `versioned-internal`, a freeze that skips the check, then a `rebaseline` marker naming that version; for `versioned-git`, a `rebaseline` marker naming the commit at `HEAD`, left in the work tree to be committed with the model (analysis D10).

Out:
- Migrations generated from the records (#9).
- A dedicated UI for the differences: the freeze Runner and the Git page show the refusal's message, which lists them.

## Locked implementation defaults (part C)

| Default | From | Serves |
|---|---|---|
| The check starts at the last marker that names a version (`version`, or `rebaseline` with `version`); a `rebaseline` without one (written by `resetModel` or `initModel`) restarts the chain from an unknown state, so there is nothing to check until the next freeze, as before the first marker | analysis D9, part A Slice 5 | G4 |
| The comparison is `diffModelStates` (part B) over the model collections, leaving out the meta-model Entities an application's model holds (the freeze and the record writer create them without a record) | part B | G4 |
| The refusal: `Action2Error("FailedToHandleAction", …, { reason: "evolutionTracesDisagree", differences })` for the freeze; `gitActionError("evolutionTracesDisagree", …, { differences })` for the Git commit | `GitAction.ts`, part B | G4 |
| The Git commit check runs in the persistence process through an internal versioning action (`checkStagedEvolutionTraces`), only for a `versioned-git` application with traces on; with the capability off it is refused (`FeatureUnavailable`), as a model commit is | analysis D5, D9 | G4, G6 |
| The staged tree is read through two new `GitRepositoryInterface` methods (`listStagedFiles`, `readStagedFile`); `gitModelState` reads any tree through one reader | analysis D9 | G4 |
| A `rebaseline` marker among the staged records since `HEAD` makes the Git commit check pass: the designer said the staged model is the new start | analysis D10 | G4 |

## Slices (part C)

| Slice | Title | Primary proof |
|---|---|---|
| C1 | Tracer: a freeze is refused when the traces disagree, and lists the differences | `evolutionTraceAgreement.integ` |
| C2 | A fork fails the check; a marker without a version restarts it | `evolutionTraceAgreement.integ`, `modelStateReplay.unit` |
| C3 | `rebaselineEvolutionTraces` for `versioned-internal` | `evolutionTraceAgreement.integ` |
| C4 | The Git commit check (`versioned-git`) | `gitTraceAgreement.integ` |
| C5 | `rebaselineEvolutionTraces` for `versioned-git` | `gitTraceAgreement.integ` |
| C6 | Docs, nonreg step, full nonreg, AC checklist, acceptance check on #708 | `nonreg:filesystem` |

Each slice gets its RED / GREEN / Validation block when part D is merged and part C starts, from what part D leaves in the Git actions.

### Review findings to settle when part C starts (cold review, 2026-11-15)

| # | Finding | Planned answer |
|---|---|---|
| R1 | Turning traces on is not recorded (the switch is read before the write), so the first check after traces go on compares a chain that misses the changes made while they were off: a `versioned-internal` freeze after off-then-on, or the first Git commit after on (`HEAD` with traces off, or no `HEAD`), is refused | Turning traces on appends a `rebaseline` marker without a version (nothing to check until the next freeze); the Git check passes when `HEAD` is missing or its SelfApplication has traces off. Cases in C2 and C4 |
| R2 | Records the client still holds (`sendKeptRecordsBeforeFreeze`) are sent only before a freeze | Also before `gitAction_commit` (client side, before forwarding) and before `rebaselineEvolutionTraces` |
| R3 | Places C must change that the plan does not name: `GitActionContext` (no way to call versioning), `handleGitAction`'s capability checks, `SERVER_ROUTED_MIROIR_ACTION_TYPES`, `MODEL_ACTIONS_ROUTED_TO_SERVER`, `VERSIONING_ACTION_IMPLEMENTATION_NAMES`, ModelEndpoint JSON + `devBuild`, `ActionImplementations.unit` | Listed in the GREEN of C3 / C4; the check is a callback of `GitActionContext` set by the DomainController, which runs the versioning implementation (no new public action) |
| R4 | The freeze appends its own `version` marker: a rebaseline wrapping it would write two; a "skip the check" payload flag would let anyone skip it; markers hold the SelfApplicationVersion uuid, not a name; replay refuses any `rebaseline` after the marker | The rebaseline calls the freeze internally with the check off and replaces its marker by a `rebaseline` one naming the version uuid; no payload flag; wording "version uuid"; `versionName` required for `versioned-internal`; C2 changes the replay rule |
| R5 | The freeze plans from the local cache in `local` mode, the check reads the store | Compare against the rows the freeze plans, or refuse a freeze while the application has pending changes; decide in C1 |
| R7 | `conceptLevel`: a frozen Entity gets `"Model"` when the live one has none | Normalize in one place before the diff |
| R8 | One list of meta-model Entities | Reuse `selectEntitiesToFreeze` / `metaBootstrapUuids` of `freezeApplicationVersion.ts` |
| R9 | A `modelVersion` folder ignored by `.gitignore`: records never staged, every check refuses | Its own refusal reason |
| R11 | No UI test of the `evolutionTracesDisagree` message on the commit form | `gitCommandErrorText` falls back to the message; one `ui.gitPage` leaf in C4 |

Part D items of the review (R6 tag named like a branch, R10 plan text, R11 `rejectedTags` on the page) are done in D1 to D3.

AC checklist (parts C and D items of #708):

| #708 scope item | Proving test |
|---|---|
| Agreement check at freeze (`versioned-internal`), a mismatch refuses and lists the differences | C1, C2 |
| Agreement check at commit from the Git page (`versioned-git`) | C4 |
| Re-baseline: a freeze plus a marker (`versioned-internal`), a marker committed with the model (`versioned-git`) | C3, C5 |
| `gitAction_tag`: an annotated tag named after the version | D1, D2 |
