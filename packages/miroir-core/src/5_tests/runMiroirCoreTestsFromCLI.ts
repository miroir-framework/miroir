import type { MiroirTestSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { defaultMetaModelEnvironment } from "../1_core/Model.js";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker.js";
import { MiroirEventService } from "../3_controllers/MiroirEventService.js";
import { loadMiroirCoreTestSuite } from "./miroirCoreTestSuiteRegistry.js";
import {
  type MiroirTestExecutionEnvironment,
  type MiroirTestExecutionOptions,
  type RunMiroirTests,
  type RunnerTestSessionInterface,
  type VitestNamespace
} from "./MiroirTestTools.js";
import { displayMiroirTestResults } from "./MiroirTransformerTestTools.js";
import type { MiroirTestCliConfig } from "./parseMiroirTestCliConfig.js";

export type RunMiroirCoreTestsFromCLIOptions = {
  executionEnvironment?: MiroirTestExecutionEnvironment;
  testSession?: RunnerTestSessionInterface;
};

// ################################################################################################
export async function runMiroirCoreTestsFromCLI(
  runMiroirTests: RunMiroirTests,
  vitest: VitestNamespace,
  config: MiroirTestCliConfig,
  executionEnvironment?: MiroirTestExecutionEnvironment,
  testSession?: RunnerTestSessionInterface,
): Promise<void> {
  const miroirActivityTracker = new MiroirActivityTracker();
  new MiroirEventService(miroirActivityTracker);

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
        }
      : {
          executionMode: config.executionMode as "unit",
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
    const miroirTestSuite = await loadMiroirCoreTestSuite(suiteKey);
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
