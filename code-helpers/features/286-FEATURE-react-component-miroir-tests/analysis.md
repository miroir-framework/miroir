# 286 React component tests as MiroirTests (JzodElementEditor)

> How the JzodElementEditor React Testing Library cases become MiroirTest leaves that run under vitest (happy-dom) and in the running app, in a sandbox panel with isolated state.

Related issue: https://github.com/miroir-framework/miroir/issues/286
Prior work: [#195 run miroir-core unit tests in the UI](https://github.com/miroir-framework/miroir/issues/195) ✅ · [#196 migrate tests to MiroirTest](https://github.com/miroir-framework/miroir/issues/196) ✅ [`../196-FEATURE-migrate-tests-to-MiroirTest/plan.md`](../196-FEATURE-migrate-tests-to-MiroirTest/plan.md) · [#197 run integration tests in the UI](https://github.com/miroir-framework/miroir/issues/197) ✅ [`../197-FEATURE- run integration tests in the UI/analysis-ui-integ-without-testing-library.md`](<../197-FEATURE- run integration tests in the UI/analysis-ui-integ-without-testing-library.md>) · [#204 classify tests for MiroirTest migration](https://github.com/miroir-framework/miroir/issues/204) (open) [`../204-DOCUMENTATION-classify-tests-for-MiroirTest-migration/plan.md`](../204-DOCUMENTATION-classify-tests-for-MiroirTest-migration/plan.md)
Key sources: [`JzodElementEditor.test.tsx`](../../../packages/miroir-standalone-app/tests/4_view/JzodElementEditor.test.tsx) · [`JzodElementEditorTestTools.tsx`](../../../packages/miroir-standalone-app/tests/4_view/JzodElementEditorTestTools.tsx) · [`MiroirTestTools.ts`](../../../packages/miroir-core/src/5_tests/MiroirTestTools.ts) · [`miroirTestSuiteWalk.ts`](../../../packages/miroir-core/src/5_tests/miroirTestSuiteWalk.ts) · [`FunctionCallTestTools.ts`](../../../packages/miroir-core/src/5_tests/FunctionCallTestTools.ts) · [`FunctionCallTestRegistry.ts`](../../../packages/miroir-core/src/5_tests/FunctionCallTestRegistry.ts) · [`test-expect.ts`](../../../packages/miroir-core/src/1_core/testing/test-expect.ts) · [`ConfigurationService.ts`](../../../packages/miroir-core/src/3_controllers/ConfigurationService.ts) · [MiroirTest Entity `a311f363-…`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a311f363-e238-4203-bdfc-29e8c160c26b.json) · [MiroirTest EntityVersion `51c647fe-…`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/51c647fe-07ec-411c-89cc-02689dc66d6a.json) · [`RunMiroirTestSuiteButton.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Buttons/RunMiroirTestSuiteButton.tsx) · [`MiroirTestDisplay.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MiroirTestDisplay.tsx) · [`MiroirTestListDisplay.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MiroirTestListDisplay.tsx) · [`FormComponents.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/FormComponents.tsx) · [`miroir-core-tests.unit.test.ts`](../../../packages/miroir-core/tests/miroir-core-tests.unit.test.ts)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with the user (2026-09-24 grilling). Revised after adversarial review ([`./adversarial-review.md`](./adversarial-review.md), R1-R20 applied).

**Document history:** first draft committed on `286-FEATURE-react-component-miroir-tests`. The review found that the schema edit targeted the EntityVersion instead of the generator's input Entity, that React production builds throw on `act`, that `extractValuesFromRenderedElements` searches the whole `document`, that the editors' dropdown is a custom portal, and that the bodies use more than the planned env object. The product decisions D1-D13 are unchanged. D2 is narrowed: the browser chunk loads `@testing-library/dom` and `@testing-library/user-event`, not `@testing-library/react` (§5.3).

---

## 1. Sequencing

| Step | Issue | Status |
|---|---|---|
| MiroirTest leaves for transformers, function calls, queries | #195, #196 | ✅ |
| Runner and action leaves, UI integration launcher | #197 | ✅ |
| Classification of the remaining vitest files | #204 | open |
| `reactComponentTest` leaf, JzodElementEditor suites | **#286 (this document)** | this issue |
| Declarative JSON steps and assertions for component tests | later, unscheduled | later |
| `JzodElementEditorReactCodeMirror.test.tsx` and other UI_COMPONENT files from #204 | later, unscheduled | later |

---

## 2. Decision record

Confirmed with the user on 2026-09-24. All recommended defaults were accepted.

| ID | Question | Choice |
|---|---|---|
| D1 | How is a test represented? | A new leaf kind `reactComponentTest` that names a registered TypeScript test body by `{suite, case}`, as `functionCallTest` names a function in `FunctionCallTestRegistry.ts`. A declarative JSON language comes later. |
| D2 | What drives the DOM in the browser? | Testing Library, loaded only in a lazy chunk. This revises the #197 rule that the UI launcher must not load `@testing-library/*`. After review: `@testing-library/dom` and `@testing-library/user-event` only, with no React `act` (§5.3). |
| D3 | Where does the component render in the UI? | A visible sandbox panel with its own providers, store, and local cache. The live application state is not touched. |
| D4 | What do assertions mean? | A throwing `expect` for this leaf kind. miroir-core `test-expect` gains the DOM matchers the suites use. A thrown assertion becomes a recorded failure. |
| D5 | Scope and order | Pilot with Array and Enum, then one suite per slice. Drop the `'component'` test mode. The commented-out Book, EntityDefinition, Performance, and Endpoint suites stay out of scope. The old file is deleted once all 7 suites pass as MiroirTests. |
| D6 | Where do bodies and registry live? | `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/`, behind one lazy `import()`. miroir-core gets `ConfigurationService.registerReactComponentTestRunner(...)`. |
| D7 | Leaf granularity and JSON authoring | One leaf per case, one sub-suite per editor. A generator script writes the JSON from a React-free manifest of the registry. A vitest check fails when they disagree. `suiteProps` stay in TypeScript. |
| D8 | Which application owns the MiroirTest instance? | Miroir: `JzodElementEditor_ComponentTestSuite` in `deployment-miroir/assets/miroir_data/a311f363-…/`. Library data is only the fixture. |
| D9 | vitest execution | The miroir-core generic entry does not run `reactComponentTest` leaves (the tracker records them as skipped). A new miroir-standalone-app entry registers the runner and runs only these leaves. |
| D10 | UI integration | Leaves run in `"unit"` execution mode under the existing unit Run button. The sandbox stays open after the run with the last case's DOM and has a close button. "Run all MiroirTests" includes component tests behind a checkbox, on by default. |
| D11 | `screen.debug` calls | Removed during the migration (9 live calls in the 7 active suites). |
| D12 | Tracking the policy change | This issue. #197's policy note, #204's plan, `docs/reference/testing.md`, and `docs/internals/code-splitting.md` point here. |
| D13 | `JzodElementEditorReactCodeMirror.test.tsx` | Out of scope. It is the next candidate once this lands. |

---

## 3. Current state

### 3.1 The test file

`JzodElementEditor.test.tsx` has 3564 lines. The seven active suites are registered in `jzodElementEditorTests` (L3485-3558) and run by `prepareAndRunTestSuites` (L3562-3564).

| Suite | Factory | Active cases |
|---|---|---|
| JzodArrayEditor | `getJzodArrayEditorTests` (L76) | 12 |
| JzodEnumEditor | `getJzodEnumEditorTests` (L444) | 3 |
| JzodLiteralEditor | `getJzodLiteralEditorTests` (L642) | 3 |
| JzodObjectEditor | `getJzodObjectEditorTests` (L741) | 14 |
| JzodSimpleTypeEditor | `getJzodSimpleTypeEditorTests` (L1426) | 12 |
| JzodUnionEditor | `getJzodUnionEditorTests` (L1799) | 9 |
| JzodAnyEditor | `getJzodAnyEditorTests` (L2585) | 15 |
| **Total** | | **68** |

Eight more cases in these factories are commented out. The Book, EntityDefinition, Performance, and Endpoint factories hold 4 more active cases, but their suites are commented out of `jzodElementEditorTests`. Issue #286 first said "80 cases". The correct count for the 7 active suites is 68. On 2026-09-24 on this branch, `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test` gave 68 passed out of 68, in 51 s.

A case is `{ tests: async (expect: ExpectStatic, container: Container) => Promise<void> }` plus optional props (`ReactComponentTestCase`, `JzodElementEditorTestTools.tsx` L403-414).

What the bodies of the 7 active suites use (live code, comments excluded):

| Kind | Uses |
|---|---|
| RTL | `fireEvent`, `act`, `waitFor`, `screen.getBy*` / `getAllBy*` / `queryBy*`, and `screen.debug` (9 calls). 17 queries are split as `screen` on one line and `.getAllByRole(…)` on the next. |
| user-event | `userEvent.setup()`, then `user.type` and `user.clear` (26 calls) |
| `container` argument | 125 uses, mostly as the third argument of `extractValuesFromRenderedElements(expect, filter, container, …)` |
| `expect.getState().currentTestName` | 4 uses, in the Array suite (L224-250) |
| Helpers from the tools | `extractValuesFromRenderedElements` (45 calls), `formValuesToJSON`, `formikFieldName`, `testSectionName`, `waitAfterUserInteraction`, and the module-level `log` |
| Matchers | `toEqual` 50, `toBeInTheDocument` 21, `toHaveValue` 22, plus `toBe`, `toBeTruthy`, `toBeNull`, `toBeChecked`, `toContainHTML`, and `.not` forms |

`toBeInTheDocument`, `toHaveValue`, `toBeChecked`, and `toContainHTML` come from `@testing-library/jest-dom` (imported at L7). Test L601 runs `.not.toBeInTheDocument()` on a `null` value from `queryByLabelText`.

### 3.2 The test tools

`JzodElementEditorTestTools.tsx` has 2312 lines. It imports vitest (`expect`, `ExpectStatic`, `vi`, L7) and `@testing-library/react` (`act`, `render`, `screen`, `waitFor`, L4). Fourteen other test files import it. Among them are the #274 and #284 multistep integration tests, `gridPagination.*`, `listDisplayByTransformer.*`, `ReportPage.integ.test.tsx`, `virtualAttributes.integ.test.tsx`, `extractValuesFromRenderedElements.test.tsx`, and `formValuesToJSON.test.ts`.

These parts of the tools behave differently or break in the browser:

1. `getWrapperLoadingLocalCache` (L732) calls `ConfigurationService.configurationService.registerTestImplementation({ expect })` with the vitest `expect` (L760). The app registers its own `expect` at startup (`src/index.tsx` L226, L370). DomainController reads that global at L5233 and L5326. Calling this from the sandbox would replace the app's registration.
2. `handleAction = vi.fn()` (L432) needs vitest.
3. `waitForProgressiveRendering` (L200-220) reads `process.env.VITE_TEST_MODE` and `process.env.VITEST`. The browser build has no `process`.
4. `extractValuesFromRenderedElements` sets `const searchRoot = document` (L1465), with the comment "otherwise comboboxes options are not found". It also reads `document.querySelector('[role="listbox"]')` and `document.body` (L1344-1345), and then collects every `input[name]`, `select`, `[role="combobox"]`, and option in the page (L1466-1497, L1766-1806). It uses `container.querySelectorAll` only at L1691 and L1705.
5. `getWrapperLoadingLocalCache` builds its own `MiroirActivityTracker`, `MiroirEventService`, `MiroirContext`, `PersistenceReduxSaga`, and `LocalCache` (L741-773), then loads the Miroir meta-model and Library fixtures into that cache. This is the isolation D3 needs. `getJzodEditorTestSuites` (L1213-1238) builds one wrapper per suite, so all cases of a suite share one `LocalCache`. Each `MiroirEventService` starts a 2-minute `setInterval` (`MiroirEventService.ts` L147, L151) that only `destroy()` (L496) stops.
6. The tools have about 100 `console.log` lines, including one per render in `getJzodElementEditorForTest` (L536) and the full meta-model dump when `VITE_TEST_MODE` is not `"true"` (L775-777).
7. The tools import `emptyObject` from `routes/TransformerBuilderPage.js` (L66), which pulls a route page and `TransformerEditor` into anything that imports the tools.
8. `runJzodEditorTest` (L1131-1210) calls RTL `render` with no `container`, so RTL mounts into a new `div` appended to `document.body`.

The 7 active suites use the `handleAction` stub. They do not call `PersistenceReduxSaga.run`, the module-level `jzodEditorTestLocalCache`, or `DomainController`. `MiroirContextReactProvider` does not write `MiroirLoggerFactory`.

### 3.3 Test-mode forks in the editors

Two forks make the component render differently under vitest:

- `useViewportReveal` (`src/miroir-fwk/4_view/tools/useViewportReveal.ts` L63) disables progressive reveal only when `isVitestTestMode()` is true (`progressiveRenderConfig.ts` L59-62). In the app, sections start as placeholders.
- `JzodElementEditor.tsx` L92-95 sets `isUnderTest` from `import.meta.env.VITE_TEST_MODE` and passes it on at L1895. Under test, `JzodElementEditorReactCodeMirror.tsx` L47-53 renders a `<pre>codeMirrorValue:…</pre>` box instead of `ReactCodeMirror`. In the app, a real CodeMirror mounts in every object, array, and any node, hidden with `display: none` (L157).

### 3.4 Portals

`ThemedSelectWithPortal` renders its option list with `createPortal(…, document.body)` (`FormComponents.tsx` L695, target L737) and adds `document` listeners (L301, L323). `JzodEnumEditor.tsx` (L519, L534), `JzodLiteralEditor.tsx`, and `JzodElementEditor.tsx` (L873, L1320) use it. The Enum pilot case "renders all enum options" (test L509-566) opens this dropdown and reads its options. One MUI select remains: `ThemedMUISelect` (`JzodElementEditor.tsx` L1371). MUI is 5.17.1.

### 3.5 The MiroirTest runtime

The generator input for the leaf union is the MiroirTest Entity `miroir_model/16dbfe28-…/a311f363-….json` (`miroirTestLeaf` at L222). `generate-ts-types.ts` L394 passes `entityMiroirTest` to `getMiroirFundamentalJzodSchema`, which reads `entityDefinitionMiroirTest.mlSchema.definition.definition` (`getMiroirFundamentalJzodSchema.ts` L1467-1471). `miroir-test-app_deployment-miroir/index.ts` L41 binds `entityMiroirTest` to that file. The EntityVersion `51c647fe-…` carries a second copy (`miroirTestLeaf` at L218-252). Both have five members: transformer, function call, query, runner, and action. `npm run devBuild -w miroir-core` regenerates `preprocessor-generated/*`. Hand edits there are overwritten (`docs/reference/testing.md` L1394). miroir-core `index.ts` exports the leaf types at L462-473.

Code that switches on `miroirTestType` and needs a new arm:

- `runMiroirTest` (`MiroirTestTools.ts` L143-287). It is `async`, and its default arm is an exhaustive `never` check.
- `miroirTestLeafSupportsUnitExecution` (`inferIntegrationSessionKind.ts` L42) and `miroirTestLeafRequiresIntegrationExecution` (L59). `inferIntegrationSessionKind` itself (L80-104) needs no change.

`runMiroirTestSuiteWalk` (`miroirTestSuiteWalk.ts` L57-244) awaits each leaf, so an async leaf fits. It registers each leaf with `localVitest.test(label, …)` (L208-236) and opens no `describe` for sub-suites, so vitest names are the bare leaf label.

With `trackActionsBelow = true`, which the miroir-core entry and the UI buttons use, `_runMiroirTestWithTracking` returns before the leaf arm when `leaf.skip` or `parentSkip` is set (`MiroirTestTools.ts` L371-373). A leaf records its outcome with `miroirActivityTracker.setTestAssertionResult(...)` (`FunctionCallTestTools.ts` L384). It rethrows a failure whenever `localVitest.test` is a function (L390-399). In the UI, `TestFramework.test` (`test-expect.ts` L32-35) calls the body without a `try`, so a rethrown failure there would end the whole suite run. `MiroirTestExecutionOptions` (L99-110) has a `"unit"` arm. `MiroirTestRunFilter` holds only `testList` and `match` (`miroirTestTypes.ts` L3-6).

### 3.6 UI execution path

`MiroirTestDisplay.tsx` renders `RunMiroirTestSuiteButton` for unit runs (about L140), `UiIntegrationTestRunControls` and a second button for integration runs (about L154-155), and `TestExecutionPanel` for results (about L186). `RunMiroirTestSuiteButton.onUnitAction` calls `resetResults()` and then `runMiroirTests._runMiroirTestSuite(TestFramework, …, { executionMode: "unit" })` directly (L106-124). It then reads `tracker.getTestAssertionsResults([])`. `RunAllMiroirTestsButton` is rendered by `MiroirTestListDisplay.tsx` (L170, L183), not by `MiroirTestDisplay`. It runs every suite with an `undefined` filter (L199-210).

miroir-core `expect` (`test-expect.ts` L121-296) returns `{ result, message }` and never throws. It has `toBe`, `toEqual`, `toStrictEqual`, `toBeNull`, `toBeDefined`, `toBeUndefined`, `toBeNaN`, `toBeTruthy`, `toBeFalsy`, `toHaveLength`, `toBeGreaterThan` (L247), the other numeric comparisons, `toMatch`, `toMatchObject`, `toThrow`, `toHaveProperty`, `toContain`, and `.not`. `.not` inverts the positive matcher (L285-295). It has no DOM matchers. Its `toEqual` uses `fast-deep-equal` for objects and `==` for primitives (L130-131). Vitest `toEqual` ignores keys whose value is `undefined`. `fast-deep-equal` does not.

### 3.7 React `act` in production

React is 18.3.1. In `react.production.min.js`, `act` throws "act(...) is not supported in production builds of React." RTL 16.3 resolves `act` as `React.act ?? ReactDOMTestUtils.act` (`@testing-library/react/dist/act-compat.js` L13). Its `render`, and its `fireEvent`, `waitFor`, and user-event wrappers, go through that `act`. The client bundle served from `miroir-server/release/client` and the Electron app are production builds. `@testing-library/dom` alone does not call `act` unless `@testing-library/react` has configured its `eventWrapper` and `asyncWrapper`.

### 3.8 vitest entries and nonreg

`miroir-core/tests/miroir-core-tests.unit.test.ts` finds every MiroirTest folder in the `miroir-test-app_deployment-*` packages (`loadApplicationMiroirTestsFromFolders.ts` L59, L189) and runs every suite. Once `JzodElementEditor_ComponentTestSuite` exists in `miroir_data`, this entry will load it.

The miroir-standalone-app vitest config (`vite.config.js` L121-141) uses `environment: 'happy-dom'` and `setupFiles: ['./setup.ts']`. `tests/setup.ts` sets `IS_REACT_ACT_ENVIRONMENT = true` (L26), calls `configure({ asyncUtilTimeout: 5000 })`, and calls RTL `cleanup()` after each test (L41-44). RTL `cleanup` removes every container it rendered whose `parentNode === document.body`.

Each MiroirTest instance in the Miroir deployment also has a named export in `miroir-test-app_deployment-miroir/index.ts` (L269 onward) and an entry in `defaultMiroirMetaModel.tests` (`miroir-test-app_deployment-miroir/src/Model.ts` L351 onward). `tests/modelValidation.unit.test.ts` validates `defaultMiroirMetaModel`.

Nonreg steps concerned:

- `appstack-JzodElementEditor.test` (`scripts/nonreg-manifest.json` L812-826) runs `testByFile -w miroir-standalone-app -- --profile {profile} JzodElementEditor.test`.
- `unit-check-bare-console` (L13-20) runs `scripts/check_bare_console.py`. It fails on any `console.log/info/debug/warn/error(` under `packages/*/src` that is not allowlisted.

`miroir-standalone-app/package.json` L53 already depends on `miroir-test-app_deployment-library`. `src/miroir-fwk/4-tests/resolveCanonicalTestDeploymentUuid.ts` L3 imports it, so Library fixtures are available to the browser bundle.

### 3.9 Policy documents

- #197 `analysis-ui-integ-without-testing-library.md` §8 (L176-186) says the UI launcher must not load `@testing-library/*` or `renderWithProviders`. It proposes refusing suites tagged `proofHarness: "rtl"`. L170 says JzodElementEditor remains a vitest baseline.
- #204 `plan.md` L201 lists `JzodElementEditor.test.tsx` as UI_COMPONENT: "product UI; needs in-UI enactment path".
- `docs/reference/testing.md` L143 lists `JzodElementEditor.test.tsx` as a PLATFORM file with no MiroirTest equivalent. L759-784 describe how to run it, including `-t "JzodObjectEditor"` (L780-784).
- `docs/internals/code-splitting.md` lists every lazy entry of the app.

---

## 4. Gaps

| # | Gap | Where |
|---|---|---|
| G1 | No leaf kind names a component test | Entity `a311f363-…`, EntityVersion `51c647fe-…`, `runMiroirTest`, `inferIntegrationSessionKind.ts` |
| G2 | miroir-core cannot import React or the app, so it cannot run a component test itself | package boundary |
| G3 | Test bodies and tools live under `tests/`, which the app build does not include | §3.1, §3.2 |
| G4 | The tools depend on vitest (`vi.fn`, vitest `expect`, `process.env`), replace a process-wide registration, and log with bare `console.log` | §3.2 items 1-3, 6 |
| G5 | In the browser, `screen` queries and `extractValuesFromRenderedElements` search all of `document`, including the app's own inputs and buttons | §3.2 item 4 |
| G6 | The option lists of `ThemedSelectWithPortal` and `ThemedMUISelect` render under `document.body`, outside any sandbox element | §3.4 |
| G7 | Progressive reveal and the CodeMirror placeholder are on in vitest and off in the app | §3.3 |
| G8 | The UI `expect` does not throw, lacks DOM matchers, and compares `undefined` keys differently from vitest | §3.6 |
| G9 | In the UI, a leaf that throws ends the whole suite run | §3.5 |
| G10 | React `act` throws in production builds, and RTL uses it everywhere | §3.7 |
| G11 | No sandbox host, no way for the Run button to prepare it, and no filter by leaf type for Run all | §3.6 |
| G12 | The generic miroir-core entry would try to run the new leaves without a runner | §3.8 |
| G13 | vitest names lose the suite, and two pilot cases share a label | §3.5 |
| G14 | A new MiroirTest instance needs an export and a `tests` entry, not only JSON | §3.8 |

---

## 5. Design

### 5.1 Leaf schema (G1)

Add `miroirTestForReactComponent` to `miroirTestLeaf` in the MiroirTest Entity `miroir_model/16dbfe28-…/a311f363-….json`, which is the generator input. Make the same edit in EntityVersion `51c647fe-…` (dual write).

```json
{
  "miroirTestType": "reactComponentTest",
  "miroirTestLabel": "JzodArrayEditor: renders all array values, in the right order",
  "skip": false,
  "componentTestRef": { "suite": "JzodArrayEditor", "case": "renders all array values, in the right order" }
}
```

`miroirTestType` is the literal `"reactComponentTest"`. `componentTestRef.suite` and `componentTestRef.case` are strings. `skip` has the same meaning as on other leaves. Run `npm run devBuild -w miroir-core`, then add `MiroirTestForReactComponent` and `miroirTestForReactComponent` to the miroir-core `index.ts` export block (L462-473).

`miroirTestLeafSupportsUnitExecution` returns true for the new leaf, and `miroirTestLeafRequiresIntegrationExecution` returns false, as for `functionCallTest`. `runMiroirTest` refuses it in integration mode with the same message pattern as `functionCallTest`.

### 5.2 Runner injection in miroir-core (G2, G9, G12)

`ConfigurationServiceInner` gets:

```ts
registerReactComponentTestRunner(runner: ReactComponentTestRunner | undefined): void;
reactComponentTestRunner: ReactComponentTestRunner | undefined;

type ReactComponentTestRunner = (params: {
  componentTestRef: { suite: string; case: string };
  testNamePath: string[];
}) => Promise<{ status: "ok" } | { status: "error"; message: string; expected?: unknown; actual?: unknown }>;
```

The `reactComponentTest` arm of `runMiroirTest`:

1. If no runner is registered, it records a `skipped` result in the tracker with the message `reactComponentTest requires a registered component test runner` and returns. Under the miroir-core generic entry the vitest test body then ends without error, so vitest reports these leaves as passed, and the tracker reports them as skipped (G12).
2. Otherwise it awaits the runner and records `ok` or `error` through `setTestAssertionResult`.
3. It rethrows an `error` only when `executionOptions.rethrowComponentTestFailures` is true. The option sits on the `"unit"` arm of `MiroirTestExecutionOptions`. The new vitest entry sets it. The UI buttons leave it unset, so one failing case does not end the run (G9).

`leaf.skip` and `parentSkip` are handled before the arm by `_runMiroirTestWithTracking` (L371-373), as for other leaves.

The unit arm of `MiroirTestExecutionOptions` also gets `excludeMiroirTestTypes?: MiroirTestLeaf["miroirTestType"][]`. `_runMiroirTestWithTracking` records an excluded leaf as skipped and does not call its arm. Run all uses it (§5.6).

### 5.3 Component test module in the app (G3, G4, G5, G10)

The browser chunk and the new vitest entry use the same act-free driver:

- `@testing-library/dom` for `within`, `fireEvent`, `waitFor`, and `configure`.
- `@testing-library/user-event` for typing.
- A local `mountComponent(element, target)` that calls `createRoot(target)` and renders inside `flushSync`. It returns `unmount`.
- `env.act(callback)` awaits the callback, then awaits one macrotask (`setTimeout(0)`) so React commits pending updates. It never calls React `act`.

`@testing-library/react` is not imported by the chunk. This works in development and production builds (G10). `componentTestEnvironment.ts` calls `configure({ asyncUtilTimeout: 5000, testIdAttribute: "data-testid", eventWrapper: (cb) => cb(), asyncWrapper: (cb) => cb() })` when it starts. That puts the same timeout and wrappers in both runs, and replaces the `act` wrappers that `tests/setup.ts` installs by importing `@testing-library/react`. The new vitest entry sets `IS_REACT_ACT_ENVIRONMENT = false` at file scope.

New folder `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/`:

| File | Content |
|---|---|
| `componentTestEnvironment.ts` | The per-case object passed to each body: `{ expect, view, container, fireEvent, userEvent, act, waitFor, sandboxElement, portalElement, log }`. `view` is `within(container)` merged with `within(portalElement)` queries. `container` is the case's render target. `expect` is the throwing `expect` from §5.5 with `getState()` returning `{ currentTestName }`. `log` is a `MiroirLoggerFactory` logger. |
| `componentTestTools.tsx` | The browser-safe part of `JzodElementEditorTestTools`: prop types, `getWrapperLoadingLocalCache`, `getJzodElementEditorForTest`, `extractValuesFromRenderedElements`, `formValuesToJSON`, `formikFieldName`, `testSectionName`, and the wait helpers. No vitest import, no `process.env`, no `registerTestImplementation` call, no bare `console.*` (loggers only, so `unit-check-bare-console` stays green). `handleAction` becomes a plain recording function. |
| `jzodElementEditor/*.tsx` | One file per editor suite with its case bodies, rewritten from `(expect, container)` to `(env: ComponentTestEnvironment)`. |
| `componentTestManifest.ts` | React-free: `Record<suite, caseLabel[]>`. The generator and the consistency test import only this file. |
| `componentTestRegistry.ts` | `Record<suite, { component, suiteProps, cases: Record<case, ReactComponentTestCase> }>`. A vitest check asserts that its keys equal the manifest. |
| `runReactComponentTest.tsx` | The `ReactComponentTestRunner` (§5.6). |
| `index.ts` | `registerComponentTests(sandboxHost)`. This is the only export the app reaches, through one `import()`. |

`extractValuesFromRenderedElements` takes a required `root` and searches only `root` and the portal element (G5). A vitest case renders an extra named input outside the sandbox and checks that the function ignores it.

`emptyObject` moves from `routes/TransformerBuilderPage.js` to a small module with no imports, so the chunk does not pull a route page.

`tests/4_view/JzodElementEditorTestTools.tsx` re-exports `componentTestTools.tsx` and keeps the vitest-only helpers. It keeps a local `getWrapperLoadingLocalCache` that calls `registerTestImplementation({ expect })` and then delegates, so its 14 importers behave as today. They do not change in this issue.

Body rewrite rules: every `screen` identifier becomes `view` (this covers the 17 split chains), `expect` becomes `env.expect`, `container` becomes `env.container`, `userEvent` becomes `env.userEvent`, `log` becomes `env.log`, `screen.debug(...)` is deleted (D11), and each `extractValuesFromRenderedElements(expect, filter, container, …)` call passes `env.container` as root. The `FunctionCallTestRegistry.ts` whitelist is the precedent for naming a TypeScript implementation from a leaf.

### 5.4 Portals and test-mode forks (G6, G7)

A new `PortalContainerContext` (default `document.body`) is read by `ThemedSelectWithPortal` for its `createPortal` target and its outside-click listener root. The sandbox providers set it to `portalElement`, a child of `sandboxElement`. For `ThemedMUISelect`, the sandbox theme sets `defaultProps.container` on `MuiPopover`, `MuiPopper`, `MuiModal`, and `MuiMenu` to `portalElement`. MUI 5 `useThemeProps` reads the emotion theme that the tools' `ThemeProvider` sets. The pilot confirms this at runtime.

A new `ComponentTestModeContext` holds `{ progressiveRenderDisabled: boolean; codeMirrorPlaceholder: boolean }`, default `false` for both. `useViewportReveal` reads `progressiveRenderDisabled` next to `isVitestTestMode()`. `JzodElementEditor` reads `codeMirrorPlaceholder` next to `VITE_TEST_MODE` when it computes `isUnderTest`. The sandbox providers set both to `true`, so the app renders the same DOM as vitest. The vitest path is unchanged.

### 5.5 Assertions (G8)

miroir-core `test-expect.ts` gets `createThrowingExpect(testName)`. It returns an `expect` whose matchers call the existing ones and throw `MiroirAssertionError(message)` when `result` is false. It adds:

- `getState()` returning `{ currentTestName: testName }`.
- DOM matchers on `Element | null`, following jest-dom: `toBeInTheDocument` (`element.ownerDocument.contains(element)`), `toHaveValue` (input, select, and textarea value, with number coercion for `type="number"`), `toBeChecked`, `toContainHTML(html)`. A `null` actual fails the positive form with a message and passes the `.not` form. It never raises a `TypeError`.
- `toEqual` in the throwing `expect` ignores object keys whose value is `undefined`, as vitest does. The non-throwing `expect` keeps its current behaviour.

The component runner uses the throwing `expect` in vitest and in the UI, so the case bodies run against one assertion library.

### 5.6 Runner, sandbox, and UI wiring (G9, G11)

`ComponentTestSandboxProvider` holds the sandbox state and exposes `prepareComponentTests(): Promise<void>`. It renders a `ComponentTestSandbox` panel that owns `sandboxElement`. The element stays mounted and hidden until a run starts. Both `MiroirTestDisplay` and `MiroirTestListDisplay` mount the provider, so the single-suite view and Run all each have a sandbox.

`prepareComponentTests` loads the chunk with `import()` on first use and calls `registerComponentTests(sandboxHost)`. `RunMiroirTestSuiteButton` and `RunAllMiroirTestsButton` get an optional `beforeRun` prop. When the suite contains a `reactComponentTest` leaf and component tests are included, they `await beforeRun()` before `resetResults()` and `_runMiroirTestSuite`.

`runReactComponentTest` for one case:

1. Looks up the suite and case in the registry. An unknown reference is an `error` result naming the missing suite or case.
2. Uses one wrapper per suite, as vitest does (§3.2 item 5): it builds `getWrapperLoadingLocalCache` on the suite's first case and reuses it for later cases.
3. Creates a fresh child `div` of `sandboxElement` as `container`, unmounts the previous case, and mounts the wrapped component into `container`. The sandbox element is never a render container, so RTL `cleanup()` in `tests/setup.ts` does not detach it.
4. Runs the body with a fresh `ComponentTestEnvironment` and converts a thrown `MiroirAssertionError` or other error into an `error` result.
5. On the suite's last case, or when the panel's close button is pressed, it calls `miroirEventService.destroy()` for that suite's wrapper.

The last case stays mounted after the run. The close button unmounts it and hides the panel.

`RunAllMiroirTestsButton` gets an "Include component tests" checkbox, checked by default. When unchecked, it passes `excludeMiroirTestTypes: ["reactComponentTest"]` and skips `beforeRun`. Cases run one at a time because the walk awaits each leaf.

### 5.7 MiroirTest JSON and package wiring (D7, D8, G14)

`packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts` imports `componentTestManifest.ts` only. It writes `JzodElementEditor_ComponentTestSuite` (a fixed uuid) into `deployment-miroir/assets/miroir_data/a311f363-…/`, with one sub-suite per editor and one leaf per case in manifest order. It then checks, and adds if missing, the named export in `miroir-test-app_deployment-miroir/index.ts` and the entry in `defaultMiroirMetaModel.tests` (`miroir-test-app_deployment-miroir/src/Model.ts`). After it runs, `npm run build -w miroir-test-app_deployment-miroir` refreshes the package.

`componentMiroirTests.consistency.unit.test.ts` loads the JSON, the manifest, and the registry. It fails on any suite or case present on one side only, and on a leaf label reused anywhere in the instance.

How the running app loads MiroirTest rows into its Miroir deployment was not checked. Slice 0 of the plan checks it and states the step that makes the new instance visible in `MiroirTestListDisplay`.

### 5.8 vitest entry (D9, G13)

`packages/miroir-standalone-app/tests/4_view/miroir-component-tests.unit.test.tsx`:

1. Sets `IS_REACT_ACT_ENVIRONMENT = false` and imports the registry directly, not through `import()`.
2. Creates a sandbox element appended to `document.body` and registers the runner with it.
3. Loads `JzodElementEditor_ComponentTestSuite` from the deployment folder.
4. For each sub-suite, opens `describe(<suite>)` and calls `runMiroirTests._runMiroirTestSuite(vitest, …, { executionMode: "unit", rethrowComponentTestFailures: true })` on that sub-suite.

vitest names are `<suite> > <leaf label>`, so `-t "JzodObjectEditor"` keeps working, and leaf labels carry the suite prefix too (§5.1).

During the migration, both the old `JzodElementEditor.test.tsx` and the new entry run. Each slice deletes its suite from `jzodElementEditorTests` once the new entry passes it. The last slice deletes the old file, and the nonreg step `appstack-JzodElementEditor.test` switches to the new entry. The new entry does not use `--profile`, because the in-memory `LocalCache` never reads a store.

### 5.9 Bundle split and documentation

`@testing-library/dom`, `@testing-library/user-event`, and `componentTests/` are reached only through the one `import()` in `ComponentTestSandboxProvider`. A vitest check reads the production build manifest (`dist/.vite/manifest.json`, with `build.manifest: true` if it is not set). It fails if a chunk statically imported from the entry contains `@testing-library`. `@testing-library/dom` and `@testing-library/user-event` move from `devDependencies` to `dependencies` in `miroir-standalone-app/package.json`.

Documentation updates: #197 `analysis-ui-integ-without-testing-library.md` §8, #204 `plan.md` L201, `docs/reference/testing.md` L143 and L759-784, and `docs/internals/code-splitting.md` (new lazy entry).

---

## 6. Risks and open points

| # | Risk | Mitigation |
|---|---|---|
| K1 | Without React `act`, a body can assert before React commits, where the act-based run did not | `env.act` waits a macrotask, and `waitFor` polls. The pilot runs each case in the old and new vitest entries and compares. If the act-free driver cannot match, the fallback is to run component tests only in development builds (`import.meta.env.DEV`) with React `act`, and record them as skipped with a message in production. |
| K2 | Emotion styles or the MUI theme leak between the sandbox and the app | The sandbox has its own `ThemeProvider` and `StyledEngineProvider`. The pilot checks the app's look after a run. |
| K3 | Browser timing differs from happy-dom | Both runs use `asyncUtilTimeout: 5000`. A timeout becomes a failure with a message, not a hang. |
| K4 | DOM matcher rules drift from jest-dom | Unit tests for each matcher run the same fixture DOM through jest-dom and the new matcher, including `null` under `.not`. |
| K5 | The 14 other importers of `JzodElementEditorTestTools` break when the tools move | The re-export keeps their import path, exports, and `registerTestImplementation` call. Their nonreg steps run in every slice. |
| K6 | Library fixtures are not available to the browser bundle | Resolved: `miroir-standalone-app` already depends on `miroir-test-app_deployment-library` (§3.8). |
| K7 | `toEqual` semantics change for the 50 `toEqual` checks | The throwing `toEqual` ignores `undefined`-valued keys as vitest does. The pilot compares old and new results case by case. |
| K8 | The sandbox DOM differs from vitest in a way `ComponentTestModeContext` does not cover | The pilot runs the Array and Enum suites in the app and records any case that passes in vitest and fails in the app. |
| K9 | The app does not load new MiroirTest rows without a further step | Slice 0 checks this (§5.7). |

---

## 7. Validation

- The pilot slice: Array (12) and Enum (3) pass through the new vitest entry and match the old file's results for the same cases.
- In the app served by the Vite dev server and in a production build (`miroir-server/release/client`), the pilot suite runs from `MiroirTestDisplay`, shows 15 results, and the app's store is unchanged. The Library report still loads after the run.
- `unit-check-bare-console` and the bundle split check pass.
- Each later slice moves one suite and keeps the old and new counts equal.
- Final: 68 cases pass through the new entry. The old file is deleted. The default nonreg tier is green.
