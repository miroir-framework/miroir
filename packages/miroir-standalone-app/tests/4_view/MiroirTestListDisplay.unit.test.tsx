import '@testing-library/jest-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type {
  MiroirTestDefinition,
  MiroirTestForTransformer,
} from 'miroir-core';
import { miroirTest_runner_library } from 'miroir-test-app_deployment-library';
import {
  miroirTest_EntityPrimaryKey,
  miroirTest_miroirCoreTransformers,
} from 'miroir-test-app_deployment-miroir';

import { resetUiIntegrationTestRunPreferencesForTests } from '../../src/miroir-fwk/4-tests/uiIntegrationTestRunPreferences.js';

vi.mock('../../src/miroir-fwk/4_view/components/Buttons/RunAllMiroirTestsButton.js', () => ({
  RunAllMiroirTestsButton: ({
    label,
    runMode = 'unit',
    disabled,
    title,
  }: {
    label?: string;
    runMode?: 'unit' | 'integration';
    disabled?: boolean;
    title?: string;
  }) => (
    <button
      type="button"
      data-run-mode={runMode}
      disabled={disabled}
      title={title}
    >
      {label}
    </button>
  ),
}));

vi.mock('../../src/miroir-fwk/4_view/components/Reports/UiIntegrationTestRunControls.js', () => ({
  UiIntegrationTestRunControls: () => <div>Integration run settings</div>,
}));

vi.mock('../../src/miroir-fwk/4_view/components/Reports/UiIntegrationTestRunInspectorSummary.js', () => ({
  UiIntegrationTestRunInspectorSummary: () => null,
}));

import { MiroirTestListDisplay } from '../../src/miroir-fwk/4_view/components/Reports/MiroirTestListDisplay.js';

function asMiroirTest(instance: unknown): MiroirTestDefinition {
  return instance as MiroirTestDefinition;
}

function identityTransformer(): MiroirTestForTransformer['transformer'] {
  return { transformerType: 'identity' } as unknown as MiroirTestForTransformer['transformer'];
}

function unregisteredIntegSuite(): MiroirTestDefinition {
  return {
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
}

afterEach(() => {
  resetUiIntegrationTestRunPreferencesForTests();
});

describe('MiroirTestListDisplay dual bar (T3)', () => {
  it('shows unit and integ affordances for a mixed launchable list', () => {
    render(
      <MiroirTestListDisplay
        miroirTests={[
          asMiroirTest(miroirTest_runner_library),
          asMiroirTest(miroirTest_EntityPrimaryKey),
          asMiroirTest(miroirTest_miroirCoreTransformers),
        ]}
        gridType="ag-grid"
        useSnackBar={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Run All Unit Tests' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run All Integration Tests' })).toBeInTheDocument();
    expect(screen.getByText('Integration run settings')).toBeInTheDocument();
    expect(screen.getByText(/unit:\s*2/i)).toBeInTheDocument();
    expect(screen.getByText(/integ-capable:\s*2/i)).toBeInTheDocument();
  });

  it('hides integ chrome for a unit-only list', () => {
    render(
      <MiroirTestListDisplay
        miroirTests={[asMiroirTest(miroirTest_EntityPrimaryKey)]}
        gridType="ag-grid"
        useSnackBar={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Run All Unit Tests' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Run All Integration Tests' })).not.toBeInTheDocument();
    expect(screen.queryByText('Integration run settings')).not.toBeInTheDocument();
  });

  it('hides integ chrome when integ suites are present but none are UI-launchable', () => {
    render(
      <MiroirTestListDisplay
        miroirTests={[asMiroirTest(miroirTest_EntityPrimaryKey), unregisteredIntegSuite()]}
        gridType="ag-grid"
        useSnackBar={false}
      />,
    );

    expect(screen.getByRole('button', { name: 'Run All Unit Tests' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Run All Integration Tests' })).not.toBeInTheDocument();
    expect(screen.queryByText('Integration run settings')).not.toBeInTheDocument();
  });

  it('shows integ-only chrome when the list has launchable integ and no unit suites', () => {
    render(
      <MiroirTestListDisplay
        miroirTests={[asMiroirTest(miroirTest_runner_library)]}
        gridType="ag-grid"
        useSnackBar={false}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Run All Unit Tests' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run All Integration Tests' })).toBeInTheDocument();
    expect(screen.getByText('Integration run settings')).toBeInTheDocument();
  });
});
