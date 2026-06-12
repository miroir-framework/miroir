// import { afterAll } from "vitest";
import * as vitest from "vitest";

// import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultMetaModelEnvironment } from "../../src/1_core/Model";
// import type { MiroirModelEnvironment } from "../../src/0_interfaces/1_core/Transformer";
// import type { MiroirActivityTrackerInterface } from "../../src/0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import {
  runMiroirTests,
  // type MiroirTestExecutionOptions,
  // type MiroirTestRunFilter,
} from "../../src/5_tests/MiroirTestTools";


import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../../src/3_controllers/MiroirEventService";
import { miroirTestsDisplayResults } from "../../src/5_tests/MiroirTestTools";
import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { loadMiroirTestSuiteExport } from "./miroirTestSuiteRegistry";
import type { MiroirTestCliConfig } from "../../src/5_tests/parseMiroirTestCliConfig";
import type { MiroirTestExecutionEnvironment } from "../../src/5_tests/MiroirTestIntegrationOrchestrator";
import type { MiroirTestIntegrationOrchestrator } from "../../src/5_tests/MiroirTestIntegrationOrchestrator";
// import { runDeployedMiroirTestSuite } from "./runDeployedMiroirTestSuite";

export type RunMiroirCoreTestsFromCLIOptions = {
  integrationStore?: unknown;
  orchestrator?: MiroirTestIntegrationOrchestrator;
  executionEnvironment?: MiroirTestExecutionEnvironment;
};

// ################################################################################################
export async function runMiroirCoreTestsFromCLI(
  config: MiroirTestCliConfig,
  options: RunMiroirCoreTestsFromCLIOptions = {},
): Promise<void> {
  const miroirActivityTracker = new MiroirActivityTracker();
  new MiroirEventService(miroirActivityTracker);
  const executionEnvironment =
    options.executionEnvironment ?? options.orchestrator?.getEnvironment();

  const executionOptions = {
    executionMode: config.executionMode,
    integrationStore: options.integrationStore ?? executionEnvironment?.integrationStore,
    executionEnvironment,
  };

  const loadedSuites: { suiteKey: string; definition: MiroirTestSuite }[] = [];

  afterAll(async () => {
    if (!loadedSuites.length) {
      return;
    }
    const summaryLabel = loadedSuites.map(({ suiteKey }) => suiteKey).join(", ");
    await miroirTestsDisplayResults(
      loadedSuites[0].definition,
      summaryLabel,
      loadedSuites[0].suiteKey,
      miroirActivityTracker,
    );
  });

  for (const suiteKey of config.suiteKeys) {
    const miroirTestSuite = await loadMiroirTestSuiteExport(suiteKey);
    loadedSuites.push({
      suiteKey,
      definition: miroirTestSuite as MiroirTestSuite,
    });
    // await runDeployedMiroirTestSuite({
    //   miroirTestSuite,
    //   suiteKey,
    //   miroirActivityTracker,
    //   filter: config.filter,
    //   executionOptions,
    // });
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
