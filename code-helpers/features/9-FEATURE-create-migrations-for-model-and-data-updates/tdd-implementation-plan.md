# Issue #9 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController, local cache and emulated server on the filesystem,
> IndexedDB and SQL store profiles, through the Model Endpoint actions (`setDeploymentRole`,
> `generateMigration`, `runMigration`), the store management actions and the instance writes a
> designer makes. No mocks. The tracer bullet of each part proves its thinnest path end to end:
> an Entity saved as a row gets its storage (A), a deployment set following at an earlier version
> gets that version's model (B), a draft Migration for one added attribute (C), and that Migration
> run on the following deployment (D).
>
> **Execution model:** human-in-the-loop. No slice contains a commit step: commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/9
Prerequisites: [`../708-FEATURE-trace-revival-model-states/`](../708-FEATURE-trace-revival-model-states/) ✅, [`../696-REFACTOR-versioning-package/`](../696-REFACTOR-versioning-package/) ✅
Working branch: `claude/project-thread-8d36cr` (assigned by the session), one PR per part (analysis D1)

**Resume note:** plan written 2026-11-15 and reviewed cold (18 findings folded in); waiting for the user's review; no slice started.

---

## Scope

In, from the analysis goals:
- G1 — a draft migration between two versions, with its changes classified, and hand-written migrations (part C).
- G2 — a migration run on a following deployment brings its model and storage to the target version, data kept (parts B, D).
- G3 — a stopped run resumes and ends in the same state (part D).
- G4 — the deployment state record: role, version, applied migrations, a run in progress (part B, D).
- G5 — add-only storage reconciliation after an Entity row write and after the jump (part A).

