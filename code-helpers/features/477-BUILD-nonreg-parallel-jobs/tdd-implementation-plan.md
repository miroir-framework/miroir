# Issue #477: TDD implementation plan

> Vertical TDD slices (RED, then GREEN), integration-first per `docs/contributing/testing.md`.
> The environment slices test `miroir-env` through its public functions (`resolveEnvironmentFromFiles`,
> `openTestEnvironment`) on temporary repositories, and the runner slices run the real
> `scripts/run-nonreg.py` on stub manifests, as `scripts/tests/test_run_nonreg.py` already does.
> No mocks. The tracer bullet proves that two jobs on `test-filesystem` write to two different state
> directories.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step. Each slice ends with its
> Validation commands; on success its Realization is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/477
Prerequisites: [`../318-FEATURE-nonreg-profiling/`](../318-FEATURE-nonreg-profiling/) ✅, [`../351-BUILD-nonreg-scopes/`](../351-BUILD-nonreg-scopes/) ✅
Working branch: `claude/477-nonreg-parallel`

**Resume note:** plan written 2026-10-04; defaults confirmed by A 2026-10-05; no slice started.

---

## Scope

- G1: `--jobs N` (default 4) runs independent steps and shared groups at the same time, with both runners.
- G2: each job has its own test environment stores (`MIROIR_TEST_WORKER`), including runtime-installed test applications on SQL and MongoDB; steps marked `"parallel": false` run alone.
- G3: summaries in manifest order, one console block per finished step, `--compare` unchanged.
- G4: per-job stores removed after the run unless `--keep-worker-state`.

This plan does not parallelize vitest workers inside a step, nor make job names unique across two concurrent `run-nonreg.py` invocations (analysis § 2).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the shared state and the serial runner | ✅ | `testEnvironments.unit.test.ts`, `test_run_nonreg.py` |
| 1 | A worker gets its own test environment state (tracer) | ✅ | `testEnvironments.unit.test.ts` |
| 2 | Runtime test applications on SQL and MongoDB follow the worker | ✅ | `RunnerIntegTestTools.unit.test.ts` |
| 3 | `miroir-env clear` removes a worker's stores | ✅ | `miroirEnvClear.integ.test.ts` |
| 4 | `run-nonreg.py --jobs N` | ✅ | `test_run_nonreg.py` |
| 5 | The run bracket runs alone | ✅ | `test_run_nonreg.py` guard |
| 6 | Measure, docs, AC | ✅ | full nonreg, jobs 1 vs 4 |

---

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| D1 Default job count | 4 (A) | G1 |
| D2 Per-job stores after the run | removed; `--keep-worker-state` keeps them (A) | G4 |
| D3 Isolation | `MIROIR_TEST_WORKER=<w>`; state name `<environment>@<w>`; `name` stays the definition name | G2 |
| D4 Scope of the variable | test environments only; ignored with a warning elsewhere | G2 |
| D5 Runtime test apps on SQL/MongoDB | store name prefixed with the template's environment identifier | G2 |
| D6 Steps that run alone | manifest field `"parallel": false`, on the run bracket only | G2 |
| D7 Runners | `--jobs` for legacy and shared | G1 |
| D8 SQL/MongoDB cleanup | `miroir-env clear`, honoring `MIROIR_TEST_WORKER` | G4 |

---

## Allocated keys

