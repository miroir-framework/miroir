import type { FormikHelpers } from "formik";
import type { CompositeActionSequence, CompositeActionTemplate, TransformerForBuildPlusRuntime, JzodObject, BoxedQueryTemplateWithExtractorCombinerTransformer, BoxedQueryWithExtractorCombinerTransformer, MiroirModelEnvironment, Uuid, ApplicationDeploymentMap } from "miroir-core";
import type { MlSchemaTemplate } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
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

// ##################################################################################################
// TODO: take it from the Runner entity definition!
export type FormMLSchema =
  | {
      formMLSchemaType: "mlSchema";
      initialFormValues?: Record<string, any>;
      mlSchema: JzodObject;
    }
  | {
      formMLSchemaType: "transformer";
      initialFormValues?: Record<string, any>;
      // transformer: TransformerForBuildPlusRuntime;
      transformer: MlSchemaTemplate;
    };

// ################################################################################################
export interface RunnerProps<T extends Record<string, any>> {
  runnerName: string;
  application?: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  // deploymentUuid: Uuid;
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
  validationTransformer?: TransformerForBuildPlusRuntime;
}

// ################################################################################################
export interface OuterRunnerProps<T extends Record<string, any>> extends RunnerProps<T> {
}
