# 671 — Agent runs leave Miroir's devData section for an ad-hoc application

> The agent cost benchmark records of #550 (`AgentRunMeasurement`, its two Reports, its MiroirTest, its
> menu entry, its 24 pilot runs, its recorder) leave `miroir-app-miroir`. They become an ad-hoc Miroir
> application, `AgentRuns`, stored as JSON files under
> `code-helpers/features/550-FEATURE-agent-cost-measurement/assets/` and opened by the filesystem store
> like any package application.

Related issue: https://github.com/miroir-framework/miroir/issues/671
Undoes part of: [#647 devData section](../647-REFACTOR-devdata-section/analysis.md) ✅ (D6: Miroir owns today's rows)
Data from: [#550 agent cost measurement](../550-FEATURE-agent-cost-measurement/analysis.md) ✅
Key sources: [`Environment.ts`](../../../packages/miroir-core/src/1_core/environment/Environment.ts) · [`getMiroirFundamentalMlSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts) · [`Model.ts` (core)](../../../packages/miroir-core/src/1_core/Model.ts) · [`Model.ts` (miroir-app-miroir)](../../../packages/miroir-app-miroir/src/Model.ts) · [`adminRows.ts`](../../../packages/miroir-env/src/adminRows.ts) · [`environmentState.ts`](../../../packages/miroir-env/src/environmentState.ts) · [`batch.py`](../../../scripts/agent_bench/batch.py)

**Document role:** analysis and decision record.
**Status:** written AFK (A asked for the AFK workflow on 2026-11-03). Decisions D1–D9 are defaults taken without a grilling round; A reviews them on the PR. Facts checked on `_integration` at `2aafdb4`.

---

## 1. Goals

| Id | Story |
|---|---|
| G1 | **Keep benchmark records out of the platform.** In order to ship Miroir without the records of how it was benchmarked, as a Miroir maintainer, I find no agent run Entity, Report, menu entry or row in `miroir-app-miroir` or in the core devData Entity set. |
| G2 | **Keep the benchmark next to its feature.** In order to read the #550 analysis, plan, results and records in one place, as a Miroir maintainer, I find the agent run application in `code-helpers/features/550-FEATURE-agent-cost-measurement/`. |
| G3 | **Keep following agent runs.** In order to keep comparing benchmark arms, as a Miroir maintainer, I open the "Agent runs" Report from the AgentRuns application in the `dev` environment, on the same 24 rows, and `agent-run:record` adds new runs there. |
| G4 | **Install an application kept outside `packages/`.** In order to open an application whose JSON files live anywhere in the repository, as an environment author, I name its folder in the environment definition, with `live` and `copy` modes working as for a package. |

## 2. Non-goals

| Excluded | Owner |
|---|---|
| `BundleSizeMeasurement`, `PageLoadMeasurement` | stay in Miroir's devData (#647) |
| Running a MiroirTest of an application outside `packages/` (CLI discovery, testbed model from its folder) | follow-up, unscheduled (D7) |
| Installing AgentRuns in test environments, Docker, desktop | not needed: no test uses it (D7), deliveries do not ship it (G1) |
| A generic "application in any folder" UI install | out of scope; the environment definition is enough (D2) |

## 3. Decision record

| # | Decision | Choice | Rejected | Serves |
|---|---|---|---|---|
| D1 | Application identity | **new SelfApplication `AgentRuns`** (`7f2c40ba-…`), Deployment `969b6e42-…`, ModelBranch `df90bb35-…`, Menu `7a5c0405-…`; the Entity, Reports and rows keep their uuids | new uuids for everything (breaks links in #550 results and transcripts) | G1, G3 |
| D2 | How an environment finds the folder | **`packagesDirectory` on an environment application**, overriding the environment's: `"packagesDirectory": "code-helpers/features", "package": "550-FEATURE-agent-cost-measurement"` | `package: "../code-helpers/…"` (a path escape in a name field); a full `configuration` (refused in `test-*` environments, no `copy` mode, no SelfApplication label lookup) | G4 |
| D3 | Layout | **package layout**: `assets/agentRuns_model/`, `assets/agentRuns_data/`, no `deployment/` folder (since #321 the environment generates the Deployment and AdminApplication rows) | `deployment/` rows like `miroir-example-library` (unread) | G2 |
| D4 | Section of the rows | **`data`** of AgentRuns; `AgentRunMeasurement` leaves `devDataEntityUuids` | keep `devData` on the new app (a section for rows "not needed to use" an app; here the rows are the app) | G1, G3 |
| D5 | Model contents | **Entity `AgentRunMeasurement`, Reports `AgentRunHistory`, `AgentRunMeasurementDetails`, SelfApplication (home page = `AgentRunHistory`), ModelBranch, Menu "Agent runs"**, all in `agentRuns_model/`, `selfApplication` set to AgentRuns | Reports in `_data/` (that is Miroir's own layout only) | G2, G3 |
| D6 | Environments | **`dev` only, `live`**: `agent-run:record` writes tracked files, as before. `cloud-agent` and `self-test` inherit it | `bench-agent` / `test-filesystem` (no reader) | G3 |
| D7 | MiroirTest `report.agentRunHistory` | **deleted** with its TestConfiguration seed. CLI discovery scans `packages/*/assets` only and a testbed needs its model as a code object imported by `miroir-standalone-app`; both would pull the application back into packages. Proof instead: `miroir-env` boot integration test on the `dev` definition (deployment opened, 24 rows, Reports in the model) and a manual check of the Reports in the client | extend discovery and testbed loading to environment folders (new machinery for one app) | G1, G3 |
| D8 | Recorder | **TypeScript, `code-helpers/features/550-FEATURE-agent-cost-measurement/scripts/`**, run by root script `npm run agent-run:record`. It validates rows with `checkModelValidationInstance` from `@miroir-framework/core` (the AGENTS.md exception for TS scripts). Its vitest moves to `miroir-env` | Python port (loses the ML type check) | G2, G3 |
| D9 | `repoInfo.ts` | **the recorder keeps its own copy of the 3 git/version helpers** (12 lines); the bundle-size recorder keeps its | import across `code-helpers` → `packages` | G1 |

## 4. Current state (`_integration` at `2aafdb4`)

| Piece | Location | After #671 |
|---|---|---|
| Entity `AgentRunMeasurement` `954de789-6350-4f54-a809-5f2b8b91d067` | `miroir-app-miroir/assets/miroir_model/16dbfe28-…/`; `index.ts` export `entityAgentRunMeasurement`; `src/Model.ts` (Miroir entities list, lazy-entity list); core `Model.ts` `devDataEntityDefinitions` | `agentRuns_model/16dbfe28-…/` |
| Report `AgentRunHistory` `7a695632-338e-4c33-8b39-dba7f6d4c988`, Report `AgentRunMeasurementDetails` `49a3c09a-c7cd-4438-9730-c691c70741af` | `miroir_data/3f2baa83-…/`; `index.ts`; `src/Model.ts` (reports); core `metaModelDevDataReports` | `agentRuns_model/3f2baa83-…/` |
| MiroirTest `report.agentRunHistory` `ed680b8e-ae0b-40a8-873d-92d92c7191e5` | `miroir_data/a311f363-…/`; seeds in `miroir-standalone-app/src/miroir-fwk/4-tests/devDataTestSeeds.ts` (`agentRunMeasurementSeed` in TestConfiguration `8b8dfbd9-…`, shared with `report.bundleSizeHistory`); nonreg step `integ-report.agentRunHistory` | deleted (D7) |
| Menu item "Agent runs" | Miroir menu `miroir_data/dde4c883-…/eaac459c-….json`, group "Dev data" | AgentRuns menu |
| 24 pilot rows | `miroir_devData/954de789-…/` | `agentRuns_data/954de789-…/` (`git mv`) |
| Recorder | `miroir-app-miroir/scripts/devData/{recordAgentRun,agentRunHistory}.ts`, npm script `agent-run:record -w miroir-app-miroir`; called by `scripts/agent_bench/batch.py` | D8 |
| Tests naming the uuids | `miroir-app-miroir/tests/devData/{agentRunRecord,devDataLayout}.unit.test.ts`, `miroir-core/tests/1_core/{devDataReports,cacheRefreshPolicy}.unit.test.ts`, `miroir-standalone-app/tests/4_view/reportTestLauncher.unit.test.ts` | updated |
| Docs | `docs/reference/data-architecture-deployments.md`, `docs/reference/testing.md`, `docs/reference/environments.md`, #550 `results.md` | updated |

`applicationAssetsDirectory(applicationKey, application, section, packagesDirectory)` (`Environment.ts`) builds `<packagesDirectory>/<package>/assets/<prefix>_<section>`; its five callers (`sectionDirectory` in `Environment.ts`, `adminRows.ts`, `environmentState.ts`, `openEnvironment.ts`, `stateCommands.ts`) pass the environment's `packagesDirectory` and spread the application. The application schema `miroirEnvironmentApplication` has no `packagesDirectory`.

## 5. Reuse

| Piece | Location |
|---|---|
| Former Meta application rows (SelfApplication, ModelBranch, Menu shape) | `git show 3dfd874^:packages/miroir-app-meta/assets/meta_model/…` |
| MiroirTest `fn.environment.deriveDeployments` (`7f14228c-…`) | `miroir_data/a311f363-…/` — gets the D2 case |
| Boot of a DomainController from an environment | `packages/miroir-env/tests/bootTestSupport.ts` |

Implementation plan: [tdd-implementation-plan.md](tdd-implementation-plan.md).
