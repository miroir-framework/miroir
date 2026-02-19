import * as vitest from 'vitest';

import {
  type TransformerTestSuite
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";


import {
  runUnitTransformerTests,
  transformerTestsDisplayResults
} from "../../../src/4_services/TestTools";

import { defaultMetaModelEnvironment } from "../../../src/1_core/Model";
import { MiroirActivityTracker } from "../../../src/3_controllers/MiroirActivityTracker";
import { transformerTestSuite_resolveSchemaReferenceInContext } from "miroir-test-app_deployment-miroir";

// Access the test file pattern from Vitest's process arguments
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

const selectedTestName: string[] = [];
const activityTracker = new MiroirActivityTracker();

// ################################################################################################
const testSuiteName = transformerTestSuite_resolveSchemaReferenceInContext.definition.transformerTestLabel;

// Skip this test when running resolveConditionalSchema pattern
const shouldSkip = filePattern.includes('resolveConditionalSchema');

if (shouldSkip) {
  console.log("################################ skipping test suite:", transformerTestSuite_resolveSchemaReferenceInContext.definition.transformerTestLabel);
  console.log("################################ File pattern:", filePattern);
} else {
  const testSuite: TransformerTestSuite = transformerTestSuite_resolveSchemaReferenceInContext.definition as TransformerTestSuite;
  // if (!Object.hasOwn(testSuite, "transformerTestType") || (testSuite as any).transformerTests === undefined) {
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
    // { describe, expect} as any,//vitest,
    vitest,
    [],
    // transformerTestSuite_resolveSchemaReferenceInContext.definition as TransformerTestSuite,
    effectiveTests,
    undefined, // filter
    defaultMetaModelEnvironment,
    activityTracker,
    undefined, // parentTrackingId,
    true, // trackActionsBelow
    runUnitTransformerTests,
  );
  transformerTestsDisplayResults(
    // transformerTestSuite_resolveSchemaReferenceInContext.definition as TransformerTestSuite,
    effectiveTests,
    filePattern || "",
    transformerTestSuite_resolveSchemaReferenceInContext.definition.transformerTestLabel,
    activityTracker
  );
}
