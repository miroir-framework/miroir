import * as vitest from "vitest";

import type {
  FunctionCallTest,
  QueryRunnerTest,
  TestAssertionResult,
  TransformerTest,
  UnitTestAsTransformerTest,
  UnitTestLeaf,
  UnitTestSuite,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import { jsonify } from "../1_core/test-expect";
import { resolveFunctionCallTarget } from "./FunctionCallTestRegistry";
import { runQueryRunnerTestInMemory } from "./QueryRunnerTestTools";

const JSON_UNDEFINED_SENTINEL = "__miroirJsonUndefined";

/** Deserialize functionCallTest arguments / expected values from store JSON. */
export function deserializeFunctionCallValue(value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    JSON_UNDEFINED_SENTINEL in (value as Record<string, unknown>) &&
    (value as Record<string, unknown>)[JSON_UNDEFINED_SENTINEL] === true
  ) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(deserializeFunctionCallValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        deserializeFunctionCallValue(entry),
      ]),
    );
  }
  return value;
}

export {
  listQueryRunnerFixtureRefs,
  queryRunnerTestJzodSchema,
  resolveQueryRunnerFixture,
  runQueryRunnerTestInMemory,
} from "./QueryRunnerTestTools";
import { ignorePostgresExtraAttributes, removeUndefinedProperties, unNullify } from "./otherTools";
import {
  globalTimeOut,
  runTransformerTestInMemory,
  runTransformerTestSuite,
  runUnitTransformerTests,
  type RunTransformerTests,
  type TestSuiteListFilter,
} from "./TestTools";

