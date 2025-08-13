// import * as vitest from 'vitest';
// import { describe, expect, it } from "vitest";
import {
  describe,
  expect,
} from "../../src/1_core/test-expect";

import {
  JzodElement,
  JzodSchema,
  type TransformerTestSuite,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  miroirFundamentalJzodSchema,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";

import {
  getDefaultValueForJzodSchemaWithResolution,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
} from "../../src/1_core/jzod/getDefaultValueForJzodSchema";

// import entityDefinitionTransformerTest from "../../assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/405bb1fc-a20f-4def-9d3a-206f72350633.json";
import entityDefinitionTransformerTest from "../../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/405bb1fc-a20f-4def-9d3a-206f72350633.json";
import transformerTestSuite_defaultValueForMLSchema from "../../src/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/753afec9-f786-4f51-8c46-bd022551a8dd.json";
import {
  runTransformerTestInMemory,
  runTransformerTestSuite,
  transformerTestsDisplayResults,
} from "../../src/4_services/TestTools";


const RUN_TEST= process.env.RUN_TEST
console.log("@@@@@@@@@@@@@@@@@@ RUN_TEST", RUN_TEST);

afterAll(async () => {
  if (RUN_TEST) {
    transformerTestsDisplayResults(
      transformerTestSuite_defaultValueForMLSchema.definition as TransformerTestSuite,
      RUN_TEST,
      transformerTestSuite_defaultValueForMLSchema.definition.transformerTestLabel
    );
  }
});

// ################################################################################################
// const testSuiteName = "transformers.unit.test";
if (RUN_TEST == transformerTestSuite_defaultValueForMLSchema.definition.transformerTestLabel) {
  await runTransformerTestSuite(
    {describe, expect, custom: true},// vitest,
    [],
    transformerTestSuite_defaultValueForMLSchema.definition as TransformerTestSuite,
    runTransformerTestInMemory
  );
  transformerTestsDisplayResults(
    transformerTestSuite_defaultValueForMLSchema.definition as TransformerTestSuite,
    RUN_TEST,
    transformerTestSuite_defaultValueForMLSchema.definition.transformerTestLabel
  );
} else {
  console.log("################################ skipping test suite:", transformerTestSuite_defaultValueForMLSchema.definition.transformerTestLabel);
}


// // ################################################################################################
// function testResolve(
//   testId: string,
//   testSchema: JzodElement,
//   expectedResult: JzodElement,
// ){
//   console.log("######################################### running test", testId, "...")
//   // const testResult = getDefaultValueForJzodSchemaWithResolution(
//   const testResult = getDefaultValueForJzodSchemaWithResolutionNonHook(
//     testSchema,
//     undefined, // rootObject,
//     "", // rootLessListKey
//     undefined, // currentDefaultValue,
//     undefined, // currentValuePath,
//     undefined, // deploymentEntityState,
//     false, // forceOptional,
//     undefined, // deploymentUuid,
//     miroirFundamentalJzodSchema as JzodSchema, // miroirFundamentalJzodSchema,
//       // currentValuePath: string[] = [],
//       // deploymentEntityState: ReduxDeploymentsState | undefined = undefined,
//       // forceOptional: boolean = false,
//       // deploymentUuid: Uuid | undefined,
//       // miroirFundamentalJzodSchema: JzodSchema,
//       // currentModel?: MetaModel,
//       // miroirMetaModel?: MetaModel,
//       // relativeReferenceJzodContext?: { [k: string]: JzodElement },
//       // rootObject?: any,
//   );
//   console.log("#########################################", testId, "testResult:", JSON.stringify(testResult, null, 2));
//   expect(testResult).toEqual(expectedResult);
// }

// interface testFormat {
//   testSchema: JzodElement,
//   expectedResult: any,
// }

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// describe(
//   'defaultValueForJzodSchema',
//   () => {

//     // ###########################################################################################
//     it(
//       'miroir entity definition object format',
//       () => {

//         const tests: { [k: string]: testFormat } = {
//           // plain literal!
//           test010: {
//             testSchema: {
//               type: "literal",
//               definition: "myLiteral",
//             },
//             expectedResult: "myLiteral"
//           },
//           // // number
//           // test020: {
//           //   testSchema: {
//           //     type: "number",
//           //   },
//           //   expectedResult: 0,
//           // },
//           // // simpleType
//           // test030: {
//           //   testSchema: {
//           //     type: "string",
//           //   },
//           //   expectedResult: "",
//           // },
//           // // object with attributes
//           // test040: {
//           //   testSchema: {
//           //     type: "object",
//           //     definition: {
//           //       a: { type: "string" },
//           //       b: { type: "number" },
//           //     }
//           //   },
//           //   expectedResult: {
//           //     a: "",
//           //     b: 0,
//           //   },
//           // },
//           // // object with optional attributes
//           // test050: {
//           //   testSchema: {
//           //     type: "object",
//           //     definition: {
//           //       a: { type: "string" },
//           //       b: { type: "number", optional: true },
//           //     }
//           //   },
//           //   expectedResult: {
//           //     a: "",
//           //   },
//           // },
//           // //object with nested object
//           // test060: {
//           //   testSchema: {
//           //     type: "object",
//           //     definition: {
//           //       a: { type: "string" },
//           //       b: {
//           //         type: "object",
//           //         definition: {
//           //           c: { type: "number" },
//           //         }
//           //       },
//           //     }
//           //   },
//           //   expectedResult: {
//           //     a: "",
//           //     b: {
//           //       c: 0,
//           //     },
//           //   },
//           // },
//           // // array
//           // test070: {
//           //   testSchema: {
//           //     type: "array",
//           //     definition: { type: "string" },
//           //   },
//           //   expectedResult: [],
//           // },
//           // // ######################################################################################
//           // // Transformer Test
//           // test500: {
//           //   testSchema: entityDefinitionTransformerTest.jzodSchema as JzodElement,
//           //   expectedResult: {
//           //     uuid: "",
//           //     parentUuid: "",
//           //     selfApplication: "2cbb3608-c768-4602-84ac-e842fe6a4077",
//           //     branch: "fbb0a489-76fa-44cb-84d4-813ba7d53dae",
//           //     definition: {
//           //       transformerTestType: "transformerTest",
//           //       transformerTestLabel: "",
//           //       transformerName: "",
//           //       transformerParams: {},
//           //     },
//           //   },
//           // },
//         };

//         for (const test of Object.entries(tests)) {
//           testResolve(test[0], test[1].testSchema, test[1].expectedResult)
//         }
//       }
//     )
//   }
// )
