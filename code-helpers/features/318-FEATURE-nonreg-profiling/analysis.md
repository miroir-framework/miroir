# 318 — Nonreg profiling and faster integration runs

> Why `npm run nonreg:filesystem` takes about 28 minutes, and how to make it faster without changing the existing behaviour. The plan: timings that are off unless requested, a shared runner that is opt-in with the legacy per-step runner as default and fallback, and an explicit testbed reset policy. Running tests from the UI stays unchanged.

Related issue: https://github.com/miroir-framework/miroir/issues/318
Related analyses: [`../303-FEATURE-test-pattern-and-render-performance/analysis.md`](../303-FEATURE-test-pattern-and-render-performance/analysis.md) (render-performance measurement, #306 stores measurements across runs), #316 (MiroirTest renaming, which renames nonreg step ids)
Key sources: [`scripts/run-nonreg.py`](../../../scripts/run-nonreg.py), [`scripts/nonreg-manifest.json`](../../../scripts/nonreg-manifest.json), [`packages/miroir-standalone-app/scripts/`](../../../packages/miroir-standalone-app/scripts/), [`RunnerTestSession.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/RunnerTestSession.ts), [`runMiroirRunnerTestsFromCLI.ts`](../../../packages/miroir-standalone-app/tests/helpers/runMiroirRunnerTestsFromCLI.ts), [`LibraryPlayfield.ts`](../../../packages/miroir-core/src/5_tests/LibraryPlayfield.ts)

**Status:** decisions confirmed with A (2026-09-27). The TDD plan is next.

---

## Decision record

| Decision | Choice |
|---|---|
| D1 Profiling | **Opt-in timing profile** (`MIROIR_TEST_TIMING=1` / `run-nonreg.py --timings`). When on, nonreg writes `timings.json`. Off by default, with no change to output or arguments. |
| D2 Launch overhead | **Shared runner at the harness level, opt-in.** The legacy per-step runner stays the default and remains the fallback. |
| D3 Where the shared runner lives | **Harness only:** `run-nonreg.py`, the package launchers and the CLI helpers. Test files, `RunnerTestSession` and the UI launch path are not changed. |
| D4 Reset policy | **Explicit, per suite / per file.** `perTest` stays the default. Only clearly read-only suites are marked `perSuite`. The CLI harness honours it; the UI ignores it in this issue. |
| D5 Broken `miroirCoreTransformers` step | **Fix here.** |
| D6 Launch tests that hit Postgres on the filesystem profile | **Fix here.** Use the profile the step was launched with. |

**Rationale:** A asked (2026-09-27) to preserve existing behaviour, move smoothly to the more efficient implementation, and keep a fallback to legacy. That requirement drives every decision: each new mechanism is opt-in, lives next to the legacy one instead of replacing it, and can be switched off with one flag.

### D1 — Profiling

**Status:** Accepted — opt-in timing profile.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Vitest timing reporter + nonreg aggregation** ★ | A vitest reporter using `onHookStart`/`onHookEnd`, `onTestCaseResult` and module diagnostics (collect, setup, duration) writes one JSON per launch. `run-nonreg.py --timings` sets `MIROIR_TEST_TIMING=1` plus an output path for each step, then merges the files into `<snapshot>/timings.json`. `summary.md` gains the slowest steps, tests and hooks. | Covers every vitest file without editing it, including hooks (`beforeAll`/`beforeEach`/`afterAll`), which is where resets run. Off means no reporter, so output is unchanged. | Launchers and package configs must append the reporter only when the flag is set. |
| D1-b. Timers inside `RunnerTestSession` / `IntegrationTestSession` | `performance.now()` around init, reset, teardown | Finer grain inside a reset (Miroir reset vs seed) | Touches code shared with the UI (D3) and misses testByFile files with their own hooks. May be added later behind the same flag. |
| D1-c. Per-step wall time only | Already exists (`duration_s`) | Nothing to do | Cannot tell setup from test time. That gap is what this issue is about. |

vitest 3.2.4 (the installed version) exposes `onHookStart`/`onHookEnd` on reporters (`node_modules/vitest/dist/chunks/reporters.d.*.d.ts`).

### D2 — Launch overhead

**Status:** Accepted — opt-in shared runner, legacy default.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. Group steps into one vitest launch per group, no isolation** ★ | `run-nonreg.py --runner shared` groups steps that declare a `shared` descriptor (same package, launcher kind, profile and env) and runs each group in one vitest process with `--no-isolate`. The JSON reporter maps results back to the original step ids, so the summary keeps one row per step. | Measured: the 3 storage integ files take **19.5 s shared vs 39.7 s legacy** (§3.3). No test file changes. | Module-level state is shared across files in a group (loggers, `ConfigurationService`, store registrations). A group that fails in shared mode is re-run step by step in legacy mode (D2 fallback). |
| D2-b. Group with isolation (vitest default) | Same, without `--no-isolate` | No state leaks | Measured **35.5 s vs 39.7 s**: each file still re-imports the whole stack (about 6 s of collect per file). Little gain. |
| D2-c. One entry file importing all tests | A generated aggregate test file | Fastest | Changes test structure, and failures lose their file identity. Rejected. |

**Fallback, at two levels:**

1. **Global switch.** `--runner legacy` (the default) runs exactly what it runs today. `--runner shared` is opt-in.
2. **Per group.** In shared mode, a group with any failure re-runs its failing steps in legacy mode. The step result says which mode produced the verdict. A step that passes in legacy but fails in shared flags a state leak and is reported as such, not hidden.

Steps with no `shared` descriptor always run legacy, even in shared mode. Migration is therefore step by step: add a descriptor, compare the two modes, keep it.

For `testMiroir` runner/action suites, the existing entry builds **one session from the first suite** (`miroir-runner-tests.integ.test.ts`, `createSessionParamsForSuite(primarySuiteKey, …)`). Batching different suites in that entry would seed them all with the primary suite's playfield, which is wrong. The shared runner therefore needs a separate CLI entry that opens one session per suite inside its own `describe` block. It is added next to the legacy entry, which is not modified.

### D3 — Where the shared runner lives

**Status:** Accepted — harness only.

The UI runs integration tests through `uiIntegrationTestLauncher` → `RunnerTestSession` (browser or in-process). `runMiroirRunnerTestsFromCLI`, the vitest launchers and `run-nonreg.py` are used only by the CLI. All new code goes in that CLI-only layer:

| Layer | Used by UI | Changed by #318 |
|---|---|---|
| `RunnerTestSession`, `IntegrationTestSession`, `resetIntegTestbed` | yes | no |
| `uiIntegrationTestLauncher*`, `MiroirTestDisplay`, `RunAllMiroirTestsButton` | yes | no |
| `tests/helpers/runMiroir*TestsFromCLI.ts`, `scripts/test*.ts` launchers | no | yes, as additions next to the legacy functions |
| `scripts/run-nonreg.py`, `scripts/nonreg-manifest.json` | no | yes, with new optional fields |

### D4 — Reset policy

**Status:** Accepted — explicit, `perTest` default.

| Option | Pros | Cons |
|---|---|---|
| **D4-a. Explicit optional suite attribute (`testbedReset: "perTest" \| "perSuite"`), honoured by the CLI harness** ★ | The author states intent, as with the existing leaf flag `skipRunTargetPlayfieldReset` (`MiroirTest` schema, `a311f363-…json`). With the attribute absent, behaviour is unchanged. | Schema change, so the types must be regenerated. |
| D4-b. Automatic read-only detection | No annotation needed | Fragile: a leaf that mutates through a runner looks read-only. Rejected. |
| D4-c. Manifest-only flag | No schema change | Moves test knowledge into nonreg, and it cannot help `testMiroir` users. Rejected. |

For testByFile integ files, the per-file equivalent moves a `beforeEach` reset to `beforeAll` in files whose tests are all read-only. There are only two candidates (§3.4). This changes the test files themselves, but not the harness or the UI.

`perSuite` means the reset runs once before the suite's first leaf. In `runMiroirRunnerTestsFromCLI` this is a guard around `testSession.beforeEach()`, and `RunnerTestSession` is untouched. The UI keeps resetting per leaf. Whether the UI should also honour the attribute is left to a follow-up.

---

## 1. Goals

1. **See where time goes.** In order to target the slow parts of nonreg as a framework maintainer, I can run nonreg with `--timings` and get, for each step, test file and test, the time spent in collect, setup hooks, test bodies and teardown hooks, plus a slowest-first summary.
2. **Run nonreg faster, safely.** In order to get non-regression feedback sooner as a framework maintainer, I can run nonreg with `--runner shared`. Compatible steps then share vitest launches, still reporting one result per step, with automatic legacy re-runs when a shared group fails.
3. **Keep the legacy run.** In order to trust nonreg while the shared runner matures as a framework maintainer, I get today's exact behaviour by default, and can force it back with `--runner legacy`.
4. **Declare read-only suites.** In order not to pay a full testbed reset per test as a MiroirTest author, I can mark a suite `testbedReset: "perSuite"`, and CLI runs reset once per suite.
5. **Trustworthy filesystem baseline.** In order to compare nonreg runs without environment noise as a framework maintainer, I can run `nonreg:filesystem` without steps silently running 0 tests or reaching Postgres.

## 2. Non-goals

- Changing how the UI runs tests (menu **Miroir Tests**, `MiroirTestDisplay` launch buttons, `RunAllMiroirTestsButton`).
- Storing timings across runs and trending them (overlaps #306).
- Renaming nonreg step ids (#316 owns it). The `shared` descriptors use suite and file names, and #316 renames them there too.
- Parallel vitest execution. Tests stay single-threaded (AGENTS.md).
- Making the shared runner the default. That is a later decision, once it matches legacy results over several runs.

## 3. Current state

### 3.1 Baseline (2026-09-26, commit 78dc552, fresh `./build-all.sh`, cloud session)

`npm run nonreg:filesystem`: 1682 s wall time, 73 steps, 68 passed.

| Where the time goes | Seconds | Share |
|---|---:|---:|
| Two launch tests reaching Postgres, 190 s timeout each (§3.5) | 382 | 23 % |
| vitest transform + collect across 109 launches (about 6.6 s per launch) | about 720 | 43 % |
| npm / tsx / vitest process start outside the vitest `Duration` | about 210 | 12 % |
| Test bodies (vitest `tests`), all steps | 306 | 18 % |

Heaviest steps: `unit-286-react-component-miroir-tests` 140 s (11 launches), `externalServices-spotify` 115 s (9 launches), `unit-292` 88 s, `apiCallReport-281` 73 s. One-leaf runner suites take 12–15 s of wall time for about 1–2 s of test.

**Vitest `collect` includes module top-level code.** In `miroir-runner-tests.integ.test.ts` that code includes `initSession()`, called from `runMiroirRunnerTestsFromCLI` before any hook is registered. Session bootstrap time is therefore counted as collect, not as a hook. D1 has to measure it separately: it wraps that call, which lives in the CLI helper.

### 3.2 Launchers (legacy, kept)

- `testByFile` → `packages/miroir-standalone-app/scripts/test-by-file.ts`. It applies `--profile`, then spawns `node vitest.mjs run --reporter=verbose --poolOptions.forks.singleFork --bail=1 <filters>` (`testByFileLauncher.ts`, `buildTestByFileVitestArgs`). `forks.singleFork` has no effect because `vite.config.js` sets `pool: 'threads'` with `singleThread: true`.
- `testMiroir` → `scripts/test-miroir-runner.ts`. It picks `miroir-core-tests.integ` or `miroir-runner-tests.integ` (`testMiroirLauncher.ts`, `resolveVitestEntry`) and passes suites through `MIROIR_TEST_*` env. It spawns `npx vitest run --poolOptions.threads.singleThread --reporter=verbose <entry>.ts`.
- miroir-core `testByFile` = plain `vitest run --poolOptions.forks.singleFork --reporter=verbose`. Other packages call `vitest run` directly.
- `run-nonreg.py` runs each step's `argv` in a subprocess and records `duration_s` and the vitest counts parsed from stdout. Many steps chain launches with `bash -c "A && B"`.

### 3.3 Batching measurements (2026-09-27, base 76e52aa)

`PersistenceStoreController.integ`, `ExtractorPersistenceStoreRunner.integ` and `ExtractorTemplatePersistenceStoreRunner.integ`, filesystem profile:

| Mode | Wall | vitest collect | Result |
|---|---:|---:|---|
| Legacy, 3 steps | 39.7 s (11.5 + 16.6 + 11.6) | 22.0 s | 29 passed |
| One launch, isolated (default) | 35.5 s | 17.0 s | 29 passed |
| One launch, `--no-isolate` | 19.5 s | 11.6 s | 29 passed |

The time is in module import, not in vitest start. Only sharing the module graph (`--no-isolate`) removes it, which is why D2 includes a fallback.

### 3.4 Testbed resets (per test today)

| Path | Hook | What runs per test | Read-only tests |
|---|---|---|---|
| Runner/action suites (`miroir-runner-tests.integ`) | root `beforeEach` → `RunnerTestSession.beforeEach` → `beforeEachTest` → `resetIntegTestbed` | Miroir platform reset + init (`resetAndInitApplicationDeployment`), then run-target reset + seed when the suite has seed params. `rollback` reloads the whole store into the local cache. | about one per suite (for example "Refresh all Instances") |
| Core transformer suites (`miroir-core-tests.integ`) | `IntegrationTestSession.beforeEach` → `seedTransformerTestApplicationData` | reset + init + createEntity + createInstance | all of them (about 339 `transformerTest` leaves) |
| `ExtractorPersistenceStoreRunner.integ` | file `beforeEach` | Library reset + seed | 11 / 11 |
| `ExtractorTemplatePersistenceStoreRunner.integ` | file `beforeEach` | Library reset + `addEntitiesAndInstances` | 7 / 7 |
| `PersistenceStoreController.integ` | file `beforeEach` | Library reset | mixed: mutating tests need it |
| `externalServiceQuery.integ` | file `beforeEach` | Library reset + seed | mostly query-only (to be checked leaf by leaf) |

The measured per-test cost is 0.28–0.43 s for Extractor tests (with reset) against 0.13–0.17 s for the same queries in `ExtractorTemplate…` after warm-up. That puts the reset share at roughly half of each integ test. D1 gives exact numbers.

Hidden cost: `PersistenceStoreController.initApplicationDeploymentStore` passes `await this.getState()` as a `log.info` argument (`miroir-core/src/4_services/PersistenceStoreController.ts:446,460`). Every `initModel` therefore reads the whole store, even at WARN level. The fix is a one-liner. It is in scope as a measured slice, because it touches every reset.

### 3.5 Environment failures on the filesystem profile

- `integ-transformer-miroirCoreTransformers` fails launch validation: "Parent directory for test app filesystem root does not exist: …/tests/tmp". `tests/tmp` is gitignored (`.gitignore:8 tmp*/`) and only created by later steps. On a fresh checkout the step runs 0 tests.
- `appstack-uiIntegrationTestLauncher.integ`, `appstack-MiroirTestDisplayIntegrationLaunch` and `appstack-MiroirTestListIntegrationLaunch` hardcode `emulatedServer-sql`: `uiIntegrationTestLauncher.integ.test.ts:37,52,57,79,97` and `miroirTestDisplayIntegrationLaunchMocks.ts` (`NODE_INTEGRATION_PROFILE`). On the filesystem profile they get ECONNREFUSED 127.0.0.1:5432, and the two Display/List tests then wait out their 180 s `waitFor`. These are test-side mocks of the UI launch environment, not UI code.
- A nonreg run rewrites tracked files (`miroirFundamentalType.ts` timestamp, 8 `tests/assets/admin_data` JSON files), so the tree is dirty afterwards. Noted only.

## 4. Key reuse

| Piece | Location |
|---|---|
| Per-step wall time, snapshots, `--compare` | `scripts/run-nonreg.py` |
| Profile application | `tests/helpers/integrationTestProfiles.ts` (`applyIntegrationTestProfile`) |
| Runner suite loading | `tests/helpers/runMiroirRunnerTestsFromCLI.ts` (`loadRunnerOrActionMiroirTestSuite`) |
| Session params per suite | `tests/miroir-runner-tests.integ.test.ts` (`createSessionParamsForSuite`) |
| Existing leaf-level reset opt-out | MiroirTest schema `skipRunTargetPlayfieldReset`, `miroir-core/src/5_tests/runnerTestSuiteResolve.ts:72` |
| Vitest reporter hooks | vitest 3.2.4 `Reporter.onHookStart/onHookEnd/onTestCaseResult` |

## 5. Expected gains (to be confirmed by D1)

| # | Change | Estimated saving on `nonreg:filesystem` | Effort | Verdict |
|---|---|---:|---|---|
| 1 | Fix the Postgres launch tests (D6) | about 6 min | low | adopt |
| 2 | Shared runner, `--no-isolate` groups (D2) | up to about 10 min, once most steps have a descriptor | medium | adopt, opt-in |
| 3 | `perSuite` reset on read-only suites (D4) | tens of seconds today. Several minutes once the transformer step actually runs (about 339 leaves) | medium | adopt |
| 4 | Lazy `getState()` in `initApplicationDeploymentStore` logging | per reset, to be measured | low | adopt if measured |
| 5 | Fix the transformer step (D5) | adds time: the step runs tests again | low | adopt |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
