import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { FormikProps, useFormikContext } from "formik";

import {
  ACTION_OK,
  adminConfigurationDeploymentMiroir,
  ApplicationSection,
  defaultMetaModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  Domain2QueryReturnType,
  DomainElementSuccess,
  dummyDomainManyQueryWithDeploymentUuid,
  EntityInstancesUuidIndex,
  getApplicationSection,
  getInnermostTypeCheckError,
  getQueryRunnerParamsForReduxDeploymentsState,
  getSchemaAtPath,
  getValueAtPath,
  JzodElement,
  jzodTypeCheck,
  LoggerInterface,
  MetaModel,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  ResolvedJzodSchemaReturnType,
  selfApplicationMiroir,
  setValueAtPath,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  SyncQueryRunnerExtractorAndParams,
  Uuid,
  type ApplicationDeploymentMap,
  type JzodObject,
  type MlSchema,
  type MiroirModelEnvironment
} from "miroir-core";
import {
  getMemoizedReduxDeploymentsStateSelectorMap,
  ReduxStateWithUndoRedo
} from "miroir-localcache-redux";

import {
  useMiroirContextService
} from "../../MiroirContextReactProvider.js";

import { javascript } from '@codemirror/lang-javascript';
import { ErrorBoundary } from "react-error-boundary";
import { packageName } from '../../../../constants.js';
import { cleanLevel, lastSubmitButtonClicked } from '../../constants.js';
import {
  useCurrentModel,
  useCurrentModelEnvironment,
  useReduxDeploymentsStateQuerySelectorForCleanedResult
} from "../../ReduxHooks.js";
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import { RenderPerformanceMetrics } from '../../tools/renderPerformanceMeasure.js';
import { ErrorFallbackComponent } from '../ErrorFallbackComponent.js';
import { ThemedOnScreenHelper, ThemedStyledButton } from '../Themes/index.js';
import { JzodElementEditor } from '../ValueObjectEditor/JzodElementEditor.js';
import { CodeBlock_ReadOnly } from './CodeBlock_ReadOnly.js';
import { ActionButtonWithSnackbar } from '../Page/ActionButtonWithSnackbar.js';
import { ThemedOnScreenDebug } from '../Themes/BasicComponents.js';
import type { ValueObjectEditMode } from './ReportSectionEntityInstance.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TypedValueObjectEditor"), "UI",
).then((logger: LoggerInterface) => {log = logger});

const codeMirrorExtensions = [javascript()];


// ################################################################################################
// ################################################################################################
// ################################################################################################
// Extracted editor component for ReportSectionEntityInstance
export interface TypedValueObjectEditorProps {
  valueObjectEditMode: ValueObjectEditMode
  labelElement: React.ReactElement | undefined;
  // 
  // zoom functionality
  zoomInPath?: string; // Optional path like "x.y.z" to zoom into a subset of the instance
  // established on the basis of the report section target entity schema, does not take zoomInPath into account!
  formValueMLSchema: JzodObject;
  formikValuePathAsString: string; 
  // 
  application: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  domainElement?: Record<string,any>,
  // readonly mode
  readonly?: boolean; // Whether the editor should be readonly (no submit button, no editing)
  // Note: Outline props removed since using context now
  // ancillary props
  showPerformanceDisplay?: boolean;
  formLabel: string;
  displayError?: {
    errorPath: string[]; // Path to element that should be highlighted with red border due to error
    errorMessage: string; // Error message to display as tooltip or title
  };
  // fold / unfold element
  // depth control
  maxRenderDepth?: number; // Optional max depth for initial rendering, default 1
  // error highlighting
  displaySubmitButton?: "onTop" | "onFirstLine" | "noDisplay";
  useActionButton?: boolean; // Whether to use ActionButtonWithSnackbar (async) instead of ThemedStyledButton
  // navigationCount: number;
  // external field change observation
  onChangeVector?: Record<string, (value: any, rootLessListKey: string) => void>; // callbacks indexed by rootLessListKey for selective field observation
  // when displayed in a JzodObjectEditFormDialog modal dialog form
  setAddObjectdialogFormIsOpen?: (a:boolean) => void,
}
 let count = 0;
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * 
 * hooks used:
 * useMiroirContextService
 * useFormikContext
 * useRenderTracker
 * useCurrentModel
 * @param param0 
 * @returns 
 */
