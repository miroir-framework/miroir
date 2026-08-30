import { describe, expect, it } from "vitest";

import type { JzodElement } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { isMlSchemaSubtype } from "../../../src/1_core/jzod/mlSchemaSubtype";

const stringSchema = { type: "string" } as JzodElement;
const numberSchema = { type: "number" } as JzodElement;
const booleanSchema = { type: "boolean" } as JzodElement;
const uuidSchema = { type: "uuid" } as JzodElement;
const anySchema = { type: "any" } as JzodElement;
const unknownSchema = { type: "unknown" } as JzodElement;
const neverSchema = { type: "never" } as JzodElement;
const nullSchema = { type: "null" } as JzodElement;
const undefinedSchema = { type: "undefined" } as JzodElement;

describe("isMlSchemaSubtype — primitives & tops/bottoms (#250)", () => {
  it("is reflexive for plain primitives", () => {
    expect(isMlSchemaSubtype(stringSchema, stringSchema)).toBe(true);
    expect(isMlSchemaSubtype(numberSchema, numberSchema)).toBe(true);
  });

  it("rejects unrelated primitives", () => {
    expect(isMlSchemaSubtype(stringSchema, numberSchema)).toBe(false);
    expect(isMlSchemaSubtype(numberSchema, stringSchema)).toBe(false);
    expect(isMlSchemaSubtype(booleanSchema, stringSchema)).toBe(false);
  });

  it("treats everything as subtype of any / unknown", () => {
    expect(isMlSchemaSubtype(stringSchema, anySchema)).toBe(true);
    expect(isMlSchemaSubtype(numberSchema, unknownSchema)).toBe(true);
    expect(isMlSchemaSubtype(neverSchema, anySchema)).toBe(true);
  });

  it("does not treat any as subtype of a concrete type (LSP)", () => {
    expect(isMlSchemaSubtype(anySchema, stringSchema)).toBe(false);
    expect(isMlSchemaSubtype(unknownSchema, numberSchema)).toBe(false);
  });

  it("treats never as subtype of every schema", () => {
    expect(isMlSchemaSubtype(neverSchema, stringSchema)).toBe(true);
    expect(isMlSchemaSubtype(neverSchema, numberSchema)).toBe(true);
    expect(isMlSchemaSubtype(neverSchema, anySchema)).toBe(true);
  });

  it("treats uuid as subtype of string", () => {
    expect(isMlSchemaSubtype(uuidSchema, stringSchema)).toBe(true);
    expect(isMlSchemaSubtype(stringSchema, uuidSchema)).toBe(false);
  });
});

describe("isMlSchemaSubtype — optional / nullable (#250)", () => {
  it("required is subtype of optional (same core)", () => {
    const optionalString = { type: "string", optional: true } as JzodElement;
    expect(isMlSchemaSubtype(stringSchema, optionalString)).toBe(true);
    expect(isMlSchemaSubtype(optionalString, stringSchema)).toBe(false);
  });

  it("non-null is subtype of nullable (same core)", () => {
    const nullableString = { type: "string", nullable: true } as JzodElement;
    expect(isMlSchemaSubtype(stringSchema, nullableString)).toBe(true);
    expect(isMlSchemaSubtype(nullableString, stringSchema)).toBe(false);
  });

  it("undefined is subtype of optional string", () => {
    const optionalString = { type: "string", optional: true } as JzodElement;
    expect(isMlSchemaSubtype(undefinedSchema, optionalString)).toBe(true);
  });

  it("null is subtype of nullable string", () => {
    const nullableString = { type: "string", nullable: true } as JzodElement;
    expect(isMlSchemaSubtype(nullSchema, nullableString)).toBe(true);
  });
});

describe("isMlSchemaSubtype — validations & coerce (#250)", () => {
  it("a subtype may add validations to an unvalidated supertype", () => {
    const constrained = {
      type: "string",
      validations: [{ type: "min", parameter: 5 }],
    } as JzodElement;
    expect(isMlSchemaSubtype(constrained, stringSchema)).toBe(true);
    expect(isMlSchemaSubtype(stringSchema, constrained)).toBe(false);
  });

  it("validation sets on the supertype must match exactly (conservative)", () => {
    const min5 = {
      type: "string",
      validations: [{ type: "min", parameter: 5 }],
    } as JzodElement;
    const min5Again = {
      type: "string",
      validations: [{ type: "min", parameter: 5 }],
    } as JzodElement;
    const min3 = {
      type: "string",
      validations: [{ type: "min", parameter: 3 }],
    } as JzodElement;
    expect(isMlSchemaSubtype(min5, min5Again)).toBe(true);
    // min 5 implies min 3, but comparing validation semantics is out of scope
    expect(isMlSchemaSubtype(min5, min3)).toBe(false);
  });

  it("coerce widens the accepted input set: coerce subtype requires coerce supertype", () => {
    const coercedNumber = { type: "number", coerce: true } as JzodElement;
    expect(isMlSchemaSubtype(numberSchema, coercedNumber)).toBe(true);
    expect(isMlSchemaSubtype(coercedNumber, numberSchema)).toBe(false);
  });

  it("uuid is a subtype of unvalidated string only", () => {
    const constrainedString = {
      type: "string",
      validations: [{ type: "max", parameter: 10 }],
    } as JzodElement;
    expect(isMlSchemaSubtype(uuidSchema, constrainedString)).toBe(false);
  });
});

