import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MiroirLoggerFactory, resolvePathOnObject, transformerTestDefinition, type JzodElement, type LoggerInterface, type TestSuiteListFilter, type TransformerReturnType, type TransformerTest, type TransformerTestDefinition, type TransformerTestSuite, type ViewParams } from 'miroir-core';
import { ValueObjectGrid } from '../Grids/ValueObjectGrid.js';
import { TestCellWithDetails } from './TestCellWithDetails.js';
import { TestResultCellWithActualValue } from './TestResultCellWithActualValue.js';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import type { TransformerTestResultData } from '../Buttons/RunTransformerTestSuiteButton.js';
import type { TestSelectionState } from './TransformerTestDisplay.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerTestResults"), "UI",
).then((logger: LoggerInterface) => {log = logger});


export type TestSelectionSummary = {
  totalTests: number;
  selectedTests: number;
  allSelected: boolean;
  noneSelected: boolean;
  partiallySelected: boolean;
};

export type TestResultDataAndSelect = TransformerTestResultData & {
  // testName: string;
  // testPath: string[];
  // testResult: "ok" | "error" | "skipped";
  // status: string;
  // failedAssertions: string[] | undefined;
  // assertionCount: number;
  // assertions: string;
  // fullAssertionsResults: any;
  selected: boolean;
};

