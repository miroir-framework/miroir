# Issue #696 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController, the emulated server (`RestClientStub`) and the store profiles,
> through the applicative interface: the ModelEndpoint action `freezeApplicationVersion`, the process
> capabilities snapshot, the Endpoint action listings and the five MiroirTests tagged `versioning`.
> No mocks; the only counter is the loader-call count the Git tests already use. The tracer bullet
> proves that a process with versioning off refuses a freeze with `FeatureUnavailable` and loads nothing.
>
> **Execution model:** the user asked for the implementation to follow on the same branch until the
> PR is ready to merge. Each slice ends with its Validation commands; on success its Realization
> summary is appended, its Status flips to ✅ DONE and the slice is committed.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/696
Prerequisite: [`../694-EPIC-safe-application-evolution/`](../694-EPIC-safe-application-evolution/) ✅ (accepted epic decisions)
Working branch: `claude/696-versioning-package-analysis`, for the analysis, this plan and the implementation (one PR against `_integration`).

**Resume note:** plan written 2026-11-08, revised after an adversarial review the same day. The analysis decisions are implemented as recommended; the PR states the two the user has not confirmed (D2's refusal with an open transaction, D9's reworded acceptance criterion).

---

## Scope

- G1 — Run without versioning: a process with `features.versioning: false` never loads `@miroir-framework/versioning`, and a browser talking to a server never fetches it.
- G2 — Keep versioning as it is: freeze and traces behave as before with the capability on; the five `versioning` MiroirTests and their nonreg steps pass.
- G3 — Be told why: versioning actions return `FeatureUnavailable` (capability `versioning`) when off, and the AppBar, Runners, menu, MCP tools, CLI commands and CopilotKit actions do not offer them.
- G4 — Add versioning actions outside core: an action implementation registered from the package, named by its Endpoint definition, with no entry in core's action table.

