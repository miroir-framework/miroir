import { TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export const transformer_spreadSheetToJzodSchema: TransformerDefinition = {
  uuid: "f1dc903c-19b5-4903-91dd-4f78ffa42929",
  name: "spreadSheetToJzodSchema",
  defaultLabel: "spreadSheetToJzodSchema",
  description: "Transform a spreadsheet into a Jzod schema",
  parentUuid: "a557419d-a288-4fb8-8a1e-971c86c113b8",
  parentDefinitionVersionUuid: "54a16d69-c1f0-4dd7-aba4-a2cda883586c",
  parentName: "TransformerDefinition",
  transformerInterface: {
    transformerParameterSchema: {
      transformerType: {
        type: "literal",
        definition: "spreadSheetToJzodSchema",
      },
      transformerDefinition: {
        type: "object",
        definition: {
          spreadsheetContents: {
            type: "union",
            definition: [
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                  relativePath: "transformerForBuild",
                },
              },
              {
                type: "array",
                definition: {
                  type: "record",
                  definition: {
                    type: "any",
                  },
                },
              },
            ],
          },
        },
      },
    },
    transformerResultSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "jzodElement",
      },
    },
  },
  transformerImplementation: {
    transformerImplementationType: "transformer",
    definition: {
      transformerType: "dataflowObject",
      target: "schema",
      definition: {
        firstLine: {
          transformerType: "listPickElement",
          applyTo: {
            referenceType: "referencedTransformer",
            reference: {
              transformerType: "contextReference",
              referenceName: "spreadsheetContents",
            },
          },
          index: 0,
        },
        attributeNames: {
          transformerType: "objectValues",
          applyTo: {
            referenceType: "referencedTransformer",
            reference: {
              transformerType: "contextReference",
              referencePath: ["firstLine"],
            },
          },
        },
        splitAttributeDefinitions: {
          transformerType: "mapperListToList",
          applyTo: {
            referenceType: "referencedTransformer",
            reference: {
              transformerType: "contextReference",
              referencePath: ["attributeNames"],
            },
          },
          referenceToOuterObject: "attributeName",
          elementTransformer: {
            transformerType: "object_fullTemplate",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "contextReference",
                referencePath: ["attributeName"],
              },
            },
            referenceToOuterObject: "attributeName",
            definition: [
              {
                attributeKey: {
                  transformerType: "contextReference",
                  referencePath: ["attributeName"],
                },
                attributeValue: {
                  transformerType: "constant",
                  value: { type: "string" },
                },
              },
            ],
          },
        },
        mergedAttributeDefinitions: {
          transformerType: "listReducerToSpreadObject",
          applyTo: {
            referenceType: "referencedTransformer",
            reference: {
              transformerType: "contextReference",
              referencePath: ["splitAttributeDefinitions"],
            },
          },
        },
        completeAttributeDefinitions: {
          transformerType: "objectAlter",
          applyTo: {
            referenceType: "referencedTransformer",
            reference: {
              transformerType: "contextReference",
              referenceName: "mergedAttributeDefinitions",
            },
          },
          referenceToOuterObject: "mergedAttributeDefinitions",
          definition: {
            transformerType: "constantObject",
            value: {
              uuid: {
                type: "string",
                validations: [{ type: "uuid" }],
                tag: { id: 1, defaultLabel: "Uuid", editable: false },
              },
              parentName: {
                type: "string",
                optional: true,
                tag: { id: 2, defaultLabel: "Uuid", editable: false },
              },
              parentUuid: {
                type: "string",
                validations: [{ type: "uuid" }],
                tag: { id: 3, defaultLabel: "parentUuid", editable: false },
              },
            },
          },
        },
        schema: {
          transformerType: "freeObjectTemplate",
          definition: {
            type: {
              transformerType: "constant",
              value: "object",
            },
            definition: {
              transformerType: "contextReference",
              referencePath: ["completeAttributeDefinitions"],
            },
          },
        },
      },
    },
  } as any, // TODO: remove cast, use proper type
};
