# Issue #286 TDD implementation plan

> Vertical TDD slices, RED then GREEN, integration-first per `docs/contributing/testing.md`. Tests render the real `JzodElementEditor` through the real MiroirTest walk (`runMiroirTests._runMiroirTestSuite`) and the real UI buttons. The only stand-in is the `handleAction` recording function the suites already use. The UI tests mount the displays over a real `LocalCache`, without the launch mocks of the `*IntegrationLaunch` tests. The tracer (Slice 2) is one Array case that runs from MiroirTest JSON through the new vitest entry.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step. Commits happen only when the user asks. Each slice ends with its Validation commands. On success, its Realization is filled in and its Status becomes ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/286
Working branch: `286-FEATURE-react-component-miroir-tests`, created from `284-FEATURE-openapi-connection-wizard` at `5a6c380ea`. PR #285 merged #284 into `aba` (`febcf876c`), not `master`. Slice 0 starts by rebasing onto `origin/aba` (§0.0).

**Review:** revised after [`./plan-adversarial-review.md`](./plan-adversarial-review.md), P1-P22 applied.

**Resume note:** Slice 0 done (baselines recorded, phase0 test green, K9 answered). Next: Slice 1.

---

## Scope

- `reactComponentTest` leaf in the MiroirTest schema, and its arm in `runMiroirTest`.
- `ConfigurationService.registerReactComponentTestRunner`, `rethrowComponentTestFailures`, and `excludeMiroirTestTypes`.
- `createThrowingExpect` with DOM matchers in miroir-core `test-expect.ts`.
- `src/miroir-fwk/4-tests/componentTests/`: tools, act-free driver, manifest, registry, runner, and the 7 JzodElementEditor suites.
- `PortalContainerContext` and `ComponentTestModeContext` in the editors.
- `ComponentTestSandboxProvider` in `MiroirTestDisplay` and `MiroirTestListDisplay`, the `beforeRun` prop, and the Run all checkbox.
- The generator script, the consistency test, the new vitest entry, the bundle guard, the nonreg switch, and the documentation updates.

This plan does not add a declarative step language, migrate `JzodElementEditorReactCodeMirror.test.tsx`, revive the commented-out Book, EntityDefinition, Performance, and Endpoint suites, or change the 14 other importers of `JzodElementEditorTestTools` (analysis D1, D5, D13).

### Deviations from analysis.md

These come from the plan review and refine analysis §5 without changing a decision:

- `getWrapperLoadingLocalCache` in `src/` returns `{ Wrapper, localCache, miroirEventService, applicationDeploymentMap }`. The tests-side function of the same name sets its module state from that result and returns `Wrapper` (P2).
- The RTL wait helpers `waitForProgressiveRendering` and `waitAfterUserInteraction` stay in the tests file. `componentTestEnvironment.ts` gets act-free equivalents (P2).
- The new vitest entry sets `IS_REACT_ACT_ENVIRONMENT = false` in a `beforeAll`, because RTL's own `beforeAll` sets it back to `true` after module scope (P6).
- UI tests save the `@testing-library/dom` config before a run and restore it after, because `componentTestEnvironment.ts` replaces the `act` wrappers (P6).
- The bundle check is a guard over the build's sourcemaps, not a RED test, and it is not in the nonreg unit tier (P7, P8).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Rebase, baselines, characterize contracts, find how the app loads MiroirTests | ✅ DONE | `componentMiroirTests.286.phase0` + baseline tables |
| 1 | Move the browser-safe tools under `src/` with the old tests green | ⬜ | old suite 68 passed, each importer equal to its baseline |
| 2 | **Tracer.** One Array case runs from MiroirTest JSON in vitest | ⬜ | `miroir-component-tests` 1 passed |
| 3 | Array suite complete in vitest, DOM matchers, scoped value reader, consistency test | ⬜ | `miroir-component-tests` 12 passed |
| 4 | Array suite runs in the app sandbox | ⬜ | `componentTestSandbox.286.phase4` + dev and production check |
| 5 | Enum suite with the portal dropdown (pilot complete, user stop point) | ⬜ | 15 passed in vitest and in the app |
| 6 | Run all with the "Include component tests" checkbox | ⬜ | `runAllComponentTests.286.phase6` |
| 7 | Literal suite | ⬜ | 18 passed |
| 8 | Object suite | ⬜ | 32 passed |
| 9 | SimpleType suite | ⬜ | 44 passed |
| 10 | Union suite | ⬜ | 53 passed |
| 11 | Any suite | ⬜ | 68 passed |
| 12 | Delete the old file, nonreg switch, docs, acceptance criteria | ⬜ | default nonreg green |

Slice 2 is the first behavioral slice. Slices 0 and 1 build the safety net. The "passed" counts are the component cases of the new entry. The entry's own checks (§2.1) are counted separately.

---

## Locked implementation defaults

Copied from [`analysis.md`](./analysis.md). Deviations go in the slice Realization.

