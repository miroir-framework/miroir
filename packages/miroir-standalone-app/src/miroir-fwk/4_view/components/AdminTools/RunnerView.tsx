import { Formik, FormikHelpers } from "formik";
import type { ReactElement } from "react";

import type {
  CompositeAction,
  CompositeActionTemplate,
  DomainControllerInterface,
  JzodObject,
  LoggerInterface,
  MiroirModelEnvironment,
} from "miroir-core";
import {
  Action2Error,
  MiroirLoggerFactory,
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { TypedValueObjectEditor } from "../Reports/TypedValueObjectEditor.js";
import { cleanLevel } from "../../constants.js";
import { useDomainControllerService } from "../../MiroirContextReactProvider.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RunnerView"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
type ActionPadAction<T = any> =
  | {
      actionType: "onSubmit";
      onSubmit: (values: T, formikHelpers: FormikHelpers<T>) => void | Promise<void>;
    }
  | {
      actionType: "compositeAction";
      compositeAction: CompositeAction;
    }
  | {
      actionType: "compositeActionTemplate";
      compositeActionTemplate: CompositeActionTemplate;
    };

// ################################################################################################
export interface ActionPadProps<T = any> {
  deploymentUuid: string;
  formMlSchema: JzodObject;
  initialFormValue: T;
  action: ActionPadAction<T>;
  labelElement?: ReactElement;
  formikValuePathAsString: string;
  formLabel: string;
  displaySubmitButton?: "onTop" | "onFirstLine";
  useActionButton?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  enableReinitialize?: boolean;
}

// ################################################################################################
export const RunnerView = <T extends Record<string, any> = any>({
  deploymentUuid,
  formMlSchema,
  initialFormValue,
  action,
  labelElement,
  formikValuePathAsString,
  formLabel,
  displaySubmitButton,
  useActionButton = true,
  validateOnChange = false,
  validateOnBlur = false,
  enableReinitialize = true,
}: ActionPadProps<T>) => {
  const domainController: DomainControllerInterface = useDomainControllerService();
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(deploymentUuid);

  const handleSubmit = async (values: T, formikHelpers: FormikHelpers<T>) => {
    log.info("RunnerView handleSubmit", action.actionType, "values", values);

    switch (action.actionType) {
      case "onSubmit": {
        return action.onSubmit(values, formikHelpers);
        break;
      }
      case "compositeAction": {
        log.info("RunnerView handleSubmit compositeAction", action.compositeAction);
        const result = await domainController.handleCompositeAction(
          action.compositeAction,
          currentMiroirModelEnvironment,
          values as Record<string, any>
        );
        formikHelpers.setSubmitting(false);
        return result;
        break;
      }
      case "compositeActionTemplate": {
        const result = await domainController.handleCompositeActionTemplate(
          action.compositeActionTemplate,
          currentMiroirModelEnvironment,
          values as Record<string, any>
        );
        log.info("RunnerView handleSubmit compositeActionTemplate", action.compositeActionTemplate, "result", result);
        formikHelpers.setSubmitting(false);
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
    <Formik
      enableReinitialize={enableReinitialize}
      initialValues={initialFormValue}
      onSubmit={handleSubmit}
      validateOnChange={validateOnChange}
      validateOnBlur={validateOnBlur}
    >
      <TypedValueObjectEditor
        labelElement={labelElement}
        deploymentUuid={deploymentUuid}
        applicationSection="model"
        formValueMLSchema={formMlSchema}
        formikValuePathAsString={formikValuePathAsString}
        formLabel={formLabel}
        zoomInPath=""
        maxRenderDepth={Infinity}
        displaySubmitButton={displaySubmitButton}
        useActionButton={useActionButton}
      />
    </Formik>
  );
};
