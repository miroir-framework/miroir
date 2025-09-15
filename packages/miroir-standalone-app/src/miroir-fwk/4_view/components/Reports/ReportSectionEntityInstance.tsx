import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ApplicationSection,
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  EntityInstance,
  InstanceAction,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Uuid,
  adminConfigurationDeploymentMiroir,
  entityTransformerTest,
  miroirFundamentalJzodSchema
} from "miroir-core";

import {
  useDomainControllerService,
  useMiroirContextService,
  useViewParams
} from "../../MiroirContextReactProvider.js";

import { Toc } from '@mui/icons-material';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import {
  useCurrentModel
} from "../../ReduxHooks.js";
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import { RenderPerformanceMetrics } from '../../tools/renderPerformanceMeasure.js';
import { RunTransformerTestSuiteButton } from '../Buttons/RunTransformerTestSuiteButton.js';
import { ValueObjectGrid } from '../Grids/ValueObjectGrid.js';
import {
  ThemedCodeBlock,
  // ThemedCodeBlock,
  ThemedContainer,
  ThemedHeaderSection,
  ThemedIconButton,
  ThemedLabel,
  ThemedPreformattedText,
  ThemedStatusText,
  ThemedSwitch,
  ThemedText,
  ThemedTitle,
  ThemedTooltip
} from "../Themes/index"
import { TestCellWithDetails } from './TestCellWithDetails.js';
import { TestResultCellWithActualValue } from './TestResultCellWithActualValue.js';
import { TypedValueObjectEditor } from './TypedValueObjectEditor.js';
import { useDocumentOutlineContext } from '../ValueObjectEditor/InstanceEditorOutlineContext.js';
import { useReportPageContext } from './ReportPageContext.js';
import type { FoldedStateTree } from './FoldedStateTreeUtils.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionEntityInstance")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
// ################################################################################################
// Safe stringify function that prevents "Invalid string length" errors
// ################################################################################################
function safeStringify(obj: any, maxLength: number = 2000): string {
  try {
    const str = JSON.stringify(obj, null, 2);
    if (str && str.length > maxLength) {
      return str.substring(0, maxLength) + "... [truncated]";
    }
    return str || "[unable to stringify]";
  } catch (error) {
    return `[stringify error: ${error instanceof Error ? error.message : 'unknown'}]`;
  }
}


// // Performance metrics display component
// const PerformanceMetricsDisplay = () => {
//   // Only render if we have performance metrics to display
//   if (Object.keys(performanceMetrics).length === 0) return null;

//   return (
//     <div style={{ 
//       fontSize: '0.8rem', 
//       color: '#333', 
//       position: 'absolute', 
//       right: '10px', 
//       top: '10px',
//       background: 'rgba(255,255,255,0.9)',
//       padding: '6px',
//       border: '1px solid #ddd',
//       borderRadius: '4px',
//       zIndex: 1000,
//       maxWidth: '300px',
//       boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//     }}>
//       <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', marginBottom: '4px', paddingBottom: '2px' }}>
//         Performance Metrics
//       </div>
//       {Object.entries(performanceMetrics).map(([funcName, metrics]: [string, any]) => (
//         <div key={funcName} style={{ marginTop: '4px', fontSize: '0.75rem' }}>
//           <div style={{ fontWeight: 'bold' }}>{funcName}:</div>
//           <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '0 8px' }}>
//             <span>Calls:</span><span>{metrics.callCount}</span>
//             <span>Total:</span><span>{metrics.totalTime.toFixed(1)}ms</span>
//             <span>Avg:</span><span>{(metrics.totalTime / metrics.callCount).toFixed(2)}ms</span>
//             <span>Min/Max:</span><span>{metrics.minDuration.toFixed(1)}ms / {metrics.maxDuration.toFixed(1)}ms</span>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// };

