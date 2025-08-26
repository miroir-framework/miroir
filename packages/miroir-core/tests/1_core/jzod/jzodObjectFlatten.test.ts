import { describe, it, expect } from "vitest";
import { jzodObjectFlatten } from "../../../src/1_core/jzod/jzodObjectFlatten";
import { JzodObject, JzodReference, JzodSchema } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { miroirFundamentalJzodSchema } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import { defaultMiroirMetaModel } from "../../test_assets/defaultMiroirMetaModel";

const castMiroirFundamentalJzodSchema = miroirFundamentalJzodSchema as JzodSchema;

const defaultModelEnvironment = {
  miroirFundamentalJzodSchema: castMiroirFundamentalJzodSchema,
  currentModel: defaultMiroirMetaModel,
  miroirMetaModel: defaultMiroirMetaModel
} as const satisfies { miroirFundamentalJzodSchema: JzodSchema; currentModel: any; miroirMetaModel: any; };

describe("jzodObjectFlatten", () => {
  // ##############################################################################################
  it("returns the same object if there is no extend", () => {
    const obj: JzodObject = {
      type: "object",
      definition: {
        foo: { type: "string" }
      }
    };
    expect(
      jzodObjectFlatten(
        obj,
        defaultModelEnvironment,
      )
    ).toEqual(obj);
  });

  // ##############################################################################################
  it("flattens a single-level extend", () => {
    const parent: JzodObject = {
      type: "object",
      definition: {
        a: { type: "string" },
        b: { type: "number" }
      }
    };
    const obj: JzodObject = {
      type: "object",
      extend: parent,
      definition: {
        b: { type: "boolean" }, // overrides parent
        c: { type: "null" }
      }
    };
    expect(
      jzodObjectFlatten(
        obj,
        defaultModelEnvironment,
      )
    ).toEqual({
      type: "object",
      definition: {
        a: { type: "string" },
        b: { type: "boolean" },
        c: { type: "null" }
      }
    });
  });

  // ##############################################################################################
  it("flattens multi-level extends", () => {
    const grandParent: JzodObject = {
      type: "object",
      definition: {
        a: { type: "string" }
      }
    };
    const parent: JzodObject = {
      type: "object",
      extend: grandParent,
      definition: {
        b: { type: "number" }
      }
    };
    const obj: JzodObject = {
      type: "object",
      extend: parent,
      definition: {
        c: { type: "boolean" }
      }
    };
    expect(
      jzodObjectFlatten(
        obj,
        defaultModelEnvironment,
      )
    ).toEqual({
      type: "object",
      definition: {
        a: { type: "string" },
        b: { type: "number" },
        c: { type: "boolean" }
      }
    });
  });

  // ##############################################################################################
  it("flattens with array of extends", () => {
    const parent1: JzodObject = {
      type: "object",
      definition: {
        a: { type: "string" }
      }
    };
    const parent2: JzodObject = {
      type: "object",
      definition: {
        b: { type: "number" }
      }
    };
    const obj: JzodObject = {
      type: "object",
      extend: [parent1, parent2],
      definition: {
        c: { type: "boolean" }
      }
    };
    expect(
      jzodObjectFlatten(
        obj,
        defaultModelEnvironment,
      )
    ).toEqual({
      type: "object",
      definition: {
        a: { type: "string" },
        b: { type: "number" },
        c: { type: "boolean" }
      }
    });
  });

  // ##############################################################################################
  it("resolves schemaReferences and flatten recursively", () => {
    const ref: JzodReference = {
      type: "schemaReference",
      definition: { relativePath: "SomeRef" }
    };
    const parent: JzodObject = {
      type: "object",
      definition: {
        a: { type: "string" }
      }
    };
    const obj: JzodObject = {
      type: "object",
      extend: [ parent, ref ],
      definition: {
        b: { type: "string" }
      }
    };
    expect(
      jzodObjectFlatten(
        obj,
        defaultModelEnvironment,
        { SomeRef: { type: "object", definition: { a: { type: "number" } } } }
      )
    ).toEqual({
      type: "object",
      definition: {
        a: { type: "number" },
        b: { type: "string" },
      },
    });
  });

  // ##############################################################################################
  it("copies optional, nullable, and tag properties", () => {
    const parent: JzodObject = {
      type: "object",
      definition: {
        a: { type: "string" }
      }
    };
    const obj: JzodObject = {
      type: "object",
      extend: parent,
      definition: {
        b: { type: "number" }
      },
      optional: true,
      nullable: true,
      tag: {}
    };
    expect(
      jzodObjectFlatten(
        obj,
        defaultModelEnvironment,
      )
    ).toEqual({
      type: "object",
      definition: {
        a: { type: "string" },
        b: { type: "number" }
      },
      optional: true,
      nullable: true,
      tag: {}
    });
  });

  // ##############################################################################################
  it("resolves reference chains (reference -> reference -> object)", () => {
    const finalObject: JzodObject = {
      type: "object",
      definition: {
        finalProp: { type: "string" }
      }
    };

    const intermediateRef: JzodReference = {
      type: "schemaReference",
      definition: { relativePath: "FinalObject" }
    };

    const firstRef: JzodReference = {
      type: "schemaReference",
      definition: { relativePath: "IntermediateRef" }
    };

    const obj: JzodObject = {
      type: "object",
      extend: firstRef,
      definition: {
        myProp: { type: "number" }
      }
    };

    const context = {
      FinalObject: finalObject,
      IntermediateRef: intermediateRef
    };

    expect(
      jzodObjectFlatten(
        obj,
        defaultModelEnvironment,
        context
      )
    ).toEqual({
      type: "object",
      definition: {
        finalProp: { type: "string" },
        myProp: { type: "number" }
      }
    });
  });

  // ##############################################################################################
  it("detects circular references and throws an error", () => {
    const ref1: JzodReference = {
      type: "schemaReference",
      definition: { relativePath: "Ref2" }
    };

    const ref2: JzodReference = {
      type: "schemaReference", 
      definition: { relativePath: "Ref1" }
    };

    const obj: JzodObject = {
      type: "object",
      extend: ref1,
      definition: {
        myProp: { type: "string" }
      }
    };

    const context = {
      Ref1: ref1,
      Ref2: ref2
    };

    expect(() =>
      jzodObjectFlatten(
        obj,
        defaultModelEnvironment,
        context
      )
    ).toThrow(/Circular reference detected/);
  });
});