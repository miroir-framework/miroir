# 592 — Move the movable React components of miroir-standalone-app to miroir-react

> Which modules of `miroir-standalone-app/src/miroir-fwk/4_view` can move to `miroir-react` without behaviour change, which ones cannot yet and why, and what miroir-react needs before it can host them (build shape, MUI version, logger names, test mocks).

Related issue: https://github.com/miroir-framework/miroir/issues/592
Parent issue: https://github.com/miroir-framework/miroir/issues/13 (move GUI components to miroir-react)
Related analyses: [`../326-BUILD-build-hardening/analysis.md`](../326-BUILD-build-hardening/analysis.md) (bundle guard), [`docs/internals/code-splitting.md`](../../../docs/internals/code-splitting.md) (#337, #370 lazy chunks)
Key sources: [`packages/miroir-react/tsup.config.js`](../../../packages/miroir-react/tsup.config.js), [`packages/miroir-react/src/index.ts`](../../../packages/miroir-react/src/index.ts), [`packages/miroir-standalone-app/bundle-policy.json`](../../../packages/miroir-standalone-app/bundle-policy.json)

**Status:** decisions D1 to D7 taken on the recommended answers of grilling round 1, pending the user's confirmation. Implemented in the PR for #592 (experiment, batch A, batch B).

---

## 1. Goals

- **G1 — Reuse the view layer.** In order to build another Miroir front end (sandbox, Electron, a third-party host) as an application developer, I can import the themed components, the editor support modules and the view hooks from `miroir-react` instead of copying them out of the app.
- **G2 — Same app.** In order to keep working as before as an app user, I get the same pages, the same lazy loading and the same initial download size.
- **G3 — Same logs.** In order to diagnose a problem as a developer, I can still select the moved modules' loggers in the log presets.

## 2. Non-goals

- Moving the modules listed in §5.2 (problematic). Follow-up slices of #13.
- Changing the layout of miroir-react into numbered layers (`0_interfaces/` … `4_views/`).
- Moving `miroir-diagram-class` to MUI 9.

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D1 Bundle shape of miroir-react | **One output module per source module** (tsup `entry: src/**/*`, `splitting`), package `"sideEffects": false` | G2 |
| D2 MUI version for miroir-react | **Type-check against 9.5.0** (devDependency), peer range `>=5.17.1 <10` | G1, G2 |
| D3 Logger names | **Follow the package**: `<cleanLevel>_miroir-react_<name>`; presets updated | G3 |
| D4 App imports of moved code | **`from "miroir-react"`**, no re-export file left at the old path | G1 |
| D5 Layout in miroir-react | **Same relative paths as under `4_view`**, moved with `git mv` | G1 |
| D6 Order | **Experiment, then batch A (foundation), then batch B (rest)** | G2 |
| D7 Development loop | **`npm run dev -w miroir-react`** (`tsup --watch`) | G1 |

### D1 — Bundle shape

**Status:** Accepted — D1-a. **Serves:** G2.

Rollup cannot split one module across chunks. Before #592 miroir-react was one minified file, `dist/index.js`, imported by eager code (contexts, theme), so all of it loaded with the page. Moving a component used only by a lazy route into that file would move it into the entry chunk.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. One module per source module** ★ | tsup entries `src/**/*.ts(x)`, esbuild `splitting`; `"sideEffects": false` lets Rollup drop modules the app does not use (their top-level `registerLoggerToStart` calls would keep them otherwise). Every package the moved code imports must be a dependency or peer of miroir-react, or tsup bundles a second copy of it (formik, uuid, zod, fast-deep-equal, rehype-sanitize, remark-gfm, miroir-app-admin were added) | Vite places each module in the chunk that uses it, as for the app's own modules | +4 kB gzip on the eager chunks (§4.3, +0.5 %, within the 2 % budget), from splitting the former single file; esbuild compiles each file alone, so a type re-exported without `type` (`export {GraphConfig} from 'miroir-core'`) becomes a value import that Rollup rejects |
| D1-b. Keep one file | none | no change | every moved component loads with the page; the bundle guard's eager budget (2 %) would fail after a few batches |
| D1-c. Vite alias to `miroir-react/src` | the app compiles the sources | fast edit loop | two build paths for one package; Electron and the sandbox build differently |

### D2 — MUI version

**Status:** Accepted — D2-a. **Serves:** G1, G2.

miroir-react declared `@mui/material` 5.17.1 (peer) and type-checked against the root copy, 5.17.1 (hoisted for `miroir-diagram-class` and `@copilotkit/react-textarea`). The app declares 9.5.0 and runs MUI 9: Vite's `resolve.dedupe` sends miroir-react's `@mui/material` import to the app's copy. A peer of exactly 9.5.0 does not install: npm resolves a workspace's peers at the root, where 5.17.1 is.

| Option | Pros | Cons |
|---|---|---|
| **D2-a. devDependency 9.5.0, peer `>=5.17.1 <10`** ★ | npm nests MUI 9.5.0 in `packages/miroir-react/node_modules`; tsc checks the moved code against the version that runs | the peer range is wide |
| D2-b. Keep 5.17.1 | no lockfile change | moved code type-checked against an API it does not run on |

D2-a surfaced 5 type errors in 3 moved modules, which the app's own tsc run already reported (the app has 32 MUI 9 type errors on `aba`, not part of the pre-push gate). They are props MUI 9 removed and ignored at runtime: `Typography` `display` and `fontWeight` (now `sx`), `ListItemText` `primaryTypographyProps`/`secondaryTypographyProps` (now `slotProps`), `Menu` `PaperProps` (now `slotProps.paper`). Fixed in `EventLogComponent`, `MiroirEventTimeline`, `MiroirThemeSelector`.

### D3 — Logger names

**Status:** Accepted — D3-a. **Serves:** G3. `MiroirLoggerFactory.getLoggerName` returns `${cleanLevel}_${packageName}_${name}`. Moved modules import `packageName` from miroir-react (`"miroir-react"`); `cleanLevel` keeps its value (`"4"` from the new `src/viewConstants.ts` for modules that used `4_view/constants.ts`, `"5"` for those that used the app's `src/constants.ts`). `config/logging/scope-ui.json` names four loggers; one of them moved (`scripts`) and now reads `4_miroir-react_scripts`. Rejected D3-b: keeping `"miroir-standalone-app"` in moved files would name a package the code is not in.

### D4 to D7

- **D4.** Imports of moved modules become `from "miroir-react"`. `contexts/MiroirThemeContext.tsx` (a 3-line `export * from "miroir-react"`) and the copies `Themes/MiroirTheme.ts`, `Themes/TableTheme.ts`, `Themes/ThemeColorDefaults.ts` (identical to miroir-react's apart from import lines) are deleted.
- **D5.** `4_view/<path>` moves to `miroir-react/src/<path>`, so relative imports between moved modules do not change. Exception: `4_view/constants.ts` stays (the app's modules use it); miroir-react gets `src/viewConstants.ts` with the same `cleanLevel`.
- **D6.** See §5.3.
- **D7.** A change to a moved module reaches the app after `npm run build -w miroir-react`; `npm run dev -w miroir-react` rebuilds on save.

---

## 4. Current state (on `aba`, c9d7a84d)

### 4.1 Survey method

A Python script parsed the imports of every `.ts`/`.tsx` under `miroir-standalone-app/src` (comments stripped), resolved relative imports to files, and followed each module's imports transitively. A module of `4_view` (routes, pages, services and `4-tests` excluded) can move when its transitive imports stay inside the moved set and use only packages miroir-react has or can add. 230 modules were examined; 148 passed the first pass. The move script (`git mv`, import rewriting, index exports) then found more blockers, listed in §5.2.

### 4.2 Import cycles

Two strongly connected components of the import graph contain modules that cannot move:

| Cycle | Size | Members (excerpt) | Why it blocks |
|---|---|---|---|
| Reports and test infrastructure | 21 | `PageDispatcher`, `routes/HomePage`, `routes/ReportDisplay`, `routes/SettingsPage`, `4-tests/componentTests/index.ts`, `runReportTest`, `ReportSectionListDisplay`, `ReportViewWithEditor`, `ReportSectionViewWithEditor`, `EntityInstanceGrid`, `ValueObjectGrid`, `LazyGrids`, `MiroirTestDisplay`, `TestResultsGrid`, `JsonObjectEditFormDialog` | contains routes and the component-test code, and lazy grids (ag-grid) |
| Editor core | 14 | `MlElementEditor`, `MlObjectEditor`, `MlArrayEditor`, `MlLiteralEditor`, `MlEnumEditor`, `MlAnyEditor`, `MlElementStringEditor`, `MlElementEditorReactCodeMirror` (lazy CodeMirror), `TypedValueObjectEditor`, `ReportSectionEntityInstance`, `TransformerTypeAnnotation`, `BlockEditorView`, `BlockViewSwitch` (lazy) | lazy imports and `@dnd-kit/core` (BlockDragDrop, imported by BlockEditorView) |

### 4.3 Bundle (web build, `bundle-report.json`, checked by `scripts/check_bundle_policy.py`)

| Build | Eager chunks | Eager gzip | miroir-react rendered bytes (eager) | Guard |
|---|---|---|---|---|
| `aba` | 59 | 831 793 | 44 984 (44 984) | 0 violations |
| experiment (D1 + CenteredSpinner) | 61 | 833 865 | 46 756 (46 756) | 0 violations |
| batch A | 65 | 835 924 | 164 275 (153 761) | 0 violations |
| batch B | 65 | 835 795 | 315 971 (204 839) | 0 violations |

The budget is `eagerGzipBaseline` 824 806 + 2 % = 841 302. The +2 kB of the experiment comes from splitting the former single file into modules; the moved code itself does not change chunk (miroir-react's lazy part, 10.5 kB after batch A, stays out of the page).

### 4.4 Tests that mock miroir-react

Twenty test files call `vi.mock("miroir-react", …)`. A mock of the package replaces what the app imports from `"miroir-react"`; it does not reach a module inside miroir-react that imports a sibling module by relative path. So a module can move only if no test drives it through a mocked sibling. Found cases:

- `useRenderInsight`, `useTrackedRender` (and `renderCountTracker`, which re-exports `useRenderInsight`) call `useMiroirContextService`, which `useRenderInsight.unit`, `renderInsightFootprint.acceptance`, `RenderInsightHeader.unit`, `RenderInsightSummary.unit`, `GraphReportSectionView*`, `ListTransformerPanel.unit` mock.
- `RenderInsightHeader`, `RenderInsightSummary`, `LocalCacheMonitorSummary` are rendered by tests that mock `useMiroirContextService` and `useMiroirTheme`.
- `progressiveRenderConfig.isVitestTestMode` is replaced with `vi.doMock` by `componentTestMode.286.phase4`; `useViewportReveal` and `ComponentTestModeContext` read it.
- `ReduxHooks.useCurrentModelEnvironment` calls `useMiroirContextService`, which `ListTransformerPanel.unit` mocks while rendering `ReportSectionListDisplay`.
- `ActionButtonWithSnackbar` (`RunAllMiroirTestsButton.unit`) and `UnitTestExecutionSummary` (`miroirTestListIntegrationLaunchMocks`) are mocked by path.

Tests whose mocks only had to follow the move were changed to partial mocks (`importOriginal` spread): `RenderInsightHeader.unit`, `RenderInsightSummary.unit`, `renderInsightFootprint.acceptance`, `LocalCacheMonitorSummary.unit`, `localCacheMonitorFootprint.acceptance`, `useRenderInsight.unit`.

---

## 5. Classification

### 5.1 Moved (111 modules, plus 4 deleted copies)

| Step | Modules |
|---|---|
| Experiment | `components/CenteredSpinner.tsx` |
| Batch A (35) | `components/Themes/*` (17, plus the `index.ts` barrel, not re-exported from the package index), `components/DraggableContainer.tsx`, `tools/` render-insight, local cache monitor, performance and `PortalContainerContext`, `emptyObject`, `progressiveRevealScheduler` modules, `utils/foreignKeyAttributeAnalyzer.ts` |
| Batch B (75) | `scripts.ts`, `navigation.ts`, `adaptiveColumnWidths.ts`, `ErrorPage.tsx`, `auth/authSession.ts`, `auth/useApplicationAccess.ts`, Reports contexts and hooks (`ReportPageContext`, `ReportFormSubmitContext`, `FormikValueObjectContext`, `useReportQueryLoadService`, `useEnsureReportQueryLoaded`, `FoldedStateTree*`, …), ValueObjectEditor support (`ValueHistory*`, `FieldValidation*`, `BlobEditorField`, `TransformerNodeActions`, …), Grids interfaces, toolbar and action buttons, Page helpers (`PageContainer`, `GlobalFeedbackGlow`, `appBarReportNavigation`, …), BlockEditor leaves, Runners interfaces, `EventLogComponent`, `MiroirEventTimeline`, `MiroirThemeSelector`, `JsonObjectDeleteFormDialog`, `PerformanceDisplayContainer` |

Exact lists: `git log --name-status` of the #592 commits.

### 5.2 Not moved, with the reason

| Reason | Modules |
|---|---|
| Cycle with routes and test infrastructure (§4.2) | the 21 of the first cycle, and everything importing them (Report sections, Runners views, TransformerEditor, `EndpointActionCaller`, `AppBar`, `Sidebar`, `RootComponent`) |
| Editor core cycle with lazy parts (§4.2) | the 14 of the second cycle, `BlockDragDrop` (`@dnd-kit/core`), `BlockPalette`, `BlockInsertTargets`, `BlockRunnerHat`, `BlockDefineHeader`, `SequenceEditor` |
| Lazy target in the app | `ErrorLogsPageDEFUNCT`, `EventTimelineContainer`, `InstanceEditorOutline` (dynamic `import()` from `PageDispatcher`, `RootComponent`) |
| Heavy library kept lazy | ag-grid cell renderers and editors, `SelectEntityInstanceEditor`, glide-data-grid component, `SideBySideDiff` (`diff`), `GraphComponent` (d3) |
| Other packages or host | `runMcpToolRunner`, `resolveMcpToolAction` (`miroir-mcp`), `RunnerView` (Electron URL helpers), `UiIntegrationTestRunControls`, `RunMiroirTestSuiteButton`, `RunAllMiroirTestsButton` (import `4-tests`) |
| Mocked collaborators (§4.4) | `ReduxHooks` and the modules that import it (`ModelEnvironmentSync`, `MlElementEditorHooks`, `MlEditorButton`, `EntityInstanceLink`, `useAdminViewParams`, `JsonObjectDeleteFormDialog`, `BlockEditorDisplay`, `TransformerTypesDisplay`, `hookPerformanceMeasure`), `useRenderInsight`, `useTrackedRender`, `renderCountTracker`, `RenderInsightHeader`, `RenderInsightSummary`, `LocalCacheMonitorSummary`, `progressiveRenderConfig`, `useViewportReveal`, `ComponentTestModeContext`, `ActionButtonWithSnackbar`, `UnitTestExecutionSummary`, `OpenApiEndpointSyncButton` |
| App constants | `ReportHooks`, `MultistepReportHost`, `OpenReportLaunch` (import the report URL keys of the app's `src/constants.ts`), `ReportSectionMarkdown` (`renderCountTracker`) |
| Other | `MlElementDisplay` (imports `miroir-fwk/MlTools.ts`), `TransformerTestResults` (`testSelectionUtils`), `Graph/index.ts`, `TableActionButtons_new` (unused, same export names as `TableActionButtons`), `CellRenderers.tsx` (empty) |

### 5.3 Next slices

1. Give tests a way to provide `MiroirReactContext` and the theme without mocking (a test provider exported by miroir-react), then move the mocked-collaborator modules.
2. Move the report URL keys of `src/constants.ts` to miroir-react, then `ReportHooks` and its dependents.
3. Break the editor core cycle from the lazy CodeMirror and BlockEditor modules, then move the editor core with `@dnd-kit/core` as a lazy dependency of miroir-react.
4. Break the reports cycle between `4_view` and `4-tests/componentTests`.
