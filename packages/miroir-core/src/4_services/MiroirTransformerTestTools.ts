import chalk from "chalk";
import * as vitest from "vitest";

import type {
  CoreTransformerForBuildPlusRuntime,
  MiroirTestSuite,
  MiroirTestForTransformer,
  TestAssertionResult,
  TestSuiteResult,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import {
  Action2ReturnType,
  Action2Success,
  TransformerFailure,
  type TransformerReturnType,
} from "../0_interfaces/2_domain/DomainElement";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { jsonify } from "../1_core/test-expect";
import {
  transformer_extended_apply_wrapper,
} from "../2_domain/TransformersForRuntime";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { MiroirLoggerFactory } from "./MiroirLoggerFactory";
import {
  ignorePostgresExtraAttributes,
  isJson,
  isJsonArray,
  removeUndefinedProperties,
  unNullify,
} from "./otherTools";
import type { MiroirTestRunFilter } from "./miroirTestTypes";

type VitestNamespace = typeof vitest;

chalk.level = 3;

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MiroirTransformerTestTools"),
).then((logger: LoggerInterface) => {
  log = logger;
});

export const miroirTestGlobalTimeOut = 30000;

function getValueByDottedPath(obj: unknown, path: string): unknown {
  if (path === "") {
    return obj;
  }
  return path.split(".").reduce((current: any, key) => current?.[key], obj);
}

function miroirTransformerAssertionName(leaf: MiroirTestForTransformer): string {
  return leaf.miroirTestLabel;
}

function effectiveMiroirTransformerSkip(
  leaf: MiroirTestForTransformer,
  parentSkip?: boolean,
): MiroirTestForTransformer {
  const effectiveSkip = !!(parentSkip || leaf.skip);
  if (effectiveSkip === !!leaf.skip) {
    return leaf;
  }
  return { ...leaf, skip: effectiveSkip };
}