| Decision | Choice |
|---|---|
| D1 | Leaf `reactComponentTest` with `componentTestRef: { suite, case }` |
| D2 | `@testing-library/dom` and `@testing-library/user-event` in a lazy chunk. No `@testing-library/react` in that chunk. No React `act` (analysis §5.3) |
| D3 | Sandbox with its own providers, one wrapper and `LocalCache` per suite |
| D4 | `createThrowingExpect`. `toEqual` ignores `undefined`-valued keys. DOM matchers accept `null`. The second argument of `expect` is a message, as in vitest |
| D5 | Array and Enum first, then one suite per slice. `'component'` mode dropped |
| D6 | `src/miroir-fwk/4-tests/componentTests/`, one `import()`, runner registered through `ConfigurationService` |
| D7 | One leaf per case. The generator reads the React-free manifest. Labels start with the suite name and a colon, and are unique |
| D8 | Instance `JzodElementEditor_ComponentTestSuite` in `deployment-miroir/assets/miroir_data/a311f363-…/` |
| D9 | miroir-core entry: no runner, the tracker records skipped. New entry: one `describe` per sub-suite, `rethrowComponentTestFailures: true` |
| D10 | Unit Run button. Sandbox stays open with the last case. Run all checkbox on by default, on the unit button only |
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
| Issue test directory (app) | `packages/miroir-standalone-app/tests/4_view/issues/286-react-component-miroir-tests/` |
| Issue test directory (miroir-core) | `packages/miroir-core/tests/1_core/issues/286-react-component-miroir-tests/` |
| Nonreg unit | `unit-286-react-component-miroir-tests` |
| Nonreg default step (replaces `appstack-JzodElementEditor.test`) | `appstack-miroir-component-tests` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Old suite (until Slice 12) | `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test` |
| New entry | `npm run testByFile -w miroir-standalone-app -- miroir-component-tests` |
| One suite in the new entry | `npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodArrayEditor"` |
| App issue test | `npm run testByFile -w miroir-standalone-app -- <name>` |
| miroir-core issue test | `npm run testByFile -w miroir-core -- <name>` |
| miroir-core MiroirTests | `npm run testMiroir -w miroir-core` |
| Generator | `npx tsx packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts` |
| After each generator run | `npm run build -w miroir-test-app_deployment-miroir && npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Bare console guard | `python scripts/check_bare_console.py` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and the same for `packages/miroir-standalone-app/tsconfig.json`. The app tsconfig covers `src/` only, so it says nothing about `tests/`. The rule is "no new error" against the Slice 0 baseline. |

Rules:

- `testByFile` passes `--bail=1` to vitest (`test-by-file.ts` L27), so a line with several filters stops at the first failing file. Validation blocks run one file per command wherever a baseline count is compared.
- New issue tests do not use `RUN_TEST`. vitest ignores that variable unless the file implements a guard, and the filter argument already selects the file.
- The new entry runs under happy-dom (`vite.config.js` L121-141). It does not take `--profile`, because the in-memory `LocalCache` reads no store.
- Deployment packages set vitest `test.root` to `./tests`, so the modelValidation filter is `modelValidation.unit.test.ts`.
- miroir-core vitest runs in the node environment with no DOM and no jest-dom. Tests that need a DOM live in the app issue directory.

---

## Slice 0: rebase, baselines, characterize contracts

**Status:** ✅ DONE

### Goal

Put the branch on its final base, record the baselines the later slices compare against, lock the behavior later slices change, and answer analysis K9: how does the running app get MiroirTest rows?

### 0.0 Rebase

Ask the user before rewriting the branch. Then `git rebase origin/aba` (it contains #284 through `febcf876c`). The branch commits are the #286 documents and `5a6c380ea` (a JPEG under `code-helpers/`). All baselines below are taken after the rebase.

### 0.1 Baselines

Record in the Realization:

- **Old suite, case by case.** `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test`, verbose output reduced to a list of `suite - mode - case: status`, saved as `tests/4_view/issues/286-react-component-miroir-tests/baseline-JzodElementEditor.txt`. Expected: 68 passed.
- **The 14 importers, one command per file**, with passed, failed, and skipped counts. `extractValuesFromRenderedElements.test.tsx` (TypeError: `container` undefined at tools L1690-1691) and `formValuesToJSON.test.ts` (1 failed) are expected to be red already. Fix them here: pass a container in the first, and fix or document the one `formValuesToJSON` case. Then record the green counts. The #274, #284, and `ReportPage` tests take `--profile emulatedServer-filesystem`.
- **tsc error counts.** miroir-core 0. miroir-standalone-app 1 (`JzodElementEditorHooks.ts(528,59)` TS2339). Later slices must not add errors.

### 0.2 RED then GREEN: inventory

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/componentMiroirTests.286.phase0.unit.test.tsx`

**Stable** (`phase0 stable`), still true after Slice 12:

- `miroirTestLeaf` in Entity `a311f363-…` and in EntityVersion `51c647fe-…` list the same members. The test compares the two files, so it holds before and after Slice 2.
- miroir-core non-throwing `expect(null).not.toBeNull().result` is false, and `expect({a: 1, b: undefined}).toEqual({a: 1}).result` is false. The non-throwing `expect` keeps these semantics.
- `extractValuesFromRenderedElements` on a small rendered form, with an explicit container, returns a fixed expected value.

**Inventory** (`pre-286 inventory`):

- `miroirTestLeaf` has 5 members. Deleted in Slice 2.
- `extractValuesFromRenderedElements` returns a value from a named input outside the container. Deleted in Slice 3.
- The old file, read as text (not imported, so its tests do not register), declares the suite keys `JzodArrayEditor`, `JzodEnumEditor`, `JzodLiteralEditor`, `JzodObjectEditor`, `JzodSimpleTypeEditor`, `JzodUnionEditor`, `JzodAnyEditor` in `jzodElementEditorTests`. Each slice that deletes a suite removes it from the expected list. Deleted in Slice 12.

