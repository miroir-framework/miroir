import React from 'react';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { MiroirTestDefinition } from 'miroir-core';
import { miroirTest_runner_library } from 'miroir-test-app_deployment-library';
import {
  miroirTest_EntityPrimaryKey,
  miroirTest_miroirCoreTransformers,
} from 'miroir-test-app_deployment-miroir';

import {
  getIntegTestRunCoordinator,
  resetIntegTestRunCoordinatorForTests,
  type IntegTestRunCoordinator,
} from '../../src/miroir-fwk/4-tests/integTestRunCoordinator.js';
import type { UiIntegrationTestRunRequest } from '../../src/miroir-fwk/4-tests/uiIntegrationTestLauncherTypes.js';

const runMiroirTestSuiteMock = vi.fn(async (..._args: unknown[]) => undefined);

function buildSuccessfulIntegrationResult(suiteKey: string) {
  return {
    suiteKey,
    sessionKind: 'runner' as const,
    runTarget: {
      applicationUuid: '5af03c98-fe5e-490b-b08f-e1230971c57f',
      applicationName: 'Library',
      deploymentUuid: 'f714bb2f-a12d-4e71-a03b-74dcedea6eb4',
    },
    runTargetMode: 'ephemeral' as const,
    profileName: 'emulatedServer-indexedDb',
    hostMode: 'isolated' as const,
    success: true,
    inspector: {
      profileName: 'emulatedServer-indexedDb',
      sessionKind: 'runner' as const,
      runTarget: {
        applicationUuid: '5af03c98-fe5e-490b-b08f-e1230971c57f',
        applicationName: 'Library',
        deploymentUuid: 'f714bb2f-a12d-4e71-a03b-74dcedea6eb4',
      },
      runTargetMode: 'ephemeral' as const,
      hostMode: 'isolated' as const,
      paramBankKeys: [] as string[],
    },
  };
}

type MockLauncherEnv = {
  getCoordinator?: () => IntegTestRunCoordinator;
};

const runUiIntegrationTestSuiteMock = vi.fn(
  async (
    request: Pick<UiIntegrationTestRunRequest, 'suiteKey'>,
    _env?: MockLauncherEnv,
  ) => buildSuccessfulIntegrationResult(request.suiteKey),
);

vi.mock('miroir-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('miroir-core')>();
  return {
    ...actual,
    runMiroirTests: {
      ...actual.runMiroirTests,
      _runMiroirTestSuite: (...args: unknown[]) =>
        runMiroirTestSuiteMock.apply(undefined, args as never),
    },
  };
});

vi.mock('miroir-react', () => ({
  useSnackbar: () => ({
    isActionRunning: false,
    handleAsyncAction: async (
      action: () => Promise<unknown>,
      _successMessage: string,
      _actionName: string,
    ) => {
      await action();
    },
  }),
  useMiroirContextService: () => ({
    miroirContext: {
      miroirActivityTracker: {
        resetResults: vi.fn(),
        getTestAssertionsResults: vi.fn(() => []),
      },
    },
  }),
  useMiroirTheme: () => ({
    currentTheme: {
      colors: { primary: '#4527a0', text: '#000', surface: '#fff' },
      typography: { fontSize: { sm: '14px' }, fontWeight: { medium: 500 } },
      spacing: { sm: '8px', md: '12px' },
      borderRadius: { sm: '4px' },
      components: {
        button: {
          primary: {},
          secondary: {},
        },
      },
    },
  }),
}));

vi.mock('../../src/miroir-fwk/4_view/components/Page/ActionButtonWithSnackbar.js', () => ({
  ActionButtonWithSnackbar: ({
    onAction,
    label,
    disabled,
    title,
  }: {
    onAction: () => Promise<unknown>;
    label: string;
    disabled?: boolean;
    title?: string;
  }) => (
    <button type="button" disabled={disabled} title={title} onClick={() => void onAction()}>
      {label}
    </button>
  ),
}));

vi.mock('../../src/miroir-fwk/4-tests/uiIntegrationTestLauncher.js', () => ({
  runUiIntegrationTestSuite: (
    request: Pick<UiIntegrationTestRunRequest, 'suiteKey'>,
    env?: MockLauncherEnv,
  ) => runUiIntegrationTestSuiteMock(request, env),
}));

vi.mock('../../src/miroir-fwk/4-tests/loadBrowserUiIntegrationTestLauncherEnvironment.js', () => ({
  loadBrowserUiIntegrationTestLauncherEnvironment: async () => ({
    createOrchestrator: () => ({}),
    loadConfigForProfile: async () => ({ miroirConfig: {}, logConfig: {} }),
    createActivityTracker: async () => ({
      miroirActivityTracker: { resetResults: vi.fn(), getTestAssertionsResults: vi.fn(() => []) },
      miroirEventService: {},
    }),
    expect: () => undefined,
    getCoordinator: () => getIntegTestRunCoordinator(),
  }),
}));

