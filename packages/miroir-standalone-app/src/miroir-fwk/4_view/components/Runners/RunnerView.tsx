import { Formik, FormikHelpers } from "formik";

import type {
  Action,
  ApplicationDeploymentMap,
  CompositeActionTemplate,
  Domain2QueryReturnType,
  DomainControllerInterface,
  EndpointDefinition,
  JzodObject,
  LoggerInterface,
  MiroirModelEnvironment,
  ReduxDeploymentsState,
  Runner,
  SyncBoxedExtractorOrQueryRunnerMap,
  TransformerForBuildPlusRuntime,
  Uuid
} from "miroir-core";
import {
  Action2Error,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  Domain2ElementFailed,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  MiroirLoggerFactory,
  selfApplicationMiroir,
  transformer_extended_apply_wrapper
} from "miroir-core";
import { useMemo } from "react";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useDomainControllerService, useMiroirContextService, useSnackbar } from "../../MiroirContextReactProvider.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { useRunner } from "../Reports/ReportHooks.js";
import { ThemedOnScreenDebug } from "../Themes/BasicComponents.js";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface.js";
import { InnerRunnerView } from "./InnerRunnerView.js";
import type { FormMLSchema, RunnerProps } from "./RunnerInterface.js";
import { getMemoizedReduxDeploymentsStateSelectorMap, type ReduxStateWithUndoRedo } from "miroir-localcache-redux";
import { useSelector } from "react-redux";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunnerView"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