export { functionCallTest as functionCallTestJzodSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
export {
  listWhitelistedFunctionRefs,
  resolveFunctionCallTarget,
  type FunctionCallRef,
} from "./FunctionCallTestRegistry";

type VitestNamespace = typeof vitest;

export type { UnitTestSuite, UnitTestAsTransformerTest, FunctionCallTest, QueryRunnerTest };

/** Unwrap a transformer unit test to the legacy TransformerTest shape (non-regression bridge). */
export function asTransformerTestFromUnitTest(
  unitTest: UnitTestAsTransformerTest,
  parentSkip?: boolean,
): TransformerTest {
  const effectiveSkip = !!(parentSkip || unitTest.skip || unitTest.payload.skip);
  return {
    ...unitTest.payload,
    skip: effectiveSkip,
    transformerTestLabel:
      unitTest.payload.transformerTestLabel ??
      unitTest.unitTestLabel ??
      unitTest.payload.transformerName,
  };
}

/** Convert a transformer-only UnitTestSuite to TransformerTestSuite (for legacy runners). */
export function unitTestSuiteToTransformerTestSuite(
  suite: UnitTestSuite,
): import("../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType").TransformerTestSuite {
  const transformerTests = suite.unitTests.map((child) => {
    if (child.unitTestType === "unitTestSuite") {
      return unitTestSuiteToTransformerTestSuite(child);
    }
    if (child.unitTestType !== "transformerTest") {
      throw new Error(
        `unitTestSuiteToTransformerTestSuite: unsupported unitTestType "${child.unitTestType}" in suite "${suite.unitTestLabel}"`,
      );
    }
    return asTransformerTestFromUnitTest(child, suite.skip);
  });
  return {
    transformerTestType: "transformerTestSuite",
    transformerTestLabel: suite.unitTestLabel,
    skip: suite.skip,
    transformerTests,
  };
}

export type RunUnitTest = (
  localVitest: VitestNamespace,
  testNamePath: string[],
  filter: { testList?: TestSuiteListFilter; match?: RegExp } | undefined,
  unitTest: UnitTestLeaf,
  modelEnvironment: MiroirModelEnvironment,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  parentTrackingId: string | undefined,
  trackActionsBelow: boolean,
  runUnitTests: RunUnitTests,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
) => Promise<void>;

export interface RunUnitTests {
  _runUnitTestSuite: typeof runUnitTestSuite;
  _runUnitTest: RunUnitTest;
  _runUnitTestSuiteWithTracking: typeof runUnitTestSuite;
  _runUnitTestWithTracking: RunUnitTest;
}

export async function runUnitTestInMemory(
  localVitest: VitestNamespace,
  testNamePath: string[],
  filter: { testList?: TestSuiteListFilter; match?: RegExp } | undefined,
  unitTest: UnitTestLeaf,
  modelEnvironment: MiroirModelEnvironment,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  parentTrackingId: string | undefined,
  trackActionsBelow: boolean,
  runUnitTests: RunUnitTests,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
  runTransformerTests: RunTransformerTests = runUnitTransformerTests,
): Promise<void> {
  switch (unitTest.unitTestType) {
    case "transformerTest": {
      const transformerTest = asTransformerTestFromUnitTest(unitTest, parentSkip);
      return runTransformerTestInMemory(
        localVitest,
        testNamePath,
        filter,
        transformerTest,
        modelEnvironment,
        miroirActivityTracker,
        parentTrackingId,
        trackActionsBelow,
        runTransformerTests,
        testAssertionPath,
      );
    }
    case "functionCallTest":
      return runFunctionCallTestInMemory(
        localVitest,
        testNamePath,
        filter,
        unitTest,
        miroirActivityTracker,
        testAssertionPath,
        parentSkip,
      );
    case "queryRunnerTest":
      return runQueryRunnerTestInMemory(
        localVitest,
        testNamePath,
        filter,
        unitTest,
        miroirActivityTracker,
        testAssertionPath,
        parentSkip,
        modelEnvironment,
      );
    default: {
      const _exhaustive: never = unitTest;
      throw new Error(`Unknown unitTestType: ${( _exhaustive as UnitTestLeaf).unitTestType}`);
    }
  }
}

export async function runFunctionCallTestInMemory(
  localVitest: VitestNamespace,
  testNamePath: string[],
  filter: { testList?: TestSuiteListFilter; match?: RegExp } | undefined,
  unitTest: FunctionCallTest,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
): Promise<void> {
  const assertionName = unitTest.unitTestLabel;
  const effectiveSkip = !!(parentSkip || unitTest.skip);

  const currentTestAssertionPath =
    testAssertionPath || miroirActivityTracker.getCurrentTestAssertionPath();
  if (!currentTestAssertionPath) {
    throw new Error(
      "runFunctionCallTestInMemory called without testAssertionPath and no currentTestAssertionPath available",
    );
  }

  if (
    effectiveSkip ||
    (filter?.testList && !(filter.testList as string[]).includes(assertionName))
  ) {
    miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, {
      assertionName,
      assertionResult: "skipped",
    });
    return;
  }

  const fn = resolveFunctionCallTarget(unitTest.functionRef);
  const args = (unitTest.arguments ?? []).map(deserializeFunctionCallValue);
  const testSuiteNamePathAsString = MiroirActivityTracker.testPathName(testNamePath);

  let testAssertionResult: TestAssertionResult;

  try {
    if (unitTest.expectedError) {
      const throwFn = () => fn(...args);
      const testResult: any = localVitest
        .expect(throwFn, `${testSuiteNamePathAsString} > ${assertionName}`)
        .toThrow(unitTest.expectedError);

      if (!testResult || !Object.hasOwn(testResult, "result")) {
        testAssertionResult = { assertionName, assertionResult: "ok" };
      } else if (testResult.result) {
        testAssertionResult = { assertionName, assertionResult: "ok" };
      } else {
        testAssertionResult = {
          assertionName,
          assertionResult: "error",
          assertionExpectedValue: unitTest.expectedError,
        };
      }
    } else if (unitTest.expectUndefinedResult) {
      const rawResult = fn(...args);
      const testResult: any = localVitest
        .expect(rawResult, `${testSuiteNamePathAsString} > ${assertionName}`)
        .toEqual(undefined);

      if (!testResult || !Object.hasOwn(testResult, "result")) {
        testAssertionResult = { assertionName, assertionResult: "ok" };
      } else if (testResult.result) {
        testAssertionResult = { assertionName, assertionResult: "ok" };
      } else {
        testAssertionResult = {
          assertionName,
          assertionResult: "error",
          assertionExpectedValue: undefined,
          assertionActualValue: jsonify(rawResult),
        };
      }
    } else {
      const rawResult = fn(...args);
      const resultForNormalize =
        rawResult instanceof Set ? Array.from(rawResult) : rawResult;
      const resultWithIgnored = ignorePostgresExtraAttributes(
        resultForNormalize,
        unitTest.ignoreAttributes,
      );
      const jsonifiedResult = jsonify(resultWithIgnored);
      const normalizedResult = removeUndefinedProperties(jsonifiedResult);
      const expectedValue = ignorePostgresExtraAttributes(
        deserializeFunctionCallValue(unitTest.expectedValue),
        unitTest.ignoreAttributes,
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
          assertionExpectedValue: unitTest.expectedValue,
          assertionActualValue: jsonifiedResult,
        };
      }
    }
  } catch {
    testAssertionResult = {
      assertionName,
      assertionResult: "error",
      assertionExpectedValue: unitTest.expectedError ?? unitTest.expectedValue,
    };
  }

  miroirActivityTracker.setTestAssertionResult(currentTestAssertionPath, testAssertionResult);
}

