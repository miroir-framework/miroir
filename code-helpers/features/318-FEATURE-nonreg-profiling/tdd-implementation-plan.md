# Issue #318 — TDD Implementation Plan

> Integration-first, no mocks. The harness is tested through its public entry points: `run-nonreg.py` (pytest in `scripts/tests`, which runs the real script on small real manifests), the package launchers (vitest unit tests on the argv/env they produce), and real vitest runs on the filesystem profile. No test file, `RunnerTestSession` or UI launch code changes, except where a slice names it.

**Resume note:** analysis confirmed 2026-09-27. Branch `318-FEATURE-nonreg-profiling`, from `_integration` 76e52aa. Next: Slice 0.

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
| 0 | Characterize the legacy nonreg contract | ⬜ pending | `scripts/tests/test_run_nonreg.py` |
| 1 | Clean filesystem baseline (D5, D6) | ⬜ pending | the 4 steps pass on `emulatedServer-filesystem` |
| 2 | Opt-in timing profile (D1) | ⬜ pending | `--timings` writes `timings.json` with hook times; nothing written without it |
| 3 | Shared runner for testByFile groups (D2) | ⬜ pending | `--runner shared` on the storage group: same per-step verdicts, lower wall time |
| 4 | Shared runner for runner/action suites (D2) | ⬜ pending | new shared entry: one session per suite, same results as legacy |
| 5 | `perSuite` reset policy (D4) | ⬜ pending | timing report shows one reset per marked suite; results unchanged |
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

**Status:** ⬜ pending

**Goal:** lock what `run-nonreg.py` does today, so later slices can prove that the default is unchanged.

**RED/GREEN (characterization):** `scripts/tests/test_run_nonreg.py` runs the real script against a temporary manifest of `python -c` steps (pass, fail, `{profile}` expansion). It asserts:
- the exact argv each step received (echoed by the step);
- the `summary.json` keys and per-step fields;
- the log file per step;
- no `timings.json` and no `timings/` directory.

**Refactor checkpoint:** let the manifest path and results root be overridden (a CLI flag or env), so tests do not touch the repo's manifest. The default stays the same.

**Validation:** `python -m pytest scripts/tests -q`

---

## Slice 1 — Clean filesystem baseline (D5, D6)

**Status:** ⬜ pending

**Goal:** `nonreg:filesystem` no longer runs 0 transformer tests and no longer reaches Postgres.

**RED:**
- Delete `packages/miroir-standalone-app/tests/tmp`, then run `integ-transformer-miroirCoreTransformers`. It fails with "Parent directory … does not exist".
- `appstack-uiIntegrationTestLauncher.integ` and `appstack-MiroirTest{Display,List}IntegrationLaunch` on `--profile emulatedServer-filesystem` fail with ECONNREFUSED 5432.

**GREEN:**
- `prepareTestMiroirLaunch` creates the `tests/tmp` parent (`mkdirSync(…, { recursive: true })`) when the resolved profile uses the filesystem store. Unit test in the existing launcher test file.
- `uiIntegrationTestLauncher.integ.test.ts` and `miroirTestDisplayIntegrationLaunchMocks.ts` take the profile from the launch env, falling back to `emulatedServer-sql`. The expected `Profile:` text follows from that.

**Refactor checkpoint:** one helper, `resolveLaunchProfileName(env)`, shared by both test files.

**Validation:** the 4 steps above on `emulatedServer-filesystem`; the launcher unit tests; `tsc` on miroir-standalone-app.

---

## Slice 2 — Opt-in timing profile (D1)

**Status:** ⬜ pending

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

---

## Slice 3 — Shared runner for testByFile groups (D2)

**Status:** ⬜ pending

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

---

## Slice 4 — Shared runner for runner/action suites (D2)

**Status:** ⬜ pending

**Goal:** the `integ-runner-*` / `integ-action-*` steps share one launch, with one session per suite.

**RED:** `testMiroir --profile emulatedServer-filesystem --suites domain_controller_data_crud,domain_controller_model_crud --mode integ --shared` runs both suites, each in its own `describe` with its own session and seed. The results match the two legacy runs.

**GREEN:**
- New entry `miroir-runner-tests-shared.integ.test.ts` and a helper `runMiroirRunnerSuitesSharedFromCLI` (per-suite `describe`, `beforeAll(initSession)`, `beforeEach(testSession.beforeEach)`, `afterAll(teardown)`).
- `testMiroirLauncher` selects it only with `--shared`.
- The legacy entry and `runMiroirRunnerTestsFromCLI` are unchanged.
- The manifest `shared` descriptor uses `launcher: "testMiroir"`, and `run-nonreg.py` merges the suite lists of a group.

**Refactor checkpoint:** extract `createSessionParamsForSuite` from the legacy entry into a helper both entries import. The code moves without changing, so legacy behaviour holds.

**Validation:** the RED command; pytest; the `integ-*` steps in `--runner shared` vs legacy.

---

## Slice 5 — `perSuite` reset policy (D4)

**Status:** ⬜ pending

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
