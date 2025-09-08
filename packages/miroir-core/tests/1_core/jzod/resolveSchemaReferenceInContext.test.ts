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

import { MiroirEventTracker } from "../../../src/3_controllers/MiroirEventTracker";
import { defaultMiroirModelEnvironment } from "../../../src/1_core/Model";

import transformerTestSuite_resolveSchemaReferenceInContext from "../../../src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/b9e7f4d5-6543-4a1b-9c8d-987654321fed.json";

const RUN_TEST= process.env.RUN_TEST
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST", RUN_TEST);

const selectedTestName: string[] = [];

// ################################################################################################
// launch with: RUN_TEST=resolveSchemaReferenceInContext npm run testByFile -w miroir-core -- resolveSchemaReferenceInContext.test
// const testSuiteName = "transformers.unit.test";
if (RUN_TEST == transformerTestSuite_resolveSchemaReferenceInContext.definition.transformerTestLabel) {
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
  
  const miroirEventTracker = new MiroirEventTracker();
  
  await runTransformerTestSuite(
    // { describe, expect} as any,//vitest,
    vitest,
    [],
    // transformerTestSuite_resolveSchemaReferenceInContext.definition as TransformerTestSuite,
    effectiveTests,
    runTransformerTestInMemory,
    defaultMiroirModelEnvironment,
    miroirEventTracker
  );
  transformerTestsDisplayResults(
    // transformerTestSuite_resolveSchemaReferenceInContext.definition as TransformerTestSuite,
    effectiveTests,
    RUN_TEST,
    transformerTestSuite_resolveSchemaReferenceInContext.definition.transformerTestLabel,
    miroirEventTracker
  );
} else {
  console.log(
    "################################ skipping test suite:",
    transformerTestSuite_resolveSchemaReferenceInContext.definition.transformerTestLabel
  );
}
