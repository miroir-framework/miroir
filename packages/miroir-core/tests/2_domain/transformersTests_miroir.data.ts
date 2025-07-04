import { EntityInstance, JzodElement } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import entityDefinitionCountry from "../../src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json" with { type: "json" };

import folio from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json" with { type: "json" };
import penguin from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json" with { type: "json" };
import springer from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json" with { type: "json" };
import author1 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json" with { type: "json" };
import author2 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json" with { type: "json" };
import author3 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json" with { type: "json" };
import author4 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json" with { type: "json" };
import book1 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json" with { type: "json" };
import book2 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json" with { type: "json" };
import book3 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json" with { type: "json" };
import book4 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json" with { type: "json" };
import book5 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json" with { type: "json" };
import book6 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json" with { type: "json" };
// import test1 from "../../src/assets/library_data/9ad64893-5f8f-4eaf-91aa-ffae110f88c8/150bacfd-06d0-4ecb-828d-f5275494448a.json" with { type: "json" };
import Country1 from "../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/2eda1207-4dcc-4af9-a3ba-ef75e7f12c11.json" with { type: "json" };
import Country2 from "../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/30b8e7c6-b75d-4db0-906f-fa81fa5c4cc0.json" with { type: "json" };
import Country3 from "../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b62fc20b-dcf5-4e3b-a247-62d0475cf60f.json" with { type: "json" };
import Country4 from "../../src/assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b6ddfb89-4301-48bf-9ed9-4ed6ee9261fe.json" with { type: "json" };

import publisher1 from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json" with { type: "json" };
import publisher2 from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json" with { type: "json" };
import publisher3 from "../../src/assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json" with { type: "json" };
import { Step } from "../../src/2_domain/TransformersForRuntime";
import { json } from "sequelize";
import { transformerTestSuite_spreadsheet } from "./transformersTests_spreadsheet.data";
import { ignoreFailureAttributes, TransformerTest, TransformerTestSuite } from "../../src/4_services/TestTools";



const fileData:any[] = [
  {a: "A", b: "B"},
  {a: "1", b: "2"},
  {a: "3", b: "4"},
];

/**
 * TODO:
 * - test for fullObjectTemplate that has a non-string key
 */
