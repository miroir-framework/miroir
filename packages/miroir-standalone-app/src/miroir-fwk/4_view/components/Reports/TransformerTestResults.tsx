import React, { useCallback, useMemo } from 'react';
import type { JzodElement } from 'miroir-core';
import { ValueObjectGrid } from '../Grids/ValueObjectGrid.js';
import { TestCellWithDetails } from './TestCellWithDetails.js';
import { TestResultCellWithActualValue } from './TestResultCellWithActualValue.js';

export type ResolveConditionalSchemaResult = {
  testName: string;
  testResult: string;
  status: string;
  assertionCount: number;
  assertions: string;
  failedAssertions: string[];
  fullAssertionsResults: Record<string, any>;
};

export interface TransformerTestResultsProps {
  resolveConditionalSchemaResultsData: ResolveConditionalSchemaResult[];
  testLabel?: string;
}

const resolveConditionalSchemaResultSchema: JzodElement = {
  type: "object",
  definition: {
    testName: { type: "string" },
    testResult: { type: "string" },
    status: { type: "string" },
    assertionCount: { type: "number" },
    assertions: { type: "string" },
    failedAssertions: {
      type: "array",
      definition: { type: "string" },
    },
    fullAssertionsResults: {
      type: "object",
      definition: {},
    },
  },
};

export const TransformerTestResults: React.FC<TransformerTestResultsProps> = ({
  resolveConditionalSchemaResultsData,
  testLabel = "TransformerTest"
}) => {
  // Don't render if no test results
  if (!resolveConditionalSchemaResultsData || resolveConditionalSchemaResultsData.length === 0) {
    return null;
  }

  // Create stable cell renderer functions to prevent ag-grid from recreating components
  // CRITICAL: These must be useCallback to maintain stable references, otherwise ag-grid
  // will destroy and recreate cell components on every parent re-render, causing modals to close
  const testNameCellRenderer = useCallback((params: any) => (
    <TestCellWithDetails
      value={params.value}
      testData={params.data.rawValue}
      testName={params.data.rawValue.testName}
      type="testName"
    />
  ), []);

  const statusCellRenderer = useCallback((params: any) => (
    <TestCellWithDetails
      value={params.value}
      testData={params.data.rawValue}
      testName={params.data.rawValue.testName}
      type="status"
    />
  ), []);

  const resultCellRenderer = useCallback((params: any) => (
    <TestResultCellWithActualValue
      value={params.value}
      testData={params.data.rawValue}
      testName={params.data.rawValue.testName}
    />
  ), []);

  const summaryTestCellRenderer = useCallback((params: any) => {
    const isSkipped = params.data.rawValue?.testResult === "skipped" || params.data.rawValue?.status === "skipped";
    return (
      <div
        style={{
          maxWidth: "200px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          cursor: "pointer",
          color: isSkipped ? '#999' : 'inherit',
          opacity: isSkipped ? 0.6 : 1,
        }}
        title="Click test name or status for full details"
      >
        {isSkipped ? `⏭ ${params.value}` : params.value}
      </div>
    );
  }, []);

  // Memoize column definitions to prevent recreation on every render
  const testResultsColumnDefs = useMemo(() => ({
    columnDefs: [
      {
        field: "testName",
        headerName: "Test Name",
        cellRenderer: testNameCellRenderer,
        width: 200,
      },
      {
        field: "status",
        headerName: "Status", 
        cellRenderer: statusCellRenderer,
        width: 100,
      },
      {
        field: "testResult",
        headerName: "Result",
        cellRenderer: resultCellRenderer,
        width: 100,
      },
      {
        field: "assertionCount",
        headerName: "Assertions",
        width: 100,
      },
      {
        field: "assertions",
        headerName: "Summary",
        cellRenderer: summaryTestCellRenderer,
        width: 250,
      },
    ],
  }), [testNameCellRenderer, statusCellRenderer, resultCellRenderer, summaryTestCellRenderer]);

  return (
    <>
      <h3>{testLabel} Test Results:</h3>
      <ValueObjectGrid
        valueObjects={resolveConditionalSchemaResultsData}
        jzodSchema={resolveConditionalSchemaResultSchema}
        columnDefs={testResultsColumnDefs}
        styles={{
          height: "400px",
          width: "100%",
        }}
        maxRows={50}
        sortByAttribute="testName"
        displayTools={false}
        gridType="ag-grid"
      />
    </>
  );
};