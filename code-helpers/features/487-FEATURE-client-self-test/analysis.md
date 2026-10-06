# 487 — Self-test mode: the web client and Electron run the miroir app's MiroirTests on page load

> A static environment setting, `client.selfTest`, makes the web client (and the Electron renderer) boot the platform, run the miroir app's MiroirTests without a click, show the results and publish a pass/fail verdict that a script, a CI job or the Electron main process can read.

Related issue: https://github.com/miroir-framework/miroir/issues/487
Companion issue: https://github.com/miroir-framework/miroir/issues/486 (health checks of the CLI, server and MCP, Electron main process)
Design discussion: `/mnt/project-files/service-health-checks/architecture.md` (Miroir project, 2026-10-06), decisions by A at its end.
Related analyses: [`../321-BUILD-environment-configuration/analysis.md`](../321-BUILD-environment-configuration/analysis.md) (environments), [`../345-BUILD-runtimes-adopt-environments/analysis.md`](../345-BUILD-runtimes-adopt-environments/analysis.md) (runtimes adopt environments), [`../286-FEATURE-react-component-miroir-tests/analysis.md`](../286-FEATURE-react-component-miroir-tests/analysis.md) (Run all, component test sandbox), [`../303-FEATURE-test-pattern-and-render-performance/analysis.md`](../303-FEATURE-test-pattern-and-render-performance/analysis.md) (`runOnDemand`), [`../330-FEATURE-report-level-miroir-tests/analysis.md`](../330-FEATURE-report-level-miroir-tests/analysis.md) (Report-level MiroirTests)
Key sources:
[`packages/miroir-standalone-app/src/index.tsx`](../../../packages/miroir-standalone-app/src/index.tsx),
[`RunAllMiroirTestsButton.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Buttons/RunAllMiroirTestsButton.tsx),
[`MiroirTestListDisplay.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MiroirTestListDisplay.tsx),
[`ConfigurationService.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/services/ConfigurationService.ts),
[`vite/environmentConfig.js`](../../../packages/miroir-standalone-app/vite/environmentConfig.js),
[`getMiroirFundamentalMlSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts),
[`miroir-env/src/environmentState.ts`](../../../packages/miroir-env/src/environmentState.ts),
[`miroir-standalone-app-electron/src/main.ts`](../../../packages/miroir-standalone-app-electron/src/main.ts)

**Status:** decisions 1 to 8 of the design discussion confirmed by A (2026-10-06); the design choices D1 to D10 below follow from them and are open for review. Implementation: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).

---

## 1. Goals

- **G1 — Boot check without a click.** In order to know that a built web client boots and that the framework runs in it, as an application maintainer, I can start the client on the `self-test` environment and see, without clicking anything, the results of the miroir app's `unit` MiroirTests and a pass/fail verdict.
- **G2 — Machine-readable verdict.** In order to automate that check, as a CI job or a local script, I can read the verdict and its counts from the page (`data-miroir-self-test` attribute, `window.__MIROIR_SELF_TEST_RESULT__`).
- **G3 — Desktop app check.** In order to check an installed or freshly built desktop app, as a desktop app maintainer, I can run `electron . --self-test` (or the packaged binary with `--self-test`) and get exit code 0 when the renderer's verdict is `passed`, 1 otherwise, with the report on stdout.
- **G4 — Integration tests in self-test mode (second step).** In order to check the persistence paths too, as an application maintainer, I can set `client.selfTest.tags` to include `integ` and have the miroir app's `integ` MiroirTests run on the emulated server inside the browser or the app, writing only to the browser's IndexedDB.
- **G5 — Automated and local runs.** In order to catch a broken build before release, as a maintainer, I have a GitHub Actions job that runs the self-test (Electron under `xvfb-run`, and the web client in headless Chromium), and a documented local run.

## 2. Non-goals

