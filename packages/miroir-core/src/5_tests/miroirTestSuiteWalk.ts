import type {
  MiroirTestLeaf,
  MiroirTestSuite,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import type { MiroirTestRunFilter, TestSuiteListFilter } from "../0_interfaces/5-tests/miroirTestTypes";
import { miroirTestGlobalTimeOut } from "./MiroirTransformerTestTools.js";
import { isMiroirTestLeafSelected, resolveSuiteInnerFilter } from "./miroirTestFilter.js";
import type {
  MiroirTestExecutionOptions,
  RunMiroirTests,
  VitestNamespace,
} from "./MiroirTestTools.js";

function miroirTestLeafLabel(leaf: MiroirTestLeaf): string {
  return leaf.miroirTestLabel;
}

function miroirTestNodeLabel(node: MiroirTestLeaf | MiroirTestSuite): string {
  if (node.miroirTestType === "miroirTestSuite") {
    return node.miroirTestLabel;
  }
  return miroirTestLeafLabel(node);
}

export type RunMiroirTestSuiteWalkParams = {
  localVitest: VitestNamespace;
  testSuitePath: string[];
  miroirTestSuite: MiroirTestSuite;
  filter: MiroirTestRunFilter | undefined;
  modelEnvironment: MiroirModelEnvironment;
  miroirActivityTracker: MiroirActivityTrackerInterface;
  parentTrackingId: string | undefined;
  trackActionsBelow: boolean;
  runMiroirTests: RunMiroirTests;
  executionOptions?: MiroirTestExecutionOptions;
  parentSkip?: boolean;
  /** When true, run leaves directly without vitest.test registration. */
  inProcess: boolean;
};

export async function runMiroirTestSuiteWalk(
  params: RunMiroirTestSuiteWalkParams,
): Promise<void> {
  const {
    localVitest,
    testSuitePath,
    miroirTestSuite,
    filter,
    modelEnvironment,
    miroirActivityTracker,
    parentTrackingId,
    trackActionsBelow,
    runMiroirTests,
    executionOptions,
    parentSkip,
    inProcess,
  } = params;

  if (!localVitest.expect) {
    throw new Error("runMiroirTestSuiteWalk called without vitest.expect");
  }

  const shouldSkipSuite = miroirTestSuite.skip || parentSkip;

  const allTests = miroirTestSuite.miroirTests;
  const availableLeafLabels = allTests.map(miroirTestNodeLabel);
  const { testList: innerTestList, filterProvidedButEmpty } = resolveSuiteInnerFilter(
    filter,
    miroirTestSuite.miroirTestLabel,
    availableLeafLabels,
  );
  const innerFilter: { testList: TestSuiteListFilter | undefined } = { testList: innerTestList };

  if (filterProvidedButEmpty) {
    console.warn(
      `MiroirTest filter matched no tests in suite "${miroirTestSuite.miroirTestLabel}". ` +
        `Filter keys must be the suite miroirTestLabel (e.g. "runner.library" for --suites runner_library), ` +
        `not the registry key or a bare leaf label at the wrong level. ` +
        `Available leaves: ${availableLeafLabels.join(", ")}`,
    );
  }
  const selectedTests = allTests.filter((entry) =>
    isMiroirTestLeafSelected(miroirTestNodeLabel(entry), innerFilter?.testList),
  );

  if (allTests.length === 0) {
    if (inProcess) {
      return;
    }
    const vitestTestFn = shouldSkipSuite ? localVitest.test.skip : localVitest.test;
    await vitestTestFn(
      `${miroirTestSuite.miroirTestLabel} (empty suite)`,
      () => {},
      miroirTestGlobalTimeOut,
    );
    return;
  }

  for (const node of allTests) {
    const label = miroirTestNodeLabel(node);
    const isSkipped = !selectedTests.includes(node) || !!shouldSkipSuite;

    if (node.miroirTestType === "miroirTestSuite") {
      const nestedParams: RunMiroirTestSuiteWalkParams = {
        ...params,
        testSuitePath: [...testSuitePath, node.miroirTestLabel],
        miroirTestSuite: node,
        filter: innerFilter,
        parentSkip: shouldSkipSuite,
      };

      if (inProcess) {
        const runNested = () => runMiroirTestSuiteWalk(nestedParams);
        if (trackActionsBelow) {
          const testSuitePathAsString = MiroirActivityTracker.testPathName(nestedParams.testSuitePath);
          await miroirActivityTracker.trackTestSuite(
            node.miroirTestLabel,
            testSuitePathAsString,
            parentTrackingId,
            async (nestedParentTrackingId) => {
              await runMiroirTestSuiteWalk({
                ...nestedParams,
                parentTrackingId: nestedParentTrackingId,
              });
            },
          );
        } else {
          await runNested();
        }
        continue;
      }

      const runNested = trackActionsBelow
        ? runMiroirTests._runMiroirTestSuiteWithTracking
        : runMiroirTests._runMiroirTestSuite;
      await runNested(
        localVitest,
        nestedParams.testSuitePath,
        node,
        innerFilter,
        modelEnvironment,
        miroirActivityTracker,
        parentTrackingId,
        trackActionsBelow,
        runMiroirTests,
        executionOptions,
        shouldSkipSuite,
      );
      continue;
    }

    const effectiveLeaf: MiroirTestLeaf = isSkipped ? { ...node, skip: true } : node;
    const runMiroirTestFn = trackActionsBelow
      ? runMiroirTests._runMiroirTestWithTracking
      : runMiroirTests._runMiroirTest;

    if (inProcess) {
      if (isSkipped || shouldSkipSuite || effectiveLeaf.skip) {
        continue;
      }

      const assertionPath: TestAssertionPath =
        MiroirActivityTracker.stringArrayToTestAssertionPath(testSuitePath);
      assertionPath.push({ test: label });
      assertionPath.push({ testAssertion: label });

      await runMiroirTestFn(
        localVitest,
        [...testSuitePath, label],
        innerFilter,
        effectiveLeaf,
        modelEnvironment,
        miroirActivityTracker,
        parentTrackingId,
        trackActionsBelow,
        runMiroirTests,
        executionOptions,
        assertionPath,
        isSkipped || shouldSkipSuite,
      );
      continue;
    }

    const vitestTestFn = isSkipped ? localVitest.test.skip : localVitest.test;
    await vitestTestFn(
      label,
      async () => {
        const assertionPath: TestAssertionPath =
          MiroirActivityTracker.stringArrayToTestAssertionPath(testSuitePath);
        assertionPath.push({ test: label });
        assertionPath.push({ testAssertion: label });

        await runMiroirTestFn(
          localVitest,
          [...testSuitePath, label],
          innerFilter,
          effectiveLeaf,
          modelEnvironment,
          miroirActivityTracker,
          parentTrackingId,
          trackActionsBelow,
          runMiroirTests,
          executionOptions,
          assertionPath,
          isSkipped || shouldSkipSuite,
        );
      },
      miroirTestGlobalTimeOut,
    );
  }
}
