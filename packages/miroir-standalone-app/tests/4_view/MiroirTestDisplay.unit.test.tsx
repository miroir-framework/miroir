import React from 'react';
import '@testing-library/jest-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { MiroirTestDefinition } from 'miroir-core';
import { miroirTest_runner_returnDocument } from 'miroir-test-app_deployment-library';
import {
  miroirTest_EntityPrimaryKey,
  miroirTest_action_domainController_dataCrud,
  miroirTest_tr_core,
} from 'miroir-test-app_deployment-miroir';

import {
  resetUiIntegrationTestRunPreferencesForTests,
  setUiIntegrationTestRunPreferences,
} from '../../src/miroir-fwk/4-tests/uiIntegrationTestRunPreferences.js';

vi.mock('../../src/miroir-fwk/4_view/components/Buttons/RunMiroirTestSuiteButton.js', () => ({
  RunMiroirTestSuiteButton: ({
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
    <button type="button" data-run-mode={runMode} disabled={disabled} title={title}>
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

vi.mock('../../src/miroir-fwk/4_view/components/Reports/TestExecutionPanel.js', () => ({
  TestExecutionPanel: () => null,
}));

import { MiroirTestDisplay } from '../../src/miroir-fwk/4_view/components/Reports/MiroirTestDisplay.js';

function asMiroirTest(instance: unknown): MiroirTestDefinition {
  return instance as MiroirTestDefinition;
}

afterEach(() => {
  resetUiIntegrationTestRunPreferencesForTests();
});

describe('MiroirTestDisplay capability chrome (T4)', () => {
  it('shows integ-only chrome for runner.returnDocument', () => {
    render(
      <MiroirTestDisplay
        miroirTest={asMiroirTest(miroirTest_runner_returnDocument)}
        testLabel="runner.returnDocument"
        gridType="ag-grid"
        useSnackBar={false}
      />,
    );

    expect(screen.getByText('integration')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Unit Tests/i })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Run runner.returnDocument Integration Tests' }),
    ).toBeEnabled();
    expect(screen.getByText('Integration run settings')).toBeInTheDocument();
  });

  it('enables integ button for action.domainController.dataCrud action suite', () => {
    render(
      <MiroirTestDisplay
        miroirTest={asMiroirTest(miroirTest_action_domainController_dataCrud)}
        testLabel="domainController.data.crud"
        gridType="ag-grid"
        useSnackBar={false}
      />,
    );

    expect(screen.getByText('integration')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Run domainController.data.crud Integration Tests',
      }),
    ).toBeEnabled();
  });

  it('shows unit-only chrome for EntityPrimaryKey', () => {
    render(
      <MiroirTestDisplay
        miroirTest={asMiroirTest(miroirTest_EntityPrimaryKey)}
        testLabel="EntityPrimaryKey"
        gridType="ag-grid"
        useSnackBar={false}
      />,
    );

    expect(screen.getByText('unit')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Run EntityPrimaryKey Unit Tests' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Integration Tests/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Integration run settings')).not.toBeInTheDocument();
  });

  it('shows both buttons for tr.core (mixed)', () => {
    render(
      <MiroirTestDisplay
        miroirTest={asMiroirTest(miroirTest_tr_core)}
        testLabel="tr.core"
        gridType="ag-grid"
        useSnackBar={false}
      />,
    );

    expect(screen.getByText('mixed')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Run tr.core Unit Tests' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Run tr.core Integration Tests' }),
    ).toBeEnabled();
    expect(screen.getByText('Integration run settings')).toBeInTheDocument();
  });

  it('disables mixed-suite integ button when profile is not browser-launchable', () => {
    setUiIntegrationTestRunPreferences({ profileName: 'emulatedServer-sql' });

    render(
      <MiroirTestDisplay
        miroirTest={asMiroirTest(miroirTest_tr_core)}
        testLabel="tr.core"
        gridType="ag-grid"
        useSnackBar={false}
      />,
    );

    const integButton = screen.getByRole('button', {
      name: 'Run tr.core Integration Tests',
    });
    expect(integButton).toBeDisabled();
    expect(integButton).toHaveAttribute(
      'title',
      expect.stringMatching(/not launchable in the browser/i),
    );
  });
});
