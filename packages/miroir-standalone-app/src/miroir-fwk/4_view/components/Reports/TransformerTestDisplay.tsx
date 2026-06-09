import { useMemo, useState } from 'react';
import {
  LoggerInterface,
  MiroirLoggerFactory,
  type TransformerTestDefinition,
  type ViewParams
} from "miroir-core";

import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import { RunTransformerTestSuiteButton } from '../Buttons/RunTransformerTestSuiteButton.js';
import { TestExecutionPanel } from './TestExecutionPanel.js';
import { buildTestFilter, type TestResultDataAndSelect, type TestSelectionState } from './testSelectionUtils.js';
import { createTransformerResetSelections } from './TransformerTestResults.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerTestDisplay"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export type { TestSelectionState } from './testSelectionUtils.js';

export interface TransformerTestSectionProps {
  transformerTest: TransformerTestDefinition;
  testLabel: string;
  style?: React.CSSProperties;
  gridType: ViewParams["gridType"];
  useSnackBar?: boolean;
  onTestComplete?: (testSuiteKey: string, structuredResults: TestResultDataAndSelect[]) => void;
}

export const TransformerTestDisplay = (props: TransformerTestSectionProps) => {
  const { transformerTest: instance, testLabel, style, useSnackBar = true, onTestComplete } = props;

  const [transformerTestResultsData, setTransformerTestResultsData] = useState<
    TestResultDataAndSelect[]
  >([]);
  const [testSelectionState, setTestSelectionsState] = useState<TestSelectionState | undefined>(undefined);

  const currentTestFilter = useMemo(() => {
    return buildTestFilter(testSelectionState, transformerTestResultsData);
  }, [testSelectionState, transformerTestResultsData]);

  const handleTestComplete = (testSuiteKey: string, structuredResults: TestResultDataAndSelect[]) => {
    setTransformerTestResultsData(structuredResults);
    log.info(`Test completed for ${testSuiteKey}:`, structuredResults);

    if (onTestComplete) {
      onTestComplete(testSuiteKey, structuredResults);
    }
  };

  const defaultStyle: React.CSSProperties = {
    marginBottom: "16px",
    padding: "12px",
    backgroundColor: "#e8f4fd",
    borderRadius: "8px",
    border: "1px solid #b3d9ff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    width: "100%",
    boxSizing: "border-box",
    ...style
  };

  return (
    <div style={defaultStyle}>
      <div style={{ marginBottom: "8px", fontWeight: "bold", color: "#1976d2" }}>
        Transformer Test Available
      </div>

      <RunTransformerTestSuiteButton
        transformerTestSuite={instance}
        testSuiteKey={testLabel}
        useSnackBar={useSnackBar}
        testFilter={currentTestFilter}
        onTestComplete={handleTestComplete}
        label={`Run All ${testLabel} Tests`}
        style={{
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "8px 16px",
          fontWeight: "bold",
          marginRight: "8px",
        }}
      />

      {transformerTestResultsData.length > 0 && instance ? (
        <TestExecutionPanel
          testLabel={testLabel}
          testResultsData={transformerTestResultsData}
          gridType={props.gridType}
          enableSelection={true}
          testSelectionsState={testSelectionState}
          setTestSelectionsState={setTestSelectionsState}
          onResetSelections={() => {
            setTestSelectionsState(
              createTransformerResetSelections(instance.definition, transformerTestResultsData),
            );
          }}
          linkResultsToEditor={true}
        />
      ) : null}
    </div>
  );
};
