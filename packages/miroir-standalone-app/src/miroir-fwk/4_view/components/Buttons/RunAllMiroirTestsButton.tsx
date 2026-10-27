import React, { useState } from 'react';

import {
  ACTION_OK,
  MiroirLoggerFactory,
  type Action2VoidReturnType,
  type LoggerInterface,
  type MiroirTestDefinition,
} from 'miroir-core';

import { useMiroirContextService, useSnackbar } from 'miroir-react';
import { readAppMiroirReports } from '../../../4-tests/appMiroirReports.js';
import { useSelectedApplicationRunnerUuidIndex } from '../../../4-tests/useSelectedApplicationMiroirTestSuiteRegistries.js';
import { packageName } from '../../../../constants.js';
import { miroirTestDefinitionHasReactComponentTest } from '../../../4-tests/miroirTestSuiteUiExecution.js';
import type {
  UiIntegrationTestRunRequest,
  UiIntegrationTestRunTargetMode,
} from '../../../4-tests/uiIntegrationTestLauncherTypes.js';
import { useIntegTestRunCoordinator } from '../../../4-tests/useIntegTestRunCoordinator.js';
import { ActionButtonWithSnackbar } from '../../components/Page/ActionButtonWithSnackbar.js';
import { cleanLevel } from '../../constants.js';
import {
  runIntegrationMiroirTestBatch,
  runUnitMiroirTestBatch,
  type MiroirTestSuiteResultsMap,
} from '../../../4-tests/miroirTestBatch.js';

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, 'RunAllMiroirTestsButton');
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
  'UI',
).then((logger: LoggerInterface) => {
  log = logger;
});

export type { MiroirTestSuiteResultsMap };

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
  /**
   * #286: prepares the component test sandbox. Unit mode awaits it once, before the first suite,
   * when "Include component tests" is checked and a suite has a `reactComponentTest` leaf outside
   * a `runOnDemand` suite (#303: Run all skips those).
   */
  beforeRun?: () => Promise<void>;
  /**
   * #286: called when a run prepared by `beforeRun` ends, success or error (ends the component
   * test run: releases the suite wrappers and the run lock).
   */
  afterRun?: () => void;
  /** #330: mounts the Reports of the integration runs of suites with `reportTest` leaves. */
  prepareReportTests?: UiIntegrationTestRunRequest['prepareReportTests'];
  [key: string]: unknown;
}

const includeComponentTestsLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '13px',
  color: '#4527a0',
  marginRight: '8px',
};

// ################################################################################################
export const RunAllMiroirTestsButton: React.FC<RunAllMiroirTestsButtonProps> = ({
  miroirTests,
  useSnackBar,
  onTestComplete,
  label,
  runMode = 'unit',
  integrationProfileName,
  integrationRunTargetMode,
  beforeRun,
  afterRun,
  prepareReportTests,
  ...buttonProps
}) => {
  // #286: unit mode only. When unchecked, `reactComponentTest` leaves are recorded as skipped.
  const [includeComponentTests, setIncludeComponentTests] = useState(true);
  const { handleAsyncAction } = useSnackbar();
  const miroirContextService = useMiroirContextService();
  const { isRunning: integRunInProgress } = useIntegTestRunCoordinator();
  const runnerUuidIndex = useSelectedApplicationRunnerUuidIndex();

  const onUnitAction = async (): Promise<Action2VoidReturnType> => {
    const componentTestsPrepared =
      includeComponentTests &&
      beforeRun !== undefined &&
      miroirTests.some((instance) =>
        miroirTestDefinitionHasReactComponentTest(instance.definition, { ignoreRunOnDemandSuites: true }),
      );
    if (componentTestsPrepared) {
      await beforeRun();
    }

    let resultsBySuiteKey: MiroirTestSuiteResultsMap;
    try {
      resultsBySuiteKey = await runUnitMiroirTestBatch({
        miroirTests,
        tracker: miroirContextService.miroirContext.miroirActivityTracker,
        includeComponentTests,
      });
    } finally {
      if (componentTestsPrepared) {
        afterRun?.();
      }
    }

    if (onTestComplete) {
      onTestComplete(resultsBySuiteKey);
    }
    return ACTION_OK;
  };

  const onIntegrationAction = async (): Promise<Action2VoidReturnType> => {
    const { resultsBySuiteKey, failures } = await runIntegrationMiroirTestBatch({
      miroirTests,
      integrationProfileName,
      integrationRunTargetMode,
      runnerUuidIndex,
      prepareReportTests,
      miroirReports: () =>
        readAppMiroirReports(
          miroirContextService.domainController,
          miroirContextService.applicationDeploymentMap,
        ),
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

  const button = (
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

  if (runMode === 'integration') {
    return button;
  }

  return (
    <>
      {button}
      <label style={includeComponentTestsLabelStyle}>
        <input
          type="checkbox"
          checked={includeComponentTests}
          onChange={(event) => setIncludeComponentTests(event.target.checked)}
        />
        Include component tests
      </label>
    </>
  );
};
