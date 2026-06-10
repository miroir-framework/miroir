import { afterAll } from "vitest";
import * as vitest from "vitest";

import { defaultMetaModelEnvironment } from "../../src/1_core/Model";
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { miroirTestsDisplayResults, runMiroirTests } from "../../src/4_services/MiroirTestTools";
import { miroirTest_mustache } from "miroir-test-app_deployment-miroir";
import type { MiroirTestSuite } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

const RUN_TEST = process.env.RUN_TEST;
const testSuiteName = "miroirTest.mustache.unit.test";
const shouldSkip = RUN_TEST !== testSuiteName;

const miroirActivityTracker = new MiroirActivityTracker();
const miroirTestSuite: MiroirTestSuite = miroirTest_mustache.definition as MiroirTestSuite;

afterAll(() => {
  if (!shouldSkip) {
    miroirTestsDisplayResults(
      miroirTestSuite,
      RUN_TEST ?? testSuiteName,
      miroirActivityTracker,
    );
  }
});

if (shouldSkip) {
  vitest.test.skip(
    testSuiteName + " skipped (set RUN_TEST=" + testSuiteName + " to run)",
    () => {},
  );
} else {
  await runMiroirTests._runMiroirTestSuite(
    vitest,
    [],
    miroirTestSuite,
    undefined,
    defaultMetaModelEnvironment,
    miroirActivityTracker,
    undefined,
    true,
    runMiroirTests,
    { executionMode: "unit" },
  );
}
