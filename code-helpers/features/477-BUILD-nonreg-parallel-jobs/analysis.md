# 477: Run nonreg steps in parallel

> `scripts/run-nonreg.py` runs its steps one after the other, and each step is a separate npm/vitest process whose fixed launch cost dominates the run. This analysis covers what stops steps from running at the same time (mainly the test environment stores they share) and how to give each parallel job its own stores, so that `--jobs N` can run independent steps together.

Related issue: https://github.com/miroir-framework/miroir/issues/477
Prerequisites: #318 nonreg profiling ✅ ([analysis](../318-FEATURE-nonreg-profiling/analysis.md), `--runner shared`, `--timings`), #321 environment configuration ✅ ([analysis](../321-BUILD-environment-configuration/analysis.md), test environments in `.miroir/<environment>/`), #351 nonreg scopes ✅ ([analysis](../351-BUILD-nonreg-scopes/analysis.md)), #390 `--storage` ✅
Key sources: [`scripts/run-nonreg.py`](../../../scripts/run-nonreg.py), [`scripts/nonreg-manifest.json`](../../../scripts/nonreg-manifest.json), [`Environment.ts`](../../../packages/miroir-core/src/1_core/environment/Environment.ts), [`environmentFiles.ts`](../../../packages/miroir-env/src/environmentFiles.ts), [`environmentState.ts`](../../../packages/miroir-env/src/environmentState.ts), [`miroir-env/src/testEnvironment.ts`](../../../packages/miroir-env/src/testEnvironment.ts), [`runnerIntegTestSupport.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/runnerIntegTestSupport.ts)

**Status:** decisions D1 and D2 confirmed by A (2026-10-04); D3 to D8 are defaults picked in this analysis, open to correction.

---

## 1. Goals

- **G1. Faster full check.** In order to get the full non-regression verdict sooner, as a developer (human or agent) finishing a slice or a PR, I can run `npm run nonreg:filesystem -- --runner shared` and have independent steps run 4 at a time by default.
- **G2. Same verdict as a serial run.** In order to trust a parallel run, as a developer, I get the same pass/fail per step as with `--jobs 1`: no step fails because another step changed its data, and no timing or memory measurement fails because of CPU contention.
- **G3. Readable result.** In order to read and compare runs as today, as a developer, I get `summary.json` and `summary.md` in manifest order, one console block per finished step, and `--compare` working across serial and parallel runs.
- **G4. No leftovers.** In order to keep `.miroir/` and the databases tidy, as a developer, I find no per-job stores after a run, unless I asked to keep them for debugging.

## 2. Non-goals

- Running several vitest workers inside one step (`maxWorkers > 1` in `packages/miroir-standalone-app/vite.config.js:209`). The same per-worker isolation would apply through `VITEST_POOL_ID`, but that is a later issue, not filed.
- Changing which tests a step runs, or the shared runner's grouping.
- Parallel runs of two separate `run-nonreg.py` invocations on one checkout (two developers or two agents). The per-job state names make it possible, but this issue does not make job names unique across invocations (D3).
- Running tests from the UI (Miroir Tests menu): unchanged, as #318 required.

## 3. Decision record

| # | Decision | Choice | Serves | Status |
|---|---|---|---|---|
| D1 | Default job count | **4** | G1 | Accepted (A) |
| D2 | Per-job stores after the run | **removed by default; `--keep-worker-state` keeps them** | G4 | Accepted (A) |
| D3 | How a job gets its own stores | **`MIROIR_TEST_WORKER=<w>` read by environment resolution; the state name becomes `<environment>@<w>`** | G2 | Default |
| D4 | Where the worker name applies | **test environments only (`test-*`); ignored with a warning elsewhere** | G2 | Default |
| D5 | Runtime-installed test applications on SQL and MongoDB | **prefix their schema or database with the template's environment identifier** | G2 | Default |
| D6 | Steps that must run alone | **manifest field `"parallel": false`** | G2 | Default |
| D7 | `--jobs` and the legacy runner | **both runners** | G1 | Default |
| D8 | Cleaning SQL schemas and MongoDB databases | **a `miroir-env clear` command, called by the runner per job** | G4 | Default |

### D3. How a job gets its own stores

**Serves:** G2.

Every store of a test environment is named from the environment name (§ 4.1). Changing that one input isolates all of them.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Worker variable** ★ | The runner sets `MIROIR_TEST_WORKER=w2` for job 2. `resolveEnvironmentFromFiles` keeps the definition name (`test-filesystem`) and derives stores from a state name `test-filesystem@w2`. | One change covers filesystem, IndexedDB, SQL and MongoDB, and the steps that choose their environment without `{profile}` (§ 4.3). No manifest change. | `ResolvedEnvironment` gains a field; every place that builds a state path from `resolved.name` must switch to it (§ 4.2). |
| D3-b. One profile per job | Generate `environments/test-filesystem-w2.json` extending `test-filesystem`, and pass `--profile emulatedServer-filesystem-w2`. | No code change in miroir-env. | Writes files under `environments/` during a run (tracked directory). Does not reach steps that pick their environment without `{profile}`: the standalone-app default `test-sql`, the miroir-mcp default `test-filesystem`, step `appstack-270-persistent-secrets`. |
| D3-c. Copy the repository per job | Each job runs in its own worktree. | Total isolation. | Each worktree needs `node_modules` and built `dist/`; minutes and gigabytes per job. |

**State name format.** `<environment>@<worker>` cannot collide with an environment definition, and `runnerIntegTestSupport.environmentStateDirectory` still finds `.miroir/<state>` as the first two path segments (§ 4.4). `storeIdentifier` already turns `@` into `_`, so the SQL schema is `test_sql_w2_library`. Worker names match `^w[0-9]+$`, and the runner uses `w1`..`wN`, so leftovers stay bounded even with `--keep-worker-state`.

### D4. Where the worker name applies

**Serves:** G2. `MIROIR_TEST_WORKER` changes the state name only when the selected environment is a test environment (`isTestEnvironment`). For `dev`, `local`, `desktop` or `docker` it is ignored with a warning, so a variable left in a shell never moves a developer's data. `selectedTestEnvironment` already follows the same rule for `MIROIR_ENV`.

### D5. Runtime-installed test applications on SQL and MongoDB

**Serves:** G2. On filesystem and IndexedDB, the test applications a runner suite installs live under `.miroir/<environment>/`, so D3 moves them too. On SQL and MongoDB their schema or database is the test application name, optionally with the deployment uuid (`ephemeralStoreIdentifier`), with no environment in it (§ 4.4). Two jobs running suites on the same test application would share it.

| Option | Pros | Cons |
|---|---|---|
| **D5-a. Prefix with the template's identifier** ★ | Same rule as filesystem: `testApplicationStorageConfiguration` already reads the template's location to place filesystem stores; for SQL it reads the template schema prefix (`test_sql_w2`). | `ephemeralStoreIdentifier` must keep under 63 characters with the longer prefix; the prefix is truncated first. |
| D5-b. Add the worker name only | Shorter names. | A second naming rule next to the environment one. |

### D6. Steps that must run alone

**Serves:** G2. A manifest field `"parallel": false` marks a step that runs with no other step. The runner waits for running jobs to finish, runs the step, then resumes. Candidates:

- the run bracket `unit-321-environment-before` and `unit-321-tracked-assets` (they snapshot and check the whole tree, and must be first and last);
- steps that measure memory or time: `unit-localCacheMemoryMeasure`, `unit-localCacheMemoryAttributed`, `unit-localCache-memoryMeasure-static-redux`, `unit-localCache-memoryMeasure-static-zustand`, `unit-303-test-pattern-and-render-performance`.

The list is confirmed in slice 0 of the plan by running the candidates under CPU load. A pytest guard keeps the bracket steps at `"parallel": false`.

### D7. `--jobs` and the legacy runner

**Serves:** G1. The pool schedules units of work: a legacy step, or a shared group (one `--no-isolate` vitest launch). With `--runner legacy`, every unit is a step. Both runners get `--jobs`; the default of 4 applies to both. `--jobs 1` gives today's serial behavior.

### D8. Cleaning SQL schemas and MongoDB databases

**Serves:** G4. Removing `.miroir/<environment>@<w>/` is a directory delete the Python runner can do. SQL schemas and MongoDB databases need a client.

| Option | Pros | Cons |
|---|---|---|
| **D8-a. `miroir-env clear --name <env>` honoring `MIROIR_TEST_WORKER`** ★ | Knows the derived names (it resolves the same environment); reusable by a developer; refuses non-test environments. | miroir-env depends only on miroir-core; it needs `pg` and `mongodb`, loaded with a dynamic import only for those stores. |
| D8-b. `psql` / `mongosh` from Python | No TypeScript change. | Duplicates the naming rule in Python; needs the CLIs installed. |
| D8-c. Leave schemas, rely on reseeding | Nothing to write. | Contradicts D2. |

---

## 4. Current state

### 4.1 Store names come from the environment name (aligned with D3)

`packages/miroir-core/src/1_core/environment/Environment.ts`:

```typescript
// line 33
export function environmentAppsDirectory(environmentName: string): string {
  return `${ENVIRONMENT_STATE_ROOT}/${environmentName}/apps`;
}
// line 132, sectionDirectory: copy sections
const state = `${ENVIRONMENT_STATE_ROOT}/${environmentName}/${applicationKey}`;
// line 137
function storeIdentifier(environmentName: string, applicationKey: string): string {
  return `${environmentName}_${applicationKey}`.replace(/[^A-Za-z0-9_]/g, "_");
}
// sectionConfiguration, lines 179, 191, 197: SQL schema, MongoDB database, IndexedDB name
```

`deriveEnvironmentDeployments(environment, environmentName)` (line 208) passes `environmentName` to all of these. Its callers pass the definition name:

| Caller | Line | Passes |
|---|---|---|
| `resolveEnvironmentFromFiles` | `miroir-env/src/environmentFiles.ts:174` | `selection.name` |
| `validateEnvironmentDefinitions` | `environmentFiles.ts:153` | `name` (validation only, keeps the definition name) |
| `stateCommands` import | `miroir-env/src/stateCommands.ts:207` | `resolved.name` |

### 4.2 Places that rebuild a state path from `resolved.name` (misaligned with D3)

| Place | Line | Builds |
|---|---|---|
| `environmentStateDirectory` | `miroir-env/src/environmentState.ts:116` | `.miroir/<name>` (seeding, `env.lock.json`, `miroir-env show/check`) |
| `configEnvironment` | `environmentState.ts:196` | `{ name, appsDirectory }` handed to the client and server config; `DomainController.ts:457` and `miroir-server/src/server.ts:1044` give `appsDirectory` to runner templates (`runner.deployApplication`, `createApplication`) |
| `openTestEnvironment` | `miroir-env/src/testEnvironment.ts:70` | `rmSync(environmentAppsDirectory(name))` on reseed |

With D3 these use the state name. `name` stays the definition name for logs, `miroir-env show`, and `isTestEnvironment`.

### 4.3 How steps choose their environment

| Steps | Environment | Source |
|---|---|---|
| 34 steps with `--profile {profile}` (counted from the manifest) | the run's profile, `test-filesystem` for `nonreg:filesystem` | `expand_argv` |
| `appstack-270-persistent-secrets` | `test-filesystem`, hard-coded `--profile emulatedServer-filesystem` | manifest |
| standalone-app sessions without a profile | `test-sql` | `DEFAULT_TEST_ENVIRONMENT`, `standalone-app/tests/helpers/testEnvironment.ts:25` |
| miroir-mcp integration tests without a profile | `test-filesystem` | `DEFAULT_MCP_TEST_ENVIRONMENT`, `miroir-mcp/tests/integration/mcpTestPlatform.ts:23` |

Only an environment variable reaches all of them, hence D3-a.

### 4.4 Seeding and resets

- `openTestEnvironment(name, { reseed: true })` (`miroir-env/src/testEnvironment.ts:60`) deletes the apps directory and reseeds every copy section from the package assets. The standalone-app wrapper (`tests/helpers/testEnvironment.ts:53`) reseeds once per test file, keyed on `expect.getState().testPath`, which also holds under `--no-isolate`.
- Integration tests reset the testbed per test, or per suite with `testbedReset: "perSuite"` (#318).
- Runtime test applications: `testApplicationStorageConfiguration` (`runnerIntegTestSupport.ts:155`) places filesystem and IndexedDB stores under the template's `.miroir/<environment>` (`environmentStateDirectory`, line 79, splits the template location on `/` and takes the first two segments). For SQL (line 243) and MongoDB (line 254) the store name is `testApplicationName`, or `ephemeralStoreIdentifier(testApplicationName, isolationKey)` when the run target is not the canonical deployment (`RunnerTestSession.ts:137-139`). No environment in it: this is D5's gap.

### 4.5 Runner (`scripts/run-nonreg.py`)

- `main` (line 999) loops over the selected steps in manifest order. A shared group runs at its first member (`run_shared_group`, line 551); a failed member re-runs alone with its legacy argv.
- `spawn` (line 271) captures stdout and stderr; nothing streams to the console. `run_step` prints a header before the launch and `PASSED`/`FAILED` after it. In parallel, these lines would interleave between steps, but test output would not.
- `--fail-fast` marks later steps `not_run`.
- Per-step outputs are already separate: `logs/<step>.log`, `timings/<step>/`, `shared/<group>.json`.
- Every step inherits the runner's environment, plus `MIROIR_TEST_LOCAL_CACHE` (#446) and the timing variables (#318). `MIROIR_TEST_WORKER` follows the same path.
- `scripts/tests/test_run_nonreg.py` (37 tests) runs the real script on stub manifests of `python -c` steps; `test_every_tier_starts_by_recording_the_environment_and_ends_with_the_tracked_assets_check` guards the bracket.

### 4.6 Other shared resources (checked, no conflict)

| Resource | Finding |
|---|---|
| TCP ports | Fake external services bind port 0 (`tests/utils/fakeExternalServiceServer.ts:164`). The tests that need a server on 3080 (`uiIntegrationTestLauncher.realServer*.integ`) are not in the manifest. `RestClientStub` emulates the server in-process. |
| Failed-run exports | `writeFailedRunExportFile` names files by run id. |
| PostgreSQL connections | Each job opens its own pool; 4 jobs stay far under the default `max_connections` of 100 (inferred, not measured). |
| CPU and memory | About 7 s of transform and collect per launch, CPU-bound ([#318 baseline](../318-FEATURE-nonreg-profiling/analysis.md)). The cloud container has 4 cores and 15 GB. Peak memory per jsdom vitest process is not measured. |

## 5. Key reuse

| Piece | Location |
|---|---|
| Environment-derived store names | `deriveEnvironmentDeployments`, `Environment.ts:208` |
| Test environment guard | `isTestEnvironment`, `Environment.ts:25`; `selectedTestEnvironment`, `miroir-env/src/testEnvironment.ts:25` |
| Template-relative placement of test apps | `environmentStateDirectory`, `runnerIntegTestSupport.ts:79` |
| 63-character Postgres identifier budget | `ephemeralStoreIdentifier`, `runnerIntegTestSupport.ts:138` |
| Schema and database drop | `SqlDbAdminStore.ts:62` (`DROP SCHEMA IF EXISTS … CASCADE`), `MongoDbAdminStore.ts:45` (`dropDatabase`) |
| Runner test harness | `scripts/tests/test_run_nonreg.py` stub manifests |
| Per-step environment variables | `LOCAL_CACHE_ENV`, `timing_env` in `run-nonreg.py` |

## 6. Expected gain

Baseline (#318, 2026-09-27): `nonreg:filesystem` 15.8 min with `--runner shared`. The longest units bound a parallel run: the `ui` scope alone took 10.2 min serially (#351), and its appstack launch steps are among the longest. With 4 jobs the run is expected to take between a third and a half of the serial time. This is an estimate; slice 4 of the plan measures it.

The implementation plan is in [`tdd-implementation-plan.md`](tdd-implementation-plan.md).
