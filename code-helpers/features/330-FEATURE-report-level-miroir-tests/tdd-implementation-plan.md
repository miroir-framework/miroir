# Issue #330 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real DomainController, local cache and emulated server of `RunnerTestSession`
> on the `emulatedServer-filesystem` profile (and the other integ profiles in nonreg),
> through the applicative interface: MiroirTest instances of the new `reportTestSuite` kind,
> which mount real Reports (`BookDetails`, `ConnectExternalServiceWizard`) at their real route.
> No mocks. The tracer bullet proves one Report mounted from the testbed store and checked from a MiroirTest.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.
> (A's standing flow for sizeable work is one green commit per slice, on request.)

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/330
Follow-up: https://github.com/miroir-framework/miroir/issues/333 (stored values in UI steps)
Working branch: `claude/report-level-miroir-tests-0lnny6` (from `_integration`, PR against `_integration`)

**Resume note:** Slices 0 to 7 done 2026-09-27; Slice 8 next.

---

## Scope

- New MiroirTest node `reportTestSuite` and leaf `reportTest`, in the MiroirTest Entity and its EntityVersion, with the component-test steps plus `compositeAction` and `expectActionResult`.
- Core dispatch to an app-registered report test runner; runner-kind integration session; mode tags `integ` + `ui`.
- App runner that mounts a Report through `PageDispatcher` under a `MemoryRouter`, with the session's DomainController and LocalCache, and waits for started actions after each interaction.
- Fetch seam in miroir-core and suite-level `fakeHttpResponses`.
- Two MiroirTests: `report.bookDetails` and `report.connectExternalServiceWizard`; deletion of the two 284 UI tests they replace.
- In-app launch under "Run Integration Tests"; nonreg steps; "Report tests" docs section.

This plan does **not** cover stored values in UI steps (#333), an in-memory mode (rejected, D2), Report-level locators (later), a skill for Report tests (later, D21), the other TS tests that mount Reports (later, unscheduled), or fake HTTP on `realServer-*` profiles (T9).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Baseline and 284 coverage inventory | ✅ | nonreg baseline + `wizard-coverage.md` |
| 1 | Tracer: a MiroirTest mounts `BookDetails` from the testbed store | ✅ | `report.bookDetails` leaf "displays the Book" |
| 2 | Check steps: run a query, assert on its result | ✅ | leaf "the store holds the displayed Book" + failure-report vitest |
| 3 | Edit and save through the UI, checked in the store | ✅ | leaf "saves an edited title" + idle-wait vitest |
| 4 | Invalid input is not saved | ✅ | leaf "does not save an invalid value" |
| 5 | Fake HTTP, and the wizard's first steps | ✅ | `report.connectExternalServiceWizard` leaf "reads an OpenAPI document by URL" + undeclared-request vitest |
| 6 | Wizard Finish persists the Endpoint and Report | ✅ | leaf "public service: Finish creates Endpoint and Report" |
| 7 | Wizard branches; 284 UI tests deleted | ✅ | branch leaves + coverage table all covered (`wizardWalk.284` deleted, `multistepBranch.284` kept) |
| 8 | Report tests in the app | ⬜ | launcher registry test + in-app run |
| 9 | Nonreg, docs, cleanup, AC | ⬜ | nonreg steps + tracer narrative |

---

## Locked implementation defaults

Binding for this plan (analysis decision record, D1–D21 and T1–T12). Deviations go into the slice's Realization.

| Decision | Choice |
|---|---|
| D1 / T1 | New node `reportTestSuite` (`report: { application, applicationSection, reportUuid, instanceUuid? }`, `actionTimeoutMs?`, `fakeHttpResponses?`, `miroirTests`) and leaf `reportTest` (`instanceUuid?`, `steps`), inside a `miroirTestSuite` that carries `runTarget` and the testbed fields. Entity row and EntityVersion `51c647fe-…` identical. |
| D2 / D8 / D9 / T3 | Real store only; runner-kind session (`RunnerTestSession`); testbed reset before each leaf. |
| D3 / D11 / T6 / T7 | Steps `compositeAction` (stores `returnedDomainElement` under `nameGivenToResult`) and `expectActionResult` (`compositeRunTestAssertion`, run with stored results as action parameters), anywhere in `steps`. |
| D4 / D18 / T10 | vitest first (Slices 1–7), app in Slice 8 via `ComponentTestSandbox`. |
| D5 / T4 | Mount `PageDispatcher` in a `MemoryRouter` at `/?page=report&…`; providers from the session DomainController and `getLocalCache()`. |
| D7 | Instance names `report.<reportName>`, tags include `integ`, `ui`; cases are leaves (e.g. "saves an edited title") rather than one instance per variant, since they share the Report and testbed. |
| D10 / D16 / T5 | Every interaction step flushes, waits until no `action` activity is running in `MiroirActivityTracker`, repeats until stable; `actionTimeoutMs` default 10 000; error names the running actions. |
| D12 / T8 | Existing locators; new test ids `typed-value-object-editor-submit`, `multistep-back`, `multistep-finish` (`multistep-next` exists). |
| D14 / T9 | Module-level fetch seam in miroir-core `4_services` used by the 4 call sites; fake answers declared responses, fails undeclared ones; https public fake host; suites with `fakeHttpResponses` skipped on `realServer-*`. |
| D15 / T2 | `ConfigurationService.registerReportTestRunner`; core arm requires integration mode and `runnerTestContext`; no runner → skipped with message. |
| D17 | Literal values in UI steps; #333 owns the extension. |
| D19 / T12 | `wizardWalk.284` and `multistepBranch.284` deleted in Slice 7 once `wizard-coverage.md` shows every case covered. |
| D20 / T11 | Nonreg `integ-report.bookDetails`, `integ-report.connectExternalServiceWizard`, shaped like `integ-runner.*`. |
| D21 | "Report tests" section in `docs/reference/testing.md` (Slice 9). |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| MiroirTest `report.bookDetails` (Library, `library_model/a311f363-…/`) | `4edb680b-4686-4d9a-bb96-40fa9f945b24` |
| MiroirTest `report.connectExternalServiceWizard` (Miroir, `miroir_data/a311f363-…/`) | `6446d8b1-8268-4e29-b234-37a267cb7c6b` |
| Report under test: `BookDetails` | `c3503412-3d8a-43ef-a168-aa36e975e606` |
| Report under test: `ConnectExternalServiceWizard` | `dbd94bfe-b803-4bfd-8bb2-70a5932d5d1a` |
| Book edited by `report.bookDetails` | a Book of the Library playfield seed, e.g. Ubik `03ffcae1-b83f-4970-b3d9-04780d3d0780` (confirmed in Slice 1) |
| Nonreg steps | `integ-report.bookDetails`, `integ-report.connectExternalServiceWizard` |
| Test ids | `typed-value-object-editor-submit`, `multistep-back`, `multistep-finish` |
| Fake external host | `https://fake-service.example` |
| Issue-scoped vitest folder | `packages/miroir-standalone-app/tests/4_view/issues/330-report-level-miroir-tests/` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Report MiroirTests (integ, filesystem) | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.bookDetails --mode integ` |
| Issue vitest | `RUN_TEST=<name> npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem <file-stem>` |
| Component tests (regression) | `npm run testByFile -w miroir-standalone-app -- miroir-component-tests.unit` |
| Core unit | `npm run test -w miroir-core -- ''` |
| MiroirTest guards (names, tags) | `npm run test -w miroir-core -- miroirTestNaming miroirTestTags` |
| Deployment validation | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` (and `-library`) |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` (`./build-all.sh` if `devBuild` says "jzodObject not found") |
| MiroirTest JSON rebuild | `npm run build -w miroir-test-app_deployment-miroir` / `-w miroir-test-app_deployment-library` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` (miroir-core, miroir-standalone-app) |
| Lint | `npm run lint` |
| Nonreg | `npm run nonreg:unit -- --runner shared`, `npm run nonreg:filesystem -- --runner shared` |

---

## Slice 0 — Baseline and 284 coverage inventory

**Status:** ✅ DONE

### Goal

Record what passes today on the suites later slices touch, and list every case of the two 284 UI tests so Slice 7 can prove it covers them.

### 0.1 Baseline

Run the steps touching the refactored code (`buildComponentTestWrapper`, the runner session, the MiroirTest walk, the mode-tag and session-kind functions) and keep the result as the reference: component tests, `integ-runner.*`, `appstack-284-openapi-connection-wizard`, `integ-action-284-*`. Pre-existing failures are recorded, not fixed.

### 0.2 Coverage inventory

`code-helpers/features/330-FEATURE-report-level-miroir-tests/wizard-coverage.md`: one row per `it` / test key of `wizardWalk.284.integ.test.tsx` and `multistepBranch.284.integ.test.tsx`, extracted by a Python script (not by eye), with columns "what it proves" and "covered by" (empty at this point).

### Validation

```bash
npm run nonreg -- --runner shared --tier default --profile emulatedServer-filesystem --only integ-runner.lendDocument,integ-runner.returnDocument,integ-runner.freezeApplicationVersion,integ-runner.dropEntity,appstack-miroir-component-tests,unit-286-react-component-miroir-tests,unit-292-declarative-react-component-tests,unit-284-openapi-connection-wizard,integ-action-284-openapi-connection-wizard,integ-action-284-openapi-connection-wizard-auth,appstack-284-openapi-connection-wizard
python3 code-helpers/features/330-FEATURE-report-level-miroir-tests/list_wizard_cases.py   # script kept next to the inventory until Slice 9
```

### Realization

- **Baseline (2026-09-27, `emulatedServer-filesystem`, shared runner):** all 11 steps pass: `integ-runner.lendDocument`, `.returnDocument`, `.dropEntity` (shared group), `integ-runner.freezeApplicationVersion`, `appstack-miroir-component-tests`, `unit-284-openapi-connection-wizard`, `integ-action-284-openapi-connection-wizard`, `integ-action-284-openapi-connection-wizard-auth`, `appstack-284-openapi-connection-wizard`, `unit-286-react-component-miroir-tests`, `unit-292-declarative-react-component-tests`. No pre-existing failure. A stale `dist` first failed every step (`miroir-core` had no `splitTags` export); `./build-all.sh devBuild` fixed it, so later slices rebuild before comparing.
- **Inventory:** [`wizard-coverage.md`](wizard-coverage.md), 17 cases (11 in `wizardWalk.284`, 6 in `multistepBranch.284`), listed by [`list_wizard_cases.py`](list_wizard_cases.py); `--check` fails while a row has no "covered by".
- **Finding for Slice 7 (deviation from D19 proposed there):** `multistepBranch.284` tests a branching Report defined inline in the test and the Library `reportMultistepCountryCreate`, not the wizard. Default: keep it, delete only `wizardWalk.284` once covered.
- Test runs rewrite `packages/miroir-standalone-app/tests/assets/admin_data/`; restore it (`git checkout`, remove the new files) before committing.

---

## Slice 1 — Tracer: a MiroirTest mounts `BookDetails` from the testbed store

**Status:** ✅ DONE

### Goal

A test author can write a `reportTestSuite` that mounts a Report from the testbed store and checks what it displays with the existing component-test steps.

**Layers cut:** MiroirTest Entity schema → generated types → core walk and `"reportTest"` arm, mode tags, session kind → app report test runner (providers, `MemoryRouter`, `PageDispatcher`) → Library MiroirTest instance.

### 1.1 RED

**Test:** MiroirTest `report.bookDetails` (`4edb680b-…`), enclosing `miroirTestSuite` with the Library `runTarget` and playfield of `runner.lendDocument`, one `reportTestSuite` on `BookDetails` with `instanceUuid` of the chosen Book, one leaf **"displays the Book"**: `expectElement` on the Book's name (`byDisplayValue` or `byText`). Tags `integ`, `ui`, `report`, `issue: "330"`.

Behavior asserted:
- `testMiroir --suites report.bookDetails --mode integ` runs the leaf and it passes with the name read from the testbed store (not from fixtures).
- `miroirTestSuiteModeTags` gives `["integ", "ui"]` for it (the tag guard in `miroirTestTags.unit.test.ts` fails if the instance carries other mode tags).

RED today: the Entity schema rejects `reportTestSuite`; there is no arm and no runner.

### 1.2 GREEN

- Schema (T1): `reportTestSuite`, `miroirTestForReport`, `reportTestStep` (for now: `reactComponentTestStep` only) in the Entity row and EntityVersion; `miroirTestSuite.miroirTests` accepts `reportTestSuite`. Rebuild the deployment, `devBuild` miroir-core.
- Core (T2, T3): `MiroirTestAnyLeaf` gains the leaf; the walk builds a `ReportTestSuiteContext` (suite path, `report`, `actionTimeoutMs`, `fakeHttpResponses`, case labels) like `ReactComponentTestSuiteContext`; `runMiroirTest` arm `"reportTest"`; `ConfigurationService.registerReportTestRunner`; `miroirTestLeafRequiresIntegrationExecution`, `inferIntegrationSessionKind` (→ `"runner"`), `classifyApplicationMiroirTestCliLaunchKind` (→ `"runner-integration"`), `miroirTestSuiteModeTags` (→ `["integ", "ui"]`).
- App (T4): split `buildComponentTestWrapper` so the provider stack takes a DomainController and a LocalCache; `createReportTestRunner` mounts `PageDispatcher` in `MemoryRouter` at the report URL with the session's DomainController and `getLocalCache()`, then runs the steps with `runComponentTestSteps`; register it in the runner integ entries (`miroir-runner-tests[-shared].integ.test.ts`).
- The launcher must pass the `runnerTestContext` to the leaf; the suite has no `runnerTest` leaf, so `resolvedRunner` stays undefined.

### 1.3 Refactor checkpoint

- One provider-stack function used by component suites and report suites; the fixture LocalCache becomes the component suites' input, not a hidden default.
- Check `ReportPage.tsx` is still imported somewhere; if only by tests, note it for Slice 9 (not removed here).
- Risk from the analysis §5: if `PageContainer` needs providers the stack lacks, add them; if the sidebar drags in too much, mount `ReportDisplay` under the same URL and record the deviation.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run build -w miroir-test-app_deployment-library
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.bookDetails --mode integ
npm run test -w miroir-core -- ''
npm run testByFile -w miroir-standalone-app -- miroir-component-tests.unit
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run lint
```

### Realization

- **Proof:** `testMiroir --profile emulatedServer-filesystem --suites report.bookDetails --mode integ` passes (about 4 s for the leaf). The page shows the Book of the testbed store: name, author Don Norman, publisher Springer, year 1988. With `"Ubik"` expected instead, the leaf fails with the step's message.
- **Core:** [`reportTestLeaf.330.slice1.unit.test.ts`](../../../packages/miroir-core/tests/1_core/issues/330-report-level-miroir-tests/reportTestLeaf.330.slice1.unit.test.ts) covers the classification, the runner's inputs (leaf, `ReportTestSuiteContext`, execution environment), the missing runner (skipped with a message), an `error` result (recorded, and the test fails) and unit mode (refused). The arm is in `MiroirTestTools.ts`, the dispatch in `5_tests/ReportTestTools.ts`.
- **Launcher:** [`reportTestLauncher.330.slice1.unit.test.ts`](../../../packages/miroir-standalone-app/tests/4_view/issues/330-report-level-miroir-tests/reportTestLauncher.330.slice1.unit.test.ts): Report suites go to their own entry, `--tags ui --mode integ` selects only them, a `--suites` or `--tags` selection mixing them with runner / action suites is refused (`--tags report` does: it also tags `action.scenario.multistepReportTemplate`), and the implicit selection of every suite (no `--suites`, or `*`) leaves them out with a warning.
- **Deviations:**
  - Session kind `"action"`, not `"runner"`: a `reportTestSuite` has no Runner, and `"action"` is the kind for Runner-less sessions with a playfield (`inferIntegrationSessionKind`). The testbed is still reset before each leaf.
  - A dedicated DOM entry `tests/miroir-report-tests.integ.test.tsx` instead of registering the runner in `miroir-runner-tests[-shared].integ.test.ts`: those run in `@vitest-environment node` (#253, MCP), where a Report cannot render. `testMiroirLauncher` routes a selection of Report suites there (`MIROIR_REPORT_TEST_VITEST_ENTRY`) and refuses a mixed one.
  - The Book is `e20e276b-…` ("The Design of Everyday Things"): Ubik is not in the Library seed.
  - The playfield is a new TestConfiguration `libraryBookDetailsSeed` (`3123740d-…`): the Library seed plus `BookDetails` in `testbedModel.reports`. It is generated by [`make_report_test_configuration.py`](make_report_test_configuration.py) (`--check` fails when the seed changed).
  - `reportTestStep` is a plain reference to `reactComponentTestStep`: a one-member union generates a `z.union([one])` that does not typecheck. Slice 2 makes it a real union.
  - A `report` naming kind (`report.<subject>`), in `docs/reference/testing.md`, `AGENTS.md` and the naming guard.
- **What the page needed outside RootComponent:**
  - `markPageConfigurationsLoaded()` (`usePageConfiguration.ts`): without it `PageDispatcher` reopens every Admin deployment (postgres refused on this profile, error snackbar). The session already opened the stores.
  - The reports and entities offered to the pages are set by RootComponent in an effect. `MiroirContextReactProvider` takes them as an optional prop; the test providers compute them with hooks and `deploymentReportsEntitiesMapping` (new, shared with RootComponent). No `useEffect` added.
  - `svg-toolbelt` is CJS inside an ESM package (`exports is not defined` in vitest). `vite.config.js` `test.alias` maps the bare import to its ESM build with an exact-match regex, so its css subpath still resolves.
  - The miroir-mcp `uncaughtException` handler exits the process and hides such errors; debugging one needs a temporary listener.
- **Refactor checkpoint:** `MiroirTestProviders` is the one provider stack of component suites (`buildComponentTestWrapper`) and report suites. `routes/ReportPage.tsx` is imported nowhere (the router uses `PageDispatcher`): noted for Slice 9, not removed.
- **Validation (2026-09-27):** every command of the list passes, plus `testMiroirLauncher.tags.unit`, `test-miroir-runner.profile.unit`, the miroir-react typecheck, `sync_agent_skills --check` and the scripts pytest.

---

## Slice 2 — Check steps: run a query, assert on its result

**Status:** ✅ DONE

### Goal

A test author can run an action or query at any point of a Report test and assert on its result, with the Runner tests' assertion semantics.

**Layers cut:** schema (`reportTestStep` gains `compositeAction`, `expectActionResult`) → generated types → app runner step handlers (T6, T7) → MiroirTest instance.

### 2.1 RED

**Test 1:** new leaf of `report.bookDetails`, **"the store holds the displayed Book"**: `expectElement` on the name, then `compositeAction` (`compositeRunBoxedQueryAction` on the Book by uuid, `nameGivenToResult: "book"`), then `expectActionResult` comparing `book.name` to the displayed value.

**Test 2 (vitest, justified):** `reportTestFailure.330.slice2.integ.test.tsx` runs the `report.bookDetails` suite with a copy of that leaf whose expected name is wrong, and asserts the leaf is recorded as `error` with the assertion label, the expected value and the actual value. Not reachable through MiroirTest: a MiroirTest cannot assert that another MiroirTest fails.

### 2.2 GREEN

- Schema: the two step kinds, reusing `compositeActionTemplate` and `compositeRunTestAssertion` by reference. Rebuild + `devBuild`.
- Runner: a per-leaf result record; `compositeAction` runs through `handleCompositeActionTemplate` with session `testParams` and the record as parameters, stores the last `returnedDomainElement`; `expectActionResult` runs a one-element `compositeActionSequence` with the record as parameters and turns a failed assertion into the leaf's error (label, expected, actual).
- An `Action2Error` from a `compositeAction` fails the step with its message.

### 2.3 Refactor checkpoint

If Runner tests and report tests now build the same "sequence of assertions over a context" in two places, extract one helper in miroir-core `5_tests` used by both.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core && npm run build -w miroir-test-app_deployment-library
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.bookDetails --mode integ
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem reportTestFailure.330.slice2
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites runner.lendDocument --mode integ
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- **Proof:** `report.bookDetails` leaf "the store holds the displayed Book" passes: it finds the name on the page, reads the Book with a `storage` query (`compositeRunBoxedQueryAction`, kept as `storedBook`), and `expectActionResult` compares `{ name }` (a `createObject` result transformer over `storedBook.book.name`) to the displayed name. [`reportTestFailure.330.slice2.integ.test.tsx`](../../../packages/miroir-standalone-app/tests/4_view/issues/330-report-level-miroir-tests/reportTestFailure.330.slice2.integ.test.tsx) runs the same leaf expecting "Ubik": the leaf is recorded as `error`, expected `{ name: "Ubik" }`, actual the step message (`step 3 (expectActionResult "…"): assertion "storedBookName" failed`) and `{ name: "The Design of Everyday Things" }`.
- **Schema:** `reportTestStep` is a union (discriminator `step`) of `reactComponentTestStep`, `reportTestCompositeActionStep` (`action`: `compositeActionTemplate`, optional `nameGivenToResult`) and `reportTestExpectActionResultStep` (`assertion`: `compositeRunTestAssertion`).
- **Core:** `runReportTestCompositeActionStep` and `runReportTestExpectActionResultStep` in `5_tests/ReportTestTools.ts`, over a `ReportTestActionContext` (DomainController, deployment map, model environment, session `testParams`, the leaf's kept `results`, tracker).
- **App:** `runComponentTestSteps` takes `extraStepHandlers` for step kinds it does not know; their `StepValuesMismatch` (was the private `RenderedValuesMismatch`) carries the compared values, as `expectRenderedValues` does. The report runner registers the two action handlers, with a fresh `results` per leaf.
- **Deviations:**
  - Not `handleCompositeActionTemplate` (T6): it does not return a query's result (its query branch leaves `lastPayloadResult` unchanged). The step resolves the action's build templates with `resolveCompositeActionTemplate`, then runs it in a one-action sequence through `handleCompositeAction`, which returns the query result. No DomainController change. Runtime templates of a non-query action are not resolved; build `getFromParameters` references reach the kept results, which are passed as parameters.
  - The step's `nameGivenToResult` is optional: a query keeps its result under its own `nameGivenToResult`.
  - The assertion is read back from the tracker at its current path. That path starts at the `reportTestSuite` (the walk records leaves under the full `testNamePath`), so the assertion lands next to the MiroirTest root, not in the leaf; the check walks the results tree instead of `getTestAssertionsResults`, which throws on a suite with no result yet.
  - Each case is now unmounted when its steps end. A mounted BookDetails reacted to the next leaf's testbed reset with `storage` queries on the emptied store (`InstanceNotFound` in the log); the second leaf also went from 3.6 s to 1.1 s.
  - The entry setup moved to `tests/helpers/reportTestEntry.ts` (`startReportTestEntry`), shared by `miroir-report-tests.integ.test.tsx` and the failure test.
  - Test 2 is `reportTestFailure.330.slice2.integ.test.tsx` (not `phase2`), run with a non-throwing `expect` (`TestFramework.expect`) so the failing leaf is recorded without failing its vitest test.
- **Refactor checkpoint:** Runner tests run their post-submit actions and assertions as one sequence (`handleTestCompositeAction`) and look assertions up by name in the whole tree; report steps run one action at a time and read the current test. Nothing shared enough to extract.
- **Validation (2026-09-27):** see the list above, plus the launcher test, model validation, lint, `sync_agent_skills --check` and the scripts pytest.

---

## Slice 3 — Edit and save through the UI, checked in the store

**Status:** ✅ DONE

### Goal

A test author can edit an instance in a Report, press its submit button, and check that the store holds the new value, without adding any wait of their own.

**Layers cut:** view (`TypedValueObjectEditor` test id; instance-section submit if §3.6 is confirmed) → app runner (idle wait, T5) → core (`MiroirActivityTracker` query) → MiroirTest instance.

### 3.1 RED

**Test 1:** leaf **"saves an edited title"** of `report.bookDetails`: `type` a new name in the name field, `click` `byTestId: typed-value-object-editor-submit`, `compositeAction` query of the Book, `expectActionResult` on the new name. No explicit wait step.

**Test 2 (vitest, justified):** `reportIdleWait.330.slice3.unit.test.ts` drives the idle waiter over a real `MiroirActivityTracker`: it resolves after a tracked action settles, keeps waiting when a second action starts while the first runs, and rejects after `actionTimeoutMs` with a message naming the still-running `actionType` / `actionLabel`. Not reachable through MiroirTest: the timeout path needs an action that never settles.

Expected first run of Test 1: fails at the store check, confirming §3.6 (the nested Formik in `ReportSectionEntityInstance` swallows the submit). If it passes, §3.6 was wrong: record that in the Realization and the analysis history.

### 3.2 GREEN

- `data-testid="typed-value-object-editor-submit"` on the submit button (both the `ActionButtonWithSnackbar` and the plain button branches).
- Idle waiter (T5) in the app runner, run after every interaction step; `actionTimeoutMs` from the suite context.
- If §3.6 is confirmed: make the non-multistep instance section submit reach `onEditValueObjectFormSubmit` (the nested Formik's `onSubmit`, or no nested Formik for this branch), keeping the multistep branch (#274) unchanged. Its own regression proof is Test 1; the #274 tests (`multistepProcess.274`, `multistepLaunch.274`) must stay green.

### 3.3 Refactor checkpoint

The idle waiter belongs next to the component step runner, as one function; `runComponentTestSteps` gets an optional "after interaction" hook rather than a report-specific branch.

### Validation

```bash
npm run build -w miroir-test-app_deployment-library
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.bookDetails --mode integ
npm run testByFile -w miroir-standalone-app -- reportIdleWait.330.slice3
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepProcess.274
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepLaunch.274
npm run testByFile -w miroir-standalone-app -- miroir-component-tests.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- **Proof:** `report.bookDetails` leaf "saves an edited title" passes: it clears the name field, types a new name, clicks `typed-value-object-editor-submit`, reads the Book with a `storage` query and finds the new name. No wait step. [`reportIdleWait.330.slice3.unit.test.ts`](../../../packages/miroir-standalone-app/tests/4_view/issues/330-report-level-miroir-tests/reportIdleWait.330.slice3.unit.test.ts) (6 tests) drives the idle waiter over a real `MiroirActivityTracker`: it resolves at once without actions, waits for a running action then settles once, keeps waiting for a second action started meanwhile, waits for an action the settle starts, ignores actions started before the case, and fails after the timeout naming `updateInstance "save"`.
- **§3.6 confirmed.** The first run failed at the store check (step 6, the stored name was still the old one), and the log had no `updateInstance`. The nested Formik that `ReportSectionEntityInstance` has had since #82 (to show virtual attributes without writing them into the Report form) received the submit, and its `onSubmit` was a no-op: `BookDetails` has not saved since #82.
- **Fix:** `ReportViewWithEditor` offers its submit (`onEditValueObjectFormSubmit` under `handleAsyncAction`) through a new `ReportFormSubmitContext`, and its own Formik `onSubmit` uses the same function. The nested Formik's `onSubmit` passes its values (`lastSubmitButtonClicked`, its `_mode`, the edited instance) to it, with the virtual attributes stripped (`stripVirtualAttributesFromInstance`). The multistep branch (#274) has no nested Formik and is unchanged. Outside a Report form (the #82 test mounts the section alone) the submit only logs a warning. Inferred, not run: the inline Report editor (`InlineReportEditor`), which uses the same section, saves again too.
- **Idle waiter (T5):** `createActionsIdleWaiter` in `componentTests/waitForActionsIdle.ts`. It counts the `action` activities started since the case mount; after an interaction it returns at once when none started since its last call, else waits until none runs (10 ms polls), settles React (`waitAfterUserInteraction`), and repeats while the settle started new actions. Timeout: `actionTimeoutMs` of the suite, default 10 000 ms, over one call. `runComponentTestSteps` takes it as `options.afterInteraction`, awaited after every interaction step; the component tests pass nothing and are unchanged.
- **View:** `data-testid="typed-value-object-editor-submit"` on both submit buttons of `TypedValueObjectEditor`; `ThemedButton` forwards `data-testid`.
- **Deviations:** the leaf `clear`s the field before typing (typing alone appends). The save already passed with the 300 ms settle of `waitAfterUserInteraction` before the waiter existed; the waiter makes it independent of the save's duration. Test 2 is named `slice3`, not `phase3`.
- **Refactor checkpoint:** done as planned: one function next to the step runner, an optional hook in `runComponentTestSteps`, no Report-specific branch.
- **Validation (2026-09-27):** the list above, plus `reportTestFailure.330.slice2`, `reportTestLauncher.330.slice1`, `virtualAttributes.integ` (#82), Library model validation, core tsc and lint.

---

## Slice 4 — Invalid input is not saved

**Status:** ✅ DONE

### Goal

A test author can prove that a Report refuses invalid input: the button is disabled and the store is unchanged.

**Layers cut:** MiroirTest instance only, unless the Report does not disable submit on the chosen invalid input (then view).

### 4.1 RED

**Test:** leaf **"does not save an invalid value"** of `report.bookDetails`: make the Book invalid through the UI (clear the required `name`, or type text in the number field `year`, whichever the editor reports as a field error), `expectElement` on `typed-value-object-editor-submit` with attribute `disabled`, `click` it anyway, `compositeAction` query, `expectActionResult` on the original value.

### 4.2 GREEN

Expected to pass once the right invalid input is found. If neither input disables submit, that is a Report bug: fix it in this slice and record it.

### 4.3 Refactor checkpoint

Leaves of `report.bookDetails` share setup steps; if the same locator appears in three leaves, move the default `instanceUuid` and shared props to the suite.

### Validation

```bash
npm run build -w miroir-test-app_deployment-library
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.bookDetails --mode integ
```

### Realization

- **Proof:** `report.bookDetails` leaf "does not save an invalid value" passes: it clears the year field, finds `typed-value-object-editor-submit` with the `disabled` attribute, clicks it anyway, reads the Book with a `storage` query and finds the year still 1988.
- **Which input:** clearing the name does not make the Book invalid (an empty string is a `string`). Clearing the year does: Formik stores `""` for an empty number input, which fails the `number` type check, and the editor already showed that type error above the form. Nothing else is invalid through this Report: the Book Entity has no `formValidation` transformer and the author and publisher are selects.
- **Report bug, fixed here:** the submit stayed enabled with a type error. The first run without the `disabled` check submitted the empty year (`updateInstance` ran) and failed at the store check. `TypedValueObjectEditor` takes a new `submitRequiresValidType` prop: when set, a value whose type check fails disables the submit button and blocks the form submit, as a `validationTransformer` error does. The type check memo moved above the submit gating; nothing else changed in it. Only the non-multistep instance section of `ReportSectionEntityInstance` sets it; runners, the multistep branch and the other editors keep submitting as before, since their type check may fail on values they accept today (not checked).
- **Not changed:** clearing an optional number sets `""` rather than removing the attribute. If that changes, this leaf needs another invalid input.
- **Refactor checkpoint:** `instanceUuid` was already at the suite (Slice 1). The `storage` query of the Book is copied into three leaves; the schema has no shared steps, so it stays copied.
- **Validation (2026-09-27):** `report.bookDetails` (4 passed), `miroir-component-tests.unit`, `multistepProcess.274`, `multistepLaunch.274`, `virtualAttributes.integ`, `runner.lendDocument`, app tsc, lint, Library model validation.

---

## Slice 5 — Fake HTTP, and the wizard's first steps

**Status:** ✅ DONE

### Goal

A test author can declare external HTTP responses in a Report test, so a Report that reads an external service runs without a network; an undeclared request fails the test with its method and URL.

**Layers cut:** miroir-core `4_services` fetch seam used by `DomainController.handlePrepareOpenApiDocument` and `ExternalServiceClient` → schema (`fakeHttpResponses`) → app runner (install and restore the fake, `realServer-*` skip) → view (test ids `multistep-back`, `multistep-finish`) → Miroir MiroirTest instance.

### 5.1 RED

**Test 1:** MiroirTest `report.connectExternalServiceWizard` (`6446d8b1-…`, `miroir_data/a311f363-…/`): `miroirTestSuite` with the Library `runTarget`; `reportTestSuite` on `dbd94bfe-…` (application Miroir, section `data`) with `fakeHttpResponses` serving an OpenAPI document at `https://fake-service.example/openapi.json` (the document of the 284 fake server, copied into the instance); leaf **"reads an OpenAPI document by URL"**: pick the Library application, name the endpoint, give the document URL, `click` `multistep-next`, `expectElement` on the step label "Base URL".

**Test 2 (vitest, justified):** `fakeHttp.330.slice5.integ.test.tsx` runs the suite with a URL that has no declared response and asserts the leaf fails with a message naming the method and URL. Not reachable through MiroirTest: asserts a failure.

### 5.2 GREEN

- Fetch seam (T9): module-level fetch with setter in miroir-core `4_services`, used at the four call sites (`DomainController.ts` L4118, `ExternalServiceClient.ts` L354, L485, L740).
- Schema: `fakeHttpResponses` on `reportTestSuite` (`method`, `url`, `status`, `headers?`, `body`). Rebuild + `devBuild`.
- Runner: install the fake for the suite, restore after the last case; on `emulateServer === false` record the suite's leaves as skipped with "fake HTTP needs an emulated server".
- Test ids `multistep-back`, `multistep-finish` in `MultistepReportHost.tsx`.

### 5.3 Refactor checkpoint

The 284 TS tests' `fakeExternalServiceServer` stays until Slice 7; if its OpenAPI document is now duplicated in the MiroirTest instance, note which copy Slice 7 keeps.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.connectExternalServiceWizard --mode integ
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem fakeHttp.330.slice5
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase1
npm run test -w miroir-core -- ''
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- **Proof:** `report.connectExternalServiceWizard` leaf "reads an OpenAPI document by URL" passes: it picks Library in the application picker, names the endpoint, gives `https://fake-service.example/openapi.json`, clicks Next, and the wizard shows the "Base URL" step, which it reaches only when `prepareOpenApiDocument` read the document. `fakeHttp.330.slice5` runs the same leaf with the response declared for another URL: the leaf is recorded as `error` with `no fake HTTP response declared for GET https://fake-service.example/openapi.json`.
- **Fetch seam:** `1_core/OutboundFetch.ts` (`outboundFetch`, `setOutboundFetch`), used at the four call sites. It is in `1_core`, not `4_services` as planned: `DomainController` (layer 3) may not import a layer 4 implementation, which the `miroir/layers` lint rule enforces. `5_tests/FakeHttpResponses.ts` builds the fake: it matches the method and the exact URL, sends a string body as is and any other body as JSON, and records then rejects an undeclared request. After the steps, an undeclared request fails the leaf even if every step passed; when a step failed too, the message names the request first, then the step.
- **Deviations:**
  - The fake is installed for each leaf, before the mount, and restored in `finally`, not once for the suite: the runner is called per leaf and has no suite hook, and this keeps leaves apart.
  - `status` is optional in `fakeHttpResponses` (default 200).
  - On a server that is not emulated, the runner returns a new `skipped` result (`REPORT_TEST_FAKE_HTTP_NEEDS_EMULATED_SERVER`), which `ReportTestTools` records as skipped with that message.
  - Component-test targets prefix field names with `TESTSECTION.`, while a Report form uses raw names (`name.endpointName`). The component test environment takes a `fieldNamePrefix` (default `TESTSECTION.`), and the Report runner passes `""`.
  - The session's Miroir store holds only the bootstrap Reports (`miroirModelInitializeDataInstances`, 13), without the wizard: the Report fell back to the default Report. The Report test entry (`tests/helpers/reportTestEntry.ts`) now creates the missing Miroir Reports from `miroir_data` before each leaf, after the session's Miroir model reset.
  - The application picker lists the keys of the context's `applicationDeploymentMap`, which RootComponent fills in the app; the test context held Miroir and Admin only. `MiroirContextReactProvider` takes a new test-only `testingApplicationDeploymentMap`, and the runner gives it the session's map.
  - The leaf enters text with `change`, as `wizardWalk.284` does, not `type`. With `type` (one key at a time, no delay) the wizard inputs lost characters (`discogsPublic` became `dsosublic`). Inferred cause, not verified: the Report's Formik re-initializes from the step bag, which a validation merges in a queued microtask, so a key that lands between the two is overwritten. Not fixed here; whether a person typing fast can hit it is not checked.
- **Refactor checkpoint:** the OpenAPI document is copied from `twoGetOpenApiDocument()` of `wizardWalk.284` into the MiroirTest instance. Slice 7 keeps the MiroirTest copy; the TS copy goes with `wizardWalk.284`.
- **Also changed:** `reportTestLauncher.330.slice1` expects both Report suites in the `--tags report` refusal message.
- **Validation (2026-09-27):** `report.connectExternalServiceWizard` (1 passed), `fakeHttp.330.slice5` (2), `report.bookDetails` (4), `reportTestFailure.330.slice2`, `reportTestLauncher.330.slice1`, `reportIdleWait.330.slice3`, `connectExternalService.284.phase1`, `externalServiceDispatch.integ` (13), `wizardWalk.284` (11), `multistepProcess.274` (19), `multistepLaunch.274` (7), `virtualAttributes.integ`, `runner.lendDocument`, `miroir-component-tests.unit` (74 passed, 15 skipped), miroir-core unit (2083), Miroir model validation (162), tsc for miroir-core, miroir-react and the app, lint, skills sync, `scripts/tests`.

---

## Slice 6 — Wizard Finish persists the Endpoint and Report

**Status:** ✅ DONE

### Goal

A test author can walk a multi-step Report to Finish and check, in the store, what Finish created.

**Layers cut:** MiroirTest instance; runner only if Finish's asynchronous start escapes the idle wait (T5 loop).

### 6.1 RED

**Test:** leaf **"public service: Finish creates Endpoint and Report"**: full walk with a public (no auth) service, probe answered by `fakeHttpResponses`, `expectElement` on `probe-outcome` ("Probe succeeded."), `click` `multistep-finish`, then `compositeAction` queries of the Library model's Endpoints and Reports, `expectActionResult` that the Endpoint with the chosen name and its validation Report exist, and that no Entity was created for the probe (the three checks of `wizardWalk.284` "finish-public-creates-endpoint-and-report").

### 6.2 GREEN

Expected to need only the instance. If Finish's result is not in the store when the checks run, fix the idle wait (not the test).

### 6.3 Refactor checkpoint

None expected; record in `wizard-coverage.md` which rows this leaf covers.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.connectExternalServiceWizard --mode integ
```

### Realization

- **Proof:** `report.connectExternalServiceWizard` leaf "public service: Finish creates Endpoint and Report" passes. It walks the wizard on a public service at `https://fake-service.example`: Base URL, Authentication left off, Operations (`getRelease` listed), probe id `1`, Review (the probe call shows `https://fake-service.example/releases/1`), Probe result "Probe succeeded.", Finish. It then reads the Library model from the store and finds one Endpoint named `discogsPublic`, one Report named `discogsPublic_getRelease`, no Entity named `discogsPublic`, and one more item in the Library Menu than before Finish.
- **First run failed, testbed fixed (not the runner):** Finish refused with "connectExternalService: the selected application has no menu": the suite's inline testbed (`testbedModel` with only the application, no instances) created no Menu. The suite now uses the Library TestConfiguration of the Report MiroirTests (`libraryBookDetailsSeed`, `3123740d-…`), whose generator `make_report_test_configuration.py` adds the Library Menu to `testbedModel.menus`. `report.bookDetails` uses the same configuration and is unaffected.
- **Deviations:**
  - The checks count rows found by name (`extractorInstancesByEntity` with an anchored `filter`, then `listLength`), since the Endpoint and Report uuids are random.
  - The Menu check counts the items of the Menu's first section before and after Finish (`numericOp` "-"): it proves a link was added, not that it targets the new Report, which a transformer cannot compare without more work. `wizardWalk.284` checked the Report uuid in the Menu's text.
  - The probe is answered by a second fake response, `GET https://fake-service.example/releases/1`. Finish probes again (PR #285), so the same response serves the Review step and Finish.
- **Runner:** unchanged. The idle wait covered Finish: its result was in the store when the checks ran.
- **Coverage:** `wizard-coverage.md` rows `finish-public-creates-endpoint-and-report` and `public-path-skips-secrets` (Next on Authentication shows Operations).
- **Validation (2026-09-27):** generator `--check` in sync; Miroir model validation 162, Library model validation 184; `uiIntegrationTestLauncher.unit` 18; `reportTestLauncher.330.slice1` 5; `report.bookDetails` 4; `report.connectExternalServiceWizard` 2; `fakeHttp.330.slice5` 2; `reportTestFailure.330.slice2` 2; miroir-core unit 2083 (+1 skipped). No TypeScript changed in this slice.

---

## Slice 7 — Wizard branches; 284 UI tests deleted

**Status:** ✅ DONE

### Goal

The wizard's branches (authentication schemes, secret handling, failed probe, invalid document URL) are tested by the MiroirTest, and the two TS UI tests it replaces are gone.

**Layers cut:** MiroirTest instance → nonreg manifest → deleted TS tests.

### 7.1 RED

**Test:** one leaf per uncovered row of `wizard-coverage.md` (e.g. "custom token secret never reaches the step bag", "failed probe keeps the review step", "insecure document URL is refused", "authenticated branch shows the scheme step"). A row only reachable by inspecting React state (e.g. the step bag's text) uses `expectElement` on the existing test ids (`multistep-step-bag`).

### 7.2 GREEN

Leaves added until every row has a "covered by" entry; then delete `wizardWalk.284.integ.test.tsx`, `multistepBranch.284.integ.test.tsx` and the nonreg step `appstack-284-openapi-connection-wizard`. `fakeExternalServiceServer` stays if other tests still use it (281, `spotifyApp`, `externalServiceReport`, 284 phases).

### 7.3 Refactor checkpoint

Remove helpers only the deleted files used (e.g. the report upsert helper of the 284 view tests), checked by grep.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.connectExternalServiceWizard --mode integ
python3 code-helpers/features/330-FEATURE-report-level-miroir-tests/list_wizard_cases.py --check   # every row covered
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run lint
```

### Realization

- **Proof:** `report.connectExternalServiceWizard` has 8 leaves in two suites, all passing on `emulatedServer-filesystem`. New in this slice: "the application picker lists Library, not Miroir or Admin", "an empty or unparsable document keeps the step, with the parser message", "a private document URL is refused; once cleared, a pasted document goes through" (it also checks the step bag keeps `getRelease` and not the `oneOf` operation), "an uploaded file fills the document text", "a custom token reaches neither the step bag nor the page", and a second suite on the home Report, "the launcher button opens the wizard" (a real route change in the `MemoryRouter`, no `navigate` mock). `list_wizard_cases.py --check` passes: every row of `wizard-coverage.md` is covered or kept.
- **Deleted:** `wizardWalk.284.integ.test.tsx`, and `getMlEditorTestLocalCache` that only it used. **Kept (deviation from 7.2, per the Slice 0 finding):** `multistepBranch.284`, which tests the multistep host on a branch fixture Report, not the wizard; nonreg step `appstack-284-openapi-connection-wizard` runs it alone. The wizard suite joins nonreg in Slice 9.
- **New component test step:** `uploadFile` (`target`, `fileName`, `content`, `mimeType?`, `userEvent.upload`), in the MiroirTest Entity and EntityVersion schemas (types regenerated) and `docs/reference/testing.md`. The upload case had no step to express it.
- **Bugs found and fixed (the leaves walk the real wizard, where `wizardWalk.284` mounted the Custom token step alone):**
  - Next on the Scheme step did nothing: the `scheme` and `secretsClient` branch tests of the wizard used `transformerType: "equals"`, which does not exist. They now use `boolExpr` with `==`. No authenticated service could pass the Scheme step.
  - `MultistepReportHost` showed that branch failure as an empty message, so nothing appeared: a `TransformerFailure` without `failureMessage` has an empty `message`, and `??` kept it. It now uses `||` and falls back to "Branch test failed.".
  - The token was in the page: the hidden `report-query-pageparams` dump of `ReportViewWithEditor` holds the step bag unredacted. It now goes through `omitSecretKeysFromBagDump` for multistep Reports, like the Formik debug dump.
- **Known, not fixed (#338):** a `customToken` user passes through the Client credentials secrets step, since a branch has two targets for three schemes. The leaf asserts this detour and names the issue, so it fails when the wizard is fixed.
- **Runner messages:** a failed `containsHtml` check shows the element's text, and a failed `present: false` check describes the matching elements (tag, test id, text): both were needed to find the bugs above.
- **Stale contract test fixed:** `multistep.274.phase0` "ReportSectionEntityInstance still uses a no-op Formik onSubmit" pinned the behaviour Slice 3 fixed; it now checks the nested Formik submits through `submitNestedFormValues`. Slices 3 to 6 did not run it (it is in `nonreg:unit`).
- **Validation (2026-09-27):** skills sync; scripts pytest 45; `list_wizard_cases.py --check`; tsc core, react, app; lint; miroir-core unit 2083 (+1 skipped); Miroir model validation 162; component tests 74 (+15 skipped); `multistep.274.phase0` 16; `componentTestSchema.292` 11; `componentTestSteps.292` 14; `uiIntegrationTestLauncher.unit` 18; `reportTestLauncher.330.slice1` 5; `reportIdleWait.330.slice3` 6; on `emulatedServer-filesystem`: `reportTestFailure.330.slice2` 2, `fakeHttp.330.slice5` 3 (its copy of the suite now includes the home launcher suite), `report.bookDetails` 4, `report.connectExternalServiceWizard` 8, `runner.lendDocument` 1, `multistepBranch.284` 6, `multistepProcess.274` 19, `multistepLaunch.274` 7, `connectExternalService.284.phase1` 1, `externalServiceDispatch.integ` 13, `virtualAttributes.integ` 3.

---

## Slice 8 — Report tests in the app

**Status:** ⬜ pending

### Goal

A developer can run a Report test from the Miroir Tests page ("Run Integration Tests") and watch the Report being driven in the sandbox panel.

**Layers cut:** in-app launcher registry and session creation → `ComponentTestSandbox` registration of the report runner → Miroir Tests UI.

### 8.1 RED

**Test (vitest, justified):** extend `tests/helpers/uiIntegrationTestLauncher.unit.test.ts`: the runner suite registry lists `report.bookDetails` and `report.connectExternalServiceWizard` with a runner-kind session and their playfield. Not reachable through MiroirTest: it tests the launcher itself.

Manual proof: `npm run dev -w miroir-standalone-app`, Miroir Tests, `report.bookDetails`, "Run Integration Tests" on `emulatedServer-indexedDb`: the Report appears in the sandbox, the fields change, the leaves pass.

### 8.2 GREEN

Register report suites in `uiIntegrationTestRunnerSuiteRegistry`; the browser session registers the report runner over the `ComponentTestSandbox` element with the session's DomainController and LocalCache (T10).

### 8.3 Refactor checkpoint

The launcher must not recognise report suites by name (#317 rule): classify by leaf kind.

### Validation

```bash
RUN_TEST=uiIntegrationTestLauncher npm run testByFile -w miroir-standalone-app -- uiIntegrationTestLauncher.unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
# manual: in-app run as described in 8.1, screenshot in the Realization
```

### Realization

<Appended on completion.>

---

## Slice 9 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### Goal

Report tests run in non-regression, are documented, and the issue-scoped leftovers are gone.

### 9.1 Nonreg

`scripts/nonreg-manifest.json`: `integ-report.bookDetails` and `integ-report.connectExternalServiceWizard`, shaped like `integ-runner.lendDocument` (`--profile {profile}`, same `shared` group, `requires` as the runner steps). Fresh baseline for the new steps.

### 9.2 Docs

`docs/reference/testing.md`: "Report tests" section (suite and leaf shape, steps, idle wait and `actionTimeoutMs`, `fakeHttpResponses` and the `realServer-*` limit, naming, how to run); the kinds list in "Names and descriptions" gains `report`; the leaf types table gains `reportTest`. `docs/contributing/testing.md`: one line pointing to it.

### 9.3 Cleanup

- Migrate the issue vitest files that still add value (`reportTestFailure`, `reportIdleWait`, `fakeHttp`) to feature-named files next to the component tests, and delete `tests/4_view/issues/330-report-level-miroir-tests/` (#238 rule).
- Drop `issue: "330"` only if the tag guard asks for it (it is a kept attribute, #315); remove `list_wizard_cases.py` once Slice 7 is done, keep `wizard-coverage.md` as the record.
- `ReportPage.tsx`: remove if no route or test uses it any more (Slice 1 note).

### 9.4 Tracer narrative

Manual: open `BookDetails` on the chosen Book in the app, change the title, press submit, reload the Report: the new title is shown. Automated equivalent: `report.bookDetails` "saves an edited title".

### 9.5 AC checklist

| Acceptance criterion (issue #330) | Proving test |
|---|---|
| A MiroirTest reaches a Report through UI interactions | `report.bookDetails` "displays the Book" |
| It can run the Report's actions through its buttons | "saves an edited title" |
| It can check the result of those actions, including persistence | "the store holds the displayed Book", "saves an edited title", "does not save an invalid value" |
| Target: instance edit Report with validation and persistence | `report.bookDetails` (Slices 1–4) |
| Target: multi-step `ConnectExternalServiceWizard` | `report.connectExternalServiceWizard` (Slices 5–7) |

### Validation

```bash
npm run nonreg:filesystem -- --runner shared
npm run nonreg:unit -- --runner shared
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
npm run lint
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
```

### Realization

<Appended on completion.>
