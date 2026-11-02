# Issue #647 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> The tests run the real DomainController, local cache and store sections (filesystem first, then
> IndexedDb, Postgres and MongoDB). They go through the applicative interfaces: `createInstance` /
> `getInstances` actions, environment files, the 3 history Reports and their MiroirTests, and the
> recording commands. No mocks. The tracer bullet proves that the Miroir application's bundle size
> rows are read from and written to its `devData` section, by the framework and by every command
> that records or checks them.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step. Commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/647
Pattern: [`../232-FEATURE-dedicated-model-version-storage/`](../232-FEATURE-dedicated-model-version-storage/) ✅
Working branch: `claude/647-devdata-section`

**Resume note:** plan written 2026-11-01, revised after an adversarial review the same day (slices regrouped so that no store profile, guard or recorder is broken between slices), accepted by A the same day. Slices 0 and 1 done on 2026-11-01 (A asked to go up to reviewed, merge-ready PRs).

---

## Scope

- **G1** Every application can have a `devData` section and store `devData` rows in it (Slices 1–3).
- **G2** A `devData` Entity is defined once, in `miroir-app-miroir` (Slice 1).
- **G3** The Miroir application's bundle size, page load and agent run history stays readable from the Miroir menu and is recorded by the same commands (Slices 1, 2).
- **G4** No `devData` row is loaded or shipped where an environment leaves the section out (Slices 1, 3, 4).
- **G5** No application named Meta remains, and "meta" names only the meta-model (Slice 4).