function unitTestLabel(unitTest: UnitTestLeaf): string {
  switch (unitTest.unitTestType) {
    case "transformerTest":
      return (
        unitTest.unitTestLabel ??
        unitTest.payload.transformerTestLabel ??
        unitTest.payload.transformerName
      );
    default:
      return unitTest.unitTestLabel;
  }
}

function unitTestOrSuiteLabel(
  unitTest: UnitTestLeaf | UnitTestSuite,
): string {
  if (unitTest.unitTestType === "unitTestSuite") {
    return unitTest.unitTestLabel;
  }
  return unitTestLabel(unitTest);
}

export async function runUnitTestSuite(
  localVitest: VitestNamespace,
  testSuitePath: string[],
  unitTestSuite: UnitTestSuite,
  filter: { testList?: TestSuiteListFilter; match?: RegExp } | undefined,
  modelEnvironment: MiroirModelEnvironment,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  parentTrackingId: string | undefined,
  trackActionsBelow: boolean = false,
  runUnitTests: RunUnitTests,
  parentSkip?: boolean,
): Promise<void> {
  if (!localVitest.expect) {
    throw new Error("runUnitTestSuite called without vitest.expect");
  }

  const shouldSkipSuite = unitTestSuite.skip || parentSkip;

  const innerFilter: { testList: TestSuiteListFilter | undefined } = filter?.testList
    ? typeof filter.testList === "object" &&
      !Array.isArray(filter.testList) &&
      Object.hasOwn(filter.testList, unitTestSuite.unitTestLabel)
      ? { testList: filter.testList[unitTestSuite.unitTestLabel] }
      : { testList: [] }
    : { testList: undefined };

  const allTests = unitTestSuite.unitTests;
  const selectedTests = allTests.filter(
    (e) =>
      !innerFilter?.testList ||
      (Array.isArray(innerFilter?.testList) &&
        innerFilter.testList.includes(unitTestOrSuiteLabel(e))) ||
      (!Array.isArray(innerFilter?.testList) &&
        typeof innerFilter?.testList === "object" &&
        Object.hasOwn(innerFilter.testList, unitTestOrSuiteLabel(e))),
  );

  for (const unitTestParam of allTests) {
    const label = unitTestOrSuiteLabel(unitTestParam);
    const isSkipped = !selectedTests.includes(unitTestParam) || !!shouldSkipSuite;

    if (unitTestParam.unitTestType === "unitTestSuite") {
      const runNested = trackActionsBelow
        ? runUnitTests._runUnitTestSuiteWithTracking
        : runUnitTests._runUnitTestSuite;
      await runNested(
        localVitest,
        [...testSuitePath, unitTestParam.unitTestLabel],
        unitTestParam,
        innerFilter,
        modelEnvironment,
        miroirActivityTracker,
        parentTrackingId,
        trackActionsBelow,
        runUnitTests,
        shouldSkipSuite,
      );
    } else {
      const effectiveLeaf: UnitTestLeaf = isSkipped
        ? { ...unitTestParam, skip: true }
        : unitTestParam;

      const runUnitTest = trackActionsBelow
        ? runUnitTests._runUnitTestWithTracking
        : runUnitTests._runUnitTest;

      const vitestTestFn = isSkipped ? localVitest.test.skip : localVitest.test;
      await vitestTestFn(
        label,
        async () => {
          const testAssertionPath: TestAssertionPath =
            MiroirActivityTracker.stringArrayToTestAssertionPath(testSuitePath);
          testAssertionPath.push({ test: label });
          testAssertionPath.push({ testAssertion: label });

          await runUnitTest(
            localVitest,
            [...testSuitePath, label],
            innerFilter,
            effectiveLeaf,
            modelEnvironment,
            miroirActivityTracker,
            parentTrackingId,
            trackActionsBelow,
            runUnitTests,
            testAssertionPath,
            shouldSkipSuite,
          );
        },
        globalTimeOut,
      );
    }
  }
}

