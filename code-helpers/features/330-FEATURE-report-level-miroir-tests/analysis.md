# 330 — Report-level MiroirTests

> Adds a MiroirTest kind that mounts a whole Report against a real store, drives it through UI interactions (including buttons that run actions), and checks what those actions did, in the middle of the flow or at the end. First targets are the Library `BookDetails` Report (edit and save one Book) and the multi-step `ConnectExternalServiceWizard` Report.

Related issue: https://github.com/miroir-framework/miroir/issues/330
Follow-up: https://github.com/miroir-framework/miroir/issues/333 (UI steps use values stored by earlier action steps, D17)
Related analyses: [`../292-REFACTOR-declarative-react-component-tests/analysis.md`](../292-REFACTOR-declarative-react-component-tests/analysis.md) (declarative component tests, step vocabulary) · [`../303-FEATURE-test-pattern-and-render-performance/analysis.md`](../303-FEATURE-test-pattern-and-render-performance/analysis.md) (component test runner, in-app sandbox) · [`../312-FEATURE-miroir-test-classification/analysis.md`](../312-FEATURE-miroir-test-classification/analysis.md) (tags) · [`../316-REFACTOR-miroirtest-naming/analysis.md`](../316-REFACTOR-miroirtest-naming/analysis.md) (kind-first names, mode tags)
Key sources: [MiroirTest Entity](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a311f363-e238-4203-bdfc-29e8c160c26b.json) · [`MiroirTestTools.ts`](../../../packages/miroir-core/src/5_tests/MiroirTestTools.ts) · [`ReactComponentTestTools.ts`](../../../packages/miroir-core/src/5_tests/ReactComponentTestTools.ts) · [`Runner.ts`](../../../packages/miroir-core/src/1_core/Runner.ts) · [`RunnerTestSession.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/RunnerTestSession.ts) · [`componentTests/`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/) · [`PageDispatcher.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/PageDispatcher.tsx) · [`MultistepReportHost.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MultistepReportHost.tsx) · [`ExternalServiceClient.ts`](../../../packages/miroir-core/src/4_services/ExternalServiceClient.ts)

**Status:** decisions confirmed with A (2026-09-27, three grilling rounds) — implementation plan in [`tdd-implementation-plan.md`](tdd-implementation-plan.md).

---

## Decision record

### Product decisions (confirmed with A, 2026-09-27)

All recommended answers were accepted. Q1–Q21 of the grilling map to D1–D21.

| ID | Question | Choice |
|---|---|---|
| D1 | Shape of the test | **A new suite node and leaf kind** (`reportTestSuite` holding `reportTest` leaves), reusing the component-test step and locator vocabulary. **Accepted.** Rejected: `reactComponentTestSuite` with a `ReportPage` component and integration allowed; component suites have no run target, no testbed lifecycle and no action checks, and would have to grow all three. |
| D2 | Where actions go | **Always a real store through the integration session**, as Runner tests. **Accepted.** Rejected: an extra in-memory mode with no-op persistence (today's `wireLocalCacheCompositeAction`, §3.4); checking what was persisted is the point, and a second mode doubles the matrix. |
| D3 | When checks run | **Check steps anywhere in the step list**, e.g. a query after step 3 of the wizard. **Accepted.** Checks only after the last UI step (the Runner test shape) is the special case where they come last. |
| D4 | Where it runs | **vitest (emulated server) first, the in-app Miroir Tests menu in a later slice.** **Accepted.** Both share the act-free component runner (§3.3). |
| D5 | How a test reaches the Report | **Mounted under a router at its real route**, from a Report uuid plus application, deployment and section. **Accepted.** Navigation buttons keep working, and no `react-router` mocking is needed (the app cannot mock). Rejected: rendering the display component with props. |
| D6 | First targets | **`BookDetails` first, `ConnectExternalServiceWizard` second.** **Accepted.** The wizard also needs fake HTTP responses (D14). |
| D7 | Name and tags | **`report.<reportName>[.<variant>]`**, e.g. `report.bookDetails.editAndSave`; mode tags **`integ` and `ui`**. **Accepted.** |
| D8 | Where the Report's data comes from | **The testbed store**, read through the session's real cache, as Runner tests set up their deployment. **Accepted.** Rejected: the fixtures component tests preload in memory. |
| D9 | Isolation | **Store reset before each test**, as Runner tests. **Accepted.** Tests save data; shared state would make order matter. |
| D10 | Waiting for actions | **Every interaction step waits until the actions it started have finished.** **Accepted.** A `waitForActions` step may come later for a fire-and-forget case. |
| D11 | Check steps | **Two step kinds**: `compositeAction` (runs an action or query, stores its result under a name) and `expectActionResult` (the Runner tests' `compositeRunTestAssertion`). A `compositeAction` placed first also does per-test data setup. **Accepted.** |
| D12 | Finding buttons and fields | **Existing locators** (role and name, test id, text, label) **plus stable test ids on Report buttons** (submit, Next, Finish, Back). **Accepted.** Report-level locators ("section 2, submit") only if tests become hard to read. |
| D13 | First target case | **`BookDetails` on one Book**: edit a field, submit, query the Book, compare; a second case enters an invalid value and checks nothing was saved. **Accepted.** |
| D14 | Fake HTTP for the wizard | **Responses declared at suite level, answered through a fetch seam** in miroir-core, so the test also runs in the app. **Accepted.** Rejected: the local fake server of the TS tests (vitest only, needs `allowInsecureBaseUrlsForTests`). |
| D15 | Where the runner lives | **miroir-core knows the leaf kind and hands it to a report test runner the app registers** through `ConfigurationService`, as component tests do. **Accepted.** |
| D16 | Which actions are waited for, and for how long | **Every DomainController entry point; "wait until idle"; timeout 10 s by default, settable per suite; the failure names the action still running.** **Accepted.** See T5 for the correction on `handleAsyncAction`. |
| D17 | Stored results in UI steps | **Not in the first version**: UI steps take literal values. **Accepted**; follow-up issue #333 (A asked for it). |
| D18 | Running in the app | **Mounted visibly** under "Run Integration Tests", in the panel component tests already use. **Accepted.** |
| D19 | The wizard's TS UI tests | **`wizardWalk.284` and `multistepBranch.284` deleted** in the slice that adds `report.connectExternalServiceWizard.*`, after checking it covers the same paths. Phases 0–4 (action level) stay. **Accepted.** |
| D20 | Non-regression | **One nonreg step per suite** (`integ-report.bookDetails`, …) on the profiles Runner tests use, so `nonreg:filesystem` and `nonreg:default` run them. **Accepted.** |
| D21 | Docs | **A "Report tests" section in `docs/reference/testing.md` now**; a skill for writing Report tests later, once a few exist. **Accepted.** |

### Technical decisions (this analysis)

| ID | Question | Choice | Reason |
|---|---|---|---|
| T1 | Schema | New context entries in the MiroirTest Entity (row **and** EntityVersion `51c647fe-…`, identically): `reportTestSuite` (`miroirTestType: "reportTestSuite"`, `miroirTestLabel`, `skip?`, `report: { application, applicationSection, reportUuid, instanceUuid? }`, `actionTimeoutMs?`, `fakeHttpResponses?`, `miroirTests: reportTest[]`), leaf `miroirTestForReport` (`miroirTestType: "reportTest"`, `miroirTestLabel`, `skip?`, `instanceUuid?`, `steps`), and `reportTestStep` = `reactComponentTestStep` ∪ `compositeAction` ∪ `expectActionResult`. `miroirTestSuite.miroirTests` accepts `reportTestSuite`; a `reportTest` leaf is accepted only inside it (as #294 did for component leaves). Run target and testbed stay on the enclosing `miroirTestSuite` (`runTarget`, `testbedInitApplicationParameters`, `testbedReset` already exist, §3.2). | Mirrors the `reactComponentTestSuite` pattern (§3.1), so the walk, the tracker paths and the in-app list treat it the same way. The Report's application is separate from the run target: the wizard is a Miroir Report acting on the Library run target. |
| T2 | Core dispatch | `MiroirTestAnyLeaf` gains `MiroirTestForReport`; `runMiroirTest` gets a `"reportTest"` arm that requires integration mode and a `runnerTestContext`, and calls `ConfigurationService.configurationService.reportTestRunner` with the leaf, a `ReportTestSuiteContext` built by the walk, and the execution environment. No registered runner → leaf recorded as skipped with a message (same rule as `REACT_COMPONENT_TEST_NO_RUNNER_MESSAGE`). | D15. Keeps miroir-core free of React (layer rule, AGENTS.md). |
| T3 | Session and launch | A suite with `reportTest` leaves is a **runner-kind integration suite**: `inferIntegrationSessionKind` returns `"runner"`, `classifyApplicationMiroirTestCliLaunchKind` returns `"runner-integration"`, so it runs in the existing `miroir-runner-tests[-shared].integ` entries (happy-dom, `vite.config.js` L131) with `RunnerTestSession`. `miroirTestSuiteModeTags` returns `["integ", "ui"]` for it. | Reuses the session that already creates the testbed deployment and resets it before each test (D8, D9). No new vitest entry. |
| T4 | Mounting | The app runner mounts `PageDispatcher` under a `MemoryRouter` whose entry is the real report URL `/?page=report&application=…&deploymentUuid=…&applicationSection=…&reportUuid=…[&instanceUuid=…]`. Providers come from the session: `LocalCacheProvider` over `domainController.getLocalCache()` (`DomainControllerInterface` L219), `MiroirContextReactProvider` with the session DomainController. `buildComponentTestWrapper` is split so its provider stack can take a given DomainController and LocalCache; its fixture loading stays for component suites. | D5, D8. `PageDispatcher` is today's route for reports (§3.5); `ReportPage` (read by the 284 tests through a mocked `useParams`) is no longer routed. |
| T5 | "Wait until idle" | Built on `MiroirActivityTracker`: every DomainController entry point already runs inside `trackAction` (`handleActionFromUI` L2931, `handleAction` L3062, `handleCompositeAction` L4566, `handleBoxedExtractorOrQueryAction` L962, `handleCompositeRunBoxedQueryAction` L5483), which records an `action` activity with status `running` until it settles. After each interaction step the runner flushes React, then waits until no `action` activity is running, then flushes again, repeating until nothing new started. Timeout from `actionTimeoutMs` (default 10 000 ms); the error names the running actions (`actionType`, `actionLabel`). | D10, D16. **Correction to the Q16 wording:** `handleAsyncAction` is the app's snackbar helper (`useSnackbar`), not a DomainController method; it is covered because the DomainController calls it wraps are tracked. Test activities share the tracker, hence the `action` filter. |
| T6 | `compositeAction` step | `{ step: "compositeAction", action: CompositeActionTemplate, nameGivenToResult?: string }`. Runs through the session DomainController's `handleCompositeActionTemplate`, with the session `testParams` and the leaf's stored results as parameters; stores the `returnedDomainElement` of its last action (what `handleCompositeAction` returns, L4782–L4800) under `nameGivenToResult`. An `Action2Error` fails the step. | D11. No new DomainController API. |
| T7 | `expectActionResult` step | `{ step: "expectActionResult", assertion: CompositeRunTestAssertion }`. Runs a one-element `compositeActionSequence` holding the assertion, with the stored results as action parameters, so `handleTestCompositeActionAssertion` (L5222) reads them as its `localContext`, exactly as in a Runner test sequence. The leaf fails with the assertion label, expected and actual values. | D11. Same assertion semantics as Runner tests (ignored attributes, `resultAccessPath`, `resultTransformer`). |
| T8 | Stable test ids | Add `data-testid` to the `TypedValueObjectEditor` submit button, and to the multistep **Back** and **Finish** buttons; **Next** already has `multistep-next` (`MultistepReportHost.tsx` L1049). | D12. |
| T9 | Fetch seam | One module-level fetch in miroir-core `4_services` (default: global `fetch`), with a setter, used by the four outbound call sites: `DomainController.handlePrepareOpenApiDocument` (L4118), `ExternalServiceClient` L354 and L485 (OAuth2 token), L740 (operation call). The report runner installs a fake that answers the suite's `fakeHttpResponses` (`method`, `url`, `status`, `headers?`, `body`) and fails any undeclared request with an error naming it; it restores the default after the suite. Fake URLs use `https` and a public host name (e.g. `https://fake-service.example`), so `assertBaseUrlAllowed` (L144) passes without `allowInsecureBaseUrlsForTests`. | D14. On `realServer-*` profiles the outbound calls run in the server process, which the client seam cannot reach: suites declaring `fakeHttpResponses` are skipped there with an explicit message. |
| T10 | In the app | "Run Integration Tests" on a suite with `reportTest` leaves mounts each Report in `ComponentTestSandbox` with the integration session's DomainController and LocalCache. | D18. Browser profiles are `emulatedServer-indexedDb` and `realServer-*` (docs/reference/testing.md, UI integration launch). |
| T11 | Nonreg | Steps `integ-report.<subject>` shaped like `integ-runner.*` (`--profile {profile}`, same `shared` group). | D20. |
| T12 | Deleting the 284 UI tests | In the wizard slice, a coverage table maps each `it` of `wizardWalk.284` and `multistepBranch.284` to a `reportTest` case (or to a phase 0–4 test); both files and the nonreg step `appstack-284-openapi-connection-wizard` go only when every row is covered. | D19. |

**Rationale:** reuse what exists at each layer. The schema reuses the component-test step vocabulary, the session reuses `RunnerTestSession`, the checks reuse the Runner tests' composite-action assertions, and the mount reuses the app's own routing and providers. The new code is the glue: the leaf kind, the app runner, the idle wait and the fetch seam.

---

## 1. Goals

1. **Test an edit Report end to end** — In order to know a Report really saves what its user typed, as an application designer, I can write a MiroirTest that opens the Report on an instance, edits fields, presses its submit button and checks the stored instance.
2. **Test a multi-step Report** — In order to keep a wizard such as `ConnectExternalServiceWizard` working as it evolves, as a framework developer, I can write a MiroirTest that walks its steps and branches, presses Finish, and checks what Finish created.
3. **Check results mid-flow** — In order to pinpoint which step of a workflow went wrong, as a test author, I can run a query at any point of the step list and assert on its result.
4. **Fake external services** — In order to test Reports that call external HTTP services without a network or a helper server, as a test author, I can declare the responses in the test.
5. **Run with the other MiroirTests** — In order to catch regressions before merging, as a developer, I can select Report tests with `--suites report.*` or `--tags`, and they run in `nonreg:filesystem` and `nonreg:default`.
6. **Watch a Report test** — In order to see what a failing Report test does, as a developer, I can run it from the Miroir Tests page and watch the Report being driven.

## 2. Non-goals

- UI steps using values stored by earlier `compositeAction` steps (#333, D17).
- An in-memory mode with no-op persistence (D2, rejected).
- Report-level locators such as "section 2, submit" (D12, later if needed).
- A skill for writing Report tests (D21, later, once a few exist).
- Migrating the other TS tests that mount Reports (`multistepProcess.274`, `multistepLaunch.274`, `ReportPage.integ`, `externalServiceReport.integ`, `spotifyApp.integ`, `apiCallReport.281.*`) (later, unscheduled). Only the two 284 UI tests go (D19).
- Report tests with fake HTTP on `realServer-*` profiles (T9).

## 3. Current state

### 3.1 UI MiroirTests are unit-only and cannot run actions

`runMiroirTest` refuses component leaves in integration mode (`MiroirTestTools.ts` L299–L303):

```typescript
case "reactComponentTest":
  if (executionMode === "integration") {
    throw new Error(
      "runMiroirTestInMemory: reactComponentTest leaves cannot run in integration mode",
    );
  }
  return runMiroirReactComponentTest(/* … */);
```

- The leaf goes to `ConfigurationService.configurationService.reactComponentTestRunner` (`ReactComponentTestTools.ts` L69), which the app registers (`componentTests/index.ts` L50). No runner → skipped with a message.
- The only registered component is `MlElementEditor` (`componentRegistry.ts`).
- `buildComponentTestWrapper` (`componentTestTools.tsx` L476–L781) builds its own `LocalCache` loaded with the Miroir meta-model and Library fixtures. Its DomainController is `{ handleAction: createRecordingFunction() }` (L741–L744): it records calls and persists nothing.
- The opt-in `wireLocalCacheCompositeAction` (L458, L683–L737) builds a real `DomainController("local", …)` over that cache but replaces `callUtil.callPersistenceAction` with a no-op (L696–L697), and hard-wires the Library deployment. It cannot be set from a MiroirTest instance; only the TS tests of #274 and #284 use it.
- Steps (`reactComponentTestStep`, MiroirTest Entity context): interactions (`click`, `change`, `type`, `selectOption`, …), `expectRenderedValues`, `expectElement`, `measureRendering`. There is no step that runs an action or a query.

### 3.2 Runner MiroirTests run actions but bypass the UI

- Leaf `miroirTestForRunner` (MiroirTest Entity context): `runnerRef`, `testParams.<runnerName>` (the action the Runner's form would submit), `preRunnerCompositeActions`, `preTestCompositeActions` (which run **after** the Runner, despite the name), `testCompositeActionAssertions`.
- `testBuildPlusRuntimeCompositeActionSuiteForRunner` (`Runner.ts` L39–L231) builds `beforeAll` (create deployment), `beforeEach` (reset and init), `afterEach` (reset) and one sequence: rollback, pre-runner actions and commit, the Runner's action (`getFromParameters [runner.name]` for a form Runner), commit, `preTestCompositeActions`, then the assertions. The Runner's form is never rendered.
- Runner and action leaves require integration mode (`MiroirTestTools.ts` L198–L203, L316–L326). `RunnerTestSession` (`RunnerTestSession.ts` L164–L420) gets its DomainController from `runAppStackIntegrationBootstrap` (emulated server) or `runRealServerClientBootstrap` (real server), and builds `runnerTestContext`.
- `miroirTestSuite` already carries `runTarget`, `testbedModel`, `testbedEntitiesAndInstances`, `testConfiguration`, `testbedInitApplicationParameters`, `testbedReset` and `testParams` (enumerated from the Entity context). Its `miroirTests` accepts `miroirTestLeaf`, `miroirTestSuite` and `reactComponentTestSuite`.

### 3.3 Where each kind runs

| Kind | Mode | vitest entry | DOM | In the app |
|---|---|---|---|---|
| component (`ui.*`) | unit | `tests/4_view/miroir-component-tests.unit.test.tsx` | happy-dom | unit Run, `ComponentTestSandbox.tsx` |
| runner, action (`runner.*`, `action.*`) | integ | `tests/miroir-runner-tests[-shared].integ.test.ts` | happy-dom | "Run Integration Tests" (`uiIntegrationTestLauncher.ts`) |

Every miroir-standalone-app vitest run uses happy-dom (`vite.config.js` L131), so the runner integ entries can mount React. The component runner's DOM helpers are act-free (`componentTestEnvironment.ts`), so the same code runs in vitest and in the app.

Mode tags come from `miroirTestSuiteModeTags` (`miroirTestTags.ts` L22): `["ui"]` when any leaf is a component leaf, otherwise from the CLI launch kind. The session kind comes from `inferIntegrationSessionKind` (`inferIntegrationSessionKind.ts` L84).

### 3.4 How the 284 wizard is tested today

`ConnectExternalServiceWizard` is a **Report**, uuid `dbd94bfe-b803-4bfd-8bb2-70a5932d5d1a`, in the Miroir application (`miroir_data/3f2baa83-…/`), `type: "multistep"`. It has no MiroirTest.

| File | What it does |
|---|---|
| `connectExternalService.284.phase0`–`phase4` (`tests/3_controllers/issues/284-…/`) | Action level: `domainController.handleAction({ actionType: "connectExternalService" })` on an emulated-server session, then checks `currentModel`. Stay (D19). |
| `wizardWalk.284.integ.test.tsx` (748 lines) | Mounts `ReportPage` with `wireLocalCacheCompositeAction: true` (L384), mocks `react-router-dom` (L81), walks the steps with `fireEvent`, probes a local fake server (`startFakeExternalServiceServer`, L169; `allowInsecureBaseUrlsForTests`, L172), presses Finish and reads the endpoint and report from `localCache.getDomainState()`. Nothing is persisted. |
| `multistepBranch.284.integ.test.tsx` (622 lines) | Branching host, same mounting. |

Nonreg runs them as `unit-284-openapi-connection-wizard`, `integ-action-284-openapi-connection-wizard[-auth]` and `appstack-284-openapi-connection-wizard`.

### 3.5 Report routing, buttons and saving

- Reports are routed by `PageDispatcher` (`PageDispatcher.tsx`), from `?page=report&application=…&deploymentUuid=…&applicationSection=…&reportUuid=…[&instanceUuid=…]`; `ReportWrapper` (L85) renders `PageContainer` then `ReportDisplay`. `ReportPage.tsx` still reads `useParams` but is no longer on a route.
- `ReportDisplay` renders `MultistepReportHost` for `type: "multistep"` (L203), otherwise `ReportViewWithEditor` (L191).
- Multistep buttons: **Next** has `data-testid="multistep-next"` (`MultistepReportHost.tsx` L1049); **Back** and **Finish** have no test id. Finish runs the Report's `compositeActionSequence` through the DomainController (`runMultistepFinish`, L136).
- `TypedValueObjectEditor` submit (L521–L534) has no test id and is `disabled={!isFormAndFieldsValid}`: field errors or a failed validation transformer disable it.
- `ReportViewWithEditor`'s Formik `onSubmit` (L476–L494) calls `onEditValueObjectFormSubmit` (L309–L421), which calls `domainController.handleActionFromUI` with `updateInstance` / `createInstance` (data) or `transactionalInstanceAction` (model). `handleActionFromUI` auto-commits.

### 3.6 Finding: the `BookDetails` instance section does not save (confirmed in Slice 3)

`BookDetails` (uuid `c3503412-3d8a-43ef-a168-aa36e975e606`, Library model) is a `list` of one `objectInstanceReportSection` (`book`, extracted by `extractorByPrimaryKey` from `instanceUuid`) and two `objectListReportSection` (`booksOfAuthor`, `booksOfPublisher`), enumerated from the JSON.

For a non-multistep Report, `ReportSectionEntityInstance` wraps the `TypedValueObjectEditor` in its own Formik with a no-op submit (L636–L657, since #82, commit `65ac0fe`):

```tsx
<Formik
  initialValues={{ [formikValuePathAsString]: displayedInstance }}
  enableReinitialize
  onSubmit={() => {}}
>
```

`TypedValueObjectEditor.onSubmit` calls `formik.handleSubmit(e)` (L343) on the nearest Formik, which is this one. **Inferred, not run:** submitting an edited Book in `BookDetails` does not reach `onEditValueObjectFormSubmit`, so nothing is saved. The first red test of the `BookDetails` slice confirms or refutes this. If confirmed, making it save is part of this issue, since D13's first case must pass.

**Confirmed (2026-09-27, Slice 3):** the leaf "saves an edited title" failed at its store check with no `updateInstance` in the log. Fixed by passing the nested Formik's values to the Report form's submit through `ReportFormSubmitContext`, without the virtual attributes (plan, Slice 3 Realization).

### 3.7 Outbound HTTP

`fetch` is called directly at four places: `DomainController.handlePrepareOpenApiDocument` (L4118, fetching an OpenAPI document by URL) and `ExternalServiceClient` L354, L485 (OAuth2 tokens) and L740 (operation calls, including the wizard's probe). `assertBaseUrlAllowed` (L144) rejects non-`https` and loopback or private hosts unless `allowInsecureBaseUrlsForTests` listed them.

## 4. Key reuse

| Piece | Location |
|-------|----------|
| Component-test steps, locators, act-free runner | `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/` (`runComponentTestSteps.ts`, `componentTestTargets.ts`, `componentTestEnvironment.ts`) |
| Provider stack | `buildComponentTestWrapper`, `componentTestTools.tsx` L476 |
| Runner registration pattern | `ConfigurationService.registerReactComponentTestRunner` (`ConfigurationService.ts` L91), `ReactComponentTestTools.ts` |
| Integration session, testbed create and reset | `RunnerTestSession.ts`, `Runner.ts` (`createDeploymentCompositeAction`, `resetAndinitializeDeploymentCompositeAction`) |
| Assertions on action results | `compositeRunTestAssertion`, `DomainController.handleTestCompositeActionAssertion` L5222 |
| Pending-action tracking | `MiroirActivityTracker.trackAction` (L360), `getFilteredActivities({ trackingType: "action", status: "running" })` (L97) |
| Report route | `PageDispatcher.tsx`, `reportPageParamsFromSearchParams` (L56) |
| In-app sandbox | `ComponentTestSandbox.tsx`, `uiIntegrationTestLauncher.ts` |
| MiroirTest Entity | uuid `a311f363-e238-4203-bdfc-29e8c160c26b`; EntityVersion `51c647fe-07ec-411c-89cc-02689dc66d6a` |
| `BookDetails` Report | uuid `c3503412-3d8a-43ef-a168-aa36e975e606` (Library) |
| `ConnectExternalServiceWizard` Report | uuid `dbd94bfe-b803-4bfd-8bb2-70a5932d5d1a` (Miroir) |

## 5. Risks

| Risk | Where it shows | Mitigation |
|---|---|---|
| `PageContainer` (sidebar, outline) needs contexts the test providers lack | First mount of the tracer slice | Add the missing providers; if the sidebar pulls in too much, mount `ReportDisplay` under the same `MemoryRouter` URL, which keeps real navigation (D5). |
| An action starts after the idle wait returns (Formik submits asynchronously, `queueMicrotask` in the multistep host) | Flaky checks after submit or Finish | T5 loops flush-then-wait until no new action starts. |
| `BookDetails` does not save today (§3.6) | Slice with the edit-and-save case | Fix the instance-section submit in that slice. Confirmed and fixed in Slice 3. |
| `usePageConfiguration({ autoFetchOnMount: true })` in `ReportWrapper` fetches configurations through the session | Tracer slice | Acceptable if it succeeds on the emulated server; otherwise a session-level load before mounting. |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
