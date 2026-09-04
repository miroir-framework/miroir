import {
  isUiIntegrationLaunchableSuite,
  suiteKeyFromMiroirTestInstance,
  type MiroirTestDefinition,
  type MiroirTestSuite,
} from "miroir-core";

import type { UiIntegrationRunnerSuiteEntry } from "./uiIntegrationTestRunnerSuiteRegistry.js";
import type { UiIntegrationTransformerSuiteEntry } from "./uiIntegrationTestTransformerSuiteRegistry.js";

function listAllUiIntegrationSuiteKeys(
  runnerSuiteRegistry: Record<string, UiIntegrationRunnerSuiteEntry>,
  transformerSuiteRegistry: Record<string, UiIntegrationTransformerSuiteEntry>,
): string[] {
  return [
    ...Object.keys(runnerSuiteRegistry),
    ...Object.keys(transformerSuiteRegistry),
  ].sort();
}

/**
 * Registry key for UI launcher (e.g. `runner_return_document`, `miroirCoreTransformers`),
 * not `miroirTestLabel` (`runner.returnDocument`).
 */
export function resolveUiIntegrationRunnerSuiteKey(
  miroirTest: MiroirTestDefinition,
  runnerSuiteRegistry: Record<string, UiIntegrationRunnerSuiteEntry> = {},
  transformerSuiteRegistry: Record<string, UiIntegrationTransformerSuiteEntry> = {},
): string | undefined {
  const instanceName = miroirTest.name?.trim();
  if (instanceName && instanceName in runnerSuiteRegistry) {
    return instanceName;
  }
  if (instanceName && instanceName in transformerSuiteRegistry) {
    return instanceName;
  }

  const suite = miroirTest.definition as MiroirTestSuite | undefined;
  const label = suite?.miroirTestLabel?.trim();
  if (label) {
    for (const [registryKey, entry] of Object.entries(runnerSuiteRegistry)) {
      if (entry.suiteDefinition.miroirTestLabel === label) {
        return registryKey;
      }
    }
    for (const [registryKey, entry] of Object.entries(transformerSuiteRegistry)) {
      if (entry.suiteDefinition.miroirTestLabel === label) {
        return registryKey;
      }
    }
  }

  if (suite && isUiIntegrationLaunchableSuite(suite)) {
    return suiteKeyFromMiroirTestInstance(miroirTest);
  }

  return undefined;
}

export function isUiIntegrationRunnerSuiteSupportedForInstance(
  miroirTest: MiroirTestDefinition,
  runnerSuiteRegistry: Record<string, UiIntegrationRunnerSuiteEntry>,
  transformerSuiteRegistry: Record<string, UiIntegrationTransformerSuiteEntry>,
): boolean {
  const key = resolveUiIntegrationRunnerSuiteKey(
    miroirTest,
    runnerSuiteRegistry,
    transformerSuiteRegistry,
  );
  const suite = miroirTest.definition as MiroirTestSuite | undefined;
  if (suite && isUiIntegrationLaunchableSuite(suite)) {
    return true;
  }
  return (
    key !== undefined &&
    listAllUiIntegrationSuiteKeys(runnerSuiteRegistry, transformerSuiteRegistry).includes(key)
  );
}

/** @deprecated Prefer resolveUiIntegrationRunnerSuiteKey / isUiIntegrationRunnerSuiteSupportedForInstance */
export function isUiIntegrationRunnerSuiteSupported(
  suiteKey: string,
  runnerSuiteRegistry: Record<string, UiIntegrationRunnerSuiteEntry>,
  transformerSuiteRegistry: Record<string, UiIntegrationTransformerSuiteEntry>,
): boolean {
  return listAllUiIntegrationSuiteKeys(runnerSuiteRegistry, transformerSuiteRegistry).includes(
    suiteKey,
  );
}
