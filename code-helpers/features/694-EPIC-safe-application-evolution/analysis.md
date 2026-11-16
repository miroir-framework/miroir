# 694 — Safe application evolution: ways of working with and without Git

> This analysis covers how an application designer creates versions, prepares data migrations, moves a test deployment to a new model and rolls it back, in two cases: with the model in a Git repository and without. It covers both a strict versioning workflow and continuous delivery. It turns the #694 grilling decisions into the mechanisms each combination uses, finds what the code does not support yet, and frames epic items 6 to 10.

Related issue: https://github.com/miroir-framework/miroir/issues/695
Parent issue: [#694](https://github.com/miroir-framework/miroir/issues/694) · Prerequisites: #225 ✅, #230 ✅, #589 ✅, #703 ✅, #706 ✅
Related analyses: [216 freeze ADR](../216-FEATURE-application-versions-and-freeze/analysis.md) (D2 Option A / B, D6), [#9 WP1](../9-FEATURE-create-migrations-for-model-and-data-updates/wp1-analysis-model-evolution-trace.md) and [WP2](../9-FEATURE-create-migrations-for-model-and-data-updates/wp2-analysis-application-version-migrations.md), [679 Git](../679-FEATURE-git-version-control/analysis.md) (section 7), [576 feature switches](../576-DESIGN-feature-switches/analysis.md), [273 process capabilities](../273-FEATURE-process-capability-switches/analysis.md)
Epic documents in this folder: [decisions.md](decisions.md) (the grilling outcome, Q1 to Q32), [grilling-round-1.md](grilling-round-1.md), [grilling-round-2.md](grilling-round-2.md), [grilling-round-3.md](grilling-round-3.md), [status-review-2026-11-06.md](status-review-2026-11-06.md)
Key sources: [`applicationVersionFreeze.ts`](../../../packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts), [`versioningMode.ts`](../../../packages/miroir-core/src/1_core/versioning/versioningMode.ts), [`evolutionTracePolicy.ts`](../../../packages/miroir-core/src/2_domain/evolutionTracePolicy.ts), [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts), [`PersistenceStoreController.ts`](../../../packages/miroir-core/src/4_services/PersistenceStoreController.ts), [`SqlDbStoreSection.ts`](../../../packages/miroir-store-postgres/src/4_services/SqlDbStoreSection.ts), [`sqlDbEntityStoreSectionMixin.ts`](../../../packages/miroir-store-postgres/src/4_services/sqlDbEntityStoreSectionMixin.ts), [`miroir-git-isomorphic`](../../../packages/miroir-git-isomorphic/src/index.ts)

**Document role:** epic analysis and decision record. The decisions Q1 to Q32 are settled in [decisions.md](decisions.md) and are not reopened here. This document cites them as `Qn`, and it adds the decisions D1 to D12 that the grilling left open or did not see. Where a D decision narrows a Q decision, it says so.
**Status:** accepted (2026-11-08): goals G1 to G8 and decisions D1 to D12. D9 stays deferred. Revised 2026-11-16 after #9: D2, D5 and D6 changed, and D13 is open (see the history).
**Document history:**
- 2026-11-07: first draft. An adversarial review (a code fact check and an attack on the design) changed D2, D4 to D6 and D10, and added D11 and D12. Greptile's review of #711 added the Git migration's place at its target tag and repeatable data steps (D2).
- 2026-11-08: the user's review. Every decision now states its question. D12 now takes the traces as its source and checks them against the diff; the earlier diff-only choice is kept as D12-a. Section 5.3 plans a composite rename Action, D4 is corrected about `MetaModel`, D9 is rewritten with an example, and D8 is accepted. Later that day the user accepted all the goals and decisions.
- 2026-11-14: wording only, no decision changed. The one-letter shorthands of the settings (N, G) and of the workflows (S, C) are replaced by the `versioningMode` values `versioned-internal` and `versioned-git` and by the workflow names strict and continuous delivery; G also clashed with the goal labels G1 to G8. Issues #708, #709 and #718 were reworded the same way; older documents may still say setting N (no Git) and setting G (Git).
- 2026-11-16: the user's review after #9 found the context unclear. Without Git, a following deployment now gets a Migration by reading the authoring deployment's `modelVersion` section or by importing it as a JSON file, like a package manager updating a local install (D5). A Migration replays the traced model Actions, with the designer's data steps placed among them, instead of a "jump" of the model between expand and contract phases (D2); the term "jump" is dropped. The restore is for rollback and installs only (D6). With Git, what runs on a following deployment after a pull or checkout changes its model is open (D13). Sections 3 to 5, 8 and 9 follow, and section 7.3 lists what #9 built that this revision changes.
- 2026-11-16, later: the user set a **strict strategy** for the whole epic (section 6, before D1). Without Git, a replayed `createEntity` fails when its storage exists, a run never runs a step twice, and steps are no longer repeatable (D2). Section 7.2 follows. #745 holds the details.

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
| **Following deployment** | A test, validation or production deployment. It gets versions and Migrations from the authoring deployment, by reading its `modelVersion` section or by importing a package (D5), runs Migrations, and never writes to `modelVersion`. |
| **Trace record** | One Miroir `commit` (one model transaction): the ordered resolved model Actions it ran (Q16, Q28). |
| **Migration** | An instance of the `Migration` Entity in `modelVersion`: the ordered list of steps that moves a following deployment, model and data, from one version to the next (Q10). Without Git, its steps are the traced model Actions between the two versions, in order, with the designer's data steps placed among them (D2). With Git, what a Migration holds is open (D13). |
| **Package** | A JSON file holding a Migration, exported from the authoring deployment and imported by a following deployment that cannot read the authoring `modelVersion` section, as a package manager updates a local install to version X (D5, D9). |
| **Deployment state record** | A row in Admin data, keyed by Deployment uuid. It records the version the deployment's model and data are at, the migrations applied and the steps done in a running one, and whether the deployment authors or follows (Q22, D5). |
| **Restore point** | A version that a deployment's model can be brought back to (Q11). It is not a separate concept: every version is one. |
| **Re-baseline marker** | A record that closes the open traces after the model was corrected outside Miroir or restored (Q30, D11). |
| **Backward-compatible step** | A step after which the data still fits the model it started from. Only expanding steps qualify: add an Entity, add an optional attribute, fill values. |

## 4. The two settings and the two workflows

### 4.1 Settings

| Setting | `versioningMode` | Where the model lives | Where versions live | Process capabilities needed |
|---|---|---|---|---|
| **`versioned-internal`** (no Git) | `versioned-internal` | `model` section, any store but `bundled` | `modelVersion` section, frozen rows | `versioning` (#696) |
| **`versioned-git`** (Git) | `versioned-git` (today `versioned-external`, Q24) | `model` section on the filesystem, inside a Git work tree | Git tags. A writable `modelVersion` folder, committed with the model, holds traces and migrations only. This is new: today `versioned-external` has no `modelVersion` (`docs/reference/versioning.md`, `DomainController.ts` skips history fetches for it). | `versioning` and `git` |
| `unversioned` | `unversioned` | any | none | none |

### 4.2 Workflows

| | **Strict** | **Continuous delivery** |
|---|---|---|
| Version names | `major.minor.patch`. The bump follows the migration: a breaking step means a major bump. | any increasing label, for example a build number or a date |
| Versions created | at release | at each deploy |
| Migration between releases | may hold breaking steps | must be backward-compatible; a breaking change is split over two releases (expand, then contract) |
| Rollback | refused past a breaking step; a store backup is the fallback (Q31) | always possible, since every migration is backward-compatible |
| Unfinished features | kept on a branch until release | released switched off (feature switch, D8) |
| Packaging | a release package per version (D9) | the deployed version itself |

### 4.3 Mechanisms per combination

| Mechanism | `versioned-internal`, strict | `versioned-internal`, continuous delivery | `versioned-git`, strict | `versioned-git`, continuous delivery |
|---|---|---|---|---|
| Version | frozen `SelfApplicationVersion` (exists) | same | Git tag (create: missing, D3) | same |
| Snapshot of a version | `*Version` rows (exist, all element types since #706) | same | `*_model/` folder at the tag (reading it: missing, D4) | same |
| Evolution traces | records in `modelVersion` (revival, item 6) | same | same, committed with the model | same |
| Snapshot diff | `diffEntityVersionSnapshots`, Entities only (exists); all types and attributes (missing, item 6) | same | same diff on two Git states | same |
| Migration | `Migration` instance: traced model Actions and data steps (item 7, D2) | same, backward-compatible only | open (D13) | open (D13) |
| How a following deployment gets it | reads the authoring `modelVersion` section, or imports a package (D5) | same | the repository: fetch, pull or checkout | same |
| Deployment state record | Admin row (item 7) | same | same | same |
| Agreement check (Q29) | at freeze | at freeze | at Git commit | at Git commit |
| Re-baseline (Q30) | freeze of the live model plus marker | same | marker committed with the model, no freeze (D11) | same |
| Move a following deployment to a version | run the Migration (D2) | same | Git changes the model files (pull, checkout); what runs on storage and data afterwards is open (D13) | same |
| Bring a model back to a version (rollback, install) | restore action (missing, D6) | same | checkout of the tag (exists), plus the Q31 check | same |
| Feature switches | — | application switches (missing, D8) | — | same as `versioned-internal`, continuous delivery |
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

### 5.1 `versioned-internal`, no Git

1. **Create a version.** The designer freezes the model as `1.0.0` from the freeze Runner (exists, #225). Since #706 the freeze snapshots every model element. With traces on (item 6), the freeze first checks that the previous version plus the trace records equal the live model (Q29). On a mismatch it refuses and lists the differences.
2. **Change the model.** The designer adds `isbn` to `Book` in the Entity editor and commits. The commit writes one trace record (Q16), which holds an update of the `Book` Entity row. That update does not alter a SQL table, as a non-regression test checks on PostgreSQL (#715, `entityRowUpdateSqlTable.integ`):
   - the commit replays the `updateInstance`, which goes to `PersistenceStoreController.upsertInstance`, then to the SQL `upsertInstance` (`sqlDbInstanceStoreSectionMixin.ts`), which runs `sequelizeModel.upsert` on the Entity table only;
   - only `alterEntityAttribute` runs `sync({ alter: true })` on the data table (`sqlDbEntityStoreSectionMixin.ts`), and no UI emits it.

   On the authoring deployment the SQL table therefore lacks the column until something alters it. For a following deployment, generation turns the row update into the `alterEntityAttribute` that adds the column (step 4, D12).
3. **Freeze `1.1.0`.**
4. **Prepare the migration** (item 7). "Prepare migration from `1.0.0` to `1.1.0`" replays the trace records on the `1.0.0` snapshot and compares the result with the `1.1.0` snapshot (Q29). It then writes a draft `Migration` from the trace records, in their order (D2, D12). The update of the `Book` row becomes the step "add optional attribute `isbn` to `Book`": an `alterEntityAttribute` that adds the column, then the update of the row. Applied to `1.0.0`, the model steps give exactly `1.1.0`, and the draft shows this comparison as its evidence. The draft holds, in order:
   - add `isbn` to `Book` (model);
   - fill `isbn`: an empty data step after it, which the designer completes (a transformer computing `isbn`).

   Each step is classified; here both are backward-compatible.
5. **Move the test deployment** (item 7). The test environment is another Miroir process, since a process holds one deployment per application (D5). It gets the Migration from the authoring deployment's `modelVersion` section, if it can read it, or imports it as a package (D5). Its state record marks it as following at `1.0.0`. The runner:
   - checks that the deployment is at `1.0.0`;
   - runs the steps in order, with tracing suppressed: the `alterEntityAttribute` adds the `isbn` column, the `Book` row is updated, and the fill step computes `isbn`;
   - records each step in the state record as it goes, so a stopped run resumes at the first step not recorded.

   The record ends at `1.1.0` with the migration listed. A brand-new test deployment starts from the model of `1.0.0`, installed by the restore action (D6) from the authoring `modelVersion` section or from a package (D9), followed by its fixture data.
6. **Roll back** (item 9). The operator restores `1.0.0` on the test deployment (D6). The state record shows that only backward-compatible steps ran since `1.0.0`, so the restore runs. The extra `isbn` column stays in the data.

### 5.2 `versioned-git`, Git

1. **Create a version.** The designer commits from the Git page, then tags the commit `1.0.0` (D3; the tag carries the version name, D10). With traces on, the Git commit checks that the model at `HEAD` plus the trace records being committed equal the working model (Q29). Otherwise it refuses to commit the application's files.
2. **Change the model.** Same as for `versioned-internal`. The trace record is a new file under `modelVersion/`, committed with the model change. New files never conflict in a merge (Q16).
3. **Commit.**
4. **Prepare the migration, then tag `1.1.0`** (provisional, D13). Same as for `versioned-internal`, with the two model states read from tag `1.0.0` and from `HEAD` (D4). The `Migration` instance is committed, and only then is the commit tagged `1.1.0`, so that a migration into a version is part of that version.
5. **Move the test deployment.** The test environment has its own clone, and its data section is outside the clone (D7). The operator pulls, or checks out `1.1.0`: Git rewrites the model files, and the reload rereads them (#681, `loadConfigurationFromPersistenceStore`). What else must run then is open (D13):
   - storage for what the model added, such as the `isbn` column when the data is in SQL; Git does not create it;
   - data steps, such as filling `isbn`, and where they come from;
   - how the state record learns that the deployment is at `1.1.0`.

   #9 built a provisional answer, listed in section 7.3.
6. **Roll back.** The operator checks out `1.0.0` on the Git page, after the Q31 check (Q32).

### 5.3 Continuous delivery: a breaking change

Renaming `Book.year` to `Book.publicationYear` in one release breaks rollback. The designer releases it in two steps:
1. Release *n*: expand with `publicationYear`, a fill step copies `year` into it, and the application reads `publicationYear`. This release is backward-compatible.
2. Release *n+1*: contract by dropping `year`. This step is not backward-compatible: once it has run, rolling back to *n* is refused.

Generation flags step 2 (Q23, D1). No model Action renames an attribute today. `alterEntityAttribute` declares `addColumns`, `removeColumns` and `update`, and the SQL store applies only the first two. A rename is therefore a remove plus an add, and the removed column's data is lost unless a fill step copies it before the contract step drops it. Today neither a trace nor a diff can tell a rename from a remove plus an add, so the designer says which it is in the migration draft.

Renaming an attribute is on the program, in item 8 (#215). It comes as a composite Action, `renameEntityAttribute` (working name), built from the steps above:
- add the new attribute;
- copy the values;
- remove the old attribute.

In the strict workflow it runs as one migration. In continuous delivery the same composite splits over two releases: the add and the copy go in release *n*, and the remove in release *n+1*. For generation (D12) to know that it is a rename and not a remove plus an add, the trace has to keep the composite. Today it would not: a composite Action runs its children one by one (`DomainController.handleCompositeActionInternal`), and the trace writer stores each child with no link to its parent. Item 8 therefore extends the trace record (Q16): a composite Action is recorded as one entry that carries its name, its parameters (the Entity and the old and new attribute names) and a rename id, with its resolved children inside. When the rename spans two releases, the remove in release *n+1* carries the same rename id. Until item 8 lands, the designer confirms renames in the draft. Because it is built only from existing Actions, it is a showcase of how Miroir composes Actions.

---

## 6. Decision record

**Strict strategy (the user, 2026-11-16).** Every decision of this epic follows it: an operation that meets a state it did not expect fails with an error naming that state. It never repairs, skips, reuses or overwrites silently, and it leaves what it found as it was. A storage space that exists where a model Action would create one, a step whose outcome is unknown, a deployment whose model is not the one its state record names: each one stops the operation.

Settings are named by their `versioningMode` value: `versioned-internal` keeps versions as frozen rows in `modelVersion`, without Git, and `versioned-git` keeps the model in Git, with versions as tags (section 4.1). Workflows are named strict and continuous delivery (section 4.2). Each decision is stated as the question it answers.

| Decision | Choice | Serves |
|---|---|---|
| D1. Does an application need a `deliveryStyle` field to choose between the strict and the continuous workflow? | **No.** Each migration step is classified backward-compatible or not, whatever the workflow | G2, G5, G6 |
| D2. How do a deployment's model and its storage (tables, collections) reach a target version without losing data? | ~~Migrations jump the model to the version, between expand and contract data steps~~ **Revised 2026-11-16: without Git, a Migration replays the traced model Actions in order, with the data steps placed among them; the model Actions change the storage. With Git: open (D13)** | G3, G5 |
| D3. How does a designer create a version when the model is in Git? | **A Git tag, created by a new `gitAction_tag`**; freeze stays refused | G1, G8 |
| D4. Where does Miroir read "the model at state X" from: a frozen version, a Git ref, or the live model? | **One `ModelStateSource`: a frozen version, a Git ref, or the live model** | G2 |
| D5. Without Git, how does a test environment get the versions and migrations made in the dev environment? | **Revised 2026-11-16: by reading the authoring deployment's `modelVersion` section, or by importing a package (a JSON file holding the Migration)**, as a package manager updates a local install | G3 |
| D6. Without Git, how does an operator bring a deployment's model back to a frozen version? | **A new model action rewrites the live model from a version's snapshot**, used for rollback and to install a version on a new deployment (revised 2026-11-16: no longer part of a Migration run) | G3, G5 |
| D7. When a Git-backed deployment's data is migrated, where does that data live? | **Outside the Git work tree** | G3, G8 |
| D8. Do application feature switches belong in this epic? | **Yes, as a separate epic item (11, #712)**, analysed on its own; items 6 to 10 do not depend on it | G6 |
| D9. In the strict workflow, what does a release deliver to the people who run test or production deployments, and is it needed now? | **Deferred**: with Git the repository at a tag is the release; without Git, packages are analysed after the experiments | G1, G3 |
| D10. How does a Migration, a state record or a trace name a model state? | **By version name**, the same name as the Git tag; the live model is never stored as a reference | G2, G4, G8 |
| D11. With Git, how are trace records ordered, and how is a re-baseline done when freezing is not allowed? | **`previousTrace` plus a sequence number in both settings; the Git re-baseline is a committed marker, without a freeze** | G1, G8 |
| D12. Where do a migration's structure steps (add, remove or rename an attribute or an Entity) come from? | **From the trace records, checked against the attribute-level diff of the two model states**; the diff alone when traces are off | G2 |
| D13. With Git, what runs on a following deployment after Git changes its model? | **Open (2026-11-16)** | G3, G8 |

Also needed, though not a choice: when the `versioning` capability is off, model commits of an application with `evolutionTraces` on are refused. Otherwise its traces would have gaps that only a re-baseline repairs (Q20, Q30). Miroir's own SelfApplication ships with `evolutionTraces` off, so a process without the capability can still edit Miroir's model (G7). Item 6 implements this.

### D1. Does an application need a `deliveryStyle` field to choose between the strict and the continuous workflow?

**Status:** Accepted (2026-11-08) — D1-b. **Serves:** G2, G5, G6.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D1-a. `deliveryStyle: strict \| continuous` on SelfApplication (Q24 left it open) | the Q23 warning shows only for `continuous` | explicit | a third parameter; strict designers also want to know that a step breaks rollback, so that they bump the major number |
| **D1-b. Classify every step** ★ | generation marks each step `backwardCompatible`, the `Migration` carries the conjunction, and Q31 reads it | one rule serves both workflows: strict uses it for the version bump, continuous for the warning | there is no place to turn the warning into an error for some applications only |

**Decision:** D1-b. This widens Q23: the warning shows in both workflows. Generation pre-fills the flag for the steps it writes. The designer sets it for steps they edit or write by hand (Q10, Q30), and Q31 trusts it. D1-a comes back if the experiments want the warning to become a refusal for some applications only.

### D2. How do a deployment's model and its storage (tables, collections) reach a target version without losing data?

**Status:** Accepted (2026-11-08) — D2-d. Revised (2026-11-16) — D2-a for `versioned-internal`; `versioned-git` moves to D13. **Serves:** G3, G5.

Two facts about the code shape this decision.

**Creating storage is destructive on three stores.** `createStorageSpaceForInstancesOfEntity` empties an existing storage space:
- SQL runs `sync({ force: true })`, which drops the table (`SqlDbStoreSection.ts`, line 275);
- IndexedDB clears the existing sublevel (`IndexedDbStoreSection.ts`, `createStorageSpaceForInstancesOfEntity`);
- MongoDB runs `deleteMany({})` (`MongoDbStoreSection.ts`).

Only SQL has `createStorageSpaceForInstancesOfEntityIfMissing` (`SqlDbStoreSection.ts`, line 304; `PersistenceStoreController.ts` uses it when it exists). Correction (#745 analysis, D4): that is what `createStorageSpaceForInstancesOfEntity` does; `createEntity` itself drops and recreates the table on SQL only, while the IndexedDB, MongoDB and filesystem mixins skip the creation when the Entity is registered and reuse the storage. Either way, a replayed `createEntity` on existing storage loses or adopts data silently; under the strict strategy it fails (#745).

**SQL columns follow the model only through model Actions.** `alterEntityAttribute` updates the Entity row and then runs `sequelizeModel.sync({ alter: true })` on the data table (`sqlDbEntityStoreSectionMixin.ts`, `alterEntityAttribute`, lines 199 to 267). Booting a SQL section only maps the Entities to tables and widens old varchar columns (`SqlDbStoreSection.bootFromPersistedState`, lines 97 to 140, and `widenLegacyStringColumns`). So an Entity row changed any other way leaves the table as it was. The other ways are a restore from a snapshot, a Git checkout, or the generic instance editor, which is what the Entity editor uses today.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. Replay model steps** ★ (2026-11-16, `versioned-internal`) | a migration runs the traced model Actions; restore and checkout replay too | close to the trace | destructive on re-run (above); a Git checkout has already rewritten the files; a data step that needs a removed attribute cannot run once the model lacks it |
| D2-b. Full reconciliation at boot | SQL boot runs `sync({ alter: true })` on every table | simple | rolling back drops the columns that a later version added, along with their data; it costs every boot (G7) |
| D2-c. Replay model steps, add-only reconciliation after a restore or checkout | as in the first draft | rollback keeps data | keeps the faults of D2-a |
| D2-d. Expand, jump, fill, contract (2026-11-08, superseded) | see below | one mechanism for both settings and every element type; idempotent; a fill step reads the old and new attributes side by side | a dropped attribute stays in storage until a contract step drops it; the runner needs a resumable state |

How D2-d worked (superseded on 2026-11-16, kept for the record):
- **Expand** steps are data steps that run on the starting model.
- **Jump** brings the model to the target version: restore (D6) for `versioned-internal`, checkout for `versioned-git`. It is followed by an add-only storage reconciliation: missing storage spaces and columns are created, existing ones are kept.
- **Fill** steps are data steps that run on the target model. Columns that the target removed are still in storage, so a fill step can read them through a raw store read.
- **Contract** steps explicitly drop storage (a column or a storage space) that the target model no longer declares.
- Reconciliation also runs after any change to an Entity row through the instance editor, so the authoring deployment's storage follows its own edits. It never runs on a plain boot.
- Every store gets an idempotent `createStorageSpaceForInstancesOfEntityIfMissing`.
- The runner checks that the deployment is at the `from` version and copies the `Migration` into the state record before its first step, so a restarted run does not depend on what the model section holds. It writes each finished step into the state record, and a run that stops halfway resumes from the first step not recorded.
- A step can stop after writing data and before its record is saved, so every data step must be safe to repeat. Generated steps are written that way (for example, fill `isbn` only where it is empty). A step edited or written by hand is declared repeatable by the designer, as for `backwardCompatible` (D1). Where the store has transactions (SQL), the step's writes and its record commit together.
- Tracing is suppressed during a run.

**Decision (2026-11-08):** D2-d. Item 7 owns the runner, the phases and the idempotent storage creation. Item 9 owns the restore and shares the reconciliation. The experiments include a SQL run.

**Revised decision (2026-11-16): D2-a for `versioned-internal`.** The user's review after #9 answered the cons of D2-a:
- *Destructive on re-run.* A following deployment at `from` has no storage for an Entity that a later trace creates, so a replayed `createEntity` makes empty storage, as expected; the Entity keeps the uuid it has on the authoring deployment. Only a second run of the same action would meet existing storage. Under the strict strategy, a `createEntity` whose storage exists fails on every store, and leaves it as it was; the runner never runs a step twice (below).
- *A Git checkout has already rewritten the files.* This concerns `versioned-git` only, which moves to D13.
- *A data step that needs a removed attribute.* The order solves it: such a step goes before the model Action that removes the attribute.

How D2-a works for `versioned-internal`:
- A Migration is one ordered list of steps. Its model steps are the traced model Actions between the two versions, in trace order. An Entity changes only through model Actions (#748), so its traced changes replay as they are (D12).
- The designer places data steps in the list: a step that fills an attribute goes after the Action that adds it; a step that reads an attribute goes before the Action that removes it. No phases are named. Generation therefore writes each added and each removed attribute as its own step, even when one `alterEntityAttribute` did both: a copy from the old attribute to the new one (a rename, section 5.3) then has a place between the add and the remove.
- The model Actions create, alter and drop storage, so no reconciliation runs. A drop is a traced `dropEntity` or a `removeColumns`, classified not backward-compatible (D1).
- A replayed `alterEntityAttribute` changes only the columns it names. On SQL it runs `sync({ alter: true })` today, which also drops the columns the model lacks: after a rollback that kept a later version's column (D6), replaying an earlier Migration would drop that column and its values. Item 7 has to restrict the alter to the named columns.
- The runner checks that the deployment is at `from`, copies the Migration into the state record before its first step, and runs one step at a time with tracing suppressed. It records a step as started before running it and as done after. A rerun resumes at the first step not started. A step started and not done stops the run with an error naming it: the operator settles it by hand. A Migration the deployment already applied fails. Steps need not be repeatable (strict strategy, 2026-11-16).

`versioned-git`: Git changes the model files, so a replay of model Actions does not apply as is. D13 holds the question.

### D3. How does a designer create a version when the model is in Git?

**Status:** Accepted (2026-11-08) — D3-a. **Serves:** G1, G8.

The Git page lists and checks out tags (`miroir-git-isomorphic`, `git.listTags`, `log` decorations), but no `gitAction_*` creates one. The existing actions are `checkout`, `clone`, `commit`, `commitFiles`, `createBranch`, `deleteBranch`, `diff`, `fetch`, `init`, `installClonedDeployment`, `log`, `pull`, `push`, `revert`, `setCredential`, `setRemote`, `stage`, `status` and `unstage`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. `gitAction_tag`** ★ | an annotated tag on a commit, from the Git page; push sends tags | one history (Q7); Git users know tags | needs the `git` capability |
| D3-b. Freeze writes a commit and a tag | the freeze Runner also tags | one button for both settings | freeze would call Git, which 679 section 7 rules out for the Miroir `commit`; freeze would have two meanings |

**Decision:** D3-a, in item 6.

### D4. Where does Miroir read "the model at state X" from: a frozen version, a Git ref, or the live model?

**Status:** Accepted (2026-11-08). **Serves:** G2.

Migration generation, the agreement check (Q29) and restore all need "the model at state X". There are three sources:
- frozen `*Version` rows (`versioned-internal`);
- the `*_model/` files at a Git ref (`versioned-git`), read with isomorphic-git `readTree` / `readBlob`, without a checkout;
- the live model.

A `ModelStateSource` interface in the versioning package (#696) returns the same in-memory shape for each: a map from element type to rows, covering every snapshotted type. #703 added Blob and Test to the meta-model's Entity list (`defaultMiroirMetaModel.entities`), so every application's model has these Entities. The `MetaModel` type (`miroirFundamentalType.ts`, line 10703), which holds a model's rows in memory, still has no collection for Blob, TestConfiguration or Test rows; its `tests` collection holds MiroirTest definitions. #708 settles it (its D7-a): `MetaModel` gains a collection for every Entity of the meta-application that it lacks, and `ModelStateSource` returns a `MetaModel`. The trace replay, the all-types diff and the agreement check take two sources. The Git implementation lives in `@miroir-framework/git-isomorphic` and loads lazily. Item 6 owns D4, the replay and the diff, because the Q29 checks at freeze and at Git commit need them before migrations exist.

### D5. Without Git, how does a test environment get the versions and migrations made in the dev environment?

**Status:** Accepted (2026-11-08) — D5-a for the experiments. Revised (2026-11-16) — D5-a read-only or D5-b as a package, for `versioned-internal`. **Serves:** G3.

A process holds one deployment per application: `ApplicationDeploymentMap` maps an application uuid to one deployment uuid (`1_core/Deployment.ts`, line 66). A test deployment of Library is therefore another process, with its own environment (`environments/*.json`). Each deployment configures its sections separately, so two environments can point their `modelVersion` sections at the same directory or SQL schema while `model` and `data` differ.

`evolutionTraces` lives on the SelfApplication row, which is model, so a test deployment has traces on as well. If it wrote traces, re-baseline markers or versions to the shared `modelVersion`, it would break the authoring deployment's `previousTrace` chain (Q19). For `versioned-git` it would also dirty the clone, and `gitAction_checkout` would then refuse. The deployment state record therefore says whether a deployment authors or follows. A following deployment writes nothing to `modelVersion`, and its model commits are refused (section 4.4). Only migrations and restores change its model.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. Shared `modelVersion` storage, read-only for followers** ★ | dev and test environments configure the same `modelVersion` store | no new transport | needs a store that both can reach |
| D5-b. Version package | export a version (snapshot, migrations) as files, import it in the test environment | works across networks; it is the strict workflow's "package" | new export and import actions (D9) |
| D5-c. Read through the dev server | the test environment asks the dev server | always fresh | couples environments at run time |

**Decision:** D5-a for items 7 and 10, D5-b with D9. Item 7 owns the authoring and following roles.

**Revised (2026-11-16, by the user), for `versioned-internal`:** a following deployment does not share the authoring deployment's `model` or `modelVersion` sections. It gets a Migration in one of two ways:
- it has read access to the authoring deployment's `modelVersion` section and takes the Migration from there (D5-a, read-only);
- it receives the Migration as a JSON file and imports it (D5-b), as a conventional package manager updates a local install to version X, for example through a migration Runner.

Both lead to the same migration run. Amended the same day (the user, #745 D6): for now, a migration run is possible only after the deployment's actual model has been checked against a reference, the frozen `from` and `to` versions, read from the authoring deployment's `modelVersion` section or from a reference package of each version, in addition to the Migration (its package or JSON file). The model steps still come from the Migration alone: the reference is compared with, never written.

### D6. Without Git, how does an operator bring a deployment's model back to a frozen version?

**Status:** Accepted (2026-11-08). **Serves:** G3, G5.

No action reads a frozen version back today. A new model action, `restoreApplicationVersion` (working name), runs on a deployment in five steps:

1. **Q31 check.** It checks Q31 and refuses with the name of the blocking step. For a following deployment, the steps since Vk are the migrations in its state record. For the authoring deployment, whose data changed through live edits, they are the structure steps of the diff from Vk to the live model (D12): if an attribute or Entity of Vk is no longer in the live model, its data has been dropped, and the restore is refused.
2. **Open traces.** It is refused while trace records are open, unless the designer freezes first or confirms discarding the edits. Discarding writes a re-baseline marker (Q30).
3. **Rewrite.** It rewrites the live model rows of every snapshotted element type from the version; rows absent from the version are deleted.
4. **Storage.** It creates the storage of Entities and attributes the version adds, and keeps the storage of those it lacks.
5. **Record and reload.** It records the restore in the state record (and, on the authoring deployment, a re-baseline marker, because the live model was rewritten). It then reloads the model (`rollback`, as after a Git checkout, #681).

It is refused while a Miroir transaction is open, as the Git checkout is (679 D7). On an empty deployment it installs a version, which is how a new test deployment starts. Revised 2026-11-16: a Migration run no longer calls it (D2). It reads the version's snapshot from the authoring `modelVersion` section or from a package (D5). It lives in the versioning package (#696), which needs a way to register model actions from outside core; #696 provides it. Item 9 owns D6.

### D7. When a Git-backed deployment's data is migrated, where does that data live?

**Status:** Accepted (2026-11-08). **Serves:** G3, G8.

The clone installer (`gitAction_installClonedDeployment`) points every section of the installed deployment into the clone, `data` included, and skips a deployment whose sections are not folders of the clone (`GitClonedDeployments.ts`). A checkout of a newer tag then also rewrites the data files that the repository holds (Library commits sample data under `library_data/`), which defeats a migration. A deployment whose data is migrated therefore keeps its `data` section outside the work tree, or on another store. This needs new code: the installer takes a data location outside the clone and seeds it from the repository's sample data. The dev deployment, whose data is sample data, may keep it in the repository. Item 10 owns D7, because E2 needs it.

### D8. Do application feature switches belong in this epic?

**Status:** Accepted (2026-11-08). **Serves:** G6.

Miroir has no switch that an application designer can put on a Report, a Menu item or a Runner. The switches inventoried in #576 are Miroir's own: process capabilities, build profiles and UI toggles. Continuous delivery needs one, so that a released model can carry a hidden feature. It is a model concept (where a switch is declared, where its value lives, what it hides) and deserves its own analysis.

**Decision:** a new epic item 11 (#712), analysed after the item 10 experiments show what they need. Items 6 to 10 do not depend on it.

### D9. In the strict workflow, what does a release deliver, and is it needed now?

**Status:** Deferred. **Serves:** G1, G3.

**What is at stake.** In the strict workflow, a release, say Library `2.0.0`, goes to whoever runs a test or production deployment, possibly on another network. To move their deployment from `1.0.0` to `2.0.0`, they need two things: the model of `2.0.0`, and the migrations from `1.0.0` to `2.0.0`. The question is what carries those two things to them.

- **Model in Git** (`versioned-git`): the repository is the package. The operator clones it from the Git page (#683), or fetches and checks out tag `2.0.0`. The migrations are committed under `modelVersion/` at that tag (D2).
- **No Git** (`versioned-internal`): the version is a set of rows in the `modelVersion` section of the dev environment.
  - A test environment that can read the authoring `modelVersion` section takes them there (D5).
  - A production site that cannot read it needs a package: a JSON file holding the migrations (D5), and the `2.0.0` snapshot rows when the site starts from nothing, exported in dev and imported in production.
  - Nothing exports or imports such a file today. The Admin `bundle` Entity `9f9170da-538d-425c-8cb7-551640623eed` has only `name`, `defaultLabel` and `description`.

**Decision:** deferred. The experiments (item 10) run with D5-a. Packages for the no-Git setting are analysed after them, together with D5-b.

### D10. How does a Migration, a state record or a trace name a model state?

**Status:** Accepted (2026-11-08) — D10-a. **Serves:** G2, G4, G8.

679 section 7 warns that storing Git commit ids in model Entities would tie the model to Git.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D10-a. Version name** ★ | a Migration says `from: "1.0.0"`, `to: "1.1.0"`, and the state record says `1.1.0`. For `versioned-internal`, the name resolves to the `SelfApplicationVersion` of that name on the application's main branch; branches are not managed in `versioned-internal` today (`ApplicationModelBranch.headVersion` is set only at creation). For `versioned-git`, it resolves to the tag of the same name, unique in the repository. | same records in both settings | a moved or deleted tag breaks the link |
| D10-b. Uuid of the version, or commit id | exact | — | Git ids in model rows; two vocabularies |

**Decision:** D10-a. The Git tag carries the version name exactly, with no `v` prefix. The state record may store the commit id as information, never as the key. The live model is a `ModelStateSource` for previews and checks, but a stored Migration or state record always names a version.

### D11. With Git, how are trace records ordered, and how is a re-baseline done when freezing is not allowed?

**Status:** Accepted (2026-11-08). **Serves:** G1, G8. **Narrows:** Q19 and Q30.

One Git commit usually adds several trace records, one per Miroir `commit`, and Git ancestry does not order them. Q30's re-baseline "freezes the live model", which Q7 forbids with Git.

**Decision:**
- Every trace record keeps `previousTrace` plus a sequence number in both settings. For `versioned-git`, Git ancestry orders only the records of different Git commits, and a merge is resolved by a re-baseline.
- For `versioned-git`, a re-baseline writes a marker record that is committed with the model, and no freeze. The marker names the Git commit it closes as information (D10).

Item 6 owns D11.

### D12. Where do a migration's structure steps come from?

**Status:** Accepted (2026-11-08) — D12-b. **Serves:** G2. **Follows:** Q10 (a draft "from traces and snapshot diffs").

**What is at stake.** A migration has to say which attributes and Entities appear, disappear or are renamed between two versions. That decides which steps are backward-compatible (D1), what a Migration drops (D2), and whether a removed column's values are carried over (section 5.3). Two sources can give these structure steps:
- the **trace records**, which say what the designer did, in order;
- the **diff** of the two model states, which says only what differs at the end.

Traces come in two shapes today:
- A model Action (`createEntity`, `alterEntityAttribute`, `renameEntity`, `dropEntity`) is already a structure step.
- An attribute added in the Entity editor is traced as an update of the Entity row (section 5.1, step 2), because no UI emits `alterEntityAttribute`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D12-a. From the diff only | generation compares the two model states, attribute by attribute | works with traces off; one path | loses the order and the intent: a rename looks like a remove plus an add; no evidence of how the model got there |
| **D12-b. From the traces, checked against the diff** ★ | generation reads the trace records in order. A model Action gives its structure step. An Entity row update gives attribute steps, by comparing the row before (from the replay) with the row after. The steps, applied to the `from` structure, must give the `to` structure exactly. The draft shows this comparison as evidence that it represents what was done to the model. | detailed and controllable; keeps the order and the intent (a rename Action, item 8); the draft carries its own proof | two paths, since it falls back to D12-a when traces are off |
| D12-c. From the diff, with traces as hints only | the previous choice of this document | simple | throws away the most detailed source the epic produces |

**Decision:** D12-b. With `evolutionTraces` off, generation uses D12-a and says so on the draft.

**Revised (2026-11-16):** since a Migration replays its model steps (D2), the structure steps are not only a description: they are the model Actions the run executes. With traces off, the steps come from the diff and are written as the same Actions. Revised the same day: instance writes on Entity rows are refused (#748), so the Entity editor emits model Actions and the traces hold only model Actions for Entities; generation refuses a record holding an Entity row write instead of converting it (#745, D2). Item 7 owns generation, and item 6 owns the replay and the diff.

### D13. With Git, what runs on a following deployment after Git changes its model?

**Status:** Open (2026-11-16). **Serves:** G3, G8.

With Git, the model files of a following clone change through Git: a pull, or a checkout of a tag or a branch. After that, the deployment may still need work that Git does not do, but its nature is not settled. What is known:
- Git rewrites the model files and the reload rereads them (#681). No model Action runs, so storage is not created: a SQL data table lacks the column of an added attribute, while a filesystem data folder needs nothing.
- The data may need transformation, such as filling a new attribute.
- The trace records committed between the two commits say which model Actions the designer ran (D11), and could drive that work.
- The state record must learn which version or commit the deployment is at.

#9 built a provisional answer (section 7.3): a Migration committed at the target tag, whose run checks the tag out itself and runs data steps around the checkout. It is not a decision.

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
| Storage creation that keeps an existing SQL table, for lazy `devData` storage (#647) | `createStorageSpaceForInstancesOfEntityIfMissing` (`SqlDbStoreSection.ts`) | done; not used by model Actions (strict strategy) |
| `createEntity` fails where the Entity's row (`entityExists`) or storage (`storageExists`) exists, on every store, before writing; a SQL reset drops orphan tables | `strictEntityCreation.ts` (core), the four store mixins, `storageSpaceExists` | done (#745 D4) |
| A Migration replays the traced model Actions: one ordered list of model and data steps; a step runs once (started, done, in doubt, `settleMigrationStep`); the model is checked against the frozen `from` and `to` | `migrationSteps.ts`, `migrationGeneration.ts`, `migrationRun.ts` | done (#745 D1, D2, D5, D6) |
| SQL `alterEntityAttribute` and `renameEntity` check first and change only what they name | `sqlDbEntityStoreSectionMixin.ts` | done (#745 D7) |

### 7.2 Misaligned or missing

| Gap | Where | Owner |
|---|---|---|
| `versioningMode` is `unversioned \| versioned-internal \| versioned-external`: there is no `versioned-git` and no `evolutionTraces` parameter | `versioningMode.ts`, SelfApplication schema | item 6 |
| `versioned-external` has no writable `modelVersion`; `versioned-git` needs one for traces and migrations | `DomainController.ts` (history fetches skipped), `docs/reference/versioning.md` | item 6 |
| Traces are switched by `MIROIR_EVOLUTION_TRACE` / `VITE_MIROIR_EVOLUTION_TRACE` for the whole process, read from `process.env`, so they are always off in a browser | `evolutionTracePolicy.ts`, `isEvolutionTraceEnabled` | item 6 |
| Traces are written to the `model` section (`data` for Miroir), with one root per application and branch, one event per action, and no resolved Action | `evolutionTracePolicy.ts` `shouldTraceEvolutionEvent`, `evolutionTraceWriter.ts` | item 6 (Q16, Q28, D11) |
| Versioning code sits in core and loads everywhere; model actions cannot be registered from outside core | `1_core/versioning/`, `2_domain/evolutionTrace*.ts` | #696 |
| Snapshot diff covers Entities only, by uuid, with no attribute-level steps (`modelStructureMigration` is always `[]`) | `diffEntityVersionSnapshots`; `applicationVersionFreeze.ts`, line 1346 | item 6 (D4, D12) |
| `MetaModel` has no collections for Blob, TestConfiguration or Test rows (#703 added Blob and Test to the Entity list only) | `miroirFundamentalType.ts` | item 6 (D4) |
| No `Migration` Entity, no runner, no deployment state record, no authoring and following roles | — | item 7 |
| SQL data tables follow only model Actions; the Entity editor saves the row as an instance update, which a Migration cannot replay (`migrationEntityRowWrite`) | `EntityEditor.tsx`, instance writes of Entity rows | #748 |
| Column type, nullability, key and reference changes have no model Action; a Migration holding one is refused | `ModelActionAlterEntityAttribute` | #749 |
| A commit retried after it failed part way replays a `createEntity`, which now fails | `DomainController.ts` (commit retry) | #750 |
| No attribute rename Action: `alterEntityAttribute` declares `addColumns`, `removeColumns` and `update`, and the SQL store applies only the first two | `ModelActionAlterEntityAttribute` | item 8 (#215), as a composite Action |
| No action creates a Git tag | `gitAction_*` list | item 6 (D3) |
| No restore of a frozen version | — | item 9 (D6) |
| The clone installer puts `data` in the work tree and skips a deployment otherwise | `gitAction_installClonedDeployment`, `GitClonedDeployments.ts` | item 10 (D7) |
| One deployment per application per process | `ApplicationDeploymentMap` | accepted (D5) |
| No application feature switches | — | item 11, #712 (D8) |

### 7.3 What #9 built that the 2026-11-16 revision changes

#9 (#739, #740, #742) was built on D2-d and D5-a. The revision changes these parts; #745 implemented every row but the package (#746) and Git (D13, #747):

| Built in #9 | Revision | What it means |
|---|---|---|
| A migration run rewrites the model to the frozen `to` version between its expand and fill steps (`applyModelState`, `bringModelToVersion`) | D2: the Migration replays the traced model Actions; D5 (amended, #745 D6): the migration run reads the Migration and, as a reference to compare with, the frozen `from` and `to` versions | the model part of the migration run comes from the Migration's own steps |
| Generation writes the changes found by the diff, with empty fill and contract steps; the records only vouch for it | D2, D12: the model steps are the traced Actions, which the migration run executes | generation writes the Actions in order |
| Steps grouped in `expand`, `fill` and `contract` | D2: one ordered list, data steps placed among the model steps | the `Migration` row changes shape |
| Steps may hold model actions without Git, are refused them with Git | D2: model steps come from the traces; whether a hand-written step may hold a model Action is part of #741 | #741 is restated |
| The tests share the `modelVersion` section between the authoring and the following deployment | D5: read access or a package | the tests also cover an imported package |
| A migration run resumes by running again the step it was in; steps are repeatable; storage creation would reuse existing storage | strict strategy: a step runs once, an in-doubt step stops the migration run, `createEntity` fails on existing storage | #745 |
| With Git, the migration run reads the Migration at the tag and checks the tag out itself | D13: open | kept as provisional until D13 is decided; #745 makes the checkout the Migration's one model step |
| No export or import of a Migration as a JSON file | D5 | new: export and import |

## 8. Epic items 6 to 11

| # | Item | Holds | Depends on |
|---|---|---|---|
| 6 | **#708** Trace revival and model states | Q16 to Q20, Q24, Q28, Q29 (the checks at freeze and at Git commit), Q30; D3, D4 (`ModelStateSource`, replay, all-types attribute-level diff), D11; the `versioned-git` and `evolutionTraces` parameters; trace records and a writable `modelVersion` in both settings; the capability gate on model commits | #696 |
| 7 | **#9 rescoped**: Migration, generation, runner, state record | Q10, Q21 to Q23, Q29 (the generation check); D1, D2 (built on D2-d; revised to replay, see section 7.3), D5 (authoring and following roles; the package is new), D10, D12 | 6 |
| 8 | **#215** paired data migrations | fill steps tied to structure steps; the composite `renameEntityAttribute` Action of section 5.3, and trace entries that keep a composite and its rename id | 7 |
| 9 | **#709** Restore points and rollback | Q11, Q31, Q32; D6 | 7 |
| 10 | **#710** Experiments | the two test cases of section 9, built up as items 6 to 9 land; D7; a failure case (a run stopped halfway, then resumed) | 6, 7, 9 (8 for the rename variant) |
| 11 | **#712** Application feature switches | D8 | 10 |

## 9. The two first experiments

Both run on Library, in the filesystem nonreg tier, as MiroirTests tagged `filesystem` (#495). One process holds one deployment of an application (D5), so a test case plays the following deployment with the same deployment. It restores the earlier version, re-seeds the Library fixture data for that version, marks the deployment as following, and then runs the migration. Restoring the model does not bring data back (Q11), so the fixture stands in for the store backup that is out of scope. A second run, with two environments, the following one reading the authoring `modelVersion` section or importing a package (D5), belongs to a follow-up of item 10.

| Step | E1, no Git (`versioned-internal`, traces on) | E2, Git (`versioned-git`, traces on) |
|---|---|---|
| Setup | Library with a `modelVersion` section (as `libraryVersionedTestbedInitParams` does today) | Library copied into a fresh directory, `gitAction_init`, first commit; data outside the work tree (D7) |
| Version 1 | freeze `1.0.0` | commit, tag `1.0.0` |
| Change | add optional `Book.isbn` | same |
| Version 2 | freeze `1.1.0`; the agreement check passes | commit (agreement check) |
| Migration | generate `1.0.0` → `1.1.0`: the traced addition of `isbn` and one empty fill step after it, both backward-compatible; the test fills it | open (D13) |
| Apply | restore `1.0.0`, re-seed the fixture, mark as following, run the migration; check data and state record; run it again: refused as already applied, nothing changes | checkout `1.0.0`, re-seed, then as D13 decides |
| Rollback | restore `1.0.0`: allowed, and `isbn` stays in storage. A new run of `1.0.0` → `1.1.0` then meets that column and fails (strict strategy); #709 decides how a rollback treats such storage (#745, section 7) | checkout `1.0.0`: allowed |
| Breaking change | as author: remove `Book.isbn`, freeze `1.2.0`, generate: the removal step is flagged. Then as follower: apply `1.1.0` → `1.2.0`, and restore `1.1.0`: refused, naming the migration | same with tags |
| Edit outside Miroir | change a Report file by hand: freeze refused with the difference; re-baseline; freeze passes | same, at Git commit; re-baseline marker committed (D11) |
| Failure | stop the runner after its first step: run again, it resumes at the second step. Stop it inside a step, after a data write: run again, refused, naming the step in doubt; settle the step, run again, it ends in the same state | same |

A third run of E1, on PostgreSQL, checks D2: the replayed model Actions add the columns, the restore keeps them, and a second run does not empty any table. Two versions each adding an attribute, then a restore of the first and a new run of the first Migration, waits for #709: under the strict strategy that run meets the kept column and fails (#745, section 7).

---

## Next step

The issues exist for every item: #708 (6), #9 rescoped (7), #215 (8), #709 (9), #710 (10) and #712 (11). The next item in the epic order is #696 (versioning package and process capability), which #708 depends on. Each item then gets its own analysis where it needs one, and a TDD plan following `miroir-analysis-to-tdd-plan`.
