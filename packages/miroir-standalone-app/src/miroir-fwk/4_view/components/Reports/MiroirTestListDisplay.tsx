import { useMemo, useState } from 'react';

import {
  MiroirLoggerFactory,
  type LoggerInterface,
  type MiroirTestDefinition,
  type ViewParams,
} from 'miroir-core';

import { packageName } from '../../../../constants.js';
import { isUiIntegrationProfileLaunchableInBrowser } from '../../../4-tests/integrationTestProfileCatalog.js';
import { classifyMiroirTestListExecutionCapabilities } from '../../../4-tests/miroirTestSuiteUiExecution.js';
import { useUiIntegrationTestRunPreferences } from '../../../4-tests/useUiIntegrationTestRunPreferences.js';
import { cleanLevel } from '../../constants.js';
import {
  RunAllMiroirTestsButton,
  type MiroirTestSuiteResultsMap,
} from '../Buttons/RunAllMiroirTestsButton.js';
import type { TestResultData } from '../Buttons/testResultReport.js';
import { ThemedProgressiveAccordion } from '../Themes/BasicComponents.js';
import { TestResultsGrid } from './TestResultsGrid.js';
import { UnitTestExecutionSummary } from './UnitTestExecutionSummary.js';
import { UiIntegrationTestRunControls } from './UiIntegrationTestRunControls.js';
import { UiIntegrationTestRunInspectorSummary } from './UiIntegrationTestRunInspectorSummary.js';
import { getMiroirTestSuiteKey, sortMiroirTestInstances } from './miroirTestSuiteKey.js';
import type { TestResultDataAndSelect } from './testSelectionUtils.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, 'MiroirTestListDisplay'),
  'UI',
).then((logger: LoggerInterface) => {
  log = logger;
});

export interface MiroirTestListDisplayProps {
  miroirTests: MiroirTestDefinition[];
  style?: React.CSSProperties;
  gridType: ViewParams['gridType'];
  useSnackBar?: boolean;
}

const unitRunButtonStyle: React.CSSProperties = {
  backgroundColor: '#4527a0',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 16px',
  fontWeight: 'bold',
  marginRight: '8px',
};

const integRunButtonStyle: React.CSSProperties = {
  ...unitRunButtonStyle,
  backgroundColor: '#ef6c00',
};

function summarizeSuiteResults(results: TestResultData[]): {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  statusLabel: string;
  statusColor: string;
} {
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const result of results) {
    if (result.testResult === 'skipped' || result.status === 'skipped') {
      skipped++;
    } else if (
      result.testResult === 'error' ||
      result.status === 'error' ||
      (result.failedAssertions && result.failedAssertions.length > 0)
    ) {
      failed++;
    } else {
      passed++;
    }
  }

  const total = results.length;
  const statusLabel =
    failed > 0 ? 'FAILED' : skipped === total && total > 0 ? 'SKIPPED' : 'PASSED';
  const statusColor = failed > 0 ? '#f44336' : skipped === total && total > 0 ? '#999' : '#4caf50';

  return { passed, failed, skipped, total, statusLabel, statusColor };
}

function toSelectableResults(results: TestResultData[]): TestResultDataAndSelect[] {
  return results.map((result) => ({ ...result, selected: false }));
}

