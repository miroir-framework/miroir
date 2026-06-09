import React, { useCallback, useMemo } from "react";
import { MiroirLoggerFactory, type JzodElement, type LoggerInterface, type ViewParams } from "miroir-core";

import { ValueObjectGrid } from "../Grids/ValueObjectGrid.js";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { TestCellWithDetails } from "./TestCellWithDetails.js";
import { TestResultCellWithActualValue } from "./TestResultCellWithActualValue.js";
import {
  defaultResetTestSelections,
  getTestSelectionSummary,
  type TestResultDataAndSelect,
  type TestSelectionState,
} from "./testSelectionUtils.js";
import { extractUnitTestLabelFromTestPath } from "./unitTestKindUi.js";
import { useReportPageContext } from "./ReportPageContext.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TestResultsGrid"),
  "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

const testResultSchema: JzodElement = {
  type: "object",
  definition: {
    testName: { type: "string" },
    testPath: {
      type: "array",
      definition: { type: "string" },
    },
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
    selected: { type: "boolean" },
  },
};

export interface TestResultsGridProps {
  testResultsData: TestResultDataAndSelect[];
  testLabel?: string;
  gridType: ViewParams["gridType"];
  enableSelection?: boolean;
  testSelectionsState?: TestSelectionState;
  setTestSelectionsState?: React.Dispatch<React.SetStateAction<TestSelectionState | undefined>>;
  onResetSelections?: () => void;
  linkResultsToEditor?: boolean;
}

