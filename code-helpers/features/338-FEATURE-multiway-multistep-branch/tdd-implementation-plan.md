# Issue #338 — TDD Implementation Plan

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/338
Working branch: `claude/issue-338-qw3n4k` (from `_integration`, PR against `_integration`). One green commit per slice.

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 1 | Multi-way `branch.cases` in the multistep host | ✅ | `multistepBranch.284` tests `cases-branch-*` |
| 2 | Wizard: Scheme goes straight to its secrets step | ⏳ | MiroirTest `report.connectExternalServiceWizard` leaf "a custom token reaches neither the step bag nor the page" |

## Slice 1 — Multi-way `branch.cases` in the multistep host

- RED: in `multistepBranch.284.integ.test.tsx`, a fixture variant whose `choice` step branches with `cases` (`"true"` → `secret`, `"false"` → `review`): unchecked goes to Review; a variant with only `"true"` and no `default` stays on Choice with `No branch case for value: false`; with `default: "review"` it goes to Review.
- GREEN: Report Entity + EntityVersion `branch` gain `cases` (record of string) and `default` (string, optional); `whenTrue` / `whenFalse` optional. `npm run build -w miroir-app-miroir`, `npm run devBuild -w miroir-core`. Host resolves `cases[String(value)] ?? default` when `cases` is set.
- Docs: `docs/reference/api/reports.md` multistep paragraph.
- Validation: `RUN_TEST=multistepBranch.284 npm run testByFile -w miroir-standalone-app -- multistepBranch.284`, typecheck core + standalone-app, `npm run nonreg -- --runner shared --profile emulatedServer-filesystem --run-all --scope smoke,ui,external`.

## Slice 2 — Wizard: Scheme goes straight to its secrets step

- RED: MiroirTest leaf expects "Custom token" right after Scheme (Client credentials step removed).
- GREEN: wizard `scheme` step branch uses `cases` on `scheme.scheme`; `secretsClient` always goes to `operations`. Rebuild `miroir-app-miroir`.
- Validation: `npm run testMiroir -w miroir-standalone-app -- --suites report.connectExternalServiceWizard --mode integration`, `npm run nonreg -- --runner shared --profile emulatedServer-filesystem --run-all --scope smoke,ui,external`.

## Realization

- Slice 1: four `cases-branch-*` tests in `multistepBranch.284` (true case, false case, `default`, no matching case). Nonreg smoke,ui,external on filesystem, shared runner: 37/37 pass.
