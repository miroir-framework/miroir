import { describe, expect, it } from "vitest";

import type {
  CoreTransformerForBuildPlusRuntime,
  JzodElement,
  TransformerDefinition,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  checkTransformerMlSchemaCompatibility,
  formatMlSchemaTypeLabel,
  getDeclaredInputMlSchema,
  liftInputOutputTypeToMlSchema,
} from "../../src/2_domain/TransformerMlSchemaCheck";
import { applicationTransformerDefinitions } from "../../src/2_domain/TransformersForRuntime";

const stringSchema = { type: "string" } as JzodElement;
const numberSchema = { type: "number" } as JzodElement;
const bookSchema = {
  type: "object",
  definition: {
    uuid: { type: "uuid" },
    name: { type: "string" },
  },
} as JzodElement;
const bookArraySchema = { type: "array", definition: bookSchema } as JzodElement;

const mustache: CoreTransformerForBuildPlusRuntime = {
  interpolation: "runtime",
  transformerType: "mustacheStringTemplate",
  definition: "Hello {{name}}",
};

const identityRow: CoreTransformerForBuildPlusRuntime = {
  interpolation: "runtime",
  transformerType: "getFromContext",
  referenceName: "row",
};

const numericOp: CoreTransformerForBuildPlusRuntime = {
  interpolation: "runtime",
  transformerType: "numericOp",
  op: "*",
  args: [
    { interpolation: "runtime", transformerType: "returnValue", value: 2 },
    { interpolation: "runtime", transformerType: "returnValue", value: 3 },
  ],
};

describe("liftInputOutputTypeToMlSchema (#251)", () => {
  it("lifts primitives and structured payloads", () => {
    expect(liftInputOutputTypeToMlSchema("string")).toEqual({ type: "string" });
    expect(liftInputOutputTypeToMlSchema("any")).toEqual({ type: "any" });
    expect(liftInputOutputTypeToMlSchema("undefined")).toEqual({ type: "undefined" });
    expect(liftInputOutputTypeToMlSchema("array")).toEqual({
      type: "array",
      definition: { type: "any" },
    });
    expect(liftInputOutputTypeToMlSchema({ type: "array", payload: "string" })).toEqual({
      type: "array",
      definition: { type: "string" },
    });
  });

  it("lifts entity uuids to the provided entity mlSchema", () => {
    const uuid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    expect(liftInputOutputTypeToMlSchema(uuid, { [uuid]: bookSchema })).toBe(bookSchema);
  });
});

describe("getDeclaredInputMlSchema (#251)", () => {
  it("is the piped inputOutput.input, not applyTo / result-schema constraints", () => {
    const conflictingApplyTo: TransformerDefinition = {
      uuid: "00000000-0000-4000-8000-000000000001",
      parentUuid: "a557419d-a288-4fb8-8a1e-971c86c113b8",
      name: "conflictingApplyTo",
      defaultLabel: "conflictingApplyTo",
      transformerInterface: {
        inputOutput: { input: "string", output: "any" },
        transformerParameterSchema: {
          transformerType: { type: "literal", definition: "conflictingApplyTo" },
          transformerDefinition: {
            type: "object",
            definition: {
              applyTo: { type: "number" },
            },
          },
        },
        transformerResultSchema: {
          returns: "mlSchemaTransformer",
          addAttributesToContextBeingSubtypeOf: {
            applyTo: { type: "array", definition: { type: "any" } },
          },
          definition: {
            interpolation: "runtime",
            transformerType: "returnValue",
            value: null,
          },
        },
      },
      transformerImplementation: {
        transformerImplementationType: "libraryImplementation",
        inMemoryImplementationFunctionName: "unused",
      },
    };
    expect(getDeclaredInputMlSchema(conflictingApplyTo)).toEqual({ type: "string" });
  });

  it("lifts pickFromList inputOutput.input (array)", () => {
    expect(getDeclaredInputMlSchema(applicationTransformerDefinitions.pickFromList)).toEqual({
      type: "array",
      definition: { type: "any" },
    });
  });

  it("lifts mustacheStringTemplate inputOutput string", () => {
    expect(getDeclaredInputMlSchema(applicationTransformerDefinitions.mustacheStringTemplate)).toEqual(
      { type: "string" },
    );
  });

  it("treats getFromContext declared input as undefined (does not consume piped input)", () => {
    expect(getDeclaredInputMlSchema(applicationTransformerDefinitions.getFromContext)?.type).toBe(
      "undefined",
    );
  });

  it("treats boolExpr and numericOp piped input as any (left/right/args are parameters, not the pipe)", () => {
    expect(getDeclaredInputMlSchema(applicationTransformerDefinitions.boolExpr)).toEqual({
      type: "any",
    });
    expect(getDeclaredInputMlSchema(applicationTransformerDefinitions.numericOp)).toEqual({
      type: "any",
    });
  });
});

