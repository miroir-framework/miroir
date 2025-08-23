import {
  JzodElement,
  JzodSchema,
  JzodUnion,
  jzodUnion_recursivelyUnfold,
  MetaModel,
  miroirFundamentalJzodSchema,
  unfoldJzodSchemaOnce,
  UnfoldJzodSchemaOnceReturnType,
} from "miroir-core";
import { describe, expect, it } from "vitest";
import { getObjectUniondiscriminatorValuesFromResolvedSchema } from "miroir-core/src/1_core/jzod/getObjectUniondiscriminatorValuesFromResolvedSchema";
import currentMiroirModel from "./currentMiroirModel.json";
import currentModel from "./currentModel.json";
import { JzodUnion_RecursivelyUnfold_ReturnType } from "miroir-core";
import { ResolvedJzodSchemaReturnType } from "miroir-core";
import { jzodTypeCheck } from "miroir-core";
import type { MiroirModelEnvironment } from "miroir-core";

function local_test(schema: JzodElement, instance: any): string[] {
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
    // miroirFundamentalJzodSchema as JzodSchema,
    // currentModel as any as MetaModel,
    // currentMiroirModel as any as MetaModel,
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
    expect(result).toEqual(["A", "B"]);
  });

});
