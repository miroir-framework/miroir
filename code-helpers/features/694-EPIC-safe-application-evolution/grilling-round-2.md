# Safe application evolution epic: grilling round 2

Settled in round 1 (answers of 2026-11-07):

- **Q1** Epic sub-issues: #225, #230, #589, #9 (rescoped to "migrations between two model states"), #215, plus new ones for the ways-of-working analysis and the trace revival. #15 is closed as superseded by #217.
- **Q2** The ways-of-working analysis starts now, in parallel with #225 and #230, and is finished before the trace revival.
- **Q3** The freeze Runner greys out every application that is not `versioned-internal` (`isApplicationVersioningCapable`), and the tooltip gives the reason.
- **Q4** From the Runners page, the Runner defaults to the sidebar application when it is versioned-internal, otherwise to no selection.
- **Q5** A refused freeze shows inline in the Runner and in a snackbar. The test checks the inline text.
- **Q6** Two levels. Application parameters choose the mechanisms, and a process capability decides whether the code is loaded at all.
- **Q7** With Git, a version is a Git tag and a snapshot is the `*_model/` folder at that tag. Frozen `*Version` rows are not used. Snapshot diffs take two model states, whatever their source.
- **Q8 / Q9** Traces live in `modelVersion`, like the ApplicationVersion aggregate, with or without Git. There is no separate `modelEvolution` section. With Git, the `modelVersion` folder is committed with the model, so traces follow branches and merges.
- **Q10** A data migration script is a `CompositeActionSequence` stored as an instance of a new `Migration` Entity. It is generated as a draft from traces or snapshot diffs and edited by the designer.
- **Q11** A restore point restores the model, with data migrated back by an inverse migration. Without an inverse, restore is refused for applications that hold data. Continuous delivery needs no data rollback. Rollback there means turning feature switches off and restoring the model, and each N to N+1 data migration must stay backward-compatible.
- **Q12** Snapshots, traces and migrations move into their own lazily loaded package. Bundle-size history measures the cost.
- **Q13** The experiment starts with two simple test cases, one with Git and one without.
- **Q14** Concurrent designers without Git: last writer wins. This is a documented limitation and out of scope.
- **Q15** #239 is closed, with the evidence in [a comment](https://github.com/miroir-framework/miroir/issues/239#issuecomment-6706002950). The #225 PR removes the stale "FAILS BY DESIGN" comment from the test.

---

## Traces

❓ **Q16** - **Granularity of a trace record.** Today there is one `ApplicationEvolutionTrace` root per application and branch, and one `ApplicationEvolutionTraceEvent` row per action. With Git, a single growing root row would conflict on every merge. Options:
(a) one record per Miroir `commit` (one model transaction), holding the ordered list of resolved Actions, as its own file (`modelVersion/<TraceEntity>/<uuid>.json`). The root-per-branch row goes away;
(b) keep one row per action, plus a root per branch;
(c) one row per action, with no root.

➡️ (a). New files never conflict in Git, a Miroir commit is the natural unit to replay, and the branch is already known from Git (or from `ApplicationModelBranch` without Git).

❓ **Q17** - **What a trace record contains.** To produce forward and inverse migrations (Q11), the record needs more than the Action. Options:
(a) the resolved Action (all parameters bound) and the before-image of each model element it changed;
(b) the resolved Action only, with inverses computed from the snapshot of the previous version;
(c) the Action and a JSON patch of the model.

➡️ (a). Without Git there may be no snapshot between two frozen versions, so the before-image is the only reliable source for an inverse. The before-image covers model elements, not data rows.

