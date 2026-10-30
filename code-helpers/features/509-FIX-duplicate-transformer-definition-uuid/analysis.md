# 509 — Duplicate instance uuids: `listReducerToSpreadObject` and the Initial ApplicationVersion

> Why two TransformerDefinitions share a uuid, which other instance shares one, how both are fixed, and where a check that rejects duplicate instance uuids within an Entity lives.

Related: issue https://github.com/miroir-framework/miroir/issues/509 · found in [#497 analysis §4.1](../497-FEATURE-visual-block-editor/analysis.md) · consumers that look definitions up by uuid: #500 (block palette), #502 (application-level definitions), #507 (presentation hints) · code: [`miroir-app-miroir/index.ts`](../../../packages/miroir-app-miroir/index.ts), [`ModelValidationTools.ts`](../../../packages/miroir-core/src/5_tests/ModelValidationTools.ts), [`ModelValidationToolsFilesystem.ts`](../../../packages/miroir-core/src/5_tests/ModelValidationToolsFilesystem.ts), [`pr-checks.yml`](../../../.github/workflows/pr-checks.yml).

## Goals

| # | Goal |
|---|---|
| G1 | **Every definition deployed.** In order to find every stock TransformerDefinition in the block palette and in uuid-keyed stores, as an application designer, I get both `indexListBy` and `listReducerToSpreadObject` in the deployed Miroir model. |
| G2 | **Duplicates caught before merge.** In order to never again lose an instance to a uuid collision, as a framework maintainer, I get a failing check on my PR when two instances of one Entity in one deployment folder share a uuid. |

Non-goals: file names that differ from the instance uuid without a collision (14 files before the fix, listed in § Current state, no data loss; a later issue can enforce `file name == uuid`); making miroir-app-miroir's modelValidation read its filesystem assets (6 unrelated failures today, see D2).

## Decision record

| # | Decision | Chosen | Rejected | Goals |
|---|---|---|---|---|
| D1 | New uuid of `listReducerToSpreadObject` | `0894ed4f-ca11-4b04-878d-471d1d780fac`, its file name (issue text). No other tracked file uses it. | A fresh uuid: the file would need a rename too, for no gain. | G1 |
| D2 | Where the duplicate check lives | **Accepted (recommended, card posted to the user):** a Python asset guard `scripts/check_instance_uuids.py`, run in `pr-checks.yml` and in the AGENTS.md pre-push gate, with pytest tests in `scripts/tests/`. | A uniqueness test per group in `runModelValidationSuite`: miroir-app-miroir's modelValidation builds its plan from `defaultMiroirMetaModel`, which carries no TransformerDefinition instances, so it would not catch #509; switching it to `buildModelValidationGroupsFromFilesystem` surfaces 6 unrelated failures (Commit `Initial Commit`, 5 MiroirTests). modelValidation also runs only in nonreg, not in CI. A plain miroir-core vitest reading the asset folders (precedent: `versioningModes.assetsLayout.unit.test.ts`) would run in CI too, but the scan reads files of every package, which AGENTS.md assigns to Python repo helpers (precedent: `tracked_assets_guard.py`). | G2 |
| D3 | Scope of the guard | Tracked files `packages/*/…/<entityUuid>/<file>.json` whose parent folder name is a uuid; one check per folder (one Entity in one store of one deployment). Uniqueness on the `uuid` attribute. The Entity of a folder is looked up across every tracked `…/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/<entityUuid>.json` of every package (most instance folders hold instances of Miroir Entities defined in miroir-app-miroir); a folder is skipped when its Entity declares an `idAttribute` other than `"uuid"` (composite array, natural key, or `false`); the Entity definition of the folder's own package wins over one of another package; an Entity not found defaults to `uuid`. A tracked file that is not valid JSON fails the check (a broken merge must not hide a duplicate). Today the only such Entities are the 4 of `miroir-example-postgres`, with no instance files. Out of scope: `scripts/agent_bench/reference/` (5 files, bench fixtures, not deployments). | Uniqueness across model and data folders of a deployment: model and data go to different stores, so no collision is possible there. | G2 |
| D4 | The second duplicate the guard finds | Delete `miroir_modelVersion/c3f0facf…/695826c2-…-dee46fe21c1.json` (truncated file name, same instance as `…dee46fe21c13.json`, whitespace-only diff) and point `index.ts` at `…c13.json`. `MIROIR_VERSION_HISTORY_PARENTS["c3f0facf…"]` in `miroir-core/tests/1_core/versioningModes.testData.ts` goes from 2 to 1: it is the file count asserted by `versioningModes.assetsLayout.unit.test.ts` (CI) and the SelfApplicationVersion row count of `versioningModes.filesystem-seed.integ.test.ts` (the filesystem store returns one row per file, so it returned the duplicate twice). | Keep both: the guard would need an exception. | G2 |

