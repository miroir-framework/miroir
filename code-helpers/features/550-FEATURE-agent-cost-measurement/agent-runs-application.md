# AgentRuns application (#671)

The runs of the agent cost benchmark (#550), as a Miroir application kept next to the feature that
produces them, outside `packages/`. The filesystem store opens the folders of `assets/` like a package's assets:

| Folder | Holds |
|---|---|
| `assets/agentRuns_model/` | SelfApplication `AgentRuns`, its ModelBranch and Menu, Entity `AgentRunMeasurement`, Reports `AgentRunHistory` and `AgentRunMeasurementDetails` |
| `assets/agentRuns_data/` | one `AgentRunMeasurement` row per recorded run |

- **Open it:** the `dev` environment installs it (`environments/dev.json`, application `agentRuns`, live).
  Start the server and the client as usual, then pick the AgentRuns application.
- **Record a run:** `npm run agent-run:record -- <run.json>` (`scripts/recordAgentRun.ts`), called by
  `scripts/agent_bench/batch.py` after each run.
- **Tests:** `npm run testByFile -w @miroir-framework/env -- agentRunsApplication agentRunRecord`.
- **Typecheck the recorder:** `npx tsc --noEmit -p code-helpers/features/550-FEATURE-agent-cost-measurement/scripts/tsconfig.json` (no CI gate runs it; the tests run it through tsx).
