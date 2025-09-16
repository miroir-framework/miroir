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
  miroirFundamentalJzodSchema,
  type JzodElement,
  type TestSuiteListFilter
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
import { TransformerTestResultExecutionSummary } from './TransformerTestResultExecutionSummary.js';
import { TransformerTestResults, type TestResultDataAndSelect } from './TransformerTestResults.js';
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

// Test Selection Types
export type TestSelectionState = {
  [testPath: string]: boolean; // Full test path -> selected state
};

// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
/**
 * 
 * @param testSelectionsState 
 * @param transformerTestResultsData 
 * @returns undefined if no selection happened (run all tests that are non-skipped), or { testList: { suiteName: [testName, ...], ... } }
 */
const handleBuildTestFilter = (
  testSelectionsState: TestSelectionState,
  transformerTestResultsData: TestResultDataAndSelect[]
): { testList?: TestSuiteListFilter } | undefined => {
  // Get the list of selected test data (not just test names)
  const selectedTestData = transformerTestResultsData.filter(
    (test) => testSelectionsState[test.testName] === true
  );

  if (selectedTestData.length === 0) {
    // return undefined;
    return { testList: {} }; 
  }

  // Build simple hierarchical filter: suite name -> array of test names
  const testList: { [key: string]: string[] } = {};

  selectedTestData.forEach((test) => {
    if (test.testPath && test.testPath.length >= 2) {
      const suiteName = test.testPath[0]; // First element is the suite name
      const testName = test.testPath[test.testPath.length - 1]; // Last element is the actual test name (not the display name)

      if (!testList[suiteName]) {
        testList[suiteName] = [];
      }

      if (!testList[suiteName].includes(testName)) {
        testList[suiteName].push(testName);
      }
    }
  });

  const filterResult = { testList: testList as TestSuiteListFilter };

  log.info(
    "handleBuildTestFilter: testSelectionsState=",
    testSelectionsState,
    ", selectedTestData=",
    selectedTestData.map((t) => ({ name: t.testName, path: t.testPath })),
    "filterResult=",
    filterResult
  );

  return filterResult;
};

// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
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
  const [transformerTestResultsData, setTransformerTestResultsData] = useState<
    TestResultDataAndSelect[]
  >([]); // TODO: use a precise type!
  // const [currentTestFilter, setCurrentTestFilter] = useState<{ testList?: TestSuiteListFilter } | undefined>(undefined);
  const [testSelectionState, setTestSelectionsState] = useState<TestSelectionState>({});

  const currentTestFilter = useMemo(() => {
    return handleBuildTestFilter(testSelectionState, transformerTestResultsData);
  }, [testSelectionState]);

  log.info("ReportSectionEntityInstance: currentTestFilter:", currentTestFilter, "testSelectionState:", testSelectionState, "transformerTestResultsData:", transformerTestResultsData);
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

  // ##############################################################################################
  // ################################################################################################
  // ################################################################################################
  // ################################################################################################
  // CALLS setFoldedObjectAttributeOrArrayItems
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

  // // Initialize test selections when test results are available
  // useEffect(() => {
  //   if (resolveConditionalSchemaResultsData && resolveConditionalSchemaResultsData.length > 0) {
  //     reportContext.initializeTestSelections(resolveConditionalSchemaResultsData, (testPath) => {
  //       // Don't select tests that were originally skipped
  //       const test = resolveConditionalSchemaResultsData.find(t => t.testName === testPath);
  //       return test ? test.testResult !== "skipped" : true;
  //     });
  //   }
  // }, [resolveConditionalSchemaResultsData, reportContext.initializeTestSelections]);

  const formLabel: string =
    props.applicationSection +
    "." +
    currentReportTargetEntity?.name +
    (props.zoomInPath ? ` (${props.zoomInPath})` : "");


  // ###############################################################################################
  // CALLS setOutlineTitle and setReportInstance
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
                testFilter={currentTestFilter}
                onTestComplete={(testSuiteKey, structuredResults) => {
                  setTransformerTestResultsData(structuredResults);
                  log.info(`Test completed for ${testSuiteKey}:`, structuredResults);
                }}
                label={`▶️ Run All ${testLabel} Tests`}
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
              {/* {currentTestFilter && (
                <RunTransformerTestSuiteButton
                  transformerTestSuite={instance}
                  testSuiteKey={testLabel}
                  useSnackBar={true}
                  testFilter={currentTestFilter}
                  onTestComplete={(testSuiteKey, structuredResults) => {
                    setTransformerTestResultsData(structuredResults);
                    log.info(`Selected tests completed for ${testSuiteKey}:`, structuredResults);
                  }}
                  label={`▶️ Run Selected ${testLabel} Tests`}
                  style={{
                    backgroundColor: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 16px",
                    fontWeight: "bold",
                  }}
                />
              )} */}
              {/* Test Results Display */}
              {transformerTestResultsData &&
                transformerTestResultsData.length > 0 && (
                  <div style={{ margin: "20px 0", width: "100%" }}>
                    {/* Test Execution Summary */}
                    <TransformerTestResultExecutionSummary
                      resolveConditionalSchemaResultsData={transformerTestResultsData}
                      testLabel={testLabel}
                    />

                    <TransformerTestResults
                      transformerTestSuite={instance.definition}
                      transformerTestResultsData={transformerTestResultsData}
                      testLabel={testLabel}
                      // onTestFilterChange={setCurrentTestFilter}
                      testSelectionsState={testSelectionState}
                      setTestSelectionsState={setTestSelectionsState}
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

