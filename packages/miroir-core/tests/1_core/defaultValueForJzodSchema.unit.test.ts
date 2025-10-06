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


import {
  runTransformerTestInMemory,
  runTransformerTestSuite,
  runUnitTransformerTests,
  transformerTestsDisplayResults,
} from "../../src/4_services/TestTools";

import transformerTestSuite_defaultValueForMLSchema from "../../src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/753afec9-f786-4f51-8c46-bd022551a8dd.json";
import { defaultMetaModelEnvironment } from '../../src/1_core/Model';
import { MiroirActivityTracker } from "../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from '../../src/3_controllers/MiroirEventService';

// Access the test file pattern from Vitest's process arguments
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);

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
  await runUnitTransformerTests._runTransformerTestSuite(
    vitest,
    [],
    transformerTestSuite_defaultValueForMLSchema.definition as TransformerTestSuite,
    undefined, // filter
    defaultMetaModelEnvironment,
    miroirActivityTracker,
    undefined, // parentTrackingId,
    true, // trackActionsBelow
    runUnitTransformerTests,
  );
  transformerTestsDisplayResults(
    transformerTestSuite_defaultValueForMLSchema.definition as TransformerTestSuite,
    filePattern || "",
    transformerTestSuite_defaultValueForMLSchema.definition.transformerTestLabel,
    miroirActivityTracker
  );
}


