# Issue #509 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each). The guard is tested through its command line, on throwaway git repositories with the monorepo asset layout and on the real repository. The data fix is proven by the guard and by the miroir-app-miroir modelValidation and rebuild. No mocks. The tracer bullet: the guard, run on this repository, names the two #509 files.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step. Each slice ends with its Validation commands; on success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/509
Working branch: `claude/509-duplicate-transformer-uuid`

**Resume note:** Slices 1–3 DONE; PR open, waiting for the user's review.

---

## Scope

- G1: `indexListBy` and `listReducerToSpreadObject` both deployed (distinct uuids).
- G2: a duplicate instance uuid within one Entity folder fails a check that runs on every PR.

Persisted Postgres / IndexedDB / MongoDB stores need a reseed to get the new uuid (analysis § Persisted stores); the PR description says so.

This plan does **not** enforce `file name == uuid` (14 files, non-goal of the analysis) nor switch miroir-app-miroir's modelValidation to filesystem groups.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 1 | Guard reports duplicate instance uuids (tracer) | ✅ | `scripts/tests/test_check_instance_uuids.py` |
| 2 | The repository has no duplicate instance uuid | ✅ | `test_repository_has_no_duplicate_instance_uuids` + modelValidation miroir |
| 3 | Nonreg, docs, AC | ✅ | full `nonreg:filesystem` (shared runner) |

---

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| D1 | `listReducerToSpreadObject` takes uuid `0894ed4f-ca11-4b04-878d-471d1d780fac` (its file name) | G1 |
| D2 | Python guard `scripts/check_instance_uuids.py`; enforced by a pytest test on the real repository, so the existing `python -m pytest scripts/tests -q` step of `pr-checks.yml` and of the pre-push gate runs it; `npm run check:uuids` alias for direct use | G2 |
| D3 | One check per tracked folder `packages/**/<uuid folder>/*.json`; uniqueness on `uuid`; folders of Entities whose `idAttribute` is set and is not `"uuid"` are skipped, the folder's own package Entity winning; JSON that is not an object with a string `uuid` is ignored; invalid JSON fails | G2 |
| D4 | Delete `miroir_modelVersion/c3f0facf…/695826c2-aefa-4f5f-a131-dee46fe21c1.json`, import `…dee46fe21c13.json` in `index.ts`; `MIROIR_VERSION_HISTORY_PARENTS["c3f0facf…"]` 2 → 1 | G2 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| `listReducerToSpreadObject` | `0894ed4f-ca11-4b04-878d-471d1d780fac` |
| npm script | `check:uuids` |

