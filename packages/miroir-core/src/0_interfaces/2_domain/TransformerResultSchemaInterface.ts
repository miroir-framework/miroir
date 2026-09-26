import { MlElement } from "../1_core/preprocessor-generated/miroirFundamentalType";

export type FailedTransformerInterfaceFromDefinitionFailureKind =
  | "missingTransformerType"
  | "unknownTransformerType"
  | "missingTransformerResultSchema"
  | "contextMissingReference"
  | "contextPathNotFound"
  | "schemaShapeMismatch"
  | "accessDynamicPathFailure";

export interface FailedTransformerInterfaceFromDefinition {
  status: "error";
  failureKind: FailedTransformerInterfaceFromDefinitionFailureKind;
  error: string;
  transformerType?: string;
  referenceName?: string;
  referencePath?: string[];
  expectedSchema?: MlElement;
  actualSchema?: MlElement;
  typePath: (string | number)[];
  transformerPath?: (string | number)[];
  innerError?: FailedTransformerInterfaceFromDefinition;
}

export type ResolveTransformerResultSchemaReturnType =
  | MlElement
  | FailedTransformerInterfaceFromDefinition;

export function isFailedTransformerInterfaceFromDefinition(
  result: ResolveTransformerResultSchemaReturnType,
): result is FailedTransformerInterfaceFromDefinition {
  return (
    typeof result === "object" &&
    result !== null &&
    "status" in result &&
    (result as FailedTransformerInterfaceFromDefinition).status === "error" &&
    "failureKind" in result
  );
}
