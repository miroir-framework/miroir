import { Formik, FormikProps } from 'formik';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  adminConfigurationDeploymentMiroir,
  ApplicationSection,
  defaultMiroirModelEnvironment,
  Domain2QueryReturnType,
  DomainElementSuccess,
  dummyDomainManyQueryWithDeploymentUuid,
  EntityInstancesUuidIndex,
  getApplicationSection,
  getInnermostTypeCheckError,
  getQueryRunnerParamsForReduxDeploymentsState,
  JzodElement,
  jzodTypeCheck,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  ResolvedJzodSchemaReturnType,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  SyncQueryRunnerParams,
  Uuid
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
import { cleanLevel } from '../../constants.js';
import {
  useCurrentModel,
  useReduxDeploymentsStateQuerySelectorForCleanedResult
} from "../../ReduxHooks.js";
import { useRenderTracker } from '../../tools/renderCountTracker.js';
import { ErrorFallbackComponent } from '../ErrorFallbackComponent.js';
import { JzodElementEditor } from '../ValueObjectEditor/JzodElementEditor.js';
import { CodeBlock_ReadOnly } from './CodeBlock_ReadOnly.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TypedValueObjectEditor"),
).then((logger: LoggerInterface) => {log = logger});

const codeMirrorExtensions = [javascript()];

