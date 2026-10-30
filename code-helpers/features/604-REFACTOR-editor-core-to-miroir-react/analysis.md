# 604 — Move the value object editor core to miroir-react

> Third slice of #13, after [#592](../592-REFACTOR-move-components-to-miroir-react/analysis.md) and [#600](../600-REFACTOR-mocked-modules-to-miroir-react/analysis.md). It moves the editor core cycle, the modules it needs (block editor, progressive render) and the importers this frees.

Related issue: https://github.com/miroir-framework/miroir/issues/604
Parent issue: https://github.com/miroir-framework/miroir/issues/13 · Previous slices: #592 ✅ (PR #599), #600 (PR #601)
Related analyses: [`../592-REFACTOR-move-components-to-miroir-react/analysis.md`](../592-REFACTOR-move-components-to-miroir-react/analysis.md) (D1 to D7), [`../600-REFACTOR-mocked-modules-to-miroir-react/analysis.md`](../600-REFACTOR-mocked-modules-to-miroir-react/analysis.md) (D8 to D11)
Key sources: [`packages/miroir-react/src/tools/progressiveRenderConfig.ts`](../../../packages/miroir-react/src/tools/progressiveRenderConfig.ts), [`packages/miroir-react/src/components/BlockEditor/BlockViewSwitch.tsx`](../../../packages/miroir-react/src/components/BlockEditor/BlockViewSwitch.tsx)

**Status:** implemented in the PR for #604.

---

## 1. Goals

G1 to G4 of the previous slices still hold. Nothing new: this slice applies them to the editor core.

## 2. Non-goals

- The reports and test infrastructure cycle (`ReportSectionListDisplay`, `ReportViewWithEditor`, `ReportSectionViewWithEditor`, `MiroirTest*Display`, `4-tests/componentTests`). Next slice.
- Grids, graph, diff, MCP, Electron and `xlsx` users.
- `ListTransformerPanel` (D15).

## 3. Decision record

| Decision | Choice | Serves |
|---|---|---|
| D12 How the editors detect a test run | **`isVitestTestMode()` reads `process.env.VITE_TEST_MODE` at call time** | G2, G4 |
| D13 How the app's component test tools load `BlockEditorView` lazily | **miroir-react exports `LazyBlockEditorView`** | G2 |
| D14 Exports that clash with miroir-react | **Keep miroir-react's** (`SidebarWidth`, `EditorAttribute`, `TypedValueObjectEditorProps`); `lastSubmitButtonClicked` moves to `viewConstants` | G1 |
| D15 `ListTransformerPanel` | **Stays in the app** | G4 |

### D12 — Test-run detection

`isVitestTestMode()` read `import.meta.env.VITE_TEST_MODE`. Only Vite defines `import.meta.env`, and Vite replaces it with a literal when it transforms the module, so `componentTestMode.286.phase4` had to swap the module with `vi.doMock` by path to emulate the running app. That mock does not reach a module inside miroir-react.

| Option | Pros | Cons |
|---|---|---|
| **D12-a. Read `globalThis.process?.env?.VITE_TEST_MODE` at call time** ★ | `vi.stubEnv` reaches it from any package; no test-only API; the browser has no `process.env.VITE_TEST_MODE` (vitest sets it in `vite.config.js` `test.env`, the npm scripts with `cross-env`) | reads the environment on each call (a property lookup) |
| D12-b. A setter `setVitestTestMode(boolean)` | explicit | a test-only API, and every test setup has to call it |
| D12-c. Keep `import.meta.env` | no change | the phase4 test cannot reach the module any more |

The phase4 test now only calls `vi.stubEnv("VITE_TEST_MODE", "false")`.

### D13 — Lazy `BlockEditorView`

`BlockEditorView` brings `@dnd-kit/core` (21 kB gzipped), which the page does not load. `BlockViewSwitch` loads it with `lazy(() => import("./BlockEditorView.js"))`, a separate file in miroir-react's output, so Vite keeps it in a lazy chunk. The app's `transformerBlocksForTest` had its own `lazy(() => import(".../BlockEditorView.js"))`. Rewritten to `import("miroir-react")`, it pulled `BlockEditorView` into the page's chunks, since the page already loads `miroir-react` (bundle guard: 4 violations, +4.0%). `BlockViewSwitch` now exports its lazy component as `LazyBlockEditorView`, and `transformerBlocksForTest` uses it.

### D15 — `ListTransformerPanel`

Its unit test replaces `TypedValueObjectEditor`, `TypedValueObjectEditorWithFormik`, `EntityInstanceGrid` and `JsonObjectEditFormDialog` with stubs. Inside miroir-react, the first two would be imported by relative path, out of reach of the test's `"miroir-react"` mock. Its only importer, `ReportSectionListDisplay`, stays in the app (reports cycle), so it moves with that slice. The test's path mocks of the two editors became entries of its `"miroir-react"` mock.

---

## 4. Current state after this slice

### 4.1 Moved (33 modules)

| Group | Modules |
|---|---|
| Editor core cycle (14) | `MlElementEditor`, `MlObjectEditor`, `MlArrayEditor`, `MlLiteralEditor`, `MlEnumEditor`, `MlAnyEditor`, `MlElementStringEditor`, `MlElementEditorInterface`, `MlElementEditorReactCodeMirror`, `TypedValueObjectEditor`, `TransformerTypeAnnotation`, `ReportSectionEntityInstance`, `BlockEditorView`, `BlockViewSwitch` |
| Block editor leaves (5) | `BlockDragDrop`, `BlockPalette`, `BlockDefineHeader`, `BlockInsertTargets`, `BlockRunnerHat` |
| Progressive render (3) | `progressiveRenderConfig`, `useViewportReveal`, `ComponentTestModeContext` |
| Importers (11) | `Sidebar`, `InlineReportEditor`, `ReportInputSection`, `ReportTools`, `TypedValueObjectEditorWithFormik`, `InnerRunnerView`, `EntityInstanceSelectorPanel`, `TransformationResultPanel`, `TransformerEditor`, `TransformerEventsPanel`, `ApplicationSelector` |

miroir-react now declares `@dnd-kit/core`.

### 4.2 Bundle

| Build | Eager chunks | Eager gzip | Guard |
|---|---|---|---|
| after #600 | 66 | 836 073 | 0 violations |
| this slice | 66 | 835 640 | 0 violations |

The CodeMirror and `BlockEditorView` chunks stay lazy.

### 4.3 What stays in `4_view`

63 modules remain outside `routes/`, `pages/` and `services/`: the reports and test infrastructure cycle, `ListTransformerPanel` (D15), the users of ag-grid, glide-data-grid, `diff`, d3, `miroir-diagram-class`, `xlsx`, `miroir-mcp`, Electron and `miroir-example-library`, the app shell (`PageDispatcher`, `AppBar`, `RootComponent`, `Importer`), the lazy route targets and the unused files of D11.

### 4.4 Next slice

The reports cycle: separate `4-tests/componentTests` from the report components it imports, then move `ReportSectionListDisplay`, `ReportViewWithEditor`, `ReportSectionViewWithEditor`, `ListTransformerPanel` and the MiroirTest displays. The grids they use (ag-grid, glide) need the same lazy treatment as `BlockEditorView`.
