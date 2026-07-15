import {
  classifyMiroirTestSuiteExecutionCapabilities,
  type MiroirTestSuite,
  type MiroirTestSuiteUiExecutionMode,
} from "miroir-core";

import {
  isUiIntegrationRunnerSuiteSupportedForInstance,
  resolveUiIntegrationRunnerSuiteKey,
} from "./resolveUiIntegrationRunnerSuiteKey.js";
import { listUiIntegrationRunnerSuiteKeys } from "./uiIntegrationTestRunnerSuiteRegistry.js";

export function resolveMiroirTestSuiteUiExecutionMode(
  suite: MiroirTestSuite,
): MiroirTestSuiteUiExecutionMode {
  return classifyMiroirTestSuiteExecutionCapabilities(suite).uiExecutionMode;
}

export function isUiIntegrationRunnerSuiteSupported(suiteKey: string): boolean {
  return listUiIntegrationRunnerSuiteKeys().includes(suiteKey);
}

export {
  isUiIntegrationRunnerSuiteSupportedForInstance,
  resolveUiIntegrationRunnerSuiteKey,
} from "./resolveUiIntegrationRunnerSuiteKey.js";

export function uiExecutionModeBadgeColors(mode: MiroirTestSuiteUiExecutionMode): {
  backgroundColor: string;
  color: string;
} {
  switch (mode) {
    case "unit":
      return { backgroundColor: "#e8f5e9", color: "#2e7d32" };
    case "integration":
      return { backgroundColor: "#fff3e0", color: "#ef6c00" };
    case "mixed":
      return { backgroundColor: "#ede7f6", color: "#4527a0" };
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}