| Artefact | Value |
|---|---|
| Environment variable | `MIROIR_TEST_WORKER`, values `^w[0-9]+$` |
| State name | `<environment>@<worker>`, e.g. `test-filesystem@w2` |
| `ResolvedEnvironment` field | `stateName` |
| miroir-env command | `clear` |
| Runner options | `--jobs N` (default 4), `--keep-worker-state` |
| Manifest step field | `"parallel": false` |
| `summary.json` fields (parallel runs only) | `jobs`; per step `worker` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| miroir-env tests | `npm run test -w miroir-env` |
| One miroir-env file | `npx vitest run -w miroir-env tests/testEnvironments.unit.test.ts` (from the package: `npx vitest run tests/testEnvironments.unit.test.ts`) |
| standalone-app helper tests | `npm run testByFile -w miroir-standalone-app -- RunnerIntegTestTools.unit` |
| Runner tests | `python -m pytest scripts/tests/test_run_nonreg.py -q` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Build after miroir-core / miroir-env change | `npm run build -w miroir-core && npm run build -w miroir-env` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared` |

---

## Slice 0: characterize the shared state and the serial runner

**Status:** ✅ DONE

### Goal

Lock what later slices change: today two openings of one test environment share one state directory, and the runner runs steps serially in manifest order.

### 0.1 RED, then GREEN: one state per environment name

**Test:** `packages/miroir-env/tests/testEnvironments.unit.test.ts`, new case.

Behavior asserted:
- `openTestEnvironment("test-filesystem", { reseed: true })` twice on one temporary repository gives deployments whose filesystem directories, `appsDirectory` and IndexedDB names are equal, all under `.miroir/test-filesystem/`.
- `resolveEnvironmentFromFiles` on `test-sql` gives schemas `test_sql_<application>`.

These pass today; slice 1 adds the worker case next to them.

### 0.2 RED, then GREEN: serial runner contract

**Test:** `scripts/tests/test_run_nonreg.py`, new case.

Behavior asserted:
- With two stub steps that each append `start <id>` and `end <id>` to a file, the file reads `start a, end a, start b, end b`.
- No step sees `MIROIR_TEST_WORKER` (the stub prints its environment).

### Validation

```bash
npx vitest run tests/testEnvironments.unit.test.ts   # in packages/miroir-env
python -m pytest scripts/tests/test_run_nonreg.py -q
```

### Realization

Done 2026-10-05. `testEnvironments.unit.test.ts` § "test environment state names (#477)" pins one state per environment name (`.miroir/<env>/`, schemas and databases `<env>_<app>`, with the `_modelVersion` and `_admin` suffixes). `test_run_nonreg.py` pins the serial contract: manifest order, no `MIROIR_TEST_WORKER` reaching a step even when the shell sets one (the runner pops it).

---

## Slice 1: a worker gets its own test environment state (tracer)

**Status:** ✅ DONE

### Goal

With `MIROIR_TEST_WORKER=w2`, a test opening `test-filesystem` reads and writes `.miroir/test-filesystem@w2/` and SQL schemas `test_filesystem_w2_<application>`, while a run without the variable is unchanged.

**Layers cut:** `miroir-core` `1_core/environment/Environment.ts` (state name in `deriveEnvironmentDeployments` callers) → `miroir-env` (`environmentFiles.ts`, `environmentState.ts`, `testEnvironment.ts`).

### 1.1 RED

**Test:** `packages/miroir-env/tests/testEnvironments.unit.test.ts` (vitest: environment resolution is framework tooling, not reachable through MiroirTest).

Behavior asserted:
- With `env: { MIROIR_ENV: "test-filesystem", MIROIR_TEST_WORKER: "w2" }`: `resolved.name` is `test-filesystem`, `resolved.stateName` is `test-filesystem@w2`, every copy section directory starts with `.miroir/test-filesystem@w2/`, the config's `appsDirectory` is `.miroir/test-filesystem@w2/apps`.
- On `test-sql` with `w2`: schemas are `test_sql_w2_<application>` and `..._modelVersion`; on `test-mongodb`, databases likewise; on `test-indexedDb`, names under `.miroir/test-indexedDb@w2/`.
- `openTestEnvironment(..., { reseed: true })` with `w2` seeds `.miroir/test-filesystem@w2/` and leaves a file written under `.miroir/test-filesystem/` (no worker) in place.
- With `MIROIR_ENV=dev` and `MIROIR_TEST_WORKER=w2`: `stateName` equals `name`, and a warning names the ignored variable (D4).
- `MIROIR_TEST_WORKER=../x` is an `EnvironmentError`.

### 1.2 GREEN

- `ResolvedEnvironment.stateName`: in `resolveEnvironmentFromFiles`, `isTestEnvironment(name) && worker ? \`${name}@${worker}\` : name`; validate the worker against `^w[0-9]+$`.
- Pass `stateName` to `deriveEnvironmentDeployments` (`environmentFiles.ts:174`) and use it in `environmentStateDirectory`, `configEnvironment` (`environmentState.ts:116`, `:196`), `openTestEnvironment`'s apps wipe (`testEnvironment.ts:70`) and the `stateCommands.ts:207` import.
- No change to `storeIdentifier`: it already maps `@` to `_`.

