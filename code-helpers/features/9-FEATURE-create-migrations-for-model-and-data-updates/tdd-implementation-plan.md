# Issue #9 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController, local cache and emulated server on the filesystem
> store, through the Model Endpoint actions (`generateMigration`, `runMigration`), the creation
> of a deployment, and the instance writes a designer makes. No mocks. The tracer bullet of each
> part proves its thinnest path end to end: a following deployment created at an earlier version
> gets that version's model (A), a draft Migration for one added attribute (B), and that
> Migration run on the following deployment (C).
>
> **Execution model:** human-in-the-loop. No slice contains a commit step: commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/9 · Follow-up: #733
Prerequisites: [`../708-FEATURE-trace-revival-model-states/`](../708-FEATURE-trace-revival-model-states/) ✅, [`../696-REFACTOR-versioning-package/`](../696-REFACTOR-versioning-package/) ✅
Working branch: `claude/project-thread-8d36cr` (assigned by the session), one PR per part (analysis D1)

**Resume note:** plan rewritten 2026-11-15 after the user's first review; the user approved it and asked for one commit per slice and one PR per part, on branches named after the issue (`claude/9-migration-formats-roles` for part A). A1 and A2 done.

---

## Scope

In, from the analysis goals:
- G1 — a draft migration between two versions, with its changes classified, and hand-written migrations (part B).
- G2 — a migration run on a following deployment brings its model to the target version, data kept and transformed (parts A, C).
- G3 — a stopped run resumes and ends in the same state (part C).
- G4 — the deployment's role on its Deployment row, and its state record: version, applied migrations, a run in progress (parts A, C).

