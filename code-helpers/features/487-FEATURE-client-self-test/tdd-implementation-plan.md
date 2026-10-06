# Issue #487 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests boot the real platform (`setupMiroirPlatform`, DomainController, local cache, emulated server
> on the `self-test` environment's filesystem copies) and run the miroir app's real MiroirTests,
> through the self-test's public surface: the `client.selfTest` environment setting, `runSelfTest`,
> the page's published verdict, and Electron's `--self-test` exit code.
> No mocks. The tracer bullet proves that the `self-test` environment, resolved like any other,
> boots, loads miroir and Admin only, runs the miroir app's `unit` MiroirTests read from the local
> cache, and returns a `passed` verdict.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step: commits happen only when
> the user asks. Each slice ends with its Validation commands; on success its Realization summary is
> appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/487
Companion: #486 (health checks; shares Electron `--self-test`, analysis D9)
Working branch: `claude/487-client-self-test-x9c2x8` (from `_integration` at 9838983)

**Resume note:** plan written 2026-10-06; decisions D1 to D10 and their defaults accepted by A 2026-10-06; Slice 0 DONE; next Slice 1 (tracer).

---

## Scope

- G1: on the `self-test` environment, page load boots the platform, runs the miroir app's `unit` MiroirTests and shows the results, without a click.
- G2: the verdict is readable on `<html data-miroir-self-test>` and `window.__MIROIR_SELF_TEST_RESULT__`.
- G3: `electron … --self-test` exits 0 or 1 from the renderer's verdict (2 on timeout or crash), report on stdout.
- G4: `tags` with `integ` adds the integration batch on `emulatedServer-indexedDb`, run target `ephemeral`.
- G5: a GitHub Actions workflow (Electron under `xvfb-run`, web in headless Chromium) and a documented local run.