### 1.3 Refactor checkpoint

- The four places building `.miroir/<name>` (analysis § 4.2) should go through one function taking `stateName`; remove the duplicates.
- Check `miroir-env show` prints the state directory, so a developer sees which state a worker used.

### Validation

**Nonreg scopes:** `smoke,tooling,core`: miroir-env is tooling; `Environment.ts` is miroir-core `1_core`.

```bash
npm run build -w miroir-core && npm run build -w miroir-env
npm run test -w miroir-env
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-env/tsconfig.json
MIROIR_TEST_WORKER=w2 npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites tr.core --mode integ
ls .miroir/test-filesystem@w2
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling,core
```

### Realization

Done 2026-10-05. `environmentStateName(name, env)` in `miroir-env/src/environmentFiles.ts` returns `<env>@w<N>` for a `test-*` environment and `MIROIR_TEST_WORKER=w<N>`, throws on any other worker name, and warns and ignores the worker outside test environments. `ResolvedEnvironment` carries `stateName`; `deriveEnvironmentDeployments`, `environmentStateDirectory`, `configEnvironment` (apps directory) and the reseed wipe use it, so SQL schemas become `test_sql_w2_<app>` through the existing `storeIdentifier`. `stateCommands` resets `stateName` with the name when it switches to `local`. 6 tests in § "worker state of a test environment (#477)". Filesystem check: `MIROIR_TEST_WORKER=w2 testMiroir --suites tr.core --mode integ` wrote only `.miroir/test-filesystem@w2`.

---

## Slice 2: runtime test applications on SQL and MongoDB follow the worker

**Status:** ✅ DONE

### Goal

A runner suite on `test-sql` with worker `w2` installs its test application in a schema prefixed `test_sql_w2_`, so two jobs running suites on the same test application do not share it (D5).

**Layers cut:** `miroir-standalone-app/src/miroir-fwk/4-tests/runnerIntegTestSupport.ts`.

### 2.1 RED

**Test:** `packages/miroir-standalone-app/tests/4_view/RunnerIntegTestTools.unit.test.ts` (vitest: storage placement of test applications is test infrastructure).

Behavior asserted:
- `testApplicationStorageConfiguration(template, "Library")` with a template schema `test_sql_w2_library` gives schemas starting with `test_sql_w2_`; with `test_sql_library`, schemas starting with `test_sql_`.
- Same for MongoDB databases.
- With an isolation key and the longest prefix, the schema plus `_modelVersion` stays within 63 characters and keeps the full uuid.
- Filesystem and IndexedDB cases unchanged (existing tests).

### 2.2 GREEN

- Derive the environment identifier from the template schema or database (the part before the application key), as `environmentStateDirectory` does for filesystem paths, and prefix `storeName` with it.
- `ephemeralStoreIdentifier` truncates the application-name part first.

### 2.3 Refactor checkpoint

- `environmentStateDirectory` and the new SQL/MongoDB prefix reader are the same idea ("where does the template live"); merge them into one function returning a placement per store type.

### Validation

**Nonreg scopes:** `smoke,runners,actions`.

```bash
npm run testByFile -w miroir-standalone-app -- RunnerIntegTestTools.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,runners,actions
# when PostgreSQL is up (cloud: sudo pg_ctlcluster 16 main start)
MIROIR_TEST_WORKER=w2 npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-sql --suites runner.lendDocument --mode integ
```

### Realization

Done 2026-10-05. `runnerIntegTestSupport.ts`: `environmentStorePrefix()` reads the template's state (the Admin filesystem directory also for sql and mongo templates) and `ephemeralStoreIdentifier` prefixes the SQL schema or Mongo database of a runtime test application, kept within 63 characters. `IntegrationTestSession` (tests/helpers) builds the `testApplication` directory, schema (`TestApplicationStoreOptions.schema`, new in miroir-core) and Mongo database from `testEnvironment.resolved.stateName`; `integrationTestProfiles.ts` passes `MIROIR_TEST_WORKER` on. Tests: 13 in `RunnerIntegTestTools.unit.test.ts`, 2 in `IntegrationTestSession.unit.test.ts` (its lifecycle test "initSession wires domainController…" fails on the base branch too).

