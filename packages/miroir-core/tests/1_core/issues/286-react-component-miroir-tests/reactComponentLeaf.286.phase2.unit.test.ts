/**
 * Issue #286 Slice 2: the `reactComponentTest` leaf in the MiroirTest walk.
 *
 * Runs in-process with `TestFramework` (the Miroir Tests UI path). Each test restores the
 * registered component test runner in `finally`.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-core -- reactComponentLeaf.286.phase2
 * ```
 */
import { describe, expect, it } from "vitest";

import type {
  MiroirTestLeaf,
  MiroirTestSuite,
  TestAssertionResult,
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultMetaModelEnvironment } from "../../../../src/1_core/Model";
import { TestFramework } from "../../../../src/1_core/testing/test-expect";
import { ConfigurationService } from "../../../../src/3_controllers/ConfigurationService";
import { MiroirActivityTracker } from "../../../../src/3_controllers/MiroirActivityTracker";
import { MiroirEventService } from "../../../../src/3_controllers/MiroirEventService";
import {
  runMiroirTest,
  runMiroirTests,
  type MiroirTestExecutionOptions,
  type VitestNamespace,
} from "../../../../src/5_tests/MiroirTestTools";

const suiteLabel = "reactComponentLeaf.286.phase2";

/** A `reactComponentTest` leaf with an empty step list (#292 M1). */
function reactComponentLeaf(label: string): MiroirTestLeaf {
  return {
    miroirTestType: "reactComponentTest",
    miroirTestLabel: label,
    steps: [],
  } as unknown as MiroirTestLeaf;
}

/** The leaves under a `reactComponentTestSuite` child of a `miroirTestSuite` root (#292). */
function suiteOf(...leaves: MiroirTestLeaf[]): MiroirTestSuite {
  return {
    miroirTestType: "miroirTestSuite",
    miroirTestLabel: suiteLabel,
    miroirTests: [
      {
        miroirTestType: "reactComponentTestSuite",
        miroirTestLabel: "JzodArrayEditor",
        component: "JzodElementEditor",
        miroirTests: leaves,
      },
    ],
  } as unknown as MiroirTestSuite;
}

async function runSuiteInProcess(
  suite: MiroirTestSuite,
  executionOptions: MiroirTestExecutionOptions = { executionMode: "unit" },
): Promise<MiroirActivityTracker> {
  const tracker = new MiroirActivityTracker();
  // Nested suites are tracked through `trackTestSuite`, which needs an event service.
  new MiroirEventService(tracker);
  await runMiroirTests._runMiroirTestSuite(
    TestFramework as unknown as VitestNamespace,
    [suiteLabel],
    suite,
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

async function withRegisteredRunner(
  runner: Parameters<typeof ConfigurationService.configurationService.registerReactComponentTestRunner>[0],
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

// ################################################################################################
describe("reactComponentTest leaf", () => {
  it("with no runner registered, a one-leaf suite records skipped with a message and does not throw", async () => {
    await withRegisteredRunner(undefined, async () => {
      const tracker = await runSuiteInProcess(
        suiteOf(reactComponentLeaf("JzodArrayEditor: case A")),
      );
      const results = recordedAssertions(tracker);
      expect(results["JzodArrayEditor: case A"]?.assertionResult).toBe("skipped");
      expect(JSON.stringify(results["JzodArrayEditor: case A"])).toContain(
        "reactComponentTest requires a registered component test runner",
      );
    });
  });

  it("with a runner returning error, the walk records error with the runner's message and runs the next leaf", async () => {
    const calls: string[] = [];
    await withRegisteredRunner(
      // #292: the runner receives the leaf and its suite context.
      async ({ leaf }) => {
        const caseLabel = leaf.miroirTestLabel.replace("JzodArrayEditor: ", "");
        calls.push(caseLabel);
        return caseLabel === "case A"
          ? { status: "error", message: "case A failed on purpose" }
          : { status: "ok" };
      },
      async () => {
        const tracker = await runSuiteInProcess(
          suiteOf(
            reactComponentLeaf("JzodArrayEditor: case A"),
            reactComponentLeaf("JzodArrayEditor: case B"),
          ),
        );
        const results = recordedAssertions(tracker);
        expect(calls).toEqual(["case A", "case B"]);
        expect(results["JzodArrayEditor: case A"]?.assertionResult).toBe("error");
        expect(JSON.stringify(results["JzodArrayEditor: case A"])).toContain(
          "case A failed on purpose",
        );
        expect(results["JzodArrayEditor: case B"]?.assertionResult).toBe("ok");
      },
    );
  });

  it("with rethrowComponentTestFailures and a runner returning error, the leaf throws with the runner's message", async () => {
    await withRegisteredRunner(
      async () => ({ status: "error", message: "case A failed on purpose" }),
      async () => {
        await expect(
          runSuiteInProcess(suiteOf(reactComponentLeaf("JzodArrayEditor: case A")), {
            executionMode: "unit",
            rethrowComponentTestFailures: true,
          }),
        ).rejects.toThrow("case A failed on purpose");
      },
    );
  });

  it("in integration mode the leaf is refused like a functionCallTest leaf", async () => {
    await withRegisteredRunner(
      async () => ({ status: "ok" }),
      async () => {
        const leaf = reactComponentLeaf("JzodArrayEditor: case A");
        await expect(
          runMiroirTest(
            TestFramework as unknown as VitestNamespace,
            [suiteLabel, leaf.miroirTestLabel],
            undefined,
            leaf,
            defaultMetaModelEnvironment,
            new MiroirActivityTracker(),
            undefined,
            false,
            runMiroirTests,
            { executionMode: "integration", executionEnvironment: {} as any },
            [{ testSuite: suiteLabel }, { test: leaf.miroirTestLabel }, { testAssertion: leaf.miroirTestLabel }],
          ),
        ).rejects.toThrow(
          "runMiroirTestInMemory: reactComponentTest leaves cannot run in integration mode",
        );
      },
    );
  });
});
