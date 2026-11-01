# Issue #647 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> The tests run the real DomainController, local cache and store sections (filesystem first, then
> IndexedDb, Postgres and MongoDB). They go through the applicative interfaces: `createInstance` /
> `getInstances` actions, environment files, the 3 history Reports and their MiroirTests, and the
> recording commands. No mocks. The tracer bullet proves that the Miroir application's 28 bundle size
> rows are read from and written to its `devData` section on the filesystem store.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step. Commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/647
Pattern: [`../232-FEATURE-dedicated-model-version-storage/`](../232-FEATURE-dedicated-model-version-storage/) ✅
Working branch: `claude/647-devdata-section`

**Resume note:** plan written 2026-11-01; no slice started.

---

## Scope

- **G1** Every application can have a `devData` section and store `devData` rows in it (Slices 1, 2, 4).
- **G2** A `devData` Entity is defined once, in `miroir-app-miroir` (Slice 1).
- **G3** The Miroir application's bundle size, page load and agent run history stays readable from the Miroir menu and is recorded by the same commands (Slices 1–3).
- **G4** No `devData` row is loaded or shipped where an environment leaves the section out (Slices 1, 4, 5).
- **G5** No application named Meta remains, and "meta" names only the meta-model (Slice 5).

This plan does **not** add test run Entities or the Miroir Tests recorder (#483), record nonreg runs (#474), move MiroirTests or TestConfigurations to `devData`, show model, `modelVersion` and `devData` Entities apart in the UI, hide the "Dev data" menu items where the section is absent, add a section selection to rollback, or fix #239 for `modelVersion`.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the Meta content and the `modelVersion` contracts | ⬜ | `devDataInventory.647.phase0.unit.test.ts` + existing `modelVersion` suites green |
| 1 | Tracer: Miroir's bundle size rows live in `miroir_devData` (filesystem) | ⬜ | `devDataSection.647.phase1.integ.test.ts` |
| 2 | The history Reports open on any application's `devData` | ⬜ | MiroirTests `report.bundleSizeHistory`, `report.pageLoadHistory`, `report.agentRunHistory` on Library |
| 3 | The recording commands write to `miroir_devData` | ⬜ | moved recorder tests, `test_check_bundle_policy.py`, `loadTimingWriter.integ` |
| 4 | `devData` on IndexedDb, Postgres, MongoDB; bundled refuses it | ⬜ | `devDataSection.647.phase4.integ.test.ts` per store, restart case |
| 5 | Delete `miroir-app-meta`; deliveries, docs, nonreg, cleanup, AC | ⬜ | full `nonreg:filesystem`, delivery tree check |

The 3 report MiroirTests stop passing in Slice 1, when the 3 Entities leave the Meta application and their rows move to Miroir's `devData`, and pass again at the end of Slice 2. Slices 1 and 2 are therefore done back to back. Slice 1's scoped nonreg leaves out the `ui` scope, and the full nonreg runs at the end of Slice 2.

---

## Locked implementation defaults

From [`analysis.md` §3](./analysis.md#3-decision-record). D13–D23 are proposals reviewed by A with this plan; a change of decision updates this table before the slice that depends on it.

| Decision | Choice | Serves |
|---|---|---|
| D1 Name | `devData`; folders `<prefix>_devData/`; store suffix `_devData` | G5 |
| D2 Routing | `devDataEntityUuids` (BundleSizeMeasurement, PageLoadMeasurement, AgentRunMeasurement) checked in `getApplicationSection` right after `versionHistoryEntityUuids` | G2 |
| D3 Presence | optional: `sections.devData` in the environment, `configuration.devData` in the Deployment row; reads of an absent section are empty, writes fail with a named error; bundled refuses | G1, G4 |
| D4 Boot | loaded at rollback when declared; `PageLoadMeasurement` stays lazy (`cacheAllInstancesOnRefresh: false`, already set) | G3 |
| D5 Stores | filesystem, IndexedDb, Postgres, MongoDB | G1 |
| D6 Rows | `miroir-app-miroir/assets/miroir_devData/<entity uuid>/` | G3 |
| D7 Model | Entities → `miroir_model/16dbfe28/`, Reports → `miroir_data/3f2baa83/`, MiroirTests → `miroir_data/a311f363/`, with `git mv`; uuids unchanged; `selfApplication` becomes Miroir (`360fcf1f-f0d4-4f8a-9262-07886e70fa15`) | G2, G5 |
| D8 Menu | a "Dev data" group in `MiroirMenu` (`eaac459c`) with the 3 history Reports, section `devData`, application Miroir | G3 |
| D10 Environments | Miroir declares `devData` in `dev` (live) and every `test-*` (copy); not docker, desktop, bundled | G3, G4 |
| D11 Package | `miroir-app-meta` deleted | G5 |
| D12 Regression | a `devData` row lands in `devData` only, at boot and through actions | G1 |
| D13 Code shape | `optionalApplicationSections = ["modelVersion", "devData"]` drives every per-section branch | G2 |
| D14 Testbed | the 3 MiroirTests run on `libraryTestbedInitParams`; every testbed storage gets a `devData` section | G1, G3 |
| D15 Seeding | seeded rows routed with `getApplicationSection` | G1 |
| D16 Reports | a `devData` key in `DeploymentUuidToReportsEntities` for every application (Miroir's `devData` Reports and Entities); report loads resolve the section with `getApplicationSection` | G1, G3 |
| D17 Helpers | `miroir-app-miroir/scripts/devData/` (not exported); seeds in `miroir-standalone-app/src/miroir-fwk/4-tests/devDataTestSeeds.ts` | G5 |
| D18 Writers | every writer targets the Miroir deployment and `devData` | G3 |
| D19 Delivery | `miroir_devData/` excluded from the Docker and Electron copies | G4 |
| D20 Enums | `devData` added to the fundamental section enum, `storeUnitConfiguration`, `miroirEnvironmentApplication.sections`, the 3 Report section enums; `metaTestbedInitParams` removed from the MiroirTest Entity and its EntityVersion `51c647fe` | G3 |
| D21 Definitions | `devDataEntityDefinitions` boots the section and creates tables lazily; `devData` Entities filtered out of the `model` and `data` boots | G1, G2 |
| D22 Rollback | absent-section mapping for every optional section; cache flag applied to `devData` Entities from both lists | G3, G4 |
| D23 Guard | a write of a `devData` Entity to another section is rejected with a named `Action2Error` | G1 |

---

## Allocated UUIDs / keys

No new model element is created: every moved element keeps its uuid (analysis §4.1).

| Artefact | Value |
|---|---|
| Routing set | `devDataEntityUuids` (`miroir-core/src/1_core/Model.ts`) |
| Definitions map | `devDataEntityDefinitions`, `getDevDataEntityDefinition` (same file) |
| Report list | `metaModelDevDataReports` (same file): `e8c6faa5`, `85077493`, `02dd2ead`, `193c3dea`, `7a695632`, `49a3c09a` |
| Optional sections | `optionalApplicationSections`, `OptionalApplicationSection` (`miroir-core/src/1_core/Model.ts`, exported) |
| Error marker | `"<section> section is not configured"` (generalises `MISSING_MODEL_VERSION_SECTION_MARKER`) |
| Seeds module | `miroir-standalone-app/src/miroir-fwk/4-tests/devDataTestSeeds.ts` |
| TestConfigurations (kept) | `8b8dfbd9-66e9-4afb-87e3-90aa07ccd11b`, `a8dd8a49-97de-426c-beb7-c32d0f1beb26` |
| MiroirTest suites (kept) | `report.bundleSizeHistory`, `report.pageLoadHistory`, `report.agentRunHistory` |
| Nonreg step (new) | `default-miroir-devData-validation` (replaces `default-meta-modelValidation`), scopes `["core"]` |
| Nonreg steps (renamed titles) | `integ-report.bundleSizeHistory`, `integ-report.pageLoadHistory`, `integ-report.agentRunHistory` (if present) |
| npm scripts (moved) | `bundle-size:record`, `bundle-size:backfill`, `agent-run:record` in `miroir-app-miroir/package.json` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Phase tests (vitest, core) | `RUN_TEST=<name> npm run testByFile -w miroir-core -- <name>` |
| Phase tests (vitest, standalone) | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- <name>` |
| Report MiroirTests (integ) | `npm run testMiroir -w miroir-standalone-app -- --suites report.bundleSizeHistory,report.pageLoadHistory,report.agentRunHistory --mode integration` |
| Environment MiroirTest | `npm run testMiroir -w miroir-core -- --suites fn.environment.deriveDeployments --mode unit` |
| Deployment validation | `npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core` |
| Store packages rebuild | `npm run build -w miroir-localcache-redux -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres -w miroir-store-mongodb -w miroir-store-bundled` |
| Environment check | `npm run miroir-env -- check --strict --tracked-clean` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Python checks | `python -m pytest scripts/tests -q` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared` |

---

## Slice 0 — Characterize the Meta content and the `modelVersion` contracts

**Status:** ⬜ pending

### Goal

Lock today's inventory and the `modelVersion` behaviours that D13 refactors, so every later slice has a diff to check against.

### 0.1 RED → GREEN — inventory lock

**Test:** `packages/miroir-core/tests/1_core/issues/647-devdata-section/devDataInventory.647.phase0.unit.test.ts` (vitest: asset layout across packages, not reachable through a MiroirTest).

Behavior asserted, read from disk:
- the 3 Entities, 6 Reports, 3 MiroirTests of analysis §4.1, by uuid and `name`, at their current paths in `miroir-app-meta/assets/meta_model/`;
- 28 tracked `BundleSizeMeasurement` rows and 24 `AgentRunMeasurement` rows in `meta_data/`, with their uuids recorded in a fixture list;
- `PageLoadMeasurement` has `cache.cacheAllInstancesOnRefresh: false`.

The test takes the expected folder of each kind from one table at its top. Slice 1 and Slice 2 change that table to the target folders (D7), so the same test then proves the move.

### 0.2 Baseline of the `modelVersion` contracts

No new test. Run and record the result of the existing suites listed in analysis §5 ("Tests to mirror"). They are the safety net of D13 and must stay green in every slice.

### Validation

```bash
RUN_TEST=devDataInventory npm run testByFile -w miroir-core -- devDataInventory.647.phase0
npm run testByFile -w miroir-core -- persistenceStoreController.sections persistenceStoreControllerManager modelVersionStorage.contract cacheRefreshPolicy versioningModes testbedStorageConfiguration
npm run testByFile -w miroir-env -- testEnvironments miroirEnvDeploy
npm run testMiroir -w miroir-core -- --suites fn.environment.deriveDeployments --mode unit
```

### Realization

---

## Slice 1 — Tracer: Miroir's bundle size rows live in `miroir_devData` (filesystem)

**Status:** ⬜ pending

### Goal

A Miroir maintainer running `test-filesystem` or `dev` reads the 28 bundle size rows, and writes new ones, through the Miroir application's `devData` section. An application without the section reads nothing and gets a named error on write.

**Layers cut:** ML schema (section enum, `storeUnitConfiguration`, environment schema) → generated types → Entity assets and rows (`git mv`) → `Model.ts` routing and definitions → `PersistenceStoreController` / manager / `ActionRunner` → filesystem store factory → `Environment.ts` → environment files and the Miroir Deployment row.

### 1.1 RED

**Test:** `packages/miroir-standalone-app/tests/3_controllers/issues/647-devdata-section/devDataSection.647.phase1.integ.test.ts` (vitest integration on `MIROIR_ENV=test-filesystem`: store sections are framework internals, and the asserted file layout is not reachable through a MiroirTest).

Behavior asserted:
- `getInstances` on the Miroir application for `BundleSizeMeasurement`, with no explicit section, returns the 28 rows;
- a `createInstance` of a `BundleSizeMeasurement` row through the DomainController writes `<test store>/miroir/devData/90d603f9-.../<uuid>.json` and nothing under `data/` (D12);
- a `createInstance` naming `applicationSection: "data"` for the same Entity returns an `Action2Error` (D23);
- on the Library application (no `devData` in `test-filesystem`), `getInstances` for `BundleSizeMeasurement` returns an empty collection and `createInstance` returns the named "devData section is not configured" error;
- after closing and reopening the Miroir deployment, the rows are still read (D21 boot).

Also RED, in `fn.environment.deriveDeployments` (MiroirTest `7f14228c`): a case with `"sections": { "devData": {} }` derives a `devData` store configuration with directory `<prefix>_devData` (filesystem) and schema / name suffix `_devData` (sql, mongodb, indexedDb). This locks the `Environment.ts:164` risk before Slice 4.

### 1.2 GREEN

1. **Schema (D20).** Add `devData` to `applicationSection` (`getMiroirFundamentalMlSchema.ts:1287`), optional `devData` to `storeUnitConfiguration` (L1842) and to `miroirEnvironmentApplication.sections` (L2160). Extend `generate-ts-types.ts:330` if `devData:` comes out unquoted. Rebuild `miroir-app-miroir`, then `devBuild` `miroir-core`.
2. **Assets (D7, D6).** `git mv` the 3 Entity files to `miroir-app-miroir/assets/miroir_model/16dbfe28-.../`, and the rows of `meta_data/90d603f9`, `954de789` and the `0266c0b8/.gitkeep` to `miroir-app-miroir/assets/miroir_devData/`. Move the `.gitignore:95` rule to `miroir_devData/0266c0b8-.../*.json`. Export the 3 Entities from `miroir-app-miroir/index.ts` and `index.d.ts`, and add them to `defaultMiroirMetaModel.entities` (`src/Model.ts`).
3. **Routing and definitions (D2, D21).** `devDataEntityUuids`, `devDataEntityDefinitions`, `getDevDataEntityDefinition` in `Model.ts`; `getApplicationSection` checks the set right after `versionHistoryEntityUuids`.
4. **Optional sections (D13).** `optionalApplicationSections` in core. `PersistenceStoreController` holds `Partial<Record<OptionalApplicationSection, Store>>`; `getSectionInstanceStore`, the empty-read path, `getInstance`, open, close, clear and `bootFromPersistedState` loop over it; `ensureModelVersionStorageForEntity` becomes `ensureOptionalSectionStorageForEntity(section, entityUuid)` using the section's definitions map; the `model` and `data` boots filter out both routing sets. `PersistenceStoreControllerManager.ts:189-209` and `ActionRunner.ts:85-104, 165-192` loop over the list. The D23 guard goes in the write path (L342-417).
5. **Rollback (D22).** `cacheRefreshPolicy.ts`: the marker and `isAbsentOptionalSectionError(error, section)`, with `isAbsentModelVersionSectionError` kept as a wrapper; `DomainController.ts:786-813` maps any optional section; `resolveEntitiesToFetchOnRefresh` applies the cache flag to `devData` Entities from both lists.
6. **Environment (D3).** `EnvironmentSectionName`, `environmentSections` and the `sectionConfiguration` suffix (`Environment.ts:60-65, 164`) come from the list. `Deployment.ts:549` and `ModelInitializer.ts:44` take the list or `ApplicationSection`.
7. **Filesystem store.** `miroir-store-filesystem/src/startup.ts` registers the optional-section factories in a loop.
8. **Declarations (D10).** `"sections": { "modelVersion": {}, "devData": {} }` for Miroir in `environments/dev.json` and `test-filesystem.json`; `configuration.devData` (filesystem, `miroir-app-miroir/assets/miroir_devData`) in the Miroir Deployment row `miroir-app-admin/assets/admin_data/7959d814-.../10ff36f2-....json`.
9. **Meta, for this slice only.** Remove the 3 Entities from `defaultMetaAppModel` and the `meta_data/` folders they leave. The Meta Reports now have no rows: their 3 MiroirTests fail until Slice 2 (see Progress summary).
10. Update the Slice 0 inventory table: Entities and rows at their new folders.

### 1.3 Refactor checkpoint

- `getSectionInstanceStore` no longer sends an unknown section to `data` (analysis §4.2, misaligned).
- Delete `modelVersion`-only helpers made dead by D13, keeping exported names as wrappers.
- `getVersionHistoryEntityDefinition` and `getDevDataEntityDefinition` share one lookup by section.

### Validation

**Nonreg scopes:** `smoke,core,actions,tooling`, because the slice changes ML schemas and assets (`core`), the controller and a store (`actions`) and `miroir-env` inputs (`tooling`). `ui` is left out until Slice 2.

```bash
npm run build -w miroir-app-admin && npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core
npm run build -w miroir-localcache-redux -w miroir-store-filesystem
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-store-filesystem/tsconfig.json
npm run test -w miroir-core -- ''
RUN_TEST=devDataInventory npm run testByFile -w miroir-core -- devDataInventory.647.phase0
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- devDataSection.647.phase1
npm run testMiroir -w miroir-core -- --suites fn.environment.deriveDeployments --mode unit
npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts
npm run miroir-env -- check --strict --tracked-clean
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,tooling
```

### Realization

---

## Slice 2 — The history Reports open on any application's `devData`

**Status:** ⬜ pending

### Goal

A Miroir maintainer opens "Bundle size history", "Page load history" and "Agent runs" from the Miroir menu, on Miroir's `devData` rows. The same Reports show the `devData` rows of another application (Library in a testbed), which #483 needs.

**Layers cut:** Report, MiroirTest and Menu assets → Report and MiroirTest ML schemas → `Model.ts` per-section Reports → report load section resolution → testbed storage and seeding → miroir-react Report lookup → MiroirTest runner.

### 2.1 RED

**Tests:** the 3 MiroirTests `report.bundleSizeHistory` (`d13c9b9e`), `report.pageLoadHistory` (`24f5c213`), `report.agentRunHistory` (`ed680b8e`), moved to `miroir_data/a311f363-.../` and re-pointed (D14): `runTarget` Library, `testbedInitApplicationParameters: libraryTestbedInitParams`, `report.application` Library, `report.applicationSection: "devData"`. Their steps are unchanged. They are RED until the GREEN steps below.

Plus a vitest case in `devDataSection.647.phase1.integ.test.ts`, "Report mapping": `getReportsAndEntitiesForDeploymentUuid` for Library has a `devData` key whose `availableReports` are the 6 Reports and whose `entities` include the 3 Entities. For Miroir, the `data` key no longer lists them.

### 2.2 GREEN

1. **Assets (D7, D8, D20).** `git mv` the 6 Reports to `miroir_data/3f2baa83-.../` and the 3 MiroirTests to `miroir_data/a311f363-.../`; set their `selfApplication` to Miroir. Export the Reports from `index.ts` / `index.d.ts` and add them to `defaultMiroirMetaModel.reports`. Add a "Dev data" group to `MiroirMenu` with the 3 history Reports, section `devData`, application Miroir; "Agent runs" points to `7a695632`, which fixes the Meta menu bug. Add `devData` to the 3 Report section enums. Remove `metaTestbedInitParams` from the MiroirTest Entity and from its EntityVersion `51c647fe` (first check, with `miroirTestTags.unit.test.ts`, whether that row must change or is frozen). Rebuild the schemas.
2. **Reports per section (D16).** `metaModelDevDataReports`; a `devData` key for every application in `getReportsAndEntitiesForDeploymentUuid` and `DeploymentUuidToReportsEntities`; Miroir's `data` key excludes the 6 Reports. Report loads (`reportQueryLoadSegment.ts:262`, `ReportQueryLoadService.ts:56`) resolve the section with `getApplicationSection` when the request names none. The miroir-react section unions (`ReportSectionViewWithEditor.tsx:95`, `OpenReportLaunch.tsx:17`, `EntityInstanceGridInterface.ts:81`) use `ApplicationSection`.
3. **Testbeds (D14).** `testApplicationStorageConfiguration` (`runnerIntegTestSupport.ts:202-310`) and `testbedStorageConfiguration.ts` give every testbed a `devData` section with suffix `_devData`; `testApplicationStoreTeardown.ts` drops it; `transformerTestApplicationPlayfield.ts` follows the list.
4. **Seeding (D15).** `Deployment.ts:570-580` routes each seeded collection with `getApplicationSection`.
5. **Seeds (D17).** Move the seeds and the 2 TestConfigurations from `Meta.ts` to `devDataTestSeeds.ts`, with `testbedModel` set to Library's model. `testConfigurationInstanceIndex.ts` imports them from there. Delete `metaTestbedInitParams` and its `testbedInitApplicationParametersIndex.ts` case.
6. **Meta.** Remove the moved Reports, MiroirTests and `MetaMenu` from `miroir-app-meta`. What remains of the package goes in Slice 5.
7. Update the Slice 0 inventory table: Reports and MiroirTests at their new folders.

### 2.3 Refactor checkpoint

- `metaModelVersionReports` and `metaModelDevDataReports` share one "Reports of a section" helper in `getReportsAndEntitiesForDeploymentUuid`.
- `runnerIntegTestSupport.ts` and `testbedStorageConfiguration.ts` both build per-section test stores: extract the shared suffix rule if they still repeat it.

### Validation

**Nonreg scopes:** full nonreg, closing Slices 1 and 2.

```bash
npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core
npm run build -w miroir-localcache-redux -w miroir-store-filesystem
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run test -w miroir-core -- ''
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- devDataSection.647.phase1
npm run testMiroir -w miroir-standalone-app -- --suites report.bundleSizeHistory,report.pageLoadHistory,report.agentRunHistory --mode integration
npm run testByFile -w miroir-core -- miroirTestTags
npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts
npm run nonreg:filesystem -- --runner shared
```

Manual: `npm run dev -w miroir-standalone-app` on `dev`, open Miroir → Dev data → Bundle size history: the graph shows the 28 records.

### Realization

---

## Slice 3 — The recording commands write to `miroir_devData`

**Status:** ⬜ pending

### Goal

A contributor records a bundle size with `npm run bundle-size:record -w miroir-app-miroir`, the agent benchmark records its runs, and the page records its load timings. All three land in the Miroir application's `devData`, and the bundle guard's `history` rule reads them there.

**Layers cut:** Node helpers and scripts → `package.json` scripts → Python guard → page writer and its switch.

### 3.1 RED

**Tests:**
- `miroir-app-meta/tests/{bundleSizeRecord,bundleSizeBackfill,agentRunRecord}.unit.test.ts` move to `miroir-app-miroir/tests/devData/` (vitest: Node scripts that write files, not reachable through a MiroirTest). Their expected output folder changes to `miroir_devData`.
- `scripts/tests/test_check_bundle_policy.py`: the `history` rule reads `--dev-data-dir`, and its default is `miroir-app-miroir/assets/miroir_devData`.
- `miroir-standalone-app/tests/4_view/loadTimings/loadTimingWriter.integ.test.ts`: the writer creates the rows on the Miroir deployment in section `devData`. `loadTimingsSwitch.unit.test.ts`: recording is on only when the Miroir deployment's configuration has `devData`. `loadTimingContract.unit.test.ts`: the uuids match `miroir-app-miroir`'s Entity and Deployment.
- A new `miroir-app-miroir/tests/devData/devDataRows.unit.test.ts` validates every row under `miroir_devData/` against its Entity's `mlSchema`. It replaces Meta's `modelValidation` of `meta_data` (D17).

### 3.2 GREEN

1. **Helpers (D17).** `git mv` `src/{bundleSizeHistory,agentRunHistory,repoInfo}.ts` and `scripts/*.ts` to `miroir-app-miroir/scripts/devData/`; they import the Entity JSONs from `../../assets/miroir_model/...`. Add `scripts/**/*.ts` to `miroir-app-miroir/tsconfig.json`; add the 3 npm scripts to `miroir-app-miroir/package.json`.
2. **Guard.** `check_bundle_policy.py`: `DEFAULT_DEV_DATA_DIR`, `--dev-data-dir`, `RECORD_COMMAND` and docstring with `-w miroir-app-miroir`.
3. **Agent bench.** `scripts/agent_bench/batch.py:7, 79`: `-w miroir-app-miroir`.
4. **Page (D18).** `loadTimingWriter.ts`: Miroir application and deployment, `applicationSection: "devData"`. `loadTimingBrowser.ts:243`: the gate reads `[deployment_Miroir.uuid]?.devData`. `loadTimingConstants.ts`: imports instead of copies. `load-timings.mjs`: folder `miroir_devData/0266c0b8-...`, option `dev-data-folder`.

### 3.3 Refactor checkpoint

- `bundleSizeHistory.ts` and `agentRunHistory.ts` both read and write `<devData>/<entity uuid>/<uuid>.json`: one shared `devDataFolder(entityUuid)` helper.
- The `RECORD_COMMAND` text and `package.json` script names stay in one place, referenced by the docs.

### Validation

**Nonreg scopes:** `smoke,tooling,ui`, because the slice changes scripts and the guard (`tooling`) and the page writer (`ui`).

```bash
npm run testByFile -w miroir-app-miroir -- tests/devData
python -m pytest scripts/tests -q
npm run testByFile -w miroir-standalone-app -- loadTimingContract loadTimingsSwitch
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- loadTimingWriter.integ
npx tsc --noEmit --skipLibCheck -p packages/miroir-app-miroir/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling,ui
```

Manual: `npm run bundle-size:record -w miroir-app-miroir -- <bundle-report.json>` in a scratch checkout writes one file under `miroir_devData/90d603f9-.../`.

### Realization

---

## Slice 4 — `devData` on IndexedDb, Postgres and MongoDB; the bundled store refuses it

**Status:** ⬜ pending

### Goal

The same `devData` behaviour holds on every store type an environment can choose, with its own SQL schema, MongoDB database and IndexedDb name. A bundled deployment refuses the section.

**Layers cut:** store `startup.ts` factories → IndexedDb naming → bundled refusal → `miroir-env` deploy and state commands → Electron on-demand stores → `test-*` environment files.

### 4.1 RED

**Test:** `devDataSection.647.phase4.integ.test.ts` (vitest integration, run with `MIROIR_ENV=test-indexedDb`, `test-sql`, `test-mongodb`; store internals, same justification as Slice 1). Behavior asserted per store:
- the Slice 1 cases (routed read and write, D23 guard, absent section);
- the rows sit in their own store: Postgres schema `<miroir schema>_devData`, MongoDB database `<database>-devData`, IndexedDb `<name>-devData`, and none of them in the data store;
- after a restart of the deployment, the rows are read again (D21; on SQL, before D21 they would read as empty).

Plus a bundled case in `miroir-core/tests/1_core/versioningModes.bundled.unit.test.ts`: a `devData` write on the bundled store returns the named refusal, and a read is empty.

### 4.2 GREEN

1. `miroir-store-indexedDb`, `miroir-store-postgres`, `miroir-store-mongodb`: register the optional-section factories in a loop, naming the store from the section. `IndexedDb.levelDatabaseDirectoryNames` (`IndexedDb.ts:45-50`) covers every optional suffix.
2. `miroir-store-bundled`: `BundledUnsupportedModelVersionStore` becomes `BundledUnsupportedOptionalSectionStore(section)`, registered for each optional section; the old name stays exported.
3. `miroir-env`: `deployExample.SECTIONS` and `stateCommands.ts:205` follow the list; `environmentState.ts:54` already loops over `environmentSections`.
4. `miroir-standalone-app-electron/src/storesOnDemand.ts:11` follows the list.
5. `miroir-sandbox/src/bundledData.ts:160-166` excludes `devDataEntityUuids` from bundled data.
6. `environments/test-sql.json`, `test-indexedDb.json`, `test-mongodb.json`: the Miroir application inherits `devData` from `test-filesystem`; check that the `meta` overrides are gone (Slice 5 deletes them if still present).
7. `runnerIntegTestSupport.ts:155-191`: the Postgres identifier length check covers `_devData`.

### 4.3 Refactor checkpoint

- The five `startup.ts` files register optional sections the same way: if they still repeat the loop body, move it to a core helper that takes the store's factory.

### Validation

**Nonreg scopes:** `smoke,actions,tooling` on each store.

```bash
npm run build -w miroir-localcache-redux -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres -w miroir-store-mongodb -w miroir-store-bundled
for p in miroir-store-indexedDb miroir-store-postgres miroir-store-mongodb miroir-store-bundled miroir-env miroir-standalone-app-electron miroir-sandbox; do npx tsc --noEmit --skipLibCheck -p packages/$p/tsconfig.json; done
MIROIR_ENV=test-indexedDb npm run testByFile -w miroir-standalone-app -- devDataSection.647.phase4
MIROIR_ENV=test-sql npm run testByFile -w miroir-standalone-app -- devDataSection.647.phase4
MIROIR_ENV=test-mongodb npm run testByFile -w miroir-standalone-app -- devDataSection.647.phase4
npm run testByFile -w miroir-core -- versioningModes.bundled
npm run testByFile -w miroir-env -- testEnvironments miroirEnvDeploy
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,tooling
npm run nonreg -- --runner shared --storage indexedDb --scope smoke,actions
```

SQL and MongoDB runs need a running PostgreSQL and MongoDB. Where they are not available, the Realization says which store was not run.

### Realization

---

## Slice 5 — Delete `miroir-app-meta`; deliveries, docs, nonreg, cleanup, AC

**Status:** ⬜ pending

### Goal

No application named Meta remains, deliveries ship no `devData` row, and the docs describe the section.

### 5.1 RED

- `devDataInventory.647.phase0.unit.test.ts` gains a last case: `packages/miroir-app-meta` does not exist, and no tracked file outside `code-helpers/` names `miroir-app-meta`, `9ff432a9-89a1-460b-a263-1672d084a9e0` or `40b74910-4c63-4bd9-8e7d-2bc051342908` (checked with `git grep`).
- A delivery check (Python, `scripts/tests/test_delivery_assets.py`): the Electron `extraResources` filter and the Docker copy exclude `*_devData/`. The test reads `miroir-standalone-app-electron/package.json` and the `Dockerfile`/`.dockerignore` rules, because building the image is too slow for the gate.

### 5.2 GREEN

1. Delete `packages/miroir-app-meta` and its `assets/deployment/` rows; the Meta SelfApplication and Deployment rows in `miroir-app-admin/assets/admin_data/`; the `meta` entries of `environments/dev.json`, `test-filesystem.json`, `test-sql.json`, `test-indexedDb.json`, `test-mongodb.json`, `self-test.json`; deployment `40b74910` in `miroirConfig.browser-emulatedServer-indexedDb.json:112`.
2. Drop `miroir-app-meta` from `miroir-standalone-app/package.json`, `bundle-policy.json:419`, `build-all.sh:86, 108, 110, 701`, `Dockerfile:79`, the 3 workflows, `nonreg-manifest.json:381, 2650`; run `npm install` to update `package-lock.json`.
3. Tests that list environments or asset folders: `miroirEnvShow.unit.test.ts:31`, `testEnvironmentConfig.unit.test.ts:28`, `multistep.274.phase0.unit.test.ts:57`.
4. Nonreg manifest: replace `default-meta-modelValidation` (L371) with `default-miroir-devData-validation` (`npm run testByFile -w miroir-app-miroir -- tests/devData/devDataRows`, scopes `["core"]`); retitle the report steps (L1551, L1589) without "Meta".
5. Delivery (D19): Electron `extraResources` `filter: ["**/*", "!miroir_devData/**"]`; Docker `.dockerignore` rule or `rm -rf /seed/miroir-app-miroir/assets/miroir_devData` after the `COPY` at L155.
6. Bundle baseline: build, run `check_bundle_policy.py`; if the eager size leaves the 2% band, record it with `npm run bundle-size:record -w miroir-app-miroir`.
7. Docs: `docs/reference/data-architecture-deployments.md` (the `devData` section next to `modelVersion`, folder layout, definition from D1), `environments.md` (`sections.devData`, D10), `testing.md`, `load-timings.md`, `internals/code-splitting.md` (commands and folders), and the `#473` mention in `AGENTS.md`-linked guides if any.
8. Cleanup (#238 rule): move the lasting assertions of `tests/**/issues/647-devdata-section/` into feature suites (`devDataSection.integ.test.ts` next to the store tests, the inventory case into `miroir-app-miroir/tests/devData/`), then delete the issue directories. MiroirTest descriptions lose "(#473)" only where they name the Meta application.

### 5.3 Tracer narrative

Manual: on `dev`, record a bundle size with `npm run bundle-size:record -w miroir-app-miroir -- <report>`; open Miroir → Dev data → Bundle size history and see the new point; build the Docker image and check that `/seed/miroir-app-miroir/assets/` has no `miroir_devData/`. Automated equivalent: `bundleSizeRecord.unit.test.ts`, `report.bundleSizeHistory` (integ), `test_delivery_assets.py`.

### Validation

```bash
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
python scripts/check_dependency_policy.py
npm run lint
npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:unit
npm run nonreg:filesystem -- --runner shared
```

### AC checklist

| Acceptance criterion (#647) | Proof |
|---|---|
| `devData` is an `ApplicationSection`, routed by `devDataEntityUuids`, supported by filesystem, IndexedDb, Postgres and MongoDB; bundled refuses it | `devDataSection.647.phase1/phase4.integ`, `versioningModes.bundled` |
| `miroir-env check` accepts `sections.devData` and deploys the section | `fn.environment.deriveDeployments`, `miroirEnvDeploy`, `miroir-env check --strict` |
| The 3 Entities, their Reports and MiroirTests live in `miroir-app-miroir` with uuids unchanged, rows in `miroir_devData/` | `devDataInventory` (later `miroir-app-miroir/tests/devData/`), `devDataRows` |
| Recording commands, the `history` rule, the agent bench and page load recording use `miroir_devData/` | Slice 3 tests, `test_check_bundle_policy.py` |
| The 3 history Reports open from the Miroir menu in `dev` | the 3 report MiroirTests, Slice 2 manual check |
| `packages/miroir-app-meta` is gone and nothing references it | Slice 5 inventory case |
| The docs describe the `devData` section | Slice 5 docs list, review |
| `nonreg:unit` and `nonreg:filesystem` pass | Slice 5 Validation |

### Realization
