// import { LoggerGlobalContext } from "../../4_services/LoggerContext.js";
import { displayTestSuiteResults, TestSuiteContext, TransformerForBuild, TransformerForRuntime } from "miroir-core";

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

// export const transformerTests: Record<string, TransformerTestSuite | Record<string, TransformerTestSuite>> = {
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
              // expectedValue: {
              //   queryFailure: "QueryNotExecutable",
              // },
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
            "should fail when context reference is not found": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "should fail when context reference is not found",
              transformerName: "constantUuid",
              transformer: {
                transformerType: "contextReference",
                interpolation: "runtime",
                referenceName: "nonExistentReference",
              },
              transformerParams: {},
              ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              expectedValue: {
                queryFailure: "QueryNotExecutable",
              },
            },
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
                // constantBigintValue: 42n,
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
              // ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
              // expectedValue: {
              //   queryFailure: "QueryNotExecutable",
              // },
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
            // referencedTransformer: {
            //   transformerType: "parameterReference",
            //   referenceName: "testObject",
            // },
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
          transformerParams: {
          },
          ignoreAttributes: [...ignoreFailureAttributes, "failureMessage"],
          expectedValue:  {
            "queryFailure": "QueryNotExecutable",
          },
        },
      },
    },
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
