import { describe, expect, it } from "vitest";

import type {
  JzodElement,
  MlSchema,
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { jzodToJzod_Summary } from "../../../src/1_core/jzod/JzodToJzod_Summary";

const dummyMlSchema: MlSchema = {
  uuid: "00000000-0000-0000-0000-000000000000",
  parentUuid: "00000000-0000-0000-0000-000000000000",
  name: "dummy",
};

describe("jzodToJzod_Summary", () => {
  // ── Tag stripping ──────────────────────────────────────────────────────────

  it("strips non-essential tag fields from a string type, keeps essential ones", () => {
    const input: JzodElement = {
      type: "string",
      optional: true,
      tag: {
        value: {
          id: 42,
          defaultLabel: "My Label",
          description: "A description",
          editorButton: { icon: "star" },
          initializeTo: { initializeToType: "value", value: "" } as any,
          isBlob: false,
          canBeTemplate: false,
          isTemplate: false,
          display: { hidden: false, editable: true },
        },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema);
    expect(result).toEqual({
      type: "string",
      optional: true,
      tag: {
        value: {
          defaultLabel: "My Label",
          description: "A description",
        },
      },
    });
  });

  it("strips tag entirely when only non-essential fields are present", () => {
    const input: JzodElement = {
      type: "string",
      tag: {
        value: {
          id: 1,
          editorButton: { icon: "edit" },
          display: { hidden: true },
        },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema);
    expect(result).toEqual({ type: "string" });
  });

  it("keeps foreignKeyParams in tag value", () => {
    const input: JzodElement = {
      type: "string",
      tag: {
        value: {
          defaultLabel: "Entity UUID",
          foreignKeyParams: {
            targetEntity: "some-entity-uuid",
            targetEntityApplicationSection: "model",
          },
          display: { hidden: false },
        },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema);
    expect(result).toEqual({
      type: "string",
      tag: {
        value: {
          defaultLabel: "Entity UUID",
          foreignKeyParams: {
            targetEntity: "some-entity-uuid",
            targetEntityApplicationSection: "model",
          },
        },
      },
    });
  });

  it("keeps formValidation in tag value", () => {
    const input: JzodElement = {
      type: "string",
      tag: {
        value: {
          formValidation: { transformer: { transformerType: "count" } as any },
          display: { editable: false },
        },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema);
    expect(result).toEqual({
      type: "string",
      tag: {
        value: {
          formValidation: { transformer: { transformerType: "count" } },
        },
      },
    });
  });

  // ── Leaf types ─────────────────────────────────────────────────────────────

  it("literal: keeps type and definition value", () => {
    const input: JzodElement = {
      type: "literal",
      definition: "myValue",
      tag: { value: { display: { hidden: true } } },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema);
    expect(result).toEqual({ type: "literal", definition: "myValue" });
  });

  it("enum: keeps type and all enum values", () => {
    const input: JzodElement = {
      type: "enum",
      definition: ["a", "b", "c"],
      tag: { value: { id: 1, display: { hidden: false } } },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema);
    expect(result).toEqual({ type: "enum", definition: ["a", "b", "c"] });
  });

  it("string with validations: keeps validations", () => {
    const input: JzodElement = {
      type: "string",
      validations: [
        { type: "min", parameter: 3 },
        { type: "max", parameter: 50 },
      ],
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema);
    expect(result).toEqual({
      type: "string",
      validations: [
        { type: "min", parameter: 3 },
        { type: "max", parameter: 50 },
      ],
    });
  });

  it("number with validations: keeps validations", () => {
    const input: JzodElement = {
      type: "number",
      validations: [{ type: "int" }, { type: "gte", parameter: 0 }],
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema);
    expect(result).toEqual({
      type: "number",
      validations: [{ type: "int" }, { type: "gte", parameter: 0 }],
    });
  });

  it("plain attribute (boolean): returns type only", () => {
    const input: JzodElement = {
      type: "boolean",
      tag: { value: { id: 5, display: { hidden: false } } },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema);
    expect(result).toEqual({ type: "boolean" });
  });

  // ── Object ────────────────────────────────────────────────────────────────

  it("object depth=0: shows keys with type-only child stubs", () => {
    const input: JzodElement = {
      type: "object",
      definition: {
        name: { type: "string" },
        age: { type: "number" },
        address: {
          type: "object",
          definition: { street: { type: "string" } },
        },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 0);
    expect(result).toEqual({
      type: "object",
      definition: {
        name: { type: "string" },
        age: { type: "number" },
        address: { type: "object" },
      },
    });
  });

  it("object depth=1: recursively summarizes one level deep (child object shows its keys, grandchild is a stub)", () => {
    const input: JzodElement = {
      type: "object",
      definition: {
        name: { type: "string" },
        address: {
          type: "object",
          definition: {
            street: { type: "string" },
            geo: {
              type: "object",
              definition: {
                lat: { type: "number" },
                lng: { type: "number" },
              },
            },
          },
        },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 1);
    expect(result).toEqual({
      type: "object",
      definition: {
        name: { type: "string" },
        address: {
          type: "object",
          definition: {
            street: { type: "string" },
            geo: { type: "object" },
          },
        },
      },
    });
  });

  it("object depth=2: recursively summarizes two levels deep", () => {
    const input: JzodElement = {
      type: "object",
      definition: {
        address: {
          type: "object",
          definition: {
            geo: {
              type: "object",
              definition: {
                lat: { type: "number" },
                lng: { type: "number" },
              },
            },
          },
        },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 2);
    expect(result).toEqual({
      type: "object",
      definition: {
        address: {
          type: "object",
          definition: {
            geo: {
              type: "object",
              definition: {
                lat: { type: "number" },
                lng: { type: "number" },
              },
            },
          },
        },
      },
    });
  });

  it("object: keeps partial and nonStrict flags", () => {
    const input: JzodElement = {
      type: "object",
      partial: true,
      nonStrict: true,
      definition: { x: { type: "string" } },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 0);
    expect(result).toEqual({
      type: "object",
      partial: true,
      nonStrict: true,
      definition: { x: { type: "string" } },
    });
  });

  it("object: tag fields are stripped on both the object and its child", () => {
    const input: JzodElement = {
      type: "object",
      tag: { value: { id: 1, defaultLabel: "My Object", display: { hidden: false } } },
      definition: {
        x: {
          type: "string",
          tag: { value: { id: 2, editorButton: { label: "Pick" }, defaultLabel: "X Value" } },
        },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 1);
    expect(result).toEqual({
      type: "object",
      tag: { value: { defaultLabel: "My Object" } },
      definition: {
        x: {
          type: "string",
          tag: { value: { defaultLabel: "X Value" } },
        },
      },
    });
  });

  // ── Array ─────────────────────────────────────────────────────────────────

  it("array depth=0: shows element type-only summary", () => {
    const input: JzodElement = {
      type: "array",
      definition: {
        type: "object",
        definition: { id: { type: "string" }, value: { type: "number" } },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 0);
    expect(result).toEqual({
      type: "array",
      definition: { type: "object" },
    });
  });

  it("array depth=1: shows element summarized at depth=0 (object keys visible)", () => {
    const input: JzodElement = {
      type: "array",
      definition: {
        type: "object",
        definition: { id: { type: "string" }, value: { type: "number" } },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 1);
    expect(result).toEqual({
      type: "array",
      definition: {
        type: "object",
        definition: {
          id: { type: "string" },
          value: { type: "number" },
        },
      },
    });
  });

  // ── Tuple ─────────────────────────────────────────────────────────────────

  it("tuple depth=0: shows each element as a type-only stub", () => {
    const input: JzodElement = {
      type: "tuple",
      definition: [
        { type: "string" },
        { type: "number" },
        { type: "object", definition: { a: { type: "boolean" } } },
      ],
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 0);
    expect(result).toEqual({
      type: "tuple",
      definition: [
        { type: "string" },
        { type: "number" },
        { type: "object" },
      ],
    });
  });

  // ── Record ────────────────────────────────────────────────────────────────

  it("record depth=0: shows value type as a type-only stub", () => {
    const input: JzodElement = {
      type: "record",
      definition: {
        type: "object",
        definition: { count: { type: "number" } },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 0);
    expect(result).toEqual({
      type: "record",
      definition: { type: "object" },
    });
  });

  // ── Union ─────────────────────────────────────────────────────────────────

  it("union depth=0: shows branch type stubs and keeps discriminator", () => {
    const input: JzodElement = {
      type: "union",
      discriminator: "kind" as any,
      definition: [
        {
          type: "object",
          definition: {
            kind: { type: "literal", definition: "a" },
            x: { type: "string" },
          },
        },
        {
          type: "object",
          definition: {
            kind: { type: "literal", definition: "b" },
            y: { type: "number" },
          },
        },
      ],
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 0);
    expect(result).toEqual({
      type: "union",
      discriminator: "kind",
      definition: [{ type: "object" }, { type: "object" }],
    });
  });

  it("union depth=1: shows branch definitions at depth=0 (with object keys and literal values)", () => {
    const input: JzodElement = {
      type: "union",
      discriminator: "kind" as any,
      definition: [
        {
          type: "object",
          definition: {
            kind: { type: "literal", definition: "a" },
            x: { type: "string" },
          },
        },
        { type: "literal", definition: "someValue" },
      ],
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 1);
    expect(result).toEqual({
      type: "union",
      discriminator: "kind",
      definition: [
        {
          type: "object",
          definition: {
            kind: { type: "literal", definition: "a" },
            x: { type: "string" },
          },
        },
        { type: "literal", definition: "someValue" },
      ],
    });
  });

  it("union: optInDiscriminator is stripped", () => {
    const input: JzodElement = {
      type: "union",
      optInDiscriminator: true,
      definition: [{ type: "string" }, { type: "number" }],
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema);
    expect((result as any).optInDiscriminator).toBeUndefined();
  });

  // ── schemaReference ────────────────────────────────────────────────────────

  it("schemaReference: drops context, keeps definition path", () => {
    const input: JzodElement = {
      type: "schemaReference",
      context: {
        mySchema: { type: "object", definition: { a: { type: "string" } } },
      },
      definition: { relativePath: "mySchema", absolutePath: "some/absolute/path" },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema);
    expect(result).toEqual({
      type: "schemaReference",
      definition: { relativePath: "mySchema", absolutePath: "some/absolute/path" },
    });
    expect((result as any).context).toBeUndefined();
  });

  it("schemaReference minimal summary keeps definition", () => {
    const input: JzodElement = {
      type: "object",
      definition: {
        ref: {
          type: "schemaReference",
          context: { foo: { type: "string" } },
          definition: { relativePath: "foo" },
        },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 0);
    // At depth=0, schemaReference child gets minimalSummary which keeps definition
    expect(result).toEqual({
      type: "object",
      definition: {
        ref: {
          type: "schemaReference",
          definition: { relativePath: "foo" },
        },
      },
    });
  });

  // ── Intersection ──────────────────────────────────────────────────────────

  it("intersection depth=1: summarizes left and right branches", () => {
    const input: JzodElement = {
      type: "intersection",
      definition: {
        left: {
          type: "object",
          definition: { a: { type: "string" }, b: { type: "number" } },
        },
        right: {
          type: "object",
          definition: { c: { type: "boolean" } },
        },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema, 1);
    expect(result).toEqual({
      type: "intersection",
      definition: {
        left: {
          type: "object",
          definition: {
            a: { type: "string" },
            b: { type: "number" },
          },
        },
        right: {
          type: "object",
          definition: { c: { type: "boolean" } },
        },
      },
    });
  });

  // ── Function / Lazy / Promise ──────────────────────────────────────────────

  it("function: returns type-only (not editable in JzodElementEditor)", () => {
    const input: JzodElement = {
      type: "function",
      definition: {
        args: [{ type: "string" }],
        returns: { type: "number" },
      },
    };
    const result = jzodToJzod_Summary(input, dummyMlSchema);
    expect(result).toEqual({ type: "function" });
  });

  // ── Default depth ─────────────────────────────────────────────────────────

  it("default depth is 1 (same as explicit depth=1)", () => {
    const input: JzodElement = {
      type: "object",
      definition: {
        child: {
          type: "object",
          definition: { x: { type: "string" } },
        },
      },
    };
    expect(jzodToJzod_Summary(input, dummyMlSchema)).toEqual(
      jzodToJzod_Summary(input, dummyMlSchema, 1)
    );
  });
});
