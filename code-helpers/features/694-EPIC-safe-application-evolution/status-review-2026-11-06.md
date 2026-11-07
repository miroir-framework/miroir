# Model versioning in Miroir: where we stand

Status review, 2026-11-06, of `_integration` at `4717606`. No code was changed.

The question was whether Application Evolution Traces (meant to accrue model changes along commits) were dropped in favour of the freeze into `ApplicationVersion` / `*Version` rows in `modelVersion`, and how far each got.

## Short answer

The two were never meant to be rivals. The principles drawing in `code-helpers/features/9-FEATURE-create-migrations-for-model-and-data-updates/issue 9 WP2 principles.jpg` puts them on one line: frozen Application Versions (AV1, AV2, ...) are complete squashed models, and trace events (TE1, TE2, ...) between them hold the resolved Actions so that the timeline can be replayed. The #216 ADR then chose, explicitly, to ship the version spine first and derive the edges by diffing snapshots (Option A), and it deferred the action-log edges (Option B, which is where the traces would have become useful).

So the state is this.

- **Freeze is mostly built and wired.** It has an action, storage, UI, docs, tests and a nonreg step. Nothing consumes the versions it writes yet: no restore, no migration apply.
- **Evolution traces are built but parked.** The code, entities, reports and tests exist, but tracing is off by default behind `MIROIR_EVOLUTION_TRACE`. The events carry no replayable payload, so they cannot do the job the drawing gave them.
- **Git (#679) now covers "accrue changes along commits"** for filesystem deployments, which was the traces' remaining reason to exist.

My recommendation is to keep freeze as the only Miroir-side versioning mechanism, retire the evolution traces, and leave commit-level history to Git. Details and the remaining work are below.

---

## 1. Freeze: ApplicationVersion and the `*Version` entities

### What exists

| Part | Where | State |
|---|---|---|
| `freezeApplicationVersion` model action | `DomainController.ts` (`case "freezeApplicationVersion"`, line ~2457), Model Endpoint `7947ae40-…` | Wired |
| Freeze planning and snapshots | `packages/miroir-core/src/1_core/versioning/applicationVersionFreeze.ts` (1423 lines) | Wired |
| Snapshot types | Entity, Query, Report, Menu, Endpoint, Runner, Theme, TransformerDefinition, each with an `ApplicationVersionCross*` link entity | 8 element types done |
| Linear history | `resolvePreviousApplicationVersion`, `previousVersion` chain, duplicate `versionName` rejected per branch, placeholders (`"Initial"`, `"TODO: …"`) skipped | Done |
| Migration content | `diffEntityVersionSnapshots` fills `modelCUDMigration` (Entities only, rename versus drop+create by uuid); `modelStructureMigration` is always `[]` | Rough, Entities only |
| `modelVersion` store section | Separate storage per section; filesystem, SQL, IndexedDB and MongoDB writable; bundled read-only; routing by `versionHistoryEntityUuids` (`1_core/Model.ts:177`) | Done (#232) |
| Versioning modes | `versioningMode` on SelfApplication: `unversioned`, `versioned-internal`, `versioned-external` (`versioningMode.ts`) | Done (#234). Only Miroir and `appForTest` are `versioned-internal` |
| UI | Freeze Runner `20d51c4c-…`, Versioning report `c2b89408-…`, AppBar `commit` icon shown only for `versioned-internal` apps, menu entries "Miroir Entity Versions" and "Miroir Application Versions" | Done (#225 AC table all green) |
| Commit versus freeze | `commit` no longer creates placeholder SelfApplicationVersion rows (#216 ADR D6-b, comment at `DomainController.ts` ~2328) | Done |
| Docs | `docs/reference/versioning.md` is the single reference | Current |
| Shipped history | `miroir-app-miroir/assets/miroir_modelVersion/`: 35 EntityVersion, 7 Cross, 1 SelfApplicationVersion | Present |

### What is missing or half done

1. **Nothing reads a frozen version back.** There is no "restore / check out version N", no "deploy from version N", and no migration apply between versions. #9 WP2 was meant to do this and never started.
2. **#239 (open): boot leaks history rows into `data`.** On the Miroir filesystem deployment, `bootFromPersistedState` writes 17 EntityVersion and 1 SelfApplicationVersion rows into `data`. That breaks the "history lives only in `modelVersion`" rule from #232 and #234.
3. **#230 (open): two element types still not frozen.** MlSchema and MiroirTestDefinition have no `*Version` snapshot. The other six non-Entity types are done in code, but `227-FEATURE-freeze-non-entity-model-elements/tdd-implementation-plan.md` still says only the QueryVersion tracer is implemented, so the plan and the issue are stale.
4. **Migration edges are Entities only.** The diff ignores Queries, Reports and the other snapshotted types, and it has no attribute-level structure migration (`modelStructureMigration` stays empty). Data migrations paired with model changes (#215) have no representation.
5. **#225 is still open** although its AC table is all green. The last comment lists two UX gaps: sidebar versus in-report application picker, and proof that the UI behaves for unversioned apps.
6. **Branches are ignored.** `ApplicationModelBranch.headVersion` is only set at app creation (`2_domain/Deployment.ts:110`); freeze accepts an optional `branch` but nothing manages branches. The drawing already said "ignored for now".
7. **#15 (open since 2024)** asks instances to resolve their schema through `parentDefinitionVersionUuid`. #217 made the live Entity authoritative and that field informational, so #15 runs against the accepted design.

## 2. Application Evolution Traces

### What exists

| Part | Where | State |
|---|---|---|
| Entities | `ApplicationEvolutionTrace` `de089f57-…` (root per app and branch), `ApplicationEvolutionTraceEvent` `f4c2b3a1-…` | In the Miroir model |
| Writer, policy, baseline, compaction, definition-version resolution, runtime | `packages/miroir-core/src/2_domain/evolutionTrace*.ts` (6 files, ~800 lines), exported from `index.ts` | Built |
| Hook | `DomainController.maybeRecordEvolutionTrace` after every instance CUD and every replayed model action in `commit` | Wired, returns early unless the flag is on |
| Flag | `isEvolutionTraceEnabled()` reads `MIROIR_EVOLUTION_TRACE` / `VITE_MIROIR_EVOLUTION_TRACE` from `process.env` | Off by default, and always off in the browser (`process` undefined) |
| Squashed baseline at init | `Deployment.ts:612`, when the trace Entity is in the init set | Built |
| Reports and menu | `Application Evolution Traces`, `Application Evolution Trace History`, a details report | In the Miroir menu |
| Tests | 9 unit test files in `miroir-core/tests/2_domain/evolutionTrace*`, MiroirTest `action.scenario.evolutionTrace`, nonreg step that sets the flag | Green only with the flag |
| Plan | `wp1-tdd-implementation-plan.md`, all phases marked done | WP1 complete |

### Why it is stuck

1. **Events cannot be replayed.** The event schema has `operationType`, targets, `commitUuid`, `fromVersionUuid`, `toVersionUuid`, timestamps and definition-version fields, but no resolved Action. The WP2 analysis names this as the critical gap. Without it the traces are an audit log, not a migration tape.
2. **The version stamps are fake.** In `commit` replay, `fromVersionUuid` is a constant `aaaaaaaa-…` and `toVersionUuid` is the commit uuid ("observational only", #216 ADR D6). Traces are not tied to frozen versions.
3. **Traces are stored in the application's `model` section** (or `data` for Miroir), not in `modelVersion`. If they were on, every edit would add rows to the live model folder, and so to Git diffs.
4. **#589 (open):** the MiroirTest fails whenever the flag is off, which includes the browser self-test.
5. **The #216 ADR deferred Option B** ("Defer until Option A is shipping and WP2 fidelity requirements are clearer"). Nobody has revisited it.

## 3. How Git (#679) changes the picture

The Git work (#679, slices #680 to #683 merged, #691 Git page) gives filesystem deployments commit, branch, checkout, diff, revert, fetch, pull, push and clone from the UI. The #679 analysis (section 7) kept both futures open: F1, a version graph kept in Git where freeze also tags or commits; F2, ApplicationVersion replacing Git. It deliberately stores no Git state in model Entities, so neither future is blocked.

Consequences for the two mechanisms:

- **Traces and Git overlap.** "Accrue model changes along commits" is what a Git history of the `*_model/` folder already gives, with real diffs and branches. Git does not give resolved Actions either, so neither is a replay tape. But the traces now add little that Git lacks.
- **Freeze and Git are complementary.** A frozen version is a named, application-level, store-independent snapshot. It works on SQL, IndexedDB and MongoDB, where Git does not reach, and the `modelVersion` folder of a filesystem deployment is committed with Git anyway (#679 D2 includes it). A freeze that also creates a Git tag (F1) is a small step.
- **`versioned-external` is now concrete.** It means "Git owns history, Miroir stores only the current model". `versioned-internal` keeps its value for non-filesystem stores and for named releases.

## 4. Recommendation

**Keep freeze. Retire the evolution traces. Use Git for commit-level history.**

The case for retiring rather than parking the traces:

- They are off by default and always off in the browser, so they cost code (~800 lines, 2 entities, 3 reports, 9 test files, a nonreg step, a DomainController hook) for no runtime effect.
- Making them useful needs the WP2 work (replayable payloads, real version stamps, storage in `modelVersion`), which is a redesign of the event, not an increment.
- If exact replay between versions becomes necessary, Option B can be rebuilt on freeze: a log segment attached to each SelfApplicationVersion and stored in `modelVersion`. That is closer to the drawing than the current trace root per branch.

The case for parking them instead: they are self-contained and gated, so leaving them costs nothing at runtime, and #589 can be closed by skipping the suite when the flag is off (option 1 in the issue). If you want to keep the door open cheaply, that is the minimal move.

### Work to finish the freeze path, in order

1. **Fix #239**, the boot leak of history rows into `data`. It breaks the section invariant that everything else relies on.
2. **Finish #230** with MlSchemaVersion and MiroirTestVersion, then update the stale #227 plan and close #230.
3. **Close #225** after checking its two UX gaps, or split them into a small follow-up.
4. **Decide what a frozen version is for**, then build the first consumer. The smallest useful one is "compare two versions" (a diff view over all snapshotted types, extending `diffEntityVersionSnapshots`). The next is "restore the live model from version N". Migration apply (#9 WP2) and paired data migrations (#215) come after, and can then start from snapshot diffs (Option A) rather than traces.
5. **Connect freeze to Git (#679 F1)**: on a filesystem deployment under Git, freeze offers to commit the `modelVersion` rows and tag the commit with `versionName`.
6. **Clean up issues**: close #15 as superseded by #217; rescope #9 to "migrations between frozen versions" and drop WP1/WP2 trace wording; close or rescope #589 with the trace decision.

### If the traces are retired

Remove the two trace Entities and their EntityVersion snapshots, the three reports and two menu entries, `evolutionTrace*.ts` and their exports, `maybeRecordEvolutionTrace` and the baseline step in `Deployment.ts`, the MiroirTest, the nonreg step and the unit tests. Then close #589 and mark WP1 superseded in `code-helpers/features/9-FEATURE-…/`. This is one refactor PR, but it touches the Miroir model assets, so it needs `npm run build -w miroir-app-miroir`, a `devBuild` of core, and `nonreg:filesystem`.

## Sources

- Design: `code-helpers/features/216-FEATURE-application-versions-and-freeze/analysis.md` (ADR D2 Option A versus B, D6 commit versus freeze), `9-FEATURE-…/wp1-analysis-model-evolution-trace.md`, `wp2-analysis-application-version-migrations.md`, the principles drawing, `679-FEATURE-git-version-control/analysis.md` section 7.
- Reference: `docs/reference/versioning.md` (it does not mention evolution traces).
- Issues: open #9, #15, #215, #225, #230, #239, #589, #679 to #683; closed #216, #217, #220, #221, #222, #232, #234, #588.
