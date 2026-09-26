# Issue #303 — TDD Implementation Plan

> Vertical TDD slices, RED then GREEN, integration-first per `docs/contributing/testing.md`. Tests render the real `JzodElementEditor` through the real MiroirTest walk (`runMiroirTests._runMiroirTestSuite`) and the real component test runner, with the real render insight registry. No mocks. The applicative interface is the MiroirTest JSON (new instances, new step, new fields); vitest files are used only where noted, with a one-line reason. Slice 1 is the tracer: the test pattern displays from JSON.

**Resume note (2026-09-26):** plan written, no slice started.

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
| 0 | Baselines and probe checks | S | ⬜ pending | baseline table; R4 / R5 decided |
| 1 | Tracer: test pattern displayed (`ignorePaths`) | M | ⬜ pending | `-t "JzodTestPattern"` display leaf green |
| 2 | Test pattern interactions | S | ⬜ pending | `-t "JzodTestPattern"` all leaves green |
| 3 | Every editor reports its renders | M | ⬜ pending | `renderInsightCoverage.303.phase3` |
| 4 | `measureRendering` step, measurements in the test result | L | ⬜ pending | `measureRendering.303.phase4` + tracker carries `assertionMeasurements` |
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

**Status:** ⬜ pending

Goal: lock what later slices compare against and settle analysis R4 and R5.

- Record: component entry duration and counts (7 instances, 68 leaves), tsc error lists of miroir-core, miroir-react, miroir-standalone-app, nonreg baseline failures.
- R4: render the recursive `schemaReference` branch of the draft pattern alone; decide whether `children` is folded (then the pattern unfolds it with a step) or not rendered (then open a bug issue and keep the branch under `ignorePaths`).
- R5: make one component case fail on purpose without `-t` and check whether later suites are still collected and reported. If not, record it as a Slice 1 fix.
- R1: measure one editor case with tracking on versus off to size the chip overhead; record it.

### Validation

- `npm run testByFile -w miroir-standalone-app -- miroir-component-tests` (baseline duration and counts).
- The three tsc commands (baseline lists saved next to this plan as `baseline-tsc-*.txt`).

---

## Slice 1 — Tracer: test pattern displayed

**Status:** ⬜ pending

Goal: a maintainer runs `-t "JzodTestPattern"` and sees the pattern render with its value checked, from JSON only.

**RED**
- New instance `26ef2886-…` (`JzodTestPattern_ComponentTestSuite`) with the pattern schema and value of analysis §3.3 (final shape from Slice 0), one display leaf: `expectRenderedValues {field:"testField", ignorePaths:[…], expectedValue}` plus `expectElement` checks for each ignored branch. Fails: `ignorePaths` is not in the schema (modelValidation) and not honored by the interpreter.
- Entry counts move to 8 instances / 69 leaves; `componentMiroirTests.consistency` and `componentTestInstances.292.phase1` counts updated first (red until the instance is wired).

**GREEN**
- Schema (T8): add `ignorePaths` to `expectRenderedValues`, `measureRendering` step object, `runOnDemand` on `reactComponentTestSuite`, in the MiroirTest Entity and its EntityVersion; rebuild; `devBuild`.
- Interpreter: remove each dot path from actual and expected before the comparison; `measureRendering` handler throws `not implemented`.
- Wire the instance: exports in `miroir-test-app_deployment-miroir` (`index.ts`, `index.d.ts`), `defaultMiroirMetaModel.tests`.
- If Slice 0 found R5 real: run each suite's walk inside `it`-level failures instead of aborting collection.

**Refactor checkpoint:** the ignore helper sits next to the existing `path` selection of `expectRenderedValues`, not in a new module.

### Validation

- `… miroir-component-tests -t "JzodTestPattern"` green; full entry green with 69 leaves.
- `componentMiroirTests.consistency` green; modelValidation of `miroir-test-app_deployment-miroir` (part of its build).
- tsc: no new error against Slice 0.

---

## Slice 2 — Test pattern interactions

**Status:** ⬜ pending

Goal: the pattern suite also proves that editing works across nested editors.

**RED** — new leaves in `JzodTestPattern` (existing vocabulary only):
- change a deep leaf (`aNestedObject.level1.level2.leaf`) and the enum, then `expectRenderedValues` on those paths;
- switch `aSimpleUnion` from number to string (`toggleUnionTypeSelector`, `selectOption` with `select:"unionType"`);
- add and delete an array item (`clickArrayButton`), rename a record entry (`renameRecordEntry`), add the absent optional attribute (`clickObjectButton addOptionalAttribute`).

**GREEN** — none expected; any failure is either a product defect (own issue, leaf kept with the defect recorded in Realization) or a missing widget target (added to `componentTestTargets.ts`).

**Refactor checkpoint:** keep the suite at 3–4 leaves (analysis §3.4: about 2.5 s per leaf); merge interactions into one leaf if the entry grows by more than 10 s.

### Validation

- `… -t "JzodTestPattern"` green; entry duration recorded against Slice 0.

---

## Slice 3 — Every editor reports its renders

**Status:** ⬜ pending

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

---

## Slice 4 — `measureRendering` step, measurements in the test result

**Status:** ⬜ pending

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
