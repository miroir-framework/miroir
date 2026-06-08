import { afterAll } from "vitest";
import * as vitest from "vitest";

import { defaultMetaModelEnvironment } from "../../../src/1_core/Model";
import { MiroirActivityTracker } from "../../../src/3_controllers/MiroirActivityTracker";
import { runUnitTests, unitTestsDisplayResults } from "../../../src";
import { unitTest_suite_jzodToJsonSchema } from "miroir-test-app_deployment-miroir";
import type { UnitTestSuite } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

const RUN_TEST = process.env.RUN_TEST;
const testSuiteName = "jzodToJsonSchema.unit.test";
const shouldSkip = RUN_TEST !== testSuiteName;

const miroirActivityTracker = new MiroirActivityTracker();
const unitTestSuite: UnitTestSuite = unitTest_suite_jzodToJsonSchema.definition as UnitTestSuite;

afterAll(() => {
  if (!shouldSkip) {
    unitTestsDisplayResults(unitTestSuite, RUN_TEST, testSuiteName, miroirActivityTracker);
  }
});

if (shouldSkip) {
  vitest.test.skip(
    testSuiteName + " skipped (set RUN_TEST=" + testSuiteName + " to run)",
    () => {},
  );
} else {
  await runUnitTests._runUnitTestSuite(
    vitest,
    [],
    unitTestSuite,
    undefined,
    defaultMetaModelEnvironment,
    miroirActivityTracker,
    undefined,
    true,
    runUnitTests,
  );
}
