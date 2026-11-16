# 745 — Replay the traced model Actions in a Migration run

> #9 built a Migration run that rewrites the model to the frozen `to` version (the "jump", epic decision D2-d). The epic revision of 2026-11-16 (#744) replaces it, for `versioned-internal`, with a run that replays the model Actions the evolution traces recorded (D2-a). This analysis maps what #9 built, then decides the Migration's new shape, how generation writes the model steps, and how the run stays strict: no storage silently reused, no step run twice.

Related issue: https://github.com/miroir-framework/miroir/issues/745
Parent issue: #694 (epic) · Prerequisite: #9 ✅ (#739, #740, #742) · Epic revision: #744 ✅
Follow-ups that depend on this one: #746 (Migration package), #741 (what a step may hold), #747 (D13, Git followers)
Related analyses: [`../694-EPIC-safe-application-evolution/analysis.md`](../694-EPIC-safe-application-evolution/analysis.md) (D2, D5, D12, D13, section 7.3), [`../9-FEATURE-create-migrations-for-model-and-data-updates/analysis.md`](../9-FEATURE-create-migrations-for-model-and-data-updates/analysis.md)
Key sources: [`migrationGeneration.ts`](../../../packages/miroir-versioning/src/migrationGeneration.ts), [`migrationRun.ts`](../../../packages/miroir-versioning/src/migrationRun.ts), [`applicationVersionInstall.ts`](../../../packages/miroir-versioning/src/applicationVersionInstall.ts), [`modelStates.ts`](../../../packages/miroir-versioning/src/modelStates.ts), [`sqlDbEntityStoreSectionMixin.ts`](../../../packages/miroir-store-postgres/src/4_services/sqlDbEntityStoreSectionMixin.ts), Migration Entity `b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe`

**Document role:** analysis and decision record.
**Status:** analysis in progress; decisions to confirm with the user.

**Strict strategy (user decision, 2026-11-16).** Every decision below follows it: an operation of the versioning epic that meets a state it did not expect fails with an error naming that state. It never repairs, skips, reuses or overwrites silently. A failure leaves what it found as it was, so the operator sees it.

---

## 1. Goals

- **G1 — Move a deployment along the designer's own changes.** In order to get on a test deployment the model the designer built, with the data kept, as an application maintainer, I can run a Migration that replays, in order, the model changes the designer made between two versions, with the data steps placed among them.
- **G2 — Place data steps where they belong.** In order to copy, fill or clean data at the exact point where the model allows it (after an attribute is added, before one is removed), as an application designer, I can insert a data step between two model steps of a generated Migration.
- **G3 — Never lose data silently.** In order to trust a run on a deployment holding data, as an application maintainer, I can count on a run that stops with an error, naming what it found, rather than empty, reuse or drop storage it did not expect, or run a step twice.
- **G4 — Resume a stopped run.** In order to finish a run that a crash or a failure stopped, as an application maintainer, I can run it again: it continues at the first step it did not start, and refuses when it cannot tell whether a step was done.

## 2. Non-goals

- `versioned-git` follower runs: D13, #747. #9's Git run is kept, adapted to the new row shape (D1).
- Export and import of a Migration as a file: #746.
- What a hand-written step may hold (model Actions refused): #741. D1 gives the step a `kind`, which #741 will check.
- Column type, nullability and key changes on SQL (a changed attribute, a changed `idAttribute`): flagged unsupported here (D3); the Actions that carry them belong to #215 or a follow-up.
- Restore and rollback (`applyModelState` for D6): #709. This issue only removes `applyModelState` from the run.
- Committing a step's writes and its record in one SQL transaction: later; D5 detects the gap instead.

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1. What does a Migration row hold? | **One ordered `steps` list; each step has a `kind` (`model` or `data`); no phases, no `repeatable`** | G1, G2 |
| D2. How does generation turn trace records into model steps? | **One step per model Action, in trace order, Entity row writes turned into model Actions, adds and removes split, then a replay of the steps checked against `to`** | G1, G2 |
| D3. What happens to a change no model Action carries to storage? | **Classified unsupported: generation writes it, the run refuses the Migration** | G3 |
| D4. What does `createEntity` do when the Entity's storage already exists? | **It fails, on every store, and leaves the storage as it was** | G3 |
| D5. How does a run make sure no step runs twice? | **A step is recorded as started, then as done; a step started and not done stops the run; a second run of a finished Migration fails** | G3, G4 |
| D6. How does a run check the deployment's model without reading the authoring deployment's `modelVersion` section? | **The Migration holds a digest of the `from` and `to` models; the run compares the live model with them before its first step and after its last** | G3 |
| D7. How does a replayed `alterEntityAttribute` change only the columns it names on SQL? | **Column-level `addColumn` / `removeColumn` instead of `sync({ alter: true })`** | G3 |

