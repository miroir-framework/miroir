import { describe, expect, it } from "vitest";
import { JzodElement, TransformerDefinition } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { substituteTransformerReferencesInJzodElement } from "../../src/2_domain/Transformer_tools";
const transformerDefinition: TransformerDefinition = {
  uuid: "16d866c4-bc81-4773-89a4-a47ac7f6549d",
  name: "object_fullTemplate",
  defaultLabel: "object_fullTemplate",
  description: "Create an object from an array of key-value pairs",
  parentUuid: "a557419d-a288-4fb8-8a1e-971c86c113b8",
  parentDefinitionVersionUuid: "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  parentName: "TransformerDefinition",
  transformerInterface: {
    transformerParameterSchema: {
      transformerType: {
        type: "literal",
        definition: "object_fullTemplate",
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
            type: "record",
            definition: {
              type: "any",
            },
          },
          referenceToOuterObject: {
            type: "string",
          },
          definition: {
            type: "array",
            definition: {
              type: "object",
              definition: {
                attributeKey: {
                  type: "schemaReference",
                  definition: {
                    relativePath: "transformerForBuild_InnerReference",
                  },
                },
                attributeValue: {
                  type: "schemaReference",
                  definition: {
                    relativePath: "transformer",
                  },
                },
              },
            },
          },
        },
      },
    },
    transformerResultSchema: {
      type: "record",
      definition: {
        type: "any",
      },
    },
  },
  transformerImplementation: {
    transformerImplementationType: "libraryImplementation",
    inMemoryImplementationFunctionName: "transformer_object_fullTemplate",
    sqlImplementationFunctionName: "sqlStringForListPickElementTransformer",
  },
};


describe("substituteTransformerReferencesInJzodElement", () => {
  it("should substitute schemaReference relativePath in JzodElement", () => {
    const jzodElement: JzodElement = {
      type: "schemaReference",
      definition: {
        relativePath: "transformer",
        absolutePath: "absolutePath",
      },
    };

    const result = substituteTransformerReferencesInJzodElement(jzodElement, {"transformer": "newPath"});

    expect(result).toEqual({
      type: "schemaReference",
      definition: {
        relativePath: "newPath",
        absolutePath: "absolutePath",
      },
    });
  });

  it("should recursively substitute schemaReference relativePath in nested JzodElement", () => {
    const jzodElement: JzodElement = {
      type: "object",
      definition: {
        nested: {
          type: "schemaReference",
          definition: {
            relativePath: "transformer",
            absolutePath: "absolutePath",
          },
        },
      },
    };

    const result = substituteTransformerReferencesInJzodElement(jzodElement, {"transformer": "newPath"});

    expect(result).toEqual({
      type: "object",
      definition: {
        nested: {
          type: "schemaReference",
          definition: {
            relativePath: "newPath",
            absolutePath: "absolutePath",
          },
        },
      },
    });
  });

  it("should subtitute schemaReference in real-case object_fullTemplate transformerDefinition"), () => {
    const result = substituteTransformerReferencesInJzodElement(
      transformerDefinition.transformerInterface.transformerParameterSchema.transformerDefinition,
      {"transformer": "transformerForBuild"}
    );

    expect(result).toEqual({
      type: "object",
      definition: {
        applyTo: {
          type: "record",
          definition: {
            type: "any",
          },
        },
        referenceToOuterObject: {
          type: "string",
        },
        definition: {
          type: "array",
          definition: {
            type: "object",
            definition: {
              attributeKey: {
                type: "schemaReference",
                definition: {
                  relativePath: "transformerForBuild_InnerReference",
                },
              },
              attributeValue: {
                type: "schemaReference",
                definition: {
                  relativePath: "transformerForBuild",
                },
              },
            },
          },
        },
      },
    });
  }
});