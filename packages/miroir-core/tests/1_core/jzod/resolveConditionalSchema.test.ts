import * as vitest from 'vitest';
import { describe, expect, it } from "vitest";

import entityBook from "../../../src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import adminConfigurationDeploymentLibrary from "../../../src/assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json";

import { EntityInstance } from "../../../src//0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { JzodElement } from "../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import entityDefinitionCountry from "../../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json";

import folio from "../../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import penguin from "../../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import springer from "../../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";
import author1 from "../../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "../../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "../../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import author4 from "../../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json";
import book1 from "../../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "../../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";
import book3 from "../../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json";
import book4 from "../../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import book5 from "../../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json";
import book6 from "../../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json";
// import test1 from "../../../src/assets/library_data/9ad64893-5f8f-4eaf-91aa-ffae110f88c8/150bacfd-06d0-4ecb-828d-f5275494448a.json";
import Country1 from "../../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/2eda1207-4dcc-4af9-a3ba-ef75e7f12c11.json";
import Country2 from "../../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/30b8e7c6-b75d-4db0-906f-fa81fa5c4cc0.json";
import Country3 from "../../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b62fc20b-dcf5-4e3b-a247-62d0475cf60f.json";
import Country4 from "../../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b6ddfb89-4301-48bf-9ed9-4ed6ee9261fe.json";

import publisher1 from "../../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import publisher2 from "../../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import publisher3 from "../../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";
// import { json } from "sequelize";
// import { transformerTestSuite_spreadsheet } from "./transformersTests_spreadsheet.data";
import { ignoreFailureAttributes, runTransformerTestInMemory, runTransformerTestSuite, TransformerTest, transformerTestsDisplayResults, TransformerTestSuite } from "../../../src/4_services/TestTools";
import { Step } from "../../../src/2_domain/TransformersForRuntime";



// import { adminConfigurationDeploymentLibrary } from "../../../dist/index.cjs";
import { DomainState } from "../../../src/0_interfaces/2_domain/DomainControllerInterface";
import { ReduxDeploymentsState } from "../../../src/0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { resolveConditionalSchema } from "../../../src/1_core/jzod/resolveConditionalSchema";
import { domainStateToReduxDeploymentsState } from "../../../src/tools";
import domainStateImport from "../../2_domain/domainState.json";



const domainState: DomainState = domainStateImport as DomainState;
const reduxDeploymentsState: ReduxDeploymentsState = domainStateToReduxDeploymentsState(domainState);

// describe("resolveConditionalSchema", () => {
//   const testObject = { a: { b: "test" }, c: { d: "book", e: entityBook.uuid } };
//   const libraryDeploymentUuid = adminConfigurationDeploymentLibrary.uuid;
//   const bookEntityUuid = entityBook.uuid;

//   // beforeEach(() => {
//   // });

//   it("returns the original schema if no conditionalMMLS tag is present", async () => {
//     const schema: JzodElement = { type: "string" };
//     const result = resolveConditionalSchema(schema, {}, [], undefined, undefined, "defaultValue");
//     expect(result).toBe(schema);
//   });

//   it("returns the original schema if conditionalMMLS tag is present but no parentUuid", async () => {
//     const schema: JzodElement = {
//       type: "string",
//       tag: { value: { conditionalMMLS: {} } }
//     };
//     const result = resolveConditionalSchema(schema, {}, [], undefined, undefined);
//     expect(result).toBe(schema);
//   });

//   it("returns error if reduxDeploymentsState is missing when parentUuid is present", async () => {
//     const testSchema: JzodElement = {
//       type: "object",
//       definition: {
//         a: {
//           type: "object",
//           definition: {
//             b: { type: "string" },
//           },
//         },
//         c: {
//           type: "object",
//           definition: {
//             d: {
//               type: "any",
//               tag: { value: { conditionalMMLS: { parentUuid: { path: bookEntityUuid } } } },
//             },
//           },
//         },
//       },
//     };
//     const result = resolveConditionalSchema(
//       (testSchema.definition.c as any).definition.d,
//       testObject,
//       ["c", "d"],
//       undefined, // reduxDeploymentsState,
//       libraryDeploymentUuid,
//       "defaultValue"
//     );

