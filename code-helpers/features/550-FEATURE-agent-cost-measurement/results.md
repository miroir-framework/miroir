# 550 — Results and closure

**Document role:** what the benchmark measured, how to reproduce it, and its limits. #550 was closed on 2026-10-29 after four pilots. The full runs (slice 10) and the docs page (slice 11) were not done: A decided that this comparison is not the way to claim an advantage for Miroir.

## What was measured

The same coding agent built the same two features of the Library example in three arms. The agent was Claude Code headless, with Sonnet 5.5 at medium effort, capped at 80 turns and $5, and billed to a subscription.

- The arms:
  - Miroir through MCP tools only;
  - Miroir through direct edits of the deployment files;
  - conventional code: Next.js, Prisma and Vitest, on the same Library data.
- The features:
  - overdue loans: a query with a cutoff date, a view per User, and a test;
  - lending limit: lending is refused to a User who holds 8 Books, with a test of a refused loan and an accepted one.

Hidden acceptance checks scored each run. They were written before the runs and are the same scenarios in every arm: 6 checks for overdue loans, 8 for lending limit. From the fourth pilot on, they also run the tests the agent wrote, which must pass. Costs are list-price equivalents reported by Claude Code. Each pilot is one run per arm and feature.

### Fourth pilot (2026-10-27), the final state

| Feature | Arm | Acceptance | Cost (list) | Turns | Minutes | Output tokens | Cache read tokens | UUID share |
|---|---|---|---|---|---|---|---|---|
| overdue loans | Miroir, MCP | 6/6 | $1.67 | 33 | 5.0 | 28,708 | 3,938,596 | 18.5% |
| overdue loans | Miroir, files | 5/6 | $1.12 | 48 | 5.2 | 27,720 | 3,630,615 | 13.3% |
| overdue loans | conventional | 6/6 | $0.08 | 5 | 0.9 | 3,668 | 51,358 | 1.7% |
| lending limit | Miroir, MCP | 8/8 | $2.05 | 41 | 10.6 | 80,592 | 4,404,957 | 21.6% |
| lending limit | Miroir, files | 8/8 | $0.90 | 46 | 5.1 | 21,715 | 2,799,365 | 15.2% |
| lending limit | conventional | 8/8 | $0.10 | 10 | 0.8 | 4,130 | 108,308 | 2.8% |

The UUID share is the share of characters that UUIDs take in the agent's tool inputs and outputs (analysis D9).

### Across the four pilots

