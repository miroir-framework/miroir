import type { MiroirTestDefinition, MiroirTestSuite, Runner } from "miroir-core";
import {
  miroirTest_runner_library,
  RUNNER_LIBRARY_RUNNER_REGISTRY,
} from "miroir-test-app_deployment-library";

export type UiIntegrationRunnerSuiteEntry = {
  suiteDefinition: MiroirTestSuite;
  runnerRegistry: Record<string, Runner>;
};

export const UI_INTEGRATION_RUNNER_SUITE_REGISTRY: Record<string, UiIntegrationRunnerSuiteEntry> =
  {
    runner_library: {
      suiteDefinition: (miroirTest_runner_library as MiroirTestDefinition)
        .definition as MiroirTestSuite,
      runnerRegistry: RUNNER_LIBRARY_RUNNER_REGISTRY,
    },
  };

export function listUiIntegrationRunnerSuiteKeys(): string[] {
  return Object.keys(UI_INTEGRATION_RUNNER_SUITE_REGISTRY).sort();
}

export function resolveUiIntegrationRunnerSuite(suiteKey: string): UiIntegrationRunnerSuiteEntry {
  const entry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY[suiteKey];
  if (!entry) {
    throw new Error(
      `Unknown UI integration runner suite: ${suiteKey}. ` +
        `Valid keys: ${listUiIntegrationRunnerSuiteKeys().join(", ")}`,
    );
  }
  return entry;
}
