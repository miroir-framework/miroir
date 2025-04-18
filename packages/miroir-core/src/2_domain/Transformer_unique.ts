import { transformer } from "zod";
import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformerForRuntimeInterfaceFromDefinition } from "./Transformer_tools";


/**
 * TODO:
 * there are two operations to get the proper type:
 * 1. allow replacing the applyTo attribute with a transformer -> transformerForRuntime_count
 * 2. allow producing a build transformer from the runtime transformer -> transformerForBuild_count
 */
export const transformer_unique: TransformerDefinition = {
  uuid: "a93aec8f-3f8b-4129-a907-e7321c1e7171",
  name: "unique",
  defaultLabel: "unique",
  description: "Transform a list into another list without duplicate values",
  parentUuid: "a557419d-a288-4fb8-8a1e-971c86c113b8",
  parentDefinitionVersionUuid: "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  parentName: "TransformerDefinition",
  transformerInterface: {
    transformerParameterSchema: {
      transformerType: {
        type: "literal",
        definition: "unique",
      },
      transformerDefinition: {
        type: "object",
        extend: [
          {
            type: "schemaReference",
            definition: {
              eager: true,
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "transformer_orderBy",
            },
          },
        ],
        definition: {
          applyTo: {
            type: "array",
            definition: {
              type: "any",
            },
          },
          attribute: {
            type: "string",
          },
        },
      },
    },
    transformerResultSchema: {
      type: "array",
      definition: {
        type: "any",
      },
    },
  },
  transformerImplementation: {
    transformerImplementationType: "libraryImplementation",
    inMemoryImplementationFunctionName: "handleUniqueTransformer",
    sqlImplementationFunctionName: "sqlStringForUniqueTransformer",
  } as any, // TODO: remove cast, use proper type
};


export const transformerForRuntimeInterface_unique: JzodElement =
  transformerForRuntimeInterfaceFromDefinition(transformer_unique, "runtime");
export const transformerForBuildInterface_unique: JzodElement =
  transformerForRuntimeInterfaceFromDefinition(transformer_unique, "build");