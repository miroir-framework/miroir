import { describe, expect, it } from "vitest";
import { miroirFundamentalJzodSchema } from '../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema';
import {
  JzodElement,
  JzodSchema,
  JzodUnion,
  MetaModel
} from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  jzodUnion_recursivelyUnfold,
  JzodUnion_RecursivelyUnfold_ReturnTypeError,
  JzodUnion_RecursivelyUnfold_ReturnTypeOK,
} from "../../../src/1_core/jzod/jzodUnion_RecursivelyUnfold";
import currentMiroirModel from "../currentMiroirModel.json";
import currentModel from "../currentModel.json";
import { unfoldJzodSchemaOnce } from "../../../src/1_core/jzod/JzodUnfoldSchemaOnce";

function local_jzodUnion_recursivelyUnfold(
  schema: JzodUnion,
  relativeReferenceJzodContext: { [k: string]: JzodElement } = {}
): JzodUnion_RecursivelyUnfold_ReturnTypeOK | JzodUnion_RecursivelyUnfold_ReturnTypeError {
  // TODO: test on schemaReference which unfold to unions
  // const unfoldedSchema = unfoldJzodSchemaOnce(
  //   miroirFundamentalJzodSchema as JzodSchema, // context.miroirFundamentalJzodSchema,
  //   schema,
  //   currentModel as any as MetaModel,
  //   currentMiroirModel as any as MetaModel
  // );
  // if (unfoldedSchema.status === "error") {
  //   throw new Error(`Error while unfolding JzodUnion: ${unfoldedSchema.error}`);
  // }
  return jzodUnion_recursivelyUnfold(
    schema,
    // unfoldedSchema as JzodUnion,
    new Set(),
    miroirFundamentalJzodSchema as JzodSchema,
    currentModel as any as MetaModel,
    currentMiroirModel as any as MetaModel,
    relativeReferenceJzodContext
  );
}

describe("jzodUnion_RecursiveUnfold", () => {
  it("jzodUnion_RecursiveUnfold returns basic types at the root of the union", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "null" },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema);

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "null" },
      ],
      expandedReferences: new Set(),
    });
  });

  it("jzodUnion_RecursiveUnfold returns basic types in sub-unions", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        {
          type: "union",
          definition: [
            { type: "string" },
            { type: "boolean" },
            { type: "null" },
          ],
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema);

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
        { type: "null" },
      ],
      expandedReferences: new Set(),
    });
  });

  it("jzodUnion_RecursiveUnfold returns reference definitions for references present at the root of the union", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        { type: "schemaReference", definition: { relativePath: "MyReference"} },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {MyReference: { type: "string" }});

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "number" },
        { type: "string" },
      ],
      expandedReferences: new Set(["MyReference"]),
    });
  });

  it("jzodUnion_RecursiveUnfold returns reference definitions for references present in sub-unions", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        {
          type: "union",
          definition: [
            { type: "string" },
            { type: "schemaReference", definition: { relativePath: "MyReference"} },
          ],
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {MyReference: { type: "boolean" }});

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
      ],
      expandedReferences: new Set(["MyReference"]),
    });
  });

  it("jzodUnion_RecursiveUnfold returns reference definitions for references present in sub-unions with multiple levels", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        {
          type: "union",
          definition: [
            { type: "string" },
            {
              type: "union",
              definition: [
                { type: "schemaReference", definition: { relativePath: "MyReference"} },
                { type: "boolean" },
              ],
            },
          ],
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {MyReference: { type: "null" }});

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
        { type: "null" },
      ],
      expandedReferences: new Set(["MyReference"]),
    });
  });

  it("jzodUnion_RecursiveUnfold expand a reference definition when reference is itself a union", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        {
          type: "schemaReference",
          definition: {
            relativePath: "MyReference",
          },
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {
      "MyReference": {
        type: "union",
        definition: [
          { type: "string" },
          { type: "boolean" },
        ],
      }
    });

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
      ],
      expandedReferences: new Set(["MyReference"]),
    });
  });

  it("jzodUnion_RecursiveUnfold returns error when reference is not found in context", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        { type: "schemaReference", definition: { relativePath: "MyReference"} },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema);

    expect(result.status).toBe("error");
    expect((result as JzodUnion_RecursivelyUnfold_ReturnTypeError).error).toMatch(/^Error while recursively unfolding JzodUnion/);
  });

  it("jzodUnion_RecursiveUnfold expand a reference definition with discriminator when reference is itself a union with discriminator", () => {
    const schema: JzodUnion = {
      type: "union",
      discriminator: "myObjectType",
      definition: [
        { type: "number" },
        {
          type: "object",
          definition: {
            myObjectType: { type: "literal", definition: "A" },
          },
        },
        {
          type: "schemaReference",
          definition: {
            relativePath: "MyReference",
          },
        },
      ],
    };

    const result = local_jzodUnion_recursivelyUnfold(schema, {
      "MyReference": {
        type: "union",
        discriminator: "myObjectType",
        definition: [
          { type: "object", definition: { myObjectType: { type: "literal", definition: "B" } } },
          { type: "object", definition: { myObjectType: { type: "literal", definition: "C" } } },
        ],
      }
    });

    expect(result).toEqual({
      status: "ok",
      result: [
        { type: "number" },
        { type: "object", definition: { myObjectType: { type: "literal", definition: "A"}} },
        { type: "object", definition: { myObjectType: { type: "literal", definition: "B"}} },
        { type: "object", definition: { myObjectType: { type: "literal", definition: "C"}} },
      ],
      discriminator: "myObjectType",
      expandedReferences: new Set(["MyReference"]),
    });
  });
});
