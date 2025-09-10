import * as vitest from 'vitest';
// import { describe, expect, it } from "vitest";



import { type TransformerTestSuite } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import adminConfigurationDeploymentLibrary from "../../../src/assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json"; //assert { type: "json" };

// import test1 from "../../../src/assets/library_data/9ad64893-5f8f-4eaf-91aa-ffae110f88c8/150bacfd-06d0-4ecb-828d-f5275494448a.json";

// import { json } from "sequelize";
// import { transformerTestSuite_spreadsheet } from "./transformersTests_spreadsheet.data";
import {
  runTransformerTestInMemory,
  runTransformerTestSuite,
  transformerTestsDisplayResults
} from "../../../src/4_services/TestTools";



// import { adminConfigurationDeploymentLibrary } from "../../../dist/index.cjs";
import { DomainState } from "../../../src/0_interfaces/2_domain/DomainControllerInterface";
import { ReduxDeploymentsState } from "../../../src/0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { domainStateToReduxDeploymentsState } from "../../../src/tools";
import domainStateImport from "../../2_domain/domainState.json";


import { defaultMiroirModelEnvironment } from '../../../src/1_core/Model';
import { MiroirEventTracker } from '../../../src/3_controllers/MiroirEventTracker';
import transformerTestSuite_resolveConditionalSchema from "../../../src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/3f025c6c-982d-47ed-8061-50009788773a.json";
import { defaultLibraryModelEnvironment } from '../../../src/1_core/Library';


const domainState: DomainState = domainStateImport as DomainState;
const reduxDeploymentsState: ReduxDeploymentsState = domainStateToReduxDeploymentsState(domainState);


const RUN_TEST= process.env.RUN_TEST
const VITEST_FILTER= process.env.VITEST_FILTER
// Access the test file pattern from Vitest's process arguments
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST", RUN_TEST);
console.log("@@@@@@@@@@@@@@@@@@ VITEST_FILTER", VITEST_FILTER);
console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

// const selectedTestName: string[] = ["error if reduxDeploymentsState is missing when parentUuid is present"];
const selectedTestName: string[] = [];
const eventTracker = new MiroirEventTracker();
const testSuite: TransformerTestSuite = transformerTestSuite_resolveConditionalSchema.definition as TransformerTestSuite;

const selectedTests = selectedTestName.length > 0? Object.fromEntries(Object.entries((testSuite as any).transformerTests).filter(
  ([key, test]) => selectedTestName.includes((test as any).transformerTestLabel)
)): (testSuite as any).transformerTests;
const effectiveTests: TransformerTestSuite = {
  ...testSuite,
  transformerTests: selectedTests as any
} as any;

afterAll(() => {
  if (RUN_TEST == transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel) {
    transformerTestsDisplayResults(
      // transformerTestSuite_resolveConditionalSchema.definition as TransformerTestSuite,
      effectiveTests,
      RUN_TEST,
      transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel,
      eventTracker,
    );
  }
});

// ################################################################################################
const testSuiteName = transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel;
const currentFileName = import.meta.url.split('/').pop()?.replace('.ts', '') || '';
const shouldRun = !filePattern || currentFileName.includes(filePattern) || testSuiteName.includes(filePattern) || 
                  (VITEST_FILTER && testSuiteName.match(VITEST_FILTER));

// if (RUN_TEST == transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel) {
if (shouldRun) {
  // if (!Object.hasOwn(testSuite, "transformerTestType") || (testSuite as any).transformerTests === undefined) {
  if (!Object.hasOwn(testSuite, "transformerTestType") || testSuite.transformerTestType !== "transformerTestSuite" ) {
    throw new Error("No transformerTests found in the test suite definition" +  JSON.stringify(testSuite));
  }
  await runTransformerTestSuite(
    vitest,
    [],
    effectiveTests,
    undefined, // filter
    // {testList: {"resolveConditionalSchema": [
    //   "fails when wrong parentUuid is given",
    //   "error if parentUuid path specified but not given deploymentUuid",
    //   "error if no value found at given parentUuid path",
    //   "resolves schema using legacy single path configuration",
    // ]}}, // filter
    runTransformerTestInMemory,
    // defaultMiroirModelEnvironment,
    defaultLibraryModelEnvironment,
    eventTracker,
  );


  // transformerTestsDisplayResults(
  //   // transformerTestSuite_resolveConditionalSchema.definition as TransformerTestSuite,
  //   effectiveTests,
  //   RUN_TEST,
  //   transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel,
  //   eventTracker,
  // );
} else {
  console.log(
    "################################ skipping test suite:",
    transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel
  );
  console.log("################################ File pattern:", filePattern, "Current file:", currentFileName);
  vitest.test.skip(testSuiteName, () => {});
}
