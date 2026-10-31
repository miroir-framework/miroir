# 633 — Move the app shell and routes of miroir-standalone-app to miroir-react

> Which of the 59 modules left in `miroir-standalone-app/src/miroir-fwk/4_view` move to `miroir-react` so that `miroir-sandbox` builds from library packages only; how the host-specific parts (Electron login, the CopilotKit assistant, MCP tool calls, extra pages) reach the moved shell; and what stays in the app, with the reason.

Related issue: https://github.com/miroir-framework/miroir/issues/633
Parent: epic #621, item I2 of [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md) (analysis item W2, [`../621-FEATURE-npm-packages/analysis.md`](../621-FEATURE-npm-packages/analysis.md) §4.4)
Prior analyses: [`../13-REFACTOR-gui-components-to-miroir-react/analysis.md`](../13-REFACTOR-gui-components-to-miroir-react/analysis.md) (Q1-a to Q5-a, end state §8), [`../592-REFACTOR-move-components-to-miroir-react/analysis.md`](../592-REFACTOR-move-components-to-miroir-react/analysis.md) (D1 to D7), [`../604-REFACTOR-editor-core-to-miroir-react/`](../604-REFACTOR-editor-core-to-miroir-react/)
Survey script: [`survey_shell_modules.py`](survey_shell_modules.py) (`python code-helpers/features/633-REFACTOR-app-shell-to-react/survey_shell_modules.py [--json]`)
Key sources: [`PageDispatcher.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/PageDispatcher.tsx), [`RootComponent.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/RootComponent.tsx), [`reportSectionRenderers.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/reportSectionRenderers.tsx), [`ReportSectionRenderersContext.tsx`](../../../packages/miroir-react/src/contexts/ReportSectionRenderersContext.tsx), [`miroir-sandbox/vite.config.js`](../../../packages/miroir-sandbox/vite.config.js)

**Document role:** analysis and decision record. **It revises #13 Q1-a.** #13 kept the shell, routes and services in the app as "the app's composition". Epic #621 needs them in `miroir-react`, which becomes `@miroir-framework/react`, so that a client can be built without the app's sources (§3, D1).

**Status:** decisions D1 to D7 are on their recommended options (★), pending the user's confirmation.

---

## 1. Goals

- **G1 — A client from libraries.** In order to start a Miroir client without copying `miroir-standalone-app` as an application developer, I can build the sandbox from `miroir-react` and the store packages alone, with no alias into the app's sources.
- **G2 — Same app.** In order to keep working as before as a standalone or Electron user, I get the same pages, the same login, the same assistant and the same lazy loading. The bundle guard (`scripts/check_bundle_policy.py`) passes.
- **G3 — Same sandbox.** In order to explore Miroir in the browser as a sandbox visitor, I keep the pages the sandbox shows today: home, report, settings, search, transformer builder, runners, events, check and model diagram.
- **G4 — Pluggable host features.** In order to ship host-specific features as an application maintainer, I can give the shell my login transport, my assistant panel, my MCP tool call and my own pages, without `miroir-react` importing Electron, CopilotKit, `miroir-mcp` or the MiroirTest runtime.
- **G5 — Tests that survive the move.** In order to trust the move as a developer, the existing UI, unit and source-text tests run against the moved modules, with no mock by path (#13 G4).

## 2. Non-goals

- Moving the MiroirTest runtime (`miroir-fwk/4-tests`, 59 modules) or its 15 displays (#13 group C). They stay in the app, as #13 Q1-a decided, and keep reaching the shell through its exports.
- Moving the d3 graph renderers (`GraphComponent`, `GraphReportSectionView`). They stay registered renderers (#13 Q3-a).
- One startup call for the sandbox and the app (epic I4). `miroir-sandbox/src/index.tsx` keeps its setup code.
- Renaming packages (epic I6) and deciding whether `miroir-diagram-class` is published (epic I6, see D3).
- A consumer-owned React shell (epic D5): the shell moves, but the standalone app remains the only real client.

---

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1 What moves | **Shell, generic routes and pages, client services, runners** (§5.1); the MiroirTest runtime and displays, the graph renderers, the CopilotKit modules and Electron IPC stay | G1, G2, G3 |
| D2 Host features | **One `MiroirShellHostContext`** with optional slots: `pages`, `assistantPanel`, `requestLoginToken`, `runMcpTool` | G4, G5 |
| D3 Model diagram | **`ModelDiagramPage` and `ModelDiagramReportSectionView` move to `miroir-diagram-class`**; the app and the sandbox register them | G3, G4 |
| D4 Library defaults | **Search and transformer builder pages default to the current application**, falling back to Miroir | G1 |
| D5 Login | **HTTP login in `miroir-react`, Electron login injected** through `requestLoginToken` | G2, G4 |
| D6 Load timings | **The client part of `src/loadTimings/` moves with `ConfigurationService`** | G1, G2 |
| D7 Layout, exports, loggers | **#592 D3 to D5**: same relative paths, `git mv`, loggers named after `miroir-react`; pages stay lazy, and `index.ts` exports no page component (D7) | G2, G5 |

### D1 — What moves

**Status:** proposed D1-a. **Serves:** G1, G2, G3.

The sandbox imports four modules through `@miroir-app` (§4.3). Their static closure is 14 modules (§4.2). `PageDispatcher` adds 13 lazy pages, and those pages pull in the runners, the model diagram and the CopilotKit modules.

| Option | What moves | Pros | Cons |
|---|---|---|---|
| **D1-a. Shell, generic pages, services, runners** ★ | §5.1: 29 `4_view` modules and the 6 files of `src/loadTimings/` | the sandbox keeps every page (G3); `@miroir-framework/react` gets a working client | needs host slots (D2) for what the app adds |
| D1-b. Only the static closure (14 modules) | `RootComponent`, `AppBar`, `PageDispatcher`, services, `loadTimings` | smallest move | every page becomes a host page; the sandbox cannot provide them (no alias), so it loses all of them (G3 fails) |
| D1-c. Everything but `index.tsx` | D1-a plus `4-tests` and its displays | nothing left to decide | puts `@testing-library/*`, `vitest` imports and the example and fixture applications into a published package (#13 non-goal) |

### D2 — How host features reach the shell

**Status:** proposed D2-a. **Serves:** G4, G5.

Four things in the moved code are host-specific (§4.4): the Electron branch of the login, the CopilotKit panel that `RootComponent` mounts, `runMcpToolRunner` (`miroir-mcp/client`), and pages that need code outside `miroir-react` (the MiroirTest self-test, which stays in the app). #13 Q3-a solved the same problem for report sections with `ReportSectionRenderersContext`, which the app fills in `index.tsx` and in its MiroirTest component test providers.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. One host context** ★ | `MiroirShellHostContext` in `miroir-react/src/contexts/`. All slots are optional: `pages?: Record<string, LazyExoticComponent>` for extra `?page=` targets, `assistantPanel?: LazyExoticComponent`, `requestLoginToken?: (username, password) => Promise<string \| undefined>`, `runMcpTool?: (runner, args, serverUrl, capabilities) => Promise<McpToolRunnerEnvelope>`. Defaults: no extra page (unknown pages go home, as today), no assistant, HTTP login (D5), and an MCP runner that answers `FeatureUnavailable` | one provider beside `ReportSectionRenderersContext`; the MiroirTest providers fill it the same way; each slot defaults to the sandbox's behaviour | one more context |
| D2-b. Props on `RootComponent` and `PageDispatcher` | the host passes them in its route elements | explicit | `LoginPage` and `RunnerView` sit several components below, so the props would be drilled through moved code |
| D2-c. One context per slot | four providers | each one is small | four providers in `index.tsx`, the sandbox and every test rig |

Extra pages take precedence over built-in ones only for names the shell does not know. A host can add pages but cannot replace `home`, `report` or `login`, so the auth gate in `PageContent` cannot be bypassed.

### D3 — Model diagram

**Status:** proposed D3-a. **Serves:** G3, G4.

`ModelDiagramPage` renders `ModelDiagramReportSectionView`, which imports `miroir-diagram-class`. `miroir-diagram-class` depends on `miroir-react`, so `miroir-react` cannot import it (#13 group D).

| Option | Pros | Cons |
|---|---|---|
| **D3-a. Move both modules to `miroir-diagram-class`** ★ | they live beside the code they render; the app and the sandbox register the page (`pages.model`) and the section renderer (`modelDiagramReportSection`) from there; the sandbox keeps its model page (G3) | `miroir-diagram-class` is not in the epic's published set, so a consumer of `@miroir-framework/react` gets no model page until I6 decides to publish it |
| D3-b. Keep them in the app as a host page | no change to `miroir-diagram-class` | the sandbox loses the model page (G3 fails) |
| D3-c. `miroir-react` imports `miroir-diagram-class` lazily | | package cycle (#13 Q3-b, rejected) |

### D4 — Library defaults in the search and transformer builder pages

**Status:** proposed D4-a. **Serves:** G1. `routes/SearchPage.tsx` uses `deployment_Library_DO_NO_USE`, `selfApplicationLibrary` and `entityBook` as its default selection. `routes/TransformerBuilderPage.tsx` picks `entityBook` when the editor application is the Library. `@miroir-framework/react` cannot depend on an example application (#627 removed the same dependency from MCP, the CLI and the assistant).

| Option | Pros | Cons |
|---|---|---|
| **D4-a. Current application, falling back to Miroir** ★ | the rule `TransformerBuilderPage` already uses for `editorApplication` (`toolsPageState.applicationSelector`, then `context.application`, then `selfApplicationMiroir`), with the deployment from `currentApplicationDeploymentMap`; initial entity: the application's first entity, or `Entity` for Miroir | **visible change**: the search page no longer opens on the Library's books when no application is selected |
| D4-b. A `defaultApplicationUuid` slot in the host context | the app keeps the Library default | an example application stays wired into the app's composition; one more slot for a default |

### D5 — Login transport

**Status:** proposed D5-a. **Serves:** G2, G4. `auth/authTransport.ts` has a browser branch (`fetch("/auth/login")`) and an Electron branch (`ElectronRestClient` from `services/ElectronIpcProxy.ts`). `LoginPage` calls `requestLoginToken`, and the app's `index.tsx` calls `fetchAuthenticationEnabled` at startup.

| Option | Pros | Cons |
|---|---|---|
| **D5-a. Browser branch in `miroir-react`, Electron through `requestLoginToken`** ★ | `LoginPage` moves; the browser and the sandbox need nothing; the app passes its current `requestLoginToken`; `authTransport.ts` and `ElectronIpcProxy.ts` stay in the app (only `index.tsx` and the slot use them) | the browser branch exists in both places until the app's copy delegates to it |
| D5-b. `LoginPage` stays in the app as a host page | no slot | a client built from `miroir-react` has no login page; `PageContent` redirects to `?page=login` when authentication is on |

### D6 — Load timings

**Status:** proposed D6-a. **Serves:** G1, G2. `services/ConfigurationService.ts` calls `loadTimingMark` from `src/loadTimings/loadTimingBrowser.ts` (#580). The six files of `src/loadTimings/` (808 lines) import only `miroir-core`, `uuid` and the app's `packageName`/`cleanLevel`.

| Option | Pros | Cons |
|---|---|---|
| **D6-a. Move `src/loadTimings/` to `miroir-react/src/loadTimings/`** ★ | the sandbox and other clients record the same timings; the app's `index.tsx` imports them from `miroir-react` | the module-level recorder becomes shared between the app and the package (one copy, as today) |
| D6-b. A `mark` slot in the host context | nothing moves | a timing hook in a host context; the timings stop at the package boundary |

### D7 — Layout, exports, loggers

**Status:** proposed, applies #592 D3 to D5 and #13 D16/D17. **Serves:** G2, G5.

- **Paths.** `4_view/<path>` goes to `miroir-react/src/<path>` with `git mv`. There is no name collision (§4.5). `src/loadTimings/` goes to `miroir-react/src/loadTimings/`.
- **Loggers.** Moved modules import `packageName` from `miroir-react` (`"miroir-react"`) and `cleanLevel` from `viewConstants.ts`. No log preset names one of them (§4.6).
- **Lazy pages.** `PageDispatcher` keeps its `React.lazy(() => import("./routes/….js"))` imports, now relative inside `miroir-react`. With tsup `splitting` (#592 D1-a), each page stays a separate file and Vite keeps it out of the page's eager chunks.
- **Exports.** `index.ts` exports the shell (`RootComponent`, `PageDispatcher`, `AppBar`), the services (`usePageConfiguration`, `fetchMiroirAndAppConfigurations`, `useConfigurationService`), the host context, the AI backend pick helpers and the load-timing API. It exports no page component: the tests that import a page (`ReportPage`, 3 files) import it from its source path inside `miroir-react`, as #13 D20 does.

---

## 4. Current state (on `_integration`, bc535d166 + #632)

### 4.1 Survey method

`survey_shell_modules.py` reads every `.ts`/`.tsx` under `miroir-standalone-app/src` with comments stripped. It resolves relative imports and labels each edge static, dynamic (`import()`) or type-only. For each `4_view` module it reports the app modules it imports from outside `4_view` and the packages `miroir-react` does not declare. It also lists the strongly connected components (static, non-type edges) and the importers from `4-tests`, `src/`, the sandbox, Electron and the tests.

Result on `_integration`: **59 modules, 15,903 lines; no import cycle in `4_view`, and none across the whole app.** #610 (section renderer registry) and #612 (reports cycle and grids) removed the cycle that #592 §4.2 and #13 group A described. The I2 slice "break the reports / component-tests cycle" of the epic plan is already done.

### 4.2 What the sandbox's imports reach

Static closure of `RootComponent`, `PageDispatcher`, `services/index`, `services/usePageConfiguration`: 14 modules.

| Module | Lines | Notes |
|---|---|---|
| `components/Page/RootComponent.tsx` | 963 | lazy: `EventTimelineContainer`, `InstanceEditorOutline`, `routes/ai/AgentsCopilotKit` (mounted on the first AI AppBar open) |
| `components/Page/AppBar.tsx` | 872 | static: `routes/ai/miroirAiBackend`, `routes/ai/agentBackendPick` (no CopilotKit import) |
| `PageDispatcher.tsx` | 261 | 10 lazy pages (§4.3) |
| `services/ConfigurationService.ts`, `usePageConfiguration.ts`, `index.ts` | 550 | `loadTimingMark` |
| `routes/ai/miroirAiBackend.ts`, `agentBackendPick.ts` | 79 | localStorage pick and capability labels |
| `constants.ts` (4_view, `cleanLevel = "4"`) | 1 | |
| `src/constants.ts` | 78 | only `packageName` is used by `4_view` (28 imports) |
| `src/loadTimings/*` (5 of 6) | 737 | `miroir-core`, `uuid` |

### 4.3 Lazy targets and their blockers

| Target (importer) | Brings in | Blocker |
|---|---|---|
| `routes/HomePage`, `ErrorLogsPageDEFUNCT`, `components/EventTimelineContainer`, `components/InstanceEditorOutline` | nothing outside `4_view` | none |
| `routes/Check`, `routes/SettingsPage`, `pages/MiroirEventsPage` | services, `loadTimings` | none |
| `routes/SearchPage` | services | `miroir-example-library` (D4) |
| `routes/TransformerBuilderPage` | `SequenceEditor`, `RunnerView` chain | `miroir-example-library` (D4), `miroir-mcp` (D2 `runMcpTool`) |
| `routes/Runners` | `RunnersList`, `RunnerView`, `Runner_*` (5), `resolveMcpToolAction`, `runMcpToolRunner` | `miroir-mcp/client` in `runMcpToolRunner` only (D2) |
| `routes/ModelDiagramPage` | `ModelDiagramReportSectionView` | `miroir-diagram-class` (D3) |
| `routes/LoginPage` | `auth/authTransport` → `services/ElectronIpcProxy` | Electron IPC (D5) |
| `routes/ai/AgentsCopilotKit` (`RootComponent`) | `AiActionsProvider`, `AiEntityProposalForm`, `AiLendProposalForm`, `miroirSystemPrompt`, a CSS file | `@copilotkit/*` (D2 `assistantPanel`) |

`RunnerView`'s Electron helper `electronRuntimeBaseUrl` now comes from `miroir-core` (#592 §5.2 listed it as a blocker; it no longer is one). `runMcpToolRunner` imports only `callMcpToolViaHttp` from `miroir-mcp/client`. That subpath pulls `@modelcontextprotocol/sdk`, and the package declares `express` and `miroir-localcache-redux`, so `miroir-react` should not depend on it.

### 4.4 Host-specific code in the moved closure

| Code | Where | Host |
|---|---|---|
| `ElectronRestClient` (`/auth/status`, `/auth/login` over IPC) | `auth/authTransport.ts` → `services/ElectronIpcProxy.ts` | Electron |
| `AgentsCopilotKit` (CopilotKit runtime, `MIROIR_IS_SANDBOX` check) | `RootComponent.tsx` line 86 (lazy), line 930 (mounted) | standalone app with an AI backend |
| `callMcpToolViaHttp` | `components/Runners/runMcpToolRunner.ts` | a server with the `mcp` capability |
| `appReportSectionRenderers` (graph, model diagram, stored runner, MiroirTest) | `reportSectionRenderers.tsx`, provided in `index.tsx` | the app (already a registry, #610) |

### 4.5 The sandbox and its broken build

`miroir-sandbox` aliases `@miroir-app` to `../miroir-standalone-app/src` (`vite.config.js` line 33, `tsconfig.json` `paths`). It has four imports through the alias: `RootComponent` and `ErrorPage` in `src/index.tsx`, `PageDispatcher` in `src/PageDispatcher.tsx`, and `usePageConfiguration` in `DemoInitializer.tsx`.

**`npm run build -w miroir-sandbox` fails on `_integration`**: `UNLOADABLE_DEPENDENCY … 4_view/ErrorPage.js`. #592 moved `ErrorPage` to `miroir-react` and left the sandbox import, and no CI job or nonreg step builds the sandbox. With `import { ErrorPage } from "miroir-react"` the build passes. The sandbox provides no `ReportSectionRenderersContext`, so its graph, model diagram, stored runner and MiroirTest sections render `UnsupportedReportSection` today.

`miroir-react/src` has no `PageDispatcher.tsx`, `routes/`, `services/`, `pages/` or `loadTimings/`. It already has `components/Page/` and `components/Runners/`, but with none of the moved file names. There is no collision.

### 4.6 Tests and guards that name the moved modules

- Tests importing a moved module by relative path: `components/Page/AppBar` 7 files, `routes/` 13, `components/Runners/` 3, `PageDispatcher` 2, `RootComponent` 1, `services/ConfigurationService` 1, `routes/ai/*` 3. None mocks one of them by path (`vi.mock`/`vi.doMock`).
- 18 test files read moved sources as text (`readFileSync`), for example `processCapabilities*.273.*`, `cursorSdk.275.*`, `mcpToolRunner.253.phase0`, `authentication.71.phase6` and `secrets.270.phase0` (miroir-core). Their paths follow the move, with the same assertions.
- `4-tests` imports `PageDispatcher`, `services/usePageConfiguration`, `services/ConfigurationService`, `components/SequenceEditor/SequenceEditor`, `components/Runners/runMcpToolRunner`, `constants.ts` and `reportSectionRenderers.tsx`, all statically, plus `pages/SelfTestPage` (which stays). After the move these become `from "miroir-react"`, apart from `runMcpToolRunner`, which stays in the app (D2).
- Log presets name no moved module (`config/logging`: only `4_miroir-standalone-app_ReportTools`).
- Docs that cite the paths: `docs/internals/application-startup.md`, `docs/internals/code-splitting.md`, `docs/internals/report-display.md`.

---

## 5. Classification

### 5.1 Moves to miroir-react (D1-a)

| Group | Modules | Count |
|---|---|---|
| Shell | `PageDispatcher`, `components/Page/RootComponent`, `components/Page/AppBar`, `components/EventTimelineContainer`, `components/InstanceEditorOutline`, `ErrorLogsPageDEFUNCT` | 6 |
| Pages | `routes/HomePage`, `ReportPage`, `SettingsPage`, `SearchPage` (D4), `TransformerBuilderPage` (D4), `Check`, `LoginPage` (D5), `Runners`, `pages/MiroirEventsPage` | 9 |
| Runners | `RunnerView` (with `runMcpTool` from D2), `RunnersList`, `Runner_CreateApplication`, `Runner_CreateEntity`, `Runner_DropApplication`, `Runner_DropEntity`, `Runner_InstallApplication`, `resolveMcpToolAction`, `SequenceEditor` | 9 |
| Services | `services/ConfigurationService`, `services/usePageConfiguration`, `services/index` | 3 |
| AI pick helpers | `routes/ai/miroirAiBackend`, `routes/ai/agentBackendPick` | 2 |
| Auth (browser branch) | `auth/` browser `requestLoginToken` and `fetchAuthenticationEnabled` (D5) | new module |
| Load timings | `src/loadTimings/*` (D6) | 6 |
| New | `contexts/MiroirShellHostContext.tsx` (D2) | 1 |

That is 35 existing modules (29 from `4_view`, 6 from `src/loadTimings/`) and 2 new ones. `4_view/constants.ts` stays; the moved modules use `viewConstants.ts`.

### 5.2 Moves to miroir-diagram-class (D3-a)

`routes/ModelDiagramPage`, `components/Reports/ModelDiagramReportSectionView` (2).

### 5.3 Stays in the app, with the reason

| Modules | Count | Reason |
|---|---|---|
| The 15 MiroirTest displays (#13 group C) and `pages/SelfTestPage` | 16 | they import the MiroirTest runtime (`4-tests`) |
| `components/Graph/GraphComponent`, `GraphReportSectionView` | 2 | d3, registered renderers (#13 Q3-a) |
| `routes/ai/AgentsCopilotKit`, `AiActionsProvider`, `AiEntityProposalForm`, `AiLendProposalForm`, `miroirSystemPrompt` | 5 | `@copilotkit/*`; reach the shell as `assistantPanel` (D2) |
| `components/Runners/runMcpToolRunner` | 1 | `miroir-mcp/client`; reaches the runners as `runMcpTool` (D2) |
| `auth/authTransport`, `services/ElectronIpcProxy` | 2 | Electron IPC; reach the login page as `requestLoginToken` (D5) |
| `reportSectionRenderers.tsx`, `constants.ts` | 2 | the app's registry and constants |

Total: 29 (§5.1) + 2 (§5.2) + 28 (this table) = the 59 modules of `4_view`, checked against the file list. `authTransport.ts` stays even though its browser branch is copied to `miroir-react` (D5).

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| A moved page lands in the eager chunks | D7 lazy imports inside `miroir-react`; `check_bundle_policy.py` and the bundle report per slice |
| `4-tests` renders `PageDispatcher` without the host context, so self-test or runner tests lose the MCP runner or the extra pages | the MiroirTest providers fill `MiroirShellHostContext` as they fill `ReportSectionRenderersContext` (#610) |
| The sandbox breaks again unnoticed | a nonreg step (or CI job) builds the sandbox (plan slice) |
| Source-text guards (18 files) assert on old paths | updated in the slice that moves each file, with the same assertions |
| Electron renderer resolves `miroir-react` differently from the web build | the Electron bundle policy and `unit-345-electron` run in the slice that moves the shell |

---

Implementation plan: `tdd-implementation-plan.md` (to be written per the `miroir-analysis-to-tdd-plan` skill).
