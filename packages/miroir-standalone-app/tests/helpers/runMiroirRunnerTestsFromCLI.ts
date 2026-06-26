import { afterAll, beforeEach } from "vitest";

import {
  MiroirActivityTracker,
  defaultMetaModelEnvironment,
  displayMiroirTestResults,
  type MiroirTestCliConfig,
  type MiroirTestExecutionEnvironment,
  type MiroirTestExecutionOptions,
  type MiroirTestSuite,
  type RunMiroirTests,
  type RunnerTestSessionInterface,
  type VitestNamespace
} from "miroir-core";
import { miroirTest_runner_library } from "miroir-test-app_deployment-library";



// ################################################################################################
export async function runMiroirRunnerTestsFromCLI(
  runMiroirTests: RunMiroirTests,
  vitest: VitestNamespace,
  config: MiroirTestCliConfig,
  miroirActivityTracker: MiroirActivityTracker,
  testSession: RunnerTestSessionInterface,
): Promise<void> {
  const executionEnvironment: MiroirTestExecutionEnvironment = await testSession.initSession();
  const executionOptions: MiroirTestExecutionOptions = { executionMode: "integration", executionEnvironment };
  
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

  for (const suiteKey of config.suiteKeys) {
    const suiteExport = miroirTest_runner_library.definition as MiroirTestSuite;
    loadedSuites.push({
      suiteKey,
      definition: suiteExport as MiroirTestSuite,
    });
    await runMiroirTests._runMiroirTestSuite(
      vitest,
      [suiteKey],
      suiteExport as MiroirTestSuite,
      config.filter,
      defaultMetaModelEnvironment,
      miroirActivityTracker,
      undefined,
      true,
      runMiroirTests,
      executionOptions,
    );
  
  }
}
