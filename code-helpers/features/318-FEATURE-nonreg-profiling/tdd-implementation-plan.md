# Issue #318 — TDD Implementation Plan

> Integration-first, no mocks. The harness is tested through its public entry points: `run-nonreg.py` (pytest in `scripts/tests`, which runs the real script on small real manifests), the package launchers (vitest unit tests on the argv/env they produce), and real vitest runs on the filesystem profile. No test file, `RunnerTestSession` or UI launch code changes, except where a slice names it.

**Resume note:** analysis confirmed 2026-09-27. Branch `318-FEATURE-nonreg-profiling`, from `_integration` 76e52aa. Next: Slice 6.

## Scope

In scope: D1–D6 of [`analysis.md`](./analysis.md). That covers the opt-in timing profile, the opt-in shared runner with legacy default and fallback, the `perSuite` reset policy for CLI runs, the transformer step fix, the fixes for launch tests that hit Postgres, and the lazy `getState()` log argument.

Out of scope: changes to the UI test runs; timing trends across runs (#306); step id renames (#316); parallel execution; making `shared` the default.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/318
- Analysis: [`./analysis.md`](./analysis.md)
- Branch: `318-FEATURE-nonreg-profiling` → PR against `_integration`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the legacy nonreg contract | ✅ DONE | `scripts/tests/test_run_nonreg.py` |
| 1 | Clean filesystem baseline (D5, D6) | ✅ DONE | the 4 steps pass on `emulatedServer-filesystem` |
| 2 | Opt-in timing profile (D1) | ✅ DONE | `--timings` writes `timings.json` with hook times; nothing written without it |
| 3 | Shared runner for testByFile groups (D2) | ✅ DONE | `--runner shared` on the storage group: same per-step verdicts, lower wall time |
| 4 | Shared runner for runner/action suites (D2) | ✅ DONE | new shared entry: one session per suite, same results as legacy |
| 5 | `perSuite` reset policy (D4) | ✅ DONE | timing report shows one reset per marked suite; results unchanged |
| 6 | Lazy store-state logging | ⬜ pending | reset time before/after, from `--timings` |
| 7 | Migrate descriptors, docs, compare full runs | ⬜ pending | legacy vs shared `nonreg:filesystem` on the same verdicts |

## Locked implementation defaults

| # | Default |
|---|---|
| D1 | `run-nonreg.py --timings` (off by default) sets `MIROIR_TEST_TIMING=1` and `MIROIR_TEST_TIMING_DIR=<snapshot>/timings/<step>` for each step. A launcher adds the timing reporter only when `MIROIR_TEST_TIMING=1`. Without the flag, the argv, env, output files and `summary.json` keys are identical to today. |
| D2 | `run-nonreg.py --runner legacy\|shared`, default `legacy`. A step joins a shared group only if it has an optional `shared` descriptor in the manifest. Groups run with `--no-isolate`. A failing shared group re-runs its failed steps in legacy mode, and each step records `mode` = `legacy`, `shared`, or `shared→legacy`. |
| D3 | New code only in `scripts/run-nonreg.py`, `scripts/nonreg-manifest.json`, the package `scripts/` launchers, `tests/helpers/*FromCLI*` and new entry files. No changes to `RunnerTestSession`, `IntegrationTestSession`, `resetIntegTestbed`, `uiIntegrationTestLauncher*` or the views. |
| D4 | Optional MiroirTest suite attribute `testbedReset: "perTest" \| "perSuite"`, absent = `perTest`. Honoured by the CLI helpers only. testByFile files with only read-only tests move their reset to `beforeAll`. |
| D5 | The `testMiroir` launcher creates the gitignored `tests/tmp` parent directory before validation. |
| D6 | The launch tests read the profile from the launch env (`MIROIR_TEST_PROFILE`, set by `applyIntegrationTestProfile`), falling back to `emulatedServer-sql` when it is absent. |

## Allocated keys

- Manifest step field `shared`: `{ "launcher": "testByFile" | "testMiroir", "package": "<workspace>", "files"?: [..], "suites"?: [..], "profile"?: "{profile}", "env"?: {..} }`
- Env: `MIROIR_TEST_TIMING`, `MIROIR_TEST_TIMING_DIR`, `MIROIR_TEST_PROFILE` (check whether it already exists before adding it)
- CLI: `run-nonreg.py --timings`, `--runner legacy|shared`
- Shared runner/action entry: `packages/miroir-standalone-app/tests/miroir-runner-tests-shared.integ.test.ts`
- Timing reporter: `scripts/vitest/timingReporter.mjs` (plain JS, loaded by vitest in every package)
- MiroirTest suite attribute: `testbedReset`

## Test execution conventions

| Purpose | Command |
|---|---|
| nonreg harness | `python -m pytest scripts/tests -q` |
| launcher unit tests | `npm run testByFile -w miroir-standalone-app -- test-by-file.profile.unit testByFileLaunch.integ` |
| one integ step | `npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem <file>` |
| runner suites | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites <s> --mode integ` |
| schema change | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| safety net | `npm run nonreg:filesystem` (legacy); `python scripts/run-nonreg.py --tier default --run-all --profile emulatedServer-filesystem --runner shared` |

---

## Slice 0 — Characterize the legacy nonreg contract

**Status:** ✅ DONE

**Goal:** lock what `run-nonreg.py` does today, so later slices can prove that the default is unchanged.

**RED/GREEN (characterization):** `scripts/tests/test_run_nonreg.py` runs the real script against a temporary manifest of `python -c` steps (pass, fail, `{profile}` expansion). It asserts:
- the exact argv each step received (echoed by the step);
- the `summary.json` keys and per-step fields;
- the log file per step;
- no `timings.json` and no `timings/` directory.

**Refactor checkpoint:** let the manifest path and results root be overridden (a CLI flag or env), so tests do not touch the repo's manifest. The default stays the same.

**Validation:** `python -m pytest scripts/tests -q`

### Realization

- `run-nonreg.py` gains `--manifest` and `--results-root` (defaults unchanged), plus `repo_relative()` so snapshot paths outside the repo are written as absolute paths instead of raising.
- `scripts/tests/test_run_nonreg.py` (3 tests) locks, for the default run:
  - `{profile}` expansion;
  - the exact `summary.json` keys and per-step fields;
  - the snapshot contents (`logs/`, `summary.json`, `summary.md`, and nothing else);
  - `--fail-fast` producing `not_run`.

---

## Slice 1 — Clean filesystem baseline (D5, D6)

**Status:** ✅ DONE

**Goal:** `nonreg:filesystem` no longer runs 0 transformer tests and no longer reaches Postgres.

**RED:**
- Delete `packages/miroir-standalone-app/tests/tmp`, then run `integ-transformer-miroirCoreTransformers`. It fails with "Parent directory … does not exist".
- `appstack-uiIntegrationTestLauncher.integ` and `appstack-MiroirTest{Display,List}IntegrationLaunch` on `--profile emulatedServer-filesystem` fail with ECONNREFUSED 5432.

**GREEN:**
- `prepareTestMiroirLaunch` creates the `tests/tmp` parent (`mkdirSync(…, { recursive: true })`) when the resolved profile uses the filesystem store. Unit test in the existing launcher test file.
- `uiIntegrationTestLauncher.integ.test.ts` and `miroirTestDisplayIntegrationLaunchMocks.ts` take the profile from the launch env, falling back to `emulatedServer-sql`. The expected `Profile:` text follows from that.

**Refactor checkpoint:** one helper, `resolveLaunchProfileName(env)`, shared by both test files.

**Validation:** the 4 steps above on `emulatedServer-filesystem`; the launcher unit tests; `tsc` on miroir-standalone-app.

### Realization

- D5: `prepareMiroirCoreIntegTestLaunchDirectories(testSessionOptions)` (`tests/helpers/miroirCoreIntegTestLaunch.ts`) creates the parent of the filesystem test-app root. `miroir-core-tests.integ.test.ts` calls it before the validation.
  - Deviation from the plan: it lives in the entry helper, not in `prepareTestMiroirLaunch`. The launcher does not know the resolved app root, and the entry is CLI-only, so this is still harness level.
  - Proof: after `rm -rf tests/tmp`, `miroirCoreTransformers` runs 261 tests and all pass (before: 0 run, launch error). There is a new unit test in `miroirCoreIntegTestLaunch.unit.test.ts`.
- D6:
  - `testByFileLauncher` sets `MIROIR_TEST_PROFILE` from `--profile`. This env var is new: nothing used it before.
  - `tests/helpers/launchProfileName.ts` (`resolveLaunchProfileName`, default `emulatedServer-sql`) is used by `uiIntegrationTestLauncher.integ.test.ts` and by the Display/List launch mocks. There are 3 mock files, not 2: `miroirTestListIntegrationLaunchMocks.ts` also hardcoded sql.
  - The `Profile: emulatedServer-indexedDb` assertions stay as they are: they check the UI preference, not the profile Node loads.
  - On filesystem: `uiIntegrationTestLauncher.integ` 11 s, `MiroirTestDisplayIntegrationLaunch` 12 s, `MiroirTestListIntegrationLaunch` 9 s, all passed (before: ECONNREFUSED, and 190 s timeouts for the last two).
  - Without `--profile` the tests still load `emulatedServer-sql`, as before.

---

## Slice 2 — Opt-in timing profile (D1)

**Status:** ✅ DONE

**Goal:** `run-nonreg.py --timings` produces, per step, test file and test, the time spent in collect, each hook kind and test bodies, plus a slowest-first section in `summary.md`.

**RED:**
- pytest: with `--timings`, a step that is a real vitest launch (a small miroir-core `testByFile` target) yields `<snapshot>/timings.json` with non-empty `hooks` (`beforeEach` / `beforeAll` durations) and `tests` entries. Without the flag, the Slice 0 assertions still hold.
- vitest: the runner/action CLI helper records session init as a phase named `session.init`. That time is otherwise hidden in collect (analysis §3.1).

**GREEN:**
- `scripts/vitest/timingReporter.mjs` implements `onHookStart/onHookEnd`, `onTestCaseResult`, `onTestModuleEnd` (diagnostics) and `onTestRunEnd`. It writes `$MIROIR_TEST_TIMING_DIR/<pid>.json`.
- Launchers (standalone-app `testByFile` / `testMiroir`, miroir-core `testMiroir`) append `--reporter=<abs path>` when `MIROIR_TEST_TIMING=1`. The package vite configs add it to `reporters` under the same condition, for steps that call `vitest run` directly.
- `runMiroirRunnerTestsFromCLI` / `runMiroirCoreTestsFromCLI` wrap `initSession()` / `teardown()` in timers that write to the same directory, only when the flag is set.
- `run-nonreg.py` merges the files into `timings.json` and adds "Slowest steps / tests / hooks" to `summary.md` only when `--timings` is set.

**Refactor checkpoint:** the argv-append logic becomes one exported function, reused by all launchers.

**Validation:** pytest; the launcher unit tests; `python scripts/run-nonreg.py --tier default --run-all --profile emulatedServer-filesystem --timings` (full timed baseline, kept in the Realization).

### Realization

**Deviation: a vitest *runner*, not a reporter.** Reporter hook events reach the main process through `updateTask`, which is throttled to 100 ms (`@vitest/runner` `sendTasksUpdateThrottled`). That is too coarse for tests of about 80 ms. It also showed that vitest's reported test duration *includes* `beforeEach`/`afterEach`, so the 0.6 s "integ test" of the baseline was mostly reset.

- `scripts/vitest/timingRunner.mjs` subclasses `VitestTestRunner` and measures in the worker:
  - it adds `runTask` to time the body;
  - `beforeEach` = try start → body start; `afterEach` = body end → task end;
  - `beforeAll`/`afterAll` per suite are derived from its first and last child;
  - collect/setup/prepare come from the file task.

  It writes one JSON per test file into `$MIROIR_TEST_TIMING_DIR`, and exposes `globalThis.__miroirTestTiming.phase()` for named phases.
- `scripts/vitest/timing.mjs` `miroirTestTimingConfig()` returns `{ runner }` only when `MIROIR_TEST_TIMING=1`, and `{}` otherwise. It is spread into `test` in the configs of the 11 packages nonreg runs: miroir-core, standalone-app, both local caches, 5 deployment packages, miroir-mcp and miroir-ai. No launcher argv changes were needed.
- `tests/helpers/testTimingPhase.ts` `timedTestPhase("session.init", …)` wraps `initSession()` in both CLI helpers. Without the runner it only calls `initSession()`.
- `run-nonreg.py --timings` sets the two env vars per step and writes `timings.json` plus three slowest-first tables in `summary.md` (steps, files by hook time, tests). It adds `timings_json` to `summary.json` only with the flag.
- Proof:
  - `scripts/tests/fixtures/vitest-timing` has known sleeps (beforeAll 150, beforeEach 200, body 100, afterEach 30, afterAll 50 ms), and the pytest checks each within its bounds.
  - Without `--timings`, the same fixture step writes no timing artifacts.
  - The vitest-backed cases skip when `node_modules/vitest` is absent, because pr-checks runs pytest before `npm ci`.

First measurements (4 steps, filesystem):

| Step | Wall | Collect | Hooks | Test bodies |
|---|---|---|---|---|
| `integ-transformer-miroirCoreTransformers` (261 tests) | 29.3 s | 5.4 s | **20.9 s** (beforeEach) | 0.19 s |
| `integ-action-domain_controller_model_crud` (8 tests) | 14.3 s | 6.6 s (session.init 0.04 s) | 3.6 s | 0.58 s |
| `appstack-ExtractorPersistenceStoreRunner.integ` (11 tests) | 13.8 s | 7.7 s | 3.7 s | 0.06 s |

Resets are about 85–99 % of integ test time. Slice 5 is worth more than the analysis estimated.

---

## Slice 3 — Shared runner for testByFile groups (D2)

**Status:** ✅ DONE

**Goal:** `--runner shared` runs the storage integ steps in one vitest launch, with the same per-step verdicts.

**RED:**
- pytest, using a temporary manifest with `python` stub steps and a stub launcher:
  - steps with the same `shared` key form one group;
  - steps without a descriptor run legacy;
  - a failing group re-runs its failed steps legacy and records `shared→legacy`;
  - `--runner legacy` ignores descriptors.
- Real run: `shared` descriptors on the 3 storage integ steps. `--runner shared --only <ids>` → 3 rows, all passed, with wall time below the legacy sum.

**GREEN:**
- `run-nonreg.py`: grouping, one launch per group through the package's `testByFile` with `--no-isolate --reporter=json --outputFile=<snapshot>/shared/<group>.json` plus the verbose reporter, then mapping per step (test file → step).
- `testByFileLauncher` passes `--no-isolate` through unchanged (it already forwards unknown args). Check that `--bail=1` is disabled for groups, so one failure does not hide the other steps.

**Refactor checkpoint:** a `StepRunner` strategy in `run-nonreg.py` (legacy / shared) behind the existing `run_step` loop.

**Validation:** pytest; the real run above; `npm run nonreg:filesystem` unchanged (legacy).

### Realization

- The descriptor is generic, so `run-nonreg.py` knows nothing about packages: `"shared": {"group", "argv", "files"}`.
  - Every member of a group has the same argv prefix, which is validated.
  - The group runs `<prefix> --no-isolate --reporter=json --outputFile.json=<snapshot>/shared/<group>.json <all files>`.
  - Each step's verdict comes from the report entries whose path contains one of its files. The step's `duration_s` is the sum of those files' durations, and `shared_group_duration_s` is the group's wall time.
  - For the standalone-app launcher, the prefix carries `--no-bail`, so one failure does not hide the other steps.
- Fallback: a member that fails, or has no results, in shared mode re-runs alone with its legacy argv. It records `mode: "shared→legacy"` and `shared_status`, plus `shared_state_leak_suspected: true` when it passes alone.
- Legacy summaries are unchanged. The shared-only fields live in `StepResult.extra` and are merged by `step_to_dict`. `summary["runner"]` is written only for `shared`.
- `spawn()` was extracted from `run_step` (refactor checkpoint) and is reused by the group run.
- Timings in shared mode go to `timings/shared-<group>/`. They are then copied to each member's directory by file match, so `timings.json` keeps one entry per step.
- Finding: with `pool: threads` + `singleThread` (the repo's setting), `globalThis` already persists across files **with** isolation. Isolation only resets the module graph, so `--no-isolate` adds only module-level state sharing: loggers, `ConfigurationService`, store registrations. The fixture leak files (`scripts/tests/fixtures/vitest-shared/leak-*.fixture.test.mjs`) interfere through a shared module for this reason.
- Proof:
  - pytest (3 new tests):
    - one launch and one row per step;
    - a step without a descriptor still runs legacy;
    - the leak pair passes through the fallback and is flagged;
    - a real failure stays failed;
    - `--runner legacy` ignores descriptors and writes the exact legacy fields.
  - Real run: the 3 storage integ steps with descriptors, `--runner shared` on filesystem, all passed in **16.3 s** vs 39.7 s legacy. The second and third files collect in about 20 ms instead of about 7 s.

---

## Slice 4 — Shared runner for runner/action suites (D2)

**Status:** ✅ DONE

**Goal:** the `integ-runner-*` / `integ-action-*` steps share one launch, with one session per suite.

**RED:** `testMiroir --profile emulatedServer-filesystem --suites domain_controller_data_crud,domain_controller_model_crud --mode integ --shared` runs both suites, each in its own `describe` with its own session and seed. The results match the two legacy runs.

**GREEN:**
- New entry `miroir-runner-tests-shared.integ.test.ts` and a helper `runMiroirRunnerSuitesSharedFromCLI` (per-suite `describe`, `beforeAll(initSession)`, `beforeEach(testSession.beforeEach)`, `afterAll(teardown)`).
- `testMiroirLauncher` selects it only with `--shared`.
- The legacy entry and `runMiroirRunnerTestsFromCLI` are unchanged.
- The manifest `shared` descriptor uses `launcher: "testMiroir"`, and `run-nonreg.py` merges the suite lists of a group.

**Refactor checkpoint:** extract `createSessionParamsForSuite` from the legacy entry into a helper both entries import. The code moves without changing, so legacy behaviour holds.

**Validation:** the RED command; pytest; the `integ-*` steps in `--runner shared` vs legacy.

### Realization

- `testMiroir ... --shared` routes runner/action suites to `tests/miroir-runner-tests-shared.integ.test.ts` (`testMiroirLauncher.ts`, `MIROIR_RUNNER_TEST_SHARED_VITEST_ENTRY`). Without the flag, the entry is the legacy one. `test-miroir-runner.ts` now forwards `--reporter=` / `--outputFile*` arguments to vitest (`forwardedVitestArgs`).
- `tests/helpers/runMiroirRunnerSuitesSharedFromCLI.ts` gives each suite a `describe` with its own session (`beforeAll` init, the usual per-leaf `beforeEach`, `afterAll` teardown + results display). Leaves are registered while collecting, so they receive a late-bound execution environment (a Proxy over a holder that `beforeAll` fills). Suite `testParams` are merged the same way as in legacy.
- `createRunnerSuiteSessionParams` moved unchanged from the legacy entry to `tests/helpers/runnerSuiteSessionParams.ts`; the legacy entry calls it. The shared entry keeps the legacy `pageLabel`.
- `run-nonreg.py` descriptor `"suites": [...]` (instead of `files`): the group runs `<prefix> --reporter=json --outputFile.json=… --suites a,b,…`. Verdicts are split by the first describe title, and timings by test-name prefix.
- 14 steps got descriptors (group `standalone-app-runner-suites`): every `testMiroir` integ step on `{profile}` except `miroirCoreTransformers`, which is a core entry. `runner_freeze_application_version` (fixed filesystem profile) and `evolutionTraceWP1` (bash + env) stay legacy.
- **Problem met: an idle of about 85 s after the last suite.** A CPU profile of the worker showed 85 s in `MiroirEventService.getAllEvents` (sorting every event), called from `_runMiroirTestWithTracking`'s `finally` → `exportFailedRunIfNeeded` for every tracked test. Events accumulate for the life of the process, so the cost grows quadratically with the number of tests in one launch.
  - Harness fix: the shared helper clears the event service in each suite's `afterAll`, the state a legacy launch starts every suite with.
  - The same eager sort also runs in legacy launches and in the UI's in-browser runs. It is proposed as a follow-up: build the events lazily, only when a run failed. That changes miroir-core, which is out of scope here.
- Proof:
  - pytest `test_shared_suites_group_maps_results_by_describe`: a suite launcher fixture, verdicts per describe, timings split, and a failing suite falls back.
  - Launcher unit tests: routing with/without `--shared`, forwarded args.
  - Real run, filesystem: the 14 steps take **39 s shared vs about 202 s legacy** (baseline sum), 47 tests, all passed in shared mode. A legacy single-suite run is still green.

---

## Slice 5 — `perSuite` reset policy (D4)

**Status:** ✅ DONE

**Goal:** a suite marked `testbedReset: "perSuite"` resets once per suite in CLI runs, and read-only testByFile files reset once per file.

**RED:**
- The timing report (Slice 2) for a marked suite shows 1 `beforeEach` reset instead of N.
- `resolveSuiteTestbedReset(suite)` unit tests: absent → `perTest`.
- The UI path is unchanged: `RunnerTestSession.unit` still passes with no edits.

**GREEN:**
- Schema: optional `testbedReset` on the MiroirTest suite, then rebuild `deployment-miroir` and `devBuild` miroir-core.
- CLI helpers guard `testSession.beforeEach()` to run once per suite when the suite is `perSuite`.
- Mark the clearly read-only suites (list them in the Realization, each leaf checked). Move the reset in `ExtractorPersistenceStoreRunner.integ` and `ExtractorTemplatePersistenceStoreRunner.integ` from `beforeEach` to `beforeAll`.
- The core transformer entry gets the same guard for `IntegrationTestSession.beforeEach`, if the transformer suites are marked.

**Refactor checkpoint:** one `withTestbedResetPolicy(policy, reset)` wrapper used by both CLI helpers.

**Validation:** `modelValidation` for deployment-miroir; the touched suites and files; `npm run test -w miroir-core -- ''`; `tsc` for miroir-core and miroir-standalone-app.

### Realization

- Schema: optional `testbedReset: "perTest" | "perSuite"` (enum) on `miroirTestSuite`, in the MiroirTest entity and its modelVersion copy; generated types regenerated.
- `miroir-core/src/5_tests/testbedResetPolicy.ts`: `resolveSuiteTestbedReset` (absent → `perTest`), `resolveSuitesTestbedReset` (several suites on one session: `perSuite` only if all are), and the `withTestbedResetPolicy(policy, reset)` wrapper. With `perSuite` it resets when the scope key (the top-level `describe` of the test, from `tests/helpers/testbedResetScope.ts`) changes; a failed reset is retried on the next test. Unit tests: `tests/5_tests/testbedResetPolicy.unit.test.ts`.
- Used by the three CLI helpers: `runMiroirCoreTestsFromCLI`, `runMiroirRunnerTestsFromCLI` (legacy) and `runMiroirRunnerSuitesSharedFromCLI`. `RunnerTestSession`, `IntegrationTestSession` and the UI path are untouched, so UI runs keep resetting per test.
- Marked suites: only `miroirCoreTransformers` (261 `transformerTest` leaves, all pure). The runner/action suites in nonreg all create, update or delete, except `runner_mcp_get_instances`, which has one leaf, so marking it gains nothing.
- `ExtractorPersistenceStoreRunner.integ` and `ExtractorTemplatePersistenceStoreRunner.integ` only run `runBoxedQuery*` / query template actions: their `resetIntegTestbed` moved to `beforeAll` (the first file keeps a `beforeEach` that clears `document.body`).
- Measured on `emulatedServer-filesystem`:
  - `integ-transformer-miroirCoreTransformers`: 30 s → 9 s wall; `beforeEach` 20.9 s → 0.09 s in total (one reset), 261/261 passed.
  - storage group (`--runner shared`): 16 s → 14.2 s; legacy files 12 s and 8 s, all passed.
- Validation: `modelValidation` miroir passed; `npm run test -w miroir-core -- ''` 2064 passed; pytest 44 passed; `tsc` miroir-core and miroir-standalone-app clean; the 14 runner/action suites pass with `--runner shared` (35.9 s) and `domain_controller_data_crud` legacy.
- Found, not fixed (pre-existing on the base): `tests/helpers/RunnerTestSession.unit.test.ts` does not parse (extra `)` at line 626), so that file cannot run.

---

## Slice 6 — Lazy store-state logging

**Status:** ⬜ pending

**Goal:** `initApplicationDeploymentStore` no longer reads the whole store to build a log message that WARN level discards.

**RED:** the `--timings` reset time per test for `domain_controller_model_crud`, recorded before the change.

**GREEN:** build the `getState()` argument only when info logging is enabled (`PersistenceStoreController.ts:446,460`).

**Validation:** the same measurement after the change (in the Realization); `npm run test -w miroir-core -- ''`; `nonreg:filesystem`.

---

## Slice 7 — Migrate descriptors, docs, full comparison

**Status:** ⬜ pending

**Goal:** most `testByFile` / `testMiroir` steps have a `shared` descriptor, and a full `--runner shared` run gives the same verdicts as legacy.

- Add descriptors step by step. A step whose shared result differs from legacy stays legacy, with a `sharedExcludedReason` in the manifest.
- Docs: `docs/reference/testing.md` (nonreg section: `--timings`, `--runner`, fallback) and the nonreg table in `AGENTS.md`.
- Tracer narrative: `nonreg:filesystem --timings` legacy vs `--runner shared`, with the wall times recorded here.

**AC checklist:**

| AC | Proof |
|---|---|
| Timings optional, off by default | Slice 0 + 2 pytest |
| Legacy default and fallback | Slice 3 pytest (`--runner legacy`, `shared→legacy`) |
| UI unchanged | no diff in `src/miroir-fwk/4-tests/{RunnerTestSession,uiIntegrationTestLauncher*}` or the views; `RunnerTestSession.unit`, `MiroirTestDisplay.unit`, `RunAllMiroirTestsButton.unit` pass |
| Reset policy explicit | Slice 5 |
| Transformer step runs | Slice 1 |
| No Postgres on filesystem | Slice 1 |

**Validation:** both full runs, `python scripts/sync_agent_skills.py --check`, pytest, the `tsc` checks, `npm run test -w miroir-core -- ''`.