- Self-test of the CLI, the server REST routes, MCP and the Electron main process (#486). This issue only adds the renderer half of Electron `--self-test`.
- Authentication in self-test mode: the run assumes authentication off (decision 5). An authenticated scenario is later, unscheduled.
- A URL parameter (`?selfTest`) (decision 7). Later, unscheduled.
- MiroirTests of user applications (Library, Designer, …) (decision 6).
- `ui`-tagged MiroirTests (`reactComponentTest` leaves) and `reportTest` leaves in self-test mode: both need the component test sandbox mounted in a React tree (`ComponentTestSandboxProvider`), which the self-test page does not mount at first (D8). Later, unscheduled.
- Recording self-test runs as test-run history (#474, #483).
- Gating PRs on the self-test job: the job runs on demand and on `_integration` pushes first (D10).

## 3. Decision record

The design discussion settled the product decisions (numbers are A's decisions in `architecture.md`):

| # | Decision (A, 2026-10-06) |
|---|---|
| A2 | This issue also delivers the Electron renderer half of the health check. |
| A4 | `unit` MiroirTests first; `integ` on `emulatedServer-indexedDb`, run target `ephemeral`, as a goal. |
| A5 | No authentication in self-test mode for now. |
| A6 | The platform boots fully; no user application Report, Menu or agent loads. |
| A7 | The parameter is `client.selfTest` in the environment file; no URL parameter. |
| A8 | A GitHub Actions job if feasible (Electron under `xvfb-run`), plus a documented local run. |

The design choices below implement them:

| Decision | Choice | Serves |
|---|---|---|
| D1 Shape of the setting | **`client.selfTest: { enabled: boolean, tags?: string[] }`** in `miroirEnvironment` and carried into `miroirConfigClient`; `tags` defaults to `["unit"]` | G1, G4 |
| D2 Where the run starts | **In `index.tsx`, before any React tree that loads data**: plain async code boots, runs and renders a `SelfTestPage` with props; no router, no `useEffect` | G1, A6 |
| D3 What boots | **`setupMiroirPlatform` as today, then Admin and the miroir deployment only** (a restricted configuration load) | G1, A6 |
| D4 Where the tests come from | **The miroir app's MiroirTest rows in the local cache after the miroir rollback** | G1 |
| D5 Run code | **Extract the unit and integration batches out of `RunAllMiroirTestsButton` into a `4-tests` module** used by the button and the self-test | G1, G4 |
| D6 Verdict | **`passed` iff at least one test ran, none failed, and the boot succeeded**; one JSON shape on `<html data-miroir-self-test>`, `window.__MIROIR_SELF_TEST_RESULT__` and Electron IPC | G2, G3 |
| D7 Environment file | **`environments/self-test.json` extends `dev`**, removes the user applications, keeps miroir and Admin as copies, authentication off | G1, A5, A6 |
| D8 Integration tests | **Tags with `integ` add the integration batch** on the default in-app profile (`emulatedServer-indexedDb`, `ephemeral`, `isolated`); `reportTest` suites skipped | G4 |
| D9 Electron `--self-test` | **Main process forces `selfTest` in the client configuration it hands over, loads the built client in a hidden window, waits for the IPC verdict, prints it and exits 0/1/2** | G3 |
| D10 Automated runs | **One workflow `self-test.yml`** (on demand and on pushes to `_integration`): an Electron job under `xvfb-run` and a web job driven by a `selfTest` script on `playwright-core` | G5 |

**Rationale:** the self-test must exercise the production boot (so it catches what breaks it) while loading nothing beyond the platform. Every choice reuses the code the app already runs (environment resolution, `setupMiroirPlatform`, the Run all batches, the result display) and adds only the glue: a setting, a restricted load, a verdict, an exit channel.

### D1 — Shape of the setting

**Status:** proposed. **Serves:** G1, G4.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. `client.selfTest: { enabled, tags? }`** ★ | new optional object in `miroirEnvironment.client` (schema `getMiroirFundamentalMlSchema.ts:2126`) and in `miroirConfigClient` (`:1884`), copied by `environmentRealServerClientConfig` and `environmentClientConfig` | the issue's shape; `tags` uses the existing tag vocabulary and `filterMiroirTestInstancesByTags` | one more client field to thread through miroir-env |
| D1-b. `client.mode: "selfTest"` | a third client mode | no new object | mixes "how the client reaches its server" with "what the page does"; no room for tags |
| D1-c. `features.selfTest` | under `features` | `features` already travels to the client in emulated mode | `features` are process capabilities owned by the server (#273); `environmentRealServerClientConfig` deliberately drops them |

**Decision:** D1-a. `enabled: false` (or no `selfTest`) leaves the client unchanged. `tags` follows `filterMiroirTestInstancesByTags` semantics (an instance is selected when it carries any listed tag); missing or empty means `["unit"]`, not "all", so a bare `{ enabled: true }` stays on the safe, store-free set.

### D2 — Where the run starts

**Status:** proposed. **Serves:** G1, A6.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D2-a. A route in the router | `/self-test` route under `RootComponent` | reuses the shell | `RootComponent` and `PageDispatcher` load menus, the app bar, and `usePageConfiguration({ autoFetchOnMount: true })` loads every installed deployment (contradicts A6) |
| D2-b. `SelfTestPage` that starts the run in a `useEffect` | `index.tsx` renders the page instead of the router; the page boots and runs on mount | self-contained component | needs a `useEffect` (AGENTS.md: ask before adding one); StrictMode double-mounts effects, so the run needs a guard |
| **D2-c. `startSelfTest(root, config)` in `index.tsx`** ★ | `startWebApp` branches on `config.selfTest?.enabled` after `setupClient`; plain async code loads the deployments, runs the batches and calls `root.render(<SelfTestPage …/>)` with the progress, then with the results | no router, no effect; the run is a function a vitest integ test can call without React | the page is a pure display of props, so progress is shown by re-rendering at each suite |

**Decision:** D2-c. The page is wrapped in the same providers as the app (`ThemeProvider`, `LocalCacheProvider`, `MiroirContextReactProvider`) so the shared result components render unchanged.

### D3 — What boots

**Status:** proposed. **Serves:** G1, A6.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| D3-a. `fetchMiroirAndAppConfigurations` as is | rollback Admin, open and roll back every Deployment row of Admin | the app's exact load | opens every installed application (`ConfigurationService.ts`, `deploymentsToLoad` keeps all Deployments but Admin's) |
| **D3-b. Same function with an application filter** ★ | an optional `applications` filter on `fetchMiroirAndAppConfigurations` (or its extracted promise chain); the self-test passes `[selfApplicationMiroir.uuid]` | same code path as the app, one parameter; the self-test still checks Admin rollback, the Deployment query, store opening and the miroir rollback | `ConfigurationService.ts` is a long promise chain; the filter must not change its behaviour when absent |
| D3-c. A self-test-specific loader | open and roll back the miroir deployment directly | short | a second boot path that can drift from the real one |

**Decision:** D3-b. The filter keeps A6 true whatever the environment installs; D7 removes the user applications from `self-test.json` as well, so the server (web) and the Electron main process do not open them either.

### D4 — Where the tests come from

**Status:** proposed. **Serves:** G1.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. From the local cache** ★ | after the miroir rollback, read the miroir app's MiroirTest instances from its model in the local cache (the same selector `useSelectedApplicationMiroirTests` uses, called outside React) | proves the store, the rollback and the local cache; tests what the page would show | needs the selector to be callable with the Redux state, not only as a hook |
| D4-b. Static imports from `miroir-app-miroir` | `import { miroirTest_… } from "miroir-app-miroir"` | no boot dependency | the run would pass even when the boot loads nothing |

**Decision:** D4-a. An empty list after a successful boot is a failure (D6), which catches a boot that "succeeds" without loading the model.

### D5 — Run code

**Status:** proposed. **Serves:** G1, G4.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. Extract the batches** ★ | move the body of `onUnitAction` (`RunAllMiroirTestsButton.tsx:226`) and `runLaunchableIntegrationBatch` (`:135`) into `src/miroir-fwk/4-tests/miroirTestBatch.ts`: `runUnitMiroirTestBatch(instances, tracker, options)` and `runIntegrationMiroirTestBatch(params)`, both returning `MiroirTestSuiteResultsMap`; the button calls them | one implementation for Run all and self-test; testable without rendering a button | touches a tested component (`RunAllMiroirTestsButton.unit`, `runAllComponentTests.286.phase6.integ`) |
| D5-b. Render `RunAllMiroirTestsButton` and click it programmatically | the self-test page mounts the button | no refactor | drives logic through the DOM; the button's result goes to a snackbar and a callback, not a value |
| D5-c. Call `runMiroirTests._runMiroirTestSuite` directly in the self-test | duplicate the loop | no refactor | a second copy of the loop and its options (`skipRunOnDemandSuites`, `excludeMiroirTestTypes`) |

**Decision:** D5-a. Results stay `TestResultData[]` per suite (`testResultReport.ts`), so the display and the verdict read the same data as Run all. `summarizeSuiteResults` (private in `MiroirTestListDisplay.tsx:76`) moves next to `generateTestReport` so the verdict and the accordion count passed, failed and skipped the same way.

### D6 — Verdict

**Status:** proposed. **Serves:** G2, G3.

The result, one JSON-serializable object:

```ts
type MiroirSelfTestResult = {
  verdict: "running" | "passed" | "failed";
  environment: string | undefined;          // config.environment.name
  tags: string[];
  startedAt: string; durationMs?: number;
  counts?: { suites: number; tests: number; passed: number; failed: number; skipped: number };
  failures?: { suiteKey: string; testPath: string[]; failedAssertions: string[] }[];
  error?: string;                            // boot or runner error, verdict "failed"
};
```

- `passed` iff the boot succeeded, `counts.tests > 0`, and `counts.failed === 0`. Skipped tests do not fail the run.
- Published at three places, each written by one function (`publishSelfTestResult`): `document.documentElement.dataset.miroirSelfTest` (`running`, then `passed` or `failed`; on `<html>`, outside the React root, so a re-render cannot drop it), `window.__MIROIR_SELF_TEST_RESULT__`, and in Electron `window.electronAPI.reportSelfTestResult(result)`.
- An uncaught error anywhere in the boot or the run produces `failed` with `error`, never a page stuck on `running`.
- When the client finds authentication on (`fetchAuthenticationEnabled()` is true) in self-test mode, the verdict is `failed` with "self-test runs with authentication off" (A5) rather than a run of 401s.

### D7 — `environments/self-test.json`

**Status:** proposed. **Serves:** G1, A5, A6.

```json
{
  "name": "self-test",
  "extends": "dev",
  "description": "Self-test mode (#487): the client runs the miroir app's MiroirTests on page load. Only miroir and Admin are installed, both as copies in .miroir/self-test/; authentication off.",
  "server": { "authentication": { "enabled": false } },
  "client": { "selfTest": { "enabled": true, "tags": ["unit"] } },
  "features": { "ai": false },
  "applications": {
    "miroir": { "mode": "copy" },
    "library": null, "designer": null, "meta": null
  }
}
```

- `null` removes inherited applications (`docs/reference/environments.md`, `extends` row).
- miroir as a copy: the `integ` goal runs Runners and DomainController actions; a copy keeps them away from the tracked assets even if a test targets the environment instead of its ephemeral playfield. Admin data is already a copy in `dev`.
- `features.ai: false`: no agent loads (A6); the server would otherwise start the agent backend.
- The tracked-assets guard (`miroir-env check --tracked-clean`) stays green because nothing in `self-test` is live.

### D8 — Integration tests

**Status:** proposed. **Serves:** G4.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D8-a. `integ` in tags adds the integration batch** ★ | the unit batch runs on the selected instances that have unit leaves (as Run all); when `tags` contains `integ`, the integration batch runs on the launchable integration suites with `DEFAULT_UI_INTEGRATION_PROFILE_NAME` (`emulatedServer-indexedDb`, `integrationTestProfileCatalog.ts:15`), `DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE` (`ephemeral`) and `hostMode: "isolated"` | Run all's two batches, unchanged; the default profile writes only to the browser's IndexedDB | `reportTest` suites need `prepareReportTests` from the component test sandbox, absent from the self-test page |
| D8-b. A `selfTest.profile` setting | choose any profile | flexible | `realServer-*` profiles write to the server's test stores; not asked for |

**Decision:** D8-a. Suites with `reportTest` leaves are left out of the self-test integration batch and listed as skipped with a reason (1 suite today, tags `integ, report, ui`). The unit batch keeps `excludeMiroirTestTypes: ["reactComponentTest"]` so a `ui` leaf in a unit-tagged suite is recorded as skipped instead of needing the sandbox.

### D9 — Electron `--self-test`

**Status:** proposed. **Serves:** G3.

- `main.ts` parses `--self-test` (and `--self-test-tags=unit,integ`, `--self-test-timeout=<seconds>`, default 900).
- The client configuration handed over by `get-client-config` (`miroirIpcHandler.ts:132`) gets `selfTest: { enabled: true, tags }` merged in; the environment's own `client.selfTest` also works without the flag.
- The window is created with `show: false` and never shown; the `ready-to-show` handler skips `show()` and DevTools in self-test mode.
- The built client is loaded through `app://` even when unpackaged: today `isDev = --dev || !app.isPackaged` (`main.ts:44`) loads the Vite dev server (`:167`), which a CI run does not have.
- Preload exposes `reportSelfTestResult(result)` → `ipcRenderer.send("miroir-self-test-result", result)`. On a final verdict, main prints the JSON report on stdout, then `app.exit(0)` for `passed`, `1` for `failed`; `2` on timeout, renderer crash (`render-process-gone`) or a load failure (`did-fail-load`).
- **Coordination with #486:** #486 adds main-process probes behind the same flag. Whichever lands second makes `--self-test` run the main probes first, then the renderer, and prints one report `{ main, renderer }`. The exit-code contract (0, 1, 2) is shared.

### D10 — Automated runs

**Status:** proposed. **Serves:** G5.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D10-a. New workflow `self-test.yml`** ★ | `workflow_dispatch` and `push` to `_integration`; job `electron-self-test` (build chain, `xvfb-run -a npx electron packages/miroir-standalone-app-electron --self-test` with `MIROIR_ENV=self-test`); job `web-self-test` (build client and server release, `npm run selfTest -w miroir-standalone-app -- --serve`) | outside the PR gate at first (architecture recommendation 8); the two halves fail separately | a second build of the client per run |
| D10-b. Steps in `pr-checks.yml` | add to the PR gate | runs on every PR | lengthens every PR before the job has proven stable |
| D10-c. A job in `build-linux-runnables.yml` | after its `electron` job | reuses the built artefacts | that workflow is manual only and builds the distributable, not the unpacked app |

**Decision:** D10-a. The web driver `scripts/self-test.mjs` follows `scripts/coverage-tour.mjs`: same `--serve` (server release serving `dist/`, authentication off, 127.0.0.1), same browser lookup, then waits for `data-miroir-self-test` to leave `running`, prints `window.__MIROIR_SELF_TEST_RESULT__`, and exits 0/1/2 like Electron. Moving the job into the PR gate is a later decision for A once it has run green for a while.

---

## 4. Current state

### 4.1 Environment and client configuration (misaligned: no self-test field)

- `miroirEnvironment.client` has one field, `mode: "realServer" | "emulatedServer"` (`getMiroirFundamentalMlSchema.ts:2126-2132`). `miroirConfigClient` (`:1884`) has `miroirConfigType`, `client`, `environment`, `features`; no self-test field.
- The web client's configuration is computed at build time: `webClientEnvironment` (`vite/environmentConfig.js`) resolves the environment (`MIROIR_ENV`, then `environments/local.json`, then `dev`), calls `environmentRealServerClientConfig` (`miroir-env/src/environmentState.ts:297`) and defines `__MIROIR_CLIENT_CONFIG__`, read in `index.tsx:124-126`. `environmentRealServerClientConfig` copies the server URL, the store configurations and `environment`; it drops `features` on purpose.
- Electron: `bootElectronServer` (`environmentBoot.ts`) builds `clientConfig` with `environmentClientConfig` (emulated server, `features` kept) and serves it on `get-client-config` (`miroirIpcHandler.ts:132`); the renderer reads it with `ElectronRestClient.getClientConfig()` (`index.tsx`, in `startWebApp`).
- So a `selfTest` field must be added in the schema (then `npm run devBuild -w miroir-core`) and copied by both miroir-env functions; nothing else carries it to the client.
- Environments today: `cloud-agent`, `desktop`, `dev`, `docker`, `local`, `test-{filesystem,indexedDb,mongodb,sql}`. No `self-test`.

### 4.2 Web client boot (aligned with D2-c, one branch to add)

`startWebApp(root)` (`index.tsx:369-450`):

1. sets the auth token getter, then `setAuthenticationEnabled(await fetchAuthenticationEnabled())` (`:375`);
2. registers startups (`miroirAppStartup`, `miroirCoreStartup`, IndexedDB store);
3. picks the configuration (Electron over IPC, else `__MIROIR_CLIENT_CONFIG__`);
4. `setupClient` → `setupMiroirPlatform`: rest client (or `RestClientStub` with a server-side DomainController when `emulateServer`), client DomainController, `fetchProcessCapabilities`;
5. `root.render(...)` with the providers and `<RouterProvider router={router} />` (`:428`).

No data is loaded in `startWebApp`: deployments load later, from React, through `PageDispatcher` → `usePageConfiguration({ autoFetchOnMount: true })` → `fetchMiroirAndAppConfigurations`. The self-test branch goes between steps 4 and 5.

### 4.3 Deployment loading (misaligned with A6)

`fetchMiroirAndAppConfigurations` (`ConfigurationService.ts:61`): rollback of Admin, query of every `Deployment` row of Admin, `storeManagementAction_openStore` for each deployment whose `selfApplication` is not Admin, then a `rollback` of each. With `dev`, that opens miroir, Library, Designer and meta. It is a plain function (no React), called by `usePageConfiguration`, so the self-test can call it with a filter (D3-b).

### 4.4 Run all logic lives inside a React component (misaligned with D5)

`RunAllMiroirTestsButton.tsx`:

- unit batch: the closure `onUnitAction` (`:226-277`) sorts the instances, then for each: `tracker.resetResults()`, `runMiroirTests._runMiroirTestSuite(TestFramework, [], definition, undefined, defaultMetaModelEnvironment, tracker, undefined, true, runMiroirTests, options)` with `{ executionMode: "unit", skipRunOnDemandSuites: true }` or `{ executionMode: "unit", excludeMiroirTestTypes: ["reactComponentTest"] }`, then `generateTestReport(suiteKey, tracker.getTestAssertionsResults([]), () => {})`. It reads the tracker from `useMiroirContextService()`, so it cannot run outside the component.
- integration batch: `runLaunchableIntegrationBatch` (`:135-202`) is already a module function; it takes `runnerUuidIndex` and `miroirReports` from the component's hooks.
- Both return per-suite `TestResultData[]` through `onTestComplete`.
- In unit mode, `actionTest` and `reportTest` leaves throw (`MiroirTestTools.ts:218-221`, `:338-340`): a unit batch must only see unit-capable suites, which the `unit` tag filter ensures for the miroir app (§ 4.6).

### 4.5 Result display (partly reusable)

`MiroirTestListDisplay.tsx` renders the tag chips, the Run all buttons and, when results exist (`:277`), `UnitTestExecutionSummary` plus one `ThemedProgressiveAccordion` per suite with `TestResultsGrid`. `summarizeSuiteResults` (`:76`) is private. The results part is the "existing result display" the issue names; it is extracted into a component that takes `resultsBySuiteKey` and the sorted instances, used by both `MiroirTestListDisplay` and `SelfTestPage`.

### 4.6 The miroir app's MiroirTests (inventory)

Enumerated with a script over `packages/miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/*.json` (MiroirTest entity data), 2026-10-06:

| Tag | Instances |
|---|---|
| total | 69 |
| `unit` | 43 |
| `integ` | 17 |
| `ui` | 11 |
| `unit` and `integ` | 1 (transformer) |
| `report` | 1 (tags `integ, report, ui`) |

So the default self-test (`tags: ["unit"]`) runs 43 suites. Whether all 43 pass in a browser is not known yet. In Node, `npm run testMiroir -w miroir-core -- --tags unit --mode unit` on this branch (2026-10-06, cloud container) gives 981 passed and 4 failed of 985 tests, all four in transformer interface checks:

| Suite | Test |
|---|---|
| `fn.transformer.interfaceCheck` | `indexListBy declares an array of object to a record` |
| `fn.transformer.interfaceCheck` | `object_fromEntries declares an array to a record` |
| `fn.transformer.interfaceCheck` | `listReducerToSpreadObject declares an array of object to an object` |
| `fn.transformer.interfaceWalk` | `listReducerToSpreadObject over a list of strings fails its input` |

The expected values match the parameterized interface types of #449 (PR #475) and the actual ones the older shapes, so a stale build in the container is the first suspect. Slice 0 of the plan rechecks after a fresh build; if they still fail, they are a separate bug, and the self-test would rightly report `failed` until it is fixed.

### 4.7 Integration launcher (aligned with D8)

`DEFAULT_UI_INTEGRATION_PROFILE_NAME = "emulatedServer-indexedDb"` (`integrationTestProfileCatalog.ts:15`), `DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE = "ephemeral"` (`integrationTestProfileAssets.ts:31`). `runUiIntegrationTestSuite` with `hostMode: "isolated"` builds its own platform per suite (`loadBrowserUiIntegrationTestLauncherEnvironment`), so the integration batch does not depend on the deployments the self-test loaded.

### 4.8 Electron main process (misaligned with D9)

- `isDev = process.argv.includes("--dev") || !app.isPackaged` (`main.ts:44`); unpackaged runs load `https|http://localhost:5173/home` (`:167`), packaged runs `app://miroir/home` (`:173`), served from `getAppDistPath()` (unpackaged: `../../miroir-standalone-app/dist`).
- The window is created hidden and shown on `ready-to-show` (`:120-133`), with DevTools in dev.
- `setupIpcServer()` boots the environment before the window loads (`loadApp`).
- Preload exposes `callMiroirIpc`, `getAssetsBasePath` and window helpers; no verdict channel.
- Electron is not installed in the cloud containers (`node_modules/electron/dist` missing), so the Electron half is validated on A's machine and in the GitHub job only.

### 4.9 CI and drivers

- Workflows: `pr-checks.yml` (PR gate; builds the Electron main bundle for the bundle policy, does not run it), `build-linux-runnables.yml` (manual; builds packages in stages and `npm run dist -w miroir-standalone-app-electron`), `build-linux.yml`, `build-mac.yml`, `release-tree.yml`, `build-sandbox-for-github-pages.yml`. None starts the client or Electron.
- `packages/miroir-standalone-app/scripts/coverage-tour.mjs` (#326) already drives the production build in Chromium with `playwright-core` (a dependency of miroir-standalone-app) and serves it with the server release (`--serve`: production mode, authentication off, 127.0.0.1). The web self-test driver reuses that serving code.

### 4.10 Authentication

`fetchAuthenticationEnabled()` (`auth/authTransport.ts:12`) asks `/auth/status` (or Electron IPC) and returns false on error. With it true, REST calls without a token get 401 and the router shows the login page. `dev` has no `server.authentication`, so authentication is on by default (`AuthenticationPolicy.ts`), hence `"enabled": false` in `self-test.json` (D7).

## 5. Key reuse

| Piece | Location |
|---|---|
| Environment resolution, `extends`, `null` removal | `miroir-env/src/environmentFiles.ts`, `docs/reference/environments.md` |
| Client configuration builders | `environmentRealServerClientConfig`, `environmentClientConfig` (`miroir-env/src/environmentState.ts`) |
| Web build-time injection | `webClientEnvironment` (`miroir-standalone-app/vite/environmentConfig.js`) |
| Platform setup | `setupMiroirPlatform`, `setupClient` (`miroir-standalone-app/src/index.tsx`) |
| Deployment loading | `fetchMiroirAndAppConfigurations` (`4_view/services/ConfigurationService.ts`) |
| Tag filter | `filterMiroirTestInstancesByTags` (`miroir-core/src/5_tests/miroirTestTags.ts:87`) |
| Unit runner | `runMiroirTests._runMiroirTestSuite`, `TestFramework` (miroir-core) |
| Integration runner | `runLaunchableIntegrationBatch`, `runUiIntegrationTestSuite`, `loadBrowserUiIntegrationTestLauncherEnvironment` |
| Results | `generateTestReport`, `TestResultData` (`Buttons/testResultReport.ts`), `UnitTestExecutionSummary`, `TestResultsGrid` |
| Suite ordering and keys | `sortMiroirTestInstances`, `getMiroirTestSuiteKey` (`Reports/miroirTestSuiteKey.ts`) |
| Model selector | `selectModelForDeploymentFromReduxState` (miroir-localcache-redux `LocalCacheSliceModelSelector.ts:400`, re-exported by miroir-react), used by `useSelectedApplicationMiroirTests` |
| miroir app | `selfApplicationMiroir` (`360fcf1f-f0d4-4f8a-9262-07886e70fa15`), deployment `10ff36f2-50a3-48d8-b80f-e48e5d13af8e`; MiroirTest entity `a311f363-e238-4203-bdfc-29e8c160c26b` |
| Browser driver and `--serve` | `miroir-standalone-app/scripts/coverage-tour.mjs` |
| Electron IPC | `preload.ts`, `ipcServerSetup.ts`, `miroirIpcHandler.ts` |

## 6. Open points for review

1. `tags` default `["unit"]` when absent (D1), rather than "all tags".
2. miroir as a copy in `self-test.json` (D7): seeding costs a copy of the miroir assets on first start; `live` would avoid it but lets an `integ` run touch tracked files if a test ever targets the environment.
3. The self-test workflow runs on pushes to `_integration` and on demand, not on PRs (D10).
4. `reportTest` and `ui` suites left out at first (D8); mounting the component test sandbox in `SelfTestPage` would bring them in later.
