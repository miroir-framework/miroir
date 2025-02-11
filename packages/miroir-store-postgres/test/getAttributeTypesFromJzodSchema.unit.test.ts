// import { describe, it, expect } from "jest";
import { getAttributeTypesFromJzodSchema } from "../src/1_core/jzodSchema";


describe("getAttributeTypesFromJzodSchema.unit", () => {
  // ##############################################################################################
  it("should throw an error when jzodElement has no type", () => {
    const jzodElement = {
      // type is missing
      definition: {},
    } as any;
    expect(() => getAttributeTypesFromJzodSchema(jzodElement)).toThrowError("JzodSchema has no type");
  });

  // ##############################################################################################
  it("should throw an error when jzodElement type is not object", () => {
    const jzodElement = {
      type: "string",
      definition: {},
    } as any;
    expect(() => getAttributeTypesFromJzodSchema(jzodElement)).toThrowError("JzodSchema type is not object");
  });

  // ##############################################################################################
  it("should throw an error for unsupported attribute type", () => {
    const jzodElement = {
      type: "object",
      definition: {
        field: { type: "unsupported" },
      },
    } as any;
    expect(() => getAttributeTypesFromJzodSchema(jzodElement)).toThrowError("Jzod type unsupported not supported");
  });

  // ##############################################################################################
  it("should return attribute types for valid jzodElement", () => {
    const jzodElement = {
      type: "object",
      definition: {
        age: { type: "number" },
        name: { type: "string" },
        isActive: { type: "boolean" }
      },
    } as any;
    const result = getAttributeTypesFromJzodSchema(jzodElement);
    expect(result).toEqual({
      age: "double precision",
      name: "text",
      isActive: "boolean",
    });
  });

});