export function StoredRunnerView(props: {
  applicationUuid: Uuid,
  applicationDeploymentMap?: ApplicationDeploymentMap,
  runnerUuid: Uuid,
  // storedRunner: Runner,
}) {
  // const context = useMiroirContextService();
  
  const runnerDeploymentUuid: Uuid = props.applicationDeploymentMap
    ? props.applicationDeploymentMap[props.applicationUuid]
    : defaultSelfApplicationDeploymentMap[props.applicationUuid];

  const runnerDefinitionFromLocalCache: Domain2QueryReturnType<Runner | undefined> = useRunner(
    props.applicationUuid,
    props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
    runnerDeploymentUuid,
    props.runnerUuid
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
    defaultSelfApplicationDeploymentMap
  );

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
        getMemoizedReduxDeploymentsStateSelectorMap();
  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        defaultSelfApplicationDeploymentMap,
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
    [storedRunner, currentActionDefinition]
  );

  const initialFormValue = useMemo(() => {
    return !storedRunner
      ? undefined
      : storedRunner?.definition.runnerType === "actionRunner"
      ? getDefaultValueForJzodSchemaWithResolutionNonHook(
          "build",
          (formMLSchema as any).mlSchema,
          undefined, // rootObject
          "", // rootLessListKey,
          undefined, // No need to pass currentDefaultValue here
          [], // currentPath on value is root
          false, // forceOptional
          storedRunner.application,
          defaultSelfApplicationDeploymentMap,
          runnerDeploymentUuid,
          libraryAppModelEnvironment,
          {}, // transformerParams
          {}, // contextResults
          deploymentEntityState // TODO: keep this? improve so that it does not depend on entire deployment state
        )
      : storedRunner?.definition.runnerType === "customRunner"
      ? storedRunner?.definition.formMLSchema.formMLSchemaType === "mlSchema"
        ? getDefaultValueForJzodSchemaWithResolutionNonHook(
            "build",
            (formMLSchema as any).mlSchema,
            undefined, // rootObject
            "", // rootLessListKey,
            undefined, // No need to pass currentDefaultValue here
            [], // currentPath on value is root
            false, // forceOptional
            storedRunner.application,
            defaultSelfApplicationDeploymentMap,
            runnerDeploymentUuid,
            libraryAppModelEnvironment,
            {}, // transformerParams
            {}, // contextResults
            deploymentEntityState // TODO: keep this? improve so that it does not depend on entire deployment state
          )
        : {[storedRunner.name]:storedRunner.definition.formMLSchema.initialFormValues ?? {}}
      : undefined // impossible case, choices are "actionRunner" || "customRunner"
    ;
  }, [runnerName]);

  const storedRunnerAction: CompositeActionTemplate | undefined = useMemo(
    () =>
      storedRunner && storedRunner.definition.runnerType === "actionRunner"
        ? {
            actionType: "compositeActionSequence",
            actionLabel: storedRunner.defaultLabel,
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
            payload: {
              application: storedRunner.application,
              definition: [
                {
                  transformerType: "getFromParameters",
                  interpolation: "build",
                  referencePath: [storedRunner.name],
                } as any, // TODO: fix type!!
              ],
            },
          }
        : undefined,
    [storedRunner]
  );

  return (
    <>
      <ThemedOnScreenDebug
        label={`StoredRunnerView for ${runnerName} props`}
        data={props}
        initiallyUnfolded={false}
      />
      <ThemedOnScreenDebug
        label={`StoredRunnerView for ${runnerName} runnerDefinitionFromLocalCache`}
        data={runnerDefinitionFromLocalCache}
        // initiallyUnfolded={false}
        useCodeBlock={true}
      />
      {runnerDefinitionFromLocalCache instanceof Domain2ElementFailed ? (
        <div>Error loading runner definition...</div>
      ) : runnerDefinitionFromLocalCache ? (
        <>
          <ThemedOnScreenDebug
            label={`StoredRunnerView for ${runnerName} runnerDefinitionFromLocalCache`}
            data={runnerDefinitionFromLocalCache}
            initiallyUnfolded={false}
          />
          <ThemedOnScreenDebug
            label={`StoredRunnerView for ${runnerName} currentActionDefinition`}
            data={currentActionDefinition}
            initiallyUnfolded={false}
          />
          <ThemedOnScreenDebug
            label={`StoredRunnerView for ${runnerName} formMLSchema`}
            data={formMLSchema}
            initiallyUnfolded={false}
          />
          {runnerDefinitionFromLocalCache.definition.runnerType == "customRunner" ? (
            <RunnerView
              runnerName={runnerName}
              applicationDeploymentMap={
                props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap
              }
              // deploymentUuid={runnerDeploymentUuid}
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
            <RunnerView
              runnerName={runnerName}
              applicationDeploymentMap={
                props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap
              }
              // deploymentUuid={runnerDeploymentUuid}
              formMLSchema={formMLSchema}
              initialFormValue={initialFormValue}
              action={storedRunnerAction as any}
              formLabel={runnerDefinitionFromLocalCache.defaultLabel}
              formikValuePathAsString={runnerName}
              displaySubmitButton="onFirstLine"
              useActionButton={false}
            />
          )}
        </>
      ) : (
        <div>Loading runner definition...</div>
      )}
    </>
  );
}
// ################################################################################################
export const RunnerView = <T extends Record<string, any>>(props: RunnerProps<T>) => {
  const {
    runnerName,
    application,
    formMLSchema,
    // deploymentUuid,
    applicationDeploymentMap,
    initialFormValue,
    action,
    // miroirModelEnvironment,
    // labelElement,
    formikValuePathAsString,
    formLabel,
    displaySubmitButton,
    useActionButton = false,
    validateOnChange = false,
    validateOnBlur = false,
    // enableReinitialize = true,
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
            (initialFormValue as any).transformer as any as TransformerForBuildPlusRuntime, // TODO: correct type
            currentModelEnvironment, // TODO: the DeploymentUuid can change, need to handle that?
            {}, // transformerParams
            {}, // contextResults
            "value"
          )
      : initialFormValue;

  
  const handleSubmit = async (values: T, formikHelpers: FormikHelpers<T>) => {
    log.info("RunnerView handleSubmit", action.actionType, "values", values);

    switch (action.actionType) {
      case "onSubmit": {
        return action.onSubmit(values, formikHelpers);
        break;
      }
      case "compositeActionSequence": {
        log.info("RunnerView handleSubmit compositeActionSequence", action.compositeActionSequence);
        return handleAsyncAction(async () => {
        // return async () => {
          const result = await domainController.handleCompositeAction(
            action.compositeActionSequence,
            props.applicationDeploymentMap,
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
        // return async () => {
          const result = await domainController.handleCompositeActionTemplate(
            action.compositeActionTemplate,
            props.applicationDeploymentMap,
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
      {/* <ThemedOnScreenHelper label={`${formLabel} OuterRunner targetSchema`} data={targetSchema} /> */}
      {/* <ThemedOnScreenHelper label={`OuterRunner ${runnerName} initialValues`} data={initialValues} /> */}
      {/* <ThemedOnScreenDebug
        label={`RunnerView ${runnerName} currentModelEnvironment`}
        data={currentModelEnvironment}
        copyButton={true}
        initiallyUnfolded={false}
        useCodeBlock={true}
      /> */}
      <ThemedOnScreenDebug
        label={`RunnerView ${runnerName} initialValues`}
        data={initialValues}
        copyButton={true}
        initiallyUnfolded={true}
        useCodeBlock={true}
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
