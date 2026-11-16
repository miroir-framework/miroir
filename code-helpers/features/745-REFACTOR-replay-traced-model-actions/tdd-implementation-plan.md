# Issue #745 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController, the emulated server and the store profiles
> (`test-filesystem`, `test-sql`, `test-indexedDb`, `test-mongodb`), through the Model Endpoint
> actions `generateMigration`, `runMigration` and `settleMigrationStep`, and through the `createEntity`,
> `alterEntityAttribute` and `renameEntity` model Actions. No mocks. The tracer bullet proves that a run on
> a following deployment replays a traced `createEntity` instead of rewriting the model to the frozen version.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/745
Prerequisite: [`../9-FEATURE-create-migrations-for-model-and-data-updates/`](../9-FEATURE-create-migrations-for-model-and-data-updates/) ✅
Working branch: `claude/745-replay-traced-model-actions`

**Resume note:** plan written and reviewed (one adversarial review, answered); waiting for the user's review before Slice 0.

---

## Scope

- G1: a run replays, in order, the model changes the designer made between two versions, with data steps among them (Slices 1, 2).
- G2: a data step can go between any two model steps; adds and removes are separate (Slice 2).
- G3: a run stops with an explicit error at the first state it did not expect, instead of working around it and carrying on (Slices 3 to 7).
- G4: a stopped run continues at the first step not started, and an in-doubt step waits for the operator (Slice 5).