Out (analysis section 2): detecting and correcting a model and storage divergence (set aside by the user); Actions for the contract phase (#733); paired data migrations, the composite rename and steps reading removed attributes (#215); the operator's restore action (#709); changing a deployment's role; two processes sharing `modelVersion` and the clone installer change (#710); release packages (epic D9); a migration on the authoring deployment; one SQL transaction per step; store backups.

---

## Progress summary

| Slice | Part | Title | Status | Primary proof |
|---|---|---|---|---|
| A1 | A | A following deployment created at an earlier version (tracer) | ✅ | `followingDeployment.9.phaseA.integ.test.ts` |
| A2 | A | A deployment's role cannot change | ✅ | same file |
| A3 | A | A following deployment refuses model and `modelVersion` writes | ⬜ | same file |
| B1 | B | A draft Migration for one optional attribute (tracer) | ⬜ | `migrationGeneration.9.phaseB.integ.test.ts` |
| B2 | B | Removals, required attributes, renames: classified and stepped | ⬜ | same file |
| B3 | B | Refusals and the diff fallback | ⬜ | same file |
| B4 | B | `versioned-git`: from the tag to `HEAD` | ⬜ | `migrationGenerationGit.9.phaseB.integ.test.ts` |
| C1 | C | A Migration run on a following deployment (tracer) | ⬜ | `migrationRun.9.phaseC.integ.test.ts` |
| C2 | C | A stopped run resumes | ⬜ | same file |
| C3 | C | Runner refusals | ⬜ | same file |
| C4 | C | `versioned-git`: the jump is a checkout of the tag | ⬜ | `migrationRunGit.9.phaseC.integ.test.ts` |
| Z | C | MiroirTest scenario, nonreg steps, docs, cleanup, AC | ⬜ | nonreg steps + `action.scenario.migration` |

Each part ends with a full `npm run nonreg:filesystem -- --runner shared` and its PR.

---

## Locked implementation defaults

The analysis decision record, binding for this plan. Narrowings N1 to N5 (analysis section 3.1) hold once the user signs them off; a change is recorded in the Realization of the slice it affects.

| Decision | Choice | Serves |
|---|---|---|
| D1 | Three parts: A formats and roles, B generation, C runner; a PR each | all |
| D2 | `applyModelState` rewrites the application's own model rows only (`AGREEMENT_COLLECTIONS`, `model` section, meta-model Entities left out); `createEntity` for an added Entity, `alterEntityAttribute` `addColumns` for an added attribute, before the Entity row gets its target value; other rows upserted, absent rows deleted; keeps `parentDefinitionVersionUuid` and `conceptLevel`; following deployments only, writes marked; reloads | G2 |
| D3 | `Migration` row: `application`, `from`, `to`, `source`, `changes`, `expand`, `fill`, `contract`, `backwardCompatible`, `generatedAt`, `description`; a step `{ uuid, name, backwardCompatible, repeatable, action: CompositeActionSequence }` | G1, G2, G3 |
| D4 | Contract steps are `CompositeActionSequence`s; generation leaves them empty and named until #733 | G2 |
| D5 | Admin `DeploymentState`, uuid = Deployment uuid: `deployment`, `application`, `version`, `gitCommit`, `applied`, `run`; no model content but the run's copy; Entity created when absent | G3, G4 |
| D6 | `role` (`authoring` default, `following`) on the Admin Deployment, set at creation, refused on update; a following deployment is created at a version (installed by `applyModelState`, or the clone at the tag); gate in the persistence process reading the Deployment row; run mark | G2, G4 |
| D7 | `generateMigration { application, from, to }`: states, records, agreement, changes from records (renames and `idAttribute` from row diffs), diff fallback, classification, steps, unsupported; refused across a `rebaseline`; one Migration per `from`/`to` unless replaced | G1 |
| D8 | `runMigration { application, migration }` under a lock per application; checks, find (at tag `to` with Git), copy, steps with `stepsDone`, end | G2, G3 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| `Migration` Entity (Miroir model, routed to `modelVersion`) | `b5c1f0e5-3d31-419b-9a6b-21dd598fc3fe` |
| `DeploymentState` Entity (Admin model) | `14e696c6-c9ef-4d50-b2d6-1fd561b315f6` |
| MiroirTest `action.scenario.migration` (appForTest, filesystem) | `79e29346-90d3-4bdd-ae87-43ba9e99268f` |
| `MetaModel` collection of Migrations | `migrations` |
| Deployment attribute | `role`: `authoring` \| `following` |
| Model Endpoint actions (`7947ae40-…`) | `generateMigration`, `runMigration` (`handleAction_generateMigration`, `handleAction_runMigration`, `requiredCapability: versioning`, server-routed) |
| Refusal reasons (`errorContext.reason`) | `deploymentFollows`, `deploymentAuthors`, `deploymentRoleFixed`, `migrationNotAtFrom`, `migrationRunInProgress`, `migrationUnsupportedChange`, `migrationAcrossRebaseline`, `migrationExists` |
| Nonreg steps | `integ-9-following-deployment` (part A), `integ-9-migration-generation` (B), `integ-9-migration-run` (C) |

---

## Test execution conventions

Vitest is the vehicle for parts A to C, as for #708, with one reason per file:
- `followingDeployment.9.phaseA`: it creates a second deployment of appForTest next to the first and sends a marked action straight to the emulated server's DomainController to test the server gate alone, which a MiroirTest cannot do;
- `migrationGeneration.9.phaseB` and `migrationRun.9.phaseC`: they need frozen versions, records edited on disk and two deployments used one after the other, set up by `versioningTestSetup.ts`;
- the two Git files: they need the Git testbed of `gitTestSetup.ts` (a repository, tags, checkouts).

Slice Z adds one MiroirTest scenario that runs the whole path as an `actionTest`.

**Testbed.** Parts A to C run on `test-filesystem`, where appForTest is `versioned-internal` with a `modelVersion` section. One process holds one deployment per application (epic D5), so a test that plays both roles opens the authoring deployment, then closes it and opens a following deployment of appForTest whose `modelVersion` section is the same folder. Slice A1 builds that helper in `versioningTestSetup.ts`.

| Purpose | Command |
|---|---|
| Part tests | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- 9-migrations/<file>` |
| Versioning unit tests | `npm run test -w @miroir-framework/versioning` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run build -w miroir-app-admin && npm run devBuild -w @miroir-framework/core` |
| Rebuild what the standalone-app tests import (their `dist`) | `npm run build -w @miroir-framework/versioning -w miroir-localcache-redux -w miroir-localcache-zustand` (those the slice touched) |
| Deployment validation | `npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts` (and `-w miroir-app-admin`) |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` for core and versioning |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg (end of each part, slice Z) | `npm run nonreg:filesystem -- --runner shared` |

Test files live in `packages/miroir-standalone-app/tests/3_controllers/issues/9-migrations/` until slice Z moves them to feature-named suites.

---

## Part A — Formats and roles

### Slice A1 — A following deployment created at an earlier version (tracer)

**Status:** ✅ DONE

**Goal.** An operator creates a following deployment of appForTest at `1.0.0` and gets `1.0.0`'s model, and its state record says where it stands (G2, G4, D2, D5, D6).

**RED** (`followingDeployment.9.phaseA.integ.test.ts`): on the authoring deployment, freeze `1.0.0`; add an optional attribute to an appForTest Entity and a new Entity, commit, freeze `1.1.0`. Close it; create a second deployment of appForTest with `role: following` at version `1.0.0`, sharing the `modelVersion` folder:
- the live model of the following deployment equals `frozenModelState(1.0.0)` over the agreement collections;
- its `EvolutionTraceRecord` and history Entity rows are in `model`; the shared `modelVersion` rows are unchanged; no record was appended;
- its Deployment row says `role: following`; its `DeploymentState` row says `version: "1.0.0"`, no `applied`, no `run`;
- the rows rewritten keep their live `parentDefinitionVersionUuid` and `conceptLevel`.

**GREEN.**
- `role` on the Admin `Deployment` Entity; the `DeploymentState` Entity file in `miroir-app-admin` with `admin_data/14e696c6-…/.gitkeep` (a filesystem data section refuses rows of an Entity without a folder, and Git drops empty folders; `admin_data/a96856df-…` does the same); the `Migration` Entity file in `miroir-app-miroir`, in `metaModelEntityList`, and a `migrations` collection in `MetaModel`; schema rebuild.
- Deployment creation (`createDeploymentCompositeAction` and its Runners) takes `role` and, for `following`, the version: the versioning package installs it with `applyModelState` (D2) and writes the `DeploymentState` row, with the Entity created when absent.
- The run mark (`markMigrationRun`, `isMigrationRun`) on the rewrite's writes; `applicationsWithEvolutionTraces` leaves following deployments out.
- The test helper that opens a second deployment of appForTest on the same `modelVersion` folder.

**Refactor checkpoint.** `ensureRecordEntity` generalized to "ensure a meta-model Entity in a deployment's section", used by the record, the Migration and the state Entities. The rewrite's row selection shares the freeze's (`selectEntitiesToFreeze`).

**Validation.** The file; `modelValidation` of `miroir-app-miroir` and `miroir-app-admin`; type check core and versioning; `npm run test -w @miroir-framework/core -- ''`; scoped nonreg `smoke,core,actions,external`.

**Realization.**
- Schema: `role` (`authoring` | `following`, optional) on the Admin `Deployment` Entity; the Admin `DeploymentState` Entity (`14e696c6-…`) with its `.gitkeep` data folder, exported as `entityDeploymentState`; the Model Endpoint action `installApplicationVersion { application, version }` (`handleAction_installApplicationVersion`, `requiredCapability: versioning`, server-routed in `SERVER_ROUTED_MIROIR_ACTION_TYPES` and `RestServer`).
- Core: `DeploymentRole`, `deploymentRoleOf` (a row without `role` is `authoring`), `DeploymentStateRow`, `DEPLOYMENT_STATE_ENTITY_UUID` (`versioningInterfaces.ts`); the run mark `markMigrationRun` / `isMigrationRun` next to `markRecordedBySender` (`evolutionTraceRecording.ts`); `deploymentRow(…, role)` and `createDeploymentCompositeAction` options `role`, `installVersion` (`Deployment.ts`); `applicationsWithEvolutionTraces` leaves out a deployment whose cached Deployment row is `following`, through a new `cachedDeploymentRow`, also used by `evolutionTraceRefusal`.
- Versioning: `applicationVersionInstall.ts` with `applyModelState` (D2: `createEntity`, `alterEntityAttribute` `addColumns` before the Entity row update, upsert and delete of the other rows, Entity rows of removed Entities deleted without their storage, `parentDefinitionVersionUuid` and `conceptLevel` kept, every write marked), `storedDeploymentRow`, `storedDeploymentState`, `writeDeploymentState` (the Entity created in Admin when absent), and the handler: it refuses an authoring deployment (`deploymentAuthors`), loads the deployment's model in the process's cache (the model actions read it there), creates the history and record Entities in its model, rewrites, writes the state row, and reloads.
- **Deviations.** (1) The `Migration` Entity and the `migrations` MetaModel collection move to B1, where generation first writes a Migration: part A does not read or write one, and the type regeneration they need is one change with B1's. (2) The following deployment is not created empty: see analysis D6, *Realization (A1)*. The test copies the fixture's model and data folders next to the authoring deployment's and creates the deployment with `skipCreateStore`. Both deployments are open in one process, each through its own application deployment map, instead of one after the other. (3) The refactor checkpoint (`ensureRecordEntity` generalized) is left for B1, where the Migration Entity is its second user; the state Entity is ensured in Admin by a function of its own, since it is created in another application's model.
- Core unit tests: the versioning action lists gained `installApplicationVersion`; the Admin Entity count of `secrets.270.phase0` is 11. `listSelfApplicationUuidPaths` and `remapApplicationModelAtPaths` fail on the branch's base as well (a stale Library snapshot), not touched here.


### Slice A2 — A deployment's role cannot change

**Status:** ✅ DONE

**Goal.** The role is chosen once (D6).

**RED.** An `updateInstance` of the following deployment's Deployment row that sets `role: authoring` is refused with `deploymentRoleFixed`, the row unchanged; an update of another attribute passes; a Deployment row created without `role` reads as `authoring`.

**GREEN.** The check in the persistence process before a Deployment row update.

**Refactor checkpoint.** None expected.

**Validation.** The file; scoped nonreg `smoke,actions`.

**Realization.** `DomainController.deploymentWriteRefusal`, run by `handleInstanceAction` in the process that holds the stores (a remote client's write reaches the server's DomainController, `RestServer.ts`): a `createInstance` or `updateInstance` of Admin Deployment rows is refused with `deploymentRoleFixed` when `deploymentRoleOf` the stored row differs from the written one. Writing `role: authoring` on a row without a role, or leaving it out again, keeps the role and passes; removing `role` from a following row is a change and is refused. The stored rows are read through `storedDeploymentRows`, which a remote client skips. Validation: the file (A1, A2); scoped nonreg `smoke,actions` passed (32 steps).


### Slice A3 — A following deployment refuses model and `modelVersion` writes

**Status:** ⬜ pending

**Goal.** The following deployment's model cannot be edited and nothing is written to its `modelVersion` (G2, epic D5).

**RED**, in this order:
1. the server gate alone: an Entity row write marked `markRecordedBySender`, sent straight to the emulated server's DomainController (`handleAction`), as a remote client's write reaches it, is refused with `deploymentFollows`, the store unchanged; the same write carrying the run mark passes;
2. a commit from the client is refused with `deploymentFollows`, no record appended (then the client's early refusal from its cached Deployment row is added);
3. `freezeApplicationVersion`, `rebaselineEvolutionTraces` and `appendEvolutionTraceRecord` are refused;
4. a `data` write passes.

**GREEN.** The gate in the persistence process before model and `modelVersion` writes, reading the Deployment row; the client's early refusal.

**Refactor checkpoint.** The gate and `evolutionTraceRefusal` share one "may this commit write this application's model" check.

**Validation.** The file; `integ-708-evolution-trace-records` and `integ-696-versioning-capability` still pass; nonreg step `integ-9-following-deployment` added; full `npm run nonreg:filesystem -- --runner shared` (end of part A); PR A.

**Realization.** _(on completion)_

---

## Part B — Generation

### Slice B1 — A draft Migration for one optional attribute (tracer)

**Status:** ⬜ pending

**Goal.** The designer of appForTest gets the draft of epic section 5.1 (G1).

**RED** (`migrationGeneration.9.phaseB.integ.test.ts`): freeze `1.0.0`, add an optional attribute through an Entity row update, commit, freeze `1.1.0`; `generateMigration { from: "1.0.0", to: "1.1.0" }` writes a Migration in `modelVersion` with `source: traces`, one `addAttribute` change (backward-compatible, supported), one empty fill step (`repeatable`, `backwardCompatible`), no expand and no contract step, `backwardCompatible: true`.

**GREEN.** `handleAction_generateMigration`: states, records between markers, agreement, changes from records, classification, steps; the Migration Entity ensured; written with `createInstance` in `modelVersion`; the action declared on the Model Endpoint and added to `SERVER_ROUTED_MIROIR_ACTION_TYPES`.

**Refactor checkpoint.** The walk of records shares the replay's `applyRecordActions` (`modelStates.ts`) instead of a second interpreter.

**Validation.** The file; versioning unit tests; type check versioning and core; scoped nonreg `smoke,actions,external`.

**Realization.** _(on completion)_

### Slice B2 — Removals, required attributes, renames: classified and stepped

**Status:** ⬜ pending

**Goal.** Generation flags what breaks rollback (G1, epic D1, Q23).

**RED.** Each between two frozen versions:
- an attribute removed: `removeAttribute`, not backward-compatible, one empty contract step named after it (D4, #733);
- an Entity removed through `dropEntity`: `removeEntity` and its contract step;
- a required attribute added: not backward-compatible, with its fill step;
- an Entity renamed through its row: `renameEntity`, `supported: false`; `idAttribute` changed: `changeIdAttribute`, `supported: false`;
- an attribute added then removed between the two versions: no change.

**GREEN.** The remaining change kinds, folding, and contract steps; the check of the folded changes against the `to` Entities.

**Refactor checkpoint.** The classification table is one function, unit-tested in the package with real Entity rows from the appForTest assets.

**Validation.** The file; versioning unit tests; scoped nonreg `smoke,actions,external`.

**Realization.** _(on completion)_

### Slice B3 — Refusals and the diff fallback

**Status:** ⬜ pending

**Goal.** Generation refuses what it cannot vouch for and still serves an application without traces (G1, Q29, Q30, D12).

**RED.**
- the traces and the versions disagree: after the second freeze, the test edits a trace record's file in `modelVersion` (the freeze's own check prevents freezing a model that disagrees); generation is refused with `evolutionTracesDisagree`, listing the difference;
- a `rebaseline` marker between the versions: refused with `migrationAcrossRebaseline`; a Migration written by hand (`source: manual`) through `createInstance` is stored and readable;
- traces off: a Migration with `source: diff` and the same changes as B1;
- a second generation for the same versions: refused with `migrationExists`, accepted with `replace: true`;
- on a following deployment: refused with `deploymentFollows`.

**GREEN.** The refusals; the diff path from `diffModelStates`, with names and `idAttribute` from the changed rows.

**Refactor checkpoint.** `modelCudMigrationCandidates` and the diff path share the Entity-row reading.

**Validation.** The file; scoped nonreg `smoke,actions,external`.

**Realization.** _(on completion)_

### Slice B4 — `versioned-git`: from the tag to `HEAD`

**Status:** ⬜ pending

**Goal.** With the model in Git, the draft is made between tag `1.0.0` and `HEAD`, and lands as a file to commit before tagging `1.1.0` (G1, epic section 5.2).

**RED** (`migrationGenerationGit.9.phaseB.integ.test.ts`, on the Git testbed of `gitTraceAgreement.integ.test.ts`): commit and tag `1.0.0`; add an attribute, commit; `generateMigration { from: "1.0.0", to: "1.1.0" }` writes `modelVersion/<Migration uuid>/<uuid>.json` in the work tree with the B1 content. The refusal without a `modelVersion` section is tested by removing that section from the testbed Deployment's configuration in the test.

**GREEN.** States from `gitModelState`; records at `HEAD` not at the tag.

**Refactor checkpoint.** None expected.

**Validation.** The file; the #679 Git nonreg step still passes; nonreg step `integ-9-migration-generation` added; full `npm run nonreg:filesystem -- --runner shared` (end of part B); PR B.

**Realization.** _(on completion)_

---

## Part C — Runner

### Slice C1 — A Migration run on a following deployment (tracer)

**Status:** ⬜ pending

**Goal.** Epic section 9, E1's apply step: the following deployment at `1.0.0` is migrated to `1.1.0`, its data filled (G2, G4).

**RED** (`migrationRun.9.phaseC.integ.test.ts`): A1's two versions (an optional attribute and a new Entity added), B1's draft, its fill step completed by the test (an `updateInstance` setting the attribute where it is empty, and a `createInstance` of the new Entity); A1's following deployment at `1.0.0` with fixture data; `runMigration`:
- the live model equals `frozenModelState(1.1.0)`; the instances have the filled value; the new Entity's instance is stored (its storage made by `createEntity` during the jump);
- the state record says `version: "1.1.0"`, `applied` holds the migration, no `run`;
- no trace record was appended;
- a second `runMigration` is refused with `migrationNotAtFrom`;
- a Migration row whose `backwardCompatible` the test set wrong is recomputed by the runner (the record copy holds the recomputed value);
- two `runMigration` sent together: one runs, the other is refused with `migrationRunInProgress` or `migrationNotAtFrom`, never interleaved.

**GREEN.** `handleAction_runMigration`: lock, checks, copy, steps with the run mark, jump with `applyModelState`, end; declared and server-routed; the client reloads Admin and the application after it.

**Refactor checkpoint.** The creation of a following deployment (A1) and the jump share the "bring the model to a version" path.

**Validation.** The file; scoped nonreg `smoke,actions,external,runners`.

**Realization.** _(on completion)_

### Slice C2 — A stopped run resumes

**Status:** ⬜ pending

**Goal.** A run stopped part way resumes and ends where an uninterrupted run ends (G3, epic section 9's failure row).

**RED.**
- a Migration with two expand steps, the second failing on a precondition the test then satisfies: the first run stops with `run.stepsDone` holding the first step; the test then edits the Migration's file in `modelVersion` on disk (the following deployment refuses that write through Miroir); the second run uses the copy, runs from the second step, and ends with the same data as C1's uninterrupted run;
- a stop between a step's writes and its record: a repeatable step whose writes land and whose last action fails on a precondition; the run stops with that step not in `stepsDone`; once the precondition holds, the rerun runs the whole step again and the data equals a single run's;
- a contract step left empty by generation (D4) runs and is recorded;
- a run in progress refuses another Migration with `migrationRunInProgress`.

**GREEN.** Resume from `stepsDone`; refusals while `run` is set.

**Refactor checkpoint.** None expected.

**Validation.** The file; scoped nonreg `smoke,actions,external`.

**Realization.** _(on completion)_

### Slice C3 — Runner refusals

**Status:** ⬜ pending

**Goal.** The runner refuses what it cannot run safely (G2).

**RED.** Refused, the store unchanged: on an authoring deployment (`deploymentAuthors`); a Migration holding an unsupported change (`migrationUnsupportedChange`). Characterizations, passing through the generic paths of `forwardCapabilityAction` and `requiredCapability`: with a Miroir transaction open; without the `versioning` capability (`FeatureUnavailable`).

**GREEN.** The remaining checks.

**Refactor checkpoint.** All refusal reasons in one exported constant set, used by the tests.

**Validation.** The file; scoped nonreg `smoke,actions,external`.

**Realization.** _(on completion)_

### Slice C4 — `versioned-git`: the jump is a checkout of the tag

**Status:** ⬜ pending

**Goal.** E2's apply step: a following Git deployment at tag `1.0.0` reads the Migration at tag `1.1.0` and checks it out (G2, epic section 5.2).

**RED** (`migrationRunGit.9.phaseC.integ.test.ts`): the Git testbed commits `data/` inside the repository (`gitTestSetup.ts`, `initCommittedRepository`), so this test adds a `.gitignore` for `data/` to it, after checking that the checkout's dirty check honours ignored files. B4's repository with the Migration committed and tag `1.1.0`; a following deployment created at `1.0.0` (the clone checked out at the tag); `runMigration`: `HEAD` is at `1.1.0`, the model reloaded, the data filled, the record at `1.1.0`. Without the `.gitignore`, an expand step writing data makes the checkout refuse, and the run stays resumable.

**GREEN.** Find at tag; the Git jump; the creation of a following `versioned-git` deployment checks that its clone is at the tag of its version.

**Refactor checkpoint.** None expected.

**Validation.** The file; the #679 Git nonreg step; full `npm run nonreg:filesystem -- --runner shared` (end of part C).

**Realization.** _(on completion)_

### Slice Z — MiroirTest scenario, nonreg steps, docs, cleanup, AC

**Status:** ⬜ pending

- MiroirTest `action.scenario.migration` (appForTest, filesystem, tag `versioning`): freeze, change, freeze, generate, assert the draft; the run on a following deployment stays in the vitest suite (it needs a second deployment).
- Nonreg step `integ-9-migration-run` with scopes (`actions`, `external`, `runners`), tier `default`, filesystem.
- Docs: `docs/reference/versioning.md` (Migrations, deployment roles, the runner); `docs/reference/data-architecture-deployments.md` (the Deployment `role`, the Admin `DeploymentState`).
- Cleanup: the `issues/9-migrations/` tests move to feature-named suites under `tests/3_controllers/versioning/`.
- Tracer narrative: the epic section 5.1 day, run by the test suite.

**AC checklist** (issue #9 scope, in its order):

| Scope item | Proof |
|---|---|
| `Migration` Entity in `modelVersion`, `from`/`to` by version name, four phases, `backwardCompatible` and repeatable steps | A1 (Entity), B1 (row), C1 (jump, fill), C2 (expand, contract, repeatable) |
| Generation on demand, agreement first | B1, B3 |
| Structure steps from traces checked against the diff, or the diff alone | B1, B2, B3 |
| Non-backward-compatible steps flagged | B2 |
| With Git, from the source tag to `HEAD`, committed before the target tag | B4, C4 |
| Runner checks the deployment is at `from` | C1, C3 |
| Copies the migration into the state record before its first step | C2 |
| Suppresses tracing during the run | C1 (no record), A3 |
| Records each step, resumes after a stop | C2 |
| Jump: rewrite without Git (N1), checkout with Git | C1, C4 |
| Idempotent storage creation on every store; add-only reconciliation (D2 of the epic) | set aside by the user (N5); contract Actions in #733 |
| Deployment state record in Admin data keyed by Deployment uuid: version, migrations, steps, role | A1 (record, role on the Deployment), C1, C2 |
| A following deployment writes nothing to `modelVersion`, its model commits refused | A3 |

**Validation.** Full `npm run nonreg:filesystem -- --runner shared`; the pre-push gate of `AGENTS.md`; PR C with `Closes #9`.

**Realization.** _(on completion)_