This plan does **not** cover the CLI, server, MCP and Electron main-process probes (#486), authentication in self-test mode, a URL parameter, user applications' MiroirTests, `ui` and `reportTest` suites in self-test mode, or test-run history (#474, #483).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the unit baseline and the Run all contracts | ✅ DONE | `testMiroir --tags unit` baseline; existing Run all tests green |
| 1 | Tracer: `self-test` environment → `runSelfTest` → `passed` | ⬜ pending | `runSelfTest.487.phase1.integ.test.ts` |
| 2 | The verdict fails when it should | ⬜ pending | `selfTestVerdict.487.phase2.integ.test.ts` |
| 3 | Page load runs the self-test and publishes the verdict | ⬜ pending | `selfTestPage.487.phase3.integ.test.tsx` |
| 4 | Web driver and local run | ⬜ pending | `selfTestDriver.487.phase4.unit.test.ts` + a real `--serve` run |
| 5 | Electron `--self-test` (renderer half) | ⬜ pending | `electronSelfTest.487.phase5.unit.test.ts` + run on A's machine |
| 6 | `integ` MiroirTests in self-test mode | ⬜ pending | `runSelfTestInteg.487.phase6.integ.test.ts` |
| 7 | GitHub Actions workflow | ⬜ pending | green `self-test.yml` run on the branch |
| 8 | Nonreg steps, docs, cleanup, AC | ⬜ pending | `nonreg:filesystem` + AC checklist |

---

## Locked implementation defaults

From the analysis decision record, accepted by A 2026-10-06 (binding; deviations go into the slice's Realization).

| Decision | Choice | Serves |
|---|---|---|
| D1 Setting | `client.selfTest: { enabled: boolean, tags?: string[] }` in `miroirEnvironment` and `miroirConfigClient`; `tags` missing or empty means `["unit"]`; any-tag filter (`filterMiroirTestInstancesByTags`) | G1, G4 |
| D2 Start | `startWebApp` branches after `setupClient`; plain async code runs, `root.render(<SelfTestPage …/>)` shows progress and results; no router, no `useEffect` | G1 |
| D3 Boot | `fetchMiroirAndAppConfigurations` with an optional application filter; the self-test passes the miroir app only | G1 |
| D4 Tests | the miroir app's MiroirTest instances read from the local cache after the rollback | G1 |
| D5 Run code | unit and integration batches extracted from `RunAllMiroirTestsButton` into `4-tests/miroirTestBatch.ts`; the button uses them | G1, G4 |
| D6 Verdict | `passed` iff boot ok, ≥ 1 test, 0 failed; one `MiroirSelfTestResult` shape published on `<html data-miroir-self-test>`, `window.__MIROIR_SELF_TEST_RESULT__`, Electron IPC; auth on → `failed` | G2, G3 |
| D7 Environment | `environments/self-test.json`: extends `dev`, `library`/`designer`/`meta` null, miroir `copy`, auth off, `features.ai` false, `client.selfTest { enabled, tags: ["unit"] }` | G1 |
| D8 Integ | `integ` in tags adds the integration batch (default profile, `ephemeral`, `isolated`); `reportTest` suites skipped with a reason; unit batch excludes `reactComponentTest` | G4 |
| D9 Electron | `--self-test[=tags]`, `--self-test-timeout`; selfTest merged into `get-client-config`; hidden window; `app://` even unpackaged; exit 0/1/2; one report with #486's main probes when both exist | G3 |
| D10 CI | `.github/workflows/self-test.yml`, on `workflow_dispatch` and push to `_integration`: `electron-self-test` and `web-self-test` jobs; not in the PR gate | G5 |

---

## Allocated keys

| Artefact | Value |
|---|---|
| Environment | `environments/self-test.json`, name `self-test`, state `.miroir/self-test/` |
| Schema fields | `miroirEnvironment.client.selfTest`, `miroirConfigClient.selfTest` (type `MiroirSelfTestConfig`: `{ enabled: boolean; tags?: string[] }`) |
| Result type | `MiroirSelfTestResult` (analysis D6), in `miroir-standalone-app/src/miroir-fwk/4-tests/selfTest/selfTestResult.ts` |
| DOM / window | `data-miroir-self-test` on `<html>`; `window.__MIROIR_SELF_TEST_RESULT__` |
| Electron IPC | channel `miroir-self-test-result`; preload `electronAPI.reportSelfTestResult` |
| Electron flags | `--self-test[=<tags>]`, `--self-test-timeout=<seconds>` (default 900) |
| npm script | `selfTest` in miroir-standalone-app (`scripts/self-test.mjs`) |
| Workflow | `.github/workflows/self-test.yml`, jobs `electron-self-test`, `web-self-test` |
| Nonreg steps | `unit-487-self-test` (scopes `ui`, `tooling`), `default-487-self-test-integ` (scopes `ui`; tier `default`) |
| Issue test dirs | `packages/miroir-standalone-app/tests/4_view/issues/487-client-self-test/`, `packages/miroir-env/tests/` (flat, as the package does), `packages/miroir-standalone-app-electron/tests/unit/issues/487-client-self-test/` |

No new model element, so no UUID. No new MiroirTest: the self-test runs the existing ones, and its own behaviour (boot, page, Electron) is framework machinery that MiroirTest cannot express; every test below is vitest for that reason.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Unit baseline in Node | `npm run testMiroir -w miroir-core -- --tags unit --mode unit` |
| Issue test, standalone-app | `RUN_TEST=<name> npm run testByFile -w miroir-standalone-app -- <name>` |
| Issue test, miroir-env | `npm run testByFile -w miroir-env -- <name>` (or `npx vitest run <file>` in the package) |
| Issue test, Electron | `npm run testByFile -w miroir-standalone-app-electron -- <name>` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` for miroir-core, miroir-env, miroir-standalone-app, miroir-standalone-app-electron |
| Environment check | `npm run miroir-env -- check --strict --tracked-clean`; `MIROIR_ENV=self-test npm run miroir-env -- show` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared` |

Electron is not installed in the cloud containers: Electron end-to-end runs happen on A's machine and in the GitHub job; container validation covers the Electron-free modules.

---

## Slice 0 — Characterize the unit baseline and the Run all contracts

**Status:** ✅ DONE (2026-10-06)

**Goal:** know which of the 43 `unit` MiroirTests of the miroir app pass today, so Slice 1 can tell a self-test failure from an existing one, and lock the Run all behaviour before D5 moves its code.

**RED/characterization:**
- Run `npm run testMiroir -w miroir-core -- --tags unit --mode unit` after a fresh build (`./build-all.sh`). A first run on 2026-10-06 in a cloud container gave 4 failures of 985 tests in `fn.transformer.interfaceCheck` and `fn.transformer.interfaceWalk` (analysis § 4.6), possibly a stale build. Record per suite pass/fail in this slice's Realization. Any suite failing here is either fixed in its own issue or listed as a known failure that Slice 1's assertion accounts for (never skipped).
- Confirm green: `RunAllMiroirTestsButton.unit`, `MiroirTestListDisplay.unit`, `runAllComponentTests.286.phase6.integ`, `MiroirTestListIntegrationLaunch.integ`. They are the safety net for the D5 extraction.
- `MIROIR_ENV=self-test npm run miroir-env -- show` fails today ("no environment self-test"): the starting point of Slice 1.

**GREEN:** none (characterization).

**Refactor checkpoint:** none.

**Validation:**
```bash
npm run testMiroir -w miroir-core -- --tags unit --mode unit
RUN_TEST=RunAllMiroirTestsButton.unit npm run testByFile -w miroir-standalone-app -- RunAllMiroirTestsButton.unit
RUN_TEST=MiroirTestListDisplay.unit npm run testByFile -w miroir-standalone-app -- MiroirTestListDisplay.unit
npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6.integ
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem MiroirTestListIntegrationLaunch
MIROIR_ENV=self-test npm run miroir-env -- show   # fails: environment not found
```

### Realization

Run on `_integration` 9838983 plus the docs commit, cloud container, 2026-10-06.

- The 4 failures of the first run (analysis § 4.6) came from a stale `miroir-core` build. After `./build-all.sh devBuild`, `npm run testMiroir -w miroir-core -- --tags unit --mode unit` passes 985/985. No known failure to account for in Slice 1.
- The first full build stopped at miroir-standalone-app: `node_modules/miroir-app-meta` and `node_modules/miroir-example-github` were missing (node_modules older than #472 and the meta package). Adding the two workspace symlinks fixed it; `./build-all.sh devBuild` then exits 0. This is a container state issue, not a repository change.
- Safety net green: `RunAllMiroirTestsButton.unit` 4/4, `MiroirTestListDisplay.unit` 7/7, `runAllComponentTests.286.phase6.integ` 3/3, `MiroirTestListIntegrationLaunch` 1/1. The last one needs `--profile` (as its nonreg step `appstack-MiroirTestListIntegrationLaunch` passes it); without it the batch captures no run and the test fails.
- `MIROIR_ENV=self-test npm run miroir-env -- show` fails with `environment "self-test" not found`, as expected.


---

## Slice 1 — Tracer: the `self-test` environment runs the miroir app's unit MiroirTests and passes

**Status:** ⬜ pending

**Goal:** a maintainer selects `self-test` and a single call boots the platform on it, loads miroir and Admin only, reads the miroir app's MiroirTests from the local cache, runs the `unit` ones and returns `passed`. Cuts schema → miroir-env → client config → platform boot → deployment load → batch run → verdict.

**RED:** `packages/miroir-standalone-app/tests/4_view/issues/487-client-self-test/runSelfTest.487.phase1.integ.test.ts`
1. `resolveEnvironmentFromFiles({ env: { MIROIR_ENV: "self-test" } })` resolves; its `environmentClientConfig(...)` has `selfTest: { enabled: true, tags: ["unit"] }`, and so has `environmentRealServerClientConfig(...)`.
2. With that emulated-server configuration, `setupMiroirPlatform(config)` then `runSelfTest({ domainController, miroirContext, config })` returns `verdict: "passed"`, `counts.suites` equal to the number of `unit`-tagged MiroirTests of the miroir app (43 at plan time, minus Slice 0's known failures if any), `counts.failed === 0`.
3. The deployments opened by the run are Admin and miroir only (read from the client DomainController's local cache: no Library, Designer or meta deployment).

**GREEN:**
- Schema: `selfTest` object in `miroirEnvironment.client` and in `miroirConfigClient` (`getMiroirFundamentalMlSchema.ts`); `npm run devBuild -w miroir-core` regenerates `MiroirSelfTestConfig` in `miroirFundamentalType.ts`.
- miroir-env: `environmentRealServerClientConfig` and `environmentClientConfig` copy `environment.client.selfTest` when present.
- `environments/self-test.json` (analysis D7).
- `ConfigurationService.ts`: optional `applications?: Uuid[]` on `fetchMiroirAndAppConfigurations` options; when given, `deploymentsToLoad` keeps only those `selfApplication`s. Unchanged when absent.
- `4-tests/miroirTestBatch.ts`: `runUnitMiroirTestBatch(instances, tracker, { includeComponentTests })` returning `MiroirTestSuiteResultsMap` (body of `onUnitAction`).
- `4-tests/selfTest/runSelfTest.ts`: load (D3), read the miroir model's MiroirTests from the local cache with `selectModelForDeploymentFromReduxState` (D4), filter by tags, unit batch with `excludeMiroirTestTypes: ["reactComponentTest"]`, compute the result (D6, success path only in this slice).

**Refactor checkpoint:** `RunAllMiroirTestsButton.onUnitAction` calls `runUnitMiroirTestBatch` (Slice 0's tests stay green). `summarizeSuiteResults` moves from `MiroirTestListDisplay.tsx` to `testResultReport.ts` and the result counts use it.

**Validation:**
```bash
npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core
npm run build -w miroir-env
MIROIR_ENV=self-test npm run miroir-env -- show
npm run miroir-env -- check --strict --tracked-clean
RUN_TEST=runSelfTest.487.phase1.integ npm run testByFile -w miroir-standalone-app -- runSelfTest.487.phase1.integ
RUN_TEST=RunAllMiroirTestsButton.unit npm run testByFile -w miroir-standalone-app -- RunAllMiroirTestsButton.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-env/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui,tooling
```

### Realization
_(to fill)_

---

## Slice 2 — The verdict fails when it should

**Status:** ⬜ pending

**Goal:** a broken boot, an empty test list, a failing test or authentication on each give `failed` with a message a maintainer can act on; the run never ends on `running`.

**RED:** `tests/4_view/issues/487-client-self-test/selfTestVerdict.487.phase2.integ.test.ts`
1. `tags: ["no-such-tag"]` → `failed`, `error` says no MiroirTest matched the tags.
2. A configuration without the Admin deployment → `failed`, `error` carries the boot error (`fetchMiroirAndAppConfigurations` rejection), `counts` absent.
3. A failing test: `computeSelfTestResult` on the `generateTestReport` output of a real run of a transformerTest whose expected value is wrong → `failed`, `failures[0]` names the suite key and the test path. (The only fixture of the plan: the miroir app has no failing MiroirTest to import, and adding one to its assets would break its own runs.)
4. Authentication on (`authenticationEnabled: true` passed to `runSelfTest`) → `failed`, `error` "self-test runs with authentication off".

**GREEN:** `selfTestResult.ts`: `computeSelfTestResult(resultsMap, context)`, the error paths of `runSelfTest` (one try/catch around boot and run producing the `failed` result).

**Refactor checkpoint:** one place builds the result (no ad hoc objects in `runSelfTest`).

**Validation:**
```bash
RUN_TEST=selfTestVerdict.487.phase2.integ npm run testByFile -w miroir-standalone-app -- selfTestVerdict.487.phase2.integ
RUN_TEST=runSelfTest.487.phase1.integ npm run testByFile -w miroir-standalone-app -- runSelfTest.487.phase1.integ
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization
_(to fill)_

---

## Slice 3 — Page load runs the self-test and publishes the verdict

**Status:** ⬜ pending

**Goal:** with `client.selfTest.enabled`, loading the page shows the self-test page (no app bar, menu or router), its progress, then the results with the existing display; the verdict appears on `<html>` and `window`.

**RED:** `tests/4_view/issues/487-client-self-test/selfTestPage.487.phase3.integ.test.tsx` (jsdom, real platform on the `self-test` environment's emulated configuration)
1. `startSelfTest(root, config, platform)` renders "Self-test" with the environment name; while running, `document.documentElement.dataset.miroirSelfTest === "running"`.
2. At the end: `dataset.miroirSelfTest === "passed"`; `window.__MIROIR_SELF_TEST_RESULT__` deep-equals the result `runSelfTest` returned; the page shows the `UnitTestExecutionSummary` totals and one accordion per suite.
3. No element of the app shell renders (no AppBar, no sidebar menu), and the router's `PageDispatcher` never mounts (so `usePageConfiguration` never auto-fetches).
4. With `config.selfTest` absent, `startWebApp`'s branch is not taken (asserted through the exported `shouldStartSelfTest(config)`).

**GREEN:**
- `MiroirTestResultsDisplay.tsx`: the results part of `MiroirTestListDisplay` (summary plus accordions), props `instances`, `resultsBySuiteKey`.
- `4_view/pages/SelfTestPage.tsx`: header (environment, tags, verdict), progress (`suitesDone / suitesTotal`), `MiroirTestResultsDisplay`, error panel. Props only, no effect.
- `selfTest/startSelfTest.tsx`: `publishSelfTestResult` (DOM, window, Electron when `window.electronAPI?.reportSelfTestResult` exists), then `runSelfTest` with an `onProgress` that re-renders the page.
- `index.tsx`: after `setupClient`, `if (shouldStartSelfTest(config)) return startSelfTest(root, …)` with the same providers as the app.

**Refactor checkpoint:** `MiroirTestListDisplay` renders `MiroirTestResultsDisplay` (its own tests unchanged). Check `index.tsx` keeps one render path per mode, with no duplicated provider tree (extract `AppProviders` if both paths need it).

**Validation:**
```bash
RUN_TEST=selfTestPage.487.phase3.integ npm run testByFile -w miroir-standalone-app -- selfTestPage.487.phase3.integ
RUN_TEST=MiroirTestListDisplay.unit npm run testByFile -w miroir-standalone-app -- MiroirTestListDisplay.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run build -w miroir-standalone-app   # the production build still compiles; bundle policy unchanged
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

### Realization
_(to fill)_

---

## Slice 4 — Web driver and local run

**Status:** ⬜ pending

**Goal:** a maintainer or a CI job runs `npm run selfTest -w miroir-standalone-app -- --serve` and gets the report on stdout with exit 0 (passed), 1 (failed) or 2 (could not run).

**RED:** `tests/0_build/selfTestDriver.487.phase4.unit.test.ts`
1. `selfTestExitCode(result)`: `passed` → 0, `failed` → 1, `undefined` or `running` after the timeout → 2.
2. Argument parsing: `--serve`, `--url`, `--browser`, `--timeout`, `--headed`, same defaults as `coverage-tour.mjs`.

**GREEN:**
- Extract the `--serve` code of `scripts/coverage-tour.mjs` (start the server release on loopback serving `dist/`, authentication off, stop at the end) into `scripts/serveBuiltClient.mjs`; the tour imports it (its `coverageTourLoopback.unit` stays green).
- `scripts/self-test.mjs`: serve (or `--url`), open the page in Chromium (`playwright-core`), wait until `data-miroir-self-test` is `passed` or `failed` or the timeout, print `window.__MIROIR_SELF_TEST_RESULT__` as JSON, exit with `selfTestExitCode`. The client must be built with `MIROIR_ENV=self-test` and the server started on `self-test`.
- `package.json`: `"selfTest": "node scripts/self-test.mjs"`.

**Refactor checkpoint:** no duplicated serving code between the tour and the driver.

**Validation:**
```bash
RUN_TEST=selfTestDriver.487.phase4.unit npm run testByFile -w miroir-standalone-app -- selfTestDriver.487.phase4.unit
npm run testByFile -w miroir-standalone-app -- coverageTourLoopback.unit
MIROIR_ENV=self-test npm run build -w miroir-standalone-app
npm run build:release -w miroir-server
MIROIR_ENV=self-test npm run selfTest -w miroir-standalone-app -- --serve   # expect exit 0 and the JSON report
```

### Realization
_(to fill)_

---

## Slice 5 — Electron `--self-test` (renderer half)

**Status:** ⬜ pending

**Goal:** `electron packages/miroir-standalone-app-electron --self-test` (and the packaged binary) boots its environment, loads the built client hidden, waits for the renderer's verdict, prints it and exits 0, 1 or 2.

**RED:** `packages/miroir-standalone-app-electron/tests/unit/issues/487-client-self-test/electronSelfTest.487.phase5.unit.test.ts` (no Electron import: the logic lives in `src/selfTestMain.ts`, like `environmentBoot.ts`)
1. `parseSelfTestArgs(["--self-test"])` → `{ enabled: true, tags: ["unit"], timeoutSeconds: 900 }`; `--self-test=unit,integ` and `--self-test-timeout=60` parse; no flag → `undefined`.
2. `withSelfTest(clientConfig, options)` merges `selfTest` into the configuration; the IPC handler (`createMiroirIpcHandler` deps) answers `get-client-config` with it.
3. `selfTestExit(event)`: verdict `passed` → 0, `failed` → 1, `timeout`, `render-process-gone`, `did-fail-load` → 2; the printed report is the renderer's result plus `{ exitReason }`.
4. `selfTestLoadUrl({ isPackaged: false, selfTest: true })` is the `app://` URL, not the Vite dev server.

**GREEN:**
- `src/selfTestMain.ts` (pure functions above).
- `main.ts`: parse the flags; when set, `show` never called and no DevTools; load `app://miroir/home`; `ipcMain.once("miroir-self-test-result", …)`, timeout, `render-process-gone` and `did-fail-load` handlers; print and `app.exit(code)`.
- `preload.ts`: `reportSelfTestResult: (result) => ipcRenderer.send("miroir-self-test-result", result)` and its type.
- `ipcServerSetup.ts`: pass the merged client configuration.
- Coordination with #486 (analysis D9): if #486 is merged first, run its main probes before loading the renderer and print `{ main, renderer }`; if not, leave a single `report.renderer` key so #486 adds `main` without changing the shape.

**Refactor checkpoint:** `isDev` and the load URL computed in one place (`selfTestLoadUrl` generalised to `rendererLoadUrl`).

**Validation:**
```bash
npm run testByFile -w miroir-standalone-app-electron -- electronSelfTest.487.phase5.unit
npm run testByFile -w miroir-standalone-app-electron
npm run build -w miroir-standalone-app-electron     # tsc + main bundle; bundle policy unchanged
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
# On A's machine (Electron installed), after MIROIR_ENV=self-test npm run build -w miroir-standalone-app:
#   MIROIR_ENV=self-test npx electron packages/miroir-standalone-app-electron --self-test; echo $?
```

### Realization
_(to fill)_

---

## Slice 6 — `integ` MiroirTests in self-test mode

**Status:** ⬜ pending

**Goal:** `client.selfTest.tags: ["unit", "integ"]` (or `--self-test=unit,integ`) also runs the miroir app's launchable `integ` MiroirTests on `emulatedServer-indexedDb`, run target `ephemeral`, writing only to the browser's IndexedDB.

**RED:** `tests/4_view/issues/487-client-self-test/runSelfTestInteg.487.phase6.integ.test.ts`
1. With tags `["integ"]`, `runSelfTest` runs the integration batch with `profileName: "emulatedServer-indexedDb"`, `runTargetMode: "ephemeral"`, `hostMode: "isolated"` (read from the per-suite results' inspector data) and returns `passed`, or the failures Slice 0-style baseline lists.
2. The suite with a `reportTest` leaf is listed as skipped with the reason "reportTest suites need the component test sandbox".
3. The `self-test` environment's stores under `.miroir/self-test/` are byte-identical before and after the run (nothing written outside the browser store).

**GREEN:** `runIntegrationMiroirTestBatch` extracted from `runLaunchableIntegrationBatch` (it already is a module function; it moves to `miroirTestBatch.ts` and takes `runnerUuidIndex` and `miroirReports` as parameters, computed in `runSelfTest` from the miroir model); `runSelfTest` calls it when tags contain `integ`, after the unit batch; report suites filtered out before the batch.

**Refactor checkpoint:** `RunAllMiroirTestsButton.onIntegrationAction` calls `runIntegrationMiroirTestBatch` (`RunAllMiroirTestsButton.unit`, `MiroirTestListIntegrationLaunch.integ` stay green).

**Validation:**
```bash
RUN_TEST=runSelfTestInteg.487.phase6.integ npm run testByFile -w miroir-standalone-app -- runSelfTestInteg.487.phase6.integ
RUN_TEST=RunAllMiroirTestsButton.unit npm run testByFile -w miroir-standalone-app -- RunAllMiroirTestsButton.unit
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem MiroirTestListIntegrationLaunch
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,runners
npm run nonreg:filesystem -- --runner shared   # full run (slices 4 to 6 since the last one)
```

### Realization
_(to fill)_

---

## Slice 7 — GitHub Actions workflow

**Status:** ⬜ pending

**Goal:** the self-test runs in GitHub on demand and on every push to `_integration`, with a red job when the verdict is `failed`.

**RED:** the workflow file exists and its first dispatched run on the branch fails at the expected step before the jobs are complete (a missing script), then passes.

**GREEN:** `.github/workflows/self-test.yml`:
- triggers: `workflow_dispatch`, `push: branches: [_integration]`;
- shared steps as `pr-checks.yml` (pinned actions, Node from `.nvmrc`, `npm ci`, ordered build of the packages the client needs);
- `web-self-test`: `MIROIR_ENV=self-test npm run build -w miroir-standalone-app`, `npm run build:release -w miroir-server`, `MIROIR_ENV=self-test npm run selfTest -w miroir-standalone-app -- --serve` (browser: the runner's Chrome, or `MIROIR_TOUR_BROWSER`);
- `electron-self-test`: same client build, `npm run build -w miroir-standalone-app-electron`, `MIROIR_ENV=self-test xvfb-run -a npx electron packages/miroir-standalone-app-electron --self-test`;
- each job uploads the JSON report as an artifact.

**Refactor checkpoint:** if `pr-checks.yml` and `self-test.yml` share a long build sequence, move it to a composite action (only if both would otherwise drift).

**Validation:**
```bash
python scripts/check_dependency_policy.py      # pinned actions rule
# dispatch the workflow on claude/487-client-self-test-x9c2x8 (GitHub UI or API) and record both jobs' results here
```

### Realization
_(to fill)_

---

## Slice 8 — Nonreg steps, docs, cleanup, AC

**Status:** ⬜ pending

**Goal:** the self-test stays covered by the non-regression suite and documented.

**Work:**
- Nonreg steps in `scripts/nonreg-manifest.json`: `unit-487-self-test` (tier `unit`, scopes `ui`, `tooling`: driver and Electron unit tests) and `default-487-self-test-integ` (tier `default`, scopes `ui`: `runSelfTest`, verdict and page integ tests; `runSelfTestInteg` included). `python -m pytest scripts/tests -q` checks the scopes guard.
- Docs: `docs/reference/environments.md` (`client.selfTest` row, `self-test` in the environment list), `docs/reference/testing.md` (section "Self-test mode": what runs, verdict, local web and Electron runs, CI workflow), `packages/miroir-standalone-app-electron/README.md` (`--self-test` flags and exit codes).
- Cleanup (#238 rule): move the lasting assertions of `tests/4_view/issues/487-client-self-test/` to `tests/4_view/selfTest/*.test.ts(x)` and of the Electron issue folder to `tests/unit/selfTestMain.unit.test.ts`; delete the issue folders; update the nonreg steps' argv.
- Tracer narrative: manual run (build with `MIROIR_ENV=self-test`, start the server on `self-test`, open the page, see the results and `data-miroir-self-test="passed"`), automated equivalents (`selfTestPage` integ test, `npm run selfTest -- --serve`, Electron `--self-test`).

**Validation:**
```bash
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
python scripts/check_dependency_policy.py
npm run lint
npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared
```

**AC checklist:**

| Acceptance criterion (#487) | Proof |
|---|---|
| `client.selfTest` in the environment schema and `environments/self-test.json` | Slice 1 (`runSelfTest.487.phase1.integ` 1; `miroir-env show`) |
| page load runs the miroir app's `unit` MiroirTests and shows the results, nothing else loads | Slice 1 (3: only Admin and miroir), Slice 3 (`selfTestPage.487.phase3.integ` 1 to 3) |
| verdict on the DOM, on `window`, over IPC in Electron | Slice 3 (2), Slice 5 (2, 3; IPC end to end on A's machine and in CI) |
| Electron `--self-test` exits 0 or 1 from the renderer's verdict | Slice 5, Slice 7 (`electron-self-test` job) |
| `integ` MiroirTests on `emulatedServer-indexedDb` | Slice 6 |
| GitHub Actions job (Electron under `xvfb-run`) if feasible, and a documented local run | Slice 7, Slice 8 docs |

### Realization
_(to fill)_