This plan does **not** cover: Git follower runs beyond the provisional checkout step (#747), the Migration package (#746), what a hand-written step may hold (#741), column type and nullability changes (follow-up to file), rollback and leftover storage (#709), the retry of a failed authoring commit under D4 (follow-up to file).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the #9 run, generation and `createEntity` per store | ⬜ | the versioning suites green on `_integration`; `createEntity` on existing storage, per store, recorded |
| 1 | Tracer: a run replays a traced `createEntity`, from a one-list Migration | ⬜ | `migrationRun.integ` C1 rewritten |
| 2 | Entity row writes become model Actions; adds and removes split; the draft proves itself | ⬜ | `migrationGeneration.integ` B1 to B3.6 rewritten, new B4.x |
| 3 | Changes no Action carries to storage are refused | ⬜ | `migrationClassification.unit`, `migrationRun.integ` C3 |
| 4 | `createEntity` fails on existing storage or row, on every store | ⬜ | new `createEntityStrict.integ` on four profiles; run C6 |
| 5 | A step runs once: started, done, in doubt, settled | ⬜ | `migrationRun.integ` C2 rewritten, C7 |
| 6 | The run checks the model against the Migration's digests | ⬜ | `migrationRun.integ` C8 |
| 7 | SQL alter and rename touch only what they name, check first | ⬜ | `entityRowUpdateSqlTable.integ` additions, `test-sql` run |
| 8 | Nonreg, docs, cleanup, acceptance criteria | ⬜ | full `nonreg:filesystem`, `nonreg:default` on PostgreSQL |

---

## Locked implementation defaults

From the analysis decision record. Deviations go into the slice's Realization.

| Decision | Choice | Serves |
|---|---|---|
| D1 | One `steps` list, `kind: "model" \| "data"`, optional `trace`; `fromDigest`, `toDigest`, `digestCollections`; no `expand`, `fill`, `contract`, `repeatable`. Git: one model step, the checkout of `to`, no digests. Old rows refused. | G1, G2 |
| D2 | One step per model Action, in trace order; the conversion table of the analysis; empty fill step after each added attribute; incomplete records and Miroir refused; settings rows listed, not replayed; in-memory replay of the steps checked against `to`; diff source in the fixed order | G1, G2 |
| D3 | `changeAttribute`, `changeIdAttribute`, and a required attribute added to an existing Entity: `supported: false`; `renameEntity` supported | G3 |
| D4 | Each store's `createEntity` checks row and storage with a physical probe, fails with `entityExists` / `storageExists` before writing; `createEntities` returns the first error; external Entities exempt; SQL `clear()` drops every table of the schema | G3 |
| D5 | `run.stepStarted`; any step failure leaves the step in doubt; `migrationStepInDoubt` on the next run; `settleMigrationStep { application, step, outcome }`; `migrationAlreadyApplied` | G3, G4 |
| D6 | Digests normalized as `comparedCollections`; before step 1: live = `fromDigest`, in-memory replay = `toDigest`; after the last step: live = `toDigest`; no digests: refused in `versioned-internal` (Git rows carry none) | G3 |
| D7 | SQL `alterEntityAttribute`: check, `addColumn` / `removeColumn` for the named columns, then the row. SQL `renameEntity`: check, rename (result checked), then the row | G3 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Model Endpoint action | `settleMigrationStep`, declared in the Model Endpoint `7947ae40-eb34-4149-887b-15a9021e714e` (`miroir-app-miroir/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json`), implemented as `handleAction_settleMigrationStep` in `@miroir-framework/versioning` |
| Migration Entity attributes | `steps`, `fromDigest`, `toDigest`, `digestCollections` (removed: `expand`, `fill`, `contract`) |
| DeploymentState attribute | `run.stepStarted` |
| Change kind | `settingsChange` |
| Refusal reasons (`MIGRATION_RUN_REFUSALS` and generation) | `migrationIncompleteRecord`, `migrationUnsupportedApplication`, `migrationStepInDoubt`, `migrationAlreadyApplied`, `migrationModelMismatch`, `migrationDigestMissing`, `migrationStepNotInDoubt` |
| Store refusals (`errorContext.reason`) | `entityExists`, `storageExists`, `columnExists`, `columnMissing`, `tableExists` |
| New vitest file | `packages/miroir-standalone-app/tests/4_storage/createEntityStrict.integ.test.ts` (not reachable through MiroirTest: it probes the stores under each profile after writing to them directly) |
| Nonreg step | `integ-745-create-entity-strict` (scopes `actions`) |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Run tests (filesystem) | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/migrationRun` |
| Generation tests | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/migrationGeneration` |
| Git tests | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/migrationRunGit` (and `migrationGenerationGit`) |
| Following deployment | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/followingDeployment` |
| Versioning unit | `npm run test -w @miroir-framework/versioning` |
| Store strictness | `MIROIR_ENV=test-<filesystem\|indexedDb\|sql\|mongodb> npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict` (`sql` needs PostgreSQL and `MIROIR_POSTGRES_PASSWORD`; `mongodb` needs a server on `localhost:27017`) |
| SQL table changes | `MIROIR_ENV=test-sql npm run testByFile -w miroir-standalone-app -- 4_storage/entityRowUpdateSqlTable` |
| MiroirTest scenario | `npm run testMiroir -w miroir-standalone-app -- --suites action.scenario.migration --mode integration` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run build -w miroir-app-admin && npm run devBuild -w @miroir-framework/core` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` for core, versioning, the four stores, standalone-app |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,actions[,core]` |

---

## Slice 0 — Characterize the #9 run, generation and `createEntity` per store

**Status:** ⬜ pending

**Goal:** a safety net and a recorded baseline before anything changes.

**RED/characterization:**
- Run the versioning suites listed above on `test-filesystem` at the branch base; record pass/fail per file.
- Write `createEntityStrict.integ.test.ts` with its cases asserting **today's** behaviour on each profile available here (filesystem, IndexedDB, SQL): `createEntity` on an Entity whose storage exists (written by a first `createEntity`, then the row deleted with `deleteInstance`) succeeds, and its instances are kept (filesystem, IndexedDB) or lost (SQL). These assertions flip in Slice 4.
- List, from `scripts/nonreg-manifest.json`, the steps whose files call `createEntity` on stores possibly left by an earlier run (a grep over `tests/` for `createEntity` plus the `resetModel` users), as the watch list for Slice 4.
- Servers: start the local PostgreSQL 16 (`pg_ctlcluster 16 main start`, a `miroir` role, `MIROIR_POSTGRES_PASSWORD` exported) and record the `test-sql` baseline. MongoDB: try `mongodb-memory-server` (it downloads a `mongod` binary); if the network refuses it, MongoDB stays unproven here and the PR says so (the user is asked to sign off on that gap before Slice 4).
- Test hygiene for D4: the run tests use a fixed `EditionC9` uuid in the persistent `.miroir/test-filesystem` stores. Their `beforeAll` drops that Entity (and its storage) when a previous aborted run left it, before anything else.
- A helper `writeFollowingMigration(folder, row)` writes a Migration file into the following deployment's own `modelVersion` folder on disk, standing in for the import of #746 (a following deployment refuses `modelVersion` writes through Miroir, `DomainController.ts` lines 291–292).

**GREEN:** none (no production change).

**Refactor checkpoint:** none.

**Validation:**
```bash
pg_ctlcluster 16 main start && pg_isready
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict
MIROIR_ENV=test-indexedDb npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict
MIROIR_ENV=test-sql npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict
```

### Realization
_(to fill)_

---

## Slice 1 — Tracer: a run replays a traced `createEntity`, from a one-list Migration

**Status:** ⬜ pending

**Goal:** the Migration has one `steps` list; generation writes the traced model Actions that are already model Actions (`createEntity`, `alterEntityAttribute`, `renameEntity`, `dropEntity`) as model steps; the run executes them in order with the data steps, without `bringModelToVersion`. Git generation writes the checkout step, and the Git run runs it.

**RED:**
- `migrationRun.integ.test.ts` C1, rewritten. appForTest's traces are turned on before 1.0.0 is frozen (as `migrationGeneration.integ` lines 85–87 and 117 do) and off again in `afterAll`. 1.1.0 adds `EditionC9` through `createEntity` only (the `mottoC9` row update moves to Slice 2). The draft has `source: "traces"` and `steps` `[createEntity EditionC9]`, its `trace` naming the record; the designer appends a data step creating the first edition and stores the completed Migration. The following deployment is a copy of the authoring `model` and `data` stores taken right after 1.0.0 is frozen, and its own `modelVersion` folder is a copy taken after the completed Migration is stored, with the 1.1.0 `SelfApplicationVersion` file deleted on disk. After the run: `EditionC9` exists on the following deployment with its instance, the state is at 1.1.0, and the following deployment's model equals the authoring 1.1.0 model (`ownModel`): the run read no frozen version.
- The other run tests (C2, C3, C5) and the generation tests (B1 to B3.6) are ported mechanically to `steps`: phases become one list, hand-written rows are written into the following deployment's folder with `writeFollowingMigration`. C2 keeps #9's resume semantics (a failed step re-run) until Slice 5; B2.3 and B2.4 keep #9's classification until Slice 3.
- `migrationRunGit.integ.test.ts` C4 and `migrationGenerationGit.integ.test.ts`: the Git draft holds one model step, the checkout of `to`; the run moves the clone as before. A row with `fill` committed at a tag is refused (`migrationStepsInvalid`).
- A run of an internal row with `fill` is refused (`migrationStepsInvalid`).

**GREEN:**
- Migration Entity schema (`b5c1f0e5-…json`): `steps` (array of `{ uuid, name, kind, backwardCompatible, action, trace? }`), remove `expand`, `fill`, `contract`; rebuild the schemas.
- `MigrationRow`, `MigrationStep` types; `draftMigration` builds `steps` from the records between the markers (model Actions as is, one step each, `createEntity` split per Entity); without records, from the diff (only `createEntity` / `dropEntity` here; the rest in Slice 2).
- `migrationRun.ts`: `runOrder` is `steps`; model steps run through `handleModelAction` (or the composite path) with `markMigrationRun` and `transactional: false`, then a model reload; the jump and `bringModelToVersion` go. Git: the checkout step runs `checkoutVersion` and `reloadModel`.
- `recomputedBackwardCompatible` over `changes` and `steps`.

**Refactor checkpoint:** `JUMP_STEP` and the jump function removed; `applyModelState` keeps only install callers; the Git checkout step and the internal model step share one "run a model step, then reload" function.

**Validation:**
```bash
npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core && npm run build -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning
npx tsc --noEmit --skipLibCheck -p packages/miroir-versioning/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions
```

### Realization
_(to fill)_

---

## Slice 2 — Entity row writes become model Actions; adds and removes split; the draft proves itself

**Status:** ⬜ pending

**Goal:** the D2 conversion table, the refusals of incomplete records and of Miroir, settings rows listed, and the in-memory self-check.

**RED (`migrationGeneration.integ.test.ts`, B tests moved to `steps`, new B4.x):**
- B1: `Publisher.mottoC9` added in the Entity editor (an `updateInstance` of the Entity row) gives `[alterEntityAttribute add mottoC9, data "fill Publisher.mottoC9", updateInstance Publisher]`, with kinds `model`, `data`, `model` (every generated row write is a model step: D6 replays them).
- B4.1: one `alterEntityAttribute` adding `a` and removing `b` gives the add, its fill step, then the remove.
- B4.2: an Entity row created with `createInstance` gives `createEntity`; deleted with `deleteInstance`, `dropEntity`; renamed through its row, `renameEntity` then the row update.
- B4.3: a Report created, updated, deleted between the versions gives the three instance writes; a SelfApplication write (traces switch) gives no step and a `settingsChange` in `changes`.
- B4.4: an incomplete record between the versions refuses (`migrationIncompleteRecord`); generation for Miroir refuses (`migrationUnsupportedApplication`).
- B4.5: traces off: the diff gives the same steps in the fixed order.
- `migrationRun.integ.test.ts` C1 extended with `mottoC9`: after the run, the following deployment's Publisher rows have the motto the fill step wrote.

**GREEN:** the conversion in generation, walking the records with the replayed state (`applyRecordActions` per Action); the self-check replay of the steps (model steps applied in memory through `ModelEntityActionTransformer.modelActionToInstanceAction` and `applyInstanceWrite`); the diff-ordered fallback; the refusals.

**Refactor checkpoint:** one step builder shared by the trace and the diff paths; `addedAttributes` moves from `applicationVersionInstall.ts` to a shared module if both use it.

**Validation:**
```bash
npm run build -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/migrationGeneration
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/migrationRun
npm run test -w @miroir-framework/versioning
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization
_(to fill)_

---

## Slice 3 — Changes no Action carries to storage are refused

**Status:** ⬜ pending

**Goal:** D3.

**RED:**
- `migrationClassification.unit.test.ts`: `changeAttribute` (type, made required, enum, foreign key target), `changeIdAttribute`, and `addAttribute` required on an existing Entity are `supported: false` with a note; `addAttribute` required on an Entity the Migration creates is supported; `renameEntity` is supported; a tag-only change is no change.
- `migrationRun.integ.test.ts` C3: a Migration **generated** from two frozen versions where `Publisher` changes an attribute's type is refused before step 1 (`migrationUnsupportedChange`), nothing written. (A hand-written `supported: false` is refused already today; the RED is the classification at generation.)
- `migrationGeneration.integ.test.ts` B2.3, B2.4 updated.

**GREEN:** `entityStructureChanges` classification; the run's unsupported check unchanged.

**Refactor checkpoint:** the notes name the follow-up issue (filed before this slice ends).

**Validation:**
```bash
npm run test -w @miroir-framework/versioning -- migrationClassification
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning
npm run nonreg:filesystem -- --runner shared --scope smoke,actions
```

### Realization
_(to fill)_

---

## Slice 4 — `createEntity` fails on existing storage or row, on every store

**Status:** ⬜ pending

**Goal:** D4, and the run's replayed `createEntity` failing on a folder left behind.

**RED:**
- `createEntityStrict.integ.test.ts` (Slice 0's file, assertions flipped), per profile: `createEntity` when the row exists fails `entityExists`; when only the storage exists (row deleted, or storage made through the store) fails `storageExists`; in both cases the storage and its instances are unchanged, and no row is written. An external HTTP Entity created twice succeeds. `createEntity` with two Entities, the second existing, returns the error (SQL included).
- IndexedDB: storage made outside the boot list (an orphan sublevel holding a key, written through the store's own Level handle, since Level locks its directory) is found.
- SQL: after `resetModel`, a table not registered in the section's models is gone.
- `migrationRun.integ.test.ts` C6, with its own following deployment at 1.0.0: holding an `EditionC9` data folder before the run, the run stops at the `createEntity` step with `storageExists`, the folder's files unchanged.
- `followingDeployment.integ.test.ts`: `installApplicationVersion` on a deployment whose model lacks the history Entities but whose storage for one of them exists (an orphan) fails, naming the storage (`ensureVersionHistoryEntities`, analysis 4.4).

**GREEN:** a physical probe per store section (new method, e.g. `storageSpaceExistsPhysically(entity)`), the checks at the top of each mixin's `createEntity`, `createEntities` returning the first error, SQL `clear()` dropping every table of its schema. Error and bundled sections implement or reject the probe.

**Refactor checkpoint:** the four mixins share the check order (row, storage, then create) through one helper in core if the mixins allow it; the watch list from Slice 0 is run, and any setup that relied on re-creation is fixed in the setup.

**Validation:**
```bash
npm run build -w @miroir-framework/core -w packages/miroir-store-filesystem -w packages/miroir-store-indexedDb -w packages/miroir-store-postgres -w packages/miroir-store-mongodb -w @miroir-framework/store-bundled
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
for env in filesystem indexedDb sql; do MIROIR_ENV=test-$env npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict; done
MIROIR_ENV=test-mongodb npm run testByFile -w miroir-standalone-app -- 4_storage/createEntityStrict   # where a MongoDB server is reachable
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning/migrationRun
npx tsc --noEmit --skipLibCheck -p packages/miroir-store-<each>/tsconfig.json
npm run nonreg:filesystem -- --runner shared
```
(full filesystem nonreg here: `createEntity` is used everywhere.)

### Realization
_(to fill)_

---

## Slice 5 — A step runs once: started, done, in doubt, settled

**Status:** ⬜ pending

**Goal:** D5.

**RED (`migrationRun.integ.test.ts`):**
- C2 rewritten: a data step whose first write lands and second fails stops the run, `stepStarted` names it; the next `runMigration` fails `migrationStepInDoubt` without writing; `settleMigrationStep … outcome: "notRun"` (after undoing the first write by hand) lets the next run start that step again and finish; `outcome: "done"` on another run skips it.
- C7: `settleMigrationStep` naming a step that is not in doubt is refused (`migrationStepNotInDoubt`); a second `runMigration` of a finished Migration fails `migrationAlreadyApplied`, nothing written.
- C7 (characterization, passes today): a run stopped between two steps (crash simulated by writing the state row with `stepsDone` = the first step, a `createEntity`) resumes at the second step; the first is not run again, which is observable since running it would fail with `storageExists` (Slice 4).
- C1 changes: the concurrent second run and the final rerun now fail with `migrationAlreadyApplied` instead of `migrationNotAtFrom`.
- `followingDeployment.integ.test.ts`: `settleMigrationStep` refused on an authoring deployment.

**GREEN:** DeploymentState schema (`miroir-app-admin`, `run.stepStarted`); the run records before and after each step; `settleMigrationStep` declared in the Model Endpoint and implemented in the versioning package (registered in `VERSIONING_ACTION_IMPLEMENTATION_NAMES`); `migrationAlreadyApplied` before the `from` check.

**Refactor checkpoint:** the state writes of the run go through one `recordRun(state)` function.

**Validation:**
```bash
npm run build -w miroir-app-miroir && npm run build -w miroir-app-admin && npm run devBuild -w @miroir-framework/core && npm run build -w @miroir-framework/versioning
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 3_controllers/versioning
npm run testByFile -w @miroir-framework/core -- versioningSurface ActionImplementations endpointActionListing.capability
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions
```

### Realization
_(to fill)_

---

## Slice 6 — The run checks the model against the Migration's digests

**Status:** ⬜ pending

**Goal:** D6.

**RED:**
- `migrationGeneration.integ.test.ts` B5: the draft has `digestCollections`, `fromDigest` and `toDigest`; the digests equal those of the frozen `from` and `to` computed by the same function.
- `migrationRun.integ.test.ts` C8: a following deployment whose Report was changed by hand before the run fails `migrationModelMismatch` (from), nothing written; a Migration whose model step was edited (an attribute renamed in its `addColumns`) fails `migrationModelMismatch` (replay against `to`) before step 1; a Migration without digests fails `migrationDigestMissing`; a data step that writes a model row (allowed until #741) makes the run fail at the end check, the version unchanged.
- A follower installed from a version without `tests` snapshots runs a Migration whose `digestCollections` leave `tests` out.
- The earlier hand-written rows (C2, C5, C7) take their digests from a generated draft (or `modelDigest`); C5's nested `createEntity` in a data step now fails at the end check (`migrationModelMismatch`, version unchanged) and its expectation changes here. Git rows carry no digests and are not refused for it.

**GREEN:** a `modelDigest(application, state, collections)` next to `comparedCollections`, sharing its normalization; generation stores the digests; the run's two checks.

**Refactor checkpoint:** `comparedCollections` and the digest share one normalization function.

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

## Slice 7 — SQL alter and rename touch only what they name, check first

**Status:** ⬜ pending

**Goal:** D7, and the run on PostgreSQL.

**RED (`entityRowUpdateSqlTable.integ.test.ts`, `test-sql`):**
- `alterEntityAttribute` adding `a` keeps a column `k` the Entity row does not declare, with its values.
- adding a column that exists fails `columnExists`; removing one that does not exist fails `columnMissing`; in both cases the Entity row is unchanged.
- `renameEntity` to a name whose table exists fails `tableExists`, the row unchanged; a successful rename moves the rows.
- The replay path on SQL: an `alterEntityAttribute` sent with `markMigrationRun`, as a run sends it, on a table holding an undeclared column `k`, keeps `k` and its values. (`migrationRun.integ` cannot run on SQL: `openVersioningTestContext` is filesystem-only, `versioningTestSetup.ts` lines 71 and 87, and the follower is a disk copy.)

**GREEN:** `sqlDbEntityStoreSectionMixin.ts`: column-level `addColumn` / `removeColumn` built from the attribute definitions (`fromMiroirPresentModelToSequelizeEntityDefinition` per attribute), the checks first, the row last; `renameEntityClean`: check, rename with its result checked, row last.

**Refactor checkpoint:** the `as any as SqlDbStoreSection` casts around the table access replaced by a typed accessor if the change touches them.

**Validation:**
```bash
npm run build -w packages/miroir-store-postgres
MIROIR_ENV=test-sql npm run testByFile -w miroir-standalone-app -- 4_storage/entityRowUpdateSqlTable
npx tsc --noEmit --skipLibCheck -p packages/miroir-store-postgres/tsconfig.json
npm run nonreg:default -- --runner shared --scope smoke,actions
```

### Realization
_(to fill)_

---

## Slice 8 — Nonreg, docs, cleanup, acceptance criteria

**Status:** ⬜ pending

**Goal:** the safety net, the documents, the AC mapping.

- Nonreg: add step `integ-745-create-entity-strict` (scopes `actions`) to `scripts/nonreg-manifest.json`; run `npm run nonreg:filesystem -- --runner shared` and `npm run nonreg:default` (PostgreSQL); prove any failure on `_integration` before calling it older.
- Docs: `docs/reference/versioning.md` (Migration shape, the run, the strict strategy, `settleMigrationStep`); the epic sections listed in the analysis section 6; a note at the top of the #9 analysis and of the explainer.
- MiroirTest `action.scenario.migration` rerun.
- Follow-up issues filed: column changes on SQL (D3), retry of a failed authoring commit (D4).
- Tracer narrative: on the filesystem test environment, freeze appForTest 1.0.0, add an Entity and an attribute in the editor, freeze 1.1.0, generate, add a fill step, copy the stores to a following deployment at 1.0.0, run: the following deployment is at 1.1.0 with the filled data; run again: refused as applied. Automated by `migrationRun.integ` C1.
- Pre-push gate from `AGENTS.md`, `tsc` on every touched package.

**AC checklist:**

| Acceptance criterion (#745) | Proof |
|---|---|
| A generated Migration lists the traced model Actions in trace order, adds and removes separate, and a run executes them with its data steps without `applyModelState` | `migrationGeneration.integ` B1, B4.1 to B4.5; `migrationRun.integ` C1 |
| A replayed `createEntity` whose storage exists fails on SQL, IndexedDB, MongoDB and the filesystem, storage untouched | `createEntityStrict.integ` on filesystem, IndexedDB, SQL; MongoDB only if a server can be started here (else a gap the user signs off); `migrationRun.integ` C6 |
| A stopped run resumes at the next step without re-running it; a started-but-not-finished step fails naming it; a second run of a finished Migration fails | `migrationRun.integ` C7 (resume: the first step would fail if re-run), C2 (in doubt), C7 and C1 (`migrationAlreadyApplied`) |
| A replayed `alterEntityAttribute` on SQL keeps a column it does not name | `entityRowUpdateSqlTable.integ` (Slice 7), with the run's mark |
| The #9 analysis, the epic's D2 and `docs/reference/versioning.md` describe the replay and the strict strategy | the diff of the three documents |

**Validation:**
```bash
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
python scripts/rename_packages.py --check
python scripts/check_dependency_policy.py
npm run lint
npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w @miroir-framework/core -- ''
npm run nonreg:filesystem -- --runner shared
npm run nonreg:default -- --runner shared
```

### Realization
_(to fill)_
