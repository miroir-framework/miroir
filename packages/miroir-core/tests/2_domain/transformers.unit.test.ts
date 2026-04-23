import { afterAll } from 'vitest';
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
import { transformerTest_miroirCoreTransformers } from "miroir-test-app_deployment-miroir";
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
  // Placeholder to avoid "empty test file" error when this file is matched by broader patterns (e.g. '-- transformers.unit')
  vitest.test.skip(testSuiteName + " skipped (set RUN_TEST=" + testSuiteName + " to run)", () => {});
} else {
  // await runTransformerTestSuite(
  // await runTransformerTestsWithTracking._runTransformerTestSuite(
  await runUnitTransformerTests._runTransformerTestSuite(
    vitest,
    [],
    transformerTestSuite_miroirTransformers,
    undefined, // filter
    // { // filter: uncomment to run only concatLists and aggregate tests
    //   testList: {
    //     miroirCoreTransformers: {
    //       runtimeTransformerTests: {
    //         "concatLists": [
    //           "concatLists concatenates two string arrays from returnValue",
    //           "concatLists concatenates two arrays from context",
    //           "concatLists concatenates three arrays of objects",
    //           "concatLists with empty list returns combined result",
    //           "concatLists fails when an element is not an array",
    //         ],
    //         "aggregate": [
    //           "count returns number of elements in an object list at runtime",
    //           "count returns number of elements in a returnValue transformer object list at runtime",
    //           "count returns number of elements in a getFromContext object list at runtime",
    //           "count returns number of elements in a string list from an extractor at runtime",
    //           "count returns number of elements in an object list from an extractor",
    //           "count returns number of elements in an object list with a group at runtime",
    //           "count returns number of elements in an object list with a multiple groupBy at runtime",
    //           "sum returns total of numeric attribute values at runtime",
    //           "sum with groupBy returns totals per group at runtime",
    //           "avg returns average of numeric attribute values at runtime",
    //           "min returns minimum of numeric attribute values at runtime",
    //           "max returns maximum of numeric attribute values at runtime",
    //           "json_agg collects attribute values into an array at runtime",
    //           "json_agg_strict omits null values at runtime",
    //           "count with default function still uses aggregate result key (backward compat)",
    //           "count with explicit function uses count result key (AGG-3)",
    //           "count with explicit function and groupBy uses count result key (AGG-3)",
    //           "count with distinct flag counts unique attribute values (AGG-4)",
    //           "count with distinct and groupBy counts unique attribute values per group (AGG-4)",
    //           "sum with having filters groups by aggregate result (AGG-2)",
    //           "count with having filters groups by count result (AGG-2)",
    //           "json_agg with attributeObject collects objects at runtime",
    //           "json_agg with attributeObject and groupBy collects objects per group at runtime",
    //           "json_agg_strict with attributeObject omits null-valued objects at runtime",
    //         ],
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