❓ **Q18** - **What gets traced.** Today the policy traces model-section actions for every app and data-section CUD for Miroir only (Miroir's data is its model layer). Options:
(a) model actions only (Entity create / alter / rename / drop, and CUD on model-section instances such as Reports and Queries), Miroir's data section included because it is model;
(b) also the data CUD of ordinary applications.

➡️ (a). Application data is not model evolution, and tracing it would grow the history with every user edit.

❓ **Q19** - **Ordering traces.** Options:
- With Git: the order of the Git commits that added the trace files (topological order of ancestry), so a merge interleaves both branches by history.
- Without Git: a `previousTrace` link plus a sequence number, and freeze stamps each open trace record with the version it leads to.

➡️ Both, as above. Each record also carries a timestamp, for display only.

❓ **Q20** - **Changes made outside traced actions.** A Git merge with conflicts resolved by hand, a model file edited in an IDE, or a `git revert` changes the model without any trace. Options:
(a) when a migration is generated between two model states, compare the replayed traces with the snapshot diff, and turn whatever the traces do not explain into "untraced change" steps taken from the diff, flagged for the designer to review;
(b) refuse to generate a migration when traces and diff disagree;
(c) ignore it.

➡️ (a). Traces give the detail, the diff guarantees completeness. This is also the "traces plus snapshot differences" combination you described.

## Migrations

❓ **Q21** - **When a migration is generated.** Options:
(a) on demand: "prepare migration from state A to state B" (two versions, two tags, or a version and the live model), which writes a draft `Migration` instance to `modelVersion`;
(b) automatically at each freeze or tag;
(c) both.

➡️ (a) for the experimental period. Automatic generation can be added once the format is stable.

❓ **Q22** - **Which model state a deployment is at.** To apply migrations to a test environment, each deployment has to know which version or Git commit its data currently matches (as Flyway's `schema_history` table does). Options:
(a) a row in the deployment's admin data, listing the model state and the migrations applied, written by the migration runner;
(b) a field on the Deployment row;
(c) infer it from the data each time.

➡️ (a). It keeps a history of applied migrations, which an audit or a re-run needs, and it stays out of the application model.

❓ **Q23** - **Backward compatibility in continuous delivery (Q11).** Who enforces that an N to N+1 migration stays backward-compatible (expand then contract: add a column before dropping the old one, never rename in one step)? Options:
(a) a check at migration generation that flags drop, rename and type changes in the continuous-delivery profile, as a warning during the experimental period;
(b) a hard refusal;
(c) designer discipline only, documented.

➡️ (a). It makes the rule visible without blocking experiments. It can become (b) later.

## Profiles, packaging, sub-issues

❓ **Q24** - **Application parameters (Q6).** Today `versioningMode` has three values. Proposal for the SelfApplication row:
- `versioningMode`: `unversioned` | `versioned-internal` (frozen versions in `modelVersion`) | `versioned-git` (renamed from `versioned-external`; versions are Git tags);
- `evolutionTraces`: boolean, allowed in both versioned modes;
- `deliveryStyle`: `strict` | `continuous`, which only turns on the Q23 check for now.

Alternatives: one enum per combination, or no `deliveryStyle` until the analysis says it is needed.

➡️ The three fields, with `deliveryStyle` left out until the ways-of-working analysis confirms it. Renaming `versioned-external` to `versioned-git` keeps the legacy value readable for one release, as `versioningEnabled` was.

❓ **Q25** - **When the code moves into its own package (Q12).** Freeze is in core today. Options:
(a) a dedicated sub-issue right after #230 and #589, before the trace revival, so traces are built in the new package from the start;
(b) after the traces;
(c) only when the bundle size calls for it.

➡️ (a). Moving freeze after #230 moves finished code once, and the revived traces never land in core.

❓ **Q26** - **Sub-issue list and order.** Proposal:
1. #225: freeze Runner ACs (Q3 to Q5), plus the stale #239 comment.
2. #230: MlSchemaVersion and MiroirTestVersion, then close.
3. #589: trace MiroirTest skipped when traces are off.
4. New: ways-of-working analysis (with and without Git), in parallel with 1 to 3.
5. New: versioning package and process capability.
6. New: trace revival (Q16 to Q20).
7. #9 rescoped: `Migration` Entity, generation from traces and diffs, migration runner, deployment model state (Q21, Q22).
8. #215: paired data migrations.
9. New: restore points (model restore with inverse migration).
10. New: the two experiment test cases (Git, no Git), built step by step as 6 to 9 land.

Should I create all the new sub-issues now, or only the epic and 1 to 5, adding the rest after the analysis?

➡️ Create the epic and items 1 to 5 now. Items 6 to 10 go in the epic body as a planned list, and become issues once the analysis has settled them. The answers in this grilling feed the analysis.

❓ **Q27** - **Where the epic's documents live.** Options: `code-helpers/features/<epic number>-EPIC-safe-application-evolution/` in the repo (analysis, grilling notes, experiment log), or only in this project's shared folder.

➡️ The repo folder, committed with the analysis PR (item 4), with these grilling rounds copied in. That follows the feature-work convention in AGENTS.md.
