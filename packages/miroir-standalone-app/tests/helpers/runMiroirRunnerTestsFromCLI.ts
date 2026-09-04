import { afterAll, beforeEach } from "vitest";

import {
  MiroirActivityTracker,
  defaultMetaModelEnvironment,
  displayMiroirTestResults,
  indexApplicationMiroirTestsByKey,
  resolveApplicationMiroirTestSuiteKey,
  type MiroirTestCliConfig,
  type MiroirTestExecutionEnvironment,
  type MiroirTestExecutionOptions,
  type MiroirTestSuite,
  type RunMiroirTests,
  type RunnerTestSessionInterface,
  type VitestNamespace,
} from "miroir-core";
import { onFailedRunExport } from "./writeFailedRunExport.js";
import {
  listCliRunnerIntegrationSuiteKeysFromFolders,
  loadApplicationMiroirTestCatalog,
} from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";

const applicationMiroirTestCatalog = loadApplicationMiroirTestCatalog();
const runnerSuitesByKey = indexApplicationMiroirTestsByKey(applicationMiroirTestCatalog);

export function loadRunnerOrActionMiroirTestSuite(suiteKey: string): MiroirTestSuite {
  const resolvedKey =
    resolveApplicationMiroirTestSuiteKey(applicationMiroirTestCatalog, suiteKey) ?? suiteKey;
  const entry = runnerSuitesByKey[resolvedKey];
  if (!entry || entry.cliLaunchKind !== "runner-integration") {
    throw new Error(
      `Unknown runner/action MiroirTest suite key "${suiteKey}". Available: ${listCliRunnerIntegrationSuiteKeysFromFolders().join(", ")}`,
    );
  }
  return entry.suiteDefinition;
}

// ################################################################################################
export async function runMiroirRunnerTestsFromCLI(
  runMiroirTests: RunMiroirTests,
  vitest: VitestNamespace,
  config: MiroirTestCliConfig,
  miroirActivityTracker: MiroirActivityTracker,
  testSession: RunnerTestSessionInterface,
): Promise<void> {
  const executionEnvironment: MiroirTestExecutionEnvironment = await testSession.initSession();
  const executionOptions: MiroirTestExecutionOptions = {
    executionMode: "integration",
    executionEnvironment,
    onFailedRunExport,
  };

  const loadedSuites: { suiteKey: string; definition: MiroirTestSuite }[] = [];

  beforeEach(async () => {
    await testSession.beforeEach();
  });

  afterAll(async () => {
    await testSession.teardown();
    if (!loadedSuites.length) {
      return;
    }
    const summaryLabel = loadedSuites.map(({ suiteKey }) => suiteKey).join(", ");
    await displayMiroirTestResults(
      loadedSuites[0].definition,
      summaryLabel,
      loadedSuites[0].suiteKey,
      miroirActivityTracker,
    );
  });

  const runnerTestContext = executionEnvironment.runnerTestContext;

  for (const suiteKey of config.suiteKeys) {
    const suiteExport = loadRunnerOrActionMiroirTestSuite(suiteKey);
    loadedSuites.push({
      suiteKey,
      definition: suiteExport,
    });
    // The session is built once from the primary suite. Each suite may carry its
    // own testParams bank; runner resolution uses each leaf's runnerRef + session
    // runnerUuidIndex at execution time.
    const suiteExecutionOptions: MiroirTestExecutionOptions =
      runnerTestContext && suiteExport.testParams
        ? {
            ...executionOptions,
            executionEnvironment: {
              ...executionEnvironment,
              runnerTestContext: {
                ...runnerTestContext,
                testParams: {
                  ...runnerTestContext.testParams,
                  ...suiteExport.testParams,
                },
              },
            },
          }
        : executionOptions;
    await runMiroirTests._runMiroirTestSuite(
      vitest,
      [suiteKey],
      suiteExport,
      config.filter,
      defaultMetaModelEnvironment,
      miroirActivityTracker,
      undefined,
      true,
      runMiroirTests,
      suiteExecutionOptions,
    );
  }
}
