import { describe, expect, it } from 'vitest';

import type {
  MiroirTestDefinition,
  MiroirTestForTransformer,
  MiroirTestSuite,
} from 'miroir-core';
import { miroirTest_runner_library } from 'miroir-test-app_deployment-library';
import {
  miroirTest_EntityPrimaryKey,
  miroirTest_miroirCoreTransformers,
  miroirTest_runner_create_entity,
  miroirTest_runner_drop_entity,
} from 'miroir-test-app_deployment-miroir';

import {
  classifyMiroirTestListExecutionCapabilities,
  isUiIntegrationRunnerSuiteSupported,
  isUiIntegrationRunnerSuiteSupportedForInstance,
  resolveMiroirTestSuiteUiExecutionMode,
  uiExecutionModeBadgeColors,
} from '../../src/miroir-fwk/4-tests/miroirTestSuiteUiExecution.js';
import { UI_INTEGRATION_RUNNER_SUITE_REGISTRY } from '../../src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.js';
import { UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY } from '../../src/miroir-fwk/4-tests/uiIntegrationTestTransformerSuiteRegistry.js';

function asMiroirTest(instance: unknown): MiroirTestDefinition {
  return instance as MiroirTestDefinition;
}

function suiteDefinition(instance: { definition: unknown }): MiroirTestSuite {
  return instance.definition as MiroirTestSuite;
}

function identityTransformer(): MiroirTestForTransformer['transformer'] {
  return { transformerType: 'identity' } as unknown as MiroirTestForTransformer['transformer'];
}

function classifyList(instances: MiroirTestDefinition[]) {
  return classifyMiroirTestListExecutionCapabilities(
    instances,
    UI_INTEGRATION_RUNNER_SUITE_REGISTRY,
    UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY,
  );
}

function isSupportedKey(suiteKey: string) {
  return isUiIntegrationRunnerSuiteSupported(
    suiteKey,
    UI_INTEGRATION_RUNNER_SUITE_REGISTRY,
    UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY,
  );
}

function isSupportedInstance(instance: MiroirTestDefinition) {
  return isUiIntegrationRunnerSuiteSupportedForInstance(
    instance,
    UI_INTEGRATION_RUNNER_SUITE_REGISTRY,
    UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY,
  );
}

describe('miroirTestSuiteUiExecution (B5)', () => {
  it('classifies runner_library as integration-only UI mode', () => {
    expect(resolveMiroirTestSuiteUiExecutionMode(suiteDefinition(miroirTest_runner_library))).toBe(
      'integration',
    );
  });

  it('classifies transformer suite as mixed', () => {
    expect(
      resolveMiroirTestSuiteUiExecutionMode(suiteDefinition(miroirTest_miroirCoreTransformers)),
    ).toBe('mixed');
  });

  it('classifies EntityPrimaryKey as unit-only UI mode', () => {
    expect(
      resolveMiroirTestSuiteUiExecutionMode(suiteDefinition(miroirTest_EntityPrimaryKey)),
    ).toBe('unit');
  });

  it('marks runner_library instance as UI integration supported (not miroirTestLabel alone)', () => {
    expect(isSupportedKey('runner_library')).toBe(true);
    expect(isSupportedKey('runner.library')).toBe(false);
    expect(isSupportedInstance(asMiroirTest(miroirTest_runner_library))).toBe(true);
  });

  it('marks runner_create_entity instance as UI integration supported', () => {
    expect(isSupportedKey('runner_create_entity')).toBe(true);
    expect(isSupportedKey('runner.createEntity')).toBe(false);
    expect(isSupportedInstance(asMiroirTest(miroirTest_runner_create_entity))).toBe(true);
  });

  it('marks runner_drop_entity instance as UI integration supported', () => {
    expect(isSupportedKey('runner_drop_entity')).toBe(true);
    expect(isSupportedKey('runner.dropEntity')).toBe(false);
    expect(isSupportedInstance(asMiroirTest(miroirTest_runner_drop_entity))).toBe(true);
  });

  it('marks miroirCoreTransformers instance as UI integration supported (B7)', () => {
    expect(isSupportedKey('miroirCoreTransformers')).toBe(true);
    expect(isSupportedInstance(asMiroirTest(miroirTest_miroirCoreTransformers))).toBe(true);
  });

  it('returns badge colors for each execution mode', () => {
    expect(uiExecutionModeBadgeColors('unit').color).toBeTruthy();
    expect(uiExecutionModeBadgeColors('integration').color).toBeTruthy();
    expect(uiExecutionModeBadgeColors('mixed').color).toBeTruthy();
  });
});

