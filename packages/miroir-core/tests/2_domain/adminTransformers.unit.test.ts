import * as vitest from 'vitest';
import { defaultMetaModelEnvironment } from '../../src/1_core/Model';
import { MiroirActivityTracker } from '../../src/3_controllers/MiroirActivityTracker';
import { MiroirEventService } from '../../src/3_controllers/MiroirEventService';
import {
  runUnitTransformerTests,
  transformerTestsDisplayResults
} from "../../src/4_services/TestTools";
import { transformerTest_adminTransformers } from "miroir-test-app_deployment-miroir";
import type { TransformerTestSuite } from '../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';

const transformerTestSuite_adminTransformers: TransformerTestSuite = transformerTest_adminTransformers.definition as any;

type VitestNamespace = typeof vitest;

// Access the test configuration from environment variables
const RUN_TEST = process.env.RUN_TEST;
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST:", RUN_TEST);

const testSuiteName = "adminTransformers.unit.test";

const shouldSkip = RUN_TEST !== testSuiteName;

// ##################################################################################################
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);

afterAll(() => {
  if (!shouldSkip) {
    transformerTestsDisplayResults(
      transformerTestSuite_adminTransformers,
      RUN_TEST,
      testSuiteName,
      miroirActivityTracker
    );
  }
});
// ################################################################################################

if (shouldSkip) {
  console.log("################################ skipping test suite:", testSuiteName);
  // Placeholder to avoid "empty test file" error when this file is matched by broader patterns (e.g. '-- transformers.unit')
  vitest.test.skip(testSuiteName + " skipped (set RUN_TEST=" + testSuiteName + " to run)", () => {});
} else {
  await runUnitTransformerTests._runTransformerTestSuite(
    vitest,
    [],
    transformerTestSuite_adminTransformers,
    undefined, // filter
    defaultMetaModelEnvironment,
    miroirActivityTracker,
    undefined, // parentTrackingId
    true, // trackActionsBelow
    runUnitTransformerTests,
  );
}