export async function runMiroirTransformerTestInMemory(
  localVitest: VitestNamespace,
  testNamePath: string[],
  filter: MiroirTestRunFilter | undefined,
  leaf: MiroirTestForTransformer,
  modelEnvironment: MiroirModelEnvironment,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
): Promise<void> {
  const transformerTest = effectiveMiroirTransformerSkip(leaf, parentSkip);
  const assertionName = miroirTransformerAssertionName(transformerTest);

  if (
    filter?.testList &&
    (typeof filter.testList != "object" ||
      (!Array.isArray(filter.testList) && Object.keys(filter.testList).length > 0))
  ) {
    throw new Error(
      "runMiroirTransformerTestInMemory called with non-array filter.testList, this is not supported: " +
        JSON.stringify(filter),
    );
  }

  const currentTestAssertionPath =
    testAssertionPath || miroirActivityTracker.getCurrentTestAssertionPath();

  if (
    transformerTest.skip ||
    (filter?.testList &&
      !(filter.testList as string[]).includes(transformerTest.miroirTestLabel))
  ) {
    log.info(`⏭️  Skipping test: ${assertionName}`);
    if (!currentTestAssertionPath) {
      throw new Error(
        "runMiroirTransformerTestInMemory called without testAssertionPath and no currentTestAssertionPath available",
      );
    }
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
      assertionName,
      assertionResult: "skipped",
    });
    return;
  }

  const runtimeTransformer = transformerTest.transformer as CoreTransformerForBuildPlusRuntime;
  const interpolation = transformerTest.runTestStep ?? "runtime";
  let rawResult: TransformerReturnType<any>;

  const convertedTransformer = transformer_extended_apply_wrapper(
    undefined,
    "build",
    [],
    undefined,
    runtimeTransformer,
    "value",
    modelEnvironment,
    transformerTest.transformerParams ?? {},
    transformerTest.transformerRuntimeContext ?? {},
  );

  if (interpolation == "runtime" && !convertedTransformer["elementType"]) {
    rawResult = transformer_extended_apply_wrapper(
      undefined,
      "runtime",
      [],
      undefined,
      convertedTransformer,
      "value",
      modelEnvironment,
      transformerTest.transformerParams ?? {},
      transformerTest.transformerRuntimeContext ?? {},
    );
  } else {
    rawResult = convertedTransformer;
  }

  const resultWithIgnored = ignorePostgresExtraAttributes(
    rawResult,
    transformerTest.ignoreAttributes,
  );
  const resultWithRetain =
    transformerTest.retainAttributes &&
    typeof resultWithIgnored === "object" &&
    !Array.isArray(resultWithIgnored)
      ? Object.fromEntries(
          Object.entries(resultWithIgnored).filter(([key]) =>
            transformerTest.retainAttributes!.includes(key),
          ),
        )
      : resultWithIgnored;

  const testSuiteNamePathAsString = MiroirActivityTracker.testPathName(testNamePath);
  const jsonifiedResult = jsonify(resultWithRetain);

  if (!currentTestAssertionPath) {
    throw new Error(
      "runMiroirTransformerTestInMemory called without testAssertionPath and no currentTestAssertionPath available",
    );
  }

  let testAssertionResult: TestAssertionResult;
  try {
    const normalizedResult = removeUndefinedProperties(jsonifiedResult);

    if (transformerTest.subExpectedValue && transformerTest.subExpectedValue.length > 0) {
      for (const [path, expectedSubValue] of transformerTest.subExpectedValue) {
        const actualSubValue = getValueByDottedPath(normalizedResult, path);
        const normalizedExpectedSub = removeUndefinedProperties(unNullify(expectedSubValue));
        const subTestResult: any = localVitest
          .expect(actualSubValue, `${testSuiteNamePathAsString} > ${assertionName} [${path}]`)
          .toEqual(normalizedExpectedSub);
        if (subTestResult && Object.hasOwn(subTestResult, "result") && !subTestResult.result) {
          testAssertionResult = {
            assertionName,
            assertionResult: "error",
            assertionExpectedValue: expectedSubValue,
            assertionActualValue: actualSubValue,
          };
          miroirActivityTracker.setTestAssertionResult(
            currentTestAssertionPath,
            testAssertionResult,
          );
          return;
        }
      }
      testAssertionResult = { assertionName, assertionResult: "ok" };
    } else {
      const expectedValue = ignorePostgresExtraAttributes(
        transformerTest.unitTestExpectedValue ?? transformerTest.expectedValue,
        transformerTest.ignoreAttributes,
      );
      const normalizedExpected = removeUndefinedProperties(unNullify(expectedValue));
      const testResult: any = localVitest
        .expect(normalizedResult, `${testSuiteNamePathAsString} > ${assertionName}`)
        .toEqual(normalizedExpected);

      if (!testResult || !Object.hasOwn(testResult, "result")) {
        testAssertionResult = { assertionName, assertionResult: "ok" };
      } else if (testResult.result) {
        testAssertionResult = { assertionName, assertionResult: "ok" };
      } else {
        testAssertionResult = {
          assertionName,
          assertionResult: "error",
          assertionExpectedValue: transformerTest.expectedValue,
          assertionActualValue: jsonifiedResult,
        };
      }
    }
  } catch (error) {
    testAssertionResult = {
      assertionName,
      assertionResult: "error",
      assertionExpectedValue: transformerTest.expectedValue,
      assertionActualValue: jsonifiedResult,
    };
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);
    throw error;
  }

  miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);
}

