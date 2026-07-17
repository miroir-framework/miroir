import React from 'react';

import {
  ACTION_OK,
  MiroirLoggerFactory,
  TestFramework,
  defaultMetaModelEnvironment,
  runMiroirTests,
  type Action2VoidReturnType,
  type LoggerInterface,
  type MiroirTestDefinition,
} from 'miroir-core';

import { useMiroirContextService, useSnackbar } from 'miroir-react';
import { packageName } from '../../../../constants.js';
import {
  DEFAULT_UI_INTEGRATION_PROFILE_NAME,
  DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE,
} from '../../../4-tests/integrationTestProfileAssets.js';
import {
  getIntegTestRunCoordinator,
  type IntegTestRunCoordinator,
} from '../../../4-tests/integTestRunCoordinator.js';
import {
  classifyMiroirTestListExecutionCapabilities,
  resolveUiIntegrationRunnerSuiteKey,
} from '../../../4-tests/miroirTestSuiteUiExecution.js';
import type { UiIntegrationTestLauncherEnvironment } from '../../../4-tests/uiIntegrationTestLauncher.js';
import type { UiIntegrationTestRunTargetMode } from '../../../4-tests/uiIntegrationTestLauncherTypes.js';
import { useIntegTestRunCoordinator } from '../../../4-tests/useIntegTestRunCoordinator.js';
import { ActionButtonWithSnackbar } from '../../components/Page/ActionButtonWithSnackbar.js';
import { cleanLevel } from '../../constants.js';
import {
  getMiroirTestSuiteKey,
  sortMiroirTestInstances,
} from '../Reports/miroirTestSuiteKey.js';
import { generateTestReport, type TestResultData } from './testResultReport.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, 'RunAllMiroirTestsButton'),
  'UI',
).then((logger: LoggerInterface) => {
  log = logger;
});

export type MiroirTestSuiteResultsMap = Record<string, TestResultData[]>;

export type RunAllMiroirTestsRunMode = 'unit' | 'integration';

interface RunAllMiroirTestsButtonProps {
  miroirTests: MiroirTestDefinition[];
  useSnackBar: boolean;
  onTestComplete?: (resultsBySuiteKey: MiroirTestSuiteResultsMap) => void;
  label?: string;
  /** T2 — unit batch (default) vs sequential UI integration batch. */
  runMode?: RunAllMiroirTestsRunMode;
  integrationProfileName?: string;
  integrationRunTargetMode?: UiIntegrationTestRunTargetMode;
  [key: string]: unknown;
}

/** Nested launcher calls must not re-acquire the shared mutex while the list batch holds it. */
function createBatchNestedCoordinator(): IntegTestRunCoordinator {
  const nested = {
    get isRunning() {
      return true;
    },
    subscribe: () => () => {},
    acquire: () => {},
    release: () => {},
    runExclusive: async <T,>(fn: () => Promise<T>) => fn(),
  };
  return nested as unknown as IntegTestRunCoordinator;
}

function selectLaunchableIntegrationInstances(
  miroirTests: MiroirTestDefinition[],
): MiroirTestDefinition[] {
  const listCaps = classifyMiroirTestListExecutionCapabilities(miroirTests);
  const launchableKeySet = new Set(listCaps.launchableIntegrationSuiteKeys);

  if (listCaps.integrationSuiteKeys.length > listCaps.launchableIntegrationSuiteKeys.length) {
    const skipped = listCaps.integrationSuiteKeys.filter((key) => !launchableKeySet.has(key));
    log.info(
      `Skipping ${skipped.length} non-launchable integration suite(s): ${skipped.join(', ')}`,
    );
  }

  return sortMiroirTestInstances(miroirTests).filter((instance) => {
    const registryKey = resolveUiIntegrationRunnerSuiteKey(instance);
    return registryKey !== undefined && launchableKeySet.has(registryKey);
  });
}