describe("isMlSchemaSubtype — literals & enums (#250)", () => {
  it("string literal is subtype of string and of enum containing it", () => {
    const lit = { type: "literal", definition: "active" } as JzodElement;
    const statusEnum = {
      type: "enum",
      definition: ["active", "inactive"],
    } as JzodElement;
    expect(isMlSchemaSubtype(lit, stringSchema)).toBe(true);
    expect(isMlSchemaSubtype(lit, statusEnum)).toBe(true);
    expect(isMlSchemaSubtype(lit, {
      type: "enum",
      definition: ["pending"],
    } as JzodElement)).toBe(false);
  });

  it("narrower enum is subtype of wider enum and of string", () => {
    const narrow = { type: "enum", definition: ["a"] } as JzodElement;
    const wide = { type: "enum", definition: ["a", "b"] } as JzodElement;
    expect(isMlSchemaSubtype(narrow, wide)).toBe(true);
    expect(isMlSchemaSubtype(wide, narrow)).toBe(false);
    expect(isMlSchemaSubtype(narrow, stringSchema)).toBe(true);
  });
});

describe("isMlSchemaSubtype — objects follow jzodTypeCheck strictness (#250)", () => {
  const wider = {
    type: "object",
    definition: {
      name: { type: "string" },
      age: { type: "number" },
    },
  } as JzodElement;
  const narrower = {
    type: "object",
    definition: {
      name: { type: "string" },
    },
  } as JzodElement;

  it("rejects width subtyping against a strict target (extra value attributes are type errors)", () => {
    expect(isMlSchemaSubtype(wider, narrower)).toBe(false);
    expect(isMlSchemaSubtype(narrower, wider)).toBe(false);
  });

  it("allows width subtyping when the target object is nonStrict", () => {
    const openNarrower = { ...narrower, nonStrict: true } as JzodElement;
    expect(isMlSchemaSubtype(wider, openNarrower)).toBe(true);
  });

  it("a nonStrict subtype requires a nonStrict supertype", () => {
    const openNarrower = { ...narrower, nonStrict: true } as JzodElement;
    // openNarrower admits arbitrary extra attributes, the strict wider rejects them
    expect(isMlSchemaSubtype(openNarrower, wider)).toBe(false);
  });

  it("a nonStrict subtype admits `any` for attributes missing from its definition", () => {
    const openA = {
      type: "object",
      nonStrict: true,
      definition: { name: { type: "string" } },
    } as JzodElement;
    const openB = {
      type: "object",
      nonStrict: true,
      definition: { name: { type: "string" }, age: { type: "number" } },
    } as JzodElement;
    const openC = {
      type: "object",
      nonStrict: true,
      definition: { name: { type: "string" }, age: { type: "any" } },
    } as JzodElement;
    // values of openA may carry `age` with any value, which does not fit openB's `age: number`
    expect(isMlSchemaSubtype(openA, openB)).toBe(false);
    expect(isMlSchemaSubtype(openA, openC)).toBe(true);
  });

  it("allows depth subtyping on properties", () => {
    const withUuid = {
      type: "object",
      definition: { id: { type: "uuid" } },
    } as JzodElement;
    const withString = {
      type: "object",
      definition: { id: { type: "string" } },
    } as JzodElement;
    expect(isMlSchemaSubtype(withUuid, withString)).toBe(true);
    expect(isMlSchemaSubtype(withString, withUuid)).toBe(false);
  });

  it("required property does not subtype as missing required on target", () => {
    const empty = { type: "object", definition: {} } as JzodElement;
    const needsName = {
      type: "object",
      definition: { name: { type: "string" } },
    } as JzodElement;
    expect(isMlSchemaSubtype(empty, needsName)).toBe(false);
  });

  it("missing property is OK when target property is optional", () => {
    const empty = { type: "object", definition: {} } as JzodElement;
    const optionalName = {
      type: "object",
      definition: { name: { type: "string", optional: true } },
    } as JzodElement;
    expect(isMlSchemaSubtype(empty, optionalName)).toBe(true);
  });

  it("partial makes every attribute optional on either side", () => {
    const partialName = {
      type: "object",
      partial: true,
      definition: { name: { type: "string" } },
    } as JzodElement;
    const optionalName = {
      type: "object",
      definition: { name: { type: "string", optional: true } },
    } as JzodElement;
    const requiredName = {
      type: "object",
      definition: { name: { type: "string" } },
    } as JzodElement;
    const empty = { type: "object", definition: {} } as JzodElement;
    expect(isMlSchemaSubtype(partialName, optionalName)).toBe(true);
    expect(isMlSchemaSubtype(optionalName, partialName)).toBe(true);
    expect(isMlSchemaSubtype(empty, partialName)).toBe(true);
    expect(isMlSchemaSubtype(partialName, requiredName)).toBe(false);
  });

  it("ignores tag / description for the relation", () => {
    const a = {
      type: "string",
      description: "a",
      tag: { value: { defaultLabel: "A" } },
    } as JzodElement;
    const b = { type: "string", description: "b" } as JzodElement;
    expect(isMlSchemaSubtype(a, b)).toBe(true);
  });
});

