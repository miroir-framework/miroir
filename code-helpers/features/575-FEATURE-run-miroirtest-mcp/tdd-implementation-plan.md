# #575 Run a MiroirTest through MCP: TDD plan

1. `testbedStorageConfiguration` (`tests/5-tests/issues/575-run-miroirtest/`): a filesystem configuration gets
   sibling directories named after the testbed, sql a schema, mongodb a database, indexedDb a name; an unknown
   store type throws.
2. `handleAction_runMiroirTestAction` on a fake host recording the actions it receives:
   - an unknown MiroirTest fails with `FailedToRunMiroirTest`;
   - a suite of unit leaves runs without creating a testbed;
   - an `actionTest` leaf runs on a testbed created, reseeded and dropped around it, with the live application
     absent from the deployment map it receives and the leaf remapped to the testbed;
   - a leaf that throws is reported as an error and the next leaf still runs; `leaves` selects leaves;
   - a `runnerTest` leaf runs on the testbed without creating or dropping a deployment of its own;
   - a `runnerTest` leaf of an `mcpToolRunner` runs its tool as the testbed's Endpoint action;
   - `reportTest`, `reactComponentTest` and integration `transformerTest` leaves are `unsupported`;
   - the testbed is dropped when a leaf fails.
3. Inventory (`ActionImplementations.unit.test.ts`) and action palette (`fn.blockModel`) list the new action.
4. Live, through MCP on a fresh `bench-agent` store: an agent-written Library `runnerTest` calling
   `lendDocument` through `runner.lendDocument`, one passing and one failing leaf with their expected and actual values, and the
   live `.miroir/bench-agent/library` store byte-identical before and after.
5. Follow-up on #550: the bench task texts say how to run a test, and the acceptance checks that it passes.
