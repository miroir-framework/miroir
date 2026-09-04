import {
  defaultMetaModelEnvironment,
  displayMiroirTestResults,
  MiroirActivityTracker,
  MiroirEventService,
  type MiroirTestCliConfig,
  type MiroirTestExecutionEnvironment,
  type MiroirTestExecutionOptions,
  type MiroirTestSuite,
  type RunMiroirTests,
  type RunnerTestSessionInterface,
  type VitestNamespace,
} from "miroir-core";
import { loadMiroirCoreTestSuiteFromFolders } from "miroir-core/src/5_tests/loadApplicationMiroirTestsFromFolders.js";
import { onFailedRunExport } from "./writeFailedRunExport.js";

export async function runMiroirCoreTestsFromCLI(
  runMiroirTests: RunMiroirTests,
  vitest: VitestNamespace,
  config: MiroirTestCliConfig,
  miroirActivityTracker: MiroirActivityTracker,
  testSession?: RunnerTestSessionInterface,
): Promise<void> {
  new MiroirEventService(miroirActivityTracker);
  const executionEnvironment = await testSession?.initSession();

  if (config.executionMode === "integration" && !executionEnvironment) {
    throw new Error(
      "runMiroirCoreTestsFromCLI: executionEnvironment is required when executionMode is integration",
    );
  }

  const executionOptions: MiroirTestExecutionOptions =
    config.executionMode === "integration"
      ? {
          executionMode: config.executionMode as "integration",
          executionEnvironment: executionEnvironment as MiroirTestExecutionEnvironment,
          onFailedRunExport,
        }
      : {
          executionMode: config.executionMode as "unit",
          onFailedRunExport,
        };

  const loadedSuites: { suiteKey: string; definition: MiroirTestSuite }[] = [];

  if (testSession) {
    vitest.beforeEach(async () => {
      await testSession!.beforeEach();
    });
  }

  vitest.afterAll(async () => {
    if (testSession) {
      await testSession.teardown();
    }
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
    const miroirTestSuite = loadMiroirCoreTestSuiteFromFolders(suiteKey);
    loadedSuites.push({
      suiteKey,
      definition: miroirTestSuite as MiroirTestSuite,
    });
    await runMiroirTests._runMiroirTestSuite(
      vitest,
      [suiteKey],
      miroirTestSuite,
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
