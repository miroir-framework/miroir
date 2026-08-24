import { describe, expect, it } from "vitest";

import type { CoreTransformerForBuildPlusRuntime } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  isFailedTransformerInterfaceFromDefinition,
  resolveTransformerResultSchema,
} from "../../src/2_domain/Transformer_ResultSchema";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "Transformer_ResultSchema.failures" ||
  RUN_TEST === "Transformer_ResultSchema.failures.unit.test";

function expectFailure(result: unknown) {
  expect(isFailedTransformerInterfaceFromDefinition(result)).toBe(true);
  return result as Extract<
    ReturnType<typeof resolveTransformerResultSchema>,
    { status: "error" }
  >;
}

(shouldRun ? describe : describe.skip)(
  "resolveTransformerResultSchema failures by transformer (issue #88 slice 12)",
  () => {
    describe("core resolution errors", () => {
      it("missingTransformerType for non-object transformer", () => {
        const failure = expectFailure(resolveTransformerResultSchema("literal", {}));
        expect(failure.failureKind).toBe("missingTransformerType");
        expect(failure.typePath).toEqual([]);
      });

      it("unknownTransformerType for unregistered transformerType", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            { transformerType: "nonExistentTransformer", interpolation: "runtime" },
            {},
          ),
        );
        expect(failure.failureKind).toBe("unknownTransformerType");
        expect(failure.transformerType).toBe("nonExistentTransformer");
      });
    });

    describe("getFromContext", () => {
      it("contextMissingReference when referenceName is absent from context", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "price",
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("contextMissingReference");
        expect(failure.referenceName).toBe("price");
        expect(failure.typePath).toEqual(["getFromContext", "referenceName"]);
      });

      it("contextPathNotFound when referencePath traverses a non-object schema", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referencePath: ["row", "missing"],
            },
            {
              row: { type: "string" },
            },
          ),
        );
        expect(failure.failureKind).toBe("contextPathNotFound");
        expect(failure.referencePath).toEqual(["row", "missing"]);
        expect(failure.actualSchema).toEqual({ type: "string" });
      });
    });

    describe("getFromParameters", () => {
      it("contextMissingReference when parameter binding is absent", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "getFromParameters",
              interpolation: "runtime",
              referenceName: "items",
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("contextMissingReference");
        expect(failure.transformerType).toBe("getFromParameters");
        expect(failure.referenceName).toBe("items");
      });

      it("contextPathNotFound when nested parameter path is invalid", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "getFromParameters",
              interpolation: "runtime",
              referencePath: ["config", "depth"],
            },
            {
              config: { type: "number" },
            },
          ),
        );
        expect(failure.failureKind).toBe("contextPathNotFound");
        expect(failure.typePath).toEqual(["getFromParameters", "referencePath", 1]);
      });
    });

    describe("boolExpr", () => {
      const baseAndExpr: CoreTransformerForBuildPlusRuntime = {
        transformerType: "boolExpr",
        interpolation: "runtime",
        operator: "&&",
        left: {
          transformerType: "returnValue",
          interpolation: "runtime",
          mlSchema: { type: "string" },
          value: "yes",
        },
        right: {
          transformerType: "returnValue",
          interpolation: "runtime",
          mlSchema: { type: "boolean" },
          value: true,
        },
      };

      it("schemaShapeMismatch when logical && left operand is not boolean", () => {
        const failure = expectFailure(resolveTransformerResultSchema(baseAndExpr, {}));
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.transformerType).toBe("boolExpr");
        expect(failure.typePath).toEqual(["boolExpr", "left"]);
        expect(failure.expectedSchema).toEqual({ type: "boolean" });
        expect(failure.actualSchema).toEqual({ type: "string" });
      });

      it("schemaShapeMismatch when logical && right operand is not boolean", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              ...baseAndExpr,
              left: {
                transformerType: "returnValue",
                interpolation: "runtime",
                mlSchema: { type: "boolean" },
                value: true,
              },
              right: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "flag",
              },
            },
            { flag: { type: "number" } },
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.typePath).toEqual(["boolExpr", "right"]);
        expect(failure.referenceName).toBe("flag");
        expect(failure.actualSchema).toEqual({ type: "number" });
      });

      it("allows comparison operators with non-boolean operand schemas", () => {
        const result = resolveTransformerResultSchema(
          {
            transformerType: "boolExpr",
            interpolation: "runtime",
            operator: "==",
            left: {
              transformerType: "returnValue",
              interpolation: "runtime",
              mlSchema: { type: "number" },
              value: 1,
            },
            right: {
              transformerType: "returnValue",
              interpolation: "runtime",
              mlSchema: { type: "number" },
              value: 2,
            },
          },
          {},
        );
        expect(isFailedTransformerInterfaceFromDefinition(result)).toBe(false);
        expect(result).toEqual({ type: "boolean" });
      });
    });

    describe("ifThenElse", () => {
      it("schemaShapeMismatch when if branch is not boolean", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "ifThenElse",
              interpolation: "runtime",
              if: {
                transformerType: "returnValue",
                interpolation: "runtime",
                mlSchema: { type: "string" },
                value: "truthy",
              },
              then: {
                transformerType: "returnValue",
                interpolation: "runtime",
                mlSchema: { type: "number" },
                value: 1,
              },
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.transformerType).toBe("ifThenElse");
        expect(failure.typePath).toEqual(["ifThenElse", "if"]);
        expect(failure.actualSchema).toEqual({ type: "string" });
      });

      it("schemaShapeMismatch when if uses getFromContext bound to non-boolean schema", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "ifThenElse",
              interpolation: "runtime",
              if: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "active",
              },
              then: {
                transformerType: "returnValue",
                interpolation: "runtime",
                mlSchema: { type: "string" },
                value: "on",
              },
            },
            { active: { type: "number" } },
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.referenceName).toBe("active");
        expect(failure.typePath).toEqual(["ifThenElse", "if"]);
      });
    });

    describe("numericOp", () => {
      it("schemaShapeMismatch when an arg resolves to a non-number schema", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "numericOp",
              interpolation: "runtime",
              op: "*",
              args: [
                {
                  transformerType: "returnValue",
                  interpolation: "runtime",
                  mlSchema: { type: "number" },
                  value: 2,
                },
                {
                  transformerType: "returnValue",
                  interpolation: "runtime",
                  mlSchema: { type: "string" },
                  value: "x",
                },
              ],
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.transformerType).toBe("numericOp");
        expect(failure.typePath).toEqual(["numericOp", "args", 1]);
        expect(failure.actualSchema).toEqual({ type: "string" });
      });

      it("propagates contextMissingReference from arg sub-transformer", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "numericOp",
              interpolation: "runtime",
              op: "-",
              args: [
                {
                  transformerType: "getFromParameters",
                  interpolation: "build",
                  referenceName: "amount",
                },
              ],
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("contextMissingReference");
        expect(failure.referenceName).toBe("amount");
        expect(failure.transformerPath).toEqual(["numericOp", 0]);
      });
    });

    describe("pickFromList", () => {
      it("schemaShapeMismatch when applyTo is not an array schema", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "pickFromList",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "list",
              },
              index: 0,
            },
            { list: { type: "number" } },
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.referenceName).toBe("list");
        expect(failure.typePath).toEqual(["pickFromList", "applyTo"]);
      });

      it("propagates contextMissingReference from applyTo binding", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "pickFromList",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromParameters",
                interpolation: "build",
                referenceName: "rows",
              },
              index: 0,
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("contextMissingReference");
        expect(failure.referenceName).toBe("rows");
      });
    });

    describe("mapList", () => {
      it("schemaShapeMismatch when applyTo from getFromParameters is not array", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "mapList",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromParameters",
                interpolation: "build",
                referenceName: "items",
              },
              elementTransformer: {
                transformerType: "returnValue",
                interpolation: "runtime",
                mlSchema: { type: "number" },
                value: 0,
              },
            },
            { items: { type: "number" } },
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.typePath).toEqual(["mapList", "applyTo"]);
      });

      it("propagates failure from elementTransformer operand", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "mapList",
              interpolation: "runtime",
              elementTransformer: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "missing",
              },
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("contextMissingReference");
        expect(failure.transformerPath).toEqual(["mapList", "elementTransformer"]);
      });
    });

    describe("stringOp", () => {
      it("schemaShapeMismatch when length applyTo is not string", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "stringOp",
              interpolation: "runtime",
              op: "length",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "label",
              },
            },
            { label: { type: "number" } },
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.typePath).toEqual(["stringOp", "applyTo"]);
      });

      it("propagates contextMissingReference from length applyTo binding", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "stringOp",
              interpolation: "runtime",
              op: "length",
              applyTo: {
                transformerType: "getFromParameters",
                interpolation: "build",
                referenceName: "text",
              },
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("contextMissingReference");
        expect(failure.referenceName).toBe("text");
      });
    });

    describe("accessDynamicPath", () => {
      it("accessDynamicPathFailure when path starts with a string segment", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "accessDynamicPath",
              interpolation: "runtime",
              objectAccessPath: ["definition"],
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("accessDynamicPathFailure");
        expect(failure.typePath).toEqual(["accessDynamicPath", "objectAccessPath", 0]);
      });

      it("accessDynamicPathFailure when segment is missing on object schema", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "accessDynamicPath",
              interpolation: "runtime",
              objectAccessPath: [
                {
                  transformerType: "returnValue",
                  interpolation: "runtime",
                  mlSchema: { type: "object", definition: {} },
                  value: {},
                },
                "missingKey",
              ],
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("accessDynamicPathFailure");
        expect(failure.typePath).toEqual(["accessDynamicPath", "objectAccessPath", 1]);
      });
    });

    describe("dataflowObject", () => {
      it("propagates nested stringOp length mismatch with transformerPath", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "dataflowObject",
              interpolation: "runtime",
              definition: {
                date: {
                  transformerType: "returnValue",
                  interpolation: "runtime",
                  mlSchema: { type: "number" },
                  value: 1,
                },
                len: {
                  transformerType: "stringOp",
                  interpolation: "runtime",
                  op: "length",
                  applyTo: {
                    transformerType: "getFromContext",
                    interpolation: "runtime",
                    referenceName: "date",
                  },
                },
              },
            },
            {},
          ),
        );
        expect(failure.transformerPath).toEqual(["dataflowObject", "definition", "len"]);
        expect(failure.innerError?.failureKind).toBe("schemaShapeMismatch");
        expect(failure.innerError?.referenceName).toBe("date");
      });

      it("propagates boolExpr if-branch mismatch from nested step", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "dataflowObject",
              interpolation: "runtime",
              definition: {
                gate: {
                  transformerType: "ifThenElse",
                  interpolation: "runtime",
                  if: {
                    transformerType: "getFromContext",
                    interpolation: "runtime",
                    referenceName: "enabled",
                  },
                  then: {
                    transformerType: "returnValue",
                    interpolation: "runtime",
                    mlSchema: { type: "string" },
                    value: "yes",
                  },
                },
              },
            },
            { enabled: { type: "string" } },
          ),
        );
        expect(failure.transformerPath).toEqual(["dataflowObject", "definition", "gate"]);
        expect(failure.innerError?.failureKind).toBe("schemaShapeMismatch");
        expect(failure.innerError?.typePath).toEqual(["ifThenElse", "if"]);
      });
    });

    describe("createObject", () => {
      it("propagates nested contextMissingReference without context threading", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "createObject",
              interpolation: "runtime",
              definition: {
                a: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referenceName: "missingA",
                },
                b: {
                  transformerType: "returnValue",
                  interpolation: "runtime",
                  mlSchema: { type: "number" },
                  value: 1,
                },
              },
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("contextMissingReference");
        expect(failure.transformerPath).toEqual(["createObject", "definition", "a"]);
        expect(failure.referenceName).toBe("missingA");
      });

      it("propagates nested boolExpr operand mismatch on another key", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "createObject",
              interpolation: "runtime",
              definition: {
                ok: {
                  transformerType: "boolExpr",
                  interpolation: "runtime",
                  operator: "!",
                  left: {
                    transformerType: "returnValue",
                    interpolation: "runtime",
                    mlSchema: { type: "number" },
                    value: 0,
                  },
                },
              },
            },
            {},
          ),
        );
        expect(failure.transformerPath).toEqual(["createObject", "definition", "ok"]);
        expect(failure.innerError?.typePath).toEqual(["boolExpr", "left"]);
      });
    });

    describe("returnValue", () => {
      it("does not fail when mlSchema is absent (falls back to any)", () => {
        const result = resolveTransformerResultSchema(
          {
            transformerType: "returnValue",
            interpolation: "runtime",
            value: 42,
          },
          {},
        );
        expect(isFailedTransformerInterfaceFromDefinition(result)).toBe(false);
        expect(result).toEqual({ type: "any" });
      });

      it("fails downstream when used as boolean operand without boolean mlSchema", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "boolExpr",
              interpolation: "runtime",
              operator: "||",
              left: {
                transformerType: "returnValue",
                interpolation: "runtime",
                value: true,
              },
              right: {
                transformerType: "returnValue",
                interpolation: "runtime",
                value: false,
              },
            },
            {},
          ),
        );
        expect(failure.typePath).toEqual(["boolExpr", "left"]);
        expect(failure.actualSchema).toEqual({ type: "any" });
      });
    });

    describe("filterList", () => {
      it("schemaShapeMismatch when applyTo is not array", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "filterList",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "items",
              },
              predicate: {
                transformerType: "returnValue",
                interpolation: "runtime",
                mlSchema: { type: "boolean" },
                value: true,
              },
            },
            { items: { type: "number" } },
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.typePath).toEqual(["filterList", "applyTo"]);
      });

      it("schemaShapeMismatch when predicate is not boolean", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "filterList",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "items",
              },
              predicate: {
                transformerType: "returnValue",
                interpolation: "runtime",
                mlSchema: { type: "string" },
                value: "yes",
              },
            },
            { items: { type: "array", definition: { type: "string" } } },
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.typePath).toEqual(["filterList", "predicate"]);
      });
    });

    describe("sortList", () => {
      it("schemaShapeMismatch when applyTo is not array", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "sortList",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "items",
              },
            },
            { items: { type: "string" } },
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.typePath).toEqual(["sortList", "applyTo"]);
      });

      it("contextMissingReference propagates from applyTo binding", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "sortList",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "missing",
              },
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("contextMissingReference");
        expect(failure.transformerPath).toEqual(["sortList", "applyTo"]);
      });
    });

    describe("listLength", () => {
      it("schemaShapeMismatch when applyTo is not array", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "listLength",
              interpolation: "runtime",
              applyTo: {
                transformerType: "returnValue",
                interpolation: "runtime",
                mlSchema: { type: "number" },
                value: 3,
              },
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.typePath).toEqual(["listLength", "applyTo"]);
      });

      it("schemaShapeMismatch when applyTo transformer is absent", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "listLength",
              interpolation: "runtime",
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.typePath).toEqual(["listLength", "applyTo"]);
      });
    });

    describe("find", () => {
      it("schemaShapeMismatch when applyTo is not array", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "find",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "rows",
              },
              predicate: {
                transformerType: "returnValue",
                interpolation: "runtime",
                mlSchema: { type: "boolean" },
                value: true,
              },
            },
            { rows: { type: "object", definition: {} } },
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.typePath).toEqual(["find", "applyTo"]);
      });

      it("schemaShapeMismatch when predicate is not boolean", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "find",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "rows",
              },
              predicate: {
                transformerType: "returnValue",
                interpolation: "runtime",
                mlSchema: { type: "number" },
                value: 1,
              },
            },
            { rows: { type: "array", definition: { type: "string" } } },
          ),
        );
        expect(failure.typePath).toEqual(["find", "predicate"]);
      });
    });

    describe("concatLists", () => {
      it("schemaShapeMismatch when a list operand is not array", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "concatLists",
              interpolation: "runtime",
              lists: [
                {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referenceName: "a",
                },
              ],
            },
            { a: { type: "number" } },
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.typePath).toEqual(["concatLists", "lists", 0]);
      });

      it("propagates contextMissingReference from list operand", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "concatLists",
              interpolation: "runtime",
              lists: [
                {
                  transformerType: "getFromParameters",
                  interpolation: "build",
                  referenceName: "left",
                },
              ],
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("contextMissingReference");
        expect(failure.transformerPath).toEqual(["concatLists", 0]);
      });
    });

    describe("getObjectValues", () => {
      it("schemaShapeMismatch when applyTo is not object", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "getObjectValues",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "row",
              },
            },
            { row: { type: "array", definition: { type: "string" } } },
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.typePath).toEqual(["getObjectValues", "applyTo"]);
      });

      it("contextMissingReference propagates from applyTo", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "getObjectValues",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referenceName: "row",
              },
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("contextMissingReference");
        expect(failure.transformerPath).toEqual(["getObjectValues", "applyTo"]);
      });
    });

    describe("aggregate", () => {
      it("schemaShapeMismatch when applyTo is not array", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "aggregate",
              interpolation: "runtime",
              function: "count",
              applyTo: {
                transformerType: "returnValue",
                interpolation: "runtime",
                mlSchema: { type: "string" },
                value: "x",
              },
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
        expect(failure.typePath).toEqual(["aggregate", "applyTo"]);
      });

      it("schemaShapeMismatch when applyTo is missing", () => {
        const failure = expectFailure(
          resolveTransformerResultSchema(
            {
              transformerType: "aggregate",
              interpolation: "runtime",
              function: "count",
            },
            {},
          ),
        );
        expect(failure.failureKind).toBe("schemaShapeMismatch");
      });
    });
  },
);
