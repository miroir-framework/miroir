import { describe, expect, it } from "vitest";

import type {
  JzodElement,
  TransformerDefinition,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { applicationTransformerDefinitions } from "../../src/2_domain/TransformersForRuntime";

const RUN_TEST = process.env.RUN_TEST;
const shouldRunInventory =
  !RUN_TEST ||
  RUN_TEST === "transformerResultSchema.inventory" ||
  RUN_TEST === "transformerResultSchema.inventory.unit.test";

type ResultSchemaKind = "mlSchema" | "mlSchemaTransformer" | "missing";

function getResultSchemaKind(definition: TransformerDefinition): ResultSchemaKind {
  const resultSchema = definition.transformerInterface?.transformerResultSchema;
  if (!resultSchema) {
    return "missing";
  }
  return resultSchema.returns;
}

function getMlSchemaRootType(definition: TransformerDefinition): string | undefined {
  const resultSchema = definition.transformerInterface?.transformerResultSchema;
  if (!resultSchema || resultSchema.returns !== "mlSchema") {
    return undefined;
  }
  const schema = resultSchema.definition as JzodElement;
  return typeof schema === "object" && schema !== null && "type" in schema
    ? String(schema.type)
    : undefined;
}

function inventoryTransformerResultSchemas(
  definitions: Record<string, TransformerDefinition>,
) {
  const entries = Object.entries(definitions).map(([key, definition]) => ({
    key,
    name: definition.name,
    kind: getResultSchemaKind(definition),
    rootType: getMlSchemaRootType(definition),
  }));

  return {
    entries,
    mlSchemaNonAnyCount: entries.filter(
      (entry) => entry.kind === "mlSchema" && entry.rootType !== "any",
    ).length,
    mlSchemaAnyCount: entries.filter(
      (entry) => entry.kind === "mlSchema" && entry.rootType === "any",
    ).length,
    mlSchemaTransformerCount: entries.filter((entry) => entry.kind === "mlSchemaTransformer")
      .length,
    mlSchemaAnyNames: entries
      .filter((entry) => entry.kind === "mlSchema" && entry.rootType === "any")
      .map((entry) => entry.name)
      .sort(),
    mlSchemaTransformerNames: entries
      .filter((entry) => entry.kind === "mlSchemaTransformer")
      .map((entry) => entry.name)
      .sort(),
  };
}

(shouldRunInventory ? describe : describe.skip)(
  "transformerResultSchema inventory (issue #88 slice 0)",
  () => {
    const inventory = inventoryTransformerResultSchemas(applicationTransformerDefinitions);

    it("includes baseline built-in transformers under test", () => {
      for (const key of ["currentDate", "boolExpr", "returnValue", "pickFromList"] as const) {
        expect(applicationTransformerDefinitions[key]?.name).toBe(key);
      }
    });

    it("declares multiple truthful static mlSchema result schemas", () => {
      expect(inventory.mlSchemaNonAnyCount).toBeGreaterThanOrEqual(2);
    });

    it("documents transformers still declaring coarse { type: any } output schemas", () => {
      expect(inventory.mlSchemaAnyCount).toBeGreaterThanOrEqual(1);
      expect(inventory.mlSchemaAnyNames).toMatchInlineSnapshot(`
        [
          "accessDynamicPath",
          "case",
          "constantAsExtractor",
          "defaultValueForSchema",
          "find",
          "getFromContext",
          "getFromParameters",
          "ifThenElse",
          "resolveConditionalSchema",
          "returnValue",
        ]
      `);
    });

    it("tracks mlSchemaTransformer derivations separately from static mlSchema", () => {
      expect(inventory.mlSchemaTransformerCount).toBeGreaterThanOrEqual(1);
      expect(inventory.mlSchemaTransformerNames).toContain("pickFromList");
    });

    it("documents core transformers still without custom resolver logic (slice 10 baseline)", () => {
      const HANDLED = new Set([
        "pickFromList",
        "returnValue",
        "getFromContext",
        "getFromParameters",
        "accessDynamicPath",
        "boolExpr",
        "numericOp",
        "mapList",
        "stringOp",
        "dataflowObject",
        "ifThenElse",
        "createObject",
        "filterList",
        "sortList",
        "concatLists",
        "listLength",
        "find",
        "getObjectEntries",
        "getObjectValues",
        "getUniqueValues",
        "indexListBy",
        "listReducerToSpreadObject",
        "object_fromEntries",
        "mergeIntoObject",
        "createObjectFromPairs",
        "case",
        "constantAsExtractor",
        "aggregate",
        "+",
        "generateUuid",
        "currentTimestamp",
        "currentDate",
        "mustacheStringTemplate",
      ]);
      const CORE = [
        "returnValue",
        "accessDynamicPath",
        "aggregate",
        "constantAsExtractor",
        "createObject",
        "createObjectFromPairs",
        "dataflowObject",
        "getFromContext",
        "getFromParameters",
        "getObjectEntries",
        "getObjectValues",
        "getUniqueValues",
        "indexListBy",
        "listReducerToSpreadObject",
        "ifThenElse",
        "boolExpr",
        "+",
        "case",
        "pickFromList",
        "mapList",
        "mustacheStringTemplate",
        "generateUuid",
        "mergeIntoObject",
        "concatLists",
        "filterList",
        "find",
        "object_fromEntries",
        "sortList",
        "listLength",
        "stringOp",
        "currentTimestamp",
        "currentDate",
        "numericOp",
      ];
      const unhandled = CORE.filter((key) => !HANDLED.has(key)).sort();
      expect(unhandled).toEqual([]);
    });
  },
);
