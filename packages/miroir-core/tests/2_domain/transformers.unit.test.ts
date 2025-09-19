import * as vitest from 'vitest';
import { defaultMetaModelEnvironment } from '../../src/1_core/Model';
import { MiroirActivityTracker } from '../../src/3_controllers/MiroirActivityTracker';
import {
  runTransformerTestInMemory,
  runTransformerTestSuite,
  transformerTestsDisplayResults
} from "../../src/4_services/TestTools";
import {
  currentTestSuite,
} from "./transformersTests_miroir.data";

type VitestNamespace = typeof vitest;

// Access the test file pattern from Vitest's process arguments
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

const testSuiteName = "transformers.unit.test";

// Skip this test when running resolveConditionalSchema pattern
const shouldSkip = filePattern.includes('resolveConditionalSchema');

// ##################################################################################################
const miroirActivityTracker = new MiroirActivityTracker();

afterAll(() => {
  if (!shouldSkip) {
    transformerTestsDisplayResults(
      currentTestSuite,
      filePattern || "",
      testSuiteName,
      miroirActivityTracker
    );
  }
});
// ################################################################################################

if (shouldSkip) {
  console.log("################################ skipping test suite:", testSuiteName);
  console.log("################################ File pattern:", filePattern);
} else {
  await runTransformerTestSuite(
    vitest,
    [],
    currentTestSuite,
    undefined, // filter
    runTransformerTestInMemory,
    defaultMetaModelEnvironment,
    miroirActivityTracker
  );
  
}
