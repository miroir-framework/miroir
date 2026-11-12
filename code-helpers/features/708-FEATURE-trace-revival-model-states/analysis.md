# 708 — Revive evolution traces and read any model state

> Model changes are recorded as trace records in `modelVersion`, one per Miroir commit. Miroir can read a model state from a frozen version, a Git ref or the live model, replay traces on it, diff two states attribute by attribute, and check that a version and its traces agree. This analysis frames the whole issue and proposes delivering it in four parts.

Related issue: https://github.com/miroir-framework/miroir/issues/708
Parent issue: [#694](https://github.com/miroir-framework/miroir/issues/694), item 6 · Prerequisite: #696 ✅ (versioning package and process capability)
Related analyses: [694 epic analysis](../694-EPIC-safe-application-evolution/analysis.md) (sections 6 and 8: D3, D4, D10, D11, D12), [694 decisions](../694-EPIC-safe-application-evolution/decisions.md) (Q16 to Q20, Q24, Q28 to Q30), [696 versioning package](../696-REFACTOR-versioning-package/analysis.md), [#9 WP1 traces](../9-FEATURE-create-migrations-for-model-and-data-updates/wp1-analysis-model-evolution-trace.md), [679 Git](../679-FEATURE-git-version-control/analysis.md)
Key sources: [`evolutionTracePolicy.ts`](../../../packages/miroir-core/src/2_domain/evolutionTracePolicy.ts), [`evolutionTraceBaseline.ts`](../../../packages/miroir-core/src/2_domain/evolutionTraceBaseline.ts), [`DomainController.ts`](../../../packages/miroir-core/src/3_controllers/DomainController.ts), [`RestServer.ts`](../../../packages/miroir-core/src/4_services/RestServer.ts), [`versioningMode.ts`](../../../packages/miroir-core/src/1_core/versioning/versioningMode.ts), [`evolutionTraceRuntime.ts`](../../../packages/miroir-versioning/src/evolutionTraceRuntime.ts), [`evolutionTraceWriter.ts`](../../../packages/miroir-versioning/src/evolutionTraceWriter.ts), [`applicationVersionFreeze.ts`](../../../packages/miroir-versioning/src/applicationVersionFreeze.ts), [`GitRepositoryInterface.ts`](../../../packages/miroir-core/src/0_interfaces/4-services/GitRepositoryInterface.ts)

**Document role:** analysis and decision record for #708. The epic's decisions (Q16 to Q20, Q24, Q28 to Q30, D3, D4, D10 to D12) are settled and not reopened. This document decides how to build them, and where one of its decisions narrows an epic decision, it says so.
**Status:** analysis in progress (2026-11-12).

---

## 1. Goals

From the epic's goals G1 (name a model state), G2 (prepare a migration) and G8 (work through Git), restated for this item:

- **G1 — Record what I did to the model.** In order to prepare a migration later from what I actually did, as an application designer, I can switch traces on for my application, and every model change I commit is kept in order with the Actions it ran.
- **G2 — Read any model state.** In order to compare two states of my model, as an application designer (and as the migration generator, #9), I can get the model at a frozen version, at a Git ref, or live, in one shape.
- **G3 — See what changed.** In order to know what a migration must do, as an application designer, I get the differences between two model states, down to Entity attributes, for every model element type.
- **G4 — Trust a version.** In order to rely on a version and its traces together, as an application designer, I am stopped at freeze (without Git) or at Git commit (with Git) when the traces do not lead to the model, and I can re-baseline to repair it.
- **G5 — Tag a version in Git.** In order to name a model state when my model is in Git, as an application designer, I can create a tag from the Git page.
- **G6 — Pay only for what I use.** In order to keep small deployments small, as an operator, a process without the `versioning` capability never loads the trace code, and an application with traces off costs nothing more.

## 2. Non-goals

- Migrations, their generation, their runner and the deployment state record (#9, epic item 7). This item gives them the replay, the diff and the agreement check.
- Paired data migrations and the composite rename Action (#215, item 8).
- Restoring a frozen version (#709, item 9).
- Switching an application between versioning modes, including refusing `evolutionTraces` when it is set on an unversioned application (#718, item 11). This item only reads the setting.
- Making the Entity editor emit model Actions. An Entity row update is recorded as is, and turned into attribute steps by the replay (epic D12).
- Removing duplicate trace writes as such: the old writers go away with the old records (D3 below), which settles the #696 follow-up.

## 3. Decision record

Legend: setting **N** keeps versions as frozen rows, without Git (`versioned-internal`); setting **G** keeps the model in Git (`versioned-git`, today `versioned-external`). A **record** is one trace record (Q16). The **persistence process** is the process that holds the stores: the server, Electron's main process, the CLI, or an emulated server in tests.

| Decision | Choice | Serves |
|---|---|---|
| D1. How is #708 delivered: one PR, or several? | **Four parts, each with its own PR: A records, B model states, C agreement and re-baseline, D Git tag** | all |
| D2. Which Entity holds a record, and what happens to the two trace Entities of today? | **A new `EvolutionTraceRecord` Entity routed to `modelVersion`; the two old Entities, their three Reports, two menu items, seed row and code are removed** | G1, G6 |
| D3. Which writes make a record, and which process writes it? | **The DomainController where the user's action arrives builds one record per commit (or per direct model write) and sends it, as one server-routed action, to the persistence process, which orders and writes it** | G1, G6 |
| D4. How does a record tell which version it leads to? | **The freeze appends a `version` marker record, instead of updating the open records** (narrows Q19) | G1, G4 |
| D5. What turns traces on, and what happens when the setting cannot apply? | **`evolutionTraces` on the SelfApplication row; it reads as off on an unversioned application; with the capability off, a commit of an application with traces on is refused** | G1, G6 |
| D6. How does a `versioned-git` application get a writable `modelVersion`? | **Its deployment declares a `modelVersion` section inside the Git work tree, and the history fetch covers both versioned modes** | G1, G5 |
| D7. In what shape does a model state come back from a frozen version, a Git ref or the live model? | **A map from element Entity uuid to rows, owned by the versioning package; `MetaModel` stays as it is** | G2, G6 |
| D8. How fine is the diff of two model states? | **Entity attributes by name, every other element type row by row and field by field** | G3 |
| D9. What does the agreement check compare? | **The previous version replayed with the records since it, against the model being frozen or committed** | G4 |
| D10. What does a re-baseline write? | **In N, a freeze followed by a `rebaseline` marker record; in G, a `rebaseline` marker record only, committed with the model** (epic D11) | G4 |
| D11. What does `gitAction_tag` create, and how does the tag reach the remote? | **An annotated tag named after the version, sent by `gitAction_push`** (epic D3, D10) | G5 |

### D1. How is #708 delivered: one PR, or several?

**Status:** proposed. **Serves:** all.

**What is at stake.** #708 lists ten scope items. Together they touch the SelfApplication schema, two Miroir Entities and three Reports, the DomainController commit, the REST server, the versioning package, the Git interface and its implementation, the freeze, and the Git page. One PR of that size cannot be reviewed well, and a problem found late in it (say in the Git-ref reader) would hold back the trace records that #9 needs first.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D1-a. One PR | everything on one branch | one review | very large; nothing lands until all of it works |
| **D1-b. Four parts** ★ | **A** records: the parameters, the record Entity, recording at commit, the writable `modelVersion` in G, the capability gate, the removal of the process switch and the old traces. **B** model states: `ModelStateSource` (frozen, Git ref, live), the replay, the all-types diff. **C** agreement: the check at freeze and at Git commit, the re-baseline. **D** `gitAction_tag`. | each part is reviewable, and A unblocks the record format for #9 | four PRs; B and C wait for A |

Order: A, then B and D in either order, then C (it needs A and B). Each part gets its own section in `tdd-implementation-plan.md`. #708 closes with C.

### D2. Which Entity holds a record, and what happens to the two trace Entities of today?

**Status:** proposed — D2-b. **Serves:** G1, G6.

**What is at stake.** Today a trace is an `ApplicationEvolutionTrace` root row per application and branch (`de089f57-…`) plus one `ApplicationEvolutionTraceEvent` row per action (`f4c2b3a1-…`), stored in the evolving application's `model` section (`data` for Miroir). Q16 asks for one record per commit, in `modelVersion`, holding resolved Actions, and Q28 drops the before-image. The event row has none of the needed fields: it names an operation type and target uuids but not the Action. Library's trace root row is even shipped in Miroir's data section (`miroir_data/de089f57-…/ea4b571f-….json`).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D2-a. Reuse `ApplicationEvolutionTrace` with a new schema | same uuid, new fields; drop the event Entity | no new uuid | old rows in existing stores fail the new schema; the name hides the change |
| **D2-b. New `EvolutionTraceRecord` Entity** ★ | a new Miroir Entity, its uuid added to `versionHistoryEntityUuids` so its rows go to `modelVersion`. Fields: `application`, `sequenceNumber`, `previousTrace` (absent on the first), `kind` (`commit`, `version`, `rebaseline`), `actions` (the resolved Actions of a `commit` record), `version` (the version name of a `version` marker, D4 and epic D10), `gitCommit` (information on a G `rebaseline` marker, epic D11), `commitUuid`, `timestamp`. The two old Entities, their three Reports, their two Miroir menu items, the seeded root row and the baseline seeding are removed; one list Report and one details Report replace them. | clean format; old rows are left untouched on disk, under Entities that no longer exist | old trace rows are not migrated (traces were off by default, D5) |
| D2-c. Keep the old Entities and add the new one | both formats | nothing removed | two trace formats to read and test |

**Decision:** D2-b. The frozen `EntityVersion` rows of the two old Entities in Miroir's `modelVersion` stay: they are history.

### D3. Which writes make a record, and which process writes it?

**Status:** proposed — D3-c. **Serves:** G1, G6.

**What is at stake.** Take a designer in a browser adding an optional `isbn` attribute to Library's `Book`, then committing. The Entity editor sends a `transactionalInstanceAction`; the commit replays it as an `updateInstance` through the REST client; the server receives it as a plain instance write. Today:
- the browser records nothing, since `isEvolutionTraceEnabled` reads `process.env`, which a browser does not have;
- the committing DomainController does not trace a replayed transactional instance write at all (the `transactionalInstanceAction` case of the commit loop, `DomainController.ts` line 2090, has no trace call);
- the server traces each replayed write on its own, without the commit (`restActionHandler` hands it to its DomainController, whose `handleInstanceAction` calls `maybeRecordEvolutionTrace`).

So the main way designers change a model is traced only by a server with `MIROIR_EVOLUTION_TRACE` set, one write at a time. Q16 needs the commit as the unit, and only the DomainController that runs the commit knows it. The browser never loads the versioning package (#696 D9).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D3-a. The persistence process records each write | as today on the server | no new action | no commit boundary (Q16 fails); a commit's writes are ordered only by arrival |
| D3-b. The committing DomainController writes the record itself | core builds the record and sends a `createInstance` into `modelVersion` | one place | the next sequence number and `previousTrace` come from the client's local cache, which may be stale; core grows |
| **D3-c. The committing DomainController sends one server-routed action** ★ | After a successful commit, the DomainController where the commit runs collects the Actions it replayed, in order, and sends `appendEvolutionTraceRecord { application, commitUuid, actions }` on the ModelEndpoint, declared with `requiredCapability: versioning` and server-routed like the freeze (#696). The persistence process loads the package, reads the last record from the store, sets `sequenceNumber` and `previousTrace`, and writes the record. A direct model write outside a transaction (a non-transactional model Action, a write to Miroir's `data` section, Q18) makes a one-Action record the same way. A write that a DomainController receives over REST from another DomainController makes no record: `restActionHandler` marks it. | the commit is the unit; ordering is decided where the records are stored; core only collects Actions; the duplicate writes of #696 D5 disappear | a new action, and a mark on writes received over REST |

**Decision:** D3-c. What is recorded: the model Actions `createEntity`, `alterEntityAttribute`, `renameEntity` and `dropEntity`, and `createInstance`, `updateInstance` and `deleteInstance` on the `model` section (and on Miroir's `data` section). Writes to `modelVersion`, `data` (other applications), `devData` and `admin` make no record. A failed commit makes no record. If the append fails after the commit succeeded, the commit stands and the failure is reported; the gap is repaired by a re-baseline (D10).

### D4. How does a record tell which version it leads to?

**Status:** proposed — D4-b. **Serves:** G1, G4. **Narrows:** Q19 ("freeze stamps the open records with the version they lead to").

**What is at stake.** Migration generation (#9) and the agreement check (D9) need "the records between version 1.0.0 and version 1.1.0". With Q19 as written, freezing `1.1.0` updates every record since `1.0.0`. That rewrites records, and in setting G it would modify files already committed.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D4-a. The freeze stamps the open records | an `updateInstance` per open record | each record says its version | records are no longer append-only; one write per open record |
| **D4-b. The freeze appends a `version` marker** ★ | a `version` record naming the frozen version, appended to the chain | append-only; one write; "records between two versions" is "records between two markers" | a reader walks the chain instead of filtering by a field |

**Decision:** D4-b, in part A for setting N. In setting G, a version is a tag, so no marker is written (D11); records between two tags are those added by the commits between them.

### D5. What turns traces on, and what happens when the setting cannot apply?

**Status:** proposed. **Serves:** G1, G6.

**What is at stake.** Today one process switch, `MIROIR_EVOLUTION_TRACE` (or `VITE_MIROIR_EVOLUTION_TRACE`), turns traces on for every application, and a browser cannot set it. Q24 puts the setting on the application. Two cases have no meaning: traces on an unversioned application (there is no `modelVersion` to hold them), and traces on while the process has the `versioning` capability off (the code is not there).

- `evolutionTraces` is an optional boolean on the SelfApplication row, off when absent. Miroir's own row keeps it off.
- On an `unversioned` application it reads as off, with a warning logged when the application loads. Refusing to save it there belongs to #718's switch action.
- The epic's gate: with the `versioning` capability off, a commit (or a direct model write, D3) of an application with traces on is refused with `FeatureUnavailable`, before anything is written. Otherwise the history would have a gap that only a re-baseline repairs.
- The process switch is removed from the code, the tests, `scripts/nonreg-manifest.json` and the docs. The `evolution-trace` MiroirTest tag and its requirement go with it: a trace test turns traces on in its own fixture.

### D6. How does a `versioned-git` application get a writable `modelVersion`?

**Status:** proposed. **Serves:** G1, G5.

**What is at stake.** In setting G, records live in `modelVersion` and are committed with the model, so they follow branches. Today a `versioned-external` application has no `modelVersion`: the DomainController fetches that section only for `versioned-internal` (the `nonModelFetchTargets` filter, `DomainController.ts` line 913), and `ModelInitializer.ts` (line 186) writes the initial `SelfApplicationVersion` to `model` for every mode but `versioned-internal`.

- `versioningMode` gains `versioned-git`. `versioned-external` stays in the schema and resolves to `versioned-git` for one release (Q24).
- A G deployment declares its `modelVersion` section in its environment, with its directory inside the Git work tree (`{prefix}_modelVersion/`, next to `{prefix}_model/`), so a Git commit includes the records.
- The history fetch covers both versioned modes.
- Freeze stays refused in G (`assertApplicationVersioningEnabled`), so a G `modelVersion` holds records, and later Migrations, but no frozen rows. The initial `SelfApplicationVersion` of a G application stays in `model`, as today.

### D7. In what shape does a model state come back from a frozen version, a Git ref or the live model?

**Status:** proposed — D7-b. **Serves:** G2, G6. Part B.

**What is at stake.** The replay, the diff and the agreement check take two model states from any source (epic D4). The in-memory `MetaModel` type (`miroirFundamentalType.ts`) has collections for Entities, Queries, Reports, Menus, Endpoints, Runners, Themes, TransformerDefinitions, MlSchemas and MiroirTests (`tests`), but none for Blob, TestConfiguration or Test rows, which the freeze snapshots since #706.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D7-a. Extend `MetaModel` | three new collections in the generated type | one shape everywhere | a core schema change that every process carries (G6); every builder of a `MetaModel` must fill them |
| **D7-b. A `ModelState` map in the versioning package** ★ | `{ application, source, rows: Record<elementEntityUuid, EntityInstance[]> }`, built from frozen `*Version` rows, from `*_model/<entityUuid>/*.json` files at a Git ref, or from the live sections | uniform over every element type; costs only the package | a converter from and to `MetaModel` where a caller needs one |

**Decision:** D7-b. Reading at a Git ref needs a new `GitRepositoryInterface` method listing the files under a folder at a ref (isomorphic-git `readTree`); `readFile(path, ref)` exists already.

### D8. How fine is the diff of two model states?

**Status:** proposed. **Serves:** G3. Part B.

The diff returns, per element type, the rows added, removed and changed. For an Entity, a change also lists the attributes of `mlSchema.definition` added, removed and changed (by name, with the old and new definition), and the other changed fields (`idAttribute`, `viewAttributes`, …). For the other types, a change lists the changed top-level fields. A rename cannot be told from a remove plus an add by the diff alone; the records carry it (epic D12). It replaces `diffEntityVersionSnapshots` (`applicationVersionFreeze.ts`, line 1063), which compares Entities by uuid only.

### D9. What does the agreement check compare?

**Status:** proposed. **Serves:** G4. Part C.

- At freeze (setting N): the last frozen version, replayed with the `commit` records since its `version` marker, must give the live model. Otherwise the freeze is refused and the differences (D8) are listed.
- At commit from the Git page (setting G): the model at `HEAD`, replayed with the records added since `HEAD`, must give the model being committed.
- With traces off, there is nothing to check, and the check passes.
- A `rebaseline` marker restarts the chain: replay starts from the state it fixes.

### D10. What does a re-baseline write?

**Status:** proposed, as epic Q30 and D11. **Serves:** G4. Part C.

A new ModelEndpoint action, `rebaselineEvolutionTraces`. In setting N it freezes the live model under the name given and appends a `rebaseline` marker. In setting G it appends a `rebaseline` marker naming the Git commit at `HEAD` as information, to be committed with the model.

### D11. What does `gitAction_tag` create, and how does the tag reach the remote?

**Status:** proposed, as epic D3 and D10. **Serves:** G5. Part D.

`gitAction_tag { application, name, message?, ref? }` creates an annotated tag at `HEAD` (or `ref`), named exactly after the version, with no `v` prefix. It is refused when the name exists. `gitAction_push` also pushes the tags that point to commits it pushes. The Git page offers it next to the commit.

---

## 4. Current state

### 4.1 Trace Entities and where their rows go (misaligned)

Enumerated from `packages/miroir-app-miroir/assets/miroir_model/16dbfe28-…/`:

| Entity | uuid | Fields |
|---|---|---|
| `ApplicationEvolutionTrace` | `de089f57-5fa5-4c0e-a43e-20f1a6df5a37` | `name?`, `applicationUuid`, `branchName`, `timestamp?` |
| `ApplicationEvolutionTraceEvent` | `f4c2b3a1-8d6e-4f9a-b2c1-3d4e5f6a7b8c` | `traceRootUuid`, `sequenceNumber`, `operationType` (10 values, among them `squashedBaseline`), `applicationSection` (`model`, `data`), `compactionLevel` (`raw`, `commit`, `version`), `targetEntityUuid?`, `targetInstanceUuid?`, `commitUuid?`, `fromVersionUuid?`, `toVersionUuid?`, `timestamp`, `definitionVersionResolution?`, `targetDefinitionVersionUuid?` |

Neither uuid is in `versionHistoryEntityUuids` (`1_core/Model.ts`, line 187), so `getApplicationSection` sends their rows to `model`, or to `data` for Miroir. No field holds the Action.

Assets that name them:
- Reports `ApplicationEvolutionTraceList` (`b2c3d4e5-f6a7-4890-b123-4567890abcde`), `ApplicationEvolutionTraceHistory` (`230467a6-ecc3-4945-bd05-5d9e826c44fb`) and `ApplicationEvolutionTraceDetails` (`c4d5e6f7-a8b9-4c01-a345-67890abcdef1`).
- Miroir menu items "Application Evolution Traces" and "Application Evolution Trace History" (Reports `b2c3d4e5-…` and `230467a6-…`, the last two of the four uuids in `VERSIONING_MENU_REPORT_UUIDS`, #696).
- A root row for Library, shipped in Miroir's `data` section: `miroir_data/de089f57-…/ea4b571f-f4b6-4ada-abd4-a3dbeb3e5138.json`.
- MiroirTest `action.scenario.evolutionTrace` (`2427ef3a-3cd1-4b87-afe7-433bb04b25d2`), tags `integ`, `versioning`, `model`, `evolution-trace`, on Library with TestConfiguration `libraryPublisherAndCountry` (`431e0903-…`).
- `resetAndinitializeDeploymentCompositeAction` (`1_core/Deployment.ts`, line 620) seeds a baseline when the initialized Entities include `ApplicationEvolutionTrace`.

### 4.2 Recording (misaligned)

```typescript
// packages/miroir-core/src/2_domain/evolutionTracePolicy.ts, isEvolutionTraceEnabled
export function isEvolutionTraceEnabled(
  env: Record<string, string | undefined> = typeof process !== "undefined" ? process.env : {},
): boolean {
  const raw = env.MIROIR_EVOLUTION_TRACE ?? env.VITE_MIROIR_EVOLUTION_TRACE;
  ...
```

`DomainController.maybeRecordEvolutionTrace` (line 1483) checks, in order: the switch, the action type (`EVOLUTION_TRACEABLE_ACTION_TYPES`, line 123), a known deployment, the `versioning` capability. It then calls the package's `recordEvolutionTrace`, which builds a baseline if none exists and appends one event per action (`evolutionTraceRuntime.ts`, `buildEvolutionTracePersistenceActions`). It is called from two places:

| Call site | When | Commit context |
|---|---|---|
| `handleInstanceAction`, line 1430 | a direct (non-transactional) instance write, after the local cache accepted it | none |
| the `commit` loop, line 2157 | each replayed model Action (`alterEntityAttribute`, `createEntity`, `dropEntity`, `renameEntity`) | `commitUuid`, with a placeholder `fromVersionUuid` `aaaaaaaa-…` and `toVersionUuid` set to the commit uuid (line 2160) |

The `transactionalInstanceAction` case of the commit loop (line 2090) replays the instance write with `callPersistenceAction` and calls no trace. Per process, for a model change saved from an editor and committed:

| Process | What reaches it | Traced today |
|---|---|---|
| Browser (client of a server) | the commit | never (no `process.env`) |
| Client with an emulated server, or Node client with local stores | the commit | model Actions only, and only with the switch set |
| Server, or emulated server | each replayed write, through `restActionHandler` (`RestServer.ts`, line 527) to its DomainController | each instance write on its own, with the switch set; replayed model Actions go through `handleModelAction` and are not traced |

`versioningLazyTraces` (standalone app) locks the current counts for one direct instance write with an emulated server: 3 trace rows on the client and 6 on the server (#696 D5).

### 4.3 Versioning modes (misaligned)

- SelfApplication fields (`a659d350-dd97-4da9-91de-524fa01745dc`): `name`, `defaultLabel`, `description?`, `homePageUrl?`, `versioningEnabled?` (legacy boolean), `versioningMode?` (`unversioned`, `versioned-internal`, `versioned-external`). No `evolutionTraces`.
- `resolveVersioningMode` (`versioningMode.ts`): an explicit `versioningMode` wins; otherwise `versioningEnabled: true` means `versioned-internal`; otherwise `unversioned`.
- Shipped values: Miroir and appForTest `versioned-internal`; Library, Admin, GitHub, Postgres and Spotify `unversioned`. No application ships `versioned-external`.
- `versioned-external` appears in five source and asset files: `versioningMode.ts`, the two generated files (`miroirFundamentalMlSchema.ts`, `miroirFundamentalType.ts`), `DomainController.ts` and the SelfApplication Entity.

### 4.4 Model states, diff and Git (missing)

- `MetaModel` (`miroirFundamentalType.ts`) has no collection for Blob, TestConfiguration or Test rows.
- `diffEntityVersionSnapshots` (`packages/miroir-versioning/src/applicationVersionFreeze.ts`, line 1063) compares Entities by uuid, with no attribute steps.
- `GitRepositoryInterface` has `readFile(path, ref?)` and `listFiles()` (the work tree), `log`, `checkout` and `push(options & { branch })`. It has no method to list files at a ref and none to create a tag. `miroir-git-isomorphic` already calls `git.listTags` and `git.readBlob`. The Git actions are `status`, `log`, `commitFiles`, `diff`, `init`, `stage`, `unstage`, `commit`, `createBranch`, `deleteBranch`, `checkout`, `setRemote`, `fetch`, `pull`, `push`, `setCredential`, `clone`, `installClonedDeployment` and `revert` (`GitAction.ts`).

### 4.5 Code that goes away (part A)

| File | Lines | Fate |
|---|---|---|
| `miroir-core/src/2_domain/evolutionTracePolicy.ts` | 41 | the switch goes; the section rule moves into the recording (D3) |
| `miroir-core/src/2_domain/evolutionTraceBaseline.ts` | 141 | removed (no root, no baseline) |
| `miroir-versioning/src/evolutionTraceWriter.ts` | 229 | replaced by the record builder |
| `miroir-versioning/src/evolutionTraceRuntime.ts` | 174 | replaced by the record writer |
| `miroir-versioning/src/evolutionTraceCompaction.ts` | 100 | removed: a record is already commit-level, and versions are markers (D4) |
| `miroir-versioning/src/evolutionTraceDefVersion.ts` | 106 | removed: the replay gives the definition in force (Q28) |
| `miroir-versioning/src/evolutionTraceRecorder.ts` | 55 | becomes the `appendEvolutionTraceRecord` handler |

## 5. Key reuse

| Piece | Location |
|---|---|
| Server-routed, capability-gated ModelEndpoint action, lazily loaded | `registerLazyActionImplementations`, `forwardCapabilityAction`, `SERVER_ROUTED_MIROIR_ACTION_TYPES` (#696) |
| Section routing by Entity uuid | `versionHistoryEntityUuids`, `getApplicationSection` (`1_core/Model.ts`) |
| Reading a section from the action host | `DomainControllerActionHost.readSectionInstances` (#696) |
| Freeze, version names, the history Entities | `freezeApplicationVersion.ts`, `applicationVersionFreeze.ts` (package) |
| Capability check | `assertProcessCapability("versioning", …)` |
| Git file at a ref | `GitRepositoryInterface.readFile(path, ref)` |
| Versioning tests on the filesystem store | `tests/3_controllers/versioning/` (standalone app), nonreg step `integ-696-versioning-capability` |

## Next step

`tdd-implementation-plan.md` in this folder, per `miroir-analysis-to-tdd-plan`: part A first, then B, D and C.
