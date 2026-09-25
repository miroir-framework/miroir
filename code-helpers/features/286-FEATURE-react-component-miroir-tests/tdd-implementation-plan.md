# Issue #286 TDD implementation plan

> Vertical TDD slices, RED then GREEN, integration-first per `docs/contributing/testing.md`. Tests render the real `JzodElementEditor` through the real MiroirTest walk (`runMiroirTests._runMiroirTestSuite`) and the real UI buttons. The only stand-in is the `handleAction` recording function the suites already use. The UI tests mount the displays over a real `LocalCache`, without the launch mocks of the `*IntegrationLaunch` tests. The tracer (Slice 2) is one Array case that runs from MiroirTest JSON through the new vitest entry.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step. Commits happen only when the user asks. Each slice ends with its Validation commands. On success, its Realization is filled in and its Status becomes ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/286
Working branch: `286-FEATURE-react-component-miroir-tests`, created from `284-FEATURE-openapi-connection-wizard` at `5a6c380ea`. PR #285 merged #284 into `aba` (`febcf876c`), not `master`. Slice 0 starts by rebasing onto `origin/aba` (§0.0).

**Review:** revised after [`./plan-adversarial-review.md`](./plan-adversarial-review.md), P1-P22 applied.

**Resume note:** Slices 0 to 8 done, pilot clean. The 12 Array, 3 Enum, 3 Literal, and 14 Object cases run from the MiroirTest instance `761d4ed2-…` through the new vitest entry (32 cases plus 1 entry check) and in the app, where the unit Run button of `MiroirTestDisplay` runs them in the sandbox and records one `ok` per case (15/15 checked in a real browser on the Vite dev server and on the production build after Slice 5, 18/18 on the dev server after Slice 7, 32/32 on the dev server after Slice 8). Since Slice 8, `env.fireEvent` is `componentTestFireEvent`, which adds the React-specific events of `@testing-library/react`'s `fireEvent` (`blur` also fires `focusout`, and so on) without importing it. `PortalContainerContext` sends the `ThemedSelectWithPortal` option lists, and the MUI popups (through a MUI `DefaultPropsProvider`), into the sandbox portal element. "Run All Unit Tests" of `MiroirTestListDisplay` has an "Include component tests" checkbox, checked by default. When checked, it runs the component leaves in the list's own sandbox. When unchecked, it passes `excludeMiroirTestTypes: ["reactComponentTest"]`, so those leaves are recorded as skipped. The old file keeps 36 cases. Next: Slice 9 (SimpleType suite). Open follow-up: a filter that names one sub-suite of a multi-sub-suite instance throws in miroir-core when run from `MiroirTestDisplay` (Slice 5 finding, re-evaluated in the Slice 6 Realization).

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
| 1 | Move the browser-safe tools under `src/` with the old tests green | ✅ DONE | old suite 68 passed, each importer equal to its baseline |
| 2 | **Tracer.** One Array case runs from MiroirTest JSON in vitest | ✅ DONE | `miroir-component-tests` 1 passed |
| 3 | Array suite complete in vitest, DOM matchers, scoped value reader, consistency test | ✅ DONE | `miroir-component-tests` 12 passed |
| 4 | Array suite runs in the app sandbox | ✅ DONE | `componentTestSandbox.286.phase4` 2 passed, 12/12 in the dev and production browser checks |
| 5 | Enum suite with the portal dropdown (pilot complete, user stop point) | ✅ DONE | `miroir-component-tests` 15 passed, `portalContainer.286.phase5` 3 passed, 15/15 in the dev and production browser checks |
| 6 | Run all with the "Include component tests" checkbox | ✅ DONE | `runAllComponentTests.286.phase6` 3 passed, `excludeMiroirTestTypes.286.phase6` 3 passed |
| 7 | Literal suite | ✅ DONE | `miroir-component-tests` 18 passed, 18/18 in the dev browser check |
| 8 | Object suite | ✅ DONE | `miroir-component-tests` 32 passed, `componentTestFireEvent.286.phase8` 4 passed, 32/32 in the dev browser check |
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

**Status:** ✅ DONE

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

**Files created.**

- `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestTools.tsx` (1842 lines). It holds `testSectionName`, `formikFieldName`, `testThemeParams`, the `JzodElementEditorProps_Test` prop type, `getJzodElementEditorForTest`, `extractValuesFromRenderedElements`, `formValuesToJSON`, `createRecordingFunction`, and `buildComponentTestWrapper(options)`. The options are `{ isPerformanceTest?, applicationDeploymentMap, wireLocalCacheCompositeAction? }`, and the result is `{ Wrapper, localCache, miroirEventService, applicationDeploymentMap }`. The `wireLocalCacheCompositeAction` branch moved with it: the Library entry added to the map, no second Library data load, `persistenceSaga.run(localCache)`, the real `DomainController` with the colliding-uuid check, and the `MemoryRouter`. The returned `applicationDeploymentMap` is the effective map, with the Library entry in wired mode. The file logs through a `MiroirLoggerFactory` logger named `componentTestTools`. The former `console.log` calls became `log.debug`, the `console.error` calls `log.error`, and the Profiler render line `log.info`. The two meta-model dumps that were guarded by `process.env.VITE_TEST_MODE !== "true"` are now unguarded `log.debug` calls. `vi.fn()` became `createRecordingFunction()`, which records each call's arguments in `.calls` and returns `undefined`, as `vi.fn()` did. There is one recording function per wrapper instead of one per module. Nothing reads it today. `extractValuesFromRenderedElements` keeps its signature. Its `expect` parameter is typed with the new structural type `ExtractValuesExpect` (`(actual, message?) => { toBeTruthy }`) instead of vitest's `ExpectStatic`, so vitest's `expect` still fits. The module imports nothing from `vitest`, `@testing-library/react`, `tests/`, or `routes/`, and has no `process.env` and no `registerTestImplementation`.
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/tools/emptyObject.ts`, a module with no imports that exports `emptyObject`.

**Files changed.**

- `packages/miroir-standalone-app/tests/4_view/JzodElementEditorTestTools.tsx` (2312 to 514 lines). It re-exports the moved functions and types from `componentTestTools.tsx`. It keeps `getWrapperLoadingLocalCache` with the same signature: it calls `registerTestImplementation({ expect })`, calls `buildComponentTestWrapper`, sets `jzodEditorTestLocalCache` and `jzodEditorTestApplicationDeploymentMap` from the result when `wireLocalCacheCompositeAction` is set, and returns `Wrapper`. It also keeps `waitForProgressiveRendering`, `waitAfterUserInteraction`, the `ReactComponentTest*` types, the deprecated `getLocalEditor`, `runJzodEditorTest`, `getJzodEditorTestSuites`, `prepareAndRunTestSuites`, and the Country, Report, and Query cache helpers. The `'component'` mode is gone: `TestMode`, `TestModeStar`, `allTestModes`, `ModesType`, the `componentProps` field of `ReactComponentTestCase`, the `renderAs` parameter of `runJzodEditorTest`, and the mode loop in `prepareAndRunTestSuites`. The vitest names keep the `- jzodElementEditor -` segment through a constant, so they still match `baseline-JzodElementEditor.txt`.
- `packages/miroir-standalone-app/tests/4_view/JzodElementEditor.test.tsx`: the `ModesType` import, the `& { modes?: ModesType }` type, and the 7 `modes: "jzodElementEditor"` fields removed.
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/TransformerBuilderPage.tsx`: imports `emptyObject` from `tools/emptyObject.js` and re-exports it, instead of declaring it.
- This plan.

No importer of `JzodElementEditorTestTools.tsx` changed.

**Validation.**

