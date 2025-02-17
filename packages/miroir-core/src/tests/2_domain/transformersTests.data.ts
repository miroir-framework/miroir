import { EntityInstance, JzodElement, TransformerForBuild, TransformerForRuntime } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { displayTestSuiteResults } from "../../4_services/otherTools.js";
import { TestSuiteContext } from "../../4_services/TestSuiteContext.js";

import entityDefinitionCountry from "../../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json" assert { type: "json" };

import folio from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json" assert { type: "json" };
import penguin from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json" assert { type: "json" };
import springer from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json" assert { type: "json" };
import author1 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json" assert { type: "json" };
import author2 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json" assert { type: "json" };
import author3 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json" assert { type: "json" };
import author4 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json" assert { type: "json" };
import book1 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json" assert { type: "json" };
import book2 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json" assert { type: "json" };
import book3 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json" assert { type: "json" };
import book4 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json" assert { type: "json" };
import book5 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json" assert { type: "json" };
import book6 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json" assert { type: "json" };
// import test1 from "../../assets/library_data/9ad64893-5f8f-4eaf-91aa-ffae110f88c8/150bacfd-06d0-4ecb-828d-f5275494448a.json" assert { type: "json" };
import Country1 from "../../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/2eda1207-4dcc-4af9-a3ba-ef75e7f12c11.json" assert { type: "json" };
import Country2 from "../../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/30b8e7c6-b75d-4db0-906f-fa81fa5c4cc0.json" assert { type: "json" };
import Country3 from "../../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b62fc20b-dcf5-4e3b-a247-62d0475cf60f.json" assert { type: "json" };
import Country4 from "../../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b6ddfb89-4301-48bf-9ed9-4ed6ee9261fe.json" assert { type: "json" };

import publisher1 from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json" assert { type: "json" };
import publisher2 from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json" assert { type: "json" };
import publisher3 from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json" assert { type: "json" };


// ################################################################################################
// export interface TransformerTestParams {
// export class TransformerTestParams {
export type TransformerTest = {
  transformerTestType: "transformerTest";
  transformerTestLabel: string;
  // deploymentUuid: Uuid;
  transformerName: string;
  transformer: TransformerForBuild | TransformerForRuntime;
  transformerParams: Record<string, any>;
  transformerRuntimeContext?: Record<string, any>;
  expectedValue: any;
  ignoreAttributes?: string[];
};
export type TransformerTestSuite = 
  TransformerTest
 |
{
  transformerTestType: "transformerTestSuite";
  transformerTestLabel: string;
  transformerTests: Record<string, TransformerTestSuite>;
}

// by default only queryFailure and failureMessage are compared when expectedValue is a Domain2ElementFailed
export const ignoreFailureAttributes:string[] = [
  "applicationSection",
  "deploymentUuid",
  "entityUuid",
  "failureOrigin",
  "instanceUuid",
  "errorStack",
  "innerError",
  "queryContext",
  "queryParameters",
  "queryReference",
  "query",
];


