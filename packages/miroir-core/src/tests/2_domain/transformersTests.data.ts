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
      // expectedValue: {
      //   elementType: "instanceUuid",
      //   elementValue: "xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      // },
    },
//     "resolve basic transformer constantString": {
//       transformerTestType: "transformerTest",
//       transformerTestLabel: "resolve basic transformer constantString",
//       transformerName: "constantString",
//       transformer: {
//         transformerType: "constantString",
//         constantStringValue: "test",
//       },
//       transformerParams: {},
//       expectedValue: {
//         elementType: "string",
//         elementValue: "test",
//       },
//     },
  },
};

const globalTimeOut = 30000;

// ################################################################################################
export async function runTransformerTestSuite(
  transformerTestSuite: TransformerTestSuite,
  runTransformerTest: (transformerTest: TransformerTest) => Promise<void>
) {
  if (transformerTestSuite.transformerTestType === "transformerTest") {
    await runTransformerTest(transformerTestSuite);
  } else {
    it.each(Object.entries(transformerTestSuite.transformerTests))(
      "test %s",
      async (currentTestSuiteName, transformerTestParam: TransformerTestSuite) => {
        await runTransformerTestSuite(transformerTestParam, runTransformerTest);
      },
      globalTimeOut
    );
  }
}
