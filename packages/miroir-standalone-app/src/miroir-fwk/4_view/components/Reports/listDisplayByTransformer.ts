import { valueToJzod } from "@miroir-framework/jzod";
import {
  defaultMiroirModelEnvironment,
  defaultTransformerInput,
  EntityInstance,
  EntityInstancesUuidIndex,
  isFailedTransformerInterfaceFromDefinition,
  resolveTransformerResultSchema,
  TransformerFailure,
  transformer_extended_apply_wrapper,
  type CoreTransformerForBuildPlusRuntime,
  type JzodElement,
  type TransformerReturnType,
} from "miroir-core";

import { paginateRows } from "../Grids/gridPagination.js";

/** Rows per page while the list-section transformer panel is enabled. */
export const LIST_TRANSFORMER_PAGE_SIZE = 10;

function compareInstancesByAttribute(
  a: EntityInstance,
  b: EntityInstance,
  sortByAttribute?: string,
): number {
  if (!sortByAttribute) {
    return 0;
  }
  const aValue = (a as Record<string, unknown>)[sortByAttribute];
  const bValue = (b as Record<string, unknown>)[sortByAttribute];
  if (aValue === bValue) {
    return 0;
  }
  if (aValue == null) {
    return -1;
  }
  if (bValue == null) {
    return 1;
  }
  return aValue > bValue ? 1 : -1;
}

/** Sort and slice a uuid-indexed list to one page (matches EntityInstanceGrid row order). */
export function sliceInstancesToPage(
  instancesToDisplay: EntityInstancesUuidIndex,
  pageIndex: number,
  pageSize: number,
  sortByAttribute?: string,
): EntityInstancesUuidIndex {
  const sorted = Object.values(instancesToDisplay ?? {})
    .filter(
      (instance): instance is EntityInstance =>
        instance != null && typeof instance === "object" && !Array.isArray(instance),
    )
    .sort((a, b) => compareInstancesByAttribute(a, b, sortByAttribute));

  const pageRows = paginateRows(sorted, pageIndex, pageSize).pageRows;
  return Object.fromEntries(pageRows.map((instance) => [instance.uuid, instance]));
}

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

const ANY_SCHEMA: JzodElement = { type: "any" };

/**
 * Declared display schema for list-transformer results.
 * Prefer design-time typed inference with `row` context; fall back to value shape
 * (`arrayAsArray`). Use `{ type: "any" }` only as last resort — declaring `any`
 * as formValueMLSchema keeps orange union stars in the editor.
 */
export function resolveListTransformationResultDisplaySchema(
  elementTransformer: CoreTransformerForBuildPlusRuntime,
  transformationResult: TransformerReturnType<any>,
  rowMlSchema?: JzodElement,
): JzodElement {
  if (rowMlSchema) {
    const typed = resolveTransformerResultSchema(
      buildRowMapListTransformer(elementTransformer),
      { row: rowMlSchema },
    );
    if (!isFailedTransformerInterfaceFromDefinition(typed)) {
      return typed;
    }
  }

  return (valueToJzod(transformationResult, "arrayAsArray") ?? ANY_SCHEMA) as JzodElement;
}
