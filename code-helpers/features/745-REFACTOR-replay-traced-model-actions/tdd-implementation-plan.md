# Issue #745 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController, the emulated server and the store profiles
> (`test-filesystem`, `test-sql`, `test-indexedDb`, `test-mongodb`), through the Model Endpoint
> actions `generateMigration`, `runMigration` and `settleMigrationStep`, and through the `createEntity`,
> `alterEntityAttribute` and `renameEntity` model Actions. No mocks. The tracer bullet proves that a
> migration run on a following deployment executes a traced `createEntity` as its own step, instead of
> rewriting the model to the frozen version.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/745
Prerequisite: [`../9-FEATURE-create-migrations-for-model-and-data-updates/`](../9-FEATURE-create-migrations-for-model-and-data-updates/) ✅
Working branch: `claude/745-replay-traced-model-actions`

**Resume note:** decisions accepted by the user (2026-11-16); plan reviewed three times (the last round checked feasibility against the code, and coverage of the analysis); Slice 0 next.

---

## Scope

- G1: a migration run executes, in order, the model Actions the designer ran between two versions, with data steps among them (Slices 1, 2).
- G2: a data step can go between any two model steps; the adds and removes of one `alterEntityAttribute` are separate steps (Slice 2).
- G3: a migration run stops with an explicit error at the first state it did not expect, instead of working around it and continuing (Slices 3 to 7).
- G4: a stopped migration run continues at the first step not started; a step recorded as started and not done stops the migration run until the operator settles it with `settleMigrationStep` (Slice 5).

