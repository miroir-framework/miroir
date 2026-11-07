import type { FormikHelpers } from "formik";
import type {
  ApplicationDeploymentMap,
  CompositeActionSequence,
  CompositeActionTemplate,
  MlObject,
  CoreTransformerForBuildPlusRuntime,
  Uuid
} from "@miroir-framework/core";
import type { MlSchemaTemplate } from "@miroir-framework/core";

// ################################################################################################
export type RunnerAction<T extends Record<string, any>> =
  | {
      actionType: "onSubmit";
      /** Its result, when it is an Action2Error, is shown inline under the Runner (#225). */
      onSubmit: (values: T, formikHelpers: FormikHelpers<T>) => unknown | Promise<unknown>;
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
  transformer: CoreTransformerForBuildPlusRuntime,
}

// ##################################################################################################
// TODO: take it from the Runner entity definition!
export type FormMLSchema =
  | {
      formMLSchemaType: "mlSchema";
      initialFormValues?: Record<string, any>;
      mlSchema: MlObject;
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
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  runnerApplicationDeploymentMap?: ((value: any) => ApplicationDeploymentMap);
  formMLSchema: FormMLSchema;
  initialFormValue: T | InitialFormValue<T>;
  action: RunnerAction<T>;
  formikValuePathAsString: string;
  formLabel: string;
  displaySubmitButton?: "onTop" | "onFirstLine";
  useActionButton?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  enableReinitialize?: boolean;
  validationTransformer?: CoreTransformerForBuildPlusRuntime;
}

// ################################################################################################
export interface OuterRunnerProps<T extends Record<string, any>> extends RunnerProps<T> {
}