- `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test`: 68 passed. The verbose case list, reduced as in Slice 0, is identical to `baseline-JzodElementEditor.txt` (68 lines, same names, all passed).
- `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0`: 6 passed.
- `python scripts/check_bare_console.py`: OK, no allowlist change.
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json`: 1 error, the baseline `JzodElementEditorHooks.ts(528,59)` TS2339.

Importers, one command per file as in Slice 0:

| Command (`npm run testByFile -w miroir-standalone-app -- ...`) | Slice 0 | Slice 1 |
|---|---|---|
| `--profile emulatedServer-filesystem wizardWalk.284.integ` | 11 passed | 11 passed |
| `--profile emulatedServer-filesystem multistepBranch.284.integ` | 6 passed | 6 passed |
| `--profile emulatedServer-filesystem multistepProcess.274.integ` | 19 passed | 19 passed |
| `--profile emulatedServer-filesystem multistepLaunch.274.phase5.integ` | 7 passed | 7 passed |
| `gridPagination.unit` | 28 passed | 28 passed |
| `virtualAttributes.integ` | 3 passed | 3 passed |
| `listDisplayByTransformer.integ` | 13 passed | 13 passed |
| `listDisplayByTransformer.loopSafety.integ` | 2 passed | 2 passed |
| `gridPagination.integ` | 13 passed | 13 passed |
| `--profile emulatedServer-filesystem ReportPage.integ` | fails at collection | fails at collection, same `ReferenceError: exports is not defined` from `svg-toolbelt` |
| `extractValuesFromRenderedElements` | 4 passed | 4 passed |
| `formValuesToJSON` | 6 passed | 6 passed |

No test failed or was skipped in these runs.

---

## Slice 2: tracer, one Array case from MiroirTest JSON in vitest

**Status:** ✅ DONE

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

**RED observed.**

- Stubs first: `componentTestManifest.ts` (empty manifest, plus the instance uuid and name constants the entry imports), `componentTestRegistry.ts` (`{}`), and `runReactComponentTest.tsx` (a runner returning `error` "not implemented").
- New entry, no JSON: the file fails at collection with `Error: suite JzodElementEditor_ComponentTestSuite not found in C:\Users\nono\...\miroir_data\a311f363-e238-4203-bdfc-29e8c160c26b`, no test run.
- New entry, JSON present: the JSON was not written by hand but by the generator, because only the generator writes into `miroir_data`. It was run from the manifest with its one case. vitest then collected the 2 tests (entry check and leaf), and the file failed in its `beforeAll` with `TypeError: ConfigurationService.configurationService.registerReactComponentTestRunner is not a function`, both tests reported skipped. The runner registration sits in the `beforeAll`, so this TypeError comes before the planned `Unknown miroirTestType: reactComponentTest`. That message was observed in miroir-core instead (next point).
- miroir-core `reactComponentLeaf.286.phase2`, first run: 4 failed with `TypeError: ConfigurationService.configurationService.registerReactComponentTestRunner is not a function`. After adding only `registerReactComponentTestRunner`, the 4 failed on behavior: `Error: Unknown miroirTestType: reactComponentTest` (the exhaustive default arm of `runMiroirTest`) for the skipped and error-recording tests, and `expected [Function] to throw error including 'case A failed on purpose' but got 'Unknown miroirTestType: reactComponen…'`, and the same for `'runMiroirTestInMemory: reactComponent…'`, for the rethrow and integration tests.

**GREEN, miroir-core.**

- Schema: `miroirTestForReactComponent` added to `miroirTestLeaf` (sixth member, after `miroirTestForAction`) and declared next to `miroirTestForFunctionCall` in Entity `a311f363-…` and EntityVersion `51c647fe-…`, with the same text in both files. Fields: `skip` (optional boolean), `componentTestRef` (`{ suite: string, case: string }`), `miroirTestType` (literal `reactComponentTest`), `miroirTestLabel` (string), and the same `tag` shape as the sibling leaves. `npm run build -w miroir-test-app_deployment-miroir` and `npm run devBuild -w miroir-core` regenerated `MiroirTestForReactComponent` and `miroirTestForReactComponent` in `preprocessor-generated/`, which was not edited by hand. Both are exported from `index.ts` next to `MiroirTestForAction`.
- `src/0_interfaces/5-tests/miroirTestTypes.ts`: `ReactComponentTestRef`, `ReactComponentTestRunnerResult`, and `ReactComponentTestRunner` (analysis §5.2), exported from `index.ts`.
- `ConfigurationService`: a `reactComponentTestRunner` field and `registerReactComponentTestRunner(runner | undefined)`.
- New `src/5_tests/ReactComponentTestTools.ts` with `runMiroirReactComponentTest` and `REACT_COMPONENT_TEST_NO_RUNNER_MESSAGE`, both exported. A skipped leaf (`skip`, `parentSkip`, or excluded by an array `testList`) records `skipped`. With no runner, it records `skipped` with the message `reactComponentTest requires a registered component test runner` in `assertionActualValue`, because `TestAssertionResult` has no message field. Otherwise it records `ok`, or `error` with the runner's message in `assertionActualValue` (or `{ message, actual }` when the runner gives `actual`) and the runner's `expected` in `assertionExpectedValue`. A runner that throws gives an `error` result. The arm rethrows only when `rethrowComponentTestFailures` is set, as `reactComponentTest "<path>" failed: <message>`.
- `MiroirTestTools.ts`: the `reactComponentTest` arm of `runMiroirTest`, refused in integration mode with `runMiroirTestInMemory: reactComponentTest leaves cannot run in integration mode`, and `rethrowComponentTestFailures?: boolean` on the `"unit"` arm of `MiroirTestExecutionOptions`.
- `inferIntegrationSessionKind.ts`: `reactComponentTest` supports unit execution and does not require integration, as `functionCallTest`.
- `test-expect.ts`: `MiroirAssertionError`, and `createThrowingExpect(testName)`. It returns an `expect(actual, message?)` whose matchers (every existing one, and their `.not` forms) call the non-throwing ones and throw `MiroirAssertionError` with the non-throwing message when `result` is false. The message argument replaces `testName` as the label in the failure message. No DOM matcher, no `getState`, and no rule for `undefined`-valued keys yet (Slice 3). Exported with the `ThrowingExpect` and `ThrowingMatchers` types.

**GREEN, app.** All under `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/`:

- `componentTestEnvironment.ts`: the act-free driver. `configureComponentTestDom()` calls `@testing-library/dom` `configure({ asyncUtilTimeout: 5000, testIdAttribute: "data-testid", eventWrapper: cb => cb(), asyncWrapper: cb => cb() })`. `mountComponent(element, target)` renders with `createRoot` inside `flushSync` and returns `unmount`. `componentTestAct` awaits the callback, then `setTimeout(0)`. The act-free `waitForProgressiveRendering(root)` waits with `@testing-library/dom` `waitFor` until `root` shows no `Loading …` placeholder, then one macrotask. `waitAfterUserInteraction(root)` does the same, then waits 300 ms. `createComponentTestEnvironment` builds `{ expect, view, container, fireEvent, userEvent, act, waitFor, sandboxElement, portalElement, log }`. The file also holds the `ComponentTestEnvironment`, `ComponentTestCase`, `ComponentTestSuite`, and `ComponentTestRegistry` types, so that the suite files do not import the registry.
- Deviation from analysis §5.3: `view` is `within(sandboxElement)`, not a merge of `within(container)` and `within(portalElement)`. The runner keeps only the portal element and the current case's container under `sandboxElement`, so both give the same elements, and Testing Library has no way to merge two roots that keeps the `getBy` error semantics.
- `componentTestManifest.ts`: `componentTestSuiteInstanceUuid`, `componentTestSuiteInstanceName`, `componentTestManifest` (`JzodArrayEditor` with its one case), and `componentTestLeafLabel(suite, case)`, which gives `<suite>: <case>`. The file has no import.
- `componentTestRegistry.ts`: `{ JzodArrayEditor: jzodArrayEditorComponentTests }`.
- `jzodElementEditor/JzodArrayEditor.tsx`: the suite props of `getJzodArrayEditorTests` and the case "renders all array values, in the right order", rewritten with the §5.3 rules (`screen` to `env.view`, `expect` to `env.expect`). The component is `getJzodElementEditorForTest("JzodElementEditor.test")`, the page label of the old file, so the DOM is the same.
- `runReactComponentTest.tsx`: `createReactComponentTestRunner({ sandboxElement, portalElement?, registry? })` returns the `ReactComponentTestRunner`. It calls `configureComponentTestDom()` and creates the portal element under the sandbox when none is given. Then it runs §5.6 steps 1 to 4. An unknown suite or case is an `error` result that names it. There is one `buildComponentTestWrapper` per suite, built on its first case, with `defaultSelfApplicationDeploymentMap` unless the suite gives a map. The previous case is unmounted and its container removed, a fresh container is appended to the sandbox, the wrapped component is mounted into it, and `waitForProgressiveRendering(container)` runs. The body runs with a fresh environment whose `expect` is named by the leaf path, and any thrown error becomes an `error` result. The last case stays mounted. There is no `destroy()` yet. The runner logs through a `MiroirLoggerFactory` logger.

**GREEN, generator and wiring.** `packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts` imports only the manifest. It writes `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/761d4ed2-1a5c-4901-a9d9-897dbec0b27f.json`. The instance has the same top-level keys as the other MiroirTest instances in that folder (`uuid`, `parentName`, `parentUuid`, `name`, `selfApplication`, `branch`, `description`, `definition`), one sub-suite `JzodArrayEditor`, and one `reactComponentTest` leaf labelled `JzodArrayEditor: renders all array values, in the right order`. It is 2-space JSON with CRLF line ends, like its neighbours. The script then adds, when missing, the export `miroirTest_JzodElementEditor_ComponentTestSuite` in `index.ts` (after the last `miroirTest_` JSON export), `export declare const miroirTest_JzodElementEditor_ComponentTestSuite: any;` in `index.d.ts`, and the import and `defaultMiroirMetaModel.tests` entry in `src/Model.ts`. It writes a file only when its content changes. A second run prints "no change", and the git diff of the wiring files is one added line in `index.ts`, one in `index.d.ts`, and two in `Model.ts`. `main()` runs only when the script is invoked directly, so a test can import `buildComponentTestSuiteInstance`. The Slice 0.3 step (reload the app page) needs no code.

**GREEN, entry and old file.** `packages/miroir-standalone-app/tests/4_view/miroir-component-tests.unit.test.tsx` loads the instance by uuid from the `miroir_data` folder and throws "suite … not found" otherwise. It appends a sandbox element to `document.body`. Its `beforeAll` sets `IS_REACT_ACT_ENVIRONMENT = false` and registers `createReactComponentTestRunner({ sandboxElement })`, and its `afterAll` unregisters it. `describe("entry checks")` asserts that `IS_REACT_ACT_ENVIRONMENT` is `false` in a test body. Each sub-suite runs in an async `describe(<suite>)` through `runMiroirTests._runMiroirTestSuite(vitest, [instanceName, suite], …, true, runMiroirTests, { executionMode: "unit", rethrowComponentTestFailures: true })`, so the vitest name is `JzodArrayEditor > JzodArrayEditor: renders all array values, in the right order`. A check with a wrong expected value (`["value1", "value3", "value2"]`, then reverted) failed with `reactComponentTest "JzodElementEditor_ComponentTestSuite#JzodArrayEditor#JzodArrayEditor: renders all array values, in the right order" failed: [...] Expected ["value1","value2","value3"] to equal ["value1","value3","value2"]. First difference at path: ["1"]`, so the case is not vacuous. The run prints no React act warning. In `tests/4_view/JzodElementEditor.test.tsx`, the case is replaced by a comment in `getJzodArrayEditorTests`. "miroirTestLeaf has 5 members" is deleted from `pre-286 inventory`.

**Refactor checkpoint.** `componentTestManifest.ts` has no import, and the generator runs under `tsx` importing only it. `npm run testMiroir -w miroir-core` loads the new suite, and vitest reports `JzodArrayEditor: renders all array values, in the right order` as passed. With `MIROIR_TEST_VERBOSE_TRACKING=1 MIROIR_TEST_SUITES=JzodElementEditor_ComponentTestSuite`, the tracker records `"assertionResult": "skipped"` with `"assertionActualValue": "reactComponentTest requires a registered component test runner"`.

**Validation.**

- `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`: both succeed.
- `npm run testByFile -w miroir-core -- reactComponentLeaf.286.phase2`: 4 passed.
- `npm run testMiroir -w miroir-core`: 727 passed, the new leaf among them, skipped in the tracker.
- `npm run testByFile -w miroir-standalone-app -- miroir-component-tests`: 2 passed (1 case, 1 entry check).
- `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test`: 67 passed. Its case list, reduced as in Slice 0 and diffed against `baseline-JzodElementEditor.txt`, differs only by the missing line `JzodArrayEditor - jzodElementEditor - renders all array values, in the right order: passed`.
- `npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts`: 153 passed.
- `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0`: 5 passed.
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`: 0 errors.
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json`: 1 error, the baseline `JzodElementEditorHooks.ts(528,59)` TS2339.
- `python scripts/check_bare_console.py`: OK.

**Files created.** `packages/miroir-core/src/5_tests/ReactComponentTestTools.ts`. `packages/miroir-core/tests/1_core/issues/286-react-component-miroir-tests/reactComponentLeaf.286.phase2.unit.test.ts`. In `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/`: `componentTestEnvironment.ts`, `componentTestManifest.ts`, `componentTestRegistry.ts`, `runReactComponentTest.tsx`, and `jzodElementEditor/JzodArrayEditor.tsx`. `packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts`. `packages/miroir-standalone-app/tests/4_view/miroir-component-tests.unit.test.tsx`. The instance `761d4ed2-….json`, written by the generator.

**Files changed.** miroir-core: `src/0_interfaces/5-tests/miroirTestTypes.ts`, `src/1_core/testing/test-expect.ts`, `src/3_controllers/ConfigurationService.ts`, `src/5_tests/MiroirTestTools.ts`, `src/5_tests/inferIntegrationSessionKind.ts`, `src/index.ts`, and the regenerated `preprocessor-generated/miroirFundamentalJzodSchema.ts` and `miroirFundamentalType.ts`. Deployment miroir: the Entity and EntityVersion JSON, and, by the generator, `index.ts`, `index.d.ts`, and `src/Model.ts`. App: `tests/4_view/JzodElementEditor.test.tsx` and `tests/4_view/issues/286-react-component-miroir-tests/componentMiroirTests.286.phase0.unit.test.tsx`. This plan.

---

## Slice 3: Array suite complete in vitest

**Status:** ✅ DONE

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

**RED observed.**

- Before the RED run, a pure refactor of the generator: `serializeComponentTestSuiteInstance(manifest)` (the 2-space CRLF JSON it writes) and `componentTestSuiteInstancePath` are exported from `scripts/generate-component-miroir-tests.ts`, and `main()` uses them, so the consistency test fails on behavior and not on an import.
- miroir-core `throwingExpect.286.phase3` (9 tests): 7 failed, 2 passed. `toEqual` with an `undefined`-valued key threw `MiroirAssertionError: [throwingExpect.286.phase3] Expected {"a":1} to equal {"a":1}. First difference at path: ["b"]` (JSON drops the key, so the message shows two equal values). `getState` failed with `TypeError: throwingExpect.getState is not a function`. The 5 DOM matcher tests failed with `TypeError: throwingExpect(...).toBeInTheDocument is not a function`, and the same for `.not.toBeInTheDocument`, `toHaveValue`, `toBeChecked`, and `toContainHTML`. The 2 tests that passed already are "toEqual of different values throws with both values in the message" and "the second argument of expect appears in the failure", which Slice 2 already gave.
- `domMatchersParity.286.phase3` (4 tests): 4 failed. The throwing `expect` had no DOM matcher, so each call threw a `TypeError`, counted as a fail, and the outcome list differed from jest-dom's (`expected [ …(6) ] to deeply equal [ …(6) ]`).
- `extractValuesScoped.286.phase3` (2 tests): 2 failed. The outside input was read (`expected { outside: 'outsideValue', …(1) } to deeply equal { inside: 'insideValue' }`), and the option list outside the root and the portal element was read together with the one in the portal element.
- `componentMiroirTests.consistency` with the comparison function stubbed to return `[]` (6 tests): 3 failed, 3 passed. The 3 fixture cases that must report a problem failed with `expected [] to deeply equal [ Array(1) ]`. The real-data check, the byte-identical check, and the consistent-fixtures check passed, as expected at that point.
- New entry, after adding the 11 cases to the manifest and to `JzodArrayEditor.tsx` as stubs throwing "not migrated" and re-running the generator (one write, then "no change" on a second run): `testByFile` stops at the first failure because of `--bail=1`, so the file was also run with `npx vitest run` without bail (same env, `VITE_TEST_MODE=true`): 11 failed, 2 passed (the Slice 2 case and the entry check). Each failure reads `reactComponentTest "JzodElementEditor_ComponentTestSuite#JzodArrayEditor#JzodArrayEditor: <case>" failed: not migrated`.

**GREEN, miroir-core.** `src/1_core/testing/test-expect.ts`, throwing `expect` only. The non-throwing `expect` is unchanged, so the phase0 stable assertions on it still hold.

- `toEqual` compares copies of both values without the object keys whose value is `undefined` (plain objects, recursively; array entries are kept). `.not.toEqual` uses the same rule.
- DOM matchers `toBeInTheDocument`, `toHaveValue(expected?)`, `toBeChecked`, and `toContainHTML(html)`, and their `.not` forms. They read properties only, with no `instanceof`. `toBeInTheDocument` checks `ownerDocument.contains(element)`. `toHaveValue` reads the value of an input, select, or textarea, with `type="number"` read as a number, or `null` when empty, and a multiple select read as the list of selected values. It compares with `fast-deep-equal`, or checks for a non-empty value when no argument is given. `toBeChecked` reads `checked`, or `aria-checked="true"` when there is no boolean `checked`. `toContainHTML` checks that `outerHTML` contains the HTML normalized through the element's document, as jest-dom does. A `null` or `undefined` actual fails the positive form with a message and passes the `.not` form.
- `.not` of every matcher now inverts the positive matcher of the throwing `expect` (so it gets the `toEqual` rule and the DOM matchers), with the message `[<label>] [not] Unexpected pass for <matcher>`.
- `createThrowingExpect(testName)` returns a function with `getState()` giving `{ currentTestName: testName }`. `ThrowingExpect` now includes `getState`, and `ThrowingMatchers` the new `ThrowingDomMatchers` interface, exported from `index.ts`.

**GREEN, app.**

- `componentTestTools.tsx`: `extractValuesFromRenderedElements(expect, filter, root, label, step, detectOptions, portalElement?)`. `root` is required, and `portalElement` is a new optional last argument. It searches `root` and `portalElement` only. A root contained in the other is dropped, so no element is read twice. The combobox option search looks in the search roots instead of `document.querySelector('[role="listbox"]')` and `document.body`, and the foreign key select and state tracker lookups use the search roots instead of `container`. The unused `Container` import is removed.
- Deviation from the plan text: the tests-side `extractValuesFromRenderedElements` in `tests/4_view/JzodElementEditorTestTools.tsx` is now a wrapper with the old signature. It passes `container ?? document` as root and `document.body` as portal element. The plan says "passing `document` when no root is given". Passing only the container when one is given would have broken the old Enum and Any suites, which read option lists portaled to `document.body`, so the wrapper keeps searching the whole page for every caller, as before. The only difference: the foreign key `select[data-testid="miroirInput"]` lookup, which read only `container`, now reads the whole body through this wrapper. No importer's count changed.
- `jzodElementEditor/JzodArrayEditor.tsx`: the 11 remaining bodies ported from `getJzodArrayEditorTests` with the §5.3 rules: `screen` to `env.view`, `expect` to `env.expect`, `container` to `env.container` (the root of every `extractValuesFromRenderedElements` call), `log` to `env.log`, `expect.getState()` to `env.expect.getState()`, React `act` to `env.act`, `fireEvent` to `env.fireEvent`, and `waitAfterUserInteraction()` to the act-free `waitAfterUserInteraction(env.container)` from `componentTestEnvironment.ts`. The 3 `screen.debug` calls are deleted. The case props are the old ones, without the commented-out `e` bigint lines. The textbox value reading, shared by 4 cases, is a local helper `arrayItemTextBoxValues(env)`. No assertion changed. Two assertions were already weak in the old file and are kept as they are. "renders array input with label when label prop is provided" asserts that `/Test Label/` matches exactly 1 element, while its old comment says two labels are shown: the count is 1 in both runs, so the comment is stale, not the assertion. "duplicate an element in a string array…" asserts `toBeTruthy()` on the result of `getByRole`, which already throws when the button is missing.
- Non-vacuity check, then reverted: with `toContainHTML("new valueX")` and `toEqual([...arrayValues])` in two cases, the entry gave 2 failed and 11 passed, with `Expected <input name="TESTSECTION.testField.1"> to contain HTML "new valueX"` and `Expected ["value1","value2","value3",""] to equal ["value1","value2","value3"]. First difference at path: ["3"]`.
- No case needed a change to the act-free driver: all 12 passed at their first run. K1 did not show up for the Array suite.
- `tests/4_view/componentMiroirTests.consistency.unit.test.ts` exports `componentTestConsistencyProblems({ manifest, registry, instance })`, which returns one message per disagreement: a manifest case with no `reactComponentTest` leaf, a leaf not in the manifest, a leaf label other than `<suite>: <case>`, a manifest suite or case missing from the registry, a registry suite or case missing from the manifest, and a leaf label used more than once in the instance. The file checks the real manifest, registry, and JSON (no problem). It checks that `serializeComponentTestSuiteInstance(componentTestManifest)` equals the JSON file byte for byte. It runs the function on 4 fixtures (consistent, missing leaf, extra registry case, duplicate label), each with its exact expected message list.
- Old file: `getJzodArrayEditorTests`, its two types, and the `JzodArrayEditor` entry of `jzodElementEditorTests` are deleted and replaced by a comment that points to the new file. Phase0: the outside-input assertion is deleted from `pre-286 inventory`, and `JzodArrayEditor` is removed from the expected suite list (the test is renamed "declares the active suite keys not yet migrated").

**Refactor checkpoint.** No `screen` identifier outside comments, no `screen.debug`, and no bare `console.*` in `componentTests/`.

**Validation** (one command per file, from the repo root).

- `npx tsx packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts`: "1 suite(s), 12 case(s)", "no change".
- `npm run build -w miroir-test-app_deployment-miroir`: success. `npm run build -w miroir-core` was also run, so that the app tests use the new `test-expect.ts`.
- `npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts`: 153 passed.
- `npm run testByFile -w miroir-core -- throwingExpect.286.phase3`: 9 passed.
- `npm run testByFile -w miroir-standalone-app -- domMatchersParity.286.phase3`: 4 passed (27 matcher calls compared with jest-dom).
- `npm run testByFile -w miroir-standalone-app -- extractValuesScoped.286.phase3`: 2 passed.
- `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency`: 6 passed.
- `npm run testByFile -w miroir-standalone-app -- miroir-component-tests`: 13 passed (12 Array cases and the entry check), no React act warning. The Array case list, reduced to `<case>: passed`, is identical to the 12 `JzodArrayEditor` lines of `baseline-JzodElementEditor.txt`.
- `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test`: 56 passed. Its reduced case list equals the 56 non-Array lines of the baseline.
- `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0`: 4 passed.
- `npm run testByFile -w miroir-standalone-app -- extractValuesFromRenderedElements`: 4 passed, the Slice 0 count.
- `python scripts/check_bare_console.py`: OK.
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`: 0 errors.
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json`: 1 error, the baseline `JzodElementEditorHooks.ts(528,59)` TS2339.
- Extra check, since this importer calls the tests-side wrapper: `npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepProcess.274.integ`: 19 passed, the Slice 0 count.

**Files created.** `packages/miroir-core/tests/1_core/issues/286-react-component-miroir-tests/throwingExpect.286.phase3.unit.test.ts`. In `packages/miroir-standalone-app/tests/4_view/issues/286-react-component-miroir-tests/`: `domMatchersParity.286.phase3.unit.test.tsx` and `extractValuesScoped.286.phase3.unit.test.tsx`. `packages/miroir-standalone-app/tests/4_view/componentMiroirTests.consistency.unit.test.ts`.

**Files changed.** miroir-core: `src/1_core/testing/test-expect.ts` and `src/index.ts`. App: `scripts/generate-component-miroir-tests.ts`, and in `src/miroir-fwk/4-tests/componentTests/`: `componentTestManifest.ts`, `componentTestTools.tsx`, and `jzodElementEditor/JzodArrayEditor.tsx`. Tests: `tests/4_view/JzodElementEditorTestTools.tsx`, `tests/4_view/JzodElementEditor.test.tsx`, and `componentMiroirTests.286.phase0.unit.test.tsx`. Deployment miroir: the instance `761d4ed2-….json`, written by the generator (12 leaves). This plan.

**Note for Slice 5.** The src `extractValuesFromRenderedElements` reads portaled option lists only from its `portalElement` argument. The Enum bodies that read the dropdown options must pass `env.portalElement` as its seventh argument, with `env.container` as root.

---

## Slice 4: Array suite runs in the app sandbox

**Status:** ✅ DONE

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

**Stub before RED.** `src/miroir-fwk/4_view/tools/ComponentTestModeContext.ts` was created first (the context, its default `{ progressiveRenderDisabled: false, codeMirrorPlaceholder: false }`, `componentTestSandboxMode` with both flags `true`, and `useComponentTestMode()`), read by nobody, so that the unit test fails on behavior and not on an import.

**RED observed** (run with `npx vitest run` without bail, `VITE_TEST_MODE=true`, so that every test of a file is reported).

- `componentTestMode.286.phase4` (2 tests): 2 failed. With the sandbox mode context, `expected 'Test Objectexpand_less…' not to match /Loading .+\.\.\./`: `useViewportReveal` did not read the context, so the attribute `testField` was a progressive-reveal placeholder. Without the context, after switching the root object to code editor display, `expected 'codeMirrorValue: {…' not to contain 'codeMirrorValue:'`: the module-level `isUnderTest` was `true` whatever the environment.
- `componentTestSandbox.286.phase4` (2 tests): 2 failed. After the click on "Run JzodElementEditor_ComponentTestSuite Unit Tests", `onTestComplete` gave the 12 Array leaves as `skipped` with `assertionActualValue` "reactComponentTest requires a registered component test runner" (no sandbox, no runner), so the "12 ok" check failed. The failing-case test failed with `expected [] to have a length of 11 but got +0`.

**Deviation, unit test harness.** The plan says `vi.stubEnv("VITE_TEST_MODE", "false")` plus `vi.resetModules()`. A probe test showed that this does not reach the src modules: `isVitestTestMode()` still returned `true` after the stub and the reset, because Vite replaces `import.meta.env` in transformed modules at transform time and the reset does not transform them again. The test keeps the stub, and also mocks `isVitestTestMode` to return `false` (`vi.doMock` of `progressiveRenderConfig`, then `vi.resetModules()` and dynamic imports of `JzodElementEditor`, the context module, and `componentTestTools`). `JzodElementEditor` now reads the test mode through the same `isVitestTestMode()`, so the mock covers both forks. Two more findings: in happy-dom the `Loading …` placeholders are never revealed without the context (IntersectionObserver never reports an intersection), and the switch that opens the code editor is on the form's root object (`displayAsStructuredElementSwitch-`, rootLessListKey `""`), which holds `testField` as an attribute. The analysis says that a hidden CodeMirror mounts in every object node; in fact `JzodElementEditorReactCodeMirror` renders only in code editor display, so the tests switch the root to code editor display and then look for the `codeMirrorValue:` box or the real "Format JSON" button.

**GREEN.**

- `useViewportReveal`: reveals at once when `isVitestTestMode()` or the context's `progressiveRenderDisabled` is true.
- `JzodElementEditor`: the module-level `isUnderTest` and its two load-time log lines are gone. `isUnderTest` is computed in the component at render time as `isVitestTestMode() || useComponentTestMode().codeMirrorPlaceholder`. This also fixes a latent bug: the old check was truthy for any value of `VITE_TEST_MODE`, including `"false"`. Under vitest the value is `"true"`, so the vitest path is unchanged.
- `runReactComponentTest.tsx`: the component is mounted inside `ComponentTestModeContext.Provider value={componentTestSandboxMode}` (outside the wrapper, so the 14 importers of `buildComponentTestWrapper` are unchanged). After the case that is the last of its suite in registry order, whatever its outcome, the runner calls `miroirEventService.destroy()` on the suite wrapper and forgets it. The runner is returned with a `close()` method: it unmounts the current case, removes its container, removes the portal element when the runner created it, and destroys any wrapper still open.
- New `src/miroir-fwk/4-tests/componentTests/index.ts`: `registerComponentTests(host)` creates the runner, registers it with `ConfigurationService.registerReactComponentTestRunner`, and returns `{ close }`, which closes the runner and unregisters it if it is still the registered one.
- New `src/miroir-fwk/4_view/components/Reports/ComponentTestSandbox.tsx`: `ComponentTestSandboxProvider` (context with `prepareComponentTests()`) and the `ComponentTestSandbox` panel (`data-testid="component-test-sandbox-panel"`, hidden with `display: none` until a run, a "Close" button with `aria-label="Close component test sandbox"`, and the sandbox element `data-testid="component-test-sandbox"`, never a render target). `prepareComponentTests()` closes the previous registration, loads the chunk with the one `import("../../../4-tests/componentTests/index.js")` of the app, registers the runner over the sandbox element, and shows the panel. The close button closes the registration and hides the panel. On unmount the provider closes the registration in a `setTimeout(0)`: closing synchronously in the effect cleanup unmounts the case's React root during React's commit, and React warned "Attempted to synchronously unmount a root while React was already rendering" (seen once in the integ test before this change).
- `MiroirTestDisplay`: now `<ComponentTestSandboxProvider><MiroirTestDisplayContent/></ComponentTestSandboxProvider>`. The unit `RunMiroirTestSuiteButton` gets `beforeRun={prepareComponentTests}`. New optional prop `testFilter` (a `MiroirTestRunFilter`), used when the results grid has no selection. The integ test uses it to limit the run to the `JzodArrayEditor` sub-suite: `{ testList: { JzodElementEditor_ComponentTestSuite: { JzodArrayEditor: [12 leaf labels] } } }`.
- `RunMiroirTestSuiteButton`: optional `beforeRun`. The unit action awaits it before `resetResults()` when `miroirTestDefinitionHasReactComponentTest(suite.definition)` is true. That helper is new in `miroirTestSuiteUiExecution.ts` and looks for a `reactComponentTest` leaf at any depth.
- `miroir-standalone-app/package.json`: `@testing-library/dom` (^10.4.0) and `@testing-library/user-event` (^14.4.3) moved from `devDependencies` to `dependencies`. `npm install --package-lock-only --ignore-scripts` updated `package-lock.json` (13 lines): the two entries move in the workspace's `packages/miroir-standalone-app` block, and `"dev": true` is removed from `@testing-library/dom`, `@testing-library/user-event`, and their runtime dependencies `@types/aria-query`, `aria-query`, `dom-accessibility-api`, `lz-string`, `pretty-format` and its nested `ansi-styles` and `react-is`. No version changed.

**Integ test harness.** `componentTestSandbox.286.phase4.integ.test.tsx` mounts `LocalCacheProvider` and `MiroirContextReactProvider` (and `ReportPageContextProvider`) over a real `LocalCache` seeded with the Miroir meta-model the way `buildComponentTestWrapper` seeds it (entities, entity versions, Jzod schemas, menus, application versions, reports, then a rollback), with its own `MiroirActivityTracker`, `MiroirEventService`, and `MiroirContext`. There are no mocks except `buildComponentTestWrapper`, which is wrapped in `vi.fn(actual)` through `vi.mock` of `componentTestTools` with `importOriginal`, because `vi.spyOn` cannot redefine an ESM export. `MiroirEventService.prototype.destroy` is spied on. The instance is read from the `miroir_data` JSON file. The real `TestExecutionPanel` renders with `gridType="ag-grid"`. The `@testing-library/dom` config is saved with `getConfig()` before the click and restored with `configure()` after `onTestComplete`. Results come from `onTestComplete` (the `testName` of `generateTestReport` is the full path `JzodElementEditor_ComponentTestSuite > JzodArrayEditor > <leaf label>`, so the test compares the last `testPath` element) and from `getTestAssertionsResults([])` of the harness tracker. Test 1 checks: 12 `ok`, the tracker has no `"error"`, the panel is visible, `testImplementation` is the same object, the harness `LocalCache` state JSON is equal to the one taken before the run, `buildComponentTestWrapper` was called once, `destroy` was called once, one case container is still in the sandbox with the Array inputs, and after the close button the panel is hidden, no container remains, and `destroy` is still called once. Test 2 replaces case 2 ("renders all array values, in the right order") in `componentTestRegistry` with a body asserting `toBeInTheDocument()` on a detached element, restored in `finally`: 11 `ok`, 1 `error` on that leaf, the tracker holds "to be in the document", and the 10 later cases are `ok`.

**Bundle guard (§4.3).** `vite.config.js` sets `build.manifest: true`. `componentTestChunk.286.phase4.unit.test.ts` reads `dist/.vite/manifest.json`. It throws "`<path>` is missing: run `npm run build -w miroir-standalone-app` first" when the manifest is missing (observed before the first build: the file failed at collection with that message), and "`<manifest>` is older than `<newest src file>` (the build is stale): run … first" when a file under `src/` is newer. A missing `.map` gives the same hint. It has 4 tests: `index.html` is the only entry. No chunk in the static `imports` closure of the entry has a sourcemap source under `node_modules/@testing-library/`. `componentTests/index.ts` is a dynamic entry that is not in that closure. The chunks that the component test import adds to the entry closure have no source under `node_modules/@testing-library/react/` and none from `routes/TransformerBuilderPage`, and they do contain `@testing-library/dom`, `@testing-library/user-event`, and `componentTests/jzodElementEditor/JzodArrayEditor`, so the guard is not vacuous. Deviation from the plan text: the second check uses the chunks added by the dynamic import (its closure minus the entry closure), not the whole closure, because shared entry chunks are loaded anyway. In the build, the entry closure has 7 chunks. The component import adds 3: `index-CXkl9J_1.js` (all of `componentTests/` and user-event), `dom.esm-BiGL4lfc.js` (`@testing-library/dom`, shared with the integration launcher chunk), and `emptyObject-….js`. `@testing-library/react` appears only in the lazy `standaloneAppBrowserIntegrationOrchestrator` chunk, and `TransformerBuilderPage` only in its own lazy chunk. `ComponentTestSandbox.tsx` is in the lazy `ReportDisplay` chunk, and `ComponentTestModeContext.ts` in the main chunk.

**Browser checks (§4.4), automated with `playwright-core` installed only in the session scratchpad and driving the installed Microsoft Edge (headless).** A Vite dev server (port 5173, this repo) and a production `miroir-server` (`run:prod`, port 3080, HTTPS, authentication on) were already running when the work started. They were not started by this slice and were left running. The script logs in as the seed user `alice`, opens `?page=report&application=360fcf1f-…&deploymentUuid=10ff36f2-…&applicationSection=data&reportUuid=0ad63f27-…&instanceUuid=761d4ed2-…` (the MiroirTestDetails report of the new instance), clicks "Run JzodElementEditor_ComponentTestSuite Unit Tests", waits for the snackbar, reads the results panel and the sandbox, clicks Close, and then navigates client-side (`history.pushState` and `popstate`, no reload) to the Library Book list report (`application=5af03c98-…`, `deploymentUuid=f714bb2f-…`, `reportUuid=74b010b6-…`).

- Development build (Vite dev server on 5173): the panel showed about 1 s after the click and the run ended after about 5.3 s. The panel read "Tests ✓ Passed: 12/12, Assertions ✓ Passed: 12/12, Overall Status PASSED", with 12 rows "Pass / ok / All 1 assertions passed". The snackbar read "JzodElementEditor_ComponentTestSuite Miroir tests completed successfully". The sandbox kept one case container (the last case, "duplicate an element…", inputs `value1, value2, value2, value3`). No browser console message matched `act(`. After Close, the panel was hidden and no container remained. The Library Book list then rendered its rows. Screenshots before and after the run show the same page chrome: the serif title "Miroir Test Available" is serif in both, so it is not a sandbox leak. The only error in the console was a 403 on `/action/storeManagementAction_openStore` during page load (alice is denied a store at configuration load), not linked to the sandbox.
- Production build: the running `run:prod` server serves `release/client` from an August 26 build, and replacing or restarting a server this slice did not start was avoided, so `copy:client`, `build:release`, and `run:prod` were not run and nothing was written into `miroir-server/release`. Instead, the `dist` built by `npm run build -w miroir-standalone-app` (the same files `copy:client` copies) was served by `vite preview` on port 3000, the one port besides 5173 that the server's default CORS list allows. The API went to the same server on 3080. The bundle is a production React build: its `vendor-react` chunk contains "act(...) is not supported in production builds of React.". Result: the same as in development. 12/12 passed in about 4.7 s, 0 `act(` message, the sandbox kept the last case, Close hid the panel and removed it, and the Library Book list rendered afterwards. The "Running in production mode - serving React SPA" server log line was not checked, because the check did not go through `run:prod`. The `vite preview` server was stopped after the check.

No case passed in vitest and failed in the browser. K1 did not show up.

**Validation** (one command per file, from the repo root).

- `npm run testByFile -w miroir-standalone-app -- componentTestSandbox.286.phase4`: 2 passed.
- `npm run testByFile -w miroir-standalone-app -- componentTestMode.286.phase4`: 2 passed.
- `npm run build -w miroir-standalone-app`: success (3 min 25 s).
- `npm run testByFile -w miroir-standalone-app -- componentTestChunk.286.phase4`: 4 passed.
- `npm run testByFile -w miroir-standalone-app -- miroir-component-tests`: 13 passed (12 Array cases and the entry check).
- `npm run testByFile -w miroir-standalone-app -- MiroirTestDisplay.unit`: 5 passed.
- `npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-sql MiroirTestDisplayIntegrationLaunch`: 1 passed (local Postgres 15 on 5432).
- `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test`: 56 passed, the Slice 3 count.
- `python scripts/check_bare_console.py`: OK.
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`: 0 errors. `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json`: 1 error, the baseline `JzodElementEditorHooks.ts(528,59)` TS2339.
- Extra, for files touched indirectly (one command each, same counts as Slice 3 or Slice 0): `componentMiroirTests.286.phase0` 4 passed, `--profile emulatedServer-filesystem multistepProcess.274.integ` 19 passed, `--profile emulatedServer-filesystem wizardWalk.284.integ` 11 passed, `gridPagination.unit` 28 passed, `componentMiroirTests.consistency` 6 passed, `extractValuesFromRenderedElements` 4 passed. The integ test was re-run after a last import clean-up: 2 passed.

**Files created.** In `packages/miroir-standalone-app/src/miroir-fwk/`: `4_view/tools/ComponentTestModeContext.ts`, `4_view/components/Reports/ComponentTestSandbox.tsx`, and `4-tests/componentTests/index.ts`. In `packages/miroir-standalone-app/tests/4_view/issues/286-react-component-miroir-tests/`: `componentTestSandbox.286.phase4.integ.test.tsx`, `componentTestMode.286.phase4.unit.test.tsx`, and `componentTestChunk.286.phase4.unit.test.ts`.

**Files changed.** In `packages/miroir-standalone-app/`: `package.json`, `vite.config.js`, and in `src/miroir-fwk/`: `4-tests/componentTests/runReactComponentTest.tsx`, `4-tests/miroirTestSuiteUiExecution.ts`, `4_view/components/Buttons/RunMiroirTestSuiteButton.tsx`, `4_view/components/Reports/MiroirTestDisplay.tsx`, `4_view/components/ValueObjectEditor/JzodElementEditor.tsx`, and `4_view/tools/useViewportReveal.ts`. The root `package-lock.json`. This plan. `dist/` is rebuilt and ignored by git. Nothing under `miroir-server/release` changed.

---

## Slice 5: Enum suite with the portal dropdown (pilot complete)

**Status:** ✅ DONE

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

**RED observed.**

- The 3 Enum cases were ported first (not as stubs, since §5.1 expects a behavioral failure) into the new `jzodElementEditor/JzodEnumEditor.tsx`, added to the manifest (`JzodEnumEditor`, 3 cases) and the registry, and the generator was re-run: "2 suite(s), 15 case(s)", one write of the instance, then "no change" on a second run. The new entry, run with `npx vitest run` without bail (`VITE_TEST_MODE=true`): 2 failed, 14 passed. "renders all enum options" failed with `Expected {"testField":"value2"} to equal {"testField":"value2","TESTSECTION.options":["value1","value2","value3"]}. First difference at path: ["TESTSECTION.options"]`, and "form state is changed when selection changes" with `Expected {"testField":"value3"} to equal {"testField":"value3","TESTSECTION.options":["value3"]}`: the option list was portaled to `document.body`, outside the root and the portal element that the value reader searches. "renders select with correct value" passed, since it reads no option list. The failure of the second case is not named in §5.1, but it has the same cause.
- Stub before the unit test RED: `src/miroir-fwk/4_view/tools/PortalContainerContext.tsx` with the context, `usePortalContainer()`, and a `PortalContainerProvider` that set only the context, read by nobody. `portalContainer.286.phase5` (3 tests): 2 failed, 1 passed. "renders its options in the PortalContainerContext element" failed with `expected [] to deeply equal [ 'value1', 'value2', 'value3' ]` (no option in the portal element). The MUI test failed with `expected false to be true` (the listbox was not in the portal element). "without the context … document.body" passed, as it characterizes the current behavior.

**GREEN.**

- `PortalContainerContext.tsx`: `PortalContainerContext` (default `undefined`), `usePortalContainer()` (the context value, or `document.body`), `portalContainerMuiComponents(container)` (the `theme.components` entries `MuiPopover`, `MuiPopper`, `MuiModal`, `MuiMenu` with `defaultProps: { container }`), and `PortalContainerProvider({ portalElement })`, which sets the context and a MUI `DefaultPropsProvider` with those entries.
- Deviation from analysis §5.4 ("MUI 5 `useThemeProps` reads the emotion theme"): in MUI 5.17.1, `Popover`, `Modal`, `Menu`, and `Popper` read their theme default props through `useDefaultProps`, whose context is the `DefaultPropsProvider` that only the MUI `ThemeProvider` sets. A probe with a nested emotion `ThemeProvider` showed the `MuiPopover` entry through `useTheme()`, while the `Popover` still rendered in `document.body`. The wrapper of `buildComponentTestWrapper` uses the emotion `ThemeProvider`, so a nested emotion theme has no effect. The MUI `ThemeProvider` with a function theme was not used either: with no outer MUI private theme, it logs "MUI: You are providing a theme function prop … However, no outer theme is present" in development. `PortalContainerProvider` therefore sets `DefaultPropsProvider` itself (`@mui/material/DefaultPropsProvider`), with the four popup entries only, and leaves the emotion theme unchanged. The sandbox renders in its own React root, so there is no outer `DefaultPropsProvider` to merge with, and the `testThemeParams` default props (`MuiContainer`, `MuiToolbar`) stay inactive, as before.
- `FormComponents.tsx`, `ThemedSelectWithPortal`: reads `usePortalContainer()` once at the top of the component (before the `filterable` branch, so the hook order does not change). The option list is portaled to that element. The outside-click `mousedown` listener is registered on `portalContainer.ownerDocument`, and a click counts as a click on an option only when the target is inside the portal container and under `[data-dropdown-option]`. The effect depends on `[isOpen, portalContainer]`. With no context the behavior is the one before #286 (`document.body`, `document`).
- `runReactComponentTest.tsx`: the component is mounted as `<Wrapper><PortalContainerProvider portalElement={portalElement}><Component/></PortalContainerProvider></Wrapper>`, inside `ComponentTestModeContext` as before. The runner is used by the vitest entry and by `registerComponentTests` in the app sandbox, so both paths set the context and the MUI defaults to the portal element, a child of the sandbox element.
- `jzodElementEditor/JzodEnumEditor.tsx`: the suite props of `getJzodEnumEditorTests` and its 3 active cases, with the §5.3 rules (`screen` to `env.view`, `expect` to `env.expect`, `container` to `env.container`, `userEvent` to `env.userEvent`, React `act` to `env.act`, `waitFor` to `env.waitFor`, `fireEvent` to `env.fireEvent`). The 3 `screen.debug` calls are deleted, and the 2 `console.log` calls became `env.log.info`. Every `extractValuesFromRenderedElements` call passes `env.container` as root and `env.portalElement` as 7th argument (the Slice 3 note), with the old `detectOptions` values (`false`, `true`, and `false` where the old call gave none). The click and the wait for `data-test-is-open` are a local helper `openDropdown(env, select, stateTracker)`. In "form state is changed…", the old single `act` (open, wait, clear, type) became two `env.act` calls in the same order: open and wait, then clear and type. The 2 commented-out cases of the old factory were not ported. No assertion changed.
- Old file: `getJzodEnumEditorTests`, its two types, and the `JzodEnumEditor` entry of `jzodElementEditorTests` are deleted and replaced by a comment that points to the new file. Phase0: `JzodEnumEditor` is removed from the expected suite list.
- `componentTestSandbox.286.phase4.integ.test.tsx` (Slice 4 test, changed): it failed once the instance had a second sub-suite, with `onTestComplete was called: expected undefined to be defined` and the client error `MiroirTest filter matched no tests in suite "JzodEnumEditor"`. The Run button walks from an empty suite path, so the sub-suites are at depth 1, where miroir-core `resolveSuiteInnerFilter` sets `throwOnUnmatched` and throws on a filter that does not name the sub-suite. The test filter now lists every manifest sub-suite, the Array one with its 12 leaf labels and the others with an empty list, which records their leaves as skipped without calling the runner. No product code changed for this. Finding for later: in the app, a `testFilter` that names one sub-suite of a multi-sub-suite instance throws in the same way when run from `RunMiroirTestSuiteButton` (depth 1 from the empty path). Slice 6 (Run all) should keep this in mind.
- K1: no case needed a change to the act-free driver. The 3 Enum cases passed at their first GREEN run, and no React act warning was printed.

**Pilot checkpoint (§5.3).** The new entry's verbose case list, reduced to `<suite> - jzodElementEditor - <case>: <status>`, is identical to the 15 `JzodArrayEditor` and `JzodEnumEditor` lines of `baseline-JzodElementEditor.txt` (15 lines on each side, `diff` empty, all passed). The old suite's reduced list is identical to the 53 other lines of the baseline.

**Browser checks (§4.4), same method as Slice 4** (`playwright-core` in the session scratchpad, headless Microsoft Edge, seed user `alice`, the MiroirTestDetails report of instance `761d4ed2-…`, then a client-side navigation to the Library Book list). The script also counted the `role="option"` elements outside the sandbox and read the sandbox portal element.

- Development build (the Vite dev server on 5173, already running, not restarted): the panel showed after about 1.1 s and the run ended after about 6.4 s. The panel read "Passed: 15/15" and "PASSED", with 15 rows "All 1 assertions passed" (12 Array, 3 Enum), and the snackbar read "JzodElementEditor_ComponentTestSuite Miroir tests completed successfully". The sandbox kept the last case ("form state is changed when selection changes", input `TESTSECTION.testField=value3`), and its portal element held the open option list `["value3"]`, with 0 options outside the sandbox. 0 console messages matched `act(`. After Close, the panel was hidden and no container remained. The Library Book list then rendered its rows. The only console error was the same 403 on `/action/storeManagementAction_openStore` at page load as in Slice 4.
- Production build: `npm run build -w miroir-standalone-app` (2 min 30 s), then `vite preview --port 3000 --strictPort`, started by this slice over that `dist`, with the API on the running server on 3080 (not restarted). The `vendor-react` chunk contains "act(...) is not supported in production builds of React.". Result: 15/15 passed in about 4.7 s, the same sandbox state (portal option `["value3"]`, 0 options outside the sandbox), 0 `act(` message, Close hid the panel and removed the container, and the Library Book list rendered. The `vite preview` process, the only server started here, was stopped afterwards, and port 3000 is free.

No case passed in vitest and failed in the browser, and K1 did not show up. **Pilot clean.** Per the user's standing instruction, work continues with Slice 6 unless problems occur.

**Validation** (one command per file, from the repo root).

- `npx tsx packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts`: "2 suite(s), 15 case(s)", "no change".
- `npm run build -w miroir-test-app_deployment-miroir`: success.
- `npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts`: 153 passed.
- `npm run testByFile -w miroir-standalone-app -- portalContainer.286.phase5`: 3 passed.
- `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency`: 6 passed.
- `npm run testByFile -w miroir-standalone-app -- miroir-component-tests`: 16 passed (15 cases and the entry check), no React act warning.
- `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test`: 53 passed.
- `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0`: 4 passed.
- `npm run testByFile -w miroir-standalone-app -- componentTestSandbox.286.phase4`: 2 passed after the filter change above (1 failed before it).
- Extra: `npm run build -w miroir-standalone-app` succeeded, then `npm run testByFile -w miroir-standalone-app -- componentTestChunk.286.phase4`: 4 passed.
- `python scripts/check_bare_console.py`: OK.
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`: 0 errors. `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json`: 1 error, the baseline `JzodElementEditorHooks.ts(528,59)` TS2339.

**Files created.** `packages/miroir-standalone-app/src/miroir-fwk/4_view/tools/PortalContainerContext.tsx`, `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/jzodElementEditor/JzodEnumEditor.tsx`, and `packages/miroir-standalone-app/tests/4_view/issues/286-react-component-miroir-tests/portalContainer.286.phase5.unit.test.tsx`.

**Files changed.** In `packages/miroir-standalone-app/`: `src/miroir-fwk/4_view/components/Themes/FormComponents.tsx`, and in `src/miroir-fwk/4-tests/componentTests/`: `componentTestManifest.ts`, `componentTestRegistry.ts`, and `runReactComponentTest.tsx`. Tests: `tests/4_view/JzodElementEditor.test.tsx`, `componentMiroirTests.286.phase0.unit.test.tsx`, and `componentTestSandbox.286.phase4.integ.test.tsx`. Deployment miroir: the instance `761d4ed2-….json`, written by the generator (15 leaves in 2 sub-suites). This plan. `dist/` is rebuilt and ignored by git. Nothing under `miroir-server/release` changed.

---

## Slice 6: Run all with the "Include component tests" checkbox

**Status:** ✅ DONE

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

**Transformer suite chosen for the UI test.** `resolveConditionalSchema` (instance `10bd8532-8d3e-40ca-a029-b43a38d11ea0` in the `miroir_data` MiroirTest folder), 5 `transformerTest` leaves, all run in unit mode with `defaultMetaModelEnvironment`.

**RED observed.**

- miroir-core `excludeMiroirTestTypes.286.phase6` (3 tests, a suite of 2 `reactComponentTest` leaves around one `returnValue` `transformerTest` leaf, with a counting runner registered): 2 failed, 1 passed. With `excludeMiroirTestTypes: ["reactComponentTest"]` the runner was still called (`expected [ 'case A', 'case B' ] to deeply equal []`). With `excludeMiroirTestTypes: ["transformerTest"]` the transformer leaf still ran (`expected 'ok' to be 'skipped'`). The control test without exclusion passed, as expected.
- App `runAllComponentTests.286.phase6` (3 tests, run with `npx vitest run` without bail, `VITE_TEST_MODE=true`): 3 failed. The checkbox test and the "checkbox off" test failed with `Unable to find an accessible element with the role "checkbox" and name /include component tests/i`. The "checkbox on" test timed out at 180 s: `MiroirTestListDisplay` had no `onTestComplete` prop, so the test never got the results. After GREEN the two run tests got an explicit 300 s timeout, longer than their 250 s `waitFor`, so that a slow run fails with the wait message.

**GREEN, miroir-core.** `src/5_tests/MiroirTestTools.ts`: `excludeMiroirTestTypes?: MiroirTestLeaf["miroirTestType"][]` on the `"unit"` arm of `MiroirTestExecutionOptions`. `_runMiroirTestWithTracking` keeps the `parentSkip` / `leaf.skip` early return. Then, inside the same `trackTest` and `trackTestAssertion` as a normal leaf, it records an excluded leaf with `assertionResult: "skipped"` and an `assertionActualValue` from the new exported `miroirTestTypeExcludedMessage(type)` (`"<type> leaves are excluded from this run (excludeMiroirTestTypes)"`), and returns without calling `_runMiroirTest`. The message makes an excluded leaf distinguishable from a component leaf skipped for lack of a runner. `miroirTestTypeExcludedMessage` is exported from `src/index.ts`. The untracked path (`trackActionsBelow` false) does not check the option, as the plan says. `npm run build -w miroir-core` was run before the app tests.

**GREEN, app.**

- `RunAllMiroirTestsButton.tsx`: a new optional `beforeRun` prop and an `includeComponentTests` state, `true` by default. In unit mode the button is followed by a `<label>` with the checkbox "Include component tests". In integration mode the component returns the button alone, with no checkbox. The unit action awaits `beforeRun()` once, before the first suite, when the box is checked and at least one instance has a `reactComponentTest` leaf (`miroirTestDefinitionHasReactComponentTest`). It passes `{ executionMode: "unit" }` when the box is checked (the same object as before, so the existing unit test still sees it), and `{ executionMode: "unit", excludeMiroirTestTypes: ["reactComponentTest"] }` when it is unchecked, in which case `beforeRun` is not called.
- `MiroirTestListDisplay.tsx`: now `<ComponentTestSandboxProvider><MiroirTestListDisplayContent/></ComponentTestSandboxProvider>`, as in `MiroirTestDisplay`, so Run all has its own sandbox panel. The unit Run all button gets `beforeRun={componentTestSandbox?.prepareComponentTests}`. New optional prop `onTestComplete(resultsBySuiteKey)`, called after the list stores the results. The integ test reads the results from it.

**Integ test.** `runAllComponentTests.286.phase6.integ.test.tsx` uses the Slice 4 harness (a real `LocalCache` seeded with the Miroir meta-model, `LocalCacheProvider`, `MiroirContextReactProvider`, `ReportPageContextProvider`, and the dom config saved and restored around the run). It mounts `MiroirTestListDisplay` with the component suite instance and `resolveConditionalSchema`, both read from the `miroir_data` JSON. `vi.mock` of `componentTests/index.ts` with `importOriginal` wraps `registerComponentTests` in `vi.fn(actual)`. The expected component leaves are every `<suite>: <case>` of `componentTestManifest` (15 today).

- Test 1: the unit button "Run All Unit Tests" and exactly one "Include component tests" checkbox, checked. The narrowed list has no launchable integration suite, so the list shows no integration button. The test renders `RunAllMiroirTestsButton runMode="integration"` alone in the same providers and checks that it has no checkbox.
- Test 2 (checked): the component suite gives one `ok` per manifest leaf (15), `resolveConditionalSchema` gives 5 `ok`, `registerComponentTests` was called once, and the sandbox panel is visible. The test takes about 8 s.
- Test 3 (unchecked): the 15 component leaves are `skipped`, their results contain the exclusion message and not "requires a registered component test runner", `resolveConditionalSchema` gives 5 `ok`, `registerComponentTests` was not called, and the sandbox panel stays hidden.

The run prints no React act warning.

**Sub-suite filter finding (Slice 5), re-evaluated.** Run all passes an `undefined` filter to every suite, so `resolveSuiteInnerFilter` returns no list and never throws. This slice is not affected, and miroir-core was not changed for it. The throw remains for single-suite runs. `MiroirTestDisplay` passes `buildTestFilter(selection)` or its `testFilter` prop, and the walk starts from an empty path, so the sub-suites of a multi-sub-suite instance are at depth 1, where `throwOnUnmatched` is true (`miroirTestSuiteWalk.ts`, `testSuitePath.length === 1`). A filter that names only `JzodArrayEditor` then throws `MiroirTest filter matched no tests in suite "JzodEnumEditor"` when the walk reaches the Enum sub-suite. `buildTestFilter` builds that shape from a grid selection limited to one sub-suite, so a user who selects only Array rows and runs again should hit it. This was not checked in the browser here. It is a pre-existing miroir-core behavior. Follow-up, outside #286 unless a later slice needs it: either have `buildTestFilter` or `MiroirTestDisplay` fill the missing sibling sub-suites with an empty list (the workaround the phase4 test uses), or make `resolveSuiteInnerFilter` skip unnamed siblings at depth 1 instead of throwing.

**Validation** (one command per file, from the repo root).

- `npm run testByFile -w miroir-core -- excludeMiroirTestTypes.286.phase6`: 3 passed.
- `npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6`: 3 passed.
- `npm run testByFile -w miroir-standalone-app -- RunAllMiroirTestsButton`: 4 passed.
- `npm run testByFile -w miroir-standalone-app -- MiroirTestListDisplay`: 4 passed.
- `npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-sql MiroirTestListIntegrationLaunch`: 1 passed (local Postgres 15 on 5432).
- Re-runs: `miroir-component-tests` 16 passed (15 cases and the entry check). `JzodElementEditor.test` 53 passed. `componentMiroirTests.286.phase0` 4 passed. `componentTestSandbox.286.phase4` 2 passed. miroir-core `reactComponentLeaf.286.phase2` 4 passed.
- `npm run testMiroir -w miroir-core`: 741 passed. Slice 2 gave 727. The 14 extra tests are the 11 Array and 3 Enum component leaves added in Slices 3 and 5. This entry reports them as passed, and the tracker records them as skipped because no runner is registered.
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`: 0 errors. `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json`: 1 error, the baseline `JzodElementEditorHooks.ts(528,59)` TS2339.
- `python scripts/check_bare_console.py`: OK.

No browser check was run for this slice.

**Files created.** `packages/miroir-core/tests/1_core/issues/286-react-component-miroir-tests/excludeMiroirTestTypes.286.phase6.unit.test.ts`. `packages/miroir-standalone-app/tests/4_view/issues/286-react-component-miroir-tests/runAllComponentTests.286.phase6.integ.test.tsx`.

**Files changed.** miroir-core: `src/5_tests/MiroirTestTools.ts` and `src/index.ts` (`dist/` rebuilt). App: `src/miroir-fwk/4_view/components/Buttons/RunAllMiroirTestsButton.tsx` and `src/miroir-fwk/4_view/components/Reports/MiroirTestListDisplay.tsx`. This plan.

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

**Status:** Slices 7 and 8 ✅ DONE. Slices 9 to 11 ⬜.

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

#### Slice 7 realization (JzodLiteralEditor)

**RED observed.** The 3 Literal cases were added to `componentTestManifest.ts` (`JzodLiteralEditor`, after `JzodEnumEditor`) and to `componentTestRegistry.ts` through a new `jzodElementEditor/JzodLiteralEditor.tsx` whose 3 bodies threw "not migrated". The generator printed "3 suite(s), 18 case(s)" and wrote the instance once, then "no change" on a second run. `npm run build -w miroir-test-app_deployment-miroir` succeeded. The new entry, run with `npx vitest run` without bail (`VITE_TEST_MODE=true`): 3 failed, 16 passed (19). Each failure reads `reactComponentTest "JzodElementEditor_ComponentTestSuite#JzodLiteralEditor#JzodLiteralEditor: <case>" failed: not migrated`. The 15 Array and Enum cases and the entry check passed.

**GREEN.**

- `jzodElementEditor/JzodLiteralEditor.tsx`: the suite props of `getJzodLiteralEditorTests` and its 3 cases, with the §5.3 rules (`screen` to `env.view`, `expect` to `env.expect`, React `act` to `env.act`, `fireEvent` to `env.fireEvent`, and `waitAfterUserInteraction()` to the act-free `waitAfterUserInteraction(env.container)`). The one `console.log` became `env.log.info`. There was no `screen.debug`, no `userEvent`, and no `extractValuesFromRenderedElements` call, so no portal argument was needed.
- The old cases set `rawJzodSchema` through `jzodElementEditorProps`, a function applied to the case props, or to the suite props when the case has none. `ComponentTestCase` has only `props`, so a local `withLiteralSchema(props)` adds the literal schema: the two cases without props use `props: withLiteralSchema` (a function of the suite props), and "renders Literal input without label…" uses `props: withLiteralSchema({ …its old props without label })`. The rendered props are the same as in the old run. The suite props are the old ones, without `rawJzodSchema`.
- No assertion changed. "renders Literal input with label…" keeps `getAllByText(/Test Label/).length` `toBe(1)`, with its old comment. Non-vacuity check, then reverted: with `toBe(2)` and, in "setting new value", `queryByDisplayValue(/test-value/)` `.not.toBeInTheDocument()`, the Literal run gave 2 failed and 1 passed, with `Expected 1 to be 2` and `[not] Unexpected pass for toBeInTheDocument`.
- No case needed anything new in the environment (no matcher, portal, or test-mode fork). The 3 cases passed at their first GREEN run, with no React act warning.
- Old file: `getJzodLiteralEditorTests`, its two types (`JzodLiteralEditorTest`, `JzodLiteralEditorTestSuites`), and the `JzodLiteralEditor` entry of `jzodElementEditorTests` are deleted and replaced by a comment that points to the new file. Phase0: `JzodLiteralEditor` is removed from the expected suite list.

**Case list.** The new entry's `JzodLiteralEditor` lines, reduced to `<suite> - jzodElementEditor - <case>: <status>`, are identical to the 3 `JzodLiteralEditor` lines of `baseline-JzodElementEditor.txt` (`diff` empty). The old suite's reduced list (sorted) is identical to the 50 baseline lines that are not Array, Enum, or Literal.

**Browser check (§4.4), development build only.** Same script as Slice 5 (`playwright-core` in the session scratchpad, headless Microsoft Edge, seed user `alice`, the MiroirTestDetails report of instance `761d4ed2-…`), against the Vite dev server already running on `https://localhost:5173` (not restarted). The panel showed after about 0.9 s and the run ended after about 6.1 s: "Passed: 18/18", "PASSED", 18 rows "All 1 assertions passed" (12 Array, 3 Enum, 3 Literal), and the snackbar "JzodElementEditor_ComponentTestSuite Miroir tests completed successfully". The sandbox kept the last case ("setting new value", input value `test-value`), 0 console messages matched `act(`, and Close hid the panel and removed the container. The only console error was the known 403 on `/action/storeManagementAction_openStore` at page load. The Library navigation after the run was not checked this time. No production-build check was run for this slice.

**Validation** (one command per file, from the repo root).

- `npx tsx packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts`: "3 suite(s), 18 case(s)", "no change".
- `npm run build -w miroir-test-app_deployment-miroir`: success.
- `npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts`: 153 passed.
- `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency`: 6 passed.
- `npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodLiteralEditor"`: 3 passed, 16 skipped.
- `npm run testByFile -w miroir-standalone-app -- miroir-component-tests`: 19 passed (18 cases and the entry check), no React act warning.
- `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test`: 50 passed.
- `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0`: 4 passed.
- `npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6`: 3 passed (the manifest now gives 18 component leaves).
- `python scripts/check_bare_console.py`: OK.
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`: 0 errors. `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json`: 1 error, the baseline `JzodElementEditorHooks.ts(528,59)` TS2339.

**Files created.** `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/jzodElementEditor/JzodLiteralEditor.tsx`.

**Files changed.** In `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/`: `componentTestManifest.ts` and `componentTestRegistry.ts`. Tests: `tests/4_view/JzodElementEditor.test.tsx` and `componentMiroirTests.286.phase0.unit.test.tsx`. Deployment miroir: the instance `761d4ed2-….json`, written by the generator (18 leaves in 3 sub-suites). This plan.

#### Slice 8 realization (JzodObjectEditor)

**RED observed.** The 14 Object cases were added to `componentTestManifest.ts` (`JzodObjectEditor`, after `JzodLiteralEditor`) and to `componentTestRegistry.ts` through a new `jzodElementEditor/JzodObjectEditor.tsx` whose 14 bodies threw "not migrated". The generator printed "4 suite(s), 32 case(s)" and wrote the instance once, then "no change" on a second run. `npm run build -w miroir-test-app_deployment-miroir` succeeded. The new entry, run with `npx vitest run` without bail (`VITE_TEST_MODE=true`): 14 failed, 19 passed (33). Each failure reads `reactComponentTest "JzodElementEditor_ComponentTestSuite#JzodObjectEditor#JzodObjectEditor: <case>" failed: not migrated`. The 18 Array, Enum, and Literal cases and the entry check passed.

**GREEN.**

- `jzodElementEditor/JzodObjectEditor.tsx`: the 14 cases of `getJzodObjectEditorTests`, with the §5.3 rules (`screen` to `env.view`, `expect` to `env.expect`, `container` to `env.container` as root of every `extractValuesFromRenderedElements` call, React `act` to `env.act`, `fireEvent` to `env.fireEvent`, and `waitAfterUserInteraction()` to the act-free `waitAfterUserInteraction(env.container)`). The 2 active `screen.debug` calls are deleted. No case opens a dropdown or reads portaled options, so no call passes `env.portalElement`. The old suite had no suite props, and each case gave its full props. They are kept per case, with the shared label, name, and list keys in a local `testFieldProps` and the record schema of the 7 `record …` cases in `recordOfObjectSchema`. `suiteProps` (required by `ComponentTestSuite`) repeats the props of the first case and no case uses it. The value reading shared by every case is a local helper `testFieldValues(env, step)`, with the old step labels. The waits are the old ones: the two "record with … deleted" cases have no wait after the click, as before. No assertion changed.
- First GREEN run: 13 passed, 1 failed. "record can rename a record attribute keeping the existing value…" failed with `Expected {"firstRecord":{"a":"test string","b":42}} to equal {"renamedRecord":{"a":"test string","b":42}}`. The name input showed `renamedRecord`, but the rename, which the editor commits in its `onBlur`, never ran. The cause is an environment gap, not a product difference. React (17 and later) runs `onBlur` from the native `focusout` event. `@testing-library/react`'s `fireEvent`, which the old file used, wraps `@testing-library/dom`'s and fires `focusout` before `blur` (and `focusin` for `focus`, `mouseover` / `mouseout` for `mouseEnter` / `mouseLeave`, the pointer equivalents, and `focus` plus `keyUp` for `select`). `env.fireEvent` was `@testing-library/dom`'s bare `fireEvent`, so `fireEvent.blur` did not reach React.
- Focused test first: `tests/4_view/issues/286-react-component-miroir-tests/componentTestFireEvent.286.phase8.unit.test.tsx` (4 tests) mounts an input and a box with React `onFocus`, `onBlur`, `onSelect`, `onMouseEnter`, `onMouseLeave`, `onPointerEnter`, and `onPointerLeave` handlers through the act-free `mountComponent`, with `IS_REACT_ACT_ENVIRONMENT = false` and `configureComponentTestDom()` (the dom config saved and restored), and fires the events through `createComponentTestEnvironment(...).fireEvent`. RED: 3 failed (`expected [] to deeply equal [ 'focus', 'blur' ]`, `expected [] to deeply equal [ 'mouseEnter', 'mouseLeave', …(2) ]`, `expected [] to include 'select'`), 1 passed (the key set and the callable form, a guard for the change).
- `componentTestEnvironment.ts`: new exported `componentTestFireEvent`, a copy of `@testing-library/dom`'s `fireEvent` (callable, every event helper) with the same React additions as `@testing-library/react`'s `fire-event.js`. It does not import `@testing-library/react` and calls no `act`, so D2 and the bundle guard's rule hold. `createComponentTestEnvironment` sets `fireEvent: componentTestFireEvent`. The focused test then gave 4 passed, and the Object suite 14 passed. The Array, Enum, and Literal cases call only `fireEvent.click` and `fireEvent.change`, which are unchanged (18 passed).
- Non-vacuity check, then reverted: with `firstRecord_copy1: { a: "test stringX", … }` and `toHaveValue("firstNameX")` in two cases, the Object run stopped (bail) at `Expected {…,"firstRecord_copy1":{"a":"test string","b":42}} to equal {…,"firstRecord_copy1":{"a":"test stringX","b":42}}. First difference at path: ["firstRecord_copy1","a"]`, with 1 failed and 12 passed before it.
- Old file: `getJzodObjectEditorTests`, `LocalObjectEditorProps`, its two types (`JzodObjectEditorTest`, `JzodObjectEditorTestSuites`), the `JzodObjectEditor` entry of `jzodElementEditorTests`, and the now unused `JzodRecord` import are deleted and replaced by a comment that points to the new file. `JzodObject` stays imported, because the Book and Union code still uses it. Phase0: `JzodObjectEditor` is removed from the expected suite list.

**Case list.** The new entry's `JzodObjectEditor` lines, reduced to `<suite> - jzodElementEditor - <case>: <status>`, are identical to the 14 `JzodObjectEditor` lines of `baseline-JzodElementEditor.txt` (`diff` empty). The old suite's reduced list (sorted) is identical to the 36 baseline lines that are not Array, Enum, Literal, or Object.

**Browser check (§4.4), development build only.** The Slice 7 script with `JzodObjectEditor` added to its result filter (`playwright-core` in the session scratchpad, headless Microsoft Edge, seed user `alice`, the MiroirTestDetails report of instance `761d4ed2-…`), against the Vite dev server already running on `https://localhost:5173` (not restarted), run twice. The panel showed after about 0.9 to 1.2 s and the run ended after about 11.5 s: "Passed: 32/32", "PASSED", 32 rows "All 1 assertions passed" (12 Array, 3 Enum, 3 Literal, 14 Object). The sandbox kept the last case ("createObject definition record entry name can be renamed", with the input `TESTSECTION.testField.definition.firstName-NAME=firstName`), 0 console messages matched `act(`, and Close hid the panel and removed the container. The only console error was the known 403 on `/action/storeManagementAction_openStore` at page load. The Library navigation and the production build were not checked.

**Validation** (one command per file, from the repo root).

- `npx tsx packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts`: "4 suite(s), 32 case(s)", "no change".
- `npm run build -w miroir-test-app_deployment-miroir`: success.
- `npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts`: 153 passed.
- `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency`: 6 passed.
- `npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodObjectEditor"`: 14 passed, 19 skipped.
- `npm run testByFile -w miroir-standalone-app -- miroir-component-tests`: 33 passed (32 cases and the entry check), no React act warning.
- `npm run testByFile -w miroir-standalone-app -- JzodElementEditor.test`: 36 passed.
- `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0`: 4 passed.
- `npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6`: 3 passed (the manifest now gives 32 component leaves).
- `python scripts/check_bare_console.py`: OK.
- Extra: `npm run testByFile -w miroir-standalone-app -- componentTestFireEvent.286.phase8`: 4 passed. `npm run testByFile -w miroir-standalone-app -- componentTestSandbox.286.phase4`: 2 passed (the runner's environment changed).
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`: 0 errors. `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json`: 1 error, the baseline `JzodElementEditorHooks.ts(528,59)` TS2339.

**Files created.** `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/jzodElementEditor/JzodObjectEditor.tsx`. `packages/miroir-standalone-app/tests/4_view/issues/286-react-component-miroir-tests/componentTestFireEvent.286.phase8.unit.test.tsx`.

**Files changed.** In `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/`: `componentTestEnvironment.ts`, `componentTestManifest.ts`, and `componentTestRegistry.ts`. Tests: `tests/4_view/JzodElementEditor.test.tsx` and `componentMiroirTests.286.phase0.unit.test.tsx`. Deployment miroir: the instance `761d4ed2-….json`, written by the generator (32 leaves in 4 sub-suites). This plan.

**Note for Slice 12.** `componentTestFireEvent.286.phase8` belongs in the `unit-286-react-component-miroir-tests` nonreg unit.

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
