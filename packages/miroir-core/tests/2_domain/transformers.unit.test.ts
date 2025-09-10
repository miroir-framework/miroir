import * as vitest from 'vitest';
import { defaultMetaModelEnvironment } from '../../src/1_core/Model';
import { MiroirEventTracker } from '../../src/3_controllers/MiroirEventTracker';
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
function getCommandLineArgs() {
  const args = process.argv.slice(2);
  const params: { [key: string]: string } = {};
  args.forEach(arg => {
    const [key, value] = arg.split('=');
    if (key.startsWith('--')) {
      params[key.slice(2)] = value;
    }
  });
  return params;
}

// Get command line parameters
const params = getCommandLineArgs();
const miroirEventTracker = new MiroirEventTracker();

afterAll(() => {
  if (!shouldSkip) {
    transformerTestsDisplayResults(
      currentTestSuite,
      filePattern || "",
      testSuiteName,
      miroirEventTracker
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
    miroirEventTracker
  );
  
}