// Extract value at a given path from an object
function getValueAtPath(obj: any, path: string): any {
  if (!path || !obj) return obj;
  
  const pathParts = path.split('.');
  let current = obj;
  
  for (const part of pathParts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

// Set value at a given path in an object, creating intermediate objects as needed
function setValueAtPath(obj: any, path: string, value: any): any {
  if (!path) return value;
  
  const pathParts = path.split('.');
  const result = { ...obj };
  let current = result;
  
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (current[part] === null || current[part] === undefined || typeof current[part] !== 'object') {
      current[part] = {};
    } else {
      current[part] = { ...current[part] };
    }
    current = current[part];
  }
  
  current[pathParts[pathParts.length - 1]] = value;
  return result;
}

// Extract schema for a given path from a jzod schema
function getSchemaAtPath(schema: any, path: string): any {
  if (!path || !schema) return schema;
  
  const pathParts = path.split('.');
  let current = schema;
  
  for (const part of pathParts) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    
    // Handle jzod schema structure
    if (current.type === 'object' && current.definition) {
      current = current.definition[part];
    } else if (current.definition && current.definition[part]) {
      current = current.definition[part];
    } else if (current[part]) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// Extracted editor component for ReportSectionEntityInstance
interface TypedValueObjectEditorProps {
  labelElement: React.ReactElement | undefined;
  // 
  valueObject?: any,
  valueObjectMMLSchema: JzodElement | undefined;
  // 
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  domainElement?: Record<string,any>,
  // Note: Outline props removed since using context now
  // ancillary props
  showPerformanceDisplay?: boolean;
  formLabel: string;
  onSubmit: (data: any) => Promise<void>;
  // fold / unfold element
  foldedObjectAttributeOrArrayItems: { [k: string]: boolean };
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<React.SetStateAction<{ [k: string]: boolean }>>;
  // zoom functionality
  zoomInPath?: string; // Optional path like "x.y.z" to zoom into a subset of the instance
  // depth control
  maxRenderDepth?: number; // Optional max depth for initial rendering, default 1
  // readonly mode
  readonly?: boolean; // Whether the editor should be readonly (no submit button, no editing)
  // navigationCount: number;
}

export const TypedValueObjectEditor: React.FC<TypedValueObjectEditorProps> = ({
  labelElement,
  // 
  valueObject,
  valueObjectMMLSchema,
  // 
  deploymentUuid,
  applicationSection,
  // functions
  onSubmit,
  foldedObjectAttributeOrArrayItems,
  setFoldedObjectAttributeOrArrayItems,
  // zoom
  zoomInPath, // display only a subset of the valueObject, like "x.y.z"
  // depth control
  maxRenderDepth = 1,
  // readonly mode
  readonly = false,
  // 
  formLabel: pageLabel, // TODO: remove
}) => {
  const context = useMiroirContextService();

  const navigationKey = `${deploymentUuid}-${applicationSection}`;
  const { navigationCount, totalCount } = useRenderTracker("FreeFormEditor", navigationKey);

  // Handle zoom functionality
  const hasZoomPath = zoomInPath && zoomInPath.trim() !== '';
  const displayValueObject = hasZoomPath ? getValueAtPath(valueObject, zoomInPath) : valueObject;
  const displaySchema = hasZoomPath && valueObjectMMLSchema 
    ? getSchemaAtPath(valueObjectMMLSchema, zoomInPath)
    : valueObjectMMLSchema;

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
  if (hasZoomPath && displayValueObject === undefined) {
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
  if (hasZoomPath && !displaySchema) {
    return (
      <div style={{ padding: '16px', border: '1px solid #ff9800', borderRadius: '4px', backgroundColor: '#fff3e0' }}>
        <div style={{ color: '#f57c00', fontWeight: 'bold', marginBottom: '8px' }}>
          Schema Path Error
        </div>
        <div>The zoom path "{zoomInPath}" does not correspond to a valid schema path.</div>
      </div>
    );
  }

  const currentModel: MetaModel = useCurrentModel(
    context.applicationSection == "data" ? context.deploymentUuid : adminConfigurationDeploymentMiroir.uuid
  );
  const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  // Get the deployment entity state from Redux store for conditional schema resolution
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    getMemoizedReduxDeploymentsStateSelectorMap();
  
  const reduxDeploymentsState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(state.presentModelSnapshot.current, () => ({}), defaultMiroirModelEnvironment)
  );


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
  return (
    <Formik
      enableReinitialize={true}
      initialValues={displayValueObject}
      onSubmit={async (values, { setSubmitting, setErrors }) => {
        if (readonly) {
          setSubmitting(false);
          return;
        }
        try {
          log.info("onSubmit formik values", values);
          
          // Handle zoom case: merge changes back into the full object for submission
          const finalValues = hasZoomPath 
            ? setValueAtPath(valueObject, zoomInPath!, values)
            : values;
            
          await onSubmit(finalValues);
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
        let typeError: JSX.Element | undefined = undefined;
        const typeCheckKeyMap: ResolvedJzodSchemaReturnType | undefined = useMemo(() => {
          let result: ResolvedJzodSchemaReturnType | undefined = undefined;
          try {
            result =
              context.miroirFundamentalJzodSchema && displaySchema && formik.values && currentModel
                ? jzodTypeCheck(
                    displaySchema,
                    formik.values,
                    [],
                    [],
                    // defaultMiroirModelEnvironment,
                    {
                      miroirFundamentalJzodSchema: context.miroirFundamentalJzodSchema,
                      currentModel,
                      miroirMetaModel: currentMiroirModel,
                    },
                    {}, // relativeReferenceJzodContext
                    formik.values, // currentDefaultValue
                    reduxDeploymentsState,
                    deploymentUuid, // Now passing the actual deploymentUuid
                    hasZoomPath ? valueObject : formik.values // rootObject - use full object for context, but validate the subset
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
        }, [displaySchema, displayValueObject, formik.values, context, hasZoomPath, valueObject]);
        // log.info(
        //   "TypedValueObjectEditor jzodTypeCheck done for render",
        //   navigationCount,
        //   "formik.values",
        //   formik.values,
        //   "resolvedJzodSchema",
        //   typeCheckKeyMap
        // );
        if (!typeCheckKeyMap || typeCheckKeyMap.status != "ok") {
          log.error(
            "TypedValueObjectEditor could not resolve jzod schema",
            typeCheckKeyMap
          );
          // const jsonString = JSON.stringify(typeCheckKeyMap, null, 2);
          if (typeCheckKeyMap) {
            const jsonString: string = JSON.stringify(getInnermostTypeCheckError(typeCheckKeyMap as any), null, 2);
            typeError = <CodeBlock_ReadOnly value={jsonString} />;
          } else {
            typeError = <div>Could not resolve jzod schema</div>;
          }
        }

        const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
          useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);
        const foreignKeyObjectsFetchQueryParams: SyncQueryRunnerParams<ReduxDeploymentsState> =
          useMemo(
            () =>
              getQueryRunnerParamsForReduxDeploymentsState(
                deploymentUuid &&
                  typeCheckKeyMap &&
                  typeCheckKeyMap.status == "ok" &&
                  typeCheckKeyMap.resolvedSchema.type == "uuid" &&
                  typeCheckKeyMap.resolvedSchema.tag?.value?.selectorParams?.targetEntity
                  ? {
                      queryType: "boxedQueryWithExtractorCombinerTransformer",
                      deploymentUuid: deploymentUuid,
                      pageParams: {},
                      queryParams: {},
                      contextResults: {},
                      extractors: {
                        [typeCheckKeyMap.resolvedSchema.tag?.value?.selectorParams?.targetEntity]: {
                          extractorOrCombinerType: "extractorByEntityReturningObjectList",
                          applicationSection: getApplicationSection(
                            deploymentUuid,
                            typeCheckKeyMap.resolvedSchema.tag?.value?.selectorParams?.targetEntity
                          ),
                          parentName: "",
                          parentUuid: typeCheckKeyMap.resolvedSchema.tag?.value?.selectorParams?.targetEntity,
                        },
                      },
                    }
                  : dummyDomainManyQueryWithDeploymentUuid,
                deploymentEntityStateSelectorMap
              ),
            [deploymentEntityStateSelectorMap, deploymentUuid, typeCheckKeyMap]
          );

        const foreignKeyObjects: Record<string, EntityInstancesUuidIndex> =
          useReduxDeploymentsStateQuerySelectorForCleanedResult(
            deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
              ReduxDeploymentsState,
              Domain2QueryReturnType<DomainElementSuccess>
            >,
            foreignKeyObjectsFetchQueryParams
          );

        return (
          <>
            <div>
              {typeError ? "typeError: " : ""}{typeError}
            </div>
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
                        currentValue: displayValueObject,
                        formikValues: undefined,
                        rawJzodSchema: displaySchema,
                        localResolvedElementJzodSchemaBasedOnValue:
                          typeCheckKeyMap?.status == "ok"
                            ? typeCheckKeyMap.resolvedSchema
                            : undefined,
                      }}
                    />
                  )}
                >
                  <JzodElementEditor
                    name={"ROOT"}
                    isTopLevel={true}
                    listKey={"ROOT"}
                    rootLessListKey=""
                    rootLessListKeyArray={[]}
                    labelElement={labelElement}
                    indentLevel={0}
                    currentDeploymentUuid={deploymentUuid}
                    currentApplicationSection={applicationSection}
                    resolvedElementJzodSchema={
                      typeCheckKeyMap?.status == "ok"
                        ? typeCheckKeyMap.resolvedSchema
                        : undefined
                    }
                    hasTypeError={typeError != undefined}
                    typeCheckKeyMap={
                      typeCheckKeyMap?.status == "ok"
                        ? typeCheckKeyMap.keyMap
                        : {}
                    }
                    foreignKeyObjects={foreignKeyObjects}
                    foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
                    setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
                    maxRenderDepth={maxRenderDepth}
                    readOnly={true}
                  />
                </ErrorBoundary>
              </div>
            ) : (
              // Editable mode: wrap in form
              <form id={"form." + pageLabel} onSubmit={formik.handleSubmit}>
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
                          currentValue: displayValueObject,
                          formikValues: undefined,
                          rawJzodSchema: displaySchema,
                          localResolvedElementJzodSchemaBasedOnValue:
                            typeCheckKeyMap?.status == "ok"
                              ? typeCheckKeyMap.resolvedSchema
                              : undefined,
                        }}
                      />
                    )}
                  >
                    <JzodElementEditor
                      name={"ROOT"}
                      isTopLevel={true}
                      listKey={"ROOT"}
                      rootLessListKey=""
                      rootLessListKeyArray={[]}
                      labelElement={labelElement}
                      indentLevel={0}
                      currentDeploymentUuid={deploymentUuid}
                      currentApplicationSection={applicationSection}
                      resolvedElementJzodSchema={
                        typeCheckKeyMap?.status == "ok"
                          ? typeCheckKeyMap.resolvedSchema
                          : undefined
                      }
                      hasTypeError={typeError != undefined}
                      typeCheckKeyMap={
                        typeCheckKeyMap?.status == "ok"
                          ? typeCheckKeyMap.keyMap
                          : {}
                      }
                      foreignKeyObjects={foreignKeyObjects}
                      foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
                      setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
                      maxRenderDepth={maxRenderDepth}
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
                    />
                  </ErrorBoundary>
                </div>
              </form>
            )}
          </>
        );
      }}
    </Formik>
  );
};
