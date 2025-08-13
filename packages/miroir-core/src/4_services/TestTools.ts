import {
  TransformerForBuild,
  TransformerForBuildOrRuntime,
  TransformerForRuntime,
  type TransformerTest,
  type TransformerTestSuite,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  Action2ReturnType,
  Action2Success,
  Domain2ElementFailed,
  Domain2QueryReturnType,
} from "../0_interfaces/2_domain/DomainElement";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { transformer_extended_apply_wrapper } from "../2_domain/TransformersForRuntime";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { MiroirLoggerFactory } from "./LoggerFactory";
import { ignorePostgresExtraAttributes } from "./otherTools";
import { TestSuiteContext } from "./TestSuiteContext";


// ################################################################################################
// Jzod schemas for TransformerTest and TransformerTestSuite

export const transformerTestJzodSchema = {
  type: "object",
  definition: {
    transformerTestType: { type: "literal", definition: "transformerTest" },
    transformerTestLabel: { type: "string" },
    transformerName: { type: "string" },
    transformer: { type: "any" },
    runTestStep: { type: "string", optional: true },
    transformerParams: { type: "record", definition: { type: "any" } },
    transformerRuntimeContext: {
      type: "record",
      definition: { type: "any" },
      optional: true,
    },
    expectedValue: { type: "any" },
    ignoreAttributes: {
      type: "array",
      definition: { type: "string" },
      optional: true,
    },
  },
};

