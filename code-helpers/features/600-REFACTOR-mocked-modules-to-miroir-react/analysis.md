# 600 — Move the view modules that tests mock or that use the app's report URL keys to miroir-react

> Second slice of #13, after [#592](../592-REFACTOR-move-components-to-miroir-react/analysis.md). It unblocks two groups #592 left in the app (modules that tests drive through a mocked miroir-react hook, modules that use the report URL keys of the app's `src/constants.ts`) and moves them with what depended on them.

Related issue: https://github.com/miroir-framework/miroir/issues/600
Parent issue: https://github.com/miroir-framework/miroir/issues/13 · Previous slice: #592 ✅ (PR #599)
Related analyses: [`../592-REFACTOR-move-components-to-miroir-react/analysis.md`](../592-REFACTOR-move-components-to-miroir-react/analysis.md) (classification, D1 to D7, which this slice keeps)
Key sources: [`packages/miroir-react/src/contexts/MiroirContextReactProvider.tsx`](../../../packages/miroir-react/src/contexts/MiroirContextReactProvider.tsx), [`packages/miroir-react/src/reportUrlParams.ts`](../../../packages/miroir-react/src/reportUrlParams.ts)

**Status:** implemented in the PR for #600.

---

## 1. Goals

The goals of #592 (G1 reuse the view layer, G2 same app, G3 same logs) still hold. This slice adds:

- **G4 — Tests that survive a move.** In order to move a module without rewriting its tests as a developer, I can give a component test the context values it needs without mocking miroir-react.

## 2. Non-goals

- The editor core cycle (`MlElementEditor` and its siblings, `BlockEditorView`, lazy CodeMirror) and the progressive render modules it uses (§4.3). Next slice.
- The reports cycle with routes and `4-tests/componentTests`.
- Grids, graph, diff, MCP and Electron users (heavy or host-specific dependencies).

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D8 How tests provide the miroir-react contexts | **`MiroirContextReactTestProvider`** exported by miroir-react, plus `MiroirThemeContext.Provider` and `updatePerformanceConfig` | G4 |
| D9 Where the report URL keys go | **`miroir-react/src/reportUrlParams.ts`**, removed from the app's `src/constants.ts` | G1 |
| D10 Progressive render modules | **Stay with the editor core** | G2 |
| D11 Unused files met on the way | **Stay where they are** (`useStyles.ts`, `components/test-icon-extraction.ts`) | — |

### D8 — Test provider

**Status:** Accepted — D8-a. **Serves:** G4.

`vi.mock("miroir-react", …)` replaces the app's imports from the package. A module inside miroir-react imports `useMiroirContextService` from `./contexts/MiroirContextReactProvider.js`, which the mock does not reach. #592 kept every module that a test drove through such a mock in the app.

| Option | Pros | Cons |
|---|---|---|
| **D8-a. `MiroirContextReactTestProvider({ value: Partial<MiroirReactContext> })`** ★ | every hook of the context (`useMiroirContextService`, `useSnackbar`, `useDomainControllerService`, `useMiroirContextInnerFormOutput`, …) reads the given value; no mock; same in the app and in miroir-react | a test-only component in the package's public exports |
| D8-b. Export the raw React context object | no new component | exposes an internal; the value needs a cast at every use |
| D8-c. Mock the dist files of miroir-react by path | no source change | the paths are esbuild chunk names (`chunk-XXXX.js`), which change with every build |

The theme needs no new API: `MiroirThemeContext` is already exported, and tests pass their partial theme to `MiroirThemeContext.Provider`. The performance config has `updatePerformanceConfig` and `resetPerformanceConfig`.

Converted tests (render wrapper `TestContext`, a local `render` that applies it): `useRenderInsight.unit`, `RenderInsightHeader.unit`, `RenderInsightSummary.unit`, `renderInsightFootprint.acceptance`, `LocalCacheMonitorSummary.unit`, `localCacheMonitorFootprint.acceptance`, `GraphReportSectionView.renderInsight.unit`, `GraphReportSectionView.test`, `ListTransformerPanel.unit`, `RunAllMiroirTestsButton.unit`. Mocks that replace a whole component used by a module that stays in the app (`ActionButtonWithSnackbar`, `UnitTestExecutionSummary`, `JsonDisplayHelper`, `ThemedOnScreenHelper`) stay as partial mocks of `"miroir-react"`: the app's import goes through the package, so the mock reaches it.

### D9 — Report URL keys

