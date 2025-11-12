import { Formik, FormikHelpers } from "formik";
import type { ReactElement } from "react";

import type {
  JzodObject,
  LoggerInterface,
} from "miroir-core";
import {
  MiroirLoggerFactory,
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { TypedValueObjectEditor } from "../Reports/TypedValueObjectEditor.js";
import { cleanLevel } from "../../constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ActionPad"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface ActionPadProps<T = any> {
  deploymentUuid: string;
  formMlSchema: JzodObject;
  initialFormValue: T;
  onSubmit: (values: T, formikHelpers: FormikHelpers<T>) => void | Promise<void>;
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
export const ActionPad = <T extends Record<string, any> = any>({
  deploymentUuid,
  formMlSchema,
  initialFormValue,
  onSubmit,
  labelElement,
  formikValuePathAsString,
  formLabel,
  displaySubmitButton,
  useActionButton = true,
  validateOnChange = false,
  validateOnBlur = false,
  enableReinitialize = true,
}: ActionPadProps<T>) => {
  return (
    <Formik
      enableReinitialize={enableReinitialize}
      initialValues={initialFormValue}
      onSubmit={onSubmit}
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