**Legend.** *Authoring deployment*: the one the designer edits and freezes. *Following deployment*: a deployment whose model changes only through installs and Migration runs (#9). *Trace record*: a `commit` row of the evolution traces, holding the model Actions and model-row writes one commit made, in order. *Model step*: a step generation writes from a model Action. *Data step*: a step the designer writes.

### D1. What does a Migration row hold?

**Status:** Proposed — D1-a. **Serves:** G1, G2.

**What is at stake.** In Library, a designer splits `Author.name` into `firstName` and `lastName`. The copy step must run after both attributes exist and before `name` is dropped. The #9 row has `expand`, `fill` and `contract` lists around one jump, so the copy has to be in `fill`, and the drop of `name` cannot be ordered against it. With replay, the model changes are steps themselves, and the copy goes between them.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. One `steps` list with a `kind`** ★ | `steps: MigrationStep[]`, `MigrationStep = { uuid, name, kind: "model" \| "data", backwardCompatible, action, trace? }`. `changes` stays (classification, information). `expand`, `fill`, `contract` and `repeatable` go. | the order is the run's order; the runner and #741 tell generated model steps from hand-written ones | the Migration Entity and every reader change |
| D1-b. One list without a kind | as D1-a, the kind read from the action | smaller row | #741 must then infer what generation wrote, and a hand-written model Action reads as generated |
| D1-c. Keep the phases, model steps in the middle | `expand`, `model`, `fill`, `contract` | fewer changes | the order problem above stays |

`trace` (optional) names the record and the position of the Action a model step comes from, as evidence. `repeatable` goes because no step runs twice (D5).

`versioned-git`: until D13, a Git Migration's `steps` holds one model step, the checkout of the tag `to` (a `gitAction_checkout`), where #9 put the jump. Data steps go before or after it. This keeps #9's provisional Git run working with the new row.

No Migration row is stored in any asset (checked: no file under `packages/*/assets/**/b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe/`). A row with `expand`, `fill` or `contract`, from a store written by #9, is refused by the run (`migrationStepsInvalid`), not converted (strict).

### D2. How does generation turn trace records into model steps?

**Status:** Proposed — D2-a. **Serves:** G1, G2.

**What is at stake.** In appForTest (#9 part C test), the designer adds `Publisher.mottoC9` in the Entity editor. The trace holds an `updateInstance` of the Publisher Entity row, not an `alterEntityAttribute`: replayed as is, it changes the row but no SQL column, and the next write of a motto fails. A trace replay is right only if every model change it writes also changes storage.

Generation walks the `commit` records between the two version markers in sequence order, one Action at a time, keeping the model state replayed so far (as `applyRecordActions` in `modelStates.ts` does). Each Action gives zero or more model steps:

| Traced Action | Model steps written |
|---|---|
| `createEntity` | one `createEntity` per Entity it creates |
| `alterEntityAttribute` with `addColumns` and `removeColumns` | the add, then an empty data step `fill <Entity>.<attribute>` per added attribute, then the remove |
| `alterEntityAttribute` with one of them | itself (an add is followed by its empty fill steps) |
| `renameEntity`, `dropEntity` | itself |
| `createInstance` of an Entity row (model section) | `createEntity` of that row |
| `updateInstance` of an Entity row | compared with the row replayed so far: `renameEntity` if the name changed; `alterEntityAttribute` adding the new attributes, then their fill steps; `alterEntityAttribute` removing the gone ones; then `updateInstance` with the traced row, which carries every other field. A changed attribute or `idAttribute` is classified (D3). |
| `deleteInstance` of an Entity row | `dropEntity` |
| other instance writes on model rows (Reports, Queries, Menus, …) | itself |

Then generation replays its own model steps on the `from` state in memory and refuses (`evolutionTracesDisagree`) if the result is not `to`, as D12-b asks ("the draft carries its own proof"). The check on the raw records stays before it.

With traces off (`source: diff`), the same Action kinds come from the diff of the two versions, in a fixed order: Entities created, renamed, attributes added (with their fill steps), attributes removed, Entities dropped, then the other rows created, updated, deleted. The same replay check runs.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. One step per Action, rows turned into Actions, self-checked** ★ | above | storage follows every model change; a data step can go between any two Actions; the draft proves itself | generation grows a conversion table |
| D2-b. One step per trace record | the record's Actions as one sequence | fewer steps | an add and a remove made in one commit cannot have a step between them |
| D2-c. Replay records as they are | no conversion | simple | the Entity editor's row updates change no storage (above) |

### D3. What happens to a change no model Action carries to storage?

**Status:** Proposed — D3-a. **Serves:** G3.

**What is at stake.** A designer makes `Book.year` a number instead of a string, or makes `Publisher.motto` required. The row update replays, but on SQL the column keeps its type and nullability: no model Action changes them (`alterEntityAttribute.update` is declared and the SQL store ignores it, epic section 7.2). Today #9 classifies `changeAttribute` as supported, and the run leaves that gap.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Unsupported** ★ | `changeAttribute` and `changeIdAttribute` are `supported: false`; generation writes the Migration, the run refuses it (`migrationUnsupportedChange`) | strict; the designer sees it at generation | a type change needs a hand-written path (#215) |
| D3-b. Row update only | as #9 | no new refusal | the SQL column no longer matches the model, found later by a failed write |
| D3-c. Implement column changes | SQL `changeColumn` behind `alterEntityAttribute.update` | complete | a new Action contract, out of this issue's scope |

`renameEntity` becomes supported: the replayed `renameEntity` renames the SQL table (`renameStorageSpaceForInstancesOfEntity`), which the jump did not do. A tag-only change (display hints) is no change, as today (`withoutTag`).

### D4. What does `createEntity` do when the Entity's storage already exists?

**Status:** Proposed — D4-a. **Serves:** G3.

**What is at stake.** A following deployment of Library whose `Edition` table exists, left by an earlier attempt or made by hand, gets a run that replays `createEntity Edition`. Today SQL drops and recreates the table (`sync({ force: true })`), IndexedDB clears the sublevel, MongoDB deletes every document, and the filesystem store reuses the folder with its files. Each loses or adopts data without a word.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Fail on every store** ★ | each store's `createEntity` asks `hasStorageSpaceForInstancesOfEntity` first (made required, implemented on the four stores) and fails with `storageExists` when the storage or the Entity row exists; nothing is written | strict, everywhere, not only in runs | callers that relied on re-creation must drop first (to inventory, section 4.4) |
| D4-b. Fail in runs only | the run's mark switches the check on | no effect elsewhere | the mark is a symbol that does not cross the REST boundary; two behaviours for one Action |
| D4-c. `IfMissing` | create when absent, keep when present | resumable | rejected by the user: adopts storage the run did not create |

`createStorageSpaceForInstancesOfEntity` itself, used by `ModelInitializer` and the lazy `devData` creation (which already probe), keeps its behaviour; D4 is on the model Action.

### D5. How does a run make sure no step runs twice?

**Status:** Proposed — D5-a. **Serves:** G3, G4.

**What is at stake.** A run stops after the `createEntity Edition` step wrote the table and before the record of the step was saved. #9 then re-runs the step on resume, assuming every step repeatable. Under D4, the re-run fails on the existing table, which is right, but the error would read as a storage problem, not as an interrupted step.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. Started and done** ★ | the run records `stepStarted: <uuid>` before a step and moves it to `stepsDone` after. On resume: steps in `stepsDone` are skipped; a `stepStarted` stops the run (`migrationStepInDoubt`, naming the step); otherwise the run starts at the first step not done. A Migration in the deployment's `applied` list fails (`migrationAlreadyApplied`) before the `from` check. | never runs a step twice; says why it stops | the operator settles an in-doubt step by hand |
| D5-b. Repeatable steps | #9 | resumes alone | contradicts D4 and the strict strategy |
| D5-c. Step and record in one transaction | SQL only | no in-doubt window on SQL | not on the other stores; later |

Settling an in-doubt step: the operator checks the step's effect and edits the `DeploymentState` row (Admin, Entity `14e696c6-c9ef-4d50-b2d6-1fd561b315f6`) with the instance editor, moving the step to `stepsDone` or clearing `stepStarted`. The error message says so. A dedicated action is a possible follow-up.

### D6. How does a run check the deployment's model without reading the authoring deployment's `modelVersion` section?

**Status:** Proposed — D6-a. **Serves:** G3.

**What is at stake.** The `DeploymentState` row says a following deployment is at 1.0.0, but someone changed its model by hand, or a run failed half way through a step and was settled wrongly. The replayed Actions then meet a model they were not written for, and the deployment ends with its state saying 1.1.0 and a model that is not 1.1.0. #9 avoided this by rewriting the whole model to the frozen version, which D5 of the epic now rules out (the run must read nothing else from the authoring `modelVersion`).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D6-a. Digests in the Migration** ★ | generation stores `fromDigest` and `toDigest`, hashes of the two models as the agreement check compares them (`comparedCollections`, meta-model Entities left out). The run compares the live model with `fromDigest` before its first step (new runs) and with `toDigest` after its last, before it writes the version. A mismatch fails (`migrationModelMismatch`), the version unchanged. | catches any divergence; the Migration stays self-contained (#746) | a digest says only "different"; the error cannot say what differs |
| D6-b. Full snapshots in the Migration | `from` and `to` model states in the row | says what differs | doubles the row's size with a copy of two versions |
| D6-c. No check | trust the state record | nothing to build | the gap above |

### D7. How does a replayed `alterEntityAttribute` change only the columns it names on SQL?

**Status:** Proposed — D7-a. **Serves:** G3.

**What is at stake.** Epic D6 lets an operator roll a deployment back while keeping a later version's column with its values. Replaying an earlier Migration then runs `sync({ alter: true })`, which drops every column the Entity row does not declare: the kept column and its values go.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D7-a. Column-level changes** ★ | `queryInterface.addColumn` for each `addColumns` entry and `removeColumn` for each `removeColumns` name; an added column that exists, or a removed one that does not, fails (strict) | touches the named columns only | the column definition is built per attribute, not by Sequelize from the model |
| D7-b. Keep `sync({ alter: true })` | as today | nothing to build | the loss above |

The other stores are schemaless for attributes: their `alterEntityAttribute` changes only the Entity row.

---

## 4. Current state

### 4.1 Migration row and generation (`migrationGeneration.ts`)

- `MigrationRow` (lines 74–92): `changes`, `expand`, `fill`, `contract`, `backwardCompatible`; `MigrationStep` (lines 65–71) has `repeatable`.
- `entityStructureChanges` (lines 128–181) classifies from the two Entity rows: `renameEntity` and `changeIdAttribute` are `supported: false`, `changeAttribute` is `supported: true`.
- `migrationSteps` (lines 222–233): an empty fill step per added attribute, an empty contract step per removed Entity or attribute, no expand step.
- `generateMigration` (lines 485–573): refuses on a following deployment, across a re-baseline, when a Migration exists (unless `replace`); replays the records with `replayCommitRecords` and refuses when the result is not `to` (`evolutionTracesDisagree`); writes the draft from the two snapshots (`draftMigration`, lines 413–445). The records are not used for the steps.

### 4.2 The run (`migrationRun.ts`)

- `runOrder` (line 87): `[...expand, JUMP_STEP, ...fill, ...contract]`.
- `runToDo` (lines 132–212): resumes a `run` in progress for the same Migration; refuses another one (`migrationRunInProgress`), a missing Migration, a deployment not at `from` (`migrationNotAtFrom`), an unsupported change, duplicate step uuids, a `transactionalInstanceAction`, and with Git a step writing the model or a clone not at `from`.
- `jump` (lines 218–237): `bringModelToVersion` (internal: reads the frozen `to` from the `modelVersion` section and rewrites the model with `applyModelState`) or `checkoutVersion` (Git), then `reloadModel`.
- The loop (lines 296–317) skips steps in `stepsDone`, runs a step, then records it. Nothing is recorded before a step.
- A second run of a finished Migration is refused by the `from` check (the state is at `to`), with the reason `migrationNotAtFrom`.

### 4.3 What the trace records hold (`evolutionTraceRecording.ts`, `versioningInterfaces.ts`)

- A `commit` record (`EvolutionTraceRecordRow`) holds `actions`: the model Actions `createEntity`, `alterEntityAttribute`, `renameEntity`, `dropEntity`, and `createInstance` / `updateInstance` / `deleteInstance` on the `model` section (Miroir: `data`), version-history Entities left out (`isRecordedModelChange`, lines 160–185).
- The Entity editor saves an Entity row as an `updateInstance` (epic section 7.2), so an attribute added there is traced as a row update.
- `applyRecordActions` (`modelStates.ts`, lines 335–358) replays a record in memory, model Actions through `ModelEntityActionTransformer.modelActionToInstanceAction`.

### 4.4 Storage creation (misaligned with D4)

| Store | `createStorageSpaceForInstancesOfEntity` on existing storage | Existence probe |
|---|---|---|
| SQL (`SqlDbStoreSection.ts`, lines 252–280) | `sync({ force: true })`: drops and recreates the table | `hasStorageSpaceForInstancesOfEntity` (line 287) |
| IndexedDB (`IndexedDbStoreSection.ts`, lines 87–120) | clears the sublevel | `hasSubLevel`, not exposed |
| MongoDB (`MongoDbStoreSection.ts`, lines 67–100) | `deleteMany({})` | `hasCollection`, not exposed |
| Filesystem (`FileSystemStoreSection.ts`, lines 99–122) | keeps the folder and its files | `fs.existsSync`, not exposed |

The four `createEntity` mixins call it without checking first (`sqlDbEntityStoreSectionMixin.ts` line 95, `FileSystemEntityStoreSectionMixin.ts` line 93, `IndexedDbEntityStoreSectionMixin.ts` line 91, `MongoDbEntityStoreSectionMixin.ts` line 91); the SQL one ignores its result and `upsert`s the Entity row. Callers of `createEntity` (52 occurrences in `packages/*/src`, among them `Runner_CreateApplication.tsx`, `syncExternalServiceSchema.ts`, the local caches' undo/redo, `applicationVersionInstall.ts`, `evolutionTraceRecords.ts`) are to be checked for re-creation of existing storage; the non-regression suite is the gate.

### 4.5 `alterEntityAttribute` on SQL (misaligned with D7)

`sqlDbEntityStoreSectionMixin.ts`, `alterEntityAttribute` (lines 198–266): upserts the Entity row with `applyMlSchemaColumnChanges`, rebuilds the Sequelize model from the altered row, then `sequelizeModel.sync({ alter: true })`, which also drops columns the row does not declare.

### 4.6 Tests

- `migrationRun.integ.test.ts` (filesystem): the following deployment is a copy of the authoring stores taken after 1.1.0 was built, installed at 1.0.0 (`applyModelState` deletes the `EditionC9` row and keeps its data folder), its `modelVersion` the authoring one's. Under D4 the replayed `createEntity EditionC9` fails on that folder: the copy must be taken at 1.0.0. C2 tests the resume (repeatable steps), C5 asserts a nested `createEntity` in a step is stored (#741 inverts it later).
- `migrationGeneration.integ.test.ts`: B1 to B3.6 assert `fill` and `contract` lists; they move to `steps`.
- `migrationRunGit.integ.test.ts`, `migrationGenerationGit.integ.test.ts`: read `expand` / `fill`; they move to the one-list shape with the checkout step.
- `migrationClassification.unit.test.ts`: the classification table (D3 changes `changeAttribute`).

## 5. Key reuse

| Piece | Location |
|---|---|
| In-memory replay of a record | `applyRecordActions`, `replayCommitRecords` (`modelStates.ts`) |
| Records between two markers | `recordsBetween` (`migrationGeneration.ts`) |
| Compared collections, without meta-model Entities | `comparedCollections` (`evolutionTraceAgreement.ts`) |
| Model diff | `diffModelStates` (`modelStateDiff.ts`) |
| Attributes added between two rows | `addedAttributes` (`applicationVersionInstall.ts`) |
| Run lock, state record writes | `withApplicationLock`, `writeDeploymentState`, `storedDeploymentState` |
| Run mark | `markMigrationRun` (core) |
| SQL table probe | `SqlDbStoreSection.hasStorageSpaceForInstancesOfEntity` |
| Migration Entity | uuid `b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe` (`miroir-app-miroir`) |
| DeploymentState Entity | uuid `14e696c6-c9ef-4d50-b2d6-1fd561b315f6` (`miroir-app-admin`) |

## 6. Effect on the epic

The epic's D2 changes with D4 and D5: storage creation fails instead of `IfMissing`, steps are no longer repeatable, and an interrupted step stops the run. Sections 7.2 (storage creation row) and 7.3 change accordingly, and a short note states the strict strategy. These edits go in the same PR.

## Next step

Confirm D1 to D7 with the user, then `tdd-implementation-plan.md`.
