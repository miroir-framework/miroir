# Issue #671 — TDD Implementation Plan

> Integration first, no mocks. The tests go through the environment definition (`deriveEnvironmentDeployments`
> MiroirTest), a real server-side DomainController booted from the `dev` definition on filesystem stores
> (`miroir-env` integ), and the recorder's command line on temporary folders.

**Resume note:** AFK run, one commit per slice. Decisions: [analysis.md](analysis.md) D1–D9.

## Scope

In: G1–G4 of the analysis. Out: the analysis non-goals (Miroir's other devData Entities, MiroirTests of
applications outside `packages/`, AgentRuns in test or delivery environments).

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/671
- Analysis: [analysis.md](analysis.md); #550 [plan](../550-FEATURE-agent-cost-measurement/tdd-implementation-plan.md); #647 [plan](../647-REFACTOR-devdata-section/tdd-implementation-plan.md)
- Branch: `claude/project-thread-bhlzsl` → `_integration`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 1 | An environment application names its own `packagesDirectory` | ⬜ pending | `fn.environment.deriveDeployments` |
| 2 | The `dev` environment opens AgentRuns with the 24 runs and its Reports | ⬜ pending | `agentRunsApplication.integ.test.ts` |
| 3 | `agent-run:record` writes into AgentRuns | ⬜ pending | `agentRunRecord.unit.test.ts` (miroir-env) |
| 4 | Miroir no longer knows agent runs; docs, nonreg | ⬜ pending | devData tests, `grep`, nonreg |

## Locked implementation defaults

Analysis D1–D9, unchanged.

## Allocated UUIDs / keys

| Element | uuid |
|---|---|
| SelfApplication `AgentRuns` | `7f2c40ba-04e4-4204-9cb2-2cc5ca63593c` |
| Deployment (dev) | `969b6e42-2023-4650-b3bc-4fe9d67f1cbb` |
| ApplicationModelBranch `master` | `df90bb35-c447-4993-a4fd-39321824d319` (headVersion `feeec60f-fb24-4371-8ece-3b9e1a4776b0`) |
| Menu `AgentRunsMenu` | `7a5c0405-7762-4a10-996b-8ce4d0728e35` |
| Entity, Reports, rows | unchanged (analysis § 4) |

Environment application key: `agentRuns` (asset prefix `agentRuns`).

## Test execution conventions

| What | Command |
|---|---|
| deriveDeployments MiroirTest | `npm run build -w miroir-app-miroir && npm run testMiroir -w @miroir-framework/core -- --suites fn.environment.deriveDeployments --mode unit` |
| schema → types | `npm run build -w miroir-app-miroir && npm run devBuild -w @miroir-framework/core` |
| miroir-env tests | `npm run testByFile -w @miroir-framework/env -- <file>` |
| typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |

## Slice 1 — an environment application names its own `packagesDirectory`

**Status:** ⬜ pending

**RED:** new case in `fn.environment.deriveDeployments`: an application with `packagesDirectory: "code-helpers/features"`, `package: "550-FEATURE-agent-cost-measurement"`, `live`, gets `code-helpers/features/550-FEATURE-agent-cost-measurement/assets/agentRuns_model` (and `_data`, admin `…/assets`), while the other applications keep `packages/…`.

**GREEN:** `packagesDirectory` optional string in `miroirEnvironmentApplication` (schema, regenerated types); `applicationAssetsDirectory` uses `application.packagesDirectory ?? packagesDirectory`. The five callers spread the application, so they follow.

**Refactor checkpoint:** none expected.

**Validation:** deriveDeployments MiroirTest; `tsc` core and miroir-env; `npm run test -w @miroir-framework/core -- ''`.

## Slice 2 — the `dev` environment opens AgentRuns

**Status:** ⬜ pending

**RED:** `packages/miroir-env/tests/agentRunsApplication.integ.test.ts` (vitest: boot wiring on a real DomainController, not reachable through MiroirTest). On a temporary checkout of the `dev` definition (bootTestSupport, plus the 550 folder): the AgentRuns deployment points at the 550 folder, is opened without warning, its AdminApplication row is named `AgentRuns`, its model holds the Entity and the two Reports, its data holds 24 `AgentRunMeasurement` rows, and nothing under the 550 folder changes.

**GREEN:** application files (analysis D3, D5) with `git mv` of the Entity, Reports and rows; `selfApplication` → AgentRuns; Report menu; `dev.json` entry (D6).

**Refactor checkpoint:** `bootTestSupport.temporaryCheckout` copies the folders the definition names, not a fixed package list.

**Validation:** the new test and `serverBootFromEnvironment.integ`; `npm run miroir-env -- check --strict`.

## Slice 3 — `agent-run:record` writes into AgentRuns

**Status:** ⬜ pending

**RED:** `packages/miroir-env/tests/agentRunRecord.unit.test.ts`, the four #550 cases moved, calling the recorder from the 550 folder; default data folder = `agentRuns_data`.

**GREEN:** `code-helpers/features/550-FEATURE-agent-cost-measurement/scripts/{recordAgentRun,agentRunHistory,repoInfo}.ts` (D8, D9); root script `agent-run:record`; `batch.py` calls it.

**Validation:** the test; `python -m pytest scripts/tests -q`.

## Slice 4 — Miroir no longer knows agent runs

**Status:** ⬜ pending

**RED:** devData layout and Report tests list the two remaining devData Entities and four Reports only; `grep -r 954de789` under `packages/miroir-app-miroir`, `packages/miroir-core/src` finds nothing.

**GREEN:** remove exports and lists (`index.ts`, `index.d.ts`, `src/Model.ts`, core `Model.ts`), the menu item, the MiroirTest, its seeds and nonreg step, the old scripts and npm script; update `cacheRefreshPolicy`, `reportTestLauncher` tests; docs.

**Validation:** pre-push gate (AGENTS.md); `npm run nonreg:unit -- --runner shared`; `npm run nonreg:filesystem -- --runner shared`.

## AC checklist

| #671 acceptance criterion | Proof |
|---|---|
| The environment declaring `agentRuns` shows the "Agent runs" Report with the 24 runs | Slice 2 test (deployment, model, 24 rows) + manual client check |
| The recorder writes one valid instance into the 550 folder | Slice 3 test |
| No `954de789` under `miroir-app-miroir` and `miroir-core/src` | Slice 4 grep |
| `report.agentRunHistory` passes on the new application | replaced (analysis D7) |
| nonreg unit and filesystem pass | Slice 4 validation |