### 0.3 Investigation: MiroirTest rows in the app

Find how `MiroirTestListDisplay` gets its list in the dev app (`npm run dev`) with the filesystem and sql profiles. Record in the Realization where the rows come from (deployment assets at startup, `defaultMiroirMetaModel.tests`, or a store), and the exact step that makes a new instance visible. Slice 2 GREEN uses that step.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

Plus one command per importer, as listed in the Realization.

### Realization

**0.0 Rebase: not needed.** `origin/aba` has one commit beyond this branch, the #285 merge commit `febcf876c`. Its second parent `e24c50c08` is an ancestor of the branch, and `git diff febcf876c^2 febcf876c` is empty, so the merge brings no new content. `git diff HEAD origin/aba -- packages` is empty. The branch was not rewritten.

**0.1 Old suite.** `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test` gave 68 passed out of 68 (1 file, about 50 s). The case list, with ANSI codes stripped and one line per case in the form `<suite> - <mode> - <case>: <status>`, is saved as `packages/miroir-standalone-app/tests/4_view/issues/286-react-component-miroir-tests/baseline-JzodElementEditor.txt` (68 lines, all `passed`, no duplicate line).

**0.1 Importers of `JzodElementEditorTestTools.tsx`.** Of the 14 importers (the tools file and `JzodElementEditor.test.tsx` excluded), 12 are test files and 2 are helper rigs with no test of their own: `tests/4_view/helpers/gridPaginationIntegRig.tsx` (run through `gridPagination.integ` and `gridPagination.unit`) and `tests/4_view/helpers/listTransformerIntegRig.tsx` (run through `listDisplayByTransformer.integ`, `listDisplayByTransformer.loopSafety.integ`, and `virtualAttributes.integ`). One command per file, from the repo root:

| Command (`npm run testByFile -w miroir-standalone-app -- ...`) | Passed | Failed | Skipped |
|---|---|---|---|
| `--profile emulatedServer-filesystem wizardWalk.284.integ` | 11 | 0 | 0 |
| `--profile emulatedServer-filesystem multistepBranch.284.integ` | 6 | 0 | 0 |
| `--profile emulatedServer-filesystem multistepProcess.274.integ` | 19 | 0 | 0 |
| `--profile emulatedServer-filesystem multistepLaunch.274.phase5.integ` | 7 | 0 | 0 |
| `gridPagination.unit` | 28 | 0 | 0 |
| `virtualAttributes.integ` | 3 | 0 | 0 |
| `listDisplayByTransformer.integ` | 13 | 0 | 0 |
| `listDisplayByTransformer.loopSafety.integ` | 2 | 0 | 0 |
| `gridPagination.integ` | 13 | 0 | 0 |
| `--profile emulatedServer-filesystem ReportPage.integ` | 0 | file fails at collection | 0 |
| `extractValuesFromRenderedElements` | 4 | 0 | 0 (before the fix: 1 failed, 3 not run) |
| `formValuesToJSON` | 6 | 0 | 0 (before the fix: 1 failed, 2 passed, 3 not run) |

- `extractValuesFromRenderedElements.test.tsx` failed with `TypeError: Cannot read properties of undefined (reading 'querySelectorAll')` at tools L1691, because its 4 tests called `extractValuesFromRenderedElements(expect)` with no container. The tests were also wrong on a second point: they expect keys without the `testField.` prefix, which needs the `label` argument. Fix, test only: each test takes `container` from `render` and calls `extractValuesFromRenderedElements(expect, undefined, container, "testField")`. 4 passed.
- `formValuesToJSON.test.ts` failed on "top-level array: example from JzodElementEditor tests". The test was stale: it expected `e` as a BigInt and only 2 items, while `formValuesToJSON` keeps values as given (its "e" to BigInt special case is commented out) and returns one item per index, so index 2 gives a third item. Fix, test only: the expected value is now `e: "123"`, `e: "456"`, and a third item `{ b: { c: 0 }, d: false, e: "0" }`. 6 passed.
- `ReportPage.integ.test.tsx` is red before any #286 change and was not fixed here. vitest fails to collect it with `ReferenceError: exports is not defined in ES module scope` in `node_modules/svg-toolbelt/dist/index.js`, imported from `miroir-diagram-class/src/2_domain/entitiesToMermaidClassDiagram.ts` L117. It is not in `scripts/nonreg-manifest.json`. Its baseline for later slices is "fails at collection, 0 tests".

**0.1 tsc.** `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`: 0 errors. `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json`: 1 error, `JzodElementEditorHooks.ts(528,59)` TS2339 (`name` does not exist on `EntityInstance & { defaultLabel?: string }`). Both match the expected baseline.

**0.2 Phase0 test.** Created `packages/miroir-standalone-app/tests/4_view/issues/286-react-component-miroir-tests/componentMiroirTests.286.phase0.unit.test.tsx` with 6 tests.

