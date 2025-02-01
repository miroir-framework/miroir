// import { LoggerGlobalContext } from "../../4_services/LoggerContext.js";
import { displayTestSuiteResults, TestSuiteContext, TransformerForBuild } from "miroir-core";

// ################################################################################################
// export interface TransformerTestParams {
// export class TransformerTestParams {
export type TransformerTest = {
  transformerTestType: "transformerTest";
  transformerTestLabel: string;
  // deploymentUuid: Uuid;
  transformerName: string;
  transformer: TransformerForBuild;
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

export const testSuites = (transformerTestSuite: TransformerTestSuite):string[][] => {
  const result: string[][] = [];

  const traverseTestSuites = (suite: TransformerTestSuite, path: string[] = []) => {
    // if (suite.transformerTestType === "transformerTest") {
    //   result.push([...path, suite.transformerTestLabel]);
    // } else
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
// export const transformerTests: Record<string, TransformerTestSuite | Record<string, TransformerTestSuite>> = {
export const transformerTests: TransformerTestSuite = {
  // "resolve basic transformer constantUuid": {
  // "resolve_basic_transformer_constantUuid":
  // {
  transformerTestType: "transformerTestSuite",
  transformerTestLabel: "transformers",
  transformerTests: {
    "constants": {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "constants",
      transformerTests: {
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
                constantUuidValue: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
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
                referenceName: "nonExistentReference",
              },
              transformerParams: {},
              ignoreAttributes: [
                "applicationSection",
                "deploymentUuid",
                "entityUuid",
                "instanceUuid",
                "errorStack",
                "innerError",
                "queryParameters",
                "query",
              ],
              expectedValue: {
                queryFailure: "ReferenceNotFound",
                failureOrigin: ["transformer_InnerReference_resolve"],
                queryReference: "nonExistentReference",
                failureMessage: "no referenceName nonExistentReference",
                queryContext: "[]",
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
                constantStringValue: "test",
              },
              transformerParams: {},
              expectedValue: "test",
            },
          },
        },
      }
    },
    "references": {
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
                referenceName: "a",
              },
              transformerParams: {
                a: "test"
              },
              expectedValue: "test",
            },
            "should fail when parameter reference is not found": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "should fail when parameter reference is not found",
              transformerName: "parameterReference",
              transformer: {
                transformerType: "parameterReference",
                referenceName: "nonExistentReference",
              },
              transformerParams: {},
              ignoreAttributes: [
                "applicationSection",
                "deploymentUuid",
                "entityUuid",
                "instanceUuid",
                "errorStack",
                "innerError",
                "queryParameters",
                "query",
              ],
              expectedValue: {
                queryFailure: "ReferenceNotFound",
                failureOrigin: ["transformer_InnerReference_resolve"],
                queryReference: "nonExistentReference",
                failureMessage: "no referenceName nonExistentReference",
                queryContext: "[]",
              },
            },
          },
        },
        contextReference: {
          transformerTestType: "transformerTestSuite",
          transformerTestLabel: "contextReference",
          transformerTests: {
            "resolve basic transformer contextReference": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "resolve basic transformer constantString",
              transformerName: "contextReference",
              transformer: {
                transformerType: "contextReference",
                referenceName: "a",
              },
              transformerParams: {},
              transformerRuntimeContext: {
                a: "test",
              },
              expectedValue: "test",
            },
            "should fail when context reference is not found": {
              transformerTestType: "transformerTest",
              transformerTestLabel: "should fail when context reference is not found",
              transformerName: "contextReference",
              transformer: {
                transformerType: "contextReference",
                referenceName: "nonExistentReference",
              },
              transformerParams: {},
              ignoreAttributes: [
                "applicationSection",
                "deploymentUuid",
                "entityUuid",
                "instanceUuid",
                "errorStack",
                "innerError",
                "queryParameters",
                "query",
              ],
              expectedValue: {
                queryFailure: "ReferenceNotFound",
                failureOrigin: ["transformer_InnerReference_resolve"],
                queryReference: "nonExistentReference",
                failureMessage: "no referenceName nonExistentReference",
                queryContext: "[]",
              },
            },
          },
        },
      }
    }
  },
};

const globalTimeOut = 30000;

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
    }
    TestSuiteContext.resetResults();
  }
}