This plan does **not** add test run Entities or the Miroir Tests recorder (#483), record nonreg runs (#474), give the in-app Miroir Tests menu a `devData` testbed (`testbedStorageConfiguration`, #483), move MiroirTests or TestConfigurations to `devData`, show model, `modelVersion` and `devData` Entities apart in the UI, hide the "Dev data" menu items where the section is absent, add a section selection to rollback, change the keyless guard (`DomainController.ts:1288`, the `devData` Entities have uuid keys), or fix #239 for `modelVersion`.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the Meta content and the `modelVersion` contracts | ✅ | `devDataInventory.647.phase0.unit.test.ts` + existing `modelVersion` suites green |
| 1 | Tracer: Miroir's measurement rows live in `miroir_devData`, and every reader and writer follows | ✅ | `devDataSection.647.phase1.integ.test.ts`, moved recorder tests, `test_check_bundle_policy.py`, `loadTimingWriter.integ` |
| 2 | The history Reports open on any application's `devData` | ✅ | MiroirTests `report.bundleSizeHistory`, `report.pageLoadHistory`, `report.agentRunHistory` on Library |
| 3 | `devData` on IndexedDb, Postgres and MongoDB in its own store; bundled refuses it | ✅ | `devDataSection.647.phase3.integ.test.ts` per profile, restart and teardown cases |
| 4 | Delete `miroir-app-meta`; deliveries, docs, nonreg, cleanup, AC | ✅ | full `nonreg:filesystem` and `nonreg:default`, delivery check |

Between Slice 1 and the end of Slice 2, the Meta application still holds the 6 Reports and the 3 report MiroirTests, but their Entities and rows have moved to Miroir, so those 3 MiroirTests fail. Slices 1 and 2 are done back to back. Slice 1's scoped nonreg leaves out the 3 `integ-report.*` steps with `--skip` (or runs the scopes without them, see Slice 1 Validation), and the full nonreg runs at the end of Slice 2.

---

## Locked implementation defaults

From [`analysis.md` §3](./analysis.md#3-decision-record). D1–D24 were accepted by A on 2026-11-01. A change of decision updates this table before the slice that depends on it.

| Decision | Choice | Serves |
|---|---|---|
| D1 Name | `devData`; folders `<prefix>_devData/`; store names built like the `modelVersion` ones, with `devData` in place of `modelVersion` | G5 |
| D2 Routing | `devDataEntityUuids` (BundleSizeMeasurement, PageLoadMeasurement, AgentRunMeasurement) checked in `getApplicationSection` right after `versionHistoryEntityUuids` | G2 |
| D3 Presence | optional: `sections.devData` in the environment, `configuration.devData` in the Deployment row; reads of an absent section are empty, writes fail with a named error; bundled refuses | G1, G4 |
| D4 Boot | loaded at rollback when declared; `PageLoadMeasurement` stays lazy (`cacheAllInstancesOnRefresh: false`, already set) | G3 |
| D5 Stores | filesystem, IndexedDb, Postgres, MongoDB; all 4 factories registered from Slice 1 | G1 |
| D6 Rows | `miroir-app-miroir/assets/miroir_devData/<entity uuid>/` | G3 |
| D7 Model | Entities → `miroir_model/16dbfe28/`, Reports → `miroir_data/3f2baa83/`, MiroirTests → `miroir_data/a311f363/`, with `git mv`; uuids unchanged; Meta references rewritten per file (table in Slice 2) | G2, G5 |
| D8 Menu | a "Dev data" group in `MiroirMenu` (`eaac459c`) with the 3 history Reports, section `devData`, application Miroir; "Agent runs" → `7a695632` | G3 |
| D10 Environments | Miroir declares `devData` in `dev` (live) and every `test-*` (copy); inherited by `self-test`, `cloud-agent`, `local`, `bench-agent`; not docker, desktop, bundled; the browser indexedDb profile gets a Miroir `devData` entry | G3, G4 |
| D11 Package | `miroir-app-meta` deleted | G5 |
| D12 Regression | a `devData` row lands in `devData` only, at boot and through actions | G1 |
| D13 Code shape | `optionalApplicationSections = ["modelVersion", "devData"]` drives every per-section branch | G2 |
| D14 Testbed | the 3 MiroirTests run on `libraryTestbedInitParams`; `testApplicationStorageConfiguration` gives every testbed a `devData` section | G1, G3 |
| D15 Seeding | seeded rows routed with `getApplicationSection` | G1 |
| D16 Reports | a `devData` key in `DeploymentUuidToReportsEntities` for every application (Miroir's `devData` Reports and Entities); report loads resolve the section with `getApplicationSection` | G1, G3 |
| D17 Helpers | `miroir-app-miroir/scripts/devData/` (not exported); seeds in `miroir-standalone-app/src/miroir-fwk/4-tests/devDataTestSeeds.ts` | G5 |
| D18 Writers | every writer targets the Miroir deployment and `devData` | G3 |
| D19 Delivery | `miroir_devData/` excluded from the Docker and Electron copies | G4 |
| D20 Enums | `devData` added to the fundamental section enum, `storeUnitConfiguration`, `miroirEnvironmentApplication.sections`, the 3 Report section enums; `metaTestbedInitParams` removed from the MiroirTest Entity and its EntityVersion `51c647fe` | G3 |
| D21 Definitions | `devDataEntityDefinitions` boots the section and creates tables lazily; `devData` Entities filtered out of the `model` and `data` boots | G1, G2 |
| D22 Rollback | absent-section mapping for every optional section; cache flag applied to `devData` Entities from both lists | G3, G4 |
| D23 Guard | a write of a `devData` Entity to another section is rejected with a named `Action2Error` | G1 |
| D24 Clear | `clear` / `resetModel` leaves `devData` alone; `deleteStore` drops it | G3 |

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
| Miroir ModelBranch for the moved MiroirTests | `ad1ddc4e-556e-4598-9cff-706a2bde0be7` (the one Miroir's MiroirTests use) |
| TestConfigurations (kept) | `8b8dfbd9-66e9-4afb-87e3-90aa07ccd11b`, `a8dd8a49-97de-426c-beb7-c32d0f1beb26` |
| MiroirTest suites (kept) | `report.bundleSizeHistory`, `report.pageLoadHistory`, `report.agentRunHistory` |
| Nonreg step (new) | `default-miroir-devData-validation` (replaces `default-meta-modelValidation`), scopes `["core"]` |
| Nonreg step (new) | `integ-report.agentRunHistory`, scopes `["ui"]`, `requires: storage`, shared group `standalone-app-report-suites` |
| Nonreg step (re-pointed) | `unit-473-bundle-size-scripts` → `-w miroir-app-miroir`, adds `agentRunRecord.unit` |
| npm scripts (moved) | `bundle-size:record`, `bundle-size:backfill`, `agent-run:record` in `miroir-app-miroir/package.json` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Phase tests (vitest, core) | `RUN_TEST=<name> npm run testByFile -w miroir-core -- <name>` |
| Phase tests (vitest, standalone, filesystem) | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- <name>` |
| Phase tests on another store | `npm run testByFile -w miroir-standalone-app -- <name> --profile emulatedServer-sql` (`-indexedDb`, `-mongodb`; SQL needs PostgreSQL and `MIROIR_POSTGRES_PASSWORD`) |
| Report MiroirTests (integ) | `npm run testMiroir -w miroir-standalone-app -- --suites report.bundleSizeHistory,report.pageLoadHistory,report.agentRunHistory --mode integration` |
| Environment MiroirTest | `npm run testMiroir -w miroir-core -- --suites fn.environment.deriveDeployments --mode unit` |
| Deployment validation | `npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core` |
| Packages the standalone tests consume | `npm run build -w miroir-localcache-redux -w miroir-localcache-zustand -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres -w miroir-store-mongodb -w miroir-store-bundled -w miroir-react` (and `-w miroir-app-meta` while it exists) |
| Environment check | `npm run miroir-env -- check --strict --tracked-clean` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Python checks | `python -m pytest scripts/tests -q` |
| Bundle guard | `python scripts/check_bundle_policy.py <bundle-report.json> <bundle-policy.json>` for the page and for Electron |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared`, and `npm run nonreg:default -- --runner shared` where PostgreSQL runs |

---

## Slice 0 — Characterize the Meta content and the `modelVersion` contracts

**Status:** ✅ DONE

### Goal

Lock today's inventory and the `modelVersion` behaviours that D13 refactors, so every later slice has a diff to check against.

### 0.1 RED → GREEN — inventory lock

**Test:** `packages/miroir-core/tests/1_core/issues/647-devdata-section/devDataInventory.647.phase0.unit.test.ts` (vitest: asset layout across packages, not reachable through a MiroirTest).

Behavior asserted, read from disk:
- the 3 Entities, 6 Reports, 3 MiroirTests of analysis §4.1, by uuid and `name`, at their current paths in `miroir-app-meta/assets/meta_model/`;
- the 28 `BundleSizeMeasurement` and 24 `AgentRunMeasurement` row uuids of today are all present in `meta_data/` (a subset check: recording adds rows, so the counts may only grow);
- `PageLoadMeasurement` has `cache.cacheAllInstancesOnRefresh: false`.

The test takes the expected folder of each kind from one table at its top. Slices 1 and 2 change that table to the target folders (D7), so the same test then proves the move.

### 0.2 Baseline of the `modelVersion` contracts

No new test. Run and record the result of the existing suites listed in analysis §5 ("Tests to mirror"), plus `RunnerIntegTestTools.unit.test.ts` and `miroirEnvShow.unit.test.ts`. They are the safety net of D13 and must stay green, or be updated on purpose, in every slice.

### Validation

```bash
RUN_TEST=devDataInventory npm run testByFile -w miroir-core -- devDataInventory.647.phase0
npm run testByFile -w miroir-core -- persistenceStoreController.sections persistenceStoreControllerManager modelVersionStorage.contract cacheRefreshPolicy versioningModes testbedStorageConfiguration
npm run testByFile -w miroir-env -- testEnvironments miroirEnvDeploy miroirEnvShow
npm run testByFile -w miroir-standalone-app -- RunnerIntegTestTools
npm run testMiroir -w miroir-core -- --suites fn.environment.deriveDeployments --mode unit
```

### Realization

2026-11-01. `devDataInventory.647.phase0.unit.test.ts` written and green (6 tests) on the Meta layout. Baselines green: the miroir-core `modelVersion` suites (63 passed, 1 skipped), `miroir-env` (32), `RunnerIntegTestTools` (16), `fn.environment.deriveDeployments` (14).

---

## Slice 1 — Tracer: Miroir's measurement rows live in `miroir_devData`, and every reader and writer follows

**Status:** ✅ DONE

### Goal

A Miroir maintainer running `test-filesystem` or `dev` reads the bundle size, page load and agent run rows through the Miroir application's `devData` section. `bundle-size:record`, the agent benchmark, the page load recorder and the bundle guard's `history` rule all use `miroir_devData/`. An application without the section reads nothing and gets a named error on write. No store profile breaks: the 4 store types register the section in this slice.

**Layers cut:** ML schema (section enum, `storeUnitConfiguration`, environment schema) → generated types → Entity assets and rows (`git mv`) → `Model.ts` routing and definitions → `PersistenceStoreController` / manager / `ActionRunner` / DomainController rollback → the 4 store factories → `Environment.ts` → environment files and the Miroir Deployment row → recording scripts, bundle guard, page writer.

### 1.1 RED

**Test A:** `packages/miroir-standalone-app/tests/3_controllers/issues/647-devdata-section/devDataSection.647.phase1.integ.test.ts`, on `MIROIR_ENV=test-filesystem`, through `IntegrationTestSession` on environment-derived deployments that no test-storage helper rewrites (vitest: store sections are framework internals, and the asserted file layout is not reachable through a MiroirTest).

Behavior asserted:
- `getInstances` on the Miroir application for `BundleSizeMeasurement`, with no explicit section, returns at least the 28 locked rows;
- a `createInstance` of a `BundleSizeMeasurement` row writes `<test store>/miroir/devData/90d603f9-.../<uuid>.json` and nothing under `data/` (D12);
- a `createInstance` naming `applicationSection: "data"` for the same Entity returns an `Action2Error` (D23);
- on an application whose environment entry declares no `devData` (spotify or appForTest in `test-filesystem`), `getInstances` for `BundleSizeMeasurement` returns an empty collection, and `createInstance` returns the named "devData section is not configured" error;
- a rollback of that application succeeds with the section absent (D22), and the rollback of Miroir does not fetch `PageLoadMeasurement` (D4, D22);
- after closing and reopening the Miroir deployment, the rows are still read (D21 boot);
- `resetModel` on the Miroir deployment leaves the `devData` rows in place (D24).

**Test B:** `fn.environment.deriveDeployments` (MiroirTest `7f14228c`) gains a case with `"sections": { "devData": {} }`. It derives a `devData` store configuration for each store type, named like the `modelVersion` one with `devData` in place of `modelVersion`, and never equal to the data store's name. This locks the `Environment.ts:164` risk.

**Test C:** `miroir-core/tests/1_core/cacheRefreshPolicy.unit.test.ts` gains cases for `isAbsentOptionalSectionError` on both sections, and for `resolveEntitiesToFetchOnRefresh` dropping a lazy `devData` Entity from the model list.

**Test D, recorders (moved, expected folder changed):** `miroir-app-meta/tests/{bundleSizeRecord,bundleSizeBackfill,agentRunRecord}.unit.test.ts` move to `miroir-app-miroir/tests/devData/` and expect `miroir_devData/`. `scripts/tests/test_check_bundle_policy.py`: the `history` rule reads `--dev-data-dir`, defaulting to `miroir-app-miroir/assets/miroir_devData`. `loadTimingWriter.integ.test.ts`: rows go to the Miroir deployment, section `devData`. `loadTimingsSwitch.unit.test.ts`: recording is on only when the Miroir deployment's configuration has `devData`. `loadTimingContract.unit.test.ts`: the uuids match `miroir-app-miroir`'s.

**Test E:** a new `miroir-app-miroir/tests/devData/devDataRows.unit.test.ts` validates every row under `miroir_devData/` against its Entity's `mlSchema`, replacing Meta's `modelValidation` of `meta_data` (D17).

### 1.2 GREEN

1. **Schema (D20).** Add `devData` to `applicationSection` (`getMiroirFundamentalMlSchema.ts:1287`), optional `devData` to `storeUnitConfiguration` (L1842) and to `miroirEnvironmentApplication.sections` (L2160). Extend `generate-ts-types.ts:330` if `devData:` comes out unquoted. Rebuild `miroir-app-miroir`, then `devBuild` `miroir-core`. Update `miroir-mcp/tests/unit/mlElementToTS.unit.test.ts:394` to the new union.
2. **Entities and rows (D7, D6).** `git mv` the 3 Entity files to `miroir-app-miroir/assets/miroir_model/16dbfe28-.../` and set their `selfApplication` to Miroir (`360fcf1f`). `git mv` the rows of `meta_data/90d603f9` and `954de789`, and `0266c0b8/.gitkeep`, to `miroir-app-miroir/assets/miroir_devData/`. Move the `.gitignore:95` rule to `miroir_devData/0266c0b8-.../*.json`. Export the 3 Entities from `miroir-app-miroir/index.ts` and `index.d.ts`, and add them to `defaultMiroirMetaModel.entities` (`src/Model.ts`).
3. **Routing and definitions (D2, D21).** `devDataEntityUuids`, `devDataEntityDefinitions`, `getDevDataEntityDefinition` in `Model.ts`; `getApplicationSection` checks the set right after `versionHistoryEntityUuids`.
4. **Optional sections (D13, D23, D24).**
   - `optionalApplicationSections` in core.
   - `PersistenceStoreController` holds `Partial<Record<OptionalApplicationSection, Store>>`. `getSectionInstanceStore`, the empty-read path, `getInstance`, open, close and `bootFromPersistedState` loop over it.
   - `clear` loops over every optional section except `devData` (D24).
   - `ensureModelVersionStorageForEntity` becomes `ensureOptionalSectionStorageForEntity(section, entityUuid)`, using the section's definitions map.
   - The `model` and `data` boots filter out both routing sets.
   - The D23 guard goes in the write path (L342-417).
   - `PersistenceStoreControllerManager.ts:189-209` and `ActionRunner.ts:85-104, 165-192` loop over the list.
5. **Rollback (D22).** In `cacheRefreshPolicy.ts`, the marker and `isAbsentOptionalSectionError(error, section)`, with `isAbsentModelVersionSectionError` kept as a wrapper. `DomainController.ts:786-813` maps any optional section. `resolveEntitiesToFetchOnRefresh` applies the cache flag to `devData` Entities from both lists.
6. **Environment (D3, D10).** `EnvironmentSectionName`, `environmentSections` and the `sectionConfiguration` suffix (`Environment.ts:60-65, 164`) come from the list. `Deployment.ts:549` and `ModelInitializer.ts:44` take the list or `ApplicationSection`.
7. **The 4 stores (D5).** `miroir-store-filesystem`, `-indexedDb`, `-postgres` and `-mongodb` register their optional-section factories in a loop in `startup.ts`, naming the store from the section. `IndexedDb.levelDatabaseDirectoryNames` (`IndexedDb.ts:45-50`) covers every optional suffix. `miroir-localcache-zustand/.../LocalCacheSlice.ts:161` follows redux.
8. **Declarations (D10).** `"sections": { "modelVersion": {}, "devData": {} }` for Miroir in `environments/dev.json` and `test-filesystem.json`. `configuration.devData` (filesystem, `miroir-app-miroir/assets/miroir_devData`) in the Miroir Deployment row `miroir-app-admin/assets/admin_data/7959d814-.../10ff36f2-....json`. A Miroir `devData` entry in `miroirConfig.browser-emulatedServer-indexedDb.json`. Update `miroir-env/tests/fixtures/dev-deployments.today.json` (`miroirEnvShow`) and `RunnerIntegTestTools.unit.test.ts` if their expectations include the Miroir deployment.
9. **Helpers and recorders (D17, D18).**
   - `git mv` `src/{bundleSizeHistory,agentRunHistory,repoInfo}.ts` and `scripts/*.ts` to `miroir-app-miroir/scripts/devData/`. They import the Entity JSONs from `../../assets/miroir_model/...` and `defaultMiroirMetaModel` from `../../src/Model`, not from `"miroir-app-miroir"`, which would import the package from itself.
   - Add `scripts/**/*.ts` to `miroir-app-miroir/tsconfig.json`. Add the 3 npm scripts to `miroir-app-miroir/package.json`. Add the `miroir-core/model-validation-fs` alias that `miroir-app-meta/vite.config.js` has to `miroir-app-miroir/vite.config.js`.
   - `check_bundle_policy.py`: `DEFAULT_DEV_DATA_DIR`, `--dev-data-dir`, `RECORD_COMMAND` and the docstring with `-w miroir-app-miroir`.
   - `scripts/agent_bench/batch.py:7, 79`: `-w miroir-app-miroir`.
   - `loadTimingWriter.ts`: the Miroir application and deployment, `applicationSection: "devData"`. `loadTimingBrowser.ts:243`: the gate reads `[deployment_Miroir.uuid]?.devData`. `loadTimingConstants.ts`: imports instead of copies. `load-timings.mjs`: folder `miroir_devData/0266c0b8-...`, option `dev-data-folder`.
   - Nonreg manifest: re-point `unit-473-bundle-size-scripts` to `-w miroir-app-miroir` and add `agentRunRecord.unit`; replace `default-meta-modelValidation` (L371) by `default-miroir-devData-validation`; retitle `unit-580-load-timings`.
10. **Meta, until Slice 2.** `Meta.ts` imports the 3 Entities from `miroir-app-miroir` and keeps its Reports, `MetaMenu` and MiroirTests. The seeds and TestConfigurations stay in `Meta.ts` until Slice 2. Rebuild `miroir-app-meta`. Its 3 report MiroirTests fail until Slice 2.
11. Update the Slice 0 inventory table: Entities and rows at their new folders. Add a check that `miroir-app-miroir/index.ts` exports nothing from `scripts/` (D17).

### 1.3 Refactor checkpoint

- `getSectionInstanceStore` no longer sends an unknown section to `data` (analysis §4.2, misaligned).
- Delete `modelVersion`-only helpers made dead by D13, keeping exported names as wrappers.
- `getVersionHistoryEntityDefinition` and `getDevDataEntityDefinition` share one lookup by section.
- `bundleSizeHistory.ts` and `agentRunHistory.ts` both read and write `<devData>/<entity uuid>/<uuid>.json`: one shared `devDataFolder(entityUuid)` helper.

### Validation

**Nonreg scopes:** `smoke,core,actions,tooling,localcache`. The slice changes ML schemas and assets (`core`), the controller, the stores and the page writer step tagged `actions`, `miroir-env` inputs and scripts (`tooling`), and the zustand cache (`localcache`). The `ui` scope and the 3 `integ-report.*` steps wait for Slice 2.

```bash
npm run build -w miroir-app-admin && npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core
npm run build -w miroir-localcache-redux -w miroir-localcache-zustand -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres -w miroir-store-mongodb -w miroir-store-bundled -w miroir-app-meta
for p in miroir-core miroir-app-miroir miroir-localcache-zustand miroir-store-filesystem miroir-store-indexedDb miroir-store-postgres miroir-store-mongodb miroir-standalone-app miroir-mcp; do npx tsc --noEmit --skipLibCheck -p packages/$p/tsconfig.json; done
npm run test -w miroir-core -- ''
RUN_TEST=devDataInventory npm run testByFile -w miroir-core -- devDataInventory.647.phase0
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- devDataSection.647.phase1
npm run testMiroir -w miroir-core -- --suites fn.environment.deriveDeployments --mode unit
npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts tests/devData
npm run testByFile -w miroir-standalone-app -- loadTimingContract loadTimingsSwitch RunnerIntegTestTools
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- loadTimingWriter.integ
npm run testByFile -w miroir-env -- testEnvironments miroirEnvDeploy miroirEnvShow
npm run testByFile -w miroir-mcp -- mlElementToTS
python -m pytest scripts/tests -q
npm run miroir-env -- check --strict --tracked-clean
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,tooling,localcache
```

If the scoped nonreg still selects an `integ-report.*` step, the Realization records it as an expected failure, to be green at the end of Slice 2.

### Realization

2026-11-01. Done as planned, with these differences:

- **Test A** checks the store controller of the server for reads, the D23 guard, the absent-section cases, restart (close, open, boot) and `clear` (D24), and the client DomainController for `createInstance` and the two rollbacks. 10 tests, green. It was written after the code, not before.
- **`resolveEntitiesToFetchOnRefresh`** applies the cache flag to `devData` Entities from the model list; from the data list it already did.
- **D16 moved forward from Slice 2:** `miroir-react` indexes `DeploymentUuidToReportsEntities` with `ApplicationSection`, so the type needs its optional `devData` key as soon as the enum has `devData`. `getReportsAndEntitiesForDeploymentUuid` gives every application a `devData` entry filtered by `metaModelDevDataReports`; it is empty until Slice 2 moves the Reports. Report loads through `getApplicationSection` stay in Slice 2.
- **Bundled refusal moved forward from Slice 3:** `BundledUnsupportedModelVersionStore` takes the section, and the bundled store registers both optional sections in the same loop as the 4 other stores.
- **Enums moved forward from Slice 2 (D20):** `devData` in the 3 Report section enums of `miroir-react`, in `storesOnDemand.ts` (Electron) and in `miroir-env`'s `deployExample.ts`.
- **`loadTimingConstants.ts` keeps copies** of Miroir's uuids instead of importing them: `loadTimingBrowser.ts` loads with the page and imports no package but types. `loadTimingContract.unit.test.ts` checks the copies against `miroir-app-miroir` and `miroir-app-admin`. The gate is `configurationHasSection(config, Miroir deployment, "devData")`, which replaces `configurationListsDeployment`.
- **Recorder flag kept:** the moved scripts keep `--data-dir`, which now means the devData folder; `check_bundle_policy.py` renames its flag to `--dev-data-dir`, and `load-timings.mjs` to `--dev-data-folder`.
- **Meta seeds** use a loose row type (`EntityInstance & Record<string, any>`) until Slice 2 moves them, since the measurement types are in `miroir-app-miroir/scripts/devData/`, outside Meta's `rootDir`.
- **Other tests updated:** `miroir-env` `testEnvironments` accepts the `_devData` schema suffix; `mlElementToTS` expects the 4-value union; the `miroirEnvShow` fixture has Miroir's `devData` directory.
- Refactor checkpoint: `getSectionInstanceStore` gives every optional section its own branch (store or named error), so only `model` and `data` remain for the fallback, and `ApplicationSection` is closed; `getVersionHistoryEntityDefinition` stays exported, with `getOptionalSectionEntityDefinition(section, uuid)` as the shared lookup. The `devDataFolder(entityUuid)` helper was not extracted: the two history modules each take the folder as a parameter already.

Validation, all green: `tsc` on miroir-core, miroir-app-miroir, the localcache and store packages, miroir-react, miroir-mcp, miroir-env, miroir-app-meta; `miroir-standalone-app` and `miroir-standalone-app-electron` show only the 3 errors they show without this change (MUI `Stack` props, CopilotKit options). `npm run test -w miroir-core -- ''` (3285 passed, 1 skipped); inventory (7); Test A (10); `fn.environment.deriveDeployments` (19, with 5 new `devData` cases); miroir-app-miroir `modelValidation` and `tests/devData` (192); `4_view/loadTimings/` (30); `RunnerIntegTestTools`, `testEnvironmentConfig` (20); miroir-env (32); `mlElementToTS` (21); Meta `modelValidation` (12); `pytest scripts/tests` (499 passed, 15 skipped); `miroir-env check --strict`.

Scoped nonreg (`--scope smoke,core,actions,tooling,localcache`) found 5 failures. Fixed: the two `Extractor*PersistenceStoreRunner.integ` steps count Miroir's Entities, so the 3 devData Entities join `miroirModelInitializeCreateEntityOrder`; `mlElementToJsonSchema` expects `devData` in the section enums; the component MiroirTest `ce3f9603` names the first Entity alphabetically, now `AgentRunMeasurement`. All green on rerun (component tests 193 passed, consistency 6). Not fixed, not caused by this change: `build-636-server-release` fails in this container because `miroir-server-library` has no workspace link in `node_modules` and the installed CopilotKit has no `authenticationEnabled` option; `miroir-server` is untouched here. The 3 `integ-report.*` steps stay red until Slice 2.

---

## Slice 2 — The history Reports open on any application's `devData`

**Status:** ✅ done

### Goal

A Miroir maintainer opens "Bundle size history", "Page load history" and "Agent runs" from the Miroir menu, on Miroir's `devData` rows. The same Reports show the `devData` rows of another application (Library in a testbed), which #483 needs.

**Layers cut:** Report, MiroirTest and Menu assets → Report and MiroirTest ML schemas → `Model.ts` per-section Reports → report load section resolution → testbed storage and seeding → miroir-react Report lookup → MiroirTest runner.

### 2.1 RED

**Test A:** the 3 MiroirTests `report.bundleSizeHistory` (`d13c9b9e`), `report.pageLoadHistory` (`24f5c213`) and `report.agentRunHistory` (`ed680b8e`), moved to `miroir_data/a311f363-.../` and re-pointed (D14, table below). Their steps are unchanged, and they fail until the GREEN steps below.

| Field (each of the 3 files) | Today | After |
|---|---|---|
| `selfApplication` | Meta `9ff432a9` | Miroir `360fcf1f` |
| `branch` | Meta `4408382d` | Miroir `ad1ddc4e` |
| `definition.runTarget` | Meta application and deployment `40b74910` | Library application and its deployment |
| `testbedInitApplicationParameters` | `metaTestbedInitParams` | `libraryTestbedInitParams` |
| `report.application` (each reportTestSuite) | Meta | Library |
| `report.applicationSection` | `data` | `devData` |
| `description` | "The Meta app's ..." | names the Miroir `devData` Reports, keeps "(#473)" / "(#580)" / "(#550)" |

**Test B:** the Report mapping, in `fn.model.reportsForSection`, a MiroirTest `functionCallTest` on `getReportsAndEntitiesForDeploymentUuid`, if the function can be registered like the one behind `fn.environment.deriveDeployments`. Otherwise it is a vitest case in `miroir-core/tests/1_core/issues/647-devdata-section/`, with the reason recorded in the Realization. Assertions: for Library, the `devData` key's `availableReports` are the 6 Reports and its `entities` include the 3 Entities; for Miroir, the `data` key does not list them.

**Test C:** a case in `miroir-core/tests/1_core/testConfigurationSection.unit.test.ts` (or next to it): `MiroirMenu` has a "Dev data" group whose 3 items name section `devData`, application Miroir and Reports `e8c6faa5`, `02dd2ead`, `7a695632`.

**Test D:** `RunnerIntegTestTools.unit.test.ts` expects a `devData` section in every test application's storage configuration, for each store type (D14).

### 2.2 GREEN

1. **Assets (D7, D8, D20).**
   - `git mv` the 6 Reports to `miroir_data/3f2baa83-.../` and set their `selfApplication` to Miroir. `git mv` the 3 MiroirTests and rewrite their fields per the table above.
   - Export the Reports from `index.ts` / `index.d.ts`, and add them to `defaultMiroirMetaModel.reports`.
   - Add the "Dev data" group to `MiroirMenu`.
   - Add `devData` to the 3 Report section enums.
   - Remove `metaTestbedInitParams` from the MiroirTest Entity and from its EntityVersion `51c647fe`. First check with `miroirTestTags.unit.test.ts:111, 181` which row the validation reads.
   - Rebuild the schemas.
2. **Reports per section (D16).**
   - `metaModelDevDataReports`. A `devData` key for every application in `getReportsAndEntitiesForDeploymentUuid` and `DeploymentUuidToReportsEntities`. Miroir's `data` key excludes the 6 Reports.
   - Report loads (`reportQueryLoadSegment.ts:262`, `ReportQueryLoadService.ts:56`) resolve the section with `getApplicationSection` when the request names none.
   - The miroir-react section unions (`ReportSectionViewWithEditor.tsx:95`, `OpenReportLaunch.tsx:17`, `EntityInstanceGridInterface.ts:81`) use `ApplicationSection`. `reportInputApplication.ts:61` (`resolveScaffoldingReportApplicationSection`, `buildReportApplicationSwitchUrl`) returns `devData` for a `devData` Report.
3. **Testbeds (D14).** `testApplicationStorageConfiguration` (`runnerIntegTestSupport.ts:202-310`) gives every testbed a `devData` section, one per store type, named like its `modelVersion`. `testApplicationStoreTeardown.ts` drops it.
4. **Seeding (D15).** `Deployment.ts:570-580` routes each seeded collection with `getApplicationSection`.
5. **Seeds (D17).** Move the seeds and the 2 TestConfigurations from `Meta.ts` to `devDataTestSeeds.ts`, with `testbedModel` unset so the Library testbed keeps its own model. Check in `composeIntegTestbedResetParams.ts` that a TestConfiguration without `testbedModel` falls back to the testbed's model; if it does not, set Library's model. `testConfigurationInstanceIndex.ts` imports the seeds from the new module. Delete `metaTestbedInitParams` and its `testbedInitApplicationParametersIndex.ts` case.
6. **Meta.** Remove the moved Reports, MiroirTests and `MetaMenu` from `miroir-app-meta`, and rebuild it. Slice 4 deletes the rest.
7. **Bundle baselines.** Build the page and Electron, and run the bundle guard on both (`miroir-standalone-app/bundle-policy.json`, `miroir-standalone-app-electron/bundle-policy.json`). If either leaves its 2% band, record it with `npm run bundle-size:record -w miroir-app-miroir`, which also adds a `devData` row.
8. Update the Slice 0 inventory table: Reports and MiroirTests at their new folders.

### 2.3 Refactor checkpoint

- `metaModelVersionReports` and `metaModelDevDataReports` share one "Reports of a section" helper in `getReportsAndEntitiesForDeploymentUuid`.
- `testApplicationStorageConfiguration` builds `modelVersion` and `devData` from the same per-store rule.

### Validation

**Nonreg scopes:** full nonreg, closing Slices 1 and 2.

```bash
npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core
npm run build -w miroir-localcache-redux -w miroir-localcache-zustand -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres -w miroir-store-mongodb -w miroir-store-bundled -w miroir-react -w miroir-app-meta
for p in miroir-core miroir-react miroir-standalone-app; do npx tsc --noEmit --skipLibCheck -p packages/$p/tsconfig.json; done
npm run test -w miroir-core -- ''
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- devDataSection.647.phase1
npm run testByFile -w miroir-standalone-app -- RunnerIntegTestTools
npm run testMiroir -w miroir-standalone-app -- --suites report.bundleSizeHistory,report.pageLoadHistory,report.agentRunHistory --mode integration
npm run testByFile -w miroir-core -- miroirTestTags testConfigurationSection
npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts tests/devData
python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
python scripts/check_bundle_policy.py packages/miroir-standalone-app-electron/dist/bundle-report.json packages/miroir-standalone-app-electron/bundle-policy.json
npm run nonreg:filesystem -- --runner shared
```

Manual: `npm run dev -w miroir-standalone-app` on `dev`, open Miroir → Dev data → Bundle size history; the graph shows every recorded point.

### Realization

2026-11-01. Done as planned, with these differences:

- **Test A** (the 3 report MiroirTests, rewritten per the table) is green on `emulatedServer-filesystem`: 6 tests. The page load history needed one more fix the plan did not foresee: its graphs filter on the virtual attribute `series`, which the selectors compute from the Entity row of the deployment's present model. A Library testbed has no `PageLoadMeasurement` in its model, so `findPresentModelEntityFromDomainState` and `findPresentModelEntityFromReduxState` fall back to the fixed devData definition (`getDevDataEntityDefinition`).
- **Test B and C** are one vitest file, `miroir-core/tests/1_core/issues/647-devdata-section/devDataReports.647.phase2.unit.test.ts`, and not MiroirTests: `getReportsAndEntitiesForDeploymentUuid` takes two whole MetaModels, which a JSON fixture would have to copy. 4 tests.
- **Test D** covers the 4 store types in `RunnerIntegTestTools.unit.test.ts`; `testbedStorageConfiguration` (#575 throwaway testbeds) also copies a live `devData` section, with its own case.
- **Seeding (D15)** routes only the devData Entities to `devData`; the other seeded collections stay in `data`, as before. `getApplicationSection` would have sent a seeded meta-model Entity (a Report, for instance) to `model`, which changes what existing suites seed.
- **Report loads** use `defaultReportLoadSection(entityUuid)` per load target when the request names no section (`isReportQueryLoadSegmentSufficient`, `createReportQueryLoadExecutor`). The Report page always names one, so the MiroirTests do not depend on it; a case in `reportQueryLoadSegment.unit.test.ts` does. The miroir-react unions were already `ApplicationSection` (Slice 1).
- **`resolveScaffoldingReportApplicationSection(application, reportUuid?)`** returns `devData` for a devData Report; `buildReportApplicationSwitchUrl` passes the Report. A case in `ReportInputApplication.unit.test.ts`.
- **Seeds (D17):** `devDataTestSeeds.ts` holds the rows and the 2 TestConfigurations (renamed `testConfiguration_devDataBundleSizeSeed` / `_devDataPageLoadSeed`, same uuids), with `testbedModel: defaultLibraryAppModel`: `resolveSuitePlayfieldSeed` requires a model.
- **Menu:** the "Dev data" group's "Agent runs" item opens `AgentRunHistory` (`7a695632`); Meta's menu opened the page load history there.
- **Meta** keeps its SelfApplication, branch and model with the 3 Entities, and no Reports, MiroirTests, menu or seeds; nothing imports it any more. The page bundle policy drops it from its allowlist.
- **Nonreg:** the 2 report steps are retitled, and `integ-report.agentRunHistory` is added (the suite had no step).
- **Bundle baselines:** within their 2% band, no new record. Page 844977 bytes gzipped (baseline 841981, +0.4%); Electron 923982 (baseline 908129, +1.7%). The Electron guard first reported `miroir-example-library` as new: stale `miroir-ai` and `miroir-mcp` dists from before #627; rebuilt, 0 violations.
- Refactor checkpoint: `testApplicationStorageConfiguration` builds `modelVersion` and `devData` from one rule (`optionalSectionStores`). The "Reports of a section" helper was not extracted: `getReportsAndEntitiesForDeploymentUuid` already filters each section in one expression.

Validation, all green: `tsc` on miroir-core, miroir-react, miroir-app-miroir, miroir-app-meta (standalone shows only its 2 pre-existing MUI `Stack` errors); `npm run test -w miroir-core -- ''` (3301 passed, 1 skipped); the 3 report MiroirTests (6); `RunnerIntegTestTools`, `ReportInputApplication`, `componentMiroirTests.consistency`, `multistep.274.phase0` (48); miroir-app-miroir `modelValidation` and `tests/devData` (198); Meta `modelValidation` (2); `pytest scripts/tests -k "nonreg or manifest"` (181). Full `nonreg:filesystem` runs before the PR.

---

## Slice 3 — `devData` on IndexedDb, Postgres and MongoDB in its own store; bundled refuses it

**Status:** ✅ done

### Goal

The `devData` behaviour holds on every store type an environment can choose, in a store of its own, and survives a restart and a teardown. A bundled deployment refuses the section. `miroir-env` deploys it.

**Layers cut:** store sections (already registered in Slice 1) → SQL, MongoDB and IndexedDb naming → bundled refusal → `miroir-env` deploy and state commands → Electron on-demand stores → sandbox bundled data.

### 3.1 RED

**Test A:** `devDataSection.647.phase3.integ.test.ts`, run with `--profile emulatedServer-indexedDb`, `emulatedServer-sql` and `emulatedServer-mongodb` (vitest; store internals, same reason as Slice 1). A `copy` section starts empty on these stores, because `ModelInitializer` seeds only exported JSON (D10). Behavior asserted per store:
- write → read → restart → read on an empty Miroir `devData` section (D21: on SQL, before D21 the read after restart is empty);
- the rows sit in the `devData` store (Postgres schema, MongoDB database, IndexedDb name as derived in Slice 1 Test B), and none in the data store;
- Miroir's `model` and `data` boots create no table, collection or object store for `90d603f9` (D21, no phantom tables);
- the D23 guard and the absent-section cases of Slice 1;
- teardown of a test application drops its `devData` store (no leftover schema or database).

**Test B:** a bundled case in `miroir-core/tests/1_core/versioningModes.bundled.unit.test.ts`: a `devData` write on the bundled store returns the named refusal, and a read is empty.

**Test C:** a `miroir-env/tests/miroirEnvDeploy.unit.test.ts` case: an example with a `<prefix>_devData/` folder is deployed with a `devData` section; `stateCommands` rebuilds `sections.devData` from a Deployment row that has `configuration.devData`.

### 3.2 GREEN

1. `miroir-store-bundled`: `BundledUnsupportedModelVersionStore` becomes `BundledUnsupportedOptionalSectionStore(section)`, registered for each optional section; the old name stays exported.
2. `miroir-env`: `deployExample.SECTIONS` and `stateCommands.ts:205` follow the list (`environmentState.ts:54` already loops over `environmentSections`).
3. `miroir-standalone-app-electron/src/storesOnDemand.ts:11` follows the list.
4. `miroir-sandbox/src/bundledData.ts:160-166` excludes `devDataEntityUuids` from bundled data.
5. `runnerIntegTestSupport.ts:155-191`: the Postgres identifier length check covers the `devData` schema name.
6. Fix whatever Test A shows in the store sections' naming or table creation.

### 3.3 Refactor checkpoint

- The 4 `startup.ts` files register optional sections the same way: if they still repeat the loop body, move it to a core helper that takes the store's factory.

### Validation

**Nonreg scopes:** `smoke,actions,tooling` on filesystem, and the `actions` scope on IndexedDb and SQL.

```bash
npm run build -w miroir-localcache-redux -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-postgres -w miroir-store-mongodb -w miroir-store-bundled
for p in miroir-store-bundled miroir-env miroir-standalone-app-electron miroir-sandbox miroir-standalone-app; do npx tsc --noEmit --skipLibCheck -p packages/$p/tsconfig.json; done
npm run testByFile -w miroir-standalone-app -- devDataSection.647.phase3 --profile emulatedServer-indexedDb
npm run testByFile -w miroir-standalone-app -- devDataSection.647.phase3 --profile emulatedServer-sql
npm run testByFile -w miroir-standalone-app -- devDataSection.647.phase3 --profile emulatedServer-mongodb
npm run testByFile -w miroir-core -- versioningModes.bundled
npm run testByFile -w miroir-env -- testEnvironments miroirEnvDeploy
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,tooling
npm run nonreg -- --runner shared --storage indexedDb --scope smoke,actions
npm run nonreg:default -- --runner shared --scope smoke,actions
```

SQL and MongoDB runs need a running PostgreSQL and MongoDB. Where they are not available, the Realization says which store was not run.

### Realization

2026-11-01. Done, with these differences:

- **Test A** (`devDataSection.647.phase3.integ.test.ts`, 7 tests) is green on `emulatedServer-indexedDb` and `emulatedServer-sql` (a local PostgreSQL 16), and on `test-filesystem` with the teardown case skipped: the filesystem store's `deleteStore` keeps the directories of every section, which predates #647. **MongoDB was not run**: this container has no MongoDB server. The test checks the stores through the controller (rows, restart, D23, D24, absent section, teardown) and each store's name (directory, schema, database or Level name), not through each database's catalog.
- **Restart on SQL** is `storeManagementAction_openStore` (a new controller); a closed SQL controller cannot be opened again (Sequelize closes its connection manager), on every section.
- **Two fixes Test A found on SQL:**
  - The devData boot no longer waits for the model's Entity catalog: on a deployment whose model store is not initialized, `bootFromPersistedState` returned at `getInstances(Entity)` and never booted devData, so a restart read nothing (D21). devData now boots first, from its fixed rows; modelVersion keeps booting from the model's rows.
  - The SQL section lists the Entities it was booted with, not the tables it has, so the devData lazy creation took a missing table for an existing one and the first write failed (the first `PageLoadMeasurement` row of any SQL deployment would have failed the same way). The data section interface gets an optional `hasStorageSpaceForInstancesOfEntity`, implemented by the SQL section (`tableExists`); the controller asks it once per devData Entity (`devDataStorageExists`, reset on `close`), creates the table on first write, and reads nothing before it exists.
- **Test B** tests `BundledUnsupportedOptionalSectionStore` (the new name; `BundledUnsupportedModelVersionStore` stays exported) for the devData refusal, and the bundled Miroir controller for the empty read: the sandbox's bundled configuration declares no devData section, so a write there gets the controller's "not configured" error, not the bundled message. The sandbox's bundled data excludes devData rows along with version history.
- **Test C** deploys GitHub with a `github_devData/` folder. `stateCommands` rebuilds `sections` from every optional section of the Deployment row.
- `runnerIntegTestSupport.ts` needs no length change: `_modelVersion` is the longest suffix the Postgres budget reserves, and `_devData` is shorter.
- Refactor checkpoint: the 5 `startup.ts` loops iterate over `optionalApplicationSections`; each body builds its own store, so no shared helper.

Validation: `tsc` on the 5 store packages, miroir-env, miroir-sandbox (standalone: its 2 pre-existing errors); `versioningModes.bundled` (4); miroir-env `testEnvironments`, `miroirEnvDeploy`, `miroirEnvShow` (33); Test A on IndexedDb (7), SQL (7), filesystem (6 + 1 skipped) with the Slice 1 test (10). Scoped nonreg `nonreg:filesystem --runner shared --scope smoke,actions,tooling`: 46 passed, 1 failed, `build-636-server-release`, the container issue of Slice 1 (no `miroir-server-library` workspace link). Four steps failed in the shared runner and passed when re-run alone, which the runner does by design. The IndexedDb and SQL nonreg runs come with the full runs before the PR.

---

## Slice 4 — Delete `miroir-app-meta`; deliveries, docs, nonreg, cleanup, AC

**Status:** ✅ done

### Goal

No application named Meta remains, deliveries ship no `devData` row, and the docs describe the section.

### 4.1 RED

- `devDataInventory.647.phase0.unit.test.ts` gains a last case: `packages/miroir-app-meta` does not exist, and no tracked file outside `code-helpers/` and the test file itself names `miroir-app-meta`, `9ff432a9-89a1-460b-a263-1672d084a9e0` or `40b74910-4c63-4bd9-8e7d-2bc051342908` (checked with `git grep`; the test builds these strings by concatenation, so it does not match itself).
- A delivery check (Python, `scripts/tests/test_delivery_assets.py`): the Electron `extraResources` filter and the Docker copy exclude `*_devData/`. The test reads `miroir-standalone-app-electron/package.json` and the `Dockerfile` / `.dockerignore` rules, because building the image is too slow for the gate.

### 4.2 GREEN

1. Delete `packages/miroir-app-meta` with its `assets/deployment/` rows; the Meta SelfApplication and Deployment rows in `miroir-app-admin/assets/admin_data/`; the `meta` entries of `environments/dev.json`, `test-filesystem.json`, `test-sql.json`, `test-indexedDb.json`, `test-mongodb.json` and `self-test.json`; deployment `40b74910` in `miroirConfig.browser-emulatedServer-indexedDb.json:112`.
2. Drop `miroir-app-meta` from `miroir-standalone-app/package.json`, `bundle-policy.json:419`, `build-all.sh:86, 108, 110, 701`, `Dockerfile:79`, the 3 workflows and `nonreg-manifest.json:381`. Run `npm install` to update `package-lock.json`.
3. Tests that list environments or asset folders: `miroirEnvShow.unit.test.ts:31`, `testEnvironmentConfig.unit.test.ts:28`, `multistep.274.phase0.unit.test.ts:57`.
4. Nonreg manifest: retitle `integ-report.bundleSizeHistory` (L1551) and `integ-report.pageLoadHistory` (L1589) without "Meta"; add `integ-report.agentRunHistory` (allocated above).
5. Delivery (D19): an Electron `extraResources` filter `["**/*", "!miroir_devData/**"]`; a `.dockerignore` rule, or `rm -rf /seed/miroir-app-miroir/assets/miroir_devData` after the `COPY` at L155.
6. Docs: `docs/reference/data-architecture-deployments.md` (the `devData` section next to `modelVersion`, folder layout, the D1 definition), `environments.md` (`sections.devData`, D10), `testing.md`, `load-timings.md` and `internals/code-splitting.md` (commands and folders).
7. Cleanup (#238 rule): move the lasting assertions of the `issues/647-devdata-section/` directories into feature suites. These are a `devDataSection.integ.test.ts` next to the store tests, and the inventory and no-Meta cases in `miroir-app-miroir/tests/devData/devDataLayout.unit.test.ts`, with the uuid subset check and no exact counts. Then delete the issue directories.

### 4.3 Tracer narrative

Manual: on `dev`, record a bundle size with `npm run bundle-size:record -w miroir-app-miroir -- <report>`, open Miroir → Dev data → Bundle size history and see the new point, then build the Docker image and check that `/seed/miroir-app-miroir/assets/` has no `miroir_devData/`. Automated equivalent: `bundleSizeRecord.unit.test.ts`, `report.bundleSizeHistory` (integ) and `test_delivery_assets.py`.

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
npm run nonreg:default -- --runner shared
```

### AC checklist

| Acceptance criterion (#647) | Proof |
|---|---|
| `devData` is an `ApplicationSection`, routed by `devDataEntityUuids`, supported by filesystem, IndexedDb, Postgres and MongoDB; bundled refuses it | ✅ `devDataSection.integ` (filesystem, IndexedDb, SQL; MongoDB not run here), `devDataSection.filesystem.integ`, `versioningModes.bundled` |
| `miroir-env check` accepts `sections.devData` and deploys the section | ✅ `fn.environment.deriveDeployments` (Slice 1 Test B), the new `miroirEnvDeploy` case (Slice 3 Test C), `miroir-env check --strict` |
| The 3 Entities, their Reports and MiroirTests live in `miroir-app-miroir` with uuids unchanged, rows in `miroir_devData/` | ✅ `devDataLayout`, `devDataRows` |
| Recording commands, the `history` rule, the agent bench and page load recording use `miroir_devData/` | ✅ Slice 1 Test D |
| The 3 history Reports open from the Miroir menu in `dev` | ✅ Slice 2 Test C (menu items), the 3 report MiroirTests (Reports on `devData` rows), Slice 2 manual check on `dev` |
| `packages/miroir-app-meta` is gone and nothing references it | ✅ `devDataLayout` "leaves no Meta application" |
| The docs describe the `devData` section | ✅ Slice 4 docs list, review |
| `nonreg:unit` and `nonreg:filesystem` pass | Slice 4 Validation |

### Realization

2026-11-01. Done, with these differences:

- **Cleanup (#238):** the issue directories are gone; their lasting cases moved with `git mv`:
  - `miroir-app-miroir/tests/devData/devDataLayout.unit.test.ts` (from the Slice 0 inventory): Entities, Reports and MiroirTests by uuid and name, the tracked rows as a subset, and the new "leaves no Meta application" case (`git grep` outside `code-helpers/` and the `*_devData/` rows, one of which gives a past reason that names Meta);
  - `miroir-core/tests/1_core/devDataReports.unit.test.ts` (Slice 2): the Reports per section and the `Dev data` menu group;
  - two integration files instead of one, in `miroir-standalone-app/tests/3_controllers/`: `devDataSection.integ.test.ts` (Slice 3, every store, step `integ-devData-section`, `requires: storage`) and `devDataSection.filesystem.integ.test.ts` (Slice 1, step `integ-devData-section-filesystem`), which keeps only what the shared file does not cover on filesystem: the tracked rows of the seeded copy, the files on disk, rollback without the page load rows, close and reopen. The Slice 1 cases that every store shares (D23, absent section, D24) are now only in the shared file.
- **Delivery (D19):** Electron filters `!miroir_devData/**`; Docker excludes `packages/*/assets/*_devData` in `.dockerignore`. `scripts/tests/test_delivery_assets.py` (2 tests) reads both rules.
- **Docs:** besides the planned pages, `loadTimingsTour.integ.test.ts` expected the tour's old output ("recorded in the Meta app"); it now expects "recorded in Miroir's devData", which the tour has printed since Slice 1. That tour is on demand, outside nonreg.
- `bundle-policy.json` had already lost `miroir-app-meta` in Slice 2, and the nonreg manifest's Meta validation step had become `default-miroir-devData-validation` in Slice 1; it now also runs `devDataLayout`.


**Code review (before the PR), fixed:**

- On SQL, the storage probe answered "no" for an Entity the section had not registered (a controller opened but not booted), and a "no" leads to `createStorageSpaceForInstancesOfEntity`, which drops the table (`sync({ force: true })`). `hasStorageSpaceForInstancesOfEntity` now takes the Entity and asks the schema whether its table exists, registered or not.
- Concurrent first writes of a devData Entity (two tabs flushing page loads) each probed "no" and each created the table, the second dropping the first one's rows. The controller now shares one creation per Entity. Test: "creates a fresh devData store once for concurrent first writes" in `devDataSection.integ` (IndexedDb, SQL; skipped on filesystem, whose test application rows outlive `deleteStore`).
- `getInstance` of a devData Entity with no storage yet returned the store's missing-table error; it now says no row was written yet.
- `resetData` (`clearDataInstances`) and Miroir's model initialization created data storage for the devData Entities (phantom tables, the #234 problem). Both now leave them out: the initialization writes their Entity rows to the model only.
- A report load read a devData Entity from the requested section when one was named (a page or link on `data`), while the local cache selectors look for its rows in `devData`. `reportLoadSection` (was `defaultReportLoadSection`) now always reads devData Entities from `devData`.
- `metaModelDevDataReports` lists the exported Report objects' uuids instead of literals; the IndexedDb store's Level directory names use `optionalApplicationSections`.

**Code review, kept as decided:**

- `clear` (resetModel) keeps the devData rows on every deployment, test ones included: D24. A test application's devData store goes with `deleteStore`.
- The refresh reads the refresh-cached devData Entities of every application, which costs one empty read each where the section is absent (the controller answers without store I/O): D16 lets any application open the history Reports on its devData.

**PR review (Greptile), fixed:**

- Two servers on one SQL deployment: a "no" kept by one controller, then its creation, could drop the table the other server had created and filled. A "no" is now asked again at the next read or write, and SQL offers `createStorageSpaceForInstancesOfEntityIfMissing` (`CREATE TABLE IF NOT EXISTS`), which the devData creation uses when the store has it.
- `runReportAction` (#562) ran every Report query on the `data` store; the server picks the store from the action's section, so the history Reports read nothing. A query that reads only devData Entities now runs on `devData` (`partSection`, tested in `runReportAction.unit`).
- A `dev` or `local` state from before keeps the Meta Deployment rows: `environments.md` says to run `miroir-env prune` once.

