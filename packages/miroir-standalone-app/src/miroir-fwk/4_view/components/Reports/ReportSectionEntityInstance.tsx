import { useEffect, useMemo, useState } from 'react';

import {
  ApplicationSection,
  Domain2QueryReturnType,
  Entity,
  EntityDefinition,
  EntityInstance,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  SyncBoxedExtractorOrQueryRunnerMap,
  Uuid,
  adminConfigurationDeploymentMiroir,
  entityQueryVersion,
  entityTransformerTest,
  getQueryTemplateRunnerParamsForReduxDeploymentsState,
  interpolateExpression,
  resolvePathOnObject,
  type BoxedQueryTemplateWithExtractorCombinerTransformer,
  type JzodObject,
  type ReportSection,
  type SyncQueryTemplateRunnerParams
} from "miroir-core";

import {
  useMiroirContextService,
  useViewParams
} from "../../MiroirContextReactProvider.js";

import { Toc } from '../Themes/MaterialSymbolWrappers';
import { useFormikContext } from 'formik';
import {
  getMemoizedReduxDeploymentsStateSelectorForTemplateMap
} from "miroir-localcache-redux";
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import {
  useCurrentModel,
  useReduxDeploymentsStateQueryTemplateSelector
} from "../../ReduxHooks.js";
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import { RenderPerformanceMetrics } from '../../tools/renderPerformanceMeasure.js';
import {
  ThemedCodeBlock,
  ThemedContainer,
  ThemedHeaderSection,
  ThemedIconButton,
  ThemedLabel,
  ThemedOnScreenHelper,
  ThemedPreformattedText,
  ThemedText,
  ThemedTitle,
  ThemedTooltip
} from "../Themes/index";
import { useDocumentOutlineContext } from '../ValueObjectEditor/InstanceEditorOutlineContext.js';
import type { FoldedStateTree } from './FoldedStateTreeUtils.js';
import { useReportPageContext } from './ReportPageContext.js';
import { TransformerTestDisplay } from './TransformerTestDisplay.js';
import { TypedValueObjectEditor } from './TypedValueObjectEditor.js';

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
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  defaultLabel?: string,
  // 
  initialInstanceValueDEFUNCT: EntityInstance,
  entityUuidDEFUNCT: Uuid,
  // 
  formikAlreadyAvailable?: boolean;
  formikValuePath: ( string | number )[],
  reportSectionPath?: ( string | number )[],
  formikReportDefinitionPathString?: string;
  // formikReportDefinitionEntityDefinitionPathString?: string;
  formValueMLSchema: JzodObject;
  reportSectionDefinition?: ReportSection;
  // 
  // Note: Outline props removed since using context now
  showPerformanceDisplay?: boolean;
  zoomInPath?: string; // Optional path like "x.y.z" to zoom into a subset of the instance
  maxRenderDepth?: number; // Optional max depth for initial rendering, default 1
  // when displayed in a AddObjectdialogForm modal dialog form
  setAddObjectdialogFormIsOpen?: (a:boolean) => void,
  mode: "create" | "update",
}

// Test Selection Types are now in TransformerTestDisplay
let count = 0;
// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
// ###############################################################################################################
/**
 * used hooks:
 * useCurrentModel
 * useDocumentOutlineContext
 * useDomainControllerService
 * useMiroirContextService
 * useRenderTracker
 * useReportPageContext
 * useViewParams
 * 
 * @param props 
 * @returns 
 */
