import { useMemo, useState } from 'react';

import {
  buildUiIntegrationSuiteRegistriesFromMiroirTests,
  filterMiroirTestInstancesByTags,
  listMiroirTestTagCounts,
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
import { ComponentTestSandboxProvider, useComponentTestSandbox } from './ComponentTestSandbox.js';
import { MiroirTestResultsDisplay } from './MiroirTestResultsDisplay.js';
import { UiIntegrationTestRunControls } from './UiIntegrationTestRunControls.js';
import { UiIntegrationTestRunInspectorSummary } from './UiIntegrationTestRunInspectorSummary.js';
import { getMiroirTestSuiteKey, sortMiroirTestInstances } from './miroirTestSuiteKey.js';

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, 'MiroirTestListDisplay');
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
  'UI',
).then((logger: LoggerInterface) => {
  log = logger;
});

export interface MiroirTestListDisplayProps {
  miroirTests: MiroirTestDefinition[];
  style?: React.CSSProperties;
  gridType: ViewParams['gridType'];
  useSnackBar?: boolean;
  /** Called with the results of each Run all, keyed by suite. */
  onTestComplete?: (resultsBySuiteKey: MiroirTestSuiteResultsMap) => void;
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

function tagChipStyle(selected: boolean): React.CSSProperties {
  return {
    border: '1px solid #7e57c2',
    borderRadius: '12px',
    padding: '2px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    backgroundColor: selected ? '#7e57c2' : 'white',
    color: selected ? 'white' : '#4527a0',
  };
}

// #286: the provider gives Run all its own component test sandbox (analysis §5.6).
export const MiroirTestListDisplay = (props: MiroirTestListDisplayProps) => (
  <ComponentTestSandboxProvider>
    <MiroirTestListDisplayContent {...props} />
  </ComponentTestSandboxProvider>
);

const MiroirTestListDisplayContent = (props: MiroirTestListDisplayProps) => {
  const { miroirTests, style, useSnackBar = true, onTestComplete } = props;
  const componentTestSandbox = useComponentTestSandbox();
  const [resultsBySuiteKey, setResultsBySuiteKey] = useState<MiroirTestSuiteResultsMap>({});
  const integrationPreferences = useUiIntegrationTestRunPreferences();
  const integrationProfileBrowserLaunchable = isUiIntegrationProfileLaunchableInBrowser(
    integrationPreferences.profileName,
  );

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allSortedInstances = useMemo(
    () => sortMiroirTestInstances(miroirTests),
    [miroirTests],
  );
  const tagCounts = useMemo(() => listMiroirTestTagCounts(allSortedInstances), [allSortedInstances]);
  // A selected tag absent from the current list has no chip to clear it: ignore it.
  const activeTags = useMemo(
    () => selectedTags.filter((tag) => tagCounts.some((tagCount) => tagCount.tag === tag)),
    [selectedTags, tagCounts],
  );
  // #312: the selected tags restrict the list and what Run All runs; none selected means all.
  const sortedInstances = useMemo(
    () => filterMiroirTestInstancesByTags(allSortedInstances, activeTags),
    [allSortedInstances, activeTags],
  );

  const toggleTag = (tag: string) =>
    setSelectedTags(
      activeTags.includes(tag) ? activeTags.filter((selected) => selected !== tag) : [...activeTags, tag],
    );

  const { runner: runnerRegistry, transformer: transformerRegistry } = useMemo(
    () => buildUiIntegrationSuiteRegistriesFromMiroirTests(sortedInstances),
    [sortedInstances],
  );
  const listCapabilities = useMemo(
    () =>
      classifyMiroirTestListExecutionCapabilities(
        sortedInstances,
        runnerRegistry,
        transformerRegistry,
      ),
    [sortedInstances, runnerRegistry, transformerRegistry],
  );

  const showUnitBatch = listCapabilities.hasUnitLeaves;
  const showIntegrationBatch = listCapabilities.launchableIntegrationSuiteKeys.length > 0;

  const suiteKeys = useMemo(() => sortedInstances.map(getMiroirTestSuiteKey), [sortedInstances]);

  const handleTestComplete = (resultsMap: MiroirTestSuiteResultsMap) => {
    setResultsBySuiteKey(resultsMap);
    log.info('All MiroirTests completed:', resultsMap);
    onTestComplete?.(resultsMap);
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
        <span>
          {activeTags.length > 0
            ? `Miroir Tests Available (${sortedInstances.length} of ${allSortedInstances.length})`
            : `Miroir Tests Available (${sortedInstances.length})`}
        </span>
        <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#5e35b1' }}>
          unit: {listCapabilities.unitSuiteKeys.length} · integ-capable:{' '}
          {listCapabilities.integrationSuiteKeys.length}
        </span>
      </div>

      {tagCounts.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {tagCounts.map(({ tag, count }) => {
            const selected = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleTag(tag)}
                style={tagChipStyle(selected)}
              >
                {`${tag} (${count})`}
              </button>
            );
          })}
        </div>
      )}

      {showUnitBatch && (
        <RunAllMiroirTestsButton
          miroirTests={sortedInstances}
          useSnackBar={useSnackBar}
          onTestComplete={handleTestComplete}
          runMode="unit"
          beforeRun={componentTestSandbox?.prepareComponentTests}
          afterRun={componentTestSandbox?.finishComponentTests}
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
            prepareReportTests={componentTestSandbox?.prepareReportTests}
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

      <MiroirTestResultsDisplay
        resultsBySuiteKey={resultsBySuiteKey}
        suiteKeys={suiteKeys}
        gridType={props.gridType}
      />
    </div>
  );
};