//     expect(result).toEqual({ error: 'NO_REDUX_DEPLOYMENTS_STATE' });
//   });

//   it("returns error if deploymentUuid is missing when parentUuid is present", async () => {
//     const testSchema: JzodElement = {
//       type: "object",
//       definition: {
//         a: {
//           type: "object",
//           definition: {
//             b: { type: "string" },
//           },
//         },
//         c: {
//           type: "object",
//           definition: {
//             d: {
//               type: "any",
//               tag: { value: { conditionalMMLS: { parentUuid: { path: bookEntityUuid } } } },
//             },
//           },
//         },
//       },
//     };
//     const result = resolveConditionalSchema(
//       (testSchema.definition.c as any).definition.d,
//       testObject,
//       ["c", "d"],
//       reduxDeploymentsState, // reduxDeploymentsState,
//       undefined,
//       "defaultValue"
//     );

//     expect(result).toEqual({ error: 'NO_DEPLOYMENT_UUID' });
//   });

//   it("returns error if no value found at given parentUuid path", async () => {
//     const testSchema: JzodElement = {
//       type: "object",
//       definition: {
//         a: {
//           type: "object",
//           definition: {
//             b: { type: "string" },
//           },
//         },
//         c: {
//           type: "object",
//           definition: {
//             d: {
//               type: "any",
//               tag: { value: { conditionalMMLS: { parentUuid: { path: "#.notExistingAttribute" } } } },
//             },
//           },
//         },
//       },
//     };
//     const result = resolveConditionalSchema(
//       (testSchema.definition.c as any).definition.d,
//       testObject,
//       ["c", "d"],
//       reduxDeploymentsState, // reduxDeploymentsState,
//       libraryDeploymentUuid,
//       "defaultValue"
//     );

//     console.log("result", JSON.stringify(result, null, 2));
//     expect(result).toEqual({
//       error: "INVALID_PARENT_UUID_CONFIG",
//       details:
//         'parentUuid resolution failed: {\n  "error": "PATH_SEGMENT_NOT_FOUND",\n  "segment": "notExistingAttribute",\n  "acc": {\n    "d": "book",\n    "e": "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"\n  }\n}',
//     });
//   });

//   // ##############################################################################################
//   it("resolves schema using legacy single path configuration", async () => {
//     const testSchema: JzodElement = {
//       type: "object",
//       definition: {
//         a: {
//           type: "object",
//           definition: {
//             b: { type: "string" },
//           },
//         },
//         c: {
//           type: "object",
//           definition: {
//             d: {
//               type: "any",
//               tag: { value: { conditionalMMLS: { parentUuid: { path: "#.e" } } } },
//             },
//             e: {
//               type: "string",
//             }
//           },
//         },
//       },
//     };
//     const result = resolveConditionalSchema(
//       (testSchema.definition.c as any).definition.d,
//       testObject,
//       ["c", "d"],
//       reduxDeploymentsState, // reduxDeploymentsState,
//       libraryDeploymentUuid,
//       "defaultValue"
//     );

//     expect(result).toEqual({
//       type: "object",
//       definition: {
//         uuid: {
//           type: "simpleType",
//           definition: "string",
//           validations: [
//             {
//               type: "uuid",
//             },
//           ],
//           tag: {
//             id: 1,
//             defaultLabel: "Uuid",
//             editable: false,
//           },
//         },
//         parentName: {
//           type: "simpleType",
//           definition: "string",
//           optional: true,
//           tag: {
//             id: 2,
//             defaultLabel: "Entity Name",
//             editable: false,
//           },
//         },
//         parentUuid: {
//           type: "simpleType",
//           definition: "string",
//           validations: [
//             {
//               type: "uuid",
//             },
//           ],
//           tag: {
//             id: 3,
//             defaultLabel: "Entity Uuid",
//             editable: false,
//           },
//         },
//         name: {
//           type: "simpleType",
//           definition: "string",
//           tag: {
//             id: 4,
//             defaultLabel: "Name",
//             editable: true,
//           },
//         },
//         author: {
//           type: "simpleType",
//           definition: "string",
//           validations: [
//             {
//               type: "uuid",
//             },
//           ],
//           optional: true,
//           tag: {
//             id: 5,
//             defaultLabel: "Author",
//             targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
//             editable: true,
//           },
//         },
//         publisher: {
//           type: "simpleType",
//           definition: "string",
//           validations: [
//             {
//               type: "uuid",
//             },
//           ],
//           optional: true,
//           tag: {
//             id: 5,
//             defaultLabel: "Publisher",
//             targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
//             editable: true,
//           },
//         },
//       },
//     });
//   });

