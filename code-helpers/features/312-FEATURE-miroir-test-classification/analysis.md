# 312 — Classify MiroirTests with tags

> Adds a `tags` attribute to MiroirTest instances, with its allowed values declared in the MiroirTest Entity, so that tests can be selected by tag from the CLI and the Miroir Tests page, and sorted by tag in the Miroir Tests grid. Selection and sorting only: no other test behavior changes.

Related issue: https://github.com/miroir-framework/miroir/issues/312
Related analyses: [`../228-REFACTOR-unify-MiroirTest-discovery/identity-rules-migration-plan.md`](../228-REFACTOR-unify-MiroirTest-discovery/identity-rules-migration-plan.md) (suite identity and selection, #228) · [`../292-REFACTOR-declarative-react-component-tests/analysis.md`](../292-REFACTOR-declarative-react-component-tests/analysis.md) (last MiroirTest schema change pattern) · [`../303-FEATURE-test-pattern-and-render-performance/analysis.md`](../303-FEATURE-test-pattern-and-render-performance/analysis.md) (`runOnDemand`)
Key sources: [MiroirTest Entity](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a311f363-e238-4203-bdfc-29e8c160c26b.json) · [MiroirTest EntityVersion](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/51c647fe-07ec-411c-89cc-02689dc66d6a.json) · [`parseMiroirTestCliConfig.ts`](../../../packages/miroir-core/src/5_tests/parseMiroirTestCliConfig.ts) · [`loadApplicationMiroirTestsFromFolders.ts`](../../../packages/miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.ts) · [`testMiroirLauncher.ts`](../../../packages/miroir-standalone-app/scripts/testMiroirLauncher.ts) · [`MiroirTestListDisplay.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MiroirTestListDisplay.tsx) · [`getColumnDefinitionsFromEntityAttributes.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/getColumnDefinitionsFromEntityAttributes.ts)
Companion: [`tag-assignment.md`](tag-assignment.md) (vocabulary and the tags of each of the 66 instances)

**Status:** decisions confirmed (2026-09-26) — implementation plan in [`tdd-implementation-plan.md`](tdd-implementation-plan.md).

---

## Decision record

### Product decisions (confirmed with A, 2026-09-26)

| ID | Question | Choice |
|---|---|---|
| D1 | Shape of the classification | **Tags only**: a list of tags per test. **Accepted.** Rejected: one `category` per test, alone or next to tags; a separate `MiroirTestCategory` Entity with a foreign key ("makes no sense", A). A test has several traits (area, speed, feature); the first tag plays the role of a main area when sorting. |
| D2 | Allowed tag values | **Declared in the MiroirTest Entity definition**: `tags` is an array of `enum`, the enum lists the vocabulary. **Accepted.** Rejected: free strings (typos split the vocabulary); a registry Entity (rejected with D1). Adding a tag is a model change of the MiroirTest Entity. |
| D3 | Where tags go | On the **MiroirTest instance** (next to `name` / `description`), not on leaves. **Accepted** (default). Selection works on instances everywhere (`--suites`, UI list); leaves keep `--filter`. |
| D4 | Unused leaf `testTag` | **Removed** from the 4 leaf schemas that declare it. **Accepted** (default). No instance and no code uses it (§3.2). |
| D5 | CLI selection | `--tags a,b` (env `MIROIR_TEST_TAGS`): a suite matches when it has **any** of the tags; intersected with `--suites` when both are given. An unknown tag is an error listing the allowed values; a selection that matches no suite is an error. **Accepted** (default). All-of matching: later if needed. |
| D6 | Facets that can be computed | Leaf kind, unit vs integration, owning application are **not tags**: they are derived from the definition and the folder (§3.3), tagging them by hand would drift. **Accepted** (default). |
| D7 | Existing tests | **All 66 instances tagged** in this issue ([`tag-assignment.md`](tag-assignment.md)). **Accepted** (default). |
| D8 | UI | The Miroir Tests grid gets a **Tags column** (sortable, filterable like the other columns). The Run section gets **tag chips** with counts: selected chips restrict what "Run All" runs; none selected means all. **Accepted** (default). |
| D9 | Nonreg manifest | Unchanged: it stays a curated list (docs/reference/testing.md, "Discovery, selection, and execution"). **Accepted** (default). |

### Technical decisions (this analysis)

| ID | Question | Choice | Reason |
|---|---|---|---|
| T1 | Schema change | `tags: { type: "array", optional: true, definition: { type: "enum", definition: [<vocabulary>] } }` on the MiroirTest instance, in the Entity row **and** its EntityVersion `51c647fe-…`, identically; `viewAttributes` gets `tags` after `name`. Then deployment rebuild and `devBuild` of miroir-core. | Same route as #292 / #303: the EntityVersion file is what `getMiroirFundamentalMlSchema` turns into `MiroirTestDefinition` (`index.ts` L92 exports it as `entityDefinitionMiroirTest`); the Entity row is the live definition. Optional keeps old instances and new drafts valid. |
| T2 | Reading the allowed values | One pure helper `getMiroirTestAllowedTags(entity)` returns the enum values of `mlSchema.definition.tags.definition`, or `undefined` when that item type is not an enum (then any tag is accepted). | D2 "from the Entity definition": no copy of the vocabulary in code. Returning `undefined` for a plain `string` item keeps the constraint a property of the Entity, not of the code. |
| T3 | Which Entity the CLI reads | The live Entity row, read from the miroir deployment folder next to the catalog it filters (`loadMiroirTestEntityFromFolders`). | The folder catalog already reads instances from disk (`loadApplicationMiroirTestsFromFolders`); the live row is authoritative (AGENTS.md, "Schema-first model"). |
| T4 | Where the CLI filter applies | `tags` joins `MiroirTestCliConfig` (`--tags`, `MIROIR_TEST_TAGS`, exported back by `miroirTestCliConfigToEnv`), and `resolveCliSuiteKeysFromCatalog` takes it as a 4th argument. | That function is the one step every launcher and vitest entry already calls (§3.4), so one change covers `testMiroir` in miroir-core and in the standalone app, and env-only CI runs. |
| T5 | Standalone launcher routing | Tags are resolved to suite keys **before** the launcher picks its vitest entry. If they select both core suites and runner suites, the launcher stops with an error naming both groups. | The launcher runs one vitest entry per launch and routes on the requested keys (§3.4); mixing the two groups is already unsupported for `--suites`. |
| T6 | UI chip values | The tags present on the listed instances, alphabetical, each with its count. | Chips for unused tags select nothing. The vocabulary constraint is enforced where values are written (the instance editor shows the enum, the generated type is a union of the values) and by the T7 guard, not in the filter. |
| T7 | Keeping every test tagged | A unit test over the folder catalog: every MiroirTest instance has at least one tag, and every tag is allowed by the Entity. | D7 would decay without it: `tags` is optional in the schema (T1). It is also the only check of committed values, since model validation does not check enum values (§3.2, #313). |

---

## 1. Goals

1. **Run one area from the CLI** — In order to run only the tests of the area I am changing, as a framework developer, I can run `npm run testMiroir -w miroir-core -- --tags ml-union` and get every unit suite tagged `ml-union`, without knowing their names.
2. **Narrow the Run section** — In order to run a subset of tests from the app, as a framework developer, I can select tag chips in the Miroir Tests Run section, and "Run All" runs only the tests that carry one of them.
3. **Sort and filter the list** — In order to find a test among 66, as a framework developer, I can sort and filter the Miroir Tests grid on a Tags column.
4. **Tag a test** — In order to classify a new test consistently, as a test author, I can choose its tags from the values the MiroirTest Entity allows, in the instance editor, and a tag outside them fails the unit tests.
5. **Extend the vocabulary** — In order to add a tag when a new area appears, as a framework maintainer, I can add a value to the `tags` enum of the MiroirTest Entity, and the CLI and editor accept it.

## 2. Non-goals

- Tags on leaves, all-of matching, tag hierarchies (later, unscheduled).
- Tags on other Entities, or a generic tag mechanism in `entityDefinitionRoot` (later, unscheduled).
- Nicer rendering of array cells in grids (`DefaultCellRenderer` shows `["editor"]`, §3.5) (later, unscheduled).
- Generating the nonreg manifest from tags (D9).
- Renaming instances to a naming convention: tags make names less load-bearing.

## 3. Current state

### 3.1 Volume

66 MiroirTest instances (Entity `MiroirTest`, uuid `a311f363-e238-4203-bdfc-29e8c160c26b`): 62 in `miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-…/`, 4 in `miroir-test-app_deployment-library/assets/library_model/a311f363-…/`. Their definitions hold 867 leaves: 364 `functionCallTest`, 339 `transformerTest`, 87 `reactComponentTest`, 44 `actionTest`, 23 `queryTest`, 10 `runnerTest` (enumerated by script over the two folders). Names follow no shared convention (`MlArrayEditor_ComponentTestSuite`, `domain_controller_data_crud`, `runner_lend_document`, `mustache`, `tools`); most descriptions record provenance ("Migrated from UnitTest …").

### 3.2 Schema

The instance attributes are `selfApplication`, `branch`, `name`, `skip`, `description`, `definition` (+ the `entityDefinitionRoot` extension). `viewAttributes` is `["name", "uuid", "description"]`. `testTag` (string or string[], optional) is declared on `miroirTestForTransformer`, `miroirTestForFunctionCall`, `miroirTestForRunner` and `miroirTestForAction`; no instance sets it and no source outside `preprocessor-generated/` reads it. The only instance-level flags that classify are `skip` and, on `reactComponentTestSuite`, `runOnDemand` (#303).

**Found during Slice 2 (misaligned, out of scope):** `mlsTypeCheck` accepts any value for an `enum` schema (`mlsTypeCheck.ts`, `case "enum"` returns `ok` unconditionally), so model validation does not reject an unknown tag. Making it strict breaks 7 existing instances in the library and miroir deployments (wrong `conceptLevel` values, a `color` string format). Filed as [#313](https://github.com/miroir-framework/miroir/issues/313); this issue relies on the T7 guard instead.

### 3.3 Derived classification (aligned: kept as is)

`catalogEntryFromMiroirTest` (`applicationMiroirTestCatalog.ts`) computes `cliLaunchKind` (`unit` / `runner-integration` / `transformer-integration` / `mixed-unit-transformer`) and `uiRunnerKind` from the leaves (`inferIntegrationSessionKind.ts`). `listCliUnitSuiteKeys` and siblings select by kind and sort by name. The owning application is the folder the instance was loaded from.

### 3.4 CLI selection

- `parseMiroirTestCliArgs` reads `--suites` / `-s`, `--mode` / `-m`, `--filter` / `-f`; `resolveMiroirTestCliConfigFromPartial` falls back to `MIROIR_TEST_SUITES`, `MIROIR_TEST_MODE`, `MIROIR_TEST_FILTER`; `miroirTestCliConfigToEnv` writes them back for the vitest process.
- `resolveCliSuiteKeysFromCatalog(rawKeys, availableKeys, catalog)` expands empty / `*` to `availableKeys` and resolves names or uuids. Callers: `packages/miroir-core/tests/miroir-core-tests.unit.test.ts` L20, `packages/miroir-standalone-app/tests/miroir-core-tests.integ.test.ts` L32, `testMiroirLauncher.ts` L42, L57, L77. `miroir-runner-tests.integ.test.ts` L51 uses `parseMiroirRunnerTestCliConfig` only.
- `packages/miroir-core/scripts/test-miroir-core.ts` parses with the unit keys and spawns the unit vitest entry.
- `testMiroirLauncher.ts` `resolveVitestEntry`: when every requested key is a core key (unit or transformer-integration), it runs `miroir-core-tests.integ.test`, otherwise `miroir-runner-tests.integ.test`. No request (or `*`) goes to the runner entry.

### 3.5 UI

- Report `MiroirTestList` (uuid `58dc6706-0473-468c-90ee-61b54b157140`) has two sections over one extractor of all MiroirTest instances: a `miroirTestReportSection` ("Run all Miroir Tests", rendered by `ReportSectionMiroirTest` → `MiroirTestListDisplay`) and an `objectListReportSection` ("Miroir Tests", `sortByAttribute: "name"`).
- The list section is an ag-grid (`ag-grid-community` ^31.2) whose columns come from `viewAttributes` (`getMDataGridColumnDefinitionsFromEntity`). `defaultColDef` (`GridTools.ts`) makes every column sortable and filterable. `EntityInstanceGrid` passes array attribute values through unchanged (only `object` attributes are stringified, L342-356); `DefaultCellRenderer` renders arrays as `JSON.stringify`.
- `MiroirTestListDisplay` sorts instances by `getMiroirTestSuiteKey` and hands **all** of them to both "Run All" buttons; it has no selection control. Results are listed per suite after a run.

## 4. Key reuse

| Piece | Location |
|---|---|
| MiroirTest Entity row | `miroir_model/16dbfe28-…/a311f363-e238-4203-bdfc-29e8c160c26b.json` |
| MiroirTest EntityVersion (source of generated types) | `miroir_modelVersion/54b9c72f-…/51c647fe-07ec-411c-89cc-02689dc66d6a.json` |
| Folder catalog loader | `loadApplicationMiroirTestsFromFolders`, `loadApplicationMiroirTestCatalog` |
| Single suite-key resolution step | `resolveCliSuiteKeysFromCatalog` |
| CLI config | `MiroirTestCliConfig`, `parseMiroirTestCliArgs`, `miroirTestCliConfigToEnv` |
| Model validation of instances | `packages/miroir-test-app_deployment-miroir/tests/modelValidation.unit.test.ts` |
| Grid columns from `viewAttributes` | `getMDataGridColumnDefinitionsFromEntity` |
| Run section tests | `packages/miroir-standalone-app/tests/4_view/MiroirTestListDisplay.unit.test.tsx` |
| Catalog tests | `packages/miroir-core/tests/5-tests/loadApplicationMiroirTestsFromFolders.unit.test.ts`, `parseMiroirTestCliConfig.unit.test.ts` |

## 5. Vocabulary

20 tags, listed in [`tag-assignment.md`](tag-assignment.md) with the assignment of all 66 instances (1 to 3 tags each, main area first). Areas follow what a test exercises, not how it runs (D6): `transformer`, `ml-schema` with the finer `ml-union`, `ml-reference`, `ml-conversion`, `query`, `editor`, `performance`, `runner`, `domain-controller`, `model`, `data`, `primary-key`, `versioning`, `mcp`, `external-service`, `report`, `menu`, `ai`, `tools`.