This plan does **not** cover:
- Git follower migration runs beyond the provisional checkout step (#747);
- the Migration package and the reference package of a version (#746);
- what a hand-written step may hold (#741);
- refusing instance writes on Entity rows, and the model Action for the Entity fields that change no storage (#748);
- column type, nullability, key and reference changes (follow-up filed in Slice 0);
- the retry of a failed authoring commit under D4 (follow-up filed in Slice 0);
- rollback and leftover storage (#709);
- a step and its record committed in one SQL transaction (later, D5-c);
- Migrations of Miroir itself (refused, D2).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize; servers; follow-up issues | ⬜ | versioning suites on the branch base; `createEntityStrict.integ` with today's behaviour |
| 1 | Tracer: a migration run executes a traced `createEntity` from a Migration with one ordered step list | ⬜ | `migrationRun.integ` C1 |
| 2 | Steps in trace order, adds and removes split, Entity row writes refused, steps checked by replay | ⬜ | `migrationGeneration.integ` B4.x |
| 3 | Changes no model Action can apply are refused; rename and drop replayed | ⬜ | `migrationClassification.unit`, `migrationRun.integ` C3, C9 |
| 4 | `createEntity` fails on an existing row or storage, on every store | ⬜ | `createEntityStrict.integ` on four profiles; `migrationRun.integ` C6 |
| 5 | A step runs once: started, done, in doubt, settled | ⬜ | `migrationRun.integ` C2, C7 |
| 6 | The migration run checks the model against the reference versions | ⬜ | `migrationRun.integ` C8 |
| 7 | SQL alter and rename change only the columns and table they name, checking first | ⬜ | `entityRowUpdateSqlTable.integ` on `test-sql` |
| 8 | Nonreg, documents, acceptance criteria | ⬜ | full `nonreg:filesystem` and `nonreg:default`; AC table |

---

## Locked implementation defaults

From the analysis decision record, accepted by the user on 2026-11-16 (D3 tentatively). Deviations go into the slice's Realization.

| Decision | Choice | Serves |
|---|---|---|
| D1 | One `steps` list; step `{ uuid, name, kind: "model" \| "data", backwardCompatible, action, trace? }`; no `expand`, `fill`, `contract`, `repeatable`. Git: one model step, the checkout of `to`. Rows in #9's shape refused (`migrationStepsInvalid`), stored or in a migration run in progress. | G1, G2 |
| D2 | One step per model Action, in trace order; a `createEntity` of several Entities gives one step per Entity; an `alterEntityAttribute` adding and removing gives the add, an empty data step `fill <Entity>.<attribute>` per added attribute, then the remove. Refused: a record with an instance write on an Entity row (`migrationEntityRowWrite`), an incomplete record (`migrationIncompleteRecord`), Miroir (`migrationUnsupportedApplication`), with traces off a difference no model Action can write until #748 (`migrationNoModelAction`). Settings rows listed as `settingsChange`, not replayed. Generation checks its steps, replayed in memory on `from`, against `to`. With traces off (`source: diff`): the same Actions in the fixed order of the analysis. | G1, G2 |
| D3 | `changeAttribute`, `changeIdAttribute` and a required attribute added to an existing Entity: `supported: false`, refused before step 1; `renameEntity` supported | G3 |
| D4 | Each store's `createEntity`: check the row (`getInstance` on the Entity table), check the storage (physical probe), create the storage, write the row; `entityExists` / `storageExists`; a failed storage creation writes no row; `createEntities` checks all Entities before creating any; external Entities exempt. The reset also drops the tables of the schema that neither section registered and no external Entity names. | G3 |
| D5 | `run.stepStarted`; any step failure leaves the step in doubt; `migrationStepInDoubt` on the next `runMigration`; `settleMigrationStep { application, step, outcome: "done" \| "notRun" }`; `migrationAlreadyApplied` | G3, G4 |
| D6 | The frozen `from` and `to` versions are the reference, read from the `modelVersion` section the following deployment can read (the reference package comes with #746). Compared as the agreement check compares (`diffModelStates` over `comparedCollections`, every compared collection, a collection the reference has no rows of reads as empty). Before step 1: live = `from`, steps replayed in memory = `to`; after the last step: live = `to`. No reference: `migrationReferenceMissing`. The check runs after the existing checks (role, `from`, unsupported changes, step shape). Git: `checkedOutVersion` only. | G3 |
| D7 | SQL `alterEntityAttribute`: check (an added column must not exist, a removed one must exist; virtual attributes have no column and are skipped), `addColumn` / `removeColumn` for the named columns, then the row. SQL `renameEntity`: check the target table does not exist, rename (result checked), then the row. | G3 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Model Endpoint action | `settleMigrationStep`, declared in the Model Endpoint `7947ae40-eb34-4149-887b-15a9021e714e` (`miroir-app-miroir/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json`), implemented as `handleAction_settleMigrationStep` in `@miroir-framework/versioning` |
| Migration Entity attribute | `steps` (removed: `expand`, `fill`, `contract`) |
| DeploymentState attribute | `run.stepStarted` |
| Change kind | `settingsChange` |
| Refusal reasons (generation and `MIGRATION_RUN_REFUSALS`) | `migrationEntityRowWrite`, `migrationIncompleteRecord`, `migrationUnsupportedApplication`, `migrationNoModelAction`, `migrationStepInDoubt`, `migrationStepNotInDoubt`, `migrationAlreadyApplied`, `migrationModelMismatch`, `migrationReferenceMissing` |
| Store refusals (`errorContext.reason`) | `entityExists`, `storageExists`, `columnExists`, `columnMissing`, `tableExists` |
| Store method | `storageSpaceExists?(entity): Promise<boolean>`, optional on the section interfaces (as `hasStorageSpaceForInstancesOfEntity` is), a physical probe, used only by `createEntity` |
| New vitest file | `packages/miroir-standalone-app/tests/4_storage/createEntityStrict.integ.test.ts` (not reachable through MiroirTest: it checks the stores' own storage after writing to them directly) |
| Nonreg step | `integ-create-entity-strict`, `"requires": "storage"`, `--profile {profile}`, shared group `standalone-app-profile`, scopes `actions` (as `integ-715-entity-row-update-sql-table`) |

No issue-scoped test directory is created: the new tests go into feature-named files.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Migration run tests (filesystem) | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/migrationRun` (the pattern also matches `migrationRunGit`) |
| Generation tests | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/migrationGeneration` (also matches `migrationGenerationGit`) |
| All versioning integration tests | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning` |
| Versioning unit tests | `npm run test -w @miroir-framework/versioning` |
| Store strictness | `MIROIR_ENV=test-<filesystem\|indexedDb\|sql\|mongodb> npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict` |
| SQL table changes | `MIROIR_ENV=test-sql npm run testByFile -w miroir-standalone-app -- 4_storage/entityRowUpdateSqlTable` |
| MiroirTest scenario | `npm run testMiroir -w miroir-standalone-app -- --suites action.scenario.migration --mode integration` |
| Core surface tests | `npm run testByFile -w @miroir-framework/core -- versioningSurface ActionImplementations endpointActionListing.capability` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run build -w miroir-app-admin && npm run devBuild -w @miroir-framework/core` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`, and the same with `packages/miroir-versioning`, `packages/miroir-store-filesystem`, `packages/miroir-store-indexedDb`, `packages/miroir-store-postgres`, `packages/miroir-store-mongodb`, `packages/miroir-store-bundled`, `packages/miroir-standalone-app` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,actions[,core]` |

---

## Slice 0 — Characterize; servers; follow-up issues

**Status:** ⬜ pending

**Goal:** a recorded baseline, the servers the later slices need, and the two follow-up issues the analysis names.

**Characterization (no production change):**
- Run the versioning integration and unit tests at the branch base on `test-filesystem`; record pass/fail per file.
- Write `createEntityStrict.integ.test.ts` asserting **today's** behaviour per profile: `createEntity` on an Entity whose storage exists (a first `createEntity`, then its row deleted with `deleteInstance`) succeeds, and its instances are kept (filesystem, IndexedDB, MongoDB) or lost (SQL). These assertions flip in Slice 4.
- The watch list for Slice 4: the nonreg steps whose files call `createEntity` or `resetModel` (a grep over `packages/*/tests` and the MiroirTest assets).

**Servers:**
- PostgreSQL: start cluster 16/main (`pg_ctlcluster 16 main start`), set the password of the `postgres` user (`environments/test-sql.json` connects as `postgres`), export `MIROIR_POSTGRES_PASSWORD`, record the `test-sql` baseline of `entityRowUpdateSqlTable` and `createEntityStrict`.
- MongoDB: install `mongodb-memory-server` with `--no-save` in a scratch folder outside the repository (no change to `package.json` or the lockfile) and start a `mongod` on `localhost:27017`. If its binary download is refused, MongoDB stays unproven and the PR says so (accepted by the user).

**Follow-up issues (filed now, so the D3 notes and the PR can name them):**
- column type, nullability, key and reference changes as model Actions (D3-c);
- the retry of an authoring commit that failed part way, which D4 makes fail (analysis section 4.4).

**Validation:**
```bash
pg_ctlcluster 16 main start && pg_isready
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning
npm run test -w @miroir-framework/versioning
for env in filesystem indexedDb sql mongodb; do MIROIR_ENV=test-$env npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict; done
```

### Realization
_(to fill)_

---

## Slice 1 — Tracer: a migration run executes a traced `createEntity` from a Migration with one ordered step list

**Status:** ⬜ pending

**Goal:** the Migration row holds one ordered `steps` list (D1); generation writes the traced model Actions as model steps; a migration run executes them in order with the data steps, without `bringModelToVersion`. Git generation writes the checkout step, and the Git migration run executes it.

**RED:**
- `migrationRun.integ.test.ts` C1, rewritten:
  - appForTest's traces are turned on before 1.0.0 is frozen (as `migrationGeneration.integ` lines 85–87 and 117 do) and off in `afterAll`.
  - 1.1.0 adds `EditionC9` through `createEntity` (the attribute `mottoC9` comes in Slice 2).
  - The draft has `source: "traces"` and `steps` `[createEntity EditionC9]`, kind `model`, its `trace` naming the record. The designer appends a data step creating the first edition and stores the completed Migration.
  - The following deployment: its `model` and `data` folders are copies of the authoring ones taken right after 1.0.0 is frozen; its own `modelVersion` folder is a copy taken after the completed Migration is stored (it holds the frozen 1.0.0 and 1.1.0, the references of Slice 6). A helper `writeFollowingMigration(folder, row)` writes a Migration file into that folder, replacing the import of #746 until it exists (a following deployment refuses `modelVersion` writes through Miroir, `DomainController.ts` lines 291–292).
  - After the migration run: the `EditionC9` data folder exists and was created during the migration run (absent before it), it holds the first edition, the state is at 1.1.0, and the following deployment's model equals the authoring 1.1.0 model (`ownModel`).
- `migrationGeneration.integ.test.ts`: every B test moves to `steps` and changes Entities through model Actions (`alterEntityAttribute`, `renameEntity`, `dropEntity`), not through `writeEntity` (an `updateInstance` of the Entity row, which Slice 2 refuses). B2.4 (`idAttribute` changed) runs with traces off (`source: diff`). B3.1 (traces disagree) uses a Report update instead of an Entity `tag`.
- `migrationRun.integ.test.ts` C2, C3, C5: ported to `steps`, their rows written with `writeFollowingMigration`. C2 keeps #9's resume semantics (a failed step run again) until Slice 5.
- `migrationClassification.unit.test.ts`: the test of `migrationSteps` ("a fill step per added attribute…", lines 90–95) moves to the step builder of D2.
- `migrationRunGit.integ.test.ts` C4 and `migrationGenerationGit.integ.test.ts`: the Git draft holds one model step, the checkout of `to`; the migration run moves the clone as before. A Migration in #9's shape committed at a tag is refused (`migrationStepsInvalid`).
- A stored Migration in #9's shape is refused (`migrationStepsInvalid`).

**GREEN:**
- Migration Entity schema (`b5c1f0e5-…json`): `steps`, remove `expand`, `fill`, `contract`; schema rebuild.
- `MigrationRow`, `MigrationStep`; `draftMigration` builds `steps` from the records between the markers (model Actions as they are, one step each, `createEntity` one step per Entity); without records, from the diff (`createEntity` / `dropEntity` here; the rest in Slice 2).
- `migrationRun.ts`: the steps run in list order. A `model` step runs its Action through `handleModelAction` (model Actions) or `handleInstanceAction` (model-row instance writes), marked with `markMigrationRun`, `transactional: false`, then a model reload; a `data` step runs through `handleCompositeAction` as in #9 (`runStep` would iterate `payload.actionSequence` of a bare model Action, `DomainController.ts` line 4829). The jump, `JUMP_STEP` and the call to `bringModelToVersion` go. Git: the checkout step runs `checkoutVersion` then `reloadModel`.
- `recomputedBackwardCompatible` over `changes` and `steps`.

**Refactor checkpoint:** `applyModelState` keeps only its install callers; the Git checkout step and the internal model step share one function "execute a model step, then reload".

**Validation:**
```bash
npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core && npm run build -w @miroir-framework/versioning
npm run test -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning
npx tsc --noEmit --skipLibCheck -p packages/miroir-versioning/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions
```

### Realization
_(to fill)_

---

## Slice 2 — Steps in trace order, adds and removes split, Entity row writes refused, steps checked by replay

**Status:** ⬜ pending

**Goal:** the D2 table, its refusals in their order, settings rows listed, and the check of the steps replayed in memory.

**RED (`migrationGeneration.integ.test.ts`):**
- B1: `Publisher.mottoC9` added with `alterEntityAttribute` gives `[alterEntityAttribute add mottoC9 (model), fill Publisher.mottoC9 (data)]`.
- B4.1: one `alterEntityAttribute` adding `a` and removing `b` gives the add, its fill step, then the remove (kinds `model`, `data`, `model`).
- B4.2: an attribute added by an `updateInstance` of the Entity row refuses generation (`migrationEntityRowWrite`, naming the record), nothing written; the same for `createInstance` and `deleteInstance` of an Entity row.
- B4.3: a Report created, updated and deleted between the versions gives three `model` steps (they are model-row writes, replayed by D2's check); a SelfApplication write (the traces switch) gives no step and a `settingsChange` in `changes`.
- B4.4: an incomplete record between the versions refuses (`migrationIncompleteRecord`); generation for Miroir refuses (`migrationUnsupportedApplication`).
- B4.5: traces off: the diff gives the model Actions in the fixed order (Entities created before attributes added).
- B4.6: traces on, `Publisher` altered first, then `EditionC9` created: the steps are the alter, its fill step, then the `createEntity` (trace order, the opposite of B4.5's fixed order).
- B4.7: one `createEntity` of two Entities gives two steps.
- B4.8: traces off, an Entity `description` changed between the versions: refused (`migrationNoModelAction`, naming the Entity and the field) until #748 adds its Action. This is the failing case of the replay check.
- `migrationRun.integ.test.ts` C1 extended with `mottoC9` (added with `alterEntityAttribute`): after the migration run, the following deployment's Publisher rows have the motto the fill step wrote.

**GREEN:** generation walks the records with the replayed state (`applyRecordActions` per Action), splits `alterEntityAttribute`, refuses Entity row writes after the check of the raw records; the replay of the steps in memory (`ModelEntityActionTransformer.modelActionToInstanceAction`, which handles `createEntity`, `alterEntityAttribute` with `addColumns` and `removeColumns`, `renameEntity` and `dropEntity`, then `applyInstanceWrite`) compared with `to`; the diff path in its fixed order; the refusals.

**Refactor checkpoint:** one step builder for the trace path and the diff path; `addedAttributes` moves from `applicationVersionInstall.ts` to a module both use.

**Validation:**
```bash
npm run build -w @miroir-framework/versioning
npm run test -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization
_(to fill)_

---

## Slice 3 — Changes no model Action can apply are refused; rename and drop replayed

**Status:** ⬜ pending

**Goal:** D3, and `renameEntity` / `dropEntity` executed by a migration run.

**RED:**
- `migrationClassification.unit.test.ts`: `changeAttribute` (type, made required, enum, foreign key target), `changeIdAttribute`, and an `addAttribute` that is required on an existing Entity are `supported: false`, each note naming the follow-up issue of Slice 0; an `addAttribute` required on an Entity the Migration creates is supported; `renameEntity` is supported; a `tag`-only change is no change.
- `migrationGeneration.integ.test.ts` B2.3 (required attribute added to an existing Entity) and B2.4 (`idAttribute` changed, traces off): the changes are `supported: false`.
- `migrationRun.integ.test.ts` C3: a Migration generated with traces off (`source: diff`) between two versions where `Publisher.name` changes type is refused before step 1 (`migrationUnsupportedChange`), nothing written.
- `migrationRun.integ.test.ts` C9: a Migration whose steps are a traced `renameEntity` and a traced `dropEntity`: after the migration run, the renamed Entity's instances are kept, the dropped Entity's storage is gone.

**GREEN:** `entityStructureChanges` classification; the migration run's unsupported-change check stays as it is.

**Refactor checkpoint:** the classification table and its notes in one place.

**Validation:**
```bash
npm run build -w @miroir-framework/versioning
npm run test -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization
_(to fill)_

---

## Slice 4 — `createEntity` fails on an existing row or storage, on every store

**Status:** ⬜ pending

**Goal:** D4, and a migration run's `createEntity` step failing on storage left behind.

**RED:**
- `createEntityStrict.integ.test.ts` (Slice 0's file, assertions flipped), per profile:
  - the row exists: `entityExists`; only the storage exists (row deleted, or storage made through the store): `storageExists`; in both cases the storage and its instances are unchanged and no row is written;
  - a storage creation that fails writes no row;
  - an external HTTP Entity created twice succeeds;
  - `createEntity` of two Entities, the second existing: the error is returned (SQL included) and the first is not created either.
- IndexedDB: an orphan sublevel holding a key, written through the store's own Level handle (Level locks its directory), is found.
- SQL: after a reset, a table of the schema that neither section registered is gone, and after a reset of the data section the model tables are still there.
- `migrationRun.integ.test.ts` C6, with its own following deployment at 1.0.0 holding an `EditionC9` data folder before the migration run: the migration run stops at the `createEntity` step with `storageExists`, the folder's files unchanged.
- `followingDeployment.integ.test.ts`: an install whose history Entities are missing from the model but whose storage exists for one of them (an orphan) fails, naming the storage (`ensureVersionHistoryEntities`); the same for `ensureApplicationEntity` and the Migration Entity on an authoring deployment.

**GREEN:**
- `storageSpaceExists` on each store section: filesystem (`fs.existsSync` of the Entity's folder), SQL (`queryInterface.tableExists`), IndexedDB (`db.sublevel(uuid).keys({ limit: 1 })` or registered), MongoDB (`listCollections`). Optional on the interface; `ErrorDataStore`, `ErrorModelStore` and the three Bundled sections refuse `createEntity` as they do today, without a probe.
- Each mixin's `createEntity`: row check through `getInstance` on the Entity table, storage check, create the storage, write the row. `createEntities` checks all Entities first. External Entities exempt.
- `PersistenceStoreController.clear()` also drops the SQL tables of the schema that neither section registered and no external Entity names.
- The test stubs in `persistenceStoreController.sections.unit.test.ts` and `storeSectionClear.31.unit.test.ts` follow the interface.

**Refactor checkpoint:** the four mixins share the check order through one helper in core; the Slice 0 watch list is run, and a setup that relied on re-creation is fixed in the setup.

**Validation:**
```bash
npm run build -w @miroir-framework/core -w packages/miroir-store-filesystem -w packages/miroir-store-indexedDb -w packages/miroir-store-postgres -w packages/miroir-store-mongodb -w @miroir-framework/store-bundled
for p in miroir-core miroir-store-filesystem miroir-store-indexedDb miroir-store-postgres miroir-store-mongodb miroir-store-bundled; do npx tsc --noEmit --skipLibCheck -p packages/$p/tsconfig.json; done
for env in filesystem indexedDb sql mongodb; do MIROIR_ENV=test-$env npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict; done
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning
npm run test -w @miroir-framework/core -- ''
npm run nonreg:filesystem -- --runner shared
```
(The full filesystem nonreg runs here: `createEntity` is used everywhere.)

### Realization
_(to fill)_

---

## Slice 5 — A step runs once: started, done, in doubt, settled

**Status:** ⬜ pending

**Goal:** D5.

**RED (`migrationRun.integ.test.ts`):**
- C2 rewritten: a data step whose first write lands and second fails stops the migration run; `stepStarted` names it; the error names the step's uuid and name. The next `runMigration` fails `migrationStepInDoubt`, naming the step, without writing. After the first write is undone by hand, `settleMigrationStep … outcome: "notRun"` lets the next `runMigration` start that step again and finish.
- C6 extended: after its `storageExists` failure, the next `runMigration` fails `migrationStepInDoubt`, naming the `createEntity` step.
- C7:
  - `settleMigrationStep` naming a step that is not in doubt is refused (`migrationStepNotInDoubt`);
  - `outcome: "done"` moves the in-doubt step to `stepsDone`, and the next `runMigration` starts at the following step;
  - a second `runMigration` of a finished Migration fails `migrationAlreadyApplied`, nothing written;
  - a `run` in progress holding a Migration in #9's shape is refused (`migrationStepsInvalid`).
- C7 (characterization once Slice 4 is done, before this slice's GREEN): a migration run stopped between two steps (the state row written with `stepsDone` = the first step, a `createEntity`) continues at the second step; the first is not executed again, which is observable since executing it would fail with `storageExists`.
- C1 changes: the concurrent second `runMigration` and the final one fail with `migrationAlreadyApplied` instead of `migrationNotAtFrom`.
- `followingDeployment.integ.test.ts`: `settleMigrationStep` refused on an authoring deployment.

**GREEN:**
- DeploymentState schema (`miroir-app-admin`): `run.stepStarted`; schema rebuild. (`run` is optional and `migration` is `any`; the test Admin stores are reseeded per file.)
- The migration run records `stepStarted` before a step and `stepsDone` after it, in one `recordMigrationRun(state)` function; `migrationAlreadyApplied` before the `from` check.
- `settleMigrationStep`: declared in the Model Endpoint JSON; implemented and exported in `@miroir-framework/versioning` (`index.ts`); added to `VERSIONING_ACTION_IMPLEMENTATION_NAMES`, `SERVER_ROUTED_MIROIR_ACTION_TYPES` (`core/src/1_core/constants.ts`) and `MODEL_ACTIONS_ROUTED_TO_SERVER` (`RestServer.ts`); the lists asserted in `versioningSurface.unit` (line 137), `ActionImplementations.unit` (line 108) and `endpointActionListing.capability.unit` (line 66) updated.

**Refactor checkpoint:** every state write of the migration run goes through `recordMigrationRun`.

**Validation:**
```bash
npm run build -w miroir-app-miroir && npm run build -w miroir-app-admin && npm run devBuild -w @miroir-framework/core && npm run build -w @miroir-framework/versioning
npm run testByFile -w @miroir-framework/core -- versioningSurface ActionImplementations endpointActionListing.capability
npm run test -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions
```

### Realization
_(to fill)_

---

## Slice 6 — The migration run checks the model against the reference versions

**Status:** ⬜ pending

**Goal:** D6, as the user decided it.

**RED (`migrationRun.integ.test.ts` C8, and the earlier tests):**
- A following deployment whose Report file was changed on disk before the migration run (the following deployment refuses model writes through Miroir): refused (`migrationModelMismatch`), the message naming the Report and the difference, nothing written.
- A Migration whose model step was edited (an attribute renamed in its `addColumns`): refused before step 1, the steps replayed in memory differing from `to`.
- A following deployment whose `modelVersion` copy lacks the `from` version, then one lacking the `to` version: refused (`migrationReferenceMissing`, naming the version).
- A data step that writes a model row (allowed until #741): the migration run fails at the end check; the version is unchanged and `run` stays recorded. C5's nested `createEntity` in a data step now fails there too; its expectation changes here.
- A following deployment installed from a version frozen without Tests snapshots, its model holding no Tests: the migration run proceeds. The same deployment with a Test row added on disk: refused, naming the Test.
- C2, C3, C7 use versions frozen after the following deployment's `modelVersion` copy was taken: a helper `refreshFollowingVersions(folder)` copies the authoring version, Cross and `*Version` rows after each authoring freeze, so their references exist.
- `migrationRunGit.integ` C4 passes without references (Git uses `checkedOutVersion`).

**GREEN:** the references read with `frozenModelState` after resolving the Migration's `from` and `to` names to version uuids (`frozenStateOf` takes a uuid, `modelStates.ts` line 171), from the following deployment's `modelVersion` rows; a comparison next to `comparedCollections` that returns the agreement check's differences; the two checks, placed after the existing checks of `runToDo`.

**Refactor checkpoint:** the agreement check at freeze and the migration run's check share the comparison function.

**Validation:**
```bash
npm run build -w @miroir-framework/versioning
npm run test -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization
_(to fill)_

---

## Slice 7 — SQL alter and rename change only the columns and table they name, checking first

**Status:** ⬜ pending

**Goal:** D7.

**RED (`entityRowUpdateSqlTable.integ.test.ts`, `test-sql`):**
- `alterEntityAttribute` adding `a` keeps a column `k` the Entity row does not declare, with its values. This is the code a migration run's `alterEntityAttribute` step executes on SQL: the step goes through `handleModelAction` to the same store method.
- Adding a column that exists fails `columnExists`; removing one that does not exist fails `columnMissing`; in both cases the Entity row is unchanged. A virtual attribute (no column) in `addColumns` or `removeColumns` is skipped by the column checks.
- `renameEntity` to a name whose table exists fails `tableExists`, the row unchanged; a successful rename keeps the rows.

**GREEN:** `sqlDbEntityStoreSectionMixin.ts`: the checks first, `addColumn` / `removeColumn` for the named columns (each definition built per attribute with `fromMiroirPresentModelToSequelizeEntityDefinition`), the Entity row last; `renameEntityClean`: check, rename with its result checked, row last.

**Refactor checkpoint:** the `as any as SqlDbStoreSection` casts around the table access replaced by a typed accessor where this slice touches them.

**Validation:**
```bash
npm run build -w packages/miroir-store-postgres
npx tsc --noEmit --skipLibCheck -p packages/miroir-store-postgres/tsconfig.json
MIROIR_ENV=test-sql npm run testByFile -w miroir-standalone-app -- 4_storage/entityRowUpdateSqlTable
MIROIR_ENV=test-sql npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict
npm run nonreg:default -- --runner shared --scope smoke,actions
```

### Realization
_(to fill)_

---

## Slice 8 — Nonreg, documents, acceptance criteria

**Status:** ⬜ pending

**Goal:** the non-regression runs, the documents, the AC mapping.

- Nonreg: add `integ-create-entity-strict` to `scripts/nonreg-manifest.json` (as allocated); run `npm run nonreg:filesystem -- --runner shared` and `npm run nonreg:default -- --runner shared`; a failure is checked on `_integration` before it is recorded as pre-existing.
- `migrationRun.ts` no longer imports `applyModelState` or `bringModelToVersion` (a grep, recorded in the AC table).
- Documents, each statement to write or remove:
  - `docs/reference/versioning.md`: remove "every step must be repeatable" (line 147) and the jump; write the Migration's one step list and step kinds, the migration run (started, done, in doubt, `settleMigrationStep`, `migrationAlreadyApplied`), the reference check of D6, D3's refused changes with the examples, D4's `createEntity` failures, `migrationEntityRowWrite` and #748, the strict strategy.
  - Epic analysis: section 7.2, the `createEntity` row (done) and the Entity editor row owned by #748; "run" replaced by "migration run" wherever it means one.
  - #9 analysis: a note at its top that its D2-d, the jump and the phases are replaced by #745.
  - The explainer `explainer-trace-vs-migration-20261116-104543/`: a note that it describes #9 before #745.
- MiroirTest `action.scenario.migration` rerun.
- Tracer narrative: on the filesystem test environment, freeze appForTest 1.0.0 with traces on; add `EditionC9` with `createEntity` and `Publisher.mottoC9` with `alterEntityAttribute` (model Actions, until #748 makes the Entity editor emit them); freeze 1.1.0; generate; add the fill step; copy the stores to a following deployment at 1.0.0; run the Migration: the following deployment is at 1.1.0 with the filled data; run the Migration again: refused as already applied. Automated by `migrationRun.integ` C1.
- Pre-push gate from `AGENTS.md`.

**AC checklist:**

| Acceptance criterion (#745) | Proof |
|---|---|
| A generated Migration lists the traced model Actions in trace order, adds and removes separate, and a migration run executes them with its data steps without `applyModelState` | `migrationGeneration.integ` B1, B4.1, B4.6, B4.7; `migrationRun.integ` C1 (storage created during the migration run, step `trace`); the grep of `migrationRun.ts` |
| A replayed `createEntity` whose storage exists fails on SQL, IndexedDB, MongoDB and the filesystem, storage untouched | `createEntityStrict.integ` on filesystem, IndexedDB, SQL, and MongoDB if Slice 0 could start a server (otherwise a gap, accepted by the user); `migrationRun.integ` C6 |
| A stopped migration run resumes at the next step without executing it again; a started-but-not-finished step fails naming it; a second migration run of a finished Migration fails | `migrationRun.integ` C7 (the first step would fail if executed again), C2 and C6 (`migrationStepInDoubt` naming the step), C7 and C1 (`migrationAlreadyApplied`) |
| A replayed `alterEntityAttribute` on SQL keeps a column it does not name | `entityRowUpdateSqlTable.integ` (Slice 7), on the store method a migration run's step executes. Met as reworded: a full migration run on PostgreSQL is the third run of experiment E1 (#710), since `openVersioningTestContext` is filesystem-only. |
| The #9 analysis, the epic's D2 and `docs/reference/versioning.md` describe the replay and the strict strategy | each statement of the Documents list above, checked off in the Realization |

**Validation:**
```bash
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
python scripts/rename_packages.py --check
python scripts/check_dependency_policy.py
npm run lint
npm run miroir-env -- check --strict --tracked-clean
for p in miroir-core miroir-versioning miroir-store-filesystem miroir-store-indexedDb miroir-store-postgres miroir-store-mongodb miroir-store-bundled miroir-standalone-app; do npx tsc --noEmit --skipLibCheck -p packages/$p/tsconfig.json; done
npm run test -w @miroir-framework/core -- ''
npm run test -w @miroir-framework/versioning
for env in filesystem indexedDb sql mongodb; do MIROIR_ENV=test-$env npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict; done
npm run testMiroir -w miroir-standalone-app -- --suites action.scenario.migration --mode integration
grep -n "applyModelState\|bringModelToVersion" packages/miroir-versioning/src/migrationRun.ts   # expect no match
npm run nonreg:filesystem -- --runner shared
npm run nonreg:default -- --runner shared
```

### Realization
_(to fill)_