- `phase0 stable` (3 tests): the `miroirTestLeaf` members at `mlSchema.definition.definition.context.miroirTestLeaf` are equal in Entity `a311f363-…` and EntityVersion `51c647fe-…`. miroir-core `expect(null).not.toBeNull().result` and `expect({a: 1, b: undefined}).toEqual({a: 1}).result` are both `false`. `extractValuesFromRenderedElements(expect, undefined, container, "testField")` on a text, a number, and a checkbox input returns `{ a: "foo", b: 42, c: true }`.
- `pre-286 inventory` (3 tests): `miroirTestLeaf` has the 5 members transformer, function call, query, runner, and action (delete in Slice 2). A named input appended to `document.body` outside the container is returned next to the one inside (delete in Slice 3). The old file, read as text and not imported, declares the 7 active keys `JzodArrayEditor` to `JzodAnyEditor` in `jzodElementEditorTests`, with commented-out lines ignored (delete in Slice 12).

These are characterization tests, so they passed at their first run: 6 passed.

**0.3 How the app gets MiroirTest rows (K9).** The rows come from the store, through the `LocalCache`. They do not come from `defaultMiroirMetaModel.tests`.

1. `ReportSectionMiroirTest` passes `useSelectedApplicationMiroirTests()` to `MiroirTestListDisplay`. It falls back to the report's fetched data only when that list is empty. The hook (`src/miroir-fwk/4-tests/useSelectedApplicationMiroirTestSuiteRegistries.ts`) reads `selectModelForDeploymentFromReduxState(...).tests`, which is `selectTestsFromReduxState` (`miroir-localcache-redux` `LocalCacheSliceModelSelector.ts` L298): the instances of entity `a311f363-…` in the `LocalCache`, section `data` for the Miroir application.
2. The `LocalCache` is filled at page load by `fetchMiroirAndAppConfigurations` (`src/miroir-fwk/4_view/services/ConfigurationService.ts`, called from `usePageConfiguration.ts`): a rollback of Admin, a query of the Admin `Deployment` instances, `storeManagementAction_openStore` for each with its `configuration`, then one `rollback` per application.
3. The Miroir `Deployment` instance `10ff36f2-…` (`miroir-test-app_deployment-admin/assets/admin_data/7959d814-…/10ff36f2-….json`, exported as `deployment_Miroir`, which `miroir-server/src/Server.ts` also opens at startup) declares a filesystem data section at `miroir-test-app_deployment-miroir/assets/miroir_data`. It is resolved against `filesystemDeploymentRootDirectory` (`..` from `miroir-server`, so `packages/`). This holds for the dev web app (default client config `miroirConfigRealServerFilesystemGit`) and for Electron. The filesystem store lists the entity folder with `readdirSync` on each call (`FileSystemInstanceStoreSectionMixin.ts` L175), so the server needs no restart.

The step that makes a new instance visible: write its JSON file into `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/`, then reload the app page (or run a rollback of the Miroir application). The reload fills the `LocalCache` again from that folder. No package build is needed for the list. The named export in `miroir-test-app_deployment-miroir/index.ts` and the `defaultMiroirMetaModel.tests` entry in `src/Model.ts` are still needed for TypeScript imports, the test sessions' model environment, and `modelValidation`, so Slice 2's generator writes them and runs the package build, as planned. For a SQL-backed Miroir deployment (the `emulatedServer-sql` test profile, or a `Deployment` whose data section is `sql`), the rows are table rows in schema `miroir`, and a new instance appears only once it is inserted there. The dev app does not use that path by default.

**Validation.**

- `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0`: 6 passed.
- `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test`: 68 passed.
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`: 0 errors.
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json`: 1 error (the baseline above).
- The 12 importer commands: counts in the table above.

**Files created:** `componentMiroirTests.286.phase0.unit.test.tsx` and `baseline-JzodElementEditor.txt`, both in `packages/miroir-standalone-app/tests/4_view/issues/286-react-component-miroir-tests/`. **Files changed:** `packages/miroir-standalone-app/tests/extractValuesFromRenderedElements.test.tsx`, `packages/miroir-standalone-app/tests/formValuesToJSON.test.ts`, and this plan. No product code changed.

---

## Slice 1: move the browser-safe tools under `src/`

**Status:** ⬜

### Goal

The browser-safe tools live in `src/miroir-fwk/4-tests/componentTests/componentTestTools.tsx`, with no vitest import, no `@testing-library/react`, no `process.env`, no `registerTestImplementation` call, and no bare `console.*`. Every test keeps its Slice 0 count. This is a refactor under green, so there is no RED step.

### 1.1 Refactor

- Move to `componentTestTools.tsx`: the prop types, `getJzodElementEditorForTest`, `extractValuesFromRenderedElements`, `formValuesToJSON`, `formikFieldName`, `testSectionName`, and a new `buildComponentTestWrapper(options)` returning `{ Wrapper, localCache, miroirEventService, applicationDeploymentMap }`. Replace `console.log` with a `MiroirLoggerFactory` logger and `vi.fn()` with a recording function.
- The `wireLocalCacheCompositeAction` branch (real `DomainController`, `MemoryRouter`, `persistenceSaga.run`) moves with it, behind the same option, so that the returned `localCache` is the one the #274 and #284 helpers need.
- `tests/4_view/JzodElementEditorTestTools.tsx` keeps a `getWrapperLoadingLocalCache` with today's signature. It calls `registerTestImplementation({ expect })`, calls `buildComponentTestWrapper`, sets `jzodEditorTestLocalCache` and `jzodEditorTestApplicationDeploymentMap` from the result when `wireLocalCacheCompositeAction` is set, and returns `Wrapper`. It re-exports the moved functions and keeps `waitForProgressiveRendering`, `waitAfterUserInteraction`, `runJzodEditorTest`, `prepareAndRunTestSuites`, and the Country, Report, and Query cache helpers.
- `extractValuesFromRenderedElements` keeps its signature in this slice. Slice 3 changes it.
- Move `emptyObject` from `routes/TransformerBuilderPage.js` to a module with no imports, and import it from both places.
- Drop the `'component'` mode (`TestMode`, `allTestModes`, `ModesType`, and the `modes` fields in the old test file).