export interface ReportSectionEntityInstanceProps {
  instance?: EntityInstance,
  domainElement?: Record<string,any>,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  entityUuid: Uuid,
  // Note: Outline props removed since using context now
  showPerformanceDisplay?: boolean;
  zoomInPath?: string; // Optional path like "x.y.z" to zoom into a subset of the instance
  maxRenderDepth?: number; // Optional max depth for initial rendering, default 1
}

// ###############################################################################################################
export const ReportSectionEntityInstance = (props: ReportSectionEntityInstanceProps) => {
  const renderStartTime = performance.now();

  // const errorLog = useErrorLogService();
  const context = useMiroirContextService();
  const viewParams = useViewParams();
  const showPerformanceDisplay = context.showPerformanceDisplay;
  // const { currentTheme } = useMiroirTheme();

  const navigationKey = `${props.deploymentUuid}-${props.applicationSection}`;
  const { navigationCount, totalCount } = useRenderTracker(
    "ReportSectionEntityInstance",
    navigationKey
  );

  // Track performance immediately for initial render
  const componentKey = `ReportSectionEntityInstance-${props.instance?.uuid || props.entityUuid}`;

  // log.info(
  //   "++++++++++++++++++++++++++++++++ render",
  //   "navigationCount",
  //   navigationCount,
  //   "totalCount",
  //   totalCount,
  //   "with props",
  //   props
  // );

  const [displayAsStructuredElement, setDisplayAsStructuredElement] = useState(true);
  const [displayEditor, setDisplayEditor] = useState(true);
  // const [maxRenderDepth, setMaxRenderDepth] = useState<number>(props.maxRenderDepth ?? 1);
  const [resolveConditionalSchemaResultsData, setResolveConditionalSchemaResultsData] = useState<
    any[]
  >([]); // TODO: use a precise type!

  // Use outline context for outline state management
  const outlineContext = useDocumentOutlineContext();
  const reportContext = useReportPageContext();
  const isOutlineOpen = outlineContext.isOutlineOpen;
  const handleToggleOutline = outlineContext.onToggleOutline;

  // Removed redundant availableWidth calculation - parent components handle sizing
  // Just use 100% width since RootComponent's ThemedMain handles sidebar/outline spacing

  const instance: any = props.instance;

  const currentModel: MetaModel = useCurrentModel(
    context.applicationSection == "data"
      ? context.deploymentUuid
      : adminConfigurationDeploymentMiroir.uuid
  );

  const domainController: DomainControllerInterface = useDomainControllerService();

  const currentReportDeploymentSectionEntities: Entity[] = currentModel.entities; // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] =
    currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section

  const currentReportTargetEntity: Entity | undefined =
    currentReportDeploymentSectionEntities?.find((e) => e?.uuid === props.entityUuid);

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find(
      (e) => e?.entityUuid === currentReportTargetEntity?.uuid
    );

  log.info(
    "ReportSectionEntityInstance: currentReportTargetEntityDefinition:",
    currentReportTargetEntityDefinition,
    "miroirFundamentalJzodSchema",
    miroirFundamentalJzodSchema
  );

  useEffect(() => {
    const foldedStringPaths = currentReportTargetEntityDefinition?.display?.foldSubLevels
    ? Object.entries(currentReportTargetEntityDefinition?.display?.foldSubLevels).filter(([key, value]) => value): [];
    
    // log.info("Setting initial folded paths foldedStringPaths:", foldedStringPaths);
    const foldedPaths = foldedStringPaths.map(([key, value]) => key.split("#"));
    // log.info("Setting initial folded paths foldedPaths:", foldedPaths);
    const newFoldedObjectAttributeOrArrayItems: FoldedStateTree = {};
    foldedPaths.forEach((pathArr) => {
      let node = newFoldedObjectAttributeOrArrayItems;
      pathArr.forEach((segment, idx) => {
        if (idx === pathArr.length - 1) {
          (node as any)[segment] = "folded";
        } else {
          if (!node[segment] || typeof node[segment] !== "object") {
            node[segment] = {};
          }
          node = node[segment];
        }
      });
    });
    log.info("Setting initial folded paths newFoldedObjectAttributeOrArrayItems:", newFoldedObjectAttributeOrArrayItems);

    reportContext.setFoldedObjectAttributeOrArrayItems(
      newFoldedObjectAttributeOrArrayItems
  );
  }, [currentReportTargetEntityDefinition?.display?.foldSubLevels, reportContext.setFoldedObjectAttributeOrArrayItems]);

  const formLabel: string =
    props.applicationSection +
    "." +
    currentReportTargetEntity?.name +
    (props.zoomInPath ? ` (${props.zoomInPath})` : "");

  // Update the outline title when the current entity changes
  useEffect(() => {
    if (currentReportTargetEntity?.name) {
      outlineContext.setOutlineTitle(currentReportTargetEntity.name + " details");
      outlineContext.setReportInstance(instance);
    }
  }, [currentReportTargetEntity?.name, outlineContext.setOutlineTitle]);

  const labelElement = useMemo(() => {
    return formLabel ? <ThemedLabel id={"label." + formLabel}>{formLabel}</ThemedLabel> : undefined;
  }, [formLabel]);

  // const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  // log performance metrics at the end of render (conditional)
  if (context.showPerformanceDisplay) {
    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - renderStartTime;
    RenderPerformanceMetrics.trackRenderPerformance(componentKey, renderDuration);
  }

  // ##############################################################################################
  const handleDisplayEditorSwitchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayEditor(event.target.checked);
    },
    [setDisplayEditor]
  );

  // ##############################################################################################
  const onEditValueObjectFormSubmit = useCallback(
    async (data: any) => {
      // const newEntity:EntityInstance = Object.assign({...data as EntityInstance},{attributes:dialogFormObject?dialogFormObject['attributes']:[]});
      log.info("onEditValueObjectFormSubmit called with new object value", data);

      if (props.deploymentUuid) {
        if (props.applicationSection == "model") {
          await domainController.handleAction(
            {
              actionType: "transactionalInstanceAction",
              instanceAction: {
                actionType: "updateInstance",
                deploymentUuid: props.deploymentUuid,
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                payload: {
                  applicationSection: "model",
                  objects: [
                    {
                      parentName: data.name,
                      parentUuid: data.parentUuid,
                      applicationSection: props.applicationSection,
                      instances: [data],
                    },
                  ],
                },
              },
            },
            currentModel
          );
        } else {
          const updateAction: InstanceAction = {
            actionType: "updateInstance",
            deploymentUuid: props.deploymentUuid,
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              applicationSection: props.applicationSection ? props.applicationSection : "data",
              objects: [
                {
                  parentName: data.name,
                  parentUuid: data.parentUuid,
                  applicationSection: props.applicationSection ? props.applicationSection : "data",
                  instances: [data],
                },
              ],
            },
          };
          await domainController.handleAction(updateAction);
        }
      } else {
        throw new Error("onEditValueObjectFormSubmit props.deploymentUuid is undefined.");
      }
    },
    [domainController, props]
  );

  // ##############################################################################################
  // Check if this is a TransformerTest entity instance
  const isTransformerTestEntity = currentReportTargetEntity?.uuid === entityTransformerTest.uuid;
  const isTransformerTest =
    isTransformerTestEntity && instance?.parentUuid === entityTransformerTest.uuid;

  // Log for debugging
  // log.info(
  //   "ReportSectionEntityInstance - TransformerTest detection:",
  //   "currentReportTargetEntity",
  //   currentReportTargetEntity,
  //   "entityUuid",
  //   currentReportTargetEntity?.uuid,
  //   "entityTransformerTest",
  //   entityTransformerTest,
  //   "instance",
  //   instance,
  //   "isTransformerTest",
  //   isTransformerTest
  //   //   {
  //   //   transformerTestEntityUuid: entityTransformerTest.uuid,
  //   //   isTransformerTestEntity,
  //   //   instanceTransformerTestType: instance?.transformerTestType,
  //   //   instanceName: instance?.name,
  //   //   transformerTestLabel: instance?.transformerTestLabel
  //   // }
  // );

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

  const testLabel = instance.transformerTestLabel || instance.name || "TransformerTest"
  // ##############################################################################################
  if (instance) {
    return (
      // <ThemedContainer style={{ width: '100%' }}>
      <ThemedContainer>
          {showPerformanceDisplay && (
            <ThemedText>
              ReportSectionEntityInstance renders: {navigationCount} (total: {totalCount})
            </ThemedText>
          )}

          {/* Show test button if this is a TransformerTest entity */}
          {isTransformerTest && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                backgroundColor: "#e8f4fd",
                borderRadius: "8px",
                border: "1px solid #b3d9ff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div style={{ marginBottom: "8px", fontWeight: "bold", color: "#1976d2" }}>
                🧪 Transformer Test Available
              </div>
              <RunTransformerTestSuiteButton
                transformerTestSuite={instance}
                testSuiteKey={testLabel}
                useSnackBar={true}
                onTestComplete={(testSuiteKey, structuredResults) => {
                  setResolveConditionalSchemaResultsData(structuredResults);
                  log.info(`Test completed for ${testSuiteKey}:`, structuredResults);
                }}
                label={`▶️ Run ${testLabel}`}
                style={{
                  backgroundColor: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontWeight: "bold",
                }}
              />
              {/* Test Results Display */}
              {resolveConditionalSchemaResultsData &&
                resolveConditionalSchemaResultsData.length > 0 && (
                  <div style={{ margin: "20px 0", width: "100%" }}>
                    {/* Test Execution Summary */}
                    {(() => {
                      // Calculate test statistics
                      const totalTests = resolveConditionalSchemaResultsData.length;
                      let passedTests = 0;
                      let failedTests = 0;
                      let skippedTests = 0;
                      let totalAssertions = 0;
                      let passedAssertions = 0;
                      let failedAssertions = 0;
                      let skippedAssertions = 0;

                      console.log("UI TEST EXECUTION SUMMARY - Debug data:", resolveConditionalSchemaResultsData);

                      resolveConditionalSchemaResultsData.forEach((testData: any, index: number) => {
                        console.log(`Test ${index}:`, {
                          testName: testData.testName,
                          testResult: testData.testResult,
                          status: testData.status,
                          assertionCount: testData.assertionCount,
                          fullAssertionsResults: testData.fullAssertionsResults
                        });

                        // For transformer tests, there's implicitly 1 assertion per test
                        const assertionCount = testData.assertionCount || 1;
                        totalAssertions += assertionCount;
                        
                        // First check if assertions indicate skipped status
                        let hasSkippedAssertion = false;
                        let hasFailedAssertion = false;
                        let hasPassedAssertion = false;

                        if (testData.fullAssertionsResults) {
                          Object.values(testData.fullAssertionsResults).forEach((assertion: any) => {
                            if (assertion.assertionResult === "skipped") {
                              hasSkippedAssertion = true;
                              skippedAssertions++;
                            } else if (assertion.assertionResult === "error") {
                              hasFailedAssertion = true;
                              failedAssertions++;
                            } else if (assertion.assertionResult === "ok") {
                              hasPassedAssertion = true;
                              passedAssertions++;
                            }
                          });
                        }
                        
                        // Count test status - prioritize assertion results over test result/status
                        // For transformer tests, if there's a skipped assertion, the test should be skipped
                        if (hasSkippedAssertion && !hasFailedAssertion && !hasPassedAssertion) {
                          skippedTests++;
                        } else if (testData.testResult === "skipped" || testData.status === "skipped") {
                          skippedTests++;
                          // If no assertions recorded but test is skipped, count the implicit assertion as skipped
                          if (!testData.fullAssertionsResults || Object.keys(testData.fullAssertionsResults).length === 0) {
                            skippedAssertions++;
                          }
                        } else if (hasFailedAssertion || testData.testResult === "error" || testData.status === "error" || (testData.failedAssertions && testData.failedAssertions.length > 0)) {
                          failedTests++;
                          // If no failed assertions recorded but test failed, count the implicit assertion as failed
                          if (!hasFailedAssertion && (!testData.fullAssertionsResults || Object.keys(testData.fullAssertionsResults).length === 0)) {
                            failedAssertions++;
                          }
                        } else {
                          passedTests++;
                          // If no passed assertions recorded but test passed, count the implicit assertion as passed
                          if (!hasPassedAssertion && (!testData.fullAssertionsResults || Object.keys(testData.fullAssertionsResults).length === 0)) {
                            passedAssertions++;
                          }
                        }
                      });

                      console.log("UI TEST EXECUTION SUMMARY - Calculated stats:", {
                        totalTests, passedTests, failedTests, skippedTests,
                        totalAssertions, passedAssertions, failedAssertions, skippedAssertions
                      });

                      return (
                        <div style={{ 
                          margin: "10px 0 20px 0", 
                          padding: "15px", 
                          backgroundColor: "#f5f5f5", 
                          border: "1px solid #ddd", 
                          borderRadius: "6px",
                          fontFamily: "monospace"
                        }}>
                          <h4 style={{ 
                            margin: "0 0 10px 0", 
                            color: "#333",
                            fontSize: "14px",
                            fontWeight: "bold",
                            textAlign: "center"
                          }}>
                            TEST EXECUTION SUMMARY
                          </h4>
                          
                          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "15px" }}>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontWeight: "bold", color: "#333", fontSize: "12px" }}>Tests</div>
                              <div style={{ fontSize: "11px" }}>
                                <span style={{ color: "#4caf50" }}>✓ Passed: {passedTests}/{totalTests}</span>
                                {failedTests > 0 && (
                                  <>
                                    <br />
                                    <span style={{ color: "#f44336" }}>✗ Failed: {failedTests}/{totalTests}</span>
                                  </>
                                )}
                                {skippedTests > 0 && (
                                  <>
                                    <br />
                                    <span style={{ color: "#999", opacity: 0.8 }}>⏭ Skipped: {skippedTests}/{totalTests}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontWeight: "bold", color: "#333", fontSize: "12px" }}>Assertions</div>
                              <div style={{ fontSize: "11px" }}>
                                <span style={{ color: "#4caf50" }}>✓ Passed: {passedAssertions}/{totalAssertions}</span>
                                {failedAssertions > 0 && (
                                  <>
                                    <br />
                                    <span style={{ color: "#f44336" }}>✗ Failed: {failedAssertions}/{totalAssertions}</span>
                                  </>
                                )}
                                {skippedAssertions > 0 && (
                                  <>
                                    <br />
                                    <span style={{ color: "#999", opacity: 0.8 }}>⏭ Skipped: {skippedAssertions}/{totalAssertions}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontWeight: "bold", color: "#333", fontSize: "12px" }}>Overall Status</div>
                              <div style={{ fontSize: "11px", fontWeight: "bold" }}>
                                {failedTests > 0 || failedAssertions > 0 ? (
                                  <span style={{ color: "#f44336" }}>FAILED</span>
                                ) : (
                                  <span style={{ color: "#4caf50" }}>PASSED</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <h3>{testLabel} Test Results:</h3>
                    <ValueObjectGrid
                      valueObjects={resolveConditionalSchemaResultsData}
                      jzodSchema={{
                        type: "object",
                        definition: {
                          testName: { type: "string" },
                          testResult: { type: "string" },
                          status: { type: "string" },
                          assertionCount: { type: "number" },
                          assertions: { type: "string" },
                          failedAssertions: { 
                            type: "array",
                            definition: { type: "string" }
                          },
                          fullAssertionsResults: {
                            type: "object",
                            definition: {},
                          },
                        },
                      }}
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
                  </div>
                )}
            </div>
          )}

          <div>
            <label htmlFor="displayEditorSwitch">Display editor:</label>
            <ThemedSwitch
              checked={displayEditor}
              id="displayEditorSwitch"
              onChange={handleDisplayEditorSwitchChange}
            />
          </div>
          <div>
            <ThemedStatusText>
              displayAsStructuredElement: {displayAsStructuredElement ? "true" : "false"}{" "}
              displayEditor: {displayEditor ? "true" : "false"} hasTypeError:{" "}
              {/* {typeError ? "true" : "false"}{" "} */}
            </ThemedStatusText>
          </div>
          <ThemedHeaderSection>
            <ThemedTitle>
              {currentReportTargetEntity?.name} details: {instance.name}{" "}
              {props.zoomInPath && (
                <span style={{ fontSize: "0.8em", fontStyle: "italic", color: "#666" }}>
                  (viewing: {props.zoomInPath})
                </span>
              )}
            </ThemedTitle>
            {displayEditor && (
              <ThemedTooltip
                title={isOutlineOpen ? "Hide Document Outline" : "Show Document Outline"}
              >
                <ThemedIconButton
                  onClick={handleToggleOutline}
                  style={{
                    marginLeft: "16px",
                  }}
                >
                  <Toc />
                </ThemedIconButton>
              </ThemedTooltip>
            )}
          </ThemedHeaderSection>
          {currentReportTargetEntityDefinition && context.applicationSection ? (
            displayEditor ? (
              <TypedValueObjectEditor
                labelElement={labelElement}
                valueObject={instance}
                valueObjectMMLSchema={currentReportTargetEntityDefinition.jzodSchema}
                deploymentUuid={props.deploymentUuid}
                applicationSection={props.applicationSection}
                //
                formLabel={formLabel}
                onSubmit={onEditValueObjectFormSubmit}
                zoomInPath={props.zoomInPath}
                maxRenderDepth={Infinity} // Always render fully for editor
              />
            ) : (
              <div>
                {displayAsStructuredElement ? (
                  <div>Can not display non-editor as structured element</div>
                ) : (
                  <div>
                    {props.zoomInPath && (
                      <div
                        style={{
                          marginBottom: "8px",
                          fontSize: "0.9em",
                          color: "#666",
                          fontStyle: "italic",
                        }}
                      >
                        Viewing path: {props.zoomInPath}
                      </div>
                    )}
                    <ThemedCodeBlock>
                      {safeStringify(
                        props.zoomInPath
                          ? (() => {
                              const pathParts = props.zoomInPath.split(".");
                              let current = instance;
                              for (const part of pathParts) {
                                if (current && typeof current === "object") {
                                  current = current[part];
                                } else {
                                  return `Path "${props.zoomInPath}" not found`;
                                }
                              }
                              return current;
                            })()
                          : instance
                      )}
                    </ThemedCodeBlock>
                  </div>
                )}
              </div>
            )
          ) : (
            <div>
              Oops, ReportSectionEntityInstance could not be displayed.
              <p />
              <div>props selfApplication section: {props.applicationSection}</div>
              <div>context selfApplication section: {context.applicationSection}</div>
              <div>
                target entity:{" "}
                {currentReportTargetEntity?.name ?? "report target entity not found!"}
              </div>
              {props.zoomInPath && <div>zoom path: {props.zoomInPath}</div>}
              {/* <div>resolved schema: {JSON.stringify(resolvedJzodSchema)}</div> */}
              <ThemedPreformattedText>
                target entity definition:{" "}
                {currentReportTargetEntityDefinition?.name ??
                  "report target entity definition not found!"}
              </ThemedPreformattedText>
              <div> ######################################## </div>
              <ThemedPreformattedText>
                entity jzod schema: {safeStringify(instance?.jzodSchema)}
              </ThemedPreformattedText>
            </div>
          )}
        {/* </div> */}
        {/* <PerformanceMetricsDisplay /> */}
      </ThemedContainer>
    );
  } else {
    return <>ReportSectionEntityInstance: No instance to display!</>;
  }
};

