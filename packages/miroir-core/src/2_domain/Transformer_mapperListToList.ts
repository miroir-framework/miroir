import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformerForRuntimeInterfaceFromDefinition } from "./Transformer_tools";

export const transformer_Reference: JzodElement = {
  type: "object",
  definition: {
    referenceType: {
      type: "literal",
      definition: "transformer_reference",
    },
    reference: {
      type: "object",
      definition: {
        transformerName: { type: "string" },
        transformerResultType: {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodElement",
          },
        },
      },
    },
  },
};
  
export const transformer_typed: JzodElement = {
  type: "object",
  definition: {
    transformerType: {
      type: "literal",
      definition: "transformer_typed",
    },
    transformerResultSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "jzodElement",
      }
    },
    definition: {
      type: "schemaReference",
      definition: {
        relativePath: "transformerForRuntime",
        // relativePath: "transformer_Reference",
      },
    },
  }
};
  

export const transformer_mapperListToList: TransformerDefinition = {
  uuid: "3ec73049-5e54-40aa-bc86-4c4906d00baa",
  name: "mapperListToList",
  defaultLabel: "mapperListToList",
  description:
    "Transform a list into another list, running the given transformer on each item of the list",
  parentUuid: "a557419d-a288-4fb8-8a1e-971c86c113b8",
  parentDefinitionVersionUuid: "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  parentName: "TransformerDefinition",
  transformerInterface: {
    transformerParameterSchema: {
      transformerType: {
        type: "literal",
        definition: "mapperListToList",
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
          applyTo: { // data element or reference to input data. Input parameter type for the transformer
            type: "array",
            definition: {
              type: "any",
            },
          },
          referenceToOuterObject: {
            type: "string",
          },
          elementTransformer: {
            type: "schemaReference",
            definition: {
              relativePath: "transformer_inner_elementTransformer_transformerForRuntime",
              // relativePath: "transformer_Reference",
            },
          },
        },
      },
    },
    transformerResultSchema: {
      type: "array", // should be a dependent type
      definition: {
        type: "any",
      },
    },
  },
  transformerImplementation: {
    transformerImplementationType: "libraryImplementation",
    inMemoryImplementationFunctionName: "transformerForBuild_list_listMapperToList_apply",
    sqlImplementationFunctionName: "sqlStringForMapperListToListTransformer",
  } as any, // TODO: remove cast, use proper type
};

export const transformerForRuntimeInterface_mapperListToList: JzodElement =
  transformerForRuntimeInterfaceFromDefinition(transformer_mapperListToList, "runtime");
export const transformerForBuildInterface_mapperListToList: JzodElement =
  transformerForRuntimeInterfaceFromDefinition(transformer_mapperListToList, "build");