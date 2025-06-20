import * as vitest from 'vitest';
import {
  currentTestSuite,
} from "./transformersTests_miroir.data";
import { runTransformerTestInMemory, runTransformerTestSuite, transformerTestsDisplayResults } from '../../src/4_services/TestTools';


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

afterAll(async () => {
  if (RUN_TEST) {
    transformerTestsDisplayResults(currentTestSuite, RUN_TEST, testSuiteName);
  }
});

// ################################################################################################
const testSuiteName = "transformers.unit.test";
if (RUN_TEST == testSuiteName) {
  await runTransformerTestSuite(vitest, [], currentTestSuite, runTransformerTestInMemory);
} else {
  console.log("################################ skipping test suite:", testSuiteName);
}
