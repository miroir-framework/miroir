import { TransformerForBuild, TransformerForBuildOrRuntime, TransformerForRuntime } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement";
import { Step, transformer_extended_apply_wrapper } from "../2_domain/TransformersForRuntime";
import { ignorePostgresExtraAttributes } from "./otherTools";
import { TestSuiteContext } from "./TestSuiteContext";

// ################################################################################################
  export type TransformerTest = {
    transformerTestType: "transformerTest";
    transformerTestLabel: string;
    // deploymentUuid: Uuid;
    transformerName: string;
    // transformer: TransformerForBuild | TransformerForRuntime;
    transformer: TransformerForBuildOrRuntime;
    runTestStep?: Step;
    transformerParams: Record<string, any>;
    transformerRuntimeContext?: Record<string, any>;
    expectedValue: any;
    ignoreAttributes?: string[];
  };
  export type TransformerTestSuite = 
    TransformerTest
   |
  {
    transformerTestType: "transformerTestSuite";
    transformerTestLabel: string;
    transformerTests: Record<string, TransformerTestSuite>;
  }
  
// ################################################################################################
export const globalTimeOut = 30000;
// ################################################################################################
// by default only queryFailure and failureMessage are compared when expectedValue is a Domain2ElementFailed
export const ignoreFailureAttributes:string[] = [
  "applicationSection",
  "deploymentUuid",
  "entityUuid",
  "failureOrigin",
  "instanceUuid",
  "errorStack",
  "innerError",
  "queryContext",
  "queryParameters",
  "queryReference",
  "query",
];
  
// ################################################################################################
export async function runTransformerTestInMemory(
  vitest: any,
  testSuiteNamePath: string[],
  transformerTest: TransformerTest
) {
  const assertionName = transformerTest.transformerTestLabel ?? transformerTest.transformerName;
  console.log(
    "#################################### runTransformerTestInMemory test",
    assertionName,
    "START"
  );
  // TestSuiteContext.setTest(transformerTest.transformerTestLabel);

  const transformer: TransformerForBuild | TransformerForRuntime = transformerTest.transformer;
  const runtimeTransformer: TransformerForRuntime = transformer as any;
  console.log(
    "################################ runTransformerTestInMemory transformerTestParams",
    JSON.stringify(transformerTest, null, 2)
  );

  const interpolation = transformerTest.runTestStep ?? "runtime";
  let rawResult: Domain2QueryReturnType<any>;

  const convertedTransformer = transformer_extended_apply_wrapper(
    "build",
    undefined,
    runtimeTransformer,
    transformerTest.transformerParams,
    transformerTest.transformerRuntimeContext ?? {},
    "value"
  );
  console.log(
    "################################ runTransformerTestInMemory convertedTransformer",
    JSON.stringify(convertedTransformer, null, 2)
  );

  if (interpolation == "runtime" && !convertedTransformer["elementType"]) {
    rawResult = transformer_extended_apply_wrapper(
      "runtime",
      undefined,
      convertedTransformer,
      transformerTest.transformerParams,
      transformerTest.transformerRuntimeContext ?? {}
    );
  } else {
    rawResult = convertedTransformer;
  }

  console.log(
    "################################ runTransformerTestInMemory raw result",
    JSON.stringify(rawResult, null, 2)
  );
  console.log(
    "################################ runTransformerTestInMemory expectedResult",
    JSON.stringify(transformerTest.expectedValue, null, 2)
  );
  const result = ignorePostgresExtraAttributes(rawResult, transformerTest.ignoreAttributes);
  console.log(
    "################################ runTransformerTestInMemory result",
    JSON.stringify(result, null, 2)
  );
  const testSuiteNamePathAsString = TestSuiteContext.testSuitePathName(testSuiteNamePath);
  try {
    vitest
      .expect(result, `${testSuiteNamePathAsString} > ${assertionName}`)
      .toEqual(transformerTest.expectedValue);
    TestSuiteContext.setTestAssertionResult({
      assertionName,
      assertionResult: "ok",
    });
  } catch (error) {
    TestSuiteContext.setTestAssertionResult({
      assertionName,
      assertionResult: "error",
      assertionExpectedValue: transformerTest.expectedValue,
      assertionActualValue: result,
    });
  }

  console.log("############################ test", assertionName, "END");
  return Promise.resolve();
}

// ################################################################################################
export async function runTransformerTestSuite(
  vitest: any,
  // step: Step,
  testSuitePath: string[],
  transformerTestSuite: TransformerTestSuite,
  runTransformerTest: (vitest: any, testSuitePath: string[], transformerTest: TransformerTest) => Promise<void>
) {
  const testSuitePathAsString = TestSuiteContext.testSuitePathName(testSuitePath);
  const testSuiteName = transformerTestSuite.transformerTestLabel??transformerTestSuite.transformerTestType;
  console.log(`@@@@@@@@@@@@@@@@@@@@ running transformer test suite called ${testSuitePathAsString} transformerTestType=${transformerTestSuite.transformerTestType}`);
  TestSuiteContext.setTestSuite(testSuitePathAsString);
  if (transformerTestSuite.transformerTestType == "transformerTest") {
    TestSuiteContext.setTest(transformerTestSuite.transformerTestLabel);
    await runTransformerTest(vitest, testSuitePath, transformerTestSuite);
    TestSuiteContext.setTest(undefined);
  } else {
    // console.log(`running transformer test suite ${testSuiteName} with ${JSON.stringify(Object.keys(transformerTestSuite.transformerTests))} tests`);

    console.log(`handling transformer test suite ${testSuitePath} with transformerTests=${JSON.stringify(Object.values(transformerTestSuite.transformerTests), null, 2)} tests`);
    await vitest.describe.each(Object.values(transformerTestSuite.transformerTests))(
      "test $currentTestSuiteName",
      async (transformerTestParam: TransformerTestSuite) => {
        console.log(`calling inner transformer test suite of ${testSuitePath} called ${transformerTestParam.transformerTestLabel}`);
        // TestSuiteContext.setTestSuite(undefined);
        await runTransformerTestSuite(
          vitest,
          // step,
          // [...testSuiteName, transformerTestParam.transformerTestLabel],
          [...testSuitePath, testSuiteName],
          transformerTestParam,
          runTransformerTest
        );
      },
      globalTimeOut
    );
    console.log(`finished running transformer subtests for test suite ${testSuitePath}`);
  }
  console.log(`@@@@@@@@@@@@@@@@@@@@ finished running transformer test suite ${JSON.stringify(testSuitePath)}`);
  // TestSuiteContext.resetContext();
}

