# 13 — Move the GUI components of miroir-standalone-app to miroir-react

> Umbrella analysis for #13: what the first three slices did, what is left in `miroir-standalone-app/src/miroir-fwk/4_view`, and the slices and decisions that remain. Each slice keeps its own analysis.

Related issue: https://github.com/miroir-framework/miroir/issues/13
Slices: #592 ✅ (PR #599), #600 ✅ (PR #601), #604 ✅ (PR #605)
Slice analyses: [`592`](../592-REFACTOR-move-components-to-miroir-react/analysis.md) (D1 to D7), [`600`](../600-REFACTOR-mocked-modules-to-miroir-react/analysis.md) (D8 to D11), [`604`](../604-REFACTOR-editor-core-to-miroir-react/analysis.md) (D12 to D15)

**Status:** three slices merged into `aba`; this document plans the rest (state of `aba` on 2026-10-30).

---

## 1. Goals

From the slices, unchanged:

- **G1 — Reuse the view layer.** Another application can build on miroir-react's components without copying them from the standalone app.
- **G2 — Same app.** The standalone app behaves the same, and the page loads no more code: the bundle guard (`scripts/check_bundle_policy.py`) passes at every step.
- **G3 — Same logs.** Logger names follow the package a file lives in (D3).
- **G4 — Tests that survive a move.** Tests give components their contexts instead of mocking miroir-react by path (D8, D12).

Added here:

- **G5 — A defined end.** #13 is done when every module left in `4_view` is there for a stated reason (§5), not because nobody moved it yet.

## 2. Non-goals

- Re-layouting miroir-react (D5 keeps the `4_view` layout).
- Moving `4-tests` (the MiroirTest runtime) as a whole: only the coupling between it and the view components is in scope (§5, Q3).

## 3. What the three slices did

| Slice | Moved | What it unblocked | Key decisions |
|---|---|---|---|
| #592 (PR #599) | 111 modules, 4 duplicates deleted | per-module tsup output with `sideEffects: false` so Vite keeps lazy chunks; MUI 9 for type checks; themes, tools, contexts, report hooks, editor support files | D1 per-module output, D2 MUI 9, D3 logger names, D4 no re-export left behind, D5 same layout, D6 batches, D7 `tsup --watch` |
| #600 (PR #601) | 29 modules | `MiroirContextReactTestProvider` replaces `vi.mock("miroir-react")` of hooks; report URL keys in `reportUrlParams.ts` | D8 to D11 |
| #604 (PR #605) | 33 modules | the editor core cycle; `isVitestTestMode()` reads `process.env`; `LazyBlockEditorView` keeps `@dnd-kit/core` lazy | D12 to D15 |

173 modules moved in all. miroir-react now has about 190 source files.

Page bundle (eager chunks, gzip, from the bundle report):

| Build | Eager gzip | Guard |
|---|---|---|
| before #599 | 831 793 | 0 violations |
| after #599 | 835 795 | 0 violations |
| after #601 | 836 073 | 0 violations |
| after #605 | 835 640 | 0 violations |

What worked, to keep for the next slices:

