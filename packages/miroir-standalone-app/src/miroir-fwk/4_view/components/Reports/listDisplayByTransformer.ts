import {
  defaultMiroirModelEnvironment,
  defaultTransformerInput,
  TransformerFailure,
  transformer_extended_apply_wrapper,
  type CoreTransformerForBuildPlusRuntime,
  type TransformerReturnType,
} from "miroir-core";

/** Default per-row identity transformer (exposes each list row as `row`). */
export const DEFAULT_ROW_IDENTITY_TRANSFORMER: CoreTransformerForBuildPlusRuntime = {
  interpolation: "runtime",
  transformerType: "getFromContext",
  referenceName: "row",
};

/**
 * Wrap an element-level transformer into the mapList built-in applied per row.
 * Each row is exposed to the element transformer under `referenceName`.
 */
export function buildRowMapListTransformer(
  elementTransformer: CoreTransformerForBuildPlusRuntime,
  referenceName = "row",
): CoreTransformerForBuildPlusRuntime {
  return {
    interpolation: "runtime",
    transformerType: "mapList",
    referenceToOuterObject: referenceName,
    elementTransformer,
  };
}

/**
 * Apply an element-level transformer to every row of a list section payload.
 * Accepts both array and uuid-indexed object shapes (mapList handles both natively).
 */
export function applyTransformerToListRows(
  instancesToDisplay: any[] | Record<string, any>,
  elementTransformer: CoreTransformerForBuildPlusRuntime,
  transformerParams: Record<string, any> = {},
): TransformerReturnType<any> {
  return transformer_extended_apply_wrapper(
    undefined,
    "runtime",
    ["rootTransformer"],
    "listDisplayByTransformer",
    buildRowMapListTransformer(elementTransformer),
    "value",
    defaultMiroirModelEnvironment,
    transformerParams,
    { [defaultTransformerInput]: instancesToDisplay },
  );
}

function isTransformerFailureValue(value: unknown): value is TransformerFailure {
  return (
    value instanceof TransformerFailure ||
    (typeof value === "object" &&
      value !== null &&
      "queryFailure" in value &&
      typeof (value as TransformerFailure).queryFailure === "string")
  );
}

/** First failure in a list-transform result (top-level or per-row in a mapList array). */
export function getListTransformationFailure(
  result: TransformerReturnType<any>,
): TransformerFailure | null {
  if (isTransformerFailureValue(result)) {
    return result;
  }
  if (Array.isArray(result)) {
    return result.find((item) => isTransformerFailureValue(item)) ?? null;
  }
  return null;
}
