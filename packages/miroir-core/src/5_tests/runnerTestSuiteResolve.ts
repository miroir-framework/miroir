import type {
  MiroirTestForRunner,
  MiroirTestSuite,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export function collectRunnerTestLeaves(suite: MiroirTestSuite): MiroirTestForRunner[] {
  const leaves: MiroirTestForRunner[] = [];
  if (!suite.miroirTests) {
    return leaves;
  }
  for (const test of suite.miroirTests) {
    if (test.miroirTestType === "runnerTest") {
      leaves.push(test);
    } else if (test.miroirTestType === "miroirTestSuite") {
      leaves.push(...collectRunnerTestLeaves(test));
    }
  }
  return leaves;
}

function resolveConsistentRunnerLeafField<T>(
  suite: MiroirTestSuite,
  label: string,
  normalize: (leaf: MiroirTestForRunner) => T,
): T | undefined {
  const leaves = collectRunnerTestLeaves(suite);
  if (leaves.length === 0) {
    return undefined;
  }
  const values = leaves.map(normalize);
  const first = values[0];
  for (const value of values.slice(1)) {
    if (value !== first) {
      throw new Error(
        `MiroirTestSuite "${suite.miroirTestLabel}" has inconsistent ${label} values across runnerTest leaves`,
      );
    }
  }
  return first;
}

export function resolveRunnerRefFromMiroirTestSuite(suite: MiroirTestSuite): string {
  const runnerRef = resolveConsistentRunnerLeafField(
    suite,
    "runnerRef",
    (leaf) => leaf.runnerRef,
  );
  if (runnerRef === undefined) {
    throw new Error(
      `MiroirTestSuite "${suite.miroirTestLabel}" has no runnerTest leaves — cannot resolve runnerRef`,
    );
  }
  return runnerRef;
}

export function resolveDefaultApplicationNameFromMiroirTestSuite(
  suite: MiroirTestSuite,
): string | undefined {
  return resolveConsistentRunnerLeafField(
    suite,
    "defaultApplicationName",
    (leaf) => leaf.defaultApplicationName,
  );
}

export function resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite(
  suite: MiroirTestSuite,
): boolean {
  return (
    resolveConsistentRunnerLeafField(
      suite,
      "skipRunTargetPlayfieldReset",
      (leaf) => leaf.skipRunTargetPlayfieldReset ?? false,
    ) ?? false
  );
}