//   // it("resolves schema using dual path configuration for defaultValue context", async () => {
//   //   const schema: JzodElement = {
//   //     type: "string",
//   //     tag: {
//   //       value: {
//   //         conditionalMMLS: {
//   //           parentUuid: {
//   //             defaultValuePath: "foo.bar",
//   //             typeCheckPath: "foo.baz"
//   //           }
//   //         }
//   //       }
//   //     }
//   //   };
//   //   const result = resolveConditionalSchema(
//   //     schema,
//   //     { foo: { bar: dummyParentUuid } },
//   //     ["foo", "bar"],
//   //     dummyReduxDeploymentsState,
//   //     dummyDeploymentUuid,
//   //     "defaultValue"
//   //   );
//   //   expect(result).toEqual(dummyEntityDefinition.jzodSchema);
//   // });

//   // it("resolves schema using dual path configuration for typeCheck context", async () => {
//   //   const schema: JzodElement = {
//   //     type: "string",
//   //     tag: {
//   //       value: {
//   //         conditionalMMLS: {
//   //           parentUuid: {
//   //             defaultValuePath: "foo.bar",
//   //             typeCheckPath: "foo.baz"
//   //           }
//   //         }
//   //       }
//   //     }
//   //   };
//   //   const result = resolveConditionalSchema(
//   //     schema,
//   //     { foo: { baz: dummyParentUuid } },
//   //     ["foo", "baz"],
//   //     dummyReduxDeploymentsState,
//   //     dummyDeploymentUuid,
//   //     "typeCheck"
//   //   );
//   //   expect(result).toEqual(dummyEntityDefinition.jzodSchema);
//   // });
// });

