# 286 React component tests as MiroirTests (JzodElementEditor)

> How the JzodElementEditor React Testing Library cases become MiroirTest leaves that run under vitest (happy-dom) and in the running app, in a sandbox panel with isolated state.

Related issue: https://github.com/miroir-framework/miroir/issues/286
Prior work: [#195 run miroir-core unit tests in the UI](https://github.com/miroir-framework/miroir/issues/195) ✅ · [#196 migrate tests to MiroirTest](https://github.com/miroir-framework/miroir/issues/196) ✅ [`../196-FEATURE-migrate-tests-to-MiroirTest/plan.md`](../196-FEATURE-migrate-tests-to-MiroirTest/plan.md) · [#197 run integration tests in the UI](https://github.com/miroir-framework/miroir/issues/197) ✅ [`../197-FEATURE- run integration tests in the UI/analysis-ui-integ-without-testing-library.md`](<../197-FEATURE- run integration tests in the UI/analysis-ui-integ-without-testing-library.md>) · [#204 classify tests for MiroirTest migration](https://github.com/miroir-framework/miroir/issues/204) (open) [`../204-DOCUMENTATION-classify-tests-for-MiroirTest-migration/plan.md`](../204-DOCUMENTATION-classify-tests-for-MiroirTest-migration/plan.md)
Key sources: [`JzodElementEditor.test.tsx`](../../../packages/miroir-standalone-app/tests/4_view/JzodElementEditor.test.tsx) · [`JzodElementEditorTestTools.tsx`](../../../packages/miroir-standalone-app/tests/4_view/JzodElementEditorTestTools.tsx) · [`MiroirTestTools.ts`](../../../packages/miroir-core/src/5_tests/MiroirTestTools.ts) · [`miroirTestSuiteWalk.ts`](../../../packages/miroir-core/src/5_tests/miroirTestSuiteWalk.ts) · [`FunctionCallTestTools.ts`](../../../packages/miroir-core/src/5_tests/FunctionCallTestTools.ts) · [`test-expect.ts`](../../../packages/miroir-core/src/1_core/testing/test-expect.ts) · [`ConfigurationService.ts`](../../../packages/miroir-core/src/3_controllers/ConfigurationService.ts) · [MiroirTest EntityDefinition `51c647fe-…`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/51c647fe-07ec-411c-89cc-02689dc66d6a.json) · [`RunMiroirTestSuiteButton.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Buttons/RunMiroirTestSuiteButton.tsx) · [`MiroirTestDisplay.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MiroirTestDisplay.tsx) · [`miroir-core-tests.unit.test.ts`](../../../packages/miroir-core/tests/miroir-core-tests.unit.test.ts)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with the user (2026-09-24 grilling). Not yet reviewed.

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
| D1 | How is a test represented? | A new leaf kind `reactComponentTest` that names a registered TypeScript test body by `{suite, case}`. A declarative JSON language comes later. |
| D2 | What drives the DOM in the browser? | `@testing-library/react`, `@testing-library/dom`, and `@testing-library/user-event`, loaded only in a lazy chunk. This revises the #197 rule that the UI launcher must not load `@testing-library/*`. |
| D3 | Where does the component render in the UI? | A visible sandbox panel with its own providers, store, and local cache. The live application state is not touched. |
| D4 | What do assertions mean? | A throwing `expect` for this leaf kind. miroir-core `test-expect` gains the DOM matchers the suites use. A thrown assertion becomes a recorded failure. |
| D5 | Scope and order | Pilot with Array and Enum, then one suite per slice. Drop the `'component'` test mode. The commented-out Book, EntityDefinition, Performance, and Endpoint suites stay out of scope. The old file is deleted once all 7 suites pass as MiroirTests. |
| D6 | Where do bodies and registry live? | `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/jzodElementEditor/`, behind one lazy `import()`. miroir-core gets `ConfigurationService.registerReactComponentTestRunner(...)`. |
| D7 | Leaf granularity and JSON authoring | One leaf per case, one sub-suite per editor. A generator script writes the JSON from the registry. A vitest check fails when they disagree. `suiteProps` stay in TypeScript. |
| D8 | Which application owns the MiroirTest instance? | Miroir: `JzodElementEditor_ComponentTestSuite` in `deployment-miroir/assets/miroir_data/a311f363-…/`. Library data is only the fixture. |
| D9 | vitest execution | The miroir-core generic entry reports `reactComponentTest` leaves as skipped. A new miroir-standalone-app entry registers the runner and runs only these leaves. |
| D10 | UI integration | Leaves run in `"unit"` execution mode under the existing unit Run button. The sandbox stays open after the run with the last case's DOM and has a close button. "Run all MiroirTests" includes component tests behind a checkbox, on by default. |
| D11 | `screen.debug` calls | The 26 `screen.debug` calls and the one `screen.logTestingPlaygroundURL` call are removed. |
| D12 | Tracking the policy change | This issue. #197's policy note, #204's plan, and `docs/reference/testing.md` point here. |
| D13 | `JzodElementEditorReactCodeMirror.test.tsx` | Out of scope. It is the next candidate once this lands. |

---

## 3. Current state

### 3.1 The test file

`JzodElementEditor.test.tsx` has 3564 lines. The seven active suites are registered in `jzodElementEditorTests` (L3483-3558) and run by `prepareAndRunTestSuites` (L3562-3564).

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

Eight more cases in these factories are commented out. The Book, EntityDefinition, Performance, and Endpoint factories hold 4 more active cases, but their suites are commented out of `jzodElementEditorTests`. Issue #286 first said "80 cases". The correct count for the 7 active suites is 68. On 2026-09-24 on this branch, `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test` gives 68 passed out of 68, in 51 s.

A case is `{ tests: async (expect: ExpectStatic, container: Container) => Promise<void> }` plus optional props (`ReactComponentTestCase`, `JzodElementEditorTestTools.tsx` L403-416). Bodies use RTL directly.

| API | Uses |
|---|---|
| `fireEvent.click` / `change` / `blur` / `submit` | 45 / 16 / 2 / 1 |
| `userEvent.setup()` | 10 |
| `screen.getByTestId` / `getByRole` / `getAllByRole` / `getByText` / `getAllByText` / `getByDisplayValue` / `queryByLabelText` / `getByLabelText` / `getAllByTestId` | 30 / 26 / 9 / 9 / 5 / 4 / 2 / 1 / 1 |
| `screen.debug` / `logTestingPlaygroundURL` | 26 / 1 |
| `toEqual` / `toBe` / `toBeInTheDocument` / `toHaveValue` / `toBeTruthy` / `toBeNull` / `toBeGreaterThan` | 59 / 58 / 42 / 32 / 17 / 12 / 3 |
| `toHaveAttribute` / `toContainHTML` / `toBeChecked` | 1 / 1 / 2 |

Of these matchers, `toBeInTheDocument`, `toHaveValue`, `toHaveAttribute`, `toContainHTML`, and `toBeChecked` come from `@testing-library/jest-dom` (imported at L7). `toBeNull` and `toBeGreaterThan` are vitest matchers that miroir-core `test-expect` does not have either.

### 3.2 The test tools

`JzodElementEditorTestTools.tsx` has 2312 lines. It imports vitest (`expect`, `ExpectStatic`, `vi`, L7) and `@testing-library/react` (`act`, `render`, `screen`, `waitFor`, L4). Fourteen other test files import it. Among them are the #274 and #284 multistep integration tests, `gridPagination.*`, `listDisplayByTransformer.*`, `ReportPage.integ.test.tsx`, `virtualAttributes.integ.test.tsx`, `extractValuesFromRenderedElements.test.tsx`, and `formValuesToJSON.test.ts`.

These parts of the tools behave differently or break in the browser:

1. `getWrapperLoadingLocalCache` (L732) calls `ConfigurationService.configurationService.registerTestImplementation({ expect })` with the vitest `expect`. The app registers its own `expect` at startup (`src/index.tsx` L226, L370). DomainController reads that global at L5233 and L5326. Calling this from the sandbox would replace the app's registration.
2. `handleAction = vi.fn()` (L427) needs vitest.
3. `waitForProgressiveRendering` (L200-219) reads `process.env.VITE_TEST_MODE` and `process.env.VITEST`. The browser build has no `process`.
4. `useViewportReveal` (`src/miroir-fwk/4_view/tools/useViewportReveal.ts` L63) disables progressive reveal only when `isVitestTestMode()` is true (`progressiveRenderConfig.ts` L59-62). In the app it is false, so sections the tests expect to be present may still be placeholders.
5. `getWrapperLoadingLocalCache` builds its own `MiroirActivityTracker`, `MiroirEventService`, `MiroirContext`, `PersistenceReduxSaga`, and `LocalCache` (L741-773), then loads the Miroir meta-model and Library fixtures into that cache. This is the isolation D3 needs. It also logs the full meta-model when `VITE_TEST_MODE` is not `"true"` (L775-777).
6. `getJzodElementEditorForTest` (L536) calls `console.log` on every render.
7. `runJzodEditorTest` (about L1130-1200) calls `render` with no `container`, so RTL mounts into a new `div` appended to `document.body`.

### 3.3 The MiroirTest runtime

The leaf union is authored in the MiroirTest EntityDefinition `51c647fe-…` at `miroirTestLeaf` (L218-252). It has five members: transformer, function call, query, runner, and action. `npm run devBuild -w miroir-core` regenerates `preprocessor-generated/miroirFundamentalType.ts` and `miroirFundamentalJzodSchema.ts` from it. Hand edits to generated files are overwritten (`docs/reference/testing.md` L1394).

These places switch on `miroirTestType` and need a new arm:

- `runMiroirTest` (`MiroirTestTools.ts` L143-287). It is `async`, and its default arm is an exhaustive `never` check.
- `inferIntegrationSessionKind.ts` L48 and L65.

`runMiroirTestSuiteWalk` (`miroirTestSuiteWalk.ts` L57-244) awaits each leaf, so an async leaf fits.

A leaf records its outcome with `miroirActivityTracker.setTestAssertionResult(...)`. `FunctionCallTestTools.ts` L384-399 shows the pattern. It rethrows a failure whenever `localVitest.test` is a function. In the UI, `TestFramework.test` (`test-expect.ts` L32-35) calls the body without a `try`, so a rethrown failure there would end the whole suite run. The new leaf must rethrow under vitest only.

### 3.4 UI execution path

`MiroirTestDisplay.tsx` renders `RunMiroirTestSuiteButton` for unit runs (about L140), `UiIntegrationTestRunControls` and a second button for integration runs (about L154-155), and `TestExecutionPanel` for results (about L186). The unit button calls `runMiroirTests._runMiroirTestSuite(TestFramework, …, { executionMode: "unit" })` (`RunMiroirTestSuiteButton.tsx` L113-124), then reads `tracker.getTestAssertionsResults([])`. `RunAllMiroirTestsButton.tsx` (L199-210) does the same over every suite.

miroir-core `expect` (`test-expect.ts` L121-296) returns `{ result, message }` and never throws. Its matchers are `toBe`, `toEqual`, `toMatch`, `toMatchObject`, `toThrow`, `toHaveProperty`, `toContain`, `toBeTruthy`, `toBeFalsy`, and `.not`. It has no DOM matchers, `toBeNull`, or `toBeGreaterThan`.

### 3.5 vitest entries

`miroir-core/tests/miroir-core-tests.unit.test.ts` finds every MiroirTest folder in the `miroir-test-app_deployment-*` packages (`loadApplicationMiroirTestsFromFolders.ts` L59, L189) and runs every suite. Once `JzodElementEditor_ComponentTestSuite` exists in `miroir_data`, this entry will load it.

The miroir-standalone-app vitest config (`vite.config.js` L121-141) uses `environment: 'happy-dom'` and `setupFiles: ['./setup.ts']`. `tests/setup.ts` sets `IS_REACT_ACT_ENVIRONMENT = true` (L26) and calls RTL `cleanup()` after each test (L41-44).

The nonreg step `appstack-JzodElementEditor.test` (`scripts/nonreg-manifest.json` L812-826) runs `testByFile -w miroir-standalone-app -- --profile {profile} JzodElementEditor.test`.

### 3.6 Policy documents

- #197 `analysis-ui-integ-without-testing-library.md` §8 (L176-186) says the UI launcher must not load `@testing-library/*` or `renderWithProviders`. It proposes refusing suites tagged `proofHarness: "rtl"`. L170 says JzodElementEditor remains a vitest baseline.
- #204 `plan.md` L201 lists `JzodElementEditor.test.tsx` as UI_COMPONENT: "product UI; needs in-UI enactment path".
- `docs/reference/testing.md` L143 lists `JzodElementEditor.test.tsx` as a PLATFORM file with no MiroirTest equivalent. L759-784 describe how to run it.

---

## 4. Gaps

| # | Gap | Where |
|---|---|---|
| G1 | No leaf kind names a component test | EntityDefinition `51c647fe-…`, `runMiroirTest`, `inferIntegrationSessionKind` |
| G2 | miroir-core cannot import React or the app, so it cannot run a component test itself | package boundary |
| G3 | Test bodies and tools live under `tests/`, which the app build does not include | `JzodElementEditorTestTools.tsx`, `JzodElementEditor.test.tsx` |
| G4 | The tools depend on vitest (`vi.fn`, vitest `expect`, `process.env`) and replace a process-wide registration | §3.2 items 1-3 |
| G5 | In the browser, `screen` queries search all of `document.body`, including the app's own inputs and buttons | RTL `screen` |
| G6 | MUI popovers, menus, and dialogs render in portals under `document.body`, outside any sandbox element | MUI `Popover`, `Popper`, `Modal` |
| G7 | Progressive reveal is on in the app, off in vitest | `useViewportReveal.ts` L63 |
| G8 | The UI `expect` does not throw and lacks the DOM matchers, `toBeNull`, and `toBeGreaterThan` | `test-expect.ts` |
| G9 | In the UI, a leaf that throws ends the whole suite run | `TestFramework.test`, `FunctionCallTestTools.ts` L390-399 |
| G10 | React act warnings: the app runs with `IS_REACT_ACT_ENVIRONMENT` unset, and RTL `act` expects it set | `tests/setup.ts` L26 |
| G11 | No sandbox panel, and no "include component tests" option on Run all | `MiroirTestDisplay.tsx`, `RunAllMiroirTestsButton.tsx` |
| G12 | The generic miroir-core entry would try to run the new leaves without a runner | §3.5 |

---

## 5. Design

### 5.1 Leaf schema (G1)

Add `miroirTestForReactComponent` to `miroirTestLeaf` in EntityDefinition `51c647fe-…`:

```json
{
  "miroirTestType": "reactComponentTest",
  "miroirTestLabel": "renders all array values, in the right order",
  "skip": false,
  "componentTestRef": { "suite": "JzodArrayEditor", "case": "renders all array values, in the right order" }
}
```

`miroirTestType` is the literal `"reactComponentTest"`. `componentTestRef.suite` and `componentTestRef.case` are strings. `skip` has the same meaning as on other leaves. Then run `npm run devBuild -w miroir-core`.

`inferIntegrationSessionKind` treats the new leaf like `functionCallTest`: unit only, no integration session. `runMiroirTest` refuses it in integration mode with the same message pattern as `functionCallTest`.

### 5.2 Runner injection in miroir-core (G2, G9, G12)

`ConfigurationServiceInner` gets:

```ts
registerReactComponentTestRunner(runner: ReactComponentTestRunner): void;
reactComponentTestRunner: ReactComponentTestRunner | undefined;

type ReactComponentTestRunner = (params: {
  componentTestRef: { suite: string; case: string };
  testNamePath: string[];
}) => Promise<{ status: "ok" } | { status: "error"; message: string; expected?: unknown; actual?: unknown }>;
```

The `reactComponentTest` arm of `runMiroirTest`:

1. If `leaf.skip` or `parentSkip` is set, records a skipped result, as other leaves do.
2. If no runner is registered, records a skipped result with the message `reactComponentTest requires a registered component test runner`. This is what the miroir-core generic entry sees (G12).
3. Otherwise it awaits the runner and records `ok` or `error` through `setTestAssertionResult`.
4. It rethrows an `error` only when `executionOptions.rethrowComponentTestFailures` is true. The new vitest entry sets it. The UI buttons leave it unset, so one failing case does not end the run (G9).

The miroir-core generic entry registers no runner, so it reports the new leaves as skipped and stays green.

### 5.3 Component test module in the app (G3, G4)

New folder `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/`:

| File | Content |
|---|---|
| `componentTestEnvironment.ts` | The per-run object passed to each body: `{ expect, view, fireEvent, userEvent, act, waitFor, sandboxElement }`. `view` is RTL `within(sandboxElement)`. |
| `componentTestTools.tsx` | The browser-safe part of `JzodElementEditorTestTools`: prop types, `getWrapperLoadingLocalCache`, `getJzodElementEditorForTest`, `extractValuesFromRenderedElements`, `formValuesToJSON`, and wait helpers. No vitest import, no `process.env`, no `registerTestImplementation` call. `handleAction` becomes a plain recording function. |
| `jzodElementEditor/*.tsx` | One file per editor suite with its case bodies, rewritten from `(expect, container)` to `(env: ComponentTestEnvironment)`. |
| `componentTestRegistry.ts` | `Record<suite, { component, suiteProps, cases: Record<case, ReactComponentTestCase> }>`. |
| `runReactComponentTest.tsx` | The `ReactComponentTestRunner`. For each case it sets `IS_REACT_ACT_ENVIRONMENT`, renders into the sandbox element, runs the body, records the outcome, unmounts the previous case, and restores the flag. |
| `index.ts` | `registerComponentTests(sandboxHost)`. This is the only export the app reaches, through one `import()`. |

`tests/4_view/JzodElementEditorTestTools.tsx` becomes a re-export of `componentTestTools.tsx`, plus the vitest-only helpers that stay there. It keeps the vitest `registerTestImplementation` call for its 14 importers. They do not change in this issue.

The case bodies stop calling `screen`. They call `env.view`, which is scoped to the sandbox (G5). The rewrite is mechanical: `screen.X(` becomes `view.X(`, `expect` becomes `env.expect`, and `screen.debug(...)` is deleted (D11).

### 5.4 Portals and progressive reveal (G6, G7)

The sandbox providers use a MUI theme whose `defaultProps` set `container` on `MuiPopover`, `MuiPopper`, `MuiModal`, and `MuiMenu` to the sandbox element. Menus and dialogs then render inside the sandbox, and `view` finds them. The same theme in vitest keeps both runs identical.

For progressive reveal, the sandbox providers include `ProgressiveRenderDisabledContext` with value `true`. `useViewportReveal` reads it next to `isVitestTestMode()`. The vitest path is unchanged.

### 5.5 Assertions (G8)

miroir-core `test-expect.ts` gets `createThrowingExpect()`. It returns an `expect` whose matchers throw `MiroirAssertionError` with the same message the current matcher produces. It adds:

- `toBeNull`, `toBeGreaterThan`
- DOM matchers on `Element`, defined by jest-dom's rules: `toBeInTheDocument` (`element.ownerDocument.contains(element)`), `toHaveValue` (input, select, and textarea value, with number coercion for `type="number"`), `toBeChecked`, `toHaveAttribute(name, value?)`, `toContainHTML(html)`
- `.not` for each of them

The existing non-throwing `expect` is unchanged. The component runner passes the throwing `expect` in both vitest and the UI. The case bodies therefore run against one assertion library. jest-dom is still imported by other vitest files but not by component test bodies.

### 5.6 Sandbox panel (G10, G11)

`ComponentTestSandbox.tsx` sits in `MiroirTestDisplay` above `TestExecutionPanel`. It renders only when the suite contains a `reactComponentTest` leaf and a run has started.

- It owns a `div` that becomes `sandboxElement`.
- The first click on Run loads the component test chunk with `import()`, calls `registerComponentTests(sandboxHost)`, and then runs the suite.
- Each case builds its providers with `getWrapperLoadingLocalCache`, so it gets a fresh `LocalCache`, `MiroirContext`, and tracker. The app's store and `ConfigurationService.testImplementation` are not written.
- After the run, the last case stays mounted. A close button unmounts it and hides the panel.

`RunAllMiroirTestsButton` gets an "Include component tests" checkbox, checked by default. When unchecked, it passes a filter that excludes `reactComponentTest` leaves. When checked, it opens the sandbox for the run. Cases run one at a time because the walk awaits each leaf.

### 5.7 MiroirTest JSON and consistency (D7, D8)

`packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts` imports the registry and writes `JzodElementEditor_ComponentTestSuite` (a fixed uuid) into `deployment-miroir/assets/miroir_data/a311f363-…/`. It writes one sub-suite per editor and one leaf per case, sorted by registry order. After it runs, `npm run build -w miroir-test-app_deployment-miroir` refreshes the package.

`componentMiroirTests.consistency.unit.test.ts` loads both and fails on any suite or case present on one side only. It also fails on a case name reused within a suite.

### 5.8 vitest entry (D9)

`packages/miroir-standalone-app/tests/4_view/miroir-component-tests.unit.test.tsx`:

1. Imports the registry directly, not through `import()`.
2. Registers the runner with a sandbox element appended to `document.body`.
3. Loads `JzodElementEditor_ComponentTestSuite` from the deployment folder.
4. Calls `runMiroirTests._runMiroirTestSuite(vitest, …, { executionMode: "unit", rethrowComponentTestFailures: true })`.

Each leaf becomes one vitest `test`, named `<suite> > <case>`, so `-t` filtering keeps working.

During the migration, both the old `JzodElementEditor.test.tsx` and the new entry run. Each slice deletes its suite from `jzodElementEditorTests` once the new entry passes it. The last slice deletes the old file, and the nonreg step `appstack-JzodElementEditor.test` switches to the new entry. The new entry does not use `--profile`, because the in-memory `LocalCache` never reads a store.

### 5.9 Bundle split

`@testing-library/*` and `componentTests/` are reached only through the one `import()` in `ComponentTestSandbox`. A vitest check reads the production build manifest (`dist/.vite/manifest.json`, enabled with `build.manifest: true` if not already set). It fails if the entry chunk's static imports include `@testing-library`. `@testing-library/react`, `dom`, and `user-event` move from `devDependencies` to `dependencies` in `miroir-standalone-app/package.json`, because the app bundle now contains them.

---

## 6. Risks and open points

| # | Risk | Mitigation |
|---|---|---|
| K1 | A body's RTL `act` in the browser also flushes the live app's React updates | The sandbox uses its own `createRoot`. `IS_REACT_ACT_ENVIRONMENT` is set only while a case runs. The pilot measures whether the app shows warnings. |
| K2 | Emotion styles or the MUI theme leak between the sandbox and the app | The sandbox has its own `ThemeProvider` and `StyledEngineProvider`. The pilot checks the app's look after a run. |
| K3 | Browser timing differs from happy-dom, so waits pass in vitest and time out in the browser | The wait helpers keep `waitFor` with the same timeouts. Timeouts become failures with a message, not a hang. |
| K4 | `toHaveValue` and `toBeChecked` rules drift from jest-dom | Unit tests for each matcher use the same fixture DOM under vitest, compared with jest-dom's result. |
| K5 | The 14 other importers of `JzodElementEditorTestTools` break when the tools move | The re-export keeps their import path and exports. Their nonreg steps run in every slice. |
| K6 | The Library fixtures (`book1`, `entityBook`, Country cache helpers) are imported from `miroir-test-app_deployment-library`, which the app may not bundle | The pilot checks the import. If needed, the fixture JSON is loaded from the deployment the app already serves. |

---

## 7. Validation

- The pilot slice: Array (12) and Enum (3) pass through the new vitest entry, and match the old file's results for the same cases.
- In the running app, the pilot suite runs from `MiroirTestDisplay`, shows 15 results, and the app's store is unchanged. The Library report still loads after the run.
- Each later slice moves one suite and keeps the old and new counts equal.
- Final: 68 cases pass through the new entry. The old file is deleted. The default nonreg tier is green.
