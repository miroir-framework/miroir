import * as vitest from 'vitest';
import { defaultMetaModelEnvironment } from '../../src/1_core/Model';
import { MiroirActivityTracker } from '../../src/3_controllers/MiroirActivityTracker';
import { MiroirEventService } from '../../src/3_controllers/MiroirEventService';
import {
  runUnitTransformerTests,
  transformerTestsDisplayResults
} from "../../src/4_services/TestTools";
// import {
//   currentTestSuite,
// } from "./transformersTests_miroir.data";
import transformerTest_miroirCoreTransformers from "../../src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/a5b4be38-78e3-4f31-9e9b-8ab0b71d4993.json" with { type: "json" };
import type { TransformerTestSuite } from '../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';
const transformerTestSuite_miroirTransformers: TransformerTestSuite = transformerTest_miroirCoreTransformers.definition as any;

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
      transformerTestSuite_miroirTransformers,
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
    transformerTestSuite_miroirTransformers,
    undefined, // filter
    // { // filter
    //   testList: {
    //     miroirCoreTransformers: {
    //       // buildTransformerTests: {
    //       //   "simpleCompositions": [
    //       //     "resolve basic build transformer count on parameter array"
    //       //   ]
    //       // },
    //       runtimeTransformerTests: {
    //         "aggregate": [
    //           "count returns number of elements in an object list with a multiple groupBy at runtime"
    //         ]
    //         // ifThenElse: [
    //         //   "ifThenElse equality true - basic string comparison",
    //         //   "ifThenElse equality false - basic string comparison",
    //         //   "ifThenElse not equal true - string comparison",
    //         //   "ifThenElse not equal false - string comparison",
    //         //   "ifThenElse less than true - number comparison",
    //         //   "ifThenElse less than false - number comparison",
    //         //   "ifThenElse less than or equal true - number comparison",
    //         //   "ifThenElse less than or equal false - number comparison",
    //         //   "ifThenElse greater than true - number comparison",
    //         //   "ifThenElse greater than false - number comparison",
    //         //   "ifThenElse greater than or equal true - number comparison",
    //         //   "ifThenElse greater than or equal false - number comparison",
    //         //   "ifThenElse without else clause - equality true",
    //         //   "ifThenElse with parameter reference comparison",
    //         // ]
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
