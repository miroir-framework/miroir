import type { MiroirTestDefinition, MiroirTestSuite } from "miroir-core";

import {
  listUiIntegrationRunnerSuiteKeys,
  UI_INTEGRATION_RUNNER_SUITE_REGISTRY,
} from "./uiIntegrationTestRunnerSuiteRegistry.js";
import {
  listUiIntegrationTransformerSuiteKeys,
  UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY,
} from "./uiIntegrationTestTransformerSuiteRegistry.js";

function listAllUiIntegrationSuiteKeys(): string[] {
  return [...listUiIntegrationRunnerSuiteKeys(), ...listUiIntegrationTransformerSuiteKeys()].sort();
}

/**
 * Registry key for UI launcher (e.g. `runner_library`, `miroirCoreTransformers`),
 * not `miroirTestLabel` (`runner.library`).
 */
export function resolveUiIntegrationRunnerSuiteKey(
  miroirTest: MiroirTestDefinition,
): string | undefined {
  const instanceName = miroirTest.name?.trim();
  if (instanceName && instanceName in UI_INTEGRATION_RUNNER_SUITE_REGISTRY) {
    return instanceName;
  }
  if (instanceName && instanceName in UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY) {
    return instanceName;
  }

  const suite = miroirTest.definition as MiroirTestSuite | undefined;
  const label = suite?.miroirTestLabel?.trim();
  if (label) {
    for (const [registryKey, entry] of Object.entries(UI_INTEGRATION_RUNNER_SUITE_REGISTRY)) {
      if (entry.suiteDefinition.miroirTestLabel === label) {
        return registryKey;
      }
    }
    for (const [registryKey, entry] of Object.entries(UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY)) {
      if (entry.suiteDefinition.miroirTestLabel === label) {
        return registryKey;
      }
    }
  }

  return undefined;
}

export function isUiIntegrationRunnerSuiteSupportedForInstance(
  miroirTest: MiroirTestDefinition,
): boolean {
  const key = resolveUiIntegrationRunnerSuiteKey(miroirTest);
  return key !== undefined && listAllUiIntegrationSuiteKeys().includes(key);
}

/** @deprecated Prefer resolveUiIntegrationRunnerSuiteKey / isUiIntegrationRunnerSuiteSupportedForInstance */
export function isUiIntegrationRunnerSuiteSupported(suiteKey: string): boolean {
  return listAllUiIntegrationSuiteKeys().includes(suiteKey);
}