export const TestResultsGrid: React.FC<TestResultsGridProps> = ({
  testResultsData,
  testLabel = "Test Results",
  gridType,
  enableSelection = false,
  testSelectionsState,
  setTestSelectionsState,
  onResetSelections,
  linkResultsToEditor = true,
}) => {
  const reportContext = useReportPageContext();
  const hasResults = testResultsData && testResultsData.length > 0;

  const testResultsDataWithSelection = useMemo(() => {
    return testResultsData.map((test) => ({
      ...test,
      selected: !testSelectionsState || testSelectionsState[test.testName] !== false,
    }));
  }, [testResultsData, testSelectionsState]);

  const handleSetTestSelection = useCallback(
    (testPath: string, selected: boolean): void => {
      setTestSelectionsState?.((prev) => ({
        ...prev,
        [testPath]: selected,
      }));
    },
    [setTestSelectionsState],
  );

  const handleSetAllTestsSelection = useCallback(
    (selected: boolean, testPaths?: string[]): void => {
      setTestSelectionsState?.((prev) => {
        const pathsToUpdate = testPaths ?? Object.keys(prev ?? {});
        const updates: TestSelectionState = {};
        pathsToUpdate.forEach((path) => {
          updates[path] = selected;
        });
        return { ...prev, ...updates };
      });
    },
    [setTestSelectionsState],
  );

  const handleNavigateToEditor = useCallback(
    (testData: TestResultDataAndSelect) => {
      const label = extractUnitTestLabelFromTestPath(testData.testPath);
      if (label) {
        reportContext.navigateToUnitTestInEditor(label);
      }
    },
    [reportContext],
  );

  const selectionCellRenderer = useCallback(
    (params: any) => (
      <input
        type="checkbox"
        checked={params.value}
        onChange={(e) => {
          handleSetTestSelection(params.data.rawValue.testName, e.target.checked);
        }}
        style={{ cursor: "pointer" }}
      />
    ),
    [handleSetTestSelection],
  );

  const testNameCellRenderer = useCallback(
    (params: any) => {
      const testName = params.data.rawValue.testName;
      const isSelected = !testSelectionsState || testSelectionsState[testName] !== false;
      const canLink =
        linkResultsToEditor &&
        (params.data.rawValue.testResult === "error" ||
          (params.data.rawValue.failedAssertions?.length ?? 0) > 0);

      return (
        <TestCellWithDetails
          value={params.value}
          testData={params.data.rawValue}
          testName={testName}
          type="testName"
          isSelected={isSelected}
          onNavigateToEditor={canLink ? () => handleNavigateToEditor(params.data.rawValue) : undefined}
        />
      );
    },
    [testSelectionsState, linkResultsToEditor, handleNavigateToEditor],
  );

  const statusCellRenderer = useCallback(
    (params: any) => (
      <TestCellWithDetails
        value={params.value}
        testData={params.data.rawValue}
        testName={params.data.rawValue.testName}
        type="status"
      />
    ),
    [],
  );

  const resultCellRenderer = useCallback(
    (params: any) => (
      <TestResultCellWithActualValue
        value={params.value}
        testData={params.data.rawValue}
        testName={params.data.rawValue.testName}
      />
    ),
    [],
  );

  const summaryTestCellRenderer = useCallback((params: any) => {
    const isSkipped =
      params.data.rawValue?.testResult === "skipped" ||
      params.data.rawValue?.status === "skipped";
    return (
      <div
        style={{
          maxWidth: "200px",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          cursor: "pointer",
          color: isSkipped ? "#999" : "inherit",
          opacity: isSkipped ? 0.6 : 1,
        }}
        title={params.value}
      >
        {params.value}
      </div>
    );
  }, []);

  const columnDefs = useMemo(() => {
    const columns: any[] = [];
    if (enableSelection) {
      columns.push({
        headerName: "Select",
        field: "selected",
        checkboxSelection: false,
        headerCheckboxSelection: false,
        width: 80,
        cellRenderer: selectionCellRenderer,
        sortable: false,
        filter: false,
        resizable: false,
        pinned: "left" as const,
      });
    }
    columns.push(
      {
        headerName: "Test Name",
        field: "testName",
        flex: 3,
        cellRenderer: testNameCellRenderer,
        sortable: true,
        filter: true,
      },
      {
        headerName: "Status",
        field: "status",
        width: 120,
        cellRenderer: statusCellRenderer,
        sortable: true,
        filter: true,
      },
      {
        headerName: "Result",
        field: "testResult",
        width: 100,
        cellRenderer: resultCellRenderer,
        sortable: true,
        filter: true,
      },
      {
        headerName: "Assertions",
        field: "assertionCount",
        width: 100,
        sortable: true,
        filter: true,
      },
      {
        headerName: "Summary",
        field: "assertions",
        flex: 2,
        cellRenderer: summaryTestCellRenderer,
        sortable: false,
        filter: true,
      },
    );
    return { columnDefs: columns };
  }, [
    enableSelection,
    selectionCellRenderer,
    testNameCellRenderer,
    statusCellRenderer,
    resultCellRenderer,
    summaryTestCellRenderer,
  ]);

  const testNames = testResultsData.map((test) => test.testName);
  const selectionSummary = enableSelection
    ? getTestSelectionSummary(testSelectionsState, testNames)
    : undefined;

  const handleReset = () => {
    if (onResetSelections) {
      onResetSelections();
      return;
    }
    setTestSelectionsState?.(
      defaultResetTestSelections(testResultsData, (test) => test.testResult !== "skipped"),
    );
  };

  if (!hasResults) {
    return null;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          padding: "8px",
          backgroundColor: "rgba(0,0,0,0.05)",
          borderRadius: "4px",
        }}
      >
        <h3 style={{ margin: "0", fontSize: "16px", fontWeight: "600" }}>{testLabel}:</h3>

        {enableSelection && selectionSummary && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "14px", color: "#666" }}>
              {selectionSummary.selectedTests}/{selectionSummary.totalTests} selected
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleSetAllTestsSelection(true, testNames)}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Select All
              </button>
              <button
                onClick={() => handleSetAllTestsSelection(false, testNames)}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Deselect All
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: "4px 8px",
                  fontSize: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "white",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ width: "100%" }}>
        <ValueObjectGrid
          valueObjects={testResultsDataWithSelection}
          mlSchema={testResultSchema}
          columnDefs={columnDefs}
          styles={{
            height: "400px",
            width: "100%",
          }}
          maxRows={50}
          sortByAttribute="testName"
          displayTools={false}
          gridType={gridType}
        />
      </div>
    </div>
  );
};
