import { describe, it, expect } from "vitest";
import {
  jzodToCopilotKitParameter,
  CopilotKitParameter,
} from "../../../src/1_core/jzod/JzodToCopilotKitParameter";
import type { JzodElement } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// ################################################################################################
describe("jzodToCopilotKitParameter", () => {
  // ##############################################################################################
  it("converts string type", () => {
    expect(jzodToCopilotKitParameter("label", { type: "string" })).toEqual({
      name: "label",
      type: "string",
    });
  });

  it("converts number type", () => {
    expect(jzodToCopilotKitParameter("count", { type: "number" })).toEqual({
      name: "count",
      type: "number",
    });
  });

  it("converts boolean type", () => {
    expect(jzodToCopilotKitParameter("active", { type: "boolean" })).toEqual({
      name: "active",
      type: "boolean",
    });
  });

  it("converts uuid type to string", () => {
    expect(jzodToCopilotKitParameter("id", { type: "uuid" })).toEqual({
      name: "id",
      type: "string",
    });
  });

  // ##############################################################################################
  it("marks optional fields with required: false", () => {
    expect(
      jzodToCopilotKitParameter("note", { type: "string", optional: true })
    ).toEqual({ name: "note", type: "string", required: false });
  });

  it("does not set required for non-optional fields", () => {
    const result = jzodToCopilotKitParameter("title", { type: "string" });
    expect(result.required).toBeUndefined();
  });

  it("passes description through", () => {
    expect(
      jzodToCopilotKitParameter("label", { type: "string", description: "The label" })
    ).toEqual({ name: "label", type: "string", description: "The label" });
  });

  // ##############################################################################################
  it("converts enum type to string with enum array", () => {
    expect(
      jzodToCopilotKitParameter("status", { type: "enum", definition: ["draft", "active", "archived"] })
    ).toEqual({ name: "status", type: "string", enum: ["draft", "active", "archived"] });
  });

  it("converts literal type to string with single-value enum", () => {
    expect(
      jzodToCopilotKitParameter("kind", { type: "literal", definition: "book" })
    ).toEqual({ name: "kind", type: "string", enum: ["book"] });
  });

  it("converts all-literal union to string with enum", () => {
    expect(
      jzodToCopilotKitParameter("role", {
        type: "union",
        definition: [
          { type: "literal", definition: "admin" },
          { type: "literal", definition: "user" },
          { type: "literal", definition: "guest" },
        ],
      })
    ).toEqual({ name: "role", type: "string", enum: ["admin", "user", "guest"] });
  });

  // ##############################################################################################
  it("converts object type to object parameter with attributes", () => {
    expect(
      jzodToCopilotKitParameter("address", {
        type: "object",
        definition: {
          street: { type: "string" },
          zip: { type: "string", optional: true },
        },
      })
    ).toEqual({
      name: "address",
      type: "object",
      attributes: [
        { name: "street", type: "string" },
        { name: "zip", type: "string", required: false },
      ],
    });
  });

  // ##############################################################################################
  it("converts array of strings to string[]", () => {
    expect(
      jzodToCopilotKitParameter("tags", { type: "array", definition: { type: "string" } })
    ).toEqual({ name: "tags", type: "string[]" });
  });

  it("converts array of numbers to number[]", () => {
    expect(
      jzodToCopilotKitParameter("scores", { type: "array", definition: { type: "number" } })
    ).toEqual({ name: "scores", type: "number[]" });
  });

  it("converts array of booleans to boolean[]", () => {
    expect(
      jzodToCopilotKitParameter("flags", { type: "array", definition: { type: "boolean" } })
    ).toEqual({ name: "flags", type: "boolean[]" });
  });

  it("converts array of objects to object[] with attributes", () => {
    expect(
      jzodToCopilotKitParameter("items", {
        type: "array",
        definition: {
          type: "object",
          definition: {
            id: { type: "uuid" },
            qty: { type: "number" },
          },
        },
      })
    ).toEqual({
      name: "items",
      type: "object[]",
      attributes: [
        { name: "id", type: "string" },
        { name: "qty", type: "number" },
      ],
    });
  });

  // ##############################################################################################
  it("resolves schemaReference from outer context", () => {
    const context = { myNumber: { type: "number" } as JzodElement };
    expect(
      jzodToCopilotKitParameter(
        "amount",
        { type: "schemaReference", definition: { relativePath: "myNumber" } },
        context
      )
    ).toEqual({ name: "amount", type: "number" });
  });

  it("resolves schemaReference from inline context on element", () => {
    expect(
      jzodToCopilotKitParameter("payload", {
        type: "schemaReference",
        context: { body: { type: "object", definition: { x: { type: "string" } } } },
        definition: { relativePath: "body" },
      })
    ).toEqual({
      name: "payload",
      type: "object",
      attributes: [{ name: "x", type: "string" }],
    });
  });
});
