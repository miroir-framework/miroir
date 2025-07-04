import { JzodElement, JzodUnion } from "miroir-core";
import { describe, it } from "vitest";
import { getUnionInformation } from "../../src/miroir-fwk/4_view/1-core/getUnionInformation";

import {
  JzodSchema,
  jzodTypeCheck,
  jzodUnion_recursivelyUnfold,
  JzodUnion_RecursivelyUnfold_ReturnType,
  MetaModel,
  miroirFundamentalJzodSchema,
  ResolvedJzodSchemaReturnType,
  unfoldJzodSchemaOnce,
  UnfoldJzodSchemaOnceReturnType
} from "miroir-core";

import currentMiroirModel from "../currentMiroirModel.json";
import currentModel from "../currentModel.json";

function local_getUnionInformation(
  schema: JzodElement, instance: any,
  setItemsOrder: React.Dispatch<React.SetStateAction<any[]>>
) {
  const resolvedElementJzodSchema: ResolvedJzodSchemaReturnType | undefined = jzodTypeCheck(
    schema,
    instance,
    [], // currentValuePath
    [], // currentTypePath
    miroirFundamentalJzodSchema as JzodSchema,
    currentModel as any as MetaModel,
    currentMiroirModel as any as MetaModel,
    {}
  )

  if (resolvedElementJzodSchema.status === "error") {
    throw new Error(`Error while resolving Jzod schema: ${resolvedElementJzodSchema.error}`);
  }

  const unfoldedRawSchema: UnfoldJzodSchemaOnceReturnType = unfoldJzodSchemaOnce(
    miroirFundamentalJzodSchema as JzodSchema, // context.miroirFundamentalJzodSchema,
    schema,
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
    miroirFundamentalJzodSchema as JzodSchema,
    currentModel as any as MetaModel,
    currentMiroirModel as any as MetaModel,
    {} // relativeReferenceJzodContext
  );
  if (recursivelyUnfoldedSchema.status === "error") {
    throw new Error(`Error while recursively unfolding JzodUnion: ${recursivelyUnfoldedSchema.error}`);
  }
  // const objectUniondiscriminatorValuesFromResolvedSchema = getObjectUniondiscriminatorValuesFromResolvedSchema(
  //   resolvedElementJzodSchema.element,
  //   unfoldedRawSchema.element,
  //   recursivelyUnfoldedSchema.result,
  //   (unfoldedRawSchema.element as JzodUnion).discriminator
  // );
  
  return getUnionInformation(
    unfoldedRawSchema.element,
    resolvedElementJzodSchema.resolvedSchema,
    recursivelyUnfoldedSchema,
  );
}

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
describe("getUnionInformation", () => {

  // ##############################################################################################
  it("returns a correct result for simple union of discriminated objects", () => {
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

    const result = local_getUnionInformation(
      schema,
      instance,
      () => {}
    );
    console.log("Result for", expect.getState().currentTestName,":", JSON.stringify(result, null, 2));
    expect(result).toEqual({
      jzodSchema: schema,
      objectBranches: [
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
      discriminator: "objectType",
      discriminatorValues: ["A", "B"],
    });
  });

  // ##############################################################################################
  it("schemaReference enclosing a simple union of discriminated objects with schemaReference", () => {
    const schema: JzodElement = {
      type: "schemaReference",
      context: {
        myObject: {
          type: "object",
          definition: {
            objectType: { type: "literal", definition: "B" },
            value: { type: "number" },
          },
        },
        myUnion: {
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
              type: "schemaReference",
              definition: {
                relativePath: "myObject",
              },
            }
          ],
        },
      },
      definition: {
        relativePath: "myUnion",
      },
    };

    const instance = { objectType: "A", value: "test" };

    const result = local_getUnionInformation(
      schema,
      instance,
      () => {}
    );
    console.log("Result for", expect.getState().currentTestName,":", JSON.stringify(result, null, 2));
    expect(result).toEqual({
      jzodSchema: {
        type: "union",
        discriminator: "objectType",
        definition: [
          {
            type: "object",
            definition: {
              objectType: {
                type: "literal",
                definition: "A",
              },
              value: {
                type: "string",
              },
            },
          },
          {
            type: "schemaReference",
            definition: {
              relativePath: "myObject",
            },
            context: {
              myObject: {
                type: "object",
                definition: {
                  objectType: {
                    type: "literal",
                    definition: "B",
                  },
                  value: {
                    type: "number",
                  },
                },
              },
              myUnion: {
                type: "union",
                discriminator: "objectType",
                definition: [
                  {
                    type: "object",
                    definition: {
                      objectType: {
                        type: "literal",
                        definition: "A",
                      },
                      value: {
                        type: "string",
                      },
                    },
                  },
                  {
                    type: "schemaReference",
                    definition: {
                      relativePath: "myObject",
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      objectBranches: [
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
      discriminator: "objectType",
      discriminatorValues: ["A", "B"],
    });
  });

  // ##############################################################################################
});