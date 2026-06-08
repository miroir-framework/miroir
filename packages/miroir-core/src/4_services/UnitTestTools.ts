import * as vitest from "vitest";

import type {
  FunctionCallTest,
  QueryRunnerTest,
  TransformerTest,
  UnitTestAsCompositeActionTest,
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
import {
  globalTimeOut,
  runTransformerTestInMemory,
  runTransformerTestSuite,
  runUnitTransformerTests,
  type RunTransformerTests,
  type TestSuiteListFilter,
} from "./TestTools";

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
      throw new Error(
        `functionCallTest "${unitTest.unitTestLabel}" is not runnable yet (Phase 2)`,
      );
    case "queryRunnerTest":
      throw new Error(
        `queryRunnerTest "${unitTest.unitTestLabel}" is not runnable yet (Phase 3)`,
      );
    case "compositeActionTest":
      throw new Error(
        `compositeActionTest "${unitTest.unitTestLabel ?? "unnamed"}" is not runnable yet (Phase 4)`,
      );
    default: {
      const _exhaustive: never = unitTest;
      throw new Error(`Unknown unitTestType: ${( _exhaustive as UnitTestLeaf).unitTestType}`);
    }
  }
}

function unitTestLabel(unitTest: UnitTestLeaf): string {
  switch (unitTest.unitTestType) {
    case "transformerTest":
      return (
        unitTest.unitTestLabel ??
        unitTest.payload.transformerTestLabel ??
        unitTest.payload.transformerName
      );
    case "compositeActionTest":
      return unitTest.unitTestLabel ?? unitTest.payload.testLabel;
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