export const runUnitTests: RunUnitTests = {
  _runUnitTestSuite: runUnitTestSuite,
  _runUnitTest: runUnitTestInMemory,
  _runUnitTestSuiteWithTracking: async (
    localVitest,
    testSuitePath,
    unitTestSuite,
    filter,
    modelEnvironment,
    miroirActivityTracker,
    parentTrackingId = undefined,
    trackActionsBelow = false,
    runUnitTestsRef,
    parentSkip?,
  ) => {
    const testSuiteName = unitTestSuite.unitTestLabel ?? unitTestSuite.unitTestType;
    const testSuitePathAsString = MiroirActivityTracker.testPathName(testSuitePath);
    await miroirActivityTracker.trackTestSuite(
      testSuiteName,
      testSuitePathAsString,
      parentTrackingId,
      async (nestedParentTrackingId) => {
        await runUnitTestsRef._runUnitTestSuite(
          localVitest,
          testSuitePath,
          unitTestSuite,
          filter,
          modelEnvironment,
          miroirActivityTracker,
          nestedParentTrackingId,
          trackActionsBelow,
          runUnitTestsRef,
          parentSkip,
        );
      },
    );
  },
  _runUnitTestWithTracking: async (
    localVitest,
    testNamePath,
    filter,
    unitTest,
    modelEnvironment,
    miroirActivityTracker,
    parentTrackingId = undefined,
    trackActionsBelow = false,
    runUnitTestsRef,
    testAssertionPath?,
    parentSkip?,
  ) => {
    const label = unitTestLabel(unitTest);
    await miroirActivityTracker.trackTest(label, parentTrackingId, async (nestedId) => {
      await miroirActivityTracker.trackTestAssertion(label, nestedId, async (assertionId) => {
        await runUnitTestsRef._runUnitTest(
          localVitest,
          testNamePath,
          filter,
          unitTest,
          modelEnvironment,
          miroirActivityTracker,
          assertionId,
          trackActionsBelow,
          runUnitTestsRef,
          testAssertionPath,
          parentSkip,
        );
      });
    });
  },
};

/** Run a transformer-only unit test suite via the legacy transformer runner (non-regression helper). */
export async function runUnitTestSuiteAsTransformerTests(
  localVitest: VitestNamespace,
  testSuitePath: string[],
  unitTestSuite: UnitTestSuite,
  filter: { testList?: TestSuiteListFilter; match?: RegExp } | undefined,
  modelEnvironment: MiroirModelEnvironment,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  parentTrackingId: string | undefined,
  trackActionsBelow: boolean,
  runTransformerTests: RunTransformerTests,
  parentSkip?: boolean,
): Promise<void> {
  const transformerTestSuite = unitTestSuiteToTransformerTestSuite(unitTestSuite);
  return runTransformerTestSuite(
    localVitest,
    testSuitePath,
    transformerTestSuite,
    filter,
    modelEnvironment,
    miroirActivityTracker,
    parentTrackingId,
    trackActionsBelow,
    runTransformerTests,
    parentSkip,
  );
}
