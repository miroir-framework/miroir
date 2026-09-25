/**
 * Issue #286 Slice 6: `excludeMiroirTestTypes` on the `"unit"` arm of `MiroirTestExecutionOptions`.
 *
 * `_runMiroirTestWithTracking` records a leaf whose `miroirTestType` is excluded as skipped and does
 * not call its arm. Run all uses it to leave out the `reactComponentTest` leaves when its "Include
 * component tests" checkbox is off (analysis §5.2, §5.6).
 *
 * Runs in-process with `TestFramework` (the Miroir Tests UI path). Each test restores the
 * registered component test runner in `finally`.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-core -- excludeMiroirTestTypes.286.phase6
 * ```
 */
import { describe, expect, it } from "vitest";

import type {
  MiroirTestLeaf,
  MiroirTestSuite,
  TestAssertionResult,
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { ReactComponentTestRunner } from "../../../../src/0_interfaces/5-tests/miroirTestTypes";
import { defaultMetaModelEnvironment } from "../../../../src/1_core/Model";
import { TestFramework } from "../../../../src/1_core/testing/test-expect";
import { ConfigurationService } from "../../../../src/3_controllers/ConfigurationService";
import { MiroirActivityTracker } from "../../../../src/3_controllers/MiroirActivityTracker";
import {
  runMiroirTests,
  type MiroirTestExecutionOptions,
  type VitestNamespace,
} from "../../../../src/5_tests/MiroirTestTools";

const suiteLabel = "excludeMiroirTestTypes.286.phase6";
const componentLeafA = "JzodArrayEditor: case A";
const componentLeafB = "JzodArrayEditor: case B";
const transformerLeaf = "returnValue gives 42";

function reactComponentLeaf(label: string, caseLabel: string): MiroirTestLeaf {
  return {
    miroirTestType: "reactComponentTest",
    miroirTestLabel: label,
    componentTestRef: { suite: "JzodArrayEditor", case: caseLabel },
  } as unknown as MiroirTestLeaf;
}

function returnValueTransformerLeaf(label: string): MiroirTestLeaf {
  return {
    miroirTestType: "transformerTest",
    miroirTestLabel: label,
    transformerName: "returnValue",
    runTestStep: "build",
    transformer: { transformerType: "returnValue", value: 42 },
    transformerParams: {},
    expectedValue: 42,
  } as unknown as MiroirTestLeaf;
}

const mixedSuite: MiroirTestSuite = {
  miroirTestType: "miroirTestSuite",
  miroirTestLabel: suiteLabel,
  miroirTests: [
    reactComponentLeaf(componentLeafA, "case A"),
    returnValueTransformerLeaf(transformerLeaf),
    reactComponentLeaf(componentLeafB, "case B"),
  ],
} as MiroirTestSuite;

async function runSuiteInProcess(
  executionOptions: MiroirTestExecutionOptions,
): Promise<MiroirActivityTracker> {
  const tracker = new MiroirActivityTracker();
  await runMiroirTests._runMiroirTestSuite(
    TestFramework as unknown as VitestNamespace,
    [suiteLabel],
    mixedSuite,
    undefined,
    defaultMetaModelEnvironment,
    tracker,
    undefined,
    true,
    runMiroirTests,
    executionOptions,
  );
  return tracker;
}

/** Every assertion result recorded in the tracker, keyed by assertion name. */
function recordedAssertions(tracker: MiroirActivityTracker): Record<string, TestAssertionResult> {
  const found: Record<string, TestAssertionResult> = {};
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") {
      return;
    }
    const candidate = node as Partial<TestAssertionResult>;
    if (typeof candidate.assertionName === "string" && typeof candidate.assertionResult === "string") {
      found[candidate.assertionName] = candidate as TestAssertionResult;
      return;
    }
    Object.values(node).forEach(visit);
  };
  visit(tracker.getTestAssertionsResults([]));
  return found;
}

async function withCountingRunner(body: (calls: string[]) => Promise<void>): Promise<void> {
  const previous = ConfigurationService.configurationService.reactComponentTestRunner;
  const calls: string[] = [];
  // #292: the runner receives the leaf; a legacy leaf holds its componentTestRef.
  const runner: ReactComponentTestRunner = async ({ leaf }) => {
    calls.push(leaf.componentTestRef?.case ?? "");
    return { status: "ok" };
  };
  ConfigurationService.configurationService.registerReactComponentTestRunner(runner);
  try {
    await body(calls);
  } finally {
    ConfigurationService.configurationService.registerReactComponentTestRunner(previous);
  }
}

// ################################################################################################
describe("excludeMiroirTestTypes", () => {
  it("without exclusion, the component leaves call the runner and the transformer leaf runs", async () => {
    await withCountingRunner(async (calls) => {
      const results = recordedAssertions(await runSuiteInProcess({ executionMode: "unit" }));
      expect(calls).toEqual(["case A", "case B"]);
      expect(results[componentLeafA]?.assertionResult).toBe("ok");
      expect(results[componentLeafB]?.assertionResult).toBe("ok");
      expect(results[transformerLeaf]?.assertionResult).toBe("ok");
    });
  });

  it('excludeMiroirTestTypes: ["reactComponentTest"] records those leaves as skipped, does not call their arm, and runs the other leaves', async () => {
    await withCountingRunner(async (calls) => {
      const results = recordedAssertions(
        await runSuiteInProcess({
          executionMode: "unit",
          excludeMiroirTestTypes: ["reactComponentTest"],
        }),
      );
      expect(calls).toEqual([]);
      expect(results[componentLeafA]?.assertionResult).toBe("skipped");
      expect(results[componentLeafB]?.assertionResult).toBe("skipped");
      expect(JSON.stringify(results[componentLeafA])).toContain(
        "reactComponentTest leaves are excluded from this run",
      );
      expect(results[transformerLeaf]?.assertionResult).toBe("ok");
    });
  });

  it("the exclusion applies to any leaf type: excluding transformerTest skips the transformer leaf only", async () => {
    await withCountingRunner(async (calls) => {
      const results = recordedAssertions(
        await runSuiteInProcess({
          executionMode: "unit",
          excludeMiroirTestTypes: ["transformerTest"],
        }),
      );
      expect(calls).toEqual(["case A", "case B"]);
      expect(results[transformerLeaf]?.assertionResult).toBe("skipped");
      expect(results[componentLeafA]?.assertionResult).toBe("ok");
    });
  });
});