describe("isMlSchemaSubtype — objects with extend (#250)", () => {
  const baseRef = {
    type: "schemaReference",
    definition: { relativePath: "baseObject" },
  } as JzodElement;

  it("identical objects bearing extend are subtypes (identity)", () => {
    const a = {
      type: "object",
      extend: baseRef,
      definition: { c: { type: "number" } },
    } as JzodElement;
    const aClone = {
      type: "object",
      extend: baseRef,
      definition: { c: { type: "number" } },
    } as JzodElement;
    expect(isMlSchemaSubtype(a, aClone)).toBe(true);
  });

  it("non-identical objects bearing extend are conservatively rejected", () => {
    const a = {
      type: "object",
      extend: baseRef,
      definition: { c: { type: "number" } },
    } as JzodElement;
    const b = {
      type: "object",
      extend: baseRef,
      definition: {},
    } as JzodElement;
    // the local definition of `a` may override inherited attributes
    // incompatibly — without a model environment this cannot be decided
    expect(isMlSchemaSubtype(a, b)).toBe(false);
    expect(isMlSchemaSubtype(b, a)).toBe(false);
  });
});

describe("isMlSchemaSubtype — arrays, records, tuples (#250)", () => {
  it("arrays are covariant in element type", () => {
    const uuidArray = { type: "array", definition: uuidSchema } as JzodElement;
    const stringArray = { type: "array", definition: stringSchema } as JzodElement;
    expect(isMlSchemaSubtype(uuidArray, stringArray)).toBe(true);
    expect(isMlSchemaSubtype(stringArray, uuidArray)).toBe(false);
  });

  it("records are covariant in value type", () => {
    const uuidRecord = { type: "record", definition: uuidSchema } as JzodElement;
    const stringRecord = { type: "record", definition: stringSchema } as JzodElement;
    expect(isMlSchemaSubtype(uuidRecord, stringRecord)).toBe(true);
    expect(isMlSchemaSubtype(stringRecord, uuidRecord)).toBe(false);
  });

  it("object is subtype of record when every property matches value type", () => {
    const obj = {
      type: "object",
      definition: {
        a: { type: "uuid" },
        b: { type: "string" },
      },
    } as JzodElement;
    const stringRecord = { type: "record", definition: stringSchema } as JzodElement;
    expect(isMlSchemaSubtype(obj, stringRecord)).toBe(true);
  });

  it("optional object attributes still fit a record of their core type", () => {
    const objWithOptional = {
      type: "object",
      definition: { a: { type: "uuid", optional: true } },
    } as JzodElement;
    const stringRecord = { type: "record", definition: stringSchema } as JzodElement;
    expect(isMlSchemaSubtype(objWithOptional, stringRecord)).toBe(true);
  });

  it("nonStrict object is a subtype of a record only when the record accepts any value", () => {
    const openObj = {
      type: "object",
      nonStrict: true,
      definition: { a: { type: "string" } },
    } as JzodElement;
    const stringRecord = { type: "record", definition: stringSchema } as JzodElement;
    const anyRecord = { type: "record", definition: anySchema } as JzodElement;
    expect(isMlSchemaSubtype(openObj, stringRecord)).toBe(false);
    expect(isMlSchemaSubtype(openObj, anyRecord)).toBe(true);
  });

  it("tuple positions are covariant; tuple subtypes matching array", () => {
    const tuple = {
      type: "tuple",
      definition: [uuidSchema, numberSchema],
    } as JzodElement;
    const sameTuple = {
      type: "tuple",
      definition: [stringSchema, numberSchema],
    } as JzodElement;
    const anyArray = { type: "array", definition: anySchema } as JzodElement;
    expect(isMlSchemaSubtype(tuple, sameTuple)).toBe(true);
    expect(isMlSchemaSubtype(tuple, anyArray)).toBe(true);
  });
});

