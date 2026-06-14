import { defaultMetaModelEnvironment } from "../1_core/Model.js";
import type { MiroirTestSuite } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker.js";
import { MiroirEventService } from "../3_controllers/MiroirEventService.js";
import {
  runMiroirTests,
  type MiroirTestExecutionEnvironment,
  type MiroirTestExecutionOptions,
  type RunnerTestSessionInterface,
  type RunMiroirTests,
} from "./MiroirTestTools.js";
import { displayMiroirTestResults } from "./MiroirTransformerTestTools.js";
import type { MiroirTestCliConfig } from "./parseMiroirTestCliConfig.js";
import { loadMiroirCoreTestSuite } from "./miroirCoreTestSuiteRegistry.js";

export type MiroirTestVitestHarness = Parameters<RunMiroirTests["_runMiroirTestSuite"]>[0];

export type RunMiroirCoreTestsFromCLIOptions = {
  executionEnvironment?: MiroirTestExecutionEnvironment;
  testSession?: RunnerTestSessionInterface;
};

// ################################################################################################
export async function runMiroirCoreTestsFromCLI(
  vitestHarness: MiroirTestVitestHarness,
  config: MiroirTestCliConfig,
  options: RunMiroirCoreTestsFromCLIOptions = {},
): Promise<void> {
  const miroirActivityTracker = new MiroirActivityTracker();
  new MiroirEventService(miroirActivityTracker);

  if (config.executionMode === "integration" && !options.executionEnvironment) {
    throw new Error(
      "runMiroirCoreTestsFromCLI: executionEnvironment is required when executionMode is integration",
    );
  }

  const executionOptions: MiroirTestExecutionOptions =
    config.executionMode === "integration"
      ? {
          executionMode: config.executionMode as "integration",
          executionEnvironment: options.executionEnvironment as MiroirTestExecutionEnvironment,
        }
      : {
          executionMode: config.executionMode as "unit",
        };

  const loadedSuites: { suiteKey: string; definition: MiroirTestSuite }[] = [];

  if (options.testSession) {
    vitestHarness.beforeEach(async () => {
      await options.testSession!.beforeEach();
    });
  }

  vitestHarness.afterAll(async () => {
    if (options.testSession) {
      await options.testSession.teardown();
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
      vitestHarness,
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