export function runMiroirTransformerIntegrationTest(sqlDbDataStore: unknown) {
  return async (
    localVitest: VitestNamespace,
    testPath: string[],
    filter: MiroirTestRunFilter | undefined,
    leaf: MiroirTestForTransformer,
    modelEnvironment: MiroirModelEnvironment,
    miroirActivityTracker: MiroirActivityTrackerInterface,
    testAssertionPath?: TestAssertionPath,
    parentSkip?: boolean,
  ): Promise<void> => {
    const transformerTest = effectiveMiroirTransformerSkip(leaf, parentSkip);
    const assertionName = miroirTransformerAssertionName(transformerTest);
    const testPathName = MiroirActivityTracker.testPathName(testPath);
    const testRunStep = transformerTest.runTestStep ?? "runtime";
    const runAsSql = true;

    if (!localVitest.expect) {
      throw new Error(
        "runMiroirTransformerIntegrationTest called without vitest.expect, this is not a test environment",
      );
    }

    const currentTestAssertionPath =
      testAssertionPath || miroirActivityTracker.getCurrentTestAssertionPath();
    if (!currentTestAssertionPath) {
      throw new Error(
        "runMiroirTransformerIntegrationTest called without testAssertionPath and no currentTestAssertionPath available",
      );
    }

    if (
      transformerTest.skip ||
      (filter?.testList &&
        !(filter.testList as string[]).includes(transformerTest.miroirTestLabel))
    ) {
      miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
        assertionName,
        assertionResult: "skipped",
      });
      miroirActivityTracker.setTest(undefined);
      return;
    }

    const resolvedTransformer = transformer_extended_apply_wrapper(
      undefined,
      "build",
      [],
      (transformerTest.transformer as any)?.label,
      transformerTest.transformer,
      "value",
      modelEnvironment,
      transformerTest.transformerParams ?? {},
      transformerTest.transformerRuntimeContext ?? {},
    );

    const expectedValue =
      transformerTest.integrationTestExpectedValue ?? transformerTest.expectedValue;

    if (resolvedTransformer instanceof TransformerFailure) {
      const resultWithIgnored = ignorePostgresExtraAttributes(
        resolvedTransformer as any,
        transformerTest.ignoreAttributes,
      );
      const resultWithRetain =
        transformerTest.retainAttributes &&
        typeof resultWithIgnored === "object" &&
        !Array.isArray(resultWithIgnored)
          ? Object.fromEntries(
              Object.entries(resultWithIgnored).filter(([key]) =>
                transformerTest.retainAttributes!.includes(key),
              ),
            )
          : resultWithIgnored;
      try {
        localVitest.expect(resultWithRetain, testPathName).toEqual(expectedValue);
        miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
          assertionName: testPathName,
          assertionResult: "ok",
        });
      } catch (error) {
        miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
          assertionName: testPathName,
          assertionResult: "error",
          assertionExpectedValue: expectedValue,
          assertionActualValue: resultWithRetain,
        });
        throw error;
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
      queryResult = await (sqlDbDataStore as any).handleBoxedQueryAction({
        actionType: "runBoxedQueryAction",
        endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        payload: {
          deploymentUuid: "",
          applicationSection: "data",
          query: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            runAsSql,
            queryParams: {
              ...transformerTest.transformerParams,
              ...transformerTest.transformerRuntimeContext,
            },
            contextResults: runAsSql
              ? Object.fromEntries(
                  Object.entries(transformerTest.transformerRuntimeContext ?? {}).map(
                    (entry: [string, any]) => [
                      entry[0],
                      {
                        type: isJsonArray(entry[1])
                          ? "json_array"
                          : isJson(entry[1])
                            ? "json"
                            : typeof entry[1],
                      },
                    ],
                  ),
                )
              : (transformerTest.transformerRuntimeContext ?? {}),
            deploymentUuid: "",
            runtimeTransformers: {
              transformer: resolvedTransformer,
            },
          },
        },
      });
    }

    let resultWithIgnored: any;
    let resultWithRetain: any;
    let testAssertionResult: TestAssertionResult;
    try {
      if (queryResult["status"] == "error") {
        resultWithIgnored = ignorePostgresExtraAttributes(
          (queryResult as any).innerError,
          transformerTest.ignoreAttributes,
        );
        resultWithRetain = transformerTest.retainAttributes
          ? Object.fromEntries(
              Object.entries(resultWithIgnored).filter(([key]) =>
                transformerTest.retainAttributes!.includes(key),
              ),
            )
          : resultWithIgnored;
        localVitest
          .expect(
            resultWithRetain,
            testPathName + "comparing received query error to expected result",
          )
          .toEqual(expectedValue);
      } else {
        resultWithIgnored =
          testRunStep == "runtime"
            ? ignorePostgresExtraAttributes(
                (queryResult as Action2Success).returnedDomainElement.transformer,
                transformerTest.ignoreAttributes,
              )
            : (queryResult as Action2Success).returnedDomainElement;
        resultWithRetain =
          transformerTest.retainAttributes &&
          typeof resultWithIgnored === "object" &&
          resultWithIgnored !== null &&
          !Array.isArray(resultWithIgnored)
            ? Object.fromEntries(
                Object.entries(resultWithIgnored).filter(([key]) =>
                  transformerTest.retainAttributes!.includes(key),
                ),
              )
            : resultWithIgnored;
        localVitest.expect(resultWithRetain, testPathName).toEqual(expectedValue);
      }
      testAssertionResult = {
        assertionName: testPathName,
        assertionResult: "ok",
      };
    } catch (error) {
      testAssertionResult = {
        assertionName: testPathName,
        assertionResult: "error",
        assertionExpectedValue: expectedValue,
        assertionActualValue: resultWithRetain,
      };
      miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);
      throw error;
    }
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);
  };
}

