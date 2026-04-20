import { Formik, FormikHelpers } from "formik";

import type {
  Action,
  ApplicationDeploymentMap,
  Domain2QueryReturnType,
  DomainControllerInterface,
  DomainElementSuccess,
  EndpointDefinition,
  EntityInstancesUuidIndex,
  JzodObject,
  LoggerInterface,
  MiroirModelEnvironment,
  ReduxDeploymentsState,
  Runner,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  CoreTransformerForBuildPlusRuntime,
  Uuid,
  ViewParams
} from "miroir-core";
import {
  Action2Error,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  defaultViewParamsFromAdminStorageFetchQueryParams,
  Domain2ElementFailed,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  MiroirLoggerFactory,
  selfApplicationMiroir,
  transformer_extended_apply_wrapper
} from "miroir-core";
import {
  JsonDisplayHelper,
  getMemoizedReduxDeploymentsStateSelectorMap,
  type ReduxStateWithUndoRedo,
  useDomainControllerService, useMiroirContextService,
  useSelector,
  useSnackbar,
} from "miroir-react";
import { useMemo } from "react";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useCurrentModelEnvironment, useReduxDeploymentsStateQuerySelectorForCleanedResult } from "../../ReduxHooks.js";
import { useRunner } from "../Reports/ReportHooks.js";
import { InnerRunnerView } from "./InnerRunnerView.js";
import type { FormMLSchema, RunnerAction, RunnerProps } from "./RunnerInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunnerView"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export function StoredRunnerView(props: {
  applicationUuid: Uuid,
  applicationDeploymentMap?: ApplicationDeploymentMap,
  runnerApplicationDeploymentMap?: (values: Record<string, any>) => ApplicationDeploymentMap,
  runnerUuid: Uuid,
}) {
  // const context = useMiroirContextService();
  const applicationDeploymentMap = props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;
  const runnerDeploymentUuid: Uuid = applicationDeploymentMap[props.applicationUuid];
  const context = useMiroirContextService();
  const currentModelEnvironment: MiroirModelEnvironment =
    useCurrentModelEnvironment(props.applicationUuid??selfApplicationMiroir.uuid, applicationDeploymentMap); // TODO: WRONG!!

  const runnerDefinitionFromLocalCache: Domain2QueryReturnType<Runner | undefined> = useRunner(
    props.applicationUuid,
    applicationDeploymentMap,
    runnerDeploymentUuid,
    props.runnerUuid
  );
  log.info(
    "StoredRunnerView runnerDefinitionFromLocalCache",
    runnerDefinitionFromLocalCache
  );
  // const runnerLabel: string = `Stored Runner ${props.runnerUuid} for Application ${props.applicationUuid}`;
  const storedRunner: Runner | undefined =
    runnerDefinitionFromLocalCache instanceof Domain2ElementFailed? undefined : runnerDefinitionFromLocalCache;

    const runnerName: string =
    runnerDefinitionFromLocalCache instanceof Domain2ElementFailed
      ? ""
      : runnerDefinitionFromLocalCache?.name ?? "";

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  const libraryAppModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    props.applicationUuid,
    applicationDeploymentMap
  );

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
        getMemoizedReduxDeploymentsStateSelectorMap();
  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        applicationDeploymentMap,
        () => ({}),
        libraryAppModelEnvironment,
      )
  );

  
  const currentEndpointDefinition: EndpointDefinition | undefined =
    storedRunner?.definition.runnerType === "actionRunner"
      ? libraryAppModelEnvironment?.currentModel?.endpoints?.find(
          (ep) => ep.uuid == (storedRunner.definition as any).endpoint
        )
      : undefined;

  const currentActionDefinition: Action | undefined =
    storedRunner?.definition.runnerType === "actionRunner"
      ? currentEndpointDefinition?.definition.actions.find(
          (ac) => ac.actionParameters.actionType.definition == (storedRunner.definition as any).action
        )
      : undefined;

  const defaultViewParamsFromAdminStorageFetchQueryResults: Record<string, EntityInstancesUuidIndex> =
    useReduxDeploymentsStateQuerySelectorForCleanedResult(
      deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
        ReduxDeploymentsState,
        Domain2QueryReturnType<DomainElementSuccess>
      >,
      defaultViewParamsFromAdminStorageFetchQueryParams(deploymentEntityStateSelectorMap),
      applicationDeploymentMap,
    );
  
  const viewParams: ViewParams | undefined = defaultViewParamsFromAdminStorageFetchQueryResults?.[
    "viewParams"
  ] as any;

  const formMLSchema: FormMLSchema = useMemo(
    () =>
      !storedRunner
        ? {
            formMLSchemaType: "mlSchema",
            mlSchema: { type: "object", definition: {} } as JzodObject,
          }
        : storedRunner?.definition.runnerType === "actionRunner"
        ? {
            formMLSchemaType: "mlSchema",
            mlSchema: {
              type: "object",
              definition: {
                [storedRunner?.name ?? ""]: {
                  type: "object",
                  definition: currentActionDefinition?.actionParameters ?? {},
                },
              },
            } as JzodObject,
          }
        : storedRunner?.definition.formMLSchema.formMLSchemaType === "mlSchema"
        ? ({
            ...storedRunner?.definition.formMLSchema,
            mlSchema: {
              type: "object",
              definition: {
                [runnerName]: storedRunner?.definition.formMLSchema.mlSchema,
              },
            },
          } as FormMLSchema)
        : ({
            ...storedRunner?.definition.formMLSchema,
            transformer: {
              type: "object",
              definition: {
                [runnerName]: storedRunner?.definition.formMLSchema.transformer,
              },
            },
          } as FormMLSchema),
    [storedRunner, currentActionDefinition, runnerName]
  );

  const resolvedMLSchema: JzodObject = useMemo(() => {
    log.info("Resolving ML Schema for StoredRunnerView", {
      formMLSchema,
      runnerDeploymentUuid,
      libraryAppModelEnvironment,
      deploymentEntityState,
      viewParams,
    });
    return formMLSchema.formMLSchemaType === "transformer"
      ? transformer_extended_apply_wrapper(
          context.miroirContext?.miroirActivityTracker,
          "build",
          [],
          "resolving formMLSchema transformer",
          formMLSchema.transformer as CoreTransformerForBuildPlusRuntime,
        defaultMiroirModelEnvironment,
        {
          viewParams: viewParams || {},
        },
        {
          // viewParams: viewParams || {},
        },
        "value",
      ) as JzodObject
      : formMLSchema.mlSchema as JzodObject;
  }, [formMLSchema, viewParams]);

  const initialFormValue = useMemo(() => {
    log.info("Calculating initialFormValue for StoredRunnerView", {
      storedRunner,
      formMLSchema,
      runnerDeploymentUuid,
      libraryAppModelEnvironment,
      deploymentEntityState,
      viewParams,
    });
    return !storedRunner
      ? undefined
      : storedRunner?.definition.runnerType === "actionRunner"
        ? getDefaultValueForJzodSchemaWithResolutionNonHook(
            "build",
            // (formMLSchema as any).mlSchema,
            resolvedMLSchema,
            undefined, // rootObject
            "", // rootLessListKey,
            undefined, // No need to pass currentDefaultValue here
            [], // currentPath on value is root
            false, // forceOptional
            storedRunner.application,
            defaultSelfApplicationDeploymentMap,
            runnerDeploymentUuid,
            libraryAppModelEnvironment,
            {
              viewParams: viewParams || {},
            }, // transformerParams
            {
              // viewParams: viewParams || {},
            }, // contextResults
            deploymentEntityState, // TODO: keep this? improve so that it does not depend on entire deployment state
          )
        : storedRunner?.definition.runnerType === "customRunner"
          ? storedRunner.definition.formMLSchema.initialFormValues
            ? {
                [storedRunner.name]: transformer_extended_apply_wrapper(
                  context.miroirContext.miroirActivityTracker, // activityTracker
                  "runtime", // step
                  [], // transformerPath
                  "initialFormValueAsTransformer", // transformerLabel
                  storedRunner.definition.formMLSchema
                    .initialFormValues as any as CoreTransformerForBuildPlusRuntime, // TODO: correct type
                  currentModelEnvironment, // TODO: the DeploymentUuid can change, need to handle that?
                  {}, // transformerParams
                  {}, // contextResults
                  "value",
                ),
              }
            : getDefaultValueForJzodSchemaWithResolutionNonHook(
                "build",
                // (formMLSchema as any).mlSchema,
                resolvedMLSchema,
                undefined, // rootObject
                "", // rootLessListKey,
                undefined, // No need to pass currentDefaultValue here
                [], // currentPath on value is root
                false, // forceOptional
                storedRunner.application,
                defaultSelfApplicationDeploymentMap,
                runnerDeploymentUuid,
                libraryAppModelEnvironment,
                {
                  viewParams: viewParams || {},
                }, // transformerParams
                {
                  viewParams: viewParams || {},
                }, // contextResults
                deploymentEntityState, // TODO: keep this? improve so that it does not depend on entire deployment state
              )
          : undefined; // impossible case, choices are "actionRunner" || "customRunner"
  }, [
    storedRunner,
    formMLSchema,
    resolvedMLSchema,
    runnerDeploymentUuid,
    libraryAppModelEnvironment,
    deploymentEntityState,
    runnerName,
  ]);

  const storedRunnerAction: RunnerAction<Record<string, any>> | undefined
  = useMemo(
    () =>
      storedRunner && storedRunner.definition.runnerType === "actionRunner"
        ? {
          actionType: "compositeActionTemplate",
          compositeActionTemplate: {
            actionType: "compositeActionSequence",
            actionLabel: storedRunner.defaultLabel,
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              actionSequence: [
                {
                  transformerType: "getFromParameters",
                  interpolation: "build",
                  referencePath: [storedRunner.name],
                } as any, // TODO: fix type!!
              ],
            },
          }}
        : undefined,
    [storedRunner]
  );

  return (
    <>
      <JsonDisplayHelper debug={true}
        componentName="StoredRunnerView"
        elements={[
          {
            label: `${runnerName} props`,
            data: props,
          },
          {
            label: `${runnerName} runnerDefinitionFromLocalCache`,
            data: runnerDefinitionFromLocalCache,
            useCodeBlock: true,
          },
          {
            label: `${runnerName} application & deployment`,
            data: {
              applicationUuid: props.applicationUuid,
              applicationDeploymentMap:
                props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
              runnerDeploymentUuid,
            },
          },
          {
            label: `${runnerName} currentEndpointDefinition`,
            data: currentEndpointDefinition,
          },
          {
            label: `${runnerName} currentActionDefinition`,
            data: currentActionDefinition,
          },
          {
            label: `${runnerName} formMLSchema`,
            data: formMLSchema,
          },
          {
            label: `${runnerName} resolvedMLSchema`,
            data: resolvedMLSchema,
          },
          {
            label: `${runnerName} initialFormValue`,
            data: initialFormValue,
          },
          {
            label: `${runnerName} storedRunnerAction`,
            data: storedRunnerAction,
            useCodeBlock: true,
          },
        ]}
      />
      {runnerDefinitionFromLocalCache instanceof Domain2ElementFailed ? (
        <div>Error loading runner definition...</div>
      ) : runnerDefinitionFromLocalCache ? (
        <>
          {runnerDefinitionFromLocalCache.definition.runnerType == "customRunner" ? (
            <RunnerView
              runnerName={runnerName}
              applicationDeploymentMap={
                props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap
              }
              runnerApplicationDeploymentMap={props.runnerApplicationDeploymentMap}
              formMLSchema={formMLSchema}
              initialFormValue={initialFormValue}
              action={{
                actionType: "compositeActionTemplate",
                compositeActionTemplate: runnerDefinitionFromLocalCache.definition.actionTemplate,
              }}
              formLabel={runnerDefinitionFromLocalCache.defaultLabel}
              formikValuePathAsString={runnerName}
              displaySubmitButton="onFirstLine"
              useActionButton={false}
            />
          ) : (
            // <div>Application Runner type not yet supported in StoredRunnerView</div>
            <>
              <RunnerView
                runnerName={runnerName}
                applicationDeploymentMap={
                  props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap
                }
                runnerApplicationDeploymentMap={props.runnerApplicationDeploymentMap}
                formMLSchema={formMLSchema}
                initialFormValue={initialFormValue}
                action={storedRunnerAction as any}
                formLabel={runnerDefinitionFromLocalCache.defaultLabel}
                formikValuePathAsString={runnerName}
                displaySubmitButton="onFirstLine"
                useActionButton={false}
              />
            </>
          )}
        </>
      ) : (
        <div>Loading runner definition...</div>
      )}
    </>
  );
}
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const RunnerView = <T extends Record<string, any>>(props: RunnerProps<T>) => {
  const {
    runnerName,
    application,
    applicationDeploymentMap,
    runnerApplicationDeploymentMap,
    initialFormValue,
    action,
    validateOnChange = false,
    validateOnBlur = false,
  } = props;
  const domainController: DomainControllerInterface = useDomainControllerService();
  const currentModelEnvironment: MiroirModelEnvironment =
    useCurrentModelEnvironment(application??selfApplicationMiroir.uuid, applicationDeploymentMap); // TODO: WRONG!!
  const context = useMiroirContextService();
  const { handleAsyncAction } = useSnackbar();

  const initialValues =
    typeof initialFormValue === "object" && "initFormValueType" in initialFormValue
      ? initialFormValue.initFormValueType === "value"
        ? (initialFormValue as any).value
        : transformer_extended_apply_wrapper(
            context.miroirContext.miroirActivityTracker, // activityTracker
            "runtime", // step
            [], // transformerPath
            "initialFormValueAsTransformer", // transformerLabel
            (initialFormValue as any).transformer as any as CoreTransformerForBuildPlusRuntime, // TODO: correct type
            currentModelEnvironment, // TODO: the DeploymentUuid can change, need to handle that?
            {}, // transformerParams
            {}, // contextResults
            "value"
          )
      : initialFormValue;

  // ##############################################################################################
  const handleSubmit = async (values: T, formikHelpers: FormikHelpers<T>) => {
    
    const applicationDeploymentMapForAction = runnerApplicationDeploymentMap
    ? runnerApplicationDeploymentMap(values)
    : applicationDeploymentMap;
    
    log.info(
      "RunnerView handleSubmit",
      action.actionType,
      "action",
      action,
      "values",
      values,
      "applicationDeploymentMapForAction",
      applicationDeploymentMapForAction,
    );

    switch (action.actionType) {
      case "onSubmit": {
        return action.onSubmit(values, formikHelpers);
        break;
      }
      case "compositeActionSequence": 
      {
        log.info("RunnerView handleSubmit compositeActionSequence", action.compositeActionSequence);
        return handleAsyncAction(async () => {
        // return async () => {
          const result = await domainController.handleCompositeAction(
            action.compositeActionSequence,
            applicationDeploymentMapForAction,
            currentModelEnvironment,
            values as Record<string, any>
          );
          formikHelpers.setSubmitting(false);
          formikHelpers.setValues(initialValues);
          return Promise.resolve(result);
        // };
        },"Run composite action sequence successful","RunnerView compositeActionSequence");
        break;
      }
      case "compositeActionTemplate": {
        return handleAsyncAction(async () => {
          const result = await domainController.handleCompositeActionTemplate(
            action.compositeActionTemplate,
            applicationDeploymentMapForAction,
            currentModelEnvironment,
            values as Record<string, any>
          );
          log.info(
            "RunnerView handleSubmit done for compositeActionTemplate",
            action.compositeActionTemplate,
            "result",
            result
          );
          formikHelpers.setSubmitting(false);
          formikHelpers.setValues(initialValues);
          return Promise.resolve(result);
        // };
        }, "Run composite action template successful","RunnerView compositeActionTemplate");
        break;
      }
      default: {
        const exhaustiveCheck: never = action;
        // throw new Error(`Unhandled action type: ${JSON.stringify(exhaustiveCheck)}`);
        return new Action2Error(
          "FailedToHandleAction",
          `Unhandled action type: ${JSON.stringify(exhaustiveCheck)}`
        );
        break;
      }
    }
  }; // end handleSubmit

  return (
    <>
      <JsonDisplayHelper debug={true}
        componentName="RunnerView"
        elements={[{
          label: `RunnerView ${runnerName} initialValues`,
          data: initialValues,
          copyButton: true,
          useCodeBlock: true,
        }]}
      />
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        validateOnChange={validateOnChange}
        validateOnBlur={validateOnBlur}
      >
        <InnerRunnerView
          {...props}
        />
      </Formik>
    </>
  );
};
