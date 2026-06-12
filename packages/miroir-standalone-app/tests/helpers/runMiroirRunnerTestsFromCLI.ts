import { afterAll, beforeEach } from "vitest";

import * as vitest from "vitest";
import {
  MiroirActivityTracker,
  MiroirEventService,
  MiroirTestIntegrationOrchestrator,
  defaultMetaModelEnvironment,
  displayMiroirTestResults,
  runMiroirTests,
  type MiroirTestRunFilter,
  type MiroirTestSuite,
  type MiroirTestExecutionEnvironment,
  MiroirRunnerTestCliParseResult,
} from "miroir-core";
import { RunnerIntegAdapter } from "./RunnerIntegAdapter.js";
import { miroirTest_runner_library } from "miroir-test-app_deployment-library";



// ################################################################################################
async function runMiroirRunnerTestSuite({
  suiteExport,
  suiteKey,
  miroirActivityTracker,
  filter,
  executionEnvironment,
}: {
  suiteExport: MiroirTestSuite;
  suiteKey: string;
  miroirActivityTracker: MiroirActivityTracker;
  filter?: MiroirTestRunFilter;
  executionEnvironment: MiroirTestExecutionEnvironment;
}): Promise<void> {
  await runMiroirTests._runMiroirTestSuite(
    vitest,
    [suiteKey],
    suiteExport as MiroirTestSuite,
    // suiteExport.definition as MiroirTestSuite,
    filter,
    defaultMetaModelEnvironment,
    miroirActivityTracker,
    undefined,
    true,
    runMiroirTests,
    { executionMode: "integration", executionEnvironment },
  );
}

// ################################################################################################
export type RunMiroirRunnerTestsFromCLIOptions = {
  miroirConfig: import("miroir-core").MiroirConfigClient;
  loggerOptions?: unknown;
};

// ################################################################################################
export async function runMiroirRunnerTestsFromCLI(
  config: MiroirRunnerTestCliParseResult,
  options: RunMiroirRunnerTestsFromCLIOptions,
): Promise<void> {
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);

  const adapter = new RunnerIntegAdapter({
    miroirConfig: options.miroirConfig,
    miroirActivityTracker,
    miroirEventService,
  });
  const orchestrator = new MiroirTestIntegrationOrchestrator(adapter);
  
  const executionEnvironment = await orchestrator.initSession(); // calls initMiroirCoreTestIntegrationStore

  const loadedSuites: { suiteKey: string; definition: MiroirTestSuite }[] = [];

  beforeEach(async () => {
    await orchestrator.beforeEach();
  });

  afterAll(async () => {
    await orchestrator.teardown();
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
    await runMiroirRunnerTestSuite({
      suiteExport,
      suiteKey,
      miroirActivityTracker,
      filter: config.filter,
      executionEnvironment,
    });
  }
}