| Pilot | Date | What changed | Miroir arms' acceptance | Cost of the 6 runs |
|---|---|---|---|---|
| 1 | 2026-10-24 | first run | 11/28 | $6.31 |
| 2 | 2026-10-25 | Miroir fixes #556 to #560 (PR #561) | 26/28 | $4.50 |
| 3 | 2026-10-25 | `Miroir_runReportAction` (#562, PR #563); acceptance checks Reports with it | 28/28 | $4.85 |
| 4 | 2026-10-27 | `Miroir_runMiroirTestAction` (#575, PR #579); acceptance runs the agents' tests | 27/28 | $5.92 |

The conventional arm passed every check in every pilot, at $0.07 to $0.11 a run.

## Conclusions

1. **The efficiency hypothesis is not supported in this setting.** For the same acceptance, the Miroir arms cost 9 to 21 times more than conventional code, and took 6 to 13 times longer. One run per cell cannot measure the spread, but no plausible spread closes that gap.
2. **The cost is reading, not writing.** The Miroir agents re-read 2.8 to 4.4 million cached tokens, against 51 to 108 thousand for conventional code. They learn Miroir in every run, from AGENTS.md, the meta-model and examples. The conventional agent writes Next.js from what it already knows.
3. **MCP-only is practical.** Both MCP runs reached full acceptance. They cost 1.5 to 2.3 times the files arm, but they ran their tests until they passed, which the files arm cannot do. Its one failure, the overdue-loans test, fails when run.
4. **UUIDs take 13 to 22% of the Miroir agents' tool traffic**, against 2 to 3% for conventional code. Names will never replace UUIDs: technical identifiers do not mix with business identifiers. Shortened unique identifiers could be considered in some simple cases; whether they help remains to be established. No follow-up issue is filed.
5. **The pilots were useful as Miroir tests.** Agents working cold hit the defects and gaps addressed in #556 to #560, #562 and #575.
6. **This comparison will not be used to claim an advantage for Miroir.** #549 drops the efficiency claim.

## Limits of the comparison

- **Prior knowledge differs.** The model knows Next.js, Prisma and Vitest from training. It knows Miroir only from what it reads during the run. The benchmark measures a cold start on an unfamiliar platform against a familiar one, not the platforms themselves.
- **The deliverables differ in kind.** A Miroir feature is a Query, a Report and a MiroirTest, or an Endpoint action and a MiroirTest, written as JSON with UUIDs. A conventional feature is a route, a page and a Vitest file. The acceptance checks the same behaviour, not the same artefacts.
- **The arms do not have the same means of checking their work.** The conventional agent runs its app and its tests. The MCP agent runs Queries, Reports and MiroirTests through tools. The files agent can only validate the shape of its files with `./check`.
- **What is scored is narrow.** Only agent cost and time to pass acceptance are measured. Human review time, consistency with the rest of the application, and the cost of later changes are not, nor what the Miroir Report gives beyond a plain page (generic UI, validation, live editing).
- **The view check is loose.** For overdue loans, a Miroir Report passes when one of its data entries holds exactly the overdue loans, whether or not a section displays it. A conventional page passes when it names the expected Users, without checking each Book and start date under them.
- **The scale is the best case for code generation:** two small features on a small application.
- **The sample is small:** one run per cell, one model, one effort level, one agent.
- **The pilots are not comparable with each other.** Between pilots, the task texts, Miroir and the tools changed together.

## How to reproduce

From branch `claude/550-agent-cost-measurement` (the harness, the baseline app and the recorded runs):

1. Setup:
   - run `python scripts/agent_session_setup.py`;
   - run `npm run build:server -w miroir-server`;
   - run `npm ci` in `benchmarks/conventional-library`;
   - log the Claude Code CLI in with the account that pays. The pilots ran on a subscription (`apiKeySource: none` in the transcripts); an `ANTHROPIC_API_KEY` in the environment would be passed on and billed instead.
2. One run per arm and feature: `python scripts/agent_bench/batch.py --pilot --runs-dir <folder>`. Five runs per cell: `python scripts/agent_bench/batch.py --run-indexes 1 2 3 4 5 --runs-dir <folder>`. Each run gets:
   - a folder with `run.json` (the measures), `transcript.jsonl` and `acceptance.json`;
   - what the agent left: `store/` for the Miroir arms; `app/` and `changes.diff` for conventional, from 2026-10-29 on.
3. One run: `python scripts/agent_bench/run.py --arm <miroir-mcp|miroir-files|conventional> --feature <overdue-loans|lending-limit> [--pilot]`. Scoring alone: `python scripts/agent_bench/acceptance --arm <arm> --feature <feature> [--store DIR | --workspace DIR]`. With `--apply-reference`, it scores the reference solutions in `scripts/agent_bench/reference/`.
4. Where the settings live:
   - the tasks, with one contract per arm, are in `scripts/agent_bench/tasks/`;
   - each arm's AGENTS.md and tools are in `scripts/agent_bench/arms/<arm>/`;
   - the model, effort and caps are at the top of `scripts/agent_bench/run.py`.
5. Records: each run is an `AgentRunMeasurement` instance in `miroir-app-meta`, written by `npm run agent-run:record -w miroir-app-meta`. The Meta application's "Agent runs" Report shows them; the 24 pilot runs are recorded. The transcripts of the pilot runs are in the project folder `issue-550/runs/`, not in the repository.

Rerunning the fourth pilot needs Miroir with #575 (PR #579). The earlier pilots ran on earlier Miroir states, so they cannot be reproduced exactly from this branch.
