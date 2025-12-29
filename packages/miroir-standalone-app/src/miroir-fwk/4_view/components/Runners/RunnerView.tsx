import { Formik, FormikHelpers } from "formik";

import type {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
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
  entityDeployment,
  MiroirLoggerFactory,
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

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunnerView"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

export function StoredRunnerView(props: {
  applicationUuid: Uuid,
  storedRunner: Runner,
}) {
  const runnerName: string = props.storedRunner.name;
  const runnerLabel: string = props.storedRunner.defaultLabel;

  // const runnerDefinitionFromLocalCache: any = useRunner(adminConfigurationDeploymentMiroir.uuid, "44313751-b0e5-4132-bb12-a544806e759b");

  const initialFormValue = useMemo(() => {
    return {
      [runnerName]: {
        application: noValue.uuid,
        entity: noValue.uuid,
      },
    };
  }, [runnerName]);

  // const deploymentUuid = defaultAdminApplicationDeploymentMapNOTGOOD[props.applicationUuid];
  // const deploymentUuid = adminConfigurationDeploymentParis.uuid;
  const deploymentUuid = adminConfigurationDeploymentLibrary.uuid;

  // // look up the action implementation in the currentModelEnvironment
  // const currentEndpointDefinition: EndpointDefinition | undefined =
  //   currentModelEnvironment?.currentModel?.endpoints?.find(
  //     (ep) => ep.uuid == (domainAction as any).endpoint
  //   );


  return (<RunnerView
    runnerName={runnerName}
    deploymentUuid={deploymentUuid}
    // deploymentUuidQuery={deploymentUuidQuery}
    formMLSchema={props.storedRunner.formMLSchema as FormMLSchema}
    initialFormValue={initialFormValue}
    action={{
      actionType: "compositeActionTemplate",
      compositeActionTemplate: props.storedRunner.actionTemplate,
    }}
    labelElement={<h2>{runnerLabel}</h2>}
    formikValuePathAsString={runnerName}
    formLabel={runnerLabel}
    displaySubmitButton="onFirstLine"
    useActionButton={false}
  />);
}
// ################################################################################################
export const RunnerView = <T extends Record<string, any>>(props: RunnerProps<T>) => {
  const {
    runnerName,
    formMLSchema,
    deploymentUuid,
    initialFormValue,
    action,
    // miroirModelEnvironment,
    labelElement,
    formikValuePathAsString,
    formLabel,
    displaySubmitButton,
    useActionButton = true,
    validateOnChange = false,
    validateOnBlur = false,
    // enableReinitialize = true,
  } = props;
  const domainController: DomainControllerInterface = useDomainControllerService();
  const currentMiroirModelEnvironment: MiroirModelEnvironment =
    useCurrentModelEnvironment(deploymentUuid);
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
            currentMiroirModelEnvironment, // TODO: the DeploymentUuid can change, need to handle that?
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
          const result = await domainController.handleCompositeAction(
            action.compositeActionSequence,
            currentMiroirModelEnvironment,
            values as Record<string, any>
          );
          formikHelpers.setSubmitting(false);
          formikHelpers.setValues(initialValues);
          return Promise.resolve(result);
        },"Run composite action sequence successful","RunnerView compositeActionSequence");
        break;
      }
      case "compositeActionTemplate": {
        return handleAsyncAction(async () => {
          const result = await domainController.handleCompositeActionTemplate(
            action.compositeActionTemplate,
            currentMiroirModelEnvironment,
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
