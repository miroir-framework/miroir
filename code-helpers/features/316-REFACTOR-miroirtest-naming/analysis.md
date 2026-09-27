# 316 — Systematic MiroirTest names, descriptions and mode tags

> Renames the 66 MiroirTest instances to one naming scheme, rewrites their descriptions, and adds the `unit`, `integ`, `ui` tags. Records the decisions taken while grilling A on 2026-09-27, maps where names are used today, and lists what depends on them.

## Related

- Issue: [#316](https://github.com/miroir-framework/miroir/issues/316)
- Prerequisites: #312 tags ([analysis](../312-FEATURE-miroir-test-classification/analysis.md), [tag assignment](../312-FEATURE-miroir-test-classification/tag-assignment.md)), #315 `issue` attribute (merged)
- Background: #196 (migration of UnitTest / TransformerTest into MiroirTest, source of the "Migrated from…" descriptions)
- Final name list: [rename-map.md](rename-map.md)
- MiroirTest Entity: `a311f363-e238-4203-bdfc-29e8c160c26b` (row in `miroir_model/16dbfe28-…/`, EntityVersion `51c647fe-07ec-411c-89cc-02689dc66d6a` in `miroir_modelVersion/54b9c72f-…/`)
- Key code: [applicationMiroirTestCatalog.ts](../../../packages/miroir-core/src/5_tests/applicationMiroirTestCatalog.ts), [miroirCoreTestSuiteRegistry.ts](../../../packages/miroir-core/src/5_tests/miroirCoreTestSuiteRegistry.ts), [MiroirTestTools.ts](../../../packages/miroir-core/src/5_tests/MiroirTestTools.ts), [nonreg-manifest.json](../../../scripts/nonreg-manifest.json)

## Decision record

### Confirmed with A (grilling, 2026-09-27)

| # | Decision | Status |
|---|---|---|
| D1 | A name identifies the thing under test (function, transformer, query, action, runner, component), never the issue or phase it came from. `issue` holds the issue number. | **Accepted** |
| D2 | Add `unit`, `integ`, `ui` to the `tags` enum. They state the modes a test supports and are derived from its leaf types (table in Current state). A guard checks them. | **Accepted** |
| D3 | The level lives in tags only, not in the name, so gaining a mode never renames a test. | **Accepted** |
| D4 | Names use only letters, digits, `.`, `_`, `-` (they are passed as `--suites a,b`). The tags guard test enforces it. | **Accepted** |
| D5 | Drop redundant words: `_ComponentTestSuite`, `_TransformerTestSuite`, `Test`, `pilot_`. | **Accepted** |
| D6 | Scope: instance `name` and `description`. Inner suite and test labels are a later pass (see D11 for the root label). | **Accepted** |
| D7 | Scheme: proposal A, `<kind>.<subject>[.<variant>]`, camelCase inside dots, six kinds (table below). | **Accepted** |
| D8 | No application prefix: `selfApplication` identifies the owner in the grid. | **Accepted** |
| D9 | Description: one sentence, what is exercised and against what. No issue numbers, uuids or migration history. | **Accepted** |
| D10 | Hard rename, no aliases. Nonreg manifest changes in the same work: `--suites` arguments, titles, step ids become `integ-<new name>` (the `externalServices-spotify` bundle keeps its id). A fresh `latest` snapshot is taken after the rename, since `run-nonreg.py --compare` matches steps by id. | **Accepted** |

D7 kinds:

| Kind | Pattern | Example | Count |
|---|---|---|---|
| function | `fn.<module>.<export>` | `fn.mlsTypeCheck.unionObjectChoices` | 26 |
| query | `query.<subject>` | `query.virtualAttributes` | 2 |
| transformer | `tr.<transformerName>[.<variant>]` | `tr.resolveConditionalSchema.build` | 11 |
| action | `action.domainController.<action>[.<variant>]`, `action.scenario.<scenario>` | `action.domainController.dataCrud.nonUuidPk` | 11 |
| runner | `runner[.mcp].<action>` (split from action by A) | `runner.createEntity`, `runner.mcp.lendDocument` | 7 |
| UI component | `ui.<component>.<variant>` | `ui.mlElementEditor.array` | 9 |

Rejected schemes (full tables kept in the project file `miroirtest-naming/proposals.md`):

| Scheme | Example | Rejection reason |
|---|---|---|
| B, platform concept first | `mls.union.objectChoices` | A preferred the kind visible in the name. |
| C, level first, kebab-case | `unit-mls-union-object-choices` | Duplicates the mode tags, needs an invented `dual` level, renames a test when it gains a mode (contradicts D3). |

### Found during this analysis, confirmed with A (2026-09-27)

| # | Question | Decision | Status |
|---|---|---|---|
| D11 | The root suite `definition.miroirTestLabel` is a second name, printed by vitest and quoted by the CLI "did you mean" error. It differs from `name` on 34 of 66 instances (e.g. `domain_controller_data_crud` / `domainController.data.crud`). Align it to the new name? | Set it equal to `name`; a guard checks equality. | **Accepted** |
| D12 | Deployment packages export each instance as `miroirTest_<name>` (70 in `miroir-test-app_deployment-miroir/index.ts`, 4 in the library one). Dots are not valid in identifiers. Rename the exports too? | `miroirTest_` + new name with `.` → `_` (`miroirTest_runner_createEntity`). | **Accepted** |
| D13 | `inferUiIntegrationRunnerSuiteKind` decides `domainControllerTest` vs `actionTest` with `suiteKey?.startsWith("domain_controller_")` ([applicationMiroirTestCatalog.ts:58](../../../packages/miroir-core/src/5_tests/applicationMiroirTestCatalog.ts)). The rename would silently turn every DomainController suite into `actionTest`. | Stopgap: test the prefix `action.domainController.`, covered by a unit test. Removing name-based recognition is #317. | **Accepted** |
| D14 | The deprecated `MIROIR_TEST_SUITE_REGISTRY_NAMES` in [miroirCoreTestSuiteRegistry.ts](../../../packages/miroir-core/src/5_tests/miroirCoreTestSuiteRegistry.ts) hardcodes 38 keys, 4 of them aliases (`alterObject`, `mlsTypeCheck`, `menu`, `metaModelTransformers`) mapped to other export names. | Replace the keys with the new names and drop the alias branches. Removing the deprecated registry stays out of scope. | **Accepted** |

## Goals

1. **Readable test list.** In order to understand what a test covers without opening it, as an application maintainer browsing the Miroir Tests grid, I can read a name that states the kind and the subject under test, and a one-sentence description.
2. **Select by mode.** In order to run only what my environment allows, as a developer or CI job, I can select tests with `--tags unit`, `--tags integ` or `--tags ui` (or the tag chips of the grid).
3. **Predictable new names.** In order to name a new test without debate, as a test author, I can apply the pattern of its kind, and a guard tells me when a name or its mode tags are wrong.
4. **Stable non-regression.** In order to keep comparing runs, as a maintainer, I can run the nonreg tiers with the new names and ids, and start a new baseline.

## Non-goals

- Renaming inner suite and test labels (`miroirTestLabel` below the root), e.g. the 54 sub-suites of `miroirCoreTransformers`: later pass, no issue yet.
- Removing the deprecated `MIROIR_TEST_SUITE_REGISTRY` (candidate T1 of #311).
- Fixing `mlsTypeCheck` accepting any enum value (#313).
- Adding a nonreg step for `runner_create_entity`, which has none today.
- Deriving the UI runner suite kind from the definition instead of the name: #317.

## Current state

### Names and descriptions (enumerated from the assets)

66 instances, 62 in `miroir-test-app_deployment-miroir`, 4 in `miroir-test-app_deployment-library` (`runner_lend_document`, `runner_return_document`, `runner_mcp_lend_document`, `multistepReports.274`).

| Style | Count | Examples |
|---|---|---|
| camelCase | 31 | `mlsToJsonSchema`, `transformerInterfaceCheck` |
| snake_case (`domain_controller_*` ×8, `runner_*` ×7) | 15 | `domain_controller_data_crud`, `runner_create_entity` |
| camelCase with `_` segments | 7 | `alterObject_atPath`, `mlUnion_RecursiveUnfold`, `mlsToMls_Summary`, `menu_build`, `queries_library`, `pilot_transformer_plus`, `mlsTypeCheck_TransformerTestSuite` |
| `Pascal_ComponentTestSuite` | 9 | `MlArrayEditor_ComponentTestSuite` |
| PascalCase | 3 | `EntityPrimaryKey`, `MlSchemaReferencesList`, `MlSchemaReferencesSet` |
| dotted with issue number | 1 | `multistepReports.274` |

Descriptions: 35 are migration history only ("Migrated from UnitTest `<uuid>` (Feature #196 Phase 5)", "Phase 3a pilot…"); 15 start with the issue number ("Issues #286, #292: …", "Issue #253 — …"); 14 embed issue or phase references mid-sentence ("(Feature 197)", "(#225 Phase 2)", "Slice 6 unit transformerTest…"); only `runner_lend_document` and `runner_return_document` have neither.

### Mode tags derived from the leaf types

`runMiroirTestInMemory` ([MiroirTestTools.ts](../../../packages/miroir-core/src/5_tests/MiroirTestTools.ts), `switch` on `leaf.miroirTestType`) throws for `functionCallTest`, `queryTest` and `reactComponentTest` in integration mode and for `runnerTest` outside it. `transformerTest` runs in both (`runTestStep`). Hence:

| Kind | Leaf types | Tags added | Count |
|---|---|---|---|
| function | `functionCallTest` | `unit` | 26 |
| query | `queryTest` (plus `functionCallTest` in `virtualAttributes`) | `unit` | 2 |
| transformer | `transformerTest` | `unit`, `integ` | 11 |
| action | `actionTest` | `integ` | 11 |
| runner | `runnerTest` | `integ` | 7 |
| UI component | `reactComponentTest` under `reactComponentTestSuite` | `ui` | 9 |

`transformerResultSchema` holds 38 `functionCallTest` and 1 `transformerTest`; it is classed as function (`fn.transformer.resultSchema`). A guard deriving tags from leaf types would give it `unit` and `integ`; the guard must use the same rule as `classifyMiroirTestSuiteExecutionCapabilities` ([inferIntegrationSessionKind.ts](../../../packages/miroir-core/src/5_tests/inferIntegrationSessionKind.ts)), which already computes `hasUnitLeaves` and `integrationSessionKind`.

The `tags` enum has 20 values today, identical in the Entity row and the EntityVersion: `transformer`, `ml-schema`, `ml-union`, `ml-reference`, `ml-conversion`, `query`, `editor`, `performance`, `runner`, `domain-controller`, `model`, `data`, `primary-key`, `versioning`, `mcp`, `external-service`, `report`, `menu`, `ai`, `tools`.

### How names are resolved

- The CLI suite key is the instance `name` (`suiteKeyFromMiroirTestInstance`, falling back to the root `miroirTestLabel`, then `uuid`). `resolveApplicationMiroirTestSuiteKey` accepts `name` or `uuid` only ([applicationMiroirTestCatalog.ts](../../../packages/miroir-core/src/5_tests/applicationMiroirTestCatalog.ts)).
- The UI runner registry ([uiIntegrationTestRunnerSuiteRegistry.ts](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.ts)) keys entries by `miroirTest_*.name`, so its keys follow the rename; only the imported identifiers change (D12).
- Name-dependent behavior: `inferUiIntegrationRunnerSuiteKind` (D13) is the only `startsWith` on a suite key in `packages/*/src`.

### Where names are referenced

A search for quoted names, `--suites` values and `miroirTest_<name>` identifiers, outside `assets/`, `docs-OLD/` and `code-helpers/`, finds 119 files (about 1,250 matches, a few false positives such as the `mustache` npm dependency). The largest:

| File | Matches | Nature |
|---|---|---|
| `packages/miroir-test-app_deployment-miroir/src/Model.ts` | 113 | imports and list of `miroirTest_*` |
| `docs/reference/testing.md` | 106 | examples and suite list |
| `packages/miroir-core/tests/5_tests/resolveSuitePlayfieldSeed.unit.test.ts` | 78 | test fixtures |
| `packages/miroir-test-app_deployment-miroir/index.ts`, `index.d.ts` | 66 each | `miroirTest_*` exports |
| `packages/miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.ts` | 51 | imports |
| `packages/miroir-core/src/5_tests/miroirCoreTestSuiteRegistry.ts` | 38 | deprecated key list (D14) |
| `packages/miroir-core/tests/5-tests/miroirTestTags.unit.test.ts` | 27 | tag guard fixtures |
| `scripts/nonreg-manifest.json` | 20 | 19 steps with `--suites` |
| `packages/miroir-core/src/5_tests/parseMiroirRunnerTestCLIConfig.ts` | 16 | runner suite key list |

Many names are also TypeScript identifiers (`mlsToJsonSchema`, `tools`, `mustache`, `EntityPrimaryKey`), so a blind text replace would break code: the rename must touch only quoted names, `--suites` values and `miroirTest_*` identifiers.

## Key reuse

| Piece | Location |
|---|---|
| Tag vocabulary read from the live Entity | `packages/miroir-core/tests/5-tests/miroirTestTags.unit.test.ts` ("vocabulary from the MiroirTest Entity") |
| "every test is tagged" guards | same file, `describe("MiroirTest tags: every test is tagged")` |
| Execution capabilities of a suite | `classifyMiroirTestSuiteExecutionCapabilities`, `walkMiroirTestLeaves` in `inferIntegrationSessionKind.ts` |
| Catalog of all instances from folders | `loadApplicationMiroirTestCatalog` in `loadApplicationMiroirTestsFromFolders.ts` |
| CLI `--tags` selection | `resolveCliSuiteKeysFromCatalog` (#312) |
| Nonreg compare by step id | `compare_summaries` in `scripts/run-nonreg.py` |

## Next

[tdd-implementation-plan.md](tdd-implementation-plan.md).
