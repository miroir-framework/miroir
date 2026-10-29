# 550 — Measure what building with coding agents costs on Miroir

> The same coding agent builds the same two Library features in three ways: Miroir through MCP tools
> only, Miroir through direct edits of the deployment files, and conventional code. Each run is
> measured (tokens, list cost, time, turns, hidden acceptance tests) and recorded as an instance of
> `miroir-app-meta`, shown by a Report. The numbers decide whether #549 states the efficiency claim.

Related issue: https://github.com/miroir-framework/miroir/issues/550
Consumers of the result: [#549 positioning docs](https://github.com/miroir-framework/miroir/issues/549) (efficiency line, slice 1 and 9), [#551 app-developer skills](https://github.com/miroir-framework/miroir/issues/551) (a fourth arm once it lands)
Pattern followed: [#473 bundle size history](../473-FEATURE-bundle-size-history/analysis.md) ✅ (Entity, record script and Report in `miroir-app-meta`)
Key sources: [`recordBundleSize.ts`](../../../packages/miroir-app-meta/scripts/recordBundleSize.ts) · [`bundleSizeHistory.ts`](../../../packages/miroir-app-meta/src/bundleSizeHistory.ts) · [`mcpServer.ts`](../../../packages/miroir-mcp/src/mcpServer.ts) · [`environments/test-filesystem.json`](../../../environments/test-filesystem.json) · [Library Lending Endpoint](../../../packages/miroir-example-library/assets/library_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/212f2784-5b68-43b2-8ee0-89b1c6fdd0de.json) · [`environments.md`](../../../docs/reference/environments.md)
Grilling: round 1 (Q1 to Q9) in the project folder, `issue-550/grilling-round-1.md`; A accepted every recommended option on 2026-10-24.

**Document role:** analysis and decision record.
**Status:** D1 to D9 are A's answers to grilling round 1. D10 to D18 settle the round 2 points (task contracts, how the MCP arm runs, isolation, harness language) with defaults chosen by Claude on 2026-10-24, open to A's review with this document.

---

## 1. Goals

| Id | Story |
|---|---|
| G1 | **Know whether the claim holds.** In order to state, or drop, "agents spend fewer tokens and less time on Miroir" in the README and the home page, as a Miroir maintainer, I can read the tokens, list cost, time and turns that the same agent spent on the same features in Miroir and in conventional code, over several runs. |
| G2 | **Know whether MCP-only is practical.** In order to decide whether agents should change applications only through MCP (the goal set in #549), as a Miroir maintainer, I can compare the MCP-only runs with the file-edit runs on the same features. |
| G3 | **Know what UUIDs cost.** In order to decide whether agent tools should accept names where they now take UUIDs, as a Miroir maintainer, I can read the share of the agent's tool traffic that UUIDs take. |
| G4 | **Count only working results.** In order to compare cost for the same outcome, as a Miroir maintainer, I see for every run whether hidden acceptance tests, written before the runs and identical in scenario across arms, passed. |
| G5 | **Rerun and extend.** In order to rerun the benchmark after a Miroir change, or add the arm with the #551 skills, as a Miroir contributor, I run one command per run and one command to record it, from the repository. |

## 2. Non-goals

| Excluded | Owner |
|---|---|
| An arm with the app-developer skills | #551, then a rerun with this harness (D7) |
| Other models (Haiku, Opus) or other agents (Cursor, the in-app agent of `miroir-ai`) | later, only if the Sonnet results are close (D3) |
| Exact token counts of UUIDs (token-counting API) | later, only if the character share is high (D9) |
| Names instead of UUIDs in MCP tools | follow-up issue, filed only if G3 calls for it |
| Writing the efficiency line in the README, the home page, the blog | #549 slices 1 and 9, reading this issue's docs page |
| Running the benchmark in CI | not planned: each run costs money (D2) |

## 3. Decision record

### A's decisions (grilling round 1, 2026-10-24)

| Id | Decision | Rejected | Serves |
|---|---|---|---|
| D1 | Headless Claude Code (`claude -p`) runs every arm; only the tools change between arms. | the in-app agent (MCP only, cannot write conventional code); Cursor | G1, G2 |
| D2 | Runs start from cloud sessions on A's account. Pilot first, its cost reported before the remaining runs. A run stops at a fixed number of turns. | an API key with a cap; runs on A's machine | G1 |
| D3 | One model, Sonnet 5.5 (`claude-sonnet-5-5`), with a fixed effort level. | two models; Opus | G1 |
| D4 | Two features: overdue loans (read side) and a lending limit (write side with a rule). If Miroir cannot express the lending limit, that is a result, filed as its own issue, and the runs use the first feature only. | read side only; write side only | G1, G4 |
| D5 | Conventional arm: Next.js with Prisma on SQLite, and Vitest, starting from the Library schema and data already built in that stack (not measured). | Express and React; Django | G1 |
| D6 | Hidden acceptance tests, same scenarios in each arm, written before any run, run after the agent stops. A run counts only when they pass; failed runs are recorded too. | the agent's own tests; human review | G4 |
| D7 | Each arm gets the same task prompt and a one-page AGENTS.md about its stack and tools. No skills. | the contributor skills `miroir-edit-*`; the prompt alone | G1, G2 |
| D8 | Runs recorded as `AgentRunMeasurement` instances in `miroir-app-meta`, by a record script like `bundle-size:record`, with a Report. Raw transcripts stay out of git, in the project folder. | transcripts in git; a docs table only | G1, G5 |
| D9 | UUID share measured as the characters UUIDs take in the tool inputs and outputs of each transcript. | an API key for token counting; skip the question | G3 |

### Round 2 defaults (Claude, 2026-10-24)

**D10 Number of runs.** Q2 said 18 runs (1 + 5 per arm) when one feature was assumed; Q4 added a second feature. Each run builds one feature from the baseline, so the count is per feature.

| Option | Runs | Pros | Cons |
|---|---|---|---|
| A. One run builds both features in one session | 18 | cheaper | the second feature inherits the first one's context; no per-feature numbers |
| **B. One run per feature, each from the baseline** | pilot 6, then 30, so 36 | per-feature numbers; runs independent | twice the cost |

**Accepted: B.** If D4 drops the lending limit, B is 18 runs, as in Q2.

**D11 Feature contracts.** Hidden tests need names to call. The task prompt gives the contract; the acceptance tests check behavior through it.

| Feature | Miroir arms | Conventional arm |
|---|---|---|
| 1. Overdue loans | Library Query named `OverdueLoans`, parameter `startedBefore` (ISO date), result entry `overdueLoans`: the LendingHistoryItem instances with no `endDate` whose `startDate` is before `startedBefore`. A Report `OverdueLoansPerUser` shows them per User. A MiroirTest of the Query. | `GET /api/loans/overdue?startedBefore=…` returns the same loans as JSON, with their `uuid`; page `/loans/overdue` shows them per User. A Vitest test. |
| 2. Lending limit | `lendDocument` (Endpoint Lending) refuses the loan, and creates no LendingHistoryItem, when the User already holds 8 loans with no `endDate`. A test of the refusal. | `POST /api/loans` answers 409 and creates no row in the same case. A Vitest test. |

The fixed date makes the expected results stable: with `startedBefore` 2026-07-02, the Library data has 21 overdue loans over all 5 Users (§4.3).

A's change of 2026-10-24 (decision card): the first contract was "more than `overdueDays` days before `asOf`". The slice 4 dry run found no date arithmetic among Miroir's 52 TransformerDefinitions (`numericOp` has `-`, `*`, `/`; dates are ISO strings), while `boolExpr` `<` compares ISO strings. Every arm now gets the cutoff date; a date transformer gets its own issue. The limit of 8 splits the Users: Laurence Jambois holds 9 open loans, Pierre Martin, François Dupont and Jeanne Dielman 8, Marie Martin 7.

**D12 One scenario set, one adapter per arm.** The acceptance scenarios are written once, in Python, and call each arm through a small adapter: the Miroir adapter runs the agent's Query and `lendDocument` on a fresh `miroir-server` started on the run's store; the conventional adapter calls the HTTP routes of the agent's app. The expected results are computed from the Library data by the scenarios themselves, not copied. Each scenario must fail on the baseline and pass on a reference solution written for each arm before the runs (the dry run of D4 produces the Miroir ones).

| Option | Pros | Cons |
|---|---|---|
| **A. One Python scenario set, an adapter per arm** | same scenarios by construction; no test framework in the agent's workspace | an adapter per arm to maintain |
| B. A test suite per arm in its own stack (MiroirTest, Vitest) | native tests | the "same scenarios" rule holds only by review |

**Accepted: A.**

**D13 How the Miroir arms run.** `miroir-server` (release build) with the `bench-agent` environment (`environments/bench-agent.json`, extends `test-filesystem`, MCP on at `http://localhost:4080/mcp`, every section a copy in `.miroir/bench-agent/`), started with `--disable-auth`, so the agent needs no login. The desktop app does not run in the container.

| Arm | Tools given to the agent | Working directory |
|---|---|---|
| `miroir-mcp` | the Miroir MCP tools only (`--strict-mcp-config`), no file or shell tool | an empty folder with the arm's AGENTS.md |
| `miroir-files` | Read, Edit, Write, Glob, Grep, Bash; no MCP | a copy of the Library deployment (model and data) and of the Miroir meta-model files, read only, with a `check` command that validates the JSON files against their Entity schemas |
| `conventional` | Read, Edit, Write, Glob, Grep, Bash | a copy of the conventional baseline, dependencies installed |

For `miroir-files`, the run's Library copy is put back into `.miroir/bench-agent/library/` before the acceptance server starts, so the server reads the agent's edits on start (no store watches files, `miroir-store-filesystem`).

**D14 Isolation.** Every workspace is a fresh folder outside the repository, so Claude Code loads neither the repository's CLAUDE.md nor its skills. Settings come from the run only (`--setting-sources` limited to the run, `--strict-mcp-config`). The runner reads the `init` event of the transcript (tools, MCP servers, skills, model) and marks the run invalid when anything outside the arm's set is present. It also marks invalid a run whose transcript reads a path of the harness, the reference solutions or the acceptance tests.

**D15 Limits and settings.** `--model claude-sonnet-5-5`, `--effort medium`, `--max-turns 80`, `--max-budget-usd 5` per run, `--output-format stream-json --verbose` for the full transcript. Amended after the slice 1 probe: the MCP arm also gets the `ToolSearch` tool, as Claude Code does by default on the first-party API, because the 47 Miroir tool schemas weigh about 314k tokens when loaded up front (the probe cost $1.31 without it, $0.047 with it). A run that hits a limit is recorded with its stop reason and fails acceptance unless the tests pass anyway.

**D16 Harness language.** The runner, the acceptance scenarios, the UUID share and the isolation checks are Python under `scripts/agent_bench/`, tested by `scripts/tests/` (repo rule for ad-hoc scripts; the PR gate runs these tests). The record script is TypeScript in `miroir-app-meta` (`npm run agent-run:record`), as `bundle-size:record` (#473 D12), because it imports `miroir-core` to build and validate the instance. The conventional baseline is a Next.js app under `benchmarks/conventional-library/`, outside the npm workspaces (`packages/*`).

**D17 Entity attributes.** `AgentRunMeasurement`: `arm`, `feature`, `runIndex`, `pilot`, `model`, `effort`, `startedAt`, `durationMs`, `apiDurationMs`, `turns`, `stopReason`, `inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheCreationTokens`, `costUsd` (list price, as Claude Code reports it), `toolCalls`, `uuidCharShare`, `acceptancePassed`, `acceptanceScenariosPassed`, `acceptanceScenariosTotal`, `valid`, `invalidReason`, `transcript` (path in the project folder), `taskHash` (hash of the prompt and AGENTS.md), `claudeCodeVersion`, `gitCommit`, `gitBranch`, `miroirVersion`. The Report shows, per feature and arm, the runs and their medians.

**D18 Tests run at acceptance** (revised 2026-10-27, after #554 and #575). Acceptance runs the tests the agent added or changed that name the feature: through `runMiroirTestAction` (#575) on both Miroir arms, on a throwaway copy of the Library, and with `vitest run` on the conventional arm, before the lending scenarios read who holds what. The check passes when every such test passes and at least one case ran. The MCP arm runs its tests with `runMiroirTestAction`; the files arm still cannot run them. The reference MiroirTests now check the Library data (21 overdue loans before 2026-07-02; Marie Martin's loan accepted, Jeanne Dielman's refused through `mcpLendDocument`), and the references of all three arms pass. Earlier version: the tests were checked for presence only, because `actionTest` MiroirTests passed whatever their assertions found (#554).

## 4. Current state

### 4.1 Headless Claude Code in the container (spike, 2026-10-24)

- `claude` 2.1.310 is installed. `claude -p --output-format json` reports `usage` (input, output, cache read and cache creation tokens), `total_cost_usd`, `duration_ms`, `duration_api_ms`, `num_turns` and `modelUsage`. The CLI has `--max-turns`, `--max-budget-usd`, `--effort`, `--allowedTools`, `--disallowedTools`, `--mcp-config`, `--strict-mcp-config`, `--setting-sources`.
- A one-word answer cost $0.048 at list price, almost all of it a cached system prompt of 37,600 tokens. That prompt includes this session's own plugins and skills, which D14 removes from benchmark runs.
- `miroir-server` started with `MIROIR_ENV=bench-agent NODE_ENV=development node packages/miroir-server/release/index.js --disable-auth` serves 47 MCP tools at `http://localhost:4080/mcp`. An agent given only that server (`{"mcpServers":{"miroir":{"type":"http","url":"http://localhost:4080/mcp"}}}`) counted the 48 Books of the Library with `Miroir_getInstances`, in 3 turns, 7.2 s, $0.038.
- The 47 tools: `Library_lendDocument`, `Library_returnDocument`, the CRUD tools (`createInstance`, `getInstance`, `getInstances`, `updateInstance`, `deleteInstance`, `deleteInstanceWithCascade`, and the `LocalPersistenceAction_*` and `RestPersistenceAction_*` variants), model tools (`createEntity`, `dropEntity`, `renameEntity`, `alterEntityAttribute`, `entity_DuplicateAttribute`, `initModel`, `resetModel`, `resetData`, `commit`, `rollback`, `undo`, `redo`, `freezeApplicationVersion`), query tools (`runBoxedQueryAction`, `runBoxedQueryTemplateAction`, `compositeRunBoxedQueryAction`, `compositeRunBoxedQueryTemplateAction`), `compositeActionSequence`, `compositeRunTestAssertion`, `transactionalInstanceAction`, `loadNewInstancesInLocalCache`, `remoteLocalCacheRollback`, five `storeManagementAction_*`, and the external service tools (`connectExternalService`, `probeExternalService`, `setExternalServiceCredential`, `prepareOpenApiDocument`).
- npm registry and `binaries.prisma.sh` answer through the proxy, so the conventional baseline can install Next.js and Prisma in the container (to confirm with a real `prisma generate`).

### 4.2 Library model (`packages/miroir-example-library/assets/library_model/`)

| Kind | Instances (uuid prefix) |
|---|---|
| Entity | Author `d7a144ff`, Country `d3139a6d`, Book `e8ba151b`, User `ca794e28`, LendingHistoryItem `e81078f3`, Publisher `a027c379` |
| Endpoint | Lending `212f2784`, Books `9884c1a4` |
| Query | BooksByCountryCount, BookCountByPublisher, BooksByAuthorCount, AuthorsCountByCountry |
| Report | 16, among them LendingHistory `cee26a1e`, UserDetails `8adee3d5`, LibraryHome `9c0cdb97` |
| Runner | lendDocument, mcpLendDocument, returnDocument |
| MiroirTest | report.bookDetails, runner.mcp.lendDocument, report.queryDetails, action.scenario.multistepReportTemplate, runner.lendDocument, runner.returnDocument |

Application `5af03c98-fe5e-490b-b08f-e1230971c57f`, deployment `f714bb2f-a12d-4e71-a03b-74dcedea6eb4`. LendingHistoryItem attributes: `user`, `book`, `startDate`, `endDate`, `note`.

`lendDocument` and `returnDocument` are `compositeActionSequence`s that create a LendingHistoryItem; neither checks a condition. No action type in a composite sequence branches or refuses (searched for `if`, `branch`, `fail`, `guard`). TransformerDefinitions that a condition could use exist (`ifThenElse`, `case`, `boolExpr`, `filterList`, `listLength`, `aggregate`, `currentDate`), but nothing makes an action fail on a transformer's result. So feature 2 may need a framework change; the dry run (D4) answers it.

### 4.3 Library data, enumerated

- 60 LendingHistoryItems, 40 with no `endDate`. Open loans start between 2025-06-01 and 2026-07-20, with dates written `2024-09-08T00:00:00.000Z`.
- 5 Users. Open loans per User: Laurence Jambois 9, Pierre Martin 8, François Dupont 8, Jeanne Dielman 8, Marie Martin 7.
- Overdue with `startedBefore` 2026-07-02: 21 loans (Jeanne Dielman 5, Laurence Jambois 5, François Dupont 4, Pierre Martin 4, Marie Martin 3). Twenty open loans start in July 2026, one per day from the 1st to the 20th, so the boundary is tested: the loan of July 1 is overdue and the loan of July 2 is not.

### 4.4 `miroir-app-meta` (#473)

One Entity, `BundleSizeMeasurement` (`90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b`), 21 tracked instances in `assets/meta_data/90d603f9-…/`, Reports `BundleSizeHistory` (`e8c6faa5-…`) and `BundleSizeMeasurementDetails` (`85077493-…`), MiroirTest `report.bundleSizeHistory` (`d13c9b9e-…`), Menu `MetaMenu` (`c95bfb70-…`). The record script `scripts/recordBundleSize.ts` builds the instance with `measurementFromReport` and writes it with `writeMeasurement` (`src/bundleSizeHistory.ts`); vitest tests `bundleSizeRecord.unit.test.ts` run it through its command line; `modelValidation.unit.test.ts` validates every instance.

### 4.5 Misaligned with the target

| Fact | Effect |
|---|---|
| The `bench-agent` environment exists only in the working tree of this branch | committed with the plan |
| No action in Miroir can refuse on a condition (§4.2) | feature 2 may be a result rather than a run (D4) |
| AGENTS.md says the default branch is `main`; it is `master` | harness records `gitBranch` as git reports it; the fix belongs to #549 slice 8 |

## 5. Key reuse

| Piece | Location |
|---|---|
| Record script pattern, instance writer, git and version helpers | [`recordBundleSize.ts`](../../../packages/miroir-app-meta/scripts/recordBundleSize.ts), [`bundleSizeHistory.ts`](../../../packages/miroir-app-meta/src/bundleSizeHistory.ts) |
| History Report with a line graph and its MiroirTest | `BundleSizeHistory` `e8c6faa5-…`, `report.bundleSizeHistory` `d13c9b9e-…` |
| Instance validation of the package | [`modelValidation.unit.test.ts`](../../../packages/miroir-app-meta/tests/modelValidation.unit.test.ts) |
| MCP served by `miroir-server`, one tool per Endpoint action | `miroir-mcp` `EndpointToolRegistry`; MiroirTest `runner.mcp.lendDocument` (`a6fc85c8`) |
| Test environment with copied sections | `environments/test-filesystem.json`, extended by `environments/bench-agent.json` |
| Library schema and data, source of the conventional baseline's seed | `packages/miroir-example-library/assets/library_data/` |

## 6. Allocated UUIDs

| Element | uuid |
|---|---|
| Entity `AgentRunMeasurement` | `954de789-6350-4f54-a809-5f2b8b91d067` |
| Report `AgentRunHistory` | `7a695632-338e-4c33-8b39-dba7f6d4c988` |
| Report `AgentRunMeasurementDetails` | `49a3c09a-c7cd-4438-9730-c691c70741af` |
| MiroirTest `report.agentRunHistory` | `ed680b8e-ae0b-40a8-873d-92d92c7191e5` |
| Reference Query `OverdueLoans` (reference solution only, never in the Library package) | `62f9e6fa-35c1-4ce1-9d98-8c6aeb835e8c` |
| Reference Report `OverdueLoansPerUser` (same) | `eb4f9e2d-bf0e-4ba9-85a4-82ccaebd2804` |

Implementation slices: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).
