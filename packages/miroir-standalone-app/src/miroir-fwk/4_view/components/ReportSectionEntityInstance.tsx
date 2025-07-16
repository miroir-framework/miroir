import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Formik, FormikProps } from 'formik';
import { EditorView } from '@codemirror/view';
import ReactCodeMirror from '@uiw/react-codemirror';
import { performanceMetrics } from 'miroir-core';

import {
  ApplicationSection,
  DeploymentEntityState,
  Domain2QueryReturnType,
  DomainControllerInterface,
  DomainElementSuccess,
  Entity,
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  InstanceAction,
  JzodElement,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ResolvedJzodSchemaReturnType,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  SyncQueryRunnerParams,
  Uuid,
  adminConfigurationDeploymentMiroir,
  dummyDomainManyQueryWithDeploymentUuid,
  getApplicationSection,
  getQueryRunnerParamsForDeploymentEntityState,
  jzodTypeCheck,
  rootLessListKeyMap
} from "miroir-core";
import { getMemoizedDeploymentEntityStateSelectorMap } from 'miroir-localcache-redux';

import {
  useDomainControllerService,
  useErrorLogService, useMiroirContextService
} from "../MiroirContextReactProvider.js";

import { javascript } from '@codemirror/lang-javascript';
import { Switch } from '@mui/material';
import { packageName } from '../../../constants.js';
import { JzodEnumSchemaToJzodElementResolver, getCurrentEnumJzodSchemaResolver } from '../../JzodTools.js';
import { cleanLevel } from '../constants.js';
import {
  useCurrentModel,
  useDeploymentEntityStateQuerySelectorForCleanedResult
} from "../ReduxHooks.js";
import { JzodElementDisplay } from './JzodElementDisplay.js';
import { JzodElementEditor } from './JzodElementEditor.js';
import {
  measuredGetApplicationSection,
  measuredGetQueryRunnerParamsForDeploymentEntityState,
  measuredJzodTypeCheck,
  measuredRootLessListKeyMap,
} from "../tools/hookPerformanceMeasure.js";
import { RenderPerformanceMetrics } from '../tools/renderPerformanceMeasure.js';
// import { GlobalRenderPerformanceDisplay, RenderPerformanceDisplay, trackRenderPerformance } from '../tools/renderPerformanceMeasure.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionEntityInstance")
).then((logger: LoggerInterface) => {log = logger});


