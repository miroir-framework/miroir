import { Formik, FormikHelpers } from "formik";

import type {
  ApplicationDeploymentMap,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  Domain2QueryReturnType,
  DomainControllerInterface,
  EndpointDefinition,
  LoggerInterface,
  MiroirModelEnvironment,
  Runner,
  TransformerForBuildPlusRuntime,
  Uuid,
} from "miroir-core";
import {
  Action2Error,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  adminConfigurationDeploymentParis,
  defaultAdminApplicationDeploymentMapNOTGOOD,
  defaultSelfApplicationDeploymentMap,
  Domain2ElementFailed,
  entityDeployment,
  MiroirLoggerFactory,
  selfApplicationLibrary,
  selfApplicationMiroir,
  transformer_extended_apply_wrapper
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useDomainControllerService, useMiroirContextService, useSnackbar } from "../../MiroirContextReactProvider.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { InnerRunnerView } from "./InnerRunnerView.js";
import type { FormMLSchema, RunnerProps } from "./RunnerInterface.js";
import { useMemo } from "react";
import { useRunner } from "../Reports/ReportHooks.js";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface.js";
import { ThemedOnScreenDebug } from "../Themes/BasicComponents.js";

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
  // const runnerName: string = props.storedRunner.name;
  // const runnerLabel: string = props.storedRunner.defaultLabel;

  // const runnerDefinitionFromLocalCache: any = useRunner(adminConfigurationDeploymentMiroir.uuid, "44313751-b0e5-4132-bb12-a544806e759b");
  const runnerDeploymentUuid: Uuid = props.applicationDeploymentMap
    ? props.applicationDeploymentMap[props.applicationUuid]
    : defaultSelfApplicationDeploymentMap[props.applicationUuid];

  const runnerDefinitionFromLocalCache: Domain2QueryReturnType<Runner | undefined> = useRunner(
    props.applicationUuid,
    runnerDeploymentUuid,
    props.runnerUuid
  );
  const runnerLabel: string = `Stored Runner ${props.runnerUuid} for Application ${props.applicationUuid}`;
  const runnerName: string =
    runnerDefinitionFromLocalCache instanceof Domain2ElementFailed
      ? ""
      : runnerDefinitionFromLocalCache?.name ?? "";

  const initialFormValue = useMemo(() => {
    return {
      [runnerName]: {
        // application: noValue.uuid,
        // application: props.applicationUuid,
        entity: noValue.uuid,
      },
    };
  }, [runnerName]);

  // const deploymentUuid = adminConfigurationDeploymentLibrary.uuid;

  // // look up the action implementation in the currentModelEnvironment
  // const currentEndpointDefinition: EndpointDefinition | undefined =
  //   currentModelEnvironment?.currentModel?.endpoints?.find(
  //     (ep) => ep.uuid == (domainAction as any).endpoint
  //   );


  return runnerDefinitionFromLocalCache instanceof Domain2ElementFailed ? (
    <div>Error loading runner definition...</div>
  ) : runnerDefinitionFromLocalCache ? (
    <>
      <ThemedOnScreenDebug
        label={`StoredRunnerView for ${runnerName} runnerDefinitionFromLocalCache`}
        data={runnerDefinitionFromLocalCache}
        initiallyUnfolded={false}
      />
      <RunnerView
        runnerName={runnerName}
        applicationDeploymentMap={defaultSelfApplicationDeploymentMap}
        deploymentUuid={runnerDeploymentUuid}
        formMLSchema={runnerDefinitionFromLocalCache.formMLSchema as FormMLSchema}
        initialFormValue={initialFormValue}
        action={{
          actionType: "compositeActionTemplate",
          compositeActionTemplate: runnerDefinitionFromLocalCache.actionTemplate,
        }}
        // formLabel={runnerLabel}
        formLabel={runnerDefinitionFromLocalCache.defaultLabel}
        labelElement={<h2>{runnerDefinitionFromLocalCache.defaultLabel}</h2>}
        // labelElement={<h2>{runnerLabel}</h2>}
        formikValuePathAsString={runnerName}
        displaySubmitButton="onFirstLine"
        useActionButton={false}
      />
    </>
  ) : (
    <div>Loading runner definition...</div>
  );
}
// ################################################################################################
export const RunnerView = <T extends Record<string, any>>(props: RunnerProps<T>) => {
  const {
    runnerName,
    application,
    formMLSchema,
    deploymentUuid,
    applicationDeploymentMap,
    initialFormValue,
    action,
    // miroirModelEnvironment,
    labelElement,
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
    // useCurrentModelEnvironment(deploymentUuid, applicationDeploymentMap);
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
      <ThemedOnScreenDebug
        label={`RunnerView ${runnerName} currentModelEnvironment`}
        data={currentModelEnvironment}
        copyButton={true}
        initiallyUnfolded={false}
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
