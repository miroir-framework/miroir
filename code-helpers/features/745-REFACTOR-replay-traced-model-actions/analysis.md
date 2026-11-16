# 745 — Replay the traced model Actions in a migration run

> #9 built a migration run that rewrites the model to the frozen `to` version (the "jump", epic decision D2-d). The epic revision of 2026-11-16 (#744) replaces it, for `versioned-internal`, with a migration run that replays the model Actions the evolution traces recorded (D2-a). This analysis maps what #9 built, then decides the Migration's new shape, how generation writes the model steps, and how the migration run stays strict: no storage silently reused, no step run twice, no model the migration run did not expect.

Related issue: https://github.com/miroir-framework/miroir/issues/745
Parent issue: #694 (epic) · Prerequisite: #9 ✅ (#739, #740, #742) · Epic revision: #744 ✅
Follow-ups that depend on this one: #746 (Migration package), #741 (what a step may hold), #747 (D13, Git followers), #709 (restore and rollback, see section 7)
Related analyses: [`../694-EPIC-safe-application-evolution/analysis.md`](../694-EPIC-safe-application-evolution/analysis.md) (D2, D5, D6, D12, D13, sections 7.2, 7.3, 9), [`../9-FEATURE-create-migrations-for-model-and-data-updates/analysis.md`](../9-FEATURE-create-migrations-for-model-and-data-updates/analysis.md)
Key sources: [`migrationGeneration.ts`](../../../packages/miroir-versioning/src/migrationGeneration.ts), [`migrationRun.ts`](../../../packages/miroir-versioning/src/migrationRun.ts), [`applicationVersionInstall.ts`](../../../packages/miroir-versioning/src/applicationVersionInstall.ts), [`modelStates.ts`](../../../packages/miroir-versioning/src/modelStates.ts), [`evolutionTraceAgreement.ts`](../../../packages/miroir-versioning/src/evolutionTraceAgreement.ts), the four `*EntityStoreSectionMixin.ts`, Migration Entity `b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe`, DeploymentState Entity `14e696c6-c9ef-4d50-b2d6-1fd561b315f6`

**Document role:** analysis and decision record.
**Status:** decisions proposed, to confirm with the user. Revised once after an adversarial review (see the history).
**Document history:**
- 2026-11-16: first draft.
- 2026-11-16: adversarial review. Corrected: what `createEntity` does today on IndexedDB, MongoDB and the filesystem (it reuses storage, it does not clear it), the line references, and the test inventory. Added: incomplete trace records refused, Miroir excluded, writes on settings rows not replayed, a required attribute classified unsupported, the order "check, then storage, then row" in the SQL store, the `stepStarted` field and the `settleMigrationStep` action, the in-memory check against `toDigest` before step 1, the effect of D4 on each caller, and the conflict with rollback (section 7).
- 2026-11-16: the user's review. G3 restated (fail explicitly and stop); D3 restated with examples; D2 relies on #748 (instance writes on Entity rows refused) instead of converting them; "migration run" defined and used instead of "run".

**Strict strategy (the user, 2026-11-16).** Every decision below follows it: an operation of the versioning epic that meets a state it did not expect fails with an error naming that state. It never repairs, skips, reuses or overwrites silently. A failure leaves what it found as it was, so the operator sees it.

---

## 1. Goals

- **G1 — Move a deployment along the designer's own changes.** In order to get on a test deployment the model the designer built, with the data kept, as an application maintainer, I can run a Migration that replays, in order, the model changes the designer made between two versions, with the data steps placed among them.
- **G2 — Place data steps where they belong.** In order to copy, fill or clean data at the exact point where the model allows it (after an attribute is added, before one is removed), as an application designer, I can insert a data step between two model steps of a generated Migration.
- **G3 — Fail loudly, never silently.** In order to find a problem when it happens, not later in corrupted data, as an application maintainer, I can rely on a migration run that stops at the first state it did not expect (existing storage, a step that may have run already, a model that is not the one it expects) with an explicit error naming that state, instead of working around it and carrying on.
- **G4 — Finish a stopped migration run.** In order to complete a migration run that a crash or a failure stopped, as an application maintainer, I can run it again: it continues at the first step it did not start, and when it cannot tell whether a step was done, it stops and lets me say so.

## 2. Non-goals

