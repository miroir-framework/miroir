# Issue #292 TDD implementation plan

> Vertical TDD slices, RED then GREEN, integration-first per `docs/contributing/testing.md`. Tests render the real `JzodElementEditor` through the real MiroirTest walk (`runMiroirTests._runMiroirTestSuite`) and the real component test runner. The only stand-ins are the fake runners and fake component registries of the core and runner unit tests, as in #286. Slice 2 is the tracer: the Enum suite runs from declarative JSON.
>
> **Execution model:** slices are implemented one by one by subagents. Each slice ends with its Validation. Then its Realization is filled in, its Status becomes ✅ DONE, and one commit is made for the slice (message `#292 Slice <n>: <title>`, ending with the attribution lines of the session). The work is finished only when type-check (`tsc` per package, no new error against the Slice 0 baseline) and the full `npm run nonreg` pass, except the baseline failures recorded in Slice 0.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/292
Working branch: `292-REFACTOR-declarative-react-component-tests`, created from `aba` at `34a6c0c0b`.

---

## Scope

- MiroirTest schema: `reactComponentTestSuite` node, `steps` and `componentProps` on `reactComponentTest`, the step and target schemas (Entity and EntityVersion), generated types.
- miroir-core: walk of the new node, suite context to the runner, new runner signature, the leaf predicates.
- App: component registry, step interpreter, target resolution, custom-step registry (removed at M2), runner changes, extractor fix, `$options`.
- 7 per-editor MiroirTest instances, package wiring, vitest entry, consistency test, adapted #286 tests, bundle guard.
- M1 and M2 deletions, docs, nonreg.

