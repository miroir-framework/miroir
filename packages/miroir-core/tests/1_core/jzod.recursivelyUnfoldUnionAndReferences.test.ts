import { describe, expect, it } from "vitest";
import {
  JzodSchema,
  JzodUnion,
  MetaModel
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { miroirFundamentalJzodSchema } from '../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema';
import currentModel from "./currentModel.json";
import currentMiroirModel from "./currentMiroirModel.json";
import {
  recursivelyUnfoldUnionAndReferences
} from "../../src/1_core/jzod/JzodUnfoldSchemaForValue";


describe("recursivelyUnfoldUnionAndReferences", () => {
  it("recursivelyUnfoldUnionAndReferences returns basic types at the root of the union", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "null" },
      ],
    };

    const result = recursivelyUnfoldUnionAndReferences(
      schema,
      new Set(),
      {} as JzodSchema,
      {} as MetaModel,
      {} as MetaModel,
      {}
    );

    expect(result).toEqual({
      result: [
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "null" },
      ],
      expandedReferences: new Set(),
    });
  });

  it("recursivelyUnfoldUnionAndReferences returns basic types in sub-unions", () => {
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

    const result = recursivelyUnfoldUnionAndReferences(
      schema,
      new Set(),
      miroirFundamentalJzodSchema as JzodSchema,
      currentModel as any as MetaModel,
      currentMiroirModel as any as MetaModel,
      {}
    );

    expect(result).toEqual({
      result: [
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
        { type: "null" },
      ],
      expandedReferences: new Set(),
    });
  });

  it("recursivelyUnfoldUnionAndReferences returns reference definitions for references present at the root of the union", () => {
    const schema: JzodUnion = {
      type: "union",
      definition: [
        { type: "number" },
        { type: "schemaReference", definition: { relativePath: "MyReference"} },
      ],
    };

    const result = recursivelyUnfoldUnionAndReferences(
      schema,
      new Set(),
      miroirFundamentalJzodSchema as JzodSchema,
      currentModel as any as MetaModel,
      currentMiroirModel as any as MetaModel,
      {MyReference: { type: "string" }}
    );

    expect(result).toEqual({
      result: [
        { type: "number" },
        { type: "string" },
      ],
      expandedReferences: new Set(["MyReference"]),
    });
  });

  it("recursivelyUnfoldUnionAndReferences returns reference definitions for references present in sub-unions", () => {
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

    const result = recursivelyUnfoldUnionAndReferences(
      schema,
      new Set(),
      miroirFundamentalJzodSchema as JzodSchema,
      currentModel as any as MetaModel,
      currentMiroirModel as any as MetaModel,
      {MyReference: { type: "boolean" }}
    );

    expect(result).toEqual({
      result: [
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
      ],
      expandedReferences: new Set(["MyReference"]),
    });
  });

  it("recursivelyUnfoldUnionAndReferences returns reference definitions for references present in sub-unions with multiple levels", () => {
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

    const result = recursivelyUnfoldUnionAndReferences(
      schema,
      new Set(),
      miroirFundamentalJzodSchema as JzodSchema,
      currentModel as any as MetaModel,
      currentMiroirModel as any as MetaModel,
      {MyReference: { type: "null" }}
    );

    expect(result).toEqual({
      result: [
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
        { type: "null" },
      ],
      expandedReferences: new Set(["MyReference"]),
    });
  });

  it("recursivelyUnfoldUnionAndReferences expanda reference definition when reference is itself a union", () => {
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

    const result = recursivelyUnfoldUnionAndReferences(
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
      result: [
        { type: "number" },
        { type: "string" },
        { type: "boolean" },
      ],
      expandedReferences: new Set(["MyReference"]),
    });
  });
});
