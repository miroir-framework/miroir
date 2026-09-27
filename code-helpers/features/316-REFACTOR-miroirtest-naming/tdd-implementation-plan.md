# Issue #316 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real MiroirTest catalog loaded from the deployment folders
> (`loadApplicationMiroirTestCatalog`), the live MiroirTest Entity, and the real `testMiroir` CLI.
> No mocks. The tracer bullet (Slice 1) proves that `--tags ui` selects exactly the 9 component suites.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Rename map: [`./rename-map.md`](./rename-map.md) · Issue: https://github.com/miroir-framework/miroir/issues/316
Prerequisites: [`../312-FEATURE-miroir-test-classification/`](../312-FEATURE-miroir-test-classification/) ✅, #315 ✅
Working branch: `claude/miroirtest-naming-787r3a`

**Resume note:** plan written, no slice started.

---

## Scope

- `unit`, `integ`, `ui` tags in the MiroirTest `tags` enum, set on all 66 instances, checked by a guard.
- Rename of the 66 instances per [rename-map.md](rename-map.md): `name`, root `miroirTestLabel`, `description`, `miroirTest_*` export identifiers, and every reference (registries, CLI key lists, tests, docs, skills, nonreg manifest).
- Guards on names: allowed characters, kind pattern, root label equal to name.
- Stopgap for name-based DomainController recognition (`action.domainController.` prefix).

