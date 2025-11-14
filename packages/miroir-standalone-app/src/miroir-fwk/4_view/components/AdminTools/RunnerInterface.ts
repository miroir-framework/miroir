import type { FormikHelpers } from "formik";
import type { CompositeAction, CompositeActionTemplate, TransformerForBuildPlusRuntime, JzodObject, BoxedQueryTemplateWithExtractorCombinerTransformer, BoxedQueryWithExtractorCombinerTransformer } from "miroir-core";
import type { ReactElement } from "react";

// ################################################################################################
export type RunnerAction<T extends Record<string, any>> =
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
export type InitialFormValue<T extends Record<string, any>> = {
  initFormValueType: "value",
  value: T,
} | {
  initFormValueType: "transformer",
  transformer: TransformerForBuildPlusRuntime,
}

// #
export type FormMlSchema =
  | JzodObject
  | {
      formMlSchemaType: "mlSchema";
      mlSchema: JzodObject;
    }
  | {
      formMlSchemaType: "transformer";
      transformer: TransformerForBuildPlusRuntime;
    };

// ################################################################################################
export interface RunnerProps<T extends Record<string, any>> {
  runnerName: string;
  deploymentUuid: string;
  // formMlSchema: JzodObject;
  formMlSchema: FormMlSchema;
  initialFormValue: T | InitialFormValue<T>;
  action: RunnerAction<T>;
  labelElement?: ReactElement;
  formikValuePathAsString: string;
  formLabel: string;
  displaySubmitButton?: "onTop" | "onFirstLine";
  useActionButton?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  enableReinitialize?: boolean;
  deploymentUuidQuery?:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined;
}

// ################################################################################################
export interface OuterRunnerProps<T extends Record<string, any>> extends RunnerProps<T> {
}