export const TypedValueObjectEditor: React.FC<TypedValueObjectEditorProps> = ({
  labelElement,
  // 
  // zoom
  zoomInPath, // display only a subset of the valueObject, like "x.y.z"
  formValueMLSchema,
  formikValuePathAsString,
  // 
  application,
  applicationDeploymentMap,
  deploymentUuid,
  applicationSection,
  // depth control
  maxRenderDepth = 1,
  // readonly mode
  readonly = false,
  // error highlighting
  displayError,
  // 
  formLabel, // TODO: remove
  displaySubmitButton,
  useActionButton = false,
  // navigationCount,
  onChangeVector,
  ...props
}) => {
  const renderStartTime = performance.now();
  const context = useMiroirContextService();
  const componentKey = `TypedValueObjectEditor-${deploymentUuid}-${applicationSection}`;
  // Access Formik from context (Formik is created in parent component)
  // const formik = useFormikValueObject();
  const formik = useFormikContext<Record<string, any>>();

  const navigationKey = `${deploymentUuid}-${applicationSection}`;
  const { navigationCount, totalCount } = useRenderTracker("FreeFormEditor", navigationKey);

  // Handle zoom functionality
  const hasZoomPath = zoomInPath && zoomInPath.trim() !== '';
  const valueObject = formik.values[formikValuePathAsString];
  const zoomedInValueObject_DEFUNCT = hasZoomPath ? getValueAtPath(valueObject, zoomInPath) : valueObject;
  const zoomedInDisplaySchema = formValueMLSchema.definition[formikValuePathAsString]; 


  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      log.info("TypedValueObjectEditor onSubmit called", e, formikValuePathAsString);
      // e.preventDefault();
      if (useActionButton) {
        e.preventDefault();
        log.info("TypedValueObjectEditor form submit prevented (useActionButton=true)");
        return false;
      }
      await formik.handleSubmit(e);
      if (props.setAddObjectdialogFormIsOpen) {
        log.info("TypedValueObjectEditor closing AddObjectdialogForm after submit");
        props.setAddObjectdialogFormIsOpen(false); // close the dialog form after submit
        log.info("TypedValueObjectEditor closing AddObjectdialogForm after submit DONE");
      } else {
        log.info(
          "TypedValueObjectEditor no setAddObjectdialogFormIsOpen prop, not closing dialog form"
        );
      }
    },
    [formik, formikValuePathAsString, useActionButton, props.setAddObjectdialogFormIsOpen]
  );
  // Log zoom functionality usage
  // if (hasZoomPath) {
  //   log.info(
  //     "TypedValueObjectEditor using zoom path",
  //     "zoomInPath", zoomInPath,
  //     "original valueObject", valueObject,
  //     "displayValueObject", displayValueObject,
  //     "original schema", valueObjectMMLSchema,
  //     "displaySchema", displaySchema
  //   );
  // }

  // Handle error case where zoom path doesn't exist
  if (hasZoomPath && zoomedInValueObject_DEFUNCT === undefined) {
    return (
      <div style={{ padding: '16px', border: '1px solid #ff9800', borderRadius: '4px', backgroundColor: '#fff3e0' }}>
        <div style={{ color: '#f57c00', fontWeight: 'bold', marginBottom: '8px' }}>
          Zoom Path Error
        </div>
        <div>The zoom path "{zoomInPath}" does not exist in the current object.</div>
        <div style={{ marginTop: '8px', fontSize: '0.9em', color: '#666' }}>
          Available top-level keys: {valueObject ? Object.keys(valueObject).join(', ') : 'none'}
        </div>
      </div>
    );
  }

  // Handle error case where zoom path results in invalid schema
  if (hasZoomPath && !zoomedInDisplaySchema) {
    return (
      <div style={{ padding: '16px', border: '1px solid #ff9800', borderRadius: '4px', backgroundColor: '#fff3e0' }}>
        <div style={{ color: '#f57c00', fontWeight: 'bold', marginBottom: '8px' }}>
          Schema Path Error
        </div>
        <div>The zoom path "{zoomInPath}" does not correspond to a valid schema path.</div>
      </div>
    );
  }

  // ##############################################################################################
  const currentApplication: Uuid = applicationSection == "data" ? application : selfApplicationMiroir.uuid;
  const currentModel: MetaModel = useCurrentModel(currentApplication, applicationDeploymentMap);

  // Get the deployment entity state from Redux store for ifThenElse schema resolution
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    getMemoizedReduxDeploymentsStateSelectorMap();
  
  const reduxDeploymentsState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
        () => ({}),
        defaultMetaModelEnvironment
      )
  );

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    currentApplication,
    applicationDeploymentMap
  );
  // const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
  //     return {
  //       miroirFundamentalJzodSchema: context.miroirFundamentalJzodSchema?? miroirFundamentalJzodSchema as MlSchema,
  //       miroirMetaModel: currentMiroirModel,
  //       currentModel: currentModel,
  //     };
  //   }, [
  //     currentMiroirModel,
  //     currentModel,
  //     context.miroirFundamentalJzodSchema,
  //   ]);
  

  // log.info(
  //   "TypedValueObjectEditor render",
  //   "navigationCount",
  //   navigationCount,
  //   "instance",
  //   valueObject,
  //   "valueObjectMMLSchema",
  //   valueObjectMMLSchema,
  //   "hasZoomPath",
  //   hasZoomPath,
  //   "displayValueObject",
  //   displayValueObject,
  //   "displaySchema",
  //   displaySchema
  // );
  
  
  let typeError: JSX.Element | undefined = undefined;
  const jzodTypeCheckResult: ResolvedJzodSchemaReturnType | undefined = useMemo(() => {
    let result: ResolvedJzodSchemaReturnType | undefined = undefined;
    try {
      result =
        context.miroirFundamentalJzodSchema && zoomedInDisplaySchema && formik.values && currentModel
          ? jzodTypeCheck( // TODO: typecheck only the value for the currently edited instance / object, not the whole formik.values
              formValueMLSchema.definition[formikValuePathAsString], 
              valueObject, // this leads to an error for now if there are multiple instances in the formik values
              [],
              [],
              currentMiroirModelEnvironment,
              {}, // relativeReferenceJzodContext
              // formik.values,// formik.values, // currentDefaultValue
              valueObject, // currentDefaultValue
              reduxDeploymentsState,
              deploymentUuid, // Now passing the actual deploymentUuid
              // formik.values,// rootObject - use full object for context, but validate the subset
              valueObject, //formik.values // rootObject - use full object for context, but validate the subset
              // hasZoomPath ? valueObject : formik.values // rootObject - use full object for context, but validate the subset
            )
          : undefined;
    } catch (e) {
      log.error("TypedValueObjectEditor useMemo error", e, context);
      result = {
        status: "error",
        valuePath: [],
        typePath: [],
        error: JSON.stringify(e, Object.getOwnPropertyNames(e)),
      };
    }
    return result;
  }, [
    currentModel,
    currentMiroirModelEnvironment,
    context,
    context.miroirFundamentalJzodSchema,
    deploymentUuid,
    zoomedInDisplaySchema,
    formik.values,
    formValueMLSchema,
    formikValuePathAsString,
    hasZoomPath,
    reduxDeploymentsState,
    valueObject,
  ]);
  // log.info(
  //   "TypedValueObjectEditor jzodTypeCheck done for render",
  //   navigationCount,
  //   "formik.values",
  //   formik.values,
  //   "zoomedInDisplaySchema",
  //   zoomedInDisplaySchema,
  //   "jzodTypeCheckResult",
  //   jzodTypeCheckResult
  // );
  // extruding typeCheckKeyMap to context for Outline usage
  useEffect(() => {
    if (
      jzodTypeCheckResult &&
      jzodTypeCheckResult.status == "ok" &&
      jzodTypeCheckResult.keyMap
      // context.typeCheckKeyMap !== jzodTypeCheckResult.keyMap
    ) {
      // log.info(
      //   "Outline: TypedValueObjectEditor updating context typeCheckKeyMap",
      //   jzodTypeCheckResult.keyMap
      // );
      if (context.setTypeCheckKeyMap) {
        context.setTypeCheckKeyMap(jzodTypeCheckResult.keyMap);
      } else {
        log.warn(
          "TypedValueObjectEditor context.setTypeCheckKeyMap is undefined, cannot set typeCheckKeyMap"
        );
      }
    }
  }, [jzodTypeCheckResult]);

  if (!jzodTypeCheckResult || jzodTypeCheckResult.status != "ok") {
    log.warn("TypedValueObjectEditor could not resolve jzod schema", jzodTypeCheckResult);
    // const jsonString = JSON.stringify(typeCheckKeyMap, null, 2);
    if (jzodTypeCheckResult) {
      const jsonString: string = JSON.stringify(
        getInnermostTypeCheckError(jzodTypeCheckResult as any),
        null,
        2
      );
      typeError = <div>
        <ThemedOnScreenHelper
          label={`TypedValueObjectEditor for schema at ${formikValuePathAsString}`}
          data={formValueMLSchema}
          initiallyUnfolded={false}
        />
        <ThemedOnScreenHelper
          label={`TypedValueObjectEditor for valueObject`}
          data={valueObject}
          initiallyUnfolded={false}
        />
        <CodeBlock_ReadOnly value={jsonString} copyButton={true} />;
        </div>
    } else {
      typeError = <div>Could not resolve jzod schema
        <ThemedOnScreenHelper
          label={`TypedValueObjectEditor for ${formikValuePathAsString} jzodTypeCheckResult`}
          data={jzodTypeCheckResult}
        />
        <ThemedOnScreenHelper
          label={`TypedValueObjectEditor for schema at ${formikValuePathAsString}`}
          data={formValueMLSchema}
        />
        <ThemedOnScreenHelper
          label={`TypedValueObjectEditor for value`}
          data={valueObject}
        />
      </div>;
    }
  }

  const foreignKeyObjectsFetchQueryParams: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState> = useMemo(
    () =>
      getQueryRunnerParamsForReduxDeploymentsState(
        deploymentUuid &&
          jzodTypeCheckResult &&
          jzodTypeCheckResult.status == "ok" &&
          jzodTypeCheckResult.resolvedSchema.type == "uuid" &&
          jzodTypeCheckResult.resolvedSchema.tag?.value?.foreignKeyParams?.targetEntity
          ? {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application,
              deploymentUuid,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractors: {
                [jzodTypeCheckResult.resolvedSchema.tag?.value?.foreignKeyParams?.targetEntity]: {
                  extractorOrCombinerType: "extractorByEntityReturningObjectList",
                  applicationSection: getApplicationSection(
                    deploymentUuid,
                    jzodTypeCheckResult.resolvedSchema.tag?.value?.foreignKeyParams?.targetEntity
                  ),
                  parentName: "",
                  parentUuid:
                    jzodTypeCheckResult.resolvedSchema.tag?.value?.foreignKeyParams?.targetEntity,
                },
              },
            }
          : dummyDomainManyQueryWithDeploymentUuid,
        // applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
        deploymentEntityStateSelectorMap
      ),
    [deploymentEntityStateSelectorMap, deploymentUuid, jzodTypeCheckResult]
  );

  const foreignKeyObjects: Record<string, EntityInstancesUuidIndex> =
    useReduxDeploymentsStateQuerySelectorForCleanedResult(
      deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
        ReduxDeploymentsState,
        Domain2QueryReturnType<DomainElementSuccess>
      >,
      foreignKeyObjectsFetchQueryParams,
      applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
    ) || {};

  // log.info(
  //   "TypedValueObjectEditor foreignKeyObjects fetched for",
  //   formikValuePathAsString,
  //   "foreignKeyObjects",
  //   foreignKeyObjects,
  //   "keys", Object.keys(foreignKeyObjects)
  // );

  const submitButton = useActionButton ? (
    // TODO: using ActionButtonWithSnackbar is useless, formik.submitForm does not return a result (only Promise<void>)
    <ActionButtonWithSnackbar
      onAction={async () => {
        log.info("TypedValueObjectEditor ActionButtonWithSnackbar async submit button clicked", formikValuePathAsString);
        formik.setFieldValue(lastSubmitButtonClicked, formikValuePathAsString);
        const result = await formik.submitForm();
        log.info("TypedValueObjectEditor async submit button action done", result);
        // return Promise.resolve(result);
        return Promise.resolve(ACTION_OK);
      }}
      successMessage={`${formLabel} completed successfully`}
      label={formLabel}
      actionName={formLabel}
      type="button" // no form submit happening!
      variant="contained"
      style={{ maxWidth: "300px" }}
    />
  ) : (
    <ThemedStyledButton
      type="submit"
      variant="contained"
      style={{ maxWidth: "300px" }}
      onClick={(e) => {
        log.info("TypedValueObjectEditor submit button clicked", e);
        formik.setFieldValue(lastSubmitButtonClicked, formikValuePathAsString);
        formik.setFieldValue(lastSubmitButtonClicked + "_mode", props.valueObjectEditMode);
      }}
    >
      {/* Submit {formLabel} */}
      {formLabel}
    </ThemedStyledButton>
  );
  const resolvedElementJzodSchema =
    jzodTypeCheckResult?.status == "ok" ? jzodTypeCheckResult.resolvedSchema : undefined;

  const result = (
    <>
      {/* <div> */}
        {/* <ThemedOnScreenHelper
          label={`TypedValueObjectEditor for ${formikValuePathAsString} (navigationCount: ${navigationCount}, totalCount: ${totalCount})`}
          data={formValueMLSchema}
        /> */}
        {/* <ThemedOnScreenHelper
          label={`TypedValueObjectEditor for ${formikValuePathAsString} valueObject`}
          data={valueObject}
        /> */}
      {typeError && (<span>"typeError: "{typeError}</span>) }
      <ThemedOnScreenDebug
        label={`TypedValueObjectEditor Render Performance Metrics for ${formikValuePathAsString} mode "${props.valueObjectEditMode}"`}
        data={props}
        copyButton={true}
        initiallyUnfolded={false}
        useCodeBlock={true}
      />
      {/* </div> */}
      {/* <ThemedOnScreenHelper
        label={`TypedValueObjectEditor: "${formikValuePathAsString}"`}
        data={{
          resolvedElementJzodSchema,
          // formValueMLSchema,
          formik: formik.values,
          valueObject,
          foreignKeyObjects,
          error:
            jzodTypeCheckResult && jzodTypeCheckResult.status != "ok"
              ? getInnermostTypeCheckError(jzodTypeCheckResult as any)
              : undefined,
        }}
      /> */}

      {readonly ? (
        // Readonly mode: just display the editor without form
        <div>
          <ErrorBoundary
            FallbackComponent={({ error, resetErrorBoundary }) => (
              <ErrorFallbackComponent
                error={error}
                resetErrorBoundary={resetErrorBoundary}
                context={{
                  origin: "TypedValueObjectEditor",
                  objectType: "root_editor",
                  rootLessListKey: "ROOT",
                  currentValue: zoomedInValueObject_DEFUNCT,
                  formikValues: undefined,
                  rawJzodSchema: zoomedInDisplaySchema,
                  localResolvedElementJzodSchemaBasedOnValue:
                    jzodTypeCheckResult?.status == "ok"
                      ? jzodTypeCheckResult.resolvedSchema
                      : undefined,
                }}
              />
            )}
          >
            <JzodElementEditor
              valueObjectEditMode={props.valueObjectEditMode}
              // name={"ROOT" + (reportSectionPathAsString?("." + reportSectionPathAsString):"")}
              // isTopLevel={true}
              // listKey={"ROOT" + (reportSectionPathAsString?("." + reportSectionPathAsString):"")}
              // rootLessListKey={reportSectionPathAsString??""}
              // rootLessListKeyArray={reportSectionPathAsString?[reportSectionPathAsString]:[]}
              reportSectionPathAsString={formikValuePathAsString ?? ""}
              name={"ROOT"}
              isTopLevel={true}
              listKey={"ROOT"}
              rootLessListKey=""
              rootLessListKeyArray={[]}
              labelElement={labelElement}
              indentLevel={0}
              currentApplication={application}
              applicationDeploymentMap={applicationDeploymentMap}
              currentDeploymentUuid={deploymentUuid}
              currentApplicationSection={applicationSection}
              resolvedElementJzodSchemaDEFUNCT={
                jzodTypeCheckResult?.status == "ok" ? jzodTypeCheckResult.resolvedSchema : undefined
              }
              hasTypeError={typeError != undefined}
              typeCheckKeyMap={
                jzodTypeCheckResult?.status == "ok" ? jzodTypeCheckResult.keyMap : {}
              }
              foreignKeyObjects={foreignKeyObjects}
              maxRenderDepth={maxRenderDepth} // always 1
              readOnly={true}
              displayError={displayError}
              onChangeVector={onChangeVector}
            />
          </ErrorBoundary>
        </div>
      ) : (
        // Editable mode: wrap in form
        // TODO: is form actually needed here, since we have formik context already?
        <form
          id={"form." + formLabel}
          onSubmit={onSubmit}
        >
          <ErrorBoundary
            FallbackComponent={({ error, resetErrorBoundary }) => (
              <ErrorFallbackComponent
                error={error}
                resetErrorBoundary={resetErrorBoundary}
                context={{
                  origin: "TypedValueObjectEditor",
                  objectType: "root_editor",
                  rootLessListKey: "ROOT",
                  rootLessListKeyArray: [],
                  currentValue: zoomedInValueObject_DEFUNCT,
                  formikValues: undefined,
                  rawJzodSchema: zoomedInDisplaySchema,
                  localResolvedElementJzodSchemaBasedOnValue:
                    jzodTypeCheckResult?.status == "ok"
                      ? jzodTypeCheckResult.resolvedSchema
                      : undefined,
                }}
              />
            )}
          >
            {/* <ThemedOnScreenHelper
              label={`TypedValueObjectEditor: ${formikValuePathAsString}`}
              data={formValueMLSchema}
            /> */}
            <JzodElementEditor
              valueObjectEditMode={props.valueObjectEditMode}
              reportSectionPathAsString={formikValuePathAsString ?? ""}
              name={"ROOT"}
              isTopLevel={true}
              listKey={"ROOT"}
              rootLessListKey=""
              rootLessListKeyArray={[]}
              labelElement={labelElement}
              indentLevel={0}
              currentApplication={application}
              applicationDeploymentMap={applicationDeploymentMap}
              currentDeploymentUuid={deploymentUuid}
              currentApplicationSection={applicationSection}
              resolvedElementJzodSchemaDEFUNCT={resolvedElementJzodSchema}
              hasTypeError={typeError != undefined}
              typeCheckKeyMap={
                jzodTypeCheckResult?.status == "ok" ? jzodTypeCheckResult.keyMap : {}
              }
              foreignKeyObjects={foreignKeyObjects}
              maxRenderDepth={maxRenderDepth} // always 1
              displayError={displayError}
              submitButton={
                !displaySubmitButton || displaySubmitButton === "onTop" ? submitButton : <></>
              }
              extraToolsButtons={displaySubmitButton === "onFirstLine" ? submitButton : <></>}
              onChangeVector={onChangeVector}
            />
          </ErrorBoundary>
        </form>
      )}
    </>
  );
  
  // Track render performance at end of render (ifThenElse)
  // if (context.showPerformanceDisplay) {
  //   const renderEndTime = performance.now();
  //   const renderDuration = renderEndTime - renderStartTime;
  //   RenderPerformanceMetrics.trackRenderPerformance(componentKey, renderDuration);
  // }
  useEffect(() => {
      // Track render performance at the end of render
    if (context.showPerformanceDisplay) {
      const renderEndTime = performance.now();
      const renderDuration = renderEndTime - renderStartTime;
      const currentMetrics = RenderPerformanceMetrics.trackRenderPerformance(componentKey, renderDuration);

      // Log performance every 50 renders or if render took longer than 10ms
      if (currentMetrics.renderCount % 50 === 0 || renderDuration > 10) {
        log.info(
          `JzodElementEditor render performance - ${componentKey}: ` +
          `#${currentMetrics.renderCount} renders, ` +
          `Current: ${renderDuration.toFixed(2)}ms, ` +
          `Total: ${currentMetrics.totalRenderTime.toFixed(2)}ms, ` +
          `Avg: ${currentMetrics.averageRenderTime.toFixed(2)}ms, ` +
          `Min/Max: ${currentMetrics.minRenderTime.toFixed(2)}ms/${currentMetrics.maxRenderTime.toFixed(2)}ms`
        );
      }
    }
  });
  
  return result;
};