This plan does **not** rename inner suite and test labels (later pass), derive the UI runner kind from the definition (#317), remove the deprecated registry (#311 T1), or fix `mlsTypeCheck` enum checking (#313).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize names, kinds and name-driven behavior | ⬜ | `miroirTestNaming.316.phase0.unit.test.ts` |
| 1 | Select tests by mode: `unit` / `integ` / `ui` tags (tracer) | ⬜ | mode-tag guard + `testMiroir --tags ui` |
| 2 | Naming guard + rename UI component suites | ⬜ | naming guard, `--suites ui.mlElementEditor.array` |
| 3 | Rename runner and action suites (+ D13 stopgap, nonreg ids) | ⬜ | naming guard, runner-kind test, nonreg integ steps |
| 4 | Rename transformer suites | ⬜ | naming guard, `--suites tr.core --mode integ` |
| 5 | Rename function and query suites (+ D14 registry keys) | ⬜ | naming guard with empty legacy list |
| 6 | Docs, skills, nonreg baseline, cleanup, AC | ⬜ | `nonreg:filesystem`, AC checklist |

---

## Locked implementation defaults

From the analysis decision record (D1–D14, all **Accepted**).

| Decision | Choice |
|---|---|
| D1 Name identifies | the thing under test; issue lives in `issue` |
| D2 Mode tags | `unit`, `integ`, `ui` added to the enum, derived from leaf types, guarded |
| D3 Level in name | never; tags only |
| D4 Characters | `[A-Za-z0-9._-]` only |
| D5 Redundant words | dropped |
| D6 Scope | instance `name` + `description` (+ root label per D11) |
| D7 Scheme | `<kind>.<subject>[.<variant>]`, kinds `fn`, `query`, `tr`, `action`, `runner`, `ui` |
| D8 Application prefix | none |
| D9 Description | one sentence: what is exercised, against what; no issue numbers, uuids, history |
| D10 Compatibility | hard rename, no aliases; nonreg ids `integ-<new name>`; fresh baseline |
| D11 Root `miroirTestLabel` | equal to `name`, guarded |
| D12 Export identifiers | `miroirTest_` + name with `.` → `_` |
| D13 DomainController recognition | prefix `action.domainController.` (stopgap until #317) |
| D14 Deprecated registry | keys = new names, alias branches removed |

Mode tag rule (D2), shared by guard and data: a suite gets `unit` if it has a `functionCallTest`, `queryTest` or `transformerTest` leaf; `integ` if it has a `transformerTest`, `actionTest` or `runnerTest` leaf; `ui` if it has a `reactComponentTest` leaf. The guard computes it from `walkMiroirTestLeaves` ([inferIntegrationSessionKind.ts](../../../packages/miroir-core/src/5_tests/inferIntegrationSessionKind.ts)). Consequence: `fn.transformer.resultSchema` (38 function calls + 1 transformer test) carries `unit` and `integ`.

---

## Allocated UUIDs / keys

No new model element, so no new uuid. Instance uuids are unchanged.

| Artefact | Value |
|---|---|
| New suite keys (66) | [rename-map.md](rename-map.md), "New name" column |
| New tag values | `unit`, `integ`, `ui` (appended to the enum) |
| Nonreg step ids | `integ-<new name>` for the 17 single-suite integ steps; `externalServices-spotify` unchanged (analysis D10) |
| Rename script (one-off) | `code-helpers/features/316-REFACTOR-miroirtest-naming/rename_miroir_tests.py` |
| Issue-scoped tests | `packages/miroir-core/tests/5-tests/issues/316-miroirtest-naming/` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Issue-scoped guards | `RUN_TEST=miroirTestNaming npm run testByFile -w miroir-core -- miroirTestNaming.316` |
| Existing tag guards | `npm run testByFile -w miroir-core -- miroirTestTags.unit` |
| MiroirTest unit by name / tag | `npm run testMiroir -w miroir-core -- --suites <name> --mode unit` · `-- --tags <tag> --mode unit` |
| MiroirTest integ | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites <name> --mode integ` |
| UI component suites | `npm run testMiroir -w miroir-standalone-app -- --suites <name> --mode unit` |
| Schema rebuild (Slice 1) | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` (if "jzodObject not found": `./build-all.sh`) |
| Deployment rebuild after asset edits | `npm run build -w miroir-test-app_deployment-miroir -w miroir-test-app_deployment-library` |
| modelValidation | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` (same for `-library`) |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` for `miroir-core`, `miroir-standalone-app`, both deployments |
| Pre-push gate | as in `AGENTS.md` |
| Non-regression | `npm run nonreg:unit`; `npm run nonreg:filesystem` in slices 3 and 6 |

Vitest justification: guards check the integrity of the test model itself (every instance, the Entity vocabulary, CLI resolution); they iterate over MiroirTest instances and so cannot be MiroirTests.

---

## Slice 0 — Characterize names, kinds and name-driven behavior

**Status:** ⬜ pending

**Goal:** a safety net that fails if the rename loses, duplicates or misclassifies a test.

**RED → GREEN** (characterization, green on first run by design) — `packages/miroir-core/tests/5-tests/issues/316-miroirtest-naming/miroirTestNaming.316.phase0.unit.test.ts`:
- the catalog has 66 suites and their uuids equal the uuid column of the rename map (read from a JSON map produced from [rename-map.md](rename-map.md), `rename-map.json` in this folder);
- for each uuid, the leaf-type kind (`fn`/`query`/`tr`/`action`/`runner`/`ui`) matches the map;
- `inferUiIntegrationRunnerSuiteKind` returns `domainControllerTest` for exactly the 8 DomainController uuids, `runnerTest` for the 7 runner uuids, `actionTest` for the 3 scenario uuids;
- `cliLaunchKind` per uuid (snapshot of today's values).

The tests key on uuid, not name, so they stay valid through the rename.

**Refactor checkpoint:** none (no production change).

### Validation
- `RUN_TEST=miroirTestNaming npm run testByFile -w miroir-core -- miroirTestNaming.316.phase0`
- `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`

### Realization
_(pending)_

---

## Slice 1 — Select tests by mode (tracer bullet)

**Status:** ⬜ pending

**Goal:** `testMiroir --tags ui` runs the 9 component suites; `--tags integ` lists the 30 integration-capable suites (11 tr + 11 action + 7 runner, plus `fn.transformer.resultSchema`); the Tags column and chips show them.

**RED** — add to `miroirTestNaming.316.phase1.unit.test.ts`:
- the MiroirTest Entity vocabulary (live row, read as in `miroirTestTags.unit.test.ts`) contains `unit`, `integ`, `ui`, and the EntityVersion enum equals the row's;
- every instance carries exactly the mode tags computed by the D2 rule (fails: no instance has them);
- `resolveCliSuiteKeysFromCatalog` with tags `["ui"]` returns the 9 component suites.

**GREEN:**
- append `unit`, `integ`, `ui` to the `tags` enum in the Entity row `a311f363-…` and the EntityVersion `51c647fe-…`;
- rebuild the deployment, `devBuild -w miroir-core`;
- add the mode tags to the 66 instance files with a small Python pass driven by the D2 rule (tag order: mode tags first, then topic tags).

**Refactor checkpoint:** if the D2 rule duplicates logic in `classifyMiroirTestSuiteExecutionCapabilities`, expose it there (one function returning the mode set) and use it in the guard.

### Validation
- `RUN_TEST=miroirTestNaming npm run testByFile -w miroir-core -- miroirTestNaming.316`
- `npm run testByFile -w miroir-core -- miroirTestTags.unit`
- `npm run testMiroir -w miroir-standalone-app -- --tags ui --mode unit`
- modelValidation for both deployments; typecheck `miroir-core`
- `npm run test -w miroir-core -- ''`

### Realization
_(pending)_

---

## Slice 2 — Naming guard + UI component suites renamed

**Status:** ⬜ pending

**Goal:** `--suites ui.mlElementEditor.array` runs the array editor suite; the grid shows the 9 new names and descriptions.

**RED** — `miroirTestNaming.316.phase2.unit.test.ts`, three guards over the catalog, each skipping names in a `LEGACY_NAMES` list (initially the 57 non-UI names, shrinking each slice):
- name matches `^[A-Za-z0-9._-]+$` (D4);
- name starts with the kind prefix computed from leaf types (`ui.` for `reactComponentTestSuite`), then camelCase dot segments;
- root `definition.miroirTestLabel` equals `name` (D11);
- description contains no `#<digits>`, no uuid, no "Migrated from" / "Phase" (D9).

**GREEN:**
- write `rename_miroir_tests.py`: given a subset of `rename-map.json`, rewrites instance `name` and root `miroirTestLabel`, renames `miroirTest_<old>` exports to D12 form in `index.ts`, `index.d.ts`, `src/Model.ts` and importers, and replaces quoted old names and `--suites` values in `packages/`, `scripts/`, `docs/`, `.agents/skills/`, `AGENTS.md` (never bare identifiers; see analysis "Where names are referenced");
- run it for the 9 UI suites; write the 9 descriptions by hand (D9);
- `python scripts/sync_agent_skills.py` if a skill changed.

**Refactor checkpoint:** remove `LEGACY_NAMES` entries for the 9; check the script's diff contains no identifier change outside `miroirTest_*`.

### Validation
- guards (phase0–2), `miroirTestTags.unit`
- `npm run testMiroir -w miroir-standalone-app -- --suites ui.mlElementEditor.array --mode unit`
- `npm run testByFile -w miroir-standalone-app -- runAllComponentTests.286.phase6` and `MiroirTestListDisplay`
- deployment rebuild, modelValidation, typecheck `miroir-core`, `miroir-standalone-app`, deployments
- `npm run nonreg:unit`

### Realization
_(pending)_

---

## Slice 3 — Runner and action suites renamed

**Status:** ⬜ pending

**Goal:** the 18 integration suites run under their new names from the CLI, the Miroir Tests menu and the nonreg manifest, and DomainController suites still launch as `domainControllerTest`.

**RED:**
- extend the phase2 guards (remove the 18 from `LEGACY_NAMES`: fails on old names);
- phase0's runner-kind assertion already covers D13 by uuid: it fails as soon as the names change without the stopgap.

**GREEN:**
- run the script for the 7 runner and 11 action suites (4 of them in `miroir-test-app_deployment-library`);
- `inferUiIntegrationRunnerSuiteKind`: prefix `action.domainController.` (D13), with a comment pointing to #317;
- nonreg manifest: `--suites`, titles, and ids → `integ-<new name>` for the 15 single-suite steps of these kinds and for the #274 step (`integ-action.scenario.multistepReportTemplate`); `externalServices-spotify` keeps its id;
- `parseMiroirRunnerTestCLIConfig.ts` key list, `libraryPlayfieldSeeds.ts`, runner registry imports;
- 18 descriptions.

**Refactor checkpoint:** remove any remaining hardcoded runner key list that duplicates the catalog, if the change stays local; otherwise note it for #317.

### Validation
- guards, `miroirTestTags.unit`, `npm run test -w miroir-core -- ''`
- `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites runner.createEntity,action.domainController.dataCrud --mode integ`
- `npm run testByFile -w miroir-standalone-app -- uiIntegrationTestLauncher.unit` and `uiIntegrationRunnerRegistry.unit`
- rebuild both deployments, modelValidation, typechecks
- `npm run nonreg:filesystem`

### Realization
_(pending)_

---

## Slice 4 — Transformer suites renamed

**Status:** ⬜ pending

**Goal:** `--suites tr.core --mode integ` and `--mode unit` run the core transformer catalog under its new name, as do the other 10 transformer suites.

**RED:** remove the 11 from `LEGACY_NAMES`.

**GREEN:** script for the 11; `uiIntegrationTestTransformerSuiteRegistry.ts`, `resolveUiIntegrationRunnerSuiteKey.ts`, `uiIntegrationTestLauncher.ts` examples; nonreg `integ-tr.core`; the `externalServices-spotify` command; D14 keys for `adminTransformers`, `defaultValueForMLSchema`, `menu`, `metaModelTransformers`, `miroirCoreTransformers`, `mlsTypeCheck`, `pilot_transformer_plus`, `resolveConditionalSchema`, `resolveSchemaReferenceInContext`, `unfoldSchemaOnce`; 11 descriptions.

**Refactor checkpoint:** drop the `menu` / `mlsTypeCheck` / `metaModelTransformers` alias branches in `miroirCoreTestSuiteRegistry.ts` once their keys are the new names.

### Validation
- guards, `miroirTestTags.unit`, `npm run test -w miroir-core -- ''`
- `npm run testMiroir -w miroir-core -- --suites tr.core,tr.mlsTypeCheck --mode unit`
- `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites tr.core --mode integ`
- rebuild, modelValidation, typechecks, `npm run nonreg:unit`

### Realization
_(pending)_

---

## Slice 5 — Function and query suites renamed

**Status:** ⬜ pending

**Goal:** every MiroirTest name follows the scheme; the guards run with an empty `LEGACY_NAMES`, which is then deleted.

**RED:** remove the last 28 from `LEGACY_NAMES`.

**GREEN:** script for the 26 function and 2 query suites; remaining D14 keys and the `alterObject` alias branch; 28 descriptions. Watch the identifier collisions listed in the analysis (`tools`, `mustache`, `mlsToJsonSchema`, `EntityPrimaryKey`, …): only quoted names and `--suites` values change.

**Refactor checkpoint:** delete `LEGACY_NAMES`; delete the script's per-kind subset option if unused.

### Validation
- guards, `miroirTestTags.unit`, `npm run test -w miroir-core -- ''`
- `npm run testMiroir -w miroir-core -- --tags unit --mode unit`
- rebuild, modelValidation, typechecks, pre-push gate, `npm run nonreg:unit`

### Realization
_(pending)_

---

## Slice 6 — Docs, skills, nonreg baseline, cleanup, AC

**Status:** ⬜ pending

**Goal:** a contributor finds the naming scheme and mode tags documented, and the nonreg baseline carries the new ids.

**Work:**
- `docs/reference/testing.md`, `docs/contributing/testing.md`, `docs/guides/developer/testing.md`: naming scheme per kind, description rule, the three mode tags; sweep remaining old names;
- `AGENTS.md` testing examples; `.agents/skills/miroir-edit-*` examples; `python scripts/sync_agent_skills.py`;
- migrate the guards from `issues/316-miroirtest-naming/` into `packages/miroir-core/tests/5-tests/miroirTestNaming.unit.test.ts` (naming, root label, descriptions) and `miroirTestTags.unit.test.ts` (mode tags); keep Slice 0's runner-kind assertion as a unit test of `inferUiIntegrationRunnerSuiteKind`; delete the issue directory and the one-off script and JSON map;
- add the migrated test file to the nonreg `unit-312-miroir-test-tags` step (or a sibling `unit-miroir-test-naming` step);
- run `npm run nonreg:filesystem` and keep its snapshot as the new `latest` (D10).

**Tracer narrative:** open Miroir Tests in the standalone app, filter the grid on the `ui` chip: the 9 `ui.mlElementEditor.*` suites remain, each with a one-sentence description; Run All runs them. Automated equivalent: `testMiroir -w miroir-standalone-app -- --tags ui --mode unit`.

### Validation
- pre-push gate (`sync_agent_skills --check`, `pytest scripts/tests`, core typecheck, core unit tests)
- `npm run nonreg:filesystem`

### AC checklist

| Acceptance criterion (issue #316) | Proof |
|---|---|
| 66 instances renamed to `<kind>.<subject>[.<variant>]` | `miroirTestNaming.unit.test.ts` kind-prefix guard |
| `unit`, `integ`, `ui` in the enum and on every test, derived from leaf types | `miroirTestTags.unit.test.ts` mode-tag guard |
| Descriptions: one sentence, no issue numbers, uuids, history | description guard |
| Allowed characters only | character guard |
| Nonreg manifest, registries, tests, docs updated; no aliases | `nonreg:filesystem` green, typechecks, grep for old names empty outside `code-helpers/` |
| Inner labels out of scope | unchanged (root label only, D11) |

### Realization
_(pending)_
