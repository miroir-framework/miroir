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
import transformerTestSuite_jzodTypeCheck from "../../../src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/f8e3c7a1-2b9d-4e6f-8c2a-5d7b9e4f1a8c.json";

// Access the test file pattern from Vitest's process arguments
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

const selectedTestName: string[] = [];
const testSuiteName = transformerTestSuite_jzodTypeCheck.definition.transformerTestLabel;

const activityTracker = new MiroirActivityTracker();

// ################################################################################################
// Skip this test when running resolveConditionalSchema pattern
const shouldSkip = filePattern.includes('resolveConditionalSchema');

if (shouldSkip) {
  console.log("################################ skipping test suite:", testSuiteName);
  console.log("################################ File pattern:", filePattern);
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
    [],
    effectiveTests,
    undefined, // filter
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