export const transformerTests: TransformerTestSuite = {
  transformerTestType: "transformerTestSuite",
  transformerTestLabel: "transformers",
  transformerTests: {
    constants: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "constants",
      transformerTests: {
        constantArray: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "constantArray",
          transformerTests: {
            "resolve basic transformer constantArray": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "resolve basic transformer constantArray",
              transformerName: "constantArray",
              transformer: {
                transformerType: "constantArray",
                interpolation: "runtime",
                value: ["testA", "testB"],
              },
              transformerParams: {},
              expectedValue: ["testA", "testB"],
            },
            // TODO: this should return an error, both in the in-memory and in the database case
            // when the parsing of the parameter fails, the transformer should return a QueryNotExecutable, but returns the stringified value of the parameter instead
            "failed constantArray transformer for non-array value": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "failed constantArray transformer for non-array value",
              transformerName: "constantArrayFailed",
              transformer: {
                transformerType: "constantArray",
                interpolation: "runtime",
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
            "failed constantNumber transformer for non-number value": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "failed constantNumber transformer for non-number value",
              transformerName: "constantNumberFailed",
              transformer: {
                transformerType: "constantNumber",
                interpolation: "runtime",
                value: "test" as any,
              },
              transformerParams: {},
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
          },
        },
        constantBigint: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "constantBigint",
          transformerTests: {
            "resolve basic transformer constantBigint": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "resolve basic transformer constantBigint",
              transformerName: "constantBigint",
              transformer: {
                transformerType: "constantBigint",
                interpolation: "runtime",
                // value: 42n,
                value: 42, // TODO: ensure actual value is bigint, not number
              },
              transformerParams: {},
              expectedValue: 42,
              // expectedValue: 42n,
            },
            "failed constantBigint transformer for non-bigint value": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "failed constantBigint transformer for non-bigint value",
              transformerName: "constantBigintFailed",
              transformer: {
                transformerType: "constantBigint",
                interpolation: "runtime",
                value: "test" as any,
              },
              transformerParams: {},
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
          },
        },
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
            "constantString transformer for non-string value": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "failed constantString transformer for non-string value",
              transformerName: "constantStringFailed",
              transformer: {
                transformerType: "constantString",
                interpolation: "runtime",
                value: { test: "objectInsteadOfString" } as any,
              },
              transformerParams: {},
              expectedValue: "{\"test\":\"objectInsteadOfString\"}"
            },
          },
        },
        constantObject: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "constantObject",
          transformerTests: {
            "resolve basic transformer constantObject": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "resolve basic transformer constantObject",
              transformerName: "constantObject",
              transformer: {
                transformerType: "constantObject",
                interpolation: "runtime",
                value: { test: "test" },
              },
              transformerParams: {},
              expectedValue: { test: "test" },
            },
            // "failed constantObject transformer for non-object value": {
            //   transformerTestType: "transformerTest",
            //   transformerTestLabel: "failed constantObject transformer for non-object value",
            //   transformerName: "constantObjectFailed",
            //   transformer: {
            //     transformerType: "constantObject",
            //     interpolation: "runtime",
            //     value: "test" as any,
            //   },
            //   transformerParams: {},
            //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
            //   expectedValue: {
            //     queryFailure: "QueryNotExecutable",
            //   },
            // }
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
            "failed constantBoolean transformer for non-boolean value": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "failed constantBoolean transformer for non-boolean value",
              transformerName: "constantBooleanFailed",
              transformer: {
                transformerType: "constantBoolean",
                interpolation: "runtime",
                value: "test" as any,
              },
              transformerParams: {},
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            }
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
                value: {"test": "a"},
              },
              transformerParams: {},
              expectedValue: [{"test": "a"}], // an extractor is always a table (that is a list of rows)
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
              expectedValue: [Country1], // an extractor is always a table (that is a list of rows)
            },
            "resolve basic transformer constantAsExtractor for array of simple objects": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "resolve basic transformer constantAsExtractor for array of simple objects",
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
                value: [{"test": "a"}, { "test": "b" }],
              },
              transformerParams: {},
              expectedValue: [{"test": "a"}, { "test" : "b"}], // an extractor is always a table (that is a list of rows)
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
        }
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
            "resolve basic transformer": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "resolve basic transformer parameterReference",
              transformerName: "parameterReference",
              transformer: {
                transformerType: "parameterReference",
                interpolation: "runtime",
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
                interpolation: "runtime",
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
                interpolation: "runtime",
                referenceName: "nonExistentReference",
              },
              transformerParams: {},
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
            "should fail when parameter reference value is undefined": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "should fail when parameter reference value is undefined",
              transformerName: "parameterReference",
              transformer: {
                transformerType: "parameterReference",
                interpolation: "runtime",
                referenceName: "referenceFoundButUndefined",
              },
              transformerParams: {
                referenceFoundButUndefined: undefined,
              },
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
                interpolation: "runtime",
                referencePath: ["invalidPath"],
              },
              transformerParams: {
                a: "test",
              },
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
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
                // failureOrigin: ["transformer_InnerReference_resolve"],
                // queryReference: "nonExistentReference",
                // failureMessage: "no referenceName nonExistentReference",
                // queryContext: "[]",
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
                a: "test",
              },
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
                // queryFailure: "ReferenceFoundButUndefined",
                // failureOrigin: ["transformer_InnerReference_resolve"],
                // queryReference: '["a","invalidPath"]',
                // failureMessage: "no referencePath a,invalidPath",
                // queryContext: '["a"]',
              },
            },
            "should fail when context reference value is undefined": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "should fail when context reference value is undefined",
              transformerName: "contextReference",
              transformer: {
                transformerType: "contextReference",
                interpolation: "runtime",
                referenceName: "referenceFoundButUndefined",
              },
              transformerParams: {},
              transformerRuntimeContext: {
                referenceFoundButUndefined: undefined,
              },
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
                // queryFailure: "ReferenceFoundButUndefined",
                // failureOrigin: ["transformer_InnerReference_resolve"],
                // queryReference: "referenceFoundButUndefined",
                // failureMessage: "found but undefined: referenceName referenceFoundButUndefined",
                // queryContext: '["referenceFoundButUndefined"]',
              },
            },
          },
        },
      },
    },
    objectEntries: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "objectEntries",
      transformerTests: {
        "object entries with string referencedTransformer": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "object entries with string referencedTransformer",
          transformerName: "objectEntries",
          transformer: {
            transformerType: "objectEntries",
            interpolation: "runtime",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "parameterReference",
                interpolation: "runtime",
                referenceName: "testObject1",
              }
            }
          },
          transformerParams: {
            testObject1: { a: "testA", b: "testB" },
          },
          expectedValue: [ ["a", "testA"], ["b", "testB"] ],
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
              }
            }
          },
          transformerParams: {
          },
          ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
          expectedValue:  {
            "queryFailure": "QueryNotExecutable",
          },
        },
      },
    },
    objectValues: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "objectValues",
      transformerTests: {
        "object values with string referencedTransformer": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "object values with string referencedTransformer",
          transformerName: "objectEntries",
          transformer: {
            transformerType: "objectValues",
            interpolation: "runtime",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "parameterReference",
                interpolation: "runtime",
                referenceName: "testObject",
              }
            }
          },
          transformerParams: {
            testObject: { a: "testA", b: "testB" },
          },
          expectedValue: [ "testA", "testB" ],
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
              }
            }
          },
          transformerParams: {
          },
          ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
          expectedValue:  {
            "queryFailure": "QueryNotExecutable",
          },
        },
      },
    },
    mustache: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "mustache",
      transformerTests: {
        "mustache string template": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "mustache string template",
          transformerName: "mustache",
          transformer: {
            transformerType: "mustacheStringTemplate",
            interpolation: "runtime",
            definition: "a{{newApplication.name}}_{{newApplication.suffix}} example",
          },
          transformerParams: {
            newApplication: { name: "Test", suffix: "Z"},
          },
          expectedValue: "aTest_Z example",
          // expectedValue: "TestSelfApplication",
        },
        "failed mustache string template": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "failed mustache string template",
          transformerName: "mustacheStringTemplateFailed",
          transformer: {
            transformerType: "mustacheStringTemplate",
            interpolation: "runtime",
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
    listPickElement: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "listPickElement",
      transformerTests: {
        "listPickElement selects wanted element from a string list": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "listPickElement selects wanted element from a string list",
          transformerName: "listPickElementForString",
          transformer: {
            transformerType: "listPickElement",
            interpolation: "runtime",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "parameterReference",
                interpolation: "runtime",
                referenceName: "testList",
              },
            },
            index: 1,
          },
          transformerParams: {
            testList: ["testA", "testB", "testC"],
          },
          expectedValue: "testB",
        },
        "listPickElement selects wanted object from a pre-sorted object list": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "listPickElement selects wanted object from a pre-sorted object list",
          transformerName: "listPickElementForObject",
          transformer: {
            transformerType: "listPickElement",
            interpolation: "runtime",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "parameterReference",
                interpolation: "runtime",
                referenceName: "testList",
              },
            },
            orderBy: "test",
            index: 1,
          },
          transformerParams: {
            testList: [{ test: "testA" }, { test: "testB" }, { test: "testC" }],
          },
          expectedValue: {test: "testB"},
        },
        "listPickElement from extractor selects wanted element from string list": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "listPickElement from extractor selects wanted element from string list",
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
                  type: "string",
                },
                value: [ "testA", "testB", "testC" ],
              },
            },
            index: 1,
          },
          transformerParams: {
          },
          expectedValue: "testB",
        },
        "listPickElement from extractor selects wanted element from object ordered list": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "listPickElement from extractor selects wanted element from object ordered list",
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
                  type: "object",
                  definition: {
                    test: { type: "string" },
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
        "listPickElement returns null when index is out of bounds": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "listPickElement returns null when index is out of bounds",
          transformerName: "listPickElementForString",
          transformer: {
            transformerType: "listPickElement",
            interpolation: "runtime",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "parameterReference",
                interpolation: "runtime",
                referenceName: "testList",
              },
            },
            index: 4,
          },
          transformerParams: {
            testList: ["testA", "testB", "testC"],
          },
          expectedValue: undefined,
        },
        // "failed object values for string parameter": {
        //   transformerTestType: "transformerTest",
        //   transformerTestLabel: "failed object values for string parameter",
        //   transformerName: "objectValuesFailed",
        //   transformer: {
        //     transformerType: "objectValues",
        //     interpolation: "runtime",
        //     applyTo: {
        //       referenceType: "referencedTransformer",
        //       reference: {
        //         transformerType: "constant",
        //         interpolation: "runtime",
        //         value: "nonExistingTestObject",
        //       },
        //     },
        //   },
        //   transformerParams: {
        //   },
        //   ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
        //   expectedValue:  {
        //     "queryFailure": "QueryNotExecutable",
        //   },
        // },
      },
    },
    unique: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "unique",
      transformerTests: {
        "unique returns list of unique objects": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "unique returns list of unique objects",
          transformerName: "unique",
          transformer: {
            transformerType: "unique",
            interpolation: "runtime",
            attribute: "a",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "parameterReference",
                interpolation: "runtime",
                referenceName: "testList",
              },
            },
          },
          transformerParams: {
            // testList: ["testA", "testB", "testA", "testC"],
            testList: [ { a: "testA" }, { a: "testB" }, { a: "testA" }, { a: "testC" } ],
          },
          // expectedValue: ["testA", "testB", "testC"],
          expectedValue: [ { a: "testA" }, { a: "testB" }, { a: "testC" } ],
        },
        "unique returns list of unique objects from extractor": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "unique returns list of unique objects from extractor",
          transformerName: "unique",
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
                  type: "object",
                  definition: {
                    a: { type: "string" },
                  },
                },
                value: [ { a: "testA" }, { a: "testB" }, { a: "testA" }, { a: "testC" } ],
              },
            },
          },
          transformerParams: {
          },
          expectedValue: [ { a: "testA" }, { a: "testB" }, { a: "testC" } ],
        },
      }
    },
    count: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "count",
      transformerTests: {
        "count returns number of elements in a list": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "count returns number of elements in a list",
          transformerName: "count",
          transformer: {
            transformerType: "count",
            interpolation: "runtime",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "parameterReference",
                interpolation: "runtime",
                referenceName: "testList",
              },
            },
          },
          transformerParams: {
            testList: ["testA", "testB", "testC"],
          },
          expectedValue: [{ count: 3 }],
        },
        "count returns number of elements in an object list": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "count returns number of elements in an object list",
          transformerName: "countForObject",
          transformer: {
            transformerType: "count",
            interpolation: "runtime",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "parameterReference",
                interpolation: "runtime",
                referenceName: "testList",
              },
            },
          },
          transformerParams: {
            testList: [{ test: "testA" }, { test: "testB" }, { test: "testC" }],
          },
          expectedValue: [{ count: 3}],
        },
        "count returns number of elements in a string list from an extractor": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "count returns number of elements in a string list from an extractor",
          transformerName: "countForExtractor",
          transformer: {
            transformerType: "count",
            interpolation: "runtime",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "constantAsExtractor",
                interpolation: "runtime",
                valueJzodSchema: {
                  type: "string",
                },
                value: ["testA", "testB", "testC"],
              },
            },
          },
          transformerParams: {
          },
          expectedValue: [{ count: 3}],
        },
        "count returns number of elements in an object list from an extractor": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "count returns number of elements in an object list from an extractor",
          transformerName: "countForExtractor",
          transformer: {
            transformerType: "count",
            interpolation: "runtime",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "constantAsExtractor",
                interpolation: "runtime",
                valueJzodSchema: {
                  type: "object",
                  definition: {
                    test: { type: "string" },
                  },
                },
                value: [{ test: "testA" }, { test: "testB" }, { test: "testC" }],
              },
            },
          },
          transformerParams: {
          },
          expectedValue: [{ count: 3}],
        },
        "count returns number of elements in an object list with a group": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "count returns number of elements in an object list with a group",
          transformerName: "countForObject",
          transformer: {
            transformerType: "count",
            interpolation: "runtime",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "parameterReference",
                interpolation: "runtime",
                referenceName: "testList",
              },
            },
            groupBy: "test",
          },
          transformerParams: {
            testList: [{ test: "testA" }, { test: "testB" }, { test: "testA" }, { test: "testC" }],
          },
          expectedValue: [{ testA: 2, testB: 1, testC: 1 }],
        }
      },
    },
    object_fullTemplate: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "object_fullTemplate",
      transformerTests: {
        "object_fullTemplate allows to dynamically build an object (unknown kebys, unknown values)": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "object_fullTemplate allows to dynamically build an object (unknown kebys, unknown values)",
          transformerName: "fullTemplate",
          transformer: {
            transformerType: "object_fullTemplate",
            interpolation: "runtime",
            applyTo: {
              referenceType: "referencedTransformer",
              reference: {
                transformerType: "parameterReference",
                interpolation: "runtime",
                referenceName: "country",
              },
            },
            definition: [
              {
                attributeKey: {
                  interpolation: "runtime",
                  transformerType: "constantUuid",
                  value: "uuid"
                },
                attributeValue: {
                  interpolation: "runtime",
                  transformerType: "parameterReference",
                  referenceName: "newUuid"
                }
              },
              {
                attributeKey: {
                  interpolation: "runtime",
                  transformerType: "constantUuid",
                  value: "name"
                },
                attributeValue: {
                  transformerType: "mustacheStringTemplate",
                  interpolation: "runtime",
                  definition: "{{country.iso3166-1Alpha-2}}"
                }
              }
            ]
          },
          transformerParams: {
            newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            country: Country1 as EntityInstance,
          },
          expectedValue: { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "US"  },

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
            definition: [
              {
                attributeKey: {
                  interpolation: "runtime",
                  transformerType: "constantString",
                  value: "uuid"
                },
                attributeValue: {
                  transformerType: "parameterReference",
                  interpolation: "runtime",
                  referenceName: "newUuid"
                }
              },
              {
                attributeKey: {
                  transformerType: "constantString",
                  interpolation: "runtime",
                  value: "name"
                },
                attributeValue: {
                  transformerType: "mustacheStringTemplate",
                  interpolation: "runtime",
                  definition: "{{country.iso3166-1Alpha-2}}"
                }
              }
            ]
          },
          transformerParams: {
            newUuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            country: Country1 as EntityInstance,
          },
          expectedValue: { uuid: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", name: "US"  },
        },
      },
    }
  },
};

