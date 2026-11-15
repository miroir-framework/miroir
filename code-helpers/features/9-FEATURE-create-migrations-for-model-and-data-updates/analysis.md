# 9 — Migrations between model versions: generation, runner and deployment state record

> A designer gets a draft data migration between two versions of an application's model and edits it; an operator moves a following deployment from one version to a later one and sees where its data stands. This analysis decides how #9 builds the `Migration` Entity, its generation from trace records and model diffs, the resumable runner with its expand, jump, fill and contract phases, the idempotent storage creation and add-only reconciliation on every store, and the deployment state record with its authoring and following roles.

Related issue: https://github.com/miroir-framework/miroir/issues/9
Parent issue: [#694](https://github.com/miroir-framework/miroir/issues/694), item 7 · Prerequisites: #696 ✅ (versioning package), #708 ✅ (trace records, `ModelStateSource`, replay, diff, agreement check, `gitAction_tag`)
Related analyses: [694 epic analysis](../694-EPIC-safe-application-evolution/analysis.md) (sections 4 to 9: D1, D2, D5, D6, D10, D12), [694 decisions](../694-EPIC-safe-application-evolution/decisions.md) (Q10, Q21 to Q23, Q29 to Q31), [708 trace revival](../708-FEATURE-trace-revival-model-states/analysis.md), [696 versioning package](../696-REFACTOR-versioning-package/analysis.md). The 2024 documents of this folder ([WP1](wp1-analysis-model-evolution-trace.md), [WP2](wp2-analysis-application-version-migrations.md)) are superseded by the epic; WP2's "migration tape" became the trace records of #708.
Key sources: [`modelStates.ts`](../../../packages/miroir-versioning/src/modelStates.ts), [`modelStateDiff.ts`](../../../packages/miroir-versioning/src/modelStateDiff.ts), [`evolutionTraceAgreement.ts`](../../../packages/miroir-versioning/src/evolutionTraceAgreement.ts), [`evolutionTraceRecords.ts`](../../../packages/miroir-versioning/src/evolutionTraceRecords.ts), [`freezeApplicationVersion.ts`](../../../packages/miroir-versioning/src/freezeApplicationVersion.ts), [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts), [`DomainControllerActionHost.ts`](../../../packages/miroir-core/src/0_interfaces/3_controllers/DomainControllerActionHost.ts), [`PersistenceStoreController.ts`](../../../packages/miroir-core/src/4_services/PersistenceStoreController.ts), [`PersistenceStoreControllerInterface.ts`](../../../packages/miroir-core/src/0_interfaces/4-services/PersistenceStoreControllerInterface.ts), [`ModelInitializer.ts`](../../../packages/miroir-core/src/3_controllers/ModelInitializer.ts), [`SqlDbStoreSection.ts`](../../../packages/miroir-store-postgres/src/4_services/SqlDbStoreSection.ts), [`sqlDbEntityStoreSectionMixin.ts`](../../../packages/miroir-store-postgres/src/4_services/sqlDbEntityStoreSectionMixin.ts), [`IndexedDbStoreSection.ts`](../../../packages/miroir-store-indexedDb/src/4_services/IndexedDbStoreSection.ts), [`MongoDbStoreSection.ts`](../../../packages/miroir-store-mongodb/src/4_services/MongoDbStoreSection.ts), [`FileSystemStoreSection.ts`](../../../packages/miroir-store-filesystem/src/4_services/FileSystemStoreSection.ts)

**Document role:** analysis and decision record for #9. The epic's decisions (Q10, Q21 to Q23, Q29 to Q31, D1, D2, D5, D10, D12) are settled and not reopened. This document decides how to build them. Where one of its decisions narrows an epic decision, it says so in a **Narrows** line; section 3.1 lists those for the user's sign-off.
**Status:** proposed (2026-11-15), for the user's review.
**Document history:**
- 2026-11-15: first draft, then an adversarial review (a fact check of sections 3 and 4 and an attack on each decision). It changed:
  - D2: the model rewrite touches only the application's own model rows, in the `model` section, and never `modelVersion` or the meta-model Entity rows; `setDeploymentRole` uses it to put a following deployment at its version;
  - D4: a drop carries the Entity row from the `from` state, since after the jump and a restart the store no longer knows the table;
  - D5 and D6: the gate runs in the persistence process on every model write, reading the stored state record, and the client reloads Admin after a role change or a run; the actions are server-routed;
  - D7: a rename or an `idAttribute` change in the Entity editor is detected; a `rebaseline` between the two versions refuses generation (Q30); a hand-written Migration is allowed; a required attribute added is not backward-compatible; `to` is always a version name, with Git too;
  - D8: the run is marked on its actions (no process-wide scope) and locked per application; with Git, the runner reads the Migration at tag `to`;
  - D9: reconciliation is a store management action, called by the DomainController for application Entity rows only (never at init), and redefines the SQL model; columns are added nullable;
  - D10 (new): how the package reaches the store sections;
  - two narrowings of epic D2 are now flagged (the SQL transaction, the raw read of removed attributes).
- 2026-11-15, after the review of the TDD plan: D9's stake corrected (the IndexedDB and MongoDB `createEntity` already skip existing storage; the emptying is in the store method that a reconciliation must not call); `setDeploymentRole` on a `versioned-git` deployment brings the model to a version by a checkout of its tag, never by rewriting files (D6).

### Sequencing

| Epic item | Issue | State |
|---|---|---|
| 5 | #696 versioning package and process capability | ✅ |
| 6 | #708 trace records, model states, agreement check, Git tag | ✅ (PRs #727, #730, #731) |
| 7 | **#9 migrations, generation, runner, state record** | **this** |
| 8 | #215 paired data migrations, composite rename | after 7 |
| 9 | #709 restore and rollback | after 7 (builds on the model rewrite and the reconciliation, D2 here) |
| 10 | #710 the two experiments | after 6, 7 and 9 |
| 11 | #718 switching versioning modes | beside, lands before 9 and 10 |

---

## 1. Goals

From the epic's goals G2 (prepare a migration), G3 (bring a test deployment forward) and G4 (know where a deployment stands), restated for this item:

- **G1 — Get a draft migration.** In order to move existing data to a new model without writing it all by hand, as an application designer, I can ask for a draft migration between two versions of my application, read what changed and which changes are not backward-compatible, and edit its data steps; I can also write a migration by hand where no draft can be made.
- **G2 — Move a test deployment forward.** In order to try a new model on realistic data, as an operator of a test deployment, I can run a migration on it, and its model and its storage reach the target version while its data is kept and transformed.
- **G3 — Survive a stopped run.** In order to trust a migration on real data, as an operator, I can run a migration again after it stopped part way, and it resumes where it stopped and ends in the same state as an uninterrupted run.
- **G4 — Know where a deployment stands.** In order to know which migrations still have to run, as an operator, I can see the version a deployment's data is at, whether it authors the model or follows it, and the migrations that ran on it.
- **G5 — Keep storage in step with the model.** In order not to lose data or meet a missing column, as an application designer, when I change one of my application's Entities in the Entity editor or a migration jumps the model, the storage of the Entity gains what the model now declares and keeps what it had.

## 2. Non-goals

- Paired data migrations, the composite `renameEntityAttribute` Action, trace entries that keep a composite (#215, epic item 8), and fill steps that read an attribute the target model removed (narrowing N3, section 3.1). Until then the designer edits the draft by hand.
- The `restoreApplicationVersion` action of an operator, with its Q31 check, the open-traces rule, the re-baseline marker on the authoring deployment and its UI (#709, epic item 9). #9 builds the model rewrite under it (D2).
- Two processes sharing one `modelVersion` storage (epic D5-a in a real setup) and the clone installer that puts data outside the work tree (epic D7): #710 (item 10). #9 tests play the following deployment with the same deployment, as epic section 9 does, and its Git test configures the data section outside the clone itself.
- Release packages without Git (epic D9, deferred).
- Running a migration on the authoring deployment. Its model is already at the target version; its data follows the designer's live edits.
- Tightening a column added nullable to `NOT NULL` once filled. Reconciliation adds every column nullable (D9); the model still says the attribute is required, and Miroir validates it. A follow-up if the experiments need it.
- Committing a data step and its state-record update in one SQL transaction (narrowing N2, section 3.1).
- Store backups (epic non-goal, Q31 (c)).

## 3. Decision record

Legend:
- **`versioned-internal`**: the model lives in the `model` section of any store but `bundled`; a version is a frozen `SelfApplicationVersion` (Entity `c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24`) with its `*Version` rows in the `modelVersion` section. No Git.
- **`versioned-git`**: the model lives in the `model` section on the filesystem, inside a Git work tree; a version is a Git tag (`gitAction_tag`, #708); a `modelVersion` folder committed with the model holds trace records and, after #9, Migrations.
- A **record** is an evolution trace record (Entity `EvolutionTraceRecord`, `854c47bd-af74-4305-bdea-aa6bddfa8899`, #708). Its `version` marker names the version by the **uuid** of its `SelfApplicationVersion` (`appendVersionMarker`, `freezeApplicationVersion.ts`, line 467), not by name.
- The **authoring** deployment is the one designers edit; a **following** deployment runs migrations and never writes to `modelVersion` (epic D5).
- The **phases** of a migration are expand (data steps on the starting model), jump (the model goes to the target version, then the storage is reconciled add-only), fill (data steps on the target model) and contract (explicit storage drops) (epic D2-d).
- **Add-only reconciliation**: the storage of an Entity gains the storage space and the columns the model declares and lacks; nothing existing is dropped or altered (epic D2).
- The **application's own model rows**: the rows of the collections a freeze snapshots (`AGREEMENT_COLLECTIONS`, `evolutionTraceAgreement.ts`), in the `model` section, without the meta-model Entities that an application's model holds (the `metaModelEntityUuids` filter of `selectEntitiesToFreeze`, `applicationVersionFreeze.ts`). The `EvolutionTraceRecord` and `Migration` Entity rows are meta-model Entities, so they are not among them.
- The **persistence process** is the process that holds the stores: the server, Electron's main process, the CLI, or an emulated server in tests.

| Decision | Choice | Serves |
|---|---|---|
| D1. How is #9 delivered: one PR, or several? | **Four parts, each with its own PR: A storage, B Migration and state record, C generation, D runner** | all |
| D2. Without Git, what does the runner's jump call, when the restore action is #709's? | **#9 builds the model rewrite (`applyModelState`) of the application's own model rows; the runner and `setDeploymentRole` call it; #709 wraps it into the restore action** | G2 |
| D3. What does a `Migration` row hold? | **Its two version names, the structure changes found by generation, and three lists of steps (expand, fill, contract); each data step holds a `CompositeActionSequence` with its `backwardCompatible` and `repeatable` flags** | G1, G2, G3 |
| D4. What does a contract step run? | **A typed storage drop (`dropEntityStorage`, `dropAttributeStorage`) carrying the Entity row of the `from` state, run as a store management action** | G2 |
| D5. Where is the deployment state record, and what does it hold? | **An Admin Entity `DeploymentState`, one row per Deployment, its uuid the Deployment's** | G3, G4 |
| D6. What makes a deployment following, and what does following forbid? | **`setDeploymentRole`; the persistence process refuses model writes and `modelVersion` writes of a following deployment, unless they carry the mark of a migration run** | G2, G4 |
| D7. How does generation find the structure changes and the steps? | **Records between the two version markers (or added between the tag and `HEAD`), checked by replay against the target state, turned into changes and checked against the diff; the diff alone when there are no records; refused across a re-baseline** | G1 |
| D8. How does the runner run, resume and stay out of the traces? | **In the persistence process, under a lock per application, after checking the state record; it copies the Migration into the record, runs and records one step at a time with its actions marked, and resumes at the first step not recorded** | G2, G3 |
| D9. What does add-only reconciliation do on each store, and when does it run? | **An idempotent `createStorageSpaceForInstancesOfEntityIfMissing` on every store plus missing nullable SQL columns and a redefined SQL model; after the jump, and after a write of one of an application's own Entity rows** | G5 |
| D10. How does the versioning package reach the store sections? | **Two new store management actions, `storeManagementAction_reconcileEntityStorage` and `storeManagementAction_dropEntityStorage`, through `host.handleStoreManagementAction`** | G2, G5 |

### 3.1 Narrowings of epic decisions, for sign-off

| # | Epic decision | Narrowed to | Where |
|---|---|---|---|
| N1 | D6: the restore (`restoreApplicationVersion`) is item 9's | #9 builds the rewrite under it; `setDeploymentRole` uses it to put a following deployment at a version, without the Q31 check | D2, D6 |
| N2 | D2: "Where the store has transactions (SQL), the step's writes and its record commit together" | not in #9: every step is repeatable, which covers a stop between the two writes on every store | D8 |
| N3 | D2: fill steps read removed columns "through a raw store read" | not in #9: a fill step reads what the target model declares; a step that needs a removed attribute goes to #215 | D3, D9 |
| N4 | Q10: "a data migration script is a `CompositeActionSequence`" | a Migration is a list of steps, each data step a `CompositeActionSequence` | D3 |

### D1. How is #9 delivered: one PR, or several?

**Status:** proposed — D1-b. **Serves:** all.

**What is at stake.** #9 touches every store package, the Admin model, the Miroir model, core's DomainController, and the versioning package. #708 showed that a PR per part keeps each reviewable and lets the format land before the code that uses it.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D1-a. One PR | everything on one branch | one review | very large; the store changes wait for the runner |
| **D1-b. Four parts** ★ | **A** storage: `createStorageSpaceForInstancesOfEntityIfMissing` on every store, the two store management actions (D10), the reconciliation and its call after an Entity row write (D9). **B** formats and roles: the `Migration` Entity (D3, D4), the `DeploymentState` Entity (D5), `setDeploymentRole`, `applyModelState` and the following-deployment gate (D2, D6). **C** generation (D7). **D** the runner and the jump (D8). | each part reviewable; A is useful alone (#715's gap) | four PRs |

Order: A, then B, then C, then D. B needs A for the rewrite's reconciliation. #9 closes with D.

### D2. Without Git, what does the runner's jump call, when the restore action is #709's?

**Status:** proposed — D2-a. **Narrows:** epic D6 (N1). **Serves:** G2.

**What is at stake.** Library's test deployment is at `1.0.0` and follows. The runner must bring its model to `1.1.0` between the expand and fill steps (epic D2-d). Without Git, only a rewrite of the live model from the `1.1.0` snapshot does that, and epic D6 gives that rewrite, as `restoreApplicationVersion`, to #709, which comes after #9. Epic section 9's experiment also starts by putting the test deployment back at `1.0.0` before marking it as following, which needs the same rewrite.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. #9 builds the rewrite, #709 the action** ★ | `applyModelState(host, application, target, mark)` in the versioning package (below) | the runner is complete without Git; one rewrite for every caller; #709 shrinks | #9 grows by one function; the rewrite has no operator UI until #709 |
| D2-b. Swap the epic order: #709 before #9 | the restore lands first | follows epic D6 literally | #709's Q31 check reads the state record and the migrations, which #9 creates: a cycle |
| D2-c. The runner jumps with Git only in #9 | `versioned-internal` runs wait for #709 | smaller #9 | experiment E1 (`versioned-internal`) cannot run a migration; G2 half met |

**Decision:** D2-a. `applyModelState`:
- **Touches** only the application's own model rows (legend): for each collection of `AGREEMENT_COLLECTIONS`, it upserts the target's rows and deletes the live rows absent from the target, in the `model` section. It never touches `modelVersion`, the application's SelfApplication, branch and version rows, nor the meta-model Entity rows (`EvolutionTraceRecord`, `Migration`, the history Entities), so a follower keeps reading records and Migrations after a restart (SQL boots `modelVersion` from the Entity rows in `model`, `PersistenceStoreController.ts`, around line 648).
- **Keeps** the live value of `parentDefinitionVersionUuid` and `conceptLevel` on rows it updates, since a frozen row does not hold them (`liveRowOfVersion`, `modelStates.ts`).
- **Orders** its writes: Entity rows first, each followed by the reconciliation of its storage (D9), then the other rows; deletes last.
- **Runs** only on a following deployment, with its writes carrying the mark of the run (D6), outside any Miroir transaction, and is refused while one is open, as the Git checkout is (679 D7).
- **Reloads** the application's model afterwards (`loadConfigurationFromPersistenceStore`, as after a checkout, #681).

### D3. What does a `Migration` row hold?

**Status:** proposed — D3-b. **Narrows:** Q10 (N4). **Serves:** G1, G2, G3.

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
| `expand`, `fill` | array of data steps | each `{ uuid, name, backwardCompatible, repeatable, action: CompositeActionSequence }` |
| `contract` | array of drop steps | D4 |
| `backwardCompatible` | boolean | the conjunction over the changes and the steps; generation sets it, the runner recomputes it before running (epic D1) |
| `generatedAt`, `description` | | |

A data step reads and writes what the model of its phase declares: the `from` model in expand, the `to` model in fill. A step that needs an attribute the target removed has no place yet (N3, #215).

### D4. What does a contract step run?

**Status:** proposed — D4-a. **Serves:** G2.

**What is at stake.** Library `1.2.0` removes `Book.isbn`. After the jump, the model has no `isbn`, but the SQL `Book` table still has the column, because the reconciliation is add-only (D9). The contract step drops it. No Action drops a column alone: `alterEntityAttribute` with `removeColumns` also rewrites the Entity row, which the jump has already done, and `dropEntity` deletes the row too. And when the whole `Book` Entity is removed, the SQL store no longer knows its table after the jump and a restart: `dropStorageSpaceForInstancesOfEntity` drops only a registered table and otherwise returns `ACTION_OK` with a warning (`SqlDbStoreSection.ts`, around line 359), and boot registers only the Entities of the model.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Typed drops carrying the Entity row** ★ | a contract step is `{ uuid, kind: "dropEntityStorage" \| "dropAttributeStorage", entity: <the Entity row in the from state>, attribute? }`; the runner runs it as `storeManagementAction_dropEntityStorage` (D10). SQL drops the table or the column by the name the row gives; filesystem, IndexedDB and MongoDB drop the storage space, or remove the attribute from every stored instance. Idempotent. Never `backwardCompatible`. | works whatever the store has registered; no Action that touches the model; generated from the changes | a new store-section method |
| D4-b. Contract steps are `CompositeActionSequence`s with a new public storage Action | same drops | one step shape | a public Action that drops storage the model does not know about |

**Decision:** D4-a. Generation writes one drop step per `removeEntity` and `removeAttribute` change, with the Entity row from the `from` state; the designer may delete them to keep the storage.

### D5. Where is the deployment state record, and what does it hold?

**Status:** proposed — D5-a. **Serves:** G3, G4.

**What is at stake.** An operator opens Library's test deployment and must see that its data is at `1.0.0`, that it follows, and that the `1.0.0 → 1.1.0` migration stopped after its expand steps. Q22 puts this in Admin data, keyed by Deployment uuid. The Admin `Deployment` Entity (`7959d814-400c-4e80-988f-a00fe582ab98`) holds the configuration; the Admin `ApplicationVersion` Entity (`ff3d211b-7eb6-473a-afbf-503bb70a5c26`) is a 2024 leftover that no source under `packages/*/src` reads.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. New Admin Entity `DeploymentState`** ★ | one row per Deployment, its uuid the Deployment's: `deployment`, `application`, `role` (`authoring` \| `following`), `version` (a version name, absent when unknown), `gitCommit` (information, epic D10), `applied` (`{ migration, from, to, finishedAt }[]`), `run` (absent, or `{ migration: <full copy of the Migration row>, stepsDone: string[], startedAt }`) | one read gives everything; no change to `Deployment` | a new Admin Entity; existing Admin stores lack it |
| D5-b. Attributes on `Deployment` | same fields on the Deployment row | no new Entity | the Deployment row is configuration, rewritten by environments and the clone installer; a run's progress would mix with it |
| D5-c. Reuse Admin `ApplicationVersion` | | no new uuid | wrong shape and name |

**Decision:** D5-a. No row means authoring with an unknown version: every deployment of today keeps its behaviour. The row is written only by `setDeploymentRole` (D6) and the runner (D8), in the persistence process. The Entity is created in the Admin model when absent, as `ensureRecordEntity` does for the record Entity, so existing Admin stores need no reset.

### D6. What makes a deployment following, and what does following forbid?

**Status:** proposed — D6-a. **Narrows:** epic D6 through D2 (N1). **Serves:** G2, G4.

**What is at stake.** Library's SelfApplication row has `evolutionTraces` on. It is model, so the test deployment has traces on too. If the test deployment recorded its migration's jump as a commit record in the shared `modelVersion`, it would break the dev deployment's chain (epic D5). If a tester edited the test deployment's model, the next migration would start from a model no version describes.

- **`setDeploymentRole { application, role, version? }`**, a Model Endpoint action of the versioning package (`requiredCapability: versioning`), server-routed. It writes the `DeploymentState` row of the application's deployment.
  - `following` needs `version`. When the live model differs from that version, it brings the model there, the data untouched and the storage reconciled add-only: with `applyModelState` (D2) for `versioned-internal`, and for `versioned-git` by refusing unless the work tree is checked out at the tag of that version (the operator checks it out from the Git page), since rewriting model files would dirty the work tree and make the runner's checkout refuse. This is how a test deployment starts, and how epic section 9's experiment puts the deployment back at `1.0.0`. Refused while a Miroir transaction is open.
  - `authoring` keeps the history; the next freeze or Git commit of the deployment starts from its live model.
  - Both are refused while a run is in progress.
- **The gate**, in the persistence process: before a write to the application's `model` or `modelVersion` section, the DomainController there reads the `DeploymentState` row of the deployment from the Admin store (not the cache) and refuses when it says `following`, unless the write carries the run's mark. It covers commits, direct writes and the writes a remote client sends (which reach the server marked `markRecordedBySender`, `RestServer.ts`, so #708's `evolutionTraceRefusal` pattern, which runs only for applications with traces on, is not enough). A client refuses early from its cached row as a convenience, not as the guarantee. `freezeApplicationVersion`, `rebaselineEvolutionTraces`, `appendEvolutionTraceRecord` and `generateMigration` refuse on a following deployment.
- **No traces**: a following deployment records nothing (`applicationsWithEvolutionTraces` leaves it out), so a run is never traced.
- **The mark**: a symbol-keyed property on the action, as `RECORDED_BY_SENDER` is (`evolutionTraceRecording.ts`), set by the runner and the rewrite on the writes they send to `model` and `modelVersion`. It lives only in the persistence process, where they run, and is dropped by JSON. Data steps write `data`, which the gate does not cover, so the mark need not reach the children of a composite in #9; a step that writes the model through a composite would need that copy.
- **Client caches**: `setDeploymentRole` and `runMigration` are added to `SERVER_ROUTED_MIROIR_ACTION_TYPES` (`1_core/constants.ts`), and the client reloads the Admin deployment and the application after them (`forwardCapabilityAction` reloads only the application today).

### D7. How does generation find the structure changes and the steps?

**Status:** proposed — follows epic D12-b. **Serves:** G1.

`generateMigration { application, from, to }`, a Model Endpoint action of the versioning package (`requiredCapability: versioning`), server-routed, runs in the persistence process of an authoring deployment and writes the draft `Migration` into `modelVersion`. For `versioned-git`, `to` names the tag the designer will create: the target state is `HEAD`, and the designer commits the Migration and then tags `to` (epic section 5.2). A `versioned-git` application needs a `modelVersion` section for generation, traces on or off (#708 D6 fetches it only with traces on); generation is refused without one.

1. **States.** `versioned-internal`: `frozenModelState` of each version, the name resolved to the `SelfApplicationVersion` of that name. `versioned-git`: `gitModelState` at the tag `from` and at `HEAD`.
2. **Records.** `versioned-internal`: the records after the marker of `from` (a `version` or `rebaseline` marker naming its uuid) up to the marker of `to`. `versioned-git`: the records in `modelVersion` at `HEAD` that are not at the tag. A `rebaseline` marker among them refuses generation: the model was corrected outside Miroir there, and Q30 says generation does not cross it; the designer writes that migration by hand. With no records (traces off, or no marker for `from`), go to step 5.
3. **Agreement (Q29).** Replay the `commit` records on the `from` state (`replayCommitRecords`) and compare with the `to` state over `AGREEMENT_COLLECTIONS`, the meta-model Entities left out as `comparedCollections` does (`metaModelEntityUuids`, `evolutionTraceAgreement.ts`). A difference refuses generation and lists it, as the freeze does (`EVOLUTION_TRACES_DISAGREE`).
4. **Changes from records** (`source: traces`). Walk the records in order on a running state. A `createEntity`, `dropEntity`, `renameEntity` or `alterEntityAttribute` gives its changes. An instance write of an Entity row gives `addEntity` or `removeEntity`, or, from the row before (the running state) and after (the write): `renameEntity` when `name` changed, `changeIdAttribute` when `idAttribute` changed, and attribute changes by name in `mlSchema.definition`. Successive changes of one attribute fold into one (an add then a remove gives nothing). The folded changes applied to the `from` Entities must give the `to` Entities' names, attribute names and definitions; otherwise generation uses step 5 and says why on the draft.
5. **Changes from the diff** (`source: diff`). `diffModelStates` of the two states, Entities only: attributes by name (`EntityAttributesDiff`), and `name` and `idAttribute` from the changed rows (as `modelCudMigrationCandidates` reads names).
6. **Classification (epic D1).** Backward-compatible: `addEntity`, `addAttribute` of an optional attribute. Not backward-compatible: `addAttribute` of a required attribute, `removeEntity`, `removeAttribute`, `changeAttribute` that makes an attribute required or changes its type, `renameEntity`, `changeIdAttribute`. Changes of other element types (Reports, Queries, Menus…) have no storage effect and are not listed.
7. **Steps.** One empty fill step per `addAttribute` (`repeatable: true`, `backwardCompatible: true`), one drop step per `removeEntity` and `removeAttribute` (D4), none for expand.
8. **Unsupported.** `renameEntity` and `changeIdAttribute` are listed with `supported: false`: SQL names the table after the Entity (`SqlDbStoreSection.ts`, around line 195), so the add-only reconciliation would create a new empty table and orphan the data. The runner refuses a migration holding an unsupported change; #215 or a follow-up adds the storage rename.

A Migration for the same `application`, `from` and `to` already in `modelVersion` refuses generation, unless the payload asks to replace it. A Migration written by hand (`source: manual`), with the generic instance editor of the `Migration` Entity, is valid input for the runner: it covers a re-baseline and any case generation refuses.

### D8. How does the runner run, resume and stay out of the traces?

**Status:** proposed. **Narrows:** epic D2's transaction rule (N2). **Serves:** G2, G3.

`runMigration { application, migration }` (the Migration's uuid), a Model Endpoint action of the versioning package (`requiredCapability: versioning`), server-routed, runs in the persistence process under the lock of the application (`withApplicationLock` pattern, `evolutionTraceRecords.ts`), so two runs never interleave:

1. **Checks.** The `DeploymentState` row says `following`; without a `run`, its `version` equals the Migration's `from`; with a `run`, the run's migration is the one asked for (resume). The Migration holds no unsupported change (D7, step 8). No Miroir transaction is open.
2. **Find.** `versioned-internal`: the Migration row in `modelVersion`. `versioned-git`: the Migration file at tag `to` in the `modelVersion` folder, read without a checkout (`GitRepositoryInterface.readFile(path, ref)`), since the follower's checkout is at `from`, where the file does not exist yet.
3. **Copy.** A new run writes `run: { migration: <copy>, stepsDone: [], startedAt }` before its first step. A resumed run uses the copy, whatever the `modelVersion` section or the checkout now holds (epic D2).
4. **Steps,** in order expand, jump, fill, contract, skipping those in `stepsDone`; after each one, `stepsDone` gains its uuid (the jump's is `jump`). Every action carries the run's mark (D6).
   - a data step runs its `CompositeActionSequence` through `host.handleCompositeAction` on the application;
   - the jump, `versioned-internal`: `applyModelState` with the `to` state (D2);
   - the jump, `versioned-git`: `gitAction_checkout` of the tag `to`, which reloads the model (#681), then the reconciliation of every Entity of the target model (D9). The checkout refuses a dirty work tree, so the data section must be outside the clone (epic D7); #9's Git test configures it so, and #710 brings the installer change;
   - a contract step runs its drop (D4).
5. **End.** `version` becomes `to`, the run moves to `applied`, `run` is removed.

A stop leaves `run` in place; running the same migration again resumes. A stop inside the jump resumes the jump, which is idempotent: the rewrite writes the same rows again, the checkout of a tag already checked out does nothing, and the reconciliation is add-only. Since a step can stop after its writes and before its record, every data step is repeatable (epic D2): generated steps are written that way, and the designer declares it for steps they write. The step and its record are not committed together in one SQL transaction (N2): the step's writes go to the `data` section, the record to the Admin store, which may be another store or schema.

### D9. What does add-only reconciliation do on each store, and when does it run?

**Status:** proposed. **Serves:** G5.

**What is at stake.** Library's designer adds `isbn` to `Book` in the Entity editor and commits. On PostgreSQL the `Book` row is upserted and the data table keeps its columns (#715's test pins it), so the table has no `isbn` column for the values the designer then enters. A designer who creates an Entity by saving a new Entity row (not through `createEntity`) gets no storage at all: the filesystem data section lists its Entities from its folders (`FileSystemStoreSection.getEntityUuids`), so a later write of an instance is refused. And `createStorageSpaceForInstancesOfEntity` empties an existing collection on IndexedDB and MongoDB (it clears the sublevel, `deleteMany({})`); their `createEntity` guards against it (`IndexedDbEntityStoreSectionMixin.createEntity` skips an existing sublevel), but a reconciliation that called it would wipe data, hence the `IfMissing` variant on every store.

- **`createStorageSpaceForInstancesOfEntityIfMissing`** becomes required on `StorageSpaceHandlerInterface` (`PersistenceStoreControllerInterface.ts`, optional today): SQL keeps its `sync()` (`CREATE TABLE IF NOT EXISTS`); filesystem, IndexedDB and MongoDB create the folder, sublevel or collection when missing and keep it otherwise, and register a non-uuid `idAttribute` as their `createStorageSpaceForInstancesOfEntity` does. The bundled store sections (`BundledModelStoreSection.ts`, `BundledDataStoreSection.ts`, `BundledUnsupportedModelVersionStore.ts`), the error stores (`ErrorDataStore.ts`, `ErrorModelStore.ts`) and the test doubles implement it too (the bundled ones refuse or do nothing, as for creation today).
- **Reconciling an Entity**, on the data section of its deployment: the `IfMissing` creation; on SQL, then, `addColumn` for each attribute of `fromMiroirPresentModelToSequelizeEntityDefinition(entity)` that the table lacks (`describeTable`), always nullable, never dropping nor altering a column; then the Sequelize model of the Entity is redefined from the row, as `alterEntityAttribute` does (`sqlDbEntityStoreSectionMixin.ts`), so the next upsert writes the new column. Filesystem, IndexedDB and MongoDB store documents: the creation is all they need.
- **When it runs:**
  - after the jump, for every Entity of the target model (D8), and in `applyModelState` after each Entity row it writes (D2);
  - in the DomainController of the persistence process, after a successful create or update of one of an application's own Entity rows (legend) in the `model` section, whether it comes from a commit, a direct write or a remote client. Not for Miroir's own model, not for meta-model Entities, not for `devData` Entities (#647 keeps their storage lazy), and never from `initModel` or `resetModel`, which upsert Entity rows through `ModelInitializer` without the DomainController's instance-write path. #715's `entityRowUpdateSqlTable.integ` then asserts the new column instead of its absence.
- It never runs on a plain boot (epic D2).
- `createEntity` keeps calling `createStorageSpaceForInstancesOfEntity`; a replayed `createEntity` is not part of a migration (the jump rewrites rows and reconciles).

### D10. How does the versioning package reach the store sections?

**Status:** proposed — D10-a. **Serves:** G2, G5.

**What is at stake.** The rewrite, the jump and the contract steps run in the versioning package, which calls core only through `DomainControllerActionHost`. That interface writes instances, runs composites and Git actions, and runs store management actions (`handleStoreManagementAction`), but has nothing that reconciles or drops storage.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D10-a. Two store management actions** ★ | `storeManagementAction_reconcileEntityStorage { application, entity }` and `storeManagementAction_dropEntityStorage { application, entity, attribute? }`, new members of the `StoreManagementAction` union, run by `handleStoreManagementAction` on the data section of the application's deployment; a remote client forwards them as it forwards the others | reuses the path that already reaches the stores; testable as actions; the DomainController's own reconciliation (D9) calls the same code | a core schema change (generated types) |
| D10-b. New host methods | `reconcileEntityStorage`, `dropEntityStorage` on `DomainControllerActionHost` | no schema change | a second path to the stores, not reachable as actions or MiroirTests |

**Decision:** D10-a. They are internal: no Runner or menu offers them.

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
| A meta-model Entity created in the application's model when absent | `ensureRecordEntity` (`evolutionTraceRecords.ts`) | ✅ #708; D5 and the Migration Entity follow it |
| A mark that keeps a write out of the traces | `markRecordedBySender` (`1_core/versioning/evolutionTraceRecording.ts`), set by `RestServer` | ✅ #708; D6's run mark follows it |
| SQL idempotent creation | `SqlDbStoreSection.createStorageSpaceForInstancesOfEntityIfMissing` (`sync()`), used by `PersistenceStoreController` for `devData` | ✅ #647 |
| Storage drop per Entity on every store | `dropStorageSpaceForInstancesOfEntity` | ✅, but SQL drops only a registered table (D4) |
| Store management actions run where the stores are | `handleStoreManagementAction` on `DomainControllerActionHost` | ✅; D10 adds two |

### 4.2 Misaligned or missing

| Gap | Where | Part |
|---|---|---|
| `createStorageSpaceForInstancesOfEntity` empties existing storage on SQL (`sync({ force: true })`), IndexedDB (`sublevel(...).clear()`) and MongoDB (`deleteMany({})`); the filesystem keeps it. Only SQL has the `IfMissing` variant, optional in the interface | `SqlDbStoreSection.ts`, `IndexedDbStoreSection.ts`, `MongoDbStoreSection.ts`, `FileSystemStoreSection.ts`, `PersistenceStoreControllerInterface.ts` | A |
| An Entity row written as an instance leaves the data storage as it was: no SQL column, no folder for a new Entity; only `alterEntityAttribute` runs `sync({ alter: true })` and redefines the SQL model | `PersistenceStoreController.upsertInstance`, `sqlDbEntityStoreSectionMixin.alterEntityAttribute` | A |
| SQL `IfMissing` reuses the cached Sequelize model of the Entity, which an attribute added since does not have | `SqlDbStoreSection.createStorageSpaceForInstancesOfEntityIfMissing` | A |
| No storage drop of a single attribute; no drop of an unregistered SQL table | store sections | A |
| No `Migration` Entity, no `DeploymentState` Entity, no roles, no gate on a following deployment | — | B |
| No rewrite of the live model from a state | — | B |
| No generation; `modelCudMigrationCandidates` fills the Entities-only `modelCUDMigration` of a version | `modelStateDiff.ts` | C |
| No runner | — | D |

## 5. Key reuse

| Piece | Location |
|---|---|
| Model states, replay, diff, agreement | `@miroir-framework/versioning` (`modelStates.ts`, `modelStateDiff.ts`, `evolutionTraceAgreement.ts`) |
| Lazy, capability-gated Model Endpoint actions run in the persistence process | `registerLazyActionImplementations`, `forwardServerRoutedAction`, `SERVER_ROUTED_MIROIR_ACTION_TYPES` (#696) |
| Reading a section; instance writes; composite runs; Git actions; store management from the package | `DomainControllerActionHost` (`readSectionInstances`, `handleInstanceAction`, `handleCompositeAction`, `handleGitAction`, `handleStoreManagementAction`) |
| Lock per application | `withApplicationLock` (`evolutionTraceRecords.ts`) |
| Meta-model Entity created when absent | `ensureRecordEntity` (`evolutionTraceRecords.ts`) |
| Symbol mark on an action | `markRecordedBySender`, `isRecordedBySender` (`evolutionTraceRecording.ts`) |
| Sequelize model of an Entity; redefinition after an attribute change | `fromMiroirPresentModelToSequelizeEntityDefinition`, `getAccessToDataSectionEntity` (`SqlDbStoreSection.ts`), `alterEntityAttribute` (`sqlDbEntityStoreSectionMixin.ts`) |
| Versioning integration tests on the filesystem store | `packages/miroir-standalone-app/tests/3_controllers/versioning/`, nonreg steps `integ-708-*` |
| SQL table check after an Entity row update | `packages/miroir-standalone-app/tests/4_storage/entityRowUpdateSqlTable.integ.test.ts` (#715) |

## Next step

`tdd-implementation-plan.md` in this folder, per `miroir-analysis-to-tdd-plan`: part A, then B, C and D.
