import * as vitest from "vitest";

import type { MiroirTestSuite } from "../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultMetaModelEnvironment } from "../src/1_core/Model";
import { MiroirActivityTracker } from "../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../src/3_controllers/MiroirEventService";
import { runMiroirTests } from "../src/5_tests/MiroirTestTools";
import { parseMiroirTestCliConfig } from "../src/5_tests/parseMiroirTestCliConfig";
import { displayMiroirTestResults } from "../src/5_tests/MiroirTransformerTestTools";
import {
  listCliUnitSuiteKeysFromFolders,
  loadMiroirCoreTestSuiteFromFolders,
  resolveCliSuiteKeysFromCatalog,
} from "../src/5_tests/loadApplicationMiroirTestsFromFolders";

const unitSuiteKeys = listCliUnitSuiteKeysFromFolders();
const parsedConfig = parseMiroirTestCliConfig(process.env, process.argv.slice(2), unitSuiteKeys);
const config = {
  ...parsedConfig,
  suiteKeys: resolveCliSuiteKeysFromCatalog(parsedConfig.suiteKeys, unitSuiteKeys),
};
const miroirActivityTracker = new MiroirActivityTracker();
new MiroirEventService(miroirActivityTracker);

const loadedSuites: { suiteKey: string; definition: MiroirTestSuite }[] = [];

vitest.afterAll(async () => {
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
    { executionMode: "unit" },
  );
}
