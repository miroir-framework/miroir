# Issue #351 — TDD Implementation Plan

> Tests drive the real `scripts/run-nonreg.py` against small stub manifests (the #318 pattern in `scripts/tests/test_run_nonreg.py`) and read the real manifest for the coverage guard. No mocks.
>
> **Resume note:** slices below carry their status; the progress table is kept in sync.

## Scope

In: `scopes` on manifest steps and a top-level scope catalogue, `--scope` selection, a coverage guard, per-scope durations, the file-area → scope guide in the TDD plan skill, docs.
Out: MiroirTest tag selection, run-time derivation from a diff (analysis D1, D3).

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/351
- [analysis.md](analysis.md)
- Branch: `claude/project-thread-8i0l2n` (from `_integration`)

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 1 | `--scope` selects a scope's steps plus `always` | ✅ DONE | `test_scope_*` in `test_run_nonreg.py` |
| 2 | Real manifest scoped, guard keeps it complete | ⬜ pending | `test_every_manifest_step_*`, `test_smoke_*` |
| 3 | Plan skill names a scope per slice; docs; durations | ⬜ pending | `sync_agent_skills.py --check`, measured runs |

## Locked implementation defaults

Analysis D1 to D8, unchanged.

## Test execution conventions

| What | Command |
|---|---|
| Runner tests | `python -m pytest scripts/tests -q` |
| Skills sync | `python scripts/sync_agent_skills.py --check` |
| Dry-run a scope | `python scripts/run-nonreg.py --scope smoke --dry-run --profile emulatedServer-filesystem` |
| Measure a scope | `npm run nonreg:filesystem -- --scope <name> --runner shared` |

## Slice 1 — `--scope` selects a scope's steps plus `always`

**Status:** ✅ DONE

**RED** (`scripts/tests/test_run_nonreg.py`, stub manifest with scopes):
- `--scope a` runs the steps listed in `a` plus the `always` steps, in manifest order, and records `scopes: ["a"]` in `summary.json`.
- `--scope a,b` runs the union.
- `--scope a --only x` adds step `x`.
- `--tier` still filters.
- An unknown scope exits 2 and names the declared scopes.
- Without `--scope`, the `scopes` key is absent from `summary.json` (legacy contract unchanged).

**GREEN:** parse `--scope`, validate against `manifest["scopes"]`, select `step.scopes ∩ selected ∪ {always}`; union with `--only`.

**Refactor checkpoint:** selection moves into one `select_steps(manifest, tier, only, scopes)` function.

**Validation:** `python -m pytest scripts/tests -q`

### Realization

`select_steps()` holds tier, `--only` and `--scope` selection. `summary.json` and `summary.md` carry the scopes only when given.

## Slice 2 — Real manifest scoped, guard keeps it complete

**Status:** ⬜ pending

**RED:**
- Every manifest step has a non-empty `scopes` list whose names are declared in the top-level `scopes` catalogue.
- Every step has a scope other than `smoke`.
- The two bracket steps are in `always`.
- `smoke` holds at least one step of each of `core`, `actions`, `runners`, `ui`.
- The catalogue declares 3 to 8 scopes besides `always`.

**GREEN:** add `scopes` to the 88 steps (analysis inventory) and the catalogue.

**Validation:** `python -m pytest scripts/tests -q`; `python scripts/run-nonreg.py --scope <each> --dry-run --profile emulatedServer-filesystem`

### Realization

Membership written with a one-off Python script from the analysis inventory; guard tests in `test_run_nonreg.py`.

## Slice 3 — Plan skill, docs, measured durations

**Status:** ⬜ pending

- `miroir-analysis-to-tdd-plan`: each slice's Validation names its nonreg scope(s), from a file-area → scope table; full nonreg every 2 or 3 slices and before a PR is ready.
- `docs/reference/testing.md`: `--scope`, the scope table with measured durations.

**Validation:** `python scripts/sync_agent_skills.py --check`; `python -m pytest scripts/tests -q`; each scope run once on the filesystem profile with the shared runner.

### Realization

See the PR description for measured durations.

## AC checklist

| AC | Proof |
|---|---|
| 1. 3 to 8 scopes incl. `smoke` | `test_scope_catalogue_declares_three_to_eight_scopes` |
| 2. `--scope` union, both runners | `test_scope_*`; measured runs with `--runner shared` |
| 3. Guard on unscoped / unknown | `test_every_manifest_step_*` |
| 4. Durations in docs | `docs/reference/testing.md` scope table |
| 5. Plan skill names scopes per slice | `.agents/skills/miroir-analysis-to-tdd-plan/SKILL.md` |
