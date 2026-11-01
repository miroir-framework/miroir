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
Key sources: [`Model.ts` (core)](../../../packages/miroir-core/src/1_core/Model.ts) · [`PersistenceStoreController.ts`](../../../packages/miroir-core/src/4_services/PersistenceStoreController.ts) · [`Environment.ts`](../../../packages/miroir-core/src/1_core/environment/Environment.ts) · [`Deployment.ts`](../../../packages/miroir-core/src/1_core/Deployment.ts) · [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts) · [`getMiroirFundamentalMlSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts) · [`packages/miroir-app-meta/`](../../../packages/miroir-app-meta/)

**Document role:** analysis and decision record.
**Status:** D1–D12 are A's decisions from the grilling (2026-11-01, two rounds, recorded in the issue). D13–D20 are mechanism choices found while mapping the code. They are proposed here and wait for A's review. D9 is revised by D14, because the Miroir testbed it assumed does not exist (§4.8).

Facts checked on `_integration` at `0563762` (2026-11-01).

---

## 1. Goals

| Id | Story |
|---|---|
| G1 | **Keep development information with its application.** In order to keep the history of how my application is built and tested next to it, and to drop it with it, as an application developer, I can store rows in my application's own `devData` section. |
| G2 | **Define a kind of development information once.** In order to give every application a new kind of history (test runs in #483, nonreg runs in #474) without copying Entities, as a Miroir maintainer, I add one Entity to `miroir-app-miroir` and every application can store its rows. |
| G3 | **Keep the platform's history readable.** In order to keep following bundle sizes, page loads and agent runs, as a Miroir maintainer, I open the same history Reports from the Miroir menu, on the same rows, recorded by the same commands. |
| G4 | **Ship without development information.** In order to keep a delivered application free of its development history, as an application maintainer, I leave `devData` out of the delivery environment and nothing from it is loaded or shipped. |
| G5 | **One meaning per word.** In order to read the code without guessing, as a contributor, I find "meta" naming only the meta-model, and no application named Meta. |

## 2. Non-goals

| Excluded | Owner |
|---|---|
| Test run Entities, the Miroir Tests recorder, a menu entry for every application with `devData` | #483 |
| Nonreg run recording | #474 |
| Moving MiroirTests and TestConfigurations to `devData`, pruning deliveries of them | follow-up, unscheduled |
| Showing model, `modelVersion` and `devData` Entities apart in the UI | follow-up, unscheduled (A: probably a UI matter only) |
| Choosing which sections a rollback loads | follow-up, general mechanism (A, round 1 Q5) |
| A production "watch" mode | follow-up, unscheduled |
| Application-defined `devData` Entities (an Entity attribute deciding the section) | rejected (D2) |
| #239 for `modelVersion` (boot writes EntityVersion rows into data) | #239, unless the D12 test shows it for `devData` |

## 3. Decision record

| # | Decision | Choice | Serves | Status |
|---|---|---|---|---|
| D1 | Section name | **`devData`** | G5 | Accepted (A) |
| D2 | Routing | **fixed `devDataEntityUuids` set in `getApplicationSection`, after `versionHistoryEntityUuids`** | G2 | Accepted (A) |
| D3 | Presence | **optional, declared per application** (environment `sections.devData`, Deployment `configuration.devData`); bundled store refuses it | G1, G4 | Accepted (A) |
| D4 | Boot | **loaded at rollback when declared**; `PageLoadMeasurement` gets `cache.cacheAllInstancesOnRefresh: false` | G3 | Accepted (A) |
| D5 | Stores | **filesystem, IndexedDb, Postgres, MongoDB** | G1 | Accepted (A) |
| D6 | Owner of today's rows | **the Miroir application** (`miroir-app-miroir/assets/miroir_devData/`) | G3 | Accepted (A) |
| D7 | Model location | **Entities and Reports in `miroir_model/`, MiroirTests in `miroir_data/`, uuids unchanged; Meta SelfApplication, Deployment, ApplicationVersion, Menu deleted** | G2, G5 | Accepted (A) |
| D8 | Menu | **"Dev data" items in `MiroirMenu`, section `devData`**; generic per-application entry in #483 | G3 | Accepted (A) |
| D9 | MiroirTests testbed | ~~Miroir testbed~~ → see D14 | G3 | Revised |
| D10 | Environments | **`dev` live, every `test-*` copy, for Miroir; not docker, desktop, bundled** | G3, G4 | Accepted (A) |
| D11 | Package | **`miroir-app-meta` deleted; helpers, scripts, tests move to `miroir-app-miroir`** | G5 | Accepted (A) |
| D12 | #239 | **separate; a regression test checks `devData` rows land in `devData` only** | G1 | Accepted (A) |
| D13 | Code shape for a second optional section | **one list of optional sections, used where code names `modelVersion` as an optional store** | G2 | Proposed |
| D14 | Testbed of the 3 moved MiroirTests | **a Library testbed variant with a `devData` section** | G1, G3 | Proposed |
| D15 | Seeding `devData` rows in a testbed | **route seeded instances with `getApplicationSection`, skip `createEntity` for framework `devData` Entities** | G1 | Proposed |
| D16 | How a Miroir Report reaches another application's `devData` | **a `devData` key in `DeploymentUuidToReportsEntities` for every application** | G1, G3 | Proposed |
| D17 | Where the Node helpers and test seeds live | **helpers and scripts in `miroir-app-miroir/scripts/devData/`, not exported by `index.ts`; seeds in the standalone app's test infrastructure** | G5 | Proposed |
| D18 | Writers | **every writer targets the Miroir deployment with `applicationSection: "devData"`** | G3 | Proposed |
| D19 | Delivery copies | **Docker and Electron leave `miroir_devData/` out of the copied assets** | G4 | Proposed |
| D20 | Report uuids in the Report `applicationSection` enums | **extend the 3 inline enums of the Report Entity and the MiroirTest `testbedInitApplicationParameters` enum** | G3 | Proposed (mechanical) |

**Rationale.** D1–D12 settle what A asked for. D13–D20 come from §4: the `modelVersion` pattern is spread over about 30 files, one of them (`Environment.ts:164`) would silently put `devData` in the model/data store if left as is, no Miroir testbed exists, and `miroir-app-miroir` cannot import `miroir-core` at runtime from its `index.ts`.

### D13 — Code shape for a second optional section

**Status:** Proposed. **Serves:** G2.

`modelVersion` is handled by name in about 15 branches (§4.2). `devData` behaves the same way in each of them: optional, empty reads when absent, named write error when absent, lazy table creation on first write, opened, closed and cleared with the deployment.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D13-a. Copy each branch | add a `devData` branch next to each `modelVersion` branch (`devDataStoreSection` field, `ensureDevDataStorageForEntity`, `isAbsentDevDataSectionError`, a fourth factory per store) | smallest diff per site; `modelVersion` code untouched | about 15 duplicated branches; the next optional section (#483 needs none, but MiroirTests may move later) copies them again |
| **D13-b. One list of optional sections** ★ | `optionalApplicationSections = ["modelVersion", "devData"] as const` in core. `PersistenceStoreController` keeps a `Partial<Record<OptionalApplicationSection, Store>>`; the manager, `ActionRunner` create/delete, `environmentSections`, the `sectionConfiguration` suffix, `testbedStorageConfiguration`, `deployExample.SECTIONS`, Electron `storesOnDemand.SECTIONS` and `Deployment.ts:549` iterate it. The absent-section error marker names the section. Each store registers its factory in a loop | one mechanism; a new optional section is one list entry plus its routing set | touches working `modelVersion` code; needs the existing `modelVersion` tests (§5) to stay green |

**Decision (proposed):** D13-b. The store `startup.ts` registrations stay explicit when a store needs a section-specific name (IndexedDb `-modelVersion`, MongoDB `-modelVersion`), driven by the section name. `isAbsentModelVersionSectionError` keeps its exported name as a wrapper, because it is exported from `miroir-core/src/index.ts:1046-1050`.

### D14 — Testbed of the 3 moved MiroirTests (revises D9)

**Status:** Proposed. **Serves:** G1, G3.

D9 assumed a Miroir testbed. The `testbedInitApplicationParameters` values are `libraryTestbedInitParams` (18 MiroirTests), `libraryVersionedTestbedInitParams` (1), `appForTestTestbedInitParams` (1), `githubTestbedInitParams` (1) and `metaTestbedInitParams` (3). None deploys the Miroir application, and a test may not reset the live Miroir deployment.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D14-a. A Miroir testbed | new `miroirTestbedInitParams` deploying a copy of the Miroir application | matches D9 literally | a testbed of the meta-model itself is new ground; the copy is about 4 MB of assets; no other test needs it |
| **D14-b. Library variant with `devData`** ★ | `libraryDevDataTestbedInitParams`, like `libraryVersionedTestbedInitParams` (`uiIntegrationPlayfieldSeeds.ts:134-141`): Library plus a `devData` section; the seeds go to the testbed's `devData`; the Reports (Miroir model) are shown against the testbed with section `devData` | proves G1 ("any application") with the rows #483 will add; reuses the most used testbed | the Report shows "Library" measurements, which are fixed seeds anyway |
| D14-c. A dedicated tiny application | a new fixture with no Entities, only `devData` | isolated | a fourth test application to maintain |

**Decision (proposed):** D14-b. The `runTarget` of the 3 MiroirTests changes from the Meta application to Library; their `report.application` becomes Library and `report.applicationSection` becomes `devData`.

### D15 — Seeding `devData` rows in a testbed

**Status:** Proposed. **Serves:** G1.

`resetAndinitializeDeploymentCompositeAction` (`Deployment.ts`) creates every seeded Entity in the application model (`createEntity`) and inserts every seeded row with `applicationSection: "data"` (`Deployment.ts:570-580`). For a `devData` Entity both are wrong: the Entity belongs to Miroir, and its rows belong to `devData`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D15-a. Route by `getApplicationSection`** ★ | rows go to `getApplicationSection(applicationUuid, entity.uuid)`; Entities whose uuid is in `devDataEntityUuids` (or `versionHistoryEntityUuids`) are not passed to `createEntity` | same rule as the meta-model objects of the same action (`Deployment.ts:543-561`) | changes a shared action; covered by the D12 regression test |
| D15-b. A separate `testbedDevDataInstances` field | the seed lists `devData` rows apart | no change to routing | a second seed shape; #483 and #474 would need it too |

### D16 — How a Miroir Report reaches another application's `devData`

**Status:** Proposed. **Serves:** G1, G3.

`ReportDisplay.tsx:72-93` (miroir-react) looks a Report up in `deploymentUuidToReportsEntitiesMapping[deployment][section].availableReports`, then in the application's own model. `getReportsAndEntitiesForDeploymentUuid` (`Model.ts:227-278`) builds `model`, `modelVersion` and `data` for Miroir and `model` and `data` for other applications.

**Decision (proposed):** add `metaModelDevDataReports` (the 6 Report uuids), a `devData` key for every application with `availableReports` taken from the Miroir meta-model, and exclude those Reports from Miroir's `data` key, as `metaModelVersionReports` are. Queries need no change: an extractor without an explicit section uses `getApplicationSection` (`QuerySelectors.ts:723-725`), which D2 sends to `devData`.

### D17 — Where the Node helpers and test seeds live

**Status:** Proposed. **Serves:** G5.

`miroir-core` imports `miroir-app-miroir` at runtime (`ReduxDeploymentsStateQuerySelectors.ts:29`), and `miroir-app-miroir/index.ts` exports JSON plus `src/Model.ts`, which imports `miroir-core` types only (`import type`). `Meta.ts` calls `getMiroirFundamentalSchemaForDeployment` from `miroir-core` at runtime, and `bundleSizeHistory.ts` / `agentRunHistory.ts` use `node:fs`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D17-a. Scripts folder, seeds in test infrastructure** ★ | `bundleSizeHistory.ts`, `agentRunHistory.ts`, `repoInfo.ts` and the 3 record/backfill scripts go to `miroir-app-miroir/scripts/devData/`, run with `tsx`, never imported by `index.ts`. The seeds and the 2 TestConfigurations go to `miroir-standalone-app/src/miroir-fwk/4-tests/devDataTestSeeds.ts`, next to `uiIntegrationPlayfieldSeeds.ts`. `getDefaultMetaModelEnvironment` and `defaultMetaAppModel` are deleted (no user outside `miroir-app-meta`) | no runtime cycle; Node code stays out of the page; test seeds sit with the other playfield seeds | `miroir-app-miroir` gets `tsx` scripts for the first time |
| D17-b. Export from `index.ts` | as today's `miroir-app-meta/index.ts` | one import path | a runtime cycle `miroir-core → miroir-app-miroir → miroir-core`, and `node:fs` code in a package the page imports eagerly |

### D18 — Writers

**Status:** Proposed. **Serves:** G3.

| Writer | Today | After |
|---|---|---|
| `recordBundleSize.ts`, `backfillBundleSize.ts` | `miroir-app-meta/assets/meta_data/90d603f9-.../` | `miroir-app-miroir/assets/miroir_devData/90d603f9-.../` |
| `recordAgentRun.ts` (called by `scripts/agent_bench/batch.py:79`) | `meta_data/954de789-.../` | `miroir_devData/954de789-.../`; `batch.py` calls `-w miroir-app-miroir` |
| `loadTimingWriter.ts` (page) | `createInstance` on the Meta deployment, `applicationSection: "data"` | on the Miroir deployment (`10ff36f2`), `applicationSection: "devData"` |
| `loadTimingBrowser.ts:243` gate | the configuration lists the Meta deployment | the Miroir deployment's configuration has `devData` |
| `load-timings.mjs` (reads) | `meta_data/0266c0b8-.../` | `miroir_devData/0266c0b8-.../` |
| `check_bundle_policy.py` `history` rule | `DEFAULT_META_DATA_DIR = .../miroir-app-meta/assets/meta_data` | `.../miroir-app-miroir/assets/miroir_devData` |

`loadTimingConstants.ts` keeps copies of uuids so the page does not import the Meta model. After the move the Miroir uuids are already eager, so `META_SELF_APPLICATION_UUID` and `META_DEPLOYMENT_UUID` are replaced by the Miroir application and deployment imported from `miroir-app-miroir` / `miroir-app-admin`.

### D19 — Delivery copies

**Status:** Proposed. **Serves:** G4.

Not declaring `devData` keeps it unloaded, but the files still ship: `Dockerfile:155` copies `miroir-app-miroir/assets` whole and Electron copies it through `extraResources` (`miroir-standalone-app-electron/package.json:87-88`). With D6 the 28 bundle size rows and the 24 agent runs (about 224 KB with page loads) would land in both.

**Decision (proposed):** exclude `miroir_devData/` in both copies (an Electron `filter` entry, a `rm -rf` after the Docker `COPY` or a `.dockerignore` rule), and add a check that the delivered tree has no `*_devData/` folder.

### D20 — Enums naming the sections and testbeds

**Status:** Proposed (mechanical). **Serves:** G3.

The Report Entity repeats an inline `applicationSection` enum three times (`miroir_model/16dbfe28-.../3f2baa83-....json:1078, 1722, 1810`), and so does its EntityVersion (`miroir_modelVersion/54b9c72f-.../952d2c65-....json`). The MiroirTest Entity (`a311f363-....json`) lists `metaTestbedInitParams` among the `testbedInitApplicationParameters` literals. `devData` is added to the first four, `metaTestbedInitParams` is replaced by `libraryDevDataTestbedInitParams` in the last. The EntityVersion of Report is a history row: the analysis proposes updating it in place, because the current Report schema version is not frozen (to verify in the plan).

---

## 4. Current state

### 4.1 `miroir-app-meta` (enumerated)

| Kind | Name | uuid | Notes |
|---|---|---|---|
| SelfApplication | Meta | `9ff432a9-89a1-460b-a263-1672d084a9e0` | also in `miroir-app-admin` admin data |
| Deployment | MetaApplicationFilesystemDeployment | `40b74910-4c63-4bd9-8e7d-2bc051342908` | `configuration`: admin, model, data |
| ModelBranch | master | `4408382d-daee-41d0-a53d-80a44c0f79e6` | |
| Menu | MetaMenu | `c95bfb70-62bd-4f40-ac2b-04857124f133` | 3 items, section `data`; the "Agent runs" item points to `02dd2ead` (PageLoadHistory) instead of `7a695632` (AgentRunHistory) |
| Entity | BundleSizeMeasurement | `90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b` | 28 rows, tracked (#473) |
| Entity | PageLoadMeasurement | `0266c0b8-4dc8-4a14-bcef-239a85a5de2d` | rows gitignored (`.gitignore:95`), 0 in the repo (#580) |
| Entity | AgentRunMeasurement | `954de789-6350-4f54-a809-5f2b8b91d067` | 24 rows, tracked (#550) |
| Report | BundleSizeHistory | `e8c6faa5-a117-4afd-b7ae-4a40c6111f95` | |
| Report | BundleSizeMeasurementDetails | `85077493-0fea-4969-96c8-b994272de284` | |
| Report | PageLoadHistory | `02dd2ead-7b8d-4160-99c9-9f4e9a1c051b` | |
| Report | PageLoadMeasurementDetails | `193c3dea-792d-471a-88a0-546e4b5e81cf` | |
| Report | AgentRunHistory | `7a695632-338e-4c33-8b39-dba7f6d4c988` | |
| Report | AgentRunMeasurementDetails | `49a3c09a-c7cd-4438-9730-c691c70741af` | |
| MiroirTest | report.bundleSizeHistory | `d13c9b9e-36fa-4ef0-975b-53751862300a` | `testbedInitApplicationParameters: metaTestbedInitParams`, TestConfiguration `8b8dfbd9` |
| MiroirTest | report.pageLoadHistory | `24f5c213-c384-47b3-9648-0f91ddaa89ee` | same testbed, TestConfiguration `a8dd8a49` |
| MiroirTest | report.agentRunHistory | `ed680b8e-ae0b-40a8-873d-92d92c7191e5` | same testbed, TestConfiguration `8b8dfbd9` |

Every Report and MiroirTest carries `selfApplication: 9ff432a9` (Meta). The Reports' queries name no `applicationSection`. The 3 Entities are `conceptLevel: "Model"`; their 3 EntityDefinitions do not exist as separate rows (the Entity row holds `mlSchema`).

Code (1 521 lines): `src/Meta.ts` (model, seeds, TestConfigurations, `getDefaultMetaModelEnvironment`), `src/bundleSizeHistory.ts`, `src/agentRunHistory.ts`, `src/repoInfo.ts`, `scripts/recordBundleSize.ts`, `scripts/backfillBundleSize.ts`, `scripts/recordAgentRun.ts`, `tests/{modelValidation,bundleSizeRecord,bundleSizeBackfill,agentRunRecord}.unit.test.ts`. `package.json` scripts: `bundle-size:record`, `bundle-size:backfill`, `agent-run:record`.

Users outside the package:

| File | Use |
|---|---|
| `miroir-app-admin/assets/admin_data/25d935e7-.../9ff432a9-....json`, `7959d814-.../40b74910-....json` | Meta SelfApplication and Deployment rows |
| `environments/dev.json:51`, `environments/test-filesystem.json:55` | `meta` application entry |
| `miroir-standalone-app/package.json:51` | dependency |
| `miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationPlayfieldSeeds.ts:43-46, 153-159` | `metaTestbedInitParams` |
| `miroir-standalone-app/src/miroir-fwk/4-tests/testConfigurationInstanceIndex.ts:12, 40, 42` | the 2 TestConfigurations |
| `miroir-standalone-app/src/miroir-fwk/4-tests/testbedInitApplicationParametersIndex.ts:11, 27-28` | testbed lookup |
| `miroir-standalone-app/src/loadTimings/{loadTimingConstants,loadTimingWriter,loadTimingBrowser}.ts` | page load writer (D18) |
| `miroir-standalone-app/scripts/load-timings.mjs:65` | reads page load rows |
| `miroir-standalone-app/bundle-policy.json:419` | lazy package allowlist |
| `miroir-standalone-app/tests/4_view/loadTimings/loadTimingContract.unit.test.ts:13` | uuid contract |
| `miroir-standalone-app/tests/4_view/issues/274-multistep-reports/multistep.274.phase0.unit.test.ts:57` | asset folder list |
| `scripts/check_bundle_policy.py:47-50, 216-252`, `scripts/tests/test_check_bundle_policy.py` | `history` rule |
| `scripts/agent_bench/batch.py:7, 79` | records agent runs |
| `scripts/nonreg-manifest.json:381, 2650` | build lists |
| `build-all.sh:86, 108, 110, 701` | build stages |
| `Dockerfile:79` | build |
| `.github/workflows/{pr-checks,self-test,build-linux-runnables}.yml` | build lists |
| `.gitignore:95` | page load rows |
| `docs/internals/code-splitting.md`, `docs/reference/{testing,data-architecture-deployments,environments,load-timings}.md` | docs |

### 4.2 The `modelVersion` pattern (aligned: this is what D2–D5 copy)

Type and schema. `applicationSection` is an enum in [`getMiroirFundamentalMlSchema.ts:1278-1288`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts) (`["model", "data", "modelVersion"]`), generated into `ApplicationSection` (`miroirFundamentalType.ts:1810`). `storeUnitConfiguration` (L1818-1851, the Deployment `configuration`) has `modelVersion` optional (L1842). `miroirEnvironmentApplication.sections` (L2140-2160) has optional `model`, `data`, `modelVersion`. `generate-ts-types.ts:330` quotes `modelVersion:` keys by regex (#232).

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

Branches that name `modelVersion` as an optional store (each needs `devData`, D13):

| Place | What it does |
|---|---|
| `PersistenceStoreController.ts:109-116` | 4th constructor argument `modelVersionStoreSection` |
| `PersistenceStoreController.ts:125-146` `getSectionInstanceStore` | named `FailedToOpenStore` when absent; **any other section falls through to the data store** |
| `PersistenceStoreController.ts:148-158, 837-857` | empty collection for reads of an absent section |
| `PersistenceStoreController.ts:777-795` | `getInstance` named error when absent |
| `PersistenceStoreController.ts:488-556` `bootFromPersistedState` | filters version-history Entities out of model, boots the section with them |
| `PersistenceStoreController.ts:560-603` | open, close, clear when present |
| `PersistenceStoreController.ts:677-719, 951-958` | `ensureModelVersionStorageForEntity`: lazy table creation on first upsert |
| `PersistenceStoreControllerManager.ts:189-209` | creates the store when `config.modelVersion` is set |
| `ActionRunner.ts:85-104, 165-192` | create / delete store |
| `DomainController.ts:761-834` | absent-section errors become empty collections at rollback |
| `DomainController.ts:901-913` | `modelVersion` fetched at rollback only for `versioned-internal` applications |
| `cacheRefreshPolicy.ts:52-93` | `MISSING_MODEL_VERSION_SECTION_MARKER`, `isAbsentModelVersionSectionError` |
| `Deployment.ts:549` | `["model", "data", "modelVersion"]` for meta-model objects at reset |
| `ModelInitializer.ts:44` | section union of `upsertInstances` |
| `Environment.ts:60, 63-65` | `EnvironmentSectionName`, `environmentSections` |
| `Environment.ts:164` `sectionConfiguration` | suffix `_modelVersion` / `_admin` / none: **a new section without a suffix gets the model/data SQL schema, MongoDB database and IndexedDb name** |
| `testbedStorageConfiguration.ts:50-67` | copies `modelVersion` with suffix `_modelVersion` |
| `getReportsAndEntitiesForDeploymentUuid` (`Model.ts:227-278`), `DeploymentUuidToReportsEntities` (`0_interfaces/1_core/Model.ts:28-48`) | per-section Reports (D16) |
| store `startup.ts` (filesystem L117-142, IndexedDb L108-132, Postgres L107-130, MongoDB L109-128) | a `modelVersion` factory each |
| `miroir-store-bundled/src/startup.ts:142-160`, `BundledUnsupportedModelVersionStore.ts` | refuses the section |
| `miroir-store-indexedDb/src/4_services/IndexedDb.ts:45-50` | database names for deletion, by `_modelVersion` suffix |
| `miroir-env/src/stateCommands.ts:205`, `deployExample.ts:28` | environment rebuild, example deploy |
| `miroir-standalone-app-electron/src/storesOnDemand.ts:11` | lazy store factories per section |
| `miroir-react`: `ReportSectionViewWithEditor.tsx:95`, `OpenReportLaunch.tsx:17`, `EntityInstanceGridInterface.ts:81` | hand-written section unions |

The local cache needs no per-section declaration: keys are `${deploymentUuid}_${section}_${entityUuid}` (`ReduxDeploymentsState.ts:11-19`) and the section is parsed with `([^_]+)` (L41-55), so a section name must not contain `_` (`devData` does not). `registerEntityAdapterFromPresentModelSource` (`miroir-localcache-redux/.../LocalCacheSlice.ts:337`) registers custom-PK adapters for `model` and `data` only; the 3 measurement Entities use uuid keys, so this does not matter here.

Boot (D4). For `modelVersion` the rollback fetch is gated on `versioningMode === "versioned-internal"` (`DomainController.ts:906-911`). `devData` has no such gate: it is fetched whenever `getApplicationSection` sends an Entity there, and an absent section yields an empty collection through the same error mapping (L786-813). Entities with `cache.cacheAllInstancesOnRefresh: false` are not fetched at rollback (`cacheRefreshPolicy.ts`, Blob is the only one today).

### 4.3 Reports across applications (aligned with D16)

`MiroirMenu` (`miroir_data/dde4c883-.../eaac459c-6c2b-475c-8ae4-c6c3032dae00.json`) already mixes sections: "Miroir Entities" (`model`), "Miroir Entity Versions" and "Miroir Application Versions" (`modelVersion`), "Miroir Reports" (`data`), 16 items in its "Miroir" group. A menu item names `selfApplication`, `section` and `reportUuid`; `ReportDisplay` runs the Report's queries against `pageParams.application` (L56) and finds the Report through the per-section mapping (§D16).

### 4.4 Testbeds and seeds

`metaTestbedInitParams` (`uiIntegrationPlayfieldSeeds.ts:153-159`) deploys the Meta application with `defaultMetaAppModel`. The TestConfigurations `8b8dfbd9` (bundle sizes and agent runs) and `a8dd8a49` (page loads) give `testbedModel: defaultMetaAppModel` and `testbedEntitiesAndInstances`. `RunMiroirTestAction.ts:375` copies them with `deepReplaceUuidStrings`; `resetAndinitializeDeploymentCompositeAction` creates the Entities and inserts the rows in `data` (`Deployment.ts:570-580`). `libraryVersionedTestbedInitParams` (L134-141) is the precedent for a Library variant with an extra section.

### 4.5 Build order and imports (D17)

`miroir-app-miroir` is built before `miroir-core` (`AGENTS.md`, `build-all.sh`). `miroir-core` imports it at runtime. Its `index.ts` (479 lines) exports asset JSON and `src/Model.ts` (`defaultMiroirMetaModel`), which imports `miroir-core` with `import type` only. `miroir-app-meta` has `miroir-core` as a devDependency and imports it at runtime (`Meta.ts:1-10`, `bundleSizeHistory.ts:5-9`, `agentRunHistory.ts:5-9`).

### 4.6 Bundle cost of the move

The 3 Entities and 6 Reports are 43 457 bytes raw, 5 548 gzipped. Added to `defaultMiroirMetaModel` they become eager in the page, which today has `eagerGzipBaseline: 841981` with a 2% tolerance (16.8 KB) and a `miroir-app-miroir` cap of 3 400 000 rendered bytes (`bundle-policy.json:533`). The plan measures and records a new baseline if needed. The rows are not imported by any page code.

### 4.7 Delivery (D19)

`Dockerfile:155` copies `miroir-app-miroir/assets` into `/seed`. Electron copies the same folder (`package.json:87-88`). Neither installs `miroir-app-meta` today, so neither ships its rows. After D6 both would, unless D19 excludes them.

### 4.8 Why D9 changes

No `miroirTestbedInitParams` exists (§D14, 5 testbed values, 24 MiroirTests use one). D9's own fallback was a separate testbed; D14-b is that fallback, built on the Library testbed.

## 5. Key reuse

| Piece | Location |
|---|---|
| Version-history routing set | `versionHistoryEntityUuids`, `Model.ts:154-172` |
| Lazy table creation per Entity | `ensureModelVersionStorageForEntity`, `PersistenceStoreController.ts:677-719`; `getVersionHistoryEntityDefinition`, `Model.ts:174-200` |
| Absent-section error mapping | `cacheRefreshPolicy.ts:52-93`, `DomainController.ts:786-813` |
| Bundled refusal | `BundledUnsupportedModelVersionStore.ts` |
| Per-section Reports | `metaModelVersionReports`, `Model.ts:142-147` |
| Library testbed variant | `libraryVersionedTestbedInitParams`, `uiIntegrationPlayfieldSeeds.ts:134-141` |
| Lazy Entity at boot | `cache.cacheAllInstancesOnRefresh: false` (Blob) |
| Tests to mirror | `miroir-core/tests/4_services/persistenceStoreController.sections.unit.test.ts`, `persistenceStoreControllerManager{,.sql}.unit.test.ts`, `1_core/modelVersionStorage.contract.unit.test.ts`, `1_core/cacheRefreshPolicy.unit.test.ts`, `1_core/versioningModes.{bundled,reportRouting,assetsLayout}.unit.test.ts`, `5-tests/issues/575-run-miroirtest/testbedStorageConfiguration.unit.test.ts`; `miroir-env/tests/{testEnvironments,miroirEnvDeploy}.unit.test.ts`; MiroirTest `fn.environment.deriveDeployments` (`miroir_data/a311f363-.../7f14228c-....json`) |
| Measurement model, Reports, MiroirTests | §4.1 uuids, moved as is |

## 6. Risks

| Risk | Mitigation |
|---|---|
| `Environment.ts:164` gives `devData` the model/data store name, so on SQL, MongoDB and IndexedDb rows would mix with data | suffix `_devData` driven by D13-b; a `miroir-env` test per store type |
| `getSectionInstanceStore` sends an unknown section to data | D13-b routes every optional section explicitly; the D12 regression test |
| Postgres identifier length (63 characters, checked by `runnerIntegTestSupport.ts:155-191` for `_modelVersion`) | `_devData` is shorter than `_modelVersion`; the same check covers it |
| Removing `metaTestbedInitParams` from the MiroirTest Entity enum regenerates types | done with `npm run devBuild -w miroir-core` after rebuilding `miroir-app-miroir` |
| The eager page grows by about 5.5 KB gzipped | measured in the plan; baseline recorded with `bundle-size:record`, now in `miroir-app-miroir` |

---

Next: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md) (to be written).
