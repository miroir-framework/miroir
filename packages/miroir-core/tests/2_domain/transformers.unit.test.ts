import * as vitest from 'vitest';
import {
  currentTestSuite,
} from "./transformersTests_miroir.data";
import { displayTestSuiteResultsDetails, runTransformerTestInMemory, runTransformerTestSuite, transformerTestsDisplayResults } from '../../src/4_services/TestTools';
import { MiroirEventTracker } from '../../src/3_controllers/MiroirEventTracker';
import { MiroirModelEnvironment } from '../../src/0_interfaces/1_core/Transformer';
import { defaultMiroirModelEnviroment } from '../../src/1_core/Model';

type VitestNamespace = typeof vitest;

// const env:any = (import.meta as any).env
// const env:any = (process as any).env
// console.log("@@@@@@@@@@@@@@@@@@ env", JSON.stringify(env, null, 2));

const RUN_TEST= process.env.RUN_TEST
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST", RUN_TEST);
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
// // console.log('@@@@@@@@@@@@@@@@@@@@@@@ Command line parameters:', JSON.stringify(params, null, 2));
// console.log('@@@@@@@@@@@@@@@@@@@@@@@ Command line parameters:', JSON.stringify(process.argv, null, 2));
// // console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);
// console.log("@@@@@@@@@@@@@@@@@@ vitest",vitest.describe)
// describe.sequential("templatesDEFUNCT.unit.test", () => {
const miroirEventTracker = new MiroirEventTracker();

afterAll(async () => {
  if (RUN_TEST) {
    await transformerTestsDisplayResults(currentTestSuite, RUN_TEST, testSuiteName, miroirEventTracker);
    // await displayTestSuiteResultsDetails(
    //   // currentTestSuite,
    //   RUN_TEST,
    //   // testSuiteName,
    //   [],
    //   miroirEventTracker
    // );
  }
});

// ################################################################################################
const testSuiteName = "transformers.unit.test";

if (RUN_TEST == testSuiteName) {
  await runTransformerTestSuite(
    vitest,
    [],
    currentTestSuite,
    runTransformerTestInMemory,
    defaultMiroirModelEnviroment,
    miroirEventTracker
  );
} else {
  console.log("################################ skipping test suite:", testSuiteName);
}
