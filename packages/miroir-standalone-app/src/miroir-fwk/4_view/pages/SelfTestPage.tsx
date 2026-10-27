/**
 * #487: the page the client shows in self-test mode instead of the application: the run's
 * environment, tags and verdict, its progress, then the results with the Run all display.
 * Props only: `startSelfTest` renders it again as the run progresses.
 */
import type { MiroirSelfTestResult } from '../../4-tests/selfTest/selfTestResult.js';
import type { TestResultData } from '../components/Buttons/testResultReport.js';
import { MiroirTestResultsDisplay } from '../components/Reports/MiroirTestResultsDisplay.js';
import { ReportPageContextProvider } from '../components/Reports/ReportPageContext.js';

export interface SelfTestPageProps {
  result: MiroirSelfTestResult;
  resultsBySuiteKey: Record<string, TestResultData[]>;
}

const verdictColor: Record<MiroirSelfTestResult['verdict'], string> = {
  running: '#ef6c00',
  passed: '#2e7d32',
  failed: '#c62828',
};

export const SelfTestPage = ({ result, resultsBySuiteKey }: SelfTestPageProps) => {
  const suitesDone = Object.keys(resultsBySuiteKey).length;
  return (
    <ReportPageContextProvider>
      <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '20px', margin: '0 0 8px' }}>Miroir self-test</h1>
        <div style={{ marginBottom: '8px', color: '#555' }}>
          environment {result.environment ?? 'unknown'} · tags {result.tags.join(', ')}
        </div>
        <div
          data-testid="miroir-self-test-verdict"
          style={{ fontSize: '18px', fontWeight: 'bold', color: verdictColor[result.verdict] }}
        >
          {result.verdict === 'running'
            ? `running: ${suitesDone} suite(s) done`
            : `${result.verdict}: ${result.counts?.passed ?? 0} passed, ${result.counts?.failed ?? 0} failed, ${result.counts?.skipped ?? 0} skipped in ${result.counts?.suites ?? 0} suite(s)`}
        </div>
        {result.error && (
          <pre data-testid="miroir-self-test-error" style={{ color: '#c62828', whiteSpace: 'pre-wrap' }}>
            {result.error}
          </pre>
        )}
        {result.skippedSuites?.map((skipped) => (
          <div key={skipped.suiteKey} data-testid="miroir-self-test-skipped-suite">
            not run: {skipped.suiteKey} ({skipped.reason})
          </div>
        ))}
        <MiroirTestResultsDisplay
          resultsBySuiteKey={resultsBySuiteKey}
          gridType="ag-grid"
          linkResultsToEditor={false}
        />
      </div>
    </ReportPageContextProvider>
  );
};