const globalTimeOut = 30000;

// ################################################################################################
export const testSuites = (transformerTestSuite: TransformerTestSuite):string[][] => {
  const result: string[][] = [];

  const traverseTestSuites = (suite: TransformerTestSuite, path: string[] = []) => {
    if (suite.transformerTestType === "transformerTestSuite") {
      const newPath = [...path, suite.transformerTestLabel];
      const subSuites = Object.values(suite.transformerTests);

      if (subSuites.length === 0 || subSuites.every((subSuite) => subSuite.transformerTestType === "transformerTest")) {
        result.push(newPath);
      } else {
        for (const subSuite of subSuites) {
          if (subSuite.transformerTestType === "transformerTestSuite") {
            traverseTestSuites(subSuite, newPath);
          }
        }
      }
    }
  };

  traverseTestSuites(transformerTestSuite);
  return result;
}

// ################################################################################################
export async function runTransformerTestSuite(
  vitest: any,
  testSuitePath: string[],
  transformerTestSuite: TransformerTestSuite,
  runTransformerTest: (vitest: any, testSuitePath: string[], transformerTest: TransformerTest) => Promise<void>
) {
  const testSuitePathAsString = TestSuiteContext.testSuitePathName(testSuitePath);
  const testSuiteName = transformerTestSuite.transformerTestLabel??transformerTestSuite.transformerTestType;
  console.log(`@@@@@@@@@@@@@@@@@@@@ running transformer test suite called ${testSuitePathAsString} transformerTestType=${transformerTestSuite.transformerTestType}`);
  TestSuiteContext.setTestSuite(testSuitePathAsString);
  if (transformerTestSuite.transformerTestType == "transformerTest") {
    TestSuiteContext.setTest(transformerTestSuite.transformerTestLabel);
    await runTransformerTest(vitest, testSuitePath, transformerTestSuite);
    TestSuiteContext.setTest(undefined);
  } else {
    // console.log(`running transformer test suite ${testSuiteName} with ${JSON.stringify(Object.keys(transformerTestSuite.transformerTests))} tests`);

    console.log(`handling transformer test suite ${testSuitePath} with transformerTests=${JSON.stringify(Object.values(transformerTestSuite.transformerTests), null, 2)} tests`);
    await vitest.describe.each(Object.values(transformerTestSuite.transformerTests))(
      "test $currentTestSuiteName",
      async (transformerTestParam: TransformerTestSuite) => {
        console.log(`calling inner transformer test suite of ${testSuitePath} called ${transformerTestParam.transformerTestLabel}`);
        // TestSuiteContext.setTestSuite(undefined);
        await runTransformerTestSuite(
          vitest,
          // [...testSuiteName, transformerTestParam.transformerTestLabel],
          [...testSuitePath, testSuiteName],
          transformerTestParam,
          runTransformerTest
        );
      },
      globalTimeOut
    );
    console.log(`finished running transformer subtests for test suite ${testSuitePath}`);
  }
  console.log(`@@@@@@@@@@@@@@@@@@@@ finished running transformer test suite ${JSON.stringify(testSuitePath)}`);
  // TestSuiteContext.resetContext();
}

// ################################################################################################
export const transformerTestsDisplayResults = (RUN_TEST: string,testSuiteName: string) => {
  if (RUN_TEST == testSuiteName) {
    console.log("#################################### afterAll", testSuiteName,"testResults", JSON.stringify(TestSuiteContext.testAssertionsResults, null, 2));
    const testSuitesPaths = testSuites(transformerTests);
    const testSuitesNames = testSuitesPaths.map(TestSuiteContext.testSuitePathName);
    // console.log("#################################### afterAll TestSuites:", testSuitesPaths);
    console.log("#################################### afterAll", testSuiteName,"TestSuites names:", testSuitesNames);
    console.log("#################################### afterAll", testSuiteName,"TestResults:");
    for (const testSuiteName of testSuitesNames) {
      displayTestSuiteResults(expect, testSuiteName);
      console.log("");
    }
    TestSuiteContext.resetResults();
  }
}
