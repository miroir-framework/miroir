# Safe application evolution (#694): decisions from grilling (2026-11-07)

Source rounds: [grilling-round-1.md](grilling-round-1.md), [grilling-round-2.md](grilling-round-2.md), [grilling-round-3.md](grilling-round-3.md). Status before the grilling: [status-review-2026-11-06.md](status-review-2026-11-06.md).

## Goal

An application running on Miroir evolves safely. Model restore points exist when needed, and data migration scripts let test and validation environments (later production) follow the model. Designers choose between two workflows:
- strict version control: major / minor / patch versions, tags, packages;
- continuous delivery: feature switches, one-shot model rollback, and backward-compatible data migrations.

Process capabilities and application parameters select the mechanisms. A mechanism that is not used costs almost nothing. The epic starts with an experimental period that tries the combinations.

Git is the only way today for several designers to change one application at once. Without Git, the last writer wins. This limitation is documented and stays out of scope.

## Decisions

### Profiles and packaging
- Two levels (Q6). Application parameters on the SelfApplication row choose the mechanisms. A process capability decides whether the code is loaded.
- Application parameters (Q24): `versioningMode` is `unversioned`, `versioned-internal` (frozen versions in `modelVersion`) or `versioned-git` (renamed from `versioned-external`, which stays readable for one release). `evolutionTraces` is a boolean, allowed in both versioned modes. A `deliveryStyle` field waits for the ways-of-working analysis.
- Freeze, traces and migrations move into their own lazily loaded package (Q12). The move happens after #230 and #589, before the traces come back (Q25). Bundle-size history measures the cost.

### Versions and snapshots
- Without Git, a version is a frozen `SelfApplicationVersion` with its `*Version` snapshots in `modelVersion` (existing freeze).
- With Git, a version is a Git tag, and a snapshot is the `*_model/` folder at that tag. Frozen `*Version` rows are not used (Q7). Snapshot diffs take two model states from either source.
- Rollback with Git means checking out the tag on the Git page (Q32).

### Evolution traces
- Traces live in `modelVersion`, like the ApplicationVersion aggregate, with or without Git. There is no separate section (Q8, Q9). With Git, the `modelVersion` folder is committed with the model.
- One trace record per Miroir `commit` (one model transaction), stored as its own instance file. It holds the ordered resolved Actions (Q16). The per-branch root row goes away.
- A record holds only the resolved Actions, with no before-image (Q17, Q28). An earlier model state is rebuilt by replaying from the previous snapshot, only when a migration is generated.
- Traces cover model actions only, including Miroir's data section, which is model (Q18).
- Ordering (Q19): with Git, the ancestry of the commits that added the records. Without Git, a `previousTrace` link plus a sequence number, and freeze stamps the open records with the version they lead to.
- Inverse migrations are not a goal. Rollback goes to an explicitly frozen snapshot (Q17).

### Agreement between snapshots and traces
- A snapshot and its traces must agree. The model changes only through Miroir's interface (Q20).
- The check runs at freeze (without Git), at commit from the Git page (with Git), and at migration generation (both). A mismatch refuses the operation and shows the differences (Q29).
- Repair (Q30): the generic instance editors, plus a "re-baseline" action that freezes the live model, closes the open traces and records a marker. Migration generation does not cross the marker without a migration written by hand.

### Migrations
- A data migration script is a `CompositeActionSequence` stored as an instance of a new `Migration` Entity in `modelVersion`. It is generated as a draft from traces and snapshot diffs, then edited by the designer (Q10).
- Generation is on demand, between two model states (Q21).
- Each deployment records in Admin data, keyed by its Deployment uuid, which model state its data is at and which migrations ran (Q22). Versions, traces and migrations belong to the application. The state record belongs to the deployment.
- In continuous delivery, drop, rename and type changes are flagged as a warning at generation during the experimental period (Q23).

### Restore and rollback
- A restore point restores the model (Q11).
- For a deployment with data (Q31): the rollback from Vn to Vk is allowed when every migration applied since Vk is backward-compatible. Otherwise it is refused, and the state record names the blocking migration. The documented fallback is a store backup restored outside Miroir. Automatic backups by the migration runner are a possible later sub-issue.

### Experiments
- Two simple test cases first, one with Git and one without (Q13).

## Sub-issues, in order (Q26)

1. #225: freeze Runner. Unversioned apps greyed out with a tooltip (Q3), sidebar app as default when versioned-internal (Q4), refused freeze shown inline and in a snackbar with the test on the inline text (Q5), Runner on the Runners page. Also removes the stale #239 comment in `versioningModes.filesystem-seed.integ.test.ts`.
2. #230: MlSchemaVersion and MiroirTestVersion, so a freeze takes a full snapshot.
3. #589: the trace MiroirTest is skipped when traces are off.
4. #695: ways-of-working analysis, with and without Git. It runs in parallel with 1 to 3 and comes before 6.
5. #696: versioning package and process capability.
6. Planned: trace revival.
7. Planned: #9, rescoped to the `Migration` Entity, generation, the migration runner and the deployment state record.
8. Planned: #215, paired data migrations.
9. Planned: restore points and rollback.
10. Planned: the two experiment test cases, built up as 6 to 9 land.

Items 6, 9 and 10 become issues after the analysis (item 4). Epic documents go to `code-helpers/features/694-EPIC-safe-application-evolution/` with the analysis PR (Q27). #15 is closed as superseded by #217 (Q1).
