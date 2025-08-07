import { EditorView } from '@codemirror/view';
import ReactCodeMirror from '@uiw/react-codemirror';
import { Formik, FormikProps } from 'formik';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  ApplicationSection,
  ReduxDeploymentsState,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityInstancesUuidIndex,
  getEntityInstancesUuidIndexNonHook,
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
  getQueryRunnerParamsForReduxDeploymentsState,
  jzodTypeCheck,
  getApplicationSection
} from "miroir-core";
import { getMemoizedReduxDeploymentsStateSelectorMap, ReduxStateWithUndoRedo, selectCurrentReduxDeploymentsStateFromReduxState } from 'miroir-localcache-redux';

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
import {
  ThemedCodeBlock
} from "../Themes/ThemedComponents.js";
import { JzodElementEditor } from '../ValueObjectEditor/JzodElementEditor.js';
// import { GlobalRenderPerformanceDisplay, RenderPerformanceDisplay, trackRenderPerformance } from '../tools/renderPerformanceMeasure.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TypedValueObjectEditor"),
).then((logger: LoggerInterface) => {log = logger});

const codeMirrorExtensions = [javascript()];

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
  onSubmit: onEditFormObject,
  foldedObjectAttributeOrArrayItems,
  setFoldedObjectAttributeOrArrayItems,
  // 
  formLabel: pageLabel, // TODO: remove
}) => {
  const context = useMiroirContextService();

  const navigationKey = `${deploymentUuid}-${applicationSection}`;
  const { navigationCount, totalCount } = useRenderTracker("FreeFormEditor", navigationKey);

  const currentModel: MetaModel = useCurrentModel(
    context.applicationSection == "data" ? context.deploymentUuid : adminConfigurationDeploymentMiroir.uuid
  );
  const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  // Get the deployment entity state from Redux store for conditional schema resolution
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    getMemoizedReduxDeploymentsStateSelectorMap();
  
  // const deploymentEntityState: ReduxDeploymentsState = useSelector(selectCurrentReduxDeploymentsStateFromReduxState);
  const reduxDeploymentsState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(state.presentModelSnapshot.current, () => ({}))
  );

  // Create a function to get entity instances for conditional schema resolution
  // const getEntityInstancesUuidIndex = useMemo(() => {
  //   return (targetDeploymentUuid: Uuid, entityUuid: Uuid, sortBy?: string): EntityInstancesUuidIndex => {
  //     return getEntityInstancesUuidIndexNonHook(
  //       reduxDeploymentsState,
  //       targetDeploymentUuid,
  //       entityUuid,
  //       sortBy
  //     );
  //   };
  // }, [reduxDeploymentsState]);

  log.info(
    "TypedValueObjectEditor render",
    "navigationCount",
    navigationCount,
    "instance",
    valueObject,
    "valueObjectMMLSchema",
    valueObjectMMLSchema
  );
  return (
    <Formik
      enableReinitialize={true}
      initialValues={valueObject}
      onSubmit={async (values, { setSubmitting, setErrors }) => {
        try {
          log.info("onSubmit formik values", values);
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
        let typeError: JSX.Element | undefined = undefined;
        const typeCheckKeyMap: ResolvedJzodSchemaReturnType | undefined =
          useMemo(() => {
            let result: ResolvedJzodSchemaReturnType | undefined = undefined;
            try {
              result =
                context.miroirFundamentalJzodSchema &&
                valueObjectMMLSchema &&
                formik.values &&
                currentModel
                  ? // ? measuredJzodTypeCheck(
                    jzodTypeCheck(
                      valueObjectMMLSchema,
                      formik.values,
                      [],
                      [],
                      context.miroirFundamentalJzodSchema,
                      currentModel,
                      currentMiroirModel,
                      {}, // relativeReferenceJzodContext
                      formik.values, // currentDefaultValue
                      reduxDeploymentsState,
                      // getEntityInstancesUuidIndex, // Now passing the actual function
                      deploymentUuid, // Now passing the actual deploymentUuid
                      formik.values // rootObject - for resolving conditional schemas
                    )
                  : undefined;
            } catch (e) {
              log.error(
                "TypedValueObjectEditor useMemo error",
                e,
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
          }, [valueObjectMMLSchema, valueObject, formik.values, context]);
        log.info(
          "TypedValueObjectEditor jzodTypeCheck done for render",
          navigationCount,
          "formik.values",
          formik.values,
          "resolvedJzodSchema",
          typeCheckKeyMap
        );
        if (!typeCheckKeyMap || typeCheckKeyMap.status != "ok") {
          log.error(
            "TypedValueObjectEditor could not resolve jzod schema",
            typeCheckKeyMap
          );
          const jsonString = JSON.stringify(typeCheckKeyMap, null, 2);
          // const jsonString = JSON.stringify(resolvedJzodSchema);
          const lines = jsonString?.split("\n");
          const maxLineLength = lines?Math.max(...lines.map((line) => line.length)): 0;
          const fixedWidth = Math.min(Math.max(maxLineLength * 0.6, 1200), 1800);
          typeError = (
            <ReactCodeMirror
              editable={false}
              height="400px"
              style={{
                width: `${fixedWidth}px`,
                maxWidth: "90vw",
                maxHeight: "100px",
              }}
              value={jsonString}
              extensions={[
                ...codeMirrorExtensions,
                EditorView.lineWrapping,
                EditorView.theme({
                  ".cm-editor": {
                    width: `${fixedWidth}px`,
                    maxHeight: "100px",
                  },
                  ".cm-scroller": {
                    width: "100%",
                    overflow: "auto",
                    maxHeight: "100px",
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
              {typeError ? "typeError: " : ""}
              <ThemedCodeBlock>{typeError ?? <></>}</ThemedCodeBlock>
            </div>
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
                        currentValue: valueObject,
                        formikValues: undefined,
                        rawJzodSchema: valueObjectMMLSchema,
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
          </>
        );
      }}
    </Formik>
  );
};
