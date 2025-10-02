import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ApplicationSection,
  BoxedQueryWithExtractorCombinerTransformer,
  Domain2QueryReturnType,
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  EntityInstance,
  InstanceAction,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerParams,
  Uuid,
  adminConfigurationDeploymentMiroir,
  entityDefinitionQuery,
  entityQueryVersion,
  entityTransformerTest,
  getQueryRunnerParamsForReduxDeploymentsState,
  getQueryTemplateRunnerParamsForReduxDeploymentsState,
  miroirFundamentalJzodSchema,
  safeStringify,
  type BoxedQueryTemplateWithExtractorCombinerTransformer,
  type JzodElement,
  type MiroirQuery,
  type SyncBoxedExtractorTemplateRunner,
  type SyncQueryTemplateRunnerParams
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
  useCurrentModel,
  useReduxDeploymentsStateQueryTemplateSelector
} from "../../ReduxHooks.js";
import { useReduxDeploymentsStateQuerySelector } from '../../ReduxHooks.js';
import {
  getMemoizedReduxDeploymentsStateSelectorForTemplateMap,
  getMemoizedReduxDeploymentsStateSelectorMap,
} from "miroir-localcache-redux";
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import { RenderPerformanceMetrics } from '../../tools/renderPerformanceMeasure.js';
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
import { TransformerTestDisplay } from './TransformerTestDisplay.js';
import { TypedValueObjectEditor } from './TypedValueObjectEditor.js';
import { useDocumentOutlineContext } from '../ValueObjectEditor/InstanceEditorOutlineContext.js';
import { useReportPageContext } from './ReportPageContext.js';
import type { FoldedStateTree } from './FoldedStateTreeUtils.js';
import type { Query } from '@testing-library/dom';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionEntityInstance"), "UI",
).then((logger: LoggerInterface) => {log = logger});


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

// Test Selection Types are now in TransformerTestDisplay

// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
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
  const [isResultsCollapsed, setIsResultsCollapsed] = useState(true);
  // const [maxRenderDepth, setMaxRenderDepth] = useState<number>(props.maxRenderDepth ?? 1);

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

  // log.info(
  //   "ReportSectionEntityInstance: currentReportTargetEntityDefinition:",
  //   currentReportTargetEntityDefinition,
  //   "miroirFundamentalJzodSchema",
  //   miroirFundamentalJzodSchema
  // );

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

  // Check if this is a TransformerTest entity instance
  const isTransformerTestEntity = currentReportTargetEntity?.uuid === entityTransformerTest.uuid;
  const isTransformerTest =
    isTransformerTestEntity && instance?.parentUuid === entityTransformerTest.uuid;

  // Check if this is a Query entity instance
  // const QUERY_ENTITY_UUID = "e4320b9e-ab45-4abe-85d8-359604b3c62f";
  const isQueryEntity = instance?.parentUuid === entityQueryVersion.uuid;

  const currentQuery: any | undefined = isQueryEntity ? instance : undefined;
  log.info("ReportSectionEntityInstance: isQueryEntity", isQueryEntity, "currentQuery", currentQuery);
  // ##############################################################################################
  // Query execution logic for Query entities
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> = useMemo(
    () => getMemoizedReduxDeploymentsStateSelectorForTemplateMap(),
    // () => getMemoizedReduxDeploymentsStateSelectorMap(),
    // () => getMemoizedReduxDeploymentsStateSelectorMap(),
    []
  );

  const queryForExecution: BoxedQueryTemplateWithExtractorCombinerTransformer | undefined = useMemo(() => {
    if (!isQueryEntity || isResultsCollapsed || !currentQuery?.definition) {
      return undefined;
    }

    // Convert the instance query to the expected format
    return {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: props.deploymentUuid,
      pageParams: {
        deploymentUuid: props.deploymentUuid,
        // applicationSection: props.applicationSection,
        applicationSection: "model",
        instanceUuid: instance.uuid,
      },
      queryParams: {},
      contextResults: {},
      extractorTemplates: currentQuery?.definition || {},
      // extractors: currentQuery?.definition || {},
      // extractors: instance.query?.extractors || {},
      // combiners: instance.query?.combiners || {},
      // runtimeTransformers: instance.query?.runtimeTransformers || {},
    };
  }, [
    isQueryEntity,
    isResultsCollapsed,
    instance,
    props.deploymentUuid,
    props.applicationSection,
    instance?.uuid,
  ]);

  log.info("ReportSectionEntityInstance: queryForExecution:", queryForExecution);
  // const deploymentEntityStateFetchQueryParams: SyncQueryRunnerParams<ReduxDeploymentsState> | undefined = useMemo(
  const deploymentEntityStateFetchQueryParams: SyncQueryTemplateRunnerParams<ReduxDeploymentsState> | undefined = useMemo(
    () => {
      if (!queryForExecution) return undefined;
      // return getQueryRunnerParamsForReduxDeploymentsState(
      return getQueryTemplateRunnerParamsForReduxDeploymentsState(
        queryForExecution,
        deploymentEntityStateSelectorMap
      );
    },
    [queryForExecution, deploymentEntityStateSelectorMap]
  );

  const queryResults: Domain2QueryReturnType<Domain2QueryReturnType<Record<string, any>>> | undefined = 
    // deploymentEntityStateFetchQueryParams ? useReduxDeploymentsStateQuerySelector(
    deploymentEntityStateFetchQueryParams ? useReduxDeploymentsStateQueryTemplateSelector(
      deploymentEntityStateSelectorMap.runQueryTemplateWithExtractorCombinerTransformer,
      deploymentEntityStateFetchQueryParams
    ) : undefined;

  // ##############################################################################################
  const testLabel = instance.transformerTestLabel || instance.name || "TransformerTest";
  
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
            <TransformerTestDisplay
              transformerTest={instance}
              testLabel={testLabel}
              useSnackBar={true}
              onTestComplete={(testSuiteKey, structuredResults) => {
                log.info(`Test completed for ${testSuiteKey}:`, structuredResults);
              }}
            />
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
          
          {/* Query Results Section - Collapsible */}
          {isQueryEntity && (
            <div style={{ 
              marginBottom: '16px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa'
            }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: isResultsCollapsed ? 'none' : '1px solid #dee2e6'
                }}
                onClick={() => setIsResultsCollapsed(!isResultsCollapsed)}
              >
                <ThemedTitle style={{ margin: 0, fontSize: '16px' }}>
                  Query Results
                </ThemedTitle>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  {isResultsCollapsed ? '▶' : '▼'}
                </span>
              </div>
              
              {!isResultsCollapsed && (
                <div style={{ padding: '16px' }}>
                  {queryResults ? (
                    queryResults.elementType === "failure" ? (
                      <div style={{ color: '#dc3545', padding: '8px' }}>
                        <strong>Query execution failed:</strong>
                        <ThemedCodeBlock style={{ marginTop: '8px' }}>
                          {JSON.stringify(queryResults, null, 2)}
                        </ThemedCodeBlock>
                      </div>
                    ) : (
                      <div>
                        <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>
                          Query executed successfully. Results:
                        </div>
                        <ThemedCodeBlock>
                          {safeStringify(queryResults)}
                        </ThemedCodeBlock>
                      </div>
                    )
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '16px',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      {instance?.query ? 
                        "Executing query..." : 
                        "No query defined for this instance"
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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

