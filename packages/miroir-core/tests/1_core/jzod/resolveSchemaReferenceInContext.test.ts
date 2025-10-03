import * as vitest from 'vitest';
// import { describe, expect, it } from "vitest";
import {
  describe,
  expect,
} from "../../../src/1_core/test-expect";

import {
  JzodElement,
  JzodReference,
  JzodSchema,
  type TransformerTestSuite,
  MetaModel
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import {
  resolveJzodSchemaReferenceInContext,
} from "../../../src/1_core/jzod/jzodResolveSchemaReferenceInContext";

import {
  runTransformerTestInMemory,
  runTransformerTestSuite,
  transformerTestsDisplayResults,
} from "../../../src/4_services/TestTools";

import { MiroirActivityTracker } from "../../../src/3_controllers/MiroirActivityTracker";
import { defaultMetaModelEnvironment } from "../../../src/1_core/Model";

import transformerTestSuite_resolveSchemaReferenceInContext from "../../../src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/b9e7f4d5-6543-4a1b-9c8d-987654321fed.json";

// Access the test file pattern from Vitest's process arguments
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

const selectedTestName: string[] = [];

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
  
  const miroirActivityTracker = new MiroirActivityTracker();
  
  await runTransformerTestSuite(
    // { describe, expect} as any,//vitest,
    vitest,
    [],
    // transformerTestSuite_resolveSchemaReferenceInContext.definition as TransformerTestSuite,
    effectiveTests,
    undefined, // filter
    runTransformerTestInMemory,
    defaultMetaModelEnvironment,
    miroirActivityTracker
  );
  transformerTestsDisplayResults(
    // transformerTestSuite_resolveSchemaReferenceInContext.definition as TransformerTestSuite,
    effectiveTests,
    filePattern || "",
    transformerTestSuite_resolveSchemaReferenceInContext.definition.transformerTestLabel,
    miroirActivityTracker
  );
}
