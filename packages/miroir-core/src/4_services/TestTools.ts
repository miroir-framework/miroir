import chalk from 'chalk';
import * as vitest from 'vitest';
type VitestNamespace = typeof vitest;
// chalk.enabled = true
chalk.level = 3;

import {
  TransformerForRuntime,
  type TestAssertionResult,
  type TestSuiteResult,
  type TransformerForBuildPlusRuntime,
  type TransformerTest,
  type TransformerTestSuite
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import {
  Action2ReturnType,
  Action2Success,
  TransformerFailure,
  type TransformerReturnType
} from "../0_interfaces/2_domain/DomainElement";
import type { MiroirActivityTrackerInterface, TestAssertionPath } from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { jsonify } from "../1_core/test-expect";
import { transformer_extended_apply_wrapper } from "../2_domain/TransformersForRuntime";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import { packageName } from "../constants";
import { circularReplacer } from '../tools';
import { cleanLevel } from "./constants";
import { MiroirLoggerFactory } from "./LoggerFactory";
import { ignorePostgresExtraAttributes, isJson, isJsonArray, removeUndefinedProperties, unNullify } from "./otherTools";

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
export type RunTransformerTest = (
    localVitest: typeof vitest,
    testNamePath: string[],
    filter: { testList?: TestSuiteListFilter, match?: RegExp } | undefined,
    transformerTest: TransformerTest,
    modelEnvironment: MiroirModelEnvironment,
    miroirActivityTracker: MiroirActivityTrackerInterface, // Optional unified tracker for test execution tracking
    parentTrackingId: string | undefined,
    trackActionsBelow: boolean,
    runTransformerTests: RunTransformerTests,
    testAssertionPath?: TestAssertionPath, // Explicit test path passed down from the suite
  ) => Promise<void>;

export interface RunTransformerTests {
  _runTransformerTestSuite: typeof runTransformerTestSuite,
  _runTransformerTest: RunTransformerTest,
  _runTransformerTestSuiteWithTracking: typeof runTransformerTestSuite,
  _runTransformerTestWithTracking: RunTransformerTest,
}


export const runUnitTransformerTests: RunTransformerTests = {
  _runTransformerTestSuiteWithTracking: async (
    localVitest: VitestNamespace,
    testSuitePath: string[],
    transformerTestSuite: TransformerTestSuite,
    filter: { testList?: TestSuiteListFilter; match?: RegExp } | undefined,
    modelEnvironment: MiroirModelEnvironment,
    miroirActivityTracker: MiroirActivityTrackerInterface, // Optional unified tracker for test execution tracking
    parentTrackingId: string | undefined = undefined,
    trackActionsBelow: boolean = false,
    runTransformerTests: RunTransformerTests,
    parentSkip?: boolean // Skip flag inherited from parent test suite
  ): Promise<void> => {
    const testSuitePathAsString = MiroirActivityTracker.testPathName(testSuitePath);
    const testSuiteName =
      transformerTestSuite.transformerTestLabel ?? transformerTestSuite.transformerTestType;
    await miroirActivityTracker.trackTestSuite(
      testSuiteName,
      testSuitePathAsString,
      parentTrackingId,
      async (parentTrackingId: string | undefined) => {
        await runTransformerTests._runTransformerTestSuite(
          localVitest,
          testSuitePath,
          transformerTestSuite,
          filter,
          modelEnvironment,
          miroirActivityTracker,
          parentTrackingId,
          trackActionsBelow,
          runTransformerTests,
          parentSkip
        );
      }
    );
  },
  _runTransformerTestWithTracking: async (
    localVitest: typeof vitest,
    testNamePath: string[],
    filter: { testList?: TestSuiteListFilter, match?: RegExp } | undefined,
    transformerTest: TransformerTest,
    modelEnvironment: MiroirModelEnvironment,
    miroirActivityTracker: MiroirActivityTrackerInterface, // Optional unified tracker for test execution tracking
    parentTrackingId: string | undefined = undefined,
    trackActionsBelow: boolean = false,
    runTransformerTests: RunTransformerTests,
    testAssertionPath?: TestAssertionPath, // Explicit test path passed down from the suite
  ): Promise<void> => {
    await miroirActivityTracker.trackTest(
      transformerTest.transformerTestLabel ?? transformerTest.transformerName,
      async (parentTrackingId: string | undefined) => {
        await miroirActivityTracker.trackTestAssertion(
          transformerTest.transformerTestLabel ?? transformerTest.transformerName,
          async (parentTrackingId: string | undefined) => {
            await runTransformerTests._runTransformerTest(
              localVitest,
              testNamePath,
              filter,
              transformerTest,
              modelEnvironment,
              miroirActivityTracker,
              parentTrackingId,
              trackActionsBelow,
              runTransformerTests,
              testAssertionPath
            );
          }
        );
      }
    );
  },
  _runTransformerTestSuite: runTransformerTestSuite,
  _runTransformerTest: runTransformerTestInMemory,
};

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
// ################################################################################################
export async function runTransformerTestInMemory(
  localVitest: typeof vitest,
  testNamePath: string[],
  filter: { testList?: TestSuiteListFilter, match?: RegExp } | undefined,
  transformerTest: TransformerTest,
  modelEnvironment: MiroirModelEnvironment,
  miroirActivityTracker: MiroirActivityTrackerInterface, // Optional unified tracker for test execution tracking
  parentTrackingId: string | undefined,
  trackActionsBelow: boolean = false,
  runTransformerTests: RunTransformerTests,
  testAssertionPath?: TestAssertionPath, // Explicit test path passed down from the suite
): Promise<void> {
  const testName = transformerTest.transformerTestLabel ?? transformerTest.transformerName;
  const assertionName = transformerTest.transformerTestLabel ?? transformerTest.transformerName;
  // log.info(
  //   "#################################### runTransformerTestInMemory test",
  //   assertionName,
  //   "START"
  // );

  if (
    filter?.testList &&
    (typeof filter.testList != "object" || (!Array.isArray(filter.testList) && Object.keys(filter.testList).length > 0))
  ) {
    throw new Error(
      "runTransformerTestInMemory called with non-array filter.testList, this is not supported: " +
        JSON.stringify(filter)
    );
  }
  // Check if test should be skipped
  if (
    transformerTest.skip ||
    (filter?.testList &&
      !(filter.testList as any).includes(
        transformerTest.transformerTestLabel ?? transformerTest.transformerName
      ))
  ) {
    log.info(`⏭️  Skipping test: ${assertionName}`);

    // Use the explicitly passed testAssertionPath or fall back to current tracker path
    const currentTestAssertionPath =
      testAssertionPath || miroirActivityTracker.getCurrentTestAssertionPath();
    if (!currentTestAssertionPath) {
      throw new Error(
        "runTransformerTestInMemory called without testAssertionPath and no currentTestAssertionPath available, cannot set test assertion result"
      );
    }

    const testAssertionResult: TestAssertionResult = {
      assertionName,
      assertionResult: "skipped",
    };

    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);
    log.info("############################ test", assertionName, "SKIPPED");
    return Promise.resolve();
  }

  const transformer: TransformerForBuildPlusRuntime = transformerTest.transformer;
  const runtimeTransformer: TransformerForRuntime = transformer as any;
  // log.info(
  //   "################################ runTransformerTestInMemory transformerTestParams",
  //   JSON.stringify(transformerTest, null, 2)
  // );

  const interpolation = transformerTest.runTestStep ?? "runtime";
  let rawResult: TransformerReturnType<any>;

  const convertedTransformer = transformer_extended_apply_wrapper(
    undefined, // activityTracker
    "build",
    [], // transformerPath
    undefined,
    runtimeTransformer,
    {...modelEnvironment, ...transformerTest.transformerParams},
    transformerTest.transformerRuntimeContext ?? {},
    "value"
  );
  // log.info(
  //   "################################ runTransformerTestInMemory convertedTransformer after applying build step",
  //   JSON.stringify(convertedTransformer, null, 2),
  //   "effective interpolation", interpolation
  // );

  if (interpolation == "runtime" && !convertedTransformer["elementType"]) {
    rawResult = transformer_extended_apply_wrapper(
      undefined, // activityTracker
      "runtime",
      [], // transformerPath
      undefined,
      convertedTransformer,
      {...modelEnvironment, ...transformerTest.transformerParams},
      transformerTest.transformerRuntimeContext ?? {}
    );
  } else {
    rawResult = convertedTransformer;
  }

  log.info(
    "################################ runTransformerTestInMemory raw result",
    // JSON.stringify(rawResult, null, 2)
    rawResult
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
  // log.info(
  //   "################################ runTransformerTestInMemory result",
  //   // resultWithRetain
  //   JSON.stringify(resultWithRetain, null, 2)
  // );
  const testSuiteNamePathAsString = MiroirActivityTracker.testPathName(testNamePath);
  const jsonifiedResult = jsonify(resultWithRetain);
  
  // Use the explicitly passed testAssertionPath or fall back to current tracker path
  const currentTestAssertionPath = testAssertionPath || miroirActivityTracker.getCurrentTestAssertionPath();
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
    const expectedValue = transformerTest.unitTestExpectedValue??transformerTest.expectedValue;

    const normalizedResult = removeUndefinedProperties(jsonifiedResult);
    const normalizedExpected = removeUndefinedProperties(unNullify(expectedValue));

      // log.info(
      //   "################################ runTransformerTestInMemory result",
      //   // resultWithRetain
      //   JSON.stringify(normalizedResult, null, 2),
      //   "expected",
      //   JSON.stringify(normalizedExpected, null, 2)
      // );

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
      testResult
      // JSON.stringify(testResult, circularReplacer, 2)
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
    log.error(
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
  miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);

  log.info("############################ test", assertionName, "END");
  // miroirActivityTracker.setTest(undefined);
  // as there is only 1 assertion per test, we use the test name as the assertion name
  return Promise.resolve();
}

export type TestSuiteListFilter = string[] | {[x: string]: TestSuiteListFilter};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export async function runTransformerTestSuite(
  localVitest: VitestNamespace,
  testSuitePath: string[],
  transformerTestSuite: TransformerTestSuite,
  filter: { testList?: TestSuiteListFilter, match?: RegExp } | undefined,
  modelEnvironment: MiroirModelEnvironment,
  miroirActivityTracker: MiroirActivityTrackerInterface, // Optional unified tracker for test execution tracking
  parentTrackingId: string | undefined,
  trackActionsBelow: boolean = false,
  runTransformerTests: RunTransformerTests,
  parentSkip?: boolean, // Skip flag inherited from parent test suite
): Promise<void> {
  const testSuitePathAsString = MiroirActivityTracker.testPathName(testSuitePath);
  const testSuiteName =
    transformerTestSuite.transformerTestLabel ?? transformerTestSuite.transformerTestType;
    
  // Determine if this suite should be skipped (either its own skip flag or inherited from parent)
  const shouldSkipSuite = transformerTestSuite.skip || parentSkip;
    
  if (!localVitest.expect) {
    throw new Error(
      "runTransformerTestSuite called without vitest.expect, this is not a test environment"
    );
  }

  try {
    // replace the describe.each(...) call body with this:
    const innerFilter: { testList: TestSuiteListFilter | undefined} = filter?.testList
      ? typeof filter.testList === "object" &&
        !Array.isArray(filter.testList) &&
        Object.hasOwn(filter.testList, transformerTestSuite.transformerTestLabel)
        ? {testList: filter.testList[transformerTestSuite.transformerTestLabel]}
        : { testList: [] }
      : {testList: undefined};

    const allTests = transformerTestSuite.transformerTests
    const selectedTests = allTests.filter(
      (e) =>
        !filter?.testList ||
        (Array.isArray(filter?.testList) && filter?.testList.includes(e.transformerTestLabel)) ||
        (!Array.isArray(filter?.testList) &&
          typeof filter?.testList === "object" &&
          Object.hasOwn(filter?.testList, e.transformerTestLabel))
    );
    log.info(
      "runTransformerTestSuite for suite",
      testSuitePathAsString,
      "trackActionsBelow=",
      trackActionsBelow,
      "shouldSkipSuite=",
      shouldSkipSuite,
      "with",
      // selectedTests.length,
      // "selected tests out of",
      // Object.values(transformerTestSuite.transformerTests).length,
      // "total tests,",
      "filter",
      JSON.stringify(filter),
      "innerFilter=",
      JSON.stringify(innerFilter),
      "allTests=",
      allTests.map(t => t.transformerTestLabel),
      // "selectedTests=",
      // selectedTests
    );
    // localVitest.describe.each(selectedTests)(
    // Sequentially run each selected test/suite instead of describe.each (which is parallel)
    for (const transformerTestParam of allTests) {
      if (transformerTestParam.transformerTestType === "transformerTest") {
        // Inherit skip flag from parent suite to child test
        const effectiveTransformerTest: TransformerTest =
          // { ...transformerTestParam, skip: !selectedTests.includes(transformerTestParam) };
          { ...transformerTestParam, skip: !allTests.includes(transformerTestParam) };
          
        log.info(
          "runTransformerTestSuite calling further test",
          transformerTestParam.transformerTestLabel,
          " in suite ",
          testSuitePath,
          "trackActionsBelow=",
          trackActionsBelow,
          "(skip: ",
          effectiveTransformerTest.skip,
          ")"
        );
        await localVitest.test(
          transformerTestParam.transformerTestLabel,
          async () => {
            // Build the explicit TestAssertionPath and run the test
            const testAssertionPath: TestAssertionPath =
              MiroirActivityTracker.stringArrayToTestAssertionPath(testSuitePath);
            testAssertionPath.push({ test: transformerTestParam.transformerTestLabel });
            testAssertionPath.push({
              testAssertion: transformerTestParam.transformerTestLabel,
            });

            const runTransformerTest = trackActionsBelow
                ? runTransformerTests._runTransformerTestWithTracking
                : runTransformerTests._runTransformerTest;

            await runTransformerTest(
              localVitest,
              [...testSuitePath, transformerTestParam.transformerTestLabel],
              innerFilter,
              effectiveTransformerTest,
              modelEnvironment,
              miroirActivityTracker,
              parentTrackingId,
              trackActionsBelow,
              runTransformerTests,
              testAssertionPath
            );
          },
          globalTimeOut
        );
      } else {
        // nested suite -> register nested describes (no await)
        const runTransformerTestSuite = trackActionsBelow
            ? runTransformerTests._runTransformerTestSuiteWithTracking
            : runTransformerTests._runTransformerTestSuite;
        await runTransformerTestSuite(
          localVitest,
          [...testSuitePath, transformerTestParam.transformerTestLabel],
          transformerTestParam,
          // { testList: innerFilter }, // filter
          innerFilter,
          modelEnvironment,
          miroirActivityTracker,
          parentTrackingId,
          trackActionsBelow,
          runTransformerTests,
          shouldSkipSuite // Pass down the skip flag to child suites
        );
      }
    }
    log.info(`finished registering transformer subtests for test suite ${testSuitePath}`);
  } catch (error) {
    throw error; // Re-throw the original error
  }
  log.info(
    `@@@@@@@@@@@@@@@@@@@@ finished running transformer test suite ${JSON.stringify(testSuitePath)}`
  );
  // miroirActivityTracker.resetContext();
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
    filter: { testList?: TestSuiteListFilter, match?: RegExp } | undefined,
    transformerTest: TransformerTest,
    modelEnvironment: MiroirModelEnvironment,
    miroirActivityTracker: MiroirActivityTrackerInterface, // Optional unified tracker for test execution tracking
    parentTrackingId: string | undefined,
    trackActionsBelow: boolean = false,
    runTransformerTests: RunTransformerTests,
    testAssertionPath?: TestAssertionPath, // Explicit test path passed down from the suite
  ): Promise<void> => {
    const testName = transformerTest.transformerTestLabel ?? transformerTest.transformerName;
    const assertionName = transformerTest.transformerTestLabel ?? transformerTest.transformerName;
    const testPathName = MiroirActivityTracker.testPathName(testPath);
    const testRunStep = transformerTest.runTestStep ?? "runtime";
    // const runAsSql = false;
    const runAsSql = true;

    log.info("runTransformerIntegrationTest called for", testPathName, "START");

    if (!vitest.expect) {
      throw new Error(
        "runTransformerIntegrationTest called without vitest.expect, this is not a test environment"
      );
    }

    // Use the explicitly passed testAssertionPath or fall back to current tracker path
    const currentTestAssertionPath = testAssertionPath || miroirActivityTracker.getCurrentTestAssertionPath();
    if (!currentTestAssertionPath) {
      throw new Error(
        "runTransformerIntegrationTest called without testAssertionPath and no currentTestAssertionPath available, cannot set test assertion result"
      );
    }

    log.info(
      "runTransformerIntegrationTest",
      testPathName,
      "running runtime on sql transformerTest",
      transformerTest
    );

      // Check if test should be skipped
  if (
    transformerTest.skip ||
    (filter?.testList &&
      !(filter.testList as any).includes(
        transformerTest.transformerTestLabel ?? transformerTest.transformerName
      ))
  ) {
    log.info(`⏭️  Skipping test: ${assertionName}`);

    // Use the explicitly passed testAssertionPath or fall back to current tracker path
    const currentTestAssertionPath =
      testAssertionPath || miroirActivityTracker.getCurrentTestAssertionPath();
    if (!currentTestAssertionPath) {
      throw new Error(
        "runTransformerTestInMemory called without testAssertionPath and no currentTestAssertionPath available, cannot set test assertion result"
      );
    }

    const testAssertionResult: TestAssertionResult = {
      assertionName,
      assertionResult: "skipped",
    };

    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);

    // miroirActivityTracker.setTestAssertion(undefined);
    log.info("############################ test", assertionName, "SKIPPED");
    miroirActivityTracker.setTest(undefined);
    return Promise.resolve();
  }

    // resolve the transformer to be used in the test
    const resolvedTransformer: TransformerReturnType<TransformerForRuntime> =
      transformer_extended_apply_wrapper(
        undefined, // activityTracker
        "build",
        [], // transformerPath
        (transformerTest.transformer as any)?.label,
        transformerTest.transformer,
        {...modelEnvironment, ...transformerTest.transformerParams},
        transformerTest.transformerRuntimeContext ?? {},
        "value" // resolveBuildTransformerTo
      );

    log.info(
      "runTransformerIntegrationTest",
      testPathName,
      "#### resolvedTransformer",
      JSON.stringify(resolvedTransformer, null, 2)
    );

    const expectedValue = transformerTest.integrationTestExpectedValue??transformerTest.expectedValue;
    if (resolvedTransformer instanceof TransformerFailure) {
      log.info(
        "runTransformerIntegrationTest",
        testPathName,
        "build step found failed: resolvedTransformer",
        resolvedTransformer
      );
      const resultWithIgnored = ignorePostgresExtraAttributes(
        resolvedTransformer as any,
        transformerTest.ignoreAttributes
      );
      const resultWithRetain = transformerTest.retainAttributes
        ? Object.fromEntries(
            Object.entries(resultWithIgnored).filter(([key]) =>
              transformerTest.retainAttributes!.includes(key)
            )
          )
        : resultWithIgnored;
      try {
        log.info(
          "runTransformerIntegrationTest",
          testPathName,
          "WWWWWWWWWWWWWWWWWW queryResult instance of TransformerFailure:",
          JSON.stringify(resultWithRetain, null, 2), 
          "expected", expectedValue
        );
        vitest.expect(resultWithRetain, testPathName).toEqual(expectedValue);
        miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
          assertionName: testPathName,
          assertionResult: "ok",
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error) || 'Test assertion failed: ' + error;
        log.error(
          "runTransformerIntegrationTest",
          testPathName,
          "caught error from vitest.expect",
          error
        );
        miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath,{
          assertionName: testPathName,
          assertionResult: "error",
          assertionExpectedValue: expectedValue,
          assertionActualValue: resultWithRetain,
        });
      }
      return;
    }
    
    let queryResult: Action2ReturnType;
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
    let resultWithIgnored: any;
    let resultWithRetain: any;
    let testAssertionResult: TestAssertionResult;
    try {
      // if (queryResult instanceof Action2Error) { // DOES NOT WORK, because we use the local version of the class, not the version of the class that is available in the miroir-core package
      if (queryResult["status"] == "error") {
        // cannot use 'instanceof' to determine error because we use the local version of the class, not the version of the class that is available in the miroir-core package
        resultWithIgnored = ignorePostgresExtraAttributes(
          (queryResult as any).innerError,
          transformerTest.ignoreAttributes
        );
        resultWithRetain = transformerTest.retainAttributes
          ? Object.fromEntries(
              Object.entries(resultWithIgnored).filter(([key]) =>
                transformerTest.retainAttributes!.includes(key)
              )
            )
          : resultWithIgnored;

        log.info(
          testPathName,
          "WWWWWWWWWWWWWWWWWW queryResult instance of Action2Error:",
          JSON.stringify(resultWithRetain, null, 2)
        );

        vitest
          .expect(
            resultWithRetain,
            testPathName + "comparing received query error to expected result"
          )
          .toEqual(expectedValue);
      } else {
        log.info(testPathName, "WWWWWWWWWWWWWWWWWW query Succeeded!");
        resultWithIgnored =
          testRunStep == "runtime"
            ? ignorePostgresExtraAttributes(
                (queryResult as Action2Success).returnedDomainElement.transformer,
                transformerTest.ignoreAttributes
              )
            : (queryResult as Action2Success).returnedDomainElement;
        resultWithRetain = transformerTest.retainAttributes
          ? Object.fromEntries(
              Object.entries(resultWithIgnored).filter(([key]) =>
                transformerTest.retainAttributes!.includes(key)
              )
            )
          : resultWithIgnored;

        log.info(testPathName, "testResult", JSON.stringify(resultWithRetain, null, 2));
        log.info(testPathName, "expectedValue", expectedValue);
        vitest.expect(resultWithRetain, testPathName).toEqual(expectedValue);
      }
      testAssertionResult = {
        assertionName: testPathName,
        assertionResult: "ok",
      };
      // miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath,{
      //   assertionName: testPathName,
      //   assertionResult: "ok",
      // });
    } catch (error) {
      testAssertionResult = {
        assertionName: testPathName,
        assertionResult: "error",
        assertionExpectedValue: expectedValue,
        assertionActualValue: resultWithRetain,
      };
    }
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath,testAssertionResult);
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
//   miroirActivityTracker: MiroirEventTrackerInterface, // Optional unified tracker for test execution tracking
// ) {
//   throw new Error("displayTestSuiteResults is not implemented yet");
// }