## Current state

Enumerated with a Python scan of every tracked `packages/*/…/<uuid>/*.json` (verification protocol step 1).

### Duplicates (2 folders)

| Folder | uuid | Files | Instances |
|---|---|---|---|
| `miroir-app-miroir/assets/miroir_data/a557419d…` (TransformerDefinition) | `8ddb7e2e-a3d3-4622-81d2-0c3e98bca3ea` | `8ddb7e2e-….json`, `0894ed4f-….json` | `indexListBy`, `listReducerToSpreadObject` (different definitions) |
| `miroir-app-miroir/assets/miroir_modelVersion/c3f0facf…` (ApplicationVersion) | `695826c2-aefa-4f5f-a131-dee46fe21c13` | `…dee46fe21c13.json`, `…dee46fe21c1.json` | `Initial` twice (same content; `index.ts:174` imports the truncated one) |

The TransformerDefinition folder holds 48 files and 47 distinct uuids. `listReducerToSpreadObject` took the duplicate uuid in e8b9f20 (#449 slice 6); d2b798fe (#498) last touched it.

### References

- `8ddb7e2e-…` appears only in the two JSON files and the #497 analysis. `index.ts:374-375` imports both definitions by file path, so no TS reference changes.
- `0894ed4f-…` appears only as the file name.
- `…dee46fe21c1.json` is imported by `index.ts:174` (`selfApplicationVersionInitialMiroirVersion`); `docs-OLD/` lists it in a 2024 stats file (history, untouched).

### Why no check catches it today

- `modelValidationInstancesArrayToRecord` (`ModelValidationTools.ts`) keys MetaModel instances by `uuid`, so a duplicate silently drops one instance from validation.
- miroir-app-miroir's `tests/modelValidation.unit.test.ts` builds its plan from `defaultMiroirMetaModel`, whose arrays hold no TransformerDefinition.
- Filesystem-driven plans (`buildModelValidationGroupsFromFilesystem`, 7 packages) key instances by path, so both files are validated, and both pass.
- `pr-checks.yml` runs no modelValidation.

### File name ≠ uuid, no collision (non-goal)

14 files, all without data loss: the two #509 files above, 1 in `miroir-core/src/assets/miroirAdmin/model/3f2baa83…` (leftover fixture, in the guard's scope), 4 in `miroir-fixture-appForTest/assets/appForTest_data/a027c379…`, 1 in `miroir-example-library/assets/library_model/cdb0aec6…`, 2 in `library_data/d7a144ff…`, 4 in `library_data/a027c379…`.

### Persisted stores

Postgres, IndexedDB or MongoDB stores seeded before the fix hold one of the two definitions under `8ddb7e2e-…`, depending on load order, and get `0894ed4f-…` only when reseeded. The filesystem store writes `<uuid>.json`, so saving `listReducerToSpreadObject` from the app before the fix overwrote the `indexListBy` file.

## Document history

Revised after an adversarial review: D4 gained its test impact, D2 its vitest alternative, D3 its Entity lookup (then, after the plan review, the own-package rule and the invalid-JSON failure), the file-name count went from 13 to 14, and § Persisted stores was added.

## Key reuse

| Piece | Location |
|---|---|
| Python check script pattern (git ls-files scan, exit code, `--repo`) | `scripts/tracked_assets_guard.py`, `scripts/check_ml_nomenclature.py` |
| pytest pattern with a throwaway repo | `scripts/tests/test_tracked_assets_guard.py` |
| Default primary key rule (absent `idAttribute` ⇒ `uuid`) | `docs/guides/developer/defining-entities.md` |
| Entity Entity uuid | `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad` |

Implementation plan: [tdd-implementation-plan.md](tdd-implementation-plan.md).
