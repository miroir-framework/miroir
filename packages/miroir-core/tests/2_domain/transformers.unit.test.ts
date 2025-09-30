import * as vitest from 'vitest';
import { defaultMetaModelEnvironment } from '../../src/1_core/Model';
import { MiroirActivityTracker } from '../../src/3_controllers/MiroirActivityTracker';
import { MiroirEventService } from '../../src/3_controllers/MiroirEventService';
import {
  runUnitTransformerTests,
  transformerTestsDisplayResults
} from "../../src/4_services/TestTools";
import {
  currentTestSuite,
} from "./transformersTests_miroir.data";

type VitestNamespace = typeof vitest;

// Access the test configuration from environment variables
const RUN_TEST = process.env.RUN_TEST;
// const vitestArgs = process.argv.slice(2); // does not work with npm test -- ...
// const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST:", RUN_TEST);
// console.log("@@@@@@@@@@@@@@@@@@ vitestArgs:", JSON.stringify(vitestArgs));
// console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

const testSuiteName = "transformers.unit.test";

// Skip this test when running other test patterns or when RUN_TEST doesn't match
// const shouldSkip = RUN_TEST !== testSuiteName && !filePattern.includes(testSuiteName);
const shouldSkip = RUN_TEST !== testSuiteName;

// ##################################################################################################
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);

afterAll(() => {
  if (!shouldSkip) {
    transformerTestsDisplayResults(
      currentTestSuite,
      RUN_TEST, // filePattern || "",
      testSuiteName,
      miroirActivityTracker
    );
  }
});
// ################################################################################################

if (shouldSkip) {
  console.log("################################ skipping test suite:", testSuiteName);
  // console.log("################################ File pattern:", filePattern);
} else {
  // await runTransformerTestSuite(
  // await runTransformerTestsWithTracking._runTransformerTestSuite(
  await runUnitTransformerTests._runTransformerTestSuite(
    vitest,
    [],
    currentTestSuite,
    undefined, // filter
    // {
    //   testList: {
    //     miroirCoreTransformers: {
    //       runtimeTransformerTests: {
    //         conditional: [
    //           "conditional equality true - basic string comparison",
    //           "conditional equality false - basic string comparison",
    //           "conditional not equal true - string comparison",
    //           "conditional not equal false - string comparison",
    //           "conditional less than true - number comparison",
    //           "conditional less than false - number comparison",
    //           "conditional less than or equal true - number comparison",
    //           "conditional less than or equal false - number comparison",
    //           "conditional greater than true - number comparison",
    //           "conditional greater than false - number comparison",
    //           "conditional greater than or equal true - number comparison",
    //           "conditional greater than or equal false - number comparison",
    //           "conditional without else clause - equality true",
    //           "conditional with parameter reference comparison",
    //         ]
    //       },
    //     },
    //   },
    // },
    defaultMetaModelEnvironment,
    miroirActivityTracker,
    undefined, // parentTrackingId,
    true, // trackActionsBelow
    runUnitTransformerTests,
  );
  
}
