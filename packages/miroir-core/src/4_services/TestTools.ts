import * as vitest from 'vitest';
type VitestNamespace = typeof vitest;
import chalk from 'chalk';
// chalk.enabled = true
chalk.level = 3;

import {
  TransformerForRuntime,
  type TestAssertionResult,
  type TestsResults,
  type TestSuiteResult,
  type TransformerForBuildPlusRuntime,
  type TransformerTest,
  type TransformerTestSuite
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import {
  Action2ReturnType,
  Action2Success,
  Domain2ElementFailed,
  Domain2QueryReturnType,
} from "../0_interfaces/2_domain/DomainElement";
import type { MiroirEventTrackerInterface, TestAssertionPath } from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { jsonify } from "../1_core/test-expect";
import { transformer_extended_apply_wrapper } from "../2_domain/TransformersForRuntime";
import { MiroirEventTracker } from "../3_controllers/MiroirEventTracker";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { MiroirLoggerFactory } from "./LoggerFactory";
import { ignorePostgresExtraAttributes, isJson, isJsonArray, removeUndefinedProperties, unNullify } from "./otherTools";
import { circularReplacer } from '../tools';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TestTools")
).then((logger: LoggerInterface) => {log = logger});

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
export const compareFailureAttributes: string[] = [
  "queryFailure",
];

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export async function runTransformerTestInMemory(
  // localVitest: any,
  localVitest: typeof vitest,
  testNamePath: string[],
  transformerTest: TransformerTest,
  modelEnvironment: MiroirModelEnvironment,
  miroirEventTracker: MiroirEventTrackerInterface, // Optional unified tracker for test execution tracking
  testAssertionPath?: TestAssertionPath, // Explicit test path passed down from the suite
) {
  const testName = transformerTest.transformerTestLabel ?? transformerTest.transformerName;
  const assertionName = transformerTest.transformerTestLabel ?? transformerTest.transformerName;
  log.info(
    "#################################### runTransformerTestInMemory test",
    assertionName,
    "START"
  );
  
  // Start tracking individual test execution in unified tracker if available
  let testTrackingId: string | undefined;
  let testAssertionTrackingId: string | undefined;
  if (miroirEventTracker) {
    try {
      // Get the current active test suite ID as parent
      const testParentId = miroirEventTracker.getCurrentEventId();
      testTrackingId = miroirEventTracker.startTest(testName, testParentId);
      log.info(`🧪 Started tracking test ${testName} with ID: ${testTrackingId}, parent: ${testParentId}`);
      const testAssertionParentId = miroirEventTracker.getCurrentEventId();
      testAssertionTrackingId = miroirEventTracker.startTestAssertion(assertionName, testTrackingId);
      log.info(`🧪 Started tracking test assertion ${assertionName} with ID: ${testAssertionTrackingId}, parent: ${testAssertionParentId}`);
    } catch (error) {
      console.warn(`Failed to start tracking test ${testName}:`, error);
      console.warn(`Failed to start tracking test assertion ${assertionName}:`, error);
    }
  }
  // log.info(
  //   "################################ runTransformerTestInMemory vitest",
  //   JSON.stringify(vitest, null, 2)
  // );
  // miroirEventTracker.setTest(transformerTest.transformerTestLabel);
  miroirEventTracker.setTest(transformerTest.transformerTestLabel);
  // as there is only 1 assertion per test, we use the test name as the assertion name
  miroirEventTracker.setTestAssertion(transformerTest.transformerTestLabel);

  // const transformer: TransformerForBuild | TransformerForRuntime = transformerTest.transformer;
  const transformer: TransformerForBuildPlusRuntime = transformerTest.transformer;
  const runtimeTransformer: TransformerForRuntime = transformer as any;
  // log.info(
  //   "################################ runTransformerTestInMemory transformerTestParams",
  //   JSON.stringify(transformerTest, null, 2)
  // );

  const interpolation = transformerTest.runTestStep ?? "runtime";
  let rawResult: Domain2QueryReturnType<any>;

  const convertedTransformer = transformer_extended_apply_wrapper(
    "build",
    [], // transformerPath
    undefined,
    runtimeTransformer,
    // transformerTest.transformerParams,
    {...modelEnvironment, ...transformerTest.transformerParams},
    transformerTest.transformerRuntimeContext ?? {},
    "value"
  );
  log.info(
    "################################ runTransformerTestInMemory convertedTransformer after applying build step",
    JSON.stringify(convertedTransformer, null, 2),
    "effective interpolation", interpolation
  );

  if (interpolation == "runtime" && !convertedTransformer["elementType"]) {
    rawResult = transformer_extended_apply_wrapper(
      "runtime",
      [], // transformerPath
      undefined,
      convertedTransformer,
      // transformerTest.transformerParams,
      {...modelEnvironment, ...transformerTest.transformerParams},
      transformerTest.transformerRuntimeContext ?? {}
    );
  } else {
    rawResult = convertedTransformer;
  }

  log.info(
    "################################ runTransformerTestInMemory raw result",
    JSON.stringify(rawResult, null, 2)
  );
  // log.info(
  //   "################################ runTransformerTestInMemory expectedResult",
  //   JSON.stringify(transformerTest.expectedValue, null, 2)
  // );
  const resultWithIgnored = ignorePostgresExtraAttributes(rawResult, transformerTest.ignoreAttributes);
  const resultWithRetain = transformerTest.retainAttributes?
    Object.fromEntries(
      Object.entries(resultWithIgnored).filter(([key]) => transformerTest.retainAttributes!.includes(key))
    ): resultWithIgnored;
  log.info(
    "################################ runTransformerTestInMemory result",
    // resultWithRetain
    JSON.stringify(resultWithRetain, null, 2)
  );
  const testSuiteNamePathAsString = MiroirEventTracker.testPathName(testNamePath);
  const jsonifiedResult = jsonify(resultWithRetain);
  
  // Use the explicitly passed testAssertionPath or fall back to current tracker path
  const currentTestAssertionPath = testAssertionPath || miroirEventTracker.getCurrentTestAssertionPath();
  if (!currentTestAssertionPath) {
    throw new Error("runTransformerTestInMemory called without testAssertionPath and no currentTestAssertionPath available, cannot set test assertion result");
  }
  let testAssertionResult: TestAssertionResult;
  try {
    // real vitest throws an exception if the assertion fails, simulated vitest does not throw an exception
    // log.info(
      //   "################################ runTransformerTestInMemory calling localVitest.expect"
      // );
    
    // Normalize both actual and expected values to handle undefined properties consistently
    const normalizedResult = removeUndefinedProperties(jsonifiedResult);
    const normalizedExpected = removeUndefinedProperties(unNullify(transformerTest.expectedValue));
    
    const expectForm = localVitest
      .expect(normalizedResult, `${testSuiteNamePathAsString} > ${assertionName}`)
    // log.info(
    //   "################################ runTransformerTestInMemory localVitest.expect called expectForm", expectForm
    // );
    // const testResult = expectForm.toEqual(transformerTest.expectedValue);
    // vitest returns void, simulated vitest returns an object with a "result" boolean
    const testResult: any = expectForm.toEqual(normalizedExpected);
    log.info(
      "################################ runTransformerTestInMemory testResult",
      JSON.stringify(testResult, circularReplacer, 2)
    );

    if (!testResult || !Object.hasOwn(testResult, "result")) {
      // vitest case
      testAssertionResult = {
        assertionName,
        assertionResult: "ok",
      };
    } else {
      // simulated vitest case
      // const testName = testNamePath[testNamePath.length - 1];
      // as there can be only 1 assertion per test, we use the test name as the assertion name
      if (testResult.result) {
        testAssertionResult = {
          assertionName,
          assertionResult: "ok",
        };
      } else {
        // TODO: use returned message from the testResult?
        testAssertionResult = {
          assertionName,
          assertionResult: "error",
          assertionExpectedValue: transformerTest.expectedValue,
          assertionActualValue: jsonifiedResult,
        };
      };
    }
  } catch (error) {
    log.info(
      "################################ runTransformerTestInMemory caught error from localVitest.expect",
      error
    );
    // vitest case
    testAssertionResult = {
      assertionName,
      assertionResult: "error",
      assertionExpectedValue: transformerTest.expectedValue,
      assertionActualValue: jsonifiedResult,
    };
  }
  miroirEventTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);

  // End tracking individual test execution if tracker was used
  if (miroirEventTracker && testTrackingId && testAssertionTrackingId) {
    try {
      // Determine test result based on the last assertion set
      const testSuite = miroirEventTracker.getTestSuite();
      const test = miroirEventTracker.getTest();
      const hasError = testSuite && test && testAssertionResult.assertionResult === "error";
      const errorMessage = hasError ? "Test assertion failed" : undefined;
      miroirEventTracker.endEvent(testTrackingId, errorMessage);
      miroirEventTracker.endEvent(testAssertionTrackingId, errorMessage);
      log.info(`🧪 Ended tracking test ${assertionName} with ID: ${testTrackingId}, result: ${hasError ? "error" : "ok"}`);
    } catch (error) {
      console.warn(`Failed to end tracking test ${testName}:`, error);
      console.warn(`Failed to end tracking test assertion ${assertionName}:`, error);
    } finally {
      miroirEventTracker.setTest(undefined);
      // as there is only 1 assertion per test, we use the test name as the assertion name
      miroirEventTracker.setTestAssertion(undefined);
    }
  }

  miroirEventTracker.setTestAssertion(undefined);
  log.info("############################ test", assertionName, "END");
  miroirEventTracker.setTest(undefined);
  // as there is only 1 assertion per test, we use the test name as the assertion name
  return Promise.resolve();
}