---

## Slice 3: `miroir-env clear` removes a worker's stores

**Status:** ✅ DONE

### Goal

`MIROIR_TEST_WORKER=w2 npm run miroir-env -- clear --name test-sql` removes `.miroir/test-sql@w2/`, drops the `test_sql_w2_*` schemas, and refuses a non-test environment (D8).

**Layers cut:** `miroir-env` CLI (`cli.ts`, new `clearState` in `stateCommands.ts`).

### 3.1 RED

**Test:** `packages/miroir-env/tests/miroirEnvClear.integ.test.ts` (vitest through the CLI, like `miroirEnvReconcile.integ.test.ts`).

Behavior asserted:
- On a temporary repository with `.miroir/test-filesystem@w2/` and `.miroir/test-filesystem/`: `clear --name test-filesystem` with `w2` removes the first, keeps the second, exits 0.
- `clear --name dev` exits 2 with a message naming test environments.
- `clear` without a worker on a test environment removes `.miroir/<environment>/` (useful by hand; the runner never calls it so).
- When PostgreSQL is reachable (skipped otherwise, with the reason printed): after seeding `test_sql_w2_library`, `clear` drops every schema starting with `test_sql_w2_`. Same for MongoDB databases.

### 3.2 GREEN

- `clearState(resolved)`: `rmSync` of the state directory; for SQL stores, `DROP SCHEMA IF EXISTS … CASCADE` for each derived schema plus schemas matching the state prefix (runtime test apps, slice 2); for MongoDB, `dropDatabase` likewise.
- `pg` and `mongodb` are loaded with a dynamic `import()` only when the environment has such stores, so miroir-env keeps no hard dependency on them.

### 3.3 Refactor checkpoint

- `prune` and `clear` both delete stores; share the deletion helper if the shapes match.

### Validation

**Nonreg scopes:** `smoke,tooling`.

