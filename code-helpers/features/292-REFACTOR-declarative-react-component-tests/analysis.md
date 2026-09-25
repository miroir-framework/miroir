# 292 Declarative reactComponentTest steps (JzodElementEditor)

> How the 68 JzodElementEditor component test cases move from TypeScript bodies named by `componentTestRef` to MiroirTest JSON that holds the component, its props, and a list of declarative steps, interpreted by the app's component test runner.

Related issue: https://github.com/miroir-framework/miroir/issues/292
Prior work: [#286 React component tests as MiroirTests](https://github.com/miroir-framework/miroir/issues/286) ✅ [`../286-FEATURE-react-component-miroir-tests/analysis.md`](../286-FEATURE-react-component-miroir-tests/analysis.md) · [`../286-FEATURE-react-component-miroir-tests/tdd-implementation-plan.md`](../286-FEATURE-react-component-miroir-tests/tdd-implementation-plan.md) · [#196 migrate tests to MiroirTest](https://github.com/miroir-framework/miroir/issues/196) ✅
Key sources: [`runReactComponentTest.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/runReactComponentTest.tsx) · [`componentTestEnvironment.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestEnvironment.ts) · [`componentTestTools.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestTools.tsx) · [`componentTestManifest.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestManifest.ts) · [`componentTestRegistry.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestRegistry.ts) · [`jzodElementEditor/`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/jzodElementEditor/) · [`generate-component-miroir-tests.ts`](../../../packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts) · [`FormComponents.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/FormComponents.tsx) · [`miroirTestSuiteWalk.ts`](../../../packages/miroir-core/src/5_tests/miroirTestSuiteWalk.ts) · [`MiroirTestTools.ts`](../../../packages/miroir-core/src/5_tests/MiroirTestTools.ts) · [`ReactComponentTestTools.ts`](../../../packages/miroir-core/src/5_tests/ReactComponentTestTools.ts) · [`inferIntegrationSessionKind.ts`](../../../packages/miroir-core/src/5_tests/inferIntegrationSessionKind.ts) · [`miroirTestTypes.ts`](../../../packages/miroir-core/src/0_interfaces/5-tests/miroirTestTypes.ts) · [MiroirTest Entity `a311f363-…`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a311f363-e238-4203-bdfc-29e8c160c26b.json) · [MiroirTest EntityVersion `51c647fe-…`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/51c647fe-07ec-411c-89cc-02689dc66d6a.json) · [instance `761d4ed2-…`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/761d4ed2-1a5c-4901-a9d9-897dbec0b27f.json) · [`miroir-component-tests.unit.test.tsx`](../../../packages/miroir-standalone-app/tests/4_view/miroir-component-tests.unit.test.tsx)

**Document role:** analysis and architectural decision record.
**Status:** product decisions D1-D14 confirmed with the user (grilling session, 2026-09-25). Technical decisions T1-T14 taken in this analysis (§2.2). Two points need the user (§8).

Line numbers refer to branch `292-REFACTOR-declarative-react-component-tests` at `34a6c0c0b` (created from `aba`).

---

## 1. Sequencing

| Step | Issue | Status |
|---|---|---|
| `reactComponentTest` leaf, runner injection, sandbox, 68 cases as TypeScript bodies | #286 | ✅ |
| Declarative steps, per-editor instances, extractor fix | **#292 (this document)** | this issue |
| `JzodElementEditorReactCodeMirror.test.tsx` and other UI_COMPONENT files (#204) | later, unscheduled | later |

---

## 2. Decision record

### 2.1 Product decisions (confirmed with the user)

| ID | Question | Choice |
|---|---|---|
| D1 | Source of truth | The MiroirTest JSON in `miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-…/` holds the component, props, and steps of each case. The TS registry keeps only a component factory per component name. The generator `scripts/generate-component-miroir-tests.ts` and `componentTestManifest.ts` are removed (M1). The consistency unit test is rewritten to validate the JSON instances against the schema. |
| D2 | Step language | End goal fully declarative (no TS bodies). Intermediate escape hatch `{"step":"custom","function":"<name>","params":{…}}`, resolved in a TS registry of `(env, params, context) => Promise<void>`, `context` holding the last extracted values. M1: no `componentTestRef` left (`componentTestRef`, manifest, generator, `componentTestRegistry.ts`, the per-editor TS case files deleted). M2: no `custom` step left, custom-step registry deleted. Both in this issue. |
| D3 | Scope and slices | One issue, all 7 suites (Array 12, Enum 3, Literal 3, Object 14, SimpleType 12, Union 9, Any 15 = 68 cases). Slices: (1) schema, step interpreter, `expectRenderedValues`, extractor fix, JzodEnumEditor migrated with no `custom` step; (2) Literal + SimpleType; (3) Array + Object; (4) Union + Any; then M1 cleanup, M2, docs/nonreg. During migration a leaf has either `steps` or legacy `componentTestRef`. |
| D4 | Extractor defect | "renders all enum options" merges initial values into after-click values because `extractValuesFromRenderedElements` loses the selected value while the dropdown is open. Fix the extractor or the component. The workaround is not carried into the DSL. |
| D5 | Suite node | New typed MiroirTest node `reactComponentTestSuite` with `component` (name resolved in a small TS component registry, e.g. `"JzodElementEditor"`) and `componentProps` (defaults). A `reactComponentTest` leaf has `steps` and optional `componentProps`, shallow-merged over the suite defaults. |
| D6 | Value assertion step | `{"step":"expectRenderedValues","label":"after click","detectOptions":true,"expectedValue":{…}}`. The runner calls `extractValuesFromRenderedElements` with `env.expect`, container, `testSectionName`, portal element, logs the values, compares with `toEqual`. `expectedValue` is nested form values (the `formValuesToJSON` output). Option lists go under the reserved key `"$options": {"<field>": […]}`. |
| D7 | Vocabulary | DOM primitives (`click`, `type`, `clear`, `change`, `blur`, `waitForAttribute`, …) with Testing Library descriptors as targets (`{"byRole":"combobox"}`, `{"byTestId":…}`), plus widget steps implemented in TS and addressed by field (`openSelect`, `selectOption`, `clickArrayButton {index, action: up\|down\|add\|duplicate\|delete}`, `toggleUnionTypeSelector`, …). The vocabulary expresses all 68 cases without `custom` at M2. |
| D8 | Addressing | Widget steps address fields by `rootLessListKey` (`"field": "testField"`). The runner maps it to `formikFieldName` and the matching test ids. |
| D9 | Waiting | The runner waits after every action (act-free `act` plus the `waitAfterUserInteraction` equivalent). Explicit wait steps only for conditions. Widget steps wait for their own postcondition (e.g. `data-test-is-open`). |
| D10 | Schema location | The new node, the steps union, and `expectRenderedValues` go into the MiroirTest Entity definition (and the EntityVersion if a dual write is needed), with TS types generated by the `devBuild` of miroir-core. The step interpreter lives next to `runReactComponentTest.tsx`. miroir-core keeps only the runner signature. |
| D11 | Errors | A failing step reports `step <index> (<kind> "<label>"): <message>`. |
| D12 | Instances | One MiroirTest instance per editor (`JzodEnumEditor_ComponentTestSuite`, …) instead of the single `JzodElementEditor_ComponentTestSuite`. The Enum instance reuses `761d4ed2-1a5c-4901-a9d9-897dbec0b27f`. |
| D13 | Acceptance per slice | Each migrated suite passes in vitest (`tests/4_view/miroir-component-tests.unit.test.tsx`) and in the app sandbox, with the same case count and labels as before. The #286 integration tests (`tests/4_view/issues/286-react-component-miroir-tests/`) still pass, adapted where they reference the manifest or the instance. |
| D14 | Branch | `292-REFACTOR-declarative-react-component-tests` from `aba`. |

### 2.2 Technical decisions (this analysis)

| ID | Question | Choice | Reason |
|---|---|---|---|
| T1 | Where the `reactComponentTestSuite` node sits in an instance | Each instance keeps a `miroirTestSuite` root (label = instance name). Its one child is the `reactComponentTestSuite` (label = editor name, e.g. `JzodEnumEditor`). The node is a new member of the `miroirTestSuite.miroirTests` union only, not of the root reference. | The root reference is `miroirTestSuite` (Entity L825-827). `isMiroirTestSuiteInstance` (`applicationMiroirTestCatalog.ts` L46), `loadApplicationMiroirTestsFromFolders.ts` L124, and `RunMiroirTestSuiteButton.resolveRunMode` (L73) accept only a `miroirTestSuite` root. Nesting keeps them unchanged and keeps the vitest names `JzodEnumEditor > JzodEnumEditor: <case>` of #286. |
| T2 | New node type vs an attribute on `miroirTestSuite` | Keep D5 (new node type). Not disproportionate: §5.2 lists 4 source predicates and 2 test helpers to extend, against none for the attribute. The context propagation to leaves is the same work in both designs. | The TypeScript compiler finds the predicates that miss the new member (exhaustive `never` arms in `inferIntegrationSessionKind.ts` L51-54 and L69-72, `MiroirTestTools.ts` L319). |
| T3 | How the suite context reaches the runner | When the walk enters a `reactComponentTestSuite`, it builds `ReactComponentTestSuiteContext { suitePath, component, componentProps, caseLabels }` and passes it to each leaf through a new trailing optional parameter of `_runMiroirTest` / `_runMiroirTestWithTracking` / `runMiroirTest`, down to `runMiroirReactComponentTest`. The runner signature becomes `(params: { testNamePath, leaf, suite? }) => Promise<ReactComponentTestRunnerResult>`. | Typed, and no hidden field on the generated leaf type. The walk already builds a per-leaf `effectiveLeaf` (L171), so it is the place that knows the parent. |
| T4 | Suite wrapper lifetime | The runner keys its per-suite wrapper by `suitePath` and destroys it after the leaf whose label is the last of `caseLabels`. Legacy leaves keep the `componentTestRef.suite` key until M1. | Today the key is `componentTestRef.suite` and the last case comes from registry order (`runReactComponentTest.tsx` L129-135, L176-180). Neither exists for step leaves. |
| T5 | Legacy suites during migration | Slice 1 splits `761d4ed2-…` into 7 instances at once. A not yet migrated editor keeps a plain `miroirTestSuite` child with its `componentTestRef` leaves. A migration slice replaces that child by a `reactComponentTestSuite` with step leaves and deletes the editor's TS file and its manifest and registry entries. | D12 gives the Enum instance the uuid of the combined instance, so the 6 other editors need their own instances before Enum migrates. The generator writes one combined instance (`generate-component-miroir-tests.ts` L39-75), so it is deleted in Slice 1 rather than rewritten, and the 7 JSON files are edited by hand from then on. |
| T6 | Target descriptors | A target has exactly one locator: `byRole` (+ `name`), `byTestId`, `byText`, `byDisplayValue`, `byLabelText`, `widget` (+ `field`, …), or `ref`. Optional refinements: `fieldName`, `fieldNamePrefix`, `id`, `index`. No descriptor holds a `TESTSECTION.` name: field-based names go through `widget` or `fieldName` / `fieldNamePrefix`. | D7 and D8. The cases filter `getAllBy…` results by `name` or `id` (e.g. `JzodSimpleTypeEditor.tsx` L38-51), which the refinements express. |
| T7 | `expectRenderedValues` parameters beyond D6 | Optional `field` (extractor label `formikFieldName(field)`; absent means `testSectionName`), `path` (sub-value compared, after `formValuesToJSON`), `filter` (the extractor filter), `timeout` (retry until equal). | Every current call is reproduced with the same label and filter (§3.7). `path` is needed by "createObject definition record entry name can be renamed" (`JzodObjectEditor.tsx` L501), `filter: []` by 7 calls in Union and Any, `timeout` by the `waitFor` blocks around value reads (`JzodUnionEditor.tsx` L329-344, `JzodAnyEditor.tsx` L118-133). |
| T8 | `$options` | The runner removes the array-valued entries of the extractor output (the option lists) before `formValuesToJSON`, and builds `$options` from the rendered option elements: `[role="option"]` whose `aria-label` is `<formikName>-option-<value>` (`FormComponents.tsx` L708), grouped by `<formikName>` minus `TESTSECTION.`, text in DOM order. `$options` is present whenever an option list is rendered, whatever `detectOptions`. | The extractor key `<label>.options` does not name the field (§3.7). The extractor adds it from `[role="option"]` whatever `detectOptions` (L1650-1678), so Enum case 3 has an option list with `detectOptions` false. Form inputs never give an array value, so array-valued entries are exactly the option lists. |
| T9 | bigint in JSON props | A tagged value `{"$bigint": "<digits>"}` anywhere in `componentProps` is revived to `BigInt(<digits>)` by the runner before rendering. | 3 cases pass a BigInt as initial form state (`JzodObjectEditor.tsx` L97, `JzodSimpleTypeEditor.tsx` L264, L278). JSON has no bigint, and a string would not type-check against a `bigint` schema. |
| T10 | Error message form | `step <n> (<kind>)` or `step <n> (<kind> "<label>")`, then `: <message>`. `n` is 1-based. `expectRenderedValues` failures also return `expected` and `actual` in the runner result. | The issue example numbers `expectRenderedValues "after click"`, the third step, as step 3. |
| T11 | Element aliases | Any step with a `target` may set `saveAs: "<name>"`; later targets may be `{"ref": "<name>"}`. | 4 cases assert on an element found earlier (Object L310-322 and L484-496 after a rename, Union L514-515 and Any L216-217 `starParent.contains(selectorInput)`). |
| T12 | Schema rebuild count | Slice 1 defines the full step union of M2 plus `custom` in the schema. The interpreter implements kinds slice by slice. A kind not implemented yet fails with `step <n> (<kind>): not implemented`. | One schema rebuild for the vocabulary instead of one per slice. M1 and M2 each rebuild once to remove `componentTestRef` and `custom`. |
| T13 | Component registry | `componentRegistry.ts`: `{ JzodElementEditor: getJzodElementEditorForTest("JzodElementEditor.test") }`. No page label parameter. | All 7 suite files use the same page label (`JzodEnumEditor.tsx` L21 and the 6 others). No suite sets `applicationDeploymentMap` (§3.6), so the runner keeps `defaultSelfApplicationDeploymentMap`. |
| T14 | Literal suite without label | The Literal `reactComponentTestSuite` has no `label` in its `componentProps`. Cases 1 and 3 add `"label": "Test Label"`. | A shallow merge cannot remove a key, and JSON has no `undefined`. Case 2 renders without label (`JzodLiteralEditor.tsx` L55-62). |

---

## 3. Current state

### 3.1 The #286 runtime

- Leaf schema: `miroirTestForReactComponent` in Entity `a311f363-…` L519-554, fields `skip`, `componentTestRef {suite, case}` (L535-545), `miroirTestType` `reactComponentTest`, `miroirTestLabel`. The EntityVersion `51c647fe-…` has the same context (`miroirTestForReactComponent` at L515, `componentTestRef` at L531). `miroirTestLeaf` (Entity L222-263) has 6 members. `miroirTestSuite.miroirTests` (L372-392) is a union of `miroirTestLeaf` and `miroirTestSuite` discriminated by `miroirTestType`. The instance root is `miroirTestSuite` (L825-827).
- Generated types: `MiroirTestForReactComponent` in `preprocessor-generated/miroirFundamentalType.ts` (`componentTestRef` at L2659 and L10377), exported by miroir-core `index.ts` L472-473. `getMiroirFundamentalJzodSchema.ts` L1466-1471 spreads every context entry of the MiroirTest Entity into the fundamental schema, so new context entries need no generator change. `@miroir-framework/jzod` and `jzod-ts` are installed from npm at 0.8.5 (`miroir-core/package.json` L52, L70; `node_modules/@miroir-framework/` holds plain folders, not links). The new schema uses only features that 0.8.5 already handles in this file (discriminated unions, literals, records of `any`, optional attributes), so no sibling link is needed.
- Runner type (`miroirTestTypes.ts` L8-22): `ReactComponentTestRunner = (params: { componentTestRef; testNamePath }) => Promise<ReactComponentTestRunnerResult>`. `ConfigurationService.reactComponentTestRunner` (L41-42) and `registerReactComponentTestRunner` (L88-92).
- Leaf arm: `runMiroirTest` `reactComponentTest` case (`MiroirTestTools.ts` L280-294) calls `runMiroirReactComponentTest` (`ReactComponentTestTools.ts` L29-99), which calls the runner with `{ componentTestRef: miroirTest.componentTestRef, testNamePath }` (L69-72). The `"unit"` arm of `MiroirTestExecutionOptions` has `rethrowComponentTestFailures` and `excludeMiroirTestTypes` (L105-120).
- App runner (`runReactComponentTest.tsx`): looks up `registry[componentTestRef.suite].cases[componentTestRef.case]` (L112-125), one `buildComponentTestWrapper` per `componentTestRef.suite` (L129-135), props from `testCase.props` (object or function of `suiteProps`) or `suiteProps` (L142-145), mounts inside `ComponentTestModeContext` and `PortalContainerProvider` (L149-158), runs the body with `createComponentTestEnvironment` (L161-169), destroys the wrapper after the last case in registry order (L176-180).
- Environment (`componentTestEnvironment.ts`): `ComponentTestEnvironment` (L33-53), `ComponentTestCase` with `props?: Props | ((suiteProps) => Props)` (L55-59), `componentTestAct` (L95-98), `componentTestFireEvent` (L108-144), `waitForProgressiveRendering` (L170-181), `waitAfterUserInteraction` = progressive wait + 300 ms (L184-187).

### 3.2 Consumers of `componentTestRef`, manifest, registry, generator, `761d4ed2`, `reactComponentTest`

| Package / area | File:lines | Use |
|---|---|---|
| deployment-miroir | Entity `a311f363-….json` L519-554, EntityVersion `51c647fe-….json` L515-550 | leaf schema |
| deployment-miroir | `assets/miroir_data/a311f363-…/761d4ed2-….json` (68 leaves, 7 sub-suites) | generated instance |
| deployment-miroir | `index.ts` L332, `index.d.ts` L284, `src/Model.ts` L145 (import), L400 (`defaultMiroirMetaModel.tests`) | named export and model entry, written by the generator |
| miroir-core | `miroirTestTypes.ts` L8-22 | `ReactComponentTestRef`, runner type |
| miroir-core | `ReactComponentTestTools.ts` L70 | passes `componentTestRef` to the runner |
| miroir-core | `MiroirTestTools.ts` L113 (`rethrowComponentTestFailures`), L119 and L412-434 (`excludeMiroirTestTypes`), L280-294 (arm) | runner dispatch |
| miroir-core | `inferIntegrationSessionKind.ts` L50, L68 | unit-capable, not integration |
| miroir-core | `ConfigurationService.ts` L41-42, L88-92 | runner registration |
| miroir-core | `index.ts` L472-473, L1730, L1745, L1757-1758 | exports |
| miroir-core tests | `tests/1_core/issues/286-react-component-miroir-tests/reactComponentLeaf.286.phase2.unit.test.ts` L36, L117-119; `excludeMiroirTestTypes.286.phase6.unit.test.ts` L43, L109-110 | build leaves with `componentTestRef`, fake runners read the old params |
| miroir-core generic entry | `tests/miroir-core-tests.unit.test.ts` via `loadApplicationMiroirTestsFromFolders.ts` L124 | loads every instance, no runner: leaves recorded as skipped |
| app src | `componentTests/componentTestManifest.ts` L9-10 (uuid, name), L16-99, L102-104 | manifest |
| app src | `componentTests/componentTestRegistry.ts` L12-22 | registry |
| app src | `componentTests/runReactComponentTest.tsx` L23, L37, L74, L111-134, L177-178 | runner |
| app src | `componentTests/index.ts` (`registerComponentTests`) | chunk entry, unchanged |
| app src | `4-tests/miroirTestSuiteUiExecution.ts` L136-147 (`miroirTestDefinitionHasReactComponentTest`) | decides `beforeRun` |
| app src | `Buttons/RunAllMiroirTestsButton.tsx` L66, L208, L245 | checkbox, exclusion |
| app src | `Reports/MiroirTestDisplay.tsx` L162, `Reports/MiroirTestListDisplay.tsx` L187, `Reports/ComponentTestSandbox.tsx` L103 (`import()`) | sandbox wiring, unchanged |
| app scripts | `scripts/generate-component-miroir-tests.ts` (191 lines) | generator |
| app tests | `tests/4_view/miroir-component-tests.unit.test.tsx` L4, L35-37, L41-61, L100-120 | vitest entry, loads `761d4ed2` |
| app tests | `tests/4_view/componentMiroirTests.consistency.unit.test.ts` (234 lines) | manifest ⇔ registry ⇔ JSON |
| app tests | `issues/286-…/componentTestSandbox.286.phase4.integ.test.tsx` L76-81, L99-120, L195-209, L307-309, L323, L336, L375-376 | Array sub-suite of `761d4ed2`, replaces a registry case to make it fail |
| app tests | `issues/286-…/runAllComponentTests.286.phase6.integ.test.tsx` L68-72, L107-113, L263, L296 | all manifest leaves under one instance name |
| app tests | `issues/286-…/componentTestRunLock.286.review.unit.test.tsx` L113-134 | fake registry, `componentTestRef` params |
| app tests | `issues/286-…/componentTestChunk.286.phase4.unit.test.ts` L145 | bundle guard expects `componentTests/jzodElementEditor/JzodArrayEditor` in the chunk |
| nonreg | `scripts/nonreg-manifest.json` L812-819 (`appstack-miroir-component-tests`), L1062-1069 (`unit-286-react-component-miroir-tests`) | vitest entry, consistency test, #286 issue tests |
| docs | `docs/reference/testing.md` L116, L144, L760, L771-808; `docs/contributing/testing.md` L176-193; `docs/guides/developer/testing.md` L160 | instance name, generator, manifest |
| history | #286, #197, #204 documents under `code-helpers/features/` | left as they are, except the #286 sequencing pointer |

`packages/miroir-standalone-app/tests/tmp/miroir_model/…/a311f363-….json` also contains `componentTestRef` (L535). It is not tracked by git and is ignored here.

### 3.3 Walk, filters, tracker, and UI for a nested suite node

- `runMiroirTestSuiteWalk` (`miroirTestSuiteWalk.ts` L57-244) recurses only when `node.miroirTestType === "miroirTestSuite"` (L122-169). Any other node goes to the leaf path (L171-237). A `reactComponentTestSuite` child would reach `runMiroirTest`, whose exhaustive default throws `Unknown miroirTestType` (`MiroirTestTools.ts` L319).
- Filters: `resolveSuiteInnerFilter` (`miroirTestFilter.ts` L78-…) works on labels only. The walk calls it with `throwOnUnmatched: testSuitePath.length === 1` (L97). With one sub-suite per instance (D12), a filter from the single-suite view always names that sub-suite, so the #286 "filter matched no tests in suite" limit for multi-sub-suite instances (`docs/reference/testing.md` L808) disappears for component tests.
- `testNamePath` is `[...testSuitePath, label]` (L192, L220). The vitest test name is the bare leaf label (L208-209), inside the entry's `describe(<sub-suite>)`.
- Tracker: nested suites go through `_runMiroirTestSuiteWithTracking` → `trackTestSuite` (`MiroirTestTools.ts` L366-392). A new node needs the same call so that the results tree keeps `instance > editor > leaf`.
- Leaf enumeration: `walkMiroirTestLeaves` (`inferIntegrationSessionKind.ts` L17-35) recurses only into `miroirTestSuite`. It feeds `classifyMiroirTestSuiteExecutionCapabilities` (L108-…), used by the catalog (`applicationMiroirTestCatalog.ts` L73, L85), `MiroirTestDisplay` (L80), `RunMiroirTestSuiteButton` (L79), and `miroirTestSuiteUiExecution.ts` (L52, L85). A missed node gives "no unit leaf" and breaks the Run button mode.
- `miroirTestDefinitionHasReactComponentTest` (`miroirTestSuiteUiExecution.ts` L136-147) recurses only into `miroirTestSuite`. A missed node means `beforeRun` is not awaited, so no runner is registered and every leaf is skipped.
- `testSuites` (`TestTools.ts` L965-989) lists suite paths whose children are all suites. It has no live caller (only a comment in `MiroirActivityTracker.ts` L662), but is exported (`index.ts` L1530).
- `collectRunnerTestLeaves` (`runnerTestSuiteResolve.ts` L6-19) only collects `runnerTest` leaves and ignores other nodes. No change needed.
- UI display of an instance: the MiroirTest report renders the instance through the generic Jzod editor, driven by the Entity schema, so the new node is displayed without code. The results grid is built from tracker paths.
- CLI (`testMiroir`, `parseMiroirTestCliConfig.ts`): selection by instance `name`. The name `JzodElementEditor_ComponentTestSuite` disappears, and the 7 new names become selectable. No code change.

### 3.4 How the instances are loaded

- vitest entry `miroir-component-tests.unit.test.tsx`: reads the `miroir_data/a311f363-…` folder, keeps the file whose `uuid` is `componentTestSuiteInstanceUuid` (L46-59), and opens one `describe(<sub-suite>)` per child (L100-120). Entry check: `IS_REACT_ACT_ENVIRONMENT` is false (L93-97).
- miroir-core generic entry: `loadApplicationMiroirTestsFromFolders.ts` L124 keeps every file that `isMiroirTestSuiteInstance` accepts, so it will load the 7 instances.
- The app: the MiroirTest list comes from the `LocalCache`, filled from the Miroir deployment's filesystem data section, read with `readdirSync` on each call (#286 plan, Slice 0.3 Realization). A new JSON file in `miroir_data/a311f363-…/` appears after a page reload. The named export (`index.ts`), the `index.d.ts` declaration, and the `defaultMiroirMetaModel.tests` entry (`src/Model.ts`) are needed for TypeScript imports and for `modelValidation`.
- `modelValidation.unit.test.ts` (deployment-miroir) validates each `defaultMiroirMetaModel.tests` instance with `jzodTypeCheck` against the **EntityVersion** `mlSchema` (`ModelValidationTools.ts` L92-98, L118-140, L159-180). So the EntityVersion `51c647fe-…` needs the same edit as the Entity (dual write), as in #286. The #286 phase0 test also asserts that both `miroirTestLeaf` members are equal (`componentMiroirTests.286.phase0.unit.test.tsx`).

With 7 instances: the entry loads every instance that has a `reactComponentTest` leaf and opens one `describe` per child (`reactComponentTestSuite` or legacy sub-suite). The app list shows 7 rows, each with its Run button. "Run All Unit Tests" runs them in one sandbox. Package wiring: 7 exports, 7 declarations, 7 `tests` entries.

### 3.5 The extractor defect (D4)

`ThemedSelectWithPortal` in filterable mode renders an `input role="combobox"` whose value is `isOpen ? filterText : displayText` (`FormComponents.tsx` L668). `displayText` is the label of the selected option (L391-392). Opening the list does not change `filterText` (`''`). A hidden state tracker next to the input carries `data-test-is-open`, `data-test-filter-text`, and `data-test-selected-value={value}` (L685-699). The option list is portaled with `aria-label={props.name + '-option-' + option.value}` (L701-744, L708).

The `JzodEnumEditor.tsx` component passes `name={formikRootLessListKey}`, i.e. `TESTSECTION.testField` (L519-543). `extractValuesFromRenderedElements` (`componentTestTools.tsx` L839-1815) reads that input in its `input[name]` branch (L1021-1034, L1319-1359): `value = input.value`, or `defaultValue` when empty (L1343-1346). React keeps `defaultValue` equal to the controlled value, so both are `""` while the list is open. The field is read as `""`. The combobox branch (L1374-1547) then skips it, since `values[name] !== undefined` (L1526). The tracker is consulted only for `select[data-testid="miroirInput"]` elements (L1243-1316), never for a combobox input.

Root cause: while the list is open, the input shows the filter text, and the extractor reads the input, not the committed value. The case works around it by copying `valuesInitial.testField` when the after-click value is falsy (`componentTests/jzodElementEditor/JzodEnumEditor.tsx` L102-107).

Fix (§5.5): for an `input[role="combobox"]` whose state tracker `[data-testid="themed-select-state-<name>"]` is in the search roots with `data-test-is-open="true"`, the value is the tracker's `data-test-selected-value`. A closed combobox keeps today's reading (display text), so no other read changes.

Consequence for Enum case 3 "form state is changed when selection changes": it opens the list, types `value3`, and does **not** press Enter (`componentTests/jzodElementEditor/JzodEnumEditor.tsx` L122-137). Today it asserts `testField: "value3"` (L148-151), which is the filter text: the form value is still `value2`. With the fix, that read gives `value2`. This is open point P1 (§8).

### 3.6 Case inventory (68 cases)

Notation. **Props**: what the case adds to the suite defaults. **Acts/waits**: actions in order; `W` = `waitAfterUserInteraction`, `wf(t)` = explicit `waitFor` with timeout `t` ms. **Asserts**: `ERV(step, lbl, filter)` = `extractValuesFromRenderedElements` with extractor `label` argument `lbl` (`S` = `testSectionName`, `F` = `formikFieldName("testField")`), then `formValuesToJSON` and `toEqual`. **DSL**: the steps of §5.4 (`ERV` = `expectRenderedValues`, `EE` = `expectElement`). Case files are under `src/miroir-fwk/4-tests/componentTests/jzodElementEditor/`.

Every suite has the same page label and no `applicationDeploymentMap`. Common props: `label: "Test Label"`, `name: "testField"`, `listKey: "ROOT.testField"`, `rootLessListKey: "testField"`, `rootLessListKeyArray: ["testField"]`. Suites Object, SimpleType, Union, and Any have no suite props in the old file (each case gives full props, `suiteProps` is unused); their JSON suite defaults are the common props (plus `rawJzodSchema: {type: "any"}` for Any), and each leaf adds `rawJzodSchema` and `initialFormState`.

**JzodEnumEditor** (`JzodEnumEditor.tsx`, suite props L40-51: enum `value1..3`, initial `value2`)

| # | Case (line) | Acts/waits | Asserts | DSL |
|---|---|---|---|---|
| 1 | renders select with correct value (L53) | — | ERV("initial", S), portal, detect false = `{testField:"value2"}` | ERV |
| 2 | renders all enum options (L73) | click combobox, `wf(1000)` is-open true | ERV("initial", S) = `{testField:"value2"}`; ERV("after click", S, detect true) merged with initial (workaround L102-107) = `{testField:"value2", "TESTSECTION.options":[3]}` | ERV, openSelect, ERV with `$options` |
| 3 | form state is changed when selection changes (L114) | click, wf(1000) open; user.clear + user.type "value3"; wf(1000) filter-text | `select.value` = "value2"; ERV("after selection change", S) = `{testField:"value3", "TESTSECTION.options":["value3"]}` | EE value, openSelect, filterSelect, ERV (P1) |

**JzodLiteralEditor** (`JzodLiteralEditor.tsx`, suite props L36-43, listKey `root.testField`, initial `test-value`; schema added by `withLiteralSchema`, L27-32)

| # | Case (line) | Props | Acts/waits | Asserts | DSL |
|---|---|---|---|---|---|
| 1 | with label (L46) | function form: suite + literal schema | — | `getAllByText(/Test Label/).length` = 1; textbox in document | EE count, EE present |
| 2 | without label (L54) | object form: no label | — | `queryByLabelText(/Test Label/)` not in document; textbox in document | EE present false, EE present |
| 3 | setting new value (L68) | function form | change input "new value"; W | `getByDisplayValue("test-value")` in document, before and after (`/test-value/`) | EE, change, EE |

**JzodSimpleTypeEditor** (`JzodSimpleTypeEditor.tsx`; helpers L38-63)

| # | Case (line) | Props | Acts/waits | Asserts | DSL |
|---|---|---|---|---|---|
| 1 | string renders (L74) | string, "placeholder text" | — | textbox name `TESTSECTION.testField` in document, value | EE present+value |
| 2 | string modify (L88) | same | change "new text"; W | value before, after | EE, change, EE |
| 3 | string modify then submit (L107) | same | change; W; submit `getByRole("form")` | as 2 | EE, change, EE, submit |
| 4 | number renders (L131) | number, 42 | — | `getAllByDisplayValue(42)` with id `testField`: in document, value 42 | EE (byDisplayValue + id) |
| 5 | number modify (L146) | same | change 100; W | 42, then 100 | EE, change, EE |
| 6 | uuid renders (L165) | uuid | — | textbox value | EE |
| 7 | uuid modify (L180) | uuid | change; W | before, after | EE, change, EE |
| 8 | boolean true (L201) | boolean, true | — | ERV("initial", F, then `formValuesToJSON(values, S)`) = `{testField:true}` | ERV (no field) |
| 9 | boolean false (L216) | boolean, false | — | same, `false` | ERV |
| 10 | boolean modify (L231) | boolean, true | click checkbox; W | checkbox name `TESTSECTION.testField` checked, then not; ERV("after change") = `{testField:false}` | EE checked, click, EE, ERV |
| 11 | bigint renders (L258) | bigint, `BigInt("12345678901234567890")` | — | textbox value `"12345678901234567890"` | EE (`$bigint` prop) |
| 12 | bigint modify (L272) | bigint, `12345678901234567890n` | change `98765432109876543210n`; W | before, after as strings | EE, change, EE |

**JzodArrayEditor** (`JzodArrayEditor.tsx`, suite props L40-51: array of string, `["value1","value2","value3"]`; helper `arrayItemTextBoxValues` L29-36 = textbox values whose name starts with `TESTSECTION.testField.`, in DOM order)

| # | Case (line) | Props | Acts/waits | Asserts | DSL |
|---|---|---|---|---|---|
| 1 | label (L53) | — | — | `getAllByText(/Test Label/).length` = 1 | EE count |
| 2 | values in order (L60) | — | — | item textbox values in DOM order | EE values |
| 3 | form state changed (L65) | — | change item 1 "new value"; W | `cell` toContainHTML "new value" | change saveAs, EE containsHtml |
| 4 | 1.up (L80) | — | click `getAllByRole("TESTSECTION.testField.button.up")[1]` (no wait) | DOM order `v2,v1,v3` | clickArrayButton up 1, EE values |
| 5 | 2.up (L89) | — | up[2] | `v1,v3,v2` | same |
| 6 | 0.down (L98) | — | down[0] | `v2,v1,v3` | clickArrayButton down 0, EE values |
| 7 | heteronomous union down (L107) | union array schema, 3 objects | down[0]; W | ERV("before up button click", F) and ERV("after up button click", F) | ERV, clickArrayButton, ERV |
| 8 | tuple (L185) | tuple schema, `["value1",2]` | — | ERV("initial", F) | ERV |
| 9 | tuple in array (L211) | array of tuple | — | ERV("initial", F) | ERV |
| 10 | add string (L244) | — | click button `testField.add`; W | ERV("after add button click", F) = `[…,""]` | clickArrayButton add, ERV |
| 11 | add object (L263) | array of object | add; W | ERV = 3 objects, third `{b:{c:0}, d:false}` | same |
| 12 | duplicate item 1 (L327) | — | click `TESTSECTION.testField.1-duplicateArrayItem`; W | button truthy; ERV("after duplicate button click", F) | clickArrayButton duplicate 1, ERV |

**JzodObjectEditor** (`JzodObjectEditor.tsx`; `recordOfObjectSchema` L37-43; `testFieldValues` L46-54 = extractor with label F)

| # | Case (line) | Props | Acts/waits | Asserts | DSL |
|---|---|---|---|---|---|
| 1 | object renders (L71) | `{a:string, b:number}`, `{a:"test string", b:42}` | — | ERV("after delete button click", F) | ERV |
| 2 | bigint attribute (L89) | `{e: bigint}`, `{e: 123n}` | — | ERV("initial", F) = `{e:"123"}` | ERV (`$bigint` prop) |
| 3 | update through inputs (L106) | as 1 | change a, change b (one act); W | `getAllByTestId("miroirInput")` by name: toHaveValue before; ERV("after change", F) | EE ×2 saveAs, change ×2, ERV |
| 4 | add optional attribute (L144) | a?, b, c?; `{b:42}` | click `…addObjectOptionalAttribute.a`; W | ERV("after add button click", F) = `{a:"", b:42}` | clickObjectButton addOptionalAttribute a, ERV |
| 5 | delete only optional (L178) | a?, b?; `{a}` | click `….a-removeOptionalAttributeOrRecordEntry`; W | ERV = `{}` | clickObjectButton remove a, ERV |
| 6 | delete second of 3 (L208) | a?, b?, c? | remove b; W | ERV = `{a, c:true}` | same |
| 7 | record renders (L244) | record, firstRecord | — | raw extractor values = `{"firstRecord.a", "firstRecord.b"}` (flat) | ERV (nested form, §3.7) |
| 8 | record add (L263) | record | click `…addRecordAttribute`; W | ERV = + `newRecordEntry {a:"", b:0}` | clickObjectButton addRecordEntry, ERV |
| 9 | record rename (L297) | record | change name input "renamedRecord"; blur; W | name textbox in document, value before; same element value after; ERV("after rename") | EE saveAs, renameRecordEntry, EE ref, ERV |
| 10 | record 1 entry delete (L333) | record | remove firstRecord (no wait) | button in document; ERV = `{}` | EE, clickObjectButton remove, ERV |
| 11 | record 3 items delete 2nd (L357) | record ×3 | remove secondRecord (no wait) | button; ERV | same |
| 12 | record duplicate (L399) | record | click `….firstRecord-duplicateRecordEntry`; W | button; ERV = + `firstRecord_copy` | EE, clickObjectButton duplicate, ERV |
| 13 | record duplicate, no collision (L427) | record with `_copy` | duplicate; W | ERV = + `firstRecord_copy1` | same |
| 14 | createObject rename (L461) | schemaReference `coreTransformerForBuildPlusRuntime` | change `…definition.newRecordEntry-NAME`; blur; W | value before/after; `formValuesToJSON(values).definition` | EE saveAs, renameRecordEntry, EE ref, ERV with `path: ["definition"]` |

**JzodUnionEditor** (`JzodUnionEditor.tsx`; schemas L38-51)

| # | Case (line) | Props | Acts/waits | Asserts | DSL |
|---|---|---|---|---|---|
| 1 | simple types (L65) | string\|number, 42 | — | ERV("initial form state", S, filter `[]`) = `{testField:42}` | ERV filter [] |
| 2 | simple or object, simple value (L83) | string\|number\|object, 42 | — | same | ERV filter [] |
| 3 | simple or object, object value (L101) | same, `{a,b}` | — | ERV("initial form state", F, filter `[]`) | ERV field, filter [] |
| 4 | discriminated objects (L122) | discriminator `testObjectType` | one act: click select, wf(1000) open, clear, type "type2", wf(1000) filter + count 1, Enter, wf(2000) closed + selected; then wf(5000) text "type2Attribute" | ERV("initial form state", F, portal); raw values equal; `select.value`; tracker selected "type1", open "false"; ERV("after change to type2", F) | ERV, EE value, EE attribute ×2, selectOption, EE present timeout, ERV |
| 5 | number → string (L253) | string\|number, 42 | click star (act); same select sequence on the union type input; wf(3000) input gone; wf(3000) values | star truthy; union input null; tracker selected "number"; ERV("after change to string", S, filter `[]`) inside wf(3000) | EE, EE absent, toggleUnionTypeSelector, EE attribute, selectOption unionType, EE absent timeout, ERV timeout |
| 6 | number → object (L347) | 3-member union, 42 | as 5 with "object"; wf(5000) text "a"; wf(3000) input gone | ERV("after change to object", F) = `{a:"", b:0}` | as 5 plus EE text |
| 7 | star visible, selector hidden (L446) | 42 | — | star truthy; union input null | EE, EE absent |
| 8 | star toggle (L459) | 42 | click star, wf(1000) input present; click star, wf(1000) input absent | presence | toggle ×2, EE ×2 |
| 9 | selector above object value (L491) | object value | click star; wf(1000) input present | `starParent.contains(selectorInput)` | EE saveAs star, toggle, EE saveAs selector, EE parentContains |

**JzodAnyEditor** (`JzodAnyEditor.tsx`; `switchAnyType` L49-105, `waitForAnyValue` L111-134 = ERV in wf(3000), `testFieldValues` L137-146 = ERV label F)

| # | Case (line) | Props | Acts/waits | Asserts | DSL |
|---|---|---|---|---|---|
| 1 | star visible (L153) | "hello" | — | star truthy, union input null | EE, EE absent |
| 2 | star toggle (L161) | 42 | as Union 8 | presence | toggle ×2, EE ×2 |
| 3 | number → string (L189) | 42 | switchAnyType("string", "number") | tracker "number"; ERV("after change to string", S, `[]`) wf(3000) = `{testField:""}` | EE, toggle, EE attribute, selectOption unionType, ERV timeout |
| 4 | object star in header (L197) | `{a:"hello", b:1}` | as Union 9 | parent contains | as Union 9 |
| 5 | object string attribute (L220) | `{a:"hello"}` | — | textbox name `…testField.a` truthy, value "hello" | EE fieldName |
| 6 | object number attribute (L230) | `{b:1}` | — | textbox name `…testField.b`, value 1 | EE fieldName |
| 7 | number → object (L240) | 42 | switch "record", initial "number" | ERV("after change to record", F) wf(3000) = `{a:"enter attributes here..."}` | as 3 with field |
| 8 | object → string (L249) | `{a, b}` | switch "string" | `{testField:""}` | as 3, no initial check |
| 9 | object → array (L256) | `{a}` | switch "array" | ERV F = `["enter elements here..."]` | as 7 |
| 10 | array → string (L265) | `["item1","item2"]` | switch "string", initial "array" | `{testField:""}` | as 3 |
| 11 | array add (L272) | 2 items | click `testField.add`; W | ERV("after add button click", F) | clickArrayButton add, ERV |
| 12 | array remove (L283) | 3 items | click `….1-removeArrayItem`; W | button truthy; ERV | clickArrayButton delete 1, ERV |
| 13 | array duplicate (L297) | 3 items | duplicate 1; W | ERV | clickArrayButton duplicate 1, ERV |
| 14 | object add attribute (L316) | `{a:"hello"}` | click `…addRecordAttribute`; W | ERV = `{newRecordEntry:"", a:"hello"}` | clickObjectButton addRecordEntry, ERV |
| 15 | record remove (L332) | `{a, b}` | remove a; W | button truthy; ERV = `{b:"world"}` | clickObjectButton remove a, ERV |

Totals: 22 extractor calls, 57 `env.act` calls. Every case is expressible with the vocabulary of §5.4, without `custom`.

### 3.7 From flat extractor keys to `expectedValue`

- **Label.** The extractor strips `^<label>\.` from names (L869-870). With `S`, keys are `testField`, `testField.0`, …; with `F`, `0`, `a`, `firstRecord.a`, …. A name equal to the label itself is not stripped: SimpleType boolean cases read key `TESTSECTION.testField` with label F and recover it with `formValuesToJSON(values, S)` (`JzodSimpleTypeEditor.tsx` L54-63). T7 keeps the label of every call except these 3 cases (8, 9, 10), which use no `field` (label S). Both reads give `{testField: <bool>}`.
- **Nesting.** `formValuesToJSON` (L1818-1864) splits keys on `.`, makes numeric segments array indexes, and makes the root an array when the first key's first segment is numeric (L1826-1833). Array cases with label F therefore give arrays, as today. Object case 7 compares flat keys `{"firstRecord.a","firstRecord.b"}` (L257-260); its nested form `{firstRecord: {a, b}}` is the same information.
- **Options.** The option list key is `<label>.options` (L1662) from `[role="option"]` whose `aria-label` starts with the label, and `<field>.options` from `checkForComboboxOptions` when `detectOptions` is true (L956, L981, L1010). The first ignores `detectOptions`. Neither names the combobox. In Enum cases 2 and 3 the key is `TESTSECTION.options` (`formikFieldName("options")`), because the combobox branch is skipped (§3.5). Kept as a flat key, `formValuesToJSON` would turn it into `{TESTSECTION: {options: […]}}`. T8 moves it to `$options.testField`.
- **bigint.** Results never hold a bigint: the extractor reads strings (Object case 2 expects `{e: "123"}`), and `formValuesToJSON` no longer converts `e` (commented out at L1841-1846). Only props need T9.
- **`undefined`.** `formValuesToJSON` never produces `undefined`. The throwing `toEqual` ignores `undefined`-valued keys (#286 Slice 3).
- **Cleanup rule.** The extractor deletes a dot-free key (other than `testField`) when another key ends with `.<key>` (L1791-1809). None of the 22 current reads is affected, and T7 keeps their labels.
- **Step label.** The extractor's `step` argument changes which HTML `<option>` elements it reads (`isAfterDropdownOpeningInteraction`, L1701-1716). `expectRenderedValues.label` is passed as `step`, so the JSON keeps the old step labels ("initial", "after click", …).

### 3.8 Schema build chain

1. Edit the Entity `miroir_model/16dbfe28-…/a311f363-….json` (generator input) and the EntityVersion `miroir_modelVersion/54b9c72f-…/51c647fe-….json` (read by `modelValidation`).
2. `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` regenerates `preprocessor-generated/miroirFundamentalJzodSchema.ts` and `miroirFundamentalType.ts` (never edited by hand).
3. Export the new types from miroir-core `index.ts` next to L472-473.
4. `npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts` validates the instances listed in `defaultMiroirMetaModel.tests`.

Style reference for the step union: `miroirTestForFunctionCall.assertions` (Entity L480-502), an array of objects with a `label`, optional attributes, and `expectedValue: any`; `miroirTestLeaf` (L222-263) for a union discriminated by a key.

---

## 4. Gaps

| # | Gap | Where |
|---|---|---|
| G1 | No schema for a component suite node, steps, targets, or leaf props | Entity L108-…, EntityVersion L104-… |
| G2 | The walk treats any non-`miroirTestSuite` node as a leaf, and 3 more predicates recurse only into `miroirTestSuite` | §3.3 |
| G3 | The runner gets only `componentTestRef` and `testNamePath`; no suite context reaches it | `miroirTestTypes.ts` L19-22, `ReactComponentTestTools.ts` L69-72 |
| G4 | No step interpreter, no target resolution, no component registry, no custom-step registry | app `componentTests/` |
| G5 | The extractor reads the filter text of an open combobox | §3.5 |
| G6 | Option list keys do not name their field | §3.7 |
| G7 | JSON props cannot hold bigint, functions, or a removed key | §3.6 (T9, T14) |
| G8 | One generated instance; the generator writes it from the manifest | §3.2, §3.4 |
| G9 | The vitest entry, the consistency test, 4 #286 app tests, 2 #286 core tests, and the bundle guard depend on the manifest, the registry, `761d4ed2` as a 7-editor instance, or `JzodArrayEditor.tsx` | §3.2 |
| G10 | Step failures have no step index, kind, or label | D11 |
| G11 | Docs and nonreg name `JzodElementEditor_ComponentTestSuite`, the generator, and the manifest | §3.2 |

---

## 5. Design

### 5.1 Schema (G1)

New context entries in the MiroirTest Entity and EntityVersion (same text in both):

- `reactComponentTestSuite`: object, `miroirTestType` literal `reactComponentTestSuite`, `miroirTestLabel` string, `skip?` boolean, `component` string, `componentProps?` record of `any`, `miroirTests` array of `miroirTestForReactComponent`. Tag `defaultLabel` "React component test suite", `displayedAttributeValueWhenFolded` `miroirTestLabel`.
- `miroirTestSuite.miroirTests` union: a third member, schemaReference `reactComponentTestSuite`.
- `miroirTestForReactComponent`: `componentProps?` record of `any`, `steps?` array of `reactComponentTestStep`, `componentTestRef` becomes optional. M1 removes `componentTestRef` and makes `steps` required.
- `reactComponentTestTextMatch`: union of string, number, and object `{ regex: string, flags?: string }`.
- `reactComponentTestTarget`: object with optional `byRole` string, `name` text match, `byTestId` string, `byText`, `byDisplayValue`, `byLabelText` text matches, `widget` enum (`combobox`, `selectState`, `unionTypeStar`, `unionTypeInput`, `recordEntryName`, `arrayButton`, `objectButton`), `field` string, `select` enum (`value`, `unionType`), `entry` string, `action` string, `attribute` string, `ref` string, and refinements `fieldName` string, `fieldNamePrefix` string, `id` string, `index` number. "Exactly one locator" is checked by the interpreter.
- `reactComponentTestStep`: union discriminated by `step`, members listed in §5.4, each with an optional `label` string.

Run the §3.8 chain. Export `ReactComponentTestSuite`, `ReactComponentTestStep`, `ReactComponentTestTarget` (types and Zod schemas) from miroir-core `index.ts`.

### 5.2 Walk and predicates (G2, G3)

- `miroirTestSuiteWalk.ts`: a `reactComponentTestSuite` child is walked like a nested suite (L122-169: same tracking, filter, `parentSkip`, vitest registration). The walk of a `reactComponentTestSuite` builds `ReactComponentTestSuiteContext { suitePath, component, componentProps, caseLabels }` and passes it to each leaf. `RunMiroirTestSuiteWalkParams.miroirTestSuite` and the suite parameter of `_runMiroirTestSuite` / `_runMiroirTestSuiteWithTracking` accept `MiroirTestSuite | ReactComponentTestSuite`.
- `runMiroirTest`, `_runMiroirTest`, `_runMiroirTestWithTracking`: new trailing optional parameter `reactComponentTestSuite?: ReactComponentTestSuiteContext`, passed to `runMiroirReactComponentTest`.
- `miroirTestTypes.ts`: `ReactComponentTestSuiteContext`, and `ReactComponentTestRunner = (params: { testNamePath: string[]; leaf: MiroirTestForReactComponent; suite?: ReactComponentTestSuiteContext }) => Promise<ReactComponentTestRunnerResult>`. M1 makes `suite` required.
- `walkMiroirTestLeaves` (`inferIntegrationSessionKind.ts` L21) and `miroirTestDefinitionHasReactComponentTest` (`miroirTestSuiteUiExecution.ts` L144) recurse into the new node. `testSuites` (`TestTools.ts` L969-981) treats it as a leaf-holding suite. The two helpers of the vitest entry and the consistency test recurse into it.
- Unchanged: filters, `excludeMiroirTestTypes`, `rethrowComponentTestFailures`, the no-runner skip, the catalog, the CLI.

Cost of the alternative (optional `reactComponent: {component, componentProps}` on `miroirTestSuite`): no predicate change, the same context propagation, a weaker type (a suite may mix component leaves with other leaves). The difference is the 4 predicate edits above plus the two test helpers. D5 stands (T2).

### 5.3 Runner and interpreter in the app (G3, G4, G10)

New files in `src/miroir-fwk/4-tests/componentTests/`:

| File | Content |
|---|---|
| `componentRegistry.ts` | `Record<string, React.FC<any>>`, `JzodElementEditor` only (T13) |
| `componentTestTargets.ts` | target resolution (T6), widget name mapping (§5.4), `$bigint` revival (T9) |
| `runComponentTestSteps.ts` | the interpreter: one handler per step kind, the post-action wait, aliases (T11), error form (T10) |
| `customStepRegistry.ts` | `Record<string, (env, params, context) => Promise<void>>`, deleted at M2 |

`runReactComponentTest.tsx`: for a leaf with `steps`, the component is `componentRegistry[suite.component]`, the props are `revive({...suite.componentProps, ...leaf.componentProps})`, the wrapper is keyed by `suite.suitePath` and destroyed after `suite.caseLabels.at(-1)` (T4), and the body is `runComponentTestSteps(env, leaf.steps)`. A leaf with `componentTestRef` keeps the legacy path until M1. An unknown component name is an `error` result. A leaf with both or neither of `steps` and `componentTestRef` is an `error` result.

Interpreter rules:

- Before the first step, the runner has already awaited `waitForProgressiveRendering(container)` (L159).
- After each action step (DOM primitives and widget steps), it awaits `componentTestAct` then `waitAfterUserInteraction(container)` (D9).
- A failure (thrown `MiroirAssertionError`, Testing Library error, timeout) becomes `step <n> (<kind>[ "<label>"]): <message>`.
- `context.lastValues` holds the last `expectRenderedValues` actual value, for `custom` steps.

### 5.4 Step vocabulary (G4)

Field mapping: `F(field) = formikFieldName(field) = "TESTSECTION." + field`.

| Widget target | Element |
|---|---|
| `{widget:"combobox", field, select?:"value"}` | `input[role="combobox"][name="F(field)"]` |
| `{widget:"combobox", field, select:"unionType"}` | `[data-testid="union-type-input-F(field)"]` (`JzodElementEditor.tsx` L873) |
| `{widget:"selectState", field, select?}` | `[data-testid="themed-select-state-F(field)"]`, or `themed-select-state-union-type-F(field)` (`FormComponents.tsx` L687, `JzodElementEditor.tsx` L872) |
| `{widget:"unionTypeStar", field}` | `[data-testid="union-type-star-F(field)"]` (`JzodElementEditor.tsx` L860) |
| `{widget:"unionTypeInput", field}` | same as the `unionType` combobox |
| `{widget:"recordEntryName", field, entry}` | textbox named `F(field.entry)-NAME` (`JzodObjectEditor.tsx` L144-145) |
| `{widget:"arrayButton", field, action:"up"\|"down", index}` | `getAllByRole("F(field).button.up\|down")[index]` (`JzodArrayEditor.tsx` L138) |
| `{widget:"arrayButton", field, action:"add"}` | button named `field.add`, without `TESTSECTION.` (`JzodArrayEditor.tsx` L895) |
| `{widget:"arrayButton", field, action:"duplicate"\|"delete", index}` | button named `F(field.index)-duplicateArrayItem` / `-removeArrayItem` (L266, L277) |
| `{widget:"objectButton", field, action:"addOptionalAttribute", attribute}` | button named `F(field).addObjectOptionalAttribute.<attribute>` (`JzodObjectEditor.tsx` L1488) |
| `{widget:"objectButton", field, action:"addRecordEntry"}` | button named `F(field).addRecordAttribute` (L1465-1466) |
| `{widget:"objectButton", field, action:"remove"\|"duplicate", attribute}` | button named `F(field.attribute)-removeOptionalAttributeOrRecordEntry` / `-duplicateRecordEntry` (L446-447, L457) |

Target resolution: queries run on `env.view` (the sandbox element: the case container and the portal element). With no refinement and no `index`, exactly one match is required (`getBy` semantics). With refinements, the `queryAll` result is filtered (`fieldName`: `name === F(x)`; `fieldNamePrefix`: `name` starts with `F(x)`; `id`: `id === x`), then `index` (default 0) picks one. `expectElement {present:false}` and `count` use the full filtered list.

Steps (each has an optional `label`):

| Kind | JSON | Semantics |
|---|---|---|
| `click` | `{step, target, saveAs?}` | `componentTestFireEvent.click` |
| `change` | `{step, target, value, saveAs?}` | `fireEvent.change(el, {target: {value}})`; `value` string, number, or boolean |
| `blur` | `{step, target}` | `componentTestFireEvent.blur` (focusout + blur) |
| `submit` | `{step, target}` | `fireEvent.submit` |
| `type` | `{step, target, text}` | `userEvent.setup().type` |
| `clear` | `{step, target}` | `userEvent.setup().clear` |
| `keyboard` | `{step, keys}` | `userEvent.setup().keyboard` |
| `waitForAttribute` | `{step, target, attribute, value, timeout?}` | `waitFor` until the attribute equals `value` (default 1000 ms) |
| `openSelect` | `{step, field, select?}` | click the combobox; wait until its state has `data-test-is-open="true"` (1000 ms) |
| `filterSelect` | `{step, field, text, select?}` | `clear` + `type text` on the combobox; wait until `data-test-filter-text` equals `text` (1000 ms) |
| `selectOption` | `{step, field, option, select?}` | open if closed (as `openSelect`), clear, type `option`, wait filter text and `data-test-filtered-options-count="1"` (1000 ms), Enter, wait `data-test-is-open="false"` and `data-test-selected-value=option` (2000 ms) |
| `toggleUnionTypeSelector` | `{step, field}` | click the star; wait until the union type input presence has flipped (1000 ms) |
| `clickArrayButton` | `{step, field, action, index?}` | click the `arrayButton` target |
| `clickObjectButton` | `{step, field, action, attribute?}` | click the `objectButton` target |
| `renameRecordEntry` | `{step, field, entry, newName}` | `change` the `recordEntryName` input to `newName`, then `blur` |
| `expectRenderedValues` | `{step, label, field?, path?, filter?, detectOptions?, timeout?, expectedValue}` | extractor with `env.expect`, `filter`, `env.container`, label `field ? F(field) : testSectionName`, step `label`, `detectOptions`, `env.portalElement`; drop array-valued entries; `formValuesToJSON`; select `path`; add `$options` (T8); log; throwing `toEqual`. With `timeout`, retried with `waitFor` |
| `expectElement` | `{step, target, present?, count?, value?, values?, checked?, containsHtml?, attribute?:{name,value}, parentContains?, timeout?, saveAs?}` | `present` (default true) → found / not found; `count` → number of matches; `value` → `toHaveValue`; `values` → `value` of every match in DOM order; `checked` → `toBeChecked` / `.not`; `containsHtml` → `toContainHTML`; `attribute` → `getAttribute` equals; `parentContains` → `el.parentElement.contains(<target>)`. With `timeout`, retried with `waitFor` |
| `custom` | `{step, function, params?}` | `customStepRegistry[function](env, params, context)`; removed at M2 |

The Enum suite with this vocabulary (P1 option (a), §8):

```json
{
  "miroirTestType": "reactComponentTestSuite",
  "miroirTestLabel": "JzodEnumEditor",
  "component": "JzodElementEditor",
  "componentProps": { "label": "Test Label", "name": "testField", "listKey": "ROOT.testField", "rootLessListKey": "testField", "rootLessListKeyArray": ["testField"], "rawJzodSchema": { "type": "enum", "definition": ["value1", "value2", "value3"] }, "initialFormState": "value2" },
  "miroirTests": [
    { "miroirTestType": "reactComponentTest", "miroirTestLabel": "JzodEnumEditor: renders select with correct value",
      "steps": [ { "step": "expectRenderedValues", "label": "initial", "expectedValue": { "testField": "value2" } } ] },
    { "miroirTestType": "reactComponentTest", "miroirTestLabel": "JzodEnumEditor: renders all enum options",
      "steps": [
        { "step": "expectRenderedValues", "label": "initial", "expectedValue": { "testField": "value2" } },
        { "step": "openSelect", "field": "testField" },
        { "step": "expectRenderedValues", "label": "after click", "detectOptions": true,
          "expectedValue": { "testField": "value2", "$options": { "testField": ["value1", "value2", "value3"] } } } ] },
    { "miroirTestType": "reactComponentTest", "miroirTestLabel": "JzodEnumEditor: form state is changed when selection changes",
      "steps": [
        { "step": "expectElement", "target": { "widget": "combobox", "field": "testField" }, "value": "value2" },
        { "step": "openSelect", "field": "testField" },
        { "step": "filterSelect", "field": "testField", "text": "value3" },
        { "step": "expectRenderedValues", "label": "after selection change",
          "expectedValue": { "testField": "value2", "$options": { "testField": ["value3"] } } },
        { "step": "keyboard", "keys": "{Enter}" },
        { "step": "waitForAttribute", "target": { "widget": "selectState", "field": "testField" }, "attribute": "data-test-selected-value", "value": "value3" },
        { "step": "expectRenderedValues", "label": "after selection commit", "expectedValue": { "testField": "value3" } } ] }
  ]
}
```

### 5.5 Extractor fix (G5)

In `extractValuesFromRenderedElements`, a helper `comboboxCommittedValue(input)` returns the tracker's `data-test-selected-value` when `input` has `role="combobox"`, a `name`, and a tracker `[data-testid="themed-select-state-<name>"]` in the search roots with `data-test-is-open="true"`. The `miroirInput`, `input[name]`, and combobox branches use it before `input.value`. A closed combobox reads as today. The tests-side wrapper in `JzodElementEditorTestTools.tsx` gets the change through its delegation, so the 14 importers get it too; their only open-combobox reads are in the component suites (§6 K3).

### 5.6 Instances and wiring (G8)

| Instance `name` (= root label) | uuid | Child label |
|---|---|---|
| `JzodEnumEditor_ComponentTestSuite` | `761d4ed2-1a5c-4901-a9d9-897dbec0b27f` (reused) | `JzodEnumEditor` |
| `JzodArrayEditor_ComponentTestSuite` | `1b71d68b-7dc9-468c-a251-4fa7889f20f4` | `JzodArrayEditor` |
| `JzodLiteralEditor_ComponentTestSuite` | `3995a071-b8ae-48d3-a488-6d1fc828b725` | `JzodLiteralEditor` |
| `JzodObjectEditor_ComponentTestSuite` | `da353085-c62b-4aa6-bd54-8813d303dfe5` | `JzodObjectEditor` |
| `JzodSimpleTypeEditor_ComponentTestSuite` | `590693b6-2125-43fc-89d7-1330ae8318db` | `JzodSimpleTypeEditor` |
| `JzodUnionEditor_ComponentTestSuite` | `de517cd6-31a8-46d2-ac09-3a5162b630a7` | `JzodUnionEditor` |
| `JzodAnyEditor_ComponentTestSuite` | `ec601bcc-a27d-450d-9c37-bdd6a12a1575` | `JzodAnyEditor` |

Top-level keys as in `761d4ed2` today (`uuid`, `parentName`, `parentUuid`, `name`, `selfApplication`, `branch`, `description`, `definition`), 2-space JSON, CRLF. Leaf labels stay `<editor>: <case>` (D13). Wiring per instance: export `miroirTest_<name>` in `index.ts`, `export declare const miroirTest_<name>: any;` in `index.d.ts`, import and `tests` entry in `src/Model.ts`. `miroirTest_JzodElementEditor_ComponentTestSuite` is removed.

### 5.7 Tests that change (G9)

- `miroir-component-tests.unit.test.tsx`: loads every instance of the folder with a `reactComponentTest` leaf, and opens `describe(<child label>)` for each child. New entry check: 7 instances, 68 leaves. vitest names unchanged.
- `componentMiroirTests.consistency.unit.test.ts`: rewritten. It `jzodTypeCheck`s every component instance against the Entity `mlSchema` and the EntityVersion `mlSchema`, checks unique leaf labels prefixed by the child label, and, until M1, that legacy leaves equal the manifest and the registry.
- #286 app tests: phase4 sandbox uses the Array instance (no sibling filter needed); its failing-case test edits a loaded leaf's steps once Array is migrated. phase6 Run all narrows to the 7 instances and reads the expected labels from their JSON. runLock uses the new runner params, then (M1) a fake component registry and steps. Bundle guard L145 names `componentTests/runComponentTestSteps` after M1.
- #286 core tests: phase2 and phase6 build leaves and fake runners with the new params.

### 5.8 Docs and nonreg (G11)

`docs/reference/testing.md` (leaf table row L116 plus a `reactComponentTestSuite` row, L144, L760, the section L771-808 rewritten: 7 instances, the step vocabulary, how to add a case in JSON, the removed "known limit"), `docs/contributing/testing.md` L176-193, `docs/guides/developer/testing.md` L160, #286 analysis §1 row "Declarative JSON steps" pointing to #292. Nonreg: `appstack-miroir-component-tests` keeps its commands. `unit-286-react-component-miroir-tests` keeps its list (tests adapted). New `unit-292-declarative-react-component-tests` runs the #292 issue tests.

---

## 6. Risks and open points

| # | Risk | Mitigation |
|---|---|---|
| K1 | The post-action wait (300 ms per action, D9) slows the entry. The cases have about 90 actions, so about 27 s more than the #286 run | Measured in Slice 2 and each migration slice. If the entry exceeds twice the Slice 0 time, see P2 (§8) |
| K2 | A uniform post-action wait changes an outcome where the old case asserted with no wait (Array up/down, Object record deletes) | Only more settling; each slice compares case lists and statuses with the Slice 0 baseline |
| K3 | The extractor fix changes a read in another importer of the tools | The fix applies only to open comboboxes. Slice 2 runs the extractor importers (`extractValuesFromRenderedElements`, `extractValuesScoped.286.phase3`, `multistepProcess.274.integ`, `wizardWalk.284.integ`) |
| K4 | A declarative case passes vacuously (a step that asserts nothing) | Each migration slice runs a non-vacuity check: two edited expectations fail with the T10 message, then are reverted |
| K5 | Target resolution differs from the old queries (e.g. `getBy` vs `getAllBy(...)[0]`) | T6 mirrors each old query; interpreter tests cover every locator and refinement |
| K6 | Enum case 3 changes its assertions | P1 (§8) |
| K7 | Legacy and declarative leaves coexist until M1 | The consistency test checks both kinds; the runner rejects a leaf with both or neither `steps` and `componentTestRef` |
| K8 | The browser check needs the Vite dev server and the API server | Same method as #286 (plan, test execution conventions). If they are not running, the plan says what to start and what to record |

---

## 7. Validation

- Each migration slice: the migrated suites pass through `miroir-component-tests` with the same leaf labels and statuses as the Slice 0 baseline, and in the app sandbox (dev build).
- The 7 instances pass `modelValidation` and the rewritten consistency test.
- #286 issue tests (core and app) pass, adapted.
- M1: no `componentTestRef`, manifest, registry, generator, or per-editor TS file remains (grep). M2: no `custom` step or custom-step registry remains.
- Final: `tsc` per package with no new error against Slice 0, and the full `npm run nonreg` with only the Slice 0 baseline failures.

---

## 8. Open points needing user input

**P1. Enum case 3 "form state is changed when selection changes" under the D4 fix.** The case types `value3` in the open list without pressing Enter, and asserts `testField: "value3"`. That value is the filter text; the form value is still `value2` (§3.5). Any fix that makes the extractor return the selected value while the list is open changes this read to `value2`.

- (a) Keep the principled fix (open combobox reads the committed value). The case asserts `value2` plus `$options ["value3"]` while filtering, then presses Enter and asserts `value3` (§5.4 example). Same label, one more assertion.
- (b) The extractor returns the committed value only while the filter text is empty, and the filter text otherwise. The case keeps its current assertions. The extractor then reports text the user is typing as the field value.

Recommendation: (a). The case name says the form state changes, and only (a) asserts it.

**P2. Post-action wait cost (D9).** If the Slice 2 measurement shows the entry more than twice as slow as the Slice 0 baseline (K1):

- (a) Keep 300 ms after every action (D9 as decided).
- (b) One macrotask and the progressive-rendering check only; explicit waits stay available.

Recommendation: decide after the Slice 2 measurement; default (a).


**Resolution (orchestrator, 2026-09-25).** P1: (a), as it follows the user's decision D4 (fix the extractor, do not carry the workaround) and makes the case assert the form state its name describes. P2: default (a); the implementation stops and asks the user only if the Slice 2 measurement exceeds twice the Slice 0 time.
