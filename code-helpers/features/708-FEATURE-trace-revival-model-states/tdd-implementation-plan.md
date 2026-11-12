# Issue #708 — TDD Implementation Plan (part A: trace records)

> Integration first, no mocks. The tests drive a real client DomainController and its emulated server (`RestClientStub`), with real filesystem stores (`test-filesystem`), and read what the stores hold. The applicative interfaces are locked first: the SelfApplication `evolutionTraces` field, the `EvolutionTraceRecord` Entity, the ModelEndpoint action `appendEvolutionTraceRecord`, and the new Reports.

**Resume note:** part A only (analysis D1). Parts B (model states), D (Git tag) and C (agreement and re-baseline) get their own sections in this file when A is merged. Slices are done in order; each one ends with its Realization.

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
| 6 | A freeze appends a `version` marker | ⬜ pending | `evolutionTraceRecords.integ` freeze case |
| 7 | `versioned-git` | ⬜ pending | `versioningMode.unit`, `evolutionTraceRecords.integ` Git-mode case |
| 8 | The old traces go; new Reports and MiroirTest | ⬜ pending | `action.scenario.evolutionTrace`, `modelValidation`, inventory guard |
| 9 | Docs, nonreg steps, full nonreg, AC checklist | ⬜ pending | `nonreg:filesystem` |

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
| `versioningMode` gains `versioned-git`; `versioned-external` stays in the enum and resolves to `versioned-git`. A G application fetches `modelVersion` only when its traces are on; freeze stays refused for it. | D6 | G1, G5 |

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

**Status:** ⬜ pending

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

## Slice 7 — `versioned-git`

**Status:** ⬜ pending

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

## Slice 8 — The old traces go; new Reports and MiroirTest

**Status:** ⬜ pending

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

## Slice 9 — Docs, nonreg steps, full nonreg, AC checklist

**Status:** ⬜ pending

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
| `versioned-git`, `versioned-external` readable for one release, `evolutionTraces` in both versioned modes, refused (read as off) on `unversioned` | Slices 4 and 7 |
| One record per Miroir commit, ordered resolved Actions, in `modelVersion`, `previousTrace` plus sequence number, no per-branch root | Slices 1 and 2 |
| A writable `modelVersion` for `versioned-git`, committed with the model; `versioning.md` updated | Slices 7 and 9 |
| Capability gate on model commits when traces are on | Slice 4 |
| `MIROIR_EVOLUTION_TRACE` removed | Slice 8 |
| `ModelStateSource`, replay, diff | part B |
| Agreement check, re-baseline | part C |
| `gitAction_tag` | part D |

### Realization