describe("checkTransformerMlSchemaCompatibility — single node (#251)", () => {
  it("accepts getFromContext row identity when expected output is the row schema", () => {
    const report = checkTransformerMlSchemaCompatibility(
      identityRow,
      { input: bookSchema, output: bookSchema },
      { row: bookSchema },
    );
    expect(report.status).toBe("ok");
    expect(report.nodes).toHaveLength(1);
    expect(report.nodes[0].actualOutput?.type).toBe("object");
  });

  it("rejects mustacheStringTemplate against a Book row (string ≰ object)", () => {
    const report = checkTransformerMlSchemaCompatibility(mustache, {
      input: bookSchema,
      output: bookSchema,
    });
    expect(report.status).toBe("incompatible");
    expect(report.nodes[0].failures.some((f) => f.direction === "input")).toBe(true);
  });

  it("accepts mustacheStringTemplate when given and expected are string", () => {
    const report = checkTransformerMlSchemaCompatibility(mustache, {
      input: stringSchema,
      output: stringSchema,
    });
    expect(report.status).toBe("ok");
  });

  it("rejects numericOp when expected output is Book (number ≰ object)", () => {
    const report = checkTransformerMlSchemaCompatibility(numericOp, {
      input: bookSchema,
      output: bookSchema,
    });
    expect(report.status).toBe("incompatible");
    expect(report.nodes[0].failures.some((f) => f.direction === "output")).toBe(true);
  });

  it("accepts numericOp when expected output is number", () => {
    const report = checkTransformerMlSchemaCompatibility(numericOp, {
      input: bookSchema,
      output: numberSchema,
    });
    expect(report.status).toBe("ok");
  });

  it("does not mutate the transformer", () => {
    const snapshot = JSON.stringify(mustache);
    checkTransformerMlSchemaCompatibility(mustache, { input: bookSchema, output: stringSchema });
    expect(JSON.stringify(mustache)).toBe(snapshot);
  });
});

