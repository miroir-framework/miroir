import { afterAll } from "vitest";

import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../../src/3_controllers/MiroirEventService";
import { miroirTestsDisplayResults } from "../../src/4_services/MiroirTestTools";
import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { loadMiroirTestSuiteExport } from "./miroirTestSuiteRegistry";
import type { MiroirTestCliConfig } from "../../src/5_tests/parseMiroirTestCliConfig";
import type { MiroirTestExecutionEnvironment } from "../../src/4_services/MiroirTestIntegrationOrchestrator";
import type { MiroirTestIntegrationOrchestrator } from "../../src/4_services/MiroirTestIntegrationOrchestrator";
import { runDeployedMiroirTestSuite } from "./runDeployedMiroirTestSuite";

export type RunMiroirTestsFromCLIOptions = {
  integrationStore?: unknown;
  orchestrator?: MiroirTestIntegrationOrchestrator;
  executionEnvironment?: MiroirTestExecutionEnvironment;
};

// ################################################################################################
export async function runMiroirTestsFromCLI(
  config: MiroirTestCliConfig,
  options: RunMiroirTestsFromCLIOptions = {},
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
    const suiteExport = await loadMiroirTestSuiteExport(suiteKey);
    loadedSuites.push({
      suiteKey,
      definition: suiteExport.definition as MiroirTestSuite,
    });
    await runDeployedMiroirTestSuite({
      suiteExport,
      suiteKey,
      miroirActivityTracker,
      filter: config.filter,
      executionOptions,
    });
  }
}
