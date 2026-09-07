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
 * Suite key for UI launcher: instance `name` when set
 * (e.g. `runner_return_document`, `miroirCoreTransformers`), not `miroirTestLabel`.
 */
export function resolveUiIntegrationRunnerSuiteKey(
  miroirTest: MiroirTestDefinition,
  _runnerSuiteRegistry: Record<string, UiIntegrationRunnerSuiteEntry> = {},
  _transformerSuiteRegistry: Record<string, UiIntegrationTransformerSuiteEntry> = {},
): string | undefined {
  const suite = miroirTest.definition as MiroirTestSuite | undefined;
  if (!suite || !isUiIntegrationLaunchableSuite(suite)) {
    return undefined;
  }
  return suiteKeyFromMiroirTestInstance(miroirTest);
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