- `move_to_react.py` (not in the repo, in the slices' notes): `git mv`, rewrite of relative imports in moved files and of importers to `"miroir-react"`, `index.ts` exports, a report of what it cannot rewrite (mocks by path, dynamic imports, export clashes).
- Run the bundle guard after every move. A dynamic `import("miroir-react")` in the app pulls the target into the page, because the page already loads `miroir-react` (D13).
- Compare nonreg runs with `--compare` against the previous slice's snapshot.

## 4. What is left: 88 files in `4_view`

### 4.1 By reason

| # | Group | Modules | Count | What blocks it |
|---|---|---|---|---|
| A | Reports cycle | `ReportViewWithEditor`, `ReportSectionViewWithEditor`, `ReportSectionListDisplay`, `ListTransformerPanel`, `JsonObjectEditFormDialog`, `routes/ReportDisplay` | 6 | `ReportSectionViewWithEditor` imports the `ReportDisplay` route, which imports `ReportViewWithEditor`, which imports `ReportSectionViewWithEditor` (a Report section can show a Report). `ReportSectionListDisplay` imports `ReportDisplay` dynamically. `ListTransformerPanel`'s test stubs the editors (D15). |
| B | Grids (ag-grid, glide) | `LazyGrids`, `EntityInstanceGrid`, `ValueObjectGrid`, `EntityEditor`, `GenderCellRenderer`, `GenderCellEditor`, `EntityInstanceCellRenderer`, `SelectEntityInstanceEditor`, `getColumnDefinitionsFromEntityAttributes`, `GlideDataGridComponent`, `GlideToolsCellRenderer` | 11 | heavy libraries that the page loads lazily through `LazyGrids`. `EntityInstanceGrid` and `ValueObjectGrid` import `JsonObjectEditFormDialog`, which imports `ReportSectionViewWithEditor`: the grids are part of the reports cycle and move with it (S6). |
| C | MiroirTest displays | `ReportSectionMiroirTest`, `MiroirTestDisplay`, `MiroirTestListDisplay`, `MiroirTestResultsDisplay`, `TestExecutionPanel`, `TestResultsGrid`, `TestCellWithDetails`, `TestResultCellWithActualValue`, `SideBySideDiff` (`diff`), `ComponentTestSandbox`, `ComponentTestRunSettings`, `UiIntegrationTestRunControls`, `UiIntegrationTestRunInspectorSummary`, `RunAllMiroirTestsButton`, `RunMiroirTestSuiteButton` | 15 | they import the MiroirTest runtime in `miroir-fwk/4-tests` (launchers, run state, profile catalog, suite registries), which imports `PageDispatcher` and the app's services. |
| D | Other packages | `GraphComponent`, `GraphReportSectionView` (d3), `ModelDiagramReportSectionView` (`miroir-diagram-class`) | 3 | `miroir-diagram-class` depends on miroir-react, so miroir-react cannot import it (package cycle). d3 is heavy. |
| E | Runners | `RunnerView`, `RunnersList`, `Runner_CreateApplication`, `Runner_CreateEntity`, `Runner_DropApplication`, `Runner_DropEntity`, `Runner_InstallApplication`, `resolveMcpToolAction`, `runMcpToolRunner`, `SequenceEditor` | 10 | `RunnerView` runs MCP tools through `miroir-mcp`, which pulls the stores (`miroir-store-*`) and `miroir-example-library`. `ReportSectionViewWithEditor` (group A) renders `RunnerView`. |
| F | App shell | `PageDispatcher`, `components/Page/AppBar`, `components/Page/RootComponent`, `EventTimelineContainer`, `InstanceEditorOutline`, `ErrorLogsPageDEFUNCT` (the `error-logs` page: an `AppBar` link and a lazy target of `PageDispatcher`), `auth/authTransport`, `constants.ts` | 8 | the app's composition: routes, lazy page targets, Electron IPC (`authTransport`), AI backend choice (`AppBar`). |
| G | Routes and pages | `routes/` (16 besides `ReportDisplay`: `HomePage`, `ReportPage`, `SettingsPage`, `SearchPage`, `TransformerBuilderPage`, `ModelDiagramPage`, `Runners`, `Check`, `LoginPage`, `routes/ai/*` with CopilotKit and a CSS asset), `pages/MiroirEventsPage`, `pages/SelfTestPage` | 18 | pages of this app, tied to its routing and its services. |
| H | Services | `ConfigurationService`, `usePageConfiguration`, `services/index`, `ElectronIpcProxy` | 4 | app configuration loading and Electron IPC. |
| I | Unused | `CellRenderers`, `SimpleEditor`, `Importer` (`xlsx`), `useStyles`, `components/test-icon-extraction`, `components/MlElementDisplay`, `components/Grids/TableActionButtons_new`, `components/Graph/index`, `components/EndpointActionCaller`, `Runners/ImportEntityFromSpreadsheetRunner` (`xlsx`), `Runners/LibraryRunner_LendDocument` (only commented out in `RunnersList`), `components/Themes/__tests__/*` (2 test files, one with an unresolved import) | 13 | nothing imports them, or only a commented-out line does. |

### 4.2 Dependencies between the groups

```
F shell ──► G routes ──► A reports cycle ──► B grids
                │              │  ├────────► C MiroirTest displays ──► 4-tests ──► F (PageDispatcher), H
                │              │  ├────────► D graph / model diagram
                │              │  └────────► E runners ──► miroir-mcp
                └──► H services
```

A is the knot: it is what G renders and it renders B to E. B and A import each other (the grids open `JsonObjectEditFormDialog`, which renders a Report section), so they move together. C, D and E are rendered by A only through `ReportSectionViewWithEditor`, so they can be passed in (Q3).

## 5. Decisions to make

### Q1 — End state: what stays in the app

| Option | Stays in the app |
|---|---|
| **Q1-a ★** | F, G (except `ReportDisplay`), H, the MCP part of E, and the MiroirTest runtime (`4-tests`) with the displays of C that need it |
| Q1-b | only F and H: routes and runners move too, the app keeps its composition |
| Q1-c | everything moves except `index.tsx` |

Q1-a: the shell, routes and services are this app's composition (G1 asks for reusable components, not a reusable app). `miroir-mcp` brings the stores and an example application. The MiroirTest runtime drives the app's own `PageDispatcher`.

### Q2 — The reports cycle (group A)

| Option | Pros | Cons |
|---|---|---|
| **Q2-a ★ Move `ReportDisplay` with the cycle** | it is a component (a Report by uuid), not a page: its only imports are `ReportViewWithEditor` and the 4_view `constants`; the cycle moves as one unit, like the editor core | `routes/` then has one fewer file; the route modules import it from `"miroir-react"` |
| Q2-b A `ReportDisplayContext` that the app fills | miroir-react never names the route | one more context for a component that has no app dependency |

### Q3 — Section kinds that need app or heavy code (groups C, D, E)

`ReportSectionViewWithEditor` switches on the section type and renders the graph, the model diagram, the MiroirTest section and the Runner view.

| Option | Pros | Cons |
|---|---|---|
| **Q3-a ★ A section renderer registry** (`ReportSectionRenderersContext`: section type → component), filled by the app | miroir-react has no import of d3, `miroir-diagram-class`, `miroir-mcp` or `4-tests`; another application registers only what it uses; the package cycle with `miroir-diagram-class` disappears | a registration step in the app; sections the app did not register need a fallback ("unsupported section") |
| Q3-b Move each kind with lazy loading (as `LazyBlockEditorView`) | no registry | impossible for `miroir-diagram-class` (package cycle) and `miroir-mcp` (stores in the browser bundle); C drags the MiroirTest runtime along |

### Q4 — Grids (group B)

| Option | Pros | Cons |
|---|---|---|
| **Q4-a ★ Move the grids, `LazyGrids` stays their only entry** | the list section works in any application; ag-grid and glide stay lazy (`LazyGrids` uses `lazy(() => import(...))` of separate files, the D13 pattern) | miroir-react declares `ag-grid-community`, `ag-grid-react` and `@glideapps/glide-data-grid`; check the bundle guard and the electron bundle policy |
| Q4-b Grids through the registry of Q3 | miroir-react has no grid library | the default list display would not work without the app |

### Q5 — Unused files (group I)

D11 left them in place. With the end of #13 in sight, they are the noise in §4.

| Option | |
|---|---|
| **Q5-a ★ Delete them in their own slice**, after a last check of dynamic imports and test references | 13 files fewer, and §4 counts only real work |
| Q5-b Keep them | |

## 6. Remaining slices

| Slice | Content | Depends on | Size |
|---|---|---|---|
| S4 Unused files | delete group I (Q5-a) | — | small |
| S5 Section renderer registry | `ReportSectionRenderersContext` in miroir-react; the app registers graph, model diagram, MiroirTest and Runner sections (Q3-a) | — | medium |
| S6 Reports cycle and grids | move groups A and B together, with `ReportDisplay` (Q2-a); declare the grid libraries and keep `LazyGrids` lazy (Q4-a); `ListTransformerPanel`'s test uses the `"miroir-react"` mock or the real editors | S5 | large |
| S7 Close #13 | check that what stays is Q1's list, update `docs/` and #13 | S4 to S6 | small |

S4 and S5 are independent. S6 cannot be split along A and B without a seam: the grids import `JsonObjectEditFormDialog`, which renders `ReportSectionViewWithEditor`. If S6 turns out too large to review, pass the dialog to the grids as a prop or context first, then move the grids, then the cycle.

## 7. Risks

- **Bundle.** Each move can pull a lazy library into the page through a static or dynamic import of `"miroir-react"`. Run the guard on every slice.
- **Tests that mock by path.** Before moving a module, list the `vi.mock` / `vi.doMock` of its path (the move script reports them). Since #600 the fix is a context or a partial `"miroir-react"` mock.
- **Electron.** `miroir-standalone-app-electron` has its own bundle policy; S6 adds grid libraries to miroir-react, so its guard must run too.
