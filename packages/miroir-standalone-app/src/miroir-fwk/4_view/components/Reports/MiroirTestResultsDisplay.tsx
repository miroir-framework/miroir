import type { ViewParams } from 'miroir-core';

import { countTestResults, type TestResultData } from '../Buttons/testResultReport.js';
import { ThemedProgressiveAccordion } from '../Themes/BasicComponents.js';
import { TestResultsGrid } from './TestResultsGrid.js';
import { UnitTestExecutionSummary } from './UnitTestExecutionSummary.js';
import type { TestResultDataAndSelect } from './testSelectionUtils.js';

export interface MiroirTestResultsDisplayProps {
  resultsBySuiteKey: Record<string, TestResultData[]>;
  /** The suites to show, in this order; all of `resultsBySuiteKey`, in its order, when absent. */
  suiteKeys?: string[];
  gridType: ViewParams['gridType'];
  /** Test names link to the test in the editor of the current Report (true by default). */
  linkResultsToEditor?: boolean;
}

function summarizeSuiteResults(results: TestResultData[]): {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  statusLabel: string;
  statusColor: string;
} {
  const { passed, failed, skipped } = countTestResults(results);
  const total = results.length;
  const statusLabel =
    failed > 0 ? 'FAILED' : skipped === total && total > 0 ? 'SKIPPED' : 'PASSED';
  const statusColor = failed > 0 ? '#f44336' : skipped === total && total > 0 ? '#999' : '#4caf50';

  return { passed, failed, skipped, total, statusLabel, statusColor };
}

function toSelectableResults(results: TestResultData[]): TestResultDataAndSelect[] {
  return results.map((result) => ({ ...result, selected: false }));
}

/** #487: the results of a batch of MiroirTests (summary, then one accordion per suite), for Run all and the self-test. */
export const MiroirTestResultsDisplay = (props: MiroirTestResultsDisplayProps) => {
  const suiteKeys = props.suiteKeys ?? Object.keys(props.resultsBySuiteKey);
  const allResults = suiteKeys.flatMap((suiteKey) => props.resultsBySuiteKey[suiteKey] ?? []);
  if (allResults.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '20px', width: '100%' }}>
      <UnitTestExecutionSummary
        testResultsData={allResults}
        testLabel="All Miroir Tests"
      />

      <div style={{ marginTop: '12px' }}>
        {suiteKeys.map((suiteKey) => {
          const suiteResults = props.resultsBySuiteKey[suiteKey];
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
                linkResultsToEditor={props.linkResultsToEditor ?? true}
              />
            </ThemedProgressiveAccordion>
          );
        })}
      </div>
    </div>
  );
};
