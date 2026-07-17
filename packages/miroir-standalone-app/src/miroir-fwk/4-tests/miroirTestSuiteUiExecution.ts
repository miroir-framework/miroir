import {
  classifyMiroirTestSuiteExecutionCapabilities,
  type MiroirTestDefinition,
  type MiroirTestSuite,
  type MiroirTestSuiteUiExecutionMode,
} from 'miroir-core';

import {
  isUiIntegrationRunnerSuiteSupportedForInstance,
  resolveUiIntegrationRunnerSuiteKey,
} from './resolveUiIntegrationRunnerSuiteKey.js';
import { listUiIntegrationRunnerSuiteKeys } from './uiIntegrationTestRunnerSuiteRegistry.js';
import { listUiIntegrationTransformerSuiteKeys } from './uiIntegrationTestTransformerSuiteRegistry.js';

export type MiroirTestListExecutionCapabilities = {
  hasUnitLeaves: boolean;
  hasIntegrationLeaves: boolean;
  /** Suite identity keys (name / label / uuid) with at least one unit-capable leaf. */
  unitSuiteKeys: string[];
  /** Suite identity keys with at least one integration-capable leaf. */
  integrationSuiteKeys: string[];
  /**
   * Registry keys for UI-launchable integ suites in the list
   * (`resolveUiIntegrationRunnerSuiteKey` ∩ integ leaves).
   */
  launchableIntegrationSuiteKeys: string[];
};

function listSuiteIdentityKey(instance: MiroirTestDefinition): string {
  return instance.name || instance.definition.miroirTestLabel || instance.uuid;
}

/**
 * Aggregate unit/integ capabilities across a MiroirTest list report fetch.
 * Launchable integ keys use the UI suite registry (runner + transformer).
 */
export function classifyMiroirTestListExecutionCapabilities(
  instances: MiroirTestDefinition[],
): MiroirTestListExecutionCapabilities {
  const unitSuiteKeys = new Set<string>();
  const integrationSuiteKeys = new Set<string>();
  const launchableIntegrationSuiteKeys = new Set<string>();

  for (const instance of instances) {
    const caps = classifyMiroirTestSuiteExecutionCapabilities(instance.definition);
    const identityKey = listSuiteIdentityKey(instance);

    if (caps.hasUnitLeaves) {
      unitSuiteKeys.add(identityKey);
    }
    if (caps.hasIntegrationLeaves) {
      integrationSuiteKeys.add(identityKey);
      if (isUiIntegrationRunnerSuiteSupportedForInstance(instance)) {
        const registryKey = resolveUiIntegrationRunnerSuiteKey(instance);
        if (registryKey) {
          launchableIntegrationSuiteKeys.add(registryKey);
        }
      }
    }
  }

  return {
    hasUnitLeaves: unitSuiteKeys.size > 0,
    hasIntegrationLeaves: integrationSuiteKeys.size > 0,
    unitSuiteKeys: [...unitSuiteKeys].sort(),
    integrationSuiteKeys: [...integrationSuiteKeys].sort(),
    launchableIntegrationSuiteKeys: [...launchableIntegrationSuiteKeys].sort(),
  };
}

export function resolveMiroirTestSuiteUiExecutionMode(
  suite: MiroirTestSuite,
): MiroirTestSuiteUiExecutionMode {
  return classifyMiroirTestSuiteExecutionCapabilities(suite).uiExecutionMode;
}

export function listUiIntegrationSuiteKeys(): string[] {
  return [...listUiIntegrationRunnerSuiteKeys(), ...listUiIntegrationTransformerSuiteKeys()].sort();
}

export function isUiIntegrationRunnerSuiteSupported(suiteKey: string): boolean {
  return listUiIntegrationSuiteKeys().includes(suiteKey);
}

export {
  isUiIntegrationRunnerSuiteSupportedForInstance,
  resolveUiIntegrationRunnerSuiteKey,
} from './resolveUiIntegrationRunnerSuiteKey.js';

export function uiExecutionModeBadgeColors(mode: MiroirTestSuiteUiExecutionMode): {
  backgroundColor: string;
  color: string;
} {
  switch (mode) {
    case 'unit':
      return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
    case 'integration':
      return { backgroundColor: '#fff3e0', color: '#ef6c00' };
    case 'mixed':
      return { backgroundColor: '#ede7f6', color: '#4527a0' };
    default: {
      const exhaustive: never = mode;
      return exhaustive;
    }
  }
}