export const MiroirTestListDisplay = (props: MiroirTestListDisplayProps) => {
  const { miroirTests, style, useSnackBar = true } = props;
  const [resultsBySuiteKey, setResultsBySuiteKey] = useState<MiroirTestSuiteResultsMap>({});
  const integrationPreferences = useUiIntegrationTestRunPreferences();
  const integrationProfileBrowserLaunchable = isUiIntegrationProfileLaunchableInBrowser(
    integrationPreferences.profileName,
  );

  const sortedInstances = useMemo(
    () => sortMiroirTestInstances(miroirTests),
    [miroirTests],
  );

  const listCapabilities = useMemo(
    () => classifyMiroirTestListExecutionCapabilities(sortedInstances),
    [sortedInstances],
  );

  const showUnitBatch = listCapabilities.hasUnitLeaves;
  const showIntegrationBatch = listCapabilities.launchableIntegrationSuiteKeys.length > 0;

  const allResults = useMemo(
    () => Object.values(resultsBySuiteKey).flat(),
    [resultsBySuiteKey],
  );

  const handleTestComplete = (resultsMap: MiroirTestSuiteResultsMap) => {
    setResultsBySuiteKey(resultsMap);
    log.info('All MiroirTests completed:', resultsMap);
  };

  const defaultStyle: React.CSSProperties = {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#ede7f6',
    borderRadius: '8px',
    border: '1px solid #b39ddb',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    width: '100%',
    boxSizing: 'border-box',
    ...style,
  };

  return (
    <div style={defaultStyle}>
      <div
        style={{
          marginBottom: '8px',
          fontWeight: 'bold',
          color: '#4527a0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <span>Miroir Tests Available ({sortedInstances.length})</span>
        <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#5e35b1' }}>
          unit: {listCapabilities.unitSuiteKeys.length} · integ-capable:{' '}
          {listCapabilities.integrationSuiteKeys.length}
        </span>
      </div>

      {showUnitBatch && (
        <RunAllMiroirTestsButton
          miroirTests={sortedInstances}
          useSnackBar={useSnackBar}
          onTestComplete={handleTestComplete}
          runMode="unit"
          label="Run All Unit Tests"
          style={unitRunButtonStyle}
        />
      )}

      {showIntegrationBatch && (
        <>
          <UiIntegrationTestRunControls />
          <RunAllMiroirTestsButton
            miroirTests={sortedInstances}
            useSnackBar={useSnackBar}
            onTestComplete={handleTestComplete}
            runMode="integration"
            integrationProfileName={integrationPreferences.profileName}
            integrationRunTargetMode={integrationPreferences.runTargetMode}
            label="Run All Integration Tests"
            disabled={!integrationProfileBrowserLaunchable}
            title={
              !integrationProfileBrowserLaunchable
                ? 'Selected profile is not launchable in the browser — use emulatedServer-indexedDb or a realServer-* profile'
                : undefined
            }
            style={{
              ...integRunButtonStyle,
              backgroundColor: integrationProfileBrowserLaunchable ? '#ef6c00' : '#9e9e9e',
            }}
          />
        </>
      )}

      {showIntegrationBatch && <UiIntegrationTestRunInspectorSummary />}

      {allResults.length > 0 && (
        <div style={{ marginTop: '20px', width: '100%' }}>
          <UnitTestExecutionSummary
            testResultsData={allResults}
            testLabel="All Miroir Tests"
          />

          <div style={{ marginTop: '12px' }}>
            {sortedInstances.map((instance) => {
              const suiteKey = getMiroirTestSuiteKey(instance);
              const suiteResults = resultsBySuiteKey[suiteKey];
              if (!suiteResults?.length) {
                return null;
              }

              const summary = summarizeSuiteResults(suiteResults);

              return (
                <ThemedProgressiveAccordion
                  key={suiteKey}
                  initiallyExpanded={false}
                  summary={
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <strong style={{ color: '#4527a0' }}>{suiteKey}</strong>
                      <span style={{ color: summary.statusColor, fontWeight: 'bold' }}>
                        {summary.statusLabel}
                      </span>
                      <span style={{ fontSize: '12px', color: '#555' }}>
                        ✓ {summary.passed}/{summary.total}
                        {summary.failed > 0 && (
                          <span style={{ color: '#f44336' }}> · ✗ {summary.failed}</span>
                        )}
                        {summary.skipped > 0 && (
                          <span style={{ color: '#999' }}> · ⏭ {summary.skipped}</span>
                        )}
                      </span>
                    </span>
                  }
                >
                  <TestResultsGrid
                    testResultsData={toSelectableResults(suiteResults)}
                    testLabel={suiteKey}
                    gridType={props.gridType}
                    enableSelection={false}
                    linkResultsToEditor={true}
                  />
                </ThemedProgressiveAccordion>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
