import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  entityTransformerTest
} from "miroir-core";

import {
  useDomainControllerService,
  useMiroirContextService
} from "../../MiroirContextReactProvider.js";

import { javascript } from '@codemirror/lang-javascript';
import { Toc } from '@mui/icons-material';
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import {
  useCurrentModel
} from "../../ReduxHooks.js";
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import { RenderPerformanceMetrics } from '../../tools/renderPerformanceMeasure.js';
import { useDocumentOutlineContext } from '../Page/RootComponent.js';
import {
  ThemedCodeBlock,
  ThemedContainer,
  ThemedHeaderSection,
  ThemedIconButton,
  ThemedLabel,
  ThemedPreformattedText,
  ThemedStatusText,
  ThemedSwitch,
  ThemedText,
  ThemedTitle,
  ThemedTooltip,
  ThemedPaper,
  ThemedBox,
  ThemedStyledButton
} from "../Themes/ThemedComponents.js";
import { useMiroirTheme } from "../../contexts/MiroirThemeContext.js";
import { TypedValueObjectEditor } from './TypedValueObjectEditor.js';
import { RunTransformerTestSuiteButton } from '../Buttons/RunTransformerTestSuiteButton.js';
import { ValueObjectGrid } from '../Grids/ValueObjectGrid.js';
// import { GlobalRenderPerformanceDisplay, RenderPerformanceDisplay, trackRenderPerformance } from '../tools/renderPerformanceMeasure.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionEntityInstance")
).then((logger: LoggerInterface) => {log = logger});

// Safe stringify function that prevents "Invalid string length" errors
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

// ################################################################################################
// ################################################################################################
// Test Cell Components with Hover functionality
// ################################################################################################
interface TestCellWithDetailsProps {
  value: string;
  testData: any;
  testName: string;
  type: 'testName' | 'status' | 'result';
}

