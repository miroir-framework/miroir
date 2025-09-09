// import * as vitest from 'vitest';
// import { describe, expect, it } from "vitest";
import {
  describe,
  expect,
} from "../../../src/1_core/test-expect";

import {
  type TransformerTestSuite,
} from "../../../src//0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import {
  runTransformerTestInMemory,
  runTransformerTestSuite,
  transformerTestsDisplayResults,
} from "../../../src/4_services/TestTools";

import { MiroirEventTracker } from "../../../src/3_controllers/MiroirEventTracker";
import { defaultMetaModelEnvironment } from "../../../src/1_core/Model";

import transformerTestSuite_unfoldSchemaOnce from "../../../src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/e8b5d1a2-9473-4f6c-b2e8-7f8a5c6d9e0f.json";

const RUN_TEST= process.env.RUN_TEST
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST", RUN_TEST);

const selectedTestName: string[] = [];

// ################################################################################################
// const testSuiteName = "transformers.unit.test";
if (RUN_TEST == transformerTestSuite_unfoldSchemaOnce.definition.transformerTestLabel) {
  const miroirEventTracker = new MiroirEventTracker();
  
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
  await runTransformerTestSuite(
    { describe, expect } as any, //vitest,
    [],
    effectiveTests,
    undefined, // filter
    runTransformerTestInMemory,
    defaultMetaModelEnvironment,
    miroirEventTracker
  );
  transformerTestsDisplayResults(
    effectiveTests,
    RUN_TEST,
    transformerTestSuite_unfoldSchemaOnce.definition.transformerTestLabel,
    miroirEventTracker
  );
} else {
  console.log(
    "################################ skipping test suite:",
    transformerTestSuite_unfoldSchemaOnce.definition.transformerTestLabel
  );
}
