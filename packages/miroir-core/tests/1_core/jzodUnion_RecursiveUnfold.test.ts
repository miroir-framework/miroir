import { describe, expect, it } from "vitest";
import { miroirFundamentalJzodSchema } from '../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema';
import {
  JzodSchema,
  JzodUnion,
  MetaModel
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { jzodUnion_recursivelyUnfold, JzodUnion_RecursivelyUnfold_ReturnTypeError, JzodUnion_RecursivelyUnfold_ReturnTypeOK } from "../../src/1_core/jzod/jzodUnion_RecursivelyUnfold";
import currentMiroirModel from "./currentMiroirModel.json";
import currentModel from "./currentModel.json";


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

    const result = jzodUnion_recursivelyUnfold(
      schema,
      new Set(),
      {} as JzodSchema,
      {} as MetaModel,
      {} as MetaModel,
      {}
    );

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

    const result = jzodUnion_recursivelyUnfold(
      schema,
      new Set(),
      miroirFundamentalJzodSchema as JzodSchema,
      currentModel as any as MetaModel,
      currentMiroirModel as any as MetaModel,
      {}
    );

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

    const result = jzodUnion_recursivelyUnfold(
      schema,
      new Set(),
      miroirFundamentalJzodSchema as JzodSchema,
      currentModel as any as MetaModel,
      currentMiroirModel as any as MetaModel,
      {MyReference: { type: "string" }}
    );

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

    const result = jzodUnion_recursivelyUnfold(
      schema,
      new Set(),
      miroirFundamentalJzodSchema as JzodSchema,
      currentModel as any as MetaModel,
      currentMiroirModel as any as MetaModel,
      {MyReference: { type: "boolean" }}
    );

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

    const result = jzodUnion_recursivelyUnfold(
      schema,
      new Set(),
      miroirFundamentalJzodSchema as JzodSchema,
      currentModel as any as MetaModel,
      currentMiroirModel as any as MetaModel,
      {MyReference: { type: "null" }}
    );

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

    const result = jzodUnion_recursivelyUnfold(
      schema,
      new Set(),
      miroirFundamentalJzodSchema as JzodSchema,
      currentModel as any as MetaModel,
      currentMiroirModel as any as MetaModel,
      {
        "MyReference": {
            type: "union",
            definition: [
              { type: "string" },
              { type: "boolean" },
            ],
          }}
    );

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

    const result = jzodUnion_recursivelyUnfold(
      schema,
      new Set(),
      miroirFundamentalJzodSchema as JzodSchema,
      currentModel as any as MetaModel,
      currentMiroirModel as any as MetaModel,
      {}
    );

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

    const result = jzodUnion_recursivelyUnfold(
      schema,
      new Set(),
      miroirFundamentalJzodSchema as JzodSchema,
      currentModel as any as MetaModel,
      currentMiroirModel as any as MetaModel,
      {
        "MyReference": {
            type: "union",
            discriminator: "myObjectType",
            definition: [
              { type: "object", definition: { myObjectType: { type: "literal", definition: "B"}} },
              { type: "object", definition: { myObjectType: { type: "literal", definition: "C"}} },
            ],
          }}
    );

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

  it("jzodUnion_RecursiveUnfold fails when union with discriminator has reference which is itself a union with discriminator, but the two discriminators differ", () => {
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
    const result = jzodUnion_recursivelyUnfold(
      schema,
      new Set(),
      miroirFundamentalJzodSchema as JzodSchema,
      currentModel as any as MetaModel,
      currentMiroirModel as any as MetaModel,
      {
        MyReference: {
          type: "union",
          discriminator: "myOtherObjectType",
          definition: [
            {
              type: "object",
              definition: { myOtherObjectType: { type: "literal", definition: "B" } },
            },
            {
              type: "object",
              definition: { myOtherObjectType: { type: "literal", definition: "C" } },
            },
          ],
        },
      }
    );
    expect(result.status).toBe("error");
    expect((result as JzodUnion_RecursivelyUnfold_ReturnTypeError).error).toMatch(
      "Discriminator mismatch: parent union discriminator (myObjectType) does not match sub-union discriminator (myOtherObjectType)"
    );
  });
});
