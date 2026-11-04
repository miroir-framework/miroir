# 672 — Run MiroirTests in the sandbox

> What it takes to run MiroirTests (unit and IndexedDB integ) in the static sandbox on GitHub Pages: move the
> MiroirTest UI runtime out of `miroir-standalone-app` into a package both apps register, cut its two links back
> into the app, and check the result in CI on the built sandbox.

Related issue: https://github.com/miroir-framework/miroir/issues/672
Prior decisions revisited: #13 Q3-a and #633 (the MiroirTest runtime stays in the app), for this runtime only.
Related: #197 (UI integration runs, profile catalog), #286 / #292 (component tests as MiroirTests), #633 (shell and
report section renderers in `@miroir-framework/react`), #639 (`startMiroirClient`).
Key sources:
[`packages/miroir-sandbox/src/index.tsx`](../../../packages/miroir-sandbox/src/index.tsx),
[`packages/miroir-standalone-app/src/miroir-fwk/4_view/reportSectionRenderers.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/reportSectionRenderers.tsx),
[`packages/miroir-react/src/components/Reports/ReportSectionViewWithEditor.tsx`](../../../packages/miroir-react/src/components/Reports/ReportSectionViewWithEditor.tsx),
[`packages/miroir-standalone-app/src/miroir-fwk/4-tests/`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/).

**Status:** decisions confirmed with the user in the issue thread (grilling round 1, 2026-11-03: D1 to D5).
D6 to D11 are technical decisions taken while the user was away; they are recorded here for review.

**Document history:** revised after an adversarial review (2026-11-03): package renamed `miroir-react-testing`
(private packages are `miroir-*`, `scripts/tests/test_package_manifests.py`), D5 moved to its own workflow, D8 covers
every subpath, D10 (Node stores) and D11 (suites the sandbox cannot pass) added, § 4.1 table and D3 corrected, § 6
risks added.

---

## 1. Goals

- **G1 — Unit MiroirTests in the sandbox.** In order to try Miroir's test model without installing anything, as a
  sandbox visitor, I can open the Miroir Tests report on GitHub Pages and run a unit suite (`fn`, `query`, `tr`
  without testbed, and the component tests `ui`), and see its results.
- **G2 — Integ MiroirTests on IndexedDB in the sandbox.** In order to see a test that sets up a testbed and runs
  actions, runners or Reports, as a sandbox visitor, I can run an integ suite on the `emulatedServer-indexedDb` profile, and
  my own sandbox data stays untouched.
- **G3 — One test runtime for both apps.** In order to fix or extend the Miroir Tests UI once, as a framework
  maintainer, I find the runtime in one package that the standalone app and the sandbox both register.
- **G4 — A sandbox that does not grow at first load.** In order to keep the sandbox quick to open, as a sandbox
  visitor, I do not download the fixture applications or testing-library until I start a test run.
- **G5 — Broken sandbox tests caught in CI.** In order not to publish a sandbox whose tests cannot run, as a
  maintainer, I get a failed workflow when a unit or an integ suite fails on the built sandbox.

## 2. Non-goals

- Integ storage other than IndexedDB in the sandbox (sql, filesystem, mongodb need Node drivers; realServer needs a
  `miroir-server`, which GitHub Pages does not have).
- Moving the standalone app's vitest tests of this runtime into the new package (they keep the app's test setup,
  `tests/setup.ts`; later, unscheduled).
- Publishing the new package to npm (it stays private; the published set is `scripts/published-packages.json`).
- Restructuring the runtime's internals beyond the two cut points (D6, D7).
- Suites that need what a static site does not have: a graph renderer (owned by #635) or an MCP endpoint (D11).

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1 Where the runtime lives | **New private package `miroir-react-testing`** (`packages/miroir-react-testing`) | G1, G2, G3 |
| D2 Fixture applications | **Behind the existing run-start dynamic imports; the sandbox registers a thin `./report-section` entry** | G4 |
| D3 Component tests | **In scope; testing-library stays behind `ComponentTestSandbox`'s dynamic import** | G1, G4 |
| D4 Profiles in the sandbox | **Only `emulatedServer-indexedDb`, derived: a realServer profile is offered only when the bundle carries its client config** | G2 |
| D5 CI | **Playwright smoke job on the built sandbox in the Pages workflow, also on PRs touching the sandbox or the package** | G5 |
| D6 MCP tool call | **`runMcpToolRunner` moves to `@miroir-framework/mcp/client`; the app file re-exports it** | G3 |
| D7 App renderers and shell host in component tests | **Injected through the test sandbox host; `ComponentTestSandbox` reads them from React context** | G1, G3 |
| D8 The app's tests of the runtime | **Stay in `miroir-standalone-app`; vitest resolves the package to its `src/`** | G3 |
| D9 Layout in the package | **`src/4-tests/**` and `src/4_view/**` as today, without `miroir-fwk/`; moved with `git mv`** | G3 |
| D10 Node store drivers | **Optional peer dependencies of the package; the sandbox stubs them in `vite build`, as the app does** | G2, G4 |
| D11 Suites a static site cannot pass | **Documented, not gated: the smoke run picks suites that can pass** | G1, G2 |

### D1 — Where the runtime lives

**Status:** Accepted (user, grilling round 1) — D1-a. **Serves:** G1, G2, G3.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. New package** ★ | `miroir-react-testing` (private, so unscoped like `miroir-diagram-class`), built with tsup one module per source module (as `@miroir-framework/react`, #592) | `@miroir-framework/react` stays free of test runtime, example apps and testing-library; one runtime | 70 files move; 107 app files update their imports |
| D1-b. Into `@miroir-framework/react` | Same files under `miroir-react/src` | No new package | The published react package would depend on the example and fixture apps; rejected |
| D1-c. Sandbox imports from the app | `miroir-sandbox` depends on `miroir-standalone-app` | No move | The app is not a library (Vite app, Electron); rejected |

### D2 — Fixture applications load at run start

**Status:** Accepted (user) — D2-a. **Serves:** G4.

The runtime already loads the integ machinery at run start (§ 4.3): `RunMiroirTestSuiteButton` and `miroirTestBatch`
import `uiIntegrationTestLauncher` and `loadBrowserUiIntegrationTestLauncherEnvironment` dynamically, and
`ComponentTestSandbox` imports `componentTests/index` dynamically. The fixture apps (`miroir-example-library`,
`miroir-example-github`, `miroir-fixture-appForTest`) are only reached through those imports.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. Keep the dynamic boundaries, thin entry** ★ | Package entry `./report-section` exports only `ReportSectionMiroirTest`; per-module output keeps the dynamic imports as separate modules | No new mechanism; the sandbox's lazy renderer pulls 32 modules, none heavy | A static import added later across a boundary would silently grow the chunk; the smoke job (D5) does not catch it |
| D2-b. Register through the package root | `lazy(() => import("miroir-react-testing"))` | One entry | Importing the root loads every module it re-exports, the fixture apps included; rejected |

### D3 — Component tests in scope

**Status:** Accepted (user) — D3-a: `ui.*` and `report.*` suites run in the sandbox; `@testing-library/*` become
dependencies of the package. They load behind `ComponentTestSandbox`'s dynamic import, and also with integ runs:
`tests-utils.tsx` imports `@testing-library/react` statically and `appStackIntegrationBootstrap.ts` imports
`tests-utils`, behind the integ launcher's dynamic import. Both are run-start boundaries, so G4 holds.

### D4 — Profiles in the sandbox

**Status:** Accepted (user: "only `emulatedServer-indexedDb`") — D4-a for the mechanism. **Serves:** G2.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Derived from the bundled configs** ★ | `isUiIntegrationProfileLaunchableInBrowser` and the picker offer a realServer profile only when `__MIROIR_TEST_CLIENT_CONFIGS__` holds its config. The standalone app's `vite.config.js` always defines the four (§ 4.4); the sandbox defines none | No new option; the standalone app keeps its four profiles | Couples the catalog to a define read today by `integrationTestProfileAssets.ts` only |
| D4-b. Host option | `createMiroirTestReportSection({ integrationProfiles })` | Explicit | New surface to thread to the picker, the preferences default and the launch gate; rejected for now |

### D5 — CI smoke test

**Status:** Accepted (user, second message); mechanism revised after review. The Pages workflow
(`build-sandbox-for-github-pages.yml`) runs on pushes to `main` only, in concurrency group `pages` with
`cancel-in-progress` and workflow-level `pages: write`, `id-token: write`: PR runs added there would cancel deployments
and get those permissions. So the smoke is a **separate workflow**, `sandbox-smoke.yml`, with read-only permissions and
a per-ref concurrency group. It builds the sandbox, serves it with `vite preview`, and with Playwright runs one
unit suite and one integ suite from the Miroir Tests report, the way a visitor does (the self-test of #487 runs
batches without the report UI, so it would not prove G1). The browser is launched as `serveBuiltClient.mjs` does. It runs on pull requests that touch the sandbox, the
package, the packages it moves code into (`miroir-mcp`), or the workflow, and on pushes to `_integration` and `main`.
The browser is the runner's Chrome, through `playwright-core` (exact devDependency of the sandbox), as `self-test.yml`
does; no browser download.

### D6 — The MCP tool call

**Status:** Accepted (technical). **Serves:** G3. `RunnerTestSession` imports `runMcpToolRunner` from the app's
`4_view/components/Runners/runMcpToolRunner.ts`, which only wraps `callMcpToolViaHttp` of
`@miroir-framework/mcp/client`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D6-a. Move it to `@miroir-framework/mcp/client`** ★ | The function joins `callMcpToolViaHttp`; the envelope type is declared there, structurally equal to `McpToolRunnerEnvelope` of `@miroir-framework/react`; the app file re-exports it | No duplicate; the client module owns the whole call | `@miroir-framework/mcp` gains a dependency on core's `Runner` and `ProcessCapabilities` types (core is already a dependency) |
| D6-b. Inject `runMcpTool` into `RunnerTestSession` | Option on `RunnerTestSessionOptions` | Pure injection | Every constructor (orchestrator, 9 test calls) has to pass it; rejected |
| D6-c. Copy it into the package | — | Simple | Duplicate; rejected |

### D7 — The app's renderers and shell host in component tests

**Status:** Accepted (technical). **Serves:** G1, G3. `MiroirTestProviders` (`componentTests/componentTestTools.tsx`)
wraps every component and Report under test in `MiroirShellHostProvider host={appShellHost}` and
`ReportSectionRenderersProvider renderers={appReportSectionRenderers}`, imported from the app.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D7-a. Injected through the sandbox host** ★ | `ComponentTestRunControls` (base of `ComponentTestSandboxHost` and `ReportTestSandboxHost`) gains `shellHost?` and `reportSectionRenderers?`; `ComponentTestSandbox` fills them from the providers' contexts (the host as provided, not `useMiroirShellHost()`, which builds a new object with defaults on each render); `MiroirTestProviders` provides them when given. Node callers pass the app's: `tests/helpers/reportTestEntry.ts` (`createReportTestRunner`, graph Reports) and the component test helpers | Each app tests with its own renderers; no import of app code | Node tests that relied on the app's renderers pass them explicitly |
| D7-b. Module-level registration | `setTestHost(...)` at startup | Small diff | Global state, order-dependent; rejected |

### D8 — The app's tests of the runtime

**Status:** Accepted (technical). **Serves:** G3. 107 files under `miroir-standalone-app` (`src/` 5, `tests/` 102)
import moved modules; about 37 `vi.mock` calls target `4-tests/` or the moved components by path. In vitest, the app resolves
`miroir-react-testing` and `miroir-react-testing/src/*` to the package's `src/`, so a test and
the code under test load the same module and `vi.mock` keeps working. The app's tsconfig for tests maps the same
paths. Builds (`vite build`) use the package's `dist/`.

### D8 — addendum (review)

Every exported subpath (`.`, `./report-section`) and `./src/*` resolve to `src/` in the app's vitest, or a test
mocking `src/...` and the app code importing `dist/...` would load two copies of a module, which breaks `vi.mock` and
duplicates module-level state (`integTestRunCoordinator`, the `browserBundledAdminStoreRegistered` flag of
`loadBrowserUiIntegrationTestLauncherEnvironment.ts`). `tsconfig.tests.json` maps the same paths; the app's main
`tsconfig.json` reads the package's `dist` types, so typechecking the app needs the package built first, as for every
other workspace package.

### D9 — Layout in the package

**Status:** Accepted (technical). `packages/miroir-react-testing/src/4-tests/**` and `src/4_view/components/**` keep
the app's sub-paths, so relative imports between moved files stay as they are, `git mv` keeps history, and only
imports of the app's own modules (`constants.ts`, `4_view/constants.ts`, `loglevelnextImporter.ts`,
`config/logging/catch-all.json`) change. The package gets its own `constants.ts` (`packageName =
"miroir-react-testing"`), `src/4_view/constants.ts` (`cleanLevel`), `loglevelnextImporter.ts`, and a copy of
`catch-all.json`. Logger names of the moved modules change from `miroir-standalone-app` to `miroir-react-testing`;
log presets that name them are updated.

### D10 — Node store drivers

**Status:** Accepted (technical, after review). **Serves:** G2, G4. `IntegrationTestSession.ts` imports
`@miroir-framework/store-{filesystem,postgres,mongodb}` dynamically for Node runs. tsup keeps a package external only
when it is a dependency or peer dependency; the app lists the three as devDependencies. The package lists them as
**optional peer dependencies** (`peerDependenciesMeta`), so its `dist` keeps the imports and installs nothing. The
sandbox gets the app's `vite build` alias to a stub (`nodeStoreStub.js`) and the `optimizeDeps.exclude` of #337, and the
`stream` polyfill (#472: `SecretsService` hashes with `createHash`, which the Report test
`report.connectExternalServiceWizard` reaches).

### D11 — Suites a static site cannot pass

**Status:** Accepted (technical, after review). **Serves:** G1, G2.

| Suite | Why it fails in the sandbox | Owner |
|---|---|---|
| `report.bundleSizeHistory`, `report.pageLoadHistory` | assert `graph-line-*` elements of a `graphReportSection`; only the app registers a graph renderer (d3) | #635 |
| `runner.mcp.getInstances` | calls the MCP endpoint at `browserMcpServerUrl()`; GitHub Pages has none | none: a static site has no server |

They stay listed and fail with their own message, as they do in the app when the capability is missing. The smoke run
selects suites that can pass. Gating suites on the renderers and capabilities at hand is a later improvement.

---

## 4. Current state

### 4.1 The sandbox renders no MiroirTest section (misaligned)

`packages/miroir-sandbox/src/index.tsx` registers one report section renderer:

```tsx
// packages/miroir-sandbox/src/index.tsx, sandboxReportSectionRenderers
const sandboxReportSectionRenderers: ReportSectionRenderers = {
  modelDiagramReportSection: lazy(async () => ({
    default: (await import("miroir-diagram-class")).ModelDiagramReportSectionView,
  })),
};
```

`ReportSectionViewWithEditor.tsx` (lines 700 to 710) renders `reportSectionRenderers.miroirTestReportSection` when it
is set and `<UnsupportedReportSection sectionType="miroirTestReportSection" />` otherwise: the message in the issue's
screenshot. The sandbox bundles the Miroir deployment, so the Miroir Tests report lists the 81 MiroirTest instances
of `packages/miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/` (entity MiroirTest, uuid
`a311f363-e238-4203-bdfc-29e8c160c26b`). All 81 are `miroirTestSuite`s; by name prefix:

| Prefix | Count | With `runTarget` / testbed | Mode |
|---|---|---|---|
| `fn` | 35 | 0 | unit |
| `tr` | 11 | 0 (`tr.core` has `testbedReset: "perSuite"`) | unit; `tr.core` mixed unit and integ (`mixed-unit-transformer`, `applicationMiroirTestCatalog.ts`) |
| `query` | 2 | 0 | unit |
| `ui` | 13 | 0 | unit (component tests) |
| `report` | 4 | 4 | integ (Report tests on a session) |
| `runner` | 6 | 2 | integ (all tagged `integ`) |
| `action` | 10 | 10 | integ |

### 4.2 The runtime lives in the app (misaligned with G3)

`packages/miroir-standalone-app/src/miroir-fwk/4_view/reportSectionRenderers.tsx` registers
`miroirTestReportSection: lazy(... ReportSectionMiroirTest ...)`. The import closure of
`ReportSectionMiroirTest.tsx` is 91 files. Minus the app's own modules it reaches (the d3 graph, the AI assistant,
`runMcpToolRunner`, `auth/`, `ElectronIpcProxy`, `loadTimings/`, `constants.ts`, `loglevelnextImporter.ts`,
`config/logging/catch-all.json`), **70 files, 15,293 lines** move: 55 under `4-tests/` (with `componentTests/` and
`miroirConfig.browser-emulatedServer-indexedDb.json`) and 15 components under `4_view/components/Reports/` and `Buttons/`.

Only two moved files import app code other than constants and the logger importer:

| Moved file | App module | What for |
|---|---|---|
| `4-tests/RunnerTestSession.ts` | `4_view/components/Runners/runMcpToolRunner.ts` | `executeMcpToolRunner` of a runner test (D6) |
| `4-tests/componentTests/componentTestTools.tsx` | `4_view/reportSectionRenderers.tsx` | `appShellHost`, `appReportSectionRenderers` in `MiroirTestProviders` (D7) |

### 4.3 Dynamic import boundaries already at run start (aligned with G4)

Static closure of `ReportSectionMiroirTest.tsx` (type-only imports excluded): 32 files, none of them importing the
fixture apps, testing-library, CopilotKit or the MCP client. The dynamic imports in the moved files:

| File | Imports dynamically |
|---|---|
| `Buttons/RunMiroirTestSuiteButton.tsx` | `uiIntegrationTestLauncher`, `loadBrowserUiIntegrationTestLauncherEnvironment` |
| `4-tests/miroirTestBatch.ts` | the same two |
| `Reports/ComponentTestSandbox.tsx` | `componentTests/index` (twice) |
| `4-tests/loadBrowserUiIntegrationTestLauncherEnvironment.ts` | `standaloneAppBrowserIntegrationOrchestrator` |
| `4-tests/IntegrationTestSession.ts` | `store-filesystem`, `store-postgres`, `store-mongodb`, `transformerTestApplicationPlayfield` |
| `4-tests/uiIntegrationPlayfieldSeeds.ts` | `@miroir-framework/core` |

The standalone app's `vite.config.js` aliases the three Node stores to `vite/nodeStoreStub.js` for `vite build`; the
sandbox's `vite.config.js` has no such alias and polyfills `crypto` only (the app adds `stream`, #472).

### 4.4 Integration profiles in a browser

`integrationTestProfileCatalog.ts`: `emulatedServer-indexedDb` (transport `browserEmulatedIndexedDb`, the default);
`emulatedServer-{sql,filesystem,mongodb}` (Electron only); `realServer-{sql,indexedDb,filesystem,mongodb}`; two CLI-only
CI profiles. `isUiIntegrationProfileLaunchableInBrowser` returns true for every realServer profile listed in
`BROWSER_LAUNCHABLE_REAL_SERVER_PROFILES` (all four), whatever the bundle holds. `integrationTestProfileAssets.ts`
builds the realServer assets from `__MIROIR_TEST_CLIENT_CONFIGS__` (guarded by `typeof === 'undefined'`), which the
app's `vite.config.js` defines for every command and mode with all four profiles (`webTestClientConfigs`). In the
sandbox the define is absent: the picker would offer four realServer profiles that fail at launch with "Unknown
browser integration test profile".

The `emulatedServer-indexedDb` config (`miroirConfig.browser-emulatedServer-indexedDb.json`) uses IndexedDB databases
named `ui-integ-*`; the sandbox's own are `sandbox-admin*` (`adminMigration.ts`).

### 4.5 CI

`.github/workflows/build-sandbox-for-github-pages.yml` builds the homepage and the sandbox on pushes to `main` and
deploys them; it runs no test. `.github/actions/build-artefacts-linux` builds the packages the sandbox needs.

## 5. Key reuse

| Piece | Location |
|---|---|
| Report section renderer registry | `ReportSectionRenderersProvider`, `useReportSectionRenderers` (`@miroir-framework/react`) |
| Shell host | `MiroirShellHostProvider`, `useMiroirShellHost`, `RunMcpTool` (`@miroir-framework/react`) |
| MCP HTTP call | `callMcpToolViaHttp` (`@miroir-framework/mcp/client`) |
| Browser integ stack | `standaloneAppBrowserIntegrationOrchestrator.ts`, `loadBrowserUiIntegrationTestLauncherEnvironment.ts` |
| Per-module tsup build | `packages/miroir-react/tsup.config.js` (#592) |
| Miroir Tests report | MiroirTest entity `a311f363-e238-4203-bdfc-29e8c160c26b`, section type `miroirTestReportSection` |
| Pages build | `.github/workflows/build-sandbox-for-github-pages.yml`, `.github/actions/build-artefacts-linux` |
| Browser driver | `packages/miroir-standalone-app/scripts/serveBuiltClient.mjs` (`launchBrowser`: playwright-core, falls back to the runner's Chrome), used by the self-test (#487, `.github/workflows/self-test.yml`) |
| Self-test batch | `4-tests/selfTest/runSelfTest.ts` runs tagged MiroirTests at page load through `miroirTestBatch` (`runUnitMiroirTestBatch`, `runIntegrationMiroirTestBatch`); it stays in the app and imports them from the package |

## 6. Risks

| Risk | Handling |
|---|---|
| Build paths miss the package or what it needs: `build-artefacts-linux` builds neither `miroir-example-github` nor `miroir-fixture-appForTest`, nor the package; `build-all.sh`, `pr-checks.yml` (bundle job), `self-test.yml`, `build-linux-runnables.yml` build `@miroir-framework/react` but not the package | Every build list gains the package (after react and mcp, before the app and the sandbox); the action builds the two fixture apps |
| The app's bundle guards: `bundle-policy.json` must classify every shipped package; `componentTestChunk.286.phase4.unit.test.ts` looks up the manifest key `miroir-fwk/4-tests/componentTests/index.ts` | The package is listed `lazy`; the guard is updated to the package's module |
| The package root re-exports modules that statically import the fixture apps; the app imports it statically (`index.tsx` uses `selectTestLocalCache`) | `"sideEffects": false` and per-module output as `@miroir-framework/react` (#592); the app's bundle policy (`forbiddenEager`) proves it |
| The integ launcher registers bundled Admin `18db21bf-…` (`loadBrowserUiIntegrationTestLauncherEnvironment.ts`), replacing the entry the sandbox registered at startup in `store-bundled`'s module-level registry | Harmless: the sandbox reads Admin from IndexedDB after its first-run migration (`adminMigration.ts`); the smoke run checks the sandbox's data after an integ run |
| Moved logger names change | Log presets naming `miroir-standalone-app` loggers of moved modules are updated |

Implementation phasing: [`tdd-implementation-plan.md`](tdd-implementation-plan.md).
