# Issue #550 — TDD Implementation Plan

> Integration first, no mocks. The harness (runner, acceptance scenarios, transcript analysis) is Python
> under `scripts/agent_bench/`, tested with pytest in `scripts/tests/` on recorded transcripts and on the
> real Library data; no test calls the paid agent. Acceptance scenarios run against a real `miroir-server`
> on the `bench-agent` environment and against the real Next.js app of the conventional arm, and each is
> proven to fail on the baseline and pass on a reference solution. The record side follows #473: a
> TypeScript script in `miroir-app-meta` tested with vitest through its command line, the Entity and its
> instances proven by `modelValidation`, the Report by a Report MiroirTest on `emulatedServer-filesystem`.
> Paid runs happen only in slices 9 and 10, and slice 10 waits for A's go after the pilot.

**Resume note:** update the progress table and each slice's Status / Realization as slices land.

## Scope

In: G1 (know whether the claim holds), G2 (know whether MCP-only is practical), G3 (know what UUIDs cost), G4 (count only working results), G5 (rerun and extend), per [`analysis.md`](./analysis.md).

Out: the arm with app-developer skills (#551, rerun later); other models and agents; exact UUID token counts; names instead of UUIDs in MCP tools (follow-up issue only if G3 calls for it); the efficiency line in the README, home page and blog (#549); running the benchmark in CI.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/550
- Analysis: [`analysis.md`](./analysis.md)
- Pattern: [`../473-FEATURE-bundle-size-history/tdd-implementation-plan.md`](../473-FEATURE-bundle-size-history/tdd-implementation-plan.md)
- Branch: `claude/550-agent-cost-measurement` (from `_integration` 426e1ca)

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Task contracts, arm AGENTS.md files, `bench-agent` environment | ✅ done | `test_agent_bench_contracts.py`, `miroir-env check --strict` |
| 1 | One harness command runs an isolated agent and writes a run summary (tracer) | ✅ done | `test_agent_bench_run.py`, one live probe run |
| 2 | A run summary becomes a valid `AgentRunMeasurement` instance | ✅ done | `agentRunRecord.unit.test.ts`, `modelValidation` |
| 3 | The Meta app shows the runs per feature and arm | ✅ done | MiroirTest `report.agentRunHistory` |
| 4 | Overdue loans: Miroir acceptance fails on the baseline, passes on the reference | ⬜ pending | `acceptance --arm miroir-mcp --feature overdue-loans` |
| 5 | Lending limit in Miroir: reference and acceptance, or a recorded result | ⬜ pending | acceptance, or a filed issue |
| 6 | The `miroir-files` arm: workspace, `check` command, edits read on start | ⬜ pending | acceptance through the files path |
| 7 | Conventional baseline and its acceptance | ⬜ pending | acceptance `--arm conventional`, both features |
| 8 | Transcript measures: UUID share, tool calls, contamination | ✅ done | `test_agent_bench_transcript.py` |
| 9 | Pilot: one run per arm and feature, cost reported | ⬜ pending | 6 recorded instances, reply to A |
| 10 | Full runs | ⬜ pending | 30 more recorded instances |
| 11 | Docs page, nonreg steps, decisions, cleanup | ⬜ pending | `npm run nonreg:filesystem -- --runner shared` |

## Locked implementation defaults

| ID | Default | Serves |
|---|---|---|
| D1 | Headless Claude Code (`claude -p`) for every arm; only tools change | G1, G2 |
| D2 | Runs from cloud sessions on A's account; pilot cost reported before the other runs; fixed max turns | G1 |
| D3 | `claude-sonnet-5-5`, fixed effort | G1 |
| D4 | Features overdue loans and lending limit; if Miroir cannot express the limit, record it, file an issue, run feature 1 only | G1, G4 |
| D5 | Conventional arm: Next.js, Prisma on SQLite, Vitest, prebuilt baseline with the Library schema and data | G1 |
| D6 | Hidden acceptance tests, same scenarios per arm, written before any run, run after the agent stops; failed runs recorded | G4 |
| D7 | Same task prompt per feature and a one-page AGENTS.md per arm; no skills | G1, G2 |
| D8 | `AgentRunMeasurement` in `miroir-app-meta`, record script, Report; transcripts in the project folder, not in git | G1, G5 |
| D9 | UUID share as characters in tool inputs and outputs | G3 |
| D10 | One run per feature from the baseline: pilot 6 runs, then 30 (18 and 15 if D4 drops feature 2) | G1 |
| D11 | Contracts: Query `OverdueLoans` (`startedBefore`, result `overdueLoans`; changed by A from `asOf` and `overdueDays` after the slice 4 dry run), Report `OverdueLoansPerUser`; `lendDocument` refuses at 8 open loans; conventional `GET /api/loans/overdue`, page `/loans/overdue`, `POST /api/loans` answers 409 | G4 |
| D12 | One Python scenario set, an adapter per arm; expectations computed from the Library data; each scenario fails on the baseline and passes on a reference | G4 |
| D13 | `miroir-server` release build, `bench-agent` environment, `--disable-auth`; arm tools and workspaces per analysis §3 D13 | G1, G2 |
| D14 | Workspaces outside the repository; run-only settings; `init` event and path checks mark a run invalid | G1, G4 |
| D15 | `--effort medium`, `--max-turns 80`, `--max-budget-usd 5`, `--output-format stream-json --verbose`; the MCP arm also gets `ToolSearch` (slice 1) | G1 |
| D16 | Harness in Python (`scripts/agent_bench/`), record script in TypeScript (`npm run agent-run:record -w miroir-app-meta`), conventional baseline in `benchmarks/conventional-library/` outside the workspaces | G5 |
| D17 | Entity attributes per analysis §3 D17 | G1, G3, G4 |

## Allocated UUIDs / keys

| Element | uuid / key |
|---|---|
| Entity `AgentRunMeasurement` | `954de789-6350-4f54-a809-5f2b8b91d067` |
| Report `AgentRunHistory` | `7a695632-338e-4c33-8b39-dba7f6d4c988` |
| Report `AgentRunMeasurementDetails` | `49a3c09a-c7cd-4438-9730-c691c70741af` |
| MiroirTest `report.agentRunHistory` | `ed680b8e-ae0b-40a8-873d-92d92c7191e5` |
| Reference Query `OverdueLoans` (reference only) | `62f9e6fa-35c1-4ce1-9d98-8c6aeb835e8c` |
| Reference Report `OverdueLoansPerUser` (reference only) | `eb4f9e2d-bf0e-4ba9-85a4-82ccaebd2804` |
| Suite key | `report.agentRunHistory` |
| npm script | `agent-run:record` (`miroir-app-meta`) |
| Arm keys | `miroir-mcp`, `miroir-files`, `conventional` |
| Feature keys | `overdue-loans`, `lending-limit` |

## Layout

```
scripts/agent_bench/
  run.py                 one run: workspace, agent, acceptance, run summary
  acceptance/            scenarios.py (shared), adapter_miroir.py, adapter_conventional.py
  transcript.py          measures, UUID share, isolation checks
  tasks/<feature>.md     the task prompt, same for every arm
  arms/<arm>/AGENTS.md   one page per arm
  arms/<arm>/settings    MCP config and allowed tools per arm
  reference/<arm>/<feature>/   reference solutions (never copied into a workspace)
benchmarks/conventional-library/   Next.js + Prisma + SQLite baseline, its own package.json
environments/bench-agent.json
packages/miroir-app-meta/          Entity, Reports, MiroirTest, scripts/recordAgentRun.ts
<project folder>/issue-550/runs/<runId>/   transcript.jsonl, run.json, acceptance.json (out of git)
```

## Test execution conventions

| What | Command |
|---|---|
| Harness tests | `python -m pytest scripts/tests -q -k agent_bench` |
| Record script | `npm run testByFile -w miroir-app-meta -- agentRunRecord.unit` |
| Meta instances | `npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts` |
| Report MiroirTest | `npm run testMiroir -w miroir-standalone-app -- --suites report.agentRunHistory --mode integration --profile emulatedServer-filesystem` |
| Rebuild after meta assets change | `npm run build -w miroir-app-meta` |
| Server for Miroir acceptance | `npm run build:server -w miroir-server`, then the runner starts it with `MIROIR_ENV=bench-agent` |
| Acceptance by hand | `python scripts/agent_bench/acceptance --arm <arm> --feature <feature> --workspace <dir>` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/miroir-app-meta/tsconfig.json` |
| Environment check | `npm run miroir-env -- check --strict --tracked-clean` |

---

## Slice 0: task contracts, arm AGENTS.md files, `bench-agent` environment

**Status:** ✅ DONE

### Goal

The contracts of D11 exist as files an agent will read (two task prompts, three AGENTS.md pages), and the Library facts the scenarios rely on are locked by a test, so a change to the Library data cannot silently change the expected results.

### RED

`scripts/tests/test_agent_bench_contracts.py`:
- `overdue_loans(started_before="2026-07-02")` computed from `library_data/e81078f3-…` returns 21 loans over 5 Users; the loan started 2026-07-01 is in it, the one started 2026-07-02 is not.
- `open_loans_per_user()` gives 9, 8, 8, 8, 7 (Laurence Jambois, Pierre Martin, François Dupont, Jeanne Dielman, Marie Martin).
- Every task prompt names the contract identifiers of D11 (`OverdueLoans`, `startedBefore`, `overdueLoans`, `OverdueLoansPerUser`, `/api/loans/overdue`, the limit 8).
- Every AGENTS.md is at most 60 lines and names no path under `scripts/agent_bench/`, `reference/` or `acceptance/`.

### GREEN

- `scripts/agent_bench/acceptance/scenarios.py`: the expectation functions, reading the Library data files.
- `tasks/overdue-loans.md`, `tasks/lending-limit.md`: one prompt each, stack-neutral, with the contract of each arm in a short table.
- `arms/miroir-mcp/AGENTS.md`, `arms/miroir-files/AGENTS.md`, `arms/conventional/AGENTS.md`.
- Commit `environments/bench-agent.json` (already in the working tree).

### Refactor checkpoint

The data-reading helpers must be the ones the scenarios use in slices 4 to 7, not a copy for the test.

### Validation

```bash
python -m pytest scripts/tests -q -k agent_bench
npm run miroir-env -- check --strict --tracked-clean
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

- `scripts/agent_bench/acceptance/scenarios.py` (expectations from the Library data), `task.py` (a task file holds the shared description and one `## Contract` per group of arms; an arm's prompt is the description plus its contract only; `task_hash` covers prompt and AGENTS.md), `tasks/{overdue-loans,lending-limit,probe}.md`, `arms/<arm>/AGENTS.md` (25 to 42 lines).
- `scripts/tests/test_agent_bench_contracts.py`, 19 tests.
- Deviation: the first claim "the 20 July loans are not overdue" was wrong; one loan per day from July 1 to 20, so the test now locks the boundary (July 1 in, July 2 out).
- Deviation (A, 2026-10-24): overdue loans take `startedBefore` instead of `asOf` and `overdueDays` (no date arithmetic in Miroir, see slice 4).
- The scoped nonreg first ran on stale `dist/` and `node_modules` (built 2026-10-06, `@dnd-kit/core` missing): `npm ci` then `./build-all.sh`. `unit-check-ml-nomenclature` fails on the base branch too (`docs/tutorials/libraryTutorial/bundles-2026-05/library-model.json:2288: jzodSchemas`).

---

## Slice 1: one harness command runs an isolated agent and writes a run summary (tracer)

**Status:** ✅ DONE

### Goal

`python scripts/agent_bench/run.py --arm miroir-mcp --feature probe` prepares a fresh workspace outside the repository, resets `.miroir/bench-agent/`, starts `miroir-server`, runs `claude -p` with the arm's settings (D15), saves the transcript to the project folder, stops the server, and writes `run.json` with the measures of D17 that the transcript gives. The `probe` task ("how many Books does the Library hold?") costs a few cents and proves the path.

### RED

`scripts/tests/test_agent_bench_run.py`, on a recorded `stream-json` transcript of the spike (fixture, no paid call):
- the summary carries tokens (input, output, cache read, cache creation), `costUsd`, `durationMs`, `apiDurationMs`, `turns`, `stopReason`, `model`, `claudeCodeVersion`;
- a transcript whose `init` event lists a tool, MCP server or skill outside the arm's set gives `valid: false` with the reason;
- the `claude` command line built for each arm has `--strict-mcp-config`, the arm's allowed and disallowed tools, `--max-turns 80`, `--max-budget-usd 5`, `--effort medium`, `--model claude-sonnet-5-5`, and a working directory outside the repository.

### GREEN

`run.py` and `transcript.py` (measures only). Server start waits for the "MCP endpoint" log line and stops the server by its PID.

### Refactor checkpoint

One function builds the command line per arm from `arms/<arm>/settings`; nothing arm-specific in `run.py` itself.

### Validation

```bash
python -m pytest scripts/tests -q -k agent_bench
npm run build:server -w miroir-server
python scripts/agent_bench/run.py --arm miroir-mcp --task probe   # paid, about $0.05; answer is 48
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

- `run.py`, `transcript.py`, `miroir_server.py`, `arms/<arm>/settings.json`; `scripts/tests/test_agent_bench_run.py` (12 tests) on the recorded probe `fixtures/agent_bench/probe-miroir-mcp.jsonl`.
- Isolation, found by trial: `--bare` refuses the host login, so the child gets a whitelisted environment instead (API, proxy and host-login variables only), plus `--setting-sources project,local`, `--disable-slash-commands`, `--no-session-persistence`, `--strict-mcp-config`. The `init` event then lists no skill, no slash command, only built-in plugins, and the system prompt drops from 37.6k tokens (this session's) to about 3k. The workspace AGENTS.md is loaded by Claude Code itself (checked with a codeword).
- Finding: the 47 Miroir MCP tools weigh 623k characters (about 314k tokens; `compositeActionSequence` 176k characters, `runBoxedQueryTemplateAction` 106k, `runBoxedQueryAction` 49k). Loaded up front, the 2-turn probe cost $1.31. With the `ToolSearch` tool (Claude Code's default with first-party API access; enabled here with `ENABLE_TOOL_SEARCH=true`) schemas load on demand and the probe costs $0.047. D15 amended: the MCP arm gets `ToolSearch`.
- Live probes: 3 runs, all answered 48, all valid.

---

## Slice 2: a run summary becomes a valid `AgentRunMeasurement` instance

**Status:** ✅ DONE

### Goal

`npm run agent-run:record -w miroir-app-meta -- <run.json>` writes one `AgentRunMeasurement` instance in `assets/meta_data/954de789-…/`, valid against the Entity's `mlSchema`.

### RED

`packages/miroir-app-meta/tests/agentRunRecord.unit.test.ts`, through the command line on a copy of the slice 1 `run.json` and a temporary data folder:
- the instance has every attribute of D17 that the summary carries, `gitCommit`, `gitBranch`, `miroirVersion`;
- recording the same `runId` twice writes nothing the second time and says so;
- a summary missing a required measure writes nothing and names the field.

`modelValidation.unit.test.ts` fails first because the Entity does not exist.

### GREEN

Entity `AgentRunMeasurement` (`954de789-…`) in `meta_model/16dbfe28-…/`, `src/agentRunHistory.ts` (instance builder), `scripts/recordAgentRun.ts`, npm script `agent-run:record`. The git and version helpers of `recordBundleSize.ts` move to a shared module if both scripts need them.

### Refactor checkpoint

Shared helpers between `recordBundleSize.ts` and `recordAgentRun.ts` (git, version, instance write) in one module; no copy.

### Validation

```bash
npm run build -w miroir-app-meta
npm run testByFile -w miroir-app-meta -- agentRunRecord.unit
npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-app-meta/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling
```

### Realization

- Entity `AgentRunMeasurement` (`954de789-…`, 30 attributes, D17 plus `runId`), `src/agentRunHistory.ts` (`measurementFromRun`, `missingFields`, `readRuns`, `writeRun`), `scripts/recordAgentRun.ts`, npm script `agent-run:record`, Entity registered in `defaultMetaAppModel` and exported.
- Refactor: `src/repoInfo.ts` (`repoRoot`, `git`, `miroirVersion`, `repoInfo`) now serves `recordBundleSize.ts` too.
- `tests/agentRunRecord.unit.test.ts` (4 tests) on `scripts/tests/fixtures/agent_bench/run.json`; with `bundleSizeRecord.unit` and `modelValidation`: 48 tests pass.

---

## Slice 3: the Meta app shows the runs per feature and arm

**Status:** ✅ DONE

### Goal

From the Meta menu, a maintainer opens `AgentRunHistory`: runs per feature and arm, with cost, tokens, turns, duration and acceptance, and the median per arm. `AgentRunMeasurementDetails` shows one run.

### RED

MiroirTest `report.agentRunHistory` (`ed680b8e-…`) on two fixture instances in the test deployment: the Report renders, lists both runs under their arm, and shows the median cost per arm.

### GREEN

Reports `7a695632-…` and `49a3c09a-…`, Menu entry in `MetaMenu` (`c95bfb70-…`). Medians through the existing `aggregate` transformers, or listed as a gap if no transformer computes a median (then the Report shows means and the docs page computes medians).

### Refactor checkpoint

Reuse the query and section shapes of `BundleSizeHistory`; no new transformer unless the median needs one, and then as its own issue.

### Validation

```bash
npm run build -w miroir-app-meta
npm run testMiroir -w miroir-standalone-app -- --suites report.agentRunHistory --mode integration
npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui
```

### Realization

- Reports `AgentRunHistory` (per feature: bar graph of list cost per run labelled and coloured by arm, then the runs sorted by arm) and `AgentRunMeasurementDetails`; Menu entry "Agent runs"; MiroirTest `report.agentRunHistory` on three seed runs added to the Meta TestConfiguration (`8b8dfbd9-…`).
- Deviation: no median per arm in the Report (no median transformer); the docs page computes medians from the instances.
- `npm run testMiroir -w miroir-standalone-app -- --suites report.agentRunHistory,report.bundleSizeHistory --mode integration --profile emulatedServer-filesystem`: 4 tests pass.

---

## Slice 4: overdue loans, Miroir acceptance fails on the baseline and passes on the reference

**Status:** ✅ DONE

### Goal

The overdue-loans scenarios run against a fresh `miroir-server` on a run's store, through the Miroir adapter. This is also the dry run of feature 1 in Miroir: Claude writes the reference Query and Report by hand, which confirms the contract can be met with today's Miroir.

### RED

`acceptance --arm miroir-mcp --feature overdue-loans` on the baseline store: every scenario fails (no `OverdueLoans` Query). Scenarios:
- started before 2026-07-02: the 21 loans of slice 0, by `uuid` (the July 1 loan in, the July 2 loan out);
- started before 2026-08-01: every open loan;
- a returned loan (with `endDate`) never appears;
- `OverdueLoansPerUser` exists, is valid against the Report schema, and its Query runs.

### GREEN

- `adapter_miroir.py`: starts the server on the store, runs the agent's Query through `runBoxedQueryTemplateAction` with the parameters (a minimal MCP client over HTTP in Python), calls `lendDocument` for slice 5.
- `reference/miroir/overdue-loans/`: Query `62f9e6fa-…`, Report `eb4f9e2d-…`, and a MiroirTest of the Query, applied to a store copy by the acceptance command's `--apply-reference` option.

### Refactor checkpoint

Scenario code shares nothing with the adapter except the adapter interface (`overdue(as_of, days)`, `report_ok()`, `lend(user, book)`, `loans_of(user)`).

### Validation

```bash
python -m pytest scripts/tests -q -k agent_bench
python scripts/agent_bench/acceptance --arm miroir-mcp --feature overdue-loans --workspace <baseline>          # all fail
python scripts/agent_bench/acceptance --arm miroir-mcp --feature overdue-loans --workspace <baseline> --apply-reference   # all pass
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

- `python scripts/agent_bench/acceptance --arm miroir-mcp --feature overdue-loans`: on the baseline, the 5 feature checks fail and the model check passes; with `--apply-reference`, all 6 pass (21 overdue loans on 2026-07-02, 40 on 2026-08-01, the Report's data holds the 21). `--store DIR` takes the copy of `.miroir/bench-agent/library` that `run.py` now saves as `runs/<id>/store/` when the agent stops.
- Checks: the Library model is valid (`acceptance/validate_store.mjs`: each instance against its Entity's `mlSchema`, plus the runtime Zod `query` and `report`, because the `mlSchema` check accepts any object where a template allows a transformer); the three Query scenarios; the Report's own query parts or stored Queries, run with `startedBefore` as page and query parameter, hold exactly the overdue loans in one entry; a Library MiroirTest names `OverdueLoans` (any case) or holds its uuid.
- The MiroirTest is not run by acceptance (D18): the MCP tools cannot run one, and `actionTest` MiroirTests pass whatever their assertions find (#554, found here: the reference test passed with a wrong expected value). The miroir-mcp contract now says the MCP tools cannot run a MiroirTest and to check the Query with `runBoxedQueryTemplateAction`.
- Dry-run findings that an agent will meet too: the extractor result is already a list, and `getObjectValues` on it fails (`filterList: applyTo is not an array`); `getFromContext` on a missing attribute (an open loan's `endDate`) fails and `filterList` silently drops the element unless the reference has `safe: true`; a Report's `runStoredQueries` runs its Query with empty parameters (`ReportHooks.ts:107`), so the reference Report carries its own extractor and transformer and reads `startedBefore` from the page parameters; the `libraryDomainState` fixture of `queryTest` has no loans, so the reference MiroirTest is an integration `actionTest` with three loans in its testbed (7.5k characters, passes with `testMiroir --mode integration --profile emulatedServer-filesystem`).
- MCP fix, second part: values cut by the depth limit lost their `optional` flag, so every transformer's optional `label` became required and every runtime transformer was rejected. `unresolvedMlAny` keeps the flags; `mcpQueryToolPayload.unit.test.ts` gained a nested `filterList` case (red without the fix).
- Issues filed: #554 (actionTest assertions never fail), #555 (date arithmetic transformer).

---

## Slice 5: lending limit in Miroir, reference and acceptance, or a recorded result

**Status:** ✅ DONE

### Goal

Dry run of feature 2 (D4). Either `lendDocument` refuses the ninth open loan with today's Miroir, and the scenarios fail on the baseline and pass on the reference, or it cannot, and that is recorded as a result of #550 with its own issue, and feature 2 leaves the runs.

### RED

`acceptance --arm miroir-mcp --feature lending-limit` on the baseline store fails on:
- lending to Pierre Martin (8 open loans) is refused and creates no LendingHistoryItem;
- lending to Marie Martin (7) succeeds; a second loan to her is then refused.

### GREEN

The reference `lendDocument` in `reference/miroir/lending-limit/`. If no action can fail on a condition (analysis §4.2), stop at the smallest proof that it cannot (the attempted reference and the error), then:
- record it in the analysis (document history) and in this plan's Locked defaults (D10 becomes 18 runs);
- file "FEATURE: an Endpoint action refuses on a condition" in `miroir-framework/miroir`, on Project #2 (A's rule), linked from #550.

### Refactor checkpoint

None in framework code: a framework change for the limit belongs to the new issue, not here.

### Validation

```bash
python scripts/agent_bench/acceptance --arm miroir-mcp --feature lending-limit --workspace <baseline>                      # all fail
python scripts/agent_bench/acceptance --arm miroir-mcp --feature lending-limit --workspace <baseline> --apply-reference   # all pass, or the issue is filed
```

### Realization

- The limit is expressible with today's Miroir, so feature 2 stays in the runs and D10 keeps 36 runs.
- Reference `reference/miroir/lending-limit/`: `lendDocument` first runs a `compositeRunBoxedQueryAction` (the User's loans, extractor filtered on `user`), then `createInstance` with `objects: [ifThenElse(open loans < 8, the loan, null)]`. The null object makes `createInstance` fail, so a refused loan returns `FailedToHandleAction` and creates nothing. Crude, but it meets the contract; #557 asks for a declared refusal.
- `python scripts/agent_bench/acceptance --arm miroir-mcp --feature lending-limit`: on the baseline 6 of 8 checks fail (the model check and the one accepted loan pass); with `--apply-reference` all 8 pass. Who holds how many Books is read from the store at acceptance time, because an MCP agent testing its action lends for real; every User at the limit is refused, then the User holding the fewest gets loans up to 8, each accepted, and one more, refused. The store keeps no trace of refused loans (61 loan files after one accepted loan).
- The MiroirTest check looks for a test added to the Library (not among its own tests, several of which already name `lendDocument`) that names `lendDocument`. The reference test is a renamed copy of `runner.lendDocument`, a placeholder under D18.
- Dry-run findings (#556): a transformer failing inside `createInstance.objects` does not fail the action, and its failure object lands in the local cache as an entity with an undefined id; runtime transformers inside a query step of a sequence are evaluated before the query runs, so the count has to live in the next step.
- The miroir-mcp contract now says the MCP tools cannot run a MiroirTest, as for overdue loans.
- `adapter_miroir.lend` reads the tool's `status`: the MCP tools answer errors as `{"status": "error"}` in the content, without `isError`.

---

## Slice 6: the `miroir-files` arm

**Status:** ⬜ pending

### Goal

`run.py --arm miroir-files` gives the agent a workspace with a copy of the Library deployment and a read-only copy of the meta-model, a `check` command that validates the JSON files against their Entity schemas, and puts the edited Library back into `.miroir/bench-agent/library/` before acceptance, where a fresh server reads it on start.

### RED

- `test_agent_bench_run.py`: the files workspace holds `library/model`, `library/data`, `meta-model/` and `check`, and nothing from `scripts/agent_bench/`.
- `acceptance --arm miroir-files --feature overdue-loans --apply-reference` passes when the reference is applied as file edits in the workspace (not through the store), which proves the copy-back and the read on start.
- `check` on a workspace with an invalid Query names the file and the error.

### GREEN

Workspace preparation in `run.py`; `check` wraps the validation that `modelValidation.unit.test.ts` performs, run on the workspace folder.

### Refactor checkpoint

The Miroir adapter is the same for both Miroir arms; only workspace preparation differs.

### Validation

```bash
python -m pytest scripts/tests -q -k agent_bench
python scripts/agent_bench/acceptance --arm miroir-files --feature overdue-loans --workspace <baseline> --apply-reference
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

_(to fill)_

---

## Slice 7: conventional baseline and its acceptance

**Status:** ⬜ pending

### Goal

`benchmarks/conventional-library/` is a Next.js app with Prisma on SQLite and Vitest, seeded from the Library data with the same uuids, with list pages for the six Entities and the lend and return routes the Library Endpoint has. The conventional adapter runs the same scenarios against it.

### RED

- `acceptance --arm conventional --feature overdue-loans` and `--feature lending-limit` fail on the baseline.
- With `--apply-reference` (`reference/conventional/<feature>/`), both pass.
- The baseline's own Vitest suite passes (seed counts: 48 Books, 60 loans, 5 Users).

### GREEN

The Next.js app, its seed script reading `library_data/`, a lockfile, and `adapter_conventional.py` (builds, starts `next start` on a free port, calls the routes). Workspace preparation copies the app with `node_modules` installed once per session.

### Refactor checkpoint

The app stays out of the npm workspaces; check that `scripts/check_dependency_policy.py` and `npm run lint` ignore `benchmarks/`, or give them an explicit exclusion.

### Validation

```bash
cd benchmarks/conventional-library && npm ci && npx prisma generate && npx vitest run
python scripts/agent_bench/acceptance --arm conventional --feature overdue-loans --workspace <baseline>
python scripts/agent_bench/acceptance --arm conventional --feature overdue-loans --workspace <baseline> --apply-reference
python scripts/check_dependency_policy.py
npm run lint
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

_(to fill)_

---

## Slice 8: transcript measures, UUID share, tool calls, contamination

**Status:** ✅ DONE

### Goal

`run.json` carries `uuidCharShare` (characters of UUIDs over characters of tool inputs and outputs), `toolCalls`, and `valid: false` when the transcript touches a harness, reference or acceptance path.

### RED

`scripts/tests/test_agent_bench_transcript.py`, on small hand-written transcripts:
- a tool call whose input is one UUID of 36 characters out of 72 gives a share of 0.5; text of the assistant's own messages does not count;
- a `Read` of `scripts/agent_bench/reference/...` makes the run invalid with that path;
- tool calls are counted per tool name.

### GREEN

`transcript.py` measures; `run.py` writes them.

### Refactor checkpoint

One transcript reader for slices 1 and 8.

### Validation

```bash
python -m pytest scripts/tests -q -k agent_bench
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

- `transcript.py`: `uuid_char_share` (UUID characters over tool input JSON and tool result text), `tool_call_counts`, `hidden_path_reads` (`agent_bench`, `reference/`, `acceptance/` in a tool input); `run.py` writes `toolCalls`, `toolCallsByName`, `uuidCharShare`, and marks a run with a hidden-path read invalid.
- `scripts/tests/test_agent_bench_transcript.py`, 5 tests.

---

## Slice 9: pilot

**Status:** ⬜ pending

### Goal

One run per arm and feature (6 runs, or 3 if slice 5 dropped feature 2), recorded, and their cost reported to A before any other paid run (D2).

### Steps

- `python scripts/agent_bench/run.py --arm <arm> --feature <feature> --pilot` for each pair, then `npm run agent-run:record -w miroir-app-meta -- <run.json>`.
- Expected cost from the spike: a feature run of 40 to 80 turns on a cached context of 40k to 80k tokens is about $1 to $3 at list price; the cap is $5 per run, so the pilot costs at most $30.
- Reply to A with the cost per run, acceptance results, invalid runs and anything that must change in the prompts or AGENTS.md before the full runs. A change to a prompt or an AGENTS.md changes `taskHash`, and the pilot is rerun.

### Validation

```bash
npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts   # 6 new valid instances
```

### Realization

_(to fill)_

---

## Slice 10: full runs

**Status:** ⬜ pending (waits for A's go after slice 9)

### Goal

Five runs per arm and feature (30 runs, or 15), recorded with the same `taskHash` as the pilot.

### Validation

```bash
npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-standalone-app -- --suites report.agentRunHistory --mode integration
```

### Realization

_(to fill)_

---

## Slice 11: docs page, nonreg steps, decisions, cleanup

**Status:** ⬜ pending

### Goal

A docs page gives the method and the numbers; the decisions the numbers drive are taken.

### Steps

- `docs/reference/agent-cost-benchmark.md`: method (arms, features, contracts, limits, isolation), results per feature and arm (medians and spread of cost, tokens, time, turns; acceptance rate), UUID share, threats to validity (one model, one agent, Library-sized features, list price), how to rerun.
- Nonreg steps: `unit-550-agent-run-record` (vitest of the record script, scopes `tooling`); the pytest tests run in the PR gate already. MiroirTest `report.agentRunHistory` joins the existing Meta report step if one exists, else its own step (scopes `ui`).
- Decisions: a comment on #549 with the result (efficiency claim supported or not); for G3, a follow-up issue on Project #2 if the UUID share justifies it, else a note on the docs page.
- Tracer narrative: from a clean session, `run.py` then `agent-run:record` then the Meta Report shows the run.

### AC checklist

| Acceptance criterion (#550) | Proof |
|---|---|
| analysis.md and tdd-implementation-plan.md in `code-helpers/features/550-FEATURE-agent-cost-measurement/` | this folder |
| The runs of the three arms are recorded in `miroir-app-meta`, with a Report | slices 2, 3, 9, 10; `modelValidation`, `report.agentRunHistory` |
| A docs page gives the method and the numbers; positioning pages cite or drop the claim | `docs/reference/agent-cost-benchmark.md`; comment on #549 |
| A decision on accepting names where agent tools take UUIDs | follow-up issue or docs note (slice 11) |

### Validation

```bash
python -m pytest scripts/tests -q
npm run lint
npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-app-meta/tsconfig.json
npm run nonreg:filesystem -- --runner shared
```

### Realization

_(to fill)_