export const transformerTestSuite_resolveConditionalSchema: TransformerTestSuite = {
  transformerTestType: "transformerTestSuite",
  transformerTestLabel: "resolveConditionalSchema",
  transformerTests: {
    buildTransformerTests: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "resolveConditionalSchemaTransformerTests",
      transformerTests: {
        constants: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "resolveConditionalSchema",
          transformerTests: {
            resolveConditionalSchema: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "resolveConditionalSchema",
              transformerTests: {
                "returns the original schema if no conditionalMMLS tag is present": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "returns the original schema if no conditionalMMLS tag is present",
                  transformerName: "resolveConditionalSchema",
                  runTestStep: "build",
                  transformer: {
                    transformerType: "resolveConditionalSchema",
                    interpolation: "build",
                    schema: { type: "string" },
                    valueObject: "test",
                    context: "defaultValue",
                    valuePath: [],
                    // deploymentUuid: "dummyDeploymentUuid",
                  },
                  transformerParams: {},
                  expectedValue: { type: "string" },
                },
                // // TODO: this should return an error, both in the in-memory and in the database case
                // // when the parsing of the parameter fails, the transformer should return a QueryNotExecutable, but returns the stringified value of the parameter instead
                // "failed constantArray build transformer for non-array value": {
                //   transformerTestType: "transformerTest",
                //   transformerTestLabel: "failed constantArray build transformer for non-array value",
                //   transformerName: "constantArrayAtBuildFailed",
                //   runTestStep: "build",
                //   transformer: {
                //     transformerType: "constantArray",
                //     interpolation: "build",
                //     value: "{]" as any,
                //   },
                //   transformerParams: {},
                //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                //   expectedValue: "{]",
                // },
              },
            },
            // constantUuid: {
            //   transformerTestType: "transformerTestSuite",
            //   transformerTestLabel: "constantArray",
            //   transformerTests: {
            //     "resolve basic build transformer constantUuid": {
            //       transformerTestType: "transformerTest",
            //       transformerTestLabel: "resolve basic build transformer constantUuid",
            //       transformerName: "constantUuid",
            //       runTestStep: "build",
            //       transformer: {
            //         transformerType: "constantUuid",
            //         interpolation: "build",
            //         value: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            //       },
            //       transformerParams: {},
            //       expectedValue: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            //     },
            //     "failed constantUuid transformer for non-uuid value": {
            //       transformerTestType: "transformerTest",
            //       transformerTestLabel: "failed constantUuid transformer for non-uuid value",
            //       transformerName: "constantUuidFailed",
            //       runTestStep: "build",
            //       transformer: {
            //         transformerType: "constantUuid",
            //         interpolation: "build",
            //         value: "test" as any,
            //       },
            //       transformerParams: {},
            //       ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
            //       expectedValue: "test",
            //     },
            //   },
            // },
            // constantNumber: {
            //   transformerTestType: "transformerTestSuite",
            //   transformerTestLabel: "constantNumber",
            //   transformerTests: {
            //     "resolve basic build transformer constantNumber": {
            //       transformerTestType: "transformerTest",
            //       transformerTestLabel: "resolve basic build transformer constantNumber",
            //       transformerName: "constantNumber",
            //       runTestStep: "build",
            //       transformer: {
            //         transformerType: "constantNumber",
            //         interpolation: "build",
            //         value: 42,
            //       },
            //       transformerParams: {},
            //       expectedValue: 42,
            //     },
            //     // TODO: REMOVE?
            //     // "failed constantNumber transformer for non-number value": {
            //     //   transformerTestType: "transformerTest",
            //     //   transformerTestLabel: "failed constantNumber transformer for non-number value",
            //     //   transformerName: "constantNumberFailed",
            //     //   runTestStep: "build",
            //     //   transformer: {
            //     //     transformerType: "constantNumber",
            //     //     interpolation: "build",
            //     //     value: "test" as any, // DOES NOT MAKE ANY SENSE, THIS SHALL BE HANDLED AT THE PARSER/TYPE-CHECKER LEVEL
            //     //   },
            //     //   transformerParams: {},
            //     //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
            //     //   expectedValue: {
            //     //     queryFailure: "QueryNotExecutable",
            //     //   },
            //     // },
            //   },
            // },
            // constantBigint: {
            //   transformerTestType: "transformerTestSuite",
            //   transformerTestLabel: "constantBigint",
            //   transformerTests: {
            //     "resolve basic build transformer constantBigint": {
            //       transformerTestType: "transformerTest",
            //       transformerTestLabel: "resolve basic build transformer constantBigint",
            //       transformerName: "constantBigint",
            //       runTestStep: "build",
            //       transformer: {
            //         transformerType: "constantBigint",
            //         interpolation: "build",
            //         value: 42n, // TODO: ensure actual value is bigint, not number
            //       },
            //       transformerParams: {},
            //       expectedValue: 42n,
            //     },
            //     // TODO: REMOVE? This makes no sense, the type-checker should handle this
            //     // "failed constantBigint transformer for non-bigint value": {
            //     //   transformerTestType: "transformerTest",
            //     //   transformerTestLabel: "failed constantBigint transformer for non-bigint value",
            //     //   transformerName: "constantBigintFailed",
            //     //   runTestStep: "build",
            //     //   transformer: {
            //     //     transformerType: "constantBigint",
            //     //     interpolation: "build",
            //     //     value: "test" as any,
            //     //   },
            //     //   transformerParams: {},
            //     //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
            //     //   expectedValue: {
            //     //     queryFailure: "QueryNotExecutable",
            //     //   },
            //     // },
            //   },
            // },
            // constantString: {
            //   transformerTestType: "transformerTestSuite",
            //   transformerTestLabel: "constantString",
            //   transformerTests: {
            //     "resolve basic build transformer constantString": {
            //       transformerTestType: "transformerTest",
            //       transformerTestLabel: "resolve basic build transformer constantString",
            //       transformerName: "constantString",
            //       runTestStep: "build",
            //       transformer: {
            //         transformerType: "constantString",
            //         interpolation: "build",
            //         value: "test",
            //       },
            //       transformerParams: {},
            //       expectedValue: "test",
            //     },
            //     // REMOVE? This makes no sense, the type-checker should handle this
            //     // "constantString build transformer for non-string value": {
            //     //   transformerTestType: "transformerTest",
            //     //   transformerTestLabel: "constantString build transformer for non-string value",
            //     //   transformerName: "constantStringFailed",
            //     //   runTestStep: "build",
            //     //   transformer: {
            //     //     transformerType: "constantString",
            //     //     interpolation: "build",
            //     //     value: { test: "objectInsteadOfString" } as any,
            //     //   },
            //     //   transformerParams: {},
            //     //   expectedValue:  "{\"test\":\"objectInsteadOfString\"}",
            //     // },
            //   },
            // },
            // constantObject: {
            //   transformerTestType: "transformerTestSuite",
            //   transformerTestLabel: "constantObject",
            //   transformerTests: {
            //     "resolve basic build transformer constantObject before runtime": {
            //       transformerTestType: "transformerTest",
            //       transformerTestLabel: "resolve basic build transformer constantObject before runtime",
            //       transformerName: "constantObjectBeforeRuntime",
            //       runTestStep: "build",
            //       transformer: {
            //         transformerType: "constantObject",
            //         interpolation: "build",
            //         value: { test: "test" },
            //       },
            //       transformerParams: {},
            //       expectedValue: { test: "test" },
            //     },
            //     // TODO: in postgres, conversion to ::jsonb succeeds for string input, it does not require to be an object
            //     // "failed constantObject transformer for non-object value before runtime": {
            //     //   transformerTestType: "transformerTest",
            //     //   transformerTestLabel: "failed constantObject transformer for non-object value before runtime",
            //     //   transformerName: "constantObjectFailedBeforeRuntime",
            //     //   runTestStep: "build",
            //     //   transformer: {
            //     //     transformerType: "constantObject",
            //     //     interpolation: "build",
            //     //     value: "{)" as any,
            //     //   },
            //     //   transformerParams: {},
            //     //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
            //     //   expectedValue: {
            //     //     queryFailure: "QueryNotExecutable",
            //     //   },
            //     // },
            //   }
            // },
            // constantBoolean: {
            //   transformerTestType: "transformerTestSuite",
            //   transformerTestLabel: "constantBoolean",
            //   transformerTests: {
            //     "resolve basic build transformer constantBoolean": {
            //       transformerTestType: "transformerTest",
            //       transformerTestLabel: "resolve basic build transformer constantBoolean",
            //       transformerName: "constantBoolean",
            //       runTestStep: "build",
            //       transformer: {
            //         transformerType: "constantBoolean",
            //         interpolation: "build",
            //         value: true,
            //       },
            //       transformerParams: {},
            //       expectedValue: true,
            //     },
            //     // "failed constantBoolean transformer for non-boolean value": {
            //     //   transformerTestType: "transformerTest",
            //     //   transformerTestLabel: "failed constantBoolean transformer for non-boolean value",
            //     //   transformerName: "constantBooleanFailed",
            //     //   runTestStep: "build",
            //     //   transformer: {
            //     //     transformerType: "constantBoolean",
            //     //     interpolation: "build",
            //     //     value: "test" as any,
            //     //   },
            //     //   transformerParams: {},
            //     //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
            //     //   expectedValue: {
            //     //     queryFailure: "QueryNotExecutable",
            //     //   },
            //     // }
            //   }
            // }
          },
        },
      }
    },
  }
};

const RUN_TEST= process.env.RUN_TEST
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST", RUN_TEST);

afterAll(async () => {
  if (RUN_TEST) {
    transformerTestsDisplayResults(transformerTestSuite_resolveConditionalSchema, RUN_TEST, transformerTestSuite_resolveConditionalSchema.transformerTestLabel);
  }
});

// ################################################################################################
// const testSuiteName = "transformers.unit.test";
if (RUN_TEST == transformerTestSuite_resolveConditionalSchema.transformerTestLabel) {
  await runTransformerTestSuite(vitest, [], transformerTestSuite_resolveConditionalSchema, runTransformerTestInMemory);
} else {
  console.log("################################ skipping test suite:", transformerTestSuite_resolveConditionalSchema.transformerTestLabel);
}
