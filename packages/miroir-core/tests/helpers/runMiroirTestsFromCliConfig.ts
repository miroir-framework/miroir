import { afterAll } from "vitest";
import * as vitest from "vitest";

import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { miroirTestsDisplayResults } from "../../src/4_services/MiroirTestTools";
import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { listMiroirTestSuiteKeys, loadMiroirTestSuiteExport } from "./miroirTestSuiteRegistry";
import type { MiroirTestCliConfig } from "./parseMiroirTestCliConfig";
import { runDeployedMiroirTestSuite } from "./runDeployedMiroirTestSuite";

export type RunMiroirTestsFromCliConfigOptions = {
  integrationStore?: unknown;
};

export async function runMiroirTestsFromCliConfig(
  config: MiroirTestCliConfig,
  options: RunMiroirTestsFromCliConfigOptions = {},
): Promise<void> {
  if (config.suiteKeys.length === 0) {
    vitest.test.skip(
      `No MiroirTest suites selected (set MIROIR_TEST_SUITES or --suites; available: ${listMiroirTestSuiteKeys().join(", ")})`,
      () => {},
    );
    return;
  }

  const miroirActivityTracker = new MiroirActivityTracker();
  const executionOptions = {
    executionMode: config.executionMode,
    integrationStore: options.integrationStore,
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
