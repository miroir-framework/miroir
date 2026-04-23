import * as vitest from 'vitest';

import {
  type TransformerTestSuite
} from "../../../src//0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import {
  runUnitTransformerTests,
  transformerTestsDisplayResults
} from "../../../src/4_services/TestTools";

import { defaultMetaModelEnvironment } from '../../../src/1_core/Model';
import { MiroirActivityTracker } from "../../../src/3_controllers/MiroirActivityTracker";
import { transformerTestSuite_jzodTypeCheck } from "miroir-test-app_deployment-miroir";

// Access the test file pattern from Vitest's process arguments
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

const selectedTestName: string[
] = [
  // "jzodTypeCheck",
  // "test010_literal",
];
const testSuiteName = transformerTestSuite_jzodTypeCheck.definition.transformerTestLabel;

const activityTracker = new MiroirActivityTracker();

afterAll(() => {
  if (!shouldSkip) {
    transformerTestsDisplayResults(
      transformerTestSuite_jzodTypeCheck.definition as any as TransformerTestSuite,
      "jzodTypeCheck", // filePattern || "",
      testSuiteName,
      activityTracker
    );
  }
});

// ################################################################################################
// Skip this test when running resolveConditionalSchema pattern
const shouldSkip = filePattern.includes('resolveConditionalSchema');

if (shouldSkip) {
  console.log("################################ skipping test suite:", testSuiteName);
  console.log("################################ File pattern:", filePattern);
  vitest.test.skip(testSuiteName + " skipped (set RUN_TEST=" + testSuiteName + " to run)", () => {});
} else {
  // const testSuite: TransformerTestSuite = transformerTestSuite_jzodTypeCheck.definition as TransformerTestSuite;
  const testSuite: TransformerTestSuite = transformerTestSuite_jzodTypeCheck.definition as any as TransformerTestSuite;
  if (!Object.hasOwn(testSuite, "transformerTestType") || testSuite.transformerTestType !== "transformerTestSuite" ) {
    throw new Error("No transformerTests found in the test suite definition" +  JSON.stringify(testSuite));
  }
  const selectedTests = selectedTestName.length > 0? Object.fromEntries(Object.entries((testSuite as any).transformerTests).filter(
    ([key, test]) => selectedTestName.includes((test as any).transformerTestLabel)
  )): (testSuite as any).transformerTests;
  const effectiveTests: TransformerTestSuite = {
    ...testSuite,
    transformerTests: selectedTests as any
  } as any;

  await runUnitTransformerTests._runTransformerTestSuite(
    vitest,
    [
      // "jzodTypeCheck", "test010_literal",
    ],
    effectiveTests,
    undefined, // filter
    // {testList: {"jzodTypeCheck": [
    //   // "test010_literal",
    //   "test020_string",
    //   // "test022_boolean_true",
    //   // "test024_boolean_false",
    //   // "test030_schemaReference",
    //   // "test040",
    //   // "test050",
    //   // "test060",
    //   // "test070",
    //   "test120_union",
    // ]}}, // filter
    defaultMetaModelEnvironment,
    activityTracker,
    undefined, // parentTrackingId,
    true, // trackActionsBelow
    runUnitTransformerTests,
  );
  transformerTestsDisplayResults(
    effectiveTests,
    filePattern || "",
    testSuiteName,
    activityTracker
  );
}