This plan does **not** add versioning behaviour (#708, #9, #215, #709, #710, #712), give model elements a visibility condition (#712), or move the versioning Entities, Reports, Runner and MiroirTests out of `miroir-app-miroir`.

**PR boundary:** one PR, one commit per slice. CI runs `check_bundle_policy.py` on every PR that touches `packages/`, so the packaging of Slice 7 lands with Slice 3 (the first slice that adds the package to a build); Slice 7 keeps the bundle-size record and the guard's negative check.

**Pre-push gate** (`AGENTS.md`) runs before each push, and at least after Slices 3, 4 and 8.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the versioning surface, trace writers and bundle size | ✅ | `versioningSurface.696.phase0.unit.test.ts`, `traceWriters.696.phase0.integ.test.ts` |
| 1 | Tracer: the `versioning` capability refuses a freeze | ✅ | `versioningCapability.696.phase1.integ.test.ts` |
| 2 | A remote client sends the freeze to the persistence process | ✅ | `versioningServerRouted.696.phase2.integ.test.ts` |
| 3 | The freeze runs from `@miroir-framework/versioning`, loaded on first use | ✅ | `versioningLazyFreeze.696.phase3.integ.test.ts` + the four freeze MiroirTests |
| 4 | Traces run from the package through a lazy recorder | ✅ | `versioningLazyTraces.696.phase4.integ.test.ts` + `action.scenario.evolutionTrace` |
| 5 | Versioning entries and action listings hidden when off | ⬜ | `versioningHidden.696.phase5.unit.test.ts` (UI) + `endpointActionListing.696.phase5.unit.test.ts` (core) |
| 6 | MiroirTests tagged `versioning` skip when off | ⬜ | `miroirTestRequirements.unit.test.ts` (extended) |
| 7 | Bundle size record and guard check | ⬜ | `check_bundle_policy.py` on the three policies + `homePageLoad.unit` + recorded bundle size |
| 8 | Nonreg, docs, cleanup, AC | ⬜ | nonreg step `integ-696-versioning-capability-off` + full nonreg |

---

## Locked implementation defaults

From the analysis decision record (proposed; to be confirmed before Slice 0). Deviations go into the slice's Realization.

| Decision | Choice | Serves |
|---|---|---|
| D1. Which code leaves core, and which stays? | Freeze planning, snapshots and diff; the trace writer, runtime, compaction and definition-version code; the freeze and trace orchestration of `DomainController` leave. Modes, section routing, the action type, the Entity uuids, `evolutionTracePolicy.ts` and `evolutionTraceBaseline.ts` stay. | G1, G2 |
| D2. In which process does a versioning action run? | The persistence process, server-routed; refused while the client has an open Miroir transaction. | G1, G3 |
| D3. How does core run an action implemented outside it? | `registerLazyActionImplementations({ capability, implementationNames, load })` on top of `registerMiroirActionImplementation`; `requiredCapability` on the Endpoint action definition (boolean capabilities only). | G1, G3, G4 |
| D4. What may an outside implementation call? | Existing host methods plus `readSectionInstances`. | G2, G4 |
| D5. How do traces reach the package? | A lazy `EvolutionTraceRecorder`, registered by persistence-side hosts, called after core's cheap checks. | G1, G2 |
| D6. Default of `features.versioning`? | On; vetoed in the sandbox; missing in a server answer reads as on. The fail-closed snapshot says `true`, as `designerTools` does (review finding 8): it is only a UI default, the server refuses anyway, and `false` would hide the freeze Runner in report tests that pass no snapshot. | G2 |
| D7. Capability and mode? | Capability first, then mode. | G3 |
| D8. How are entries hidden? | In code in `@miroir-framework/react`, and `listEndpointActions` filters by `requiredCapability`, until #712. | G3 |
| D9. "A client build does not include the package"? | A process with the capability off never loads it; a browser talking to a server never fetches it; three bundle policies guard it. | G1 |
| D10. MiroirTests tagged `versioning`? | The tag is a requirement checked against the process capabilities. | G2, G3 |

---

## Allocated UUIDs / keys

No new model element: the capability, the Endpoint field and the package are code and schema, not instances.

| Artefact | Value |
|---|---|
| Process capability | `versioning` (`ProcessCapabilities.versioning`, `features.versioning`) |
| Endpoint action definition field | `actionImplementation.requiredCapability` (ML schema of the Endpoint Entity `3d8da4d4-8f76-4bb4-9212-14869d81c00c`) |
| ModelEndpoint action marked | `freezeApplicationVersion` in `7947ae40-eb34-4149-887b-15a9021e714e` |
| Package | folder `packages/miroir-versioning`, name `@miroir-framework/versioning`, private |
| Core helper | `registerLazyActionImplementations` (`3_controllers/ActionImplementations.ts`) |
| Core interface file | `packages/miroir-core/src/1_core/versioning/versioningInterfaces.ts` (action type, payload type, version Entity uuids) |
| Issue test directories | `packages/miroir-core/tests/1_core/issues/696-versioning-package/`, `packages/miroir-standalone-app/tests/3_controllers/issues/696-versioning-package/`, `packages/miroir-standalone-app/tests/4_view/issues/696-versioning-package/` |
| Nonreg step | `integ-696-versioning-capability-off` (scopes `actions`, `external`) |
| Nonreg step | `unit-versioning-package` (scopes `core`, `actions`): the package's own unit tests |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Freeze MiroirTests (integ) | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites action.domainController.freezeApplicationVersion,runner.freezeApplicationVersion --mode integ` |
| Freeze Runner reports (integ) | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.freezeRunner,report.freezeRunner.unversioned --mode integ` |
| Trace scenario (integ) | `MIROIR_EVOLUTION_TRACE=1 npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites action.scenario.evolutionTrace --mode integ` |
| Issue vitest (integ) | `RUN_TEST=<name> npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem <name>` |
| Issue vitest (unit, core) | `RUN_TEST=<name> npm run testByFile -w @miroir-framework/core -- <name>` |
| Package unit tests | `npm run test -w @miroir-framework/versioning -- ''` |
| Schema rebuild (Slice 1) | `npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core` |
| Miroir model validation | `npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` (core, react, versioning, server, server-library, standalone-app-electron) |
| Bundle guards | `npm run build -w <app>` then `python scripts/check_bundle_policy.py <report> <app>/bundle-policy.json` (reports: `miroir-standalone-app/dist/.vite/bundle-report.json`, `miroir-standalone-app-electron/dist/bundle-report.json`, the sandbox with `--no-history`; `docs/internals/code-splitting.md`) |
| Builds before standalone-app tests | the standalone app loads `@miroir-framework/core` (and react, server-library) from `dist`: `npm run build -w @miroir-framework/core` after every core change, and the same for each other package a slice touches |
| Scoped nonreg (per slice) | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg (Slices 3, 5, 8) | `npm run nonreg:filesystem -- --runner shared` |

---

## Slice 0 — Characterize the versioning surface, trace writers and bundle size

**Status:** ✅ DONE

### Goal

Lock what later slices must keep: the names other packages import from core, which DomainController writes trace rows, and the eager bundle size before the move.

### 0.1 RED → GREEN — core's versioning export surface

**Test:** `packages/miroir-core/tests/1_core/issues/696-versioning-package/versioningSurface.696.phase0.unit.test.ts`

Behavior asserted:
- `@miroir-framework/core` exports `resolveVersioningMode`, `getFreezeAvailability`, `isVersioningAppBarItemVisible`, `assertApplicationVersioningEnabled`, `assertVersioningEnabledImmutable`, `versionHistoryEntityUuids`, `getApplicationSection`, `isEvolutionTraceEnabled`, `FREEZE_APPLICATION_VERSION_ACTION_TYPE` and the 24 `*_VERSION_ENTITY_UUID` / `APPLICATION_VERSION_CROSS_*` constants (list generated from the file), each with its current value. These stay through every slice.
- The list of freeze and trace implementation names exported today (`planFreezeApplicationVersion`, `buildFreezeApplicationVersionPlan`, `diffEntityVersionSnapshots`, `snapshot*AsHistorical*`, `produceEvolutionTraceEvent`, `fetchEvolutionHistory`, `buildEvolutionTracePersistenceActions`, …) is recorded; Slice 3 and Slice 4 flip this half to "not exported by core".

### 0.2 RED → GREEN — who writes trace rows

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/696-versioning-package/traceWriters.696.phase0.integ.test.ts` (vitest: it compares the rows written by two DomainControllers of one process, which no MiroirTest can observe)

Behavior asserted, with `MIROIR_EVOLUTION_TRACE=1` and the emulated server:
- one `updateInstance` of a Library model row sent by the client DomainController leaves N trace event rows in Library's model section; the test records N and whether the client, the server or both wrote them (by registering an instance action listener on each DomainController).
- one committed `createEntity` leaves its trace rows; the same split is recorded.
- with traces off, no trace row is written.

These facts decide whether D5's "persistence side only" keeps every row; a difference is reported to the user before Slice 4.

### 0.3 Baseline measurements (no test)

- Run the four freeze nonreg steps and `integ-action.scenario.evolutionTrace`: all green on `emulatedServer-filesystem`.
- Record the eager gzip size of the bundle reports in this slice's Realization (CI's bundle job measures it on the PR; locally only when the build is cheap).