export interface TransformerTestResultsProps {
  // transformerTestSuite: TransformerTestDefinition | undefined;
  transformerTestSuite: TransformerTestSuite | TransformerTest | undefined;
  transformerTestResultsData: TestResultDataAndSelect[];
  testLabel?: string;
  gridType: ViewParams["gridType"];
  // onTestFilterChange?: (filter: { testList?: TestSuiteListFilter } | undefined) => void;
  // onTestSelectionChange?: (testPath: string, selected: boolean) => void;
  // onSelectAllChange?: (selected: boolean) => void;
  // onResetSelections?: () => void;
  testSelectionsState: TestSelectionState | undefined;
  setTestSelectionsState: React.Dispatch<React.SetStateAction<TestSelectionState | undefined>>;
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

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const TransformerTestResults: React.FC<TransformerTestResultsProps> = ({
  transformerTestSuite,
  transformerTestResultsData,
  testLabel = "Test Results",
  // onTestFilterChange,
  testSelectionsState,
  setTestSelectionsState,
  gridType,
  // onTestSelectionChange,
  // onSelectAllChange,
  // onResetSelections,
  // selectionzSummary,
  // testSelections = {}
}) => {

  // Don't render if no test results
  if (!transformerTestResultsData || transformerTestResultsData.length === 0) {
    return null;
  }



  const transformerTestResultsDataWithSelection = useMemo(() => {
    return transformerTestResultsData.map(test => ({
      ...test,
      selected: !testSelectionsState || testSelectionsState[test.testName] !== false // Default to true if not specified
    }));
  }, [transformerTestResultsData, testSelectionsState]);

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
    const isSelected = !testSelectionsState || testSelectionsState[testName] !== false; // Default to true if not specified
    
    return (
      <TestCellWithDetails
        value={params.value}
        testData={params.data.rawValue}
        testName={testName}
        type="testName"
        isSelected={isSelected} // Pass selection state
      />
    );
  }, [testSelectionsState]);

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
          // overflow: "hidden",
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
        // {
        //   headerName: "Test Path",
        //   field: "testPath",
        //   flex: 2,
        //   cellRenderer: testNameCellRenderer,
        //   // cellRenderer: (params: any) => {
        //   //   const testPath = params.data.rawValue.testPath;
        //   //   if (testPath && Array.isArray(testPath)) {
        //   //     const pathString = testPath.join(" > ");
        //   //     return (
        //   //       <div
        //   //         style={{
        //   //           maxWidth: "300px",
        //   //           overflow: "hidden",
        //   //           textOverflow: "ellipsis",
        //   //           whiteSpace: "nowrap",
        //   //           cursor: "pointer",
        //   //           fontFamily: "monospace",
        //   //           fontSize: "0.9em",
        //   //           color: "#666",
        //   //         }}
        //   //         title={pathString}
        //   //       >
        //   //         {pathString}
        //   //       </div>
        //   //     );
        //   //   }
        //   //   return <span>-</span>;
        //   // },
        //   sortable: true,
        //   filter: true,
        // },
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
    setTestSelectionsState((prev:any) => ({
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
      transformerTestResultsData,
      " testPaths=",
      testPaths,
      "testSelectionsState=", testSelectionsState
    );
    setTestSelectionsState((prev:any) => {
      const pathsToUpdate = testPaths || Object.keys(prev??{});
      const updates: TestSelectionState = {};
      pathsToUpdate.forEach(path => {
        updates[path] = selected;
      });
      return { ...prev, ...updates };
    });
    // if (onTestFilterChange) {onTestFilterChange(handleBuildTestFilter());}

  }, []);

  // ##############################################################################################
  const handleGetTestSelectionSummary = useCallback((testPaths?: string[]): TestSelectionSummary => {
    const pathsToCheck = testPaths || Object.keys(testSelectionsState??{});
    const selectedPaths = pathsToCheck.filter(path => !testSelectionsState || testSelectionsState[path]);
    
    return {
      totalTests: pathsToCheck.length,
      selectedTests: selectedPaths.length,
      allSelected: pathsToCheck.length > 0 && selectedPaths.length === pathsToCheck.length,
      noneSelected: selectedPaths.length === 0,
      partiallySelected: selectedPaths.length > 0 && selectedPaths.length < pathsToCheck.length
    };
  }, [testSelectionsState]);


  // ##############################################################################################
  const handleInitializeTestSelections = useCallback((testResults: any[], defaultSelected?: (testPath: string) => boolean): void => {
    // Only initialize if no selections exist yet (don't overwrite existing selections)
    if (Object.keys(testSelectionsState??{}).length === 0) {
      const newSelections: TestSelectionState = {};
      
      testResults.forEach(test => {
        const isSelected = defaultSelected ? defaultSelected(test.testName) : true; // Default to selected
        newSelections[test.testName] = isSelected;
      });
      
      setTestSelectionsState(newSelections);
      // if (onTestFilterChange) {onTestFilterChange(handleBuildTestFilter());}
    }
  }, [testSelectionsState]);

  // ##############################################################################################
  const resolveTestPath = useCallback(
    (
      transformerTestSuite: TransformerTestSuite | TransformerTest | undefined,
      transformerTestPath: string[],
    ): TransformerTestSuite | TransformerTest | undefined => {
      if (transformerTestPath.length === 0
        || !transformerTestSuite
      ) {
        return undefined;
      }
      if (transformerTestPath.length === 1) {
        if (
          // transformerTest.transformerTestType === "transformerTest" &&
          transformerTestSuite.transformerTestLabel === transformerTestPath[0]
        ) {
          return transformerTestSuite;
        }
      }
      const [currentSegment, nextSegment, ...restPath] = transformerTestPath;
      if (
        transformerTestSuite.transformerTestType === "transformerTestSuite" &&
        transformerTestSuite.transformerTestLabel &&
        transformerTestSuite.transformerTestLabel === currentSegment
      ) {
        const nextTest = transformerTestSuite.transformerTests.find(
          (test) => test.transformerTestLabel === nextSegment
        );
        // log.info(
        //   "resolveTestPath: currentSegment=",
        //   currentSegment,
        //   " nextSegment=",
        //   nextSegment,
        //   " nextTest=",
        //   nextTest,
        //   "restPath.lenth=", restPath.length
        // );
        if (nextTest && restPath.length > 0) {
          return resolveTestPath(nextTest, restPath);
        } else {
          return nextTest;
        }
      }
      return undefined; 
    },
    []
  );
  // ##############################################################################################
  const handleResetTestSelections = useCallback(
    (testResults: TestResultDataAndSelect[], defaultSelected?: (testPath: string) => boolean): void => {
      log.info(
        "handleResetTestSelections: testResults=",
        testResults,
        // " defaultSelected=",
        // defaultSelected,
        "transformerTestSuite=",
        transformerTestSuite
      );
      const newSelections: TestSelectionState = {};

      testResults.forEach((test) => {
        const currentTest = resolveTestPath(
          transformerTestSuite,
          test.testPath
        ) as TransformerTest | TransformerTestSuite | undefined;
        // const isSelected = !currentTest?.skip && (defaultSelected ? defaultSelected(test.testName) : true); // Default to selected
        const isSelected = !currentTest?.skip; // select if not skipped
        log.info("handleResetTestSelections: test=", test.testPath, " currentTest=", currentTest, " isSelected=", isSelected);
        newSelections[test.testName] = isSelected;
      });

      setTestSelectionsState(newSelections);
      // if (onTestFilterChange) {onTestFilterChange(handleBuildTestFilter());}
    },
    [transformerTestSuite]
  );

      // Initialize test selections when test results are available
  // useEffect(() => {
  //   if (resolveConditionalSchemaResultsData && resolveConditionalSchemaResultsData.length > 0) {
  //     // initializeTestSelections(resolveConditionalSchemaResultsData, (testPath: string) => {
  //     handleInitializeTestSelections(resolveConditionalSchemaResultsData, (testPath: string) => {
  //       // Don't select tests that were originally skipped
  //       const test = resolveConditionalSchemaResultsData.find(t => t.testName === testPath);
  //       return test ? test.testResult !== "skipped" : true;
  //     });
  //   }
  // }, [resolveConditionalSchemaResultsData]);

  // // Call onTestFilterChange when test selections change
  // useEffect(() => {
  //   if (onTestFilterChange && Object.keys(testSelectionsState).length > 0) {
  //     // const currentFilter = handleBuildTestFilter();
  //     onTestFilterChange(handleBuildTestFilter());
  //   }
  // }, [testSelectionsState, onTestFilterChange, handleBuildTestFilter]);

  const onResetSelections = () =>
    handleResetTestSelections(transformerTestResultsData, (testPath) => {
      // Don't select tests that were originally skipped
      const test = transformerTestResultsData.find((t) => t.testName === testPath);
      return test ? test.testResult !== "skipped" : true;
    });


  const onSelectAllChange = (selected: any) =>
    handleSetAllTestsSelection(
      selected,
      transformerTestResultsData.map((test) => test.testName)
    );

  const selectionSummary=handleGetTestSelectionSummary(transformerTestResultsData.map(test => test.testName));

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
            
            {/* <button
              onClick={() => {
                const filter = handleBuildTestFilter();
                console.log("Current Test Filter:", filter);
                alert(`Filter: ${JSON.stringify(filter, null, 2)}`);
              }}
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#e3f2fd",
                cursor: "pointer",
              }}
            >
              Show Filter
            </button> */}
          </div>
        </div>
      </div>

      {/* Test Results Grid */}
      <div style={{ width: "100%" }}>
        <ValueObjectGrid
          valueObjects={transformerTestResultsDataWithSelection}
          jzodSchema={resolveConditionalSchemaResultSchema}
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