const TestCellWithDetails: React.FC<TestCellWithDetailsProps> = ({ value, testData, testName, type }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const cellRef = useRef<HTMLDivElement>(null);
  const { currentTheme } = useMiroirTheme();
  
  const formatDetailedTooltipContent = () => {
    if (!testData.fullAssertionsResults) return "No detailed assertion data available";
    
    const assertions = Object.entries(testData.fullAssertionsResults);
    if (assertions.length === 0) return "No assertions found";
    
    // Header with test info
    let content = `Test: ${testName}\n`;
    content += `Result: ${testData.testResult} ${testData.status}\n`;
    content += `Assertions: ${testData.assertionCount}\n`;
    content += `─`.repeat(40) + '\n\n';
    
    // Helper function for formatting values in tooltips
    const formatTooltipValue = (value: any): string => {
      if (value === null) return "null";
      if (value === undefined) return "undefined";
      if (typeof value === "string") return `"${value}"`;
      if (typeof value === "number" || typeof value === "boolean") return String(value);
      if (typeof value === "bigint") return `${value}n`;
      try {
        return JSON.stringify(value, null, 2);
      } catch (error) {
        return `[${typeof value}: unable to serialize]`;
      }
    };
    
    // Format all assertions with full details
    const assertionDetails = assertions.map(([assertionName, assertion]: [string, any]) => {
      const result = assertion.assertionResult === "ok" ? "✅ PASS" : "❌ FAIL";
      let details = `${assertionName}: ${result}`;
      
      if (assertion.assertionResult !== "ok") {
        details += `\n  Expected: ${formatTooltipValue(assertion.assertionExpectedValue)}`;
        details += `\n  Actual: ${formatTooltipValue(assertion.assertionActualValue)}`;
      }
      
      return details;
    }).join('\n\n');
    
    content += assertionDetails;
    
    if (!isExpanded) {
      content += '\n\n💡 Click for expanded view with copy functionality';
    }
    
    return content;
  };

  // Calculate tooltip position when showing
  const updateTooltipPosition = () => {
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setTooltipPosition({
        x: rect.left + scrollLeft + rect.width / 2,
        y: rect.top + scrollTop - 10, // 10px above the cell
      });
    }
  };

  const handleMouseEnter = () => {
    updateTooltipPosition();
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const cellStyle: React.CSSProperties = {
    cursor: 'pointer',
    padding: currentTheme.spacing.sm,
    borderRadius: currentTheme.borderRadius.sm,
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    display: 'inline-block',
    backgroundColor: showTooltip 
      ? currentTheme.colors.primary + '20' 
      : isExpanded 
        ? currentTheme.colors.warning + '20' 
        : 'transparent',
    border: isExpanded 
      ? `2px solid ${currentTheme.colors.warning}` 
      : `1px solid transparent`,
    boxShadow: isExpanded ? currentTheme.elevation.medium : 'none',
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${tooltipPosition.x}px`,
    top: `${tooltipPosition.y}px`,
    transform: 'translateX(-50%) translateY(-100%)',
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    padding: currentTheme.spacing.md,
    borderRadius: currentTheme.borderRadius.md,
    fontSize: '11px',
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    whiteSpace: 'pre-wrap',
    zIndex: 10000,
    minWidth: '400px',
    maxWidth: '800px',
    width: 'auto',
    height: 'auto',
    maxHeight: '70vh',
    overflow: 'auto',
    boxShadow: currentTheme.elevation.high,
    pointerEvents: isExpanded ? 'auto' : 'none',
    opacity: showTooltip ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    lineHeight: '1.5',
    border: `1px solid ${currentTheme.colors.primary}`,
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(formatDetailedTooltipContent());
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    setShowTooltip(false); // Hide tooltip when expanding
  };

  const handleCloseExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  // Create tooltip portal
  const tooltipPortal = showTooltip && !isExpanded ? createPortal(
    <div style={tooltipStyle}>
      {formatDetailedTooltipContent()}
    </div>,
    document.body
  ) : null;

  // Create modal portal
  const modalPortal = isExpanded ? createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onClick={handleCloseExpanded}
    >
      <ThemedPaper
        elevation={3}
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          minWidth: '600px',
          minHeight: '400px',
          overflow: 'auto',
          margin: currentTheme.spacing.lg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ThemedBox 
          padding={currentTheme.spacing.lg}
          style={{ position: 'relative' }}
        >
          <ThemedStyledButton
            style={{
              position: 'absolute',
              top: '8px',
              right: '40px',
              backgroundColor: currentTheme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: currentTheme.borderRadius.sm,
              padding: '4px 8px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            onClick={handleCopyToClipboard}
          >
            📋 Copy
          </ThemedStyledButton>
          
          <ThemedStyledButton
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: currentTheme.colors.textSecondary,
            }}
            onClick={() => setIsExpanded(false)}
            ariaLabel="Close"
          >
            ×
          </ThemedStyledButton>
          
          <ThemedTitle style={{ marginTop: 0, marginBottom: currentTheme.spacing.md }}>
            Test Details: {testName}
          </ThemedTitle>
          
          <ThemedCodeBlock
            style={{
              backgroundColor: currentTheme.colors.background,
              padding: currentTheme.spacing.md,
              borderRadius: currentTheme.borderRadius.md,
              whiteSpace: 'pre-wrap',
              fontSize: '12px',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              overflow: 'auto',
              border: `1px solid ${currentTheme.colors.border}`,
              lineHeight: '1.5',
              margin: 0,
              color: currentTheme.colors.text,
            }}
          >
            {formatDetailedTooltipContent()}
          </ThemedCodeBlock>
        </ThemedBox>
      </ThemedPaper>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div
        ref={cellRef}
        style={cellStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {value}
      </div>
      
      {tooltipPortal}
      {modalPortal}
    </>
  );
};


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
}

// ###############################################################################################################
export const ReportSectionEntityInstance = (props: ReportSectionEntityInstanceProps) => {
  const renderStartTime = performance.now();
  
  // const errorLog = useErrorLogService();
  const context = useMiroirContextService();
  const showPerformanceDisplay = context.showPerformanceDisplay;
  // const { currentTheme } = useMiroirTheme();

  const navigationKey = `${props.deploymentUuid}-${props.applicationSection}`;
  const { navigationCount, totalCount } = useRenderTracker("ReportSectionEntityInstance", navigationKey);

  // Track performance immediately for initial render
  const componentKey = `ReportSectionEntityInstance-${props.instance?.uuid || props.entityUuid}`;
  
  log.info(
    "++++++++++++++++++++++++++++++++ render",
    "navigationCount", navigationCount,
    "totalCount", totalCount,
    "with props",
    props
  );

  const [displayAsStructuredElement, setDisplayAsStructuredElement] = useState(true);
  const [displayEditor, setDisplayEditor] = useState(true);
  const [foldedObjectAttributeOrArrayItems, setFoldedObjectAttributeOrArrayItems] = useState<{ [k: string]: boolean }>({});
  const [resolveConditionalSchemaResultsData, setResolveConditionalSchemaResultsData] = useState<any[]>([]); // TODO: use a precise type!

  // Use outline context for outline state management
  const outlineContext = useDocumentOutlineContext();
  const isOutlineOpen = outlineContext.isOutlineOpen;
  const handleToggleOutline = outlineContext.onToggleOutline;


  const instance: any = props.instance;

  const currentModel: MetaModel = useCurrentModel(
    context.applicationSection == "data" ? context.deploymentUuid : adminConfigurationDeploymentMiroir.uuid
  );

  const domainController: DomainControllerInterface = useDomainControllerService();
  
  const currentReportDeploymentSectionEntities: Entity[] = currentModel.entities; // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section

  const currentReportTargetEntity: Entity | undefined = currentReportDeploymentSectionEntities?.find(
    (e) => e?.uuid === props.entityUuid
  );

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);


  const formLabel: string = props.applicationSection + "." + currentReportTargetEntity?.name + 
    (props.zoomInPath ? ` (${props.zoomInPath})` : "");

  // Update the outline title when the current entity changes
  useEffect(() => {
    if (currentReportTargetEntity?.name) {
      outlineContext.setOutlineTitle(currentReportTargetEntity.name + " details");
    }
  }, [currentReportTargetEntity?.name, outlineContext.setOutlineTitle]);

  const labelElement = useMemo(() => {
    return formLabel ? <ThemedLabel id={"label." + formLabel}>{formLabel}</ThemedLabel> : undefined;
  }, [formLabel]);

  // const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  // log performance metrics at the end of render
  useEffect(() => {
    // Track render performance at the end of render
    if (props.instance?.uuid) {
      const renderEndTime = performance.now();
      const renderDuration = renderEndTime - renderStartTime;
      
      // Only track performance if render took longer than 5ms or every 100 renders
      if (renderDuration > 5) {
        const currentMetrics = RenderPerformanceMetrics.trackRenderPerformance(componentKey, renderDuration);
    
        // Log performance every 100 renders or if render took longer than 15ms
        if (currentMetrics.renderCount % 100 === 0 || renderDuration > 15) {
          log.info(
            `ReportSectionEntityInstance render performance - ${componentKey}: ` +
              `#${currentMetrics.renderCount} renders, ` +
              `Current: ${renderDuration.toFixed(2)}ms, ` +
              `Total: ${currentMetrics.totalRenderTime.toFixed(2)}ms, ` +
              `Avg: ${currentMetrics.averageRenderTime.toFixed(2)}ms, ` +
              `Min/Max: ${currentMetrics.minRenderTime.toFixed(
                2
              )}ms/${currentMetrics.maxRenderTime.toFixed(2)}ms`
          );
        }
      }
    }
  }, [props.instance, props.entityUuid]);
  // });
  
  
  // ##############################################################################################
  const handleDisplayEditorSwitchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayEditor(event.target.checked);
  },[setDisplayEditor]);
  
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
                }
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
              applicationSection: props.applicationSection
                ? props.applicationSection
                : "data",
              objects: [
                {
                  parentName: data.name,
                  parentUuid: data.parentUuid,
                  applicationSection: props.applicationSection
                    ? props.applicationSection
                    : "data",
                  instances: [data],
                },
              ],
            }
          };
          await domainController.handleAction(updateAction);
        }
      } else {
        throw new Error(
          "onEditValueObjectFormSubmit props.deploymentUuid is undefined."
        );
      }
    },
    [domainController, props]
  );
  
  // ##############################################################################################
  // Check if this is a TransformerTest entity instance
  const isTransformerTestEntity = currentReportTargetEntity?.uuid === entityTransformerTest.uuid;
  const isTransformerTest = isTransformerTestEntity && 
    instance?.parentUuid === entityTransformerTest.uuid;
  
  // Log for debugging
  log.info("ReportSectionEntityInstance - TransformerTest detection:", 
    "currentReportTargetEntity",
    currentReportTargetEntity,
    "entityUuid",
    currentReportTargetEntity?.uuid,
    "entityTransformerTest",
    entityTransformerTest,
    "instance",
    instance,
    "isTransformerTest",
    isTransformerTest,
  //   {
  //   transformerTestEntityUuid: entityTransformerTest.uuid,
  //   isTransformerTestEntity,
  //   instanceTransformerTestType: instance?.transformerTestType,
  //   instanceName: instance?.name,
  //   transformerTestLabel: instance?.transformerTestLabel
  // }
);
  
  // ##############################################################################################
  if (instance) {
    return (
      <ThemedContainer>
        <div>
          {/* <RenderPerformanceDisplay componentKey={componentKey} indentLevel={0} /> */}

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
              }}
            >
              <div style={{ marginBottom: "8px", fontWeight: "bold", color: "#1976d2" }}>
                🧪 Transformer Test Available
              </div>
              <RunTransformerTestSuiteButton
                transformerTestSuite={instance}
                testSuiteKey={instance.transformerTestLabel || instance.name || "TransformerTest"}
                useSnackBar={true}
                onTestComplete={(testSuiteKey, structuredResults) => {
                  setResolveConditionalSchemaResultsData(structuredResults);
                  log.info(`Test completed for ${testSuiteKey}:`, structuredResults);
                }}
                label={`▶️ Run ${instance.transformerTestLabel || "Transformer Test"}`}
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
                  <div style={{ margin: "20px 0" }}>
                    <h3>resolveConditionalSchema Test Results:</h3>
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
                          fullAssertionsResults: { 
                            type: "object",
                            definition: {}
                          },
                        },
                      }}
                      columnDefs={{
                        columnDefs: [
                          {
                            field: "testName",
                            headerName: "Test Name",
                            cellRenderer: (params: any) => (
                              <TestCellWithDetails
                                value={params.value}
                                testData={params.data.rawValue}
                                testName={params.data.rawValue.testName}
                                type="testName"
                              />
                            ),
                            width: 200,
                          },
                          {
                            field: "status",
                            headerName: "Status",
                            cellRenderer: (params: any) => (
                              <TestCellWithDetails
                                value={params.value}
                                testData={params.data.rawValue}
                                testName={params.data.rawValue.testName}
                                type="status"
                              />
                            ),
                            width: 100,
                          },
                          {
                            field: "testResult",
                            headerName: "Result",
                            cellRenderer: (params: any) => (
                              <TestCellWithDetails
                                value={params.value}
                                testData={params.data.rawValue}
                                testName={params.data.rawValue.testName}
                                type="result"
                              />
                            ),
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
                            cellRenderer: (params: any) => (
                              <div 
                                style={{ 
                                  maxWidth: "200px", 
                                  overflow: "hidden", 
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  cursor: "pointer"
                                }}
                                title="Click test name or status for full details"
                              >
                                {params.value}
                              </div>
                            ),
                            width: 250,
                          },
                        ],
                      }}
                      styles={{
                        height: "400px",
                        width: "100%",
                      }}
                      maxRows={20}
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
              {props.zoomInPath && <span style={{ fontSize: '0.8em', fontStyle: 'italic', color: '#666' }}>
                (viewing: {props.zoomInPath})
              </span>}
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
                foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
                setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
                zoomInPath={props.zoomInPath}
              />
            ) : (
              <div>
                {displayAsStructuredElement ? (
                  <div>Can not display non-editor as structured element</div>
                ) : (
                  <div>
                    {props.zoomInPath && (
                      <div style={{ marginBottom: '8px', fontSize: '0.9em', color: '#666', fontStyle: 'italic' }}>
                        Viewing path: {props.zoomInPath}
                      </div>
                    )}
                    <ThemedCodeBlock>
                      {safeStringify(
                        props.zoomInPath 
                          ? (() => {
                              const pathParts = props.zoomInPath.split('.');
                              let current = instance;
                              for (const part of pathParts) {
                                if (current && typeof current === 'object') {
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
              {props.zoomInPath && (
                <div>zoom path: {props.zoomInPath}</div>
              )}
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
        </div>
        {/* <PerformanceMetricsDisplay /> */}
      </ThemedContainer>
    );
  } else {
    return <>ReportSectionEntityInstance: No instance to display!</>;
  }
};