describe("checkTransformerMlSchemaCompatibility — nested + Proposal B (#251)", () => {
  it("unwraps pickFromList applyTo array (array(Book) → Book)", () => {
    const pick = {
      interpolation: "runtime" as const,
      transformerType: "pickFromList" as const,
      index: 0,
      applyTo: {
        interpolation: "runtime" as const,
        transformerType: "returnValue" as const,
        mlSchema: bookArraySchema,
        value: [],
      },
    } as CoreTransformerForBuildPlusRuntime;
    const report = checkTransformerMlSchemaCompatibility(pick, {
      input: bookArraySchema,
      output: bookSchema,
    });
    expect(report.status).toBe("ok");
    const pickNode = report.nodes.find((n) => n.path.length === 0);
    expect(pickNode?.actualOutput?.type).toBe("object");
  });

  it("flags mapList.elementTransformer when the element transformer rejects the element schema", () => {
    const mapped = {
      interpolation: "runtime" as const,
      transformerType: "mapList" as const,
      applyTo: {
        interpolation: "runtime" as const,
        transformerType: "returnValue" as const,
        mlSchema: bookArraySchema,
        value: [],
      },
      elementTransformer: mustache,
    } as CoreTransformerForBuildPlusRuntime;
    const report = checkTransformerMlSchemaCompatibility(mapped, {
      input: bookArraySchema,
      output: { type: "array", definition: { type: "any" } } as JzodElement,
    });
    expect(report.status).toBe("incompatible");
    const elementNode = report.nodes.find(
      (n) => n.path.length === 1 && n.path[0] === "elementTransformer",
    );
    expect(elementNode).toBeDefined();
    expect(elementNode!.failures.some((f) => f.direction === "input")).toBe(true);
  });

  it("walks boolExpr.left / .right as child transformers on the parent pipe", () => {
    const expr: CoreTransformerForBuildPlusRuntime = {
      interpolation: "runtime",
      transformerType: "boolExpr",
      operator: "==",
      left: mustache,
      right: { interpolation: "runtime", transformerType: "returnValue", value: 1 },
    };
    const report = checkTransformerMlSchemaCompatibility(expr, {
      input: bookSchema,
      output: { type: "boolean" } as JzodElement,
    });
    expect(report.nodes.find((n) => n.path.length === 0)?.failures).toEqual([]);
    const left = report.nodes.find((n) => n.path.length === 1 && n.path[0] === "left");
    expect(left).toBeDefined();
    expect(left!.failures.some((f) => f.direction === "input")).toBe(true);
    expect(report.nodes.some((n) => n.path[0] === "right")).toBe(true);
  });

  it("walks case.discriminator, case.whens[].when/then, and else", () => {
    const branched: CoreTransformerForBuildPlusRuntime = {
      interpolation: "runtime",
      transformerType: "case",
      discriminator: mustache,
      whens: [
        {
          when: { interpolation: "runtime", transformerType: "mustacheStringTemplate", definition: "w" },
          then: { interpolation: "runtime", transformerType: "mustacheStringTemplate", definition: "t" },
        },
      ],
      else: { interpolation: "runtime", transformerType: "mustacheStringTemplate", definition: "e" },
    };
    const report = checkTransformerMlSchemaCompatibility(branched, {
      input: bookSchema,
      output: { type: "any" } as JzodElement,
    });
    const paths = report.nodes.map((n) => n.path.join("."));
    expect(paths).toEqual(
      expect.arrayContaining(["discriminator", "whens.0.when", "whens.0.then", "else"]),
    );
    expect(
      report.nodes.find((n) => n.path.join(".") === "discriminator")?.failures.some(
        (f) => f.direction === "input",
      ),
    ).toBe(true);
  });

  it("walks concatLists.lists[] as child transformers on the parent pipe", () => {
    const concat: CoreTransformerForBuildPlusRuntime = {
      interpolation: "runtime",
      transformerType: "concatLists",
      lists: [mustache],
    };
    const report = checkTransformerMlSchemaCompatibility(concat, {
      input: bookArraySchema,
      output: { type: "array", definition: { type: "any" } } as JzodElement,
    });
    const list0 = report.nodes.find((n) => n.path[0] === "lists" && n.path[1] === 0);
    expect(list0).toBeDefined();
    expect(list0!.failures.some((f) => f.direction === "input")).toBe(true);
  });

  it("walks filterList.predicate (list combinator child, not a hardcoded key)", () => {
    const filtered = {
      interpolation: "runtime" as const,
      transformerType: "filterList" as const,
      applyTo: {
        interpolation: "runtime" as const,
        transformerType: "returnValue" as const,
        mlSchema: bookArraySchema,
        value: [],
      },
      predicate: mustache,
    } as CoreTransformerForBuildPlusRuntime;
    const report = checkTransformerMlSchemaCompatibility(filtered, {
      input: bookArraySchema,
      output: bookArraySchema,
    });
    const predicate = report.nodes.find((n) => n.path.length === 1 && n.path[0] === "predicate");
    expect(predicate).toBeDefined();
    expect(predicate!.failures.some((f) => f.direction === "input")).toBe(true);
  });

  it("checks adjacent dataflowObject steps (Proposal B composition)", () => {
    const flow: CoreTransformerForBuildPlusRuntime = {
      interpolation: "runtime",
      transformerType: "dataflowObject",
      definition: {
        names: {
          interpolation: "runtime",
          transformerType: "mustacheStringTemplate",
          definition: "{{name}}",
        },
        first: {
          interpolation: "runtime",
          transformerType: "pickFromList",
          index: 0,
        },
      },
    };
    const report = checkTransformerMlSchemaCompatibility(flow, {
      input: bookSchema,
      output: { type: "object", nonStrict: true, definition: {} } as JzodElement,
    });
    expect(report.status).toBe("incompatible");
    const first = report.nodes.find((n) => n.path[0] === "definition" && n.path[1] === "first");
    expect(first?.failures.some((f) => f.direction === "input")).toBe(true);
  });
});

describe("formatMlSchemaTypeLabel (#251)", () => {
  it("summarizes primitives, arrays and objects", () => {
    expect(formatMlSchemaTypeLabel(stringSchema)).toBe("string");
    expect(formatMlSchemaTypeLabel(bookArraySchema)).toBe("array<object{uuid,name}>");
    expect(formatMlSchemaTypeLabel(bookSchema)).toContain("object");
  });
});
