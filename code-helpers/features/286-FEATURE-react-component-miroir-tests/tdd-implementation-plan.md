# Issue #286 TDD implementation plan

> Vertical TDD slices, RED then GREEN, integration-first per `docs/contributing/testing.md`. Tests render the real `JzodElementEditor` through the real MiroirTest walk (`runMiroirTests._runMiroirTestSuite`) and the real UI buttons. No mocks beyond the `handleAction` recording stub the suites already use. The tracer (Slice 2) is one Array case that runs from MiroirTest JSON through the new vitest entry.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step. Commits happen only when the user asks. Each slice ends with its Validation commands. On success, its Realization is filled in and its Status becomes ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/286
Working branch: `286-FEATURE-react-component-miroir-tests` (created from `284-FEATURE-openapi-connection-wizard` at `5a6c380ea`. Rebase onto `master` once PR #285 merges.)

**Resume note:** no slice started.

---

## Scope

- `reactComponentTest` leaf in the MiroirTest schema, and its arm in `runMiroirTest`.
- `ConfigurationService.registerReactComponentTestRunner`, `rethrowComponentTestFailures`, and `excludeMiroirTestTypes`.
- `createThrowingExpect` with DOM matchers in miroir-core `test-expect.ts`.
- `src/miroir-fwk/4-tests/componentTests/`: tools, act-free driver, manifest, registry, runner, and the 7 JzodElementEditor suites.
- `PortalContainerContext` and `ComponentTestModeContext` in the editors.
- `ComponentTestSandboxProvider` in `MiroirTestDisplay` and `MiroirTestListDisplay`, the `beforeRun` prop, and the Run all checkbox.
- The generator script, the consistency test, the new vitest entry, the bundle split check, the nonreg switch, and the documentation updates.

This plan does not add a declarative step language, migrate `JzodElementEditorReactCodeMirror.test.tsx`, revive the commented-out Book, EntityDefinition, Performance, and Endpoint suites, or change the 14 other importers of `JzodElementEditorTestTools` (analysis D1, D5, D13).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize current contracts, find how the app loads MiroirTests | ⬜ | `componentMiroirTests.286.phase0` |
| 1 | Move the tools under `src/` with the old tests green | ⬜ | old `JzodElementEditor.test` 68 passed, 14 importers green |
| 2 | **Tracer.** One Array case runs from MiroirTest JSON in vitest | ⬜ | `miroir-component-tests` 1 passed |
| 3 | Array suite complete in vitest, DOM matchers, scoped value reader | ⬜ | `miroir-component-tests` 12 passed |
| 4 | Array suite runs in the app sandbox | ⬜ | `componentTestSandbox.286.phase4` + manual dev and production check |
| 5 | Enum suite with the portal dropdown (pilot complete) | ⬜ | 15 passed in vitest and in the app |
| 6 | Run all with the "Include component tests" checkbox | ⬜ | `runAllComponentTests.286.phase6` |
| 7 | Literal suite | ⬜ | 18 passed |
| 8 | Object suite | ⬜ | 32 passed |
| 9 | SimpleType suite | ⬜ | 44 passed |
| 10 | Union suite | ⬜ | 53 passed |
| 11 | Any suite | ⬜ | 68 passed |
| 12 | Delete the old file, nonreg switch, docs, acceptance criteria | ⬜ | default nonreg green |

Slice 2 is the first behavioral slice. Slices 0 and 1 build the safety net.

---

## Locked implementation defaults

Copied from [`analysis.md`](./analysis.md). Deviations go in the slice Realization.

| Decision | Choice |
|---|---|
| D1 | Leaf `reactComponentTest` with `componentTestRef: { suite, case }` |
| D2 | `@testing-library/dom` and `@testing-library/user-event` in a lazy chunk. No `@testing-library/react` in the chunk. No React `act` (§5.3) |
| D3 | Sandbox with its own providers, one wrapper and `LocalCache` per suite |
| D4 | `createThrowingExpect`. `toEqual` ignores `undefined`-valued keys. DOM matchers accept `null` |
| D5 | Array and Enum first, then one suite per slice. `'component'` mode dropped |
| D6 | `src/miroir-fwk/4-tests/componentTests/`, one `import()`, runner registered through `ConfigurationService` |
| D7 | One leaf per case. Generator reads the React-free manifest. Labels prefixed `<suite>: ` and unique |
| D8 | Instance `JzodElementEditor_ComponentTestSuite` in `deployment-miroir/assets/miroir_data/a311f363-…/` |
| D9 | miroir-core entry: no runner, tracker records skipped. New entry: one `describe` per sub-suite, `rethrowComponentTestFailures: true` |
| D10 | Unit Run button. Sandbox stays open with the last case. Run all checkbox on by default |
| D11 | `screen.debug` calls deleted |

---

## Allocated UUIDs and keys

| Artefact | Value |
|---|---|
| MiroirTest instance `JzodElementEditor_ComponentTestSuite` | `761d4ed2-1a5c-4901-a9d9-897dbec0b27f` |
| MiroirTest Entity (schema generator input) | `a311f363-e238-4203-bdfc-29e8c160c26b` in `miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/` |
| MiroirTest EntityVersion (dual write) | `51c647fe-07ec-411c-89cc-02689dc66d6a` in `miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/` |
| MiroirTest data folder | `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/` |
| New vitest entry | `packages/miroir-standalone-app/tests/4_view/miroir-component-tests.unit.test.tsx` |
| Issue test directory | `packages/miroir-standalone-app/tests/4_view/issues/286-react-component-miroir-tests/` |
| miroir-core issue test directory | `packages/miroir-core/tests/1_core/issues/286-react-component-miroir-tests/` |
| Nonreg unit | `unit-286-react-component-miroir-tests` |
| Nonreg default step (replaces `appstack-JzodElementEditor.test` in Slice 12) | `appstack-miroir-component-tests` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Old suite (until Slice 12) | `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test` |
| New entry | `npm run testByFile -w miroir-standalone-app -- miroir-component-tests` |
| One suite in the new entry | `npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodArrayEditor"` |
| Issue tests | `RUN_TEST=<name> npm run testByFile -w miroir-standalone-app -- <name>` |
| miroir-core issue tests | `npm run testByFile -w miroir-core -- <name>` |
| miroir-core MiroirTests | `npm run testMiroir -w miroir-core` |
| Generator | `npx tsx packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Deployment validation | `npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts` |
| Bare console guard | `python scripts/check_bare_console.py` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and the same for `packages/miroir-standalone-app/tsconfig.json` |
| The 14 importers | The three `testByFile` lines in Slice 1 Validation cover all 14 files. |

The new entry runs under happy-dom (`vite.config.js` L121-141). It does not take `--profile`, because the in-memory `LocalCache` reads no store. Deployment packages set vitest `test.root` to `./tests`, so the modelValidation filter is `modelValidation.unit.test.ts`.

---

## Slice 0: characterize current contracts

**Status:** ⬜

### Goal

Lock the behavior later slices change, and answer the open question in analysis §5.7 (K9): how does the running app get MiroirTest rows?

### 0.1 RED then GREEN: inventory

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/componentMiroirTests.286.phase0.unit.test.ts`

Two describes.

**Stable** (`phase0 stable`), still true after Slice 12:

- `miroirTestLeaf` in Entity `a311f363-…` and in EntityVersion `51c647fe-…` have the same member list. (After Slice 2 it has 6 members. The assertion compares the two files, not a count.)
- miroir-core non-throwing `expect(null).not.toBeNull().result` is false and `expect({a: 1, b: undefined}).toEqual({a: 1}).result` is false. The non-throwing `expect` keeps these semantics.
- `extractValuesFromRenderedElements` on a small rendered form returns the same values as today, for a fixed fixture.

**Inventory** (`pre-286 inventory`), deleted in the slice that makes it false:

- `miroirTestLeaf` has 5 members (Slice 2).
- `extractValuesFromRenderedElements` returns a value from a named input outside the container (Slice 3).
- `JzodElementEditor.test.tsx` registers 7 suites (Slice 12).

### 0.2 Investigation: MiroirTest rows in the app

Read how `MiroirTestListDisplay` gets its list in the dev app (`npm run dev`) with the filesystem and sql profiles. Record in the Realization: the source of the rows (deployment assets at startup, `defaultMiroirMetaModel.tests`, or a store), and the exact step that makes a new instance visible. Slice 2 GREEN uses that step.

### Validation

```bash
RUN_TEST=componentMiroirTests.286.phase0 npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
```

The old suite gives 68 passed.

### Realization

(to fill)

---

## Slice 1: move the tools under `src/` with the old tests green

**Status:** ⬜

### Goal

The browser-safe tools live in `src/miroir-fwk/4-tests/componentTests/componentTestTools.tsx`, with no vitest import, no `process.env`, no `registerTestImplementation` call, and no bare `console.*`. Every current test still passes. This is a refactor under green, so there is no RED step.

### 1.1 Refactor

- Create `componentTestTools.tsx` with the prop types, `getWrapperLoadingLocalCache`, `getJzodElementEditorForTest`, `extractValuesFromRenderedElements`, `formValuesToJSON`, `formikFieldName`, `testSectionName`, and the wait helpers. Replace `console.log` with a `MiroirLoggerFactory` logger. Replace `vi.fn()` with a recording function. Replace `process.env` reads with `isVitestTestMode()`.
- Move `emptyObject` from `routes/TransformerBuilderPage.js` to a module with no imports, and import it from both places.
- `tests/4_view/JzodElementEditorTestTools.tsx` re-exports the moved functions. It keeps a local `getWrapperLoadingLocalCache` that calls `registerTestImplementation({ expect })` and then delegates. It keeps `runJzodEditorTest`, `prepareAndRunTestSuites`, and the other vitest-only helpers.
- Drop the `'component'` mode (`TestMode`, `allTestModes`, `ModesType`, the `modes` fields in the old test file).

### 1.2 Checkpoint

- `python scripts/check_bare_console.py` passes with no new allowlist entry.
- `componentTestTools.tsx` has no import from `vitest`, `@testing-library/react`, or `tests/`.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
npm run testByFile -w miroir-standalone-app -- extractValuesFromRenderedElements formValuesToJSON gridPagination listDisplayByTransformer virtualAttributes
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem ReportPage.integ multistepProcess.274 multistepLaunch.274 multistepBranch.284 wizardWalk.284
RUN_TEST=componentMiroirTests.286.phase0 npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0
python scripts/check_bare_console.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

The old suite gives 68 passed. Each of the 14 importers gives the same count as before the slice. The Realization records the counts.

### Realization

(to fill)

---

## Slice 2: tracer, one Array case from MiroirTest JSON in vitest

**Status:** ⬜

### Goal

The case "JzodArrayEditor: renders all array values, in the right order" runs from the JSON instance `761d4ed2-…` through `runMiroirTests._runMiroirTestSuite` and the registered runner, and passes. The miroir-core generic entry loads the same JSON and does not fail.

**Layers cut:** MiroirTest schema, generated types, `runMiroirTest` arm, `ConfigurationService` runner, act-free driver, registry and manifest, generator, deployment package wiring, new vitest entry.

### 2.1 RED

**Test:** `tests/4_view/miroir-component-tests.unit.test.tsx` (analysis §5.8)

The entry loads `JzodElementEditor_ComponentTestSuite` from the deployment folder, registers the runner, and runs each sub-suite inside `describe(<suite>)` with `rethrowComponentTestFailures: true`.

Behavior asserted:

- vitest reports `JzodArrayEditor > JzodArrayEditor: renders all array values, in the right order` as passed.
- After the run, the tracker holds one `ok` result for that leaf.
- A second vitest test in the same file registers a runner whose case body throws, and checks that the leaf fails with the thrown message.

RED fails because the instance file does not exist and `reactComponentTest` is not a leaf kind.

**Test:** `packages/miroir-core/tests/1_core/issues/286-react-component-miroir-tests/reactComponentLeaf.286.phase2.unit.test.ts`

- With no runner registered, `runMiroirTests._runMiroirTestSuite` on a one-leaf suite records `skipped` with the message `reactComponentTest requires a registered component test runner` and does not throw.
- With a runner returning `error` and `rethrowComponentTestFailures` unset, the walk records `error` and continues to the next leaf.
- In integration mode the leaf is refused with the `functionCallTest` message pattern.

### 2.2 GREEN

- Add `miroirTestForReactComponent` to `miroirTestLeaf` in Entity `a311f363-…` and EntityVersion `51c647fe-…`. Run the schema rebuild. Export the new types from miroir-core `index.ts` (L462-473).
- `miroirTestLeafSupportsUnitExecution` and `miroirTestLeafRequiresIntegrationExecution` arms. The `runMiroirTest` arm (analysis §5.2). `rethrowComponentTestFailures` on the `"unit"` arm of `MiroirTestExecutionOptions`.
- `ConfigurationService.registerReactComponentTestRunner`.
- `componentTestEnvironment.ts` with the act-free driver and the `configure` call (analysis §5.3). Only `toEqual` is needed from the throwing `expect` in this slice. Add `createThrowingExpect` with the existing matchers.
- `componentTestManifest.ts`, `componentTestRegistry.ts`, and `jzodElementEditor/JzodArrayEditor.tsx` with one case.
- `runReactComponentTest.tsx` (analysis §5.6 steps 1-4, without `destroy()` yet).
- `scripts/generate-component-miroir-tests.ts`. Run it. It writes the instance, the export in `miroir-test-app_deployment-miroir/index.ts`, and the `defaultMiroirMetaModel.tests` entry. Add the step found in Slice 0.2 if it is needed.
- Remove that case from `getJzodArrayEditorTests` in the old file.

### 2.3 Refactor checkpoint

- `componentTestManifest.ts` imports nothing from React. The generator runs under `tsx` without loading `react`.
- The miroir-core generic entry reports the new leaf. The tracker shows it as skipped.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-core -- reactComponentLeaf.286.phase2
npm run testMiroir -w miroir-core
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
RUN_TEST=componentMiroirTests.286.phase0 npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

New entry: 1 passed plus the failing-runner check. Old suite: 67 passed. `pre-286 inventory` loses its 5-member assertion.

### Realization

(to fill)

---

## Slice 3: Array suite complete in vitest

**Status:** ⬜

### Goal

All 12 Array cases pass through the new entry with the throwing `expect`, the scoped value reader, and user-event. The old file no longer has the Array suite.

### 3.1 RED

**Test:** `packages/miroir-core/tests/1_core/issues/286-react-component-miroir-tests/throwingExpect.286.phase3.unit.test.ts`

For each matcher, the same fixture DOM goes through jest-dom and through `createThrowingExpect`, and both give the same pass or fail:

- `toBeInTheDocument` on an attached element, a detached element, and `null` (positive and `.not`). `null` never raises a `TypeError`.
- `toHaveValue` on a text input, a `type="number"` input, a select, and a textarea.
- `toBeChecked`, `toContainHTML`.
- `toEqual({a: 1, b: undefined}, {a: 1})` passes. `toEqual` of different values throws a `MiroirAssertionError` whose message holds both values.
- `getState().currentTestName` returns the name passed in.

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/extractValuesScoped.286.phase3.unit.test.tsx`

- A named input outside the root is ignored.
- A `ThemedSelectWithPortal` option list mounted in the portal element is read.

**New entry:** the other 11 Array cases are added to the registry and the manifest, and the generator is re-run. They fail until the GREEN below.

### 3.2 GREEN

- DOM matchers, `getState`, and the `toEqual` rule in `createThrowingExpect`.
- `extractValuesFromRenderedElements(expect, filter, root, …)` searches `root` and the portal element. The tests-side re-export keeps the old signature for the 14 importers by passing `document` as root.
- The rest of `JzodArrayEditor.tsx`, rewritten with the analysis §5.3 rules.
- `componentMiroirTests.consistency.unit.test.ts`: manifest, registry, and JSON agree, and leaf labels are unique in the instance.
- Delete `JzodArrayEditor` from `jzodElementEditorTests` in the old file.

### 3.3 Refactor checkpoint

- No `screen` identifier, `screen.debug`, or bare `console.*` in `componentTests/`.
- `pre-286 inventory` loses the outside-input assertion.

### Validation

```bash
npm run testByFile -w miroir-core -- throwingExpect.286.phase3
RUN_TEST=extractValuesScoped.286.phase3 npm run testByFile -w miroir-standalone-app -- extractValuesScoped.286.phase3
npm run testByFile -w miroir-standalone-app -- miroir-component-tests componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
npm run testByFile -w miroir-standalone-app -- extractValuesFromRenderedElements
python scripts/check_bare_console.py
```

New entry: 12 passed. Old suite: 56 passed.

### Realization

(to fill)

---

## Slice 4: Array suite runs in the app sandbox

**Status:** ⬜

### Goal

In the running app, the unit Run button on `JzodElementEditor_ComponentTestSuite` loads the component test chunk, renders each Array case in a visible sandbox, and shows 12 results. The app's store and `ConfigurationService.testImplementation` are unchanged. It works in a development build and in a production build.

### 4.1 RED

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/componentTestSandbox.286.phase4.integ.test.tsx`

Mount `MiroirTestDisplay` for instance `761d4ed2-…` as `MiroirTestDisplayIntegrationLaunch.integ.test.tsx` does. Record `ConfigurationService.configurationService.testImplementation` and a snapshot of the app `LocalCache` state before the run.

- Clicking the unit Run button shows the sandbox panel, and `TestResultsGrid` then lists 12 `ok` results.
- A registry case replaced with a failing body gives 11 `ok` and 1 `error` with the assertion message. The run does not stop at the failure.
- After the run, `testImplementation` is the same object and the app `LocalCache` state equals the snapshot.
- The last case's DOM is still in the sandbox. The close button removes it and hides the panel.

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/componentTestChunk.286.phase4.unit.test.ts`

- After `npm run build -w miroir-standalone-app`, the build manifest shows that no chunk statically imported from the entry contains `@testing-library` (analysis §5.9).

### 4.2 GREEN

- `ComponentTestSandboxProvider`, `ComponentTestSandbox`, and `prepareComponentTests` (analysis §5.6), mounted in `MiroirTestDisplay`.
- `beforeRun` on `RunMiroirTestSuiteButton`, awaited when the suite has a `reactComponentTest` leaf.
- `ComponentTestModeContext`, read by `useViewportReveal` and by `JzodElementEditor` for `isUnderTest`. The sandbox providers set both flags.
- `miroirEventService.destroy()` on the suite's last case and on close.
- `componentTests/index.ts` with `registerComponentTests`, reached by one `import()`.
- `@testing-library/dom` and `@testing-library/user-event` move to `dependencies`. `build.manifest: true` if it is not set.

### 4.3 Manual check (K1, K2, K8)

- `npm run dev` for the app: run the suite from the MiroirTest list, 12 `ok`. The Library report still loads afterwards. The app's look is unchanged. The browser console shows no React act warning.
- Production build served from `miroir-server/release/client`: the same run gives 12 `ok`.
- If any case passes in vitest and fails in the app, record it in the Realization. If the cause is the act-free driver (K1), stop and ask the user whether to switch to the development-build fallback.

### Validation

```bash
RUN_TEST=componentTestSandbox.286.phase4 npm run testByFile -w miroir-standalone-app -- componentTestSandbox.286.phase4
npm run build -w miroir-standalone-app
RUN_TEST=componentTestChunk.286.phase4 npm run testByFile -w miroir-standalone-app -- componentTestChunk.286.phase4
npm run testByFile -w miroir-standalone-app -- miroir-component-tests MiroirTestDisplay MiroirTestDisplayIntegrationLaunch
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
python scripts/check_bare_console.py
```

### Realization

(to fill)

---

## Slice 5: Enum suite with the portal dropdown (pilot complete)

**Status:** ⬜

### Goal

The 3 Enum cases pass in vitest and in the app, including "renders all enum options", which opens the `ThemedSelectWithPortal` dropdown.

### 5.1 RED

Add the Enum cases to the registry and manifest, re-run the generator. The new entry fails on "renders all enum options" because the option list renders in `document.body`, outside `view`.

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/portalContainer.286.phase5.unit.test.tsx`

- With `PortalContainerContext` set to an element, `ThemedSelectWithPortal` renders its options in that element, and a click outside that element closes the list.
- Without the context, it renders in `document.body`, as today.
- A `ThemedMUISelect` inside the sandbox theme renders its menu in the portal element.

### 5.2 GREEN

- `PortalContainerContext`, read by `ThemedSelectWithPortal` for its portal target and its outside-click root.
- The sandbox theme sets `defaultProps.container` on `MuiPopover`, `MuiPopper`, `MuiModal`, and `MuiMenu`.
- `jzodElementEditor/JzodEnumEditor.tsx`. Delete `JzodEnumEditor` from the old file.

### 5.3 Pilot checkpoint

- Compare the Array and Enum results case by case between the old run (Slice 0 baseline) and the new entry. Record the result in the Realization.
- Run both suites in the dev app and the production build. Record results.
- Ask the user to confirm the pilot before Slice 6.

### Validation

```bash
RUN_TEST=portalContainer.286.phase5 npm run testByFile -w miroir-standalone-app -- portalContainer.286.phase5
npm run testByFile -w miroir-standalone-app -- miroir-component-tests componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
RUN_TEST=componentTestSandbox.286.phase4 npm run testByFile -w miroir-standalone-app -- componentTestSandbox.286.phase4
```

New entry: 15 passed. Old suite: 53 passed.

### Realization

(to fill)

---

## Slice 6: Run all with the "Include component tests" checkbox

**Status:** ⬜

### Goal

"Run all MiroirTests" in `MiroirTestListDisplay` runs component tests in its own sandbox when the checkbox is on, and skips them when it is off.

### 6.1 RED

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/runAllComponentTests.286.phase6.integ.test.tsx`

Mount `MiroirTestListDisplay` as `MiroirTestListIntegrationLaunch.integ.test.tsx` does, with the list narrowed to `JzodElementEditor_ComponentTestSuite` and one transformer suite.

- The checkbox is present and checked by default. Run all gives 15 `ok` component results and the transformer suite's results.
- With the checkbox unchecked, the component leaves are recorded as skipped, the component test chunk is not loaded, and the transformer suite still runs.

**Test:** `packages/miroir-core/tests/1_core/issues/286-react-component-miroir-tests/excludeMiroirTestTypes.286.phase6.unit.test.ts`

- `excludeMiroirTestTypes: ["reactComponentTest"]` records those leaves as skipped and does not call their arm. Other leaves run.

### 6.2 GREEN

- `excludeMiroirTestTypes` on the `"unit"` arm, checked in `_runMiroirTestWithTracking`.
- `ComponentTestSandboxProvider` mounted in `MiroirTestListDisplay`. The checkbox and `beforeRun` on `RunAllMiroirTestsButton`.

### Validation

```bash
npm run testByFile -w miroir-core -- excludeMiroirTestTypes.286.phase6
RUN_TEST=runAllComponentTests.286.phase6 npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6
npm run testByFile -w miroir-standalone-app -- RunAllMiroirTestsButton MiroirTestListDisplay MiroirTestListIntegrationLaunch
```

### Realization

(to fill)

---

## Slices 7 to 11: remaining suites

Each slice moves one suite and follows the same steps.

| Slice | Suite | Cases | New entry total | Old suite left |
|---|---|---|---|---|
| 7 | JzodLiteralEditor | 3 | 18 | 50 |
| 8 | JzodObjectEditor | 14 | 32 | 36 |
| 9 | JzodSimpleTypeEditor | 12 | 44 | 24 |
| 10 | JzodUnionEditor | 9 | 53 | 15 |
| 11 | JzodAnyEditor | 15 | 68 | 0 |

**Status:** ⬜ for each.

### RED

Add the suite's cases to the manifest and registry as stubs that throw "not migrated", then re-run the generator. The new entry fails for exactly that suite's cases.

### GREEN

Port the bodies with the analysis §5.3 rules. If a case needs something the environment does not provide (a new matcher, a new portal, a new test-mode fork), add a focused unit test for that first, in the issue directory, then implement it. Delete the suite from the old file.

### Validation (each slice)

```bash
npx tsx packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts
npm run testByFile -w miroir-standalone-app -- miroir-component-tests componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "<suite>"
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
python scripts/check_bare_console.py
```

The manual check from Slice 4.3 repeats for the suite in the dev app. Slice 11 leaves the old file with no active suite, so its run reports no tests.

### Realization

(to fill per slice)

---

## Slice 12: delete the old file, nonreg, docs, acceptance criteria

**Status:** ⬜

### Goal

The old test file is gone, the nonreg manifest runs the new entry, and the documents point to #286.

### 12.1 Changes

- Delete `tests/4_view/JzodElementEditor.test.tsx`. Keep `JzodElementEditorTestTools.tsx` for its 14 importers.
- `pre-286 inventory` loses its last assertion. Delete that describe.
- `scripts/nonreg-manifest.json`: replace `appstack-JzodElementEditor.test` with `appstack-miroir-component-tests` (`npm run testByFile -w miroir-standalone-app -- miroir-component-tests componentMiroirTests.consistency`, tier `default`). Add `unit-286-react-component-miroir-tests` for `componentMiroirTests.286.phase0` (`phase0 stable`), the miroir-core `286` unit tests, and `componentTestChunk.286.phase4`.
- #197 `analysis-ui-integ-without-testing-library.md` §8 and L170: the rule now allows `@testing-library/dom` and user-event in the lazy component test chunk. Link #286.
- #204 `plan.md` L201: JzodElementEditor done by #286. `JzodElementEditorReactCodeMirror.test.tsx` is the next candidate.
- `docs/reference/testing.md` L143 and L759-784: the new entry, `-t "<suite>"`, the generator, and running component tests in the app.
- `docs/internals/code-splitting.md`: the component test chunk.
- Issue #286: tick the acceptance criteria that hold, with evidence.

### Validation

```bash
npm run nonreg -- --tier default
python scripts/check_bare_console.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

The default nonreg tier is green. The new entry gives 68 passed.

### Realization

(to fill)
