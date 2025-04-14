import { TransformerDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

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
          spreadsheetContents: {
            // type: "union",
            // definition: [
            //   {
            //     type: "schemaReference",
            //     definition: {
            //       absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            //       relativePath: "transformerForBuild",
            //     },
            //   },
              // {
                type: "array",
                definition: {
                  type: "record",
                  definition: { // should be a (generic) type parameter instead!
                    type: "any",
                  },
                },
              // },
            // ],
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
      //   type: "schemaReference",
      //   definition: {
      //     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
      //     relativePath: "jzodElement",
      //   },
      // },
      type: "array",
      definition: {
        type: "object",
        definition: {
          count: {
            type: "number",
            // validations: [{ type: "number" }],
            // tag: { id: 1, defaultLabel: "count", editable: false },
          },
          // groupBy: {
          //   type: "string",
          //   validations: [{ type: "string" }],
          //   tag: { id: 2, defaultLabel: "groupBy", editable: false },
          // },
        },
      },
    },
  },
  transformerImplementation: {
    transformerImplementationType: "libraryImplementation",
    implementationFunctionName: "transformer_count",
  } as any, // TODO: remove cast, use proper type
};