describe('classifyMiroirTestListExecutionCapabilities (T1)', () => {
  it('aggregates mixed list: unit + integ suites and launchable integ keys', () => {
    const caps = classifyList([
      asMiroirTest(miroirTest_runner_library),
      asMiroirTest(miroirTest_EntityPrimaryKey),
      asMiroirTest(miroirTest_miroirCoreTransformers),
    ]);

    expect(caps.hasUnitLeaves).toBe(true);
    expect(caps.hasIntegrationLeaves).toBe(true);
    expect(caps.unitSuiteKeys).toEqual(['EntityPrimaryKey', 'miroirCoreTransformers']);
    expect(caps.integrationSuiteKeys).toEqual(['miroirCoreTransformers', 'runner_library']);
    expect(caps.launchableIntegrationSuiteKeys).toEqual([
      'miroirCoreTransformers',
      'runner_library',
    ]);
  });

  it('unit-only list has no integ or launchable keys', () => {
    const caps = classifyList([asMiroirTest(miroirTest_EntityPrimaryKey)]);

    expect(caps).toEqual({
      hasUnitLeaves: true,
      hasIntegrationLeaves: false,
      unitSuiteKeys: ['EntityPrimaryKey'],
      integrationSuiteKeys: [],
      launchableIntegrationSuiteKeys: [],
    });
  });

  it('integ-only launchable list (runner) has no unit keys', () => {
    const caps = classifyList([asMiroirTest(miroirTest_runner_library)]);

    expect(caps).toEqual({
      hasUnitLeaves: false,
      hasIntegrationLeaves: true,
      unitSuiteKeys: [],
      integrationSuiteKeys: ['runner_library'],
      launchableIntegrationSuiteKeys: ['runner_library'],
    });
  });

  it('keeps non-launchable integ suites out of launchableIntegrationSuiteKeys', () => {
    const unregisteredInteg: MiroirTestDefinition = {
      uuid: '00000000-0000-4000-8000-000000000099',
      parentUuid: 'a311f363-e238-4203-bdfc-29e8c160c26b',
      selfApplication: '360fcf1f-f0d4-4f8a-9262-07886e70fa15',
      branch: 'ad1ddc4e-556e-4598-9cff-706a2bde0be7',
      name: 'unregistered_integ_suite',
      definition: {
        miroirTestType: 'miroirTestSuite',
        miroirTestLabel: 'unregistered.integ',
        miroirTests: [
          {
            miroirTestType: 'transformerTest',
            miroirTestLabel: 'fake integ leaf',
            transformerName: 't',
            transformer: identityTransformer(),
            integrationTestExpectedValue: {},
          },
        ],
      },
    };

    const caps = classifyList([unregisteredInteg, asMiroirTest(miroirTest_EntityPrimaryKey)]);

    expect(caps.hasUnitLeaves).toBe(true);
    expect(caps.hasIntegrationLeaves).toBe(true);
    expect(caps.unitSuiteKeys).toEqual(['EntityPrimaryKey']);
    expect(caps.integrationSuiteKeys).toEqual(['unregistered_integ_suite']);
    expect(caps.launchableIntegrationSuiteKeys).toEqual([]);
    expect(isSupportedInstance(unregisteredInteg)).toBe(false);
  });

  it('returns empty aggregates for an empty list', () => {
    expect(classifyList([])).toEqual({
      hasUnitLeaves: false,
      hasIntegrationLeaves: false,
      unitSuiteKeys: [],
      integrationSuiteKeys: [],
      launchableIntegrationSuiteKeys: [],
    });
  });
});
