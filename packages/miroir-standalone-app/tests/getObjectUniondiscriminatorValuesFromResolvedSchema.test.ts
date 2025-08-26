import type { MiroirModelEnvironment } from "miroir-core";
import {
  getObjectUniondiscriminatorValuesFromResolvedSchema,
  JzodElement,
  JzodSchema,
  jzodTypeCheck,
  JzodUnion,
  jzodUnion_recursivelyUnfold,
  JzodUnion_RecursivelyUnfold_ReturnType,
  MetaModel,
  miroirFundamentalJzodSchema,
  ResolvedJzodSchemaReturnType,
  unfoldJzodSchemaOnce,
  UnfoldJzodSchemaOnceReturnType,
} from "miroir-core";
import { describe, expect, it } from "vitest";
import currentMiroirModel from "./currentMiroirModel.json";
import currentModel from "./currentModel.json";

function local_test(schema: JzodElement, instance: any): string[][] {
  const modelEnvironment: MiroirModelEnvironment =     {
      miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as JzodSchema,
      currentModel: currentModel as any as MetaModel,
      miroirMetaModel: currentMiroirModel as any as MetaModel
    };

  const resolvedElementJzodSchema: ResolvedJzodSchemaReturnType | undefined = jzodTypeCheck(
    schema,
    instance,
    [], // currentValuePath
    [], // currentTypePath
    modelEnvironment, // modelEnvironment
    {}
  )

  if (resolvedElementJzodSchema.status === "error") {
    throw new Error(`Error while resolving Jzod schema: ${resolvedElementJzodSchema.error}`);
  }

  const unfoldedRawSchema: UnfoldJzodSchemaOnceReturnType = unfoldJzodSchemaOnce(
    miroirFundamentalJzodSchema as JzodSchema, // context.miroirFundamentalJzodSchema,
    schema,
    [], // path
    [], // unfodingReference,
    schema, // rootSchema
    0, // depth
    currentModel as any as MetaModel,
    currentMiroirModel as any as MetaModel
  );
  if (unfoldedRawSchema.status === "error") {
    throw new Error(`Error while unfolding JzodUnion: ${unfoldedRawSchema.error}`);
  }
  if (unfoldedRawSchema.element.type !== "union") {
    throw new Error(`Expected a JzodUnion, got ${unfoldedRawSchema.element.type}`);
  }
  const recursivelyUnfoldedSchema: JzodUnion_RecursivelyUnfold_ReturnType = jzodUnion_recursivelyUnfold(
    unfoldedRawSchema.element as JzodUnion,
    new Set(),
    modelEnvironment, // modelEnvironment
    // miroirFundamentalJzodSchema as JzodSchema,
    // currentModel as any as MetaModel,
    // currentMiroirModel as any as MetaModel,
    {} // relativeReferenceJzodContext
  );
  if (recursivelyUnfoldedSchema.status === "error") {
    throw new Error(`Error while recursively unfolding JzodUnion: ${recursivelyUnfoldedSchema.error}`);
  }
  return getObjectUniondiscriminatorValuesFromResolvedSchema(
    resolvedElementJzodSchema.resolvedSchema,
    unfoldedRawSchema.element,
    recursivelyUnfoldedSchema.result,
    // (unfoldedRawSchema.element as JzodUnion).discriminator
  );
}

describe("getObjectUniondiscriminatorValuesFromResolvedSchema", () => {
  it("returns correct result for a simple union of objects with discriminator", () => {
    const schema: JzodUnion = {
      type: "union",
      discriminator: "objectType",
      definition: [
        {
          type: "object",
          definition: {
            objectType: { type: "literal", definition: "A" },
            value: { type: "string" },
          },
        },
        {
          type: "object",
          definition: {
            objectType: { type: "literal", definition: "B" },
            value: { type: "number" },
          },
        },
      ],
    };
    const instance = { objectType: "A", value: "test" };
    const result = local_test(schema, instance);
    console.log("Result for simple union:", JSON.stringify(result, null, 2));
    expect(result).toEqual([["A", "B"]]);
  });

  it("composite discriminator", () => {
    const schema: JzodUnion = {
      type: "union",
      discriminator: ["objectType", "interpolation"],
      definition: [
        {
          type: "object",
          definition: {
            objectType: { type: "literal", definition: "A" },
            interpolation: { type: "literal", definition: "build" },
            value: { type: "string" },
          },
        },
        {
          type: "object",
          definition: {
            objectType: { type: "literal", definition: "B" },
            interpolation: { type: "literal", definition: "runtime" },
            value: { type: "number" },
          },
        },
      ],
    };
    const instance = { objectType: "A", interpolation: "build", value: "test" };
    const result = local_test(schema, instance);
    console.log("Result for simple union:", JSON.stringify(result, null, 2));
    expect(result).toEqual([["A", "B"], ["build", "runtime"]]);
  });

});
