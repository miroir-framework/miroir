/**
 * Issue #292 Slice 1: the `reactComponentTestSuite` node in the MiroirTest walk.
 *
 * The walk treats the node as a nested suite (tracking, filters, skip) and passes its context
 * (`suitePath`, `component`, `componentProps`, `caseLabels`) to the component test runner, whose
 * params become `{ testNamePath, leaf, suite? }`. A legacy `componentTestRef` leaf under a plain
 * `miroirTestSuite` reaches the runner with no `suite`.
 *
 * Runs in-process with `TestFramework` (the Miroir Tests UI path), like
 * `reactComponentLeaf.286.phase2`. Each test restores the registered runner in `finally`.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-core -- 292-declarative-react-component-tests
 * ```
 */
import { describe, expect, it } from "vitest";

import type {
  MiroirTestSuite,
  TestAssertionResult,
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type {
  MiroirTestRunFilter,
  ReactComponentTestRunner,
} from "../../../../src/0_interfaces/5-tests/miroirTestTypes";
import { defaultMetaModelEnvironment } from "../../../../src/1_core/Model";
import { TestFramework } from "../../../../src/1_core/testing/test-expect";
import { ConfigurationService } from "../../../../src/3_controllers/ConfigurationService";
import { MiroirActivityTracker } from "../../../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../../../../src/3_controllers/MiroirEventService";
import {
  runMiroirTests,
  type MiroirTestExecutionOptions,
  type VitestNamespace,
} from "../../../../src/5_tests/MiroirTestTools";
import { REACT_COMPONENT_TEST_NO_RUNNER_MESSAGE } from "../../../../src/5_tests/ReactComponentTestTools";
import {
  classifyMiroirTestSuiteExecutionCapabilities,
  walkMiroirTestLeaves,
} from "../../../../src/5_tests/inferIntegrationSessionKind";

// ################################################################################################
const leafA = { miroirTestType: "reactComponentTest", miroirTestLabel: "A", steps: [] };
const leafB = {
  miroirTestType: "reactComponentTest",
  miroirTestLabel: "B",
  steps: [],
  componentProps: { b: 2 },
};

const componentSuiteFixture: MiroirTestSuite = {
  miroirTestType: "miroirTestSuite",
  miroirTestLabel: "Root",
  miroirTests: [
    {
      miroirTestType: "reactComponentTestSuite",
      miroirTestLabel: "S",
      component: "C",
      componentProps: { a: 1 },
      miroirTests: [leafA, leafB],
    },
  ],
} as any;

const legacyLeaf = {
  miroirTestType: "reactComponentTest",
  miroirTestLabel: "L",
  componentTestRef: { suite: "LegacySuite", case: "L" },
};

const legacySuiteFixture: MiroirTestSuite = {
  miroirTestType: "miroirTestSuite",
  miroirTestLabel: "Root",
  miroirTests: [
    {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "LegacySuite",
      miroirTests: [legacyLeaf],
    },
  ],
} as any;

// ################################################################################################
async function runSuiteInProcess(
  suite: MiroirTestSuite,
  filter: MiroirTestRunFilter | undefined = undefined,
  executionOptions: MiroirTestExecutionOptions = { executionMode: "unit" },
): Promise<MiroirActivityTracker> {
  const tracker = new MiroirActivityTracker();
  // Nested suites are tracked through `trackTestSuite`, which needs an event service.
  new MiroirEventService(tracker);
  await runMiroirTests._runMiroirTestSuite(
    TestFramework as unknown as VitestNamespace,
    [suite.miroirTestLabel],
    suite,
    filter,
    defaultMetaModelEnvironment,
    tracker,
    undefined,
    true,
    runMiroirTests,
    executionOptions,
  );
  return tracker;
}

/** Every assertion result found under `node`, keyed by assertion name. */
function assertionsUnder(node: unknown): Record<string, TestAssertionResult> {
  const found: Record<string, TestAssertionResult> = {};
  const visit = (current: unknown) => {
    if (!current || typeof current !== "object") {
      return;
    }
    const candidate = current as Partial<TestAssertionResult>;
    if (typeof candidate.assertionName === "string" && typeof candidate.assertionResult === "string") {
      found[candidate.assertionName] = candidate as TestAssertionResult;
      return;
    }
    Object.values(current).forEach(visit);
  };
  visit(node);
  return found;
}

function recordedAssertions(tracker: MiroirActivityTracker): Record<string, TestAssertionResult> {
  return assertionsUnder(tracker.getTestAssertionsResults([]));
}

type RunnerCall = Parameters<ReactComponentTestRunner>[0];

async function withRunner(
  runner: ReactComponentTestRunner | undefined,
  body: () => Promise<void>,
): Promise<void> {
  const previous = ConfigurationService.configurationService.reactComponentTestRunner;
  ConfigurationService.configurationService.registerReactComponentTestRunner(runner);
  try {
    await body();
  } finally {
    ConfigurationService.configurationService.registerReactComponentTestRunner(previous);
  }
}

function countingRunner(calls: RunnerCall[]): ReactComponentTestRunner {
  return async (params) => {
    calls.push(params);
    return { status: "ok" };
  };
}

// ################################################################################################
describe("reactComponentTestSuite in the MiroirTest walk", () => {
  it("the runner receives the leaf and the suite context for each leaf", async () => {
    const calls: RunnerCall[] = [];
    await withRunner(countingRunner(calls), async () => {
      await runSuiteInProcess(componentSuiteFixture);
    });
    expect(calls.map((call) => call.testNamePath)).toEqual([
      ["Root", "S", "A"],
      ["Root", "S", "B"],
    ]);
    const expectedSuite = {
      suitePath: ["Root", "S"],
      component: "C",
      componentProps: { a: 1 },
      caseLabels: ["A", "B"],
    };
    expect(calls[1]).toEqual({ testNamePath: ["Root", "S", "B"], leaf: leafB, suite: expectedSuite });
    expect(calls[0]).toEqual({ testNamePath: ["Root", "S", "A"], leaf: leafA, suite: expectedSuite });
  });

  it("the tracker records A and B under the suite path Root > S", async () => {
    await withRunner(countingRunner([]), async () => {
      const tracker = await runSuiteInProcess(componentSuiteFixture);
      const underS = assertionsUnder(
        tracker.getTestAssertionsResults([{ testSuite: "Root" }, { testSuite: "S" }]),
      );
      expect(underS["A"]?.assertionResult).toBe("ok");
      expect(underS["B"]?.assertionResult).toBe("ok");
    });
  });

  it("walkMiroirTestLeaves returns A and B, and the suite is unit-capable only", () => {
    expect(walkMiroirTestLeaves(componentSuiteFixture).map((leaf) => leaf.miroirTestLabel)).toEqual([
      "A",
      "B",
    ]);
    expect(classifyMiroirTestSuiteExecutionCapabilities(componentSuiteFixture).uiExecutionMode).toBe(
      "unit",
    );
  });

  it("a filter naming only A runs A and not B", async () => {
    const calls: RunnerCall[] = [];
    await withRunner(countingRunner(calls), async () => {
      const results = recordedAssertions(
        await runSuiteInProcess(componentSuiteFixture, { testList: { Root: { S: ["A"] } } }),
      );
      expect(calls.map((call) => call.leaf.miroirTestLabel)).toEqual(["A"]);
      expect(results["A"]?.assertionResult).toBe("ok");
      // A leaf left out by the filter is never run, so it has no "ok" / "error" result.
      expect(["skipped", undefined]).toContain(results["B"]?.assertionResult);
    });
  });

  it('excludeMiroirTestTypes: ["reactComponentTest"] records both leaves as skipped and does not call the runner', async () => {
    const calls: RunnerCall[] = [];
    await withRunner(countingRunner(calls), async () => {
      const results = recordedAssertions(
        await runSuiteInProcess(componentSuiteFixture, undefined, {
          executionMode: "unit",
          excludeMiroirTestTypes: ["reactComponentTest"],
        }),
      );
      expect(calls).toEqual([]);
      expect(results["A"]?.assertionResult).toBe("skipped");
      expect(results["B"]?.assertionResult).toBe("skipped");
    });
  });

  it("with no runner, both leaves are recorded as skipped with the no-runner message", async () => {
    await withRunner(undefined, async () => {
      const results = recordedAssertions(await runSuiteInProcess(componentSuiteFixture));
      expect(results["A"]?.assertionResult).toBe("skipped");
      expect(results["B"]?.assertionResult).toBe("skipped");
      expect(JSON.stringify(results["A"])).toContain(REACT_COMPONENT_TEST_NO_RUNNER_MESSAGE);
    });
  });

  it("a legacy componentTestRef leaf under a plain miroirTestSuite reaches the runner with no suite", async () => {
    const calls: RunnerCall[] = [];
    await withRunner(countingRunner(calls), async () => {
      await runSuiteInProcess(legacySuiteFixture);
    });
    expect(calls).toEqual([{ testNamePath: ["Root", "LegacySuite", "L"], leaf: legacyLeaf }]);
  });
});