async function runLaunchableIntegrationBatch(params: {
  miroirTests: MiroirTestDefinition[];
  integrationProfileName?: string;
  integrationRunTargetMode?: UiIntegrationTestRunTargetMode;
}): Promise<{ resultsBySuiteKey: MiroirTestSuiteResultsMap; failures: string[] }> {
  const sortedLaunchable = selectLaunchableIntegrationInstances(params.miroirTests);
  if (sortedLaunchable.length === 0) {
    throw new Error('No UI-launchable integration suites in this MiroirTest list');
  }

  const [
    { runUiIntegrationTestSuite },
    { loadBrowserUiIntegrationTestLauncherEnvironment },
    { setLastUiIntegrationTestRunResult },
  ] = await Promise.all([
    import('../../../4-tests/uiIntegrationTestLauncher.js'),
    import('../../../4-tests/loadBrowserUiIntegrationTestLauncherEnvironment.js'),
    import('../../../4-tests/uiIntegrationTestRunState.js'),
  ]);

  const baseEnv = await loadBrowserUiIntegrationTestLauncherEnvironment();
  const resultsBySuiteKey: MiroirTestSuiteResultsMap = {};
  const failures: string[] = [];
  const nestedCoordinator = createBatchNestedCoordinator();

  await getIntegTestRunCoordinator().runExclusive(async () => {
    const batchEnv: UiIntegrationTestLauncherEnvironment = {
      ...baseEnv,
      getCoordinator: () => nestedCoordinator,
    };

    for (const instance of sortedLaunchable) {
      const registryKey = resolveUiIntegrationRunnerSuiteKey(instance);
      if (!registryKey) {
        continue;
      }
      const identityKey = getMiroirTestSuiteKey(instance);

      const result = await runUiIntegrationTestSuite(
        {
          suiteKey: registryKey,
          suiteDefinition: instance.definition,
          profileName: params.integrationProfileName ?? DEFAULT_UI_INTEGRATION_PROFILE_NAME,
          runTargetMode: params.integrationRunTargetMode ?? DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE,
          hostMode: 'isolated',
        },
        batchEnv,
      );

      setLastUiIntegrationTestRunResult(result);
      resultsBySuiteKey[identityKey] = result.testSuiteResults
        ? generateTestReport(identityKey, result.testSuiteResults, () => {})
        : [];

      if (!result.success) {
        failures.push(registryKey);
      }
    }
  });

  return { resultsBySuiteKey, failures };
}

export const RunAllMiroirTestsButton: React.FC<RunAllMiroirTestsButtonProps> = ({
  miroirTests,
  useSnackBar,
  onTestComplete,
  label,
  runMode = 'unit',
  integrationProfileName,
  integrationRunTargetMode,
  ...buttonProps
}) => {
  const { handleAsyncAction } = useSnackbar();
  const miroirContextService = useMiroirContextService();
  const { isRunning: integRunInProgress } = useIntegTestRunCoordinator();

  const onUnitAction = async (): Promise<Action2VoidReturnType> => {
    const tracker = miroirContextService.miroirContext.miroirActivityTracker;
    const sortedInstances = sortMiroirTestInstances(miroirTests);
    const resultsBySuiteKey: MiroirTestSuiteResultsMap = {};

    for (const instance of sortedInstances) {
      const suiteKey = getMiroirTestSuiteKey(instance);
      tracker.resetResults();

      await runMiroirTests._runMiroirTestSuite(
        TestFramework as any,
        [],
        instance.definition,
        undefined,
        defaultMetaModelEnvironment,
        tracker,
        undefined,
        true,
        runMiroirTests,
        { executionMode: 'unit' },
      );

      const suiteResults = tracker.getTestAssertionsResults([]);
      resultsBySuiteKey[suiteKey] = generateTestReport(suiteKey, suiteResults, () => {});
      log.info(`MiroirTest results for ${suiteKey}:`, resultsBySuiteKey[suiteKey]);
    }

    if (onTestComplete) {
      onTestComplete(resultsBySuiteKey);
    }
    return ACTION_OK;
  };

  const onIntegrationAction = async (): Promise<Action2VoidReturnType> => {
    const { resultsBySuiteKey, failures } = await runLaunchableIntegrationBatch({
      miroirTests,
      integrationProfileName,
      integrationRunTargetMode,
    });

    if (onTestComplete) {
      onTestComplete(resultsBySuiteKey);
    }

    if (failures.length > 0) {
      throw new Error(
        `Integration batch failed for: ${failures.join(', ')} — see Integration Test Inspector`,
      );
    }

    return ACTION_OK;
  };

  const onAction = runMode === 'integration' ? onIntegrationAction : onUnitAction;

  const successMessage =
    runMode === 'integration'
      ? 'All launchable Miroir integration tests completed — see Integration Test Inspector'
      : 'All Miroir tests completed';

  const actionName =
    runMode === 'integration' ? 'run all miroir integration tests' : 'run all miroir tests';

  const disabled =
    buttonProps.disabled === true || (runMode === 'integration' && integRunInProgress);

  const title =
    runMode === 'integration' && integRunInProgress
      ? 'An integration test run is already in progress'
      : undefined;

  const resolvedLabel =
    label ??
    (runMode === 'integration' ? 'Run All Integration Tests' : 'Run All Miroir Tests');

  return (
    <ActionButtonWithSnackbar
      onAction={onAction}
      successMessage={successMessage}
      label={resolvedLabel}
      handleAsyncAction={useSnackBar ? handleAsyncAction : undefined}
      actionName={actionName}
      {...buttonProps}
      disabled={disabled}
      title={title}
    />
  );
};
