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


const RUN_TEST= process.env.RUN_TEST
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST", RUN_TEST);
const eventTracker = new MiroirEventTracker();

// ################################################################################################
afterAll(async () => {
  if (RUN_TEST) {
    transformerTestsDisplayResults(
      transformerTestSuite_defaultValueForMLSchema.definition as TransformerTestSuite,
      RUN_TEST,
      transformerTestSuite_defaultValueForMLSchema.definition.transformerTestLabel,
      eventTracker
      // defaultMetaModelEnvironment,
    );
  }
});

// ################################################################################################
// const testSuiteName = "transformers.unit.test";
// launch with: RUN_TEST=defaultValueForMLSchema npm run testByFile -w miroir-core -- defaultValueForJzodSchema
if (RUN_TEST == transformerTestSuite_defaultValueForMLSchema.definition.transformerTestLabel) {
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
    RUN_TEST,
    transformerTestSuite_defaultValueForMLSchema.definition.transformerTestLabel,
    eventTracker
    // defaultMetaModelEnvironment,
  );
} else {
  console.log("################################ skipping test suite:", transformerTestSuite_defaultValueForMLSchema.definition.transformerTestLabel);
}


