# #303 follow-up issues

Opened on 2026-09-26: 1 → #305, 2 → #304, 3 → #306, 4 → #307.

Written in Slice 7: the agent that implemented #303 had no access to open GitHub issues. Each section below is one issue: the heading is the title, the text under it the body. Evidence references point to [`tdd-implementation-plan.md`](./tdd-implementation-plan.md) (Realization of the named slice) and [`analysis.md`](./analysis.md).

---

## 1. Component tests: `extractValuesFromRenderedElements` misreads literals, empty containers, recursive references and `any` file branches

**Context.** The #303 test pattern (`JzodTestPattern_ComponentTestSuite`, `26ef2886-2cd8-4f91-b846-1525b24d5f41`) compares the whole rendered value of one object holding every editor type with `expectRenderedValues`. Several branches are read wrongly by the extractor (`extractValuesFromRenderedElements`, used by `expectRenderedValues`), so the pattern leaves them out of the comparison with `ignorePaths` and checks each with an `expectElement` (#303 analysis §3.3, Slice 1 and Slice 4 Realizations).

| Branch | Rendered value read by the extractor | Expected |
|---|---|---|
| `aLiteral: "fixed"` | moved to a stray `testField: {aLiteral: "fixed"}` subtree | `aLiteral: "fixed"` at its place, no `testField` key |
| `anEmptyArray: []`, `anEmptyRecord: {}` | absent | `[]`, `{}` |
| `aNestedObject.level1.level2.items[1].tags: []` | absent | `[]` |
| `aReference` (recursive `schemaReference`) | `{label: "root"}` | the whole tree (blocked by issue 2 below: the children are not rendered) |
| `anAnyFile` (`any` + `display.any.format: "file"`) | nothing (`JzodAnyEditor` renders a file selector, not a form field) | `""` (or the loaded file value) |

**Goal.** Fix the extractor so that each branch reads its true value, then remove its entry from `ignorePaths` in the 4 pattern leaves (and in the pattern leaf of `JzodEditorRenderPerformance_ComponentTestSuite` if it gets a comparison). The `expectedValue`s already hold the true values: removing the `ignorePaths` entry is the only change needed in the JSON. Remove the matching `expectElement` checks once the comparison covers the branch.

**Acceptance.** `ignorePaths` of the pattern leaves is empty (or only holds `aReference` until issue 2 is fixed); the 68 per-editor cases still pass (the extractor is shared by them).

---

## 2. JzodElementEditor: a recursive `schemaReference` with a local `context` does not render its array items

**Observed (#303 Slice 0, probe R4).** Schema: an object with `aReference: {type: "schemaReference", context: {node: {type: "object", definition: {label: {type: "string"}, children: {type: "array", optional: true, definition: {type: "schemaReference", definition: {relativePath: "node"}}}}}}, definition: {relativePath: "node"}}`. Value: `{aReference: {label: "root", children: [{label: "child", children: [{label: "grandchild"}]}]}}`.

- The rebuilt value is `{"aReference": {"label": "root"}}`; `"root"` is displayed, `"child"` and `"grandchild"` are not.
- The `children` array is unfolded (its `+ v ^ × ⧉` buttons render), and item 0 renders the error boundary "Something went wrong in JzodArrayEditor … array testField.aReference.children.0" with `resolveJzodSchemaReferenceInContext could not resolve reference {"relativePath":"node"} … relativeReferenceJzodContext keys {}`.
- No fold / unfold action shows the children.

**Cause (probable).** The local `context` of the enclosing `schemaReference` is not passed down to the items of an array inside the referenced schema: the item's `schemaReference` is resolved with an empty relative context.

**Goal.** Pass the local reference context down to array (and probably record / tuple) items, so recursive structures render at every depth.

**Acceptance.** The probe above renders `child` and `grandchild` with no error boundary; in `JzodTestPattern_ComponentTestSuite`, `aReference` can leave `ignorePaths` (with issue 1).

**Resolution (#304).** Already fixed by #296 (keyMap entries of relative schema references carry their resolution context): the Slice 0 probe ran on a miroir-core build older than #296. On a fresh build the probe renders `child` and `grandchild`, and the extractor reads the whole tree, so `aReference` left `ignorePaths` with no extractor change. Reverting the #296 `keyMapRawSchema` line in `mlsTypeCheck.ts` brings back the rebuilt value `{aReference: {label: "root"}}`.

---

## 3. Render measurements: store the results of `measureRendering` across runs for comparison

**Context.** #303 added the `measureRendering` step: per component and mode (`remount` / `update`), `count`, `minMs`, `medianMs`, `maxMs`, `totalMs` and a `(total)` row, in `assertionMeasurements` of the leaf's `TestAssertionResult`, in the log (logger `runReactComponentTest`, `info`) and in a table in Miroir Tests. Nothing is kept after the run: comparing two runs (before / after a change, vitest vs browser) means copying tables by hand. Timing budgets were left out on purpose (#303 D9: happy-dom timings are not browser timings; tracking costs about +5 %).

**Goal.** Store the measurements of a run (instance, leaf, mode, component, numbers, environment: vitest / browser, date, commit if known) and show a comparison with an earlier run: in the app (Miroir Tests) and / or as a file written by the vitest entry when `MIROIR_COMPONENT_PERF=1`.

**Open questions.** Where to store (an Entity of the Miroir or admin application, a file under `test-results/`), how to identify comparable runs, whether a regression threshold is wanted (still not a pass / fail by default).

---

## 4. (optional) `testByFile`: `--bail=1` hides later cases, and `-t` patterns with spaces are split

**Observed (#303 Slices 0 and 6).**

- `packages/miroir-standalone-app/scripts/test-by-file.ts` always passes `--bail=1` to vitest. After one failing case, the later cases of the run are reported as not run (Slice 0: with one failing check, 2 of 75 tests ran, 73 not run; the same entry through `npx vitest run` without bail ran all 75 and reported 4 failures). `testByFile … --bail=0` is rejected by vitest ("Expected a single value for option --bail").
- The script spawns vitest with `shell: true`, so `-t "a b"` reaches the shell as `-t a b`: `b` becomes a file filter and other files may run silently (Slice 6).

Current workaround (documented in `docs/reference/testing.md`): run `npx vitest run --reporter=verbose <file>` from the package to see every failure; write `.` for each space in a `-t` pattern.

**Goal.** Let `testByFile` accept a bail override (for example `--no-bail` or honoring a user `--bail=<n>`), and spawn vitest without a shell (or quote the arguments) so that arguments are passed as given.