Out (analysis section 2): paired data migrations, the composite rename and fill steps reading removed attributes (#215); the operator's restore action (#709); two processes sharing `modelVersion` and the clone installer change (#710); release packages (epic D9); a migration on the authoring deployment; tightening nullable columns; one SQL transaction per step; store backups.

---

## Progress summary

| Slice | Part | Title | Status | Primary proof |
|---|---|---|---|---|
| A0 | A | Characterize storage creation and Entity row writes | ⬜ | `entityStorage.9.phaseA.integ.test.ts`, #715 test as is |
| A1 | A | An Entity saved as a row gets its storage (tracer) | ⬜ | same file, filesystem and IndexedDB |
| A2 | A | Reconciliation keeps existing data on every store | ⬜ | same file, IndexedDB, MongoDB |
| A3 | A | SQL: an attribute added to an Entity row gets a nullable column | ⬜ | `entityRowUpdateSqlTable.integ` flipped |
| A4 | A | Storage drops by Entity row, whole Entity or one attribute | ⬜ | `entityStorageDrop.9.phaseA.integ.test.ts` |
| B1 | B | A deployment set following at its current version (tracer) | ⬜ | `deploymentRole.9.phaseB.integ.test.ts` |
| B2 | B | A following deployment refuses model and `modelVersion` writes | ⬜ | same file |
| B3 | B | A deployment set following at an earlier version gets its model | ⬜ | same file |
| C1 | C | A draft Migration for one optional attribute (tracer) | ⬜ | `migrationGeneration.9.phaseC.integ.test.ts` |
| C2 | C | Removals, required attributes, renames: classified and stepped | ⬜ | same file |
| C3 | C | Refusals and the diff fallback | ⬜ | same file |
| C4 | C | `versioned-git`: from the tag to `HEAD` | ⬜ | `migrationGenerationGit.9.phaseC.integ.test.ts` |
| D1 | D | A Migration run on a following deployment (tracer) | ⬜ | `migrationRun.9.phaseD.integ.test.ts` |
| D2 | D | A stopped run resumes | ⬜ | same file |
| D3 | D | Contract steps drop storage | ⬜ | same file, filesystem and SQL |
| D4 | D | Runner refusals | ⬜ | same file |
| D5 | D | `versioned-git`: the jump is a checkout of the tag | ⬜ | `migrationRunGit.9.phaseD.integ.test.ts` |
| Z | D | MiroirTest scenario, nonreg steps, docs, cleanup, AC | ⬜ | nonreg steps + `action.scenario.migration` |

Each part ends with a full `npm run nonreg:filesystem -- --runner shared` and its PR.

---

## Locked implementation defaults

The analysis decision record, binding for this plan. Narrowings N1 to N4 (analysis section 3.1) hold once the user signs them off; a change is recorded in the Realization of the slice it affects.

| Decision | Choice | Serves |
|---|---|---|
| D1 | Four parts A storage, B formats and roles, C generation, D runner; a PR each | all |
| D2 | `applyModelState` rewrites the application's own model rows only (`AGREEMENT_COLLECTIONS`, `model` section, meta-model Entities left out), keeps `parentDefinitionVersionUuid` and `conceptLevel`, Entity rows first with their reconciliation, reloads; following deployments only, with the run's mark | G2 |
| D3 | `Migration` row: `application`, `from`, `to`, `source`, `changes`, `expand`, `fill`, `contract`, `backwardCompatible`, `generatedAt`, `description`; a data step `{ uuid, name, backwardCompatible, repeatable, action }` | G1, G2, G3 |
| D4 | Contract step `{ uuid, kind: dropEntityStorage \| dropAttributeStorage, entity: <row in from>, attribute? }` | G2 |
| D5 | Admin `DeploymentState`, uuid = Deployment uuid: `deployment`, `application`, `role`, `version`, `gitCommit`, `applied`, `run`; no row = authoring; Entity created when absent | G3, G4 |
| D6 | `setDeploymentRole` (server-routed, versioning capability); gate in the persistence process reading the stored row; run mark copied to composite children; Admin reloaded on the client | G2, G4 |
| D7 | `generateMigration { application, from, to }`: states, records, agreement, changes from records (renames and `idAttribute` from row diffs), diff fallback, classification, steps, unsupported; refused across a `rebaseline`; one Migration per `from`/`to` unless replaced | G1 |
| D8 | `runMigration { application, migration }` under a lock per application; checks, find (at tag `to` with Git), copy, steps with `stepsDone`, end | G2, G3 |
| D9 | `createStorageSpaceForInstancesOfEntityIfMissing` required everywhere; reconcile = IfMissing + nullable SQL columns + redefined SQL model; after the jump, in the rewrite, and after a write of an application's own Entity row in the persistence process (not Miroir, meta-model, devData, init, reset) | G5 |
| D10 | `storeManagementAction_reconcileEntityStorage` and `storeManagementAction_dropEntityStorage` through `handleStoreManagementAction` | G2, G5 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| `Migration` Entity (Miroir model, routed to `modelVersion`) | `b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe` |
| `DeploymentState` Entity (Admin model) | `14e696c6-c9ef-4d50-b2d6-1fd561b315f6` |
| MiroirTest `action.scenario.migration` (appForTest, filesystem) | `79e29346-90d3-4bdd-ae87-43ba9e99268f` |
| `MetaModel` collection of Migrations | `migrations` |
| Model Endpoint actions (`7947ae40-…`) | `setDeploymentRole`, `generateMigration`, `runMigration` (`handleAction_setDeploymentRole`, `handleAction_generateMigration`, `handleAction_runMigration`, `requiredCapability: versioning`) |
| Store management actions | `storeManagementAction_reconcileEntityStorage`, `storeManagementAction_dropEntityStorage` |
| Refusal reasons (`errorContext.reason`) | `deploymentFollows`, `deploymentAuthors`, `migrationNotAtFrom`, `migrationRunInProgress`, `migrationUnsupportedChange`, `migrationAcrossRebaseline`, `migrationExists` |
| Nonreg steps | `integ-9-entity-storage` (part A), `integ-9-deployment-role` (B), `integ-9-migration-generation` (C), `integ-9-migration-run` (D) |

---

## Test execution conventions

Vitest is the vehicle for parts A to D, as for #708, with one reason per file:
- `entityStorage.9.phaseA` and `entityStorageDrop.9.phaseA`: they assert the store's own storage (folders, sublevels, SQL columns), which no MiroirTest assertion reads;
- `deploymentRole.9.phaseB`: it sends a marked action straight to the emulated server's DomainController to test the server gate alone, which a MiroirTest cannot do;
- `migrationGeneration.9.phaseC` and `migrationRun.9.phaseD`: they need frozen versions, records tampered on disk and role changes between steps, set up by `versioningTestSetup.ts`;
- the two Git files: they need the Git testbed of `gitTestSetup.ts` (a repository, tags, checkouts).

Slice Z adds one MiroirTest scenario that runs the whole path as an `actionTest`.

**Testbeds.** `versioningTestSetup.ts` and `gitTestSetup.ts` open `test-filesystem` only. Part A's multi-store tests use the profile-driven `DomainControllerIntegrationTestSession`, as `4_storage/entityRowUpdateSqlTable.integ.test.ts` does, so that `MIROIR_ENV` or `--profile` selects the store. Parts B to D run on the filesystem; their SQL proof is part A's (A3, A4), not a SQL rerun of the versioning scenarios.

**Environment.** PostgreSQL is installed in the cloud sessions but stopped: SQL slices start it (`pg_ctlcluster 16 main start`) and set `MIROIR_POSTGRES_PASSWORD`; without it they are skipped locally and run in `nonreg:default`. MongoDB is not installed: the MongoDB RED of A2 runs through `nonreg:mongodb` on a machine that has it, through the `integ-9-entity-storage` step added in A2 with `"requires": "storage"`.

| Purpose | Command |
|---|---|
| Part A tests, filesystem | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 9-migrations/entityStorage` |
| Part A tests, IndexedDB / MongoDB | `MIROIR_ENV=test-indexedDb …` / `MIROIR_ENV=test-mongodb …` (same file) |
| SQL tests | `MIROIR_POSTGRES_PASSWORD=… npm run testByFile -w miroir-standalone-app -- entityRowUpdateSqlTable.integ --profile emulatedServer-sql` |
| Parts B to D | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 9-migrations/<file>` |
| Versioning unit tests | `npm run test -w @miroir-framework/versioning` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run build -w miroir-app-admin && npm run devBuild -w @miroir-framework/core` |
| Rebuild what the standalone-app tests import (their `dist`) | `npm run build -w @miroir-framework/versioning -w miroir-localcache-redux -w miroir-localcache-zustand -w packages/miroir-store-filesystem -w packages/miroir-store-indexedDb -w packages/miroir-store-mongodb -w packages/miroir-store-postgres` (those the slice touched) |
| Deployment validation | `npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts` (and `-w miroir-app-admin`) |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` for core, versioning and each store touched |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg (end of each part, slice Z) | `npm run nonreg:filesystem -- --runner shared` |

Test files live in `packages/miroir-standalone-app/tests/3_controllers/issues/9-migrations/` until slice Z moves them to feature-named suites.

---

## Part A — Storage

### Slice A0 — Characterize storage creation and Entity row writes

**Status:** ⬜ pending

**Goal.** Lock today's behaviour that part A changes, so each change shows as a flipped assertion.

**RED/characterization** (`entityStorage.9.phaseA.integ.test.ts`), passing on today's code:
- filesystem: a new Entity row of appForTest committed as an instance write (as the Entity editor does) leaves the data section without its folder; a `createInstance` of that Entity in `data` is refused.
- IndexedDB (profile-driven session): the same, a write of an instance of that Entity in `data` is refused (no sublevel).
- the #715 SQL test stays as is (no column).

**GREEN.** None.

**Refactor checkpoint.** None.

**Validation.** The file on `test-filesystem` and `test-indexedDb`; `npm run nonreg:filesystem -- --runner shared --scope smoke,actions`.

**Realization.** _(on completion)_

### Slice A1 — An Entity saved as a row gets its storage (tracer)

**Status:** ⬜ pending

**Goal.** A designer who saves a new Entity row of their application and commits can store its instances (G5).

**RED.** In the A0 file, the filesystem assertion flips: after the commit, a `createInstance` of the new Entity in `data` succeeds and the instance reads back. Same on IndexedDB.

**GREEN.**
- `storeManagementAction_reconcileEntityStorage` in the ML schema of `StoreManagementAction`; schema rebuild.
- `createStorageSpaceForInstancesOfEntityIfMissing` on the filesystem and IndexedDB sections; `PersistenceStoreController.reconcileEntityStorage(entity)` on the data section.
- `handleStoreManagementAction` runs the action; a remote client forwards it as the other store management actions: the store-management switches of `RestServer.ts`, of the redux local cache (`RestPersistenceClientAndRestClient.ts`, `PersistenceReduxSaga.ts`) and of the zustand one gain the new action type.
- In the DomainController of the persistence process, after a successful create or update of one of an application's own Entity rows in `model` (not Miroir, not meta-model, not devData), the reconciliation of that Entity.

**Refactor checkpoint.** One predicate "is an application's own Entity row" shared with the versioning package's meta-model filter, in core.

- A test that the exclusions hold: a `resetModel` plus `initModel` of appForTest, and a write of a Miroir Entity row, call no reconciliation (no folder appears in Miroir's data section for a devData Entity).

**Validation.** The file on `test-filesystem` and `test-indexedDb`; rebuild core, both stores and both local caches; type check them; scoped nonreg `smoke,actions,core,localcache`.

**Realization.** _(on completion)_

### Slice A2 — Reconciliation keeps existing data on every store

**Status:** ⬜ pending

**Goal.** Reconciling an Entity whose storage holds instances keeps them, on every store (G5, epic D2).

**RED.** The reconcile action on an Entity with two instances, then a read: both are there. A1 already makes this pass on the filesystem and IndexedDB; the RED is MongoDB's (`MIROIR_ENV=test-mongodb`, where a MongoDB is reachable). The step `integ-9-entity-storage` (`"requires": "storage"`, scopes `actions`) is added here, so `nonreg:indexedDb` and `nonreg:mongodb` run the file. That the method exists on every section is proved by `tsc` once it is required.

**GREEN.** `IfMissing` on MongoDB; the method made required on `StorageSpaceHandlerInterface`; the bundled, error and test-double sections implement it.

**Refactor checkpoint.** The `isHttpExternalEntity` skip and the `idAttribute` registration are shared by `create` and `IfMissing` in each store.

**Validation.** The file on `test-indexedDb` (and `test-mongodb`); type check every store package and core; `npm run nonreg:filesystem -- --runner shared --scope smoke,actions --storage indexedDb`.

**Realization.** _(on completion)_

### Slice A3 — SQL: an attribute added to an Entity row gets a nullable column

**Status:** ⬜ pending

**Goal.** On PostgreSQL, an optional or required attribute added to an Entity row through an instance write gets its column, nullable, and the next upsert stores its value (G5).

**RED.** `entityRowUpdateSqlTable.integ.test.ts` (#715, Entity `Note715` of Library) flipped: after the commit the data table has the new column, nullable; a `Note715` written with the new attribute reads back with its value. A second commit that removes the attribute leaves the column (add-only).

**GREEN.** `SqlDbStoreSection` reconcile: `IfMissing`, `describeTable`, `addColumn` (nullable) for the missing ones, then the Sequelize model redefined as `alterEntityAttribute` does.

**Refactor checkpoint.** `alterEntityAttribute` and the reconciliation share the redefinition.

**Validation.** The #715 test on `emulatedServer-sql` (needs PostgreSQL); type check `miroir-store-postgres`; `npm run nonreg:default -- --runner shared --scope smoke,actions` when PostgreSQL runs.

**Realization.** _(on completion)_

### Slice A4 — Storage drops by Entity row, whole Entity or one attribute

**Status:** ⬜ pending

**Goal.** A drop step removes the storage of an Entity, or one attribute from it, given the Entity row, whether or not the store still knows the Entity (D4).

**RED** (`entityStorageDrop.9.phaseA.integ.test.ts`):
- filesystem: drop of an attribute removes it from every stored instance; drop of an Entity removes its folder; both again do nothing.
- SQL (PostgreSQL): the column is dropped; after the Entity row is deleted and the store restarted, the drop of the Entity removes its table by name.

**GREEN.** `storeManagementAction_dropEntityStorage`; `dropAttributeStorageForInstancesOfEntity` on every store section; SQL drops by the name the row gives.

**Refactor checkpoint.** None expected.

**Validation.** The file on `test-filesystem` and on `emulatedServer-sql`; type check the stores; full `npm run nonreg:filesystem -- --runner shared` (end of part A); PR A.

**Realization.** _(on completion)_

---

## Part B — Formats and roles

### Slice B1 — A deployment set following at its current version (tracer)

**Status:** ⬜ pending

**Goal.** An operator marks appForTest's deployment as following at `1.0.0`, and the Admin state record says so (G4).

**RED** (`deploymentRole.9.phaseB.integ.test.ts`, appForTest `versioned-internal`, traces on, via `versioningTestSetup.ts`): freeze `1.0.0`; `setDeploymentRole { following, version: "1.0.0" }` succeeds; the `DeploymentState` row reads back with `role: following`, `version: "1.0.0"`; the client's local cache holds it (Admin reloaded). Characterization, passing through the generic `requiredCapability` path once the action is declared: without the `versioning` capability it is refused with `FeatureUnavailable`.

**GREEN.**
- `DeploymentState` Entity file in `miroir-app-admin`, with `admin_data/14e696c6-…/.gitkeep` (a filesystem data section refuses rows of an Entity without a folder, and Git drops empty folders; `admin_data/a96856df-…` does the same); `Migration` Entity file in `miroir-app-miroir`, in `metaModelEntityList`, and a `migrations` collection in `MetaModel`; the three action definitions on the Model Endpoint; schema rebuild.
- `handleAction_setDeploymentRole` in the package, with the Entity created when absent; registered in `actionImplementations` and `VERSIONING_ACTION_IMPLEMENTATION_NAMES`; server-routed; the client reloads Admin after it.

**Refactor checkpoint.** `ensureRecordEntity` generalized to "ensure a meta-model Entity in a deployment's section", used by the record, the Migration and the state Entities.

**Validation.** The file; `modelValidation` of `miroir-app-miroir` and `miroir-app-admin`; type check core and versioning; `npm run test -w @miroir-framework/core -- ''`; scoped nonreg `smoke,core,actions,external`.

**Realization.** _(on completion)_

### Slice B2 — A following deployment refuses model and `modelVersion` writes

**Status:** ⬜ pending

**Goal.** Once following, the deployment's model cannot be edited and nothing is written to its `modelVersion` (G2, epic D5).

**RED**, in this order:
1. the server gate alone: an Entity row write marked `markRecordedBySender`, sent straight to the emulated server's DomainController (`handleAction`), as a remote client's write reaches it, is refused with `deploymentFollows`, the store unchanged;
2. a commit from the client is refused with `deploymentFollows`, no record appended (then the client's early refusal from its cache is added);
3. `freezeApplicationVersion`, `rebaselineEvolutionTraces` and `appendEvolutionTraceRecord` are refused;
4. a `data` write passes;
5. `setDeploymentRole { authoring }` restores editing; `setDeploymentRole` is refused while a Miroir transaction is open.

**GREEN.** The gate in the persistence process before model and `modelVersion` writes, reading the stored row; the client's early refusal from the cache; the run mark (`markMigrationRun`, `isMigrationRun`), which lets a marked write through (tested by a marked Entity row write passing on the server); `applicationsWithEvolutionTraces` leaves following deployments out. The mark's copy to composite children waits for a step that writes `model` or `modelVersion` through a composite; none does in #9 (data steps write `data`), so it is not built.

**Refactor checkpoint.** The gate and `evolutionTraceRefusal` share one "may this commit write this application's model" check.

**Validation.** The file; `integ-708-evolution-trace-records` and `integ-696-versioning-capability` still pass; scoped nonreg `smoke,actions,external`.

**Realization.** _(on completion)_

### Slice B3 — A deployment set following at an earlier version gets its model

**Status:** ⬜ pending

**Goal.** Epic section 9's start: the deployment, at `1.1.0` after an added optional attribute, is set following at `1.0.0` and its model is `1.0.0`'s, its data and storage kept (G2, D2).

**RED.** Freeze `1.0.0`; add `isbn`-like attribute to an appForTest Entity, commit, write an instance with it, freeze `1.1.0`; `setDeploymentRole { following, version: "1.0.0" }`:
- the live model equals `frozenModelState(1.0.0)` over the agreement collections;
- the `EvolutionTraceRecord` and history Entity rows are still in `model`; the `modelVersion` rows are unchanged; no record was appended;
- the rows rewritten keep their live `parentDefinitionVersionUuid` and `conceptLevel`;
- the instance still holds its attribute value in storage (filesystem file).

**GREEN.** `applyModelState` in the package (D2), through instance writes marked with the run mark and the reconcile action; the reload.

**Refactor checkpoint.** Rows written by the rewrite go through one function shared with the freeze's row selection.

**Validation.** The file; full `npm run nonreg:filesystem -- --runner shared` (end of part B); PR B.

**Realization.** _(on completion)_

---

## Part C — Generation

### Slice C1 — A draft Migration for one optional attribute (tracer)

**Status:** ⬜ pending

**Goal.** The designer of appForTest gets the draft of epic section 5.1 (G1).

**RED** (`migrationGeneration.9.phaseC.integ.test.ts`): freeze `1.0.0`, add an optional attribute through an Entity row update, commit, freeze `1.1.0`; `generateMigration { from: "1.0.0", to: "1.1.0" }` writes a Migration in `modelVersion` with `source: traces`, one `addAttribute` change (backward-compatible, supported), one empty fill step (`repeatable`, `backwardCompatible`), no expand and no contract step, `backwardCompatible: true`.

**GREEN.** `handleAction_generateMigration`: states, records between markers, agreement, changes from records, classification, steps; the Migration Entity ensured; written with `createInstance` in `modelVersion`; `generateMigration` added to `SERVER_ROUTED_MIROIR_ACTION_TYPES`.

**Refactor checkpoint.** The walk of records shares the replay's `applyRecordActions` (`modelStates.ts`) instead of a second interpreter.

**Validation.** The file; versioning unit tests; type check versioning; scoped nonreg `smoke,actions,external`.

**Realization.** _(on completion)_

### Slice C2 — Removals, required attributes, renames: classified and stepped

**Status:** ⬜ pending

**Goal.** Generation flags what breaks rollback (G1, epic D1, Q23).

**RED.** Each between two frozen versions:
- an attribute removed: `removeAttribute`, not backward-compatible, one `dropAttributeStorage` step carrying the `from` Entity row;
- an Entity removed through `dropEntity`: `removeEntity` and a `dropEntityStorage` step;
- a required attribute added: not backward-compatible, with its fill step;
- an Entity renamed through its row: `renameEntity`, `supported: false`; `idAttribute` changed: `changeIdAttribute`, `supported: false`;
- an attribute added then removed between the two versions: no change.

**GREEN.** The remaining change kinds, folding, and drop steps; the check of the folded changes against the `to` Entities.

**Refactor checkpoint.** The classification table is one function, unit-tested in the package with real Entity rows from the appForTest assets.

**Validation.** The file; versioning unit tests; scoped nonreg `smoke,actions,external`.

**Realization.** _(on completion)_

### Slice C3 — Refusals and the diff fallback

**Status:** ⬜ pending

**Goal.** Generation refuses what it cannot vouch for and still serves an application without traces (G1, Q29, Q30, D12).

**RED.**
- the traces and the versions disagree: after the second freeze, the test edits a trace record's file in `modelVersion` (the freeze's own check prevents freezing a model that disagrees); generation is refused with `evolutionTracesDisagree`, listing the difference;
- a `rebaseline` marker between the versions: refused with `migrationAcrossRebaseline`; a Migration written by hand (`source: manual`) through `createInstance` is stored and readable;
- traces off: a Migration with `source: diff` and the same changes as C1;
- a second generation for the same versions: refused with `migrationExists`, accepted with `replace: true`;
- on a following deployment: refused with `deploymentFollows`.

**GREEN.** The refusals; the diff path from `diffModelStates`, with names and `idAttribute` from the changed rows.

**Refactor checkpoint.** `modelCudMigrationCandidates` and the diff path share the Entity-row reading.

**Validation.** The file; scoped nonreg `smoke,actions,external`.

**Realization.** _(on completion)_

### Slice C4 — `versioned-git`: from the tag to `HEAD`

**Status:** ⬜ pending

**Goal.** With the model in Git, the draft is made between tag `1.0.0` and `HEAD`, and lands as a file to commit before tagging `1.1.0` (G1, epic section 5.2).

**RED** (`migrationGenerationGit.9.phaseC.integ.test.ts`, on the Git testbed of `gitTraceAgreement.integ.test.ts`): commit and tag `1.0.0`; add an attribute, commit; `generateMigration { from: "1.0.0", to: "1.1.0" }` writes `modelVersion/<Migration uuid>/<uuid>.json` in the work tree with the C1 content. The refusal without a `modelVersion` section is tested by removing that section from the testbed Deployment's configuration in the test.

**GREEN.** States from `gitModelState`; records at `HEAD` not at the tag.

**Refactor checkpoint.** None expected.

**Validation.** The file; the #679 Git nonreg step still passes; full `npm run nonreg:filesystem -- --runner shared` (end of part C); PR C.

**Realization.** _(on completion)_

---

## Part D — Runner

### Slice D1 — A Migration run on a following deployment (tracer)

**Status:** ⬜ pending

**Goal.** Epic section 9, E1's apply step: the deployment, put back at `1.0.0` and following, is migrated to `1.1.0`, its data filled (G2, G4).

**RED** (`migrationRun.9.phaseD.integ.test.ts`): C1's versions, with `1.1.0` also adding a new Entity whose instances the fill step creates (so the jump's reconciliation is observed: on the filesystem the new Entity needs its folder), and the fill step completed by the test (an `updateInstance` setting the attribute where it is empty, and a `createInstance` of the new Entity); B3's `setDeploymentRole { following, "1.0.0" }`; `runMigration`:
- the live model equals `frozenModelState(1.1.0)`; the instances have the filled value;
- the new Entity's instance is stored;
- the state record says `version: "1.1.0"`, `applied` holds the migration, no `run`;
- no trace record was appended;
- a second `runMigration` is refused with `migrationNotAtFrom`;
- a Migration row whose `backwardCompatible` the test set wrong is recomputed by the runner (the record copy holds the recomputed value);
- two `runMigration` sent together: one runs, the other is refused with `migrationRunInProgress` or `migrationNotAtFrom`, never interleaved.

**GREEN.** `handleAction_runMigration`: lock, checks, copy, steps with the mark, jump with `applyModelState`, end; server-routed; Admin reloaded on the client.

**Refactor checkpoint.** `setDeploymentRole` and the jump share the "bring the model to a version" path.

**Validation.** The file; scoped nonreg `smoke,actions,external,runners`.

**Realization.** _(on completion)_

### Slice D2 — A stopped run resumes

**Status:** ⬜ pending

**Goal.** A run stopped part way resumes and ends where an uninterrupted run ends (G3, epic section 9's failure row).

**RED.**
- a Migration with two expand steps, the second failing on a precondition the test then satisfies: the first run stops with `run.stepsDone` holding the first step; the test then edits the Migration's file in `modelVersion` on disk (the following deployment refuses that write through Miroir); the second run uses the copy, runs from the second step, and ends with the same data as D1's uninterrupted run;
- a stop between a step's writes and its record: a repeatable step whose writes land and whose last action fails on a precondition; the run stops with that step not in `stepsDone`; once the precondition holds, the rerun runs the whole step again and the data equals a single run's;
- a run in progress refuses another Migration with `migrationRunInProgress`, and `setDeploymentRole` too.

**GREEN.** Resume from `stepsDone`; refusals while `run` is set.

**Refactor checkpoint.** None expected.

**Validation.** The file; scoped nonreg `smoke,actions,external`.

**Realization.** _(on completion)_

### Slice D3 — Contract steps drop storage

**Status:** ⬜ pending

**Goal.** E1's breaking-change row: `1.1.0 → 1.2.0` removes the attribute and its contract step drops it from storage (G2, D4).

**RED.** Filesystem: after the run, no stored instance holds the attribute; the state record lists both migrations. The SQL drop itself is proved by A4.

**GREEN.** Contract steps run through `storeManagementAction_dropEntityStorage`.

**Refactor checkpoint.** None expected.

**Validation.** The file on `test-filesystem`; scoped nonreg `smoke,actions`.

**Realization.** _(on completion)_

### Slice D4 — Runner refusals

**Status:** ⬜ pending

**Goal.** The runner refuses what it cannot run safely (G2).

**RED.** Refused, the store unchanged: on an authoring deployment (`deploymentAuthors`); a Migration holding an unsupported change (`migrationUnsupportedChange`). Characterizations, passing through the generic paths of `forwardCapabilityAction` and `requiredCapability`: with a Miroir transaction open; without the `versioning` capability (`FeatureUnavailable`).

**GREEN.** The remaining checks.

**Refactor checkpoint.** All refusal reasons in one exported constant set, used by the tests.

**Validation.** The file; scoped nonreg `smoke,actions,external`.

**Realization.** _(on completion)_

### Slice D5 — `versioned-git`: the jump is a checkout of the tag

**Status:** ⬜ pending

**Goal.** E2's apply step: a following Git deployment at tag `1.0.0` reads the Migration at tag `1.1.0` and checks it out (G2, epic section 5.2).

**RED** (`migrationRunGit.9.phaseD.integ.test.ts`): the Git testbed commits `data/` inside the repository (`gitTestSetup.ts`, `initCommittedRepository`), so this test adds a `.gitignore` for `data/` to it, after checking that the checkout's dirty check honours ignored files. C4's repository with the Migration committed and tag `1.1.0`; checkout `1.0.0`; `setDeploymentRole { following, "1.0.0" }` passes (checked out at the tag); `runMigration`: `HEAD` is at `1.1.0`, the model reloaded, the data filled, the record at `1.1.0`. `setDeploymentRole { following, "1.0.0" }` while checked out elsewhere is refused (analysis D6). Without the `.gitignore`, an expand step writing data makes the checkout refuse, and the run stays resumable.

**GREEN.** Find at tag; the Git jump; reconciliation after the checkout; `setDeploymentRole` on `versioned-git` compares the checkout with the tag of the version instead of rewriting.

**Refactor checkpoint.** None expected.

**Validation.** The file; the #679 Git nonreg step; full `npm run nonreg:filesystem -- --runner shared` (end of part D).

**Realization.** _(on completion)_

### Slice Z — MiroirTest scenario, nonreg steps, docs, cleanup, AC

**Status:** ⬜ pending

- MiroirTest `action.scenario.migration` (appForTest, filesystem, tag `versioning`): freeze, change, freeze, generate, set following at the first version, run, assert the state record and the data.
- Nonreg steps `integ-9-*` with scopes (`actions`, `external`; `runners` for D), tier `default`, filesystem; the SQL slices under the sql profile's tier.
- Docs: `docs/reference/versioning.md` (Migrations, deployment roles, the runner, reconciliation); `docs/reference/data-architecture-deployments.md` (the Admin `DeploymentState`).
- Cleanup: the `issues/9-migrations/` tests move to feature-named suites under `tests/3_controllers/versioning/` and `tests/4_storage/`.
- Tracer narrative: the epic section 5.1 day, run by the MiroirTest.

**AC checklist** (issue #9 scope, in its order):

| Scope item | Proof |
|---|---|
| `Migration` Entity in `modelVersion`, `from`/`to` by version name, four phases, `backwardCompatible` and repeatable steps | B1 (Entity), C1 (row), D1 (jump, fill), D2 (expand, repeatable), D3 (contract) |
| Generation on demand, agreement first | C1, C3 |
| Structure steps from traces checked against the diff, or the diff alone | C1, C2, C3 |
| Non-backward-compatible steps flagged | C2 |
| With Git, from the source tag to `HEAD`, committed before the target tag | C4, D5 |
| Runner checks the deployment is at `from` | D1, D4 |
| Copies the migration into the state record before its first step | D2 |
| Suppresses tracing during the run | D1 (no record), B2 |
| Records each step, resumes after a stop | D2 |
| Jump: rewrite without Git (N1), checkout with Git, then add-only reconciliation | D1, D5 |
| Idempotent `createStorageSpaceForInstancesOfEntityIfMissing` on every store | A1, A2 |
| Add-only reconciliation after any change to an Entity row | A1, A3 |
| Deployment state record in Admin data keyed by Deployment uuid: version, migrations, steps, role | B1, D1, D2 |
| A following deployment writes nothing to `modelVersion`, its model commits refused | B2 |

**Validation.** Full `npm run nonreg:filesystem -- --runner shared`; the pre-push gate of `AGENTS.md`; PR D with `Closes #9`.

**Realization.** _(on completion)_
