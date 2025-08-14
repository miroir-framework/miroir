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

import transformerTestSuite_jzodTypeCheck from "../../../src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/f8e3c7a1-2b9d-4e6f-8c2a-5d7b9e4f1a8c.json";

const RUN_TEST= process.env.RUN_TEST
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST", RUN_TEST);

const selectedTestName: string[] = [];
const testSuiteName = transformerTestSuite_jzodTypeCheck.definition.transformerTestLabel;
// ################################################################################################
if (RUN_TEST == testSuiteName) {
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
  await runTransformerTestSuite(
    { describe, expect},
    [],
    effectiveTests,
    runTransformerTestInMemory
  );
  transformerTestsDisplayResults(
    effectiveTests,
    RUN_TEST,
    testSuiteName
  );
} else {
  console.log(
    "################################ skipping test suite:",
    testSuiteName,
    "RUN_TEST=", RUN_TEST
  );
}
