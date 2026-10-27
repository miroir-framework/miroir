# #575 Run a MiroirTest through MCP: analysis

> How an agent working through MCP can run a MiroirTest it wrote, without touching the live data, and what
> the first version supports.

- Issue: https://github.com/miroir-framework/miroir/issues/575
- Prerequisite: #554 (a failed assertion fails its leaf), PR #578
- Motivation: #550, third pilot (`/mnt/project-files/issue-550/pilot-report.md`)
- Sibling: `code-helpers/features/562-FEATURE-run-report-mcp/` (`runReportAction`, the same pattern)

## Problem

In the third #550 pilot, both lending-limit agents wrote a MiroirTest and said they could not run it, and the
overdue-loans files agent wrote 6 `actionTest` leaves that never ran. Only the test CLI (`npm run testMiroir`)
and the app's Miroir Tests page run MiroirTests, and both build their own DomainController stack from a test
profile (`RunnerTestSession`, `uiIntegrationTestLauncher.ts`), which an MCP client has no way to reach.

## Goals

- **G1 Run my test.** In order to know whether the behaviour I built works, as an MCP client (coding agent), I
  can run a MiroirTest of the application, all of it or some of its leaves, and get each leaf's result with
  its assertions' expected and actual values.
- **G2 Keep my data.** In order to keep working on the application after a test run, as an MCP client, I can
  run a test that creates, changes or deletes instances, and the application's data and model are unchanged
  after the run.

Non-goals (v1):
- `runnerTest` leaves of an `mcpToolRunner`: they call an MCP server themselves. They come back `unsupported`.
  Other `runnerTest` leaves run on the testbed (D9), since an `actionTest` cannot call an application's
  Endpoint action: its `compositeActionSequence` is typed with the closed `DomainAction` union, so
  `createInstance` rejects a test row whose sequence holds `lendDocument`.
- `reportTest` and `reactComponentTest` leaves (they need a DOM), and `transformerTest` integration leaves
  (they need the store controller manager): `unsupported`.
- The suite's own declared testbed (`testConfiguration` or inline `testbedModel`): the testbed is a copy of
  the live application. An agent's expected values follow from the data it read (#550 task texts).

## How a test leaf runs today

- `runMiroirTest` (`5_tests/MiroirTestTools.ts`) dispatches on `miroirTestType`; `runMiroirTestSuiteInProcess`
  walks a suite with an `expect`-only vitest stub, as the app does.
- An `actionTest` leaf (`runMiroirActionTest`, `ActionTestTools.ts`) needs a DomainController, an
  `applicationDeploymentMap`, the run target's application uuid, and optionally a `compositeActionTestContext`
  (run target, `testParams`). It remaps the canonical Library uuids to the run target.
- `compositeRunTestAssertion` calls `ConfigurationService.configurationService.testImplementation.expect`. The
  server never registers one (`miroir-server/src/server.ts`), so an assertion fails there today.
- The DomainController records assertion results in its own `miroirContext.miroirActivityTracker`;
  `failedLeafAssertion` (`5_tests/leafAssertions.ts`, #554) reads them back.
- The app's testbed: `createDeploymentCompositeAction` (`1_core/Deployment.ts`) registers Admin Application
  and Deployment rows and creates the store; `resetIntegTestbed` (`5_tests/LibraryPlayfield.ts`) resets and
  seeds it before each leaf; `runTeardownTestApplicationStores`
  (`miroir-standalone-app/src/miroir-fwk/4-tests/testApplicationStoreTeardown.ts`) deletes the store and the
  Admin rows.

## Decision record

| # | Decision | Chosen | Rejected | Goals |
|---|---|---|---|---|
| D1 | Where the leaves run | A throwaway deployment on the server's own DomainController, fresh application and deployment uuids, dropped in `finally` | Running on the live deployment (G2 fails); a second DomainController stack on the server (no core factory for it, doubles the stores open) | G1, G2 |
| D2 | Where the testbed store lives | Beside the live deployment's store, derived from its Admin Deployment row's `configuration` (filesystem: a sibling directory; sql: a schema; mongodb: a database; indexedDb: a name) | A store configuration from the server's composition root (the Deployment row already holds it, and the environment reconciles it at start) | G2 |
| D3 | What the testbed holds | The live model and data, read with storage queries and remapped to the testbed uuids, reseeded before each integration leaf | The suite's declared testbed (does not hold the agent's model changes) | G1 |
| D4 | How leaves reach the testbed | The suite is deep-remapped (live application and deployment uuids to the testbed's); the leaves get a deployment map without the live application, so a missed reference fails instead of writing live data | Remapping `actionTest` leaves only (`remapActionTestLeafForRunTarget` handles the packaged Library only) | G2 |
| D5 | Assertions | `createThrowingExpect` registered as the test implementation when none is; the walk uses it too | The non-throwing `expect` (a failed `toBe("ok")` would not stop the leaf) | G1 |
| D6 | Results | Per leaf: `{ path, type, result: ok, error, skipped or unsupported, assertions, message? }`, read from the tracker after each leaf; a leaf's throw is caught and reported, so one leaf never stops the others | Reading the whole tracker tree once (DomainController and walk record at different paths) | G1 |
| D7 | Failure of the action | `FailedToRunMiroirTest` only when the MiroirTest is not found or the testbed cannot be created or dropped; leaf failures are data | Failing the action on a failed leaf (the agent then loses the other leaves' results) | G1 |
| D8 | Where the code goes | `5_tests/RunMiroirTestAction.ts`, registered from `miroirCoreStartup` through `registerMiroirActionImplementation` (`ActionImplementations.ts`), so layer 3 does not import layer 5 | Layer 3 (it would import the test tools) | G1 |
| D9 | `runnerTest` leaves | Run on the testbed with `skipCreateDeployment` and `skipDropDeployment` forced, the Runner index read from the testbed model, the suite's `testParams` remapped | Unsupported (the agents of the third pilot wrote `runnerTest` leaves, copying `runner.lendDocument`) | G1 |

## Risks

- A crash between create and drop leaves a testbed directory and two Admin rows. They carry the testbed's
  name, and the next run uses fresh uuids.
- Runs share the server's activity tracker: the action serializes its runs and resets the tracker's results
  before each leaf.
- A long suite can outlast the MCP client's timeout.
- On a filesystem store, `deleteStore` removes the testbed's files but not its directories
  (`FileSystemAdminStore.deleteStore` is a no-op), so each run leaves an empty `testbed_<uuid>` directory.
  The Admin rows are removed.