export const transformerTestSuiteJzodSchema = {
  type: "union",
  discriminator: "transformerTestType",
  definition: [
    { type: "schemaReference", definition: { relativePath: "transformerTestJzodSchema" } },
    {
      type: "object",
      definition: {
        transformerTestType: { type: "literal", definition: "transformerTestSuite" },
        transformerTestLabel: { type: "string" },
        transformerTests: {
          type: "record",
          definition: {
            type: "schemaReference",
            definition: { relativePath: "transformerTestSuiteJzodSchema" },
          },
        },
      },
    },
  ],
};

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TestTools")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export const globalTimeOut = 30000;
// ################################################################################################
// by default only queryFailure and failureMessage are compared when expectedValue is a Domain2ElementFailed
export const ignoreFailureAttributes: string[] = [
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
  localVitest: any,
  testSuiteNamePath: string[],
  transformerTest: TransformerTest
) {
  const assertionName = transformerTest.transformerTestLabel ?? transformerTest.transformerName;
  console.log(
    "#################################### runTransformerTestInMemory test",
    assertionName,
    "START"
  );
  // console.log(
  //   "################################ runTransformerTestInMemory vitest",
  //   JSON.stringify(vitest, null, 2)
  // );
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
    result
    // JSON.stringify(result, null, 2)
  );
  const testSuiteNamePathAsString = TestSuiteContext.testSuitePathName(testSuiteNamePath);
  try {
    // real vitest throws an exception if the assertion fails, simulated vitest does not throw an exception
    // console.log(
    //   "################################ runTransformerTestInMemory calling localVitest.expect"
    // );
    const expectForm = localVitest
      .expect(result, `${testSuiteNamePathAsString} > ${assertionName}`)
    // console.log(
    //   "################################ runTransformerTestInMemory localVitest.expect called expectForm", expectForm
    // );
    const testResult = expectForm.toEqual(transformerTest.expectedValue);
    console.log(
      "################################ runTransformerTestInMemory testResult",
      JSON.stringify(testResult, null, 2)
    );
    if (!Object.hasOwn(testResult, "result")) {
      // vitest case
      TestSuiteContext.setTestAssertionResult({
        assertionName,
        assertionResult: "ok",
      });
    } else {
      // simulated vitest case
      if (testResult.result) {
        TestSuiteContext.setTestAssertionResult({
          assertionName,
          assertionResult: "ok",
        });
      } else {
        // TODO: use returned message from the testResult?
        TestSuiteContext.setTestAssertionResult({
          assertionName,
          assertionResult: "error",
          assertionExpectedValue: transformerTest.expectedValue,
          assertionActualValue: result,
        });
      };
    }
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
  runTransformerTest: (
    vitest: any,
    testSuitePath: string[],
    transformerTest: TransformerTest
  ) => Promise<void>
) {
  const testSuitePathAsString = TestSuiteContext.testSuitePathName(testSuitePath);
  const testSuiteName =
    transformerTestSuite.transformerTestLabel ?? transformerTestSuite.transformerTestType;
  console.log(
    `@@@@@@@@@@@@@@@@@@@@ running transformer test suite called ${testSuitePathAsString} transformerTestType=${transformerTestSuite.transformerTestType}`
  );
  if (!vitest.expect) {
    throw new Error(
      "runTransformerTestSuite called without vitest.expect, this is not a test environment"
    );
  } else {
    log.info(
      `runTransformerTestSuite called for ${testSuitePathAsString} with transformerTestType=${transformerTestSuite.transformerTestType}`,
      "vitest",
      vitest
    );
  }

  TestSuiteContext.setTestSuite(testSuitePathAsString);
  if (transformerTestSuite.transformerTestType == "transformerTest") {
    TestSuiteContext.setTest(transformerTestSuite.transformerTestLabel);
    await runTransformerTest(vitest, testSuitePath, transformerTestSuite);
    TestSuiteContext.setTest(undefined);
  } else {
    // console.log(`running transformer test suite ${testSuiteName} with ${JSON.stringify(Object.keys(transformerTestSuite.transformerTests))} tests`);

    console.log(
      `handling transformer test suite ${testSuitePath} with transformerTests=${JSON.stringify(
        Object.values(transformerTestSuite.transformerTests),
        null,
        2
      )} tests`
    );
    await vitest.describe.each(Object.values(transformerTestSuite.transformerTests))(
      "test $currentTestSuiteName",
      async (transformerTestParam: TransformerTestSuite) => {
        console.log(
          `calling inner transformer test suite of ${testSuitePath} called ${transformerTestParam.transformerTestLabel}`
        );
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
  console.log(
    `@@@@@@@@@@@@@@@@@@@@ finished running transformer test suite ${JSON.stringify(testSuitePath)}`
  );
  // TestSuiteContext.resetContext();
}
// ################################################################################################
function isJson(t: any) {
  // return t == "json" || t == "json_array" || t == "tableOf1JsonColumn";
  return typeof t == "object" && t !== null;
}

// ################################################################################################
function isJsonArray(t: any) {
  // return t == "json" || t == "json_array" || t == "tableOf1JsonColumn";
  return Array.isArray(t);
  // return typeof t == "object" && t !== null && Array.isArray(t);
}

// ################################################################################################
export function runTransformerIntegrationTest(sqlDbDataStore: any) {
  return async (vitest: any, testNameArray: string[], transformerTest: TransformerTest) => {
    const testSuitePathName = TestSuiteContext.testSuitePathName(testNameArray);
    const testRunStep = transformerTest.runTestStep ?? "runtime";
    // const runAsSql = false;
    const runAsSql = true;

    console.log("runTransformerIntegrationTest called for", testSuitePathName, "START");

    if (!vitest.expect) {
      throw new Error(
        "runTransformerIntegrationTest called without vitest.expect, this is not a test environment"
      );
    }

    let queryResult: Action2ReturnType;
    console.log(
      "runTransformerIntegrationTest",
      testSuitePathName,
      "running runtime on sql transformerTest",
      transformerTest
    );

    // resolve the transformer to be used in the test
    const resolvedTransformer: Domain2QueryReturnType<TransformerForRuntime> =
      transformer_extended_apply_wrapper(
        "build",
        (transformerTest.transformer as any)?.label,
        transformerTest.transformer,
        transformerTest.transformerParams,
        transformerTest.transformerRuntimeContext ?? {},
        "value" // resolveBuildTransformerTo
      );

    console.log(
      "runTransformerIntegrationTest",
      testSuitePathName,
      "resolvedTransformer",
      JSON.stringify(resolvedTransformer, null, 2)
    );

    if (resolvedTransformer instanceof Domain2ElementFailed) {
      console.log(
        "runTransformerIntegrationTest",
        testSuitePathName,
        "build step found failed: resolvedTransformer",
        resolvedTransformer
      );
      try {
        const resultToCompare = ignorePostgresExtraAttributes(
          resolvedTransformer as any,
          transformerTest.ignoreAttributes
        );

        vitest.expect(resultToCompare, testSuitePathName).toEqual(transformerTest.expectedValue);
        TestSuiteContext.setTestAssertionResult({
          assertionName: testSuitePathName,
          assertionResult: "ok",
        });
      } catch (error) {
        TestSuiteContext.setTestAssertionResult({
          assertionName: testSuitePathName,
          assertionResult: "error",
          assertionExpectedValue: transformerTest.expectedValue,
          assertionActualValue: resolvedTransformer,
        });
      }
      return;
    }

    if (testRunStep == "build") {
      queryResult = {
        status: "ok",
        returnedDomainElement: resolvedTransformer as any,
      };
    } else {
      queryResult = await sqlDbDataStore.handleBoxedQueryAction({
        actionType: "runBoxedQueryAction",
        actionName: "runQuery",
        deploymentUuid: "",
        endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        payload: {
          applicationSection: "data",
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            runAsSql,
            pageParams: {},
            queryParams: {
              ...transformerTest.transformerParams,
              ...transformerTest.transformerRuntimeContext,
            },
            contextResults: runAsSql
              ? Object.fromEntries(
                  // there's a trick for runAsSql in order to be able to test transformers taking context parameters
                  Object.entries(transformerTest.transformerRuntimeContext ?? {}).map(
                    (e: [string, any]) => [
                      e[0],
                      {
                        type: isJsonArray(e[1])
                          ? "json_array"
                          : isJson(e[1])
                          ? "json"
                          : typeof e[1],
                      },
                    ]
                  )
                )
              : transformerTest.transformerRuntimeContext ?? {},
            deploymentUuid: "",
            runtimeTransformers: {
              // transformer: (transformerTest as any).transformer,
              transformer: resolvedTransformer,
            },
          },
        },
      });
    }

    // console.log(testSuitePathName, "WWWWWWWWWWWWWWWWWW queryResult", JSON.stringify(queryResult, null, 2));
    console.log(
      testSuitePathName,
      "WWWWWWWWWWWWWWWWWW queryResult",
      JSON.stringify(queryResult, null, 2)
    );
    // console.log(testSuitePathName, "WWWWWWWWWWWWWWWWWW queryResult cannot use 'instanceof' to determine error", queryResult instanceof Action2Error, Object.hasOwn(queryResult,"errorType"));
    let resultToCompare: any;
    try {
      // if (queryResult instanceof Action2Error) { // DOES NOT WORK, because we use the local version of the class, not the version of the class that is available in the miroir-core package
      if (queryResult["status"] == "error") {
        // cannot use 'instanceof' to determine error because we use the local version of the class, not the version of the class that is available in the miroir-core package
        resultToCompare = ignorePostgresExtraAttributes(
          (queryResult as any).innerError,
          transformerTest.ignoreAttributes
        );
        console.log(
          testSuitePathName,
          "WWWWWWWWWWWWWWWWWW queryResult instance of Action2Error:",
          JSON.stringify(resultToCompare, null, 2)
        );

        vitest
          .expect(
            resultToCompare,
            testSuitePathName + "comparing received query error to expected result"
          )
          .toEqual(transformerTest.expectedValue);
      } else {
        console.log(testSuitePathName, "WWWWWWWWWWWWWWWWWW query Succeeded!");
        resultToCompare =
          testRunStep == "runtime"
            ? ignorePostgresExtraAttributes(
                (queryResult as Action2Success).returnedDomainElement.transformer,
                transformerTest.ignoreAttributes
              )
            : (queryResult as Action2Success).returnedDomainElement;
        console.log(testSuitePathName, "testResult", JSON.stringify(resultToCompare, null, 2));
        console.log(testSuitePathName, "expectedValue", transformerTest.expectedValue);
        vitest.expect(resultToCompare, testSuitePathName).toEqual(transformerTest.expectedValue);
      }
      TestSuiteContext.setTestAssertionResult({
        assertionName: testSuitePathName,
        assertionResult: "ok",
      });
    } catch (error) {
      TestSuiteContext.setTestAssertionResult({
        assertionName: testSuitePathName,
        assertionResult: "error",
        assertionExpectedValue: transformerTest.expectedValue,
        assertionActualValue: resultToCompare,
      });
    }

    console.log(testNameArray, "END");
  };
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const testSuites = (transformerTestSuite: TransformerTestSuite): string[][] => {
  const result: string[][] = [];

  const traverseTestSuites = (suite: TransformerTestSuite, path: string[] = []) => {
    if (suite.transformerTestType === "transformerTestSuite") {
      const newPath = [...path, suite.transformerTestLabel];
      const subSuites = Object.values(suite.transformerTests);

      if (
        subSuites.length === 0 ||
        subSuites.every((subSuite) => subSuite.transformerTestType === "transformerTest")
      ) {
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
};

// ################################################################################################
export function displayTestSuiteResults(
  expect: any, // vitest.expect
  currentTestSuiteName: string
) {
  console.log("============ results of testSuite: ", currentTestSuiteName);
  const globalTestSuiteResults = TestSuiteContext.getTestSuiteResult(currentTestSuiteName);
  // console.log("globalTestSuiteResults", JSON.stringify(globalTestSuiteResults, null, 2));
  // console.log("============ results of testSuite: ", currentTestSuiteName);
  for (const testResult of Object.values(globalTestSuiteResults[currentTestSuiteName])) {
    if (testResult.testResult !== "ok") {
      for (const [testAssertionLabel, testAssertionResult] of Object.entries(
        testResult.testAssertionsResults
      )) {
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
      expect(
        testResult.testResult,
        `${currentTestSuiteName} > ${testResult.testLabel} failed!`
      ).toBe("ok");
      console.log(" ", testResult.testLabel, ": ok");
    }
  }
  // console.log("============ end of results of testSuite", currentTestSuiteName);
}

// ################################################################################################
export function displayTestSuiteResultsDetails(
  expect: any, // vitest.expect
  currentTestSuiteName: string
) {
  console.log("============ detailed results of testSuite: ", currentTestSuiteName);
  const globalTestSuiteResults = TestSuiteContext.getTestSuiteResult(currentTestSuiteName);
  for (const testResult of Object.values(globalTestSuiteResults[currentTestSuiteName])) {
    console.log(`Test: ${testResult.testLabel}`);
    for (const [testAssertionLabel, testAssertionResult] of Object.entries(
      testResult.testAssertionsResults
    )) {
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
      expect(
        testResult.testResult,
        `${currentTestSuiteName} > ${testResult.testLabel} failed!`
      ).toBe("ok");
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
      "#################################### transformerTestsDisplayResults",
      testSuiteName,
      "testResults",
      JSON.stringify(TestSuiteContext.testAssertionsResults, null, 2)
    );
    // const testSuitesPaths = testSuites(transformerTestSuite_miroirTransformers);
    const testSuitesPaths = testSuites(transformerTestSuite);
    const testSuitesNames = testSuitesPaths.map(TestSuiteContext.testSuitePathName);
    // console.log("#################################### afterAll TestSuites:", testSuitesPaths);
    console.log(
      "#################################### transformerTestsDisplayResults",
      testSuiteName,
      "TestSuites names:",
      testSuitesNames
    );
    console.log("#################################### transformerTestsDisplayResults", testSuiteName, "TestResults:");
    for (const testSuiteName of testSuitesNames) {
      displayTestSuiteResults(expect, testSuiteName);
      console.log("");
    }
    TestSuiteContext.resetResults();
  }
};
