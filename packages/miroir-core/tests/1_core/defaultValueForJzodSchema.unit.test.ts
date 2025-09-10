import * as vitest from 'vitest';
// import { describe, expect, it } from "vitest";
import {
  describe,
  expect,
  TestFramework,
} from "../../src/1_core/test-expect";

import {
  type TransformerTestSuite
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";


// import entityDefinitionTransformerTest from "../../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/405bb1fc-a20f-4def-9d3a-206f72350633.json";
import {
  runTransformerTestInMemory,
  runTransformerTestSuite,
  transformerTestsDisplayResults,
} from "../../src/4_services/TestTools";
import transformerTestSuite_defaultValueForMLSchema from "../../src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/753afec9-f786-4f51-8c46-bd022551a8dd.json";
import { defaultMetaModelEnvironment } from '../../src/1_core/Model';
import { MiroirEventTracker } from "../../src/3_controllers/MiroirEventTracker";


// Access the test file pattern from Vitest's process arguments
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

const eventTracker = new MiroirEventTracker();

// ################################################################################################
const testSuiteName = transformerTestSuite_defaultValueForMLSchema.definition.transformerTestLabel;
const currentFileName = import.meta.url.split('/').pop()?.replace('.ts', '') || '';

// Only run defaultValueForMLSchema test when running resolveConditionalSchema pattern
// This is the opposite logic - we want this test to run ONLY when the pattern matches resolveConditionalSchema
const shouldRun = filePattern.includes('resolveConditionalSchema') || !filePattern;

if (!shouldRun) {
  console.log("################################ skipping test suite:", transformerTestSuite_defaultValueForMLSchema.definition.transformerTestLabel);
  console.log("################################ File pattern:", filePattern, "Current file:", currentFileName);
  vitest.test.skip(testSuiteName, () => {});
} else {
  await runTransformerTestSuite(
    vitest,
    [],
    transformerTestSuite_defaultValueForMLSchema.definition as TransformerTestSuite,
    undefined, // filter
    runTransformerTestInMemory,
    defaultMetaModelEnvironment,
    eventTracker
  );
  transformerTestsDisplayResults(
    transformerTestSuite_defaultValueForMLSchema.definition as TransformerTestSuite,
    filePattern || "",
    transformerTestSuite_defaultValueForMLSchema.definition.transformerTestLabel,
    eventTracker
  );
}