// Performance metrics display component
const PerformanceMetricsDisplay = () => {
  // Only render if we have performance metrics to display
  if (Object.keys(performanceMetrics).length === 0) return null;

  return (
    <div style={{ 
      fontSize: '0.8rem', 
      color: '#333', 
      position: 'absolute', 
      right: '10px', 
      top: '10px',
      background: 'rgba(255,255,255,0.9)',
      padding: '6px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      zIndex: 1000,
      maxWidth: '300px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', marginBottom: '4px', paddingBottom: '2px' }}>
        Performance Metrics
      </div>
      {Object.entries(performanceMetrics).map(([funcName, metrics]: [string, any]) => (
        <div key={funcName} style={{ marginTop: '4px', fontSize: '0.75rem' }}>
          <div style={{ fontWeight: 'bold' }}>{funcName}:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '0 8px' }}>
            <span>Calls:</span><span>{metrics.callCount}</span>
            <span>Total:</span><span>{metrics.totalTime.toFixed(1)}ms</span>
            <span>Avg:</span><span>{(metrics.totalTime / metrics.callCount).toFixed(2)}ms</span>
            <span>Min/Max:</span><span>{metrics.minDuration.toFixed(1)}ms / {metrics.maxDuration.toFixed(1)}ms</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export interface ReportSectionEntityInstanceProps {
  instance?: EntityInstance,
  domainElement?: Record<string,any>,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  entityUuid: Uuid,
}

const codeMirrorExtensions = [javascript()];

// const label = { inputProps: { 'aria-label': 'Color switch demo' } };

let ReportSectionEntityInstanceCount = 0
// ###############################################################################################################
export const ReportSectionEntityInstance = (props: ReportSectionEntityInstanceProps) => {
  const renderStartTime = performance.now();
  // const componentKey = `ReportSectionEntityInstance-${props.entityUuid}`;
  // const componentKey = `ReportSectionEntityInstance-${props.instance?.uuid || props.entityUuid}`;


  const errorLog = useErrorLogService();
  const context = useMiroirContextService();

  log.info(
    "++++++++++++++++++++++++++++++++ render",
    ReportSectionEntityInstanceCount++,
    "with props",
    props
  );

  const [displayAsStructuredElement, setDisplayAsStructuredElement] = useState(true);
  const [displayEditor, setDisplayEditor] = useState(true);

  // const [formState, setFormState] = useState<any>(props.instance);
  // const [codeMirrorValue, setCodeMirrorValue] = useState<string>(() =>
  //   // "\"start!\""
  //   JSON.stringify(currentValue, null, 2)
  // );

  const instance: any = props.instance;

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> =
    useMemo(() => getMemoizedDeploymentEntityStateSelectorMap(), []);

  const currentModel: MetaModel = useCurrentModel(
    context.applicationSection == "data" ? context.deploymentUuid : adminConfigurationDeploymentMiroir.uuid
  );

  const domainController: DomainControllerInterface = useDomainControllerService();
  
  const currentReportDeploymentSectionEntities: Entity[] = currentModel.entities; // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section

  log.info(
    "ReportSectionEntityInstance currentReportDeploymentSectionEntities",
    currentReportDeploymentSectionEntities
  );

  const currentReportTargetEntity: Entity | undefined = currentReportDeploymentSectionEntities?.find(
    (e) => e?.uuid === props.entityUuid
  );

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  const entityJzodSchemaDefinition: { [attributeName: string]: JzodElement } | undefined =
    currentReportTargetEntityDefinition?.jzodSchema.definition;

  const pageLabel: string = props.applicationSection + "." + currentReportTargetEntity?.name;

  const labelElement = useMemo(() => {
    return pageLabel ? <span id={"label." + pageLabel}>{pageLabel}</span> : undefined;
  }, [pageLabel]);

  const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver | undefined = useMemo(
    () =>
      context.miroirFundamentalJzodSchema
        ? getCurrentEnumJzodSchemaResolver(currentMiroirModel, context.miroirFundamentalJzodSchema)
        : undefined,
    [context.miroirFundamentalJzodSchema, currentMiroirModel]
  );

  // log.info("ReportSectionEntityInstance instance", instance);
  // log.info("ReportSectionEntityInstance entityJzodSchema", entityJzodSchemaDefinition);
  // log.info("ReportSectionEntityInstance miroirFundamentalJzodSchema", context.miroirFundamentalJzodSchema);
  // log.info("ReportSectionEntityInstance currentReportTargetEntityDefinition", currentReportTargetEntityDefinition);
  // log.info("ReportSectionEntityInstance currentModel", currentModel);
  // log.info("ReportSectionEntityInstance currentMiroirModel", currentMiroirModel);
  let typeError: JSX.Element | undefined = undefined;
  const resolvedJzodSchema: ResolvedJzodSchemaReturnType | undefined = useMemo(() => {
    let result: ResolvedJzodSchemaReturnType | undefined = undefined;
    try {
      result =
        context.miroirFundamentalJzodSchema &&
        currentReportTargetEntityDefinition?.jzodSchema &&
        instance &&
        currentModel
          ? measuredJzodTypeCheck(
              currentReportTargetEntityDefinition?.jzodSchema,
              instance,
              [], // currentValuePath
              [], // currentTypePath
              context.miroirFundamentalJzodSchema,
              currentModel,
              currentMiroirModel,
              {}
            )
          : undefined;
    } catch (e) {
      log.error(
        "ReportSectionEntityInstance useMemo error",
        // JSON.stringify(e, Object.getOwnPropertyNames(e)),
        e,
        "props",
        props,
        "context",
        context
      );
      result = {
        status: "error",
        valuePath: [],
        typePath: [],
        error: JSON.stringify(e, Object.getOwnPropertyNames(e)),
      };
    }
    return result;
  }, [props, currentReportTargetEntityDefinition, instance, context]);
  log.info(
    "ReportSectionEntityInstance jzodTypeCheck done, resolvedJzodSchema",
    resolvedJzodSchema,
  );

  useEffect(() => {
    // Track render performance at the end of render
    // if (props.instance) {
    if (props.instance?.uuid) {
      const componentKey = `ReportSectionEntityInstance-${props.instance?.uuid || props.entityUuid}`
      const renderEndTime = performance.now();
      const renderDuration = renderEndTime - renderStartTime;
      const currentMetrics = RenderPerformanceMetrics.trackRenderPerformance(componentKey, renderDuration);
  
      // Log performance every 50 renders or if render took longer than 10ms
      if (currentMetrics.renderCount % 50 === 0 || renderDuration > 10) {
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
  }, [props.instance, props.entityUuid]);
  // });
  
  if (!resolvedJzodSchema || resolvedJzodSchema.status != "ok") {
    log.error(
      "ReportSectionEntityInstance could not resolve jzod schema",
      // props,
      // context,
      resolvedJzodSchema
    );
    // return <>ReportSectionEntityInstance: could not resolve jzod schema: {JSON.stringify(resolvedJzodSchema)}</>;
    // typeError = <>ReportSectionEntityInstance: could not resolve jzod schema: {JSON.stringify(resolvedJzodSchema, null, 2)}</>;
    // Calculate the maximum line width for fixed sizing
    const jsonString = JSON.stringify(resolvedJzodSchema, null, 2);
    const lines = jsonString.split("\n");
    const maxLineLength = Math.max(...lines.map((line) => line.length));
    const fixedWidth = Math.min(Math.max(maxLineLength * 0.6, 1200), 1800); // 0.6px per character, min 400px, max 1200px

    typeError = (
      <ReactCodeMirror
        editable={false}
        height="100ex"
        style={{
          width: `${fixedWidth}px`, // Fixed width based on content
          maxWidth: "90vw", // Prevent overflow on small screens
        }}
        value={jsonString}
        extensions={[
          ...codeMirrorExtensions,
          EditorView.lineWrapping, // Enable line wrapping
          EditorView.theme({
            ".cm-editor": {
              width: `${fixedWidth}px`,
            },
            ".cm-scroller": {
              width: "100%",
              overflowX: "auto", // Enable horizontal scrolling if needed
            },
            ".cm-content": {
              minWidth: `${fixedWidth}px`,
            },
          }),
        ]}
        basicSetup={{
          foldGutter: true,
          lineNumbers: true,
        }}
      />
    );
  }

  
  const foreignKeyObjectsFetchQueryParams: SyncQueryRunnerParams<DeploymentEntityState> = useMemo(
    () =>
      measuredGetQueryRunnerParamsForDeploymentEntityState(
        props.deploymentUuid &&
          resolvedJzodSchema &&
          resolvedJzodSchema.status == "ok" &&
          resolvedJzodSchema.resolvedSchema.type == "uuid" &&
          resolvedJzodSchema.resolvedSchema.tag?.value?.targetEntity
          ? {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              deploymentUuid: props.deploymentUuid,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractors: {
                [resolvedJzodSchema.resolvedSchema.tag?.value?.targetEntity]: {
                  extractorOrCombinerType: "extractorByEntityReturningObjectList",
                  applicationSection: measuredGetApplicationSection(
                    props.deploymentUuid,
                    resolvedJzodSchema.resolvedSchema.tag?.value?.targetEntity
                  ),
                  parentName: "",
                  parentUuid: resolvedJzodSchema.resolvedSchema.tag?.value?.targetEntity,
                },
              },
            }
          : dummyDomainManyQueryWithDeploymentUuid,
        deploymentEntityStateSelectorMap
      ),
    [deploymentEntityStateSelectorMap, props.deploymentUuid, resolvedJzodSchema]
  );
  
  const foreignKeyObjects: Record<string, EntityInstancesUuidIndex> =
    useDeploymentEntityStateQuerySelectorForCleanedResult(
      deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
        DeploymentEntityState,
        Domain2QueryReturnType<DomainElementSuccess>
      >,
      foreignKeyObjectsFetchQueryParams
    );
  
  // ##############################################################################################
  // const handleDisplayAsStructuredElementSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setDisplayAsStructuredElement(event.target.checked);
  // };
  
  // ##############################################################################################
  const handleDisplayEditorSwitchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayEditor(event.target.checked);
  },[setDisplayEditor]);
  
  // ##############################################################################################
  const onEditFormObject = useCallback(
    async (data: any) => {
      // const newEntity:EntityInstance = Object.assign({...data as EntityInstance},{attributes:dialogFormObject?dialogFormObject['attributes']:[]});
      log.info("ReportComponent onEditFormObject called with new object value", data);

      if (props.deploymentUuid) {
        if (props.applicationSection == "model") {
          await domainController.handleAction(
            {
              actionType: "transactionalInstanceAction",
              instanceAction: {
                // actionType: "instanceAction",
                actionType: "updateInstance",
                applicationSection: "model",
                deploymentUuid: props.deploymentUuid,
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
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
            // props.tableComponentReportType == "EntityInstance" ? currentModel : undefined
            currentModel
          );
        } else {
          const updateAction: InstanceAction = {
            // actionType: "instanceAction",
            actionType: "updateInstance",
            applicationSection: props.applicationSection
              ? props.applicationSection
              : "data",
            deploymentUuid: props.deploymentUuid,
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
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
          };
          await domainController.handleAction(updateAction);
        }
      } else {
        throw new Error(
          "ReportSectionEntityInstance onEditFormObject props.deploymentUuid is undefined."
        );
      }
    },
    [domainController, props]
  );
  
  // // ##############################################################################################
  // const onCodeEditorChange = useCallback((values:any, viewUpdate:any) => {
  //   log.info('edit code received value:', values);
  //   // setdialogOuterFormObject(JSON.parse(values))
  //   log.info('edit code done');
  // }, []);
  log.info("ReportSectionEntityInstance start rendering!");
  const globalRenderPerformanceDisplayElement = useMemo(() => {
    return (
      <RenderPerformanceMetrics.GlobalRenderPerformanceDisplay
        renderMetrics={RenderPerformanceMetrics.renderMetrics}
      />
    );
  }, [props.instance, props.entityUuid, RenderPerformanceMetrics.renderMetrics]);
  // ##############################################################################################
  if (instance) {
    return (
      <div>
        {/* <RenderPerformanceMetrics.GlobalRenderPerformanceDisplay /> */}
        { globalRenderPerformanceDisplayElement }
        <div>
          {/* <RenderPerformanceDisplay componentKey={componentKey} indentLevel={0} /> */}

          <p>ReportSectionEntityInstance: {ReportSectionEntityInstanceCount}</p>
          <div>
            {typeError ? "typeError: " : ""}
            <pre>{typeError ?? <></>}</pre>
          </div>

          {/* <div>
            <pre>
              {JSON.stringify(resolvedJzodSchema.element, null, 2)}
            </pre>
          </div> */}
          <div>
            {/* <label htmlFor="displayAsStructuredElementSwitch">Display as structured element:</label>
            <Switch
              checked={displayAsStructuredElement}
              id="displayAsStructuredElementSwitch"
              onChange={handleDisplayAsStructuredElementSwitchChange}
              inputProps={{ "aria-label": "Display as structured element" }}
            /> */}
            <label htmlFor="displayEditorSwitch">Display editor:</label>
            <Switch
              checked={displayEditor}
              id="displayEditorSwitch"
              onChange={handleDisplayEditorSwitchChange}
              inputProps={{ "aria-label": "Edit" }}
            />
          </div>
          <div>
            <span>
              displayAsStructuredElement: {displayAsStructuredElement ? "true" : "false"}{" "}
              displayEditor: {displayEditor ? "true" : "false"} hasTypeError:{" "}
              {typeError ? "true" : "false"}{" "}
            </span>
          </div>
          <h1>
            {currentReportTargetEntity?.name} details: {instance.name}{" "}
          </h1>
          {currentReportTargetEntity &&
          currentEnumJzodSchemaResolver &&
          currentReportTargetEntityDefinition &&
          context.applicationSection ? (
            // resolvedJzodSchema &&
            // (resolvedJzodSchema as any)?.status == "ok"
            displayEditor ? (
              <div>
                <Formik
                  enableReinitialize={true}
                  initialValues={instance}
                  // onSubmit={onSubmit}
                  onSubmit={async (values, { setSubmitting, setErrors }) => {
                    try {
                      log.info("onSubmit formik values", values);
                      // if (onCreateFormObject) {
                      //   log.info("onSubmit formik onCreateFormObject", values);
                      //   await onCreateFormObject(values);
                      //   await onSubmit(values);
                      // } else {
                      // log.info("onSubmit formik handleAddObjectDialogFormSubmit", values);
                      // // setformHelperState(values);
                      // await handleAddObjectDialogFormSubmit(values, "param");
                      // }
                      await onEditFormObject(values);
                    } catch (e) {
                      log.error(e);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  validateOnChange={false}
                  validateOnBlur={false}
                >
                  {(formik: FormikProps<Record<string, any>>) => {
                    // Create a memoized localRootLessListKeyMap that updates when formik values change
                    const dynamicLocalRootLessListKeyMap = useMemo(() => {
                      try {
                        const result =
                          context.miroirFundamentalJzodSchema != undefined &&
                          currentReportTargetEntityDefinition?.jzodSchema &&
                          resolvedJzodSchema &&
                          resolvedJzodSchema.status == "ok" &&
                          formik.values &&
                          currentModel
                            ? measuredRootLessListKeyMap(
                                "",
                                currentReportTargetEntityDefinition?.jzodSchema,
                                undefined, // resolvedJzodSchema.resolvedSchema may not correspond to the value in formik.values
                                currentModel,
                                currentMiroirModel,
                                context.miroirFundamentalJzodSchema,
                                formik.values
                              )
                            : undefined;
                        log.info(
                          "ReportSectionEntityInstance dynamicLocalRootLessListKeyMap result",
                          result,
                          "for currentReportTargetEntityDefinition",
                          currentReportTargetEntityDefinition?.name
                        );
                        return result;
                      } catch (e) {
                        log.warn(
                          "ReportSectionEntityInstance dynamicLocalRootLessListKeyMap error",
                          ReportSectionEntityInstanceCount,
                          e
                          // "props",
                          // props,
                          // "context",
                          // context
                        );
                        return undefined;
                      }
                    }, [
                      currentReportTargetEntityDefinition?.jzodSchema,
                      currentModel,
                      currentMiroirModel,
                      context.miroirFundamentalJzodSchema,
                      formik.values,
                    ]);

                    return (
                      <>
                        <form id={"form." + pageLabel} onSubmit={formik.handleSubmit}>
                          <div>
                            <JzodElementEditor
                              name={"ROOT"}
                              listKey={"ROOT"}
                              rootLessListKey=""
                              rootLessListKeyArray={[]}
                              labelElement={labelElement}
                              indentLevel={0}
                              currentDeploymentUuid={props.deploymentUuid}
                              currentApplicationSection={props.applicationSection}
                              rawJzodSchema={currentReportTargetEntityDefinition?.jzodSchema}
                              resolvedElementJzodSchema={
                                resolvedJzodSchema?.status == "ok"
                                  ? resolvedJzodSchema.resolvedSchema
                                  : undefined
                              }
                              hasTypeError={typeError != undefined}
                              localRootLessListKeyMap={dynamicLocalRootLessListKeyMap}
                              // localRootLessListKeyMap={{}}
                              foreignKeyObjects={foreignKeyObjects}
                              submitButton={
                                <button
                                  type="submit"
                                  role="form"
                                  name={pageLabel}
                                  form={"form." + pageLabel}
                                >
                                  submit form.{pageLabel}
                                </button>
                              }
                              // displayAsCode={!displayAsStructuredElement}
                            />
                          </div>
                        </form>
                      </>
                    );
                  }}
                </Formik>
              </div>
            ) : (
              <div>
                {displayAsStructuredElement ? (
                  <JzodElementDisplay
                    path={instance?.name}
                    name={instance?.name}
                    deploymentUuid={props.deploymentUuid}
                    // prop drilling!
                    applicationSection={context.applicationSection as ApplicationSection}
                    entityUuid={props.entityUuid}
                    element={instance}
                    // rootJzodSchema={currentReportTargetEntityDefinition?.jzodSchema}
                    elementJzodSchema={currentReportTargetEntityDefinition?.jzodSchema}
                    resolvedElementJzodSchema={(resolvedJzodSchema as any)?.resolvedSchema}
                    currentReportDeploymentSectionEntities={currentReportDeploymentSectionEntities}
                    currentEnumJzodSchemaResolver={currentEnumJzodSchemaResolver}
                  ></JzodElementDisplay>
                ) : (
                  <div>
                    <pre>{JSON.stringify(instance, null, 2)}</pre>
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
              <div>resolved schema: {JSON.stringify(resolvedJzodSchema)}</div>
              <div style={{ whiteSpace: "pre-line" }}>
                target entity definition:{" "}
                {currentReportTargetEntityDefinition?.name ??
                  "report target entity definition not found!"}
              </div>
              <div> ######################################## </div>
              <div style={{ whiteSpace: "pre-line" }}>
                entity jzod schema: {JSON.stringify(instance?.jzodSchema)}
              </div>
            </div>
          )}
        </div>
        <PerformanceMetricsDisplay />
      </div>
    );
  } else {
    return <>ReportSectionEntityInstance: No instance to display!</>;
  }
};
