import {
  type CoreTransformerForBuildPlusRuntime,
  type InputOutputPayloadType,
  type InputOutputType,
  type JzodElement,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { isFailedTransformerInterfaceFromDefinition } from "../0_interfaces/2_domain/TransformerResultSchemaInterface";
import { safeStringify } from "../4_services/otherTools";
import { resolveTransformerResultSchema } from "./Transformer_ResultSchema";

function isTransformerExpression(
  transformer: CoreTransformerForBuildPlusRuntime,
): transformer is Exclude<CoreTransformerForBuildPlusRuntime, string | CoreTransformerForBuildPlusRuntime[]> {
  return typeof transformer === "object" && !Array.isArray(transformer) && "transformerType" in transformer;
}

function jzodSchemasEquivalent(a: JzodElement, b: JzodElement): boolean {
  return safeStringify(a) === safeStringify(b);
}

/**
 * Map a resolved transformer result schema (#88) to an `inputOutput` type for adequacy checks.
 * When the schema is the list row entity ML schema, prefer the row entity uuid over bare `object`.
 */
export function inferTransformerOutputTypeFromSchema(
  resultSchema: JzodElement,
  options?: { rowEntityUuid?: string; rowMlSchema?: JzodElement },
): InputOutputType {
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
      jzodSchemasEquivalent(resultSchema, options.rowMlSchema)
    ) {
      return options.rowEntityUuid;
    }
    return "object";
  }
  if (type === "array") {
    let elementSchema: JzodElement | undefined;
    if (Array.isArray(resultSchema.definition)) {
      elementSchema = resultSchema.definition[0] as JzodElement | undefined;
    } else if (
      resultSchema.definition &&
      typeof resultSchema.definition === "object" &&
      "type" in resultSchema.definition
    ) {
      elementSchema = resultSchema.definition as JzodElement;
    }
    const payload: InputOutputPayloadType =
      elementSchema === undefined
        ? "any"
        : (inferTransformerOutputTypeFromSchema(elementSchema, options) as InputOutputPayloadType);
    if (typeof payload === "object") {
      return { type: "array", payload: "any" };
    }
    return { type: "array", payload };
  }
  return "any";
}

/**
 * Infer the per-row output type of an element transformer using `resolveTransformerResultSchema`
 * with `{ row: rowMlSchema }` context. Returns undefined when inference is unavailable.
 */
export function inferElementTransformerOutputType(
  elementTransformer: CoreTransformerForBuildPlusRuntime,
  rowMlSchema?: JzodElement,
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
