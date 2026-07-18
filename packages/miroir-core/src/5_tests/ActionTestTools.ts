// ONLY A DEV DEPENDENCY! USED FOR THE TYPE ONLY, PRUNED BY THE TRANSPILER
import * as vitest from "vitest";
type VitestNamespace = typeof vitest;

import type { MiroirTestForAction } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirTestRunFilter } from "../0_interfaces/5-tests/miroirTestTypes";
import type {
  MiroirActivityTrackerInterface,
  TestAssertionPath,
} from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";
import type { MiroirTestExecutionEnvironment } from "./MiroirTestTools";

/**
 * Phase 0/1 stub: validates integ-only dispatch contract.
 * Leaf → TestCompositeActionParams resolve lands in Phase 2.
 *
 * Context: prefer `compositeActionTestContext`; `runnerTestContext` is accepted
 * (1.3-a — Action suites reuse the runner session kind without needing a registry).
 */
export async function runMiroirActionTest(
  localVitest: VitestNamespace,
  _testNamePath: string[],
  _filter: MiroirTestRunFilter | undefined,
  leaf: MiroirTestForAction,
  miroirActivityTracker: MiroirActivityTrackerInterface,
  testAssertionPath?: TestAssertionPath,
  parentSkip?: boolean,
  executionEnvironment?: MiroirTestExecutionEnvironment,
): Promise<void> {
  if (!localVitest.expect) {
    throw new Error("runMiroirActionTest called without vitest.expect");
  }
  if (parentSkip || leaf.skip) {
    return;
  }
  if (!testAssertionPath) {
    throw new Error("runMiroirActionTest called without testAssertionPath");
  }

  const compositeContext =
    executionEnvironment?.compositeActionTestContext ??
    executionEnvironment?.runnerTestContext;

  if (!executionEnvironment?.domainController && !compositeContext?.domainController) {
    throw new Error(
      "runMiroirActionTest: executionEnvironment.domainController is required",
    );
  }

  void miroirActivityTracker;
  throw new Error(
    `runMiroirActionTest: resolveActionTestLeaf not implemented for "${leaf.miroirTestLabel}" (Phase 2)`,
  );
}
