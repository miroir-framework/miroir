import { Formik, FormikHelpers } from "formik";

import type {
  DomainControllerInterface,
  LoggerInterface,
  MiroirModelEnvironment,
  TransformerForBuildPlusRuntime,
} from "miroir-core";
import {
  Action2Error,
  MiroirLoggerFactory,
  transformer_extended_apply_wrapper
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useDomainControllerService, useMiroirContextService } from "../../MiroirContextReactProvider.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { InnerRunnerView } from "./InnerRunnerView.js";
import type { RunnerProps } from "./RunnerInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunnerView"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export const RunnerView = <T extends Record<string, any>>(props: RunnerProps<T>) => {
  const {
    runnerName,
    deploymentUuid,
    formMlSchema,
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
        const result = await domainController.handleCompositeAction(
          action.compositeActionSequence,
          currentMiroirModelEnvironment,
          values as Record<string, any>
        );
        formikHelpers.setSubmitting(false);
        formikHelpers.setValues(initialValues);
        return result;
        break;
      }
      case "compositeActionTemplate": {
        const result = await domainController.handleCompositeActionTemplate(
          action.compositeActionTemplate,
          currentMiroirModelEnvironment,
          values as Record<string, any>
        );
        log.info(
          "RunnerView handleSubmit compositeActionTemplate",
          action.compositeActionTemplate,
          "result",
          result
        );
        formikHelpers.setSubmitting(false);
        formikHelpers.setValues(initialValues);
        return result;
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
  };

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
