import * as vitest from 'vitest';

import { type TransformerTestSuite } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultMetaModelEnvironment } from '../../../src/1_core/Model';
import { MiroirActivityTracker } from '../../../src/3_controllers/MiroirActivityTracker';
import {
  runUnitTransformerTests,
  transformerTestsDisplayResults
} from "../../../src/4_services/TestTools";
import { transformerTest_resolveConditionalSchema as transformerTestSuite_resolveConditionalSchema } from "miroir-test-app_deployment-miroir";


// const domainState: DomainState = domainStateImport as DomainState;
// const reduxDeploymentsState: ReduxDeploymentsState = domainStateToReduxDeploymentsState(domainState);


const RUN_TEST= process.env.RUN_TEST
const VITEST_FILTER= process.env.VITEST_FILTER
// Access the test file pattern from Vitest's process arguments
const vitestArgs = process.argv.slice(2);
const filePattern = vitestArgs.find(arg => !arg.startsWith('-')) || '';
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST", RUN_TEST);
console.log("@@@@@@@@@@@@@@@@@@ VITEST_FILTER", VITEST_FILTER);
console.log("@@@@@@@@@@@@@@@@@@ File Pattern:", filePattern);

// const selectedTestName: string[] = ["error if reduxDeploymentsState is missing when parentUuid is present"];
const selectedTestName: string[] = [
  // "resolves schema using legacy single path configuration"
];
const activityTracker = new MiroirActivityTracker();
const testSuite: TransformerTestSuite = transformerTestSuite_resolveConditionalSchema.definition as TransformerTestSuite;

console.log("testSuite transformerTests:", Object.keys((testSuite as any).transformerTests).length);
console.log("testSuite transformerTests:", Object.entries((testSuite as any).transformerTests).map(([key, test]) => (test as any).transformerTestLabel));
const selectedTests =
  selectedTestName.length > 0
    ? Object.fromEntries(
        Object.entries((testSuite as any).transformerTests).filter(([key, test]) =>
          selectedTestName.includes((test as any).transformerTestLabel),
        ),
      )
    : (testSuite as any).transformerTests;
console.log("testSuite selectedTests:", Object.entries(selectedTests).map(([key, test]) => (test as any).transformerTestLabel));

const effectiveTests: TransformerTestSuite = {
  ...testSuite,
  transformerTests: selectedTests as any
} as any;

vitest.afterAll(() => {
  if (RUN_TEST == transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel) {
    transformerTestsDisplayResults(
      // transformerTestSuite_resolveConditionalSchema.definition as TransformerTestSuite,
      effectiveTests,
      RUN_TEST,
      transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel,
      activityTracker,
    );
  }
});

// ################################################################################################
const testSuiteName = transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel;
const currentFileName = (typeof __filename !== 'undefined'
  ? __filename.split(/[\\/]/).pop()?.replace('.ts', '')
  : '') || '';
const shouldRun = !filePattern || currentFileName.includes(filePattern) || testSuiteName.includes(filePattern) || 
                  (VITEST_FILTER && testSuiteName.match(VITEST_FILTER));

// if (RUN_TEST == transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel) {
if (shouldRun) {
  // if (!Object.hasOwn(testSuite, "transformerTestType") || (testSuite as any).transformerTests === undefined) {
  if (!Object.hasOwn(testSuite, "transformerTestType") || testSuite.transformerTestType !== "transformerTestSuite" ) {
    throw new Error("No transformerTests found in the test suite definition" +  JSON.stringify(testSuite));
  }
  await runUnitTransformerTests._runTransformerTestSuite(
    vitest,
    [],
    effectiveTests,
    // undefined, // filter
    {testList: {"resolveConditionalSchema": [
      // "error if parentUuid path specified but not given deploymentUuid",
      "fails when wrong parentUuid is given",
      // "error if no value found at given parentUuid path",
      // "resolves schema using legacy single path configuration",
    ]}}, // filter
    defaultMetaModelEnvironment,
    activityTracker,
    undefined, // parentTrackingId,
    true, // trackActionsBelow
    runUnitTransformerTests,
  );
} else {
  console.log(
    "################################ skipping test suite:",
    transformerTestSuite_resolveConditionalSchema.definition.transformerTestLabel
  );
  console.log("################################ File pattern:", filePattern, "Current file:", currentFileName);
  vitest.test.skip(testSuiteName, () => {});
}