// ################################################################################################
export const testSuites = (transformerTestSuite: TransformerTestSuite):string[][] => {
  const result: string[][] = [];

  const traverseTestSuites = (suite: TransformerTestSuite, path: string[] = []) => {
    if (suite.transformerTestType === "transformerTestSuite") {
      const newPath = [...path, suite.transformerTestLabel];
      const subSuites = Object.values(suite.transformerTests);

      if (subSuites.length === 0 || subSuites.every((subSuite) => subSuite.transformerTestType === "transformerTest")) {
        result.push(newPath);
      } else {
        for (const subSuite of subSuites) {
          if (subSuite.transformerTestType === "transformerTestSuite") {
            traverseTestSuites(subSuite, newPath);
          }
        }
      }
    }
  };

  traverseTestSuites(transformerTestSuite);
  return result;
}


// ################################################################################################
export function displayTestSuiteResults(
  expect: any, // vitest.expect
  currentTestSuiteName: string) {
  console.log("============ results of testSuite: ", currentTestSuiteName);
  const globalTestSuiteResults = TestSuiteContext.getTestSuiteResult(currentTestSuiteName);
  // console.log("globalTestSuiteResults", JSON.stringify(globalTestSuiteResults, null, 2));
  // console.log("============ results of testSuite: ", currentTestSuiteName);
  for (const testResult of Object.values(globalTestSuiteResults[currentTestSuiteName])) {
    if (testResult.testResult !== "ok") {
      for (const [testAssertionLabel, testAssertionResult] of Object.entries(testResult.testAssertionsResults)) {
        if (testAssertionResult.assertionResult !== "ok") {
          console.log("  testAssertionResult", JSON.stringify(testAssertionResult, null, 2));
          expect(
            testAssertionResult.assertionActualValue,
            `${currentTestSuiteName} > ${testResult.testLabel} > ${testAssertionLabel} failed!`
          ).toEqual(testAssertionResult.assertionExpectedValue);
        }
      }
    } else {
      // console.log("testResult", JSON.stringify(testResult, null, 2));
      expect(testResult.testResult, `${currentTestSuiteName} > ${testResult.testLabel} failed!`).toBe("ok");
      console.log(" ",testResult.testLabel, ": ok");
    }
  }
  // console.log("============ end of results of testSuite", currentTestSuiteName);
}

// ################################################################################################
export function displayTestSuiteResultsDetails(
  expect: any, // vitest.expect
  currentTestSuiteName: string) {
  console.log("============ detailed results of testSuite: ", currentTestSuiteName);
  const globalTestSuiteResults = TestSuiteContext.getTestSuiteResult(currentTestSuiteName);
  for (const testResult of Object.values(globalTestSuiteResults[currentTestSuiteName])) {
    console.log(`Test: ${testResult.testLabel}`);
    for (const [testAssertionLabel, testAssertionResult] of Object.entries(testResult.testAssertionsResults)) {
      console.log(`  Assertion: ${testAssertionLabel} ${testAssertionResult.assertionResult}`);
      // console.log(`    Expected: ${testAssertionResult.assertionExpectedValue}`);
      // console.log(`    Actual: ${testAssertionResult.assertionActualValue}`);
      // console.log(`    Result: ${testAssertionResult.assertionResult}`);
      if (testAssertionResult.assertionResult !== "ok") {
        expect(
          testAssertionResult.assertionActualValue,
          `${currentTestSuiteName} > ${testResult.testLabel} > ${testAssertionLabel} failed!`
        ).toBe(testAssertionResult.assertionExpectedValue);
      }
    }
    if (testResult.testResult !== "ok") {
      expect(testResult.testResult, `${currentTestSuiteName} > ${testResult.testLabel} failed!`).toBe("ok");
    }
  }
  console.log("============ end of results of testSuite");
}

// ################################################################################################
export const transformerTestsDisplayResults = (
  transformerTestSuite: TransformerTestSuite,
  RUN_TEST: string,
  testSuiteName: string
) => {
  if (RUN_TEST == testSuiteName) {
    console.log(
      "#################################### afterAll",
      testSuiteName,
      "testResults",
      JSON.stringify(TestSuiteContext.testAssertionsResults, null, 2)
    );
    // const testSuitesPaths = testSuites(transformerTestSuite_miroirTransformers);
    const testSuitesPaths = testSuites(transformerTestSuite);
    const testSuitesNames = testSuitesPaths.map(TestSuiteContext.testSuitePathName);
    // console.log("#################################### afterAll TestSuites:", testSuitesPaths);
    console.log("#################################### afterAll", testSuiteName, "TestSuites names:", testSuitesNames);
    console.log("#################################### afterAll", testSuiteName, "TestResults:");
    for (const testSuiteName of testSuitesNames) {
      displayTestSuiteResults(expect, testSuiteName);
      console.log("");
    }
    TestSuiteContext.resetResults();
  }
};
