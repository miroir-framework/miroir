# 9 — Migrations between model versions: generation, runner and deployment state record

> **Superseded in part by #745** ([analysis](../745-REFACTOR-replay-traced-model-actions/analysis.md)). Its D2-d (a migration run rewrites the model to the frozen `to` version), the jump, and the phases `expand`, `fill` and `contract` are replaced: a Migration holds one ordered list of model and data steps, the model steps replaying the traced model Actions; a step runs once (in doubt until settled when it stops part way); the model is checked against the frozen `from` and `to` versions; `createEntity` fails on existing storage. The current behaviour is in [`docs/reference/versioning.md`](../../../docs/reference/versioning.md#migrations-and-deployment-roles).

> A designer gets a draft data migration between two versions of an application's model and edits it; an operator moves a following deployment from one version to a later one and sees where its data stands. This analysis decides how #9 builds the `Migration` Entity, its generation from trace records and model diffs, the resumable runner with its expand, jump, fill and contract phases, and the deployment state record, with the role of a deployment (authoring or following) fixed at its creation.

Related issue: https://github.com/miroir-framework/miroir/issues/9
Parent issue: [#694](https://github.com/miroir-framework/miroir/issues/694), item 7 · Prerequisites: #696 ✅ (versioning package), #708 ✅ (trace records, `ModelStateSource`, replay, diff, agreement check, `gitAction_tag`) · Follow-up: #733 (actions for the contract phase)
Related analyses: [694 epic analysis](../694-EPIC-safe-application-evolution/analysis.md) (sections 4 to 9: D1, D2, D5, D6, D10, D12), [694 decisions](../694-EPIC-safe-application-evolution/decisions.md) (Q10, Q21 to Q23, Q29 to Q31), [708 trace revival](../708-FEATURE-trace-revival-model-states/analysis.md), [696 versioning package](../696-REFACTOR-versioning-package/analysis.md). The 2024 documents of this folder ([WP1](wp1-analysis-model-evolution-trace.md), [WP2](wp2-analysis-application-version-migrations.md)) are superseded by the epic; WP2's "migration tape" became the trace records of #708.
Key sources: [`modelStates.ts`](../../../packages/miroir-versioning/src/modelStates.ts), [`modelStateDiff.ts`](../../../packages/miroir-versioning/src/modelStateDiff.ts), [`evolutionTraceAgreement.ts`](../../../packages/miroir-versioning/src/evolutionTraceAgreement.ts), [`evolutionTraceRecords.ts`](../../../packages/miroir-versioning/src/evolutionTraceRecords.ts), [`applicationVersionFreeze.ts`](../../../packages/miroir-versioning/src/applicationVersionFreeze.ts), [`freezeApplicationVersion.ts`](../../../packages/miroir-versioning/src/freezeApplicationVersion.ts), [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts), [`DomainControllerActionHost.ts`](../../../packages/miroir-core/src/0_interfaces/3_controllers/DomainControllerActionHost.ts), [`Deployment.ts`](../../../packages/miroir-core/src/1_core/Deployment.ts), [`SqlDbStoreSection.ts`](../../../packages/miroir-store-postgres/src/4_services/SqlDbStoreSection.ts)

**Document role:** analysis and decision record for #9. The epic's decisions (Q10, Q21 to Q23, Q29 to Q31, D1, D2, D5, D10, D12) are settled and not reopened. This document decides how to build them. Where one of its decisions narrows an epic decision, it says so in a **Narrows** line; section 3.1 lists those for the user's sign-off.
**Status:** proposed (2026-11-15). The user's first review is applied (D4-b, D5 compared with the Application Version, D6 on the Deployment, storage reconciliation set aside); the narrowings N1 to N4 wait for sign-off.
**Document history:**
- 2026-11-15: first draft, then an adversarial review (a fact check and an attack on each decision). It limited the model rewrite to the application's own model rows, made a contract step carry the `from` Entity row, put the gate on following deployments in the persistence process, detected renames and `idAttribute` changes made in the Entity editor, refused generation across a re-baseline, and allowed hand-written Migrations.
- 2026-11-15, the user's review:
  - G5 ("keep storage in step with the model") is set aside, with the old D9 (add-only reconciliation, `createStorageSpaceForInstancesOfEntityIfMissing` on every store) and D10 (store management actions). Detecting and correcting a divergence between model and storage is for later, with existing actions where they suffice. The old part A (storage) is gone. The jump now changes storage only through existing model actions (D2).
  - D4-b instead of D4-a: the contract phase runs `CompositeActionSequence`s like the other phases. The missing actions are #733.
  - D5 now compares the deployment state record with the Application Version, to show that it re-implements none of it.
  - D6: the role is an attribute of the Deployment, chosen at its creation and never changed; the `setDeploymentRole` action is gone.

### Sequencing

| Epic item | Issue | State |
|---|---|---|
| 5 | #696 versioning package and process capability | ✅ |
| 6 | #708 trace records, model states, agreement check, Git tag | ✅ (PRs #727, #730, #731) |
| 7 | **#9 migrations, generation, runner, state record** | **this** |
| 8 | #215 paired data migrations, composite rename | after 7 |
| 9 | #709 restore and rollback | after 7 (builds on the model rewrite, D2 here) |
| 10 | #710 the two experiments | after 6, 7 and 9 |
| 11 | #718 switching versioning modes | beside, lands before 9 and 10 |
| — | #733 actions for the contract phase | after 7 |

---

## 1. Goals

From the epic's goals G2 (prepare a migration), G3 (bring a test deployment forward) and G4 (know where a deployment stands), restated for this item:

- **G1 — Get a draft migration.** In order to move existing data to a new model without writing it all by hand, as an application designer, I can ask for a draft migration between two versions of my application, read what changed and which changes are not backward-compatible, and edit its steps; I can also write a migration by hand where no draft can be made.
- **G2 — Move a test deployment forward.** In order to try a new model on realistic data, as an operator of a test deployment, I can run a migration on it, and its model reaches the target version while its data is kept and transformed.
- **G3 — Survive a stopped run.** In order to trust a migration on real data, as an operator, I can run a migration again after it stopped part way, and it resumes where it stopped and ends in the same state as an uninterrupted run.
- **G4 — Know where a deployment stands.** In order to know which migrations still have to run, as an operator, I can see the version a deployment's data is at, whether it authors the model or follows it, and the migrations that ran on it.

Set aside by the user (2026-11-15): **keep storage in step with the model.** The platform should help the user get the model and the storage as they want them, while limiting the risk that the two diverge; this calls for a way to detect a divergence and to correct it, with existing actions where they suffice. It is not part of #9.

## 2. Non-goals

- Detecting and correcting a divergence between a model and its storage (the goal set aside above). In #9 the storage changes only through the model actions the jump and the steps run.
- Actions that drop storage the target model no longer declares, for the contract phase (#733).
- Paired data migrations, the composite `renameEntityAttribute` Action, trace entries that keep a composite (#215, epic item 8), and data steps that read an attribute the target model removed (narrowing N3, section 3.1).
- The `restoreApplicationVersion` action of an operator, with its Q31 check, the open-traces rule, the re-baseline marker on the authoring deployment and its UI (#709, epic item 9). #9 builds the model rewrite under it (D2).
- Changing the role of an existing deployment (D6): a deployment that should follow is created as following.
- Two processes sharing one `modelVersion` storage in a real setup (epic D5-a) and the clone installer that puts data outside the work tree (epic D7): #710 (item 10). #9 tests run the authoring and the following deployments one after the other, sharing the `modelVersion` folder, and its Git test configures the data section outside the clone itself.
- Release packages without Git (epic D9, deferred).
- Running a migration on the authoring deployment. Its model is already at the target version; its data follows the designer's live edits.
- Committing a step and its state-record update in one SQL transaction (narrowing N2, section 3.1).
- Store backups (epic non-goal, Q31 (c)).

## 3. Decision record

Legend:
- **`versioned-internal`**: the model lives in the `model` section of any store but `bundled`; a version is a frozen `SelfApplicationVersion` (Entity `c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24`) with its `*Version` rows in the `modelVersion` section. No Git.
- **`versioned-git`**: the model lives in the `model` section on the filesystem, inside a Git work tree; a version is a Git tag (`gitAction_tag`, #708); a `modelVersion` folder committed with the model holds trace records and, after #9, Migrations.
- A **record** is an evolution trace record (Entity `EvolutionTraceRecord`, `854c47bd-af74-4305-bdea-aa6bddfa8899`, #708). Its `version` marker names the version by the **uuid** of its `SelfApplicationVersion` (`appendVersionMarker`, `freezeApplicationVersion.ts`, line 467), not by name.
- The **authoring** deployment is the one designers edit; a **following** deployment runs migrations and never writes to `modelVersion` (epic D5).
- The **phases** of a migration are expand (steps on the starting model), jump (the model goes to the target version), fill (steps on the target model) and contract (steps that remove what the target model no longer needs) (epic D2-d).
- The **application's own model rows**: the rows of the collections a freeze snapshots (`AGREEMENT_COLLECTIONS`, `evolutionTraceAgreement.ts`), in the `model` section, without the meta-model Entities that an application's model holds (the `metaModelEntityUuids` filter of `selectEntitiesToFreeze`, `applicationVersionFreeze.ts`). The `EvolutionTraceRecord` and `Migration` Entity rows are meta-model Entities, so they are not among them.
- The **persistence process** is the process that holds the stores: the server, Electron's main process, the CLI, or an emulated server in tests.

| Decision | Choice | Serves |
|---|---|---|
| D1. How is #9 delivered: one PR, or several? | **Three parts, each with its own PR: A formats and roles, B generation, C runner** | all |
| D2. Without Git, what does the runner's jump call, when the restore action is #709's? | **#9 builds the model rewrite (`applyModelState`) of the application's own model rows, with existing model actions for Entity changes; the runner and the creation of a following deployment call it; #709 wraps it into the restore action** | G2 |
| D3. What does a `Migration` row hold? | **Its two version names, the structure changes found by generation, and three lists of steps (expand, fill, contract), each step a `CompositeActionSequence` with its `backwardCompatible` and `repeatable` flags** | G1, G2, G3 |
| D4. What does a contract step run? | **A `CompositeActionSequence`, like the other phases; generation fills it with existing actions where they do the job, and leaves a named empty step where none does (#733)** (D4-b, chosen by the user) | G2 |
| D5. Where is the deployment state record, what does it hold, and how does it compare with the Application Version? | **An Admin Entity `DeploymentState`, one row per Deployment: the version name its data is at, the migrations applied, a run in progress. It names versions and holds no model content** | G3, G4 |
| D6. What makes a deployment following, and what does following forbid? | **A `role` attribute on the Admin `Deployment`, chosen at its creation and refused on update; a following deployment refuses model and `modelVersion` writes, except those of a migration run** (chosen by the user) | G2, G4 |
| D7. How does generation find the structure changes and the steps? | **Records between the two version markers (or added between the tag and `HEAD`), checked by replay against the target state, turned into changes and checked against the diff; the diff alone when there are no records; refused across a re-baseline** | G1 |
| D8. How does the runner run, resume and stay out of the traces? | **In the persistence process, under a lock per application, after checking the state record; it copies the Migration into the record, runs and records one step at a time with its writes marked, and resumes at the first step not recorded** | G2, G3 |

### 3.1 Narrowings of epic decisions, for sign-off

| # | Epic decision | Narrowed to | Where |
|---|---|---|---|
| N1 | D6: the restore (`restoreApplicationVersion`) is item 9's | #9 builds the rewrite under it; the creation of a following deployment uses it to install a version, without the Q31 check | D2, D6 |
| N2 | D2: "Where the store has transactions (SQL), the step's writes and its record commit together" | not in #9: every step is repeatable, which covers a stop between the two writes on every store | D8 |
| N3 | D2: fill steps read removed columns "through a raw store read" | not in #9: a step reads what the model of its phase declares; a step that needs a removed attribute goes to #215 | D3 |
| N4 | Q10: "a data migration script is a `CompositeActionSequence`" | a Migration is a list of steps per phase, each a `CompositeActionSequence` | D3 |
| N5 | D2: storage creation idempotent on every store, add-only reconciliation after the jump and after any Entity row change | set aside by the user; the jump changes storage only through existing model actions (D2) | D2 |

### D1. How is #9 delivered: one PR, or several?

**Status:** proposed — D1-b. **Serves:** all.

**What is at stake.** #9 touches the Admin model, the Miroir model, core's DomainController and the versioning package. #708 showed that a PR per part keeps each reviewable and lets the format land before the code that uses it.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D1-a. One PR | everything on one branch | one review | large; nothing lands until the runner works |
| **D1-b. Three parts** ★ | **A** formats and roles: the `Migration` Entity (D3), the `role` of a Deployment and the `DeploymentState` Entity (D5, D6), the gate on following deployments, `applyModelState` and the creation of a following deployment at a version (D2). **B** generation (D7). **C** the runner and the jump (D8). | each part reviewable | three PRs |

Order: A, B, C. #9 closes with C.

### D2. Without Git, what does the runner's jump call, when the restore action is #709's?

**Status:** proposed — D2-a. **Narrows:** epic D6 (N1) and, by the user's choice, epic D2's storage rules (N5). **Serves:** G2.

**What is at stake.** Library's test deployment is at `1.0.0` and follows. The runner must bring its model to `1.1.0` between the expand and fill steps (epic D2-d). Without Git, only a rewrite of the live model from the `1.1.0` snapshot does that, and epic D6 gives that rewrite, as `restoreApplicationVersion`, to #709, which comes after #9. A new test deployment also needs its model installed at a version when it is created.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. #9 builds the rewrite, #709 the action** ★ | `applyModelState(host, application, target)` in the versioning package (below) | the runner is complete without Git; one rewrite for every caller; #709 shrinks | #9 grows by one function; the rewrite has no operator UI until #709 |
| D2-b. Swap the epic order: #709 before #9 | the restore lands first | follows epic D6 literally | #709's Q31 check reads the state record and the migrations, which #9 creates: a cycle |
| D2-c. The runner jumps with Git only in #9 | `versioned-internal` runs wait for #709 | smaller #9 | experiment E1 (`versioned-internal`) cannot run a migration; G2 half met |

**Decision:** D2-a. `applyModelState`:
- **Touches** only the application's own model rows (legend), in the `model` section. It never touches `modelVersion`, the application's SelfApplication, branch and version rows, nor the meta-model Entity rows (`EvolutionTraceRecord`, `Migration`, the history Entities), so a following deployment keeps reading records and Migrations.
- **Changes Entities through existing model actions,** so that their storage follows as it does when a designer runs them: `createEntity` for an Entity the target adds, `alterEntityAttribute` with `addColumns` for an attribute the target adds. Removed Entities and attributes are left in storage for the contract phase (D4); the Entity row itself is written to its target value after its `alterEntityAttribute`, so that on SQL `sync({ alter: true })` sees the old and the new attributes together and drops no column. Other rows (Reports, Queries, Menus…) are upserted, and the rows absent from the target are deleted.
- **Keeps** the live value of `parentDefinitionVersionUuid` and `conceptLevel` on rows it updates, since a frozen row does not hold them (`liveRowOfVersion`, `modelStates.ts`).
- **Runs** only on a following deployment, with its writes marked as the run's (D6, D8), outside any Miroir transaction, and is refused while one is open, as the Git checkout is (679 D7).
- **Reloads** the application's model afterwards (`loadConfigurationFromPersistenceStore`, as after a checkout, #681).

### D3. What does a `Migration` row hold?

**Status:** proposed — D3-b. **Narrows:** Q10 (N4) and epic D2's raw read (N3). **Serves:** G1, G2, G3.

**What is at stake.** Library's migration from `1.0.0` to `1.1.0` has, per epic section 5.1, no expand step, a jump, one fill step computing `Book.isbn`, and no contract step. The runner must record each step as it finishes to resume (G3), the designer must see which steps break rollback (epic D1), and Q31 must read whether the whole migration is backward-compatible. A single `CompositeActionSequence` has no place for a flag per step, and its children carry no stable id to record.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D3-a. One `CompositeActionSequence` (Q10 literally) | the jump is a pseudo-action inside it; the runner records the index of each top-level action | Q10 as written | flags per step need a side table; an index shifts when the designer inserts a step during a stopped run |
| **D3-b. A list of steps per phase** ★ | see below | each step has a stable id, its flags and its own sequence; Q31 reads `backwardCompatible` on the row | the script is no longer one runnable action |

The row (Entity `Migration`, new uuid; an Entity file in `miroir-app-miroir`, an entry in `metaModelEntityList` so that `versionHistoryEntityUuids` routes it to `modelVersion`, and a `migrations` collection in `MetaModel` per #708 D7-a, so core's types are regenerated):

| Attribute | Type | Meaning |
|---|---|---|
| `application` | uuid | the application migrated |
| `from`, `to` | string | version names (epic D10): the `SelfApplicationVersion` name, or the Git tag; always set |
| `source` | `traces` \| `diff` \| `manual` | where the changes came from (D7); `diff` shows on the draft as "traces were off"; `manual` for a Migration written by hand |
| `changes` | array | the structure changes found by generation, each `{ kind, entity, attribute?, backwardCompatible, supported, note? }`, kinds `addEntity`, `removeEntity`, `renameEntity`, `changeIdAttribute`, `addAttribute`, `removeAttribute`, `changeAttribute`. Information and classification: the jump applies them. |
| `expand`, `fill`, `contract` | arrays of steps | each `{ uuid, name, backwardCompatible, repeatable, action: CompositeActionSequence }` |
| `backwardCompatible` | boolean | the conjunction over the changes and the steps; generation sets it, the runner recomputes it before running (epic D1) |
| `generatedAt`, `description` | | |

A step reads and writes what the model of its phase declares: the `from` model in expand, the `to` model in fill and contract. A step that needs an attribute the target removed has no place yet (N3, #215).

The Migration is the edge between two versions. The `SelfApplicationVersion` row already has two attributes for that edge, `modelStructureMigration` (always `[]`, `applicationVersionFreeze.ts`, line 677) and `modelCUDMigration` (the Entities-only diff from the previous version, `modelCudMigrationCandidates`). #9 leaves them as they are; once Migrations exist, removing them is a follow-up, so that the edge has one home.

### D4. What does a contract step run?

**Status:** **Accepted — D4-b** (user, 2026-11-15). **Serves:** G2.

**What is at stake.** Library `1.2.0` removes `Book.isbn`. After the jump, the model has no `isbn`, but the storage still holds it: the SQL `Book` table keeps the column, and the filesystem `Book` files keep the attribute. The contract phase removes it, explicitly, so that a rollback before it stays possible (epic D2).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D4-a. Typed drops | a contract step is `{ kind: dropEntityStorage \| dropAttributeStorage, entity, attribute? }`, run through new store-section methods | the drops exist on every store | a second step shape; storage code for one case |
| **D4-b. A `CompositeActionSequence`** ★ | a contract step has the shape of the other steps; it runs Actions | one step shape; the designer writes any contraction the Actions allow | some contractions have no Action yet (below) |

**Decision:** D4-b. Generation writes one contract step per `removeEntity` and `removeAttribute` change. Today no Action drops storage once the model no longer declares it: after the jump, `dropEntity` finds no Entity row, SQL drops only a table it has registered (`SqlDbStoreSection.dropStorageSpaceForInstancesOfEntity`), and `alterEntityAttribute` with `removeColumns` rewrites the Entity row and leaves the attribute in the stored documents of the filesystem, IndexedDB and MongoDB stores. Generation therefore writes these steps with an empty `actionSequence` and a name that says what they must drop (`drop Book.isbn`), and the runner runs them as they are. #733 adds the Actions; generation then fills the steps.

### D5. Where is the deployment state record, what does it hold, and how does it compare with the Application Version?

**Status:** proposed — D5-a. **Serves:** G3, G4.

**What is at stake.** An operator opens Library's test deployment and must see that its data is at `1.0.0` and that the `1.0.0 → 1.1.0` migration stopped after its expand steps. Q22 puts this in Admin data, keyed by Deployment uuid. The risk, raised by the user, is that the record becomes a second Application Version: a second place that says what a model is.

The two compared:

| | Application Version (`SelfApplicationVersion`, Miroir model, `modelVersion` section) | Deployment state (`DeploymentState`, Admin data) |
|---|---|---|
| What it describes | a state of the application's model | the position of one deployment's data among those states |
| One row per | version of the application | deployment |
| Identity of a version | its `name` (and uuid) | `version`: that same name (epic D10), never a copy |
| Model content | the `*Version` rows linked by the Cross Entities | none |
| History | `previousVersion`, one link per version | `applied`: the Migrations run, each naming its `from` and `to` versions |
| Edge between two versions | `modelStructureMigration`, `modelCUDMigration` (D3) | none: it names the Migration |
| Written by | the freeze, on the authoring deployment | the runner and the creation of a following deployment |
| Changes | never once frozen | at each step of a run |

So the record re-implements none of the Application Version: it points at versions by name and at Migrations by uuid. The two are comparable through the version name: the deployment's `version` is the `name` of a `SelfApplicationVersion` of its application (or a tag), and the Versioning report can show, next to each version, the deployments whose data is at it.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. New Admin Entity `DeploymentState`** ★ | one row per Deployment, its uuid the Deployment's: `deployment`, `application`, `version` (a version name, absent when unknown), `gitCommit` (information, epic D10), `applied` (`{ migration, from, to, finishedAt }[]`), `run` (absent, or `{ migration: <full copy of the Migration row>, stepsDone: string[], startedAt }`) | it changes at each step, apart from the Deployment row, which holds configuration | a new Admin Entity |
| D5-b. Attributes on `Deployment` | the same fields on the Deployment row | no new Entity | the progress of a run, written at every step, would be mixed with configuration that environments and the clone installer write |
| D5-c. Reuse the Admin `ApplicationVersion` (`ff3d211b-7eb6-473a-afbf-503bb70a5c26`) | | no new uuid | a 2024 leftover nothing reads, shaped as a version, not as a position |

**Decision:** D5-a. The run's copy of the Migration is the one copy of model-related content in the record, and it exists only while a run is in progress (D8). An authoring deployment has no row. The Entity is created in the Admin model when absent, as `ensureRecordEntity` does for the record Entity, so existing Admin stores need no reset.

### D6. What makes a deployment following, and what does following forbid?

**Status:** **Accepted — role on the Deployment** (user, 2026-11-15: "have an attribute on the Deployment itself, chosen upon creation and not modifiable afterwards"). **Serves:** G2, G4.

**What is at stake.** Library's SelfApplication row has `evolutionTraces` on. It is model, so the test deployment has traces on too. If the test deployment recorded its migration's jump as a commit record in the shared `modelVersion`, it would break the dev deployment's chain (epic D5). If a tester edited the test deployment's model, the next migration would start from a model no version describes.

- **The role.** The Admin `Deployment` Entity (`7959d814-400c-4e80-988f-a00fe582ab98`) gains `role`: `authoring` (the default, and every deployment of today) or `following`. It is set when the deployment is created (`createDeploymentCompositeAction`, `1_core/Deployment.ts`, and the deployment Runners) and an update of a Deployment row that changes it is refused.
- **Creating a following deployment** names the version it starts at. Its model is installed from that version (`applyModelState`, D2, for `versioned-internal`; the clone checked out at the tag for `versioned-git`), and its `DeploymentState` row is written with that `version`. Its data is then loaded by the operator (fixtures, an import).
  - *Realization (A1):* the stores are not empty when the install runs. A frozen version holds no SelfApplication or branch row (`frozenStateOf` takes them from the live model), so an empty deployment cannot be installed from `modelVersion` alone. The following deployment is created from the application's package (its model and data files, `skipCreateStore`, as #683 deploys a clone), then `installApplicationVersion` (a new server-routed Model Endpoint action of the versioning package) rewrites its model to the version. `createDeploymentCompositeAction` takes `role` and `installVersion` and ends with that action. The install also creates the history and record Entities in the following deployment's model, so that it reads the shared `modelVersion`.
- **The gate**, in the persistence process: before a write to the application's `model` or `modelVersion` section, the DomainController there reads the role from the Deployment row and refuses when it is `following`, unless the write carries the mark of a migration run (D8). It covers commits, direct writes, and the writes a remote client sends, which reach the server marked `markRecordedBySender` (`RestServer.ts`); a client refuses early from its cached Deployment row as a convenience. `freezeApplicationVersion`, `rebaselineEvolutionTraces`, `appendEvolutionTraceRecord` and `generateMigration` refuse on a following deployment.
- **No traces**: a following deployment records nothing (`applicationsWithEvolutionTraces` leaves it out), so a run is never traced.
- **The mark**: a symbol-keyed property on the action, as `RECORDED_BY_SENDER` is (`evolutionTraceRecording.ts`), set by the runner and the rewrite on the writes they send to `model` and `modelVersion`. It lives only in the persistence process, where they run, and is dropped by JSON.

Epic section 9's experiment switched one deployment from authoring to following. With the role fixed at creation, the experiment (and #9's tests) creates a second deployment of the application as following, at the earlier version, sharing the `modelVersion` folder of the first (#710 owns the real two-process setup).

### D7. How does generation find the structure changes and the steps?

**Status:** proposed — follows epic D12-b. **Serves:** G1.

`generateMigration { application, from, to }`, a Model Endpoint action of the versioning package (`requiredCapability: versioning`), server-routed, runs in the persistence process of an authoring deployment and writes the draft `Migration` into `modelVersion`. For `versioned-git`, `to` names the tag the designer will create: the target state is `HEAD`, and the designer commits the Migration and then tags `to` (epic section 5.2). A `versioned-git` application needs a `modelVersion` section for generation, traces on or off (#708 D6 fetches it only with traces on); generation is refused without one.

1. **States.** `versioned-internal`: `frozenModelState` of each version, the name resolved to the `SelfApplicationVersion` of that name. `versioned-git`: `gitModelState` at the tag `from` and at `HEAD`.
2. **Records.** `versioned-internal`: the records after the marker of `from` (a `version` or `rebaseline` marker naming its uuid) up to the marker of `to`. `versioned-git`: the records in `modelVersion` at `HEAD` that are not at the tag. A `rebaseline` marker among them refuses generation: the model was corrected outside Miroir there, and Q30 says generation does not cross it; the designer writes that migration by hand. With no records (traces off, or no marker for `from`), go to step 5.
3. **Agreement (Q29).** Replay the `commit` records on the `from` state (`replayCommitRecords`) and compare with the `to` state over `AGREEMENT_COLLECTIONS`, the meta-model Entities left out as `comparedCollections` does (`metaModelEntityUuids`, `evolutionTraceAgreement.ts`). A difference refuses generation and lists it, as the freeze does (`EVOLUTION_TRACES_DISAGREE`).
4. **Changes from records** (`source: traces`). Walk the records in order on a running state. A `createEntity`, `dropEntity`, `renameEntity` or `alterEntityAttribute` gives its changes. An instance write of an Entity row gives `addEntity` or `removeEntity`, or, from the row before (the running state) and after (the write): `renameEntity` when `name` changed, `changeIdAttribute` when `idAttribute` changed, and attribute changes by name in `mlSchema.definition`. Successive changes of one attribute fold into one (an add then a remove gives nothing). The folded changes applied to the `from` Entities must give the `to` Entities' names, attribute names and definitions; otherwise generation uses step 5 and says why on the draft.
5. **Changes from the diff** (`source: diff`). `diffModelStates` of the two states, Entities only: attributes by name (`EntityAttributesDiff`), and `name` and `idAttribute` from the changed rows (as `modelCudMigrationCandidates` reads names).
6. **Classification (epic D1).** Backward-compatible: `addEntity`, `addAttribute` of an optional attribute. Not backward-compatible: `addAttribute` of a required attribute, `removeEntity`, `removeAttribute`, `changeAttribute` that makes an attribute required or changes its type, `renameEntity`, `changeIdAttribute`. Changes of other element types (Reports, Queries, Menus…) have no storage effect and are not listed.
7. **Steps.** One empty fill step per `addAttribute` (`repeatable: true`, `backwardCompatible: true`); one contract step per `removeEntity` and `removeAttribute`, empty until #733 (D4); none for expand.
8. **Unsupported.** `renameEntity` and `changeIdAttribute` are listed with `supported: false`: SQL names the table after the Entity (`SqlDbStoreSection.ts`, around line 195), and the jump's existing actions do not move the data to a renamed table. The runner refuses a migration holding an unsupported change; #215 or a follow-up handles renames.

A Migration for the same `application`, `from` and `to` already in `modelVersion` refuses generation, unless the payload asks to replace it. A Migration written by hand (`source: manual`), with the generic instance editor of the `Migration` Entity, is valid input for the runner: it covers a re-baseline and any case generation refuses.

### D8. How does the runner run, resume and stay out of the traces?

**Status:** proposed. **Narrows:** epic D2's transaction rule (N2). **Serves:** G2, G3.

`runMigration { application, migration }` (the Migration's uuid), a Model Endpoint action of the versioning package (`requiredCapability: versioning`), server-routed, runs in the persistence process under the lock of the application (`withApplicationLock` pattern, `evolutionTraceRecords.ts`), so two runs never interleave:

1. **Checks.** The Deployment's `role` is `following`; without a `run`, the `DeploymentState` `version` equals the Migration's `from`; with a `run`, the run's migration is the one asked for (resume). The Migration holds no unsupported change (D7, step 8). No Miroir transaction is open.
2. **Find.** `versioned-internal`: the Migration row in `modelVersion`. `versioned-git`: the Migration file at tag `to` in the `modelVersion` folder, read without a checkout (`GitRepositoryInterface.readFile(path, ref)`), since the follower's checkout is at `from`, where the file does not exist yet.
3. **Copy.** A new run writes `run: { migration: <copy>, stepsDone: [], startedAt }` before its first step. A resumed run uses the copy, whatever the `modelVersion` section or the checkout now holds (epic D2).
4. **Steps,** in order expand, jump, fill, contract, skipping those in `stepsDone`; after each one, `stepsDone` gains its uuid (the jump's is `jump`). Each step runs its `CompositeActionSequence` through `host.handleCompositeAction` on the application, its writes to `model` and `modelVersion` marked as the run's (D6).
   - the jump, `versioned-internal`: `applyModelState` with the `to` state (D2);
   - the jump, `versioned-git`: `gitAction_checkout` of the tag `to`, which reloads the model (#681). The checkout refuses a dirty work tree, so the data section must be outside the clone (epic D7); #9's Git test configures it so, and #710 brings the installer change. With Git, storage follows the checkout only where the store needs no change (the filesystem); a SQL data section is part of the storage divergence set aside (section 1).
5. **End.** `version` becomes `to`, the run moves to `applied`, `run` is removed.

A stop leaves `run` in place; running the same migration again resumes. A stop inside the jump resumes the jump: the rewrite writes the same rows again (`createEntity` and `alterEntityAttribute` are skipped for Entities and attributes already present), and the checkout of a tag already checked out does nothing. Since a step can stop after its writes and before its record, every step is repeatable (epic D2): generated steps are written that way, and the designer declares it for steps they write. The step and its record are not committed together in one SQL transaction (N2): the step's writes go to the `data` section, the record to the Admin store, which may be another store or schema.

---

## 4. Current state

### 4.1 Aligned

| Piece | Where | State |
|---|---|---|
| Trace records in `modelVersion`, one per commit, `version` and `rebaseline` markers (by version uuid) | `EvolutionTraceRecord` `854c47bd-…`; `evolutionTraceRecords.ts`; `appendVersionMarker` (`freezeApplicationVersion.ts`) | ✅ #708 A |
| Model states: live, frozen, at a Git ref, from files; replay of commit records | `liveModelState`, `frozenModelState`, `frozenStateOf`, `gitModelState`, `modelStateFromFiles`, `replayEvolutionTraceRecords`, `replayCommitRecords` (`modelStates.ts`) | ✅ #708 B |
| Diff of two states, Entities by attribute; Entity names in the version's CUD migration | `diffModelStates`, `EntityAttributesDiff`, `modelCudMigrationCandidates` (`modelStateDiff.ts`) | ✅ #708 B |
| Agreement check, refusal reason, compared collections, meta-model filter | `checkEvolutionTraceAgreement`, `EVOLUTION_TRACES_DISAGREE`, `AGREEMENT_COLLECTIONS`, `comparedCollections` (`evolutionTraceAgreement.ts`) | ✅ #708 C |
| Git tag; checkout of a tag with reload; a file at a ref | `gitAction_tag`, `gitAction_checkout`, `loadConfigurationFromPersistenceStore`, `GitRepositoryInterface.readFile(path, ref)` | ✅ #708 D, #681 |
| Lazy Model Endpoint actions of the package, run where the stores are | `actionImplementations` (`miroir-versioning/src/index.ts`), `VERSIONING_ACTION_IMPLEMENTATION_NAMES`, `requiredCapability: versioning` on ModelEndpoint `7947ae40-eb34-4149-887b-15a9021e714e`, `SERVER_ROUTED_MIROIR_ACTION_TYPES` | ✅ #696, #708 |
| History Entities routed to `modelVersion` | `metaModelEntityList`, `versionHistoryEntityUuids` (`1_core/Model.ts`) | ✅ #232 |
| A meta-model Entity created in the application's model when absent | `ensureRecordEntity` (`evolutionTraceRecords.ts`) | ✅ #708; the Migration and state Entities follow it |
| A mark that keeps a write out of the traces | `markRecordedBySender` (`1_core/versioning/evolutionTraceRecording.ts`), set by `RestServer` | ✅ #708; D6's run mark follows it |
| Model actions that change storage with the model | `createEntity`, `alterEntityAttribute` (`addColumns`) | ✅; the jump uses them (D2) |
| Deployment creation | `createDeploymentCompositeAction` (`1_core/Deployment.ts`), Create Application and Deploy Existing Application Runners | ✅; gains the role (D6) |

### 4.2 Misaligned or missing

| Gap | Where | Part |
|---|---|---|
| No `Migration` Entity; the edge between versions is two placeholder attributes of `SelfApplicationVersion` | `applicationVersionFreeze.ts` (`modelStructureMigration: []`, `modelCUDMigration`) | A (Entity); removal of the attributes is a follow-up (D3) |
| No `role` on Deployment, no `DeploymentState` Entity, no gate on a following deployment | Admin model, `DomainController.ts` | A |
| No rewrite of the live model from a state | — | A |
| No generation | `modelStateDiff.ts` | B |
| No runner | — | C |
| No Action drops storage once the model no longer declares it | `dropEntity`, `alterEntityAttribute`, `SqlDbStoreSection.dropStorageSpaceForInstancesOfEntity` | #733 |
| Model and storage can diverge (an Entity row edited as an instance changes no SQL column; a new Entity saved as a row gets no storage) | `PersistenceStoreController.upsertInstance`, #715's test | set aside (section 1) |

## 5. Key reuse

| Piece | Location |
|---|---|
| Model states, replay, diff, agreement | `@miroir-framework/versioning` (`modelStates.ts`, `modelStateDiff.ts`, `evolutionTraceAgreement.ts`) |
| Lazy, capability-gated Model Endpoint actions run in the persistence process | `registerLazyActionImplementations`, `forwardServerRoutedAction`, `SERVER_ROUTED_MIROIR_ACTION_TYPES` (#696) |
| Reading a section; instance and model writes; composite runs; Git actions from the package | `DomainControllerActionHost` (`readSectionInstances`, `handleInstanceAction`, `handleModelAction`, `handleCompositeAction`, `handleGitAction`) |
| Lock per application | `withApplicationLock` (`evolutionTraceRecords.ts`) |
| Meta-model Entity created when absent | `ensureRecordEntity` (`evolutionTraceRecords.ts`) |
| Symbol mark on an action | `markRecordedBySender`, `isRecordedBySender` (`evolutionTraceRecording.ts`) |
| Deployment creation | `createDeploymentCompositeAction` (`1_core/Deployment.ts`) |
| Versioning integration tests on the filesystem store | `packages/miroir-standalone-app/tests/3_controllers/versioning/`, nonreg steps `integ-708-*` |

## Next step

`tdd-implementation-plan.md` in this folder, per `miroir-analysis-to-tdd-plan`: part A, then B and C.
