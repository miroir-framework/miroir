import { EntityInstance, JzodElement, TransformerForBuild, TransformerForRuntime } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { displayTestSuiteResults } from "../../4_services/otherTools.js";
import { TestSuiteContext } from "../../4_services/TestSuiteContext.js";

// import entityDefinitionCountry from "../../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json" with { type: "json" };

// import folio from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json" with { type: "json" };
// import penguin from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json" with { type: "json" };
// import springer from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json" with { type: "json" };
// import author1 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json" with { type: "json" };
// import author2 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json" with { type: "json" };
// import author3 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json" with { type: "json" };
// import author4 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json" with { type: "json" };
// import book1 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json" with { type: "json" };
// import book2 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json" with { type: "json" };
// import book3 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json" with { type: "json" };
// import book4 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json" with { type: "json" };
// import book5 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json" with { type: "json" };
// import book6 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json" with { type: "json" };
// // import test1 from "../../assets/library_data/9ad64893-5f8f-4eaf-91aa-ffae110f88c8/150bacfd-06d0-4ecb-828d-f5275494448a.json" with { type: "json" };
// import Country1 from "../../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/2eda1207-4dcc-4af9-a3ba-ef75e7f12c11.json" with { type: "json" };
// import Country2 from "../../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/30b8e7c6-b75d-4db0-906f-fa81fa5c4cc0.json" with { type: "json" };
// import Country3 from "../../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b62fc20b-dcf5-4e3b-a247-62d0475cf60f.json" with { type: "json" };
// import Country4 from "../../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b6ddfb89-4301-48bf-9ed9-4ed6ee9261fe.json" with { type: "json" };

// import publisher1 from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json" with { type: "json" };
// import publisher2 from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json" with { type: "json" };
// import publisher3 from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json" with { type: "json" };
import { Step } from "../../2_domain/Transformers.js";
import { json } from "sequelize";
import { TransformerTestSuite } from "./transformersTests_miroir.data.js";



// // ################################################################################################
// // export interface TransformerTestParams {
// // export class TransformerTestParams {
// export type TransformerTest = {
//   transformerTestType: "transformerTest";
//   transformerTestLabel: string;
//   // deploymentUuid: Uuid;
//   transformerName: string;
//   transformer: TransformerForBuild | TransformerForRuntime;
//   transformerParams: Record<string, any>;
//   transformerRuntimeContext?: Record<string, any>;
//   expectedValue: any;
//   ignoreAttributes?: string[];
// };
// export type TransformerTestSuite = 
//   TransformerTest
//  |
// {
//   transformerTestType: "transformerTestSuite";
//   transformerTestLabel: string;
//   transformerTests: Record<string, TransformerTestSuite>;
// }

// by default only queryFailure and failureMessage are compared when expectedValue is a Domain2ElementFailed
// export const ignoreFailureAttributes:string[] = [
//   "applicationSection",
//   "deploymentUuid",
//   "entityUuid",
//   "failureOrigin",
//   "instanceUuid",
//   "errorStack",
//   "innerError",
//   "queryContext",
//   "queryParameters",
//   "queryReference",
//   "query",
// ];


export const transformerTestSuite_spreadsheet: TransformerTestSuite = {
  transformerTestType: "transformerTestSuite",
  transformerTestLabel: "transformers",
  transformerTests: {
    inferSpreadsheetSchema: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "importSpreadsheet",
      transformerTests: {
        "inferSpreadsheetSchema allows to infer a schema from a spreadsheet step 1: infer jzod schema based on spreadsheet columns": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "inferSpreadsheetSchema allows to infer a schema from a spreadsheet step 1: infer jzod schema based on spreadsheet columns",
          transformerName: "inferSpreadsheetSchemaFromColumns",
          transformer: {
            transformerType: "dataflowObject",
            target: "schema",
            definition: {
              firstLine: {
                transformerType: "listPickElement",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "parameterReference",
                    referenceName: "spreadsheet",
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
                        value: { type: "string"},
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
              schema: {
                transformerType: "freeObjectTemplate",
                definition: {
                  type: {
                    transformerType: "constant",
                    value: "object",
                  },
                  definition: {
                    transformerType: "contextReference",
                    referencePath: ["mergedAttributeDefinitions"],
                  },
                },
              }
            }
          },
          transformerParams: {
            spreadsheet: [
              { "a": "iso3166-1Alpha-2", "b": "iso3166-1Alpha-3", c: "Name" },
              { "a": "US", "b": "USA", c: "United States" },
              { "a": "DE", "b": "DEU", c: "Germany" },
            ],
          },
          expectedValue: {
            type: "object",
            definition: {
              "iso3166-1Alpha-2": { type: "string" },
              "iso3166-1Alpha-3": { type: "string" },
              Name: { type: "string" },
            },
          },
        },
      },
    },
  },
};