- `versioned-git` follower migration runs: D13, #747. #9's Git migration run is kept, adapted to the new row shape (D1).
- Export and import of a Migration as a file: #746. The tests here give the following deployment its own copy of the `modelVersion` rows instead of a shared section.
- What a hand-written step may hold (model Actions refused): #741. D1 gives each step a `kind` that #741 checks.
- Column type, nullability and key changes on SQL: refused here (D3); the Actions that would apply them are a follow-up (to file).
- Restore and rollback, and what they do with storage left by later versions: #709 (section 7).
- A failed authoring commit that cannot be retried once D4 applies: a follow-up (to file, section 4.4).
- Committing a step's writes and its record in one SQL transaction: later; D5 detects the gap instead.
- Refusing instance writes on Entity rows, so that only model Actions write them, and the model Action for the Entity fields that change no storage: #748. This analysis relies on that rule (D2) and does not implement it.
- Migrations of Miroir itself: its model lives in its `data` section, and restoring Miroir's own model is an epic non-goal.

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1. What does a Migration row hold? | **One ordered `steps` list; each step has a `kind` (`model` or `data`); no phases, no `repeatable`; digests of the two models** | G1, G2 |
| D2. How does generation turn trace records into model steps? | **One step per model Action, in trace order, adds and removes split; a record holding an instance write on an Entity row is refused (#748's rule); then a replay of the steps checked against `to`** | G1, G2 |
| D3. Which model changes does a Migration accept, given what the model Actions can do to a SQL table? | **Those a model Action applies to the table; a type, nullability, foreign key, enum or key change, and a required attribute added to an existing Entity, are refused** | G3 |
| D4. What does `createEntity` do when the Entity's storage or row already exists? | **It fails, on every store, before writing anything** | G3 |
| D5. How does a migration run make sure no step runs twice? | **A step is recorded as started, then as done; a step started and not done stops the migration run until the operator settles it; a Migration already applied fails** | G3, G4 |
| D6. How does a migration run check the deployment's model without reading the authoring deployment's `modelVersion` section? | **The Migration holds digests of the `from` and `to` models; the migration run checks the live model and its own replay against them before step 1, and the live model after the last step** | G3 |
| D7. How does a replayed `alterEntityAttribute` or `renameEntity` change only what it names on SQL, all or nothing? | **Check first, then change the named columns or the table, then write the Entity row** | G3 |

**Legend.** *Migration run*: the execution of one Migration on one following deployment by `runMigration`, from its checks to the state record naming `to`; when it stops, the next `runMigration` of the same Migration continues the same migration run. *Authoring deployment*: the one the designer edits and freezes. *Following deployment*: a deployment whose model changes only through installs and migration runs (#9). *Trace record*: a `commit` row of the evolution traces, holding the model Actions and model-row writes one commit made, in order. *Model step*: a step generation writes from a model Action. *Data step*: a step the designer writes. *Digest*: a hash of a model's rows, normalized as the agreement check compares them.

### D1. What does a Migration row hold?

**Status:** Proposed — D1-a. **Serves:** G1, G2.

**What is at stake.** In Library, a designer splits `Author.name` into `firstName` and `lastName`. The copy step must run after both attributes exist and before `name` is dropped. The #9 row has `expand`, `fill` and `contract` lists around one jump, so the copy has to be in `fill`, and the drop of `name` cannot be ordered against it. With replay, the model changes are steps themselves, and the copy goes between them.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. One `steps` list with a `kind`** ★ | `steps: MigrationStep[]`, `MigrationStep = { uuid, name, kind: "model" \| "data", backwardCompatible, action, trace? }`; the row also gets `fromDigest`, `toDigest` and `digestCollections` (D6). `changes` stays (classification). `expand`, `fill`, `contract` and `repeatable` go. | the order is the migration run's order; the runner and #741 tell generated model steps from hand-written ones | the Migration Entity and every reader change (readers: `migrationGeneration.ts`, `migrationRun.ts`, the tests; checked, no UI or asset reads the phases) |
| D1-b. One list without a kind | as D1-a, the kind read from the action | smaller row | #741 must then infer what generation wrote, and a hand-written model Action reads as generated |
| D1-c. Keep the phases, model steps in the middle | `expand`, `model`, `fill`, `contract` | fewer changes | the order problem above stays |

`trace` (optional) names the record and the position of the Action a model step comes from, as evidence. `repeatable` goes because no step runs twice (D5).

**`versioned-git`, until D13.** Git generation writes no replayed Actions. It writes one model step, the checkout of the tag `to` (a `gitAction_checkout`), with `changes` as information. The runner runs that step as #9 ran the jump: checkout, reload, then the `checkedOutVersion` check. This is #9's jump under another name, kept on purpose until #747 decides; Git Migrations get no digests (the checkout is the model). Data steps go before or after the checkout step.

**Old rows.** No Migration row is stored in any asset (checked: no file under `packages/*/assets/**/b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe/`). A row with `expand`, `fill` or `contract`, written by #9 in a store or committed at a Git tag, is refused by the migration run (`migrationStepsInvalid`), not converted (strict). Only test repositories hold such tags today.

### D2. How does generation turn trace records into model steps?

**Status:** Proposed — D2-a (revised after #748 was filed; the first draft chose the conversion, now D2-b). **Serves:** G1, G2.

**What is at stake.** In appForTest (#9 part C test), the designer adds `Publisher.mottoC9` in the Entity editor. Today the trace holds an `updateInstance` of the Publisher Entity row, not an `alterEntityAttribute`: replayed as is, it changes the row but no SQL column, and the next write of a motto fails. A trace replay is right only if every model change it holds also changes storage. #748 makes that true at the source: once it lands, an instance write on an Entity row fails, the Entity editor saves through `createEntity`, `alterEntityAttribute`, `renameEntity`, `dropEntity` and the Action #748 adds for the Entity fields that change no storage, and the traces record those Actions.

Generation walks the `commit` records between the two version markers in sequence order, one Action at a time, keeping the model state replayed so far (as `applyRecordActions` does, `modelStates.ts` lines 335–358). Each Action gives zero or more steps:

| Traced Action | Steps written |
|---|---|
| `createEntity` | one `createEntity` per Entity it creates |
| `alterEntityAttribute` with `addColumns` and `removeColumns` | the add, then an empty data step `fill <Entity>.<attribute>` per added attribute, then the remove |
| `alterEntityAttribute` with one of them | itself (an add is followed by its empty fill steps) |
| `renameEntity`, `dropEntity` | itself |
| the Action #748 adds for the Entity fields that change no storage | itself |
| `createInstance`, `updateInstance` or `deleteInstance` of an Entity row | none: generation refuses (`migrationEntityRowWrite`, naming the record), see below |
| instance writes on rows of the compared collections (`AGREEMENT_COLLECTIONS`: Queries, Reports, Menus, Endpoints, Runners, Themes, TransformerDefinitions, MlSchemas, Tests, Blobs, TestConfigurations) | itself |
| instance writes on other model rows (the SelfApplication row, its branches: the traces switch, `versioningMode`) | no step: listed in `changes` as `kind: "settingsChange"`, information only. A following deployment's settings are its own (its traces are off, its role is following). |

Refusals, before any step is written:
- a record holding an instance write on an Entity row (`migrationEntityRowWrite`): it breaks #748's rule. Such records exist today (the Entity editor) and keep existing in histories recorded before #748. The designer re-baselines after the edit, and a Migration across it is written by hand, as for any re-baseline (epic D11).
- a `commit` record with `complete: false` between the two versions (`migrationIncompleteRecord`): a commit that stopped part way, then retried, holds some Actions twice, and a replay would meet its own work (D4). The designer re-baselines.
- the application is Miroir (`migrationUnsupportedApplication`): its model lives in `data`, and `ModelEntityActionTransformer` writes model Actions to `model` (lines 41, 63, 90, 121), so an in-memory replay of Miroir changes nothing and proves nothing.

Then generation replays its own model steps on the `from` state in memory and refuses (`evolutionTracesDisagree`) if the result is not `to`, as D12-b of the epic asks (the draft includes its own proof). The check on the raw records stays before it.

With traces off (`source: diff`), there are no records: the steps come from the diff of the two versions, written as the same model Actions, in a fixed order: Entities created, renamed, attributes added (with their fill steps), attributes removed, Entities dropped, the other Entity fields (through #748's Action), then the other rows created, updated, deleted. The same replay check runs.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. One step per model Action; Entity row writes refused** ★ | above | the steps are what the designer ran; no conversion to get wrong; strict | until #748 lands, an Entity edited in the Entity editor blocks generation between the versions around it |
| D2-b. One step per Action, Entity row writes turned into model Actions | generation compares each Entity row update with the row replayed so far and writes `renameEntity`, `alterEntityAttribute` and the row update | works on today's traces | a conversion that guesses Actions the designer did not run; superseded by #748 |
| D2-c. One step per trace record | the record's Actions as one sequence | fewer steps | an add and a remove made in one commit cannot have a step between them |
| D2-d. Replay records as they are | no conversion, no refusal | simple | today's Entity row updates change no storage (above) |

**Order with #748.** #745 does not wait for #748: its tests change Entities through model Actions. Until #748 lands, generating a Migration across an Entity edited in the Entity editor is refused, which is the strict outcome.

### D3. Which model changes does a Migration accept, given what the model Actions can do to a SQL table?

**Status:** Proposed — D3-a. **Serves:** G3.

**What is at stake.** A Migration step changes the stores only through the model Actions `createEntity`, `alterEntityAttribute`, `renameEntity` and `dropEntity`. On SQL these run `CREATE TABLE`, `ALTER TABLE … ADD COLUMN` / `DROP COLUMN`, `ALTER TABLE … RENAME` and `DROP TABLE`. No model Action changes the type or the nullability of an existing column, or a table's primary key: `alterEntityAttribute` declares an `update` field, and the SQL store ignores it (`sqlDbEntityStoreSectionMixin.ts`, `alterEntityAttribute`; epic section 7.2). A required attribute is a `NOT NULL` column (`allowNull: false`, `miroir-store-postgres/src/utils.ts` line 114), and PostgreSQL refuses to add a `NOT NULL` column without a default to a table that holds rows.

So some model changes have no model Action that brings the SQL table to match. Today the designer makes them in the Entity editor, as Entity row updates, and #9 classifies them as supported: the migration run rewrites the Entity row, the table stays as it was, and a later write fails or stores a value of the wrong type. After #748 the Entity editor cannot save them (no model Action does them), but generation still meets them in two cases: the diff of two versions when the traces are off, and the diff between versions frozen before #748 (D2 refuses those records, the diff path does not have them).

Examples on Library (the attributes as they are today: `Book.year` is an optional number, `Book.author` a required uuid pointing to Author):

| Change made by the designer | Model step(s) the Migration holds | What SQL does | Under D3-a |
|---|---|---|---|
| add an optional `Book.isbn` (string) | `alterEntityAttribute` with `addColumns: [isbn]` | `ADD COLUMN isbn` (nullable) | **accepted** |
| remove `Book.citation` | `alterEntityAttribute` with `removeColumns: [citation]` | `DROP COLUMN citation`, its values gone | **accepted**, not backward-compatible (epic D1) |
| create the Entity `Edition`, with a required `name` | `createEntity Edition` | `CREATE TABLE`, empty | **accepted** (a required attribute of a new, empty table is fine) |
| rename the Entity `Publisher` to `Editor` | `renameEntity` | `ALTER TABLE … RENAME`, rows kept | **accepted** (#9 refused it, since the jump did not rename tables) |
| drop the Entity `Edition` | `dropEntity` | `DROP TABLE` | **accepted**, not backward-compatible |
| change the display label of `Book.year` (its `tag`) | the Action #748 adds for the Entity fields that change no storage | nothing | **accepted**; not listed as a change |
| change a Report or a Query | the instance write | nothing (model rows only) | **accepted** |
| add a required `Book.isbn` to Book, which holds rows | `alterEntityAttribute` with `addColumns: [isbn]`, required | `ADD COLUMN isbn NOT NULL` fails on a table with rows | **refused** at generation (`supported: false`), so the migration run refuses the Migration before step 1 |
| make `Book.year` required | none: no Action changes nullability | the column stays nullable | **refused** |
| change `Book.year` from number to string | none: no Action changes a column type | the column stays numeric | **refused** |
| point `Book.author` to Publisher instead of Author | none | nothing; existing values point to Authors | **refused** |
| change the enum values of an attribute | none | nothing; existing values may fall outside the new list | **refused** |
| change Author's `idAttribute` from `uuid` to `name` | none: no Action changes a primary key | the key stays `uuid` | **refused** |

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Refuse the changes no model Action can apply to the table** ★ | generation classifies `changeAttribute`, `changeIdAttribute`, and a required attribute added to an existing Entity as `supported: false`, with a note naming the follow-up; it still writes the Migration, so the designer sees the list; `runMigration` refuses it before step 1 (`migrationUnsupportedChange`) | the migration run never ends with a table that does not match the model | a type change or a new required attribute on an existing Entity cannot be migrated until the follow-up |
| D3-b. As #9 | the Entity row is rewritten, the table left as it is | no new refusal | the table no longer matches the model, found later by a failed write |
| D3-c. Add column changes now | SQL `changeColumn` behind `alterEntityAttribute.update`, and a required attribute generated as "add it nullable, fill it, make it required" | complete | a new Action contract, out of this issue's scope: the follow-up |

The filesystem, IndexedDB and MongoDB stores keep each instance as a JSON document, so these changes need no storage change there. D3-a refuses them on every store anyway: a Migration does not know which store its following deployments use, and existing documents would still hold values of the old type or no value for a required attribute.

### D4. What does `createEntity` do when the Entity's storage or row already exists?

**Status:** Proposed — D4-a. **Serves:** G3.

**What is at stake.** A following deployment of Library whose `Edition` table exists, left by an earlier attempt, by a rollback (#709) or made by hand, gets a migration run that replays `createEntity Edition`. Today:
- SQL drops and recreates the table (`createStorageSpaceForInstancesOfEntity`, `sync({ force: true })`, `SqlDbStoreSection.ts` lines 252–280): the rows are lost;
- the IndexedDB, MongoDB and filesystem mixins see the Entity in `dataStore.getEntityUuids()`, log a warning, skip the creation and upsert the row (`IndexedDbEntityStoreSectionMixin.ts` lines 81–93, `MongoDbEntityStoreSectionMixin.ts` lines 81–93, `FileSystemEntityStoreSectionMixin.ts` lines 83–95): the old rows are adopted.

Either way nothing says so. And SQL `createEntities` drops each `createEntity` result (`sqlDbEntityStoreSectionMixin.ts` lines 125–131), so even its existing errors never reach the caller.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Fail on every store, before writing** ★ | each mixin's `createEntity` first checks that neither the Entity row nor its storage exists, with a physical probe (below), and fails with `storageExists` or `entityExists`, naming the Entity; `createEntities` stops at and returns the first error, on every store; external Entities (no storage) are exempt from both checks and keep today's upsert of their row | strict, everywhere, not only in migration runs | callers that relied on re-creation fail (section 4.4) |
| D4-b. Fail in migration runs only | the migration run's mark switches the check on | no effect elsewhere | the mark is a symbol that does not cross the REST boundary; two behaviours for one Action |
| D4-c. `IfMissing` | create when absent, keep when present | resumable | rejected by the user: adopts storage the migration run did not create |

The physical probe, one per store, on the store itself, not on the list of Entities registered at boot (an orphan IndexedDB sublevel is not in `getSubLevels`, `IndexedDbStoreSection.ts` lines 42–46):

| Store | Probe |
|---|---|
| SQL | the table exists in the schema (`queryInterface.tableExists`, as `hasStorageSpaceForInstancesOfEntity` does, line 287) |
| Filesystem | the Entity's folder exists (`fs.existsSync`) |
| IndexedDB | the sublevel holds at least one key, or is registered |
| MongoDB | the collection exists in the database (`listCollections`) |

The probe is a new store method used only by `createEntity`. The optional `hasStorageSpaceForInstancesOfEntity` stays as it is, since `PersistenceStoreController` uses its presence to decide boot behaviour (lines 571 and 804). `createStorageSpaceForInstancesOfEntity`, used by `ModelInitializer` and the lazy `devData` creation, keeps its behaviour: D4 is on the model Action.

### D5. How does a migration run make sure no step runs twice?

**Status:** Proposed — D5-a. **Serves:** G3, G4.

**What is at stake.** A migration run stops after the `createEntity Edition` step wrote the table and before the record of the step was saved. #9 then re-runs the step on resume, assuming every step repeatable. Under D4, the second execution of the step fails on the existing table, which is right, but the error reads as a storage problem, not as an interrupted step. A data step that wrote half its rows and failed (#9 test C2: "first write lands, second fails") would be run again from its start.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. Started and done, settled by the operator** ★ | below | never runs a step twice; says why it stops | the operator settles an in-doubt step |
| D5-b. Repeatable steps | #9 | resumes alone | contradicts D4 and the strict strategy |
| D5-c. Step and record in one transaction | SQL only | no in-doubt window on SQL | not on the other stores; later |

D5-a:
- The `DeploymentState` row's `run` gets a `stepStarted` field (Admin Entity schema change). The migration run writes `stepStarted: <uuid>` before a step and, once the step succeeded, moves it to `stepsDone`.
- A step that fails leaves `stepStarted` set: the migration run returns the step's error, says the step is in doubt, and stops. Nothing tells a refusal that wrote nothing from a failure half way through a composite step, so every failure is in doubt.
- On the next `runMigration`: steps in `stepsDone` are skipped; a set `stepStarted` stops the migration run (`migrationStepInDoubt`, naming the step and how to settle it); otherwise the migration run starts at the first step not done.
- A new Model Endpoint action, `settleMigrationStep { application, step, outcome: "done" | "notRun" }`, is the only way to clear `stepStarted`. It is refused unless `step` is the deployment's in-doubt step. `done` moves it to `stepsDone`; `notRun` clears it, and the next migration run starts that step again. The operator checks the step's effect before choosing, and undoes a half-done step by hand first.
- A `runMigration` of the Migration that the last `applied` entry names, on a deployment whose version is that Migration's `to`, fails with `migrationAlreadyApplied`, before the `from` check (whose message would be less clear). After a rollback (#709) puts the deployment back at `from`, a new migration run of the same Migration is a new migration run, not a replay of steps the deployment kept: it proceeds if the storage allows it (section 7).

The `run` and `applied` attributes of DeploymentState stay `editable: false`: the settlement goes through the action, not through the instance editor.

### D6. How does a migration run check the deployment's model without reading the authoring deployment's `modelVersion` section?

**Status:** Proposed — D6-a. **Serves:** G3.

**What is at stake.** The `DeploymentState` row says a following deployment is at 1.0.0, but someone changed its model by hand, a step was settled wrongly, or the designer edited a model step of the Migration. The replayed Actions then meet a model they were not written for, and the deployment ends with its state saying 1.1.0 and a model that is not 1.1.0. #9 avoided this by rewriting the whole model to the frozen version, which epic D5 now rules out (the migration run must read nothing else from the authoring `modelVersion`).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D6-a. Digests in the Migration** ★ | below | catches any divergence before the first step; the Migration stays self-contained (#746) | a digest says only "different", not what |
| D6-b. Full snapshots in the Migration | `from` and `to` model states in the row | says what differs | copies two versions into every Migration |
| D6-c. No check | trust the state record | nothing to build | the gap above |

D6-a:
- Generation stores `digestCollections` (the compared collections both versions snapshotted, so a version frozen before #706 adds no collection it lacks), `fromDigest` and `toDigest`: hashes of the two models over those collections, normalized as the agreement check compares rows (`comparedCollections`, meta-model Entities left out, `conceptLevel` defaulted, the attributes `modelStateDiff.ts` does not compare left out). This is a new function next to `comparedCollections`, sharing its normalization.
- Before step 1 of a new migration run: the live model's digest must be `fromDigest`, and the migration run's own model steps, replayed in memory on the live model, must give `toDigest`. Either mismatch fails (`migrationModelMismatch`, saying which), before anything is written. This catches an edited model step and a model changed by hand.
- After the last step, before the version is written: the live model's digest must be `toDigest`; a mismatch fails, the migration run stays recorded, the version unchanged.
- A Migration without digests (written by hand) is refused (`migrationDigestMissing`) in `versioned-internal`. A hand-written Migration starts from a generated one.

### D7. How does a replayed `alterEntityAttribute` or `renameEntity` change only what it names on SQL, all or nothing?

**Status:** Proposed — D7-a. **Serves:** G3.

**What is at stake.** Two gaps in the SQL store:
- `alterEntityAttribute` runs `sync({ alter: true })`, which drops every column the Entity row does not declare (`sqlDbEntityStoreSectionMixin.ts` lines 198–266), so a column kept on purpose loses its values;
- it upserts the Entity row before changing the table (row at line ~241, `sync` at lines 263–265), and `renameEntity` upserts the row before renaming the table and ignores the rename's result (lines 167–195): a storage failure leaves the row changed and the table not, a model step that is neither done nor undone.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D7-a. Check, storage, row** ★ | `alterEntityAttribute`: fail if an added column exists or a removed one does not; then `queryInterface.addColumn` / `removeColumn` for the named columns; then the Entity row. `renameEntity`: fail if the target table exists; rename the table, checking the result; then the row. | touches only what it names; a failure in the check writes nothing | the column definition is built per attribute, not by Sequelize from the whole model |
| D7-b. Keep `sync({ alter: true })` | as today | nothing to build | the gaps above |

The other stores keep attributes in the instance JSON: their `alterEntityAttribute` changes only the Entity row, and their `renameEntity` keeps the storage keyed by uuid.

---

## 4. Current state

### 4.1 Migration row and generation (`migrationGeneration.ts`)

- `MigrationStep` (lines 75–81) has `repeatable`; `MigrationRow` (lines 84–100) has `changes`, `expand`, `fill`, `contract`, `backwardCompatible`.
- `entityStructureChanges` (lines 141–196): `renameEntity` and `changeIdAttribute` are `supported: false`; `changeAttribute` and `addAttribute` are `supported: true`.
- `migrationSteps` (lines 232–242): an empty fill step per added attribute, an empty contract step per removed Entity or attribute, no expand step.
- `generateMigration` (lines 490–574): refuses on a following deployment, across a re-baseline, when a Migration exists (unless `replace`); replays the records with `replayCommitRecords` and refuses when the result is not `to` (`evolutionTracesDisagree`); writes the draft from the two snapshots (`draftMigration`, lines 420–452). The records are not used for the steps; incomplete records are replayed like the others (`modelStates.ts` lines 360–366).

### 4.2 The migration run (`migrationRun.ts`)

- `runOrder` (line 82): `[...expand, JUMP_STEP, ...fill, ...contract]`.
- `runToDo` (lines 129–217): resumes a `run` in progress for the same Migration; refuses another one (`migrationRunInProgress`), a missing Migration, a deployment not at `from` (`migrationNotAtFrom`), an unsupported change, duplicate step uuids, a `transactionalInstanceAction`, and with Git a step writing the model or a clone not at `from`. The Migration is read from the deployment's own `modelVersion` rows (`live.migrations`, lines 147–149).
- `jump` (lines 218–237): `bringModelToVersion` (internal: the frozen `to` from the `modelVersion` section, written with `applyModelState`) or `checkoutVersion` (Git), then `reloadModel`.
- The loop (lines 293–314) skips steps in `stepsDone`, runs a step, then records it; nothing is recorded before a step, and a failed step is not recorded.
- A second migration run of a finished Migration is refused by the `from` check, with the reason `migrationNotAtFrom`.

### 4.3 What the trace records hold (`evolutionTraceRecording.ts`, `versioningInterfaces.ts`)

- A `commit` record (`EvolutionTraceRecordRow`) holds `actions`: `createEntity`, `alterEntityAttribute`, `renameEntity`, `dropEntity`, and `createInstance` / `updateInstance` / `deleteInstance` on the `model` section (Miroir: `data`), version-history Entities left out (`isRecordedModelChange`, lines 164–187). The SelfApplication row is in the `model` section, so its writes are recorded.
- The Entity editor saves an Entity row as an `updateInstance` (epic section 7.2), so an attribute added there is traced as a row update. #748 refuses such writes.
- A commit whose replay fails appends a record with `complete: false` and returns, its transaction kept (`DomainController.ts` lines 2596–2619).

### 4.4 `createEntity` and its callers under D4

Each store's behaviour is in D4. The callers that can meet existing storage, and what D4 does to them:

| Caller | When it meets existing storage | Under D4 |
|---|---|---|
| A commit retried after it failed part way (`DomainController.ts` lines 2596–2619) | the retry replays a `createEntity` the failed attempt wrote | fails with `storageExists`; on SQL it drops the table today. The retry path needs its own fix (follow-up to file). |
| `resetModel` then `initModel` / `createEntity` on SQL (`DomainController.ts` ~2206 and ~2344, `Runner_CreateApplication.tsx` line 594) | `clear()` drops only the tables of registered models (`SqlDbStoreSection.ts` lines 80–93); an orphan table survives | fails, naming the orphan table. In scope: `clear()` drops every table of the section's schema, so a reset leaves nothing behind. |
| `ensureVersionHistoryEntities`, `ensureApplicationEntity` (`applicationVersionInstall.ts` lines 261–290, `evolutionTraceRecords.ts` line 57) | they check the in-memory model only; a row deleted without its storage leaves an orphan | fails, naming the storage: the orphan is a loose end the operator must see |
| External service schema sync (`syncExternalServiceSchema.ts` lines 706–714, Entities built at lines 853–869) | a re-sync emits `createEntity` again for every operation's external Entity | external Entities are exempt from D4: they have no storage, and their `createEntity` stays an upsert of the row |
| Test setups that create fixture Entities | a store left by an earlier test run | the non-regression suite is the gate; a failure is fixed in the setup, not by loosening D4 |

### 4.5 SQL `alterEntityAttribute` and `renameEntity`

See D7: row first, then `sync({ alter: true })` or the rename, whose result is ignored.

### 4.6 Tests that change

- `migrationRun.integ.test.ts` (filesystem): the following deployment is a copy of the authoring stores taken after 1.1.0 was built, installed at 1.0.0 (`applyModelState` deletes the `EditionC9` row and keeps its data folder), its `modelVersion` the authoring one's. Under D4 the replayed `createEntity EditionC9` fails on that folder: the copy is taken at 1.0.0, and the following deployment gets its own copy of the `modelVersion` rows, standing in for the import of #746. C2 (resume) and C5 (a nested `createEntity` stored; #741 inverts it later) change with D5.
- `followingDeployment.integ.test.ts`: shares the authoring `modelVersion` folder (line 211); its install tests stay, the sharing is kept there as the "read access" way of epic D5.
- `migrationGeneration.integ.test.ts`: B1 to B3.6 assert `fill` and `contract` lists; they move to `steps`; B2.3 (required attribute added) and B2.4 (rename) change with D3.
- `migrationRunGit.integ.test.ts`, `migrationGenerationGit.integ.test.ts`: move to the one-list shape with the checkout step.
- `migrationClassification.unit.test.ts`: the classification table (D3).
- MiroirTest `action.scenario.migration` (`miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/9c5a0001-9e2b-4c1d-8f3a-5b6c7d8e9f01.json`): reads `changes` only, unchanged by D1; to rerun.

## 5. Key reuse

| Piece | Location |
|---|---|
| In-memory replay of a record | `applyRecordActions`, `replayCommitRecords` (`modelStates.ts`) |
| Records between two markers | `recordsBetween` (`migrationGeneration.ts`) |
| Compared collections and their normalization | `comparedCollections`, `AGREEMENT_COLLECTIONS` (`evolutionTraceAgreement.ts`), `NOT_COMPARED` (`modelStateDiff.ts`) |
| Collections a version snapshotted | `frozenCollectionsOf` (`modelStates.ts`) |
| Model diff | `diffModelStates` (`modelStateDiff.ts`) |
| Attributes added between two rows | `addedAttributes` (`applicationVersionInstall.ts`) |
| Migration run lock, state record writes | `withApplicationLock`, `writeDeploymentState`, `storedDeploymentState` |
| Migration run mark | `markMigrationRun` (core) |
| SQL table probe | `SqlDbStoreSection.hasStorageSpaceForInstancesOfEntity` |
| Migration Entity | uuid `b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe` (`miroir-app-miroir`) |
| DeploymentState Entity | uuid `14e696c6-c9ef-4d50-b2d6-1fd561b315f6` (`miroir-app-admin`) |

## 6. Documents this issue updates

- The epic analysis: D2 (done in this branch: storage creation fails, steps run once), sections 7.1, 7.2, 7.3, and section 9 (E1's "run it again", the failure row and the PostgreSQL experiment, which assumed repeatable steps; see section 7 below).
- `docs/reference/versioning.md`: the Migration's shape, the migration run, the strict strategy, `settleMigrationStep`.
- The #9 analysis: a note at its top that D2-d, the jump and the phases are replaced by #745.
- The explainer `explainer-trace-vs-migration-20261116-104543/`: a note that it describes #9 before #745.

## 7. Open point for the user: rollback and leftover storage

Epic D6 and section 9 expect a rollback that keeps a later version's storage ("restore `1.0.0`: allowed, and `isbn` stays in storage"), followed by a new migration run of an earlier Migration, the kept column keeping its values. Under the strict strategy, that new migration run fails: its `alterEntityAttribute` meets the kept `isbn` column (D7), or its `createEntity` meets a kept table (D4). The migration run is right to stop, since it cannot tell a column kept on purpose from one left by mistake. Two ways out, both in #709:
- the rollback drops the storage the rolled-back versions added, refused when it holds data unless the operator confirms (data loss stated);
- the rollback records what storage it kept, and a later migration run accepts exactly that storage, by name and definition (an explicit, recorded exception, not a silent one).

This issue implements the strict migration run and leaves the choice to #709; section 9 of the epic is marked accordingly.

## Next step

Confirm D1 to D7 and section 7 with the user, then `tdd-implementation-plan.md`.
