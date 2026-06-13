import * as vitest from "vitest";

import { defaultMetaModelEnvironment } from "../../src/1_core/Model";
import {
  runMiroirTests,
} from "../../src/5_tests/MiroirTestTools";


import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../../src/3_controllers/MiroirEventService";
import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { loadMiroirCoreTestSuite } from "./miroirCoreTestSuiteRegistry";
import type { MiroirTestCliConfig } from "../../src/5_tests/parseMiroirTestCliConfig";
import { displayMiroirTestResults } from "../../src/5_tests/MiroirTransformerTestTools";
import type { PersistenceStoreControllerInterface, PersistenceStoreDataSectionInterface } from "../../src/0_interfaces/4-services/PersistenceStoreControllerInterface";
import { defaultSelfApplicationDeploymentMap, type ApplicationDeploymentMap } from "../../src/1_core/Deployment";

export type RunMiroirCoreTestsFromCLIOptions = {
  // integrationStore: PersistenceStoreControllerInterface;
  integrationDataStore: PersistenceStoreDataSectionInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
};

// ################################################################################################
export async function runMiroirCoreTestsFromCLI(
  config: MiroirTestCliConfig,
  options?: RunMiroirCoreTestsFromCLIOptions,
): Promise<void> {
  const miroirActivityTracker = new MiroirActivityTracker();
  new MiroirEventService(miroirActivityTracker);

  if (config.executionMode === "integration" && options?.integrationDataStore === undefined) {
    throw new Error("runMiroirCoreTestsFromCLI: integrationStore is required when executionMode is integration");
  }

  const executionOptions = config.executionMode === "integration" ? {
    executionMode: config.executionMode,
    integrationStore: options?.integrationDataStore,
  } : {
    executionMode: config.executionMode,
  };

  const loadedSuites: { suiteKey: string; definition: MiroirTestSuite }[] = [];

  afterAll(async () => {
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
