import type { FormikHelpers } from "formik";
import type { CompositeActionSequence, CompositeActionTemplate, TransformerForBuildPlusRuntime, JzodObject, BoxedQueryTemplateWithExtractorCombinerTransformer, BoxedQueryWithExtractorCombinerTransformer, MiroirModelEnvironment, Uuid, ApplicationDeploymentMap } from "miroir-core";
import type { ReactElement } from "react";

// ################################################################################################
export type RunnerAction<T extends Record<string, any>> =
  | {
      actionType: "onSubmit";
      onSubmit: (values: T, formikHelpers: FormikHelpers<T>) => void | Promise<void>;
    }
  | {
      actionType: "compositeActionSequence";
      compositeActionSequence: CompositeActionSequence;
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
export type FormMLSchema =
  // | JzodObject
  | {
      formMLSchemaType: "mlSchema";
      mlSchema: JzodObject;
    }
  | {
      formMLSchemaType: "transformer";
      transformer: TransformerForBuildPlusRuntime;
    };

// ################################################################################################
export interface RunnerProps<T extends Record<string, any>> {
  runnerName: string;
  application?: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  deploymentUuid: Uuid;
  // formMLSchema: JzodObject;
  formMLSchema: FormMLSchema;
  initialFormValue: T | InitialFormValue<T>;
  action: RunnerAction<T>;
  // miroirModelEnvironment?: MiroirModelEnvironment;
  // labelElement?: ReactElement;
  formikValuePathAsString: string;
  formLabel: string;
  displaySubmitButton?: "onTop" | "onFirstLine";
  useActionButton?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  enableReinitialize?: boolean;
}

// ################################################################################################
export interface OuterRunnerProps<T extends Record<string, any>> extends RunnerProps<T> {
}
