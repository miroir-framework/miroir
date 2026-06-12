import * as vitest from "vitest";

import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultMetaModelEnvironment } from "../../src/1_core/Model";
import type { MiroirModelEnvironment } from "../../src/0_interfaces/1_core/Transformer";
import type { MiroirActivityTrackerInterface } from "../../src/0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import {
  runMiroirTests,
  type MiroirTestExecutionOptions,
  type MiroirTestRunFilter,
} from "../../src/4_services/MiroirTestTools";

export type RunDeployedMiroirTestSuiteParams = {
  suiteExport: MiroirTestSuite;
  suiteKey: string;
  miroirActivityTracker: MiroirActivityTrackerInterface;
  modelEnvironment?: MiroirModelEnvironment;
  filter?: MiroirTestRunFilter;
  executionOptions?: MiroirTestExecutionOptions;
};

export async function runDeployedMiroirTestSuite({
  suiteExport,
  suiteKey,
  miroirActivityTracker,
  modelEnvironment = defaultMetaModelEnvironment,
  filter,
  executionOptions = { executionMode: "unit" },
}: RunDeployedMiroirTestSuiteParams): Promise<void> {
  const miroirTestSuite = suiteExport as MiroirTestSuite;

  await runMiroirTests._runMiroirTestSuite(
    vitest,
    [suiteKey],
    miroirTestSuite,
    filter,
    modelEnvironment,
    miroirActivityTracker,
    undefined,
    true,
    runMiroirTests,
    executionOptions,
  );
}