export const ReportSectionEntityInstance = (props: ReportSectionEntityInstanceProps) => {
  const renderStartTime = performance.now();
  const formikContext = useFormikContext<Record<string, any>>();
  const formikValuePathAsString = props.formikValuePath?.join("_") || "";
  // const formikValuePath = props.formikValuePath?.join("_") || "";
  // const formikReportDefinition: Report = formikContext.values[props.reportSectionPath.join("_")];

  // log.info(
  //   "ReportSectionEntityInstance: formik values =",
  //   formikContext.values,
  //   "props.formikReportDefinitionPathString =",
  //   props.formikReportDefinitionPathString,
  //   // "props.formikReportDefinitionEntityDefinitionPathString =",
  //   // props.formikReportDefinitionEntityDefinitionPathString,
  //   "props.reportSectionPath =",
  //   props.reportSectionPath
  // );

  // const localReportDefinition: Report | undefined = props.formikReportDefinitionPathString
  //   ? formikContext.values[props.formikReportDefinitionPathString]
  //   : undefined;
  // const localReportSectionDefinition: ReportSection | undefined =
  //   localReportDefinition && props.reportSectionPath
  //     ? resolvePathOnObject(localReportDefinition, props.reportSectionPath || [])
  //     : undefined;
  const reportDefinitionFromFormik: Report  | undefined =
    formikContext.values &&
    props.formikReportDefinitionPathString?
    formikContext.values[props.formikReportDefinitionPathString]:undefined
  ;
  
  const reportSectionDefinitionFromFormik: ReportSection | undefined =
      reportDefinitionFromFormik &&
      props.reportSectionPath
        ? resolvePathOnObject(
            // props.reportDefinitionDEFUNCT, props.reportSectionPath ?? []
            reportDefinitionFromFormik,
            props.reportSectionPath
          )
        : undefined;
  
  // const entityUuid: Uuid | undefined = (reportSectionDefinitionFromFormik?.definition as any)?.parentUuid;

  // log.info(
  //   "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ ReportSectionEntityInstance render",
  //   ++count,
  //   "start",
  //   "formikValuePathAsString:",
  //   formikValuePathAsString,
  //   "props.formikAlreadyAvailable", 
  //   props.formikAlreadyAvailable, 
  //   "formikContext:",
  //   formikContext.values,
  //   "reportDefinitionFromFormik:",
  //   reportDefinitionFromFormik,
  //   "reportSectionDefinitionFromFormik",
  //   reportSectionDefinitionFromFormik,
  //   // "entityUuid",
  //   // entityUuid,
  //   "with props:",
  //   props,
  //   // "formikContext:",
  //   // formikContext
  // );
  // const errorLog = useErrorLogService();
  if (reportSectionDefinitionFromFormik?.type && reportSectionDefinitionFromFormik?.type !== "objectInstanceReportSection") {
    throw new Error(
      "ReportSectionEntityInstance can only be used with objectInstanceReportSection types, got reportDefinition: " +
        JSON.stringify(reportDefinitionFromFormik) + " and path: " +
        JSON.stringify(props.reportSectionPath)
        // JSON.stringify(reportSectionDefinitionFromFormik)
    );
  }
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
  const componentKey = `ReportSectionEntityInstance-${props.initialInstanceValueDEFUNCT?.uuid || props.entityUuidDEFUNCT}`;

  // log.info(
  //   "++++++++++++++++++++++++++++++++ render",
  //   "navigationCount",
  //   navigationCount,
  //   "totalCount",
  //   totalCount,
  //   "with props",
  //   props
  // );

  // const [displayAsStructuredElement, setDisplayAsStructuredElement] = useState(true);
  // const [displayEditor, setDisplayEditor] = useState(true);
  const [isResultsCollapsed, setIsResultsCollapsed] = useState(true);
  // const [maxRenderDepth, setMaxRenderDepth] = useState<number>(props.maxRenderDepth ?? 1);

  // Use outline context for outline state management
  const outlineContext = useDocumentOutlineContext();
  const reportContext = useReportPageContext();

  // the TypeValueObjectEditor will get the instance value either from formikContext or from props.initialInstanceValueDEFUNCT depending on props.formikAlreadyAvailable
  // instanceDEFUNCT now serves only in the context of a Query entity instance to get the query definition for execution
  const instance: any = useMemo(() => {
    // log.info(
    //   "ReportSectionEntityInstance: computing instance value from props.initialInstanceValue and formikContext",
    //   props.formikAlreadyAvailable,
    //   formikContext?.values,
    //   reportSectionPathAsString
    // );
    if (props.formikAlreadyAvailable) {
      return formikContext?.values[formikValuePathAsString] as EntityInstance;
    } else {
      return props.initialInstanceValueDEFUNCT;
    }
  }, [
    props.initialInstanceValueDEFUNCT,
    props.formikAlreadyAvailable,
    formikValuePathAsString,
    formikContext?.values,
  ]) as EntityInstance;

  // log.info(
  //   "ReportSectionEntityInstance",
  //   "instance to display:",
  //   instance,
  //   "formik:",
  //   formikContext,
  //   "props.formikAlreadyAvailable",
  //   props.formikAlreadyAvailable,
  //   "formikContext.values[reportSectionPathAsString]",
  //   formikContext?.values[formikValuePathAsString]
  // );

  // // DO NOT USE dot notation for reportSectionPath as it is interpreted by Formik as nested object paths!
  // // const reportSectionPathAsString = props.reportSectionPath?.join("_") || "";
  // const formInitialValueDEFUNCT: any = useMemo(() => ({
  //   [formikValuePathAsString] : instance
  // }), [instance]);

  const currentDeploymentModel: MetaModel = useCurrentModel(
    //  props.deploymentUuid
    // context.applicationSection == "data"
    props.applicationSection == "data"
      // ? context.deploymentUuid
      ? props.deploymentUuid
      : adminConfigurationDeploymentMiroir.uuid // the report to edit any element from the 'model' section must be in the meta-model
  );

  const currentDeploymentReportsEntitiesDefinitionsMapping =
    // context.deploymentUuidToReportsEntitiesDefinitionsMapping[context.deploymentUuid] || {};
    context.deploymentUuidToReportsEntitiesDefinitionsMapping[props.deploymentUuid] || {};

  // log.info("ReportSectionEntityInstance: currentDeploymentReportsEntitiesDefinitionsMapping:", currentDeploymentReportsEntitiesDefinitionsMapping);

  const { availableReports, entities, entityDefinitions } = useMemo(() => {
      // return displayedDeploymentDefinition &&
      return props.deploymentUuid &&
        context.deploymentUuidToReportsEntitiesDefinitionsMapping &&
        context.deploymentUuidToReportsEntitiesDefinitionsMapping[props.deploymentUuid]
        ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[props.deploymentUuid][
        // context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid]
        // ? context.deploymentUuidToReportsEntitiesDefinitionsMapping[displayedDeploymentDefinition?.uuid][
          props.applicationSection
          ]
        : { availableReports: [], entities: [], entityDefinitions: [] };
    }, [
      props.deploymentUuid,
      // displayedDeploymentDefinition,
      context.deploymentUuidToReportsEntitiesDefinitionsMapping,
      props.applicationSection,
    ]);
  

  // const currentModelEnvironment = defaultMiroirModelEnvironment;
  // const domainController: DomainControllerInterface = useDomainControllerService();

  const targetEntityUuid: Uuid | undefined = reportSectionDefinitionFromFormik?.definition?.parentUuid;

  // const currentReportDeploymentSectionEntities: Entity[] = currentDeploymentModel.entities; // Entities are always defined in the 'model' section
  // const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] =
  //   currentDeploymentMetaModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section

  const currentReportTargetEntity: Entity | undefined =
    // currentDeploymentModel.entities?.find((e) => e?.uuid === targetEntityUuid);
    entities?.find((e) => e?.uuid === targetEntityUuid);

  const currentReportSectionTargetEntityDefinition: EntityDefinition | undefined =
    currentDeploymentReportsEntitiesDefinitionsMapping?.[props.applicationSection??"data"]?.entityDefinitions?.find(
    // currentDeploymentModel?.entityDefinitions?.find(
        // (e) => e?.entityUuid === props.entityUuidDEFUNCT // TODO: remove entityUuid from props and use only formValueMLSchema?
        (e) => e?.entityUuid === targetEntityUuid
  );

  // log.info(
  //   "ReportSectionEntityInstance",
  //   "props.applicationSection",
  //   props.applicationSection,
  //   // "currentDeploymentReportsEntitiesDefinitionsMapping?.[props.applicationSection??'data']?.entityDefinitions",
  //   // currentDeploymentReportsEntitiesDefinitionsMapping?.[props.applicationSection??"data"]?.entityDefinitions,
  //   "currentReportSectionTargetEntityDefinition:",
  //   currentReportSectionTargetEntityDefinition,
  // );

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // CALLS reportContext.setFoldedObjectAttributeOrArrayItems
  useEffect(() => {
    // log.info("ReportSectionEntityInstance: useEffect setting initial folded paths");
    const foldedStringPaths = currentReportSectionTargetEntityDefinition?.display?.foldSubLevels
      ? Object.entries(currentReportSectionTargetEntityDefinition?.display?.foldSubLevels).filter(
          ([key, value]) => value
        )
      : [];

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
    // log.info(
    //   "Setting initial folded paths newFoldedObjectAttributeOrArrayItems:",
    //   newFoldedObjectAttributeOrArrayItems
    // );

    reportContext.setFoldedObjectAttributeOrArrayItems(newFoldedObjectAttributeOrArrayItems);
  }, [
    currentReportSectionTargetEntityDefinition?.display?.foldSubLevels,
    reportContext.setFoldedObjectAttributeOrArrayItems,
  ]);


  const formLabel: string =
    props.applicationSection +
    "." +
    currentReportTargetEntity?.name +
    (props.zoomInPath ? ` (${props.zoomInPath})` : "");


  // ##############################################################################################
  // CALLS setOutlineTitle and setReportInstance
  useEffect(() => {
    // log.info("ReportSectionEntityInstance: useEffect setting outline title and report instance");
    if (currentReportTargetEntity?.name) {
      // log.info(
      //   "ReportSectionEntityInstance: setting outline title and report instance for entity:",
      //   currentReportTargetEntity.name,
      //   "instance:",
      //   instance
      // );
      outlineContext.setOutlineTitle(currentReportTargetEntity.name + " details");
      outlineContext.setReportInstance(instance);
    }
  }, [currentReportTargetEntity?.name, instance, outlineContext.setOutlineTitle]);

  const labelElement = useMemo(() => {
    return formLabel ? <ThemedLabel id={"label." + formLabel}>{formLabel}</ThemedLabel> : undefined;
  }, [formLabel]);

  // log performance metrics at the end of render (ifThenElse)
  if (context.showPerformanceDisplay) {
    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - renderStartTime;
    RenderPerformanceMetrics.trackRenderPerformance(componentKey, renderDuration);
  }

  // // ##############################################################################################
  // const handleDisplayEditorSwitchChange = useCallback(
  //   (event: React.ChangeEvent<HTMLInputElement>) => {
  //     setDisplayEditor(event.target.checked);
  //   },
  //   [setDisplayEditor]
  // );

  // // ##############################################################################################
  // const onEditValueObjectFormSubmitDEFUNCT = useCallback(
  //   async (data: any) => {
  //     log.info(
  //       "onEditValueObjectFormSubmit called on formikValuePathAsString",
  //       formikValuePathAsString,
  //       "with new object value",
  //       data
  //     );
  //     // TODO: use action queue
  //     if (props.deploymentUuid) {
  //       if (!data || !data[formikValuePathAsString]) {
  //         throw new Error(
  //           "onEditValueObjectFormSubmit called with undefined data:" +
  //             formikValuePathAsString +
  //             " not found in data: " +
  //             Object.keys(data)
  //         );
  //       }
  //       if (!data[formikValuePathAsString].parentUuid) {
  //         throw new Error("onEditValueObjectFormSubmit called with object missing parentUuid: " + Object.keys(data[formikValuePathAsString]));
  //       }
  //       const applicationSection = getApplicationSection(props.deploymentUuid, data[formikValuePathAsString].parentUuid);
  //       if (applicationSection == "model") {
  //         await domainController.handleActionFromUI(
  //           {
  //             actionType: "transactionalInstanceAction",
  //             deploymentUuid: props.deploymentUuid,
  //             instanceAction: {
  //               actionType: "updateInstance",
  //               deploymentUuid: props.deploymentUuid,
  //               endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //               payload: {
  //                 applicationSection: "model",
  //                 objects: [
  //                   {
  //                     parentName: data[formikValuePathAsString].name,
  //                     parentUuid: data[formikValuePathAsString].parentUuid,
  //                     applicationSection: props.applicationSection,
  //                     instances: [data[formikValuePathAsString]],
  //                   },
  //                 ],
  //               },
  //             },
  //           },
  //           currentModelEnvironment // TODO: use correct model environment
  //         );
  //       } else {
  //         const updateAction: InstanceAction = {
  //           actionType: "updateInstance",
  //           deploymentUuid: props.deploymentUuid,
  //           endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
  //           payload: {
  //             applicationSection: props.applicationSection ? props.applicationSection : "data",
  //             objects: [
  //               {
  //                 parentName: data[formikValuePathAsString].name,
  //                 parentUuid: data[formikValuePathAsString].parentUuid,
  //                 applicationSection: props.applicationSection ? props.applicationSection : "data",
  //                 instances: [data[formikValuePathAsString]],
  //               },
  //             ],
  //           },
  //         };
  //         await domainController.handleActionFromUI(updateAction);
  //       }
  //     } else {
  //       throw new Error("onEditValueObjectFormSubmit props.deploymentUuid is undefined.");
  //     }
  //   },
  //   [domainController, props]
  // );

  // ##############################################################################################
  // Check if this is a TransformerTest entity instance
  const isTransformerTestEntity = currentReportTargetEntity?.uuid === entityTransformerTest.uuid;
  const isTransformerTest =
    isTransformerTestEntity && instance?.parentUuid === entityTransformerTest.uuid;

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // Query execution logic for Query entities
  const isQueryEntity = instance?.parentUuid === entityQueryVersion.uuid;

  const currentQuery: any | undefined = isQueryEntity ? instance : undefined;
  // log.info("ReportSectionEntityInstance: isQueryEntity", isQueryEntity, "currentQuery", currentQuery);
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> = useMemo(
    () => getMemoizedReduxDeploymentsStateSelectorForTemplateMap(),
    []
  );

  const queryForTestRun =
    useMemo((): BoxedQueryTemplateWithExtractorCombinerTransformer => {
      // Convert the instance query to the expected format
      return isQueryEntity && currentQuery?.definition && !isResultsCollapsed
        ? {
            queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
            deploymentUuid: props.deploymentUuid,
            pageParams: {
              deploymentUuid: props.deploymentUuid,
              applicationSection: "model",
              instanceUuid: instance.uuid,
            },
            queryParams: {},
            contextResults: {},
            extractorTemplates: currentQuery?.definition.extractorTemplates || {},
            combinerTemplates: currentQuery?.definition.combinerTemplates || {},
            runtimeTransformers: currentQuery?.definition.runtimeTransformers || {},
          }
        : {
            queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
            deploymentUuid: props.deploymentUuid,
            pageParams: {},
            queryParams: {},
            contextResults: {},
            extractorTemplates: {},
          };
    }, [
      isQueryEntity,
      currentQuery,
      isResultsCollapsed,
      props.deploymentUuid,
      props.applicationSection,
      instance?.uuid,
    ]);

  // log.info("ReportSectionEntityInstance: queryForExecution:", queryForTestRun);
  const queryTestRunParams: SyncQueryTemplateRunnerParams<ReduxDeploymentsState> = useMemo(
    () => {
      // if (!queryForExecution) return undefined;
      // return getQueryRunnerParamsForReduxDeploymentsState(
      return getQueryTemplateRunnerParamsForReduxDeploymentsState(
        queryForTestRun,
        deploymentEntityStateSelectorMap
      );
    },
    [queryForTestRun, deploymentEntityStateSelectorMap]
  );

  const queryTestRunResults: Domain2QueryReturnType<Domain2QueryReturnType<Record<string, any>>> | undefined = 
    // Only execute query when results section is expanded
     useReduxDeploymentsStateQueryTemplateSelector(
    // (!isResultsCollapsed && deploymentEntityStateFetchQueryParams) ? runQueryTemplateFromReduxDeploymentsState(
      deploymentEntityStateSelectorMap.runQueryTemplateWithExtractorCombinerTransformer,
      queryTestRunParams
    );

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  const testLabel = instance?.transformerTestLabel || instance?.name || "TransformerTest";
  
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
            gridType={viewParams.gridType}
          />
        )}
        <ThemedHeaderSection>
          <ThemedTitle>
            {/* {currentReportTargetEntity?.name} details: {instance.name}{" "} */}
            {/* <span><pre>props.reportSectionPath: {JSON.stringify(props.reportSectionPath)}</pre></span>
            <span><pre>reportDefinitionFromFormik: {JSON.stringify(reportDefinitionFromFormik)}</pre></span>
            <span><pre>reportSectionDefinitionFromFormik: {JSON.stringify(reportSectionDefinitionFromFormik)}</pre></span> */}
            {props.defaultLabel ??
              (reportSectionDefinitionFromFormik?.definition?.label
                ? interpolateExpression(
                    reportSectionDefinitionFromFormik?.definition?.label,
                    { instance },
                    "report label"
                  )
                : undefined) ??
              currentReportTargetEntity?.name + " details: " + instance.name}
            {/* {props.zoomInPath && (
              <span style={{ fontSize: "0.8em", fontStyle: "italic", color: "#666" }}>
                (viewing: {props.zoomInPath})
              </span>
            )} */}
          </ThemedTitle>
          <ThemedTooltip
            title={outlineContext.isOutlineOpen ? "Hide Document Outline" : "Show Document Outline"}
          >
            <ThemedIconButton
              onClick={outlineContext.onToggleOutline}
              style={{
                marginLeft: "16px",
              }}
            >
              <Toc />
            </ThemedIconButton>
          </ThemedTooltip>
        </ThemedHeaderSection>
        {/* Query Results Section - Collapsible */}
        {isQueryEntity && (
          <div
            style={{
              marginBottom: "16px",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: isResultsCollapsed ? "none" : "1px solid #dee2e6",
              }}
              onClick={() => setIsResultsCollapsed(!isResultsCollapsed)}
            >
              <ThemedTitle style={{ margin: 0, fontSize: "16px" }}>Query Results</ThemedTitle>
              <span style={{ color: "#666", fontSize: "14px" }}>
                {isResultsCollapsed ? "▶" : "▼"}
              </span>
            </div>

            {/* query test run results */}
            {!isResultsCollapsed && (
              <div style={{ padding: "16px" }}>
                {queryTestRunResults ? (
                  queryTestRunResults.elementType === "failure" ? (
                    <div style={{ color: "#dc3545", padding: "8px" }}>
                      <strong>Query execution failed:</strong>
                      <ThemedCodeBlock style={{ marginTop: "8px" }}>
                        {JSON.stringify(queryTestRunResults, null, 2)}
                      </ThemedCodeBlock>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: "8px", fontSize: "14px", color: "#666" }}>
                        Query executed successfully. Results:
                      </div>
                      <ThemedCodeBlock>
                        {JSON.stringify(queryTestRunResults, null, 2)}
                      </ThemedCodeBlock>
                    </div>
                  )
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      color: "#666",
                      fontStyle: "italic",
                    }}
                  >
                    {queryForTestRun
                      ? "Executing query..."
                      : "No query definition found for this instance"}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentReportSectionTargetEntityDefinition && props.applicationSection ? (
          // displayEditor ? (
          <TypedValueObjectEditor
            labelElement={labelElement}
            deploymentUuid={props.deploymentUuid}
            applicationSection={props.applicationSection}
            formValueMLSchema={props.formValueMLSchema}
            formikValuePathAsString={formikValuePathAsString}
            //
            formLabel={formLabel}
            zoomInPath={props.zoomInPath}
            maxRenderDepth={Infinity} // Always render fully for editor
            // 
            setAddObjectdialogFormIsOpen={props.setAddObjectdialogFormIsOpen}
            mode={props.mode}
          />
        ) : (
          <div>
            Oops, ReportSectionEntityInstance could not be displayed.
            <p />
            <div>props deploymentUuid: {props.deploymentUuid}</div>
            <div>props selfApplication section: {props.applicationSection}</div>
            <div>context selfApplication section: {context.applicationSection}</div>
            {/* <div>instance entityUuid: {entityUuid}</div> */}
            <div>instance entityUuid: {instance.entityUuid}</div>
            <div>instance uuid: {instance.uuid}</div>
            <div>
              target entity: {currentReportTargetEntity?.name ?? "report target entity not found!"}
            </div>
            {props.zoomInPath && <div>zoom path: {props.zoomInPath}</div>}
            {/* <div>resolved schema: {JSON.stringify(resolvedJzodSchema)}</div> */}
            <ThemedOnScreenHelper
              label={`currentDeploymentMetaModel.entities`}
              data={currentDeploymentModel.entities.map(e => ({name: e.name, uuid: e.uuid}))}
              initiallyUnfolded={false}
            />
            <ThemedOnScreenHelper
              label={`reportDefinitionFromFormik`}
              data={reportDefinitionFromFormik}
              initiallyUnfolded={false}
            />
            <ThemedOnScreenHelper
              label={`entities`}
              data={entities}
              initiallyUnfolded={false}
            />
            <ThemedOnScreenHelper
              label={`entityDefinitions`}
              data={entityDefinitions}
              initiallyUnfolded={false}
            />
            <ThemedOnScreenHelper
              label={`targetEntityUuid`}
              data={targetEntityUuid}
            />
            <ThemedOnScreenHelper
              label={`instance`}
              data={instance}
            />
            <ThemedOnScreenHelper
              label={`props.formValueMLSchema`}
              data={props.formValueMLSchema}
            />
            <ThemedOnScreenHelper
              label={`reportSectionDefinitionFromFormik`}
              data={reportSectionDefinitionFromFormik}
              initiallyUnfolded={false}
            />
            <ThemedOnScreenHelper
              label={`props.formikReportDefinitionPathString`}
              data={props.formikReportDefinitionPathString}
            />
            <ThemedOnScreenHelper
              label={`formikContext.values`}
              data={formikContext.values}
              initiallyUnfolded={false}
            />
            <ThemedPreformattedText>
              target entity definition:{" "}
              {currentReportSectionTargetEntityDefinition?.name ??
                "report target entity definition not found!"}
            </ThemedPreformattedText>
            <div> ######################################## </div>
            <ThemedPreformattedText>
              {/* entity jzod schema: {safeStringify(instance?.jzodSchema)} */}
              entity jzod schema: {JSON.stringify(instance?.jzodSchema, null, 2)}
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