### Validation

```bash
RUN_TEST=versioningSurface.696.phase0 npm run testByFile -w @miroir-framework/core -- versioningSurface.696.phase0
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- traceWriters.696.phase0
npm run nonreg:filesystem -- --runner shared --scope smoke --only integ-action.domainController.freezeApplicationVersion,integ-runner.freezeApplicationVersion,integ-report.freezeRunner,integ-action.scenario.evolutionTrace
```

### Realization

- 0.1: 3 tests green. 24 version and cross constants plus the action type and the 2 trace Entity uuids stay; 23 freeze and trace names are exported today and leave in Slices 3 and 4.
- 0.2: 4 tests green on test-filesystem (emulated server). The Library model holds the trace Entities, appForTest's does not, so traces are characterized on Library and the freeze on appForTest.
  - Traces off: no trace row.
  - `updateInstance` of a Library model row, traces on: the client DomainController writes 3 trace rows, the server DomainController sees 6 (the client's 3 arriving through REST, plus 3 of its own); 4 trace event rows are stored. Both sides record today, so recording on the persistence side only (D5) removes duplicate events.
  - Committed `createEntity`, traces on: client 1, server 1 (the client's row through REST), 1 event stored. Only the client records a commit: the server receives the replayed model actions without recording them. **Slice 4 must make the persistence side record committed model actions**, or the commit loses its trace.
- 0.3: the freeze, freeze Runner, freeze report and trace nonreg steps pass on `emulatedServer-filesystem` (snapshot `test-results/nonreg/20261108T115320Z`, 12/12). Bundle sizes are measured by CI's bundle job on the PR.

---

## Slice 1 — Tracer: the `versioning` capability refuses a freeze

**Status:** ✅ DONE

### Goal

An operator can set `features.versioning: false`, and a freeze in that process returns `FeatureUnavailable` with `errorContext.capability` `versioning`, before any versioning check on the application.

**Layers cut:** Endpoint Entity ML schema and ModelEndpoint JSON → generated `EndpointDefinition` type → `processCapabilities.ts`, `ProcessCapabilitiesHttp.ts` → `DomainController.handleApplicationAction`.

### 1.1 RED

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/696-versioning-package/versioningCapability.696.phase1.integ.test.ts` (vitest: it sets a process capability, which a MiroirTest cannot)

Behavior asserted (emulated server, appForTest, `versioned-internal`; the capability is set on both the client and the server snapshots, since the client DomainController is in remote mode and Slice 2 forwards):
- capability off: `freezeApplicationVersion` returns `FeatureUnavailable`, capability `versioning`; no `SelfApplicationVersion` row is written.
- capability off, application `unversioned`: still `FeatureUnavailable` (capability first, D7).
- capability on: the freeze succeeds as today.
- `getProcessCapabilities` with no `features.versioning` gives `versioning: true`; with `environment: "sandbox"` gives false; `FAIL_CLOSED_PROCESS_CAPABILITIES.versioning` is true (D6, revised); a `/capabilities` answer without the field parses to true. (Unit assertions in `processCapabilities.273.phase1.unit.test.ts` and `processCapabilitiesHttp.273.phase2.integ.test.ts` in core `tests/4_services`, extended.)

Full snapshot literals that gain the field: `processCapabilities.273.phase1`, `createMiroirServerApp.integ`, `environmentBoot.integ`, the `cursorSdk.275` phase 0 and 7 tests.

### 1.2 GREEN

- `ProcessCapabilities.versioning`, `ProcessCapabilityName` gains `versioning`; config key `features.versioning`; sandbox veto; fail-closed value; parse default in `fetchProcessCapabilities`.
- The `features` schema, declared three times in `bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts`, gains `versioning`.
- ML schema: `requiredCapability?: "ai" | "mcp" | "designerTools" | "git" | "storeAdministration" | "versioning"` on the `libraryImplementation` action implementation of the Endpoint Entity schema; ModelEndpoint's `freezeApplicationVersion` gets `"versioning"`. Rebuild `miroir-app-miroir`, regenerate core types.
- `DomainController`: when the action's bundled definition has `requiredCapability`, `assertProcessCapability` before running the implementation, on the client first, then (after Slice 2's forward) on the server.

### 1.3 Refactor checkpoint

- `storeAdministration`'s refusal in `ActionImplementations.ts` (lines 29–36) could use the same field; list it as a follow-up, do not change it here (no new behaviour).

### Validation

**Nonreg scopes:** `smoke,core,actions,external`, because the ML schema and assets (`core`), `DomainController` (`actions`) and process capabilities (`external`) change.

```bash
npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core
npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- versioningCapability.696.phase1
RUN_TEST=processCapabilities npm run testByFile -w @miroir-framework/core -- processCapabilities
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-server-library/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,external
```

### Realization

- `ProcessCapabilities.versioning` (`features.versioning !== false`, off in the sandbox), in the three `features` schemas; fail-closed `true`; `fetchProcessCapabilities` reads a missing field as `true`.
- Endpoint `libraryImplementation.requiredCapability` (enum of the boolean capabilities); ModelEndpoint's `freezeApplicationVersion` requires `versioning`. `DomainController.handleApplicationAction` refuses with `assertProcessCapability` before running a library implementation. In the emulated profile the client checks first; Slice 2 adds the server's check.
- Tests: `versioningCapability.696.phase1.integ` (4), `processCapabilities.273.phase1` (+1 case, literals gain `versioning: true`), `processCapabilitiesHttp.273.phase2` (+1 case). Model validation 197/197; core, server-library, react, Electron typecheck. The scoped nonreg runs with Slice 2's.

---

## Slice 2 — A remote client sends the freeze to the persistence process

**Status:** ✅ DONE

### Goal

A designer's freeze, sent from a client that talks to a server, runs in the server's DomainController, is checked against the server's capability, and is refused while the client has uncommitted model changes.

**Layers cut:** `constants.ts` (server routing) → `DomainController` (client forwarding, open-transaction check) → `RestServer.ts`.

### 2.1 RED

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/696-versioning-package/versioningServerRouted.696.phase2.integ.test.ts` (vitest, emulated server: it gives the client and the server different capability snapshots)

Behavior asserted:
- client snapshot on, server snapshot off: the freeze sent by the client returns `FeatureUnavailable` (`versioning`), and the store holds no new `SelfApplicationVersion` (a stale client cannot bypass the server).
- both on, no pending change: the freeze succeeds and the server's DomainController ran it: the client's instance action listener sees no `SelfApplicationVersion` write (today the client's writes reach the server listener through REST too, so only the client listener discriminates).
- both on, a pending `createEntity` in the client: the freeze returns `InvalidAction` with `errorContext.reason` `openMiroirTransaction`, and nothing is written.
- after a forwarded freeze, the client's local cache shows the new version (the touched deployment is reloaded, as for Git).

### 2.2 GREEN

- `SERVER_ROUTED_MIROIR_ACTION_TYPES` (layer 1, used by both localcaches and the REST clients) gains `freezeApplicationVersion`: a string list, so layer 1 does not look up Endpoint definitions (review finding 3). A test asserts that every bundled action with a `requiredCapability` is in the list.
- In `DomainController`, a non-local controller checks the capability, then an open Miroir transaction (the Git check, generalized beyond `GitAction`), forwards with `forwardServerRoutedAction`, and reloads the touched deployment.
- `restActionHandler`'s server-routed branch passes the server's model environment (`serverModelEnvironments`, #519) for the action's application: until Slice 3 the freeze still goes through `handleModelAction`, which needs one.

### 2.3 Refactor checkpoint

- `SERVER_ROUTED_MIROIR_ACTION_TYPES` keeps its explicit Git list; note whether the Git actions could carry `requiredCapability: "git"` instead (follow-up, not done here).

### Validation

**Nonreg scopes:** `smoke,actions,external`.

```bash
npm run build -w @miroir-framework/core && npm run build -w @miroir-framework/server-library
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- versioningServerRouted.696.phase2
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites action.domainController.freezeApplicationVersion,runner.freezeApplicationVersion --mode integ
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.freezeRunner,report.freezeRunner.unversioned --mode integ
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,external
```

### Realization

- `SERVER_ROUTED_MIROIR_ACTION_TYPES` gains `freezeApplicationVersion`. A remote `DomainController` checks its own capability, then `forwardCapabilityAction`: it refuses with `pendingMiroirChangesError` (extracted from `openMiroirTransactionError` in `GitActions.ts`, same `InvalidAction` / `openMiroirTransaction`) when the open transaction holds changes of the application, forwards, and reloads the application with `reloadTouchedDeployments`.
- `restActionHandler` passes the server's model environment of the application to a server-routed ModelEndpoint action (`MODEL_ACTIONS_ROUTED_TO_SERVER`). The freeze uses the model environment it is given when it is the target deployment's, else the local cache: the server's local cache has no application model.
- Tests: `versioningServerRouted.696.phase2.integ` (4); freeze MiroirTests 12/12 and freeze reports 2/2 on `emulatedServer-filesystem`.
- Scoped nonreg `smoke,core,actions,external` for Slices 1 and 2 (snapshot `20261108T120838Z`): 60/62; the two failures were capability snapshot literals and key lists in the 273 and 275 tests, which now list `versioning` (rerun green).

---

## Slice 3 — The freeze runs from `@miroir-framework/versioning`, loaded on first use

**Status:** ✅ DONE (full nonreg below)

### Goal

The freeze works as before, but its code lives in the package: a process loads it on its first freeze, never before, and core no longer contains it.

**Layers cut:** new package → `ActionImplementations.ts` (lazy helper) → `DomainControllerActionHost` (`readSectionInstances`) → `DomainController` (freeze case and helpers removed) → hosts (`server.ts`, `ipcServerSetup.ts`, `startMiroirClient.ts` emulated server, `startMiroirNode`, `setupMiroirTest`, `DomainControllerIntegrationTestSession`).

### 3.1 RED

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/696-versioning-package/versioningLazyFreeze.696.phase3.integ.test.ts` (vitest: it counts loader calls, as `gitStatus.integ.test.ts` does)

Behavior asserted:
- after session start and a model commit, the versioning loader has run 0 times.
- the first freeze runs it once; a second freeze does not run it again; both freezes write their rows.
- capability off: the freeze is refused and the loader count stays 0.
- capability on, no registration: the refusal names `@miroir-framework/versioning`, not "unknown library implementation". In its own test file, since there is no unregister (review finding 11).

`setupMiroirTest` gains a loader-injection option so the test counts the loader it registers (the Git tests register outside it).

The four freeze MiroirTests (Slice 0.3) stay green: they are the G2 proof.

### 3.2 GREEN

Steps, each green before the next (review finding 12):

1. Move the interface part of `applicationVersionFreeze.ts` (lines 54–147 and the payload type) to `versioningInterfaces.ts`; repoint `index.ts`, including the `versioningMode.ts` re-exports. Slice 0.1 stays green.
2. Create `packages/miroir-versioning` (tsup, ESM, `sideEffects: false`, dependency `@miroir-framework/core` only), modelled on `miroir-git-isomorphic`, plus a vitest config and `test` script (the Git package has none). Add it to `build-all.sh`, the build lists of `pr-checks.yml`, `scripts/published-packages.json` (private), the dependency policy, and now (not in Slice 7) the three bundle policies (`lazy`, `forbiddenEager`), the `Dockerfile`, `build-linux-runnables.yml`, the `build:server` externals, and the `package.json` dependencies of the hosts that import it.
3. `registerLazyActionImplementations` in core; `readSectionInstances` on the host.
4. Move `applicationVersionFreeze.ts` (implementation part) and the freeze case and helpers of `DomainController` into the package as `handleAction_freezeApplicationVersion`, written against the host. Remove `handleAction_freezeApplicationVersion` from core's static table.
5. Register the lazy implementations in each persistence-side host and test setup: `startMiroirNode` covers the server, Electron and the CLI; plus the emulated server of `startMiroirClient`, `setupMiroirTest` and `DomainControllerIntegrationTestSession`.
6. Move the 7 `applicationVersionFreeze.*` unit tests and the freeze part of `applicationVersionFreeze.integ.test.ts` to the package or keep the integ test in the standalone app, importing from the package. Add the package's unit tests to the pre-push gate in `AGENTS.md` and to `pr-checks.yml`.

### 3.3 Refactor checkpoint

- The freeze case builds its `FreezeMetaModelSlice` twice by hand (`DomainController.ts` lines 3150–3239): once moved, extract one builder.
- The 13 hand-written "ensure Entity exists" blocks (lines 2632–3100) become one loop over the history Entities.
- Slice 0.1: flip the freeze names to "not exported by core".

### Validation

**Nonreg scopes:** full nonreg, since this slice moves the largest part.

```bash
npm run build -w @miroir-framework/core && npm run build -w @miroir-framework/versioning
npm run test -w @miroir-framework/versioning -- ''
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- versioningLazyFreeze.696.phase3
python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-versioning/tsconfig.json
npm run test -w @miroir-framework/core -- ''
npm run nonreg:filesystem -- --runner shared
```

### Realization

- Core keeps `1_core/versioning/versioningInterfaces.ts`: the action type, its payload type, the 24 version and cross uuids, `VERSIONING_PACKAGE_NAME`, `VERSIONING_ACTION_IMPLEMENTATION_NAMES`, and the `versioningMode.ts` re-exports. `applicationVersionFreeze.ts` moved to `packages/miroir-versioning/src/`.
- `registerLazyActionImplementations({ capability, packageName, implementationNames, load })` in `ActionImplementations.ts`: one load per process, retried after a failure, `FeatureUnavailable` naming the package when the load fails. `runLibraryActionImplementation` refuses with `FeatureUnavailable` and the package name when an implementation that needs a capability is not registered.
- `DomainControllerActionHost.readSectionInstances` (Action2Error on a failed read). The freeze case (about 640 lines) and its three helpers left `DomainController`; in the package, the 25 "ensure history Entity" blocks are one loop over `HISTORY_ENTITIES`, the 27 persist batches one table, and the meta-model slice one builder (3.3 refactors done with the move).
- Hosts: `startMiroirNode` (server, Electron main, CLI), `startMiroirClient` with an emulated server, `setupMiroirTest` (option `versioningLoader`, `false` to register nothing). The package is in `build-all.sh`, `pr-checks.yml` (built, typechecked and tested in the core job), `build-linux-runnables.yml`, the `Dockerfile`, the `build:server` externals, the dependencies of react, react-testing, server-library, server, Electron and the standalone app, and `lazy` / `forbiddenEager` in the three bundle policies.
- Tests: 6 freeze unit tests moved to the package with the planner half of `actionSchema` and the freeze case of `metaModelEntityList` (8 files, 156 tests); `versioningLazyFreeze` (3) and `versioningNotInstalled` (1); `ActionImplementations.unit` gains the lazy registration case. Freeze MiroirTests 12/12, freeze reports 2/2.
- `runInActionContext` reports a thrown Error's message instead of `{}` (the freeze report shows the refusal text).
- Known, not caused here: `tests/3_controllers/applicationVersionFreeze.integ.test.ts` (not in nonreg) fails at its first freeze because Library is `unversioned` since #553.
- Found by the full nonreg (`unit-658-create-app`): react and server-library are published, so their new dependency must be too. `@miroir-framework/versioning` joins `scripts/published-packages.json` (public, with its repository field); the consumer project's closure and the manifest test list it. The self-test, sandbox-smoke and `build-artefacts-linux` build lists build it before react.

---

## Slice 4 — Traces run from the package through a lazy recorder

**Status:** ✅ done

### Goal

With traces on, a model commit and an instance write record their traces as before, from the package; with traces off, no write loads it.

**Layers cut:** core `EvolutionTraceRecorder` interface and lazy registration → `DomainController` (`maybeRecordEvolutionTrace` reduced to the cheap checks and the recorder call) → package (writer, runtime, compaction, definition version) → hosts.

### 4.1 RED

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/696-versioning-package/versioningLazyTraces.696.phase4.integ.test.ts` (vitest: loader count and environment switch)

Behavior asserted:
- traces off, capability on: an instance write and a committed `createEntity` leave the loader count at 0 and write no trace row.
- traces on: the first traced write loads the package once; the trace rows match the counts locked in Slice 0.2.
- traces on, capability off: no trace row and no load (capability checked before loading).

`action.scenario.evolutionTrace` stays green with `MIROIR_EVOLUTION_TRACE=1`.

### 4.2 GREEN

- Move `evolutionTrace{Compaction,DefVersion,Runtime,Writer}.ts` and their 5 unit tests to the package; `evolutionTracePolicy.ts` and `evolutionTraceBaseline.ts` stay.
- The registration of Slice 3 also records the loader per capability; `LazyActionImplementationModule` gains an optional `evolutionTraceRecorder`, which core loads after its cheap checks.
- The writers stay where they are (revised during implementation): the side that records today still records, now through the package. Moving the recording to the persistence side changes the event counts of every traced write and is a separate behavior change, reported as a follow-up.
- The commit context (`commitUuid`, the observational `fromVersionUuid`) is passed to the recorder unchanged.

### 4.3 Refactor checkpoint

- Slice 0.2 showed both sides recording an instance write (duplicate events) and only the client recording a commit. This slice keeps those counts; the PR names the duplicates as a follow-up.
- Slice 0.1: flip the trace names to "not exported by core".

### Validation

**Nonreg scopes:** `smoke,actions,core`, plus the trace step.

```bash
npm run test -w @miroir-framework/versioning -- ''
npm run build -w @miroir-framework/core && npm run build -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- versioningLazyTraces.696.phase4
MIROIR_EVOLUTION_TRACE=1 npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites action.scenario.evolutionTrace --mode integ
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w @miroir-framework/core -- ''
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,core
```

### Realization

- Core keeps `evolutionTracePolicy.ts` and `evolutionTraceBaseline.ts`; `evolutionTrace{Writer,Runtime,Compaction,DefVersion}.ts` moved to the package with 5 unit test files (compaction, defversion, persist, policy, runtime; the package now has 13 files, 187 tests). `InstanceCUDAction` joins core's exports, which the moved writer names.
- `DomainControllerActionHost.ts` gains `EvolutionTraceRecorder` and `EvolutionTraceCommitContext`; `LazyActionImplementationModule` an optional `evolutionTraceRecorder`; `registerLazyActionImplementations` records its loader per capability and `loadLazyCapabilityModule(capability)` reuses the same single load.
- `maybeRecordEvolutionTrace` is the checks only: traces on, a traceable action type (one set), a known deployment, the `versioning` capability, then the package's `recordEvolutionTrace`. A process with traces on and no registered package warns and records nothing.
- The writers stay as they were (4.2 revised): `versioningLazyTraces` locks the Slice 0.2 counts (client 3, server 6 for one instance write). Recording on one side only is a follow-up.
- Proofs: `versioningLazyTraces.696.phase4` 3/3, `traceWriters.696.phase0` 4/4, `action.scenario.evolutionTrace` with `MIROIR_EVOLUTION_TRACE=1` green, core unit 3325 passed, `versioningSurface.696.phase0` flipped to "no longer exports the trace implementation".

---

## Slice 5 — Versioning entries and action listings hidden when off

**Status:** ⬜ pending

### Goal

With the capability off, a designer sees no Versioning AppBar item, no freeze Runner and no version or trace menu items, and an MCP client, the CLI and CopilotKit list no `freezeApplicationVersion`.

**Layers cut:** `@miroir-framework/react` (AppBar, sidebar menu, `RunnerView`) → core `listEndpointActions` → MCP tool registry, CLI commands, CopilotKit actions (through the shared listing).

### 5.1 RED

**Tests:**
- `packages/miroir-standalone-app/tests/4_view/issues/696-versioning-package/versioningHidden.696.phase5.unit.test.ts` (vitest on the pure predicates, as `AppBarVersioning.unit.test.ts` and the 273 tests do): with `versioning: false` the AppBar item predicate is false, the Miroir menu filter drops items 1, 2, 14, 15, and the Runner filter drops the freeze Runner; with `versioning: true` all are kept.
- `packages/miroir-core/tests/2_domain/issues/696-versioning-package/endpointActionListing.696.phase5.unit.test.ts` (`listEndpointActions` is a TS function with a snapshot parameter; a `functionCallTest` would need the snapshot as JSON, which is possible: prefer a MiroirTest `functionCallTest` `fn.listEndpointActions.capability` if the function-call registry accepts it, else this vitest): with `versioning: false` the ModelEndpoint listing has no `freezeApplicationVersion`; with true it has it.

### 5.2 GREEN

- `isVersioningAppBarItemVisible` callers also check `processCapabilities.versioning` (the function stays per application, D7).
- One list in `@miroir-framework/react` of the versioning menu Report uuids and the freeze Runner uuid, read by the sidebar and `RunnerView`.
- `listEndpointActions` (it takes a `LocalCacheInterface`, so the test builds one or a pure filter is split out) skips actions whose `requiredCapability` is off. `DomainControllerInterface` gains a `getProcessCapabilities()` getter so MCP, CLI and CopilotKit have a snapshot to pass.

### 5.3 Refactor checkpoint

- Note in the list's comment that #712 replaces it.

### Validation

**Nonreg scopes:** full nonreg (UI, MCP, CLI and core change).

```bash
npm run build -w @miroir-framework/core && npm run build -w @miroir-framework/react
RUN_TEST=versioningHidden.696.phase5 npm run testByFile -w miroir-standalone-app -- versioningHidden.696.phase5
RUN_TEST=endpointActionListing.696.phase5 npm run testByFile -w @miroir-framework/core -- endpointActionListing.696.phase5
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-mcp/tsconfig.json
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

## Slice 6 — MiroirTests tagged `versioning` skip when off

**Status:** ⬜ pending

### Goal

A test run in a process with versioning off reports the five `versioning` suites as skipped, with the reason, instead of failing them.

### 6.1 RED

**Test:** `packages/miroir-core/tests/5-tests/miroirTestRequirements.unit.test.ts` (extended; the function is browser-safe TS with no ML entry point)

Behavior asserted:
- `miroirTestUnmetRequirement({ tags: ["versioning"] }, env, { versioning: false, … })` returns the skip reason naming `features.versioning`; with `versioning: true` it returns `undefined`.
- `miroirTestSuiteForEnvironment` marks the suite `skip` in the same case.

### 6.2 GREEN

- Add the capabilities parameter; pass the snapshot from `RunMiroirTestAction.ts` line 559, `miroirTestBatch.ts` line 232 and `runMiroirRunnerTestsFromCLI.ts` line 43 (through `miroirTestSuiteForEnvironment`); check the `--shared` path (`runMiroirRunnerSuitesSharedFromCLI.ts`) and core's `test-miroir-core.ts`.

### Validation

**Nonreg scopes:** `smoke,core,tooling`.

```bash
RUN_TEST=miroirTestRequirements npm run testByFile -w @miroir-framework/core -- miroirTestRequirements
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling
```

### Realization

---

## Slice 7 — Bundle size record and guard check

**Status:** ⬜ pending

### Goal

No page fetches the package eagerly, every packaged artefact ships or excludes it on purpose, and the bundle size history shows the smaller eager core.

### 7.1 RED

**Tests:** the bundle guards, whose entries landed in Slice 3; `check_bundle_policy.py` must pass on the three reports. A temporary static import of the package from an eager module must make the guard fail (checked once, then removed; recorded in the Realization).

### 7.2 GREEN

- `npm run bundle-size:record -w miroir-app-miroir -- packages/miroir-standalone-app/dist/.vite/bundle-report.json --reason "#696: freeze and trace code out of core"`, same for Electron.

### Validation

**Nonreg scopes:** `smoke,tooling`.

```bash
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npm run build -w miroir-standalone-app-electron && python scripts/check_bundle_policy.py packages/miroir-standalone-app-electron/dist/bundle-report.json packages/miroir-standalone-app-electron/bundle-policy.json
RUN_TEST=homePageLoad npm run testByFile -w miroir-standalone-app -- homePageLoad
npm run build:server -w miroir-server
python scripts/check_dependency_policy.py && python scripts/rename_packages.py --check
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

---

## Slice 8 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 8.1 Nonreg

- Add `integ-696-versioning-capability-off` (scopes `actions`, `external`, with `tier` and `requires`): runs the Slice 1, 2 and 3 issue tests, renamed to their feature names in 8.3.
- Add `unit-versioning-package` (scopes `core`, `actions`): the package's unit tests. `python -m pytest scripts/tests -q` covers the manifest (`test_run_nonreg.py`).
- Run the full `npm run nonreg:filesystem -- --runner shared`, and `npm run nonreg:default` on PostgreSQL for the freeze steps.

### 8.2 Docs

- `docs/reference/process-capabilities.md`: `versioning` in the synoptic table, the config shape, the product shapes, the refused actions; the "missing features" sentence; the "Versioning (per application)" section now says how the capability and the mode combine (D7).
- `docs/reference/versioning.md`: the package, the capability, where the freeze runs (D2).
- The Endpoint reference: the `requiredCapability` field. `docs/reference/testing.md`: the `versioning` tag is a requirement.
- `docs/internals/code-splitting.md`: the package as a lazy chunk.
- `AGENTS.md`: the package in "Packages and build order" and in the pre-push gate.
- `analysis.md` status → implemented; this plan's progress table.

### 8.3 Issue-directory cleanup

- Move the Slice 0–5 assertions into feature-named suites (`tests/3_controllers/versioningCapability.integ.test.ts`, `tests/4_view/versioningEntries.unit.test.ts`, `packages/miroir-core/tests/1_core/versioningSurface.unit.test.ts`, the listing test), then delete the four `issues/696-versioning-package/` directories (core `1_core` and `2_domain`, standalone app `3_controllers` and `4_view`).

### 8.4 Tracer bullet (narrative)

1. Start `miroir-server` with `features.versioning: false`; open the standalone app.
2. Browse Library: no Versioning AppBar item, no freeze Runner on the Runners page, no version or trace menu items.
3. Through MCP, list the ModelEndpoint tools: no `freezeApplicationVersion`. Call it anyway by its action: `FeatureUnavailable`, capability `versioning`.
4. DevTools network: no request for the versioning chunk.
5. Restart with `versioning` on (or the key removed): the entries are back; freeze Library; the server log shows the package loaded once.

Automated equivalent: `integ-696-versioning-capability-off` (steps 2 and 3 in the emulated server; step 4 is covered by the bundle policies, since the emulated server has no network) and the four freeze nonreg steps (step 5).

### AC checklist (#696)

| Criterion | Proven by | Status |
|---|---|---|
| Core no longer imports freeze or trace implementations | `versioningSurface.unit` (Slices 3, 4), `tsc` of core with the files gone | ⬜ |
| With the capability off, a client build does not include the package (reworded by D9: a process with it off never loads it; a browser talking to a server never fetches it) | `versioningLazyFreeze` and `versioningLazyTraces` loader counts; the three bundle policies | ⬜ |
| The Versioning AppBar item, the freeze Runner and the trace reports are hidden when off | `versioningEntries.unit` | ⬜ |
| The remaining actions return `FeatureUnavailable` | `versioningCapability.integ`, `versioningServerRouted` | ⬜ |
| The core keeps only the interfaces and the section routing | `versioningSurface.unit` | ⬜ |
| Bundle-size history shows the core shrinking | the `BundleSizeMeasurement` recorded in Slice 7 | ⬜ |
| The freeze MiroirTests and the nonreg steps pass with the capability on | the four freeze steps and `integ-action.scenario.evolutionTrace` in the full nonreg | ⬜ |
| Model actions registrable from outside core (issue comment) | `versioningLazyFreeze` (the freeze is such an action) | ⬜ |