### 1.2 Checkpoint

- `python scripts/check_bare_console.py` passes with no new allowlist entry.
- `componentTestTools.tsx` imports nothing from `vitest`, `@testing-library/react`, `tests/`, or `routes/`.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0
python scripts/check_bare_console.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

Plus the 14 per-importer commands from Slice 0. Each gives its Slice 0 count. The old suite gives 68 passed.

### Realization

(to fill)

---

## Slice 2: tracer, one Array case from MiroirTest JSON in vitest

**Status:** ⬜

### Goal

The case "JzodArrayEditor: renders all array values, in the right order" runs from the JSON instance `761d4ed2-…` through `runMiroirTests._runMiroirTestSuite` and the registered runner, and passes. The miroir-core generic entry loads the same JSON and does not fail.

**Layers cut:** MiroirTest schema, generated types, `runMiroirTest` arm, `ConfigurationService` runner, act-free driver, registry and manifest, generator, deployment package wiring, new vitest entry.

### 2.1 RED

First create empty stubs so the RED fails on behavior, not on imports: `componentTestManifest.ts` (`{}`), `componentTestRegistry.ts` (`{}`), and `runReactComponentTest.tsx` (a runner that returns `error` "not implemented").

**Test:** `tests/4_view/miroir-component-tests.unit.test.tsx` (analysis §5.8)

The entry sets `IS_REACT_ACT_ENVIRONMENT = false` in a `beforeAll`. It loads `JzodElementEditor_ComponentTestSuite` from the deployment folder, registers the runner, and runs each sub-suite inside `describe(<suite>)` with `rethrowComponentTestFailures: true`. A `describe("entry checks")` holds:

- `IS_REACT_ACT_ENVIRONMENT` is `false` inside a test body.

Behavior asserted for the case:

- vitest reports `JzodArrayEditor > JzodArrayEditor: renders all array values, in the right order` as passed.

RED fails first with "suite `JzodElementEditor_ComponentTestSuite` not found" (no JSON). After the JSON is written by hand for the check, it fails with `Unknown miroirTestType: reactComponentTest`.

**Test:** `packages/miroir-core/tests/1_core/issues/286-react-component-miroir-tests/reactComponentLeaf.286.phase2.unit.test.ts`

These run in-process with `TestFramework`, rethrow unset. Each test restores the registered runner in `finally`.

- With no runner registered, a one-leaf suite records `skipped` with the message `reactComponentTest requires a registered component test runner` and does not throw.
- With a runner returning `error`, the walk records `error` with the runner's message and runs the next leaf.
- With `rethrowComponentTestFailures: true` and a runner returning `error`, the leaf throws with that message.
- In integration mode the leaf is refused with the `functionCallTest` message pattern.

### 2.2 GREEN

- Add `miroirTestForReactComponent` to `miroirTestLeaf` in Entity `a311f363-…` and EntityVersion `51c647fe-…`. Run the schema rebuild. Export the new types from miroir-core `index.ts` (L462-473).
- `miroirTestLeafSupportsUnitExecution` and `miroirTestLeafRequiresIntegrationExecution` arms. The `runMiroirTest` arm (analysis §5.2). `rethrowComponentTestFailures` on the `"unit"` arm of `MiroirTestExecutionOptions`.
- `ConfigurationService.registerReactComponentTestRunner`.
- `componentTestEnvironment.ts`: the act-free driver, the `configure` call, and act-free `waitForProgressiveRendering` and `waitAfterUserInteraction`. `createThrowingExpect` with the existing matchers and vitest's `(actual, message)` signature.
- The manifest and registry with one case, and `jzodElementEditor/JzodArrayEditor.tsx`.
- `runReactComponentTest.tsx` (analysis §5.6 steps 1-4, without `destroy()` yet).
- `scripts/generate-component-miroir-tests.ts`. It writes the instance, the export in `miroir-test-app_deployment-miroir/index.ts`, the `export declare const miroirTest_JzodElementEditor_ComponentTestSuite: any;` line in its hand-kept `index.d.ts`, and the `defaultMiroirMetaModel.tests` entry. Add the step found in Slice 0.3 if it is needed.
- Remove that case from `getJzodArrayEditorTests` in the old file.
- Delete the 5-member assertion from `pre-286 inventory`.

### 2.3 Refactor checkpoint

- `componentTestManifest.ts` imports nothing from React. The generator runs under `tsx` without loading `react`.
- The miroir-core generic entry loads the new leaf, and the tracker shows it as skipped.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-core -- reactComponentLeaf.286.phase2
npm run testMiroir -w miroir-core
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