export type TestSuiteListFilter = string[] | {[x: string]: TestSuiteListFilter};

// ################################################################################################
export async function runTransformerTestSuite(
  localVitest: VitestNamespace,
  testSuitePath: string[],
  transformerTestSuite: TransformerTestSuite,
  filter: { testList?: TestSuiteListFilter, match?: RegExp } | undefined,
  runTransformerTest: (
    vitest: any,
    testSuitePath: string[],
    transformerTest: TransformerTest,
    modelEnvironment: MiroirModelEnvironment,
    runActionTracker?: any,
    testAssertionPath?: TestAssertionPath
  ) => Promise<void>,
  modelEnvironment: MiroirModelEnvironment,
  miroirEventTracker: MiroirEventTrackerInterface, // Optional unified tracker for test execution tracking
) {
  // const testSuitePath: string[] = [];
  const testSuitePathAsString = MiroirEventTracker.testPathName(testSuitePath);
  const testSuiteName =
    transformerTestSuite.transformerTestLabel ?? transformerTestSuite.transformerTestType;
  log.info(
    `@@@@@@@@@@@@@@@@@@@@ runTransformerTestSuite running transformer test suite called "${testSuiteName}" transformerTestType=${transformerTestSuite.transformerTestType} filter=${JSON.stringify(filter)}`
  );
  if (!localVitest.expect) {
    throw new Error(
      "runTransformerTestSuite called without vitest.expect, this is not a test environment"
    );
  } else {
    log.info(
      `runTransformerTestSuite called for "${testSuiteName}" path "${testSuitePathAsString}" with transformerTestType=${
        transformerTestSuite.transformerTestType
      }, filter=${JSON.stringify(filter)}, transformerTests: ${
        Object.values((transformerTestSuite as any)?.transformerTests).length
      }`
      // "vitest",
      // localVitest
    );
  }
  
  miroirEventTracker.setTestSuite(testSuitePathAsString);
  
  // Start tracking test suite execution in unified tracker if available
  let testSuiteTrackingId: string | undefined;
  if (miroirEventTracker && typeof miroirEventTracker.startTestSuite === 'function') {
    try {
      // Get current action ID as parent (for nested test suites)
      const parentId = miroirEventTracker.getCurrentEventId();
      testSuiteTrackingId = miroirEventTracker.startTestSuite(testSuiteName, parentId);
      log.info(`🧪🧪 Started tracking test suite ${testSuiteName} with ID: ${testSuiteTrackingId}, parent: ${parentId}`);
    } catch (error) {
      console.warn(`Failed to start tracking test suite ${testSuiteName}:`, error);
    }
  } else {
    throw new Error("runTransformerTestSuite called without actionOrTestTracker.startTestSuite, cannot start tracking test suite execution");
  }
  
  // log.info(`transformer test suite ${testSuiteName} suite Tests: ${JSON.stringify(transformerTestSuite, null, 2)}`);

  try {
    if (transformerTestSuite.transformerTestType == "transformerTest") {
      miroirEventTracker.setTest(transformerTestSuite.transformerTestLabel);
      
      // Build the TestAssertionPath from the current testSuitePath (all test suites)
      const testAssertionPath: TestAssertionPath = MiroirEventTracker.stringArrayToTestAssertionPath(testSuitePath);
      // Add the test to the path
      testAssertionPath.push({ test: transformerTestSuite.transformerTestLabel });
      // Add the test assertion to the path
      testAssertionPath.push({ testAssertion: transformerTestSuite.transformerTestLabel });
      
      await runTransformerTest(localVitest, testSuitePath, transformerTestSuite, modelEnvironment, miroirEventTracker, testAssertionPath);
      miroirEventTracker.setTest(undefined);
    } else { // transformerTestSuite.transformerTestType == "transformerTestSuite"
      // log.info(`running transformer test suite ${testSuiteName} with ${JSON.stringify(Object.keys(transformerTestSuite.transformerTests))} tests`);

      // log.info(`transformer test suite ${testSuiteName} suite Tests: ${Object.values(transformerTestSuite.transformerTests).map(t => t.transformerTestLabel).join(", ")}`);
      // log.info(
      //   `handling transformer test suite ${testSuiteName} with transformerTests=${JSON.stringify(
      //     Object.values(transformerTestSuite.transformerTests),
      //     null,
      //     2
      //   )} tests`
      // );
      // replace the describe.each(...) call body with this:
      const innerFilter =
        filter?.testList &&
        typeof filter.testList === "object" &&
        !Array.isArray(filter.testList) &&
        Object.hasOwn(filter.testList, transformerTestSuite.transformerTestLabel)?
        filter.testList[transformerTestSuite.transformerTestLabel]: undefined;

      const selectedTests = Object.values(transformerTestSuite.transformerTests).filter(
        (e) =>
          !innerFilter ||
          (Array.isArray(innerFilter) && innerFilter.includes(e.transformerTestLabel)) ||
          (!Array.isArray(innerFilter) && typeof innerFilter === 'object' &&
            Object.hasOwn(innerFilter, e.transformerTestLabel))
      );
      log.info(
        `runTransformerTestSuite for suite ${testSuitePathAsString} with ${
          selectedTests.length
        } selected tests out of ${
          Object.values(transformerTestSuite.transformerTests).length
        } total tests, innerFilter=${JSON.stringify(innerFilter)}`
      );
      // localVitest.describe.each(selectedTests)(
      // Sequentially run each selected test/suite instead of describe.each (which is parallel)
      for (const transformerTestParam of selectedTests) {
        if (transformerTestParam.transformerTestType === "transformerTest") {
          if (
            !innerFilter ||
            (Array.isArray(innerFilter) &&
              innerFilter.includes(transformerTestParam.transformerTestLabel))
          ) {
            log.info(
              `runTransformerTestSuite calling further test ${transformerTestParam.transformerTestLabel} in suite ${testSuitePath}`
            );
            await localVitest.test(
              transformerTestParam.transformerTestLabel,
              async () => {
                // Build the explicit TestAssertionPath and run the test
                const testAssertionPath: TestAssertionPath =
                  MiroirEventTracker.stringArrayToTestAssertionPath(testSuitePath);
                testAssertionPath.push({ test: transformerTestParam.transformerTestLabel });
                testAssertionPath.push({
                  testAssertion: transformerTestParam.transformerTestLabel,
                });
                await runTransformerTest(
                  localVitest,
                  [...testSuitePath, transformerTestParam.transformerTestLabel],
                  transformerTestParam,
                  modelEnvironment,
                  miroirEventTracker,
                  testAssertionPath
                );
              },
              globalTimeOut
            );
          } else {
            log.info(
              `runTransformerTestSuite skipping test ${
                transformerTestParam.transformerTestLabel
              } as not in filter ${JSON.stringify(filter)}`
            );
          }
        } else {
          // nested suite -> register nested describes (no await)
          await runTransformerTestSuite(
            localVitest,
            [...testSuitePath, transformerTestParam.transformerTestLabel],
            transformerTestParam,
            { testList: innerFilter }, // filter
            runTransformerTest,
            modelEnvironment,
            miroirEventTracker
          );
        }
      }
      log.info(`finished registering transformer subtests for test suite ${testSuitePath}`);
    }
    
    // End tracking test suite execution if tracker was used
    if (miroirEventTracker && testSuiteTrackingId) {
      try {
        miroirEventTracker.endEvent(testSuiteTrackingId);
        log.info(`Ended tracking test suite ${testSuitePathAsString} with ID: ${testSuiteTrackingId}`);
      } catch (error) {
        console.warn(`Failed to end tracking test suite ${testSuitePathAsString}:`, error);
      }
    }
  } catch (error) {
    // End tracking with error if tracker was used
    if (miroirEventTracker && testSuiteTrackingId) {
      try {
        const errorMessage = error instanceof Error ? error.message : String(error) || 'Test suite execution failed';
        miroirEventTracker.endEvent(testSuiteTrackingId, errorMessage);
        log.info(`Ended tracking test suite ${testSuitePathAsString} with error`);
      } catch (trackerError) {
        console.warn(`Failed to end tracking test suite ${testSuitePathAsString} with error:`, trackerError);
      }
    }
    throw error; // Re-throw the original error
  }
  log.info(
    `@@@@@@@@@@@@@@@@@@@@ finished running transformer test suite ${JSON.stringify(testSuitePath)}`
  );
  // miroirEventTracker.resetContext();
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function runTransformerIntegrationTest(sqlDbDataStore: any) {
  return async (
    vitest: any,
    testPath: string[],
    transformerTest: TransformerTest,
    modelEnvironment: MiroirModelEnvironment,
    miroirEventTracker: MiroirEventTrackerInterface, // Optional unified tracker for test execution tracking
    testAssertionPath?: TestAssertionPath, // Explicit test path passed down from the suite
  ) => {
    const testPathName = MiroirEventTracker.testPathName(testPath);
    const testRunStep = transformerTest.runTestStep ?? "runtime";
    // const runAsSql = false;
    const runAsSql = true;

    log.info("runTransformerIntegrationTest called for", testPathName, "START");

    if (!vitest.expect) {
      throw new Error(
        "runTransformerIntegrationTest called without vitest.expect, this is not a test environment"
      );
    }

    miroirEventTracker.setTest(transformerTest.transformerTestLabel);
    // as there is only 1 assertion per test, we use the test name as the assertion name
    miroirEventTracker.setTestAssertion(transformerTest.transformerTestLabel);

    // Use the explicitly passed testAssertionPath or fall back to current tracker path
    const currentTestAssertionPath = testAssertionPath || miroirEventTracker.getCurrentTestAssertionPath();
    if (!currentTestAssertionPath) {
      throw new Error(
        "runTransformerIntegrationTest called without testAssertionPath and no currentTestAssertionPath available, cannot set test assertion result"
      );
    }

    let queryResult: Action2ReturnType;
    log.info(
      "runTransformerIntegrationTest",
      testPathName,
      "running runtime on sql transformerTest",
      transformerTest
    );

    // resolve the transformer to be used in the test
    const resolvedTransformer: Domain2QueryReturnType<TransformerForRuntime> =
      transformer_extended_apply_wrapper(
        "build",
        [], // transformerPath
        (transformerTest.transformer as any)?.label,
        transformerTest.transformer,
        modelEnvironment,
        // transformerTest.transformerParams,
        transformerTest.transformerRuntimeContext ?? {},
        "value" // resolveBuildTransformerTo
      );

    log.info(
      "runTransformerIntegrationTest",
      testPathName,
      "resolvedTransformer",
      JSON.stringify(resolvedTransformer, null, 2)
    );

    if (resolvedTransformer instanceof Domain2ElementFailed) {
      log.info(
        "runTransformerIntegrationTest",
        testPathName,
        "build step found failed: resolvedTransformer",
        resolvedTransformer
      );
      try {
        const resultToCompare = ignorePostgresExtraAttributes(
          resolvedTransformer as any,
          transformerTest.ignoreAttributes
        );

        vitest.expect(resultToCompare, testPathName).toEqual(transformerTest.expectedValue);
        miroirEventTracker.setTestAssertionResult(currentTestAssertionPath, {
          assertionName: testPathName,
          assertionResult: "ok",
        });
      } catch (error) {
        miroirEventTracker.setTestAssertionResult(currentTestAssertionPath,{
          assertionName: testPathName,
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

    // log.info(testSuitePathName, "WWWWWWWWWWWWWWWWWW queryResult", JSON.stringify(queryResult, null, 2));
    log.info(
      testPathName,
      "WWWWWWWWWWWWWWWWWW queryResult",
      JSON.stringify(queryResult, null, 2)
    );
    // log.info(testSuitePathName, "WWWWWWWWWWWWWWWWWW queryResult cannot use 'instanceof' to determine error", queryResult instanceof Action2Error, Object.hasOwn(queryResult,"errorType"));
    let resultToCompare: any;
    try {
      // if (queryResult instanceof Action2Error) { // DOES NOT WORK, because we use the local version of the class, not the version of the class that is available in the miroir-core package
      if (queryResult["status"] == "error") {
        // cannot use 'instanceof' to determine error because we use the local version of the class, not the version of the class that is available in the miroir-core package
        resultToCompare = ignorePostgresExtraAttributes(
          (queryResult as any).innerError,
          transformerTest.ignoreAttributes
        );
        log.info(
          testPathName,
          "WWWWWWWWWWWWWWWWWW queryResult instance of Action2Error:",
          JSON.stringify(resultToCompare, null, 2)
        );

        vitest
          .expect(
            resultToCompare,
            testPathName + "comparing received query error to expected result"
          )
          .toEqual(transformerTest.expectedValue);
      } else {
        log.info(testPathName, "WWWWWWWWWWWWWWWWWW query Succeeded!");
        resultToCompare =
          testRunStep == "runtime"
            ? ignorePostgresExtraAttributes(
                (queryResult as Action2Success).returnedDomainElement.transformer,
                transformerTest.ignoreAttributes
              )
            : (queryResult as Action2Success).returnedDomainElement;
        log.info(testPathName, "testResult", JSON.stringify(resultToCompare, null, 2));
        log.info(testPathName, "expectedValue", transformerTest.expectedValue);
        vitest.expect(resultToCompare, testPathName).toEqual(transformerTest.expectedValue);
      }
      miroirEventTracker.setTestAssertionResult(currentTestAssertionPath,{
        assertionName: testPathName,
        assertionResult: "ok",
      });
    } catch (error) {
      miroirEventTracker.setTestAssertionResult(currentTestAssertionPath,{
        assertionName: testPathName,
        assertionResult: "error",
        assertionExpectedValue: transformerTest.expectedValue,
        assertionActualValue: resultToCompare,
      });
    } finally {
      miroirEventTracker.setTestAssertion(undefined);
      miroirEventTracker.setTest(undefined);
    }

    miroirEventTracker.setTest(undefined);
    // as there is only 1 assertion per test, we use the test name as the assertion name
    miroirEventTracker.setTestAssertion(undefined);

    log.info(testPath, "END");
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

// // ################################################################################################
// export function displayTestSuiteResults(
//   expect: any, // vitest.expect
//   currentTestSuiteName: string,
//   currentTestSuitePath: TestAssertionPath,
//   miroirEventTracker: MiroirEventTrackerInterface, // Optional unified tracker for test execution tracking
// ) {
//   throw new Error("displayTestSuiteResults is not implemented yet");
// }

// ################################################################################################
export const displayTestSuiteResultsDetails = async (
  // expect: any, // vitest.expect
  currentTestSuiteName: string,
  currentTestSuitePath: TestAssertionPath,
  miroirEventTracker: MiroirEventTrackerInterface, // Optional unified tracker for test execution tracking
) => {
  log.info("#################################### displayTestSuiteResultsDetails ####################################");
  
  // Import chalk for colors
  // const chalk = (await import('chalk')).default;
  
  // Retrieve results for the requested suite path (fallback to root if not provided)
  const allResults = miroirEventTracker.getTestAssertionsResults(currentTestSuitePath ?? []);

  let totalTestSuites = 0;
  let totalTests = 0;
  let totalAssertions = 0;
  let passedTestSuites = 0;
  let passedTests = 0;
  let passedAssertions = 0;

  // Collect all test information for processing
  const collectTestInfo = (
    results: TestSuiteResult,
    pathPrefix: string[] = []
  ): Array<{
    type: 'suite' | 'test' | 'assertion';
    path: string;
    status: 'ok' | 'error';
    assertion?: TestAssertionResult;
  }> => {
    const testInfo: Array<any> = [];
    
    // Count and collect test suites
    if (results.testsSuiteResults) {
      for (const [suiteName, suiteResult] of Object.entries(results.testsSuiteResults)) {
        const currentPath = [...pathPrefix, suiteName];
        totalTestSuites++;
        
        // Determine suite status (ok if all tests in suite pass)
        const hasFailedTests = suiteResult.testsResults && 
          Object.values(suiteResult.testsResults).some(test => test.testResult !== "ok");
        const suiteStatus = hasFailedTests ? "error" : "ok";
        
        if (suiteStatus === "ok") {
          passedTestSuites++;
        }
        
        // Recursively collect from child suites
        testInfo.push(...collectTestInfo(suiteResult, currentPath));
      }
    }

    // Count and collect individual tests and their assertions
    if (results.testsResults) {
      for (const [testName, testResult] of Object.entries(results.testsResults)) {
        totalTests++;
        
        const testPath = [...pathPrefix, testName].join(" > ");
        const testStatus = testResult.testResult === "ok" ? "ok" : "error";
        
        if (testStatus === "ok") {
          passedTests++;
        }
        
        // Process assertions for this test
        const assertions = Object.entries(testResult.testAssertionsResults);
        totalAssertions += assertions.length;
        
        for (const [assertionName, assertion] of assertions) {
          const assertionPath = [...pathPrefix, testName, assertionName].join(" > ");
          const assertionStatus = assertion.assertionResult === "ok" ? "ok" : "error";
          
          if (assertionStatus === "ok") {
            passedAssertions++;
          }
          
          testInfo.push({
            type: 'assertion',
            path: assertionPath,
            status: assertionStatus,
            assertion: assertion
          });
        }
      }
    }
    
    return testInfo;
  };
  
  // Collect all test information
  const allTestInfo = collectTestInfo(allResults);
  
  // Display detailed assertion results
  for (const item of allTestInfo) {
    if (item.type === 'assertion') {
      const symbol = item.status === "ok" ? chalk.green("✓") : chalk.red("✗");
      const statusText = item.status === "ok" ? chalk.green("[ok]") : chalk.red("[error]");
      
      log.info(`${symbol} ${item.path} ${statusText}`);
      
      // Show detailed assertion results for failed assertions
      if (item.status === "error" && item.assertion) {
        log.info(chalk.red("    Expected:"));
        try {
          log.info("   ", JSON.stringify(item.assertion.assertionExpectedValue, null, 4));
        } catch (e) {
          log.info("    (unserializable)");
        }
        log.info(chalk.red("    Actual:"));
        try {
          log.info("   ", JSON.stringify(item.assertion.assertionActualValue, circularReplacer, 4));
        } catch (e) {
          log.info("    (unserializable)");
        }
        log.info(""); // Add spacing between failed assertions
      }
    }
  }
  
  // Display comprehensive statistics
  log.info("\n" + chalk.bold("═══════════════════════════════════════════════════════════════════════════════════════════════════"));
  log.info(chalk.bold.blue("                                   DETAILED TEST ASSERTIONS SUMMARY"));
  log.info(chalk.bold("═══════════════════════════════════════════════════════════════════════════════════════════════════"));
  
  if (totalTestSuites > 0) {
    log.info(chalk.bold("Test Suites:"));
    const suitePassRate = totalTestSuites > 0 ? ((passedTestSuites / totalTestSuites) * 100).toFixed(1) : "0.0";
    log.info(`  ${chalk.green("✓ Passed:")} ${passedTestSuites}/${totalTestSuites} (${suitePassRate}%)`);
    if (totalTestSuites - passedTestSuites > 0) {
      log.info(`  ${chalk.red("✗ Failed:")} ${totalTestSuites - passedTestSuites}/${totalTestSuites}`);
    }
  }
  
  if (totalTests > 0) {
    log.info(chalk.bold("\nTests:"));
    const testPassRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0.0";
    log.info(`  ${chalk.green("✓ Passed:")} ${passedTests}/${totalTests} (${testPassRate}%)`);
    if (totalTests - passedTests > 0) {
      log.info(`  ${chalk.red("✗ Failed:")} ${totalTests - passedTests}/${totalTests}`);
    }
  }
  
  log.info(chalk.bold("\nAssertions (Detailed):"));
  const assertionPassRate = totalAssertions > 0 ? ((passedAssertions / totalAssertions) * 100).toFixed(1) : "0.0";
  log.info(`  ${chalk.green("✓ Passed:")} ${passedAssertions}/${totalAssertions} (${assertionPassRate}%)`);
  if (totalAssertions - passedAssertions > 0) {
    log.info(`  ${chalk.red("✗ Failed:")} ${totalAssertions - passedAssertions}/${totalAssertions}`);
  }
  
  // Overall status
  const overallStatus = (passedTests === totalTests && passedAssertions === totalAssertions) ? "PASSED" : "FAILED";
  const statusColor = overallStatus === "PASSED" ? chalk.green : chalk.red;
  log.info(chalk.bold(`\nOverall Status: ${statusColor(overallStatus)}`));
  
  log.info(chalk.bold("═══════════════════════════════════════════════════════════════════════════════════════════════════"));
  log.info("#################################### End of displayTestSuiteResultsDetails ####################################");
};

// ################################################################################################
export const transformerTestsDisplayResults = async (
  transformerTestSuite: TransformerTestSuite,
  RUN_TEST: string,
  testSuiteName: string,
  miroirEventTracker: MiroirEventTrackerInterface, // Optional unified tracker for test execution tracking
) => {
  if (RUN_TEST == testSuiteName) {
    log.info("#################################### transformerTestsDisplayResults ####################################");
    
    // Import chalk for colors
    // const chalk = (await import('chalk')).default;
    
    const allResults = miroirEventTracker.getTestAssertionsResults([]);
    
    // Statistics
    let totalTestSuites = 0;
    let totalTests = 0;
    let totalAssertions = 0;
    let passedTestSuites = 0;
    let passedTests = 0;
    let passedAssertions = 0;
    
    // Collect all test information for processing
    const collectTestInfo = (
      results: TestSuiteResult,
      pathPrefix: string[] = []
    ): Array<{
      type: 'suite' | 'test';
      path: string;
      status: 'ok' | 'error';
      failedAssertions?: string[];
    }> => {
      const testInfo: Array<any> = [];
      
      // Count and collect test suites
      if (results.testsSuiteResults) {
        for (const [suiteName, suiteResult] of Object.entries(results.testsSuiteResults)) {
          const currentPath = [...pathPrefix, suiteName];
          totalTestSuites++;
          
          // Determine suite status (ok if all tests in suite pass)
          const hasFailedTests = suiteResult.testsResults && 
            Object.values(suiteResult.testsResults).some(test => test.testResult !== "ok");
          const suiteStatus = hasFailedTests ? "error" : "ok";
          
          if (suiteStatus === "ok") {
            passedTestSuites++;
          }
          
          // Recursively collect from child suites
          testInfo.push(...collectTestInfo(suiteResult, currentPath));
        }
      }

      // Count and collect individual tests
      if (results.testsResults) {
        for (const [testName, testResult] of Object.entries(results.testsResults)) {
          totalTests++;
          
          const testPath = [...pathPrefix, testName].join(" > ");
          const testStatus = testResult.testResult === "ok" ? "ok" : "error";
          
          if (testStatus === "ok") {
            passedTests++;
          }
          
          // Count assertions for this test
          const assertions = Object.entries(testResult.testAssertionsResults);
          totalAssertions += assertions.length;
          
          const failedAssertions = assertions
            .filter(([_, assertion]) => assertion.assertionResult !== "ok")
            .map(([name, _]) => name);
          
          // Count passed assertions
          passedAssertions += assertions.length - failedAssertions.length;
          
          testInfo.push({
            type: 'test',
            path: testPath,
            status: testStatus,
            failedAssertions: failedAssertions.length > 0 ? failedAssertions : undefined
          });
        }
      }
      
      return testInfo;
    };
    
    // Collect all test information
    const allTestInfo = collectTestInfo(allResults);
    
    // Display test results
    for (const test of allTestInfo) {
      if (test.type === 'test') {
        const symbol = test.status === "ok" ? chalk.green("✓") : chalk.red("✗");
        const statusText = test.status === "ok" ? chalk.green("[ok]") : chalk.red("[error]");
        
        log.info(`${symbol} ${test.path} ${statusText}`);
        
        // Show failed assertions if any
        if (test.failedAssertions && test.failedAssertions.length > 0) {
          log.info(chalk.red(`    Failed assertions: ${test.failedAssertions.join(", ")}`));
        }
      }
    }
    
    // Display comprehensive statistics
    log.info("\n" + chalk.bold("═══════════════════════════════════════════════════════════════════════════════════════════════════"));
    log.info(chalk.bold.blue("                                        TEST EXECUTION SUMMARY"));
    log.info(chalk.bold("═══════════════════════════════════════════════════════════════════════════════════════════════════"));
    
    log.info(chalk.bold("Test Suites:"));
    const suitePassRate = totalTestSuites > 0 ? ((passedTestSuites / totalTestSuites) * 100).toFixed(1) : "0.0";
    log.info(`  ${chalk.green("✓ Passed:")} ${passedTestSuites}/${totalTestSuites} (${suitePassRate}%)`);
    if (totalTestSuites - passedTestSuites > 0) {
      log.info(`  ${chalk.red("✗ Failed:")} ${totalTestSuites - passedTestSuites}/${totalTestSuites}`);
    }
    
    log.info(chalk.bold("\nTests:"));
    const testPassRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0.0";
    log.info(`  ${chalk.green("✓ Passed:")} ${passedTests}/${totalTests} (${testPassRate}%)`);
    if (totalTests - passedTests > 0) {
      log.info(`  ${chalk.red("✗ Failed:")} ${totalTests - passedTests}/${totalTests}`);
    }
    
    log.info(chalk.bold("\nAssertions:"));
    const assertionPassRate = totalAssertions > 0 ? ((passedAssertions / totalAssertions) * 100).toFixed(1) : "0.0";
    log.info(`  ${chalk.green("✓ Passed:")} ${passedAssertions}/${totalAssertions} (${assertionPassRate}%)`);
    if (totalAssertions - passedAssertions > 0) {
      log.info(`  ${chalk.red("✗ Failed:")} ${totalAssertions - passedAssertions}/${totalAssertions}`);
    }
    
    // Overall status
    const overallStatus = (passedTests === totalTests && passedAssertions === totalAssertions) ? "PASSED" : "FAILED";
    const statusColor = overallStatus === "PASSED" ? chalk.green : chalk.red;
    log.info(chalk.bold(`\nOverall Status: ${statusColor(overallStatus)}`));
    
    log.info(chalk.bold("═══════════════════════════════════════════════════════════════════════════════════════════════════"));
    log.info("#################################### End of transformerTestsDisplayResults ####################################");
    
    miroirEventTracker.resetResults();
  }
};