```bash
npm run build -w miroir-env
npm run test -w miroir-env
npx tsc --noEmit --skipLibCheck -p packages/miroir-env/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

Done 2026-10-05. `miroir-env/src/clearCommand.ts`, command `clear` in `cli.ts`: refuses a non-`test-*` environment (exit 2), removes `.miroir/<stateName>/`, then drops the PostgreSQL schemas and MongoDB databases whose name starts with `storeIdentifier(stateName)_`; without a worker it skips names whose next segment is `w<N>_`. `pg` (8.23.0) and `mongodb` (6.21.0) become miroir-env dependencies, imported only when the environment uses those stores; `src/pg.d.ts` declares the few `pg` calls (no `@types/pg` in the repo). `miroirEnvClear.integ.test.ts`: 4 filesystem tests, and the PostgreSQL test passed against the container's PostgreSQL 16 (w7 schemas dropped, w8 and unworkered kept).

---

## Slice 4: `run-nonreg.py --jobs N`

**Status:** ✅ DONE

### Goal

`npm run nonreg:filesystem -- --runner shared` runs up to 4 units (steps or shared groups) at a time, each in its own worker, and the summary reads as a serial one.

**Layers cut:** `scripts/run-nonreg.py`, `scripts/tests/test_run_nonreg.py`.

### 4.1 RED

**Test:** `scripts/tests/test_run_nonreg.py`, stub manifests.

Behavior asserted:
- Two stub steps that each sleep 1 s and record start and end times overlap with `--jobs 2`, and do not with `--jobs 1`.
- Each step sees `MIROIR_TEST_WORKER` in `w1..wN`; two steps running at the same time never see the same value; with `--jobs 1` no step sees it (serial runs keep today's state directory).
- `summary.json` lists steps in manifest order whatever the finish order, records `jobs` and each step's `worker`; `--compare` between a `--jobs 1` and a `--jobs 2` summary of the same manifest reports no difference.
- With `--fail-fast`, a failing step lets running steps finish, starts no new one, and marks the rest `not_run`.
- A shared group runs as one unit in one worker; a member's legacy re-run uses the same worker.
- The console shows one block per finished step (header, command, verdict together), never interleaved lines.
- At the end the runner calls `miroir-env clear` once per worker used (stub: the call is recorded); `--keep-worker-state` skips it. `--dry-run` calls nothing.
- `--jobs 0` and a negative value exit 2.

### 4.2 GREEN

- `concurrent.futures.ThreadPoolExecutor(max_workers=jobs)`; each unit takes a free worker name from a queue and returns it when done; `spawn` gets `{**os.environ, MIROIR_TEST_WORKER: w}` (merged with `timing_env` when `--timings`).
- Printing happens in the main thread when a unit completes.
- Results collected by step id, then ordered by the manifest.
- `--jobs` default 4 in `build_parser`; `jobs == 1` takes today's loop unchanged.

### 4.3 Refactor checkpoint

- `main` already mixes selection, execution and summary; extract the execution loop (`run_units`) so serial and pooled runs share the summary code.

### Validation

**Nonreg scopes:** `smoke,tooling`.

```bash
python -m pytest scripts/tests/test_run_nonreg.py -q
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling --jobs 2
ls .miroir | grep @ || echo "no worker state left"
```

### Realization

Done 2026-10-05. `run-nonreg.py`: `--jobs N` (default 4) and `--keep-worker-state`. `plan_units` turns the selected steps into units (a shared group is one unit); `run_parallel` runs them on a `ThreadPoolExecutor`, each unit taking a free worker `w1..wN` passed as `MIROIR_TEST_WORKER`. Console lines go through `emit()` into a per-thread buffer printed as one block when the step ends. Results are stored in manifest order; with `--fail-fast` no new unit starts after a failure and the others report `not_run`. `--jobs 1` keeps the serial loop (`run_serial`). After a parallel run, `remove_worker_state` deletes `.miroir/<env>@w<k>` for each `test-*` definition and, on sql or mongodb, calls `miroir-env clear` per worker; the summary records `jobs`, each step's `worker` and `worker_state`. 12 new tests in `test_run_nonreg.py` (overlap with 2 jobs, none with 1, order, `--compare` against a serial run, fail-fast, console blocks, bad `--jobs`, state removed and kept, shared group on one worker).

---

## Slice 5: the run bracket runs alone

**Status:** ✅ DONE

### Goal

The run bracket (`unit-321-environment-before`, `unit-321-tracked-assets`) runs with no other step running (D6). The steps that measure memory or time do not need it: they assert estimated byte sizes and the consistency of measured durations, never a duration limit (analysis D6).

**Layers cut:** `scripts/nonreg-manifest.json`, `scripts/run-nonreg.py`, `scripts/tests/test_run_nonreg.py`.

### 5.1 RED

**Test:** `scripts/tests/test_run_nonreg.py`.

Behavior asserted:
- A stub step with `"parallel": false` between two normal steps starts after every earlier step ended, and the next step starts after it ended.
- Guard on the real manifest: `unit-321-environment-before` and `unit-321-tracked-assets` carry `"parallel": false`.
- Guard: `"parallel"` is only ever `false` (the default is parallel).

### 5.2 GREEN

- The pool drains before a `"parallel": false` unit, runs it alone, then resumes.
- Set the field on the two bracket steps. A shared group containing such a step would run alone as a whole (none does today).

### 5.3 Refactor checkpoint

- The bracket steps are the only users, as are the `always` scope's: document the two together in `docs/reference/testing.md`.

### Validation

**Nonreg scopes:** `smoke,tooling`.

```bash
python -m pytest scripts/tests/test_run_nonreg.py -q
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

Done 2026-10-05. `"parallel": false` on `unit-321-environment-before` and `unit-321-tracked-assets`. Such a step is an `alone` unit: the pool drains, the step runs with no worker, then the pool resumes. Guards in `test_run_nonreg.py`: the bracket steps carry the flag, and `parallel` is never `true` (absent means parallel).

---

## Slice 6: measure, docs, AC

**Status:** ✅ DONE

### 6.1 Measure

