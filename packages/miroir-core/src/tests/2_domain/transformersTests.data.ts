import { TransformerForBuild } from "../../../dist/index.js";

// ################################################################################################
// export interface TransformerTestParams {
// export class TransformerTestParams {
export type TransformerTest = {
  transformerTestType: "transformerTest";
  transformerTestLabel: string;
  // deploymentUuid: Uuid;
  transformerName: string;
  transformer: TransformerForBuild;
  transformerParams: any;
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

// export const transformerTests: Record<string, TransformerTestSuite | Record<string, TransformerTestSuite>> = {
export const transformerTests: TransformerTestSuite = {
  // "resolve basic transformer constantUuid": {
  // "resolve_basic_transformer_constantUuid":
  // {
  transformerTestType: "transformerTestSuite",
  transformerTestLabel: "constants",
  transformerTests: {
    constantUuid: {
      transformerTestType: "transformerTestSuite",
      transformerTestLabel: "constantUuid",
      transformerTests: {
        // "resolve basic transformer constantUuid": {
        //   transformerTestType: "transformerTest",
        //   transformerTestLabel: "resolve basic transformer constantUuid",
        //   transformerName: "constantUuid",
        //   transformer: {
        //     transformerType: "constantUuid",
        //     constantUuidValue: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        //   },
        //   transformerParams: {},
        //   expectedValue: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        // },
        "should fail when context reference is not found": {
          transformerTestType: "transformerTest",
          transformerTestLabel: "should fail when context reference is not found",
          transformerName: "constantUuid",
          transformer: {
            transformerType: "contextReference",
            referenceName: "nonExistentReference",
          },
          transformerParams: {},
          ignoreAttributes: ["failureOrigin", "queryContext"],
          expectedValue: {
            elementValue: {
              queryFailure: "ReferenceNotFound",
              failureOrigin: ["transformer_InnerReference_resolve"],
              queryReference: "nonExistentReference",
              failureMessage: "no referenceName nonExistentReference",
              queryContext: "[]",
            },
          },
        },
      },
    },
    // "resolve basic transformer constantString": {
    //   transformerTestType: "transformerTest",
    //   transformerTestLabel: "resolve basic transformer constantString",
    //   transformerName: "constantString",
    //   transformer: {
    //     transformerType: "constantString",
    //     constantStringValue: "test",
    //   },
    //   transformerParams: {},
    //   expectedValue: "test",
    // },
  },
};

const globalTimeOut = 30000;

// ################################################################################################
export async function runTransformerTestSuite(
  vitest: any,
  testSuiteName: string,
  transformerTestSuite: TransformerTestSuite,
  runTransformerTest: (vitest: any, testSuiteName: string, transformerTest: TransformerTest) => Promise<void>
) {
  console.log(`running transformer test suite called ${testSuiteName} transformerTestType=${transformerTestSuite.transformerTestType}`);
  if (transformerTestSuite.transformerTestType == "transformerTest") {
    await runTransformerTest(vitest, testSuiteName, transformerTestSuite);
  } else {
    // console.log(`running transformer test suite ${testSuiteName} with ${JSON.stringify(Object.keys(transformerTestSuite.transformerTests))} tests`);
    console.log(`handling transformer test suite ${testSuiteName} with transformerTests=${JSON.stringify(Object.values(transformerTestSuite.transformerTests), null, 2)} tests`);
    // describe.each(
    //   Object.entries(transformerTestSuite.transformerTests).map((o: [string, TransformerTestSuite]) => ({
    //     [o[0]]: o[1],
    //   }))
    // )(
    await vitest.describe.each(Object.values(transformerTestSuite.transformerTests))(
        // it.each(Object.entries(transformerTestSuite.transformerTests))(
      "test $currentTestSuiteName",
      async (transformerTestParam: TransformerTestSuite) => {
        // async (transformerTestParam: TransformerTestSuite) => {
        console.log(`calling inner transformer test suite of ${testSuiteName} called ${transformerTestParam.transformerTestLabel}`);
        await runTransformerTestSuite(vitest,`${testSuiteName} > ${transformerTestParam.transformerTestLabel}`, transformerTestParam, runTransformerTest);
      },
      globalTimeOut
    );
    console.log(`finished running transformer subtests for test suite ${testSuiteName}`);
  }
  console.log(`finished running transformer test suite ${testSuiteName}`);
}