export const transformerTestSuite_miroirTransformers: TransformerTestSuite = {
  transformerTestType: "transformerTestSuite",
  transformerTestLabel: "transformers",
  transformerTests: {
    buildTransformerTests: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "buildTransformerTests",
      transformerTests: {
        constants: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "constants",
          transformerTests: {
            constantArray: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantArray",
              transformerTests: {
                "resolve basic build transformer constantArray": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic build transformer constantArray",
                  transformerName: "constantArrayAtBuild",
                  runTestStep: "build",
                  transformer: {
                    transformerType: "constantArray",
                    interpolation: "build",
                    value: ["testA", "testB"],
                  },
                  transformerParams: {},
                  expectedValue: ["testA", "testB"],
                },
                // // TODO: this should return an error, both in the in-memory and in the database case
                // // when the parsing of the parameter fails, the transformer should return a QueryNotExecutable, but returns the stringified value of the parameter instead
                "failed constantArray build transformer for non-array value": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "failed constantArray build transformer for non-array value",
                  transformerName: "constantArrayAtBuildFailed",
                  runTestStep: "build",
                  transformer: {
                    transformerType: "constantArray",
                    interpolation: "build",
                    value: "{]" as any,
                  },
                  transformerParams: {},
                  ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                  expectedValue: "{]",
                },
              },
            },
            constantUuid: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantArray",
              transformerTests: {
                "resolve basic build transformer constantUuid": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic build transformer constantUuid",
                  transformerName: "constantUuid",
                  runTestStep: "build",
                  transformer: {
                    transformerType: "constantUuid",
                    interpolation: "build",
                    value: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                  },
                  transformerParams: {},
                  expectedValue: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                },
                "failed constantUuid transformer for non-uuid value": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "failed constantUuid transformer for non-uuid value",
                  transformerName: "constantUuidFailed",
                  runTestStep: "build",
                  transformer: {
                    transformerType: "constantUuid",
                    interpolation: "build",
                    value: "test" as any,
                  },
                  transformerParams: {},
                  ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                  expectedValue: "test",
                },
              },
            },
            constantNumber: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantNumber",
              transformerTests: {
                "resolve basic build transformer constantNumber": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic build transformer constantNumber",
                  transformerName: "constantNumber",
                  runTestStep: "build",
                  transformer: {
                    transformerType: "constantNumber",
                    interpolation: "build",
                    value: 42,
                  },
                  transformerParams: {},
                  expectedValue: 42,
                },
                // TODO: REMOVE?
                // "failed constantNumber transformer for non-number value": {
                //   transformerTestType: "transformerTest",
                //   transformerTestLabel: "failed constantNumber transformer for non-number value",
                //   transformerName: "constantNumberFailed",
                //   runTestStep: "build",
                //   transformer: {
                //     transformerType: "constantNumber",
                //     interpolation: "build",
                //     value: "test" as any, // DOES NOT MAKE ANY SENSE, THIS SHALL BE HANDLED AT THE PARSER/TYPE-CHECKER LEVEL
                //   },
                //   transformerParams: {},
                //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                //   expectedValue: {
                //     queryFailure: "QueryNotExecutable",
                //   },
                // },
              },
            },
            constantBigint: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantBigint",
              transformerTests: {
                "resolve basic build transformer constantBigint": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic build transformer constantBigint",
                  transformerName: "constantBigint",
                  runTestStep: "build",
                  transformer: {
                    transformerType: "constantBigint",
                    interpolation: "build",
                    value: 42n, // TODO: ensure actual value is bigint, not number
                  },
                  transformerParams: {},
                  expectedValue: 42n,
                },
                // TODO: REMOVE? This makes no sense, the type-checker should handle this
                // "failed constantBigint transformer for non-bigint value": {
                //   transformerTestType: "transformerTest",
                //   transformerTestLabel: "failed constantBigint transformer for non-bigint value",
                //   transformerName: "constantBigintFailed",
                //   runTestStep: "build",
                //   transformer: {
                //     transformerType: "constantBigint",
                //     interpolation: "build",
                //     value: "test" as any,
                //   },
                //   transformerParams: {},
                //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                //   expectedValue: {
                //     queryFailure: "QueryNotExecutable",
                //   },
                // },
              },
            },
            constantString: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantString",
              transformerTests: {
                "resolve basic build transformer constantString": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic build transformer constantString",
                  transformerName: "constantString",
                  runTestStep: "build",
                  transformer: {
                    transformerType: "constantString",
                    interpolation: "build",
                    value: "test",
                  },
                  transformerParams: {},
                  expectedValue: "test",
                },
                // REMOVE? This makes no sense, the type-checker should handle this
                // "constantString build transformer for non-string value": {
                //   transformerTestType: "transformerTest",
                //   transformerTestLabel: "constantString build transformer for non-string value",
                //   transformerName: "constantStringFailed",
                //   runTestStep: "build",
                //   transformer: {
                //     transformerType: "constantString",
                //     interpolation: "build",
                //     value: { test: "objectInsteadOfString" } as any,
                //   },
                //   transformerParams: {},
                //   expectedValue:  "{\"test\":\"objectInsteadOfString\"}",
                // },
              },
            },
            constantObject: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantObject",
              transformerTests: {
                "resolve basic build transformer constantObject before runtime": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic build transformer constantObject before runtime",
                  transformerName: "constantObjectBeforeRuntime",
                  runTestStep: "build",
                  transformer: {
                    transformerType: "constantObject",
                    interpolation: "build",
                    value: { test: "test" },
                  },
                  transformerParams: {},
                  expectedValue: { test: "test" },
                },
                // TODO: in postgres, conversion to ::jsonb succeeds for string input, it does not require to be an object
                // "failed constantObject transformer for non-object value before runtime": {
                //   transformerTestType: "transformerTest",
                //   transformerTestLabel: "failed constantObject transformer for non-object value before runtime",
                //   transformerName: "constantObjectFailedBeforeRuntime",
                //   runTestStep: "build",
                //   transformer: {
                //     transformerType: "constantObject",
                //     interpolation: "build",
                //     value: "{)" as any,
                //   },
                //   transformerParams: {},
                //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                //   expectedValue: {
                //     queryFailure: "QueryNotExecutable",
                //   },
                // },
              }
            },
            constantBoolean: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantBoolean",
              transformerTests: {
                "resolve basic build transformer constantBoolean": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic build transformer constantBoolean",
                  transformerName: "constantBoolean",
                  runTestStep: "build",
                  transformer: {
                    transformerType: "constantBoolean",
                    interpolation: "build",
                    value: true,
                  },
                  transformerParams: {},
                  expectedValue: true,
                },
                // "failed constantBoolean transformer for non-boolean value": {
                //   transformerTestType: "transformerTest",
                //   transformerTestLabel: "failed constantBoolean transformer for non-boolean value",
                //   transformerName: "constantBooleanFailed",
                //   runTestStep: "build",
                //   transformer: {
                //     transformerType: "constantBoolean",
                //     interpolation: "build",
                //     value: "test" as any,
                //   },
                //   transformerParams: {},
                //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                //   expectedValue: {
                //     queryFailure: "QueryNotExecutable",
                //   },
                // }
              }
            }
          },
        },
        references: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "references",
          transformerTests: {
            "resolve basic build transformer parameterReference": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "resolve basic build transformer parameterReference",
              transformerName: "parameterReference",
              runTestStep: "build",
              transformer: {
                transformerType: "parameterReference",
                interpolation: "build",
                referenceName: "fileData",
              },
              transformerParams: { fileData },
              expectedValue: fileData,
            },
            // NO contextReference in build transformers!
            // "resolve basic build transformer contextReference": {
            //   transformerTestType: "transformerTest",
            //   transformerTestLabel: "resolve basic build transformer contextReference",
            //   transformerName: "contextReference",
            //   runTestStep: "build",
            //   transformer: {
            //     transformerType: "contextReference",
            //     interpolation: "build",
            //     referencePath: ["fileData"],
            //   },
            //   transformerParams: { fileData },
            //   expectedValue: {
            //     transformerType: "constant",
            //     value: fileData,
            //   },
            // }
          }
        },
        mustache: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "mustache",
          transformerTests: {
            "mustache string template": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "mustache string template",
              transformerName: "mustache",
              runTestStep: "build",
              transformer: {
                transformerType: "mustacheStringTemplate",
                interpolation: "build",
                definition: "a{{newApplication.name}}_{{newApplication.suffix}} example",
              },
              transformerParams: {
                newApplication: { name: "Test", suffix: "Z" },
              },
              expectedValue: "aTest_Z example",
            },
            "failed mustache string template": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "failed mustache string template",
              transformerName: "mustacheStringTemplateFailed",
              runTestStep: "build",
              transformer: {
                transformerType: "mustacheStringTemplate",
                interpolation: "build",
                definition: "{{newApplicationName}SelfApplication",
              },
              transformerParams: {},
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
          },
        },
        simpleCompositions: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "simpleCompositions",
          transformerTests: {
            "resolve basic build transformer count on parameter array": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "resolve basic build transformer count on parameter array",
              transformerName: "buildCountElementsOfParameterArray",
              runTestStep: "build",
              transformer: {
                transformerType: "count",
                interpolation: "build",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "fileData",
                  },
                }
              },
              transformerParams: { fileData: [ "a", "b", "c" ] },
              expectedValue: [ { count: 3 }],
            },
            "resolve basic runtime transformer count on build-resolved parameter array": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "resolve basic runtime transformer count on build-resolved parameter array",
              transformerName: "runtimeCountElementsOfBuildParameterArray",
              runTestStep: "build",
              transformer: {
                transformerType: "count",
                interpolation: "build",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referenceName: "smallStringArray",
                  },
                }
              },
              transformerParams: { smallStringArray: [ "a", "b", "c" ] },
              expectedValue: [{
                "count": 3,
              }],
            },
          },
        }
      }
    },
    runtimeTransformerTests: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "runtimeTransformerTests",
      transformerTests: {
        constants: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "constants",
          transformerTests: {
            constantArray: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantArray",
              transformerTests: {
                "resolve basic runtime transformer constantArray": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic runtime transformer constantArray",
                  transformerName: "constantArrayAtRuntime",
                  transformer: {
                    transformerType: "constantArray",
                    interpolation: "runtime",
                    value: ["testA", "testB"],
                  },
                  transformerParams: {},
                  expectedValue: ["testA", "testB"],
                },
                // // TODO: this should return an error, both in the in-memory and in the database case
                // // when the parsing of the parameter fails, the transformer should return a QueryNotExecutable, but returns the stringified value of the parameter instead
                // "failed constantArray runtime transformer for non-array value": {
                //   transformerTestType: "transformerTest",
                //   transformerTestLabel: "failed constantArray runtime transformer for non-array value",
                //   transformerName: "constantArrayAtRuntimeFailed",
                //   transformer: {
                //     transformerType: "constantArray",
                //     // interpolation: "runtime",
                //     value: "{]" as any,
                //   },
                //   transformerParams: {},
                //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                //   expectedValue: "{]",
                // },
              },
            },
            constantUuid: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantUuid",
              transformerTests: {
                "resolve basic transformer constantUuid": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer constantUuid",
                  transformerName: "constantUuid",
                  transformer: {
                    transformerType: "constantUuid",
                    interpolation: "runtime",
                    value: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                  },
                  transformerParams: {},
                  expectedValue: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                },
                // TODO: does this make any sense?
                // "should fail when context reference is not found": {
                //   transformerTestType: "transformerTest",
                //   transformerTestLabel: "should fail when context reference is not found",
                //   transformerName: "constantUuid",
                //   transformer: {
                //     transformerType: "contextReference",
                //     interpolation: "runtime",
                //     referenceName: "nonExistentReference",
                //   },
                //   transformerParams: {},
                //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                //   expectedValue: {
                //     queryFailure: "QueryNotExecutable",
                //   },
                // },
              },
            },
            constantNumber: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantNumber",
              transformerTests: {
                "resolve basic transformer constantNumber": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer constantNumber",
                  transformerName: "constantNumber",
                  transformer: {
                    transformerType: "constantNumber",
                    interpolation: "runtime",
                    value: 42,
                  },
                  transformerParams: {},
                  expectedValue: 42,
                },
                // "failed constantNumber transformer for non-number value": {
                //   transformerTestType: "transformerTest",
                //   transformerTestLabel: "failed constantNumber transformer for non-number value",
                //   transformerName: "constantNumberFailed",
                //   transformer: {
                //     transformerType: "constantNumber",
                //     // interpolation: "runtime",
                //     value: "test" as any,
                //   },
                //   transformerParams: {},
                //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                //   expectedValue: {
                //     queryFailure: "QueryNotExecutable",
                //   },
                // },
              },
            },
            // TODO: runtime transformer for bigint returns a number, not a bigint (issue correctly handle bigint at postgres-level #48)
            // constantBigint: {
            //   transformerTestType: "transformerTestSuite",
            //   transformerTestLabel: "constantBigint",
            //   transformerTests: {
            //     "resolve basic transformer constantBigint": {
            //       transformerTestType: "transformerTest",
            //       transformerTestLabel: "resolve basic transformer constantBigint",
            //       transformerName: "constantBigint",
            //       transformer: {
            //         transformerType: "constantBigint",
            //         interpolation: "runtime",
            //         // value: 42n,
            //         value: 42n, // TODO: ensure actual value is bigint, not number
            //       },
            //       transformerParams: {},
            //       expectedValue: 42n,
            //     },
            //     // "failed constantBigint transformer for non-bigint value": {
            //     //   transformerTestType: "transformerTest",
            //     //   transformerTestLabel: "failed constantBigint transformer for non-bigint value",
            //     //   transformerName: "constantBigintFailed",
            //     //   transformer: {
            //     //     transformerType: "constantBigint",
            //     //     // interpolation: "runtime",
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
            constantString: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantString",
              transformerTests: {
                "resolve basic transformer constantString": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer constantString",
                  transformerName: "constantString",
                  transformer: {
                    transformerType: "constantString",
                    interpolation: "runtime",
                    value: "test",
                  },
                  transformerParams: {},
                  expectedValue: "test",
                },
                // "constantString transformer for non-string value": {
                //   transformerTestType: "transformerTest",
                //   transformerTestLabel: "failed constantString transformer for non-string value",
                //   transformerName: "constantStringFailed",
                //   transformer: {
                //     transformerType: "constantString",
                //     // interpolation: "runtime",
                //     value: { test: "objectInsteadOfString" } as any,
                //   },
                //   transformerParams: {},
                //   expectedValue: '{"test":"objectInsteadOfString"}',
                // },
              },
            },
            constantObject: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantObject",
              transformerTests: {
                "resolve basic transformer constantObject before runtime": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer constantObject before runtime",
                  transformerName: "constantObjectBeforeRuntime",
                  transformer: {
                    transformerType: "constantObject",
                    interpolation: "runtime",
                    value: { test: "test" },
                  },
                  transformerParams: {},
                  expectedValue: { test: "test" },
                },
                "resolve basic transformer constantObject at runtime": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer constantObject at runtime",
                  transformerName: "constantObjectAtRuntime",
                  transformer: {
                    transformerType: "constantObject",
                    interpolation: "runtime",
                    value: { test: "test" },
                  },
                  transformerParams: {},
                  expectedValue: { test: "test" },
                },
                // TODO: in postgres, conversion to ::jsonb succeeds for string input, it does not require to be an object
                // // "failed constantObject transformer for non-object value before runtime": {
                // //   transformerTestType: "transformerTest",
                // //   transformerTestLabel: "failed constantObject transformer for non-object value before runtime",
                // //   transformerName: "constantObjectFailedBeforeRuntime",
                // //   transformer: {
                // //     transformerType: "constantObject",
                // //     interpolation: "runtime",
                // //     value: "test" as any,
                // //   },
                // //   transformerParams: {},
                // //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                // //   expectedValue: {
                // //     queryFailure: "QueryNotExecutable",
                // //   },
                // // }
              },
            },
            constantBoolean: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantBoolean",
              transformerTests: {
                "resolve basic transformer constantBoolean": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer constantBoolean",
                  transformerName: "constantBoolean",
                  transformer: {
                    transformerType: "constantBoolean",
                    interpolation: "runtime",
                    value: true,
                  },
                  transformerParams: {},
                  expectedValue: true,
                },
                // "failed constantBoolean transformer for non-boolean value": {
                //   transformerTestType: "transformerTest",
                //   transformerTestLabel: "failed constantBoolean transformer for non-boolean value",
                //   transformerName: "constantBooleanFailed",
                //   transformer: {
                //     transformerType: "constantBoolean",
                //     // interpolation: "runtime",
                //     value: "test" as any,
                //   },
                //   transformerParams: {},
                //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                //   expectedValue: {
                //     queryFailure: "QueryNotExecutable",
                //   },
                // },
              },
            },
            constantAsExtractor: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "constantAsExtractor",
              transformerTests: {
                "resolve basic transformer constantAsExtractor for simple object": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer constantAsExtractor for simple object",
                  transformerName: "constantAsExtractor",
                  transformer: {
                    transformerType: "constantAsExtractor",
                    interpolation: "runtime",
                    valueJzodSchema: {
                      type: "object",
                      definition: {
                        test: { type: "string" },
                      },
                    },
                    value: { test: "a" },
                  },
                  transformerParams: {},
                  expectedValue: { test: "a" }, // should an extractor always be a table (that is a list of rows)?
                },
                "resolve basic transformer constantAsExtractor for Country object": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer constantAsExtractor for Country object",
                  transformerName: "constantAsExtractor",
                  transformer: {
                    transformerType: "constantAsExtractor",
                    interpolation: "runtime",
                    valueJzodSchema: entityDefinitionCountry.jzodSchema as JzodElement,
                    value: Country1 as EntityInstance,
                  },
                  transformerParams: {},
                  ignoreAttributes: ["conceptLevel", "icon"],
                  expectedValue: Country1, // should an extractor always be a table (that is a list of rows)?
                },
                "resolve basic transformer constantAsExtractor for array of simple objects": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer constantAsExtractor for array of simple objects",
                  transformerName: "constantAsExtractor",
                  transformer: {
                    transformerType: "constantAsExtractor",
                    interpolation: "runtime",
                    valueJzodSchema: {
                      type: "array",
                      definition: {
                        type: "object",
                        definition: {
                          test: { type: "string" },
                        },
                      },
                    },
                    value: [{ test: "a" }, { test: "b" }],
                  },
                  transformerParams: {},
                  expectedValue: [{ test: "a" }, { test: "b" }], // an extractor is always a table (that is a list of rows)
                },
                // // TODO: constantAsExtractor should fail when the value does not follow the given jzod schema
                // // "failed constantAsExtractor transformer for 'never' value": {
                // //   transformerTestType: "transformerTest",
                // //   transformerTestLabel: "failed constantAsExtractor transformer for 'never' value",
                // //   transformerName: "constantAsExtractorFailed",
                // //   transformer: {
                // //     transformerType: "constantAsExtractor",
                // //     interpolation: "runtime",
                // //     valueJzodSchema: { type: "never" },
                // //     value: { test: "objectInsteadOfString" } as any,
                // //   },
                // //   transformerParams: {},
                // //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                // //   expectedValue: {
                // //     queryFailure: "QueryNotExecutable",
                // //   },
                // // },
              },
            },
          },
        },
        references: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "references",
          transformerTests: {
            parameterReference: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "parameterReference",
              transformerTests: {
                "resolve basic transformer parameterReference": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer parameterReference",
                  transformerName: "parameterReference",
                  transformer: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    // interpolation: "runtime",
                    referenceName: "a",
                  },
                  transformerParams: {
                    a: "test",
                  },
                  expectedValue: "test",
                },
                "resolve basic transformer parameterReference for referencePath": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer parameterReference for referencePath",
                  transformerName: "parameterReferenceForReferencePath",
                  transformer: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referencePath: ["a", "b", "c"],
                  },
                  transformerParams: {
                    a: { b: { c: "test" } },
                  },
                  expectedValue: "test",
                },
                "should fail when parameter referenceName is not found": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "should fail when parameter referenceName is not found",
                  transformerName: "parameterReference",
                  transformer: {
                    transformerType: "parameterReference",
                    // interpolation: "runtime",
                    interpolation: "build",
                    referenceName: "nonExistentReference",
                  },
                  transformerParams: {},
                  ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                  expectedValue: {
                    queryFailure: "QueryNotExecutable",
                  },
                },
                "should fail when parameter referencePath is invalid": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "should fail when parameter referencePath is invalid",
                  transformerName: "parameterReference",
                  transformer: {
                    transformerType: "parameterReference",
                    interpolation: "build",
                    referencePath: ["invalidPath"],
                  },
                  transformerParams: {
                    a: "test",
                  },
                  ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                  expectedValue: {
                    queryFailure: "QueryNotExecutable",
                    // queryFailure: "FailedExtractor",
                  },
                },
              },
            },
            contextReference: {
              transformerTestType: "transformerTestSuite",
              transformerTestLabel: "contextReference",
              transformerTests: {
                "resolve basic transformer contextReference for referenceName": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer contextReference for referenceName",
                  transformerName: "contextReferenceForReferenceName",
                  transformer: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "a",
                  },
                  transformerParams: {},
                  transformerRuntimeContext: {
                    a: "test",
                  },
                  expectedValue: "test",
                },
                "resolve basic transformer contextReference for referencePath": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "resolve basic transformer contextReference for referencePath",
                  transformerName: "contextReferenceForReferencePath",
                  transformer: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referencePath: ["a", "b", "c"],
                  },
                  transformerParams: {},
                  transformerRuntimeContext: {
                    a: { b: { c: "test" } },
                  },
                  expectedValue: "test",
                },
                "should fail when context referenceName is not found": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "should fail when context referenceName is not found",
                  transformerName: "contextReference",
                  transformer: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "nonExistentReference",
                  },
                  transformerParams: {},
                  ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                  expectedValue: {
                    queryFailure: "QueryNotExecutable",
                    // queryFailure: "ReferenceNotFound",
                    // queryFailure: "FailedExtractor",
                  },
                },
                "should fail when context referencePath is invalid": {
                  transformerTestType: "transformerTest",
                  transformerTestLabel: "should fail when context referencePath is invalid",
                  transformerName: "contextReference",
                  transformer: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referencePath: ["a", "invalidPath"],
                  },
                  transformerParams: {},
                  transformerRuntimeContext: {
                    // a: "test", // if root element is not an object this is the simpler case.
                    a: { b: "test"},
                  },
                  ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
                  expectedValue: {"queryFailure": "QueryNotExecutable"},
                  // expectedValue: {"queryFailure": "FailedTransformer_contextReference"},
                },
              },
            },
          },
        },
        objectEntries: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "objectEntries",
          transformerTests: {
            "objectEntries used on constant object before runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "objectEntries used on constant object before runtime",
              transformerName: "objectEntries",
              transformer: {
                transformerType: "objectEntries",
                interpolation: "runtime",
                applyTo: { a: "testA", b: "testB" },
              },
              transformerParams: {},
              expectedValue: [
                ["a", "testA"],
                ["b", "testB"],
              ],
            },
            "objectEntries used on reference before runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "objectEntries used before runtime",
              transformerName: "objectEntries",
              transformer: {
                transformerType: "objectEntries",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "parameterReference",
                    referenceName: "testObject1",
                  },
                },
              },
              transformerParams: {
                testObject1: { a: "testA", b: "testB" },
              },
              expectedValue: [
                ["a", "testA"],
                ["b", "testB"],
              ],
            },
            "objectEntries used on reference at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "objectEntries used on reference at runtime",
              transformerName: "objectEntries",
              transformer: {
                transformerType: "objectEntries",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "testObject1",
                  },
                },
              },
              transformerParams: {},
              transformerRuntimeContext: {
                testObject1: { a: "testA", b: "testB" },
              },
              expectedValue: [
                ["a", "testA"],
                ["b", "testB"],
              ],
            },
            "failed object entries for string parameter": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "failed object entries for string parameter",
              transformerName: "objectEntriesFailed",
              transformer: {
                transformerType: "objectEntries",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "constant",
                    interpolation: "runtime",
                    value: "nonExistingTestObject",
                  },
                },
              },
              transformerParams: {},
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
          },
        },
        objectValues: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "objectValues",
          transformerTests: {
            "objectValues on constant object at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "objectValues on constant object at runtime",
              transformerName: "objectValuesBeforeRuntime",
              transformer: {
                transformerType: "objectValues",
                interpolation: "runtime",
                applyTo: { a: "testA", b: "testB" },
              },
              transformerParams: {
                testObject: { a: "testA", b: "testB" },
              },
              expectedValue: ["testA", "testB"],
            },
            "objectValues on reference before runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "object values with reference before runtime",
              transformerName: "objectValuesBeforeRuntime",
              transformer: {
                transformerType: "objectValues",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "parameterReference",
                    interpolation: "runtime",
                    referenceName: "testObject",
                  },
                },
              },
              transformerParams: {
                testObject: { a: "testA", b: "testB" },
              },
              expectedValue: ["testA", "testB"],
            },
            "objectValues on reference at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "objectValues with reference at runtime",
              transformerName: "objectValuesAtRuntime",
              transformer: {
                transformerType: "objectValues",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "testObject",
                  },
                },
              },
              transformerParams: {},
              transformerRuntimeContext: {
                testObject: { a: "testA", b: "testB" },
              },
              expectedValue: ["testA", "testB"],
            },
            "failed object values for string parameter": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "failed object values for string parameter",
              transformerName: "objectValuesFailed",
              transformer: {
                transformerType: "objectValues",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "constant",
                    interpolation: "runtime",
                    value: "nonExistingTestObject",
                  },
                },
              },
              transformerParams: {},
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
          },
        },
        listPickElement: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "listPickElement",
          transformerTests: {
            "listPickElement selects wanted element from a constant string list before runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel:
                "listPickElement selects wanted element from a constant string list before runtime",
              transformerName: "listPickElementForString",
              transformer: {
                transformerType: "listPickElement",
                interpolation: "runtime",
                applyTo: ["testA", "testB", "testC"],
                index: 1,
              },
              transformerParams: {},
              expectedValue: "testB",
            },
            "listPickElement selects wanted element from a string list parameter reference before runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel:
                "listPickElement selects wanted element from a string list parameter reference before runtime",
              transformerName: "listPickElementForString",
              transformer: {
                transformerType: "listPickElement",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "testList",
                  },
                },
                index: 1,
              },
              transformerParams: {},
              transformerRuntimeContext: {
                testList: ["testA", "testB", "testC"],
              },
              expectedValue: "testB",
            },
            "listPickElement selects wanted object from a pre-sorted object list before runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "listPickElement selects wanted object from a pre-sorted object list before runtime",
              transformerName: "listPickElementForObject",
              transformer: {
                transformerType: "listPickElement",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "testList",
                  },
                },
                orderBy: "test",
                index: 1,
              },
              transformerParams: {
              },
              transformerRuntimeContext: {
                testList: [{ test: "testA" }, { test: "testB" }, { test: "testC" }],
              },
              expectedValue: { test: "testB" },
            },
            "listPickElement from extractor selects wanted element from string list context reference at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel:
                "listPickElement from extractor selects wanted element from string list context reference at runtime",
              transformerName: "listPickElementForString",
              transformer: {
                transformerType: "listPickElement",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "constantAsExtractor",
                    interpolation: "runtime",
                    valueJzodSchema: {
                      type: "array",
                      definition: {
                        type: "string",
                      },
                    },
                    value: ["testA", "testB", "testC"],
                  },
                },
                index: 1,
              },
              transformerParams: {},
              expectedValue: "testB",
            },
            "listPickElement from extractor selects wanted element from object ordered list at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel:
                "listPickElement from extractor selects wanted element from object ordered list at runtime",
              transformerName: "listPickElementForString",
              transformer: {
                transformerType: "listPickElement",
                interpolation: "runtime",
                orderBy: "test",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "constantAsExtractor",
                    interpolation: "runtime",
                    valueJzodSchema: {
                      type: "array",
                      definition: {
                        type: "object",
                        definition: {
                          test: { type: "string" },
                        },
                      },
                    },
                    value: [{ test: "testA" }, { test: "testB" }, { test: "testC" }],
                  },
                },
                index: 1,
              },
              transformerParams: {
                // testList: ["testA", "testB", "testC"],
              },
              expectedValue: { test: "testB" },
            },
            "listPickElement returns null when index is out of bounds before runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "listPickElement returns null when index is out of bounds before runtime",
              transformerName: "listPickElementForString",
              transformer: {
                transformerType: "listPickElement",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "testList",
                  },
                },
                index: 4,
              },
              transformerParams: {},
              transformerRuntimeContext: {
                testList: ["testA", "testB", "testC"],
              },
              expectedValue: undefined,
            },
            "listPickElement returns null when index is out of bounds at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "listPickElement returns null when index is out of bounds at runtime",
              transformerName: "listPickElementForString",
              transformer: {
                transformerType: "listPickElement",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "testList",
                  },
                },
                index: 4,
              },
              transformerParams: {},
              transformerRuntimeContext: {
                testList: ["testA", "testB", "testC"],
              },
              expectedValue: undefined,
            },
          },
        },
        unique: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "unique",
          transformerTests: {
            "unique returns list of unique objects from constant array at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "unique returns list of unique objects from constant array at runtime",
              transformerName: "uniqueForReferenceAtRuntime",
              transformer: {
                transformerType: "unique",
                interpolation: "runtime",
                attribute: "a",
                applyTo: [{ a: "testA" }, { a: "testB" }, { a: "testA" }, { a: "testC" }],
              },
              transformerParams: {},
              transformerRuntimeContext: {
              },
              expectedValue: [{ a: "testA" }, { a: "testB" }, { a: "testC" }],
            },
            "unique returns list of unique objects from reference at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "unique returns list of unique objects from reference at runtime",
              transformerName: "uniqueForReferenceAtRuntime",
              transformer: {
                transformerType: "unique",
                interpolation: "runtime",
                attribute: "a",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "testList",
                  },
                },
              },
              transformerParams: {},
              transformerRuntimeContext: {
                testList: [{ a: "testA" }, { a: "testB" }, { a: "testA" }, { a: "testC" }],
              },
              expectedValue: [{ a: "testA" }, { a: "testB" }, { a: "testC" }],
            },
            "unique returns list of unique objects from extractor at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "unique returns list of unique objects from extractor at runtime",
              transformerName: "uniqueForExtractorAtRuntime",
              transformer: {
                transformerType: "unique",
                interpolation: "runtime",
                attribute: "a",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "constantAsExtractor",
                    interpolation: "runtime",
                    valueJzodSchema: {
                      type: "array",
                      definition: {
                        type: "object",
                        definition: {
                          a: { type: "string" },
                        },
                      },
                    },
                    value: [{ a: "testA" }, { a: "testB" }, { a: "testA" }, { a: "testC" }],
                  },
                },
              },
              transformerParams: {},
              expectedValue: [{ a: "testA" }, { a: "testB" }, { a: "testC" }],
            },
          },
        },
        count: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "count",
          transformerTests: {
            "count returns number of elements in an object list at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "count returns number of elements in an object list at runtime",
              transformerName: "countForConstantObjectListAtRuntime",
              transformer: {
                transformerType: "count",
                interpolation: "runtime",
                applyTo: [ { test: "testA" }, { test: "testB" }, { test: "testC" } ],
              },
              transformerParams: {},
              transformerRuntimeContext: {},
              expectedValue: [{ count: 3 }],
            },
            "count returns number of elements in a constant transformer object list at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "count returns number of elements in a constant transformer object list at runtime",
              transformerName: "countForConstantObjectListAtRuntime",
              transformer: {
                transformerType: "count",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "constant",
                    interpolation: "runtime",
                    value: [ { test: "testA" }, { test: "testB" }, { test: "testC" } ] ,
                  },
                },
              },
              transformerParams: {},
              transformerRuntimeContext: {},
              expectedValue: [{ count: 3 }],
            },
            "count returns number of elements in a contextReference object list at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "count returns number of elements in a contextReference object list at runtime",
              transformerName: "countForObjectListAtRuntime",
              transformer: {
                transformerType: "count",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "testList",
                  },
                },
              },
              transformerParams: {},
              transformerRuntimeContext: {
                testList: [{ test: "testA" }, { test: "testB" }, { test: "testC" }],
              },
              expectedValue: [{ count: 3 }],
            },
            "count returns number of elements in a string list from an extractor at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "count returns number of elements in a string list from an extractor at runtime",
              transformerName: "countForStringListExtractor",
              transformer: {
                transformerType: "count",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "constantAsExtractor",
                    interpolation: "runtime",
                    valueJzodSchema: {
                      type: "array",
                      definition: {
                        type: "string",
                      },
                    },
                    value: ["testA", "testB", "testC"],
                  },
                },
              },
              transformerParams: {},
              expectedValue: [{ count: 3 }],
            },
            "count returns number of elements in an object list from an extractor at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "count returns number of elements in an object list from an extractor",
              transformerName: "countForObjectListExtractor",
              transformer: {
                transformerType: "count",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "constantAsExtractor",
                    interpolation: "runtime",
                    valueJzodSchema: {
                      type: "array",
                      definition: {
                        type: "object",
                        definition: {
                          test: { type: "string" },
                        },
                      },
                    },
                    value: [{ test: "testA" }, { test: "testB" }, { test: "testC" }],
                  },
                },
              },
              transformerParams: {},
              expectedValue: [{ count: 3 }],
            },
            "count returns number of elements in an object list with a group at runtime": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "count returns number of elements in an object list with a group at runtime",
              transformerName: "countForObject",
              transformer: {
                transformerType: "count",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "testList",
                  },
                },
                groupBy: "test",
              },
              transformerParams: {},
              transformerRuntimeContext: {
                testList: [{ test: "testA" }, { test: "testB" }, { test: "testA" }, { test: "testC" }],
              },
              expectedValue: [{ testA: 2, testB: 1, testC: 1 }],
            },
          },
        },
        object_fullTemplate: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "object_fullTemplate",
          transformerTests: {
            "object_fullTemplate allows to dynamically build an object from a constant object before runtime (unknown keys, unknown values)": {
              transformerTestType: "transformerTest",
              transformerTestLabel:
                "object_fullTemplate allows to dynamically build an object from a constant object before runtime (unknown keys, unknown values)",
              transformerName: "fullTemplate",
              transformer: {
                transformerType: "object_fullTemplate",
                interpolation: "runtime",
                applyTo: Country1 as EntityInstance,
                referenceToOuterObject: "country",
                definition: [
                  {
                    attributeKey: {
                      transformerType: "constantUuid",
                      interpolation: "runtime",
                      value: "uuid",
                    },
                    attributeValue: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referenceName: "newUuid",
                    },
                  },
                  {
                    attributeKey: {
                      transformerType: "constantUuid",
                      interpolation: "runtime",
                      value: "name",
                    },
                    attributeValue: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["country", "iso3166-1Alpha-2"],
                    },
                  },
                ],
              },
              transformerParams: {
                // newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
              },
              transformerRuntimeContext: {
                newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
              },
              expectedValue: { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "US" },
            },
            "object_fullTemplate allows to dynamically build an object before runtime (unknown keys, unknown values)": {
              transformerTestType: "transformerTest",
              transformerTestLabel:
                "object_fullTemplate allows to dynamically build an object before runtime (unknown keys, unknown values)",
              transformerName: "fullTemplate",
              transformer: {
                transformerType: "object_fullTemplate",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "country",
                  },
                },
                referenceToOuterObject: "country",
                definition: [
                  {
                    attributeKey: {
                      transformerType: "constantUuid",
                      interpolation: "runtime",
                      value: "uuid",
                    },
                    attributeValue: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referenceName: "newUuid",
                    },
                  },
                  {
                    attributeKey: {
                      transformerType: "constantUuid",
                      interpolation: "runtime",
                      value: "name",
                    },
                    attributeValue: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["country", "iso3166-1Alpha-2"],
                    },
                  },
                ],
              },
              transformerParams: {
                // newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                // country: Country1 as EntityInstance,
              },
              transformerRuntimeContext: {
                newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                country: Country1 as EntityInstance,
              },
              expectedValue: { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "US" },
            },
            "object_fullTemplate allows to dynamically build an object during runtime using parameterReference (unknown keys, unknown values)":
              {
                transformerTestType: "transformerTest",
                transformerTestLabel:
                  "object_fullTemplate allows to dynamically build an object during runtime using parameterReference (unknown keys, unknown values)",
                transformerName: "fullTemplate",
                transformer: {
                  transformerType: "object_fullTemplate",
                  interpolation: "runtime",
                  applyTo: {
                    referenceType: "referencedTransformer",
                    reference: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referenceName: "country",
                    },
                  },
                  referenceToOuterObject: "country",
                  definition: [
                    {
                      attributeKey: {
                        transformerType: "constantString",
                        interpolation: "runtime",
                        value: "uuid",
                      },
                      attributeValue: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referenceName: "newUuid",
                      },
                    },
                    {
                      attributeKey: {
                        transformerType: "constantString",
                        interpolation: "runtime",
                        value: "name",
                      },
                      attributeValue: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referencePath: ["country", "iso3166-1Alpha-2"],
                      },
                    },
                  ],
                },
                transformerParams: {},
                transformerRuntimeContext: {
                  newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                  country: Country1 as EntityInstance,
                },
                expectedValue: { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "US" },
              },
            "object_fullTemplate allows to dynamically build an object using an extractor": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "object_fullTemplate allows to dynamically build an object using an extractor",
              transformerName: "fullTemplate",
              transformer: {
                transformerType: "object_fullTemplate",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "constantAsExtractor",
                    interpolation: "runtime",
                    valueJzodSchema: entityDefinitionCountry.jzodSchema as JzodElement,
                    value: Country1 as EntityInstance,
                  },
                },
                referenceToOuterObject: "country",
                definition: [
                  {
                    attributeKey: {
                      transformerType: "constantString",
                      // interpolation: "build",
                      interpolation: "runtime",
                      value: "uuid",
                    },
                    attributeValue: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referenceName: "newUuid",
                    },
                  },
                  {
                    attributeKey: {
                      transformerType: "constantString",
                      // interpolation: "build",
                      interpolation: "runtime",
                      value: "name",
                    },
                    attributeValue: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["country", "iso3166-1Alpha-2"],
                    },
                  },
                ],
              },
              transformerParams: {
                // newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                // country: Country1 as EntityInstance,
              },
              transformerRuntimeContext: {
                newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                country: Country1 as EntityInstance,
              },
              expectedValue: { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "US" },
            },
          },
        },
        freeObjectTemplate: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "freeObjectTemplate",
          transformerTests: {
            "freeObjectTemplate allows to build a simple object with static values": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "freeObjectTemplate allows to build a simple object with static values",
              transformerName: "freeObjectTemplate",
              transformer: {
                transformerType: "freeObjectTemplate",
                interpolation: "runtime",
                definition: {
                  uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                  name: "US",
                  isEntity: false,
                  allocation: 1234,
                },
              },
              transformerParams: {
                country: Country1 as EntityInstance,
              },
              expectedValue: { 
                uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                name: "US",
                isEntity: false,
                allocation: 1234,
              },
            },
            "freeObjectTemplate allows to build a simple object with dynamic values": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "freeObjectTemplate allows to build a simple object with dynamic values",
              transformerName: "freeObjectTemplate",
              transformer: {
                transformerType: "freeObjectTemplate",
                interpolation: "runtime",
                definition: {
                  uuid: {
                    transformerType: "constantUuid",
                    interpolation: "runtime",
                    value: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                  },
                  name: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referencePath: ["country", "iso3166-1Alpha-2"],
                  },
                },
              },
              transformerParams: {},
              transformerRuntimeContext: {
                country: Country1 as EntityInstance,
              },
              expectedValue: { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "US" },
            },
            "freeObjectTemplate allows to build a 2-level object with dynamic values": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "freeObjectTemplate allows to build a 2-level object with dynamic values",
              transformerName: "freeObjectTemplate",
              transformer: {
                transformerType: "freeObjectTemplate",
                interpolation: "runtime",
                definition: {
                  uuid: {
                    transformerType: "constantUuid",
                    interpolation: "runtime",
                    value: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                  },
                  name: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referencePath: ["country", "iso3166-1Alpha-2"],
                  },
                  country: {
                    transformerType: "freeObjectTemplate",
                    interpolation: "runtime",
                    definition: {
                      uuid: {
                        transformerType: "constantUuid",
                        interpolation: "runtime",
                        value: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                      },
                      name: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referencePath: ["country", "iso3166-1Alpha-2"],
                      },
                    },
                  },
                },
              },
              transformerParams: {
                // country: Country1 as EntityInstance,
              },
              transformerRuntimeContext: {
                country: Country1 as EntityInstance,
              },
              expectedValue: {
                uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                name: "US",
                country: { uuid: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy", name: "US" },
              },
            },
            // TODO: detect failure to resolve correctly in postgres implementation
            "freeObjectTemplate should fail when definition fails to resolve correctly": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "freeObjectTemplate should fail when definition fails to resolve correctly",
              transformerName: "freeObjectTemplate",
              transformer: {
                transformerType: "freeObjectTemplate",
                interpolation: "runtime",
                definition: {
                  uuid: {
                    transformerType: "constantUuid",
                    interpolation: "runtime",
                    value: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                  },
                  name: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referencePath: ["country", "nonExistingAttribute"],
                  },
                },
              },
              transformerParams: {
                // country: Country1 as EntityInstance,
              },
              transformerRuntimeContext: {
                country: Country1 as EntityInstance,
              },
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
            "freeObjectTemplate should fail when sub-definition fails to resolve correctly": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "freeObjectTemplate should fail when sub-definition fails to resolve correctly",
              transformerName: "freeObjectTemplate",
              transformer: {
                transformerType: "freeObjectTemplate",
                interpolation: "runtime",
                definition: {
                  uuid: {
                    transformerType: "constantUuid",
                    interpolation: "runtime",
                    value: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                  },
                  name: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referencePath: ["country", "name"],
                  },
                  country: {
                    transformerType: "freeObjectTemplate",
                    interpolation: "runtime",
                    definition: {
                      uuid: {
                        transformerType: "constantUuid",
                        interpolation: "runtime",
                        value: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                      },
                      name: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referencePath: ["country", "nonExistingAttribute"],
                      },
                    },
                  },
                },
              },
              transformerParams: {
                // country: Country1 as EntityInstance,
              },
              transformerRuntimeContext: {
                country: Country1 as EntityInstance,
              },
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
          },
        },
        objectAlter: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "object_alter",
          transformerTests: {
            "objectAlter allows to change a constant object attribute value": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "objectAlter allows to change a constant object attribute value",
              transformerName: "objectAlter",
              transformer: {
                transformerType: "objectAlter",
                interpolation: "runtime",
                applyTo: Country1 as EntityInstance,
                referenceToOuterObject: "country",
                definition: {
                  transformerType: "freeObjectTemplate",
                  interpolation: "runtime",
                  definition: {
                    "iso3166-1Alpha-2": {
                      transformerType: "constantString",
                      interpolation: "runtime",
                      value: "DE",
                    },
                  },
                },
              },
              transformerParams: {
              },
              expectedValue: { ...Country1, "iso3166-1Alpha-2": "DE" },
            },
            "objectAlter allows to change a referenced object attribute value": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "objectAlter allows to change a referenced object attribute value",
              transformerName: "objectAlter",
              transformer: {
                transformerType: "objectAlter",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "parameterReference",
                    referenceName: "country",
                  },
                },
                referenceToOuterObject: "country",
                definition: {
                  transformerType: "freeObjectTemplate",
                  interpolation: "runtime",
                  definition: {
                    "iso3166-1Alpha-2": {
                      transformerType: "constantString",
                      interpolation: "runtime",
                      value: "DE",
                    },
                  },
                },
              },
              transformerParams: {
                country: Country1 as EntityInstance,
              },
              expectedValue: { ...Country1, "iso3166-1Alpha-2": "DE" },
            },
            "objectAlter should fail when applyTo fails to resolve correctly": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "objectAlter should fail when applyTo fails to resolve correctly",
              transformerName: "objectAlter",
              transformer: {
                transformerType: "objectAlter",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "nonExistingCountry",
                  },
                },
                referenceToOuterObject: "country",
                definition: {
                  transformerType: "freeObjectTemplate",
                  interpolation: "runtime",
                  definition: {
                    "iso3166-1Alpha-2": {
                      transformerType: "constantString",
                      interpolation: "runtime",
                      value: "DE",
                    },
                  },
                },
              },
              transformerParams: {
                country: Country1 as EntityInstance,
              },
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
            "objectAlter should fail when definition fails to resolve correctly": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "objectAlter should fail when definition fails to resolve correctly",
              transformerName: "objectAlter",
              transformer: {
                transformerType: "objectAlter",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "parameterReference",
                    referenceName: "country",
                  },
                },
                referenceToOuterObject: "country",
                definition: {
                  transformerType: "freeObjectTemplate",
                  interpolation: "runtime",
                  definition: {
                    "iso3166-1Alpha-2": {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referencePath: ["country", "nonExistingAttribute"],
                    },
                  },
                },
              },
              transformerParams: {
              },
              transformerRuntimeContext: {
                country: Country1 as EntityInstance,
              },
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
          },
        },
        mapperListToList: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "mapperListToList",
          transformerTests: {
            // TODO: test for mapperListToList within a mapperListToList
            "mapperListToList maps a constant list of objects to a list of constant objects": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "mapperListToList maps a constant list of objects to a list of constant objects",
              transformerName: "mapperListToList",
              transformer: {
                transformerType: "mapperListToList",
                label: "countryListMapperToObjectList",
                interpolation: "runtime",
                applyTo: [Country1 as EntityInstance, Country2 as EntityInstance],
                referenceToOuterObject: "country",
                elementTransformer: {
                  transformerType: "freeObjectTemplate",
                  interpolation: "runtime",
                  definition: {
                    test: "1"
                  },
                },
              },
              transformerRuntimeContext: {
                newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
              },
              transformerParams: {},
              expectedValue: [
                { test: "1" },
                { test: "1" },
              ],
            },
            "mapperListToList maps a constant list of objects to a list of constant objects with subObject": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "mapperListToList maps a constant list of objects to a list of constant objects with subObject",
              transformerName: "mapperListToList",
              transformer: {
                transformerType: "mapperListToList",
                label: "countryListMapperToObjectList",
                interpolation: "runtime",
                applyTo: [Country1 as EntityInstance, Country2 as EntityInstance],
                referenceToOuterObject: "country",
                elementTransformer: {
                  transformerType: "freeObjectTemplate",
                  interpolation: "runtime",
                  definition: {
                    test: "1",
                    subObject: {
                      transformerType: "freeObjectTemplate",
                      interpolation: "runtime",
                      definition: {
                        uuid: {
                          transformerType: "constantUuid",
                          interpolation: "runtime",
                          value: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                        },
                        name: {
                          transformerType: "constant",
                          interpolation: "runtime",
                          value: "TEST",
                        },
                      },
                    },
                  },
                },
              },
              transformerRuntimeContext: {
                newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
              },
              transformerParams: {},
              expectedValue: [
                { test: "1", subObject: { uuid: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy", name: "TEST" } },
                { test: "1", subObject: { uuid: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy", name: "TEST" } },
              ],
            },
            "mapperListToList maps a list of objects to another list of objects using object_fullTemplate": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "mapperListToList maps a list of objects to another list of objects using object_fullTemplate",
              transformerName: "mapperListToList",
              transformer: {
                transformerType: "mapperListToList",
                label: "countryListMapperToObjectList",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime", // TODO: test with parameter to be resolved before runtime. Or have only context references in applyTo?
                    referenceName: "countryList",
                  },
                },
                referenceToOuterObject: "country",
                elementTransformer: {
                  transformerType: "object_fullTemplate",
                  interpolation: "runtime",
                  applyTo: {
                    referenceType: "referencedTransformer",
                    reference: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referenceName: "country",
                    },
                  },
                  referenceToOuterObject: "country",
                  definition: [
                    {
                      attributeKey: {
                        transformerType: "constant",
                        interpolation: "runtime",
                        value: "uuid",
                      },
                      attributeValue: {
                        transformerType: "constant",
                        interpolation: "runtime",
                        value: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                      },
                    },
                    {
                      attributeKey: {
                        transformerType: "constantUuid",
                        interpolation: "runtime",
                        value: "name",
                      },
                      attributeValue: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referencePath: ["country", "iso3166-1Alpha-2"],
                      },
                    },
                  ],
                },
              },
              transformerRuntimeContext: {
                newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                countryList: [Country1 as EntityInstance, Country2 as EntityInstance],
              },
              transformerParams: {},
              expectedValue: [
                { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "US" },
                { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "DE" },
              ],
            },
            "mapperListToList maps a list of objects to a list of altered objects using objectAlter": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "mapperListToList maps a list of objects to a list of altered objects using objectAlter",
              transformerName: "mapperListToList",
              transformer: {
                transformerType: "mapperListToList",
                label: "countryListMapperToObjectList",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "countryList",
                  },
                },
                referenceToOuterObject: "country2",
                elementTransformer: {
                  transformerType: "objectAlter",
                  interpolation: "runtime",
                  applyTo: {
                    referenceType: "referencedTransformer",
                    reference: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referenceName: "country2",
                    },
                  },
                  referenceToOuterObject: "country3",
                  definition: {
                    transformerType: "freeObjectTemplate",
                    interpolation: "runtime",
                    definition: {
                      id: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referencePath: ["country3", "uuid"],
                      },
                      name: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referencePath: ["country3", "iso3166-1Alpha-2"],
                      },
                    },
                  },
                },
              },
              transformerRuntimeContext: {
                newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                countryList: [Country1 as EntityInstance, Country2 as EntityInstance],
              },
              transformerParams: {},
              expectedValue: [
                { ...Country1, id: Country1.uuid, name: "US" },
                { ...Country2, id: Country2.uuid, name: "DE" },
              ],
            },
          },
        },
        dataflowObject: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "dataflowObject",
          transformerTests: {
            "dataflowObject with single entry allows to build an object with dynamic keys and values": {
              transformerTestType: "transformerTest",
              transformerTestLabel:
                "dataflowObject with single entry allows to build an object with dynamic keys and values",
              transformerName: "dataflowObject",
              transformer: {
                transformerType: "dataflowObject",
                interpolation: "runtime",
                target: "newObject",
                definition: {
                  newObject: {
                    transformerType: "object_fullTemplate",
                    interpolation: "runtime",
                    applyTo: {
                      referenceType: "referencedTransformer",
                      reference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referenceName: "country",
                      },
                    },
                    referenceToOuterObject: "country2",
                    definition: [
                      {
                        attributeKey: {
                          transformerType: "constantUuid",
                          interpolation: "runtime",
                          value: "uuid",
                        },
                        attributeValue: {
                          transformerType: "contextReference",
                          interpolation: "runtime",
                          referenceName: "newUuid",
                        },
                      },
                      {
                        attributeKey: {
                          transformerType: "constantUuid",
                          interpolation: "runtime",
                          value: "name",
                        },
                        attributeValue: {
                          transformerType: "contextReference",
                          interpolation: "runtime",
                          referencePath: ["country2", "iso3166-1Alpha-2"],
                        },
                      },
                    ],
                  },
                },
              },
              transformerParams: {
              //   newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
              //   country: Country1 as EntityInstance,
              },
              transformerRuntimeContext: {
                newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                country: Country1 as EntityInstance,
              },
              // expectedValue: { newObject: { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "US" } },
              expectedValue: { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "US" },
            },
            "dataflowObject with two entries allows to build an object with dynamic keys and values": {
              transformerTestType: "transformerTest",
              transformerTestLabel:
                "dataflowObject with two entries allows to build an object with dynamic keys and values",
              transformerName: "dataflowObject",
              transformer: {
                transformerType: "dataflowObject",
                interpolation: "runtime",
                target: "newObject2",
                definition: {
                  newObject: {
                    transformerType: "object_fullTemplate",
                    interpolation: "runtime",
                    label: "newObject",
                    applyTo: {
                      referenceType: "referencedTransformer",
                      reference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referenceName: "country",
                      },
                    },
                    referenceToOuterObject: "country",
                    definition: [
                      {
                        attributeKey: {
                          transformerType: "constantUuid",
                          interpolation: "runtime",
                          value: "uuid",
                        },
                        attributeValue: {
                          transformerType: "contextReference",
                          interpolation: "runtime",
                          referenceName: "newUuid",
                        },
                      },
                      {
                        attributeKey: {
                          transformerType: "constantUuid",
                          interpolation: "runtime",
                          value: "name",
                        },
                        attributeValue: {
                          transformerType: "contextReference",
                          interpolation: "runtime",
                          referencePath: ["country", "iso3166-1Alpha-2"],
                        },
                      },
                    ],
                  },
                  newObject2: {
                    transformerType: "object_fullTemplate",
                    interpolation: "runtime",
                    label: "newObject2",
                    applyTo: {
                      referenceType: "referencedTransformer",
                      reference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referenceName: "newObject",
                      },
                    },
                    referenceToOuterObject: "newObject",
                    definition: [
                      {
                        attributeKey: {
                          transformerType: "constantUuid",
                          interpolation: "runtime",
                          value: "uuid",
                        },
                        attributeValue: {
                          transformerType: "contextReference",
                          interpolation: "runtime",
                          referenceName: "newUuid2",
                        },
                      },
                      {
                        attributeKey: {
                          transformerType: "constantUuid",
                          interpolation: "runtime",
                          value: "name",
                        },
                        attributeValue: {
                          transformerType: "contextReference",
                          interpolation: "runtime",
                          referencePath: ["newObject", "name"],
                        },
                      },
                    ],
                  },
                },
              },
              transformerParams: {
                // newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                // newUuid2: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                // country: Country1 as EntityInstance,
              },
              transformerRuntimeContext: {
                newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                newUuid2: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                country: Country1 as EntityInstance,
              },
              expectedValue: {
                // uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                // name: "US",
                uuid: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                name: "US",
              },
            },
            "dataflowObject shall fail when an entry fails": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "dataflowObject shall fail when an entry fails",
              transformerName: "dataflowObject",
              transformer: {
                transformerType: "dataflowObject",
                interpolation: "runtime",
                target: "newObject",
                definition: {
                  newObject: {
                    transformerType: "object_fullTemplate",
                    interpolation: "runtime",
                    applyTo: {
                      referenceType: "referencedTransformer",
                      reference: {
                        transformerType: "contextReference",
                        interpolation: "runtime",
                        referenceName: "country",
                      },
                    },
                    referenceToOuterObject: "country2",
                    definition: [
                      {
                        attributeKey: {
                          transformerType: "constantUuid",
                          interpolation: "runtime",
                          value: "uuid",
                        },
                        attributeValue: {
                          transformerType: "contextReference",
                          interpolation: "runtime",
                          referenceName: "newUuid",
                        },
                      },
                      {
                        attributeKey: {
                          transformerType: "constantUuid",
                          interpolation: "runtime",
                          value: "name",
                        },
                        attributeValue: {
                          transformerType: "contextReference",
                          interpolation: "runtime",
                          referencePath: ["country3", "nonExistingAttribute"],
                        },
                      },
                    ],
                  },
                },
              },
              transformerParams: {
                // newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                // country: Country1 as EntityInstance,
              },
              transformerRuntimeContext: {
                newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                country: Country1 as EntityInstance,
              },
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
          },
        },
        listReducerToSpreadObject: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "listReducerToSpreadObject",
          transformerTests: {
            "listReducerToSpreadObject allows to reduce a constant list of objects to a single object": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "listReducerToSpreadObject allows to reduce a constant list of objects to a single object",
              transformerName: "listReducerToSpreadObject",
              transformer: {
                transformerType: "listReducerToSpreadObject",
                interpolation: "runtime",
                applyTo: [
                  {
                    uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                    name: "US",
                  },
                  {
                    uuid2: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                    name2: "DE",
                  }
                ],
              },
              transformerParams: {},
              expectedValue: {
                uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                name: "US",
                uuid2: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                name2: "DE",
              },
            },
            "listReducerToSpreadObject allows to reduce a list of objects from parameter to a single object": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "listReducerToSpreadObject allows to reduce a list of objects from parameter to a single object",
              transformerName: "listReducerToSpreadObject",
              transformer: {
                transformerType: "listReducerToSpreadObject",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "objectList",
                  },
                },
              },
              transformerParams: {
                // objectList: [
                //   {
                //     uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                //     name: "US",
                //   },
                //   {
                //     uuid2: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                //     name2: "DE",
                //   }
                // ]
              },
              transformerRuntimeContext: {
                objectList: [
                  {
                    uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                    name: "US",
                  },
                  {
                    uuid2: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                    name2: "DE",
                  }
                ]
              },
              expectedValue: {
                uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                name: "US",
                uuid2: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                name2: "DE",
              },
            },
            "listReducerToSpreadObject fails when input is not a list": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "listReducerToSpreadObject fails when input is not a list",
              transformerName: "listReducerToSpreadObject",
              transformer: {
                transformerType: "listReducerToSpreadObject",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "objectList",
                  },
                },
              },
              transformerParams: {},
              transformerRuntimeContext: {
                objectList: {
                  uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                  name: "US",
                }
              },
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
            // TODO error cases
            "listReducerToSpreadObject fails when non-objects are included in the list": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "listReducerToSpreadObject fails when non-objects are included in the list",
              transformerName: "listReducerToSpreadObject",
              transformer: {
                transformerType: "listReducerToSpreadObject",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "objectList",
                  },
                },
              },
              transformerParams: {},
              transformerRuntimeContext: {
                objectList: [
                  {
                    uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                    name: "US",
                  },
                  "DE",
                ]
              },
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            }
          },
        },
        listReducerToIndexObject: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "listReducerToIndexObject",
          transformerTests: {
            "listReducerToIndexObject allows to reduce a constant list of objects to an object with dynamic keys and values": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "listReducerToIndexObject allows to reduce a constant list of objects to an object with dynamic keys and values",
              transformerName: "listReducerToIndexObject",
              transformer: {
                transformerType: "listReducerToIndexObject",
                interpolation: "runtime",
                applyTo: [
                  {
                    uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                    name: "US",
                  },
                  {
                    uuid: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                    name: "DE",
                  }
                ],
                indexAttribute: "uuid",
              },
              transformerParams: {},
              expectedValue: {
                "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx": { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "US" },
                "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy": { uuid: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy", name: "DE" },
              },
            },
            "listReducerToIndexObject allows to reduce a list of objects from parameter to an object with dynamic keys and values": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "listReducerToIndexObject allows to reduce a list of objects from parameter to an object with dynamic keys and values",
              transformerName: "listReducerToIndexObject",
              transformer: {
                transformerType: "listReducerToIndexObject",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "objectList",
                  },
                },
                indexAttribute: "uuid",
              },
              transformerParams: {},
              transformerRuntimeContext: {
                objectList: [
                  {
                    uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                    name: "US",
                  },
                  {
                    uuid: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
                    name: "DE",
                  }
                ]
              },
              expectedValue: {
                "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx": { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "US" },
                "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy": { uuid: "yyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy", name: "DE" },
              },
            },
            // TODO add test for listReducerToIndexObject with parameter
            "listReducerToIndexObject fails when input is not a list": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "listReducerToIndexObject fails when input is not a list",
              transformerName: "listReducerToIndexObject",
              transformer: {
                transformerType: "listReducerToIndexObject",
                interpolation: "runtime",
                applyTo: {
                  referenceType: "referencedTransformer",
                  reference: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "objectNotList",
                  },
                },
                indexAttribute: "uuid",
              },
              transformerParams: {},
              transformerRuntimeContext: {
                objectNotList: {
                  uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
                  name: "US",
                }
              },
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
          },
        }
      }
    },
  }
};

export const currentTestSuite:TransformerTestSuite = transformerTestSuite_miroirTransformers;
// export const currentTestSuite:TransformerTestSuite = transformerTestSuite_spreadsheet;



