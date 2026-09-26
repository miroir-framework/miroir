# 303 — JzodElementEditor test pattern and render-performance test

> Adds two declarative component tests next to the 7 per-editor suites of #292: a self-contained "test pattern" object that exercises every JzodElementEditor feature in one render, and a render-performance test that measures each editor component N times, with N overridable from the app before launch. Replaces #291.

Related issue: https://github.com/miroir-framework/miroir/issues/303
Replaces: [#291](https://github.com/miroir-framework/miroir/issues/291) (closed, not planned; findings in [`../291-FEATURE-remaining-jzod-editor-component-tests/gap-estimate.md`](../291-FEATURE-remaining-jzod-editor-component-tests/gap-estimate.md))
Prior work: [#286](../286-FEATURE-react-component-miroir-tests/analysis.md) ✅ · [#292](../292-REFACTOR-declarative-react-component-tests/analysis.md) ✅ · #294 ✅ · [#61 render insights](<../61-FEATURE- include performance monitoring for UI components/tdd-implementation-plan.md>)
Key sources: [`runReactComponentTest.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/runReactComponentTest.tsx) · [`runComponentTestSteps.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/runComponentTestSteps.ts) · [`componentTestEnvironment.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestEnvironment.ts) · [`componentTestTools.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestTools.tsx) · [`renderInsightRegistry.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/tools/renderInsightRegistry.ts) · [`ReactComponentTestTools.ts`](../../../packages/miroir-core/src/5_tests/ReactComponentTestTools.ts) · [`TestInterface.ts`](../../../packages/miroir-core/src/0_interfaces/4-services/TestInterface.ts) · [`MiroirTestDisplay.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MiroirTestDisplay.tsx) · [`miroir-component-tests.unit.test.tsx`](../../../packages/miroir-standalone-app/tests/4_view/miroir-component-tests.unit.test.tsx)

## 1. Sequencing

| Step | Issue | Status |
|---|---|---|
| Component tests as MiroirTests, 68 cases | #286 | ✅ |
| Declarative steps, per-editor instances | #292 | ✅ |
| Leaf outside a `reactComponentTestSuite` is a schema error | #294 | ✅ |
| Migrate the 12 leftover "realistic" cases | #291 | dropped |
| **Test pattern + render-performance test** | **#303** | **this issue** |
| Extractor fix for literal / discriminator / reference branches | later | follow-up |
| Measurements kept across runs for comparison | later | follow-up |

## 2. Decision record

### 2.1 Product decisions (confirmed with the user, 2026-09-26)

| ID | Question | Choice |
|---|---|---|
| D1 | Where the test pattern lives | A new instance `JzodTestPattern_ComponentTestSuite` with its own `reactComponentTestSuite` (`JzodTestPattern`). **Accepted.** Rejected: an extra leaf in an existing editor instance (mixes a cross-editor check into a single-editor suite). |
| D2 | Coverage | Every editor type in one object. Interactions in separate leaves that share the suite's `componentProps`. **Accepted.** Rejected: display only (leaves the cross-editor interactions untested). |
| D3 | Display assertion | One `expectRenderedValues` over the whole value. The branches that the extractor reads wrongly (§3.3) are left out of that comparison and checked by `expectElement` until the extractor fix (follow-up). **Accepted.** Rejected: fixing the extractor in #303 (M–L, touches the helper used by the 68 cases). |
| D4 | Foreign keys | None in the pattern: it references no instance of another application. **Accepted.** FK display belongs in a separate test. |
| D5 | Meaning of one refresh | Both, reported separately: `remount` (unmount then mount the case) and `update` (new props on the mounted component). **Accepted.** |
| D6 | Measurement source | The #61 render insight registry (`renderInsightRegistry`, per component and formik path, count and timing). **Accepted.** Rejected: a single `Profiler` around the root (totals only). |
| D7 | JSON form | A new step `measureRendering {iterations, mode}` usable in any `reactComponentTest` leaf. **Accepted.** Rejected: a suite flag that turns every leaf into a measurement. |
| D8 | Overriding N | A number field next to the run button in Miroir Tests, overriding `iterations` of every `measureRendering` step for that run only. **Accepted.** Rejected: editing `testParams` in the instance before running. |
| D9 | Pass / fail | Never on timing: measurements are recorded only. A `measureRendering` step fails only when the component fails to render or no measurement is collected. **Accepted.** Rejected: per-component ms budgets. |
| D10 | Where results go | The test result (min / median / max per component, per mode) and the log. **Accepted.** Stored results for comparison across runs: follow-up. |
| D11 | Default run | The performance suite runs in the default vitest entry and nonreg at N=3 only if it stays under about 5 s; otherwise on demand only. **Accepted.** The probe (§3.4) puts it over 5 s, so it is **on demand** (T6). |

### 2.2 Technical decisions (this analysis)

| ID | Question | Choice | Reason |
|---|---|---|---|
| T1 | How D3 leaves branches out of the comparison | New optional `ignorePaths: string[]` on `expectRenderedValues`: each dot path is removed from both the rebuilt value and `expectedValue` before `toEqual`. The ignored branches get `expectElement` checks in the same leaf. | A subset matcher would silently accept extra stray keys (the `testField` subtree of §3.3); an explicit list keeps every exclusion visible and removable when the extractor is fixed. |
| T2 | How editors report renders | Every editor component calls `renderInsightRegistry.trackRender` with `durationMs`, as `JzodArrayEditor` (L806) and `JzodObjectEditor` (L1352) already do: add it to `JzodElementEditor`, `JzodEnumEditor`, `JzodLiteralEditor`, `JzodElementStringEditor` and the other simple-type path, `JzodAnyEditor`, and the union branch. Component ids follow the existing scheme (`JzodEnumEditor`, …). | D6. Today only array/tuple and object/record editors report (§3.2), so a per-editor measurement is impossible without this. |
| T3 | How the test wrapper turns tracking on | `MiroirContextReactProvider` gets an optional `initialShowPerformanceDisplay` prop (default: the current `sessionStorage` read). The runner passes `true` for a suite containing a `measureRendering` step. | Tracking is gated by `context.showPerformanceDisplay`, a provider state initialized from `sessionStorage` (`MiroirContextReactProvider.tsx` L380-384). Writing `sessionStorage` from a test would leak into the app session. |
| T4 | Remount and update in the runner | The case handle keeps its React root. `ComponentTestEnvironment` gains `remount()` (unmount, fresh container, mount the same element, wait) and `rerender(propsOverride)` (`root.render` with the merged props, wait). `update` alternates between the leaf's props and the step's `updateProps`, shallow-merged. | `mountComponent` returns only `unmount` today (`componentTestEnvironment.ts`). The test component's `Formik` has `enableReinitialize` (`componentTestTools.tsx` L312), so new `initialFormState` props re-render the editor tree. |
| T5 | Measurement shape and transport | `ReactComponentTestRunnerResult` `ok` gains optional `measurements: ComponentRenderMeasurement[]` (`{mode, componentId, formikPath?, count, minMs, medianMs, maxMs, totalMs}`), aggregated per `componentId` (formik paths folded) plus the root total. `ReactComponentTestTools.ts` copies them into a new optional `assertionMeasurements` of `TestAssertionResult` (`TestInterface.ts`, then `devBuild`). | The tracker and `generateTestReport` carry `TestAssertionResult` to the app display; a new optional field keeps every other test type unchanged. Median needs the samples, so the step keeps its own per-iteration samples from registry snapshot deltas rather than the registry's running min/max. |
| T6 | On-demand gating (D11) | New optional `runOnDemand: boolean` on `reactComponentTestSuite`. The vitest entry skips such suites unless `MIROIR_COMPONENT_PERF=1`; the app runs them when launched. | D11 with the §3.4 numbers. `skip` would also skip the suite in the app. |
| T7 | N override transport (D8) | `createReactComponentTestRunner(host)` accepts `iterationsOverride?: number`; the app's component-test sandbox passes the field value when it prepares a run (`prepareComponentTests`). No miroir-core change. | The override is a property of one run in the app, and the runner is created per run by the sandbox (`componentTests/index.ts` L49). |
| T8 | Schema rebuilds | One rebuild for `ignorePaths`, `measureRendering`, `runOnDemand` (MiroirTest Entity and EntityVersion), one `devBuild` of miroir-core that also carries `assertionMeasurements`. | Same approach as #292 T12. |

## 3. Current state

### 3.1 Component test runtime (after #292 / #294)

- A `reactComponentTestSuite` names a component of `componentRegistry` (`JzodElementEditor` only) and default `componentProps`; leaves hold `steps` (17 kinds, `runComponentTestSteps.ts`).
- The runner builds one wrapper per suite (`buildComponentTestWrapper`, providers over an in-memory `LocalCache` loaded with the Miroir meta-model and the Library model and data), mounts each case in a fresh container, runs its steps, and returns `{status: "ok"} | {status: "error", message, expected?, actual?}`.
- `buildComponentTestWrapper` has an `isPerformanceTest` option that wraps the tree in a `Profiler` that only logs (`componentTestTools.tsx` L740-788). Nothing passes it: it is dead since #292.

### 3.2 Render instrumentation (#61)

| Piece | State |
|---|---|
| `renderInsightRegistry` (`renderInsightRegistry.ts`) | Global singleton. `trackRender({componentId, navigationKey, formikPath, durationMs, enabled})` keeps count, last / total / min / max per `componentId@formikPath`; `getSnapshot()`, `resetAll()`. |
| Callers | `JzodArrayEditor` (`JzodArrayEditor`/`JzodTupleEditor`), `JzodObjectEditor` (`JzodObjectEditor`/`JzodRecordEditor`), `ValueObjectGrid`. **Not** `JzodElementEditor`, `JzodEnumEditor`, `JzodLiteralEditor`, `JzodElementStringEditor`, `JzodAnyEditor`, or the union path. |
| Timing | `renderStartRef.current = performance.now()` at the top of the render body, `durationMs = performance.now() - renderStartRef.current` before the returned JSX: the component's own render body, children excluded. |
| Gate | `context.showPerformanceDisplay` (provider state from `sessionStorage`). When on, the editors also render insight chips. |
| `RenderPerformanceMetrics` (`renderPerformanceMeasure.tsx`) | Older per-key stats, used by `ReportSectionEntityInstance`, `ReportSectionMarkdown`, `ValueObjectGrid`; commented out in `JzodElementEditor` (L1850-1853). Not used by this issue. |

### 3.3 Probe: draft test pattern under `expectRenderedValues`

A draft pattern (21 attributes: string, number, bigint, boolean, date, uuid, optional present / absent, literal, enum, array, empty array, tuple, record, empty record, simple union, string|object union, discriminated union, any, recursive `schemaReference` with local `context`, 3-level nested object with an array of objects) was rendered under `miroir-component-tests` and deleted. Rebuilt value versus the input:

| Branch | Rebuilt value | Handling (T1) |
|---|---|---|
| `aLiteral: "fixed"` | moved to a stray `testField: {aLiteral: "fixed"}` subtree | ignore + `expectElement` |
| `aReference` (recursive) | `{label: "root"}`: `children` missing | ignore + `expectElement`; check in Slice 0 whether the children are folded or not rendered |
| `anEmptyArray: []`, `anEmptyRecord: {}` | absent | ignore + `expectElement` on the add buttons |
| `aNestedObject…items[1].tags: []` | absent | ignore |
| `anAbsentOptional` | absent | expected: absent in the input too |
| `aBigint` | `"12345678901234567890"` (string) | expected as string |
| `aDate: "2026-09-26T00:00:00.000Z"` | `"2026-09-26"` | expected as displayed |
| all other branches | equal | compared |

### 3.4 Probe: cost

| Case (happy-dom) | Duration |
|---|---|
| single-type editor case (#291 probe, Enum / bigint / string) | 0.07–0.3 s |
| draft pattern, first mount incl. suite wrapper | 2.7 s |
| draft pattern, each later mount | 2.5–2.6 s |
| draft pattern, display leaf | 1.4 s |

Consequences: the pattern costs about 2.5 s per leaf, not the ~1 s the issue budgeted. With D2 (display + interactions in separate leaves) the pattern suite is about 3–4 leaves, 8–10 s, acceptable in the default tier (the component entry runs 68 cases in about 60 s today). The performance suite at N=3 with both modes is about 7 editors × 6 renders × 0.2 s + 6 × 2.5 s for the pattern, about 23 s, so D11 makes it on demand (T6).

### 3.5 Result path to the app

`runMiroirReactComponentTest` (`ReactComponentTestTools.ts` L68-113) maps the runner result to a `TestAssertionResult` (`assertionName`, `assertionResult`, `assertionExpectedValue`, `assertionActualValue`, schema in `TestInterface.ts`) stored by `MiroirActivityTracker.setTestAssertionResult`; `RunMiroirTestSuiteButton` turns the tracker results into `generateTestReport` rows; `MiroirTestDisplay` / `TestResultCellWithActualValue` show them. No field carries a measurement today.

## 4. Goals

1. **Test pattern.** In order to catch regressions that only appear when editors are nested and combined, as a framework maintainer, I can run one component test that renders an object exercising every JzodElementEditor type and interaction, defined only in MiroirTest JSON.
2. **Render measurements.** In order to see which editor components are slow and whether a change made them slower, as a framework maintainer, I can run a render-performance test that reports min / median / max render time per editor component, for remounts and for value updates.
3. **Longer runs on demand.** In order to get more reliable numbers when I need them, as a framework maintainer using Miroir Tests, I can raise the number of iterations before launching the performance test, without editing the test instance.

## 5. Non-goals

- Extractor fix for literal, discriminator, recursive-reference and empty-container branches (follow-up; D3).
- Measurements stored as instances and compared across runs (follow-up; D10).
- Timing budgets or pass / fail on duration (D9).
- Foreign-key display, Library data (D4); the "realistic instance" cases of #291 (dropped).
- Components other than `JzodElementEditor` in the component registry; other UI_COMPONENT files (#204).
- Reworking `RenderPerformanceMetrics` or the #61 insight chrome.

## 6. Key reuse

| Piece | Location |
|---|---|
| Step interpreter, targets, `expectRenderedValues` | `componentTests/runComponentTestSteps.ts`, `componentTestTargets.ts` |
| Runner, per-suite wrapper, case mount | `componentTests/runReactComponentTest.tsx`, `componentTestEnvironment.ts` (`mountComponent`) |
| Render insight registry | `4_view/tools/renderInsightRegistry.ts` (`trackRender`, `getSnapshot`, `resetAll`) |
| Existing instrumentation pattern | `JzodArrayEditor.tsx` L390-392, L803-812; `JzodObjectEditor.tsx` L646-649, L1349-1358 |
| Provider gate | `miroir-react/src/contexts/MiroirContextReactProvider.tsx` L380-384 |
| Result type | `miroir-core/src/0_interfaces/4-services/TestInterface.ts` (`testAssertionResult`) |
| App run button, sandbox hooks | `RunMiroirTestSuiteButton.tsx`, `MiroirTestDisplay.tsx` L154-166, `componentTests/index.ts` |
| Vitest entry, counts | `tests/4_view/miroir-component-tests.unit.test.tsx` (`EXPECTED_INSTANCE_COUNT` 7, `EXPECTED_LEAF_COUNT` 68) |
| MiroirTest Entity (schema) | `miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-…/a311f363-e238-4203-bdfc-29e8c160c26b.json` (+ EntityVersion) |
| New instances (allocated) | `JzodTestPattern_ComponentTestSuite` `26ef2886-2cd8-4f91-b846-1525b24d5f41`; `JzodEditorRenderPerformance_ComponentTestSuite` `2da30877-d248-44bd-9786-5c091b1bc8fc` |

## 7. Risks and open points

| ID | Risk | Mitigation |
|---|---|---|
| R1 | Tracking on renders the insight chips, so measured renders include them | Accepted: the chips are small; documented next to the results. Measure with and without in Slice 0 if the difference matters. |
| R2 | happy-dom timings are not browser timings | D9: measurements only; the app run is the reference. |
| R3 | Registry is a global singleton shared with the app's performance mode | The step calls `resetAll()` before measuring and reads snapshot deltas; the app run happens in the sandbox while the user launched it, so interference is limited to a user watching insight chips at the same time. |
| R4 | `aReference` children missing may be a real rendering defect, not folding | Slice 0 decides; a defect gets its own issue, the pattern keeps the branch with an `expectElement`. |
| R5 | The failing-case collection abort seen in the #291 probe (gap-estimate G6) hides later suites | Confirm in Slice 0; if real, fix in the vitest entry within #303 (small). |

## 8. Next

TDD plan: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).
