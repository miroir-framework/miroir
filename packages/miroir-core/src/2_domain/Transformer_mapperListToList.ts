import { JzodElement, TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export const transformer_Reference: JzodElement = {
  type: "object",
  definition: {
    referenceType: {
      type: "literal",
      definition: "transformer_reference",
    },
    reference: 
    // {
    //   type: "union",
    //   definition: [
    //     {
    //       type: "string",
    //     },
      {
        type: "object",
        definition: {
          transformerName: { type: "string" },
          transformerResultType: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "jzodElement",
            },
          }
        },
      },
      // ],
    // },
  }
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
        definition: {
          applyTo: { // data element or reference to input data. Input parameter type for the transformer
            type: "union",
            discriminator: "referenceType", // not necessarily a discriminated union. Here, it is NOT.
            definition: [
              {
                type: "array",
                definition: {
                  type: "any",
                },
              },
              {
                type: "object",
                definition: {
                  referenceType: {
                    type: "literal",
                    definition: "referencedExtractor",
                  },
                  reference: {
                    type: "union",
                    definition: [
                      {
                        type: "string",
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "transformer_extractors",  // transformer_extractor returning a list of items
                        },
                      },
                    ],
                  },
                },
              },
              {
                type: "object",
                definition: {
                  referenceType: {
                    type: "literal",
                    definition: "referencedTransformer",
                  },
                  reference: {
                    type: "union",
                    definition: [
                      {
                        type: "string",
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "transformerForBuild", // transformer returning a list of items
                        },
                      },
                    ],
                  },
                },
              },
            ],
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
    inMemoryImplementationFunctionName: "transformer_mapperListToList",
  } as any, // TODO: remove cast, use proper type
};