`ReportUrlKnownParamKeys`, `ReportUrlParamKeys` and `REPORT_URL_KNOWN_PARAM_KEYS` describe the URL of a report page. `ReportHooks`, `MultistepReportHost` and `OpenReportLaunch` need them, and so do the app's routes (`ReportPage`, `ReportDisplay`, `HomePage`, `SearchPage`) and `PageDispatcher`. They move to `miroir-react/src/reportUrlParams.ts`; every importer, in the app and in its tests, imports them from `"miroir-react"`. Rejected: a re-export from the app's `src/constants.ts` (D4 of #592: no re-export left behind).

### D10 — Progressive render modules

`progressiveRenderConfig.isVitestTestMode()` reads `import.meta.env.VITE_TEST_MODE`, which only Vite defines, and `componentTestMode.286.phase4` replaces it with `vi.doMock` by path. Its only users are `useViewportReveal`, `ComponentTestModeContext` and the editor core (`MlElementEditor`, `MlObjectEditor`, `MlArrayEditor`), which cannot move yet. They move together with the editor core, where the Vite dependency and the mock have to be dealt with anyway.

---

## 4. Current state after this slice

### 4.1 Moved (29 modules)

| Batch | Modules |
|---|---|
| C (9) | `tools/useRenderInsight`, `tools/useTrackedRender`, `tools/renderCountTracker`, `components/RenderInsightHeader`, `components/RenderInsightSummary`, `components/LocalCacheMonitorSummary`, `components/Page/ActionButtonWithSnackbar`, `components/Reports/OpenApiEndpointSyncButton`, `components/Reports/UnitTestExecutionSummary` |
| D (20) | `ReduxHooks`, `ModelEnvironmentSync`, `components/ValueObjectEditor/MlElementEditorHooks`, `MlEditorButton`, `components/EntityInstanceLink`, `components/useAdminViewParams`, `components/JsonObjectDeleteFormDialog`, `components/Reports/ReportHooks`, `MultistepReportHost`, `OpenReportLaunch`, `ReportSectionMarkdown`, `TransformerTestResults`, `testSelectionUtils`, `components/Buttons/testResultReport`, `components/Page/SidebarSection`, `auth/UserAccountMenu`, `auth/useDesignerToolsVisibility`, `components/BlockEditor/BlockEditorDisplay`, `components/TransformerEditor/TransformerTypesDisplay`, `tools/hookPerformanceMeasure` |

Loggers renamed (D3 of #592): `4_miroir-react_ReduxHooks`, `4_miroir-react_MlElementEditorHooks`; `config/logging/scope-ui.json` and `logConfigPresets.unit` follow.

### 4.2 Bundle

| Build | Eager chunks | Eager gzip | Guard |
|---|---|---|---|
| `aba` before #599 | 59 | 831 793 | 0 violations |
| `aba` after #599 | 65 | 835 795 | 0 violations |
| this slice | 66 | 836 073 | 0 violations |

### 4.3 What stays in `4_view`, and why

96 modules remain outside `routes/`, `pages/` and `services/`.

| Reason | Modules |
|---|---|
| Editor core cycle and its lazy parts | `MlElementEditor`, `MlObjectEditor`, `MlArrayEditor`, `MlLiteralEditor`, `MlEnumEditor`, `MlAnyEditor`, `MlElementStringEditor`, `MlElementEditorInterface`, `MlElementEditorReactCodeMirror`, `TypedValueObjectEditor*`, `TransformerTypeAnnotation`, `ReportSectionEntityInstance`, `BlockEditorView`, `BlockViewSwitch`, BlockEditor modules using `@dnd-kit/core`, and their importers (`ReportTools`, `ReportInputSection`, `InlineReportEditor`, `ListTransformerPanel`, TransformerEditor panels, `InnerRunnerView`, `ApplicationSelector`, `Sidebar`) |
| Progressive render (D10) | `progressiveRenderConfig`, `useViewportReveal`, `ComponentTestModeContext` |
| Reports and test infrastructure cycle | `ReportSectionListDisplay`, `ReportViewWithEditor`, `ReportSectionViewWithEditor`, `MiroirTest*Display`, `TestResultsGrid`, `TestExecutionPanel`, `ComponentTest*`, `UiIntegrationTestRun*`, `RunAllMiroirTestsButton`, `RunMiroirTestSuiteButton`, `ReportSectionMiroirTest` |
| Heavy or host-specific libraries | ag-grid (grids, cell renderers, `SelectEntityInstanceEditor`, `getColumnDefinitionsFromEntityAttributes`, `EntityEditor`, `SimpleEditor`), glide-data-grid, `diff` (`SideBySideDiff`, test result cells), d3 (`GraphComponent`, `GraphReportSectionView`), `miroir-diagram-class`, `xlsx`, `miroir-mcp`, Electron (`RunnerView`, the Runners, `SequenceEditor`, `auth/authTransport`), `miroir-example-library` (`EndpointActionCaller`, `LibraryRunner_LendDocument`) |
| App shell | `PageDispatcher`, `AppBar`, `RootComponent`, `Importer` (import `services/`), lazy targets `InstanceEditorOutline`, `EventTimelineContainer`, `ErrorLogsPageDEFUNCT` |
| Unused (D11) | `useStyles.ts`, `components/test-icon-extraction.ts`, `CellRenderers.tsx`, `TableActionButtons_new.tsx` |

### 4.4 Next slices

1. Editor core: make `isVitestTestMode` independent of `import.meta.env` (or inject it), give `componentTestMode.286.phase4` a context instead of `vi.doMock`, load `@dnd-kit/core` and CodeMirror lazily from miroir-react, then move the cycle and its importers.
2. Reports cycle: separate `4-tests/componentTests` from the report components it imports.
