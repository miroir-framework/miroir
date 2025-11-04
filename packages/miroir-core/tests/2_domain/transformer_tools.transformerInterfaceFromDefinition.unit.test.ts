import { describe, it, expect } from "vitest";
import { TransformerDefinition } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { transformerInterfaceFromDefinition } from "../../src/2_domain/Transformer_tools";

const runtimeReferenceMap: Record<string, string> = {
  transformer: "transformerForRuntime",
  // transformer_InnerReference: "transformerForRuntime_InnerReference",
  transformer_createObject: "transformerForRuntime_createObject",
  transformer_getFromContext: "transformerForRuntime_getFromContext",
  transformer_accessDynamicPath: "transformerForRuntime_accessDynamicPath",
  transformer_mustacheStringTemplate: "transformerForRuntime_mustacheStringTemplate",
};

const buildReferenceMap: Record<string, string> = {
  transformer: "transformerForBuild",
  // transformer_InnerReference: "transformerForBuild_InnerReference",
  transformer_createObject: "transformerForBuild_createObject",
  transformer_getFromContext: "transformerForRuntime_getFromContext",
  transformer_accessDynamicPath: "transformerForBuild_accessDynamicPath",
  transformer_mustacheStringTemplate: "transformer_mustacheStringTemplate", // TODO: rename to transformer_mustacheStringTemplate
};

describe("transformerInterfaceFromDefinition", () => {
  const transformerDefinition: TransformerDefinition = {
    uuid: "16d866c4-bc81-4773-89a4-a47ac7f6549d",
    name: "createObjectFromPairs",
    defaultLabel: "createObjectFromPairs",
    description: "Create an object from an array of key-value pairs",
    parentUuid: "a557419d-a288-4fb8-8a1e-971c86c113b8",
    parentDefinitionVersionUuid: "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
    parentName: "TransformerDefinition",
    transformerInterface: {
      transformerParameterSchema: {
        transformerType: {
          type: "literal",
          definition: "createObjectFromPairs",
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
                      relativePath: "transformer",
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
        returns: "mlSchema",
        definition: {
          type: "record",
          definition: {
            type: "any",
          },
        }
      },
    },
    transformerImplementation: {
      transformerImplementationType: "libraryImplementation",
      inMemoryImplementationFunctionName: "transformer_createObjectFromPairs",
      sqlImplementationFunctionName: "sqlStringForListPickElementTransformer",
    },
  };

  it("should return a valid JzodElement for runtime target", () => {
    const result = transformerInterfaceFromDefinition(transformerDefinition, "runtime", runtimeReferenceMap);
    // console.log("result", JSON.stringify(result, null, 2));
    expect(result).toEqual({
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
        {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "transformerForRuntime_Abstract",
          },
          context: {},
        },
      ],
      definition: {
        transformerType: {
          type: "literal",
          definition: "createObjectFromPairs",
        },
        applyTo: {
          type: "schemaReference",
          optional: true,
          definition: {
            relativePath: "transformerForRuntime",
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          },
          context: {},
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
                  relativePath: "transformerForRuntime",
                },
              },
              attributeValue: {
                type: "schemaReference",
                definition: {
                  relativePath: "transformerForRuntime",
                },
              },
            },
          },
        },
      },
    });
  });

  it("should return a valid JzodElement for build target", () => {
    const result = transformerInterfaceFromDefinition(transformerDefinition, "build", buildReferenceMap);
    console.log("result", JSON.stringify(result, null, 2));
    expect(result).toEqual({
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
        {
          type: "schemaReference",
          definition: {
            eager: true,
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "transformerForBuild_Abstract",
          },
          context: {},
        },
      ],
      definition: {
        transformerType: {
          type: "literal",
          definition: "createObjectFromPairs",
        },
        applyTo: {
          type: "schemaReference",
          optional: true,
          definition: {
            relativePath: "transformerForBuild",
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          },
          context: {},
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
                  relativePath: "transformerForBuild",
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
  });
});