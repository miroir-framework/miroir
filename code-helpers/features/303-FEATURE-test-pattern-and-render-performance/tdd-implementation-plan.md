# Issue #303 — TDD Implementation Plan

> Vertical TDD slices, RED then GREEN, integration-first per `docs/contributing/testing.md`. Tests render the real `JzodElementEditor` through the real MiroirTest walk (`runMiroirTests._runMiroirTestSuite`) and the real component test runner, with the real render insight registry. No mocks. The applicative interface is the MiroirTest JSON (new instances, new step, new fields); vitest files are used only where noted, with a one-line reason. Slice 1 is the tracer: the test pattern displays from JSON.

**Resume note (2026-09-26):** Slices 0-4 done. The MiroirTest schema carries `ignorePaths`, `measureRendering` and `runOnDemand` (not honored yet); `JzodTestPattern_ComponentTestSuite` has one display leaf and three interaction leaves (entry: 8 instances, 72 leaves, about 40 s) and, since Slice 4, `anAnyFile` (any + `display.any.format: "file"`, under `ignorePaths`), so it reaches `JzodAnyEditor`. Every JzodElementEditor component reports timed renders through `useTrackedRender`; the runner turns tracking on for a suite whose `stepKinds` contains `measureRendering`. `measureRendering` (Slice 4): `env.remount()` / `env.rerender(propsOverride)` on the case's React root; per-component samples from registry snapshot deltas, aggregated (`count` = samples, `minMs`, `medianMs`, `maxMs`, `totalMs`, plus a `(total)` row) into the runner `ok` result `measurements` → `TestAssertionResult.assertionMeasurements` (kept by the tracker and by `generateTestReport`'s `fullAssertionsResults`), logged as a table (info, logger `runReactComponentTest`); `createReactComponentTestRunner({…, iterationsOverride})`. Next: Slice 5 (performance suite, `runOnDemand`). Open point for the user: keep or drop `--bail=1` for the component entry (Slice 1 GREEN note; default: keep, document in Slice 7).

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
| 5 | Render-performance suite, on-demand gating | M | ⬜ pending | `MIROIR_COMPONENT_PERF=1 … -t "JzodEditorRenderPerformance"`; default entry skips it |
| 6 | Miroir Tests: iterations override and measurement table | M | ⬜ pending | `renderPerformanceRunControls.303.phase6` + app check |
| 7 | Docs, nonreg, cleanup, AC | S | ⬜ pending | nonreg `--only` steps; AC checklist |

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

**Status:** ⬜ pending

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

---

## Slice 6 — Miroir Tests: iterations override and measurement table

**Status:** ⬜ pending

Goal: in the app, a maintainer sets N before launching the performance suite and reads the results as a table.

**RED** — `tests/4_view/issues/303-…/renderPerformanceRunControls.303.phase6.unit.test.tsx` (vitest: React UI of the app, as `RunAllMiroirTestsButton.unit.test.tsx`): renders `MiroirTestDisplay` for the performance instance; expects an iterations field (default empty = instance value) next to the unit run button only for suites containing a `measureRendering` step; after a run with the field at 1, the result display shows a table with component, mode, count 1, min, median, max.

**GREEN**
- `MiroirTestDisplay`: number field; `RunMiroirTestSuiteButton` passes it to `beforeRun`, i.e. `ComponentTestSandbox.prepareComponentTests({ iterationsOverride })` (today it takes no argument), which passes it to `createReactComponentTestRunner` (T7).
- Result display (`TestResultCellWithActualValue` or a sibling cell): render `assertionMeasurements` as a table.

**Refactor checkpoint:** "suite contains a step kind" helper shared with the runner's tracking decision (Slice 3).

### Validation

- `npm run testByFile -w miroir-standalone-app -- renderPerformanceRunControls.303.phase6`.
- App check (user): dev app, Miroir Tests, run the performance suite with N=1 then N=10; table appears, durations scale.

---

## Slice 7 — Docs, nonreg, cleanup, AC

**Status:** ⬜ pending

- `docs/reference/testing.md`: test pattern, `ignorePaths` (with the list of ignored branches and the follow-up that removes them), `measureRendering`, `runOnDemand`, `MIROIR_COMPONENT_PERF`, the iterations override, how to read the table and why it is not a pass / fail (D9, R1, R2).
- `scripts/nonreg-manifest.json`: add the `303` issue vitest files to the unit tier; keep the performance suite out of every default tier.
- Move still-valuable `issues/303-*` assertions into feature-named suites and delete the issue directory (#238 rule).
- Open the follow-up issues: extractor fix for the ignored branches; stored measurements across runs; R4 bug if Slice 0 found one.
- Full `npm run nonreg`; tsc against Slice 0.

### AC checklist

| Acceptance criterion (#303) | Proof |
|---|---|
| `JzodTestPattern` passes in `miroir-component-tests` and in the app sandbox, within budget | Slices 1–2 validation + app check; budget restated as about 2.5 s per leaf (analysis §3.4) |
| Performance test reports per-component measurements, runs in a few seconds with default N, N overridable in the app | Slices 4–6; "a few seconds" holds for single editors, the full suite is on demand (D11) |
| `docs/reference/testing.md` documents both tests and the override | Slice 7 |
| `componentMiroirTests.consistency` and the default nonreg tier pass | Slice 7 full nonreg |
