import { EditorView } from '@codemirror/view';
import ReactCodeMirror from '@uiw/react-codemirror';
import { Formik, FormikProps } from 'formik';
import { useMemo } from 'react';

import {
  ApplicationSection,
  DeploymentEntityState,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityInstancesUuidIndex,
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
  getQueryRunnerParamsForDeploymentEntityState
} from "miroir-core";
import { getMemoizedDeploymentEntityStateSelectorMap } from 'miroir-localcache-redux';

import {
  useMiroirContextService
} from "../../MiroirContextReactProvider.js";

import { javascript } from '@codemirror/lang-javascript';
import { ErrorBoundary } from "react-error-boundary";
import { packageName } from '../../../../constants.js';
import { cleanLevel } from '../../constants.js';
import {
  useCurrentModel,
  useDeploymentEntityStateQuerySelectorForCleanedResult
} from "../../ReduxHooks.js";
import {
  measuredGetApplicationSection,
  measuredJzodTypeCheck
} from "../../tools/hookPerformanceMeasure.js";
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
  // instance?: EntityInstance,
  valueObject?: any,
  // valueObjectMMLSchema: EntityDefinition | undefined;
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
  log.info(
    "ReportSectionEntityInstanceEditor render",
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
        const resolvedJzodSchema: ResolvedJzodSchemaReturnType | undefined =
          useMemo(() => {
            let result: ResolvedJzodSchemaReturnType | undefined = undefined;
            try {
              result =
                context.miroirFundamentalJzodSchema &&
                valueObjectMMLSchema &&
                formik.values &&
                currentModel
                  ? measuredJzodTypeCheck(
                      valueObjectMMLSchema,
                      formik.values,
                      [],
                      [],
                      context.miroirFundamentalJzodSchema,
                      currentModel,
                      currentMiroirModel,
                      {}
                    )
                  : undefined;
            } catch (e) {
              log.error(
                "ReportSectionEntityInstance useMemo error",
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
          }, [valueObjectMMLSchema, valueObject, context]);
        log.info(
          "ReportSectionEntityInstance jzodTypeCheck done for render",
          navigationCount,
          "resolvedJzodSchema",
          resolvedJzodSchema
        );
        if (!resolvedJzodSchema || resolvedJzodSchema.status != "ok") {
          log.error(
            "ReportSectionEntityInstance could not resolve jzod schema",
            resolvedJzodSchema
          );
          const jsonString = JSON.stringify(resolvedJzodSchema, null, 2);
          const lines = jsonString?.split("\n");
          const maxLineLength = lines?Math.max(...lines.map((line) => line.length)): 0;
          const fixedWidth = Math.min(Math.max(maxLineLength * 0.6, 1200), 1800);
          typeError = (
            <ReactCodeMirror
              editable={false}
              height="100ex"
              style={{
                width: `${fixedWidth}px`,
                maxWidth: "90vw",
              }}
              value={jsonString}
              extensions={[
                ...codeMirrorExtensions,
                EditorView.lineWrapping,
                EditorView.theme({
                  ".cm-editor": {
                    width: `${fixedWidth}px`,
                  },
                  ".cm-scroller": {
                    width: "100%",
                    overflow: "hidden",
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

        const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> =
          useMemo(() => getMemoizedDeploymentEntityStateSelectorMap(), []);
        const foreignKeyObjectsFetchQueryParams: SyncQueryRunnerParams<DeploymentEntityState> =
          useMemo(
            () =>
              getQueryRunnerParamsForDeploymentEntityState(
                deploymentUuid &&
                  resolvedJzodSchema &&
                  resolvedJzodSchema.status == "ok" &&
                  resolvedJzodSchema.resolvedSchema.type == "uuid" &&
                  resolvedJzodSchema.resolvedSchema.tag?.value?.targetEntity
                  ? {
                      queryType: "boxedQueryWithExtractorCombinerTransformer",
                      deploymentUuid: deploymentUuid,
                      pageParams: {},
                      queryParams: {},
                      contextResults: {},
                      extractors: {
                        [resolvedJzodSchema.resolvedSchema.tag?.value?.targetEntity]: {
                          extractorOrCombinerType: "extractorByEntityReturningObjectList",
                          applicationSection: measuredGetApplicationSection(
                            deploymentUuid,
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
            [deploymentEntityStateSelectorMap, deploymentUuid, resolvedJzodSchema]
          );

        const foreignKeyObjects: Record<string, EntityInstancesUuidIndex> =
          useDeploymentEntityStateQuerySelectorForCleanedResult(
            deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
              DeploymentEntityState,
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
                        origin: "ReportSectionEntityInstance",
                        objectType: "root_editor",
                        rootLessListKey: "ROOT",
                        currentValue: valueObject,
                        formikValues: undefined,
                        rawJzodSchema: valueObjectMMLSchema,
                        localResolvedElementJzodSchemaBasedOnValue:
                          resolvedJzodSchema?.status == "ok"
                            ? resolvedJzodSchema.resolvedSchema
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
                      resolvedJzodSchema?.status == "ok"
                        ? resolvedJzodSchema.resolvedSchema
                        : undefined
                    }
                    hasTypeError={typeError != undefined}
                    typeCheckKeyMap={
                      resolvedJzodSchema?.status == "ok"
                        ? resolvedJzodSchema.keyMap
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