New entry: 1 case passed plus 1 entry check. Old suite: 67 passed.

### Realization

(to fill)

---

## Slice 3: Array suite complete in vitest

**Status:** ⬜

### Goal

All 12 Array cases pass through the new entry with the throwing `expect`, the scoped value reader, and user-event. The consistency test guards the JSON. The old file no longer has the Array suite.

### 3.1 RED

**Test:** `packages/miroir-core/tests/1_core/issues/286-react-component-miroir-tests/throwingExpect.286.phase3.unit.test.ts` (node, no DOM)

- `toEqual({a: 1, b: undefined})` against `{a: 1}` passes. `toEqual` of different values throws `MiroirAssertionError` with both values in the message.
- `expect(false, "number textBox content is not a number").toBe(true)` throws a message that contains the second argument.
- `getState().currentTestName` returns the name passed to `createThrowingExpect`.
- DOM matchers on minimal element fakes (objects with `ownerDocument.contains`, `value`, `checked`, `outerHTML`), without `instanceof HTMLInputElement`. `null` under `.not.toBeInTheDocument()` passes and never raises a `TypeError`.

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/domMatchersParity.286.phase3.unit.test.tsx` (happy-dom and jest-dom from `setup.ts`)

For each matcher, the same fixture DOM goes through jest-dom and through `createThrowingExpect`, and both give the same pass or fail:

- `toBeInTheDocument` on an attached element, a detached element, and `null`, in positive and `.not` form.
- `toHaveValue` on a text input, a `type="number"` input, a select, and a textarea.
- `toBeChecked` and `toContainHTML`.

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/extractValuesScoped.286.phase3.unit.test.tsx`

- A named input outside the root is ignored.
- A `ThemedSelectWithPortal` option list mounted in the given portal element is read.

**Test:** `tests/4_view/componentMiroirTests.consistency.unit.test.ts`

Checks the real manifest, registry, and JSON, and also runs its comparison function on fixtures:

- A manifest case with no JSON leaf fails.
- A registry case missing from the manifest fails.
- A leaf label used twice in the instance fails.
- A second generator run leaves the JSON byte-identical.

**New entry:** the other 11 Array cases are added to the manifest and registry as stubs that throw "not migrated". The generator is re-run. The new entry fails for exactly those 11.

### 3.2 GREEN

- DOM matchers, `getState`, and the `toEqual` rule in `createThrowingExpect`.
- `extractValuesFromRenderedElements(expect, filter, root, …)` in `src/` searches `root` and the portal element. The tests-side export keeps the old call shape for the 14 importers by passing `document` when no root is given.
- The 11 remaining bodies in `JzodArrayEditor.tsx`, rewritten with the analysis §5.3 rules.
- The consistency test's comparison function, exported for the fixtures.
- Delete `JzodArrayEditor` from `jzodElementEditorTests` in the old file and from the phase0 expected suite list. Delete the outside-input assertion from `pre-286 inventory`.

### 3.3 Refactor checkpoint

- No `screen` identifier, `screen.debug`, or bare `console.*` in `componentTests/`.

### Validation

```bash
npx tsx packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-core -- throwingExpect.286.phase3
npm run testByFile -w miroir-standalone-app -- domMatchersParity.286.phase3
npm run testByFile -w miroir-standalone-app -- extractValuesScoped.286.phase3
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0
npm run testByFile -w miroir-standalone-app -- extractValuesFromRenderedElements
python scripts/check_bare_console.py
```

New entry: 12 cases passed. Old suite: 56 passed. `extractValuesFromRenderedElements` keeps its Slice 0 count.

### Realization

(to fill)

---

## Slice 4: Array suite runs in the app sandbox

**Status:** ⬜

### Goal

In the running app, the unit Run button on `JzodElementEditor_ComponentTestSuite` loads the component test chunk, renders each Array case in a visible sandbox, and records 12 results. The app's `LocalCache` and `ConfigurationService.testImplementation` are unchanged. It works in a development build and in a production build.

### 4.1 RED

**Harness for the UI tests (Slices 4 and 6):** `MiroirContextReactProvider` and `LocalCacheProvider` over a real `LocalCache` seeded with the Miroir meta-model, as `getWrapperLoadingLocalCache` seeds its own. No launch mocks, no Postgres, no `--profile`. Results are read from `miroirActivityTracker.getTestAssertionsResults([])` and from `onTestComplete` / `testResultsData`, not from grid cells. The test saves `getConfig()` of `@testing-library/dom` before the run and restores it after, so RTL's own `act` wrappers apply to the test's clicks.

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/componentTestSandbox.286.phase4.integ.test.tsx`

Mount `MiroirTestDisplay` for instance `761d4ed2-…` with `testFilter` limited to the `JzodArrayEditor` sub-suite, so later slices do not change the counts. Record `ConfigurationService.configurationService.testImplementation` and a JSON snapshot of the harness `LocalCache` state before the run. Spy on `MiroirEventService.prototype.destroy` and on `buildComponentTestWrapper`.

- Clicking the unit Run button shows the sandbox panel and records 12 `ok` results.
- With one registry case replaced by a body whose `toBeInTheDocument` fails, the run records 11 `ok` and 1 `error` with the matcher's message, and the cases after it still run.
- After the run, `testImplementation` is the same object, and the harness `LocalCache` state equals the snapshot.
- `buildComponentTestWrapper` was called once for the suite. `destroy` was called once after the suite's last case.
- The last case's DOM is still in the sandbox. The close button removes it and hides the panel.

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/componentTestMode.286.phase4.unit.test.tsx`