- Full `npm run nonreg:filesystem -- --runner shared --jobs 1` and `--jobs 4` on the cloud container, with `--timings`; record wall time and peak memory (sum of RSS of the vitest processes, sampled every second by a small Python script, kept out of the repo).
- If 4 jobs exceed memory, record it here and ask A whether to lower the default (D1 is A's decision).
- Run `--jobs 4` three times in a row; every step must keep its serial verdict (G2). A step that fails only under load (a short `waitFor` or test timeout) gets a longer timeout or `"parallel": false`, recorded here with the reason.

### 6.2 Docs

- `docs/reference/testing.md` § Repo-wide non-regression: `--jobs`, `--keep-worker-state`, `MIROIR_TEST_WORKER`, `"parallel": false`.
- `docs/reference/environments.md`: the state name of a worker, `miroir-env clear`.
- `analysis.md` status: implemented.

### 6.3 Tracer bullet (narrative)

1. Run `npm run nonreg:filesystem -- --runner shared`.
2. While it runs, `ls .miroir` shows `test-filesystem@w1` to `@w4`.
3. The run ends; `summary.md` lists steps in manifest order, the wall time is lower than the `--jobs 1` run, and `.miroir` has no `@` directory left.
4. Run again with `--keep-worker-state`: the `@` directories stay.

Automated equivalent: `test_run_nonreg.py` slice 4 and 5 cases, `testEnvironments.unit.test.ts` slice 1 cases.

### AC checklist (#477)

| Criterion (issue § Proposed slices and § Decisions) | Proven by | Status |
|---|---|---|
| Per-worker state name for test environments | slice 1 tests | ✅ |
| `"parallel": false` on the bracket steps, with a pytest check (measurement steps checked, not needed) | slice 5 tests | ✅ |
| `--jobs N`, default 4, summary in manifest order, `--fail-fast` stops the pool | slice 4 tests | ✅ |
| Worker state removed by default, kept with `--keep-worker-state` | slice 3 and 4 tests | ✅ |
| Measured time and memory with 2 and 4 jobs | slice 6.1 Realization | ✅ |

### Realization

Done 2026-10-05, cloud container (4 CPUs, 15 GB), `npm run nonreg:filesystem -- --runner shared`, commit 904047f3 plus the two test fixes below. Memory is the peak of the summed RSS of every process, sampled every 2 s (about 0.5 GB before the run); `--timings` was left out so the timing runner does not weigh on the comparison.

| Jobs | Wall time | Peak RSS | Verdicts |
|---|---|---|---|
| 1 | 1372 s (22.9 min) | 4.9 GB | 100/100 |
| 2 | 702 s (11.7 min) | 7.3 GB | 100/100 |
| 4 (run 1) | 570 s (9.5 min) | 10.9 GB | 99/100 |
| 4 (run 2) | 552 s (9.2 min) | 11.1 GB | 98/100 |
| 4 (run 3) | 565 s (9.4 min) | 11.1 GB | 99/100 |

4 jobs fit in 15 GB, so the default stays 4 (D1). 2 jobs halve the time; 4 jobs gain 19 % more, likely because the container has 4 CPUs and vitest launches spend most of their time transforming modules (inferred, not profiled).

What failed under 4 jobs:
- `unit-321-miroir-env`, 3 runs out of 3: two tests of `testEnvironments.unit.test.ts` open `test-filesystem` with `process.env`, so the job's `MIROIR_TEST_WORKER` moved their state. They now pass `MIROIR_TEST_WORKER: undefined`; the step passes on worker w1.
- `apiCallReport-281`, 1 run out of 3: every test passed, and vitest exited 1 on an unhandled `EnvironmentTeardownError` ("Closing rpc while onUserConsoleLog was pending") in `apiCallReport.281.phase2.integ.test.tsx`: the rendered report still calls the fake server after `afterAll` closed it (ECONNRESET), and logs after the worker closed. A teardown race made likelier by load, not a shared store; left as is, reported to A.

Leak check: after the three 4-job runs, the unworkered `.miroir/test-filesystem/` (left by the 1-job run) had new files from `endpointToolRegistry.integ.test.ts` (miroir-mcp), which built its runtime application's stores from the environment name. It now uses `resolved.stateName`; `unit-345-mcp` on worker w1 writes only `.miroir/test-filesystem@w1/`. After the 2-job run `.miroir/` was empty.

Outside nonreg, `realServerTestEnvironment.unit.test.ts` still pins unworkered paths and fails when the shell sets `MIROIR_TEST_WORKER`; it is in no nonreg step.

