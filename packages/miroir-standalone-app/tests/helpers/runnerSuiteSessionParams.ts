import { getTestbedUuidsForTestSuite, type MiroirTestSuite } from "miroir-core";

import {
  buildUiIntegrationOrchestratorCreateSessionParams,
  uiIntegrationRunnerSuiteEntryFromDefinition,
} from "../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js";

type BuildParams = Parameters<typeof buildUiIntegrationOrchestratorCreateSessionParams>;

/**
 * Orchestrator session params for one runner/action suite, as the CLI entries build them.
 * Moved unchanged from miroir-runner-tests.integ.test.ts (#318) so the shared entry reuses it.
 */
export function createRunnerSuiteSessionParams(
  suiteKey: string,
  suite: MiroirTestSuite,
  context: BuildParams[1],
  pageLabel: string,
  applicationRunnerUuidIndex: BuildParams[5],
) {
  const registryEntry = uiIntegrationRunnerSuiteEntryFromDefinition(suiteKey, suite);
  if (!registryEntry) {
    throw new Error(`Unknown runner/action suite key: ${suiteKey}`);
  }
  const runTarget = getTestbedUuidsForTestSuite({ suite });
  return buildUiIntegrationOrchestratorCreateSessionParams(
    registryEntry,
    context,
    pageLabel,
    runTarget,
    suite.testParams,
    applicationRunnerUuidIndex,
  );
}
