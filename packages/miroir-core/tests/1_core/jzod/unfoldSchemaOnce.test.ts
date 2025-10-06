import * as vitest from 'vitest';
// import { describe, expect, it } from "vitest";
// import {
//   describe,
//   expect,
// } from "../../../src/1_core/test-expect";

import {
  type TransformerTestSuite,
} from "../../../src//0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import {
  runTransformerTestInMemory,
  runTransformerTestSuite,
  runUnitTransformerTests,
  transformerTestsDisplayResults,
} from "../../../src/4_services/TestTools";

import { MiroirActivityTracker } from "../../../src/3_controllers/MiroirActivityTracker";
import { defaultMetaModelEnvironment } from "../../../src/1_core/Model";

import transformerTestSuite_unfoldSchemaOnce from "../../../src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/e8b5d1a2-9473-4f6c-b2e8-7f8a5c6d9e0f.json";

// Access the test file pattern from Vitest's process arguments
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

const selectedTestName: string[] = [];

// ################################################################################################
const testSuiteName = transformerTestSuite_unfoldSchemaOnce.definition.transformerTestLabel;

// Skip this test when running resolveConditionalSchema pattern  
const shouldSkip = filePattern.includes('resolveConditionalSchema');

if (shouldSkip) {
  console.log("################################ skipping test suite:", transformerTestSuite_unfoldSchemaOnce.definition.transformerTestLabel);
  console.log("################################ File pattern:", filePattern);
  describe.skip(testSuiteName, () => {});
} else {
  const activityTracker = new MiroirActivityTracker();
  
  const testSuite: TransformerTestSuite = transformerTestSuite_unfoldSchemaOnce.definition as TransformerTestSuite;
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
    vitest,//{ describe, expect } as any, //vitest,
    [],
    effectiveTests,
    undefined, // filter
    defaultMetaModelEnvironment,
    activityTracker,
    undefined, // parentTrackingId,
    true, // trackActionsBelow
    runUnitTransformerTests,
    // runTransformerTestInMemory,
    // defaultMetaModelEnvironment,
    // miroirActivityTracker
  );
  transformerTestsDisplayResults(
    effectiveTests,
    filePattern || "",
    transformerTestSuite_unfoldSchemaOnce.definition.transformerTestLabel,
    activityTracker
  );
}
