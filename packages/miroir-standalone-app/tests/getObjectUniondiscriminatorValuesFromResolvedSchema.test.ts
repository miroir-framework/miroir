import type { MiroirModelEnvironment } from "miroir-core";
import { deployment_Miroir } from "miroir-test-app_deployment-admin";
import {
  getObjectUniondiscriminatorValuesFromResolvedSchema,
  getMiroirFundamentalSchemaForDeployment,
  JzodElement,
  JzodUnion,
  jzodUnion_recursivelyUnfold,
  JzodUnion_RecursivelyUnfold_ReturnType,
  jzodUnionResolvedTypeForObject,
  MetaModel,
  MlSchema,
  unfoldJzodSchemaOnce,
  UnfoldJzodSchemaOnceReturnType,
} from "miroir-core";
import { describe, expect, it } from "vitest";
import currentMiroirModel from "./currentMiroirModel.json";
import currentModel from "./currentModel.json";

const schemaForTest = getMiroirFundamentalSchemaForDeployment(
  deployment_Miroir.uuid,
  currentModel as any as MetaModel,
);

// function local_test(schema: JzodElement, instance: any): string[][] {
function local_test(schema: JzodUnion, instance: any): string[][] {
  const modelEnvironment: MiroirModelEnvironment = {
    miroirFundamentalJzodSchema: schemaForTest,
    currentModel: currentModel as any as MetaModel,
    miroirMetaModel: currentMiroirModel as any as MetaModel,
    endpointsByUuid: {},
  };

  // const resolvedElementJzodSchema: ResolvedJzodSchemaReturnType | undefined = jzodTypeCheck(
  //   schema,
  //   instance,
  //   [], // currentValuePath
  //   [], // currentTypePath
  //   modelEnvironment, // modelEnvironment
  //   {}
  // )

  // if (resolvedElementJzodSchema.status === "error") {
  //   throw new Error(`Error while resolving Jzod schema: ${resolvedElementJzodSchema.error}`);
  // }


  const unfoldedRawSchema: UnfoldJzodSchemaOnceReturnType = unfoldJzodSchemaOnce(
    schemaForTest,
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
    {} // relativeReferenceJzodContext
  );
  if (recursivelyUnfoldedSchema.status === "error") {
    throw new Error(`Error while recursively unfolding JzodUnion: ${recursivelyUnfoldedSchema.error}`);
  }
  const resolveUnionResult = jzodUnionResolvedTypeForObject(
    recursivelyUnfoldedSchema.result,
    parentKeyMap.rawSchema as JzodUnion,
    schema.discriminator,
    instance, //valueObject,
    [], // currentValuePath,
    [], // currentTypePath,
    modelEnvironment,
    {}, // relativeReferenceJzodContext
  );

  if (resolveUnionResult.status === "error") {
    throw new Error(`Error while resolving JzodUnion for object: ${resolveUnionResult.error}`);
  }

  console.log("resolveUnionResult:", JSON.stringify(resolveUnionResult, null, 2));
  
  return getObjectUniondiscriminatorValuesFromResolvedSchema(
    "",
    // resolvedElementJzodSchema.resolvedSchema,
    unfoldedRawSchema.element,
    recursivelyUnfoldedSchema.result,
    resolveUnionResult.objectUnionChoices,
    resolveUnionResult
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

  // it("composite discriminator", () => {
  //   const schema: JzodUnion = {
  //     type: "union",
  //     discriminator: ["objectType", "interpolation"],
  //     definition: [
  //       {
  //         type: "object",
  //         definition: {
  //           objectType: { type: "literal", definition: "A" },
  //           interpolation: { type: "literal", definition: "build" },
  //           value: { type: "string" },
  //         },
  //       },
  //       {
  //         type: "object",
  //         definition: {
  //           objectType: { type: "literal", definition: "B" },
  //           interpolation: { type: "literal", definition: "runtime" },
  //           value: { type: "number" },
  //         },
  //       },
  //     ],
  //   };
  //   const instance = { objectType: "A", interpolation: "build", value: "test" };
  //   const result = local_test(schema, instance);
  //   console.log("Result for simple union:", JSON.stringify(result, null, 2));
  //   expect(result).toEqual([["A", "B"], ["build", "runtime"]]);
  // });

  // it("discriminated union with array opt-in", () => {
  //   const schema: JzodUnion = {
  //     type: "union",
  //     discriminator: "type",
  //     definition: [
  //       {
  //         type: "schemaReference",
  //         definition: {
  //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //           relativePath: "jzodReference",
  //         },
  //       },
  //       {
  //         type: "schemaReference",
  //         definition: {
  //           absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //           relativePath: "jzodObject",
  //         },
  //       },
  //       {
  //         type: "array",
  //         definition: {
  //           type: "union",
  //           discriminator: "type",
  //           definition: [
  //             {
  //               type: "schemaReference",
  //               definition: {
  //                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                 relativePath: "jzodReference",
  //               },
  //             },
  //             {
  //               type: "schemaReference",
  //               definition: {
  //                 absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
  //                 relativePath: "jzodObject",
  //               },
  //             },
  //             {
  //               type: "undefined",
  //             },
  //           ],
  //         },
  //       },
  //     ],
  //   };
  //   const instance = {
  //     type: "schemaReference",
  //     context: {
  //       a: {
  //         type: "string",
  //       },
  //     },
  //     definition: {
  //       relativePath: "a",
  //     },
  //   };
  //   const result = local_test(schema, instance);
  //   console.log("Result for simple union:", JSON.stringify(result, null, 2));
  //   expect(result).toEqual([["schemaReference", "object"]]);
  // });

});
