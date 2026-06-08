import { afterAll } from "vitest";
import * as vitest from "vitest";

import type { UnitTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultMetaModelEnvironment } from "../../src/1_core/Model";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { runUnitTests, unitTestsDisplayResults } from "../../src";

type DeployedUnitTestSuite = { definition: UnitTestSuite };

export async function runDeployedUnitTestSuite(
  suiteExport: DeployedUnitTestSuite,
  testSuiteName: string,
  modelEnvironment = defaultMetaModelEnvironment,
) {
  const RUN_TEST = process.env.RUN_TEST;
  const shouldSkip = RUN_TEST !== undefined && RUN_TEST !== testSuiteName;
  const miroirActivityTracker = new MiroirActivityTracker();
  const unitTestSuite = suiteExport.definition;

  afterAll(() => {
    if (!shouldSkip) {
      unitTestsDisplayResults(unitTestSuite, RUN_TEST, testSuiteName, miroirActivityTracker);
    }
  });

  if (shouldSkip) {
    vitest.test.skip(
      `${testSuiteName} skipped (set RUN_TEST=${testSuiteName} to run)`,
      () => {},
    );
    return;
  }

  await runUnitTests._runUnitTestSuite(
    vitest,
    [],
    unitTestSuite,
    undefined,
    modelEnvironment,
    miroirActivityTracker,
    undefined,
    true,
    runUnitTests,
  );
}