// ################################################################################################
export const displayTestSuiteResultsDetails = async (
  // expect: any, // vitest.expect
  currentTestSuiteName: string,
  currentTestSuitePath: TestAssertionPath,
  miroirActivityTracker: MiroirActivityTrackerInterface, // Optional unified tracker for test execution tracking
) => {
  log.info("#################################### displayTestSuiteResultsDetails ####################################");
  
  // Import chalk for colors
  // const chalk = (await import('chalk')).default;
  
  // Retrieve results for the requested suite path (fallback to root if not provided)
  const allResults = miroirActivityTracker.getTestAssertionsResults(currentTestSuitePath ?? []);

  let totalTestSuites = 0;
  let totalTests = 0;
  let totalAssertions = 0;
  let passedTestSuites = 0;
  let passedTests = 0;
  let passedAssertions = 0;
  let skippedTestSuites = 0;
  let skippedTests = 0;
  let skippedAssertions = 0;

  // Collect all test information for processing
  const collectTestInfo = (
    results: TestSuiteResult,
    pathPrefix: string[] = []
  ): Array<{
    type: 'suite' | 'test' | 'assertion';
    path: string;
    status: 'ok' | 'error' | 'skipped';
    assertion?: TestAssertionResult;
  }> => {
    const testInfo: Array<any> = [];
    
    // Count and collect test suites
    if (results.testsSuiteResults) {
      for (const [suiteName, suiteResult] of Object.entries(results.testsSuiteResults)) {
        const currentPath = [...pathPrefix, suiteName];
        totalTestSuites++;
        
        // Determine suite status (ok if all tests in suite pass, skipped if any are skipped, error if any fail)
        const hasFailedTests = suiteResult.testsResults && 
          Object.values(suiteResult.testsResults).some(test => test.testResult === "error");
        const hasSkippedTests = suiteResult.testsResults && 
          Object.values(suiteResult.testsResults).some(test => test.testResult === "skipped");
        
        const suiteStatus = hasFailedTests ? "error" : hasSkippedTests ? "skipped" : "ok";
        
        if (suiteStatus === "ok") {
          passedTestSuites++;
        } else if (suiteStatus === "skipped") {
          skippedTestSuites++;
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
        const testStatus = testResult.testResult === "ok" ? "ok" : testResult.testResult === "skipped" ? "skipped" : "error";
        
        if (testStatus === "ok") {
          passedTests++;
        } else if (testStatus === "skipped") {
          skippedTests++;
        }
        
        // Process assertions for this test
        const assertions = Object.entries(testResult.testAssertionsResults);
        totalAssertions += assertions.length;
        
        for (const [assertionName, assertion] of assertions) {
          const assertionPath = [...pathPrefix, testName, assertionName].join(" > ");
          const assertionStatus = assertion.assertionResult === "ok" ? "ok" : assertion.assertionResult === "skipped" ? "skipped" : "error";
          
          if (assertionStatus === "ok") {
            passedAssertions++;
          } else if (assertionStatus === "skipped") {
            skippedAssertions++;
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
      const symbol = item.status === "ok" ? chalk.green("✓") : item.status === "skipped" ? chalk.gray("⏭") : chalk.red("✗");
      const statusText = item.status === "ok" ? chalk.green("[ok]") : item.status === "skipped" ? chalk.gray("[skipped]") : chalk.red("[error]");
      
      const displayPath = item.status === "skipped" ? chalk.gray(item.path) : item.path;
      log.info(`${symbol} ${displayPath} ${statusText}`);
      
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
    if (skippedTestSuites > 0) {
      const suiteSkipRate = ((skippedTestSuites / totalTestSuites) * 100).toFixed(1);
      log.info(`  ${chalk.gray("⏭ Skipped:")} ${skippedTestSuites}/${totalTestSuites} (${suiteSkipRate}%)`);
    }
    if (totalTestSuites - passedTestSuites - skippedTestSuites > 0) {
      log.info(`  ${chalk.red("✗ Failed:")} ${totalTestSuites - passedTestSuites - skippedTestSuites}/${totalTestSuites}`);
    }
  }
  
  if (totalTests > 0) {
    log.info(chalk.bold("\nTests:"));
    const testPassRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0.0";
    log.info(`  ${chalk.green("✓ Passed:")} ${passedTests}/${totalTests} (${testPassRate}%)`);
    if (skippedTests > 0) {
      const testSkipRate = ((skippedTests / totalTests) * 100).toFixed(1);
      log.info(`  ${chalk.gray("⏭ Skipped:")} ${skippedTests}/${totalTests} (${testSkipRate}%)`);
    }
    if (totalTests - passedTests - skippedTests > 0) {
      log.info(`  ${chalk.red("✗ Failed:")} ${totalTests - passedTests - skippedTests}/${totalTests}`);
    }
  }
  
  log.info(chalk.bold("\nAssertions (Detailed):"));
  const assertionPassRate = totalAssertions > 0 ? ((passedAssertions / totalAssertions) * 100).toFixed(1) : "0.0";
  log.info(`  ${chalk.green("✓ Passed:")} ${passedAssertions}/${totalAssertions} (${assertionPassRate}%)`);
  if (skippedAssertions > 0) {
    const assertionSkipRate = ((skippedAssertions / totalAssertions) * 100).toFixed(1);
    log.info(`  ${chalk.gray("⏭ Skipped:")} ${skippedAssertions}/${totalAssertions} (${assertionSkipRate}%)`);
  }
  if (totalAssertions - passedAssertions - skippedAssertions > 0) {
    log.info(`  ${chalk.red("✗ Failed:")} ${totalAssertions - passedAssertions - skippedAssertions}/${totalAssertions}`);
  }
  
  // Overall status
  const overallStatus = (passedTests + skippedTests === totalTests && passedAssertions + skippedAssertions === totalAssertions) ? "PASSED" : "FAILED";
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
  miroirActivityTracker: MiroirActivityTrackerInterface, // Optional unified tracker for test execution tracking
) => {
  if (RUN_TEST == testSuiteName) {
    log.info("#################################### transformerTestsDisplayResults ####################################");
    
    // Import chalk for colors
    // const chalk = (await import('chalk')).default;
    
    const allResults = miroirActivityTracker.getTestAssertionsResults([]);
    
    // Statistics
    let totalTestSuites = 0;
    let totalTests = 0;
    let totalAssertions = 0;
    let passedTestSuites = 0;
    let passedTests = 0;
    let passedAssertions = 0;
    let skippedTestSuites = 0;
    let skippedTests = 0;
    let skippedAssertions = 0;
    
    // Collect all test information for processing
    const collectTestInfo = (
      results: TestSuiteResult,
      pathPrefix: string[] = []
    ): Array<{
      type: 'suite' | 'test';
      path: string;
      status: 'ok' | 'error' | 'skipped';
      failedAssertions?: string[];
    }> => {
      const testInfo: Array<any> = [];
      
      // Count and collect test suites
      if (results.testsSuiteResults) {
        for (const [suiteName, suiteResult] of Object.entries(results.testsSuiteResults)) {
          const currentPath = [...pathPrefix, suiteName];
          totalTestSuites++;
          
          // Determine suite status (ok if all tests in suite pass, skipped if all are skipped)
          const testResults = suiteResult.testsResults ? Object.values(suiteResult.testsResults) : [];
          const hasFailedTests = testResults.some(test => test.testResult === "error");
          const hasPassedTests = testResults.some(test => test.testResult === "ok");
          const allSkipped = testResults.length > 0 && testResults.every(test => test.testResult === "skipped");
          
          let suiteStatus: 'ok' | 'error' | 'skipped';
          if (hasFailedTests) {
            suiteStatus = "error";
          } else if (allSkipped) {
            suiteStatus = "skipped";
            skippedTestSuites++;
          } else {
            suiteStatus = "ok";
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
          let testStatus: 'ok' | 'error' | 'skipped';
          
          if (testResult.testResult === "skipped") {
            testStatus = "skipped";
            skippedTests++;
          } else if (testResult.testResult === "ok") {
            testStatus = "ok";
            passedTests++;
          } else {
            testStatus = "error";
          }
          
          // Count assertions for this test
          const assertions = Object.entries(testResult.testAssertionsResults);
          totalAssertions += assertions.length;
          
          const failedAssertions = assertions
            .filter(([_, assertion]) => assertion.assertionResult === "error")
            .map(([name, _]) => name);
            
          const skippedAssertionsCount = assertions
            .filter(([_, assertion]) => assertion.assertionResult === "skipped").length;
            
          const passedAssertionsCount = assertions
            .filter(([_, assertion]) => assertion.assertionResult === "ok").length;
          
          // Count passed and skipped assertions
          passedAssertions += passedAssertionsCount;
          skippedAssertions += skippedAssertionsCount;
          
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
        let symbol: string;
        let statusText: string;
        
        if (test.status === "ok") {
          symbol = chalk.green("✓");
          statusText = chalk.green("[ok]");
        } else if (test.status === "skipped") {
          symbol = chalk.gray("⏭");
          statusText = chalk.gray("[skipped]");
        } else {
          symbol = chalk.red("✗");
          statusText = chalk.red("[error]");
        }
        
        const displayPath = test.status === "skipped" ? chalk.gray(test.path) : test.path;
        log.info(`${symbol} ${displayPath} ${statusText}`);
        
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
    
    if (totalTestSuites > 0) {
      log.info(chalk.bold("Test Suites:"));
      const suitePassRate = totalTestSuites > 0 ? ((passedTestSuites / totalTestSuites) * 100).toFixed(1) : "0.0";
      log.info(`  ${chalk.green("✓ Passed:")} ${passedTestSuites}/${totalTestSuites} (${suitePassRate}%)`);
      if (skippedTestSuites > 0) {
        const suiteSkipRate = ((skippedTestSuites / totalTestSuites) * 100).toFixed(1);
        log.info(`  ${chalk.gray("⏭ Skipped:")} ${skippedTestSuites}/${totalTestSuites} (${suiteSkipRate}%)`);
      }
      if (totalTestSuites - passedTestSuites - skippedTestSuites > 0) {
        log.info(`  ${chalk.red("✗ Failed:")} ${totalTestSuites - passedTestSuites - skippedTestSuites}/${totalTestSuites}`);
      }
    }
    
    log.info(chalk.bold("\nTests:"));
    const testPassRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0.0";
    log.info(`  ${chalk.green("✓ Passed:")} ${passedTests}/${totalTests} (${testPassRate}%)`);
    if (skippedTests > 0) {
      const testSkipRate = ((skippedTests / totalTests) * 100).toFixed(1);
      log.info(`  ${chalk.gray("⏭ Skipped:")} ${skippedTests}/${totalTests} (${testSkipRate}%)`);
    }
    if (totalTests - passedTests - skippedTests > 0) {
      log.info(`  ${chalk.red("✗ Failed:")} ${totalTests - passedTests - skippedTests}/${totalTests}`);
    }
    
    log.info(chalk.bold("\nAssertions:"));
    const assertionPassRate = totalAssertions > 0 ? ((passedAssertions / totalAssertions) * 100).toFixed(1) : "0.0";
    log.info(`  ${chalk.green("✓ Passed:")} ${passedAssertions}/${totalAssertions} (${assertionPassRate}%)`);
    if (skippedAssertions > 0) {
      const assertionSkipRate = ((skippedAssertions / totalAssertions) * 100).toFixed(1);
      log.info(`  ${chalk.gray("⏭ Skipped:")} ${skippedAssertions}/${totalAssertions} (${assertionSkipRate}%)`);
    }
    if (totalAssertions - passedAssertions - skippedAssertions > 0) {
      log.info(`  ${chalk.red("✗ Failed:")} ${totalAssertions - passedAssertions - skippedAssertions}/${totalAssertions}`);
    }
    
    // Overall status
    const overallStatus = (passedTests + skippedTests === totalTests && passedAssertions + skippedAssertions === totalAssertions) ? "PASSED" : "FAILED";
    const statusColor = overallStatus === "PASSED" ? chalk.green : chalk.red;
    log.info(chalk.bold(`\nOverall Status: ${statusColor(overallStatus)}`));
    
    log.info(chalk.bold("═══════════════════════════════════════════════════════════════════════════════════════════════════"));
    log.info("#################################### End of transformerTestsDisplayResults ####################################");
    
    miroirActivityTracker.resetResults();
  }
};
