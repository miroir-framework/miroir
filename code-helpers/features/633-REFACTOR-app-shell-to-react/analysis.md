# 633 — Move the app shell and routes of miroir-standalone-app to miroir-react

> Which of the 59 modules left in `miroir-standalone-app/src/miroir-fwk/4_view` move to `miroir-react` so that `miroir-sandbox` builds from library packages only; how the host-specific parts (Electron login, the CopilotKit assistant, MCP tool calls, the model diagram, load timings) reach the moved shell; and what stays in the app, with the reason.

Related issue: https://github.com/miroir-framework/miroir/issues/633
Parent: epic #621, item I2 of [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md) (analysis item W2, [`../621-FEATURE-npm-packages/analysis.md`](../621-FEATURE-npm-packages/analysis.md) §4.4)
Prior analyses: [`../13-REFACTOR-gui-components-to-miroir-react/analysis.md`](../13-REFACTOR-gui-components-to-miroir-react/analysis.md) (Q1-a to Q5-a, end state §8), [`../592-REFACTOR-move-components-to-miroir-react/analysis.md`](../592-REFACTOR-move-components-to-miroir-react/analysis.md) (D1 to D7), [`../604-REFACTOR-editor-core-to-miroir-react/`](../604-REFACTOR-editor-core-to-miroir-react/)
Survey script: [`survey_shell_modules.py`](survey_shell_modules.py) (`python code-helpers/features/633-REFACTOR-app-shell-to-react/survey_shell_modules.py [--json]`)
Key sources: [`PageDispatcher.tsx`](../../../packages/miroir-react/src/PageDispatcher.tsx), [`RootComponent.tsx`](../../../packages/miroir-react/src/components/Page/RootComponent.tsx), [`reportSectionRenderers.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/reportSectionRenderers.tsx), [`ReportSectionRenderersContext.tsx`](../../../packages/miroir-react/src/contexts/ReportSectionRenderersContext.tsx), [`loadTimingBrowser.ts`](../../../packages/miroir-standalone-app/src/loadTimings/loadTimingBrowser.ts), [`miroir-sandbox/vite.config.js`](../../../packages/miroir-sandbox/vite.config.js)

**Document role:** analysis and decision record. **It revises #13 Q1-a.** #13 kept the shell, routes and services in the app as "the app's composition". Epic #621 needs them in `miroir-react`, which becomes `@miroir-framework/react`, so that a client can be built without the app's sources (§3, D1).

**Status:** decisions D1 to D8 are on their recommended options (★), taken by the agent under the epic's mandate; the user can override them (notably D4, a visible change).

**Document history.** The first draft (b94f4dea9) was reviewed adversarially. The review changed D3 (the model diagram page moves to `miroir-react`, not to `miroir-diagram-class`), D6 (the browser timing recorder stays in the app), D7 (tests import moved code from the package entry only; `ReportPage` stays in the app), D2 (lazy slots) and added D8 (the stored-runner renderer). The rejected first choices are kept below as D3-a and D6-a.

---

## 1. Goals

- **G1 — A client from libraries.** In order to start a Miroir client without copying `miroir-standalone-app` as an application developer, I can build the sandbox from `miroir-react`, `miroir-diagram-class` and the store packages alone, with no alias into the app's sources.
- **G2 — Same app.** In order to keep working as before as a standalone or Electron user, I get the same pages, the same login, the same assistant, the same load timings and the same lazy loading. The bundle guard (`scripts/check_bundle_policy.py`) passes.
- **G3 — Same sandbox.** In order to explore Miroir in the browser as a sandbox visitor, I keep the pages the sandbox shows today: home, settings, search, transformer builder, runners, events, check and model diagram.
- **G4 — Pluggable host features.** In order to ship host-specific features as an application maintainer, I can give the shell my login transport, my assistant panel, my MCP tool call and my load-timing recorder, without `miroir-react` importing Electron, CopilotKit, `miroir-mcp`, `miroir-diagram-class` or the MiroirTest runtime.
- **G5 — Tests that survive the move.** In order to trust the move as a developer, the existing UI, unit and source-text tests run against the moved modules through the package entry, with no import of `miroir-react/src` and no new mock by path (#13 G4).

## 2. Non-goals

- Moving the MiroirTest runtime (`miroir-fwk/4-tests`) or its 15 displays (#13 group C). They stay in the app, as #13 Q1-a decided, and reach the shell through the package exports.
- Moving the d3 graph renderers (`GraphComponent`, `GraphReportSectionView`). They stay registered renderers (#13 Q3-a).
- Moving the browser load-timing recorder (`src/loadTimings/`, D6).
- One startup call for the sandbox and the app (epic I4). `miroir-sandbox/src/index.tsx` keeps its setup code.
- Renaming packages and deciding whether `miroir-diagram-class` is published (epic I6).
- A consumer-owned React shell (epic D5): the shell moves, but the standalone app remains the only real client.

---

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1 What moves | **Shell, generic routes and pages, client services, runners, model diagram page** (§5.1, 29 modules); the MiroirTest runtime and displays, `ReportPage`, the graph renderers, the CopilotKit modules, `runMcpToolRunner`, Electron IPC and `loadTimings` stay | G1, G2, G3 |
| D2 Host features | **One `MiroirShellHostContext`** with optional slots `assistantPanel`, `requestLoginToken`, `runMcpTool`, filled with `import()` wrappers; a `pages` slot is deferred | G4, G5 |
| D3 Model diagram | **`ModelDiagramPage` moves to `miroir-react` and renders the diagram through the section registry; `ModelDiagramReportSectionView` moves to `miroir-diagram-class`** | G1, G3, G4 |
| D4 Library defaults | **Search and transformer builder pages default to the current application**, falling back to Miroir | G1 |
| D5 Login | **HTTP login in `miroir-react`, Electron login injected** through `requestLoginToken` | G2, G4 |
| D6 Load timings | **The recorder stays in the app; `miroir-react` gets a mark sink** with a no-op default, which the app registers | G1, G2, G4 |
| D7 Layout, exports, tests | **#592 D3 to D5** for paths and loggers; lazy pages stay lazy; every symbol used outside `miroir-react` is exported from `index.ts`; tests import from `"miroir-react"` only | G2, G5 |
| D8 Stored runner | **`storedRunner` becomes a built-in lazy default renderer of `miroir-react`** | G1, G3 |

### D1 — What moves

**Status:** Accepted D1-a. **Serves:** G1, G2, G3.

The sandbox imports four modules through `@miroir-app` (§4.5). Their static closure is 14 modules (§4.2). `PageDispatcher` adds 10 lazy pages, which pull in the runners, the model diagram and, through `RootComponent`, the CopilotKit panel.

| Option | What moves | Pros | Cons |
|---|---|---|---|
| **D1-a. Shell, generic pages, services, runners** ★ | §5.1: 29 `4_view` modules | the sandbox keeps every page (G3); `@miroir-framework/react` gets a working client | needs host slots (D2, D6) for what the app adds |
| D1-b. Only the static closure | `RootComponent`, `AppBar`, `PageDispatcher`, services | smallest move | every page becomes a host page; the sandbox cannot provide them (no alias), so it loses all of them (G3 fails) |
| D1-c. Everything but `index.tsx` | D1-a plus `4-tests` and its displays | nothing left to decide | puts `@testing-library/*`, `vitest` imports and the example and fixture applications into a published package (#13 non-goal) |

`routes/ReportPage.tsx` is not routed: `PageDispatcher` renders `ReportDisplay` for `?page=report`. Its only users are 4 test files (§4.6). It stays in the app as a test harness, which keeps those tests on a relative import.

### D2 — How host features reach the shell

**Status:** Accepted D2-a. **Serves:** G4, G5.

Three things in the moved code are host-specific (§4.4): the Electron branch of the login, the CopilotKit panel that `RootComponent` mounts, and `runMcpToolRunner` (`miroir-mcp/client`). Every page `PageDispatcher` routes today (11 `?page=` names plus `ai`, which renders home) moves (D1, D3), so no host page exists yet. #13 Q3-a solved the same problem for report sections with `ReportSectionRenderersContext`, which the app fills in `index.tsx` and in its MiroirTest component test providers.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. One host context** ★ | `MiroirShellHostContext` in `miroir-react/src/contexts/`, all slots optional: `assistantPanel?: LazyExoticComponent`, `requestLoginToken?: (username, password) => Promise<string \| undefined>`, `runMcpTool?: (runner, args, serverUrl, capabilities) => Promise<McpToolRunnerEnvelope>` | one provider beside `ReportSectionRenderersContext`; the MiroirTest providers fill it the same way; each slot defaults to the sandbox's behaviour | one more context |
| D2-a′. D2-a plus `pages?: Record<string, LazyExoticComponent>` | a host adds `?page=` targets | no host page exists (the self-test page is mounted by `startSelfTest`, not routed); deferred to the consumer-owned shell work (epic D5) |
| D2-b. Props on `RootComponent` and `PageDispatcher` | the host passes them in its route elements | explicit | `LoginPage` and `RunnerView` sit several components below, so the props would be drilled through moved code |
| D2-c. One context per slot | four providers | each one is small | four providers in `index.tsx`, the sandbox and every test rig |

Rules the slots follow:

- **Defaults:** no assistant, HTTP login (D5), and an MCP runner that answers `FeatureUnavailable`.
- **Lazy by construction.** `assistantPanel` holds `React.lazy(() => import(...))` values. `runMcpTool` is a function the app writes as `async (...a) => (await import("./runMcpToolRunner.js")).runMcpToolRunner(...a)`. `miroir-mcp/client`, CopilotKit and their dependencies stay in their own chunks, as the bundle policy requires today.
- **Types in `miroir-react`.** `McpToolRunnerEnvelope` (now in `runMcpToolRunner.ts`) moves to the context module; `runMcpToolRunner.ts` imports it from `"miroir-react"`.
- **When `pages` comes (D2-a′):** a host page is used only for names the shell does not know, so `home`, `report` and `login` cannot be replaced and the auth gate in `PageContent` cannot be bypassed.

### D3 — Model diagram

**Status:** Accepted D3-d; D3-a rejected after review. **Serves:** G1, G3, G4.

`ModelDiagramPage` renders `ModelDiagramReportSectionView`, which imports `miroir-diagram-class`. `miroir-diagram-class` depends on `miroir-react`, so `miroir-react` cannot import it (#13 group D). The section kind `modelDiagramReportSection` already goes through the registry (#610).

| Option | Pros | Cons |
|---|---|---|
| **D3-d. Page in `miroir-react` through the registry, view in `miroir-diagram-class`** ★ | `ModelDiagramPage` needs only what `miroir-react` already declares (`react-router-dom`, `formik`, `miroir-app-admin`, `miroir-app-miroir`, `usePageConfiguration`); it renders `useReportSectionRenderers().modelDiagramReportSection`, or `UnsupportedReportSection`; the view imports only `react`, `miroir-core`, `miroir-diagram-class` internals and two `miroir-react` exports, so it fits `miroir-diagram-class`; the app and the sandbox register it with `lazy(() => import("miroir-diagram-class"))` | the 9 tests that mock the view by path mock the `miroir-diagram-class` entry instead (§4.6); the sandbox adds `miroir-diagram-class` and a renderer provider |
| D3-a. Move page and view to `miroir-diagram-class` (first draft) | both beside the code they render | the page needs `react-router-dom`, `formik`, `miroir-app-admin`, `miroir-app-miroir` and `usePageConfiguration`, which `miroir-diagram-class` does not declare; `build-all.sh` builds `miroir-react` and `miroir-diagram-class` in the same parallel stage, so a build order change too |
| D3-b. Keep both in the app as a host page | no change | the sandbox loses the model page (G3 fails) |
| D3-c. `miroir-react` imports `miroir-diagram-class` lazily | | package cycle (#13 Q3-b, rejected) |

### D4 — Library defaults in the search and transformer builder pages

**Status:** Accepted D4-a. **Serves:** G1. `routes/SearchPage.tsx` uses `deployment_Library_DO_NO_USE`, `selfApplicationLibrary` and `entityBook` as its default selection. `routes/TransformerBuilderPage.tsx` picks `entityBook` when the editor application is the Library. `@miroir-framework/react` cannot depend on an example application (#627 removed the same dependency from MCP, the CLI and the assistant).

| Option | Pros | Cons |
|---|---|---|
| **D4-a. Current application, falling back to Miroir** ★ | the rule `TransformerBuilderPage` already uses for `editorApplication` (`toolsPageState.applicationSelector`, then `context.application`, then `selfApplicationMiroir`), with the deployment from `currentApplicationDeploymentMap`; initial entity: the application's first entity, or `Entity` for Miroir | **visible change**: the search page no longer opens on the Library's books when no application is selected |
| D4-b. A `defaultApplicationUuid` slot in the host context | the app keeps the Library default | an example application stays wired into the app's composition; one more slot for a default |

### D5 — Login transport

**Status:** Accepted D5-a. **Serves:** G2, G4. `auth/authTransport.ts` has a browser branch (`fetch("/auth/login")`) and an Electron branch (`ElectronRestClient` from `services/ElectronIpcProxy.ts`). `LoginPage` calls `requestLoginToken`, and the app's `index.tsx` calls `fetchAuthenticationEnabled` at startup.

| Option | Pros | Cons |
|---|---|---|
| **D5-a. Browser branch in `miroir-react`, Electron through `requestLoginToken`** ★ | `LoginPage` moves; the browser and the sandbox need nothing; the app passes its current `requestLoginToken`; `authTransport.ts` and `ElectronIpcProxy.ts` stay in the app; the app's browser branch delegates to the `miroir-react` one, so the code exists once | `authTransport.ts` is in `eslint-suppressions.json`; its entry follows whichever file keeps the suppressed lines |
| D5-b. `LoginPage` stays in the app as a host page | no slot | a client built from `miroir-react` has no login page; `PageContent` redirects to `?page=login` when authentication is on |

### D6 — Load timings

**Status:** Accepted D6-c; D6-a rejected after review. **Serves:** G1, G2, G4.

`services/ConfigurationService.ts` line 350 calls `loadTimingMark("configurationsLoaded")` from `src/loadTimings/loadTimingBrowser.ts` (#580). That module is not a plain library: on load it runs `startObserving()` (it wraps `fetch` and observes the DOM) unless `import.meta.env.VITE_TEST_MODE` is `"true"`, reads `import.meta.env.DEV`, and must be the first module the app's `index.tsx` imports. `ElectronIpcProxy.ts` also imports it. Four tests cover it (`tests/4_view/loadTimings/`), a nonreg step runs them, and `docs/reference/load-timings.md` documents it.

| Option | Pros | Cons |
|---|---|---|
| **D6-c. Recorder stays; `miroir-react` exports `setLoadTimingMarkSink(fn)` and `loadTimingMark(name)`** ★ | the side effects stay where the app controls their order; `ConfigurationService` calls the package's `loadTimingMark`, a no-op until the app's `index.tsx` registers its recorder; the 4 tests, the nonreg step and the doc keep their paths | a module-level sink in `miroir-react` (one variable, like `packageName`) |
| D6-a. Move `src/loadTimings/` to `miroir-react` (first draft) | the sandbox records timings | an import of `miroir-react` would start observing `fetch` in every consumer, `import.meta.env` in a library build, and the "first import" rule breaks |
| D6-b. A `mark` slot in the host context | no module state | `ConfigurationService` is not a component and has no context |

### D7 — Layout, exports, tests, lint

**Status:** Accepted; applies #592 D3 to D5 and #13 D16/D17. **Serves:** G2, G5.

- **Paths.** `4_view/<path>` goes to `miroir-react/src/<path>` with `git mv`. There is no name collision (§4.5).
- **Loggers.** Moved modules import `packageName` from `miroir-react`'s constants and `cleanLevel` from `viewConstants.ts`. No log preset names one of them.
- **Lazy pages.** `PageDispatcher` keeps its 10 `React.lazy(() => import("./routes/….js"))` imports, now relative inside `miroir-react`. With tsup `splitting` (#592 D1-a) each page stays a separate chunk. This is the case #13 D16 already covers: lazy imports inside the package split, `import("miroir-react")` from the app does not.
- **Exports.** `package.json` `exports` declares only `"."`, and an app test that imported `miroir-react/src/...` would load a second copy of the package's modules (two React contexts). So `index.ts` exports every moved symbol used outside `miroir-react`: the shell (`RootComponent`, `PageDispatcher`, `AppBar`, `FeedbackGlowAppBarButton`), the services (`usePageConfiguration`, `fetchMiroirAndAppConfigurations`, `useConfigurationService`, `markPageConfigurationsLoaded`), `reportPageParamsFromSearchParams`, `SequenceEditor`, `resolveMcpToolAction`, `buildCreateApplicationStorageSchema`, the runner views, the AI pick helpers, the host context, the load-timing sink, and the page components the tests render. The plan's first slice derives the full list from the importers (§4.6), and a test checks it.
- **Tests.** Tests stay in `miroir-standalone-app/tests` and import from `"miroir-react"`; the rebuilt `dist` is what they run. A slice that moves files rebuilds `miroir-react` before the app tests.
- **Lint.** `eslint-suppressions.json` keys entries by path: the 9 entries of moved files (§4.6) move with them. The `VIEW` glob of `eslint-rules/smells.mjs` matches `.tsx` everywhere but `.ts` only under `4_view/**`, so `ConfigurationService.ts`, `resolveMcpToolAction.ts`, `services/index.ts` and the AI pick helpers fall out of the view rules; the glob gains the moved directories.

### D8 — Stored runner renderer

**Status:** Accepted D8-a. **Serves:** G1, G3. The app's registry maps `storedRunner` to `lazy(() => import("./components/Runners/RunnerView.js"))`. `RunnerView` moves to `miroir-react` (D1), so the app would register a component it imports from the package.

| Option | Pros | Cons |
|---|---|---|
| **D8-a. Built-in default** ★ | `ReportSectionRenderersProvider` merges host renderers over `{ storedRunner: lazy(() => import("../components/Runners/RunnerView.js")) }`; the sandbox gets runner sections with no registration | the registry comment ("four kinds the application provides") changes to three |
| D8-b. The app keeps registering it | no change to the provider | every other client registers it by hand; the lazy import from `"miroir-react"` does not split (#13 D16) |

---

## 4. Current state (on `_integration`, 1a398908e)

### 4.1 Survey method

`survey_shell_modules.py` reads every `.ts`/`.tsx` under `miroir-standalone-app/src` with comments stripped. It resolves relative imports and labels each edge static, dynamic (`import()`) or type-only. For each `4_view` module it reports the app modules it imports from outside `4_view` and the packages `miroir-react` does not declare. It also lists the strongly connected components (static, non-type edges) and the importers from `4-tests`, `src/`, the sandbox, Electron and the tests.

Result: **59 modules, 15,903 lines; no import cycle in `4_view`, and none across the whole app.** #610 (section renderer registry) and #612 (reports cycle and grids) removed the cycle that #592 §4.2 and #13 group A described. The I2 slice "break the reports / component-tests cycle" of the epic plan is already done.

Limits found in review: the script does not follow importers of `src/loadTimings/` (checked by hand, §D6) and does not read `vi.mock` strings (checked by hand, §4.6).

### 4.2 What the sandbox's imports reach

Static closure of `RootComponent`, `PageDispatcher`, `services/index`, `services/usePageConfiguration`: 14 modules.

| Module | Lines | Notes |
|---|---|---|
| `components/Page/RootComponent.tsx` | 963 | lazy: `EventTimelineContainer`, `InstanceEditorOutline`, `routes/ai/AgentsCopilotKit` (mounted on the first AI AppBar open) |
| `components/Page/AppBar.tsx` | 872 | static: `routes/ai/miroirAiBackend`, `routes/ai/agentBackendPick` (no CopilotKit import) |
| `PageDispatcher.tsx` | 261 | 10 lazy pages (§4.3) |
| `services/ConfigurationService.ts`, `usePageConfiguration.ts`, `index.ts` | 550 | `loadTimingMark` (D6) |
| `routes/ai/miroirAiBackend.ts`, `agentBackendPick.ts` | 79 | localStorage pick and capability labels |
| `constants.ts` (4_view, `cleanLevel = "4"`) | 1 | |
| `src/constants.ts` | 78 | only `packageName` is used by `4_view` (28 imports) |
| `src/loadTimings/*` (5 of 6) | 737 | stays (D6) |

### 4.3 Lazy targets and their blockers

| Target (importer) | Brings in | Blocker |
|---|---|---|
| `routes/HomePage`, `ErrorLogsPageDEFUNCT`, `components/EventTimelineContainer`, `components/InstanceEditorOutline` | nothing outside `4_view` | none |
| `routes/Check`, `routes/SettingsPage`, `pages/MiroirEventsPage` | services | `loadTimingMark` (D6) |
| `routes/SearchPage` | services | `miroir-example-library` (D4) |
| `routes/TransformerBuilderPage` | `SequenceEditor`, `RunnerView` chain | `miroir-example-library` (D4), `miroir-mcp` (D2 `runMcpTool`) |
| `routes/Runners` | `RunnersList`, `RunnerView`, `Runner_*` (5), `resolveMcpToolAction`, `runMcpToolRunner` | `miroir-mcp/client` in `runMcpToolRunner` only (D2) |
| `routes/ModelDiagramPage` | `ModelDiagramReportSectionView` | `miroir-diagram-class` (D3) |
| `routes/LoginPage` | `auth/authTransport` → `services/ElectronIpcProxy` | Electron IPC (D5) |
| `routes/ai/AgentsCopilotKit` (`RootComponent`) | `AiActionsProvider`, `AiEntityProposalForm`, `AiLendProposalForm`, `miroirSystemPrompt`, a CSS file | `@copilotkit/*` (D2 `assistantPanel`) |

`PageDispatcher` has 10 `React.lazy` pages: Home, Settings, Search, TransformerBuilder, Check, Login, Runners, ModelDiagram, MiroirEvents, ErrorLogs. `RunnerView`'s Electron helper `electronRuntimeBaseUrl` now comes from `miroir-core`. `runMcpToolRunner` imports only `callMcpToolViaHttp` from `miroir-mcp/client`; that subpath pulls `@modelcontextprotocol/sdk`, so `miroir-react` must not depend on it.

### 4.4 Host-specific code in the moved closure

| Code | Where | Host |
|---|---|---|
| `ElectronRestClient` (`/auth/status`, `/auth/login` over IPC) | `auth/authTransport.ts` → `services/ElectronIpcProxy.ts` | Electron |
| `AgentsCopilotKit` (CopilotKit runtime, `MIROIR_IS_SANDBOX` check) | `RootComponent.tsx` line 86 (lazy), line 930 (mounted) | standalone app with an AI backend |
| `callMcpToolViaHttp` | `components/Runners/runMcpToolRunner.ts` | a server with the `mcp` capability |
| `loadTimingMark` | `services/ConfigurationService.ts` line 350 | the app's recorder (D6) |
| `appReportSectionRenderers` (graph, model diagram, stored runner, MiroirTest) | `reportSectionRenderers.tsx`, provided in `index.tsx` | the app (already a registry, #610) |

### 4.5 The sandbox and its broken build

`miroir-sandbox` aliases `@miroir-app` to `../miroir-standalone-app/src` (`vite.config.js` line 33, `tsconfig.json` `paths`). It has four imports through the alias: `RootComponent` and `ErrorPage` in `src/index.tsx`, `PageDispatcher` in `src/PageDispatcher.tsx`, and `usePageConfiguration` in `DemoInitializer.tsx`.

**`npm run build -w miroir-sandbox` fails on `_integration`**: `UNLOADABLE_DEPENDENCY … 4_view/ErrorPage.js`. #592 moved `ErrorPage` to `miroir-react` and left the sandbox import. With `import { ErrorPage } from "miroir-react"` the build passes. No PR check or nonreg step builds the sandbox; only `.github/workflows/build-sandbox-for-github-pages.yml` does (`npm run build:static -w miroir-sandbox`), on pushes to `main`, so the break shows only after a release merge. The sandbox provides no `ReportSectionRenderersContext`, so its graph, model diagram, stored runner and MiroirTest sections render `UnsupportedReportSection` today.

`miroir-react/src` has no `PageDispatcher.tsx`, `routes/`, `services/` or `pages/`. It already has `components/Page/` and `components/Runners/`, with none of the moved file names. There is no collision.

### 4.6 Tests, mocks and guards that name the moved modules

- **Relative imports of moved modules** from `tests/`: `components/Page/AppBar` 7 files, `routes/` 13 (of which `ReportPage` 4: `ReportPage.integ`, `multistepBranch.284.integ`, `multistepLaunch.274.phase5.integ`, `multistepProcess.274.integ`), `components/Runners/` 3, `PageDispatcher` 2, `RootComponent` 1, `services/ConfigurationService` 1, `routes/ai/*` 3. They become `from "miroir-react"` (D7), apart from `ReportPage`.
- **Path mocks of `ModelDiagramReportSectionView`:** 9 integration tests mock `../../src/miroir-fwk/4_view/components/Reports/ModelDiagramReportSectionView.js`, because happy-dom cannot load `miroir-diagram-class` (it pulls `svg-toolbelt`). After D3 the app's registry imports `"miroir-diagram-class"`, and the same tests mock that entry.
- **`vi.mock("miroir-react", …{ ...actual, JsonDisplayHelper: () => null })`** in 9 test files (`externalServiceReport`, `spotifyApp`, `githubApp`, `virtualAttributes`, `listDisplayByTransformer` and its `loopSafety` variant, `apiCallReport.281` phases 1, 2 and 4) and in `tests/helpers/miroirTestListIntegrationLaunchMocks`. The mock replaces only the entry's export, so it reaches app modules that import `JsonDisplayHelper` from `"miroir-react"` (`RootComponent`, `HomePage`, `ReportPage`, `ModelDiagramPage`, `RunnerView`, `Runner_InstallApplication`, `AiActionsProvider`) and not modules inside the package. After the move it reaches only `ReportPage` and `AiActionsProvider`. Whether the tests depend on it is unknown; the plan measures it first.
- **Source-text guards:** 18 test files read a moved source with `readFileSync` (for example `processCapabilities*.273.*`, `cursorSdk.275.*`, `mcpToolRunner.253.phase0`, `authentication.71.phase6`, `secrets.270.phase0` in `miroir-core`). Their paths follow the move, with the same assertions. `mcpToolRunner.253.phase0` already fails on `_integration`: it expects `resolveMcpToolAction.ts` to import `miroir-mcp/client`, which #627 removed.
- **`4-tests`** imports `PageDispatcher`, `services/usePageConfiguration`, `services/ConfigurationService`, `components/SequenceEditor/SequenceEditor`, `components/Runners/runMcpToolRunner`, `constants.ts` and `reportSectionRenderers.tsx`, all statically, plus `pages/SelfTestPage` (which stays). The moved ones become `from "miroir-react"`.
- **Lint suppressions** for moved files: `ErrorLogsPageDEFUNCT`, `InstanceEditorOutline`, `RootComponent`, `RunnerView`, `ModelDiagramPage`, `ConfigurationService` (6 of the 11 `4_view` entries; `authTransport` follows D5).
- **Docs** citing the paths: `docs/internals/application-startup.md`, `docs/internals/code-splitting.md`, `docs/internals/report-display.md`.
- **Electron:** there is no separate renderer build; the Electron app loads the web build. The relevant checks are the self-test workflow (`self-test.yml`) and the IPC login (D5).

---

## 5. Classification

### 5.1 Moves to miroir-react (D1-a)

| Group | Modules | Count |
|---|---|---|
| Shell | `PageDispatcher`, `components/Page/RootComponent`, `components/Page/AppBar`, `components/EventTimelineContainer`, `components/InstanceEditorOutline`, `ErrorLogsPageDEFUNCT` | 6 |
| Pages | `routes/HomePage`, `SettingsPage`, `SearchPage` (D4), `TransformerBuilderPage` (D4), `Check`, `LoginPage` (D5), `Runners`, `ModelDiagramPage` (D3), `pages/MiroirEventsPage` | 9 |
| Runners | `RunnerView` (D2 `runMcpTool`, D8), `RunnersList`, `Runner_CreateApplication`, `Runner_CreateEntity`, `Runner_DropApplication`, `Runner_DropEntity`, `Runner_InstallApplication`, `resolveMcpToolAction`, `SequenceEditor` | 9 |
| Services | `services/ConfigurationService`, `services/usePageConfiguration`, `services/index` | 3 |
| AI pick helpers | `routes/ai/miroirAiBackend`, `routes/ai/agentBackendPick` | 2 |
| New | `contexts/MiroirShellHostContext.tsx` (D2), `auth/` browser login (D5), `loadTimings/loadTimingMarkSink.ts` (D6) | 3 |

That is 29 existing modules and 3 new ones. `4_view/constants.ts` stays; the moved modules use `viewConstants.ts`.

### 5.2 Moves to miroir-diagram-class (D3-d)

`components/Reports/ModelDiagramReportSectionView` (1), exported from the package entry.

### 5.3 Stays in the app, with the reason

| Modules | Count | Reason |
|---|---|---|
| The 15 MiroirTest displays (#13 group C) and `pages/SelfTestPage` | 16 | they import the MiroirTest runtime (`4-tests`) |
| `routes/ReportPage` | 1 | not routed; test harness of 4 tests (D1) |
| `components/Graph/GraphComponent`, `GraphReportSectionView` | 2 | d3, registered renderers (#13 Q3-a) |
| `routes/ai/AgentsCopilotKit`, `AiActionsProvider`, `AiEntityProposalForm`, `AiLendProposalForm`, `miroirSystemPrompt` | 5 | `@copilotkit/*`; reach the shell as `assistantPanel` (D2) |
| `components/Runners/runMcpToolRunner` | 1 | `miroir-mcp/client`; reaches the runners as `runMcpTool` (D2) |
| `auth/authTransport`, `services/ElectronIpcProxy` | 2 | Electron IPC; reach the login page as `requestLoginToken` (D5) |
| `reportSectionRenderers.tsx`, `constants.ts` | 2 | the app's registry and constants |

Total: 29 (§5.1) + 1 (§5.2) + 29 (this table) = the 59 modules of `4_view`, checked against the file list. `src/loadTimings/` (6 files) also stays (D6).

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| A moved page, `miroir-mcp/client` or CopilotKit lands in the eager chunks | D7 lazy imports inside `miroir-react`; D2 `import()` wrappers in the app; `check_bundle_policy.py` and the bundle report per slice |
| A test imports `miroir-react/src` and gets a second copy of the contexts | D7: tests import from the entry; the export list is checked by a test |
| `4-tests` renders `PageDispatcher` without the host context, so self-test or runner tests lose the MCP runner | the MiroirTest providers fill `MiroirShellHostContext` as they fill `ReportSectionRenderersContext` (#610) |
| The `JsonDisplayHelper` mock stops reaching moved modules and a test slows down or loops | measured in the first slice, before any move (§4.6) |
| The sandbox breaks again unnoticed | the sandbox build joins the PR checks or nonreg (plan's first slice) |
| Load timings lose the `configurationsLoaded` mark | D6 sink registered before `fetchMiroirAndAppConfigurations`; the load-timing contract test covers it |
| Source-text guards (18 files) assert on old paths | updated in the slice that moves each file, with the same assertions; `mcpToolRunner.253.phase0` fixed first |

---

Implementation plan: [`tdd-implementation-plan.md`](tdd-implementation-plan.md).
