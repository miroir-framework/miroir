# Issue #303 — TDD Implementation Plan

> Vertical TDD slices, RED then GREEN, integration-first per `docs/contributing/testing.md`. Tests render the real `JzodElementEditor` through the real MiroirTest walk (`runMiroirTests._runMiroirTestSuite`) and the real component test runner, with the real render insight registry. No mocks. The applicative interface is the MiroirTest JSON (new instances, new step, new fields); vitest files are used only where noted, with a one-line reason. Slice 1 is the tracer: the test pattern displays from JSON.

**Resume note (2026-09-26):** All slices 0-7 ✅ DONE. Final validation (Slice 7): tsc miroir-core / miroir-react / miroir-standalone-app / miroir-test-app_deployment-miroir 0 / 0 / 1 (baseline `JzodElementEditorHooks.ts(528,59)`) / 0; full nonreg, default tier, filesystem profile (user instruction), snapshot `test-results/nonreg/20260926T193952Z`: 69 passed, 2 failed, none caused by this branch (`integ-transformer-miroirCoreTransformers`: pre-existing since #265 on the filesystem profile, the `unpivot keeps explicit nulls…` test has no non-SQL expected value; `unit-286-react-component-miroir-tests`: known flaky `componentTestSandbox.286.phase4` case, passes on rerun, fails 1 in 5 alone with and without the Slice 7 change). New nonreg step `unit-303-test-pattern-and-render-performance` (unit tier); the perf suite stays out of every tier. Docs: `docs/reference/testing.md` (Test pattern, Render measurements, `runOnDemand`, testByFile limits) and `docs/contributing/testing.md`. Follow-up issue texts in [`follow-ups.md`](./follow-ups.md) (to open by the user). Pending for the user: open the follow-up issues; the Slice 6 app check (dev app, N=1 then N=10); the #238 migration of `issues/303-*` when #303 closes.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/303
Working branch: to be created from `origin/_integration` (256e625 at plan time) when implementation starts.

---

## Scope

- In: `JzodTestPattern_ComponentTestSuite` (display + interaction leaves); `expectRenderedValues.ignorePaths`; render insight tracking in every JzodElementEditor component; `initialShowPerformanceDisplay` on `MiroirContextReactProvider`; runner `remount` / `rerender`; step `measureRendering`; `assertionMeasurements` on `TestAssertionResult`; `runOnDemand` on `reactComponentTestSuite`; `JzodEditorRenderPerformance_ComponentTestSuite`; iterations override and measurement table in Miroir Tests; docs and nonreg.
- Out (analysis §5): extractor fix for the ignored branches, stored measurements across runs, timing budgets, FK / Library data, other components, `RenderPerformanceMetrics` rework.

---

## Progress summary

| Slice | Title | Complexity | Status | Primary proof |
|---|---|---|---|---|
| 0 | Baselines and probe checks | S | ✅ DONE | baseline table; R4 / R5 decided |
| 1 | Tracer: test pattern displayed (`ignorePaths`) | M | ✅ DONE | `-t "JzodTestPattern"` 1 passed (1.6 s); full entry 71 passed (69 leaves + 2 checks), 33.8 s |
| 2 | Test pattern interactions | S | ✅ DONE | `-t "JzodTestPattern"` 4 passed (1.7 / 2.1 / 1.6 / 3.4 s); full entry 74 passed (72 leaves + 2 checks), 40.5 s |
| 3 | Every editor reports its renders | M | ✅ DONE | `renderInsightCoverage.303.phase3` 4 passed (10 editor ids timed); full entry 74 passed, 45.4 s; tracking overhead on the pattern ≈ +5 % (R1) |
| 4 | `measureRendering` step, measurements in the test result | L | ✅ DONE | `measureRendering.303.phase4` 5 passed (tracker and `generateTestReport` rows carry `assertionMeasurements`: remount / update, count 2 at N=2, 1 with `iterationsOverride` 1); full entry 74 passed, 42.8 s |
| 5 | Render-performance suite, on-demand gating | M | ✅ DONE | `MIROIR_COMPONENT_PERF=1 … -t "JzodEditorRenderPerformance"` 15 passed, 74 skipped, 13.5 s (tests 7.6 s); default entry 74 passed, 15 skipped, 42.7 s |
| 6 | Miroir Tests: iterations override and measurement table | M | ✅ DONE | `renderPerformanceRunControls.303.phase6` 3 passed (field only for the perf suite; run at field 1 → 15 tables, every count 1; Run all: 15 perf leaves skipped with the reason, transformer suite 5 ok), 14.2 s; component entry 74 passed / 15 skipped; bundle guard 4 passed; app check by the user pending |
| 7 | Docs, nonreg, cleanup, AC | S | ✅ DONE | `unit-303-…` step 3 files passed (35.8 s); full nonreg (filesystem) 69 passed / 2 failed, both not from this branch (pre-existing #265 filesystem gap, known 286 flake); tsc 0 / 0 / 1 (baseline) / 0; AC table filled |

Complexity: S = one focused change, M = several files in one package, L = several packages or a schema rebuild plus runtime.

---

## Locked implementation defaults

Copied from [`analysis.md`](./analysis.md) §2. Deviations go in the slice Realization.

| Decision | Choice |
|---|---|
| D1 | New instance `JzodTestPattern_ComponentTestSuite`, suite `JzodTestPattern`, component `JzodElementEditor` |
| D2 | Every editor type in one object; display leaf + interaction leaves share the suite props |
| D3, T1 | One `expectRenderedValues` with `ignorePaths` for the branches of analysis §3.3, each ignored branch checked by `expectElement` |
| D4 | No FK, no reference to another application's instances |
| D5, T4 | `measureRendering.mode`: `remount`, `update`, or `both` (reported separately); `update` alternates leaf props and `updateProps` |
| D6, T2, T3 | Measurements from `renderInsightRegistry`; every editor component calls `trackRender` with `durationMs`; the wrapper turns tracking on through `initialShowPerformanceDisplay` |
| D7 | Step `{step:"measureRendering", label?, iterations, mode, updateProps?}` |
| D8, T7 | Number field next to the unit run button; passed as `iterationsOverride` to `createReactComponentTestRunner` for that run |
| D9 | No pass / fail on timing; the step fails only if rendering fails or no measurement is collected |
| D10, T5 | `measurements` on the runner `ok` result → `assertionMeasurements` on `TestAssertionResult`; per `componentId` and mode: `count`, `minMs`, `medianMs`, `maxMs`, `totalMs`; also logged |
| D11, T6 | `runOnDemand: true` on the performance suite; vitest entry skips it unless `MIROIR_COMPONENT_PERF=1`; default N=3 |
| T8 | One MiroirTest schema rebuild (Entity + EntityVersion) in Slice 1 carrying `ignorePaths`, `measureRendering`, `runOnDemand`; one miroir-core `devBuild` (also `assertionMeasurements`). Kinds not implemented yet fail with `step <n> (<kind>): not implemented` (as #292 T12) |

---

## Allocated UUIDs / keys

| Element | UUID / key |
|---|---|
| MiroirTest `JzodTestPattern_ComponentTestSuite` | `26ef2886-2cd8-4f91-b846-1525b24d5f41` |
| MiroirTest `JzodEditorRenderPerformance_ComponentTestSuite` | `2da30877-d248-44bd-9786-5c091b1bc8fc` |
| `reactComponentTestSuite` labels | `JzodTestPattern`, `JzodEditorRenderPerformance` |
| Env var | `MIROIR_COMPONENT_PERF=1` |
| Issue test dirs | `packages/miroir-standalone-app/tests/4_view/issues/303-test-pattern-and-render-performance/` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Component entry (all) | `npm run testByFile -w miroir-standalone-app -- miroir-component-tests` |
| One suite | `npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodTestPattern"` |
| Performance suite | `MIROIR_COMPONENT_PERF=1 npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodEditorRenderPerformance"` |
| Issue vitest file | `npm run testByFile -w miroir-standalone-app -- <name>.303.phaseN` |
| Consistency | `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Type-check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` for miroir-core, miroir-react, miroir-standalone-app |
| Safety net | `npm run nonreg` (Slice 7), `npm run nonreg -- --only appstack-miroir-component-tests` per slice |

---

## Slice 0 — Baselines and probe checks

**Status:** ✅ DONE

Goal: lock what later slices compare against and settle analysis R4 and R5.

- Record: component entry duration and counts (7 instances, 68 leaves), tsc error lists of miroir-core, miroir-react, miroir-standalone-app, nonreg baseline failures.
- R4: render the recursive `schemaReference` branch of the draft pattern alone; decide whether `children` is folded (then the pattern unfolds it with a step) or not rendered (then open a bug issue and keep the branch under `ignorePaths`).
- R5: make one component case fail on purpose without `-t` and check whether later suites are still collected and reported. If not, record it as a Slice 1 fix.
- R1: measure one editor case with tracking on versus off to size the chip overhead; record it.

### Validation

- `npm run testByFile -w miroir-standalone-app -- miroir-component-tests` (baseline duration and counts).
- The three tsc commands (baseline lists saved next to this plan as `baseline-tsc-*.txt`).

### Realization

Branch `303-FEATURE-test-pattern-and-render-performance` at 917f176.

| Baseline | Result |
|---|---|
| `miroir-component-tests` | 70 tests passed (2 entry checks + 68 leaves, 7 instances); vitest 41.3 s (collect 13.2 s, tests 27.0 s), wall 43.9 s |
| tsc miroir-core | 0 errors (`baseline-tsc-miroir-core.txt`) |
| tsc miroir-react | 0 errors (`baseline-tsc-miroir-react.txt`) |
| tsc miroir-standalone-app | 1 error, pre-existing: `JzodElementEditorHooks.ts(528,59)` TS2339 `name` on `EntityInstance` (`baseline-tsc-miroir-standalone-app.txt`) |
| `npm run nonreg:unit` (snapshot `test-results/nonreg/20260926T180650Z`) | 32 pass, 2 fail: `unit-301-agent-tooling` environment-unavailable (`No module named pytest`); `unit-286-react-component-miroir-tests` flaky: `componentTestSandbox.286.phase4` "a second display's Run during an active run is refused…" (10 of 12 cases rendered in the first sandbox), passes 5/5 when rerun alone |
| full nonreg | not run in Slice 0 (no earlier snapshot under `test-results/nonreg/`); compared at Slice 7 |

**R4 — real rendering defect, not folding.** Probe (temporary instance, deleted): the `aReference` schema of analysis §3.3 wrapped in an object, value `{aReference: {label:"root", children:[{label:"child", children:[{label:"grandchild"}]}]}}`. Results: rebuilt value `{"aReference":{"label":"root"}}`; `byDisplayValue "root"` found, `"child"` and `"grandchild"` not found; no `default case` text. The only inputs rendered are `TESTSECTION.testField.aReference.label` plus the structure switches of `testField`, `aReference`, `aReference.children`. The `children` array is unfolded (its buttons `+ v ^ × ⧉` render), and item 0 renders the error boundary "Something went wrong in JzodArrayEditor … array testField.aReference.children.0" with `resolveJzodSchemaReferenceInContext could not resolve reference {"relativePath":"node"} … relativeReferenceJzodContext keys {}`: the local `context` of the enclosing `schemaReference` is not passed down to the array items. No fold / unfold step can show the children. Consequence: the pattern keeps `aReference` under `ignorePaths`, checked by `expectElement` on the root label only (or the branch is dropped from the pattern); a bug issue is opened (Slice 7 list).

**R5 — real, but the cause is `--bail=1`, not the entry.** `packages/miroir-standalone-app/scripts/test-by-file.ts` always passes `--bail=1` to vitest. With the probe instance in place (entry count check failing first), `testByFile … miroir-component-tests` without `-t` ran 2 of 75 tests and listed the other 73 as not run. The same entry through `npx vitest run --reporter=verbose --poolOptions.forks.singleFork miroir-component-tests` (same env, no bail) ran all 75: 4 failed, 71 passed, every suite reported. `describe(async …)` + `rethrowComponentTestFailures` only fails the leaf's own `it`. `testByFile … --bail=0` is rejected by vitest ("Expected a single value for option --bail"). The #291 G6 observation (81 collected, 74 reported) is the same bail.

**R1 — deferred to Slice 3** (tracking cannot be turned on in the test wrapper before `initialShowPerformanceDisplay`).

Deviation: none in scope; the Slice 1 R5 item changes (see Slice 1 GREEN).

---

## Slice 1 — Tracer: test pattern displayed

**Status:** ✅ DONE

Goal: a maintainer runs `-t "JzodTestPattern"` and sees the pattern render with its value checked, from JSON only.

**RED**
- New instance `26ef2886-…` (`JzodTestPattern_ComponentTestSuite`) with the pattern schema and value of analysis §3.3 (final shape from Slice 0), one display leaf: `expectRenderedValues {field:"testField", ignorePaths:[…], expectedValue}` plus `expectElement` checks for each ignored branch. Fails: `ignorePaths` is not in the schema (modelValidation) and not honored by the interpreter.
- Entry counts move to 8 instances / 69 leaves; `componentMiroirTests.consistency` and `componentTestInstances.292.phase1` counts updated first (red until the instance is wired).

**GREEN**
- Schema (T8): add `ignorePaths` to `expectRenderedValues`, `measureRendering` step object, `runOnDemand` on `reactComponentTestSuite`, in the MiroirTest Entity and its EntityVersion; rebuild; `devBuild`.
- Interpreter: remove each dot path from actual and expected before the comparison; `measureRendering` handler throws `not implemented`.
- Wire the instance: exports in `miroir-test-app_deployment-miroir` (`index.ts`, `index.d.ts`), `defaultMiroirMetaModel.tests`.
- R5 (Slice 0): no entry change needed; the abort is `--bail=1` in `scripts/test-by-file.ts`. **User input needed:** keep bail (document that a failing case hides the later ones, run `npx vitest run …` to see all), or let `testByFile` accept a bail override. Default if no answer: keep bail, document it in Slice 7.
- R4 (Slice 0): `aReference` children do not render (reference context lost in array items); keep the branch under `ignorePaths` with an `expectElement` on the root label.

**Refactor checkpoint:** the ignore helper sits next to the existing `path` selection of `expectRenderedValues`, not in a new module.

### Validation

- `… miroir-component-tests -t "JzodTestPattern"` green; full entry green with 69 leaves.
- `componentMiroirTests.consistency` green; modelValidation of `miroir-test-app_deployment-miroir` (part of its build).
- tsc: no new error against Slice 0.

### Realization

**RED observed.**
- Counts updated first: vitest entry `EXPECTED_INSTANCE_COUNT` 8 / `EXPECTED_LEAF_COUNT` 69; `componentMiroirTests.consistency` 8 instances; `componentTestInstances.292.phase1` gets a `laterComponentInstances` list (`JzodTestPattern_ComponentTestSuite` → `26ef2886-…`): the "no other instance holds a component leaf" check allows it, and the export / `defaultMiroirMetaModel.tests` check requires it.
- Instance `26ef2886-2cd8-4f91-b846-1525b24d5f41.json` (generated once from the Slice 0 draft, 2-space JSON like the other instances; the draft's 21 attributes unchanged). One leaf `JzodTestPattern: every editor type displays its value`: `expectRenderedValues {field:"testField", ignorePaths:[aLiteral, testField, aReference, anEmptyArray, anEmptyRecord, aNestedObject.level1.level2.items.1.tags]}`, then 5 `expectElement`: `byDisplayValue "fixed"` (literal), `byDisplayValue "root"` + `fieldName testField.aReference.label`, the add buttons of `anEmptyArray`, `anEmptyRecord` (`addRecordEntry`) and `items.1.tags`. `expectedValue` keeps the true value of the ignored branches (bigint as string, date as displayed), so removing an entry of `ignorePaths` after the extractor fix is the only change needed.
- `-t "JzodTestPattern"`: 1 failed, `step 1 (expectRenderedValues "initial"): … First difference at path: ["aReference","children"]`; the rebuilt value matched analysis §3.3 exactly (stray `testField: {aLiteral}`, `aReference: {label:"root"}`, empty containers and `items[1].tags` absent).
- With the old Entity / EntityVersion restored, `componentMiroirTests.consistency` fails its `jzodTypeCheck` case on the new instance (`ignorePaths` unknown).

**GREEN.**
- Schema (T8), same edit in the Entity and its EntityVersion (`51c647fe-…`): `reactComponentTestSuite.runOnDemand?: boolean`; `expectRenderedValues.ignorePaths?: string[]`; step `measureRendering {step, label?, iterations: number, mode: "remount"|"update"|"both", updateProps?: record<any>}` appended to `reactComponentTestStep`. `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` (generated `miroirFundamentalType.ts` / `miroirFundamentalJzodSchema.ts` updated).
- Interpreter (`runComponentTestSteps.ts`): `withoutIgnoredPaths(value, ignorePaths)` next to `valueAtPath` removes each dot path (numeric segment on an array: the item is spliced) from a `structuredClone` of the actual value (after `path`, before `$options`) and of `expectedValue`; the mismatch reports the stripped values. `measureRendering` handler throws `not implemented`: a temporary step gave `step 1 (measureRendering): not implemented` (reverted).
- Wiring: `miroirTest_JzodTestPattern_ComponentTestSuite` in `index.ts`, `index.d.ts`, `src/Model.ts` (import + `defaultMiroirMetaModel.tests`).
- Non-vacuity (reverted): `aString` "hellox" in `expectedValue` → step 1 fails; `byDisplayValue "rootx"` → `step 3 (expectElement "aReference root label"): no element matches target …`.

**Validation.**
| Command | Result |
|---|---|
| `… miroir-component-tests -t "JzodTestPattern"` | 1 passed, 70 skipped; leaf 1.6 s |
| `… miroir-component-tests` | 71 passed (2 checks + 69 leaves); 33.8 s (tests 28.0 s) vs 41.3 s at Slice 0 (machine variance) |
| `componentMiroirTests.consistency` | 6 passed |
| `componentTestInstances.292.phase1` / `componentTestSchema.292.phase1` / `legacyRemoved.292.phase6` / `componentTestSteps.292.phase2` | 5 / 11 / 9 / 14 passed |
| `npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts` | 160 passed |
| `npm run test -w miroir-core -- ''` | 156 files passed, 1 skipped; 2024 tests passed, 1 skipped |
| tsc miroir-core / miroir-react / miroir-standalone-app | 0 / 0 / 1 (the baseline `JzodElementEditorHooks.ts(528,59)`) |

**Deviations.**
- The Validation line "modelValidation … (part of its build)" is wrong: `npm run build -w miroir-test-app_deployment-miroir` is `tsup` only; modelValidation was run separately (`testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts`).
- `runOnDemand` is in the schema but not honored (Slice 5). No entry change for R5 (bail stays, user input still open).
- R4 defect (`aReference` children not rendered) unchanged; recorded in the instance `description`; issue to open in Slice 7.

---

## Slice 2 — Test pattern interactions

**Status:** ✅ DONE

Goal: the pattern suite also proves that editing works across nested editors.

**RED** — new leaves in `JzodTestPattern` (existing vocabulary only):
- change a deep leaf (`aNestedObject.level1.level2.leaf`) and the enum, then `expectRenderedValues` on those paths;
- switch `aSimpleUnion` from number to string (`toggleUnionTypeSelector`, `selectOption` with `select:"unionType"`);
- add and delete an array item (`clickArrayButton`), rename a record entry (`renameRecordEntry`), add the absent optional attribute (`clickObjectButton addOptionalAttribute`).

**GREEN** — none expected; any failure is either a product defect (own issue, leaf kept with the defect recorded in Realization) or a missing widget target (added to `componentTestTargets.ts`).

**Refactor checkpoint:** keep the suite at 3–4 leaves (analysis §3.4: about 2.5 s per leaf); merge interactions into one leaf if the entry grows by more than 10 s.

### Validation

- `… -t "JzodTestPattern"` green; entry duration recorded against Slice 0.

### Realization

Three leaves added to `26ef2886-…` (4 leaves in the suite, grouped as the RED bullets), existing vocabulary only; each ends with the display leaf's whole-value `expectRenderedValues` (same `field`, same `ignorePaths`, expected value = display value with the edits), so an edit that changes another editor's value fails too.

| Leaf | Steps | Expected change |
|---|---|---|
| `a deep leaf and the enum can be edited` | `change` on `{byRole:"textbox", fieldName:"testField.aNestedObject.level1.level2.leaf"}`; `selectOption` `testField.anEnum` `blue` | `leaf: "changed"`, `anEnum: "blue"` |
| `the simple union switches from number to string` | `toggleUnionTypeSelector` `testField.aSimpleUnion`; `expectElement` union `selectState` selected `number`; `selectOption` `select:"unionType"` `string`; selector gone (timeout 3000); comparison (timeout 3000) | `aSimpleUnion: ""` |
| `array items, record entries and optional attributes can be added, removed and renamed` | `clickArrayButton` `testField.anArray` `add`, then `delete` index 0; `renameRecordEntry` `testField.aRecord` `k1` → `renamed`; `clickObjectButton` `testField` `addOptionalAttribute` `anAbsentOptional` | `anArray: ["b","c",""]`, `aRecord: {renamed:1, k2:2}`, `anAbsentOptional: 0` |

**RED / GREEN.** As the plan expected, no GREEN code: the three leaves passed on their first run. No product defect found, no widget target missing (`componentTestTargets.ts` unchanged, so no `303` target unit test). The only RED is the entry count, `EXPECTED_LEAF_COUNT` 69 → 72 (the other counts, `componentMiroirTests.consistency` 8 instances and `componentTestInstances.292.phase1` 68 per-editor leaves, do not change). Non-vacuity instead (reverted): with the pre-edit value put back in each final `expectedValue` (`anEnum` `green`, `aSimpleUnion` 3, `aRecord` `{k1,k2}`), `npx vitest run … -t "JzodTestPattern"` without bail gives 3 failed / 1 passed, first differences at `["anEnum"]`, `["aSimpleUnion"]`, `["aRecord","renamed"]`.

**Validation.**
| Command | Result |
|---|---|
| `… miroir-component-tests -t "JzodTestPattern"` | 4 passed, 70 skipped; leaves 1.7 / 2.1 / 1.6 / 3.4 s (tests 8.8 s) |
| `… miroir-component-tests` | 74 passed (2 checks + 72 leaves); 40.5 s (tests 34.8 s) vs Slice 1 33.8 s (tests 28.0 s) and Slice 0 41.3 s (tests 27.0 s): the three leaves add about 7 s of test time, under the 10 s limit of the refactor checkpoint |
| `componentMiroirTests.consistency` / `componentTestInstances.292.phase1` | 6 / 5 passed |
| `npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts` | 160 passed |
| tsc miroir-core / miroir-react / miroir-standalone-app | 0 / 0 / 1 (the baseline `JzodElementEditorHooks.ts(528,59)`) |

**Notes.** `toEqual` ignores key order, so the position of the renamed record entry is not checked. The instance `description` lists the interaction leaves. `miroir-test-app_deployment-miroir` rebuilt (`tsup`) so its `dist` carries the new leaves.

---

## Slice 3 — Every editor reports its renders

**Status:** ✅ DONE

Goal: with performance display on, every JzodElementEditor component shows up in the render insight registry with a timing.

**RED** — `tests/4_view/issues/303-…/renderInsightCoverage.303.phase3.unit.test.tsx` (vitest: asserts on a React-internal registry fed by component renders, not reachable through a MiroirTest before Slice 4): renders the pattern through `createReactComponentTestRunner` with a suite whose wrapper has tracking on, then expects `renderInsightRegistry.getSnapshot()` to contain `JzodElementEditor`, `JzodEnumEditor`, `JzodLiteralEditor`, the string / simple-type editor, `JzodAnyEditor`, the union component, `JzodArrayEditor`, `JzodTupleEditor`, `JzodObjectEditor`, `JzodRecordEditor`, each with `totalRenderTime` defined.

**GREEN**
- `MiroirContextReactProvider`: optional `initialShowPerformanceDisplay` prop overriding the `sessionStorage` initial value (T3); `buildComponentTestWrapper` gets `trackRenders?: boolean` and passes it; the runner sets it when the suite has a `measureRendering` step. The dead `isPerformanceTest` / `Profiler` branch is removed.
- Instrument the missing components with the existing `renderStartRef` + `trackRender` pattern (T2).

**Refactor checkpoint:** extract the repeated start-ref / `trackRender` lines into one hook (`useTrackedRender(componentId, formikPath)` returning the counts), used by the two existing callers and the new ones.

### Validation

- `npm run testByFile -w miroir-standalone-app -- renderInsightCoverage.303.phase3`.
- Full component entry green (tracking stays off for the existing suites: same DOM as before).
- tsc for miroir-react and miroir-standalone-app.

### Realization

**RED observed.** `renderInsightCoverage.303.phase3.unit.test.tsx` reads the `JzodTestPattern` suite and its display leaf from the instance JSON and runs the leaf through `createReactComponentTestRunner` with a suite context whose `stepKinds` contains `measureRendering`. Before instrumentation (wrapper and provider change in place): leaf `ok`, but only `JzodObjectEditor` and `JzodTupleEditor` in the registry; missing `JzodElementEditor`, `JzodEnumEditor`, `JzodLiteralEditor`, `JzodElementStringEditor`, `JzodAnyEditor`, `JzodUnionEditor`, and also `JzodArrayEditor`, `JzodRecordEditor` although instrumented (see defect below).

**GREEN.**
- `MiroirContextReactProvider` (miroir-react): optional `initialShowPerformanceDisplay` overrides the `sessionStorage` initial value (T3); `npm run build -w miroir-react`.
- `buildComponentTestWrapper`: `trackRenders?: boolean` → `initialShowPerformanceDisplay`; the dead `isPerformanceTest` / `Profiler` / `onRender` branch removed (one provider tree).
- "Suite contains a step kind": the runner only receives the suite context, not the other leaves, so the helper lives in miroir-core: `reactComponentTestSuiteStepKinds(suite)` (exported, `miroirTestSuiteWalk.ts`) and a new optional `stepKinds` on `ReactComponentTestSuiteContext`, filled by the walk. The runner builds the suite wrapper with `trackRenders: suite.stepKinds?.includes("measureRendering")`. Slice 6 reuses `reactComponentTestSuiteStepKinds(node).includes("measureRendering")`. `npm run build -w miroir-core` (no `devBuild`: no schema change). `reactComponentTestSuite.292.phase1` expected context gets `stepKinds: []`.
- Refactor checkpoint done with the GREEN: `4_view/tools/useTrackedRender.ts`. `useTrackedRender(navigationKey)` is called unconditionally at the top of the render (reads `showPerformanceDisplay`, starts the timer when on) and returns `{enabled, end(componentId, formikPath)}`; `end` is a plain function called before each measured `return`, so the id can be chosen late (array / tuple) and early returns stay legal. `editorNavigationKey(deploymentUuid, section)` keeps the existing key. No `useEffect`. Callers: `JzodArrayEditor`, `JzodObjectEditor` (their chips unchanged: `insightCounts = trackedRender.end(…)`), and the new `JzodElementEditor`, `JzodElementStringEditor` (6 returns), `JzodEnumEditor`, `JzodLiteralEditor`, `JzodAnyEditor` (2 returns). New components record only, no chip.
- Simple types: number, bigint, boolean, date, uuid are rendered inline by `JzodElementEditor` (no separate component), so they report as `JzodElementEditor`. Union: no union component exists; the `JzodElementEditor` whose declared schema is a union renders the resolved branch and the union type selector, and reports as `JzodUnionEditor` instead of `JzodElementEditor` (same scheme as array / tuple).
- **Defect fixed (#61 ids):** `JzodArrayEditor` took its role from the value-resolved schema, where every array is a `tuple`, and `JzodObjectEditor` from the resolved schema, where every record is an `object`: arrays reported (and chipped) as tuple, records as object. The declared (raw) type now decides (`array` / `tuple`, `record`), the resolved type only otherwise (under `any`, unions). App-visible change: the chip label of arrays and records in performance mode.

**Deviation — `JzodAnyEditor` is not reached by the pattern.** `anAny` (object value) renders through `JzodObjectEditor` / `JzodTupleEditor` inside any; `JzodElementEditor` renders `JzodAnyEditor` only for an `any` schema with `tag.value.display.any.format` (as `applicationBundle`, format `file`), and the 15 leaves of `JzodAnyEditor_ComponentTestSuite` do not reach it either. The test checks it on a second case (`{aFile: {type:"any", display.any.format:"file"}}`, `steps: []`); non-vacuity: with its `end` calls disabled, that case fails (`timed components: JzodElementEditor, JzodObjectEditor`). Slice 5: the "any" performance leaf needs `display.any.format` to measure `JzodAnyEditor`; adding such a branch to the pattern is a user decision (it changes the Slices 1-2 expected values).

**Test isolation problem met and solved.** `testByFile … RenderInsight` (case-insensitive) now also matches the new file; run first, it made `RenderInsightSummary` "shows empty-state copy" fail. Cause (pre-existing, not from this slice): the runner's `configureComponentTestDom` sets `@testing-library/dom` `eventWrapper` / `asyncWrapper` without `act`, global to the single vitest worker; `componentTestSteps.292.phase2` + `RenderInsightSummary` fail the same way (4 of 6) on HEAD. The new file saves `getConfig()` and `IS_REACT_ACT_ENVIRONMENT` in `beforeAll` and restores them in `afterAll`. The 286 / 292 files keep the leak (Slice 7 cleanup candidate).

**R1 (from Slice 0).** Probe (temporary vitest file, deleted): the pattern display leaf through the runner, 6 alternated rounds per mode, one fresh runner + wrapper per run. Off: 1751 / 1451 / 1251 / 1198 / 1361 / 1333 ms (median 1347); on: 1465 / 1398 / 1414 / 1346 / 1519 / 1323 ms (median 1406): about +60 ms (+4-5 %) per mount + display check, the order of the run-to-run noise. It includes the chips of the container editors and the new `performance.now()` / registry writes (one track per editor node of the pattern). Accepted (R1), to be restated in the docs (Slice 7).

**Validation.**
| Command | Result |
|---|---|
| `npm run testByFile -w miroir-standalone-app -- renderInsightCoverage.303.phase3` | 4 passed (step kinds helper; pattern: 9 ids timed, 1.6 s; `JzodAnyEditor` case 0.1 s; tracking off: empty registry and no `render-insight-header`, 1.5 s) |
| `… miroir-component-tests` | 74 passed (2 checks + 72 leaves); 45.4 s (tests 36.2 s) vs Slice 2 40.5 s (tests 34.8 s): tracking stays off, same DOM |
| `npm run testByFile -w miroir-standalone-app -- RenderInsight` | 11 files, 48 passed (incl. `RenderInsightSummary`, `RenderInsightHeader`, `jzodEditorRenderInsight`, the new file) |
| `npm run test -w miroir-core -- ''` | 156 files passed, 1 skipped; 2027 tests passed, 1 skipped |
| tsc miroir-core / miroir-react / miroir-standalone-app | 0 / 0 / 1 (the baseline `JzodElementEditorHooks.ts(528,59)`) |

---

## Slice 4 — `measureRendering` step, measurements in the test result

**Status:** ✅ DONE

Goal: a leaf with `measureRendering` produces per-component min / median / max for each mode, visible in the tracker results.

**RED**
- `tests/4_view/issues/303-…/measureRendering.303.phase4.unit.test.tsx` (vitest: checks the tracker content produced by the real walk, the vehicle #286 used for runner results): a one-leaf suite on the Enum schema with `{step:"measureRendering", iterations:2, mode:"both", updateProps:{initialFormState:"value3"}}`, run through `runMiroirTests._runMiroirTestSuite`; expects the leaf's `TestAssertionResult.assertionMeasurements` to hold `remount` and `update` entries for `JzodEnumEditor` and `JzodElementEditor` with `count >= 2` and `minMs <= medianMs <= maxMs`.
- Same file: `iterationsOverride: 1` on the runner yields `count` of 1 per mode.

**GREEN**
- `componentTestEnvironment.ts` / runner: keep the case's root; `env.remount()` and `env.rerender(propsOverride)` (T4).
- Step handler: `resetAll()`, then per iteration and mode: act, wait for progressive rendering, snapshot delta per `componentId` → samples; aggregate (T5); fail only on render error or empty samples (D9). Iterations = `iterationsOverride ?? step.iterations`.
- Runner `ok` result carries `measurements`; `ReactComponentTestTools.ts` copies them into `assertionMeasurements`; `testAssertionResult` schema in `TestInterface.ts` gains the optional field; `devBuild`.
- Log one table per leaf (component, mode, count, min, median, max).

**Refactor checkpoint:** aggregation is a pure function next to the handler; no second copy of registry reading.

### Validation

- `npm run testByFile -w miroir-standalone-app -- measureRendering.303.phase4`.
- `npm run test -w miroir-core -- ''` (result type change).
- tsc miroir-core, miroir-standalone-app; full component entry green.

### Realization

**Pre-step (coordinator decision; deviation from the Slices 1-2 scope).** The pattern did not reach `JzodAnyEditor` (Slice 3 deviation). `26ef2886-…` gets `anAnyFile: {type:"any", tag.value.display.any.format:"file"}` (after `anAny`), value `""`. The extractor reads nothing for it (RED: `First difference at path: ["anAnyFile"]`), so `anAnyFile` joins `ignorePaths` in the 4 leaves (the `expectedValue`s keep `anAnyFile: ""`) and the display leaf gets `expectElement {byText:"Select File"}` (the `FileSelector` button). Non-vacuity (reverted): `"Select Filex"` → `step 7 (expectElement "anAnyFile file selector"): no element matches target`. `-t "JzodTestPattern"` 4 passed (1.9 / 2.2 / 1.5 / 3.6 s). `renderInsightCoverage.303.phase3` now expects `JzodAnyEditor` among the pattern's timed ids too (4 passed).

**RED observed.** `measureRendering.303.phase4.unit.test.tsx`: an Enum `reactComponentTestSuite` (props of `JzodEnumEditor_ComponentTestSuite`) with `{measureRendering, iterations 2, mode both, updateProps {initialFormState:"value3"}}` then `expectElement` on the combobox value, run through `runMiroirTests._runMiroirTestSuite` inside an async `describe` (as the vitest entry) with a real `MiroirActivityTracker` and the runner registered in that `describe`'s `beforeAll`; tests registered after the walk read the tracker. Failed with `step 1 (measureRendering): not implemented`.

**GREEN.**
- miroir-core: `testAssertionResult` (`TestInterface.ts`) gains optional `assertionMeasurements: {mode: "remount"|"update", componentId, count, minMs, medianMs, maxMs, totalMs}[]`; `npm run devBuild -w miroir-core`. `ComponentRenderMeasurement` (exported) is derived from the generated type (`miroirTestTypes.ts`); `ReactComponentTestRunnerResult` `ok` gains `measurements?`; `runMiroirReactComponentTest` copies them into `assertionMeasurements`; `npm run build -w miroir-core` (the vitest run reads `dist`: the first GREEN run failed on an empty `assertionMeasurements` until this rebuild). `MiroirActivityTracker.setTestAssertionResult` stores the result object as is, and `generateTestReport` keeps it in `fullAssertionsResults`: no change needed there, the test checks both.
- `componentTestEnvironment.ts`: `mountComponent` also returns `render(element)` (same root, `flushSync`); `ComponentTestEnvironment` gains `remount()` / `rerender(propsOverride?)`, given by the runner (`caseControls`), rejecting otherwise.
- Runner: the case keeps its root, element builder and props; `remount` unmounts and mounts the same element **in the same container** with a new root (deviation from T4's "fresh container": `env.container`, the steps' query root, stays valid); `rerender` renders the leaf props with the override shallow-merged (revived), both then `waitForProgressiveRendering`. `host.iterationsOverride` → `runComponentTestSteps(env, steps, {iterationsOverride})`, which now returns `{measurements}`. A leaf with measurements logs `formatMeasurementTable` (info, logger `runReactComponentTest`) and returns `{status:"ok", measurements}`.
- `componentTests/measureRendering.ts`: `runMeasureRendering(env, step, iterations)` (`resetAll`, then per mode — `remount` before `update` — and iteration: act, wait, snapshot delta) and the pure helpers next to it: `renderTotalsByComponent` (formik paths folded), `iterationSamples`, `aggregateRenderSamples`, `formatMeasurementTable`. The handler in `runComponentTestSteps.ts` is one line (`iterationsOverride ?? step.iterations`). Failure only (D9) on: iterations not a positive integer, `remount` / `rerender` throwing, more `ErrorFallbackComponent` fallbacks ("Something went wrong in") than before the step (a pre-existing one, like the pattern's `aReference` R4 defect, does not fail the step), or a mode without any sample.
- Choices (T5 read closely): `count` is the number of samples (iterations in which the component rendered), not the number of renders; a sample is the component's summed render time over the iteration (every instance and re-render). T5's "root total" is a `(total)` row summing every component per iteration. `update` starts with `updateProps` and alternates with the leaf props; the test checks it (N=2 ends on `value2`, N=1 on `value3`; non-vacuity: expecting `value2` at N=1 fails with `received "value3"`). Measurements of several `measureRendering` steps in a leaf are concatenated.

Log sample (full-debug config), N=2:
```
component         | mode    | count | min ms | median ms | max ms
JzodElementEditor | remount | 2     | 13.67  | 16.14     | 18.61
JzodObjectEditor  | remount | 2     | 0.33   | 0.40      | 0.46
JzodEnumEditor    | remount | 2     | 4.53   | 6.46      | 8.39
(total)           | remount | 2     | 18.52  | 22.99     | 27.46
JzodElementEditor | update  | 2     | 0.92   | 1.06      | 1.20
…
```
(`JzodObjectEditor` is the test component's `TESTSECTION` wrapper.)

**Validation.**
| Command | Result |
|---|---|
| `npm run testByFile -w miroir-standalone-app -- measureRendering.303.phase4` | 5 passed (2 walk leaves 0.4 / 0.2 s + 3 checks) |
| `npm run test -w miroir-core -- ''` | 156 files passed, 1 skipped; 2027 tests passed, 1 skipped |
| tsc miroir-core / miroir-react / miroir-standalone-app | 0 / 0 / 1 (the baseline `JzodElementEditorHooks.ts(528,59)`); the 303 test files also type-check (temporary tsconfig including them, deleted) |
| `… miroir-component-tests` | 74 passed; 42.8 s (tests 36.5 s) |
| `renderInsightCoverage.303.phase3` | 4 passed |
| also: `componentMiroirTests.consistency` / modelValidation / `componentTestSteps.292.phase2` / `componentTestTargets.292.phase3` / `RenderInsight` (11 files) / `componentTestSandbox.286` | 6 / 160 / 14 / 6 / 48 / 5 passed |

Slice 6 note: the app's `ComponentTestSandbox.prepareComponentTests` must pass `iterationsOverride` in the host of `createReactComponentTestRunner`; the table can read `fullAssertionsResults[<leaf>].assertionMeasurements`.

---

## Slice 5 — Render-performance suite, on-demand gating

**Status:** ✅ DONE

Goal: a maintainer runs the performance suite and gets one measurement block per editor and for the pattern; the default run does not pay for it.

**RED**
- New instance `2da30877-…` (`JzodEditorRenderPerformance_ComponentTestSuite`), `runOnDemand: true`, default `iterations: 3`, `mode: "both"`: one leaf per single-type editor (string, number, bigint, boolean, date, uuid, enum, literal, array, tuple, record, object, union, any; props as in the #292 suites) and one leaf on the test pattern props.
- Entry: without `MIROIR_COMPONENT_PERF` the suite is reported skipped; with it, every leaf is ok and carries measurements.

**GREEN**
- Vitest entry honors `runOnDemand` (T6); instance wiring and counts (9 instances).
- The app runs `runOnDemand` suites normally when launched.

**Refactor checkpoint:** the performance leaves reuse the pattern props by copy (D4: JSON only); note the duplication in the instance `description`.

### Validation

- `… miroir-component-tests` (suite skipped, duration within Slice 2 + 1 s).
- `MIROIR_COMPONENT_PERF=1 … -t "JzodEditorRenderPerformance"` green; duration recorded (expected about 20–25 s at N=3, analysis §3.4).

### Realization

**RED observed.** Counts first: the entry expects 9 instances / 87 leaves, `componentMiroirTests.consistency` 9 instances, `componentTestInstances.292.phase1` gets `JzodEditorRenderPerformance_ComponentTestSuite: 2da30877-…` in `laterComponentInstances`. Before the instance: consistency `expected [ …(8) ] to have a length of 9 but got 8`; 292.phase1 `expected [ [ …(2) ] ] to deeply equal [ [ …(2) ], [ …(2) ] ]`.

**GREEN.**
- Instance `2da30877-…` (`JzodEditorRenderPerformance_ComponentTestSuite`): one `reactComponentTestSuite` `JzodEditorRenderPerformance`, `runOnDemand: true`, component `JzodElementEditor`, suite `componentProps` = the common keys (label, name, listKey, rootLess*). 15 leaves `JzodEditorRenderPerformance: <type>`, each with its own `rawJzodSchema` / `initialFormState` and one step `{measureRendering, iterations 3, mode both, updateProps {initialFormState: <other value>}}`. Props from the #292 instances (string / number / bigint / boolean / uuid: SimpleType; enum; literal; array; tuple: the Array suite's tuple leaf; record / object: the Object suite; union: string | number | object, `42` → `{a, b}` (a branch switch); any: `{type:"any", display.any.format:"file"}`, `""` → `{applicationName:"loaded file"}`, so that `JzodAnyEditor` is measured). Date has no #292 leaf: the pattern's `aDate` value. Literal: a literal has one valid value, so `updateProps` repeats it (the update measures a re-render with equal props). The pattern leaf copies the `componentProps` of `26ef2886-…` (update: aString, aNumber, aBoolean, anEnum, anArray, aTuple, aRecord, aSimpleUnion, the deep leaf changed); the duplication is stated in the instance `description` (refactor checkpoint).
- Wiring: `index.ts` / `index.d.ts` export `miroirTest_JzodEditorRenderPerformance_ComponentTestSuite`, `src/Model.ts` lists it in `defaultMiroirMetaModel.tests`; `npm run build -w miroir-test-app_deployment-miroir` (no schema change, no `devBuild`).
- Entry (`miroir-component-tests.unit.test.tsx`): a `reactComponentTestSuite` with `runOnDemand` and `MIROIR_COMPONENT_PERF !== "1"` is registered as `describe.skip("<label> (runOnDemand: set MIROIR_COMPONENT_PERF=1 to run)")` with one `it.skip` per leaf label (the walk is not called), so the default run reports 15 skipped and `-t "JzodEditorRenderPerformance"` lists them.
- **`EXPECTED_LEAF_COUNT` decision:** it counts every leaf of the folder, on-demand ones included (87: it checks the folder content, not what runs); a new `EXPECTED_ON_DEMAND_LEAF_COUNT = 15` checks the part under `runOnDemand` suites. Both are in the "loads 9 component test instances with 87 leaves" check.
- **Other entries unaffected:** `npm run testMiroir -w miroir-core -- --suites JzodEditorRenderPerformance_ComponentTestSuite --mode unit`: 15 passed in 10 ms (no runner registered → each leaf recorded skipped in the tracker, as the other component instances). The nonreg component step runs the entry without the variable → skipped.
- **App (read, no change):** nothing in miroir-standalone-app `src` reads `runOnDemand`; `RunMiroirTestSuiteButton` / `RunAllMiroirTestsButton` call `runMiroirTests._runMiroirTestSuite`, which walks the suite like any other. Consequence: Miroir Tests **"Run all"** (component tests checked, the default) also runs the performance suite (about 8 s of tests in jsdom). Left as is (the plan says the app runs it normally when launched); open point for the user whether "Run all" should skip `runOnDemand` suites.
- **Logging:** the measurement tables are `info` (logger `runReactComponentTest`); the default log preset (`catch-all`, WARN) hides them. Shown with `VITE_MIROIR_LOG_CONFIG=catch-all-detailed` (to document in Slice 7).

Pattern leaf table (catch-all-detailed, N=3, ms):
```
component               | mode    | count | min    | median | max
JzodElementEditor       | remount | 3     | 276.92 | 287.58 | 324.93
JzodArrayEditor         | remount | 3     | 34.52  | 38.59  | 39.20
JzodUnionEditor         | remount | 3     | 14.47  | 15.51  | 19.37
JzodAnyEditor           | remount | 3     | 9.72   | 10.35  | 10.66
(total)                 | remount | 3     | 365.00 | 381.71 | 434.71
(total)                 | update  | 3     | 31.04  | 38.39  | 40.38
```
Single editors: `(total)` remount median 11.7-34.9 ms (array highest), update 0.6-18.3 ms; `JzodAnyEditor` remount 10.4 / update 8.5, `JzodEnumEditor` 5.2 / 0.3, `JzodLiteralEditor` 4.4 / 0.2, `JzodUnionEditor` 7.0 / 0.6.

**Validation.**
| Command | Result |
|---|---|
| `npm run testByFile -w miroir-standalone-app -- miroir-component-tests` | 74 passed, 15 skipped (89); 42.7 s (tests 37.0 s) vs Slice 4 42.8 s |
| `MIROIR_COMPONENT_PERF=1 … miroir-component-tests -t "JzodEditorRenderPerformance"` | 15 passed, 74 skipped; 13.5 s (tests 7.6 s), below the expected 20-25 s. Per leaf: 0.21-0.52 s for single editors, 3.4 s for the pattern |
| same with `VITE_MIROIR_LOG_CONFIG=catch-all-detailed` | 15 passed, 15 tables logged; 13.5 s |
| `… miroir-component-tests -t "JzodEditorRenderPerformance"` (no variable) | all skipped, the 15 perf leaves listed under the `(runOnDemand: …)` describe |
| `componentMiroirTests.consistency` / `componentTestInstances.292.phase1` | 6 / 5 passed |
| modelValidation (`npx vitest run tests/modelValidation.unit.test.ts` in miroir-test-app_deployment-miroir; `testByFile -w miroir-standalone-app -- modelValidation` finds no file) | 161 passed (160 + the new instance) |
| tsc miroir-standalone-app / miroir-test-app_deployment-miroir | 1 (baseline `JzodElementEditorHooks.ts(528,59)`) / 0; the 3 edited test files type-check (temporary tsconfig, deleted) |

---

## Slice 6 — Miroir Tests: iterations override and measurement table

**Status:** ✅ DONE

Goal: in the app, a maintainer sets N before launching the performance suite and reads the results as a table.

**RED** — `tests/4_view/issues/303-…/renderPerformanceRunControls.303.phase6.unit.test.tsx` (vitest: React UI of the app, as `RunAllMiroirTestsButton.unit.test.tsx`): renders `MiroirTestDisplay` for the performance instance; expects an iterations field (default empty = instance value) next to the unit run button only for suites containing a `measureRendering` step; after a run with the field at 1, the result display shows a table with component, mode, count 1, min, median, max.

**GREEN**
- `MiroirTestDisplay`: number field; `RunMiroirTestSuiteButton` passes it to `beforeRun`, i.e. `ComponentTestSandbox.prepareComponentTests({ iterationsOverride })` (today it takes no argument), which passes it to `createReactComponentTestRunner` (T7).
- Result display (`TestResultCellWithActualValue` or a sibling cell): render `assertionMeasurements` as a table.

**Refactor checkpoint:** "suite contains a step kind" helper shared with the runner's tracking decision (Slice 3).

### Validation

- `npm run testByFile -w miroir-standalone-app -- renderPerformanceRunControls.303.phase6`.
- App check (user): dev app, Miroir Tests, run the performance suite with N=1 then N=10; table appears, durations scale.

### Realization

**RED observed.** `renderPerformanceRunControls.303.phase6.unit.test.tsx` (harness of `runAllComponentTests.286.phase6`: real `LocalCache` with the Miroir meta-model, `MiroirContextReactProvider`, real component test chunk and walk; `registerComponentTests` wrapped in `vi.fn` only to count calls and read its host). Three cases: (1) no `Render iterations` spinbutton for `JzodEnumEditor_ComponentTestSuite`, one, empty, in the same `unit-run-controls` row as the unit run button for `JzodEditorRenderPerformance_ComponentTestSuite`; (2) field at 1, run → 15 ok rows, `registerComponentTests` host `{iterationsOverride: 1}`, per leaf a table `Render measurements: <leaf>` with headers Component / Mode / Count / Min ms / Median ms / Max ms, modes remount + update, every count `1`, min ≤ median ≤ max, a `JzodElementEditor` row; (3) `MiroirTestListDisplay` [perf, `resolveConditionalSchema`] Run All Unit Tests → 15 perf rows skipped with `runOnDemand suite: not run by Run all`, not the "requires a registered component test runner" message, 5 transformer ok, `registerComponentTests` not called. RED (each case focused with `-t`): (1) and (2) `Unable to find an accessible element with the role "spinbutton" and name "Render iterations"`; (3) `expected false to be true` (the perf leaves ran). Non-vacuity after GREEN (reverted): field at 2 → `JzodEditorRenderPerformance: string JzodElementEditor remount count: expected '2' to be '1'`.

**GREEN.**
- Iterations field (D8): `MiroirTestDisplay` holds the field text in `useState` (no `useEffect`), shows `ThemedLabel` "Iterations" + `ThemedEditableInput type="number"` (`aria-label="Render iterations"`) next to the unit run button when `miroirTestDefinitionHasStepKind(instance.definition, "measureRendering")` (new in `4-tests/miroirTestSuiteUiExecution.ts`, walks `miroirTestSuite` nodes and calls miroir-core `reactComponentTestSuiteStepKinds` on each `reactComponentTestSuite`: the refactor checkpoint, same helper as the runner's tracking decision). `parseIterationsOverride`: empty → `undefined` (instance value); any other text → `Number(text)`, the step rejects a value that is not a positive integer (Slice 4 D9 failure).
- Transport (T7): `RunMiroirTestSuiteButton` gains `iterationsOverride?` and calls `beforeRun(iterationsOverride !== undefined ? {iterationsOverride} : undefined)`; `ComponentTestSandboxContextValue.prepareComponentTests(options?: ComponentTestRunOptions)` puts it in the `registerComponentTests` host, which already reaches `createReactComponentTestRunner`. `MiroirTestListDisplay` / `RunAllMiroirTestsButton` keep calling `beforeRun()` without argument (type-compatible, unchanged).
- Result display (D10): new `Reports/RenderMeasurementTable.tsx`: `renderMeasurementsOfTestResult(row)` (concatenates `assertionMeasurements` of `fullAssertionsResults`), `RenderMeasurementTable` (one `<table aria-label="Render measurements: <leaf>">`, ms with 2 decimals) and `RenderMeasurementsPanel` (one table per row carrying measurements, nothing otherwise). `TestExecutionPanel` renders the panel under the results grid (so it appears in `MiroirTestDisplay` and in each suite accordion of `MiroirTestListDisplay`); the Result cell (`TestResultCellWithActualValue`) click-open window shows the same table for a passing leaf with measurements (instead of "Test passed - no actual result to display"). Deviation: the table is under the grid rather than inside the 100 px Result cell, which cannot hold a 6-column table; the cell's window has it too. No `Themed*` table exists: the table is a plain `<table>` styled from `useMiroirTheme()` (as `TestResultCellWithActualValue`), with `ThemedLabel` for the heading.
- **Run all skips `runOnDemand` suites (coordinator decision; deviation from Slice 5 "the app runs them normally" and from T7 "no miroir-core change").** miroir-core: `ReactComponentTestSuiteContext.runOnDemand?: true` (filled by the walk only when set, so hand-built / expected contexts are unchanged), unit option `skipRunOnDemandSuites?: boolean`, and `_runMiroirTestWithTracking` records such a leaf as skipped with `runOnDemandSuiteSkippedMessage(suiteLabel)` = `runOnDemand suite: not run by Run all (suite "<label>"); launch the suite on its own to run it` (exported, next to `miroirTestTypeExcludedMessage`; same skip path as `excludeMiroirTestTypes`). `RunAllMiroirTestsButton` passes `{executionMode: "unit", skipRunOnDemandSuites: true}` when component tests are included (unchecked: all component leaves excluded as before), and prepares the sandbox only if a `reactComponentTest` leaf exists outside `runOnDemand` suites (`miroirTestDefinitionHasReactComponentTest(def, {ignoreRunOnDemandSuites: true})`). `RunMiroirTestSuiteButton` (one suite launched) does not set the option: the perf suite runs (case 2). `RunAllMiroirTestsButton.unit.test.tsx` "defaults to unit" now expects `{executionMode: "unit", skipRunOnDemandSuites: true}`. `npm run build -w miroir-core` (no schema change).

**App check.** The browser check by the user (dev app, Miroir Tests, perf suite at N=1 then N=10: tables appear, durations scale) is **pending for the user**. Done instead: production build `npm run build -w miroir-standalone-app` (1 min 43 s, ok) and the #286 bundle guard `componentTestChunk.286.phase4` (4 passed: the component test chunk, where the iterations reach the runner, stays a dynamic chunk; the new `RenderMeasurementTable` is in the main bundle and imports no testing library).

**Validation.**
| Command | Result |
|---|---|
| `npm run testByFile -w miroir-standalone-app -- renderPerformanceRunControls.303.phase6` | 3 passed; 14.2 s (tests 8.0 s; the N=1 perf run 7.7 s) |
| `… miroir-component-tests` | 74 passed, 15 skipped; 42.8 s (tests 36.6 s) |
| `RunAllMiroirTestsButton` / `MiroirTestDisplay.unit` / `MiroirTestListDisplay` | 4 / 5 / 4 passed |
| `componentTestSandbox.286` / `runAllComponentTests.286` / `componentTestRunLock.286` | 5 / 3 / 5 passed |
| `componentMiroirTests.consistency` / `measureRendering.303.phase4` / miroir-core `reactComponentTestSuite.292.phase1` | 6 / 5 / 7 passed |
| `npm run test -w miroir-core -- ''` | 156 files passed, 1 skipped; 2042 tests passed, 1 skipped |
| `npm run build -w miroir-standalone-app` + `componentTestChunk.286.phase4` | build ok; 4 passed |
| tsc miroir-core / miroir-react / miroir-standalone-app | 0 / 0 / 1 (baseline `JzodElementEditorHooks.ts(528,59)`); the new test file type-checks (temporary tsconfig, deleted) |

Note: `testByFile` spawns vitest with `shell: true`, so a `-t` pattern with spaces is split into file filters (it silently ran other files); use a pattern without spaces (`-t field.at.1`). To document in Slice 7.

---

## Slice 7 — Docs, nonreg, cleanup, AC

**Status:** ✅ DONE

- `docs/reference/testing.md`: test pattern, `ignorePaths` (with the list of ignored branches and the follow-up that removes them), `measureRendering`, `runOnDemand`, `MIROIR_COMPONENT_PERF`, the iterations override, how to read the table and why it is not a pass / fail (D9, R1, R2).
- `scripts/nonreg-manifest.json`: add the `303` issue vitest files to the unit tier; keep the performance suite out of every default tier.
- Move still-valuable `issues/303-*` assertions into feature-named suites and delete the issue directory (#238 rule).
- Open the follow-up issues: extractor fix for the ignored branches; stored measurements across runs; R4 bug if Slice 0 found one. (Done as texts in `follow-ups.md`: no GitHub access.)
- Full `npm run nonreg`; tsc against Slice 0.

### AC checklist

| Acceptance criterion (#303) | Proof | Status |
|---|---|---|
| `JzodTestPattern` passes in `miroir-component-tests` and in the app sandbox, within budget | vitest: Slice 2 `-t "JzodTestPattern"` 4 passed (1.7 / 2.1 / 1.6 / 3.4 s, budget about 2.5 s per leaf, analysis §3.4); Slice 7 full nonreg `appstack-miroir-component-tests` passed (6 test files incl. the entry: 74 passed / 15 skipped). App sandbox: the Slice 6 test runs the component chunk in `MiroirTestDisplay` (same runner as the app); the browser check by the user is pending | ✅ vitest; app check pending (user) |
| Performance test reports per-component measurements, runs in a few seconds with default N, N overridable in the app | Slice 4 `measureRendering.303.phase4` (tracker and `generateTestReport` carry `assertionMeasurements`); Slice 5 `MIROIR_COMPONENT_PERF=1 … -t "JzodEditorRenderPerformance"` 15 passed, 7.6 s of tests (0.2-0.5 s per single editor, 3.4 s for the pattern; the whole suite is on demand, D11); Slice 6 `renderPerformanceRunControls.303.phase6` (field at 1 → 15 tables, every count 1) | ✅ (browser check pending, user) |
| `docs/reference/testing.md` documents both tests and the override | Slice 7: sections "Test pattern" (with the `ignorePaths` table and reasons) and "Render measurements (`measureRendering`)" (fields, modes, `count` / samples, `(total)`, not a pass / fail, log preset, perf suite, `MIROIR_COMPONENT_PERF=1`, the app iterations field and table, Run all skip), node / step tables (`runOnDemand`, `ignorePaths`, `measureRendering`), testByFile `--bail=1` and `-t` limits, counts to update; `docs/contributing/testing.md` commands | ✅ |
| `componentMiroirTests.consistency` and the default nonreg tier pass | Full nonreg default tier, filesystem profile, snapshot `20260926T193952Z`: `appstack-miroir-component-tests` (entry + consistency) passed, 69 of 71 steps passed; the 2 failures are not from this branch (see Realization) | ✅ for this branch's scope |

### Realization

**Docs.** `docs/reference/testing.md`, JzodElementEditor component tests: instance table (+ `JzodTestPattern_ComponentTestSuite`, `JzodEditorRenderPerformance_ComponentTestSuite`), node table (`runOnDemand`), step table (`ignorePaths` on `expectRenderedValues`, new `measureRendering` row), `expectRenderedValues` procedure (new step 4 `ignorePaths`), vitest entry commands (74 passed / 15 skipped, `-t "JzodTestPattern"`, perf command with `MIROIR_COMPONENT_PERF=1 VITE_MIROIR_LOG_CONFIG_FILENAME=catch-all-detailed`), the two `testByFile` limits (`--bail=1` kept per the coordinator decision, with the `npx vitest run` workaround; `-t` patterns with spaces split by the shell, write `.` for a space), the counts to update (`EXPECTED_INSTANCE_COUNT` 9, `EXPECTED_LEAF_COUNT` 87, `EXPECTED_ON_DEMAND_LEAF_COUNT` 15, consistency 9, `laterComponentInstances`), Run all skipping `runOnDemand` suites, and two new subsections: **Test pattern** (22 attributes, 4 leaves, ignored branches with the extractor's reading and the replacing `expectElement`) and **Render measurements** (tracking, component ids incl. simple types → `JzodElementEditor`, union → `JzodUnionEditor`, `JzodAnyEditor` only with `display.any.format`; modes; iterations; `count` = iterations with a sample, sample = summed render time of the component over one iteration, `(total)`; `assertionMeasurements`; log at info, logger `runReactComponentTest`; not a pass / fail with D9, R1 +5 %, R2 happy-dom; example table; perf suite content and cost; the app's Iterations field and tables). Log mechanism checked: tests read `VITE_MIROIR_LOG_CONFIG` or `VITE_MIROIR_LOG_CONFIG_FILENAME` (`MiroirLoggerFactory.ts` L25-26, `logConfigPresets.ts`); the docs use `VITE_MIROIR_LOG_CONFIG_FILENAME`, the documented test variable. `docs/contributing/testing.md`: the component section names the two new instances, the default / pattern / perf commands, bail, and links to the new reference sections.

**Nonreg.** New step `unit-303-test-pattern-and-render-performance` (unit tier) after `unit-292-…`, same pattern (`bash -c "npm run testByFile … && …"`): `renderInsightCoverage.303.phase3`, `measureRendering.303.phase4`, `renderPerformanceRunControls.303.phase6`. `appstack-miroir-component-tests` title now names #303; it runs the entry without `MIROIR_COMPONENT_PERF`, so the perf suite is skipped in every tier.

**Issue directory (#238): kept, following the repo's practice.** `docs/contributing/testing.md` says to migrate the assertions and delete the issue directory *when the issue closes*. #303 is not closed (the branch is not merged), and #286 and #292 kept their `issues/` directories registered as `unit-286-…` / `unit-292-…` steps. So `tests/4_view/issues/303-test-pattern-and-render-performance/` stays and is registered as `unit-303-…`; the migration is left for when #303 closes (with #286 / #292).

**Test isolation (Slice 3 finding) fixed.** `configureComponentTestDom()` now returns a function restoring the `@testing-library/dom` configuration found before the call; `createReactComponentTestRunner` keeps it and calls it at the end of `close()`. So that another runner's delayed `close()` (the app closes a display's runner after the commit that unmounts it) cannot leave a later case with the default configuration, the runner also re-applies the act-free configuration before each case (`applyComponentTestDomConfig()`, in `mountCase`). Proof: `npm run testByFile -w miroir-standalone-app -- componentTestSteps.292.phase2 RenderInsightSummary`: before, 1 failed (`RenderInsightSummary` "shows empty-state copy when on but no insight nodes yet") / 15 passed; after, 20 passed. `testByFile … RenderInsight`: 11 files, 48 passed. The 286 / 292 test files are unchanged (they already call `runner.close()`).

**Follow-ups.** No GitHub access: the four issue texts are in [`follow-ups.md`](./follow-ups.md): (1) extractor fix for the literal / stray `testField`, empty containers, recursive reference and `anAnyFile` branches (so `ignorePaths` can go away); (2) the R4 defect (local `context` of a `schemaReference` not passed to array items), with the Slice 0 evidence; (3) measurements stored across runs; (4) optional: `testByFile` bail and `-t` with spaces.

**Final validation.**
| Check | Result |
|---|---|
| tsc miroir-core / miroir-react / miroir-standalone-app / miroir-test-app_deployment-miroir (the 4 packages in `git diff origin/_integration`) | 0 / 0 / 1 / 0; the 1 is the baseline `JzodElementEditorHooks.ts(528,59)` TS2339: no new error |
| Full nonreg: `npm run nonreg:filesystem` (default tier, `--run-all`, profile `emulatedServer-filesystem`), snapshot `test-results/nonreg/20260926T193952Z` | 69 passed, 2 failed, 0 skipped / not run. `unit-303-…` passed (3 files, 35.8 s); `appstack-miroir-component-tests` passed (50.3 s); `unit-292-…` passed; `unit-301-agent-tooling` passed (pytest installed with pip, Slice 0 had it environment-unavailable) |
| `integ-transformer-miroirCoreTransformers` (failed, 1 of 261 tests) | **Pre-existing, filesystem profile only; not this branch.** `unpivot keeps explicit nulls and skips absent keys` (instance `33f60ac8-…`, added by #265 `04a5e0f`, in `origin/_integration`) has `subExpectedValue` and `integrationTestExpectedValue` but no `expectedValue` / `unitTestExpectedValue`; on a non-SQL store `resolveTransformerIntegrationExpectedValue` (`MiroirTransformerTestTools.ts` L77-84) returns `unitTestExpectedValue ?? expectedValue` = `undefined` → "expected [ … ] to deeply equal undefined". Neither file is changed by this branch; the step passed on the sql profile (partial run below). Deterministic: fails again alone (snapshot `20260926T200459Z`). Not proven on a clean `origin/_integration` worktree (it would need `npm install` and the full ordered build there); the mechanism above is the proof |
| `unit-286-react-component-miroir-tests` (failed, 1 case) | **Flaky, pre-existing.** `componentTestSandbox.286.phase4` "a second display's Run during an active run is refused…" (7 of 12 case containers seen in the first sandbox), the same case as the Slice 0 baseline. The whole step passes when rerun alone (snapshot `20260926T200459Z`, 122 s). The case alone, 5 runs each: 2 failures with the Slice 7 change, 1 without it (stashed) — the same order of flakiness, and it failed at Slice 0 before any code change |

**Profile (user instruction, received mid-run).** The nonreg runs use the filesystem storage only (`emulatedServer-filesystem`). A first `npm run nonreg` (default profile `emulatedServer-sql`, local Postgres 16 started for it) was stopped on that instruction after 56 steps, all passed up to `externalServices-spotify` (snapshot `20260926T192609Z`, incomplete, no summary); the results above are from the filesystem run.

**Deviations.** Issue directory kept (see above). Follow-up issues written to a file instead of opened. The perf suite and the app check were not rerun in this slice (docs / nonreg / cleanup only).