- With `vi.stubEnv("VITE_TEST_MODE", "false")`, `vi.resetModules()`, and a dynamic import of `JzodElementEditor`, an object schema rendered inside `ComponentTestModeContext` `{ progressiveRenderDisabled: true, codeMirrorPlaceholder: true }` shows the `<pre>codeMirrorValue:` box and no `Loading …` placeholder.
- Without the context, the same render shows the real CodeMirror container and a progressive-reveal placeholder.

### 4.2 GREEN

- `ComponentTestSandboxProvider`, `ComponentTestSandbox`, and `prepareComponentTests` (analysis §5.6), mounted in `MiroirTestDisplay`.
- `beforeRun` on `RunMiroirTestSuiteButton`, awaited when the suite has a `reactComponentTest` leaf.
- `ComponentTestModeContext`, read by `useViewportReveal` and by `JzodElementEditor` for `isUnderTest`. `isUnderTest` becomes a value read at render time, not only at module load. The sandbox providers set both flags.
- `miroirEventService.destroy()` on the suite's last case and on close.
- `componentTests/index.ts` with `registerComponentTests`, reached by one `import()`.
- `@testing-library/dom` and `@testing-library/user-event` move to `dependencies`.

### 4.3 Bundle guard

**Guard:** `tests/4_view/issues/286-react-component-miroir-tests/componentTestChunk.286.phase4.unit.test.ts`

This is not a RED test. `@testing-library/react` and `@testing-library/dom` are already in a lazy chunk today, through `src/miroir-fwk/4-tests/tests-utils.tsx` L1-2 and the browser integration launcher. The guard:

- Fails with "run `npm run build -w miroir-standalone-app` first" when `dist/.vite/manifest.json` is missing or older than the newest file under `src/`.
- Takes the static `imports` closure of the `index.html` entry from the manifest, reads each chunk's `.map` `sources`, and fails if any source is under `node_modules/@testing-library/`.
- Takes the chunk closure of the `componentTests/index.ts` dynamic import and fails if it contains `node_modules/@testing-library/react/` or `routes/TransformerBuilderPage`.

This needs `build.manifest: true` in `vite.config.js`. The manifest is copied into `release/client` and served publicly, which is acceptable: it lists chunk file names only.

### 4.4 Manual check (K1, K2, K8)

Development build:

- `npm run dev` for the app. Run the Array suite from the MiroirTest list: 12 `ok`. The Library report still loads afterwards. The app's look is unchanged. The browser console shows no React act warning.

Production build:

```bash
npm run build -w miroir-standalone-app
npm run copy:client -w miroir-server
npm run build:release -w miroir-server
npm run run:prod -w miroir-server
```

The server log shows "Running in production mode - serving React SPA". The same run gives 12 `ok`. The full build takes about 10 minutes.

If any case passes in vitest and fails in the app, record it in the Realization. If the cause is the act-free driver (K1), stop and ask the user whether to switch to the development-build fallback.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- componentTestSandbox.286.phase4
npm run testByFile -w miroir-standalone-app -- componentTestMode.286.phase4
npm run build -w miroir-standalone-app
npm run testByFile -w miroir-standalone-app -- componentTestChunk.286.phase4
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
npm run testByFile -w miroir-standalone-app -- MiroirTestDisplay.unit
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-sql MiroirTestDisplayIntegrationLaunch
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
python scripts/check_bare_console.py
```

`MiroirTestDisplayIntegrationLaunch` needs Postgres, as its nonreg step does.

### Realization

(to fill)

---

## Slice 5: Enum suite with the portal dropdown (pilot complete)

**Status:** ⬜

### Goal

The 3 Enum cases pass in vitest and in the app, including "renders all enum options", which opens the `ThemedSelectWithPortal` dropdown.

### 5.1 RED

Add the Enum cases to the manifest and registry, and re-run the generator. The new entry fails on "renders all enum options" because the option list renders in `document.body`, outside `view`.

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/portalContainer.286.phase5.unit.test.tsx`

- With `PortalContainerContext` set to an element, `ThemedSelectWithPortal` renders its options in that element, and a click outside that element closes the list.
- Without the context, it renders in `document.body`, as today.
- A `ThemedMUISelect` inside the sandbox theme renders its menu in the portal element.

### 5.2 GREEN

- `PortalContainerContext`, read by `ThemedSelectWithPortal` for its portal target and its outside-click root.
- The sandbox theme sets `defaultProps.container` on `MuiPopover`, `MuiPopper`, `MuiModal`, and `MuiMenu`.
- `jzodElementEditor/JzodEnumEditor.tsx`. Delete `JzodEnumEditor` from the old file and from the phase0 expected suite list.

### 5.3 Pilot checkpoint (user stop point)

- Diff the new entry's verbose case list against `baseline-JzodElementEditor.txt` for the Array and Enum cases. Record the result.
- Run both suites in the dev app and the production build (§4.4). Record the results.
- Ask the user to confirm the pilot before Slice 6.

### Validation

