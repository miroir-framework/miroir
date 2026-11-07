# 694 — Safe application evolution: ways of working with and without Git

> This analysis covers how an application designer creates versions, prepares data migrations, moves a test deployment to a new model and rolls it back, in two cases: with the model in a Git repository and without. It covers both a strict versioning workflow and continuous delivery. It turns the #694 grilling decisions into the mechanisms each combination uses, finds what the code does not support yet, and frames epic items 6 to 10.

Related issue: https://github.com/miroir-framework/miroir/issues/695
Parent issue: [#694](https://github.com/miroir-framework/miroir/issues/694) · Prerequisites: #225 ✅, #230 ✅, #589 ✅, #703 ✅, #706 ✅
Related analyses: [216 freeze ADR](../216-FEATURE-application-versions-and-freeze/analysis.md) (D2 Option A / B, D6), [#9 WP1](../9-FEATURE-create-migrations-for-model-and-data-updates/wp1-analysis-model-evolution-trace.md) and [WP2](../9-FEATURE-create-migrations-for-model-and-data-updates/wp2-analysis-application-version-migrations.md), [679 Git](../679-FEATURE-git-version-control/analysis.md) (section 7), [576 feature switches](../576-DESIGN-feature-switches/analysis.md), [273 process capabilities](../273-FEATURE-process-capability-switches/analysis.md)
Epic documents in this folder: [decisions.md](decisions.md) (the grilling outcome, Q1 to Q32), [grilling-round-1.md](grilling-round-1.md), [grilling-round-2.md](grilling-round-2.md), [grilling-round-3.md](grilling-round-3.md), [status-review-2026-11-06.md](status-review-2026-11-06.md)
Key sources: [`applicationVersionFreeze.ts`](../../../packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts), [`versioningMode.ts`](../../../packages/miroir-core/src/1_core/versioning/versioningMode.ts), [`evolutionTracePolicy.ts`](../../../packages/miroir-core/src/2_domain/evolutionTracePolicy.ts), [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts), [`PersistenceStoreController.ts`](../../../packages/miroir-core/src/4_services/PersistenceStoreController.ts), [`SqlDbStoreSection.ts`](../../../packages/miroir-store-postgres/src/4_services/SqlDbStoreSection.ts), [`sqlDbEntityStoreSectionMixin.ts`](../../../packages/miroir-store-postgres/src/4_services/sqlDbEntityStoreSectionMixin.ts), [`miroir-git-isomorphic`](../../../packages/miroir-git-isomorphic/src/index.ts)

**Document role:** epic analysis and decision record. The decisions Q1 to Q32 are settled in [decisions.md](decisions.md) and are not reopened here. This document cites them as `Qn`, and it adds the decisions D1 to D12 that the grilling left open or did not see. Where a D decision narrows a Q decision, it says so.
**Status:** draft, revised after an adversarial review (code fact check and design attack, 2026-11-07). Goals G1 to G8 and decisions D1 to D12 await confirmation.

---

## 1. Goals

- **G1 — Name a model state.** As an application designer, I can turn the current model of my application into a named version, so that I have a point I can come back to and ship.
- **G2 — Prepare a data migration.** As an application designer, I can get a draft migration between two model states, then review and edit it, so that I can move existing data to a new model without writing it all by hand.
- **G3 — Bring a test deployment forward.** As an application designer, I can move a test deployment, model and data, from one version to a later one, so that I can try a new model on realistic data before production.
- **G4 — Know where a deployment stands.** As an operator, I can see which model state a deployment's data is at and which migrations ran on it, so that I know which migrations still have to run.
- **G5 — Roll back.** As an operator, I can bring a deployment's model back to an earlier version, and Miroir tells me when its data does not allow it, so that I can recover from a bad release.
- **G6 — Release without breaking.** As an application designer, I am told when a model change is not backward-compatible, and I can keep an unfinished feature switched off in a released model, so that I can deliver small changes continuously.
- **G7 — Pay only for what I use.** As an operator, I can run Miroir without the versioning code, and an application that does not version costs nothing more, so that small deployments stay small.
- **G8 — Work with others through Git.** As an application designer, I can keep an application's model in a Git repository and use branches, tags and merges, so that I can change it together with other designers.

## 2. Non-goals

- Concurrent designers without Git. The last writer wins (Q14); this is documented, with no locking.
- Merging divergent model histories inside Miroir. Git does that, outside Miroir; the Git page pulls fast-forward only.
- Inverse migrations (Q17). Rollback goes to a frozen state (Q31).
- Versioning application data. Only the model is versioned; data is migrated.
- Restoring Miroir's own model in a running process. Miroir is frozen like any application (#230, #706), but restoring it is out of scope.
- Automatic store backups by the migration runner (Q31 (c)). This becomes a later sub-issue if the experiments need it. The experiments re-seed their data from fixtures instead (section 9).
- Third-party flag services (a 576 non-goal).

## 3. Vocabulary

| Term | Meaning here |
|---|---|
| **Model state** | The full model of an application at one point: every Entity, Query, Report, Menu, Endpoint, Runner, Theme, TransformerDefinition, MlSchema, MiroirTest, Blob, TestConfiguration and Test row. |
| **Version** | A named model state. Without Git, it is a frozen `SelfApplicationVersion` with its `*Version` snapshots in `modelVersion`. With Git, it is a Git tag that carries the same name (Q7, D10). |
| **Authoring deployment** | The deployment where designers edit the model. It writes traces, versions and migrations (D5). |
| **Following deployment** | A test, validation or production deployment. It reads versions and migrations, runs migrations, and never writes to `modelVersion` (D5). |
| **Trace record** | One Miroir `commit` (one model transaction): the ordered resolved model Actions it ran (Q16, Q28). |
| **Migration** | An instance of the new `Migration` Entity in `modelVersion`: a `CompositeActionSequence` that moves a deployment from one version to another (Q10). It has expand, jump and contract phases (D2). |
| **Deployment state record** | A row in Admin data, keyed by Deployment uuid. It records the version the deployment's model and data are at, the migrations applied and the steps done in a running one, and whether the deployment authors or follows (Q22, D5). |
| **Restore point** | A version that a deployment's model can be brought back to (Q11). It is not a separate concept: every version is one. |
| **Re-baseline marker** | A record that closes the open traces after the model was corrected outside Miroir or jumped (Q30, D11). |
| **Backward-compatible step** | A step after which the data still fits the model it started from. Only expanding steps qualify: add an Entity, add an optional attribute, fill values. |

## 4. The two settings and the two workflows

### 4.1 Settings

| Setting | `versioningMode` | Where the model lives | Where versions live | Process capabilities needed |
|---|---|---|---|---|
| **N. No Git** | `versioned-internal` | `model` section, any store but `bundled` | `modelVersion` section, frozen rows | `versioning` (#696) |
| **G. Git** | `versioned-git` (today `versioned-external`, Q24) | `model` section on the filesystem, inside a Git work tree | Git tags. A writable `modelVersion` folder, committed with the model, holds traces and migrations only. This is new: today `versioned-external` has no `modelVersion` (`docs/reference/versioning.md`, `DomainController.ts` skips history fetches for it). | `versioning` and `git` |
| U. Unversioned | `unversioned` | any | none | none |

### 4.2 Workflows

| | **Strict** (S) | **Continuous delivery** (C) |
|---|---|---|
| Version names | `major.minor.patch`. The bump follows the migration: a breaking step means a major bump. | any increasing label, for example a build number or a date |
| Versions created | at release | at each deploy |
| Migration between releases | may hold breaking steps | must be backward-compatible; a breaking change is split over two releases (expand, then contract) |
| Rollback | refused past a breaking step; a store backup is the fallback (Q31) | always possible, since every migration is backward-compatible |
| Unfinished features | kept on a branch until release | released switched off (feature switch, D8) |
| Packaging | a release package per version (D9) | the deployed version itself |

### 4.3 Mechanisms per combination

| Mechanism | N-S | N-C | G-S | G-C |
|---|---|---|---|---|
| Version | frozen `SelfApplicationVersion` (exists) | same | Git tag (create: missing, D3) | same |
| Snapshot of a version | `*Version` rows (exist, all element types since #706) | same | `*_model/` folder at the tag (reading it: missing, D4) | same |
| Evolution traces | records in `modelVersion` (revival, item 6) | same | same, committed with the model | same |
| Snapshot diff | `diffEntityVersionSnapshots`, Entities only (exists); all types and attributes (missing, item 6) | same | same diff on two Git states | same |
| Migration | `Migration` instance (item 7) | same, backward-compatible only | same | same, backward-compatible only |
| Deployment state record | Admin row (item 7) | same | same | same |
| Agreement check (Q29) | at freeze | at freeze | at Git commit | at Git commit |
| Re-baseline (Q30) | freeze of the live model plus marker | same | marker committed with the model, no freeze (D11) | same |
| Model jump to a version | restore action (missing, D6) | same | checkout of the tag (exists), plus the Q31 check and the storage reconciliation (D2) | same |
| Feature switches | — | application switches (missing, D8) | — | same as N-C |
| Release package | version package (D9) | — | the repository at the tag | — |

### 4.4 Combinations that do not make sense

| Combination | Why | What Miroir does |
|---|---|---|
| `unversioned` with `evolutionTraces` | a trace leads to a version, and there is none | refuse the parameter (Q24) |
| `versioned-git` with a `model` section that is not on the filesystem, or not in a work tree | there are no files for Git to version | refuse the mode when the deployment opens; the Versioning UI says why |
| `versioned-git` with frozen `*Version` rows | two histories that can disagree (Q7) | freeze refused, as today for `versioned-external` (`assertApplicationVersioningEnabled`) |
| `versioned-internal` on a `bundled` store | `modelVersion` is read-only there | freeze refused, as today |
| A following deployment that edits its model | it would fork the history it follows | model commits refused while the state record says "follows" (D5) |
| A breaking step in continuous delivery | rollback past it is refused (Q31) | warning at generation (Q23); per D1 the warning shows in both workflows |
| Several designers without Git | last writer wins (Q14) | documented limitation |

---

## 5. A designer's day in each setting

Library is the example: `Book` (attributes today: `name`, `year`, `citation`, `author`, `publisher`) gains an optional attribute `isbn`, which is filled from existing data.

### 5.1 Setting N, no Git

1. **Create a version.** The designer freezes the model as `1.0.0` from the freeze Runner (exists, #225). Since #706 the freeze snapshots every model element. With traces on (item 6), the freeze first checks that the previous version plus the trace records equal the live model (Q29). On a mismatch it refuses and lists the differences.
2. **Change the model.** The designer adds `isbn` to `Book`. Today the Entity editor saves the Entity row as an instance update. On SQL that leaves the table without the column, and the trace would hold a row update, not an attribute step. Two changes cover this (D2, D12): every change to an Entity row brings the storage up to the model, adding only; and migrations derive their structure steps from the snapshot diff, not from the traced Actions. The `commit` writes one trace record (Q16).
3. **Freeze `1.1.0`.**
4. **Prepare the migration** (item 7). "Prepare migration from `1.0.0` to `1.1.0`" replays the trace records on the `1.0.0` snapshot and compares the result with the `1.1.0` snapshot (Q29). It then writes a draft `Migration` (D2, D12):
   - expand: none;
   - jump to `1.1.0`;
   - fill: an empty data step that the designer completes (a transformer computing `isbn`);
   - contract: none.

   Each step is classified; here all are backward-compatible.
5. **Move the test deployment** (item 7). The test environment is another Miroir process, since a process holds one deployment per application (D5). It reads the same `modelVersion` storage (D5), and its state record marks it as following at `1.0.0`. The runner:
   - checks that the deployment is at `1.0.0`;
   - jumps the model to `1.1.0` with tracing suppressed, so the SQL table gains its column through the add-only reconciliation (D2);
   - runs the fill step;
   - records each step in the state record as it goes.

   The record ends at `1.1.0` with the migration listed. A brand-new test deployment starts with a jump to `1.0.0` on an empty deployment, followed by its fixture data (D6).
6. **Roll back** (item 9). The operator restores `1.0.0` on the test deployment (D6). The state record shows that only backward-compatible steps ran since `1.0.0`, so the restore runs. The extra `isbn` column stays in the data (D2).

### 5.2 Setting G, Git

1. **Create a version.** The designer commits from the Git page, then tags the commit `1.0.0` (D3; the tag carries the version name, D10). With traces on, the Git commit checks that the model at `HEAD` plus the trace records being committed equal the working model (Q29). Otherwise it refuses to commit the application's files.
2. **Change the model.** Same as in N. The trace record is a new file under `modelVersion/`, committed with the model change. New files never conflict in a merge (Q16).
3. **Commit and tag `1.1.0`.**
4. **Prepare the migration.** Same as in N, with the two model states read from the two tags (D4). The `Migration` instance is committed.
5. **Move the test deployment.** The test environment has its own clone, and its data section is outside the clone (D7). The runner:
   - runs the expand steps on the current checkout;
   - checks out `1.1.0` on behalf of the operator. The reload rereads the model (#681, `loadConfigurationFromPersistenceStore`) and the storage is reconciled add-only (D2). Tracing is suppressed, so the clone stays clean;
   - runs the fill and contract steps.

   The state record ends at `1.1.0`.
6. **Roll back.** The operator checks out `1.0.0` on the Git page, after the Q31 check (Q32).

### 5.3 Continuous delivery: a breaking change

Renaming `Book.year` to `Book.publicationYear` in one release breaks rollback. The designer releases it in two steps:
1. Release *n*: expand with `publicationYear`, a fill step copies `year` into it, and the application reads `publicationYear`. This release is backward-compatible.
2. Release *n+1*: contract by dropping `year`. This step is not backward-compatible: once it has run, rolling back to *n* is refused.

Generation flags step 2 (Q23, D1). No model Action renames an attribute today. `alterEntityAttribute` declares `addColumns`, `removeColumns` and `update`, and the SQL store applies only the first two. A rename is therefore a remove plus an add, and the removed column's data is lost unless a fill step copies it before the contract step drops it. Neither a trace nor a diff can tell a rename from a remove plus an add, so the designer says which it is in the migration draft (item 8, #215).

---

## 6. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1. Is a `deliveryStyle` field needed? | **No.** Each migration step is classified backward-compatible or not, whatever the workflow | G2, G5, G6 |
| D2. How a deployment's model and storage reach a version | **Migrations jump the model to the version, between expand and contract data steps. Storage creation is idempotent on every store, reconciliation is add-only, and drops happen only in a contract step** | G3, G5 |
| D3. How a version is created in Git mode | **A Git tag, created by a new `gitAction_tag`**; freeze stays refused | G1, G8 |
| D4. Where a model state comes from | **One `ModelStateSource`: a frozen version, a Git ref, or the live model** | G2 |
| D5. How a test environment gets the versions without Git | **It points its `modelVersion` section at the same storage, read-only, as a following deployment**; version packages come later (D9) | G3 |
| D6. Restore without Git | **A new model action rewrites the live model from a version's snapshot**, used for rollback and as the migration jump | G3, G5 |
| D7. Data of a Git-backed deployment that is migrated | **Outside the Git work tree** | G3, G8 |
| D8. Application feature switches | **A separate epic item, analysed on its own**, not part of items 6 to 10 | G6 |
| D9. Release packages in the strict workflow | **Deferred**: setting G uses the repository at a tag; packages for setting N come later | G1, G3 |
| D10. Referring to a model state | **By version name**, the same name as the Git tag; the live model is never stored as a reference | G2, G4, G8 |
| D11. Trace order and re-baseline with Git | **`previousTrace` plus a sequence number in both settings; the Git re-baseline is a committed marker, without a freeze** | G1, G8 |
| D12. Where a migration's structure steps come from | **From the attribute-level diff of the two model states**; traces serve the agreement check and the designer's hints | G2 |

Also needed, though not a choice: when the `versioning` capability is off, model commits of an application with `evolutionTraces` on are refused. Otherwise its traces would have gaps that only a re-baseline repairs (Q20, Q30). Miroir's own SelfApplication ships with `evolutionTraces` off, so a process without the capability can still edit Miroir's model (G7). Item 6 implements this.

### D1 — No `deliveryStyle` field

**Status:** Proposed — D1-b. **Serves:** G2, G5, G6.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D1-a. `deliveryStyle: strict \| continuous` on SelfApplication (Q24 left it open) | the Q23 warning shows only for `continuous` | explicit | a third parameter; strict designers also want to know that a step breaks rollback, so that they bump the major number |
| **D1-b. Classify every step** ★ | generation marks each step `backwardCompatible`, the `Migration` carries the conjunction, and Q31 reads it | one rule serves both workflows: strict uses it for the version bump, continuous for the warning | there is no place to turn the warning into an error for some applications only |

**Decision:** D1-b. This widens Q23: the warning shows in both workflows. Generation pre-fills the flag for the steps it writes. The designer sets it for steps they edit or write by hand (Q10, Q30), and Q31 trusts it. D1-a comes back if the experiments want the warning to become a refusal for some applications only.

### D2 — How model and storage reach a version

**Status:** Proposed — D2-d. **Serves:** G3, G5.

Two facts about the code shape this decision.

**Creating storage is destructive on three stores.** `createStorageSpaceForInstancesOfEntity` empties an existing storage space:
- SQL runs `sync({ force: true })`, which drops the table (`SqlDbStoreSection.ts`, line 275);
- IndexedDB clears the existing sublevel (`IndexedDbStoreSection.ts`, `createStorageSpaceForInstancesOfEntity`);
- MongoDB runs `deleteMany({})` (`MongoDbStoreSection.ts`).

Only SQL has `createStorageSpaceForInstancesOfEntityIfMissing` (`SqlDbStoreSection.ts`, line 304; `PersistenceStoreController.ts` uses it when it exists). So a replayed `createEntity` wipes the data of that Entity on every store but the filesystem.

**SQL columns follow the model only through model Actions.** `alterEntityAttribute` updates the Entity row and then runs `sequelizeModel.sync({ alter: true })` on the data table (`sqlDbEntityStoreSectionMixin.ts`, `alterEntityAttribute`, lines 199 to 267). Booting a SQL section only maps the Entities to tables and widens old varchar columns (`SqlDbStoreSection.bootFromPersistedState`, lines 97 to 140, and `widenLegacyStringColumns`). So an Entity row changed any other way leaves the table as it was. The other ways are a restore from a snapshot, a Git checkout, or the generic instance editor, which is what the Entity editor uses today.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D2-a. Replay model steps | a migration runs the traced model Actions; restore and checkout replay too | close to the trace | destructive on re-run (above); a Git checkout has already rewritten the files; a data step that needs a removed attribute cannot run once the model lacks it |
| D2-b. Full reconciliation at boot | SQL boot runs `sync({ alter: true })` on every table | simple | rolling back drops the columns that a later version added, along with their data; it costs every boot (G7) |
| D2-c. Replay model steps, add-only reconciliation after a restore or checkout | as in the first draft | rollback keeps data | keeps the faults of D2-a |
| **D2-d. Expand, jump, fill, contract** ★ | see below | one mechanism for both settings and every element type; idempotent; a fill step reads the old and new attributes side by side | a dropped attribute stays in storage until a contract step drops it; the runner needs a resumable state |

How D2-d works:
- **Expand** steps are data steps that run on the starting model.
- **Jump** brings the model to the target version: restore (D6) in setting N, checkout in setting G. It is followed by an add-only storage reconciliation: missing storage spaces and columns are created, existing ones are kept.
- **Fill** steps are data steps that run on the target model. Columns that the target removed are still in storage, so a fill step can read them through a raw store read.
- **Contract** steps explicitly drop storage (a column or a storage space) that the target model no longer declares.
- Reconciliation also runs after any change to an Entity row through the instance editor, so the authoring deployment's storage follows its own edits. It never runs on a plain boot.
- Every store gets an idempotent `createStorageSpaceForInstancesOfEntityIfMissing`.
- The runner checks that the deployment is at the `from` version, and writes each finished step into the state record. A run that stops halfway resumes from the next step. Tracing is suppressed during a run.

**Decision:** D2-d. Item 7 owns the runner, the phases and the idempotent storage creation. Item 9 owns the restore and shares the reconciliation. The experiments include a SQL run.

### D3 — Versions in Git mode

**Status:** Proposed — D3-a. **Serves:** G1, G8.

The Git page lists and checks out tags (`miroir-git-isomorphic`, `git.listTags`, `log` decorations), but no `gitAction_*` creates one. The existing actions are `checkout`, `clone`, `commit`, `commitFiles`, `createBranch`, `deleteBranch`, `diff`, `fetch`, `init`, `installClonedDeployment`, `log`, `pull`, `push`, `revert`, `setCredential`, `setRemote`, `stage`, `status` and `unstage`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. `gitAction_tag`** ★ | an annotated tag on a commit, from the Git page; push sends tags | one history (Q7); Git users know tags | needs the `git` capability |
| D3-b. Freeze writes a commit and a tag | the freeze Runner also tags | one button for both settings | freeze would call Git, which 679 section 7 rules out for the Miroir `commit`; freeze would have two meanings |

**Decision:** D3-a, in item 6.

### D4 — One source of model states

**Status:** Proposed. **Serves:** G2.

Migration generation, the agreement check (Q29) and restore all need "the model at state X". There are three sources:
- frozen `*Version` rows (setting N);
- the `*_model/` files at a Git ref (setting G), read with isomorphic-git `readTree` / `readBlob`, without a checkout;
- the live model.

A `ModelStateSource` interface in the versioning package (#696) returns the same in-memory shape for each: a map from element type to rows, covering every snapshotted type. `MetaModel` (`miroirFundamentalType.ts`) has no Blob, TestConfiguration or Test collections, so it does not fit as it is. The trace replay, the all-types diff and the agreement check take two sources. The Git implementation lives in `@miroir-framework/git-isomorphic` and loads lazily. Item 6 owns D4, the replay and the diff, because the Q29 checks at freeze and at Git commit need them before migrations exist.

### D5 — Versions in a test environment, without Git

**Status:** Proposed — D5-a for the experiments. **Serves:** G3.

A process holds one deployment per application: `ApplicationDeploymentMap` maps an application uuid to one deployment uuid (`1_core/Deployment.ts`, line 66). A test deployment of Library is therefore another process, with its own environment (`environments/*.json`). Each deployment configures its sections separately, so two environments can point their `modelVersion` sections at the same directory or SQL schema while `model` and `data` differ.

`evolutionTraces` lives on the SelfApplication row, which is model, so a test deployment has traces on as well. If it wrote traces, re-baseline markers or versions to the shared `modelVersion`, it would break the authoring deployment's `previousTrace` chain (Q19). In setting G it would also dirty the clone, and `gitAction_checkout` would then refuse. The deployment state record therefore says whether a deployment authors or follows. A following deployment writes nothing to `modelVersion`, and its model commits are refused (section 4.4). Only migrations and restores change its model.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. Shared `modelVersion` storage, read-only for followers** ★ | dev and test environments configure the same `modelVersion` store | no new transport | needs a store that both can reach |
| D5-b. Version package | export a version (snapshot, migrations) as files, import it in the test environment | works across networks; it is the strict workflow's "package" | new export and import actions (D9) |
| D5-c. Read through the dev server | the test environment asks the dev server | always fresh | couples environments at run time |

**Decision:** D5-a for items 7 and 10, D5-b with D9. Item 7 owns the authoring and following roles.

### D6 — Restore without Git

**Status:** Proposed. **Serves:** G3, G5.

No action reads a frozen version back today. A new model action, `restoreApplicationVersion` (working name), runs on a deployment in five steps:

1. **Q31 check.** It checks Q31 and refuses with the name of the blocking step. For a following deployment, the steps since Vk are the migrations in its state record. For the authoring deployment, whose data changed through live edits, they are the structure steps of the diff from Vk to the live model (D12): if an attribute or Entity of Vk is no longer in the live model, its data has been dropped, and the restore is refused.
2. **Open traces.** It is refused while trace records are open, unless the designer freezes first or confirms discarding the edits. Discarding writes a re-baseline marker (Q30).
3. **Rewrite.** It rewrites the live model rows of every snapshotted element type from the version; rows absent from the version are deleted.
4. **Reconcile.** It reconciles storage add-only (D2).
5. **Record and reload.** It records the restore in the state record (and, on the authoring deployment, a re-baseline marker, because the live model jumped). It then reloads the model (`rollback`, as after a Git checkout, #681).

It is refused while a Miroir transaction is open, as the Git checkout is (679 D7). On an empty deployment it installs a version, which is how a new test deployment starts. It lives in the versioning package (#696), which needs a way to register model actions from outside core; #696 provides it. Item 9 owns D6.

### D7 — Data outside the work tree, in Git mode

**Status:** Proposed. **Serves:** G3, G8.

The clone installer (`gitAction_installClonedDeployment`) points every section of the installed deployment into the clone, `data` included, and skips a deployment whose sections are not folders of the clone (`GitClonedDeployments.ts`). A checkout of a newer tag then also rewrites the data files that the repository holds (Library commits sample data under `library_data/`), which defeats a migration. A deployment whose data is migrated therefore keeps its `data` section outside the work tree, or on another store. This needs new code: the installer takes a data location outside the clone and seeds it from the repository's sample data. The dev deployment, whose data is sample data, may keep it in the repository. Item 10 owns D7, because E2 needs it.

### D8 — Application feature switches

**Status:** Proposed. **Serves:** G6.

Miroir has no switch that an application designer can put on a Report, a Menu item or a Runner. The switches inventoried in #576 are Miroir's own: process capabilities, build profiles and UI toggles. Continuous delivery needs one, so that a released model can carry a hidden feature. It is a model concept (where a switch is declared, where its value lives, what it hides) and deserves its own analysis.

**Decision:** a new epic item 11, analysed after the item 10 experiments show what they need. Items 6 to 10 do not depend on it.

### D9 — Release packages

**Status:** Deferred. **Serves:** G1, G3.

In setting G, the release package is the repository at a tag, cloned with the Git page (#683). In setting N, a package would be the version's snapshot rows and the migrations, exported as files. The Admin `bundle` Entity `9f9170da-538d-425c-8cb7-551640623eed` has only `name`, `defaultLabel` and `description`. This is decided after item 10, together with D5-b.

### D10 — Naming model states

**Status:** Proposed — D10-a. **Serves:** G2, G4, G8.

679 section 7 warns that storing Git commit ids in model Entities would tie the model to Git.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D10-a. Version name** ★ | a Migration says `from: "1.0.0"`, `to: "1.1.0"`, and the state record says `1.1.0`. In setting N, the name resolves to the `SelfApplicationVersion` of that name on the application's main branch; branches are not managed in N today (`ApplicationModelBranch.headVersion` is set only at creation). In setting G, it resolves to the tag of the same name, unique in the repository. | same records in both settings | a moved or deleted tag breaks the link |
| D10-b. Uuid of the version, or commit id | exact | — | Git ids in model rows; two vocabularies |

**Decision:** D10-a. The Git tag carries the version name exactly, with no `v` prefix. The state record may store the commit id as information, never as the key. The live model is a `ModelStateSource` for previews and checks, but a stored Migration or state record always names a version.

### D11 — Trace order and re-baseline with Git

**Status:** Proposed. **Serves:** G1, G8. **Narrows:** Q19 and Q30.

One Git commit usually adds several trace records, one per Miroir `commit`, and Git ancestry does not order them. Q30's re-baseline "freezes the live model", which Q7 forbids with Git.

**Decision:**
- Every trace record keeps `previousTrace` plus a sequence number in both settings. In setting G, Git ancestry orders only the records of different Git commits, and a merge is resolved by a re-baseline.
- In setting G, a re-baseline writes a marker record that is committed with the model, and no freeze. The marker names the Git commit it closes as information (D10).

Item 6 owns D11.

### D12 — Structure steps from the diff

**Status:** Proposed. **Serves:** G2. **Narrows:** Q10.

No UI emits `alterEntityAttribute` today: the Entity editor (`packages/miroir-react/src/EntityEditor.tsx`) saves the Entity row as an instance update, and only MiroirTests use the model Action. A trace of an attribute added in the UI is therefore an instance update of the Entity row, from which a migration cannot read a structure step.

**Decision:** generation derives the expand and contract steps from an attribute-level diff of the two model states (D4). The trace replay checks that the two states agree (Q29). The traces also give the designer hints, such as the order of changes and a rename candidate when a remove and an add happen in the same record. Making the Entity editor emit model Actions is not required. Item 7 owns generation, and item 6 owns the diff.

---

## 7. Current state

### 7.1 Aligned

| Piece | Where | State |
|---|---|---|
| Freeze, all model element types | `applicationVersionFreeze.ts`, `DomainController` `case "freezeApplicationVersion"` | done (#216, #227, #230, #706) |
| `modelVersion` section on every writable store | `PersistenceStoreController`, `versionHistoryEntityUuids` (`1_core/Model.ts`) | done (#232) |
| Freeze Runner and Versioning report | Runner `20d51c4c-…`, report `c2b89408-…` | done (#225) |
| Git page: commit, branches, checkout of tags, fetch, pull, push, clone and install | `GitActions.ts`, `miroir-git-isomorphic` | done (#679, #691) |
| Reload after checkout | `loadConfigurationFromPersistenceStore` (`DomainController.ts`, line 652) | done (#681) |
| Trace MiroirTest skipped when traces are off | `miroirTestRequirements.ts` | done (#589) |
| Idempotent storage creation on SQL | `createStorageSpaceForInstancesOfEntityIfMissing` (`SqlDbStoreSection.ts`) | done |

### 7.2 Misaligned or missing

| Gap | Where | Owner |
|---|---|---|
| `versioningMode` is `unversioned \| versioned-internal \| versioned-external`: there is no `versioned-git` and no `evolutionTraces` parameter | `versioningMode.ts`, SelfApplication schema | item 6 |
| `versioned-external` has no writable `modelVersion`; setting G needs one for traces and migrations | `DomainController.ts` (history fetches skipped), `docs/reference/versioning.md` | item 6 |
| Traces are switched by `MIROIR_EVOLUTION_TRACE` / `VITE_MIROIR_EVOLUTION_TRACE` for the whole process, read from `process.env`, so they are always off in a browser | `evolutionTracePolicy.ts`, `isEvolutionTraceEnabled` | item 6 |
| Traces are written to the `model` section (`data` for Miroir), with one root per application and branch, one event per action, and no resolved Action | `evolutionTracePolicy.ts` `shouldTraceEvolutionEvent`, `evolutionTraceWriter.ts` | item 6 (Q16, Q28, D11) |
| Versioning code sits in core and loads everywhere; model actions cannot be registered from outside core | `1_core/versioning/`, `2_domain/evolutionTrace*.ts` | #696 |
| Snapshot diff covers Entities only, by uuid, with no attribute-level steps (`modelStructureMigration` is always `[]`) | `diffEntityVersionSnapshots`; `applicationVersionFreeze.ts`, line 1346 | item 6 (D4, D12) |
| `MetaModel` has no Blob, TestConfiguration or Test collections | `miroirFundamentalType.ts` | item 6 (D4) |
| No `Migration` Entity, no runner, no deployment state record, no authoring and following roles | — | item 7 |
| Creating a storage space empties an existing one on SQL, IndexedDB and MongoDB; only SQL has an `IfMissing` variant | `SqlDbStoreSection.ts`, `IndexedDbStoreSection.ts`, `MongoDbStoreSection.ts` | item 7 (D2) |
| SQL data tables follow only model Actions; the Entity editor saves the row as an instance update | `sqlDbEntityStoreSectionMixin.ts`, `SqlDbStoreSection.ts`, `EntityEditor.tsx` | items 7 and 9 (D2) |
| No attribute rename Action: `alterEntityAttribute` declares `addColumns`, `removeColumns` and `update`, and the SQL store applies only the first two | `ModelActionAlterEntityAttribute` | item 8 (#215) |
| No action creates a Git tag | `gitAction_*` list | item 6 (D3) |
| No restore of a frozen version | — | item 9 (D6) |
| The clone installer puts `data` in the work tree and skips a deployment otherwise | `gitAction_installClonedDeployment`, `GitClonedDeployments.ts` | item 10 (D7) |
| One deployment per application per process | `ApplicationDeploymentMap` | accepted (D5) |
| No application feature switches | — | item 11 (D8) |

## 8. Epic items 6 to 11

| # | Item | Holds | Depends on |
|---|---|---|---|
| 6 | **#708** Trace revival and model states | Q16 to Q20, Q24, Q28, Q29 (the checks at freeze and at Git commit), Q30; D3, D4 (`ModelStateSource`, replay, all-types attribute-level diff), D11; the `versioned-git` and `evolutionTraces` parameters; trace records and a writable `modelVersion` in both settings; the capability gate on model commits | #696 |
| 7 | **#9 rescoped**: Migration, generation, runner, state record | Q10, Q21 to Q23, Q29 (the generation check); D1, D2 (phases, idempotent storage creation on every store, resumable runner), D5 (authoring and following roles), D10, D12 | 6 |
| 8 | **#215** paired data migrations | fill steps tied to structure steps; the rename case of section 5.3 | 7 |
| 9 | **#709** Restore points and rollback | Q11, Q31, Q32; D6; the add-only reconciliation shared with item 7 (D2) | 7 |
| 10 | **#710** Experiments | the two test cases of section 9, built up as items 6 to 9 land; D7; a failure case (a run stopped halfway, then resumed) | 6, 7, 9 (8 for the rename variant) |
| 11 | **Application feature switches** (new) | D8 | 10 |

## 9. The two first experiments

Both run on Library, in the filesystem nonreg tier, as MiroirTests tagged `filesystem` (#495). One process holds one deployment of an application (D5), so a test case plays the following deployment with the same deployment. It restores the earlier version, re-seeds the Library fixture data for that version, marks the deployment as following, and then runs the migration. Restoring the model does not bring data back (Q11), so the fixture stands in for the store backup that is out of scope. A second run, with two environments sharing `modelVersion` (D5-a), belongs to a follow-up of item 10.

| Step | E1, no Git (`versioned-internal`, traces on) | E2, Git (`versioned-git`, traces on) |
|---|---|---|
| Setup | Library with a `modelVersion` section (as `libraryVersionedTestbedInitParams` does today) | Library copied into a fresh directory, `gitAction_init`, first commit; data outside the work tree (D7) |
| Version 1 | freeze `1.0.0` | commit, tag `1.0.0` |
| Change | add optional `Book.isbn` | same |
| Version 2 | freeze `1.1.0`; the agreement check passes | commit (agreement check), tag `1.1.0` |
| Migration | generate `1.0.0` → `1.1.0`: a jump and one empty fill step, all backward-compatible; the test fills it | generate from the tags |
| Apply | restore `1.0.0`, re-seed the fixture, mark as following, run the migration; check data and state record; run it again and check that nothing changes | checkout `1.0.0`, re-seed, run, check |
| Rollback | restore `1.0.0`: allowed, and `isbn` stays in storage | checkout `1.0.0`: allowed |
| Breaking change | as author: remove `Book.isbn`, freeze `1.2.0`, generate: the contract step is flagged. Then as follower: apply `1.1.0` → `1.2.0`, and restore `1.1.0`: refused, naming the migration | same with tags |
| Edit outside Miroir | change a Report file by hand: freeze refused with the difference; re-baseline; freeze passes | same, at Git commit; re-baseline marker committed (D11) |
| Failure | stop the runner after its first step, then run again: it resumes and ends in the same state | same |

A third run of E1, on PostgreSQL, checks D2: the migration adds the columns, the restore keeps them, and a second run does not empty any table.

---

## Next step

Once the goals and D1 to D12 are confirmed:
1. Rescope #9 as item 7.
2. Create the issue for item 11 if D8 is accepted.
3. Write a TDD plan per item, following `miroir-analysis-to-tdd-plan`.

The issues for items 6, 9 and 10 exist: #708, #709 and #710.