describe("isMlSchemaSubtype — unions (#250)", () => {
  it("concrete type is subtype of a union that includes it", () => {
    const union = {
      type: "union",
      definition: [stringSchema, numberSchema],
    } as JzodElement;
    expect(isMlSchemaSubtype(stringSchema, union)).toBe(true);
    expect(isMlSchemaSubtype(booleanSchema, union)).toBe(false);
  });

  it("union is subtype of target only when every branch is", () => {
    const union = {
      type: "union",
      definition: [stringSchema, numberSchema],
    } as JzodElement;
    expect(isMlSchemaSubtype(union, anySchema)).toBe(true);
    expect(isMlSchemaSubtype(union, stringSchema)).toBe(false);
  });

  it("narrower union is subtype of wider union", () => {
    const narrow = {
      type: "union",
      definition: [stringSchema],
    } as JzodElement;
    const wide = {
      type: "union",
      definition: [stringSchema, numberSchema],
    } as JzodElement;
    expect(isMlSchemaSubtype(narrow, wide)).toBe(true);
    expect(isMlSchemaSubtype(wide, narrow)).toBe(false);
  });
});

describe("isMlSchemaSubtype — schemaReference identity (#250)", () => {
  const refEntity = {
    type: "schemaReference",
    definition: {
      absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      relativePath: "entity",
    },
  } as JzodElement;

  it("identical references are subtypes; unequal paths are not", () => {
    const same = {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "entity",
      },
    } as JzodElement;
    const otherPath = {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "report",
      },
    } as JzodElement;
    expect(isMlSchemaSubtype(refEntity, same)).toBe(true);
    expect(isMlSchemaSubtype(refEntity, otherPath)).toBe(false);
  });

  it("references with different contexts are not subtypes", () => {
    const ctxString = {
      type: "schemaReference",
      context: { x: { type: "string" } },
      definition: { relativePath: "x" },
    } as JzodElement;
    const ctxNumber = {
      type: "schemaReference",
      context: { x: { type: "number" } },
      definition: { relativePath: "x" },
    } as JzodElement;
    const ctxStringAgain = {
      type: "schemaReference",
      context: { x: { type: "string" } },
      definition: { relativePath: "x" },
    } as JzodElement;
    // same path, different resolution context: different schemas
    expect(isMlSchemaSubtype(ctxString, ctxNumber)).toBe(false);
    expect(isMlSchemaSubtype(ctxNumber, ctxString)).toBe(false);
    expect(isMlSchemaSubtype(ctxString, ctxStringAgain)).toBe(true);
  });

  it("references differing only in presentation metadata are subtypes", () => {
    const withTag = {
      type: "schemaReference",
      description: "some reference",
      tag: { value: { defaultLabel: "Ref" } },
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "entity",
      },
    } as JzodElement;
    expect(isMlSchemaSubtype(refEntity, withTag)).toBe(true);
    expect(isMlSchemaSubtype(withTag, refEntity)).toBe(true);
  });

  it("a reference is not a subtype of a non-reference (no resolution in this cut)", () => {
    expect(isMlSchemaSubtype(refEntity, anySchema)).toBe(true);
    expect(isMlSchemaSubtype(refEntity, stringSchema)).toBe(false);
    expect(isMlSchemaSubtype(stringSchema, refEntity)).toBe(false);
  });
});

describe("isMlSchemaSubtype — robustness (#250)", () => {
  it("does not mutate its inputs", () => {
    const a = {
      type: "object",
      definition: {
        id: { type: "uuid" },
        tags: { type: "array", definition: { type: "string", optional: true } },
      },
    } as JzodElement;
    const b = {
      type: "object",
      nonStrict: true,
      definition: { id: { type: "string" } },
    } as JzodElement;
    const snapshotA = JSON.stringify(a);
    const snapshotB = JSON.stringify(b);
    isMlSchemaSubtype(a, b);
    isMlSchemaSubtype(b, a);
    expect(JSON.stringify(a)).toBe(snapshotA);
    expect(JSON.stringify(b)).toBe(snapshotB);
  });

  it("handles schemas nested deeper than any fixed bound (no artificial depth cap)", () => {
    // schemas are finite JSON trees; recursion is structural on the input
    let deep: any = { type: "string" };
    let deepWide: any = { type: "any" };
    for (let i = 0; i < 200; i++) {
      deep = { type: "array", definition: deep };
      deepWide = { type: "array", definition: deepWide };
    }
    expect(isMlSchemaSubtype(deep as JzodElement, deepWide as JzodElement)).toBe(true);
    expect(isMlSchemaSubtype(deepWide as JzodElement, deep as JzodElement)).toBe(false);
  });
});