Out of scope: other UI_COMPONENT test files (#204), new component suites, changes to the 14 importers of `JzodElementEditorTestTools.tsx` beyond what the extractor fix brings.

### Deviations from analysis.md and the issue

- **D3 slice (1) is split in two** (Slices 1 and 2). Slice 1 is the core and schema layer plus the instance split, a refactor under green with no behavior change for the 68 cases. Slice 2 is the interpreter, the extractor fix, and the Enum migration. Reason: the schema rebuild, the miroir-core walk, and the split of `761d4ed2-…` into 7 instances touch other packages and every #286 test. Validating them alone keeps a failure in Slice 2 attributable to the interpreter.
- **The generator is deleted in Slice 1**, not at M1 (analysis T5). It can only write the combined instance.
- **Each migration slice deletes the migrated editor's TS case file** and its manifest and registry entries. M1 deletes what is left: `componentTestManifest.ts`, `componentTestRegistry.ts`, the `jzodElementEditor/` folder, `componentTestRef` in the schema, and the legacy runner path.
- **A miroir-core issue directory** `packages/miroir-core/tests/1_core/issues/292-declarative-react-component-tests/` holds the walk tests, as #286 did (`docs/contributing/testing.md` L34: one issue directory per layer).

---

## Progress summary

| Slice | Title | Complexity | Status | Primary proof |
|---|---|---|---|---|
| 0 | Baselines | S | ✅ DONE | baseline tables, `baseline-component-cases.txt` |
| 1 | Schema, walk, runner signature, 7 instances (legacy leaves), generator removed | L | ✅ DONE | `reactComponentTestSuite.292.phase1` (core), `componentTestInstances.292.phase1`, `miroir-component-tests` 70 passed |
| 2 | Tracer: interpreter, extractor fix, `$options`, Enum from steps | L | ✅ DONE | `componentTestSteps.292.phase2` 11, `extractorOpenCombobox.292.phase2` 3, Enum 3/3 in vitest, in the dev app, and in the production build; entry 70 passed in 59.9 s |
| 3 | Literal and SimpleType | M | ⏳ GREEN, SimpleType browser check pending | `componentTestTargets.292.phase3` 6, `-t "JzodLiteralEditor"` 3, `-t "JzodSimpleTypeEditor"` 12, entry 70 passed in 59.0 s, Literal 3/3 in the dev app |
| 4 | Array and Object | L | ⏳ GREEN, browser check pending (API server down) | `componentTestWidgets.292.phase4` 9, `-t "JzodArrayEditor"` 12, `-t "JzodObjectEditor"` 14, entry 70 passed in 60.9 s; Array and Object app checks pending |
| 5 | Union and Any | L | ⏳ GREEN, browser check pending (API server down) | `componentTestUnionWidgets.292.phase5` 6, `-t "JzodUnionEditor"` 9, `-t "JzodAnyEditor"` 15, entry 70 passed in 66.5 s; app check 68/68 pending |
| 6 | M1: no `componentTestRef` | M | ⏳ TODO | `legacyRemoved.292.phase6`, grep empty |
| 7 | M2: no `custom` step | S | ⏳ TODO | `legacyRemoved.292.phase6` M2 assertions |
| 8 | Docs, nonreg, final type-check and full nonreg | M | ⏳ TODO | full nonreg = Slice 0 baseline failures only |

Complexity: S = one focused change, M = several files in one package or a mechanical port, L = several packages or a new subsystem.

---

## Locked implementation defaults

Copied from [`analysis.md`](./analysis.md) §2. Deviations go in the slice Realization.

| Decision | Choice |
|---|---|
| D1, D2 | JSON is the source of truth. `custom` escape hatch until M2. M1 and M2 in this issue |
| D5, T1, T2 | `reactComponentTestSuite` node, the only child of a `miroirTestSuite` root per instance |
| D6, T7, T8 | `expectRenderedValues {label, field?, path?, filter?, detectOptions?, timeout?, expectedValue}`; `$options` built from `[role="option"]` aria-labels, array-valued extractor entries dropped |
| D7, D8, T6 | targets: one locator (`byRole`+`name`, `byTestId`, `byText`, `byDisplayValue`, `byLabelText`, `widget`+`field`, `ref`) plus refinements `fieldName`, `fieldNamePrefix`, `id`, `index`; no `TESTSECTION.` literal in JSON |
| D9 | `componentTestAct` + `waitAfterUserInteraction(container)` after every action step |
| D10, T12 | full step union in the schema from Slice 1; unimplemented kinds fail with "not implemented" |
| D11, T10 | `step <n> (<kind>[ "<label>"]): <message>`, `n` 1-based |
| D12 | 7 instances, Enum keeps `761d4ed2-…`; leaf labels `<editor>: <case>` unchanged |
| T3, T4 | runner params `{ testNamePath, leaf, suite? }`; wrapper keyed by `suite.suitePath`, destroyed after the last of `suite.caseLabels` |
| T9 | `{"$bigint": "<digits>"}` revived in `componentProps` |
| T11 | `saveAs` / `{"ref": …}` element aliases |
| T13 | `componentRegistry = { JzodElementEditor: getJzodElementEditorForTest("JzodElementEditor.test") }` |
| T14 | Literal suite defaults without `label` |
| P1 (pending) | default (a): open combobox reads the committed value; Enum case 3 adds Enter and a `value3` assertion |

---

## Allocated UUIDs and keys

| Artefact | Value |
|---|---|
| `JzodEnumEditor_ComponentTestSuite` | `761d4ed2-1a5c-4901-a9d9-897dbec0b27f` (reused) |
| `JzodArrayEditor_ComponentTestSuite` | `1b71d68b-7dc9-468c-a251-4fa7889f20f4` |
| `JzodLiteralEditor_ComponentTestSuite` | `3995a071-b8ae-48d3-a488-6d1fc828b725` |
| `JzodObjectEditor_ComponentTestSuite` | `da353085-c62b-4aa6-bd54-8813d303dfe5` |
| `JzodSimpleTypeEditor_ComponentTestSuite` | `590693b6-2125-43fc-89d7-1330ae8318db` |
| `JzodUnionEditor_ComponentTestSuite` | `de517cd6-31a8-46d2-ac09-3a5162b630a7` |
| `JzodAnyEditor_ComponentTestSuite` | `ec601bcc-a27d-450d-9c37-bdd6a12a1575` |
| MiroirTest Entity (generator input) | `a311f363-e238-4203-bdfc-29e8c160c26b` in `miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/` |
| MiroirTest EntityVersion (dual write, read by `modelValidation`) | `51c647fe-07ec-411c-89cc-02689dc66d6a` in `miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/` |
| MiroirTest data folder | `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/` |
| Issue test directory (app) | `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/` |
| Issue test directory (miroir-core) | `packages/miroir-core/tests/1_core/issues/292-declarative-react-component-tests/` |
| New nonreg unit step | `unit-292-declarative-react-component-tests` |
| Unchanged nonreg steps | `appstack-miroir-component-tests`, `unit-286-react-component-miroir-tests` |
| Browser check URL (per instance) | `https://localhost:5173/?page=report&application=360fcf1f-f0d4-4f8a-9262-07886e70fa15&deploymentUuid=10ff36f2-50a3-48d8-b80f-e48e5d13af8e&applicationSection=data&reportUuid=0ad63f27-c4df-4fb8-9a79-cb257c7a2958&instanceUuid=<uuid>` |
| Browser check user | `alice` / `alice-dev` (`docs/reference/authentication.md` L44) |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Component entry | `npm run testByFile -w miroir-standalone-app -- miroir-component-tests` |
| One editor | `npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "<Editor>"` |
| Consistency test | `npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency` |
| App issue test | `npm run testByFile -w miroir-standalone-app -- <name>` |
| miroir-core issue tests | `npm run testByFile -w miroir-core -- 292-declarative-react-component-tests` |
| miroir-core generic MiroirTests | `npm run testMiroir -w miroir-core` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| After a JSON instance change | `npm run build -w miroir-test-app_deployment-miroir && npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts` |
| miroir-core change used by app tests | `npm run build -w miroir-core` |
| Bare console guard | `python scripts/check_bare_console.py` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json`. Rule: no new error against Slice 0. The app tsconfig covers `src/` only |
| Bundle guard (needs a fresh build, not in nonreg) | `npm run build -w miroir-standalone-app && npm run testByFile -w miroir-standalone-app -- componentTestChunk.286.phase4` |

Rules:

- `testByFile` passes `--bail=1`. Run one test file per command wherever a count is compared. To see every failure of a RED run, use `npx vitest run <file>` in the package with `VITE_TEST_MODE=true`, as #286 did.
- No `RUN_TEST`. The filter argument selects the file.
- The component entry takes no `--profile`.
- The vitest names stay `<Editor> > <Editor>: <case>`. Case lists are compared with `baseline-component-cases.txt` (Slice 0) after removing ANSI codes, reduced to `<Editor> > <leaf label>: <status>`.
- Browser check (D13), same method as #286 plan §4.4: `playwright-core` installed only in the session scratchpad, headless Microsoft Edge, log in as `alice`, open the browser check URL for each migrated instance, click `Run <instance name> Unit Tests`, wait for the snackbar, read "Passed: n/n" in the results panel, count console messages matching `act(` (expect 0), check the sandbox keeps the last case, click Close. Dev build only, unless the slice says otherwise.
  - First check `https://localhost:5173` and `https://localhost:3080` (or `http://` when there are no certs). If the Vite dev server is down, start it in the background with `npm run dev -w miroir-standalone-app`. If the API server is down and `packages/miroir-server/release/index.js` exists, start it in the background with `NODE_ENV=development node packages/miroir-server/release/index.js`. Stop only what you started. Never restart a server you did not start.
  - If a server cannot be started, record "browser check not run: <reason>" in the Realization. The slice then stays ⏳ (not ✅ DONE) and the orchestrator asks the user.
- A new MiroirTest instance appears in the running app after a page reload (#286 plan Slice 0.3 Realization).

---

## Slice 0: baselines

**Status:** ✅ DONE

### Goal

Record every count and error list that later slices compare against. No code change.

### 0.1 Baselines

Record in the Realization:

- **Component entry, case by case.** `npm run testByFile -w miroir-standalone-app -- miroir-component-tests`. Expected: 69 passed (68 cases and 1 entry check). Save the reduced list (68 case lines, `<Editor> > <leaf label>: <status>`, sorted) as `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/baseline-component-cases.txt`. Record the wall time of the run (for K1 / P2).
- **Consistency test.** `componentMiroirTests.consistency`: expected 6 passed.
- **#286 issue tests**, one command per file:
  - `npm run testByFile -w miroir-core -- 286-react-component-miroir-tests` (16 at the end of #286)
  - app: `componentMiroirTests.286.phase0`, `domMatchersParity.286.phase3`, `extractValuesScoped.286.phase3`, `componentTestMode.286.phase4`, `componentTestSandbox.286.phase4`, `componentTestRunLock.286.review`, `portalContainer.286.phase5`, `runAllComponentTests.286.phase6`, `componentTestFireEvent.286.phase8`
- **Extractor importers:** `extractValuesFromRenderedElements`, `--profile emulatedServer-filesystem multistepProcess.274.integ`, `--profile emulatedServer-filesystem wizardWalk.284.integ`.
- **Model validation:** `npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts` count.
- **Generic entry:** `npm run testMiroir -w miroir-core` count.
- **tsc error lists** for `miroir-core`, `miroir-standalone-app`, and the packages checked in #286 Slice 12 (`miroir-store-bundled`, `miroir-store-filesystem`, `miroir-store-indexedDb`, `miroir-store-mongodb`, `miroir-store-postgres`, `miroir-localcache`, `miroir-localcache-redux`, `miroir-server`, `miroir-mcp`, `miroir-ai`, `miroir-cli`). At the end of #286: 0 errors, except 1 in the app (`JzodElementEditorHooks.ts(528,59)` TS2339).
- **Full nonreg baseline:** run separately by the orchestrator (`npm run nonreg`). Record its snapshot folder, its step count, and each failing step with its cause. These are the "baseline failures" of the final criterion.

### Validation

The commands above, one per file. No RED/GREEN.

### Realization

Every command below was run alone (never two vitest runs in parallel), one per file, from the repo root, on `292-REFACTOR-declarative-react-component-tests`. The working tree has the uncommitted, unrelated changes the orchestrator described (`ci/claude-cloud-env-script.sh`, `admin_data` JSON files under `packages/miroir-standalone-app/tests/assets/admin_data/` and `packages/miroir-test-app_deployment-admin/assets/admin_data/`, a spotify model file, `generate_externalServiceSync_suites.py`); they were not touched, stashed, or reverted.

**Component entry, case by case.** `npm run testByFile -w miroir-standalone-app -- miroir-component-tests`: **69 passed** (68 cases and 1 entry check), matching the plan's expectation. Wall time: real 56.6 s (vitest-reported test duration 49.78 s). The reduced case list (68 lines, `<Editor> > <leaf label>: passed`, ANSI stripped, sorted) is saved as `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/baseline-component-cases.txt`.

**Consistency test.** `componentMiroirTests.consistency`: **6 passed** (real 23.4 s), matching the plan.

**#286 issue tests**, one command per file:

| Command (`npm run testByFile -w <pkg> -- ...`) | Passed | Wall time |
|---|---|---|
| `-w miroir-core -- 286-react-component-miroir-tests` (3 files) | 16 | 11.6 s |
| `-w miroir-standalone-app -- componentMiroirTests.286.phase0` | 3 | 23.3 s |
| `-w miroir-standalone-app -- domMatchersParity.286.phase3` | 4 | 16.6 s |
| `-w miroir-standalone-app -- extractValuesScoped.286.phase3` | 2 | 23.5 s |
| `-w miroir-standalone-app -- componentTestMode.286.phase4` | 2 | 25.0 s |
| `-w miroir-standalone-app -- componentTestSandbox.286.phase4` | 5 | 62.1 s |
| `-w miroir-standalone-app -- componentTestRunLock.286.review` | 5 | 23.9 s |
| `-w miroir-standalone-app -- portalContainer.286.phase5` | 3 | 22.3 s |
| `-w miroir-standalone-app -- runAllComponentTests.286.phase6` | 3 | 59.3 s |
| `-w miroir-standalone-app -- componentTestFireEvent.286.phase8` | 4 | 16.6 s |

`-w miroir-core -- 286-react-component-miroir-tests` matches the plan's "16 at the end of #286" exactly. `componentMiroirTests.286.phase0` is 3, not the 6 of the original #286 Slice 0 Realization: by the end of #286 Slice 12 the "pre-286 inventory" describe block (3 characterization tests over the now-deleted old suite) was removed, leaving only the "phase0 stable" describe block (3 tests). This is the #286-final state, not a #292 deviation. `componentTestSandbox.286.phase4` (5, not the Slice 4 "2 passed" milestone) and `runAllComponentTests.286.phase6` / `componentTestRunLock.286.review` reflect the file's final #286 test count, grown across #286 slices past their first-landing milestone in the Progress summary.

**Extractor importers:**

| Command | Passed | Wall time |
|---|---|---|
| `-w miroir-standalone-app -- extractValuesFromRenderedElements` | 4 | 23.5 s |
| `-w miroir-standalone-app -- --profile emulatedServer-filesystem multistepProcess.274.integ` | 19 | 58.9 s |
| `-w miroir-standalone-app -- --profile emulatedServer-filesystem wizardWalk.284.integ` | 11 | 39.2 s |

All three match their #286 Slice 0 baselines.

**Model validation.** `npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts`: **153 passed** (real 17.9 s).

**Generic entry.** `npm run testMiroir -w miroir-core`: **794 passed** (real 17.9 s).

**tsc error lists**, one command per package (`npx tsc --noEmit --skipLibCheck -p packages/<name>/tsconfig.json`):

| Package | Errors | Wall time |
|---|---|---|
| `miroir-core` | 0 | 15.2 s |
| `miroir-standalone-app` | 1 — `JzodElementEditorHooks.ts(528,59)` TS2339 (`Property 'name' does not exist on type 'EntityInstance & { defaultLabel?: string \| undefined; }'`) | 6.3 s |
| `miroir-store-bundled` | 0 | 2.6 s |
| `miroir-store-filesystem` | 0 | 2.6 s |
| `miroir-store-indexedDb` | 0 | 2.6 s |
| `miroir-store-mongodb` | 0 | 2.5 s |
| `miroir-store-postgres` | 0 | 2.9 s |
| `miroir-localcache` | 0 | 2.3 s |
| `miroir-localcache-redux` | 0 | 2.6 s |
| `miroir-server` | 0 | 2.9 s |
| `miroir-mcp` | 0 | 2.9 s |
| `miroir-ai` | 0 | 2.9 s |
| `miroir-cli` | 0 | 2.7 s |

Matches the plan's expectation exactly: 0 everywhere except the one known `miroir-standalone-app` error carried over from #286.

**Full nonreg baseline.** Run separately by the orchestrator, not re-run here. Snapshot `test-results/nonreg/20260925T102332Z/` (`summary.md`, `summary.json`, `logs/`). Tier `default`, mode `run-all`, profile `emulatedServer-sql`. Started `2026-09-25T10:23:32Z`, finished `2026-09-25T11:09:47Z`, duration 2775.177 s (~46 min 15 s). **68 steps: 66 passed, 2 failed, 0 skipped, 0 not_run.**

Failing steps and cause, from their logs in the snapshot:

- **`apiCallReport-281`** (16.5 s) — `apiCallReport.281.phase0.unit.test.ts > spotify_model has exactly 6 JSON files with expected uuids and names`: `expected [ …(8) ] to have a length of 6 but got 8`. Cause: the working tree's uncommitted spotify-model changes add 2 untracked JSON files (`packages/miroir-test-app_deployment-spotify/assets/spotify_model/3d8da4d4-…/385eec5a-….json` and `…/3f2baa83-…/a47b6bad-….json`) on top of the 6 the test expects (one of the 6, `dde4c883-…/1b4b181d-….json`, is also modified but not added/removed) — 6 + 2 = 8, matching the actual count exactly. **Plausibly caused by the user's uncommitted changes: yes, confirmed by file count.**
- **`unit-274-multistep-reports`** (23.4 s) — `multistep.274.phase0.unit.test.ts > seed inventory: 87 Reports including MultistepCountryCreate, MultistepLaunchPad, and ConnectExternalServiceWizard`: `expected […] to have a length of 87 but got 88`. Cause: the same untracked file `packages/miroir-test-app_deployment-spotify/assets/spotify_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a47b6bad-7f33-4fb1-8071-904556e5ff43.json` sits in the folder named after `REPORT_ENTITY_UUID` (`3f2baa83-…`), so the test's `collectReportInstances` walk (over `packages/miroir-test-app_deployment-spotify/assets`, one of its `ASSET_TREES`) picks it up as an extra Report instance. **Plausibly caused by the user's uncommitted changes: yes**, confirmed — that one file is exactly the extra Report.

Both failures are caused by the user's own uncommitted, #292-unrelated spotify-model asset changes, not by anything on this branch. They are the "baseline failures" of Slice 8's final criterion; later slices are expected to reproduce the same 2 failures with the same causes, nothing more.

**Files created:** `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/baseline-component-cases.txt` (68 lines). **Files changed:** this plan (Status, Progress summary, this Realization). No product code changed.

---

## Slice 1: schema, walk, runner signature, 7 instances

**Status:** ✅ DONE · **Complexity:** L

### Goal

The schema has the `reactComponentTestSuite` node and the full step vocabulary. miroir-core walks the node and passes the suite context to the runner. The single instance is split into the 7 instances of analysis §5.6, all still with legacy `componentTestRef` leaves under plain sub-suites. The generator is gone. All 68 cases still pass, with the same labels.

### 1.1 RED

**Test:** `packages/miroir-core/tests/1_core/issues/292-declarative-react-component-tests/reactComponentTestSuite.292.phase1.unit.test.ts` (in-process with `TestFramework`, like `reactComponentLeaf.286.phase2`; each test restores the registered runner in `finally`). Fixture: root `miroirTestSuite` "Root" → `reactComponentTestSuite` "S" (`component: "C"`, `componentProps: {a: 1}`) → leaves "A" (`steps: []`) and "B" (`steps: []`, `componentProps: {b: 2}`). Fixtures are typed `as any` until the types are generated.

- A counting runner receives, for "B", `{ testNamePath: ["Root","S","B"], leaf: <B>, suite: { suitePath: ["Root","S"], component: "C", componentProps: {a: 1}, caseLabels: ["A","B"] } }`.
- The tracker records "A" and "B" under the suite path `Root > S`.
- `walkMiroirTestLeaves(root)` returns A and B, and `classifyMiroirTestSuiteExecutionCapabilities(root).uiExecutionMode` is `"unit"`.
- A filter `{ testList: { Root: { S: ["A"] } } }` runs A only and records B as skipped.
- `excludeMiroirTestTypes: ["reactComponentTest"]` records both as skipped, and the runner is not called.
- With no runner, both are recorded as skipped with `REACT_COMPONENT_TEST_NO_RUNNER_MESSAGE`.
- A legacy leaf with `componentTestRef` under a plain `miroirTestSuite` reaches the runner as `{ testNamePath, leaf }` with no `suite`.

Expected RED: `Unknown miroirTestType: reactComponentTestSuite` from the exhaustive default of `runMiroirTest`, and the old params shape in the legacy test.

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/componentTestSchema.292.phase1.unit.test.ts`

- The `mlSchema.definition.definition.context` of Entity `a311f363-…` and EntityVersion `51c647fe-…` are deep-equal.
- The issue's example suite, wrapped in a MiroirTest instance with a `miroirTestSuite` root, passes `jzodTypeCheck` against both `mlSchema`s with `defaultMiroirModelEnvironment`.
- The same instance with a step `{"step": "fly"}` fails, and so does a `reactComponentTestSuite` without `component`.

**Test:** `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/componentTestInstances.292.phase1.unit.test.ts`

- The data folder holds the 7 instances of the UUID table, with those names. Each root is a `miroirTestSuite` whose label is its name, with exactly one child labelled with the editor name.
- The 68 leaf labels, sorted and prefixed by the child label, equal the 68 lines of `baseline-component-cases.txt`.
- `miroirTestDefinitionHasReactComponentTest(instance.definition)` is true for each instance and for a fixture whose only component leaf is inside a `reactComponentTestSuite`.
- `miroir-test-app_deployment-miroir` exports `miroirTest_<name>` for the 7 names, and `defaultMiroirMetaModel.tests` holds the 7 uuids and not `JzodElementEditor_ComponentTestSuite`.

Expected RED: 1 instance found, the fixture returns false, 6 exports missing.

### 1.2 GREEN

- **Schema** (analysis §5.1), same text in the Entity and the EntityVersion: `reactComponentTestSuite`, third member of `miroirTestSuite.miroirTests`, `componentProps?` and `steps?` on `miroirTestForReactComponent` with `componentTestRef` optional, `reactComponentTestTextMatch`, `reactComponentTestTarget`, `reactComponentTestStep` with every kind of analysis §5.4 including `custom`. Schema rebuild. Export the new types and schemas from miroir-core `index.ts` next to L472-473.
- **miroir-core** (analysis §5.2): `ReactComponentTestSuiteContext` and the new `ReactComponentTestRunner` params in `miroirTestTypes.ts`. The walk handles `reactComponentTestSuite`. The trailing parameter through `runMiroirTest`, `_runMiroirTest`, and `_runMiroirTestWithTracking`. `runMiroirReactComponentTest` calls `runner({ testNamePath, leaf, suite })`. `walkMiroirTestLeaves` and `testSuites` recurse into the node. `npm run build -w miroir-core`.
- **App:**
  - `miroirTestDefinitionHasReactComponentTest` recurses into the node.
  - The runner reads `params.leaf.componentTestRef` on the legacy path, with no other change.
  - `componentTestManifest.ts`: `componentTestSuiteInstanceUuid` and `componentTestSuiteInstanceName` are replaced by `componentTestSuiteInstances: Record<editor, { uuid, name }>`.
- **Instances:**
  - Rewrite `761d4ed2-….json` as `JzodEnumEditor_ComponentTestSuite`, with only the Enum sub-suite.
  - Write the 6 other instances with their sub-suites, leaves copied unchanged, same top-level keys, 2-space JSON, CRLF.
  - Wiring: 7 exports in `index.ts`, 7 declarations in `index.d.ts`, 7 imports and `tests` entries in `src/Model.ts`. Remove `miroirTest_JzodElementEditor_ComponentTestSuite`.
- **Delete** `scripts/generate-component-miroir-tests.ts`.
- **Rewrite `componentMiroirTests.consistency.unit.test.ts`.** For each component instance, it checks `jzodTypeCheck` against both `mlSchema`s, unique leaf labels starting with `<child label>: `, and exactly one of `steps` / `componentTestRef` per leaf. Legacy leaves must equal the manifest and the registry. It runs its comparison function on fixtures (missing leaf, extra registry case, duplicate label, leaf with both fields), each with its expected message.
- **Rewrite `miroir-component-tests.unit.test.tsx`.** It loads every instance of the folder with a `reactComponentTest` leaf and runs each child in `describe(<child label>)` with the path `[<instance name>, <child label>]`. New entry check "loads 7 component test instances with 68 leaves". Expected: 70 passed.
- **Adapt the #286 tests:**
  - `componentTestSandbox.286.phase4`: the Array instance by its uuid, and a filter naming only `JzodArrayEditor` (no empty siblings).
  - `runAllComponentTests.286.phase6`: the 7 instances and the transformer suite. Expected labels per instance come from its JSON.
  - `componentTestRunLock.286.review`: runner calls with `{ testNamePath, leaf: { …, componentTestRef } }`.
  - miroir-core `reactComponentLeaf.286.phase2` and `excludeMiroirTestTypes.286.phase6`: the new params.

### 1.3 Refactor checkpoint

- `grep -r "JzodElementEditor_ComponentTestSuite\|generate-component-miroir-tests" packages --include=*.ts --include=*.tsx --include=*.json` finds nothing outside `node_modules`, `dist`, and `tests/tmp`.
- Every leaf label is byte-identical to the baseline.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-core -- 292-declarative-react-component-tests
npm run testByFile -w miroir-core -- 286-react-component-miroir-tests
npm run testMiroir -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- componentTestSchema.292.phase1
npm run testByFile -w miroir-standalone-app -- componentTestInstances.292.phase1
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.286.phase0
npm run testByFile -w miroir-standalone-app -- componentTestSandbox.286.phase4
npm run testByFile -w miroir-standalone-app -- componentTestRunLock.286.review
npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6
python scripts/check_bare_console.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

Expected:

- `miroir-component-tests`: 70 passed. Its reduced case list equals the baseline.
- `modelValidation`: the Slice 0 count + 6.
- `testMiroir -w miroir-core`: the Slice 0 count.
- The #286 tests: their Slice 0 counts.

Browser check: the 7 instances appear in the MiroirTest list after a reload. Run all 7 instances (legacy path): Enum 3, Array 12, Literal 3, Object 14, SimpleType 12, Union 9, Any 15.

### Realization

Every command was run alone, one per file, from the repo root. The user's unrelated uncommitted changes (`ci/claude-cloud-env-script.sh`, the `admin_data` files, the spotify model files, `generate_externalServiceSync_suites.py`) were not touched, staged, or stashed.

**RED observed** (before any product change, `npx vitest run <file>` with `VITE_TEST_MODE=true`):

- miroir-core `reactComponentTestSuite.292.phase1`: **7 failed / 7**. Five tests failed with `Unknown miroirTestType: reactComponentTestSuite` (the exhaustive default of `runMiroirTest`). `walkMiroirTestLeaves` gave `expected [ 'S' ] to deeply equal [ 'A', 'B' ]`. The legacy test gave `expected [ Array(1) ] to deeply equal [ { …(2) } ]`: the runner got the old `{ componentTestRef, testNamePath }` params.
- app `componentTestSchema.292.phase1`: **2 failed, 5 passed**. The two `jzodTypeCheck` tests of the example suite failed with `selectUnionBranchFromDiscriminator … found no match … discriminatorValues: ["reactComponentTestSuite"]`. The Entity/EntityVersion equality test already passed (the contexts were equal before the change). The 4 "fails" tests passed vacuously at RED, because the whole node was unknown. After GREEN they fail for the intended reason only: the same suite without the change passes.
- app `componentTestInstances.292.phase1`: **3 failed, 1 passed**. The results were `expected { …(1) } to deeply equal { …(7) }` (1 instance found), `expected [ { …(8) } ] to have a length of 7 but got 1`, and `expected [ 'JzodEnumEditor', …(6) ] to deeply equal []` (the 7 exports were missing). The baseline-label test already passed at RED: the combined instance held the same 68 labels under the same child labels. It is the guard that the split keeps every label.

**GREEN:**

- **Schema** (Entity `a311f363-…` and EntityVersion `51c647fe-…`, same text, written by one script, 2-space JSON): new context entries `reactComponentTestSuite` (after `miroirTestSuite`), then `reactComponentTestTextMatch`, `reactComponentTestTarget`, and `reactComponentTestStep` (after `miroirTestForReactComponent`). `reactComponentTestSuite` is the third member of `miroirTestSuite.miroirTests`. `miroirTestForReactComponent` gains `componentProps?` and `steps?`, and `componentTestRef` becomes optional. The step union is discriminated by `step` and has the 19 kinds of analysis §5.4, `custom` included. Rebuild with `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`: the generated `ReactComponentTestSuite`, `ReactComponentTestStep`, `ReactComponentTestTarget`, and `ReactComponentTestTextMatch` (types and Zod schemas) are exported from miroir-core `index.ts` next to `MiroirTestForReactComponent`. jzod 0.8.5 from npm handled everything; no sibling link was needed.
- **miroir-core:**
  - `miroirTestTypes.ts`: `ReactComponentTestSuiteContext { suitePath, component, componentProps, caseLabels }` (exported), and runner params `{ testNamePath, leaf, suite? }`.
  - `miroirTestSuiteWalk.ts`: a `reactComponentTestSuite` child is walked like a nested suite (same tracking, filter, skip, and vitest paths). Walking the node builds the context (`componentProps` defaults to `{}`, `caseLabels` = every leaf label, whatever the filter) and passes it as the new trailing parameter of `_runMiroirTest` / `_runMiroirTestWithTracking` (`RunMiroirTest` type, `runMiroirTest`, the tracking wrapper) down to `runMiroirReactComponentTest`. That function calls `runner({ testNamePath, leaf, suite })`, or `runner({ testNamePath, leaf })` with no `suite` key for a legacy leaf.
  - `runMiroirTestSuite` accepts `MiroirTestSuite | ReactComponentTestSuite`. `walkMiroirTestLeaves` recurses into the node.
- **App:**
  - `miroirTestDefinitionHasReactComponentTest` recurses into the node.
  - The runner reads `leaf.componentTestRef` on the legacy path. A leaf without it gets an `error` result ("declarative steps are not implemented yet"); Slice 2 replaces this.
  - `componentTestManifest.ts`: `componentTestSuiteInstances: Record<editor, { uuid, name }>` replaces `componentTestSuiteInstanceUuid` / `componentTestSuiteInstanceName`. The registry comment no longer names the generator.
- **Instances:** `761d4ed2-….json` rewritten as `JzodEnumEditor_ComponentTestSuite`, with only the Enum sub-suite. 6 new files carry the other sub-suites. The leaves are copied unchanged, the top-level keys and their order are kept, and the JSON is 2-space with CRLF. The description now reads "Issues #286, #292: <Editor> React component tests (JzodElementEditor), one MiroirTest instance per editor. Edited by hand." Wiring: 7 exports in `index.ts`, 7 declarations in `index.d.ts`, and 7 imports plus `tests` entries in `src/Model.ts`, each at the place of the removed `miroirTest_JzodElementEditor_ComponentTestSuite` line.
- **Deleted** `scripts/generate-component-miroir-tests.ts`.
- **Tests rewritten or adapted:**
  - The consistency test: every component instance is checked with `jzodTypeCheck` against both `mlSchema`s. Leaf labels must be unique across all instances and start with `<child label>: `. Each leaf needs exactly one of `steps` / `componentTestRef`. Legacy leaves must equal the manifest, and the manifest must equal the registry. Fixtures cover: missing leaf, extra registry case, duplicate label, missing prefix, and both fields.
  - The vitest entry: every instance with a component leaf, a `describe(<child label>)` per child, path `[<instance name>, <child label>]`, and a new check "loads 7 component test instances with 68 leaves".
  - `componentTestSandbox.286.phase4`: the Array instance by uuid, and filter `{ [name]: { JzodArrayEditor: labels } }`.
  - `runAllComponentTests.286.phase6`: the 7 instances plus the transformer suite, with the expected labels of each instance read from its JSON.
  - `componentTestRunLock.286.review`: `{ testNamePath, leaf: fakeLeaf(…) }`.
  - miroir-core `reactComponentLeaf.286.phase2` / `excludeMiroirTestTypes.286.phase6`: runners read `leaf.componentTestRef`.

**Deviations:**

1. **Filter test.** The filter test of `reactComponentTestSuite.292.phase1` asserts that the runner is called for A only and that B is `skipped` **or absent**, not "recorded as skipped". The walk registers a filtered-out leaf with `test.skip`, and `TestFramework.test.skip` never runs the body, so no result is recorded for B. That is the existing behavior for every leaf type, and changing it is out of scope.
2. **Event service in the core test.** The core test creates a `MiroirEventService` on its tracker. Nested suites are tracked through `trackTestSuite`, which throws `miroirEventService is not set` without one. The #286 core tests only had flat suites.
3. **`testSuites`** (`TestTools.ts`) is unchanged. Its logic already treats any child that is not a `miroirTestSuite` like a leaf, so a `reactComponentTestSuite` is handled as a leaf-holding suite without an edit. It has no live caller.
4. **Schema details not fixed by analysis §5.1 / §5.4:**
   - `expectRenderedValues.label` is required (it is the extractor's `step` argument).
   - `path` items are `string | number`.
   - `filter` items are the extractor's filter enum (`select`, `input`, `option`, `cell`, `checkbox`, `combobox`).
   - `change.value`, `expectElement.value`, and the items of `expectElement.values` are `string | number | boolean`.
   - `expectElement.attribute` is `{ name, value: string }`.
   - Every step member has a `tag` with `defaultLabel` = its kind.
5. **Vitest entry order.** The vitest entry sorts the instances by name, so the `describe` order changed (Any first, not Array). Case lists are compared sorted, so this has no effect.
6. **Refactor checkpoint grep.** The grep finds one hit: `componentTestInstances.292.phase1` names `JzodElementEditor_ComponentTestSuite` to assert that it is absent from the exports and from `defaultMiroirMetaModel.tests`.
7. **Renamed vitest test.** One vitest name of `runAllComponentTests.286.phase6` changed from "…one ok per manifest case…" to "…one ok per component case…".

**Validation** (one command per file, sequential):

| Command | Result | Expected |
|---|---|---|
| `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` | exit 0 | — |
| `testByFile -w miroir-core -- 292-declarative-react-component-tests` | 7 passed | — |
| `testByFile -w miroir-core -- 286-react-component-miroir-tests` | 16 passed (3 files) | 16 ✓ |
| `testMiroir -w miroir-core` | 794 passed | 794 ✓ |
| `testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts` | 159 passed | 153 + 6 ✓ |
| `componentTestSchema.292.phase1` | 7 passed | — |
| `componentTestInstances.292.phase1` | 4 passed | — |
| `componentMiroirTests.consistency` | 8 passed | — |
| `miroir-component-tests` | **70 passed** (real 58 s, vitest 50.8 s; Slice 0: 56.6 s) | 70 ✓ |
| `componentMiroirTests.286.phase0` | 3 passed | 3 ✓ |
| `componentTestSandbox.286.phase4` | 5 passed (63 s) | 5 ✓ |
| `componentTestRunLock.286.review` | 5 passed | 5 ✓ |
| `runAllComponentTests.286.phase6` | 3 passed (61 s) | 3 ✓ |
| `python scripts/check_bare_console.py` | OK | ✓ |
| `tsc` miroir-core | 0 errors | 0 ✓ |
| `tsc` miroir-standalone-app | 1 error, the known `JzodElementEditorHooks.ts(528,59)` TS2339 | baseline ✓ |

The reduced case list of `miroir-component-tests` (ANSI stripped, `<Editor> > <leaf label>: passed`, sorted) is byte-identical to `baseline-component-cases.txt` (`diff` empty, 68 lines). The other packages of the Slice 0 tsc list (`miroir-store-*`, `miroir-localcache*`, `miroir-server`, `miroir-mcp`, `miroir-ai`, `miroir-cli`) plus `miroir-react` were also type-checked: 0 errors each.

**Browser check (dev build).** The Vite dev server (`https://localhost:5173`) and the API server (`https://localhost:3080`) were already running and were not restarted. The method is the one in the plan: `playwright-core` in the session scratchpad, headless Microsoft Edge, log in as `alice`. For each instance, the script opened the browser check URL, clicked `Run <name> Unit Tests`, waited for the snackbar, read the panel, and clicked Close. Each of the 7 new instances loaded in its MiroirTestDetails report without a server restart, so the LocalCache holds them.

| Instance | Passed | Run time |
|---|---|---|
| Enum | 3/3 | 2.2 s |
| Array | 12/12 | 5.9 s |
| Literal | 3/3 | 1.7 s |
| Object | 14/14 | 7.7 s |
| SimpleType | 12/12 | 4.9 s |
| Union | 9/9 | 3.5 s |
| Any | 15/15 | 5.8 s |

For each instance:
- The panel read "PASSED", and the snackbar read "<name> Miroir tests completed successfully".
- No console message matched `act(`.
- After the run, the sandbox kept one case container, and Close removed it.
- The console errors were the known 403 at page load and two React "unique key" warnings from `Sidebar` / `AppBar`. None of them comes from the sandbox.

**Impact on later slices:**
- The runner's step path is still missing: a leaf with `steps` gives an `error` result until Slice 2.
- The legacy wrappers stay keyed by `componentTestRef.suite`.
- The `ReactComponentTestSuiteContext` passed by the walk is ready for T4 (the wrapper keyed by `suitePath`).

**Files created:**
- `packages/miroir-core/tests/1_core/issues/292-declarative-react-component-tests/reactComponentTestSuite.292.phase1.unit.test.ts`
- `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/componentTestSchema.292.phase1.unit.test.ts` and `componentTestInstances.292.phase1.unit.test.ts`
- 6 instances in `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-…/`: `1b71d68b-…`, `3995a071-…`, `da353085-…`, `590693b6-…`, `de517cd6-…`, `ec601bcc-….json`

**Files changed:**
- The Entity `a311f363-….json` and the EntityVersion `51c647fe-….json`, the instance `761d4ed2-….json`, and the deployment package's `index.ts`, `index.d.ts`, and `src/Model.ts`
- miroir-core:
  - `preprocessor-generated/miroirFundamentalJzodSchema.ts` and `miroirFundamentalType.ts` (generated)
  - `miroirTestTypes.ts`, `MiroirTestTools.ts`, `ReactComponentTestTools.ts`, `miroirTestSuiteWalk.ts`, `inferIntegrationSessionKind.ts`, `index.ts`
  - the 2 #286 core tests
- app:
  - `componentTestManifest.ts`, `componentTestRegistry.ts` (comment), `runReactComponentTest.tsx`, `miroirTestSuiteUiExecution.ts`
  - `miroir-component-tests.unit.test.tsx`, `componentMiroirTests.consistency.unit.test.ts`
  - `componentTestSandbox.286.phase4`, `runAllComponentTests.286.phase6`, `componentTestRunLock.286.review`
- this plan

**File deleted:** `packages/miroir-standalone-app/scripts/generate-component-miroir-tests.ts`.

---

## Slice 2: tracer, interpreter, extractor fix, Enum from steps

**Status:** ✅ DONE · **Complexity:** L

### Goal

The 3 Enum cases run from declarative steps with no `custom` step, in vitest and in the app. The extractor reads the committed value of an open combobox. `$options` holds the option lists by field.

Kinds implemented in this slice: `expectRenderedValues`, `expectElement` (`present`, `value`, `attribute`), `openSelect`, `filterSelect`, `click`, `change`, `blur`, `type`, `clear`, `keyboard`, `waitForAttribute`, `custom`. Targets implemented: all locators except `widget` kinds other than `combobox` and `selectState`, plus `ref`/`saveAs`. The other kinds and widgets fail with "not implemented".

### 2.1 RED

First create stubs so that RED fails on behavior: `componentRegistry.ts` (`{}`), `componentTestTargets.ts` (functions throwing "not implemented"), `runComponentTestSteps.ts` (throws "not implemented"), and `customStepRegistry.ts` (`{}`).

**Test:** `tests/4_view/issues/292-declarative-react-component-tests/extractorOpenCombobox.292.phase2.unit.test.tsx`

- Fixture DOM (as `extractValuesScoped.286.phase3`): combobox input with value `""`, tracker `data-test-is-open="true"`, `data-test-selected-value="value2"`. The extractor returns `testField: "value2"`.
- The same with `data-test-is-open="false"` and input value `"value2"` returns `"value2"`.
- A real `ThemedSelectWithPortal` (filterable, 3 options) inside `PortalContainerProvider` is mounted with the act-free `mountComponent` and opened. The extractor with the portal element returns the selected value and the option list.

**Test:** `tests/4_view/issues/292-declarative-react-component-tests/componentTestSteps.292.phase2.unit.test.tsx`. It uses `createReactComponentTestRunner` over a sandbox element and a fixture Enum suite context. The real `JzodElementEditor` comes from the component registry.

- Steps of the analysis §5.4 Enum case 2 give `{ status: "ok" }`.
- An `expectRenderedValues` whose `expectedValue` is wrong, as step 3 with label "after click", gives `status: "error"`. Its message starts with `step 3 (expectRenderedValues "after click"): `, and `expected` / `actual` are set.
- `$options` is `{ testField: [3 values] }` while the list is open and absent when it is closed.
- An unknown `component` gives an error that names it.
- An implemented kind with a target that matches nothing gives `step 1 (click): …`.
- A kind not implemented yet gives `step 1 (clickArrayButton): not implemented`.
- `saveAs` then `{ref}` resolves the same element.
- A `custom` step registered in the test receives `params` and `context.lastValues` from the previous `expectRenderedValues`.
- `componentProps` of the leaf override the suite's (shallow), and `{"$bigint": "5"}` reaches the component as `5n`.
- With 2 leaves in `caseLabels`, the suite wrapper's `MiroirEventService.destroy` is called once, after the second.

**Enum JSON:** replace the Enum sub-suite of `761d4ed2-…` by the `reactComponentTestSuite` of analysis §5.4 (per P1 default (a)). Remove Enum from the manifest and the registry. `miroir-component-tests -t "JzodEnumEditor"` fails on the 3 cases through the stubs.

### 2.2 GREEN

- `componentRegistry.ts` (T13), `componentTestTargets.ts` (T6, T9), `runComponentTestSteps.ts` (analysis §5.3 rules, T10, T11, the kinds of this slice), `customStepRegistry.ts`.
- `runReactComponentTest.tsx`: step path (analysis §5.3), wrapper keyed by `suite.suitePath` (T4). The legacy path is unchanged.
- `componentTestTools.tsx`: `comboboxCommittedValue` (analysis §5.5).
- Delete `componentTests/jzodElementEditor/JzodEnumEditor.tsx`.
- Record the entry's wall time and compare it with Slice 0 (K1). If it is more than twice as slow, stop and ask the user (P2).

### 2.3 Refactor checkpoint

- `componentTests/` has no bare `console.*`, and `runComponentTestSteps.ts` imports nothing from `@testing-library/react`.
- Non-vacuity check, then revert: change `value2` to `value9` in case 1 and the option list in case 2. The Enum run gives 2 failed with T10 messages.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- extractorOpenCombobox.292.phase2
npm run testByFile -w miroir-standalone-app -- componentTestSteps.292.phase2
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodEnumEditor"
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
npm run testByFile -w miroir-standalone-app -- extractValuesFromRenderedElements
npm run testByFile -w miroir-standalone-app -- extractValuesScoped.286.phase3
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem multistepProcess.274.integ
npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem wizardWalk.284.integ
npm run testByFile -w miroir-standalone-app -- componentTestSandbox.286.phase4
npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6
python scripts/check_bare_console.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

Expected:

- `-t "JzodEnumEditor"`: 3 passed.
- Full entry: 70 passed, with a case list equal to the baseline.
- Importers: their Slice 0 counts.

Browser check: `JzodEnumEditor_ComponentTestSuite` gives 3/3, and the sandbox portal holds the open list of case 3 until the Enter step. Also run the production-build check of #286 plan §4.4 once here (`npm run build -w miroir-standalone-app`, then `vite preview --port 3000 --strictPort` against the API on 3080), because the interpreter is new code in the lazy chunk.

### Realization

Every command was run alone, one per file, from the repo root. The user's unrelated uncommitted changes (`ci/claude-cloud-env-script.sh`, the `admin_data` files, the spotify model files, `generate_externalServiceSync_suites.py`) were not touched, staged, or stashed. P1 is option (a) and P2 is default (a), as resolved in analysis §8.

**RED observed.** The stubs came first: `componentRegistry.ts` (`{}`), `customStepRegistry.ts` (`{}`), `componentTestTargets.ts` and `runComponentTestSteps.ts` (functions throwing "not implemented"). Then the two tests, the Enum JSON, and the removal of Enum from the manifest and the registry. Runs used `npx vitest run <file>` with `VITE_TEST_MODE=true`:

- `extractorOpenCombobox.292.phase2`: **2 failed, 1 passed**. The fixture test and the real `ThemedSelectWithPortal` test failed with `expected { testField: '' } to deeply equal { testField: 'value2' }` and `expected { testField: '', …(1) } to deeply equal { testField: 'value2', …(1) }`: the open combobox was read as its empty filter text. The closed-combobox test passed at RED. It guards that the fix does not change the closed read.
- `componentTestSteps.292.phase2`: **11 failed / 11**. The runner still had its Slice 1 step path, which returns `reactComponentTest "…" has no componentTestRef: declarative steps are not implemented yet`. So:
  - the `ok` tests failed with `expected { status: 'error', …(1) } to deeply equal { status: 'ok' }`;
  - the message tests failed with `expected false to be true` (no `step <n> (…)` prefix);
  - the unknown-component test failed with `expected 'reactComponentTest "FixtureEnum: case…' to contain '"NoSuchComponent"'`;
  - the both-fields test failed with `expected 'component test suite "Probe" is not i…' to contain 'exactly one of steps and componentTes…'`.
- `miroir-component-tests -t "JzodEnumEditor"`: **3 failed, 67 skipped**. Each Enum leaf got the same Slice 1 error result.

**GREEN:**

- **`componentRegistry.ts`** (T13): `{ JzodElementEditor: getJzodElementEditorForTest("JzodElementEditor.test") }` and the `ComponentRegistry` type.
- **`customStepRegistry.ts`** holds the `CustomStep` type `(env, params, context) => Promise<void>` and `ComponentTestStepContext { lastValues?, elements }`. `elements` holds the `saveAs` elements. It is deleted at M2.
- **`componentTestTargets.ts`** (T6, T9):
  - `queryAllTarget` requires exactly one locator. The locators `byRole` (+ `name`), `byTestId`, `byText`, `byDisplayValue`, and `byLabelText` query `env.view`. `widget` supports `combobox` and `selectState`, with `select` absent or `"value"`. `ref` reads the saved elements.
  - `resolveTarget` requires exactly one match when there is no `index`, and picks the match at `index` otherwise.
  - `reviveComponentProps` replaces every `{"$bigint": "<digits>"}` at any depth.
- **`runComponentTestSteps.ts`** (analysis §5.3):
  - One handler per implemented kind: `click`, `change`, `blur`, `type`, `clear`, `keyboard`, `waitForAttribute`, `openSelect`, `filterSelect`, `expectRenderedValues`, `expectElement` (`present`, `value`, `attribute`, `saveAs`), and `custom`. One `userEvent.setup()` session per case.
  - After each action step: `componentTestAct`, then `waitAfterUserInteraction(container)`. `openSelect` and `filterSelect` wait inside the act for `data-test-is-open="true"` and for `data-test-filter-text`, with a 1000 ms timeout.
  - `expectRenderedValues` calls the extractor with label `TESTSECTION` and step `label`, drops the array-valued entries, applies `formValuesToJSON`, and adds `$options` (T8). `$options` is built from the sandbox's `[role="option"]` elements whose `aria-label` is `<formik name>-option-<value>`, grouped by the name without `TESTSECTION.`. It then logs the value, keeps it as `context.lastValues`, and compares with the throwing `toEqual`.
  - A failure throws `ComponentTestStepError` with the message `step <n> (<kind>[ "<label>"]): <message>` (T10). For `expectRenderedValues` it also carries `expected` and `actual`.
  - A kind with no handler gives `step <n> (<kind>): not implemented`.
- **`runReactComponentTest.tsx`:**
  - A leaf needs exactly one of `steps` and `componentTestRef`; otherwise the result is `error`.
  - Step path: the result is `error` when there is no `suite` or the component is unknown. The message names the component. Otherwise the props are `reviveComponentProps({ ...suite.componentProps, ...leaf.componentProps })`. The wrapper is keyed by `suite.suitePath` and destroyed after the leaf labelled `suite.caseLabels.at(-1)` (T4). The steps run through `runComponentTestSteps`, and a failed `expectRenderedValues` returns `expected` / `actual` in the result.
  - The legacy path behaves as before. It now shares the mount code (`mountCase`) and the wrapper cache with the step path.
  - `ComponentTestSandboxHost` gains an optional `componentRegistry`.
- **`componentTestTools.tsx`** (analysis §5.5): `comboboxCommittedValue` reads an `input[role="combobox"]` whose state tracker `themed-select-state-<name>` (in the search roots) has `data-test-is-open="true"`. It returns the tracker's `data-test-selected-value`. It is used through `inputValue` in the 4 input reads: `miroirInput` self and child, `input[name]`, and the combobox branch. A closed combobox is read as before.
- **Enum JSON** (`761d4ed2-….json`, 2-space JSON, CRLF): the child is the `reactComponentTestSuite` of analysis §5.4, with P1 (a). Case 3 asserts `value2` plus `$options ["value3"]` while filtering, then presses `{Enter}`, waits for `data-test-selected-value` = `value3`, and asserts `value3`. No `custom` step. The labels are unchanged.
- **Enum is removed** from `componentTestManifest.ts` (the `componentTestSuiteInstances` entry stays) and from `componentTestRegistry.ts`. `componentTests/jzodElementEditor/JzodEnumEditor.tsx` is deleted.

**Refactor checkpoint:**
- `componentTests/` has no bare `console.*`, and `runComponentTestSteps.ts` imports nothing from `@testing-library/react` (grep).
- Non-vacuity check, then revert: `value9` in case 1 and the option list `["value1","value3","value2"]` in case 2 gave **2 failed, 1 passed**:
  - `step 1 (expectRenderedValues "initial"): [rendered values] Expected {"testField":"value2"} to equal {"testField":"value9"}. First difference at path: ["testField"]`
  - `step 3 (expectRenderedValues "after click"): [rendered values] Expected {…"$options":{"testField":["value1","value2","value3"]}} to equal {…["value1","value3","value2"]}}. First difference at path: ["$options", …]`
- The JSON was restored from a byte copy (`cmp` equal).

**Deviations:**

1. **Kinds and parameters of later slices fail with "not implemented".** Slice 2 implements the kinds and targets listed in its Goal. The following fail with `<what>: not implemented` inside the T10 message, so the RED tests of Slices 3-5 fail on behavior:
   - the parameters of later slices: text matches given as a number or regex, the refinements `fieldName`, `fieldNamePrefix`, and `id`, `expectRenderedValues.field`, `path`, `filter`, and `timeout`, and `expectElement.count`, `values`, `checked`, `containsHtml`, `parentContains`, and `timeout`;
   - the widgets other than `combobox` / `selectState`, and `select: "unionType"`.

   `index` is implemented now, since it is part of the core resolution rule.
2. **`ComponentTestSandboxHost.componentRegistry`** (optional) is added now, not at M1. The props / `$bigint` test and the wrapper-lifetime test need a fake component. M1 still removes `registry`.
3. **`context.elements`** is exposed to `custom` steps next to `lastValues`. The `saveAs` / `ref` test uses a custom step to check that two saved elements are the same node. The test also checks that an unknown `ref` fails as `step 1 (click): no element saved as "nope"`.
4. **One extra interpreter test:** a leaf with both `steps` and `componentTestRef` gives an error (K7). `componentTestSteps.292.phase2` therefore has 11 tests.
5. **The `$bigint` probe** converts bigint props before `JSON.stringify`. A `BigInt.prototype.toJSON` defined elsewhere in the app turned `5n` into `5` in the first GREEN run.
6. **Short timeout messages.** `waitFor` gets `onTimeout: (error) => error`, so a timed-out wait reports its last check without Testing Library's DOM dump.
7. **`$options` is added only when the compared value is a plain object**, not an array root. No current case reads options with an array root.
8. **Wrapper keys** are `suite:<JSON suitePath>` and `legacy:<suite name>`, so a step suite and a legacy suite can never share a wrapper.

**Validation** (one command per file, sequential):

| Command | Result | Expected |
|---|---|---|
| `npm run build -w miroir-test-app_deployment-miroir && … modelValidation.unit.test.ts` | 159 passed | 159 (Slice 1) ✓ |
| `extractorOpenCombobox.292.phase2` | 3 passed | — |
| `componentTestSteps.292.phase2` | 11 passed | — |
| `componentMiroirTests.consistency` | 8 passed | 8 ✓ |
| `miroir-component-tests -t "JzodEnumEditor"` | 3 passed, 67 skipped | 3 ✓ |
| `miroir-component-tests` | **70 passed** (real 59.9 s, vitest 52.7 s) | 70 ✓ |
| `extractValuesFromRenderedElements` | 4 passed | 4 ✓ |
| `extractValuesScoped.286.phase3` | 2 passed | 2 ✓ |
| `--profile emulatedServer-filesystem multistepProcess.274.integ` | 19 passed | 19 ✓ |
| `--profile emulatedServer-filesystem wizardWalk.284.integ` | 11 passed | 11 ✓ |
| `componentTestSandbox.286.phase4` | 5 passed | 5 ✓ |
| `runAllComponentTests.286.phase6` | 3 passed | 3 ✓ |
| `python scripts/check_bare_console.py` | OK | ✓ |
| `tsc` miroir-core | 0 errors | 0 ✓ |
| `tsc` miroir-standalone-app | 1 error, the known `JzodElementEditorHooks.ts(528,59)` TS2339 | baseline ✓ |

The reduced case list of the full entry (ANSI stripped, `<Editor> > <leaf label>: passed`, sorted, 68 lines) is byte-identical to `baseline-component-cases.txt`. After the production build, the bundle guard `componentTestChunk.286.phase4` also passed (4), as an extra check.

**K1 / P2 measurement.** The full entry took **59.9 s real** (vitest 52.7 s), against 56.6 s in Slice 0 and 58 s in Slice 1: ×1.06, far below the ×2 threshold. D9 (300 ms after every action) stays. Only the 3 Enum cases use it so far, so each migration slice measures again.

**Browser check.**
- Setup: the API server (`https://localhost:3080`) was running and was not restarted. The Vite dev server was down. This slice started it (`npm run dev -w miroir-standalone-app`) and stopped it after the check.
- Method: the Slice 1 script (`playwright-core` in the session scratchpad, headless Microsoft Edge, user `alice`), plus a `MutationObserver` that records every change of the `[role="option"]` list in the sandbox.
- **Development build:** `JzodEnumEditor_ComponentTestSuite` **3/3**, "PASSED", and the snackbar "…completed successfully", in 3.9 s.
  - The option snapshots were `[]` → 3 options (case 2) → `[]` → 3 options (case 3, open) → `["value3"]` (filtered) → `[]` (after Enter). Every option was inside the sandbox portal. So the portal held the open list of case 3 until the Enter step.
  - No console message matched `act(`. The sandbox kept 1 case container, and Close removed it.
  - Console errors: the known 403 at page load and the `Sidebar` / `AppBar` "unique key" warnings.
- **Production build:** `npm run build -w miroir-standalone-app` (3 min 4 s). The `vendor-react` chunk contains "act(...) is not supported in production builds of React.". Then `vite preview --port 3000 --strictPort`, started by this slice and stopped after the check, with the API on 3080.
  - The same result: 3/3, "PASSED", 3.1 s, the same option snapshots, no `act(` message, 1 container kept, and Close removed it.
  - Only console error: the 403.
- Ports 5173 and 3000 are free again. The 3080 server is still running.

**Impact on later slices:**
- The vocabulary is as in analysis §5.4. The one addition is `context.elements` for `custom` steps, which goes away at M2.
- Each later slice replaces a `not implemented` guard with the implementation (deviation 1): for example, the `textMatch` guard in `componentTestTargets.ts`, the refinement guard, and the parameter guards in the `expectRenderedValues` / `expectElement` handlers.
- `expectRenderedValues` reads label `TESTSECTION` until Slice 4 adds `field`.
- The legacy path and the manifest now hold 6 editors (65 cases).

**Files created:**
- `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentRegistry.ts`, `componentTestTargets.ts`, `runComponentTestSteps.ts`, `customStepRegistry.ts`
- `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/extractorOpenCombobox.292.phase2.unit.test.tsx` and `componentTestSteps.292.phase2.unit.test.tsx`

**Files changed:**
- `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/runReactComponentTest.tsx`, `componentTestTools.tsx`, `componentTestManifest.ts`, `componentTestRegistry.ts`
- `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-…/761d4ed2-1a5c-4901-a9d9-897dbec0b27f.json`
- this plan

**File deleted:** `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/jzodElementEditor/JzodEnumEditor.tsx`.

---

## Slice 3: Literal and SimpleType

**Status:** ⏳ GREEN, browser check of SimpleType pending (API server down) · **Complexity:** M

### Goal

The 3 Literal and 12 SimpleType cases run from steps (analysis §3.6 tables). New kinds and targets: `submit`, `expectElement` `count` and `checked`, `byDisplayValue` with number and regex, `byText` and `byLabelText` with regex, refinements `fieldName` and `id`. `$bigint` is used by SimpleType cases 11 and 12.

### 3.1 RED

**Test:** `tests/4_view/issues/292-declarative-react-component-tests/componentTestTargets.292.phase3.unit.test.tsx`. It mounts small fixtures through the act-free `mountComponent` and runs steps through `runComponentTestSteps`.

- `count` on a regex `byText`.
- `present:false` on `byLabelText` (the Literal case 2 shape).
- `byDisplayValue: 42` with `id: "testField"`.
- `fieldName: "testField"` on `byRole: "checkbox"`, with `checked` true and false.
- `submit` on `byRole: "form"` calls the form's `onSubmit`.
- A regex that matches nothing gives `step <n> (expectElement): …`.

**JSON:** replace the Literal and SimpleType sub-suites of their instances by `reactComponentTestSuite`s.

- Literal (T14): defaults without `label`, `rawJzodSchema` literal `test-value`, `listKey` `root.testField`. Cases 1 and 3 add the label.
- SimpleType: common props as defaults, each leaf adds `rawJzodSchema` and `initialFormState`. Cases 11 and 12 use `{"$bigint": "12345678901234567890"}`.
- Remove both suites from the manifest and the registry. The new entry fails on these 15 cases ("not implemented" or target errors).

### 3.2 GREEN

The kinds and targets above. Delete `jzodElementEditor/JzodLiteralEditor.tsx` and `JzodSimpleTypeEditor.tsx`.

### 3.3 Refactor checkpoint

Non-vacuity check, then revert: `count: 2` in Literal case 1 and `value: 101` in SimpleType case 5 give 2 failures with T10 messages.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- componentTestTargets.292.phase3
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodLiteralEditor"
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodSimpleTypeEditor"
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6
python scripts/check_bare_console.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

Expected: Literal 3 passed, SimpleType 12 passed, full entry 70 passed with a case list equal to the baseline. Browser check: the Literal instance 3/3 and the SimpleType instance 12/12.

### Realization

Every command was run alone, one per file, from the repo root. The user's unrelated uncommitted changes (`ci/claude-cloud-env-script.sh`, the `admin_data` files, the spotify model files, `generate_externalServiceSync_suites.py`) were not touched, staged, or stashed. No `custom` step is used.

**RED observed** (`npx vitest run <file>` with `VITE_TEST_MODE=true`, after writing the test, the two JSON suites, and removing both suites from the manifest and the registry):

- `componentTestTargets.292.phase3`: **6 failed / 6**, each on the Slice 2 guard of the missing feature: `step 1 (expectElement): expectElement.count: not implemented`, `byLabelText with a regex: not implemented`, `target refinement "id": not implemented`, `expectElement.checked: not implemented`, `step 1 (submit): not implemented`, and (regex that matches nothing) `expected 'step 1 (expectElement): byText with a…' to match /^step 2 \(expectElement\): no element…/`.
- `miroir-component-tests -t "JzodLiteralEditor|JzodSimpleTypeEditor"`: **13 failed, 2 passed**, 55 skipped. The failures were `count`, `byLabelText` / `byDisplayValue` with a regex, and the `fieldName` / `id` refinements, `checked` (`not implemented`). The 2 passing cases are SimpleType "boolean renders checkbox with proper value true / false": their only step is `expectRenderedValues` with no `field`, already implemented in Slice 2.

**GREEN:**

- **`componentTestTargets.ts`**:
  - Text matches: a string or a number is passed as is, and `{regex, flags?}` becomes a `RegExp`, for `byText`, `byDisplayValue`, `byLabelText`, and the `name` of `byRole`. `byRole.name` takes no number, so a number is compared as text there.
  - Refinements `fieldName` (`name === F(x)`) and `id` filter the `queryAll` result.
  - `resolveTarget`: with no refinement and no `index`, exactly one match is required, as before. With a refinement, `index` defaults to 0 (analysis §5.4 "Target resolution"). An empty filtered list gives `no element matches target …`.
  - `fieldNamePrefix` and the widgets other than `combobox` / `selectState` still fail with `not implemented` (Slice 4).
- **`runComponentTestSteps.ts`**:
  - New `submit` handler: `fireEvent.submit`, followed by the D9 post-action wait.
  - `expectElement.count` compares the number of matches of the full filtered list.
  - `expectElement.checked` uses `toBeChecked` / `.not.toBeChecked`.
  - A positive `expectElement` now also asserts `toBeInTheDocument` on the resolved element, as the old cases did.
  - `values`, `containsHtml`, `parentContains`, and `timeout` still fail with `not implemented` (Slices 4-5).
- **JSON** (2-space, CRLF, written by a script that checks the labels are unchanged):
  - `3995a071-…` (Literal): a `reactComponentTestSuite` with defaults `name`, `listKey: "root.testField"`, the list keys, `initialFormState: "test-value"`, and the literal schema, with no `label` (T14). Cases 1 and 3 add `"label": "Test Label"`.
  - `590693b6-…` (SimpleType): the common props (label, name, `ROOT.testField` keys) as defaults. Each leaf adds `rawJzodSchema` and `initialFormState`, and cases 11 and 12 use `{"$bigint": "12345678901234567890"}`.
  - The textbox is `{byRole: "textbox", fieldName: "testField"}`, the number input `{byDisplayValue: 42, id: "testField"}`, and the checkbox `{byRole: "checkbox", fieldName: "testField"}`. Each is saved with `saveAs` and asserted again through `{ref}` after the action, like the old cases, which kept the element in a variable.
  - Boolean cases use `expectRenderedValues` with no `field` (label `TESTSECTION`, analysis §3.7).
- **Removed** Literal and SimpleType from `componentTestManifest.ts` and `componentTestRegistry.ts`. Deleted `jzodElementEditor/JzodLiteralEditor.tsx` and `JzodSimpleTypeEditor.tsx`.

**Case mapping** (every old assertion kept):
- Literal 1: `count: 1` on `byText /Test Label/`, and the textbox is present.
- Literal 2: `present: false` on `byLabelText /Test Label/`, and the textbox is present.
- Literal 3: `byDisplayValue "test-value"` (saved), `change` to "new value", then `byDisplayValue /test-value/`.
- SimpleType 1-7, 11-12: `value` before the change, `change`, then `value` after it on the same element. Case 3 then does `submit` on `{byRole: "form"}`.
- SimpleType 8-10: `checked` true, `click`, `checked` false, then `expectRenderedValues "after change"` = `{testField: false}`.

**Refactor checkpoint:**
- Non-vacuity check, then revert: `count: 2` in Literal case 1 and `value: 101` in SimpleType case 5 gave **2 failed, 13 passed**:
  - `step 1 (expectElement "only one label"): expected 2 elements to match target {"byText":{"regex":"Test Label"}}, found 1`
  - `step 3 (expectElement "after change"): [element value] Expected <input name="TESTSECTION.testField"> to have value 101, received 100`
- Both JSON files were restored from byte copies (`cmp` equal).
- `componentTests/` has no bare `console.*`, and `runComponentTestSteps.ts` / `componentTestTargets.ts` import nothing from `@testing-library/react`.

**Deviations:**

1. **SimpleType case 12 `change` value.** The old case passed the bigint `98765432109876543210n` to `fireEvent.change`. JSON has no bigint, and `change.value` is `string | number | boolean`, so the step passes the string `"98765432109876543210"`. The DOM `value` setter turns both into the same string, and the assertion (`toHaveValue("98765432109876543210")`) is unchanged.
2. **`toBeInTheDocument` in `expectElement`.** A positive `expectElement` now asserts `toBeInTheDocument` on the resolved element. The old cases asserted it explicitly, and the check is cheap. It also applies to the Enum case, which still passes.
3. **A refinement defaults `index` to 0**, following analysis §5.4. It mirrors the old `getAllBy…().filter(…)[0]`. Without a refinement, `getBy` semantics stay.
4. **Step labels.** The new JSON steps have labels ("initial", "after change", "only one label", …) so that failure messages name them. The leaf labels are unchanged.

**Validation** (one command per file, sequential):

| Command | Result | Expected |
|---|---|---|
| `npm run build -w miroir-test-app_deployment-miroir && … modelValidation.unit.test.ts` | 159 passed | 159 ✓ |
| `componentTestTargets.292.phase3` | 6 passed | — |
| `componentMiroirTests.consistency` | 8 passed | 8 ✓ |
| `miroir-component-tests -t "JzodLiteralEditor"` | 3 passed, 67 skipped | 3 ✓ |
| `miroir-component-tests -t "JzodSimpleTypeEditor"` | 12 passed, 58 skipped | 12 ✓ |
| `miroir-component-tests` | **70 passed** (real 59.0 s, vitest 52.1 s) | 70 ✓ |
| `runAllComponentTests.286.phase6` | 3 passed | 3 ✓ |
| `python scripts/check_bare_console.py` | OK | ✓ |
| `tsc` miroir-standalone-app | 1 error, the known `JzodElementEditorHooks.ts(528,59)` TS2339 | baseline ✓ |
| extra: `componentTestSteps.292.phase2` | 11 passed | 11 ✓ |

The reduced case list of the full entry (ANSI stripped, `<Editor> > <leaf label>: passed`, sorted, 68 lines) is byte-identical to `baseline-component-cases.txt`.

**K1 / P2 measurement.** The full entry took **59.0 s real**, against 56.6 s in Slice 0: ×1.04, far below ×2. D9 stays.

**Browser check (dev build): partial.**
- Setup: at the start of the check, the API server (`https://localhost:3080`) was running and the Vite dev server was down. This slice started Vite (`npm run dev -w miroir-standalone-app`).
- Method: the Slice 1 script (`playwright-core` in the session scratchpad, headless Microsoft Edge, user `alice`).
- **Literal: 3/3.** The panel read "PASSED", and the snackbar "JzodLiteralEditor_ComponentTestSuite Miroir tests completed successfully", in 2.7 s. No console message matched `act(`. The sandbox kept 1 case container, and Close removed it. The console errors were the known 403 and the `Sidebar` / `AppBar` "unique key" warnings.
- **SimpleType: not run.** Right after the Literal check, the API server on 3080 stopped. It was not started by this slice, and nothing in this slice touched it. Vite then logged `ECONNREFUSED` proxy errors, and the login form never rendered. Two attempts to start the API server failed:
  - `NODE_ENV=development node packages/miroir-server/release/index.js` from the repo root started, but read 0 deployments (`filesystemDeploymentRootDirectory: ".."` resolved from the repo root), so login failed with `AuthenticationDirectoryMissing`. It was stopped.
  - The same command from `packages/miroir-server` exited with `MiroirSecret rows exist but no wrapping key was provided`. No `MIROIR_SECRETS_MASTER_KEY` is available to this session.
- The Vite server started by this slice was stopped afterwards (port 5173 is free). Ports 3080 and 4080 are free: the user's API server is down and needs a restart with its secrets master key.
- **browser check not run for `JzodSimpleTypeEditor_ComponentTestSuite`: the API server went down and cannot be restarted without the secrets master key.** Per the test execution conventions, the slice stays ⏳ until this check is run.

**Impact on later slices:**
- The vocabulary is unchanged from analysis §5.4.
- Slice 4 still has to implement:
  - the refinement `fieldNamePrefix` (its guard is in `queryAllTarget`);
  - `expectElement.values` and `containsHtml`;
  - `expectRenderedValues` `field` and `path`;
  - the widgets `arrayButton`, `objectButton`, and `recordEntryName`, and the steps `clickArrayButton`, `clickObjectButton`, and `renameRecordEntry`.
- Slice 5 still has to implement `parentContains`, the `timeout` of `expectElement` / `expectRenderedValues`, `expectRenderedValues.filter`, `select: "unionType"`, the `unionTypeStar` / `unionTypeInput` widgets, and `toggleUnionTypeSelector` / `selectOption`.
- With a refinement, a target picks the first filtered match unless `index` is given (deviation 3).
- The legacy path and the manifest now hold 4 editors (50 cases).

**Files created:**
- `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/componentTestTargets.292.phase3.unit.test.tsx`

**Files changed:**
- `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestTargets.ts`, `runComponentTestSteps.ts`, `componentTestManifest.ts`, `componentTestRegistry.ts`
- `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-…/3995a071-b8ae-48d3-a488-6d1fc828b725.json` and `590693b6-2125-43fc-89d7-1330ae8318db.json`
- this plan

**Files deleted:** `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/jzodElementEditor/JzodLiteralEditor.tsx` and `JzodSimpleTypeEditor.tsx`.

---

## Slice 4: Array and Object

**Status:** ⏳ GREEN, browser check pending (API server down) · **Complexity:** L

### Goal

The 12 Array and 14 Object cases run from steps. New kinds and targets: `clickArrayButton` (up, down, add, duplicate, delete), `clickObjectButton` (addOptionalAttribute, addRecordEntry, remove, duplicate), `renameRecordEntry`, `expectElement` `values` and `containsHtml`, refinement `fieldNamePrefix`, `expectRenderedValues` `field` and `path`. `$bigint` is used by Object case 2.

### 4.1 RED

**Test:** `tests/4_view/issues/292-declarative-react-component-tests/componentTestWidgets.292.phase4.unit.test.tsx`. It uses the runner with the real `JzodElementEditor` and fixture suites: a string array, a record of objects, and an object with optional attributes.

- Each `clickArrayButton` action resolves the button named in analysis §5.4 and changes the values as the old case did.
- `values` reads the item textboxes in DOM order after `up`.
- `renameRecordEntry` renames and keeps the value, and a `ref` saved before the rename reads the new name.
- `expectRenderedValues` with `field: "testField"` returns an array for the array fixture.
- `path: ["definition"]` selects a sub-object.
- A missing button gives `step <n> (clickObjectButton): …`.

**JSON:** Array and Object `reactComponentTestSuite`s per analysis §3.6. Remove both from the manifest and the registry.

**#286 phase4 test:** its failing-case test no longer replaces a registry case. It loads the Array instance, replaces the `expectElement` of leaf 2 with a `present:true` check on a target that matches nothing, and passes the edited instance to `MiroirTestDisplay`. Expected: 11 `ok` and 1 `error` whose message starts with `step 1 (expectElement)`.

### 4.2 GREEN

The kinds, targets, and parameters above. Delete `jzodElementEditor/JzodArrayEditor.tsx` and `JzodObjectEditor.tsx`.

### 4.3 Refactor checkpoint

Non-vacuity check, then revert: a wrong order in Array case 4 `values` and `firstRecord_copy1.a: "X"` in Object case 13 give 2 failures with T10 messages.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- componentTestWidgets.292.phase4
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodArrayEditor"
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodObjectEditor"
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
npm run testByFile -w miroir-standalone-app -- componentTestSandbox.286.phase4
npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6
npm run testByFile -w miroir-standalone-app -- componentTestFireEvent.286.phase8
python scripts/check_bare_console.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

Expected:

- Array 12 passed, Object 14 passed.
- Full entry 70 passed, with a case list equal to the baseline.
- `componentTestSandbox.286.phase4`: its Slice 0 count.

Browser check: the Array instance 12/12 and the Object instance 14/14.

### Realization

Every command was run alone, one per file, from the repo root. The user's unrelated uncommitted changes (`ci/claude-cloud-env-script.sh`, the `admin_data` files, the spotify model files, `generate_externalServiceSync_suites.py`) were not touched, staged, or stashed. No `custom` step is used.

**RED observed** (`npx vitest run <file>` with `VITE_TEST_MODE=true`). First the new test, the two JSON suites, and the removal of Array and Object from the manifest and the registry:

- `componentTestWidgets.292.phase4`: **9 failed / 9**, each on the Slice 2-3 guard of a missing feature:
  - `step 1 (expectElement "initial"): expectElement.values: not implemented`;
  - `step 1 (clickArrayButton): not implemented` (×2) and `step 1 (clickObjectButton): not implemented` (×2);
  - `step 1 (expectElement): widget "arrayButton": not implemented` and `widget "recordEntryName": not implemented`;
  - `step 1 (expectRenderedValues "initial"): expectRenderedValues.field: not implemented` (the `path` test);
  - the missing-button test got `step 1 (expectRenderedValues "initial"): …field: not implemented` instead of `/^step 2 \(clickObjectButton\): no element matches target/`.
- `miroir-component-tests -t "JzodArrayEditor|JzodObjectEditor"`: **25 failed, 1 passed**, 44 skipped. The failures were `clickArrayButton` / `clickObjectButton` `not implemented`, the `arrayButton` / `objectButton` / `recordEntryName` widgets, `expectElement.values`, `expectRenderedValues.field`, and `target refinement "fieldNamePrefix"`. The passing case is Array "renders array input with label…": its only step is `count` on a regex `byText`, implemented in Slice 3.

**GREEN:**

- **`componentTestTargets.ts`**:
  - Refinement `fieldNamePrefix`: `name` starts with `F(x)`.
  - Widget `arrayButton` (analysis §5.4): `up` / `down` are the elements with role `F(field).button.<action>` (`index` picks one); `add` is the button named `<field>.add`; `duplicate` / `delete` are the buttons named `F(field.<index>)-duplicateArrayItem` / `-removeArrayItem`. For these two, `index` is the item index, part of the address, so `resolveTarget` does not also pick with it.
  - Widget `objectButton`: `addOptionalAttribute` (`F(field).addObjectOptionalAttribute.<attribute>`), `addRecordEntry` (`F(field).addRecordAttribute`), `remove` / `duplicate` (`F(field.<attribute>)-removeOptionalAttributeOrRecordEntry` / `-duplicateRecordEntry`).
  - Widget `recordEntryName`: the textbox named `F(field.<entry>)-NAME`.
  - A missing `attribute`, `entry`, or item `index`, or an unknown `action`, gives an error naming the target.
- **`runComponentTestSteps.ts`**:
  - `clickArrayButton` and `clickObjectButton` click their widget target, then the D9 post-action wait.
  - `renameRecordEntry`: `change` to `newName` (in `componentTestAct`), then `blur`, then the D9 wait, as the old cases did.
  - `expectElement.values` compares the `value` of every match of the full filtered list, in DOM order, with the throwing `toEqual`. `containsHtml` uses `toContainHTML`.
  - `expectRenderedValues.field`: extractor label `F(field)` (absent: `TESTSECTION`). `path` selects the sub-value after `formValuesToJSON`; `$options` is added to the selected value when it is a plain object.
  - `filter`, `timeout`, `parentContains`, and the union widgets still fail with `not implemented` (Slice 5).
- **JSON** (2-space, CRLF, written by a script that checks that the child label and the 12 / 14 leaf labels are unchanged):
  - `1b71d68b-…` (Array): a `reactComponentTestSuite` whose defaults are the common props, the string array schema, and `["value1","value2","value3"]`. Cases 7, 8, 9, and 11 override `rawJzodSchema` and `initialFormState`.
  - `da353085-…` (Object): the common props as defaults. Each leaf adds `rawJzodSchema` and `initialFormState`; case 2 uses `{"e": {"$bigint": "123"}}`.
- **Removed** Array and Object from `componentTestManifest.ts` (the `componentTestSuiteInstances` entries stay) and from `componentTestRegistry.ts`. Deleted `jzodElementEditor/JzodArrayEditor.tsx` and `JzodObjectEditor.tsx`.
- **#286 tests adapted:**
  - `componentTestSandbox.286.phase4`: the Array leaf labels come from the instance JSON. The failing-case test loads a copy of the Array instance, replaces the steps of leaf 2 with `{expectElement, target: {byTestId: "no-such-element-292"}, present: true}`, and passes the copy to `MiroirTestDisplay` (new optional `miroirTest` parameter of `renderDisplays` / `runArraySuite`). It expects 11 `ok`, 1 `error` on leaf 2, and `step 1 (expectElement): no element matches target` in the tracker results.
  - `componentTestChunk.286.phase4` (bundle guard): it looked for `componentTests/jzodElementEditor/JzodArrayEditor`, deleted here. It now looks for `componentTests/runComponentTestSteps`, as planned for Slice 6.
  - `componentTestSteps.292.phase2`: its "kind not implemented yet" test used `clickArrayButton`, implemented here. It now uses `toggleUnionTypeSelector` (Slice 5).

**Case mapping** (every old assertion kept; `F` = `field: "testField"`):

- Array 1: `count: 1` on `byText /Test Label/`.
- Array 2, 4-6: `values` on `{byRole: "textbox", fieldNamePrefix: "testField."}` (the old `arrayItemTextBoxValues`), after `clickArrayButton` `up 1`, `up 2`, `down 0` for 4-6.
- Array 3: `change` on the same target with `index: 1` (saved as `cell`), then `containsHtml: "new value"` on `{ref: "cell"}`.
- Array 7: `expectRenderedValues "before up button click"` F, `clickArrayButton down 0`, `expectRenderedValues "after up button click"` F.
- Array 8, 9: `expectRenderedValues "initial"` F. Array 10, 11: `clickArrayButton add`, then `"after add button click"` F.
- Array 12: `expectElement` on the `arrayButton` `duplicate` target of item 1 (the old `toBeTruthy` on `getByRole`), `clickArrayButton duplicate 1`, `"after duplicate button click"` F.
- Object 1, 2: `expectRenderedValues` F with the old labels (`"after delete button click"`, `"initial"`).
- Object 3: `value` on `{byTestId: "miroirInput", fieldName: "testField.a"}` / `…b` (saved), `change` ×2 through the refs, `"after change"` F.
- Object 4-6, 8: `clickObjectButton` (`addOptionalAttribute a`, `remove a`, `remove b`, `addRecordEntry`), then `expectRenderedValues` F.
- Object 7: `expectRenderedValues "initial"` F = `{firstRecord: {a, b}}` (deviation 3).
- Object 9, 14: `value` on the `recordEntryName` target (saved), `renameRecordEntry`, `value` on the ref, then `expectRenderedValues` F; case 14 with `field: "testField.definition"` for the name and `path: ["definition"]` for the values.
- Object 10-13: `expectElement` on the `objectButton` target (the old `toBeInTheDocument`), `clickObjectButton remove` / `duplicate`, then `expectRenderedValues` F.

**Refactor checkpoint:**
- Non-vacuity check, then revert: the order `["value1","value2","value3"]` in Array case 4 `values` and `firstRecord_copy1.a: "X"` in Object case 13 gave **2 failed, 24 passed**:
  - `step 2 (expectElement "after up button click"): [element values] Expected ["value2","value1","value3"] to equal ["value1","value2","value3"]. First difference at path: ["0"]`
  - `step 3 (expectRenderedValues "after duplicate button click"): [rendered values] Expected {…"firstRecord_copy1":{"a":"test string","b":42}} to equal {…"firstRecord_copy1":{"a":"X",…}}…`
- Both JSON files were restored from byte copies (`cmp` equal).
- `runComponentTestSteps.ts` and `componentTestTargets.ts` have no bare `console.*` and import nothing from `@testing-library/react`.

**Deviations:**

1. **No `toBeInTheDocument` on a `ref` target.** A positive `expectElement` asserts `toBeInTheDocument` only when its target is found by a query (Slice 3 deviation 2). A `ref` designates an element saved earlier, which a re-render may detach: the record entry name input is replaced after `renameRecordEntry` (Object cases 9 and 14; the phase4 test failed with `Expected <input name="TESTSECTION.testField.firstRecord-NAME"> to be in the document`). The old cases asserted only `toHaveValue` on the saved element after an action, never its presence (checked for Object 9 and 14, Array 3, and the SimpleType cases of Slice 3), so no old assertion is dropped. As in the old cases, the value read after a rename is the value of the detached input; the `expectRenderedValues` that follows checks the rendered state.
2. **Object case 3: two `change` steps instead of one act.** The old case changed `a` and `b` inside one `act`. Each `change` step is its own action with the D9 wait. The assertions are the same.
3. **Object case 7 compares the nested form.** The old case compared the raw extractor values `{"firstRecord.a", "firstRecord.b"}`. `expectRenderedValues` always applies `formValuesToJSON`, so it compares `{firstRecord: {a: "test string", b: 42}}`, the same information (analysis §3.6, §3.7).
4. **Uniform post-action wait** (K2). Array cases 4-6 and Object cases 10-11 asserted without a wait after the click. The D9 wait now follows every action; all cases still pass.
5. **The `index` of an array `duplicate` / `delete` button is the item index**, not a pick among matches (analysis §5.4 widget table). `resolveTarget` requires exactly one match for these targets.
6. **The bundle guard and the phase2 "not implemented" test** were updated in this slice (see "#286 tests adapted"), because the files and the kind they named are gone or implemented now.

**Validation** (one command per file, sequential):

| Command | Result | Expected |
|---|---|---|
| `npm run build -w miroir-test-app_deployment-miroir && … modelValidation.unit.test.ts` | 159 passed | 159 ✓ |
| `componentTestWidgets.292.phase4` | 9 passed | — |
| `componentMiroirTests.consistency` | 8 passed | 8 ✓ |
| `miroir-component-tests -t "JzodArrayEditor"` | 12 passed, 58 skipped | 12 ✓ |
| `miroir-component-tests -t "JzodObjectEditor"` | 14 passed, 56 skipped | 14 ✓ |
| `miroir-component-tests` | **70 passed** (real 60.9 s, vitest 54.1 s) | 70 ✓ |
| `componentTestSandbox.286.phase4` | 5 passed | 5 (Slice 0) ✓ |
| `runAllComponentTests.286.phase6` | 3 passed | 3 ✓ |
| `componentTestFireEvent.286.phase8` | 4 passed | 4 ✓ |
| `python scripts/check_bare_console.py` | OK | ✓ |
| `tsc` miroir-standalone-app | 1 error, the known `JzodElementEditorHooks.ts(528,59)` TS2339 | baseline ✓ |
| extra: `componentTestSteps.292.phase2` | 11 passed | 11 ✓ |
| extra: `componentTestTargets.292.phase3` | 6 passed | 6 ✓ |
| extra: `npm run build -w miroir-standalone-app`, then `componentTestChunk.286.phase4` | 4 passed | 4 ✓ |

The reduced case list of the full entry (verbose reporter, ANSI stripped, `<Editor> > <leaf label>: passed`, sorted, 68 lines) is byte-identical to `baseline-component-cases.txt`.

**K1 / P2 measurement.** The full entry took **60.9 s real** (vitest 54.1 s), against 56.6 s in Slice 0: ×1.08, far below ×2. D9 stays.

**Browser check: pending (API server down).** `curl` to `https://localhost:3080` and `http://localhost:3080` got no answer (exit 7, connection refused). The API server needs the user's secrets master key to start (Slice 3 Realization), so it was not started, and no server was started by this slice. The browser checks of the Array instance (12/12) and the Object instance (14/14), and the SimpleType check pending from Slice 3, remain to be run. Per the test execution conventions, the slice stays ⏳ until then.

**Impact on later slices:**
- The vocabulary is unchanged from analysis §5.4. Clarified semantics: a positive `expectElement` on a `ref` target does not assert presence (deviation 1), and the `index` of an array `duplicate` / `delete` target is the item index (deviation 5).
- Slice 5 still has to implement `parentContains`, the `timeout` of `expectElement` / `expectRenderedValues`, `expectRenderedValues.filter`, `select: "unionType"`, the `unionTypeStar` / `unionTypeInput` widgets, and `toggleUnionTypeSelector` / `selectOption`. When it implements `toggleUnionTypeSelector`, the "kind not implemented yet" test of `componentTestSteps.292.phase2` needs another subject (no kind will be left unimplemented; e.g. a kind absent from the handler table, or delete the test).
- `$options` is added to the value selected by `path`, when it is a plain object.
- The legacy path and the manifest now hold 2 editors (Union, Any: 24 cases). The bundle guard already names `componentTests/runComponentTestSteps` (planned for Slice 6).

**Files created:**
- `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/componentTestWidgets.292.phase4.unit.test.tsx`

**Files changed:**
- `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestTargets.ts`, `runComponentTestSteps.ts`, `componentTestManifest.ts`, `componentTestRegistry.ts`
- `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-…/1b71d68b-7dc9-468c-a251-4fa7889f20f4.json` and `da353085-c62b-4aa6-bd54-8813d303dfe5.json`
- `packages/miroir-standalone-app/tests/4_view/issues/286-react-component-miroir-tests/componentTestSandbox.286.phase4.integ.test.tsx` and `componentTestChunk.286.phase4.unit.test.ts`
- `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/componentTestSteps.292.phase2.unit.test.tsx`
- this plan

**Files deleted:** `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/jzodElementEditor/JzodArrayEditor.tsx` and `JzodObjectEditor.tsx`.

---

## Slice 5: Union and Any

**Status:** ⏳ GREEN, browser check pending (API server down) · **Complexity:** L

### Goal

The 9 Union and 15 Any cases run from steps. All 68 cases are declarative. New kinds and targets:

- `selectOption`, for `select` `value` and `unionType`
- `toggleUnionTypeSelector`
- the widget targets `unionTypeStar`, `unionTypeInput`, and `selectState` with `unionType`
- `expectElement` `parentContains` and `timeout`
- `expectRenderedValues` `filter` and `timeout`

### 5.1 RED

**Test:** `tests/4_view/issues/292-declarative-react-component-tests/componentTestUnionWidgets.292.phase5.unit.test.tsx`. It uses the runner with the real `JzodElementEditor`.

- `toggleUnionTypeSelector` twice shows then hides the union type input.
- `selectOption` with `select: "unionType"` switches a `string|number` value from `number` to `string`, and the state's selected value becomes `string`.
- `selectOption` on a discriminator field switches `type1` to `type2`.
- `parentContains` passes for the star and the selector input and fails for two unrelated elements.
- `expectRenderedValues` with `timeout` retries until equal, and gives a T10 message at timeout.
- `filter: []` reads only the `miroirInput` elements and checkboxes.

**JSON:** Union and Any `reactComponentTestSuite`s per analysis §3.6. Any defaults include `rawJzodSchema: {type: "any"}`. Remove both from the manifest and the registry. The manifest and the registry are then empty.

### 5.2 GREEN

The kinds and targets above. Delete `jzodElementEditor/JzodUnionEditor.tsx` and `JzodAnyEditor.tsx`. The `jzodElementEditor/` folder is empty and is deleted.

### 5.3 Refactor checkpoint

- No leaf in the 7 instances uses `custom` or `componentTestRef` (checked by a new assertion in `componentTestInstances.292.phase1`).
- Non-vacuity check, then revert: `type2Attribute: 1` in Union case 4 and `["item1","item2"]` in Any case 12 give 2 failures with T10 messages.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- componentTestUnionWidgets.292.phase5
npm run testByFile -w miroir-standalone-app -- componentTestInstances.292.phase1
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodUnionEditor"
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodAnyEditor"
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6
npm run testByFile -w miroir-standalone-app -- portalContainer.286.phase5
python scripts/check_bare_console.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

Expected: Union 9 passed, Any 15 passed, full entry 70 passed with a case list equal to the baseline. Record the wall time against Slice 0. Browser check: all 7 instances, 68/68 in total, and one "Run All Unit Tests" run with "Include component tests" checked, in which the 68 component results are `ok`.

### Realization

Every command was run alone, one per file, from the repo root. The user's unrelated uncommitted changes (`ci/claude-cloud-env-script.sh`, the `admin_data` files, the spotify model files, `generate_externalServiceSync_suites.py`) were not touched, staged, or stashed. No `custom` step is used.

**RED observed** (`npx vitest run <file>` with `VITE_TEST_MODE=true`). First the new test, the two JSON suites, the new assertion of `componentTestInstances.292.phase1`, and the removal of Union and Any from the manifest and the registry:

- `componentTestUnionWidgets.292.phase5`: **6 failed / 6**, each on the Slice 2-4 guard of a missing feature:
  - `step 1 (expectElement): widget "unionTypeStar": not implemented` (toggle test and `parentContains` test);
  - `step 1 (toggleUnionTypeSelector): not implemented` (union type `selectOption` test);
  - `step 2 (selectOption): not implemented` (discriminator test);
  - `step 1 (expectRenderedValues "retried"): expectRenderedValues.timeout: not implemented`;
  - `step 2 (expectRenderedValues "empty filter"): expectRenderedValues.filter: not implemented`. Its step 1 (no filter) already passed, so the fixture reads as the test expects.
- `miroir-component-tests -t "JzodUnionEditor|JzodAnyEditor"`: **17 failed, 7 passed**, 46 skipped. The failures were the `unionTypeStar` widget, `toggleUnionTypeSelector`, `selectOption`, and `expectRenderedValues.filter` (`not implemented`). The 7 passing cases are Any 5, 6, and 11-15: their steps (`fieldName` textboxes, array and object buttons, `field`) were implemented in Slices 3-4.
- The new assertion of `componentTestInstances.292.phase1` (every child is a `reactComponentTestSuite`, no leaf has `componentTestRef` or a `custom` step) was written together with the Union and Any JSON, so it was not observed failing. Before this slice, the Union and Any children were plain `miroirTestSuite`s with `componentTestRef` leaves, which it rejects.

**GREEN:**

- **`componentTestTargets.ts`** (analysis §5.4 widget table):
  - `unionTypeStar`: `[data-testid="union-type-star-F(field)"]`.
  - `unionTypeInput`, and `combobox` with `select: "unionType"`: `[data-testid="union-type-input-F(field)"]`.
  - `selectState` with `select: "unionType"`: `[data-testid="themed-select-state-union-type-F(field)"]` (the union type select is named `union-type-F(field)`).
  - The last `not implemented` guard of the file is gone: an unknown widget (JSON that bypassed the schema) now gives `unknown widget "<w>", in <target>`.
- **`runComponentTestSteps.ts`**:
  - `selectOption` (analysis §5.4): inside one action, open the select if its state is not open (click, wait `data-test-is-open="true"`, 1000 ms), `clear`, `type` the option, wait `data-test-filter-text` = option and `data-test-filtered-options-count="1"` (1000 ms), `{Enter}`, wait `data-test-is-open="false"` and `data-test-selected-value` = option (2000 ms). Then the D9 post-action wait.
  - `toggleUnionTypeSelector`: click the star, and wait until the presence of the union type input has flipped (1000 ms), then the D9 wait.
  - `expectRenderedValues.filter` is passed to the extractor. `timeout` retries the whole read and comparison with `waitFor`; at timeout the last mismatch is reported in the T10 form with `expected` / `actual`.
  - `expectElement.parentContains` checks `element.parentElement.contains(<resolved target>)`. `timeout` retries the whole `expectElement` check with `waitFor`.
  - The bodies of `expectRenderedValues` and `expectElement` became the one-shot checks `checkRenderedValues` / `checkElement`, called directly or retried. The parameter guards and the `notImplemented` helper are gone. Every kind of the schema has a handler: a kind outside the schema gives `step <n> (<kind>): unknown step kind`.
- **JSON** (2-space, CRLF, written by a script that checks that the child label and the 9 / 15 leaf labels are unchanged):
  - `de517cd6-…` (Union): a `reactComponentTestSuite` with the common props as defaults. Each leaf adds `rawJzodSchema` and `initialFormState`.
  - `ec601bcc-…` (Any): defaults are the common props plus `rawJzodSchema: {type: "any"}`. Each leaf adds `initialFormState`.
- **Removed** Union and Any from `componentTestManifest.ts` and `componentTestRegistry.ts`, which are now empty (`{}`; the `componentTestSuiteInstances` table and `componentTestLeafLabel` stay for M1). Deleted `jzodElementEditor/JzodUnionEditor.tsx` and `JzodAnyEditor.tsx`; the `jzodElementEditor/` folder is gone.
- **`componentTestSteps.292.phase2`**: its "kind not implemented yet" test (subject `toggleUnionTypeSelector` since Slice 4) now uses a kind outside the schema, `{"step": "fly"}`, and expects `step 1 (fly): unknown step kind`. No kind of the schema is left unimplemented, so the test guards the fallback for JSON that bypassed the schema. The file keeps 11 tests.
- **`componentTestInstances.292.phase1`**: new test (refactor checkpoint 5.3) "every child is a reactComponentTestSuite and no leaf uses componentTestRef or a custom step". The file has 5 tests.

**Case mapping** (every old assertion kept; `F` = `field: "testField"`, star = `{widget: "unionTypeStar", field: "testField"}`, input = `{widget: "unionTypeInput", field: "testField"}`):

- Union 1, 2: `expectRenderedValues "initial form state"`, `filter: []`, no `field` = `{testField: 42}`. Union 3: the same with `F` = `{a: "test string", b: 42}`.
- Union 4: `expectRenderedValues "initial form state"` F; `value: "type1"` on `{byDisplayValue: "type1"}`; `attribute` `data-test-selected-value` = `type1` and `data-test-is-open` = `false` on `{widget: "selectState", field: "testField.testObjectType"}`; `selectOption` `type2` on `testField.testObjectType`; `{byText: "type2Attribute", index: 0}` present with `timeout: 5000`; `expectRenderedValues "after change to type2"` F = `{testObjectType: "type2", type2Attribute: 0}`.
- Union 5, 6: star present; input absent; `toggleUnionTypeSelector`; `attribute` `data-test-selected-value` = `number` on the `unionType` state; `selectOption` with `select: "unionType"`. Case 5: input absent with `timeout: 3000`, then `expectRenderedValues "after change to string"`, `filter: []`, `timeout: 3000` = `{testField: ""}`. Case 6: `{byText: "a", index: 0}` present with `timeout: 5000`, input absent with `timeout: 3000`, then `"after change to object"` F = `{a: "", b: 0}`.
- Union 7, Any 1: star present, input absent.
- Union 8, Any 2: `toggleUnionTypeSelector`, input present (`timeout: 1000`), `toggleUnionTypeSelector`, input absent (`timeout: 1000`).
- Union 9, Any 4: star present (`saveAs: "star"`), `toggleUnionTypeSelector`, input present (`timeout: 1000`, `saveAs: "selector"`), then `{ref: "star"}` with `parentContains: {ref: "selector"}`.
- Any 3, 7-10 (the old `switchAnyType`): star present, `toggleUnionTypeSelector`, the current type on the `unionType` state when the old case checked it (3, 7: `number`; 10: `array`), `selectOption` with `select: "unionType"`, then `expectRenderedValues` with `timeout: 3000` and the old label, filter, and field: 3, 8, 10 `"after change to string"`, `filter: []`, no field = `{testField: ""}`; 7 `"after change to record"` F = `{a: "enter attributes here..."}`; 9 `"after change to array"` F = `["enter elements here..."]`.
- Any 5, 6: `value` on `{byRole: "textbox", fieldName: "testField.a"}` (`"hello"`) / `…b` (`1`).
- Any 11-15: as the Array and Object cases of Slice 4: `clickArrayButton` `add` / `delete 1` / `duplicate 1` and `clickObjectButton` `addRecordEntry` / `remove a`, with the button asserted present first where the old case did (12, 13, 15), then `expectRenderedValues` F with the old labels.

**Refactor checkpoint:**
- No leaf of the 7 instances uses `custom` or `componentTestRef` (the new `componentTestInstances.292.phase1` test, green).
- Non-vacuity check, then revert: `type2Attribute: 1` in Union case 4 and `["item1","item2"]` in Any case 12 gave **2 failed, 22 passed**:
  - `step 7 (expectRenderedValues "after change to type2"): [rendered values] Expected {"type2Attribute":0,"testObjectType":"type2"} to equal {"testObjectType":"type2","type2Attribute":1}. First difference at path: ["type2Attribute"]`
  - `step 3 (expectRenderedValues "after delete button click"): [rendered values] Expected ["item1","item3"] to equal ["item1","item2"]. First difference at path: ["1"]`
- Both JSON files were restored from byte copies (`cmp` equal).
- `runComponentTestSteps.ts` and `componentTestTargets.ts` have no bare `console.*`, import nothing from `@testing-library/react`, and contain no `not implemented` guard.

**Deviations:**

1. **`selectOption` resolves the state tracker once.** The union type selector unmounts as soon as a type is chosen, so a tracker resolved again after `{Enter}` is not found (first GREEN run: `step 3 (selectOption): no element matches target {"widget":"selectState",…,"select":"unionType"}`). The old cases kept the tracker in a variable and read its last attributes after the selector closed; `selectOption` does the same. The combobox is also resolved once, as in the old cases.
2. **Union case 4: the raw extractor values are compared through `expectRenderedValues`.** The old case compared both `formValuesToJSON(values)` and the raw `values` with `{type1Attribute, testObjectType}`. `expectRenderedValues` compares the `formValuesToJSON` form only. With dot-free keys both forms are the same object, and any dotted raw key would make the nested form differ from the expected flat object, so the one comparison covers both. The one difference: `expectRenderedValues` drops array-valued extractor entries (T8), which the old raw comparison would have rejected; none is rendered in this case (no open select), and `$options` would appear if one were.
3. **"At least one match" is written `index: 0`.** The old `getAllByText("type2Attribute").length > 0` and `getAllByText("a").length > 0` accept several matches. A target with no refinement and no `index` requires exactly one match, so these targets set `index: 0` (the first match must exist).
4. **Waits are explicit postconditions.** `toggleUnionTypeSelector` waits until the input presence has flipped, where the old cases clicked the star in an `act` and read the tracker at once (Union 5, 6, Any 3, 7-10) or waited afterwards (Union 8, 9, Any 2, 4). Those later waits are kept as `expectElement … timeout: 1000` steps, so every old assertion is still made.
5. **Any cases 11-15 read the portal element too.** The old `testFieldValues` did not pass `env.portalElement` to the extractor; `expectRenderedValues` always does (as in Slices 2-4). No option list is open in these cases.
6. **The phase5 `timeout` and `filter` tests use small fixtures** (`mountComponent` + `runComponentTestSteps`, as `componentTestTargets.292.phase3`), not the real `JzodElementEditor`. A value that changes 200 ms after mounting makes the retry observable, and three plain inputs (a plain input, a `miroirInput`, a checkbox) make the effect of `filter: []` observable. The union widget tests use the runner and the real editor, as planned.
7. **The phase2 "not implemented" test** now uses a kind outside the schema and expects `unknown step kind` (see GREEN).

**Validation** (one command per file, sequential):

| Command | Result | Expected |
|---|---|---|
| `npm run build -w miroir-test-app_deployment-miroir && … modelValidation.unit.test.ts` | 159 passed | 159 ✓ |
| `componentTestUnionWidgets.292.phase5` | 6 passed | — |
| `componentTestInstances.292.phase1` | 5 passed | 4 + 1 new ✓ |
| `componentMiroirTests.consistency` | 8 passed | 8 ✓ |
| `miroir-component-tests -t "JzodUnionEditor"` | 9 passed, 61 skipped | 9 ✓ |
| `miroir-component-tests -t "JzodAnyEditor"` | 15 passed, 55 skipped | 15 ✓ |
| `miroir-component-tests` | **70 passed** (real 66.5 s, vitest 59.7 s) | 70 ✓ |
| `runAllComponentTests.286.phase6` | 3 passed | 3 ✓ |
| `portalContainer.286.phase5` | 3 passed | 3 (Slice 0) ✓ |
| `python scripts/check_bare_console.py` | OK | ✓ |
| `tsc` miroir-standalone-app | 1 error, the known `JzodElementEditorHooks.ts(528,59)` TS2339 | baseline ✓ |
| extra: `componentTestSteps.292.phase2` | 11 passed | 11 ✓ |
| extra: `componentTestTargets.292.phase3` | 6 passed | 6 ✓ |
| extra: `componentTestWidgets.292.phase4` | 9 passed | 9 ✓ |
| extra: `componentTestSandbox.286.phase4` | 5 passed | 5 ✓ |

The reduced case list of the full entry (verbose reporter, ANSI stripped, `<Editor> > <leaf label>: passed`, sorted, 68 lines) is byte-identical to `baseline-component-cases.txt`. All 68 cases now run from declarative steps.

**K1 / P2 measurement.** The full entry took **66.5 s real** (vitest 59.7 s; a second timed run gave 66.9 s), against 56.6 s in Slice 0: ×1.17, below ×2. D9 stays. The switch cases add the explicit waits of the old cases plus one D9 wait per action.

**Browser check: pending (API server down).** `curl` to `https://localhost:3080` and `http://localhost:3080` got no answer (exit 7, connection refused). The API server needs the user's secrets master key to start (Slice 3 Realization), so it was not started, and no server was started by this slice. Still to run: the 7 instances (68/68: Enum 3, Array 12, Literal 3, Object 14, SimpleType 12, Union 9, Any 15) and one "Run All Unit Tests" run with "Include component tests" checked. That also covers the pending checks of Slices 3 (SimpleType) and 4 (Array, Object). Per the test execution conventions, Slices 3, 4, and 5 stay ⏳ until then.

**Impact on later slices:**
- No `custom` step is used by any instance, and no `not implemented` guard is left in the interpreter or the targets. `customStepRegistry.ts` is empty, and only the `custom` test of `componentTestSteps.292.phase2` uses it (Slice 7 deletes both).
- The manifest and the registry are empty; the legacy runner path is no longer reached by any instance. Slice 6 can delete them, the legacy path, and `componentTestRef` without touching an instance.
- Clarified semantics: `selectOption` reads the state tracker resolved before the action (deviation 1); `toggleUnionTypeSelector` waits for the input presence to flip.

**Files created:**
- `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/componentTestUnionWidgets.292.phase5.unit.test.tsx`

**Files changed:**
- `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestTargets.ts`, `runComponentTestSteps.ts`, `componentTestManifest.ts`, `componentTestRegistry.ts`
- `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-…/de517cd6-31a8-46d2-ac09-3a5162b630a7.json` and `ec601bcc-a27d-450d-9c37-bdd6a12a1575.json`
- `packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/componentTestInstances.292.phase1.unit.test.ts` and `componentTestSteps.292.phase2.unit.test.tsx`
- this plan

**Files deleted:** `packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/jzodElementEditor/JzodUnionEditor.tsx` and `JzodAnyEditor.tsx` (the `jzodElementEditor/` folder is gone).

---

## Slice 6: M1, no `componentTestRef`

**Status:** ⏳ TODO · **Complexity:** M

### Goal

Remove every trace of the legacy path.

### 6.1 RED

**Test:** `tests/4_view/issues/292-declarative-react-component-tests/legacyRemoved.292.phase6.unit.test.ts`

- `miroirTestForReactComponent` in the Entity and the EntityVersion has no `componentTestRef`, and `steps` is not optional.
- The files `componentTestManifest.ts`, `componentTestRegistry.ts`, and `jzodElementEditor/` do not exist under `src/miroir-fwk/4-tests/componentTests/`.
- A runner call without `suite` gives an `error` result.

### 6.2 GREEN

- **Schema:** remove `componentTestRef`, make `steps` required. Schema rebuild.
- **miroir-core:** remove `ReactComponentTestRef`, make `suite` required in the runner params, drop its export.
- **App:**
  - Delete `componentTestManifest.ts`, `componentTestRegistry.ts`, the legacy path of `runReactComponentTest.tsx`, and the `ComponentTestCase` / `ComponentTestSuite` / `ComponentTestRegistry` types of `componentTestEnvironment.ts`.
  - `ComponentTestSandboxHost.registry` becomes a `componentRegistry` override.
- **Tests:**
  - The consistency test loses its manifest part.
  - `componentTestRunLock.286.review` uses a fake component registry and step leaves.
  - miroir-core `reactComponentLeaf.286.phase2` and `excludeMiroirTestTypes.286.phase6` use step leaves.
  - Bundle guard `componentTestChunk.286.phase4` L145 looks for `componentTests/runComponentTestSteps`.

### 6.3 Refactor checkpoint

`grep -rn "componentTestRef\|componentTestManifest\|componentTestRegistry\|ReactComponentTestRef" packages --include=*.ts --include=*.tsx --include=*.json` finds nothing outside `node_modules`, `dist`, and `tests/tmp`.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-core -- 292-declarative-react-component-tests
npm run testByFile -w miroir-core -- 286-react-component-miroir-tests
npm run testMiroir -w miroir-core
npm run testByFile -w miroir-standalone-app -- legacyRemoved.292.phase6
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
npm run testByFile -w miroir-standalone-app -- componentTestRunLock.286.review
npm run testByFile -w miroir-standalone-app -- componentTestSandbox.286.phase4
npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6
npm run build -w miroir-standalone-app
npm run testByFile -w miroir-standalone-app -- componentTestChunk.286.phase4
python scripts/check_bare_console.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

Expected: entry 70 passed. The #286 tests keep their counts. The bundle guard: its Slice 0 count. Browser check: all 7 instances, 68/68.

### Realization

(to fill)

---

## Slice 7: M2, no `custom` step

**Status:** ⏳ TODO · **Complexity:** S

### Goal

Remove the escape hatch.

### 7.1 RED

`legacyRemoved.292.phase6` gains two checks: the step union of the Entity and the EntityVersion has no `custom` member, and `customStepRegistry.ts` does not exist.

### 7.2 GREEN

- Remove `custom` from the schema (schema rebuild), from `runComponentTestSteps.ts`, and from the `context` plumbing if nothing else uses it.
- Delete `customStepRegistry.ts`.
- Delete the `custom` test of `componentTestSteps.292.phase2`.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- legacyRemoved.292.phase6
npm run testByFile -w miroir-standalone-app -- componentTestSteps.292.phase2
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- miroir-component-tests
python scripts/check_bare_console.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

Expected: entry 70 passed. `grep -rn "\"custom\"\|customStepRegistry" packages/miroir-standalone-app/src packages/miroir-test-app_deployment-miroir/assets/miroir_model packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion` finds no step kind.

### Realization

(to fill)

---

## Slice 8: docs, nonreg, final type-check and full nonreg

**Status:** ⏳ TODO · **Complexity:** M

### Goal

The documents describe the declarative component tests, nonreg runs the #292 issue tests, and the final criterion holds.

### 8.1 Changes

- **`docs/reference/testing.md`:**
  - L116: the `reactComponentTest` row describes `steps` and `componentProps`.
  - New `reactComponentTestSuite` row.
  - L144 and L760: the 7 instance names.
  - The section at L771-808 becomes "Declarative component tests": the 7 instances and their uuids, the suite node, the step vocabulary table (analysis §5.4), `$options`, `$bigint`, the error form, how to add a case (edit the JSON, rebuild the deployment package, run `modelValidation`, the consistency test, and the entry), and running in the app. The "known limit" paragraph is deleted: each instance has one sub-suite.
- **`docs/contributing/testing.md` L176-193:** the entry, `-t "<Editor>"`, editing JSON instead of the generator.
- **`docs/guides/developer/testing.md` L160.**
- **#286 `analysis.md` §1:** the row "Declarative JSON steps and assertions for component tests" points to #292.
- **`scripts/nonreg-manifest.json`:** new `unit-292-declarative-react-component-tests` (tier `unit`, after `unit-286-…`). It runs `testByFile -w miroir-core -- 292-declarative-react-component-tests`, then one app command per file: `componentTestSchema.292.phase1`, `componentTestInstances.292.phase1`, `extractorOpenCombobox.292.phase2`, `componentTestSteps.292.phase2`, `componentTestTargets.292.phase3`, `componentTestWidgets.292.phase4`, `componentTestUnionWidgets.292.phase5`, `legacyRemoved.292.phase6`, chained with `&&` in `bash -c` as the #286 steps. `appstack-miroir-component-tests` and `unit-286-…` keep their commands. Check with `npm run nonreg -- --dry-run --tier full`.
- Delete `baseline-component-cases.txt`, or keep it and assert it from `componentTestInstances.292.phase1` (record which in the Realization).

### Validation

```bash
npm run nonreg -- --dry-run --tier full
python scripts/check_bare_console.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run build -w miroir-standalone-app
npm run testByFile -w miroir-standalone-app -- componentTestChunk.286.phase4
npm run nonreg
```

Also `npx tsc --noEmit --skipLibCheck -p packages/<name>/tsconfig.json` for each package in the Slice 0 tsc list.

Expected:

- tsc: no error beyond the Slice 0 lists.
- Full nonreg: every step passes except the Slice 0 baseline failures, with the same causes.
- `appstack-miroir-component-tests`: `miroir-component-tests` 70 passed and the consistency test.
- `unit-292-…` and `unit-286-…` pass.

Browser check: the 7 instances, 68/68, and one production-build run of one instance (#286 plan §4.4 method).

### Realization

(to fill)

