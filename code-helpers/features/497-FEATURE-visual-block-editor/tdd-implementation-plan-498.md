# Issue #498 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> the block model is tested through its public functions in MiroirTest `fn.blockModel` cases and
> through a sweep of every asset file; the view is tested through MiroirTest `ui.blockEditor`
> component cases that render the real TransformerEditor and real TransformerDefinitions over the
> component-test local cache. No mocks. The tracer bullet proves that the TransformerEditor's
> transformer can be switched to a block view drawn from the miroir-core block model.
>
> **Execution model:** A's flow for sizeable work: one green commit per slice, pushed to the
> working branch. Each slice ends with its Validation commands; on success its Realization summary
> is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) (parent issue #497) · Issue: https://github.com/miroir-framework/miroir/issues/498
Working branch: `claude/497-visual-block-editor`

**Resume note:** plan written 2026-10-06; Slices 0 to 2 done 2026-10-06.

---

## Scope

- **G1 — Read a transformer as blocks**: a pure block model in miroir-core, a read-only block view loaded on demand, and a Blocks/Form/JSON switch on the TransformerEditor's transformer.
- **G11 — Build or runtime at a glance**: build blocks marked, in the style set by the new ViewParams attribute.
- Block categories (D3) and their Theme colors (D11), needed by the first view.

This plan does **not** edit blocks (#500), add @dnd-kit (#500), undo (#499), offer variable blocks (#501), show define blocks (#502), put the switch on other fields (#503) or show action sequences (#504).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the transformer corpus and the editors | ✅ | `transformerBlockModelAssets.unit.test.ts` (inventory), existing editor suites |
| 1 | Tracer: the TransformerEditor's transformer as blocks | ✅ | `ui.blockEditor` switch case, first `fn.blockModel` cases |
| 2 | Every transformer in the assets maps to blocks | ✅ | asset sweep with zero JSON blocks, `fn.blockModel` rule cases |
| 3 | The full read-only block view | ⬜ | `ui.blockEditor` cases on the two composite TransformerDefinitions |
| 4 | Block categories and their Theme colors | ⬜ | `fn.blockModel` category cases, Miroir modelValidation, `ui.blockEditor` |
| 5 | Build marking and its ViewParams setting | ⬜ | `ui.blockEditor` marking cases, Admin modelValidation |
| 6 | JSON view and a view mode that survives folding | ⬜ | `ui.blockEditor` switch cases |
| 7 | Nonreg, docs, bundle, AC | ⬜ | nonreg steps, bundle guard, AC checklist |

---

## Locked implementation defaults

From the analysis decision record. Deviations go into the slice's Realization.

| Decision | Choice | Serves |
|---|---|---|
| Round 2 Q9 / D7 | Pure block model in `miroir-core/src/2_domain/TransformerBlockModel.ts`, types in `0_interfaces/2_domain/TransformerBlockModelInterface.ts`; React blocks in `miroir-standalone-app/src/miroir-fwk/4_view/components/BlockEditor/`, memoized on value-subtree identity, no Formik, Redux or main-context subscription below the root | G1 |
| D4 | Blocks keyed by `transformerType`; definitions from `applicationTransformerDefinitions` (registry of D9 comes with #502) | G1 |
| D5 | Slots from `transformerSlots`, every other object with a string `transformerType` drawn as a block; `returnValue.value` is a quoted literal; undeclared keys are flagged rows; unknown types are JSON blocks | G1 |
| Round 2 Q4, Q5 | Header line with the type, the label and the primitive parameters; one row per transformer slot; object and list blocks; ML schemas as a collapsed chip (its popover editor comes with #500) | G1 |
| D6 | Dispatcher in front of `MlElementEditor`; predicate on the key-map entry; view mode in `BlockViewModeContext` keyed by the full Formik path; default Form; provided by the TransformerEditor only | G1 |
| D3 | `classification` of the 37 `basic` definitions split into list, object, control, value, variable, operator; ansiColumnsToMlSchema to MLS, transformer_menu_addItem to metaModel | G1 |
| D11 | Theme `components.blockEditor` with `categoryColors` (record) and `fallbackColor`; dark instance carries its own colors; read through `useMiroirTheme` | G1 |
| D1 | Build (and absent) marked, runtime unmarked; ViewParams `blockEditorBuildMarking: dashedOutline | marker`, absent = dashedOutline; tests override it through `BlockEditorDisplayContext` | G11 |
| D8 | Asset sweep as a platform vitest in miroir-core, one case per file; `fn.blockModel` cases per mapping rule | G1 |
| Lazy loading | The block view is a dynamic import with a "Loading block editor..." fallback; no new package in #498 | G1 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| MiroirTest `fn.blockModel` | `0161aae9-8ff2-4efb-9da5-ee8926961196`, export `miroirTest_fn_blockModel` |
| MiroirTest `ui.blockEditor` | `1b25f3f1-3474-43d0-b250-8684529d55dc`, export `miroirTest_ui_blockEditor` |
| Function-call registry module | `miroir-core/2_domain/TransformerBlockModel` (exports `transformerBlockTree`, `transformerBlockOutline`) |
| Component registry entry | `TransformerBlocks` (renders the block view of a TransformerDefinition body or of a given value) |
| ViewParams attribute | `blockEditorBuildMarking`, tag id 18 |
| Theme attribute | `definition.components.blockEditor` |
| Platform sweep | `packages/miroir-core/tests/2_domain/transformerBlockModelAssets.unit.test.ts` |
| Nonreg steps | `unit-498-block-model`, `unit-ui-blockEditor` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| `fn.blockModel` | `npm run testMiroir -w miroir-core -- --suites fn.blockModel --mode unit` |
| Asset sweep | `npm run testByFile -w miroir-core -- transformerBlockModelAssets` |
| `ui.blockEditor` | `npm run testMiroir -w miroir-standalone-app -- --suites ui.blockEditor` |
| Existing editor suites | `npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor` (and `ui.mlElementEditor.object`, `.union`, `.any`) |
| Component suite counts | `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency miroir-component-tests` |
| Miroir deployment validation | `npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts` |
| Admin deployment validation | `npm run testByFile -w miroir-app-admin -- tests/modelValidation.unit.test.ts` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` (miroir-core, miroir-react, miroir-standalone-app) |
| Bundle guard | `npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared` |

---

## Slice 0 — Characterize the transformer corpus and the editors

**Status:** ✅ DONE

### Goal

Lock what the block model will read (the asset corpus of D8) and what the dispatcher must not change (the existing editor suites), before any code changes.

### 0.1 RED → GREEN — corpus inventory

**Test:** `packages/miroir-core/tests/2_domain/transformerBlockModelAssets.unit.test.ts` (platform vitest: it reads `packages/*/assets` from the file system, which a MiroirTest cannot).

Behavior asserted, one `it` per asset file holding a transformer:
- the walker finds the outermost transformers of the file per the D8 corpus rule (skips functionCallTest `arguments`, `expected*` values, `returnValue.value` content);
- every found `transformerType` has a definition in `applicationTransformerDefinitions`.

The run prints the totals (files, roots, nodes, interpolation counts) so the numbers of analysis §4.2 can be compared.

### 0.2 Baseline of the existing suites

Run `ui.transformerEditor`, `ui.mlElementEditor.object`, `ui.mlElementEditor.union`, `ui.mlElementEditor.any`, `fn.transformer.treeEdit` and record their results, and the eager gzip size of a fresh app build with the bundle guard's status.

### Validation

```bash
npm run testByFile -w miroir-core -- transformerBlockModelAssets
npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor
npm run testMiroir -w miroir-standalone-app -- --suites ui.mlElementEditor.object
npm run testMiroir -w miroir-core -- --suites fn.transformer.treeEdit --mode unit
```

### Realization

- Sweep: 113 asset files hold a transformer, 889 outermost roots, 2513 transformer nodes of 46 types, every type defined. Interpolation: 1773 runtime, 221 build, 519 absent (analysis §4.2 matches).
- Baseline: the first run of `ui.transformerEditor` failed (26 of 26, `formatInputOutputTypeLabel is not a function`) because every package `dist/` predated the source; after rebuilding the 20 packages in build order it passed 26 of 26. `fn.transformer.treeEdit` passed.
- The sweep is gated by `RUN_TEST=transformerBlockModelAssets` like other platform sweeps.

---

## Slice 1 — Tracer: the TransformerEditor's transformer as blocks

**Status:** ✅ DONE

### Goal

A developer in the TransformerEditor switches its transformer to Blocks and sees each transformer as a block with its slots, then switches back to the form.

**Layers cut:** miroir-core interface and domain module → function-call registry → MiroirTest assets (fn and ui) → standalone-app view (dispatcher, context, lazy block view) → component registry.

### 1.1 RED

**Tests:**
- `fn.blockModel` (new MiroirTest, tags `unit`, `transformer`, issue 498), sub-suite `transformerBlockOutline`: `returnValue` with a string value gives one block with an inline literal; `mapList` with a `getFromContext` element and an `applyTo` gives one block with the rows `elementTransformer` and `applyTo` in that order.
- `ui.blockEditor` (new MiroirTest, tags `ui`, `editor`, `transformer`, issue 498), sub-suite on component `TransformerEditor`: the transformer field shows a view switch with Form selected; clicking Blocks shows a block for `returnValue` (`byTestId` `block:transformer`); clicking Form shows the `transformerType` combobox again.

### 1.2 GREEN

- `TransformerBlockModelInterface.ts`: `BlockNode` union (`transformer`, `object`, `list`, `literal`, `mlSchema`, `json`), `TransformerBlock` (path, `transformerType`, `label`, `category`, `interpolation` as stored, inline parameters, slot rows, undeclared rows), `BlockTree` (`root`, `stats`).
- `TransformerBlockModel.ts`: `transformerBlockTree(value, options?)` and `transformerBlockOutline(value, options?)` (one text line per block or row, the format used by the fn cases). Slot rows from `transformerSlots`; literals inline. Registered in `FUNCTION_CALL_REGISTRY` as a `LazyRegistryModule`.
- `BlockEditor/BlockViewMode.ts` (eager, small): `BlockViewModeContext`, `isBlockViewRoot(keyMapEntry)` (D6 predicate).
- `MlElementEditor.tsx`: the current component becomes `MlElementEditorForm`; `MlElementEditor` is the dispatcher (one `useContext`, then the form, or the switch host for a matching field).
- `BlockEditor/BlockViewSwitch.tsx`: the Blocks/Form/JSON toggle row and the choice between the lazy block view and the form; reads the value with `useFormikContext` at the root only.
- `BlockEditor/BlockEditorView.tsx` (lazy chunk): draws the block tree.
- `TransformerEditor.tsx`: provides `BlockViewModeContext` around the definition editor.
- miroir-app-miroir `index.ts`, `index.d.ts`: export both suites (not added to `src/Model.ts`, to stay off the page; see analysis §4.7). Counts in `miroir-component-tests.unit.test.tsx` and the consistency test.

### 1.3 Refactor checkpoint

- The predicate and the outline share one walk with the tree builder; no second traversal.
- Check that `MlElementEditorForm` keeps its memo dependencies (analysis D6-b warning).

### Validation

**Nonreg scopes:** `smoke,core,ui`: miroir-core `2_domain` and MiroirTest assets (core), standalone-app view (ui).

```bash
npm run build -w miroir-app-miroir && npm run build -w miroir-core
npm run testMiroir -w miroir-core -- --suites fn.blockModel --mode unit
npm run testMiroir -w miroir-standalone-app -- --suites ui.blockEditor
npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency miroir-component-tests
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui
```

### Realization

- `fn.blockModel` 2 of 2, `ui.blockEditor` 2 of 2, `ui.transformerEditor` 26 of 26, component counts 11 instances and 115 leaves, Miroir modelValidation 165 of 165; miroir-core typecheck clean, standalone-app typecheck adds no error (36 before, all MUI 9 props and the `miroir-app-meta` / `miroir-example-github` links missing from a stale `node_modules`).
- Deviation: `TransformerBlockModel` is a static `FUNCTION_CALL_REGISTRY` entry, not a `LazyRegistryModule`: miroir-core is one eager chunk, so a lazy entry saves nothing.
- Deviation: `ui.blockEditor` is listed in miroir-app-miroir `src/Model.ts` like `ui.transformerEditor`: `componentTestInstances.292.phase1` requires every component instance in `defaultMiroirMetaModel.tests`, and the Miroir Tests menu runs it in the app. It adds about 2 KB to the page.
- JSON mode renders the form until Slice 6.
- Found on `_integration`: `156d840` added the `setChecked` step to the MiroirTest Entity but not to its EntityVersion, so `componentMiroirTests.consistency` failed on `ui.transformerEditor`. The EntityVersion now carries the same branch (the two mlSchemas are equal again).

---

## Slice 2 — Every transformer in the assets maps to blocks

**Status:** ✅ DONE

### Goal

Any transformer stored in the repository can be shown as blocks, with no part falling back to raw JSON.

**Layers cut:** miroir-core domain module → fn MiroirTest asset → asset sweep.

### 2.1 RED

- The sweep of Slice 0 now maps every root with `transformerBlockTree`: no throw, every transformer node of the root is a block (counted against the walker), and zero JSON blocks over the corpus. The run prints the JSON block count per file.
- `fn.blockModel` cases, one per mapping rule (grouped cycles in this slice): array slots (`case.whens[].when`, `whens[].then`), record slots (`createObject.definition`, `dataflowObject.definition`), `applyTo` holding a literal, a list or a transformer; plain objects and lists holding transformers (`ifThenElse.then` with an object of transformers); `accessDynamicPath.objectAccessPath` mixing strings and transformers; `concatLists.lists` and `aggregate.having`; ML schema parameters as chips (`returnValue.mlSchema`, `mlsTypeCheck.mlSchema`); `returnValue.value` holding a transformer-shaped object (quoted, no block); undeclared keys (`boolExpr.args`) as flagged rows; `orderBy` from the `transformer_orderBy` extension declared; an unknown `transformerType` as a JSON block.

### 2.2 GREEN

Parameter classes in the block model: transformer slot, primitive or enum (inline), array of primitives (inline list), ML schema (chip), anything else (shape detection). Extension clauses of a parameter schema resolved as `keepAttributesOnTypeChange` does.

### 2.3 Refactor checkpoint

- If shape detection and `transformerChildren` (`TransformerTreeEdit.ts`) compute the same children, make one use the other.
- Analysis §4.1 misalignments (hidden slots, union drift) stay out: they are proposals in analysis §6.2.

### Validation

**Nonreg scopes:** `smoke,core`.

```bash
npm run build -w miroir-app-miroir && npm run build -w miroir-core
npm run testByFile -w miroir-core -- transformerBlockModelAssets
npm run testMiroir -w miroir-core -- --suites fn.blockModel --mode unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core
```

### Realization

- The sweep was green at once: the Slice 1 model already drew all 2513 transformer nodes of the 889 roots as blocks, with no JSON block. `fn.blockModel` grew to 20 cases in four sub-suites (`slots`, `structures`, `parameters`, `fallbacks`); 18 passed at once.
- RED → GREEN: `returnValue.mlSchema` is an inline union, not a reference to an ML schema, so it was drawn as an object block. ML schema parameters are now recognized by reference (`ml*`) or by name (`mlSchema`, `…MlSchema`, per `docs/reference/ml-nomenclature.md`), which also covers `constantAsExtractor.valueMlSchema`; and an ML schema computed by a transformer stays a block instead of hiding it in a chip.
- `transformerChildren` (`TransformerTreeEdit.ts`) lists only the typed slot children a node can be unwrapped to, while the block model finds transformers anywhere by shape: they do not compute the same thing, so neither uses the other.

---

## Slice 3 — The full read-only block view

**Status:** ⬜ pending

### Goal

The block view draws every node kind of the block model: object and list blocks, inline parameters, ML schema chips, flagged rows and JSON blocks; blocks collapse; the view zooms.

**Layers cut:** standalone-app view → component registry → ui MiroirTest asset.

### 3.1 RED

`ui.blockEditor` sub-suite on a new component registry entry `TransformerBlocks`, whose props name a TransformerDefinition (its body comes from the real definition, no copy):
- `entityDefinition_extractAttributes`: the root `filterList` block with its `predicate` and `applyTo` rows; collapsing the root hides its rows and shows a "+N" summary;
- `spreadSheetToMlSchema`: object blocks inside `createObject`, a list block, an ML schema chip;
- zoom out and zoom in change the zoom label (`byText` "90 %", "100 %");
- every block carries the id of the form card at the same path.

### 3.2 GREEN

`TransformerBlock`, `ObjectBlock`, `ListBlock`, `LiteralChip`, `MlSchemaChip`, `JsonBlock` components, each `React.memo`; collapse state in a `useReducer` at the root; zoom as a CSS scale with buttons. Registry entry `TransformerBlocks` in `componentRegistry.ts`.

### 3.3 Refactor checkpoint

- Blocks receive only their subtree and the shared definitions (D7); check with `useTrackedRender` that a collapse renders only the root and the collapsed block.

### Validation

**Nonreg scopes:** `smoke,ui`.

```bash
npm run testMiroir -w miroir-standalone-app -- --suites ui.blockEditor
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency miroir-component-tests
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

### Realization

---

## Slice 4 — Block categories and their Theme colors

**Status:** ⬜ pending

### Goal

Blocks are colored by category from the selected Miroir theme, with finer categories than `basic`.

**Layers cut:** TransformerDefinition assets and the `TransformersForClassification` query → Theme Entity, EntityVersion and generated types → miroir-react theme defaults → block model → view.

### 4.1 RED

- `fn.blockModel` cases: `mapList` is `list`, `ifThenElse` is `control`, `getFromContext` is `variable`, `boolExpr` is `operator`, `mlsTypeCheck` is `MLS`.
- The asset sweep prints categories without a Theme color and asserts there are none for the default theme.
- `ui.blockEditor`: a block carries `data-category` and its color comes from the theme (`waitForAttribute`).
- Miroir modelValidation (the four Theme instances against the new EntityVersion schema; the 48 definitions).

### 4.2 GREEN

- 37 TransformerDefinition JSON files: new `classification` (D3 table); the `TransformersForClassification` query enum lists every value.
- Theme Entity `bdcf956a-…` and EntityVersion `31b88b03-…`: optional `components.blockEditor` {`categoryColors`: record of color strings, `fallbackColor`}; regenerate types; both `ThemeColorDefaults.ts` copies fill it; the default and dark instances carry their colors.
- Block view: `useMiroirTheme().currentTheme.components.blockEditor`, fallback color for unknown categories.

### 4.3 Refactor checkpoint

- Mockup tokens (`mockup/template.html`) and the Theme values use the same palette; dark values chosen for contrast.

### Validation

**Nonreg scopes:** `smoke,core,ui`.

```bash
npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core && npm run build -w miroir-react
npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-core -- --suites fn.blockModel --mode unit
npm run testByFile -w miroir-core -- transformerBlockModelAssets
npm run testMiroir -w miroir-standalone-app -- --suites ui.blockEditor
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui
```

### Realization

---

## Slice 5 — Build marking and its ViewParams setting

**Status:** ⬜ pending

### Goal

Build blocks, including those with no `interpolation`, show a dashed outline or a "build" marker, as set in the user's ViewParams; runtime blocks show nothing.

**Layers cut:** Admin ViewParams Entity → miroir-core `ViewParams.ts` → view hook and test context → block view.

### 5.1 RED

- `ui.blockEditor` on `TransformerBlocks`: in `entityDefinition_extractAttributes` the root `filterList` (no `interpolation`) has `data-interpolation="build"` and the dashed outline, its runtime children none; with the display context set to `marker`, the root shows the "build" marker and no outline.
- Admin modelValidation with the new attribute.

### 5.2 GREEN

- ViewParams Entity `b9765b7c-…`: optional enum `blockEditorBuildMarking` (tag id 18, default label "Build marking in the block editor"); `viewParams` MlElement and `ViewParamsData` in `ViewParams.ts`.
- `BlockEditor/BlockEditorDisplay.ts`: `BlockEditorDisplayContext` and `useBlockEditorBuildMarking()` (context value inside a component test, else `useAdminViewParams`), as `TransformerTypesDisplay.ts` does.
- Block view: marking from the stored attribute, absent meaning build.

### 5.3 Refactor checkpoint

- The setting is read once at the block root, never drilled through `MlEditorPropsRoot` (analysis §4.4).

### Validation

**Nonreg scopes:** `smoke,core,ui`.

```bash
npm run build -w miroir-app-admin && npm run build -w miroir-core
npm run testByFile -w miroir-app-admin -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-standalone-app -- --suites ui.blockEditor
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui
```

### Realization

---

## Slice 6 — JSON view and a view mode that survives folding

**Status:** ⬜ pending

### Goal

The switch's JSON option shows the transformer as JSON, and the chosen view stays when the field is folded and unfolded.

**Layers cut:** view (switch host, `MlElementEditorForm` initial code mode) → ui MiroirTest asset.

### 6.1 RED

`ui.blockEditor` on `TransformerEditor`: JSON shows the code editor of the transformer; Form after JSON shows the same values; with Blocks chosen, folding and unfolding the selector keeps Blocks.

### 6.2 GREEN

JSON mode renders `MlElementEditorForm` keyed by the mode, whose code display starts on when the context says JSON for its path (no new prop). The mode map lives in the provider, so unmounting a node keeps it.

### 6.3 Refactor checkpoint

- No second JSON editor: the form's own CodeMirror view is reused.

### Validation

**Nonreg scopes:** `smoke,ui`.

```bash
npm run testMiroir -w miroir-standalone-app -- --suites ui.blockEditor
npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

### Realization

---

## Slice 7 — Nonreg, docs, bundle, AC

**Status:** ⬜ pending

### 7.1 Nonreg

- `unit-498-block-model` (scopes `core`): the asset sweep and `fn.blockModel`.
- `unit-ui-blockEditor` (scopes `ui`): `testMiroir --suites ui.blockEditor`.

### 7.2 Bundle

Fresh app build; the bundle guard passes, with no new entry in `defeatedDynamicImports` (the block view's dynamic import splits a chunk). If the eager size moves beyond the tolerance because of the block model in miroir-core, record a new baseline with `npm run bundle-size:record -w miroir-app-meta -- packages/miroir-standalone-app/dist/.vite/bundle-report.json --reason "..."`.

### 7.3 Docs

- `docs/reference/transformers.md`: a section "Showing a transformer as blocks" (the switch, block layout, categories, build marking and its setting).
- `docs/reference/testing.md`: the `TransformerBlocks` component registry entry.

### 7.4 Tracer narrative

Manual: open the Transformer Builder, choose "defined" and `spreadSheetToMlSchema`, switch the transformer to Blocks, collapse the root, change the build marking in Settings. Automated equivalent: `ui.blockEditor`.

### 7.5 Cleanup

No `issues/498-*` test directory is created; the MiroirTest suites keep `issue: "498"` and feature names.

### 7.6 AC checklist

| Acceptance criterion (#498) | Proof |
|---|---|
| Every transformer value in the package assets maps to a block tree without error, unmappable values counted | asset sweep (one case per file, D8) and `fn.blockModel` |
| A `ui.blockEditor` case renders a transformer in the TransformerEditor block view and finds its blocks and slots | `ui.blockEditor` / TransformerEditor cases |
| The block editor chunk stays out of the eager bundle | bundle guard (`defeated` rule) on a fresh build |

### Validation

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

### Realization