No new nonreg step: the guard runs in `scripts/tests`, which `pr-checks.yml` already runs.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Guard tests | `python -m pytest scripts/tests/test_check_instance_uuids.py -q` |
| Guard on the repository | `python scripts/check_instance_uuids.py` |
| Deployment validation | `npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts` |
| Rebuild | `npm run build -w miroir-app-miroir` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared` |

---

## Slice 1 — Guard reports duplicate instance uuids (tracer)

**Status:** ✅ DONE

### Goal

`python scripts/check_instance_uuids.py [--repo R]` lists, per folder, each uuid carried by more than one file with the file names, and exits 1; exits 0 with a one-line summary otherwise.

### RED

`scripts/tests/test_check_instance_uuids.py`, throwaway git repos (pattern of `test_tracked_assets_guard.py`):
1. two files with the same `uuid` in `packages/app/assets/app_data/<entityUuid>/` → exit 1, output names the uuid and both paths;
2. the same `uuid` in two different entity folders → exit 0;
3. a folder of an Entity declared with `idAttribute: ["a","b"]` (Entity file under `…_model/16dbfe28-…/`) holding two files with the same `uuid` → exit 0;
4. an untracked duplicate (not added to git) → exit 0;
5. JSON without `uuid`, or an array (two of each in one folder) → ignored;
6. invalid JSON → exit 1, path named;
7. one Entity folder name in two packages, same uuid → exit 0;
8. another package declaring a composite key for the Entity does not skip this package's folder;
9. a tracked file deleted in the working tree → skipped.

### GREEN

`git ls-files -z 'packages/**/*.json'`, keep files whose parent folder name is a uuid, group by parent folder, read `uuid`. Build `entityUuid → idAttribute` from tracked files under a `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/` folder; skip a folder whose Entity's `idAttribute` is present and not `"uuid"`.

### Refactor checkpoint

Share nothing with `tracked_assets_guard.py` unless a helper is duplicated verbatim.

### Validation

```bash
python -m pytest scripts/tests/test_check_instance_uuids.py -q
python scripts/check_instance_uuids.py   # expected: exit 1, the 2 duplicates of the analysis
```

### Realization

Guard and 11 tests (RED: 7 failing, script absent; GREEN). The plan review added tests 5–9 and two behaviours: invalid JSON fails instead of being skipped, and the own-package Entity wins the `idAttribute` lookup. `--repo` on this repository then printed the 2 duplicates of the analysis.

---

## Slice 2 — The repository has no duplicate instance uuid

**Status:** ✅ DONE

### Goal

G1 + the enforcement half of G2: the guard passes on the repository, and a pytest test keeps it so.

### RED

`test_repository_has_no_duplicate_instance_uuids` in the same file runs the guard on the repository root: fails with the 2 duplicates.

### GREEN

1. `listReducerToSpreadObject` JSON: `uuid` → `0894ed4f-ca11-4b04-878d-471d1d780fac`.
2. `git rm` the truncated `…dee46fe21c1.json`; `index.ts:174` imports `…dee46fe21c13.json`; `miroir-core/tests/1_core/versioningModes.testData.ts`: `c3f0facf…` count 2 → 1 (asserted by `versioningModes.assetsLayout.unit.test.ts` and `versioningModes.filesystem-seed.integ.test.ts`).
3. `npm run build -w miroir-app-miroir`.
4. `package.json`: `"check:uuids": "python scripts/check_instance_uuids.py"`.

### Refactor checkpoint

The #497 analysis §4.1 names the duplicate: leave it (history), the issue link resolves it.

### Validation

```bash
python -m pytest scripts/tests -q
python scripts/check_instance_uuids.py
npm run build -w miroir-app-miroir
npx tsc --noEmit --skipLibCheck -p packages/miroir-app-miroir/tsconfig.json
npm run testByFile -w miroir-app-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-core -- versioningModes.assetsLayout
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- versioningModes.filesystem-seed
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling
```

### Realization

`listReducerToSpreadObject` uuid → `0894ed4f-…`; truncated `…dee46fe21c1.json` removed, `index.ts` imports `…c13.json`; `versioningModes.testData.ts` count 2 → 1 (found by the analysis review). Guard: no duplicate. modelValidation miroir: 166 passed; `versioningModes.assetsLayout`: 5 passed; `versioningModes.filesystem-seed` (test-filesystem): 4 passed; `tsc` miroir-app-miroir and miroir-core clean. `npm run test -w miroir-core` first showed 4 failures in Library tests: a stale `miroir-example-library` build from an earlier branch; after `npm run build -w miroir-example-library`, 3239 passed.

---

## Slice 3 — Nonreg, docs, AC

**Status:** ✅ DONE

### Goal

Safety net and discoverability.

### Steps

- `docs/contributing/testing.md` (or the closest page listing repo guards): one line on `check:uuids`.
- Pre-push gate (AGENTS.md list) and full nonreg.

### Validation

```bash
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
python scripts/check_dependency_policy.py
npm run lint
npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared
```

### AC checklist

| Issue AC | Proof |
|---|---|
| `listReducerToSpreadObject` has the uuid of its file name | Slice 2 GREEN 1; guard on the repository |
| References updated | none by uuid (analysis § References); `index.ts` imports by path |
| miroir-app-miroir rebuilt | Slice 2 Validation |
| Model check fails on duplicate instance uuids within an Entity | Slice 1 test 1; Slice 2 repository test in `pr-checks.yml` via `scripts/tests` |

### Realization

No docs page lists the Python repo guards one by one; the guard is discoverable through `npm run check:uuids` and its docstring, and runs through `scripts/tests`, so AGENTS.md and `pr-checks.yml` stay unchanged. No new nonreg step (the `tooling` scope already runs `scripts/tests`). No issue-scoped test directory to clean up. Tracer narrative: commit a second file with an existing uuid in any deployment folder → `pytest scripts/tests` fails in the pre-push gate and in pr-checks, naming the folder, uuid and both files. Results of the pre-push gate and full nonreg: see the PR description.