export const displayMiroirTestResults = async (
  _miroirTestSuite: MiroirTestSuite,
  runTestLabel: string,
  testSuiteName: string,
  miroirActivityTracker: MiroirActivityTrackerInterface,
) => {
  if (runTestLabel != testSuiteName) {
    return;
  }

  log.info("#################################### displayMiroirTestResults ####################################");

  const allResults = miroirActivityTracker.getTestAssertionsResults([]);

  let totalTestSuites = 0;
  let totalTests = 0;
  let totalAssertions = 0;
  let passedTestSuites = 0;
  let passedTests = 0;
  let passedAssertions = 0;
  let skippedTestSuites = 0;
  let skippedTests = 0;
  let skippedAssertions = 0;

  const collectTestInfo = (
    results: TestSuiteResult,
    pathPrefix: string[] = [],
  ): Array<{
    type: "suite" | "test";
    path: string;
    status: "ok" | "error" | "skipped";
    failedAssertions?: string[];
  }> => {
    const testInfo: Array<{
      type: "suite" | "test";
      path: string;
      status: "ok" | "error" | "skipped";
      failedAssertions?: string[];
    }> = [];

    if (results.testsSuiteResults) {
      for (const [suiteName, suiteResult] of Object.entries(results.testsSuiteResults)) {
        const currentPath = [...pathPrefix, suiteName];
        totalTestSuites++;
        const testResults = suiteResult.testsResults ? Object.values(suiteResult.testsResults) : [];
        const hasFailedTests = testResults.some((test) => test.testResult === "error");
        const allSkipped =
          testResults.length > 0 && testResults.every((test) => test.testResult === "skipped");

        if (hasFailedTests) {
          // failed suite
        } else if (allSkipped) {
          skippedTestSuites++;
        } else {
          passedTestSuites++;
        }

        testInfo.push(...collectTestInfo(suiteResult, currentPath));
      }
    }

    if (results.testsResults) {
      for (const [testName, testResult] of Object.entries(results.testsResults)) {
        totalTests++;
        const testPath = [...pathPrefix, testName].join(" > ");
        let testStatus: "ok" | "error" | "skipped";

        if (testResult.testResult === "skipped") {
          testStatus = "skipped";
          skippedTests++;
        } else if (testResult.testResult === "ok") {
          testStatus = "ok";
          passedTests++;
        } else {
          testStatus = "error";
        }

        const assertions = Object.entries(testResult.testAssertionsResults);
        totalAssertions += assertions.length;

        const failedAssertions = assertions
          .filter(([_, assertion]) => assertion.assertionResult === "error")
          .map(([name]) => name);

        passedAssertions += assertions.filter(
          ([_, assertion]) => assertion.assertionResult === "ok",
        ).length;
        skippedAssertions += assertions.filter(
          ([_, assertion]) => assertion.assertionResult === "skipped",
        ).length;

        testInfo.push({
          type: "test",
          path: testPath,
          status: testStatus,
          failedAssertions: failedAssertions.length > 0 ? failedAssertions : undefined,
        });
      }
    }

    return testInfo;
  };

  const allTestInfo = collectTestInfo(allResults);

  for (const test of allTestInfo) {
    if (test.type === "test") {
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

      if (test.failedAssertions && test.failedAssertions.length > 0) {
        log.info(chalk.red(`    Failed assertions: ${test.failedAssertions.join(", ")}`));
      }
    }
  }

  log.info("\n" + chalk.bold("═".repeat(99)));
  log.info(chalk.bold.blue("                                        TEST EXECUTION SUMMARY"));
  log.info(chalk.bold("═".repeat(99)));

  if (totalTestSuites > 0) {
    log.info(chalk.bold("Test Suites:"));
    const suitePassRate =
      totalTestSuites > 0 ? ((passedTestSuites / totalTestSuites) * 100).toFixed(1) : "0.0";
    log.info(`  ${chalk.green("✓ Passed:")} ${passedTestSuites}/${totalTestSuites} (${suitePassRate}%)`);
    if (skippedTestSuites > 0) {
      log.info(`  ${chalk.gray("⏭ Skipped:")} ${skippedTestSuites}/${totalTestSuites}`);
    }
    if (totalTestSuites - passedTestSuites - skippedTestSuites > 0) {
      log.info(
        `  ${chalk.red("✗ Failed:")} ${totalTestSuites - passedTestSuites - skippedTestSuites}/${totalTestSuites}`,
      );
    }
  }

  log.info(chalk.bold("\nTests:"));
  const testPassRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0.0";
  log.info(`  ${chalk.green("✓ Passed:")} ${passedTests}/${totalTests} (${testPassRate}%)`);
  if (skippedTests > 0) {
    log.info(`  ${chalk.gray("⏭ Skipped:")} ${skippedTests}/${totalTests}`);
  }
  if (totalTests - passedTests - skippedTests > 0) {
    log.info(`  ${chalk.red("✗ Failed:")} ${totalTests - passedTests - skippedTests}/${totalTests}`);
  }

  log.info(chalk.bold("\nAssertions:"));
  const assertionPassRate =
    totalAssertions > 0 ? ((passedAssertions / totalAssertions) * 100).toFixed(1) : "0.0";
  log.info(
    `  ${chalk.green("✓ Passed:")} ${passedAssertions}/${totalAssertions} (${assertionPassRate}%)`,
  );
  if (skippedAssertions > 0) {
    log.info(`  ${chalk.gray("⏭ Skipped:")} ${skippedAssertions}/${totalAssertions}`);
  }
  if (totalAssertions - passedAssertions - skippedAssertions > 0) {
    log.info(
      `  ${chalk.red("✗ Failed:")} ${totalAssertions - passedAssertions - skippedAssertions}/${totalAssertions}`,
    );
  }

  const overallStatus =
    passedTests + skippedTests === totalTests &&
    passedAssertions + skippedAssertions === totalAssertions
      ? "PASSED"
      : "FAILED";
  const statusColor = overallStatus === "PASSED" ? chalk.green : chalk.red;
  log.info(chalk.bold(`\nOverall Status: ${statusColor(overallStatus)}`));
  log.info(chalk.bold("═".repeat(99)));
  log.info("#################################### End of displayMiroirTestResults ####################################");

  miroirActivityTracker.resetResults();
};

/** Exported for tests that assert skip-flag merging on transformer leaves. */
export { effectiveMiroirTransformerSkip, miroirTransformerAssertionName };
