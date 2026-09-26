import {
  classifyMiroirTestSuiteExecutionCapabilities,
  isUiIntegrationLaunchableSuite,
  reactComponentTestSuiteStepKinds,
  type ReactComponentTestStep,
  type MiroirTestDefinition,
  type MiroirTestSuite,
  type ReactComponentTestSuite,
  type MiroirTestSuiteUiExecutionMode,
} from 'miroir-core';

import {
  isUiIntegrationRunnerSuiteSupportedForInstance,
  resolveUiIntegrationRunnerSuiteKey,
} from './resolveUiIntegrationRunnerSuiteKey.js';
import type { UiIntegrationRunnerSuiteEntry } from './uiIntegrationTestRunnerSuiteRegistry.js';
import type { UiIntegrationTransformerSuiteEntry } from './uiIntegrationTestTransformerSuiteRegistry.js';

export type MiroirTestListExecutionCapabilities = {
  hasUnitLeaves: boolean;
  hasIntegrationLeaves: boolean;
  /** Suite identity keys (instance `name`, else label / uuid) with at least one unit-capable leaf. */
  unitSuiteKeys: string[];
  /** Suite identity keys with at least one integration-capable leaf. */
  integrationSuiteKeys: string[];
  /**
   * Suite keys (`name`) for UI-launchable integ suites in the list
   * (`resolveUiIntegrationRunnerSuiteKey` ∩ integ leaves).
   */
  launchableIntegrationSuiteKeys: string[];
};

function listSuiteIdentityKey(instance: MiroirTestDefinition): string {
  const name = instance.name?.trim();
  if (name) {
    return name;
  }
  return instance.definition.miroirTestLabel || instance.uuid;
}

/**
 * Aggregate unit/integ capabilities across a MiroirTest list report fetch.
 * Launchable integ keys use the supplied UI suite registries (runner + transformer).
 */
export function classifyMiroirTestListExecutionCapabilities(
  instances: MiroirTestDefinition[],
  runnerSuiteRegistry: Record<string, UiIntegrationRunnerSuiteEntry>,
  transformerSuiteRegistry: Record<string, UiIntegrationTransformerSuiteEntry>,
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
      if (isUiIntegrationLaunchableSuite(instance.definition)) {
        const registryKey = resolveUiIntegrationRunnerSuiteKey(
          instance,
          runnerSuiteRegistry,
          transformerSuiteRegistry,
        );
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

export function listUiIntegrationSuiteKeys(
  runnerSuiteRegistry: Record<string, UiIntegrationRunnerSuiteEntry>,
  transformerSuiteRegistry: Record<string, UiIntegrationTransformerSuiteEntry>,
): string[] {
  return [
    ...Object.keys(runnerSuiteRegistry),
    ...Object.keys(transformerSuiteRegistry),
  ].sort();
}

export function isUiIntegrationRunnerSuiteSupported(
  suiteKey: string,
  runnerSuiteRegistry: Record<string, UiIntegrationRunnerSuiteEntry>,
  transformerSuiteRegistry: Record<string, UiIntegrationTransformerSuiteEntry>,
): boolean {
  return listUiIntegrationSuiteKeys(runnerSuiteRegistry, transformerSuiteRegistry).includes(
    suiteKey,
  );
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

/**
 * True when the MiroirTest node holds a `reactComponentTest` leaf at any depth (#286): its unit
 * run needs the component test sandbox (`beforeRun` of `RunMiroirTestSuiteButton`).
 */
type MiroirTestNode =
  | MiroirTestSuite
  | MiroirTestSuite['miroirTests'][number]
  | ReactComponentTestSuite['miroirTests'][number];

export function miroirTestDefinitionHasReactComponentTest(
  node: MiroirTestNode | undefined,
  options?: {
    /** #303: ignore `reactComponentTestSuite` nodes with `runOnDemand: true` (Run all skips them). */
    ignoreRunOnDemandSuites?: boolean;
  },
): boolean {
  if (!node) {
    return false;
  }
  if (node.miroirTestType === 'reactComponentTest') {
    return true;
  }
  if (node.miroirTestType === 'reactComponentTestSuite' && options?.ignoreRunOnDemandSuites && node.runOnDemand) {
    return false;
  }
  // A `reactComponentTestSuite` (#292) holds `reactComponentTest` leaves only.
  if (node.miroirTestType === 'miroirTestSuite' || node.miroirTestType === 'reactComponentTestSuite') {
    return node.miroirTests.some((child: MiroirTestNode) =>
      miroirTestDefinitionHasReactComponentTest(child, options),
    );
  }
  return false;
}

/**
 * True when a `reactComponentTestSuite` under `node`, at any depth, has a leaf using the step kind
 * `stepKind` (#303): Miroir Tests shows the iterations field for a suite containing a
 * `measureRendering` step. Same helper as the runner's tracking decision
 * (`reactComponentTestSuiteStepKinds`, miroir-core).
 */
export function miroirTestDefinitionHasStepKind(
  node: MiroirTestNode | undefined,
  stepKind: ReactComponentTestStep['step'],
): boolean {
  if (!node) {
    return false;
  }
  if (node.miroirTestType === 'reactComponentTestSuite') {
    return reactComponentTestSuiteStepKinds(node).includes(stepKind);
  }
  if (node.miroirTestType === 'miroirTestSuite') {
    return node.miroirTests.some((child: MiroirTestNode) => miroirTestDefinitionHasStepKind(child, stepKind));
  }
  return false;
}