```bash
npx tsx packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- portalContainer.286.phase5
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0
npm run testByFile -w miroir-standalone-app -- componentTestSandbox.286.phase4
```

New entry: 15 cases passed. Old suite: 53 passed.

### Realization

(to fill)

---

## Slice 6: Run all with the "Include component tests" checkbox

**Status:** ⬜

### Goal

"Run all MiroirTests" in unit mode in `MiroirTestListDisplay` runs component tests in its own sandbox when the checkbox is on, and skips them when it is off.

### 6.1 RED

**Test:** `tests/4_view/issues/286-react-component-miroir-tests/runAllComponentTests.286.phase6.integ.test.tsx`

Same harness as Slice 4. Mount `MiroirTestListDisplay` with the list narrowed to `JzodElementEditor_ComponentTestSuite` and one small transformer suite (chosen in the Realization, fewer than 20 leaves). `vi.mock` wraps `componentTests/index.ts` to count calls to `registerComponentTests`. The expected component count comes from `componentTestManifest.ts` at test time. This test is re-run only after a GREEN, never while a suite has "not migrated" stubs.

- The unit Run all button has the checkbox, checked by default. The integration Run all button has none.
- With the checkbox on, Run all records one `ok` per manifest case and the transformer suite's results. `registerComponentTests` was called once.
- With the checkbox off, the component leaves are recorded as skipped, `registerComponentTests` was not called, and the transformer suite still runs.

**Test:** `packages/miroir-core/tests/1_core/issues/286-react-component-miroir-tests/excludeMiroirTestTypes.286.phase6.unit.test.ts`

- `excludeMiroirTestTypes: ["reactComponentTest"]` records those leaves as skipped and does not call their arm. Other leaves run.

### 6.2 GREEN

- `excludeMiroirTestTypes` on the `"unit"` arm, checked in `_runMiroirTestWithTracking`.
- `ComponentTestSandboxProvider` mounted in `MiroirTestListDisplay`. The checkbox and `beforeRun` on the unit `RunAllMiroirTestsButton`.

### Validation

```bash
npm run testByFile -w miroir-core -- excludeMiroirTestTypes.286.phase6
npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6
npm run testByFile -w miroir-standalone-app -- RunAllMiroirTestsButton
npm run testByFile -w miroir-standalone-app -- MiroirTestListDisplay
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-sql MiroirTestListIntegrationLaunch
```

`MiroirTestListIntegrationLaunch` needs Postgres.

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

Port the bodies with the analysis §5.3 rules. If a case needs something the environment does not provide (a new matcher, a new portal, a new test-mode fork), add a focused test for it first in the issue directory, then implement it. Delete the suite from the old file and from the phase0 expected suite list.

### Validation (each slice)

```bash
npx tsx packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "<suite>"
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0
npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6
python scripts/check_bare_console.py
```

The new entry's verbose list is diffed against `baseline-JzodElementEditor.txt` for the suite. The development-build check from §4.4 repeats for the suite. Slice 11 leaves the old file with no active suite, so its run reports no tests.

### Realization

(to fill per slice)

---

## Slice 12: delete the old file, nonreg, docs, acceptance criteria

**Status:** ⬜

### Goal

The old test file is gone, the nonreg manifest runs the new entry, and the documents point to #286.

### 12.1 Changes

- Delete `tests/4_view/JzodElementEditor.test.tsx` and `baseline-JzodElementEditor.txt`. Keep `JzodElementEditorTestTools.tsx` for its 14 importers.
- Delete `pre-286 inventory` from the phase0 test.
- `scripts/nonreg-manifest.json`:
  - Replace `appstack-JzodElementEditor.test` with `appstack-miroir-component-tests` (tier `default`): `miroir-component-tests`, then `componentMiroirTests.consistency`.
  - Add `unit-286-react-component-miroir-tests` (tier `unit`): `componentMiroirTests.286.phase0`, the miroir-core `286` unit tests, `domMatchersParity.286.phase3`, `extractValuesScoped.286.phase3`, `componentTestMode.286.phase4`, `portalContainer.286.phase5`, `componentTestSandbox.286.phase4`, and `runAllComponentTests.286.phase6`.
  - The bundle guard stays out of nonreg, because nonreg does not build the app. It runs in the Slice 4 and Slice 12 Validation.
- #197 `analysis-ui-integ-without-testing-library.md` §8 and L170: the rule now allows `@testing-library/dom` and user-event in the lazy component test chunk, and records that the integration launcher chunk already loads RTL through `tests-utils.tsx`. Link #286.
- #204 `plan.md` L201: JzodElementEditor done by #286. `JzodElementEditorReactCodeMirror.test.tsx` is the next candidate.
- `docs/reference/testing.md` L143 and L759-784, and `docs/contributing/testing.md` L176-192: the new entry, `-t "<suite>"`, the generator, and running component tests in the app. Replace "(67 tests total)".
- `docs/internals/code-splitting.md`: the component test chunk.
- Issue #286: tick the acceptance criteria that hold, with evidence.

### Validation

```bash
npm run build -w miroir-standalone-app
npm run testByFile -w miroir-standalone-app -- componentTestChunk.286.phase4
npm run nonreg -- --tier default
python scripts/check_bare_console.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

The default nonreg tier is green. The new entry gives 68 cases passed. `tsc` has no error beyond the Slice 0 baseline.

### Realization

(to fill)
