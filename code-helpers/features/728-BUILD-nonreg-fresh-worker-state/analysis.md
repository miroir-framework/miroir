# 728 — Nonreg: every step starts from an empty test environment state

> Analysis of gap G1 of the nonreg parallelization study: a nonreg worker carries test environment state from one step to the next, so a step's starting state depends on the run mode and on timing. This document records the decisions for clearing that state per unit, in serial and parallel runs.

**Status:** written AFK. Decisions D1 to D5 are defaults taken without a grilling round; A reviews them on the PR. Facts checked on `_integration` at `71c27fd`.

## Related

- Issue: https://github.com/miroir-framework/miroir/issues/728
- Workers and `remove_worker_state`: #477, [../477-BUILD-nonreg-parallel-jobs/analysis.md](../477-BUILD-nonreg-parallel-jobs/analysis.md)
- Parallel-only failures that motivate it: #708 TDD plan slice 8, #584
- Out of scope, related: G2 (Windows reseed, #584), G8 (isolation between separate `nonreg` invocations)
- Code: [`scripts/run-nonreg.py`](../../../scripts/run-nonreg.py), [`packages/miroir-env/src/clearCommand.ts`](../../../packages/miroir-env/src/clearCommand.ts), tests [`scripts/tests/test_run_nonreg.py`](../../../scripts/tests/test_run_nonreg.py)

## Goals

| # | Goal |
|---|---|
| G1 | **Same verdict whatever the run mode.** In order to trust a nonreg verdict as a Miroir developer, I can run a step serially, in parallel or with `--only` and get a step that starts from the same empty state each time. |
| G2 | **Inspect a failure.** In order to diagnose a failed step as a Miroir developer, I can keep the state the failed step left behind, and find where it is. |
| G3 | **No slower than needed.** In order to keep the nonreg run short as a Miroir developer, I pay for the clearing only where there is state to clear. |

## Non-goals

- Making the reseed of copy sections atomic on Windows (G2 of the study, #584).
- Isolating two separate `nonreg` invocations on one checkout (G8 of the study). `RunLock` still refuses the second run on the same results root.
- Per-step isolation inside a shared group. A shared group is one vitest launch; its members share state in sequence, as in a serial run (study, G9).

## Decision record

All decisions were taken as defaults (AFK) and are open for review on the PR.

| # | Question | Choice | Goals |
|---|---|---|---|
| D1 | When is a worker's state cleared? | After every unit (step or shared group), before the worker takes another unit; and once when a worker is first used in the run, for leftovers of a killed run | G1, G3 |
| D2 | What does `--jobs 1` run on? | Worker `w1`, cleared between units, through the same worker code as a parallel run. Every unit gets a worker, `"parallel": false` ones included, except steps marked `"worker": false` (the run bracket) | G1 |
| D3 | What does `--keep-worker-state` keep? | The state of each failed unit: its worker is retired (not reused), and the next unit gets a new worker number | G2 |
| D4 | Where does the legacy re-run of a failed shared-group member start? | On a fresh worker: the runner releases the current one (cleared, or kept when it failed and `--keep-worker-state` is on) and takes the next | G1, G2 |
| D5 | What does the summary report? | `worker_state` as today (`removed`, `incomplete`, `kept`), plus `kept_workers` when some are kept; each step keeps its `worker` (a re-run records its own); the console names the kept directories and database prefixes | G2 |

### D1. When is a worker's state cleared?

At stake: on `_integration`, `w2` runs `integ-runner.freezeApplicationVersion` after whatever steps the scheduler gave it before. In 2 of 3 shared runs on 2026-10-29 it failed; alone it passed in 22 s (#584).

| Option | Pros | Cons |
|---|---|---|
| **A. After every unit, plus at first use (chosen)** | A unit always starts empty; the state a failed unit left is still there when the unit ends, so D3 can keep it; the first unit of a run does not inherit a killed run's leftovers | One clear per unit |
| B. Before every unit | Same start state | The last unit's state stays until an end-of-run clear; D3 has to look back to the previous unit |
| C. Only at the end of the run (today) | Cheapest | Fails G1 |

Cost (G3): `remove_worker_state` already skips environments with no `.miroir/<environment>@<worker>` directory. A filesystem or IndexedDB environment costs a directory removal; a PostgreSQL or MongoDB environment costs one `miroir-env clear` (a node start plus a server round trip, a few seconds), only when the unit opened it.

The clear runs in the pool thread of the unit, so it overlaps with the other running units. It is not counted in the step's `duration_s`.

### D2. What does `--jobs 1` run on?

At stake: today `--jobs 1` runs without a worker, in `.miroir/<environment>/`. That is also the state a developer's own `MIROIR_ENV=test-filesystem` session uses, so a serial nonreg starts from whatever the developer left there, and leaves its own state behind.

| Option | Pros | Cons |
|---|---|---|
| **A. Worker `w1`, same worker code as parallel runs (chosen)** | Serial and parallel runs share one start-state rule; the developer's unworkered state is not touched | Changes the serial contract of #477 (`MIROIR_TEST_WORKER` is now set in serial runs) |
| B. No worker, clear `.miroir/<environment>/` between steps | No worker | Deletes the developer's own test state; a second code path |

`run_serial` stays (it prints each step as it goes, where `run_parallel` buffers a unit's lines), but takes its workers from the same `Workers` object as `run_parallel`.

Steps with `"parallel": false` are not only the run bracket: 11 steps have it, and several open `test-filesystem` (`integ-git-version-control`, `integ-696-versioning-capability`, `integ-708-evolution-trace-records`, `unit-636-server-library`, `unit-639-startup-calls`). On `_integration` they run without a worker in parallel runs, so they share the unworkered state with each other and with the developer. With #728 they run alone *and* on a worker. Only the two steps of the run bracket (`unit-321-environment-before`, `unit-321-tracked-assets`) run without one; they read the unworkered environments (`miroir-env show`, `check --since`) and get a new manifest field, `"worker": false`, so the rule does not depend on step ids.

### D3. What does `--keep-worker-state` keep?

At stake: with D1, a failed step's state is gone by the time the run ends, so `--keep-worker-state` as defined in #477 (keep every worker at the end) would keep only the last unit of each worker.

| Option | Pros | Cons |
|---|---|---|
| **A. Retire the failed unit's worker (chosen)** | Works for directories and for SQL schemas and MongoDB databases, which are named after the worker (`test_sql_w2_<app>`) and cannot be renamed cheaply | Worker numbers above `--jobs` appear (`w5` in a 4-job run) |
| B. Rename `.miroir/<environment>@<worker>` to a name with the step id | Readable name | Does not cover databases; the name is not a valid worker, so `miroir-env` cannot open or clear it |
| C. Keep everything, clear nothing | Simple | Fails G1 when the option is on |

Passed units are cleared even with the option. Without the option, failed units are cleared too.

### D4. Where does the legacy re-run of a failed shared-group member start?

At stake: when a shared-group member fails, `run_shared_group` re-runs it alone (legacy) to tell a real failure from a leak between files of the group (`shared_state_leak_suspected`). Today that re-run starts with the whole group's state, so it is not "alone" for the stores.

Chosen: before each legacy re-run, release the current worker and take another one (`fresh_worker` callback of `run_shared_group`). Without `--keep-worker-state` the released worker is cleared and usually comes straight back, so the cost is one clear. With it, the group's state (when the launch failed) and the state of each failed re-run are kept, each on its own worker, so a `shared_state_leak_suspected` member can be diagnosed from the group's state. The scheduler counts running units, not workers, so a re-run that takes a new worker number never raises the number of units running at once.

Rejected: clearing the group's worker before each re-run (the first version of this analysis). The adversarial review showed it loses the group's state and every failed re-run's state but the last.

### D5. What does the summary report?

`worker_state` keeps its values: `removed` when every clear succeeded, `incomplete` when a `miroir-env clear` failed, `kept` when `--keep-worker-state` kept at least one worker. New key `kept_workers` (sorted list) when some are kept. `worker_state_warnings` still lists the `warning:` lines of `miroir-env clear` (database server not reachable). Per-unit clears print only failures and warnings, not the `removed ...` lines, so the console keeps one block per step.

## Current state

- `run_parallel` (`scripts/run-nonreg.py:1175-1231`) keeps `free_workers = [w1..wN]`, gives the first free worker to each unit, and puts it back when the future completes. No clear between units.
- `run_serial` (`:1074-1118`) passes no worker to `run_step` or `run_shared_group`.
- `main` (`:1401-1419`) calls `remove_worker_state(workers_used)` once after the run, unless `--keep-worker-state`.
- `remove_worker_state` (`:1234-1264`) loops over `environments/test-*.json`; for each existing `.miroir/<environment>@<worker>` it removes the directory, or runs `miroir-env clear --name <environment>` with `MIROIR_TEST_WORKER=<worker>` when the environment has a `postgres` or `mongodb` connection. `miroir-env clear` removes the directory and drops the schemas or databases prefixed `test_<storage>_<worker>_` (`clearCommand.ts:121-140`).
- `run_shared_group` (`:588-707`) re-runs a failed member with `run_step(..., worker=worker)` on the same worker, without a clear.
- Worker names must match `w<number>` (`environmentFiles.ts` `environmentStateName`), so `w5`, `w12` are valid.
- Tests: `test_run_nonreg.py` asserts that a serial run has no worker (`test_serial_run_runs_steps_one_after_the_other_without_a_worker`) and that the state of `--keep-worker-state` stays after the run (`test_worker_state_is_removed_after_the_run_unless_kept`). Both change with D2 and D3. The `run_nonreg` helper passes `--environments-dir <empty>` only to parallel runs; with D2 a serial test run would clear the real `.miroir/test-*@w1`, which belongs to the nonreg run that started pytest (`scripts/tests` is a nonreg step). The helper must pass an empty environments directory to every run.

## Key reuse

| Piece | Location |
|---|---|
| `remove_worker_state` | `scripts/run-nonreg.py` |
| `miroir-env clear` | `packages/miroir-env/src/clearCommand.ts` |
| Thread-local console buffer `emit` | `scripts/run-nonreg.py` |
| Test stubs `worker_state_step`, `timed_step`, `run_nonreg` | `scripts/tests/test_run_nonreg.py` |

## Adversarial review

A reviewer read this analysis and the plan cold against the code. Findings and answers:

| # | Finding | Answer |
|---|---|---|
| 1 | Blocker: `"parallel": false` steps other than the bracket open `test-filesystem` without a worker | Fixed: D2 now gives them a worker; the bracket is marked `"worker": false`; test `test_a_step_that_runs_alone_gets_an_empty_worker_state` |
| 2 | Serial runs had no rule for alone units | Fixed with 1: one rule, `Unit.needs_worker`, in both modes; tests for both modes |
| 3 | The clear at first use skips databases when the `.miroir/<environment>@<worker>` directory is gone | Rejected for now: `remove_worker_state` keys on the directory, and running `miroir-env clear` for every database environment at every first use would cost a node start per environment and worker, and print a warning on every run of a developer with no PostgreSQL. Leftover schemas without a directory need a run killed inside a reseed; the next step's own reseed of its copy sections does not cover them, but `miroir-env clear` by hand does |
| 4 | D4 cleared the group's state before re-runs, so `--keep-worker-state` lost it | Fixed: D4 now takes a fresh worker per re-run |
| 5 | The analysis does not say which state caused the #584 failure | Not established. The fix does not depend on it: it removes every kind of carried state the runner can see. The closing check is the shared-runner filesystem nonreg; a verdict that changes is examined one by one |
| 6 | "Reports where it is" is thin | Fixed: the console names the kept directories and the `test_<storage>_<worker>_*` prefixes; docs give the `miroir-env clear` command |
| 7 | The analysis described tests as "today" while the tests were already rewritten | The "Current state" section describes `_integration`; unchanged |
| 8 | Plan says four probe steps, test has five; slice 5 uses stubs | Plan updated |
| 9 | Two pytest runs at once share the probe state | Fixed: the probe environment name has the pytest process id |
| 10 | Comments and `--jobs` help text | Updated |

Next: [tdd-implementation-plan.md](tdd-implementation-plan.md).
