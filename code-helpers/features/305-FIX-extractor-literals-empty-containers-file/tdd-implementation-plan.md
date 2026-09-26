# Issue #305 — TDD Implementation Plan

> Integration-first, no mocks. Every slice is proven through the public MiroirTest step `expectRenderedValues` of `MlTestPattern_ComponentTestSuite`, run by the real component runner (component entry `miroir-component-tests`), and guarded by the 68 per-editor cases that share the extractor.

**Resume note (2026-09-26):** all slices ✅ DONE; PR into `_integration`.

## Scope

- In: literal input name and prefix filter (D2, D3); empty-container markers (D4); file `any` hidden input (D5); removal of the matching `ignorePaths` entries and `expectElement` stand-ins in the 4 pattern leaves.
- Out: `aReference` (#304, stays under `ignorePaths`), typed literals, #306, #307.

Related: [analysis](./analysis.md) · issue https://github.com/miroir-framework/miroir/issues/305 · branch `claude/project-thread-lfvhbu` (from `_integration`, which carries #303) · PR into `_integration`.

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Baseline | ✅ DONE | component entry 74 passed / 15 skipped (45 s) |
| 1 | Literal in place, no stray keys | ✅ DONE | pattern leaves without `aLiteral`, `testField`; component entry 74 passed |
| 2 | Empty containers read as `[]` / `{}` | ✅ DONE | pattern leaves without `anEmptyArray`, `anEmptyRecord`, `items.1.tags`; component entry 74 passed |
| 3 | File `any` field read (and `aReference`) | ✅ DONE | pattern leaves without `ignorePaths`; component entry 74 passed |
| 4 | Docs, nonreg, AC | ✅ DONE | nonreg filesystem 65 passed / 7 failed, none from #305 |

## Locked implementation defaults

Decision record D1–D7 of the analysis, unchanged.

## Allocated UUIDs / keys

None: no new model element. Markup keys: `data-ml-empty-container` (`"array"` | `"object"`), `data-ml-name`, `data-ml-json`.

## Test execution conventions

| Purpose | Command |
|---|---|
| Pattern suite | `npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "MlTestPattern"` |
| Component entry (68 cases + pattern) | `npm run testByFile -w miroir-standalone-app -- miroir-component-tests` |
| Rebuild the deployment after JSON edits | `npm run build -w miroir-test-app_deployment-miroir` |
| Consistency | `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency` |
| Type-check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json` |
| Safety net | `npm run nonreg:filesystem` (Slice 4) |

---

## Slice 0 — Baseline

**Status:** ✅ DONE

### Realization

The package `dist/` folders of the cloud container were built from an older commit (before the Jzod → ML rename): the pattern leaf failed with `Cannot read properties of undefined (reading 'name')`. After rebuilding `miroir-test-app_deployment-miroir`, `-admin`, `miroir-core`, the local caches, the bundled / filesystem / indexedDb stores and `miroir-react`, the component entry gives 74 passed / 15 skipped (the perf suite), 45.4 s. The #303 suite is named `MlTestPattern` since the rename.

---

## Slice 1 — Literal in place, no stray keys

**Status:** ✅ DONE

**RED.** Remove `aLiteral` and `testField` from `ignorePaths` in the 4 leaves, and the `aLiteral` `expectElement` of leaf 1. The pattern fails at `aLiteral` (absent) with a stray `testField` key.

**GREEN.** `MlLiteralEditor`: `name={formikRootLessListKey}` on the read-only input. Extractor: the generic input pass skips names outside the `label.` prefix (D3).

**Refactor checkpoint.** The prefix test is repeated inline in the checkbox, combobox and select passes: one helper.

### Validation

Pattern suite; component entry; tsc.

### Realization

- RED: `-t "MlTestPattern"` 1 failed, first difference at `["testField"]` (rebuilt `testField: {aLiteral: "fixed"}`, `aLiteral` absent).
- GREEN: `name={formikRootLessListKey}` on the literal input; `isUnderLabel` (the name equals the label or lies under it) guards the generic input pass. The literal is read by that pass as a string.
- Component entry 74 passed / 15 skipped (68 per-editor cases unchanged); tsc miroir-standalone-app 0 errors.
- Refactor checkpoint: the checkbox and combobox passes already test the prefix with `startsWith(label)`; left as is, since `isUnderLabel` is stricter (it rejects `labelX`) and changing them is outside the failing branches.

---

## Slice 2 — Empty containers read as `[]` / `{}`

**Status:** ✅ DONE

**RED.** Remove `anEmptyArray`, `anEmptyRecord`, `aNestedObject.level1.level2.items.1.tags` from `ignorePaths` and their 3 `expectElement` stand-ins.

**GREEN.** `MlArrayEditor` and `MlObjectEditor` roots: `data-ml-empty-container` + `data-ml-name` when the value at the key is an empty array / object. Extractor: seed `[]` / `{}` for each marked element under the prefix that has no extracted key below it.

**Refactor checkpoint.** none planned.

### Validation

Pattern suite; component entry; tsc.

### Realization

- RED: the Slice 1 run already showed the three branches absent (`items: [{id:1,tags:["x"]},{id:2}]`, no `anEmptyArray` / `anEmptyRecord`); with their `ignorePaths` entries and 3 `expectElement` stand-ins removed, the pattern leaves compare them.
- GREEN: new module `ValueObjectEditor/renderedValueMarkers.ts` (attribute names, `emptyContainerMarker`, `isPlainObjectValue`), used by the `MlArrayEditor` and `MlObjectEditor` roots and by the extractor, which seeds `[]` / `{}` for each marked element strictly under the field with no value read below it.
- Deviation 1: `checkRenderedValues` dropped every array-valued entry as an option list; it now keeps empty arrays (option lists are only created with a first option, so never empty).
- Deviation 2: first run, 1 per-editor case failed (`MlObjectEditor: object with 2 optional attributes can have the only attribute value deleted…`, rebuilt `{TESTSECTION: {testField: {}}}` instead of `{}`): the field under test is itself the empty object, and its name equals the label, so the prefix is not removed. The marker of the field under test is now skipped: the rebuilt value of an empty map is already `{}`. An empty array as the field under test still rebuilds as `{}`, as before.
- Component entry 74 passed / 15 skipped; `extractValuesFromRenderedElements.test` 4, `extractValuesScoped.286` 2, `extractorOpenCombobox.292` 4, `componentMiroirTests.286` 3, `componentMiroirTests.consistency` 6 passed; tsc 0.

---

## Slice 3 — File `any` field read

**Status:** ✅ DONE

**RED.** Remove `anAnyFile` from `ignorePaths` and the "Select File" `expectElement`.

**GREEN.** `MlAnyEditor` file branch: hidden input with the formik name; string values as is, others as JSON with `data-ml-json="true"`. Extractor: parse inputs flagged `data-ml-json`.

### Validation

Pattern suite; component entry; tsc.

### Realization

- RED: `anAnyFile` was absent from every rebuilt value so far (Slice 1 output).
- GREEN: `hiddenValueInputProps` in `renderedValueMarkers.ts`, rendered by the `MlAnyEditor` file branch as `<input type="hidden" readOnly …>`; the extractor's generic input pass parses inputs flagged `data-ml-json`. A loaded file (object value) is not exercised by the pattern.
- Deviation (D6 moot): the #304 thread found that `aReference` renders its children on `_integration` since #296 (the #303 probe used an older miroir-core build). `aReference` and its root-label `expectElement` are removed too, so `ignorePaths` is gone from the 4 leaves (the key is dropped, not left empty). The #304 PR #308 (branch `claude/project-thread-li8ifu`) edits the same arrays: whichever merges second resolves a one-line conflict per leaf to this state.
- The instance `description` is rewritten: it described the ignored branches.
- Component entry 74 passed / 15 skipped; consistency 6 passed; tsc 0.

---

## Slice 4 — Docs, nonreg, AC

**Status:** ✅ DONE

- `docs/reference/testing.md`: the extractor reads literals, empty containers and file fields; `ignorePaths` holds only `aReference` in the pattern.
- `npm run nonreg:filesystem`; compare failures with the known list (memory `jzod-to-ml-rename`).

| AC | Proof |
|---|---|
| `ignorePaths` empty or only `aReference` | no `ignorePaths` left in the 4 leaves of `26ef2886-….json` (enumerated) |
| 68 per-editor cases pass | component entry 74 passed / 15 skipped |

### Realization

- Docs: `docs/reference/testing.md` (`expectRenderedValues` reading rules: prefix filter, markers; test pattern without `ignorePaths`; the ignored-branches table replaced by one sentence), `docs/contributing/testing.md` (link text).
- `npm run nonreg:filesystem`, snapshot `test-results/nonreg/20260926T211532Z`: 65 passed, 7 failed. Known on a clean base: `integ-transformer-miroirCoreTransformers`, `appstack-uiIntegrationTestLauncher.integ`, `appstack-MiroirTestDisplayIntegrationLaunch`, `appstack-MiroirTestListIntegrationLaunch`. Container only: `unit-301-agent-tooling` (`No module named pytest`), `unit-275-cursor-sdk` (`jzodToCopilotKitParameter is not a function`: the name is not in the current source, a stale package build). Passed: `appstack-miroir-component-tests`, `unit-286-…`, `unit-292-…`, `unit-303-…`.
- No issue-scoped test directory was created, so there is nothing to clean up.

---

## Review follow-up (Greptile on PR #310)

- P1, empty array as the field under test: `expectRenderedValues {field: "testField.anEmptyArray", expectedValue: []}` rebuilt `{}`. Adding this step to the display leaf also showed that a narrower `field` read every value of the pattern: the `miroirInput` passes and the first select pass did not check the prefix. Fix: `isUnderLabel` (on the name or the id) guards those passes too, and `checkRenderedValues` returns `[]` when nothing was read and the field's own editor carries the empty-array marker.
- P2, file selector coverage: the `expectElement byText "Select File"` check is back in the display leaf, next to the hidden-input comparison.
- The display leaf gains 3 steps: `anEmptyArray alone` (`[]`), `anEmptyRecord alone` (`{}`), `anAnyFile file selector`.
- Component entry 74 passed / 15 skipped; nonreg steps `unit-286`, `unit-292`, `unit-303`, `appstack-274` passed (filesystem); `extractValuesFromRenderedElements.test` 4 passed; tsc 0.
