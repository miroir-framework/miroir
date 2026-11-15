# 728 — TDD implementation plan: every step starts from an empty test environment state

> Vertical slices for [analysis.md](analysis.md). Each slice starts with a red test in `scripts/tests/test_run_nonreg.py`, which runs the real `scripts/run-nonreg.py` on a temporary manifest of `python -c` stubs (no mocks, except slice 5, which stubs `spawn` and `run_step` to drive `run_shared_group` without vitest).

## Test stubs

- `state_probe_step(id, state, log)`: records whether `.miroir/<state>@<worker>` exists when the step starts (and the worker it got), then writes a file into it, as a test environment opened by the step would. Exit code configurable.
- Every run in the tests passes `--environments-dir` with only the probe's environment (or an empty directory), so a test run never clears the workers of the nonreg run that started pytest.

## Slice 1. Serial runs use worker `w1`, cleared between steps (D1, D2)

- Red: `test_serial_run_gives_every_step_an_empty_worker_state`: two probe steps, `--jobs 1`. Both see no state, both run on `w1`; the run ends with no `.miroir/<state>@*`. Replaces `test_serial_run_runs_steps_one_after_the_other_without_a_worker` (keeps its "a shell worker does not reach the run" part: a `MIROIR_TEST_WORKER=w9` in the environment is ignored, steps get `w1`).
- Green: a `Workers` class (acquire, finish) shared by `run_serial` and `run_parallel`; `run_serial` gives each unit a worker and finishes it after the unit; the `run_nonreg` test helper passes an empty environments directory to every run.

## Slice 2. Parallel runs clear a worker after every unit (D1)

- Red: `test_parallel_run_gives_every_step_an_empty_worker_state`: five probe steps, `--jobs 2`, so each worker runs two or three. No step sees state.
- Green: `run_unit` finishes its worker (clear) in the pool thread before returning; the worker goes back to the free list only after the clear.

## Slice 3. A killed run's leftovers are cleared at first use (D1)

- Red: `test_leftover_worker_state_is_cleared_before_the_first_step`: create `.miroir/<state>@w1` before the run; the first probe step sees none.
- Green: `Workers.acquire` clears a worker the first time the run uses it.

## Slice 4. `--keep-worker-state` keeps the state of failed units only (D3, D5)

- Red: `test_keep_worker_state_keeps_failed_units_and_clears_passed_ones`: probe steps `ok`, `fails` (exit 3), `after`, `--jobs 1 --keep-worker-state`. `after` sees no state and runs on `w2`; `.miroir/<state>@w1` (from `fails`) stays; `summary["worker_state"] == "kept"`, `summary["kept_workers"] == ["w1"]`. Replaces the `kept` half of `test_worker_state_is_removed_after_the_run_unless_kept`; its `removed` half stays.
- Green: `Workers.finish(worker, failed)` retires a failed worker when keeping; `acquire` creates `w<max+1>` when none is free.

## Slice 5. A shared-group member's legacy re-run starts from an empty state (D4)

- Red: `test_a_shared_member_rerun_starts_from_an_empty_worker_state` (unit level, through `load_runner`): `run_shared_group` with a `fresh_worker` callback, `spawn` stubbed to fail the launch, `run_step` stubbed to record the worker it got. The group's worker is released as failed before the first re-run, a failed re-run's worker is released as failed before the next, and each re-run records its own worker.
- Green: `run_shared_group(..., fresh_worker=...)`; `run_unit` passes a callback that releases the current worker and acquires the next, and releases the last one according to the last re-run's status.

## Slice 5b. Alone steps get a worker, the bracket does not (D2)

- Red: `test_a_step_that_runs_alone_gets_an_empty_worker_state` (`--jobs 1` and `--jobs 2`), `test_a_step_without_worker_runs_on_none`, and `test_the_run_bracket_runs_alone` asserting that only the two `unit-321-*` steps carry `"worker": false`.
- Green: `Unit.needs_worker`; `"worker": false` on the bracket in `scripts/nonreg-manifest.json`.

## Slice 6. Docs

- `docs/reference/testing.md`: the `--jobs` paragraph (serial runs on `w1`, per-unit clear, `--keep-worker-state` retires failed workers, `kept_workers`), and the `--jobs` / `--keep-worker-state` help strings.

## Closing checks (acceptance criteria of #728)

| Criterion | Proof |
|---|---|
| Every step starts with no worker state, serial, parallel, `--only` | Slices 1, 2, 3 (`--only` selects steps; it runs through the same code) |
| `--jobs 1` gives steps a worker cleared between steps | Slice 1 |
| `--keep-worker-state` keeps failed units, reports where, clears passed | Slice 4 |
| Covered in `test_run_nonreg.py` | Slices 1 to 5 |
| `nonreg:filesystem --runner shared` gives the same verdicts | Run after slice 6, compared with the latest snapshot on `_integration` |
