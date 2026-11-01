# 647 — Replace `miroir-app-meta` with a `devData` application section

> A new optional application section, `devData`, holds the information about an application that is not
> needed to deploy or use it. Its Entities are defined once in `miroir-app-miroir`, like the
> version-history Entities of `modelVersion`. The content of `miroir-app-meta` (3 measurement Entities,
> 6 Reports, 3 MiroirTests, their rows) moves into the Miroir application, and the package is deleted.

Related issue: https://github.com/miroir-framework/miroir/issues/647
Replaces the application decision of: [#473 bundle size history](../473-FEATURE-bundle-size-history/analysis.md) ✅ (created `miroir-app-meta`)
Pattern copied: [#232 dedicated modelVersion storage](../232-FEATURE-dedicated-model-version-storage/) ✅
Content moved: [#580 page load timings](../580-FEATURE-page-load-timings/analysis.md) ✅ · [#583 page load history by build mode](../583-FEATURE-page-load-history-by-build-mode/analysis.md) ✅ · [#550 agent cost measurement](../550-FEATURE-agent-cost-measurement/analysis.md) ✅
Unblocks: [#483 test run history for any application](https://github.com/miroir-framework/miroir/issues/483) · [#474 nonreg run history](https://github.com/miroir-framework/miroir/issues/474)
Key sources: [`Model.ts` (core)](../../../packages/miroir-core/src/1_core/Model.ts) · [`PersistenceStoreController.ts`](../../../packages/miroir-core/src/4_services/PersistenceStoreController.ts) · [`Environment.ts`](../../../packages/miroir-core/src/1_core/environment/Environment.ts) · [`Deployment.ts`](../../../packages/miroir-core/src/1_core/Deployment.ts) · [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts) · [`getMiroirFundamentalMlSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts) · [`runnerIntegTestSupport.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/runnerIntegTestSupport.ts) · [`packages/miroir-app-meta/`](../../../packages/miroir-app-meta/)

**Document role:** analysis and decision record.
**Status:** D1–D12 are A's decisions from the grilling (2026-11-01, two rounds, recorded in the issue). D13–D23 are mechanism choices found while mapping the code. They are proposed here and wait for A's review. Three of A's decisions are corrected by facts found later: D7 (folders), D9 (no Miroir testbed exists, see D14) and D4 (`PageLoadMeasurement` is already lazy). They are marked "Corrected" below.

**Document history:** first draft 2026-11-01, then revised the same day after an adversarial review against the code. The review found that Reports live in `miroir_data/`, not `miroir_model/` (D7). It also found that a non-Miroir application's `devData` store cannot find its Entities at boot (D21), that the rollback fetches `devData` Entities for every application (D22), that a testbed gets its stores from test storage helpers rather than from init parameters (D14), and 9 wrong counts or missed references, all corrected below.

Facts checked on `_integration` at `0563762` (2026-11-01).

---

## 1. Goals

| Id | Story |
|---|---|
| G1 | **Keep development information with its application.** In order to keep the history of how my application is built and tested next to it, and to drop it with it, as an application developer, I can store rows in my application's own `devData` section. |
| G2 | **Define a kind of development information once.** In order to give every application a new kind of history (test runs in #483, nonreg runs in #474) without copying Entities, as a Miroir maintainer, I add one Entity to `miroir-app-miroir` and every application can store its rows. |
| G3 | **Keep the platform's history readable.** In order to keep following bundle sizes, page loads and agent runs, as a Miroir maintainer, I open the same history Reports from the Miroir menu, on the same rows, recorded by the same commands. |
| G4 | **Ship without development rows.** In order to keep a delivered application free of its development history, as an application maintainer, I leave `devData` out of the delivery environment, and no `devData` row is loaded or shipped. The `devData` Entities and Reports still ship, as part of the Miroir meta-model. |
| G5 | **One meaning per word.** In order to read the code without guessing, as a contributor, I find "meta" naming only the meta-model, and no application named Meta. |

## 2. Non-goals

| Excluded | Owner |
|---|---|
| Test run Entities, the Miroir Tests recorder, a menu entry for every application with `devData` | #483 |
| Nonreg run recording | #474 |
| Moving MiroirTests and TestConfigurations to `devData`, pruning deliveries of them | follow-up, unscheduled |
| Showing model, `modelVersion` and `devData` Entities apart in the UI | follow-up, unscheduled (A: probably a UI matter only) |
| Choosing which sections a rollback loads | follow-up, general mechanism (A, round 1 Q5) |
| Hiding the "Dev data" menu items where the section is absent | follow-up (D8 note) |
| A production "watch" mode | follow-up, unscheduled |
| Application-defined `devData` Entities (an Entity attribute deciding the section) | rejected (D2) |
| #239 for `modelVersion` (boot writes EntityVersion rows into data) | #239; D23 handles the same risk for `devData` |

## 3. Decision record

| # | Decision | Choice | Serves | Status |
|---|---|---|---|---|
| D1 | Section name | **`devData`** | G5 | Accepted (A) |
| D2 | Routing | **fixed `devDataEntityUuids` set in `getApplicationSection`, after `versionHistoryEntityUuids`** | G2 | Accepted (A) |
| D3 | Presence | **optional, declared per application** (environment `sections.devData`, Deployment `configuration.devData`); bundled store refuses it | G1, G4 | Accepted (A) |
| D4 | Boot | **loaded at rollback when declared**. `PageLoadMeasurement` already has `cache.cacheAllInstancesOnRefresh: false`, and D22 makes the rollback honour it | G3 | Accepted (A), corrected |
| D5 | Stores | **filesystem, IndexedDb, Postgres, MongoDB** | G1 | Accepted (A) |
| D6 | Owner of today's rows | **the Miroir application** (`miroir-app-miroir/assets/miroir_devData/`) | G3 | Accepted (A) |
| D7 | Model location | **Entities in `miroir_model/16dbfe28/`, Reports in `miroir_data/3f2baa83/`, MiroirTests in `miroir_data/a311f363/`**, where Miroir keeps each kind; uuids unchanged. The Meta SelfApplication, Deployment, ModelBranch and Menu rows are deleted, with `metaInitApplicationVersion` (a code object) | G2, G5 | Accepted (A), corrected |
| D8 | Menu | **"Dev data" items in `MiroirMenu`, section `devData`**; generic per-application entry in #483. Where the section is absent (deliveries), the items open empty Reports | G3 | Accepted (A) |
| D9 | MiroirTests testbed | ~~Miroir testbed~~ → D14 | G3 | Corrected |
| D10 | Environments | **`dev` live, every `test-*` copy, for Miroir; not docker, desktop, bundled.** `self-test` extends `dev` and inherits it | G3, G4 | Accepted (A) |
| D11 | Package | **`miroir-app-meta` deleted; helpers, scripts, tests move to `miroir-app-miroir`** | G5 | Accepted (A) |
| D12 | #239 | **separate; a regression test checks `devData` rows land in `devData` only** | G1 | Accepted (A) |
| D13 | Code shape for a second optional section | **one list of optional sections, used where code names `modelVersion` as an optional store** | G2 | Proposed |
| D14 | Testbed of the 3 moved MiroirTests | **a Library testbed; every testbed's storage gets a `devData` section** | G1, G3 | Proposed |
| D15 | Seeding `devData` rows in a testbed | **route seeded rows with `getApplicationSection`** | G1 | Proposed |
| D16 | How a Miroir Report reaches another application's `devData` | **a `devData` key in `DeploymentUuidToReportsEntities` for every application, with Miroir's `devData` Entities and Reports; report loads resolve the section with `getApplicationSection`** | G1, G3 | Proposed |
| D17 | Where the Node helpers and test seeds live | **helpers and scripts in `miroir-app-miroir/scripts/devData/`, not exported by `index.ts`; seeds in the standalone app's test infrastructure** | G5 | Proposed |
| D18 | Writers | **every writer targets the Miroir deployment with `applicationSection: "devData"`** | G3 | Proposed |
| D19 | Delivery copies | **Docker and Electron leave `miroir_devData/` out of the copied assets** | G4 | Proposed |
| D20 | Enums naming sections and testbeds | **extend the Report Entity's 3 section enums and the MiroirTest testbed enum (Entity and its EntityVersion row)** | G3 | Proposed |
| D21 | Entity definitions for a `devData` store | **a static `devDataEntityDefinitions` map, used to boot the section and to create tables lazily; `devData` Entities filtered out of the `model` and `data` boots** | G1, G2 | Proposed |
| D22 | Rollback of `devData` Entities | **generalise the absent-section mapping; apply the cache flag to `devData` Entities; fetch nothing when the deployment has no `devData` store** | G3, G4 | Proposed |
| D23 | A `devData` row written to another section | **rejected with a named error by `PersistenceStoreController`** | G1 | Proposed |

**Rationale.** D1–D12 settle what A asked for. D13–D23 come from §4: the `modelVersion` pattern is spread over about 35 places, one of them (`Environment.ts:164`) would silently put `devData` in the model/data store if left as is, the `devData` Entities live in Miroir's model while their rows live in another application's deployment, no Miroir testbed exists, and `miroir-app-miroir` cannot import `miroir-core` at runtime from its `index.ts`.

### D7 correction — folders

A's answer was "Reports in `miroir-app-miroir`'s model". In the Miroir application, `miroir_model/` holds only Entity rows (`16dbfe28/`, 35 files). Its Reports are in `miroir_data/3f2baa83/` (43 files), because `getApplicationSection(Miroir, Report)` returns `data` (`Model.ts:209-211`) and the local cache reads Miroir's Reports from `data` (`miroir-localcache-redux/src/4_services/localCache/Model.ts:95-96`). The version-history Reports follow the same rule (`miroir_data/3f2baa83-.../f9aff35d, acd55b04, 0810de28, 17e78252`). So "the Miroir model" is the meta-model, `defaultMiroirMetaModel`, and its rows sit where Miroir keeps each kind.

### D13 — Code shape for a second optional section

**Status:** Proposed. **Serves:** G2.

`modelVersion` is handled by name in about 25 branches (§4.2). `devData` behaves the same way in each of them: optional, empty reads when absent, named write error when absent, lazy table creation on first write, opened, closed and cleared with the deployment.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D13-a. Copy each branch | a `devData` branch next to each `modelVersion` branch (`devDataStoreSection` field, `ensureDevDataStorageForEntity`, `isAbsentDevDataSectionError`, one more factory per store) | smallest diff per site; `modelVersion` code untouched | about 25 duplicated branches; the next optional section copies them again |
| **D13-b. One list of optional sections** ★ | `optionalApplicationSections = ["modelVersion", "devData"] as const` in core. `PersistenceStoreController` keeps a `Partial<Record<OptionalApplicationSection, Store>>`. The manager, `ActionRunner` create/delete, `environmentSections`, the `sectionConfiguration` suffix, `testbedStorageConfiguration`, `testApplicationStorageConfiguration`, `testApplicationStoreTeardown`, `deployExample.SECTIONS`, Electron `storesOnDemand.SECTIONS`, `Deployment.ts:549` and `IndexedDb.levelDatabaseDirectoryNames` iterate it. The absent-section error marker names the section | one mechanism; a new optional section is one list entry, its routing set and its definitions map | touches working `modelVersion` code; the `modelVersion` tests (§5) must stay green |

**Decision (proposed):** D13-b. Each store's `startup.ts` registers its optional-section factories in a loop over the list, naming the store from the section (`-modelVersion`, `-devData`). `isAbsentModelVersionSectionError` stays exported as a wrapper, because `miroir-core/src/index.ts:1046-1050` exports it.

### D14 — Testbed of the 3 moved MiroirTests (corrects D9)

**Status:** Proposed. **Serves:** G1, G3.

D9 assumed a Miroir testbed. The `testbedInitApplicationParameters` values are `libraryTestbedInitParams` (17 MiroirTests), `libraryVersionedTestbedInitParams` (1), `appForTestTestbedInitParams` (1), `githubTestbedInitParams` (1) and `metaTestbedInitParams` (3), 23 in all. None deploys the Miroir application, and a test may not reset the live Miroir deployment.

A testbed's stores do not come from its init parameters. `InitApplicationParameters` has no section field, and `libraryVersionedTestbedInitParams` only sets `versioningMode`. The stores come from two helpers:

| Run | Helper | Sections today |
|---|---|---|
| UI integration (vitest, nonreg `integ-*`) | `testApplicationStorageConfiguration`, `runnerIntegTestSupport.ts:202-310` | `model`, `data`, `modelVersion` hard-coded per store type; IndexedDb `model` and `data` share one name |
| In-app Miroir Tests menu | `testbedStorageConfiguration`, `miroir-core/src/5_tests/testbedStorageConfiguration.ts:50-67`, from `RunMiroirTestAction.ts:367` | copies the live application's configuration, adding `modelVersion` with suffix `_modelVersion` when present |

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D14-a. A Miroir testbed | a new `miroirTestbedInitParams` deploying a copy of the Miroir application | matches D9 literally | a testbed of the meta-model itself is new; the assets are 5.6 MB; no other test needs it |
| **D14-b. Library testbed, `devData` in every testbed** ★ | the 3 MiroirTests use `libraryTestbedInitParams`. Both helpers above always give a testbed a `devData` section (suffix `_devData`), whatever the source configuration says, and `testApplicationStoreTeardown.ts` drops it. The seeds go to the testbed's `devData` (D15); the Reports are shown against the testbed with section `devData` | proves G1 ("any application") on the application #483 will use; no new init parameters; testbeds are temporary, so an extra empty store costs nothing outside tests | the Reports show "Library" measurements, which are fixed seeds anyway; every testbed opens one more store |
| D14-c. Declare `devData` for Library in the environments | amend D10 so Library declares `devData` in `dev` and `test-*`; `testbedStorageConfiguration` then copies it | the live configuration says the truth | changes A's D10; `dev` gets an empty `library_devData/` before #483 needs it |

**Decision (proposed):** D14-b. The `runTarget` of the 3 MiroirTests changes from the Meta application to Library, `report.application` becomes Library and `report.applicationSection` becomes `devData`. `metaTestbedInitParams` is deleted.

### D15 — Seeding `devData` rows in a testbed

**Status:** Proposed. **Serves:** G1.

`resetAndinitializeDeploymentCompositeAction` (`Deployment.ts`) creates the testbed model's Entities (`resolvedMetaModel.entities`, L456-460 and L515-524) and inserts every seeded row with `applicationSection: "data"` (L570-580). With D14-b the testbed model is Library's, so no `devData` Entity reaches `createEntity`. Only the rows are misrouted.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D15-a. Route by `getApplicationSection`** ★ | each seeded collection goes to `getApplicationSection(applicationUuid, entity.uuid)` | same rule as the meta-model objects of the same action (L543-561) | changes a shared action; covered by the D12 regression test |
| D15-b. A separate `testbedDevDataInstances` field | the seed lists `devData` rows apart | no change to routing | a second seed shape; #483 and #474 would need it too |

### D16 — How a Miroir Report reaches another application's `devData`

**Status:** Proposed. **Serves:** G1, G3.

`ReportDisplay.tsx:72-93` (miroir-react) looks a Report up in `deploymentUuidToReportsEntitiesMapping[deployment][section].availableReports`, then in the application's own model. `ReportSectionListDisplay.tsx:256-273` and `ReportSectionViewWithEditor.tsx:189-203` take `entities` from the same mapping and fall back to `currentModel.entities`, which for Library holds only Library's Entities. `getReportsAndEntitiesForDeploymentUuid` (`Model.ts:227-278`) builds `model`, `modelVersion` and `data` for Miroir, and `model` and `data` for other applications.

**Decision (proposed):**

- Add `metaModelDevDataReports` (the 6 Report uuids).
- Add a `devData` key for every application, with `availableReports` and `entities` taken from the Miroir meta-model (the `devData` Reports and Entities).
- Exclude those Reports from Miroir's `data` key, as `metaModelVersionReports` are.
- Local-cache queries need no change: an extractor without an explicit section uses `getApplicationSection` (`QuerySelectors.ts:723-725`), which D2 sends to `devData`.
- Report loads default to `"data"` (`reportQueryLoadSegment.ts:262`, `ReportQueryLoadService.ts:56`). They resolve the section with `getApplicationSection` per target Entity when the request names none. Without this, `PageLoadHistory` (a lazy Entity) loads nothing unless the page section happens to be `devData`.

### D17 — Where the Node helpers and test seeds live

**Status:** Proposed. **Serves:** G5.

`miroir-core` imports `miroir-app-miroir` at runtime (`ReduxDeploymentsStateQuerySelectors.ts:29`). `miroir-app-miroir/index.ts` exports JSON plus `src/Model.ts`, which imports `miroir-core` with `import type` only. `Meta.ts` calls `getMiroirFundamentalSchemaForDeployment` from `miroir-core` at runtime, and `bundleSizeHistory.ts` / `agentRunHistory.ts` use `node:fs`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D17-a. Scripts folder, seeds in test infrastructure** ★ | `bundleSizeHistory.ts`, `agentRunHistory.ts`, `repoInfo.ts` and the 3 record and backfill scripts go to `miroir-app-miroir/scripts/devData/`, run with `tsx` (already a devDependency), never imported by `index.ts`. `tsconfig.json` `include` gains `scripts/**/*.ts`. The seeds and the 2 TestConfigurations go to `miroir-standalone-app/src/miroir-fwk/4-tests/devDataTestSeeds.ts`, next to `uiIntegrationPlayfieldSeeds.ts`. `getDefaultMetaModelEnvironment` and `defaultMetaAppModel` are deleted, since nothing outside `miroir-app-meta` uses them | no runtime cycle; Node code stays out of the page; test seeds sit with the other playfield seeds | none found |
| D17-b. Export from `index.ts` | as today's `miroir-app-meta/index.ts` | one import path | a runtime cycle `miroir-core → miroir-app-miroir → miroir-core`, and `node:fs` code in a package the page imports eagerly |

The 4 unit tests move to `miroir-app-miroir/tests/devData/`. Meta's `modelValidation.unit.test.ts` validates the `meta_data` rows, and Miroir's `modelValidation` covers `defaultMiroirMetaModel` only, so a new test validates every `miroir_devData/` row against its Entity. The nonreg step `default-meta-modelValidation` (`nonreg-manifest.json:371`) is replaced by that test's step, and the `integ-report.bundleSizeHistory` and `integ-report.pageLoadHistory` steps (L1551, L1589) are renamed.

### D18 — Writers

**Status:** Proposed. **Serves:** G3.

| Writer | Today | After |
|---|---|---|
| `recordBundleSize.ts`, `backfillBundleSize.ts` | `miroir-app-meta/assets/meta_data/90d603f9-.../` | `miroir-app-miroir/assets/miroir_devData/90d603f9-.../` |
| `recordAgentRun.ts` (called by `scripts/agent_bench/batch.py:79`) | `meta_data/954de789-.../` | `miroir_devData/954de789-.../`; `batch.py` calls `-w miroir-app-miroir` |
| `loadTimingWriter.ts` (page) | `createInstance` on the Meta deployment, `applicationSection: "data"` | on the Miroir deployment (`10ff36f2`), `applicationSection: "devData"` |
| `loadTimingBrowser.ts:243` gate | the configuration lists the Meta deployment | the Miroir deployment's store configuration has `devData` (`configurationListsDeployment` reads `StoreUnitConfiguration` per deployment, so `[deployment_Miroir.uuid]?.devData` is available in both client modes) |
| `load-timings.mjs` (reads) | `meta_data/0266c0b8-.../`, option `meta-folder` | `miroir_devData/0266c0b8-.../`, option renamed `dev-data-folder` |
| `check_bundle_policy.py` `history` rule | `DEFAULT_META_DATA_DIR`, flag `--meta-data-dir`, `RECORD_COMMAND -w miroir-app-meta` | `miroir-app-miroir/assets/miroir_devData`, flag `--dev-data-dir`, `-w miroir-app-miroir` |

`loadTimingConstants.ts` keeps copies of the Meta uuids so the page does not import the Meta model. After the move, the Miroir application and deployment are already eager, so the copies are replaced by imports from `miroir-app-miroir` and `miroir-app-admin`. `loadTimingBrowser` starts observing at module load, so the new imports change module evaluation order; `loadTimingContract.unit.test.ts` and `loadTimingsSwitch.unit.test.ts` check it.

### D19 — Delivery copies

**Status:** Proposed. **Serves:** G4.

Not declaring `devData` keeps it unloaded, but the files still ship: `Dockerfile:155` copies `miroir-app-miroir/assets` whole, and Electron copies it through `extraResources` (`miroir-standalone-app-electron/package.json:87-88`). With D6 the 28 bundle size rows and 24 agent runs (42 644 bytes) would land in both.

**Decision (proposed):** exclude `miroir_devData/` in both copies (an Electron `filter` entry, a `.dockerignore` rule or a `rm -rf` after the Docker `COPY`), and add a check that the delivered tree has no `*_devData/` folder.

### D20 — Enums naming the sections and testbeds

**Status:** Proposed. **Serves:** G3.

| Enum | Location | Change |
|---|---|---|
| `applicationSection` (fundamental) | `getMiroirFundamentalMlSchema.ts:1287`, `storeUnitConfiguration` L1842, `miroirEnvironmentApplication.sections` L2160 | add `devData` |
| Report Entity inline section enums | `miroir_model/16dbfe28-.../3f2baa83-....json:1078, 1722, 1810` | add `devData` |
| Report Entity `storedReportDisplay…applicationSection` | same file, `["data", "model"]` | unchanged (stored display parameters, no `modelVersion` either) |
| Report EntityVersion | `miroir_modelVersion/54b9c72f-.../952d2c65-....json` | unchanged: its `mlSchema` already differs from the Report Entity's, so it is a frozen history row, not a copy to keep in sync |
| MiroirTest `testbedInitApplicationParameters` | Entity `miroir_model/16dbfe28-.../a311f363-....json` and its EntityVersion `miroir_modelVersion/54b9c72f-.../51c647fe-....json:413` | remove `metaTestbedInitParams` from both. `miroirTestTags.unit.test.ts:111, 181` validate MiroirTest instances against the EntityVersion's schema, so the plan checks first whether that row is a frozen version or the current one |
| `generate-ts-types.ts:330` | quotes `modelVersion:` keys by regex | add `devData:` if jzod-ts emits it unquoted |

### D21 — Entity definitions for a `devData` store

**Status:** Proposed. **Serves:** G1, G2.

A store section creates and reads one table (SQL), collection (MongoDB) or object store (IndexedDb) per Entity. `bootFromPersistedState` (`PersistenceStoreController.ts:488-556`) boots `data` and `modelVersion` from the application's own Entity rows (`modelStoreSection.getInstances(entityEntity)`, L507-527). Library's model never holds the `devData` Entities, which are Miroir's. On SQL, an unregistered Entity reads as an empty collection (`sqlDbInstanceStoreSectionMixin.ts:510-527`), so after a restart Library's `devData` rows would silently read as empty. The lazy path `ensureModelVersionStorageForEntity` (L677-719) finds an Entity only in the application's model or in the static `versionHistoryEntityDefinitions` map (`Model.ts:174-200`). And because the 3 Entities join `defaultMiroirMetaModel.entities`, the `model` boot (L491) and Miroir's `data` boot (L527) would create phantom tables for them, the problem #234 fixed for version history.

**Decision (proposed):** a static `devDataEntityDefinitions` map in `Model.ts`, built from the 3 Entity JSONs, with `getDevDataEntityDefinition(uuid)`. D13-b generalises `ensureModelVersionStorageForEntity` to look up the definitions map of its section. The `devData` boot uses the map's Entities. The `model` and `data` boots filter out `devDataEntityUuids`, as L493 filters `versionHistoryEntityUuids`.

### D22 — Rollback of `devData` Entities

**Status:** Proposed. **Serves:** G3, G4.

For every deployment other than Miroir, the rollback fetches `metaModelEntities` as model Entities (`DomainController.ts:733-736`). Once the 3 Entities are in `defaultMiroirMetaModel`, `getApplicationSection` sends them to `devData`, and `resolveEntitiesToFetchOnRefresh` (`cacheRefreshPolicy.ts:111-114`) maps the model list without the cache filter. So Admin, Library and every bundled application fetch 3 `devData` collections at each rollback, and `PageLoadMeasurement`'s `cacheAllInstancesOnRefresh: false` (already set, `meta_model/16dbfe28-.../0266c0b8-....json:23-25`) is ignored for them. The absent-section mapping that turns these fetches into empty collections is hard-coded to `e.section === "modelVersion"` and `isAbsentModelVersionSectionError` (`DomainController.ts:786-813`).

**Decision (proposed):**

- The absent-section mapping covers every optional section (D13-b).
- `resolveEntitiesToFetchOnRefresh` applies `shouldCacheAllInstancesOnRefresh` to `devData` Entities from either list.
- `PersistenceStoreController.getInstances` already returns an empty collection without I/O when the optional store is absent (L837-857). The plan measures whether the remaining 2 empty fetches per non-Miroir rollback need a gate like the `versioningMode` one at L906; the default is no gate.

### D23 — A `devData` row written to another section

**Status:** Proposed. **Serves:** G1.

`PersistenceStoreController` uses `payload.applicationSection` as given (L342-417), so a `createInstance` naming `data` for a `BundleSizeMeasurement` row writes it to `data`. That is the #239 failure mode. **Decision (proposed):** the controller rejects a write whose Entity is in `devDataEntityUuids` and whose section is not `devData`, with a named `Action2Error`. The D12 regression test covers boot, a routed write and an explicit `data` write. The same guard for `modelVersion` stays with #239.

---

## 4. Current state

### 4.1 `miroir-app-meta` (enumerated)

| Kind | Name | uuid | Notes |
|---|---|---|---|
| SelfApplication | Meta | `9ff432a9-89a1-460b-a263-1672d084a9e0` | in `meta_model/a659d350/`, `assets/deployment/` and `miroir-app-admin` admin data |
| Deployment | MetaApplicationFilesystemDeployment | `40b74910-4c63-4bd9-8e7d-2bc051342908` | in `assets/deployment/` and admin data; `configuration`: admin, model, data |
| ModelBranch | master | `4408382d-daee-41d0-a53d-80a44c0f79e6` | |
| Menu | MetaMenu | `c95bfb70-62bd-4f40-ac2b-04857124f133` | 3 items, section `data`; the "Agent runs" item points to `02dd2ead` (PageLoadHistory) instead of `7a695632` (AgentRunHistory) |
| Entity | BundleSizeMeasurement | `90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b` | 28 rows, tracked (#473) |
| Entity | PageLoadMeasurement | `0266c0b8-4dc8-4a14-bcef-239a85a5de2d` | `cache.cacheAllInstancesOnRefresh: false`; rows gitignored (`.gitignore:95`), none tracked (#580) |
| Entity | AgentRunMeasurement | `954de789-6350-4f54-a809-5f2b8b91d067` | 24 rows, tracked (#550) |
| Report | BundleSizeHistory | `e8c6faa5-a117-4afd-b7ae-4a40c6111f95` | |
| Report | BundleSizeMeasurementDetails | `85077493-0fea-4969-96c8-b994272de284` | |
| Report | PageLoadHistory | `02dd2ead-7b8d-4160-99c9-9f4e9a1c051b` | |
| Report | PageLoadMeasurementDetails | `193c3dea-792d-471a-88a0-546e4b5e81cf` | |
| Report | AgentRunHistory | `7a695632-338e-4c33-8b39-dba7f6d4c988` | |
| Report | AgentRunMeasurementDetails | `49a3c09a-c7cd-4438-9730-c691c70741af` | |
| MiroirTest | report.bundleSizeHistory | `d13c9b9e-36fa-4ef0-975b-53751862300a` | in `meta_model/a311f363/`; testbed `metaTestbedInitParams`, TestConfiguration `8b8dfbd9` |
| MiroirTest | report.pageLoadHistory | `24f5c213-c384-47b3-9648-0f91ddaa89ee` | same, TestConfiguration `a8dd8a49` |
| MiroirTest | report.agentRunHistory | `ed680b8e-ae0b-40a8-873d-92d92c7191e5` | same, TestConfiguration `8b8dfbd9` |

Every Report and MiroirTest carries `selfApplication: 9ff432a9` (Meta). The Reports' queries name no `applicationSection`. The 3 Entities are `conceptLevel: "Model"`. `meta_data/` is 42 644 bytes.

Code (1 521 lines): `src/Meta.ts` (model, seeds, TestConfigurations, `metaInitApplicationVersion`, `getDefaultMetaModelEnvironment`), `src/bundleSizeHistory.ts`, `src/agentRunHistory.ts`, `src/repoInfo.ts`, `scripts/recordBundleSize.ts`, `scripts/backfillBundleSize.ts`, `scripts/recordAgentRun.ts`, `tests/{modelValidation,bundleSizeRecord,bundleSizeBackfill,agentRunRecord}.unit.test.ts`. `package.json` scripts: `bundle-size:record`, `bundle-size:backfill`, `agent-run:record`.

Users outside the package:

| File | Use |
|---|---|
| `miroir-app-admin/assets/admin_data/25d935e7-.../9ff432a9-....json`, `7959d814-.../40b74910-....json` | Meta SelfApplication and Deployment rows |
| `miroir-app-admin/assets/admin_data/7959d814-.../10ff36f2-....json` | the Miroir Deployment row, which gains `configuration.devData` (D3) |
| `environments/dev.json:51`, `test-filesystem.json:55` | `meta` application entry |
| `environments/test-sql.json:14`, `test-indexedDb.json:11`, `test-mongodb.json:14` | `meta` store overrides of `test-filesystem` |
| `environments/self-test.json:12` | `"meta": null` |
| `miroir-standalone-app/package.json:51`, `package-lock.json` | dependency |
| `miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationPlayfieldSeeds.ts:43-46, 153-159` | `metaTestbedInitParams` |
| `.../4-tests/testConfigurationInstanceIndex.ts:12, 40, 42` | the 2 TestConfigurations |
| `.../4-tests/testbedInitApplicationParametersIndex.ts:11, 27-28` | testbed lookup |
| `.../4-tests/miroirConfig.browser-emulatedServer-indexedDb.json:112` | store configuration of deployment `40b74910` |
| `miroir-standalone-app/src/loadTimings/{loadTimingConstants,loadTimingWriter,loadTimingBrowser}.ts` | page load writer (D18) |
| `miroir-standalone-app/scripts/load-timings.mjs:65` | reads page load rows |
| `miroir-standalone-app/bundle-policy.json:419` | lazy package allowlist |
| `miroir-standalone-app/tests/4_view/loadTimings/{loadTimingContract.unit,loadTimingWriter.integ,loadTimingsSwitch.unit}.test.ts` | uuid contract, writer, switch |
| `miroir-standalone-app/tests/4_view/issues/274-multistep-reports/multistep.274.phase0.unit.test.ts:57` | asset folder list |
| `miroir-standalone-app/tests/helpers/testEnvironmentConfig.unit.test.ts:28` | environment applications |
| `miroir-env/tests/miroirEnvShow.unit.test.ts:31` | environment applications |
| `miroir-app-miroir/assets/miroir_model/16dbfe28-.../a311f363-....json`, `miroir_modelVersion/54b9c72f-.../51c647fe-....json:413` | `metaTestbedInitParams` literal (D20) |
| generated `miroirFundamentalMlSchema.ts:7149, 9492`, `miroirFundamentalType.ts:2649, 10906` | same literal, regenerated |
| `scripts/check_bundle_policy.py:21-24, 47-50, 216-252, 276`, `scripts/tests/test_check_bundle_policy.py` | `history` rule |
| `scripts/agent_bench/batch.py:7, 79` | records agent runs |
| `scripts/nonreg-manifest.json:371, 381, 1551, 1589, 2650` | modelValidation step, build lists, the 2 report steps |
| `build-all.sh:86, 108, 110, 701` | build stages |
| `Dockerfile:79` | build |
| `.github/workflows/{pr-checks,self-test,build-linux-runnables}.yml` | build lists |
| `.gitignore:95` | page load rows |
| `docs/internals/code-splitting.md`, `docs/reference/{testing,data-architecture-deployments,environments,load-timings}.md` | docs |

### 4.2 The `modelVersion` pattern (aligned: this is what D2–D5 copy)

Type and schema. `applicationSection` is an enum in [`getMiroirFundamentalMlSchema.ts:1278-1288`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts) (`["model", "data", "modelVersion"]`), generated into `ApplicationSection` (`miroirFundamentalType.ts:1810`). `storeUnitConfiguration` (L1818-1851, the Deployment `configuration`) has `modelVersion` optional (L1842). `miroirEnvironmentApplication.sections` (L2140-2160) has optional `model`, `data`, `modelVersion`. The environment files are validated by `resolveEnvironment` (`Environment.ts:349-378`).

Routing ([`Model.ts:203-216`](../../../packages/miroir-core/src/1_core/Model.ts)):

```typescript
// packages/miroir-core/src/1_core/Model.ts, getApplicationSection
if (versionHistoryEntityUuids.has(entityUuid)) return "modelVersion";
if (applicationUuid == selfApplicationMiroir.uuid) {
  return metaMetaModelEntityUuids.includes(entityUuid) ? "model" : "data";
}
if (entityUuid === entityTransformerDefinition.uuid) return "model";
return metaModelEntityUuids.includes(entityUuid) ? "model" : "data";
```

Branches that name `modelVersion` as an optional store, or hard-code the list of sections (each needs `devData`, D13):

| Place | What it does |
|---|---|
| `PersistenceStoreController.ts:109-116` | 4th constructor argument `modelVersionStoreSection` |
| `PersistenceStoreController.ts:125-146` `getSectionInstanceStore` | named `FailedToOpenStore` when absent; **any other section falls through to the data store** |
| `PersistenceStoreController.ts:148-158, 837-857` | empty collection for reads of an absent section, without I/O |
| `PersistenceStoreController.ts:777-795` | `getInstance` named error when absent |
| `PersistenceStoreController.ts:488-556` `bootFromPersistedState` | filters version-history Entities out of model (L493), boots the section from the static map (D21) |
| `PersistenceStoreController.ts:560-603` | open, close, clear when present |
| `PersistenceStoreController.ts:677-719, 951-961` | `ensureModelVersionStorageForEntity`; an upsert to `data` requires a registered Entity |
| `PersistenceStoreController.ts:342-417` | writes use `payload.applicationSection` as given (D23) |
| `PersistenceStoreControllerManager.ts:189-209` | creates the store when `config.modelVersion` is set |
| `ActionRunner.ts:85-104, 165-192` | create and delete the store |
| `DomainController.ts:733-736` | non-Miroir rollback fetches `metaModelEntities` (D22) |
| `DomainController.ts:761-834` | absent-`modelVersion` errors become empty collections |
| `DomainController.ts:901-913` | `modelVersion` fetched only for `versioned-internal` applications |
| `DomainController.ts:1288` | the keyless guard checks only `data` |
| `cacheRefreshPolicy.ts:52-93, 105-127` | `MISSING_MODEL_VERSION_SECTION_MARKER`, `isAbsentModelVersionSectionError`, `resolveEntitiesToFetchOnRefresh` |
| `reportQueryLoadSegment.ts:262`, `ReportQueryLoadService.ts:56` | Report loads default to `data` (D16) |
| `Deployment.ts:549` | `["model", "data", "modelVersion"]` for meta-model objects at reset |
| `Deployment.ts:570-580` | seeded rows hard-coded to `data` (D15) |
| `ModelInitializer.ts:44` | section union of `upsertInstances` |
| `evolutionTraceWriter.ts:145` | cast `as "model" \| "data"` (no change needed: traces never name `devData`) |
| `Environment.ts:60, 63-65` | `EnvironmentSectionName`, `environmentSections` |
| `Environment.ts:164` `sectionConfiguration` | suffix `_modelVersion` / `_admin` / none: **a new section without a suffix gets the model/data SQL schema, MongoDB database and IndexedDb name** |
| `5_tests/testbedStorageConfiguration.ts:50-67` | copies `modelVersion` with suffix `_modelVersion` (D14) |
| `5_tests/testApplicationStoreTeardown.ts:43` | drops a test application's stores (D14) |
| `miroir-standalone-app/.../4-tests/runnerIntegTestSupport.ts:155-191, 202-310` | Postgres identifier length check; `model`/`data`/`modelVersion` per store type (D14) |
| `miroir-standalone-app/.../4-tests/transformerTestApplicationPlayfield.ts:52-106` | per-store section configuration |
| `getReportsAndEntitiesForDeploymentUuid` (`Model.ts:227-278`), `DeploymentUuidToReportsEntities` (`0_interfaces/1_core/Model.ts:28-48`) | per-section Reports and Entities (D16) |
| store `startup.ts` (filesystem L117-142, IndexedDb L108-132, Postgres L107-130, MongoDB L109-128) | a `modelVersion` factory each |
| `miroir-store-bundled/src/startup.ts:142-160`, `BundledUnsupportedModelVersionStore.ts` | refuses the section |
| `miroir-store-indexedDb/src/4_services/IndexedDb.ts:45-50` | database names for deletion, by `_modelVersion` suffix |
| `miroir-env/src/stateCommands.ts:205`, `deployExample.ts:28`, `environmentState.ts:54` | environment rebuild, example deploy, state seeding |
| `miroir-standalone-app-electron/src/storesOnDemand.ts:11` | lazy store factories per section |
| `miroir-sandbox/src/bundledData.ts:160-166` | excludes `versionHistoryEntityUuids` from bundled data; `devDataEntityUuids` too |
| `miroir-react`: `ReportSectionViewWithEditor.tsx:95`, `OpenReportLaunch.tsx:17`, `EntityInstanceGridInterface.ts:81`, `reportInputApplication.ts:61` | hand-written section unions |
| `miroir-app-miroir/index.d.ts` | hand-written declarations of every export |

The local cache needs no per-section declaration: keys are `${deploymentUuid}_${section}_${entityUuid}` (`ReduxDeploymentsState.ts:11-19`), and the section is parsed with `([^_]+)` (L41-55), so a section name must not contain `_` (`devData` does not). `registerEntityAdapterFromPresentModelSource` (`miroir-localcache-redux/.../LocalCacheSlice.ts:337`) registers custom-PK adapters for `model` and `data` only; the 3 measurement Entities use uuid keys, so this does not matter here.

Boot (D4, D22). The `modelVersion` rollback fetch is gated on `versioningMode === "versioned-internal"` (`DomainController.ts:906-911`). `devData` has no such gate: any Entity that `getApplicationSection` sends there is fetched. Entities with `cache.cacheAllInstancesOnRefresh: false` (Blob, and `PageLoadMeasurement`) are skipped only in the data list (`cacheRefreshPolicy.ts:111-127`).

### 4.3 Reports across applications (aligned with D16)

`MiroirMenu` (`miroir_data/dde4c883-.../eaac459c-6c2b-475c-8ae4-c6c3032dae00.json`) already mixes sections: "Miroir Entities" (`model`), "Miroir Entity Versions" and "Miroir Application Versions" (`modelVersion`), "Miroir Reports" (`data`), 16 items in its "Miroir" group. A menu item names `selfApplication`, `section` and `reportUuid`. `ReportDisplay` runs the Report's queries against `pageParams.application` (L56) and finds the Report through the per-section mapping (D16).

### 4.4 Testbeds and seeds

`metaTestbedInitParams` (`uiIntegrationPlayfieldSeeds.ts:153-159`) deploys the Meta application with `defaultMetaAppModel`. The TestConfigurations `8b8dfbd9` (bundle sizes and agent runs) and `a8dd8a49` (page loads) give `testbedModel: defaultMetaAppModel` and `testbedEntitiesAndInstances`. `RunMiroirTestAction.ts:375` copies them with `deepReplaceUuidStrings`, and `resetAndinitializeDeploymentCompositeAction` inserts the rows in `data` (`Deployment.ts:570-580`). Testbed stores come from `testApplicationStorageConfiguration` and `testbedStorageConfiguration` (D14).

### 4.5 Build order and imports (D17)

`miroir-app-miroir` is built before `miroir-core` (`AGENTS.md`, `build-all.sh`), and `miroir-core` imports it at runtime. Its `index.ts` (479 lines) exports asset JSON and `src/Model.ts` (`defaultMiroirMetaModel`), which imports `miroir-core` with `import type` only. Its `tsconfig.json` includes `index.ts`, `assets/**/*.json` and `src/**/*.ts`. `miroir-app-meta` has `miroir-core` as a devDependency and imports it at runtime (`Meta.ts:1-10`, `bundleSizeHistory.ts:5-9`, `agentRunHistory.ts:5-9`).

### 4.6 Bundle cost of the move

The 3 Entities and 6 Reports are 43 457 bytes raw, about 5.4 KB gzipped. Added to `defaultMiroirMetaModel`, they become eager in the page. Today the page has `eagerGzipBaseline: 841981` with a 2% tolerance (16.8 KB), and `miroir-app-miroir` has a cap of 3 400 000 rendered bytes (`bundle-policy.json:533`). The plan measures the change and records a new baseline if needed. No page code imports the rows.

### 4.7 Delivery (D19, G4)

`Dockerfile:155` copies `miroir-app-miroir/assets` into `/seed`, and Electron copies the same folder (`package.json:87-88`). Neither installs `miroir-app-meta` today, so neither ships its rows. After D6 both would, unless D19 excludes them. The 3 Entities, 6 Reports and the "Dev data" menu items do ship with the meta-model, and they show empty Reports where the section is absent.

## 5. Key reuse

| Piece | Location |
|---|---|
| Version-history routing set | `versionHistoryEntityUuids`, `Model.ts:154-172` |
| Static Entity definitions for an optional section | `versionHistoryEntityDefinitions` / `getVersionHistoryEntityDefinition`, `Model.ts:174-200` |
| Lazy table creation per Entity | `ensureModelVersionStorageForEntity`, `PersistenceStoreController.ts:677-719` |
| Absent-section error mapping | `cacheRefreshPolicy.ts:52-93`, `DomainController.ts:786-813` |
| Bundled refusal | `BundledUnsupportedModelVersionStore.ts` |
| Per-section Reports | `metaModelVersionReports`, `Model.ts:142-147` |
| Testbed storage | `testApplicationStorageConfiguration` (`runnerIntegTestSupport.ts:202-310`), `testbedStorageConfiguration.ts` |
| Lazy Entity at boot | `cache.cacheAllInstancesOnRefresh: false` (Blob, PageLoadMeasurement) |
| Tests to mirror | `miroir-core/tests/4_services/persistenceStoreController.sections.unit.test.ts`, `persistenceStoreControllerManager{,.sql}.unit.test.ts`, `1_core/modelVersionStorage.contract.unit.test.ts`, `1_core/cacheRefreshPolicy.unit.test.ts`, `1_core/versioningModes.{bundled,reportRouting,assetsLayout}.unit.test.ts`, `5-tests/issues/575-run-miroirtest/testbedStorageConfiguration.unit.test.ts`; `miroir-env/tests/{testEnvironments,miroirEnvDeploy}.unit.test.ts`; MiroirTest `fn.environment.deriveDeployments` (`miroir_data/a311f363-.../7f14228c-....json`) |
| Measurement model, Reports, MiroirTests | §4.1 uuids, moved as is |

## 6. Risks

| Risk | Mitigation |
|---|---|
| `Environment.ts:164` gives `devData` the model/data store name, so on SQL, MongoDB and IndexedDb its rows would mix with data | suffix `_devData` from D13-b; a `miroir-env` test per store type |
| `getSectionInstanceStore` sends an unknown section to data | D13-b routes every optional section explicitly; D23 guard; D12 test |
| A non-Miroir `devData` store boots without its Entities and reads empty after a restart | D21; a restart test on filesystem and SQL |
| Every non-Miroir rollback fetches the `devData` Entities | D22; measured in the plan |
| Postgres identifier length (63 characters, `runnerIntegTestSupport.ts:155-191`) | `_devData` is shorter than `_modelVersion`, and the same check covers it |
| Removing `metaTestbedInitParams` from the MiroirTest Entity and EntityVersion breaks `miroirTestTags` validation | D20, checked first in the plan; regenerate with `npm run devBuild -w miroir-core` after rebuilding `miroir-app-miroir` |
| The eager page grows by about 5.4 KB gzipped | measured in the plan; baseline recorded with `bundle-size:record`, now in `miroir-app-miroir` |

---

Next: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md) (to be written).
