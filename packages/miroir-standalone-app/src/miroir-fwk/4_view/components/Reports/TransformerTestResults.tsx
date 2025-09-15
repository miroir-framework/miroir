import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MiroirLoggerFactory, type JzodElement, type LoggerInterface } from 'miroir-core';
import { ValueObjectGrid } from '../Grids/ValueObjectGrid.js';
import { TestCellWithDetails } from './TestCellWithDetails.js';
import { TestResultCellWithActualValue } from './TestResultCellWithActualValue.js';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerTestResults")
).then((logger: LoggerInterface) => {log = logger});

// Test Selection Types
export type TestSuiteListFilter = string[] | {[x: string]: TestSuiteListFilter};

export type TestSelectionState = {
  [path: string]: boolean; // Full test path -> selected state
};

export type TestSelectionSummary = {
  totalTests: number;
  selectedTests: number;
  allSelected: boolean;
  noneSelected: boolean;
  partiallySelected: boolean;
};

export type ResolveConditionalSchemaResult = {
  testName: string;
  testResult: "ok" | "error" | "skipped";
  status: string;
  failedAssertions: string[] | undefined;
  assertionCount: number;
  assertions: string;
  fullAssertionsResults: any;
  selected: boolean;
};

export interface TransformerTestResultsProps {
  resolveConditionalSchemaResultsData: ResolveConditionalSchemaResult[];
  testLabel?: string;
  // onTestSelectionChange?: (testPath: string, selected: boolean) => void;
  // onSelectAllChange?: (selected: boolean) => void;
  // onResetSelections?: () => void;
  selectionSummary?: {
    totalTests: number;
    selectedTests: number;
    allSelected: boolean;
    noneSelected: boolean;
    partiallySelected: boolean;
  };
  testSelections?: { [testPath: string]: boolean }; // Add selection state
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
    selected: { type: "boolean" },
  },
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const TransformerTestResults: React.FC<TransformerTestResultsProps> = ({
  resolveConditionalSchemaResultsData,
  testLabel = "Test Results",
  // onTestSelectionChange,
  // onSelectAllChange,
  // onResetSelections,
  // selectionzSummary,
  // testSelections = {}
}) => {

  const [testSelections, setTestSelectionsState] = useState<TestSelectionState>({});
  
  // Don't render if no test results
  if (!resolveConditionalSchemaResultsData || resolveConditionalSchemaResultsData.length === 0) {
    return null;
  }





  // testSelections={reportContext.testSelections}
  // onTestSelectionChange={reportContext.setTestSelection}
  // onSelectAllChange={(selected) => reportContext.setAllTestsSelection(selected, resolveConditionalSchemaResultsData.map(test => test.testName))}
  // onResetSelections={() => reportContext.resetTestSelections(resolveConditionalSchemaResultsData, (testPath) => {
  //   // Don't select tests that were originally skipped
  //   const test = resolveConditionalSchemaResultsData.find(t => t.testName === testPath);
  //   return test ? test.testResult !== "skipped" : true;
  // })}

  // 
  // ##############################################################################################
  // CELLS
  const selectionCellRenderer = useCallback((params: any) => (
    <input
      type="checkbox"
      checked={params.value}
      onChange={(e) => {
        // if (onTestSelectionChange) {
        //   onTestSelectionChange(params.data.rawValue.testName, e.target.checked);
        // }
        handleSetTestSelection(params.data.rawValue.testName, e.target.checked);
      }}
      style={{ cursor: 'pointer' }}
    />
  // ), [onTestSelectionChange]);
  ), []);
  
  const testNameCellRenderer = useCallback((params: any) => {
    const testName = params.data.rawValue.testName;
    const isSelected = testSelections[testName] !== false; // Default to true if not specified
    
    return (
      <TestCellWithDetails
        value={params.value}
        testData={params.data.rawValue}
        testName={testName}
        type="testName"
        isSelected={isSelected} // Pass selection state
      />
    );
  }, [testSelections]);

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
        title={params.value}
      >
        {params.value}
      </div>
    );
  }, []);

  const columnDefs = useMemo(
    () => ({
      columnDefs:
      [
  
        {
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
        },
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
      ]
    }),
    [
      selectionCellRenderer,
      testNameCellRenderer,
      statusCellRenderer,
      resultCellRenderer,
      summaryTestCellRenderer,
    ]
  );

  // ##############################################################################################
  // SELECTION
    // Test Selection Handlers
  const handleSetTestSelection = useCallback((testPath: string, selected: boolean): void => {
    setTestSelectionsState(prev => ({
      ...prev,
      [testPath]: selected
    }));
  }, []);

  // ##############################################################################################
  const handleSetAllTestsSelection = useCallback((selected: boolean, testPaths?: string[]): void => {
    log.info(
      "handleSetAllTestsSelection: selected=",
      selected,
      ", resolveConditionalSchemaResultsData=",
      resolveConditionalSchemaResultsData,
      " testPaths=",
      JSON.stringify(testPaths)
    );
    setTestSelectionsState(prev => {
      const pathsToUpdate = testPaths || Object.keys(prev);
      const updates: TestSelectionState = {};
      pathsToUpdate.forEach(path => {
        updates[path] = selected;
      });
      return { ...prev, ...updates };
    });
  }, []);

  // ##############################################################################################
  const handleGetTestSelectionSummary = useCallback((testPaths?: string[]): TestSelectionSummary => {
    const pathsToCheck = testPaths || Object.keys(testSelections);
    const selectedPaths = pathsToCheck.filter(path => testSelections[path]);
    
    return {
      totalTests: pathsToCheck.length,
      selectedTests: selectedPaths.length,
      allSelected: pathsToCheck.length > 0 && selectedPaths.length === pathsToCheck.length,
      noneSelected: selectedPaths.length === 0,
      partiallySelected: selectedPaths.length > 0 && selectedPaths.length < pathsToCheck.length
    };
  }, [testSelections]);

  // ##############################################################################################
  const handleBuildTestFilter = useCallback((): TestSuiteListFilter | undefined => {
    const selectedPaths = Object.entries(testSelections)
      .filter(([_, selected]) => selected)
      .map(([path, _]) => path);
    
    log.info(`handleBuildTestFilter: testSelections=${JSON.stringify(testSelections)}, selectedPaths=${JSON.stringify(selectedPaths)}`);
    
    // Always return an array - empty array means no tests selected (all should be skipped)
    return selectedPaths;
  }, [testSelections]);

  // ##############################################################################################
  const handleInitializeTestSelections = useCallback((testResults: any[], defaultSelected?: (testPath: string) => boolean): void => {
    // Only initialize if no selections exist yet (don't overwrite existing selections)
    if (Object.keys(testSelections).length === 0) {
      const newSelections: TestSelectionState = {};
      
      testResults.forEach(test => {
        const isSelected = defaultSelected ? defaultSelected(test.testName) : true; // Default to selected
        newSelections[test.testName] = isSelected;
      });
      
      setTestSelectionsState(newSelections);
    }
  }, [testSelections]);

  // ##############################################################################################
  const handleResetTestSelections = useCallback((testResults: any[], defaultSelected?: (testPath: string) => boolean): void => {
    const newSelections: TestSelectionState = {};
    
    testResults.forEach(test => {
      const isSelected = defaultSelected ? defaultSelected(test.testName) : true; // Default to selected
      newSelections[test.testName] = isSelected;
    });
    
    setTestSelectionsState(newSelections);
  }, []);

      // Initialize test selections when test results are available
  useEffect(() => {
    if (resolveConditionalSchemaResultsData && resolveConditionalSchemaResultsData.length > 0) {
      // initializeTestSelections(resolveConditionalSchemaResultsData, (testPath: string) => {
      handleInitializeTestSelections(resolveConditionalSchemaResultsData, (testPath: string) => {
        // Don't select tests that were originally skipped
        const test = resolveConditionalSchemaResultsData.find(t => t.testName === testPath);
        return test ? test.testResult !== "skipped" : true;
      });
    }
  }, [resolveConditionalSchemaResultsData]);

  const onResetSelections = () =>
    handleResetTestSelections(resolveConditionalSchemaResultsData, (testPath) => {
      // Don't select tests that were originally skipped
      const test = resolveConditionalSchemaResultsData.find((t) => t.testName === testPath);
      return test ? test.testResult !== "skipped" : true;
    });


  const onSelectAllChange = (selected: any) =>
    handleSetAllTestsSelection(
      selected,
      resolveConditionalSchemaResultsData.map((test) => test.testName)
    );

  const selectionSummary=handleGetTestSelectionSummary(resolveConditionalSchemaResultsData.map(test => test.testName));

  return (
    <div>
      {/* Selection Controls */}
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

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {selectionSummary && (
            <span style={{ fontSize: "14px", color: "#666" }}>
              {selectionSummary.selectedTests}/{selectionSummary.totalTests} selected
            </span>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            {onSelectAllChange && (
              <button
                onClick={() => onSelectAllChange(true)}
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
            )}

            {onSelectAllChange && (
              <button
                onClick={() => onSelectAllChange(false)}
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
            )}

            {onResetSelections && (
              <button
                onClick={onResetSelections}
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
            )}
          </div>
        </div>
      </div>

      {/* Test Results Grid */}
      <div style={{ width: "100%" }}>
        <ValueObjectGrid
          valueObjects={resolveConditionalSchemaResultsData}
          jzodSchema={resolveConditionalSchemaResultSchema}
          columnDefs={columnDefs}
          // rowSelection="multiple"
          // maxHeight="600px"
          styles={{
            height: "400px",
            width: "100%",
          }}
          maxRows={50}
          sortByAttribute="testName"
          displayTools={false}
          gridType="ag-grid"
        />
      </div>
    </div>
  );
};