vi.mock('../../src/miroir-fwk/4-tests/uiIntegrationTestRunState.js', () => ({
  setLastUiIntegrationTestRunResult: vi.fn(),
}));

import { RunAllMiroirTestsButton } from '../../src/miroir-fwk/4_view/components/Buttons/RunAllMiroirTestsButton.js';

function asMiroirTest(instance: unknown): MiroirTestDefinition {
  return instance as MiroirTestDefinition;
}

beforeEach(() => {
  runMiroirTestSuiteMock.mockClear();
  runUiIntegrationTestSuiteMock.mockClear();
  runUiIntegrationTestSuiteMock.mockImplementation(
    async (
      request: Pick<UiIntegrationTestRunRequest, 'suiteKey'>,
      _env?: MockLauncherEnv,
    ) => buildSuccessfulIntegrationResult(request.suiteKey),
  );
  resetIntegTestRunCoordinatorForTests();
});

afterEach(() => {
  resetIntegTestRunCoordinatorForTests();
});

describe('RunAllMiroirTestsButton runMode (T2)', () => {
  it('defaults to unit and calls _runMiroirTestSuite with executionMode unit', async () => {
    render(
      <RunAllMiroirTestsButton
        miroirTests={[asMiroirTest(miroirTest_EntityPrimaryKey)]}
        useSnackBar={true}
        label="Run All Unit Tests"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Run All Unit Tests' }));

    await waitFor(() => {
      expect(runMiroirTestSuiteMock).toHaveBeenCalled();
    });
    expect(runUiIntegrationTestSuiteMock).not.toHaveBeenCalled();
    const lastCall = runMiroirTestSuiteMock.mock.calls.at(-1);
    expect(lastCall?.[lastCall.length - 1]).toEqual({ executionMode: 'unit' });
  });

  it('runMode integration calls launcher once per launchable suite, not unit path', async () => {
    render(
      <RunAllMiroirTestsButton
        miroirTests={[
          asMiroirTest(miroirTest_runner_library),
          asMiroirTest(miroirTest_EntityPrimaryKey),
          asMiroirTest(miroirTest_miroirCoreTransformers),
        ]}
        useSnackBar={true}
        runMode="integration"
        label="Run All Integration Tests"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Run All Integration Tests' }));

    await waitFor(() => {
      expect(runUiIntegrationTestSuiteMock).toHaveBeenCalled();
    });

    expect(runMiroirTestSuiteMock).not.toHaveBeenCalled();
    const suiteKeys = runUiIntegrationTestSuiteMock.mock.calls.map(
      (call) => (call[0] as { suiteKey: string }).suiteKey,
    );
    expect(suiteKeys).toEqual(['miroirCoreTransformers', 'runner_library']);
  });

  it('disables integration batch while coordinator holds a run', () => {
    getIntegTestRunCoordinator().acquire();

    render(
      <RunAllMiroirTestsButton
        miroirTests={[asMiroirTest(miroirTest_runner_library)]}
        useSnackBar={true}
        runMode="integration"
        label="Run All Integration Tests"
      />,
    );

    expect(screen.getByRole('button', { name: 'Run All Integration Tests' })).toBeDisabled();
    getIntegTestRunCoordinator().release();
  });

  it('holds the shared coordinator for the whole integration batch', async () => {
    const seenHeldDuringNested: boolean[] = [];
    runUiIntegrationTestSuiteMock.mockImplementation(
      async (
        request: Pick<UiIntegrationTestRunRequest, 'suiteKey'>,
        env?: MockLauncherEnv,
      ) => {
        const nested = env?.getCoordinator?.() ?? getIntegTestRunCoordinator();
        await nested.runExclusive(async () => {
          seenHeldDuringNested.push(getIntegTestRunCoordinator().isRunning);
        });
        return buildSuccessfulIntegrationResult(request.suiteKey);
      },
    );

    render(
      <RunAllMiroirTestsButton
        miroirTests={[
          asMiroirTest(miroirTest_runner_library),
          asMiroirTest(miroirTest_miroirCoreTransformers),
        ]}
        useSnackBar={true}
        runMode="integration"
        label="Run All Integration Tests"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Run All Integration Tests' }));

    await waitFor(() => {
      expect(runUiIntegrationTestSuiteMock).toHaveBeenCalledTimes(2);
    });
    expect(seenHeldDuringNested).toEqual([true, true]);
    expect(getIntegTestRunCoordinator().isRunning).toBe(false);
  });
});
