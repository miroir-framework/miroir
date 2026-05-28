import { describe, it, expect } from "vitest";
import { jzodToJsonSchema, JsonSchema } from "../../../src/1_core/jzod/JzodToJsonSchema";
import type { JzodElement } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
describe("jzodToJsonSchema", () => {
  // ##############################################################################################
  it("converts string type", () => {
    const element: JzodElement = { type: "string" };
    expect(jzodToJsonSchema(element)).toEqual({ type: "string" });
  });

  // ##############################################################################################
  it("converts number type", () => {
    expect(jzodToJsonSchema({ type: "number" })).toEqual({ type: "number" });
  });

  it("converts boolean type", () => {
    expect(jzodToJsonSchema({ type: "boolean" })).toEqual({ type: "boolean" });
  });

  it("converts any type to empty schema", () => {
    expect(jzodToJsonSchema({ type: "any" })).toEqual({});
  });

  it("converts uuid type to string", () => {
    expect(jzodToJsonSchema({ type: "uuid" })).toEqual({ type: "string" });
  });

  it("includes description when present", () => {
    expect(
      jzodToJsonSchema({ type: "string", description: "A name" })
    ).toEqual({ type: "string", description: "A name" });
  });

  // ##############################################################################################
  it("converts literal type to JSON Schema const", () => {
    expect(jzodToJsonSchema({ type: "literal", definition: "active" })).toEqual({ const: "active" });
  });

  it("converts enum type to JSON Schema enum array", () => {
    expect(
      jzodToJsonSchema({ type: "enum", definition: ["draft", "active", "archived"] })
    ).toEqual({ enum: ["draft", "active", "archived"] });
  });

  // ##############################################################################################
  it("converts array type to JSON Schema array with items", () => {
    expect(
      jzodToJsonSchema({ type: "array", definition: { type: "string" } })
    ).toEqual({ type: "array", items: { type: "string" } });
  });

  it("converts nested array type", () => {
    expect(
      jzodToJsonSchema({ type: "array", definition: { type: "array", definition: { type: "number" } } })
    ).toEqual({ type: "array", items: { type: "array", items: { type: "number" } } });
  });

  // ##############################################################################################
  it("converts object type with all required fields", () => {
    expect(
      jzodToJsonSchema({
        type: "object",
        definition: {
          name: { type: "string" },
          age: { type: "number" },
        },
      })
    ).toEqual({
      type: "object",
      properties: { name: { type: "string" }, age: { type: "number" } },
      required: ["name", "age"],
      additionalProperties: false,
    });
  });

  it("excludes optional fields from required array", () => {
    expect(
      jzodToJsonSchema({
        type: "object",
        definition: {
          name: { type: "string" },
          description: { type: "string", optional: true },
        },
      })
    ).toEqual({
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
      },
      required: ["name"],
      additionalProperties: false,
    });
  });

  it("omits required when all fields are optional", () => {
    expect(
      jzodToJsonSchema({
        type: "object",
        definition: {
          foo: { type: "string", optional: true },
        },
      })
    ).toEqual({
      type: "object",
      properties: { foo: { type: "string" } },
      additionalProperties: false,
    });
  });

  // ##############################################################################################
  it("converts union type to anyOf", () => {
    expect(
      jzodToJsonSchema({
        type: "union",
        definition: [{ type: "string" }, { type: "number" }],
      })
    ).toEqual({
      anyOf: [{ type: "string" }, { type: "number" }],
    });
  });

  // ##############################################################################################
  it("resolves schemaReference from outer context", () => {
    const context = {
      myString: { type: "string" } as JzodElement,
    };
    expect(
      jzodToJsonSchema(
        { type: "schemaReference", definition: { relativePath: "myString" } },
        context
      )
    ).toEqual({ type: "string" });
  });

  it("resolves schemaReference from inline context on the element", () => {
    expect(
      jzodToJsonSchema({
        type: "schemaReference",
        context: {
          address: {
            type: "object",
            definition: {
              street: { type: "string" },
              city: { type: "string" },
            },
          },
        },
        definition: { relativePath: "address" },
      })
    ).toEqual({
      type: "object",
      properties: { street: { type: "string" }, city: { type: "string" } },
      required: ["street", "city"],
      additionalProperties: false,
    });
  });

  it("falls back to $ref for unresolvable schemaReference", () => {
    expect(
      jzodToJsonSchema({ type: "schemaReference", definition: { relativePath: "unknown" } })
    ).toEqual({ $ref: "#/$defs/unknown" });
  });

  // ##############################################################################################
  it("converts record type to object with additionalProperties", () => {
    expect(
      jzodToJsonSchema({ type: "record", definition: { type: "number" } })
    ).toEqual({
      type: "object",
      additionalProperties: { type: "number" },
    });
  });
});
