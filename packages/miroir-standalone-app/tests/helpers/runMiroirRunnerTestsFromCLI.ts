import { afterAll, beforeEach } from "vitest";

import {
  MiroirActivityTracker,
  MiroirEventService,
  MiroirRunnerTestCliParseResult,
  defaultMetaModelEnvironment,
  displayMiroirTestResults,
  type MiroirTestExecutionEnvironment,
  type MiroirTestSuite,
  type RunMiroirTests
} from "miroir-core";
import { miroirTest_runner_library } from "miroir-test-app_deployment-library";
import * as vitest from "vitest";
import { RunnerTestSession } from "./RunnerTestSession.js";



// ################################################################################################
export type RunMiroirRunnerTestsFromCLIOptions = {
  miroirConfig: import("miroir-core").MiroirConfigClient;
  loggerOptions?: unknown;
};

// ################################################################################################
export async function runMiroirRunnerTestsFromCLI(
  runMiroirTests: RunMiroirTests,
  config: MiroirRunnerTestCliParseResult,
  options: RunMiroirRunnerTestsFromCLIOptions,
): Promise<void> {
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);

  const testSession = new RunnerTestSession({
    miroirConfig: options.miroirConfig,
    miroirActivityTracker,
    miroirEventService,
  });

  const executionEnvironment: MiroirTestExecutionEnvironment = await testSession.initSession(); // calls initMiroirCoreTestIntegrationStore

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
      { executionMode: "integration", executionEnvironment },
    );
  
  }
}
