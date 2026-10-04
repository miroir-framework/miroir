import {
  type CoreTransformerForBuildPlusRuntime,
  type InputOutputPayloadType,
  type InputOutputType,
  type MlElement,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { isFailedTransformerInterfaceFromDefinition } from "../0_interfaces/2_domain/TransformerResultSchemaInterface";
import { resolveTransformerResultSchema } from "./Transformer_ResultSchema";

function isTransformerExpression(
  transformer: CoreTransformerForBuildPlusRuntime,
): transformer is Exclude<CoreTransformerForBuildPlusRuntime, string | CoreTransformerForBuildPlusRuntime[]> {
  return typeof transformer === "object" && !Array.isArray(transformer) && "transformerType" in transformer;
}

function isMlElement(value: unknown): value is MlElement {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "type" in value;
}

/** Full comparison: `safeStringify` truncates long schemas, which would equate distinct entities. */
function mlSchemasEquivalent(a: MlElement, b: MlElement): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * #449 D2-D3: a coarse type as a type parameter. Primitives, `undefined`, `object` and entity
 * uuids stay; arrays, records and tuples would nest, so they give `any`.
 */
export function inputOutputTypeParameter(type: InputOutputType): InputOutputPayloadType {
  return typeof type === "object" || type === "array" || type === "record" ? "any" : type;
}

/**
 * Map a resolved transformer result schema (#88) to an `inputOutput` type for adequacy checks.
 * When the schema is the list row entity ML schema, or another known entity's, prefer the entity
 * uuid over bare `object`. Arrays, records and tuples carry the coarse types of their elements as
 * type parameters, nested ones giving `any` (#449 §3.2).
 */
export function inferTransformerOutputTypeFromSchema(
  resultSchema: MlElement,
  options?: {
    rowEntityUuid?: string;
    rowMlSchema?: MlElement;
    /** #383: ML schemas of known entities, by uuid; an equal schema gives that entity uuid. */
    entityMlSchemas?: Record<string, MlElement>;
  },
): InputOutputType {
  const parameterOf = (schema: MlElement): InputOutputPayloadType =>
    inputOutputTypeParameter(inferTransformerOutputTypeFromSchema(schema, options));
  const type = resultSchema.type;
  if (type === "any") {
    return "any";
  }
  if (type === "undefined") {
    return "undefined";
  }
  if (type === "bigint" || type === "number" || type === "string" || type === "boolean") {
    return type;
  }
  if (type === "object") {
    if (
      options?.rowEntityUuid &&
      options.rowMlSchema &&
      mlSchemasEquivalent(resultSchema, options.rowMlSchema)
    ) {
      return options.rowEntityUuid;
    }
    const entityUuid = Object.entries(options?.entityMlSchemas ?? {}).find(([, entityMlSchema]) =>
      mlSchemasEquivalent(resultSchema, entityMlSchema),
    )?.[0];
    return entityUuid ?? "object";
  }
  if (type === "array") {
    // A list `definition` is not valid ML for an array: its element types are unknown.
    const definition = resultSchema.definition;
    return {
      type: "array",
      payload: isMlElement(definition) ? parameterOf(definition) : "any",
    };
  }
  if (type === "record") {
    return { type: "record", payload: parameterOf(resultSchema.definition) };
  }
  if (type === "tuple") {
    return { type: "tuple", payload: resultSchema.definition.map(parameterOf) };
  }
  return "any";
}

/**
 * Infer the per-row output type of an element transformer using `resolveTransformerResultSchema`
 * with `{ row: rowMlSchema }` context. Returns undefined when inference is unavailable.
 */
export function inferElementTransformerOutputType(
  elementTransformer: CoreTransformerForBuildPlusRuntime,
  rowMlSchema?: MlElement,
  rowEntityUuid?: string,
): InputOutputType | undefined {
  if (!rowMlSchema || !isTransformerExpression(elementTransformer)) {
    return undefined;
  }
  const resolved = resolveTransformerResultSchema(elementTransformer, { row: rowMlSchema });
  if (isFailedTransformerInterfaceFromDefinition(resolved)) {
    return undefined;
  }
  return inferTransformerOutputTypeFromSchema(resolved, { rowEntityUuid, rowMlSchema });
}
