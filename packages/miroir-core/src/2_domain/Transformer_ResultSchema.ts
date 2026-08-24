import {
  CoreTransformerForBuildPlusRuntime,
  JzodElement,
  TransformerDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { applicationTransformerDefinitions } from "./TransformersForRuntime";

export type TransformerResultSchemaContext = Record<string, JzodElement>;

export function resolveTransformerResultSchema(
  transformer: CoreTransformerForBuildPlusRuntime,
  _context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition> = applicationTransformerDefinitions,
): JzodElement {

  const transformerType = transformer.transformerType;
  if (!transformerType) {
    throw new Error("resolveTransformerResultSchema: transformer missing transformerType");
  }

  const definition = transformerDefinitions[transformerType];
  if (!definition) {
    throw new Error(
      `resolveTransformerResultSchema: unknown transformerType "${transformerType}"`,
    );
  }

  const resultSchema = definition.transformerInterface.transformerResultSchema;
  if (!resultSchema) {
    throw new Error(
      `resolveTransformerResultSchema: transformer "${transformerType}" has no transformerResultSchema`,
    );
  }

  if (resultSchema.returns === "mlSchemaTransformer") {
    throw new Error(
      `resolveTransformerResultSchema: mlSchemaTransformer not supported yet for "${transformerType}"`,
    );
  }

  return resultSchema.definition;
}
