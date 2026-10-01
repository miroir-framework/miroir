# 351 — Nonreg scopes

> Named, reduced subsets of the non-regression manifest (`scripts/nonreg-manifest.json`), run with `--scope`, so an implementation slice checks a radius slightly wider than its expected impact without running the whole nonreg. One scope, `smoke`, is wide and thin.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/351
- Prerequisite: #318 nonreg profiling ([analysis](../318-FEATURE-nonreg-profiling/analysis.md)): `--timings`, `--runner shared`
- Runner: [`scripts/run-nonreg.py`](../../../scripts/run-nonreg.py), manifest: [`scripts/nonreg-manifest.json`](../../../scripts/nonreg-manifest.json), tests: [`scripts/tests/test_run_nonreg.py`](../../../scripts/tests/test_run_nonreg.py)
- Skill to update: [`.agents/skills/miroir-analysis-to-tdd-plan/SKILL.md`](../../../.agents/skills/miroir-analysis-to-tdd-plan/SKILL.md)
- Docs: [`docs/reference/testing.md`](../../../docs/reference/testing.md) § Repo-wide non-regression

## Decision record

Confirmed by A on 2026-09-30 (issue comment thread):

| # | Decision | Status |
|---|---|---|
| D1 | Scopes select **manifest steps** only; MiroirTest tags (#312) are not used. | **Accepted** |
| D2 | `smoke` may leave out appstack steps, but they are not excluded by principle: one is included when it is the best representative of its layer. | **Accepted** |
| D3 | A slice's scope is chosen **when writing the TDD plan**, from the files the slice changes (skill `miroir-analysis-to-tdd-plan`). No automatic derivation at run time. | **Accepted** |

Defaults picked while implementing (A may revisit):

| # | Decision | Options | Chosen |
|---|---|---|---|
| D4 | Where membership is declared | (a) top-level `scopes` map name → step ids; (b) a `scopes` array on each step, plus a top-level map of scope descriptions | **(b)**: a new step cannot be added without naming its scope, and the guard is a per-step check. (a) drifts from the step list. |
| D5 | Run bracket steps (`unit-321-environment-before`, `unit-321-tracked-assets`) | include explicitly in every scope; a reserved `always` scope | **`always`**: steps in `always` join every scoped selection. The tracked-assets check needs the snapshot taken by the first step, so they must travel together. |
| D6 | `--scope` with `--only` | mutually exclusive; intersection; union | **union**: a plan can say "scope `actions` plus step `unit-345-cli`". Both stay filtered by `--tier`. |
| D7 | Unknown scope name | ignore; error | **error, exit 2**, listing the declared scopes. |
| D8 | Multi-membership | one scope per step; several | **several**: e.g. `integ-runner.dropEntity` is both `runners` and `actions`. Every step needs at least one scope other than `smoke`, so the non-smoke scopes together cover the whole manifest. |

## Goals

1. **Reduced check per slice.** In order to keep feedback fast between slices, as a developer (human or agent) implementing a slice, I can run `npm run nonreg:filesystem -- --scope <names> --runner shared` and get only the steps of those scopes, with the usual snapshot and summary.
2. **Wide and thin smoke.** In order to catch gross breakage anywhere, as a developer, I can run `--scope smoke` in a few minutes and exercise one step per layer (model validation, transformers, DomainController, runner, report, UI component).
3. **No step left behind.** In order to trust that scopes together equal the full suite, as a maintainer adding a nonreg step, I am told by a failing guard test when my step has no scope or names an unknown one.
4. **Scope named in the plan.** In order to make each slice's check explicit and reviewable, as a plan author, I pick each slice's scope(s) from a file-area → scope guide in the TDD plan skill.

## Non-goals

- Selecting MiroirTests by tag inside a step (D1).
- Deriving the scope from a diff at run time (D3).
- Making steps faster: the per-step cost is #318's territory.
- Changing `--tier` semantics or the default run: without `--scope`, a run is unchanged.

## Current state

- The manifest has **88 steps** on `_integration` at fde1e47, each `{id, tier, title, requires, argv[, shared]}`; top-level keys `version`, `description`, `defaultProfile`, `profiles`, `steps`.
- `run-nonreg.py main()` selects `steps` by `step_in_tier(...)` and an optional `--only` set of ids, then runs them in manifest order (legacy or shared runner). No notion of area.
- `--only` needs the ids spelled out each time; the current practice (memory, A 2026-09-28) is "full nonreg every 2 or 3 slices, in between the gate plus the suites the slice touches", picked ad hoc.
- First and last steps are a bracket: `unit-321-environment-before` snapshots tracked assets and the environment; `unit-321-tracked-assets` checks them (`test_every_tier_starts_by_recording_the_environment_and_ends_with_the_tracked_assets_check`).
- Where time goes (#318): about 9 s of fixed launch overhead per vitest launch; test bodies are a minor share. So a scope's cost is roughly proportional to its number of launches, which the shared runner reduces.

## Scope inventory

| Scope | Covers | Typical files changed |
|---|---|---|
| `always` | run bracket (environment record, tracked-assets check) | n/a, joins every scoped run |
| `smoke` | one step per layer | any slice, always added |
| `core` | miroir-core unit catalog, transformers, queries, schemas, model validation, access/auth | `packages/miroir-core/src/0_interfaces`, `1_core`, `2_domain`; deployment assets (`packages/miroir-app-*`, `miroir-example-*`) |
| `actions` | DomainController, persistence stores, model evolution (CRUD, undo/redo, freeze, drop) | `3_controllers`, `4_services`, `packages/miroir-store-*`, `miroir-localcache*` action paths |
| `runners` | runners, MCP runners, scenarios, multistep processes | runner definitions, `miroir-mcp`, runner execution code |
| `ui` | React components, reports, Miroir Tests UI, grids | `packages/miroir-react`, `miroir-standalone-app/src/4_view`, Report assets |
| `localcache` | local cache memory measure and monitor | `packages/miroir-localcache*`, local cache monitor views |
| `external` | external services, OpenAPI connection wizard, secrets, process capabilities, AI backend | external-service code, secrets, `miroir-ai`, wizard assets |
| `tooling` | repo guards, test harness, build tooling, runtimes (env, CLI, MCP, Electron) | `scripts/`, `.agents/`, test launchers, `miroir-env`, `miroir-cli`, `miroir-standalone-app-electron` |

Exact membership is in the manifest (`scopes` on each step); the guard keeps it complete.
