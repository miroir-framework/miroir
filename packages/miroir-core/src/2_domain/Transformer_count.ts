import { transformer } from "zod";
import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";


/**
 * TODO:
 * there are two operations to get the proper type:
 * 1. allow replacing the applyTo attribute with a transformer -> transformerForRuntime_count
 * 2. allow producing a build transformer from the runtime transformer -> transformerForBuild_count
 */
export const transformer_count: TransformerDefinition = {
  uuid: "4ee5c863-5ade-4706-92bd-1fc2d89c3766",
  name: "count",
  defaultLabel: "count",
  description: "Transform a list into a count object",
  parentUuid: "a557419d-a288-4fb8-8a1e-971c86c113b8",
  parentDefinitionVersionUuid: "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  parentName: "TransformerDefinition",
  transformerInterface: {
    transformerParameterSchema: {
      transformerType: {
        type: "literal",
        definition: "count",
      },
      transformerDefinition: {
        type: "object",
        definition: {
          applyTo: {
            type: "array",
            definition: {
              type: "any",
              // type: "record",
              // definition: { // should be a (generic) type parameter instead!
              //   type: "any",
              // },
            },
          },
          attribute: {
            type: "string",
            optional: true,
            // tag: { substitute: "build" },
          },
          groupBy: {
            type: "string",
            optional: true,
            // tag: { substitute: "build" },
          },
        },
      },
    },
    transformerResultSchema: {
      type: "array",
      definition: {
        type: "object",
        definition: {
          count: {
            type: "number", // TODO: consider the groupBy case
          },
        },
      },
    },
  },
  transformerImplementation: {
    transformerImplementationType: "libraryImplementation",
    implementationFunctionName: "transformer_count",
  } as any, // TODO: remove cast, use proper type
};

export function transformerForRuntimeInterfaceFromDefinition(transformerDefinition:TransformerDefinition, target: "build" | "runtime"  ):JzodElement {
  const result: JzodElement = {
    type: "object",
    extend: [
      {
        type: "schemaReference",
        definition: {
          eager: true,
          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          relativePath:
            target == "runtime" ? "transformerForRuntime_Abstract" : "transformerForBuild_Abstract",
        },
        context: {},
      },
    ],
    definition: {
      transformerType:
        transformerDefinition.transformerInterface.transformerParameterSchema.transformerType,
      ...transformerDefinition.transformerInterface.transformerParameterSchema.transformerDefinition
        .definition,
      applyTo: {
        type: "union",
        discriminator: "referenceType",
        definition: [
          (
            transformerDefinition.transformerInterface.transformerParameterSchema
              .transformerDefinition.definition as any
          ).applyTo,
          {
            type: "schemaReference",
            definition: {
              relativePath: "transformer_inner_referenced_extractor",
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            },
            context: {},
          },
          {
            type: "schemaReference",
            definition: {
              relativePath:
                target == "runtime"
                  ? "transformer_inner_referenced_transformerForRuntime"
                  : "transformer_inner_referenced_transformerForBuild",
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            },
            context: {},
          },
        ],
      },
    },
  };
  return result;
}

export const transformerForRuntimeInterface_count: JzodElement = transformerForRuntimeInterfaceFromDefinition(transformer_count, "runtime");
export const transformerForBuildInterface_count: JzodElement = transformerForRuntimeInterfaceFromDefinition(transformer_count, "build");