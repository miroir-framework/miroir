import type {
  MiroirTestForTransformer,
  MiroirTestLeaf,
  MiroirTestSuite,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { IntegrationTestSessionKind } from "./IntegrationTestBootstrap.js";

export type MiroirTestSuiteUiExecutionMode = "unit" | "integration" | "mixed";

export type MiroirTestSuiteExecutionCapabilities = {
  hasUnitLeaves: boolean;
  hasIntegrationLeaves: boolean;
  integrationSessionKind: IntegrationTestSessionKind | undefined;
  uiExecutionMode: MiroirTestSuiteUiExecutionMode;
};

export function walkMiroirTestLeaves(suite: MiroirTestSuite): MiroirTestLeaf[] {
  const leaves: MiroirTestLeaf[] = [];

  function visit(node: MiroirTestLeaf | MiroirTestSuite): void {
    if (node.miroirTestType === "miroirTestSuite") {
      for (const child of node.miroirTests) {
        visit(child);
      }
      return;
    }
    leaves.push(node);
  }

  for (const child of suite.miroirTests) {
    visit(child);
  }

  return leaves;
}

export function transformerTestLeafRequiresIntegration(leaf: MiroirTestForTransformer): boolean {
  return leaf.integrationTestExpectedValue !== undefined;
}

function miroirTestLeafSupportsUnitExecution(leaf: MiroirTestLeaf): boolean {
  switch (leaf.miroirTestType) {
    case "runnerTest":
      return false;
    case "transformerTest":
      return leaf.unitTestExpectedValue !== undefined;
    case "functionCallTest":
    case "queryTest":
      return true;
    default: {
      const _exhaustive: never = leaf;
      return _exhaustive;
    }
  }
}

function miroirTestLeafRequiresIntegrationExecution(leaf: MiroirTestLeaf): boolean {
  switch (leaf.miroirTestType) {
    case "runnerTest":
      return true;
    case "transformerTest":
      return transformerTestLeafRequiresIntegration(leaf);
    case "functionCallTest":
    case "queryTest":
      return false;
    default: {
      const _exhaustive: never = leaf;
      return _exhaustive;
    }
  }
}

export function inferIntegrationSessionKind(
  suite: MiroirTestSuite,
): IntegrationTestSessionKind | undefined {
  const leaves = walkMiroirTestLeaves(suite);

  if (leaves.some((leaf) => leaf.miroirTestType === "runnerTest")) {
    return "runner";
  }

  if (
    leaves.some(
      (leaf) =>
        leaf.miroirTestType === "transformerTest" &&
        transformerTestLeafRequiresIntegration(leaf),
    )
  ) {
    return "transformer";
  }

  return undefined;
}

export function classifyMiroirTestSuiteExecutionCapabilities(
  suite: MiroirTestSuite,
): MiroirTestSuiteExecutionCapabilities {
  const leaves = walkMiroirTestLeaves(suite);
  const hasUnitLeaves = leaves.some(miroirTestLeafSupportsUnitExecution);
  const hasIntegrationLeaves = leaves.some(miroirTestLeafRequiresIntegrationExecution);
  const integrationSessionKind = inferIntegrationSessionKind(suite);

  let uiExecutionMode: MiroirTestSuiteUiExecutionMode;
  if (hasUnitLeaves && hasIntegrationLeaves) {
    uiExecutionMode = "mixed";
  } else if (hasIntegrationLeaves) {
    uiExecutionMode = "integration";
  } else {
    uiExecutionMode = "unit";
  }

  return {
    hasUnitLeaves,
    hasIntegrationLeaves,
    integrationSessionKind,
    uiExecutionMode,
  };
}
